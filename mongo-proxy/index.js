import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { getCollection, toPublic } from "./db.js";
import { makeCatalogRouter, str, num, bool } from "./catalog-router.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "12mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

// Everything below this line requires the shared secret the main app sends.
// The proxy is only ever called server-side by the TanStack Start app, never
// directly by a browser, so a single static secret header is the whole
// authorization model.
app.use((req, res, next) => {
  const secret = process.env.PROXY_SECRET;
  if (!secret) return res.status(500).json({ error: "PROXY_SECRET is not configured" });
  if (req.get("x-proxy-secret") !== secret) return res.status(401).json({ error: "Unauthorized" });
  next();
});

const MAX_FILE_BASE64_CHARS = 11_000_000; // ~8MB original file, base64-inflated

// ---- Doctor login -----------------------------------------------------
app.post("/doctors/login", async (req, res) => {
  const email = str(req.body?.email).toLowerCase();
  const password = str(req.body?.password);
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  const doctors = await getCollection("doctors");
  const doctor = await doctors.findOne({ email });
  if (!doctor) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, doctor.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  res.json({ id: doctor._id.toString(), email: doctor.email, name: doctor.name ?? "Doctor" });
});

// ---- Catalogs: services & frames --------------------------------------
app.use(
  "/services",
  makeCatalogRouter("services", (body) => ({
    name: str(body?.name),
    tagline: str(body?.tagline),
    description: str(body?.description),
    duration: str(body?.duration),
    price: str(body?.price),
  })),
);

app.use(
  "/frames",
  makeCatalogRouter("frames", (body) => ({
    name: str(body?.name),
    brand: str(body?.brand),
    material: str(body?.material),
    shape: str(body?.shape),
    colour: str(body?.colour),
    price: num(body?.price),
    imageUrl: str(body?.imageUrl),
    inStock: bool(body?.inStock, true),
  })),
);

// ---- Appointments -------------------------------------------------------
app.get("/appointments", async (_req, res) => {
  const col = await getCollection("appointments");
  const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
  res.json(docs.map(toPublic));
});

app.post("/appointments", async (req, res) => {
  const patientName = str(req.body?.patientName);
  const phone = str(req.body?.phone);
  if (!patientName || !phone) return res.status(400).json({ error: "Name and phone required" });

  const doc = {
    patientName,
    phone,
    email: str(req.body?.email),
    service: str(req.body?.service),
    preferredDate: str(req.body?.preferredDate),
    preferredTime: str(req.body?.preferredTime),
    notes: str(req.body?.notes),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  const col = await getCollection("appointments");
  const { insertedId } = await col.insertOne(doc);
  res.status(201).json(toPublic({ ...doc, _id: insertedId }));
});

app.patch("/appointments/:id", async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: "Invalid id" });
  const update = {};
  if (typeof req.body?.status === "string") update.status = req.body.status;
  if (typeof req.body?.notes === "string") update.notes = req.body.notes;
  const col = await getCollection("appointments");
  const result = await col.findOneAndUpdate(
    { _id: new ObjectId(req.params.id) },
    { $set: update },
    { returnDocument: "after" },
  );
  if (!result) return res.status(404).json({ error: "Not found" });
  res.json(toPublic(result));
});

app.delete("/appointments/:id", async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: "Invalid id" });
  const col = await getCollection("appointments");
  const { deletedCount } = await col.deleteOne({ _id: new ObjectId(req.params.id) });
  if (!deletedCount) return res.status(404).json({ error: "Not found" });
  res.status(204).end();
});

// ---- Prescriptions -------------------------------------------------------
function sanitizePrescription(body) {
  return {
    patientName: str(body?.patientName),
    phone: str(body?.phone),
    age: body?.age ? num(body.age) : null,
    gender: str(body?.gender),
    right: {
      sph: str(body?.right?.sph),
      cyl: str(body?.right?.cyl),
      axis: str(body?.right?.axis),
    },
    left: {
      sph: str(body?.left?.sph),
      cyl: str(body?.left?.cyl),
      axis: str(body?.left?.axis),
    },
    addPower: str(body?.addPower),
    pd: str(body?.pd),
    lensAdvice: str(body?.lensAdvice),
    frameAdvice: str(body?.frameAdvice),
    diagnosis: Array.isArray(body?.diagnosis)
      ? body.diagnosis.map((d) => str(d)).filter(Boolean)
      : [],
    notes: str(body?.notes),
    followUpDate: str(body?.followUpDate),
    fileName: str(body?.fileName),
    fileType: str(body?.fileType),
    fileDataBase64: str(body?.fileDataBase64),
  };
}

app.get("/prescriptions", async (req, res) => {
  const q = str(req.query?.q);
  const col = await getCollection("prescriptions");
  const filter = q
    ? {
        $or: [
          { patientName: { $regex: q, $options: "i" } },
          { phone: { $regex: q, $options: "i" } },
        ],
      }
    : {};
  const docs = await col
    .find(filter, { projection: { fileDataBase64: 0 } })
    .sort({ createdAt: -1 })
    .toArray();
  res.json(docs.map(toPublic));
});

app.get("/prescriptions/:id", async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: "Invalid id" });
  const col = await getCollection("prescriptions");
  const doc = await col.findOne({ _id: new ObjectId(req.params.id) });
  if (!doc) return res.status(404).json({ error: "Not found" });
  res.json(toPublic(doc));
});

app.post("/prescriptions", async (req, res) => {
  const patientName = str(req.body?.patientName);
  if (!patientName) return res.status(400).json({ error: "Patient name required" });
  if ((req.body?.fileDataBase64?.length ?? 0) > MAX_FILE_BASE64_CHARS) {
    return res.status(413).json({ error: "File too large" });
  }
  const doc = {
    ...sanitizePrescription(req.body),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const col = await getCollection("prescriptions");
  const { insertedId } = await col.insertOne(doc);
  res.status(201).json(toPublic({ ...doc, _id: insertedId }));
});

app.put("/prescriptions/:id", async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: "Invalid id" });
  if ((req.body?.fileDataBase64?.length ?? 0) > MAX_FILE_BASE64_CHARS) {
    return res.status(413).json({ error: "File too large" });
  }
  const update = { ...sanitizePrescription(req.body), updatedAt: new Date().toISOString() };
  const col = await getCollection("prescriptions");
  const result = await col.findOneAndUpdate(
    { _id: new ObjectId(req.params.id) },
    { $set: update },
    { returnDocument: "after" },
  );
  if (!result) return res.status(404).json({ error: "Not found" });
  res.json(toPublic(result));
});

app.delete("/prescriptions/:id", async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: "Invalid id" });
  const col = await getCollection("prescriptions");
  const { deletedCount } = await col.deleteOne({ _id: new ObjectId(req.params.id) });
  if (!deletedCount) return res.status(404).json({ error: "Not found" });
  res.status(204).end();
});

// ---- Contact messages ----------------------------------------------------
app.get("/messages", async (_req, res) => {
  const col = await getCollection("messages");
  const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
  res.json(docs.map(toPublic));
});

app.post("/messages", async (req, res) => {
  const name = str(req.body?.name);
  const message = str(req.body?.message);
  if (!name || !message) return res.status(400).json({ error: "Name and message required" });
  const doc = {
    name,
    phone: str(req.body?.phone),
    email: str(req.body?.email),
    message,
    read: false,
    createdAt: new Date().toISOString(),
  };
  const col = await getCollection("messages");
  const { insertedId } = await col.insertOne(doc);
  res.status(201).json(toPublic({ ...doc, _id: insertedId }));
});

app.patch("/messages/:id", async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: "Invalid id" });
  const update = {};
  if (typeof req.body?.read === "boolean") update.read = req.body.read;
  const col = await getCollection("messages");
  const result = await col.findOneAndUpdate(
    { _id: new ObjectId(req.params.id) },
    { $set: update },
    { returnDocument: "after" },
  );
  if (!result) return res.status(404).json({ error: "Not found" });
  res.json(toPublic(result));
});

app.delete("/messages/:id", async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: "Invalid id" });
  const col = await getCollection("messages");
  const { deletedCount } = await col.deleteOne({ _id: new ObjectId(req.params.id) });
  if (!deletedCount) return res.status(404).json({ error: "Not found" });
  res.status(204).end();
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal error" });
});

const port = process.env.PORT || 8787;
app.listen(port, () => console.log(`mongo-proxy listening on :${port}`));
