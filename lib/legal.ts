// Details the legal pages need. Fill these in before launch: the pages leave
// out any clause whose detail is still empty rather than showing a placeholder.

export const LEGAL = {
  // Trading name shown throughout
  name: "Housecount",
  // Registered legal entity or the individual operating the service, e.g. "Housecount LLC"
  operator: process.env.NEXT_PUBLIC_LEGAL_OPERATOR || "",
  // Where people send privacy and legal requests
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  // e.g. "the State of Michigan, USA"
  governingLaw: process.env.NEXT_PUBLIC_GOVERNING_LAW || "",
  // Date the current text took effect
  updated: "October 14, 2026",
}
