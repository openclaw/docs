---
read_when:
    - Quieres comprender qué herramientas ofrece OpenClaw
    - Debes configurar, permitir o denegar herramientas
    - Estás decidiendo entre herramientas integradas, Skills y plugins
summary: 'Descripción general de las herramientas y plugins de OpenClaw: qué puede hacer el agente y cómo extenderlo'
title: Herramientas y plugins
x-i18n:
    generated_at: "2026-04-30T06:05:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 62cde740188c224af03b4425c7f6dfca9a12f95603066db5925724fc6a07dcf0
    source_path: tools/index.md
    workflow: 16
---

Todo lo que el agente hace más allá de generar texto ocurre mediante **herramientas**.
Las herramientas son la forma en que el agente lee archivos, ejecuta comandos, navega por la web, envía
mensajes e interactúa con dispositivos.

## Herramientas, Skills y plugins

OpenClaw tiene tres capas que funcionan juntas:

<Steps>
  <Step title="Las herramientas son lo que invoca el agente">
    Una herramienta es una función tipada que el agente puede invocar (por ejemplo, `exec`, `browser`,
    `web_search`, `message`). OpenClaw incluye un conjunto de **herramientas integradas** y
    los plugins pueden registrar otras adicionales.

    El agente ve las herramientas como definiciones de funciones estructuradas enviadas a la API del modelo.

  </Step>

  <Step title="Las Skills enseñan al agente cuándo y cómo">
    Una skill es un archivo Markdown (`SKILL.md`) inyectado en el prompt del sistema.
    Las Skills dan al agente contexto, restricciones y orientación paso a paso para
    usar herramientas de forma eficaz. Las Skills viven en tu espacio de trabajo, en carpetas compartidas,
    o se incluyen dentro de plugins.

    [Referencia de Skills](/es/tools/skills) | [Crear Skills](/es/tools/creating-skills)

  </Step>

  <Step title="Los plugins empaquetan todo junto">
    Un plugin es un paquete que puede registrar cualquier combinación de capacidades:
    canales, proveedores de modelos, herramientas, Skills, voz, transcripción en tiempo real,
    voz en tiempo real, comprensión de medios, generación de imágenes, generación de video,
    obtención web, búsqueda web y más. Algunos plugins son **del núcleo** (incluidos con
    OpenClaw), otros son **externos** (publicados en npm por la comunidad).

    [Instalar y configurar plugins](/es/tools/plugin) | [Crear el tuyo](/es/plugins/building-plugins)

  </Step>
</Steps>

## Herramientas integradas

Estas herramientas se incluyen con OpenClaw y están disponibles sin instalar plugins:

| Herramienta                                | Qué hace                                                              | Página                                                       |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Ejecutar comandos de shell, gestionar procesos en segundo plano       | [Exec](/es/tools/exec), [Aprobaciones de Exec](/es/tools/exec-approvals) |
| `code_execution`                           | Ejecutar análisis remoto de Python en sandbox                         | [Ejecución de código](/es/tools/code-execution)                 |
| `browser`                                  | Controlar un navegador Chromium (navegar, hacer clic, captura de pantalla) | [Navegador](/es/tools/browser)                                  |
| `web_search` / `x_search` / `web_fetch`    | Buscar en la web, buscar publicaciones de X, obtener contenido de páginas | [Web](/es/tools/web), [Obtención web](/es/tools/web-fetch)         |
| `read` / `write` / `edit`                  | E/S de archivos en el espacio de trabajo                              |                                                              |
| `apply_patch`                              | Parches de archivo de varios hunks                                    | [Aplicar parche](/es/tools/apply-patch)                         |
| `message`                                  | Enviar mensajes por todos los canales                                 | [Envío del agente](/es/tools/agent-send)                        |
| `canvas`                                   | Controlar Canvas de Node (presentar, evaluar, instantánea)            |                                                              |
| `nodes`                                    | Descubrir y apuntar a dispositivos emparejados                        |                                                              |
| `cron` / `gateway`                         | Gestionar trabajos programados; inspeccionar, aplicar parches, reiniciar o actualizar el gateway |                                                              |
| `image` / `image_generate`                 | Analizar o generar imágenes                                           | [Generación de imágenes](/es/tools/image-generation)            |
| `music_generate`                           | Generar pistas musicales                                              | [Generación de música](/es/tools/music-generation)              |
| `video_generate`                           | Generar videos                                                        | [Generación de video](/es/tools/video-generation)               |
| `tts`                                      | Conversión puntual de texto a voz                                     | [TTS](/es/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Gestión de sesiones, estado y orquestación de subagentes              | [Subagentes](/es/tools/subagents)                               |
| `session_status`                           | Lectura ligera de estilo `/status` y sobrescritura del modelo de sesión | [Herramientas de sesión](/es/concepts/session-tool)             |

Para trabajos con imágenes, usa `image` para análisis e `image_generate` para generación o edición. Si apuntas a `openai/*`, `google/*`, `fal/*` u otro proveedor de imágenes no predeterminado, configura primero la autenticación/clave de API de ese proveedor.

Para trabajos con música, usa `music_generate`. Si apuntas a `google/*`, `minimax/*` u otro proveedor de música no predeterminado, configura primero la autenticación/clave de API de ese proveedor.

Para trabajos con video, usa `video_generate`. Si apuntas a `qwen/*` u otro proveedor de video no predeterminado, configura primero la autenticación/clave de API de ese proveedor.

Para la generación de audio impulsada por flujos de trabajo, usa `music_generate` cuando un plugin como
ComfyUI lo registre. Esto es independiente de `tts`, que es texto a voz.

`session_status` es la herramienta ligera de estado/lectura en el grupo de sesiones.
Responde preguntas de estilo `/status` sobre la sesión actual y puede
establecer opcionalmente una sobrescritura de modelo por sesión; `model=default` borra esa
sobrescritura. Al igual que `/status`, puede rellenar contadores dispersos de tokens/caché y la
etiqueta del modelo de tiempo de ejecución activo desde la entrada de uso más reciente de la transcripción.

`gateway` es la herramienta de tiempo de ejecución solo para el propietario para operaciones de gateway:

- `config.schema.lookup` para un subárbol de configuración con alcance de ruta antes de editar
- `config.get` para la instantánea de configuración actual + hash
- `config.patch` para actualizaciones parciales de configuración con reinicio
- `config.apply` solo para reemplazo de configuración completa
- `update.run` para autoactualización explícita + reinicio

Para cambios parciales, prefiere `config.schema.lookup` y luego `config.patch`. Usa
`config.apply` solo cuando reemplaces intencionalmente toda la configuración.
Para documentación más amplia sobre configuración, lee [Configuración](/es/gateway/configuration) y
[Referencia de configuración](/es/gateway/configuration-reference).
La herramienta también se niega a cambiar `tools.exec.ask` o `tools.exec.security`;
los alias heredados `tools.bash.*` se normalizan a las mismas rutas exec protegidas.

### Herramientas proporcionadas por plugins

Los plugins pueden registrar herramientas adicionales. Algunos ejemplos:

- [Diffs](/es/tools/diffs) — visor y renderizador de diffs
- [Tarea LLM](/es/tools/llm-task) — paso LLM solo JSON para salida estructurada
- [Lobster](/es/tools/lobster) — tiempo de ejecución de flujo de trabajo tipado con aprobaciones reanudables
- [Generación de música](/es/tools/music-generation) — herramienta compartida `music_generate` con proveedores respaldados por flujos de trabajo
- [OpenProse](/es/prose) — orquestación de flujos de trabajo centrada en Markdown
- [Tokenjuice](/es/tools/tokenjuice) — compactar resultados ruidosos de herramientas `exec` y `bash`

## Configuración de herramientas

### Listas de permitidos y denegados

Controla qué herramientas puede invocar el agente mediante `tools.allow` / `tools.deny` en la
configuración. Denegar siempre prevalece sobre permitir.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw falla de forma cerrada cuando una allowlist explícita no resuelve a ninguna herramienta invocable.
Por ejemplo, `tools.allow: ["query_db"]` solo funciona si un plugin cargado realmente
registra `query_db`. Si ninguna herramienta integrada, plugin o herramienta MCP incluida coincide con la
allowlist, la ejecución se detiene antes de la llamada al modelo en lugar de continuar como una
ejecución solo de texto que podría alucinar resultados de herramientas.

### Perfiles de herramientas

`tools.profile` establece una allowlist base antes de aplicar `allow`/`deny`.
Sobrescritura por agente: `agents.list[].tools.profile`.

| Perfil      | Qué incluye                                                                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Línea base sin restricciones para acceso más amplio de comando/control; igual que dejar `tools.profile` sin configurar                              |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Solo `session_status`                                                                                                                              |

<Note>
`tools.profile: "messaging"` es intencionalmente limitado para agentes centrados en canales.
Excluye herramientas más amplias de comando/control como sistema de archivos, tiempo de ejecución,
navegador, canvas, nodes, cron y control del gateway. Usa `tools.profile: "full"`
como línea base sin restricciones para acceso más amplio de comando/control, y luego recorta el
acceso con `tools.allow` / `tools.deny` cuando sea necesario.
</Note>

`coding` incluye herramientas web ligeras (`web_search`, `web_fetch`, `x_search`)
pero no la herramienta completa de control del navegador. La automatización del navegador puede controlar
sesiones reales y perfiles con sesión iniciada, así que añádela explícitamente con
`tools.alsoAllow: ["browser"]` o con
`agents.list[].tools.alsoAllow: ["browser"]` por agente.

Los perfiles `coding` y `messaging` también permiten herramientas MCP de paquete configuradas
bajo la clave de plugin `bundle-mcp`. Añade `tools.deny: ["bundle-mcp"]` cuando
quieras que un perfil conserve sus integradas normales pero oculte todas las herramientas MCP configuradas.
El perfil `minimal` no incluye herramientas MCP de paquete.

Ejemplo (superficie de herramientas más amplia de forma predeterminada):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### Grupos de herramientas

Usa abreviaturas `group:*` en listas de permitidos/denegados:

| Grupo              | Herramientas                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` se acepta como alias de `exec`)                                 |
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
| `group:openclaw`   | Todas las herramientas integradas de OpenClaw (excluye las herramientas de plugin)                                                       |

`sessions_history` devuelve una vista de recuperación acotada y filtrada por seguridad. Elimina
etiquetas de pensamiento, estructura auxiliar de `<relevant-memories>`, cargas XML
de llamadas a herramientas en texto plano (incluidos `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas),
estructura auxiliar degradada de llamadas a herramientas, tokens de control de modelo
ASCII/de ancho completo filtrados y XML de llamadas a herramientas MiniMax mal formado
del texto del asistente; luego aplica redacción/truncamiento y posibles marcadores de posición
para filas sobredimensionadas, en lugar de actuar como un volcado sin procesar de la transcripción.

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
