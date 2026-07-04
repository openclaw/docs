---
read_when:
    - Vous voulez lister les sessions enregistrées et voir l’activité récente
summary: Référence CLI pour `openclaw sessions` (liste des sessions stockées + utilisation)
title: Sessions
x-i18n:
    generated_at: "2026-07-04T20:29:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c24ee8a632998624ee41945b26ace3bfe37cadf9447f7632c373784a9301bde
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Liste les sessions de conversation stockées.

Les listes de sessions ne sont pas des contrôles de disponibilité des canaux/fournisseurs. Elles affichent les lignes de conversation persistées depuis les magasins de sessions. Un Discord, Slack, Telegram ou autre canal silencieux peut se reconnecter correctement sans créer de nouvelle ligne de session tant qu’un message n’a pas été traité. Utilisez `openclaw channels status --probe`, `openclaw status --deep` ou `openclaw health --verbose` lorsque vous devez vérifier la connectivité en direct des canaux.

Les réponses `openclaw sessions` et Gateway `sessions.list` sont limitées par défaut afin que les grands magasins à longue durée de vie ne puissent pas monopoliser le processus CLI ou la boucle d’événements du Gateway. La CLI renvoie par défaut les 100 sessions les plus récentes ; passez `--limit <n>` pour une fenêtre plus petite/grande ou `--limit all` lorsque vous avez intentionnellement besoin du magasin complet. Les réponses JSON incluent `totalCount`, `limitApplied` et `hasMore` lorsque les appelants doivent indiquer qu’il existe davantage de lignes.

Les clients RPC peuvent passer `configuredAgentsOnly: true` pour conserver la vaste source de découverte combinée tout en ne renvoyant que les lignes des agents actuellement présents dans la configuration. Control UI utilise ce mode par défaut afin que les magasins d’agents supprimés ou uniquement sur disque ne réapparaissent pas dans la vue Sessions.

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
- `--store <path>` : chemin de magasin explicite (ne peut pas être combiné avec `--agent` ou `--all-agents`)
- `--limit <n|all>` : nombre maximal de lignes à afficher (par défaut `100` ; `all` rétablit la sortie complète)

Suivre la progression de trajectoire lisible par l’humain pour les sessions stockées :

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` affiche les événements JSONL récents de trajectoire sous forme de lignes de progression compactes. Sans `--session-key`, il suit d’abord les sessions en cours d’exécution, puis la dernière session stockée. `--tail <count>` contrôle le nombre d’événements existants à afficher avant le mode de suivi ; la valeur par défaut est `80`, et `0` démarre à la fin actuelle. `--follow` continue de surveiller les fichiers de trajectoire sélectionnés, y compris les fichiers déplacés référencés par `<session>.trajectory-path.json`.

La vue de progression est volontairement conservatrice : le texte des invites, les arguments d’outils et les corps de résultats d’outils ne sont pas affichés. Les appels d’outils affichent le nom de l’outil avec `{...redacted...}` ; les résultats d’outils affichent un état comme `ok`, `error` ou `done` ; les lignes d’achèvement de modèle affichent le fournisseur/modèle et l’état terminal.

Exporter un bundle de trajectoire pour une session stockée :

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

C’est le chemin de commande utilisé par la commande slash `/export-trajectory` après que le propriétaire a approuvé la demande d’exécution. Le répertoire de sortie est toujours résolu à l’intérieur de `.openclaw/trajectory-exports/` sous l’espace de travail sélectionné.

`openclaw sessions --all-agents` lit les magasins d’agents configurés. La découverte de sessions Gateway et ACP est plus large : elle inclut aussi les magasins uniquement sur disque trouvés sous la racine `agents/` par défaut ou une racine `session.store` modélisée. Ces magasins découverts doivent se résoudre en fichiers `sessions.json` réguliers à l’intérieur de la racine de l’agent ; les liens symboliques et les chemins hors racine sont ignorés.

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
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` utilise les paramètres `session.maintenance` de la configuration :

- Note de portée : `openclaw sessions cleanup` maintient les magasins de sessions, les transcriptions et les fichiers sidecar de trajectoire. Il n’élague pas l’historique des exécutions Cron, qui est géré par `cron.runLog.keepLines` dans la [configuration Cron](/fr/automation/cron-jobs#configuration) et expliqué dans la [maintenance Cron](/fr/automation/cron-jobs#maintenance).
- Le nettoyage élague aussi les transcriptions principales non référencées, les points de contrôle de compaction et les fichiers sidecar de trajectoire plus anciens que `session.maintenance.pruneAfter` ; les fichiers encore référencés par `sessions.json` sont préservés.
- Le nettoyage signale séparément le nettoyage des sondes d’exécution de modèle Gateway de courte durée sous `modelRunPruned`. Cela ne correspond qu’aux clés explicites strictes de forme `agent:*:explicit:model-run-<uuid>`. La rétention fixe est `24h`, mais elle est conditionnée par la pression : elle ne supprime les lignes de sonde obsolètes que lorsque la maintenance des entrées de session ou la pression du plafond est atteinte. Lorsqu’il s’exécute, le nettoyage des exécutions de modèle a lieu avant le nettoyage global des éléments obsolètes et le plafonnement.

- `--dry-run` : prévisualiser le nombre d’entrées qui seraient élaguées/plafonnées sans écrire.
  - En mode texte, dry-run affiche une table d’actions par session (`Action`, `Key`, `Age`, `Model`, `Flags`) ainsi qu’un résumé groupé par libellé de session afin que vous puissiez voir ce qui serait conservé ou supprimé.
- `--enforce` : appliquer la maintenance même lorsque `session.maintenance.mode` est `warn`.
- `--fix-missing` : supprimer les entrées dont les fichiers de transcription sont manquants ou uniquement avec en-tête/vides, même si elles ne seraient normalement pas encore exclues par l’âge/le nombre.
- `--fix-dm-scope` : lorsque `session.dmScope` vaut `main`, retirer les lignes DM directes obsolètes indexées par pair laissées par un routage antérieur `per-peer`, `per-channel-peer` ou `per-account-channel-peer`. Utilisez d’abord `--dry-run` ; appliquer le nettoyage supprime ces lignes de `sessions.json` et conserve leurs transcriptions comme archives supprimées.
- `--active-key <key>` : protéger une clé active spécifique contre l’éviction par budget disque. Les pointeurs de conversation externes durables, comme les sessions de groupe et les sessions de discussion limitées à un fil, sont également conservés par la maintenance âge/nombre/budget disque.
- `--agent <id>` : exécuter le nettoyage pour un magasin d’agent configuré.
- `--all-agents` : exécuter le nettoyage pour tous les magasins d’agents configurés.
- `--store <path>` : exécuter contre un fichier `sessions.json` spécifique.
- `--json` : afficher un résumé JSON. Avec `--all-agents`, la sortie inclut un résumé par magasin.

Lorsqu’un Gateway est joignable, le nettoyage non dry-run pour les magasins d’agents configurés est envoyé via le Gateway afin qu’il partage le même writer de magasin de sessions que le trafic d’exécution. Utilisez `--store <path>` pour la réparation hors ligne explicite d’un fichier de magasin.

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

Récupérer du budget de contexte pour une session bloquée ou surdimensionnée. `openclaw sessions compact <key>` est le wrapper de premier ordre autour du RPC Gateway `sessions.compact` et nécessite un gateway en cours d’exécution.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- Sans `--max-lines`, le LLM du gateway résume la transcription. La CLI n’impose pas d’échéance client par défaut ; le gateway possède le cycle de vie de compaction configuré.
- Avec `--max-lines <n>`, elle tronque aux `n` dernières lignes de transcription et archive la transcription précédente comme fichier sidecar `.bak`.
- `--agent <id>` : agent qui possède la session ; requis pour les clés `global`.
- `--url` / `--token` / `--password` : substitutions de connexion au gateway.
- `--timeout <ms>` : délai RPC facultatif côté client, en millisecondes.
- `--json` : afficher la charge utile RPC brute.

La commande quitte avec un code non nul lorsque le gateway signale une compaction échouée ou est injoignable, afin que les crons et scripts ne confondent jamais une absence d’opération silencieuse avec un succès.

> Remarque : `openclaw agent --message '/compact ...'` n’est **pas** un chemin de compaction. Les commandes slash depuis la CLI sont rejetées par le contrôle de l’expéditeur autorisé ; cette invocation quitte avec un code non nul et une indication pointant ici au lieu de ne rien faire silencieusement.

### RPC sessions.compact

`openclaw gateway call sessions.compact --params '<json>'` accepte :

| Champ      | Type        | Obligatoire | Description                                                |
| ---------- | ----------- | ----------- | ---------------------------------------------------------- |
| `key`      | chaîne      | oui         | Clé de session à compacter (par exemple `agent:main:main`). |
| `agentId`  | chaîne      | non         | ID de l’agent qui possède la session (pour les clés `global`). |
| `maxLines` | entier ≥ 1  | non         | Tronquer aux N dernières lignes au lieu de la synthèse LLM. |

Exemple de réponse de résumé LLM :

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

Exemple de réponse de troncature (`--max-lines 200`) :

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "archived": "/home/user/.openclaw/agents/main/sessions/transcripts/<id>.jsonl.bak",
  "kept": 200
}
```

## Connexe

- Configuration des sessions : [référence de configuration](/fr/gateway/config-agents#session)
- [Référence CLI](/fr/cli)
- [Gestion des sessions](/fr/concepts/session)
