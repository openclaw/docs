---
read_when:
    - Implémentation ou mise à jour des clients WS du Gateway
    - Débogage des incompatibilités de protocole ou des échecs de connexion
    - Régénération du schéma/des modèles de protocole
summary: 'Protocole WebSocket du Gateway : négociation, trames, gestion des versions'
title: Protocole Gateway
x-i18n:
    generated_at: "2026-04-30T07:29:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0d922e9b4b778c333873e551498b905461f30f944e809555b45669ae2f5c404
    source_path: gateway/protocol.md
    workflow: 16
---

Le protocole WS du Gateway est le **plan de contrôle unique + transport de nœuds** pour
OpenClaw. Tous les clients (CLI, interface web, app macOS, nœuds iOS/Android, nœuds
sans interface) se connectent via WebSocket et déclarent leur **role** + **scope** au
moment du handshake.

## Transport

- WebSocket, trames texte avec charges utiles JSON.
- La première trame **doit** être une requête `connect`.
- Les trames avant connexion sont limitées à 64 Kio. Après un handshake réussi, les clients
  devraient respecter les limites `hello-ok.policy.maxPayload` et
  `hello-ok.policy.maxBufferedBytes`. Avec les diagnostics activés,
  les trames entrantes surdimensionnées et les tampons sortants lents émettent des événements `payload.large`
  avant que le Gateway ferme ou abandonne la trame concernée. Ces événements conservent
  les tailles, les limites, les surfaces et les codes de raison sûrs. Ils ne conservent pas le corps du message,
  le contenu des pièces jointes, le corps brut de la trame, les jetons, les cookies ni les valeurs secrètes.

## Handshake (connect)

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

Pendant que le Gateway termine encore le démarrage des sidecars, la requête `connect` peut
renvoyer une erreur `UNAVAILABLE` réessayable avec `details.reason` défini sur
`"startup-sidecars"` et `retryAfterMs`. Les clients devraient réessayer cette réponse
dans leur budget global de connexion au lieu de l’afficher comme un échec terminal
du handshake.

`server`, `features`, `snapshot` et `policy` sont tous requis par le schéma
(`src/gateway/protocol/schema/frames.ts`). `auth` est également requis et indique
le rôle/les scopes négociés. `canvasHostUrl` est facultatif.

Quand aucun jeton d’appareil n’est émis, `hello-ok.auth` indique les permissions
négociées sans champs de jeton :

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Les clients backend approuvés du même processus (`client.id: "gateway-client"`,
`client.mode: "backend"`) peuvent omettre `device` sur les connexions directes en local loopback quand
ils s’authentifient avec le jeton/mot de passe partagé du Gateway. Ce chemin est réservé
aux RPC internes du plan de contrôle et empêche des références de base CLI/appareil obsolètes de
bloquer le travail backend local, comme les mises à jour de sessions de sous-agents. Les clients distants,
les clients d’origine navigateur, les clients nœuds et les clients explicites avec jeton d’appareil/identité d’appareil
utilisent toujours les vérifications normales d’appairage et d’élévation de scope.

Quand un jeton d’appareil est émis, `hello-ok` inclut aussi :

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Pendant le transfert d’amorçage approuvé, `hello-ok.auth` peut aussi inclure des entrées de rôle
supplémentaires bornées dans `deviceTokens` :

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

Pour le flux d’amorçage intégré nœud/opérateur, le jeton principal du nœud conserve
`scopes: []` et tout jeton opérateur transféré reste limité à la liste d’autorisation de l’opérateur
d’amorçage (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Les vérifications de scope d’amorçage restent
préfixées par rôle : les entrées opérateur satisfont uniquement les requêtes opérateur, et les rôles
non opérateur ont toujours besoin de scopes sous leur propre préfixe de rôle.

### Exemple de Node

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

## Tramage

- **Requête** : `{type:"req", id, method, params}`
- **Réponse** : `{type:"res", id, ok, payload|error}`
- **Événement** : `{type:"event", event, payload, seq?, stateVersion?}`

Les méthodes avec effets de bord exigent des **clés d’idempotence** (voir le schéma).

## Rôles + scopes

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

Les méthodes RPC du Gateway enregistrées par un Plugin peuvent demander leur propre portée opérateur, mais
les préfixes d’administration du noyau réservés (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) se résolvent toujours en `operator.admin`.

La portée de méthode n’est que le premier contrôle. Certaines commandes slash atteintes via
`chat.send` appliquent en plus des contrôles plus stricts au niveau de la commande. Par exemple, les écritures persistantes
`/config set` et `/config unset` nécessitent `operator.admin`.

`node.pair.approve` comporte également un contrôle de portée supplémentaire au moment de l’approbation en plus de la
portée de méthode de base :

- requêtes sans commande : `operator.pairing`
- requêtes avec des commandes de Node non exec : `operator.pairing` + `operator.write`
- requêtes qui incluent `system.run`, `system.run.prepare` ou `system.which` :
  `operator.pairing` + `operator.admin`

### Capacités/commandes/autorisations (Node)

Les Nodes déclarent des revendications de capacité au moment de la connexion :

- `caps` : catégories de capacités de haut niveau.
- `commands` : liste d’autorisation des commandes pour invoke.
- `permissions` : bascules granulaires (par exemple `screen.record`, `camera.capture`).

Le Gateway traite ces éléments comme des **revendications** et applique des listes d’autorisation côté serveur.

## Présence

- `system-presence` renvoie des entrées indexées par identité d’appareil.
- Les entrées de présence incluent `deviceId`, `roles` et `scopes` afin que les interfaces utilisateur puissent afficher une seule ligne par appareil
  même lorsqu’il se connecte à la fois comme **opérateur** et comme **Node**.
- `node.list` inclut les champs facultatifs `lastSeenAtMs` et `lastSeenReason`. Les Nodes connectés signalent
  leur heure de connexion actuelle comme `lastSeenAtMs` avec la raison `connect` ; les Nodes appairés peuvent également signaler
  une présence d’arrière-plan durable lorsqu’un événement de Node fiable met à jour leurs métadonnées d’appairage.

### Événement d’activité en arrière-plan du Node

Les Nodes peuvent appeler `node.event` avec `event: "node.presence.alive"` pour enregistrer qu’un Node appairé était
actif pendant un réveil en arrière-plan sans le marquer comme connecté.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` est une énumération fermée : `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` ou `connect`. Les chaînes de déclencheur inconnues sont normalisées en
`background` par le Gateway avant la persistance. L’événement n’est durable que pour les sessions d’appareil de Node
authentifiées ; les sessions sans appareil ou non appairées renvoient `handled: false`.

Les gateways réussis renvoient un résultat structuré :

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

## Définition de la portée des événements de diffusion

Les événements de diffusion WebSocket poussés par le serveur sont contrôlés par portée afin que les sessions limitées à l’appairage ou propres aux Nodes ne reçoivent pas passivement le contenu de session.

- **Trames de chat, d’agent et de résultats d’outils** (y compris les événements `agent` diffusés en flux et les résultats d’appels d’outils) nécessitent au moins `operator.read`. Les sessions sans `operator.read` ignorent entièrement ces trames.
- **Diffusions `plugin.*` définies par un Plugin** sont limitées à `operator.write` ou `operator.admin`, selon la manière dont le plugin les a enregistrées.
- **Événements de statut et de transport** (`heartbeat`, `presence`, `tick`, cycle de vie de connexion/déconnexion, etc.) restent sans restriction afin que la santé du transport reste observable par chaque session authentifiée.
- **Familles d’événements de diffusion inconnues** sont contrôlées par portée par défaut (échec fermé), sauf si un gestionnaire enregistré les assouplit explicitement.

Chaque connexion cliente conserve son propre numéro de séquence par client afin que les diffusions préservent un ordre monotone sur cette socket, même lorsque différents clients voient différents sous-ensembles filtrés par portée du flux d’événements.

## Familles courantes de méthodes RPC

La surface WS publique est plus large que les exemples de handshake/auth ci-dessus. Il
ne s’agit pas d’un vidage généré — `hello-ok.features.methods` est une liste de découverte
prudente construite à partir de `src/gateway/server-methods-list.ts` plus les exports de méthodes
de plugins/canaux chargés. Traitez-la comme une découverte de fonctionnalités, et non comme une
énumération complète de `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Système et identité">
    - `health` renvoie l’instantané de santé du Gateway mis en cache ou fraîchement sondé.
    - `diagnostics.stability` renvoie l’enregistreur de stabilité de diagnostic borné récent. Il conserve des métadonnées opérationnelles telles que les noms d’événements, les décomptes, les tailles en octets, les relevés mémoire, l’état de file d’attente/session, les noms de canaux/plugins et les identifiants de session. Il ne conserve pas le texte de chat, les corps de webhooks, les sorties d’outils, les corps bruts de requête ou de réponse, les jetons, les cookies ni les valeurs secrètes. La portée de lecture opérateur est requise.
    - `status` renvoie le résumé du Gateway de style `/status` ; les champs sensibles ne sont inclus que pour les clients opérateurs ayant une portée d’administration.
    - `gateway.identity.get` renvoie l’identité d’appareil du Gateway utilisée par les flux de relais et d’appairage.
    - `system-presence` renvoie l’instantané de présence actuel pour les appareils opérateur/Node connectés.
    - `system-event` ajoute un événement système et peut mettre à jour/diffuser le contexte de présence.
    - `last-heartbeat` renvoie le dernier événement Heartbeat persistant.
    - `set-heartbeats` active ou désactive le traitement Heartbeat sur le Gateway.

  </Accordion>

  <Accordion title="Modèles et utilisation">
    - `models.list` renvoie le catalogue de modèles autorisés à l’exécution. Passez `{ "view": "configured" }` pour les modèles configurés de taille adaptée au sélecteur (`agents.defaults.models` d’abord, puis `models.providers.*.models`), ou `{ "view": "all" }` pour le catalogue complet.
    - `usage.status` renvoie les fenêtres d’utilisation des fournisseurs et les résumés de quota restant.
    - `usage.cost` renvoie des résumés agrégés des coûts d’utilisation pour une plage de dates.
    - `doctor.memory.status` renvoie l’état de préparation de la mémoire vectorielle et des embeddings mis en cache pour l’espace de travail de l’agent par défaut actif. Passez `{ "probe": true }` ou `{ "deep": true }` uniquement lorsque l’appelant veut explicitement un ping en direct du fournisseur d’embeddings.
    - `doctor.memory.remHarness` renvoie un aperçu limité et en lecture seule du harnais REM pour les clients distants du plan de contrôle. Il peut inclure des chemins d’espace de travail, des extraits de mémoire, du Markdown ancré rendu et des candidats à la promotion profonde ; les appelants ont donc besoin de `operator.read`.
    - `sessions.usage` renvoie des résumés d’utilisation par session.
    - `sessions.usage.timeseries` renvoie l’utilisation sous forme de série temporelle pour une session.
    - `sessions.usage.logs` renvoie les entrées du journal d’utilisation pour une session.

  </Accordion>

  <Accordion title="Canaux et assistants de connexion">
    - `channels.status` renvoie des résumés d’état pour les canaux et plugins intégrés + fournis.
    - `channels.logout` déconnecte un canal/compte spécifique lorsque le canal prend en charge la déconnexion.
    - `web.login.start` démarre un flux de connexion QR/web pour le fournisseur de canal web actuel compatible QR.
    - `web.login.wait` attend la fin de ce flux de connexion QR/web et démarre le canal en cas de réussite.
    - `push.test` envoie une notification push APNs de test à un nœud iOS enregistré.
    - `voicewake.get` renvoie les déclencheurs de mots de réveil stockés.
    - `voicewake.set` met à jour les déclencheurs de mots de réveil et diffuse le changement.

  </Accordion>

  <Accordion title="Messagerie et journaux">
    - `send` est le RPC de livraison sortante directe pour les envois ciblant un canal/compte/fil en dehors de l’exécuteur de chat.
    - `logs.tail` renvoie la fin configurée du journal fichier du Gateway avec des contrôles de curseur/limite et d’octets maximum.

  </Accordion>

  <Accordion title="Talk et TTS">
    - `talk.config` renvoie la charge utile de configuration Talk effective ; `includeSecrets` nécessite `operator.talk.secrets` (ou `operator.admin`).
    - `talk.mode` définit/diffuse l’état du mode Talk actuel pour les clients WebChat/Control UI.
    - `talk.speak` synthétise la parole via le fournisseur vocal Talk actif.
    - `tts.status` renvoie l’état d’activation de TTS, le fournisseur actif, les fournisseurs de secours et l’état de configuration du fournisseur.
    - `tts.providers` renvoie l’inventaire visible des fournisseurs TTS.
    - `tts.enable` et `tts.disable` activent ou désactivent l’état des préférences TTS.
    - `tts.setProvider` met à jour le fournisseur TTS préféré.
    - `tts.convert` exécute une conversion ponctuelle de texte en parole.

  </Accordion>

  <Accordion title="Secrets, configuration, mise à jour et assistant">
    - `secrets.reload` résout à nouveau les SecretRefs actifs et remplace l’état des secrets d’exécution uniquement en cas de réussite complète.
    - `secrets.resolve` résout les affectations de secrets ciblées par commande pour un ensemble commande/cible spécifique.
    - `config.get` renvoie l’instantané et le hash de la configuration actuelle.
    - `config.set` écrit une charge utile de configuration validée.
    - `config.patch` fusionne une mise à jour partielle de configuration.
    - `config.apply` valide + remplace la charge utile de configuration complète.
    - `config.schema` renvoie la charge utile du schéma de configuration en direct utilisée par Control UI et l’outillage CLI : schéma, `uiHints`, version et métadonnées de génération, y compris les métadonnées de schéma des plugins + canaux lorsque l’exécution peut les charger. Le schéma inclut les métadonnées de champ `title` / `description` dérivées des mêmes libellés et textes d’aide que ceux utilisés par l’UI, y compris les objets imbriqués, les jokers, les éléments de tableau et les branches de composition `anyOf` / `oneOf` / `allOf` lorsqu’une documentation de champ correspondante existe.
    - `config.schema.lookup` renvoie une charge utile de recherche limitée à un chemin pour un chemin de configuration : chemin normalisé, nœud de schéma superficiel, indication correspondante + `hintPath`, et résumés des enfants immédiats pour l’exploration UI/CLI. Les nœuds de schéma de recherche conservent la documentation destinée à l’utilisateur et les champs de validation courants (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, limites numériques/chaînes/tableaux/objets, et indicateurs comme `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Les résumés d’enfants exposent `key`, `path` normalisé, `type`, `required`, `hasChildren`, ainsi que le `hint` / `hintPath` correspondant.
    - `update.run` exécute le flux de mise à jour du Gateway et planifie un redémarrage uniquement lorsque la mise à jour elle-même a réussi.
    - `update.status` renvoie la dernière sentinelle de redémarrage de mise à jour mise en cache, y compris la version en cours d’exécution après redémarrage lorsqu’elle est disponible.
    - `wizard.start`, `wizard.next`, `wizard.status` et `wizard.cancel` exposent l’assistant d’intégration via WS RPC.

  </Accordion>

  <Accordion title="Assistants d’agent et d’espace de travail">
    - `agents.list` renvoie les entrées d’agent configurées, y compris le modèle effectif et les métadonnées d’exécution.
    - `agents.create`, `agents.update` et `agents.delete` gèrent les enregistrements d’agent et le câblage de l’espace de travail.
    - `agents.files.list`, `agents.files.get` et `agents.files.set` gèrent les fichiers d’espace de travail d’amorçage exposés pour un agent.
    - `agent.identity.get` renvoie l’identité effective de l’assistant pour un agent ou une session.
    - `agent.wait` attend la fin d’une exécution et renvoie l’instantané terminal lorsqu’il est disponible.

  </Accordion>

  <Accordion title="Contrôle des sessions">
    - `sessions.list` renvoie l’index de session actuel, y compris les métadonnées `agentRuntime` par ligne lorsqu’un backend d’exécution d’agent est configuré.
    - `sessions.subscribe` et `sessions.unsubscribe` activent ou désactivent les abonnements aux événements de changement de session pour le client WS actuel.
    - `sessions.messages.subscribe` et `sessions.messages.unsubscribe` activent ou désactivent les abonnements aux événements de transcription/message pour une session.
    - `sessions.preview` renvoie des aperçus limités de transcriptions pour des clés de session spécifiques.
    - `sessions.resolve` résout ou canonise une cible de session.
    - `sessions.create` crée une nouvelle entrée de session.
    - `sessions.send` envoie un message dans une session existante.
    - `sessions.steer` est la variante d’interruption et de pilotage pour une session active.
    - `sessions.abort` annule le travail actif pour une session. Un appelant peut passer `key` avec `runId` facultatif, ou passer uniquement `runId` pour les exécutions actives que le Gateway peut résoudre vers une session.
    - `sessions.patch` met à jour les métadonnées/remplacements de session et indique le modèle canonique résolu ainsi que l’`agentRuntime` effectif.
    - `sessions.reset`, `sessions.delete` et `sessions.compact` effectuent la maintenance de session.
    - `sessions.get` renvoie la ligne de session stockée complète.
    - L’exécution de chat utilise toujours `chat.history`, `chat.send`, `chat.abort` et `chat.inject`. `chat.history` est normalisé pour l’affichage des clients UI : les balises de directive inline sont supprimées du texte visible, les charges utiles XML d’appels d’outils en texte brut (y compris `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` et les blocs d’appels d’outils tronqués) et les jetons de contrôle de modèle ASCII/pleine chasse divulgués sont supprimés, les lignes d’assistant constituées uniquement de jetons silencieux comme exactement `NO_REPLY` / `no_reply` sont omises, et les lignes surdimensionnées peuvent être remplacées par des espaces réservés.

  </Accordion>

  <Accordion title="Appairage d’appareils et jetons d’appareil">
    - `device.pair.list` renvoie les appareils appairés en attente et approuvés.
    - `device.pair.approve`, `device.pair.reject` et `device.pair.remove` gèrent les enregistrements d’appairage d’appareils.
    - `device.token.rotate` renouvelle un jeton d’appareil appairé dans les limites de son rôle approuvé et de la portée de l’appelant.
    - `device.token.revoke` révoque un jeton d’appareil appairé dans les limites de son rôle approuvé et de la portée de l’appelant.

  </Accordion>

  <Accordion title="Appairage de nœuds, invocation et travail en attente">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` et `node.pair.verify` couvrent l’appairage de nœuds et la vérification d’amorçage.
    - `node.list` et `node.describe` renvoient l’état des nœuds connus/connectés.
    - `node.rename` met à jour le libellé d’un nœud appairé.
    - `node.invoke` transmet une commande à un nœud connecté.
    - `node.invoke.result` renvoie le résultat d’une requête d’invocation.
    - `node.event` renvoie les événements provenant des nœuds vers le gateway.
    - `node.canvas.capability.refresh` actualise les jetons de capacité canvas limités à leur portée.
    - `node.pending.pull` et `node.pending.ack` sont les API de file d’attente des nœuds connectés.
    - `node.pending.enqueue` et `node.pending.drain` gèrent le travail durable en attente pour les nœuds hors ligne/déconnectés.

  </Accordion>

  <Accordion title="Familles d’approbation">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` et `exec.approval.resolve` couvrent les requêtes ponctuelles d’approbation d’exécution ainsi que la recherche/relecture des approbations en attente.
    - `exec.approval.waitDecision` attend une approbation d’exécution en attente et renvoie la décision finale (ou `null` en cas d’expiration).
    - `exec.approvals.get` et `exec.approvals.set` gèrent les instantanés de politique d’approbation d’exécution du gateway.
    - `exec.approvals.node.get` et `exec.approvals.node.set` gèrent la politique d’approbation d’exécution locale au nœud via les commandes de relais de nœud.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` et `plugin.approval.resolve` couvrent les flux d’approbation définis par les plugins.

  </Accordion>

  <Accordion title="Automatisation, Skills et outils">
    - Automatisation : `wake` planifie une injection de texte de réveil immédiate ou au prochain Heartbeat ; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gèrent le travail planifié.
    - Skills et outils : `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.

  </Accordion>
</AccordionGroup>

### Familles d’événements courantes

- `chat` : mises à jour de chat UI comme `chat.inject` et autres événements
  de chat limités à la transcription.
- `session.message` et `session.tool` : mises à jour de transcription/flux d’événements pour une
  session abonnée.
- `sessions.changed` : index de session ou métadonnées modifiés.
- `presence` : mises à jour de l’instantané de présence système.
- `tick` : événement périodique de maintien de connexion / vivacité.
- `health` : mise à jour de l’instantané de santé du gateway.
- `heartbeat` : mise à jour du flux d’événements Heartbeat.
- `cron` : événement de changement d’exécution/tâche Cron.
- `shutdown` : notification d’arrêt du gateway.
- `node.pair.requested` / `node.pair.resolved` : cycle de vie de l’appairage de nœuds.
- `node.invoke.request` : diffusion de requête d’invocation de nœud.
- `device.pair.requested` / `device.pair.resolved` : cycle de vie des appareils appairés.
- `voicewake.changed` : configuration des déclencheurs de mots de réveil modifiée.
- `exec.approval.requested` / `exec.approval.resolved` : cycle de vie des approbations d’exécution.
- `plugin.approval.requested` / `plugin.approval.resolved` : cycle de vie des approbations de plugin.

### Méthodes d’aide pour les nœuds

- Les nœuds peuvent appeler `skills.bins` pour récupérer la liste actuelle des exécutables Skills
  pour les vérifications d’autorisation automatique.

### Méthodes d’aide pour les opérateurs

- Les opérateurs peuvent appeler `commands.list` (`operator.read`) pour récupérer l’inventaire des commandes d’exécution d’un agent.
  - `agentId` est facultatif ; omettez-le pour lire l’espace de travail de l’agent par défaut.
  - `scope` contrôle la surface ciblée par le `name` principal :
    - `text` renvoie le jeton de commande textuelle principal sans le `/` initial
    - `native` et le chemin par défaut `both` renvoient les noms natifs adaptés au fournisseur lorsqu’ils sont disponibles
  - `textAliases` contient les alias slash exacts tels que `/model` et `/m`.
  - `nativeName` contient le nom de commande natif adapté au fournisseur lorsqu’il existe.
  - `provider` est facultatif et n’affecte que le nommage natif ainsi que la disponibilité des commandes de Plugin natives.
  - `includeArgs=false` omet les métadonnées d’arguments sérialisées dans la réponse.
- Les opérateurs peuvent appeler `tools.catalog` (`operator.read`) pour récupérer le catalogue d’outils d’exécution d’un agent. La réponse inclut les outils regroupés et les métadonnées de provenance :
  - `source` : `core` ou `plugin`
  - `pluginId` : propriétaire du plugin lorsque `source="plugin"`
  - `optional` : indique si un outil de plugin est facultatif
- Les opérateurs peuvent appeler `tools.effective` (`operator.read`) pour récupérer l’inventaire des outils effectifs à l’exécution pour une session.
  - `sessionKey` est requis.
  - Le Gateway déduit le contexte d’exécution de confiance côté serveur à partir de la session, au lieu d’accepter un contexte d’authentification ou de livraison fourni par l’appelant.
  - La réponse est limitée à la session et reflète ce que la conversation active peut utiliser immédiatement, y compris les outils du cœur, des plugins et des canaux.
- Les opérateurs peuvent appeler `skills.status` (`operator.read`) pour récupérer l’inventaire visible des Skills d’un agent.
  - `agentId` est facultatif ; omettez-le pour lire l’espace de travail de l’agent par défaut.
  - La réponse inclut l’éligibilité, les exigences manquantes, les vérifications de configuration et les options d’installation assainies, sans exposer les valeurs secrètes brutes.
- Les opérateurs peuvent appeler `skills.search` et `skills.detail` (`operator.read`) pour les métadonnées de découverte ClawHub.
- Les opérateurs peuvent appeler `skills.install` (`operator.admin`) selon deux modes :
  - Mode ClawHub : `{ source: "clawhub", slug, version?, force? }` installe un dossier de skill dans le répertoire `skills/` de l’espace de travail de l’agent par défaut.
  - Mode installateur Gateway : `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` exécute une action `metadata.openclaw.install` déclarée sur l’hôte du Gateway.
- Les opérateurs peuvent appeler `skills.update` (`operator.admin`) selon deux modes :
  - Le mode ClawHub met à jour un slug suivi ou toutes les installations ClawHub suivies dans l’espace de travail de l’agent par défaut.
  - Le mode configuration corrige les valeurs `skills.entries.<skillKey>` telles que `enabled`, `apiKey` et `env`.

### Vues `models.list`

`models.list` accepte un paramètre `view` facultatif :

- Omis ou `"default"` : comportement d’exécution actuel. Si `agents.defaults.models` est configuré, la réponse est le catalogue autorisé ; sinon, la réponse est le catalogue Gateway complet.
- `"configured"` : comportement dimensionné pour un sélecteur. Si `agents.defaults.models` est configuré, il reste prioritaire. Sinon, la réponse utilise les entrées explicites `models.providers.*.models`, avec repli vers le catalogue complet uniquement lorsqu’aucune ligne de modèle configurée n’existe.
- `"all"` : catalogue Gateway complet, en contournant `agents.defaults.models`. Utilisez ceci pour les diagnostics et les interfaces de découverte, pas pour les sélecteurs de modèles normaux.

## Approbations d’exécution

- Lorsqu’une requête d’exécution nécessite une approbation, le gateway diffuse `exec.approval.requested`.
- Les clients opérateurs résolvent la demande en appelant `exec.approval.resolve` (nécessite la portée `operator.approvals`).
- Pour `host=node`, `exec.approval.request` doit inclure `systemRunPlan` (`argv`/`cwd`/`rawCommand` canoniques/métadonnées de session). Les requêtes sans `systemRunPlan` sont rejetées.
- Après approbation, les appels transférés `node.invoke system.run` réutilisent ce `systemRunPlan` canonique comme contexte de commande/cwd/session faisant autorité.
- Si un appelant modifie `command`, `rawCommand`, `cwd`, `agentId` ou `sessionKey` entre la préparation et le transfert final approuvé de `system.run`, le gateway rejette l’exécution au lieu de faire confiance à la charge utile modifiée.

## Repli de livraison de l’agent

- Les requêtes `agent` peuvent inclure `deliver=true` pour demander une livraison sortante.
- `bestEffortDeliver=false` conserve le comportement strict : les cibles de livraison non résolues ou internes uniquement renvoient `INVALID_REQUEST`.
- `bestEffortDeliver=true` autorise le repli vers une exécution limitée à la session lorsqu’aucune route livrable externe ne peut être résolue (par exemple les sessions internes/webchat ou les configurations multicanaux ambiguës).

## Versionnement

- `PROTOCOL_VERSION` se trouve dans `src/gateway/protocol/schema/protocol-schemas.ts`.
- Les clients envoient `minProtocol` + `maxProtocol` ; le serveur rejette les incompatibilités.
- Les schémas + modèles sont générés à partir des définitions TypeBox :
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes client

Le client de référence dans `src/gateway/client.ts` utilise ces valeurs par défaut. Les valeurs sont stables sur le protocole v3 et constituent la base attendue pour les clients tiers.

| Constante                                 | Valeur par défaut                                    | Source                                                                                     |
| ----------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                  | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Délai d’expiration des requêtes (par RPC) | `30_000` ms                                          | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Délai d’expiration préauth / défi de connexion | `15_000` ms                                     | `src/gateway/handshake-timeouts.ts` (config/env peut augmenter le budget serveur/client apparié) |
| Délai initial de reconnexion              | `1_000` ms                                           | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Délai maximal de reconnexion              | `30_000` ms                                          | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Plafond de nouvelle tentative rapide après fermeture par jeton d’appareil | `250` ms              | `src/gateway/client.ts`                                                                    |
| Délai de grâce de l’arrêt forcé avant `terminate()` | `250` ms                                      | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Délai d’expiration par défaut de `stopAndWait()` | `1_000` ms                                    | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Intervalle de tick par défaut (avant `hello-ok`) | `30_000` ms                                    | `src/gateway/client.ts`                                                                    |
| Fermeture sur délai d’expiration de tick  | code `4000` lorsque le silence dépasse `tickIntervalMs * 2` | `src/gateway/client.ts`                                                             |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                           | `src/gateway/server-constants.ts`                                                          |

Le serveur annonce les valeurs effectives `policy.tickIntervalMs`, `policy.maxPayload` et `policy.maxBufferedBytes` dans `hello-ok` ; les clients doivent respecter ces valeurs plutôt que les valeurs par défaut d’avant la poignée de main.

## Authentification

- L’authentification Gateway par secret partagé utilise `connect.params.auth.token` ou `connect.params.auth.password`, selon le mode d’authentification configuré.
- Les modes portant une identité tels que Tailscale Serve (`gateway.auth.allowTailscale: true`) ou `gateway.auth.mode: "trusted-proxy"` hors local loopback satisfont la vérification d’authentification de connexion à partir des en-têtes de requête au lieu de `connect.params.auth.*`.
- `gateway.auth.mode: "none"` en ingress privé ignore entièrement l’authentification de connexion par secret partagé ; n’exposez pas ce mode sur un ingress public/non fiable.
- Après l’appariement, le Gateway émet un **jeton d’appareil** limité au rôle + aux portées de la connexion. Il est renvoyé dans `hello-ok.auth.deviceToken` et doit être persisté par le client pour les connexions futures.
- Les clients doivent persister le `hello-ok.auth.deviceToken` principal après toute connexion réussie.
- La reconnexion avec ce jeton d’appareil **stocké** doit également réutiliser l’ensemble de portées approuvé stocké pour ce jeton. Cela préserve l’accès lecture/sonde/état déjà accordé et évite que les reconnexions se réduisent silencieusement à une portée implicite réservée à l’administration plus étroite.
- Assemblage de l’authentification de connexion côté client (`selectConnectAuth` dans `src/gateway/client.ts`) :
  - `auth.password` est orthogonal et est toujours transféré lorsqu’il est défini.
  - `auth.token` est renseigné par ordre de priorité : d’abord le jeton partagé explicite, puis un `deviceToken` explicite, puis un jeton par appareil stocké (indexé par `deviceId` + `role`).
  - `auth.bootstrapToken` est envoyé uniquement lorsqu’aucun des éléments ci-dessus n’a résolu un `auth.token`. Un jeton partagé ou tout jeton d’appareil résolu le supprime.
  - La promotion automatique d’un jeton d’appareil stocké lors de la nouvelle tentative ponctuelle `AUTH_TOKEN_MISMATCH` est limitée aux **points de terminaison de confiance uniquement** — local loopback, ou `wss://` avec un `tlsFingerprint` épinglé. `wss://` public sans épinglage n’est pas admissible.
- Les entrées supplémentaires `hello-ok.auth.deviceTokens` sont des jetons de transfert bootstrap. Persistez-les uniquement lorsque la connexion a utilisé une authentification bootstrap sur un transport de confiance tel que `wss://` ou un appariement local loopback/local.
- Si un client fournit un `deviceToken` **explicite** ou des `scopes` explicites, cet ensemble de portées demandé par l’appelant reste faisant autorité ; les portées mises en cache ne sont réutilisées que lorsque le client réutilise le jeton par appareil stocké.
- Les jetons d’appareil peuvent être renouvelés/révoqués via `device.token.rotate` et `device.token.revoke` (nécessite la portée `operator.pairing`).
- `device.token.rotate` renvoie les métadonnées de rotation. Il renvoie en écho le jeton bearer de remplacement uniquement pour les appels du même appareil déjà authentifiés avec ce jeton d’appareil, afin que les clients à jeton seul puissent persister leur remplacement avant de se reconnecter. Les rotations partagées/admin ne renvoient pas le jeton bearer en écho.
- L’émission, la rotation et la révocation des jetons restent limitées à l’ensemble de rôles approuvé enregistré dans l’entrée d’appariement de cet appareil ; la mutation de jeton ne peut pas étendre ou cibler un rôle d’appareil que l’approbation d’appariement n’a jamais accordé.
- Pour les sessions de jeton d’appareil apparié, la gestion des appareils est limitée à soi-même, sauf si l’appelant possède aussi `operator.admin` : les appelants non admin peuvent supprimer/révoquer/faire tourner uniquement leur **propre** entrée d’appareil.
- `device.token.rotate` et `device.token.revoke` vérifient aussi l’ensemble de portées du jeton opérateur cible par rapport aux portées de session actuelles de l’appelant. Les appelants non admin ne peuvent pas faire tourner ni révoquer un jeton opérateur plus large que celui qu’ils détiennent déjà.
- Les échecs d’authentification incluent `error.details.code` ainsi que des indications de récupération :
  - `error.details.canRetryWithDeviceToken` (booléen)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportement client pour `AUTH_TOKEN_MISMATCH` :
  - Les clients de confiance peuvent tenter une nouvelle tentative bornée avec un jeton par appareil mis en cache.
  - Si cette nouvelle tentative échoue, les clients doivent arrêter les boucles de reconnexion automatique et afficher des indications d’action pour l’opérateur.

## Identité de l’appareil + appariement

- Les Nodes doivent inclure une identité d’appareil stable (`device.id`) dérivée d’une
  empreinte de paire de clés.
- Les Gateways émettent des jetons par appareil + rôle.
- Les approbations d’appairage sont requises pour les nouveaux ID d’appareil, sauf si l’approbation automatique locale
  est activée.
- L’approbation automatique de l’appairage est centrée sur les connexions directes via local loopback.
- OpenClaw dispose également d’un chemin étroit d’auto-connexion backend/locale au conteneur pour
  les flux d’assistants fiables à secret partagé.
- Les connexions tailnet ou LAN sur le même hôte sont toujours traitées comme distantes pour l’appairage et
  nécessitent une approbation.
- Les clients WS incluent normalement l’identité `device` pendant `connect` (opérateur +
  node). Les seules exceptions d’opérateur sans appareil sont les chemins de confiance explicites :
  - `gateway.controlUi.allowInsecureAuth=true` pour la compatibilité HTTP non sécurisée limitée à localhost.
  - authentification Control UI opérateur réussie avec `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (procédure d’urgence, dégradation de sécurité sévère).
  - RPC backend `gateway-client` en direct-loopback authentifiés avec le jeton/mot de passe
    partagé du Gateway.
- Toutes les connexions doivent signer le nonce `connect.challenge` fourni par le serveur.

### Diagnostics de migration de l’authentification des appareils

Pour les clients hérités qui utilisent encore le comportement de signature antérieur au défi, `connect` renvoie désormais
des codes de détail `DEVICE_AUTH_*` sous `error.details.code` avec un `error.details.reason` stable.

Échecs de migration courants :

| Message                     | details.code                     | details.reason           | Signification                                      |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Le client a omis `device.nonce` (ou l’a envoyé vide). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Le client a signé avec un nonce obsolète/incorrect. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | La charge utile de signature ne correspond pas à la charge utile v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | L’horodatage signé est hors de la dérive autorisée. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` ne correspond pas à l’empreinte de clé publique. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Le format/la canonicalisation de la clé publique a échoué. |

Cible de migration :

- Toujours attendre `connect.challenge`.
- Signer la charge utile v2 qui inclut le nonce du serveur.
- Envoyer le même nonce dans `connect.params.device.nonce`.
- La charge utile de signature préférée est `v3`, qui lie `platform` et `deviceFamily`
  en plus des champs device/client/role/scopes/token/nonce.
- Les signatures héritées `v2` restent acceptées pour compatibilité, mais l’épinglage
  des métadonnées d’appareil appairé contrôle toujours la politique de commande à la reconnexion.

## TLS + épinglage

- TLS est pris en charge pour les connexions WS.
- Les clients peuvent éventuellement épingler l’empreinte du certificat du Gateway (voir la configuration `gateway.tls`
  ainsi que `gateway.remote.tlsFingerprint` ou le CLI `--tls-fingerprint`).

## Portée

Ce protocole expose l’**API complète du Gateway** (statut, canaux, modèles, chat,
agent, sessions, nodes, approbations, etc.). La surface exacte est définie par les
schémas TypeBox dans `src/gateway/protocol/schema.ts`.

## Associés

- [Protocole de bridge](/fr/gateway/bridge-protocol)
- [Runbook du Gateway](/fr/gateway)
