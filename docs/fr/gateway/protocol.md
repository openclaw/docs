---
read_when:
    - Implémentation ou mise à jour des clients WS Gateway
    - Débogage des incompatibilités de protocole ou des échecs de connexion
    - Régénération du schéma/des modèles du protocole
summary: 'Protocole WebSocket Gateway : poignée de main, trames, gestion des versions'
title: Protocole Gateway
x-i18n:
    generated_at: "2026-04-16T06:57:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 683e61ebe993a2d739bc34860060b0e3eda36b5c57267a2bcc03d177ec612fb3
    source_path: gateway/protocol.md
    workflow: 15
---

# Protocole Gateway (WebSocket)

Le protocole WS Gateway est le **plan de contrôle unique + transport de nœuds** pour
OpenClaw. Tous les clients (CLI, interface web, application macOS, nœuds iOS/Android,
nœuds headless) se connectent via WebSocket et déclarent leur **rôle** + leur **portée**
au moment de la poignée de main.

## Transport

- WebSocket, trames texte avec charges utiles JSON.
- La première trame **doit** être une requête `connect`.

## Poignée de main (`connect`)

Gateway → Client (challenge avant connexion) :

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

`server`, `features`, `snapshot` et `policy` sont tous obligatoires d’après le schéma
(`src/gateway/protocol/schema/frames.ts`). `auth` et `canvasHostUrl` sont facultatifs.

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

Pendant le transfert d’amorçage approuvé, `hello-ok.auth` peut également inclure des
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

Pour le flux d’amorçage intégré nœud/opérateur, le jeton de nœud principal reste à
`scopes: []` et tout jeton d’opérateur transféré reste borné à la liste d’autorisations
de l’opérateur d’amorçage (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Les vérifications de portée d’amorçage
restent préfixées par rôle : les entrées opérateur ne satisfont que les requêtes
opérateur, et les rôles non opérateur ont toujours besoin de portées sous leur propre
préfixe de rôle.

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

## Format des trames

- **Requête** : `{type:"req", id, method, params}`
- **Réponse** : `{type:"res", id, ok, payload|error}`
- **Événement** : `{type:"event", event, payload, seq?, stateVersion?}`

Les méthodes avec effets de bord nécessitent des **clés d’idempotence** (voir le schéma).

## Rôles + portées

### Rôles

- `operator` = client du plan de contrôle (CLI/UI/automatisation).
- `node` = hôte de capacités (camera/screen/canvas/system.run).

### Portées (`operator`)

Portées courantes :

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` avec `includeSecrets: true` nécessite `operator.talk.secrets`
(ou `operator.admin`).

Les méthodes RPC Gateway enregistrées par Plugin peuvent demander leur propre portée opérateur, mais
les préfixes d’administration réservés du noyau (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) se résolvent toujours en `operator.admin`.

La portée de méthode n’est que le premier filtre. Certaines commandes slash
atteintes via `chat.send` appliquent des vérifications plus strictes au niveau de la commande.
Par exemple, les écritures persistantes `/config set` et `/config unset` nécessitent `operator.admin`.

`node.pair.approve` a aussi une vérification de portée supplémentaire au moment de
l’approbation, en plus de la portée de méthode de base :

- requêtes sans commande : `operator.pairing`
- requêtes avec commandes de nœud non exec : `operator.pairing` + `operator.write`
- requêtes qui incluent `system.run`, `system.run.prepare` ou `system.which` :
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (`node`)

Les nœuds déclarent leurs revendications de capacité au moment de la connexion :

- `caps` : catégories de capacités de haut niveau.
- `commands` : liste d’autorisations de commandes pour `invoke`.
- `permissions` : bascules granulaires (par ex. `screen.record`, `camera.capture`).

Gateway traite ces éléments comme des **revendications** et applique côté serveur des
listes d’autorisations.

## Présence

- `system-presence` renvoie des entrées indexées par identité d’appareil.
- Les entrées de présence incluent `deviceId`, `roles` et `scopes` afin que les UI puissent afficher une seule ligne par appareil
  même lorsqu’il se connecte à la fois comme **operator** et **node**.

## Familles courantes de méthodes RPC

Cette page n’est pas un vidage complet généré, mais la surface WS publique est plus large
que les exemples de poignée de main/authentification ci-dessus. Voici les principales familles
de méthodes que Gateway expose aujourd’hui.

`hello-ok.features.methods` est une liste de découverte prudente construite à partir de
`src/gateway/server-methods-list.ts` ainsi que des exports de méthodes de Plugin/canal chargés.
Traitez-la comme une découverte de fonctionnalités, pas comme un vidage généré de chaque helper appelable
implémenté dans `src/gateway/server-methods/*.ts`.

### Système et identité

- `health` renvoie l’instantané de santé Gateway mis en cache ou sondé à nouveau.
- `status` renvoie le résumé Gateway de type `/status` ; les champs sensibles ne sont
  inclus que pour les clients opérateur avec portée admin.
- `gateway.identity.get` renvoie l’identité d’appareil Gateway utilisée par les flux de relais et
  d’appairage.
- `system-presence` renvoie l’instantané de présence actuel pour les appareils
  opérateur/nœud connectés.
- `system-event` ajoute un événement système et peut mettre à jour/diffuser le
  contexte de présence.
- `last-heartbeat` renvoie le dernier événement Heartbeat persisté.
- `set-heartbeats` active ou désactive le traitement des Heartbeat sur Gateway.

### Modèles et utilisation

- `models.list` renvoie le catalogue de modèles autorisés à l’exécution.
- `usage.status` renvoie les fenêtres d’utilisation fournisseur/les résumés de quota restant.
- `usage.cost` renvoie des résumés agrégés des coûts pour une plage de dates.
- `doctor.memory.status` renvoie l’état de préparation de la mémoire vectorielle / des embeddings pour le
  workspace actif de l’agent par défaut.
- `sessions.usage` renvoie des résumés d’utilisation par session.
- `sessions.usage.timeseries` renvoie une série temporelle d’utilisation pour une session.
- `sessions.usage.logs` renvoie les entrées de journal d’utilisation pour une session.

### Canaux et helpers de connexion

- `channels.status` renvoie les résumés d’état des canaux/plugins intégrés + groupés.
- `channels.logout` déconnecte un canal/compte spécifique là où le canal
  prend en charge la déconnexion.
- `web.login.start` démarre un flux de connexion QR/web pour le fournisseur de canal web
  actuel compatible QR.
- `web.login.wait` attend la fin de ce flux de connexion QR/web et démarre le
  canal en cas de succès.
- `push.test` envoie un push APNs de test à un nœud iOS enregistré.
- `voicewake.get` renvoie les déclencheurs de mot de réveil stockés.
- `voicewake.set` met à jour les déclencheurs de mot de réveil et diffuse la modification.

### Messagerie et journaux

- `send` est la RPC de livraison sortante directe pour les envois ciblés par
  canal/compte/fil en dehors du moteur de chat.
- `logs.tail` renvoie la fin du journal de fichiers Gateway configuré avec curseur/limite et
  contrôles de taille maximale en octets.

### Talk et TTS

- `talk.config` renvoie la charge utile effective de configuration Talk ; `includeSecrets`
  nécessite `operator.talk.secrets` (ou `operator.admin`).
- `talk.mode` définit/diffuse l’état actuel du mode Talk pour les clients
  WebChat/Control UI.
- `talk.speak` synthétise la parole via le fournisseur vocal Talk actif.
- `tts.status` renvoie l’état d’activation du TTS, le fournisseur actif, les fournisseurs de secours
  et l’état de configuration du fournisseur.
- `tts.providers` renvoie l’inventaire visible des fournisseurs TTS.
- `tts.enable` et `tts.disable` activent ou désactivent l’état des préférences TTS.
- `tts.setProvider` met à jour le fournisseur TTS préféré.
- `tts.convert` exécute une conversion texte-parole ponctuelle.

### Secrets, configuration, mise à jour et assistant

- `secrets.reload` re-résout les SecretRef actifs et ne remplace l’état secret d’exécution
  qu’en cas de réussite complète.
- `secrets.resolve` résout les assignations de secrets ciblées par commande pour un
  ensemble commande/cible spécifique.
- `config.get` renvoie l’instantané et le hash de la configuration actuelle.
- `config.set` écrit une charge utile de configuration validée.
- `config.patch` fusionne une mise à jour partielle de configuration.
- `config.apply` valide + remplace la charge utile complète de configuration.
- `config.schema` renvoie la charge utile du schéma de configuration en direct utilisée par Control UI et
  les outils CLI : schéma, `uiHints`, version et métadonnées de génération, y compris
  les métadonnées de schéma des Plugins + canaux lorsque l’exécution peut les charger. Le schéma
  inclut les métadonnées de champ `title` / `description` dérivées des mêmes libellés
  et textes d’aide utilisés par l’UI, y compris pour les objets imbriqués, caractères génériques,
  éléments de tableau et branches de composition `anyOf` / `oneOf` / `allOf` lorsque la
  documentation de champ correspondante existe.
- `config.schema.lookup` renvoie une charge utile de consultation limitée à un chemin pour un chemin de configuration :
  chemin normalisé, nœud de schéma superficiel, indice correspondant + `hintPath`, et
  résumés immédiats des enfants pour l’exploration détaillée UI/CLI.
  - Les nœuds de schéma de consultation conservent la documentation orientée utilisateur et les champs de validation courants :
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    bornes numériques/chaînes/tableaux/objets, et indicateurs booléens tels que
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - Les résumés enfants exposent `key`, le `path` normalisé, `type`, `required`,
    `hasChildren`, ainsi que le `hint` / `hintPath` correspondant.
- `update.run` exécute le flux de mise à jour Gateway et ne planifie un redémarrage que
  si la mise à jour elle-même a réussi.
- `wizard.start`, `wizard.next`, `wizard.status` et `wizard.cancel` exposent l’assistant
  d’onboarding via WS RPC.

### Familles principales existantes

#### Helpers d’agent et de workspace

- `agents.list` renvoie les entrées d’agent configurées.
- `agents.create`, `agents.update` et `agents.delete` gèrent les enregistrements d’agent et
  le raccordement du workspace.
- `agents.files.list`, `agents.files.get` et `agents.files.set` gèrent les
  fichiers de workspace d’amorçage exposés pour un agent.
- `agent.identity.get` renvoie l’identité effective de l’assistant pour un agent ou
  une session.
- `agent.wait` attend qu’une exécution se termine et renvoie l’instantané terminal lorsqu’il est
  disponible.

#### Contrôle de session

- `sessions.list` renvoie l’index actuel des sessions.
- `sessions.subscribe` et `sessions.unsubscribe` activent ou désactivent les abonnements
  aux événements de changement de session pour le client WS actuel.
- `sessions.messages.subscribe` et `sessions.messages.unsubscribe` activent ou désactivent
  les abonnements aux événements de transcription/message pour une session.
- `sessions.preview` renvoie des aperçus bornés de transcription pour des clés de
  session spécifiques.
- `sessions.resolve` résout ou canonise une cible de session.
- `sessions.create` crée une nouvelle entrée de session.
- `sessions.send` envoie un message dans une session existante.
- `sessions.steer` est la variante interruption-et-réorientation pour une session active.
- `sessions.abort` interrompt le travail actif pour une session.
- `sessions.patch` met à jour les métadonnées/remplacements de session.
- `sessions.reset`, `sessions.delete` et `sessions.compact` effectuent la maintenance
  des sessions.
- `sessions.get` renvoie la ligne complète de session stockée.
- l’exécution de chat utilise toujours `chat.history`, `chat.send`, `chat.abort` et
  `chat.inject`.
- `chat.history` est normalisé pour l’affichage pour les clients UI : les balises de directive inline sont
  supprimées du texte visible, les charges utiles XML d’appel d’outil en texte brut (y compris
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, et
  les blocs d’appel d’outil tronqués) ainsi que les jetons de contrôle de modèle ASCII/pleine largeur divulgués
  sont supprimés, les lignes assistant composées uniquement de jetons silencieux telles que `NO_REPLY` /
  `no_reply` exacts sont omises, et les lignes surdimensionnées peuvent être remplacées
  par des espaces réservés.

#### Appairage d’appareils et jetons d’appareil

- `device.pair.list` renvoie les appareils appairés en attente et approuvés.
- `device.pair.approve`, `device.pair.reject` et `device.pair.remove` gèrent
  les enregistrements d’appairage d’appareil.
- `device.token.rotate` fait tourner un jeton d’appareil appairé dans les limites approuvées
  de rôle et de portée.
- `device.token.revoke` révoque un jeton d’appareil appairé.

#### Appairage de nœuds, invocation et travail en attente

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` et `node.pair.verify` couvrent l’appairage des nœuds et la
  vérification d’amorçage.
- `node.list` et `node.describe` renvoient l’état des nœuds connus/connectés.
- `node.rename` met à jour un libellé de nœud appairé.
- `node.invoke` transfère une commande à un nœud connecté.
- `node.invoke.result` renvoie le résultat d’une requête d’invocation.
- `node.event` transporte les événements d’origine nœud de retour dans la Gateway.
- `node.canvas.capability.refresh` rafraîchit les jetons de capacité canvas bornés par portée.
- `node.pending.pull` et `node.pending.ack` sont les API de file d’attente des nœuds connectés.
- `node.pending.enqueue` et `node.pending.drain` gèrent le travail en attente durable
  pour les nœuds hors ligne/déconnectés.

#### Familles d’approbation

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list` et
  `exec.approval.resolve` couvrent les requêtes d’approbation exec ponctuelles ainsi que la
  recherche/relecture des approbations en attente.
- `exec.approval.waitDecision` attend une approbation exec en attente et renvoie
  la décision finale (ou `null` en cas de délai d’attente).
- `exec.approvals.get` et `exec.approvals.set` gèrent les instantanés de politique
  d’approbation exec de Gateway.
- `exec.approvals.node.get` et `exec.approvals.node.set` gèrent la politique locale exec
  d’approbation de nœud via des commandes de relais de nœud.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision` et `plugin.approval.resolve` couvrent
  les flux d’approbation définis par Plugin.

#### Autres familles principales

- automatisation :
  - `wake` planifie une injection de texte immédiate ou au prochain Heartbeat
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- skills/outils : `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### Familles d’événements courantes

- `chat` : mises à jour de chat UI telles que `chat.inject` et autres événements
  de chat limités à la transcription.
- `session.message` et `session.tool` : mises à jour du flux de transcription/événements pour une
  session abonnée.
- `sessions.changed` : l’index de session ou les métadonnées ont changé.
- `presence` : mises à jour de l’instantané de présence système.
- `tick` : événement périodique de keepalive / vivacité.
- `health` : mise à jour de l’instantané de santé Gateway.
- `heartbeat` : mise à jour du flux d’événements Heartbeat.
- `cron` : événement de changement d’exécution/de tâche Cron.
- `shutdown` : notification d’arrêt de Gateway.
- `node.pair.requested` / `node.pair.resolved` : cycle de vie d’appairage de nœud.
- `node.invoke.request` : diffusion d’une requête d’invocation de nœud.
- `device.pair.requested` / `device.pair.resolved` : cycle de vie d’appareil appairé.
- `voicewake.changed` : la configuration des déclencheurs de mot de réveil a changé.
- `exec.approval.requested` / `exec.approval.resolved` : cycle de vie
  d’approbation exec.
- `plugin.approval.requested` / `plugin.approval.resolved` : cycle de vie
  d’approbation de Plugin.

### Méthodes helper de nœud

- Les nœuds peuvent appeler `skills.bins` pour récupérer la liste actuelle des exécutables de Skills
  pour les vérifications d’auto-autorisation.

### Méthodes helper d’opérateur

- Les opérateurs peuvent appeler `commands.list` (`operator.read`) pour récupérer l’inventaire
  des commandes d’exécution pour un agent.
  - `agentId` est facultatif ; omettez-le pour lire le workspace de l’agent par défaut.
  - `scope` contrôle la surface ciblée par le `name` principal :
    - `text` renvoie le jeton de commande texte principal sans le `/` initial
    - `native` et le chemin par défaut `both` renvoient des noms natifs sensibles au fournisseur
      lorsqu’ils sont disponibles
  - `textAliases` contient des alias slash exacts tels que `/model` et `/m`.
  - `nativeName` contient le nom de commande natif sensible au fournisseur lorsqu’il existe.
  - `provider` est facultatif et n’affecte que le nommage natif ainsi que la disponibilité des
    commandes Plugin natives.
  - `includeArgs=false` omet les métadonnées d’arguments sérialisées de la réponse.
- Les opérateurs peuvent appeler `tools.catalog` (`operator.read`) pour récupérer le catalogue d’outils d’exécution pour un
  agent. La réponse inclut des outils groupés et des métadonnées de provenance :
  - `source` : `core` ou `plugin`
  - `pluginId` : propriétaire Plugin lorsque `source="plugin"`
  - `optional` : indique si un outil de Plugin est facultatif
- Les opérateurs peuvent appeler `tools.effective` (`operator.read`) pour récupérer l’inventaire effectif
  des outils d’exécution pour une session.
  - `sessionKey` est obligatoire.
  - La Gateway dérive un contexte d’exécution approuvé côté serveur à partir de la session au lieu d’accepter
    un contexte d’authentification ou de livraison fourni par l’appelant.
  - La réponse est limitée à la session et reflète ce que la conversation active peut utiliser
    maintenant, y compris les outils du noyau, de Plugin et de canal.
- Les opérateurs peuvent appeler `skills.status` (`operator.read`) pour récupérer l’inventaire visible
  de Skills pour un agent.
  - `agentId` est facultatif ; omettez-le pour lire le workspace de l’agent par défaut.
  - La réponse inclut l’éligibilité, les exigences manquantes, les vérifications de configuration et
    les options d’installation nettoyées sans exposer les valeurs secrètes brutes.
- Les opérateurs peuvent appeler `skills.search` et `skills.detail` (`operator.read`) pour les métadonnées
  de découverte ClawHub.
- Les opérateurs peuvent appeler `skills.install` (`operator.admin`) dans deux modes :
  - mode ClawHub : `{ source: "clawhub", slug, version?, force? }` installe un
    dossier de skill dans le répertoire `skills/` du workspace de l’agent par défaut.
  - mode installateur Gateway : `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    exécute une action déclarée `metadata.openclaw.install` sur l’hôte Gateway.
- Les opérateurs peuvent appeler `skills.update` (`operator.admin`) dans deux modes :
  - le mode ClawHub met à jour un slug suivi ou toutes les installations ClawHub suivies dans
    le workspace de l’agent par défaut.
  - le mode config modifie par patch les valeurs de `skills.entries.<skillKey>` telles que `enabled`,
    `apiKey` et `env`.

## Approbations exec

- Lorsqu’une requête exec a besoin d’une approbation, la Gateway diffuse `exec.approval.requested`.
- Les clients opérateur résolvent cela en appelant `exec.approval.resolve` (nécessite la portée `operator.approvals`).
- Pour `host=node`, `exec.approval.request` doit inclure `systemRunPlan` (`argv`/`cwd`/`rawCommand`/métadonnées de session canoniques). Les requêtes sans `systemRunPlan` sont rejetées.
- Après approbation, les appels transférés `node.invoke system.run` réutilisent ce
  `systemRunPlan` canonique comme contexte faisant autorité pour commande/cwd/session.
- Si un appelant modifie `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` entre `prepare` et le transfert final approuvé de `system.run`, la
  Gateway rejette l’exécution au lieu de faire confiance à la charge utile modifiée.

## Repli de livraison d’agent

- Les requêtes `agent` peuvent inclure `deliver=true` pour demander une livraison sortante.
- `bestEffortDeliver=false` conserve un comportement strict : les cibles de livraison non résolues ou internes uniquement renvoient `INVALID_REQUEST`.
- `bestEffortDeliver=true` autorise un repli vers une exécution limitée à la session lorsqu’aucune route de livraison externe ne peut être résolue (par exemple sessions internes/webchat ou configurations multicanales ambiguës).

## Gestion des versions

- `PROTOCOL_VERSION` se trouve dans `src/gateway/protocol/schema/protocol-schemas.ts`.
- Les clients envoient `minProtocol` + `maxProtocol` ; le serveur rejette les incompatibilités.
- Les schémas + modèles sont générés à partir des définitions TypeBox :
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes client

Le client de référence dans `src/gateway/client.ts` utilise ces valeurs par défaut. Elles sont
stables sur le protocole v3 et constituent la base attendue pour les clients tiers.

| Constante                                 | Par défaut                                            | Source                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Délai d’attente de requête (par RPC)      | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Délai d’attente préauth / connect-challenge | `10_000` ms                                         | `src/gateway/handshake-timeouts.ts` (limite `250`–`10_000`) |
| Backoff de reconnexion initial            | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Backoff de reconnexion maximal            | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Limite de nouvelle tentative rapide après fermeture par jeton d’appareil | `250` ms                            | `src/gateway/client.ts`                                    |
| Délai de grâce avant `terminate()` forcé  | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Délai d’attente par défaut de `stopAndWait()` | `1_000` ms                                        | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Intervalle `tick` par défaut (avant `hello-ok`) | `30_000` ms                                     | `src/gateway/client.ts`                                    |
| Fermeture pour expiration du `tick`       | code `4000` lorsque le silence dépasse `tickIntervalMs * 2` | `src/gateway/client.ts`                             |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 Mo)                            | `src/gateway/server-constants.ts`                          |

Le serveur annonce les valeurs effectives `policy.tickIntervalMs`, `policy.maxPayload`
et `policy.maxBufferedBytes` dans `hello-ok` ; les clients doivent respecter ces valeurs
plutôt que les valeurs par défaut avant la poignée de main.

## Authentification

- L’authentification Gateway par secret partagé utilise `connect.params.auth.token` ou
  `connect.params.auth.password`, selon le mode d’authentification configuré.
- Les modes porteurs d’identité comme Tailscale Serve
  (`gateway.auth.allowTailscale: true`) ou le mode non-loopback
  `gateway.auth.mode: "trusted-proxy"` satisfont la vérification d’authentification de connexion à partir
  des en-têtes de requête plutôt que de `connect.params.auth.*`.
- Le mode d’ingress privé `gateway.auth.mode: "none"` ignore entièrement l’authentification de connexion
  par secret partagé ; n’exposez pas ce mode sur un ingress public/non approuvé.
- Après l’appairage, la Gateway émet un **jeton d’appareil** borné au rôle + aux portées de la
  connexion. Il est renvoyé dans `hello-ok.auth.deviceToken` et doit être
  persisté par le client pour les connexions futures.
- Les clients doivent persister le `hello-ok.auth.deviceToken` principal après toute
  connexion réussie.
- Une reconnexion avec ce jeton d’appareil **stocké** doit également réutiliser l’ensemble de portées approuvées
  stocké pour ce jeton. Cela préserve l’accès lecture/sondage/état qui a déjà été accordé
  et évite de réduire silencieusement les reconnexions à une
  portée implicite plus étroite, limitée à l’administration.
- Assemblage côté client de l’authentification de connexion (`selectConnectAuth` dans
  `src/gateway/client.ts`) :
  - `auth.password` est orthogonal et est toujours transféré lorsqu’il est défini.
  - `auth.token` est renseigné par ordre de priorité : d’abord un jeton partagé explicite,
    puis un `deviceToken` explicite, puis un jeton par appareil stocké (indexé par
    `deviceId` + `role`).
  - `auth.bootstrapToken` n’est envoyé que si aucun des éléments ci-dessus n’a résolu un
    `auth.token`. Un jeton partagé ou tout jeton d’appareil résolu le supprime.
  - La promotion automatique d’un jeton d’appareil stocké lors de l’unique
    nouvelle tentative `AUTH_TOKEN_MISMATCH` est limitée aux **points de terminaison approuvés uniquement** —
    loopback, ou `wss://` avec `tlsFingerprint` épinglé. Un `wss://` public
    sans épinglage n’est pas admissible.
- Les entrées supplémentaires `hello-ok.auth.deviceTokens` sont des jetons de transfert d’amorçage.
  Ne les persistez que lorsque la connexion a utilisé une authentification d’amorçage sur un transport approuvé
  tel que `wss://` ou loopback/appairage local.
- Si un client fournit un `deviceToken` **explicite** ou des `scopes` explicites, cet
  ensemble de portées demandé par l’appelant reste faisant autorité ; les portées mises en cache ne sont
  réutilisées que lorsque le client réutilise le jeton par appareil stocké.
- Les jetons d’appareil peuvent être tournés/révoqués via `device.token.rotate` et
  `device.token.revoke` (nécessite la portée `operator.pairing`).
- L’émission/la rotation de jeton reste bornée à l’ensemble de rôles approuvés enregistré dans
  l’entrée d’appairage de cet appareil ; la rotation d’un jeton ne peut pas étendre l’appareil à un
  rôle que l’approbation d’appairage n’a jamais accordé.
- Pour les sessions de jeton d’appareil appairé, la gestion des appareils est limitée à soi-même sauf si l’appelant
  dispose également de `operator.admin` : les appelants non administrateurs ne peuvent supprimer/révoquer/faire tourner
  que **leur propre** entrée d’appareil.
- `device.token.rotate` vérifie également l’ensemble de portées opérateur demandé par rapport aux
  portées de session actuelles de l’appelant. Les appelants non administrateurs ne peuvent pas faire tourner un jeton vers
  un ensemble de portées opérateur plus large que celui qu’ils détiennent déjà.
- Les échecs d’authentification incluent `error.details.code` plus des indications de récupération :
  - `error.details.canRetryWithDeviceToken` (booléen)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportement du client pour `AUTH_TOKEN_MISMATCH` :
  - Les clients approuvés peuvent tenter une nouvelle tentative bornée avec un jeton par appareil mis en cache.
  - Si cette nouvelle tentative échoue, les clients doivent arrêter les boucles de reconnexion automatiques et afficher des indications d’action à l’opérateur.

## Identité d’appareil + appairage

- Les nœuds doivent inclure une identité d’appareil stable (`device.id`) dérivée de l’empreinte
  d’une paire de clés.
- Les Gateways émettent des jetons par appareil + rôle.
- Les approbations d’appairage sont requises pour les nouveaux ID d’appareil, sauf si l’approbation automatique locale
  est activée.
- L’approbation automatique d’appairage est centrée sur les connexions loopback locales directes.
- OpenClaw dispose également d’un chemin étroit d’auto-connexion local backend/conteneur pour
  les flux helper approuvés à secret partagé.
- Les connexions tailnet ou LAN du même hôte sont toujours traitées comme distantes pour l’appairage et
  nécessitent une approbation.
- Tous les clients WS doivent inclure l’identité `device` pendant `connect` (operator + node).
  Control UI peut l’omettre uniquement dans ces modes :
  - `gateway.controlUi.allowInsecureAuth=true` pour la compatibilité HTTP non sécurisée localhost uniquement.
  - authentification opérateur Control UI réussie avec `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (solution de dernier recours, forte dégradation de sécurité).
- Toutes les connexions doivent signer le nonce `connect.challenge` fourni par le serveur.

### Diagnostics de migration d’authentification d’appareil

Pour les clients hérités qui utilisent encore le comportement de signature antérieur au challenge, `connect` renvoie maintenant
des codes de détail `DEVICE_AUTH_*` sous `error.details.code` avec un `error.details.reason` stable.

Échecs de migration courants :

| Message                     | details.code                     | details.reason           | Signification                                      |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Le client a omis `device.nonce` (ou l’a envoyé vide). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Le client a signé avec un nonce périmé/incorrect.  |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | La charge utile de signature ne correspond pas à la charge utile v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | L’horodatage signé est hors de la dérive autorisée. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` ne correspond pas à l’empreinte de la clé publique. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Le format/la canonisation de la clé publique a échoué. |

Cible de migration :

- Toujours attendre `connect.challenge`.
- Signer la charge utile v2 qui inclut le nonce serveur.
- Envoyer le même nonce dans `connect.params.device.nonce`.
- La charge utile de signature préférée est `v3`, qui lie `platform` et `deviceFamily`
  en plus des champs appareil/client/rôle/portées/jeton/nonce.
- Les signatures héritées `v2` restent acceptées pour compatibilité, mais l’épinglage des métadonnées
  d’appareil appairé continue de contrôler la politique de commande lors de la reconnexion.

## TLS + épinglage

- TLS est pris en charge pour les connexions WS.
- Les clients peuvent facultativement épingler l’empreinte du certificat Gateway (voir la
  configuration `gateway.tls` ainsi que `gateway.remote.tlsFingerprint` ou la CLI `--tls-fingerprint`).

## Portée

Ce protocole expose l’**API Gateway complète** (état, canaux, modèles, chat,
agent, sessions, nœuds, approbations, etc.). La surface exacte est définie par les
schémas TypeBox dans `src/gateway/protocol/schema.ts`.
