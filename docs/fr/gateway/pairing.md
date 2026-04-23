---
read_when:
    - Implémentation des approbations de pairing de Node sans interface macOS
    - Ajout de flux CLI pour approuver les Nodes distants
    - Extension du protocole Gateway avec la gestion des Nodes
summary: Pairing de Node géré par le Gateway (Option B) pour iOS et autres Nodes distants
title: Pairing géré par le Gateway
x-i18n:
    generated_at: "2026-04-23T07:03:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: adba3c833b57b1df117c57d3451598e3c84cd78dcc6e9811547cdbb101afda0b
    source_path: gateway/pairing.md
    workflow: 15
---

# Pairing géré par le Gateway (Option B)

Dans le pairing géré par le Gateway, le **Gateway** est la source de vérité pour savoir quels Nodes
sont autorisés à rejoindre. Les interfaces utilisateur (application macOS, futurs clients) ne sont que des frontends qui
approuvent ou rejettent les requêtes en attente.

**Important :** les Nodes WS utilisent le **pairing d’appareil** (rôle `node`) pendant `connect`.
`node.pair.*` est un magasin de pairing distinct et ne contrôle **pas** le handshake WS.
Seuls les clients qui appellent explicitement `node.pair.*` utilisent ce flux.

## Concepts

- **Requête en attente** : un Node a demandé à rejoindre ; nécessite une approbation.
- **Node appairé** : Node approuvé avec un token d’authentification émis.
- **Transport** : le point de terminaison WS du Gateway transmet les requêtes mais ne décide pas
  de l’appartenance. (La prise en charge historique du pont TCP a été supprimée.)

## Fonctionnement du pairing

1. Un Node se connecte au Gateway WS et demande un pairing.
2. Le Gateway stocke une **requête en attente** et émet `node.pair.requested`.
3. Vous approuvez ou rejetez la requête (CLI ou UI).
4. Lors de l’approbation, le Gateway émet un **nouveau token** (les tokens sont renouvelés lors d’un nouveau pairing).
5. Le Node se reconnecte en utilisant le token et est maintenant « appairé ».

Les requêtes en attente expirent automatiquement après **5 minutes**.

## Flux CLI (compatible sans interface)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` affiche les Nodes appairés/connectés et leurs capacités.

## Surface API (protocole Gateway)

Événements :

- `node.pair.requested` — émis lorsqu’une nouvelle requête en attente est créée.
- `node.pair.resolved` — émis lorsqu’une requête est approuvée/rejetée/expirée.

Méthodes :

- `node.pair.request` — crée ou réutilise une requête en attente.
- `node.pair.list` — liste les Nodes en attente + appairés (`operator.pairing`).
- `node.pair.approve` — approuve une requête en attente (émet un token).
- `node.pair.reject` — rejette une requête en attente.
- `node.pair.verify` — vérifie `{ nodeId, token }`.

Remarques :

- `node.pair.request` est idempotent par Node : les appels répétés renvoient la même
  requête en attente.
- Les requêtes répétées pour le même Node en attente actualisent aussi les métadonnées
  stockées du Node ainsi que le dernier instantané déclaré et autorisé des commandes pour la visibilité opérateur.
- L’approbation génère **toujours** un nouveau token ; aucun token n’est jamais renvoyé depuis
  `node.pair.request`.
- Les requêtes peuvent inclure `silent: true` comme indication pour les flux d’approbation automatique.
- `node.pair.approve` utilise les commandes déclarées de la requête en attente pour appliquer
  des scopes d’approbation supplémentaires :
  - requête sans commande : `operator.pairing`
  - requête avec commande non exec : `operator.pairing` + `operator.write`
  - requête `system.run` / `system.run.prepare` / `system.which` :
    `operator.pairing` + `operator.admin`

Important :

- Le pairing de Node est un flux de confiance/identité plus émission de token.
- Il ne verrouille **pas** la surface de commandes active du Node par Node.
- Les commandes actives du Node proviennent de ce que le Node déclare à la connexion après application
  de la politique globale de commandes des Nodes du Gateway (`gateway.nodes.allowCommands` /
  `denyCommands`).
- La politique allow/ask `system.run` par Node réside sur le Node dans
  `exec.approvals.node.*`, pas dans l’enregistrement de pairing.

## Filtrage des commandes de Node (2026.3.31+)

<Warning>
**Changement cassant :** à partir de `2026.3.31`, les commandes de Node sont désactivées tant que le pairing du Node n’est pas approuvé. Le pairing d’appareil seul ne suffit plus pour exposer les commandes de Node déclarées.
</Warning>

Lorsqu’un Node se connecte pour la première fois, le pairing est demandé automatiquement. Tant que la requête de pairing n’est pas approuvée, toutes les commandes de Node en attente de ce Node sont filtrées et ne seront pas exécutées. Une fois la confiance établie par l’approbation du pairing, les commandes déclarées du Node deviennent disponibles sous réserve de la politique normale de commandes.

Cela signifie :

- Les Nodes qui dépendaient auparavant uniquement du pairing d’appareil pour exposer des commandes doivent désormais terminer le pairing de Node.
- Les commandes mises en file d’attente avant l’approbation du pairing sont supprimées, pas différées.

## Limites de confiance des événements de Node (2026.3.31+)

<Warning>
**Changement cassant :** les exécutions d’origine Node restent maintenant sur une surface de confiance réduite.
</Warning>

Les résumés d’origine Node et les événements de session associés sont limités à la surface de confiance prévue. Les flux pilotés par notifications ou déclenchés par un Node qui dépendaient auparavant d’un accès plus large aux outils d’hôte ou de session peuvent nécessiter des ajustements. Ce durcissement garantit que les événements de Node ne peuvent pas s’élever vers un accès aux outils au niveau de l’hôte au-delà de ce que permet la limite de confiance du Node.

## Approbation automatique (application macOS)

L’application macOS peut éventuellement tenter une **approbation silencieuse** lorsque :

- la requête est marquée `silent`, et
- l’application peut vérifier une connexion SSH à l’hôte Gateway avec le même utilisateur.

Si l’approbation silencieuse échoue, elle revient à l’invite normale « Approuver/Rejeter ».

## Approbation automatique de mise à niveau des métadonnées

Lorsqu’un appareil déjà appairé se reconnecte avec seulement des modifications de métadonnées non sensibles
(par exemple, nom d’affichage ou indications de plateforme client), OpenClaw traite
cela comme une `metadata-upgrade`. L’approbation automatique silencieuse est étroite : elle s’applique uniquement
aux reconnexions de CLI/helpers locaux de confiance qui ont déjà prouvé la possession du
token partagé ou du mot de passe via le loopback. Les clients navigateur/Control UI et les
clients distants utilisent toujours le flux de réapprobation explicite. Les mises à niveau de scope
(de read à write/admin) et les changements de clé publique ne sont **pas** éligibles à
l’approbation automatique de `metadata-upgrade` — ils restent des requêtes de réapprobation explicites.

## Helpers de pairing QR

`/pair qr` affiche la charge utile de pairing comme média structuré afin que les clients mobiles et
navigateurs puissent la scanner directement. La suppression d’appareil nettoie désormais aussi les
anciennes requêtes de pairing en attente pour le même ID d’appareil, de sorte que `nodes pending` n’affiche
plus de lignes orphelines après une révocation.

## Localité et en-têtes transférés

Le pairing Gateway traite une connexion comme loopback uniquement lorsque le socket brut
et tout élément de preuve du proxy amont concordent. Si une requête arrive sur loopback mais
transporte des en-têtes `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` qui
pointent vers une origine non locale, cette preuve d’en-têtes transférés invalide
la revendication de localité loopback. Le chemin de pairing exige alors une approbation explicite
au lieu de traiter silencieusement la requête comme une connexion du même hôte. Voir
[Trusted Proxy Auth](/fr/gateway/trusted-proxy-auth) pour la règle équivalente sur
l’authentification opérateur.

## Stockage (local, privé)

L’état du pairing est stocké sous le répertoire d’état du Gateway (par défaut `~/.openclaw`) :

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Si vous surchargez `OPENCLAW_STATE_DIR`, le dossier `nodes/` est déplacé avec lui.

Remarques de sécurité :

- Les tokens sont des secrets ; traitez `paired.json` comme sensible.
- La rotation d’un token nécessite une nouvelle approbation (ou la suppression de l’entrée du Node).

## Comportement du transport

- Le transport est **sans état** ; il ne stocke pas l’appartenance.
- Si le Gateway est hors ligne ou si le pairing est désactivé, les Nodes ne peuvent pas s’appairer.
- Si le Gateway est en mode distant, le pairing s’effectue quand même par rapport au magasin du Gateway distant.
