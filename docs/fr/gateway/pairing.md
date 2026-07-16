---
read_when:
    - Implémentation des approbations d’appairage de Node sans interface utilisateur macOS
    - Ajout de flux CLI pour approuver les nœuds distants
    - Extension du protocole Gateway avec la gestion des Node
summary: 'Approbations des capacités des Node : comment les Node obtiennent l’accès aux commandes après l’appairage de l’appareil'
title: Appairage de Node
x-i18n:
    generated_at: "2026-07-16T13:23:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9e4221d7ad6aa6a9cd8ae33f2d4330c2aa49783340fcf7a657c20d6a94c126d9
    source_path: gateway/pairing.md
    workflow: 16
---

Le jumelage de Node comporte deux couches, toutes deux stockées dans l’enregistrement de l’appareil jumelé dans la base de données d’état SQLite du Gateway :

- **Jumelage de l’appareil** (rôle `node`) contrôle la négociation `connect`. Voir
  [Approbation automatique des appareils par CIDR de confiance](#trusted-cidr-device-auto-approval)
  ci-dessous et [Jumelage des canaux](/fr/channels/pairing).
- **Approbation des capacités de Node** (`node.pair.*`) contrôle les
  capacités/commandes déclarées qu’un Node connecté peut exposer. Le Gateway
  est la source de vérité ; les interfaces utilisateur (application macOS, interface de contrôle) sont des frontends qui approuvent ou
  rejettent les demandes en attente.

L’ancien magasin autonome de jumelage de Node (`nodes/paired.json` avec un jeton
par Node, retiré du chemin de connexion en janvier 2026) a disparu : les Gateways intègrent
toutes les lignes restantes dans les enregistrements d’appareil une seule fois au démarrage et archivent les
fichiers hérités avec un suffixe `.migrated`. La prise en charge de l’ancien pont TCP a été
supprimée.

## Fonctionnement de l’approbation des capacités

1. Un Node se connecte au WS du Gateway (le jumelage de l’appareil contrôle cette étape).
2. Le Gateway compare la surface de capacités/commandes déclarée à celle
   approuvée ; les surfaces nouvelles ou étendues stockent une **demande en attente** dans
   l’enregistrement de l’appareil et émettent `node.pair.requested`.
3. Vous approuvez ou rejetez la demande (CLI ou interface utilisateur).
4. Jusqu’à l’approbation, les commandes du Node restent filtrées ; l’approbation expose la surface
   déclarée, sous réserve de la politique de commande normale.

Les demandes en attente expirent automatiquement **5 minutes après la dernière
nouvelle tentative du Node** — un Node qui se reconnecte activement maintient son unique demande en attente active
au lieu de générer une nouvelle demande (et une nouvelle invite d’approbation) à chaque tentative.

## Flux de travail CLI (adapté aux environnements sans interface graphique)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` affiche les Nodes jumelés/connectés et leurs capacités.

## Surface d’API (protocole du Gateway)

Événements :

- `node.pair.requested` - émis lors de la création d’une nouvelle demande en attente.
- `node.pair.resolved` - émis lorsqu’une demande est approuvée, rejetée ou
  expirée.

Méthodes :

- `node.pair.list` - répertorie les Nodes en attente et jumelés (`operator.pairing`).
- `node.pair.approve` - approuve une demande en attente.
- `node.pair.reject` - rejette une demande en attente.
- `node.pair.remove` - supprime un Node jumelé. Cela révoque le rôle `node`
  de l’appareil dans le magasin des appareils jumelés, supprime avec lui la surface approuvée du Node et
  invalide/déconnecte les sessions de rôle Node de cet appareil. Un appareil à **rôles mixtes**
  (par exemple, qui possède également `operator`) conserve sa ligne et perd uniquement
  le rôle `node` ; la ligne d’un appareil exclusivement Node est supprimée. Autorisation :
  `operator.pairing` peut supprimer les lignes de Nodes non-opérateurs ; un appelant utilisant un jeton d’appareil
  qui révoque son **propre** rôle Node sur un appareil à rôles mixtes a également besoin de
  `operator.admin`.
- `node.rename` - renomme le nom d’affichage d’un Node jumelé visible par l’opérateur.

Supprimés dans la version 2026.7 : `node.pair.request` et `node.pair.verify`. Les demandes en attente
sont créées par le Gateway lui-même lors des connexions de Nodes, et le
jeton autonome par Node qu’ils utilisaient n’existe plus ; l’authentification du Node utilise le
jeton de jumelage de l’appareil.

Remarques :

- Les reconnexions avec une surface inchangée réutilisent la demande en attente ; les demandes
  répétées actualisent les métadonnées stockées du Node et le dernier instantané autorisé
  des commandes déclarées afin que l’opérateur puisse les consulter.
- Les niveaux de portée des opérateurs et les contrôles effectués lors de l’approbation sont résumés dans
  [Portées des opérateurs](/fr/gateway/operator-scopes).
- `node.pair.approve` utilise les commandes déclarées de la demande en attente pour appliquer
  des portées d’approbation supplémentaires :
  - demande sans commande : `operator.pairing`
  - demande de commande ordinaire : `operator.pairing` + `operator.write`
  - demande sensible pour l’administration contenant `system.run`, `system.run.prepare`,
    `system.which`, `browser.proxy`, `fs.listDir` ou
    `system.execApprovals.get/set` : `operator.pairing` + `operator.admin`

<Warning>
L’approbation du jumelage de Node enregistre la surface de capacités de confiance. Elle ne fixe **pas** la surface active des commandes de Node pour chaque Node.

- Les commandes actives du Node proviennent de ce que le Node déclare lors de la connexion, filtré par
  la politique globale du Gateway relative aux commandes de Node (`gateway.nodes.allowCommands` et
  `denyCommands`).
- La politique `system.run` d’autorisation et de demande propre à chaque Node est définie sur le Node dans
  `exec.approvals.node.*`, et non dans l’enregistrement de jumelage.

</Warning>

## Contrôle des commandes de Node (2026.3.31+)

<Warning>
**Modification incompatible :** à partir de `2026.3.31`, les commandes de Node sont désactivées jusqu’à l’approbation du jumelage de Node. Le jumelage de l’appareil seul ne suffit plus à exposer les commandes déclarées du Node.
</Warning>

Lorsqu’un Node se connecte pour la première fois, le jumelage est demandé automatiquement.
Tant que cette demande n’est pas approuvée, toutes les commandes de Node en attente provenant de ce Node sont
filtrées et ne seront pas exécutées. Une fois le jumelage approuvé, les commandes déclarées
du Node deviennent disponibles, sous réserve de la politique de commande normale.

Cela signifie que :

- Les Nodes qui s’appuyaient auparavant uniquement sur le jumelage de l’appareil pour exposer des commandes doivent
  désormais également effectuer le jumelage de Node.
- Les commandes placées en file d’attente avant l’approbation du jumelage sont abandonnées, et non différées.

## Limites de confiance des événements de Node (2026.3.31+)

<Warning>
**Modification incompatible :** les exécutions provenant de Nodes restent désormais sur une surface de confiance réduite.
</Warning>

Les résumés provenant de Nodes et les événements de session associés sont limités à la
surface de confiance prévue. Les flux déclenchés par des notifications ou par des Nodes qui
s’appuyaient auparavant sur un accès plus large aux outils de l’hôte ou de la session peuvent nécessiter des ajustements.
Ce renforcement empêche les événements de Node d’évoluer vers un accès aux outils au niveau de l’hôte
au-delà de ce que permet la limite de confiance du Node.

Les mises à jour durables de présence des Nodes suivent la même limite d’identité : l’événement
`node.presence.alive` n’est accepté que depuis des sessions d’appareils Node
authentifiées et ne met à jour les métadonnées de jumelage que lorsque l’identité de l’appareil/du Node est
déjà jumelée. Une valeur `client.id` autodéclarée ne suffit pas à écrire
l’état de dernière activité.

## Approbation automatique des appareils vérifiée par SSH (par défaut)

Le premier jumelage d’appareil `role: node` depuis une adresse privée/CGNAT est
approuvé automatiquement lorsque le Gateway peut **prouver la propriété de la machine par SSH** : il
se reconnecte à l’hôte à l’origine du jumelage (`BatchMode`, `StrictHostKeyChecking=yes`),
y exécute `openclaw node identity --json` et n’approuve que si l’identifiant de l’appareil distant
et la clé publique correspondent exactement à la demande en attente. C’est la correspondance de clé qui
rend cette opération sûre : l’accessibilité seule ne déclenche jamais l’approbation ; les co-locataires derrière le même NAT,
les autres utilisateurs d’un hôte partagé et l’usurpation sur le réseau local suivent donc tous le flux
d’invite normal.

Activé par défaut. Conditions requises pour son déclenchement :

- L’utilisateur du processus du Gateway (ou `sshVerify.user`) peut se connecter par SSH à l’hôte du Node
  sans interaction (clés/agent ; Tailscale SSH fonctionne également), et la clé de l’hôte est
  déjà approuvée.
- `openclaw` se résout sur le `PATH` distant pour une exécution non interactive de `sh -lc`.
- L’adresse IP de connexion est une adresse directe (sans proxy et hors boucle locale) privée, ULA,
  lien-local ou CGNAT, ou correspond à `sshVerify.cidrs` lorsque cette valeur est définie.
- Même seuil d’éligibilité que pour l’approbation par CIDR de confiance : uniquement un nouveau jumelage de Node
  sans portée ; les mises à niveau, navigateurs, l’interface de contrôle et WebChat affichent toujours une invite.

Pendant l’exécution d’une sonde, le client Node reçoit l’instruction de poursuivre ses nouvelles tentatives
(`wait_then_retry`) au lieu de se mettre en pause dans l’attente d’une approbation manuelle ; si la sonde
échoue, la tentative suivante revient au flux d’invite normal. Les cibles en échec
font l’objet d’un court délai de récupération (5 minutes après une non-correspondance de clé).

Les appareils approuvés enregistrent `approvedVia: "ssh-verified"` et leur première surface de capacités
déclarée est approuvée au cours de la même étape — la correspondance de clé prouve déjà que
le Node s’exécute sous le compte de l’opérateur sur une machine qui lui appartient, ce qui correspond à
l’affirmation d’une approbation manuelle des capacités. Les extensions ultérieures de la surface
affichent toujours une invite.

Renforcement ou désactivation :

```json5
{
  gateway: {
    nodes: {
      pairing: {
        // Désactiver entièrement :
        sshVerify: false,
        // ...ou limiter/ajuster la sonde :
        // sshVerify: { user: "me", identity: "~/.ssh/probe", timeoutMs: 7000, cidrs: ["10.0.0.0/8"] },
      },
    },
  },
}
```

## Approbation automatique (application macOS)

L’application macOS peut tenter une **approbation silencieuse** des demandes de capacités de Node
lorsque :

- la demande porte la marque `silent` (le Gateway marque la première surface de capacités
  comme silencieuse lorsque le jumelage de l’appareil a été approuvé sans interaction), et
- l’application peut vérifier une connexion SSH à l’hôte du Gateway avec le même
  utilisateur.

Si l’approbation silencieuse échoue, elle revient à l’invite Approve/Reject normale.

## Approbation automatique des appareils par CIDR de confiance

Le jumelage d’appareils WS pour `role: node` reste manuel par défaut. Pour les réseaux privés de Nodes
où le Gateway fait déjà confiance au chemin réseau, les opérateurs peuvent l’activer
avec des CIDR explicites ou des adresses IP exactes :

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
- Il n’existe aucun mode général d’approbation automatique du réseau local ou privé ; l’approbation automatique
  vérifiée par SSH (ci-dessus) exige une correspondance cryptographique de la clé de l’appareil, jamais
  la seule proximité réseau.
- Seule une nouvelle demande de jumelage d’appareil `role: node` sans portée demandée est
  éligible.
- Les clients opérateur, navigateur, interface de contrôle et WebChat restent manuels.
- Les mises à niveau des rôles, portées, métadonnées et clés publiques restent manuelles.
- Les chemins d’en-têtes de proxy de confiance en boucle locale sur le même hôte ne sont pas éligibles, car ce
  chemin peut être usurpé par des appelants locaux.

## Nettoyage des jumelages silencieux remplacés

Les approbations sans interaction enregistrent leur provenance dans la ligne de l’appareil jumelé :
les approbations par politique locale sur le même hôte comme `silent`, les approbations de Nodes par CIDR de confiance comme
`trusted-cidr`, les approbations de Nodes vérifiées par SSH comme `ssh-verified`. Les clients dont le répertoire d’état est éphémère (répertoires personnels temporaires,
conteneurs, environnements isolés propres à chaque exécution) génèrent une nouvelle paire de clés d’appareil à chaque exécution, et chaque
exécution se jumelle de nouveau silencieusement comme un tout nouvel appareil — sans nettoyage, la liste des appareils jumelés
s’allonge d’une ligne obsolète par exécution.

Lorsque le Gateway approuve silencieusement le jumelage d’un appareil **local**, il retire les
anciens enregistrements approuvés par `silent` qui appartiennent au même groupe de clients
(correspondance de `clientId`, `clientMode` et du nom d’affichage) et qui ne sont pas actuellement
connectés. Les clients locaux s’exécutent sur l’hôte du Gateway lui-même ; la clé du groupe
ne peut donc pas correspondre à une autre machine. Les lignes retirées perdent immédiatement leurs jetons ;
toute entrée correspondante de jumelage de Node héritée est effacée et un événement de suppression `node.pair.resolved`
est diffusé.

Limites :

- Seuls les enregistrements dont la dernière approbation était locale sur le même hôte (`silent`) sont
  admissibles, aussi bien comme déclencheurs que comme cibles. Les associations vérifiées par CIDR de confiance et par SSH
  traversent des hôtes sur lesquels les métadonnées d’affichage ne constituent pas une identité de machine ; elles ne sont donc
  jamais supprimées automatiquement — utilisez le nettoyage dans l’interface de contrôle ou
  `openclaw nodes remove` pour celles-ci.
- Les associations approuvées par le propriétaire et celles effectuées par QR/code de configuration (amorçage) ne sont jamais supprimées
  automatiquement. Les enregistrements approuvés avant l’existence des informations de provenance restent protégés,
  même après une réapprobation silencieuse ultérieure du même identifiant d’appareil.
- Les appareils actuellement connectés sont ignorés, afin que les sessions locales simultanées utilisant
  des répertoires d’état distincts conservent leurs jetons tant qu’elles sont actives. Les enregistrements approuvés
  au cours de la dernière minute sont également ignorés, afin que des négociations d’association simultanées
  ne puissent pas se retirer mutuellement avant l’enregistrement de leurs connexions.
- Les clients concernés sont locaux par construction ; ils se réassocient donc silencieusement lors de
  leur prochaine connexion.

## Approbation automatique lors d’une mise à niveau des métadonnées

Lorsqu’un appareil déjà associé se reconnecte avec uniquement des modifications de métadonnées
non sensibles (par exemple le nom d’affichage ou des indications sur la plateforme cliente), OpenClaw considère
cela comme une `metadata-upgrade`. L’approbation automatique silencieuse est limitée : elle s’applique uniquement
aux reconnexions locales de confiance hors navigateur qui ont déjà prouvé la possession
d’identifiants locaux ou partagés, notamment les reconnexions d’applications natives sur le même hôte après
des modifications des métadonnées de version du système d’exploitation. Les clients de navigateur/de l’interface de contrôle et les clients distants
utilisent toujours le processus explicite de réapprobation. Les élévations de portée (de lecture à
écriture/administration) et les modifications de clé publique ne sont **pas** admissibles à
l’approbation automatique lors d’une mise à niveau des métadonnées ; elles restent des demandes explicites de réapprobation.

## Assistants d’association par QR

`/pair qr` restitue la charge utile d’association sous forme de média structuré afin que les clients mobiles et
de navigateur puissent la scanner directement.

La suppression d’un appareil élimine également toutes les demandes d’association en attente obsolètes pour cet
identifiant d’appareil, afin que `nodes pending` n’affiche pas de lignes orphelines après une révocation.

## Localité et en-têtes transférés

L’association au Gateway considère une connexion comme provenant de l’interface de bouclage uniquement lorsque le socket brut
et toutes les informations fournies par un proxy en amont concordent. Si une requête arrive sur l’interface de bouclage mais
contient des informations d’en-tête `Forwarded`, `X-Forwarded-*` ou `X-Real-IP`,
ces informations d’en-tête transféré invalident la déclaration de localité de l’interface de bouclage, et le
processus d’association exige une approbation explicite au lieu de considérer silencieusement la
requête comme une connexion sur le même hôte. Consultez
[Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth) pour la règle équivalente concernant
l’authentification de l’opérateur.

## Stockage (local, privé)

L’état d’association réside dans les enregistrements des appareils associés dans la base de données d’état SQLite
partagée, sous le répertoire d’état du Gateway (par défaut `~/.openclaw`) :

- `~/.openclaw/state/openclaw.sqlite` (appareils associés avec authentification de l’appareil,
  surfaces de Node approuvées, demandes de surface en attente, demandes d’association d’appareil
  en attente et jetons d’amorçage)

Si vous remplacez `OPENCLAW_STATE_DIR`, la base de données est déplacée avec celui-ci. Les Gateway
mis à niveau depuis des versions utilisant des magasins JSON les importent au démarrage et laissent
des archives `devices/*.json.migrated` et `nodes/*.json.migrated`.

Remarques de sécurité :

- Les jetons d’appareil sont des secrets ; considérez la base de données d’état comme sensible.
- La rotation d’un jeton d’appareil utilise `openclaw devices rotate` /
  `device.token.rotate`.

## Comportement du transport

- Le transport est **sans état** ; il ne stocke pas les appartenances.
- Si le Gateway est hors ligne ou si l’association est désactivée, les Nodes ne peuvent pas s’associer.
- En mode distant, l’association s’effectue dans le magasin du Gateway distant.

## Pages connexes

- [Association de canal](/fr/channels/pairing)
- [CLI des Nodes](/fr/cli/nodes)
- [CLI des appareils](/fr/cli/devices)
