---
read_when:
    - Implémentation ou mise à jour de clients WS Gateway
    - Débogage des incompatibilités de protocole ou des échecs de connexion
    - Régénération du schéma/des modèles du protocole
summary: 'Protocole WebSocket Gateway : handshake, trames, gestion de version'
title: Protocole Gateway
x-i18n:
    generated_at: "2026-04-26T11:30:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01f873c7051f2a462cbefb50331e04edfdcedadeda8b3d7b7320ceb2462edccc
    source_path: gateway/protocol.md
    workflow: 15
---

Le protocole WS Gateway est le **plan de contrôle unique + transport de nœud** pour
OpenClaw. Tous les clients (CLI, UI web, application macOS, nœuds iOS/Android, nœuds headless)
se connectent via WebSocket et déclarent leur **rôle** + **portée** au moment du
handshake.

## Transport

- WebSocket, trames texte avec charge utile JSON.
- La première trame **doit** être une requête `connect`.
- Les trames pré-connexion sont limitées à 64 Kio. Après un handshake réussi, les clients
  doivent respecter les limites `hello-ok.policy.maxPayload` et
  `hello-ok.policy.maxBufferedBytes`. Lorsque les diagnostics sont activés,
  les trames entrantes surdimensionnées et les buffers sortants lents émettent des événements
  `payload.large` avant que la Gateway ne ferme ou n’abandonne la trame concernée. Ces événements
  conservent les tailles, limites, surfaces et codes de raison sûrs. Ils ne conservent ni le corps du message,
  ni le contenu des pièces jointes, ni le corps brut de la trame, ni les jetons, cookies ou valeurs secrètes.

## Handshake (connect)

Gateway → Client (challenge pré-connexion) :

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

Lorsqu’aucun jeton de périphérique n’est émis, `hello-ok.auth` peut tout de même signaler les
autorisations négociées :

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Les clients backend de même processus de confiance (`client.id: "gateway-client"`,
`client.mode: "backend"`) peuvent omettre `device` sur les connexions loopback directes lorsqu’ils
s’authentifient avec le jeton/mot de passe partagé de la Gateway. Ce chemin est réservé
aux RPC internes du plan de contrôle et évite que des références obsolètes d’appairage CLI/périphérique
ne bloquent le travail backend local tel que les mises à jour de session de sous-agent. Les clients distants,
les clients d’origine navigateur, les clients nœuds et les clients explicites avec jeton d’appareil/identité d’appareil
utilisent toujours les vérifications normales d’appairage et d’élévation de portée.

Lorsqu’un jeton de périphérique est émis, `hello-ok` inclut aussi :

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Pendant le transfert d’amorçage de confiance, `hello-ok.auth` peut aussi inclure des entrées de rôle supplémentaires bornées dans `deviceTokens` :

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

Pour le flux d’amorçage nœud/opérateur intégré, le jeton principal du nœud reste
`scopes: []` et tout jeton opérateur transmis reste borné à la liste d’autorisation de l’opérateur d’amorçage
(`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Les vérifications de portée d’amorçage restent
préfixées par rôle : les entrées opérateur ne satisfont que les requêtes opérateur, et les rôles non opérateur
ont toujours besoin de portées sous leur propre préfixe de rôle.

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

## Encadrement

- **Requête** : `{type:"req", id, method, params}`
- **Réponse** : `{type:"res", id, ok, payload|error}`
- **Événement** : `{type:"event", event, payload, seq?, stateVersion?}`

Les méthodes à effets de bord nécessitent des **clés d’idempotence** (voir le schéma).

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

`talk.config` avec `includeSecrets: true` nécessite `operator.talk.secrets`
(ou `operator.admin`).

Les méthodes RPC Gateway enregistrées par des plugins peuvent demander leur propre portée opérateur, mais
les préfixes d’administration centrale réservés (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) sont toujours résolus vers `operator.admin`.

La portée de méthode n’est que la première barrière. Certaines commandes slash atteintes via
`chat.send` appliquent en plus des vérifications plus strictes au niveau de la commande. Par exemple, les écritures persistantes
`/config set` et `/config unset` nécessitent `operator.admin`.

`node.pair.approve` possède également une vérification de portée supplémentaire au moment de l’approbation, en plus de la portée de méthode de base :

- requêtes sans commande : `operator.pairing`
- requêtes avec commandes de nœud non exec : `operator.pairing` + `operator.write`
- requêtes incluant `system.run`, `system.run.prepare` ou `system.which` :
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Les nœuds déclarent leurs revendications de capacité au moment de la connexion :

- `caps` : catégories de capacités de haut niveau.
- `commands` : liste d’autorisation de commandes pour invoke.
- `permissions` : bascules granulaires (par ex. `screen.record`, `camera.capture`).

La Gateway traite celles-ci comme des **revendications** et applique des listes d’autorisation côté serveur.

## Présence

- `system-presence` renvoie des entrées indexées par identité de périphérique.
- Les entrées de présence incluent `deviceId`, `roles` et `scopes` afin que les UI puissent afficher une seule ligne par périphérique
  même lorsqu’il se connecte à la fois comme **operator** et **node**.

## Délimitation des événements de diffusion

Les événements de diffusion WebSocket poussés par le serveur sont protégés par portée afin que les sessions limitées à l’appairage ou uniquement nœud ne reçoivent pas passivement le contenu des sessions.

- Les **trames de chat, d’agent et de résultats d’outils** (y compris les événements `agent` diffusés en continu et les résultats d’appels d’outils) nécessitent au moins `operator.read`. Les sessions sans `operator.read` ignorent entièrement ces trames.
- Les **diffusions `plugin.*` définies par les plugins** sont protégées par `operator.write` ou `operator.admin`, selon la manière dont le plugin les a enregistrées.
- Les **événements d’état et de transport** (`heartbeat`, `presence`, `tick`, cycle de vie de connexion/déconnexion, etc.) restent sans restriction afin que l’état de santé du transport reste observable pour toute session authentifiée.
- Les **familles d’événements de diffusion inconnues** sont protégées par portée par défaut (échec en mode fermé), sauf si un gestionnaire enregistré les assouplit explicitement.

Chaque connexion client conserve son propre numéro de séquence par client afin que les diffusions préservent un ordre monotone sur ce socket même lorsque différents clients voient des sous-ensembles filtrés par portée différents du flux d’événements.

## Familles courantes de méthodes RPC

La surface WS publique est plus large que les exemples de handshake/authentification ci-dessus. Ce
n’est pas un dump généré — `hello-ok.features.methods` est une liste de
découverte conservative construite à partir de `src/gateway/server-methods-list.ts` plus les exportations de méthodes de plugins/canaux chargés. Traitez-la comme une découverte de fonctionnalités, et non comme une énumération complète de `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Système et identité">
    - `health` renvoie l’instantané de santé de la Gateway mis en cache ou nouvellement sondé.
    - `diagnostics.stability` renvoie l’enregistreur de stabilité diagnostique récent et borné. Il conserve des métadonnées opérationnelles telles que noms d’événements, décomptes, tailles en octets, mesures mémoire, état de file/session, noms de canaux/plugins et ID de session. Il ne conserve ni le texte de chat, ni les corps de webhook, ni les sorties d’outils, ni les corps bruts de requête ou de réponse, ni les jetons, cookies ou valeurs secrètes. La portée operator read est requise.
    - `status` renvoie le résumé Gateway de type `/status` ; les champs sensibles ne sont inclus que pour les clients opérateur avec portée admin.
    - `gateway.identity.get` renvoie l’identité de périphérique Gateway utilisée par les flux de relais et d’appairage.
    - `system-presence` renvoie l’instantané de présence actuel pour les périphériques operator/node connectés.
    - `system-event` ajoute un événement système et peut mettre à jour/diffuser le contexte de présence.
    - `last-heartbeat` renvoie le dernier événement Heartbeat persisté.
    - `set-heartbeats` active ou désactive le traitement des Heartbeat sur la Gateway.

  </Accordion>

  <Accordion title="Modèles et utilisation">
    - `models.list` renvoie le catalogue de modèles autorisés à l’exécution.
    - `usage.status` renvoie les fenêtres d’utilisation des fournisseurs et des résumés de quota restant.
    - `usage.cost` renvoie des résumés agrégés de coût d’utilisation pour une plage de dates.
    - `doctor.memory.status` renvoie l’état de préparation de la mémoire vectorielle / des embeddings pour l’espace de travail actif de l’agent par défaut.
    - `sessions.usage` renvoie des résumés d’utilisation par session.
    - `sessions.usage.timeseries` renvoie la série temporelle d’utilisation pour une session.
    - `sessions.usage.logs` renvoie les entrées de journal d’utilisation pour une session.

  </Accordion>

  <Accordion title="Canaux et assistants de connexion">
    - `channels.status` renvoie les résumés d’état des canaux/plugins intégrés + bundled.
    - `channels.logout` déconnecte un canal/compte spécifique lorsque le canal prend en charge la déconnexion.
    - `web.login.start` démarre un flux de connexion QR/web pour le fournisseur de canal web actuel compatible QR.
    - `web.login.wait` attend la fin de ce flux de connexion QR/web et démarre le canal en cas de succès.
    - `push.test` envoie un push APNs de test à un nœud iOS enregistré.
    - `voicewake.get` renvoie les déclencheurs de mot d’activation stockés.
    - `voicewake.set` met à jour les déclencheurs de mot d’activation et diffuse le changement.

  </Accordion>

  <Accordion title="Messagerie et journaux">
    - `send` est la RPC directe de remise sortante pour les envois ciblés canal/compte/fil en dehors du moteur de chat.
    - `logs.tail` renvoie la fin du journal de fichier Gateway configuré avec contrôles de curseur/limite et d’octets max.

  </Accordion>

  <Accordion title="Talk et TTS">
    - `talk.config` renvoie la charge utile de configuration Talk effective ; `includeSecrets` nécessite `operator.talk.secrets` (ou `operator.admin`).
    - `talk.mode` définit/diffuse l’état actuel du mode Talk pour les clients WebChat/Control UI.
    - `talk.speak` synthétise la parole via le fournisseur de parole Talk actif.
    - `tts.status` renvoie l’état activé de TTS, le fournisseur actif, les fournisseurs de repli et l’état de configuration du fournisseur.
    - `tts.providers` renvoie l’inventaire visible des fournisseurs TTS.
    - `tts.enable` et `tts.disable` activent ou désactivent l’état des préférences TTS.
    - `tts.setProvider` met à jour le fournisseur TTS préféré.
    - `tts.convert` exécute une conversion texte-parole ponctuelle.

  </Accordion>

  <Accordion title="Secrets, configuration, mise à jour et assistant">
    - `secrets.reload` relance la résolution des SecretRef actifs et ne remplace l’état des secrets à l’exécution qu’en cas de succès complet.
    - `secrets.resolve` résout les affectations de secrets ciblées par commande pour un ensemble commande/cible donné.
    - `config.get` renvoie l’instantané de configuration actuel et son hash.
    - `config.set` écrit une charge utile de configuration validée.
    - `config.patch` fusionne une mise à jour partielle de configuration.
    - `config.apply` valide puis remplace la charge utile de configuration complète.
    - `config.schema` renvoie la charge utile du schéma de configuration en direct utilisée par Control UI et les outils CLI : schéma, `uiHints`, version et métadonnées de génération, y compris les métadonnées de schéma des plugins + canaux lorsque l’exécution peut les charger. Le schéma inclut les métadonnées de champ `title` / `description` dérivées des mêmes libellés et textes d’aide utilisés par l’UI, y compris pour les branches imbriquées d’objet, wildcard, élément de tableau et de composition `anyOf` / `oneOf` / `allOf` lorsqu’une documentation de champ correspondante existe.
    - `config.schema.lookup` renvoie une charge utile de recherche limitée à un chemin pour un chemin de configuration : chemin normalisé, nœud de schéma superficiel, indice correspondant + `hintPath`, et résumés des enfants immédiats pour l’exploration UI/CLI. Les nœuds de schéma de recherche conservent la documentation orientée utilisateur et les champs de validation courants (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, bornes numériques/chaînes/tableaux/objets, et indicateurs comme `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Les résumés enfants exposent `key`, `path` normalisé, `type`, `required`, `hasChildren`, ainsi que le `hint` / `hintPath` correspondant.
    - `update.run` exécute le flux de mise à jour de la Gateway et planifie un redémarrage uniquement si la mise à jour elle-même a réussi.
    - `wizard.start`, `wizard.next`, `wizard.status` et `wizard.cancel` exposent l’assistant d’intégration via WS RPC.

  </Accordion>

  <Accordion title="Assistants pour agents et espaces de travail">
    - `agents.list` renvoie les entrées d’agents configurées.
    - `agents.create`, `agents.update` et `agents.delete` gèrent les enregistrements d’agents et le câblage de l’espace de travail.
    - `agents.files.list`, `agents.files.get` et `agents.files.set` gèrent les fichiers bootstrap d’espace de travail exposés pour un agent.
    - `agent.identity.get` renvoie l’identité effective de l’assistant pour un agent ou une session.
    - `agent.wait` attend la fin d’une exécution et renvoie l’instantané terminal lorsqu’il est disponible.

  </Accordion>

  <Accordion title="Contrôle de session">
    - `sessions.list` renvoie l’index actuel des sessions.
    - `sessions.subscribe` et `sessions.unsubscribe` activent ou désactivent les abonnements aux événements de changement de session pour le client WS courant.
    - `sessions.messages.subscribe` et `sessions.messages.unsubscribe` activent ou désactivent les abonnements aux événements de transcription/message pour une session.
    - `sessions.preview` renvoie des aperçus bornés de transcription pour des clés de session spécifiques.
    - `sessions.resolve` résout ou canonicalise une cible de session.
    - `sessions.create` crée une nouvelle entrée de session.
    - `sessions.send` envoie un message dans une session existante.
    - `sessions.steer` est la variante interruption-et-pilotage pour une session active.
    - `sessions.abort` interrompt le travail actif pour une session.
    - `sessions.patch` met à jour les métadonnées/remplacements d’une session.
    - `sessions.reset`, `sessions.delete` et `sessions.compact` effectuent la maintenance des sessions.
    - `sessions.get` renvoie la ligne complète de session stockée.
    - L’exécution de chat utilise toujours `chat.history`, `chat.send`, `chat.abort` et `chat.inject`. `chat.history` est normalisé pour l’affichage pour les clients UI : les balises de directive en ligne sont supprimées du texte visible, les charges utiles XML d’appel d’outil en texte brut (y compris `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` et les blocs d’appel d’outil tronqués) ainsi que les jetons de contrôle du modèle ASCII/full-width divulgués sont supprimés, les lignes d’assistant composées uniquement de jetons silencieux comme `NO_REPLY` / `no_reply` exacts sont omises, et les lignes surdimensionnées peuvent être remplacées par des espaces réservés.

  </Accordion>

  <Accordion title="Appairage des appareils et jetons d’appareil">
    - `device.pair.list` renvoie les appareils appairés en attente et approuvés.
    - `device.pair.approve`, `device.pair.reject` et `device.pair.remove` gèrent les enregistrements d’appairage d’appareil.
    - `device.token.rotate` fait tourner un jeton d’appareil appairé dans les limites de son rôle approuvé et de la portée de l’appelant.
    - `device.token.revoke` révoque un jeton d’appareil appairé dans les limites de son rôle approuvé et de la portée de l’appelant.

  </Accordion>

  <Accordion title="Appairage de nœuds, invoke et travail en attente">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject` et `node.pair.verify` couvrent l’appairage de nœuds et la vérification d’amorçage.
    - `node.list` et `node.describe` renvoient l’état des nœuds connus/connectés.
    - `node.rename` met à jour l’étiquette d’un nœud appairé.
    - `node.invoke` transmet une commande à un nœud connecté.
    - `node.invoke.result` renvoie le résultat d’une requête invoke.
    - `node.event` transporte vers la Gateway les événements émis par le nœud.
    - `node.canvas.capability.refresh` actualise les jetons de capacité canvas limités à une portée.
    - `node.pending.pull` et `node.pending.ack` sont les API de file d’attente pour nœud connecté.
    - `node.pending.enqueue` et `node.pending.drain` gèrent le travail durable en attente pour les nœuds hors ligne/déconnectés.

  </Accordion>

  <Accordion title="Familles d’approbation">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` et `exec.approval.resolve` couvrent les requêtes d’approbation exec ponctuelles ainsi que la recherche/relecture des approbations en attente.
    - `exec.approval.waitDecision` attend une approbation exec en attente et renvoie la décision finale (ou `null` en cas de délai d’attente).
    - `exec.approvals.get` et `exec.approvals.set` gèrent les instantanés de politique d’approbation exec de la Gateway.
    - `exec.approvals.node.get` et `exec.approvals.node.set` gèrent la politique locale d’approbation exec d’un nœud via des commandes de relais de nœud.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` et `plugin.approval.resolve` couvrent les flux d’approbation définis par des plugins.

  </Accordion>

  <Accordion title="Automatisation, Skills et outils">
    - Automatisation : `wake` planifie une injection immédiate ou au prochain Heartbeat de texte de réveil ; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gèrent le travail planifié.
    - Skills et outils : `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.

  </Accordion>
</AccordionGroup>

### Familles d’événements courantes

- `chat` : mises à jour de chat UI telles que `chat.inject` et autres
  événements de chat limités à la transcription.
- `session.message` et `session.tool` : mises à jour de transcription/flux d’événements pour une
  session abonnée.
- `sessions.changed` : l’index de session ou les métadonnées ont changé.
- `presence` : mises à jour d’instantané de présence système.
- `tick` : événement périodique de keepalive / vivacité.
- `health` : mise à jour de l’instantané de santé de la Gateway.
- `heartbeat` : mise à jour du flux d’événements Heartbeat.
- `cron` : événement de changement d’exécution/de tâche Cron.
- `shutdown` : notification d’arrêt de la Gateway.
- `node.pair.requested` / `node.pair.resolved` : cycle de vie d’appairage de nœud.
- `node.invoke.request` : diffusion de requête d’invoke de nœud.
- `device.pair.requested` / `device.pair.resolved` : cycle de vie d’appareil appairé.
- `voicewake.changed` : la configuration des déclencheurs de mot d’activation a changé.
- `exec.approval.requested` / `exec.approval.resolved` : cycle de vie
  d’approbation exec.
- `plugin.approval.requested` / `plugin.approval.resolved` : cycle de vie
  d’approbation de Plugin.

### Méthodes d’assistance pour nœuds

- Les nœuds peuvent appeler `skills.bins` pour récupérer la liste actuelle des exécutables de Skills
  pour les vérifications d’auto-autorisation.

### Méthodes d’assistance pour opérateurs

- Les opérateurs peuvent appeler `commands.list` (`operator.read`) pour récupérer l’inventaire d’exécution
  des commandes pour un agent.
  - `agentId` est facultatif ; omettez-le pour lire l’espace de travail de l’agent par défaut.
  - `scope` contrôle quelle surface la valeur primaire `name` cible :
    - `text` renvoie le jeton principal de commande texte sans le `/` initial
    - `native` et le chemin `both` par défaut renvoient des noms natifs sensibles au fournisseur
      lorsqu’ils sont disponibles
  - `textAliases` transporte les alias slash exacts tels que `/model` et `/m`.
  - `nativeName` transporte le nom de commande natif sensible au fournisseur lorsqu’il existe.
  - `provider` est facultatif et n’affecte que le nommage natif ainsi que la disponibilité des commandes natives de Plugin.
  - `includeArgs=false` omet les métadonnées d’arguments sérialisées de la réponse.
- Les opérateurs peuvent appeler `tools.catalog` (`operator.read`) pour récupérer le catalogue d’outils d’exécution pour un
  agent. La réponse inclut les outils groupés et les métadonnées de provenance :
  - `source` : `core` ou `plugin`
  - `pluginId` : propriétaire du plugin lorsque `source="plugin"`
  - `optional` : si un outil de plugin est facultatif
- Les opérateurs peuvent appeler `tools.effective` (`operator.read`) pour récupérer l’inventaire effectif d’outils à l’exécution
  pour une session.
  - `sessionKey` est requis.
  - La Gateway dérive côté serveur le contexte d’exécution de confiance à partir de la session au lieu d’accepter
    un contexte d’authentification ou de remise fourni par l’appelant.
  - La réponse est limitée à la session et reflète ce que la conversation active peut utiliser à l’instant présent,
    y compris les outils core, plugins et canaux.
- Les opérateurs peuvent appeler `skills.status` (`operator.read`) pour récupérer l’inventaire visible
  des Skills pour un agent.
  - `agentId` est facultatif ; omettez-le pour lire l’espace de travail de l’agent par défaut.
  - La réponse inclut l’éligibilité, les exigences manquantes, les vérifications de configuration et
    les options d’installation assainies sans exposer de valeurs secrètes brutes.
- Les opérateurs peuvent appeler `skills.search` et `skills.detail` (`operator.read`) pour les métadonnées de découverte ClawHub.
- Les opérateurs peuvent appeler `skills.install` (`operator.admin`) dans deux modes :
  - Mode ClawHub : `{ source: "clawhub", slug, version?, force? }` installe un
    dossier de Skill dans le répertoire `skills/` de l’espace de travail de l’agent par défaut.
  - Mode installateur Gateway : `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    exécute une action déclarée `metadata.openclaw.install` sur l’hôte Gateway.
- Les opérateurs peuvent appeler `skills.update` (`operator.admin`) dans deux modes :
  - Le mode ClawHub met à jour un slug suivi ou toutes les installations ClawHub suivies dans
    l’espace de travail de l’agent par défaut.
  - Le mode config modifie `skills.entries.<skillKey>` pour des valeurs telles que `enabled`,
    `apiKey` et `env`.

## Approbations exec

- Lorsqu’une requête exec nécessite une approbation, la Gateway diffuse `exec.approval.requested`.
- Les clients opérateurs la résolvent en appelant `exec.approval.resolve` (nécessite la portée `operator.approvals`).
- Pour `host=node`, `exec.approval.request` doit inclure `systemRunPlan` (`argv`/`cwd`/`rawCommand`/métadonnées de session canoniques). Les requêtes sans `systemRunPlan` sont rejetées.
- Après approbation, les appels `node.invoke system.run` transmis réutilisent ce
  `systemRunPlan` canonique comme contexte faisant autorité pour commande/cwd/session.
- Si un appelant modifie `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` entre prepare et la transmission finale approuvée de `system.run`, la
  Gateway rejette l’exécution au lieu de faire confiance à la charge utile modifiée.

## Repli de remise d’agent

- Les requêtes `agent` peuvent inclure `deliver=true` pour demander une remise sortante.
- `bestEffortDeliver=false` conserve le comportement strict : les cibles de remise non résolues ou uniquement internes renvoient `INVALID_REQUEST`.
- `bestEffortDeliver=true` autorise un repli vers une exécution limitée à la session lorsqu’aucune route de remise externe ne peut être résolue (par exemple sessions internes/webchat ou configurations multi-canaux ambiguës).

## Gestion de version

- `PROTOCOL_VERSION` se trouve dans `src/gateway/protocol/schema/protocol-schemas.ts`.
- Les clients envoient `minProtocol` + `maxProtocol` ; le serveur rejette les incompatibilités.
- Les schémas + modèles sont générés à partir des définitions TypeBox :
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes client

Le client de référence dans `src/gateway/client.ts` utilise ces valeurs par défaut. Les valeurs sont
stables sur le protocole v3 et constituent la base attendue pour les clients tiers.

| Constant                                  | Default                                               | Source                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Délai d’attente des requêtes (par RPC)    | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Délai préauth / connect-challenge         | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Backoff initial de reconnexion            | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Backoff maximal de reconnexion            | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Clamp de nouvelle tentative rapide après fermeture par jeton d’appareil | `250` ms                                 | `src/gateway/client.ts`                                    |
| Délai de grâce avant `terminate()` en arrêt forcé | `250` ms                                        | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Délai d’attente par défaut de `stopAndWait()` | `1_000` ms                                        | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Intervalle tick par défaut (avant `hello-ok`) | `30_000` ms                                      | `src/gateway/client.ts`                                    |
| Fermeture sur dépassement de délai tick   | code `4000` lorsque le silence dépasse `tickIntervalMs * 2` | `src/gateway/client.ts`                             |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

Le serveur annonce les valeurs effectives `policy.tickIntervalMs`, `policy.maxPayload`
et `policy.maxBufferedBytes` dans `hello-ok` ; les clients doivent respecter ces valeurs
plutôt que les valeurs par défaut d’avant handshake.

## Authentification

- L’authentification Gateway par secret partagé utilise `connect.params.auth.token` ou
  `connect.params.auth.password`, selon le mode d’authentification configuré.
- Les modes porteurs d’identité tels que Tailscale Serve
  (`gateway.auth.allowTailscale: true`) ou le mode non loopback
  `gateway.auth.mode: "trusted-proxy"` satisfont la vérification d’authentification de `connect` à partir des
  en-têtes de requête au lieu de `connect.params.auth.*`.
- `gateway.auth.mode: "none"` sur une entrée privée ignore entièrement l’authentification `connect` par secret partagé ;
  n’exposez pas ce mode sur une entrée publique/non fiable.
- Après l’appairage, la Gateway émet un **jeton d’appareil** limité au rôle + aux portées de la connexion. Il est renvoyé dans `hello-ok.auth.deviceToken` et doit être
  persisté par le client pour les connexions futures.
- Les clients doivent persister le `hello-ok.auth.deviceToken` principal après toute
  connexion réussie.
- Lors d’une reconnexion avec ce jeton d’appareil **stocké**, il faut également réutiliser l’ensemble de portées
  approuvé stocké pour ce jeton. Cela préserve l’accès read/probe/status qui avait déjà été accordé et évite de réduire silencieusement les reconnexions à une portée implicite admin-only plus étroite.
- Assemblage côté client de l’authentification `connect` (`selectConnectAuth` dans
  `src/gateway/client.ts`) :
  - `auth.password` est orthogonal et toujours transmis lorsqu’il est défini.
  - `auth.token` est renseigné par ordre de priorité : d’abord un jeton partagé explicite,
    puis un `deviceToken` explicite, puis un jeton stocké par appareil (indexé par
    `deviceId` + `role`).
  - `auth.bootstrapToken` n’est envoyé que si aucun des éléments ci-dessus n’a résolu de
    `auth.token`. Un jeton partagé ou tout jeton d’appareil résolu le supprime.
  - La promotion automatique d’un jeton d’appareil stocké lors de la tentative unique
    `AUTH_TOKEN_MISMATCH` est limitée aux **points de terminaison de confiance uniquement** —
    loopback, ou `wss://` avec un `tlsFingerprint` épinglé. Un `wss://` public
    sans pinning n’est pas admissible.
- Les entrées supplémentaires `hello-ok.auth.deviceTokens` sont des jetons de transfert d’amorçage.
  Ne les persistez que lorsque la connexion a utilisé une authentification d’amorçage sur un transport de confiance
  tel que `wss://` ou le loopback/l’appairage local.
- Si un client fournit un `deviceToken` **explicite** ou des `scopes` explicites, cet
  ensemble de portées demandé par l’appelant reste faisant autorité ; les portées en cache ne sont réutilisées que lorsque le client réutilise le jeton stocké par appareil.
- Les jetons d’appareil peuvent être renouvelés/révoqués via `device.token.rotate` et
  `device.token.revoke` (nécessite la portée `operator.pairing`).
- L’émission, le renouvellement et la révocation des jetons restent bornés à l’ensemble de rôles approuvé
  enregistré dans l’entrée d’appairage de cet appareil ; une mutation de jeton ne peut pas étendre ni
  cibler un rôle d’appareil jamais accordé lors de l’approbation d’appairage.
- Pour les sessions avec jeton d’appareil appairé, la gestion de l’appareil est limitée à soi-même sauf si l’appelant possède aussi `operator.admin` : les appelants non admin ne peuvent supprimer/révoquer/renouveler que **leur propre** entrée d’appareil.
- `device.token.rotate` et `device.token.revoke` vérifient aussi l’ensemble de portées du jeton opérateur cible
  par rapport aux portées de la session courante de l’appelant. Les appelants non admin
  ne peuvent pas renouveler ou révoquer un jeton opérateur plus large que celui qu’ils possèdent déjà.
- Les échecs d’authentification incluent `error.details.code` ainsi que des indications de récupération :
  - `error.details.canRetryWithDeviceToken` (booléen)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportement client pour `AUTH_TOKEN_MISMATCH` :
  - Les clients de confiance peuvent tenter une seule nouvelle tentative bornée avec un jeton stocké par appareil.
  - Si cette tentative échoue, les clients doivent arrêter les boucles automatiques de reconnexion et afficher des instructions d’action pour l’opérateur.

## Identité de l’appareil + appairage

- Les nœuds doivent inclure une identité d’appareil stable (`device.id`) dérivée de l’empreinte
  d’une paire de clés.
- Les Gateways émettent des jetons par appareil + rôle.
- Des approbations d’appairage sont requises pour les nouveaux `device.id` sauf si l’approbation automatique locale
  est activée.
- L’approbation automatique de l’appairage est centrée sur les connexions directes locales loopback.
- OpenClaw possède aussi un chemin étroit d’auto-connexion backend/local au conteneur pour
  des flux d’assistance à secret partagé de confiance.
- Les connexions tailnet ou LAN sur le même hôte sont toujours traitées comme distantes pour l’appairage et
  nécessitent une approbation.
- Les clients WS incluent normalement l’identité `device` pendant `connect` (operator +
  node). Les seules exceptions operator sans appareil sont des chemins de confiance explicites :
  - `gateway.controlUi.allowInsecureAuth=true` pour la compatibilité HTTP non sécurisée sur localhost uniquement.
  - authentification réussie de Control UI operator avec `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (brise-glace, forte dégradation de sécurité).
  - RPC backend `gateway-client` en loopback direct authentifiées avec le
    jeton/mot de passe partagé Gateway.
- Toutes les connexions doivent signer le nonce `connect.challenge` fourni par le serveur.

### Diagnostics de migration d’authentification d’appareil

Pour les clients hérités qui utilisent encore le comportement de signature antérieur au challenge, `connect` renvoie maintenant
des codes de détail `DEVICE_AUTH_*` dans `error.details.code` avec un `error.details.reason` stable.

Échecs de migration courants :

| Message                     | details.code                     | details.reason           | Signification                                      |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Le client a omis `device.nonce` (ou l’a envoyé vide). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Le client a signé avec un nonce obsolète/incorrect. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | La charge utile de signature ne correspond pas à la charge utile v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | L’horodatage signé est hors de la dérive autorisée. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` ne correspond pas à l’empreinte de la clé publique. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Le format/canonicalisation de la clé publique a échoué. |

Cible de migration :

- Attendez toujours `connect.challenge`.
- Signez la charge utile v2 qui inclut le nonce serveur.
- Envoyez le même nonce dans `connect.params.device.nonce`.
- La charge utile de signature préférée est `v3`, qui lie `platform` et `deviceFamily`
  en plus des champs device/client/role/scopes/token/nonce.
- Les signatures `v2` héritées restent acceptées pour la compatibilité, mais l’épinglage des métadonnées
  d’appareil appairé contrôle toujours la politique de commande à la reconnexion.

## TLS + pinning

- TLS est pris en charge pour les connexions WS.
- Les clients peuvent éventuellement épingler l’empreinte du certificat Gateway (voir la configuration `gateway.tls`
  plus `gateway.remote.tlsFingerprint` ou la CLI `--tls-fingerprint`).

## Portée

Ce protocole expose **l’API Gateway complète** (statut, canaux, modèles, chat,
agent, sessions, nœuds, approbations, etc.). La surface exacte est définie par les schémas
TypeBox dans `src/gateway/protocol/schema.ts`.

## Liens connexes

- [Protocole Bridge](/fr/gateway/bridge-protocol)
- [Runbook Gateway](/fr/gateway)
