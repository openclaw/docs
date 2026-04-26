---
read_when:
    - Écriture de scripts ou débogage du navigateur de l’agent via l’API de contrôle locale
    - Recherche de la référence CLI `openclaw browser`
    - Ajout d’une automatisation de navigateur personnalisée avec des instantanés et des références
summary: API de contrôle du navigateur OpenClaw, référence CLI et actions de script
title: API de contrôle du navigateur
x-i18n:
    generated_at: "2026-04-26T11:39:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: bdaaff3d218aeee4c9a01478b3a3380b813ad4578d7eb74120e0745c87af66f6
    source_path: tools/browser-control.md
    workflow: 15
---

Pour la configuration, les réglages et le dépannage, consultez [Browser](/fr/tools/browser).
Cette page est la référence pour l’API HTTP de contrôle locale, la CLI `openclaw browser`,
et les modèles de script (instantanés, références, attentes, flux de débogage).

## API de contrôle (facultative)

Pour les intégrations locales uniquement, le Gateway expose une petite API HTTP en boucle locale :

- Statut/démarrage/arrêt : `GET /`, `POST /start`, `POST /stop`
- Onglets : `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Instantané/capture d’écran : `GET /snapshot`, `POST /screenshot`
- Actions : `POST /navigate`, `POST /act`
- Hooks : `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Téléchargements : `POST /download`, `POST /wait/download`
- Débogage : `GET /console`, `POST /pdf`
- Débogage : `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Réseau : `POST /response/body`
- État : `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- État : `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Réglages : `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Tous les points de terminaison acceptent `?profile=<name>`. `POST /start?headless=true` demande un
lancement headless ponctuel pour les profils locaux gérés sans modifier la
configuration persistée du navigateur ; les profils attach-only, CDP distant et existant-session rejettent
cette surcharge car OpenClaw ne lance pas ces processus de navigateur.

Si l’authentification Gateway par secret partagé est configurée, les routes HTTP du navigateur exigent aussi une authentification :

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` ou l’authentification HTTP Basic avec ce mot de passe

Remarques :

- Cette API de navigateur autonome en boucle locale ne consomme **pas** les en-têtes de proxy approuvé ni les en-têtes d’identité Tailscale Serve.
- Si `gateway.auth.mode` vaut `none` ou `trusted-proxy`, ces routes de navigateur en boucle locale n’héritent pas de ces modes porteurs d’identité ; gardez-les limitées à la boucle locale.

### Contrat d’erreur `/act`

`POST /act` utilise une réponse d’erreur structurée pour la validation au niveau de la route et
les échecs de politique :

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valeurs actuelles de `code` :

- `ACT_KIND_REQUIRED` (HTTP 400) : `kind` est absent ou non reconnu.
- `ACT_INVALID_REQUEST` (HTTP 400) : la charge utile de l’action a échoué à la normalisation ou à la validation.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400) : `selector` a été utilisé avec un type d’action non pris en charge.
- `ACT_EVALUATE_DISABLED` (HTTP 403) : `evaluate` (ou `wait --fn`) est désactivé par la configuration.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403) : le `targetId` de niveau supérieur ou en lot est en conflit avec la cible de la requête.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501) : l’action n’est pas prise en charge pour les profils existant-session.

D’autres échecs d’exécution peuvent toujours renvoyer `{ "error": "<message>" }` sans
champ `code`.

### Exigence Playwright

Certaines fonctionnalités (navigate/act/instantané AI/instantané de rôle, captures d’écran d’éléments,
PDF) nécessitent Playwright. Si Playwright n’est pas installé, ces points de terminaison renvoient
une erreur 501 claire.

Ce qui fonctionne encore sans Playwright :

- Les instantanés ARIA
- Les instantanés d’accessibilité de style rôle (`--interactive`, `--compact`,
  `--depth`, `--efficient`) lorsqu’un WebSocket CDP par onglet est disponible. Il s’agit
  d’un repli pour l’inspection et la découverte des références ; Playwright reste le moteur principal des actions.
- Les captures d’écran de page pour le navigateur `openclaw` géré lorsqu’un WebSocket CDP par onglet
  est disponible
- Les captures d’écran de page pour les profils `existing-session` / Chrome MCP
- Les captures d’écran basées sur des références `existing-session` (`--ref`) à partir de la sortie d’instantané

Ce qui nécessite toujours Playwright :

- `navigate`
- `act`
- Les instantanés AI qui dépendent du format d’instantané AI natif de Playwright
- Les captures d’écran d’éléments avec sélecteur CSS (`--element`)
- L’export PDF complet du navigateur

Les captures d’écran d’éléments rejettent aussi `--full-page` ; la route renvoie `fullPage is
not supported for element screenshots`.

Si vous voyez `Playwright is not available in this gateway build`, réparez les
dépendances d’exécution du Plugin navigateur intégré afin que `playwright-core` soit installé,
puis redémarrez le gateway. Pour les installations packagées, exécutez `openclaw doctor --fix`.
Pour Docker, installez aussi les binaires du navigateur Chromium comme indiqué ci-dessous.

#### Installation de Playwright dans Docker

Si votre Gateway s’exécute dans Docker, évitez `npx playwright` (conflits de substitution npm).
Utilisez plutôt la CLI intégrée :

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Pour conserver les téléchargements du navigateur, définissez `PLAYWRIGHT_BROWSERS_PATH` (par exemple,
`/home/node/.cache/ms-playwright`) et assurez-vous que `/home/node` est persisté via
`OPENCLAW_HOME_VOLUME` ou un bind mount. Voir [Docker](/fr/install/docker).

## Fonctionnement (interne)

Un petit serveur de contrôle en boucle locale accepte les requêtes HTTP et se connecte aux navigateurs basés sur Chromium via CDP. Les actions avancées (clic/saisie/instantané/PDF) passent par Playwright au-dessus de CDP ; lorsque Playwright est absent, seules les opérations sans Playwright sont disponibles. L’agent voit une interface stable unique tandis que les navigateurs et profils locaux/distants peuvent être remplacés librement en dessous.

## Référence rapide CLI

Toutes les commandes acceptent `--browser-profile <name>` pour cibler un profil spécifique, et `--json` pour une sortie lisible par machine.

<AccordionGroup>

<Accordion title="Bases : statut, onglets, ouvrir/focus/fermer">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # lancement headless local géré ponctuel
openclaw browser stop            # efface aussi l’émulation sur attach-only/CDP distant
openclaw browser tabs
openclaw browser tab             # raccourci pour l’onglet actuel
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
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Actions : navigate, click, type, drag, wait, evaluate">

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

- `upload` et `dialog` sont des appels **d’armement** ; exécutez-les avant le clic/la touche qui déclenche le sélecteur/la boîte de dialogue.
- `click`/`type`/etc exigent une `ref` issue de `snapshot` (numérique `12`, ref de rôle `e12`, ou ref ARIA actionnable `ax12`). Les sélecteurs CSS ne sont volontairement pas pris en charge pour les actions. Utilisez `click-coords` lorsque la position visible dans la fenêtre d’affichage est la seule cible fiable.
- Les chemins de téléchargement, de trace et d’envoi sont limités aux racines temporaires OpenClaw : `/tmp/openclaw{,/downloads,/uploads}` (repli : `${os.tmpdir()}/openclaw/...`).
- `upload` peut aussi définir directement les entrées de fichiers via `--input-ref` ou `--element`.

Les identifiants et libellés d’onglet stables survivent au remplacement des cibles brutes Chromium lorsque OpenClaw
peut prouver l’onglet de remplacement, par exemple même URL ou un seul ancien onglet devenu un
seul nouvel onglet après soumission d’un formulaire. Les identifiants de cibles brutes restent volatils ; préférez
`suggestedTargetId` depuis `tabs` dans les scripts.

Aperçu des drapeaux d’instantané :

- `--format ai` (par défaut avec Playwright) : instantané AI avec références numériques (`aria-ref="<n>"`).
- `--format aria` : arbre d’accessibilité avec références `axN`. Quand Playwright est disponible, OpenClaw lie les références avec les identifiants DOM backend à la page active afin que les actions de suivi puissent les utiliser ; sinon, considérez la sortie comme réservée à l’inspection.
- `--efficient` (ou `--mode efficient`) : préréglage compact d’instantané de rôle. Définissez `browser.snapshotDefaults.mode: "efficient"` pour en faire le mode par défaut (voir [Configuration Gateway](/fr/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` forcent un instantané de rôle avec des références `ref=e12`. `--frame "<iframe>"` limite les instantanés de rôle à une iframe.
- `--labels` ajoute une capture d’écran limitée à la fenêtre d’affichage avec des libellés de référence superposés (affiche `MEDIA:<path>`).
- `--urls` ajoute les destinations de liens découvertes aux instantanés AI.

## Instantanés et références

OpenClaw prend en charge deux styles d’« instantané » :

- **Instantané AI (références numériques)** : `openclaw browser snapshot` (par défaut ; `--format ai`)
  - Sortie : un instantané texte qui inclut des références numériques.
  - Actions : `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - En interne, la référence est résolue via `aria-ref` de Playwright.

- **Instantané de rôle (références de rôle comme `e12`)** : `openclaw browser snapshot --interactive` (ou `--compact`, `--depth`, `--selector`, `--frame`)
  - Sortie : une liste/un arbre basé sur les rôles avec `[ref=e12]` (et éventuellement `[nth=1]`).
  - Actions : `openclaw browser click e12`, `openclaw browser highlight e12`.
  - En interne, la référence est résolue via `getByRole(...)` (plus `nth()` pour les doublons).
  - Ajoutez `--labels` pour inclure une capture d’écran de la fenêtre d’affichage avec des libellés `e12` superposés.
  - Ajoutez `--urls` lorsque le texte du lien est ambigu et que l’agent a besoin de cibles
    de navigation concrètes.

- **Instantané ARIA (références ARIA comme `ax12`)** : `openclaw browser snapshot --format aria`
  - Sortie : l’arbre d’accessibilité sous forme de nœuds structurés.
  - Actions : `openclaw browser click ax12` fonctionne lorsque le chemin de l’instantané peut lier
    la référence via Playwright et les identifiants DOM backend de Chrome.
- Si Playwright n’est pas disponible, les instantanés ARIA peuvent tout de même être utiles pour
  l’inspection, mais les références peuvent ne pas être exploitables. Refaites un instantané avec `--format ai`
  ou `--interactive` lorsque vous avez besoin de références d’action.
- Preuve Docker pour le chemin de repli raw-CDP : `pnpm test:docker:browser-cdp-snapshot`
  démarre Chromium avec CDP, exécute `browser doctor --deep`, et vérifie que les instantanés
  de rôle incluent les URL des liens, les éléments cliquables promus par le curseur, et les métadonnées d’iframe.

Comportement des références :

- Les références **ne sont pas stables d’une navigation à l’autre** ; si quelque chose échoue, réexécutez `snapshot` et utilisez une référence récente.
- `/act` renvoie le `targetId` brut actuel après un remplacement déclenché par l’action
  lorsqu’il peut prouver l’onglet de remplacement. Continuez à utiliser des identifiants/libellés d’onglet stables pour
  les commandes de suivi.
- Si l’instantané de rôle a été pris avec `--frame`, les références de rôle sont limitées à cette iframe jusqu’au prochain instantané de rôle.
- Les références `axN` inconnues ou obsolètes échouent immédiatement au lieu de tomber
  sur le sélecteur `aria-ref` de Playwright. Exécutez un nouvel instantané sur le même onglet lorsque
  cela se produit.

## Améliorations d’attente

Vous pouvez attendre plus que simplement un délai/du texte :

- Attendre une URL (les globs sont pris en charge par Playwright) :
  - `openclaw browser wait --url "**/dash"`
- Attendre un état de chargement :
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

## Flux de débogage

Lorsqu’une action échoue (par ex. « not visible », « strict mode violation », « covered ») :

1. `openclaw browser snapshot --interactive`
2. Utilisez `click <ref>` / `type <ref>` (préférez les références de rôle en mode interactif)
3. Si cela échoue encore : `openclaw browser highlight <ref>` pour voir ce que Playwright cible
4. Si la page se comporte de manière étrange :
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

Les instantanés de rôle en JSON incluent `refs` ainsi qu’un petit bloc `stats` (lignes/caractères/références/interactif) afin que les outils puissent raisonner sur la taille et la densité de la charge utile.

## Réglages d’état et d’environnement

Ils sont utiles pour les flux « faire en sorte que le site se comporte comme X » :

- Cookies : `cookies`, `cookies set`, `cookies clear`
- Stockage : `storage local|session get|set|clear`
- Hors ligne : `set offline on|off`
- En-têtes : `set headers --headers-json '{"X-Debug":"1"}'` (l’ancien `set headers --json '{"X-Debug":"1"}'` reste pris en charge)
- Authentification HTTP Basic : `set credentials user pass` (ou `--clear`)
- Géolocalisation : `set geo <lat> <lon> --origin "https://example.com"` (ou `--clear`)
- Média : `set media dark|light|no-preference|none`
- Fuseau horaire / langue : `set timezone ...`, `set locale ...`
- Appareil / fenêtre d’affichage :
  - `set device "iPhone 14"` (préréglages d’appareil Playwright)
  - `set viewport 1280 720`

## Sécurité et confidentialité

- Le profil de navigateur openclaw peut contenir des sessions connectées ; traitez-le comme sensible.
- `browser act kind=evaluate` / `openclaw browser evaluate` et `wait --fn`
  exécutent du JavaScript arbitraire dans le contexte de la page. L’injection d’invite peut orienter
  cela. Désactivez-le avec `browser.evaluateEnabled=false` si vous n’en avez pas besoin.
- Pour les connexions et les remarques anti-bot (X/Twitter, etc.), consultez [Connexion navigateur + publication X/Twitter](/fr/tools/browser-login).
- Gardez l’hôte Gateway/node privé (boucle locale ou tailnet uniquement).
- Les points de terminaison CDP distants sont puissants ; tunnelisez-les et protégez-les.

Exemple en mode strict (bloquer par défaut les destinations privées/internes) :

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

## Lié

- [Browser](/fr/tools/browser) — vue d’ensemble, configuration, profils, sécurité
- [Connexion navigateur](/fr/tools/browser-login) — connexion aux sites
- [Dépannage Browser Linux](/fr/tools/browser-linux-troubleshooting)
- [Dépannage Browser WSL2](/fr/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
