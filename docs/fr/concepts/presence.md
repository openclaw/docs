---
read_when:
    - Débogage de l’état en direct sur la page Appareils de l’interface de contrôle
    - Recherche des lignes d’instance en double ou obsolètes
    - Modification de la connexion WebSocket au Gateway ou des balises d’événements système
summary: Comment les entrées de présence OpenClaw sont produites, fusionnées et affichées
title: Présence
x-i18n:
    generated_at: "2026-07-12T15:17:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4c0ef74eeaaa5ee00e43dfcfb25d7e3652fd6e7d0fac2d236fe3b9af7d193d1c
    source_path: concepts/presence.md
    workflow: 16
---

La « présence » d’OpenClaw est une vue légère et au mieux des possibilités de :

- le **Gateway** lui-même, et
- les **clients visibles par l’utilisateur connectés au Gateway** (application Mac, WebChat, nœuds, etc.)

La présence affiche les métadonnées de connexion en direct sur la page **Appareils** de l’interface de contrôle
et dans l’onglet **Instances** de l’application macOS.

Cette page décrit la liste des clients du Gateway. Pour détecter le Mac que vous avez utilisé le plus récemment
et y acheminer les alertes des nœuds, consultez
[Présence de l’ordinateur actif](/nodes/presence).

## Champs de présence (éléments affichés)

Les entrées de présence sont des objets structurés comportant des champs tels que :

- `instanceId` (facultatif, mais fortement recommandé) : identité stable du client (généralement `connect.client.instanceId`)
- `host` : nom d’hôte lisible
- `ip` : adresse IP déterminée au mieux
- `version` : chaîne de version du client
- `deviceFamily` / `modelIdentifier` : indications sur le matériel
- `mode` : `ui`, `webchat`, `cli`, `backend`, `node`, `probe`, `test`
- `lastInputSeconds` : nombre de secondes écoulées depuis la dernière saisie de l’utilisateur, si connu
- `reason` : chaîne libre fournie par le client ; le Gateway lui-même n’émet que `self`, `connect` et `disconnect`
- `deviceId`, `roles`, `scopes` : indications sur l’identité de l’appareil, son rôle et ses portées, issues de la négociation de connexion
- `ts` : horodatage de la dernière mise à jour (ms depuis l’époque Unix)

## Producteurs (origine de la présence)

Les entrées de présence sont produites par plusieurs sources, puis **fusionnées**.

### 1) Entrée propre au Gateway

Le Gateway initialise toujours une entrée « self » au démarrage afin que les interfaces affichent l’hôte du Gateway,
même avant la connexion du moindre client.

### 2) Connexion WebSocket

Chaque client WS commence par une requête `connect`. Une fois la négociation réussie, le
Gateway insère ou met à jour une entrée de présence pour cette connexion.

#### Pourquoi les connexions éphémères du plan de contrôle ne sont pas affichées

Les commandes CLI, les clients RPC du backend et les sondes se connectent souvent brièvement. Afin d’éviter
de conserver ces changements pendant toute la durée de vie de la présence, les clients en mode `cli`, `backend`
ou `probe` ne sont **pas** transformés en entrées de présence. Les clients en mode test
restent suivis, car les suites de tests les utilisent comme substituts de clients réels.

### 3) Balises `system-event`

Les clients peuvent envoyer périodiquement des balises plus détaillées au moyen de la méthode `system-event`. L’application
Mac l’utilise pour communiquer le nom d’hôte, l’adresse IP et `lastInputSeconds`.

### 4) Connexions de nœuds (rôle : node)

Lorsqu’un nœud se connecte via le WebSocket du Gateway avec `role: node`, le Gateway
insère ou met à jour une entrée de présence pour ce nœud (selon le même processus que pour les autres clients WS).

## Règles de fusion et de déduplication (importance de `instanceId`)

Les entrées de présence sont stockées dans une seule table en mémoire, indexée sans distinction de casse
par le premier identifiant disponible, dans cet ordre : identifiant d’un appareil appairé, `connect.client.instanceId`,
puis, en dernier recours, identifiant propre à la connexion.

Les clients éphémères du plan de contrôle sont totalement exclus du suivi (voir
ci-dessus) ; leurs identifiants de connexion ne deviennent donc jamais des clés. Pour tous les autres clients, le
recours à l’identifiant de connexion implique qu’un client qui se reconnecte sans `instanceId`
stable apparaît sous forme de ligne **dupliquée**.

## Durée de vie et taille limitée

La présence est volontairement éphémère :

- **Durée de vie :** les entrées datant de plus de 5 minutes sont supprimées
- **Nombre maximal d’entrées :** 200 (les plus anciennes sont supprimées en premier)

Cela permet de maintenir la liste à jour et d’éviter une croissance illimitée de l’utilisation de la mémoire.

## Limitation des connexions distantes/tunnels (adresses IP de bouclage)

Lorsqu’un client se connecte via un tunnel SSH ou une redirection de port locale, le Gateway
peut voir l’adresse distante comme `127.0.0.1`. Pour éviter d’enregistrer cette adresse de tunnel
comme adresse IP du client, le traitement de la connexion omet entièrement `ip` pour les clients
détectés comme locaux (bouclage), au lieu d’inscrire l’adresse de bouclage
dans l’entrée.

## Consommateurs

### Page Appareils de l’interface de contrôle

La page **Appareils** associe `system-presence` aux enregistrements persistants d’appairage et de nœuds.
Elle épingle en premier la balise propre au Gateway et utilise les identifiants d’appareil ou
d’instance correspondants pour les métadonnées en direct de plateforme, de version, de modèle et d’ancienneté de la dernière saisie.

### Onglet Instances de macOS

L’application macOS affiche la sortie de `system-presence` et applique un petit indicateur
d’état (Actif/Inactif/Obsolète) selon l’ancienneté de la dernière mise à jour.

## Conseils de débogage

- Pour afficher la liste brute, appelez `system-presence` sur le Gateway.
- Si vous voyez des doublons :
  - vérifiez que les clients envoient un `client.instanceId` stable lors de la négociation
  - vérifiez que les balises périodiques utilisent le même `instanceId`
  - vérifiez si l’entrée dérivée de la connexion ne contient pas `instanceId` (les doublons sont alors attendus)

## Pages connexes

<CardGroup cols={2}>
  <Card title="Présence de l’ordinateur actif" href="/nodes/presence" icon="computer-mouse">
    Comment la saisie physique sur un Mac sélectionne un nœud actif et achemine les alertes de connexion.
  </Card>
  <Card title="Indicateurs de saisie" href="/fr/concepts/typing-indicators" icon="ellipsis">
    Quand les indicateurs de saisie sont envoyés et comment les ajuster.
  </Card>
  <Card title="Diffusion en continu et découpage" href="/fr/concepts/streaming" icon="bars-staggered">
    Diffusion en continu sortante, découpage et mise en forme propre à chaque canal.
  </Card>
  <Card title="Architecture du Gateway" href="/fr/concepts/architecture" icon="diagram-project">
    Composants du Gateway et protocole WebSocket qui pilote les mises à jour de présence.
  </Card>
  <Card title="Protocole du Gateway" href="/fr/gateway/protocol" icon="plug">
    Le protocole de communication pour `connect`, `system-event` et `system-presence`.
  </Card>
</CardGroup>
