---
read_when:
    - Travailler sur le protocole du Gateway, les clients ou les transports
summary: Architecture du Gateway WebSocket, composants et flux clients
title: Architecture du Gateway
x-i18n:
    generated_at: "2026-07-12T02:29:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f8054bd87f738b957c24f8d6965d55365de2293d44902530a9ba778afa597cc7
    source_path: concepts/architecture.md
    workflow: 16
---

## Vue d’ensemble

- Un unique **Gateway** persistant gère toutes les interfaces de messagerie (WhatsApp via
  Baileys, Telegram via grammY, Slack, Discord, Signal, iMessage, WebChat).
- Les clients du plan de contrôle (application macOS, CLI, interface web, automatisations) se connectent au
  Gateway via **WebSocket** sur l’hôte d’écoute configuré (par défaut
  `127.0.0.1:18789`).
- Les **Nodes** (macOS/iOS/Android/sans interface) se connectent également via **WebSocket**, mais
  déclarent `role: node` avec des capacités et commandes explicites.
- Un seul Gateway par hôte ; c’est le seul composant qui ouvre une session WhatsApp.
- L’**hôte du canevas** est servi par le serveur HTTP du Gateway sous :
  - `/__openclaw__/canvas/` (HTML/CSS/JS modifiable par l’agent)
  - `/__openclaw__/a2ui/` (hôte A2UI)

  Il utilise le même port que le Gateway (par défaut `18789`).

## Composants et flux

### Gateway (démon)

- Maintient les connexions aux fournisseurs.
- Expose une API WS typée (requêtes, réponses, événements poussés par le serveur).
- Valide les trames entrantes par rapport au schéma JSON.
- Émet des événements tels que `agent`, `chat`, `presence`, `health`, `heartbeat`, `cron`.

### Clients (application Mac / CLI / administration web)

- Une connexion WS par client.
- Envoient des requêtes (`health`, `status`, `send`, `agent`, `system-presence`).
- S’abonnent aux événements (`tick`, `agent`, `presence`, `shutdown`).

### Nodes (macOS / iOS / Android / sans interface)

- Se connectent au **même serveur WS** avec `role: node`.
- Fournissent une identité d’appareil dans `connect` ; l’appairage est **fondé sur l’appareil** (rôle `node`) et
  l’approbation est conservée dans le magasin d’appairage des appareils.
- Exposent des commandes telles que `canvas.*`, `camera.*`, `screen.record`, `location.get`.

Détails du protocole : [Protocole du Gateway](/fr/gateway/protocol)

### WebChat

- Interface statique qui utilise l’API WS du Gateway pour l’historique des discussions et l’envoi de messages.
- Dans les configurations distantes, se connecte via le même tunnel SSH/Tailscale que les autres
  clients.

## Cycle de vie de la connexion (client unique)

```mermaid
sequenceDiagram
    participant Client
    participant Gateway

    Client->>Gateway: req:connect
    Gateway-->>Client: res (ok)
    Note right of Gateway: or res error + close
    Note left of Client: payload=hello-ok<br>snapshot: presence + health

    Gateway-->>Client: event:presence
    Gateway-->>Client: event:tick

    Client->>Gateway: req:agent
    Gateway-->>Client: res:agent<br>ack {runId, status:"accepted"}
    Gateway-->>Client: event:agent<br>(streaming)
    Gateway-->>Client: res:agent<br>final {runId, status, summary}
```

## Protocole de transmission (résumé)

- Transport : WebSocket, trames textuelles avec charges utiles JSON.
- La première trame **doit** être `connect`.
- Après la négociation :
  - Requêtes : `{type:"req", id, method, params}` → `{type:"res", id, ok, payload|error}`
  - Événements : `{type:"event", event, payload, seq?, stateVersion?}`
- `hello-ok.features.methods` / `events` sont des métadonnées de découverte, et non une
  liste générée de toutes les routes auxiliaires appelables.
- L’authentification par secret partagé utilise `connect.params.auth.token` ou
  `connect.params.auth.password`, selon le mode d’authentification configuré du Gateway.
- Les modes fondés sur l’identité, tels que Tailscale Serve
  (`gateway.auth.allowTailscale: true`) ou `gateway.auth.mode: "trusted-proxy"` hors local loopback,
  satisfont les exigences d’authentification à partir des en-têtes de requête
  plutôt que de `connect.params.auth.*`.
- Le mode d’entrée privée `gateway.auth.mode: "none"` désactive entièrement
  l’authentification par secret partagé ; n’utilisez pas ce mode sur une entrée publique ou non fiable.
- Des clés d’idempotence sont requises pour les méthodes ayant des effets de bord (`send`, `agent`) afin de
  permettre des nouvelles tentatives sûres ; le serveur conserve un cache de déduplication de courte durée.
- Les Nodes doivent inclure `role: "node"` ainsi que les capacités, commandes et autorisations dans `connect`.

## Appairage et confiance locale

- Tous les clients WS (opérateurs et Nodes) incluent une **identité d’appareil** dans `connect`.
- Les nouveaux identifiants d’appareil nécessitent une approbation d’appairage ; le Gateway émet un **jeton d’appareil**
  pour les connexions ultérieures.
- Les connexions directes via local loopback peuvent être approuvées automatiquement afin de préserver la fluidité de
  l’expérience sur le même hôte.
- OpenClaw dispose également d’un chemin restreint d’auto-connexion locale au serveur principal ou au conteneur pour
  les flux auxiliaires fiables utilisant un secret partagé.
- Les connexions au tailnet et au réseau local, y compris les écoutes tailnet sur le même hôte, nécessitent toujours
  une approbation d’appairage explicite.
- Toutes les connexions doivent signer le nonce `connect.challenge`. La charge utile de signature `v3`
  lie également `platform` et `deviceFamily` ; le Gateway fixe les métadonnées appairées lors de la
  reconnexion et exige un nouvel appairage de réparation en cas de modification des métadonnées.
- Les connexions **non locales** nécessitent toujours une approbation explicite.
- L’authentification du Gateway (`gateway.auth.*`) s’applique toujours à **toutes** les connexions, locales ou
  distantes.

Détails : [Protocole du Gateway](/fr/gateway/protocol), [Appairage](/fr/channels/pairing),
[Sécurité](/fr/gateway/security).

## Typage du protocole et génération de code

- Les schémas TypeBox définissent le protocole.
- Le schéma JSON est généré à partir de ces schémas.
- Les modèles Swift sont générés à partir du schéma JSON.

## Accès distant

- Recommandé : Tailscale ou VPN.
- Alternative : tunnel SSH

  ```bash
  ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
  ```

- La même négociation et le même jeton d’authentification s’appliquent via le tunnel.
- TLS et l’épinglage facultatif peuvent être activés pour WS dans les configurations distantes.

## Aperçu des opérations

- Démarrage : `openclaw gateway` (au premier plan, journaux envoyés vers la sortie standard).
- État de santé : `health` via WS (également inclus dans `hello-ok`).
- Supervision : launchd/systemd pour le redémarrage automatique.

## Invariants

- Un seul Gateway contrôle exactement une session Baileys par hôte.
- La négociation est obligatoire ; toute première trame non JSON ou différente de `connect` entraîne une fermeture immédiate.
- Les événements ne sont pas rejoués ; les clients doivent actualiser leur état en cas de lacunes.

## Rubriques connexes

- [Boucle de l’agent](/fr/concepts/agent-loop) — cycle détaillé d’exécution de l’agent
- [Protocole du Gateway](/fr/gateway/protocol) — contrat du protocole WebSocket
- [File d’attente](/fr/concepts/queue) — file d’attente des commandes et concurrence
- [Sécurité](/fr/gateway/security) — modèle de confiance et durcissement
