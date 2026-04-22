---
read_when:
    - Implémenter ou mettre à jour des clients WS gateway
    - Déboguer les incompatibilités de protocole ou les échecs de connexion
    - Régénérer le schéma/les modèles du protocole
summary: 'Protocole WebSocket de Gateway : poignée de main, trames, gestion des versions'
title: Protocole Gateway
x-i18n:
    generated_at: "2026-04-22T04:22:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6efa76f5f0faa6c10a8515b0cf457233e48551e3484a605dffaf6459ddff9231
    source_path: gateway/protocol.md
    workflow: 15
---

# Protocole Gateway (WebSocket)

Le protocole WS de Gateway est le **plan de contrôle unique + transport de nœud** pour
OpenClaw. Tous les clients (CLI, interface web, application macOS, nœuds
iOS/Android, nœuds sans interface) se connectent via WebSocket et déclarent leur **rôle** + **portée**
au moment de la poignée de main.

## Transport

- WebSocket, trames texte avec charges utiles JSON.
- La première trame **doit** être une requête `connect`.

## Poignée de main (connect)

Gateway → Client (défi de pré-connexion) :

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
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

`server`, `features`, `snapshot` et `policy` sont tous requis par le schéma
(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl` est facultatif. `auth`
rapporte le rôle/les scopes négociés lorsqu’ils sont disponibles, et inclut `deviceToken`
lorsque la gateway en émet un.

Lorsqu’aucun jeton d’appareil n’est émis, `hello-ok.auth` peut quand même rapporter les
autorisations négociées :

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

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

Lors du transfert d’amorçage approuvé, `hello-ok.auth` peut aussi inclure des
entrées de rôle supplémentaires bornées dans `deviceTokens` :

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

Pour le flux intégré d’amorçage nœud/opérateur, le jeton principal du nœud reste
`scopes: []` et tout jeton opérateur transmis reste borné à la liste d’autorisation
de l’opérateur d’amorçage (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Les vérifications de scope d’amorçage restent
préfixées par rôle : les entrées opérateur ne satisfont que les requêtes opérateur, et les rôles
non opérateur ont toujours besoin de scopes sous leur propre préfixe de rôle.

### Exemple de nœud

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

Les méthodes avec effets de bord nécessitent des **clés d’idempotence** (voir le schéma).

## Rôles + scopes

### Rôles

- `operator` = client du plan de contrôle (CLI/UI/automatisation).
- `node` = hôte de capacités (camera/screen/canvas/system.run).

### Scopes (operator)

Scopes courants :

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` avec `includeSecrets: true` requiert `operator.talk.secrets`
(ou `operator.admin`).

Les méthodes RPC Gateway enregistrées par des Plugin peuvent demander leur propre scope operator, mais
les préfixes d’administration réservés du cœur (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) se résolvent toujours en `operator.admin`.

Le scope de méthode n’est que le premier contrôle. Certaines commandes slash atteintes via
`chat.send` appliquent en plus des vérifications plus strictes au niveau de la commande. Par exemple, les écritures
persistantes `/config set` et `/config unset` requièrent `operator.admin`.

`node.pair.approve` a aussi une vérification de scope supplémentaire au moment de l’approbation, au-dessus du
scope de méthode de base :

- requêtes sans commande : `operator.pairing`
- requêtes avec commandes de nœud hors exec : `operator.pairing` + `operator.write`
- requêtes qui incluent `system.run`, `system.run.prepare` ou `system.which` :
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Les nœuds déclarent des revendications de capacité au moment de la connexion :

- `caps` : catégories de capacités de haut niveau.
- `commands` : liste d’autorisation de commandes pour l’invocation.
- `permissions` : bascules granulaires (par exemple `screen.record`, `camera.capture`).

La Gateway traite ces éléments comme des **revendications** et applique des listes d’autorisation côté serveur.

## Présence

- `system-presence` renvoie des entrées indexées par identité d’appareil.
- Les entrées de présence incluent `deviceId`, `roles` et `scopes` afin que les UI puissent afficher une seule ligne par appareil
  même lorsqu’il se connecte à la fois comme **operator** et comme **node**.

## Portée des événements de diffusion

Les événements de diffusion WebSocket poussés par le serveur sont contrôlés par scope afin que les sessions limitées à l’appairage ou réservées aux nœuds ne reçoivent pas passivement le contenu des sessions.

- Les **trames de chat, d’agent et de résultat d’outil** (y compris les événements `agent` diffusés en flux et les résultats d’appel d’outil) requièrent au minimum `operator.read`. Les sessions sans `operator.read` ignorent entièrement ces trames.
- Les **diffusions `plugin.*` définies par les Plugin** sont contrôlées par `operator.write` ou `operator.admin`, selon la façon dont le Plugin les a enregistrées.
- Les **événements d’état et de transport** (`heartbeat`, `presence`, `tick`, cycle de vie de connexion/déconnexion, etc.) restent non restreints afin que la santé du transport reste observable pour chaque session authentifiée.
- Les **familles d’événements de diffusion inconnues** sont contrôlées par scope par défaut (échec fermé), sauf si un gestionnaire enregistré les assouplit explicitement.

Chaque connexion client conserve son propre numéro de séquence par client afin que les diffusions préservent un ordre monotone sur cette socket même lorsque différents clients voient des sous-ensembles différents du flux d’événements filtrés par scope.

## Familles de méthodes RPC courantes

Cette page n’est pas une exportation générée complète, mais la surface WS publique est plus large
que les exemples de poignée de main/authentification ci-dessus. Voici les principales familles de méthodes que la
Gateway expose aujourd’hui.

`hello-ok.features.methods` est une liste de découverte conservative construite à partir de
`src/gateway/server-methods-list.ts` plus les exportations de méthodes Plugin/canal chargées.
Traitez-la comme une découverte de fonctionnalités, et non comme une exportation générée de chaque assistant appelable
implémenté dans `src/gateway/server-methods/*.ts`.

### Système et identité

- `health` renvoie l’instantané de santé de la gateway, mis en cache ou fraîchement sondé.
- `status` renvoie le résumé de type `/status` de la gateway ; les champs sensibles sont
  inclus uniquement pour les clients operator à scope admin.
- `gateway.identity.get` renvoie l’identité d’appareil de la gateway utilisée par les flux de relais et
  d’appairage.
- `system-presence` renvoie l’instantané de présence actuel pour les appareils operator/node connectés.
- `system-event` ajoute un événement système et peut mettre à jour/diffuser le
  contexte de présence.
- `last-heartbeat` renvoie le dernier événement Heartbeat persisté.
- `set-heartbeats` active ou désactive le traitement Heartbeat sur la gateway.

### Modèles et utilisation

- `models.list` renvoie le catalogue de modèles autorisés à l’exécution.
- `usage.status` renvoie les fenêtres d’utilisation fournisseur / résumés de quota restant.
- `usage.cost` renvoie des résumés agrégés de coût d’utilisation pour une plage de dates.
- `doctor.memory.status` renvoie l’état de préparation de la mémoire vectorielle / des embeddings pour l’espace de travail
  de l’agent par défaut actif.
- `sessions.usage` renvoie des résumés d’utilisation par session.
- `sessions.usage.timeseries` renvoie une série temporelle d’utilisation pour une session.
- `sessions.usage.logs` renvoie les entrées de journal d’utilisation pour une session.

### Canaux et assistants de connexion

- `channels.status` renvoie les résumés d’état des canaux/Plugin intégrés + fournis.
- `channels.logout` déconnecte un canal/compte spécifique lorsque le canal
  prend en charge la déconnexion.
- `web.login.start` démarre un flux de connexion QR/web pour le fournisseur de canal web
  actuel compatible QR.
- `web.login.wait` attend que ce flux de connexion QR/web se termine et démarre le
  canal en cas de réussite.
- `push.test` envoie une notification push APNs de test à un nœud iOS enregistré.
- `voicewake.get` renvoie les déclencheurs de mot d’activation enregistrés.
- `voicewake.set` met à jour les déclencheurs de mot d’activation et diffuse la modification.

### Messagerie et journaux

- `send` est la RPC de livraison sortante directe pour les envois
  ciblés par canal/compte/fil en dehors du moteur de chat.
- `logs.tail` renvoie la fin configurée du journal de fichiers de la gateway avec curseur/limite et
  contrôles du nombre maximal d’octets.

### Talk et TTS

- `talk.config` renvoie la charge utile de configuration Talk effective ; `includeSecrets`
  requiert `operator.talk.secrets` (ou `operator.admin`).
- `talk.mode` définit/diffuse l’état actuel du mode Talk pour les clients
  WebChat/Control UI.
- `talk.speak` synthétise la parole via le fournisseur de parole Talk actif.
- `tts.status` renvoie l’état d’activation TTS, le fournisseur actif, les fournisseurs de repli,
  et l’état de configuration du fournisseur.
- `tts.providers` renvoie l’inventaire visible des fournisseurs TTS.
- `tts.enable` et `tts.disable` activent ou désactivent l’état des préférences TTS.
- `tts.setProvider` met à jour le fournisseur TTS préféré.
- `tts.convert` exécute une conversion texte-parole ponctuelle.

### Secrets, config, mise à jour et assistant

- `secrets.reload` re-résout les SecretRef actifs et échange l’état des secrets à l’exécution
  uniquement en cas de succès complet.
- `secrets.resolve` résout les affectations de secrets ciblées par commande pour un
  ensemble spécifique commande/cible.
- `config.get` renvoie l’instantané de configuration actuel et son hash.
- `config.set` écrit une charge utile de configuration validée.
- `config.patch` fusionne une mise à jour partielle de configuration.
- `config.apply` valide puis remplace la charge utile de configuration complète.
- `config.schema` renvoie la charge utile du schéma de configuration en direct utilisée par Control UI et
  l’outillage CLI : schéma, `uiHints`, version et métadonnées de génération, y compris
  les métadonnées de schéma Plugin + canal lorsque l’exécution peut les charger. Le schéma
  inclut les métadonnées de champ `title` / `description` dérivées des mêmes libellés
  et textes d’aide utilisés par l’UI, y compris pour les objets imbriqués, jokers, éléments
  de tableau et branches de composition `anyOf` / `oneOf` / `allOf` lorsque la
  documentation de champ correspondante existe.
- `config.schema.lookup` renvoie une charge utile de recherche limitée à un chemin pour un chemin de config :
  chemin normalisé, nœud de schéma superficiel, indice correspondant + `hintPath`, et
  résumés des enfants immédiats pour l’exploration UI/CLI.
  - Les nœuds de schéma de recherche conservent la documentation orientée utilisateur et les champs de validation courants :
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    bornes numériques/chaînes/tableaux/objets, et indicateurs booléens tels que
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - Les résumés d’enfants exposent `key`, le `path` normalisé, `type`, `required`,
    `hasChildren`, ainsi que le `hint` / `hintPath` correspondant.
- `update.run` exécute le flux de mise à jour de la gateway et planifie un redémarrage uniquement lorsque
  la mise à jour elle-même a réussi.
- `wizard.start`, `wizard.next`, `wizard.status` et `wizard.cancel` exposent l’assistant
  d’intégration via WS RPC.

### Familles majeures existantes

#### Assistants d’agent et d’espace de travail

- `agents.list` renvoie les entrées d’agent configurées.
- `agents.create`, `agents.update` et `agents.delete` gèrent les enregistrements d’agent et
  le raccordement de l’espace de travail.
- `agents.files.list`, `agents.files.get` et `agents.files.set` gèrent les
  fichiers d’espace de travail d’amorçage exposés pour un agent.
- `agent.identity.get` renvoie l’identité effective de l’assistant pour un agent ou une
  session.
- `agent.wait` attend qu’une exécution se termine et renvoie l’instantané terminal lorsque
  disponible.

#### Contrôle de session

- `sessions.list` renvoie l’index actuel des sessions.
- `sessions.subscribe` et `sessions.unsubscribe` activent ou désactivent les abonnements
  aux événements de changement de session pour le client WS actuel.
- `sessions.messages.subscribe` et `sessions.messages.unsubscribe` activent ou désactivent
  les abonnements aux événements de transcription/message pour une session.
- `sessions.preview` renvoie des aperçus bornés de transcription pour des clés de session
  spécifiques.
- `sessions.resolve` résout ou canonise une cible de session.
- `sessions.create` crée une nouvelle entrée de session.
- `sessions.send` envoie un message dans une session existante.
- `sessions.steer` est la variante d’interruption et de pilotage pour une session active.
- `sessions.abort` interrompt le travail actif d’une session.
- `sessions.patch` met à jour les métadonnées/remplacements d’une session.
- `sessions.reset`, `sessions.delete` et `sessions.compact` effectuent la
  maintenance de session.
- `sessions.get` renvoie la ligne complète de session stockée.
- L’exécution de chat utilise toujours `chat.history`, `chat.send`, `chat.abort` et
  `chat.inject`.
- `chat.history` est normalisé pour l’affichage pour les clients UI : les balises de directive inline sont
  supprimées du texte visible, les charges utiles XML d’appel d’outil en texte brut (y compris
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, et
  les blocs d’appel d’outil tronqués) ainsi que les jetons de contrôle de modèle ASCII/pleine largeur divulgués
  sont supprimés, les lignes d’assistant constituées uniquement de jetons silencieux telles que `NO_REPLY` /
  `no_reply` exact sont omises, et les lignes surdimensionnées peuvent être remplacées par des espaces réservés.

#### Appairage d’appareil et jetons d’appareil

- `device.pair.list` renvoie les appareils appairés en attente et approuvés.
- `device.pair.approve`, `device.pair.reject` et `device.pair.remove` gèrent
  les enregistrements d’appairage d’appareil.
- `device.token.rotate` fait pivoter un jeton d’appareil appairé dans les limites de rôle
  et de scope approuvées.
- `device.token.revoke` révoque un jeton d’appareil appairé.

#### Appairage de nœud, invocation et travail en attente

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` et `node.pair.verify` couvrent l’appairage de nœud et la
  vérification d’amorçage.
- `node.list` et `node.describe` renvoient l’état des nœuds connus/connectés.
- `node.rename` met à jour le libellé d’un nœud appairé.
- `node.invoke` transmet une commande à un nœud connecté.
- `node.invoke.result` renvoie le résultat d’une requête d’invocation.
- `node.event` transporte les événements d’origine nœud vers la gateway.
- `node.canvas.capability.refresh` actualise les jetons de capacité canvas à portée limitée.
- `node.pending.pull` et `node.pending.ack` sont les API de file d’attente pour nœud connecté.
- `node.pending.enqueue` et `node.pending.drain` gèrent le travail en attente durable
  pour les nœuds hors ligne/déconnectés.

#### Familles d’approbation

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list` et
  `exec.approval.resolve` couvrent les requêtes ponctuelles d’approbation exec ainsi que la
  recherche/relecture des approbations en attente.
- `exec.approval.waitDecision` attend une approbation exec en attente et renvoie
  la décision finale (ou `null` en cas d’expiration).
- `exec.approvals.get` et `exec.approvals.set` gèrent les instantanés de politique
  d’approbation exec de la gateway.
- `exec.approvals.node.get` et `exec.approvals.node.set` gèrent la politique locale exec
  d’un nœud via des commandes de relais de nœud.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision` et `plugin.approval.resolve` couvrent
  les flux d’approbation définis par des Plugin.

#### Autres familles majeures

- automatisation :
  - `wake` planifie une injection immédiate ou au prochain Heartbeat d’un texte de réveil
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- skills/outils : `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### Familles d’événements courantes

- `chat` : mises à jour de chat UI telles que `chat.inject` et autres
  événements de chat uniquement de transcription.
- `session.message` et `session.tool` : mises à jour de transcription/flux d’événements pour une
  session abonnée.
- `sessions.changed` : l’index de session ou les métadonnées ont changé.
- `presence` : mises à jour de l’instantané de présence système.
- `tick` : événement périodique de maintien en vie / vivacité.
- `health` : mise à jour de l’instantané de santé de la gateway.
- `heartbeat` : mise à jour du flux d’événements Heartbeat.
- `cron` : événement de changement d’exécution/de tâche Cron.
- `shutdown` : notification d’arrêt de la gateway.
- `node.pair.requested` / `node.pair.resolved` : cycle de vie d’appairage de nœud.
- `node.invoke.request` : diffusion de requête d’invocation de nœud.
- `device.pair.requested` / `device.pair.resolved` : cycle de vie d’appareil appairé.
- `voicewake.changed` : la configuration des déclencheurs de mot d’activation a changé.
- `exec.approval.requested` / `exec.approval.resolved` : cycle de vie
  d’approbation exec.
- `plugin.approval.requested` / `plugin.approval.resolved` : cycle de vie
  d’approbation de Plugin.

### Méthodes d’assistance pour nœud

- Les nœuds peuvent appeler `skills.bins` pour récupérer la liste actuelle des exécutables de skill
  pour les vérifications d’autorisation automatique.

### Méthodes d’assistance pour operator

- Les operators peuvent appeler `commands.list` (`operator.read`) pour récupérer l’inventaire
  des commandes à l’exécution pour un agent.
  - `agentId` est facultatif ; omettez-le pour lire l’espace de travail de l’agent par défaut.
  - `scope` contrôle quelle surface la valeur primaire `name` cible :
    - `text` renvoie le jeton de commande texte principal sans le `/` initial
    - `native` et le chemin par défaut `both` renvoient des noms natifs dépendants du fournisseur
      lorsqu’ils sont disponibles
  - `textAliases` transporte les alias slash exacts tels que `/model` et `/m`.
  - `nativeName` transporte le nom de commande native dépendant du fournisseur lorsqu’il existe.
  - `provider` est facultatif et n’affecte que le nommage natif ainsi que la disponibilité des
    commandes natives de Plugin.
  - `includeArgs=false` omet les métadonnées d’arguments sérialisées de la réponse.
- Les operators peuvent appeler `tools.catalog` (`operator.read`) pour récupérer le catalogue d’outils à l’exécution pour un
  agent. La réponse inclut les outils groupés et les métadonnées de provenance :
  - `source` : `core` ou `plugin`
  - `pluginId` : propriétaire du Plugin lorsque `source="plugin"`
  - `optional` : indique si un outil de Plugin est facultatif
- Les operators peuvent appeler `tools.effective` (`operator.read`) pour récupérer l’inventaire d’outils effectif à l’exécution
  pour une session.
  - `sessionKey` est requis.
  - La gateway dérive le contexte d’exécution approuvé depuis la session côté serveur au lieu d’accepter
    un contexte d’authentification ou de livraison fourni par l’appelant.
  - La réponse est limitée à la session et reflète ce que la conversation active peut utiliser à l’instant,
    y compris les outils core, Plugin et canal.
- Les operators peuvent appeler `skills.status` (`operator.read`) pour récupérer l’inventaire visible des
  skills pour un agent.
  - `agentId` est facultatif ; omettez-le pour lire l’espace de travail de l’agent par défaut.
  - La réponse inclut l’éligibilité, les exigences manquantes, les vérifications de configuration et
    des options d’installation assainies sans exposer les valeurs de secret brutes.
- Les operators peuvent appeler `skills.search` et `skills.detail` (`operator.read`) pour les
  métadonnées de découverte ClawHub.
- Les operators peuvent appeler `skills.install` (`operator.admin`) selon deux modes :
  - Mode ClawHub : `{ source: "clawhub", slug, version?, force? }` installe un
    dossier de skill dans le répertoire `skills/` de l’espace de travail de l’agent par défaut.
  - Mode programme d’installation gateway : `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    exécute une action déclarée `metadata.openclaw.install` sur l’hôte gateway.
- Les operators peuvent appeler `skills.update` (`operator.admin`) selon deux modes :
  - Le mode ClawHub met à jour un slug suivi ou toutes les installations ClawHub suivies dans
    l’espace de travail de l’agent par défaut.
  - Le mode config applique un correctif aux valeurs `skills.entries.<skillKey>` telles que `enabled`,
    `apiKey` et `env`.

## Approbations Exec

- Lorsqu’une requête exec nécessite une approbation, la gateway diffuse `exec.approval.requested`.
- Les clients operator résolvent cela en appelant `exec.approval.resolve` (requiert le scope `operator.approvals`).
- Pour `host=node`, `exec.approval.request` doit inclure `systemRunPlan` (`argv`/`cwd`/`rawCommand`/métadonnées de session canoniques). Les requêtes sans `systemRunPlan` sont rejetées.
- Après approbation, les appels transmis `node.invoke system.run` réutilisent ce
  `systemRunPlan` canonique comme contexte faisant autorité pour la commande/le répertoire courant/la session.
- Si un appelant modifie `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` entre `prepare` et le transfert final approuvé `system.run`, la
  gateway rejette l’exécution au lieu de faire confiance à la charge utile modifiée.

## Repli de livraison d’agent

- Les requêtes `agent` peuvent inclure `deliver=true` pour demander une livraison sortante.
- `bestEffortDeliver=false` conserve un comportement strict : les cibles de livraison non résolues ou internes uniquement renvoient `INVALID_REQUEST`.
- `bestEffortDeliver=true` permet un repli vers une exécution limitée à la session lorsqu’aucune route livrable externe ne peut être résolue (par exemple sessions internes/webchat ou configurations multi-canaux ambiguës).

## Gestion des versions

- `PROTOCOL_VERSION` se trouve dans `src/gateway/protocol/schema/protocol-schemas.ts`.
- Les clients envoient `minProtocol` + `maxProtocol` ; le serveur rejette les incompatibilités.
- Les schémas + modèles sont générés à partir des définitions TypeBox :
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes client

Le client de référence dans `src/gateway/client.ts` utilise ces valeurs par défaut. Les valeurs sont
stables sur le protocole v3 et constituent la base attendue pour les clients tiers.

| Constante                                  | Valeur par défaut                                    | Source                                                     |
| ------------------------------------------ | ---------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                         | `3`                                                  | `src/gateway/protocol/schema/protocol-schemas.ts`         |
| Délai d’expiration des requêtes (par RPC)  | `30_000` ms                                          | `src/gateway/client.ts` (`requestTimeoutMs`)              |
| Délai d’expiration preauth / connect-challenge | `10_000` ms                                       | `src/gateway/handshake-timeouts.ts` (plage `250`–`10_000`) |
| Backoff initial de reconnexion             | `1_000` ms                                           | `src/gateway/client.ts` (`backoffMs`)                     |
| Backoff maximal de reconnexion             | `30_000` ms                                          | `src/gateway/client.ts` (`scheduleReconnect`)             |
| Limite de nouvelle tentative rapide après fermeture par jeton d’appareil | `250` ms                    | `src/gateway/client.ts`                                   |
| Délai de grâce avant `terminate()` en arrêt forcé | `250` ms                                      | `FORCE_STOP_TERMINATE_GRACE_MS`                           |
| Délai d’expiration par défaut de `stopAndWait()` | `1_000` ms                                     | `STOP_AND_WAIT_TIMEOUT_MS`                                |
| Intervalle de tick par défaut (avant `hello-ok`) | `30_000` ms                                    | `src/gateway/client.ts`                                   |
| Fermeture sur expiration du tick           | code `4000` lorsque le silence dépasse `tickIntervalMs * 2` | `src/gateway/client.ts`                           |
| `MAX_PAYLOAD_BYTES`                        | `25 * 1024 * 1024` (25 MB)                           | `src/gateway/server-constants.ts`                         |

Le serveur annonce les valeurs effectives `policy.tickIntervalMs`, `policy.maxPayload`
et `policy.maxBufferedBytes` dans `hello-ok` ; les clients doivent respecter ces valeurs
plutôt que les valeurs par défaut d’avant la poignée de main.

## Auth

- L’authentification Gateway par secret partagé utilise `connect.params.auth.token` ou
  `connect.params.auth.password`, selon le mode d’authentification configuré.
- Les modes porteurs d’identité tels que Tailscale Serve
  (`gateway.auth.allowTailscale: true`) ou le mode non-loopback
  `gateway.auth.mode: "trusted-proxy"` satisfont la vérification d’authentification de connexion à partir des
  en-têtes de requête au lieu de `connect.params.auth.*`.
- Le mode d’entrée privée `gateway.auth.mode: "none"` ignore entièrement l’authentification de connexion par secret partagé ;
  n’exposez pas ce mode sur une entrée publique/non approuvée.
- Après l’appairage, la Gateway émet un **jeton d’appareil** limité au rôle + aux scopes de la connexion.
  Il est renvoyé dans `hello-ok.auth.deviceToken` et doit être
  persisté par le client pour les futures connexions.
- Les clients doivent persister le `hello-ok.auth.deviceToken` principal après toute
  connexion réussie.
- Une reconnexion avec ce jeton d’appareil **stocké** doit également réutiliser l’ensemble de scopes approuvés stocké
  pour ce jeton. Cela préserve l’accès lecture/sonde/état
  déjà accordé et évite de réduire silencieusement les reconnexions à un
  scope implicite plus étroit limité à l’administration.
- Assemblage de l’authentification de connexion côté client (`selectConnectAuth` dans
  `src/gateway/client.ts`) :
  - `auth.password` est orthogonal et est toujours transmis lorsqu’il est défini.
  - `auth.token` est renseigné dans l’ordre de priorité suivant : d’abord le jeton partagé explicite,
    puis un `deviceToken` explicite, puis un jeton par appareil stocké (indexé par
    `deviceId` + `role`).
  - `auth.bootstrapToken` n’est envoyé que si aucun des éléments ci-dessus n’a résolu
    un `auth.token`. Un jeton partagé ou tout jeton d’appareil résolu le supprime.
  - La promotion automatique d’un jeton d’appareil stocké lors de la nouvelle tentative ponctuelle
    `AUTH_TOKEN_MISMATCH` est limitée aux **points de terminaison approuvés uniquement** —
    loopback, ou `wss://` avec un `tlsFingerprint` épinglé. Un `wss://` public
    sans épinglage n’est pas admissible.
- Les entrées supplémentaires `hello-ok.auth.deviceTokens` sont des jetons de transfert d’amorçage.
  Ne les persistez que lorsque la connexion a utilisé une authentification d’amorçage sur un transport approuvé
  tel que `wss://` ou loopback/appairage local.
- Si un client fournit un `deviceToken` **explicite** ou des `scopes` explicites, cet
  ensemble de scopes demandé par l’appelant reste faisant autorité ; les scopes en cache ne sont réutilisés
  que lorsque le client réutilise le jeton par appareil stocké.
- Les jetons d’appareil peuvent être pivotés/révoqués via `device.token.rotate` et
  `device.token.revoke` (requiert le scope `operator.pairing`).
- L’émission/la rotation de jeton reste bornée à l’ensemble de rôles approuvé enregistré dans
  l’entrée d’appairage de cet appareil ; faire pivoter un jeton ne peut pas étendre l’appareil à un
  rôle que l’approbation d’appairage n’a jamais accordé.
- Pour les sessions à jeton d’appareil appairé, la gestion d’appareil est limitée au périmètre de l’appareil lui-même sauf si l’appelant
  possède aussi `operator.admin` : les appelants non administrateurs ne peuvent supprimer/révoquer/faire pivoter
  que leur **propre** entrée d’appareil.
- `device.token.rotate` vérifie également l’ensemble de scopes operator demandé par rapport aux
  scopes actuels de la session de l’appelant. Les appelants non administrateurs ne peuvent pas faire pivoter un jeton vers
  un ensemble de scopes operator plus large que celui qu’ils détiennent déjà.
- Les échecs d’authentification incluent `error.details.code` ainsi que des indications de récupération :
  - `error.details.canRetryWithDeviceToken` (booléen)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportement client pour `AUTH_TOKEN_MISMATCH` :
  - Les clients approuvés peuvent tenter une nouvelle tentative limitée avec un jeton par appareil en cache.
  - Si cette nouvelle tentative échoue, les clients doivent arrêter les boucles automatiques de reconnexion et afficher des instructions d’action à l’opérateur.

## Identité d’appareil + appairage

- Les nœuds doivent inclure une identité d’appareil stable (`device.id`) dérivée de l’empreinte
  d’une paire de clés.
- Les gateways émettent des jetons par appareil + rôle.
- Des approbations d’appairage sont requises pour les nouveaux IDs d’appareil, sauf si l’approbation automatique locale
  est activée.
- L’approbation automatique d’appairage est centrée sur les connexions loopback locales directes.
- OpenClaw dispose également d’un chemin étroit d’auto-connexion locale backend/conteneur pour
  des flux d’assistance à secret partagé approuvés.
- Les connexions tailnet ou LAN sur le même hôte sont toujours traitées comme distantes pour l’appairage et
  nécessitent une approbation.
- Tous les clients WS doivent inclure l’identité `device` lors de `connect` (operator + node).
  Control UI ne peut l’omettre que dans ces modes :
  - `gateway.controlUi.allowInsecureAuth=true` pour la compatibilité HTTP non sécurisée sur localhost uniquement.
  - authentification operator réussie de Control UI avec `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (mode d’urgence, dégradation grave de la sécurité).
- Toutes les connexions doivent signer le nonce `connect.challenge` fourni par le serveur.

### Diagnostics de migration de l’authentification d’appareil

Pour les clients hérités qui utilisent encore le comportement de signature antérieur au challenge, `connect` renvoie désormais
des codes de détail `DEVICE_AUTH_*` sous `error.details.code` avec une valeur stable `error.details.reason`.

Échecs de migration courants :

| Message                     | details.code                     | details.reason           | Signification                                        |
| --------------------------- | -------------------------------- | ------------------------ | ---------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Le client a omis `device.nonce` (ou l’a envoyé vide). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Le client a signé avec un nonce obsolète/incorrect.  |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | La charge utile de signature ne correspond pas à la charge utile v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | L’horodatage signé est en dehors de la dérive autorisée. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` ne correspond pas à l’empreinte de la clé publique. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Le format/la canonicalisation de la clé publique a échoué. |

Cible de migration :

- Attendez toujours `connect.challenge`.
- Signez la charge utile v2 qui inclut le nonce du serveur.
- Envoyez le même nonce dans `connect.params.device.nonce`.
- La charge utile de signature préférée est `v3`, qui lie `platform` et `deviceFamily`
  en plus des champs appareil/client/rôle/scopes/jeton/nonce.
- Les signatures héritées `v2` restent acceptées pour compatibilité, mais l’épinglage des métadonnées
  d’appareil appairé contrôle toujours la politique de commande à la reconnexion.

## TLS + épinglage

- TLS est pris en charge pour les connexions WS.
- Les clients peuvent facultativement épingler l’empreinte du certificat de la gateway (voir la configuration `gateway.tls`
  ainsi que `gateway.remote.tlsFingerprint` ou l’option CLI `--tls-fingerprint`).

## Portée

Ce protocole expose **l’API gateway complète** (état, canaux, modèles, chat,
agent, sessions, nœuds, approbations, etc.). La surface exacte est définie par les
schémas TypeBox dans `src/gateway/protocol/schema.ts`.
