---
read_when:
    - Scriptage ou débogage du navigateur de l’agent via l’API de contrôle locale
    - Recherche de la référence CLI `openclaw browser`
    - Ajout d’une automatisation de navigateur personnalisée avec des instantanés et des références
summary: Référence de l’API de contrôle du navigateur OpenClaw, de la CLI et des actions de script
title: API de contrôle du navigateur
x-i18n:
    generated_at: "2026-06-27T18:15:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ccfd1ec996b0fc211e2aefa0554e0fa5c7b0899ca981836134a3741b38bf7600
    source_path: tools/browser-control.md
    workflow: 16
---

Pour l’installation, la configuration et le dépannage, consultez [Navigateur](/fr/tools/browser).
Cette page est la référence de l’API HTTP de contrôle local, de la CLI `openclaw browser`
et des modèles de script (instantanés, références, attentes, flux de débogage).

## API de contrôle (facultatif)

Pour les intégrations locales uniquement, le Gateway expose une petite API HTTP local loopback.
Ce serveur autonome est optionnel : définissez la variable d’environnement
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` dans l’environnement du service Gateway
et redémarrez le Gateway avant que les points de terminaison HTTP deviennent disponibles. Sans
cette variable, le runtime de contrôle du navigateur fonctionne toujours via la CLI et les
outils d’agent, mais rien n’écoute sur le port de contrôle local loopback.

- État/démarrage/arrêt : `GET /`, `POST /start`, `POST /stop`
- Onglets : `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Instantané/capture d’écran : `GET /snapshot`, `POST /screenshot`
- Actions : `POST /navigate`, `POST /act`
- Hooks : `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Téléchargements : `POST /download`, `POST /wait/download`
- Autorisations : `POST /permissions/grant`
- Débogage : `GET /console`, `POST /pdf`
- Débogage : `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Réseau : `POST /response/body`
- État : `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- État : `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Paramètres : `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Tous les points de terminaison acceptent `?profile=<name>`. `POST /start?headless=true` demande un
lancement headless ponctuel pour les profils gérés localement sans modifier la
configuration de navigateur persistée ; les profils attach-only, CDP distant et session existante refusent
ce remplacement, car OpenClaw ne lance pas ces processus de navigateur.

Pour les points de terminaison d’onglets, `targetId` est le nom du champ de compatibilité. Préférez passer
`suggestedTargetId` depuis `GET /tabs` ou `POST /tabs/open` ; les libellés et les handles `tabId`
comme `t1` sont aussi acceptés. Les identifiants de cible CDP bruts et les préfixes uniques d’identifiant de
cible brut fonctionnent encore, mais ce sont des handles de diagnostic volatils.

Si l’authentification Gateway par secret partagé est configurée, les routes HTTP du navigateur exigent aussi l’authentification :

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` ou authentification HTTP Basic avec ce mot de passe

Notes :

- Cette API de navigateur local loopback autonome ne consomme **pas** les en-têtes d’identité trusted-proxy ou
  Tailscale Serve.
- Si `gateway.auth.mode` vaut `none` ou `trusted-proxy`, ces routes de navigateur local loopback
  n’héritent pas de ces modes porteurs d’identité ; gardez-les limitées au local loopback.

### Contrat d’erreur de `/act`

`POST /act` utilise une réponse d’erreur structurée pour la validation au niveau de la route et
les échecs de stratégie :

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valeurs actuelles de `code` :

- `ACT_KIND_REQUIRED` (HTTP 400) : `kind` est manquant ou non reconnu.
- `ACT_INVALID_REQUEST` (HTTP 400) : la charge utile de l’action a échoué à la normalisation ou à la validation.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400) : `selector` a été utilisé avec un type d’action non pris en charge.
- `ACT_EVALUATE_DISABLED` (HTTP 403) : `evaluate` (ou `wait --fn`) est désactivé par la configuration.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403) : le `targetId` de premier niveau ou groupé est en conflit avec la cible de la requête.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501) : l’action n’est pas prise en charge pour les profils de session existante.

D’autres échecs d’exécution peuvent toujours renvoyer `{ "error": "<message>" }` sans champ
`code`.

### Exigence Playwright

Certaines fonctionnalités (navigate/act/instantané IA/instantané de rôles, captures d’écran d’éléments,
PDF) exigent Playwright. Si Playwright n’est pas installé, ces points de terminaison renvoient
une erreur 501 claire.

Ce qui fonctionne toujours sans Playwright :

- Instantanés ARIA
- Instantanés d’accessibilité de style rôle (`--interactive`, `--compact`,
  `--depth`, `--efficient`) lorsqu’un WebSocket CDP par onglet est disponible. Il s’agit
  d’un repli pour l’inspection et la découverte de références ; Playwright reste le moteur
  d’action principal.
- Captures d’écran de page pour le navigateur `openclaw` géré lorsqu’un WebSocket CDP par onglet
  est disponible
- Captures d’écran de page pour les profils `existing-session` / Chrome MCP
- Captures d’écran fondées sur les références `existing-session` (`--ref`) depuis la sortie d’instantané

Ce qui nécessite toujours Playwright :

- `navigate`
- `act`
- Instantanés IA qui dépendent du format d’instantané IA natif de Playwright
- Captures d’écran d’élément par sélecteur CSS (`--element`)
- export PDF complet du navigateur

Les captures d’écran d’éléments refusent aussi `--full-page` ; la route renvoie `fullPage is
not supported for element screenshots`.

Si vous voyez `Playwright is not available in this gateway build`, il manque au
Gateway empaqueté la dépendance principale du runtime de navigateur. Réinstallez ou mettez à jour
OpenClaw, puis redémarrez le Gateway. Pour Docker, installez aussi les binaires du navigateur
Chromium comme indiqué ci-dessous.

#### Installation de Playwright avec Docker

Si votre Gateway s’exécute dans Docker, évitez `npx playwright` (conflits de remplacement npm).
Pour les images personnalisées, intégrez Chromium dans l’image :

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

Pour une image existante, installez plutôt via la CLI groupée :

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Pour persister les téléchargements du navigateur, définissez `PLAYWRIGHT_BROWSERS_PATH` (par exemple,
`/home/node/.cache/ms-playwright`) et assurez-vous que `/home/node` est persisté via
`OPENCLAW_HOME_VOLUME` ou un montage bind. OpenClaw détecte automatiquement le
Chromium persisté sous Linux. Consultez [Docker](/fr/install/docker).

## Fonctionnement (interne)

Un petit serveur de contrôle local loopback accepte les requêtes HTTP et se connecte aux navigateurs basés sur Chromium via CDP. Les actions avancées (click/type/snapshot/PDF) passent par Playwright au-dessus de CDP ; lorsque Playwright est absent, seules les opérations hors Playwright sont disponibles. L’agent voit une interface stable unique tandis que les navigateurs et profils locaux/distants peuvent être remplacés librement en dessous.

## Référence rapide de la CLI

Toutes les commandes acceptent `--browser-profile <name>` pour cibler un profil précis, et `--json` pour une sortie lisible par machine.

<AccordionGroup>

<Accordion title="Bases : état, onglets, ouvrir/focaliser/fermer">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # one-shot local managed headless launch
openclaw browser stop            # also clears emulation on attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # shortcut for current tab
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Inspection : capture d’écran, instantané, console, erreurs, requêtes">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # or --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Actions : naviguer, cliquer, saisir, glisser, attendre, évaluer">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # or e12 for role refs
openclaw browser click-coords 120 340        # viewport coordinates
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser upload media://inbound/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="État : cookies, stockage, hors ligne, en-têtes, géolocalisation, appareil">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear to remove
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Notes :

- `upload` et `dialog` sont des appels d’**armement** ; exécutez-les avant le clic/la pression de touche qui déclenche le sélecteur/la boîte de dialogue. Si une action ouvre une fenêtre modale, la réponse de l’action inclut `blockedByDialog` et `browserState.dialogs.pending` ; passez ce `dialogId` pour répondre directement. Les boîtes de dialogue gérées hors d’OpenClaw apparaissent sous `browserState.dialogs.recent`.
- `click`/`type`/etc exigent une `ref` issue de `snapshot` (`12` numérique, référence de rôle `e12` ou référence ARIA actionnable `ax12`). Les sélecteurs CSS ne sont volontairement pas pris en charge pour les actions. Utilisez `click-coords` lorsque la position visible dans la fenêtre d’affichage est la seule cible fiable.
- Les chemins de téléchargement et de trace sont limités aux racines temporaires OpenClaw : `/tmp/openclaw{,/downloads}` (repli : `${os.tmpdir()}/openclaw/...`).
- `upload` accepte les fichiers depuis la racine temporaire de téléversements OpenClaw et
  les médias entrants gérés par OpenClaw. Les médias entrants gérés peuvent être référencés comme
  `media://inbound/<id>`, `media/inbound/<id>` relatif au sandbox, ou un chemin résolu
  dans le répertoire de médias entrants gérés. Les références média imbriquées,
  la traversée de répertoires, les liens symboliques, les liens physiques et les chemins locaux arbitraires restent refusés.
- `upload` peut aussi définir directement les entrées de fichiers via `--input-ref` ou `--element`.

Les identifiants et libellés d’onglets stables survivent au remplacement de cible brute Chromium lorsque OpenClaw
peut prouver l’onglet de remplacement, par exemple avec la même URL ou un seul ancien onglet devenant un
seul nouvel onglet après soumission de formulaire. Les identifiants de cible bruts restent volatils ; préférez
`suggestedTargetId` depuis `tabs` dans les scripts.

Aperçu des indicateurs d’instantané :

- `--format ai` (par défaut avec Playwright) : instantané IA avec références numériques (`aria-ref="<n>"`).
- `--format aria` : arbre d’accessibilité avec références `axN`. Lorsque Playwright est disponible, OpenClaw lie les références aux identifiants DOM backend de la page active afin que les actions de suivi puissent les utiliser ; sinon, traitez la sortie comme destinée uniquement à l’inspection.
- `--efficient` (ou `--mode efficient`) : préréglage compact d’instantané de rôles. Définissez `browser.snapshotDefaults.mode: "efficient"` pour en faire la valeur par défaut (voir [configuration du Gateway](/fr/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` forcent un instantané de rôles avec des références `ref=e12`. `--frame "<iframe>"` limite les instantanés de rôles à une iframe.
- Avec Playwright, `--labels` ajoute une capture d’écran avec des étiquettes de références superposées
  (affiche `MEDIA:<path>`) ainsi qu’un tableau `annotations` contenant la boîte
  englobante de chaque référence. Sur `screenshot`, les étiquettes adossées à
  Playwright fonctionnent avec `--full-page`, `--ref` et `--element` ; sur
  `snapshot`, la capture d’écran associée reste limitée à la fenêtre d’affichage.
  Les profils de session existante/chrome-mcp affichent les étiquettes superposées
  sur les captures d’écran de page, mais ne renvoient pas `annotations` et
  n’utilisent pas l’assistant de projection pleine page/référence/élément de
  Playwright. Sans Playwright ni chrome-mcp, les captures d’écran étiquetées ne
  sont pas disponibles.
- `--urls` ajoute les destinations de liens découvertes aux instantanés IA.

## Instantanés et références

OpenClaw prend en charge deux styles d’« instantané » :

- **Instantané IA (références numériques)** : `openclaw browser snapshot` (par défaut ; `--format ai`)
  - Sortie : un instantané texte qui inclut des références numériques.
  - Actions : `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - En interne, la référence est résolue via `aria-ref` de Playwright.

- **Instantané de rôles (références de rôle comme `e12`)** : `openclaw browser snapshot --interactive` (ou `--compact`, `--depth`, `--selector`, `--frame`)
  - Sortie : une liste/arborescence basée sur les rôles avec `[ref=e12]` (et éventuellement `[nth=1]`).
  - Actions : `openclaw browser click e12`, `openclaw browser highlight e12`.
  - En interne, la référence est résolue via `getByRole(...)` (plus `nth()` pour les doublons).
  - Ajoutez `--labels` pour inclure une capture d’écran avec des étiquettes
    `e12` superposées. Sur les profils adossés à Playwright, cela renvoie aussi
    des métadonnées de boîte englobante par référence (`annotations[]`).
  - Ajoutez `--urls` lorsque le texte du lien est ambigu et que l’agent a besoin
    de cibles de navigation concrètes.

- **Instantané ARIA (références ARIA comme `ax12`)** : `openclaw browser snapshot --format aria`
  - Sortie : l’arbre d’accessibilité sous forme de nœuds structurés.
  - Actions : `openclaw browser click ax12` fonctionne lorsque le chemin
    d’instantané peut lier la référence via Playwright et les identifiants DOM
    backend de Chrome.
- Si Playwright n’est pas disponible, les instantanés ARIA peuvent tout de même
  être utiles pour l’inspection, mais les références peuvent ne pas être
  exploitables. Reprenez un instantané avec `--format ai` ou `--interactive`
  lorsque vous avez besoin de références d’action.
- Preuve Docker pour le chemin de repli CDP brut : `pnpm test:docker:browser-cdp-snapshot`
  démarre Chromium avec CDP, exécute `browser doctor --deep` et vérifie que les
  instantanés de rôles incluent les URL de liens, les éléments cliquables promus
  par curseur et les métadonnées d’iframe.

Comportement des références :

- Les références ne sont **pas stables entre les navigations** ; en cas d’échec, relancez `snapshot` et utilisez une nouvelle référence.
- `/act` renvoie le `targetId` brut actuel après un remplacement déclenché par
  une action lorsqu’il peut prouver l’onglet de remplacement. Continuez à utiliser
  des identifiants/étiquettes d’onglets stables pour les commandes suivantes.
- Si l’instantané de rôles a été pris avec `--frame`, les références de rôle sont limitées à cette iframe jusqu’au prochain instantané de rôles.
- Les références `axN` inconnues ou périmées échouent rapidement au lieu de
  retomber sur le sélecteur `aria-ref` de Playwright. Exécutez un nouvel
  instantané sur le même onglet lorsque cela se produit.

## Capacités d’attente avancées

Vous pouvez attendre davantage que du temps ou du texte :

- Attendre une URL (globs pris en charge par Playwright) :
  - `openclaw browser wait --url "**/dash"`
- Attendre un état de chargement :
  - `openclaw browser wait --load networkidle`
  - Pris en charge sur les profils CDP gérés `openclaw` et bruts/distants. Les profils `user` et `existing-session` rejettent `networkidle` ; utilisez plutôt `--url`, `--text`, un sélecteur ou des attentes `--fn`.
- Attendre un prédicat JS :
  - `openclaw browser wait --fn "window.ready===true"`
- Attendre qu’un sélecteur devienne visible :
  - `openclaw browser wait "#main"`

Ils peuvent être combinés :

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Flux de débogage

Lorsqu’une action échoue (par exemple « non visible », « violation du mode strict », « couvert ») :

1. `openclaw browser snapshot --interactive`
2. Utilisez `click <ref>` / `type <ref>` (préférez les références de rôle en mode interactif)
3. Si l’échec persiste : `openclaw browser highlight <ref>` pour voir ce que Playwright cible
4. Si la page se comporte étrangement :
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Pour un débogage approfondi : enregistrez une trace :
   - `openclaw browser trace start`
   - reproduisez le problème
   - `openclaw browser trace stop` (affiche `TRACE:<path>`)

## Sortie JSON

`--json` est destiné aux scripts et aux outils structurés.

Exemples :

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Les instantanés de rôles en JSON incluent `refs` ainsi qu’un petit bloc `stats` (lignes/caractères/références/interactif) afin que les outils puissent raisonner sur la taille et la densité de la charge utile.

## Paramètres d’état et d’environnement

Ils sont utiles pour les flux de travail du type « faire se comporter le site comme X » :

- Cookies : `cookies`, `cookies set`, `cookies clear`
- Stockage : `storage local|session get|set|clear`
- Hors ligne : `set offline on|off`
- En-têtes : `set headers --headers-json '{"X-Debug":"1"}'` (l’ancien `set headers --json '{"X-Debug":"1"}'` reste pris en charge)
- Authentification HTTP basique : `set credentials user pass` (ou `--clear`)
- Géolocalisation : `set geo <lat> <lon> --origin "https://example.com"` (ou `--clear`)
- Média : `set media dark|light|no-preference|none`
- Fuseau horaire / locale : `set timezone ...`, `set locale ...`
- Appareil / fenêtre d’affichage :
  - `set device "iPhone 14"` (préréglages d’appareils Playwright)
  - `set viewport 1280 720`

## Sécurité et confidentialité

- Le profil de navigateur openclaw peut contenir des sessions connectées ; traitez-le comme sensible.
- `browser act kind=evaluate` / `openclaw browser evaluate` et `wait --fn`
  exécutent du JavaScript arbitraire dans le contexte de la page. Une injection
  de prompt peut orienter cela. Désactivez-le avec `browser.evaluateEnabled=false`
  si vous n’en avez pas besoin.
- `openclaw browser evaluate --fn` accepte la source d’une fonction, une
  expression ou un corps d’instruction. Les corps d’instruction sont enveloppés
  dans des fonctions asynchrones ; utilisez donc `return` pour la valeur que vous
  souhaitez récupérer. Utilisez `--timeout-ms <ms>` lorsque la fonction côté page
  peut nécessiter plus de temps que le délai d’évaluation par défaut.
- Pour les connexions et les notes anti-bot (X/Twitter, etc.), consultez [Connexion navigateur + publication X/Twitter](/fr/tools/browser-login).
- Gardez l’hôte Gateway/nœud privé (loopback ou tailnet uniquement).
- Les points de terminaison CDP distants sont puissants ; tunnelisez-les et protégez-les.

Exemple de mode strict (bloquer les destinations privées/internes par défaut) :

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exact allow
    },
  },
}
```

## Connexe

- [Navigateur](/fr/tools/browser) - vue d’ensemble, configuration, profils, sécurité
- [Connexion navigateur](/fr/tools/browser-login) - connexion aux sites
- [Dépannage du navigateur sous Linux](/fr/tools/browser-linux-troubleshooting)
- [Dépannage du navigateur WSL2](/fr/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
