---
read_when:
    - Débogage des erreurs liées à l’absence de portée d’opérateur
    - Examen des approbations d’appairage d’appareils ou de Node
    - Ajout ou classification de méthodes RPC du Gateway
summary: Rôles des opérateurs, portées et vérifications lors de l’approbation pour les clients Gateway
title: Portées des opérateurs
x-i18n:
    generated_at: "2026-07-12T02:38:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cfda4486e8d31c01fb7ffff398dcc678d298194f0f0ce6308ae9e5388f5a2856
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Les portées d’opérateur déterminent ce qu’un client du Gateway peut faire après s’être authentifié.
Elles constituent un garde-fou du plan de contrôle au sein d’un même domaine d’opérateur Gateway de confiance,
et non une isolation hostile entre plusieurs locataires. Pour assurer une séparation forte entre des personnes,
des équipes ou des machines, exécutez des Gateways distincts sous des utilisateurs du système d’exploitation ou sur des hôtes distincts.

Voir aussi : [Sécurité](/fr/gateway/security), [Protocole du Gateway](/fr/gateway/protocol),
[Appairage du Gateway](/fr/gateway/pairing), [CLI des appareils](/fr/cli/devices).

## Rôles

Chaque client WebSocket du Gateway se connecte avec un rôle :

- `operator` : clients du plan de contrôle tels que la CLI, l’interface de contrôle, les automatisations et
  les processus auxiliaires de confiance.
- `node` : hôtes de capacités (macOS, iOS, Android, sans interface graphique) qui exposent
  des commandes via `node.invoke`.

Les méthodes RPC d’opérateur nécessitent le rôle `operator` ; les méthodes provenant d’un Node
nécessitent le rôle `node`.

## Niveaux de portée

| Portée                  | Signification                                                                                                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | État, listes, catalogue, journaux, consultation des sessions et autres appels sans mutation, en lecture seule.                                                                                                |
| `operator.write`        | Actions d’opérateur avec mutation : envoi de messages, appel d’outils, mise à jour des paramètres de conversation et de voix, relais de commandes vers un Node. Satisfait également `operator.read`.           |
| `operator.admin`        | Accès administratif. Satisfait toutes les portées `operator.*`. Requis pour la modification de la configuration, les mises à jour, les hooks natifs, les espaces de noms réservés et les approbations à haut risque. |
| `operator.pairing`      | Gestion de l’appairage des appareils et des Nodes : lister, approuver, rejeter, supprimer, renouveler, révoquer.                                                                                               |
| `operator.approvals`    | API d’approbation des exécutions et des Plugins.                                                                                                                                                               |
| `operator.talk.secrets` | Lecture de la configuration de Talk avec les secrets inclus.                                                                                                                                                   |

Les futures portées `operator.*` inconnues nécessitent une correspondance exacte, sauf si l’appelant
dispose déjà de `operator.admin`.

## La portée de la méthode n’est que le premier contrôle

Chaque RPC du Gateway possède une portée de méthode fondée sur le moindre privilège qui détermine si une
requête atteint son gestionnaire. Certains gestionnaires appliquent ensuite des contrôles plus stricts selon
l’élément concret approuvé ou modifié :

- `device.pair.approve` est accessible avec `operator.pairing`, mais l’approbation d’un
  appareil d’opérateur ne peut créer ou conserver que les portées que l’appelant possède déjà.
- `node.pair.approve` est accessible avec `operator.pairing`, puis déduit des portées
  d’approbation supplémentaires à partir de la liste de commandes déclarée par le Node en attente.
- `chat.send` est une méthode à portée d’écriture, mais les commandes de conversation `/config set` et
  `/config unset` nécessitent en plus `operator.admin`,
  quelle que soit la portée d’envoi de conversation de l’appelant.

Cela permet aux opérateurs disposant de portées limitées d’effectuer des actions d’appairage à faible risque sans
réserver toutes les approbations d’appairage aux administrateurs.

## Approbations d’appairage des appareils

Les enregistrements d’appairage des appareils constituent la source persistante des rôles et portées approuvés.
Un appareil déjà appairé n’obtient pas silencieusement un accès plus étendu : une reconnexion
demandant un rôle ou des portées plus étendus crée une nouvelle demande de mise à niveau en attente.

Lors de l’approbation d’une demande d’appareil :

- Une demande sans rôle d’opérateur ne nécessite pas d’approbation de portée d’opérateur.
- Une demande de rôle d’appareil autre qu’opérateur (par exemple `node`) nécessite
  `operator.admin`, même si `device.pair.approve` ne nécessite lui-même que
  `operator.pairing`.
- Une demande de `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` ou `operator.talk.secrets` nécessite que l’appelant dispose déjà
  de cette portée, ou de `operator.admin`.
- Une demande de `operator.admin` nécessite `operator.admin`.
- Une demande de réparation sans portées explicites peut hériter des portées du jeton
  d’opérateur existant ; si ce jeton possède une portée d’administration, l’approbation nécessite tout de même
  `operator.admin`.

Les sessions non administratrices utilisant un secret partagé ou un proxy de confiance ne peuvent approuver
les demandes d’appareils d’opérateur que dans les limites de leurs propres portées d’opérateur déclarées ; l’approbation
des rôles autres qu’opérateur est réservée aux administrateurs, même lorsque ces sessions peuvent par ailleurs utiliser
`operator.pairing`.

Pour les sessions utilisant le jeton d’un appareil appairé, la gestion est limitée à l’appareil lui-même, sauf si l’appelant
dispose de `operator.admin` : un appelant non administrateur ne voit que ses propres entrées d’appairage et
ne peut approuver, rejeter, renouveler, révoquer ou supprimer que l’entrée de son propre appareil.

## Approbations d’appairage des Nodes

Les anciennes méthodes `node.pair.*` utilisent un magasin d’appairage de Nodes distinct appartenant au Gateway.
Les Nodes WS utilisent plutôt l’appairage d’appareils (`role: node`), mais le même vocabulaire
d’approbation s’applique. Consultez [Appairage du Gateway](/fr/gateway/pairing) pour comprendre la relation entre les deux
magasins.

`node.pair.approve` déduit les portées supplémentaires requises à partir de la liste de commandes
de la demande en attente :

| Commandes déclarées                                    | Portées requises                         |
| ------------------------------------------------------ | ---------------------------------------- |
| aucune                                                  | `operator.pairing`                       |
| commandes de Node autres que celles d’exécution        | `operator.pairing` + `operator.write`    |
| `system.run`, `system.run.prepare` ou `system.which`   | `operator.pairing` + `operator.admin`    |

L’approbation d’une déclaration de Node n’active pas les commandes soumises à une liste d’autorisation
d’exécution distincte. Par exemple, l’approbation d’un Node qui déclare
`computer.act` nécessite la portée d’appairage et celle d’écriture, mais enregistre uniquement cette surface.
Un administrateur ou un propriétaire doit toujours activer `computer.act`. Tant qu’elle reste
activée, son invocation via la méthode `node.invoke` à portée d’écriture ne
nécessite pas de portée d’administration pour chaque action.

L’appairage d’un Node établit son identité et la confiance qui lui est accordée ; il ne remplace pas la politique
d’approbation des exécutions `system.run` propre au Node.

## Authentification par secret partagé

L’authentification par jeton ou mot de passe partagé du Gateway est considérée comme un accès d’opérateur de confiance pour
ce Gateway. Les surfaces HTTP compatibles avec OpenAI, `/tools/invoke` et les points de terminaison HTTP
d’historique des sessions rétablissent l’ensemble complet des portées d’opérateur par défaut pour
l’authentification par jeton porteur fondée sur un secret partagé, même si un appelant envoie des portées déclarées plus restreintes.

Les modes associés à une identité, tels que l’authentification par proxy de confiance ou `none` pour une entrée privée,
peuvent toujours respecter les portées explicitement déclarées. Utilisez des Gateways distincts pour séparer de véritables
frontières de confiance.
