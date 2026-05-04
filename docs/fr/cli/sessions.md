---
read_when:
    - Vous souhaitez lister les sessions enregistrées et consulter l’activité récente
summary: Référence CLI pour `openclaw sessions` (lister les sessions stockées + utilisation)
title: Sessions
x-i18n:
    generated_at: "2026-05-04T07:02:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8dc90344f40c53513bd6db3696bc709279155f26e7c3b6ea27e81a07a2f9f15e
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Liste les sessions de conversation stockées.

Les listes de sessions ne sont pas des vérifications d’activité des canaux/fournisseurs. Elles affichent les lignes de conversation persistées depuis les magasins de sessions. Un canal Discord, Slack, Telegram ou autre silencieux peut se reconnecter correctement sans créer de nouvelle ligne de session tant qu’un message n’est pas traité. Utilisez `openclaw channels status --probe`, `openclaw status --deep` ou `openclaw health --verbose` lorsque vous avez besoin de vérifier la connectivité en direct des canaux.

Les réponses Gateway `sessions.list` sont bornées par défaut afin que les grands magasins à longue durée de vie ne puissent pas monopoliser la boucle d’événements du Gateway. Passez une valeur `limit` positive explicite depuis les clients RPC lorsqu’une fenêtre de résultats différente est nécessaire ; les réponses incluent `totalCount`, `limitApplied` et `hasMore` lorsque les appelants doivent indiquer que d’autres lignes existent.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

Sélection de la portée :

- par défaut : magasin de l’agent par défaut configuré
- `--verbose` : journalisation détaillée
- `--agent <id>` : un magasin d’agent configuré
- `--all-agents` : agréger tous les magasins d’agents configurés
- `--store <path>` : chemin explicite du magasin (ne peut pas être combiné avec `--agent` ou `--all-agents`)

Exporter un bundle de trajectoire pour une session stockée :

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Il s’agit du chemin de commande utilisé par la commande slash `/export-trajectory` après que le propriétaire a approuvé la demande d’exécution. Le répertoire de sortie est toujours résolu dans `.openclaw/trajectory-exports/` sous l’espace de travail sélectionné.

`openclaw sessions --all-agents` lit les magasins d’agents configurés. La découverte des sessions Gateway et ACP est plus large : elle inclut aussi les magasins présents uniquement sur disque trouvés sous la racine `agents/` par défaut ou une racine `session.store` modélisée. Ces magasins découverts doivent se résoudre en fichiers `sessions.json` ordinaires à l’intérieur de la racine de l’agent ; les liens symboliques et les chemins hors racine sont ignorés.

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

- Note sur la portée : `openclaw sessions cleanup` maintient les magasins de sessions, les transcriptions et les fichiers auxiliaires de trajectoire. Il ne purge pas les journaux d’exécution Cron (`cron/runs/<jobId>.jsonl`), qui sont gérés par `cron.runLog.maxBytes` et `cron.runLog.keepLines` dans la [configuration Cron](/fr/automation/cron-jobs#configuration) et expliqués dans la [maintenance Cron](/fr/automation/cron-jobs#maintenance).

- `--dry-run` : prévisualiser le nombre d’entrées qui seraient purgées/plafonnées sans écrire.
  - En mode texte, l’exécution à blanc affiche un tableau d’actions par session (`Action`, `Key`, `Age`, `Model`, `Flags`) afin que vous puissiez voir ce qui serait conservé ou supprimé.
- `--enforce` : appliquer la maintenance même lorsque `session.maintenance.mode` vaut `warn`.
- `--fix-missing` : supprimer les entrées dont les fichiers de transcription sont manquants, même si elles ne seraient normalement pas encore exclues par l’âge/le nombre.
- `--active-key <key>` : protéger une clé active spécifique contre l’éviction liée au budget disque. Les pointeurs de conversation externes durables, comme les sessions de groupe et les sessions de discussion limitées à un fil, sont également conservés par la maintenance selon l’âge, le nombre et le budget disque.
- `--agent <id>` : exécuter le nettoyage pour un magasin d’agent configuré.
- `--all-agents` : exécuter le nettoyage pour tous les magasins d’agents configurés.
- `--store <path>` : exécuter sur un fichier `sessions.json` spécifique.
- `--json` : afficher un résumé JSON. Avec `--all-agents`, la sortie inclut un résumé par magasin.

Lorsqu’un Gateway est joignable, le nettoyage hors exécution à blanc des magasins d’agents configurés est envoyé via le Gateway afin de partager le même rédacteur de magasin de sessions que le trafic d’exécution. Utilisez `--store <path>` pour la réparation hors ligne explicite d’un fichier de magasin.

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

- Configuration des sessions : [référence de configuration](/fr/gateway/config-agents#session)

## Connexe

- [référence CLI](/fr/cli)
- [gestion des sessions](/fr/concepts/session)
