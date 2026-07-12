---
read_when:
    - Mise en œuvre des approbations d’appairage de nœuds sans interface utilisateur macOS
    - Ajout de parcours CLI pour approuver les nœuds distants
    - Extension du protocole Gateway avec la gestion des Node
summary: 'Approbations des capacités des Node : comment les Node obtiennent l’autorisation d’exposer des commandes après l’appairage de l’appareil'
title: Appairage du Node
x-i18n:
    generated_at: "2026-07-12T02:39:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 753b01681fa9be17df853b63210f54374d054a6dde37746a3b5fda69073af71d
    source_path: gateway/pairing.md
    workflow: 16
---

Le jumelage des Node comporte deux couches, toutes deux stockées dans l’enregistrement de l’appareil jumelé au sein de la base de données d’état SQLite du Gateway :

- **Jumelage de l’appareil** (rôle `node`) contrôle la négociation `connect`. Voir
  [Approbation automatique des appareils par CIDR de confiance](#trusted-cidr-device-auto-approval)
  ci-dessous et [Jumelage des canaux](/fr/channels/pairing).
- **Approbation des capacités du Node** (`node.pair.*`) contrôle les
  capacités/commandes déclarées qu’un Node connecté peut exposer. Le Gateway
  constitue la source de vérité ; les interfaces utilisateur (application macOS,
  Control UI) sont des frontends qui approuvent ou rejettent les demandes en
  attente.

L’ancien stockage autonome du jumelage des Node (`nodes/paired.json` avec un
jeton propre à chaque Node, retiré du chemin de connexion en janvier 2026)
n’existe plus : au démarrage, les Gateway intègrent une fois les lignes restantes
aux enregistrements des appareils, puis archivent les anciens fichiers avec le
suffixe `.migrated`. La prise en charge de l’ancien pont TCP a été supprimée.

## Fonctionnement de l’approbation des capacités

1. Un Node se connecte au WS du Gateway (le jumelage de l’appareil contrôle cette étape).
2. Le Gateway compare l’ensemble déclaré des capacités/commandes à l’ensemble
   approuvé ; les ensembles nouveaux ou élargis enregistrent une **demande en attente**
   dans l’enregistrement de l’appareil et émettent `node.pair.requested`.
3. Vous approuvez ou rejetez la demande (CLI ou interface utilisateur).
4. Jusqu’à l’approbation, les commandes du Node restent filtrées ; l’approbation
   expose l’ensemble déclaré, sous réserve de la politique habituelle relative aux
   commandes.

Les demandes en attente expirent automatiquement **5 minutes après la dernière
nouvelle tentative du Node** — un Node qui se reconnecte activement conserve sa
demande en attente unique au lieu de générer une nouvelle demande (et une nouvelle
invite d’approbation) à chaque tentative.

## Flux de travail CLI (adapté aux environnements sans interface graphique)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` affiche les Node jumelés/connectés et leurs capacités.

## Surface d’API (protocole du Gateway)

Événements :

- `node.pair.requested` - émis lors de la création d’une nouvelle demande en attente.
- `node.pair.resolved` - émis lorsqu’une demande est approuvée, rejetée ou
  expirée.

Méthodes :

- `node.pair.list` - répertorie les Node en attente et jumelés (`operator.pairing`).
- `node.pair.approve` - approuve une demande en attente.
- `node.pair.reject` - rejette une demande en attente.
- `node.pair.remove` - supprime un Node jumelé. Cela révoque le rôle `node` de
  l’appareil dans le stockage des appareils jumelés, supprime avec lui la surface
  approuvée du Node et invalide/déconnecte les sessions de cet appareil associées
  au rôle Node. Un appareil **à rôles multiples** (par exemple, qui possède
  également `operator`) conserve sa ligne et perd uniquement le rôle `node` ;
  la ligne d’un appareil ayant uniquement le rôle Node est supprimée. Autorisation :
  `operator.pairing` peut supprimer les lignes de Node sans rôle opérateur ; un
  appelant utilisant un jeton d’appareil qui révoque son **propre** rôle Node sur
  un appareil à rôles multiples a également besoin de `operator.admin`.
- `node.rename` - renomme le nom d’affichage d’un Node jumelé visible par l’opérateur.

Supprimées dans la version 2026.7 : `node.pair.request` et `node.pair.verify`. Les
demandes en attente sont créées par le Gateway lui-même lors des connexions des
Node, et le jeton autonome propre à chaque Node qu’elles utilisaient n’existe plus ;
l’authentification du Node utilise le jeton de jumelage de l’appareil.

Remarques :

- Les reconnexions avec une surface inchangée réutilisent la demande en attente ;
  les demandes répétées actualisent les métadonnées stockées du Node ainsi que le
  dernier instantané autorisé des commandes déclarées afin que l’opérateur puisse
  les consulter.
- Les niveaux de portée de l’opérateur et les vérifications effectuées lors de
  l’approbation sont résumés dans
  [Portées de l’opérateur](/fr/gateway/operator-scopes).
- `node.pair.approve` utilise les commandes déclarées dans la demande en attente
  pour imposer des portées d’approbation supplémentaires :
  - demande sans commande : `operator.pairing`
  - demande de commande autre qu’une commande d’exécution : `operator.pairing` + `operator.write`
  - demande `system.run` / `system.run.prepare` / `system.which` :
    `operator.pairing` + `operator.admin`

<Warning>
L’approbation du jumelage des Node enregistre la surface de capacités approuvée. Elle ne **fige pas** la surface active des commandes du Node pour chaque Node.

- Les commandes actives du Node proviennent de ce que le Node déclare lors de la
  connexion, filtré par la politique globale du Gateway relative aux commandes
  des Node (`gateway.nodes.allowCommands` et `denyCommands`).
- La politique d’autorisation et de demande de confirmation propre à chaque Node
  pour `system.run` réside sur le Node dans `exec.approvals.node.*`, et non dans
  l’enregistrement de jumelage.

</Warning>

## Contrôle des commandes du Node (2026.3.31+)

<Warning>
**Modification incompatible :** à partir de `2026.3.31`, les commandes des Node sont désactivées jusqu’à l’approbation du jumelage des Node. Le jumelage de l’appareil seul ne suffit plus à exposer les commandes déclarées du Node.
</Warning>

Lorsqu’un Node se connecte pour la première fois, le jumelage est demandé
automatiquement. Jusqu’à l’approbation de cette demande, toutes les commandes en
attente provenant de ce Node sont filtrées et ne sont pas exécutées. Une fois le
jumelage approuvé, les commandes déclarées du Node deviennent disponibles, sous
réserve de la politique habituelle relative aux commandes.

Cela signifie que :

- Les Node qui s’appuyaient auparavant uniquement sur le jumelage de l’appareil
  pour exposer des commandes doivent désormais également effectuer le jumelage
  du Node.
- Les commandes mises en file d’attente avant l’approbation du jumelage sont
  abandonnées, et non différées.

## Limites de confiance des événements du Node (2026.3.31+)

<Warning>
**Modification incompatible :** les exécutions provenant des Node restent désormais sur une surface de confiance réduite.
</Warning>

Les résumés provenant des Node et les événements de session associés sont limités
à la surface de confiance prévue. Les flux déclenchés par des notifications ou
par des Node qui s’appuyaient auparavant sur un accès plus large aux outils de
l’hôte ou de la session peuvent nécessiter des ajustements. Ce renforcement
empêche les événements des Node d’obtenir un accès aux outils au niveau de l’hôte
au-delà de ce que permet la limite de confiance du Node.

Les mises à jour persistantes de présence des Node respectent la même limite
d’identité : l’événement `node.presence.alive` est accepté uniquement depuis des
sessions d’appareils Node authentifiées et ne met à jour les métadonnées de
jumelage que si l’identité de l’appareil/du Node est déjà jumelée. Une valeur
`client.id` autodéclarée ne suffit pas pour enregistrer l’état de dernière
activité.

## Approbation automatique des appareils vérifiée par SSH (par défaut)

Le premier jumelage d’un appareil avec `role: node` depuis une adresse
privée/CGNAT est approuvé automatiquement lorsque le Gateway peut **prouver la
propriété de la machine par SSH** : il se reconnecte à l’hôte demandant le
jumelage (`BatchMode`, `StrictHostKeyChecking=yes`), y exécute
`openclaw node identity --json` et n’approuve la demande que si l’identifiant de
l’appareil distant et la clé publique correspondent exactement à la demande en
attente. C’est la correspondance de la clé qui sécurise ce mécanisme : la seule
accessibilité ne déclenche jamais l’approbation ; les autres utilisateurs du même
NAT, les autres utilisateurs d’un hôte partagé et l’usurpation sur le réseau local
suivent donc tous le flux d’invite habituel.

Activée par défaut. Conditions requises pour son déclenchement :

- L’utilisateur exécutant le processus du Gateway (ou `sshVerify.user`) peut se
  connecter en SSH à l’hôte du Node sans interaction (clés/agent ; Tailscale SSH
  fonctionne également), et la clé de l’hôte est déjà approuvée.
- `openclaw` est résolu dans le `PATH` distant pour l’exécution non interactive
  de `sh -lc`.
- L’adresse IP de connexion est une adresse privée, ULA, link-local ou CGNAT
  directe (sans proxy et hors local loopback), ou correspond à `sshVerify.cidrs`
  lorsque cette option est définie.
- Même niveau d’admissibilité minimal que pour l’approbation par CIDR de
  confiance : uniquement un nouveau jumelage de Node sans portée ; les mises à
  niveau, les navigateurs, Control UI et WebChat affichent toujours une invite.

Pendant l’exécution d’une vérification, le client Node reçoit l’instruction de
continuer à réessayer (`wait_then_retry`) plutôt que de se mettre en pause dans
l’attente d’une approbation manuelle ; si la vérification échoue, la tentative
suivante revient au flux d’invite habituel. Les cibles ayant échoué font l’objet
d’un court délai d’attente (5 minutes après une non-correspondance de clé).

Les appareils approuvés enregistrent `approvedVia: "ssh-verified"` et leur
première surface de capacités déclarée est approuvée au cours de la même étape —
la correspondance de la clé prouve déjà que le Node s’exécute sous le compte de
l’opérateur sur une machine qui lui appartient, ce qui correspond à l’affirmation
établie par une approbation manuelle des capacités. Les extensions ultérieures de
la surface affichent toujours une invite.

Renforcement ou désactivation :

```json5
{
  gateway: {
    nodes: {
      pairing: {
        // Disable entirely:
        sshVerify: false,
        // ...or scope/tune the probe:
        // sshVerify: { user: "me", identity: "~/.ssh/probe", timeoutMs: 7000, cidrs: ["10.0.0.0/8"] },
      },
    },
  },
}
```

## Approbation automatique (application macOS)

L’application macOS peut tenter une **approbation silencieuse** des demandes de
capacités des Node lorsque :

- la demande est marquée `silent` (le Gateway marque la première surface de
  capacités comme silencieuse lorsque le jumelage de l’appareil a été approuvé
  sans interaction), et
- l’application peut vérifier une connexion SSH à l’hôte du Gateway en utilisant
  le même utilisateur.

Si l’approbation silencieuse échoue, l’application revient à l’invite habituelle Approve/Reject.

## Approbation automatique des appareils par CIDR de confiance

Le jumelage d’appareils WS pour `role: node` reste manuel par défaut. Pour les
réseaux privés de Node où le Gateway fait déjà confiance au chemin réseau, les
opérateurs peuvent l’activer avec des CIDR explicites ou des adresses IP exactes :

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

- Désactivée lorsque `gateway.nodes.pairing.autoApproveCidrs` n’est pas défini.
- Il n’existe aucun mode d’approbation automatique globale pour le réseau local
  ou les réseaux privés ; l’approbation automatique vérifiée par SSH (ci-dessus)
  exige une correspondance cryptographique de la clé de l’appareil, jamais la
  seule proximité réseau.
- Seule une nouvelle demande de jumelage d’appareil avec `role: node` et sans
  portée demandée est admissible.
- Les clients opérateur, navigateur, Control UI et WebChat restent soumis à une
  approbation manuelle.
- Les mises à niveau du rôle, de la portée, des métadonnées et de la clé publique
  restent manuelles.
- Les chemins d’en-têtes de proxy de confiance via le local loopback du même hôte ne
  sont pas admissibles, car des appelants locaux peuvent les usurper.

## Nettoyage lors du remplacement d’un jumelage silencieux

Les approbations non interactives enregistrent leur provenance dans la ligne de
l’appareil jumelé : les approbations par politique locale sur le même hôte comme
`silent`, les approbations de Node par CIDR de confiance comme `trusted-cidr` et
les approbations de Node vérifiées par SSH comme `ssh-verified`. Les clients dont
le répertoire d’état est éphémère (répertoires personnels temporaires, conteneurs,
bacs à sable propres à chaque exécution) génèrent une nouvelle paire de clés
d’appareil à chaque exécution, et chaque exécution effectue silencieusement un
nouveau jumelage en tant que nouvel appareil — sans nettoyage, la liste des
appareils jumelés s’allonge d’une ligne obsolète à chaque exécution.

Lorsque le Gateway approuve silencieusement le jumelage d’un appareil **local**,
il retire les anciens enregistrements approuvés comme `silent` qui appartiennent
au même groupe de clients (correspondance de `clientId`, `clientMode` et du nom
d’affichage) et qui ne sont pas actuellement connectés. Les clients locaux
s’exécutent sur l’hôte du Gateway lui-même ; la clé du groupe ne peut donc pas
correspondre à une autre machine. Les lignes retirées perdent immédiatement leurs
jetons ; toute entrée correspondante de l’ancien jumelage de Node est effacée et
un événement de suppression `node.pair.resolved` est diffusé.

Limites :

- Seuls les enregistrements dont la dernière approbation a été effectuée
  localement sur le même hôte (`silent`) sont admissibles, à la fois comme
  déclencheurs et comme cibles. Les jumelages par CIDR de confiance et vérifiés
  par SSH concernent plusieurs hôtes, pour lesquels les métadonnées d’affichage
  ne constituent pas une identité de machine ; ils ne sont donc jamais supprimés
  automatiquement — utilisez le nettoyage de Control UI ou
  `openclaw nodes remove` pour ceux-ci.
- Les jumelages approuvés par le propriétaire et ceux effectués par code QR/code
  de configuration (amorçage) ne sont jamais supprimés automatiquement. Les
  enregistrements approuvés avant l’existence des données de provenance restent
  protégés, même après une nouvelle approbation silencieuse ultérieure du même
  identifiant d’appareil.
- Les appareils actuellement connectés sont ignorés ; les sessions locales
  simultanées utilisant des répertoires d’état distincts conservent ainsi leurs
  jetons tant qu’elles sont actives. Les enregistrements approuvés au cours de la
  dernière minute sont également ignorés afin que des négociations de jumelage
  simultanées ne puissent pas se retirer mutuellement avant l’enregistrement de
  leurs connexions.
- Les clients concernés sont locaux par construction ; ils se jumellent donc de
  nouveau silencieusement lors de leur prochaine connexion.

## Approbation automatique des mises à niveau des métadonnées

Lorsqu’un appareil déjà jumelé se reconnecte avec uniquement des modifications de
métadonnées non sensibles (par exemple le nom d’affichage ou des indications sur
la plateforme du client), OpenClaw traite cela comme une `metadata-upgrade`.
L’approbation automatique silencieuse est limitée : elle s’applique uniquement
aux reconnexions locales de confiance hors navigateur qui ont déjà prouvé la
possession d’identifiants locaux ou partagés, notamment les reconnexions
d’applications natives sur le même hôte après une modification des métadonnées de
version du système d’exploitation. Les clients navigateur/Control UI et les
clients distants utilisent toujours le flux explicite de nouvelle approbation.
Les mises à niveau de portée (de lecture à écriture/administration) et les
modifications de clé publique ne sont **pas** admissibles à l’approbation
automatique des `metadata-upgrade` ; elles restent des demandes explicites de
nouvelle approbation.

## Assistants de jumelage par code QR

`/pair qr` affiche la charge utile d’appairage sous forme de média structuré afin que les clients mobiles et les navigateurs puissent la scanner directement.

La suppression d’un appareil élimine également toutes les demandes d’appairage en attente obsolètes associées à l’identifiant de cet appareil, afin que `nodes pending` n’affiche aucune ligne orpheline après une révocation.

## Localité et en-têtes transférés

L’appairage du Gateway ne considère une connexion comme local loopback que si le socket brut et toutes les indications fournies par un proxy en amont concordent. Si une requête arrive sur local loopback, mais contient des indications dans les en-têtes `Forwarded`, `X-Forwarded-*` ou `X-Real-IP`, celles-ci invalident la déclaration de localité local loopback et le processus d’appairage exige une approbation explicite au lieu de traiter silencieusement la requête comme une connexion provenant du même hôte. Consultez [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth) pour connaître la règle équivalente relative à l’authentification de l’opérateur.

## Stockage (local et privé)

L’état de l’appairage réside dans les enregistrements des appareils appairés, au sein de la base de données d’état SQLite partagée située dans le répertoire d’état du Gateway (par défaut, `~/.openclaw`) :

- `~/.openclaw/state/openclaw.sqlite` (appareils appairés avec authentification de l’appareil, surfaces de nœud approuvées, demandes de surface en attente, demandes d’appairage d’appareil en attente et jetons d’amorçage)

Si vous redéfinissez `OPENCLAW_STATE_DIR`, la base de données est déplacée avec ce répertoire. Les Gateways mis à niveau depuis des versions utilisant des stockages JSON les importent au démarrage et conservent les archives `devices/*.json.migrated` et `nodes/*.json.migrated`.

Remarques de sécurité :

- Les jetons d’appareil sont des secrets ; considérez la base de données d’état comme sensible.
- La rotation d’un jeton d’appareil utilise `openclaw devices rotate` / `device.token.rotate`.

## Comportement du transport

- Le transport est **sans état** ; il ne stocke pas les appartenances.
- Si le Gateway est hors ligne ou si l’appairage est désactivé, les nœuds ne peuvent pas s’appairer.
- En mode distant, l’appairage s’effectue dans le stockage du Gateway distant.

## Voir aussi

- [Appairage des canaux](/fr/channels/pairing)
- [CLI des nœuds](/fr/cli/nodes)
- [CLI des appareils](/fr/cli/devices)
