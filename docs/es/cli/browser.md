---
read_when:
    - Usas `openclaw browser` y quieres ejemplos para tareas comunes
    - Quieres controlar un navegador que se ejecuta en otra máquina a través de un host Node
    - Quieres adjuntarte a tu Chrome local con sesión iniciada mediante Chrome MCP
summary: Referencia de la CLI para `openclaw browser` (ciclo de vida, perfiles, pestañas, acciones, estado y depuración)
title: browser
x-i18n:
    generated_at: "2026-04-23T14:00:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0cf1a5168e690121d4fc4eac984580c89bc50844f15558413ba6d8a635da2ed6
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

Gestiona la superficie de control del navegador de OpenClaw y ejecuta acciones del navegador (ciclo de vida, perfiles, pestañas, instantáneas, capturas de pantalla, navegación, entrada, emulación de estado y depuración).

Relacionado:

- Herramienta de navegador + API: [Browser tool](/es/tools/browser)

## Indicadores comunes

- `--url <gatewayWsUrl>`: URL de WebSocket del Gateway (usa la configuración por defecto).
- `--token <token>`: token del Gateway (si es necesario).
- `--timeout <ms>`: tiempo de espera de la solicitud (ms).
- `--expect-final`: esperar una respuesta final del Gateway.
- `--browser-profile <name>`: elegir un perfil de navegador (predeterminado según la configuración).
- `--json`: salida legible por máquina (donde se admita).

## Inicio rápido (local)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

## Solución rápida de problemas

Si `start` falla con `not reachable after start`, primero soluciona la preparación de CDP. Si `start` y `tabs` funcionan pero `open` o `navigate` fallan, el plano de control del navegador está en buen estado y el fallo suele deberse a la política SSRF de navegación.

Secuencia mínima:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Guía detallada: [Solución de problemas del navegador](/es/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Ciclo de vida

```bash
openclaw browser status
openclaw browser start
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Notas:

- Para perfiles `attachOnly` y CDP remotos, `openclaw browser stop` cierra la sesión de control activa y borra las anulaciones temporales de emulación incluso cuando OpenClaw no lanzó el proceso del navegador por sí mismo.
- Para perfiles locales gestionados, `openclaw browser stop` detiene el proceso del navegador iniciado.

## Si falta el comando

Si `openclaw browser` es un comando desconocido, revisa `plugins.allow` en `~/.openclaw/openclaw.json`.

Cuando `plugins.allow` está presente, el Plugin de navegador incluido debe aparecer explícitamente:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` no restaura el subcomando de la CLI cuando la lista de permitidos de plugins excluye `browser`.

Relacionado: [Browser tool](/es/tools/browser#missing-browser-command-or-tool)

## Perfiles

Los perfiles son configuraciones de enrutamiento del navegador con nombre. En la práctica:

- `openclaw`: inicia o se adjunta a una instancia dedicada de Chrome gestionada por OpenClaw (directorio de datos de usuario aislado).
- `user`: controla tu sesión existente de Chrome iniciada mediante Chrome DevTools MCP.
- perfiles CDP personalizados: apuntan a un endpoint CDP local o remoto.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Usa un perfil específico:

```bash
openclaw browser --browser-profile work tabs
```

## Pestañas

```bash
openclaw browser tabs
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai
openclaw browser focus <targetId>
openclaw browser close <targetId>
```

## Instantánea / captura de pantalla / acciones

Instantánea:

```bash
openclaw browser snapshot
```

Captura de pantalla:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
```

Notas:

- `--full-page` es solo para capturas de página; no puede combinarse con `--ref` ni `--element`.
- Los perfiles `existing-session` / `user` admiten capturas de pantalla de página y capturas con `--ref` a partir de la salida de la instantánea, pero no capturas CSS con `--element`.

Navegar/hacer clic/escribir (automatización de UI basada en ref):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
```

Ayudantes de archivos + diálogos:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

## Estado y almacenamiento

Viewport + emulación:

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

Cookies + almacenamiento:

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## Depuración

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## Chrome existente mediante MCP

Usa el perfil integrado `user`, o crea tu propio perfil `existing-session`:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

Esta ruta es solo para host. Para Docker, servidores sin interfaz, Browserless u otras configuraciones remotas, usa en su lugar un perfil CDP.

Límites actuales de existing-session:

- las acciones guiadas por instantánea usan refs, no selectores CSS
- `click` es solo clic izquierdo
- `type` no admite `slowly=true`
- `press` no admite `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` y `evaluate` rechazan anulaciones de tiempo de espera por llamada
- `select` solo admite un valor
- `wait --load networkidle` no es compatible
- las cargas de archivos requieren `--ref` / `--input-ref`, no admiten CSS `--element` y actualmente admiten un archivo cada vez
- los hooks de diálogos no admiten `--timeout`
- las capturas de pantalla admiten capturas de página y `--ref`, pero no CSS `--element`
- `responsebody`, la interceptación de descargas, la exportación a PDF y las acciones por lotes siguen requiriendo un navegador gestionado o un perfil CDP sin procesar

## Control remoto del navegador (proxy de host Node)

Si el Gateway se ejecuta en una máquina distinta del navegador, ejecuta un **host Node** en la máquina que tenga Chrome/Brave/Edge/Chromium. El Gateway enviará por proxy las acciones del navegador a ese nodo (no se necesita un servidor de control del navegador separado).

Usa `gateway.nodes.browser.mode` para controlar el enrutamiento automático y `gateway.nodes.browser.node` para fijar un nodo específico si hay varios conectados.

Seguridad + configuración remota: [Browser tool](/es/tools/browser), [Acceso remoto](/es/gateway/remote), [Tailscale](/es/gateway/tailscale), [Seguridad](/es/gateway/security)
