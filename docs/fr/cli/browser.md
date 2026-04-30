---
read_when:
    - Vous utilisez `openclaw browser` et souhaitez des exemples pour les tâches courantes
    - Vous souhaitez contrôler un navigateur exécuté sur une autre machine via un hôte Node
    - Vous voulez vous connecter à votre instance locale de Chrome connectée via Chrome MCP
summary: Référence CLI pour `openclaw browser` (cycle de vie, profils, onglets, actions, état et débogage)
title: Navigateur
x-i18n:
    generated_at: "2026-04-30T07:17:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7b5112c61e8289ab6a02bc30c9aefe640c053271f82197c0ee810b4a5efa580
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

Gérez la surface de contrôle du navigateur d’OpenClaw et exécutez des actions de navigateur (cycle de vie, profils, onglets, instantanés, captures d’écran, navigation, saisie, émulation d’état et débogage).

Associé :

- Outil de navigateur + API : [Outil de navigateur](/fr/tools/browser)

## Options courantes

- `--url <gatewayWsUrl>` : URL WebSocket du Gateway (valeur par défaut issue de la configuration).
- `--token <token>` : jeton du Gateway (si requis).
- `--timeout <ms>` : délai d’expiration de la requête (ms).
- `--expect-final` : attendre une réponse finale du Gateway.
- `--browser-profile <name>` : choisir un profil de navigateur (valeur par défaut issue de la configuration).
- `--json` : sortie lisible par machine (lorsque pris en charge).

## Démarrage rapide (local)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Les agents peuvent exécuter la même vérification de disponibilité avec `browser({ action: "doctor" })`.

## Dépannage rapide

Si `start` échoue avec `not reachable after start`, commencez par dépanner la disponibilité CDP. Si `start` et `tabs` réussissent, mais que `open` ou `navigate` échoue, le plan de contrôle du navigateur est sain et l’échec provient généralement de la stratégie SSRF de navigation.

Séquence minimale :

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Guide détaillé : [Dépannage du navigateur](/fr/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Cycle de vie

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Notes :

- `doctor --deep` ajoute une sonde d’instantané en direct. C’est utile lorsque la
  disponibilité CDP de base est verte, mais que vous voulez prouver que l’onglet
  actuel peut être inspecté.
- Pour les profils `attachOnly` et CDP distants, `openclaw browser stop` ferme la
  session de contrôle active et efface les remplacements temporaires d’émulation,
  même lorsque OpenClaw n’a pas lancé lui-même le processus de navigateur.
- Pour les profils locaux gérés, `openclaw browser stop` arrête le processus de
  navigateur lancé.
- `openclaw browser start --headless` ne s’applique qu’à cette requête de
  démarrage et seulement lorsque OpenClaw lance un navigateur local géré. Cela ne
  réécrit pas `browser.headless` ni la configuration du profil, et n’a aucun
  effet pour un navigateur déjà en cours d’exécution.
- Sur les hôtes Linux sans `DISPLAY` ni `WAYLAND_DISPLAY`, les profils locaux
  gérés s’exécutent automatiquement en mode headless, sauf si
  `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` ou
  `browser.profiles.<name>.headless=false` demande explicitement un navigateur visible.

## Si la commande est absente

Si `openclaw browser` est une commande inconnue, vérifiez `plugins.allow` dans
`~/.openclaw/openclaw.json`.

Lorsque `plugins.allow` est présent, listez explicitement le Plugin de navigateur
intégré, sauf si la configuration possède déjà un bloc racine `browser` :

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Un bloc racine `browser` explicite, par exemple `browser.enabled=true` ou
`browser.profiles.<name>`, active également le Plugin de navigateur intégré sous
une liste d’autorisation de Plugins restrictive.

Associé : [Outil de navigateur](/fr/tools/browser#missing-browser-command-or-tool)

## Profils

Les profils sont des configurations nommées de routage du navigateur. En pratique :

- `openclaw` : lance une instance Chrome dédiée gérée par OpenClaw ou s’y attache (répertoire de données utilisateur isolé).
- `user` : contrôle votre session Chrome existante connectée via Chrome DevTools MCP.
- profils CDP personnalisés : pointent vers un point de terminaison CDP local ou distant.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Utilisez un profil spécifique :

```bash
openclaw browser --browser-profile work tabs
```

## Onglets

```bash
openclaw browser tabs
openclaw browser tab new --label docs
openclaw browser tab label t1 docs
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai --label docs
openclaw browser focus docs
openclaw browser close t1
```

`tabs` renvoie d’abord `suggestedTargetId`, puis le `tabId` stable comme `t1`,
le libellé facultatif et le `targetId` brut. Les agents doivent retransmettre
`suggestedTargetId` à `focus`, `close`, aux instantanés et aux actions. Vous
pouvez attribuer un libellé avec `open --label`, `tab new --label` ou
`tab label` ; les libellés, identifiants d’onglet, identifiants de cible bruts
et préfixes uniques d’identifiant de cible sont tous acceptés.
Lorsque Chromium remplace la cible brute sous-jacente pendant une navigation ou
l’envoi d’un formulaire, OpenClaw conserve le `tabId` stable/libellé attaché à
l’onglet de remplacement lorsqu’il peut prouver la correspondance. Les
identifiants de cible bruts restent volatils ; préférez `suggestedTargetId`.

## Instantané / capture d’écran / actions

Instantané :

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

Capture d’écran :

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

Notes :

- `--full-page` est destiné uniquement aux captures de page ; il ne peut pas être
  combiné avec `--ref` ou `--element`.
- Les profils `existing-session` / `user` prennent en charge les captures
  d’écran de page et les captures d’écran `--ref` issues de la sortie
  d’instantané, mais pas les captures d’écran CSS `--element`.
- `--labels` superpose les références d’instantané actuelles sur la capture d’écran.
- `snapshot --urls` ajoute les destinations de liens découvertes aux instantanés
  IA afin que les agents puissent choisir des cibles de navigation directes au
  lieu de deviner uniquement à partir du texte des liens.

Naviguer/cliquer/saisir (automatisation de l’interface fondée sur les références) :

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser click-coords 120 340
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
```

Les réponses d’action renvoient le `targetId` brut actuel après un remplacement
de page déclenché par une action lorsque OpenClaw peut prouver l’onglet de
remplacement. Les scripts doivent tout de même stocker et transmettre
`suggestedTargetId`/les libellés pour les workflows de longue durée.

Assistants de fichiers + boîtes de dialogue :

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

Les profils Chrome gérés enregistrent les téléchargements ordinaires déclenchés
par clic dans le répertoire de téléchargements OpenClaw (`/tmp/openclaw/downloads`
par défaut, ou la racine temporaire configurée). Utilisez `waitfordownload` ou
`download` lorsque l’agent doit attendre un fichier spécifique et renvoyer son
chemin ; ces attentes explicites possèdent le prochain téléchargement.

## État et stockage

Fenêtre d’affichage + émulation :

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

Cookies + stockage :

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## Débogage

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## Chrome existant via MCP

Utilisez le profil intégré `user`, ou créez votre propre profil `existing-session` :

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

Ce chemin fonctionne uniquement sur l’hôte. Pour Docker, les serveurs headless, Browserless ou d’autres configurations distantes, utilisez plutôt un profil CDP.

Limites actuelles d’existing-session :

- les actions pilotées par instantané utilisent des références, pas des sélecteurs CSS
- `browser.actionTimeoutMs` définit par défaut les requêtes `act` prises en
  charge à 60000 ms lorsque les appelants omettent `timeoutMs` ; le `timeoutMs`
  par appel reste prioritaire.
- `click` est uniquement un clic gauche
- `type` ne prend pas en charge `slowly=true`
- `press` ne prend pas en charge `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` et `evaluate` rejettent
  les remplacements de délai d’expiration par appel
- `select` ne prend en charge qu’une seule valeur
- `wait --load networkidle` n’est pas pris en charge
- les téléversements de fichiers nécessitent `--ref` / `--input-ref`, ne prennent
  pas en charge `--element` CSS et ne prennent actuellement en charge qu’un seul
  fichier à la fois
- les hooks de boîte de dialogue ne prennent pas en charge `--timeout`
- les captures d’écran prennent en charge les captures de page et `--ref`, mais
  pas `--element` CSS
- `responsebody`, l’interception des téléchargements, l’export PDF et les actions
  par lot nécessitent toujours un navigateur géré ou un profil CDP brut

## Contrôle de navigateur distant (proxy d’hôte Node)

Si le Gateway s’exécute sur une machine différente du navigateur, exécutez un **hôte Node** sur la machine qui possède Chrome/Brave/Edge/Chromium. Le Gateway relaiera les actions du navigateur vers ce Node (aucun serveur de contrôle de navigateur séparé requis).

Utilisez `gateway.nodes.browser.mode` pour contrôler le routage automatique et `gateway.nodes.browser.node` pour épingler un Node spécifique si plusieurs sont connectés.

Sécurité + configuration distante : [Outil de navigateur](/fr/tools/browser), [Accès distant](/fr/gateway/remote), [Tailscale](/fr/gateway/tailscale), [Sécurité](/fr/gateway/security)

## Associé

- [Référence CLI](/fr/cli)
- [Navigateur](/fr/tools/browser)
