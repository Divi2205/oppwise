// Scam red-flag checker. Transparent rules: every flag carries a human-readable reason,
// so students see exactly why something was flagged instead of trusting a black box.

const RULES = [
  { id: "fee", severity: "high", reason: "Asks for a registration or joining fee",
    test: (t) => {
      const payAmount = /\bpay\s*(?:just|only)?\s*(?:₹|rs\.?|inr)\s?\d+/i.test(t)
        || /(?:₹|rs\.?|inr)\s?\d+[^\n]{0,30}\b(to register|to apply|for registration|to confirm (?:your )?seat)\b/i.test(t);
      const feeWord = /\b(registration|processing|security|training|joining|enrol?l?ment|application|kit)\s*(fee|fees|charges?|amount|deposit)\b/i.test(t);
      const negated = /\b(no|zero|nil|without)\s+(any\s+)?(registration\s+|entry\s+|joining\s+|application\s+)?(fee|fees|charges?)\b|\bfree (registration|of cost|entry)\b/i.test(t);
      return payAmount || (feeWord && !negated);
    } },
  { id: "guaranteed", severity: "high", reason: "Promises guaranteed placement, job or selection",
    test: (t) => /\b(100\s*%|guaranteed?|assured)\s*(job|placement|selection|internship|offer|ppo)\b/i.test(t)
      || /\b(job|placement|selection)\s*(is\s*)?(guaranteed|assured)\b/i.test(t) },
  { id: "easy-money", severity: "high", reason: "Unrealistic earnings promise",
    test: (t) => /\bearn\s*(up to\s*)?(₹|rs\.?|inr)?\s?\d[\d,]*\s*(per|\/|a)\s*(day|hour|week)\b/i.test(t) || /\bno interview\b.*\b(stipend|salary|earn)\b/i.test(t) },
  { id: "personal-email", severity: "medium", reason: "Company contact uses a personal email address",
    test: (t) => /\b[\w.+-]*(hr|jobs?|career|careers|recruit\w*|hiring|intern\w*|placement)[\w.+-]*@(gmail|yahoo|outlook|hotmail|rediffmail|ymail)\.com\b/i.test(t) },
  { id: "chat-only", severity: "medium", reason: "Asks you to apply only through WhatsApp or Telegram DMs",
    test: (t) => /\b(dm|message|whatsapp|ping|text)\s*(me|us)?\s*(on|via)?\s*(whatsapp|telegram)?\s*(to apply|to register|for details|your resume|your cv)\b/i.test(t)
      || /\bsend (your )?(resume|cv) (on|to|via) (whatsapp|telegram)\b/i.test(t) },
  { id: "urgency", severity: "low", reason: "Heavy urgency or pressure language",
    test: (t) => (t.match(/\b(urgent|hurry|last chance|act now|limited seats|only \d+ seats|few seats left|don'?t miss)\b/gi) || []).length >= 2 },
  { id: "short-link", severity: "low", reason: "Only a shortened link, so the destination is hidden",
    test: (t, links) => links.length > 0 && links.every((l) => /\b(bit\.ly|tinyurl\.com|cutt\.ly|shorturl\.at|t\.ly|rb\.gy|is\.gd)\b/i.test(l)) },
];

export function checkScam(text, links = []) {
  const t = String(text || "");
  const flags = RULES.filter((r) => r.test(t, links)).map(({ id, severity, reason }) => ({ id, severity, reason }));
  let level = "none";
  if (flags.some((f) => f.severity === "high") || flags.length >= 3) level = "high";
  else if (flags.some((f) => f.severity === "medium")) level = "medium";
  else if (flags.length) level = "low";
  return { level, flags };
}
