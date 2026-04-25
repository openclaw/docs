---
read_when:
    - Implémenter ou mettre à jour des clients WS Gateway
    - Déboguer les incompatibilités de protocole ou les échecs de connexion
    - Régénérer le schéma/les modèles du protocole
summary: 'Protocole WebSocket Gateway : handshake, trames, gestion des versions'
title: Protocole Gateway
x-i18n:
    generated_at: "2026-04-25T13:48:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03f729a1ee755cdd8a8dd1fef5ae1cb0111ec16818bd9080acd2ab0ca2dbc677
    source_path: gateway/protocol.md
    workflow: 15
---

Le protocole WS du Gateway est le **plan de contrôle unique + transport de nœud** pour
OpenClaw. Tous les clients (CLI, interface web, application macOS, nœuds iOS/Android, nœuds headless)
se connectent via WebSocket et déclarent leur **rôle** + **portée** au
moment du handshake.

## Transport

- WebSocket, trames texte avec charge utile JSON.
- La première trame **doit** être une requête `connect`.
- Les trames avant connexion sont plafonnées à 64 Kio. Après un handshake réussi, les clients
  doivent respecter les limites `hello-ok.policy.maxPayload` et
  `hello-ok.policy.maxBufferedBytes`. Avec les diagnostics activés,
  les trames entrantes surdimensionnées et les tampons de sortie lents émettent des événements `payload.large`
  avant que le gateway ferme ou abandonne la trame concernée. Ces événements conservent
  les tailles, limites, surfaces et codes de raison sûrs. Ils ne conservent pas le corps du message,
  le contenu des pièces jointes, le corps brut de la trame, les jetons, cookies ou valeurs secrètes.

## Handshake (connect)

Gateway → Client (défi avant connexion) :

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Client → Gateway :

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

Gateway → Client :

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
signale le rôle/scopes négociés lorsqu’ils sont disponibles, et inclut `deviceToken`
lorsque le gateway en émet un.

Lorsqu’aucun jeton d’appareil n’est émis, `hello-ok.auth` peut quand même signaler les
autorisations négociées :

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Lorsqu’un jeton d’appareil est émis, `hello-ok` inclut également :

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Pendant le transfert bootstrap de confiance, `hello-ok.auth` peut aussi inclure des entrées de rôle bornées supplémentaires dans `deviceTokens` :

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

Pour le flux bootstrap intégré node/operator, le jeton principal du nœud reste à
`scopes: []` et tout jeton opérateur transféré reste borné à la liste d’autorisation
de l’opérateur bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Les vérifications de scope bootstrap restent
préfixées par rôle : les entrées opérateur ne satisfont que les requêtes opérateur, et les rôles non opérateur
ont toujours besoin de scopes sous leur propre préfixe de rôle.

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

- **Requête** : `{type:"req", id, method, params}`
- **Réponse** : `{type:"res", id, ok, payload|error}`
- **Événement** : `{type:"event", event, payload, seq?, stateVersion?}`

Les méthodes avec effets de bord exigent des **clés d’idempotence** (voir le schéma).

## Rôles + scopes

### Rôles

- `operator` = client de plan de contrôle (CLI/UI/automatisation).
- `node` = hôte de capacité (camera/screen/canvas/system.run).

### Scopes (operator)

Scopes courants :

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` avec `includeSecrets: true` exige `operator.talk.secrets`
(ou `operator.admin`).

Les méthodes RPC gateway enregistrées par des Plugin peuvent demander leur propre scope opérateur, mais
les préfixes admin réservés du cœur (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) se résolvent toujours en `operator.admin`.

Le scope de méthode n’est que le premier filtre. Certaines commandes slash atteintes via
`chat.send` appliquent des contrôles plus stricts au niveau de la commande par-dessus. Par exemple, les écritures persistantes
`/config set` et `/config unset` exigent `operator.admin`.

`node.pair.approve` a aussi une vérification de scope supplémentaire au moment de l’approbation en plus du scope de méthode de base :

- requêtes sans commande : `operator.pairing`
- requêtes avec commandes de nœud autres que exec : `operator.pairing` + `operator.write`
- requêtes qui incluent `system.run`, `system.run.prepare` ou `system.which` :
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Les nœuds déclarent des revendications de capacité au moment de `connect` :

- `caps` : catégories de capacité de haut niveau.
- `commands` : liste d’autorisation de commandes pour l’invocation.
- `permissions` : bascules granulaires (par ex. `screen.record`, `camera.capture`).

Le Gateway traite celles-ci comme des **revendications** et applique des listes d’autorisation côté serveur.

## Présence

- `system-presence` renvoie des entrées indexées par identité d’appareil.
- Les entrées de présence incluent `deviceId`, `roles` et `scopes` afin que les UI puissent afficher une seule ligne par appareil
  même lorsqu’il se connecte à la fois comme **operator** et **node**.

## Portée des événements de diffusion

Les événements de diffusion WebSocket poussés par le serveur sont filtrés par scope afin que les sessions limitées à l’appairage ou aux nœuds ne reçoivent pas passivement le contenu des sessions.

- Les **trames de chat, agent et résultat d’outil** (y compris les événements `agent` diffusés en flux et les résultats d’appel d’outil) exigent au moins `operator.read`. Les sessions sans `operator.read` ignorent entièrement ces trames.
- Les **diffusions `plugin.*` définies par des Plugin** sont filtrées vers `operator.write` ou `operator.admin`, selon la façon dont le Plugin les a enregistrées.
- Les **événements de statut et de transport** (`heartbeat`, `presence`, `tick`, cycle de vie connect/disconnect, etc.) restent sans restriction afin que l’état de santé du transport reste observable par chaque session authentifiée.
- Les **familles d’événements de diffusion inconnues** sont filtrées par scope par défaut (fail-closed) sauf si un gestionnaire enregistré les assouplit explicitement.

Chaque connexion client conserve son propre numéro de séquence par client afin que les diffusions préservent un ordre monotone sur ce socket même lorsque différents clients voient des sous-ensembles filtrés par scope différents du flux d’événements.

## Familles courantes de méthodes RPC

La surface WS publique est plus large que les exemples handshake/auth ci-dessus. Ce
n’est pas un dump généré — `hello-ok.features.methods` est une liste de découverte
prudente construite à partir de `src/gateway/server-methods-list.ts` plus les exports
de méthodes Plugin/canal chargées. Considérez-la comme une découverte de fonctionnalités, pas comme une énumération complète de `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Système et identité">
    - `health` renvoie le snapshot d’état du gateway mis en cache ou fraîchement sondé.
    - `diagnostics.stability` renvoie l’enregistreur borné récent de stabilité diagnostique. Il conserve des métadonnées opérationnelles telles que noms d’événements, comptes, tailles en octets, mesures mémoire, état de file/session, noms de canal/Plugin et identifiants de session. Il ne conserve pas le texte du chat, les corps de Webhook, les sorties d’outil, les corps bruts de requête ou de réponse, les jetons, cookies ou valeurs secrètes. Le scope operator.read est requis.
    - `status` renvoie le résumé du gateway de type `/status` ; les champs sensibles ne sont inclus que pour les clients opérateur avec scope admin.
    - `gateway.identity.get` renvoie l’identité d’appareil du gateway utilisée par les flux relay et pairing.
    - `system-presence` renvoie le snapshot de présence actuel pour les appareils operator/node connectés.
    - `system-event` ajoute un événement système et peut mettre à jour/diffuser le contexte de présence.
    - `last-heartbeat` renvoie le dernier événement heartbeat conservé.
    - `set-heartbeats` active ou désactive le traitement heartbeat sur le gateway.
  </Accordion>

  <Accordion title="Modèles et usage">
    - `models.list` renvoie le catalogue de modèles autorisés à l’exécution.
    - `usage.status` renvoie les fenêtres d’usage des fournisseurs / les résumés de quota restant.
    - `usage.cost` renvoie les résumés agrégés de coût d’usage pour une plage de dates.
    - `doctor.memory.status` renvoie l’état de préparation de la mémoire vectorielle / des embeddings pour l’espace de travail actif de l’agent par défaut.
    - `sessions.usage` renvoie les résumés d’usage par session.
    - `sessions.usage.timeseries` renvoie les séries temporelles d’usage pour une session.
    - `sessions.usage.logs` renvoie les entrées du journal d’usage pour une session.
  </Accordion>

  <Accordion title="Canaux et assistants de connexion">
    - `channels.status` renvoie les résumés d’état des canaux/Plugins intégrés + fournis.
    - `channels.logout` déconnecte un canal/compte spécifique là où le canal prend en charge la déconnexion.
    - `web.login.start` démarre un flux de connexion QR/web pour le fournisseur de canal web actuel prenant en charge QR.
    - `web.login.wait` attend la fin de ce flux de connexion QR/web et démarre le canal en cas de succès.
    - `push.test` envoie un push APNs de test à un nœud iOS enregistré.
    - `voicewake.get` renvoie les déclencheurs de mot de réveil stockés.
    - `voicewake.set` met à jour les déclencheurs de mot de réveil et diffuse le changement.
  </Accordion>

  <Accordion title="Messagerie et journaux">
    - `send` est la RPC de livraison sortante directe pour les envois ciblés par canal/compte/fil en dehors du runner de chat.
    - `logs.tail` renvoie la fin du journal de fichier gateway configuré avec contrôles de curseur/limite et d’octets max.
  </Accordion>

  <Accordion title="Talk et TTS">
    - `talk.config` renvoie la charge utile effective de configuration Talk ; `includeSecrets` exige `operator.talk.secrets` (ou `operator.admin`).
    - `talk.mode` définit/diffuse l’état actuel du mode Talk pour les clients WebChat/Control UI.
    - `talk.speak` synthétise la parole via le fournisseur de parole Talk actif.
    - `tts.status` renvoie l’état activé du TTS, le fournisseur actif, les fournisseurs de repli et l’état de configuration du fournisseur.
    - `tts.providers` renvoie l’inventaire visible des fournisseurs TTS.
    - `tts.enable` et `tts.disable` activent ou désactivent l’état des préférences TTS.
    - `tts.setProvider` met à jour le fournisseur TTS préféré.
    - `tts.convert` exécute une conversion texte-parole ponctuelle.
  </Accordion>

  <Accordion title="Secrets, configuration, mise à jour et assistant">
    - `secrets.reload` relance la résolution des SecretRef actifs et ne remplace l’état secret d’exécution qu’en cas de succès complet.
    - `secrets.resolve` résout les affectations de secrets ciblées par commande pour un ensemble spécifique commande/cible.
    - `config.get` renvoie le snapshot et le hash de la configuration actuelle.
    - `config.set` écrit une charge utile de configuration validée.
    - `config.patch` fusionne une mise à jour partielle de configuration.
    - `config.apply` valide puis remplace la charge utile complète de configuration.
    - `config.schema` renvoie la charge utile du schéma de configuration live utilisée par Control UI et les outils CLI : schéma, `uiHints`, version et métadonnées de génération, y compris les métadonnées de schéma Plugin + canal lorsque l’exécution peut les charger. Le schéma inclut les métadonnées de champ `title` / `description` dérivées des mêmes libellés et textes d’aide utilisés par l’UI, y compris pour les objets imbriqués, jokers, éléments de tableau et branches de composition `anyOf` / `oneOf` / `allOf` lorsque la documentation de champ correspondante existe.
    - `config.schema.lookup` renvoie une charge utile de recherche limitée à un chemin pour un chemin de configuration : chemin normalisé, nœud de schéma superficiel, indice correspondant + `hintPath`, et résumés immédiats des enfants pour le drill-down UI/CLI. Les nœuds de schéma lookup conservent la documentation visible par l’utilisateur et les champs de validation courants (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, bornes numériques/chaînes/tableaux/objets et indicateurs tels que `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Les résumés des enfants exposent `key`, `path` normalisé, `type`, `required`, `hasChildren`, ainsi que l’`hint` / `hintPath` correspondant.
    - `update.run` exécute le flux de mise à jour du gateway et ne planifie un redémarrage que lorsque la mise à jour elle-même a réussi.
    - `wizard.start`, `wizard.next`, `wizard.status` et `wizard.cancel` exposent l’assistant de configuration initiale via WS RPC.
  </Accordion>

  <Accordion title="Assistants d’agent et d’espace de travail">
    - `agents.list` renvoie les entrées d’agent configurées.
    - `agents.create`, `agents.update` et `agents.delete` gèrent les enregistrements d’agent et le câblage de l’espace de travail.
    - `agents.files.list`, `agents.files.get` et `agents.files.set` gèrent les fichiers bootstrap de l’espace de travail exposés pour un agent.
    - `agent.identity.get` renvoie l’identité effective de l’assistant pour un agent ou une session.
    - `agent.wait` attend la fin d’une exécution et renvoie le snapshot terminal lorsqu’il est disponible.
  </Accordion>

  <Accordion title="Contrôle de session">
    - `sessions.list` renvoie l’index actuel des sessions.
    - `sessions.subscribe` et `sessions.unsubscribe` activent ou désactivent les abonnements aux événements de changement de session pour le client WS courant.
    - `sessions.messages.subscribe` et `sessions.messages.unsubscribe` activent ou désactivent les abonnements aux événements de transcription/message pour une session.
    - `sessions.preview` renvoie des aperçus bornés de transcription pour des clés de session spécifiques.
    - `sessions.resolve` résout ou canonicalise une cible de session.
    - `sessions.create` crée une nouvelle entrée de session.
    - `sessions.send` envoie un message dans une session existante.
    - `sessions.steer` est la variante interruption-et-guidage pour une session active.
    - `sessions.abort` interrompt le travail actif pour une session.
    - `sessions.patch` met à jour les métadonnées/remplacements de session.
    - `sessions.reset`, `sessions.delete` et `sessions.compact` effectuent la maintenance des sessions.
    - `sessions.get` renvoie la ligne complète de session stockée.
    - L’exécution du chat utilise toujours `chat.history`, `chat.send`, `chat.abort` et `chat.inject`. `chat.history` est normalisé pour l’affichage côté UI : les balises de directive en ligne sont supprimées du texte visible, les charges utiles XML d’appel d’outil en texte brut (y compris `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` et les blocs d’appel d’outil tronqués) ainsi que les jetons de contrôle du modèle en ASCII/pleine largeur divulgués sont supprimés, les lignes assistant silencieuses pures comme `NO_REPLY` / `no_reply` exact sont omises, et les lignes surdimensionnées peuvent être remplacées par des espaces réservés.
  </Accordion>

  <Accordion title="Appairage d’appareils et jetons d’appareil">
    - `device.pair.list` renvoie les appareils appairés en attente et approuvés.
    - `device.pair.approve`, `device.pair.reject` et `device.pair.remove` gèrent les enregistrements d’appairage d’appareil.
    - `device.token.rotate` fait tourner un jeton d’appareil appairé dans les limites approuvées de rôle et de scope.
    - `device.token.revoke` révoque un jeton d’appareil appairé.
  </Accordion>

  <Accordion title="Appairage de nœud, invocation et travail en attente">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject` et `node.pair.verify` couvrent l’appairage de nœud et la vérification bootstrap.
    - `node.list` et `node.describe` renvoient l’état des nœuds connus/connectés.
    - `node.rename` met à jour un libellé de nœud appairé.
    - `node.invoke` transmet une commande à un nœud connecté.
    - `node.invoke.result` renvoie le résultat d’une requête d’invocation.
    - `node.event` transporte les événements d’origine nœud vers le gateway.
    - `node.canvas.capability.refresh` rafraîchit les jetons de capacité canvas limités.
    - `node.pending.pull` et `node.pending.ack` sont les API de file pour nœuds connectés.
    - `node.pending.enqueue` et `node.pending.drain` gèrent le travail durable en attente pour les nœuds hors ligne/déconnectés.
  </Accordion>

  <Accordion title="Familles d’approbation">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` et `exec.approval.resolve` couvrent les requêtes ponctuelles d’approbation exec ainsi que la recherche/relecture des approbations en attente.
    - `exec.approval.waitDecision` attend une approbation exec en attente et renvoie la décision finale (ou `null` en cas de délai d’attente).
    - `exec.approvals.get` et `exec.approvals.set` gèrent les snapshots de politique d’approbation exec du gateway.
    - `exec.approvals.node.get` et `exec.approvals.node.set` gèrent la politique locale d’approbation exec du nœud via des commandes de relais node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` et `plugin.approval.resolve` couvrent les flux d’approbation définis par des Plugin.
  </Accordion>

  <Accordion title="Automatisation, Skills et outils">
    - Automatisation : `wake` planifie une injection de texte de réveil immédiate ou au prochain heartbeat ; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gèrent le travail planifié.
    - Skills et outils : `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.
  </Accordion>
</AccordionGroup>

### Familles courantes d’événements

- `chat` : mises à jour de chat UI telles que `chat.inject` et autres
  événements de chat limités à la transcription.
- `session.message` et `session.tool` : mises à jour de transcription/flux d’événements pour une
  session abonnée.
- `sessions.changed` : l’index ou les métadonnées des sessions ont changé.
- `presence` : mises à jour de snapshot de présence système.
- `tick` : événement périodique de keepalive / signal de vie.
- `health` : mise à jour du snapshot d’état du gateway.
- `heartbeat` : mise à jour du flux d’événements Heartbeat.
- `cron` : événement de changement d’exécution/tâche cron.
- `shutdown` : notification d’arrêt du gateway.
- `node.pair.requested` / `node.pair.resolved` : cycle de vie de l’appairage de nœud.
- `node.invoke.request` : diffusion d’une requête d’invocation de nœud.
- `device.pair.requested` / `device.pair.resolved` : cycle de vie d’un appareil appairé.
- `voicewake.changed` : la configuration des déclencheurs de mot de réveil a changé.
- `exec.approval.requested` / `exec.approval.resolved` : cycle de vie de l’approbation exec.
- `plugin.approval.requested` / `plugin.approval.resolved` : cycle de vie de l’approbation de Plugin.

### Méthodes d’assistance pour nœud

- Les nœuds peuvent appeler `skills.bins` pour récupérer la liste actuelle des exécutables de Skills
  pour les vérifications d’auto-autorisation.

### Méthodes d’assistance pour operator

- Les operators peuvent appeler `commands.list` (`operator.read`) pour récupérer l’inventaire des
  commandes d’exécution pour un agent.
  - `agentId` est facultatif ; omettez-le pour lire l’espace de travail de l’agent par défaut.
  - `scope` contrôle quelle surface la `name` primaire cible :
    - `text` renvoie le jeton de commande texte primaire sans le `/` initial
    - `native` et le chemin `both` par défaut renvoient les noms natifs tenant compte du fournisseur
      lorsqu’ils sont disponibles
  - `textAliases` transporte les alias slash exacts tels que `/model` et `/m`.
  - `nativeName` transporte le nom de commande native tenant compte du fournisseur lorsqu’il existe.
  - `provider` est facultatif et n’affecte que le nommage natif plus la disponibilité des commandes natives de Plugin.
  - `includeArgs=false` omet les métadonnées d’arguments sérialisées de la réponse.
- Les operators peuvent appeler `tools.catalog` (`operator.read`) pour récupérer le catalogue d’outils d’exécution d’un
  agent. La réponse inclut des outils groupés et des métadonnées de provenance :
  - `source` : `core` ou `plugin`
  - `pluginId` : propriétaire du Plugin lorsque `source="plugin"`
  - `optional` : indique si un outil de Plugin est facultatif
- Les operators peuvent appeler `tools.effective` (`operator.read`) pour récupérer l’inventaire effectif d’outils
  d’exécution pour une session.
  - `sessionKey` est requis.
  - Le gateway dérive le contexte d’exécution de confiance depuis la session côté serveur au lieu d’accepter
    un contexte d’authentification ou de livraison fourni par l’appelant.
  - La réponse est limitée à la session et reflète ce que la conversation active peut utiliser maintenant,
    y compris les outils core, Plugin et canal.
- Les operators peuvent appeler `skills.status` (`operator.read`) pour récupérer l’inventaire visible des
  Skills pour un agent.
  - `agentId` est facultatif ; omettez-le pour lire l’espace de travail de l’agent par défaut.
  - La réponse inclut l’éligibilité, les exigences manquantes, les vérifications de configuration et des
    options d’installation assainies sans exposer de valeurs secrètes brutes.
- Les operators peuvent appeler `skills.search` et `skills.detail` (`operator.read`) pour les métadonnées
  de découverte ClawHub.
- Les operators peuvent appeler `skills.install` (`operator.admin`) en deux modes :
  - Mode ClawHub : `{ source: "clawhub", slug, version?, force? }` installe un
    dossier de Skills dans le répertoire `skills/` de l’espace de travail de l’agent par défaut.
  - Mode installateur Gateway : `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    exécute une action déclarée `metadata.openclaw.install` sur l’hôte Gateway.
- Les operators peuvent appeler `skills.update` (`operator.admin`) en deux modes :
  - Le mode ClawHub met à jour un slug suivi ou toutes les installations ClawHub suivies dans
    l’espace de travail de l’agent par défaut.
  - Le mode configuration modifie les valeurs de `skills.entries.<skillKey>` telles que `enabled`,
    `apiKey` et `env`.

## Approbations exec

- Lorsqu’une requête exec nécessite une approbation, le gateway diffuse `exec.approval.requested`.
- Les clients operator la résolvent en appelant `exec.approval.resolve` (nécessite le scope `operator.approvals`).
- Pour `host=node`, `exec.approval.request` doit inclure `systemRunPlan` (canonique `argv`/`cwd`/`rawCommand`/métadonnées de session). Les requêtes sans `systemRunPlan` sont rejetées.
- Après approbation, les appels transmis `node.invoke system.run` réutilisent ce `systemRunPlan`
  canonique comme contexte faisant autorité pour commande/cwd/session.
- Si un appelant modifie `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` entre la préparation et le transfert final approuvé `system.run`, le
  gateway rejette l’exécution au lieu de faire confiance à la charge utile modifiée.

## Repli de livraison d’agent

- Les requêtes `agent` peuvent inclure `deliver=true` pour demander une livraison sortante.
- `bestEffortDeliver=false` conserve un comportement strict : les cibles de livraison non résolues ou internes uniquement renvoient `INVALID_REQUEST`.
- `bestEffortDeliver=true` autorise le repli vers une exécution limitée à la session lorsqu’aucune route externe livrable ne peut être résolue (par exemple sessions internes/webchat ou configurations multi-canaux ambiguës).

## Gestion des versions

- `PROTOCOL_VERSION` se trouve dans `src/gateway/protocol/schema/protocol-schemas.ts`.
- Les clients envoient `minProtocol` + `maxProtocol` ; le serveur rejette les incompatibilités.
- Les schémas + modèles sont générés à partir des définitions TypeBox :
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes client

Le client de référence dans `src/gateway/client.ts` utilise ces valeurs par défaut. Les valeurs sont
stables sur le protocole v3 et constituent la base attendue pour les clients tiers.

| Constante                                 | Par défaut                                            | Source                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Délai d’attente des requêtes (par RPC)    | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Délai d’attente préauth / défi de connexion | `10_000` ms                                         | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Backoff initial de reconnexion            | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Backoff maximal de reconnexion            | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Clamp de tentative rapide après fermeture par jeton d’appareil | `250` ms                                 | `src/gateway/client.ts`                                    |
| Délai de grâce avant `terminate()` forcé  | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Délai par défaut de `stopAndWait()`       | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Intervalle de tick par défaut (avant `hello-ok`) | `30_000` ms                                     | `src/gateway/client.ts`                                    |
| Fermeture sur délai d’attente tick        | code `4000` lorsque le silence dépasse `tickIntervalMs * 2` | `src/gateway/client.ts`                              |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

Le serveur annonce les valeurs effectives de `policy.tickIntervalMs`, `policy.maxPayload`
et `policy.maxBufferedBytes` dans `hello-ok` ; les clients doivent respecter ces valeurs
plutôt que les valeurs par défaut avant handshake.

## Authentification

- L’authentification gateway par secret partagé utilise `connect.params.auth.token` ou
  `connect.params.auth.password`, selon le mode d’authentification configuré.
- Les modes porteurs d’identité tels que Tailscale Serve
  (`gateway.auth.allowTailscale: true`) ou `gateway.auth.mode: "trusted-proxy"`
  hors loopback satisfont la vérification d’authentification `connect` à partir des
  en-têtes de requête au lieu de `connect.params.auth.*`.
- Le mode d’entrée privée `gateway.auth.mode: "none"` ignore complètement l’authentification `connect` par secret partagé ; n’exposez pas ce mode sur une entrée publique/non fiable.
- Après appairage, le Gateway émet un **jeton d’appareil** limité au
  rôle + scopes de la connexion. Il est renvoyé dans `hello-ok.auth.deviceToken` et doit être
  conservé par le client pour les futures connexions.
- Les clients doivent conserver le `hello-ok.auth.deviceToken` principal après toute
  connexion réussie.
- La reconnexion avec ce **jeton d’appareil conservé** doit aussi réutiliser l’ensemble de scopes approuvé
  stocké pour ce jeton. Cela préserve l’accès read/probe/status
  déjà accordé et évite de réduire silencieusement les reconnexions à un
  scope implicite plus étroit limité à l’admin.
- Assemblage de l’authentification `connect` côté client (`selectConnectAuth` dans
  `src/gateway/client.ts`) :
  - `auth.password` est orthogonal et est toujours transmis lorsqu’il est défini.
  - `auth.token` est rempli dans cet ordre de priorité : secret partagé explicite d’abord,
    puis `deviceToken` explicite, puis jeton stocké par appareil (indexé par
    `deviceId` + `role`).
  - `auth.bootstrapToken` n’est envoyé que si aucune des valeurs ci-dessus n’a résolu
    un `auth.token`. Un secret partagé ou tout jeton d’appareil résolu le supprime.
  - L’auto-promotion d’un jeton d’appareil stocké lors de l’unique
    nouvelle tentative `AUTH_TOKEN_MISMATCH` est limitée aux **points de terminaison de confiance uniquement** —
    loopback, ou `wss://` avec `tlsFingerprint` épinglé. `wss://` public
    sans épinglage ne qualifie pas.
- Les entrées supplémentaires `hello-ok.auth.deviceTokens` sont des jetons de transfert bootstrap.
  Ne les conservez que lorsque la connexion a utilisé l’authentification bootstrap sur un transport de confiance
  tel que `wss://` ou loopback/appairage local.
- Si un client fournit un `deviceToken` **explicite** ou des `scopes` explicites, cet
  ensemble de scopes demandé par l’appelant reste autoritaire ; les scopes mis en cache ne sont
  réutilisés que lorsque le client réutilise le jeton stocké par appareil.
- Les jetons d’appareil peuvent être tournés/révoqués via `device.token.rotate` et
  `device.token.revoke` (nécessite le scope `operator.pairing`).
- L’émission/rotation de jeton reste bornée à l’ensemble de rôles approuvé enregistré dans
  l’entrée d’appairage de cet appareil ; la rotation d’un jeton ne peut pas élargir l’appareil vers un
  rôle que l’approbation d’appairage n’a jamais accordé.
- Pour les sessions de jeton d’appareil appairé, la gestion des appareils est limitée à soi-même sauf si l’appelant a aussi `operator.admin` : les appelants non-admin ne peuvent supprimer/révoquer/faire tourner que **leur propre** entrée d’appareil.
- `device.token.rotate` vérifie aussi l’ensemble de scopes operator demandé par rapport aux
  scopes de session actuels de l’appelant. Les appelants non-admin ne peuvent pas faire tourner un jeton vers
  un ensemble de scopes operator plus large que celui qu’ils détiennent déjà.
- Les échecs d’authentification incluent `error.details.code` plus des indications de récupération :
  - `error.details.canRetryWithDeviceToken` (booléen)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportement client pour `AUTH_TOKEN_MISMATCH` :
  - Les clients de confiance peuvent tenter une nouvelle tentative bornée avec un jeton mis en cache par appareil.
  - Si cette nouvelle tentative échoue, les clients doivent arrêter les boucles de reconnexion automatiques et afficher une indication d’action opérateur.

## Identité d’appareil + appairage

- Les nœuds doivent inclure une identité d’appareil stable (`device.id`) dérivée de l’empreinte d’une
  paire de clés.
- Les gateways émettent des jetons par appareil + rôle.
- Des approbations d’appairage sont requises pour les nouveaux identifiants d’appareil sauf si l’approbation automatique locale
  est activée.
- L’approbation automatique d’appairage est centrée sur les connexions directes locales loopback.
- OpenClaw possède aussi un chemin étroit d’auto-connexion backend/local au conteneur pour
  les flux d’assistance à secret partagé de confiance.
- Les connexions tailnet ou LAN sur le même hôte sont toujours traitées comme distantes pour l’appairage et
  nécessitent une approbation.
- Tous les clients WS doivent inclure l’identité `device` pendant `connect` (operator + node).
  Control UI peut l’omettre uniquement dans ces modes :
  - `gateway.controlUi.allowInsecureAuth=true` pour compatibilité HTTP non sécurisée localhost uniquement.
  - authentification operator Control UI réussie via `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, dégradation de sécurité sévère).
- Toutes les connexions doivent signer le nonce fourni par le serveur dans `connect.challenge`.

### Diagnostics de migration de l’authentification d’appareil

Pour les anciens clients qui utilisent encore le comportement de signature antérieur au défi, `connect` renvoie désormais
des codes de détail `DEVICE_AUTH_*` dans `error.details.code` avec une valeur stable `error.details.reason`.

Échecs de migration courants :

| Message                     | details.code                     | details.reason           | Signification                                         |
| --------------------------- | -------------------------------- | ------------------------ | ----------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Le client a omis `device.nonce` (ou l’a envoyé vide). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Le client a signé avec un nonce obsolète/incorrect.   |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | La charge utile de signature ne correspond pas à la charge utile v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | L’horodatage signé est hors du décalage autorisé.     |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` ne correspond pas à l’empreinte de la clé publique. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Le format/canonicalisation de la clé publique a échoué. |

Cible de migration :

- Attendez toujours `connect.challenge`.
- Signez la charge utile v2 qui inclut le nonce du serveur.
- Envoyez le même nonce dans `connect.params.device.nonce`.
- La charge utile de signature préférée est `v3`, qui lie `platform` et `deviceFamily`
  en plus des champs device/client/role/scopes/token/nonce.
- Les signatures `v2` héritées restent acceptées pour compatibilité, mais l’épinglage
  des métadonnées des appareils appairés contrôle toujours la politique de commande à la reconnexion.

## TLS + épinglage

- TLS est pris en charge pour les connexions WS.
- Les clients peuvent éventuellement épingler l’empreinte du certificat gateway (voir la configuration `gateway.tls`
  plus `gateway.remote.tlsFingerprint` ou la CLI `--tls-fingerprint`).

## Portée

Ce protocole expose l’**API complète du gateway** (status, channels, models, chat,
agent, sessions, nodes, approvals, etc.). La surface exacte est définie par les
schémas TypeBox dans `src/gateway/protocol/schema.ts`.

## Connexe

- [Protocole Bridge](/fr/gateway/bridge-protocol)
- [Runbook Gateway](/fr/gateway)
