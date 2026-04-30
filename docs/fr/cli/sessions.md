---
read_when:
    - Vous souhaitez lister les sessions enregistrées et consulter l’activité récente
summary: Référence CLI pour `openclaw sessions` (liste des sessions enregistrées + utilisation)
title: Sessions
x-i18n:
    generated_at: "2026-04-30T07:20:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fea2014f538b00a27fa0078391a421843052333c5bcfc8100fced515eed0004
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Liste les sessions de conversation enregistrées.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

Sélection de la portée :

- par défaut : stockage de l’agent par défaut configuré
- `--verbose` : journalisation détaillée
- `--agent <id>` : un stockage d’agent configuré
- `--all-agents` : agréger tous les stockages d’agents configurés
- `--store <path>` : chemin de stockage explicite (ne peut pas être combiné avec `--agent` ou `--all-agents`)

Exporter un paquet de trajectoire pour une session enregistrée :

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

C’est le chemin de commande utilisé par la commande slash `/export-trajectory` après
l’approbation de la demande d’exécution par le propriétaire. Le répertoire de sortie est toujours résolu
dans `.openclaw/trajectory-exports/` sous l’espace de travail sélectionné.

`openclaw sessions --all-agents` lit les stockages d’agents configurés. La découverte des sessions Gateway et ACP
est plus large : elle inclut aussi les stockages présents uniquement sur le disque trouvés sous
la racine `agents/` par défaut ou une racine `session.store` basée sur un modèle. Ces
stockages découverts doivent se résoudre en fichiers `sessions.json` ordinaires dans la
racine de l’agent ; les liens symboliques et les chemins hors racine sont ignorés.

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
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` utilise les paramètres `session.maintenance` de la configuration :

- Note de portée : `openclaw sessions cleanup` maintient les stockages de sessions, les transcriptions et les fichiers annexes de trajectoire. Il ne purge pas les journaux d’exécution Cron (`cron/runs/<jobId>.jsonl`), qui sont gérés par `cron.runLog.maxBytes` et `cron.runLog.keepLines` dans la [configuration Cron](/fr/automation/cron-jobs#configuration) et expliqués dans la [maintenance Cron](/fr/automation/cron-jobs#maintenance).

- `--dry-run` : prévisualiser le nombre d’entrées qui seraient purgées/plafonnées sans écrire.
  - En mode texte, `dry-run` affiche un tableau d’actions par session (`Action`, `Key`, `Age`, `Model`, `Flags`) afin que vous puissiez voir ce qui serait conservé ou supprimé.
- `--enforce` : appliquer la maintenance même lorsque `session.maintenance.mode` vaut `warn`.
- `--fix-missing` : supprimer les entrées dont les fichiers de transcription sont manquants, même si elles ne seraient normalement pas encore exclues par âge ou par nombre.
- `--active-key <key>` : protéger une clé active spécifique contre l’éviction liée au budget disque.
- `--agent <id>` : exécuter le nettoyage pour un stockage d’agent configuré.
- `--all-agents` : exécuter le nettoyage pour tous les stockages d’agents configurés.
- `--store <path>` : exécuter sur un fichier `sessions.json` spécifique.
- `--json` : afficher un résumé JSON. Avec `--all-agents`, la sortie inclut un résumé par stockage.

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
