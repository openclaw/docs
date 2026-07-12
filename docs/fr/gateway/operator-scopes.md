---
read_when:
    - Débogage des erreurs d’absence de portée opérateur
    - Examen des approbations d’appairage d’appareils ou de Node
    - Ajout ou classification des méthodes RPC du Gateway
summary: Rôles des opérateurs, portées et vérifications au moment de l’approbation pour les clients du Gateway
title: Portées des opérateurs
x-i18n:
    generated_at: "2026-07-12T15:25:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cfda4486e8d31c01fb7ffff398dcc678d298194f0f0ce6308ae9e5388f5a2856
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Les portées d’opérateur déterminent ce qu’un client Gateway peut faire après son authentification.
Elles constituent un garde-fou du plan de contrôle au sein d’un même domaine d’opérateur Gateway de confiance,
et non une isolation hostile entre plusieurs locataires. Pour assurer une séparation forte entre des personnes,
des équipes ou des machines, exécutez des Gateways distincts sous des utilisateurs de système d’exploitation ou sur des hôtes distincts.

Voir aussi : [Sécurité](/fr/gateway/security), [Protocole Gateway](/fr/gateway/protocol),
[Appairage Gateway](/fr/gateway/pairing), [CLI des appareils](/fr/cli/devices).

## Rôles

Chaque client WebSocket Gateway se connecte avec un rôle :

- `operator` : clients du plan de contrôle tels que la CLI, l’interface de contrôle, les automatisations et
  les processus auxiliaires de confiance.
- `node` : hôtes de capacités (macOS, iOS, Android, sans interface graphique) qui exposent
  des commandes via `node.invoke`.

Les méthodes RPC d’opérateur nécessitent le rôle `operator` ; les méthodes provenant d’un Node
nécessitent le rôle `node`.

## Niveaux de portée

| Portée                  | Signification                                                                                                                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | État, listes, catalogue, journaux, lecture des sessions et autres appels sans mutation, en lecture seule.                                                                                           |
| `operator.write`        | Actions d’opérateur avec mutation : envoi de messages, invocation d’outils, mise à jour des paramètres de conversation/voix, relais de commandes de Node. Satisfait également `operator.read`.       |
| `operator.admin`        | Accès administratif. Satisfait toutes les portées `operator.*`. Requis pour la modification de la configuration, les mises à jour, les hooks natifs, les espaces de noms réservés et les approbations à haut risque. |
| `operator.pairing`      | Gestion de l’appairage des appareils et des Nodes : répertorier, approuver, rejeter, supprimer, renouveler, révoquer.                                                                                |
| `operator.approvals`    | API d’approbation d’exécution et de Plugin.                                                                                                                                                          |
| `operator.talk.secrets` | Lecture de la configuration de conversation avec les secrets inclus.                                                                                                                                |

Les futures portées `operator.*` inconnues nécessitent une correspondance exacte, sauf si l’appelant
détient déjà `operator.admin`.

## La portée de la méthode n’est que le premier contrôle

Chaque RPC Gateway possède une portée de méthode fondée sur le moindre privilège, qui détermine si une
requête atteint son gestionnaire. Certains gestionnaires appliquent ensuite des contrôles plus stricts selon
l’élément concret approuvé ou modifié :

- `device.pair.approve` est accessible avec `operator.pairing`, mais l’approbation d’un
  appareil d’opérateur ne peut créer ou préserver que les portées que l’appelant détient déjà.
- `node.pair.approve` est accessible avec `operator.pairing`, puis déduit des portées
  d’approbation supplémentaires à partir de la liste de commandes déclarée par le Node en attente.
- `chat.send` est une méthode nécessitant une portée d’écriture, mais les commandes de conversation `/config set` et
  `/config unset` nécessitent en plus `operator.admin`,
  quelle que soit la portée d’envoi de conversation de l’appelant.

Cela permet aux opérateurs disposant de portées inférieures d’effectuer des actions d’appairage à faible risque sans
exiger un accès administrateur pour toutes les approbations d’appairage.

## Approbations d’appairage des appareils

Les enregistrements d’appairage des appareils constituent la source durable des rôles et portées approuvés.
Un appareil déjà appairé n’obtient pas silencieusement un accès plus étendu : une reconnexion
qui demande un rôle ou des portées plus larges crée une nouvelle demande de mise à niveau en attente.

Lors de l’approbation d’une demande d’appareil :

- Une demande sans rôle d’opérateur ne nécessite pas d’approbation de portée d’opérateur.
- Une demande concernant un rôle d’appareil autre qu’opérateur (par exemple `node`) nécessite
  `operator.admin`, même si `device.pair.approve` lui-même ne nécessite que
  `operator.pairing`.
- Une demande concernant `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` ou `operator.talk.secrets` exige que l’appelant détienne déjà
  cette portée, ou `operator.admin`.
- Une demande concernant `operator.admin` nécessite `operator.admin`.
- Une demande de réparation sans portées explicites peut hériter des portées du jeton
  d’opérateur existant ; si ce jeton dispose d’une portée d’administration, l’approbation nécessite tout de même
  `operator.admin`.

Les sessions non administratrices utilisant un secret partagé ou un proxy de confiance ne peuvent approuver
les demandes d’appareils d’opérateur que dans les limites de leurs propres portées d’opérateur déclarées ; l’approbation
de rôles autres qu’opérateur est réservée aux administrateurs, même lorsque ces sessions peuvent par ailleurs utiliser
`operator.pairing`.

Pour les sessions utilisant un jeton d’appareil appairé, la gestion est limitée à soi-même, sauf si l’appelant
détient `operator.admin` : un appelant non administrateur ne voit que ses propres entrées d’appairage et
ne peut approuver, rejeter, renouveler, révoquer ou supprimer que l’entrée de son propre appareil.

## Approbations d’appairage des Nodes

Les anciennes méthodes `node.pair.*` utilisent un magasin d’appairage de Nodes distinct, détenu par le Gateway.
Les Nodes WS utilisent à la place l’appairage d’appareils (`role: node`), mais le même vocabulaire
d’approbation s’applique. Consultez [Appairage Gateway](/fr/gateway/pairing) pour comprendre la relation entre les deux
magasins.

`node.pair.approve` déduit des portées supplémentaires requises à partir de la liste de commandes
de la demande en attente :

| Commandes déclarées                                    | Portées requises                      |
| ------------------------------------------------------ | ------------------------------------- |
| aucune                                                 | `operator.pairing`                    |
| commandes de Node autres que celles d’exécution        | `operator.pairing` + `operator.write` |
| `system.run`, `system.run.prepare` ou `system.which`   | `operator.pairing` + `operator.admin` |

L’approbation d’une déclaration de Node n’active pas les commandes soumises à une liste d’autorisation
d’exécution distincte. Par exemple, l’approbation d’un Node qui déclare
`computer.act` nécessite les portées d’appairage et d’écriture, mais ne fait qu’enregistrer la surface.
Un administrateur ou un propriétaire doit toujours armer `computer.act`. Tant qu’elle reste
armée, son invocation via la méthode `node.invoke`, soumise à une portée d’écriture, ne
nécessite pas de portée d’administration pour chaque action.

L’appairage d’un Node établit son identité et la confiance ; il ne remplace pas la propre
politique d’approbation d’exécution `system.run` du Node.

## Authentification par secret partagé

L’authentification par jeton/mot de passe partagé du Gateway est considérée comme un accès d’opérateur de confiance pour
ce Gateway. Les surfaces HTTP compatibles avec OpenAI, `/tools/invoke` et les points de terminaison HTTP
d’historique de session rétablissent l’ensemble complet des portées d’opérateur par défaut pour
l’authentification par jeton porteur à secret partagé, même si un appelant envoie des portées déclarées plus restreintes.

Les modes associés à une identité, tels que l’authentification par proxy de confiance ou `none` pour une entrée privée,
peuvent toujours respecter les portées explicitement déclarées. Utilisez des Gateways distincts pour une véritable séparation
des limites de confiance.
