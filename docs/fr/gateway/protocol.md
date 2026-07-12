---
read_when:
    - Implémentation ou mise à jour des clients WS du Gateway
    - Débogage des incompatibilités de protocole ou des échecs de connexion
    - Régénération du schéma et des modèles du protocole
summary: 'Protocole WebSocket du Gateway : établissement de la connexion, trames et gestion des versions'
title: Protocole du Gateway
x-i18n:
    generated_at: "2026-07-12T15:26:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d71b75d49bf8a1ea2d835b1d8e532b1d01e87e8b64d6ab7dcb00f28791d3b8ac
    source_path: gateway/protocol.md
    workflow: 16
---

Le protocole WS du Gateway constitue l’unique plan de contrôle et le transport des nœuds pour
OpenClaw. Les clients opérateurs et nœuds (CLI, interface Web, application macOS, nœuds iOS/Android,
nœuds sans interface) se connectent via WebSocket et déclarent un **rôle** et une **portée** lors
de la négociation initiale.

## Transport et tramage

- WebSocket, trames texte, charges utiles JSON.
- La première trame **doit** être une requête `connect`.
- Les trames précédant la connexion sont limitées à 64 KiB (`MAX_PREAUTH_PAYLOAD_BYTES`). Après
  la négociation initiale, respectez `hello-ok.policy.maxPayload` et
  `hello-ok.policy.maxBufferedBytes`. Lorsque les diagnostics sont activés, les trames
  entrantes surdimensionnées et les tampons sortants lents émettent des événements `payload.large` avant
  que le Gateway ferme la connexion ou abandonne la trame. Ces événements contiennent `surface`, les tailles
  en octets, les limites et un code de motif sûr, mais jamais le corps des messages, le contenu
  des pièces jointes, les octets bruts des trames, les jetons, les cookies ou les secrets.

Formats des trames :

- Requête : `{type:"req", id, method, params}`
- Réponse : `{type:"res", id, ok, payload|error}`
- Événement : `{type:"event", event, payload, seq?, stateVersion?}`

Les méthodes produisant des effets de bord nécessitent des clés d’idempotence (voir le schéma).

## Négociation initiale

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
indique le rôle et les portées négociés même lorsqu’aucun jeton d’appareil n’est émis (format
ci-dessus). `pluginSurfaceUrls` est facultatif et associe les noms de surfaces de Plugin (par exemple
`canvas`) à des URL hébergées et limitées à leur portée ; ces URL pouvant expirer, les nœuds appellent
`node.pluginSurface.refresh` avec `{ "surface": "canvas" }` pour obtenir une nouvelle entrée.
Le chemin obsolète `canvasHostUrl` / `canvasCapability` / `node.canvas.capability.refresh`
n’est pas pris en charge ; utilisez les surfaces de Plugin.

Pendant que le Gateway termine encore le démarrage des processus auxiliaires, `connect` peut renvoyer une
erreur `UNAVAILABLE` pouvant faire l’objet d’une nouvelle tentative, avec `details.reason: "startup-sidecars"` et
`retryAfterMs`. Réessayez dans la limite de votre délai de connexion au lieu de considérer cela comme
un échec définitif de la négociation initiale.

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

L’amorçage intégré par code QR/code de configuration est un chemin de transfert mobile. Une connexion
réussie avec un code de configuration de base renvoie un jeton de nœud principal ainsi qu’un jeton
opérateur limité :

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
de l’opérateur mobile et la configuration native, notamment `operator.talk.secrets` pour les lectures
de configuration de Talk, mais n’inclut aucune portée de modification de l’appairage ni `operator.admin`. Un accès
plus étendu à l’appairage ou à l’administration nécessite un flux distinct d’appairage approuvé ou de jeton. Ne conservez
`hello-ok.auth.deviceTokens` que lorsque l’authentification d’amorçage a été effectuée via un
transport fiable (`wss://` ou un appairage en boucle locale/local).

Les clients backend fiables exécutés dans le même processus (`client.id: "gateway-client"`,
`client.mode: "backend"`) peuvent omettre `device` sur les connexions directes en boucle locale lorsqu’ils
s’authentifient avec le jeton ou le mot de passe partagé du Gateway. Ce chemin est réservé
aux RPC internes du plan de contrôle (par exemple, les mises à jour de session de sous-agent) et évite
que des références d’appairage CLI/appareil obsolètes bloquent les opérations locales du backend. Les clients distants,
issus d’un navigateur, de type nœud, ou utilisant explicitement un jeton d’appareil ou une identité d’appareil passent toujours
par les contrôles normaux d’appairage et d’élévation de portée.

### Rôle de worker et protocole fermé

Les workers cloud utilisent un point d’entrée dédié en boucle locale via le tunnel SSH appartenant au Gateway,
avec clé d’hôte épinglée. Il accepte uniquement l’identité du worker et ne distribue jamais
l’authentification générale, les événements de nœuds, les RPC d’opérateur ou les méthodes de Plugin. Un `connect`
strict vérifie un identifiant de connexion de courte durée, stocké sous forme de hachage et lié à l’environnement, au hachage
du paquet, à l’époque du propriétaire, à la version de l’ensemble de RPC, à l’expiration et à une session nullable ; il
vérifie séparément la version et l’ensemble de fonctionnalités actuels. En cas de réussite, il renvoie un
`worker-hello-ok` minimal ; la négociation des fonctionnalités est indépendante de la version générale du protocole.
Les trames restent inférieures à 64 KiB. La liste d’autorisation fermée contient
`worker.heartbeat`, `worker.transcript.commit` et `worker.live-event`.
Les validations de transcription utilisent une clôture par époque du propriétaire, une liaison de session appartenant au Gateway, une opération
de comparaison-échange sur la feuille de base et une relecture durable des séquences ; le Gateway génère les identifiants
d’entrée et de parent de transcription au moyen du mécanisme normal d’écriture de session. La propriété et l’expiration sont
revérifiées à chaque RPC.

### Capacités du client

Les clients opérateurs peuvent annoncer des capacités facultatives dans `connect.params.caps` :

- `tool-events` : accepte les événements structurés du cycle de vie des outils.
- `inline-widgets` : peut afficher les résultats d’outils sous forme de widgets intégrés hébergés.

Les capacités du client décrivent le client connecté, et non l’autorisation. Les outils d’agent peuvent déclarer des capacités requises ; le Gateway omet ces outils sauf si chaque exigence figure dans les `caps` du client d’origine. Les exécutions provenant d’un canal ne disposent d’aucune capacité de client Gateway ; les outils soumis à des capacités sont donc indisponibles même lorsque la politique des outils les autorise explicitement.

### Exemple de connexion d’un nœud

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

Les nœuds déclarent leurs capacités revendiquées au moment de la connexion :

- `caps` : catégories générales telles que `camera`, `canvas`, `screen`,
  `location`, `voice`, `talk`.
- `commands` : liste d’autorisation des commandes pouvant être invoquées.
- `permissions` : paramètres granulaires (par exemple `screen.record`, `camera.capture`).

Le Gateway les considère comme des déclarations et applique les listes d’autorisation côté serveur.

## Rôles et portées

Pour consulter le modèle complet des portées d’opérateur, les contrôles effectués au moment de l’approbation et la sémantique
des secrets partagés, voir [Portées d’opérateur](/fr/gateway/operator-scopes).

Rôles :

- `operator` : client du plan de contrôle (CLI/interface utilisateur/automatisation).
- `node` : hôte de capacités (caméra/écran/canvas/system.run).
- `worker` : hôte d’exécution cloud sur le protocole dédié et fermé des workers.

Portées d’opérateur (`src/gateway/operator-scopes.ts`), ensemble fermé complet :

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` avec `includeSecrets: true` nécessite `operator.talk.secrets` (ou
`operator.admin`). Lorsque les secrets sont inclus, lisez l’identifiant de connexion du fournisseur Talk actif
dans `talk.resolved.config.apiKey` ; `talk.providers.<id>.apiKey`
conserve le format de la source et peut être un objet SecretRef ou une chaîne expurgée.

Les méthodes RPC du Gateway enregistrées par un Plugin peuvent demander leur propre portée d’opérateur,
mais ces préfixes principaux réservés correspondent toujours à `operator.admin`
(`src/shared/gateway-method-policy.ts`) : `config.*`, `exec.approvals.*`,
`wizard.*`, `update.*`.

La portée de la méthode n’est que le premier contrôle. Certaines commandes à barre oblique accessibles via
`chat.send` appliquent des contrôles plus stricts au niveau de la commande : les écritures persistantes `/config set` et
`/config unset` nécessitent `operator.admin`, même pour les clients Gateway qui
disposent déjà d’une portée d’opérateur inférieure.

`node.pair.approve` comporte un contrôle supplémentaire de la portée au moment de l’approbation, en plus de la
portée de base de la méthode (`operator.pairing`), fondé sur les `commands` déclarées
dans la requête en attente (`src/infra/node-pairing-authz.ts`) :

| Commandes déclarées                                            | Portées requises                       |
| -------------------------------------------------------------- | ------------------------------------- |
| aucune                                                         | `operator.pairing`                    |
| commandes sans exécution                                       | `operator.pairing` + `operator.write` |
| inclut `system.run`, `system.run.prepare` ou `system.which`     | `operator.pairing` + `operator.admin` |

### Capacités/commandes/autorisations (nœud)

Les nœuds déclarent leurs capacités revendiquées au moment de la connexion :

- `caps` : catégories générales de capacités telles que `camera`, `canvas`, `screen`,
  `location`, `voice` et `talk`.
- `commands` : liste d’autorisation des commandes pouvant être invoquées.
- `permissions` : paramètres granulaires (par exemple `screen.record`, `camera.capture`).

Le Gateway les considère comme des **déclarations** et applique les listes d’autorisation côté serveur.
Les nœuds connectés peuvent publier des descripteurs facultatifs d’outils Plugin ou MCP visibles par l’agent
avec `node.pluginTools.update` après une connexion ou une reconnexion réussie.
Les hôtes de nœuds sans interface redémarrent pour appliquer les modifications déclaratives de l’inventaire MCP.
Cette méthode de mise à jour est l’unique chemin de publication ; les descripteurs d’outils de Plugin ne sont pas acceptés dans
les paramètres de `connect`. Chaque descripteur doit utiliser un `name` d’outil compatible avec le fournisseur et désigner
une `command` figurant dans la liste d’autorisation actuelle des commandes du nœud. Le Gateway fait confiance aux métadonnées
des descripteurs provenant du nœud appairé, filtre les descripteurs qui ne font pas partie de la surface de commandes approuvée,
les supprime lorsque le nœud se déconnecte et rejette les tentatives d’un opérateur
de modifier le catalogue d’un autre nœud. Définissez `gateway.nodes.pluginTools.enabled: false`
pour ignorer les descripteurs publiés par les nœuds.

Les hôtes de nœuds connectés publient leur catalogue complet de remplacement des compétences avec
`node.skills.update`. Cette méthode réservée au rôle de nœud constitue l’unique chemin de publication
des compétences du nœud ; les compétences ne sont pas acceptées dans les paramètres de `connect`. Chaque descripteur contient un
nom sûr, une description et un contenu `SKILL.md` de taille limitée. Le Gateway analyse ce
contenu avec le chargeur de compétences normal, l’inclut dans les instantanés de compétences de l’agent
tant que le nœud est connecté et le supprime lors de la déconnexion. Définissez
`gateway.nodes.skills.enabled: false` pour ignorer les compétences publiées par les nœuds.

## Présence

- `system-presence` renvoie des entrées indexées par identité d’appareil, notamment
  `deviceId`, `roles` et `scopes`, afin que les interfaces utilisateur puissent afficher une ligne par appareil même
  lorsqu’il se connecte à la fois comme opérateur et comme nœud.
- `node.list` inclut les champs facultatifs `lastSeenAtMs` et `lastSeenReason`. Les nœuds connectés
  indiquent l’heure de connexion actuelle avec le motif `connect` ; les nœuds appairés peuvent
  également signaler une présence durable en arrière-plan via un événement de nœud fiable.

Les nœuds macOS natifs peuvent également envoyer des événements `node.presence.activity`
authentifiés avec une durée d’inactivité d’entrée limitée. Le Gateway détermine les
horodatages d’activité selon sa propre horloge, expose le Mac connecté le plus récent via
`node.list` et `node.describe`, et diffuse les mises à jour `node.presence` aux clients
disposant d’une portée de lecture. Consultez [Présence active de l’ordinateur](/nodes/presence)
pour en savoir plus sur la sélection, la confidentialité, le contexte du modèle et le
comportement de routage des notifications.

### Événement de maintien en vie du nœud en arrière-plan

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
`background` (`src/shared/node-presence.ts`). L’événement n’est conservé que pour les
sessions authentifiées d’appareils nœuds ; les sessions sans appareil ou non appairées
renvoient `handled: false`.

Les Gateways qui réussissent renvoient un résultat structuré :

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Les anciens Gateways peuvent uniquement renvoyer `{ "ok": true }` pour `node.event` ;
considérez cela comme un RPC acquitté, et non comme une persistance durable de la présence.

## Portée des événements diffusés

Les événements de diffusion envoyés par le serveur sont filtrés selon la portée afin que
les sessions limitées à l’appairage ou aux nœuds ne reçoivent pas passivement le contenu
des sessions (`src/gateway/server-broadcast.ts`) :

- Les trames de chat, d’agent et de résultats d’outils (événements `agent` diffusés en
  continu, événements de résultats d’outils) nécessitent au minimum `operator.read`.
  Les sessions qui n’en disposent pas ignorent entièrement ces trames.
- Les diffusions `plugin.*` définies par les Plugins sont limitées par défaut à
  `operator.write` ou `operator.admin` ; les entrées explicites telles que
  `plugin.approval.requested` / `plugin.approval.resolved` utilisent plutôt
  `operator.approvals`.
- Les événements d’état et de transport (`heartbeat`, `presence`, `tick`, cycle de vie
  de connexion/déconnexion) restent sans restriction afin que l’état du transport soit
  observable par chaque session authentifiée.
- Les familles inconnues d’événements diffusés sont filtrées par portée par défaut
  (fermeture en cas d’échec), sauf si un gestionnaire enregistré les assouplit explicitement.

Chaque connexion cliente conserve son propre numéro de séquence par client, de sorte que
les diffusions restent ordonnées de manière monotone sur ce socket, même lorsque différents
clients voient des sous-ensembles distincts du flux d’événements, filtrés selon leur portée.

## Familles de méthodes RPC

`hello-ok.features.methods` est une liste de découverte prudente construite à partir de
`src/gateway/server-methods-list.ts` et des exportations de méthodes des Plugins/canaux
chargés — il ne s’agit pas d’une extraction générée de toutes les méthodes, et certaines
méthodes (par exemple `push.test`, `web.login.start`, `web.login.wait`, `sessions.usage`)
sont intentionnellement exclues de la découverte, bien qu’elles soient réelles et
appelables. Considérez cette liste comme un mécanisme de découverte des fonctionnalités,
et non comme une énumération complète de `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Système et identité">
    - `health` renvoie l’instantané de l’état du Gateway mis en cache ou récemment vérifié.
    - `diagnostics.stability` renvoie l’enregistreur limité de stabilité des diagnostics récents : noms d’événements, nombres, tailles en octets, relevés de mémoire, état des files d’attente/sessions, noms de canaux/Plugins, identifiants de session. Aucun texte de chat, corps de Webhook, résultat d’outil, corps brut de requête/réponse, jeton, cookie ou secret. Nécessite `operator.read`.
    - `status` renvoie le résumé du Gateway au format de `/status` ; les champs sensibles sont réservés aux clients opérateurs disposant de la portée d’administration.
    - `gateway.identity.get` renvoie l’identité de l’appareil Gateway utilisée par les flux de relais et d’appairage.
    - `system-presence` renvoie l’instantané de présence actuel des appareils opérateurs/nœuds connectés.
    - `system-event` ajoute un événement système et peut mettre à jour/diffuser le contexte de présence.
    - `last-heartbeat` renvoie le dernier événement Heartbeat conservé.
    - `set-heartbeats` active ou désactive le traitement des Heartbeats sur le Gateway.
    - `gateway.suspend.prepare` crée un court bail de suspension coopérative uniquement lorsque le travail suivi du Gateway est inactif. `gateway.suspend.status` vérifie ce bail, et `gateway.suspend.resume` le libère après la reprise ou l’abandon d’une opération de l’hôte.

  </Accordion>

  <Accordion title="Modèles et utilisation">
    - `models.list` renvoie le catalogue des modèles autorisés à l’exécution. Consultez « Vues de `models.list` » ci-dessous.
    - `usage.status` renvoie les fenêtres d’utilisation du fournisseur et les résumés des quotas restants.
    - `usage.cost` renvoie les résumés agrégés des coûts d’utilisation pour une plage de dates. Transmettez `agentId` pour un agent, ou `agentScope: "all"` pour agréger les agents configurés.
    - `doctor.memory.status` renvoie l’état de préparation de la mémoire vectorielle / des représentations vectorielles mises en cache pour l’espace de travail actif de l’agent par défaut. Transmettez `{ "probe": true }` ou `{ "deep": true }` uniquement pour effectuer un ping direct explicite du fournisseur de représentations vectorielles. Transmettez `{ "agentId": "agent-id" }` pour limiter les statistiques du magasin Dreaming à l’espace de travail d’un agent ; si ce paramètre est omis, les espaces de travail Dreaming configurés sont agrégés.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` et `doctor.memory.dedupeDreamDiary` acceptent le paramètre facultatif `{ "agentId": "agent-id" }` ; s’il est omis, ils opèrent sur l’espace de travail configuré de l’agent par défaut.
    - `doctor.memory.remHarness` renvoie un aperçu limité et en lecture seule du banc d’essai REM pour les clients distants du plan de contrôle, comprenant les chemins des espaces de travail, des extraits de mémoire, le Markdown ancré généré et les candidats à la promotion profonde. Nécessite `operator.read`.
    - `sessions.usage` renvoie des résumés d’utilisation par session. Transmettez `agentId` pour un agent, ou `agentScope: "all"` pour répertorier ensemble les agents configurés.
      Les deux méthodes d’utilisation acceptent `mode: "specific"` avec un `timeZone` IANA pour des limites et des périodes de jours calendaires tenant compte de l’heure d’été. `utcOffset` reste pris en charge pour les anciens clients et comme solution de repli lorsque l’environnement d’exécution du Gateway ne reconnaît pas le fuseau demandé.
    - `sessions.usage.timeseries` renvoie les séries chronologiques d’utilisation d’une session.
    - `sessions.usage.logs` renvoie les entrées du journal d’utilisation d’une session.

  </Accordion>

  <Accordion title="Canaux et assistants de connexion">
    - `channels.status` renvoie les résumés d’état des canaux/Plugins intégrés et fournis.
    - `channels.logout` déconnecte un canal/compte précis lorsque le canal le permet.
    - `web.login.start` lance un flux de connexion QR/Web pour le fournisseur actuel de canal Web compatible avec les codes QR.
    - `web.login.wait` attend la fin de ce flux et démarre le canal en cas de réussite.
    - `push.test` envoie une notification push APNs de test à un nœud iOS enregistré.
    - `voicewake.get` renvoie les déclencheurs de mots de réveil enregistrés.
    - `voicewake.set` met à jour les déclencheurs de mots de réveil et diffuse la modification.

  </Accordion>

  <Accordion title="Gestion des Plugins">
    - `plugins.list` (`operator.read`) renvoie l’inventaire des Plugins installés ainsi qu’une sélection officielle organisée localement, les diagnostics et une indication précisant si le mode d’installation actuel autorise les modifications.
    - `plugins.search` (`operator.read`) recherche les familles de Plugins de code et de lots installables dans ClawHub. Transmettez une `query` non vide et une `limit` facultative comprise entre 1 et 100.
    - `plugins.install` (`operator.admin`) installe soit une entrée du catalogue officiel avec `{ source: "official", pluginId }`, soit un paquet ClawHub avec `{ source: "clawhub", packageName, version?, acknowledgeClawHubRisk? }`. Les installations ClawHub préservent les vérifications de confiance, d’intégrité et de politique d’installation du Gateway. Les installations réussies nécessitent le redémarrage du Gateway.
    - `plugins.setEnabled` (`operator.admin`) modifie la politique d’activation d’un Plugin installé avec `{ pluginId, enabled }`. La réponse comprend l’entrée de catalogue mise à jour, les métadonnées de redémarrage et tous les avertissements relatifs à la sélection d’emplacement.
    - `plugins.uninstall` (`operator.admin`) supprime un Plugin installé en externe avec `{ pluginId }` : les références de configuration, l’enregistrement d’installation et les fichiers gérés. Les Plugins fournis ne peuvent pas être désinstallés, seulement désactivés. La réponse répertorie les actions de suppression et nécessite toujours le redémarrage du Gateway.

  </Accordion>

  <Accordion title="Messagerie et journaux">
    - `send` est le RPC de livraison sortante directe destiné aux envois ciblant un canal, un compte et un fil de discussion en dehors de l’exécuteur de chat.
    - `logs.tail` renvoie la fin configurée du journal fichier du Gateway avec des contrôles de curseur/limite et de nombre maximal d’octets.

  </Accordion>

  <Accordion title="Terminal de l’opérateur">
    - `terminal.open` démarre un PTY hôte pour un `agentId` explicite ou l’agent par défaut, puis renvoie l’agent résolu, le répertoire de travail, l’interpréteur de commandes et l’état de confinement.
    - `terminal.input`, `terminal.resize` et `terminal.close` opèrent uniquement sur les sessions appartenant à la connexion appelante.
    - Les événements `terminal.data` et `terminal.exit` ne sont diffusés qu’à la connexion propriétaire de la session.
    - Les sessions dont la connexion est interrompue sont détachées, et non arrêtées : elles restent rattachables pendant `gateway.terminal.detachedSessionTimeoutSeconds` (valeur par défaut : 300 ; `0` rétablit l’arrêt à la déconnexion), tandis que les sorties récentes s’accumulent dans une mémoire tampon limitée côté serveur.
    - `terminal.list` renvoie les sessions rattachables ; `terminal.attach` rattache une session active ou détachée à la connexion appelante et renvoie la mémoire tampon de relecture (prise de contrôle de type tmux — un précédent propriétaire actif reçoit `terminal.exit` avec la raison `detached`) ; `terminal.text` lit la mémoire tampon sous forme de texte brut sans s’y rattacher.
    - Chaque méthode de terminal nécessite `operator.admin` ; `gateway.terminal.enabled` doit être explicitement défini sur true. Les agents entièrement isolés sont refusés, et toute modification de la politique d’un agent ferme les PTY existants et en cours d’ouverture, y compris ceux qui sont détachés.

  </Accordion>

  <Accordion title="Conversation et TTS">
    - `talk.catalog` renvoie le catalogue en lecture seule des fournisseurs Conversation pour la parole, la transcription en continu et la voix en temps réel : identifiants canoniques des fournisseurs, alias du registre, libellés, état de configuration, résultat `ready` facultatif au niveau du groupe, identifiants de modèles/voix exposés, modes canoniques, transports, stratégies de cerveau et indicateurs audio/de capacités en temps réel, sans renvoyer les secrets des fournisseurs ni modifier la configuration globale. Les Gateway actuels définissent `ready` après avoir appliqué la sélection du fournisseur d'exécution ; considérez son absence comme non vérifiée sur les Gateway plus anciens.
    - `talk.config` renvoie la charge utile de configuration Conversation effective ; `includeSecrets` nécessite `operator.talk.secrets` (ou `operator.admin`).
    - `talk.session.create` crée une session Conversation détenue par le Gateway pour `realtime/gateway-relay`, `transcription/gateway-relay` ou `stt-tts/managed-room`. Pour `stt-tts/managed-room`, les appelants disposant de `operator.write` qui transmettent `sessionKey` doivent également transmettre `spawnedBy` pour une visibilité limitée de la clé de session ; la création d'une `sessionKey` sans portée et `brain: "direct-tools"` nécessitent `operator.admin`.
    - `talk.session.join` valide un jeton de session de salle gérée, émet `session.ready` ou `session.replaced` selon les besoins, et renvoie les métadonnées de la salle/session ainsi que les événements Conversation récents, mais jamais le jeton en texte brut ni son condensat.
    - `talk.session.appendAudio` ajoute l'audio d'entrée PCM encodé en base64 aux sessions de relais en temps réel et de transcription détenues par le Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` et `talk.session.cancelTurn` pilotent le cycle de vie des tours d'une salle gérée, avec rejet des tours obsolètes avant l'effacement de l'état.
    - `talk.session.cancelOutput` arrête la sortie audio de l'assistant, principalement pour permettre l'interruption contrôlée par VAD dans les sessions de relais du Gateway.
    - `talk.session.submitToolResult` termine un appel d'outil du fournisseur émis par une session de relais en temps réel détenue par le Gateway. La requête attend tout signal de fin asynchrone exposé par le pont du fournisseur ; les soumissions ayant échoué maintiennent l'exécution liée active et n'émettent pas d'événement de résultat d'outil réussi. Transmettez `options: { willContinue: true }` pour une sortie d'outil intermédiaire ou `options: { suppressResponse: true }` lorsque le pont du fournisseur annonce la prise en charge de la suppression et que le résultat ne doit pas démarrer une autre réponse.
    - `talk.session.steer` envoie un contrôle vocal de l'exécution active à une session Conversation détenue par le Gateway et adossée à un agent : `{ sessionId, text, mode? }`, où `mode` vaut `status`, `steer`, `cancel` ou `followup` ; si le mode est omis, il est déterminé à partir du texte prononcé.
    - `talk.session.close` ferme une session de relais, de transcription ou de salle gérée détenue par le Gateway et émet les événements Conversation terminaux.
    - `talk.mode` définit/diffuse l'état actuel du mode Conversation pour les clients WebChat/Control UI.
    - `talk.client.create` crée une session de fournisseur en temps réel détenue par le client utilisant `webrtc` ou `provider-websocket`, tandis que le Gateway gère la configuration, les identifiants, les instructions et la politique des outils.
    - `talk.client.toolCall` permet aux transports en temps réel détenus par le client de transmettre les appels d'outils du fournisseur à la politique du Gateway. Le premier outil pris en charge est `openclaw_agent_consult` ; les clients obtiennent un identifiant d'exécution et attendent les événements normaux du cycle de vie de la conversation avant de soumettre le résultat d'outil propre au fournisseur.
    - `talk.client.steer` envoie un contrôle vocal de l'exécution active pour les transports en temps réel détenus par le client. Le Gateway résout l'exécution intégrée active à partir de `sessionKey` et renvoie un résultat structuré accepté/refusé au lieu d'ignorer silencieusement le pilotage.
    - `talk.event` est le canal d'événements Conversation unique pour les adaptateurs en temps réel, de transcription, STT/TTS, de salle gérée, de téléphonie et de réunion.
    - `talk.speak` synthétise la parole par l'intermédiaire du fournisseur de parole Conversation actif.
    - `tts.status` renvoie l'état d'activation du TTS, le fournisseur actif, les fournisseurs de secours et l'état de configuration des fournisseurs.
    - `tts.providers` renvoie l'inventaire visible des fournisseurs TTS.
    - `tts.enable` et `tts.disable` activent ou désactivent l'état des préférences TTS.
    - `tts.setProvider` met à jour le fournisseur TTS préféré.
    - `tts.convert` effectue une conversion ponctuelle de texte en parole.
    - `tts.speak` (`operator.write`) restitue le `text` non vide avec la chaîne de fournisseurs TTS généraux configurée et renvoie un clip complet en ligne sous la forme `audioBase64`, ainsi que les métadonnées `provider` et, facultativement, `outputFormat`, `mimeType` et `fileExtension`. Contrairement à `tts.convert`, il ne renvoie pas de chemin local au Gateway ; contrairement à `talk.speak`, il ne nécessite pas de fournisseur Conversation. Un texte dépassant `messages.tts.maxTextLength` renvoie `INVALID_REQUEST` ; les échecs de synthèse renvoient `UNAVAILABLE`.

  </Accordion>

  <Accordion title="Secrets, configuration, mise à jour et assistant">
    - `secrets.reload` résout à nouveau les SecretRefs actives et ne remplace l'état des secrets d'exécution qu'en cas de réussite complète.
    - `secrets.resolve` résout les affectations de secrets ciblées par commande pour un ensemble précis de commandes/cibles.
    - `config.get` renvoie l'instantané et le condensat actuels de la configuration.
    - `config.set` écrit une charge utile de configuration validée.
    - `config.patch` fusionne une mise à jour partielle de la configuration. Le remplacement destructif d'un tableau nécessite que le chemin concerné figure dans `replacePaths` ; les tableaux imbriqués sous des entrées de tableau utilisent des chemins `[]` tels que `agents.list[].skills`.
    - `config.apply` valide et remplace la charge utile de configuration complète.
    - `config.schema` renvoie la charge utile du schéma de configuration actif utilisée par les outils Control UI et CLI : schéma, `uiHints`, version, métadonnées de génération, ainsi que les métadonnées des schémas des plugins et canaux lorsqu'elles peuvent être chargées. Elle inclut les métadonnées `title` / `description` issues des mêmes libellés/textes d'aide que l'interface utilisateur, y compris pour les objets imbriqués, les caractères génériques, les éléments de tableau et les branches de composition `anyOf` / `oneOf` / `allOf` lorsque la documentation des champs correspondants existe.
    - `config.schema.lookup` renvoie une charge utile de recherche limitée à un chemin pour un chemin de configuration : chemin normalisé, nœud de schéma superficiel, indication correspondante avec `hintPath`, `reloadKind` facultatif et résumés des enfants immédiats pour l'exploration descendante dans l'interface utilisateur/la CLI. `reloadKind` vaut `restart`, `hot` ou `none` (`src/config/schema.ts`) et reflète le planificateur de rechargement de la configuration du Gateway pour le chemin demandé. Les nœuds du schéma de recherche conservent la documentation destinée à l'utilisateur et les champs de validation courants (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, limites numériques/de chaînes/de tableaux/d'objets, `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Les résumés des enfants exposent `key`, le `path` normalisé, `type`, `required`, `hasChildren`, le `reloadKind` facultatif, ainsi que les `hint` / `hintPath` correspondants.
    - `update.run` exécute le flux de mise à jour du Gateway et planifie un redémarrage uniquement si la mise à jour a réussi ; les appelants disposant d'une session peuvent inclure `continuationMessage` afin que le démarrage reprenne un tour de suivi de l'agent par l'intermédiaire de la file d'attente de continuation après redémarrage. Les mises à jour du gestionnaire de paquets et les mises à jour supervisées d'une extraction Git depuis le plan de contrôle utilisent un transfert détaché vers un service géré au lieu de remplacer l'arborescence des paquets ou de modifier les sorties de l'extraction/de la compilation dans le Gateway actif. Un transfert démarré renvoie `ok: true` avec `result.reason: "managed-service-handoff-started"` et `handoff.status: "started"` ; les transferts indisponibles ou ayant échoué renvoient `ok: false` avec `managed-service-handoff-unavailable` ou `managed-service-handoff-failed`, ainsi que `handoff.command` lorsqu'une mise à jour manuelle depuis le shell est requise. « Indisponible » signifie qu'OpenClaw ne dispose pas d'une limite de supervision sûre ni d'une identité de service durable, telle que `OPENCLAW_SYSTEMD_UNIT` pour systemd. Pendant un transfert démarré, la sentinelle de redémarrage peut brièvement signaler `stats.reason: "restart-health-pending"` ; la continuation est retardée jusqu'à ce que la CLI vérifie le Gateway redémarré et écrive la sentinelle `ok` finale.
    - `update.status` actualise et renvoie la dernière sentinelle de redémarrage de mise à jour, y compris la version en cours d'exécution après redémarrage lorsqu'elle est disponible.
    - `wizard.start`, `wizard.next`, `wizard.status` et `wizard.cancel` exposent l'assistant d'intégration par RPC WS.

  </Accordion>

  <Accordion title="Assistants pour les agents et les espaces de travail">
    - `agents.list` renvoie les entrées d'agents configurées, y compris les métadonnées effectives du modèle et de l'environnement d'exécution.
    - `agents.create`, `agents.update` et `agents.delete` gèrent les enregistrements des agents et le raccordement des espaces de travail.
    - `agents.files.list`, `agents.files.get` et `agents.files.set` gèrent les fichiers d'amorçage de l'espace de travail exposés pour un agent.
    - `audit.activity.list` renvoie le registre d'activité versionné contenant uniquement des métadonnées ; `audit.list` reste le RPC d'exécution/d'outil préservant la compatibilité.
    - `agents.workspace.list` et `agents.workspace.get` (`operator.read`) exposent une navigation paginée en lecture seule dans le répertoire de l'espace de travail d'un agent pour les clients du domaine d'opérateur de confiance décrit dans [Portées de l'opérateur](/fr/gateway/operator-scopes). Les requêtes acceptent uniquement les chemins relatifs à l'espace de travail ; les lectures restent confinées à la racine de l'espace de travail résolue en chemin réel (les échappements par liens symboliques et liens physiques sont rejetés), leur taille est plafonnée et elles sont limitées au texte UTF-8 ainsi qu'aux types d'images courants (base64). Les réponses n'exposent pas le chemin de l'espace de travail sur l'hôte. Cet espace de noms ne propose aucune opération d'écriture.
    - `tasks.list`, `tasks.get` et `tasks.cancel` exposent le registre des tâches du Gateway aux clients SDK et opérateur. Consultez [RPC du registre des tâches](#task-ledger-rpcs) ci-dessous.
    - `artifacts.list`, `artifacts.get` et `artifacts.download` exposent des résumés et téléchargements d'artefacts dérivés des transcriptions pour une portée explicite `sessionKey`, `runId` ou `taskId`. Les requêtes d'exécution et de tâche résolvent la session propriétaire côté serveur et ne renvoient que les médias de transcription dont la provenance correspond ; les sources d'URL non sûres ou locales renvoient des téléchargements non pris en charge au lieu d'être récupérées côté serveur.
    - `environments.list` et `environments.status` préservent la découverte des environnements locaux au Gateway et des environnements Node. Les workers cloud configurés et les enregistrements durables laissés par des profils antérieurs ajoutent des métadonnées `worker` avec `providerId`, le `leaseId` facultatif, `state`, `ageMs`, le `idleMs` facultatif et `attachedSessionIds`. Les états du cycle de vie d'un worker sont `requested`, `provisioning`, `bootstrapping`, `ready`, `attached`, `idle`, `draining`, `destroying`, `destroyed`, `failed` et `orphaned`.
    - `environments.create` (`{ profileId, idempotencyKey }`) provisionne un worker à partir d'un profil de fournisseur de plugin configuré ; les nouvelles tentatives avec la même clé réutilisent l'opération durable. `environments.destroy` (`{ environmentId }`) demande la suppression idempotente d'un environnement de worker durable. Les deux nécessitent `operator.admin`, constituent des écritures du plan de contrôle et renvoient le même format de résumé d'environnement que celui utilisé par les réponses d'état.
    - `agent.identity.get` renvoie l'identité effective de l'assistant pour un agent ou une session.
    - `agent.wait` attend la fin d'une exécution et renvoie l'instantané terminal lorsqu'il est disponible.

  </Accordion>

  <Accordion title="Contrôle des sessions">
    - `sessions.list` renvoie l’index actuel des sessions, y compris les métadonnées `agentRuntime` de chaque ligne lorsqu’un backend d’exécution d’agent est configuré.
    - `sessions.subscribe` et `sessions.unsubscribe` activent ou désactivent les abonnements aux événements de modification des sessions pour le client WS actuel.
    - `sessions.messages.subscribe` et `sessions.messages.unsubscribe` activent ou désactivent les abonnements aux événements de transcription/message pour une session. Transmettez `includeApprovals: true` pour recevoir également les événements de cycle de vie `session.approval` assainis pour les approbations dont l’audience persistée comprend cette session exacte et dont la liaison au réviseur autorise le client abonné. La réponse d’abonnement comprend alors un `approvalReplay` borné des approbations en attente ; il fait autorité lorsque `truncated` vaut false. L’activation est propre à chaque appel d’abonnement et n’est pas persistante : se réabonner à la même session sans `includeApprovals: true` supprime un abonnement existant aux approbations. Outre l’autorité normale de lecture de la session, cette activation exige `operator.admin`, ou `operator.approvals` sur un appareil appairé.
    - `sessions.preview` renvoie des aperçus bornés des transcriptions pour des clés de session spécifiques.
    - `sessions.describe` renvoie une ligne de session du Gateway pour une clé de session exacte.
    - `sessions.resolve` résout ou canonicalise une cible de session.
    - `sessions.create` crée une nouvelle entrée de session. `worktree: true` provisionne un worktree géré ; les paramètres facultatifs `worktreeBaseRef`/`worktreeName` sélectionnent la référence de base et le nom de la branche, et `execNode` (`operator.admin`) lie l’exécution de la session à un hôte Node. Le worktree créé est repris dans le résultat et persisté dans la ligne de session (`worktree: { id, branch, repoRoot }`). Lorsque l’entrée est créée, mais que son appel initial imbriqué à `chat.send` est rejeté, le résultat positif comprend `runStarted: false` et `runError` ; les clients peuvent conserver le prompt et réessayer avec la clé de session renvoyée.
    - `sessions.groups.list`, `sessions.groups.put`, `sessions.groups.rename` et `sessions.groups.delete` gèrent le catalogue de groupes de sessions personnalisés appartenant au Gateway (noms + ordre d’affichage). L’appartenance reste définie dans le champ `category` de chaque session ; le renommage et la suppression mettent à jour les sessions membres côté serveur.
    - `sessions.send` envoie un message dans une session existante.
    - `sessions.steer` est la variante d’interruption et de réorientation pour une session active.
    - `sessions.abort` interrompt le travail actif d’une session. Transmettez `key` avec un `runId` facultatif, ou uniquement `runId` pour les exécutions actives que le Gateway peut associer à une session.
    - `sessions.patch` met à jour les métadonnées/remplacements de la session et indique le modèle canonique résolu ainsi que l’`agentRuntime` effectif.
    - `sessions.reset`, `sessions.delete` et `sessions.compact` assurent la maintenance des sessions.
    - `sessions.get` renvoie la ligne complète de la session stockée.
    - L’exécution du chat utilise toujours `chat.history`, `chat.send`, `chat.abort` et `chat.inject`. `chat.history` est normalisé pour l’affichage destiné aux clients d’interface utilisateur : les balises de directives en ligne sont supprimées du texte visible, les charges utiles XML en texte brut des appels d’outils (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` et les blocs d’appels d’outils tronqués) ainsi que les jetons de contrôle de modèle ASCII/pleine chasse divulgués sont supprimés, les lignes de l’assistant constituées uniquement de jetons silencieux (`NO_REPLY` / `no_reply` exacts) sont omises et les lignes surdimensionnées peuvent être remplacées par des espaces réservés.
    - `chat.message.get` est le lecteur additif borné du message complet pour une seule entrée visible de la transcription. Transmettez `sessionKey`, éventuellement `agentId` lorsque la sélection de session est limitée à l’agent, ainsi qu’un `messageId` de transcription précédemment exposé par `chat.history` ; le Gateway renvoie la même projection normalisée pour l’affichage, sans la limite de troncature de l’historique allégé, lorsque l’entrée stockée est toujours disponible et n’est pas surdimensionnée.
    - `chat.toolTitles` renvoie de courts titres décrivant l’objectif des appels d’outils affichés dans l’interface de contrôle (par lots, 24 éléments maximum avec des entrées bornées). Cette fonctionnalité doit être activée via `gateway.controlUi.toolTitles` (désactivée par défaut) ; les Gateway où elle est désactivée répondent `{ titles: {}, disabled: true }` sans appel au modèle afin que les clients cessent leurs requêtes. Lorsqu’elle est activée, les titres utilisent le routage standard du modèle utilitaire : soit un `utilityModel` explicitement configuré (une décision de l’opérateur qui, comme pour toutes les tâches utilitaires, peut envoyer un contenu de tâche borné au fournisseur choisi), soit le petit modèle par défaut déclaré par le fournisseur de la session afin qu’aucune nouvelle destination de sortie n’apparaisse implicitement ; un `utilityModel` vide les désactive entièrement. Les titres ne se rabattent jamais sur le modèle principal. Les résultats sont mis en cache dans la base de données d’état propre à l’agent, avec pour clé le nom de l’outil + l’entrée, de sorte que les consultations répétées ne refacturent jamais les mêmes appels.
    - `chat.send` accepte le paramètre ponctuel `fastMode: "auto"` afin d’utiliser le mode rapide pour les appels au modèle démarrés avant le seuil automatique, puis de lancer les appels ultérieurs de nouvelle tentative, de repli, de résultat d’outil ou de continuation sans mode rapide. Le seuil est fixé par défaut à 60 secondes (`DEFAULT_FAST_MODE_AUTO_ON_SECONDS`) et peut être configuré par modèle avec `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Un appelant de `chat.send` peut transmettre le paramètre ponctuel `fastAutoOnSeconds` pour remplacer le seuil de cette requête.

  </Accordion>

  <Accordion title="Appairage des appareils et jetons d’appareil">
    - `device.pair.list` renvoie les appareils appairés en attente et approuvés.
    - `device.pair.setupCode` crée un code de configuration mobile et, par défaut, une URL de données QR au format PNG. Il exige `operator.admin` et est volontairement omis de la découverte annoncée. Le résultat comprend `setupCode`, le champ facultatif `qrDataUrl`, `gatewayUrl`, le libellé non secret `auth` et `urlSource`.
    - `device.pair.approve`, `device.pair.reject` et `device.pair.remove` gèrent les enregistrements d’appairage des appareils.
    - `device.pair.rename` attribue un libellé d’opérateur (`{ deviceId, label }`) qui est privilégié par rapport au nom d’affichage indiqué par le client et persiste après la réparation ou la réapprobation de l’appareil.
    - `device.token.rotate` renouvelle le jeton d’un appareil appairé dans les limites de son rôle approuvé et de la portée de l’appelant.
    - `device.token.revoke` révoque le jeton d’un appareil appairé dans les limites de son rôle approuvé et de la portée de l’appelant.

    Le code de configuration intègre un identifiant d’amorçage à courte durée de vie. Les clients ne doivent ni
    le journaliser ni le conserver au-delà du processus d’appairage.

  </Accordion>

  <Accordion title="Appairage des Nodes, invocation et travail en attente">
    - `node.pair.list`, `node.pair.approve`, `node.pair.reject` et `node.pair.remove` couvrent les approbations des capacités des Nodes. `node.pair.request` et `node.pair.verify` ont été supprimés dans la version 2026.7 avec le stockage autonome d’appairage des Nodes ; les demandes en attente sont créées par le Gateway lors des connexions des Nodes.
    - `node.list` et `node.describe` renvoient l’état connu/connecté des Nodes.
    - `node.rename` met à jour le libellé d’un Node appairé.
    - `node.invoke` transmet une commande à un Node connecté.
    - `node.invoke.result` renvoie le résultat d’une demande d’invocation.
    - `mcp.tools.call.v1` est la commande sans interface graphique de l’hôte Node permettant d’appeler un outil MCP configuré localement sur le Node. Elle est transmise via `node.invoke`, exige que le Node déclare la commande et reste soumise à l’approbation d’appairage ainsi qu’à `gateway.nodes.denyCommands`.
    - `node.event` transmet au Gateway les événements provenant des Nodes.
    - `node.pluginTools.update` est le seul chemin de publication permettant de remplacer les descripteurs d’outils de Plugin/MCP visibles par l’agent du Node connecté ; les paramètres de `connect` ne les transportent pas.
    - `node.pending.pull` et `node.pending.ack` sont les API de file d’attente du Node connecté.
    - `node.pending.enqueue` et `node.pending.drain` gèrent le travail en attente durable pour les Nodes hors ligne/déconnectés.

  </Accordion>

  <Accordion title="Familles d’approbations">
    - `approval.get` et `approval.resolve` sont les méthodes d’approbation durable indépendantes du type (portée `operator.approvals`). `approval.get` renvoie une projection assainie, en attente ou terminale conservée, avec un `urlPath` stable ; `approval.resolve` accepte l’identifiant canonique de l’approbation, un `kind` explicite et une décision, applique une résolution où la première réponse l’emporte et renvoie toujours le résultat canonique enregistré.
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` et `exec.approval.resolve` couvrent les demandes ponctuelles d’approbation d’exécution ainsi que la recherche/relecture des approbations en attente. Ce sont des adaptateurs de frontière de protocole reposant sur le même registre durable des approbations.
    - `exec.approval.waitDecision` attend la décision d’une approbation d’exécution en attente et renvoie la décision finale (ou `null` en cas d’expiration du délai).
    - `exec.approvals.get` et `exec.approvals.set` gèrent les instantanés de stratégie d’approbation des exécutions du Gateway.
    - `exec.approvals.node.get` et `exec.approvals.node.set` gèrent la stratégie locale au Node d’approbation des exécutions via les commandes de relais du Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` et `plugin.approval.resolve` couvrent les flux d’approbation définis par les Plugins.

  </Accordion>

  <Accordion title="Automatisation, Skills et outils">
    - Automatisation : `wake` programme l’injection immédiate ou au prochain Heartbeat d’un texte de réveil ; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gèrent le travail planifié.
    - `cron.run` reste un RPC de type mise en file d’attente pour les exécutions manuelles. Les clients nécessitant une sémantique d’achèvement doivent lire le `runId` renvoyé et interroger périodiquement `cron.runs`.
    - `cron.runs` accepte un filtre facultatif `runId` non vide afin que les clients puissent suivre une seule exécution manuelle en file d’attente sans entrer en concurrence avec d’autres entrées d’historique de la même tâche.
    - Skills et outils : `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`. Consultez les [méthodes d’assistance pour l’opérateur](#operator-helper-methods) ci-dessous.

  </Accordion>
</AccordionGroup>

### Familles d’événements courantes

- `chat` : mises à jour du chat de l’interface utilisateur, telles que `chat.inject`, et autres événements de chat
  limités à la transcription. Dans le protocole v4, les charges utiles différentielles transportent `deltaText` ; `message` reste
  l’instantané cumulatif de l’assistant. Les remplacements qui ne sont pas des préfixes définissent
  `replace=true` et utilisent `deltaText` comme texte de remplacement.
- `session.message`, `session.operation`, `session.tool` : mises à jour de la transcription, de l’opération de session
  en cours et du flux d’événements pour une session abonnée.
- `session.approval` : état assaini, en attente et terminal, des approbations pour un abonné
  explicitement activé sur une session exacte. Les approbations enfants utilisent
  l’audience persistée de l’ancêtre ; les événements ne modifient jamais les transcriptions et ne réveillent pas les agents.
- `sessions.changed` : l’index ou les métadonnées des sessions ont changé.
- `presence` : mises à jour de l’instantané de présence du système.
- `tick` : événement périodique de maintien de connexion/vérification d’activité.
- `health` : mise à jour de l’instantané d’état du Gateway.
- `heartbeat` : mise à jour du flux d’événements Heartbeat.
- `cron` : événement de modification d’une exécution/tâche Cron.
- `shutdown` : notification d’arrêt du Gateway.
- `node.pair.requested` / `node.pair.resolved` : cycle de vie de l’appairage des Nodes.
- `node.invoke.request` : diffusion d’une demande d’invocation d’un Node.
- `device.pair.requested` / `device.pair.resolved` : cycle de vie des appareils appairés.
- `voicewake.changed` : la configuration du déclencheur par mot de réveil a changé.
- `exec.approval.requested` / `exec.approval.resolved` : cycle de vie des approbations
  d’exécution.
- `plugin.approval.requested` / `plugin.approval.resolved` : cycle de vie des approbations
  de Plugin.

### Méthodes d’assistance pour les Nodes

Les Nodes peuvent appeler `skills.bins` pour récupérer la liste actuelle des exécutables des Skills
afin d’effectuer les vérifications d’autorisation automatique.

## RPC du registre d’audit

`audit.activity.list` fournit aux clients opérateurs une vue stable, de la plus récente à la plus ancienne, des métadonnées du cycle de vie
des exécutions d’agents, des actions d’outils et des messages explicitement activés. Il exige
`operator.read`. Les requêtes excluent les enregistrements datant de plus de 30 jours, et le registre
SQLite partagé est limité à 100,000 enregistrements. Les lignes expirées sont supprimées au
démarrage du Gateway, lors de la maintenance horaire et des écritures ultérieures. Consultez
l’[historique d’audit](/gateway/audit) pour le modèle de données et la sémantique de confidentialité.

- Paramètres : `agentId`, `sessionKey` ou `runId` exact facultatif ; `kind`
  facultatif (`"agent_run"`, `"tool_action"` ou `"message"`) ; `status`
  facultatif (`"started"`, `"succeeded"`, `"failed"`, `"cancelled"`, `"timed_out"`,
  `"blocked"` ou `"unknown"`) ; `direction` du message facultative (`"inbound"` ou
  `"outbound"`) et `channel` exact ; bornes inclusives `after` / `before`
  facultatives en millisecondes Unix ; `limit` facultatif de `1` à `500` ; et
  chaîne `cursor` facultative provenant de la page précédente.
- Résultat : `{ "events": AuditActivityEventV1[], "nextCursor"?: string }`.

L’union de résultats V1 nommée comporte des schémas distincts pour les
exécutions d’agent, les actions d’outil, les messages entrants et les messages
sortants. Le discriminateur `eventType` vaut respectivement `agent_run`,
`tool_action`, `inbound_message` ou `outbound_message` ; `kind` et la
`direction` du message restent disponibles pour le filtrage et l’affichage.
Chaque événement possède un entier `schemaVersion: 1`. Les références
d’identité de message utilisent le format exact
`hmac-sha256:v1:<32 hex key id>:<64 hex digest>` ; l’identifiant d’un acteur
expéditeur de canal utilise le même format.

Toutes les variantes exigent `eventType`, `schemaVersion`, `eventId`, `sequence`,
`sourceSequence`, `occurredAt`, `kind`, `action`, `status`, `actor` et
`redaction`. Les champs des variantes sont les suivants :

| `eventType`        | Champs obligatoires                                                | Champs facultatifs                                                                                                               |
| ------------------ | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `agent_run`        | `agentId`, `runId` ; `kind: "agent_run"`                           | `sessionKey`, `sessionId`, `errorCode`                                                                                           |
| `tool_action`      | `agentId`, `runId` ; `kind: "tool_action"`                         | `sessionKey`, `sessionId`, `toolCallId`, `toolName`, `errorCode`                                                                 |
| `inbound_message`  | `direction: "inbound"`, `channel`, `conversationKind`, `outcome`   | `agentId`, `runId`, `durationMs`, `resultCount`, références d’identité, `reasonCode`, `errorCode`                                |
| `outbound_message` | `direction: "outbound"`, `channel`, `conversationKind`, `outcome`  | `agentId`, `runId`, `durationMs`, `resultCount`, références d’identité, `reasonCode`, `deliveryKind`, `failureStage`, `errorCode` |

Les énumérations fermées des messages sont les suivantes :

- `conversationKind` : `direct`, `group`, `channel` ou `unknown`.
- `outcome` entrant : `completed`, `skipped` ou `failed` ; `reasonCode`
  facultatif : `duplicate`, `reply_operation_active`,
  `reply_operation_aborted`, `fast_abort`, `plugin_bound_handled`,
  `plugin_bound_unavailable`, `plugin_bound_declined`, `plugin_bound_error`,
  `before_dispatch_handled`, `acp_dispatch_completed`, `acp_dispatch_failed`,
  `acp_dispatch_empty` ou `acp_dispatch_aborted`.
- `outcome` sortant : `sent`, `suppressed`, `failed` ou `unknown` ; `reasonCode`
  facultatif : `cancelled_by_message_sending_hook`,
  `cancelled_by_reply_payload_sending_hook`,
  `empty_after_message_sending_hook`, `empty_after_reply_payload_sending_hook`
  ou `no_visible_payload`. Un adaptateur qui ne renvoie aucune identité de
  plateforme est `unknown`, car l’effet de bord externe ne peut pas être
  réfuté.
- `deliveryKind` : `text`, `media` ou `other` ; `failureStage` :
  `platform_send`, `queue` ou `unknown`.

Les champs terminaux sont corrélés, et non facultatifs indépendamment :

| Variante         | Correspondance terminale                                                                                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exécution d’agent | `started` n’a pas d’`errorCode` ; chaque état final autre qu’un succès exige son code `run_*` correspondant.                                                               |
| Action d’outil    | `started` et les succès n’ont pas d’`errorCode` ; chaque autre état final exige son code `tool_*` correspondant.                                                           |
| Message entrant   | succeeded = `completed` ; blocked = `skipped` ; failed = `failed` plus `message_processing_failed`. Lorsqu’il est présent, `reasonCode` doit appartenir à cette famille terminale. |
| Message sortant   | succeeded = `sent` ; blocked = `suppressed` plus `reasonCode` ; failed = `failed` plus `errorCode` et `failureStage` ; unknown = `unknown` plus `failureStage`.             |

Chaque événement d’activité comprend un identifiant d’événement stable, une
séquence de registre monotone, la séquence de l’événement source, un horodatage,
un acteur, une action, un état, un entier `schemaVersion: 1` et
`redaction: "metadata_only"`. Les enregistrements d’exécution et d’outil
exigent la provenance de l’agent et de l’exécution et peuvent inclure la
provenance de la session. Les enregistrements de message peuvent inclure les
identifiants de l’agent et de l’exécution, mais n’incluent délibérément jamais
`sessionKey` ni `sessionId` ; le filtre de requête `sessionKey` ne s’applique
donc qu’aux lignes d’exécution et d’outil. Les événements d’outil peuvent
inclure l’identifiant de l’appel d’outil et le nom de l’outil.

Les enregistrements de message utilisent `message.inbound.processed` ou
`message.outbound.finished` et ajoutent la direction, le canal, le type de
conversation, le résultat normalisé ainsi que, facultativement, le type de
livraison, l’étape de l’échec, la durée, le nombre de résultats, le code de
motif et des pseudonymes avec clé, locaux à l’installation, pour le compte, la
conversation, le message et la cible. Ces pseudonymes facilitent la corrélation,
mais ne constituent pas une anonymisation : la base de données d’état contient
leur clé, contrairement aux exportations RPC et CLI. Le registre ne stocke ni
les prompts, ni le contenu des messages, ni les arguments ou résultats des
outils, ni la sortie des commandes, ni le texte brut des erreurs. Les valeurs
`sessionKey` des exécutions et des outils restent des métadonnées de corrélation
brutes et peuvent intégrer des identifiants de compte de plateforme ou de pair ;
les enregistrements de message omettent les clés de session.

Pour les lignes entrantes, `durationMs` mesure la durée du traitement principal jusqu’à son état terminal et `resultCount` compte les charges utiles finalisées de type outil mis en file d’attente, bloc et réponse. Pour les lignes sortantes, `durationMs` couvre la prise en charge de la livraison jusqu’à l’accusé de réception, la lettre morte ou la réconciliation (temps d’attente en file compris), et `resultCount` compte les envois physiques identifiés vers la plateforme. `deliveryKind`, lorsqu’il est présent, décrit la charge utile effective après les hooks et le rendu ; les lignes supprimées ou ambiguës en raison d’un plantage l’omettent.

La couverture actuelle des messages inclut les messages entrants acceptés qui atteignent le traitement principal, y compris les résultats de doublon ou terminaux du cœur. La couverture sortante écrit une ligne terminale par charge utile de réponse logique d’origine qui atteint la livraison durable partagée ; le découpage et la distribution par les adaptateurs sont agrégés dans `resultCount`. Les envois pouvant être retentés ou ambigus mis en file d’attente ne sont enregistrés qu’après un accusé de réception, une lettre morte ou une réconciliation. Les chemins locaux aux Plugins et les chemins d’envoi direct qui contournent ces limites partagées ne sont pas encore couverts. La file d’attente bornée des workers fonctionne au mieux et peut perdre des enregistrements en cas de défaillance ou de saturation ; cette surface ne constitue donc pas une archive de conformité sans perte.

L’enregistrement est activé par défaut et contrôlé par
[`audit.enabled`](/fr/gateway/configuration-reference#audit). L’enregistrement des messages est
contrôlé séparément par `audit.messages` et sa valeur par défaut est `"off"`. Lorsque
l’enregistrement est désactivé, `audit.activity.list` continue de fournir les enregistrements écrits
précédemment jusqu’à leur expiration.

Les schémas livrés de requête et de résultat `audit.list`, ainsi que le schéma `AuditEvent`, restent
inchangés et renvoient uniquement les enregistrements d’exécution d’agent et d’action d’outil. Les nouveaux clients
opérateur doivent appeler `audit.activity.list` lorsque le Gateway l’annonce. Les anciens
Gateways peuvent signaler soit `unknown method: audit.activity.list`, soit, parce que
l’autorisation précédait la recherche de méthode dans les versions livrées, `missing scope:
operator.admin` pour une requête limitée à la lecture. Considérez ce dernier cas comme une absence de méthode
uniquement lorsque la méthode n’a pas été annoncée. Un client peut alors réessayer `audit.list`
uniquement lorsque ses filtres ne nécessitent pas la prise en charge du type de message, de la direction ou du canal.

Utilisez [`openclaw audit`](/cli/audit) pour les requêtes textuelles et les exportations JSON bornées.

## RPC du registre des tâches

Les clients opérateur inspectent et annulent les enregistrements de tâches en arrière-plan du Gateway au moyen
des RPC du registre des tâches (`packages/gateway-protocol/src/schema/tasks.ts`). Ceux-ci
renvoient des résumés de tâches assainis, et non l’état brut de l’environnement d’exécution.

- `tasks.list` nécessite `operator.read`.
  - Paramètres : `status` facultatif (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` ou `"timed_out"`) ou un tableau de ces états,
    `agentId` facultatif, `sessionKey` facultatif, `limit` facultatif de `1` à
    `500`, et chaîne `cursor` facultative.
  - Résultat : `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` nécessite `operator.read`.
  - Paramètres : `{ "taskId": string }`.
  - Résultat : `{ "task": TaskSummary }`.
  - Les identifiants de tâche manquants renvoient le format d’erreur « introuvable » du Gateway.
- `tasks.cancel` nécessite `operator.write`.
  - Paramètres : `{ "taskId": string, "reason"?: string }`.
  - Résultat : `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` indique si le registre contenait une tâche correspondante. `cancelled`
    indique si l’environnement d’exécution a accepté ou enregistré l’annulation.

`TaskSummary` comprend `id`, `status` et des métadonnées facultatives : `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, les horodatages, la progression,
le résumé terminal et le texte d’erreur assaini. `agentId` identifie l’agent
qui exécute la tâche ; `sessionKey` et `ownerKey` préservent le contexte du demandeur et du contrôle.

## Méthodes auxiliaires pour les opérateurs

- `commands.list` (`operator.read`) récupère l’inventaire des commandes d’exécution pour
  un agent.
  - `agentId` est facultatif ; omettez-le pour lire l’espace de travail de l’agent par défaut.
  - `scope` détermine la surface ciblée par le `name` principal : `text` renvoie
    le jeton principal de la commande textuelle sans le `/` initial ; `native` et le
    chemin `both` par défaut renvoient les noms natifs adaptés au fournisseur lorsqu’ils sont disponibles.
  - `textAliases` contient les alias exacts avec barre oblique, tels que `/model` et `/m`.
  - `nativeName` contient le nom de commande natif adapté au fournisseur lorsqu’il
    existe.
  - `provider` est facultatif et influe uniquement sur la dénomination native ainsi que sur la disponibilité
    des commandes natives du Plugin.
  - `includeArgs=false` omet de la réponse les métadonnées sérialisées des arguments.
- `tools.catalog` (`operator.read`) récupère le catalogue des outils d’exécution pour un
  agent. La réponse comprend les outils regroupés et les métadonnées de provenance :
  - `source` : `core` ou `plugin`
  - `pluginId` : Plugin propriétaire lorsque `source="plugin"`
  - `optional` : indique si un outil de Plugin est facultatif
- `tools.effective` (`operator.read`) récupère l’inventaire des outils effectivement
  disponibles à l’exécution pour une session.
  - `sessionKey` est requis.
  - Le Gateway déduit le contexte d’exécution fiable de la session côté serveur
    au lieu d’accepter un contexte d’authentification ou de livraison fourni par l’appelant.
  - La réponse est une projection propre à la session, dérivée par le serveur, de l’inventaire
    actif, comprenant les outils du cœur, des Plugins, des canaux et des serveurs MCP déjà
    découverts.
  - `tools.effective` est en lecture seule pour MCP : il peut projeter le catalogue MCP
    d’une session active au travers de la stratégie finale des outils, mais ne crée pas d’environnements
    d’exécution MCP, ne connecte pas de transports et n’émet pas `tools/list`. Si aucun catalogue actif
    correspondant n’existe, la réponse peut inclure un avis tel que `mcp-not-yet-connected`,
    `mcp-not-yet-listed` ou `mcp-stale-catalog`.
  - Les entrées d’outils effectifs utilisent `source="core"`, `source="plugin"`,
    `source="channel"` ou `source="mcp"`.
- `tools.invoke` (`operator.write`) appelle un outil disponible par le même
  chemin de stratégie du Gateway que `/tools/invoke`.
  - `name` est requis. `args`, `sessionKey`, `agentId`, `confirm` et
    `idempotencyKey` sont facultatifs.
  - Si `sessionKey` et `agentId` sont tous deux présents, l’agent de la session
    résolue doit correspondre à `agentId`.
  - Les enveloppes du cœur réservées au propriétaire, telles que `cron`, `gateway` et `nodes`, nécessitent
    une identité de propriétaire/administrateur (`operator.admin`), même si `tools.invoke` lui-même
    relève de `operator.write`.
  - La réponse est une enveloppe destinée au SDK avec les champs `ok`, `toolName`, un champ
    `output` facultatif et des champs `error` typés. Les refus liés à l’approbation ou à la stratégie renvoient
    `ok:false` dans la charge utile au lieu de contourner le pipeline de stratégie des outils
    du Gateway.
- `skills.status` (`operator.read`) récupère l’inventaire visible des Skills pour un
  agent.
  - `agentId` est facultatif ; omettez-le pour lire l’espace de travail de l’agent par défaut.
  - La réponse comprend l’éligibilité, les exigences manquantes, les vérifications de configuration
    et les options d’installation assainies sans exposer les valeurs brutes des secrets.
- `skills.search` et `skills.detail` (`operator.read`) renvoient les métadonnées
  de découverte de ClawHub.
- `skills.upload.begin`, `skills.upload.chunk` et `skills.upload.commit`
  (`operator.admin`) préparent une archive privée de Skill avant son installation. Il
  s’agit d’un chemin de téléversement administratif distinct destiné aux clients de confiance, et non du flux normal
  d’installation de Skills de ClawHub ; il est désactivé par défaut sauf si
  `skills.install.allowUploadedArchives` est activé.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    crée un téléversement lié à ce slug et à cette valeur de forçage.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` ajoute des octets à
    l’offset décodé exact.
  - `skills.upload.commit({ uploadId, sha256? })` vérifie la taille finale et
    le SHA-256. La validation ne fait que finaliser le téléversement ; elle n’installe pas le Skill.
  - Les archives de Skills téléversées sont des archives zip contenant un fichier `SKILL.md` à la racine. Le
    nom du répertoire interne de l’archive ne sélectionne jamais la cible d’installation.
- `skills.install` (`operator.admin`) comporte trois modes :
  - Mode ClawHub : `{ source: "clawhub", slug, version?, force? }` installe un
    dossier de Skill dans le répertoire `skills/` de l’espace de travail de l’agent par défaut.
  - Mode téléversement : `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    installe un téléversement validé dans le répertoire
    `skills/<slug>` de l’espace de travail de l’agent par défaut. Le slug et la valeur de forçage doivent correspondre à la
    requête `skills.upload.begin` d’origine. Ce mode est refusé sauf si
    `skills.install.allowUploadedArchives` est activé ; ce paramètre n’influe pas
    sur les installations ClawHub.
  - Mode programme d’installation du Gateway : `{ name, installId, timeoutMs? }` exécute une action
    `metadata.openclaw.install` déclarée sur l’hôte du Gateway. Les clients plus anciens peuvent
    encore envoyer `dangerouslyForceUnsafeInstall` ; ce champ est obsolète,
    accepté uniquement pour assurer la compatibilité du protocole et ignoré. Utilisez
    `security.installPolicy` pour les décisions d’installation relevant de l’opérateur.
- `skills.update` (`operator.admin`) comporte deux modes :
  - Le mode ClawHub met à jour un slug suivi ou toutes les installations ClawHub suivies dans
    l’espace de travail de l’agent par défaut.
  - Le mode configuration modifie les valeurs de `skills.entries.<skillKey>`, telles que `enabled`,
    `apiKey` et `env`.

### Vues de `models.list`

`models.list` accepte un paramètre `view` facultatif
(`src/agents/model-catalog-visibility.ts`) :

- Omis ou `"default"` : si `agents.defaults.models` est configuré, la
  réponse correspond au catalogue autorisé, y compris les modèles découverts dynamiquement
  pour les entrées `provider/*`. Sinon, la réponse correspond au catalogue complet du Gateway.
- `"configured"` : comportement dimensionné pour un sélecteur. Si `agents.defaults.models` est
  configuré, il reste prioritaire, y compris pour la découverte limitée au fournisseur des
  entrées `provider/*`. Sans liste d’autorisation, la réponse utilise les entrées explicites
  `models.providers.<provider>.models` et se rabat sur le catalogue complet
  uniquement lorsqu’aucune ligne de modèle configurée n’existe.
- `"provider-config"` : inventaire `models.providers.*.models` défini par la source,
  indépendant des listes d’autorisation du sélecteur. Les lignes comprennent les capacités publiques des modèles et
  la disponibilité tenant compte des routes, mais omettent les points de terminaison des fournisseurs, les données
  d’authentification et la configuration des requêtes d’exécution.
- `"all"` : catalogue complet du Gateway, sans tenir compte de `agents.defaults.models`. À utiliser pour
  les interfaces de diagnostic ou de découverte, et non pour les sélecteurs de modèles habituels.

## Approbations d’exécution

- Lorsqu’une requête d’exécution nécessite une approbation, le Gateway diffuse
  `exec.approval.requested`.
- Les clients opérateurs la traitent en appelant `exec.approval.resolve` (nécessite
  `operator.approvals`).
- Pour `host=node`, `exec.approval.request` doit inclure `systemRunPlan`
  (`argv`/`cwd`/`rawCommand` canoniques et métadonnées de session). Les requêtes sans
  `systemRunPlan` sont rejetées.
- Après approbation, les appels `node.invoke system.run` transférés réutilisent ce
  `systemRunPlan` canonique comme contexte faisant autorité pour la commande, le répertoire de travail et la session.
- Si un appelant modifie `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` entre la préparation et le transfert final approuvé de `system.run`,
  le Gateway rejette l’exécution au lieu de faire confiance à la charge utile modifiée.

## Repli de livraison de l’agent

- Les requêtes `agent` peuvent inclure `deliver=true` pour demander une livraison sortante.
- `bestEffortDeliver=false` (valeur par défaut) conserve un comportement strict : les cibles de
  livraison non résolues ou uniquement internes renvoient `INVALID_REQUEST`.
- `bestEffortDeliver=true` autorise le repli vers une exécution limitée à la session lorsqu’aucune
  route de livraison externe ne peut être résolue (par exemple, les sessions internes/webchat
  ou les configurations multicanaux ambiguës).
- Les résultats finaux d’`agent` peuvent inclure `result.deliveryStatus` lorsqu’une livraison a été
  demandée, avec les mêmes états `sent`, `suppressed`, `partial_failed` et
  `failed` que ceux documentés pour
  [`openclaw agent --json --deliver`](/fr/cli/agent#json-delivery-status).

## Gestion des versions

- `PROTOCOL_VERSION`, `MIN_CLIENT_PROTOCOL_VERSION`,
  `MIN_NODE_PROTOCOL_VERSION` et `MIN_PROBE_PROTOCOL_VERSION` se trouvent dans
  `packages/gateway-protocol/src/version.ts`.
- Les clients envoient `minProtocol` + `maxProtocol`. Les clients opérateurs et d’interface utilisateur doivent
  inclure le protocole actuel dans cette plage ; les clients et serveurs actuels utilisent
  le protocole v4.
- Les clients authentifiés ayant à la fois `role: "node"` et `client.mode: "node"`
  peuvent utiliser le protocole de Node N-1 (actuellement v3). Les sondes légères de redémarrage utilisent
  la même fenêtre N-1. L’authentification des appareils, l’association, les portées, la stratégie des commandes et les approbations
  d’exécution restent inchangées par cette fenêtre de compatibilité. Les capacités et commandes de Node
  appartenant aux Plugins sont masquées jusqu’à ce que le Node soit mis à niveau vers le protocole actuel,
  car leurs surfaces hébergées ne font pas partie du contrat N-1.
- Les schémas et les modèles sont générés à partir des définitions TypeBox :
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Constantes des clients

L’implémentation cliente de référence se trouve dans `packages/gateway-client/src/`
(OpenClaw l’enveloppe au moyen de la façade légère `src/gateway/client.ts`). Ces
valeurs par défaut sont stables dans l’ensemble du protocole v4 et constituent la base attendue pour
les clients tiers.

| Constante                                 | Valeur par défaut                                     | Source                                                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_NODE_PROTOCOL_VERSION`               | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_PROBE_PROTOCOL_VERSION`              | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| Délai d’expiration des requêtes (par RPC) | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`requestTimeoutMs`)                                                              |
| Délai de préauthentification / défi de connexion | `15_000` ms                                     | `packages/gateway-client/src/timeouts.ts` (la variable d’environnement `OPENCLAW_HANDSHAKE_TIMEOUT_MS` peut augmenter le délai alloué conjointement au serveur et au client) |
| Délai initial avant reconnexion           | `1_000` ms                                            | `packages/gateway-client/src/client.ts` (`backoffMs`)                                                                     |
| Délai maximal avant reconnexion           | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`scheduleReconnect`)                                                             |
| Limite de nouvelle tentative rapide après une fermeture liée au jeton d’appareil | `250` ms                  | `packages/gateway-client/src/client.ts`                                                                                   |
| Délai de grâce avant arrêt forcé par `terminate()` | `250` ms                                       | `FORCE_STOP_TERMINATE_GRACE_MS`                                                                                           |
| Délai d’expiration par défaut de `stopAndWait()` | `1_000` ms                                      | `STOP_AND_WAIT_TIMEOUT_MS`                                                                                                |
| Intervalle de tick par défaut (avant `hello-ok`) | `30_000` ms                                      | `packages/gateway-client/src/client.ts`                                                                                   |
| Fermeture après expiration du tick        | code `4000` lorsque le silence dépasse `tickIntervalMs * 2` | `packages/gateway-client/src/client.ts`                                                                           |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                                                         |

Le serveur annonce les valeurs effectives de `policy.tickIntervalMs`,
`policy.maxPayload` et `policy.maxBufferedBytes` dans `hello-ok` ; les clients
doivent respecter ces valeurs plutôt que les valeurs par défaut antérieures à la négociation.

Le client de référence laisse les requêtes finies gérer leur délai configuré lorsque
chaque requête en attente en possède un. Une requête `expectFinal` sans
`timeoutMs` fini, toute requête avec `timeoutMs: null`, ou un mélange de requêtes
finies et sans limite maintient actif le mécanisme de surveillance des ticks. Si les événements entrants et
les réponses restent silencieux au-delà du seuil d’expiration des ticks, le client ferme le
socket avec le code `4000`, rejette toutes les requêtes en attente et se reconnecte. Il ne
réexécute pas les requêtes rejetées après la reconnexion.

## Authentification

- L’authentification du Gateway par secret partagé utilise `connect.params.auth.token` ou
  `connect.params.auth.password`, selon le mode
  `gateway.auth.mode` configuré (`"none" | "token" | "password" | "trusted-proxy"`).
- Les modes porteurs d’identité tels que Tailscale Serve (`gateway.auth.allowTailscale: true`)
  ou `gateway.auth.mode: "trusted-proxy"` hors loopback satisfont le contrôle
  d’authentification de connexion à partir des en-têtes de requête plutôt que de `connect.params.auth.*`.
- Le mode d’entrée privée `gateway.auth.mode: "none"` ignore entièrement l’authentification de connexion
  par secret partagé ; n’exposez pas ce mode sur une entrée publique/non fiable.
- Après l’association, le Gateway émet un jeton d’appareil limité au rôle et aux
  portées de la connexion, renvoyé dans `hello-ok.auth.deviceToken`. Les clients doivent
  le conserver après toute connexion réussie.
- Lors d’une reconnexion avec ce jeton d’appareil enregistré, l’ensemble des portées
  approuvé et enregistré pour ce jeton doit également être réutilisé. Cela préserve l’accès en lecture/sondage/état
  déjà accordé et évite que les reconnexions ne soient silencieusement réduites à une portée
  implicite réservée à l’administration.
- Assemblage de l’authentification de connexion côté client (`selectConnectAuth` dans
  `packages/gateway-client/src/client.ts`) :
  - `auth.password` est indépendant et toujours transmis lorsqu’il est défini.
  - `auth.token` est renseigné selon l’ordre de priorité suivant : d’abord le jeton partagé explicite,
    puis un `deviceToken` explicite, puis un jeton enregistré par appareil (indexé par
    `deviceId` + `role`).
  - `auth.bootstrapToken` est envoyé uniquement lorsqu’aucune des valeurs précédentes n’a permis de déterminer
    `auth.token`. Un jeton partagé ou tout jeton d’appareil déterminé le désactive.
  - La promotion automatique d’un jeton d’appareil enregistré lors de la tentative unique
    après `AUTH_TOKEN_MISMATCH` est limitée aux points de terminaison fiables : loopback,
    ou `wss://` avec un `tlsFingerprint` épinglé. Un `wss://` public sans épinglage
    n’est pas admissible.
- L’amorçage intégré par code de configuration renvoie le
  `hello-ok.auth.deviceToken` du Node principal ainsi qu’un jeton d’opérateur à durée limitée dans
  `hello-ok.auth.deviceTokens` pour un transfert fiable vers un appareil mobile. Le jeton d’opérateur
  inclut `operator.talk.secrets` pour les lectures de configuration Talk natives, mais
  exclut les portées de modification d’association et `operator.admin`.
- Tant qu’un amorçage par code de configuration non standard attend une approbation,
  les détails de `PAIRING_REQUIRED` incluent `recommendedNextStep: "wait_then_retry"`,
  `retryable: true` et `pauseReconnect: false`. Continuez à vous reconnecter avec le
  même jeton d’amorçage jusqu’à l’approbation de la requête ou jusqu’à ce que le jeton devienne
  invalide.
- Ne conservez `hello-ok.auth.deviceTokens` que lorsque la connexion a utilisé une authentification
  d’amorçage sur un transport fiable tel que `wss://` ou une association loopback/locale.
- Si un client fournit un `deviceToken` explicite ou des `scopes` explicites, cet
  ensemble de portées demandé par l’appelant reste la référence ; les portées mises en cache ne sont
  réutilisées que lorsque le client réutilise le jeton enregistré par appareil.
- Les jetons d’appareil peuvent être renouvelés/révoqués via `device.token.rotate` et
  `device.token.revoke` (nécessite `operator.pairing`). Le renouvellement ou la révocation du
  jeton d’un Node ou d’un autre rôle non-opérateur nécessite également `operator.admin`.
- `device.token.rotate` renvoie les métadonnées de renouvellement. Il renvoie le nouveau
  jeton porteur uniquement pour les appels provenant du même appareil et déjà authentifiés avec ce
  jeton d’appareil, afin que les clients utilisant uniquement un jeton puissent conserver son remplacement avant
  de se reconnecter. Les renouvellements effectués avec un secret partagé ou par un administrateur ne renvoient pas le jeton porteur.
- L’émission, le renouvellement et la révocation de jetons restent limités à l’ensemble de rôles
  approuvé et enregistré dans l’entrée d’association de cet appareil ; la modification d’un jeton ne peut pas étendre les droits ni
  cibler un rôle d’appareil que l’approbation de l’association n’a jamais accordé.
- Pour les sessions avec jeton d’appareil associé, la gestion des appareils est limitée à l’appareil lui-même, sauf si
  l’appelant possède également `operator.admin` : les appelants non administrateurs peuvent gérer uniquement le
  jeton d’opérateur de leur propre entrée d’appareil. La gestion des jetons de Node et des autres rôles non-opérateur
  est réservée aux administrateurs, même pour le propre appareil de l’appelant.
- `device.token.rotate` et `device.token.revoke` vérifient également l’ensemble des portées du
  jeton d’opérateur ciblé par rapport aux portées de la session actuelle de l’appelant.
  Les appelants non administrateurs ne peuvent ni renouveler ni révoquer un jeton d’opérateur dont les portées sont plus larges que celles
  qu’ils possèdent déjà.
- Les échecs d’authentification incluent `error.details.code` ainsi que des indications de récupération :
  - `error.details.canRetryWithDeviceToken` (booléen)
  - `error.details.recommendedNextStep` : l’une des valeurs `retry_with_device_token`,
    `update_auth_configuration`, `update_auth_credentials`,
    `wait_then_retry`, `review_auth_configuration`
    (`packages/gateway-protocol/src/connect-error-details.ts`).
- Comportement du client pour `AUTH_TOKEN_MISMATCH` :
  - Les clients fiables peuvent effectuer une seule nouvelle tentative limitée avec un jeton
    par appareil mis en cache.
  - Si cette tentative échoue, arrêtez les boucles de reconnexion automatique et affichez des
    instructions d’intervention à l’opérateur.
- `AUTH_SCOPE_MISMATCH` signifie que le jeton d’appareil a été reconnu, mais qu’il ne
  couvre pas le rôle ou les portées demandés. Ne le présentez pas comme un jeton incorrect ; invitez
  l’opérateur à effectuer une nouvelle association ou à approuver le contrat de portée plus restreint/plus large.

## Identité et association des appareils

- Les Nodes doivent inclure une identité d’appareil stable (`device.id`) dérivée de
  l’empreinte d’une paire de clés.
- Les Gateways émettent des jetons par appareil et par rôle.
- Les approbations d’association sont requises pour les nouveaux identifiants d’appareil, sauf si
  l’approbation automatique locale est activée.
- L’approbation automatique des associations est centrée sur les connexions loopback locales directes.
- OpenClaw dispose également d’un chemin étroit d’auto-connexion locale au backend/conteneur pour
  les flux d’assistance fiables utilisant un secret partagé.
- Les connexions tailnet ou LAN sur le même hôte sont toujours traitées comme distantes pour l’association
  et nécessitent une approbation.
- Les clients WS incluent normalement l’identité `device` pendant `connect` (opérateur +
  Node). Les seules exceptions permettant un opérateur sans appareil sont les chemins de confiance explicites :
  - `gateway.controlUi.allowInsecureAuth=true` pour la compatibilité HTTP non sécurisée
    limitée à localhost.
  - une authentification réussie de l’opérateur dans l’interface de contrôle avec `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (mesure d’urgence, dégradation
    sévère de la sécurité).
  - les RPC backend `gateway-client` en loopback direct sur le chemin interne
    réservé aux assistants.
- L’omission de l’identité de l’appareil a des conséquences sur les portées. Lorsqu’une
  connexion d’opérateur sans appareil est autorisée via un chemin de confiance explicite, OpenClaw
  efface tout de même les portées autodéclarées en les remplaçant par un ensemble vide, sauf si ce chemin possède une
  exception nommée de conservation des portées. Les méthodes soumises à des portées échouent alors avec
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` est un chemin de conservation des portées
  d’urgence de l’interface de contrôle. Il n’accorde pas de portées à des clients WebSocket
  backend personnalisés ou structurés comme la CLI.
- Le chemin réservé de l’assistant backend `gateway-client` en loopback direct conserve
  les portées uniquement pour les RPC internes du plan de contrôle local ; les identifiants de backend personnalisés ne
  bénéficient pas de cette exception.
- Toutes les connexions doivent signer le nonce `connect.challenge` fourni par le serveur.

### Diagnostics de migration de l’authentification des appareils

Pour les anciens clients qui utilisent encore le comportement de signature antérieur au défi, `connect`
renvoie des codes de détail `DEVICE_AUTH_*` dans `error.details.code` avec une valeur
`error.details.reason` stable.

Échecs de migration courants :

| Message                     | details.code                     | details.reason           | Signification                                      |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Le client a omis `device.nonce` (ou l’a envoyé vide). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Le client a signé avec un nonce obsolète ou incorrect. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | La charge utile de signature ne correspond pas à la charge utile v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | L’horodatage signé se trouve en dehors de la dérive autorisée. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` ne correspond pas à l’empreinte de la clé publique. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Le format ou la canonicalisation de la clé publique a échoué. |

Cible de migration :

- Attendez toujours `connect.challenge`.
- Signez la charge utile v2 qui inclut le nonce du serveur.
- Envoyez le même nonce dans `connect.params.device.nonce`.
- La charge utile de signature privilégiée est `v3`
  (`buildDeviceAuthPayloadV3` dans `packages/gateway-client/src/device-auth.ts`),
  qui lie `platform` et `deviceFamily` en plus des champs
  d’appareil/client/rôle/portées/jeton/nonce.
- Les signatures `v2` héritées restent acceptées à des fins de compatibilité, mais l’épinglage
  des métadonnées des appareils appairés continue de contrôler la stratégie des commandes lors de la reconnexion.

## TLS et épinglage

- TLS est pris en charge pour les connexions WS (configuration `gateway.tls`).
- Les clients peuvent éventuellement épingler l’empreinte du certificat du Gateway via
  `gateway.remote.tlsFingerprint` ou l’option CLI `--tls-fingerprint`.

## Portée

Ce protocole expose l’intégralité de l’API du Gateway : état, canaux, modèles, chat,
agent, sessions, nœuds, approbations, etc. La surface exacte est définie par
les schémas TypeBox réexportés depuis `packages/gateway-protocol/src/schema.ts`.

## Voir aussi

- [Protocole de pont](/fr/gateway/bridge-protocol)
- [Guide d’exploitation du Gateway](/fr/gateway)
