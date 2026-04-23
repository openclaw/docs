---
read_when:
    - Vous utilisez `openclaw browser` et souhaitez des exemples pour les tâches courantes
    - Vous voulez contrôler un navigateur exécuté sur une autre machine via un hôte Node
    - Vous voulez vous attacher à votre Chrome local déjà connecté via Chrome MCP
summary: Référence CLI pour `openclaw browser` (cycle de vie, profils, onglets, actions, état et débogage)
title: browser
x-i18n:
    generated_at: "2026-04-23T07:00:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0cf1a5168e690121d4fc4eac984580c89bc50844f15558413ba6d8a635da2ed6
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

Gérez la surface de contrôle navigateur d’OpenClaw et exécutez des actions navigateur (cycle de vie, profils, onglets, instantanés, captures d’écran, navigation, saisie, émulation d’état et débogage).

Liens connexes :

- Outil navigateur + API : [Browser tool](/fr/tools/browser)

## Drapeaux courants

- `--url <gatewayWsUrl>` : URL WebSocket du Gateway (par défaut depuis la configuration).
- `--token <token>` : jeton du Gateway (si requis).
- `--timeout <ms>` : délai d’expiration de la requête (ms).
- `--expect-final` : attendre une réponse finale du Gateway.
- `--browser-profile <name>` : choisir un profil navigateur (valeur par défaut depuis la configuration).
- `--json` : sortie lisible par machine (lorsque prise en charge).

## Démarrage rapide (local)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

## Dépannage rapide

Si `start` échoue avec `not reachable after start`, dépannez d’abord l’état de préparation CDP. Si `start` et `tabs` réussissent mais que `open` ou `navigate` échouent, le plan de contrôle du navigateur est sain et l’échec est généralement lié à la politique SSRF de navigation.

Séquence minimale :

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Guide détaillé : [Dépannage navigateur](/fr/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Cycle de vie

```bash
openclaw browser status
openclaw browser start
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Remarques :

- Pour `attachOnly` et les profils CDP distants, `openclaw browser stop` ferme la
  session de contrôle active et efface les remplacements d’émulation temporaires, même lorsque
  OpenClaw n’a pas lui-même lancé le processus du navigateur.
- Pour les profils locaux gérés, `openclaw browser stop` arrête le processus
  de navigateur lancé.

## Si la commande est absente

Si `openclaw browser` est une commande inconnue, vérifiez `plugins.allow` dans
`~/.openclaw/openclaw.json`.

Lorsque `plugins.allow` est présent, le Plugin navigateur groupé doit être listé
explicitement :

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` ne rétablit pas la sous-commande CLI lorsque la
liste d’autorisation des plugins exclut `browser`.

Voir aussi : [Browser tool](/fr/tools/browser#missing-browser-command-or-tool)

## Profils

Les profils sont des configurations nommées de routage navigateur. En pratique :

- `openclaw` : lance ou attache une instance Chrome dédiée gérée par OpenClaw (répertoire de données utilisateur isolé).
- `user` : contrôle votre session Chrome déjà connectée via Chrome DevTools MCP.
- profils CDP personnalisés : pointent vers un point de terminaison CDP local ou distant.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Utiliser un profil spécifique :

```bash
openclaw browser --browser-profile work tabs
```

## Onglets

```bash
openclaw browser tabs
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai
openclaw browser focus <targetId>
openclaw browser close <targetId>
```

## Instantané / capture d’écran / actions

Instantané :

```bash
openclaw browser snapshot
```

Capture d’écran :

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
```

Remarques :

- `--full-page` est réservé aux captures de page ; il ne peut pas être combiné avec `--ref`
  ou `--element`.
- Les profils `existing-session` / `user` prennent en charge les captures d’écran de page et les captures
  avec `--ref` à partir de la sortie d’instantané, mais pas les captures CSS `--element`.

Navigate/click/type (automatisation d’interface basée sur des refs) :

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
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

Assistants fichier + boîte de dialogue :

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

## État et stockage

Viewport + émulation :

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

Ce chemin est réservé à l’hôte. Pour Docker, les serveurs headless, Browserless ou d’autres configurations distantes, utilisez à la place un profil CDP.

Limites actuelles de existing-session :

- les actions pilotées par instantané utilisent des refs, pas des sélecteurs CSS
- `click` prend uniquement en charge le clic gauche
- `type` ne prend pas en charge `slowly=true`
- `press` ne prend pas en charge `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` et `evaluate` refusent
  les remplacements de délai d’expiration par appel
- `select` prend en charge une seule valeur
- `wait --load networkidle` n’est pas pris en charge
- les téléversements de fichiers nécessitent `--ref` / `--input-ref`, ne prennent pas en charge CSS
  `--element`, et prennent actuellement en charge un seul fichier à la fois
- les hooks de boîte de dialogue ne prennent pas en charge `--timeout`
- les captures d’écran prennent en charge les captures de page et `--ref`, mais pas CSS `--element`
- `responsebody`, l’interception des téléchargements, l’export PDF et les actions par lots nécessitent toujours
  un navigateur géré ou un profil CDP brut

## Contrôle navigateur distant (proxy d’hôte node)

Si le Gateway s’exécute sur une machine différente de celle du navigateur, exécutez un **hôte node** sur la machine qui dispose de Chrome/Brave/Edge/Chromium. Le Gateway transmettra les actions navigateur à ce nœud (aucun serveur de contrôle navigateur distinct n’est requis).

Utilisez `gateway.nodes.browser.mode` pour contrôler le routage automatique et `gateway.nodes.browser.node` pour épingler un nœud spécifique si plusieurs sont connectés.

Sécurité + configuration distante : [Browser tool](/fr/tools/browser), [Accès distant](/fr/gateway/remote), [Tailscale](/fr/gateway/tailscale), [Sécurité](/fr/gateway/security)
