---
doc-schema-version: 1
read_when:
    - Quiere comprender qué herramientas proporciona OpenClaw
    - Está decidiendo entre herramientas integradas, Skills y plugins
    - Necesita el punto de entrada adecuado de la documentación para la política de herramientas, la automatización o la coordinación de agentes.
summary: 'Descripción general de las herramientas, Skills y plugins de OpenClaw: qué pueden invocar los agentes y cómo ampliarlos'
title: Descripción general
x-i18n:
    generated_at: "2026-07-12T14:52:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 628b47a8756e229a712981b669c96a36689909755dcd244667612f8761e67526
    source_path: tools/index.md
    workflow: 16
---

Utilice esta página para elegir la superficie de capacidades adecuada. Las **herramientas** son
acciones invocables, las **Skills** enseñan a los agentes cómo trabajar y los **plugins** añaden
capacidades de ejecución, como herramientas, proveedores, canales, hooks y
Skills empaquetadas.

Esta es una página de descripción general y orientación. Para consultar exhaustivamente las políticas de herramientas, los valores predeterminados,
la pertenencia a grupos, las restricciones de proveedores y los campos de configuración, utilice
[Herramientas y proveedores personalizados](/es/gateway/config-tools).

## Comience aquí

Para la mayoría de los agentes, comience con las categorías de herramientas integradas y, a continuación, ajuste la política
solo cuando el agente deba ver menos herramientas o necesite acceso explícito al host.

| Si necesita...                                            | Utilice primero esto                                        | A continuación, consulte                                                                                                                     |
| --------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Permitir que un agente actúe con las capacidades existentes | [Herramientas integradas](#built-in-tool-categories)        | [Categorías de herramientas](#built-in-tool-categories)                                                                                       |
| Controlar qué puede invocar un agente                     | [Política de herramientas](#configure-access-and-approvals) | [Herramientas y proveedores personalizados](/es/gateway/config-tools)                                                                            |
| Enseñar un flujo de trabajo a un agente                   | [Skills](#choose-tools-skills-or-plugins)                   | [Skills](/es/tools/skills), [Creación de Skills](/es/tools/creating-skills) y [Taller de Skills](/es/tools/skill-workshop)                              |
| Añadir una nueva integración o superficie de ejecución    | [Plugins](#extend-capabilities)                             | [Plugins](/es/tools/plugin) y [Crear plugins](/es/plugins/building-plugins)                                                                          |
| Ejecutar trabajo más tarde o en segundo plano             | [Automatización](/es/automation)                               | [Descripción general de la automatización](/es/automation)                                                                                       |
| Coordinar varios agentes o entornos de ejecución          | [Subagentes](/es/tools/subagents)                              | [Agentes ACP](/es/tools/acp-agents) y [Envío del agente](/es/tools/agent-send)                                                                       |
| Buscar en un catálogo amplio de herramientas de OpenClaw  | [Búsqueda de herramientas](/es/tools/tool-search)              | [Búsqueda de herramientas](/es/tools/tool-search)                                                                                                 |

## Elija herramientas, Skills o plugins

<Steps>
  <Step title="Utilice una herramienta cuando el agente necesite actuar">
    Una herramienta es una función tipada que el agente puede invocar, como `exec`, `browser`,
    `web_search`, `message` o `image_generate`. Utilice herramientas cuando el agente
    necesite leer datos, modificar archivos, enviar mensajes, invocar un proveedor u
    operar otro sistema. Las herramientas visibles se envían al modelo como definiciones
    estructuradas de funciones.

    El modelo solo ve las herramientas que superan el perfil activo, la política de permisos y denegaciones,
    las restricciones del proveedor, el estado del sandbox, los permisos del canal y
    la disponibilidad de los plugins.

  </Step>

  <Step title="Utilice una Skill cuando el agente necesite instrucciones">
    Una Skill es un paquete de instrucciones `SKILL.md` cargado en el prompt del agente. Utilice
    una Skill cuando el agente ya disponga de las herramientas necesarias, pero necesite un
    flujo de trabajo repetible, criterios de revisión, una secuencia de comandos o una
    restricción operativa.

    Las Skills pueden residir en un espacio de trabajo, un directorio compartido de Skills, la raíz administrada
    de Skills de OpenClaw o el paquete de un plugin.

    [Skills](/es/tools/skills) | [Taller de Skills](/es/tools/skill-workshop) | [Creación de Skills](/es/tools/creating-skills) | [Configuración de Skills](/es/tools/skills-config)

  </Step>

  <Step title="Utilice un plugin cuando OpenClaw necesite una nueva capacidad">
    Un plugin puede añadir herramientas, Skills, canales, proveedores de modelos, voz,
    voz en tiempo real, generación multimedia, búsqueda web, obtención de contenido web, hooks y otras
    capacidades de ejecución. Utilice un plugin cuando la capacidad tenga código,
    credenciales, hooks de ciclo de vida, metadatos de manifiesto o un
    paquete instalable. Los plugins existentes pueden instalarse desde ClawHub, npm, git,
    directorios locales o archivos.

    [Instalar y configurar plugins](/es/tools/plugin) | [Crear plugins](/es/plugins/building-plugins) | [SDK de plugins](/es/plugins/sdk-overview)

  </Step>
</Steps>

## Categorías de herramientas integradas

La tabla enumera herramientas representativas para poder reconocer la superficie. No es
la referencia completa de políticas. Para consultar los grupos exactos, los valores predeterminados y la semántica de permisos y denegaciones,
utilice [Herramientas y proveedores personalizados](/es/gateway/config-tools).

| Categoría                    | Utilice esta categoría cuando el agente necesite...                                             | Herramientas representativas                                                                           | Consulte a continuación                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Ejecución                    | Ejecutar comandos, administrar procesos o utilizar análisis de Python respaldado por un proveedor | `exec`, `process`, `code_execution`                                                                    | [Exec](/es/tools/exec), [Ejecución de código](/es/tools/code-execution)                                 |
| Archivos                     | Leer y modificar archivos del espacio de trabajo                                                  | `read`, `write`, `edit`, `apply_patch`                                                                 | [Aplicar parche](/es/tools/apply-patch)                                                              |
| Web                          | Buscar en la web, buscar publicaciones de X u obtener contenido legible de páginas                | `web_search`, `x_search`, `web_fetch`                                                                  | [Herramientas web](/es/tools/web), [Obtención de contenido web](/es/tools/web-fetch)                     |
| Navegador                    | Operar una sesión del navegador                                                                  | `browser`                                                                                              | [Navegador](/es/tools/browser)                                                                       |
| Mensajería y canales         | Enviar respuestas o acciones de canal                                                             | `message`                                                                                              | [Envío del agente](/es/tools/agent-send)                                                              |
| Sesiones y agentes           | Inspeccionar sesiones, delegar trabajo, dirigir otra ejecución o informar del estado              | `sessions_*`, `subagents`, `agents_list`, `session_status`, `get_goal`, `create_goal`, `update_goal`   | [Objetivo](/es/tools/goal), [Subagentes](/es/tools/subagents), [Herramienta de sesión](/es/concepts/session-tool) |
| Automatización               | Programar trabajo o responder a eventos en segundo plano                                          | `cron`, `heartbeat_respond`                                                                            | [Automatización](/es/automation)                                                                     |
| Gateway y nodos              | Inspeccionar el estado del Gateway o los dispositivos de destino emparejados                      | `gateway`, `nodes`                                                                                     | [Configuración del Gateway](/es/gateway/configuration), [Nodos](/es/nodes)                               |
| Multimedia                   | Analizar, generar o reproducir contenido multimedia mediante voz                                  | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                   | [Descripción general de multimedia](/es/tools/media-overview)                                        |
| Catálogos amplios de OpenClaw | Buscar e invocar muchas herramientas aptas sin enviar cada esquema al modelo                     | `tool_search_code`, `tool_search`, `tool_describe`                                                     | [Búsqueda de herramientas](/es/tools/tool-search)                                                     |

<Note>
Búsqueda de herramientas es una superficie experimental para agentes de OpenClaw. Las ejecuciones del entorno Codex utilizan
el modo de código nativo de Codex, la búsqueda nativa de herramientas, herramientas dinámicas diferidas y
llamadas a herramientas anidadas en lugar de `tools.toolSearch`.
</Note>

## Herramientas proporcionadas por plugins

Los plugins pueden registrar herramientas adicionales. Los autores de plugins conectan las herramientas mediante
`api.registerTool(...)` y `contracts.tools` del manifiesto; utilice
[SDK de plugins](/es/plugins/sdk-overview) y [Manifiesto de plugins](/es/plugins/manifest)
para consultar los detalles del contrato.

Entre las herramientas comunes proporcionadas por plugins se incluyen:

- [Diferencias](/es/tools/diffs) para renderizar diferencias de archivos y Markdown
- [Mostrar widget](/tools/show-widget) para SVG y HTML autocontenidos en línea en el chat web
- [Tarea de LLM](/es/tools/llm-task) para pasos de flujo de trabajo que solo usan JSON
- [Lobster](/es/tools/lobster) para flujos de trabajo tipados con aprobaciones reanudables
- [Tokenjuice](/es/tools/tokenjuice) para compactar la salida ruidosa de las herramientas `exec` y `bash`
- [Búsqueda de herramientas](/es/tools/tool-search) para descubrir e invocar catálogos amplios de herramientas
  sin incluir todos los esquemas en el prompt
- [Canvas](/es/plugins/reference/canvas) para el control de Canvas del nodo y la renderización
  de A2UI

## Configure el acceso y las aprobaciones

La política de herramientas se aplica antes de la llamada al modelo. Si la política elimina una herramienta, el
modelo no recibe el esquema de esa herramienta durante el turno. Una ejecución puede perder herramientas
debido a la configuración global, la configuración por agente, la política del canal, las
restricciones del proveedor, las reglas del sandbox, la política del canal o del entorno de ejecución, o la disponibilidad de plugins.

- [Herramientas y proveedores personalizados](/es/gateway/config-tools) documenta los perfiles de herramientas,
  las listas de permisos y denegaciones, las restricciones específicas del proveedor, la detección de bucles y
  la configuración de herramientas respaldadas por proveedores.
- [Aprobaciones de Exec](/es/tools/exec-approvals) documenta la política de aprobación de comandos
  del host.
- [Exec elevado](/es/tools/elevated) documenta la ejecución controlada fuera del
  sandbox.
- [Sandbox frente a política de herramientas frente a modo elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated)
  explica qué capa controla el acceso a archivos y procesos.
- [Restricciones de sandbox y herramientas por agente](/es/tools/multi-agent-sandbox-tools)
  documenta las restricciones específicas del agente para ejecuciones delegadas.

## Amplíe las capacidades

Elija la vía de extensión según la tarea que OpenClaw deba realizar:

- Instale o administre un plugin existente con [Plugins](/es/tools/plugin).
- Cree una nueva integración, proveedor, canal, herramienta o hook con
  [Crear plugins](/es/plugins/building-plugins).
- Añada o ajuste instrucciones reutilizables para agentes con [Skills](/es/tools/skills) y
  [Creación de Skills](/es/tools/creating-skills).
- Utilice [SDK de plugins](/es/plugins/sdk-overview) y
  [Manifiesto de plugins](/es/plugins/manifest) cuando necesite contratos de
  implementación.

## Solucione problemas con herramientas ausentes

Si el modelo no puede ver o invocar una herramienta, comience por la política efectiva del
turno actual:

1. Compruebe el perfil activo, `tools.allow` y `tools.deny` en
   [Herramientas y proveedores personalizados](/es/gateway/config-tools).
2. Compruebe las restricciones específicas del proveedor en
   [Herramientas y proveedores personalizados](/es/gateway/config-tools) y confirme que el
   [proveedor de modelos](/es/concepts/model-providers) seleccionado admite la forma de la
   herramienta.
3. Compruebe los permisos del canal, el estado del sandbox y el acceso elevado con
   [Sandbox frente a política de herramientas frente a modo elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated)
   y [Exec elevado](/es/tools/elevated).
4. Compruebe si el plugin propietario está instalado y habilitado en
   [Plugins](/es/tools/plugin).
5. Para ejecuciones delegadas, compruebe las restricciones por agente en
   [Restricciones de sandbox y herramientas por agente](/es/tools/multi-agent-sandbox-tools).
6. Para catálogos amplios de OpenClaw, confirme si la ejecución utiliza la exposición directa de herramientas
   o la [Búsqueda de herramientas](/es/tools/tool-search).

## Contenido relacionado

- [Automatización](/es/automation) para cron, tareas, heartbeat, compromisos, hooks,
  órdenes permanentes y Task Flow
- [Agentes](/es/concepts/agent) para el modelo de agente, las sesiones, la memoria y
  la coordinación multiagente
- [Herramientas y proveedores personalizados](/es/gateway/config-tools) como referencia
  canónica de políticas de herramientas
- [Plugins](/es/tools/plugin) para la instalación y gestión de plugins
- [SDK de Plugin](/es/plugins/sdk-overview) como referencia para autores de plugins
- [Skills](/es/tools/skills) para el orden de carga, las restricciones y la configuración de Skills
- [Taller de Skills](/es/tools/skill-workshop) para la creación de Skills
  generadas y revisadas
- [Búsqueda de herramientas](/es/tools/tool-search) para descubrir de forma compacta
  el catálogo de herramientas de OpenClaw
