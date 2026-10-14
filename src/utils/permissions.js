import { ROLES } from "./constants";

// ====== هل المستخدم مدير نظام؟ ======
export const isAdmin = (profile) => profile?.role === ROLES.ADMIN;

// ====== هل المستخدم إداري فريق؟ ======
export const isTeamAdmin = (profile) => {
  return profile?.role === "team_admin";
};

// ====== هل يمتلك صلاحية إدارة فريق معين؟ ======
export const canManageTeam = (profile, teamId) => {
  if (!profile) return false;
  if (isAdmin(profile)) return true;
  if (!profile.user_teams) return false;
  return profile.user_teams.some((ut) => ut.team_id === teamId);
};

// ====== جلب قائمة الفرق المسموح بها ======
export const getAllowedTeamIds = (profile) => {
  if (!profile) return [];
  if (isAdmin(profile)) return null; // null = كل الفرق
  return (profile.user_teams || []).map((ut) => ut.team_id);
};

// ====== هل يمكنه إدارة المستخدمين؟ ======
export const canManageUsers = (profile) => isAdmin(profile);

// ====== هل يمكنه الموافقة على التصعيدات؟ ======
export const canReviewEscalations = (profile) =>
  isAdmin(profile) || isTeamAdmin(profile);

// ====== هل يمكنه غلق/فتح تقرير مباراة؟ ======
export const canCloseMatchReport = (profile) => isAdmin(profile);

// ====== هل يمكنه حذف اللاعبين؟ ======
export const canDeletePlayers = (profile) => isAdmin(profile);
