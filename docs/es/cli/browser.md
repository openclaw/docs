---
read_when:
    - Usas `openclaw browser` y quieres ejemplos para tareas comunes
    - Quieres controlar un navegador que se ejecuta en otra máquina mediante un host Node
    - Quieres conectarte a tu Chrome local con sesión iniciada mediante Chrome MCP
summary: Referencia de CLI para `openclaw browser` (ciclo de vida, perfiles, pestañas, acciones, estado y depuración)
title: Navegador
x-i18n:
    generated_at: "2026-04-26T11:24:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: b42511e841e768bfa4031463f213d78c67d5c63efb655a90f65c7e8c71da9881
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

Administra la superficie de control del navegador de OpenClaw y ejecuta acciones del navegador (ciclo de vida, perfiles, pestañas, instantáneas, capturas de pantalla, navegación, entrada, emulación de estado y depuración).

Relacionado:

- Herramienta de navegador + API: [Herramienta de navegador](/es/tools/browser)

## Opciones comunes

- `--url <gatewayWsUrl>`: URL de WebSocket del Gateway (usa la configuración por defecto).
- `--token <token>`: token del Gateway (si es necesario).
- `--timeout <ms>`: tiempo de espera de la solicitud (ms).
- `--expect-final`: espera una respuesta final del Gateway.
- `--browser-profile <name>`: elige un perfil de navegador (predeterminado desde la configuración).
- `--json`: salida legible por máquina (donde sea compatible).

## Inicio rápido (local)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Los agentes pueden ejecutar la misma comprobación de preparación con `browser({ action: "doctor" })`.

## Solución rápida de problemas

Si `start` falla con `not reachable after start`, primero soluciona la preparación de CDP. Si `start` y `tabs` tienen éxito pero `open` o `navigate` fallan, el plano de control del navegador está en buen estado y el fallo suele ser la política SSRF de navegación.

Secuencia mínima:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Guía detallada: [Solución de problemas del navegador](/es/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Ciclo de vida

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Notas:

- `doctor --deep` agrega una sonda de instantánea en vivo. Es útil cuando la preparación básica de CDP es correcta, pero quieres confirmar que la pestaña actual puede inspeccionarse.
- Para perfiles `attachOnly` y CDP remotos, `openclaw browser stop` cierra la sesión de control activa y limpia las anulaciones temporales de emulación incluso cuando OpenClaw no inició por sí mismo el proceso del navegador.
- Para perfiles locales administrados, `openclaw browser stop` detiene el proceso del navegador iniciado.
- `openclaw browser start --headless` se aplica solo a esa solicitud de inicio y solo cuando OpenClaw inicia un navegador local administrado. No reescribe `browser.headless` ni la configuración del perfil, y no hace nada si el navegador ya está en ejecución.
- En hosts Linux sin `DISPLAY` o `WAYLAND_DISPLAY`, los perfiles locales administrados se ejecutan en modo headless automáticamente a menos que `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` o `browser.profiles.<name>.headless=false` soliciten explícitamente un navegador visible.

## Si falta el comando

Si `openclaw browser` es un comando desconocido, revisa `plugins.allow` en
`~/.openclaw/openclaw.json`.

Cuando `plugins.allow` está presente, el Plugin de navegador incluido debe figurar
explícitamente:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` no restaura el subcomando de CLI cuando la lista de permitidos del Plugin excluye `browser`.

Relacionado: [Herramienta de navegador](/es/tools/browser#missing-browser-command-or-tool)

## Perfiles

Los perfiles son configuraciones con nombre para el enrutamiento del navegador. En la práctica:

- `openclaw`: inicia o se conecta a una instancia dedicada de Chrome administrada por OpenClaw (directorio aislado de datos de usuario).
- `user`: controla tu sesión actual de Chrome con inicio de sesión mediante Chrome DevTools MCP.
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
openclaw browser tab new --label docs
openclaw browser tab label t1 docs
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai --label docs
openclaw browser focus docs
openclaw browser close t1
```

`tabs` devuelve primero `suggestedTargetId`, luego el `tabId` estable como `t1`,
la etiqueta opcional y el `targetId` sin procesar. Los agentes deben pasar
`suggestedTargetId` de vuelta a `focus`, `close`, instantáneas y acciones. Puedes
asignar una etiqueta con `open --label`, `tab new --label` o `tab label`; se aceptan
etiquetas, ids de pestaña, ids de destino sin procesar y prefijos únicos de id de destino.
Cuando Chromium reemplaza el destino sin procesar subyacente durante una navegación o envío
de formulario, OpenClaw mantiene el `tabId`/etiqueta estable asociado a la pestaña de reemplazo
cuando puede demostrar la coincidencia. Los ids de destino sin procesar siguen siendo volátiles;
prefiere `suggestedTargetId`.

## Instantánea / captura de pantalla / acciones

Instantánea:

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

Captura de pantalla:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

Notas:

- `--full-page` es solo para capturas de página; no puede combinarse con `--ref`
  ni `--element`.
- Los perfiles `existing-session` / `user` admiten capturas de pantalla de página y capturas `--ref`
  desde la salida de instantánea, pero no capturas CSS `--element`.
- `--labels` superpone las referencias de la instantánea actual sobre la captura.
- `snapshot --urls` agrega destinos de enlaces descubiertos a las instantáneas de IA para que
  los agentes puedan elegir objetivos directos de navegación en lugar de adivinar solo a partir del
  texto del enlace.

Navegar/hacer clic/escribir (automatización de IU basada en refs):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser click-coords 120 340
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

Las respuestas de acciones devuelven el `targetId` sin procesar actual después del reemplazo de página
provocado por la acción cuando OpenClaw puede demostrar la pestaña de reemplazo. Los scripts aun así deben
almacenar y pasar `suggestedTargetId`/etiquetas para flujos de trabajo de larga duración.

Ayudantes para archivos y diálogos:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

Los perfiles de Chrome administrados guardan las descargas ordinarias iniciadas por clic en el directorio de
descargas de OpenClaw (`/tmp/openclaw/downloads` por defecto, o la raíz temporal configurada).
Usa `waitfordownload` o `download` cuando el agente necesite esperar un archivo
específico y devolver su ruta; esos esperadores explícitos se apropian de la siguiente descarga.

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

Usa el perfil `user` integrado o crea tu propio perfil `existing-session`:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

Esta ruta es solo para el host. Para Docker, servidores headless, Browserless u otras configuraciones remotas, usa en su lugar un perfil CDP.

Límites actuales de existing-session:

- las acciones guiadas por instantánea usan refs, no selectores CSS
- las solicitudes `act` compatibles usan por defecto `browser.actionTimeoutMs` de 60000 ms cuando
  quien llama omite `timeoutMs`; `timeoutMs` por llamada sigue teniendo prioridad.
- `click` solo permite clic izquierdo
- `type` no admite `slowly=true`
- `press` no admite `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` y `evaluate` rechazan
  anulaciones de tiempo de espera por llamada
- `select` admite solo un valor
- `wait --load networkidle` no es compatible
- las cargas de archivos requieren `--ref` / `--input-ref`, no admiten CSS
  `--element`, y actualmente admiten un archivo a la vez
- los hooks de diálogo no admiten `--timeout`
- las capturas de pantalla admiten capturas de página y `--ref`, pero no CSS `--element`
- `responsebody`, la interceptación de descargas, la exportación a PDF y las acciones por lotes aún
  requieren un navegador administrado o un perfil CDP sin procesar

## Control remoto del navegador (proxy de host Node)

Si el Gateway se ejecuta en una máquina distinta del navegador, ejecuta un **host Node** en la máquina que tenga Chrome/Brave/Edge/Chromium. El Gateway enviará por proxy las acciones del navegador a ese node (no se requiere un servidor de control del navegador separado).

Usa `gateway.nodes.browser.mode` para controlar el enrutamiento automático y `gateway.nodes.browser.node` para fijar un node específico si hay varios conectados.

Configuración remota + seguridad: [Herramienta de navegador](/es/tools/browser), [Acceso remoto](/es/gateway/remote), [Tailscale](/es/gateway/tailscale), [Seguridad](/es/gateway/security)

## Relacionado

- [Referencia de CLI](/es/cli)
- [Navegador](/es/tools/browser)
