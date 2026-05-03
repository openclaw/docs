---
read_when:
    - Mise en œuvre des approbations d’appairage de nœuds sans interface utilisateur macOS
    - Ajout de flux CLI pour approuver les nœuds distants
    - Extension du protocole Gateway pour la gestion des Node
summary: Appairage de Nodes géré par le Gateway (option B) pour iOS et les autres Nodes distants
title: Appairage géré par Gateway
x-i18n:
    generated_at: "2026-05-03T07:09:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0ce46d487990860ac572c27cc9dd83839e87329132e2624944660bafaf723de
    source_path: gateway/pairing.md
    workflow: 16
---

Dans l’appairage détenu par le Gateway, le **Gateway** est la source de vérité pour déterminer quels nœuds
sont autorisés à rejoindre. Les interfaces utilisateur (application macOS, futurs clients) ne sont que des frontends qui
approuvent ou rejettent les demandes en attente.

**Important :** les nœuds WS utilisent l’**appairage d’appareil** (rôle `node`) pendant `connect`.
`node.pair.*` est un magasin d’appairage distinct et ne contrôle **pas** la poignée de main WS.
Seuls les clients qui appellent explicitement `node.pair.*` utilisent ce flux.

## Concepts

- **Demande en attente** : un nœud a demandé à rejoindre ; une approbation est requise.
- **Nœud appairé** : nœud approuvé avec un jeton d’authentification émis.
- **Transport** : le point de terminaison WS du Gateway transmet les demandes mais ne décide pas
  de l’appartenance. (La prise en charge de l’ancien pont TCP a été supprimée.)

## Fonctionnement de l’appairage

1. Un nœud se connecte au WS du Gateway et demande l’appairage.
2. Le Gateway stocke une **demande en attente** et émet `node.pair.requested`.
3. Vous approuvez ou rejetez la demande (CLI ou interface utilisateur).
4. À l’approbation, le Gateway émet un **nouveau jeton** (les jetons sont renouvelés lors d’un réappairage).
5. Le nœud se reconnecte avec le jeton et est maintenant « appairé ».

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

`nodes status` affiche les nœuds appairés/connectés et leurs capacités.

## Surface API (protocole Gateway)

Événements :

- `node.pair.requested` — émis lorsqu’une nouvelle demande en attente est créée.
- `node.pair.resolved` — émis lorsqu’une demande est approuvée/rejetée/expirée.

Méthodes :

- `node.pair.request` — créer ou réutiliser une demande en attente.
- `node.pair.list` — lister les nœuds en attente + appairés (`operator.pairing`).
- `node.pair.approve` — approuver une demande en attente (émet un jeton).
- `node.pair.reject` — rejeter une demande en attente.
- `node.pair.remove` — supprimer une entrée de nœud appairé obsolète.
- `node.pair.verify` — vérifier `{ nodeId, token }`.

Notes :

- `node.pair.request` est idempotent par nœud : les appels répétés renvoient la même
  demande en attente.
- Les demandes répétées pour le même nœud en attente actualisent aussi les métadonnées stockées du nœud
  ainsi que le dernier instantané autorisé des commandes déclarées, pour la visibilité de l’opérateur.
- L’approbation génère **toujours** un jeton neuf ; aucun jeton n’est jamais renvoyé par
  `node.pair.request`.
- Les niveaux de portée opérateur et les vérifications au moment de l’approbation sont résumés dans
  [Portées opérateur](/fr/gateway/operator-scopes).
- Les demandes peuvent inclure `silent: true` comme indication pour les flux d’approbation automatique.
- `node.pair.approve` utilise les commandes déclarées de la demande en attente pour appliquer
  des portées d’approbation supplémentaires :
  - demande sans commande : `operator.pairing`
  - demande de commande non exec : `operator.pairing` + `operator.write`
  - demande `system.run` / `system.run.prepare` / `system.which` :
    `operator.pairing` + `operator.admin`

<Warning>
L’appairage Node est un flux de confiance et d’identité, avec émission de jeton. Il ne fige **pas** la surface de commandes Node active par nœud.

- Les commandes Node actives proviennent de ce que le nœud déclare à la connexion après application de la politique globale de commandes Node du Gateway (`gateway.nodes.allowCommands` et `denyCommands`).
- La politique d’autorisation et de demande par nœud pour `system.run` réside sur le nœud dans `exec.approvals.node.*`, pas dans l’enregistrement d’appairage.

</Warning>

## Contrôle des commandes Node (2026.3.31+)

<Warning>
**Changement incompatible :** à partir de `2026.3.31`, les commandes Node sont désactivées jusqu’à ce que l’appairage Node soit approuvé. L’appairage d’appareil seul ne suffit plus à exposer les commandes Node déclarées.
</Warning>

Lorsqu’un nœud se connecte pour la première fois, l’appairage est demandé automatiquement. Tant que la demande d’appairage n’est pas approuvée, toutes les commandes Node en attente provenant de ce nœud sont filtrées et ne seront pas exécutées. Une fois la confiance établie par l’approbation de l’appairage, les commandes déclarées par le nœud deviennent disponibles sous réserve de la politique de commandes normale.

Cela signifie :

- Les nœuds qui s’appuyaient auparavant uniquement sur l’appairage d’appareil pour exposer des commandes doivent maintenant terminer l’appairage Node.
- Les commandes mises en file d’attente avant l’approbation de l’appairage sont abandonnées, pas différées.

## Limites de confiance des événements Node (2026.3.31+)

<Warning>
**Changement incompatible :** les exécutions issues de Node restent maintenant sur une surface de confiance réduite.
</Warning>

Les résumés issus de Node et les événements de session associés sont limités à la surface de confiance prévue. Les flux déclenchés par notification ou par un nœud qui s’appuyaient auparavant sur un accès plus large aux outils de l’hôte ou de la session peuvent nécessiter un ajustement. Ce durcissement garantit que les événements Node ne peuvent pas s’élever vers un accès aux outils de niveau hôte au-delà de ce que permet la limite de confiance du nœud.

Les mises à jour durables de présence Node suivent la même limite d’identité. L’événement `node.presence.alive` est
accepté uniquement depuis des sessions d’appareil Node authentifiées et met à jour les métadonnées d’appairage seulement lorsque
l’identité appareil/nœud est déjà appairée. Les valeurs `client.id` autodéclarées ne suffisent pas à écrire
l’état de dernière activité.

## Approbation automatique (application macOS)

L’application macOS peut éventuellement tenter une **approbation silencieuse** lorsque :

- la demande est marquée `silent`, et
- l’application peut vérifier une connexion SSH à l’hôte du Gateway avec le même utilisateur.

Si l’approbation silencieuse échoue, elle revient à l’invite normale « Approuver/Rejeter ».

## Approbation automatique d’appareil par CIDR de confiance

L’appairage d’appareil WS pour `role: node` reste manuel par défaut. Pour les réseaux de
nœuds privés où le Gateway fait déjà confiance au chemin réseau, les opérateurs peuvent
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
- Il n’existe aucun mode d’approbation automatique globale pour le LAN ou le réseau privé.
- Seul un nouvel appairage d’appareil `role: node` sans portées demandées est éligible.
- Les clients opérateur, navigateur, Control UI et WebChat restent manuels.
- Les mises à niveau de rôle, de portée, de métadonnées et de clé publique restent manuelles.
- Les chemins d’en-tête de proxy de confiance en local loopback sur le même hôte ne sont pas éligibles, car ce
  chemin peut être usurpé par des appelants locaux.

## Approbation automatique de mise à niveau des métadonnées

Lorsqu’un appareil déjà appairé se reconnecte avec seulement des changements de métadonnées
non sensibles (par exemple, nom d’affichage ou indications de plateforme cliente), OpenClaw traite
cela comme une `metadata-upgrade`. L’approbation automatique silencieuse est étroite : elle s’applique uniquement
aux reconnexions locales de confiance non navigateur qui ont déjà prouvé la possession d’identifiants locaux
ou partagés, y compris les reconnexions d’applications natives sur le même hôte après des changements de métadonnées de
version d’OS. Les clients navigateur/Control UI et les clients distants utilisent toujours
le flux de réapprobation explicite. Les mises à niveau de portée (lecture vers écriture/admin) et
les changements de clé publique ne sont **pas** éligibles à l’approbation automatique de mise à niveau des métadonnées —
ils restent des demandes de réapprobation explicites.

## Assistants d’appairage par QR

`/pair qr` rend la charge utile d’appairage sous forme de média structuré afin que les clients mobiles et
navigateur puissent la scanner directement.

La suppression d’un appareil balaie aussi toutes les demandes d’appairage en attente obsolètes pour cet
identifiant d’appareil, afin que `nodes pending` n’affiche pas de lignes orphelines après une révocation.

## Localité et en-têtes transférés

L’appairage Gateway considère une connexion comme loopback uniquement lorsque le socket brut
et toute preuve de proxy amont concordent. Si une demande arrive sur loopback mais
transporte des en-têtes `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`
qui indiquent une origine non locale, cette preuve d’en-tête transféré invalide
la revendication de localité loopback. Le chemin d’appairage exige alors une approbation explicite
au lieu de traiter silencieusement la demande comme une connexion sur le même hôte. Consultez
[Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth) pour la règle équivalente sur
l’authentification opérateur.

## Stockage (local, privé)

L’état d’appairage est stocké dans le répertoire d’état du Gateway (par défaut `~/.openclaw`) :

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Si vous remplacez `OPENCLAW_STATE_DIR`, le dossier `nodes/` est déplacé avec lui.

Notes de sécurité :

- Les jetons sont des secrets ; traitez `paired.json` comme sensible.
- Le renouvellement d’un jeton nécessite une réapprobation (ou la suppression de l’entrée du nœud).

## Comportement du transport

- Le transport est **sans état** ; il ne stocke pas l’appartenance.
- Si le Gateway est hors ligne ou si l’appairage est désactivé, les nœuds ne peuvent pas s’appairer.
- Si le Gateway est en mode distant, l’appairage se fait tout de même avec le magasin du Gateway distant.

## Liens associés

- [Appairage de canal](/fr/channels/pairing)
- [Nœuds](/fr/nodes)
- [CLI des appareils](/fr/cli/devices)
