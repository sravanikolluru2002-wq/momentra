export function normalizeIndianPhoneNumber(value?: string | null) {
  const digits = (value ?? "").replace(/\D/g, "");

  if (!digits) return "";

  if (digits.length === 10) return `+91${digits}`;

  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }

  if (digits.length > 10) {
    return `+${digits}`;
  }

  return `+91${digits}`;
}
