const userKey = "commandhub.userId";

export const getUserId = () => {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(userKey);
  if (existing) return existing;
  const id = `user-${crypto.randomUUID()}`;
  window.localStorage.setItem(userKey, id);
  return id;
};
