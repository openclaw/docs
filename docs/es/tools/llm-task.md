---
read_when:
    - Quieres un paso de LLM solo JSON dentro de los flujos de trabajo
    - Necesitas una salida de LLM validada por esquema para la automatización
summary: Tareas de LLM solo JSON para flujos de trabajo (herramienta de Plugin opcional)
title: Tarea de LLM
x-i18n:
    generated_at: "2026-07-05T11:49:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98856fd8ccf7181a89073cbaa939d9b303532f7fba612d7800e1b89a9d1b25ae
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` es una **herramienta de plugin opcional** incluida que ejecuta una única
llamada LLM solo JSON y devuelve salida estructurada, opcionalmente validada con un
Schema JSON. Ofrece a motores de flujo de trabajo como Lobster un paso LLM sin código
OpenClaw personalizado por flujo de trabajo.

## Habilitar

1. Habilita el plugin:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. Permite la herramienta:

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

`alsoAllow` añade `llm-task` sobre el perfil de herramientas activo sin
restringir otras herramientas centrales. Usa `tools.allow` solo si quieres un modo
restrictivo de lista de permitidos.

## Configuración (opcional)

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

`allowedModels` es una lista de permitidos de cadenas `provider/model`; se rechaza una solicitud para cualquier
otro modelo. Todas las demás claves son valores de reserva por llamada que se usan cuando la
llamada de herramienta omite ese parámetro.

## Parámetros de la herramienta

| Parámetro       | Tipo   | Notas                                                                                                                                         |
| --------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `prompt`        | string | Obligatorio. Instrucción de tarea para el LLM.                                                                                                       |
| `input`         | any    | Carga útil opcional; se serializa a JSON y se añade al prompt.                                                                              |
| `schema`        | object | Schema JSON opcional contra el que debe validarse la salida analizada.                                                                                 |
| `provider`      | string | Anula `defaultProvider` / el proveedor predeterminado del agente.                                                                                   |
| `model`         | string | Anula `defaultModel`; acepta ids de modelo simples, alias o una referencia `provider/model` (un prefijo de proveedor duplicado se elimina automáticamente). |
| `thinking`      | string | Nivel de razonamiento (por ejemplo, `low`, `medium`); debe ser uno compatible con el modelo resuelto.                                                          |
| `authProfileId` | string | Anula `defaultAuthProfileId`.                                                                                                             |
| `temperature`   | number | De mejor esfuerzo; no todos los proveedores lo respetan.                                                                                                      |
| `maxTokens`     | number | Límite de mejor esfuerzo para tokens de salida.                                                                                                             |
| `timeoutMs`     | number | Tiempo de espera de ejecución; valor predeterminado `30000`.                                                                                                                 |

## Salida

Devuelve `details.json` (el JSON analizado y validado con el schema), además de `details.provider`
y `details.model`, que indican qué se ejecutó realmente.

## Ejemplo: paso de flujo de trabajo de Lobster

### Limitación importante

El ejemplo siguiente asume que la **CLI independiente de Lobster** se ejecuta donde
`openclaw.invoke` ya tiene el contexto correcto de URL/autenticación del gateway.

Para el ejecutor Lobster **integrado** incluido dentro de OpenClaw, este patrón de CLI anidada
**actualmente no es fiable**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Hasta que Lobster integrado tenga un puente compatible para este flujo, prefiere:

- llamadas directas a la herramienta `llm-task` fuera de Lobster, o
- pasos de Lobster que no dependan de llamadas `openclaw.invoke` anidadas.

Ejemplo de la CLI independiente de Lobster:

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

- **Solo JSON**: se indica al modelo que devuelva solo un valor JSON, sin bloques de
  código ni comentarios.
- **Sin herramientas**: la ejecución subyacente tiene las herramientas deshabilitadas, por lo que el modelo no puede llamar
  fuera durante la tarea.
- Trata la salida como no fiable a menos que la valides con `schema`.
- Coloca aprobaciones antes de cualquier paso con efectos secundarios (send, post, exec) que consuma
  esta salida.

## Relacionado

- [Niveles de razonamiento](/es/tools/thinking)
- [Subagentes](/es/tools/subagents)
- [Comandos slash](/es/tools/slash-commands)
