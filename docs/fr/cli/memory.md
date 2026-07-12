---
read_when:
    - Vous souhaitez indexer ou rechercher la mémoire sémantique
    - Vous déboguez la disponibilité ou l’indexation de la mémoire
    - Vous souhaitez promouvoir la mémoire à court terme rappelée vers `MEMORY.md`
summary: Référence de la CLI pour `openclaw memory` (status/index/search/promote/promote-explain/rem-harness/rem-backfill)
title: Mémoire
x-i18n:
    generated_at: "2026-07-12T15:15:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f0002c48044455520f32a5a3e111415a746fbafba2a27a655ded90abdc94623b
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Gérez l’indexation de la mémoire sémantique, la recherche et la promotion vers `MEMORY.md`.
Cette commande est fournie par le Plugin `memory-core` inclus et est disponible lorsque
`plugins.slots.memory` sélectionne `memory-core` (valeur par défaut). Les autres Plugins de mémoire
exposent leurs propres espaces de noms CLI.

Voir aussi : concept de [mémoire](/fr/concepts/memory), [Dreaming](/fr/concepts/dreaming),
[référence de configuration de la mémoire](/fr/reference/memory-config), [wiki de la mémoire](/fr/plugins/memory-wiki),
[wiki](/fr/cli/wiki), [Plugins](/fr/tools/plugin).

## `memory status`

```bash
openclaw memory status [--agent <id>] [--deep] [--index] [--fix] [--json] [--verbose]
```

Sans `--agent`, la commande s’exécute pour chaque agent dans `agents.list` ; si aucune liste d’agents
n’est configurée, elle utilise l’agent par défaut.

| Option      | Effet                                                                                                                                                                                                                                                                                                                                                                      |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--deep`    | Vérifie l’état de préparation du magasin vectoriel, du fournisseur d’embeddings et de la recherche sémantique (ce qui implique des appels supplémentaires au fournisseur). La commande simple `memory status` reste rapide et ignore cette vérification ; un état vectoriel/sémantique inconnu signifie qu’il n’a pas été vérifié. Le mode lexical QMD `searchMode: "search"` ignore toujours les vérifications vectorielles sémantiques, même avec `--deep`. |
| `--index`   | Réindexe si le magasin est dans un état modifié. Implique `--deep`.                                                                                                                                                                                                                                                                                                         |
| `--fix`     | Répare les verrous de rappel obsolètes et normalise les métadonnées de promotion.                                                                                                                                                                                                                                                                                            |
| `--json`    | Affiche du JSON.                                                                                                                                                                                                                                                                                                                                                            |
| `--verbose` | Émet des journaux détaillés pour chaque phase.                                                                                                                                                                                                                                                                                                                              |

Si la ligne `Dreaming` reste sur `off` même avec `dreaming.enabled: true`, ou si
les balayages planifiés semblent ne jamais s’exécuter, le Cron Dreaming géré dépend du
déclenchement du Heartbeat de l’agent par défaut pour lancer la réconciliation. Consultez
[Dreaming](/fr/concepts/dreaming) pour plus de détails sur la planification.

L’état répertorie également tous les chemins de recherche supplémentaires définis dans `agents.defaults.memorySearch.extraPaths`.

## `memory index`

```bash
openclaw memory index [--agent <id>] [--force] [--verbose]
```

La portée par agent est identique à celle de `status`. `--force` exécute une réindexation complète au lieu
d’une réindexation incrémentielle. `--verbose` affiche les détails relatifs au fournisseur, au modèle, aux sources et
aux chemins supplémentaires de chaque agent avant d’afficher la progression de l’indexation.

## `memory search`

```bash
openclaw memory search [query] [--query <text>] [--agent <id>] [--max-results <n>] [--min-score <n>] [--json]
```

- Requête : argument positionnel `[query]` ou `--query <text>`. Si les deux sont définis, `--query`
  prévaut. Si aucun n’est défini, la commande renvoie une erreur.
- `--agent <id>` : utilise par défaut l’agent par défaut (et non la liste complète des agents).
- `--max-results <n>` : limite le nombre de résultats (entier positif).
- `--min-score <n>` : exclut les correspondances dont le score est inférieur à cette valeur.

## `memory promote`

Classez les candidats à court terme issus de `memory/YYYY-MM-DD.md` et ajoutez éventuellement
les meilleures entrées à `MEMORY.md`.

```bash
openclaw memory promote [--agent <id>] [--limit <n>] [--min-score <n>] \
  [--min-recall-count <n>] [--min-unique-queries <n>] [--apply] [--include-promoted] [--json]
```

| Option                     | Valeur par défaut        | Effet                                                                    |
| -------------------------- | ------------------------ | ------------------------------------------------------------------------ |
| `--limit <n>`              |                          | Nombre maximal de candidats à renvoyer/appliquer.                        |
| `--min-score <n>`          | `0.75`                   | Score pondéré minimal de promotion.                                      |
| `--min-recall-count <n>`   | `3`                      | Nombre minimal de rappels requis.                                        |
| `--min-unique-queries <n>` | `2`                      | Nombre minimal de requêtes distinctes requis.                            |
| `--apply`                  | aperçu uniquement        | Ajoute les candidats sélectionnés à `MEMORY.md` et les marque comme promus. |
| `--include-promoted`       |                          | Inclut les candidats déjà promus lors de cycles précédents.              |
| `--json`                   |                          | Affiche du JSON.                                                         |

Ces valeurs CLI par défaut diffèrent des seuils de la phase approfondie du balayage Dreaming
planifié (voir [Dreaming](#dreaming) ci-dessous) ; transmettez des options explicites pour reproduire
le comportement du balayage lors d’une exécution manuelle ponctuelle.

Signaux de classement : fréquence de rappel, pertinence de la récupération, diversité des requêtes,
récence temporelle, consolidation entre plusieurs jours et richesse des concepts dérivés, issus
à la fois des rappels de mémoire et des passes d’ingestion quotidiennes, auxquels s’ajoute un léger
renforcement de phase légère/REM pour les revisites répétées lors du Dreaming. Avant l’écriture, la promotion
relit la note quotidienne active ; les modifications ou suppressions d’extraits à court terme
effectuées depuis le classement sont ainsi prises en compte, au lieu d’effectuer la promotion à partir d’un instantané obsolète.

## `memory promote-explain`

Expliquez la répartition du score d’un candidat à la promotion.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

`<selector>` correspond à la clé d’un candidat (exactement ou par sous-chaîne), à son chemin ou au texte
d’un extrait.

## `memory rem-harness`

Prévisualisez les réflexions REM, les vérités candidates et le résultat de la promotion en phase approfondie
sans rien écrire.

```bash
openclaw memory rem-harness [--agent <id>] [--path <file-or-dir>] [--grounded] [--include-promoted] [--json]
```

- `--path <file-or-dir>` : initialisez le banc d’essai à partir des fichiers quotidiens historiques
  `YYYY-MM-DD.md` plutôt que depuis l’espace de travail actif.
- `--grounded` : affichez également, à partir des notes historiques, un aperçu ancré de `What Happened` / `Reflections` /
  `Possible Lasting Updates`.

## `memory rem-backfill`

Écrivez des résumés REM historiques ancrés dans `DREAMS.md` pour leur examen dans l’interface utilisateur.
Cette opération est réversible.

```bash
openclaw memory rem-backfill --path <file-or-dir> [--agent <id>] [--stage-short-term] [--json]
openclaw memory rem-backfill --rollback [--rollback-short-term] [--json]
```

- `--path <file-or-dir>` : requis sauf si `--rollback`/`--rollback-short-term`
  est défini. Fichier(s) de mémoire quotidienne historique ou répertoire à partir desquels effectuer le remplissage rétroactif.
- `--stage-short-term` : ajoutez également des candidats durables ancrés dans le magasin actif
  de promotion à court terme afin que la phase approfondie normale puisse les classer.
- `--rollback` : supprimez de `DREAMS.md` les entrées de journal ancrées
  précédemment écrites.
- `--rollback-short-term` : supprimez les candidats ancrés à court terme
  précédemment ajoutés.

## Dreaming

Dreaming est le système de consolidation de la mémoire en arrière-plan, composé de trois
phases coopératives, exécutées dans l’ordre selon une même planification : **légère** (trier/préparer
les éléments à court terme), **REM** (réfléchir et faire ressortir les thèmes), **profonde** (transférer les
faits durables dans `MEMORY.md`). Seule la phase profonde écrit dans `MEMORY.md`.

- Activez cette fonctionnalité avec `plugins.entries.memory-core.config.dreaming.enabled: true`
  (valeur par défaut : `false`) ; `memory-core` gère automatiquement la tâche Cron de balayage,
  sans nécessiter d’exécuter manuellement `openclaw cron add`.
- Activez ou désactivez-la depuis le chat avec `/dreaming on|off` ; consultez son état avec `/dreaming status`
  (ou `/dreaming`/`/dreaming help`). `on`/`off` nécessite le statut de propriétaire du canal
  ou l’autorisation `operator.admin` du Gateway ; `status` et l’aide restent accessibles à toute personne
  autorisée à invoquer la commande.
- La sortie lisible par l’utilisateur pour chaque phase est enregistrée dans `DREAMS.md` (ou dans un fichier `dreams.md` existant).
  Par défaut (`dreaming.storage.mode: "separate"`), chaque phase enregistre également un
  rapport autonome dans `memory/dreaming/<phase>/YYYY-MM-DD.md` ; définissez `mode:
"inline"` pour intégrer plutôt les rapports au fichier de mémoire quotidien, ou `"both"`
  pour utiliser les deux modes.
- Les exécutions planifiées et manuelles de `memory promote` utilisent les mêmes signaux de classement
  de la phase approfondie ; seuls les seuils par défaut diffèrent (voir le tableau ci-dessus et
  les valeurs planifiées par défaut ci-dessous).
- Les exécutions planifiées sont réparties dans l’espace de travail mémoire de chaque agent configuré.

Valeurs par défaut planifiées (`plugins.entries.memory-core.config.dreaming`) :

| Clé                                    | Valeur par défaut |
| -------------------------------------- | ----------------- |
| `frequency`                            | `0 3 * * *`       |
| `phases.deep.minScore`                 | `0.8`             |
| `phases.deep.minRecallCount`           | `3`               |
| `phases.deep.minUniqueQueries`         | `3`               |
| `phases.deep.recencyHalfLifeDays`      | `14`              |
| `phases.deep.maxAgeDays`               | `30`              |
| `phases.deep.maxPromotedSnippetTokens` | `160`              |

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

Liste complète des clés et détails des phases : [Dreaming](/fr/concepts/dreaming),
[Référence de configuration de la mémoire](/fr/reference/memory-config#dreaming).

## Dépendance au Gateway pour SecretRef

Si les champs de clé d’API distante d’Active Memory sont configurés en tant que SecretRefs, les commandes `memory`
les résolvent à partir de l’instantané actif du Gateway ; si le Gateway est
indisponible, la commande échoue immédiatement. Cela nécessite un Gateway prenant en charge la
méthode `secrets.resolve` ; les anciens Gateways renvoient une erreur de méthode inconnue.

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
