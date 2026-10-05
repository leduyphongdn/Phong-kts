// Máy chủ Express phục vụ thư mục dist/ (dùng khi chạy local hoặc Hostinger Node.js Web App).
import express from "express";
import compression from "compression";
import path from "node:path";
import fs from "node:fs";

const app = express();
const dist = path.resolve("dist");
if (!fs.existsSync(dist)) { console.error("Chưa có dist/. Chạy: npm run build"); process.exit(1); }

app.disable("x-powered-by");
app.use(compression());
app.use((req, res, next) => { res.set({ "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin" }); next(); });
app.use(express.static(dist, {
  extensions: ["html"],
  setHeaders(res, p) {
    res.set("Cache-Control", p.endsWith(".html") ? "no-cache" : "public, max-age=31536000, immutable");
  },
}));
app.use((req, res) => res.status(404).sendFile(path.join(dist, "404.html")));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`http://localhost:${port}`));
