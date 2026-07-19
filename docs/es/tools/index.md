---
doc-schema-version: 1
read_when:
    - Quieres entender qué herramientas proporciona OpenClaw
    - Está decidiendo entre herramientas integradas, Skills y plugins
    - Necesita el punto de entrada adecuado de la documentación para las políticas de herramientas, la automatización o la coordinación de agentes
summary: 'Descripción general de las herramientas, Skills y plugins de OpenClaw: qué pueden invocar los agentes y cómo ampliarlos'
title: Descripción general
x-i18n:
    generated_at: "2026-07-19T13:39:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cdfb6d012d0e78325b7ee93b9c0b8a82b93315360860426e2c029207f6bf9279
    source_path: tools/index.md
    workflow: 16
---

Usa esta página para elegir la superficie de capacidades adecuada. Las **herramientas** son
acciones invocables, las **Skills** enseñan a los agentes cómo trabajar y los **plugins** añaden
capacidades de ejecución como herramientas, proveedores, canales, hooks y Skills
empaquetadas.

Esta es una página de descripción general y orientación. Para consultar de forma exhaustiva la política de herramientas, los valores predeterminados,
la pertenencia a grupos, las restricciones de proveedores y los campos de configuración, usa
[Herramientas y proveedores personalizados](/es/gateway/config-tools).

## Empieza aquí

Para la mayoría de los agentes, empieza por las categorías de herramientas integradas y, después, ajusta la política
solo cuando el agente deba ver menos herramientas o necesite acceso explícito al host.

| Si necesitas...                                         | Usa primero esto                                      | Después, consulta                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Permitir que un agente actúe con las capacidades existentes | [Herramientas integradas](#built-in-tool-categories) | [Categorías de herramientas](#built-in-tool-categories)                                                                                                     |
| Controlar qué puede invocar un agente                   | [Política de herramientas](#configure-access-and-approvals) | [Herramientas y proveedores personalizados](/es/gateway/config-tools)                                                                                          |
| Enseñar un flujo de trabajo a un agente                 | [Skills](#choose-tools-skills-or-plugins)             | [Skills](/es/tools/skills), [Creación de Skills](/es/tools/creating-skills), [Taller de Skills](/es/tools/skill-workshop) y [Autoaprendizaje](/es/tools/self-learning) |
| Añadir una nueva integración o superficie de ejecución  | [Plugins](#extend-capabilities)                       | [Plugins](/es/tools/plugin) y [Crear plugins](/es/plugins/building-plugins)                                                                                       |
| Ejecutar trabajo más tarde o en segundo plano           | [Automatización](/es/automation)                         | [Descripción general de la automatización](/es/automation)                                                                                                     |
| Coordinar varios agentes o entornos de ejecución        | [Subagentes](/es/tools/subagents)                        | [Agentes ACP](/es/tools/acp-agents) y [Envío del agente](/es/tools/agent-send)                                                                                    |
| Orquestar agentes simultáneos desde código              | [Enjambre](/tools/swarm)                              | [Modo de código](/es/tools/code-mode) y [Subagentes](/es/tools/subagents)                                                                                         |
| Buscar en un catálogo grande de herramientas de OpenClaw | [Búsqueda de herramientas](/es/tools/tool-search)       | [Búsqueda de herramientas](/es/tools/tool-search)                                                                                                              |
| Combinar varias herramientas en un programa compacto    | [Modo de código](/es/tools/code-mode)                    | [Modo de código](/es/tools/code-mode)                                                                                                                          |

## Elige entre herramientas, Skills o plugins

<Steps>
  <Step title="Usa una herramienta cuando el agente necesite actuar">
    Una herramienta es una función tipada que el agente puede invocar, como `exec`, `browser`,
    `web_search`, `message` o `image_generate`. Usa herramientas cuando el agente
    necesite leer datos, modificar archivos, enviar mensajes, invocar un proveedor u
    operar otro sistema. Las herramientas visibles se envían al modelo como definiciones
    de funciones estructuradas.

    El modelo solo ve las herramientas que superan el perfil activo, la política de
    permisos y denegaciones, las restricciones del proveedor, el estado del entorno aislado, los permisos del canal y
    la disponibilidad de los plugins.

  </Step>

  <Step title="Usa una Skill cuando el agente necesite instrucciones">
    Una Skill es un paquete de instrucciones `SKILL.md` que se carga en el prompt del agente. Usa
    una Skill cuando el agente ya tenga las herramientas que necesita, pero requiera un
    flujo de trabajo repetible, criterios de revisión, una secuencia de comandos o una
    restricción operativa.

    Las Skills pueden residir en un espacio de trabajo, un directorio compartido de Skills, la raíz administrada de
    Skills de OpenClaw o el paquete de un plugin.

    [Skills](/es/tools/skills) | [Taller de Skills](/es/tools/skill-workshop) | [Autoaprendizaje](/es/tools/self-learning) | [Creación de Skills](/es/tools/creating-skills) | [Configuración de Skills](/es/tools/skills-config)

  </Step>

  <Step title="Usa un plugin cuando OpenClaw necesite una nueva capacidad">
    Un plugin puede añadir herramientas, Skills, canales, proveedores de modelos, voz,
    voz en tiempo real, generación de contenido multimedia, búsqueda web, obtención de contenido web, hooks y otras
    capacidades de ejecución. Usa un plugin cuando la capacidad incluya código,
    credenciales, hooks del ciclo de vida, metadatos del manifiesto o
    un paquete instalable. Los plugins existentes se pueden instalar desde ClawHub, npm, git,
    directorios locales o archivos comprimidos.

    [Instalar y configurar plugins](/es/tools/plugin) | [Crear plugins](/es/plugins/building-plugins) | [SDK de plugins](/es/plugins/sdk-overview)

  </Step>
</Steps>

## Categorías de herramientas integradas

La tabla enumera herramientas representativas para que puedas reconocer la superficie. No es
la referencia completa de políticas. Para consultar los grupos exactos, los valores predeterminados y la semántica de permisos y
denegaciones, usa [Herramientas y proveedores personalizados](/es/gateway/config-tools).

| Categoría                    | Úsala cuando el agente necesite...                                                                    | Herramientas representativas                                                                                          | Consulta a continuación                                                                                                        |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Ejecución                    | Ejecutar comandos, gestionar procesos o usar análisis de Python respaldado por un proveedor           | `exec`, `process`, `terminal`, `code_execution`                                                                     | [Ejecución](/es/tools/exec), [Terminal de Control UI](/es/web/control-ui#operator-terminal), [Ejecución de código](/es/tools/code-execution) |
| Archivos                     | Leer y modificar archivos del espacio de trabajo                                                     | `read`, `write`, `edit`, `apply_patch`                                                                              | [Aplicar parche](/es/tools/apply-patch)                                                                                           |
| Intervención humana          | Pausar para que el usuario tome una decisión estructurada                                            | `ask_user`                                                                                                          | [Preguntar al usuario](/es/tools/ask-user)                                                                                        |
| Web                          | Buscar en la web, buscar publicaciones de X u obtener el contenido legible de una página             | `web_search`, `x_search`, `web_fetch`                                                                               | [Herramientas web](/es/tools/web), [Obtención de contenido web](/es/tools/web-fetch)                                                  |
| Navegador                    | Operar una sesión del navegador                                                                      | `browser`                                                                                                           | [Navegador](/es/tools/browser)                                                                                                    |
| Interfaz del operador        | Organizar paneles, secciones y navegación conectados de Control UI                                    | `screen`                                                                                                            | [Pantalla](/es/tools/screen)                                                                                                      |
| Mensajería y canales         | Enviar respuestas o acciones de canal                                                                | `message`                                                                                                           | [Envío del agente](/es/tools/agent-send)                                                                                          |
| Sesiones y agentes           | Inspeccionar sesiones, delegar trabajo, orquestar recopiladores, dirigir otra ejecución o informar del estado | `sessions_*`, `agents_wait`, `subagents`, `agents_list`, `session_status`, `get_goal`, `create_goal`, `update_goal` | [Objetivo](/es/tools/goal), [Enjambre](/tools/swarm), [Subagentes](/es/tools/subagents), [Herramienta de sesión](/es/concepts/session-tool) |
| Automatización               | Programar trabajo o responder a eventos en segundo plano                                             | `cron`, `heartbeat_respond`                                                                                         | [Automatización](/es/automation)                                                                                                  |
| Gateway y nodos              | Inspeccionar el estado del Gateway o los dispositivos de destino vinculados                          | `gateway`, `nodes`                                                                                                  | [Configuración del Gateway](/es/gateway/configuration), [Nodos](/es/nodes)                                                           |
| Contenido multimedia         | Analizar, generar o reproducir contenido multimedia mediante voz                                     | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                | [Descripción general del contenido multimedia](/es/tools/media-overview)                                                         |
| Catálogos grandes de OpenClaw | Buscar, invocar y combinar muchas herramientas aptas sin enviar todos los esquemas al modelo         | `exec`, `wait`, `tool_search_code`, `tool_search`, `tool_describe`                                                  | [Modo de código](/es/tools/code-mode), [Búsqueda de herramientas](/es/tools/tool-search)                                             |

<Note>
El Modo de código y la Búsqueda de herramientas son superficies experimentales para agentes de OpenClaw. Las ejecuciones del
entorno de Codex usan el modo de código nativo de Codex, la búsqueda de herramientas nativa, herramientas dinámicas
diferidas y llamadas anidadas a herramientas en lugar de `tools.codeMode` o `tools.toolSearch`.
</Note>

## Herramientas proporcionadas por plugins

Los plugins pueden registrar herramientas adicionales. Los autores de plugins conectan las herramientas mediante
`api.registerTool(...)` y el campo `contracts.tools` del manifiesto; consulta
[SDK de plugins](/es/plugins/sdk-overview) y [Manifiesto de plugins](/es/plugins/manifest)
para obtener información detallada sobre el contrato.

Entre las herramientas proporcionadas habitualmente por plugins se incluyen:

- [Diffs](/es/tools/diffs) para renderizar diferencias de archivos y Markdown
- [Mostrar widget](/es/tools/show-widget) para SVG y HTML autocontenidos en línea en clientes de chat compatibles
- [Pantalla](/es/tools/screen) para organizar una interfaz de control conectada
- [Tarea de LLM](/es/tools/llm-task) para pasos de flujos de trabajo que solo usan JSON
- [Lobster](/es/tools/lobster) para flujos de trabajo tipados con aprobaciones reanudables
- [Tokenjuice](/es/tools/tokenjuice) para compactar la salida ruidosa de la herramienta
  `exec` y `bash`
- [Búsqueda de herramientas](/es/tools/tool-search) para descubrir y llamar a grandes
  catálogos de herramientas sin incluir cada esquema en el prompt
- [Canvas](/es/plugins/reference/canvas) para el control de Canvas de nodos y la
  renderización de A2UI

## Configurar el acceso y las aprobaciones

La política de herramientas se aplica antes de la llamada al modelo. Si la política elimina una herramienta, el
modelo no recibe el esquema de esa herramienta durante el turno. Una ejecución puede perder herramientas
debido a la configuración global, la configuración por agente, la política del canal, las
restricciones del proveedor, las reglas del sandbox, la política del canal o del entorno de ejecución, o la disponibilidad de plugins.

- [Herramientas y proveedores personalizados](/es/gateway/config-tools) documenta los perfiles de herramientas,
  las listas de permitidos y denegados, las restricciones específicas del proveedor, la detección de bucles y
  la configuración de herramientas respaldadas por proveedores.
- [Aprobaciones de ejecución](/es/tools/exec-approvals) documenta la política de aprobación
  de comandos del host.
- [Ejecución elevada](/es/tools/elevated) documenta la ejecución controlada fuera del
  sandbox.
- [Sandbox frente a política de herramientas frente a ejecución elevada](/es/gateway/sandbox-vs-tool-policy-vs-elevated)
  explica qué capa controla el acceso a archivos y procesos.
- [Restricciones de sandbox y herramientas por agente](/es/tools/multi-agent-sandbox-tools)
  documenta las restricciones específicas de cada agente para las ejecuciones delegadas.

## Ampliar las capacidades

Elija la vía de extensión según la tarea que necesite que OpenClaw realice:

- Instale o gestione un plugin existente con [Plugins](/es/tools/plugin).
- Cree una nueva integración, proveedor, canal, herramienta o hook con
  [Crear plugins](/es/plugins/building-plugins).
- Añada o ajuste instrucciones reutilizables para agentes con [Skills](/es/tools/skills) y
  [Creación de skills](/es/tools/creating-skills).
- Use el [SDK de plugins](/es/plugins/sdk-overview) y el
  [manifiesto de plugins](/es/plugins/manifest) cuando necesite contratos de
  implementación.

## Solucionar problemas de herramientas ausentes

Si el modelo no puede ver o llamar a una herramienta, comience por la política efectiva del
turno actual:

1. Compruebe el perfil activo, `tools.allow` y `tools.deny` en
   [Herramientas y proveedores personalizados](/es/gateway/config-tools).
2. Compruebe las restricciones específicas del proveedor en
   [Herramientas y proveedores personalizados](/es/gateway/config-tools) y confirme que el
   [proveedor del modelo](/es/concepts/model-providers) seleccionado admite la estructura de la
   herramienta.
3. Compruebe los permisos del canal, el estado del sandbox y el acceso elevado con
   [Sandbox frente a política de herramientas frente a ejecución elevada](/es/gateway/sandbox-vs-tool-policy-vs-elevated)
   y [Ejecución elevada](/es/tools/elevated).
4. Compruebe si el plugin propietario está instalado y habilitado en
   [Plugins](/es/tools/plugin).
5. Para las ejecuciones delegadas, compruebe las restricciones por agente en
   [Restricciones de sandbox y herramientas por agente](/es/tools/multi-agent-sandbox-tools).
6. Para catálogos grandes de OpenClaw, confirme si la ejecución utiliza la exposición directa de
   herramientas, el [modo de código](/es/tools/code-mode) o la [búsqueda de herramientas](/es/tools/tool-search).

## Contenido relacionado

- [Automatización](/es/automation) para cron, tareas, heartbeat, compromisos, hooks,
  órdenes permanentes y flujo de tareas
- [Agentes](/es/concepts/agent) para el modelo de agentes, las sesiones, la memoria y la
  coordinación multiagente
- [Herramientas y proveedores personalizados](/es/gateway/config-tools) como referencia canónica de la
  política de herramientas
- [Plugins](/es/tools/plugin) para la instalación y gestión de plugins
- [SDK de plugins](/es/plugins/sdk-overview) como referencia para autores de plugins
- [Skills](/es/tools/skills) para el orden de carga, las restricciones y la configuración de skills
- [Taller de skills](/es/tools/skill-workshop) para la creación de skills generadas y
  revisadas
- [Búsqueda de herramientas](/es/tools/tool-search) para descubrir de forma compacta el catálogo de
  herramientas de OpenClaw
- [Modo de código](/es/tools/code-mode) para flujos de trabajo compactos de JavaScript o TypeScript
  sobre un catálogo oculto de herramientas de OpenClaw
- [Enjambre](/tools/swarm) para la distribución y recopilación estructuradas desde el modo de código
