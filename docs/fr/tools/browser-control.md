---
read_when:
    - Écriture de scripts ou débogage du navigateur de l’agent via l’API de contrôle locale
    - Recherche de la référence CLI `openclaw browser`
    - Ajouter une automatisation de navigateur personnalisée avec des instantanés et des références
summary: API de contrôle du navigateur OpenClaw, référence CLI et actions de script
title: API de contrôle du navigateur
x-i18n:
    generated_at: "2026-05-02T07:20:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef996319c09bfa8de9b5c3a340c68496ac3698295b62f4f07c79f3e233eda2a2
    source_path: tools/browser-control.md
    workflow: 16
---

Pour l’installation, la configuration et le dépannage, consultez [Navigateur](/fr/tools/browser).
Cette page est la référence pour l’API HTTP de contrôle locale, le CLI `openclaw browser`
et les modèles de scripts (instantanés, refs, attentes, flux de débogage).

## API de contrôle (facultative)

Pour les intégrations locales uniquement, le Gateway expose une petite API HTTP loopback :

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
configuration persistée du navigateur ; les profils attach-only, CDP distant et session existante rejettent
cette substitution, car OpenClaw ne lance pas ces processus de navigateur.

Si l’authentification du Gateway par secret partagé est configurée, les routes HTTP du navigateur exigent aussi une authentification :

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` ou authentification HTTP Basic avec ce mot de passe

Notes :

- Cette API de navigateur loopback autonome ne consomme **pas** les en-têtes d’identité trusted-proxy ni
  Tailscale Serve.
- Si `gateway.auth.mode` vaut `none` ou `trusted-proxy`, ces routes de navigateur loopback
  n’héritent pas de ces modes porteurs d’identité ; conservez-les uniquement en loopback.

### Contrat d’erreur de `/act`

`POST /act` utilise une réponse d’erreur structurée pour la validation au niveau de la route et
les échecs de politique :

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valeurs actuelles de `code` :

- `ACT_KIND_REQUIRED` (HTTP 400) : `kind` est manquant ou non reconnu.
- `ACT_INVALID_REQUEST` (HTTP 400) : la charge utile de l’action a échoué à la normalisation ou à la validation.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400) : `selector` a été utilisé avec un type d’action non pris en charge.
- `ACT_EVALUATE_DISABLED` (HTTP 403) : `evaluate` (ou `wait --fn`) est désactivé par la configuration.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403) : le `targetId` de niveau supérieur ou groupé est en conflit avec la cible de la requête.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501) : l’action n’est pas prise en charge pour les profils de session existante.

D’autres échecs d’exécution peuvent toujours renvoyer `{ "error": "<message>" }` sans champ
`code`.

### Exigence Playwright

Certaines fonctionnalités (navigation/action/instantané IA/instantané de rôle, captures d’écran d’éléments,
PDF) nécessitent Playwright. Si Playwright n’est pas installé, ces points de terminaison renvoient
une erreur 501 claire.

Ce qui fonctionne encore sans Playwright :

- Instantanés ARIA
- Instantanés d’accessibilité de style rôle (`--interactive`, `--compact`,
  `--depth`, `--efficient`) lorsqu’un WebSocket CDP par onglet est disponible. Il s’agit
  d’un repli pour l’inspection et la découverte de refs ; Playwright reste le moteur
  d’action principal.
- Captures d’écran de page pour le navigateur `openclaw` géré lorsqu’un WebSocket CDP
  par onglet est disponible
- Captures d’écran de page pour les profils `existing-session` / Chrome MCP
- Captures d’écran par ref `existing-session` (`--ref`) issues de la sortie d’instantané

Ce qui nécessite encore Playwright :

- `navigate`
- `act`
- Les instantanés IA qui dépendent du format d’instantané IA natif de Playwright
- Captures d’écran d’éléments par sélecteur CSS (`--element`)
- Export PDF complet du navigateur

Les captures d’écran d’éléments rejettent aussi `--full-page` ; la route renvoie `fullPage is
not supported for element screenshots`.

Si vous voyez `Playwright is not available in this gateway build`, il manque à la version empaquetée du
Gateway la dépendance principale d’exécution du navigateur. Réinstallez ou mettez à jour
OpenClaw, puis redémarrez le Gateway. Pour Docker, installez aussi les binaires du navigateur
Chromium comme indiqué ci-dessous.

#### Installation de Playwright avec Docker

Si votre Gateway s’exécute dans Docker, évitez `npx playwright` (conflits de substitutions npm).
Utilisez plutôt le CLI inclus :

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Pour conserver les téléchargements de navigateurs, définissez `PLAYWRIGHT_BROWSERS_PATH` (par exemple,
`/home/node/.cache/ms-playwright`) et assurez-vous que `/home/node` est conservé via
`OPENCLAW_HOME_VOLUME` ou un montage lié. Consultez [Docker](/fr/install/docker).

## Fonctionnement (interne)

Un petit serveur de contrôle loopback accepte les requêtes HTTP et se connecte aux navigateurs basés sur Chromium via CDP. Les actions avancées (clic/saisie/instantané/PDF) passent par Playwright au-dessus de CDP ; lorsque Playwright est absent, seules les opérations non Playwright sont disponibles. L’agent voit une interface stable tandis que les navigateurs et profils locaux/distants peuvent être remplacés librement en dessous.

## Référence rapide du CLI

Toutes les commandes acceptent `--browser-profile <name>` pour cibler un profil spécifique, et `--json` pour une sortie lisible par machine.

<AccordionGroup>

<Accordion title="Bases : état, onglets, ouvrir/focus/fermer">

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
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
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

- `upload` et `dialog` sont des appels d’**armement** ; exécutez-les avant le clic/la pression de touche qui déclenche le sélecteur/la boîte de dialogue.
- `click`/`type`/etc. nécessitent une `ref` issue de `snapshot` (`12` numérique, ref de rôle `e12` ou ref ARIA actionnable `ax12`). Les sélecteurs CSS ne sont volontairement pas pris en charge pour les actions. Utilisez `click-coords` lorsque la position visible dans la fenêtre d’affichage est la seule cible fiable.
- Les chemins de téléchargement, de trace et d’upload sont limités aux racines temporaires OpenClaw : `/tmp/openclaw{,/downloads,/uploads}` (repli : `${os.tmpdir()}/openclaw/...`).
- `upload` peut aussi définir directement les entrées de fichier via `--input-ref` ou `--element`.

Les ids et libellés d’onglets stables survivent au remplacement de cible brute Chromium lorsque OpenClaw
peut prouver l’onglet de remplacement, par exemple la même URL ou un seul ancien onglet devenant un
seul nouvel onglet après la soumission d’un formulaire. Les ids de cible bruts restent volatils ; préférez
`suggestedTargetId` provenant de `tabs` dans les scripts.

Aperçu rapide des indicateurs d’instantané :

- `--format ai` (par défaut avec Playwright) : instantané IA avec refs numériques (`aria-ref="<n>"`).
- `--format aria` : arbre d’accessibilité avec refs `axN`. Lorsque Playwright est disponible, OpenClaw lie les refs avec les ids DOM backend à la page active afin que les actions de suivi puissent les utiliser ; sinon, traitez la sortie uniquement comme une aide à l’inspection.
- `--efficient` (ou `--mode efficient`) : préréglage compact d’instantané de rôle. Définissez `browser.snapshotDefaults.mode: "efficient"` pour en faire la valeur par défaut (voir [configuration du Gateway](/fr/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` forcent un instantané de rôle avec des refs `ref=e12`. `--frame "<iframe>"` limite les instantanés de rôle à une iframe.
- `--labels` ajoute une capture d’écran limitée à la fenêtre d’affichage avec des libellés de refs superposés (affiche `MEDIA:<path>`).
- `--urls` ajoute les destinations de liens découvertes aux instantanés IA.

## Instantanés et refs

OpenClaw prend en charge deux styles d’« instantané » :

- **Instantané IA (refs numériques)** : `openclaw browser snapshot` (par défaut ; `--format ai`)
  - Sortie : un instantané texte qui inclut des refs numériques.
  - Actions : `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - En interne, la ref est résolue via `aria-ref` de Playwright.

- **Instantané de rôle (refs de rôle comme `e12`)** : `openclaw browser snapshot --interactive` (ou `--compact`, `--depth`, `--selector`, `--frame`)
  - Sortie : une liste/arborescence basée sur les rôles avec `[ref=e12]` (et `[nth=1]` facultatif).
  - Actions : `openclaw browser click e12`, `openclaw browser highlight e12`.
  - En interne, la ref est résolue via `getByRole(...)` (plus `nth()` pour les doublons).
  - Ajoutez `--labels` pour inclure une capture d’écran de la fenêtre d’affichage avec des libellés `e12` superposés.
  - Ajoutez `--urls` lorsque le texte du lien est ambigu et que l’agent a besoin de
    cibles de navigation concrètes.

- **Instantané ARIA (refs ARIA comme `ax12`)** : `openclaw browser snapshot --format aria`
  - Sortie : l’arbre d’accessibilité sous forme de nœuds structurés.
  - Actions : `openclaw browser click ax12` fonctionne lorsque le chemin d’instantané peut lier
    la ref via Playwright et les ids DOM backend de Chrome.
- Si Playwright n’est pas disponible, les instantanés ARIA peuvent toujours être utiles pour
  l’inspection, mais les refs peuvent ne pas être actionnables. Recréez l’instantané avec `--format ai`
  ou `--interactive` lorsque vous avez besoin de refs d’action.
- Preuve Docker pour le chemin de repli CDP brut : `pnpm test:docker:browser-cdp-snapshot`
  démarre Chromium avec CDP, exécute `browser doctor --deep` et vérifie que les instantanés de rôle
  incluent les URL des liens, les éléments cliquables promus par le curseur et les métadonnées d’iframe.

Comportement des refs :

- Les références ne sont **pas stables entre les navigations** ; si quelque chose échoue, relancez `snapshot` et utilisez une référence fraîche.
- `/act` renvoie le `targetId` brut actuel après un remplacement déclenché par une action
  lorsqu’il peut prouver l’onglet de remplacement. Continuez à utiliser des ids/libellés d’onglet stables pour
  les commandes de suivi.
- Si l’instantané des rôles a été pris avec `--frame`, les références de rôle sont limitées à cet iframe jusqu’au prochain instantané des rôles.
- Les références `axN` inconnues ou obsolètes échouent rapidement au lieu de retomber sur
  le sélecteur `aria-ref` de Playwright. Exécutez un instantané frais sur le même onglet lorsque
  cela se produit.

## Améliorations d’attente

Vous pouvez attendre plus que simplement du temps/du texte :

- Attendre une URL (globs pris en charge par Playwright) :
  - `openclaw browser wait --url "**/dash"`
- Attendre l’état de chargement :
  - `openclaw browser wait --load networkidle`
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

## Workflows de débogage

Lorsqu’une action échoue (par ex. « not visible », « strict mode violation », « covered ») :

1. `openclaw browser snapshot --interactive`
2. Utilisez `click <ref>` / `type <ref>` (préférez les références de rôle en mode interactif)
3. Si cela échoue encore : `openclaw browser highlight <ref>` pour voir ce que Playwright cible
4. Si la page se comporte bizarrement :
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Pour un débogage approfondi : enregistrez une trace :
   - `openclaw browser trace start`
   - reproduisez le problème
   - `openclaw browser trace stop` (affiche `TRACE:<path>`)

## Sortie JSON

`--json` sert aux scripts et aux outils structurés.

Exemples :

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Les instantanés de rôles en JSON incluent `refs` ainsi qu’un petit bloc `stats` (lines/chars/refs/interactive) afin que les outils puissent raisonner sur la taille et la densité de la charge utile.

## Paramètres d’état et d’environnement

Ils sont utiles pour les workflows « faire en sorte que le site se comporte comme X » :

- Cookies : `cookies`, `cookies set`, `cookies clear`
- Stockage : `storage local|session get|set|clear`
- Hors ligne : `set offline on|off`
- En-têtes : `set headers --headers-json '{"X-Debug":"1"}'` (l’ancien `set headers --json '{"X-Debug":"1"}'` reste pris en charge)
- Authentification HTTP basic : `set credentials user pass` (ou `--clear`)
- Géolocalisation : `set geo <lat> <lon> --origin "https://example.com"` (ou `--clear`)
- Médias : `set media dark|light|no-preference|none`
- Fuseau horaire / locale : `set timezone ...`, `set locale ...`
- Appareil / viewport :
  - `set device "iPhone 14"` (préréglages d’appareils Playwright)
  - `set viewport 1280 720`

## Sécurité et confidentialité

- Le profil navigateur openclaw peut contenir des sessions connectées ; traitez-le comme sensible.
- `browser act kind=evaluate` / `openclaw browser evaluate` et `wait --fn`
  exécutent du JavaScript arbitraire dans le contexte de la page. L’injection de prompt peut
  orienter cela. Désactivez-le avec `browser.evaluateEnabled=false` si vous n’en avez pas besoin.
- Pour les connexions et les notes anti-bot (X/Twitter, etc.), consultez [Connexion au navigateur + publication X/Twitter](/fr/tools/browser-login).
- Gardez l’hôte Gateway/Node privé (loopback ou tailnet uniquement).
- Les points de terminaison CDP distants sont puissants ; tunnelisez-les et protégez-les.

Exemple en mode strict (bloquer par défaut les destinations privées/internes) :

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

## Associé

- [Browser](/fr/tools/browser) — aperçu, configuration, profils, sécurité
- [Connexion au navigateur](/fr/tools/browser-login) — connexion aux sites
- [Dépannage Browser Linux](/fr/tools/browser-linux-troubleshooting)
- [Dépannage Browser WSL2](/fr/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
