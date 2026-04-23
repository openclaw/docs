---
read_when:
    - Quieres entender qué herramientas ofrece OpenClaw
    - Necesitas configurar, permitir o denegar herramientas
    - Estás decidiendo entre herramientas integradas, Skills y Plugins
summary: 'Resumen de herramientas y Plugins de OpenClaw: qué puede hacer el agente y cómo ampliarlo'
title: Herramientas y Plugins
x-i18n:
    generated_at: "2026-04-23T14:08:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef0975c567b0bca0e991a0445d3db4a00fe2e2cf91b9e6bea5686825deac91a0
    source_path: tools/index.md
    workflow: 15
---

# Herramientas y Plugins

Todo lo que hace el agente más allá de generar texto ocurre mediante **herramientas**.
Las herramientas son la forma en que el agente lee archivos, ejecuta comandos, navega por la web, envía
mensajes e interactúa con dispositivos.

## Herramientas, Skills y Plugins

OpenClaw tiene tres capas que funcionan juntas:

<Steps>
  <Step title="Las herramientas son lo que el agente llama">
    Una herramienta es una función tipada que el agente puede invocar (por ejemplo, `exec`, `browser`,
    `web_search`, `message`). OpenClaw incluye un conjunto de **herramientas integradas** y
    los Plugins pueden registrar otras adicionales.

    El agente ve las herramientas como definiciones estructuradas de funciones enviadas a la API del modelo.

  </Step>

  <Step title="Las Skills enseñan al agente cuándo y cómo">
    Una Skill es un archivo markdown (`SKILL.md`) inyectado en el prompt del sistema.
    Las Skills dan al agente contexto, restricciones y orientación paso a paso para
    usar las herramientas de forma eficaz. Las Skills viven en tu espacio de trabajo, en carpetas
    compartidas o se incluyen dentro de Plugins.

    [Referencia de Skills](/es/tools/skills) | [Crear Skills](/es/tools/creating-skills)

  </Step>

  <Step title="Los Plugins lo empaquetan todo junto">
    Un Plugin es un paquete que puede registrar cualquier combinación de capacidades:
    canales, proveedores de modelos, herramientas, Skills, voz, transcripción en tiempo real,
    voz en tiempo real, comprensión de medios, generación de imágenes, generación de video,
    web fetch, búsqueda web y más. Algunos Plugins son **core** (incluidos con
    OpenClaw), otros son **external** (publicados en npm por la comunidad).

    [Instalar y configurar Plugins](/es/tools/plugin) | [Crear el tuyo](/es/plugins/building-plugins)

  </Step>
</Steps>

## Herramientas integradas

Estas herramientas se incluyen con OpenClaw y están disponibles sin instalar ningún Plugin:

| Herramienta                                  | Qué hace                                                             | Página                                                       |
| -------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                           | Ejecutar comandos de shell, gestionar procesos en segundo plano      | [Exec](/es/tools/exec), [Aprobaciones de Exec](/es/tools/exec-approvals) |
| `code_execution`                             | Ejecutar análisis remoto de Python en sandbox                        | [Ejecución de código](/es/tools/code-execution)                 |
| `browser`                                    | Controlar un navegador Chromium (navegar, hacer clic, capturar)      | [Browser](/es/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`      | Buscar en la web, buscar publicaciones de X, obtener contenido de páginas | [Web](/es/tools/web), [Web Fetch](/es/tools/web-fetch)         |
| `read` / `write` / `edit`                    | E/S de archivos en el espacio de trabajo                             |                                                              |
| `apply_patch`                                | Parches de archivos con varios bloques                               | [Apply Patch](/es/tools/apply-patch)                            |
| `message`                                    | Enviar mensajes a través de todos los canales                        | [Envío del agente](/es/tools/agent-send)                        |
| `canvas`                                     | Controlar Canvas de Node (presentar, evaluar, instantánea)           |                                                              |
| `nodes`                                      | Descubrir y seleccionar dispositivos emparejados                     |                                                              |
| `cron` / `gateway`                           | Gestionar trabajos programados; inspeccionar, parchear, reiniciar o actualizar el Gateway |                                                              |
| `image` / `image_generate`                   | Analizar o generar imágenes                                          | [Generación de imágenes](/es/tools/image-generation)            |
| `music_generate`                             | Generar pistas musicales                                             | [Generación de música](/es/tools/music-generation)              |
| `video_generate`                             | Generar videos                                                       | [Generación de video](/es/tools/video-generation)               |
| `tts`                                        | Conversión puntual de texto a voz                                    | [TTS](/es/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list`   | Gestión de sesiones, estado y orquestación de subagentes             | [Subagentes](/es/tools/subagents)                               |
| `session_status`                             | Lectura ligera tipo `/status` y sobrescritura del modelo de sesión   | [Herramientas de sesión](/es/concepts/session-tool)             |

Para trabajo con imágenes, usa `image` para análisis y `image_generate` para generación o edición. Si apuntas a `openai/*`, `google/*`, `fal/*` u otro proveedor de imágenes no predeterminado, configura primero la autenticación/clave de API de ese proveedor.

Para trabajo musical, usa `music_generate`. Si apuntas a `google/*`, `minimax/*` u otro proveedor de música no predeterminado, configura primero la autenticación/clave de API de ese proveedor.

Para trabajo con video, usa `video_generate`. Si apuntas a `qwen/*` u otro proveedor de video no predeterminado, configura primero la autenticación/clave de API de ese proveedor.

Para generación de audio impulsada por flujos de trabajo, usa `music_generate` cuando un Plugin como
ComfyUI lo registre. Esto es independiente de `tts`, que es conversión de texto a voz.

`session_status` es la herramienta ligera de estado/lectura del grupo de sesiones.
Responde preguntas de estilo `/status` sobre la sesión actual y puede
opcionalmente establecer una sobrescritura de modelo por sesión; `model=default` limpia esa
sobrescritura. Igual que `/status`, puede rellenar contadores escasos de tokens/caché y la
etiqueta activa del modelo de runtime a partir de la entrada de uso más reciente de la transcripción.

`gateway` es la herramienta de runtime solo para propietarios para operaciones del Gateway:

- `config.schema.lookup` para un subárbol de configuración con ámbito de ruta antes de editar
- `config.get` para la instantánea actual de configuración + hash
- `config.patch` para actualizaciones parciales de configuración con reinicio
- `config.apply` solo para reemplazo completo de configuración
- `update.run` para autoactualización explícita + reinicio

Para cambios parciales, prefiere `config.schema.lookup` y luego `config.patch`. Usa
`config.apply` solo cuando quieras reemplazar intencionadamente toda la configuración.
La herramienta también se niega a cambiar `tools.exec.ask` o `tools.exec.security`;
los alias heredados `tools.bash.*` se normalizan a las mismas rutas protegidas de exec.

### Herramientas proporcionadas por Plugins

Los Plugins pueden registrar herramientas adicionales. Algunos ejemplos:

- [Diffs](/es/tools/diffs) — visor y renderizador de diferencias
- [LLM Task](/es/tools/llm-task) — paso de LLM solo JSON para salida estructurada
- [Lobster](/es/tools/lobster) — runtime de flujo de trabajo tipado con aprobaciones reanudables
- [Generación de música](/es/tools/music-generation) — herramienta compartida `music_generate` con proveedores respaldados por flujos de trabajo
- [OpenProse](/es/prose) — orquestación de flujo de trabajo centrada en markdown
- [Tokenjuice](/es/tools/tokenjuice) — compacta resultados ruidosos de herramientas `exec` y `bash`

## Configuración de herramientas

### Listas de permitidos y denegados

Controla qué herramientas puede llamar el agente mediante `tools.allow` / `tools.deny` en la
configuración. Deny siempre tiene prioridad sobre allow.

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
Sobrescritura por agente: `agents.list[].tools.profile`.

| Perfil      | Qué incluye                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `full`      | Sin restricciones (igual que no establecerlo)                                                                                                    |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                        |
| `minimal`   | Solo `session_status`                                                                                                                            |

Los perfiles `coding` y `messaging` también permiten herramientas MCP de bundle configuradas
bajo la clave de Plugin `bundle-mcp`. Añade `tools.deny: ["bundle-mcp"]` cuando
quieras que un perfil conserve sus integradas normales pero oculte todas las herramientas MCP configuradas.
El perfil `minimal` no incluye herramientas MCP de bundle.

### Grupos de herramientas

Usa las abreviaturas `group:*` en listas de permitidos/denegados:

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
| `group:openclaw`   | Todas las herramientas integradas de OpenClaw (excluye herramientas de Plugin)                           |

`sessions_history` devuelve una vista de recuperación acotada y filtrada por seguridad. Elimina
etiquetas de thinking, estructura `<relevant-memories>`, cargas útiles XML de llamadas a herramientas en texto plano
(incluidos `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas),
estructura degradada de llamadas a herramientas, tokens de control del modelo filtrados en ASCII/ancho completo
y XML mal formado de llamadas a herramientas de MiniMax del texto del asistente, y luego aplica
redacción/truncado y posibles placeholders de filas sobredimensionadas en lugar de actuar
como un volcado sin procesar de la transcripción.

### Restricciones específicas del proveedor

Usa `tools.byProvider` para restringir herramientas para proveedores concretos sin
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
