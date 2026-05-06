---
read_when:
    - Vous souhaitez indexer la mémoire sémantique ou y effectuer une recherche
    - Vous déboguez la disponibilité de la mémoire ou l’indexation
    - Vous souhaitez promouvoir la mémoire à court terme rappelée dans `MEMORY.md`
summary: Référence CLI pour `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Mémoire
x-i18n:
    generated_at: "2026-05-06T17:53:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7137f8a9529095204699de5fee7a0baf5d5a377792dc93b4059145d0eefab737
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Gérez l’indexation et la recherche sémantiques de la mémoire.
Fourni par le Plugin active memory (par défaut : `memory-core` ; définissez `plugins.slots.memory = "none"` pour le désactiver).

Connexe :

- Concept de mémoire : [Mémoire](/fr/concepts/memory)
- Wiki de mémoire : [Wiki de mémoire](/fr/plugins/memory-wiki)
- CLI du wiki : [wiki](/fr/cli/wiki)
- Plugins : [Plugins](/fr/tools/plugin)

## Exemples

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory status --fix
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory promote --limit 10 --min-score 0.75
openclaw memory promote --apply
openclaw memory promote --json --min-recall-count 0 --min-unique-queries 0
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
openclaw memory rem-harness
openclaw memory rem-harness --json
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## Options

`memory status` et `memory index` :

- `--agent <id>` : limite la portée à un seul agent. Sans cette option, ces commandes s’exécutent pour chaque agent configuré ; si aucune liste d’agents n’est configurée, elles se rabattent sur l’agent par défaut.
- `--verbose` : émet des journaux détaillés pendant les sondes et l’indexation.

`memory status` :

- `--deep` : sonde l’état de préparation du magasin vectoriel local, du fournisseur d’embeddings et de la recherche vectorielle sémantique. `memory status` simple reste rapide et n’exécute pas de travail d’embedding en direct ni de découverte de fournisseur ; un état inconnu du magasin vectoriel ou du vecteur sémantique signifie qu’il n’a pas été sondé dans cette commande. Le mode lexical QMD `searchMode: "search"` ignore les sondes vectorielles sémantiques et la maintenance des embeddings, même avec `--deep`.
- `--index` : exécute une réindexation si le magasin est sale (implique `--deep`).
- `--fix` : répare les verrous de rappel obsolètes et normalise les métadonnées de promotion.
- `--json` : affiche une sortie JSON.

Si `memory status` affiche `Dreaming status: blocked`, le cron Dreaming géré est activé, mais le Heartbeat qui le pilote ne se déclenche pas pour l’agent par défaut. Consultez [Dreaming ne s’exécute jamais](/fr/concepts/dreaming#dreaming-never-runs-status-shows-blocked) pour les deux causes courantes.

`memory index` :

- `--force` : force une réindexation complète.

`memory search` :

- Entrée de requête : passez soit `[query]` en positionnel, soit `--query <text>`.
- Si les deux sont fournis, `--query` l’emporte.
- Si aucun n’est fourni, la commande se termine avec une erreur.
- `--agent <id>` : limite la portée à un seul agent (par défaut : l’agent par défaut).
- `--max-results <n>` : limite le nombre de résultats retournés.
- `--min-score <n>` : filtre les correspondances à faible score.
- `--json` : affiche les résultats JSON.

`memory promote` :

Prévisualisez et appliquez les promotions de mémoire à court terme.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- écrit les promotions dans `MEMORY.md` (par défaut : prévisualisation uniquement).
- `--limit <n>` -- plafonne le nombre de candidats affichés.
- `--include-promoted` -- inclut les entrées déjà promues lors des cycles précédents.

Options complètes :

- Classe les candidats à court terme depuis `memory/YYYY-MM-DD.md` à l’aide de signaux de promotion pondérés (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Utilise les signaux à court terme issus à la fois des rappels de mémoire et des passes d’ingestion quotidiennes, ainsi que les signaux de renforcement des phases light/REM.
- Lorsque Dreaming est activé, `memory-core` gère automatiquement une tâche Cron qui exécute un balayage complet (`light -> REM -> deep`) en arrière-plan (aucun `openclaw cron add` manuel requis).
- `--agent <id>` : limite la portée à un seul agent (par défaut : l’agent par défaut).
- `--limit <n>` : nombre maximal de candidats à retourner/appliquer.
- `--min-score <n>` : score de promotion pondéré minimal.
- `--min-recall-count <n>` : nombre minimal de rappels requis pour un candidat.
- `--min-unique-queries <n>` : nombre minimal de requêtes distinctes requis pour un candidat.
- `--apply` : ajoute les candidats sélectionnés à `MEMORY.md` et les marque comme promus.
- `--include-promoted` : inclut les candidats déjà promus dans la sortie.
- `--json` : affiche une sortie JSON.

`memory promote-explain` :

Explique un candidat de promotion spécifique et la répartition de son score.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>` : clé de candidat, fragment de chemin ou fragment d’extrait à rechercher.
- `--agent <id>` : limite la portée à un seul agent (par défaut : l’agent par défaut).
- `--include-promoted` : inclut les candidats déjà promus.
- `--json` : affiche une sortie JSON.

`memory rem-harness` :

Prévisualise les réflexions REM, les vérités candidates et la sortie de promotion profonde sans rien écrire.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>` : limite la portée à un seul agent (par défaut : l’agent par défaut).
- `--include-promoted` : inclut les candidats profonds déjà promus.
- `--json` : affiche une sortie JSON.

## Dreaming

Dreaming est le système de consolidation de mémoire en arrière-plan avec trois phases coopératives : **light** (trier/préparer le matériel à court terme), **deep** (promouvoir les faits durables dans `MEMORY.md`) et **REM** (réfléchir et faire émerger les thèmes).

- Activez avec `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Basculez depuis le chat avec `/dreaming on|off` (ou inspectez avec `/dreaming status`).
- Dreaming s’exécute selon un calendrier de balayage géré (`dreaming.frequency`) et exécute les phases dans l’ordre : light, REM, deep.
- Seule la phase deep écrit une mémoire durable dans `MEMORY.md`.
- La sortie de phase lisible par l’humain et les entrées de journal sont écrites dans `DREAMS.md` (ou dans le fichier existant `dreams.md`), avec des rapports facultatifs par phase dans `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Le classement utilise des signaux pondérés : fréquence de rappel, pertinence de récupération, diversité des requêtes, récence temporelle, consolidation inter-journées et richesse conceptuelle dérivée.
- La promotion relit la note quotidienne active avant d’écrire dans `MEMORY.md`, afin que les extraits à court terme modifiés ou supprimés ne soient pas promus depuis des instantanés obsolètes du magasin de rappels.
- Les exécutions planifiées et manuelles de `memory promote` partagent les mêmes valeurs par défaut de phase deep, sauf si vous passez des remplacements de seuil via la CLI.
- Les exécutions automatiques se déploient sur l’ensemble des espaces de travail mémoire configurés.

Planification par défaut :

- **Cadence de balayage** : `dreaming.frequency = 0 3 * * *`
- **Seuils deep** : `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

Exemple :

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

Notes :

- `memory index --verbose` affiche les détails par phase (fournisseur, modèle, sources, activité par lots).
- `memory status` inclut tous les chemins supplémentaires configurés via `memorySearch.extraPaths`.
- Si les champs de clés d’API distantes d’active memory effectivement actives sont configurés comme SecretRefs, la commande résout ces valeurs depuis l’instantané actif du Gateway. Si le Gateway n’est pas disponible, la commande échoue rapidement.
- Note sur le décalage de version du Gateway : ce chemin de commande nécessite un Gateway qui prend en charge `secrets.resolve` ; les Gateway plus anciens retournent une erreur de méthode inconnue.
- Ajustez la cadence de balayage planifiée avec `dreaming.frequency`. La politique de promotion deep est sinon interne ; utilisez les indicateurs CLI sur `memory promote` lorsque vous avez besoin de remplacements manuels ponctuels.
- `memory rem-harness --path <file-or-dir> --grounded` prévisualise `What Happened`, `Reflections` et `Possible Lasting Updates` ancrés depuis des notes quotidiennes historiques sans rien écrire.
- `memory rem-backfill --path <file-or-dir>` écrit des entrées de journal ancrées et réversibles dans `DREAMS.md` pour examen dans l’interface utilisateur.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` amorce également des candidats durables ancrés dans le magasin actif de promotion à court terme afin que la phase deep normale puisse les classer.
- `memory rem-backfill --rollback` supprime les entrées de journal ancrées précédemment écrites, et `memory rem-backfill --rollback-short-term` supprime les candidats à court terme ancrés précédemment préparés.
- Consultez [Dreaming](/fr/concepts/dreaming) pour les descriptions complètes des phases et la référence de configuration.

## Connexe

- [Référence CLI](/fr/cli)
- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
