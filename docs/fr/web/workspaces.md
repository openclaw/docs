---
read_when:
    - Création ou réorganisation des onglets et widgets de l’espace de travail
    - Permettre à un agent de composer un espace de travail
    - Examen du modèle d’approbation et de bac à sable des widgets personnalisés
summary: Espaces de travail composables par les agents dans l’interface de contrôle
title: Espaces de travail
x-i18n:
    generated_at: "2026-07-12T16:07:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 234baefc18be736599addeeb35f8404b617c1d8f07f058c4a02ec2615ca21aa0
    source_path: web/workspaces.md
    workflow: 16
---

L’onglet **Espaces de travail** de l’[interface de contrôle](/fr/web/control-ui) est une surface que vous et vos
agents organisez ensemble. Les onglets, les widgets, leur position sur une grille de 12 colonnes et leurs
liaisons de données résident tous dans un même document. Tout ce qui peut modifier ce document peut composer
l’espace de travail : vous, la CLI `openclaw workspaces` ou un agent appelant les outils `workspace_*`.

Chaque écriture emprunte le même chemin validé, de sorte que la disposition d’un humain et celle d’un agent
ne peuvent pas diverger. Chaque écriture acceptée incrémente une version et diffuse
`plugin.workspaces.changed` ; la modification d’un agent apparaît ainsi dans un navigateur déjà ouvert sans
rechargement.

## Activer les espaces de travail

Le Plugin Espaces de travail fourni est désactivé par défaut. Dans l’interface de contrôle, ouvrez **Plugins**,
recherchez **Espaces de travail**, puis sélectionnez **Activer**. Vous pouvez également l’activer depuis la CLI :

```sh
openclaw plugins enable workspaces
```

L’activation du Plugin ajoute l’onglet **Espaces de travail** et rend disponibles la CLI `openclaw workspaces`
ainsi que les outils d’agent `workspace_*`. Sa désactivation supprime ces surfaces sans
effacer la base de données des espaces de travail ni les ressources des widgets.

## L’espace de travail par défaut

Lors du premier chargement, vous obtenez un espace de travail **Vue d’ensemble** : des cartes de coûts et de jetons, l’état de santé de l’instance,
les sessions, l’état de Cron et un flux d’activité. Il s’agit d’un contenu d’espace de travail ordinaire : déplacez-le,
réduisez-le, masquez-le ou supprimez-le.

## Widgets intégrés

Neuf widgets de confiance sont fournis avec le Plugin et s’affichent comme une interface native :

`stat-card`, `markdown`, `table`, `iframe-embed`, `sessions`, `usage`, `cron`,
`instances`, `activity`.

Les widgets déclarent leurs données au moyen de **liaisons** ; ils ne les récupèrent jamais eux-mêmes :

| Liaison  | Résultat                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------- |
| `static` | Une valeur littérale stockée dans le document (8 Ko maximum).                                             |
| `file`   | Un fichier JSON, Markdown ou CSV sous `<stateDir>/workspaces/data/`, éventuellement restreint par un pointeur JSON. |
| `rpc`    | L’une des méthodes Gateway en lecture seule d’une liste d’autorisation fixe, résolue par l’interface de contrôle de confiance. |

La liaison `file` est le moyen le plus simple d’insérer vos propres nombres dans un espace de travail : écrivez un
fichier JSON dans le répertoire de données et faites pointer un `stat-card` vers celui-ci.

## Provenance

Les onglets et les widgets portent une marque `createdBy` — `user`, `system` ou `agent:<id>` — définie d’après
l’auteur de l’écriture. L’appelant ne peut pas la fournir ; un agent ne peut donc pas présenter son
travail comme le vôtre, et la pastille « IA » d’un widget créé par un agent signifie toujours bien ce qu’elle indique.

## Widgets personnalisés

Un agent peut créer un véritable widget HTML avec `workspace_widget_scaffold` (ou vous pouvez le faire avec
`openclaw workspaces widget-scaffold <name>`). Le code créé par un agent est considéré comme hostile :

- Un widget nouvellement structuré entre dans le registre avec l’état **en attente**. Aucune iframe n’est créée et la
  route des ressources renvoie une erreur 404 pour ses fichiers jusqu’à ce qu’un opérateur l’approuve.
- L’approbation constitue une décision distincte de la modification d’une disposition : `workspaces.widget.approve`
  nécessite la portée `operator.approvals`, la même que celle qui protège les approbations d’exécution.
- Un widget approuvé s’affiche dans un `<iframe sandbox="allow-scripts">` — jamais
  `allow-same-origin` — de sorte que son origine est opaque et qu’il ne peut pas accéder au DOM,
  au stockage ni aux cookies du parent.
- Ses ressources sont servies avec `connect-src 'none'`, ce qui bloque les communications réseau des scripts telles que
  `fetch`, XHR et WebSockets. Il ne détient aucun identifiant d’authentification et ne communique jamais avec le Gateway.
- Les données ne lui parviennent que par un pont `postMessage` versionné. Le code personnalisé peut recevoir
  les liaisons `static` déclarées, qui sont déjà des valeurs d’espace de travail créées par un agent ou un opérateur.
  Les liaisons RPC et de fichiers restent dans les widgets intégrés de confiance : les navigateurs autorisent un
  enfant en bac à sable à naviguer dans son propre cadre, de sorte que les données privilégiées ne sont jamais transmises
  au HTML créé par un agent.

L’envoi d’une invite dans le chat depuis un widget nécessite en outre une capacité dans le manifeste, une
confirmation à chaque invocation citant le texte exact et est soumis à une limite de débit.

## CLI

```sh
openclaw workspaces tabs list
openclaw workspaces tabs create --title Financials
openclaw workspaces widget-scaffold revenue-chart --title "Revenue Chart"
openclaw workspaces widget-approve revenue-chart
```

`widget-approve` nécessite un appareil associé à la portée `operator.approvals` ; l’approbation depuis
l’interface de contrôle ne l’exige pas, car le navigateur la détient déjà.

## Stockage

Le document de l’espace de travail, le registre des widgets personnalisés et un historique d’annulation de 20 entrées résident dans
`<stateDir>/workspaces/workspaces.sqlite`. Les ressources des widgets créés par un agent restent sur le disque sous
`<stateDir>/workspaces/widgets/<name>/`, et les données des liaisons de fichiers sous
`<stateDir>/workspaces/data/`, car un agent les crée avec des outils de fichiers ordinaires et
la route du widget sert leurs octets.
