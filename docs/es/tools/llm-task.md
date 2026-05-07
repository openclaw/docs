---
read_when:
    - Quieres un paso de LLM solo JSON dentro de los flujos de trabajo
    - Necesitas una salida de LLM validada por esquema para la automatización
summary: Tareas de LLM solo JSON para flujos de trabajo (herramienta de Plugin opcional)
title: Tarea de LLM
x-i18n:
    generated_at: "2026-05-07T13:25:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4f5efe399165e31a7f5966b93c2f83bced4fd96b7f04f5156412fd321bf5f403
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` es una **herramienta de Plugin opcional** que ejecuta una tarea de LLM solo JSON y
devuelve una salida estructurada (opcionalmente validada con JSON Schema).

Esto es ideal para motores de flujo de trabajo como Lobster: puedes agregar un único paso de LLM
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

Usa `tools.allow` solo cuando quieras el modo de lista de permitidos restrictiva.

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

`allowedModels` es una lista de permitidos de cadenas `provider/model`. Si se establece, se rechaza cualquier solicitud
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

Devuelve `details.json`, que contiene el JSON analizado (y lo valida con
`schema` cuando se proporciona).

## Ejemplo: paso de flujo de trabajo de Lobster

### Limitación importante

El ejemplo siguiente supone que la **CLI independiente de Lobster** se ejecuta en un entorno donde `openclaw.invoke` ya tiene la URL del Gateway y el contexto de autenticación correctos.

Para el ejecutor de Lobster **embebido** incluido dentro de OpenClaw, este patrón de CLI anidada **actualmente no es fiable**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Hasta que Lobster embebido tenga un puente compatible para este flujo, prefiere cualquiera de estas opciones:

- llamadas directas a la herramienta `llm-task` fuera de Lobster, o
- pasos de Lobster que no dependan de llamadas anidadas a `openclaw.invoke`.

Ejemplo de CLI independiente de Lobster:

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

- La herramienta es **solo JSON** e indica al modelo que genere únicamente JSON (sin
  bloques de código ni comentarios).
- No se exponen herramientas al modelo para esta ejecución.
- Trata la salida como no confiable salvo que la valides con `schema`.
- Coloca aprobaciones antes de cualquier paso con efectos secundarios (enviar, publicar, ejecutar).

## Relacionado

- [Niveles de razonamiento](/es/tools/thinking)
- [Subagentes](/es/tools/subagents)
- [Comandos slash](/es/tools/slash-commands)
