import bcrypt from "bcryptjs";
import { getCollection } from "./db.js";

const DOCTOR_EMAIL = (process.env.SEED_DOCTOR_EMAIL || "doctor@mishaeyecare.in").toLowerCase();
const DOCTOR_PASSWORD = process.env.SEED_DOCTOR_PASSWORD;
const DOCTOR_NAME = process.env.SEED_DOCTOR_NAME || "Dr. Misha";

const services = [
  {
    name: "Comprehensive Eye Examination",
    tagline: "Complete vision and eye health check",
    description:
      "Digital refraction, visual acuity, colour vision and slit-lamp examination performed by our optometrist.",
    duration: "30 min",
    price: "₹300",
  },
  {
    name: "Computerised Eye Testing",
    tagline: "Auto-refraction with digital accuracy",
    description: "Automated refraction and keratometry for a precise, repeatable spectacle number.",
    duration: "15 min",
    price: "₹200",
  },
  {
    name: "Contact Lens Fitting",
    tagline: "Comfort-first lens trial and training",
    description:
      "Corneal measurement, trial lenses and hygiene training for soft, toric and multifocal lenses.",
    duration: "40 min",
    price: "₹700",
  },
  {
    name: "Child Vision Screening",
    tagline: "Gentle testing for young eyes",
    description:
      "Play-based screening for squint, lazy eye and early myopia, with a parent counselling session.",
    duration: "25 min",
    price: "₹250",
  },
  {
    name: "Diabetic Retina Check",
    tagline: "Retina screening for diabetic patients",
    description: "Dilated fundus evaluation and retinal imaging to catch diabetic changes early.",
    duration: "35 min",
    price: "₹800",
  },
  {
    name: "Spectacle Dispensing & Fitting",
    tagline: "Frame styling and lens guidance",
    description: "Frame selection by face shape, accurate PD measurement and fitting adjustments.",
    duration: "20 min",
    price: "Free with Rx",
  },
];

const frames = [
  {
    name: "Rania Full Rim",
    brand: "Misha Signature",
    material: "Acetate",
    shape: "Cat-eye",
    colour: "Tortoise",
    price: 2490,
    inStock: true,
  },
  {
    name: "Kartar Titanium",
    brand: "Misha Signature",
    material: "Titanium",
    shape: "Rectangle",
    colour: "Gunmetal",
    price: 3990,
    inStock: true,
  },
  {
    name: "Noor Rimless",
    brand: "Optiline",
    material: "Titanium rimless",
    shape: "Oval",
    colour: "Rose gold",
    price: 4590,
    inStock: true,
  },
  {
    name: "Jalandhar Classic",
    brand: "Misha Heritage",
    material: "Metal",
    shape: "Round",
    colour: "Antique gold",
    price: 1990,
    inStock: true,
  },
  {
    name: "Simar Kids Flex",
    brand: "FlexKid",
    material: "TR90",
    shape: "Round",
    colour: "Sky blue",
    price: 1290,
    inStock: true,
  },
  {
    name: "Aman Blue-Cut",
    brand: "Misha Signature",
    material: "Acetate",
    shape: "Square",
    colour: "Matte black",
    price: 2190,
    inStock: true,
  },
  {
    name: "Preet Aviator Sun",
    brand: "SunEdge",
    material: "Metal",
    shape: "Aviator",
    colour: "Brown gradient",
    price: 2890,
    inStock: true,
  },
  {
    name: "Gurleen Slim",
    brand: "Optiline",
    material: "Stainless steel",
    shape: "Cat-eye",
    colour: "Champagne",
    price: 3290,
    inStock: true,
  },
];

async function seed() {
  if (!DOCTOR_PASSWORD) {
    console.error("Set SEED_DOCTOR_PASSWORD before running the seed script.");
    process.exit(1);
  }

  const doctors = await getCollection("doctors");
  const existing = await doctors.findOne({ email: DOCTOR_EMAIL });
  if (existing) {
    console.log(`Doctor account already exists for ${DOCTOR_EMAIL}, leaving it as-is.`);
  } else {
    const passwordHash = await bcrypt.hash(DOCTOR_PASSWORD, 10);
    await doctors.insertOne({
      email: DOCTOR_EMAIL,
      passwordHash,
      name: DOCTOR_NAME,
      createdAt: new Date().toISOString(),
    });
    console.log(`Created doctor account for ${DOCTOR_EMAIL}.`);
  }

  const servicesCol = await getCollection("services");
  if ((await servicesCol.countDocuments({})) === 0) {
    await servicesCol.insertMany(
      services.map((s, i) => ({ ...s, sortOrder: i, createdAt: new Date().toISOString() })),
    );
    console.log(`Seeded ${services.length} services.`);
  } else {
    console.log("Services already has data, skipping.");
  }

  const framesCol = await getCollection("frames");
  if ((await framesCol.countDocuments({})) === 0) {
    await framesCol.insertMany(
      frames.map((f, i) => ({
        ...f,
        imageUrl: "",
        sortOrder: i,
        createdAt: new Date().toISOString(),
      })),
    );
    console.log(`Seeded ${frames.length} frames.`);
  } else {
    console.log("Frames already has data, skipping.");
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
