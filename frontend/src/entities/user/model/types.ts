export type UserProfile = {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
};

export type CurrentUserResponse =
  { authenticated: false; user: null } | { authenticated: true; user: UserProfile };

export type UpdateProfileRequest = {
  displayName: string;
};
