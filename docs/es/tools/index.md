---
read_when:
    - Quieres entender qué herramientas proporciona OpenClaw
    - Debe configurar, permitir o denegar herramientas
    - Estás decidiendo entre herramientas integradas, Skills y plugins
summary: 'Descripción general de herramientas y Plugins de OpenClaw: qué puede hacer el agente y cómo extenderlo'
title: Herramientas y plugins
x-i18n:
    generated_at: "2026-04-30T16:30:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7acfac11669b6f9696a368c08afada8d33e30ac2f452d507f5d1bc36bae367eb
    source_path: tools/index.md
    workflow: 16
---

Todo lo que el agente hace más allá de generar texto ocurre mediante **herramientas**.
Las herramientas son la forma en que el agente lee archivos, ejecuta comandos, navega por la web, envía
mensajes e interactúa con dispositivos.

## Herramientas, Skills y plugins

OpenClaw tiene tres capas que funcionan juntas:

<Steps>
  <Step title="Las herramientas son lo que llama el agente">
    Una herramienta es una función tipada que el agente puede invocar (por ejemplo, `exec`, `browser`,
    `web_search`, `message`). OpenClaw incluye un conjunto de **herramientas integradas** y
    los plugins pueden registrar otras adicionales.

    El agente ve las herramientas como definiciones de función estructuradas enviadas a la API del modelo.

  </Step>

  <Step title="Las Skills enseñan al agente cuándo y cómo">
    Una Skill es un archivo markdown (`SKILL.md`) inyectado en el prompt del sistema.
    Las Skills dan al agente contexto, restricciones y guía paso a paso para
    usar herramientas de forma eficaz. Las Skills viven en tu espacio de trabajo, en carpetas compartidas,
    o se incluyen dentro de plugins.

    [Referencia de Skills](/es/tools/skills) | [Crear Skills](/es/tools/creating-skills)

  </Step>

  <Step title="Los plugins empaquetan todo junto">
    Un plugin es un paquete que puede registrar cualquier combinación de capacidades:
    canales, proveedores de modelos, herramientas, Skills, voz, transcripción en tiempo real,
    voz en tiempo real, comprensión multimedia, generación de imágenes, generación de video,
    obtención web, búsqueda web y más. Algunos plugins son **core** (incluidos con
    OpenClaw), otros son **externos** (publicados en npm por la comunidad).

    [Instalar y configurar plugins](/es/tools/plugin) | [Construir el tuyo](/es/plugins/building-plugins)

  </Step>
</Steps>

## Herramientas integradas

Estas herramientas se incluyen con OpenClaw y están disponibles sin instalar ningún plugin:

| Herramienta                               | Qué hace                                                              | Página                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Ejecutar comandos de shell, gestionar procesos en segundo plano       | [Exec](/es/tools/exec), [Aprobaciones de Exec](/es/tools/exec-approvals) |
| `code_execution`                           | Ejecutar análisis remoto de Python en sandbox                         | [Ejecución de código](/es/tools/code-execution)                 |
| `browser`                                  | Controlar un navegador Chromium (navegar, hacer clic, capturar pantalla) | [Navegador](/es/tools/browser)                                  |
| `web_search` / `x_search` / `web_fetch`    | Buscar en la web, buscar publicaciones de X, obtener contenido de páginas | [Web](/es/tools/web), [Obtención web](/es/tools/web-fetch)         |
| `read` / `write` / `edit`                  | E/S de archivos en el espacio de trabajo                              |                                                              |
| `apply_patch`                              | Parches de archivo de varios hunks                                    | [Aplicar parche](/es/tools/apply-patch)                         |
| `message`                                  | Enviar mensajes en todos los canales                                  | [Envío del agente](/es/tools/agent-send)                        |
| `canvas`                                   | Controlar Node Canvas (presentar, evaluar, instantánea)               |                                                              |
| `nodes`                                    | Descubrir y orientar dispositivos emparejados                         |                                                              |
| `cron` / `gateway`                         | Gestionar trabajos programados; inspeccionar, parchear, reiniciar o actualizar el gateway |                                                              |
| `image` / `image_generate`                 | Analizar o generar imágenes                                           | [Generación de imágenes](/es/tools/image-generation)            |
| `music_generate`                           | Generar pistas musicales                                              | [Generación de música](/es/tools/music-generation)              |
| `video_generate`                           | Generar videos                                                        | [Generación de video](/es/tools/video-generation)               |
| `tts`                                      | Conversión puntual de texto a voz                                     | [TTS](/es/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Gestión de sesiones, estado y orquestación de subagentes              | [Subagentes](/es/tools/subagents)                               |
| `session_status`                           | Lectura ligera de estilo `/status` y anulación del modelo de sesión   | [Herramientas de sesión](/es/concepts/session-tool)             |

Para trabajo con imágenes, usa `image` para análisis e `image_generate` para generación o edición. Si apuntas a `openai/*`, `google/*`, `fal/*` u otro proveedor de imágenes no predeterminado, configura primero la autenticación/clave de API de ese proveedor.

Para trabajo con música, usa `music_generate`. Si apuntas a `google/*`, `minimax/*` u otro proveedor de música no predeterminado, configura primero la autenticación/clave de API de ese proveedor.

Para trabajo con video, usa `video_generate`. Si apuntas a `qwen/*` u otro proveedor de video no predeterminado, configura primero la autenticación/clave de API de ese proveedor.

Para generación de audio impulsada por flujos de trabajo, usa `music_generate` cuando un plugin como
ComfyUI lo registre. Esto es independiente de `tts`, que es texto a voz.

`session_status` es la herramienta ligera de estado/lectura del grupo de sesiones.
Responde preguntas de estilo `/status` sobre la sesión actual y puede
establecer opcionalmente una anulación de modelo por sesión; `model=default` borra esa
anulación. Igual que `/status`, puede rellenar contadores escasos de tokens/caché y la
etiqueta del modelo de runtime activo desde la entrada de uso de la transcripción más reciente.

`gateway` es la herramienta de runtime exclusiva del propietario para operaciones del gateway:

- `config.schema.lookup` para un subárbol de configuración con alcance de ruta antes de editar
- `config.get` para la instantánea de configuración actual + hash
- `config.patch` para actualizaciones parciales de configuración con reinicio
- `config.apply` solo para reemplazo de configuración completa
- `update.run` para autoactualización explícita + reinicio

Para cambios parciales, prefiere `config.schema.lookup` y luego `config.patch`. Usa
`config.apply` solo cuando reemplaces intencionalmente toda la configuración.
Para documentación de configuración más amplia, lee [Configuración](/es/gateway/configuration) y
[Referencia de configuración](/es/gateway/configuration-reference).
La herramienta también rechaza cambiar `tools.exec.ask` o `tools.exec.security`;
los alias heredados `tools.bash.*` se normalizan a las mismas rutas exec protegidas.

### Herramientas proporcionadas por plugins

Los plugins pueden registrar herramientas adicionales. Algunos ejemplos:

- [Diffs](/es/tools/diffs) — visor y renderizador de diferencias
- [Tarea LLM](/es/tools/llm-task) — paso LLM solo JSON para salida estructurada
- [Lobster](/es/tools/lobster) — runtime de flujos de trabajo tipado con aprobaciones reanudables
- [Generación de música](/es/tools/music-generation) — herramienta `music_generate` compartida con proveedores respaldados por flujos de trabajo
- [OpenProse](/es/prose) — orquestación de flujos de trabajo centrada en markdown
- [Tokenjuice](/es/tools/tokenjuice) — compacta resultados ruidosos de herramientas `exec` y `bash`

## Configuración de herramientas

### Listas de permiso y denegación

Controla qué herramientas puede llamar el agente mediante `tools.allow` / `tools.deny` en
la configuración. Denegar siempre prevalece sobre permitir.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw falla cerrado cuando una lista explícita de permitidos no resuelve ninguna herramienta invocable.
Por ejemplo, `tools.allow: ["query_db"]` solo funciona si un plugin cargado realmente
registra `query_db`. Si ninguna herramienta integrada, plugin o herramienta MCP incluida coincide con la
lista de permitidos, la ejecución se detiene antes de la llamada al modelo en lugar de continuar como una
ejecución solo de texto que podría alucinar resultados de herramientas.

### Perfiles de herramientas

`tools.profile` establece una lista base de permitidos antes de aplicar `allow`/`deny`.
Anulación por agente: `agents.list[].tools.profile`.

| Perfil      | Qué incluye                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Línea base sin restricciones para acceso más amplio a comandos/control; igual que dejar `tools.profile` sin configurar                              |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Solo `session_status`                                                                                                                             |

<Note>
`tools.profile: "messaging"` es intencionalmente limitado para agentes centrados en canales.
Excluye herramientas más amplias de comandos/control como sistema de archivos, runtime,
navegador, canvas, nodos, cron y control del gateway. Usa `tools.profile: "full"`
como la línea base sin restricciones para acceso más amplio a comandos/control, y luego recorta
el acceso con `tools.allow` / `tools.deny` cuando sea necesario.
</Note>

`coding` incluye herramientas web ligeras (`web_search`, `web_fetch`, `x_search`)
pero no la herramienta completa de control del navegador. La automatización del navegador puede controlar
sesiones reales y perfiles con sesión iniciada, así que agrégala explícitamente con
`tools.alsoAllow: ["browser"]` o con
`agents.list[].tools.alsoAllow: ["browser"]` por agente.

<Note>
Configurar `tools.exec` o `tools.fs` bajo un perfil restrictivo (`messaging`, `minimal`) no amplía implícitamente la lista de permitidos del perfil. Agrega entradas explícitas de `tools.alsoAllow` (por ejemplo `["exec", "process"]` para exec, o `["read", "write", "edit"]` para fs) cuando quieras que un perfil restrictivo use esas secciones configuradas. OpenClaw registra una advertencia de inicio cuando una sección de configuración está presente sin una concesión `alsoAllow` correspondiente.
</Note>

Los perfiles `coding` y `messaging` también permiten herramientas MCP de bundle configuradas
bajo la clave de plugin `bundle-mcp`. Agrega `tools.deny: ["bundle-mcp"]` cuando
quieras que un perfil mantenga sus herramientas integradas normales pero oculte todas las herramientas MCP configuradas.
El perfil `minimal` no incluye herramientas MCP de bundle.

Ejemplo (superficie de herramientas más amplia por defecto):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### Grupos de herramientas

Usa abreviaturas `group:*` en listas de permiso/denegación:

| Grupo              | Herramientas                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` se acepta como alias de `exec`)                                     |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | cron, gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Todas las herramientas integradas de OpenClaw (excluye las herramientas de Plugin)                        |

`sessions_history` devuelve una vista de recuperación acotada y filtrada por seguridad. Elimina
etiquetas de razonamiento, estructuras de soporte de `<relevant-memories>`, cargas útiles XML
de llamadas a herramientas en texto sin formato (incluidos `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas),
estructuras de soporte de llamadas a herramientas degradadas, tokens de control del modelo
filtrados en ASCII/ancho completo y XML de llamadas a herramientas MiniMax malformado del texto
del asistente; después aplica redacción/truncamiento y posibles marcadores de posición para filas
demasiado grandes, en lugar de actuar como un volcado de transcripción sin procesar.

### Restricciones específicas del proveedor

Usa `tools.byProvider` para restringir herramientas para proveedores específicos sin
cambiar los valores predeterminados globales:

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
