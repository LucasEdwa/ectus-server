export function canInsertShift(user: any): void {
  if (!user) {
    throw new Error("Not authenticated");
  }
  if (user.role !== "finance" && user.role !== "leader") {
    throw new Error("Not authorized to add shifts.");
  }
}
export function canUpdateShift(user: any): void {
    if (!user) {
        throw new Error("Not authenticated");
    }
    if (user.role !== "finance"&& user.role !== "leader"){
        throw new Error("Not authorized to update shifts.");
    }
    
}
export function canDeleteShift(user: any): void {
  if(!user) {
    throw new Error("Not authenticated");
  }
  if(user.role !== "finance" && user.role !== "leader") {
    throw new Error("Not authorized to delete shifts.");
  }
}
export function canViewShift(user: any): void {
  if (!user) {
    throw new Error("Not authenticated");
  }
  if (user.role !== "finance" && user.role !== "leader" && user.role !== "employee") {
    throw new Error("Not authorized to view shifts.");
  }
}
export function canViewAllShifts(user: any): void {
  if (!user) {
    throw new Error("Not authenticated");
  }
  if (user.role !== "finance" && user.role !== "leader") {
    throw new Error("Not authorized to view all shifts.");
  }
}
export function canCreatePaylist(user: any): void {
  if (!user) {
    throw new Error("Not authenticated");
  }
  if (user.role !== "finance") {
    throw new Error("Not authorized to create paylists.");
  }
}