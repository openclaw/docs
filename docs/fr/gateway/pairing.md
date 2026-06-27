---
read_when:
    - Implémenter les approbations d’association de nœuds sans interface macOS
    - Ajout de flux CLI pour approuver les nœuds distants
    - Extension du protocole Gateway avec la gestion des nœuds
summary: Appairage de nœud détenu par le Gateway (option B) pour iOS et les autres nœuds distants
title: Appairage géré par Gateway
x-i18n:
    generated_at: "2026-06-27T17:32:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aefddafaef419fc59b04ee17dae8ef21685b4f514f4286530bf07362663a8996
    source_path: gateway/pairing.md
    workflow: 16
---

Dans l’appairage détenu par le Gateway, le **Gateway** est la source de vérité pour les nœuds
autorisés à rejoindre. Les interfaces utilisateur (application macOS, futurs clients) ne sont que des frontends qui
approuvent ou rejettent les demandes en attente.

**Important :** les nœuds WS utilisent l’**appairage d’appareil** (rôle `node`) pendant `connect`.
`node.pair.*` est un magasin d’appairage distinct et ne contrôle **pas** la négociation WS.
Seuls les clients qui appellent explicitement `node.pair.*` utilisent ce flux.

## Concepts

- **Demande en attente** : un nœud a demandé à rejoindre ; une approbation est requise.
- **Nœud appairé** : nœud approuvé avec un jeton d’authentification émis.
- **Transport** : le point de terminaison WS du Gateway transmet les demandes, mais ne décide pas
  de l’appartenance. (La prise en charge de l’ancien pont TCP a été supprimée.)

## Fonctionnement de l’appairage

1. Un nœud se connecte au WS du Gateway et demande l’appairage.
2. Le Gateway stocke une **demande en attente** et émet `node.pair.requested`.
3. Vous approuvez ou rejetez la demande (CLI ou interface utilisateur).
4. En cas d’approbation, le Gateway émet un **nouveau jeton** (les jetons sont renouvelés lors d’un réappairage).
5. Le nœud se reconnecte avec le jeton et est désormais « appairé ».

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

## Surface d’API (protocole Gateway)

Événements :

- `node.pair.requested` - émis lorsqu’une nouvelle demande en attente est créée.
- `node.pair.resolved` - émis lorsqu’une demande est approuvée/rejetée/expirée.

Méthodes :

- `node.pair.request` - créer ou réutiliser une demande en attente.
- `node.pair.list` - lister les nœuds en attente et appairés (`operator.pairing`).
- `node.pair.approve` - approuver une demande en attente (émet un jeton).
- `node.pair.reject` - rejeter une demande en attente.
- `node.pair.remove` - supprimer un nœud appairé. Pour les appairages adossés à un appareil, cela
  révoque le rôle `node` de l’appareil : cette opération modifie `devices/paired.json` et
  invalide/déconnecte les sessions de rôle nœud de cet appareil. Un appareil à **rôles mixtes**
  (par exemple, qui possède aussi `operator`) conserve sa ligne et perd seulement le rôle `node` ;
  une ligne d’appareil uniquement nœud est supprimée. Cela supprime aussi toute entrée d’appairage de nœud héritée
  correspondante détenue par le Gateway. Autorisation : `operator.pairing` peut supprimer
  les lignes de nœud non opérateur ; un appelant avec jeton d’appareil qui révoque son **propre** rôle nœud sur
  un appareil à rôles mixtes a en plus besoin de `operator.admin`.
- `node.pair.verify` - vérifier `{ nodeId, token }`.

Remarques :

- `node.pair.request` est idempotent par nœud : les appels répétés renvoient la même
  demande en attente.
- Les demandes répétées pour le même nœud en attente actualisent aussi les métadonnées de nœud
  stockées et le dernier instantané des commandes déclarées en liste d’autorisation pour la visibilité de l’opérateur.
- L’approbation génère **toujours** un nouveau jeton ; aucun jeton n’est jamais renvoyé par
  `node.pair.request`.
- Les niveaux de portée opérateur et les vérifications au moment de l’approbation sont résumés dans
  [Portées opérateur](/fr/gateway/operator-scopes).
- Les demandes peuvent inclure `silent: true` comme indication pour les flux d’approbation automatique.
- `node.pair.approve` utilise les commandes déclarées de la demande en attente pour appliquer
  des portées d’approbation supplémentaires :
  - demande sans commande : `operator.pairing`
  - demande de commande non-exec : `operator.pairing` + `operator.write`
  - demande `system.run` / `system.run.prepare` / `system.which` :
    `operator.pairing` + `operator.admin`

<Warning>
L’appairage de nœud est un flux de confiance et d’identité, avec émission de jetons. Il ne fige **pas** la surface de commandes de nœud active par nœud.

- Les commandes de nœud actives proviennent de ce que le nœud déclare à la connexion, après application de la politique globale de commandes de nœud du Gateway (`gateway.nodes.allowCommands` et `denyCommands`).
- La politique d’autorisation et de demande par nœud pour `system.run` réside sur le nœud dans `exec.approvals.node.*`, pas dans l’enregistrement d’appairage.

</Warning>

## Contrôle des commandes de nœud (2026.3.31+)

<Warning>
**Changement incompatible :** à partir de `2026.3.31`, les commandes de nœud sont désactivées jusqu’à l’approbation de l’appairage de nœud. L’appairage d’appareil seul ne suffit plus à exposer les commandes de nœud déclarées.
</Warning>

Lorsqu’un nœud se connecte pour la première fois, l’appairage est demandé automatiquement. Tant que la demande d’appairage n’est pas approuvée, toutes les commandes de nœud en attente issues de ce nœud sont filtrées et ne s’exécutent pas. Une fois la confiance établie par l’approbation de l’appairage, les commandes déclarées du nœud deviennent disponibles, sous réserve de la politique de commandes normale.

Cela signifie :

- Les nœuds qui s’appuyaient auparavant uniquement sur l’appairage d’appareil pour exposer des commandes doivent désormais terminer l’appairage de nœud.
- Les commandes mises en file avant l’approbation de l’appairage sont supprimées, et non différées.

## Frontières de confiance des événements de nœud (2026.3.31+)

<Warning>
**Changement incompatible :** les exécutions provenant d’un nœud restent désormais sur une surface de confiance réduite.
</Warning>

Les résumés provenant d’un nœud et les événements de session associés sont limités à la surface de confiance prévue. Les flux pilotés par notification ou déclenchés par un nœud qui s’appuyaient auparavant sur un accès plus large aux outils de l’hôte ou de la session peuvent nécessiter des ajustements. Ce durcissement garantit que les événements de nœud ne peuvent pas s’élever vers un accès aux outils au niveau hôte au-delà de ce que permet la frontière de confiance du nœud.

Les mises à jour durables de présence du nœud suivent la même frontière d’identité. L’événement `node.presence.alive` est
accepté uniquement depuis des sessions d’appareil de nœud authentifiées et met à jour les métadonnées d’appairage uniquement lorsque
l’identité appareil/nœud est déjà appairée. Les valeurs `client.id` autodéclarées ne suffisent pas pour écrire
l’état de dernière activité.

## Approbation automatique (application macOS)

L’application macOS peut éventuellement tenter une **approbation silencieuse** lorsque :

- la demande est marquée `silent`, et
- l’application peut vérifier une connexion SSH à l’hôte du Gateway avec le même utilisateur.

Si l’approbation silencieuse échoue, elle revient à l’invite normale « Approuver/Rejeter ».

## Approbation automatique d’appareil par CIDR de confiance

L’appairage d’appareil WS pour `role: node` reste manuel par défaut. Pour les réseaux de
nœuds privés où le Gateway fait déjà confiance au chemin réseau, les opérateurs peuvent
l’activer explicitement avec des CIDR ou des IP exactes :

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
- Il n’existe aucun mode d’approbation automatique global pour LAN ou réseau privé.
- Seul un nouvel appairage d’appareil `role: node` sans portées demandées est éligible.
- Les clients opérateur, navigateur, interface utilisateur de contrôle et WebChat restent manuels.
- Les mises à niveau de rôle, de portée, de métadonnées et de clé publique restent manuelles.
- Les chemins d’en-tête de proxy de confiance en loopback sur le même hôte ne sont pas éligibles, car ce
  chemin peut être usurpé par des appelants locaux.

## Approbation automatique des mises à niveau de métadonnées

Lorsqu’un appareil déjà appairé se reconnecte avec uniquement des changements de métadonnées
non sensibles (par exemple, nom d’affichage ou indications de plateforme client), OpenClaw traite
cela comme une `metadata-upgrade`. L’approbation automatique silencieuse est étroite : elle s’applique uniquement
aux reconnexions locales de confiance non navigateur qui ont déjà prouvé la possession d’identifiants locaux
ou partagés, y compris les reconnexions d’application native sur le même hôte après des changements de métadonnées de
version de système d’exploitation. Les clients navigateur/interface utilisateur de contrôle et les clients distants utilisent toujours
le flux explicite de réapprobation. Les mises à niveau de portée (lecture vers écriture/admin) et
les changements de clé publique ne sont **pas** éligibles à l’approbation automatique de mise à niveau de métadonnées -
ils restent des demandes explicites de réapprobation.

## Assistants d’appairage QR

`/pair qr` rend la charge utile d’appairage sous forme de média structuré afin que les clients mobiles et
navigateurs puissent la scanner directement.

La suppression d’un appareil nettoie aussi toutes les demandes d’appairage en attente obsolètes pour cet
identifiant d’appareil, de sorte que `nodes pending` n’affiche pas de lignes orphelines après une révocation.

## Localité et en-têtes transférés

L’appairage du Gateway traite une connexion comme du loopback uniquement lorsque la socket brute
et toute preuve de proxy en amont concordent. Si une demande arrive sur le loopback mais
porte des preuves d’en-têtes `Forwarded`, `X-Forwarded-*` ou `X-Real-IP`, ces
preuves d’en-têtes transférés disqualifient la revendication de localité loopback. Le chemin d’appairage
requiert alors une approbation explicite au lieu de traiter silencieusement la demande comme
une connexion du même hôte. Voir [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth) pour
la règle équivalente sur l’authentification opérateur.

## Stockage (local, privé)

L’état d’appairage est stocké sous le répertoire d’état du Gateway (par défaut `~/.openclaw`) :

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Si vous remplacez `OPENCLAW_STATE_DIR`, le dossier `nodes/` se déplace avec lui.

Remarques de sécurité :

- Les jetons sont des secrets ; traitez `paired.json` comme sensible.
- Le renouvellement d’un jeton nécessite une réapprobation (ou la suppression de l’entrée du nœud).

## Comportement du transport

- Le transport est **sans état** ; il ne stocke pas l’appartenance.
- Si le Gateway est hors ligne ou que l’appairage est désactivé, les nœuds ne peuvent pas s’appairer.
- Si le Gateway est en mode distant, l’appairage s’effectue toujours dans le magasin du Gateway distant.

## Connexe

- [Appairage de canal](/fr/channels/pairing)
- [Nœuds](/fr/nodes)
- [CLI des appareils](/fr/cli/devices)
