---
read_when:
    - Mise en œuvre des approbations de jumelage de Node sans interface utilisateur macOS
    - Ajout de flux CLI pour approuver les nœuds distants
    - Extension du protocole Gateway avec la gestion des Node
summary: Appairage de Node géré par le Gateway (option B) pour iOS et les autres Nodes distants
title: Appairage géré par Gateway
x-i18n:
    generated_at: "2026-05-06T07:24:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75713e04e37dcbae151d170e2eb459d0e9b9a799c64a10db731b61d7b53998b4
    source_path: gateway/pairing.md
    workflow: 16
---

Dans l’appairage géré par le Gateway, le **Gateway** est la source de vérité pour déterminer quels Nodes
sont autorisés à rejoindre. Les interfaces utilisateur (application macOS, futurs clients) ne sont que des interfaces
qui approuvent ou rejettent les demandes en attente.

**Important :** les Nodes WS utilisent **l’appairage d’appareil** (rôle `node`) pendant `connect`.
`node.pair.*` est un magasin d’appairage séparé et ne bloque **pas** la poignée de main WS.
Seuls les clients qui appellent explicitement `node.pair.*` utilisent ce flux.

## Concepts

- **Demande en attente** : un Node a demandé à rejoindre ; une approbation est requise.
- **Node appairé** : Node approuvé avec un jeton d’authentification émis.
- **Transport** : le point de terminaison WS du Gateway transfère les demandes mais ne décide pas
  de l’appartenance. (La prise en charge de l’ancien pont TCP a été supprimée.)

## Fonctionnement de l’appairage

1. Un Node se connecte au WS du Gateway et demande l’appairage.
2. Le Gateway stocke une **demande en attente** et émet `node.pair.requested`.
3. Vous approuvez ou rejetez la demande (CLI ou interface utilisateur).
4. Lors de l’approbation, le Gateway émet un **nouveau jeton** (les jetons sont renouvelés lors d’un nouvel appairage).
5. Le Node se reconnecte avec le jeton et est désormais « appairé ».

Les demandes en attente expirent automatiquement après **5 minutes**.

## Flux CLI (adapté au mode sans interface)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` affiche les Nodes appairés/connectés et leurs capacités.

## Surface d’API (protocole du Gateway)

Événements :

- `node.pair.requested` - émis lorsqu’une nouvelle demande en attente est créée.
- `node.pair.resolved` - émis lorsqu’une demande est approuvée/rejetée/expirée.

Méthodes :

- `node.pair.request` - créer ou réutiliser une demande en attente.
- `node.pair.list` - lister les Nodes en attente et appairés (`operator.pairing`).
- `node.pair.approve` - approuver une demande en attente (émet un jeton).
- `node.pair.reject` - rejeter une demande en attente.
- `node.pair.remove` - supprimer une entrée de Node appairé obsolète.
- `node.pair.verify` - vérifier `{ nodeId, token }`.

Remarques :

- `node.pair.request` est idempotent par Node : les appels répétés renvoient la même
  demande en attente.
- Les demandes répétées pour le même Node en attente actualisent aussi les métadonnées
  de Node stockées et le dernier instantané des commandes déclarées en liste d’autorisation, pour la visibilité de l’opérateur.
- L’approbation génère **toujours** un nouveau jeton ; aucun jeton n’est jamais renvoyé par
  `node.pair.request`.
- Les niveaux de portée de l’opérateur et les contrôles au moment de l’approbation sont résumés dans
  [Portées de l’opérateur](/fr/gateway/operator-scopes).
- Les demandes peuvent inclure `silent: true` comme indice pour les flux d’approbation automatique.
- `node.pair.approve` utilise les commandes déclarées de la demande en attente pour appliquer
  des portées d’approbation supplémentaires :
  - demande sans commande : `operator.pairing`
  - demande de commande non exec : `operator.pairing` + `operator.write`
  - demande `system.run` / `system.run.prepare` / `system.which` :
    `operator.pairing` + `operator.admin`

<Warning>
L’appairage de Node est un flux de confiance et d’identité, avec émission de jeton. Il ne verrouille **pas** la surface de commandes du Node actif par Node.

- Les commandes de Node actives proviennent de ce que le Node déclare à la connexion, après application de la stratégie globale du Gateway pour les commandes de Node (`gateway.nodes.allowCommands` et `denyCommands`).
- La stratégie par Node d’autorisation et de demande pour `system.run` réside sur le Node dans `exec.approvals.node.*`, pas dans l’enregistrement d’appairage.

</Warning>

## Filtrage des commandes de Node (2026.3.31+)

<Warning>
**Changement incompatible :** à partir de `2026.3.31`, les commandes de Node sont désactivées tant que l’appairage du Node n’est pas approuvé. L’appairage d’appareil seul ne suffit plus à exposer les commandes de Node déclarées.
</Warning>

Lorsqu’un Node se connecte pour la première fois, l’appairage est demandé automatiquement. Tant que la demande d’appairage n’est pas approuvée, toutes les commandes de Node en attente provenant de ce Node sont filtrées et ne seront pas exécutées. Une fois la confiance établie par l’approbation de l’appairage, les commandes déclarées du Node deviennent disponibles sous réserve de la stratégie de commandes normale.

Cela signifie :

- Les Nodes qui s’appuyaient auparavant uniquement sur l’appairage d’appareil pour exposer des commandes doivent désormais terminer l’appairage de Node.
- Les commandes mises en file avant l’approbation de l’appairage sont abandonnées, pas différées.

## Limites de confiance des événements de Node (2026.3.31+)

<Warning>
**Changement incompatible :** les exécutions provenant de Nodes restent désormais sur une surface de confiance réduite.
</Warning>

Les résumés provenant de Nodes et les événements de session associés sont limités à la surface de confiance prévue. Les flux pilotés par notification ou déclenchés par des Nodes qui s’appuyaient auparavant sur un accès plus large aux outils d’hôte ou de session peuvent nécessiter un ajustement. Ce durcissement garantit que les événements de Node ne peuvent pas escalader vers un accès aux outils au niveau de l’hôte au-delà de ce que permet la limite de confiance du Node.

Les mises à jour durables de présence de Node suivent la même limite d’identité. L’événement `node.presence.alive` est
accepté uniquement depuis des sessions d’appareil Node authentifiées et met à jour les métadonnées d’appairage uniquement lorsque
l’identité appareil/Node est déjà appairée. Les valeurs `client.id` auto-déclarées ne suffisent pas pour écrire
l’état de dernière activité.

## Approbation automatique (application macOS)

L’application macOS peut facultativement tenter une **approbation silencieuse** lorsque :

- la demande est marquée `silent`, et
- l’application peut vérifier une connexion SSH à l’hôte du Gateway avec le même utilisateur.

Si l’approbation silencieuse échoue, elle revient à l’invite normale « Approuver/Rejeter ».

## Approbation automatique d’appareil par CIDR de confiance

L’appairage d’appareil WS pour `role: node` reste manuel par défaut. Pour les réseaux
de Nodes privés où le Gateway fait déjà confiance au chemin réseau, les opérateurs peuvent
l’activer avec des CIDR explicites ou des IP exactes :

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Limite de sécurité :

- Désactivé lorsque `gateway.nodes.pairing.autoApproveCidrs` n’est pas défini.
- Aucun mode d’approbation automatique globale LAN ou réseau privé n’existe.
- Seul un nouvel appairage d’appareil `role: node` sans portées demandées est éligible.
- Les clients opérateur, navigateur, Control UI et WebChat restent manuels.
- Les mises à niveau de rôle, de portée, de métadonnées et de clé publique restent manuelles.
- Les chemins d’en-tête de proxy de confiance via local loopback sur le même hôte ne sont pas éligibles, car ce
  chemin peut être usurpé par des appelants locaux.

## Approbation automatique des mises à niveau de métadonnées

Lorsqu’un appareil déjà appairé se reconnecte avec uniquement des changements de métadonnées
non sensibles (par exemple, nom d’affichage ou indices de plateforme client), OpenClaw traite
cela comme une `metadata-upgrade`. L’approbation automatique silencieuse est étroite : elle s’applique uniquement
aux reconnexions locales non navigateur de confiance qui ont déjà prouvé la possession d’identifiants locaux
ou partagés, y compris les reconnexions d’application native sur le même hôte après des changements de métadonnées de
version du système d’exploitation. Les clients navigateur/Control UI et les clients distants continuent
d’utiliser le flux explicite de réapprobation. Les mises à niveau de portée (lecture vers écriture/admin) et
les changements de clé publique ne sont **pas** éligibles à l’approbation automatique `metadata-upgrade` -
ils restent des demandes explicites de réapprobation.

## Assistants d’appairage QR

`/pair qr` affiche la charge utile d’appairage sous forme de média structuré afin que les clients mobiles et
navigateur puissent la scanner directement.

La suppression d’un appareil nettoie aussi toutes les demandes d’appairage en attente obsolètes pour cet
identifiant d’appareil, afin que `nodes pending` n’affiche pas de lignes orphelines après une révocation.

## Localité et en-têtes transférés

L’appairage du Gateway traite une connexion comme local loopback uniquement lorsque le socket brut
et toute preuve de proxy en amont concordent. Si une demande arrive sur local loopback mais
porte des en-têtes `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`
qui indiquent une origine non locale, cette preuve par en-têtes transférés invalide
la revendication de localité local loopback. Le chemin d’appairage exige alors une approbation explicite
au lieu de traiter silencieusement la demande comme une connexion au même hôte. Consultez
[Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth) pour la règle équivalente sur
l’authentification opérateur.

## Stockage (local, privé)

L’état d’appairage est stocké dans le répertoire d’état du Gateway (par défaut `~/.openclaw`) :

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Si vous remplacez `OPENCLAW_STATE_DIR`, le dossier `nodes/` se déplace avec lui.

Remarques de sécurité :

- Les jetons sont des secrets ; traitez `paired.json` comme sensible.
- La rotation d’un jeton nécessite une réapprobation (ou la suppression de l’entrée du Node).

## Comportement du transport

- Le transport est **sans état** ; il ne stocke pas l’appartenance.
- Si le Gateway est hors ligne ou si l’appairage est désactivé, les Nodes ne peuvent pas s’appairer.
- Si le Gateway est en mode distant, l’appairage se fait toujours avec le magasin du Gateway distant.

## Liens associés

- [Appairage de canal](/fr/channels/pairing)
- [Nodes](/fr/nodes)
- [CLI des appareils](/fr/cli/devices)
