---
read_when:
    - Implémenter ou mettre à jour des clients WS du Gateway
    - Débogage des incompatibilités de protocole ou des échecs de connexion
    - Régénération du schéma et des modèles de protocole
summary: 'Protocole WebSocket Gateway : négociation, trames, gestion des versions'
title: Protocole Gateway
x-i18n:
    generated_at: "2026-07-04T17:57:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 763dd5cba2f1aa0de95243a4996b4da1b4aa32c5c1a4b5b6c112d605e677bd70
    source_path: gateway/protocol.md
    workflow: 16
---

Le protocole WS du Gateway est le **plan de contrôle + transport de nœud unique** pour
OpenClaw. Tous les clients (CLI, interface web, application macOS, nœuds iOS/Android,
nœuds sans interface) se connectent par WebSocket et déclarent leur **rôle** + leur
**portée** au moment de l’établissement de liaison.

## Transport

- WebSocket, trames texte avec charges utiles JSON.
- La première trame **doit** être une requête `connect`.
- Les trames avant connexion sont plafonnées à 64 KiB. Après un établissement de liaison réussi, les clients
  doivent respecter les limites `hello-ok.policy.maxPayload` et
  `hello-ok.policy.maxBufferedBytes`. Avec les diagnostics activés,
  les trames entrantes surdimensionnées et les tampons sortants lents émettent des événements `payload.large`
  avant que le gateway ferme ou abandonne la trame concernée. Ces événements conservent
  les tailles, limites, surfaces et codes de raison sûrs. Ils ne conservent pas le corps du message,
  le contenu des pièces jointes, le corps brut de la trame, les jetons, les cookies ni les valeurs secrètes.

## Établissement de liaison (connect)

Gateway → Client (défi avant connexion) :

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Client → Gateway :

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 4,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Gateway → Client :

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 4,
    "server": { "version": "…", "connId": "…" },
    "features": { "methods": ["…"], "events": ["…"] },
    "snapshot": { "…": "…" },
    "auth": {
      "role": "operator",
      "scopes": ["operator.read", "operator.write"]
    },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

Pendant que le Gateway termine encore le démarrage de ses sidecars, la requête `connect` peut
renvoyer une erreur `UNAVAILABLE` réessayable avec `details.reason` défini sur
`"startup-sidecars"` et `retryAfterMs`. Les clients doivent réessayer cette réponse
dans leur budget global de connexion au lieu de la présenter comme un échec terminal
d’établissement de liaison.

`server`, `features`, `snapshot` et `policy` sont tous requis par le schéma
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` est également requis et indique
le rôle et les portées négociés. `pluginSurfaceUrls` est facultatif et associe les noms de surfaces
de plugin, comme `canvas`, à des URL hébergées à portée limitée.

Les URL de surfaces de plugin à portée limitée peuvent expirer. Les nœuds peuvent appeler
`node.pluginSurface.refresh` avec `{ "surface": "canvas" }` pour recevoir une nouvelle
entrée dans `pluginSurfaceUrls`. La refactorisation expérimentale du plugin Canvas ne
prend pas en charge le chemin de compatibilité obsolète `canvasHostUrl`, `canvasCapability` ou
`node.canvas.capability.refresh` ; les clients natifs et gateways actuels doivent utiliser les surfaces de plugin.

Lorsqu’aucun jeton d’appareil n’est émis, `hello-ok.auth` indique les autorisations négociées
sans champs de jeton :

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Les clients backend de confiance dans le même processus (`client.id: "gateway-client"`,
`client.mode: "backend"`) peuvent omettre `device` sur les connexions directes en local loopback lorsqu’ils
s’authentifient avec le jeton/mot de passe partagé du gateway. Ce chemin est réservé
aux RPC internes du plan de contrôle et empêche les bases de référence CLI/appareil obsolètes de
bloquer le travail backend local, comme les mises à jour de sessions de sous-agents. Les clients distants,
les clients d’origine navigateur, les clients nœuds et les clients explicites avec jeton d’appareil/identité d’appareil
utilisent toujours les vérifications normales d’association et de montée en portée.

Lorsqu’un jeton d’appareil est émis, `hello-ok` inclut aussi :

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

L’amorçage intégré par QR/code de configuration est un nouveau chemin de transfert mobile. Une connexion
réussie avec code de configuration de base renvoie un jeton de nœud principal plus un jeton
opérateur borné :

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "node",
    "scopes": [],
    "deviceTokens": [
      {
        "deviceToken": "…",
        "role": "operator",
        "scopes": ["operator.approvals", "operator.read", "operator.talk.secrets", "operator.write"]
      }
    ]
  }
}
```

Le transfert opérateur est volontairement borné afin que l’intégration par QR puisse démarrer la
boucle opérateur mobile et terminer la configuration native sans accorder de portées de
mutation d’association ni `operator.admin`. Il inclut `operator.talk.secrets` afin que le
client natif puisse lire la configuration Talk dont il a besoin après l’amorçage. L’accès plus large
à l’association et à l’administration nécessite un flux séparé d’association opérateur approuvée ou de jeton.
Les clients ne doivent persister
`hello-ok.auth.deviceTokens` que
lorsque la connexion a utilisé une authentification d’amorçage sur un transport de confiance, comme `wss://` ou
une association loopback/locale.

### Exemple de nœud

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 4,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

## Tramage

- **Requête** : `{type:"req", id, method, params}`
- **Réponse** : `{type:"res", id, ok, payload|error}`
- **Événement** : `{type:"event", event, payload, seq?, stateVersion?}`

Les méthodes avec effets de bord nécessitent des **clés d’idempotence** (voir le schéma).

## Rôles + portées

Pour le modèle complet des portées opérateur, les vérifications au moment de l’approbation et la sémantique
des secrets partagés, consultez [Portées opérateur](/fr/gateway/operator-scopes).

### Rôles

- `operator` = client du plan de contrôle (CLI/interface utilisateur/automatisation).
- `node` = hôte de capacité (camera/screen/canvas/system.run).

### Portées (opérateur)

Portées courantes :

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` avec `includeSecrets: true` nécessite `operator.talk.secrets`
(ou `operator.admin`).
Lorsque les secrets sont inclus, les clients doivent lire l’identifiant actif du fournisseur Talk
depuis `talk.resolved.config.apiKey` ; `talk.providers.<id>.apiKey`
conserve la forme source et peut être un objet SecretRef ou une chaîne caviardée.

Les méthodes RPC Gateway enregistrées par un plugin peuvent demander leur propre portée opérateur, mais
les préfixes d’administration principaux réservés (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) se résolvent toujours en `operator.admin`.

La portée de méthode n’est que le premier garde-fou. Certaines commandes slash atteintes via
`chat.send` appliquent en plus des vérifications plus strictes au niveau de la commande. Par exemple, les écritures persistantes
`/config set` et `/config unset` nécessitent `operator.admin`.

`node.pair.approve` possède aussi une vérification de portée supplémentaire au moment de l’approbation, en plus de la
portée de méthode de base :

- requêtes sans commande : `operator.pairing`
- requêtes avec commandes de nœud non-exec : `operator.pairing` + `operator.write`
- requêtes qui incluent `system.run`, `system.run.prepare` ou `system.which` :
  `operator.pairing` + `operator.admin`

### Capacités/commandes/autorisations (nœud)

Les nœuds déclarent leurs revendications de capacité au moment de la connexion :

- `caps` : catégories de capacité de haut niveau comme `camera`, `canvas`, `screen`,
  `location`, `voice` et `talk`.
- `commands` : liste d’autorisation de commandes pour l’invocation.
- `permissions` : bascules granulaires (par exemple `screen.record`, `camera.capture`).

Le Gateway traite celles-ci comme des **revendications** et applique des listes d’autorisation côté serveur.

## Présence

- `system-presence` renvoie des entrées indexées par identité d’appareil.
- Les entrées de présence incluent `deviceId`, `roles` et `scopes` afin que les interfaces puissent afficher une seule ligne par appareil
  même lorsqu’il se connecte à la fois comme **opérateur** et comme **nœud**.
- `node.list` inclut les champs facultatifs `lastSeenAtMs` et `lastSeenReason`. Les nœuds connectés indiquent
  leur heure de connexion actuelle comme `lastSeenAtMs` avec la raison `connect` ; les nœuds associés peuvent également signaler
  une présence d’arrière-plan durable lorsqu’un événement de nœud de confiance met à jour leurs métadonnées d’association.

### Événement de nœud vivant en arrière-plan

Les nœuds peuvent appeler `node.event` avec `event: "node.presence.alive"` pour enregistrer qu’un nœud associé était
vivant pendant un réveil en arrière-plan sans le marquer comme connecté.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` est une énumération fermée : `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` ou `connect`. Les chaînes de déclencheur inconnues sont normalisées en
`background` par le gateway avant la persistance. L’événement n’est durable que pour les sessions d’appareil de nœud
authentifiées ; les sessions sans appareil ou non associées renvoient `handled: false`.

Les gateways qui réussissent renvoient un résultat structuré :

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Les gateways plus anciens peuvent encore renvoyer `{ "ok": true }` pour `node.event` ; les clients doivent traiter cela comme un
RPC accusé de réception, et non comme une persistance durable de présence.

## Délimitation de portée des événements de diffusion

Les événements de diffusion WebSocket poussés par le serveur sont filtrés par portée afin que les sessions limitées à l’association ou réservées aux nœuds ne reçoivent pas passivement le contenu de session.

- **Trames de chat, d’agent et de résultats d’outils** (y compris les événements `agent` diffusés en continu et les résultats d’appels d’outils) nécessitent au moins `operator.read`. Les sessions sans `operator.read` ignorent entièrement ces trames.
- **Diffusions `plugin.*` définies par les plugins** sont limitées à `operator.write` ou `operator.admin`, selon la façon dont le plugin les a enregistrées.
- **Événements d’état et de transport** (`heartbeat`, `presence`, `tick`, cycle de vie connexion/déconnexion, etc.) restent sans restriction afin que la santé du transport reste observable par chaque session authentifiée.
- **Familles d’événements de diffusion inconnues** sont filtrées par portée par défaut (échec fermé), sauf si un gestionnaire enregistré les assouplit explicitement.

Chaque connexion client conserve son propre numéro de séquence par client afin que les diffusions préservent un ordre monotone sur ce socket, même lorsque différents clients voient différents sous-ensembles du flux d’événements filtrés par portée.

## Familles courantes de méthodes RPC

La surface WS publique est plus large que les exemples d’établissement de liaison/authentification ci-dessus. Il ne s’agit
pas d’un export généré — `hello-ok.features.methods` est une liste de découverte prudente
construite à partir de `src/gateway/server-methods-list.ts` plus les exports de méthodes de plugins/canaux chargés.
Traitez-la comme de la découverte de fonctionnalités, et non comme une énumération complète de
`src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="Système et identité">
    - `health` renvoie l’instantané d’état de santé du Gateway mis en cache ou fraîchement sondé.
    - `diagnostics.stability` renvoie l’enregistreur de stabilité diagnostique borné récent. Il conserve les métadonnées opérationnelles telles que les noms d’événements, les nombres, les tailles en octets, les relevés de mémoire, l’état de la file/session, les noms de canaux/Plugins et les identifiants de session. Il ne conserve pas le texte de chat, les corps de webhooks, les sorties d’outils, les corps bruts de requête ou de réponse, les tokens, les cookies ni les valeurs secrètes. La portée de lecture opérateur est requise.
    - `status` renvoie le résumé du Gateway de type `/status` ; les champs sensibles ne sont inclus que pour les clients opérateurs à portée administrateur.
    - `gateway.identity.get` renvoie l’identité de l’appareil Gateway utilisée par les flux de relais et d’appairage.
    - `system-presence` renvoie l’instantané de présence actuel pour les appareils opérateur/Node connectés.
    - `system-event` ajoute un événement système et peut mettre à jour/diffuser le contexte de présence.
    - `last-heartbeat` renvoie le dernier événement Heartbeat persisté.
    - `set-heartbeats` active ou désactive le traitement Heartbeat sur le Gateway.

  </Accordion>

  <Accordion title="Modèles et utilisation">
    - `models.list` renvoie le catalogue de modèles autorisé à l’exécution. Passez `{ "view": "configured" }` pour des modèles configurés adaptés au sélecteur (`agents.defaults.models` d’abord, puis `models.providers.*.models`), ou `{ "view": "all" }` pour le catalogue complet.
    - `usage.status` renvoie les fenêtres d’utilisation fournisseur et les résumés de quota restant.
    - `usage.cost` renvoie les résumés agrégés des coûts d’utilisation pour une plage de dates.
      Passez `agentId` pour un agent, ou `agentScope: "all"` pour agréger les agents configurés.
    - `doctor.memory.status` renvoie l’état de préparation de la mémoire vectorielle / des embeddings mis en cache pour l’espace de travail de l’agent par défaut actif. Passez `{ "probe": true }` ou `{ "deep": true }` uniquement lorsque l’appelant souhaite explicitement un ping en direct du fournisseur d’embeddings. Les clients compatibles Dreaming peuvent aussi passer `{ "agentId": "agent-id" }` pour limiter les statistiques du magasin Dreaming à un espace de travail d’agent sélectionné ; omettre `agentId` conserve le repli sur l’agent par défaut et agrège les espaces de travail Dreaming configurés.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` et `doctor.memory.dedupeDreamDiary` acceptent des paramètres facultatifs `{ "agentId": "agent-id" }` pour les vues/actions Dreaming de l’agent sélectionné. Lorsque `agentId` est omis, ils opèrent sur l’espace de travail de l’agent par défaut configuré.
    - `doctor.memory.remHarness` renvoie un aperçu borné, en lecture seule, du harnais REM pour les clients de plan de contrôle distant. Il peut inclure des chemins d’espace de travail, des extraits de mémoire, du Markdown ancré rendu et des candidats à la promotion profonde ; les appelants ont donc besoin de `operator.read`.
    - `sessions.usage` renvoie les résumés d’utilisation par session. Passez `agentId` pour un
      agent, ou `agentScope: "all"` pour lister ensemble les agents configurés.
    - `sessions.usage.timeseries` renvoie l’utilisation en série temporelle pour une session.
    - `sessions.usage.logs` renvoie les entrées de journal d’utilisation pour une session.

  </Accordion>

  <Accordion title="Canaux et assistants de connexion">
    - `channels.status` renvoie les résumés d’état des canaux/Plugins intégrés + groupés.
    - `channels.logout` déconnecte un canal/compte spécifique lorsque le canal prend en charge la déconnexion.
    - `web.login.start` démarre un flux de connexion QR/web pour le fournisseur de canal web actuel compatible QR.
    - `web.login.wait` attend la fin de ce flux de connexion QR/web et démarre le canal en cas de réussite.
    - `push.test` envoie une notification push APNs de test à un Node iOS enregistré.
    - `voicewake.get` renvoie les déclencheurs de mot de réveil stockés.
    - `voicewake.set` met à jour les déclencheurs de mot de réveil et diffuse la modification.

  </Accordion>

  <Accordion title="Messagerie et journaux">
    - `send` est le RPC de livraison sortante directe pour les envois ciblés par canal/compte/fil en dehors de l’exécuteur de chat.
    - `logs.tail` renvoie la fin du fichier journal Gateway configuré avec des contrôles de curseur/limite et d’octets maximaux.

  </Accordion>

  <Accordion title="Talk et TTS">
    - `talk.catalog` renvoie le catalogue Talk fournisseur en lecture seule pour la parole, la transcription en streaming et la voix en temps réel. Il inclut les identifiants canoniques de fournisseurs, les alias de registre, les libellés, l’état configuré, un résultat `ready` facultatif au niveau du groupe, les identifiants de modèles/voix exposés, les modes canoniques, les transports, les stratégies de cerveau et les indicateurs audio/capacité temps réel sans renvoyer les secrets fournisseur ni modifier la config globale. Les Gateways actuels définissent `ready` après application de la sélection de fournisseur à l’exécution ; les clients doivent traiter son absence comme non vérifiée pour la compatibilité avec les Gateways plus anciens.
    - `talk.config` renvoie la charge utile de config Talk effective ; `includeSecrets` requiert `operator.talk.secrets` (ou `operator.admin`).
    - `talk.session.create` crée une session Talk détenue par le Gateway pour `realtime/gateway-relay`, `transcription/gateway-relay` ou `stt-tts/managed-room`. Pour `stt-tts/managed-room`, les appelants `operator.write` qui passent `sessionKey` doivent aussi passer `spawnedBy` pour une visibilité de clé de session limitée ; la création non limitée de `sessionKey` et `brain: "direct-tools"` requièrent `operator.admin`.
    - `talk.session.join` valide un token de session managed-room, émet les événements `session.ready` ou `session.replaced` selon les besoins, et renvoie les métadonnées de salle/session ainsi que les événements Talk récents sans le token en clair ni le hachage de token stocké.
    - `talk.session.appendAudio` ajoute de l’audio d’entrée PCM en base64 aux sessions de relais temps réel et de transcription détenues par le Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` et `talk.session.cancelTurn` pilotent le cycle de vie des tours managed-room avec rejet des tours obsolètes avant l’effacement de l’état.
    - `talk.session.cancelOutput` arrête la sortie audio de l’assistant, principalement pour l’interruption VAD-gated dans les sessions de relais Gateway.
    - `talk.session.submitToolResult` termine un appel d’outil fournisseur émis par une session de relais temps réel détenue par le Gateway. Passez `options: { willContinue: true }` pour une sortie d’outil intermédiaire lorsqu’un résultat final suivra, ou `options: { suppressResponse: true }` lorsque le résultat d’outil doit satisfaire l’appel fournisseur sans démarrer une autre réponse d’assistant temps réel.
    - `talk.session.steer` envoie un contrôle vocal d’exécution active dans une session Talk adossée à un agent et détenue par le Gateway. Il accepte `{ sessionId, text, mode? }`, où `mode` vaut `status`, `steer`, `cancel` ou `followup` ; le mode omis est classé à partir du texte parlé.
    - `talk.session.close` ferme une session de relais, de transcription ou managed-room détenue par le Gateway et émet des événements Talk terminaux.
    - `talk.mode` définit/diffuse l’état actuel du mode Talk pour les clients WebChat/Control UI.
    - `talk.client.create` crée une session fournisseur temps réel détenue par le client avec `webrtc` ou `provider-websocket`, tandis que le Gateway détient la config, les identifiants, les instructions et la politique d’outils.
    - `talk.client.toolCall` permet aux transports temps réel détenus par le client de transférer les appels d’outils fournisseur vers la politique du Gateway. Le premier outil pris en charge est `openclaw_agent_consult` ; les clients reçoivent un identifiant d’exécution et attendent les événements normaux du cycle de vie du chat avant de soumettre le résultat d’outil propre au fournisseur.
    - `talk.client.steer` envoie le contrôle vocal d’exécution active pour les transports temps réel détenus par le client. Le Gateway résout l’exécution intégrée active depuis `sessionKey` et renvoie un résultat structuré accepté/rejeté au lieu d’abandonner silencieusement le pilotage.
    - `talk.event` est le canal d’événements Talk unique pour les adaptateurs temps réel, transcription, STT/TTS, managed-room, téléphonie et réunion.
    - `talk.speak` synthétise la parole via le fournisseur de parole Talk actif.
    - `tts.status` renvoie l’état d’activation TTS, le fournisseur actif, les fournisseurs de repli et l’état de config des fournisseurs.
    - `tts.providers` renvoie l’inventaire visible des fournisseurs TTS.
    - `tts.enable` et `tts.disable` activent ou désactivent l’état des préférences TTS.
    - `tts.setProvider` met à jour le fournisseur TTS préféré.
    - `tts.convert` exécute une conversion ponctuelle texte-vers-parole.

  </Accordion>

  <Accordion title="Secrets, config, mise à jour et assistant">
    - `secrets.reload` résout à nouveau les SecretRefs actifs et remplace l’état des secrets d’exécution uniquement en cas de réussite complète.
    - `secrets.resolve` résout les affectations de secrets ciblées par commande pour un ensemble commande/cible spécifique.
    - `config.get` renvoie l’instantané de config actuel et son hachage.
    - `config.set` écrit une charge utile de config validée.
    - `config.patch` fusionne une mise à jour partielle de config. Le remplacement destructeur de tableau
      requiert le chemin affecté dans `replacePaths` ; les tableaux imbriqués
      sous des entrées de tableau utilisent des chemins `[]` tels que `agents.list[].skills`.
    - `config.apply` valide + remplace la charge utile complète de config.
    - `config.schema` renvoie la charge utile de schéma de config en direct utilisée par Control UI et les outils CLI : schéma, `uiHints`, version et métadonnées de génération, y compris les métadonnées de schéma Plugin + canal lorsque l’environnement d’exécution peut les charger. Le schéma inclut les métadonnées de champ `title` / `description` dérivées des mêmes libellés et textes d’aide utilisés par l’UI, y compris les branches d’objets imbriqués, de jokers, d’éléments de tableau et de composition `anyOf` / `oneOf` / `allOf` lorsqu’une documentation de champ correspondante existe.
    - `config.schema.lookup` renvoie une charge utile de recherche limitée à un chemin pour un chemin de config : chemin normalisé, nœud de schéma superficiel, indice correspondant + `hintPath`, `reloadKind` facultatif et résumés des enfants immédiats pour l’exploration UI/CLI. `reloadKind` est l’un de `restart`, `hot` ou `none` et reflète le planificateur de rechargement de config du Gateway pour le chemin demandé. Les nœuds de schéma de recherche conservent les docs destinées à l’utilisateur et les champs de validation courants (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, bornes numériques/chaîne/tableau/objet et indicateurs comme `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Les résumés d’enfants exposent `key`, `path` normalisé, `type`, `required`, `hasChildren`, `reloadKind` facultatif, ainsi que le `hint` / `hintPath` correspondant.
    - `update.run` exécute le flux de mise à jour du Gateway et planifie un redémarrage uniquement lorsque la mise à jour elle-même a réussi ; les appelants avec une session peuvent inclure `continuationMessage` afin que le démarrage reprenne un tour d’agent de suivi via la file de continuation de redémarrage. Les mises à jour du gestionnaire de paquets et les mises à jour supervisées de git-checkout depuis le plan de contrôle utilisent un transfert de service géré détaché au lieu de remplacer l’arborescence du paquet ou de modifier la sortie checkout/build dans le Gateway en direct. Un transfert démarré renvoie `ok: true` avec `result.reason: "managed-service-handoff-started"` et `handoff.status: "started"` ; les transferts indisponibles ou échoués renvoient `ok: false` avec `managed-service-handoff-unavailable` ou `managed-service-handoff-failed`, ainsi que `handoff.command` lorsqu’une mise à jour shell manuelle est requise. Un transfert indisponible signifie qu’OpenClaw ne dispose pas d’une frontière de superviseur sûre ou d’une identité de service durable, comme `OPENCLAW_SYSTEMD_UNIT` pour systemd. Pendant un transfert démarré, la sentinelle de redémarrage peut brièvement signaler `stats.reason: "restart-health-pending"` ; la continuation est différée jusqu’à ce que la CLI vérifie le Gateway redémarré et écrive la sentinelle finale `ok`.
    - `update.status` actualise et renvoie la dernière sentinelle de redémarrage de mise à jour, y compris la version exécutée après redémarrage lorsqu’elle est disponible.
    - `wizard.start`, `wizard.next`, `wizard.status` et `wizard.cancel` exposent l’assistant d’onboarding via WS RPC.

  </Accordion>

  <Accordion title="Assistants pour agents et espaces de travail">
    - `agents.list` renvoie les entrées d’agents configurées, y compris le modèle effectif et les métadonnées d’exécution.
    - `agents.create`, `agents.update` et `agents.delete` gèrent les enregistrements d’agents et le câblage de l’espace de travail.
    - `agents.files.list`, `agents.files.get` et `agents.files.set` gèrent les fichiers d’espace de travail d’amorçage exposés pour un agent.
    - `tasks.list`, `tasks.get` et `tasks.cancel` exposent le registre des tâches du Gateway aux clients SDK et opérateur.
    - `artifacts.list`, `artifacts.get` et `artifacts.download` exposent les résumés d’artefacts dérivés des transcriptions et les téléchargements pour une portée explicite `sessionKey`, `runId` ou `taskId`. Les requêtes de run et de tâche résolvent la session propriétaire côté serveur et ne renvoient que les médias de transcription dont la provenance correspond ; les sources d’URL non sûres ou locales renvoient des téléchargements non pris en charge au lieu d’être récupérées côté serveur.
    - `environments.list` et `environments.status` exposent la découverte en lecture seule des environnements locaux au Gateway et des environnements de nœud pour les clients SDK.
    - `agent.identity.get` renvoie l’identité d’assistant effective pour un agent ou une session.
    - `agent.wait` attend la fin d’un run et renvoie l’instantané terminal lorsqu’il est disponible.

  </Accordion>

  <Accordion title="Contrôle de session">
    - `sessions.list` renvoie l’index de session actuel, y compris les métadonnées `agentRuntime` par ligne lorsqu’un backend d’exécution d’agent est configuré.
    - `sessions.subscribe` et `sessions.unsubscribe` activent ou désactivent les abonnements aux événements de changement de session pour le client WS actuel.
    - `sessions.messages.subscribe` et `sessions.messages.unsubscribe` activent ou désactivent les abonnements aux événements de transcription/message pour une session.
    - `sessions.preview` renvoie des aperçus de transcription bornés pour des clés de session spécifiques.
    - `sessions.describe` renvoie une ligne de session du Gateway pour une clé de session exacte.
    - `sessions.resolve` résout ou canonise une cible de session.
    - `sessions.create` crée une nouvelle entrée de session.
    - `sessions.send` envoie un message dans une session existante.
    - `sessions.steer` est la variante d’interruption et d’orientation pour une session active.
    - `sessions.abort` interrompt le travail actif pour une session. Un appelant peut transmettre `key` avec un `runId` facultatif, ou transmettre uniquement `runId` pour les runs actifs que le Gateway peut résoudre vers une session.
    - `sessions.patch` met à jour les métadonnées/remplacements de session et signale le modèle canonique résolu ainsi que l’`agentRuntime` effectif.
    - `sessions.reset`, `sessions.delete` et `sessions.compact` effectuent la maintenance de session.
    - `sessions.get` renvoie la ligne de session stockée complète.
    - L’exécution du chat utilise toujours `chat.history`, `chat.send`, `chat.abort` et `chat.inject`. `chat.history` est normalisé pour l’affichage des clients UI : les balises de directive en ligne sont retirées du texte visible, les charges utiles XML d’appels d’outil en texte brut (y compris `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` et les blocs d’appels d’outil tronqués) ainsi que les jetons de contrôle de modèle ASCII/pleine chasse ayant fuité sont retirés, les lignes d’assistant composées uniquement de jetons silencieux telles que les valeurs exactes `NO_REPLY` / `no_reply` sont omises, et les lignes trop volumineuses peuvent être remplacées par des espaces réservés.
    - `chat.message.get` est le lecteur additif, borné et en message complet pour une seule entrée de transcription visible. Les clients transmettent `sessionKey`, un `agentId` facultatif lorsque la sélection de session est limitée à l’agent, ainsi qu’un `messageId` de transcription précédemment exposé via `chat.history`, et le Gateway renvoie la même projection normalisée pour l’affichage sans le plafond de troncature de l’historique léger lorsque l’entrée stockée est encore disponible et n’est pas trop volumineuse.
    - `chat.send` accepte un `fastMode: "auto"` sur un seul tour afin d’utiliser le mode rapide pour les appels de modèle démarrés avant le seuil automatique, puis de lancer les appels ultérieurs de nouvelle tentative, de fallback, de résultat d’outil ou de continuation sans mode rapide. Le seuil est de 60 secondes par défaut et peut être configuré par modèle avec `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Un appelant `chat.send` peut transmettre `fastAutoOnSeconds` sur un seul tour pour remplacer le seuil de cette requête.

  </Accordion>

  <Accordion title="Appairage d’appareils et jetons d’appareil">
    - `device.pair.list` renvoie les appareils appairés en attente et approuvés.
    - `device.pair.setupCode` crée un code de configuration mobile et, par défaut, une URL de données QR PNG. Il requiert `operator.admin` et est intentionnellement omis de la découverte annoncée. Le résultat inclut `setupCode`, `qrDataUrl` facultatif, `gatewayUrl`, l’étiquette non secrète `auth` et `urlSource`.
    - `device.pair.approve`, `device.pair.reject` et `device.pair.remove` gèrent les enregistrements d’appairage d’appareils.
    - `device.token.rotate` effectue la rotation d’un jeton d’appareil appairé dans les limites de son rôle approuvé et de la portée de l’appelant.
    - `device.token.revoke` révoque un jeton d’appareil appairé dans les limites de son rôle approuvé et de la portée de l’appelant.

    Le code de configuration embarque un identifiant d’amorçage à courte durée de vie. Les clients ne doivent pas
    le journaliser ni le conserver au-delà du flux d’appairage.

  </Accordion>

  <Accordion title="Appairage de nœuds, invocation et travail en attente">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` et `node.pair.verify` couvrent l’appairage de nœuds et la vérification d’amorçage.
    - `node.list` et `node.describe` renvoient l’état des nœuds connus/connectés.
    - `node.rename` met à jour l’étiquette d’un nœud appairé.
    - `node.invoke` transmet une commande à un nœud connecté.
    - `node.invoke.result` renvoie le résultat d’une requête d’invocation.
    - `node.event` transporte les événements issus des nœuds vers le gateway.
    - `node.pending.pull` et `node.pending.ack` sont les API de file d’attente des nœuds connectés.
    - `node.pending.enqueue` et `node.pending.drain` gèrent le travail durable en attente pour les nœuds hors ligne/déconnectés.

  </Accordion>

  <Accordion title="Familles d’approbation">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` et `exec.approval.resolve` couvrent les demandes d’approbation exec ponctuelles ainsi que la recherche/relecture des approbations en attente.
    - `exec.approval.waitDecision` attend une approbation exec en attente et renvoie la décision finale (ou `null` en cas de délai d’attente).
    - `exec.approvals.get` et `exec.approvals.set` gèrent les instantanés de politique d’approbation exec du gateway.
    - `exec.approvals.node.get` et `exec.approvals.node.set` gèrent la politique d’approbation exec locale au nœud via des commandes de relais de nœud.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` et `plugin.approval.resolve` couvrent les flux d’approbation définis par les plugins.

  </Accordion>

  <Accordion title="Automatisation, Skills et outils">
    - Automatisation : `wake` planifie une injection de texte de réveil immédiate ou au prochain Heartbeat ; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gèrent le travail planifié.
    - `cron.run` reste un RPC de type mise en file d’attente pour les runs manuels. Les clients qui ont besoin d’une sémantique d’achèvement doivent lire le `runId` renvoyé et interroger `cron.runs`.
    - `cron.runs` accepte un filtre `runId` non vide facultatif afin que les clients puissent suivre un run manuel mis en file d’attente sans entrer en concurrence avec d’autres entrées d’historique pour la même tâche.
    - Skills et outils : `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Familles d’événements courantes

- `chat` : mises à jour de chat UI telles que `chat.inject` et autres événements de chat limités à la transcription. Dans la version 4 du protocole, les charges utiles delta portent `deltaText` ; `message` reste l’instantané cumulatif de l’assistant. Les remplacements qui ne sont pas des préfixes définissent `replace=true` et utilisent `deltaText` comme texte de remplacement.
- `session.message`, `session.operation` et `session.tool` : mises à jour de transcription, d’opération de session en cours et de flux d’événements pour une session abonnée.
- `sessions.changed` : l’index ou les métadonnées de session ont changé.
- `presence` : mises à jour d’instantané de présence système.
- `tick` : événement périodique de keepalive / vivacité.
- `health` : mise à jour d’instantané de santé du gateway.
- `heartbeat` : mise à jour du flux d’événements Heartbeat.
- `cron` : événement de changement de run/tâche Cron.
- `shutdown` : notification d’arrêt du gateway.
- `node.pair.requested` / `node.pair.resolved` : cycle de vie de l’appairage de nœuds.
- `node.invoke.request` : diffusion d’une requête d’invocation de nœud.
- `device.pair.requested` / `device.pair.resolved` : cycle de vie d’appareil appairé.
- `voicewake.changed` : la configuration du déclencheur par mot d’activation a changé.
- `exec.approval.requested` / `exec.approval.resolved` : cycle de vie de l’approbation exec.
- `plugin.approval.requested` / `plugin.approval.resolved` : cycle de vie de l’approbation de plugin.

### Méthodes d’assistance des nœuds

- Les nœuds peuvent appeler `skills.bins` pour récupérer la liste actuelle des exécutables de Skills pour les vérifications d’autorisation automatique.

### RPC du registre des tâches

Les clients opérateur peuvent inspecter et annuler les enregistrements de tâches en arrière-plan du Gateway via les RPC du registre des tâches. Ces méthodes renvoient des résumés de tâches assainis, pas l’état brut de l’exécution.

- `tasks.list` requiert `operator.read`.
  - Paramètres : `status` facultatif (`"queued"`, `"running"`, `"completed"`, `"failed"`, `"cancelled"` ou `"timed_out"`) ou un tableau de ces statuts, `agentId` facultatif, `sessionKey` facultatif, `limit` facultatif de `1` à `500`, et chaîne `cursor` facultative.
  - Résultat : `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` requiert `operator.read`.
  - Paramètres : `{ "taskId": string }`.
  - Résultat : `{ "task": TaskSummary }`.
  - Les identifiants de tâche manquants renvoient la forme d’erreur introuvable du Gateway.
- `tasks.cancel` requiert `operator.write`.
  - Paramètres : `{ "taskId": string, "reason"?: string }`.
  - Résultat :
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` indique si le registre contenait une tâche correspondante. `cancelled` indique si l’exécution a accepté ou enregistré l’annulation.

`TaskSummary` inclut `id`, `status` et des métadonnées facultatives telles que `kind`, `runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`, `runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, les horodatages, la progression, le résumé terminal et le texte d’erreur assaini. `agentId` identifie l’agent qui exécute la tâche ; `sessionKey` et `ownerKey` préservent le contexte du demandeur et du contrôle.

### Méthodes d’assistance opérateur

- Les opérateurs peuvent appeler `commands.list` (`operator.read`) pour récupérer l’inventaire des commandes d’exécution d’un agent.
  - `agentId` est facultatif ; omettez-le pour lire l’espace de travail de l’agent par défaut.
  - `scope` contrôle la surface ciblée par le `name` principal :
    - `text` renvoie le jeton principal de commande texte sans le `/` initial
    - `native` et le chemin par défaut `both` renvoient les noms natifs tenant compte du fournisseur lorsqu’ils sont disponibles
  - `textAliases` contient les alias slash exacts tels que `/model` et `/m`.
  - `nativeName` contient le nom de commande natif tenant compte du fournisseur lorsqu’il existe.
  - `provider` est facultatif et n’affecte que le nommage natif ainsi que la disponibilité des commandes Plugin natives.
  - `includeArgs=false` omet les métadonnées d’arguments sérialisées de la réponse.
- Les opérateurs peuvent appeler `tools.catalog` (`operator.read`) pour récupérer le catalogue des outils d’exécution d’un agent. La réponse inclut les outils groupés et les métadonnées de provenance :
  - `source` : `core` ou `plugin`
  - `pluginId` : propriétaire du Plugin lorsque `source="plugin"`
  - `optional` : indique si un outil Plugin est facultatif
- Les opérateurs peuvent appeler `tools.effective` (`operator.read`) pour récupérer l’inventaire des outils effectifs à l’exécution pour une session.
  - `sessionKey` est requis.
  - Le Gateway déduit le contexte d’exécution fiable côté serveur à partir de la session au lieu d’accepter un contexte d’authentification ou de livraison fourni par l’appelant.
  - La réponse est une projection dérivée côté serveur et limitée à la session de l’inventaire actif, incluant les outils du cœur, des Plugins, des canaux et des serveurs MCP déjà découverts.
  - `tools.effective` est en lecture seule pour MCP : il peut projeter un catalogue MCP de session déjà chaud via la politique d’outils finale, mais il ne crée pas d’environnements d’exécution MCP, ne connecte pas de transports et n’émet pas `tools/list`. Si aucun catalogue chaud correspondant n’existe, la réponse peut inclure une notification telle que `mcp-not-yet-connected`, `mcp-not-yet-listed` ou `mcp-stale-catalog`.
  - Les entrées d’outils effectifs utilisent `source="core"`, `source="plugin"`, `source="channel"` ou `source="mcp"`.
- Les opérateurs peuvent appeler `tools.invoke` (`operator.write`) pour invoquer un outil disponible via le même chemin de politique Gateway que `/tools/invoke`.
  - `name` est requis. `args`, `sessionKey`, `agentId`, `confirm` et `idempotencyKey` sont facultatifs.
  - Si `sessionKey` et `agentId` sont tous deux présents, l’agent de session résolu doit correspondre à `agentId`.
  - Les wrappers cœur réservés au propriétaire, tels que `cron`, `gateway` et `nodes`, exigent une identité propriétaire/administrateur (`operator.admin`), même si la méthode `tools.invoke` elle-même est `operator.write`.
  - La réponse est une enveloppe destinée au SDK avec les champs `ok`, `toolName`, `output` facultatif et `error` typé. Les refus d’approbation ou de politique renvoient `ok:false` dans la charge utile au lieu de contourner le pipeline de politique d’outils du Gateway.
- Les opérateurs peuvent appeler `skills.status` (`operator.read`) pour récupérer l’inventaire visible des Skills pour un agent.
  - `agentId` est facultatif ; omettez-le pour lire l’espace de travail de l’agent par défaut.
  - La réponse inclut l’éligibilité, les exigences manquantes, les vérifications de configuration et les options d’installation assainies sans exposer de valeurs secrètes brutes.
- Les opérateurs peuvent appeler `skills.search` et `skills.detail` (`operator.read`) pour les métadonnées de découverte ClawHub.
- Les opérateurs peuvent appeler `skills.upload.begin`, `skills.upload.chunk` et `skills.upload.commit` (`operator.admin`) pour préparer une archive de Skills privée avant de l’installer. Il s’agit d’un chemin d’envoi administrateur séparé pour les clients de confiance, et non du flux normal d’installation de Skills ClawHub ; il est désactivé par défaut sauf si `skills.install.allowUploadedArchives` est activé.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })` crée un envoi lié à ce slug et à cette valeur force.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` ajoute des octets au décalage décodé exact.
  - `skills.upload.commit({ uploadId, sha256? })` vérifie la taille finale et le SHA-256. Le commit ne fait que finaliser l’envoi ; il n’installe pas le Skill.
  - Les archives de Skills téléversées sont des archives zip contenant une racine `SKILL.md`. Le nom du répertoire interne de l’archive ne sélectionne jamais la cible d’installation.
- Les opérateurs peuvent appeler `skills.install` (`operator.admin`) selon trois modes :
  - Mode ClawHub : `{ source: "clawhub", slug, version?, force? }` installe un dossier de Skills dans le répertoire `skills/` de l’espace de travail de l’agent par défaut.
  - Mode envoi : `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }` installe un envoi validé dans le répertoire `skills/<slug>` de l’espace de travail de l’agent par défaut. Le slug et la valeur force doivent correspondre à la requête `skills.upload.begin` d’origine. Ce mode est rejeté sauf si `skills.install.allowUploadedArchives` est activé. Le paramètre n’affecte pas les installations ClawHub.
  - Mode installateur Gateway : `{ name, installId, timeoutMs? }` exécute une action `metadata.openclaw.install` déclarée sur l’hôte Gateway. Les anciens clients peuvent encore envoyer `dangerouslyForceUnsafeInstall` ; ce champ est obsolète, accepté uniquement pour la compatibilité du protocole et ignoré. Utilisez `security.installPolicy` pour les décisions d’installation appartenant à l’opérateur.
- Les opérateurs peuvent appeler `skills.update` (`operator.admin`) selon deux modes :
  - Le mode ClawHub met à jour un slug suivi ou toutes les installations ClawHub suivies dans l’espace de travail de l’agent par défaut.
  - Le mode configuration corrige les valeurs `skills.entries.<skillKey>` telles que `enabled`, `apiKey` et `env`.

### Vues de `models.list`

`models.list` accepte un paramètre `view` facultatif :

- Omis ou `"default"` : comportement d’exécution actuel. Si `agents.defaults.models` est configuré, la réponse est le catalogue autorisé, incluant les modèles découverts dynamiquement pour les entrées `provider/*`. Sinon, la réponse est le catalogue Gateway complet.
- `"configured"` : comportement dimensionné pour les sélecteurs. Si `agents.defaults.models` est configuré, il reste prioritaire, incluant la découverte limitée au fournisseur pour les entrées `provider/*`. Sans liste d’autorisation, la réponse utilise les entrées explicites `models.providers.*.models`, avec repli vers le catalogue complet uniquement lorsqu’aucune ligne de modèle configurée n’existe.
- `"all"` : catalogue Gateway complet, en contournant `agents.defaults.models`. Utilisez cette option pour les diagnostics et les interfaces de découverte, pas pour les sélecteurs de modèles normaux.

## Approbations exec

- Lorsqu’une requête exec nécessite une approbation, le Gateway diffuse `exec.approval.requested`.
- Les clients opérateurs résolvent la demande en appelant `exec.approval.resolve` (nécessite la portée `operator.approvals`).
- Pour `host=node`, `exec.approval.request` doit inclure `systemRunPlan` (`argv`/`cwd`/`rawCommand`/métadonnées de session canoniques). Les requêtes sans `systemRunPlan` sont rejetées.
- Après approbation, les appels transférés `node.invoke system.run` réutilisent ce `systemRunPlan` canonique comme contexte de commande/cwd/session faisant autorité.
- Si un appelant modifie `command`, `rawCommand`, `cwd`, `agentId` ou `sessionKey` entre la préparation et le transfert final approuvé de `system.run`, le Gateway rejette l’exécution au lieu de faire confiance à la charge utile modifiée.

## Repli de livraison de l’agent

- Les requêtes `agent` peuvent inclure `deliver=true` pour demander une livraison sortante.
- `bestEffortDeliver=false` conserve un comportement strict : les cibles de livraison non résolues ou uniquement internes renvoient `INVALID_REQUEST`.
- `bestEffortDeliver=true` autorise le repli vers une exécution limitée à la session lorsqu’aucune route livrable externe ne peut être résolue (par exemple les sessions internes/webchat ou les configurations multicanales ambiguës).
- Les résultats finaux `agent` peuvent inclure `result.deliveryStatus` lorsqu’une livraison a été demandée, avec les mêmes statuts `sent`, `suppressed`, `partial_failed` et `failed` que ceux documentés pour [`openclaw agent --json --deliver`](/fr/cli/agent#json-delivery-status).

## Versionnement

- `PROTOCOL_VERSION` se trouve dans `packages/gateway-protocol/src/version.ts`.
- Les clients envoient `minProtocol` + `maxProtocol` ; le serveur rejette les plages qui n’incluent pas son protocole actuel. Les clients et serveurs actuels exigent le protocole v4.
- Les schémas + modèles sont générés à partir de définitions TypeBox :
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes client

Le client de référence dans `src/gateway/client.ts` utilise ces valeurs par défaut. Les valeurs sont stables sur l’ensemble du protocole v4 et constituent la base attendue pour les clients tiers.

| Constante                                 | Valeur par défaut                                      | Source                                                                                     |
| ----------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                    | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                    | `packages/gateway-protocol/src/version.ts`                                                 |
| Délai d’expiration de requête (par RPC)   | `30_000` ms                                            | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Délai d’expiration préauthentification / défi de connexion | `15_000` ms                            | `src/gateway/handshake-timeouts.ts` (config/env peut augmenter le budget serveur/client associé) |
| Backoff de reconnexion initial            | `1_000` ms                                             | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff de reconnexion maximal            | `30_000` ms                                            | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Limite de nouvelle tentative rapide après fermeture du jeton d’appareil | `250` ms                         | `src/gateway/client.ts`                                                                    |
| Délai de grâce force-stop avant `terminate()` | `250` ms                                           | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Délai d’expiration par défaut de `stopAndWait()` | `1_000` ms                                      | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Intervalle de tick par défaut (avant `hello-ok`) | `30_000` ms                                      | `src/gateway/client.ts`                                                                    |
| Fermeture sur délai d’expiration de tick  | code `4000` lorsque le silence dépasse `tickIntervalMs * 2` | `src/gateway/client.ts`                                                              |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 Mo)                             | `src/gateway/server-constants.ts`                                                          |

Le serveur annonce les valeurs effectives `policy.tickIntervalMs`, `policy.maxPayload` et `policy.maxBufferedBytes` dans `hello-ok` ; les clients doivent respecter ces valeurs plutôt que les valeurs par défaut d’avant handshake.

## Auth

- L’authentification Gateway par secret partagé utilise `connect.params.auth.token` ou
  `connect.params.auth.password`, selon le mode d’authentification configuré.
- Les modes portant une identité comme Tailscale Serve
  (`gateway.auth.allowTailscale: true`) ou
  `gateway.auth.mode: "trusted-proxy"` hors local loopback satisfont le contrôle
  d’authentification de connexion à partir des en-têtes de requête plutôt que de
  `connect.params.auth.*`.
- Le mode d’entrée privée `gateway.auth.mode: "none"` ignore entièrement
  l’authentification de connexion par secret partagé ; n’exposez pas ce mode sur
  une entrée publique/non fiable.
- Après l’appairage, le Gateway émet un **jeton d’appareil** limité au rôle de
  connexion + aux portées. Il est renvoyé dans `hello-ok.auth.deviceToken` et
  doit être conservé par le client pour les futures connexions.
- Les clients doivent conserver le `hello-ok.auth.deviceToken` principal après
  toute connexion réussie.
- Une reconnexion avec ce jeton d’appareil **stocké** doit aussi réutiliser
  l’ensemble de portées approuvé stocké pour ce jeton. Cela préserve l’accès
  lecture/sonde/statut déjà accordé et évite de réduire silencieusement les
  reconnexions à une portée implicite plus étroite réservée à l’administration.
- Assemblage de l’authentification de connexion côté client (`selectConnectAuth`
  dans `src/gateway/client.ts`) :
  - `auth.password` est orthogonal et est toujours transmis lorsqu’il est défini.
  - `auth.token` est renseigné par ordre de priorité : jeton partagé explicite
    d’abord, puis un `deviceToken` explicite, puis un jeton par appareil stocké
    (indexé par `deviceId` + `role`).
  - `auth.bootstrapToken` est envoyé uniquement lorsqu’aucun des éléments
    ci-dessus n’a résolu un `auth.token`. Un jeton partagé ou tout jeton
    d’appareil résolu le supprime.
  - La promotion automatique d’un jeton d’appareil stocké lors de la nouvelle
    tentative ponctuelle `AUTH_TOKEN_MISMATCH` est limitée aux **points de
    terminaison fiables uniquement** : loopback, ou `wss://` avec un
    `tlsFingerprint` épinglé. Un `wss://` public sans épinglage n’est pas
    admissible.
- L’amorçage intégré par code de configuration renvoie le
  `hello-ok.auth.deviceToken` du nœud principal ainsi qu’un jeton opérateur borné
  dans `hello-ok.auth.deviceTokens` pour un transfert mobile fiable. Le jeton
  opérateur inclut `operator.talk.secrets` pour les lectures de configuration
  Talk natives, mais exclut les portées de mutation d’appairage et
  `operator.admin`.
- Pendant qu’un amorçage par code de configuration hors référence attend une
  approbation, les détails `PAIRING_REQUIRED` incluent
  `recommendedNextStep: "wait_then_retry"`, `retryable: true` et
  `pauseReconnect: false`. Les clients doivent continuer à se reconnecter avec
  le même jeton d’amorçage jusqu’à ce que la demande soit approuvée ou que le
  jeton devienne invalide.
- Conservez `hello-ok.auth.deviceTokens` uniquement lorsque la connexion a
  utilisé l’authentification d’amorçage sur un transport fiable comme `wss://` ou
  un appairage loopback/local.
- Si un client fournit un `deviceToken` **explicite** ou des `scopes` explicites,
  l’ensemble de portées demandé par cet appelant reste l’autorité ; les portées
  mises en cache ne sont réutilisées que lorsque le client réutilise le jeton par
  appareil stocké.
- Les jetons d’appareil peuvent être alternés/révoqués via
  `device.token.rotate` et `device.token.revoke` (nécessite la portée
  `operator.pairing`). L’alternance ou la révocation d’un nœud ou d’un autre rôle
  non opérateur nécessite aussi `operator.admin`.
- `device.token.rotate` renvoie des métadonnées d’alternance. Il renvoie en écho
  le jeton porteur de remplacement uniquement pour les appels du même appareil
  déjà authentifiés avec ce jeton d’appareil, afin que les clients à jeton seul
  puissent conserver leur remplacement avant de se reconnecter. Les alternances
  partagées/admin ne renvoient pas le jeton porteur en écho.
- L’émission, l’alternance et la révocation des jetons restent bornées à
  l’ensemble de rôles approuvé enregistré dans l’entrée d’appairage de cet
  appareil ; la mutation de jeton ne peut pas étendre ni cibler un rôle
  d’appareil que l’approbation d’appairage n’a jamais accordé.
- Pour les sessions par jeton d’appareil appairé, la gestion des appareils est
  limitée à soi-même sauf si l’appelant possède aussi `operator.admin` : les
  appelants non administrateurs ne peuvent gérer que le jeton opérateur pour
  leur **propre** entrée d’appareil. La gestion des jetons de nœud et autres
  jetons non opérateur est réservée à l’administration, même pour le propre
  appareil de l’appelant.
- `device.token.rotate` et `device.token.revoke` vérifient aussi l’ensemble de
  portées du jeton opérateur cible par rapport aux portées de session actuelles
  de l’appelant. Les appelants non administrateurs ne peuvent pas alterner ni
  révoquer un jeton opérateur plus large que celui qu’ils détiennent déjà.
- Les échecs d’authentification incluent `error.details.code` ainsi que des
  indications de récupération :
  - `error.details.canRetryWithDeviceToken` (booléen)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportement du client pour `AUTH_TOKEN_MISMATCH` :
  - Les clients fiables peuvent tenter une nouvelle tentative bornée avec un
    jeton par appareil mis en cache.
  - Si cette nouvelle tentative échoue, les clients doivent arrêter les boucles
    de reconnexion automatiques et afficher des indications d’action pour
    l’opérateur.
- `AUTH_SCOPE_MISMATCH` signifie que le jeton d’appareil a été reconnu mais ne
  couvre pas le rôle/les portées demandés. Les clients ne doivent pas présenter
  cela comme un mauvais jeton ; invitez l’opérateur à réappairer ou à approuver
  le contrat de portée plus étroit/plus large.

## Identité d’appareil + appairage

- Les nœuds doivent inclure une identité d’appareil stable (`device.id`) dérivée
  de l’empreinte d’une paire de clés.
- Les Gateways émettent des jetons par appareil + rôle.
- Les approbations d’appairage sont requises pour les nouveaux ID d’appareil,
  sauf si l’approbation automatique locale est activée.
- L’approbation automatique de l’appairage est centrée sur les connexions directes
  local loopback.
- OpenClaw possède aussi un chemin étroit d’auto-connexion backend/local au
  conteneur pour les flux d’assistance fiables par secret partagé.
- Les connexions tailnet ou LAN sur le même hôte sont toujours traitées comme
  distantes pour l’appairage et nécessitent une approbation.
- Les clients WS incluent normalement l’identité `device` pendant `connect`
  (opérateur + nœud). Les seules exceptions opérateur sans appareil sont les
  chemins de confiance explicites :
  - `gateway.controlUi.allowInsecureAuth=true` pour la compatibilité HTTP non
    sécurisée limitée à localhost.
  - authentification Control UI opérateur réussie avec
    `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (procédure d’urgence,
    dégradation de sécurité sévère).
  - RPC backend `gateway-client` en direct-loopback sur le chemin d’assistance
    interne réservé.
- Omettre l’identité d’appareil a des conséquences sur les portées. Lorsqu’une
  connexion opérateur sans appareil est autorisée via un chemin de confiance
  explicite, OpenClaw efface quand même les portées autodéclarées vers un
  ensemble vide, sauf si ce chemin possède une exception nommée de préservation
  des portées. Les méthodes protégées par portée échouent alors avec
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` est un chemin de
  préservation des portées d’urgence pour Control UI. Il n’accorde pas de
  portées à des clients WebSocket backend personnalisés ou de forme CLI
  arbitraires.
- Le chemin d’assistance backend réservé en direct-loopback `gateway-client`
  préserve les portées uniquement pour les RPC internes du plan de contrôle
  local ; les ID backend personnalisés ne bénéficient pas de cette exception.
- Toutes les connexions doivent signer le nonce `connect.challenge` fourni par le
  serveur.

### Diagnostics de migration de l’authentification d’appareil

Pour les anciens clients qui utilisent encore le comportement de signature
antérieur au défi, `connect` renvoie désormais des codes de détail
`DEVICE_AUTH_*` sous `error.details.code` avec un `error.details.reason` stable.

Échecs de migration courants :

| Message                     | details.code                     | details.reason           | Signification                                      |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Le client a omis `device.nonce` (ou l’a envoyé vide). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Le client a signé avec un nonce obsolète/erroné.   |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | La charge utile de signature ne correspond pas à la charge utile v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | L’horodatage signé est en dehors du décalage autorisé. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` ne correspond pas à l’empreinte de clé publique. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Le format/la canonicalisation de la clé publique a échoué. |

Cible de migration :

- Attendez toujours `connect.challenge`.
- Signez la charge utile v2 qui inclut le nonce serveur.
- Envoyez le même nonce dans `connect.params.device.nonce`.
- La charge utile de signature préférée est `v3`, qui lie `platform` et
  `deviceFamily` en plus des champs device/client/role/scopes/token/nonce.
- Les signatures héritées `v2` restent acceptées pour la compatibilité, mais
  l’épinglage des métadonnées d’appareil appairé contrôle toujours la politique
  de commande lors de la reconnexion.

## TLS + épinglage

- TLS est pris en charge pour les connexions WS.
- Les clients peuvent éventuellement épingler l’empreinte du certificat Gateway
  (voir la configuration `gateway.tls` ainsi que
  `gateway.remote.tlsFingerprint` ou le CLI `--tls-fingerprint`).

## Portée

Ce protocole expose l’**API Gateway complète** (statut, canaux, modèles, chat,
agent, sessions, nœuds, approbations, etc.). La surface exacte est définie par
les schémas TypeBox dans `packages/gateway-protocol/src/schema.ts`.

## Connexe

- [Protocole de pont](/fr/gateway/bridge-protocol)
- [Runbook Gateway](/fr/gateway)
