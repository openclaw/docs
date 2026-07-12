---
summary: 'Cómo estructura OpenClaw el entorno de ejecución de agentes integrado: organización del código, límites, manifiestos de recursos y selección del entorno de ejecución.'
title: Arquitectura del entorno de ejecución del agente
x-i18n:
    generated_at: "2026-07-12T14:17:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 071a0cb076230ce02f2c2c1c21971379cf617f24faa8a9733570aae30a062019
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw es propietario del entorno de ejecución de agente integrado. El código del entorno de ejecución se encuentra en `src/agents/`, el transporte de modelos/proveedores se encuentra en `src/llm/` y los contratos orientados a plugins se exponen mediante los barrels `openclaw/plugin-sdk/*`.

## Estructura del entorno de ejecución

| Ruta                                | Responsabilidad                                                                                                                                                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/agents/embedded-agent-runner/` | Bucle de intentos integrado (`run.ts`, `run/`), selección de modelos y normalización de proveedores (`model*.ts`), parámetros de solicitud por proveedor (`extra-params.*`), Compaction y conexión de transcripciones y sesiones.      |
| `src/agents/sessions/`              | Persistencia de sesiones (`session-manager.ts`), detección de recursos (`package-manager.ts`, `resource-loader.ts`), carga de `extensions` durante la sesión, plantillas de prompts, Skills, temas y renderizadores de herramientas respaldados por la TUI (`tools/`). |
| `packages/agent-core/`              | Núcleo de agente reutilizable (`@openclaw/agent-core`): bucle del agente, tipos del arnés, mensajes, utilidades de Compaction, plantillas de prompts, Skills y contratos de almacenamiento de sesiones.                                 |
| `src/agents/runtime/`               | Fachada de OpenClaw que conecta `@openclaw/agent-core` con el entorno de ejecución LLM del SDK de plugins y lo reexporta junto con utilidades de proxy locales.                                                                       |
| `src/agents/agent-tools*.ts`        | Definiciones de herramientas propiedad de OpenClaw, esquemas de parámetros, políticas de herramientas, adaptadores anteriores y posteriores a las llamadas de herramientas y herramientas de edición del host/sandbox.               |
| `src/agents/agent-hooks/`           | Hooks integrados del entorno de ejecución: protección de Compaction, instrucciones de Compaction y poda de contexto.                                                                                                                  |
| `src/agents/harness/`               | Registro, política de selección y ciclo de vida de los arneses integrados y registrados por plugins.                                                                                                                                 |
| `src/llm/`                          | Registro de modelos/proveedores, utilidades de transporte e implementaciones de flujos específicas de cada proveedor (`src/llm/providers/`).                                                                                          |

## Límites

El núcleo llama al entorno de ejecución integrado mediante módulos de OpenClaw y barrels del SDK; no queda ningún paquete externo de marcos de agentes. Los plugins utilizan puntos de entrada documentados de `openclaw/plugin-sdk/*` y no importan elementos internos de `src/**`.

`@earendil-works/pi-tui` sigue siendo una dependencia de terceros: un kit de herramientas de componentes de terminal utilizado por la TUI local y los renderizadores de herramientas de sesión. Internalizarlo requeriría un esfuerzo independiente de incorporación del código de terceros.

## Manifiestos

Los paquetes de recursos declaran recursos de OpenClaw en los metadatos de `package.json`. Las entradas son rutas de archivo o patrones glob relativos a la raíz del paquete:

```json
{
  "openclaw": {
    "extensions": ["extensions/index.ts"],
    "skills": ["skills/*.md"],
    "prompts": ["prompts/*.md"],
    "themes": ["themes/*.json"]
  }
}
```

Los tipos de recursos que no figuran en un manifiesto recurren a la detección de los directorios convencionales `extensions/`, `skills/`, `prompts/` y `themes/`.

## Selección del entorno de ejecución

- El identificador del entorno de ejecución integrado es `openclaw`. El alias heredado `pi` se normaliza como `openclaw`; `codex-app-server` se normaliza como `codex`.
- Los arneses de plugins registran identificadores adicionales de entornos de ejecución (por ejemplo, `codex`).
- La política del entorno de ejecución es la configuración `agentRuntime.id` con ámbito de modelo/proveedor (la entrada del modelo prevalece sobre la del proveedor). Si no se establece o es `default`, se resuelve como `auto`.
- `auto` selecciona un arnés de plugin registrado que sea compatible con la ruta efectiva del proveedor; de lo contrario, selecciona el entorno de ejecución integrado de OpenClaw. Un prefijo de proveedor o modelo por sí solo nunca selecciona un arnés.
- OpenAI puede seleccionar `codex` implícitamente solo para una ruta oficial HTTPS exacta de Platform Responses o ChatGPT Responses sin una sobrescritura de solicitud definida por el autor. Los adaptadores de Completions, los endpoints personalizados y las rutas con comportamiento de solicitud definido por el autor permanecen en `openclaw`; se rechazan los endpoints HTTP oficiales sin cifrar. Consulte [Entorno de ejecución de agente implícito de OpenAI](/es/providers/openai#implicit-agent-runtime).

## Temas relacionados

- [Flujo de trabajo del entorno de ejecución de agentes de OpenClaw](/es/openclaw-agent-runtime)
- [Entornos de ejecución de agentes](/es/concepts/agent-runtimes)
