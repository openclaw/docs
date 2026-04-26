---
read_when:
    - Mettre en œuvre les approbations d’appairage de Node sans interface macOS
    - Ajouter des flux CLI pour approuver des Node distants
    - Étendre le protocole Gateway avec la gestion des Node
summary: Appairage de Node géré par la Gateway (option B) pour iOS et autres Node distants
title: Appairage géré par la Gateway
x-i18n:
    generated_at: "2026-04-26T11:29:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 436391f7576b7285733eb4a8283b73d7b4c52f22b227dd915c09313cfec776bd
    source_path: gateway/pairing.md
    workflow: 15
---

Dans l’appairage géré par la Gateway, la **Gateway** est la source de vérité pour déterminer quels Node
sont autorisés à rejoindre. Les UI (app macOS, futurs clients) ne sont que des frontends qui
approuvent ou rejettent les demandes en attente.

**Important :** les Node WS utilisent l’**appairage d’appareil** (rôle `node`) lors de `connect`.
`node.pair.*` est un magasin d’appairage distinct et ne contrôle **pas** la poignée de main WS.
Seuls les clients qui appellent explicitement `node.pair.*` utilisent ce flux.

## Concepts

- **Demande en attente** : un Node a demandé à rejoindre ; nécessite une approbation.
- **Node appairé** : Node approuvé avec un token d’authentification émis.
- **Transport** : le point de terminaison WS de la Gateway transmet les requêtes mais ne décide
  pas de l’appartenance. (La prise en charge de l’ancien pont TCP a été supprimée.)

## Fonctionnement de l’appairage

1. Un Node se connecte à la Gateway WS et demande l’appairage.
2. La Gateway stocke une **demande en attente** et émet `node.pair.requested`.
3. Vous approuvez ou rejetez la demande (CLI ou UI).
4. Lors de l’approbation, la Gateway émet un **nouveau token** (les tokens sont rotés lors du réappairage).
5. Le Node se reconnecte en utilisant le token et est maintenant « appairé ».

Les demandes en attente expirent automatiquement après **5 minutes**.

## Flux CLI (adapté au headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` affiche les Node appairés/connectés et leurs capacités.

## Surface API (protocole Gateway)

Événements :

- `node.pair.requested` — émis lorsqu’une nouvelle demande en attente est créée.
- `node.pair.resolved` — émis lorsqu’une demande est approuvée/rejetée/expirée.

Méthodes :

- `node.pair.request` — créer ou réutiliser une demande en attente.
- `node.pair.list` — lister les Node en attente + appairés (`operator.pairing`).
- `node.pair.approve` — approuver une demande en attente (émet un token).
- `node.pair.reject` — rejeter une demande en attente.
- `node.pair.verify` — vérifier `{ nodeId, token }`.

Notes :

- `node.pair.request` est idempotente par Node : les appels répétés renvoient la même
  demande en attente.
- Les demandes répétées pour le même Node en attente rafraîchissent aussi les métadonnées du Node
  stockées ainsi que le dernier instantané de commandes déclarées autorisées pour la visibilité opérateur.
- L’approbation génère **toujours** un nouveau token ; aucun token n’est jamais renvoyé par
  `node.pair.request`.
- Les demandes peuvent inclure `silent: true` comme indice pour les flux d’approbation automatique.
- `node.pair.approve` utilise les commandes déclarées de la demande en attente pour appliquer
  des portées d’approbation supplémentaires :
  - demande sans commande : `operator.pairing`
  - demande de commande sans exec : `operator.pairing` + `operator.write`
  - demande `system.run` / `system.run.prepare` / `system.which` :
    `operator.pairing` + `operator.admin`

Important :

- L’appairage de Node est un flux de confiance/identité plus émission de token.
- Il n’épingle **pas** la surface de commandes du Node en direct par Node.
- Les commandes de Node en direct proviennent de ce que le Node déclare lors de `connect` après application de la politique globale de commandes de Node de la Gateway (`gateway.nodes.allowCommands` /
  `denyCommands`).
- La politique `system.run` par Node `allow/ask` vit sur le Node dans
  `exec.approvals.node.*`, pas dans l’enregistrement d’appairage.

## Filtrage des commandes Node (2026.3.31+)

<Warning>
**Changement incompatible :** à partir de `2026.3.31`, les commandes Node sont désactivées tant que l’appairage du Node n’est pas approuvé. L’appairage d’appareil seul ne suffit plus pour exposer les commandes Node déclarées.
</Warning>

Lorsqu’un Node se connecte pour la première fois, l’appairage est demandé automatiquement. Tant que la demande d’appairage n’est pas approuvée, toutes les commandes Node en attente provenant de ce Node sont filtrées et ne seront pas exécutées. Une fois la confiance établie via l’approbation d’appairage, les commandes déclarées du Node deviennent disponibles sous réserve de la politique de commandes normale.

Cela signifie :

- Les Node qui s’appuyaient auparavant uniquement sur l’appairage d’appareil pour exposer des commandes doivent maintenant terminer l’appairage du Node.
- Les commandes mises en file avant l’approbation de l’appairage sont supprimées, pas différées.

## Frontières de confiance des événements Node (2026.3.31+)

<Warning>
**Changement incompatible :** les exécutions d’origine Node restent désormais sur une surface de confiance réduite.
</Warning>

Les résumés d’origine Node et les événements de session associés sont limités à la surface de confiance prévue. Les flux déclenchés par notification ou par Node qui s’appuyaient auparavant sur un accès plus large aux outils hôte ou session peuvent nécessiter des ajustements. Ce durcissement garantit que les événements Node ne peuvent pas s’élever vers un accès aux outils au niveau hôte au-delà de ce que permet la frontière de confiance du Node.

## Approbation automatique (app macOS)

L’app macOS peut tenter facultativement une **approbation silencieuse** lorsque :

- la demande est marquée `silent`, et
- l’app peut vérifier une connexion SSH à l’hôte Gateway avec le même utilisateur.

Si l’approbation silencieuse échoue, elle revient à l’invite normale « Approuver/Rejeter ».

## Approbation automatique des appareils en CIDR de confiance

L’appairage d’appareil WS pour `role: node` reste manuel par défaut. Pour les réseaux privés
de Node où la Gateway fait déjà confiance au chemin réseau, les opérateurs peuvent
activer explicitement des CIDR ou des IP exactes :

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

Frontière de sécurité :

- Désactivé lorsque `gateway.nodes.pairing.autoApproveCidrs` n’est pas défini.
- Il n’existe aucun mode d’approbation automatique général pour le LAN ou les réseaux privés.
- Seul l’appairage d’appareil `role: node` récent sans portées demandées est éligible.
- Les clients opérateur, navigateur, Control UI et WebChat restent manuels.
- Les mises à niveau de rôle, de portée, de métadonnées et de clé publique restent manuelles.
- Les chemins d’en-tête trusted-proxy loopback du même hôte ne sont pas éligibles car
  ce chemin peut être usurpé par des appelants locaux.

## Approbation automatique des mises à niveau de métadonnées

Lorsqu’un appareil déjà appairé se reconnecte avec seulement des changements de métadonnées
non sensibles (par exemple nom d’affichage ou indices de plateforme cliente), OpenClaw traite
cela comme une `metadata-upgrade`. L’approbation automatique silencieuse est limitée : elle ne s’applique qu’aux reconnexions locales de confiance non navigateur qui ont déjà prouvé la possession d’identifiants locaux
ou partagés, y compris les reconnexions d’app native du même hôte après des changements de métadonnées de version d’OS. Les clients navigateur/Control UI et les clients distants utilisent toujours le flux de réapprobation explicite. Les mises à niveau de portée (de lecture à écriture/admin) et les changements de clé publique ne sont **pas** éligibles à l’approbation automatique des mises à niveau de métadonnées —
ils restent des demandes de réapprobation explicites.

## Aides à l’appairage par QR

`/pair qr` rend le payload d’appairage sous forme de média structuré afin que les clients mobiles et
navigateur puissent le scanner directement.

La suppression d’un appareil balaie aussi toute demande d’appairage en attente obsolète pour cet
id d’appareil, afin que `nodes pending` n’affiche pas de lignes orphelines après une révocation.

## Localité et en-têtes transférés

L’appairage Gateway ne traite une connexion comme loopback que lorsque le socket brut
et toute preuve de proxy amont concordent. Si une requête arrive sur loopback mais
porte des en-têtes `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` pointant
vers une origine non locale, cette preuve d’en-tête transféré invalide la revendication
de localité loopback. Le chemin d’appairage exige alors une approbation explicite au lieu
de traiter silencieusement la requête comme une connexion du même hôte. Voir
[Authentification Trusted Proxy](/fr/gateway/trusted-proxy-auth) pour la règle équivalente sur
l’authentification opérateur.

## Stockage (local, privé)

L’état d’appairage est stocké sous le répertoire d’état de la Gateway (par défaut `~/.openclaw`) :

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Si vous remplacez `OPENCLAW_STATE_DIR`, le dossier `nodes/` se déplace avec lui.

Notes de sécurité :

- Les tokens sont des secrets ; traitez `paired.json` comme sensible.
- La rotation d’un token nécessite une nouvelle approbation (ou la suppression de l’entrée du Node).

## Comportement du transport

- Le transport est **sans état** ; il ne stocke pas l’appartenance.
- Si la Gateway est hors ligne ou si l’appairage est désactivé, les Node ne peuvent pas s’appairer.
- Si la Gateway est en mode distant, l’appairage se fait quand même sur le magasin de la Gateway distante.

## Associé

- [Appairage de canal](/fr/channels/pairing)
- [Node](/fr/nodes)
- [CLI des appareils](/fr/cli/devices)
