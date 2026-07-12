---
read_when:
    - Vous souhaitez une branche et une copie de travail isolées pour une tâche d’agent
    - Vous configurez des cartes Workboard avec des espaces de travail worktree
    - Vous devez restaurer ou nettoyer un arbre de travail géré par OpenClaw
summary: Exécutez les tâches de l’agent dans des extractions Git isolées avec des instantanés et un nettoyage automatiques
title: Worktrees gérés
x-i18n:
    generated_at: "2026-07-12T15:15:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 12a33dc2d9f1ff30060ddead200196b09cfe9498462f58a7aa8a73fa2273f31f
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

Les worktrees gérés fournissent à une tâche d’agent sa propre branche git et son propre répertoire de travail sans placer de répertoires temporaires dans le dépôt source. OpenClaw les crée dans son répertoire d’état, les enregistre dans la base de données d’état partagée et crée un instantané de leur contenu suivi ainsi que de leur contenu non suivi et non ignoré avant leur suppression.

## Disposition et noms

Chaque worktree se trouve à l’emplacement suivant :

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

L’empreinte du dépôt correspond aux 16 premiers caractères hexadécimaux d’un hachage SHA-256 calculé à partir du répertoire git commun canonique et de l’URL d’origine. Un nom fourni doit correspondre à `[a-z0-9][a-z0-9-]{0,63}`. En l’absence de nom, OpenClaw génère `wt-` suivi de huit caractères hexadécimaux aléatoires.

OpenClaw crée la branche `openclaw/<name>` à partir de la référence de base demandée. En l’absence de référence de base, il récupère `origin`, utilise la branche par défaut distante lorsqu’elle est disponible et se rabat sur le `HEAD` local lorsque le dépôt est hors ligne ou ne dispose d’aucun dépôt distant utilisable.

## Provisionnement des fichiers ignorés

Ajoutez `.worktreeinclude` à la racine du dépôt source pour copier certains fichiers ignorés et non suivis dans un nouveau worktree. Le fichier utilise la syntaxe des motifs gitignore, à raison d’un motif par ligne, avec des commentaires introduits par `#` :

```gitignore
.env.local
fixtures/generated/**
```

Seuls les fichiers signalés par git comme étant à la fois ignorés et non suivis sont éligibles. Les fichiers suivis sont déjà présents par l’intermédiaire de git et ne sont jamais copiés lors de cette étape. OpenClaw n’écrase pas les fichiers de destination, ne suit pas les répertoires ciblés par des liens symboliques et préserve les modes des fichiers copiés.

## Exécuter la configuration du dépôt

Si `.openclaw/worktree-setup.sh` existe dans le dépôt source et est exécutable, OpenClaw l’exécute avec le nouveau worktree comme répertoire courant. Le script reçoit :

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
```
```text
OPENCLAW_WORKTREE_PATH=<managed worktree>
```
Un code de sortie non nul interrompt la création et supprime le nouveau worktree ainsi que la branche. Il s’agit d’un contrat local au dépôt ; aucune clé de configuration OpenClaw ne lui correspond.

## Worktrees de session

Démarrez une conversation isolée depuis l’espace de travail git de l’agent actif avec une session adossée à un worktree : activez **Worktree** sur la page New session de l’interface de contrôle (qui propose également un sélecteur de branche de base et un nom de worktree facultatif), ou utilisez le menu des actions de conversation sur iOS ou l’action du menu de débordement à côté de New Chat sur Android. Cette option est disponible uniquement pour un agent adossé à git lorsque le client dispose de cette capacité ; les clients qui ne peuvent pas effectuer la vérification préalable affichent à la place l’erreur du Gateway.

Les agents de codage peuvent également appeler `spawn_task` lorsqu’ils identifient un travail de suivi confirmé hors de la tâche actuelle. L’interface de contrôle affiche une puce de suggestion sans rien démarrer, tandis qu’une TUI adossée à un Gateway affiche une invite interactive proposant les mêmes actions. Sélectionner **Start in worktree** crée un nouveau worktree appartenant à la session à partir du projet suggéré et envoie l’invite autonome comme premier tour ; ignorer la suggestion laisse le dépôt intact. Les suggestions et leurs identifiants sont éphémères et ne survivent pas au redémarrage d’un Gateway.

OpenClaw expose ces outils uniquement aux sessions d’opérateur disposant d’une interface Gateway permettant d’agir. Les sessions de canal et les sessions TUI locales/intégrées ne les reçoivent pas tant que ces surfaces ne disposent pas d’un contrat portable d’actions de tâche typées.

Le worktree géré qui en résulte appartient à la session, et chaque exécution d’agent dans cette session utilise son checkout. Lorsque l’espace de travail est un sous-répertoire du dépôt, le worktree est ancré à la racine du dépôt et la session s’exécute depuis le sous-répertoire correspondant à l’intérieur de celui-ci. La création du worktree de session utilise la portée `operator.write` de la méthode, mais l’étape `.openclaw/worktree-setup.sh` ne s’exécute que pour les appelants disposant de `operator.admin`, car elle exécute du code du dépôt ; le provisionnement par `.worktreeinclude` continue de s’appliquer à chaque appelant. La suppression de la session ne supprime le worktree que si cette opération est sans perte. Les worktrees contenant des modifications ou les branches comportant des commits non poussés restent disponibles ; le nettoyage horaire crée des instantanés des worktrees de session après 7 jours d’inactivité, l’activité récente de la session étant considérée comme une activité du worktree. Les worktrees supprimés restent restaurables à partir de leurs instantanés, comme décrit ci-dessous.

`sessions.create` peut inclure un `cwd` absolu avec `worktree: true` lorsqu’une tâche cible un projet autre que l’espace de travail d’agent configuré. Ce chemin d’hôte explicite nécessite `operator.admin` ; la création ordinaire d’un worktree depuis une discussion reste soumise à `operator.write` et ancrée à l’espace de travail configuré.

`sessions.create` accepte également `worktreeBaseRef` et `worktreeName` avec `worktree: true` afin de choisir la référence de base et le nom du worktree (la branche devient `openclaw/<name>`) ; les deux restent soumis à `operator.write`. Le worktree créé est renvoyé dans le résultat de la création et conservé dans la ligne de session sous la forme `worktree: { id, branch, repoRoot }`, afin que les listes de sessions puissent afficher le checkout et la branche. Lors de la suppression d’une session, un checkout modifié conservé est signalé par `worktreePreserved` au lieu d’être silencieusement laissé sur place.

## Instantanés, nettoyage et restauration

La suppression crée d’abord un commit synthétique contenant les fichiers suivis et les fichiers non suivis qui ne sont pas ignorés, puis l’épingle à `refs/openclaw/snapshots/<id>`. Les fichiers ignorés par Git sont exclus de la base de données d’objets du dépôt ; les fichiers sélectionnés par `.worktreeinclude` sont de nouveau copiés lors de la restauration. Si la création de l’instantané échoue, la suppression s’arrête. Une suppression forcée explicite peut se poursuivre sans instantané.

OpenClaw applique les règles de nettoyage suivantes :

- À la fin de l’exécution, il ne supprime un worktree que si `git status --porcelain` est vide et si `git log HEAD --not --remotes --oneline` ne trouve aucun commit non poussé. Sinon, il libère uniquement le verrou d’activité.
- Le nettoyage horaire crée des instantanés puis supprime les worktrees déverrouillés appartenant à Workboard ou à une session et inactifs depuis plus de 7 jours, même s’ils contiennent des modifications. Les worktrees manuels ne sont jamais supprimés automatiquement.
- Les enregistrements d’instantanés restent restaurables pendant 30 jours. Le nettoyage supprime ensuite la référence de l’instantané et la ligne du registre.
- Le verrou d’un processus OpenClaw actif ainsi que tout verrou de worktree Git étranger ou non reconnu protègent un worktree du nettoyage automatique.

La restauration recrée `openclaw/<name>` au commit d’origine antérieur à l’instantané, puis reconstitue les différences de l’instantané sous forme de modifications non indexées et de fichiers non suivis. Ainsi, le commit synthétique de l’instantané ne figure pas dans l’historique de la branche. La référence de l’instantané reste enregistrée comme provenance.

## CLI

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

La page **Worktrees** de l’interface de contrôle, sous Settings, propose les mêmes actions ainsi que la création avec un sélecteur de branche de base, affiche le propriétaire de chaque worktree (manuel, Workboard ou la session propriétaire avec un lien vers sa discussion) et permet de forcer une nouvelle tentative lorsqu’une suppression signale l’échec d’un instantané.

## Méthodes du Gateway

| Méthode              | Objectif                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| `worktrees.list`     | Répertorier les enregistrements de worktrees actifs et restaurables.                                           |
| `worktrees.branches` | Répertorier les branches locales et distantes d’un dépôt pour les sélecteurs de référence de base.             |
| `worktrees.create`   | Créer ou réutiliser un worktree géré nommé.                                                                    |
| `worktrees.remove`   | Créer un instantané et supprimer un worktree. Les suppressions forcées signalent `snapshotError`.              |
| `worktrees.restore`  | Restaurer un worktree supprimé à partir de son instantané.                                                      |
| `worktrees.gc`       | Exécuter immédiatement le nettoyage selon l’inactivité, les éléments orphelins et la durée de conservation.    |

`worktrees.list` nécessite `operator.read`, et les méthodes qui effectuent des modifications nécessitent `operator.admin`. `worktrees.branches` nécessite `operator.write` pour les espaces de travail d’agent configurés, tandis que tout autre chemin d’hôte nécessite `operator.admin` (conformément à l’exigence relative au cwd de `sessions.create`). Cette méthode lit uniquement les références existantes et n’effectue jamais de récupération ; les branches présentes uniquement sur un dépôt distant sont renvoyées avec leur qualification distante (`origin/feature-a`), de sorte que chaque nom renvoyé puisse être résolu comme référence de base.

## Espaces de travail Workboard

Le [Plugin Workboard](/fr/plugins/workboard) intégré peut matérialiser l’espace de travail d’une carte sous forme de worktree géré :

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` identifie le checkout Git source. `branch` est facultatif et devient la référence de base. Lorsque la répartition démarre le worker de la carte, Workboard crée ou réutilise `wb-<card-id>`, exécute le sous-agent avec le checkout géré comme répertoire de travail, puis réinscrit le chemin et la branche résolus dans la carte. La matérialisation déclenchée par le Gateway nécessite `operator.admin`. À la fin de l’exécution, Workboard ne supprime le checkout que si l’absence de perte peut être démontrée ; les modifications ou les commits non poussés restent disponibles.

Les agents intégrés en bac à sable refusent actuellement un répertoire de travail de tâche situé hors de leur espace de travail d’agent configuré. Utilisez un agent cible sans bac à sable pour les cartes Workboard utilisant un worktree géré, jusqu’à ce que l’environnement d’exécution du bac à sable prenne en charge un montage de checkout supplémentaire.
