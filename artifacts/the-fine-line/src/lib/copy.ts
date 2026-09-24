import type { BridgeSession } from "./cyanBridge";

const he = {
  title: "הקו הדק",
  level: "שלב {n}",
  loading: "טוען תמונות...",
  original: "תמונה מקורית",
  modified: "תמונה שונה",
  differences: "זהו {n} הבדלים",
  hint: "רמז",
  musicOn: "השתק מוזיקה",
  musicOff: "הפעל מוזיקה",
  fullscreenOn: "צא ממסך מלא",
  fullscreenOff: "מסך מלא",
  quit: "יציאה מהמשחק",
  success: "יפה מאוד, זיהיתם את כל ההבדלים!",
  complete: "שלב {n} הושלם",
  next: "לשלב הבא ←",
  instruction1: "זהו 7 הבדלים בין התמונות שעל המסך.",
  instruction2: "נמצא הבדל? הקישו עליו באחת התמונות.",
  instruction3: "מצאו את כל ההבדלים כדי לעבור לשלב הבא.",
  fullscreenHint: "לחצו על הסמל להצגת התמונות במסך מלא",
  start: "בואו נתחיל",
  rotate: "סובבו את הטלפון למצב מאוזן",
  paused: "המשחק מושהה",
  unavailable: "המשחק אינו זמין כעת",
};

const en: typeof he = {
  title: "The Fine Line",
  level: "Level {n}",
  loading: "Loading images...",
  original: "Original image",
  modified: "Changed image",
  differences: "Find {n} differences",
  hint: "Hint",
  musicOn: "Mute music",
  musicOff: "Play music",
  fullscreenOn: "Exit full screen",
  fullscreenOff: "Full screen",
  quit: "Exit game",
  success: "Well done! You found all the differences!",
  complete: "Level {n} complete",
  next: "Next level →",
  instruction1: "Find 7 differences between the images.",
  instruction2: "Found one? Tap it in either image.",
  instruction3: "Find them all to move to the next level.",
  fullscreenHint: "Use the icon to view the images in full screen",
  start: "Let's begin",
  rotate: "Rotate your phone to landscape",
  paused: "Game paused",
  unavailable: "The game is unavailable right now",
};

export type CopyKey = keyof typeof he;
export function copy(session: BridgeSession | null, key: CopyKey, n?: number) {
  const defaults = session?.locale === "en-US" ? en : he;
  const value = session?.translations[key] || defaults[key];
  return value.replace(/\{n\}/g, String(n ?? ""));
}