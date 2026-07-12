---
read_when:
    - Vous utilisez `openclaw browser` et souhaitez des exemples pour les tâches courantes
    - Vous souhaitez contrôler un navigateur exécuté sur une autre machine via un hôte Node
    - Vous souhaitez vous connecter à votre instance locale de Chrome authentifiée via Chrome MCP
summary: Référence de la CLI pour `openclaw browser` (cycle de vie, profils, onglets, actions, état et débogage)
title: Navigateur
x-i18n:
    generated_at: "2026-07-12T15:08:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 50e9da3fa6899d830e38d8548313c70b5615c2ed3d70dd372a1fe147ff5db053
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

Gérez la surface de contrôle du navigateur d’OpenClaw et exécutez des actions dans le navigateur : cycle de vie, profils, onglets, instantanés, captures d’écran, navigation, saisie, émulation d’état et débogage.

Voir aussi : [Outil de navigateur](/fr/tools/browser)

## Options courantes

- `--url <gatewayWsUrl>` : URL WebSocket du Gateway (utilise la configuration par défaut).
- `--token <token>` : jeton du Gateway (si requis).
- `--timeout <ms>` : délai d’expiration de la requête en ms (valeur par défaut : `30000`).
- `--expect-final` : attendre une réponse finale du Gateway.
- `--browser-profile <name>` : choisir un profil de navigateur (valeur par défaut : `openclaw`, ou `browser.defaultProfile`).
- `--json` : sortie lisible par une machine (lorsqu’elle est prise en charge). Il s’agit d’une option au niveau du navigateur ; placez-la donc avant la sous-commande pour obtenir une forme non ambiguë, telle que
  `openclaw browser --json status`. Un placement à la fin, comme
  `openclaw browser status --json`, fonctionne également lorsque la sous-commande sélectionnée ne
  définit pas sa propre option `--json`.

## Démarrage rapide (local)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Les agents peuvent effectuer la même vérification de disponibilité avec `browser({ action: "doctor" })`.

## Dépannage rapide

Si `start` échoue avec `not reachable after start`, commencez par diagnostiquer la disponibilité de CDP. Si `start` et `tabs` réussissent, mais que `open` ou `navigate` échoue, le plan de contrôle du navigateur fonctionne correctement et l’échec est généralement dû à un blocage par la politique SSRF de navigation.

Séquence minimale :

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Instructions détaillées : [Dépannage du navigateur](/fr/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

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

- `doctor --deep` ajoute une sonde d’instantané en direct : utile lorsque la vérification de disponibilité CDP de base est positive, mais que vous souhaitez confirmer que l’onglet actuel peut être inspecté.
- Pour un profil local géré en cours d’exécution, `status` et `doctor` indiquent les
  diagnostics graphiques mis en cache provenant de Chrome : classification matérielle/logicielle, moteur de rendu,
  backend, appareil/pilote, détails sur les fonctionnalités et leur état désactivé, ainsi que les capacités
  vidéo accélérées. `openclaw browser --json status` renvoie la charge utile structurée complète.
  La vérification passive de l’état ne lance jamais Chrome uniquement pour recueillir ces informations.
- `stop` ferme la session de contrôle active et efface les remplacements temporaires d’émulation, même pour les profils `attachOnly` et CDP distants pour lesquels OpenClaw n’a pas lancé lui-même le processus du navigateur. Pour les profils locaux gérés, `stop` arrête également le processus de navigateur généré.
- `start --headless` s’applique uniquement à cette requête de démarrage, et seulement lorsqu’OpenClaw lance un navigateur local géré. Cette option ne réécrit pas `browser.headless` ni la configuration du profil, et n’a aucun effet sur un navigateur déjà en cours d’exécution.
- Sur les hôtes Linux dépourvus de `DISPLAY` ou `WAYLAND_DISPLAY`, les profils locaux gérés s’exécutent automatiquement en mode headless, sauf si `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` ou `browser.profiles.<name>.headless=false` demande explicitement un navigateur visible.

## Si la commande est absente

Si `openclaw browser` est une commande inconnue, vérifiez `plugins.allow` dans `~/.openclaw/openclaw.json`. Lorsque `plugins.allow` est présent, ajoutez explicitement le plugin de navigateur intégré, sauf si la configuration contient déjà un bloc `browser` racine :

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Un bloc `browser` racine explicite (par exemple `browser.enabled=true` ou `browser.profiles.<name>`) active également le plugin de navigateur intégré lorsqu’une liste d’autorisation restrictive de plugins est utilisée.

Voir aussi : [Outil de navigateur](/fr/tools/browser#missing-browser-command-or-tool)

## Profils

Les profils sont des configurations nommées de routage du navigateur :

- `openclaw` (valeur par défaut) : lance une instance Chrome dédiée gérée par OpenClaw ou s’y connecte (répertoire de données utilisateur isolé).
- `user` : contrôle votre session Chrome existante et authentifiée via Chrome DevTools MCP.
- profils CDP personnalisés : pointent vers un point de terminaison CDP local ou distant.

```bash
openclaw browser profiles
openclaw browser system-profiles
openclaw browser system-profiles --browser brave
openclaw browser import-profile --browser chrome --system Default --into imported
openclaw browser import-profile --system "Profile 1" --into work --domains google.com,youtube.com
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Utilisez un profil spécifique avec `--browser-profile <name>` sur n’importe quelle sous-commande, par exemple `openclaw browser --browser-profile work tabs`.

Sous macOS, `system-profiles` répertorie les profils Chrome, Brave, Edge ou Chromium réels disponibles sur l’hôte. `import-profile` déchiffre leurs cookies après une seule demande de consentement du trousseau macOS/Touch ID et les injecte dans un nouveau profil géré par OpenClaw. Seuls les cookies sont importés ; le stockage local et IndexedDB restent inchangés. Certaines sessions Google utilisent des identifiants de session liés à l’appareil (DBSC) et peuvent toujours nécessiter une nouvelle authentification après l’importation.

Lorsque l’application macOS utilise un Gateway local, elle peut proposer cette importation une fois et définir le profil isolé importé comme profil par défaut pour la navigation de l’agent. L’importation nécessite toujours un clic explicite ; une importation réussie ou l’abandon de l’invite empêche les invites automatiques ultérieures, et **Settings → General → Browser login** reste disponible pour effectuer une nouvelle importation.

L’importation de profils système est activée par défaut. Définissez `browser.allowSystemProfileImport=false` pour désactiver les importations déclenchées à la fois par la CLI et par les agents. L’importation est locale à l’hôte et ne peut pas être effectuée via le proxy du Node de navigateur.

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

`tabs` renvoie d’abord `suggestedTargetId`, puis le `tabId` stable (tel que `t1`), le libellé facultatif et le `targetId` brut. Réutilisez `suggestedTargetId` avec `focus`, `close`, les instantanés et les actions. Attribuez un libellé avec `open --label`, `tab new --label` ou `tab label` ; les libellés, identifiants d’onglet, identifiants de cible bruts et préfixes uniques d’identifiant de cible sont tous acceptés. Le champ de requête reste nommé `targetId` pour des raisons de compatibilité, mais accepte n’importe laquelle de ces références d’onglet.

Les identifiants de cible bruts sont des références de diagnostic volatiles, et non une mémoire durable de l’agent : lorsque Chromium remplace la cible brute sous-jacente pendant une navigation ou l’envoi d’un formulaire, OpenClaw conserve le `tabId` stable ou le libellé associé à l’onglet de remplacement lorsqu’il peut établir la correspondance. Privilégiez `suggestedTargetId`.

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

- `--full-page` est réservé aux captures de page ; cette option ne peut pas être combinée avec `--ref` ou `--element`.
- Les profils `existing-session` / `user` prennent en charge les captures d’écran de page et les captures `--ref` provenant de la sortie d’un instantané, mais pas les captures CSS `--element`.
- `--labels` superpose les références de l’instantané actuel sur la capture d’écran. Sur les profils reposant sur Playwright, cette option fonctionne avec `--full-page` (superposition sur toute la page), `--ref` (superposition sur une zone découpée par élément selon une référence ARIA) et `--element` (superposition sur une zone découpée par élément selon un sélecteur CSS) ; dans les modes de découpage par élément, les libellés sont projetés par rapport à l’élément. La réponse comprend également un tableau `annotations` (omis lorsqu’il est vide) contenant le cadre englobant de chaque référence : `ref`, `number`, `role`, `name` facultatif et `box: {x, y, width, height}` dans l’espace de coordonnées de l’image capturée (fenêtre d’affichage / page entière / relatif à l’élément).
  Les profils `existing-session` affichent une superposition chrome-mcp sur les captures d’écran de page, mais n’utilisent pas l’assistant de projection Playwright et n’incluent pas `annotations` ; les captures CSS `--element` n’y sont pas prises en charge. Sans Playwright ni chrome-mcp, les captures d’écran avec libellés ne sont pas disponibles.
- `snapshot --urls` ajoute les destinations de liens découvertes aux instantanés d’IA afin que les agents puissent choisir des cibles de navigation directes au lieu de les déduire uniquement à partir du texte des liens.

Navigation/clic/saisie (automatisation de l’interface basée sur les références) :

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

`evaluate --fn` accepte le code source d’une fonction, une expression ou un corps d’instructions. Les corps d’instructions sont encapsulés sous forme de fonctions asynchrones ; utilisez donc `return` pour la valeur que vous souhaitez récupérer. Utilisez `--timeout-ms` lorsque la fonction exécutée dans la page peut nécessiter plus de temps que le délai d’expiration d’évaluation par défaut. `browser.evaluateEnabled=false` (valeur par défaut : `true`) désactive à la fois `evaluate` et `wait --fn`.

Les réponses aux actions renvoient le `targetId` brut actuel après un remplacement de page déclenché par une action lorsqu’OpenClaw peut établir l’onglet de remplacement. Les scripts doivent néanmoins stocker et transmettre `suggestedTargetId` ou les libellés pour les workflows de longue durée.

Assistants pour les fichiers et les boîtes de dialogue :

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

Les profils Chrome gérés enregistrent les téléchargements ordinaires déclenchés par un clic dans le répertoire de téléchargements d’OpenClaw (`/tmp/openclaw/downloads` par défaut, ou la racine temporaire configurée). Utilisez `waitfordownload` ou `download` lorsque l’agent doit attendre un fichier précis et renvoyer son chemin ; ces dispositifs d’attente explicites prennent en charge le téléchargement suivant. Les téléversements acceptent les fichiers provenant de la racine temporaire des téléversements d’OpenClaw et des médias entrants gérés par OpenClaw, notamment les références `media://inbound/<id>` et `media/inbound/<id>` relatives au bac à sable. Les références de médias imbriquées, la traversée de répertoires et les chemins locaux arbitraires sont rejetés.

Lorsqu’une action ouvre une boîte de dialogue modale, sa réponse renvoie `blockedByDialog` avec `browserState.dialogs.pending` ; transmettez `--dialog-id` pour y répondre directement. Les boîtes de dialogue traitées en dehors d’OpenClaw apparaissent sous `browserState.dialogs.recent`.

## État et stockage

Fenêtre d’affichage et émulation :

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

Cookies et stockage :

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

Utilisez le profil `user` intégré ou créez votre propre profil `existing-session` :

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

Le chemin existing-session par défaut est la connexion automatique à Chrome MCP, uniquement sur l’hôte. Si le navigateur est déjà en cours d’exécution avec un point de terminaison DevTools, transmettez `--cdp-url` afin que Chrome MCP se connecte plutôt à ce point de terminaison. Pour Docker, Browserless ou d’autres configurations distantes où la sémantique de Chrome MCP n’est pas nécessaire, utilisez plutôt un profil CDP.

Limites actuelles d’existing-session :

- Les actions pilotées par instantané utilisent des références, et non des sélecteurs CSS.
- `browser.actionTimeoutMs` applique par défaut un délai de 60000 ms aux requêtes `act` prises en charge lorsque les appelants omettent `timeoutMs` ; la valeur `timeoutMs` définie pour chaque appel reste prioritaire.
- `click` prend uniquement en charge le clic gauche.
- `type` ne prend pas en charge `slowly=true`.
- `press` ne prend pas en charge `delayMs`.
- `hover`, `scrollintoview`, `drag`, `select` et `fill` rejettent les remplacements de délai d’expiration par appel ; `evaluate` accepte `--timeout-ms`.
- `select` ne prend en charge qu’une seule valeur.
- `wait --load networkidle` n’est pas pris en charge (fonctionne avec les profils CDP gérés et bruts/distants).
- Les téléversements de fichiers nécessitent `--ref` / `--input-ref`, ne prennent pas en charge l’élément CSS `--element` et ne permettent de téléverser qu’un fichier à la fois.
- Les gestionnaires de boîtes de dialogue ne prennent pas en charge `--timeout`.
- Les captures d’écran prennent en charge les captures de page et `--ref`, mais pas l’élément CSS `--element`.
- `responsebody`, l’interception des téléchargements, l’exportation au format PDF et les actions par lots nécessitent toujours un navigateur géré ou un profil CDP brut.

## Contrôle distant du navigateur (proxy de l’hôte Node)

Si le Gateway s’exécute sur une autre machine que le navigateur, exécutez un **hôte Node** sur la machine équipée de Chrome/Brave/Edge/Chromium. Le Gateway transmet les actions du navigateur à ce Node ; aucun serveur distinct de contrôle du navigateur n’est nécessaire.

Utilisez `gateway.nodes.browser.mode` pour contrôler le routage automatique et `gateway.nodes.browser.node` pour désigner un Node spécifique si plusieurs sont connectés.

Sécurité et configuration à distance : [Outil de navigateur](/fr/tools/browser), [Accès distant](/fr/gateway/remote), [Tailscale](/fr/gateway/tailscale), [Sécurité](/fr/gateway/security)

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Navigateur](/fr/tools/browser)
