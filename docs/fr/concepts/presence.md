---
read_when:
    - Débogage de l’état en temps réel sur la page Appareils de l’interface de contrôle
    - Recherche de lignes d’instances en double ou obsolètes
    - Modification de la connexion WebSocket au Gateway ou des balises d’événements système
summary: Comment les entrées de présence OpenClaw sont produites, fusionnées et affichées
title: Présence
x-i18n:
    generated_at: "2026-07-16T13:09:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b50291e26ddc06fac888847c9e94eba5f9351b1b8d06c55fd6bec16a38d0b6a5
    source_path: concepts/presence.md
    workflow: 16
---

La « présence » d’OpenClaw est une vue légère et fournie au mieux de :

- le **Gateway** lui-même, et
- les **clients visibles par l’utilisateur connectés au Gateway** (app Mac, WebChat, nœuds, etc.)

La présence affiche les métadonnées de connexion en direct sur la page **Appareils** de l’interface de contrôle
(sous **Paramètres → Appareils**) et dans l’onglet **Instances** de l’app macOS.

Cette page traite de la liste des clients du Gateway. Pour détecter le Mac utilisé le plus récemment
et y acheminer les alertes de nœud, consultez
[Présence de l’ordinateur actif](/fr/nodes/presence).

## Champs de présence (ce qui s’affiche)

Les entrées de présence sont des objets structurés comportant des champs tels que :

- `instanceId` (facultatif, mais fortement recommandé) : identité stable du client (généralement `connect.client.instanceId`)
- `host` : nom d’hôte lisible
- `ip` : adresse IP déterminée au mieux
- `version` : chaîne de version du client
- `deviceFamily` / `modelIdentifier` : indications sur le matériel
- `mode` : `ui`, `webchat`, `cli`, `backend`, `node`, `probe`, `test`
- `lastInputSeconds` : secondes écoulées depuis la dernière saisie de l’utilisateur, si cette information est connue
- `reason` : chaîne de forme libre fournie par le client ; le Gateway lui-même n’émet que `self`, `connect` et `disconnect`
- `deviceId`, `roles`, `scopes` : identité de l’appareil et indications de rôle/périmètre issues de la négociation de connexion
- `ts` : horodatage de la dernière mise à jour (ms depuis l’époque)

## Producteurs (origine de la présence)

Les entrées de présence proviennent de plusieurs sources et sont **fusionnées**.

### 1) Entrée propre au Gateway

Le Gateway crée toujours une entrée « propre » au démarrage afin que les interfaces affichent l’hôte du Gateway
avant même la connexion de tout client.

### 2) Connexion WebSocket

Chaque client WS commence par une requête `connect`. Une fois la négociation réussie, le
Gateway insère ou met à jour une entrée de présence pour cette connexion.

#### Pourquoi les connexions éphémères du plan de contrôle ne s’affichent pas

Les commandes CLI, les clients RPC de backend et les sondes se connectent souvent brièvement. Pour éviter
de conserver ces fluctuations pendant toute la durée de vie de la présence, les clients en mode `cli`, `backend`
ou `probe` ne sont **pas** convertis en entrées de présence. Les clients en mode test
restent suivis, car les suites de tests les utilisent comme substituts de clients réels.

### 3) Balises `system-event`

Les clients peuvent envoyer des balises périodiques plus riches par l’intermédiaire de la méthode `system-event`. L’app Mac
l’utilise pour signaler le nom d’hôte, l’adresse IP et `lastInputSeconds`.

### 4) Connexions de nœuds (rôle : node)

Lorsqu’un nœud se connecte par le WebSocket du Gateway avec `role: node`, le Gateway
insère ou met à jour une entrée de présence pour ce nœud (selon le même flux que pour les autres clients WS).

## Règles de fusion et de déduplication (pourquoi `instanceId` est important)

Les entrées de présence sont stockées dans une seule table en mémoire, indexée sans tenir compte de la casse
selon le premier élément disponible, dans cet ordre : un identifiant d’appareil appairé, `connect.client.instanceId`
ou, en dernier recours, l’identifiant propre à la connexion.

Les clients éphémères du plan de contrôle sont entièrement exclus du suivi (voir
ci-dessus) ; leurs identifiants de connexion ne deviennent donc jamais des clés. Pour tous les autres clients, le recours à
l’identifiant de connexion signifie qu’un client qui se reconnecte sans
`instanceId` stable apparaît comme une ligne **en double**.

## Durée de vie et taille limitée

La présence est intentionnellement éphémère :

- **Durée de vie :** les entrées datant de plus de 5 minutes sont supprimées
- **Nombre maximal d’entrées :** 200 (les plus anciennes sont supprimées en premier)

Cela permet de maintenir la liste à jour et d’éviter une croissance illimitée de la mémoire.

## Mise en garde concernant les connexions distantes/tunnels (adresses IP de bouclage)

Lorsqu’un client se connecte au moyen d’un tunnel SSH ou d’une redirection de port locale, le Gateway
peut voir l’adresse distante comme `127.0.0.1`. Pour éviter d’enregistrer cette adresse de tunnel
comme adresse IP du client, le traitement de la connexion omet entièrement `ip` pour
les clients détectés comme locaux (bouclage), au lieu d’inscrire l’adresse de bouclage
dans l’entrée.

## Consommateurs

### Page Appareils de l’interface de contrôle

La page **Appareils** associe `system-presence` aux enregistrements persistants
d’appairage et de nœuds. Elle épingle en premier la balise propre au Gateway et utilise les identifiants
d’appareil ou d’instance correspondants pour les métadonnées en direct relatives à la plateforme, à la version, au modèle et à la récence des saisies.

### Onglet Instances de macOS

L’app macOS affiche la sortie de `system-presence` et applique un petit indicateur
d’état (Actif/Inactif/Obsolète) en fonction de l’ancienneté de la dernière mise à jour.

## Conseils de débogage

- Pour afficher la liste brute, appelez `system-presence` sur le Gateway.
- Si des doublons apparaissent :
  - vérifiez que les clients envoient un `client.instanceId` stable pendant la négociation
  - vérifiez que les balises périodiques utilisent le même `instanceId`
  - vérifiez si `instanceId` est absent de l’entrée dérivée de la connexion (les doublons sont alors attendus)

## Rubriques connexes

<CardGroup cols={2}>
  <Card title="Présence de l’ordinateur actif" href="/fr/nodes/presence" icon="computer-mouse">
    Comment la saisie physique sur le Mac sélectionne un nœud actif et achemine les alertes de connexion.
  </Card>
  <Card title="Indicateurs de saisie" href="/fr/concepts/typing-indicators" icon="ellipsis">
    Quand les indicateurs de saisie sont envoyés et comment les ajuster.
  </Card>
  <Card title="Diffusion en continu et segmentation" href="/fr/concepts/streaming" icon="bars-staggered">
    Diffusion sortante en continu, segmentation et mise en forme propre à chaque canal.
  </Card>
  <Card title="Architecture du Gateway" href="/fr/concepts/architecture" icon="diagram-project">
    Composants du Gateway et protocole WebSocket qui pilote les mises à jour de présence.
  </Card>
  <Card title="Protocole du Gateway" href="/fr/gateway/protocol" icon="plug">
    Le protocole filaire pour `connect`, `system-event` et `system-presence`.
  </Card>
</CardGroup>
