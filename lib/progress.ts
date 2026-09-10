const STORAGE_KEY = "misk_progress_v1";

type Store = Record<string, Record<string, true>>;

function isBrowser() {
  return typeof window !== "undefined";
}

function loadStore(): Store {
  if (!isBrowser()) return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function saveStore(store: Store) {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function lessonKey(unitId: string, lessonId: string) {
  return `${unitId}::${lessonId}`;
}

export function isLessonDone(courseId: string, unitId: string, lessonId: string) {
  const store = loadStore();
  return !!store[courseId]?.[lessonKey(unitId, lessonId)];
}

export function markLessonDone(courseId: string, unitId: string, lessonId: string, done = true) {
  const store = loadStore();
  store[courseId] ||= {};

  const key = lessonKey(unitId, lessonId);
  if (done) store[courseId][key] = true;
  else delete store[courseId][key];

  saveStore(store);
}

export function getUnitDoneCount(courseId: string, unitId: string) {
  const store = loadStore();
  const keys = Object.keys(store[courseId] || {});
  return keys.filter((k) => k.startsWith(`${unitId}::`)).length;
}

export function getUnitProgress(courseId: string, unitId: string, totalLessons: number) {
  if (totalLessons <= 0) return 0;
  const done = getUnitDoneCount(courseId, unitId);
  return Math.min(1, done / totalLessons);
}