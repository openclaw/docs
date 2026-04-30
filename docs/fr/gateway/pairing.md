---
read_when:
    - Mise en œuvre des approbations de jumelage Node sans interface utilisateur macOS
    - Ajout de flux CLI pour approuver les nœuds distants
    - Extension du protocole Gateway avec la gestion des Node
summary: Appairage de nœuds géré par Gateway (option B) pour iOS et les autres nœuds distants
title: Appairage géré par Gateway
x-i18n:
    generated_at: "2026-04-30T07:28:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c662b8f5c1bb44cfc306d42ae19ba1c8bc36e0d96130d730b322ee07e02cad8
    source_path: gateway/pairing.md
    workflow: 16
---

Dans l’association détenue par le Gateway, le **Gateway** est la source de vérité pour déterminer quels nœuds sont autorisés à rejoindre. Les interfaces utilisateur (application macOS, futurs clients) ne sont que des frontends qui approuvent ou rejettent les demandes en attente.

**Important :** les nœuds WS utilisent **l’association d’appareil** (rôle `node`) pendant `connect`. `node.pair.*` est un magasin d’association distinct et ne contrôle **pas** la négociation WS. Seuls les clients qui appellent explicitement `node.pair.*` utilisent ce flux.

## Concepts

- **Demande en attente** : un nœud a demandé à rejoindre ; une approbation est requise.
- **Nœud associé** : nœud approuvé avec un jeton d’authentification émis.
- **Transport** : le point de terminaison WS du Gateway transmet les demandes, mais ne décide pas de l’appartenance. (La prise en charge de l’ancien pont TCP a été supprimée.)

## Fonctionnement de l’association

1. Un nœud se connecte au WS du Gateway et demande l’association.
2. Le Gateway stocke une **demande en attente** et émet `node.pair.requested`.
3. Vous approuvez ou rejetez la demande (CLI ou interface utilisateur).
4. Lors de l’approbation, le Gateway émet un **nouveau jeton** (les jetons sont renouvelés lors d’une réassociation).
5. Le nœud se reconnecte à l’aide du jeton et est désormais « associé ».

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

`nodes status` affiche les nœuds associés/connectés et leurs capacités.

## Surface d’API (protocole du gateway)

Événements :

- `node.pair.requested` — émis lorsqu’une nouvelle demande en attente est créée.
- `node.pair.resolved` — émis lorsqu’une demande est approuvée/rejetée/expirée.

Méthodes :

- `node.pair.request` — créer ou réutiliser une demande en attente.
- `node.pair.list` — lister les nœuds en attente + associés (`operator.pairing`).
- `node.pair.approve` — approuver une demande en attente (émet un jeton).
- `node.pair.reject` — rejeter une demande en attente.
- `node.pair.remove` — supprimer une entrée obsolète de nœud associé.
- `node.pair.verify` — vérifier `{ nodeId, token }`.

Notes :

- `node.pair.request` est idempotent par nœud : les appels répétés renvoient la même demande en attente.
- Les demandes répétées pour le même nœud en attente actualisent également les métadonnées de nœud stockées ainsi que le dernier instantané de commandes déclarées autorisées pour la visibilité de l’opérateur.
- L’approbation génère **toujours** un nouveau jeton ; aucun jeton n’est jamais renvoyé par `node.pair.request`.
- Les demandes peuvent inclure `silent: true` comme indication pour les flux d’approbation automatique.
- `node.pair.approve` utilise les commandes déclarées de la demande en attente pour appliquer des portées d’approbation supplémentaires :
  - demande sans commande : `operator.pairing`
  - demande de commande non-exec : `operator.pairing` + `operator.write`
  - demande `system.run` / `system.run.prepare` / `system.which` :
    `operator.pairing` + `operator.admin`

<Warning>
L’association de nœud est un flux de confiance et d’identité, avec émission de jeton. Elle ne fixe **pas** la surface de commandes active du nœud par nœud.

- Les commandes actives du nœud proviennent de ce que le nœud déclare à la connexion après application de la politique globale de commandes de nœud du gateway (`gateway.nodes.allowCommands` et `denyCommands`).
- La politique d’autorisation et de demande par nœud pour `system.run` réside sur le nœud dans `exec.approvals.node.*`, et non dans l’enregistrement d’association.

</Warning>

## Contrôle des commandes de Node (2026.3.31+)

<Warning>
**Changement incompatible :** à partir de `2026.3.31`, les commandes de nœud sont désactivées jusqu’à l’approbation de l’association de nœud. L’association d’appareil seule ne suffit plus à exposer les commandes de nœud déclarées.
</Warning>

Lorsqu’un nœud se connecte pour la première fois, l’association est demandée automatiquement. Tant que la demande d’association n’est pas approuvée, toutes les commandes de nœud en attente provenant de ce nœud sont filtrées et ne s’exécuteront pas. Une fois la confiance établie via l’approbation de l’association, les commandes déclarées du nœud deviennent disponibles sous réserve de la politique de commandes normale.

Cela signifie que :

- Les nœuds qui s’appuyaient auparavant uniquement sur l’association d’appareil pour exposer des commandes doivent désormais terminer l’association de nœud.
- Les commandes mises en file avant l’approbation de l’association sont supprimées, et non différées.

## Limites de confiance des événements de nœud (2026.3.31+)

<Warning>
**Changement incompatible :** les exécutions provenant de nœuds restent désormais sur une surface de confiance réduite.
</Warning>

Les résumés provenant de nœuds et les événements de session associés sont limités à la surface de confiance prévue. Les flux déclenchés par notification ou par nœud qui s’appuyaient auparavant sur un accès plus large aux outils de l’hôte ou de session peuvent nécessiter des ajustements. Ce renforcement garantit que les événements de nœud ne peuvent pas s’élever vers un accès aux outils de niveau hôte au-delà de ce que permet la limite de confiance du nœud.

Les mises à jour durables de présence de nœud suivent la même limite d’identité. L’événement `node.presence.alive` est accepté uniquement depuis des sessions d’appareil de nœud authentifiées et met à jour les métadonnées d’association uniquement lorsque l’identité appareil/nœud est déjà associée. Les valeurs `client.id` autodéclarées ne suffisent pas à écrire l’état de dernière activité.

## Approbation automatique (application macOS)

L’application macOS peut éventuellement tenter une **approbation silencieuse** lorsque :

- la demande est marquée `silent`, et
- l’application peut vérifier une connexion SSH à l’hôte du gateway avec le même utilisateur.

Si l’approbation silencieuse échoue, elle revient à l’invite normale « Approuver/Rejeter ».

## Approbation automatique des appareils CIDR de confiance

L’association d’appareil WS pour `role: node` reste manuelle par défaut. Pour les réseaux de nœuds privés où le Gateway fait déjà confiance au chemin réseau, les opérateurs peuvent l’activer explicitement avec des CIDR ou des IP exactes :

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
- Seule une nouvelle association d’appareil `role: node` sans portées demandées est éligible.
- Les clients opérateur, navigateur, Control UI et WebChat restent manuels.
- Les mises à niveau de rôle, portée, métadonnées et clé publique restent manuelles.
- Les chemins d’en-tête de proxy de confiance en local loopback sur le même hôte ne sont pas éligibles, car ce chemin peut être usurpé par des appelants locaux.

## Approbation automatique des mises à niveau de métadonnées

Lorsqu’un appareil déjà associé se reconnecte avec uniquement des changements de métadonnées non sensibles (par exemple, un nom d’affichage ou des indications de plateforme cliente), OpenClaw traite cela comme un `metadata-upgrade`. L’approbation automatique silencieuse est étroite : elle s’applique uniquement aux reconnexions locales de confiance non-navigateur qui ont déjà prouvé la possession d’identifiants locaux ou partagés, y compris les reconnexions d’applications natives sur le même hôte après des changements de métadonnées de version d’OS. Les clients navigateur/Control UI et les clients distants utilisent toujours le flux de réapprobation explicite. Les mises à niveau de portée (lecture vers écriture/admin) et les changements de clé publique ne sont **pas** éligibles à l’approbation automatique de metadata-upgrade — ils restent des demandes de réapprobation explicites.

## Assistants d’association par QR

`/pair qr` rend la charge utile d’association sous forme de média structuré afin que les clients mobiles et navigateur puissent la scanner directement.

La suppression d’un appareil nettoie également toute demande d’association en attente obsolète pour cet identifiant d’appareil, afin que `nodes pending` n’affiche pas de lignes orphelines après une révocation.

## Localité et en-têtes transférés

L’association du Gateway considère une connexion comme local loopback uniquement lorsque le socket brut et toutes les preuves de proxy amont concordent. Si une demande arrive sur local loopback mais contient des en-têtes `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` qui pointent vers une origine non locale, ces preuves d’en-têtes transférés invalident l’allégation de localité loopback. Le chemin d’association exige alors une approbation explicite au lieu de traiter silencieusement la demande comme une connexion sur le même hôte. Consultez [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth) pour la règle équivalente sur l’authentification opérateur.

## Stockage (local, privé)

L’état d’association est stocké sous le répertoire d’état du Gateway (par défaut `~/.openclaw`) :

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Si vous remplacez `OPENCLAW_STATE_DIR`, le dossier `nodes/` se déplace avec lui.

Notes de sécurité :

- Les jetons sont des secrets ; traitez `paired.json` comme sensible.
- La rotation d’un jeton nécessite une réapprobation (ou la suppression de l’entrée de nœud).

## Comportement du transport

- Le transport est **sans état** ; il ne stocke pas l’appartenance.
- Si le Gateway est hors ligne ou si l’association est désactivée, les nœuds ne peuvent pas s’associer.
- Si le Gateway est en mode distant, l’association s’effectue toujours avec le magasin du Gateway distant.

## Connexe

- [Association de canal](/fr/channels/pairing)
- [Nœuds](/fr/nodes)
- [CLI des appareils](/fr/cli/devices)
