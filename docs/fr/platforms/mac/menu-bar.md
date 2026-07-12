---
read_when:
    - Ajustement de l’interface du menu macOS ou de la logique d’état
summary: Logique d’état de la barre de menus et informations présentées aux utilisateurs
title: Barre de menus
x-i18n:
    generated_at: "2026-07-12T15:30:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 480a85f383a6495c0e45850a322c0c67c4cc35e21d2d29b4bd86f42fdbf9430a
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

## Ce qui est affiché

- L’état de travail actuel de l’agent s’affiche dans l’icône de la barre des menus et dans la première ligne d’état du menu.
- L’état de santé est masqué tant qu’une tâche est active ; il réapparaît lorsque toutes les sessions sont inactives.
- Un élément racine « Contexte » ouvre un sous-menu contenant les sessions récentes au lieu de les développer dans le menu racine.
- Un bloc « Nœuds » dans le menu racine répertorie uniquement les **appareils** appairés (provenant de `node.list`), et non les entrées de client ou de présence.
- Une section racine « Utilisation » apparaît sous Contexte lorsque des instantanés d’utilisation du fournisseur sont disponibles, suivie des détails de coût lorsqu’ils sont disponibles.

## Modèle d’état

- Source : `WorkActivityStore` (`apps/macos/Sources/OpenClaw/WorkActivityStore.swift`).
- Les événements arrivent sous forme de `ControlAgentEvent` avec un `runId` ; le gestionnaire (`ControlChannel.routeWorkActivity`) lit `sessionKey` dans la charge utile de l’événement et utilise `"main"` par défaut si cette valeur est absente.
- Priorité : la session principale (`sessionKey == "main"` par défaut) est toujours prioritaire. Si la session principale est active, son état s’affiche immédiatement. Si elle est inactive, l’état de la session non principale active la plus récemment s’affiche à la place. Le magasin ne change pas de session en cours d’activité ; il ne le fait que lorsque la session actuelle devient inactive ou que la session principale devient active.
- Types d’activité :
  - `job` : exécution de commande de haut niveau (`state: started|streaming|done|error|...`).
  - `tool` : `phase: start|result` avec `name`, et éventuellement `meta`/`args`.

## Énumération IconState (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (remplacement de débogage)

### ActivityKind -> symbole du badge

`ActivityKind` encapsule un `ToolKind` (`bash`, `read`, `write`, `edit`, `attach`, `other`) ou un simple `job`. Chacun correspond à un badge SF Symbol dessiné par-dessus l’icône de la créature (`IconState.badgeSymbolName`) :

| Type            | Symbole                            |
| --------------- | ---------------------------------- |
| `bash`          | `chevron.left.slash.chevron.right` |
| `read`          | `doc`                              |
| `write`         | `pencil`                           |
| `edit`          | `pencil.tip`                       |
| `attach`        | `paperclip`                        |
| `other` / `job` | `gearshape.fill`                   |

### Correspondance visuelle

- `idle` : créature normale, sans badge.
- `workingMain` : badge avec symbole, teinte complète (importance `.primary`), animation des pattes indiquant le « travail ».
- `workingOther` : badge avec symbole, teinte atténuée (importance `.secondary`), sans déplacement précipité.
- `overridden` : utilise le symbole et la teinte choisis indépendamment de l’activité réelle.

## Sous-menu Contexte

- Le menu racine affiche une ligne « Contexte » avec le nombre et l’état des sessions ; elle ouvre un sous-menu (`MenuSessionsInjector`).
- L’en-tête du sous-menu affiche le nombre de sessions actives au cours des dernières 24 heures.
- Chaque ligne de session conserve sa barre de jetons, son ancienneté, son aperçu, le sélecteur de mode réflexion/détaillé, ainsi que les actions de réinitialisation, de compaction et de suppression.
- Les messages de chargement, de déconnexion et d’erreur de chargement des sessions s’affichent dans le sous-menu Contexte.
- Les sections d’utilisation et de coût restent au niveau racine, sous Contexte, afin de pouvoir être consultées d’un coup d’œil sans ouvrir le sous-menu.

## Texte de la ligne d’état (menu)

- Pendant que le travail est en cours : `<Session role> · <activity label>` (`"\(roleLabel) · \(activity.label)"` dans `MenuContentView`), où le libellé du rôle est `Main` ou `Other`.
- En période d’inactivité : revient au résumé de l’état de santé.

## Ingestion des événements

- Source : événements `agent` du canal de contrôle, acheminés par `ControlChannel.routeWorkActivity(from:)`.
- Champs analysés :
  - `stream: "job"` avec `data.state` pour le démarrage/l’arrêt.
  - `stream: "tool"` avec `data.phase`, `data.name` et, facultativement, `data.meta`/`data.args`.
- Les libellés des outils proviennent de `ToolDisplayRegistry.resolve(name:args:meta:)` ; les noms non résolus utilisent par défaut le nom brut de l’outil.

## Remplacement pour le débogage

- Sélecteur Settings > Debug > "Icon override" :
  - `System (auto)` (par défaut)
  - `Working: main` / `Working: other` (selon le type d’outil : bash, lecture, écriture, modification, autre)
  - `Idle`
- Stocké sous la clé `UserDefaults` `openclaw.iconOverride` ; mappé à `IconState.overridden`.

## Liste de contrôle des tests

- Déclenchez une tâche de la session principale : l’icône change immédiatement et la ligne d’état affiche le libellé principal.
- Déclenchez une tâche d’une session non principale lorsque la session principale est inactive : l’icône et l’état affichent la session non principale et restent stables jusqu’à la fin de la tâche.
- Démarrez la session principale pendant qu’une autre session est active : l’icône bascule instantanément vers la session principale.
- Rafales rapides d’outils : le badge ne scintille pas (délai de grâce de 2 s avant d’effacer un outil terminé, `WorkActivityStore.toolResultGrace`).
- La ligne d’état de santé réapparaît une fois que toutes les sessions sont inactives.

## Voir aussi

- [Application macOS](/fr/platforms/macos)
- [Icône de la barre des menus](/fr/platforms/mac/icon)
