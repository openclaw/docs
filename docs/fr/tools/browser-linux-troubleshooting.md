---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Corriger les problèmes de démarrage CDP de Chrome/Brave/Edge/Chromium pour le contrôle du navigateur OpenClaw sous Linux
title: Dépannage du navigateur
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-26T11:39:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69e5b42532af002af3d6a3ab21df7f82d2d62ce9f23b57a94cdb97e8ac65df3b
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

## Problème : « Failed to start Chrome CDP on port 18800 »

Le serveur de contrôle du navigateur d'OpenClaw ne parvient pas à lancer Chrome/Brave/Edge/Chromium avec l'erreur :

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Cause racine

Sous Ubuntu (et de nombreuses distributions Linux), l'installation Chromium par défaut est un **paquet snap**. Le confinement AppArmor de snap interfère avec la manière dont OpenClaw lance et surveille le processus du navigateur.

La commande `apt install chromium` installe un paquet factice qui redirige vers snap :

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Ce n'est PAS un vrai navigateur — c'est seulement un wrapper.

Autres échecs de lancement Linux fréquents :

- `The profile appears to be in use by another Chromium process` signifie que Chrome
  a trouvé des fichiers de verrouillage `Singleton*` obsolètes dans le répertoire de profil géré. OpenClaw
  supprime ces verrous et réessaie une fois lorsque le verrou pointe vers un processus mort
  ou un processus sur un autre hôte.
- `Missing X server or $DISPLAY` signifie qu'un navigateur visible a été explicitement
  demandé sur un hôte sans session de bureau. Par défaut, les profils gérés locaux
  basculent désormais en mode headless sous Linux lorsque `DISPLAY` et
  `WAYLAND_DISPLAY` ne sont tous deux pas définis. Si vous définissez `OPENCLAW_BROWSER_HEADLESS=0`,
  `browser.headless: false` ou `browser.profiles.<name>.headless: false`,
  supprimez cette surcharge en mode visible, définissez `OPENCLAW_BROWSER_HEADLESS=1`, démarrez `Xvfb`,
  exécutez `openclaw browser start --headless` pour un lancement géré ponctuel, ou lancez
  OpenClaw dans une véritable session de bureau.

### Solution 1 : installer Google Chrome (recommandé)

Installez le paquet `.deb` officiel de Google Chrome, qui n'est pas isolé par snap :

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # s'il y a des erreurs de dépendances
```

Mettez ensuite à jour votre configuration OpenClaw (`~/.openclaw/openclaw.json`) :

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

### Solution 2 : utiliser Chromium snap avec le mode attachement uniquement

Si vous devez utiliser Chromium snap, configurez OpenClaw pour s'attacher à un navigateur démarré manuellement :

1. Mettez à jour la configuration :

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

2. Démarrez Chromium manuellement :

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. Créez éventuellement un service utilisateur systemd pour démarrer Chrome automatiquement :

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

Activez-le avec : `systemctl --user enable --now openclaw-browser.service`

### Vérifier que le navigateur fonctionne

Vérifiez l'état :

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

Testez la navigation :

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Référence de configuration

| Option                           | Description                                                          | Par défaut                                                  |
| -------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`                | Activer le contrôle du navigateur                                    | `true`                                                      |
| `browser.executablePath`         | Chemin vers un binaire de navigateur basé sur Chromium (Chrome/Brave/Edge/Chromium) | détection automatique (préfère le navigateur par défaut s'il est basé sur Chromium) |
| `browser.headless`               | Exécuter sans interface graphique                                    | `false`                                                     |
| `OPENCLAW_BROWSER_HEADLESS`      | Surcharge par processus du mode headless du navigateur géré local    | non défini                                                  |
| `browser.noSandbox`              | Ajouter le drapeau `--no-sandbox` (nécessaire pour certaines configurations Linux) | `false`                                                     |
| `browser.attachOnly`             | Ne pas lancer le navigateur, seulement s'attacher à l'existant       | `false`                                                     |
| `browser.cdpPort`                | Port Chrome DevTools Protocol                                        | `18800`                                                     |
| `browser.localLaunchTimeoutMs`   | Délai d'expiration de découverte de Chrome géré local                | `15000`                                                     |
| `browser.localCdpReadyTimeoutMs` | Délai d'expiration local de disponibilité CDP après lancement        | `8000`                                                      |

Sur Raspberry Pi, d'anciens hôtes VPS ou des stockages lents, augmentez
`browser.localLaunchTimeoutMs` lorsque Chrome a besoin de plus de temps pour exposer son point de terminaison
HTTP CDP. Augmentez `browser.localCdpReadyTimeoutMs` lorsque le lancement réussit mais que
`openclaw browser start` signale encore `not reachable after start`. Les valeurs doivent
être des entiers positifs jusqu'à `120000` ms ; les valeurs de configuration invalides sont rejetées.

### Problème : « No Chrome tabs found for profile="user" »

Vous utilisez un profil `existing-session` / Chrome MCP. OpenClaw peut voir Chrome en local,
mais aucun onglet ouvert n'est disponible pour s'y attacher.

Options de correction :

1. **Utiliser le navigateur géré :** `openclaw browser start --browser-profile openclaw`
   (ou définir `browser.defaultProfile: "openclaw"`).
2. **Utiliser Chrome MCP :** assurez-vous que Chrome local est en cours d'exécution avec au moins un onglet ouvert, puis réessayez avec `--browser-profile user`.

Remarques :

- `user` est limité à l'hôte. Pour les serveurs Linux, les conteneurs ou les hôtes distants, préférez les profils CDP.
- `user` / les autres profils `existing-session` conservent les limites actuelles de Chrome MCP :
  actions pilotées par ref, hooks de téléversement d'un seul fichier, aucune surcharge de délai d'expiration de boîte de dialogue, pas de
  `wait --load networkidle`, et pas de `responsebody`, export PDF, interception de téléchargement ni actions par lots.
- Les profils locaux `openclaw` attribuent automatiquement `cdpPort`/`cdpUrl` ; ne définissez ces champs que pour CDP distant.
- Les profils CDP distants acceptent `http://`, `https://`, `ws://` et `wss://`.
  Utilisez HTTP(S) pour la découverte `/json/version`, ou WS(S) lorsque votre service
  de navigateur vous fournit une URL de socket DevTools directe.

## Lié

- [Browser](/fr/tools/browser)
- [Browser login](/fr/tools/browser-login)
- [Browser WSL2 troubleshooting](/fr/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
