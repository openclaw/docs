---
read_when:
    - Vous utilisez `openclaw browser` et souhaitez des exemples pour les tâches courantes
    - Vous souhaitez contrôler un navigateur exécuté sur une autre machine via un hôte Node
    - Vous souhaitez vous connecter à votre Chrome local déjà connecté via Chrome MCP
summary: Référence CLI pour `openclaw browser` (cycle de vie, profils, onglets, actions, état et débogage)
title: Browser
x-i18n:
    generated_at: "2026-04-26T11:25:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: b42511e841e768bfa4031463f213d78c67d5c63efb655a90f65c7e8c71da9881
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

Gérez la surface de contrôle du navigateur d’OpenClaw et exécutez des actions navigateur (cycle de vie, profils, onglets, instantanés, captures d’écran, navigation, saisie, émulation d’état et débogage).

Lié :

- Outil Browser + API : [Outil Browser](/fr/tools/browser)

## Indicateurs courants

- `--url <gatewayWsUrl>` : URL WebSocket de la Gateway (par défaut depuis la configuration).
- `--token <token>` : token de la Gateway (si requis).
- `--timeout <ms>` : délai d’expiration de la requête (ms).
- `--expect-final` : attendre une réponse finale de la Gateway.
- `--browser-profile <name>` : choisir un profil navigateur (par défaut depuis la configuration).
- `--json` : sortie lisible par machine (lorsque pris en charge).

## Démarrage rapide (local)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Les agents peuvent exécuter la même vérification d’état de préparation avec `browser({ action: "doctor" })`.

## Dépannage rapide

Si `start` échoue avec `not reachable after start`, commencez par dépanner l’état de préparation CDP. Si `start` et `tabs` réussissent mais que `open` ou `navigate` échoue, le plan de contrôle du navigateur est sain et l’échec vient généralement de la politique SSRF de navigation.

Séquence minimale :

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Guide détaillé : [Dépannage Browser](/fr/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

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

Remarques :

- `doctor --deep` ajoute une sonde d’instantané en direct. C’est utile lorsque l’état de préparation CDP de base est au vert mais que vous voulez la preuve que l’onglet actuel peut être inspecté.
- Pour les profils `attachOnly` et CDP distants, `openclaw browser stop` ferme la session de contrôle active et efface les remplacements d’émulation temporaires même lorsqu’OpenClaw n’a pas lancé lui-même le processus navigateur.
- Pour les profils locaux gérés, `openclaw browser stop` arrête le processus navigateur lancé.
- `openclaw browser start --headless` s’applique uniquement à cette requête de démarrage et seulement lorsqu’OpenClaw lance un navigateur local géré. Cela ne réécrit pas `browser.headless` ni la configuration du profil, et cela n’a aucun effet sur un navigateur déjà en cours d’exécution.
- Sur les hôtes Linux sans `DISPLAY` ou `WAYLAND_DISPLAY`, les profils locaux gérés s’exécutent automatiquement en mode headless sauf si `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` ou `browser.profiles.<name>.headless=false` demande explicitement un navigateur visible.

## Si la commande manque

Si `openclaw browser` est une commande inconnue, vérifiez `plugins.allow` dans `~/.openclaw/openclaw.json`.

Lorsque `plugins.allow` est présent, le plugin navigateur intégré doit être explicitement listé :

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` ne rétablit pas la sous-commande CLI lorsque la liste d’autorisation des plugins exclut `browser`.

Lié : [Outil Browser](/fr/tools/browser#missing-browser-command-or-tool)

## Profils

Les profils sont des configurations nommées de routage navigateur. En pratique :

- `openclaw` : lance ou attache une instance Chrome dédiée gérée par OpenClaw (répertoire de données utilisateur isolé).
- `user` : contrôle votre session Chrome existante déjà connectée via Chrome DevTools MCP.
- profils CDP personnalisés : pointent vers un point de terminaison CDP local ou distant.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Utiliser un profil spécifique :

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

`tabs` renvoie d’abord `suggestedTargetId`, puis le `tabId` stable tel que `t1`, le libellé facultatif et le `targetId` brut. Les agents doivent renvoyer `suggestedTargetId` dans `focus`, `close`, les instantanés et les actions. Vous pouvez attribuer un libellé avec `open --label`, `tab new --label` ou `tab label` ; les libellés, identifiants d’onglet, identifiants de cible bruts et préfixes uniques d’identifiant de cible sont tous acceptés. Lorsque Chromium remplace la cible brute sous-jacente pendant une navigation ou une soumission de formulaire, OpenClaw conserve le `tabId`/libellé stable attaché à l’onglet de remplacement lorsqu’il peut prouver la correspondance. Les identifiants de cible bruts restent volatils ; préférez `suggestedTargetId`.

## Instantané / capture d’écran / actions

Instantané :

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

Capture d’écran :

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

Remarques :

- `--full-page` est destiné uniquement aux captures de page ; il ne peut pas être combiné avec `--ref` ou `--element`.
- Les profils `existing-session` / `user` prennent en charge les captures de page et les captures `--ref` issues de la sortie d’instantané, mais pas les captures CSS `--element`.
- `--labels` superpose les refs d’instantané actuelles sur la capture d’écran.
- `snapshot --urls` ajoute les destinations de liens découvertes aux instantanés IA afin que les agents puissent choisir des cibles de navigation directes au lieu de deviner uniquement à partir du texte des liens.

Naviguer/cliquer/saisir (automatisation UI basée sur des refs) :

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

Les réponses d’action renvoient le `targetId` brut actuel après un remplacement de page déclenché par l’action lorsque OpenClaw peut prouver l’onglet de remplacement. Les scripts doivent quand même stocker et transmettre `suggestedTargetId`/les libellés pour les workflows de longue durée.

Aides pour fichiers + boîtes de dialogue :

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

Les profils Chrome gérés enregistrent les téléchargements ordinaires déclenchés par clic dans le répertoire de téléchargements OpenClaw (`/tmp/openclaw/downloads` par défaut, ou la racine temporaire configurée). Utilisez `waitfordownload` ou `download` lorsque l’agent doit attendre un fichier spécifique et renvoyer son chemin ; ces attentes explicites prennent en charge le téléchargement suivant.

## État et stockage

Viewport + émulation :

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

Cookies + stockage :

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

Utilisez le profil `user` intégré, ou créez votre propre profil `existing-session` :

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

Ce chemin est réservé à l’hôte. Pour Docker, serveurs headless, Browserless ou autres configurations distantes, utilisez plutôt un profil CDP.

Limites actuelles de existing-session :

- les actions pilotées par instantané utilisent des refs, pas des sélecteurs CSS
- `browser.actionTimeoutMs` prend en charge par défaut les requêtes `act` à 60000 ms lorsque les appelants omettent `timeoutMs` ; `timeoutMs` par appel reste prioritaire.
- `click` est limité au clic gauche
- `type` ne prend pas en charge `slowly=true`
- `press` ne prend pas en charge `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` et `evaluate` rejettent les remplacements de délai d’expiration par appel
- `select` ne prend en charge qu’une seule valeur
- `wait --load networkidle` n’est pas pris en charge
- les téléversements de fichiers nécessitent `--ref` / `--input-ref`, ne prennent pas en charge le CSS `--element` et prennent actuellement en charge un seul fichier à la fois
- les hooks de boîte de dialogue ne prennent pas en charge `--timeout`
- les captures d’écran prennent en charge les captures de page et `--ref`, mais pas le CSS `--element`
- `responsebody`, l’interception de téléchargement, l’export PDF et les actions par lot nécessitent toujours un navigateur géré ou un profil CDP brut

## Contrôle de navigateur distant (proxy hôte Node)

Si la Gateway s’exécute sur une autre machine que le navigateur, exécutez un **hôte Node** sur la machine qui possède Chrome/Brave/Edge/Chromium. La Gateway transmettra les actions navigateur à ce nœud (aucun serveur séparé de contrôle du navigateur n’est requis).

Utilisez `gateway.nodes.browser.mode` pour contrôler le routage automatique et `gateway.nodes.browser.node` pour épingler un nœud spécifique si plusieurs sont connectés.

Sécurité + configuration distante : [Outil Browser](/fr/tools/browser), [Accès distant](/fr/gateway/remote), [Tailscale](/fr/gateway/tailscale), [Sécurité](/fr/gateway/security)

## Lié

- [Référence CLI](/fr/cli)
- [Browser](/fr/tools/browser)
