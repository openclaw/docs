---
read_when:
    - Quieres entender qué herramientas ofrece OpenClaw
    - Necesitas configurar, permitir o denegar herramientas
    - Estás decidiendo entre herramientas integradas, Skills y Plugins
summary: 'Resumen de herramientas y plugins de OpenClaw: qué puede hacer el agente y cómo ampliarlo'
title: Herramientas y plugins
x-i18n:
    generated_at: "2026-04-25T18:22:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 72f1257f5e556b57238f9a0ff01574510f310250cf6da73c74f9f2421fa2c917
    source_path: tools/index.md
    workflow: 15
---

Todo lo que el agente hace más allá de generar texto ocurre a través de **herramientas**.
Las herramientas son la forma en que el agente lee archivos, ejecuta comandos, navega por la web, envía
mensajes e interactúa con dispositivos.

## Herramientas, Skills y Plugins

OpenClaw tiene tres capas que trabajan juntas:

<Steps>
  <Step title="Las herramientas son lo que llama el agente">
    Una herramienta es una función tipada que el agente puede invocar (por ejemplo `exec`, `browser`,
    `web_search`, `message`). OpenClaw incluye un conjunto de **herramientas integradas** y
    los plugins pueden registrar otras adicionales.

    El agente ve las herramientas como definiciones de funciones estructuradas enviadas a la API del modelo.

  </Step>

  <Step title="Las Skills enseñan al agente cuándo y cómo">
    Una skill es un archivo Markdown (`SKILL.md`) inyectado en el prompt del sistema.
    Las Skills proporcionan al agente contexto, restricciones y orientación paso a paso para
    usar herramientas de forma eficaz. Las Skills viven en tu espacio de trabajo, en carpetas compartidas,
    o se incluyen dentro de plugins.

    [Referencia de Skills](/es/tools/skills) | [Creación de Skills](/es/tools/creating-skills)

  </Step>

  <Step title="Los plugins empaquetan todo junto">
    Un plugin es un paquete que puede registrar cualquier combinación de capacidades:
    canales, proveedores de modelos, herramientas, Skills, voz, transcripción en tiempo real,
    voz en tiempo real, comprensión de medios, generación de imágenes, generación de video,
    obtención web, búsqueda web y más. Algunos plugins son **core** (incluidos con
    OpenClaw), otros son **externos** (publicados en npm por la comunidad).

    [Instalar y configurar plugins](/es/tools/plugin) | [Crea el tuyo](/es/plugins/building-plugins)

  </Step>
</Steps>

## Herramientas integradas

Estas herramientas se incluyen con OpenClaw y están disponibles sin instalar ningún plugin:

| Herramienta                               | Qué hace                                                              | Página                                                       |
| ----------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                        | Ejecutar comandos de shell, gestionar procesos en segundo plano       | [Exec](/es/tools/exec), [Aprobaciones de Exec](/es/tools/exec-approvals) |
| `code_execution`                          | Ejecutar análisis remoto de Python en sandbox                         | [Ejecución de código](/es/tools/code-execution)                 |
| `browser`                                 | Controlar un navegador Chromium (navegar, hacer clic, captura de pantalla) | [Browser](/es/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`   | Buscar en la web, buscar publicaciones de X, obtener contenido de páginas | [Web](/es/tools/web), [Web Fetch](/es/tools/web-fetch)             |
| `read` / `write` / `edit`                 | E/S de archivos en el espacio de trabajo                              |                                                              |
| `apply_patch`                             | Parches de archivo con varios bloques                                 | [Apply Patch](/es/tools/apply-patch)                            |
| `message`                                 | Enviar mensajes a través de todos los canales                         | [Envío de agentes](/es/tools/agent-send)                        |
| `canvas`                                  | Controlar Canvas de Node (presentar, evaluar, capturar)               |                                                              |
| `nodes`                                   | Descubrir y seleccionar dispositivos emparejados                      |                                                              |
| `cron` / `gateway`                        | Gestionar trabajos programados; inspeccionar, parchear, reiniciar o actualizar el gateway |                                                              |
| `image` / `image_generate`                | Analizar o generar imágenes                                           | [Generación de imágenes](/es/tools/image-generation)            |
| `music_generate`                          | Generar pistas musicales                                              | [Generación de música](/es/tools/music-generation)              |
| `video_generate`                          | Generar videos                                                        | [Generación de video](/es/tools/video-generation)               |
| `tts`                                     | Conversión puntual de texto a voz                                     | [TTS](/es/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list`| Gestión de sesiones, estado y orquestación de subagentes              | [Subagentes](/es/tools/subagents)                               |
| `session_status`                          | Lectura ligera estilo `/status` y anulación del modelo de sesión      | [Herramientas de sesión](/es/concepts/session-tool)             |

Para trabajo con imágenes, usa `image` para análisis y `image_generate` para generación o edición. Si apuntas a `openai/*`, `google/*`, `fal/*` u otro proveedor de imágenes no predeterminado, configura primero la autenticación/clave API de ese proveedor.

Para trabajo musical, usa `music_generate`. Si apuntas a `google/*`, `minimax/*` u otro proveedor de música no predeterminado, configura primero la autenticación/clave API de ese proveedor.

Para trabajo con video, usa `video_generate`. Si apuntas a `qwen/*` u otro proveedor de video no predeterminado, configura primero la autenticación/clave API de ese proveedor.

Para generación de audio impulsada por flujos de trabajo, usa `music_generate` cuando un plugin como
ComfyUI lo registre. Esto es independiente de `tts`, que es texto a voz.

`session_status` es la herramienta ligera de estado/lectura del grupo de sesiones.
Responde preguntas estilo `/status` sobre la sesión actual y puede
establecer opcionalmente una anulación de modelo por sesión; `model=default` borra esa
anulación. Igual que `/status`, puede completar contadores dispersos de tokens/caché y la
etiqueta del modelo de runtime activo desde la entrada de uso más reciente de la transcripción.

`gateway` es la herramienta de runtime exclusiva del propietario para operaciones del gateway:

- `config.schema.lookup` para un subárbol de configuración acotado a una ruta antes de editar
- `config.get` para la instantánea actual de configuración + hash
- `config.patch` para actualizaciones parciales de configuración con reinicio
- `config.apply` solo para reemplazo de configuración completa
- `update.run` para autoactualización explícita + reinicio

Para cambios parciales, prefiere `config.schema.lookup` y luego `config.patch`. Usa
`config.apply` solo cuando pretendas reemplazar toda la configuración.
La herramienta también rechaza cambiar `tools.exec.ask` o `tools.exec.security`;
los alias heredados `tools.bash.*` se normalizan a las mismas rutas protegidas de exec.

### Herramientas proporcionadas por plugins

Los plugins pueden registrar herramientas adicionales. Algunos ejemplos:

- [Diffs](/es/tools/diffs) — visor y renderizador de diferencias
- [LLM Task](/es/tools/llm-task) — paso de LLM solo JSON para salida estructurada
- [Lobster](/es/tools/lobster) — runtime de flujo de trabajo tipado con aprobaciones reanudables
- [Generación de música](/es/tools/music-generation) — herramienta compartida `music_generate` con proveedores respaldados por flujos de trabajo
- [OpenProse](/es/prose) — orquestación de flujos de trabajo orientada a Markdown
- [Tokenjuice](/es/tools/tokenjuice) — compacta resultados ruidosos de herramientas `exec` y `bash`

## Configuración de herramientas

### Listas de permitidas y denegadas

Controla qué herramientas puede llamar el agente mediante `tools.allow` / `tools.deny` en la
configuración. La denegación siempre prevalece sobre la permisión.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw falla en modo cerrado cuando una lista explícita de permitidas se resuelve sin herramientas invocables.
Por ejemplo, `tools.allow: ["query_db"]` solo funciona si un plugin cargado realmente
registra `query_db`. Si ninguna herramienta integrada, de plugin o MCP empaquetada coincide con la
lista permitida, la ejecución se detiene antes de la llamada al modelo en lugar de continuar como una
ejecución solo de texto que podría alucinar resultados de herramientas.

### Perfiles de herramientas

`tools.profile` establece una lista base de permitidas antes de aplicar `allow`/`deny`.
Anulación por agente: `agents.list[].tools.profile`.

| Perfil      | Qué incluye                                                                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Sin restricciones (igual que no establecerlo)                                                                                                |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                    |
| `minimal`   | Solo `session_status`                                                                                                                        |

`coding` incluye herramientas web ligeras (`web_search`, `web_fetch`, `x_search`)
pero no la herramienta completa de control del navegador. La automatización del navegador puede manejar sesiones reales y perfiles con inicio de sesión, así que agrégala explícitamente con
`tools.alsoAllow: ["browser"]` o una configuración por agente
`agents.list[].tools.alsoAllow: ["browser"]`.

Los perfiles `coding` y `messaging` también permiten herramientas MCP empaquetadas configuradas
bajo la clave de plugin `bundle-mcp`. Agrega `tools.deny: ["bundle-mcp"]` cuando
quieras que un perfil conserve sus herramientas integradas normales pero oculte todas las herramientas MCP configuradas.
El perfil `minimal` no incluye herramientas MCP empaquetadas.

### Grupos de herramientas

Usa abreviaturas `group:*` en las listas de permitidas/denegadas:

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
| `group:openclaw`   | Todas las herramientas integradas de OpenClaw (excluye herramientas de plugins)                           |

`sessions_history` devuelve una vista de recuperación acotada y filtrada por seguridad. Elimina etiquetas de thinking, la estructura `<relevant-memories>`, cargas útiles XML de llamadas a herramientas en texto plano (incluyendo `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas),
estructura degradada de llamadas a herramientas, tokens de control de modelo filtrados en ASCII/ancho completo
y XML malformado de llamadas a herramientas de MiniMax del texto del asistente, y luego aplica
redacción/truncamiento y posibles marcadores de posición para filas sobredimensionadas en lugar de actuar
como un volcado sin procesar de la transcripción.

### Restricciones específicas por proveedor

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
