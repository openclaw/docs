---
read_when:
    - Débogage de l’onglet Instances
    - Investigation sur les lignes d’instance dupliquées ou obsolètes
    - Modification des balises de connexion WS du Gateway ou d’événements système
summary: Comment les entrées de présence OpenClaw sont produites, fusionnées et affichées
title: Présence
x-i18n:
    generated_at: "2026-05-06T07:19:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ab76e81fc1842c747b0a33da8cf9874e3537c5ab023450ee1a6a314453e7263
    source_path: concepts/presence.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw "présence" est une vue légère et au mieux de :

- le **Gateway** lui-même, et
- les **clients connectés au Gateway** (application Mac, WebChat, CLI, etc.)

La présence est principalement utilisée pour afficher l’onglet **Instances** de l’application macOS et pour
fournir une visibilité rapide à l’opérateur.

## Champs de présence (ce qui s’affiche)

Les entrées de présence sont des objets structurés avec des champs comme :

- `instanceId` (facultatif mais fortement recommandé) : identité stable du client (généralement `connect.client.instanceId`)
- `host` : nom d’hôte lisible par un humain
- `ip` : adresse IP au mieux
- `version` : chaîne de version du client
- `deviceFamily` / `modelIdentifier` : indications matérielles
- `mode` : `ui`, `webchat`, `cli`, `backend`, `probe`, `test`, `node`, ...
- `lastInputSeconds` : "secondes depuis la dernière saisie utilisateur" (si connu)
- `reason` : `self`, `connect`, `node-connected`, `periodic`, ...
- `ts` : horodatage de la dernière mise à jour (ms depuis l’époque Unix)

## Producteurs (d’où vient la présence)

Les entrées de présence sont produites par plusieurs sources et **fusionnées**.

### 1) Entrée du Gateway lui-même

Le Gateway initialise toujours une entrée "self" au démarrage afin que les interfaces utilisateur affichent l’hôte du Gateway
avant même qu’un client ne se connecte.

### 2) Connexion WebSocket

Chaque client WS commence par une requête `connect`. Une fois la négociation réussie, le
Gateway ajoute ou met à jour une entrée de présence pour cette connexion.

#### Pourquoi les commandes CLI ponctuelles ne s’affichent pas

La CLI se connecte souvent pour des commandes courtes et ponctuelles. Pour éviter de surcharger la
liste des Instances, `client.mode === "cli"` n’est **pas** transformé en entrée de présence.

### 3) Balises `system-event`

Les clients peuvent envoyer des balises périodiques plus riches via la méthode `system-event`. L’application Mac
l’utilise pour signaler le nom d’hôte, l’IP et `lastInputSeconds`.

### 4) Connexions Node (rôle : node)

Lorsqu’un node se connecte via le WebSocket du Gateway avec `role: node`, le Gateway
ajoute ou met à jour une entrée de présence pour ce node (même flux que pour les autres clients WS).

## Règles de fusion et de déduplication (pourquoi `instanceId` compte)

Les entrées de présence sont stockées dans une seule map en mémoire :

- Les entrées sont indexées par une **clé de présence**.
- La meilleure clé est un `instanceId` stable (provenant de `connect.client.instanceId`) qui survit aux redémarrages.
- Les clés ne tiennent pas compte de la casse.

Si un client se reconnecte sans `instanceId` stable, il peut apparaître comme une ligne
**en double**.

## TTL et taille bornée

La présence est intentionnellement éphémère :

- **TTL :** les entrées de plus de 5 minutes sont supprimées
- **Nombre maximal d’entrées :** 200 (les plus anciennes sont supprimées en premier)

Cela garde la liste à jour et évite une croissance non bornée de la mémoire.

## Mise en garde distant/tunnel (IP loopback)

Lorsqu’un client se connecte via un tunnel SSH / une redirection de port locale, le Gateway peut
voir l’adresse distante comme `127.0.0.1`. Pour éviter d’écraser une bonne IP signalée par le client,
les adresses distantes loopback sont ignorées.

## Consommateurs

### Onglet Instances de macOS

L’application macOS affiche la sortie de `system-presence` et applique un petit indicateur
d’état (Actif/Inactif/Obsolète) selon l’âge de la dernière mise à jour.

## Conseils de débogage

- Pour voir la liste brute, appelez `system-presence` auprès du Gateway.
- Si vous voyez des doublons :
  - confirmez que les clients envoient un `client.instanceId` stable lors de la négociation
  - confirmez que les balises périodiques utilisent le même `instanceId`
  - vérifiez si l’entrée dérivée de la connexion n’a pas d’`instanceId` (les doublons sont attendus)

## Associé

<CardGroup cols={2}>
  <Card title="Indicateurs de saisie" href="/fr/concepts/typing-indicators" icon="ellipsis">
    Quand les indicateurs de saisie sont envoyés et comment les ajuster.
  </Card>
  <Card title="Streaming et segmentation" href="/fr/concepts/streaming" icon="bars-staggered">
    Streaming sortant, segmentation et mise en forme par canal.
  </Card>
  <Card title="Architecture du Gateway" href="/fr/concepts/architecture" icon="diagram-project">
    Composants du Gateway et protocole WebSocket qui pilote les mises à jour de présence.
  </Card>
  <Card title="Protocole du Gateway" href="/fr/gateway/protocol" icon="plug">
    Le protocole filaire pour `connect`, `system-event` et `system-presence`.
  </Card>
</CardGroup>
