---
read_when:
    - Quieres un paso de LLM que produzca únicamente JSON dentro de los flujos de trabajo
    - Necesitas resultados de un LLM validados mediante un esquema para la automatización
summary: Tareas de LLM exclusivamente en JSON para flujos de trabajo (herramienta de plugin opcional)
title: Tarea del LLM
x-i18n:
    generated_at: "2026-07-11T23:35:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 78ea533f43546fbdd66c7f7138b8dea0b12b02d38925689324b390a12d0c4c5a
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` es una **herramienta de Plugin opcional incluida** que ejecuta una única
llamada al LLM exclusivamente en JSON y devuelve una salida estructurada, validada
opcionalmente con un esquema JSON. Proporciona a motores de flujo de trabajo como
Lobster un paso de LLM sin requerir código personalizado de OpenClaw para cada flujo.

## Habilitación

1. Habilite el Plugin:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. Permita la herramienta:

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

`alsoAllow` añade `llm-task` al perfil de herramientas activo sin restringir
otras herramientas principales. Use `tools.allow` solo si, en su lugar, desea
un modo restrictivo de lista de permitidos.

## Configuración (opcional)

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

`allowedModels` es una lista de permitidos de cadenas `provider/model`; se
rechazan las solicitudes de cualquier otro modelo. Todas las demás claves son
valores de reserva por llamada que se utilizan cuando la llamada a la herramienta
omite ese parámetro.

## Parámetros de la herramienta

| Parámetro       | Tipo   | Notas                                                                                                                                                        |
| --------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `prompt`        | string | Obligatorio. Instrucción de la tarea para el LLM.                                                                                                            |
| `input`         | any    | Carga útil opcional; se serializa como JSON y se añade al prompt.                                                                                            |
| `schema`        | object | Esquema JSON opcional con el que debe validarse la salida analizada.                                                                                         |
| `provider`      | string | Sustituye a `defaultProvider` o al proveedor predeterminado del agente.                                                                                      |
| `model`         | string | Sustituye a `defaultModel`; acepta identificadores de modelo sin prefijo, alias o una referencia `provider/model` (los prefijos de proveedor duplicados se eliminan automáticamente). |
| `thinking`      | string | Nivel de razonamiento (p. ej., `low`, `medium`); debe ser uno de los admitidos por el modelo resuelto.                                                       |
| `authProfileId` | string | Sustituye a `defaultAuthProfileId`.                                                                                                                          |
| `temperature`   | number | Se aplica en la medida de lo posible; no todos los proveedores lo respetan.                                                                                  |
| `maxTokens`     | number | Límite máximo de tokens de salida, aplicado en la medida de lo posible.                                                                                      |
| `timeoutMs`     | number | Tiempo de espera de la ejecución; valor predeterminado: `30000`.                                                                                             |

## Salida

Devuelve `details.json` (el JSON analizado y validado con el esquema), además de
`details.provider` y `details.model`, que indican qué proveedor y modelo se
ejecutaron realmente.

## Ejemplo: paso de un flujo de trabajo de Lobster

### Limitación importante

El siguiente ejemplo presupone que la **CLI independiente de Lobster** se ejecuta
donde `openclaw.invoke` ya dispone de la URL del Gateway y del contexto de
autenticación correctos.

Para el ejecutor de Lobster **integrado** incluido en OpenClaw, este patrón de
CLI anidada **no es fiable actualmente**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Hasta que Lobster integrado disponga de un puente compatible con este flujo,
prefiera una de estas opciones:

- llamadas directas a la herramienta `llm-task` fuera de Lobster; o
- pasos de Lobster que no dependan de llamadas anidadas a `openclaw.invoke`.

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

- **Solo JSON**: se indica al modelo que devuelva únicamente un valor JSON, sin
  bloques de código ni comentarios.
- **Sin herramientas**: la ejecución subyacente tiene las herramientas
  deshabilitadas, por lo que el modelo no puede realizar llamadas durante la tarea.
- Trate la salida como no fiable, a menos que la valide con `schema`.
- Coloque las aprobaciones antes de cualquier paso con efectos secundarios
  (enviar, publicar, ejecutar) que consuma esta salida.

## Contenido relacionado

- [Niveles de razonamiento](/es/tools/thinking)
- [Subagentes](/es/tools/subagents)
- [Comandos con barra](/es/tools/slash-commands)
