---
read_when:
    - Vous souhaitez indexer ou rechercher la mémoire sémantique
    - Vous déboguez la disponibilité ou l’indexation de la mémoire
    - Vous souhaitez promouvoir une mémoire à court terme rappelée dans `MEMORY.md`
summary: Référence CLI pour `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: memory
x-i18n:
    generated_at: "2026-04-23T07:01:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a6207037e1097aa793ccb8fbdb8cbf8708ceb7910e31bc286ebb7a5bccb30a2
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

Gérez l’indexation et la recherche de la mémoire sémantique.
Fourni par le Plugin de mémoire actif (par défaut : `memory-core` ; définissez `plugins.slots.memory = "none"` pour le désactiver).

Liens associés :

- Concept de mémoire : [Mémoire](/fr/concepts/memory)
- Wiki mémoire : [Wiki mémoire](/fr/plugins/memory-wiki)
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

- `--agent <id>` : limite à un seul agent. Sans cela, ces commandes s’exécutent pour chaque agent configuré ; si aucune liste d’agents n’est configurée, elles reviennent à l’agent par défaut.
- `--verbose` : émet des journaux détaillés pendant les sondes et l’indexation.

`memory status` :

- `--deep` : sonde la disponibilité des vecteurs + embeddings.
- `--index` : exécute une réindexation si le magasin est sale (implique `--deep`).
- `--fix` : répare les verrous de rappel obsolètes et normalise les métadonnées de promotion.
- `--json` : affiche la sortie JSON.

Si `memory status` affiche `Dreaming status: blocked`, le Cron Dreaming géré est activé mais le Heartbeat qui le pilote ne se déclenche pas pour l’agent par défaut. Voir [Dreaming ne s’exécute jamais](/fr/concepts/dreaming#dreaming-never-runs-status-shows-blocked) pour les deux causes fréquentes.

`memory index` :

- `--force` : force une réindexation complète.

`memory search` :

- Entrée de requête : passez soit `[query]` en positionnel, soit `--query <text>`.
- Si les deux sont fournis, `--query` est prioritaire.
- Si aucun des deux n’est fourni, la commande quitte avec une erreur.
- `--agent <id>` : limite à un seul agent (par défaut : l’agent par défaut).
- `--max-results <n>` : limite le nombre de résultats renvoyés.
- `--min-score <n>` : filtre les correspondances avec un score faible.
- `--json` : affiche les résultats JSON.

`memory promote` :

Prévisualisez et appliquez les promotions de mémoire à court terme.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- écrit les promotions dans `MEMORY.md` (par défaut : prévisualisation uniquement).
- `--limit <n>` -- limite le nombre de candidats affichés.
- `--include-promoted` -- inclut les entrées déjà promues lors des cycles précédents.

Options complètes :

- Classe les candidats à court terme depuis `memory/YYYY-MM-DD.md` à l’aide de signaux de promotion pondérés (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Utilise les signaux à court terme issus à la fois des rappels de mémoire et des passes d’ingestion quotidiennes, ainsi que des signaux légers/de phase REM.
- Lorsque Dreaming est activé, `memory-core` gère automatiquement une tâche Cron qui exécute un balayage complet (`light -> REM -> deep`) en arrière-plan (aucun `openclaw cron add` manuel requis).
- `--agent <id>` : limite à un seul agent (par défaut : l’agent par défaut).
- `--limit <n>` : nombre maximal de candidats à renvoyer/appliquer.
- `--min-score <n>` : score minimal pondéré de promotion.
- `--min-recall-count <n>` : nombre minimal de rappels requis pour un candidat.
- `--min-unique-queries <n>` : nombre minimal de requêtes distinctes requis pour un candidat.
- `--apply` : ajoute les candidats sélectionnés à `MEMORY.md` et les marque comme promus.
- `--include-promoted` : inclut les candidats déjà promus dans la sortie.
- `--json` : affiche la sortie JSON.

`memory promote-explain` :

Explique un candidat de promotion spécifique et le détail de son score.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>` : clé de candidat, fragment de chemin ou fragment d’extrait à rechercher.
- `--agent <id>` : limite à un seul agent (par défaut : l’agent par défaut).
- `--include-promoted` : inclut les candidats déjà promus.
- `--json` : affiche la sortie JSON.

`memory rem-harness` :

Prévisualisez les réflexions REM, les vérités candidates et la sortie de promotion profonde sans rien écrire.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>` : limite à un seul agent (par défaut : l’agent par défaut).
- `--include-promoted` : inclut les candidats profonds déjà promus.
- `--json` : affiche la sortie JSON.

## Dreaming

Dreaming est le système de consolidation de mémoire en arrière-plan avec trois phases
coopératives : **light** (trier/préparer le contenu à court terme), **deep** (promouvoir les faits
durables dans `MEMORY.md`) et **REM** (réfléchir et faire émerger les thèmes).

- Activez-le avec `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Activez/désactivez-le depuis le chat avec `/dreaming on|off` (ou inspectez avec `/dreaming status`).
- Dreaming s’exécute selon une planification de balayage gérée unique (`dreaming.frequency`) et exécute les phases dans l’ordre : light, REM, deep.
- Seule la phase deep écrit de la mémoire durable dans `MEMORY.md`.
- Les sorties de phase lisibles par un humain et les entrées de journal sont écrites dans `DREAMS.md` (ou `dreams.md` existant), avec des rapports facultatifs par phase dans `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Le classement utilise des signaux pondérés : fréquence de rappel, pertinence de récupération, diversité des requêtes, récence temporelle, consolidation inter-jours et richesse conceptuelle dérivée.
- La promotion relit la note quotidienne active avant d’écrire dans `MEMORY.md`, de sorte que les extraits à court terme modifiés ou supprimés ne soient pas promus à partir d’instantanés obsolètes du magasin de rappel.
- Les exécutions planifiées et manuelles de `memory promote` partagent les mêmes valeurs par défaut de phase deep sauf si vous passez des surcharges de seuil CLI.
- Les exécutions automatiques se répartissent entre les espaces de travail mémoire configurés.

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

Remarques :

- `memory index --verbose` affiche les détails par phase (fournisseur, modèle, sources, activité des lots).
- `memory status` inclut tous les chemins supplémentaires configurés via `memorySearch.extraPaths`.
- Si les champs de clé API distante de mémoire effectivement active sont configurés comme SecretRefs, la commande résout ces valeurs à partir de l’instantané Gateway actif. Si Gateway n’est pas disponible, la commande échoue immédiatement.
- Remarque sur le décalage de version de Gateway : ce chemin de commande nécessite une Gateway prenant en charge `secrets.resolve` ; les anciennes Gateway renvoient une erreur de méthode inconnue.
- Ajustez la cadence du balayage planifié avec `dreaming.frequency`. La politique de promotion deep est sinon interne ; utilisez les indicateurs CLI sur `memory promote` lorsque vous avez besoin de surcharges manuelles ponctuelles.
- `memory rem-harness --path <file-or-dir> --grounded` prévisualise des `What Happened`, `Reflections` et `Possible Lasting Updates` ancrés à partir d’anciennes notes quotidiennes sans rien écrire.
- `memory rem-backfill --path <file-or-dir>` écrit des entrées de journal ancrées réversibles dans `DREAMS.md` pour révision UI.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` alimente également le magasin actif de promotion à court terme avec des candidats durables ancrés afin que la phase deep normale puisse les classer.
- `memory rem-backfill --rollback` supprime les entrées de journal ancrées précédemment écrites, et `memory rem-backfill --rollback-short-term` supprime les candidats à court terme ancrés précédemment préparés.
- Voir [Dreaming](/fr/concepts/dreaming) pour la description complète des phases et la référence de configuration.
