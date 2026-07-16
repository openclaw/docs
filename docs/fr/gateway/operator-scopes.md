---
read_when:
    - Débogage des erreurs d’absence de portée d’opérateur
    - Examen des approbations d’appairage d’appareils ou de Nodes
    - Ajout ou classification des méthodes RPC du Gateway
summary: Rôles des opérateurs, portées et vérifications lors de l’approbation pour les clients du Gateway
title: Portées des opérateurs
x-i18n:
    generated_at: "2026-07-16T13:20:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5e74cdd87d21a9e0eafea6b7e4b18ab2e5b74e6c570603b1d4ad4dff83c65619
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Les portées d’opérateur déterminent ce qu’un client Gateway peut faire après s’être authentifié.
Elles constituent un garde-fou du plan de contrôle au sein d’un même domaine d’opérateur Gateway de confiance,
et non une isolation hostile mutualisée. Pour une séparation forte entre les personnes,
les équipes ou les machines, exécutez des Gateways distincts sous des utilisateurs de système d’exploitation ou sur des hôtes distincts.

Voir aussi : [Sécurité](/fr/gateway/security), [Protocole Gateway](/fr/gateway/protocol),
[Appairage du Gateway](/fr/gateway/pairing), [CLI des appareils](/fr/cli/devices).

## Rôles

Chaque client WebSocket du Gateway se connecte avec un rôle :

- `operator` : clients du plan de contrôle tels que la CLI, l’interface de contrôle, les automatisations et
  les processus auxiliaires de confiance.
- `node` : hôtes de fonctionnalités (macOS, iOS, Android, sans interface graphique) qui exposent
  des commandes via `node.invoke`.

Les méthodes RPC d’opérateur exigent le rôle `operator` ; les méthodes provenant d’un
Node exigent le rôle `node`.

## Niveaux de portée

| Portée                  | Signification                                                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | État, listes, catalogue, journaux, lecture des sessions et autres appels non modificatifs en lecture seule.                                                   |
| `operator.write`        | Actions modificatives de l’opérateur : envoi de messages, invocation d’outils, mise à jour des paramètres de conversation/voix, relais de commandes de Node. Satisfait également `operator.read`. |
| `operator.admin`        | Accès administratif. Satisfait toutes les portées `operator.*`. Requis pour modifier la configuration, effectuer des mises à jour, utiliser les hooks natifs, accéder aux espaces de noms réservés et accorder les approbations à haut risque. |
| `operator.pairing`      | Gestion de l’appairage des appareils et des Nodes : répertorier, approuver, rejeter, supprimer, renouveler, révoquer.                                         |
| `operator.approvals`    | API d’approbation d’exécution et de Plugin.                                                                                                                    |
| `operator.talk.secrets` | Lecture de la configuration de conversation avec les secrets inclus.                                                                                           |

Les futures portées `operator.*` inconnues exigent une correspondance exacte, sauf si l’appelant
détient déjà `operator.admin`.

## La portée de la méthode n’est que le premier contrôle

Chaque RPC du Gateway possède une portée de méthode fondée sur le moindre privilège, qui détermine si une
requête atteint son gestionnaire. Certains gestionnaires appliquent ensuite des contrôles plus stricts selon
l’élément concret approuvé ou modifié :

- `device.pair.approve` est accessible avec `operator.pairing`, mais l’approbation d’un
  appareil d’opérateur ne peut créer ou conserver que les portées que l’appelant détient déjà.
- `node.pair.approve` est accessible avec `operator.pairing`, puis déduit des
  portées d’approbation supplémentaires à partir de la liste de commandes déclarée par le Node en attente.
- `chat.send` est une méthode à portée d’écriture, mais les commandes de discussion `/config set` et
  `/config unset` exigent en plus `operator.admin`,
  quelle que soit la portée d’envoi de messages de l’appelant.

Cela permet aux opérateurs disposant de portées inférieures d’effectuer des actions d’appairage à faible risque sans
réserver toutes les approbations d’appairage aux administrateurs.

## Approbations d’appairage des appareils

Les enregistrements d’appairage des appareils constituent la source persistante des rôles et portées approuvés.
Un appareil déjà appairé n’obtient pas silencieusement un accès plus étendu : une reconnexion
demandant un rôle ou des portées plus étendus crée une nouvelle demande de mise à niveau
en attente.

Lors de l’approbation d’une demande d’appareil :

- Une demande sans rôle d’opérateur ne nécessite pas l’approbation d’une portée d’opérateur.
- Une demande pour un rôle d’appareil autre qu’opérateur (par exemple `node`) exige
  `operator.admin`, même si `device.pair.approve` lui-même ne nécessite que
  `operator.pairing`.
- Une demande pour `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` ou `operator.talk.secrets` exige que l’appelant détienne déjà
  cette portée, ou `operator.admin`.
- Une demande pour `operator.admin` exige `operator.admin`.
- Une demande de réparation sans portées explicites peut hériter des portées du jeton
  d’opérateur existant ; si ce jeton dispose d’une portée d’administration, l’approbation exige toujours
  `operator.admin`.

Les sessions à secret partagé non administratrices et les sessions par proxy de confiance ne peuvent approuver
les demandes d’appareils d’opérateur que dans les limites de leurs propres portées d’opérateur déclarées ; l’approbation
des rôles autres qu’opérateur est réservée aux administrateurs, même lorsque ces sessions peuvent autrement utiliser
`operator.pairing`.

Pour les sessions utilisant un jeton d’appareil appairé, la gestion est limitée à l’appareil lui-même, sauf si l’appelant
possède `operator.admin` : un appelant non administrateur ne voit que ses propres entrées d’appairage et
ne peut approuver, rejeter, renouveler, révoquer ou supprimer que l’entrée de son propre appareil.

## Approbations d’appairage des Nodes

Les anciennes méthodes `node.pair.*` utilisent un magasin d’appairage de Nodes distinct appartenant au Gateway.
Les Nodes WS utilisent plutôt l’appairage des appareils (`role: node`), mais le même vocabulaire
d’approbation s’applique. Consultez [Appairage du Gateway](/fr/gateway/pairing) pour comprendre la relation entre les deux
magasins.

`node.pair.approve` déduit des portées supplémentaires requises à partir de la liste de
commandes de la demande en attente :

| Commandes déclarées                                                                                                  | Portées requises                       |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| aucune                                                                                                               | `operator.pairing`                     |
| commandes de Node ordinaires                                                                                         | `operator.pairing` + `operator.write` |
| `system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` ou `system.execApprovals.get/set` | `operator.pairing` + `operator.admin` |

L’approbation d’une déclaration de Node n’active pas les commandes soumises à un contrôle distinct
par liste d’autorisation lors de l’exécution. Par exemple, approuver un Node qui déclare
`computer.act` exige l’appairage ainsi qu’une portée d’écriture, mais ne fait qu’enregistrer la fonctionnalité.
Un administrateur ou un propriétaire doit encore activer `computer.act`. Tant qu’elle reste
activée, son invocation au moyen de la méthode à portée d’écriture `node.invoke` n’exige pas
une portée d’administration pour chaque action.

L’appairage d’un Node établit son identité et sa fiabilité ; il ne remplace pas la propre
politique d’approbation d’exécution `system.run` du Node.

## Authentification par secret partagé

L’authentification par jeton ou mot de passe partagé du Gateway est considérée comme un accès d’opérateur de confiance pour
ce Gateway. Les interfaces HTTP compatibles avec OpenAI, `/tools/invoke` et les points de terminaison HTTP
de l’historique des sessions rétablissent l’ensemble complet des portées d’opérateur par défaut pour
l’authentification par jeton porteur à secret partagé, même si un appelant déclare des portées plus restreintes.

Les modes comportant une identité, tels que l’authentification par proxy de confiance ou `none` en entrée privée,
peuvent toujours respecter les portées explicitement déclarées. Utilisez des Gateways distincts pour une véritable séparation
des frontières de confiance.
