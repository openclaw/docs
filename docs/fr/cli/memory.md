---
read_when:
    - Vous voulez indexer ou rechercher dans la mémoire sémantique
    - Vous déboguez la disponibilité de la mémoire ou l’indexation
    - Vous souhaitez promouvoir la mémoire à court terme rappelée en `MEMORY.md`
summary: Référence CLI pour `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Mémoire
x-i18n:
    generated_at: "2026-04-30T07:19:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53301e82d4ebe72b161b3a58078e7b75b9e499bc55cbceec5032c7e410619bd4
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Gérer l’indexation et la recherche de mémoire sémantique.
Fourni par le Plugin Active Memory actif (par défaut : `memory-core` ; définissez `plugins.slots.memory = "none"` pour le désactiver).

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

- `--agent <id>` : limiter la portée à un seul agent. Sans cette option, ces commandes s’exécutent pour chaque agent configuré ; si aucune liste d’agents n’est configurée, elles se rabattent sur l’agent par défaut.
- `--verbose` : émettre des journaux détaillés pendant les sondes et l’indexation.

`memory status` :

- `--deep` : sonder la disponibilité des vecteurs et des embeddings. Un simple `memory status` reste rapide et n’exécute pas de ping d’embedding en direct. Le mode lexical QMD `searchMode: "search"` ignore les sondes de vecteurs sémantiques et la maintenance des embeddings même avec `--deep`.
- `--index` : exécuter une réindexation si le magasin est sale (implique `--deep`).
- `--fix` : réparer les verrous de rappel obsolètes et normaliser les métadonnées de promotion.
- `--json` : afficher la sortie JSON.

Si `memory status` affiche `Dreaming status: blocked`, le cron Dreaming géré est activé, mais le Heartbeat qui le pilote ne se déclenche pas pour l’agent par défaut. Consultez [Dreaming ne s’exécute jamais](/fr/concepts/dreaming#dreaming-never-runs-status-shows-blocked) pour les deux causes courantes.

`memory index` :

- `--force` : forcer une réindexation complète.

`memory search` :

- Entrée de requête : passez soit l’argument positionnel `[query]`, soit `--query <text>`.
- Si les deux sont fournis, `--query` l’emporte.
- Si aucun n’est fourni, la commande se termine avec une erreur.
- `--agent <id>` : limiter la portée à un seul agent (par défaut : l’agent par défaut).
- `--max-results <n>` : limiter le nombre de résultats renvoyés.
- `--min-score <n>` : filtrer les correspondances à score faible.
- `--json` : afficher les résultats JSON.

`memory promote` :

Prévisualiser et appliquer les promotions de mémoire à court terme.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- écrire les promotions dans `MEMORY.md` (par défaut : prévisualisation uniquement).
- `--limit <n>` -- plafonner le nombre de candidats affichés.
- `--include-promoted` -- inclure les entrées déjà promues lors des cycles précédents.

Options complètes :

- Classe les candidats à court terme issus de `memory/YYYY-MM-DD.md` à l’aide de signaux de promotion pondérés (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Utilise les signaux à court terme provenant à la fois des rappels de mémoire et des passes d’ingestion quotidienne, ainsi que les signaux de renforcement des phases légère/REM.
- Lorsque Dreaming est activé, `memory-core` gère automatiquement une tâche cron qui exécute un balayage complet (`light -> REM -> deep`) en arrière-plan (aucun `openclaw cron add` manuel requis).
- `--agent <id>` : limiter la portée à un seul agent (par défaut : l’agent par défaut).
- `--limit <n>` : nombre maximal de candidats à renvoyer/appliquer.
- `--min-score <n>` : score de promotion pondéré minimal.
- `--min-recall-count <n>` : nombre minimal de rappels requis pour un candidat.
- `--min-unique-queries <n>` : nombre minimal de requêtes distinctes requis pour un candidat.
- `--apply` : ajouter les candidats sélectionnés à `MEMORY.md` et les marquer comme promus.
- `--include-promoted` : inclure dans la sortie les candidats déjà promus.
- `--json` : afficher la sortie JSON.

`memory promote-explain` :

Expliquer un candidat de promotion précis et la décomposition de son score.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>` : clé de candidat, fragment de chemin ou fragment d’extrait à rechercher.
- `--agent <id>` : limiter la portée à un seul agent (par défaut : l’agent par défaut).
- `--include-promoted` : inclure les candidats déjà promus.
- `--json` : afficher la sortie JSON.

`memory rem-harness` :

Prévisualiser les réflexions REM, les vérités candidates et la sortie de promotion profonde sans rien écrire.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>` : limiter la portée à un seul agent (par défaut : l’agent par défaut).
- `--include-promoted` : inclure les candidats profonds déjà promus.
- `--json` : afficher la sortie JSON.

## Dreaming

Dreaming est le système de consolidation de mémoire en arrière-plan avec trois phases coopératives : **légère** (trier/préparer le matériel à court terme), **profonde** (promouvoir les faits durables dans `MEMORY.md`) et **REM** (réfléchir et faire émerger les thèmes).

- Activez-le avec `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Basculez-le depuis le chat avec `/dreaming on|off` (ou inspectez-le avec `/dreaming status`).
- Dreaming s’exécute selon un calendrier de balayage géré unique (`dreaming.frequency`) et exécute les phases dans l’ordre : légère, REM, profonde.
- Seule la phase profonde écrit la mémoire durable dans `MEMORY.md`.
- La sortie de phase lisible par l’humain et les entrées de journal sont écrites dans `DREAMS.md` (ou dans le `dreams.md` existant), avec des rapports facultatifs par phase dans `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Le classement utilise des signaux pondérés : fréquence de rappel, pertinence de récupération, diversité des requêtes, récence temporelle, consolidation entre journées et richesse conceptuelle dérivée.
- La promotion relit la note quotidienne active avant d’écrire dans `MEMORY.md`, de sorte que les extraits à court terme modifiés ou supprimés ne sont pas promus depuis des instantanés obsolètes du magasin de rappels.
- Les exécutions planifiées et manuelles de `memory promote` partagent les mêmes valeurs par défaut de phase profonde, sauf si vous passez des remplacements de seuil via la CLI.
- Les exécutions automatiques se répartissent entre les espaces de travail de mémoire configurés.

Planification par défaut :

- **Cadence de balayage** : `dreaming.frequency = 0 3 * * *`
- **Seuils profonds** : `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

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

- `memory index --verbose` affiche les détails par phase (fournisseur, modèle, sources, activité de lot).
- `memory status` inclut tous les chemins supplémentaires configurés via `memorySearch.extraPaths`.
- Si des champs de clé d’API distante Active Memory effectivement actifs sont configurés comme SecretRefs, la commande résout ces valeurs depuis l’instantané Gateway actif. Si Gateway est indisponible, la commande échoue rapidement.
- Note sur le décalage de version de Gateway : ce chemin de commande nécessite un Gateway qui prend en charge `secrets.resolve` ; les anciens gateways renvoient une erreur de méthode inconnue.
- Ajustez la cadence de balayage planifiée avec `dreaming.frequency`. La politique de promotion profonde est autrement interne ; utilisez les options de CLI sur `memory promote` lorsque vous avez besoin de remplacements manuels ponctuels.
- `memory rem-harness --path <file-or-dir> --grounded` prévisualise les sections ancrées `What Happened`, `Reflections` et `Possible Lasting Updates` depuis des notes quotidiennes historiques sans rien écrire.
- `memory rem-backfill --path <file-or-dir>` écrit des entrées de journal ancrées réversibles dans `DREAMS.md` pour révision dans l’interface utilisateur.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` alimente aussi le magasin de promotion à court terme actif avec des candidats durables ancrés afin que la phase profonde normale puisse les classer.
- `memory rem-backfill --rollback` supprime les entrées de journal ancrées écrites précédemment, et `memory rem-backfill --rollback-short-term` supprime les candidats à court terme ancrés préparés précédemment.
- Consultez [Dreaming](/fr/concepts/dreaming) pour les descriptions complètes des phases et la référence de configuration.

## Connexe

- [Référence CLI](/fr/cli)
- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
