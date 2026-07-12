---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Corriger les problèmes de démarrage de CDP avec Chrome/Brave/Edge/Chromium pour le contrôle du navigateur OpenClaw sous Linux
title: Dépannage du navigateur
x-i18n:
    generated_at: "2026-07-12T03:22:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e0256e8ee441802086cd486923060be54f8966b423e5dcb71fc8961bbab5d729
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## Problème : échec du démarrage de Chrome CDP sur le port 18800

```json
{ "error": "Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"." }
```

### Cause première

Sur Ubuntu et la plupart des distributions Linux, `apt install chromium` installe un lanceur snap,
et non un véritable navigateur :

```text
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Le confinement AppArmor de snap interfère avec la façon dont OpenClaw lance et surveille
le processus du navigateur.

Autres échecs de lancement courants sous Linux :

- `The profile appears to be in use by another Chromium process` : fichiers de verrouillage
  `Singleton*` obsolètes dans le répertoire du profil géré. OpenClaw supprime
  ces verrous et réessaie une fois lorsque le verrou pointe vers un processus arrêté ou
  exécuté sur un autre hôte.
- `Missing X server or $DISPLAY` : un navigateur visible a été explicitement demandé
  sur un hôte dépourvu de session de bureau. Sous Linux, les profils locaux gérés basculent
  en mode sans interface graphique lorsque `DISPLAY` et `WAYLAND_DISPLAY` ne sont pas définis.
  Si vous avez défini `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless: false` ou
  `browser.profiles.<name>.headless: false`, supprimez ce forçage du mode avec interface,
  définissez `OPENCLAW_BROWSER_HEADLESS=1`, démarrez `Xvfb`, exécutez
  `openclaw browser start --headless` pour un lancement géré ponctuel, ou exécutez
  OpenClaw dans une véritable session de bureau.

### Solution 1 : installer Google Chrome (recommandé)

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # en cas d'erreurs de dépendances
```

Mettez à jour `~/.openclaw/openclaw.json` :

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### Solution 2 : utiliser Chromium snap en mode connexion uniquement

Si vous devez conserver Chromium snap, configurez OpenClaw pour qu'il se connecte à un
navigateur démarré manuellement au lieu de le lancer :

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "headless": true,
    "noSandbox": true
  }
}
```

Démarrez Chromium manuellement :

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

Vous pouvez également le démarrer automatiquement avec un service utilisateur systemd :

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=Navigateur OpenClaw (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

```bash
systemctl --user enable --now openclaw-browser.service
```

### Vérifier le fonctionnement du navigateur

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Référence de configuration

| Option                           | Description                                                               | Valeur par défaut                                                                  |
| -------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `browser.enabled`                | Activer le contrôle du navigateur                                         | `true`                                                                             |
| `browser.executablePath`         | Chemin vers un exécutable de navigateur basé sur Chromium (Chrome/Brave/Edge/Chromium) | détecté automatiquement (privilégie le navigateur par défaut du système s'il est basé sur Chromium) |
| `browser.headless`               | Exécuter sans interface graphique                                         | `false`                                                                            |
| `OPENCLAW_BROWSER_HEADLESS`      | Forçage par processus du mode sans interface du navigateur local géré     | non défini                                                                         |
| `browser.noSandbox`              | Ajouter l'option `--no-sandbox` (nécessaire pour certaines configurations Linux) | `false`                                                                       |
| `browser.attachOnly`             | Ne pas lancer de navigateur ; se connecter uniquement à un navigateur existant | `false`                                                                        |
| `browser.cdpPortRangeStart`      | Premier port CDP local pour les profils attribués automatiquement         | `18800` (dérivé du port du Gateway)                                                 |
| `browser.localLaunchTimeoutMs`   | Délai maximal de détection de Chrome local géré, jusqu'à `120000`         | `15000`                                                                            |
| `browser.localCdpReadyTimeoutMs` | Délai maximal d'attente de disponibilité de CDP après le lancement local géré, jusqu'à `120000` | `8000`                                                      |

Les deux délais doivent être des entiers positifs inférieurs ou égaux à `120000` ms ; toute autre valeur
est rejetée lors du chargement de la configuration. Sur Raspberry Pi, les anciens hôtes VPS ou les
stockages lents, augmentez `browser.localLaunchTimeoutMs` lorsque Chrome a besoin de plus de temps pour
exposer son point de terminaison HTTP CDP. Augmentez `browser.localCdpReadyTimeoutMs` lorsque
le lancement réussit, mais que `openclaw browser start` signale toujours `not reachable
after start`.

### Problème : aucun onglet Chrome trouvé pour profile="user"

Vous utilisez le profil `user` (`existing-session` / Chrome MCP) et aucun
onglet ouvert n'est disponible pour la connexion.

Solutions possibles :

1. Utilisez plutôt le navigateur géré :
   `openclaw browser --browser-profile openclaw start` (ou définissez
   `browser.defaultProfile: "openclaw"`).
2. Laissez Chrome local s'exécuter avec au moins un onglet ouvert, puis réessayez avec
   `--browser-profile user`.

Remarques :

- `user` est réservé à l'hôte. Sur les serveurs Linux, dans les conteneurs ou sur les hôtes distants, privilégiez
  plutôt les profils CDP.
- `user` et les autres profils `existing-session` partagent les limitations actuelles de Chrome MCP :
  uniquement les actions basées sur des références, un fichier par téléversement, aucun remplacement de
  `timeoutMs` pour les boîtes de dialogue, aucune commande `wait --load networkidle`, et aucune action
  `responsebody`, exportation PDF, interception des téléchargements ou action par lots.
- Les profils locaux du pilote `openclaw` attribuent automatiquement `cdpPort`/`cdpUrl` ; ne les définissez
  manuellement que pour un CDP distant.
- Les profils CDP distants acceptent `http://`, `https://`, `ws://` et `wss://`.
  Utilisez HTTP(S) pour la détection via `/json/version`, ou WS(S) lorsque votre service de navigateur
  vous fournit directement l'URL d'un socket DevTools.

## Pages connexes

- [Navigateur](/fr/tools/browser)
- [Connexion au navigateur](/fr/tools/browser-login)
- [Dépannage du CDP distant du navigateur sous WSL2](/fr/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
