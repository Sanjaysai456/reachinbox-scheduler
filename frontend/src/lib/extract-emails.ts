import Papa from "papaparse";

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

export const extractEmailsFromFile = async (file: File) => {
  const text = await file.text();
  const matches = new Set<string>();
  const directMatches = text.match(EMAIL_PATTERN) ?? [];

  for (const email of directMatches) {
    matches.add(email.toLowerCase());
  }

  if (file.name.endsWith(".csv")) {
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    });

    for (const row of parsed.data) {
      Object.values(row).forEach((value) => {
        if (!value) {
          return;
        }

        const rowMatches = value.match(EMAIL_PATTERN) ?? [];
        rowMatches.forEach((email) => matches.add(email.toLowerCase()));
      });
    }
  }

  return [...matches];
};
