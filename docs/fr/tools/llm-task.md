---
read_when:
    - Vous voulez une étape LLM uniquement en JSON dans les workflows
    - Vous avez besoin d’une sortie de LLM validée par schéma pour l’automatisation
summary: Tâches LLM en JSON uniquement pour les workflows (outil de Plugin facultatif)
title: Tâche LLM
x-i18n:
    generated_at: "2026-06-27T18:19:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab83202bd0954a948c933c80de17385eb385573b8e3974dba41ff876f91c3ddb
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` est un **outil de Plugin facultatif** qui exécute une tâche LLM uniquement en JSON et
renvoie une sortie structurée (éventuellement validée avec JSON Schema).

C’est idéal pour les moteurs de workflow comme Lobster : vous pouvez ajouter une seule étape LLM
sans écrire de code OpenClaw personnalisé pour chaque workflow.

## Activer le Plugin

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

2. Autorisez l’outil facultatif :

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

Utilisez `tools.allow` uniquement lorsque vous souhaitez un mode de liste d’autorisation restrictive.

## Configuration (facultatif)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai",
          "defaultModel": "gpt-5.5",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.5"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` est une liste d’autorisation de chaînes `provider/model`. Si elle est définie, toute requête
hors de la liste est rejetée.

## Paramètres de l’outil

- `prompt` (chaîne, obligatoire)
- `input` (n’importe quel type, facultatif)
- `schema` (objet, JSON Schema facultatif)
- `provider` (chaîne, facultatif)
- `model` (chaîne, facultatif)
- `thinking` (chaîne, facultatif)
- `authProfileId` (chaîne, facultatif)
- `temperature` (nombre, facultatif)
- `maxTokens` (nombre, facultatif)
- `timeoutMs` (nombre, facultatif)

`thinking` accepte les préréglages de raisonnement OpenClaw standard, comme `low` ou `medium`.

## Sortie

Renvoie `details.json` contenant le JSON analysé (et le valide avec
`schema` lorsqu’il est fourni).

## Exemple : étape de workflow Lobster

### Limitation importante

L’exemple ci-dessous suppose que la **CLI Lobster autonome** s’exécute dans un environnement où `openclaw.invoke` dispose déjà de l’URL Gateway et du contexte d’authentification corrects.

Pour l’exécuteur Lobster **intégré** fourni avec OpenClaw, ce modèle de CLI imbriquée n’est **pas fiable actuellement** :

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Tant que Lobster intégré ne dispose pas d’un pont pris en charge pour ce flux, préférez soit :

- des appels directs à l’outil `llm-task` en dehors de Lobster, soit
- des étapes Lobster qui ne reposent pas sur des appels `openclaw.invoke` imbriqués.

Exemple de CLI Lobster autonome :

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": {
    "subject": "Hello",
    "body": "Can you help?"
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

## Notes de sécurité

- L’outil est **uniquement en JSON** et demande au modèle de produire uniquement du JSON (sans
  blocs de code, sans commentaire).
- Aucun outil n’est exposé au modèle pour cette exécution.
- Traitez la sortie comme non fiable sauf si vous la validez avec `schema`.
- Placez les approbations avant toute étape ayant des effets de bord (send, post, exec).

## Connexe

- [Niveaux de réflexion](/fr/tools/thinking)
- [Sous-agents](/fr/tools/subagents)
- [Commandes slash](/fr/tools/slash-commands)
