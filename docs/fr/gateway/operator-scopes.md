---
read_when:
    - Débogage des erreurs de portée d’opérateur manquante
    - Examiner les approbations d’appairage des appareils ou des nœuds
    - Ajout ou classification de méthodes RPC du Gateway
summary: Rôles des opérateurs, portées et vérifications au moment de l’approbation pour les clients Gateway
title: Portées des opérateurs
x-i18n:
    generated_at: "2026-05-04T02:25:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: f05d6bdbf9bdad2aef1c9664bb7ebb4b6241334b8aefac7993104e9977e40450
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Les périmètres d’opérateur définissent ce qu’un client Gateway peut faire après s’être authentifié.
Ils constituent un garde-fou du plan de contrôle au sein d’un domaine d’opérateur Gateway de confiance,
pas une isolation multi-locataire hostile. Si vous avez besoin d’une séparation forte entre
personnes, équipes ou machines, exécutez des Gateways distincts sous des utilisateurs d’OS ou
des hôtes distincts.

Connexe : [Sécurité](/fr/gateway/security), [protocole Gateway](/fr/gateway/protocol),
[appairage Gateway](/fr/gateway/pairing), [CLI des appareils](/fr/cli/devices).

## Rôles

Les clients WebSocket Gateway se connectent avec un seul rôle :

- `operator` : clients du plan de contrôle tels que CLI, Control UI, automatisation et
  processus auxiliaires de confiance.
- `node` : hôtes de capacités tels que macOS, iOS, Android, ou Nodes sans interface qui
  exposent des commandes via `node.invoke`.

Les méthodes RPC d’opérateur exigent le rôle `operator`. Les méthodes initiées par un Node
exigent le rôle `node`.

## Niveaux de périmètre

| Périmètre               | Signification                                                                                                                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Statut en lecture seule, listes, catalogue, journaux, lectures de session et autres appels non mutateurs du plan de contrôle.                                                                                    |
| `operator.write`        | Actions d’opérateur mutatrices normales, telles que l’envoi de messages, l’invocation d’outils, la mise à jour des paramètres talk/voix et le relais de commandes Node. Satisfait aussi `operator.read`.         |
| `operator.admin`        | Accès administratif au plan de contrôle. Satisfait chaque périmètre `operator.*`. Requis pour la mutation de configuration, les mises à jour, les hooks natifs, les espaces de noms réservés sensibles et les approbations à haut risque. |
| `operator.pairing`      | Gestion de l’appairage des appareils et Nodes, y compris la liste, l’approbation, le rejet, la suppression, la rotation et la révocation des enregistrements d’appairage ou des jetons d’appareil.                |
| `operator.approvals`    | API d’approbation d’exécution et de plugin.                                                                                                                                                                      |
| `operator.talk.secrets` | Lecture de la configuration Talk avec les secrets inclus.                                                                                                                                                        |

Les futurs périmètres `operator.*` inconnus exigent une correspondance exacte, sauf si l’appelant possède
`operator.admin`.

## Le périmètre de méthode n’est que le premier garde-fou

Chaque RPC Gateway possède un périmètre de méthode de moindre privilège. Ce périmètre de méthode décide
si la requête peut atteindre le gestionnaire. Certains gestionnaires appliquent ensuite des vérifications
plus strictes au moment de l’approbation, selon l’élément concret approuvé ou modifié.

Exemples :

- `device.pair.approve` est accessible avec `operator.pairing`, mais l’approbation d’un
  appareil opérateur ne peut créer ni préserver que les périmètres que l’appelant détient déjà.
- `node.pair.approve` est accessible avec `operator.pairing`, puis dérive des périmètres
  d’approbation supplémentaires à partir de la liste de commandes Node en attente.
- `chat.send` est normalement une méthode à périmètre d’écriture, mais les commandes persistantes `/config set`
  et `/config unset` exigent `operator.admin` au niveau de la commande.

Cela permet aux opérateurs à périmètre réduit d’effectuer des actions d’appairage à faible risque sans rendre
toutes les approbations d’appairage réservées aux administrateurs.

## Approbations d’appairage des appareils

Les enregistrements d’appairage des appareils sont la source durable des rôles et périmètres approuvés.
Les appareils déjà appairés n’obtiennent pas silencieusement un accès plus large : les reconnexions qui demandent
un rôle plus large ou des périmètres plus larges créent une nouvelle demande de mise à niveau en attente.

Lors de l’approbation d’une demande d’appareil :

- Une demande sans rôle opérateur n’a pas besoin d’approbation de périmètre de jeton opérateur.
- Une demande pour `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` ou `operator.talk.secrets` exige que l’appelant détienne
  ces périmètres, ou `operator.admin`.
- Une demande pour `operator.admin` exige `operator.admin`.
- Une demande de réparation sans périmètres explicites peut hériter des périmètres du jeton opérateur
  existant. Si ce jeton existant possède un périmètre administrateur, l’approbation exige tout de même
  `operator.admin`.

Pour les sessions de jeton d’appareil appairé, la gestion est auto-périmétrée sauf si l’appelant
possède aussi `operator.admin` : les appelants non administrateurs ne voient que leurs propres entrées d’appairage,
peuvent approuver ou rejeter uniquement leur propre demande en attente, et peuvent effectuer une rotation, révoquer ou
supprimer uniquement leur propre entrée d’appareil.

## Approbations d’appairage Node

L’ancien `node.pair.*` utilise un magasin d’appairage Node distinct détenu par Gateway. Les Nodes WS
utilisent l’appairage d’appareil avec `role: node`, mais le même vocabulaire de niveau d’approbation
s’applique.

`node.pair.approve` utilise la liste de commandes de la demande en attente pour dériver des périmètres
requis supplémentaires :

- Demande sans commande : `operator.pairing`
- Commandes Node sans exécution : `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` ou `system.which` :
  `operator.pairing` + `operator.admin`

L’appairage Node établit l’identité et la confiance. Il ne remplace pas la politique
d’approbation d’exécution `system.run` propre au Node.

## Authentification par secret partagé

L’authentification par jeton/mot de passe Gateway partagé est traitée comme un accès opérateur de confiance pour
ce Gateway. Les surfaces HTTP compatibles OpenAI et `/tools/invoke` restaurent l’ensemble normal complet
des périmètres d’opérateur par défaut pour l’authentification par porteur à secret partagé, même si un
appelant envoie des périmètres déclarés plus étroits.

Les modes porteurs d’identité, tels que l’authentification par proxy de confiance ou `none` en ingress privé,
peuvent toujours respecter des périmètres déclarés explicites. Utilisez des Gateways distincts pour une véritable
séparation des limites de confiance.
