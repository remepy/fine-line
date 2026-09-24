import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { getBridgeState, startBridge, subscribeBridge, reportError } from "./lib/cyanBridge";
import { loadLanguage } from "./lib/copy";

void loadLanguage().then((language) => {
  document.documentElement.lang = language.locale;
  document.documentElement.dir = language.dir;
  startBridge();
  const updateTitle = () => {
    const status = getBridgeState().status;
    const title = status === "active" || status === "standalone"
      ? language.keys.title : "";
    document.title = title;
    document.querySelector('meta[name="apple-mobile-web-app-title"]')
      ?.setAttribute("content", title);
  };
  subscribeBridge(updateTitle);
  updateTitle();
  createRoot(document.getElementById("root")!).render(<App />);
}).catch(() => {
  // Do not mount the app or show any text if copy is unavailable.
  reportError("translations_unavailable");
});
