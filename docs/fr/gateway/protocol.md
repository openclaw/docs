---
read_when:
    - Implémenter ou mettre à jour des clients WS de Gateway
    - Déboguer des incompatibilités de protocole ou des échecs de connexion
    - Régénérer le schéma/les modèles du protocole
summary: 'Protocole WebSocket de la Gateway : handshake, trames, gestion des versions'
title: Protocole Gateway
x-i18n:
    generated_at: "2026-04-23T07:03:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d4ea65fbe31962ed8ece04a645cfe5aaff9fee8b5f89bc896b461cd45567634
    source_path: gateway/protocol.md
    workflow: 15
---

# Protocole Gateway (WebSocket)

Le protocole WS de la Gateway est le **plan de contrôle unique + transport de Node** pour
OpenClaw. Tous les clients (CLI, UI web, application macOS, Nodes iOS/Android,
Nodes sans interface) se connectent via WebSocket et déclarent leur **rôle** + leur **portée** au
moment du handshake.

## Transport

- WebSocket, trames texte avec charges utiles JSON.
- La première trame **doit** être une requête `connect`.
- Les trames avant connexion sont limitées à 64 Kio. Après un handshake réussi, les clients
  doivent respecter les limites `hello-ok.policy.maxPayload` et
  `hello-ok.policy.maxBufferedBytes`. Avec les diagnostics activés,
  les trames entrantes surdimensionnées et les buffers sortants lents émettent des événements `payload.large`
  avant que la Gateway ne ferme ou n’abandonne la trame concernée. Ces événements conservent
  les tailles, les limites, les surfaces et des codes de raison sûrs. Ils ne conservent ni le corps du message,
  ni le contenu des pièces jointes, ni le corps brut de la trame, ni les jetons, cookies ou valeurs secrètes.

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
signale le rôle/les portées négociés lorsqu’ils sont disponibles, et inclut `deviceToken`
lorsque la Gateway en émet un.

Lorsqu’aucun jeton d’appareil n’est émis, `hello-ok.auth` peut tout de même signaler les
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

Pendant le transfert d’amorçage de confiance, `hello-ok.auth` peut aussi inclure des entrées de rôle bornées supplémentaires dans `deviceTokens` :

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

Pour le flux d’amorçage intégré node/operator, le jeton principal du node reste à
`scopes: []` et tout jeton operator transmis reste borné à la liste d’autorisation
de l’operator d’amorçage (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Les vérifications de portée d’amorçage restent
préfixées par rôle : les entrées operator ne satisfont que les requêtes operator, et les rôles non operator
ont toujours besoin de portées sous leur propre préfixe de rôle.

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

## Format des trames

- **Requête** : `{type:"req", id, method, params}`
- **Réponse** : `{type:"res", id, ok, payload|error}`
- **Événement** : `{type:"event", event, payload, seq?, stateVersion?}`

Les méthodes avec effets de bord requièrent des **clés d’idempotence** (voir le schéma).

## Rôles + portées

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

`talk.config` avec `includeSecrets: true` requiert `operator.talk.secrets`
(ou `operator.admin`).

Les méthodes RPC de Gateway enregistrées par Plugin peuvent demander leur propre portée operator, mais
les préfixes admin du cœur réservés (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) se résolvent toujours vers `operator.admin`.

La portée de méthode n’est que la première barrière. Certaines commandes slash atteintes via
`chat.send` appliquent des vérifications plus strictes au niveau de la commande en plus. Par exemple, les écritures persistantes
`/config set` et `/config unset` requièrent `operator.admin`.

`node.pair.approve` a aussi une vérification de portée supplémentaire au moment de l’approbation en plus de la
portée de base de la méthode :

- requêtes sans commande : `operator.pairing`
- requêtes avec commandes node autres qu’exec : `operator.pairing` + `operator.write`
- requêtes incluant `system.run`, `system.run.prepare` ou `system.which` :
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Les Nodes déclarent des revendications de capacités au moment de la connexion :

- `caps` : catégories de capacités de haut niveau.
- `commands` : liste d’autorisation des commandes pour invoke.
- `permissions` : bascules granulaires (par ex. `screen.record`, `camera.capture`).

La Gateway traite celles-ci comme des **revendications** et applique des listes d’autorisation côté serveur.

## Présence

- `system-presence` renvoie des entrées indexées par identité d’appareil.
- Les entrées de présence incluent `deviceId`, `roles` et `scopes` afin que les UI puissent afficher une seule ligne par appareil
  même lorsqu’il se connecte à la fois comme **operator** et comme **node**.

## Définition de la portée des événements de diffusion

Les événements de diffusion WebSocket poussés par le serveur sont filtrés par portée afin que les sessions limitées à l’association ou réservées au node ne reçoivent pas passivement le contenu des sessions.

- Les **trames de discussion, d’agent et de résultat d’outil** (y compris les événements `agent` diffusés en streaming et les résultats d’appel d’outil) requièrent au minimum `operator.read`. Les sessions sans `operator.read` ignorent totalement ces trames.
- Les **diffusions `plugin.*` définies par Plugin** sont filtrées vers `operator.write` ou `operator.admin`, selon la manière dont le Plugin les a enregistrées.
- Les **événements d’état et de transport** (`heartbeat`, `presence`, `tick`, cycle de vie connexion/déconnexion, etc.) restent sans restriction afin que l’état de santé du transport reste observable par toute session authentifiée.
- Les **familles d’événements de diffusion inconnues** sont filtrées par portée par défaut (mode fermé) à moins qu’un gestionnaire enregistré n’assouplisse explicitement cette règle.

Chaque connexion client conserve son propre numéro de séquence par client afin que les diffusions préservent l’ordre monotone sur cette socket, même lorsque différents clients voient différents sous-ensembles filtrés par portée du flux d’événements.

## Familles courantes de méthodes RPC

Cette page n’est pas un dump complet généré, mais la surface WS publique est plus large
que les exemples de handshake/authentification ci-dessus. Ce sont les principales familles de méthodes que la
Gateway expose aujourd’hui.

`hello-ok.features.methods` est une liste de découverte prudente construite à partir de
`src/gateway/server-methods-list.ts` plus les exports de méthodes de plugin/canal chargés.
Traitez-la comme une découverte de fonctionnalités, et non comme un dump généré de tous les assistants appelables
implémentés dans `src/gateway/server-methods/*.ts`.

### Système et identité

- `health` renvoie l’instantané de santé de la Gateway mis en cache ou fraîchement sondé.
- `diagnostics.stability` renvoie l’enregistreur borné récent de stabilité diagnostique.
  Il conserve des métadonnées opérationnelles telles que les noms d’événements, les compteurs, les tailles en octets,
  les lectures mémoire, l’état file/session, les noms de canal/plugin et les identifiants de session.
  Il ne conserve pas le texte des discussions, les corps de Webhook, les sorties d’outil, les corps bruts de requêtes ou de
  réponses, les jetons, les cookies ou les valeurs secrètes. La portée operator read est
  requise.
- `status` renvoie le résumé de Gateway de type `/status` ; les champs sensibles sont
  inclus uniquement pour les clients operator à portée admin.
- `gateway.identity.get` renvoie l’identité d’appareil de la Gateway utilisée par les flux de relais et
  d’association.
- `system-presence` renvoie l’instantané de présence actuel pour les appareils
  operator/node connectés.
- `system-event` ajoute un événement système et peut mettre à jour/diffuser le
  contexte de présence.
- `last-heartbeat` renvoie le dernier événement Heartbeat persistant.
- `set-heartbeats` active ou désactive le traitement des Heartbeat sur la Gateway.

### Modèles et usage

- `models.list` renvoie le catalogue de modèles autorisés à l’exécution.
- `usage.status` renvoie des résumés des fenêtres d’usage fournisseur/quota restant.
- `usage.cost` renvoie des résumés agrégés de coût d’usage pour une plage de dates.
- `doctor.memory.status` renvoie l’état de préparation de la mémoire vectorielle / des embeddings pour
  l’espace de travail de l’agent par défaut actif.
- `sessions.usage` renvoie des résumés d’usage par session.
- `sessions.usage.timeseries` renvoie des séries temporelles d’usage pour une session.
- `sessions.usage.logs` renvoie les entrées de journal d’usage pour une session.

### Canaux et assistants de connexion

- `channels.status` renvoie les résumés d’état des canaux/plugins intégrés + fournis.
- `channels.logout` déconnecte un canal/compte spécifique lorsque le canal
  prend en charge la déconnexion.
- `web.login.start` démarre un flux de connexion QR/web pour le fournisseur de canal web
  actuel compatible QR.
- `web.login.wait` attend la fin de ce flux de connexion QR/web et démarre le
  canal en cas de succès.
- `push.test` envoie une notification push APNs de test à un node iOS enregistré.
- `voicewake.get` renvoie les déclencheurs de mot de réveil stockés.
- `voicewake.set` met à jour les déclencheurs de mot de réveil et diffuse le changement.

### Messagerie et journaux

- `send` est la RPC de livraison sortante directe pour les envois ciblés par
  canal/compte/fil en dehors du chat runner.
- `logs.tail` renvoie la fin du journal de fichiers configuré de la Gateway avec curseur/limite et
  contrôles de taille maximale en octets.

### Talk et TTS

- `talk.config` renvoie la charge utile de configuration Talk effective ; `includeSecrets`
  requiert `operator.talk.secrets` (ou `operator.admin`).
- `talk.mode` définit/diffuse l’état actuel du mode Talk pour les clients
  WebChat/Control UI.
- `talk.speak` synthétise la parole via le fournisseur de parole Talk actif.
- `tts.status` renvoie l’état activé de TTS, le fournisseur actif, les fournisseurs de repli,
  et l’état de configuration du fournisseur.
- `tts.providers` renvoie l’inventaire visible des fournisseurs TTS.
- `tts.enable` et `tts.disable` activent ou désactivent l’état des préférences TTS.
- `tts.setProvider` met à jour le fournisseur TTS préféré.
- `tts.convert` exécute une conversion texte-parole ponctuelle.

### Secrets, configuration, mise à jour et assistant

- `secrets.reload` relance la résolution des SecretRef actifs et échange l’état des secrets à l’exécution
  uniquement en cas de succès complet.
- `secrets.resolve` résout les affectations de secrets ciblées par commande pour un ensemble
  commande/cible donné.
- `config.get` renvoie l’instantané de configuration actuel et son hash.
- `config.set` écrit une charge utile de configuration validée.
- `config.patch` fusionne une mise à jour partielle de configuration.
- `config.apply` valide + remplace la charge utile de configuration complète.
- `config.schema` renvoie la charge utile du schéma de configuration vivant utilisée par Control UI et
  l’outillage CLI : schéma, `uiHints`, version et métadonnées de génération, y compris
  les métadonnées de schéma des plugins + canaux lorsque l’exécution peut les charger. Le schéma
  inclut les métadonnées de champ `title` / `description` dérivées des mêmes libellés
  et textes d’aide utilisés par l’UI, y compris pour les objets imbriqués, les jokers, les éléments
  de tableau et les branches de composition `anyOf` / `oneOf` / `allOf` lorsqu’une
  documentation de champ correspondante existe.
- `config.schema.lookup` renvoie une charge utile de recherche limitée à un chemin pour un
  chemin de configuration : chemin normalisé, nœud de schéma superficiel, hint correspondant + `hintPath`, et
  résumés des enfants immédiats pour l’exploration détaillée UI/CLI.
  - Les nœuds de schéma de recherche conservent la documentation visible par l’utilisateur et les champs de validation courants :
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    bornes numériques/chaînes/tableaux/objets, et indicateurs booléens comme
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - Les résumés des enfants exposent `key`, `path` normalisé, `type`, `required`,
    `hasChildren`, plus le `hint` / `hintPath` correspondant.
- `update.run` exécute le flux de mise à jour de la Gateway et programme un redémarrage uniquement lorsque
  la mise à jour elle-même a réussi.
- `wizard.start`, `wizard.next`, `wizard.status` et `wizard.cancel` exposent l’assistant
  d’onboarding via WS RPC.

### Familles majeures existantes

#### Assistants d’agent et d’espace de travail

- `agents.list` renvoie les entrées d’agent configurées.
- `agents.create`, `agents.update` et `agents.delete` gèrent les enregistrements d’agent et
  le câblage de l’espace de travail.
- `agents.files.list`, `agents.files.get` et `agents.files.set` gèrent les
  fichiers d’espace de travail d’amorçage exposés pour un agent.
- `agent.identity.get` renvoie l’identité effective de l’assistant pour un agent ou
  une session.
- `agent.wait` attend la fin d’une exécution et renvoie l’instantané terminal lorsqu’il est
  disponible.

#### Contrôle de session

- `sessions.list` renvoie l’index de session actuel.
- `sessions.subscribe` et `sessions.unsubscribe` activent ou désactivent les abonnements
  aux événements de changement de session pour le client WS actuel.
- `sessions.messages.subscribe` et `sessions.messages.unsubscribe` activent ou désactivent les
  abonnements aux événements de transcription/message pour une session.
- `sessions.preview` renvoie des aperçus bornés de transcription pour des
  clés de session spécifiques.
- `sessions.resolve` résout ou canonicalise une cible de session.
- `sessions.create` crée une nouvelle entrée de session.
- `sessions.send` envoie un message dans une session existante.
- `sessions.steer` est la variante interruption-et-guidage pour une session active.
- `sessions.abort` interrompt le travail actif pour une session.
- `sessions.patch` met à jour les métadonnées/remplacements de session.
- `sessions.reset`, `sessions.delete` et `sessions.compact` effectuent la
  maintenance de session.
- `sessions.get` renvoie la ligne complète de session stockée.
- L’exécution du chat utilise toujours `chat.history`, `chat.send`, `chat.abort` et
  `chat.inject`.
- `chat.history` est normalisé pour l’affichage pour les clients UI : les balises de directive inline sont
  retirées du texte visible, les charges utiles XML d’appel d’outil en texte brut (y compris
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, et
  les blocs d’appel d’outil tronqués) ainsi que les jetons de contrôle de modèle ASCII/pleine largeur divulgués
  sont retirés, les lignes d’assistant purement à jeton silencieux telles que `NO_REPLY` /
  `no_reply` exact sont omises, et les lignes surdimensionnées peuvent être remplacées par des placeholders.

#### Association d’appareils et jetons d’appareil

- `device.pair.list` renvoie les appareils associés en attente et approuvés.
- `device.pair.approve`, `device.pair.reject` et `device.pair.remove` gèrent
  les enregistrements d’association d’appareils.
- `device.token.rotate` fait tourner un jeton d’appareil associé dans les limites
  approuvées de son rôle et de ses portées.
- `device.token.revoke` révoque un jeton d’appareil associé.

#### Association de Node, invoke et travail en attente

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` et `node.pair.verify` couvrent l’association de node et la
  vérification d’amorçage.
- `node.list` et `node.describe` renvoient l’état des nodes connus/connectés.
- `node.rename` met à jour un libellé de node associé.
- `node.invoke` transmet une commande à un node connecté.
- `node.invoke.result` renvoie le résultat d’une requête invoke.
- `node.event` transporte vers la Gateway les événements émis par le node.
- `node.canvas.capability.refresh` rafraîchit les jetons de capacité canvas limités.
- `node.pending.pull` et `node.pending.ack` sont les API de file du node connecté.
- `node.pending.enqueue` et `node.pending.drain` gèrent le travail durable en attente
  pour les nodes hors ligne/déconnectés.

#### Familles d’approbation

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list` et
  `exec.approval.resolve` couvrent les requêtes d’approbation exec ponctuelles ainsi que la
  recherche/relecture des approbations en attente.
- `exec.approval.waitDecision` attend une approbation exec en attente et renvoie
  la décision finale (ou `null` en cas de timeout).
- `exec.approvals.get` et `exec.approvals.set` gèrent les instantanés de politique
  d’approbation exec de la Gateway.
- `exec.approvals.node.get` et `exec.approvals.node.set` gèrent la politique locale exec
  du node via des commandes de relais node.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision` et `plugin.approval.resolve` couvrent les
  flux d’approbation définis par Plugin.

#### Autres familles majeures

- automatisation :
  - `wake` programme une injection immédiate ou au prochain Heartbeat de texte de réveil
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- skills/outils : `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### Familles d’événements courantes

- `chat` : mises à jour de discussion UI telles que `chat.inject` et autres événements
  de discussion limités à la transcription.
- `session.message` et `session.tool` : mises à jour de transcription/flux d’événements pour une
  session abonnée.
- `sessions.changed` : l’index ou les métadonnées de session ont changé.
- `presence` : mises à jour de l’instantané de présence système.
- `tick` : événement périodique de keepalive / vitalité.
- `health` : mise à jour de l’instantané de santé de la Gateway.
- `heartbeat` : mise à jour du flux d’événements Heartbeat.
- `cron` : événement de changement d’exécution/tâche Cron.
- `shutdown` : notification d’arrêt de la Gateway.
- `node.pair.requested` / `node.pair.resolved` : cycle de vie d’association de node.
- `node.invoke.request` : diffusion de requête invoke de node.
- `device.pair.requested` / `device.pair.resolved` : cycle de vie d’appareil associé.
- `voicewake.changed` : la configuration des déclencheurs de mot de réveil a changé.
- `exec.approval.requested` / `exec.approval.resolved` : cycle de vie
  d’approbation exec.
- `plugin.approval.requested` / `plugin.approval.resolved` : cycle de vie
  d’approbation de Plugin.

### Méthodes d’assistance pour Node

- Les Nodes peuvent appeler `skills.bins` pour récupérer la liste actuelle des exécutables de Skills
  pour les vérifications d’auto-allow.

### Méthodes d’assistance pour Operator

- Les Operators peuvent appeler `commands.list` (`operator.read`) pour récupérer l’inventaire des commandes runtime pour un agent.
  - `agentId` est facultatif ; omettez-le pour lire l’espace de travail de l’agent par défaut.
  - `scope` contrôle quelle surface est ciblée par le `name` principal :
    - `text` renvoie le jeton principal de commande texte sans le `/` initial
    - `native` et le chemin par défaut `both` renvoient des noms natifs tenant compte du fournisseur
      lorsqu’ils sont disponibles
  - `textAliases` contient les alias slash exacts tels que `/model` et `/m`.
  - `nativeName` contient le nom de commande natif tenant compte du fournisseur lorsqu’il existe.
  - `provider` est facultatif et n’affecte que le nommage natif ainsi que la disponibilité des
    commandes natives de Plugin.
  - `includeArgs=false` omet de la réponse les métadonnées d’arguments sérialisées.
- Les Operators peuvent appeler `tools.catalog` (`operator.read`) pour récupérer le catalogue d’outils runtime pour un
  agent. La réponse inclut des outils groupés et des métadonnées de provenance :
  - `source` : `core` ou `plugin`
  - `pluginId` : propriétaire du plugin lorsque `source="plugin"`
  - `optional` : indique si un outil de plugin est facultatif
- Les Operators peuvent appeler `tools.effective` (`operator.read`) pour récupérer l’inventaire d’outils effectif à l’exécution
  pour une session.
  - `sessionKey` est requis.
  - La Gateway dérive le contexte runtime de confiance côté serveur à partir de la session au lieu d’accepter
    un contexte d’authentification ou de livraison fourni par l’appelant.
  - La réponse est limitée à la session et reflète ce que la conversation active peut utiliser immédiatement,
    y compris les outils du cœur, des plugins et des canaux.
- Les Operators peuvent appeler `skills.status` (`operator.read`) pour récupérer l’inventaire visible
  des Skills pour un agent.
  - `agentId` est facultatif ; omettez-le pour lire l’espace de travail de l’agent par défaut.
  - La réponse inclut l’éligibilité, les exigences manquantes, les vérifications de configuration et
    des options d’installation assainies sans exposer de valeurs secrètes brutes.
- Les Operators peuvent appeler `skills.search` et `skills.detail` (`operator.read`) pour
  les métadonnées de découverte ClawHub.
- Les Operators peuvent appeler `skills.install` (`operator.admin`) selon deux modes :
  - Mode ClawHub : `{ source: "clawhub", slug, version?, force? }` installe un
    dossier de Skill dans le répertoire `skills/` de l’espace de travail de l’agent par défaut.
  - Mode installateur Gateway : `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    exécute une action déclarée `metadata.openclaw.install` sur l’hôte de la Gateway.
- Les Operators peuvent appeler `skills.update` (`operator.admin`) selon deux modes :
  - Le mode ClawHub met à jour un slug suivi ou toutes les installations ClawHub suivies dans
    l’espace de travail de l’agent par défaut.
  - Le mode configuration patche les valeurs `skills.entries.<skillKey>` telles que `enabled`,
    `apiKey` et `env`.

## Approbations exec

- Lorsqu’une requête exec nécessite une approbation, la Gateway diffuse `exec.approval.requested`.
- Les clients operator résolvent cela en appelant `exec.approval.resolve` (requiert la portée `operator.approvals`).
- Pour `host=node`, `exec.approval.request` doit inclure `systemRunPlan` (`argv`/`cwd`/`rawCommand`/métadonnées de session canoniques). Les requêtes dépourvues de `systemRunPlan` sont rejetées.
- Après approbation, les appels `node.invoke system.run` transmis réutilisent ce
  `systemRunPlan` canonique comme contexte faisant autorité pour la commande/le cwd/la session.
- Si un appelant modifie `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` entre la préparation et la transmission finale approuvée de `system.run`, la
  Gateway rejette l’exécution au lieu de faire confiance à la charge utile modifiée.

## Repli de livraison d’agent

- Les requêtes `agent` peuvent inclure `deliver=true` pour demander une livraison sortante.
- `bestEffortDeliver=false` conserve un comportement strict : les cibles de livraison non résolues ou internes uniquement renvoient `INVALID_REQUEST`.
- `bestEffortDeliver=true` autorise un repli vers une exécution limitée à la session lorsqu’aucune route de livraison externe ne peut être résolue (par exemple sessions internes/webchat ou configurations multi-canaux ambiguës).

## Gestion des versions

- `PROTOCOL_VERSION` se trouve dans `src/gateway/protocol/schema/protocol-schemas.ts`.
- Les clients envoient `minProtocol` + `maxProtocol` ; le serveur rejette les incompatibilités.
- Les schémas + modèles sont générés à partir de définitions TypeBox :
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes client

Le client de référence dans `src/gateway/client.ts` utilise ces valeurs par défaut. Les valeurs sont
stables sur tout le protocole v3 et constituent la base attendue pour les clients tiers.

| Constante                                 | Par défaut                                           | Source                                                     |
| ----------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                  | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Délai d’expiration des requêtes (par RPC) | `30_000` ms                                          | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Délai d’expiration préauth / connect-challenge | `10_000` ms                                     | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Backoff initial de reconnexion            | `1_000` ms                                           | `src/gateway/client.ts` (`backoffMs`)                      |
| Backoff maximal de reconnexion            | `30_000` ms                                          | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Clamp de nouvelle tentative rapide après fermeture par device-token | `250` ms                              | `src/gateway/client.ts`                                    |
| Délai de grâce avant `terminate()` lors d’un arrêt forcé | `250` ms                                | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Délai par défaut de `stopAndWait()`       | `1_000` ms                                           | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Intervalle tick par défaut (avant `hello-ok`) | `30_000` ms                                      | `src/gateway/client.ts`                                    |
| Fermeture sur timeout de tick             | code `4000` lorsque le silence dépasse `tickIntervalMs * 2` | `src/gateway/client.ts`                             |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                           | `src/gateway/server-constants.ts`                          |

Le serveur annonce les valeurs effectives `policy.tickIntervalMs`, `policy.maxPayload`
et `policy.maxBufferedBytes` dans `hello-ok` ; les clients doivent respecter ces valeurs
plutôt que les valeurs par défaut d’avant le handshake.

## Authentification

- L’authentification Gateway par secret partagé utilise `connect.params.auth.token` ou
  `connect.params.auth.password`, selon le mode d’authentification configuré.
- Les modes porteurs d’identité tels que Tailscale Serve
  (`gateway.auth.allowTailscale: true`) ou
  `gateway.auth.mode: "trusted-proxy"` hors loopback satisfont la vérification d’authentification `connect`
  à partir des en-têtes de requête au lieu de `connect.params.auth.*`.
- Le mode d’entrée privée `gateway.auth.mode: "none"` ignore totalement l’authentification `connect`
  par secret partagé ; n’exposez pas ce mode sur une entrée publique/non fiable.
- Après l’association, la Gateway émet un **jeton d’appareil** limité au rôle + aux portées de la
  connexion. Il est renvoyé dans `hello-ok.auth.deviceToken` et doit être
  persisté par le client pour les connexions futures.
- Les clients doivent persister le `hello-ok.auth.deviceToken` principal après toute
  connexion réussie.
- La reconnexion avec ce jeton d’appareil **stocké** doit aussi réutiliser l’ensemble de portées
  approuvé stocké pour ce jeton. Cela préserve l’accès lecture/sondage/état
  déjà accordé et évite de réduire silencieusement les reconnexions à une
  portée implicite plus étroite limitée à l’admin.
- Assemblage de l’authentification `connect` côté client (`selectConnectAuth` dans
  `src/gateway/client.ts`) :
  - `auth.password` est orthogonal et est toujours transmis lorsqu’il est défini.
  - `auth.token` est renseigné par ordre de priorité : d’abord le jeton partagé explicite,
    puis un `deviceToken` explicite, puis un jeton stocké par appareil (indexé par
    `deviceId` + `role`).
  - `auth.bootstrapToken` n’est envoyé que si aucun des éléments ci-dessus n’a résolu
    `auth.token`. Un jeton partagé ou tout jeton d’appareil résolu le supprime.
  - L’auto-promotion d’un jeton d’appareil stocké lors de la tentative unique
    `AUTH_TOKEN_MISMATCH` est limitée aux **endpoints de confiance uniquement** —
    loopback, ou `wss://` avec un `tlsFingerprint` épinglé. `wss://` public
    sans épinglage n’est pas admissible.
- Les entrées supplémentaires `hello-ok.auth.deviceTokens` sont des jetons de transfert d’amorçage.
  Ne les persistez que lorsque la connexion a utilisé l’authentification d’amorçage sur un transport de confiance
  tel que `wss://` ou l’association loopback/locale.
- Si un client fournit un **`deviceToken` explicite** ou des **`scopes` explicites**, cet
  ensemble de portées demandé par l’appelant reste autoritaire ; les portées mises en cache ne sont
  réutilisées que lorsque le client réutilise le jeton stocké par appareil.
- Les jetons d’appareil peuvent être tournés/révoqués via `device.token.rotate` et
  `device.token.revoke` (requiert la portée `operator.pairing`).
- L’émission/la rotation des jetons reste limitée à l’ensemble de rôles approuvé enregistré dans
  l’entrée d’association de cet appareil ; faire tourner un jeton ne peut pas élargir l’appareil vers un
  rôle que l’approbation d’association n’a jamais accordé.
- Pour les sessions de jeton d’appareil associé, la gestion d’appareil est limitée à soi-même sauf si l’appelant
  possède aussi `operator.admin` : les appelants non admin ne peuvent supprimer/révoquer/faire tourner
  que **leur propre** entrée d’appareil.
- `device.token.rotate` vérifie aussi l’ensemble de portées operator demandé par rapport aux
  portées de session actuelles de l’appelant. Les appelants non admin ne peuvent pas faire tourner un jeton vers
  un ensemble de portées operator plus large que celui qu’ils détiennent déjà.
- Les échecs d’authentification incluent `error.details.code` ainsi que des indications de récupération :
  - `error.details.canRetryWithDeviceToken` (booléen)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportement du client pour `AUTH_TOKEN_MISMATCH` :
  - Les clients de confiance peuvent tenter une nouvelle tentative bornée avec un jeton stocké par appareil.
  - Si cette nouvelle tentative échoue, les clients doivent arrêter les boucles automatiques de reconnexion et afficher des indications d’action à l’opérateur.

## Identité d’appareil + association

- Les Nodes doivent inclure une identité d’appareil stable (`device.id`) dérivée de l’empreinte
  d’une paire de clés.
- Les Gateways émettent des jetons par appareil + rôle.
- Les approbations d’association sont requises pour les nouveaux IDs d’appareil sauf si
  l’auto-approbation locale est activée.
- L’auto-approbation d’association est centrée sur les connexions directes locales en loopback.
- OpenClaw possède aussi un chemin étroit d’auto-connexion backend/local au conteneur pour
  les flux d’assistance de confiance par secret partagé.
- Les connexions tailnet ou LAN sur la même machine sont toujours traitées comme distantes pour l’association et
  nécessitent une approbation.
- Tous les clients WS doivent inclure l’identité `device` pendant `connect` (operator + node).
  Control UI ne peut l’omettre que dans ces modes :
  - `gateway.controlUi.allowInsecureAuth=true` pour la compatibilité HTTP non sécurisée en localhost uniquement.
  - authentification operator Control UI réussie avec `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (solution de dernier recours, forte dégradation de sécurité).
- Toutes les connexions doivent signer le nonce `connect.challenge` fourni par le serveur.

### Diagnostics de migration d’authentification d’appareil

Pour les anciens clients qui utilisent encore le comportement de signature antérieur au challenge, `connect` renvoie maintenant
des codes de détail `DEVICE_AUTH_*` sous `error.details.code` avec une valeur stable `error.details.reason`.

Échecs de migration courants :

| Message                     | details.code                     | details.reason           | Signification                                         |
| --------------------------- | -------------------------------- | ------------------------ | ----------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Le client a omis `device.nonce` (ou l’a envoyé vide). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Le client a signé avec un nonce obsolète/incorrect.   |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | La charge utile de signature ne correspond pas à la charge utile v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | L’horodatage signé est hors de la dérive autorisée.   |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` ne correspond pas à l’empreinte de la clé publique. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Le format/canonicalisation de la clé publique a échoué. |

Cible de migration :

- Attendez toujours `connect.challenge`.
- Signez la charge utile v2 qui inclut le nonce du serveur.
- Envoyez le même nonce dans `connect.params.device.nonce`.
- La charge utile de signature préférée est `v3`, qui lie `platform` et `deviceFamily`
  en plus des champs device/client/role/scopes/token/nonce.
- Les signatures héritées `v2` restent acceptées pour la compatibilité, mais l’épinglage des métadonnées
  d’appareil associé contrôle toujours la politique de commande lors de la reconnexion.

## TLS + épinglage

- TLS est pris en charge pour les connexions WS.
- Les clients peuvent éventuellement épingler l’empreinte du certificat Gateway (voir la configuration `gateway.tls`
  plus `gateway.remote.tlsFingerprint` ou la CLI `--tls-fingerprint`).

## Portée

Ce protocole expose **toute l’API Gateway** (état, canaux, modèles, chat,
agent, sessions, nodes, approbations, etc.). La surface exacte est définie par les
schémas TypeBox dans `src/gateway/protocol/schema.ts`.
