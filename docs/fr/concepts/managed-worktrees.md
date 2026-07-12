---
read_when:
    - Vous souhaitez une branche et une copie de travail isolées pour une tâche d’agent
    - Vous configurez des cartes Workboard avec des espaces de travail worktree
    - Vous devez restaurer ou nettoyer un worktree géré par OpenClaw
summary: Exécutez les tâches d’agent dans des copies de travail Git isolées avec des instantanés automatiques et un nettoyage automatique.
title: Worktrees gérés
x-i18n:
    generated_at: "2026-07-12T02:34:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 12a33dc2d9f1ff30060ddead200196b09cfe9498462f58a7aa8a73fa2273f31f
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

Les worktrees gérés attribuent à une tâche d’agent sa propre branche git et son propre checkout sans placer de répertoires temporaires dans le dépôt source. OpenClaw les crée dans son répertoire d’état, les enregistre dans la base de données d’état partagée et crée un instantané de leur contenu suivi ainsi que de leur contenu non suivi et non ignoré avant leur suppression.

## Organisation et noms

Chaque worktree se trouve à l’emplacement suivant :

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

L’empreinte du dépôt correspond aux 16 premiers caractères hexadécimaux d’un hachage SHA-256 calculé à partir du répertoire commun git canonique et de l’URL d’origine. Un nom fourni doit correspondre à `[a-z0-9][a-z0-9-]{0,63}`. Sans nom, OpenClaw génère `wt-` suivi de huit caractères hexadécimaux aléatoires.

OpenClaw crée la branche `openclaw/<name>` à la référence de base demandée. Sans référence de base, il récupère `origin`, utilise la branche par défaut distante lorsqu’elle est disponible et se rabat sur le `HEAD` local lorsque le dépôt est hors ligne ou ne dispose d’aucun dépôt distant utilisable.

## Provisionnement des fichiers ignorés

Ajoutez `.worktreeinclude` à la racine du dépôt source pour copier certains fichiers ignorés et non suivis dans un nouveau worktree. Le fichier utilise la syntaxe des motifs gitignore, avec un motif par ligne et des commentaires introduits par `#` :

```gitignore
.env.local
fixtures/generated/**
```

Seuls les fichiers signalés par git comme étant à la fois ignorés et non suivis sont admissibles. Les fichiers suivis sont déjà présents par l’intermédiaire de git et ne sont jamais copiés lors de cette étape. OpenClaw n’écrase pas les fichiers de destination, ne suit pas les répertoires liés symboliquement et conserve les modes des fichiers copiés.

## Exécution de la configuration du dépôt

Si `.openclaw/worktree-setup.sh` existe dans le dépôt source et est exécutable, OpenClaw l’exécute avec le nouveau worktree comme répertoire courant. Le script reçoit :

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

Un code de sortie non nul interrompt la création et supprime le nouveau worktree ainsi que la branche. Il s’agit d’un contrat local au dépôt ; aucune clé de configuration OpenClaw ne lui correspond.

## Worktrees de session

Démarrez une discussion isolée depuis l’espace de travail git de l’agent actif avec une session reposant sur un worktree : activez **Worktree** sur la page Nouvelle session de l’interface de contrôle, qui propose également un sélecteur de branche de base et un nom facultatif pour le worktree, ou utilisez le menu des actions de discussion sur iOS ou l’action de débordement à côté de Nouvelle discussion sur Android. L’option est disponible uniquement pour un agent reposant sur git lorsque le client offre cette capacité ; les clients qui ne peuvent pas effectuer de vérification préalable affichent à la place l’erreur du Gateway.

Les agents de programmation peuvent également appeler `spawn_task` lorsqu’ils découvrent des travaux de suivi confirmés qui sortent du cadre de la tâche actuelle. L’interface de contrôle affiche une pastille de suggestion sans rien démarrer, tandis qu’une TUI reposant sur le Gateway affiche une invite interactive proposant les mêmes actions. La sélection de **Démarrer dans un worktree** crée un nouveau worktree appartenant à la session à partir du projet suggéré et envoie l’invite autonome comme premier tour ; le rejet de la suggestion laisse le dépôt intact. Les suggestions et leurs identifiants sont éphémères et ne subsistent pas après un redémarrage du Gateway.

OpenClaw expose ces outils uniquement aux sessions d’opérateur disposant d’une interface Gateway permettant d’agir. Les sessions de canal et les sessions TUI locales ou intégrées ne les reçoivent pas tant que ces surfaces ne disposent pas d’un contrat portable et typé pour les actions de tâche.

Le worktree géré obtenu appartient à la session, et chaque exécution d’agent dans cette session utilise son checkout. Lorsque l’espace de travail est un sous-répertoire du dépôt, le worktree est ancré à la racine du dépôt et la session s’exécute depuis le sous-répertoire correspondant à l’intérieur de celui-ci. La création d’un worktree de session utilise la portée `operator.write` de la méthode, mais l’étape `.openclaw/worktree-setup.sh` ne s’exécute que pour les appelants `operator.admin`, car elle exécute du code du dépôt ; le provisionnement par `.worktreeinclude` s’applique néanmoins à chaque appelant. La suppression de la session ne supprime le worktree que si cette opération est sans perte. Les worktrees comportant des modifications ou les branches contenant des commits non poussés restent disponibles ; le nettoyage horaire crée des instantanés des worktrees de session après 7 jours d’inactivité, l’activité récente de la session étant considérée comme une activité du worktree. Les worktrees supprimés restent restaurables à partir de leurs instantanés, comme décrit ci-dessous.

`sessions.create` peut inclure un `cwd` absolu avec `worktree: true` lorsqu’une tâche cible un projet autre que l’espace de travail configuré de l’agent. Ce chemin d’hôte explicite requiert `operator.admin` ; la création ordinaire d’une discussion avec worktree reste sous `operator.write` et demeure ancrée à l’espace de travail configuré.

`sessions.create` accepte également `worktreeBaseRef` et `worktreeName` avec `worktree: true` afin de choisir la référence de base et le nom du worktree, la branche devenant `openclaw/<name>` ; tous deux restent sous `operator.write`. Le worktree créé est renvoyé dans le résultat de création et conservé dans la ligne de session sous la forme `worktree: { id, branch, repoRoot }`, afin que les listes de sessions puissent afficher le checkout et la branche. La suppression d’une session signale un checkout modifié conservé avec `worktreePreserved` au lieu de le laisser silencieusement en place.

## Instantanés, nettoyage et restauration

La suppression commence par créer un commit synthétique contenant les fichiers suivis ainsi que les fichiers non suivis et non ignorés, puis l’épingle à `refs/openclaw/snapshots/<id>`. Les fichiers ignorés par git sont exclus de la base de données d’objets du dépôt ; les fichiers sélectionnés par `.worktreeinclude` sont de nouveau copiés lors de la restauration. Si la création de l’instantané échoue, la suppression s’arrête. Une suppression forcée explicite peut se poursuivre sans instantané.

OpenClaw applique les règles de nettoyage suivantes :

- À la fin d’une exécution, il ne supprime un worktree que si `git status --porcelain` est vide et si `git log HEAD --not --remotes --oneline` ne trouve aucun commit non poussé. Sinon, il libère uniquement le verrou d’activité.
- Le nettoyage horaire crée des instantanés et supprime les worktrees déverrouillés appartenant à Workboard ou à une session qui sont inactifs depuis plus de 7 jours, même s’ils comportent des modifications. Les worktrees manuels ne sont jamais supprimés automatiquement.
- Les enregistrements d’instantanés restent restaurables pendant 30 jours. Le nettoyage supprime ensuite la référence de l’instantané et la ligne du registre.
- Un verrou appartenant à un processus OpenClaw actif ainsi que tout verrou de worktree git étranger ou non reconnu protègent un worktree du nettoyage automatique.

La restauration recrée `openclaw/<name>` au commit d’origine antérieur à l’instantané, puis reconstitue les différences de l’instantané sous forme de modifications non indexées et de fichiers non suivis. Le commit d’instantané synthétique reste ainsi hors de l’historique de la branche. La référence de l’instantané reste enregistrée comme provenance.

## CLI

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

La page **Worktrees** de l’interface de contrôle, sous Paramètres, propose les mêmes actions, ainsi que la création avec un sélecteur de branche de base ; elle affiche le propriétaire de chaque worktree — manuel, Workboard ou la session propriétaire avec un lien vers sa discussion — et permet de forcer une nouvelle tentative lorsqu’une suppression signale l’échec d’un instantané.

## Méthodes du Gateway

| Méthode              | Objectif                                                                       |
| -------------------- | ------------------------------------------------------------------------------ |
| `worktrees.list`     | Répertorier les enregistrements de worktrees actifs et restaurables.           |
| `worktrees.branches` | Répertorier les branches locales et distantes d’un dépôt pour les sélecteurs de référence de base. |
| `worktrees.create`   | Créer ou réutiliser un worktree géré nommé.                                    |
| `worktrees.remove`   | Créer un instantané d’un worktree et le supprimer. Les suppressions forcées signalent `snapshotError`. |
| `worktrees.restore`  | Restaurer un worktree supprimé à partir de son instantané.                     |
| `worktrees.gc`       | Exécuter immédiatement le nettoyage des éléments inactifs, orphelins et arrivés à expiration. |

`worktrees.list` requiert `operator.read`, et les méthodes de modification requièrent `operator.admin`. `worktrees.branches` nécessite `operator.write` pour les espaces de travail d’agent configurés, tandis que tout autre chemin d’hôte requiert `operator.admin`, conformément au seuil appliqué au `cwd` de `sessions.create`. Cette méthode lit uniquement les références existantes et n’effectue jamais de récupération ; les branches présentes uniquement sur le dépôt distant sont renvoyées avec leur qualification distante (`origin/feature-a`), afin que chaque nom renvoyé puisse être résolu comme référence de base.

## Espaces de travail Workboard

Le [Plugin Workboard](/fr/plugins/workboard) intégré peut matérialiser l’espace de travail d’une carte sous forme de worktree géré :

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` identifie le checkout git source. `branch` est facultatif et devient la référence de base. Lorsque la distribution démarre le worker de la carte, Workboard crée ou réutilise `wb-<card-id>`, exécute le sous-agent avec le checkout géré comme répertoire de travail et inscrit le chemin et la branche résolus dans la carte. Une matérialisation déclenchée par le Gateway requiert `operator.admin`. À la fin de l’exécution, Workboard ne supprime le checkout que s’il est démontré que cette opération est sans perte ; les modifications ou commits non poussés restent disponibles.

Les agents intégrés en bac à sable refusent actuellement un répertoire de travail de tâche situé en dehors de leur espace de travail d’agent configuré. Utilisez un agent cible sans bac à sable pour les cartes Workboard utilisant un worktree géré jusqu’à ce que l’environnement d’exécution du bac à sable prenne en charge un montage de checkout supplémentaire.
