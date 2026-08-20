import { Router } from "express";
import { ObjectId } from "mongodb";
import { getCollection, toPublic } from "./db.js";

// Shared CRUD shape for the two simple public catalogs (services, frames):
// list sorted by sortOrder, create/update/delete by id, no other special behaviour.
export function makeCatalogRouter(collectionName, sanitize) {
  const router = Router();

  router.get("/", async (_req, res) => {
    const col = await getCollection(collectionName);
    const docs = await col.find({}).sort({ sortOrder: 1, createdAt: 1 }).toArray();
    res.json(docs.map(toPublic));
  });

  router.post("/", async (req, res) => {
    const col = await getCollection(collectionName);
    const count = await col.countDocuments({});
    const doc = {
      ...sanitize(req.body),
      sortOrder: Number.isFinite(req.body?.sortOrder) ? req.body.sortOrder : count,
      createdAt: new Date().toISOString(),
    };
    const { insertedId } = await col.insertOne(doc);
    res.status(201).json(toPublic({ ...doc, _id: insertedId }));
  });

  router.put("/:id", async (req, res) => {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: "Invalid id" });
    const col = await getCollection(collectionName);
    const update = sanitize(req.body);
    if (Number.isFinite(req.body?.sortOrder)) update.sortOrder = req.body.sortOrder;
    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: update },
      { returnDocument: "after" },
    );
    if (!result) return res.status(404).json({ error: "Not found" });
    res.json(toPublic(result));
  });

  router.delete("/:id", async (req, res) => {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: "Invalid id" });
    const col = await getCollection(collectionName);
    const { deletedCount } = await col.deleteOne({ _id: new ObjectId(req.params.id) });
    if (!deletedCount) return res.status(404).json({ error: "Not found" });
    res.status(204).end();
  });

  return router;
}

export const str = (v, fallback = "") => (typeof v === "string" ? v.trim() : fallback);
export const num = (v, fallback = 0) => (Number.isFinite(Number(v)) ? Number(v) : fallback);
export const bool = (v, fallback = false) => (typeof v === "boolean" ? v : fallback);
