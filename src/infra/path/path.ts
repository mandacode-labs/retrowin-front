export function joinPath(base: string, name: string): string {
  const cleanedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  if (!cleanedBase || cleanedBase === "/") return `/${name}`;
  return `${cleanedBase}/${name}`;
}

export function normalize(path: string): string {
  if (!path || path === "/") return "/";
  const parts: string[] = [];
  for (const seg of path.split("/")) {
    if (!seg || seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  return `/${parts.join("/")}`;
}

export function dirname(path: string): string {
  if (!path || path === "/") return "/";
  const idx = path.lastIndexOf("/");
  if (idx <= 0) return "/";
  return path.slice(0, idx);
}

export function basename(path: string): string {
  if (!path || path === "/") return "";
  const parts = path.split("/").filter(Boolean);
  return parts.length ? parts[parts.length - 1] : "";
}
