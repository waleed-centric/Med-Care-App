// utils/formatDate.ts
export function formatPreferredDate(
    input: string | null | undefined,
    separator: "/" | "-" = "/",
    useUTC = false
  ): string | null {
    if (!input) return null;
    const s = input.trim();
  
    // Already dd/mm/yyyy or dd-mm-yyyy -> normalize separator
    const ddmmyyyy = /^(\d{2})[\/-](\d{2})[\/-](\d{4})$/;
    const ymdDateOnly = /^(\d{4})-(\d{2})-(\d{2})$/; // yyyy-mm-dd
    const isoDatetime = /^\d{4}-\d{2}-\d{2}T/; // ISO with time part
  
    // If input already dd/mm/yyyy or dd-mm-yyyy
    const m1 = s.match(ddmmyyyy);
    if (m1) {
      return [m1[1], m1[2], m1[3]].join(separator);
    }
  
    // If input is yyyy-mm-dd (date-only) -> convert
    const m2 = s.match(ymdDateOnly);
    if (m2) {
      const [, yyyy, mm, dd] = m2;
      return [dd, mm, yyyy].join(separator);
    }
  
    // If ISO datetime or other parseable string
    if (isoDatetime || /\d/.test(s)) {
      const d = new Date(s);
      if (isNaN(d.getTime())) {
        // fallback attempt: try replacing '-' with '/' (some browsers parse better)
        const alt = new Date(s.replace(/-/g, "/"));
        if (isNaN(alt.getTime())) return null;
        return formatFromDate(alt, separator, useUTC);
      }
      return formatFromDate(d, separator, useUTC);
    }
  
    return null;
  }
  
  function formatFromDate(d: Date, separator: "/" | "-" = "/", useUTC = false) {
    const dd = useUTC ? d.getUTCDate() : d.getDate();
    const mm = useUTC ? d.getUTCMonth() + 1 : d.getMonth() + 1;
    const yyyy = useUTC ? d.getUTCFullYear() : d.getFullYear();
  
    return `${String(dd).padStart(2, "0")}${separator}${String(mm).padStart(2, "0")}${separator}${yyyy}`;
  }
  