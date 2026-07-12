---
read_when:
    - Implémentation des approbations d’appairage de Node sans interface utilisateur macOS
    - Ajout de flux CLI pour approuver les Nodes distants
    - Extension du protocole Gateway avec la gestion des Node
summary: 'Approbations des capacités des Node : comment les Node obtiennent l’exposition des commandes après l’appairage des appareils'
title: Appairage des Node
x-i18n:
    generated_at: "2026-07-12T15:28:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 753b01681fa9be17df853b63210f54374d054a6dde37746a3b5fda69073af71d
    source_path: gateway/pairing.md
    workflow: 16
---

Le jumelage de Node comporte deux couches, toutes deux stockées dans l’enregistrement de l’appareil jumelé au sein de la base de données d’état SQLite du Gateway :

- **Jumelage de l’appareil** (rôle `node`) contrôle la négociation `connect`. Consultez
  [Approbation automatique des appareils par CIDR de confiance](#trusted-cidr-device-auto-approval)
  ci-dessous et [Jumelage des canaux](/fr/channels/pairing).
- **Approbation des capacités du Node** (`node.pair.*`) détermine les
  capacités/commandes déclarées qu’un Node connecté peut exposer. Le Gateway
  constitue la source de vérité ; les interfaces utilisateur (application macOS, Control UI) sont des frontends qui approuvent ou
  rejettent les demandes en attente.

L’ancien stockage autonome de jumelage des Nodes (`nodes/paired.json` avec un
jeton par Node, retiré du chemin de connexion en janvier 2026) a disparu : au
démarrage, les gateways intègrent une seule fois toutes les lignes restantes
aux enregistrements d’appareils et archivent les anciens fichiers avec le
suffixe `.migrated`. La prise en charge de l’ancien pont TCP a été supprimée.

## Fonctionnement de l’approbation des capacités

1. Un Node se connecte au WS du Gateway (le jumelage de l’appareil contrôle cette étape).
2. Le Gateway compare l’ensemble déclaré des capacités/commandes à celui qui a été
   approuvé ; les ensembles nouveaux ou étendus enregistrent une **demande en attente** dans
   l’enregistrement de l’appareil et émettent `node.pair.requested`.
3. Vous approuvez ou rejetez la demande (CLI ou interface utilisateur).
4. Jusqu’à l’approbation, les commandes du Node restent filtrées ; l’approbation expose l’ensemble
   déclaré, sous réserve de la politique normale relative aux commandes.

Les demandes en attente expirent automatiquement **5 minutes après la dernière
nouvelle tentative du Node** : un Node qui tente activement de se reconnecter maintient
sa demande unique en attente au lieu de générer une nouvelle demande (et une nouvelle
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

`nodes status` affiche les Nodes jumelés/connectés et leurs capacités.

## Surface de l’API (protocole du Gateway)

Événements :

- `node.pair.requested` - émis lors de la création d’une nouvelle demande en attente.
- `node.pair.resolved` - émis lorsqu’une demande est approuvée, rejetée ou
  expirée.

Méthodes :

- `node.pair.list` - répertorie les Nodes en attente et jumelés (`operator.pairing`).
- `node.pair.approve` - approuve une demande en attente.
- `node.pair.reject` - rejette une demande en attente.
- `node.pair.remove` - supprime un Node jumelé. Cette opération révoque le rôle `node`
  de l’appareil dans le stockage des appareils jumelés, supprime avec lui la surface approuvée du Node et
  invalide/déconnecte les sessions de cet appareil associées au rôle de Node. Un appareil à **rôles multiples**
  (par exemple s’il possède également le rôle `operator`) conserve sa ligne et perd uniquement
  le rôle `node` ; la ligne d’un appareil exclusivement Node est supprimée. Autorisation :
  `operator.pairing` peut supprimer les lignes de Nodes non-opérateurs ; un appelant utilisant un jeton d’appareil
  qui révoque son **propre** rôle de Node sur un appareil à rôles multiples a également besoin de
  `operator.admin`.
- `node.rename` - renomme le nom d’affichage d’un Node jumelé visible par l’opérateur.

Supprimés dans la version 2026.7 : `node.pair.request` et `node.pair.verify`. Les demandes en
attente sont créées par le Gateway lui-même lors des connexions des Nodes, et le
jeton autonome par Node auquel ces méthodes étaient associées n’existe plus ; l’authentification du Node utilise le
jeton de jumelage de l’appareil.

Remarques :

- Les reconnexions avec une surface inchangée réutilisent la demande en attente ; les demandes
  répétées actualisent les métadonnées stockées du Node et le dernier instantané des commandes
  déclarées figurant dans la liste d’autorisation, afin qu’elles soient visibles par l’opérateur.
- Les niveaux de portée de l’opérateur et les vérifications effectuées lors de l’approbation sont résumés dans
  [Portées de l’opérateur](/fr/gateway/operator-scopes).
- `node.pair.approve` utilise les commandes déclarées de la demande en attente pour imposer
  des portées d’approbation supplémentaires :
  - demande sans commande : `operator.pairing`
  - demande de commande autre que d’exécution : `operator.pairing` + `operator.write`
  - demande `system.run` / `system.run.prepare` / `system.which` :
    `operator.pairing` + `operator.admin`

<Warning>
L’approbation du jumelage du Node enregistre la surface de capacités de confiance. Elle ne **fige pas** la surface de commandes active du Node pour chaque Node.

- Les commandes actives du Node proviennent de ce que le Node déclare lors de la connexion, filtré par
  la politique globale du Gateway relative aux commandes des Nodes (`gateway.nodes.allowCommands` et
  `denyCommands`).
- La politique d’autorisation et de confirmation de `system.run` par Node réside sur le Node dans
  `exec.approvals.node.*`, et non dans l’enregistrement de jumelage.

</Warning>

## Contrôle des commandes des Nodes (2026.3.31+)

<Warning>
**Modification incompatible :** à partir de `2026.3.31`, les commandes des Nodes sont désactivées tant que le jumelage du Node n’est pas approuvé. Le seul jumelage de l’appareil ne suffit plus pour exposer les commandes déclarées du Node.
</Warning>

Lorsqu’un Node se connecte pour la première fois, le jumelage est demandé automatiquement.
Tant que cette demande n’est pas approuvée, toutes les commandes en attente de ce Node sont
filtrées et ne sont pas exécutées. Une fois le jumelage approuvé, les commandes
déclarées du Node deviennent disponibles, sous réserve de la politique normale relative aux commandes.

Cela signifie que :

- Les Nodes qui s’appuyaient auparavant uniquement sur le jumelage de l’appareil pour exposer des commandes doivent
  désormais également effectuer le jumelage du Node.
- Les commandes mises en file d’attente avant l’approbation du jumelage sont abandonnées, et non différées.

## Limites de confiance des événements des Nodes (2026.3.31+)

<Warning>
**Modification incompatible :** les exécutions provenant des Nodes restent désormais sur une surface de confiance réduite.
</Warning>

Les résumés provenant des Nodes et les événements de session associés sont limités à la
surface de confiance prévue. Les flux déclenchés par des notifications ou par des Nodes qui
s’appuyaient auparavant sur un accès plus large aux outils de l’hôte ou de la session peuvent nécessiter des ajustements.
Ce renforcement empêche les événements des Nodes d’évoluer vers un accès aux outils au niveau de l’hôte
au-delà de ce que permet la limite de confiance du Node.

Les mises à jour persistantes de présence des Nodes suivent la même limite d’identité : l’événement
`node.presence.alive` est accepté uniquement depuis des sessions d’appareils Node
authentifiées et ne met à jour les métadonnées de jumelage que lorsque l’identité de
l’appareil/du Node est déjà jumelée. Une valeur `client.id` autodéclarée ne suffit pas pour écrire
l’état de dernière activité.

## Approbation automatique des appareils vérifiée par SSH (par défaut)

Le premier jumelage d’un appareil avec `role: node` depuis une adresse privée/CGNAT est
approuvé automatiquement lorsque le Gateway peut **prouver la propriété de la machine via SSH** : il
se reconnecte à l’hôte à jumeler (`BatchMode`, `StrictHostKeyChecking=yes`),
y exécute `openclaw node identity --json` et n’approuve que si l’identifiant de l’appareil
distant et la clé publique correspondent exactement à la demande en attente. La correspondance de la clé est
ce qui garantit la sécurité : l’accessibilité seule ne déclenche jamais l’approbation ; les cotenants derrière le NAT,
les autres utilisateurs d’un hôte partagé et l’usurpation sur le réseau local sont donc tous redirigés vers l’invite
normale.

Activé par défaut. Conditions nécessaires à son déclenchement :

- L’utilisateur du processus du Gateway (ou `sshVerify.user`) peut se connecter en SSH à l’hôte du Node
  de manière non interactive (clés/agent ; Tailscale SSH fonctionne également), et la clé de l’hôte est
  déjà approuvée.
- `openclaw` est résolu dans le `PATH` distant pour une exécution non interactive de `sh -lc`.
- L’adresse IP de connexion est une adresse directe (sans proxy et hors bouclage) privée, ULA,
  lien-local ou CGNAT, ou correspond à `sshVerify.cidrs` lorsque cette option est définie.
- Même seuil d’éligibilité que pour l’approbation par CIDR de confiance : uniquement un nouveau jumelage
  de Node sans portée ; les mises à niveau, navigateurs, Control UI et WebChat affichent toujours une invite.

Pendant l’exécution d’une sonde, le client Node est invité à continuer les nouvelles tentatives
(`wait_then_retry`) au lieu d’attendre une approbation manuelle ; si la sonde
échoue, la tentative suivante revient au flux d’invite normal. Les cibles en échec
sont soumises à un bref délai d’attente (5 minutes après une non-correspondance de clé).

Les appareils approuvés enregistrent `approvedVia: "ssh-verified"` et leur première surface de
capacités déclarée est approuvée au cours de la même étape : la correspondance de clé prouve déjà
que le Node s’exécute sous le compte de l’opérateur sur une machine qui lui appartient, ce qui correspond à la
même déclaration qu’une approbation manuelle des capacités. Les extensions ultérieures de la surface
nécessitent toujours une invite.

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

L’application macOS peut tenter une **approbation silencieuse** des demandes de capacités du Node
lorsque :

- la demande est marquée `silent` (le Gateway marque la première surface de capacités comme
  silencieuse lorsque le jumelage de l’appareil a été approuvé de manière non interactive), et
- l’application peut vérifier une connexion SSH à l’hôte du Gateway avec le même
  utilisateur.

Si l’approbation silencieuse échoue, elle revient à l’invite normale Approve/Reject.

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
- Il n’existe aucun mode d’approbation automatique globale du réseau local ou du réseau privé ; l’approbation automatique
  vérifiée par SSH (ci-dessus) exige une correspondance cryptographique de la clé de l’appareil, jamais
  la seule proximité réseau.
- Seule une nouvelle demande de jumelage d’appareil avec `role: node` et sans portée demandée est
  éligible.
- Les clients opérateur, navigateur, Control UI et WebChat restent soumis à une approbation manuelle.
- Les mises à niveau de rôle, de portée, de métadonnées et de clé publique restent manuelles.
- Les chemins d’en-têtes de proxy de confiance en bouclage sur le même hôte ne sont pas éligibles, car ce
  chemin peut être usurpé par des appelants locaux.

## Nettoyage par remplacement des jumelages silencieux

Les approbations non interactives enregistrent leur provenance dans la ligne de l’appareil jumelé :
les approbations par politique locale sur le même hôte sous la valeur `silent`, les approbations de Nodes par CIDR de confiance sous
`trusted-cidr`, et les approbations de Nodes vérifiées par SSH sous `ssh-verified`. Les clients dont le répertoire d’état est éphémère (répertoires personnels temporaires,
conteneurs, environnements isolés propres à chaque exécution) génèrent une nouvelle paire de clés d’appareil à chaque exécution, et chaque
exécution se jumelle silencieusement comme un appareil entièrement nouveau : sans nettoyage, la liste des appareils jumelés
s’allonge d’une ligne obsolète par exécution.

Lorsque le Gateway approuve silencieusement le jumelage d’un appareil **local**, il retire
les anciens enregistrements approuvés avec `silent` qui appartiennent au même groupe de clients
(même `clientId`, même `clientMode` et même nom d’affichage) et qui ne sont pas actuellement
connectés. Les clients locaux s’exécutent sur l’hôte du Gateway lui-même, de sorte que la clé du groupe
ne peut pas correspondre à une autre machine. Les lignes retirées perdent immédiatement leurs jetons ;
toute entrée correspondante de l’ancien jumelage de Node est effacée et un événement de suppression
`node.pair.resolved` est diffusé.

Limites :

- Seuls les enregistrements dont la dernière approbation était locale au même hôte (`silent`) sont
  éligibles, à la fois comme déclencheur et comme cible. Les jumelages par CIDR de confiance et ceux vérifiés par SSH
  traversent des hôtes sur lesquels les métadonnées d’affichage ne constituent pas une identité de machine ; ils ne sont donc
  jamais supprimés automatiquement : utilisez le nettoyage dans Control UI ou
  `openclaw nodes remove` pour ceux-ci.
- Les jumelages approuvés par le propriétaire et ceux effectués par QR/code de configuration (amorçage) ne sont jamais supprimés
  automatiquement. Les enregistrements approuvés avant l’existence des informations de provenance restent protégés,
  même après une approbation silencieuse ultérieure du même identifiant d’appareil.
- Les appareils actuellement connectés sont ignorés, afin que les sessions locales simultanées utilisant
  des répertoires d’état distincts conservent leurs jetons tant qu’elles sont actives. Les enregistrements approuvés
  au cours de la dernière minute sont également ignorés, afin que les négociations de jumelage simultanées
  ne puissent pas se retirer mutuellement avant l’enregistrement de leurs connexions.
- Les clients concernés sont locaux par construction ; ils se jumellent donc à nouveau silencieusement lors de
  leur prochaine connexion.

## Approbation automatique des mises à niveau de métadonnées

Lorsqu’un appareil déjà jumelé se reconnecte avec uniquement des modifications de métadonnées non sensibles
(par exemple le nom d’affichage ou des indications sur la plateforme cliente), OpenClaw traite
cela comme une `metadata-upgrade`. L’approbation automatique silencieuse est limitée : elle s’applique uniquement
aux reconnexions locales de confiance hors navigateur qui ont déjà prouvé la possession
d’identifiants locaux ou partagés, y compris les reconnexions d’applications natives sur le même hôte après
des modifications des métadonnées de version du système d’exploitation. Les clients navigateur/Control UI et les clients distants
utilisent toujours le flux explicite de réapprobation. Les mises à niveau de portée (lecture vers
écriture/administration) et les modifications de clé publique ne sont **pas** éligibles à
l’approbation automatique des mises à niveau de métadonnées ; elles restent des demandes explicites de réapprobation.

## Utilitaires de jumelage par QR

`/pair qr` restitue la charge utile d’appairage sous forme de média structuré afin que les clients mobiles et les navigateurs puissent la scanner directement.

La suppression d’un appareil élimine également toutes les demandes d’appairage en attente obsolètes associées à l’identifiant de cet appareil, afin que `nodes pending` n’affiche pas de lignes orphelines après une révocation.

## Localité et en-têtes transférés

L’appairage du Gateway considère une connexion comme provenant de l’interface de bouclage uniquement lorsque le socket brut et les éventuelles informations fournies par un proxy en amont concordent. Si une requête arrive sur l’interface de bouclage, mais contient des informations dans les en-têtes `Forwarded`, `X-Forwarded-*` ou `X-Real-IP`, ces informations invalident l’hypothèse de localité liée à l’interface de bouclage, et le processus d’appairage exige une approbation explicite au lieu de traiter silencieusement la requête comme une connexion provenant du même hôte. Consultez
[Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth) pour connaître la règle équivalente applicable à l’authentification de l’opérateur.

## Stockage (local et privé)

L’état de l’appairage est conservé dans les enregistrements des appareils appairés au sein de la base de données d’état SQLite partagée, sous le répertoire d’état du Gateway (par défaut `~/.openclaw`) :

- `~/.openclaw/state/openclaw.sqlite` (appareils appairés avec authentification de l’appareil,
  surfaces Node approuvées, demandes de surface en attente, demandes d’appairage
  d’appareil en attente et jetons d’amorçage)

Si vous remplacez `OPENCLAW_STATE_DIR`, la base de données est déplacée avec ce répertoire. Les Gateways
mis à niveau depuis des versions utilisant des stockages JSON les importent au démarrage et conservent
des archives `devices/*.json.migrated` et `nodes/*.json.migrated`.

Remarques de sécurité :

- Les jetons d’appareil sont des secrets ; traitez la base de données d’état comme sensible.
- La rotation d’un jeton d’appareil utilise `openclaw devices rotate` /
  `device.token.rotate`.

## Comportement du transport

- Le transport est **sans état** ; il ne stocke aucune appartenance.
- Si le Gateway est hors ligne ou si l’appairage est désactivé, les Nodes ne peuvent pas être appairés.
- En mode distant, l’appairage s’effectue dans le stockage du Gateway distant.

## Contenu associé

- [Appairage des canaux](/fr/channels/pairing)
- [CLI des Nodes](/fr/cli/nodes)
- [CLI des appareils](/fr/cli/devices)
