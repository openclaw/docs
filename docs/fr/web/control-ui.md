---
read_when:
    - Vous voulez piloter la Gateway depuis un navigateur
    - Vous voulez un accès Tailnet sans tunnels SSH
summary: Interface de contrôle basée sur le navigateur pour la Gateway (chat, Node, configuration)
title: Control UI
x-i18n:
    generated_at: "2026-04-23T07:12:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05bed9a917878d4849eb7502952e27b7c7a3bf848223735d513d545d51baef6d
    source_path: web/control-ui.md
    workflow: 15
---

# Control UI (navigateur)

La Control UI est une petite application monopage **Vite + Lit** servie par la Gateway :

- par défaut : `http://<host>:18789/`
- préfixe optionnel : définissez `gateway.controlUi.basePath` (par ex. `/openclaw`)

Elle parle **directement au WebSocket Gateway** sur le même port.

## Ouverture rapide (local)

Si la Gateway s’exécute sur le même ordinateur, ouvrez :

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Si la page ne se charge pas, démarrez d’abord la Gateway : `openclaw gateway`.

L’authentification est fournie pendant la poignée de main WebSocket via :

- `connect.params.auth.token`
- `connect.params.auth.password`
- en-têtes d’identité Tailscale Serve lorsque `gateway.auth.allowTailscale: true`
- en-têtes d’identité de proxy de confiance lorsque `gateway.auth.mode: "trusted-proxy"`

Le panneau de paramètres du dashboard conserve un jeton pour la session d’onglet navigateur courante
et l’URL Gateway sélectionnée ; les mots de passe ne sont pas conservés. L’onboarding génère généralement
un jeton Gateway pour l’authentification par secret partagé à la première connexion, mais
l’authentification par mot de passe fonctionne aussi lorsque `gateway.auth.mode` vaut `"password"`.

## Appairage d’appareil (première connexion)

Lorsque vous vous connectez à la Control UI depuis un nouveau navigateur ou appareil, la Gateway
exige une **approbation d’appairage unique** — même si vous êtes sur le même Tailnet
avec `gateway.auth.allowTailscale: true`. Il s’agit d’une mesure de sécurité pour éviter
les accès non autorisés.

**Ce que vous verrez :** "disconnected (1008): pairing required"

**Pour approuver l’appareil :**

```bash
# Lister les demandes en attente
openclaw devices list

# Approuver par ID de demande
openclaw devices approve <requestId>
```

Si le navigateur réessaie l’appairage avec des détails d’authentification modifiés (rôle/portées/clé publique), la demande en attente précédente est remplacée et un nouveau `requestId` est créé. Réexécutez `openclaw devices list` avant approbation.

Si le navigateur est déjà appairé et que vous le faites passer d’un accès en lecture à un accès en écriture/admin, cela est traité comme une montée en niveau d’approbation, et non comme une reconnexion silencieuse. OpenClaw conserve l’ancienne approbation active, bloque la reconnexion plus large et vous demande d’approuver explicitement le nouvel ensemble de portées.

Une fois approuvé, l’appareil est mémorisé et ne nécessitera plus de réapprobation sauf
si vous le révoquez avec `openclaw devices revoke --device <id> --role <role>`. Voir
[CLI Devices](/fr/cli/devices) pour la rotation et la révocation de jetons.

**Remarques :**

- Les connexions directes de navigateur local loopback (`127.0.0.1` / `localhost`) sont
  auto-approuvées.
- Les connexions navigateur Tailnet et LAN exigent toujours une approbation explicite, même
  lorsqu’elles proviennent de la même machine.
- Chaque profil navigateur génère un identifiant d’appareil unique, donc changer de navigateur ou effacer les données du navigateur nécessitera un nouvel appairage.

## Identité personnelle (locale au navigateur)

La Control UI prend en charge une identité personnelle par navigateur — un nom d’affichage et
un avatar qui sont attachés aux messages sortants pour l’attribution dans les sessions
partagées. Cette identité vit dans le stockage du navigateur, est limitée au profil
navigateur courant et ne quitte pas l’hôte Gateway sauf si vous la soumettez explicitement
dans une requête.

- L’identité est **locale au navigateur uniquement**. Elle n’est pas synchronisée avec d’autres appareils et ne fait
  pas partie du fichier de configuration Gateway.
- Effacer les données du site ou changer de navigateur réinitialise l’identité à vide ; la
  Control UI ne tente pas d’en reconstruire une à partir de l’état serveur.
- Rien de cette identité personnelle n’est conservé côté serveur au-delà des
  métadonnées normales d’auteur de transcription sur les messages que vous envoyez réellement.

## Point de terminaison de configuration runtime

La Control UI récupère ses paramètres runtime depuis
`/__openclaw/control-ui-config.json`. Ce point de terminaison est protégé par la même
authentification Gateway que le reste de la surface HTTP : les navigateurs non authentifiés ne peuvent pas
le récupérer, et une récupération réussie nécessite soit un jeton/mot de passe Gateway déjà valide,
soit une identité Tailscale Serve, soit une identité de proxy de confiance. Cela évite que
les indicateurs de fonctionnalités de la Control UI et les métadonnées de point de terminaison ne fuitent vers
des scanners non authentifiés sur des hôtes partagés.

## Prise en charge des langues

La Control UI peut se localiser au premier chargement selon la langue de votre navigateur.
Pour la remplacer plus tard, ouvrez **Overview -> Gateway Access -> Language**. Le
sélecteur de langue se trouve dans la carte Gateway Access, pas dans Appearance.

- Langues prises en charge : `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Les traductions non anglaises sont chargées à la demande dans le navigateur.
- La langue sélectionnée est enregistrée dans le stockage du navigateur et réutilisée lors des visites futures.
- Les clés de traduction manquantes reviennent à l’anglais.

## Ce qu’elle peut faire (aujourd’hui)

- Discuter avec le modèle via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Diffuser les appels d’outils + cartes de sortie d’outil live dans le Chat (événements agent)
- Canaux : état des canaux intégrés plus Plugin incluses/externes, connexion QR et configuration par canal (`channels.status`, `web.login.*`, `config.patch`)
- Instances : liste de présence + actualisation (`system-presence`)
- Sessions : liste + remplacements par session de modèle/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`)
- Dreams : état de Dreaming, bascule activer/désactiver et lecteur Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Tâches Cron : lister/ajouter/modifier/exécuter/activer/désactiver + historique d’exécution (`cron.*`)
- Skills : état, activer/désactiver, installer, mises à jour de clé API (`skills.*`)
- Node : liste + capacités (`node.list`)
- Approbations Exec : modifier les listes d’autorisation Gateway ou Node + politique ask pour `exec host=gateway/node` (`exec.approvals.*`)
- Config : afficher/modifier `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Config : appliquer + redémarrer avec validation (`config.apply`) et réveiller la dernière session active
- Les écritures de configuration incluent une garde par hash de base pour empêcher l’écrasement de modifications concurrentes
- Les écritures de configuration (`config.set`/`config.apply`/`config.patch`) effectuent aussi une pré-vérification de la résolution SecretRef active pour les refs dans la charge utile de configuration soumise ; les refs actives soumises non résolues sont rejetées avant écriture
- Schéma de configuration + rendu de formulaire (`config.schema` / `config.schema.lookup`,
  y compris `title` / `description` de champ, indices d’interface correspondants, résumés immédiats des enfants, métadonnées docs sur les nœuds objet générique/array/composition imbriqués, ainsi que les schémas de Plugin + de canal lorsqu’ils sont disponibles) ; l’éditeur Raw JSON n’est
  disponible que lorsque l’instantané a un aller-retour brut sûr
- Si un instantané ne peut pas faire un aller-retour brut en toute sécurité, la Control UI force le mode Form et désactive le mode Raw pour cet instantané
- Le bouton « Reset to saved » de l’éditeur Raw JSON préserve la forme écrite brute (formatage, commentaires, disposition `$include`) au lieu de réafficher un instantané aplati, de sorte que les modifications externes survivent à une réinitialisation lorsque l’instantané peut faire un aller-retour brut en toute sécurité
- Les valeurs d’objet SecretRef structurées sont rendues en lecture seule dans les entrées texte du formulaire pour empêcher une corruption accidentelle objet-vers-chaîne
- Débogage : instantanés d’état/santé/modèles + journal d’événements + appels RPC manuels (`status`, `health`, `models.list`)
- Journaux : tail live des journaux de fichier Gateway avec filtre/export (`logs.tail`)
- Mise à jour : exécuter une mise à jour package/git + redémarrage (`update.run`) avec rapport de redémarrage

Remarques sur le panneau des tâches Cron :

- Pour les tâches isolées, la livraison par défaut est le résumé announce. Vous pouvez passer à none si vous voulez des exécutions internes uniquement.
- Les champs canal/cible apparaissent lorsque announce est sélectionné.
- Le mode Webhook utilise `delivery.mode = "webhook"` avec `delivery.to` défini sur une URL Webhook HTTP(S) valide.
- Pour les tâches de session principale, les modes de livraison webhook et none sont disponibles.
- Les contrôles avancés de modification incluent suppression après exécution, effacement du remplacement d’agent, options cron exact/stagger,
  remplacements d’agent model/thinking et bascules de livraison best-effort.
- La validation du formulaire est inline avec erreurs au niveau des champs ; les valeurs invalides désactivent le bouton d’enregistrement jusqu’à correction.
- Définissez `cron.webhookToken` pour envoyer un jeton bearer dédié ; s’il est omis, le Webhook est envoyé sans en-tête d’authentification.
- Repli obsolète : les anciennes tâches stockées avec `notify: true` peuvent encore utiliser `cron.webhook` jusqu’à migration.

## Comportement du chat

- `chat.send` est **non bloquant** : il accuse réception immédiatement avec `{ runId, status: "started" }` et la réponse est diffusée via des événements `chat`.
- Renvoyer avec la même `idempotencyKey` renvoie `{ status: "in_flight" }` pendant l’exécution, puis `{ status: "ok" }` après achèvement.
- Les réponses `chat.history` sont bornées en taille pour la sécurité de l’UI. Lorsque les entrées de transcription sont trop volumineuses, la Gateway peut tronquer les champs texte longs, omettre les blocs de métadonnées lourds et remplacer les messages surdimensionnés par un espace réservé (`[chat.history omitted: message too large]`).
- `chat.history` supprime aussi du texte assistant visible les balises de directives inline d’affichage uniquement (par exemple `[[reply_to_*]]` et `[[audio_as_voice]]`), les charges utiles XML en texte brut d’appel d’outil (y compris `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` et les blocs d’appel d’outil tronqués), ainsi que les jetons de contrôle de modèle ASCII/pleine largeur ayant fuité, et omet les entrées assistant dont tout le texte visible est exactement le jeton silencieux `NO_REPLY` / `no_reply`.
- `chat.inject` ajoute une note assistant à la transcription de session et diffuse un événement `chat` pour les mises à jour UI uniquement (pas d’exécution d’agent, pas de livraison sur canal).
- Les sélecteurs d’en-tête de chat modèle et thinking patchent immédiatement la session active via `sessions.patch` ; ce sont des remplacements persistants de session, pas des options d’envoi pour un seul tour.
- Arrêt :
  - Cliquez sur **Stop** (appelle `chat.abort`)
  - Tapez `/stop` (ou des phrases d’abandon autonomes comme `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) pour interrompre hors bande
  - `chat.abort` prend en charge `{ sessionKey }` (sans `runId`) pour interrompre toutes les exécutions actives de cette session
- Conservation partielle lors d’abandon :
  - Lorsqu’une exécution est abandonnée, le texte assistant partiel peut toujours être affiché dans l’UI
  - La Gateway conserve le texte assistant partiel abandonné dans l’historique de transcription lorsque la sortie tamponnée existe
  - Les entrées conservées incluent des métadonnées d’abandon afin que les consommateurs de transcription puissent distinguer les partiels abandonnés d’une sortie normale achevée

## Embeds hébergés

Les messages assistant peuvent afficher du contenu web hébergé inline avec le shortcode `[embed ...]`.
La politique sandbox de l’iframe est contrôlée par
`gateway.controlUi.embedSandbox` :

- `strict` : désactive l’exécution de scripts dans les embeds hébergés
- `scripts` : autorise les embeds interactifs tout en conservant l’isolation d’origine ; c’est
  la valeur par défaut et elle suffit généralement pour les jeux/widgets navigateur autonomes
- `trusted` : ajoute `allow-same-origin` en plus de `allow-scripts` pour les documents du même site
  qui ont intentionnellement besoin de privilèges plus élevés

Exemple :

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

Utilisez `trusted` uniquement lorsque le document embarqué a réellement besoin d’un
comportement same-origin. Pour la plupart des jeux générés par agent et des canevas interactifs, `scripts` est
le choix le plus sûr.

Les URL d’embed externes absolues `http(s)` restent bloquées par défaut. Si vous
voulez intentionnellement que `[embed url="https://..."]` charge des pages tierces, définissez
`gateway.controlUi.allowExternalEmbedUrls: true`.

## Accès Tailnet (recommandé)

### Tailscale Serve intégré (préféré)

Conservez la Gateway sur loopback et laissez Tailscale Serve la proxifier en HTTPS :

```bash
openclaw gateway --tailscale serve
```

Ouvrez :

- `https://<magicdns>/` (ou votre `gateway.controlUi.basePath` configuré)

Par défaut, les requêtes Serve Control UI/WebSocket peuvent s’authentifier via les en-têtes d’identité Tailscale
(`tailscale-user-login`) lorsque `gateway.auth.allowTailscale` vaut `true`. OpenClaw
vérifie l’identité en résolvant l’adresse `x-forwarded-for` avec
`tailscale whois` et en la faisant correspondre à l’en-tête, et n’accepte ces en-têtes que lorsque la
requête atteint loopback avec les en-têtes `x-forwarded-*` de Tailscale. Définissez
`gateway.auth.allowTailscale: false` si vous voulez exiger des identifiants explicites à secret partagé
même pour le trafic Serve. Utilisez alors `gateway.auth.mode: "token"` ou
`"password"`.
Pour ce chemin asynchrone d’identité Serve, les tentatives d’authentification échouées pour le même IP client
et la même portée d’authentification sont sérialisées avant les écritures de limitation de débit. Des nouvelles tentatives invalides concurrentes
depuis le même navigateur peuvent donc afficher `retry later` sur la deuxième requête
au lieu de deux simples incompatibilités en course.
L’authentification Serve sans jeton suppose que l’hôte Gateway est digne de confiance. Si du code local non fiable
peut s’exécuter sur cet hôte, exigez une authentification par jeton/mot de passe.

### Liaison au tailnet + jeton

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Ouvrez ensuite :

- `http://<tailscale-ip>:18789/` (ou votre `gateway.controlUi.basePath` configuré)

Collez le secret partagé correspondant dans les paramètres de l’UI (envoyé comme
`connect.params.auth.token` ou `connect.params.auth.password`).

## HTTP non sécurisé

Si vous ouvrez le dashboard en HTTP simple (`http://<lan-ip>` ou `http://<tailscale-ip>`),
le navigateur s’exécute dans un **contexte non sécurisé** et bloque WebCrypto. Par défaut,
OpenClaw **bloque** les connexions Control UI sans identité d’appareil.

Exceptions documentées :

- compatibilité HTTP non sécurisé localhost uniquement avec `gateway.controlUi.allowInsecureAuth=true`
- authentification réussie de Control UI opérateur via `gateway.auth.mode: "trusted-proxy"`
- mode break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correctif recommandé :** utilisez HTTPS (Tailscale Serve) ou ouvrez l’UI localement :

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (sur l’hôte Gateway)

**Comportement de la bascule d’authentification non sécurisée :**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` est une bascule de compatibilité locale uniquement :

- Elle permet aux sessions localhost de la Control UI de continuer sans identité d’appareil dans
  des contextes HTTP non sécurisés.
- Elle ne contourne pas les vérifications d’appairage.
- Elle n’assouplit pas les exigences d’identité d’appareil distante (non localhost).

**Break-glass uniquement :**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` désactive les vérifications d’identité d’appareil de la Control UI et constitue une
dégradation grave de la sécurité. Revenez vite en arrière après usage d’urgence.

Remarque trusted-proxy :

- une authentification trusted-proxy réussie peut admettre des sessions de Control UI **opérateur** sans
  identité d’appareil
- cela ne s’étend **pas** aux sessions de Control UI avec rôle node
- les proxys inverses loopback sur le même hôte ne satisfont toujours pas l’authentification trusted-proxy ; voir
  [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth)

Voir [Tailscale](/fr/gateway/tailscale) pour les conseils de configuration HTTPS.

## Content Security Policy

La Control UI est fournie avec une politique `img-src` stricte : seules les ressources **same-origin** et les URL `data:` sont autorisées. Les URL d’image distantes `http(s)` et relatives au protocole sont rejetées par le navigateur et n’émettent pas de récupération réseau.

Ce que cela signifie en pratique :

- Les avatars et images servis sous des chemins relatifs (par exemple `/avatars/<id>`) continuent de s’afficher.
- Les URL `data:image/...` inline continuent de s’afficher (utile pour les charges utiles dans le protocole).
- Les URL d’avatar distantes émises par les métadonnées de canal sont supprimées dans les assistants d’avatar de la Control UI et remplacées par le logo/badge intégré, de sorte qu’un canal compromis ou malveillant ne peut pas forcer des récupérations d’images distantes arbitraires depuis le navigateur d’un opérateur.

Vous n’avez rien à changer pour obtenir ce comportement — il est toujours activé et non configurable.

## Authentification des routes d’avatar

Lorsque l’authentification Gateway est configurée, le point de terminaison d’avatar de la Control UI exige le même jeton Gateway que le reste de l’API :

- `GET /avatar/<agentId>` renvoie l’image d’avatar uniquement aux appelants authentifiés. `GET /avatar/<agentId>?meta=1` renvoie les métadonnées d’avatar selon la même règle.
- Les requêtes non authentifiées vers l’une ou l’autre route sont rejetées (comme la route sœur assistant-media). Cela empêche la route d’avatar de divulguer l’identité de l’agent sur des hôtes par ailleurs protégés.
- La Control UI elle-même transmet le jeton Gateway comme en-tête bearer lors de la récupération des avatars et utilise des URL blob authentifiées afin que l’image continue de s’afficher dans les dashboards.

Si vous désactivez l’authentification Gateway (déconseillé sur des hôtes partagés), la route d’avatar devient elle aussi non authentifiée, conformément au reste de la Gateway.

## Construction de l’UI

La Gateway sert les fichiers statiques depuis `dist/control-ui`. Construisez-les avec :

```bash
pnpm ui:build
```

Base absolue optionnelle (lorsque vous voulez des URL de ressources fixes) :

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Pour le développement local (serveur de développement séparé) :

```bash
pnpm ui:dev
```

Pointez ensuite l’UI vers votre URL Gateway WS (par ex. `ws://127.0.0.1:18789`).

## Débogage/test : serveur de développement + Gateway distante

La Control UI est composée de fichiers statiques ; la cible WebSocket est configurable et peut être
différente de l’origine HTTP. C’est pratique lorsque vous voulez le serveur de développement Vite
en local mais que la Gateway s’exécute ailleurs.

1. Démarrez le serveur de développement UI : `pnpm ui:dev`
2. Ouvrez une URL comme :

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Authentification ponctuelle optionnelle (si nécessaire) :

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Remarques :

- `gatewayUrl` est stocké dans localStorage après chargement et supprimé de l’URL.
- `token` doit être passé via le fragment d’URL (`#token=...`) lorsque c’est possible. Les fragments ne sont pas envoyés au serveur, ce qui évite les fuites dans les journaux de requête et dans Referer. Les anciens paramètres de requête `?token=` sont encore importés une fois pour compatibilité, mais uniquement en repli, et sont supprimés immédiatement après l’amorçage.
- `password` n’est conservé qu’en mémoire.
- Lorsque `gatewayUrl` est défini, l’UI ne revient pas aux identifiants de configuration ou d’environnement.
  Fournissez explicitement `token` (ou `password`). L’absence d’identifiants explicites est une erreur.
- Utilisez `wss://` lorsque la Gateway est derrière TLS (Tailscale Serve, proxy HTTPS, etc.).
- `gatewayUrl` n’est accepté que dans une fenêtre de niveau supérieur (pas embarquée) pour empêcher le clickjacking.
- Les déploiements de Control UI non-loopback doivent définir explicitement `gateway.controlUi.allowedOrigins`
  (origines complètes). Cela inclut les configurations de développement distantes.
- N’utilisez pas `gateway.controlUi.allowedOrigins: ["*"]` sauf pour des
  tests locaux étroitement contrôlés. Cela signifie autoriser n’importe quelle origine navigateur, pas « correspondre à l’hôte que j’utilise ».
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` active
  le mode de repli d’origine par en-tête Host, mais c’est un mode de sécurité dangereux.

Exemple :

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Détails de configuration de l’accès distant : [Accès distant](/fr/gateway/remote).

## Voir aussi

- [Dashboard](/fr/web/dashboard) — dashboard de la Gateway
- [WebChat](/fr/web/webchat) — interface de chat basée sur le navigateur
- [TUI](/fr/web/tui) — interface utilisateur terminal
- [Health Checks](/fr/gateway/health) — supervision de santé de la Gateway
