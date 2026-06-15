// Minimal ambient declarations for packages without bundled TS types.
declare module "bcrypt";
declare module "bcryptjs";

// Web Speech API (not in default DOM lib types)
interface Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}
