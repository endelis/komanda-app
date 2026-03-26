/**
 * Derives age group from date of birth.
 * Reference: Sept 1 of the current season year.
 * Age group is NEVER stored — always derived at runtime.
 */
export function getAgeGroup(dob, referenceDate = new Date()) {
  const year = referenceDate.getFullYear()
  const seasonRef = new Date(year, 8, 1) // Sept 1
  const ageMs = seasonRef - new Date(dob)
  const age = Math.floor(ageMs / 31557600000) // ms in a Julian year

  if (age <= 7)  return 'U8'
  if (age <= 9)  return 'U10'
  if (age <= 11) return 'U12'
  if (age <= 13) return 'U14'
  if (age <= 15) return 'U16'
  return 'U18'
}
