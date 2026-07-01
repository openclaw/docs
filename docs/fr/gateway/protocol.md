---
read_when:
    - Implémenter ou mettre à jour des clients WS du Gateway
    - Débogage des incompatibilités de protocole ou des échecs de connexion
    - Régénération du schéma et des modèles de protocole
summary: 'Protocole WebSocket Gateway : établissement de la connexion, trames, versionnage'
title: Gateway protocol
x-i18n:
    generated_at: "2026-07-01T05:41:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fbfc5db0169f7ac2eacdb882d2afe08c80d5b8d669b6a1cfb2ffd0edbf71d16
    source_path: gateway/protocol.md
    workflow: 16
---

Le protocole WS du Gateway est le **plan de contrôle unique + transport de nœud** pour
OpenClaw. Tous les clients (CLI, interface web, app macOS, nœuds iOS/Android, nœuds
headless) se connectent via WebSocket et déclarent leur **rôle** + leur **portée** au
moment de la négociation.

## Transport

- WebSocket, trames texte avec charges utiles JSON.
- La première trame **doit** être une requête `connect`.
- Les trames pré-connexion sont limitées à 64 Kio. Après une négociation réussie, les clients
  doivent respecter les limites `hello-ok.policy.maxPayload` et
  `hello-ok.policy.maxBufferedBytes`. Lorsque les diagnostics sont activés,
  les trames entrantes trop volumineuses et les tampons sortants lents émettent des événements `payload.large`
  avant que le gateway ne ferme ou ignore la trame concernée. Ces événements conservent
  les tailles, limites, surfaces et codes de raison sûrs. Ils ne conservent pas le corps du message,
  le contenu des pièces jointes, le corps brut de la trame, les jetons, les cookies ni les valeurs secrètes.

## Négociation (connect)

Gateway → Client (défi pré-connexion) :

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

Pendant que le Gateway termine encore le démarrage des sidecars, la requête `connect` peut
renvoyer une erreur `UNAVAILABLE` réessayable avec `details.reason` défini sur
`"startup-sidecars"` et `retryAfterMs`. Les clients doivent réessayer cette réponse
dans leur budget global de connexion au lieu de la présenter comme un échec
terminal de négociation.

`server`, `features`, `snapshot` et `policy` sont tous requis par le schéma
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` est également requis et indique
le rôle et les portées négociés. `pluginSurfaceUrls` est facultatif et associe les noms de surfaces
de plugin, comme `canvas`, à des URL hébergées à portée limitée.

Les URL de surfaces de plugin à portée limitée peuvent expirer. Les nœuds peuvent appeler
`node.pluginSurface.refresh` avec `{ "surface": "canvas" }` pour recevoir une nouvelle
entrée dans `pluginSurfaceUrls`. La refonte expérimentale du Plugin Canvas ne prend pas
en charge le chemin de compatibilité obsolète `canvasHostUrl`, `canvasCapability` ou
`node.canvas.capability.refresh` ; les clients natifs et gateways actuels doivent utiliser les surfaces de plugin.

Lorsqu’aucun jeton d’appareil n’est émis, `hello-ok.auth` indique les permissions négociées
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
`client.mode: "backend"`) peuvent omettre `device` sur les connexions directes local loopback lorsqu’ils
s’authentifient avec le jeton/mot de passe gateway partagé. Ce chemin est réservé
aux RPC internes du plan de contrôle et évite que des bases de référence obsolètes d’association CLI/appareil
ne bloquent le travail backend local, comme les mises à jour de sessions de sous-agent. Les clients distants,
les clients d’origine navigateur, les clients nœuds et les clients explicites avec jeton d’appareil/identité d’appareil
utilisent toujours les vérifications normales d’association et de montée en portée.

Lorsqu’un jeton d’appareil est émis, `hello-ok` inclut également :

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
operator borné :

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

Le transfert operator est volontairement borné afin que l’intégration QR puisse démarrer la
boucle operator mobile sans accorder `operator.admin` ni `operator.pairing`.
Il inclut bien `operator.talk.secrets` afin que le client natif puisse lire la configuration Talk
dont il a besoin après l’amorçage. Les portées admin et d’association plus larges nécessitent
une association operator approuvée séparée ou un flux de jeton. Les clients doivent persister
`hello-ok.auth.deviceTokens` uniquement
lorsque la connexion a utilisé l’authentification d’amorçage sur un transport de confiance comme `wss://` ou
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

## Encadrement

- **Requête** : `{type:"req", id, method, params}`
- **Réponse** : `{type:"res", id, ok, payload|error}`
- **Événement** : `{type:"event", event, payload, seq?, stateVersion?}`

Les méthodes avec effets de bord nécessitent des **clés d’idempotence** (voir le schéma).

## Rôles + portées

Pour le modèle complet des portées operator, les vérifications au moment de l’approbation et la
sémantique des secrets partagés, consultez [Portées operator](/fr/gateway/operator-scopes).

### Rôles

- `operator` = client du plan de contrôle (CLI/UI/automatisation).
- `node` = hôte de capacités (camera/screen/canvas/system.run).

### Portées (operator)

Portées courantes :

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` avec `includeSecrets: true` nécessite `operator.talk.secrets`
(ou `operator.admin`).
Lorsque les secrets sont inclus, les clients doivent lire l’identifiant du fournisseur Talk actif
depuis `talk.resolved.config.apiKey` ; `talk.providers.<id>.apiKey`
conserve la forme source et peut être un objet SecretRef ou une chaîne expurgée.

Les méthodes RPC gateway enregistrées par un plugin peuvent demander leur propre portée operator, mais
les préfixes admin réservés du cœur (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) se résolvent toujours en `operator.admin`.

La portée de méthode n’est que la première barrière. Certaines commandes slash atteintes via
`chat.send` appliquent en plus des vérifications plus strictes au niveau de la commande. Par exemple, les écritures persistantes
`/config set` et `/config unset` nécessitent `operator.admin`.

`node.pair.approve` comporte aussi une vérification supplémentaire de portée au moment de l’approbation en plus de la
portée de méthode de base :

- requêtes sans commande : `operator.pairing`
- requêtes avec commandes de nœud non exec : `operator.pairing` + `operator.write`
- requêtes qui incluent `system.run`, `system.run.prepare` ou `system.which` :
  `operator.pairing` + `operator.admin`

### Capacités/commandes/permissions (nœud)

Les nœuds déclarent des revendications de capacités au moment de la connexion :

- `caps` : catégories de capacités de haut niveau comme `camera`, `canvas`, `screen`,
  `location`, `voice` et `talk`.
- `commands` : liste d’autorisation des commandes pour invoke.
- `permissions` : bascules granulaires (par exemple `screen.record`, `camera.capture`).

Le Gateway traite celles-ci comme des **revendications** et applique des listes d’autorisation côté serveur.

## Présence

- `system-presence` renvoie des entrées indexées par identité d’appareil.
- Les entrées de présence incluent `deviceId`, `roles` et `scopes` afin que les interfaces puissent afficher une seule ligne par appareil
  même lorsqu’il se connecte à la fois comme **operator** et comme **node**.
- `node.list` inclut les champs facultatifs `lastSeenAtMs` et `lastSeenReason`. Les nœuds connectés indiquent
  leur heure de connexion actuelle comme `lastSeenAtMs` avec la raison `connect` ; les nœuds associés peuvent aussi indiquer
  une présence d’arrière-plan durable lorsqu’un événement de nœud de confiance met à jour leurs métadonnées d’association.

### Événement d’activité d’arrière-plan du nœud

Les nœuds peuvent appeler `node.event` avec `event: "node.presence.alive"` pour enregistrer qu’un nœud associé était
actif pendant un réveil en arrière-plan sans le marquer comme connecté.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` est une énumération fermée : `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` ou `connect`. Les chaînes de déclencheur inconnues sont normalisées en
`background` par le gateway avant persistance. L’événement n’est durable que pour les sessions d’appareil nœud authentifiées ;
les sessions sans appareil ou non associées renvoient `handled: false`.

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

## Portée des événements de diffusion

Les événements de diffusion WebSocket envoyés par le serveur sont filtrés par portée afin que les sessions à portée d’association ou réservées aux nœuds ne reçoivent pas passivement le contenu de session.

- Les **trames de chat, d’agent et de résultats d’outil** (y compris les événements `agent` diffusés en continu et les résultats d’appels d’outil) nécessitent au moins `operator.read`. Les sessions sans `operator.read` ignorent entièrement ces trames.
- Les **diffusions `plugin.*` définies par les plugins** sont filtrées sur `operator.write` ou `operator.admin`, selon la manière dont le plugin les a enregistrées.
- Les **événements de statut et de transport** (`heartbeat`, `presence`, `tick`, cycle de vie connect/disconnect, etc.) restent sans restriction afin que la santé du transport reste observable par chaque session authentifiée.
- Les **familles d’événements de diffusion inconnues** sont filtrées par portée par défaut (fermeture en cas d’échec), sauf si un gestionnaire enregistré les assouplit explicitement.

Chaque connexion client conserve son propre numéro de séquence par client afin que les diffusions préservent l’ordre monotone sur cette socket, même lorsque différents clients voient différents sous-ensembles filtrés par portée du flux d’événements.

## Familles de méthodes RPC courantes

La surface WS publique est plus large que les exemples de négociation/authentification ci-dessus. Ceci
n’est pas un vidage généré — `hello-ok.features.methods` est une liste de découverte
conservatrice construite à partir de `src/gateway/server-methods-list.ts` plus les exports de méthodes
de plugins/canaux chargés. Traitez-la comme une découverte de fonctionnalités, et non comme une énumération complète
de `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="Système et identité">
    - `health` renvoie l’instantané d’état de la passerelle mis en cache ou fraîchement sondé.
    - `diagnostics.stability` renvoie l’enregistreur récent et borné de stabilité des diagnostics. Il conserve des métadonnées opérationnelles telles que les noms d’événements, les nombres, les tailles en octets, les relevés mémoire, l’état des files d’attente/sessions, les noms de canaux/plugins et les identifiants de session. Il ne conserve pas le texte des conversations, les corps de webhooks, les sorties d’outils, les corps bruts de requête ou de réponse, les jetons, les cookies ni les valeurs secrètes. La portée de lecture opérateur est requise.
    - `status` renvoie le résumé de la passerelle au format `/status` ; les champs sensibles ne sont inclus que pour les clients opérateurs à portée administrateur.
    - `gateway.identity.get` renvoie l’identité de l’appareil Gateway utilisée par les flux de relais et d’appairage.
    - `system-presence` renvoie l’instantané de présence actuel des appareils opérateur/nœud connectés.
    - `system-event` ajoute un événement système et peut mettre à jour/diffuser le contexte de présence.
    - `last-heartbeat` renvoie le dernier événement Heartbeat persisté.
    - `set-heartbeats` active ou désactive le traitement des Heartbeat sur la passerelle.

  </Accordion>

  <Accordion title="Modèles et utilisation">
    - `models.list` renvoie le catalogue de modèles autorisés à l’exécution. Passez `{ "view": "configured" }` pour les modèles configurés de taille adaptée au sélecteur (`agents.defaults.models` d’abord, puis `models.providers.*.models`), ou `{ "view": "all" }` pour le catalogue complet.
    - `usage.status` renvoie les fenêtres d’utilisation des fournisseurs et les résumés de quota restant.
    - `usage.cost` renvoie des résumés agrégés de coûts d’utilisation pour une plage de dates.
      Passez `agentId` pour un agent, ou `agentScope: "all"` pour agréger les agents configurés.
    - `doctor.memory.status` renvoie l’état de préparation de la mémoire vectorielle / des embeddings en cache pour l’espace de travail de l’agent par défaut actif. Passez `{ "probe": true }` ou `{ "deep": true }` uniquement lorsque l’appelant veut explicitement un ping en direct du fournisseur d’embeddings. Les clients compatibles Dreaming peuvent aussi passer `{ "agentId": "agent-id" }` pour limiter les statistiques du magasin Dreaming à un espace de travail d’agent sélectionné ; omettre `agentId` conserve le repli vers l’agent par défaut et agrège les espaces de travail Dreaming configurés.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` et `doctor.memory.dedupeDreamDiary` acceptent des paramètres facultatifs `{ "agentId": "agent-id" }` pour les vues/actions Dreaming d’un agent sélectionné. Lorsque `agentId` est omis, ils opèrent sur l’espace de travail de l’agent par défaut configuré.
    - `doctor.memory.remHarness` renvoie un aperçu borné et en lecture seule du harnais REM pour les clients distants du plan de contrôle. Il peut inclure des chemins d’espaces de travail, des extraits de mémoire, du Markdown ancré rendu et des candidats de promotion profonde ; les appelants ont donc besoin de `operator.read`.
    - `sessions.usage` renvoie les résumés d’utilisation par session. Passez `agentId` pour un
      agent, ou `agentScope: "all"` pour lister ensemble les agents configurés.
    - `sessions.usage.timeseries` renvoie l’utilisation en série temporelle pour une session.
    - `sessions.usage.logs` renvoie les entrées de journal d’utilisation pour une session.

  </Accordion>

  <Accordion title="Canaux et assistants de connexion">
    - `channels.status` renvoie les résumés d’état des canaux/plugins intégrés et groupés.
    - `channels.logout` déconnecte un canal/compte spécifique lorsque le canal prend en charge la déconnexion.
    - `web.login.start` démarre un flux de connexion QR/web pour le fournisseur de canal web actuel compatible QR.
    - `web.login.wait` attend la fin de ce flux de connexion QR/web et démarre le canal en cas de succès.
    - `push.test` envoie une notification push APNs de test à un nœud iOS enregistré.
    - `voicewake.get` renvoie les déclencheurs de mot d’activation stockés.
    - `voicewake.set` met à jour les déclencheurs de mot d’activation et diffuse le changement.

  </Accordion>

  <Accordion title="Messagerie et journaux">
    - `send` est le RPC direct de livraison sortante pour les envois ciblés par canal/compte/fil en dehors du lanceur de conversation.
    - `logs.tail` renvoie la fin configurée du journal fichier de la passerelle avec des contrôles de curseur/limite et de taille maximale en octets.

  </Accordion>

  <Accordion title="Talk et TTS">
    - `talk.catalog` renvoie le catalogue en lecture seule des fournisseurs Talk pour la parole, la transcription en streaming et la voix en temps réel. Il inclut les identifiants de fournisseurs, les libellés, l’état configuré, les identifiants de modèles/voix exposés, les modes canoniques, les transports, les stratégies de cerveau et les indicateurs audio/capacités temps réel, sans renvoyer les secrets des fournisseurs ni modifier la configuration globale.
    - `talk.config` renvoie la charge utile de configuration Talk effective ; `includeSecrets` requiert `operator.talk.secrets` (ou `operator.admin`).
    - `talk.session.create` crée une session Talk appartenant au Gateway pour `realtime/gateway-relay`, `transcription/gateway-relay` ou `stt-tts/managed-room`. Pour `stt-tts/managed-room`, les appelants `operator.write` qui passent `sessionKey` doivent aussi passer `spawnedBy` pour une visibilité de clé de session limitée ; la création de `sessionKey` non limitée et `brain: "direct-tools"` requièrent `operator.admin`.
    - `talk.session.join` valide un jeton de session de salle gérée, émet les événements `session.ready` ou `session.replaced` selon les besoins, et renvoie les métadonnées de salle/session ainsi que les événements Talk récents sans le jeton en clair ni le hachage de jeton stocké.
    - `talk.session.appendAudio` ajoute de l’audio d’entrée PCM base64 aux sessions de relais temps réel et de transcription appartenant au Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` et `talk.session.cancelTurn` pilotent le cycle de vie des tours de salle gérée, avec rejet des tours obsolètes avant l’effacement de l’état.
    - `talk.session.cancelOutput` arrête la sortie audio de l’assistant, principalement pour l’interruption détectée par VAD dans les sessions de relais Gateway.
    - `talk.session.submitToolResult` termine un appel d’outil fournisseur émis par une session de relais temps réel appartenant au Gateway. Passez `options: { willContinue: true }` pour une sortie d’outil intermédiaire lorsqu’un résultat final suivra, ou `options: { suppressResponse: true }` lorsque le résultat d’outil doit satisfaire l’appel fournisseur sans démarrer une autre réponse d’assistant temps réel.
    - `talk.session.steer` envoie le contrôle vocal d’une exécution active vers une session Talk adossée à un agent et appartenant au Gateway. Il accepte `{ sessionId, text, mode? }`, où `mode` vaut `status`, `steer`, `cancel` ou `followup` ; le mode omis est classé à partir du texte prononcé.
    - `talk.session.close` ferme une session de relais, de transcription ou de salle gérée appartenant au Gateway et émet les événements Talk terminaux.
    - `talk.mode` définit/diffuse l’état actuel du mode Talk pour les clients WebChat/Control UI.
    - `talk.client.create` crée une session de fournisseur temps réel appartenant au client avec `webrtc` ou `provider-websocket`, tandis que le Gateway possède la configuration, les identifiants, les instructions et la politique d’outils.
    - `talk.client.toolCall` permet aux transports temps réel appartenant au client de transmettre les appels d’outils fournisseur à la politique Gateway. Le premier outil pris en charge est `openclaw_agent_consult` ; les clients reçoivent un identifiant d’exécution et attendent les événements normaux du cycle de vie de conversation avant de soumettre le résultat d’outil propre au fournisseur.
    - `talk.client.steer` envoie le contrôle vocal d’une exécution active pour les transports temps réel appartenant au client. Le Gateway résout l’exécution intégrée active depuis `sessionKey` et renvoie un résultat structuré accepté/rejeté au lieu d’ignorer silencieusement le pilotage.
    - `talk.event` est le canal unique d’événements Talk pour les adaptateurs temps réel, transcription, STT/TTS, salle gérée, téléphonie et réunion.
    - `talk.speak` synthétise la parole via le fournisseur de parole Talk actif.
    - `tts.status` renvoie l’état d’activation TTS, le fournisseur actif, les fournisseurs de repli et l’état de configuration des fournisseurs.
    - `tts.providers` renvoie l’inventaire visible des fournisseurs TTS.
    - `tts.enable` et `tts.disable` activent ou désactivent l’état des préférences TTS.
    - `tts.setProvider` met à jour le fournisseur TTS préféré.
    - `tts.convert` exécute une conversion ponctuelle de texte en parole.

  </Accordion>

  <Accordion title="Secrets, configuration, mise à jour et assistant">
    - `secrets.reload` résout à nouveau les SecretRefs actifs et remplace l’état des secrets d’exécution uniquement en cas de réussite complète.
    - `secrets.resolve` résout les affectations de secrets ciblées par commande pour un ensemble commande/cible spécifique.
    - `config.get` renvoie l’instantané de configuration actuel et son hachage.
    - `config.set` écrit une charge utile de configuration validée.
    - `config.patch` fusionne une mise à jour partielle de configuration. Le remplacement destructif de tableau
      exige le chemin affecté dans `replacePaths` ; les tableaux imbriqués
      sous des entrées de tableau utilisent des chemins `[]`, tels que `agents.list[].skills`.
    - `config.apply` valide et remplace la charge utile complète de configuration.
    - `config.schema` renvoie la charge utile du schéma de configuration en direct utilisée par Control UI et les outils CLI : schéma, `uiHints`, version et métadonnées de génération, y compris les métadonnées de schéma plugin + canal lorsque l’environnement d’exécution peut les charger. Le schéma inclut les métadonnées de champ `title` / `description` dérivées des mêmes libellés et textes d’aide que ceux utilisés par l’interface utilisateur, y compris les branches de composition d’objets imbriqués, de jokers, d’éléments de tableau et `anyOf` / `oneOf` / `allOf` lorsque la documentation de champ correspondante existe.
    - `config.schema.lookup` renvoie une charge utile de recherche limitée à un chemin pour un chemin de configuration : chemin normalisé, nœud de schéma superficiel, indice correspondant + `hintPath`, `reloadKind` facultatif et résumés des enfants immédiats pour l’exploration UI/CLI. `reloadKind` vaut `restart`, `hot` ou `none` et reflète le planificateur de rechargement de configuration Gateway pour le chemin demandé. Les nœuds de schéma de recherche conservent la documentation destinée aux utilisateurs et les champs de validation courants (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, bornes numériques/chaînes/tableaux/objets, et indicateurs comme `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Les résumés enfants exposent `key`, `path` normalisé, `type`, `required`, `hasChildren`, `reloadKind` facultatif, ainsi que le `hint` / `hintPath` correspondant.
    - `update.run` exécute le flux de mise à jour de la passerelle et planifie un redémarrage uniquement lorsque la mise à jour elle-même a réussi ; les appelants disposant d’une session peuvent inclure `continuationMessage` afin que le démarrage reprenne un tour d’agent de suivi via la file de continuation de redémarrage. Les mises à jour par gestionnaire de paquets et les mises à jour de checkout git supervisées depuis le plan de contrôle utilisent un transfert détaché vers un service géré au lieu de remplacer l’arborescence du paquet ou de modifier la sortie checkout/build dans le Gateway en direct. Un transfert démarré renvoie `ok: true` avec `result.reason: "managed-service-handoff-started"` et `handoff.status: "started"` ; les transferts indisponibles ou échoués renvoient `ok: false` avec `managed-service-handoff-unavailable` ou `managed-service-handoff-failed`, plus `handoff.command` lorsqu’une mise à jour shell manuelle est requise. Un transfert indisponible signifie qu’OpenClaw ne dispose pas d’une frontière de supervision sûre ou d’une identité de service durable, comme `OPENCLAW_SYSTEMD_UNIT` pour systemd. Pendant un transfert démarré, la sentinelle de redémarrage peut brièvement signaler `stats.reason: "restart-health-pending"` ; la continuation est différée jusqu’à ce que la CLI vérifie le Gateway redémarré et écrive la sentinelle finale `ok`.
    - `update.status` actualise et renvoie la dernière sentinelle de redémarrage de mise à jour, y compris la version en cours d’exécution après redémarrage lorsqu’elle est disponible.
    - `wizard.start`, `wizard.next`, `wizard.status` et `wizard.cancel` exposent l’assistant d’intégration via WS RPC.

  </Accordion>

  <Accordion title="Assistants d’agent et d’espace de travail">
    - `agents.list` renvoie les entrées d’agent configurées, y compris le modèle effectif et les métadonnées d’exécution.
    - `agents.create`, `agents.update` et `agents.delete` gèrent les enregistrements d’agent et le câblage de l’espace de travail.
    - `agents.files.list`, `agents.files.get` et `agents.files.set` gèrent les fichiers d’espace de travail d’amorçage exposés pour un agent.
    - `tasks.list`, `tasks.get` et `tasks.cancel` exposent le registre des tâches du Gateway aux clients SDK et opérateur.
    - `artifacts.list`, `artifacts.get` et `artifacts.download` exposent les résumés d’artefacts dérivés de la transcription et les téléchargements pour une portée explicite `sessionKey`, `runId` ou `taskId`. Les requêtes d’exécution et de tâche résolvent la session propriétaire côté serveur et ne renvoient que les médias de transcription dont la provenance correspond ; les sources d’URL non sûres ou locales renvoient des téléchargements non pris en charge au lieu d’être récupérées côté serveur.
    - `environments.list` et `environments.status` exposent la découverte en lecture seule des environnements locaux au Gateway et des environnements de nœud pour les clients SDK.
    - `agent.identity.get` renvoie l’identité effective de l’assistant pour un agent ou une session.
    - `agent.wait` attend la fin d’une exécution et renvoie l’instantané terminal lorsqu’il est disponible.

  </Accordion>

  <Accordion title="Contrôle des sessions">
    - `sessions.list` renvoie l’index de session actuel, y compris les métadonnées `agentRuntime` par ligne lorsqu’un backend d’exécution d’agent est configuré.
    - `sessions.subscribe` et `sessions.unsubscribe` activent ou désactivent les abonnements aux événements de changement de session pour le client WS actuel.
    - `sessions.messages.subscribe` et `sessions.messages.unsubscribe` activent ou désactivent les abonnements aux événements de transcription/message pour une session.
    - `sessions.preview` renvoie des aperçus bornés de transcription pour des clés de session précises.
    - `sessions.describe` renvoie une ligne de session Gateway pour une clé de session exacte.
    - `sessions.resolve` résout ou canonise une cible de session.
    - `sessions.create` crée une nouvelle entrée de session.
    - `sessions.send` envoie un message dans une session existante.
    - `sessions.steer` est la variante interrompre-et-orienter pour une session active.
    - `sessions.abort` interrompt le travail actif pour une session. Un appelant peut passer `key` avec un `runId` facultatif, ou passer seulement `runId` pour les exécutions actives que le Gateway peut résoudre en session.
    - `sessions.patch` met à jour les métadonnées/remplacements de session et signale le modèle canonique résolu ainsi que l’`agentRuntime` effectif.
    - `sessions.reset`, `sessions.delete` et `sessions.compact` effectuent la maintenance de session.
    - `sessions.get` renvoie la ligne de session stockée complète.
    - L’exécution du chat utilise toujours `chat.history`, `chat.send`, `chat.abort` et `chat.inject`. `chat.history` est normalisé pour l’affichage des clients d’interface utilisateur : les balises de directives en ligne sont retirées du texte visible, les charges utiles XML d’appels d’outils en texte brut (y compris `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` et les blocs d’appels d’outils tronqués) et les jetons de contrôle de modèle ASCII/pleine chasse ayant fuité sont retirés, les lignes d’assistant constituées uniquement de jetons silencieux telles que `NO_REPLY` / `no_reply` exacts sont omises, et les lignes surdimensionnées peuvent être remplacées par des espaces réservés.
    - `chat.message.get` est le lecteur additif borné de message complet pour une seule entrée de transcription visible. Les clients passent `sessionKey`, `agentId` facultatif lorsque la sélection de session est limitée à un agent, ainsi qu’un `messageId` de transcription précédemment exposé via `chat.history`, et le Gateway renvoie la même projection normalisée pour l’affichage sans la limite de troncature légère de l’historique lorsque l’entrée stockée est toujours disponible et n’est pas surdimensionnée.
    - `chat.send` accepte `fastMode: "auto"` pour un seul tour afin d’utiliser le mode rapide pour les appels de modèle démarrés avant la limite automatique, puis de lancer les appels ultérieurs de nouvelle tentative, de repli, de résultat d’outil ou de continuation sans mode rapide. La limite est de 60 secondes par défaut et peut être configurée par modèle avec `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Un appelant `chat.send` peut passer `fastAutoOnSeconds` pour un seul tour afin de remplacer la limite pour cette requête.

  </Accordion>

  <Accordion title="Appairage d’appareils et jetons d’appareil">
    - `device.pair.list` renvoie les appareils appairés en attente et approuvés.
    - `device.pair.approve`, `device.pair.reject` et `device.pair.remove` gèrent les enregistrements d’appairage d’appareils.
    - `device.token.rotate` effectue la rotation d’un jeton d’appareil appairé dans les limites de son rôle approuvé et de la portée de l’appelant.
    - `device.token.revoke` révoque un jeton d’appareil appairé dans les limites de son rôle approuvé et de la portée de l’appelant.

  </Accordion>

  <Accordion title="Appairage de nœuds, invocation et travail en attente">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` et `node.pair.verify` couvrent l’appairage de nœuds et la vérification d’amorçage.
    - `node.list` et `node.describe` renvoient l’état des nœuds connus/connectés.
    - `node.rename` met à jour le libellé d’un nœud appairé.
    - `node.invoke` transmet une commande à un nœud connecté.
    - `node.invoke.result` renvoie le résultat d’une requête d’invocation.
    - `node.event` transporte les événements émis par un nœud vers le gateway.
    - `node.pending.pull` et `node.pending.ack` sont les API de file d’attente des nœuds connectés.
    - `node.pending.enqueue` et `node.pending.drain` gèrent le travail durable en attente pour les nœuds hors ligne/déconnectés.

  </Accordion>

  <Accordion title="Familles d’approbation">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` et `exec.approval.resolve` couvrent les demandes d’approbation d’exécution ponctuelles ainsi que la recherche/relecture des approbations en attente.
    - `exec.approval.waitDecision` attend une approbation d’exécution en attente et renvoie la décision finale (ou `null` en cas d’expiration du délai).
    - `exec.approvals.get` et `exec.approvals.set` gèrent les instantanés de politique d’approbation d’exécution du gateway.
    - `exec.approvals.node.get` et `exec.approvals.node.set` gèrent la politique d’approbation d’exécution locale au nœud via les commandes de relais de nœud.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` et `plugin.approval.resolve` couvrent les flux d’approbation définis par les plugins.

  </Accordion>

  <Accordion title="Automatisation, Skills et outils">
    - Automatisation : `wake` planifie une injection de texte de réveil immédiate ou au prochain heartbeat ; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gèrent le travail planifié.
    - `cron.run` reste un RPC de type mise en file d’attente pour les exécutions manuelles. Les clients qui ont besoin de sémantiques d’achèvement doivent lire le `runId` renvoyé et interroger `cron.runs`.
    - `cron.runs` accepte un filtre `runId` facultatif non vide afin que les clients puissent suivre une exécution manuelle mise en file d’attente sans entrer en concurrence avec d’autres entrées d’historique pour le même travail.
    - Skills et outils : `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Familles d’événements courantes

- `chat` : mises à jour du chat de l’interface utilisateur telles que `chat.inject` et autres événements de chat uniquement liés à la transcription. Dans le protocole v4, les charges utiles de delta portent `deltaText` ; `message` reste l’instantané cumulatif de l’assistant. Les remplacements sans préfixe définissent `replace=true` et utilisent `deltaText` comme texte de remplacement.
- `session.message`, `session.operation` et `session.tool` : mises à jour de transcription, d’opération de session en cours et de flux d’événements pour une session abonnée.
- `sessions.changed` : l’index de session ou les métadonnées ont changé.
- `presence` : mises à jour d’instantané de présence système.
- `tick` : événement périodique de maintien de connexion / disponibilité.
- `health` : mise à jour de l’instantané de santé du gateway.
- `heartbeat` : mise à jour du flux d’événements Heartbeat.
- `cron` : événement de changement d’exécution/tâche cron.
- `shutdown` : notification d’arrêt du gateway.
- `node.pair.requested` / `node.pair.resolved` : cycle de vie de l’appairage de nœuds.
- `node.invoke.request` : diffusion d’une requête d’invocation de nœud.
- `device.pair.requested` / `device.pair.resolved` : cycle de vie des appareils appairés.
- `voicewake.changed` : la configuration de déclenchement par mot d’activation a changé.
- `exec.approval.requested` / `exec.approval.resolved` : cycle de vie de l’approbation d’exécution.
- `plugin.approval.requested` / `plugin.approval.resolved` : cycle de vie de l’approbation de plugin.

### Méthodes d’assistance des nœuds

- Les nœuds peuvent appeler `skills.bins` pour récupérer la liste actuelle des exécutables de skill pour les vérifications d’autorisation automatique.

### RPC du registre des tâches

Les clients opérateurs peuvent inspecter et annuler les enregistrements de tâches d’arrière-plan du Gateway via les RPC du registre des tâches. Ces méthodes renvoient des résumés de tâches assainis, pas l’état brut de l’exécution.

- `tasks.list` nécessite `operator.read`.
  - Paramètres : `status` facultatif (`"queued"`, `"running"`, `"completed"`, `"failed"`, `"cancelled"` ou `"timed_out"`) ou un tableau de ces statuts, `agentId` facultatif, `sessionKey` facultatif, `limit` facultatif de `1` à `500`, et `cursor` chaîne facultatif.
  - Résultat : `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` nécessite `operator.read`.
  - Paramètres : `{ "taskId": string }`.
  - Résultat : `{ "task": TaskSummary }`.
  - Les identifiants de tâche manquants renvoient la forme d’erreur introuvable du Gateway.
- `tasks.cancel` nécessite `operator.write`.
  - Paramètres : `{ "taskId": string, "reason"?: string }`.
  - Résultat :
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` indique si le registre contenait une tâche correspondante. `cancelled` indique si l’exécution a accepté ou enregistré l’annulation.

`TaskSummary` inclut `id`, `status` et des métadonnées facultatives telles que `kind`, `runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`, `runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, les horodatages, la progression, le résumé terminal et le texte d’erreur assaini. `agentId` identifie l’agent qui exécute la tâche ; `sessionKey` et `ownerKey` préservent le contexte du demandeur et du contrôle.

### Méthodes d’assistance opérateur

- Les opérateurs peuvent appeler `commands.list` (`operator.read`) pour récupérer l’inventaire des commandes d’exécution pour un agent.
  - `agentId` est facultatif ; omettez-le pour lire l’espace de travail de l’agent par défaut.
  - `scope` contrôle la surface ciblée par le `name` principal :
    - `text` renvoie le jeton de commande texte principal sans le `/` initial
    - `native` et le chemin par défaut `both` renvoient les noms natifs tenant compte du fournisseur lorsqu’ils sont disponibles
  - `textAliases` porte les alias slash exacts tels que `/model` et `/m`.
  - `nativeName` porte le nom de commande natif tenant compte du fournisseur lorsqu’il existe.
  - `provider` est facultatif et affecte uniquement le nommage natif ainsi que la disponibilité des commandes natives de plugin.
  - `includeArgs=false` omet les métadonnées d’arguments sérialisées de la réponse.
- Les opérateurs peuvent appeler `tools.catalog` (`operator.read`) pour récupérer le catalogue d’outils d’exécution pour un agent. La réponse inclut les outils groupés et les métadonnées de provenance :
  - `source` : `core` ou `plugin`
  - `pluginId` : propriétaire du plugin lorsque `source="plugin"`
  - `optional` : indique si un outil de plugin est facultatif
- Les opérateurs peuvent appeler `tools.effective` (`operator.read`) pour récupérer l’inventaire d’outils effectif à l’exécution pour une session.
  - `sessionKey` est requis.
  - Le Gateway déduit le contexte d’exécution fiable depuis la session côté serveur au lieu d’accepter un contexte d’authentification ou de livraison fourni par l’appelant.
  - La réponse est une projection, déduite par le serveur et limitée à la session, de l’inventaire actif, incluant les outils cœur, de plugin, de canal et de serveurs MCP déjà découverts.
  - `tools.effective` est en lecture seule pour MCP : il peut projeter un catalogue MCP de session chaud à travers la politique finale des outils, mais il ne crée pas d’exécutions MCP, ne connecte pas de transports et n’émet pas `tools/list`. Si aucun catalogue chaud correspondant n’existe, la réponse peut inclure un avis tel que `mcp-not-yet-connected`, `mcp-not-yet-listed` ou `mcp-stale-catalog`.
  - Les entrées d’outils effectives utilisent `source="core"`, `source="plugin"`, `source="channel"` ou `source="mcp"`.
- Les opérateurs peuvent appeler `tools.invoke` (`operator.write`) pour invoquer un outil disponible via le même chemin de politique du Gateway que `/tools/invoke`.
  - `name` est requis. `args`, `sessionKey`, `agentId`, `confirm` et `idempotencyKey` sont facultatifs.
  - Si `sessionKey` et `agentId` sont tous deux présents, l’agent de session résolu doit correspondre à `agentId`.
  - Les enveloppes cœur réservées au propriétaire telles que `cron`, `gateway` et `nodes` exigent une identité propriétaire/administrateur (`operator.admin`), même si la méthode `tools.invoke` elle-même est `operator.write`.
  - La réponse est une enveloppe destinée au SDK avec les champs `ok`, `toolName`, `output` facultatif et `error` typés. Les refus d’approbation ou de politique renvoient `ok:false` dans la charge utile plutôt que de contourner le pipeline de politique d’outils du Gateway.
- Les opérateurs peuvent appeler `skills.status` (`operator.read`) pour récupérer l’inventaire visible des compétences pour un agent.
  - `agentId` est facultatif ; omettez-le pour lire l’espace de travail de l’agent par défaut.
  - La réponse inclut l’éligibilité, les exigences manquantes, les vérifications de configuration et les options d’installation assainies sans exposer les valeurs secrètes brutes.
- Les opérateurs peuvent appeler `skills.search` et `skills.detail` (`operator.read`) pour les métadonnées de découverte ClawHub.
- Les opérateurs peuvent appeler `skills.upload.begin`, `skills.upload.chunk` et `skills.upload.commit` (`operator.admin`) pour préparer une archive de compétence privée avant son installation. Il s’agit d’un chemin de téléversement administrateur distinct pour les clients de confiance, et non du flux normal d’installation de compétence ClawHub ; il est désactivé par défaut sauf si `skills.install.allowUploadedArchives` est activé.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })` crée un téléversement lié à ce slug et à cette valeur de force.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` ajoute des octets au décalage décodé exact.
  - `skills.upload.commit({ uploadId, sha256? })` vérifie la taille finale et le SHA-256. La validation finalise uniquement le téléversement ; elle n’installe pas la compétence.
  - Les archives de compétences téléversées sont des archives zip contenant une racine `SKILL.md`. Le nom du répertoire interne de l’archive ne sélectionne jamais la cible d’installation.
- Les opérateurs peuvent appeler `skills.install` (`operator.admin`) dans trois modes :
  - Mode ClawHub : `{ source: "clawhub", slug, version?, force? }` installe un dossier de compétence dans le répertoire `skills/` de l’espace de travail de l’agent par défaut.
  - Mode téléversement : `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }` installe un téléversement validé dans le répertoire `skills/<slug>` de l’espace de travail de l’agent par défaut. Le slug et la valeur de force doivent correspondre à la requête `skills.upload.begin` d’origine. Ce mode est rejeté sauf si `skills.install.allowUploadedArchives` est activé. Le paramètre n’affecte pas les installations ClawHub.
  - Mode installateur Gateway : `{ name, installId, timeoutMs? }` exécute une action `metadata.openclaw.install` déclarée sur l’hôte du Gateway. Les anciens clients peuvent encore envoyer `dangerouslyForceUnsafeInstall` ; ce champ est obsolète, accepté uniquement pour la compatibilité du protocole et ignoré. Utilisez `security.installPolicy` pour les décisions d’installation détenues par l’opérateur.
- Les opérateurs peuvent appeler `skills.update` (`operator.admin`) dans deux modes :
  - Le mode ClawHub met à jour un slug suivi ou toutes les installations ClawHub suivies dans l’espace de travail de l’agent par défaut.
  - Le mode configuration corrige les valeurs `skills.entries.<skillKey>` telles que `enabled`, `apiKey` et `env`.

### Vues `models.list`

`models.list` accepte un paramètre `view` facultatif :

- Omis ou `"default"` : comportement d’exécution actuel. Si `agents.defaults.models` est configuré, la réponse est le catalogue autorisé, incluant les modèles découverts dynamiquement pour les entrées `provider/*`. Sinon, la réponse est le catalogue Gateway complet.
- `"configured"` : comportement dimensionné pour un sélecteur. Si `agents.defaults.models` est configuré, il reste prioritaire, incluant la découverte limitée au fournisseur pour les entrées `provider/*`. Sans liste d’autorisation, la réponse utilise les entrées explicites `models.providers.*.models`, avec repli vers le catalogue complet uniquement lorsqu’aucune ligne de modèle configurée n’existe.
- `"all"` : catalogue Gateway complet, en contournant `agents.defaults.models`. Utilisez ceci pour les diagnostics et les interfaces de découverte, pas pour les sélecteurs de modèles normaux.

## Approbations d’exécution

- Lorsqu’une requête d’exécution nécessite une approbation, le Gateway diffuse `exec.approval.requested`.
- Les clients opérateurs la résolvent en appelant `exec.approval.resolve` (nécessite le périmètre `operator.approvals`).
- Pour `host=node`, `exec.approval.request` doit inclure `systemRunPlan` (`argv`/`cwd`/`rawCommand`/métadonnées de session canoniques). Les requêtes sans `systemRunPlan` sont rejetées.
- Après approbation, les appels transmis `node.invoke system.run` réutilisent ce `systemRunPlan` canonique comme contexte de commande/cwd/session faisant autorité.
- Si un appelant modifie `command`, `rawCommand`, `cwd`, `agentId` ou `sessionKey` entre la préparation et la transmission finale approuvée de `system.run`, le Gateway rejette l’exécution au lieu de faire confiance à la charge utile modifiée.

## Repli de livraison de l’agent

- Les requêtes `agent` peuvent inclure `deliver=true` pour demander une livraison sortante.
- `bestEffortDeliver=false` conserve le comportement strict : les cibles de livraison non résolues ou uniquement internes renvoient `INVALID_REQUEST`.
- `bestEffortDeliver=true` autorise le repli vers une exécution limitée à la session lorsqu’aucune route livrable externe ne peut être résolue (par exemple, sessions internes/webchat ou configurations multicanaux ambiguës).
- Les résultats finaux `agent` peuvent inclure `result.deliveryStatus` lorsque la livraison a été demandée, en utilisant les mêmes statuts `sent`, `suppressed`, `partial_failed` et `failed` documentés pour [`openclaw agent --json --deliver`](/fr/cli/agent#json-delivery-status).

## Versionnement

- `PROTOCOL_VERSION` se trouve dans `packages/gateway-protocol/src/version.ts`.
- Les clients envoient `minProtocol` + `maxProtocol` ; le serveur rejette les plages qui n’incluent pas son protocole actuel. Les clients et serveurs actuels exigent le protocole v4.
- Les schémas + modèles sont générés depuis les définitions TypeBox :
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes client

Le client de référence dans `src/gateway/client.ts` utilise ces valeurs par défaut. Les valeurs sont stables sur le protocole v4 et constituent la base attendue pour les clients tiers.

| Constante                                 | Valeur par défaut                                     | Source                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| Délai d’expiration de requête (par RPC)   | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Délai preauth / connect-challenge         | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env peut augmenter le budget serveur/client apparié) |
| Temporisation initiale de reconnexion     | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Temporisation maximale de reconnexion     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Limite de nouvelle tentative rapide après fermeture par jeton d’appareil | `250` ms                         | `src/gateway/client.ts`                                                                    |
| Grâce force-stop avant `terminate()`      | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Délai par défaut de `stopAndWait()`       | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Intervalle de tick par défaut (avant `hello-ok`) | `30_000` ms                                    | `src/gateway/client.ts`                                                                    |
| Fermeture sur délai de tick               | code `4000` lorsque le silence dépasse `tickIntervalMs * 2` | `src/gateway/client.ts`                                                              |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 Mo)                            | `src/gateway/server-constants.ts`                                                          |

Le serveur annonce les valeurs effectives `policy.tickIntervalMs`, `policy.maxPayload` et `policy.maxBufferedBytes` dans `hello-ok` ; les clients doivent respecter ces valeurs plutôt que les valeurs par défaut d’avant la poignée de main.

## Auth

- L’authentification du Gateway par secret partagé utilise `connect.params.auth.token` ou
  `connect.params.auth.password`, selon le mode d’authentification configuré.
- Les modes portant une identité, comme Tailscale Serve
  (`gateway.auth.allowTailscale: true`) ou
  `gateway.auth.mode: "trusted-proxy"` hors loopback, satisfont la vérification
  d’authentification de connexion à partir des en-têtes de requête plutôt que de
  `connect.params.auth.*`.
- Le mode d’entrée privée `gateway.auth.mode: "none"` ignore entièrement
  l’authentification de connexion par secret partagé ; n’exposez pas ce mode sur
  une entrée publique ou non approuvée.
- Après l’appairage, le Gateway émet un **jeton d’appareil** limité au rôle de
  connexion + aux portées. Il est renvoyé dans `hello-ok.auth.deviceToken` et
  doit être conservé par le client pour les connexions futures.
- Les clients doivent conserver le `hello-ok.auth.deviceToken` principal après
  toute connexion réussie.
- Une reconnexion avec ce jeton d’appareil **stocké** doit aussi réutiliser
  l’ensemble de portées approuvé stocké pour ce jeton. Cela préserve l’accès en
  lecture/sonde/état déjà accordé et évite de réduire silencieusement les
  reconnexions à une portée implicite plus étroite, limitée à l’administration.
- Assemblage côté client de l’authentification de connexion (`selectConnectAuth`
  dans `src/gateway/client.ts`) :
  - `auth.password` est orthogonal et est toujours transmis lorsqu’il est défini.
  - `auth.token` est renseigné par ordre de priorité : jeton partagé explicite
    d’abord, puis `deviceToken` explicite, puis jeton par appareil stocké (indexé
    par `deviceId` + `role`).
  - `auth.bootstrapToken` n’est envoyé que lorsqu’aucun des éléments ci-dessus
    n’a résolu un `auth.token`. Un jeton partagé ou tout jeton d’appareil résolu
    le supprime.
  - La promotion automatique d’un jeton d’appareil stocké lors de la tentative
    unique après `AUTH_TOKEN_MISMATCH` est limitée aux **points de terminaison de
    confiance uniquement** — loopback, ou `wss://` avec un `tlsFingerprint`
    épinglé. Un `wss://` public sans épinglage n’est pas admissible.
- L’amorçage intégré par code de configuration renvoie le
  `hello-ok.auth.deviceToken` du nœud principal plus un jeton opérateur borné
  dans `hello-ok.auth.deviceTokens` pour un transfert mobile de confiance. Le
  jeton opérateur inclut `operator.talk.secrets` pour les lectures de
  configuration Talk natives et exclut `operator.admin` et `operator.pairing`.
- Pendant qu’un amorçage par code de configuration non initial attend une
  approbation, les détails `PAIRING_REQUIRED` incluent
  `recommendedNextStep: "wait_then_retry"`, `retryable: true` et
  `pauseReconnect: false`. Les clients doivent continuer à se reconnecter avec
  le même jeton d’amorçage jusqu’à ce que la demande soit approuvée ou que le
  jeton devienne invalide.
- Ne conservez `hello-ok.auth.deviceTokens` que lorsque la connexion a utilisé
  l’authentification d’amorçage sur un transport de confiance comme `wss://` ou
  un appairage loopback/local.
- Si un client fournit un `deviceToken` **explicite** ou des `scopes`
  explicites, cet ensemble de portées demandé par l’appelant reste l’autorité ;
  les portées mises en cache ne sont réutilisées que lorsque le client réutilise
  le jeton par appareil stocké.
- Les jetons d’appareil peuvent être renouvelés/révoqués via
  `device.token.rotate` et `device.token.revoke` (nécessite la portée
  `operator.pairing`). Renouveler ou révoquer un nœud ou un autre rôle non
  opérateur nécessite aussi `operator.admin`.
- `device.token.rotate` renvoie des métadonnées de renouvellement. Il renvoie en
  écho le jeton porteur de remplacement uniquement pour les appels du même
  appareil déjà authentifiés avec ce jeton d’appareil, afin que les clients à
  jeton uniquement puissent conserver leur remplacement avant de se reconnecter.
  Les renouvellements partagés/admin ne renvoient pas le jeton porteur en écho.
- L’émission, le renouvellement et la révocation de jetons restent bornés à
  l’ensemble de rôles approuvé enregistré dans l’entrée d’appairage de cet
  appareil ; la mutation de jeton ne peut pas étendre ni cibler un rôle
  d’appareil que l’approbation d’appairage n’a jamais accordé.
- Pour les sessions de jeton d’appareil appairé, la gestion des appareils est
  auto-limitée sauf si l’appelant dispose aussi de `operator.admin` : les
  appelants non administrateurs ne peuvent gérer que le jeton opérateur pour
  leur **propre** entrée d’appareil. La gestion des jetons de nœud et autres
  jetons non opérateur est réservée à l’administration, même pour le propre
  appareil de l’appelant.
- `device.token.rotate` et `device.token.revoke` vérifient aussi l’ensemble de
  portées du jeton opérateur cible par rapport aux portées de session actuelles
  de l’appelant. Les appelants non administrateurs ne peuvent pas renouveler ni
  révoquer un jeton opérateur plus large que celui qu’ils détiennent déjà.
- Les échecs d’authentification incluent `error.details.code` ainsi que des
  indications de récupération :
  - `error.details.canRetryWithDeviceToken` (booléen)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportement client pour `AUTH_TOKEN_MISMATCH` :
  - Les clients de confiance peuvent tenter une nouvelle tentative bornée avec un jeton par appareil mis en cache.
  - Si cette nouvelle tentative échoue, les clients doivent arrêter les boucles de reconnexion automatique et afficher des indications d’action pour l’opérateur.
- `AUTH_SCOPE_MISMATCH` signifie que le jeton d’appareil a été reconnu mais ne
  couvre pas le rôle/les portées demandés. Les clients ne doivent pas présenter
  cela comme un mauvais jeton ; invitez l’opérateur à réappairer ou à approuver
  le contrat de portée plus étroit/plus large.

## Identité d’appareil + appairage

- Les nœuds doivent inclure une identité d’appareil stable (`device.id`) dérivée
  de l’empreinte d’une paire de clés.
- Les Gateway émettent des jetons par appareil + rôle.
- Les approbations d’appairage sont requises pour les nouveaux ID d’appareil,
  sauf si l’approbation automatique locale est activée.
- L’approbation automatique de l’appairage est centrée sur les connexions
  directes en local loopback.
- OpenClaw dispose aussi d’un chemin étroit d’autoconnexion backend/local au
  conteneur pour les flux d’assistance de confiance par secret partagé.
- Les connexions tailnet ou LAN sur le même hôte sont toujours traitées comme
  distantes pour l’appairage et nécessitent une approbation.
- Les clients WS incluent normalement l’identité `device` pendant `connect`
  (opérateur + nœud). Les seules exceptions opérateur sans appareil sont des
  chemins de confiance explicites :
  - `gateway.controlUi.allowInsecureAuth=true` pour la compatibilité HTTP non sécurisée limitée à localhost.
  - authentification opérateur de l’interface Control UI réussie avec `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (bris de glace, dégradation de sécurité sévère).
  - RPC backend directes en loopback de `gateway-client` sur le chemin réservé
    d’assistance interne.
- L’omission de l’identité d’appareil a des conséquences sur les portées.
  Lorsqu’une connexion opérateur sans appareil est autorisée via un chemin de
  confiance explicite, OpenClaw efface tout de même les portées autodéclarées en
  les remplaçant par un ensemble vide, sauf si ce chemin dispose d’une exception
  nommée de préservation des portées. Les méthodes soumises à des portées
  échouent alors avec `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` est un chemin de
  préservation des portées de bris de glace pour l’interface Control UI. Il
  n’accorde pas de portées à des clients WebSocket backend personnalisés ou
  façonnés comme la CLI arbitraires.
- Le chemin d’assistance backend réservé `gateway-client` en loopback direct
  préserve les portées uniquement pour les RPC internes du plan de contrôle
  local ; les ID backend personnalisés ne bénéficient pas de cette exception.
- Toutes les connexions doivent signer le nonce `connect.challenge` fourni par le serveur.

### Diagnostics de migration de l’authentification d’appareil

Pour les clients hérités qui utilisent encore le comportement de signature
antérieur au challenge, `connect` renvoie désormais des codes de détail
`DEVICE_AUTH_*` sous `error.details.code` avec un `error.details.reason` stable.

Échecs de migration courants :

| Message                     | details.code                     | details.reason           | Signification                                      |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Le client a omis `device.nonce` (ou l’a envoyé vide). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Le client a signé avec un nonce obsolète/incorrect. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | La charge utile de signature ne correspond pas à la charge utile v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | L’horodatage signé est en dehors de l’écart autorisé. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` ne correspond pas à l’empreinte de la clé publique. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Le format/la canonicalisation de la clé publique a échoué. |

Cible de migration :

- Attendez toujours `connect.challenge`.
- Signez la charge utile v2 qui inclut le nonce serveur.
- Envoyez le même nonce dans `connect.params.device.nonce`.
- La charge utile de signature préférée est `v3`, qui lie `platform` et
  `deviceFamily` en plus des champs appareil/client/rôle/portées/jeton/nonce.
- Les signatures héritées `v2` restent acceptées pour compatibilité, mais
  l’épinglage des métadonnées d’appareil appairé contrôle toujours la politique
  de commande lors de la reconnexion.

## TLS + épinglage

- TLS est pris en charge pour les connexions WS.
- Les clients peuvent éventuellement épingler l’empreinte du certificat du
  Gateway (voir la configuration `gateway.tls` plus
  `gateway.remote.tlsFingerprint` ou la CLI `--tls-fingerprint`).

## Portée

Ce protocole expose l’**API Gateway complète** (état, canaux, modèles, chat,
agent, sessions, nœuds, approbations, etc.). La surface exacte est définie par
les schémas TypeBox dans `packages/gateway-protocol/src/schema.ts`.

## Connexe

- [Protocole de pont](/fr/gateway/bridge-protocol)
- [Runbook du Gateway](/fr/gateway)
