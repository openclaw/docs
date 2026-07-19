---
summary: 'Cómo estructura OpenClaw el entorno de ejecución del agente integrado: organización del código, límites, manifiestos de recursos y selección del entorno de ejecución.'
title: Arquitectura del entorno de ejecución del agente
x-i18n:
    generated_at: "2026-07-19T13:34:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3e09ff21b4369a7c102db51e4458ad3ba1e86c9fe43a3a8bff72eef1713d2d51
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw es responsable del runtime de agente integrado. El código del runtime se encuentra en `src/agents/`, el transporte de modelos/proveedores se encuentra en `src/llm/` y los contratos orientados a plugins se exponen mediante los barrels de `openclaw/plugin-sdk/*`.

## Estructura del runtime

| Ruta                                | Responsabilidad                                                                                                                                                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/agents/embedded-agent-runner/` | Bucle de intentos integrado (`run.ts`, `run/`), selección de modelos y normalización de proveedores (`model*.ts`), parámetros de solicitud por proveedor (`extra-params.*`), Compaction y conexión de transcripciones y sesiones.                            |
| `src/agents/sessions/`              | Persistencia de sesiones (`session-manager.ts`), descubrimiento de recursos (`package-manager.ts`, `resource-loader.ts`), carga de `extensions` durante la sesión, plantillas de prompts, Skills, temas y renderizadores de herramientas respaldados por la TUI (`tools/`). |
| `packages/agent-core/`              | Núcleo de agente reutilizable (`@openclaw/agent-core`): bucle del agente, tipos del arnés, mensajes, asistentes de Compaction, plantillas de prompts, Skills y contratos de almacenamiento de sesiones.                                                           |
| `src/agents/runtime/`               | Fachada de OpenClaw que conecta `@openclaw/agent-core` con el runtime de LLM del SDK de plugins y vuelve a exportarlo junto con utilidades de proxy locales.                                                                                             |
| `src/agents/agent-tools*.ts`        | Definiciones de herramientas propiedad de OpenClaw, esquemas de parámetros, política de herramientas, adaptadores anteriores y posteriores a las llamadas de herramientas y herramientas de edición del host y el entorno aislado.                                                                                            |
| `src/agents/agent-hooks/`           | Hooks del runtime integrado: protección de Compaction, instrucciones de Compaction y poda de contexto.                                                                                                                                   |
| `src/agents/harness/`               | Registro de arneses, política de selección y ciclo de vida de los arneses integrados y registrados por plugins.                                                                                                                       |
| `src/llm/`                          | Registro de modelos/proveedores, asistentes de transporte e implementaciones de streaming específicas de proveedores (`src/llm/providers/`).                                                                                                          |

## Límites

El núcleo llama al runtime integrado mediante módulos de OpenClaw y barrels del SDK; ya no queda ningún paquete externo de frameworks de agentes. Los plugins utilizan puntos de entrada documentados de `openclaw/plugin-sdk/*` y no importan elementos internos de `src/**`.

`@earendil-works/pi-tui` sigue siendo una dependencia de terceros: un kit de herramientas de componentes de terminal utilizado por la TUI local y los renderizadores de herramientas de sesión. Internalizarlo requeriría un esfuerzo independiente de incorporación del código de terceros.

## Manifiestos

Los paquetes de recursos declaran los recursos de OpenClaw en los metadatos de `package.json`. Las entradas son rutas de archivo o patrones glob relativos a la raíz del paquete:

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

Los tipos de recursos que no aparecen en un manifiesto recurren al descubrimiento de los directorios convencionales `extensions/`, `skills/`, `prompts/` y `themes/`.

## Selección del runtime

- El id del runtime integrado es `openclaw`. El alias heredado `pi` se normaliza como `openclaw`; `codex-app-server` se normaliza como `codex`.
- Los arneses de plugins registran identificadores de runtime adicionales (por ejemplo, `codex`).
- La política del runtime es una configuración `agentRuntime.id` con alcance de modelo/proveedor (la entrada del modelo prevalece sobre la del proveedor). Si no se establece o es `default`, se resuelve como `auto`.
- `auto` selecciona un arnés de plugin registrado que admita la ruta efectiva del proveedor; de lo contrario, selecciona el runtime integrado de OpenClaw. Un prefijo de proveedor o modelo por sí solo nunca selecciona un arnés.
- OpenAI puede seleccionar `codex` implícitamente solo para una ruta oficial HTTPS exacta de Platform Responses o ChatGPT Responses sin una sobrescritura de solicitud definida. Los adaptadores de Completions, los endpoints personalizados y las rutas con comportamiento de solicitud definido permanecen en `openclaw`; los endpoints HTTP oficiales en texto sin cifrar se rechazan. Consulte [Runtime de agente implícito de OpenAI](/es/providers/openai#implicit-agent-runtime).

## Generaciones del runtime de modelos

El inicio y la configuración del Gateway, así como la publicación de plugins o de autenticación, crean una generación preparada del runtime de modelos por cada agente configurado. Cada generación contiene la plantilla de autenticación descubierta, el registro de modelos y el catálogo de modelos proyectado como una única instantánea atómica. Las ejecuciones de agentes bifurcan almacenes mutables de autenticación y de registro a partir de esa instantánea; las rutas de exploración, estado, Cron, diagnóstico, TUI, PDF e imágenes leen el catálogo publicado en lugar de repetir el descubrimiento del sistema de archivos.

Los runtimes integrados independientes publican la misma estructura de instantánea en su límite de activación. Una generación fallida u obsoleta nunca se sirve junto con una generación parcial más reciente; el responsable del ciclo de vida debe publicar primero un reemplazo completo.

## Temas relacionados

- [Flujo de trabajo del runtime de agente de OpenClaw](/es/openclaw-agent-runtime)
- [Runtimes de agentes](/es/concepts/agent-runtimes)
