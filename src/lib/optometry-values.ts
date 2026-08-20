function range(from: number, to: number, step: number, format: (n: number) => string) {
  const values: string[] = [];
  for (let n = from; n <= to + 1e-9; n += step) {
    values.push(format(n));
  }
  return values;
}

const signed = (n: number) => (n > 0 ? `+${n.toFixed(2)}` : n.toFixed(2));

/** Standard spherical/cylindrical power steps, -20.00 to +20.00 D in 0.25 D increments. */
export const POWER_VALUES = range(-20, 20, 0.25, signed);

/** Axis in degrees, 0-180 in 5° steps — the standard clinical rounding for quick entry. */
export const AXIS_VALUES = range(0, 180, 5, (n) => String(n));

/** Near-addition power, +0.75 to +3.50 D in 0.25 D steps. */
export const ADD_VALUES = range(0.75, 3.5, 0.25, signed);

/** Pupillary distance in mm, common adult/child range. */
export const PD_VALUES = range(46, 80, 1, (n) => String(n));

export const DIAGNOSIS_OPTIONS = [
  "Myopia",
  "Hyperopia",
  "Astigmatism",
  "Presbyopia",
  "Amblyopia",
  "Strabismus",
  "Dry Eye",
  "Conjunctivitis",
  "Cataract",
  "Glaucoma",
  "Diabetic Retinopathy",
  "Computer Vision Syndrome",
];

export const LENS_ADVICE_OPTIONS = [
  "Single Vision",
  "Bifocal",
  "Progressive",
  "Blue-Cut Coating",
  "Anti-Reflective Coating",
  "Photochromic",
  "High Index",
  "Polycarbonate",
  "Scratch-Resistant Coating",
];

export const FRAME_ADVICE_OPTIONS = [
  "Full-Rim",
  "Half-Rim",
  "Rimless",
  "Lightweight Titanium",
  "Flexible TR90",
  "Anti-Slip Nose Pads",
  "Kids-Safe Frame",
];
