---
doc-schema-version: 1
read_when:
    - Quieres entender qué herramientas proporciona OpenClaw
    - Estás decidiendo entre herramientas integradas, Skills y plugins
    - Necesitas el punto de entrada de documentación adecuado para la política de herramientas, la automatización o la coordinación de agentes
summary: 'Descripción general de herramientas, Skills y plugins de OpenClaw: qué pueden llamar los agentes y cómo extenderlos'
title: Descripción general
x-i18n:
    generated_at: "2026-06-27T13:05:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f49afa2354ebb26eeb5f036cd1f2f7ceb228b01287adbc6c305addfb0af4502d
    source_path: tools/index.md
    workflow: 16
---

Usa esta página para elegir la superficie de Capacidades adecuada. **Las herramientas** son
acciones invocables, **Skills** enseña a los agentes cómo trabajar, y **los plugins** agregan capacidades
de runtime como herramientas, proveedores, canales, hooks y Skills empaquetadas.

Esta es una página de resumen y enrutamiento. Para la política exhaustiva de herramientas, valores predeterminados,
pertenencia a grupos, restricciones de proveedores y campos de configuración, usa
[Herramientas y proveedores personalizados](/es/gateway/config-tools).

## Empieza aquí

Para la mayoría de los agentes, empieza con las categorías de herramientas integradas y luego ajusta la política
solo cuando el agente deba ver menos herramientas o necesite acceso explícito al host.

| Si necesitas...                                       | Usa esto primero                                   | Luego lee                                                                                                               |
| ----------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Permitir que un agente actúe con capacidades existentes | [Herramientas integradas](#built-in-tool-categories) | [Categorías de herramientas](#built-in-tool-categories)                                                                 |
| Controlar qué puede invocar un agente                 | [Política de herramientas](#configure-access-and-approvals) | [Herramientas y proveedores personalizados](/es/gateway/config-tools)                                                       |
| Enseñar un flujo de trabajo a un agente               | [Skills](#choose-tools-skills-or-plugins)          | [Skills](/es/tools/skills), [Crear Skills](/es/tools/creating-skills), y [Taller de Skills](/es/tools/skill-workshop)            |
| Agregar una nueva integración o superficie de runtime | [Plugins](#extend-capabilities)                    | [Plugins](/es/tools/plugin) y [Crear plugins](/es/plugins/building-plugins)                                                   |
| Ejecutar trabajo más tarde o en segundo plano         | [Automatización](/es/automation)                      | [Resumen de automatización](/es/automation)                                                                                |
| Coordinar múltiples agentes o arneses                 | [Subagentes](/es/tools/subagents)                     | [Agentes ACP](/es/tools/acp-agents) y [Envío de agente](/es/tools/agent-send)                                                 |
| Buscar en un catálogo grande de herramientas de OpenClaw | [Búsqueda de herramientas](/es/tools/tool-search)     | [Búsqueda de herramientas](/es/tools/tool-search)                                                                          |

## Elige herramientas, Skills o plugins

<Steps>
  <Step title="Usa una herramienta cuando el agente necesite actuar">
    Una herramienta es una función tipada que el agente puede invocar, como `exec`, `browser`,
    `web_search`, `message` o `image_generate`. Usa herramientas cuando el agente
    necesite leer datos, cambiar archivos, enviar mensajes, llamar a un proveedor u operar
    otro sistema. Las herramientas visibles se envían al modelo como definiciones de función
    estructuradas.

    El modelo solo ve las herramientas que sobreviven al perfil activo, la política de permitir/denegar,
    las restricciones del proveedor, el estado del sandbox, los permisos del canal y
    la disponibilidad de plugins.

  </Step>

  <Step title="Usa una Skill cuando el agente necesite instrucciones">
    Una Skill es un paquete de instrucciones `SKILL.md` cargado en el prompt del agente. Usa una
    Skill cuando el agente ya tenga las herramientas que necesita, pero necesite un
    flujo de trabajo repetible, una rúbrica de revisión, una secuencia de comandos o una restricción operativa.

    Las Skills pueden estar en un workspace, un directorio compartido de Skills, una raíz administrada de Skills de OpenClaw
    o un paquete de plugin.

    [Skills](/es/tools/skills) | [Taller de Skills](/es/tools/skill-workshop) | [Crear Skills](/es/tools/creating-skills) | [Configuración de Skills](/es/tools/skills-config)

  </Step>

  <Step title="Usa un plugin cuando OpenClaw necesite una nueva capacidad">
    Un plugin puede agregar herramientas, Skills, canales, proveedores de modelos, voz, voz en tiempo real,
    generación de medios, búsqueda web, obtención web, hooks y otras capacidades de runtime.
    Usa un plugin cuando la capacidad tenga código, credenciales,
    hooks de ciclo de vida, metadatos de manifiesto o empaquetado instalable. Los plugins
    existentes se pueden instalar desde ClawHub, npm, git, directorios locales o
    archivos.

    [Instalar y configurar plugins](/es/tools/plugin) | [Crear plugins](/es/plugins/building-plugins) | [SDK de Plugin](/es/plugins/sdk-overview)

  </Step>
</Steps>

## Categorías de herramientas integradas

La tabla enumera herramientas representativas para que puedas reconocer la superficie. No es
la referencia completa de políticas. Para grupos exactos, valores predeterminados y semántica
de permitir/denegar, usa [Herramientas y proveedores personalizados](/es/gateway/config-tools).

| Categoría                | Úsala cuando el agente necesite...                                             | Herramientas representativas                                         | Lee a continuación                                                                         |
| ------------------------ | ------------------------------------------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Runtime                  | Ejecutar comandos, gestionar procesos o usar análisis de Python respaldado por proveedor | `exec`, `process`, `code_execution`                                  | [Exec](/es/tools/exec), [Ejecución de código](/es/tools/code-execution)                         |
| Archivos                 | Leer y cambiar archivos del workspace                                           | `read`, `write`, `edit`, `apply_patch`                               | [Aplicar parche](/es/tools/apply-patch)                                                       |
| Web                      | Buscar en la web, buscar publicaciones de X u obtener contenido legible de páginas | `web_search`, `x_search`, `web_fetch`                                | [Herramientas web](/es/tools/web), [Obtención web](/es/tools/web-fetch)                         |
| Navegador                | Operar una sesión de navegador                                                  | `browser`                                                            | [Navegador](/es/tools/browser)                                                                |
| Mensajería y canales     | Enviar respuestas o acciones de canal                                           | `message`                                                            | [Envío de agente](/es/tools/agent-send)                                                       |
| Sesiones y agentes       | Inspeccionar sesiones, delegar trabajo, dirigir otra ejecución o informar estado | `sessions_*`, `subagents`, `agents_list`, `session_status`, `goal`   | [Objetivo](/es/tools/goal), [Subagentes](/es/tools/subagents), [Herramienta de sesión](/es/concepts/session-tool) |
| Automatización           | Programar trabajo o responder a eventos en segundo plano                        | `cron`, `heartbeat_respond`                                          | [Automatización](/es/automation)                                                             |
| Gateway y nodos          | Inspeccionar el estado del Gateway o dispositivos objetivo emparejados          | `gateway`, `nodes`                                                   | [Configuración del Gateway](/es/gateway/configuration), [Nodos](/es/nodes)                      |
| Medios                   | Analizar, generar o pronunciar medios                                           | `image`, `image_generate`, `music_generate`, `video_generate`, `tts` | [Resumen de medios](/es/tools/media-overview)                                                |
| Catálogos grandes de OpenClaw | Buscar e invocar muchas herramientas elegibles sin enviar todos los esquemas al modelo | `tool_search_code`, `tool_search`, `tool_describe`                   | [Búsqueda de herramientas](/es/tools/tool-search)                                             |

<Note>
Búsqueda de herramientas es una superficie experimental de agente de OpenClaw. Las ejecuciones del arnés Codex usan
modo de código nativo de Codex, búsqueda de herramientas nativa, herramientas dinámicas diferidas y llamadas
a herramientas anidadas en lugar de `tools.toolSearch`.
</Note>

## Herramientas proporcionadas por plugins

Los plugins pueden registrar herramientas adicionales. Los autores de plugins conectan herramientas mediante
`api.registerTool(...)` y `contracts.tools` del manifiesto; usa
[SDK de Plugin](/es/plugins/sdk-overview) y [Manifiesto de Plugin](/es/plugins/manifest)
para detalles del contrato.

Las herramientas comunes proporcionadas por plugins incluyen:

- [Diferencias](/es/tools/diffs) para renderizar diferencias de archivos y markdown
- [Tarea LLM](/es/tools/llm-task) para pasos de flujo de trabajo solo JSON
- [Lobster](/es/tools/lobster) para flujos de trabajo tipados con aprobaciones reanudables
- [Tokenjuice](/es/tools/tokenjuice) para compactar la salida ruidosa de herramientas `exec` y `bash`
- [Búsqueda de herramientas](/es/tools/tool-search) para descubrir e invocar catálogos grandes de herramientas
  sin poner cada esquema en el prompt
- [Canvas](/es/plugins/reference/canvas) para control de Canvas de nodo y renderizado
  A2UI

## Configura acceso y aprobaciones

La política de herramientas se aplica antes de la llamada al modelo. Si la política elimina una herramienta, el
modelo no recibe el esquema de esa herramienta para el turno. Una ejecución puede perder herramientas
por la configuración global, la configuración por agente, la política de canal, las restricciones del proveedor,
las reglas del sandbox, la política de canal/runtime o la disponibilidad de plugins.

- [Herramientas y proveedores personalizados](/es/gateway/config-tools) documenta perfiles de herramientas,
  listas de permitir/denegar, restricciones específicas de proveedor, detección de bucles y
  configuración de herramientas respaldadas por proveedor.
- [Aprobaciones de exec](/es/tools/exec-approvals) documenta la política de aprobación de comandos del host.
- [Exec elevado](/es/tools/elevated) documenta la ejecución controlada fuera del
  sandbox.
- [Sandbox vs política de herramientas vs elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated) explica qué capa controla el acceso a archivos y procesos.
- [Restricciones de sandbox y herramientas por agente](/es/tools/multi-agent-sandbox-tools)
  documenta restricciones específicas de agente para ejecuciones delegadas.

## Extiende capacidades

Elige la ruta de extensión según el trabajo que necesites que OpenClaw haga:

- Instala o gestiona un plugin existente con [Plugins](/es/tools/plugin).
- Crea una nueva integración, proveedor, canal, herramienta o hook con
  [Crear plugins](/es/plugins/building-plugins).
- Agrega o ajusta instrucciones reutilizables de agente con [Skills](/es/tools/skills) y
  [Crear Skills](/es/tools/creating-skills).
- Usa [SDK de Plugin](/es/plugins/sdk-overview) y [Manifiesto de Plugin](/es/plugins/manifest) cuando necesites contratos de implementación.

## Soluciona problemas de herramientas faltantes

Si el modelo no puede ver o invocar una herramienta, empieza con la política efectiva para el
turno actual:

1. Revisa el perfil activo, `tools.allow` y `tools.deny` en
   [Herramientas y proveedores personalizados](/es/gateway/config-tools).
2. Revisa las restricciones específicas del proveedor en
   [Herramientas y proveedores personalizados](/es/gateway/config-tools) y confirma que el
   [proveedor de modelos](/es/concepts/model-providers) seleccionado admite la forma de la herramienta.
3. Revisa permisos de canal, estado del sandbox y acceso elevado con
   [Sandbox vs política de herramientas vs elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated) y [Exec elevado](/es/tools/elevated).
4. Revisa si el plugin propietario está instalado y habilitado en
   [Plugins](/es/tools/plugin).
5. Para ejecuciones delegadas, revisa las restricciones por agente en
   [Restricciones de sandbox y herramientas por agente](/es/tools/multi-agent-sandbox-tools).
6. Para catálogos grandes de OpenClaw, confirma si la ejecución usa exposición directa de herramientas o
   [Búsqueda de herramientas](/es/tools/tool-search).

## Relacionado

- [Automatización](/es/automation) para cron, tareas, Heartbeat, compromisos, hooks, órdenes permanentes y Task Flow
- [Agentes](/es/concepts/agent) para el modelo de agente, sesiones, memoria y coordinación multiagente
- [Herramientas y proveedores personalizados](/es/gateway/config-tools) para la referencia canónica de políticas de herramientas
- [Plugins](/es/tools/plugin) para instalación y gestión de plugins
- [SDK de Plugin](/es/plugins/sdk-overview) para la referencia de autores de plugins
- [Skills](/es/tools/skills) para orden de carga, control y configuración de Skills
- [Taller de Skills](/es/tools/skill-workshop) para creación de Skills generada y revisada
- [Búsqueda de herramientas](/es/tools/tool-search) para descubrimiento compacto de catálogos de herramientas de OpenClaw
