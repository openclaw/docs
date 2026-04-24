---
read_when:
    - Vous souhaitez utiliser le Gateway depuis un navigateur
    - Vous souhaitez un accès Tailnet sans tunnels SSH
summary: Interface de contrôle basée sur le navigateur pour le Gateway (chat, nœuds, configuration)
title: Interface de contrôle
x-i18n:
    generated_at: "2026-04-24T08:58:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: c84a74e20d6c8829168025830ff4ec8f650f10f72fcaed7c8d2f5d92ab98d616
    source_path: web/control-ui.md
    workflow: 15
---

L’interface de contrôle est une petite application monopage **Vite + Lit** servie par le Gateway :

- par défaut : `http://<host>:18789/`
- préfixe facultatif : définissez `gateway.controlUi.basePath` (par exemple `/openclaw`)

Elle communique **directement avec le WebSocket du Gateway** sur le même port.

## Ouverture rapide (local)

Si le Gateway fonctionne sur le même ordinateur, ouvrez :

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Si la page ne se charge pas, démarrez d’abord le Gateway : `openclaw gateway`.

L’authentification est fournie lors de la négociation WebSocket via :

- `connect.params.auth.token`
- `connect.params.auth.password`
- les en-têtes d’identité Tailscale Serve lorsque `gateway.auth.allowTailscale: true`
- les en-têtes d’identité de proxy approuvé lorsque `gateway.auth.mode: "trusted-proxy"`

Le panneau de paramètres du tableau de bord conserve un jeton pour la session
de l’onglet actuel du navigateur et l’URL du Gateway sélectionnée ; les mots de passe ne sont pas persistés. L’intégration initiale génère généralement
un jeton Gateway pour l’authentification par secret partagé lors de la première connexion, mais l’authentification par mot de passe fonctionne aussi lorsque `gateway.auth.mode` vaut `"password"`.

## Appairage de l’appareil (première connexion)

Lorsque vous vous connectez à l’interface de contrôle depuis un nouveau navigateur ou appareil, le Gateway
exige **une approbation d’appairage à usage unique** — même si vous êtes sur le même Tailnet
avec `gateway.auth.allowTailscale: true`. Il s’agit d’une mesure de sécurité visant à empêcher
les accès non autorisés.

**Ce que vous verrez :** `disconnected (1008): pairing required`

**Pour approuver l’appareil :**

```bash
# Lister les demandes en attente
openclaw devices list

# Approuver par ID de demande
openclaw devices approve <requestId>
```

Si le navigateur relance l’appairage avec des détails d’authentification modifiés (rôle/portées/clé
publique), la demande en attente précédente est remplacée et un nouveau `requestId` est
créé. Exécutez de nouveau `openclaw devices list` avant l’approbation.

Si le navigateur est déjà appairé et que vous passez d’un accès en lecture à
un accès en écriture/admin, cela est traité comme une montée de privilèges d’approbation, et non comme une reconnexion silencieuse.
OpenClaw conserve l’ancienne approbation active, bloque la reconnexion élargie,
et vous demande d’approuver explicitement le nouvel ensemble de portées.

Une fois approuvé, l’appareil est mémorisé et ne nécessitera pas de nouvelle approbation, sauf
si vous le révoquez avec `openclaw devices revoke --device <id> --role <role>`. Voir
[CLI Devices](/fr/cli/devices) pour la rotation des jetons et la révocation.

**Remarques :**

- Les connexions directes du navigateur en local loopback (`127.0.0.1` / `localhost`) sont
  approuvées automatiquement.
- Les connexions navigateur via Tailnet et LAN exigent toujours une approbation explicite, même lorsqu’elles
  proviennent de la même machine.
- Chaque profil de navigateur génère un identifiant d’appareil unique ; changer de navigateur ou
  effacer les données du navigateur exigera donc un nouvel appairage.

## Identité personnelle (locale au navigateur)

L’interface de contrôle prend en charge une identité personnelle par navigateur (nom d’affichage et
avatar) attachée aux messages sortants pour l’attribution dans les sessions partagées. Elle
est stockée dans le navigateur, limitée au profil de navigateur actuel, et n’est pas
synchronisée avec d’autres appareils ni persistée côté serveur au-delà des métadonnées normales
d’auteur dans la transcription des messages que vous envoyez réellement. Effacer les données du site ou
changer de navigateur la réinitialise à vide.

## Point de terminaison de configuration d’exécution

L’interface de contrôle récupère ses paramètres d’exécution depuis
`/__openclaw/control-ui-config.json`. Ce point de terminaison est protégé par la même
authentification Gateway que le reste de la surface HTTP : les navigateurs non authentifiés ne peuvent pas
le récupérer, et une récupération réussie exige soit un jeton/mot de passe Gateway déjà valide,
soit une identité Tailscale Serve, soit une identité de proxy approuvé.

## Prise en charge des langues

L’interface de contrôle peut se localiser lors du premier chargement en fonction de la langue de votre navigateur.
Pour la remplacer ensuite, ouvrez **Overview -> Gateway Access -> Language**. Le
sélecteur de langue se trouve dans la carte Gateway Access, et non sous Appearance.

- Langues prises en charge : `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Les traductions autres qu’en anglais sont chargées à la demande dans le navigateur.
- La langue sélectionnée est enregistrée dans le stockage du navigateur et réutilisée lors des visites futures.
- Les clés de traduction manquantes reviennent à l’anglais.

## Ce qu’elle peut faire (aujourd’hui)

- Discuter avec le modèle via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Communiquer directement avec OpenAI Realtime depuis le navigateur via WebRTC. Le Gateway
  génère un secret client Realtime de courte durée avec `talk.realtime.session` ; le
  navigateur envoie l’audio du microphone directement à OpenAI et relaie
  les appels d’outil `openclaw_agent_consult` via `chat.send` pour le modèle OpenClaw
  plus grand configuré.
- Diffuser les appels d’outil + cartes de sortie d’outil en direct dans le chat (événements d’agent)
- Canaux : statut des canaux intégrés ainsi que des canaux de Plugin bundled/externes, connexion QR, et configuration par canal (`channels.status`, `web.login.*`, `config.patch`)
- Instances : liste de présence + actualisation (`system-presence`)
- Sessions : liste + remplacements par session pour modèle/réflexion/rapide/verbeux/trace/raisonnement (`sessions.list`, `sessions.patch`)
- Dreams : état de Dreaming, activation/désactivation, et lecteur de Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Tâches Cron : lister/ajouter/modifier/exécuter/activer/désactiver + historique d’exécution (`cron.*`)
- Skills : état, activation/désactivation, installation, mises à jour de clé API (`skills.*`)
- Nœuds : liste + capacités (`node.list`)
- Approbations exec : modifier les listes d’autorisation du Gateway ou du nœud + demander la stratégie pour `exec host=gateway/node` (`exec.approvals.*`)
- Configuration : afficher/modifier `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Configuration : appliquer + redémarrer avec validation (`config.apply`) et réveiller la dernière session active
- Les écritures de configuration incluent une protection par hachage de base pour éviter d’écraser des modifications concurrentes
- Les écritures de configuration (`config.set`/`config.apply`/`config.patch`) effectuent également en amont la résolution active des SecretRef pour les références présentes dans la charge utile de configuration envoyée ; les références actives non résolues présentes dans la charge utile envoyée sont rejetées avant l’écriture
- Schéma de configuration + rendu de formulaire (`config.schema` / `config.schema.lookup`,
  y compris les champs `title` / `description`, les indications d’interface correspondantes, les résumés immédiats des enfants,
  les métadonnées de documentation sur les nœuds d’objet imbriqué/joker/tableau/composition,
  ainsi que les schémas de Plugin + de canal lorsqu’ils sont disponibles) ; l’éditeur JSON brut n’est
  disponible que lorsque l’instantané peut effectuer un aller-retour sûr du brut
- Si un instantané ne peut pas effectuer en toute sécurité un aller-retour du texte brut, l’interface de contrôle force le mode Form et désactive le mode Raw pour cet instantané
- Dans l’éditeur JSON brut, « Reset to saved » préserve la forme rédigée en brut (mise en forme, commentaires, structure `$include`) au lieu de réafficher un instantané aplati, afin que les modifications externes survivent à une réinitialisation lorsque l’instantané peut effectuer un aller-retour sûr
- Les valeurs d’objet SecretRef structurées sont affichées en lecture seule dans les champs texte du formulaire afin d’éviter une corruption accidentelle d’objet en chaîne
- Débogage : instantanés d’état/santé/modèles + journal d’événements + appels RPC manuels (`status`, `health`, `models.list`)
- Journaux : suivi en direct des journaux de fichiers du Gateway avec filtre/export (`logs.tail`)
- Mise à jour : exécuter une mise à jour de paquet/git + redémarrage (`update.run`) avec rapport de redémarrage

Remarques sur le panneau des tâches Cron :

- Pour les tâches isolées, le mode de livraison par défaut est l’annonce du résumé. Vous pouvez passer à aucun si vous souhaitez des exécutions internes uniquement.
- Les champs canal/cible apparaissent lorsque l’annonce est sélectionnée.
- Le mode Webhook utilise `delivery.mode = "webhook"` avec `delivery.to` défini sur une URL Webhook HTTP(S) valide.
- Pour les tâches de session principale, les modes de livraison webhook et none sont disponibles.
- Les contrôles de modification avancés incluent supprimer après exécution, effacer le remplacement d’agent, les options Cron exactes/échelonnées,
  les remplacements de modèle/réflexion d’agent, et les bascules de livraison au mieux.
- La validation du formulaire est en ligne avec des erreurs au niveau des champs ; les valeurs invalides désactivent le bouton d’enregistrement jusqu’à correction.
- Définissez `cron.webhookToken` pour envoyer un jeton bearer dédié ; s’il est omis, le webhook est envoyé sans en-tête d’authentification.
- Solution de repli obsolète : les anciennes tâches enregistrées avec `notify: true` peuvent encore utiliser `cron.webhook` jusqu’à leur migration.

## Comportement du chat

- `chat.send` est **non bloquant** : il accuse réception immédiatement avec `{ runId, status: "started" }` et la réponse est diffusée via les événements `chat`.
- Un nouvel envoi avec la même `idempotencyKey` renvoie `{ status: "in_flight" }` pendant l’exécution, et `{ status: "ok" }` après la fin.
- Les réponses `chat.history` sont limitées en taille pour la sécurité de l’interface. Lorsque les entrées de transcription sont trop volumineuses, le Gateway peut tronquer les longs champs texte, omettre les blocs de métadonnées lourds, et remplacer les messages surdimensionnés par un espace réservé (`[chat.history omitted: message too large]`).
- Les images d’assistant/générées sont conservées comme références média gérées et servies à nouveau via des URL média Gateway authentifiées, de sorte que les rechargements ne dépendent pas du maintien des charges utiles d’image base64 brutes dans la réponse de l’historique du chat.
- `chat.history` supprime également du texte visible de l’assistant les balises de directive en ligne uniquement destinées à l’affichage (par exemple `[[reply_to_*]]` et `[[audio_as_voice]]`), les charges utiles XML d’appel d’outil en texte brut (y compris `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` et les blocs d’appel d’outil tronqués), ainsi que les jetons de contrôle de modèle ASCII/pleine largeur divulgués, et omet les entrées d’assistant dont tout le texte visible est uniquement le jeton silencieux exact `NO_REPLY` / `no_reply`.
- `chat.inject` ajoute une note d’assistant à la transcription de la session et diffuse un événement `chat` pour des mises à jour d’interface uniquement (pas d’exécution d’agent, pas de livraison à un canal).
- Les sélecteurs de modèle et de réflexion dans l’en-tête du chat appliquent immédiatement des correctifs à la session active via `sessions.patch` ; il s’agit de remplacements persistants de session, et non d’options d’envoi pour un seul tour.
- Le mode Talk utilise un fournisseur vocal temps réel enregistré qui prend en charge les
  sessions WebRTC dans le navigateur. Configurez OpenAI avec `talk.provider: "openai"` plus
  `talk.providers.openai.apiKey`, ou réutilisez la configuration du fournisseur temps réel Voice Call.
  Le navigateur ne reçoit jamais la clé API OpenAI standard ; il reçoit
  uniquement le secret client Realtime éphémère. La voix temps réel Google Live est
  prise en charge pour le backend Voice Call et les ponts Google Meet, mais pas encore pour ce chemin
  WebRTC du navigateur. L’invite de session Realtime est assemblée par le Gateway ;
  `talk.realtime.session` n’accepte pas de remplacements d’instructions fournis par l’appelant.
- Dans le compositeur de chat, la commande Talk est le bouton en forme d’ondes à côté du
  bouton de dictée au microphone. Lorsque Talk démarre, la ligne d’état du compositeur affiche
  `Connecting Talk...`, puis `Talk live` lorsque l’audio est connecté, ou
  `Asking OpenClaw...` lorsqu’un appel d’outil temps réel consulte le
  plus grand modèle configuré via `chat.send`.
- Arrêt :
  - Cliquez sur **Stop** (appelle `chat.abort`)
  - Lorsqu’une exécution est active, les suivis normaux sont mis en file d’attente. Cliquez sur **Steer** sur un message en attente pour injecter ce suivi dans le tour en cours.
  - Saisissez `/stop` (ou des expressions d’arrêt autonomes comme `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) pour interrompre hors bande
  - `chat.abort` prend en charge `{ sessionKey }` (sans `runId`) pour interrompre toutes les exécutions actives de cette session
- Conservation partielle lors de l’interruption :
  - Lorsqu’une exécution est interrompue, un texte partiel de l’assistant peut toujours être affiché dans l’interface
  - Le Gateway conserve le texte partiel interrompu de l’assistant dans l’historique de la transcription lorsqu’une sortie tamponnée existe
  - Les entrées conservées incluent des métadonnées d’interruption afin que les consommateurs de transcription puissent distinguer les fragments dus à une interruption d’une sortie normale terminée

## Intégrations hébergées

Les messages d’assistant peuvent afficher du contenu web hébergé en ligne via le shortcode `[embed ...]`.
La politique de sandbox d’iframe est contrôlée par
`gateway.controlUi.embedSandbox` :

- `strict` : désactive l’exécution de scripts dans les intégrations hébergées
- `scripts` : autorise les intégrations interactives tout en conservant l’isolation d’origine ; c’est
  la valeur par défaut et elle suffit généralement pour les jeux/widgets navigateur autonomes
- `trusted` : ajoute `allow-same-origin` en plus de `allow-scripts` pour les
  documents du même site qui ont intentionnellement besoin de privilèges plus élevés

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

N’utilisez `trusted` que lorsque le document intégré a réellement besoin d’un
comportement de même origine. Pour la plupart des jeux générés par agent et des canevas interactifs, `scripts` est le choix le plus sûr.

Les URL d’intégration externes absolues `http(s)` restent bloquées par défaut. Si vous
souhaitez intentionnellement que `[embed url="https://..."]` charge des pages tierces, définissez
`gateway.controlUi.allowExternalEmbedUrls: true`.

## Accès Tailnet (recommandé)

### Tailscale Serve intégré (préféré)

Conservez le Gateway sur local loopback et laissez Tailscale Serve le proxifier en HTTPS :

```bash
openclaw gateway --tailscale serve
```

Ouvrez :

- `https://<magicdns>/` (ou votre `gateway.controlUi.basePath` configuré)

Par défaut, les requêtes Serve de l’interface de contrôle/WebSocket peuvent s’authentifier via les en-têtes d’identité Tailscale
(`tailscale-user-login`) lorsque `gateway.auth.allowTailscale` vaut `true`. OpenClaw
vérifie l’identité en résolvant l’adresse `x-forwarded-for` avec
`tailscale whois` et en la comparant à l’en-tête, et n’accepte ces en-têtes que lorsque la
requête atteint local loopback avec les en-têtes `x-forwarded-*` de Tailscale. Définissez
`gateway.auth.allowTailscale: false` si vous souhaitez exiger des identifiants explicites à secret partagé
même pour le trafic Serve. Utilisez alors `gateway.auth.mode: "token"` ou
`"password"`.
Pour ce chemin d’identité Serve asynchrone, les tentatives d’authentification échouées pour la même IP cliente
et le même périmètre d’authentification sont sérialisées avant les écritures de limitation de débit. Des
nouvelles tentatives incorrectes concurrentes depuis le même navigateur peuvent donc afficher
`retry later` sur la deuxième requête au lieu de deux simples non-correspondances en parallèle.
L’authentification Serve sans jeton suppose que l’hôte du gateway est de confiance. Si du code local non fiable
peut s’exécuter sur cet hôte, exigez une authentification par jeton/mot de passe.

### Liaison au tailnet + jeton

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Ouvrez ensuite :

- `http://<tailscale-ip>:18789/` (ou votre `gateway.controlUi.basePath` configuré)

Collez le secret partagé correspondant dans les paramètres de l’interface (envoyé comme
`connect.params.auth.token` ou `connect.params.auth.password`).

## HTTP non sécurisé

Si vous ouvrez le tableau de bord en HTTP simple (`http://<lan-ip>` ou `http://<tailscale-ip>`),
le navigateur s’exécute dans un **contexte non sécurisé** et bloque WebCrypto. Par défaut,
OpenClaw **bloque** les connexions à l’interface de contrôle sans identité d’appareil.

Exceptions documentées :

- compatibilité HTTP non sécurisé localhost uniquement avec `gateway.controlUi.allowInsecureAuth=true`
- authentification réussie d’opérateur à l’interface de contrôle via `gateway.auth.mode: "trusted-proxy"`
- option de secours `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correctif recommandé :** utilisez HTTPS (Tailscale Serve) ou ouvrez l’interface localement :

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (sur l’hôte du gateway)

**Comportement de l’option d’authentification non sécurisée :**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` est uniquement une option locale de compatibilité :

- Elle permet aux sessions de l’interface de contrôle sur localhost de se poursuivre sans identité d’appareil dans
  des contextes HTTP non sécurisés.
- Elle ne contourne pas les vérifications d’appairage.
- Elle n’assouplit pas les exigences d’identité d’appareil à distance (hors localhost).

**Secours uniquement :**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` désactive les vérifications d’identité d’appareil de l’interface de contrôle et constitue une
forte dégradation de la sécurité. Revenez rapidement en arrière après usage d’urgence.

Remarque sur le proxy approuvé :

- une authentification réussie via proxy approuvé peut autoriser des sessions d’interface de contrôle **opérateur** sans
  identité d’appareil
- cela ne s’étend **pas** aux sessions d’interface de contrôle avec rôle de nœud
- les proxys inverses local loopback sur le même hôte ne satisfont toujours pas à l’authentification par proxy approuvé ; voir
  [Authentification par proxy approuvé](/fr/gateway/trusted-proxy-auth)

Voir [Tailscale](/fr/gateway/tailscale) pour les conseils de configuration HTTPS.

## Politique de sécurité du contenu

L’interface de contrôle est fournie avec une politique `img-src` stricte : seules les ressources **de même origine** et les URL `data:` sont autorisées. Les URL d’image distantes `http(s)` et relatives au protocole sont rejetées par le navigateur et n’émettent aucune requête réseau.

Concrètement :

- Les avatars et images servis sous des chemins relatifs (par exemple `/avatars/<id>`) s’affichent toujours.
- Les URL `data:image/...` en ligne s’affichent toujours (utile pour les charges utiles dans le protocole).
- Les URL d’avatar distantes émises par les métadonnées de canal sont supprimées par les assistants d’avatar de l’interface de contrôle et remplacées par le logo/badge intégré, de sorte qu’un canal compromis ou malveillant ne peut pas forcer des récupérations d’images distantes arbitraires depuis le navigateur d’un opérateur.

Vous n’avez rien à modifier pour obtenir ce comportement — il est toujours activé et n’est pas configurable.

## Authentification de la route d’avatar

Lorsque l’authentification gateway est configurée, le point de terminaison d’avatar de l’interface de contrôle exige le même jeton gateway que le reste de l’API :

- `GET /avatar/<agentId>` ne renvoie l’image d’avatar qu’aux appelants authentifiés. `GET /avatar/<agentId>?meta=1` renvoie les métadonnées de l’avatar selon la même règle.
- Les requêtes non authentifiées vers l’une ou l’autre route sont rejetées (comme pour la route sœur de média d’assistant). Cela empêche la route d’avatar de divulguer l’identité de l’agent sur des hôtes par ailleurs protégés.
- L’interface de contrôle elle-même transmet le jeton gateway comme en-tête bearer lors de la récupération des avatars, et utilise des URL blob authentifiées afin que l’image continue de s’afficher dans les tableaux de bord.

Si vous désactivez l’authentification gateway (non recommandé sur des hôtes partagés), la route d’avatar devient également non authentifiée, conformément au reste du gateway.

## Construire l’interface

Le Gateway sert les fichiers statiques depuis `dist/control-ui`. Construisez-les avec :

```bash
pnpm ui:build
```

Base absolue facultative (lorsque vous souhaitez des URL de ressources fixes) :

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Pour le développement local (serveur de développement séparé) :

```bash
pnpm ui:dev
```

Pointez ensuite l’interface vers l’URL WS de votre Gateway (par exemple `ws://127.0.0.1:18789`).

## Débogage/test : serveur de développement + Gateway distant

L’interface de contrôle est composée de fichiers statiques ; la cible WebSocket est configurable et peut être
différente de l’origine HTTP. C’est pratique lorsque vous souhaitez le serveur de développement Vite
en local mais que le Gateway s’exécute ailleurs.

1. Démarrez le serveur de développement de l’interface : `pnpm ui:dev`
2. Ouvrez une URL comme :

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Authentification ponctuelle facultative (si nécessaire) :

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Remarques :

- `gatewayUrl` est stocké dans localStorage après le chargement et supprimé de l’URL.
- `token` doit être transmis via le fragment d’URL (`#token=...`) autant que possible. Les fragments ne sont pas envoyés au serveur, ce qui évite les fuites dans les journaux de requêtes et via Referer. Les anciens paramètres de requête `?token=` sont encore importés une fois pour compatibilité, mais seulement en repli, et sont supprimés immédiatement après l’initialisation.
- `password` est conservé uniquement en mémoire.
- Lorsque `gatewayUrl` est défini, l’interface ne revient pas aux identifiants de configuration ou d’environnement.
  Fournissez `token` (ou `password`) explicitement. L’absence d’identifiants explicites est une erreur.
- Utilisez `wss://` lorsque le Gateway est derrière TLS (Tailscale Serve, proxy HTTPS, etc.).
- `gatewayUrl` n’est accepté que dans une fenêtre de premier niveau (pas intégrée) afin d’empêcher le détournement de clic.
- Les déploiements d’interface de contrôle hors local loopback doivent définir explicitement `gateway.controlUi.allowedOrigins`
  (origines complètes). Cela inclut les configurations de développement distantes.
- N’utilisez pas `gateway.controlUi.allowedOrigins: ["*"]` sauf pour des tests locaux étroitement contrôlés.
  Cela signifie autoriser toute origine de navigateur, et non « correspondre à l’hôte que j’utilise ».
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` active
  le mode de repli sur l’origine de l’en-tête Host, mais c’est un mode de sécurité dangereux.

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

## Liens associés

- [Dashboard](/fr/web/dashboard) — tableau de bord du gateway
- [WebChat](/fr/web/webchat) — interface de chat basée sur le navigateur
- [TUI](/fr/web/tui) — interface utilisateur en terminal
- [Health Checks](/fr/gateway/health) — surveillance de l’état du gateway
