---
read_when:
    - Vous voulez utiliser la Gateway depuis un navigateur
    - Vous voulez un accès Tailnet sans tunnels SSH
summary: Interface utilisateur de contrôle basée sur le navigateur pour la Gateway (chat, nœuds, configuration)
title: Control UI
x-i18n:
    generated_at: "2026-04-25T14:00:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 270ef5de55aa3bd34b8e9dcdea9f8dbe0568539edc268c809d652b838e8f5219
    source_path: web/control-ui.md
    workflow: 15
---

Le Control UI est une petite application monopage **Vite + Lit** servie par la Gateway :

- par défaut : `http://<host>:18789/`
- préfixe facultatif : définissez `gateway.controlUi.basePath` (par ex. `/openclaw`)

Il communique **directement avec le WebSocket de la Gateway** sur le même port.

## Ouverture rapide (locale)

Si la Gateway s’exécute sur le même ordinateur, ouvrez :

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Si la page ne se charge pas, démarrez d’abord la Gateway : `openclaw gateway`.

L’authentification est fournie pendant la poignée de main WebSocket via :

- `connect.params.auth.token`
- `connect.params.auth.password`
- les en-têtes d’identité Tailscale Serve lorsque `gateway.auth.allowTailscale: true`
- les en-têtes d’identité trusted-proxy lorsque `gateway.auth.mode: "trusted-proxy"`

Le panneau des paramètres du tableau de bord conserve un jeton pour la session
de l’onglet actuel du navigateur et l’URL de Gateway sélectionnée ;
les mots de passe ne sont pas conservés. L’intégration génère généralement
un jeton Gateway pour l’authentification par secret partagé lors de la première connexion, mais l’authentification par
mot de passe fonctionne aussi lorsque `gateway.auth.mode` vaut `"password"`.

## Appairage de l’appareil (première connexion)

Lorsque vous vous connectez au Control UI depuis un nouveau navigateur ou appareil, la Gateway
exige une **approbation d’appairage unique** — même si vous êtes sur le même Tailnet
avec `gateway.auth.allowTailscale: true`. Il s’agit d’une mesure de sécurité visant à empêcher
les accès non autorisés.

**Ce que vous verrez :** "disconnected (1008): pairing required"

**Pour approuver l’appareil :**

```bash
# Lister les demandes en attente
openclaw devices list

# Approuver par identifiant de demande
openclaw devices approve <requestId>
```

Si le navigateur réessaie l’appairage avec des détails d’authentification modifiés (rôle/scopes/clé
publique), la demande en attente précédente est remplacée et un nouveau `requestId` est
créé. Réexécutez `openclaw devices list` avant l’approbation.

Si le navigateur est déjà appairé et que vous le faites passer d’un accès en lecture à
un accès en écriture/admin, cela est traité comme une élévation d’approbation, et non comme
une reconnexion silencieuse. OpenClaw conserve l’ancienne approbation active, bloque la reconnexion
élargie et vous demande d’approuver explicitement le nouvel ensemble de scopes.

Une fois approuvé, l’appareil est mémorisé et ne nécessitera pas de nouvelle approbation, sauf
si vous la révoquez avec `openclaw devices revoke --device <id> --role <role>`. Voir
[CLI Devices](/fr/cli/devices) pour la rotation et la révocation des jetons.

**Remarques :**

- Les connexions directes du navigateur local en loopback (`127.0.0.1` / `localhost`) sont
  approuvées automatiquement.
- Les connexions du navigateur via Tailnet et LAN nécessitent toujours une approbation explicite, même lorsqu’elles
  proviennent de la même machine.
- Chaque profil de navigateur génère un identifiant d’appareil unique ; changer de navigateur ou
  effacer les données du navigateur nécessitera donc un nouvel appairage.

## Identité personnelle (locale au navigateur)

Le Control UI prend en charge une identité personnelle par navigateur (nom d’affichage et
avatar) attachée aux messages sortants pour l’attribution dans les sessions partagées. Elle
réside dans le stockage du navigateur, est limitée au profil de navigateur actuel et n’est pas
synchronisée vers d’autres appareils ni persistée côté serveur au-delà des métadonnées
normales d’auteur de transcription sur les messages que vous envoyez réellement. L’effacement des données du site ou
le changement de navigateur la réinitialise à vide.

## Endpoint de configuration d’exécution

Le Control UI récupère ses paramètres d’exécution depuis
`/__openclaw/control-ui-config.json`. Cet endpoint est protégé par la même
authentification Gateway que le reste de la surface HTTP : les navigateurs non authentifiés ne peuvent pas
le récupérer, et une récupération réussie nécessite soit un jeton/mot de passe Gateway déjà valide,
soit une identité Tailscale Serve, soit une identité trusted-proxy.

## Prise en charge des langues

Le Control UI peut se localiser lui-même au premier chargement selon la langue de votre navigateur.
Pour la remplacer plus tard, ouvrez **Overview -> Gateway Access -> Language**. Le
sélecteur de langue se trouve dans la carte Gateway Access, et non sous Appearance.

- Langues prises en charge : `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Les traductions non anglaises sont chargées à la demande dans le navigateur.
- La langue sélectionnée est enregistrée dans le stockage du navigateur et réutilisée lors des visites futures.
- Les clés de traduction manquantes reviennent à l’anglais.

## Ce qu’il peut faire (aujourd’hui)

- Discuter avec le modèle via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Dialoguer directement avec OpenAI Realtime depuis le navigateur via WebRTC. La Gateway
  génère un secret client Realtime de courte durée avec `talk.realtime.session` ; le
  navigateur envoie l’audio du microphone directement à OpenAI et relaie les appels d’outil
  `openclaw_agent_consult` via `chat.send` pour le modèle OpenClaw
  plus grand configuré.
- Diffuser les appels d’outils + cartes de sortie d’outils en direct dans le Chat (événements d’agent)
- Canaux : statut des canaux intégrés, des plugins intégrés/externes, connexion par QR et configuration par canal (`channels.status`, `web.login.*`, `config.patch`)
- Instances : liste de présence + actualisation (`system-presence`)
- Sessions : liste + remplacements par session pour modèle/réflexion/rapide/verbeux/trace/raisonnement (`sessions.list`, `sessions.patch`)
- Dreams : statut de Dreaming, bascule activer/désactiver et lecteur Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Tâches Cron : lister/ajouter/modifier/exécuter/activer/désactiver + historique d’exécution (`cron.*`)
- Skills : statut, activer/désactiver, installer, mises à jour de clé API (`skills.*`)
- Nodes : liste + capacités (`node.list`)
- Approbations exec : modifier les allowlists de Gateway ou de Node + stratégie ask pour `exec host=gateway/node` (`exec.approvals.*`)
- Configuration : afficher/modifier `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Configuration : appliquer + redémarrer avec validation (`config.apply`) et réveiller la dernière session active
- Les écritures de configuration incluent une protection base-hash pour éviter d’écraser des modifications concurrentes
- Les écritures de configuration (`config.set`/`config.apply`/`config.patch`) pré-vérifient aussi la résolution active de SecretRef pour les références dans la charge utile de configuration soumise ; les références actives non résolues soumises sont rejetées avant l’écriture
- Schéma de configuration + rendu de formulaire (`config.schema` / `config.schema.lookup`,
  y compris les champs `title` / `description`, les indices d’interface correspondants, les résumés des enfants immédiats,
  les métadonnées de documentation sur les nœuds d’objet imbriqué/joker/tableau/composition,
  plus les schémas de Plugin + de canal lorsque disponibles) ; l’éditeur Raw JSON n’est
  disponible que lorsque l’instantané prend en charge un aller-retour brut sûr
- Si un instantané ne peut pas faire un aller-retour de texte brut en toute sécurité, le Control UI force le mode Form et désactive le mode Raw pour cet instantané
- Dans l’éditeur Raw JSON, "Reset to saved" préserve la forme rédigée en brut (mise en forme, commentaires, disposition `$include`) au lieu de refaire le rendu d’un instantané aplati, de sorte que les modifications externes survivent à une réinitialisation lorsque l’instantané peut faire un aller-retour brut en toute sécurité
- Les valeurs d’objet SecretRef structurées sont rendues en lecture seule dans les champs texte du formulaire afin d’éviter toute corruption accidentelle objet-vers-chaîne
- Débogage : instantanés de statut/état/modèles + journal des événements + appels RPC manuels (`status`, `health`, `models.list`)
- Journaux : suivi en direct des journaux de fichiers de la Gateway avec filtre/export (`logs.tail`)
- Mise à jour : exécuter une mise à jour package/git + redémarrage (`update.run`) avec un rapport de redémarrage

Remarques sur le panneau des tâches Cron :

- Pour les tâches isolées, la remise est par défaut sur un résumé annoncé. Vous pouvez basculer sur none si vous voulez des exécutions internes uniquement.
- Les champs canal/cible apparaissent lorsque announce est sélectionné.
- Le mode Webhook utilise `delivery.mode = "webhook"` avec `delivery.to` défini sur une URL Webhook HTTP(S) valide.
- Pour les tâches de session principale, les modes de remise webhook et none sont disponibles.
- Les contrôles de modification avancée incluent delete-after-run, clear agent override, options Cron exact/stagger,
  remplacements de modèle/réflexion pour l’agent et bascules de remise best-effort.
- La validation du formulaire est en ligne avec des erreurs au niveau des champs ; les valeurs invalides désactivent le bouton d’enregistrement jusqu’à correction.
- Définissez `cron.webhookToken` pour envoyer un bearer token dédié ; s’il est omis, le webhook est envoyé sans en-tête d’authentification.
- Repli obsolète : les anciennes tâches stockées avec `notify: true` peuvent encore utiliser `cron.webhook` jusqu’à leur migration.

## Comportement du Chat

- `chat.send` est **non bloquant** : il accuse réception immédiatement avec `{ runId, status: "started" }` et la réponse est diffusée via des événements `chat`.
- Un nouvel envoi avec la même `idempotencyKey` renvoie `{ status: "in_flight" }` pendant l’exécution, puis `{ status: "ok" }` après achèvement.
- Les réponses `chat.history` sont limitées en taille pour la sécurité de l’interface. Lorsque les entrées de transcription sont trop volumineuses, la Gateway peut tronquer les champs texte longs, omettre les blocs de métadonnées volumineux et remplacer les messages surdimensionnés par un espace réservé (`[chat.history omitted: message too large]`).
- Les images d’assistant/générées sont persistées en tant que références média gérées et resservies via des URL média Gateway authentifiées, de sorte que les rechargements ne dépendent pas du maintien de charges utiles d’image base64 brutes dans la réponse d’historique du chat.
- `chat.history` retire aussi du texte visible de l’assistant les balises de directive inline d’affichage uniquement (par exemple `[[reply_to_*]]` et `[[audio_as_voice]]`), les charges utiles XML d’appel d’outils en texte brut (y compris `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, ainsi que les blocs d’appel d’outils tronqués), les jetons de contrôle de modèle ASCII/pleine largeur divulgués, et omet les entrées d’assistant dont tout le texte visible est uniquement le jeton silencieux exact `NO_REPLY` / `no_reply`.
- Pendant un envoi actif et l’actualisation finale de l’historique, la vue du chat conserve visibles les messages utilisateur/assistant optimistes locaux si `chat.history` renvoie brièvement un instantané plus ancien ; la transcription canonique remplace ces messages locaux une fois que l’historique Gateway a rattrapé son retard.
- `chat.inject` ajoute une note d’assistant à la transcription de session et diffuse un événement `chat` pour les mises à jour de l’interface uniquement (pas d’exécution d’agent, pas de remise par canal).
- Les sélecteurs de modèle et de réflexion dans l’en-tête du chat modifient immédiatement la session active via `sessions.patch` ; ce sont des remplacements persistants de session, et non des options d’envoi limitées à un seul tour.
- Lorsque les nouveaux rapports d’utilisation de session de la Gateway montrent une forte pression de contexte, la zone du compositeur du chat affiche un avis de contexte et, aux niveaux de Compaction recommandés, un bouton compact qui exécute le chemin normal de compaction de session. Les instantanés de jetons obsolètes sont masqués jusqu’à ce que la Gateway signale à nouveau une utilisation récente.
- Le mode Talk utilise un fournisseur de voix temps réel enregistré qui prend en charge les sessions WebRTC du navigateur. Configurez OpenAI avec `talk.provider: "openai"` plus `talk.providers.openai.apiKey`, ou réutilisez la configuration du fournisseur temps réel Voice Call. Le navigateur ne reçoit jamais la clé API OpenAI standard ; il reçoit uniquement le secret client Realtime éphémère. La voix temps réel Google Live est prise en charge pour Voice Call backend et les ponts Google Meet, mais pas encore pour ce chemin WebRTC de navigateur. Le prompt de session Realtime est assemblé par la Gateway ; `talk.realtime.session` n’accepte pas de remplacements d’instructions fournis par l’appelant.
- Dans le compositeur du Chat, la commande Talk est le bouton en forme d’ondes à côté du bouton de dictée microphone. Lorsque Talk démarre, la ligne d’état du compositeur affiche `Connecting Talk...`, puis `Talk live` pendant que l’audio est connecté, ou `Asking OpenClaw...` lorsqu’un appel d’outil temps réel consulte le modèle plus grand configuré via `chat.send`.
- Arrêt :
  - Cliquez sur **Stop** (appelle `chat.abort`)
  - Pendant qu’une exécution est active, les suivis normaux sont mis en file d’attente. Cliquez sur **Steer** sur un message en file d’attente pour injecter ce suivi dans le tour en cours.
  - Tapez `/stop` (ou des phrases d’abandon autonomes comme `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) pour interrompre hors bande
  - `chat.abort` prend en charge `{ sessionKey }` (sans `runId`) pour interrompre toutes les exécutions actives de cette session
- Conservation partielle après interruption :
  - Lorsqu’une exécution est interrompue, un texte partiel de l’assistant peut toujours être affiché dans l’interface
  - La Gateway persiste le texte partiel interrompu de l’assistant dans l’historique de transcription lorsqu’une sortie en mémoire tampon existe
  - Les entrées persistées incluent des métadonnées d’interruption afin que les consommateurs de transcription puissent distinguer les partiels interrompus des sorties normales achevées

## Installation PWA et push web

Le Control UI fournit un `manifest.webmanifest` et un service worker, de sorte que
les navigateurs modernes peuvent l’installer comme PWA autonome. Web Push permet à la
Gateway de réveiller la PWA installée avec des notifications même lorsque l’onglet ou
la fenêtre du navigateur n’est pas ouvert(e).

| Surface                                               | Fonction                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifeste PWA. Les navigateurs proposent « Installer l’application » une fois qu’il est accessible. |
| `ui/public/sw.js`                                     | Service worker qui gère les événements `push` et les clics sur les notifications. |
| `push/vapid-keys.json` (dans le répertoire d’état OpenClaw) | Paire de clés VAPID générée automatiquement utilisée pour signer les charges utiles Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoints d’abonnement du navigateur persistés.                    |

Remplacez la paire de clés VAPID via des variables d’environnement sur le processus Gateway lorsque
vous voulez épingler les clés (pour les déploiements multi-hôtes, la rotation des secrets ou
les tests) :

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (par défaut `mailto:openclaw@localhost`)

Le Control UI utilise ces méthodes Gateway protégées par scope pour enregistrer et
tester les abonnements du navigateur :

- `push.web.vapidPublicKey` — récupère la clé publique VAPID active.
- `push.web.subscribe` — enregistre un `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — supprime un endpoint enregistré.
- `push.web.test` — envoie une notification de test à l’abonnement de l’appelant.

Web Push est indépendant du chemin de relais APNS iOS
(voir [Configuration](/fr/gateway/configuration) pour le push via relais) et
de la méthode existante `push.test`, qui cible l’appairage mobile natif.

## Embeds hébergés

Les messages de l’assistant peuvent afficher du contenu web hébergé en ligne avec le shortcode `[embed ...]`.
La politique de sandbox iframe est contrôlée par
`gateway.controlUi.embedSandbox` :

- `strict` : désactive l’exécution de scripts dans les embeds hébergés
- `scripts` : autorise les embeds interactifs tout en conservant l’isolation d’origine ; c’est
  la valeur par défaut et elle est généralement suffisante pour les jeux/widgets de navigateur autonomes
- `trusted` : ajoute `allow-same-origin` en plus de `allow-scripts` pour les documents du même site
  qui ont intentionnellement besoin de privilèges plus élevés

Exemple :

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

Utilisez `trusted` uniquement lorsque le document intégré a réellement besoin d’un comportement
same-origin. Pour la plupart des jeux générés par l’agent et des canevas interactifs, `scripts` est
le choix le plus sûr.

Les URL d’embed externes absolues en `http(s)` restent bloquées par défaut. Si vous
voulez intentionnellement que `[embed url="https://..."]` charge des pages tierces, définissez
`gateway.controlUi.allowExternalEmbedUrls: true`.

## Accès Tailnet (recommandé)

### Tailscale Serve intégré (préféré)

Gardez la Gateway en loopback et laissez Tailscale Serve la proxifier avec HTTPS :

```bash
openclaw gateway --tailscale serve
```

Ouvrez :

- `https://<magicdns>/` (ou votre `gateway.controlUi.basePath` configuré)

Par défaut, les requêtes Serve de Control UI/WebSocket peuvent s’authentifier via les en-têtes d’identité Tailscale
(`tailscale-user-login`) lorsque `gateway.auth.allowTailscale` vaut `true`. OpenClaw
vérifie l’identité en résolvant l’adresse `x-forwarded-for` avec
`tailscale whois` et en la faisant correspondre à l’en-tête, et n’accepte ces en-têtes que lorsque la
requête atteint le loopback avec les en-têtes `x-forwarded-*` de Tailscale. Définissez
`gateway.auth.allowTailscale: false` si vous voulez exiger des identifiants explicites par secret partagé
même pour le trafic Serve. Utilisez alors `gateway.auth.mode: "token"` ou
`"password"`.
Pour ce chemin d’identité Serve asynchrone, les tentatives d’authentification échouées pour la même IP cliente
et le même scope d’authentification sont sérialisées avant les écritures de limitation de débit. Des nouvelles tentatives incorrectes
concurrentes depuis le même navigateur peuvent donc afficher `retry later` à la deuxième requête
au lieu de deux échecs simples se produisant en parallèle.
L’authentification Serve sans jeton suppose que l’hôte de la gateway est fiable. Si du code local non fiable
peut s’exécuter sur cet hôte, exigez une authentification par jeton/mot de passe.

### Liaison au tailnet + jeton

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Ouvrez ensuite :

- `http://<tailscale-ip>:18789/` (ou votre `gateway.controlUi.basePath` configuré)

Collez le secret partagé correspondant dans les paramètres de l’interface (envoyé en tant que
`connect.params.auth.token` ou `connect.params.auth.password`).

## HTTP non sécurisé

Si vous ouvrez le tableau de bord en HTTP simple (`http://<lan-ip>` ou `http://<tailscale-ip>`),
le navigateur s’exécute dans un **contexte non sécurisé** et bloque WebCrypto. Par défaut,
OpenClaw **bloque** les connexions Control UI sans identité d’appareil.

Exceptions documentées :

- compatibilité HTTP non sécurisé localhost uniquement avec `gateway.controlUi.allowInsecureAuth=true`
- authentification réussie d’opérateur Control UI via `gateway.auth.mode: "trusted-proxy"`
- option de secours `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correctif recommandé :** utilisez HTTPS (Tailscale Serve) ou ouvrez l’interface localement :

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (sur l’hôte gateway)

**Comportement de la bascule d’authentification non sécurisée :**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` n’est qu’une bascule locale de compatibilité :

- Elle permet aux sessions localhost du Control UI de continuer sans identité d’appareil dans
  des contextes HTTP non sécurisés.
- Elle ne contourne pas les vérifications d’appairage.
- Elle n’assouplit pas les exigences d’identité d’appareil à distance (hors localhost).

**Secours uniquement :**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` désactive les vérifications d’identité d’appareil du Control UI et constitue
une grave dégradation de sécurité. Revenez rapidement en arrière après un usage d’urgence.

Remarque sur trusted-proxy :

- une authentification trusted-proxy réussie peut admettre des sessions **operator** du Control UI sans
  identité d’appareil
- cela ne s’étend **pas** aux sessions du Control UI avec rôle node
- les proxys inverses loopback sur le même hôte ne satisfont toujours pas l’authentification trusted-proxy ; voir
  [Authentification trusted-proxy](/fr/gateway/trusted-proxy-auth)

Voir [Tailscale](/fr/gateway/tailscale) pour les conseils de configuration HTTPS.

## Politique de sécurité du contenu

Le Control UI est fourni avec une politique `img-src` stricte : seuls les ressources de **même origine**, les URL `data:` et les URL `blob:` générées localement sont autorisées. Les URL d’image distantes `http(s)` et relatives au protocole sont rejetées par le navigateur et n’émettent pas de requêtes réseau.

Ce que cela signifie en pratique :

- Les avatars et images servis sous des chemins relatifs (par exemple `/avatars/<id>`) s’affichent toujours, y compris les routes d’avatar authentifiées que l’interface récupère puis convertit en URL `blob:` locales.
- Les URL inline `data:image/...` s’affichent toujours (utile pour les charges utiles dans le protocole).
- Les URL `blob:` locales créées par le Control UI s’affichent toujours.
- Les URL d’avatar distantes émises par les métadonnées de canal sont retirées par les helpers d’avatar du Control UI et remplacées par le logo/le badge intégré, de sorte qu’un canal compromis ou malveillant ne puisse pas forcer des récupérations d’images distantes arbitraires depuis le navigateur d’un opérateur.

Vous n’avez rien à changer pour obtenir ce comportement — il est toujours actif et n’est pas configurable.

## Authentification de la route d’avatar

Lorsque l’authentification gateway est configurée, l’endpoint d’avatar du Control UI exige le même jeton gateway que le reste de l’API :

- `GET /avatar/<agentId>` renvoie l’image de l’avatar uniquement aux appelants authentifiés. `GET /avatar/<agentId>?meta=1` renvoie les métadonnées de l’avatar selon la même règle.
- Les requêtes non authentifiées vers l’une ou l’autre route sont rejetées (comme la route sœur assistant-media). Cela empêche la route d’avatar de divulguer l’identité de l’agent sur des hôtes par ailleurs protégés.
- Le Control UI lui-même transmet le jeton gateway comme en-tête bearer lors de la récupération des avatars, et utilise des URL blob authentifiées pour que l’image s’affiche toujours dans les tableaux de bord.

Si vous désactivez l’authentification gateway (non recommandé sur des hôtes partagés), la route d’avatar devient également non authentifiée, en cohérence avec le reste de la gateway.

## Construire l’interface

La Gateway sert les fichiers statiques depuis `dist/control-ui`. Construisez-les avec :

```bash
pnpm ui:build
```

Base absolue facultative (lorsque vous voulez des URL de ressources fixes) :

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Pour le développement local (serveur de développement séparé) :

```bash
pnpm ui:dev
```

Pointez ensuite l’interface vers l’URL WS de votre Gateway (par ex. `ws://127.0.0.1:18789`).

## Débogage/test : serveur de développement + Gateway distante

Le Control UI se compose de fichiers statiques ; la cible WebSocket est configurable et peut être
différente de l’origine HTTP. C’est pratique lorsque vous voulez le serveur de développement Vite
en local mais que la Gateway s’exécute ailleurs.

1. Démarrez le serveur de développement de l’interface : `pnpm ui:dev`
2. Ouvrez une URL comme :

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Authentification ponctuelle facultative (si nécessaire) :

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Remarques :

- `gatewayUrl` est stocké dans localStorage après chargement et supprimé de l’URL.
- `token` doit être transmis via le fragment d’URL (`#token=...`) chaque fois que possible. Les fragments ne sont pas envoyés au serveur, ce qui évite les fuites dans les journaux de requêtes et via Referer. Les anciens paramètres de requête `?token=` sont encore importés une fois pour compatibilité, mais seulement comme repli, et sont supprimés immédiatement après l’initialisation.
- `password` n’est conservé qu’en mémoire.
- Lorsque `gatewayUrl` est défini, l’interface ne revient pas aux identifiants de configuration ou d’environnement.
  Fournissez `token` (ou `password`) explicitement. L’absence d’identifiants explicites est une erreur.
- Utilisez `wss://` lorsque la Gateway est derrière TLS (Tailscale Serve, proxy HTTPS, etc.).
- `gatewayUrl` n’est accepté que dans une fenêtre de premier niveau (non intégrée) afin d’empêcher le clickjacking.
- Les déploiements Control UI hors loopback doivent définir explicitement `gateway.controlUi.allowedOrigins`
  (origines complètes). Cela inclut les configurations de développement à distance.
- N’utilisez pas `gateway.controlUi.allowedOrigins: ["*"]` sauf pour des tests locaux
  étroitement contrôlés. Cela signifie autoriser n’importe quelle origine de navigateur, pas « faire correspondre l’hôte que j’utilise ».
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` active
  le mode de repli d’origine par en-tête Host, mais c’est un mode de sécurité dangereux.

Exemple :

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Détails de configuration de l’accès distant : [Accès distant](/fr/gateway/remote).

## Lié

- [Dashboard](/fr/web/dashboard) — tableau de bord de la gateway
- [WebChat](/fr/web/webchat) — interface de chat basée sur le navigateur
- [TUI](/fr/web/tui) — interface utilisateur en terminal
- [Contrôles d’état](/fr/gateway/health) — surveillance de l’état de la gateway
