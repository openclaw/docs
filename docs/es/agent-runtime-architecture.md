---
summary: 'Cómo estructura OpenClaw el tiempo de ejecución integrado del agente: diseño del código, límites, manifiestos de recursos y selección del tiempo de ejecución.'
title: Arquitectura del entorno de ejecución del agente
x-i18n:
    generated_at: "2026-07-05T11:00:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3dfae2f4770af5c14daa86ab39595598772af833dee4b03090d27b95eb17efdd
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw es propietario del runtime de agente integrado. El código del runtime vive en `src/agents/`, el transporte de modelos/proveedores vive en `src/llm/`, y los contratos orientados a plugins se exponen mediante los barrels `openclaw/plugin-sdk/*`.

## Diseño del Runtime

| Ruta                                | Propiedad                                                                                                                                                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/agents/embedded-agent-runner/` | Bucle de intentos integrado (`run.ts`, `run/`), selección de modelo y normalización de proveedor (`model*.ts`), parámetros de solicitud por proveedor (`extra-params.*`), compaction, cableado de transcripción y sesión. |
| `src/agents/sessions/`              | Persistencia de sesión (`session-manager.ts`), descubrimiento de recursos (`package-manager.ts`, `resource-loader.ts`), carga de `extensions` dentro de la sesión, plantillas de prompts, skills, temas y renderizadores de herramientas respaldados por TUI (`tools/`). |
| `packages/agent-core/`              | Núcleo de agente reutilizable (`@openclaw/agent-core`): bucle de agente, tipos de harness, mensajes, helpers de compaction, plantillas de prompts, skills y contratos de almacenamiento de sesión.                       |
| `src/agents/runtime/`               | Fachada de OpenClaw que conecta `@openclaw/agent-core` con el runtime LLM del SDK de plugins y lo reexporta junto con utilidades de proxy locales.                                                                         |
| `src/agents/agent-tools*.ts`        | Definiciones de herramientas propiedad de OpenClaw, esquemas de parámetros, política de herramientas, adaptadores antes/después de llamadas a herramientas y herramientas de edición de host/sandbox.                     |
| `src/agents/agent-hooks/`           | Hooks de runtime integrados: salvaguarda de compaction, instrucciones de compaction, poda de contexto.                                                                                                                     |
| `src/agents/harness/`               | Registro de harnesses, política de selección y ciclo de vida para harnesses integrados y registrados por plugins.                                                                                                         |
| `src/llm/`                          | Registro de modelos/proveedores, helpers de transporte e implementaciones de streams específicas de proveedor (`src/llm/providers/`).                                                                                      |

## Límites

El núcleo llama al runtime integrado mediante módulos de OpenClaw y barrels del SDK; ya no quedan paquetes externos de frameworks de agentes. Los plugins usan entrypoints documentados de `openclaw/plugin-sdk/*` y no importan internos de `src/**`.

`@earendil-works/pi-tui` sigue siendo una dependencia de terceros: un toolkit de componentes de terminal usado por la TUI local y los renderizadores de herramientas de sesión. Internalizarlo sería un esfuerzo de vendorización separado.

## Manifiestos

Los paquetes de recursos declaran recursos de OpenClaw en metadatos de `package.json`. Las entradas son rutas de archivo o globs relativas a la raíz del paquete:

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

Los tipos de recursos no listados en un manifiesto recurren al descubrimiento de los directorios convencionales `extensions/`, `skills/`, `prompts/` y `themes/`.

## Selección de Runtime

- El id del runtime integrado es `openclaw`. El alias heredado `pi` se normaliza a `openclaw`; `codex-app-server` se normaliza a `codex`.
- Los harnesses de plugins registran ids de runtime adicionales (por ejemplo, `codex`).
- La política de runtime es la configuración `agentRuntime.id` con alcance de modelo/proveedor (la entrada del modelo prevalece sobre la entrada del proveedor). Si no se define o es `default`, se resuelve como `auto`.
- `auto` selecciona un harness de plugin registrado que admita el proveedor/modelo; de lo contrario, usa el runtime integrado de OpenClaw.
- El proveedor `openai` en el endpoint oficial de la API usa de forma predeterminada el harness `codex`; los valores personalizados de `baseUrl` conservan su comportamiento configurado.

## Relacionado

- [Flujo de trabajo del runtime de agente de OpenClaw](/es/openclaw-agent-runtime)
- [Runtimes de agente](/es/concepts/agent-runtimes)
