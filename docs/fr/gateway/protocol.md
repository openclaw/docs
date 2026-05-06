---
read_when:
    - Implémentation ou mise à jour de clients WS Gateway
    - Débogage des incompatibilités de protocole ou des échecs de connexion
    - Régénération du schéma et des modèles de protocole
summary: 'Protocole WebSocket du Gateway : poignée de main, trames, versionnement'
title: Protocole Gateway
x-i18n:
    generated_at: "2026-05-06T07:24:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a5eb7a84dbe0664fd78271408686a643dbc0579de5b5402fd1a8d33fd59221d
    source_path: gateway/protocol.md
    workflow: 16
---

Le protocole WS du Gateway est le **plan de contrôle unique + transport de nœud** pour
OpenClaw. Tous les clients (CLI, interface web, application macOS, nœuds iOS/Android, nœuds
headless) se connectent via WebSocket et déclarent leur **rôle** + leur **portée** au moment
du handshake.

## Transport

- WebSocket, trames texte avec charges utiles JSON.
- La première trame **doit** être une requête `connect`.
- Les trames avant connexion sont limitées à 64 KiB. Après un handshake réussi, les clients
  doivent respecter les limites `hello-ok.policy.maxPayload` et
  `hello-ok.policy.maxBufferedBytes`. Lorsque les diagnostics sont activés,
  les trames entrantes trop volumineuses et les tampons sortants lents émettent des événements `payload.large`
  avant que le gateway ferme ou abandonne la trame concernée. Ces événements conservent
  les tailles, les limites, les surfaces et des codes de raison sûrs. Ils ne conservent pas le corps
  du message, le contenu des pièces jointes, le corps brut de la trame, les tokens, les cookies ni les valeurs secrètes.

## Handshake (connect)

Gateway → Client (défi de préconnexion) :

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
    "maxProtocol": 3,
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
    "protocol": 3,
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
dans leur budget global de connexion au lieu de l’afficher comme un échec terminal
du handshake.

`server`, `features`, `snapshot` et `policy` sont tous requis par le schéma
(`src/gateway/protocol/schema/frames.ts`). `auth` est également requis et indique
le rôle/les portées négociés. `canvasHostUrl` est facultatif.

Lorsqu’aucun token d’appareil n’est émis, `hello-ok.auth` indique les autorisations
négociées sans champs de token :

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Les clients backend de confiance dans le même processus (`client.id: "gateway-client"`,
`client.mode: "backend"`) peuvent omettre `device` sur les connexions directes en loopback
lorsqu’ils s’authentifient avec le token/mot de passe partagé du gateway. Ce chemin est réservé
aux RPC internes du plan de contrôle et empêche les lignes de base obsolètes d’appariement CLI/appareil
de bloquer le travail backend local, comme les mises à jour de sessions de sous-agents. Les clients distants,
les clients d’origine navigateur, les clients nœud et les clients explicites avec token d’appareil/identité d’appareil
utilisent toujours les vérifications normales d’appariement et de montée en portée.

Lorsqu’un token d’appareil est émis, `hello-ok` inclut aussi :

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Pendant le transfert d’amorçage de confiance, `hello-ok.auth` peut également inclure des entrées
de rôle bornées supplémentaires dans `deviceTokens` :

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

Pour le flux d’amorçage nœud/opérateur intégré, le token principal du nœud reste
`scopes: []` et tout token opérateur transféré reste limité à la liste d’autorisation de l’opérateur
d’amorçage (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Les vérifications de portée d’amorçage restent
préfixées par rôle : les entrées opérateur ne satisfont que les requêtes opérateur, et les rôles
non opérateur ont toujours besoin de portées sous leur propre préfixe de rôle.

### Exemple Node

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
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

## Cadrage

- **Requête** : `{type:"req", id, method, params}`
- **Réponse** : `{type:"res", id, ok, payload|error}`
- **Événement** : `{type:"event", event, payload, seq?, stateVersion?}`

Les méthodes à effets de bord exigent des **clés d’idempotence** (voir le schéma).

## Rôles + portées

Pour le modèle complet des portées opérateur, les vérifications au moment de l’approbation
et la sémantique des secrets partagés, voir [Portées opérateur](/fr/gateway/operator-scopes).

### Rôles

- `operator` = client du plan de contrôle (CLI/UI/automatisation).
- `node` = hôte de capacités (camera/screen/canvas/system.run).

### Portées (opérateur)

Portées courantes :

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` avec `includeSecrets: true` exige `operator.talk.secrets`
(ou `operator.admin`).

Les méthodes RPC du gateway enregistrées par les plugins peuvent demander leur propre portée opérateur, mais
les préfixes d’administration réservés du cœur (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) se résolvent toujours en `operator.admin`.

La portée de la méthode n’est que le premier contrôle. Certaines commandes slash atteintes via
`chat.send` appliquent par-dessus des vérifications plus strictes au niveau de la commande. Par exemple, les écritures persistantes
`/config set` et `/config unset` exigent `operator.admin`.

`node.pair.approve` dispose également d’une vérification de portée supplémentaire au moment de l’approbation, en plus de la
portée de méthode de base :

- requêtes sans commande : `operator.pairing`
- requêtes avec commandes de nœud non exec : `operator.pairing` + `operator.write`
- requêtes qui incluent `system.run`, `system.run.prepare` ou `system.which` :
  `operator.pairing` + `operator.admin`

### Caps/commandes/autorisations (nœud)

Les nœuds déclarent leurs revendications de capacités au moment de la connexion :

- `caps` : catégories de capacités de haut niveau comme `camera`, `canvas`, `screen`,
  `location`, `voice` et `talk`.
- `commands` : liste d’autorisation des commandes pour l’invocation.
- `permissions` : bascules granulaires (par ex. `screen.record`, `camera.capture`).

Le Gateway traite ces éléments comme des **revendications** et applique des listes d’autorisation côté serveur.

## Présence

- `system-presence` renvoie des entrées indexées par identité d’appareil.
- Les entrées de présence incluent `deviceId`, `roles` et `scopes` afin que les interfaces puissent afficher une seule ligne par appareil
  même lorsqu’il se connecte à la fois comme **opérateur** et **nœud**.
- `node.list` inclut les champs facultatifs `lastSeenAtMs` et `lastSeenReason`. Les nœuds connectés indiquent
  leur heure de connexion actuelle comme `lastSeenAtMs` avec la raison `connect` ; les nœuds appariés peuvent aussi indiquer
  une présence durable en arrière-plan lorsqu’un événement de nœud de confiance met à jour leurs métadonnées d’appariement.

### Événement alive de nœud en arrière-plan

Les nœuds peuvent appeler `node.event` avec `event: "node.presence.alive"` pour enregistrer qu’un nœud apparié était
actif pendant un réveil en arrière-plan sans le marquer comme connecté.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` est une énumération fermée : `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` ou `connect`. Les chaînes de déclencheur inconnues sont normalisées en
`background` par le gateway avant la persistance. L’événement n’est durable que pour les sessions d’appareil nœud
authentifiées ; les sessions sans appareil ou non appariées renvoient `handled: false`.

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

## Délimitation de portée des événements diffusés

Les événements de diffusion WebSocket poussés par le serveur sont contrôlés par portée afin que les sessions limitées à l’appariement ou uniquement nœud ne reçoivent pas passivement le contenu des sessions.

- **Trames de chat, d’agent et de résultats d’outils** (y compris les événements `agent` diffusés en streaming et les résultats d’appels d’outils) exigent au moins `operator.read`. Les sessions sans `operator.read` ignorent entièrement ces trames.
- **Diffusions `plugin.*` définies par les plugins** sont limitées à `operator.write` ou `operator.admin`, selon la manière dont le plugin les a enregistrées.
- **Événements d’état et de transport** (`heartbeat`, `presence`, `tick`, cycle de vie connect/disconnect, etc.) restent sans restriction afin que la santé du transport reste observable par chaque session authentifiée.
- **Familles d’événements de diffusion inconnues** sont contrôlées par portée par défaut (fermeture en cas d’échec), sauf si un gestionnaire enregistré les assouplit explicitement.

Chaque connexion client conserve son propre numéro de séquence par client afin que les diffusions préservent un ordre monotone sur ce socket, même lorsque différents clients voient différents sous-ensembles filtrés par portée du flux d’événements.

## Familles courantes de méthodes RPC

La surface WS publique est plus large que les exemples de handshake/authentification ci-dessus. Ceci
n’est pas un dump généré — `hello-ok.features.methods` est une liste de découverte prudente
construite à partir de `src/gateway/server-methods-list.ts` plus les exports de méthodes de plugins/canaux
chargés. Traitez-la comme une découverte de fonctionnalités, et non comme une énumération complète
de `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System and identity">
    - `health` renvoie l’instantané de santé du gateway mis en cache ou fraîchement sondé.
    - `diagnostics.stability` renvoie l’enregistreur de stabilité diagnostique borné récent. Il conserve des métadonnées opérationnelles comme les noms d’événements, les compteurs, les tailles en octets, les mesures mémoire, l’état des files/sessions, les noms de canaux/plugins et les identifiants de session. Il ne conserve pas le texte des chats, les corps de webhooks, les sorties d’outils, les corps bruts de requêtes ou de réponses, les tokens, les cookies ni les valeurs secrètes. La portée de lecture opérateur est requise.
    - `status` renvoie le résumé du gateway de style `/status` ; les champs sensibles ne sont inclus que pour les clients opérateur dotés d’une portée admin.
    - `gateway.identity.get` renvoie l’identité d’appareil du gateway utilisée par les flux de relais et d’appariement.
    - `system-presence` renvoie l’instantané de présence actuel pour les appareils opérateur/nœud connectés.
    - `system-event` ajoute un événement système et peut mettre à jour/diffuser le contexte de présence.
    - `last-heartbeat` renvoie le dernier événement Heartbeat persisté.
    - `set-heartbeats` active ou désactive le traitement des heartbeats sur le gateway.

  </Accordion>

  <Accordion title="Modèles et utilisation">
    - `models.list` renvoie le catalogue des modèles autorisés à l’exécution. Passez `{ "view": "configured" }` pour les modèles configurés adaptés au sélecteur (`agents.defaults.models` d’abord, puis `models.providers.*.models`), ou `{ "view": "all" }` pour le catalogue complet.
    - `usage.status` renvoie les fenêtres d’utilisation des fournisseurs et les résumés de quota restant.
    - `usage.cost` renvoie des résumés agrégés des coûts d’utilisation pour une plage de dates.
    - `doctor.memory.status` renvoie l’état de préparation de la mémoire vectorielle / des embeddings mis en cache pour l’espace de travail actif de l’agent par défaut. Passez `{ "probe": true }` ou `{ "deep": true }` uniquement lorsque l’appelant veut explicitement envoyer un ping en direct au fournisseur d’embeddings.
    - `doctor.memory.remHarness` renvoie un aperçu limité et en lecture seule du harnais REM pour les clients distants du plan de contrôle. Il peut inclure des chemins d’espace de travail, des extraits de mémoire, du Markdown ancré rendu et des candidats à la promotion approfondie ; les appelants ont donc besoin de `operator.read`.
    - `sessions.usage` renvoie des résumés d’utilisation par session.
    - `sessions.usage.timeseries` renvoie l’utilisation en séries temporelles pour une session.
    - `sessions.usage.logs` renvoie les entrées de journal d’utilisation pour une session.

  </Accordion>

  <Accordion title="Canaux et assistants de connexion">
    - `channels.status` renvoie les résumés d’état des canaux/plugins intégrés et groupés.
    - `channels.logout` déconnecte un canal/compte spécifique lorsque le canal prend en charge la déconnexion.
    - `web.login.start` démarre un flux de connexion QR/web pour le fournisseur de canal web actuel compatible QR.
    - `web.login.wait` attend la fin de ce flux de connexion QR/web et démarre le canal en cas de réussite.
    - `push.test` envoie une notification push APNs de test à un nœud iOS enregistré.
    - `voicewake.get` renvoie les déclencheurs de mot d’activation stockés.
    - `voicewake.set` met à jour les déclencheurs de mot d’activation et diffuse le changement.

  </Accordion>

  <Accordion title="Messagerie et journaux">
    - `send` est le RPC de livraison sortante directe pour les envois ciblant un canal/compte/fil en dehors de l’exécuteur de chat.
    - `logs.tail` renvoie la fin du fichier journal configuré du Gateway avec des contrôles de curseur/limite et de nombre maximal d’octets.

  </Accordion>

  <Accordion title="Talk et TTS">
    - `talk.catalog` renvoie le catalogue en lecture seule des fournisseurs Talk pour la parole, la transcription en streaming et la voix en temps réel. Il inclut les identifiants de fournisseur, les libellés, l’état configuré, les identifiants de modèle/voix exposés, les modes canoniques, les transports, les stratégies de cerveau et les indicateurs audio/capacités en temps réel, sans renvoyer de secrets de fournisseur ni modifier la configuration globale.
    - `talk.config` renvoie la charge utile effective de configuration Talk ; `includeSecrets` nécessite `operator.talk.secrets` (ou `operator.admin`).
    - `talk.session.create` crée une session Talk détenue par le Gateway pour `realtime/gateway-relay`, `transcription/gateway-relay` ou `stt-tts/managed-room`. `brain: "direct-tools"` nécessite `operator.admin`.
    - `talk.session.join` valide un jeton de session de salle gérée, émet les événements `session.ready` ou `session.replaced` si nécessaire, et renvoie les métadonnées de salle/session ainsi que les événements Talk récents sans le jeton en clair ni le hachage de jeton stocké.
    - `talk.session.appendAudio` ajoute de l’audio d’entrée PCM en base64 aux sessions de relais temps réel et de transcription détenues par le Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` et `talk.session.cancelTurn` pilotent le cycle de vie des tours de salle gérée avec rejet des tours obsolètes avant l’effacement de l’état.
    - `talk.session.cancelOutput` arrête la sortie audio de l’assistant, principalement pour l’interruption contrôlée par VAD dans les sessions de relais du Gateway.
    - `talk.session.submitToolResult` termine un appel d’outil fournisseur émis par une session de relais temps réel détenue par le Gateway.
    - `talk.session.close` ferme une session de relais, de transcription ou de salle gérée détenue par le Gateway et émet les événements Talk terminaux.
    - `talk.mode` définit/diffuse l’état actuel du mode Talk pour les clients WebChat/Control UI.
    - `talk.client.create` crée une session fournisseur temps réel détenue par le client avec `webrtc` ou `provider-websocket`, tandis que le Gateway détient la configuration, les identifiants, les instructions et la politique d’outils.
    - `talk.client.toolCall` permet aux transports temps réel détenus par le client de transmettre les appels d’outils fournisseur à la politique du Gateway. Le premier outil pris en charge est `openclaw_agent_consult` ; les clients reçoivent un identifiant d’exécution et attendent les événements normaux du cycle de vie du chat avant de soumettre le résultat d’outil propre au fournisseur.
    - `talk.event` est le canal d’événements Talk unique pour les adaptateurs temps réel, transcription, STT/TTS, salle gérée, téléphonie et réunion.
    - `talk.speak` synthétise la parole via le fournisseur de parole Talk actif.
    - `tts.status` renvoie l’état d’activation de TTS, le fournisseur actif, les fournisseurs de secours et l’état de configuration des fournisseurs.
    - `tts.providers` renvoie l’inventaire visible des fournisseurs TTS.
    - `tts.enable` et `tts.disable` basculent l’état des préférences TTS.
    - `tts.setProvider` met à jour le fournisseur TTS préféré.
    - `tts.convert` exécute une conversion ponctuelle de texte en parole.

  </Accordion>

  <Accordion title="Secrets, configuration, mise à jour et assistant">
    - `secrets.reload` résout à nouveau les SecretRefs actifs et remplace l’état des secrets à l’exécution uniquement en cas de réussite complète.
    - `secrets.resolve` résout les affectations de secrets ciblées par commande pour un ensemble commande/cible spécifique.
    - `config.get` renvoie l’instantané et le hachage de la configuration actuelle.
    - `config.set` écrit une charge utile de configuration validée.
    - `config.patch` fusionne une mise à jour partielle de la configuration.
    - `config.apply` valide et remplace la charge utile complète de configuration.
    - `config.schema` renvoie la charge utile du schéma de configuration en direct utilisée par Control UI et les outils CLI : schéma, `uiHints`, version et métadonnées de génération, y compris les métadonnées de schéma Plugin + canal lorsque l’exécution peut les charger. Le schéma inclut les métadonnées de champ `title` / `description` dérivées des mêmes libellés et textes d’aide que ceux utilisés par l’UI, y compris les branches de composition objet imbriqué, joker, élément de tableau et `anyOf` / `oneOf` / `allOf` lorsqu’une documentation de champ correspondante existe.
    - `config.schema.lookup` renvoie une charge utile de recherche limitée au chemin pour un chemin de configuration : chemin normalisé, nœud de schéma superficiel, indice correspondant + `hintPath`, et résumés des enfants immédiats pour l’exploration détaillée UI/CLI. Les nœuds de schéma de recherche conservent la documentation destinée à l’utilisateur et les champs de validation courants (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, bornes numériques/chaînes/tableaux/objets, et indicateurs comme `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Les résumés d’enfants exposent `key`, `path` normalisé, `type`, `required`, `hasChildren`, ainsi que le `hint` / `hintPath` correspondant.
    - `update.run` exécute le flux de mise à jour du Gateway et planifie un redémarrage uniquement lorsque la mise à jour elle-même a réussi ; les appelants disposant d’une session peuvent inclure `continuationMessage` afin que le démarrage reprenne un tour d’agent de suivi via la file de continuation après redémarrage. Les mises à jour par gestionnaire de paquets imposent un redémarrage de mise à jour non différé et sans délai de refroidissement après le remplacement du paquet, afin que l’ancien processus Gateway ne continue pas à charger paresseusement depuis une arborescence `dist` remplacée.
    - `update.status` renvoie la dernière sentinelle de redémarrage de mise à jour mise en cache, y compris la version en cours d’exécution après redémarrage lorsqu’elle est disponible.
    - `wizard.start`, `wizard.next`, `wizard.status` et `wizard.cancel` exposent l’assistant d’intégration via WS RPC.

  </Accordion>

  <Accordion title="Assistants d’agent et d’espace de travail">
    - `agents.list` renvoie les entrées d’agent configurées, y compris le modèle effectif et les métadonnées d’exécution.
    - `agents.create`, `agents.update` et `agents.delete` gèrent les enregistrements d’agent et le câblage de l’espace de travail.
    - `agents.files.list`, `agents.files.get` et `agents.files.set` gèrent les fichiers d’espace de travail d’amorçage exposés pour un agent.
    - `artifacts.list`, `artifacts.get` et `artifacts.download` exposent les résumés d’artefacts dérivés des transcriptions et les téléchargements pour une portée explicite `sessionKey`, `runId` ou `taskId`. Les requêtes d’exécution et de tâche résolvent la session propriétaire côté serveur et ne renvoient que les médias de transcription avec une provenance correspondante ; les sources d’URL non sûres ou locales renvoient des téléchargements non pris en charge au lieu d’être récupérées côté serveur.
    - `environments.list` et `environments.status` exposent la découverte en lecture seule des environnements locaux au Gateway et de nœud pour les clients SDK.
    - `agent.identity.get` renvoie l’identité effective de l’assistant pour un agent ou une session.
    - `agent.wait` attend la fin d’une exécution et renvoie l’instantané terminal lorsqu’il est disponible.

  </Accordion>

  <Accordion title="Contrôle des sessions">
    - `sessions.list` renvoie l’index actuel des sessions, y compris les métadonnées `agentRuntime` par ligne lorsqu’un backend d’exécution d’agent est configuré.
    - `sessions.subscribe` et `sessions.unsubscribe` activent ou désactivent les abonnements aux événements de changement de session pour le client WS actuel.
    - `sessions.messages.subscribe` et `sessions.messages.unsubscribe` activent ou désactivent les abonnements aux événements de transcription/message pour une session.
    - `sessions.preview` renvoie des aperçus de transcription bornés pour des clés de session spécifiques.
    - `sessions.describe` renvoie une ligne de session Gateway pour une clé de session exacte.
    - `sessions.resolve` résout ou canonise une cible de session.
    - `sessions.create` crée une nouvelle entrée de session.
    - `sessions.send` envoie un message dans une session existante.
    - `sessions.steer` est la variante d’interruption et d’orientation pour une session active.
    - `sessions.abort` interrompt le travail actif pour une session. Un appelant peut passer `key` plus un `runId` facultatif, ou passer uniquement `runId` pour les exécutions actives que le Gateway peut résoudre vers une session.
    - `sessions.patch` met à jour les métadonnées/remplacements de session et signale le modèle canonique résolu ainsi que le `agentRuntime` effectif.
    - `sessions.reset`, `sessions.delete` et `sessions.compact` effectuent la maintenance des sessions.
    - `sessions.get` renvoie la ligne de session stockée complète.
    - L’exécution du chat utilise toujours `chat.history`, `chat.send`, `chat.abort` et `chat.inject`. `chat.history` est normalisé pour l’affichage destiné aux clients UI : les balises de directive en ligne sont supprimées du texte visible, les charges utiles XML d’appel d’outil en texte brut (y compris `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` et les blocs d’appel d’outil tronqués) ainsi que les jetons de contrôle de modèle ASCII/pleine chasse ayant fuité sont supprimés, les lignes d’assistant composées uniquement de jetons silencieux comme les `NO_REPLY` / `no_reply` exacts sont omises, et les lignes surdimensionnées peuvent être remplacées par des placeholders.

  </Accordion>

  <Accordion title="Appairage d’appareils et jetons d’appareil">
    - `device.pair.list` renvoie les appareils appairés en attente et approuvés.
    - `device.pair.approve`, `device.pair.reject` et `device.pair.remove` gèrent les enregistrements d’appairage d’appareils.
    - `device.token.rotate` fait tourner un jeton d’appareil appairé dans les limites de son rôle approuvé et de la portée de l’appelant.
    - `device.token.revoke` révoque un jeton d’appareil appairé dans les limites de son rôle approuvé et de la portée de l’appelant.

  </Accordion>

  <Accordion title="Appairage de nœud, invocation et travail en attente">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` et `node.pair.verify` couvrent l’appairage de nœud et la vérification d’amorçage.
    - `node.list` et `node.describe` renvoient l’état des nœuds connus/connectés.
    - `node.rename` met à jour le libellé d’un nœud appairé.
    - `node.invoke` transmet une commande à un nœud connecté.
    - `node.invoke.result` renvoie le résultat d’une requête d’invocation.
    - `node.event` transporte les événements provenant des nœuds vers le gateway.
    - `node.canvas.capability.refresh` actualise les jetons de capacité de canevas limités à une portée.
    - `node.pending.pull` et `node.pending.ack` sont les API de file d’attente des nœuds connectés.
    - `node.pending.enqueue` et `node.pending.drain` gèrent le travail durable en attente pour les nœuds hors ligne/déconnectés.

  </Accordion>

  <Accordion title="Familles d’approbation">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` et `exec.approval.resolve` couvrent les demandes ponctuelles d’approbation exec ainsi que la recherche/relecture des approbations en attente.
    - `exec.approval.waitDecision` attend une approbation exec en attente et renvoie la décision finale (ou `null` en cas d’expiration).
    - `exec.approvals.get` et `exec.approvals.set` gèrent les instantanés de politique d’approbation exec du Gateway.
    - `exec.approvals.node.get` et `exec.approvals.node.set` gèrent la politique d’approbation exec locale au Node via les commandes de relais du Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` et `plugin.approval.resolve` couvrent les flux d’approbation définis par les Plugins.

  </Accordion>

  <Accordion title="Automatisation, Skills et outils">
    - Automatisation : `wake` planifie une injection de texte de réveil immédiate ou au prochain Heartbeat ; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gèrent le travail planifié.
    - Skills et outils : `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Familles d’événements courantes

- `chat` : mises à jour de discussion de l’UI telles que `chat.inject` et autres
  événements de discussion uniquement liés à la transcription.
- `session.message` et `session.tool` : mises à jour de transcription/flux d’événements pour une
  session abonnée.
- `sessions.changed` : l’index de session ou les métadonnées ont changé.
- `presence` : mises à jour de l’instantané de présence du système.
- `tick` : événement périodique keepalive / vivacité.
- `health` : mise à jour de l’instantané de santé du Gateway.
- `heartbeat` : mise à jour du flux d’événements Heartbeat.
- `cron` : événement de changement d’exécution/tâche Cron.
- `shutdown` : notification d’arrêt du Gateway.
- `node.pair.requested` / `node.pair.resolved` : cycle de vie d’appairage du Node.
- `node.invoke.request` : diffusion de demande d’invocation du Node.
- `device.pair.requested` / `device.pair.resolved` : cycle de vie des appareils appairés.
- `voicewake.changed` : la configuration du déclencheur par mot de réveil a changé.
- `exec.approval.requested` / `exec.approval.resolved` : cycle de vie de l’approbation exec.
- `plugin.approval.requested` / `plugin.approval.resolved` : cycle de vie de l’approbation de Plugin.

### Méthodes d’aide du Node

- Les Nodes peuvent appeler `skills.bins` pour récupérer la liste actuelle des exécutables de Skills
  pour les vérifications d’autorisation automatique.

### Méthodes d’aide pour les opérateurs

- Les opérateurs peuvent appeler `commands.list` (`operator.read`) pour récupérer l’inventaire des commandes d’exécution
  d’un agent.
  - `agentId` est facultatif ; omettez-le pour lire l’espace de travail de l’agent par défaut.
  - `scope` contrôle la surface ciblée par le `name` principal :
    - `text` renvoie le jeton de commande texte principal sans le `/` initial
    - `native` et le chemin par défaut `both` renvoient les noms natifs tenant compte du fournisseur
      lorsqu’ils sont disponibles
  - `textAliases` contient les alias slash exacts tels que `/model` et `/m`.
  - `nativeName` contient le nom de commande natif tenant compte du fournisseur lorsqu’il existe.
  - `provider` est facultatif et n’affecte que le nommage natif ainsi que la disponibilité des commandes natives de Plugin.
  - `includeArgs=false` omet les métadonnées d’arguments sérialisées de la réponse.
- Les opérateurs peuvent appeler `tools.catalog` (`operator.read`) pour récupérer le catalogue d’outils d’exécution d’un
  agent. La réponse inclut des outils groupés et des métadonnées de provenance :
  - `source` : `core` ou `plugin`
  - `pluginId` : propriétaire du Plugin lorsque `source="plugin"`
  - `optional` : indique si un outil de Plugin est facultatif
- Les opérateurs peuvent appeler `tools.effective` (`operator.read`) pour récupérer l’inventaire des outils effectif à l’exécution
  pour une session.
  - `sessionKey` est requis.
  - Le Gateway dérive le contexte d’exécution approuvé depuis la session côté serveur au lieu d’accepter
    un contexte d’authentification ou de livraison fourni par l’appelant.
  - La réponse est limitée à la session et reflète ce que la conversation active peut utiliser maintenant,
    y compris les outils du cœur, des Plugins et des canaux.
- Les opérateurs peuvent appeler `tools.invoke` (`operator.write`) pour invoquer un outil disponible via le
  même chemin de politique du Gateway que `/tools/invoke`.
  - `name` est requis. `args`, `sessionKey`, `agentId`, `confirm` et
    `idempotencyKey` sont facultatifs.
  - Si `sessionKey` et `agentId` sont tous deux présents, l’agent de session résolu doit correspondre à
    `agentId`.
  - La réponse est une enveloppe destinée au SDK avec `ok`, `toolName`, `output` facultatif et des champs
    `error` typés. Les refus d’approbation ou de politique renvoient `ok:false` dans la charge utile plutôt que de
    contourner le pipeline de politique d’outils du Gateway.
- Les opérateurs peuvent appeler `skills.status` (`operator.read`) pour récupérer l’inventaire visible
  des Skills d’un agent.
  - `agentId` est facultatif ; omettez-le pour lire l’espace de travail de l’agent par défaut.
  - La réponse inclut l’éligibilité, les exigences manquantes, les vérifications de configuration et
    les options d’installation nettoyées sans exposer les valeurs secrètes brutes.
- Les opérateurs peuvent appeler `skills.search` et `skills.detail` (`operator.read`) pour
  les métadonnées de découverte ClawHub.
- Les opérateurs peuvent appeler `skills.install` (`operator.admin`) dans deux modes :
  - Mode ClawHub : `{ source: "clawhub", slug, version?, force? }` installe un
    dossier de skill dans le répertoire `skills/` de l’espace de travail de l’agent par défaut.
  - Mode installateur du Gateway : `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    exécute une action `metadata.openclaw.install` déclarée sur l’hôte Gateway.
- Les opérateurs peuvent appeler `skills.update` (`operator.admin`) dans deux modes :
  - Le mode ClawHub met à jour un slug suivi ou toutes les installations ClawHub suivies dans
    l’espace de travail de l’agent par défaut.
  - Le mode configuration corrige les valeurs `skills.entries.<skillKey>` telles que `enabled`,
    `apiKey` et `env`.

### Vues `models.list`

`models.list` accepte un paramètre `view` facultatif :

- Omis ou `"default"` : comportement d’exécution actuel. Si `agents.defaults.models` est configuré, la réponse est le catalogue autorisé ; sinon, la réponse est le catalogue Gateway complet.
- `"configured"` : comportement dimensionné pour un sélecteur. Si `agents.defaults.models` est configuré, il reste prioritaire. Sinon, la réponse utilise les entrées explicites `models.providers.*.models`, avec repli vers le catalogue complet uniquement lorsqu’aucune ligne de modèle configurée n’existe.
- `"all"` : catalogue Gateway complet, en contournant `agents.defaults.models`. Utilisez ceci pour les diagnostics et les UI de découverte, pas pour les sélecteurs de modèles normaux.

## Approbations exec

- Lorsqu’une demande exec nécessite une approbation, le Gateway diffuse `exec.approval.requested`.
- Les clients opérateurs résolvent en appelant `exec.approval.resolve` (nécessite la portée `operator.approvals`).
- Pour `host=node`, `exec.approval.request` doit inclure `systemRunPlan` (`argv`/`cwd`/`rawCommand`/métadonnées de session canoniques). Les demandes sans `systemRunPlan` sont rejetées.
- Après approbation, les appels transférés `node.invoke system.run` réutilisent ce
  `systemRunPlan` canonique comme contexte de commande/cwd/session faisant autorité.
- Si un appelant modifie `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` entre la préparation et le transfert final approuvé `system.run`, le
  Gateway rejette l’exécution au lieu de faire confiance à la charge utile modifiée.

## Repli de livraison de l’agent

- Les demandes `agent` peuvent inclure `deliver=true` pour demander une livraison sortante.
- `bestEffortDeliver=false` conserve le comportement strict : les cibles de livraison non résolues ou uniquement internes renvoient `INVALID_REQUEST`.
- `bestEffortDeliver=true` autorise le repli vers une exécution limitée à la session lorsqu’aucune route livrable externe ne peut être résolue (par exemple les sessions internes/webchat ou les configurations multicanaux ambiguës).

## Versionnement

- `PROTOCOL_VERSION` se trouve dans `src/gateway/protocol/schema/protocol-schemas.ts`.
- Les clients envoient `minProtocol` + `maxProtocol` ; le serveur rejette les incompatibilités.
- Les schémas + modèles sont générés à partir de définitions TypeBox :
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes client

Le client de référence dans `src/gateway/client.ts` utilise ces valeurs par défaut. Les valeurs sont
stables dans le protocole v3 et constituent la base attendue pour les clients tiers.

| Constante                                 | Par défaut                                            | Source                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Délai d’expiration de requête (par RPC)   | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Délai d’expiration préauth / défi de connexion | `15_000` ms                                      | `src/gateway/handshake-timeouts.ts` (config/env peuvent augmenter le budget serveur/client appairé) |
| Backoff de reconnexion initial            | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff de reconnexion maximal            | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Limite de nouvelle tentative rapide après fermeture par jeton d’appareil | `250` ms               | `src/gateway/client.ts`                                                                    |
| Délai de grâce d’arrêt forcé avant `terminate()` | `250` ms                                        | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Délai d’expiration par défaut de `stopAndWait()` | `1_000` ms                                      | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Intervalle de tick par défaut (avant `hello-ok`) | `30_000` ms                                    | `src/gateway/client.ts`                                                                    |
| Fermeture sur délai d’expiration de tick  | code `4000` lorsque le silence dépasse `tickIntervalMs * 2` | `src/gateway/client.ts`                                                             |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 Mo)                            | `src/gateway/server-constants.ts`                                                          |

Le serveur annonce les valeurs effectives `policy.tickIntervalMs`, `policy.maxPayload`
et `policy.maxBufferedBytes` dans `hello-ok` ; les clients doivent respecter ces valeurs
plutôt que les valeurs par défaut avant handshake.

## Auth

- L’authentification par secret partagé du Gateway utilise `connect.params.auth.token` ou
  `connect.params.auth.password`, selon le mode d’authentification configuré.
- Les modes porteurs d’identité, comme Tailscale Serve
  (`gateway.auth.allowTailscale: true`) ou le mode hors local loopback
  `gateway.auth.mode: "trusted-proxy"`, satisfont la vérification d’authentification de connexion à partir
  des en-têtes de requête au lieu de `connect.params.auth.*`.
- Le mode d’entrée privée `gateway.auth.mode: "none"` ignore entièrement
  l’authentification de connexion par secret partagé ; n’exposez pas ce mode sur une entrée publique/non fiable.
- Après l’appairage, le Gateway émet un **jeton d’appareil** limité au rôle de connexion
  + aux portées. Il est renvoyé dans `hello-ok.auth.deviceToken` et doit être
  conservé par le client pour les connexions futures.
- Les clients doivent conserver le `hello-ok.auth.deviceToken` principal après toute
  connexion réussie.
- La reconnexion avec ce jeton d’appareil **stocké** doit également réutiliser l’ensemble
  de portées approuvé stocké pour ce jeton. Cela préserve l’accès lecture/sonde/statut
  déjà accordé et évite de réduire silencieusement les reconnexions à une
  portée implicite plus étroite, limitée à l’administrateur.
- Assemblage de l’authentification de connexion côté client (`selectConnectAuth` dans
  `src/gateway/client.ts`) :
  - `auth.password` est orthogonal et est toujours transmis lorsqu’il est défini.
  - `auth.token` est renseigné par ordre de priorité : jeton partagé explicite d’abord,
    puis un `deviceToken` explicite, puis un jeton par appareil stocké (indexé par
    `deviceId` + `role`).
  - `auth.bootstrapToken` n’est envoyé que lorsque rien de ce qui précède n’a résolu un
    `auth.token`. Un jeton partagé ou tout jeton d’appareil résolu le supprime.
  - La promotion automatique d’un jeton d’appareil stocké lors de la nouvelle tentative unique
    `AUTH_TOKEN_MISMATCH` est réservée aux **points de terminaison fiables uniquement** —
    loopback, ou `wss://` avec une `tlsFingerprint` épinglée. Le `wss://` public
    sans épinglage n’est pas admissible.
- Les entrées supplémentaires `hello-ok.auth.deviceTokens` sont des jetons de transfert de bootstrap.
  Ne les conservez que lorsque la connexion a utilisé l’authentification bootstrap sur un transport fiable
  tel que `wss://` ou un appairage loopback/local.
- Si un client fournit un `deviceToken` **explicite** ou des `scopes` explicites, cet ensemble
  de portées demandé par l’appelant reste l’autorité ; les portées mises en cache ne sont
  réutilisées que lorsque le client réutilise le jeton par appareil stocké.
- Les jetons d’appareil peuvent être renouvelés/révoqués via `device.token.rotate` et
  `device.token.revoke` (nécessite la portée `operator.pairing`).
- `device.token.rotate` renvoie des métadonnées de rotation. Il renvoie en écho le jeton porteur
  de remplacement uniquement pour les appels du même appareil déjà authentifiés avec
  ce jeton d’appareil, afin que les clients fondés uniquement sur un jeton puissent conserver leur remplacement avant
  de se reconnecter. Les rotations partagées/admin ne renvoient pas le jeton porteur en écho.
- L’émission, la rotation et la révocation de jetons restent limitées à l’ensemble de rôles approuvé
  enregistré dans l’entrée d’appairage de cet appareil ; la mutation de jeton ne peut pas étendre ni
  cibler un rôle d’appareil que l’approbation d’appairage n’a jamais accordé.
- Pour les sessions de jeton d’appareil appairé, la gestion des appareils est limitée à soi-même, sauf si
  l’appelant possède aussi `operator.admin` : les appelants non administrateurs ne peuvent supprimer/révoquer/renouveler
  que leur **propre** entrée d’appareil.
- `device.token.rotate` et `device.token.revoke` vérifient aussi l’ensemble de portées du jeton opérateur cible
  par rapport aux portées de session actuelles de l’appelant. Les appelants non administrateurs
  ne peuvent pas renouveler ni révoquer un jeton opérateur plus large que celui qu’ils détiennent déjà.
- Les échecs d’authentification incluent `error.details.code` ainsi que des indications de récupération :
  - `error.details.canRetryWithDeviceToken` (booléen)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportement du client pour `AUTH_TOKEN_MISMATCH` :
  - Les clients fiables peuvent tenter une nouvelle tentative bornée avec un jeton par appareil mis en cache.
  - Si cette nouvelle tentative échoue, les clients doivent arrêter les boucles de reconnexion automatique et afficher des consignes d’action pour l’opérateur.

## Identité d’appareil + appairage

- Les Nodes doivent inclure une identité d’appareil stable (`device.id`) dérivée d’une
  empreinte de paire de clés.
- Les Gateways émettent des jetons par appareil + rôle.
- Les approbations d’appairage sont requises pour les nouveaux ID d’appareil, sauf si l’approbation automatique locale
  est activée.
- L’approbation automatique d’appairage est centrée sur les connexions directes en local loopback.
- OpenClaw dispose aussi d’un chemin d’auto-connexion étroit local au backend/conteneur pour
  les flux d’assistants fiables à secret partagé.
- Les connexions tailnet ou LAN du même hôte sont toujours traitées comme distantes pour l’appairage et
  nécessitent une approbation.
- Les clients WS incluent normalement l’identité `device` pendant `connect` (opérateur +
  Node). Les seules exceptions opérateur sans appareil sont les chemins de confiance explicites :
  - `gateway.controlUi.allowInsecureAuth=true` pour la compatibilité HTTP non sécurisée limitée à localhost.
  - authentification réussie de l’opérateur Control UI en mode `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (mesure d’urgence, forte dégradation de la sécurité).
  - RPC backend `gateway-client` en loopback direct authentifiés avec le jeton/mot de passe
    partagé du Gateway.
- Toutes les connexions doivent signer le nonce `connect.challenge` fourni par le serveur.

### Diagnostics de migration de l’authentification d’appareil

Pour les clients hérités qui utilisent encore le comportement de signature antérieur au challenge, `connect` renvoie désormais
des codes de détail `DEVICE_AUTH_*` sous `error.details.code` avec un `error.details.reason` stable.

Échecs de migration courants :

| Message                     | details.code                     | details.reason           | Signification                                      |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Le client a omis `device.nonce` (ou l’a envoyé vide). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Le client a signé avec un nonce obsolète/incorrect. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | La charge utile de signature ne correspond pas à la charge utile v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | L’horodatage signé est en dehors de la dérive autorisée. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` ne correspond pas à l’empreinte de clé publique. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Le format/la canonicalisation de la clé publique a échoué. |

Cible de migration :

- Attendez toujours `connect.challenge`.
- Signez la charge utile v2 qui inclut le nonce du serveur.
- Envoyez le même nonce dans `connect.params.device.nonce`.
- La charge utile de signature préférée est `v3`, qui lie `platform` et `deviceFamily`
  en plus des champs appareil/client/rôle/portées/jeton/nonce.
- Les signatures héritées `v2` restent acceptées pour compatibilité, mais l’épinglage
  des métadonnées d’appareil appairé contrôle toujours la politique de commande à la reconnexion.

## TLS + épinglage

- TLS est pris en charge pour les connexions WS.
- Les clients peuvent facultativement épingler l’empreinte du certificat du Gateway (voir la configuration `gateway.tls`
  ainsi que `gateway.remote.tlsFingerprint` ou le CLI `--tls-fingerprint`).

## Portée

Ce protocole expose l’**API complète du Gateway** (statut, canaux, modèles, chat,
agent, sessions, Nodes, approbations, etc.). La surface exacte est définie par les
schémas TypeBox dans `src/gateway/protocol/schema.ts`.

## Associé

- [Protocole Bridge](/fr/gateway/bridge-protocol)
- [Guide d’exploitation du Gateway](/fr/gateway)
