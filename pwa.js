// PWA : enregistre le service worker, propose « Installer » ou, si une nouvelle version existe, « Mettre à jour »
let invite = null, btn = null, majDemandee = false, majPrete = false;
const dejaInstallee = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const memo = { lire: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, ecrire: k => { try { localStorage.setItem(k, "1"); } catch (e) {} } };

function bouton(mode, texte, action) {
  if (!btn) {
    btn = document.createElement("button");
    btn.style.cssText = "position:fixed;right:12px;bottom:12px;z-index:20;background:#27348b;color:#fff;border:2px solid #fff;border-radius:12px;padding:.6em 1em;font:600 .9rem 'Segoe UI',sans-serif;box-shadow:3px 3px 0 rgba(0,0,0,.25);cursor:pointer";
    document.body.appendChild(btn);
  }
  btn.dataset.mode = mode; btn.textContent = texte; btn.onclick = action;
}
function retirer() { if (btn) { btn.remove(); btn = null; } }

// Explications quand le navigateur n'ouvre pas la fenêtre d'installation tout seul
function aideInstallation() {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const fond = document.createElement("div");
  fond.style.cssText = "position:fixed;inset:0;z-index:30;background:rgba(20,25,60,.55);display:flex;align-items:center;justify-content:center;padding:16px";
  const bte = document.createElement("div");
  bte.style.cssText = "background:#fff;color:#1d2340;border:2px solid #27348b;border-radius:14px;padding:16px 18px;max-width:340px;font:15px/1.5 'Segoe UI',sans-serif;box-shadow:5px 5px 0 rgba(0,0,0,.25)";
  bte.innerHTML = "<b style='color:#27348b;font-size:1.05em'>Installer l'application</b><p style='margin:.6em 0'>" +
    (ios ? "Dans Safari, touche le bouton <b>Partager</b> (le carré avec une flèche), puis <b>« Sur l'écran d'accueil »</b>."
         : "Ouvre le menu <b>⋮</b> de ton navigateur (Chrome), puis choisis <b>« Installer l'application »</b> ou <b>« Ajouter à l'écran d'accueil »</b>.") +
    "</p><p style='margin:.6em 0;color:#5d6591;font-size:.9em'>Déjà installée ? Ouvre-la depuis ton écran d'accueil.</p>";
  const fermer = document.createElement("button");
  fermer.textContent = "Fermer";
  fermer.style.cssText = "background:#27348b;color:#fff;border:0;border-radius:10px;padding:.5em 1.2em;font:600 .9rem 'Segoe UI',sans-serif;cursor:pointer";
  fermer.onclick = () => fond.remove(); fond.onclick = e => { if (e.target === fond) fond.remove(); };
  bte.appendChild(fermer); fond.appendChild(bte); document.body.appendChild(fond);
}

function afficherInstaller() {
  if (majPrete || dejaInstallee() || memo.lire("pwa-installee") || (btn && btn.dataset.mode !== "installer")) return;
  bouton("installer", "📲 Installer l'application", () => {
    if (invite) { invite.prompt(); invite.userChoice.finally(() => { invite = null; }); }
    else aideInstallation();
  });
}

function proposerMiseAJour(worker) {
  majPrete = true;
  // la mise à jour remplace le bouton « Installer l'application »
  bouton("maj", "🔄 Mettre à jour l'application", () => {
    majDemandee = true; btn.textContent = "Mise à jour…";
    worker.postMessage({ type: "SKIP_WAITING" });
  });
}

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").then(reg => {
      if (reg.waiting && navigator.serviceWorker.controller) proposerMiseAJour(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const w = reg.installing;
        w.addEventListener("statechange", () => {
          if (w.state === "installed" && navigator.serviceWorker.controller) proposerMiseAJour(w);
        });
      });
    }).catch(() => {});
    navigator.serviceWorker.addEventListener("controllerchange", () => { if (majDemandee) location.reload(); });
    // si le navigateur n'a pas proposé l'installation (iPhone, Firefox, invitation déjà refusée…), on affiche quand même le bouton
    setTimeout(afficherInstaller, 2500);
  });
}
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); invite = e; afficherInstaller(); });
window.addEventListener("appinstalled", () => { memo.ecrire("pwa-installee"); if (btn && btn.dataset.mode === "installer") retirer(); });
