---
read_when:
    - Création ou réorganisation des onglets et widgets de l’espace de travail
    - Permettre à un agent de composer un espace de travail
    - Examen du modèle d’approbation et de bac à sable des widgets personnalisés
summary: Espaces de travail composables par les agents dans l’interface de contrôle
title: Espaces de travail
x-i18n:
    generated_at: "2026-07-12T03:28:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 234baefc18be736599addeeb35f8404b617c1d8f07f058c4a02ec2615ca21aa0
    source_path: web/workspaces.md
    workflow: 16
---

L’onglet **Espaces de travail** de l’[interface de contrôle](/fr/web/control-ui) est une surface que vous et vos
agents organisez ensemble. Les onglets, les widgets, leur position sur une grille à 12 colonnes et leurs
liaisons de données sont tous regroupés dans un même document. Tout ce qui peut modifier ce document peut composer
l’espace de travail : vous, la CLI `openclaw workspaces` ou un agent appelant les outils `workspace_*`.

Chaque écriture suit le même processus validé, de sorte que la disposition d’un humain et celle d’un agent
ne peuvent pas diverger. Chaque écriture acceptée incrémente une version et diffuse
`plugin.workspaces.changed` ; la modification d’un agent apparaît donc dans un navigateur déjà ouvert sans
rechargement.

## Activer les espaces de travail

Le Plugin Espaces de travail inclus est désactivé par défaut. Dans l’interface de contrôle, ouvrez **Plugins**,
recherchez **Workspaces**, puis sélectionnez **Enable**. Vous pouvez également l’activer depuis la CLI :

```sh
openclaw plugins enable workspaces
```

L’activation du Plugin ajoute l’onglet **Espaces de travail** et rend disponibles la CLI `openclaw workspaces`
ainsi que les outils d’agent `workspace_*`. Sa désactivation supprime ces interfaces sans
effacer la base de données des espaces de travail ni les ressources des widgets.

## L’espace de travail par défaut

Lors du premier chargement, vous obtenez un espace de travail **Vue d’ensemble** : cartes de coûts et de jetons, état des instances,
sessions, état des tâches Cron et flux d’activité. Il s’agit d’un contenu d’espace de travail ordinaire : déplacez-le,
réduisez-le, masquez-le ou supprimez-le.

## Widgets intégrés

Neuf widgets approuvés sont fournis avec le Plugin et s’affichent comme une interface native :

`stat-card`, `markdown`, `table`, `iframe-embed`, `sessions`, `usage`, `cron`,
`instances`, `activity`.

Les widgets déclarent leurs données au moyen de **liaisons** ; ils ne les récupèrent jamais eux-mêmes :

| Liaison  | Résultat                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------- |
| `static` | Une valeur littérale stockée dans le document (8 Ko maximum).                                             |
| `file`   | Un fichier JSON, Markdown ou CSV sous `<stateDir>/workspaces/data/`, éventuellement restreint par un pointeur JSON. |
| `rpc`    | L’une des méthodes Gateway en lecture seule figurant dans une liste d’autorisation fixe, résolue par l’interface de contrôle approuvée. |

La liaison `file` est le moyen le plus simple d’ajouter vos propres chiffres à un espace de travail : écrivez un
fichier JSON dans le répertoire de données et faites pointer une `stat-card` vers celui-ci.

## Provenance

Les onglets et les widgets comportent une marque `createdBy` — `user`, `system` ou `agent:<id>` — définie selon
l’auteur de l’écriture. L’appelant ne peut pas la fournir ; un agent ne peut donc pas présenter son
travail comme le vôtre, et la pastille « IA » d’un widget créé par un agent signifie toujours exactement ce qu’elle indique.

## Widgets personnalisés

Un agent peut créer un véritable widget HTML avec `workspace_widget_scaffold` (ou vous-même, avec
`openclaw workspaces widget-scaffold <name>`). Le code créé par un agent est considéré comme hostile :

- Un widget généré entre dans le registre avec l’état **en attente**. Aucune iframe n’est créée et la
  route des ressources renvoie une erreur 404 pour ses fichiers jusqu’à ce qu’un opérateur l’approuve.
- L’approbation constitue une décision distincte de la modification d’une disposition : `workspaces.widget.approve`
  nécessite la portée `operator.approvals`, la même que celle qui protège les approbations d’exécution.
- Un widget approuvé s’affiche dans un `<iframe sandbox="allow-scripts">` — jamais avec
  `allow-same-origin` — de sorte que son origine est opaque et qu’il ne peut pas accéder au DOM,
  au stockage ni aux cookies du parent.
- Ses ressources sont servies avec `connect-src 'none'`, ce qui bloque les communications réseau des scripts telles que
  `fetch`, XHR et WebSockets. Il ne détient aucun identifiant d’accès et ne communique jamais avec le Gateway.
- Les données ne lui parviennent que par l’intermédiaire d’un pont `postMessage` versionné. Le code personnalisé peut recevoir
  les liaisons `static` déclarées, qui sont déjà des valeurs d’espace de travail créées par un agent ou un opérateur.
  Les liaisons RPC et de fichiers restent dans les widgets intégrés approuvés : les navigateurs permettent à un
  enfant en bac à sable de faire naviguer sa propre iframe ; les données privilégiées ne sont donc jamais transmises
  au code HTML créé par un agent.

L’envoi d’une invite dans la discussion depuis un widget nécessite en outre une capacité dans le manifeste, une
confirmation à chaque invocation citant le texte exact et est soumis à une limitation de débit.

## CLI

```sh
openclaw workspaces tabs list
openclaw workspaces tabs create --title Financials
openclaw workspaces widget-scaffold revenue-chart --title "Revenue Chart"
openclaw workspaces widget-approve revenue-chart
```

`widget-approve` nécessite un appareil associé disposant de la portée `operator.approvals` ; l’approbation depuis
l’interface de contrôle ne l’exige pas, car le navigateur la détient déjà.

## Stockage

Le document de l’espace de travail, le registre des widgets personnalisés et un historique d’annulation de 20 entrées résident dans
`<stateDir>/workspaces/workspaces.sqlite`. Les ressources des widgets créés par les agents restent sur le disque sous
`<stateDir>/workspaces/widgets/<name>/`, et les données des liaisons de fichiers sous
`<stateDir>/workspaces/data/`, car un agent les crée avec des outils de fichiers ordinaires et
la route du widget sert leurs octets.
