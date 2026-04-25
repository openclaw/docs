---
read_when:
    - Mettre en œuvre les approbations d’appairage de nœuds sans interface macOS
    - Ajouter des flux CLI pour approuver des nœuds distants
    - Étendre le protocole Gateway avec la gestion des nœuds
summary: Appairage des nœuds géré par la Gateway (option B) pour iOS et les autres nœuds distants
title: Appairage géré par la Gateway
x-i18n:
    generated_at: "2026-04-25T13:48:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b512fbf97e7557a1f467732f1b68d8c1b8183695e436b3f87b4c4aca1478cb5
    source_path: gateway/pairing.md
    workflow: 15
---

Dans l’appairage géré par la Gateway, la **Gateway** est la source de vérité concernant les nœuds
autorisés à rejoindre le réseau. Les interfaces (application macOS, futurs clients) ne sont que des frontends qui
approuvent ou rejettent les demandes en attente.

**Important :** les nœuds WS utilisent l’**appairage des appareils** (rôle `node`) lors de `connect`.
`node.pair.*` est un stockage d’appairage distinct et **ne** contrôle **pas** la poignée de main WS.
Seuls les clients qui appellent explicitement `node.pair.*` utilisent ce flux.

## Concepts

- **Demande en attente** : un nœud a demandé à rejoindre ; une approbation est requise.
- **Nœud appairé** : nœud approuvé avec un jeton d’authentification émis.
- **Transport** : le point de terminaison WS de la Gateway transfère les requêtes mais ne décide
  pas de l’appartenance. (La prise en charge héritée du pont TCP a été supprimée.)

## Fonctionnement de l’appairage

1. Un nœud se connecte à la Gateway WS et demande l’appairage.
2. La Gateway stocke une **demande en attente** et émet `node.pair.requested`.
3. Vous approuvez ou rejetez la demande (CLI ou interface).
4. Après approbation, la Gateway émet un **nouveau jeton** (les jetons sont renouvelés lors d’un réappairage).
5. Le nœud se reconnecte en utilisant ce jeton et est alors « appairé ».

Les demandes en attente expirent automatiquement après **5 minutes**.

## Flux CLI (adapté au mode headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
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
- `node.pair.verify` — vérifier `{ nodeId, token }`.

Remarques :

- `node.pair.request` est idempotent par nœud : les appels répétés renvoient la même
  demande en attente.
- Les demandes répétées pour le même nœud en attente actualisent également les métadonnées
  stockées du nœud ainsi que le dernier instantané déclaré de commandes autorisées pour la visibilité opérateur.
- L’approbation génère **toujours** un nouveau jeton ; aucun jeton n’est jamais renvoyé par
  `node.pair.request`.
- Les demandes peuvent inclure `silent: true` comme indication pour les flux d’approbation automatique.
- `node.pair.approve` utilise les commandes déclarées de la demande en attente pour appliquer
  des scopes d’approbation supplémentaires :
  - demande sans commande : `operator.pairing`
  - demande de commande non-exec : `operator.pairing` + `operator.write`
  - demande `system.run` / `system.run.prepare` / `system.which` :
    `operator.pairing` + `operator.admin`

Important :

- L’appairage des nœuds est un flux de confiance/d’identité plus émission de jeton.
- Il **n’épingle pas** la surface active de commandes du nœud, nœud par nœud.
- Les commandes actives du nœud proviennent de ce que le nœud déclare lors de la connexion après application
  de la politique globale de commandes des nœuds de la gateway (`gateway.nodes.allowCommands` /
  `denyCommands`).
- La politique d’autorisation/demande `system.run` par nœud vit sur le nœud dans
  `exec.approvals.node.*`, et non dans l’enregistrement d’appairage.

## Contrôle des commandes de nœud (2026.3.31+)

<Warning>
**Changement incompatible :** à partir de `2026.3.31`, les commandes de nœud sont désactivées jusqu’à l’approbation de l’appairage du nœud. L’appairage des appareils seul ne suffit plus à exposer les commandes déclarées du nœud.
</Warning>

Lorsqu’un nœud se connecte pour la première fois, l’appairage est demandé automatiquement. Tant que la demande d’appairage n’est pas approuvée, toutes les commandes de nœud en attente provenant de ce nœud sont filtrées et ne s’exécutent pas. Une fois la confiance établie par l’approbation de l’appairage, les commandes déclarées du nœud deviennent disponibles sous réserve de la politique de commande habituelle.

Cela signifie :

- Les nœuds qui s’appuyaient auparavant uniquement sur l’appairage des appareils pour exposer des commandes doivent désormais terminer l’appairage des nœuds.
- Les commandes mises en file avant l’approbation de l’appairage sont abandonnées, non différées.

## Limites de confiance des événements de nœud (2026.3.31+)

<Warning>
**Changement incompatible :** les exécutions d’origine nœud restent désormais sur une surface de confiance réduite.
</Warning>

Les résumés d’origine nœud et les événements de session associés sont limités à la surface de confiance prévue. Les flux pilotés par notification ou déclenchés par un nœud qui s’appuyaient auparavant sur un accès plus large aux outils hôte ou de session peuvent nécessiter des ajustements. Ce durcissement garantit que les événements de nœud ne peuvent pas s’élever vers un accès aux outils au niveau hôte au-delà de ce qu’autorise la limite de confiance du nœud.

## Approbation automatique (application macOS)

L’application macOS peut tenter facultativement une **approbation silencieuse** lorsque :

- la demande est marquée `silent`, et
- l’application peut vérifier une connexion SSH à l’hôte de la gateway avec le même utilisateur.

Si l’approbation silencieuse échoue, elle revient à l’invite normale « Approve/Reject ».

## Approbation automatique des appareils par CIDR approuvé

L’appairage des appareils WS pour `role: node` reste manuel par défaut. Pour des
réseaux de nœuds privés où la Gateway fait déjà confiance au chemin réseau, les opérateurs peuvent
activer cette fonction avec des CIDR explicites ou des IP exactes :

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
- Il n’existe aucun mode global d’approbation automatique pour tout le LAN ou réseau privé.
- Seul un nouvel appairage d’appareil `role: node` sans scopes demandés est éligible.
- Les clients operator, navigateur, Control UI et WebChat restent manuels.
- Les mises à niveau de rôle, de scope, de métadonnées et de clé publique restent manuelles.
- Les chemins d’en-têtes de proxy approuvé loopback sur le même hôte ne sont pas éligibles, car ce
  chemin peut être usurpé par des appelants locaux.

## Approbation automatique des mises à niveau de métadonnées

Lorsqu’un appareil déjà appairé se reconnecte avec uniquement des changements de métadonnées non sensibles
(par exemple, nom d’affichage ou indications de plateforme client), OpenClaw traite cela
comme une `metadata-upgrade`. L’approbation automatique silencieuse est étroite : elle s’applique uniquement
aux reconnexions d’outils d’aide/CLI locaux de confiance qui ont déjà prouvé la possession du
jeton partagé ou du mot de passe via loopback. Les clients navigateur/Control UI et les clients distants utilisent
toujours le flux explicite de réapprobation. Les mises à niveau de scope (lecture vers
écriture/admin) et les changements de clé publique ne sont **pas** éligibles à l’approbation automatique des metadata-upgrade — ils restent des demandes explicites de réapprobation.

## Assistants d’appairage QR

`/pair qr` affiche la charge utile d’appairage sous forme de média structuré afin que les clients
mobiles et navigateurs puissent la scanner directement.

La suppression d’un appareil purge également les demandes d’appairage en attente obsolètes pour cet
ID d’appareil, afin que `nodes pending` n’affiche pas de lignes orphelines après une révocation.

## Localité et en-têtes transférés

L’appairage Gateway ne traite une connexion comme loopback que lorsque le socket brut
et toute preuve de proxy amont concordent. Si une requête arrive via loopback mais
porte des en-têtes `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` qui
pointent vers une origine non locale, cette preuve via en-têtes transférés invalide
la revendication de localité loopback. Le chemin d’appairage exige alors une approbation explicite
au lieu de traiter silencieusement la requête comme une connexion sur le même hôte. Voir
[Authentification de proxy approuvé](/fr/gateway/trusted-proxy-auth) pour la règle équivalente sur
l’authentification operator.

## Stockage (local, privé)

L’état d’appairage est stocké sous le répertoire d’état de la Gateway (par défaut `~/.openclaw`) :

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Si vous remplacez `OPENCLAW_STATE_DIR`, le dossier `nodes/` est déplacé avec lui.

Remarques de sécurité :

- Les jetons sont des secrets ; traitez `paired.json` comme sensible.
- La rotation d’un jeton nécessite une réapprobation (ou la suppression de l’entrée du nœud).

## Comportement du transport

- Le transport est **sans état** ; il ne stocke pas l’appartenance.
- Si la Gateway est hors ligne ou si l’appairage est désactivé, les nœuds ne peuvent pas s’appairer.
- Si la Gateway est en mode distant, l’appairage s’effectue quand même par rapport au stockage de la Gateway distante.

## Liens associés

- [Appairage des canaux](/fr/channels/pairing)
- [Nœuds](/fr/nodes)
- [CLI Devices](/fr/cli/devices)
