import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { startBridge } from "./lib/cyanBridge";

startBridge();
createRoot(document.getElementById("root")!).render(<App />);
