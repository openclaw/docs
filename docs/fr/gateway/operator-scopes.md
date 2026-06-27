---
read_when:
    - Débogage des erreurs de portée opérateur manquante
    - Examiner les approbations de jumelage d’appareils ou de nœuds
    - Ajout ou classification de méthodes RPC Gateway
summary: Rôles d’opérateur, périmètres et vérifications au moment de l’approbation pour les clients Gateway
title: Portées opérateur
x-i18n:
    generated_at: "2026-06-27T17:32:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc59453ae1a73b52276185de2cedd1ed4da027111168eda8107d6ba0b74aec2f
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Les portées d’opérateur définissent ce qu’un client Gateway peut faire après son authentification.
Elles constituent un garde-fou du plan de contrôle dans un même domaine d’opérateur Gateway de confiance,
et non une isolation multilocataire hostile. Si vous avez besoin d’une séparation forte entre
des personnes, des équipes ou des machines, exécutez des Gateways séparés sous des utilisateurs système ou
des hôtes distincts.

Voir aussi : [Sécurité](/fr/gateway/security), [Protocole Gateway](/fr/gateway/protocol),
[Appairage Gateway](/fr/gateway/pairing), [CLI des appareils](/fr/cli/devices).

## Rôles

Les clients WebSocket Gateway se connectent avec un rôle :

- `operator` : clients du plan de contrôle tels que la CLI, l’interface Control UI, l’automatisation et
  les processus d’assistance de confiance.
- `node` : hôtes de capacités tels que macOS, iOS, Android ou des nœuds sans interface qui
  exposent des commandes via `node.invoke`.

Les méthodes RPC d’opérateur nécessitent le rôle `operator`. Les méthodes initiées par un nœud
nécessitent le rôle `node`.

## Niveaux de portée

| Portée                  | Signification                                                                                                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | État, listes, catalogue, journaux, lectures de session et autres appels du plan de contrôle non modificatifs en lecture seule.                                                                                |
| `operator.write`        | Actions d’opérateur modificatives normales, comme l’envoi de messages, l’invocation d’outils, la mise à jour des paramètres talk/voice et le relais de commandes de nœud. Satisfait également `operator.read`. |
| `operator.admin`        | Accès administratif au plan de contrôle. Satisfait toutes les portées `operator.*`. Requis pour la mutation de configuration, les mises à jour, les hooks natifs, les espaces de noms réservés sensibles et les approbations à haut risque. |
| `operator.pairing`      | Gestion de l’appairage des appareils et des nœuds, notamment la liste, l’approbation, le rejet, la suppression, la rotation et la révocation des enregistrements d’appairage ou des jetons d’appareil.       |
| `operator.approvals`    | API d’approbation d’exécution et de Plugin.                                                                                                                                                                  |
| `operator.talk.secrets` | Lecture de la configuration Talk avec les secrets inclus.                                                                                                                                                     |

Les futures portées `operator.*` inconnues nécessitent une correspondance exacte, sauf si l’appelant possède
`operator.admin`.

## La portée de méthode n’est que le premier garde-fou

Chaque RPC Gateway possède une portée de méthode de moindre privilège. Cette portée de méthode décide
si la requête peut atteindre le gestionnaire. Certains gestionnaires appliquent ensuite des contrôles
plus stricts au moment de l’approbation, selon l’élément concret approuvé ou modifié.

Exemples :

- `device.pair.approve` est accessible avec `operator.pairing`, mais l’approbation d’un
  appareil opérateur ne peut créer ou préserver que les portées que l’appelant détient déjà.
- `node.pair.approve` est accessible avec `operator.pairing`, puis dérive des portées
  d’approbation supplémentaires à partir de la liste de commandes de nœud en attente.
- `chat.send` est normalement une méthode à portée d’écriture, mais les commandes persistantes `/config set`
  et `/config unset` nécessitent `operator.admin` au niveau de la commande.

Cela permet aux opérateurs dotés de portées inférieures d’effectuer des actions d’appairage à faible risque sans rendre
toutes les approbations d’appairage réservées aux administrateurs.

## Approbations d’appairage d’appareil

Les enregistrements d’appairage d’appareil sont la source durable des rôles et portées approuvés.
Les appareils déjà appairés n’obtiennent pas silencieusement un accès plus large : les reconnexions qui demandent
un rôle ou des portées plus larges créent une nouvelle demande de mise à niveau en attente.

Lors de l’approbation d’une demande d’appareil :

- Une demande sans rôle d’opérateur ne nécessite pas d’approbation de portée de jeton d’opérateur.
- Une demande pour un rôle d’appareil non opérateur, tel que `node`, nécessite
  `operator.admin`, même lorsque `device.pair.approve` est accessible avec
  `operator.pairing`.
- Une demande pour `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` ou `operator.talk.secrets` nécessite que l’appelant détienne
  ces portées, ou `operator.admin`.
- Une demande pour `operator.admin` nécessite `operator.admin`.
- Une demande de réparation sans portées explicites peut hériter des portées de jeton d’opérateur
  existantes. Si ce jeton existant a une portée d’administration, l’approbation nécessite toujours
  `operator.admin`.

Les sessions à secret partagé et à proxy de confiance non administratrices peuvent approuver les demandes d’appareil opérateur
uniquement dans leurs propres portées d’opérateur déclarées. L’approbation de rôles non opérateur
est réservée aux administrateurs, même lorsque ces sessions peuvent par ailleurs utiliser
`operator.pairing`.

Pour les sessions avec jeton d’appareil appairé, la gestion est également limitée à soi-même, sauf si
l’appelant possède `operator.admin` : les appelants non administrateurs ne voient que leurs propres
entrées d’appairage, ne peuvent approuver ou rejeter que leur propre demande en attente, et ne peuvent effectuer une rotation,
révoquer ou supprimer que leur propre entrée d’appareil.

## Approbations d’appairage de nœud

L’ancien `node.pair.*` utilise un magasin d’appairage de nœuds séparé appartenant au Gateway. Les nœuds WS
utilisent l’appairage d’appareil avec `role: node`, mais le même vocabulaire de niveau d’approbation
s’applique.

`node.pair.approve` utilise la liste de commandes de la demande en attente pour dériver les portées
supplémentaires requises :

- Demande sans commande : `operator.pairing`
- Commandes de nœud hors exécution : `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` ou `system.which` :
  `operator.pairing` + `operator.admin`

L’appairage de nœud établit l’identité et la confiance. Il ne remplace pas la politique
d’approbation d’exécution `system.run` propre au nœud.

## Authentification par secret partagé

L’authentification par jeton/mot de passe Gateway partagé est traitée comme un accès opérateur de confiance pour
ce Gateway. Les surfaces HTTP compatibles OpenAI, `/tools/invoke` et les points de terminaison HTTP d’historique de session
restaurent l’ensemble normal complet des portées d’opérateur par défaut pour l’authentification bearer par secret partagé,
même si un appelant envoie des portées déclarées plus étroites.

Les modes porteurs d’identité, tels que l’authentification par proxy de confiance ou `none` pour l’ingress privé,
peuvent toujours respecter les portées déclarées explicites. Utilisez des Gateways séparés pour une véritable
séparation des frontières de confiance.
