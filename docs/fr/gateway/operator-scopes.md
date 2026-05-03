---
read_when:
    - Débogage des erreurs de portée d’opérateur manquante
    - Examen des approbations d’appairage d’appareils ou de Node
    - Ajouter ou classer les méthodes RPC du Gateway
summary: Rôles d’opérateur, portées et vérifications au moment de l’approbation pour les clients Gateway
title: Périmètres d’opérateur
x-i18n:
    generated_at: "2026-05-03T07:09:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48f59f96b41333af9124ad4083ac5442eedb2d6cebdfff74e3ba256f06d36add
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Les portées d'opérateur définissent ce qu'un client Gateway peut faire après authentification.
Elles constituent un garde-fou du plan de contrôle au sein d'un domaine d'opérateur Gateway de confiance,
et non une isolation multilocataire face à des acteurs hostiles. Si vous avez besoin d'une séparation forte entre
des personnes, des équipes ou des machines, exécutez des Gateways séparés sous des utilisateurs ou
hôtes d'OS distincts.

Connexe : [Sécurité](/fr/gateway/security), [protocole Gateway](/fr/gateway/protocol),
[appairage Gateway](/fr/gateway/pairing), [CLI des appareils](/fr/cli/devices).

## Rôles

Les clients WebSocket Gateway se connectent avec un rôle :

- `operator` : clients du plan de contrôle tels que la CLI, l'interface de contrôle, l'automatisation et
  les processus d'assistance de confiance.
- `node` : hôtes de capacités tels que macOS, iOS, Android ou des nœuds sans interface qui
  exposent des commandes via `node.invoke`.

Les méthodes RPC d'opérateur nécessitent le rôle `operator`. Les méthodes provenant d'un Node
nécessitent le rôle `node`.

## Niveaux de portée

| Portée                  | Signification                                                                                                                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | État en lecture seule, listes, catalogue, journaux, lectures de sessions et autres appels du plan de contrôle qui ne modifient rien.                                                               |
| `operator.write`        | Actions d'opérateur modificatrices normales, comme envoyer des messages, invoquer des outils, mettre à jour les réglages de conversation/voix et relayer des commandes de nœud. Satisfait aussi `operator.read`. |
| `operator.admin`        | Accès administratif au plan de contrôle. Satisfait toutes les portées `operator.*`. Requis pour la modification de configuration, les mises à jour, les hooks natifs, les espaces de noms réservés sensibles et les approbations à haut risque. |
| `operator.pairing`      | Gestion de l'appairage des appareils et des nœuds, y compris lister, approuver, rejeter, supprimer, faire pivoter et révoquer les enregistrements d'appairage ou les jetons d'appareil.           |
| `operator.approvals`    | API d'approbation d'exécution et de Plugin.                                                                                                                                                         |
| `operator.talk.secrets` | Lecture de la configuration Talk avec les secrets inclus.                                                                                                                                            |

Les futures portées `operator.*` inconnues nécessitent une correspondance exacte, sauf si l'appelant possède
`operator.admin`.

## La portée de méthode n'est que le premier contrôle

Chaque RPC Gateway possède une portée de méthode de moindre privilège. Cette portée de méthode décide
si la requête peut atteindre le gestionnaire. Certains gestionnaires appliquent ensuite des contrôles plus stricts
au moment de l'approbation, selon l'élément concret approuvé ou modifié.

Exemples :

- `device.pair.approve` est accessible avec `operator.pairing`, mais l'approbation d'un
  appareil opérateur ne peut émettre ou conserver que les portées que l'appelant possède déjà.
- `node.pair.approve` est accessible avec `operator.pairing`, puis dérive des portées
  d'approbation supplémentaires depuis la liste de commandes de nœud en attente.
- `chat.send` est normalement une méthode avec portée d'écriture, mais les commandes persistantes `/config set`
  et `/config unset` nécessitent `operator.admin` au niveau de la commande.

Cela permet aux opérateurs à portée plus limitée d'effectuer des actions d'appairage à faible risque sans rendre
toutes les approbations d'appairage réservées aux administrateurs.

## Approbations d'appairage d'appareils

Les enregistrements d'appairage d'appareils sont la source durable des rôles et portées approuvés.
Les appareils déjà appairés n'obtiennent pas silencieusement un accès plus large : les reconnexions qui demandent
un rôle plus large ou des portées plus larges créent une nouvelle demande de mise à niveau en attente.

Lors de l'approbation d'une demande d'appareil :

- Une demande sans rôle d'opérateur n'a pas besoin d'approbation de portée de jeton d'opérateur.
- Une demande pour `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` ou `operator.talk.secrets` nécessite que l'appelant possède
  ces portées, ou `operator.admin`.
- Une demande pour `operator.admin` nécessite `operator.admin`.
- Une demande de réparation sans portées explicites peut hériter des portées du jeton
  d'opérateur existant. Si ce jeton existant a une portée d'administration, l'approbation nécessite toujours
  `operator.admin`.

Pour les sessions de jeton d'appareil appairé, la gestion est limitée à soi-même sauf si l'appelant
possède aussi `operator.admin` : les appelants non administrateurs peuvent faire pivoter, révoquer ou supprimer uniquement
leur propre entrée d'appareil.

## Approbations d'appairage de nœuds

L'ancien `node.pair.*` utilise un magasin d'appairage de nœuds distinct appartenant au Gateway. Les nœuds WS
utilisent l'appairage d'appareils avec `role: node`, mais le même vocabulaire de niveau d'approbation
s'applique.

`node.pair.approve` utilise la liste de commandes de la demande en attente pour dériver les portées
supplémentaires requises :

- Demande sans commande : `operator.pairing`
- Commandes de nœud hors exécution : `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` ou `system.which` :
  `operator.pairing` + `operator.admin`

L'appairage de nœuds établit l'identité et la confiance. Il ne remplace pas la politique d'approbation
d'exécution `system.run` propre au nœud.

## Authentification par secret partagé

L'authentification par jeton/mot de passe Gateway partagé est traitée comme un accès opérateur de confiance pour
ce Gateway. Les surfaces HTTP compatibles OpenAI et `/tools/invoke` rétablissent l'ensemble normal complet
des portées d'opérateur par défaut pour l'authentification bearer par secret partagé, même si un
appelant envoie des portées déclarées plus étroites.

Les modes porteurs d'identité, comme l'authentification par proxy de confiance ou `none` en entrée privée,
peuvent toujours respecter les portées déclarées explicitement. Utilisez des Gateways séparés pour une séparation
réelle des limites de confiance.
