export type Service = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  duration: string;
  price: string;
  sortOrder: number;
  createdAt: string;
};

export type Frame = {
  id: string;
  name: string;
  brand: string;
  material: string;
  shape: string;
  colour: string;
  price: number;
  imageUrl: string;
  inStock: boolean;
  sortOrder: number;
  createdAt: string;
};

export type Appointment = {
  id: string;
  patientName: string;
  phone: string;
  email: string;
  service: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
};

export type EyeSide = { sph: string; cyl: string; axis: string };

export type Prescription = {
  id: string;
  patientName: string;
  phone: string;
  age: number | null;
  gender: string;
  right: EyeSide;
  left: EyeSide;
  addPower: string;
  pd: string;
  lensAdvice: string;
  frameAdvice: string;
  diagnosis: string[];
  notes: string;
  followUpDate: string;
  fileName: string;
  fileType: string;
  fileDataBase64?: string;
  createdAt: string;
  updatedAt: string;
};

export type ContactMessage = {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  read: boolean;
  createdAt: string;
};
