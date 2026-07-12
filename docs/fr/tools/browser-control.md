---
read_when:
    - Scripter ou déboguer le navigateur de l’agent via l’API de contrôle locale
    - Vous recherchez la référence de la CLI `openclaw browser` ?
    - Ajout d’une automatisation personnalisée du navigateur avec des instantanés et des références
summary: API de contrôle du navigateur OpenClaw, référence de la CLI et actions de script
title: API de contrôle du navigateur
x-i18n:
    generated_at: "2026-07-12T16:01:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8063f55c9881e45e65492dc40e2902bf05feb08ae9a74986ba2d7621e0dbe71a
    source_path: tools/browser-control.md
    workflow: 16
---

Pour l’installation, la configuration et le dépannage, consultez [Navigateur](/fr/tools/browser).
Cette page constitue la référence pour l’API HTTP locale de contrôle, la CLI
`openclaw browser` et les modèles de script (instantanés, références, attentes, flux de débogage).

## API de contrôle (facultative)

Pour les intégrations locales uniquement, le Gateway expose une petite API HTTP sur l’interface de bouclage.
Ce serveur autonome est facultatif — définissez la variable d’environnement
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` dans l’environnement du service Gateway
et redémarrez le Gateway avant que les points de terminaison HTTP deviennent disponibles. Sans
cette variable, l’environnement d’exécution de contrôle du navigateur fonctionne toujours par l’intermédiaire de la CLI et
des outils de l’agent, mais rien n’écoute sur le port de contrôle de l’interface de bouclage.

- État/démarrage/arrêt : `GET /`, `GET /doctor`, `POST /start`, `POST /stop`, `POST /reset-profile`
- Profils : `GET /profiles`, `POST /profiles/create`, `DELETE /profiles/:name`
- Onglets : `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`, `POST /tabs/action`
- Instantané/capture d’écran : `GET /snapshot`, `POST /screenshot`
- Actions : `POST /navigate`, `POST /act`
- Crochets : `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Téléchargements : `POST /download`, `POST /wait/download`
- Autorisations : `POST /permissions/grant`
- Débogage : `GET /console`, `POST /pdf`
- Débogage : `GET /errors`, `GET /requests`, `GET /dialogs`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Réseau : `POST /response/body`
- État : `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- État : `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Paramètres : `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

`POST /tabs/action` est la forme groupée que la CLI utilise en interne pour les
sous-commandes `browser tab` (`{"action":"new"|"label"|"select"|"close"|"list", ...}`) ;
pour les scripts directs, privilégiez les routes d’onglet spécialisées ci-dessus.

Tous les points de terminaison acceptent `?profile=<name>`. `POST /start?headless=true` demande un
lancement ponctuel sans interface graphique pour les profils locaux gérés, sans modifier la configuration
persistante du navigateur ; les profils limités à la connexion, CDP distants et de session existante refusent
cette substitution, car OpenClaw ne lance pas ces processus de navigateur.

Pour les points de terminaison d’onglet, `targetId` est le nom de champ de compatibilité. Privilégiez
`suggestedTargetId` provenant de `GET /tabs` ou `POST /tabs/open` ; les étiquettes et les identifiants
`tabId` tels que `t1` sont également acceptés. Les identifiants cibles CDP bruts et les préfixes uniques
d’identifiants cibles bruts fonctionnent toujours, mais ce sont des identifiants de diagnostic volatils.

Si l’authentification du Gateway par secret partagé est configurée, les routes HTTP du navigateur exigent également une authentification :

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` ou une authentification HTTP Basic avec ce mot de passe

Remarques :

- Cette API autonome du navigateur sur l’interface de bouclage ne consomme **pas** les en-têtes d’identité
  d’un proxy de confiance ou de Tailscale Serve.
- Si `gateway.auth.mode` vaut `none` ou `trusted-proxy`, ces routes du navigateur sur l’interface de
  bouclage n’héritent pas de ces modes porteurs d’identité ; limitez-les à l’interface de bouclage.

### Contrat d’erreur de `/act`

`POST /act` utilise une réponse d’erreur structurée pour les échecs de validation au niveau de la route et
les échecs de politique :

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valeurs actuelles de `code` :

- `ACT_KIND_REQUIRED` (HTTP 400) : `kind` est absent ou non reconnu.
- `ACT_INVALID_REQUEST` (HTTP 400) : la charge utile de l’action a échoué lors de la normalisation ou de la validation.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400) : `selector` a été utilisé avec un type d’action non pris en charge.
- `ACT_EVALUATE_DISABLED` (HTTP 403) : `evaluate` (ou `wait --fn`) est désactivé par la configuration.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403) : le `targetId` de niveau supérieur ou groupé est en conflit avec la cible de la requête.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501) : l’action n’est pas prise en charge pour les profils de session existante.

Les autres échecs d’exécution peuvent toujours renvoyer `{ "error": "<message>" }` sans champ
`code`.

### Exigence relative à Playwright

Certaines fonctionnalités (navigation/action/instantané IA/instantané par rôle, captures d’écran d’éléments,
PDF) nécessitent Playwright. Si Playwright n’est pas installé, ces points de terminaison renvoient
une erreur 501 explicite.

Ce qui fonctionne encore sans Playwright :

- Instantanés ARIA
- Instantanés d’accessibilité de type rôle (`--interactive`, `--compact`,
  `--depth`, `--efficient`) lorsqu’un WebSocket CDP propre à l’onglet est disponible. Il s’agit
  d’une solution de repli pour l’inspection et la découverte de références ; Playwright reste le principal
  moteur d’action.
- Captures d’écran de page pour le navigateur `openclaw` géré lorsqu’un WebSocket CDP
  propre à l’onglet est disponible
- Captures d’écran de page pour les profils `existing-session` / Chrome MCP
- Captures d’écran basées sur des références (`--ref`) pour `existing-session`, à partir de la sortie d’instantané

Ce qui nécessite toujours Playwright :

- `navigate`
- `act`
- Les instantanés IA qui dépendent du format d’instantané IA natif de Playwright
- Les captures d’écran d’éléments avec sélecteur CSS (`--element`)
- L’export PDF complet du navigateur

Les captures d’écran d’éléments refusent également `--full-page` ; la route renvoie `fullPage is
not supported for element screenshots`.

Si vous voyez `Playwright is not available in this gateway build`, la version empaquetée du
Gateway ne contient pas la dépendance principale de l’environnement d’exécution du navigateur. Réinstallez ou mettez à jour
OpenClaw, puis redémarrez le Gateway. Pour Docker, installez également les
binaires du navigateur Chromium comme indiqué ci-dessous.

#### Installation de Playwright dans Docker

Si votre Gateway s’exécute dans Docker, évitez `npx playwright` (conflits de substitution npm).
Pour les images personnalisées, intégrez Chromium dans l’image :

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

Pour une image existante, effectuez plutôt l’installation au moyen de la CLI intégrée :

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Pour conserver les téléchargements du navigateur, définissez `PLAYWRIGHT_BROWSERS_PATH` (par exemple,
`/home/node/.cache/ms-playwright`) et assurez-vous que `/home/node` est conservé au moyen de
`OPENCLAW_HOME_VOLUME` ou d’un montage lié. OpenClaw détecte automatiquement l’installation persistante de
Chromium sous Linux. Consultez [Docker](/fr/install/docker).

## Fonctionnement (interne)

Un petit serveur de contrôle sur l’interface de bouclage accepte les requêtes HTTP et se connecte aux navigateurs basés sur Chromium au moyen de CDP. Les actions avancées (clic/saisie/instantané/PDF) passent par Playwright au-dessus de CDP ; lorsque Playwright est absent, seules les opérations qui ne dépendent pas de Playwright sont disponibles. L’agent dispose d’une interface stable tandis que les navigateurs et profils locaux ou distants peuvent être remplacés librement en arrière-plan.

## Référence rapide de la CLI

Toutes les commandes acceptent `--browser-profile <name>` pour cibler un profil particulier et `--json` pour produire une sortie exploitable par une machine.

<AccordionGroup>

<Accordion title="Principes de base : état, onglets, ouverture/sélection/fermeture">

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep    # ajoute une sonde d’instantané en direct
openclaw browser start
openclaw browser start --headless # lancement ponctuel local géré sans interface graphique
openclaw browser stop            # efface aussi l’émulation pour les connexions seules/CDP distants
openclaw browser reset-profile   # déplace les données du navigateur du profil vers la corbeille
openclaw browser tabs
openclaw browser tab             # raccourci vers l’onglet actuel
openclaw browser tab new
openclaw browser tab new --label research
openclaw browser tab label abcd1234 research
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Profils : lister, créer, supprimer">

```bash
openclaw browser profiles
openclaw browser create-profile --name research --color "#0066CC"
openclaw browser create-profile --name attach --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser delete-profile --name research
```

</Accordion>

<Accordion title="Inspection : capture d’écran, instantané, console, erreurs, requêtes">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # ou --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser snapshot --out snapshot.txt
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Actions : navigation, clic, saisie, glisser-déposer, attente, évaluation">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # ou e12 pour les références de rôle
openclaw browser click-coords 120 340        # coordonnées de la fenêtre d’affichage
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref e12
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

<Accordion title="État : cookies, stockage, mode hors ligne, en-têtes, géolocalisation, appareil">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear pour supprimer
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Remarques :

- L’outil `browser` destiné à l’agent expose `action=download` (`ref` et `path`
  obligatoires) et `action=waitfordownload` (`path` facultatif). Les deux renvoient
  l’URL du téléchargement enregistré, le nom de fichier suggéré et le chemin local
  protégé. L’interception explicite des téléchargements est disponible pour les profils
  Playwright gérés ; les profils de session existante renvoient une erreur d’opération
  non prise en charge.
- Privilégiez les téléversements atomiques via le sélecteur de fichiers : transmettez le déclencheur `--ref` avec le téléversement afin qu’OpenClaw l’arme et clique en une seule requête. La commande `upload` avec uniquement des chemins reste prise en charge lorsqu’un déclenchement ultérieur est intentionnel. Utilisez `--input-ref` ou `--element` pour définir directement un champ de fichier. `dialog` est un appel d’armement ; exécutez-le avant le clic ou l’appui qui déclenche la boîte de dialogue. Si une action ouvre une fenêtre modale, sa réponse inclut `blockedByDialog` et `browserState.dialogs.pending` ; transmettez ce `dialogId` pour répondre directement. Les boîtes de dialogue traitées hors d’OpenClaw figurent sous `browserState.dialogs.recent`.
- `click`/`type`/etc. nécessitent une `ref` provenant de `snapshot` (`12` numérique, référence de rôle `e12` ou référence ARIA exploitable `ax12`). Les sélecteurs CSS ne sont volontairement pas pris en charge pour les actions. Utilisez `click-coords` lorsque la position visible dans la fenêtre d’affichage est la seule cible fiable.
- Les chemins de téléchargement et de trace sont limités aux racines temporaires d’OpenClaw : `/tmp/openclaw{,/downloads}` (solution de repli : `${os.tmpdir()}/openclaw/...`).
- `upload` accepte les fichiers provenant de la racine temporaire des téléversements
  d’OpenClaw et les médias entrants gérés par OpenClaw. Un média entrant géré peut être
  référencé sous la forme `media://inbound/<id>`, par le chemin relatif au bac à sable
  `media/inbound/<id>` ou par un chemin résolu dans le répertoire géré des médias entrants.
  Les références de média imbriquées, la traversée de répertoires, les liens symboliques,
  les liens physiques et les chemins locaux arbitraires restent refusés.
- `upload` peut également définir directement les champs de fichier via `--input-ref` ou `--element`.

Les identifiants et libellés stables des onglets survivent au remplacement des cibles brutes de Chromium lorsqu’OpenClaw
peut établir l’onglet de remplacement, par exemple avec une paire unique ancien/nouveau pour la même URL ou
lorsqu’un seul ancien onglet devient un seul nouvel onglet après l’envoi d’un formulaire. Les remplacements
ambigus avec des URL en double reçoivent de nouveaux identifiants. Les identifiants de cibles brutes restent
volatils ; privilégiez `suggestedTargetId` provenant de `tabs` dans les scripts.

Aperçu des options de capture :

- `--format ai` (valeur par défaut avec Playwright) : capture pour l’IA avec des références numériques (`aria-ref="<n>"`).
- `--format aria` : arbre d’accessibilité avec des références `axN`. Lorsque Playwright est disponible, OpenClaw associe les références à la page active à l’aide des identifiants DOM du moteur afin que les actions suivantes puissent les utiliser ; sinon, considérez la sortie comme uniquement destinée à l’inspection.
- `--efficient` (ou `--mode efficient`) : préréglage compact de capture par rôles. Définissez `browser.snapshotDefaults.mode: "efficient"` pour en faire la valeur par défaut (voir [Configuration du Gateway](/fr/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` imposent une capture par rôles avec des références `ref=e12`. `--frame "<iframe>"` limite les captures par rôles à un iframe.
- Avec Playwright, `--labels` ajoute une capture d’écran avec des libellés de référence superposés
  (affiche `MEDIA:<path>`) ainsi qu’un tableau `annotations` contenant le cadre de délimitation
  de chaque référence. Avec `screenshot`, les libellés fournis par Playwright fonctionnent avec `--full-page`,
  `--ref` et `--element` ; avec `snapshot`, la capture d’écran associée reste limitée
  à la fenêtre d’affichage. Les profils de session existante/chrome-mcp affichent les libellés superposés sur
  les captures d’écran de la page, mais ne renvoient pas d’`annotations` et n’utilisent pas l’assistant de projection
  pleine page/référence/élément de Playwright. Sans Playwright ni chrome-mcp,
  les captures d’écran avec libellés ne sont pas disponibles.
- `--urls` ajoute les destinations des liens découverts aux captures pour l’IA.

## Captures et références

OpenClaw prend en charge deux styles de « capture » :

- **Capture pour l’IA (références numériques)** : `openclaw browser snapshot` (par défaut ; `--format ai`)
  - Sortie : une capture textuelle comprenant des références numériques.
  - Actions : `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - En interne, la référence est résolue via `aria-ref` de Playwright.

- **Capture par rôles (références de rôle comme `e12`)** : `openclaw browser snapshot --interactive` (ou `--compact`, `--depth`, `--selector`, `--frame`)
  - Sortie : une liste ou une arborescence fondée sur les rôles avec `[ref=e12]` (et éventuellement `[nth=1]`).
  - Actions : `openclaw browser click e12`, `openclaw browser highlight e12`.
  - En interne, la référence est résolue via `getByRole(...)` (ainsi que `nth()` pour les doublons).
  - Ajoutez `--labels` pour inclure une capture d’écran avec des libellés `e12` superposés. Sur les
    profils reposant sur Playwright, cela renvoie également les métadonnées du cadre de délimitation de chaque référence
    (`annotations[]`).
  - Ajoutez `--urls` lorsque le texte des liens est ambigu et que l’agent a besoin de
    cibles de navigation concrètes.

- **Capture ARIA (références ARIA comme `ax12`)** : `openclaw browser snapshot --format aria`
  - Sortie : l’arbre d’accessibilité sous forme de nœuds structurés.
  - Actions : `openclaw browser click ax12` fonctionne lorsque le chemin de capture peut associer
    la référence via Playwright et les identifiants DOM du moteur Chrome.
- Si Playwright n’est pas disponible, les captures ARIA peuvent néanmoins être utiles pour
  l’inspection, mais les références peuvent ne pas être exploitables. Effectuez une nouvelle capture avec `--format ai`
  ou `--interactive` lorsque vous avez besoin de références d’action.
- Preuve Docker pour le chemin de repli CDP brut : `pnpm test:docker:browser-cdp-snapshot`
  démarre Chromium avec CDP, exécute `browser doctor --deep` et vérifie que les captures par rôles
  incluent les URL des liens, les éléments cliquables promus par le curseur et les métadonnées des iframes.

Comportement des références :

- Les références ne sont **pas stables entre les navigations** ; en cas d’échec, réexécutez `snapshot` et utilisez une nouvelle référence.
- `/act` renvoie le `targetId` brut actuel après un remplacement déclenché par une action
  lorsqu’il peut établir l’onglet de remplacement. Continuez d’utiliser les identifiants ou libellés stables des onglets pour
  les commandes suivantes.
- Si la capture par rôles a été effectuée avec `--frame`, les références de rôle restent limitées à cet iframe jusqu’à la prochaine capture par rôles.
- Les références `axN` inconnues ou obsolètes échouent immédiatement au lieu de basculer vers
  le sélecteur `aria-ref` de Playwright. Effectuez une nouvelle capture dans le même onglet lorsque
  cela se produit.

## Options d’attente avancées

Vous pouvez attendre davantage que l’écoulement d’une durée ou l’apparition d’un texte :

- Attendre une URL (les motifs glob sont pris en charge par Playwright) :
  - `openclaw browser wait --url "**/dash"`
- Attendre un état de chargement :
  - `openclaw browser wait --load networkidle`
  - Pris en charge sur les profils `openclaw` gérés et CDP bruts/distants. Les profils utilisant le pilote `existing-session` (y compris le profil `user` par défaut) refusent `networkidle` ; utilisez plutôt les attentes `--url`, `--text`, un sélecteur ou `--fn`.
- Attendre un prédicat JS :
  - `openclaw browser wait --fn "window.ready===true"`
- Attendre qu’un sélecteur devienne visible :
  - `openclaw browser wait "#main"`

Ces options peuvent être combinées :

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Procédures de débogage

Lorsqu’une action échoue (par exemple « non visible », « violation du mode strict », « recouvert ») :

1. `openclaw browser snapshot --interactive`
2. Utilisez `click <ref>` / `type <ref>` (privilégiez les références de rôle en mode interactif)
3. Si l’échec persiste : `openclaw browser highlight <ref>` pour voir ce que Playwright cible
4. Si la page se comporte de façon inhabituelle :
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Pour un débogage approfondi, enregistrez une trace :
   - `openclaw browser trace start`
   - reproduisez le problème
   - `openclaw browser trace stop` (affiche `TRACE:<path>`)

## Sortie JSON

`--json` est destiné aux scripts et aux outils structurés.

Exemples :

```bash
openclaw browser --json status
openclaw browser --json snapshot --interactive
openclaw browser --json requests --filter api
openclaw browser --json cookies
```

Les captures par rôles au format JSON incluent `refs` ainsi qu’un petit bloc `stats` (lignes/caractères/références/interactifs) afin que les outils puissent évaluer la taille et la densité de la charge utile.

## Paramètres d’état et d’environnement

Ces commandes sont utiles dans les procédures visant à « faire en sorte que le site se comporte comme X » :

- Cookies : `cookies`, `cookies set`, `cookies clear`
- Stockage : `storage local|session get|set|clear`
- Mode hors ligne : `set offline on|off`
- En-têtes : `set headers --headers-json '{"X-Debug":"1"}'` (ou la forme positionnelle `set headers '{"X-Debug":"1"}'`)
- Authentification HTTP de base : `set credentials user pass` (ou `--clear`)
- Géolocalisation : `set geo <lat> <lon> --origin "https://example.com"` (ou `--clear`)
- Média : `set media dark|light|no-preference|none`
- Fuseau horaire / paramètres régionaux : `set timezone ...`, `set locale ...`
- Appareil / fenêtre d’affichage :
  - `set device "iPhone 14"` (préréglages d’appareils Playwright)
  - `set viewport 1280 720`

## Sécurité et confidentialité

- Le profil de navigateur openclaw peut contenir des sessions authentifiées ; considérez-le comme sensible.
- `browser act kind=evaluate` / `openclaw browser evaluate` et `wait --fn`
  exécutent du code JavaScript arbitraire dans le contexte de la page. Une injection de prompt peut orienter
  cette exécution. Désactivez-la avec `browser.evaluateEnabled=false` si vous n’en avez pas besoin.
- `openclaw browser evaluate --fn` accepte le code source d’une fonction, une expression ou
  le corps d’une instruction. Les corps d’instructions sont enveloppés dans des fonctions asynchrones ; utilisez donc
  `return` pour la valeur à renvoyer. Utilisez `--timeout-ms <ms>` lorsque la
  fonction exécutée dans la page peut nécessiter plus de temps que le délai d’évaluation par défaut.
- Pour les connexions et les remarques sur les mécanismes anti-robots (X/Twitter, etc.), consultez [Connexion dans le navigateur et publication sur X/Twitter](/fr/tools/browser-login).
- Gardez l’hôte du Gateway/nœud privé (boucle locale ou tailnet uniquement).
- Les points de terminaison CDP distants sont puissants ; utilisez un tunnel et protégez-les.

Exemple en mode strict (bloque par défaut les destinations privées/internes) :

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // autorisation exacte facultative
    },
  },
}
```

## Pages connexes

- [Navigateur](/fr/tools/browser) - présentation, configuration, profils, sécurité
- [Connexion dans le navigateur](/fr/tools/browser-login) - connexion aux sites
- [Dépannage du navigateur sous Linux](/fr/tools/browser-linux-troubleshooting)
- [Dépannage du navigateur sous WSL2](/fr/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
