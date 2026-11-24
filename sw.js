// Service worker : permet d'utiliser le site hors ligne.
// Version 1. Quand tu modifies le site, passe à la version suivante (ex. v2) pour que tes visiteurs voient « Mettre à jour ».
const VERSION = "suites-v1";
const FICHIERS = ["index.html", "cours.html", "exercices.html", "quiz.html", "aide.html", "style.css", "quiz.js", "data.js", "pwa.js", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

// Les hébergeurs comme Netlify redirigent /cours.html vers /cours. Une réponse « redirigée » est refusée
// par le navigateur hors ligne : on en fait une copie propre avant de la ranger dans le cache.
async function propre(rep) {
  if (!rep.redirected) return rep;
  return new Response(await rep.blob(), { status: rep.status, statusText: rep.statusText, headers: rep.headers });
}
async function ranger(cache, chemin) {
  const rep = await fetch(chemin, { cache: "reload" });
  if (!rep || !rep.ok) return;
  const copie = await propre(rep);
  await cache.put(new Request(chemin), copie.clone());
  if (chemin === "index.html") await cache.put(new Request("./"), copie.clone());
  if (chemin.endsWith(".html") && chemin !== "index.html") await cache.put(new Request(chemin.slice(0, -5)), copie.clone());
}
function candidats(url) {
  const nom = url.pathname.split("/").pop();
  const liste = [];
  if (nom === "") liste.push("index.html", "./");
  else if (nom.endsWith(".html")) liste.push(nom, nom.slice(0, -5));
  else liste.push(nom, nom + ".html");
  return liste.map(c => new URL(c, self.registration.scope).href);
}

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(cache => Promise.all(FICHIERS.filter(f => f !== "./").map(f => ranger(cache, f).catch(() => {})))));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Cache d'abord (rapide, marche hors ligne), puis mise à jour en arrière-plan
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    let rep = await cache.match(req, { ignoreSearch: true });
    for (const c of candidats(url)) { if (rep) break; rep = await cache.match(c); }
    const maj = fetch(url.href, { cache: "no-cache" }).then(async r => {
      if (r && r.ok) { const copie = await propre(r); await cache.put(new Request(url.href), copie.clone()); return copie; }
      return null;
    }).catch(() => null);
    if (rep) { e.waitUntil(maj); return rep; }
    const r = await maj;
    if (r) return r;
    return (req.mode === "navigate" && (await cache.match(new URL("index.html", self.registration.scope).href))) || Response.error();
  })());
});

// La nouvelle version attend que l'utilisateur clique sur « Mettre à jour »
self.addEventListener("message", e => { if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting(); });
