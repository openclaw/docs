---
read_when:
    - Vous voulez lister les sessions enregistrées et voir l’activité récente
summary: Référence CLI pour `openclaw sessions` (lister les sessions stockées + utilisation)
title: Sessions
x-i18n:
    generated_at: "2026-05-05T01:44:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6eb484ab1fa7686cf42dd00e640c4ae8616c4ea1c29873ea72694d72b9c680e7
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Liste les sessions de conversation enregistrées.

Les listes de sessions ne sont pas des vérifications de disponibilité des canaux/fournisseurs. Elles affichent les lignes de conversation persistées dans les stockages de sessions. Un Discord, Slack, Telegram ou autre canal silencieux peut se reconnecter correctement sans créer de nouvelle ligne de session jusqu’à ce qu’un message soit traité. Utilisez `openclaw channels status --probe`, `openclaw status --deep` ou `openclaw health --verbose` lorsque vous avez besoin de vérifier la connectivité en direct des canaux.

Les réponses `openclaw sessions` et Gateway `sessions.list` sont bornées par défaut afin que les grands stockages de longue durée ne puissent pas monopoliser le processus CLI ou la boucle d’événements Gateway. La CLI renvoie par défaut les 100 sessions les plus récentes ; passez `--limit <n>` pour une fenêtre plus petite/plus grande ou `--limit all` lorsque vous avez volontairement besoin du stockage complet. Les réponses JSON incluent `totalCount`, `limitApplied` et `hasMore` lorsque les appelants doivent indiquer que d’autres lignes existent.

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

- par défaut : stockage de l’agent par défaut configuré
- `--verbose` : journalisation détaillée
- `--agent <id>` : un stockage d’agent configuré
- `--all-agents` : agréger tous les stockages d’agents configurés
- `--store <path>` : chemin de stockage explicite (ne peut pas être combiné avec `--agent` ou `--all-agents`)
- `--limit <n|all>` : nombre maximal de lignes à afficher (`100` par défaut ; `all` restaure la sortie complète)

Exportez un paquet de trajectoire pour une session enregistrée :

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

C’est le chemin de commande utilisé par la commande slash `/export-trajectory` après l’approbation de la demande d’exécution par le propriétaire. Le répertoire de sortie est toujours résolu dans `.openclaw/trajectory-exports/` sous l’espace de travail sélectionné.

`openclaw sessions --all-agents` lit les stockages d’agents configurés. La découverte de sessions Gateway et ACP est plus large : elle inclut aussi les stockages uniquement sur disque trouvés sous la racine `agents/` par défaut ou sous une racine `session.store` fondée sur un modèle. Ces stockages découverts doivent être résolus en fichiers `sessions.json` ordinaires à l’intérieur de la racine de l’agent ; les liens symboliques et les chemins hors racine sont ignorés.

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

Exécutez la maintenance maintenant (au lieu d’attendre le prochain cycle d’écriture) :

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` utilise les paramètres `session.maintenance` de la configuration :

- Note de portée : `openclaw sessions cleanup` maintient les stockages de sessions, les transcriptions et les fichiers annexes de trajectoire. Elle ne purge pas les journaux d’exécution Cron (`cron/runs/<jobId>.jsonl`), qui sont gérés par `cron.runLog.maxBytes` et `cron.runLog.keepLines` dans la [configuration Cron](/fr/automation/cron-jobs#configuration) et expliqués dans la [maintenance Cron](/fr/automation/cron-jobs#maintenance).

- `--dry-run` : prévisualise combien d’entrées seraient purgées/plafonnées sans écrire.
  - En mode texte, l’exécution à blanc affiche une table d’actions par session (`Action`, `Key`, `Age`, `Model`, `Flags`) afin que vous puissiez voir ce qui serait conservé ou supprimé.
- `--enforce` : applique la maintenance même lorsque `session.maintenance.mode` vaut `warn`.
- `--fix-missing` : supprime les entrées dont les fichiers de transcription sont manquants, même si elles ne seraient normalement pas encore exclues par l’âge/le nombre.
- `--active-key <key>` : protège une clé active spécifique contre l’éviction liée au budget disque. Les pointeurs de conversations externes durables, comme les sessions de groupe et les sessions de chat limitées à un fil, sont également conservés par la maintenance selon l’âge/le nombre/le budget disque.
- `--agent <id>` : exécute le nettoyage pour un stockage d’agent configuré.
- `--all-agents` : exécute le nettoyage pour tous les stockages d’agents configurés.
- `--store <path>` : exécute l’opération sur un fichier `sessions.json` spécifique.
- `--json` : affiche un résumé JSON. Avec `--all-agents`, la sortie inclut un résumé par stockage.

Lorsqu’un Gateway est joignable, le nettoyage hors exécution à blanc des stockages d’agents configurés est envoyé via le Gateway afin qu’il partage le même rédacteur de stockage de sessions que le trafic d’exécution. Utilisez `--store <path>` pour la réparation hors ligne explicite d’un fichier de stockage.

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

- Configuration des sessions : [Référence de configuration](/fr/gateway/config-agents#session)

## Connexe

- [Référence CLI](/fr/cli)
- [Gestion des sessions](/fr/concepts/session)
