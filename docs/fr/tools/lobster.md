---
read_when:
    - Vous souhaitez des flux de travail déterministes en plusieurs étapes avec des approbations explicites
    - Vous devez reprendre un flux de travail sans réexécuter les étapes précédentes
summary: Environnement d’exécution typé des flux de travail pour OpenClaw avec des points d’approbation reprenables.
title: Homard
x-i18n:
    generated_at: "2026-05-12T01:00:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 404b2e47982f7efb9a8bb015ac5d7bd8a06f0a41d966e620c9826735abf7f0e3
    source_path: tools/lobster.md
    workflow: 16
---

Lobster est un shell de flux de travail qui permet à OpenClaw d’exécuter des séquences d’outils en plusieurs étapes comme une seule opération déterministe, avec des points de contrôle d’approbation explicites.

Lobster est une couche de création au-dessus du travail en arrière-plan détaché. Pour l’orchestration de flux au-dessus des tâches individuelles, consultez [Task Flow](/fr/automation/taskflow) (`openclaw tasks flow`). Pour le registre d’activité des tâches, consultez [`openclaw tasks`](/fr/automation/tasks).

## Crochet

Votre assistant peut construire les outils qui se gèrent eux-mêmes. Demandez un flux de travail, et 30 minutes plus tard vous disposez d’une CLI ainsi que de pipelines qui s’exécutent en un seul appel. Lobster est la pièce manquante : pipelines déterministes, approbations explicites et état reprenable.

## Pourquoi

Aujourd’hui, les flux de travail complexes nécessitent de nombreux allers-retours d’appels d’outils. Chaque appel coûte des tokens, et le LLM doit orchestrer chaque étape. Lobster déplace cette orchestration dans un runtime typé :

- **Un appel au lieu de plusieurs** : OpenClaw exécute un appel d’outil Lobster et obtient un résultat structuré.
- **Approbations intégrées** : les effets de bord (envoyer un e-mail, publier un commentaire) interrompent le flux de travail jusqu’à approbation explicite.
- **Reprenable** : les flux de travail interrompus renvoient un token ; approuvez et reprenez sans tout réexécuter.

## Pourquoi un DSL plutôt que des programmes classiques ?

Lobster est volontairement petit. Le but n’est pas « un nouveau langage », mais une spécification de pipeline prévisible et adaptée à l’IA, avec approbations et tokens de reprise de premier ordre.

- **L’approbation/reprise est intégrée** : un programme normal peut inviter un humain à répondre, mais il ne peut pas _s’interrompre puis reprendre_ avec un token durable sans que vous inventiez vous-même ce runtime.
- **Déterminisme + auditabilité** : les pipelines sont des données, donc ils sont faciles à journaliser, comparer, rejouer et examiner.
- **Surface contrainte pour l’IA** : une grammaire minuscule + du chaînage JSON réduisent les chemins de code « créatifs » et rendent la validation réaliste.
- **Politique de sécurité intégrée** : les délais d’expiration, plafonds de sortie, vérifications de sandbox et listes d’autorisation sont appliqués par le runtime, pas par chaque script.
- **Toujours programmable** : chaque étape peut appeler n’importe quelle CLI ou script. Si vous voulez du JS/TS, générez des fichiers `.lobster` depuis du code.

## Fonctionnement

OpenClaw exécute les flux de travail Lobster **dans le processus** à l’aide d’un runner intégré. Aucun sous-processus CLI externe n’est lancé ; le moteur de flux de travail s’exécute dans le processus du Gateway et renvoie directement une enveloppe JSON.
Si le pipeline se met en pause pour approbation, l’outil renvoie un `resumeToken` afin que vous puissiez continuer plus tard.

## Modèle : petite CLI + tubes JSON + approbations

Construisez de petites commandes qui parlent JSON, puis chaînez-les dans un seul appel Lobster. (Noms de commandes d’exemple ci-dessous - remplacez-les par les vôtres.)

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

Si le pipeline demande une approbation, reprenez avec le token :

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

L’IA déclenche le flux de travail ; Lobster exécute les étapes. Les portes d’approbation gardent les effets de bord explicites et auditables.

Exemple : mapper des éléments d’entrée vers des appels d’outils :

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Étapes LLM uniquement JSON (llm-task)

Pour les flux de travail qui nécessitent une **étape LLM structurée**, activez l’outil de plugin optionnel
`llm-task` et appelez-le depuis Lobster. Cela garde le flux de travail
déterministe tout en vous permettant de classer/résumer/rédiger avec un modèle.

Activez l’outil :

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "alsoAllow": ["llm-task"] }
      }
    ]
  }
}
```

### Limitation importante : Lobster intégré vs `openclaw.invoke`

Le plugin Lobster inclus exécute les flux de travail **dans le processus** au sein du Gateway. Dans ce mode intégré, `openclaw.invoke` n’hérite **pas** automatiquement d’une URL de Gateway ni d’un contexte d’authentification pour les appels imbriqués d’outils CLI OpenClaw.

Cela signifie que ce modèle n’est **pas actuellement fiable dans le runner intégré** :

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Utilisez l’exemple ci-dessous uniquement lors de l’exécution de la **CLI Lobster autonome** dans un environnement où `openclaw.invoke` est déjà configuré avec le bon contexte Gateway/authentification.

Utilisez-le dans un pipeline CLI Lobster autonome :

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": { "subject": "Hello", "body": "Can you help?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

Si vous utilisez aujourd’hui le plugin Lobster intégré, privilégiez soit :

- un appel direct à l’outil `llm-task` hors de Lobster, soit
- des étapes non-`openclaw.invoke` dans le pipeline Lobster jusqu’à l’ajout d’un pont intégré pris en charge.

Consultez [LLM Task](/fr/tools/llm-task) pour les détails et les options de configuration.

## Fichiers de flux de travail (.lobster)

Lobster peut exécuter des fichiers de flux de travail YAML/JSON avec les champs `name`, `args`, `steps`, `env`, `condition` et `approval`. Dans les appels d’outils OpenClaw, définissez `pipeline` sur le chemin du fichier.

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

Remarques :

- `stdin: $step.stdout` et `stdin: $step.json` transmettent la sortie d’une étape précédente.
- `condition` (ou `when`) peut conditionner les étapes à `$step.approved`.

## Installer Lobster

Les flux de travail Lobster inclus s’exécutent dans le processus ; aucun binaire `lobster` séparé n’est requis. Le runner intégré est fourni avec le plugin Lobster.

Si vous avez besoin de la CLI Lobster autonome pour le développement ou des pipelines externes, installez-la depuis le [dépôt Lobster](https://github.com/openclaw/lobster) et assurez-vous que `lobster` se trouve dans `PATH`.

## Activer l’outil

Lobster est un outil de plugin **optionnel** (non activé par défaut).

Recommandé (additif, sûr) :

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

Ou par agent :

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["lobster"]
        }
      }
    ]
  }
}
```

Évitez d’utiliser `tools.allow: ["lobster"]`, sauf si vous comptez fonctionner en mode liste d’autorisation restrictive.

<Note>
Les listes d’autorisation sont opt-in pour les plugins optionnels. `alsoAllow` active uniquement les outils de plugin optionnels nommés tout en préservant l’ensemble normal des outils principaux. Pour restreindre les outils principaux, utilisez `tools.allow` avec les outils ou groupes principaux souhaités.
</Note>

## Exemple : tri des e-mails

Sans Lobster :

```
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

Avec Lobster :

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

Renvoie une enveloppe JSON (tronquée) :

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 need replies, 2 need action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Send 2 draft replies?",
    "items": [],
    "resumeToken": "..."
  }
}
```

L’utilisateur approuve → reprise :

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Un flux de travail. Déterministe. Sûr.

## Paramètres de l’outil

### `run`

Exécuter un pipeline en mode outil.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Exécuter un fichier de flux de travail avec des arguments :

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Continuer un flux de travail interrompu après approbation.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Entrées optionnelles

- `cwd` : répertoire de travail relatif pour le pipeline (doit rester dans le répertoire de travail du Gateway).
- `timeoutMs` : interrompre le flux de travail s’il dépasse cette durée (par défaut : 20000).
- `maxStdoutBytes` : interrompre le flux de travail si la sortie dépasse cette taille (par défaut : 512000).
- `argsJson` : chaîne JSON transmise à `lobster run --args-json` (fichiers de flux de travail uniquement).

## Enveloppe de sortie

Lobster renvoie une enveloppe JSON avec l’un des trois statuts suivants :

- `ok` → terminé avec succès
- `needs_approval` → en pause ; `requiresApproval.resumeToken` est requis pour reprendre
- `cancelled` → explicitement refusé ou annulé

L’outil expose l’enveloppe dans `content` (JSON formaté) et `details` (objet brut).

## Approbations

Si `requiresApproval` est présent, inspectez l’invite et décidez :

- `approve: true` → reprendre et continuer les effets de bord
- `approve: false` → annuler et finaliser le flux de travail

Utilisez `approve --preview-from-stdin --limit N` pour joindre un aperçu JSON aux demandes d’approbation sans colle jq/heredoc personnalisée. Les tokens de reprise sont désormais compacts : Lobster stocke l’état de reprise du flux de travail dans son répertoire d’état et renvoie une petite clé de token.

## OpenProse

OpenProse fonctionne bien avec Lobster : utilisez `/prose` pour orchestrer une préparation multi-agent, puis exécutez un pipeline Lobster pour des approbations déterministes. Si un programme Prose a besoin de Lobster, autorisez l’outil `lobster` pour les sous-agents via `tools.subagents.tools`. Consultez [OpenProse](/fr/prose).

## Sécurité

- **Local dans le processus uniquement** - les flux de travail s’exécutent dans le processus du Gateway ; aucun appel réseau depuis le plugin lui-même.
- **Aucun secret** - Lobster ne gère pas OAuth ; il appelle les outils OpenClaw qui le font.
- **Compatible sandbox** - désactivé lorsque le contexte de l’outil est sandboxé.
- **Renforcé** - délais d’expiration et plafonds de sortie appliqués par le runner intégré.

## Dépannage

- **`lobster timed out`** → augmentez `timeoutMs`, ou scindez un long pipeline.
- **`lobster output exceeded maxStdoutBytes`** → augmentez `maxStdoutBytes` ou réduisez la taille de sortie.
- **`lobster returned invalid JSON`** → assurez-vous que le pipeline s’exécute en mode outil et imprime uniquement du JSON.
- **`lobster failed`** → consultez les journaux du Gateway pour les détails de l’erreur du runner intégré.

## En savoir plus

- [Plugins](/fr/tools/plugin)
- [Création d’outils Plugin](/fr/plugins/building-plugins#registering-agent-tools)

## Étude de cas : flux de travail communautaires

Un exemple public : une CLI « second cerveau » + des pipelines Lobster qui gèrent trois coffres Markdown (personnel, partenaire, partagé). La CLI émet du JSON pour les statistiques, les listes de boîte de réception et les analyses d’éléments obsolètes ; Lobster chaîne ces commandes dans des flux de travail comme `weekly-review`, `inbox-triage`, `memory-consolidation` et `shared-task-sync`, chacun avec des portes d’approbation. L’IA gère le jugement (catégorisation) lorsqu’elle est disponible et se rabat sur des règles déterministes dans le cas contraire.

- Fil : [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Dépôt : [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Connexe

- [Automation](/fr/automation) - planification des flux de travail Lobster
- [Vue d’ensemble de l’automatisation](/fr/automation) - tous les mécanismes d’automatisation
- [Vue d’ensemble des outils](/fr/tools) - tous les outils d’agent disponibles
