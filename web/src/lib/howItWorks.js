export const HOW_IT_WORKS_PENDING_KEY = "mp_show_how_it_works";

export function hasHowItWorksPending() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(HOW_IT_WORKS_PENDING_KEY) === "1";
  } catch {
    return false;
  }
}

export function markHowItWorksPending() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HOW_IT_WORKS_PENDING_KEY, "1");
  } catch {
    return;
  }
}

export function clearHowItWorksPending() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(HOW_IT_WORKS_PENDING_KEY);
  } catch {
    return;
  }
}
