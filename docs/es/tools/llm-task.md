---
read_when:
    - Quieres un paso LLM solo JSON dentro de flujos de trabajo
    - Necesitas salida LLM validada por esquema para automatización
summary: Tareas LLM solo JSON para flujos de trabajo (herramienta opcional de Plugin)
title: Tarea LLM
x-i18n:
    generated_at: "2026-04-24T05:54:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 613aefd1bac5b9675821a118c11130c8bfaefb1673d0266f14ff4e91b47fed8b
    source_path: tools/llm-task.md
    workflow: 15
---

`llm-task` es una **herramienta opcional de Plugin** que ejecuta una tarea LLM solo JSON y
devuelve salida estructurada (opcionalmente validada contra JSON Schema).

Esto es ideal para motores de flujo de trabajo como Lobster: puedes añadir un único paso LLM
sin escribir código personalizado de OpenClaw para cada flujo.

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

2. Incluye la herramienta en la lista de permitidos (se registra con `optional: true`):

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

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

`allowedModels` es una lista de permitidos de cadenas `provider/model`. Si se establece, cualquier solicitud
fuera de la lista se rechaza.

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

`thinking` acepta los ajustes predefinidos estándar de razonamiento de OpenClaw, como `low` o `medium`.

## Salida

Devuelve `details.json` que contiene el JSON analizado (y lo valida contra
`schema` cuando se proporciona).

## Ejemplo: paso de flujo Lobster

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

- La herramienta es **solo JSON** e indica al modelo que emita solo JSON (sin
  bloques de código, sin comentarios).
- No se exponen herramientas al modelo para esta ejecución.
- Trata la salida como no fiable a menos que la valides con `schema`.
- Coloca aprobaciones antes de cualquier paso con efectos secundarios (enviar, publicar, exec).

## Relacionado

- [Niveles de pensamiento](/es/tools/thinking)
- [Subagentes](/es/tools/subagents)
- [Comandos slash](/es/tools/slash-commands)
