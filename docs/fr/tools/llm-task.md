---
read_when:
    - Vous voulez une étape LLM uniquement en JSON dans les flux de travail
    - Vous avez besoin d’une sortie LLM validée par schéma pour l’automatisation
summary: Tâches LLM en JSON uniquement pour les flux de travail (outil de plugin facultatif)
title: Tâche LLM
x-i18n:
    generated_at: "2026-05-04T02:26:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cdc5d4feef17fb6d6d90d819d4c92d26a4ec43e4f5364c6acbaad1934a89269
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` est un **outil de Plugin facultatif** qui exécute une tâche LLM en JSON uniquement et
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

Utilisez `tools.allow` uniquement lorsque vous voulez un mode de liste d’autorisation restrictif.

## Configuration (facultatif)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai-codex",
          "defaultModel": "gpt-5.5",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.4"],
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
- `input` (tout type, facultatif)
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

- L’outil est **en JSON uniquement** et indique au modèle de produire uniquement du JSON (pas de
  blocs de code, pas de commentaire).
- Aucun outil n’est exposé au modèle pour cette exécution.
- Traitez la sortie comme non fiable sauf si vous la validez avec `schema`.
- Placez les approbations avant toute étape ayant des effets de bord (envoi, publication, exécution).

## Associé

- [Niveaux de réflexion](/fr/tools/thinking)
- [Sous-agents](/fr/tools/subagents)
- [Commandes slash](/fr/tools/slash-commands)
