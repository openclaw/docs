---
read_when:
    - Quiere comprender qué herramientas proporciona OpenClaw
    - Necesita configurar, permitir o denegar herramientas
    - Está decidiendo entre herramientas integradas, Skills y plugins
summary: 'Descripción general de las herramientas y plugins de OpenClaw: qué puede hacer el agente y cómo ampliarlo'
title: Herramientas y plugins
x-i18n:
    generated_at: "2026-04-23T05:21:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c32414dfa99969372e9b0c846305a1af1ffb18a282e6dfc8a6adabe3fab145a
    source_path: tools/index.md
    workflow: 15
---

# Herramientas y plugins

Todo lo que hace el agente más allá de generar texto ocurre mediante **herramientas**.
Las herramientas son la forma en que el agente lee archivos, ejecuta comandos, navega por la web, envía
mensajes e interactúa con dispositivos.

## Herramientas, Skills y plugins

OpenClaw tiene tres capas que funcionan juntas:

<Steps>
  <Step title="Las herramientas son lo que invoca el agente">
    Una herramienta es una función tipada que el agente puede invocar (por ejemplo, `exec`, `browser`,
    `web_search`, `message`). OpenClaw incluye un conjunto de **herramientas integradas** y
    los plugins pueden registrar otras adicionales.

    El agente ve las herramientas como definiciones estructuradas de funciones enviadas a la API del modelo.

  </Step>

  <Step title="Los Skills enseñan al agente cuándo y cómo">
    Un Skill es un archivo markdown (`SKILL.md`) inyectado en el prompt del sistema.
    Los Skills proporcionan al agente contexto, restricciones y orientación paso a paso para
    usar las herramientas de forma eficaz. Los Skills viven en su espacio de trabajo, en carpetas compartidas
    o se incluyen dentro de plugins.

    [Referencia de Skills](/es/tools/skills) | [Creación de Skills](/es/tools/creating-skills)

  </Step>

  <Step title="Los plugins empaquetan todo junto">
    Un plugin es un paquete que puede registrar cualquier combinación de capacidades:
    canales, proveedores de modelos, herramientas, Skills, voz, transcripción en tiempo real,
    voz en tiempo real, comprensión multimedia, generación de imágenes, generación de video,
    obtención web, búsqueda web y más. Algunos plugins son **core** (incluidos con
    OpenClaw), otros son **externos** (publicados en npm por la comunidad).

    [Instalar y configurar plugins](/es/tools/plugin) | [Crear el suyo](/es/plugins/building-plugins)

  </Step>
</Steps>

## Herramientas integradas

Estas herramientas se incluyen con OpenClaw y están disponibles sin instalar ningún plugin:

| Tool                                       | What it does                                                          | Page                                        |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------- |
| `exec` / `process`                         | Ejecutar comandos de shell, administrar procesos en segundo plano                       | [Exec](/es/tools/exec)                         |
| `code_execution`                           | Ejecutar análisis remoto de Python en sandbox                                  | [Code Execution](/es/tools/code-execution)     |
| `browser`                                  | Controlar un navegador Chromium (navegar, hacer clic, capturar pantalla)              | [Browser](/es/tools/browser)                   |
| `web_search` / `x_search` / `web_fetch`    | Buscar en la web, buscar publicaciones de X, obtener contenido de páginas                    | [Web](/es/tools/web)                           |
| `read` / `write` / `edit`                  | E/S de archivos en el espacio de trabajo                                             |                                             |
| `apply_patch`                              | Parches de archivos de varios bloques                                               | [Apply Patch](/es/tools/apply-patch)           |
| `message`                                  | Enviar mensajes a través de todos los canales                                     | [Agent Send](/es/tools/agent-send)             |
| `canvas`                                   | Controlar Canvas del Node (presentar, evaluar, capturar)                           |                                             |
| `nodes`                                    | Detectar y seleccionar dispositivos emparejados                                    |                                             |
| `cron` / `gateway`                         | Administrar trabajos programados; inspeccionar, parchear, reiniciar o actualizar el Gateway |                                             |
| `image` / `image_generate`                 | Analizar o generar imágenes                                            | [Image Generation](/es/tools/image-generation) |
| `music_generate`                           | Generar pistas de música                                                 | [Music Generation](/es/tools/music-generation) |
| `video_generate`                           | Generar videos                                                       | [Video Generation](/es/tools/video-generation) |
| `tts`                                      | Conversión puntual de texto a voz                                    | [TTS](/es/tools/tts)                           |
| `sessions_*` / `subagents` / `agents_list` | Gestión de sesiones, estado y orquestación de subagentes               | [Sub-agents](/es/tools/subagents)              |
| `session_status`                           | Lectura ligera de estilo `/status` y anulación del modelo de sesión       | [Session Tools](/es/concepts/session-tool)     |

Para trabajo con imágenes, use `image` para análisis y `image_generate` para generación o edición. Si apunta a `openai/*`, `google/*`, `fal/*` u otro proveedor de imágenes no predeterminado, configure primero la autenticación/clave de API de ese proveedor.

Para trabajo con música, use `music_generate`. Si apunta a `google/*`, `minimax/*` u otro proveedor de música no predeterminado, configure primero la autenticación/clave de API de ese proveedor.

Para trabajo con video, use `video_generate`. Si apunta a `qwen/*` u otro proveedor de video no predeterminado, configure primero la autenticación/clave de API de ese proveedor.

Para generación de audio basada en flujos de trabajo, use `music_generate` cuando un plugin como
ComfyUI lo registre. Esto es independiente de `tts`, que es texto a voz.

`session_status` es la herramienta ligera de estado/lectura dentro del grupo de sesiones.
Responde preguntas de estilo `/status` sobre la sesión actual y puede
establecer opcionalmente una anulación de modelo por sesión; `model=default` borra esa
anulación. Como `/status`, puede completar contadores escasos de tokens/caché y la
etiqueta del modelo activo en tiempo de ejecución a partir de la entrada de uso más reciente del transcript.

`gateway` es la herramienta de tiempo de ejecución solo para propietarios para operaciones del Gateway:

- `config.schema.lookup` para un subárbol de configuración acotado a una ruta antes de editar
- `config.get` para la instantánea actual de configuración + hash
- `config.patch` para actualizaciones parciales de configuración con reinicio
- `config.apply` solo para reemplazo de configuración completa
- `update.run` para autoactualización explícita + reinicio

Para cambios parciales, prefiera `config.schema.lookup` y luego `config.patch`. Use
`config.apply` solo cuando quiera reemplazar intencionalmente toda la configuración.
La herramienta también se niega a cambiar `tools.exec.ask` o `tools.exec.security`;
los alias heredados `tools.bash.*` se normalizan a las mismas rutas protegidas de exec.

### Herramientas proporcionadas por plugins

Los plugins pueden registrar herramientas adicionales. Algunos ejemplos:

- [Diffs](/es/tools/diffs) — visor y renderizador de diferencias
- [LLM Task](/es/tools/llm-task) — paso de LLM solo JSON para salida estructurada
- [Lobster](/es/tools/lobster) — tiempo de ejecución de flujos de trabajo tipados con aprobaciones reanudables
- [Music Generation](/es/tools/music-generation) — herramienta compartida `music_generate` con proveedores respaldados por flujos de trabajo
- [OpenProse](/es/prose) — orquestación de flujos de trabajo con prioridad en markdown
- [Tokenjuice](/es/tools/tokenjuice) — compacta resultados ruidosos de herramientas `exec` y `bash`

## Configuración de herramientas

### Listas de permitidos y denegados

Controle qué herramientas puede invocar el agente mediante `tools.allow` / `tools.deny` en la
configuración. Denegar siempre prevalece sobre permitir.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### Perfiles de herramientas

`tools.profile` establece una lista base de permitidos antes de aplicar `allow`/`deny`.
Anulación por agente: `agents.list[].tools.profile`.

| Profile     | What it includes                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Sin restricción (igual que no establecerlo)                                                                                                                    |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | solo `session_status`                                                                                                                             |

Los perfiles `coding` y `messaging` también permiten herramientas MCP configuradas de paquetes
bajo la clave de plugin `bundle-mcp`. Agregue `tools.deny: ["bundle-mcp"]` cuando
quiera que un perfil conserve sus herramientas integradas normales pero oculte todas las herramientas MCP configuradas.
El perfil `minimal` no incluye herramientas MCP de paquetes.

### Grupos de herramientas

Use las formas abreviadas `group:*` en listas de permitidos/denegados:

| Group              | Tools                                                                                                     |
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
| `group:openclaw`   | Todas las herramientas integradas de OpenClaw (excluye herramientas de plugins)                                                       |

`sessions_history` devuelve una vista acotada y filtrada por seguridad para recordar historial. Elimina
etiquetas de razonamiento, andamiaje `<relevant-memories>`, cargas XML
de llamadas a herramientas en texto plano (incluidos `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas),
andamiaje degradado de llamadas a herramientas, tokens de control del modelo filtrados en ASCII/ancho completo
y XML malformado de llamadas a herramientas de MiniMax del texto del asistente, luego aplica
redacción/truncamiento y posibles marcadores de fila sobredimensionada en lugar de actuar
como un volcado bruto del transcript.

### Restricciones específicas por proveedor

Use `tools.byProvider` para restringir herramientas para proveedores específicos sin
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
