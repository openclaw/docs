---
read_when:
    - Implémentation ou mise à jour des clients WS du Gateway
    - Débogage des incompatibilités de protocole ou des échecs de connexion
    - Régénération du schéma et des modèles du protocole
summary: 'Protocole WebSocket du Gateway : établissement de la connexion, trames, gestion des versions'
title: Protocole du Gateway
x-i18n:
    generated_at: "2026-07-16T13:12:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4cc92cfed4cf1bcc7b9499d90eef9f9225a89c0e6a71bb6230bb416f8f6884b5
    source_path: gateway/protocol.md
    workflow: 16
---

Le protocole WS du Gateway constitue l’unique plan de contrôle et le transport des Nodes pour
OpenClaw. Les clients opérateurs et Nodes (CLI, interface Web, application macOS, Nodes iOS/Android,
Nodes sans interface) se connectent via WebSocket et déclarent un **rôle** et une **portée** au
moment de la négociation de connexion.

## Transport et encadrement

- WebSocket, trames de texte, charges utiles JSON.
- La première trame **doit** être une requête `connect`.
- Les trames précédant la connexion sont limitées à 64 KiB (`MAX_PREAUTH_PAYLOAD_BYTES`). Après
  la négociation de connexion, respectez `hello-ok.policy.maxPayload` et
  `hello-ok.policy.maxBufferedBytes`. Lorsque les diagnostics sont activés, les trames
  entrantes surdimensionnées et les tampons sortants lents émettent des événements `payload.large` avant
  que le Gateway ne ferme la connexion ou n’abandonne la trame. Ces événements contiennent `surface`, les tailles
  en octets, les limites et un code de motif sûr, mais jamais le corps des messages, le
  contenu des pièces jointes, les octets bruts des trames, les jetons, les cookies ni les secrets.

Formes des trames :

- Requête : `{type:"req", id, method, params}`
- Réponse : `{type:"res", id, ok, payload|error}`
- Événement : `{type:"event", event, payload, seq?, stateVersion?}`

Les méthodes produisant des effets secondaires nécessitent des clés d’idempotence (voir le schéma).

## Négociation de connexion

Le Gateway envoie un défi avant la connexion :

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Le client répond avec `connect` :

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 4,
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

Le Gateway répond avec `hello-ok` :

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

`server`, `features`, `snapshot`, `policy` et `auth` sont tous requis par
`HelloOkSchema` (`packages/gateway-protocol/src/schema/frames.ts`). `auth`
indique le rôle et les portées négociés même lorsqu’aucun jeton d’appareil n’est émis (forme
ci-dessus). `pluginSurfaceUrls` est facultatif et associe les noms des surfaces des Plugins (par exemple
`canvas`) à des URL hébergées à portée limitée ; cette entrée peut expirer, les Nodes appellent donc
`node.pluginSurface.refresh` avec `{ "surface": "canvas" }` pour en obtenir une nouvelle.
Le chemin obsolète `canvasHostUrl` / `canvasCapability` / `node.canvas.capability.refresh`
n’est pas pris en charge ; utilisez les surfaces des Plugins.
Le champ facultatif `appliedConfigHash` de l’instantané est la révision résolue de la configuration source
acceptée par l’exécution active du Gateway. Les clients peuvent la comparer à
`config.get.configRevisionHash` afin de déterminer si une configuration enregistrée plus récente
nécessite encore un redémarrage. `config.get.hash` reste la révision brute du fichier racine utilisée par
les protections contre les conflits d’écriture de configuration.

Pendant que le Gateway termine encore le démarrage des processus auxiliaires, `connect` peut renvoyer une
erreur `UNAVAILABLE` réessayable avec `details.reason: "startup-sidecars"` et
`retryAfterMs`. Réessayez dans les limites de votre budget de connexion au lieu de la traiter comme
un échec définitif de la négociation de connexion.

Lorsqu’un jeton d’appareil est émis, `hello-ok.auth` l’ajoute :

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

L’amorçage intégré par code QR/code de configuration est un parcours de transfert mobile. Une
connexion réussie avec le code de configuration de base renvoie un jeton de Node principal ainsi qu’un
jeton d’opérateur limité :

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

Ce transfert à l’opérateur est volontairement limité : il suffit pour démarrer la boucle
de l’opérateur mobile et la configuration native, y compris `operator.talk.secrets` pour les lectures de
configuration de Talk, mais n’inclut ni les portées de modification de l’appairage ni `operator.admin`. Un accès
plus étendu à l’appairage ou à l’administration nécessite un flux d’appairage ou de jeton distinct et approuvé. Ne conservez
`hello-ok.auth.deviceTokens` que lorsque l’authentification d’amorçage a été effectuée via un transport
fiable (`wss://` ou appairage en boucle locale/local).

Les clients de backend fiables exécutés dans le même processus (`client.id: "gateway-client"`,
`client.mode: "backend"`) peuvent omettre `device` sur les connexions directes en boucle locale lorsqu’ils
s’authentifient avec le jeton/mot de passe partagé du Gateway. Ce chemin est réservé
aux RPC internes du plan de contrôle (par exemple, les mises à jour de session des sous-agents) et évite
que des références obsolètes d’appairage de CLI/d’appareil ne bloquent le travail local du backend. Les clients distants,
provenant d’un navigateur, Nodes, ainsi que les clients utilisant explicitement un jeton d’appareil ou une identité d’appareil,
restent soumis aux vérifications normales d’appairage et d’élévation des portées.

### Rôle de worker et protocole fermé

Les workers cloud utilisent une entrée en boucle locale dédiée via le tunnel SSH appartenant au Gateway,
dont la clé d’hôte est épinglée. Elle accepte uniquement l’identité du worker et ne distribue jamais
l’authentification générale, les événements de Node, les RPC d’opérateur ni les méthodes des Plugins. Un contrôle strict `connect`
vérifie un identifiant de connexion à courte durée de vie, stocké sous forme de hachage et lié à l’environnement, au hachage
du bundle, à l’époque du propriétaire, à la version de l’ensemble de RPC, à l’expiration et à une session nullable ; il
vérifie séparément la version actuelle et l’ensemble de fonctionnalités. La réussite renvoie un résultat minimal
`worker-hello-ok` ; la négociation des fonctionnalités est indépendante de la version générale du protocole.
Les trames restent inférieures à 64 KiB, sauf une trame `worker.inference.start` négociée
qui peut atteindre 25 MiB. La liste d’autorisation fermée contient `worker.heartbeat`,
`worker.transcript.commit`, `worker.live-event`, `worker.inference.start` et
`worker.inference.cancel`.

Les validations de transcription utilisent un cloisonnement par époque du propriétaire, une liaison de session appartenant au Gateway,
une comparaison-échange de la feuille de base et une relecture durable des séquences ; le Gateway génère
les identifiants des entrées de transcription et de leurs parents au moyen du mécanisme normal d’écriture de session. La propriété et
l’expiration sont revérifiées à chaque RPC.

### Capacités du client

Les clients opérateurs peuvent annoncer des capacités facultatives dans `connect.params.caps` :

- `tool-events` : accepte les événements structurés du cycle de vie des outils.
- `inline-widgets` : peut afficher les résultats d’outils de widgets intégrés hébergés.

Les capacités du client décrivent le client connecté, et non l’autorisation. Les outils de l’agent peuvent déclarer des capacités requises ; le Gateway omet ces outils sauf si chaque exigence figure dans le champ `caps` du client à l’origine de l’exécution. Les exécutions provenant d’un canal ne disposent d’aucune capacité de client du Gateway ; les outils soumis à des capacités sont donc indisponibles même lorsque la politique des outils les autorise explicitement.

### Exemple de connexion d’un Node

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 4,
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

Les Nodes déclarent leurs capacités revendiquées au moment de la connexion :

- `caps` : catégories de haut niveau telles que `camera`, `canvas`, `screen`,
  `location`, `voice`, `talk`.
- `commands` : liste d’autorisation des commandes pouvant être invoquées.
- `permissions` : options granulaires (par exemple `screen.record`, `camera.capture`).

Le Gateway traite ces éléments comme des revendications et applique des listes d’autorisation côté serveur.

## Rôles et portées

Pour consulter le modèle complet des portées de l’opérateur, les vérifications au moment de l’approbation et la sémantique
des secrets partagés, voir [Portées de l’opérateur](/fr/gateway/operator-scopes).

Rôles :

- `operator` : client du plan de contrôle (CLI/interface utilisateur/automatisation).
- `node` : hôte de capacités (caméra/écran/canevas/system.run).
- `worker` : hôte d’exécution cloud utilisant le protocole dédié et fermé des workers.

Portées de l’opérateur (`src/gateway/operator-scopes.ts`), ensemble fermé complet :

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` avec `includeSecrets: true` nécessite `operator.talk.secrets` (ou
`operator.admin`). Lorsque des secrets sont inclus, lisez l’identifiant de connexion actif du fournisseur Talk
depuis `talk.resolved.config.apiKey` ; `talk.providers.<id>.apiKey`
conserve la forme de la source et peut être un objet SecretRef ou une chaîne expurgée.

Les méthodes RPC du Gateway enregistrées par un Plugin peuvent demander leur propre portée d’opérateur,
mais les préfixes principaux réservés suivants correspondent toujours à `operator.admin`
(`src/shared/gateway-method-policy.ts`) : `config.*`, `exec.approvals.*`,
`wizard.*`, `update.*`.

La portée de la méthode ne constitue que le premier contrôle. Certaines commandes avec barre oblique accessibles via
`chat.send` appliquent des vérifications plus strictes au niveau de la commande : les écritures persistantes de `/config set` et
`/config unset` nécessitent `operator.admin`, même pour les clients du Gateway qui
disposent déjà d’une portée d’opérateur inférieure.

`node.pair.approve` applique une vérification supplémentaire de la portée au moment de l’approbation, en plus de la portée
de base de la méthode (`operator.pairing`), selon le champ `commands` déclaré
par la requête en attente (`src/infra/node-pairing-authz.ts`) :

| Commandes déclarées                                                                                                           | Portées requises                      |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| aucune                                                                                                                        | `operator.pairing`                    |
| commandes ordinaires                                                                                                          | `operator.pairing` + `operator.write` |
| inclut `system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` ou `system.execApprovals.get/set` | `operator.pairing` + `operator.admin` |

### Capacités/commandes/autorisations (Node)

Les Nodes déclarent leurs capacités revendiquées au moment de la connexion :

- `caps` : catégories de capacités de haut niveau telles que `camera`, `canvas`, `screen`,
  `location`, `voice` et `talk`.
- `commands` : liste d’autorisation des commandes pouvant être invoquées.
- `permissions` : options granulaires (par exemple `screen.record`, `camera.capture`).

Le Gateway traite ces éléments comme des **déclarations** et applique des listes d’autorisation côté serveur.
Les nœuds connectés peuvent publier des descripteurs facultatifs de Plugin ou d’outil MCP visibles par l’agent
avec `node.pluginTools.update` après une connexion ou une
reconnexion réussie. Les hôtes de nœuds sans interface redémarrent pour appliquer les modifications
déclaratives de l’inventaire MCP. Cette méthode de mise à jour est le seul chemin de publication ; les descripteurs d’outils de Plugin ne sont pas acceptés dans les
paramètres `connect`. Chaque descripteur doit utiliser un `name` d’outil sûr pour le fournisseur et nommer
un `command` figurant dans la liste d’autorisation actuelle des commandes du nœud. Le Gateway considère comme fiables les
métadonnées des descripteurs provenant du nœud appairé, filtre les descripteurs hors de la surface de commandes
approuvée, les supprime lorsque le nœud se déconnecte et rejette les tentatives des opérateurs
visant à modifier le catalogue d’un autre nœud. Définissez `gateway.nodes.pluginTools.enabled: false`
pour ignorer les descripteurs publiés par les nœuds.

Les hôtes de nœuds connectés publient leur catalogue complet de remplacement des Skills avec
`node.skills.update`. Cette méthode réservée au rôle de nœud est le seul chemin de publication
des Skills du nœud ; les Skills ne sont pas acceptées dans les paramètres `connect`. Chaque descripteur contient un
nom sûr, une description et un contenu `SKILL.md` limité. Le Gateway analyse ce
contenu avec le chargeur de Skills normal, l’inclut dans les instantanés des Skills de l’agent
tant que le nœud est connecté et le supprime lors de la déconnexion. Définissez
`gateway.nodes.skills.enabled: false` pour ignorer les Skills publiées par les nœuds.

## Présence

- `system-presence` renvoie des entrées indexées par identité d’appareil, comprenant
  `deviceId`, `roles` et `scopes`, afin que les interfaces puissent afficher une ligne par appareil même
  lorsqu’il se connecte à la fois comme opérateur et comme nœud.
- `node.list` comprend les champs facultatifs `lastSeenAtMs` et `lastSeenReason`. Les nœuds
  connectés indiquent l’heure actuelle de connexion avec la raison `connect` ; les nœuds appairés peuvent
  également signaler une présence durable en arrière-plan au moyen d’un événement de nœud fiable.

Les nœuds macOS natifs peuvent également envoyer des événements `node.presence.activity` authentifiés
avec une durée d’inactivité d’entrée limitée. Le Gateway calcule les horodatages d’activité selon
sa propre horloge, expose le Mac connecté le plus récent via `node.list` et
`node.describe`, et diffuse les mises à jour `node.presence` aux clients disposant d’une portée de lecture.
Consultez [Présence de l’ordinateur actif](/fr/nodes/presence) pour le comportement de sélection, de confidentialité, de contexte du modèle
et de routage des notifications.

### Événement de nœud actif en arrière-plan

Les nœuds appellent `node.event` avec `event: "node.presence.alive"` pour enregistrer qu’un
nœud appairé était actif lors d’un réveil en arrière-plan, sans le marquer comme connecté :

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` est une énumération fermée : `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual`, `connect`. Les valeurs inconnues sont normalisées en
`background` (`src/shared/node-presence.ts`). L’événement n’est conservé que pour
les sessions authentifiées d’appareils de nœud ; les sessions sans appareil ou non appairées renvoient
`handled: false`.

Les Gateways compatibles renvoient un résultat structuré :

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Les anciens Gateways peuvent ne renvoyer que `{ "ok": true }` pour `node.event` ; considérez cela
comme un RPC accusé de réception, et non comme une persistance durable de la présence.

## Portée des événements diffusés

Les événements diffusés par le serveur sont filtrés par portée afin que les sessions
limitées à l’appairage ou aux nœuds ne reçoivent pas passivement le contenu des sessions
(`src/gateway/server-broadcast.ts`) :

- Les trames de discussion, d’agent et de résultat d’outil (événements `agent` diffusés en continu, événements de résultat
  d’outil) nécessitent au minimum `operator.read`. Les sessions qui n’en disposent pas ignorent entièrement ces
  trames.
- Les diffusions `plugin.*` définies par les Plugins sont limitées par défaut à `operator.write` ou
  `operator.admin` ; les entrées explicites telles que
  `plugin.approval.requested` / `plugin.approval.resolved` utilisent
  `operator.approvals` à la place.
- Les événements d’état/de transport (`heartbeat`, `presence`, `tick`, cycle de vie de connexion/déconnexion)
  restent sans restriction afin que l’état du transport soit observable par chaque
  session authentifiée.
- Les familles inconnues d’événements diffusés sont filtrées par portée par défaut (échec fermé),
  sauf si un gestionnaire enregistré assouplit explicitement cette règle.

Chaque connexion cliente conserve son propre numéro de séquence par client, de sorte que les diffusions
restent ordonnées de manière monotone sur ce socket, même lorsque différents clients voient
des sous-ensembles distincts du flux d’événements, filtrés selon leur portée.

## Familles de méthodes RPC

`hello-ok.features.methods` est une liste de découverte prudente construite à partir de
`src/gateway/server-methods-list.ts` ainsi que des exports de méthodes des Plugins/canaux
chargés ; il ne s’agit pas d’une liste générée de toutes les méthodes, et certaines méthodes (par
exemple `push.test`, `web.login.start`, `web.login.wait`, `sessions.usage`)
sont intentionnellement exclues de la découverte, bien qu’elles soient réelles et
appelables. Considérez cette liste comme un mécanisme de découverte des fonctionnalités, et non comme une énumération complète de
`src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Système et identité">
    - `health` renvoie l’instantané de l’état de santé du Gateway, mis en cache ou récemment sondé.
    - `diagnostics.stability` renvoie l’enregistreur récent et limité de stabilité des diagnostics : noms des événements, nombres, tailles en octets, mesures de mémoire, état des files d’attente/sessions, noms des canaux/Plugins, identifiants de session. Aucun texte de discussion, corps de Webhook, résultat d’outil, corps brut de requête/réponse, jeton, cookie ou secret. Nécessite `operator.read`.
    - `status` renvoie le résumé du Gateway au format `/status` ; les champs sensibles sont réservés aux clients opérateurs disposant d’une portée d’administration.
    - `gateway.identity.get` renvoie l’identité d’appareil du Gateway utilisée par les flux de relais et d’appairage.
    - `system-presence` renvoie l’instantané de présence actuel des appareils opérateurs/nœuds connectés.
    - `system-event` ajoute un événement système et peut mettre à jour/diffuser le contexte de présence.
    - `last-heartbeat` renvoie le dernier événement Heartbeat conservé.
    - `set-heartbeats` active ou désactive le traitement du Heartbeat sur le Gateway.
    - `gateway.suspend.prepare` crée un bail court de suspension coopérative uniquement lorsque les tâches suivies du Gateway sont inactives. `gateway.suspend.status` vérifie ce bail, et `gateway.suspend.resume` le libère après la reprise ou l’abandon d’une opération de l’hôte.

  </Accordion>

  <Accordion title="Modèles et utilisation">
    - `models.list` renvoie le catalogue des modèles autorisés à l’exécution. Consultez les « vues `models.list` » ci-dessous.
    - `usage.status` renvoie les fenêtres d’utilisation des fournisseurs et les résumés des quotas restants.
    - `usage.cost` renvoie les résumés agrégés des coûts d’utilisation pour une plage de dates. Transmettez `agentId` pour un agent ou `agentScope: "all"` pour agréger les agents configurés.
    - `doctor.memory.status` renvoie l’état de préparation de la mémoire vectorielle/des embeddings en cache pour l’espace de travail de l’agent actif par défaut. Transmettez `{ "probe": true }` ou `{ "deep": true }` uniquement pour effectuer un ping explicite et direct du fournisseur d’embeddings. Transmettez `{ "agentId": "agent-id" }` pour limiter les statistiques du stockage Dreaming à l’espace de travail d’un agent ; si ce paramètre est omis, les espaces de travail Dreaming configurés sont agrégés.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` et `doctor.memory.dedupeDreamDiary` acceptent le paramètre facultatif `{ "agentId": "agent-id" }` ; s’il est omis, ils opèrent sur l’espace de travail de l’agent configuré par défaut.
    - `doctor.memory.remHarness` renvoie un aperçu limité et en lecture seule du banc d’essai REM pour les clients distants du plan de contrôle, comprenant les chemins d’espaces de travail, des extraits de mémoire, le Markdown contextualisé rendu et les candidats à la promotion approfondie. Nécessite `operator.read`.
    - `sessions.usage` renvoie des résumés d’utilisation par session. Transmettez `agentId` pour un agent ou `agentScope: "all"` pour répertorier ensemble les agents configurés.
      Les deux méthodes d’utilisation acceptent `mode: "specific"` avec un `timeZone` IANA pour définir des limites et des intervalles de jours calendaires tenant compte de l’heure d’été. `utcOffset` reste pris en charge pour les anciens clients et comme solution de repli lorsque l’environnement d’exécution du Gateway ne reconnaît pas le fuseau demandé.
    - `sessions.usage.timeseries` renvoie l’utilisation sous forme de série chronologique pour une session.
    - `sessions.usage.logs` renvoie les entrées du journal d’utilisation pour une session.

  </Accordion>

  <Accordion title="Canaux et assistants de connexion">
    - `channels.status` renvoie les résumés d’état des canaux/Plugins intégrés et fournis.
    - `channels.logout` déconnecte un canal/compte spécifique lorsque le canal le permet.
    - `web.login.start` lance un flux de connexion par QR/Web pour le fournisseur actuel du canal Web compatible avec les codes QR.
    - `web.login.wait` attend la fin de ce flux et démarre le canal en cas de réussite.
    - `push.test` envoie une notification push APNs de test à un nœud iOS enregistré.
    - `voicewake.get` renvoie les déclencheurs de mots d’activation enregistrés.
    - `voicewake.set` met à jour les déclencheurs de mots d’activation et diffuse la modification.

  </Accordion>

  <Accordion title="Gestion des Plugins">
    - `plugins.list` (`operator.read`) renvoie l’inventaire des Plugins installés, ainsi qu’une sélection officielle organisée localement, les diagnostics et l’indication permettant de savoir si le mode d’installation actuel autorise les modifications.
    - `plugins.search` (`operator.read`) recherche les familles installables de Plugins de code et de Plugins groupés dans ClawHub. Transmettez un `query` non vide et un `limit` facultatif compris entre 1 et 100.
    - `plugins.install` (`operator.admin`) installe soit une entrée du catalogue officiel avec `{ source: "official", pluginId }`, soit un paquet ClawHub avec `{ source: "clawhub", packageName, version?, acknowledgeClawHubRisk? }`. Les installations ClawHub préservent les contrôles de confiance, d’intégrité et de politique d’installation du Gateway. Les installations réussies nécessitent un redémarrage du Gateway.
    - `plugins.setEnabled` (`operator.admin`) modifie la politique d’activation d’un Plugin installé avec `{ pluginId, enabled }`. La réponse comprend l’entrée de catalogue mise à jour, les métadonnées de redémarrage et les éventuels avertissements de sélection d’emplacement.
    - `plugins.uninstall` (`operator.admin`) supprime un Plugin installé en externe avec `{ pluginId }` : les références de configuration, l’enregistrement d’installation et les fichiers gérés. Les Plugins fournis ne peuvent pas être désinstallés, seulement désactivés. La réponse répertorie les actions de suppression et nécessite toujours un redémarrage du Gateway.

  </Accordion>

  <Accordion title="Messagerie et journaux">
    - `send` est le RPC de livraison sortante directe pour les envois ciblant un canal/compte/fil de discussion en dehors de l’exécuteur de discussion.
    - `logs.tail` renvoie la fin configurée du journal de fichiers du Gateway avec des contrôles de curseur/limite et de nombre maximal d’octets.

  </Accordion>

  <Accordion title="Terminal de l’opérateur">
    - `terminal.open` démarre un PTY hôte pour un `agentId` explicite ou pour l’agent par défaut, et renvoie l’agent résolu, le répertoire de travail, le shell et l’état de confinement.
    - `terminal.input`, `terminal.resize` et `terminal.close` agissent uniquement sur les sessions appartenant à la connexion appelante.
    - `terminal.upload` accepte un fichier encodé en base64 d’une taille maximale de 16 MiB, le place dans un répertoire temporaire privé conservé pendant 24 heures sur le Gateway de la session ou l’hôte du nœud appairé, puis renvoie le chemin absolu. L’appelant doit encore coller ou utiliser autrement ce chemin ; le RPC n’écrit jamais dans l’entrée du terminal et n’exécute aucune commande.
    - Les événements `terminal.data` et `terminal.exit` sont diffusés uniquement vers la connexion propriétaire de la session.
    - Les sessions dont la connexion est interrompue sont détachées, et non arrêtées : elles restent rattachables pendant `gateway.terminal.detachedSessionTimeoutSeconds` (300 par défaut ; `0` rétablit l’arrêt lors de la déconnexion), tandis que les sorties récentes s’accumulent dans un tampon borné côté serveur.
    - `terminal.list` renvoie les sessions rattachables ; `terminal.attach` rattache une session active ou détachée à la connexion appelante et renvoie le tampon de relecture (prise de contrôle à la manière de tmux — un précédent propriétaire actif reçoit `terminal.exit` avec la raison `detached`) ; `terminal.text` lit le tampon en texte brut sans rattacher la session.
    - Chaque méthode de terminal nécessite `operator.admin` ; `gateway.terminal.enabled` doit être explicitement défini sur true. Les agents entièrement isolés sont refusés, et toute modification de la politique d’un agent ferme les PTY existants et en cours, y compris ceux qui sont détachés.

  </Accordion>

  <Accordion title="Conversation et TTS">
    - `talk.catalog` renvoie le catalogue en lecture seule des fournisseurs de conversation pour la parole, la transcription en continu et la voix en temps réel : identifiants canoniques des fournisseurs, alias du registre, libellés, état de configuration, résultat facultatif `ready` au niveau du groupe, identifiants de modèles et de voix exposés, modes canoniques, transports, stratégies du cerveau, ainsi que les indicateurs audio et de capacités en temps réel, sans renvoyer les secrets des fournisseurs ni modifier la configuration globale. Les gateways actuels définissent `ready` après avoir appliqué la sélection du fournisseur à l’exécution ; sur les gateways plus anciens, son absence doit être considérée comme non vérifiée.
    - `talk.config` renvoie la charge utile de configuration effective de la conversation ; `includeSecrets` nécessite `operator.talk.secrets` (ou `operator.admin`).
    - `talk.session.create` crée une session de conversation détenue par le gateway pour `realtime/gateway-relay`, `transcription/gateway-relay` ou `stt-tts/managed-room`. Pour `stt-tts/managed-room`, les appelants `operator.write` qui transmettent `sessionKey` doivent également transmettre `spawnedBy` afin de limiter la visibilité de la clé de session ; la création non limitée de `sessionKey` et `brain: "direct-tools"` nécessitent `operator.admin`.
    - `talk.session.join` valide le jeton de session d’une salle gérée, émet `session.ready` ou `session.replaced` selon les besoins, et renvoie les métadonnées de la salle et de la session ainsi que les événements de conversation récents, mais jamais le jeton en clair ni son hachage.
    - `talk.session.appendAudio` ajoute de l’audio d’entrée PCM encodé en base64 aux sessions de relais en temps réel et de transcription détenues par le gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` et `talk.session.cancelTurn` pilotent le cycle de vie des tours de parole des salles gérées, avec rejet des tours obsolètes avant l’effacement de l’état.
    - `talk.session.cancelOutput` arrête la sortie audio de l’assistant, principalement pour permettre une interruption contrôlée par VAD dans les sessions de relais du gateway.
    - `talk.session.submitToolResult` termine un appel d’outil du fournisseur émis par une session de relais en temps réel détenue par le gateway. La requête attend tout signal d’achèvement asynchrone exposé par le pont du fournisseur ; les soumissions ayant échoué maintiennent l’exécution liée active et n’émettent pas d’événement de résultat d’outil réussi. Transmettez `options: { willContinue: true }` pour une sortie d’outil intermédiaire ou `options: { suppressResponse: true }` lorsque le pont du fournisseur annonce la prise en charge de la suppression et que le résultat ne doit pas déclencher une autre réponse.
    - `talk.session.steer` envoie une commande vocale à l’exécution active dans une session de conversation adossée à un agent et détenue par le gateway : `{ sessionId, text, mode? }`, où `mode` vaut `status`, `steer`, `cancel` ou `followup` ; lorsque le mode est omis, il est déterminé à partir du texte prononcé.
    - `talk.session.close` ferme une session de relais, de transcription ou de salle gérée détenue par le gateway et émet les événements terminaux de conversation.
    - `talk.mode` définit et diffuse l’état actuel du mode de conversation pour les clients WebChat/Control UI.
    - `talk.client.create` crée une session de fournisseur en temps réel détenue par le client à l’aide de `webrtc` ou `provider-websocket`, tandis que le gateway conserve la gestion de la configuration, des identifiants, des instructions et de la politique des outils.
    - `talk.client.toolCall` permet aux transports en temps réel détenus par le client de transférer les appels d’outils du fournisseur vers la politique du gateway. Le premier outil pris en charge est `openclaw_agent_consult` ; les clients reçoivent un identifiant d’exécution et attendent les événements normaux du cycle de vie de la conversation avant de soumettre le résultat d’outil propre au fournisseur.
    - `talk.client.steer` envoie une commande vocale à l’exécution active pour les transports en temps réel détenus par le client. Le gateway résout l’exécution intégrée active à partir de `sessionKey` et renvoie un résultat structuré indiquant l’acceptation ou le rejet au lieu d’ignorer silencieusement le guidage.
    - `talk.event` est le canal unique des événements de conversation pour les adaptateurs en temps réel, de transcription, STT/TTS, de salles gérées, de téléphonie et de réunions.
    - `talk.speak` synthétise la parole au moyen du fournisseur vocal actif de la conversation.
    - `tts.status` renvoie l’état d’activation de TTS, le fournisseur actif, les fournisseurs de secours et l’état de configuration des fournisseurs.
    - `tts.providers` renvoie l’inventaire visible des fournisseurs TTS.
    - `tts.enable` et `tts.disable` activent ou désactivent l’état des préférences TTS.
    - `tts.setProvider` met à jour le fournisseur TTS préféré.
    - `tts.convert` effectue une conversion ponctuelle de texte en parole.
    - `tts.speak` (`operator.write`) restitue le contenu non vide de `text` au moyen de la chaîne de fournisseurs TTS généraux configurée et renvoie un extrait complet directement sous la forme `audioBase64`, ainsi que les métadonnées `provider` et, facultativement, `outputFormat`, `mimeType` et `fileExtension`. Contrairement à `tts.convert`, cette méthode ne renvoie pas de chemin local au Gateway ; contrairement à `talk.speak`, elle ne nécessite pas de fournisseur de conversation. Un texte dépassant `messages.tts.maxTextLength` renvoie `INVALID_REQUEST` ; les échecs de synthèse renvoient `UNAVAILABLE`.

  </Accordion>

  <Accordion title="Secrets, configuration, mise à jour et assistant">
    - `secrets.reload` résout à nouveau les SecretRefs actifs et ne remplace l’état des secrets à l’exécution qu’en cas de réussite complète.
    - `secrets.resolve` résout les affectations de secrets aux cibles d’une commande pour un ensemble précis de commandes et de cibles.
    - `config.get` renvoie l’instantané actuel de la configuration sur disque, le `hash` brut du fichier racine, le `configRevisionHash` résolu et, facultativement, le `appliedConfigHash` de la révision résolue acceptée par l’environnement d’exécution actif du Gateway.
    - `config.set` écrit une charge utile de configuration validée.
    - `config.patch` fusionne une mise à jour partielle de la configuration. Le remplacement destructif d’un tableau nécessite que le chemin concerné figure dans `replacePaths` ; les tableaux imbriqués sous des entrées de tableau utilisent des chemins `[]`, tels que `agents.list[].skills`.
    - `config.apply` valide et remplace l’intégralité de la charge utile de configuration.
    - `config.schema` renvoie la charge utile du schéma de configuration actif utilisée par les outils Control UI et CLI : schéma, `uiHints`, version, métadonnées de génération, ainsi que les métadonnées des schémas de plugins et de canaux lorsqu’elles peuvent être chargées. Elle comprend les métadonnées `title` / `description` issues des mêmes libellés et textes d’aide que l’interface utilisateur, y compris les branches de composition d’objets imbriqués, de caractères génériques, d’éléments de tableau et `anyOf` / `oneOf` / `allOf` lorsqu’une documentation de champ correspondante existe.
    - `config.schema.lookup` renvoie une charge utile de recherche limitée à un chemin de configuration : chemin normalisé, nœud de schéma superficiel, indication correspondante avec `hintPath`, `reloadKind` facultatif et résumés des enfants immédiats pour l’exploration dans l’interface utilisateur ou la CLI. `reloadKind` vaut `restart`, `hot` ou `none` (`src/config/schema.ts`) et reflète le planificateur de rechargement de la configuration du gateway pour le chemin demandé. Les nœuds du schéma de recherche conservent la documentation destinée à l’utilisateur et les champs de validation courants (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, limites numériques, de chaîne, de tableau et d’objet, `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Les résumés des enfants exposent `key`, le `path` normalisé, `type`, `required`, `hasChildren`, le `reloadKind` facultatif, ainsi que les `hint` / `hintPath` correspondants.
    - `update.run` exécute le processus de mise à jour du gateway et ne planifie un redémarrage que si la mise à jour a réussi ; les appelants disposant d’une session peuvent inclure `continuationMessage` afin que le démarrage reprenne un tour d’agent de suivi au moyen de la file d’attente de continuation après redémarrage. Les mises à jour du gestionnaire de paquets et celles des extractions Git supervisées effectuées depuis le plan de contrôle utilisent un transfert détaché vers un service géré au lieu de remplacer l’arborescence des paquets ou de modifier les résultats de l’extraction et de la compilation dans le gateway actif. Un transfert démarré renvoie `ok: true` avec `result.reason: "managed-service-handoff-started"` et `handoff.status: "started"` ; les transferts indisponibles ou ayant échoué renvoient `ok: false` avec `managed-service-handoff-unavailable` ou `managed-service-handoff-failed`, ainsi que `handoff.command` lorsqu’une mise à jour manuelle depuis le shell est requise. « Indisponible » signifie qu’OpenClaw ne dispose pas d’une limite de supervision sûre ou d’une identité de service durable, telle que `OPENCLAW_SYSTEMD_UNIT` pour systemd. Pendant un transfert démarré, la sentinelle de redémarrage peut brièvement signaler `stats.reason: "restart-health-pending"` ; la continuation est retardée jusqu’à ce que la CLI vérifie le gateway redémarré et écrive la sentinelle finale `ok`.
    - `update.status` actualise et renvoie la dernière sentinelle de redémarrage liée à la mise à jour, y compris la version en cours d’exécution après le redémarrage lorsqu’elle est disponible.
    - `wizard.start`, `wizard.next`, `wizard.status` et `wizard.cancel` exposent l’assistant d’intégration via le RPC WS.

  </Accordion>

  <Accordion title="Assistants pour les agents et les espaces de travail">
    - `agents.list` renvoie les entrées d’agent configurées, notamment les métadonnées effectives du modèle et de l’environnement d’exécution.
    - `agents.create`, `agents.update` et `agents.delete` gèrent les enregistrements d’agents et la connexion aux espaces de travail.
    - `agents.files.list`, `agents.files.get` et `agents.files.set` gèrent les fichiers d’espace de travail d’amorçage exposés à un agent.
    - `audit.activity.list` renvoie le journal d’activité versionné contenant uniquement les métadonnées ; `audit.list` reste le RPC d’exécution et d’outil garantissant la compatibilité.
    - `agents.workspace.list` et `agents.workspace.get` (`operator.read`) permettent aux clients du domaine d’opérateur de confiance décrit dans [Portées des opérateurs](/fr/gateway/operator-scopes) de parcourir en lecture seule et avec pagination le répertoire d’espace de travail d’un agent. Les requêtes acceptent uniquement des chemins relatifs à l’espace de travail ; les lectures restent confinées à la racine de l’espace de travail résolue par chemin réel (les échappements par liens symboliques et liens physiques sont rejetés), leur taille est plafonnée et elles sont limitées au texte UTF-8 ainsi qu’aux types d’images courants (base64). Les réponses n’exposent pas le chemin de l’espace de travail sur l’hôte. Cet espace de noms ne comporte aucune opération d’écriture.
    - `tasks.list`, `tasks.get` et `tasks.cancel` exposent le journal des tâches du Gateway aux clients SDK et opérateurs. Consultez la section [RPC du journal des tâches](#task-ledger-rpcs) ci-dessous.
    - `artifacts.list`, `artifacts.get` et `artifacts.download` exposent les résumés et les téléchargements d’artefacts dérivés des transcriptions pour une portée explicite `sessionKey`, `runId` ou `taskId`. Les requêtes d’exécution et de tâche déterminent côté serveur la session propriétaire et renvoient uniquement les médias de transcription dont la provenance correspond ; les sources d’URL non sûres ou locales produisent des téléchargements non pris en charge au lieu d’être récupérées côté serveur.
    - `environments.list` et `environments.status` préservent la découverte de l’environnement local au Gateway et de l’environnement du Node. Les workers cloud configurés et les enregistrements durables laissés par des profils antérieurs ajoutent des métadonnées `worker` avec `providerId`, le champ facultatif `leaseId`, `state`, `ageMs`, le champ facultatif `idleMs` et `attachedSessionIds`. Les états du cycle de vie des workers sont `requested`, `provisioning`, `bootstrapping`, `ready`, `attached`, `idle`, `draining`, `destroying`, `destroyed`, `failed` et `orphaned`.
    - `environments.create` (`{ profileId, idempotencyKey }`) provisionne un worker à partir d’un profil de fournisseur de Plugin configuré ; les nouvelles tentatives avec la même clé réutilisent l’opération durable. `environments.destroy` (`{ environmentId }`) demande le démantèlement idempotent d’un environnement de worker durable. Les deux nécessitent `operator.admin`, constituent des écritures du plan de contrôle et renvoient la même structure de résumé d’environnement que les réponses d’état.
    - `agent.identity.get` renvoie l’identité effective de l’assistant pour un agent ou une session.
    - `agent.wait` attend la fin d’une exécution et renvoie l’instantané terminal lorsqu’il est disponible.

  </Accordion>

  <Accordion title="Contrôle des sessions">
    - `sessions.list` renvoie l’index actuel des sessions, notamment les métadonnées `agentRuntime` de chaque ligne lorsqu’un backend d’environnement d’exécution d’agent est configuré. Lorsque le placement sur des workers cloud est activé ou qu’un état de récupération durable existe, les lignes de session comprennent également un état `placement` fermé (`local`, `requested`, `provisioning`, `syncing`, `starting`, `active`, `draining`, `reconciling`, `reclaimed` ou `failed`), ainsi que des champs propres à l’état concernant l’environnement, l’époque du propriétaire, l’espace de travail, le bundle, le curseur d’ACK ou la récupération.
    - `sessions.subscribe` et `sessions.unsubscribe` activent ou désactivent les abonnements aux événements de modification des sessions pour le client WS actuel.
    - `sessions.messages.subscribe` et `sessions.messages.unsubscribe` activent ou désactivent les abonnements aux événements de transcription et de message pour une session. Transmettez `includeApprovals: true` afin de recevoir également les événements de cycle de vie `session.approval` assainis pour les approbations dont l’audience persistée comprend cette session exacte et dont l’association au réviseur autorise le client abonné. La réponse d’abonnement comprend alors une liste `approvalReplay` en attente et bornée ; elle fait autorité lorsque `truncated` est faux. L’activation s’applique à chaque appel d’abonnement et n’est pas persistante : se réabonner à la même session sans `includeApprovals: true` supprime un abonnement existant aux approbations. Outre l’autorité normale de lecture de la session, cette activation nécessite `operator.admin`, ou `operator.approvals` sur un appareil appairé.
    - `sessions.preview` renvoie des aperçus bornés des transcriptions pour des clés de session précises.
    - `sessions.describe` renvoie une ligne de session du Gateway pour une clé de session exacte.
    - `sessions.resolve` résout ou canonise une cible de session.
    - `sessions.create` crée une nouvelle entrée de session. Les valeurs facultatives `model` et `thinkingLevel` enregistrent atomiquement les substitutions initiales du modèle et du raisonnement. `worktree: true` provisionne un arbre de travail géré ; les champs facultatifs `worktreeBaseRef`/`worktreeName` sélectionnent la référence de base et le nom de branche, et `execNode` (`operator.admin`) associe l’exécution de la session à un hôte Node. L’arbre de travail créé est repris dans le résultat et enregistré dans la ligne de session (`worktree: { id, branch, repoRoot }`). Lorsque l’entrée est créée, mais que son `chat.send` initial imbriqué est rejeté, le résultat réussi comprend `runStarted: false` et `runError` ; les clients peuvent conserver le prompt et réessayer avec la clé de session renvoyée.
    - `sessions.dispatch` (`operator.admin`) déplace une session OpenClaw locale existante dotée d’un arbre de travail géré appartenant à la session vers un profil de worker cloud configuré. Transmettez `{ key, profileId, agentId? }`. La méthode est absente lorsqu’aucun profil de worker n’est configuré, ferme l’admission locale des tours avant d’attendre la fin du travail actif et ne renvoie un résultat qu’une fois le placement parvenu à la propriété du worker `active`. La répartition est unidirectionnelle ; le rapatriement du worker vers l’environnement local ne fait pas partie de ce RPC.
    - `sessions.groups.list`, `sessions.groups.put`, `sessions.groups.rename` et `sessions.groups.delete` gèrent le catalogue de groupes de sessions personnalisés appartenant au Gateway (noms et ordre d’affichage). L’appartenance reste dans le champ `category` de chaque session ; les opérations de renommage et de suppression mettent à jour les sessions membres côté serveur.
    - `sessions.send` envoie un message dans une session existante.
    - `sessions.steer` est la variante d’interruption et de réorientation destinée à une session active.
    - `sessions.abort` abandonne le travail actif d’une session. Transmettez `key` avec le champ facultatif `runId`, ou uniquement `runId` pour les exécutions actives que le Gateway peut associer à une session.
    - `sessions.patch` met à jour les métadonnées et les substitutions de la session, puis indique le modèle canonique résolu ainsi que la valeur effective de `agentRuntime`.
    - `sessions.reset`, `sessions.delete` et `sessions.compact` assurent la maintenance des sessions.
    - `sessions.get` renvoie la ligne de session enregistrée complète.
    - L’exécution des conversations utilise toujours `chat.history`, `chat.send`, `chat.abort` et `chat.inject`. `chat.history` est normalisé pour l’affichage dans les clients d’interface utilisateur : les balises de directives intégrées sont supprimées du texte visible, les charges utiles XML d’appel d’outil en texte brut (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` et les blocs d’appel d’outil tronqués) ainsi que les jetons de contrôle du modèle ASCII ou pleine chasse divulgués sont supprimés, les lignes de l’assistant constituées uniquement de jetons silencieux (exactement `NO_REPLY` / `no_reply`) sont omises et les lignes trop volumineuses peuvent être remplacées par des espaces réservés.
    - `chat.message.get` est le lecteur additif, borné et intégral des messages pour une seule entrée visible de transcription. Transmettez `sessionKey`, le champ facultatif `agentId` lorsque la sélection de session est limitée à l’agent, ainsi qu’un `messageId` de transcription précédemment exposé par `chat.history` ; le Gateway renvoie la même projection normalisée pour l’affichage, sans la limite de troncature de l’historique allégé, lorsque l’entrée enregistrée est toujours disponible et n’est pas trop volumineuse.
    - `chat.toolTitles` renvoie de courts titres décrivant l’objectif des appels d’outils affichés dans la Control UI (traitement par lots, 24 éléments maximum avec des entrées bornées). Cette fonctionnalité s’active explicitement par `gateway.controlUi.toolTitles` (désactivée par défaut) ; les Gateway où elle est désactivée répondent `{ titles: {}, disabled: true }` sans appel au modèle, afin que les clients cessent d’effectuer ces requêtes. Lorsqu’elle est activée, les titres utilisent le routage standard des modèles utilitaires : soit un `utilityModel` explicitement configuré (une décision de l’opérateur qui, comme pour toutes les tâches utilitaires, peut envoyer un contenu de tâche borné au fournisseur choisi), soit le petit modèle par défaut déclaré par le fournisseur de la session, de sorte qu’aucune nouvelle destination de sortie n’apparaisse implicitement ; une valeur `utilityModel` vide les désactive complètement. Les titres ne se rabattent jamais sur le modèle principal. Les résultats sont mis en cache dans la base de données d’état propre à l’agent, avec une clé composée du nom de l’outil et de l’entrée, afin que les consultations répétées ne refacturent jamais les mêmes appels.
    - `chat.send` accepte la valeur `fastMode: "auto"` pour un seul tour afin d’utiliser le mode rapide pour les appels de modèle lancés avant la coupure automatique, puis de lancer les tentatives ultérieures, les solutions de repli, les résultats d’outils ou les appels de continuation sans le mode rapide. La coupure est fixée par défaut à 60 secondes (`DEFAULT_FAST_MODE_AUTO_ON_SECONDS`) et peut être configurée pour chaque modèle avec `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Un appelant `chat.send` peut transmettre la valeur `fastAutoOnSeconds` pour un seul tour afin de remplacer la coupure pour cette requête. Transmettez `queueMode` (`steer`, `followup`, `collect` ou `interrupt`) pour remplacer le mode de file d’attente enregistré uniquement pour cette requête ; les actions explicites de réorientation de la Control UI utilisent `queueMode: "steer"`.

  </Accordion>

  <Accordion title="Appairage des appareils et jetons d’appareil">
    - `device.pair.list` renvoie les appareils appairés en attente et approuvés.
    - `device.pair.setupCode` crée un code de configuration mobile et, par défaut, une URL de données de code QR au format PNG. Cette opération nécessite `operator.admin` et est volontairement omise de la découverte annoncée. Le résultat comprend `setupCode`, le champ facultatif `qrDataUrl`, `gatewayUrl`, le libellé non secret `auth` et `urlSource`.
    - `device.pair.approve`, `device.pair.reject` et `device.pair.remove` gèrent les enregistrements d’appairage des appareils.
    - `device.pair.rename` attribue un libellé d’opérateur (`{ deviceId, label }`) qui prévaut sur le nom d’affichage communiqué par le client et subsiste après la réparation ou la nouvelle approbation de l’appareil.
    - `device.token.rotate` renouvelle un jeton d’appareil appairé dans les limites de son rôle approuvé et de la portée de l’appelant.
    - `device.token.revoke` révoque un jeton d’appareil appairé dans les limites de son rôle approuvé et de la portée de l’appelant.

    Le code de configuration intègre un identifiant d’amorçage à courte durée de vie. Les clients ne doivent ni
    le journaliser ni le conserver au-delà du processus d’appairage.

  </Accordion>

  <Accordion title="Appairage des Node, invocation et travaux en attente">
    - `node.pair.list`, `node.pair.approve`, `node.pair.reject` et `node.pair.remove` couvrent les approbations des capacités des Node. `node.pair.request` et `node.pair.verify` ont été supprimés dans la version 2026.7 avec le magasin autonome d’appairage des Node ; les requêtes en attente sont créées par le Gateway lors de la connexion des Node.
    - `node.list` et `node.describe` renvoient l’état des Node connus/connectés.
    - `node.rename` met à jour le libellé d’un Node appairé.
    - `node.invoke` transmet une commande à un Node connecté.
    - `node.invoke.result` renvoie le résultat d’une requête d’invocation.
    - `mcp.tools.call.v1` est la commande sans interface graphique de l’hôte de Node permettant d’appeler un outil MCP local au Node configuré. Elle est acheminée via `node.invoke`, exige que le Node déclare la commande et reste soumise à l’approbation d’appairage et à `gateway.nodes.denyCommands`.
    - `node.event` renvoie au Gateway les événements provenant des Node.
    - `node.pluginTools.update` est le seul chemin de publication permettant de remplacer les descripteurs d’outils Plugin/MCP visibles par l’agent du Node connecté ; les paramètres de `connect` ne les transportent pas.
    - `node.pending.pull` et `node.pending.ack` sont les API de file d’attente des Node connectés.
    - `node.pending.enqueue` et `node.pending.drain` gèrent les travaux durables en attente pour les Node hors ligne/déconnectés.

  </Accordion>

  <Accordion title="Familles d’approbations">
    - `approval.get` et `approval.resolve` sont les méthodes d’approbation durable indépendantes du type (portée `operator.approvals`). `approval.get` renvoie une projection nettoyée, en attente ou terminale conservée, avec un `urlPath` stable ; `approval.resolve` accepte l’identifiant d’approbation canonique, un `kind` explicite et une décision, applique une résolution selon le principe de la première réponse retenue et renvoie toujours le résultat canonique enregistré.
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` et `exec.approval.resolve` couvrent les requêtes ponctuelles d’approbation d’exécution ainsi que la consultation et la relecture des approbations en attente. Ce sont des adaptateurs de frontière de protocole reposant sur le même registre durable d’approbations.
    - `exec.approval.waitDecision` attend une approbation d’exécution en attente et renvoie la décision finale (ou `null` en cas d’expiration du délai).
    - `exec.approvals.get` et `exec.approvals.set` gèrent les instantanés de stratégie d’approbation d’exécution du Gateway.
    - `exec.approvals.node.get` et `exec.approvals.node.set` gèrent la stratégie locale au Node d’approbation d’exécution au moyen de commandes de relais de Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` et `plugin.approval.resolve` couvrent les flux d’approbation définis par les Plugins.

  </Accordion>

  <Accordion title="Automatisation, Skills et outils">
    - Automatisation : `wake` planifie l’injection d’un texte de réveil immédiate ou au prochain Heartbeat ; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gèrent les travaux planifiés.
    - `cron.run` reste un RPC de mise en file d’attente pour les exécutions manuelles. Les clients nécessitant une sémantique d’achèvement doivent lire le `runId` renvoyé et interroger périodiquement `cron.runs`.
    - `cron.runs` accepte un filtre facultatif non vide `runId`, afin que les clients puissent suivre une exécution manuelle en file d’attente sans entrer en concurrence avec d’autres entrées d’historique de la même tâche.
    - Skills et outils : `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`. Voir [Méthodes d’assistance aux opérateurs](#operator-helper-methods) ci-dessous.

  </Accordion>
</AccordionGroup>

### Familles d’événements courantes

- `chat` : mises à jour de discussion de l’interface utilisateur telles que `chat.inject` et autres événements de discussion
  réservés à la transcription. Dans le protocole v4, les charges utiles différentielles transportent `deltaText` ; `message` reste
  l’instantané cumulatif de l’assistant. Les remplacements sans préfixe définissent
  `replace=true` et utilisent `deltaText` comme texte de remplacement.
- `session.message`, `session.operation`, `session.tool` : mises à jour de la transcription, des opérations de session
  en cours et du flux d’événements pour une session suivie.
- `session.approval` : état fiable et nettoyé des approbations en attente et terminales pour un
  abonné à une session exacte ayant explicitement accepté de les recevoir. Les approbations enfants utilisent l’audience
  persistante de l’ancêtre ; les événements ne modifient jamais les transcriptions et ne réveillent jamais les agents.
- `sessions.changed` : modification de l’index ou des métadonnées de session.
- `presence` : mises à jour de l’instantané de présence du système.
- `tick` : événement périodique de maintien de connexion/vitalité.
- `health` : mise à jour de l’instantané de santé du Gateway.
- `heartbeat` : mise à jour du flux d’événements Heartbeat.
- `cron` : événement de modification d’une exécution/tâche Cron.
- `shutdown` : notification d’arrêt du Gateway.
- `node.pair.requested` / `node.pair.resolved` : cycle de vie de l’appairage des Node.
- `node.invoke.request` : diffusion d’une requête d’invocation de Node.
- `device.pair.requested` / `device.pair.resolved` : cycle de vie des appareils appairés.
- `voicewake.changed` : modification de la configuration du déclencheur par mot de réveil.
- `exec.approval.requested` / `exec.approval.resolved` : cycle de vie des approbations
  d’exécution.
- `plugin.approval.requested` / `plugin.approval.resolved` : cycle de vie des approbations
  de Plugin.

### Méthodes d’assistance des Node

Les Node peuvent appeler `skills.bins` pour récupérer la liste actuelle des exécutables de Skills
à utiliser dans les vérifications d’autorisation automatique.

## RPC du registre d’audit

`audit.activity.list` fournit aux clients opérateurs une vue stable, du plus récent au plus ancien, des métadonnées du cycle de vie
des exécutions d’agent, des actions d’outil et des messages ayant fait l’objet d’une acceptation explicite. Il exige
`operator.read`. Les requêtes excluent les enregistrements de plus de 30 jours et le registre
SQLite partagé est limité à 100,000 enregistrements. Les lignes expirées sont supprimées au
démarrage du Gateway, lors de la maintenance horaire et des écritures ultérieures. Voir
[Historique d’audit](/fr/gateway/audit) pour le modèle de données et la sémantique de confidentialité.

- Paramètres : `agentId`, `sessionKey` ou `runId` exact facultatif ; `kind` facultatif
  (`"agent_run"`, `"tool_action"` ou `"message"`) ; `status` facultatif
  (`"started"`, `"succeeded"`, `"failed"`, `"cancelled"`, `"timed_out"`,
  `"blocked"` ou `"unknown"`) ; `direction` de message facultatif (`"inbound"` ou
  `"outbound"`) et `channel` exact ; limites inclusives facultatives `after` / `before`
  en millisecondes Unix ; `limit` facultatif de `1` à `500` ; et chaîne facultative
  `cursor` provenant de la page précédente.
- Résultat : `{ "events": AuditActivityEventV1[], "nextCursor"?: string }`.

L’union de résultats V1 nommée possède des schémas distincts pour les exécutions d’agent, les actions d’outil, les messages entrants
et les messages sortants. Le discriminateur `eventType` est respectivement
`agent_run`, `tool_action`, `inbound_message` ou `outbound_message` ; `kind` et
le `direction` de message restent disponibles pour le filtrage et l’affichage. Chaque événement possède un
`schemaVersion: 1` entier. Les références d’identité de message utilisent le format exact
`hmac-sha256:v1:<32 hex key id>:<64 hex digest>` ; l’identifiant d’un acteur expéditeur de canal
utilise le même format.

Toutes les variantes exigent `eventType`, `schemaVersion`, `eventId`, `sequence`,
`sourceSequence`, `occurredAt`, `kind`, `action`, `status`, `actor` et
`redaction`. Les champs des variantes sont les suivants :

| `eventType`        | Champs obligatoires                                               | Champs facultatifs                                                                                                              |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `agent_run`        | `agentId`, `runId` ; `kind: "agent_run"`                           | `sessionKey`, `sessionId`, `errorCode`                                                                                          |
| `tool_action`      | `agentId`, `runId` ; `kind: "tool_action"`                         | `sessionKey`, `sessionId`, `toolCallId`, `toolName`, `errorCode`                                                                |
| `inbound_message`  | `direction: "inbound"`, `channel`, `conversationKind`, `outcome`  | `agentId`, `runId`, `durationMs`, `resultCount`, références d’identité, `reasonCode`, `errorCode`                                 |
| `outbound_message` | `direction: "outbound"`, `channel`, `conversationKind`, `outcome` | `agentId`, `runId`, `durationMs`, `resultCount`, références d’identité, `reasonCode`, `deliveryKind`, `failureStage`, `errorCode` |

Les énumérations fermées de messages sont les suivantes :

- `conversationKind` : `direct`, `group`, `channel` ou `unknown`.
- `outcome` entrant : `completed`, `skipped` ou `failed` ; `reasonCode` facultatif :
  `duplicate`, `reply_operation_active`,
  `reply_operation_aborted`, `fast_abort`, `plugin_bound_handled`,
  `plugin_bound_unavailable`, `plugin_bound_declined`, `plugin_bound_error`,
  `before_dispatch_handled`, `acp_dispatch_completed`, `acp_dispatch_failed`,
  `acp_dispatch_empty` ou `acp_dispatch_aborted`.
- `outcome` sortant : `sent`, `suppressed`, `failed` ou `unknown` ; `reasonCode` facultatif :
  `cancelled_by_message_sending_hook`,
  `cancelled_by_reply_payload_sending_hook`,
  `empty_after_message_sending_hook`, `empty_after_reply_payload_sending_hook`
  ou `no_visible_payload`. Un adaptateur qui ne renvoie aucune identité de plateforme est
  `unknown`, car l’effet secondaire externe ne peut pas être réfuté.
- `deliveryKind` : `text`, `media` ou `other` ; `failureStage` :
  `platform_send`, `queue` ou `unknown`.

Les champs terminaux sont corrélés et non facultatifs indépendamment :

| Variante         | Correspondance terminale                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Exécution d’agent | `started` ne possède aucun `errorCode` ; chaque état terminé autre que la réussite exige son code `run_*` correspondant.                                                                 |
| Action d’outil    | `started` et la réussite ne possèdent aucun `errorCode` ; chaque autre état terminé exige son code `tool_*` correspondant.                                                       |
| Message entrant   | réussite = `completed` ; blocage = `skipped` ; échec = `failed` plus `message_processing_failed`. `reasonCode`, s’il est présent, doit appartenir à cette famille terminale. |
| Message sortant   | réussite = `sent` ; blocage = `suppressed` plus `reasonCode` ; échec = `failed` plus `errorCode` et `failureStage` ; inconnu = `unknown` plus `failureStage`.      |

Chaque événement d’activité comprend un identifiant d’événement stable, une séquence de registre monotone,
une séquence d’événement source, un horodatage, un acteur, une action, un statut, un entier
`schemaVersion: 1` et `redaction: "metadata_only"`. Les enregistrements d’exécution et d’outil
nécessitent la provenance de l’agent et de l’exécution et peuvent inclure la provenance de la session. Les
enregistrements de message peuvent inclure des identifiants d’agent et d’exécution, mais n’incluent intentionnellement jamais
`sessionKey` ni `sessionId` ; le filtre de requête `sessionKey` ne s’applique donc
qu’aux lignes d’exécution et d’outil. Les événements d’outil peuvent inclure l’identifiant d’appel de l’outil et son nom.

Les enregistrements de message utilisent `message.inbound.processed` ou
`message.outbound.finished` et ajoutent la direction, le canal, le type de conversation,
le résultat normalisé ainsi que, facultativement, le type de livraison, l’étape d’échec, la durée,
le nombre de résultats, le code de motif et des pseudonymes avec clé, propres à l’installation,
pour le compte, la conversation, le message et la cible. Ces pseudonymes facilitent
la corrélation, mais ne constituent pas une anonymisation : la base de données d’état contient leur clé,
contrairement aux exportations RPC et CLI. Le registre ne stocke ni les invites, ni le contenu des messages,
ni les arguments ou résultats des outils, ni la sortie des commandes, ni le texte brut des erreurs.
Les valeurs `sessionKey` d’exécution et d’outil restent des métadonnées de corrélation brutes et peuvent intégrer
des identifiants de compte ou de pair de la plateforme ; les enregistrements de message omettent les clés de session.

Pour les lignes entrantes, `durationMs` mesure le traitement par le cœur jusqu’à son état terminal et
`resultCount` compte les charges utiles finalisées d’outil, de bloc et de réponse mises en file d’attente. Pour
les lignes sortantes, `durationMs` couvre la prise en charge de la livraison jusqu’à l’accusé de réception,
la lettre morte ou la réconciliation (temps d’attente en file compris), et `resultCount`
compte les envois physiques identifiés sur la plateforme. `deliveryKind`, lorsqu’il est présent,
décrit la charge utile effective après les hooks et le rendu ; les lignes supprimées ou
rendues ambiguës par un plantage l’omettent.

La couverture actuelle des messages comprend les messages entrants acceptés qui atteignent le
traitement par le cœur, y compris les résultats de doublon ou terminaux du cœur. Pour les messages sortants, elle écrit
une ligne terminale par charge utile de réponse logique d’origine qui atteint la livraison durable
partagée ; le découpage et la distribution par les adaptateurs sont agrégés dans `resultCount`. Les envois
réessayables ou ambigus mis en file d’attente ne sont enregistrés qu’après un accusé de réception, une lettre
morte ou une réconciliation. Les chemins propres aux Plugins et les chemins d’envoi direct qui contournent ces
limites partagées ne sont pas encore couverts. La file d’attente bornée du worker fonctionne au mieux
et peut perdre des enregistrements en cas d’échec ou de saturation ; cette surface ne constitue donc pas une
archive de conformité sans perte.

L’enregistrement est activé par défaut et contrôlé par
[`audit.enabled`](/fr/gateway/configuration-reference#audit). L’enregistrement des messages est
contrôlé séparément par `audit.messages` et sa valeur par défaut est `"off"`. Lorsque
l’enregistrement est désactivé, `audit.activity.list` continue de fournir les enregistrements écrits
précédemment jusqu’à leur expiration.

Les schémas livrés de requête `audit.list`, de résultat et de `AuditEvent` restent
inchangés et renvoient uniquement les enregistrements d’exécution d’agent et d’action d’outil. Les nouveaux clients
opérateurs doivent appeler `audit.activity.list` lorsque le Gateway l’annonce. Les anciens
Gateways peuvent signaler soit `unknown method: audit.activity.list`, soit, puisque
l’autorisation précédait la recherche de méthode dans les versions livrées, `missing scope:
operator.admin` pour une requête limitée à la lecture. Ne considérez ce dernier comme une absence de méthode
que si la méthode n’était pas annoncée. Un client peut alors réessayer `audit.list`
uniquement si ses filtres ne nécessitent pas la prise en charge du type de message, de la direction ou du canal.

Utilisez [`openclaw audit`](/fr/cli/audit) pour les requêtes textuelles et les exportations JSON bornées.

## RPC du registre des tâches

Les clients opérateurs inspectent et annulent les enregistrements de tâches en arrière-plan du Gateway au moyen
des RPC du registre des tâches (`packages/gateway-protocol/src/schema/tasks.ts`). Ceux-ci
renvoient des résumés de tâches nettoyés, et non l’état brut de l’environnement d’exécution.

- `tasks.list` nécessite `operator.read`.
  - Paramètres : `status` facultatif (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` ou `"timed_out"`) ou un tableau de ces statuts,
    `agentId` facultatif, `sessionKey` facultatif, `limit` facultatif compris entre `1` et
    `500`, et chaîne `cursor` facultative.
  - Résultat : `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` nécessite `operator.read`.
  - Paramètres : `{ "taskId": string }`.
  - Résultat : `{ "task": TaskSummary }`.
  - Les identifiants de tâche manquants renvoient le format d’erreur d’absence de résultat du Gateway.
- `tasks.cancel` nécessite `operator.write`.
  - Paramètres : `{ "taskId": string, "reason"?: string }`.
  - Résultat : `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` indique si le registre contenait une tâche correspondante. `cancelled`
    indique si l’environnement d’exécution a accepté ou enregistré l’annulation.

`TaskSummary` comprend `id`, `status` et des métadonnées facultatives : `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, les horodatages, la progression,
le résumé terminal et le texte d’erreur nettoyé. `agentId` identifie l’agent
qui exécute la tâche ; `sessionKey` et `ownerKey` préservent le contexte du demandeur et du contrôle.

## Méthodes d’assistance pour les opérateurs

- `commands.list` (`operator.read`) récupère l’inventaire des commandes de l’environnement d’exécution pour
  un agent.
  - `agentId` est facultatif ; omettez-le pour lire l’espace de travail de l’agent par défaut.
  - `scope` détermine la surface ciblée par le `name` principal : `text` renvoie
    le jeton principal de commande textuelle sans le `/` initial ; `native` et le
    chemin `both` par défaut renvoient les noms natifs adaptés au fournisseur lorsqu’ils sont disponibles.
  - `textAliases` contient les alias exacts avec barre oblique, tels que `/model` et `/m`.
  - `nativeName` contient le nom de commande natif adapté au fournisseur lorsqu’il
    existe.
  - `provider` est facultatif et n’affecte que la dénomination native ainsi que la disponibilité des commandes
    natives des Plugins.
  - `includeArgs=false` omet de la réponse les métadonnées d’arguments sérialisées.
- `tools.catalog` (`operator.read`) récupère le catalogue des outils de l’environnement d’exécution pour un
  agent. La réponse comprend les outils regroupés et les métadonnées de provenance :
  - `source` : `core` ou `plugin`
  - `pluginId` : Plugin propriétaire lorsque `source="plugin"`
  - `optional` : indique si un outil de Plugin est facultatif
- `tools.effective` (`operator.read`) récupère l’inventaire effectif des outils de l’environnement
  d’exécution pour une session.
  - `sessionKey` est obligatoire.
  - Le Gateway déduit le contexte d’exécution fiable de la session côté serveur
    au lieu d’accepter un contexte d’authentification ou de livraison fourni par l’appelant.
  - La réponse est une projection dérivée par le serveur et limitée à la session de l’inventaire
    actif, comprenant les outils du cœur, des Plugins, des canaux et des serveurs MCP
    déjà découverts.
  - `tools.effective` est en lecture seule pour MCP : il peut projeter le catalogue MCP
    d’une session active au travers de la politique finale des outils, mais ne crée pas d’environnements d’exécution MCP,
    ne connecte pas de transports et n’émet pas de `tools/list`. Si aucun catalogue actif correspondant
    n’existe, la réponse peut inclure un avis tel que `mcp-not-yet-connected`,
    `mcp-not-yet-listed` ou `mcp-stale-catalog`.
  - Les entrées d’outils effectives utilisent `source="core"`, `source="plugin"`,
    `source="channel"` ou `source="mcp"`.
- `tools.invoke` (`operator.write`) appelle un outil disponible au moyen du
  même chemin de politique du Gateway que `/tools/invoke`.
  - `name` est obligatoire. `args`, `sessionKey`, `agentId`, `confirm` et
    `idempotencyKey` sont facultatifs.
  - Si `sessionKey` et `agentId` sont tous deux présents, l’agent de session résolu
    doit correspondre à `agentId`.
  - Les wrappers du cœur réservés au propriétaire, tels que `cron`, `gateway` et `nodes`, nécessitent
    une identité de propriétaire ou d’administrateur (`operator.admin`), même si `tools.invoke`
    est lui-même `operator.write`.
  - La réponse est une enveloppe destinée au SDK avec `ok`, `toolName`, un champ
    `output` facultatif et des champs `error` typés. Les refus liés à l’approbation ou à la politique renvoient
    `ok:false` dans la charge utile au lieu de contourner le pipeline de politique
    des outils du Gateway.
- `skills.status` (`operator.read`) récupère l’inventaire des Skills visibles pour un
  agent.
  - `agentId` est facultatif ; omettez-le pour lire l’espace de travail de l’agent par défaut.
  - La réponse comprend l’éligibilité, les exigences manquantes, les vérifications de configuration
    et les options d’installation nettoyées sans exposer les valeurs brutes des secrets.
- `skills.search` et `skills.detail` (`operator.read`) renvoient les métadonnées
  de découverte de ClawHub.
- `skills.upload.begin`, `skills.upload.chunk` et `skills.upload.commit`
  (`operator.admin`) préparent une archive privée de Skill avant de l’installer. Il s’agit
  d’un chemin distinct de téléversement administratif destiné aux clients de confiance, et non du flux normal
  d’installation des Skills de ClawHub ; il est désactivé par défaut sauf si
  `skills.install.allowUploadedArchives` est activé.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    crée un téléversement lié à ce slug et à cette valeur de forçage.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` ajoute des octets à
    l’offset décodé exact.
  - `skills.upload.commit({ uploadId, sha256? })` vérifie la taille finale et
    le SHA-256. La validation ne fait que finaliser le téléversement ; elle n’installe pas le Skill.
  - Les archives de Skills téléversées sont des archives zip contenant une racine `SKILL.md`. Le
    nom du répertoire interne de l’archive ne détermine jamais la cible d’installation.
- `skills.install` (`operator.admin`) comporte trois modes :
  - Mode ClawHub : `{ source: "clawhub", slug, version?, force? }` installe un
    dossier de Skill dans le répertoire `skills/` de l’espace de travail de l’agent par défaut.
  - Mode téléversement : `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    installe un téléversement validé dans le répertoire
    `skills/<slug>` de l’espace de travail de l’agent par défaut. Le slug et la valeur de forçage doivent correspondre à
    la requête `skills.upload.begin` d’origine. Rejeté sauf si
    `skills.install.allowUploadedArchives` est activé ; ce paramètre n’affecte pas
    les installations de ClawHub.
  - Mode programme d’installation du Gateway : `{ name, installId, timeoutMs? }` exécute une action
    `metadata.openclaw.install` déclarée sur l’hôte du Gateway. Les anciens clients peuvent
    encore envoyer `dangerouslyForceUnsafeInstall` ; ce champ est obsolète,
    accepté uniquement pour la compatibilité du protocole et ignoré. Utilisez
    `security.installPolicy` pour les décisions d’installation appartenant à l’opérateur.
- `skills.update` (`operator.admin`) comporte deux modes :
  - Le mode ClawHub met à jour un slug suivi ou toutes les installations ClawHub suivies dans
    l’espace de travail de l’agent par défaut.
  - Le mode configuration corrige les valeurs `skills.entries.<skillKey>` telles que `enabled`,
    `apiKey` et `env`.

### Vues `models.list`

`models.list` accepte un paramètre `view` facultatif
(`src/agents/model-catalog-visibility.ts`) :

- Omis ou `"default"` : si `agents.defaults.models` est configuré, la
  réponse correspond au catalogue autorisé, y compris les modèles découverts dynamiquement
  pour les entrées `provider/*`. Sinon, la réponse correspond au catalogue complet du
  Gateway.
- `"configured"` : comportement adapté au sélecteur. Si `agents.defaults.models` est
  configuré, il reste prioritaire, y compris pour la découverte limitée au fournisseur des
  entrées `provider/*`. Sans liste d’autorisation, la réponse utilise les entrées
  `models.providers.<provider>.models` explicites et ne se rabat sur le catalogue
  complet que si aucune ligne de modèle configurée n’existe.
- `"provider-config"` : inventaire `models.providers.*.models` défini par la source,
  indépendant des listes d’autorisation du sélecteur. Les lignes incluent les capacités publiques des modèles et
  la disponibilité tenant compte des routes, mais omettent les points de terminaison des fournisseurs, les données
  d’authentification et la configuration des requêtes d’exécution.
- `"all"` : catalogue complet du Gateway, sans tenir compte de `agents.defaults.models`. À utiliser pour
  les interfaces utilisateur de diagnostic et de découverte, et non pour les sélecteurs de modèles ordinaires.

## Approbations d’exécution

- Lorsqu’une requête d’exécution nécessite une approbation, le Gateway diffuse
  `exec.approval.requested`.
- Les clients opérateurs la traitent en appelant `exec.approval.resolve` (nécessite
  `operator.approvals`).
- Pour `host=node`, `exec.approval.request` doit inclure `systemRunPlan`
  (métadonnées canoniques `argv`/`cwd`/`rawCommand`/de session). Les requêtes dépourvues de
  `systemRunPlan` sont rejetées.
- Après approbation, les appels `node.invoke system.run` transférés réutilisent ce
  `systemRunPlan` canonique comme contexte de commande, de répertoire de travail et de session faisant autorité.
- Si un appelant modifie `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` entre la préparation et le transfert `system.run` final approuvé,
  le Gateway rejette l’exécution au lieu de faire confiance à la charge utile modifiée.

## Solution de repli pour la livraison de l’agent

- Les requêtes `agent` peuvent inclure `deliver=true` pour demander une livraison sortante.
- `bestEffortDeliver=false` (la valeur par défaut) conserve un comportement strict : les cibles de livraison
  non résolues ou uniquement internes renvoient `INVALID_REQUEST`.
- `bestEffortDeliver=true` autorise le repli vers une exécution limitée à la session lorsqu’aucune
  route externe permettant la livraison ne peut être résolue (par exemple, pour les sessions internes/de chat web
  ou les configurations multicanaux ambiguës).
- Les résultats `agent` finaux peuvent inclure `result.deliveryStatus` lorsqu’une livraison a été
  demandée, en utilisant les mêmes états `sent`, `suppressed`, `partial_failed` et
  `failed` que ceux documentés pour
  [`openclaw agent --json --deliver`](/fr/cli/agent#json-delivery-status).

## Gestion des versions

- `PROTOCOL_VERSION`, `MIN_CLIENT_PROTOCOL_VERSION`,
  `MIN_NODE_PROTOCOL_VERSION` et `MIN_PROBE_PROTOCOL_VERSION` se trouvent dans
  `packages/gateway-protocol/src/version.ts`.
- Les clients envoient `minProtocol` + `maxProtocol`. Les clients opérateurs et d’interface utilisateur doivent
  inclure le protocole actuel dans cette plage ; les clients et serveurs actuels utilisent
  le protocole v4.
- Les clients authentifiés disposant à la fois de `role: "node"` et de `client.mode: "node"`
  peuvent utiliser le protocole Node N-1 (actuellement v3). Les sondes légères de redémarrage utilisent
  la même fenêtre N-1. L’authentification des appareils, l’association, les portées, la politique de commande et les approbations
  d’exécution ne sont pas modifiées par cette fenêtre de compatibilité. Les capacités et commandes
  Node détenues par des Plugins sont masquées jusqu’à ce que le Node soit mis à niveau vers le protocole
  actuel, car leurs surfaces hébergées ne font pas partie du contrat N-1.
- Les schémas et les modèles sont générés à partir des définitions TypeBox :
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes du client

L’implémentation du client de référence se trouve dans `packages/gateway-client/src/`
(OpenClaw l’encapsule au moyen de la façade légère `src/gateway/client.ts`). Ces
valeurs par défaut sont stables pour le protocole v4 et constituent la référence attendue pour
les clients tiers.

| Constante                                 | Valeur par défaut                                     | Source                                                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_NODE_PROTOCOL_VERSION`               | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_PROBE_PROTOCOL_VERSION`              | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| Délai d’expiration des requêtes (par RPC) | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`requestTimeoutMs`)                                                              |
| Délai de préauthentification / de défi de connexion | `15_000` ms                                           | `packages/gateway-client/src/timeouts.ts` (la variable d’environnement `OPENCLAW_HANDSHAKE_TIMEOUT_MS` peut augmenter le délai imparti au serveur/client associé) |
| Temporisation initiale de reconnexion     | `1_000` ms                                            | `packages/gateway-client/src/client.ts` (`GATEWAY_RECONNECT_POLICY`)                                                      |
| Temporisation maximale de reconnexion     | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`GATEWAY_RECONNECT_POLICY`)                                                      |
| Plafond de nouvelle tentative rapide après une fermeture liée au jeton d’appareil | `250` ms                                              | `packages/gateway-client/src/client.ts`                                                                                   |
| Délai de grâce avant l’arrêt forcé par `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                                                           |
| Délai d’expiration par défaut de `stopAndWait()`           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                                                |
| Intervalle de pulsation par défaut (avant `hello-ok`)    | `30_000` ms                                           | `packages/gateway-client/src/client.ts`                                                                                   |
| Fermeture sur expiration de la pulsation | code `4000` lorsque le silence dépasse `tickIntervalMs * 2` | `packages/gateway-client/src/client.ts`                                                                                   |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                                                         |

Le serveur annonce les valeurs effectives de `policy.tickIntervalMs`,
`policy.maxPayload` et `policy.maxBufferedBytes` dans `hello-ok` ; les clients
doivent respecter ces valeurs plutôt que les valeurs par défaut antérieures à la négociation.

Le client de référence permet aux requêtes finies de gérer leur propre échéance configurée lorsque
chaque requête en attente en possède une. Une requête `expectFinal` sans
`timeoutMs` fini, toute requête avec `timeoutMs: null`, ou un mélange de requêtes finies et
sans limite maintient actif le chien de garde de pulsation. Si les événements entrants et les
réponses restent silencieux au-delà du seuil d’expiration de la pulsation, le client ferme le
socket avec le code `4000`, rejette toutes les requêtes en attente et se reconnecte. Il ne
réexécute pas les requêtes rejetées après la reconnexion.

## Authentification

- L’authentification du Gateway par secret partagé utilise `connect.params.auth.token` ou
  `connect.params.auth.password`, selon la valeur configurée de
  `gateway.auth.mode` (`"none" | "token" | "password" | "trusted-proxy"`).
- Les modes porteurs d’identité tels que Tailscale Serve (`gateway.auth.allowTailscale: true`)
  ou `gateway.auth.mode: "trusted-proxy"` hors boucle locale satisfont le contrôle
  d’authentification de la connexion à partir des en-têtes de requête plutôt que de `connect.params.auth.*`.
- Le `gateway.auth.mode: "none"` à entrée privée ignore entièrement l’authentification
  de connexion par secret partagé ; n’exposez pas ce mode sur une entrée publique ou non fiable.
- Après l’appairage, le Gateway émet un jeton d’appareil limité au rôle et aux
  portées de la connexion, renvoyé dans `hello-ok.auth.deviceToken`. Les clients doivent
  le conserver après toute connexion réussie.
- La reconnexion avec ce jeton d’appareil enregistré doit également réutiliser
  l’ensemble de portées approuvé et enregistré pour ce jeton. Cela préserve les accès
  de lecture, de sondage et d’état déjà accordés et évite de réduire silencieusement
  les reconnexions à une portée implicite plus étroite, réservée à l’administration.
- Assemblage de l’authentification de connexion côté client (`selectConnectAuth` dans
  `packages/gateway-client/src/client.ts`) :
  - `auth.password` est indépendant et toujours transmis lorsqu’il est défini.
  - `auth.token` est renseigné selon l’ordre de priorité suivant : d’abord le jeton partagé explicite,
    puis un `deviceToken` explicite, puis un jeton enregistré propre à l’appareil (indexé par
    `deviceId` + `role`).
  - `auth.bootstrapToken` n’est envoyé que si aucun des éléments ci-dessus n’a permis de déterminer
    `auth.token`. Un jeton partagé ou tout jeton d’appareil déterminé le désactive.
  - La promotion automatique d’un jeton d’appareil enregistré lors de l’unique
    nouvelle tentative `AUTH_TOKEN_MISMATCH` est limitée aux points de terminaison fiables : boucle locale,
    ou `wss://` avec une valeur `tlsFingerprint` épinglée. Un `wss://` public sans épinglage
    n’est pas admissible.
- L’amorçage intégré par code de configuration renvoie le
  `hello-ok.auth.deviceToken` du Node principal ainsi qu’un jeton d’opérateur à portée limitée dans
  `hello-ok.auth.deviceTokens` pour un transfert mobile fiable. Le jeton d’opérateur
  inclut `operator.talk.secrets` pour les lectures de configuration Talk natives, mais
  exclut les portées de modification de l’appairage et `operator.admin`.
- Pendant qu’un amorçage par code de configuration hors référence attend une approbation,
  les détails de `PAIRING_REQUIRED` incluent `recommendedNextStep: "wait_then_retry"`,
  `retryable: true` et `pauseReconnect: false`. Continuez à vous reconnecter avec le
  même jeton d’amorçage jusqu’à l’approbation de la demande ou l’invalidation du jeton.
- Ne conservez `hello-ok.auth.deviceTokens` que lorsque la connexion a utilisé l’authentification
  d’amorçage sur un transport fiable tel que `wss://` ou un appairage local/par boucle locale.
- Si un client fournit un `deviceToken` explicite ou un `scopes` explicite,
  l’ensemble de portées demandé par cet appelant reste la référence ; les portées mises en cache ne sont
  réutilisées que lorsque le client réutilise le jeton enregistré propre à l’appareil.
- Les jetons d’appareil peuvent être renouvelés ou révoqués via `device.token.rotate` et
  `device.token.revoke` (nécessite `operator.pairing`). Le renouvellement ou la révocation d’un
  Node ou d’un autre rôle non-opérateur nécessite également `operator.admin`.
- `device.token.rotate` renvoie les métadonnées de renouvellement. Il renvoie le jeton
  porteur de remplacement uniquement pour les appels du même appareil déjà authentifiés avec ce
  jeton d’appareil, afin que les clients utilisant uniquement un jeton puissent conserver son remplacement avant
  de se reconnecter. Les renouvellements partagés ou administratifs ne renvoient pas le jeton porteur.
- L’émission, le renouvellement et la révocation de jetons restent limités à l’ensemble
  de rôles approuvé et enregistré dans l’entrée d’appairage de cet appareil ; la modification d’un jeton ne peut
  ni étendre ni cibler un rôle d’appareil que l’approbation d’appairage n’a jamais accordé.
- Pour les sessions utilisant un jeton d’appareil appairé, la gestion des appareils est limitée
  à l’appareil lui-même, sauf si l’appelant possède également `operator.admin` : les appelants non administrateurs
  peuvent gérer uniquement le jeton d’opérateur de leur propre entrée d’appareil. La gestion des jetons
  de Node et des autres jetons non-opérateurs est réservée aux administrateurs, même pour l’appareil de l’appelant.
- `device.token.rotate` et `device.token.revoke` vérifient également l’ensemble de portées
  du jeton d’opérateur ciblé par rapport aux portées de la session actuelle de l’appelant.
  Les appelants non administrateurs ne peuvent ni renouveler ni révoquer un jeton d’opérateur dont la portée
  est plus large que celle qu’ils possèdent déjà.
- Les échecs d’authentification incluent `error.details.code` ainsi que des indications de récupération :
  - `error.details.canRetryWithDeviceToken` (booléen)
  - `error.details.recommendedNextStep` : l’une des valeurs `retry_with_device_token`,
    `update_auth_configuration`, `update_auth_credentials`,
    `wait_then_retry`, `review_auth_configuration`
    (`packages/gateway-protocol/src/connect-error-details.ts`).
- Comportement du client pour `AUTH_TOKEN_MISMATCH` :
  - Les clients fiables peuvent effectuer une unique nouvelle tentative limitée avec un jeton
    propre à l’appareil mis en cache.
  - Si cette nouvelle tentative échoue, arrêtez les boucles de reconnexion automatique et affichez
    des instructions sur l’intervention requise de l’opérateur.
- `AUTH_SCOPE_MISMATCH` signifie que le jeton d’appareil a été reconnu, mais qu’il ne
  couvre pas le rôle ou les portées demandés. Ne le présentez pas comme un jeton incorrect ; invitez
  l’opérateur à effectuer un nouvel appairage ou à approuver le contrat de portée plus étroit ou plus large.

## Identité et appairage des appareils

- Les Nodes doivent inclure une identité d’appareil stable (`device.id`) dérivée de
  l’empreinte d’une paire de clés.
- Les Gateways émettent des jetons par appareil et par rôle.
- Les nouveaux identifiants d’appareil nécessitent une approbation d’appairage, sauf si
  l’approbation automatique locale est activée.
- L’approbation automatique de l’appairage est centrée sur les connexions locales directes par boucle locale.
- OpenClaw dispose également d’un chemin étroit d’auto-connexion locale au backend/conteneur pour
  les flux d’assistance fiables utilisant un secret partagé.
- Les connexions au tailnet ou au réseau local depuis le même hôte restent considérées comme distantes
  pour l’appairage et nécessitent une approbation.
- Les clients WS incluent normalement une identité `device` pendant `connect` (opérateur +
  Node). Les seules exceptions sans appareil pour les opérateurs sont les chemins de confiance explicites :
  - `gateway.controlUi.allowInsecureAuth=true` pour la compatibilité HTTP non sécurisée
    limitée à localhost.
  - authentification réussie de l’interface de contrôle opérateur `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (solution de dernier recours, dégradation
    sévère de la sécurité).
  - RPC backend `gateway-client` en boucle locale directe sur le chemin d’assistance
    interne réservé.
- L’absence d’identité d’appareil a des conséquences sur les portées. Lorsqu’une connexion
  opérateur sans appareil est autorisée via un chemin de confiance explicite, OpenClaw
  efface tout de même les portées autodéclarées pour obtenir un ensemble vide, sauf si ce chemin possède une
  exception nommée de conservation des portées. Les méthodes soumises à des portées échouent alors avec
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` est un chemin de dernier recours de conservation
  des portées pour l’interface de contrôle. Il n’accorde pas de portées à des clients WebSocket
  arbitraires de backend personnalisé ou présentant la forme de la CLI.
- Le chemin d’assistance backend réservé `gateway-client` en boucle locale directe conserve
  les portées uniquement pour les RPC internes du plan de contrôle local ; les identifiants de backend personnalisés
  ne bénéficient pas de cette exception.
- Toutes les connexions doivent signer le nonce `connect.challenge` fourni par le serveur.

### Diagnostics de migration de l’authentification des appareils

Pour les anciens clients qui utilisent encore le comportement de signature antérieur au défi, `connect`
renvoie des codes détaillés `DEVICE_AUTH_*` sous `error.details.code` avec une valeur
`error.details.reason` stable.

Échecs de migration courants :

| Message                     | details.code                     | details.reason           | Signification                                      |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Le client a omis `device.nonce` (ou a envoyé une valeur vide). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Le client a signé avec un nonce obsolète ou incorrect. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | La charge utile de signature ne correspond pas à la charge utile v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | L’horodatage signé se trouve en dehors de la dérive autorisée. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` ne correspond pas à l’empreinte de la clé publique. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Le format ou la canonisation de la clé publique a échoué. |

Cible de migration :

- Attendez toujours `connect.challenge`.
- Signez la charge utile v2 qui inclut le nonce du serveur.
- Envoyez le même nonce dans `connect.params.device.nonce`.
- La charge utile de signature recommandée est `v3`
  (`buildDeviceAuthPayloadV3` dans `packages/gateway-client/src/device-auth.ts`),
  qui lie `platform` et `deviceFamily` en plus des
  champs d’appareil, de client, de rôle, de portées, de jeton et de nonce.
- Les signatures `v2` héritées restent acceptées à des fins de compatibilité, mais l’épinglage
  des métadonnées des appareils appairés continue de contrôler la politique des commandes lors de la reconnexion.

## TLS et épinglage

- TLS est pris en charge pour les connexions WS (configuration `gateway.tls`).
- Les clients peuvent facultativement épingler l’empreinte du certificat du Gateway via
  `gateway.remote.tlsFingerprint` ou l’option CLI `--tls-fingerprint`.

## Portée

Ce protocole expose l’intégralité de l’API du Gateway : état, canaux, modèles, discussion,
agent, sessions, Nodes, approbations et plus encore. La surface exacte est définie par
les schémas TypeBox réexportés depuis `packages/gateway-protocol/src/schema.ts`.

## Rubriques connexes

- [Protocole de pont](/fr/gateway/bridge-protocol)
- [Guide d’exploitation du Gateway](/fr/gateway)
