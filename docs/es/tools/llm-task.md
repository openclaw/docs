---
read_when:
    - Quieres un paso de LLM solo JSON dentro de flujos de trabajo
    - Necesitas una salida de LLM validada por esquema para la automatización
summary: Tareas de LLM solo JSON para flujos de trabajo (herramienta de Plugin opcional)
title: Tarea de LLM
x-i18n:
    generated_at: "2026-05-04T02:25:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cdc5d4feef17fb6d6d90d819d4c92d26a4ec43e4f5364c6acbaad1934a89269
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` es una **herramienta opcional de Plugin** que ejecuta una tarea de LLM solo JSON y
devuelve una salida estructurada (opcionalmente validada contra JSON Schema).

Esto es ideal para motores de flujo de trabajo como Lobster: puedes añadir un único paso de LLM
sin escribir código personalizado de OpenClaw para cada flujo de trabajo.

## Habilitar el Plugin

1. Habilita el Plugin:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. Permite la herramienta opcional:

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

Usa `tools.allow` solo cuando quieras el modo restrictivo de lista de permitidos.

## Configuración (opcional)

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

`allowedModels` es una lista de permitidos de cadenas `provider/model`. Si se define, se rechaza cualquier solicitud
fuera de la lista.

## Parámetros de la herramienta

- `prompt` (cadena, obligatorio)
- `input` (cualquiera, opcional)
- `schema` (objeto, JSON Schema opcional)
- `provider` (cadena, opcional)
- `model` (cadena, opcional)
- `thinking` (cadena, opcional)
- `authProfileId` (cadena, opcional)
- `temperature` (número, opcional)
- `maxTokens` (número, opcional)
- `timeoutMs` (número, opcional)

`thinking` acepta los preajustes estándar de razonamiento de OpenClaw, como `low` o `medium`.

## Salida

Devuelve `details.json` que contiene el JSON analizado (y valida contra
`schema` cuando se proporciona).

## Ejemplo: paso de flujo de trabajo de Lobster

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

## Notas de seguridad

- La herramienta es **solo JSON** e indica al modelo que genere solo JSON (sin
  bloques de código ni comentarios).
- No se exponen herramientas al modelo para esta ejecución.
- Trata la salida como no confiable a menos que la valides con `schema`.
- Coloca aprobaciones antes de cualquier paso con efectos secundarios (enviar, publicar, ejecutar).

## Relacionado

- [Niveles de Thinking](/es/tools/thinking)
- [Subagentes](/es/tools/subagents)
- [Comandos slash](/es/tools/slash-commands)
