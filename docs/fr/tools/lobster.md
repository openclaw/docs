---
read_when:
    - Vous voulez des flux de travail déterministes en plusieurs étapes avec des approbations explicites
    - Vous devez reprendre un flux de travail sans réexécuter les étapes précédentes
summary: Environnement d’exécution de workflows typés pour OpenClaw avec des points d’approbation reprenables.
title: Homard
x-i18n:
    generated_at: "2026-05-06T07:41:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6da8c7ca213dd4e9f85bcedabdb74da172bd3d82eceaf2c001f1a2692b01ca8
    source_path: tools/lobster.md
    workflow: 16
---

Lobster est un shell de workflows qui permet à OpenClaw d’exécuter des séquences d’outils en plusieurs étapes comme une seule opération déterministe, avec des points de contrôle d’approbation explicites.

Lobster est une couche d’édition au-dessus du travail en arrière-plan détaché. Pour l’orchestration de flux au-dessus des tâches individuelles, consultez [Flux de tâches](/fr/automation/taskflow) (`openclaw tasks flow`). Pour le journal d’activité des tâches, consultez [`openclaw tasks`](/fr/automation/tasks).

## Hook

Votre assistant peut construire les outils qui le gèrent lui-même. Demandez un workflow, et 30 minutes plus tard vous disposez d’une CLI et de pipelines qui s’exécutent en un seul appel. Lobster est la pièce manquante : des pipelines déterministes, des approbations explicites et un état reprenable.

## Pourquoi

Aujourd’hui, les workflows complexes nécessitent de nombreux appels d’outils aller-retour. Chaque appel coûte des tokens, et le LLM doit orchestrer chaque étape. Lobster déplace cette orchestration dans un runtime typé :

- **Un seul appel au lieu de plusieurs** : OpenClaw exécute un seul appel d’outil Lobster et obtient un résultat structuré.
- **Approbations intégrées** : Les effets de bord (envoyer un e-mail, publier un commentaire) suspendent le workflow jusqu’à approbation explicite.
- **Reprenable** : Les workflows suspendus renvoient un token ; approuvez et reprenez sans tout réexécuter.

## Pourquoi un DSL plutôt que des programmes simples ?

Lobster est volontairement petit. L’objectif n’est pas « un nouveau langage », mais une spécification de pipeline prévisible et adaptée à l’IA, avec des approbations et des tokens de reprise de premier ordre.

- **Approuver/reprendre est intégré** : Un programme normal peut demander une intervention humaine, mais il ne peut pas _mettre en pause et reprendre_ avec un token durable sans que vous inventiez vous-même ce runtime.
- **Déterminisme + auditabilité** : Les pipelines sont des données, ils sont donc faciles à journaliser, comparer, rejouer et examiner.
- **Surface contrainte pour l’IA** : Une minuscule grammaire + du chaînage JSON réduisent les chemins de code « créatifs » et rendent la validation réaliste.
- **Politique de sécurité intégrée** : Les délais d’expiration, limites de sortie, contrôles de sandbox et listes d’autorisation sont appliqués par le runtime, pas par chaque script.
- **Toujours programmable** : Chaque étape peut appeler n’importe quelle CLI ou script. Si vous voulez du JS/TS, générez des fichiers `.lobster` depuis le code.

## Fonctionnement

OpenClaw exécute les workflows Lobster **dans le processus** avec un exécuteur intégré. Aucun sous-processus CLI externe n’est lancé ; le moteur de workflow s’exécute dans le processus Gateway et renvoie directement une enveloppe JSON.
Si le pipeline se met en pause pour approbation, l’outil renvoie un `resumeToken` afin que vous puissiez continuer plus tard.

## Modèle : petite CLI + tubes JSON + approbations

Créez de petites commandes qui parlent JSON, puis chaînez-les en un seul appel Lobster. (Les noms de commandes ci-dessous sont des exemples - remplacez-les par les vôtres.)

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

L’IA déclenche le workflow ; Lobster exécute les étapes. Les portes d’approbation gardent les effets de bord explicites et auditables.

Exemple : mapper des éléments d’entrée vers des appels d’outils :

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Étapes LLM JSON uniquement (llm-task)

Pour les workflows qui nécessitent une **étape LLM structurée**, activez l’outil de plugin optionnel
`llm-task` et appelez-le depuis Lobster. Cela garde le workflow
déterministe tout en vous permettant de classifier/résumer/rédiger avec un modèle.

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

Utilisez-le dans un pipeline :

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

Consultez [Tâche LLM](/fr/tools/llm-task) pour les détails et les options de configuration.

## Fichiers de workflow (.lobster)

Lobster peut exécuter des fichiers de workflow YAML/JSON avec des champs `name`, `args`, `steps`, `env`, `condition` et `approval`. Dans les appels d’outils OpenClaw, définissez `pipeline` sur le chemin du fichier.

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

Notes :

- `stdin: $step.stdout` et `stdin: $step.json` transmettent la sortie d’une étape précédente.
- `condition` (ou `when`) peut conditionner des étapes sur `$step.approved`.

## Installer Lobster

Les workflows Lobster intégrés s’exécutent dans le processus ; aucun binaire `lobster` séparé n’est requis. L’exécuteur intégré est fourni avec le plugin Lobster.

Si vous avez besoin de la CLI Lobster autonome pour le développement ou des pipelines externes, installez-la depuis le [dépôt Lobster](https://github.com/openclaw/lobster) et assurez-vous que `lobster` est dans `PATH`.

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

Évitez d’utiliser `tools.allow: ["lobster"]`, sauf si vous avez l’intention d’exécuter en mode liste d’autorisation restrictive.

<Note>
Les listes d’autorisation sont opt-in pour les plugins optionnels. `alsoAllow` active uniquement les outils de plugin optionnels nommés tout en conservant l’ensemble normal d’outils principaux. Pour restreindre les outils principaux, utilisez `tools.allow` avec les outils ou groupes principaux souhaités.
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

Un seul workflow. Déterministe. Sûr.

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

Exécuter un fichier de workflow avec des arguments :

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Continuer un workflow suspendu après approbation.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Entrées optionnelles

- `cwd` : Répertoire de travail relatif pour le pipeline (doit rester dans le répertoire de travail du gateway).
- `timeoutMs` : Interrompre le workflow s’il dépasse cette durée (par défaut : 20000).
- `maxStdoutBytes` : Interrompre le workflow si la sortie dépasse cette taille (par défaut : 512000).
- `argsJson` : Chaîne JSON transmise à `lobster run --args-json` (fichiers de workflow uniquement).

## Enveloppe de sortie

Lobster renvoie une enveloppe JSON avec l’un de trois statuts :

- `ok` → terminé avec succès
- `needs_approval` → en pause ; `requiresApproval.resumeToken` est requis pour reprendre
- `cancelled` → explicitement refusé ou annulé

L’outil expose l’enveloppe à la fois dans `content` (JSON formaté) et dans `details` (objet brut).

## Approbations

Si `requiresApproval` est présent, inspectez l’invite et décidez :

- `approve: true` → reprendre et continuer les effets de bord
- `approve: false` → annuler et finaliser le workflow

Utilisez `approve --preview-from-stdin --limit N` pour joindre un aperçu JSON aux demandes d’approbation sans colle jq/heredoc personnalisée. Les tokens de reprise sont désormais compacts : Lobster stocke l’état de reprise du workflow dans son répertoire d’état et renvoie une petite clé de token.

## OpenProse

OpenProse fonctionne bien avec Lobster : utilisez `/prose` pour orchestrer la préparation multi-agent, puis exécutez un pipeline Lobster pour des approbations déterministes. Si un programme Prose a besoin de Lobster, autorisez l’outil `lobster` pour les sous-agents via `tools.subagents.tools`. Consultez [OpenProse](/fr/prose).

## Sécurité

- **Local et dans le processus uniquement** - les workflows s’exécutent dans le processus Gateway ; aucun appel réseau n’est effectué par le plugin lui-même.
- **Aucun secret** - Lobster ne gère pas OAuth ; il appelle les outils OpenClaw qui le font.
- **Compatible avec le sandbox** - désactivé lorsque le contexte de l’outil est sandboxé.
- **Renforcé** - délais d’expiration et limites de sortie appliqués par l’exécuteur intégré.

## Dépannage

- **`lobster timed out`** → augmentez `timeoutMs`, ou scindez un long pipeline.
- **`lobster output exceeded maxStdoutBytes`** → augmentez `maxStdoutBytes` ou réduisez la taille de la sortie.
- **`lobster returned invalid JSON`** → assurez-vous que le pipeline s’exécute en mode outil et n’affiche que du JSON.
- **`lobster failed`** → consultez les journaux du gateway pour les détails d’erreur de l’exécuteur intégré.

## En savoir plus

- [Plugins](/fr/tools/plugin)
- [Création d’outils de plugin](/fr/plugins/building-plugins#registering-agent-tools)

## Étude de cas : workflows communautaires

Un exemple public : une CLI de « second cerveau » + des pipelines Lobster qui gèrent trois coffres Markdown (personnel, partenaire, partagé). La CLI émet du JSON pour les statistiques, les listes de boîte de réception et les analyses d’éléments obsolètes ; Lobster enchaîne ces commandes dans des workflows comme `weekly-review`, `inbox-triage`, `memory-consolidation` et `shared-task-sync`, chacun avec des portes d’approbation. L’IA gère le jugement (catégorisation) lorsqu’elle est disponible et se rabat sur des règles déterministes dans le cas contraire.

- Fil : [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Dépôt : [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Connexe

- [Automatisation et tâches](/fr/automation) - planification des workflows Lobster
- [Vue d’ensemble de l’automatisation](/fr/automation) - tous les mécanismes d’automatisation
- [Vue d’ensemble des outils](/fr/tools) - tous les outils d’agent disponibles
