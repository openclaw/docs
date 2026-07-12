---
read_when:
    - Vous souhaitez une étape LLM produisant uniquement du JSON dans les workflows
    - Vous avez besoin d’une sortie de LLM validée par un schéma pour l’automatisation
summary: Tâches LLM avec sortie JSON uniquement pour les workflows (outil de Plugin facultatif)
title: Tâche du LLM
x-i18n:
    generated_at: "2026-07-12T15:54:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 78ea533f43546fbdd66c7f7138b8dea0b12b02d38925689324b390a12d0c4c5a
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` est un **outil de Plugin facultatif** fourni qui exécute un unique
appel LLM produisant uniquement du JSON et renvoie une sortie structurée,
éventuellement validée par rapport à un schéma JSON. Il fournit aux moteurs de
workflow tels que Lobster une étape LLM sans nécessiter de code OpenClaw
personnalisé pour chaque workflow.

## Activation

1. Activez le Plugin :

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. Autorisez l’outil :

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

`alsoAllow` ajoute `llm-task` au profil d’outils actif sans restreindre les
autres outils principaux. Utilisez plutôt `tools.allow` uniquement si vous
souhaitez un mode restrictif fondé sur une liste d’autorisation.

## Configuration (facultative)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai",
          "defaultModel": "gpt-5.6-sol",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.6-sol"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` est une liste d’autorisation de chaînes `provider/model` ; toute
requête visant un autre modèle est rejetée. Toutes les autres clés servent de
valeurs de repli par appel lorsque l’appel d’outil omet le paramètre
correspondant.

## Paramètres de l’outil

| Paramètre       | Type   | Remarques                                                                                                                                                           |
| --------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prompt`        | string | Obligatoire. Instruction de tâche destinée au LLM.                                                                                                                  |
| `input`         | any    | Charge utile facultative ; sérialisée en JSON et ajoutée à l’invite.                                                                                                |
| `schema`        | object | Schéma JSON facultatif que la sortie analysée doit respecter.                                                                                                       |
| `provider`      | string | Remplace `defaultProvider` / le fournisseur par défaut de l’agent.                                                                                                  |
| `model`         | string | Remplace `defaultModel` ; accepte les identifiants de modèle seuls, les alias ou une référence `provider/model` (un préfixe de fournisseur dupliqué est automatiquement supprimé). |
| `thinking`      | string | Niveau de raisonnement (par ex. `low`, `medium`) ; doit être pris en charge par le modèle résolu.                                                                    |
| `authProfileId` | string | Remplace `defaultAuthProfileId`.                                                                                                                                    |
| `temperature`   | number | Appliqué au mieux ; tous les fournisseurs ne le prennent pas en charge.                                                                                             |
| `maxTokens`     | number | Limite appliquée au mieux au nombre de jetons de sortie.                                                                                                            |
| `timeoutMs`     | number | Délai d’expiration de l’exécution ; valeur par défaut : `30000`.                                                                                                    |

## Sortie

Renvoie `details.json` (le JSON analysé et validé par rapport au schéma), ainsi
que `details.provider` et `details.model`, qui indiquent respectivement le
fournisseur et le modèle réellement utilisés.

## Exemple : étape de workflow Lobster

### Limitation importante

L’exemple ci-dessous suppose que la **CLI Lobster autonome** s’exécute dans un
environnement où `openclaw.invoke` dispose déjà de l’URL du Gateway et du
contexte d’authentification appropriés.

Pour l’exécuteur Lobster **intégré** fourni dans OpenClaw, ce modèle d’appel de
CLI imbriqué n’est **actuellement pas fiable** :

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Tant que Lobster intégré ne dispose pas d’une passerelle prise en charge pour ce
flux, privilégiez l’une des options suivantes :

- des appels directs à l’outil `llm-task` en dehors de Lobster ; ou
- des étapes Lobster qui ne reposent pas sur des appels imbriqués à
  `openclaw.invoke`.

Exemple avec la CLI Lobster autonome :

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "À partir de l’e-mail fourni en entrée, renvoyez l’intention et une proposition de réponse.",
  "thinking": "low",
  "input": {
    "subject": "Bonjour",
    "body": "Pouvez-vous m’aider ?"
  },
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

## Remarques de sécurité

- **JSON uniquement** : le modèle reçoit l’instruction de renvoyer uniquement
  une valeur JSON, sans blocs de code ni commentaires.
- **Aucun outil** : les outils sont désactivés pour l’exécution sous-jacente, le
  modèle ne peut donc pas effectuer d’appels externes pendant la tâche.
- Considérez la sortie comme non fiable sauf si vous la validez avec `schema`.
- Placez les approbations avant toute étape produisant des effets de bord
  (envoi, publication, exécution) qui consomme cette sortie.

## Pages connexes

- [Niveaux de raisonnement](/fr/tools/thinking)
- [Sous-agents](/fr/tools/subagents)
- [Commandes à barre oblique](/fr/tools/slash-commands)
