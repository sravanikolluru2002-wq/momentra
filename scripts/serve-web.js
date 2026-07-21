const http = require("http");
const fs = require("fs");
const path = require("path");

const port = Number(process.env.PORT || 8083);
const distDir = path.join(__dirname, "..", "dist");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function safeJoin(root, requestPath) {
  const normalizedPath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(root, normalizedPath);
  return filePath.startsWith(root) ? filePath : null;
}

function resolveFile(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split("?")[0]).replace(/^\/+/, "");
  const routePath = cleanPath || "index";
  const directPath = safeJoin(distDir, cleanPath);

  if (directPath && fs.existsSync(directPath) && fs.statSync(directPath).isFile()) {
    return directPath;
  }

  const htmlPath = safeJoin(distDir, `${routePath}.html`);
  if (htmlPath && fs.existsSync(htmlPath)) {
    return htmlPath;
  }

  const nestedIndexPath = safeJoin(distDir, path.join(routePath, "index.html"));
  if (nestedIndexPath && fs.existsSync(nestedIndexPath)) {
    return nestedIndexPath;
  }

  return safeJoin(distDir, "+not-found.html");
}

const server = http.createServer((request, response) => {
  const filePath = resolveFile(request.url || "/");

  if (!filePath || !fs.existsSync(filePath)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  response.writeHead(filePath.endsWith("+not-found.html") ? 404 : 200, {
    "Content-Type": mimeTypes[ext] || "application/octet-stream",
  });
  fs.createReadStream(filePath).pipe(response);
});

server.listen(port, () => {
  console.log(`Momentra web export running at http://localhost:${port}`);
});
