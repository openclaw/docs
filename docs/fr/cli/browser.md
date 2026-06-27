---
read_when:
    - Vous utilisez `openclaw browser` et souhaitez des exemples pour les tâches courantes
    - Vous souhaitez contrôler un navigateur exécuté sur une autre machine via un hôte Node
    - Vous voulez vous connecter à votre Chrome local connecté via Chrome MCP
summary: Référence CLI pour `openclaw browser` (cycle de vie, profils, onglets, actions, état et débogage)
title: Navigateur
x-i18n:
    generated_at: "2026-06-27T17:17:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e45a6b89f23623c25b61d41273151b60da1fc415b5d3c901d8c555d8244f7a
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

Gérez la surface de contrôle du navigateur d’OpenClaw et exécutez des actions de navigateur (cycle de vie, profils, onglets, instantanés, captures d’écran, navigation, saisie, émulation d’état et débogage).

Associé :

- Outil de navigateur + API : [Outil de navigateur](/fr/tools/browser)

## Indicateurs courants

- `--url <gatewayWsUrl>` : URL WebSocket du Gateway (par défaut depuis la configuration).
- `--token <token>` : jeton du Gateway (si requis).
- `--timeout <ms>` : délai d’expiration de la requête (ms).
- `--expect-final` : attendre une réponse finale du Gateway.
- `--browser-profile <name>` : choisir un profil de navigateur (par défaut depuis la configuration).
- `--json` : sortie lisible par machine (lorsque pris en charge).

## Démarrage rapide (local)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Les agents peuvent exécuter le même contrôle de disponibilité avec `browser({ action: "doctor" })`.

## Dépannage rapide

Si `start` échoue avec `not reachable after start`, dépannez d’abord la disponibilité CDP. Si `start` et `tabs` réussissent mais que `open` ou `navigate` échoue, le plan de contrôle du navigateur est sain et l’échec relève généralement de la politique SSRF de navigation.

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
  disponibilité CDP de base est au vert, mais que vous voulez prouver que l’onglet
  actuel peut être inspecté.
- Pour les profils `attachOnly` et CDP distants, `openclaw browser stop` ferme la
  session de contrôle active et efface les surcharges d’émulation temporaires même lorsque
  OpenClaw n’a pas lancé lui-même le processus du navigateur.
- Pour les profils locaux gérés, `openclaw browser stop` arrête le processus de navigateur
  lancé.
- `openclaw browser start --headless` s’applique uniquement à cette requête de démarrage et
  seulement quand OpenClaw lance un navigateur local géré. Cela ne réécrit pas
  `browser.headless` ni la configuration du profil, et c’est sans effet pour un
  navigateur déjà en cours d’exécution.
- Sur les hôtes Linux sans `DISPLAY` ni `WAYLAND_DISPLAY`, les profils locaux gérés
  s’exécutent automatiquement en mode headless, sauf si `OPENCLAW_BROWSER_HEADLESS=0`,
  `browser.headless=false` ou `browser.profiles.<name>.headless=false`
  demande explicitement un navigateur visible.

## Si la commande est absente

Si `openclaw browser` est une commande inconnue, vérifiez `plugins.allow` dans
`~/.openclaw/openclaw.json`.

Lorsque `plugins.allow` est présent, listez explicitement le Plugin de navigateur groupé,
sauf si la configuration possède déjà un bloc racine `browser` :

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Un bloc racine `browser` explicite, par exemple `browser.enabled=true` ou
`browser.profiles.<name>`, active également le Plugin de navigateur groupé avec une
liste d’autorisation de Plugins restrictive.

Associé : [Outil de navigateur](/fr/tools/browser#missing-browser-command-or-tool)

## Profils

Les profils sont des configurations de routage de navigateur nommées. En pratique :

- `openclaw` : lance ou s’attache à une instance Chrome dédiée gérée par OpenClaw (répertoire de données utilisateur isolé).
- `user` : contrôle votre session Chrome connectée existante via Chrome DevTools MCP.
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
openclaw browser tab new --label docs
openclaw browser tab label t1 docs
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai --label docs
openclaw browser focus docs
openclaw browser close t1
```

`tabs` renvoie d’abord `suggestedTargetId`, puis le `tabId` stable comme `t1`,
l’étiquette facultative et le `targetId` brut. Les agents doivent repasser
`suggestedTargetId` à `focus`, `close`, aux instantanés et aux actions. Vous pouvez
attribuer une étiquette avec `open --label`, `tab new --label` ou `tab label` ; les étiquettes,
les ids d’onglet, les ids de cible bruts et les préfixes uniques d’id de cible sont tous acceptés.
Le champ de requête s’appelle toujours `targetId` pour compatibilité, mais il accepte
ces références d’onglet. Traitez les ids de cible bruts comme des identifiants de diagnostic, pas comme une
mémoire d’agent durable.
Lorsque Chromium remplace la cible brute sous-jacente pendant une navigation ou un envoi de
formulaire, OpenClaw conserve le `tabId` stable ou l’étiquette attachés à l’onglet de remplacement
lorsqu’il peut prouver la correspondance. Les ids de cible bruts restent volatils ; préférez
`suggestedTargetId`.

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

- `--full-page` est réservé aux captures de page ; il ne peut pas être combiné avec `--ref`
  ni `--element`.
- Les profils `existing-session` / `user` prennent en charge les captures d’écran de page et les captures
  `--ref` depuis la sortie d’instantané, mais pas les captures d’écran CSS `--element`.
- `--labels` superpose les refs de l’instantané actuel sur la capture d’écran. Sur les
  profils adossés à Playwright, cela fonctionne avec `--full-page` (superposition d’étiquettes
  pleine page), `--ref` (superposition d’étiquettes par découpe d’élément selon la ref ARIA) et `--element`
  (superposition d’étiquettes par découpe d’élément selon le sélecteur CSS) ; dans les modes de découpe
  d’élément, les étiquettes sont projetées relativement à l’élément. La réponse inclut aussi un
  tableau `annotations` avec la boîte englobante de chaque ref. Chaque élément contient `ref`,
  `number`, `role`, `name` facultatif et `box: {x, y, width, height}` ;
  les coordonnées sont dans l’espace de l’image capturée (viewport / fullpage /
  relatif à l’élément). Le champ est omis lorsqu’il est vide.
  Les profils `existing-session` affichent une superposition chrome-mcp sur les captures d’écran de page,
  mais n’utilisent pas l’assistant de projection Playwright et n’incluent pas
  `annotations` ; les captures d’écran CSS `--element` n’y sont pas prises en charge. Sans
  Playwright ni chrome-mcp, les captures d’écran étiquetées ne sont pas disponibles. Les versions
  précédentes ignoraient `--full-page`, `--ref` et `--element` sur les captures d’écran
  Playwright étiquetées et renvoyaient toujours une capture du viewport ; les captures d’écran
  étiquetées respectent désormais ces portées.
- `snapshot --urls` ajoute les destinations de liens découvertes aux instantanés IA afin que
  les agents puissent choisir des cibles de navigation directes au lieu de déduire uniquement depuis le texte
  des liens.

Naviguer/cliquer/saisir (automatisation d’interface fondée sur des refs) :

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
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
```

`evaluate --fn` accepte une source de fonction, une expression ou un corps d’instruction.
Les corps d’instruction sont enveloppés comme des fonctions async, donc utilisez `return` pour la valeur
que vous voulez récupérer. Utilisez `evaluate --timeout-ms <ms>` lorsque la fonction côté page peut
avoir besoin de plus de temps que le délai d’expiration d’évaluation par défaut.

Les réponses d’action renvoient le `targetId` brut actuel après un remplacement de page déclenché par l’action
lorsqu’OpenClaw peut prouver l’onglet de remplacement. Les scripts doivent tout de même
stocker et transmettre `suggestedTargetId`/les étiquettes pour les workflows de longue durée.

Assistants de fichiers et de boîtes de dialogue :

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

Les profils Chrome gérés enregistrent les téléchargements ordinaires déclenchés par clic dans le répertoire
de téléchargements d’OpenClaw (`/tmp/openclaw/downloads` par défaut, ou la racine temporaire
configurée). Utilisez `waitfordownload` ou `download` lorsque l’agent doit attendre un
fichier spécifique et renvoyer son chemin ; ces attentes explicites possèdent le prochain téléchargement.
Les téléversements acceptent les fichiers depuis la racine temporaire des téléversements d’OpenClaw et les médias
entrants gérés par OpenClaw, notamment les références `media://inbound/<id>` et
`media/inbound/<id>` relatives au bac à sable. Les refs de médias imbriquées, la traversée et les chemins
locaux arbitraires restent rejetés.
Lorsqu’une action ouvre une boîte de dialogue modale, la réponse d’action renvoie
`blockedByDialog` avec `browserState.dialogs.pending` ; transmettez `--dialog-id` pour
y répondre directement. Les boîtes de dialogue gérées hors d’OpenClaw apparaissent sous
`browserState.dialogs.recent`.

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

Utilisez le profil `user` intégré, ou créez votre propre profil `existing-session` :

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

Le chemin `existing-session` par défaut est une connexion automatique Chrome MCP locale à l’hôte. Si le navigateur est déjà
en cours d’exécution avec un point de terminaison DevTools, transmettez `--cdp-url` pour que Chrome MCP s’attache plutôt à ce point de terminaison.
Pour Docker, Browserless ou d’autres configurations distantes où la sémantique de Chrome MCP n’est pas nécessaire, utilisez un
profil CDP.

Limites actuelles de `existing-session` :

- les actions pilotées par instantané utilisent des refs, pas des sélecteurs CSS
- `browser.actionTimeoutMs` définit par défaut les requêtes `act` prises en charge à 60000 ms lorsque
  les appelants omettent `timeoutMs`; le `timeoutMs` par appel reste prioritaire.
- `click` correspond uniquement au clic gauche
- `type` ne prend pas en charge `slowly=true`
- `press` ne prend pas en charge `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` et `evaluate` rejettent
  les remplacements de délai d’expiration par appel
- `select` prend en charge une seule valeur
- `wait --load networkidle` n’est pas pris en charge sur les profils de session existants (fonctionne sur les profils CDP gérés et bruts/distants)
- les téléversements de fichiers nécessitent `--ref` / `--input-ref`, ne prennent pas en charge
  `--element` CSS, et prennent actuellement en charge un seul fichier à la fois
- les hooks de boîte de dialogue ne prennent pas en charge `--timeout`
- les captures d’écran prennent en charge les captures de page et `--ref`, mais pas
  `--element` CSS
- `responsebody`, l’interception des téléchargements, l’export PDF et les actions par lots nécessitent encore
  un navigateur géré ou un profil CDP brut

## Contrôle de navigateur distant (proxy d’hôte Node)

Si le Gateway s’exécute sur une machine différente de celle du navigateur, exécutez un **hôte Node** sur la machine qui dispose de Chrome/Brave/Edge/Chromium. Le Gateway transmettra les actions du navigateur à ce nœud (aucun serveur de contrôle de navigateur séparé n’est requis).

Utilisez `gateway.nodes.browser.mode` pour contrôler le routage automatique et `gateway.nodes.browser.node` pour épingler un nœud précis si plusieurs sont connectés.

Sécurité + configuration distante : [Outil de navigateur](/fr/tools/browser), [Accès distant](/fr/gateway/remote), [Tailscale](/fr/gateway/tailscale), [Sécurité](/fr/gateway/security)

## Connexe

- [Référence CLI](/fr/cli)
- [Navigateur](/fr/tools/browser)
