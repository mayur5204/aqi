export interface AqiBand {
  key: string;
  lo: number;
  hi: number;
  color: string;
  bg: string;
  text: string;
  label: string;
}

export const AQI_BANDS: AqiBand[] = [
  { key: "good", lo: 0, hi: 50, color: "#1D9E75", bg: "#E1F5EE", text: "#085041", label: "Good" },
  { key: "satisfactory", lo: 51, hi: 100, color: "#639922", bg: "#EAF3DE", text: "#27500A", label: "Satisfactory" },
  { key: "moderate", lo: 101, hi: 200, color: "#BA7517", bg: "#FAEEDA", text: "#633806", label: "Moderate" },
  { key: "poor", lo: 201, hi: 300, color: "#D85A30", bg: "#FAECE7", text: "#712B13", label: "Poor" },
  { key: "very_poor", lo: 301, hi: 400, color: "#A32D2D", bg: "#FCEBEB", text: "#501313", label: "Very Poor" },
  { key: "severe", lo: 401, hi: 500, color: "#534AB7", bg: "#EEEDFE", text: "#26215C", label: "Severe" },
];

export const getAqiBand = (aqi: number): AqiBand => {
  for (const band of AQI_BANDS) {
    if (aqi >= band.lo && aqi <= band.hi) {
      return band;
    }
  }
  // Fallback for > 500
  return AQI_BANDS[5];
};
