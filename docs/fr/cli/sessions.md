---
read_when:
    - Vous souhaitez lister les sessions enregistrées et voir l’activité récente
summary: Référence CLI pour `openclaw sessions` (lister les sessions stockées + utilisation)
title: Sessions
x-i18n:
    generated_at: "2026-05-05T07:05:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: a204189952bc82788eb724c0a6b6db93c7d6795ad69bb6d498e8575236c3272e
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Liste les sessions de conversation stockées.

Les listes de sessions ne sont pas des vérifications de disponibilité des canaux/fournisseurs. Elles affichent les lignes de conversation persistées depuis les magasins de sessions. Un canal Discord, Slack, Telegram ou autre canal inactif peut se reconnecter correctement sans créer de nouvelle ligne de session jusqu’à ce qu’un message soit traité. Utilisez `openclaw channels status --probe`, `openclaw status --deep` ou `openclaw health --verbose` lorsque vous avez besoin de la connectivité réelle des canaux.

Les réponses `openclaw sessions` et Gateway `sessions.list` sont limitées par défaut afin que les grands magasins de longue durée ne puissent pas monopoliser le processus CLI ou la boucle d’événements du Gateway. La CLI renvoie par défaut les 100 sessions les plus récentes ; passez `--limit <n>` pour une fenêtre plus petite/grande ou `--limit all` lorsque vous avez volontairement besoin de l’intégralité du magasin. Les réponses JSON incluent `totalCount`, `limitApplied` et `hasMore` lorsque les appelants doivent indiquer que d’autres lignes existent.

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
- `--all-agents` : agréger tous les magasins d’agents configurés
- `--store <path>` : chemin explicite du magasin (ne peut pas être combiné avec `--agent` ou `--all-agents`)
- `--limit <n|all>` : nombre maximal de lignes à produire (par défaut `100` ; `all` rétablit la sortie complète)

Exporter un bundle de trajectoire pour une session stockée :

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Il s’agit du chemin de commande utilisé par la commande slash `/export-trajectory` après que le propriétaire a approuvé la requête d’exécution. Le répertoire de sortie est toujours résolu à l’intérieur de `.openclaw/trajectory-exports/` sous l’espace de travail sélectionné.

`openclaw sessions --all-agents` lit les magasins d’agents configurés. La découverte de sessions Gateway et ACP est plus large : elle inclut également les magasins présents uniquement sur disque trouvés sous la racine `agents/` par défaut ou une racine `session.store` basée sur un modèle. Ces magasins découverts doivent se résoudre en fichiers `sessions.json` ordinaires à l’intérieur de la racine de l’agent ; les liens symboliques et les chemins hors racine sont ignorés.

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

## Maintenance de nettoyage

Exécuter la maintenance maintenant (au lieu d’attendre le prochain cycle d’écriture) :

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` utilise les paramètres `session.maintenance` de la configuration :

- Note de portée : `openclaw sessions cleanup` maintient les magasins de sessions, les transcriptions et les fichiers annexes de trajectoire. Il ne purge pas les journaux d’exécution Cron (`cron/runs/<jobId>.jsonl`), qui sont gérés par `cron.runLog.maxBytes` et `cron.runLog.keepLines` dans la [configuration Cron](/fr/automation/cron-jobs#configuration) et expliqués dans la [maintenance Cron](/fr/automation/cron-jobs#maintenance).
- Le nettoyage purge également les transcriptions principales non référencées, les points de contrôle de Compaction et les fichiers annexes de trajectoire plus anciens que `session.maintenance.pruneAfter` ; les fichiers encore référencés par `sessions.json` sont préservés.

- `--dry-run` : prévisualiser combien d’entrées seraient purgées/plafonnées sans écriture.
  - En mode texte, dry-run affiche un tableau d’actions par session (`Action`, `Key`, `Age`, `Model`, `Flags`) afin que vous puissiez voir ce qui serait conservé ou supprimé.
- `--enforce` : appliquer la maintenance même lorsque `session.maintenance.mode` vaut `warn`.
- `--fix-missing` : supprimer les entrées dont les fichiers de transcription sont manquants, même si elles ne seraient normalement pas encore exclues par âge/nombre.
- `--active-key <key>` : protéger une clé active spécifique de l’éviction liée au budget disque. Les pointeurs de conversation externes durables, comme les sessions de groupe et les sessions de chat limitées à un fil, sont également conservés par la maintenance selon l’âge, le nombre et le budget disque.
- `--agent <id>` : exécuter le nettoyage pour un magasin d’agent configuré.
- `--all-agents` : exécuter le nettoyage pour tous les magasins d’agents configurés.
- `--store <path>` : exécuter sur un fichier `sessions.json` spécifique.
- `--json` : afficher un résumé JSON. Avec `--all-agents`, la sortie inclut un résumé par magasin.

Lorsqu’un Gateway est joignable, le nettoyage sans dry-run pour les magasins d’agents configurés est envoyé via le Gateway afin qu’il partage le même rédacteur de magasin de sessions que le trafic d’exécution. Utilisez `--store <path>` pour la réparation hors ligne explicite d’un fichier de magasin.

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
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

Connexe :

- Configuration de session : [Référence de configuration](/fr/gateway/config-agents#session)

## Connexe

- [Référence CLI](/fr/cli)
- [Gestion des sessions](/fr/concepts/session)
