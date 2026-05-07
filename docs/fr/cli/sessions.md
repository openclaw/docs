---
read_when:
    - Vous souhaitez lister les sessions enregistrées et consulter l’activité récente
summary: Référence CLI pour `openclaw sessions` (lister les sessions stockées + utilisation)
title: Sessions
x-i18n:
    generated_at: "2026-05-07T13:14:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: cdfdc9223f11da87b514f96e0a9505286e36d98647b3ff3a79b90588e4e69c1b
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Liste les sessions de conversation stockées.

Les listes de sessions ne sont pas des contrôles de disponibilité des canaux/fournisseurs. Elles affichent les lignes de conversation persistées depuis les magasins de sessions. Un canal Discord, Slack, Telegram ou autre canal silencieux peut se reconnecter correctement sans créer de nouvelle ligne de session tant qu’un message n’a pas été traité. Utilisez `openclaw channels status --probe`, `openclaw status --deep` ou `openclaw health --verbose` lorsque vous avez besoin de la connectivité réelle des canaux.

Les réponses `openclaw sessions` et Gateway `sessions.list` sont bornées par défaut afin que les grands magasins de longue durée ne puissent pas monopoliser le processus CLI ou la boucle d’événements Gateway. La CLI renvoie par défaut les 100 sessions les plus récentes ; passez `--limit <n>` pour une fenêtre plus petite ou plus grande, ou `--limit all` lorsque vous avez intentionnellement besoin de tout le magasin. Les réponses JSON incluent `totalCount`, `limitApplied` et `hasMore` lorsque les appelants doivent indiquer que d’autres lignes existent.

Les clients RPC peuvent passer `configuredAgentsOnly: true` pour conserver la source de découverte combinée large tout en ne renvoyant que les lignes des agents actuellement présents dans la configuration. L’interface de contrôle utilise ce mode par défaut afin que les magasins d’agents supprimés ou présents uniquement sur disque ne réapparaissent pas dans la vue Sessions.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --verbose
openclaw sessions --json
```

Sélection de la portée :

- par défaut : magasin de l’agent par défaut configuré
- `--verbose` : journalisation détaillée
- `--agent <id>` : un magasin d’agent configuré
- `--all-agents` : regroupe tous les magasins d’agents configurés
- `--store <path>` : chemin explicite du magasin (ne peut pas être combiné avec `--agent` ou `--all-agents`)
- `--limit <n|all>` : nombre maximal de lignes à afficher (par défaut `100` ; `all` rétablit la sortie complète)

Exporter un lot de trajectoire pour une session stockée :

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Il s’agit du chemin de commande utilisé par la commande slash `/export-trajectory` après que le propriétaire a approuvé la demande d’exécution. Le répertoire de sortie est toujours résolu dans `.openclaw/trajectory-exports/` sous l’espace de travail sélectionné.

`openclaw sessions --all-agents` lit les magasins d’agents configurés. La découverte de sessions Gateway et ACP est plus large : elle inclut aussi les magasins présents uniquement sur disque trouvés sous la racine `agents/` par défaut ou une racine `session.store` basée sur un modèle. Ces magasins découverts doivent se résoudre en fichiers `sessions.json` ordinaires à l’intérieur de la racine de l’agent ; les liens symboliques et les chemins hors racine sont ignorés.

Exemples JSON :

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
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## Maintenance du nettoyage

Exécuter la maintenance maintenant (au lieu d’attendre le prochain cycle d’écriture) :

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` utilise les paramètres `session.maintenance` de la configuration :

- Note de portée : `openclaw sessions cleanup` maintient les magasins de sessions, les transcriptions et les fichiers annexes de trajectoire. Il ne purge pas les journaux d’exécution Cron (`cron/runs/<jobId>.jsonl`), qui sont gérés par `cron.runLog.maxBytes` et `cron.runLog.keepLines` dans la [configuration Cron](/fr/automation/cron-jobs#configuration) et expliqués dans la [maintenance Cron](/fr/automation/cron-jobs#maintenance).
- Le nettoyage purge aussi les transcriptions primaires non référencées, les points de contrôle de Compaction et les fichiers annexes de trajectoire plus anciens que `session.maintenance.pruneAfter` ; les fichiers encore référencés par `sessions.json` sont conservés.

- `--dry-run` : prévisualise le nombre d’entrées qui seraient purgées/plafonnées sans écrire.
  - En mode texte, l’exécution à blanc affiche un tableau d’actions par session (`Action`, `Key`, `Age`, `Model`, `Flags`) afin que vous puissiez voir ce qui serait conservé ou supprimé.
- `--enforce` : applique la maintenance même lorsque `session.maintenance.mode` vaut `warn`.
- `--fix-missing` : supprime les entrées dont les fichiers de transcription sont manquants, même si elles ne seraient normalement pas encore exclues par l’âge ou le nombre.
- `--fix-dm-scope` : lorsque `session.dmScope` vaut `main`, retire les lignes de messages directs obsolètes indexées par pair laissées par un routage antérieur `per-peer`, `per-channel-peer` ou `per-account-channel-peer`. Utilisez d’abord `--dry-run` ; l’application du nettoyage supprime ces lignes de `sessions.json` et conserve leurs transcriptions comme archives supprimées.
- `--active-key <key>` : protège une clé active spécifique contre l’éviction due au budget disque. Les pointeurs de conversation externes durables, comme les sessions de groupe et les sessions de chat limitées à un fil, sont également conservés par la maintenance d’âge, de nombre et de budget disque.
- `--agent <id>` : exécute le nettoyage pour un magasin d’agent configuré.
- `--all-agents` : exécute le nettoyage pour tous les magasins d’agents configurés.
- `--store <path>` : exécute l’opération sur un fichier `sessions.json` spécifique.
- `--json` : affiche un résumé JSON. Avec `--all-agents`, la sortie inclut un résumé par magasin.

Lorsqu’un Gateway est joignable, le nettoyage sans exécution à blanc des magasins d’agents configurés est envoyé via le Gateway afin qu’il partage le même rédacteur de magasin de sessions que le trafic d’exécution. Utilisez `--store <path>` pour une réparation hors ligne explicite d’un fichier de magasin.

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

Connexe :

- Configuration des sessions : [Référence de configuration](/fr/gateway/config-agents#session)

## Connexe

- [Référence CLI](/fr/cli)
- [Gestion des sessions](/fr/concepts/session)
