---
read_when:
    - Vous souhaitez des workflows déterministes en plusieurs étapes avec des approbations explicites
    - Vous devez reprendre un workflow sans réexécuter les étapes précédentes
summary: Environnement d’exécution de workflows typés pour OpenClaw avec des points de validation reprenables.
title: Lobster
x-i18n:
    generated_at: "2026-07-12T16:03:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: eedb6577133588b726992a882a92d94f1f414e55998d0fc80644dd3a64ffc1ab
    source_path: tools/lobster.md
    workflow: 16
---

Lobster exécute des pipelines d’outils en plusieurs étapes sous la forme d’un appel d’outil déterministe unique, avec
des points de contrôle d’approbation explicites et des jetons de reprise. Il se situe une couche au-dessus
des tâches détachées en arrière-plan : pour orchestrer des flux couvrant de nombreuses tâches détachées,
consultez [Task Flow](/fr/automation/taskflow) (`openclaw tasks flow`) ; pour le registre
d’activité des tâches, consultez [Tâches en arrière-plan](/fr/automation/tasks).

## Pourquoi

Sans Lobster, une tâche en plusieurs étapes implique de nombreux appels d’outils aller-retour, le
modèle orchestrant chaque étape. Lobster transfère cette orchestration vers un environnement d’exécution
typé :

- **Un appel au lieu de plusieurs** : un seul appel à l’outil Lobster renvoie un résultat
  structuré pour l’ensemble du pipeline.
- **Approbations intégrées** : les effets de bord (envoyer, publier, supprimer) interrompent le workflow
  jusqu’à leur approbation explicite.
- **Reprise possible** : un workflow interrompu renvoie un jeton ; approuvez puis reprenez sans
  réexécuter les étapes précédentes.

Lobster est un petit DSL contraint plutôt qu’un langage de script généraliste :
l’approbation et la reprise constituent une primitive durable et intégrée ; les pipelines sont des données (faciles à
journaliser, comparer, rejouer et examiner) ; la grammaire réduite limite les chemins de code « créatifs » afin que
la validation reste réaliste ; les délais d’expiration, limites de sortie, vérifications de bac à sable et
listes d’autorisation sont appliqués par l’environnement d’exécution, et non par chaque script. Chaque étape peut néanmoins
appeler n’importe quelle CLI ou n’importe quel script ; générez des fichiers `.lobster` depuis d’autres outils si vous
souhaitez un langage de création plus riche.

Sans Lobster, un tri récurrent des e-mails ressemble à ceci :

```text
Utilisateur : « Vérifiez mes e-mails et rédigez des réponses »
→ openclaw appelle gmail.list
→ Le LLM résume
→ Utilisateur : « rédigez des réponses aux e-mails n° 2 et n° 5 »
→ Le LLM rédige
→ Utilisateur : « envoyez le n° 2 »
→ openclaw appelle gmail.send
(à répéter chaque jour, sans mémoire des éléments déjà triés)
```

Avec Lobster, la même tâche tient dans un seul appel, qui s’interrompt pour approbation puis reprend :

```json
{ "action": "run", "pipeline": "email.triage --limit 20", "timeoutMs": 30000 }
```

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 nécessitent une réponse, 2 nécessitent une action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Envoyer 2 brouillons de réponse ?",
    "items": [],
    "resumeToken": "..."
  }
}
```

## Fonctionnement

OpenClaw exécute les workflows Lobster **dans le processus** en utilisant le paquet
`@clawdbot/lobster` fourni comme exécuteur intégré. Aucun sous-processus `lobster`
externe n’est lancé ; l’appel d’outil renvoie directement une enveloppe JSON. Si le
pipeline s’interrompt pour approbation, l’enveloppe contient un jeton de reprise (ou un identifiant
d’approbation court) afin que vous puissiez continuer ultérieurement.

## Activation

Lobster est un outil de plugin **facultatif**, désactivé par défaut. Il est fourni
avec OpenClaw ; aucune installation distincte n’est donc nécessaire : autorisez simplement l’outil :

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

<Note>
`alsoAllow` ajoute `lobster` au profil d’outils actif sans
restreindre les autres outils principaux. Utilisez `tools.allow` uniquement si vous souhaitez plutôt
un mode de liste d’autorisation restrictif.
</Note>

L’outil est entièrement désactivé dans les contextes d’outils en bac à sable.

Si vous avez besoin de la CLI Lobster autonome pour le développement ou des pipelines externes
(en dehors de l’exécuteur Gateway intégré), installez-la depuis le
[dépôt Lobster](https://github.com/openclaw/lobster) et ajoutez `lobster` au
`PATH`.

## Modèle : petite CLI, tubes JSON et approbations

Créez de petites commandes qui communiquent en JSON, puis enchaînez-les dans un seul appel Lobster.
(Les noms de commandes ci-dessous sont des exemples ; remplacez-les par les vôtres.)

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Appliquer les modifications ?'",
  "timeoutMs": 30000
}
```

Si le pipeline demande une approbation, reprenez-le avec le jeton :

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Exemple : convertir les éléments d’entrée en appels d’outils :

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Étapes LLM exclusivement en JSON (llm-task)

Pour une **étape LLM structurée** dans un workflow, activez l’outil de plugin facultatif
`llm-task` et appelez-le depuis Lobster :

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

### Limitation importante : Lobster intégré et `openclaw.invoke`

Le plugin Lobster fourni exécute les workflows **dans le processus**, au sein du Gateway.
Dans ce mode intégré, `openclaw.invoke` n’hérite **pas** automatiquement d’une
URL de Gateway ni d’un contexte d’authentification pour les appels d’outils imbriqués de la CLI OpenClaw.

Cela signifie que ce modèle n’est **pas fiable actuellement dans l’exécuteur intégré** :

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Utilisez l’exemple ci-dessous uniquement lors de l’exécution de la **CLI Lobster autonome** dans un
environnement où `openclaw.invoke` est déjà configuré avec le contexte
de Gateway et d’authentification approprié.

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "À partir de l’e-mail fourni, renvoyez l’intention et un brouillon.",
  "thinking": "low",
  "input": { "subject": "Bonjour", "body": "Pouvez-vous m’aider ?" },
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

Si vous utilisez actuellement le plugin Lobster intégré, privilégiez soit :

- un appel direct à l’outil `llm-task` en dehors de Lobster, soit
- des étapes n’utilisant pas `openclaw.invoke` dans le pipeline Lobster jusqu’à l’ajout
  d’un pont intégré pris en charge.

Consultez [Tâche LLM](/fr/tools/llm-task) pour connaître les détails et les options de configuration.

## Fichiers de workflow (.lobster)

Lobster peut exécuter des fichiers de workflow YAML/JSON comportant les champs `name`, `args`, `steps`, `env`,
`condition` et `approval`. Définissez `pipeline` sur le chemin du fichier dans l’appel
d’outil.

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

## Paramètres de l’outil

### `run`

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

| Champ            | Valeur par défaut | Remarques                                                                                                                    |
| ---------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `pipeline`       | requis            | Chaîne de pipeline en ligne, ou chemin se terminant par `.lobster`/`.yaml`/`.yml`/`.json` pour un fichier de workflow.        |
| `cwd`            | cwd du Gateway    | Répertoire de travail relatif ; il doit être résolu dans le répertoire de travail du Gateway (les chemins absolus sont refusés). |
| `timeoutMs`      | `20000`           | Interrompt l’exécution si cette durée est dépassée.                                                                          |
| `maxStdoutBytes` | `512000`          | Interrompt l’exécution si la sortie standard ou la sortie d’erreur capturée dépasse cette taille.                            |
| `argsJson`       | -                 | Chaîne JSON d’arguments pour un fichier de workflow (ignorée pour les pipelines en ligne).                                   |

### `resume`

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

`resume` accepte soit `token` (le jeton de reprise complet provenant de `requiresApproval`),
soit `approvalId` (l’identifiant court du même objet) ; utilisez la valeur renvoyée par l’exécution
interrompue. `approve` est requis.

### Mode Task Flow géré

Le passage de `flowControllerId` et `flowGoal` à `run` (ou de `flowId` et
`flowExpectedRevision` à `resume`) fait transiter l’appel par l’API
[Task Flow](/fr/automation/taskflow) gérée de l’environnement d’exécution du plugin, au lieu de renvoyer
une enveloppe brute : OpenClaw crée ou reprend un enregistrement de flux durable, lui applique
l’enveloppe Lobster (`waiting` lors d’une approbation, `succeeded`/`failed` à
la fin) et renvoie `{ ok, envelope, flow, mutation }`. Ce mode nécessite
un environnement d’exécution Task Flow lié et est destiné au code de plugin ou de contrôleur nécessitant
un état de flux durable malgré les redémarrages du Gateway, et non à l’utilisation ponctuelle habituelle
par les agents.

## Enveloppe de sortie

Lobster renvoie une enveloppe JSON avec l’un des trois états suivants :

- `ok` - exécution terminée avec succès
- `needs_approval` - en pause ; `requiresApproval` contient un `resumeToken` et un
  `approvalId` court, chacun pouvant reprendre l’exécution
- `cancelled` - explicitement refusée ou annulée

L’outil expose l’enveloppe à la fois dans `content` (JSON mis en forme) et dans `details`
(objet brut).

## Approbations

Si `requiresApproval` est présent, examinez l’invite et décidez :

- `approve: true` - reprendre et poursuivre les effets de bord
- `approve: false` - annuler et finaliser le workflow

Utilisez `approve --preview-from-stdin --limit N` pour joindre un aperçu JSON aux
demandes d’approbation sans assemblage personnalisé avec jq ou heredoc. L’état de reprise est stocké sous forme de
petits fichiers JSON dans le répertoire d’état de Lobster (`~/.lobster/state` par
défaut, modifiable avec `LOBSTER_STATE_DIR`) ; le jeton lui-même encode uniquement un
pointeur vers cet état, et non l’état complet du pipeline.

## OpenProse

OpenProse s’associe bien à Lobster : utilisez `/prose` pour orchestrer la préparation
multi-agent, puis exécutez un pipeline Lobster pour des approbations déterministes. Si un programme
Prose nécessite Lobster, autorisez l’outil `lobster` pour les sous-agents via
`tools.subagents.tools`. Consultez [OpenProse](/fr/prose).

## Sécurité

- **Uniquement local et dans le processus** - les workflows s’exécutent dans le processus du Gateway ; aucun
  appel réseau n’est effectué par le plugin lui-même.
- **Aucun secret** - Lobster ne gère pas OAuth ; il appelle les outils OpenClaw qui
  s’en chargent.
- **Prise en compte du bac à sable** - désactivé lorsque le contexte d’outil est en bac à sable.
- **Renforcé** - les délais d’expiration et limites de sortie sont appliqués par l’exécuteur intégré.

## Dépannage

| Erreur                                                        | Cause / solution                                                                                 |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `lobster runtime timed out`                                   | Le pipeline a dépassé `timeoutMs`. Augmentez sa valeur ou divisez le pipeline.                   |
| `lobster stdout exceeded maxStdoutBytes` (ou `stderr`)        | La sortie capturée a dépassé la limite. Augmentez `maxStdoutBytes` ou réduisez la sortie.         |
| `run --args-json must be valid JSON`                          | L’analyse de `argsJson` (pour l’exécution d’un fichier de workflow) a échoué. Corrigez la chaîne JSON. |
| `lobster runtime failed` (ou un autre message `runtime_error`) | L’environnement d’exécution intégré a renvoyé une enveloppe d’erreur. Consultez les journaux du Gateway pour plus de détails. |

## En savoir plus

- [Plugins](/fr/tools/plugin)
- [Création d’outils de plugin](/fr/plugins/building-plugins#registering-agent-tools)

## Étude de cas : workflows de la communauté

Un exemple public : une CLI de « second cerveau » et des pipelines Lobster qui gèrent trois
coffres Markdown (personnel, partenaire, partagé). La CLI produit du JSON pour les statistiques,
les listes des boîtes de réception et les analyses des éléments obsolètes ; Lobster enchaîne ces commandes dans des workflows
tels que `weekly-review`, `inbox-triage`, `memory-consolidation` et
`shared-task-sync`, chacun avec des points de validation. L’IA prend en charge les décisions
(catégorisation) lorsqu’elle est disponible et se rabat sur des règles déterministes lorsqu’elle
ne l’est pas.

- Fil : [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Dépôt : [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Contenu associé

- [Automatisation](/fr/automation) - tous les mécanismes d’automatisation
- [Vue d’ensemble des outils](/fr/tools) - tous les outils d’agent disponibles
