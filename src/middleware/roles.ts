export function canInsertShift(user: any): boolean {
  console.debug("[canInsertShift] user received:", user);
  if (!user) {
    console.debug("[canInsertShift] No user provided");
    return false;
  }
  console.debug("[canInsertShift] user.role:", user.role);
  return user.role === "finance" || user.role === "leader";
}