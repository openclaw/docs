---
read_when:
    - Vous souhaitez répertorier les sessions enregistrées et consulter l’activité récente
summary: Référence de la CLI pour `openclaw sessions` (répertorier les sessions stockées et leur utilisation)
title: Sessions
x-i18n:
    generated_at: "2026-07-12T15:16:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 29820bd34035ba3a6539950bd18dc671739eaeee9ddea3d57455c16b945caffa
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Répertorier les sessions de conversation stockées.

Les listes de sessions ne vérifient pas la disponibilité des canaux ou des fournisseurs. Elles affichent les lignes de conversation persistantes provenant des magasins de sessions. Un canal Discord, Slack, Telegram ou autre qui reste silencieux peut se reconnecter correctement sans créer de nouvelle ligne de session tant qu’aucun message n’est traité. Utilisez `openclaw channels status --probe`, `openclaw status --deep` ou `openclaw health --verbose` lorsque vous devez vérifier la connectivité des canaux en temps réel.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --store ./tmp/sessions.json
openclaw sessions --json
```

Options :

| Option               | Description                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| `--agent <id>`       | Un magasin d’agent configuré (par défaut : l’agent par défaut configuré).                            |
| `--all-agents`       | Agrège tous les magasins d’agents configurés.                                                       |
| `--store <path>`     | Chemin explicite du magasin (incompatible avec `--agent` et `--all-agents`).                         |
| `--active <minutes>` | Affiche uniquement les sessions mises à jour au cours des N dernières minutes.                      |
| `--limit <n\|all>`   | Nombre maximal de lignes en sortie (`100` par défaut ; `all` rétablit la sortie complète).           |
| `--json`             | Sortie lisible par une machine.                                                                     |
| `--verbose`          | Journalisation détaillée.                                                                           |

`openclaw sessions` et l’appel RPC `sessions.list` du Gateway sont limités par défaut afin que les magasins volumineux et de longue durée ne puissent pas monopoliser le processus de la CLI ou la boucle d’événements du Gateway. Par défaut, la CLI renvoie les 100 sessions les plus récentes ; utilisez `--limit <n>` pour une fenêtre plus petite ou plus grande, ou `--limit all` lorsque vous avez intentionnellement besoin de l’intégralité du magasin. Les réponses JSON incluent `totalCount`, `limitApplied` et `hasMore` lorsque les appelants doivent indiquer que d’autres lignes existent.

Les clients RPC peuvent transmettre `configuredAgentsOnly: true` afin de conserver la vaste source de découverte combinée tout en ne renvoyant que les lignes des agents actuellement présents dans la configuration. L’interface de contrôle utilise ce mode par défaut afin que les magasins d’agents supprimés ou uniquement présents sur disque ne réapparaissent pas dans la vue Sessions.

`--all-agents` lit les magasins d’agents configurés. La découverte des sessions du Gateway et d’ACP est plus large : elle inclut également les magasins SQLite résolus à partir des racines d’agents configurées ou d’une racine `session.store` basée sur un modèle. Les anciens chemins de sélecteur doivent être résolus à l’intérieur de la racine de l’agent ; les liens symboliques et les chemins situés hors de cette racine sont ignorés.

`openclaw sessions --all-agents --json` :

```json
{
  "path": null,
  "stores": [
    { "agentId": "main", "path": "/home/user/.openclaw/agents/main/sessions/sessions.json" },
    { "agentId": "work", "path": "/home/user/.openclaw/agents/work/sessions/sessions.json" }
  ],
  "allAgents": true,
  "count": 2,
  "totalCount": 2,
  "limitApplied": 100,
  "hasMore": false,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "openai/gpt-5.6-sol" },
    { "agentId": "work", "key": "agent:work:main", "model": "anthropic/claude-sonnet-4-6" }
  ]
}
```

## Suivre la progression de la trajectoire

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` affiche les événements récents de la trajectoire d’exécution sous forme de lignes de progression compactes. Sans `--session-key`, la commande suit d’abord les sessions en cours d’exécution, puis la dernière session stockée. `--tail <count>` contrôle le nombre d’événements existants affichés avant le mode de suivi ; la valeur par défaut est `80`, et `0` commence à la fin actuelle. `--follow` continue de surveiller la session sélectionnée, stockée dans SQLite, ou un fichier de trajectoire hérité explicite.

La vue de progression est volontairement prudente : le texte des invites, les arguments des outils et le corps de leurs résultats ne sont pas affichés. Les appels d’outils indiquent le nom de l’outil avec `{...redacted...}` ; les résultats des outils affichent un état tel que `ok`, `error` ou `done` ; les lignes d’achèvement du modèle indiquent le fournisseur, le modèle et l’état final.

## Exporter un paquet de trajectoire

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Il s’agit du chemin de commande utilisé par la commande slash `/export-trajectory` après
que le propriétaire a approuvé la demande d’exécution. Le répertoire de sortie est toujours résolu
dans `.openclaw/trajectory-exports/` sous l’espace de travail sélectionné.

## Maintenance de nettoyage

Exécutez la maintenance maintenant au lieu d’attendre le prochain cycle d’écriture :

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` utilise les paramètres `session.maintenance` de la configuration
([Référence de configuration](/fr/gateway/config-agents#session)) :

- Remarque sur la portée : `openclaw sessions cleanup` assure la maintenance des magasins de sessions,
  des transcriptions, des lignes de trajectoire et des fichiers annexes de trajectoire hérités. Il ne
  purge pas l’historique d’exécution de Cron, qui est géré par `cron.runLog.keepLines`
  ([Configuration de Cron](/fr/automation/cron-jobs#configuration)).
- Le nettoyage supprime également les artefacts de transcription hérités/archivés non référencés,
  les points de contrôle de Compaction et les fichiers annexes de trajectoire antérieurs à
  `session.maintenance.pruneAfter` ; les artefacts encore référencés par les lignes de session SQLite
  sont conservés.
- Le nettoyage signale séparément le nettoyage des sondes d’exécution de modèle de courte durée du Gateway sous
  `modelRunPruned`. Cela correspond uniquement aux clés explicites strictes de la forme
  `agent:*:explicit:model-run-<uuid>`. La durée de conservation est fixée à `24h` et le
  nettoyage est déclenché sous pression : il supprime les lignes de sonde obsolètes uniquement lorsque la
  maintenance des entrées de session ou la pression de la limite est atteinte. Lorsqu’il s’exécute, le nettoyage
  des exécutions de modèle a lieu avant le nettoyage global des éléments obsolètes et l’application des limites.

Options :

| Option               | Description                                                                                                                                                                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run`          | Prévisualise le nombre d’entrées qui seraient purgées/limitées sans effectuer d’écriture. En mode texte, affiche un tableau d’actions par session (`Action`, `Key`, `Age`, `Model`, `Flags`) ainsi qu’un résumé regroupé par libellé de session.                                                               |
| `--enforce`          | Applique la maintenance même lorsque `session.maintenance.mode` vaut `warn`.                                                                                                                                                                                                                                |
| `--fix-missing`      | Supprime les entrées héritées dont les artefacts de transcription archivés sont manquants ou ne contiennent qu’un en-tête/sont vides, même si elles ne dépasseraient normalement pas encore les limites d’ancienneté ou de nombre.                                                                           |
| `--fix-dm-scope`     | Lorsque `session.dmScope` vaut `main`, retire les lignes de messages directs obsolètes indexées par pair, laissées par un routage antérieur `per-peer`, `per-channel-peer` ou `per-account-channel-peer`. Utilisez d’abord `--dry-run` ; l’application supprime ces lignes de SQLite et conserve leurs artefacts de transcription hérités sous forme d’archives supprimées. |
| `--active-key <key>` | Protège une clé active spécifique contre l’éviction due au budget disque. Les pointeurs durables vers des conversations externes, comme les sessions de groupe et les sessions de discussion limitées à un fil, sont également conservés lors de la maintenance par ancienneté, nombre ou budget disque.      |
| `--agent <id>`       | Exécute le nettoyage pour le magasin d’un agent configuré.                                                                                                                                                                                                                                                  |
| `--all-agents`       | Exécute le nettoyage pour les magasins de tous les agents configurés.                                                                                                                                                                                                                                       |
| `--store <path>`     | Exécute le nettoyage sur le chemin d’un sélecteur de magasin hérité spécifique.                                                                                                                                                                                                                             |
| `--json`             | Affiche un résumé JSON. Avec `--all-agents`, la sortie inclut un résumé par magasin.                                                                                                                                                                                                                         |

Lorsqu’un Gateway est joignable, le nettoyage sans simulation des magasins d’agents configurés est
envoyé via le Gateway afin qu’il utilise le même processus d’écriture dans le magasin de sessions que le trafic
d’exécution. Utilisez `--store <path>` pour réparer explicitement hors ligne un sélecteur de magasin
hérité.

`openclaw sessions cleanup --all-agents --dry-run --json` :

```json
{
  "allAgents": true,
  "mode": "warn",
  "dryRun": true,
  "stores": [
    {
      "agentId": "main",
      "storePath": "/home/user/.openclaw/agents/main/sessions/sessions.json",
      "beforeCount": 120,
      "afterCount": 80,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

## Compacter une session

Récupérez du budget de contexte pour une session bloquée ou surdimensionnée. `openclaw sessions
compact <key>` est l’interface de premier niveau autour de la RPC `sessions.compact`
du Gateway et nécessite un Gateway en cours d’exécution.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- Sans `--max-lines`, le Gateway résume la transcription à l’aide d’un LLM. Par défaut, la CLI
  n’impose aucun délai d’expiration côté client ; le Gateway gère le cycle de vie configuré de la
  Compaction.
- Avec `--max-lines <n>`, la transcription est tronquée aux `n` dernières lignes et
  la transcription précédente est archivée dans un fichier annexe `.bak`.
- `--agent <id>` : agent propriétaire de la session ; requis pour les clés `global`.
- `--url` / `--token` / `--password` : paramètres de connexion au Gateway prioritaires.
- `--timeout <ms>` : délai d’expiration RPC facultatif côté client, en millisecondes.
- `--json` : affiche la charge utile RPC brute.

La commande se termine avec un code différent de zéro lorsque le Gateway signale l’échec d’une Compaction ou est
injoignable, afin que les Cron et les scripts ne prennent jamais une absence silencieuse d’opération pour une réussite.

<Note>
`openclaw agent --message '/compact ...'` n’est **pas** un chemin de Compaction. Les commandes slash
provenant de la CLI sont rejetées par la vérification de l’expéditeur autorisé ; cet
appel se termine avec un code différent de zéro et des indications renvoyant ici, au lieu de
ne rien faire silencieusement.
</Note>

### RPC sessions.compact

`openclaw gateway call sessions.compact --params '<json>'` accepte :

| Champ      | Type        | Obligatoire | Description                                                            |
| ---------- | ----------- | ----------- | ---------------------------------------------------------------------- |
| `key`      | string      | oui         | Clé de session à compacter (par exemple `agent:main:main`).            |
| `agentId`  | string      | non         | Identifiant de l’agent propriétaire de la session (pour les clés `global`). |
| `maxLines` | integer ≥ 1 | non         | Tronque aux N dernières lignes au lieu d’utiliser la synthèse par LLM. |

Exemple de réponse de synthèse par LLM :

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

Exemple de réponse avec troncature (`--max-lines 200`) :

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "archived": "/home/user/.openclaw/agents/main/sessions/transcripts/<id>.jsonl.bak",
  "kept": 200
}
```

## Voir aussi

- [Configuration des sessions](/fr/gateway/config-agents#session)
- [Gestion des sessions](/fr/concepts/session)
- [Compaction](/fr/concepts/compaction)
- [Référence de la CLI](/fr/cli)
