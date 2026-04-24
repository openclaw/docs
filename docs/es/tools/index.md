---
read_when:
    - Quieres entender qué herramientas proporciona OpenClaw
    - Necesitas configurar, permitir o denegar herramientas
    - Estás decidiendo entre herramientas integradas, Skills y plugins
summary: 'Resumen de herramientas y plugins de OpenClaw: qué puede hacer el agente y cómo ampliarlo'
title: Herramientas y plugins
x-i18n:
    generated_at: "2026-04-24T05:54:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9ab57fcb1b58875866721fbadba63093827698ed980afeb14274da601b34f11
    source_path: tools/index.md
    workflow: 15
---

Todo lo que hace el agente más allá de generar texto ocurre mediante **herramientas**.
Las herramientas son cómo el agente lee archivos, ejecuta comandos, navega por la web, envía
mensajes e interactúa con dispositivos.

## Herramientas, Skills y plugins

OpenClaw tiene tres capas que trabajan juntas:

<Steps>
  <Step title="Las herramientas son lo que llama el agente">
    Una herramienta es una función tipada que el agente puede invocar (por ejemplo `exec`, `browser`,
    `web_search`, `message`). OpenClaw incluye un conjunto de **herramientas integradas** y
    los plugins pueden registrar otras adicionales.

    El agente ve las herramientas como definiciones estructuradas de funciones enviadas a la API del modelo.

  </Step>

  <Step title="Las Skills enseñan al agente cuándo y cómo">
    Una Skill es un archivo markdown (`SKILL.md`) inyectado en el prompt del sistema.
    Las Skills proporcionan al agente contexto, restricciones y orientación paso a paso para
    usar herramientas de forma eficaz. Las Skills viven en tu espacio de trabajo, en carpetas
    compartidas o se incluyen dentro de plugins.

    [Referencia de Skills](/es/tools/skills) | [Crear Skills](/es/tools/creating-skills)

  </Step>

  <Step title="Los plugins empaquetan todo junto">
    Un Plugin es un paquete que puede registrar cualquier combinación de capacidades:
    canales, proveedores de modelos, herramientas, Skills, voz, transcripción en tiempo real,
    voz en tiempo real, comprensión de medios, generación de imágenes, generación de video,
    obtención web, búsqueda web y más. Algunos plugins son **core** (incluidos con
    OpenClaw), otros son **external** (publicados en npm por la comunidad).

    [Instalar y configurar plugins](/es/tools/plugin) | [Crea el tuyo](/es/plugins/building-plugins)

  </Step>
</Steps>

## Herramientas integradas

Estas herramientas se incluyen con OpenClaw y están disponibles sin instalar ningún plugin:

| Herramienta                                | Qué hace                                                             | Página                                                       |
| ------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Ejecutar comandos de shell, gestionar procesos en segundo plano      | [Exec](/es/tools/exec), [Aprobaciones de exec](/es/tools/exec-approvals) |
| `code_execution`                           | Ejecutar análisis remoto de Python en sandbox                        | [Ejecución de código](/es/tools/code-execution)                 |
| `browser`                                  | Controlar un navegador Chromium (navegar, hacer clic, capturas)      | [Navegador](/es/tools/browser)                                  |
| `web_search` / `x_search` / `web_fetch`    | Buscar en la web, buscar publicaciones en X, obtener contenido de páginas | [Web](/es/tools/web), [Web Fetch](/es/tools/web-fetch)         |
| `read` / `write` / `edit`                  | E/S de archivos en el espacio de trabajo                             |                                                              |
| `apply_patch`                              | Parches de archivos con múltiples bloques                            | [Apply Patch](/es/tools/apply-patch)                            |
| `message`                                  | Enviar mensajes a través de todos los canales                        | [Envío del agente](/es/tools/agent-send)                        |
| `canvas`                                   | Controlar el Canvas del node (presentar, eval, snapshot)             |                                                              |
| `nodes`                                    | Descubrir y dirigirse a dispositivos emparejados                     |                                                              |
| `cron` / `gateway`                         | Gestionar trabajos programados; inspeccionar, parchear, reiniciar o actualizar el gateway |                                                              |
| `image` / `image_generate`                 | Analizar o generar imágenes                                          | [Generación de imágenes](/es/tools/image-generation)            |
| `music_generate`                           | Generar pistas musicales                                             | [Generación de música](/es/tools/music-generation)              |
| `video_generate`                           | Generar videos                                                       | [Generación de video](/es/tools/video-generation)               |
| `tts`                                      | Conversión puntual de texto a voz                                    | [TTS](/es/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Gestión de sesiones, estado y orquestación de subagentes             | [Subagentes](/es/tools/subagents)                               |
| `session_status`                           | Lectura ligera de estilo `/status` y sobrescritura del modelo de sesión | [Herramientas de sesión](/es/concepts/session-tool)         |

Para trabajo con imágenes, usa `image` para análisis e `image_generate` para generación o edición. Si apuntas a `openai/*`, `google/*`, `fal/*` u otro proveedor de imágenes no predeterminado, configura primero la autenticación/clave API de ese proveedor.

Para trabajo con música, usa `music_generate`. Si apuntas a `google/*`, `minimax/*` u otro proveedor de música no predeterminado, configura primero la autenticación/clave API de ese proveedor.

Para trabajo con video, usa `video_generate`. Si apuntas a `qwen/*` u otro proveedor de video no predeterminado, configura primero la autenticación/clave API de ese proveedor.

Para generación de audio basada en flujos de trabajo, usa `music_generate` cuando un plugin como
ComfyUI lo registre. Esto es independiente de `tts`, que es texto a voz.

`session_status` es la herramienta ligera de estado/lectura en el grupo de sesiones.
Responde preguntas de estilo `/status` sobre la sesión actual y puede
establecer opcionalmente una sobrescritura de modelo por sesión; `model=default` elimina esa
sobrescritura. Igual que `/status`, puede completar contadores escasos de tokens/caché y la
etiqueta del modelo activo del entorno de ejecución a partir de la última entrada de uso de la transcripción.

`gateway` es la herramienta de entorno de ejecución exclusiva del propietario para operaciones del gateway:

- `config.schema.lookup` para un subárbol de configuración acotado a una ruta antes de editar
- `config.get` para la instantánea actual de configuración + hash
- `config.patch` para actualizaciones parciales de configuración con reinicio
- `config.apply` solo para reemplazo completo de la configuración
- `update.run` para autoactualización explícita + reinicio

Para cambios parciales, prefiere `config.schema.lookup` y luego `config.patch`. Usa
`config.apply` solo cuando intencionadamente reemplaces toda la configuración.
La herramienta también se niega a cambiar `tools.exec.ask` o `tools.exec.security`;
los alias heredados `tools.bash.*` se normalizan a las mismas rutas protegidas de exec.

### Herramientas proporcionadas por plugins

Los plugins pueden registrar herramientas adicionales. Algunos ejemplos:

- [Diffs](/es/tools/diffs) — visor y renderizador de diferencias
- [LLM Task](/es/tools/llm-task) — paso de LLM solo JSON para salida estructurada
- [Lobster](/es/tools/lobster) — entorno de ejecución de flujo de trabajo tipado con aprobaciones reanudables
- [Generación de música](/es/tools/music-generation) — herramienta compartida `music_generate` con proveedores respaldados por flujo de trabajo
- [OpenProse](/es/prose) — orquestación de flujos de trabajo centrada en markdown
- [Tokenjuice](/es/tools/tokenjuice) — compacta resultados ruidosos de herramientas `exec` y `bash`

## Configuración de herramientas

### Listas de permitidos y denegados

Controla qué herramientas puede llamar el agente mediante `tools.allow` / `tools.deny` en la
configuración. Deny siempre gana sobre allow.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### Perfiles de herramientas

`tools.profile` establece una allowlist base antes de aplicar `allow`/`deny`.
Sobrescritura por agente: `agents.list[].tools.profile`.

| Perfil      | Qué incluye                                                                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Sin restricciones (igual que no configurado)                                                                                                  |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                     |
| `minimal`   | Solo `session_status`                                                                                                                         |

Los perfiles `coding` y `messaging` también permiten herramientas MCP del bundle configuradas
bajo la clave de plugin `bundle-mcp`. Añade `tools.deny: ["bundle-mcp"]` cuando
quieras que un perfil conserve sus herramientas integradas normales pero oculte todas las herramientas MCP configuradas.
El perfil `minimal` no incluye herramientas MCP del bundle.

### Grupos de herramientas

Usa abreviaturas `group:*` en listas allow/deny:

| Grupo              | Herramientas                                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` se acepta como alias de `exec`)                                      |
| `group:fs`         | read, write, edit, apply_patch                                                                             |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                  |
| `group:web`        | web_search, x_search, web_fetch                                                                            |
| `group:ui`         | browser, canvas                                                                                            |
| `group:automation` | cron, gateway                                                                                              |
| `group:messaging`  | message                                                                                                    |
| `group:nodes`      | nodes                                                                                                      |
| `group:agents`     | agents_list                                                                                                |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                 |
| `group:openclaw`   | Todas las herramientas integradas de OpenClaw (excluye herramientas de plugins)                           |

`sessions_history` devuelve una vista de recuperación limitada y filtrada por seguridad. Elimina
etiquetas de thinking, andamiaje `<relevant-memories>`, cargas útiles XML de llamadas a herramientas en texto plano
(incluyendo `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas),
andamiaje degradado de llamadas a herramientas, tokens filtrados de control de modelo en ASCII/ancho completo
y XML malformado de llamadas a herramientas de MiniMax del texto del asistente, y luego aplica
redacción/truncamiento y posibles marcadores de fila sobredimensionada en lugar de actuar
como un volcado sin procesar de la transcripción.

### Restricciones específicas por proveedor

Usa `tools.byProvider` para restringir herramientas a proveedores específicos sin
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
