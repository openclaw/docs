---
read_when:
    - Vous voulez répertorier les sessions enregistrées et consulter l’activité récente
summary: Référence CLI pour `openclaw sessions` (lister les sessions enregistrées + utilisation)
title: Sessions
x-i18n:
    generated_at: "2026-05-02T20:43:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c9ec3ca55f7c5b6217b481e9da62f5416df73e69405a0dc15e77d2afeac723f
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Liste les sessions de conversation stockées.

Les listes de sessions ne sont pas des vérifications de disponibilité de canal/fournisseur. Elles affichent les lignes de conversation persistées depuis les stockages de sessions. Un canal Discord, Slack, Telegram ou autre silencieux peut se reconnecter correctement sans créer de nouvelle ligne de session tant qu’un message n’est pas traité. Utilisez `openclaw channels status --probe`, `openclaw status --deep` ou `openclaw health --verbose` lorsque vous avez besoin de la connectivité en direct des canaux.

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
- `--all-agents` : agrège tous les stockages d’agents configurés
- `--store <path>` : chemin de stockage explicite (ne peut pas être combiné avec `--agent` ou `--all-agents`)

Exporter un bundle de trajectoire pour une session stockée :

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

C’est le chemin de commande utilisé par la commande slash `/export-trajectory` après l’approbation de la requête d’exécution par le propriétaire. Le répertoire de sortie est toujours résolu dans `.openclaw/trajectory-exports/` sous l’espace de travail sélectionné.

`openclaw sessions --all-agents` lit les stockages d’agents configurés. La découverte des sessions Gateway et ACP est plus large : elle inclut aussi les stockages uniquement sur disque trouvés sous la racine `agents/` par défaut ou une racine `session.store` basée sur un modèle. Ces stockages découverts doivent se résoudre en fichiers `sessions.json` ordinaires à l’intérieur de la racine de l’agent ; les liens symboliques et les chemins hors racine sont ignorés.

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

- Note sur la portée : `openclaw sessions cleanup` maintient les stockages de sessions, les transcriptions et les sidecars de trajectoire. Il ne purge pas les journaux d’exécution Cron (`cron/runs/<jobId>.jsonl`), qui sont gérés par `cron.runLog.maxBytes` et `cron.runLog.keepLines` dans la [configuration Cron](/fr/automation/cron-jobs#configuration) et expliqués dans la [maintenance Cron](/fr/automation/cron-jobs#maintenance).

- `--dry-run` : prévisualise le nombre d’entrées qui seraient purgées/limitées sans écrire.
  - En mode texte, dry-run affiche un tableau d’actions par session (`Action`, `Key`, `Age`, `Model`, `Flags`) afin que vous puissiez voir ce qui serait conservé ou supprimé.
- `--enforce` : applique la maintenance même lorsque `session.maintenance.mode` vaut `warn`.
- `--fix-missing` : supprime les entrées dont les fichiers de transcription sont manquants, même si elles ne seraient normalement pas encore retirées par âge/nombre.
- `--active-key <key>` : protège une clé active spécifique de l’éviction liée au budget disque. Les pointeurs de conversation externes durables, comme les sessions de groupe et les sessions de discussion limitées à un fil, sont aussi conservés par la maintenance d’âge, de nombre et de budget disque.
- `--agent <id>` : exécute le nettoyage pour un stockage d’agent configuré.
- `--all-agents` : exécute le nettoyage pour tous les stockages d’agents configurés.
- `--store <path>` : s’exécute sur un fichier `sessions.json` spécifique.
- `--json` : affiche un résumé JSON. Avec `--all-agents`, la sortie inclut un résumé par stockage.

Lorsqu’un Gateway est joignable, le nettoyage sans dry-run pour les stockages d’agents configurés est envoyé via le Gateway afin de partager le même writer de stockage de sessions que le trafic d’exécution. Utilisez `--store <path>` pour la réparation hors ligne explicite d’un fichier de stockage.

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
