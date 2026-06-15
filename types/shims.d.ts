// Minimal ambient declarations for packages without bundled TS types.
declare module "bcrypt";

// Web Speech API (not in default DOM lib types)
interface Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}
