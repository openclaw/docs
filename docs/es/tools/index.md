---
doc-schema-version: 1
read_when:
    - Quieres conocer las herramientas que proporciona OpenClaw
    - Está decidiendo entre herramientas integradas, Skills y plugins
    - Necesita el punto de entrada adecuado de la documentación para las políticas de herramientas, la automatización o la coordinación de agentes.
summary: 'Descripción general de las herramientas, Skills y plugins de OpenClaw: qué pueden invocar los agentes y cómo ampliarlos'
title: Descripción general
x-i18n:
    generated_at: "2026-07-19T02:27:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5e23f9c2405766feb98db4d34baee41b73df002966a48525ba76c5f4b260f126
    source_path: tools/index.md
    workflow: 16
---

Usa esta página para elegir la superficie de Capacidades adecuada. Las **herramientas** son
acciones invocables, las **Skills** enseñan a los agentes cómo trabajar y los **plugins** añaden
capacidades de ejecución, como herramientas, proveedores, canales, hooks y
Skills empaquetadas.

Esta es una página de descripción general y orientación. Para consultar de forma exhaustiva la política de herramientas, los valores predeterminados,
la pertenencia a grupos, las restricciones de proveedores y los campos de configuración, usa
[Herramientas y proveedores personalizados](/es/gateway/config-tools).

## Empieza aquí

Para la mayoría de los agentes, empieza con las categorías de herramientas integradas y ajusta la política
solo cuando el agente deba ver menos herramientas o necesite acceso explícito al host.

| Si necesitas...                                      | Usa esto primero                                          | Después, consulta                                                                                                                                                             |
| ---------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Permitir que un agente actúe con capacidades existentes | [Herramientas integradas](#built-in-tool-categories)      | [Categorías de herramientas](#built-in-tool-categories)                                                                                                                       |
| Controlar qué puede invocar un agente                | [Política de herramientas](#configure-access-and-approvals) | [Herramientas y proveedores personalizados](/es/gateway/config-tools)                                                                                                            |
| Enseñar un flujo de trabajo a un agente              | [Skills](#choose-tools-skills-or-plugins)                 | [Skills](/es/tools/skills), [Creación de Skills](/es/tools/creating-skills), [Taller de Skills](/es/tools/skill-workshop) y [Autoaprendizaje](/es/tools/self-learning)                     |
| Añadir una nueva integración o superficie de ejecución | [Plugins](#extend-capabilities)                           | [Plugins](/es/tools/plugin) y [Crear plugins](/es/plugins/building-plugins)                                                                                                         |
| Ejecutar trabajo más tarde o en segundo plano        | [Automatización](/es/automation)                             | [Descripción general de la automatización](/es/automation)                                                                                                                       |
| Coordinar varios agentes o arneses                    | [Subagentes](/es/tools/subagents)                            | [Agentes ACP](/es/tools/acp-agents) y [Envío del agente](/es/tools/agent-send)                                                                                                      |
| Buscar en un catálogo grande de herramientas de OpenClaw | [Búsqueda de herramientas](/es/tools/tool-search)            | [Búsqueda de herramientas](/es/tools/tool-search)                                                                                                                                |
| Combinar varias herramientas en un programa compacto | [Modo de código](/tools/code-mode)                        | [Modo de código](/tools/code-mode)                                                                                                                                             |

## Elige herramientas, Skills o plugins

<Steps>
  <Step title="Usa una herramienta cuando el agente necesite actuar">
    Una herramienta es una función tipada que el agente puede invocar, como `exec`, `browser`,
    `web_search`, `message` o `image_generate`. Usa herramientas cuando el agente
    necesite leer datos, cambiar archivos, enviar mensajes, invocar a un proveedor u
    operar otro sistema. Las herramientas visibles se envían al modelo como definiciones
    de funciones estructuradas.

    El modelo solo ve las herramientas que superan el perfil activo, la política de permisos y denegaciones,
    las restricciones del proveedor, el estado del entorno aislado, los permisos del canal y
    la disponibilidad de los plugins.

  </Step>

  <Step title="Usa una Skill cuando el agente necesite instrucciones">
    Una Skill es un paquete de instrucciones `SKILL.md` que se carga en el prompt del agente. Usa
    una Skill cuando el agente ya tenga las herramientas que necesita, pero requiera un
    flujo de trabajo repetible, criterios de revisión, una secuencia de comandos o una
    restricción operativa.

    Las Skills pueden residir en un espacio de trabajo, un directorio compartido de Skills, una raíz
    administrada de Skills de OpenClaw o un paquete de plugin.

    [Skills](/es/tools/skills) | [Taller de Skills](/es/tools/skill-workshop) | [Autoaprendizaje](/es/tools/self-learning) | [Creación de Skills](/es/tools/creating-skills) | [Configuración de Skills](/es/tools/skills-config)

  </Step>

  <Step title="Usa un plugin cuando OpenClaw necesite una nueva capacidad">
    Un plugin puede añadir herramientas, Skills, canales, proveedores de modelos, voz,
    voz en tiempo real, generación multimedia, búsqueda web, obtención web, hooks y otras
    capacidades de ejecución. Usa un plugin cuando la capacidad incluya código,
    credenciales, hooks de ciclo de vida, metadatos de manifiesto o un
    paquete instalable. Los plugins existentes pueden instalarse desde ClawHub, npm, git,
    directorios locales o archivos comprimidos.

    [Instalar y configurar plugins](/es/tools/plugin) | [Crear plugins](/es/plugins/building-plugins) | [SDK de plugins](/es/plugins/sdk-overview)

  </Step>
</Steps>

## Categorías de herramientas integradas

La tabla enumera herramientas representativas para que puedas reconocer la superficie. No es
la referencia completa de políticas. Para consultar los grupos exactos, los valores predeterminados y la semántica
de permisos y denegaciones, usa [Herramientas y proveedores personalizados](/es/gateway/config-tools).

| Categoría                 | Úsala cuando el agente necesite...                                                        | Herramientas representativas                                                                          | Consulta después                                                                                                             |
| ------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Ejecución                 | Ejecutar comandos, gestionar procesos o usar análisis de Python respaldado por proveedores | `exec`, `process`, `terminal`, `code_execution`                       | [Exec](/es/tools/exec), [Terminal de la interfaz de control](/es/web/control-ui#operator-terminal), [Ejecución de código](/es/tools/code-execution) |
| Archivos                  | Leer y modificar archivos del espacio de trabajo                                          | `read`, `write`, `edit`, `apply_patch`                       | [Aplicar parche](/es/tools/apply-patch)                                                                                          |
| Intervención humana       | Pausar para solicitar una decisión estructurada que corresponde al usuario                | `ask_user`                                                                                    | [Preguntar al usuario](/tools/ask-user)                                                                                       |
| Web                       | Buscar en la web, buscar publicaciones de X u obtener contenido legible de páginas         | `web_search`, `x_search`, `web_fetch`                                           | [Herramientas web](/es/tools/web), [Obtención web](/es/tools/web-fetch)                                                             |
| Navegador                 | Operar una sesión de navegador                                                             | `browser`                                                                                    | [Navegador](/es/tools/browser)                                                                                                   |
| Interfaz del operador     | Organizar paneles, secciones y navegación conectados de la interfaz de control             | `screen`                                                                                    | [Pantalla](/tools/screen)                                                                                                     |
| Mensajería y canales      | Enviar respuestas o acciones de canal                                                      | `message`                                                                                    | [Envío del agente](/es/tools/agent-send)                                                                                         |
| Sesiones y agentes        | Inspeccionar sesiones, delegar trabajo, dirigir otra ejecución o informar del estado       | `sessions_*`, `subagents`, `agents_list`, `session_status`, `get_goal`, `create_goal`, `update_goal` | [Objetivo](/es/tools/goal), [Subagentes](/es/tools/subagents), [Herramienta de sesión](/es/concepts/session-tool)                      |
| Automatización            | Programar trabajo o responder a eventos en segundo plano                                  | `cron`, `heartbeat_respond`                                                               | [Automatización](/es/automation)                                                                                                 |
| Gateway y nodos           | Inspeccionar el estado del Gateway o los dispositivos de destino emparejados               | `gateway`, `nodes`                                                               | [Configuración del Gateway](/es/gateway/configuration), [Nodos](/es/nodes)                                                          |
| Multimedia                | Analizar, generar o reproducir por voz contenido multimedia                                | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`  | [Descripción general de multimedia](/es/tools/media-overview)                                                                   |
| Catálogos grandes de OpenClaw | Buscar, invocar y combinar muchas herramientas aptas sin enviar cada esquema al modelo  | `exec`, `wait`, `tool_search_code`, `tool_search`, `tool_describe`  | [Modo de código](/tools/code-mode), [Búsqueda de herramientas](/es/tools/tool-search)                                            |

<Note>
El Modo de código y la Búsqueda de herramientas son superficies experimentales para agentes de OpenClaw. Las ejecuciones del
arnés de Codex usan el modo de código nativo de Codex, la búsqueda nativa de herramientas, herramientas dinámicas
diferidas e invocaciones de herramientas anidadas en lugar de `tools.codeMode` o `tools.toolSearch`.
</Note>

## Herramientas proporcionadas por plugins

Los plugins pueden registrar herramientas adicionales. Los autores de plugins conectan las herramientas mediante
`api.registerTool(...)` y `contracts.tools` del manifiesto; consulta
[SDK de plugins](/es/plugins/sdk-overview) y [Manifiesto de plugins](/es/plugins/manifest)
para obtener información detallada del contrato.

Entre las herramientas que suelen proporcionar los plugins se incluyen:

- [Diferencias](/es/tools/diffs) para representar diferencias de archivos y Markdown
- [Mostrar widget](/es/tools/show-widget) para SVG y HTML autocontenidos en línea en clientes de chat compatibles
- [Pantalla](/tools/screen) para organizar una interfaz de control conectada
- [Tarea de LLM](/es/tools/llm-task) para pasos de flujo de trabajo exclusivamente en JSON
- [Lobster](/es/tools/lobster) para flujos de trabajo tipados con aprobaciones reanudables
- [Tokenjuice](/es/tools/tokenjuice) para compactar la salida ruidosa de las herramientas `exec` y `bash`
- [Búsqueda de herramientas](/es/tools/tool-search) para descubrir e invocar catálogos grandes
  de herramientas sin incluir todos los esquemas en el prompt
- [Lienzo](/es/plugins/reference/canvas) para el control de Canvas del nodo y la
  representación A2UI

## Configura el acceso y las aprobaciones

La política de herramientas se aplica antes de la invocación al modelo. Si la política elimina una herramienta, el
modelo no recibe el esquema de esa herramienta durante el turno. Una ejecución puede perder herramientas
debido a la configuración global, la configuración por agente, la política del canal, las restricciones del
proveedor, las reglas del entorno aislado, la política del canal o de ejecución, o la disponibilidad de los plugins.

- [Herramientas y proveedores personalizados](/es/gateway/config-tools) documenta los perfiles de herramientas,
  las listas de permitidos y denegados, las restricciones específicas de proveedores, la detección de bucles y
  la configuración de herramientas respaldadas por proveedores.
- [Aprobaciones de ejecución](/es/tools/exec-approvals) documenta la política de aprobación
  de comandos del host.
- [Ejecución con privilegios elevados](/es/tools/elevated) documenta la ejecución controlada fuera del
  entorno aislado.
- [Entorno aislado frente a política de herramientas frente a privilegios elevados](/es/gateway/sandbox-vs-tool-policy-vs-elevated)
  explica qué capa controla el acceso a archivos y procesos.
- [Restricciones de entorno aislado y herramientas por agente](/es/tools/multi-agent-sandbox-tools)
  documenta las restricciones específicas de cada agente para las ejecuciones delegadas.

## Ampliar las capacidades

Elija la vía de extensión según la tarea que necesite que OpenClaw realice:

- Instale o administre un Plugin existente con [Plugins](/es/tools/plugin).
- Cree una nueva integración, proveedor, canal, herramienta o enlace con
  [Crear plugins](/es/plugins/building-plugins).
- Añada o ajuste instrucciones reutilizables para agentes con [Skills](/es/tools/skills) y
  [Crear skills](/es/tools/creating-skills).
- Use el [SDK de plugins](/es/plugins/sdk-overview) y el
  [manifiesto de plugins](/es/plugins/manifest) cuando necesite contratos de
  implementación.

## Solucionar problemas de herramientas ausentes

Si el modelo no puede ver o invocar una herramienta, comience por la política efectiva para
el turno actual:

1. Compruebe el perfil activo, `tools.allow` y `tools.deny` en
   [Herramientas y proveedores personalizados](/es/gateway/config-tools).
2. Compruebe las restricciones específicas del proveedor en
   [Herramientas y proveedores personalizados](/es/gateway/config-tools) y confirme que el
   [proveedor del modelo](/es/concepts/model-providers) seleccionado admite la estructura de la
   herramienta.
3. Compruebe los permisos del canal, el estado del entorno aislado y el acceso con privilegios elevados mediante
   [Entorno aislado frente a política de herramientas frente a privilegios elevados](/es/gateway/sandbox-vs-tool-policy-vs-elevated)
   y [Ejecución con privilegios elevados](/es/tools/elevated).
4. Compruebe si el Plugin propietario está instalado y habilitado en
   [Plugins](/es/tools/plugin).
5. Para las ejecuciones delegadas, compruebe las restricciones por agente en
   [Restricciones de entorno aislado y herramientas por agente](/es/tools/multi-agent-sandbox-tools).
6. Para catálogos grandes de OpenClaw, confirme si la ejecución utiliza la exposición directa de
   herramientas, el [modo de código](/tools/code-mode) o la [búsqueda de herramientas](/es/tools/tool-search).

## Contenido relacionado

- [Automatización](/es/automation) para Cron, tareas, Heartbeat, compromisos, enlaces,
  órdenes permanentes y flujo de tareas
- [Agentes](/es/concepts/agent) para el modelo de agentes, las sesiones, la memoria y
  la coordinación multiagente
- [Herramientas y proveedores personalizados](/es/gateway/config-tools) como referencia canónica de la
  política de herramientas
- [Plugins](/es/tools/plugin) para la instalación y administración de plugins
- [SDK de plugins](/es/plugins/sdk-overview) como referencia para autores de plugins
- [Skills](/es/tools/skills) para el orden de carga, las restricciones y la configuración de skills
- [Taller de skills](/es/tools/skill-workshop) para la creación de skills generadas y
  revisadas
- [Búsqueda de herramientas](/es/tools/tool-search) para descubrir de forma compacta el catálogo de herramientas de
  OpenClaw
- [Modo de código](/tools/code-mode) para flujos de trabajo compactos de JavaScript o TypeScript
  sobre un catálogo oculto de herramientas de OpenClaw
