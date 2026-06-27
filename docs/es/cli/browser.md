---
read_when:
    - Usas `openclaw browser` y quieres ejemplos de tareas comunes
    - Quieres controlar un navegador que se ejecuta en otra máquina mediante un host de Node
    - Quieres conectarte a tu Chrome local con sesión iniciada mediante Chrome MCP
summary: Referencia de la CLI para `openclaw browser` (ciclo de vida, perfiles, pestañas, acciones, estado y depuración)
title: Navegador
x-i18n:
    generated_at: "2026-06-27T10:57:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e45a6b89f23623c25b61d41273151b60da1fc415b5d3c901d8c555d8244f7a
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

Gestiona la superficie de control del navegador de OpenClaw y ejecuta acciones del navegador (ciclo de vida, perfiles, pestañas, instantáneas, capturas de pantalla, navegación, entrada, emulación de estado y depuración).

Relacionado:

- Herramienta de navegador + API: [Herramienta de navegador](/es/tools/browser)

## Indicadores comunes

- `--url <gatewayWsUrl>`: URL de WebSocket de Gateway (usa la configuración de forma predeterminada).
- `--token <token>`: token de Gateway (si es necesario).
- `--timeout <ms>`: tiempo de espera de la solicitud (ms).
- `--expect-final`: esperar una respuesta final de Gateway.
- `--browser-profile <name>`: elegir un perfil de navegador (predeterminado de la configuración).
- `--json`: salida legible por máquina (cuando se admite).

## Inicio rápido (local)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Los agentes pueden ejecutar la misma comprobación de disponibilidad con `browser({ action: "doctor" })`.

## Solución rápida de problemas

Si `start` falla con `not reachable after start`, primero soluciona la disponibilidad de CDP. Si `start` y `tabs` funcionan, pero `open` o `navigate` falla, el plano de control del navegador está en buen estado y el fallo suele deberse a la política SSRF de navegación.

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

- `doctor --deep` añade una prueba de instantánea en vivo. Es útil cuando la
  disponibilidad básica de CDP está en verde, pero quieres una prueba de que se
  puede inspeccionar la pestaña actual.
- Para perfiles `attachOnly` y CDP remotos, `openclaw browser stop` cierra la
  sesión de control activa y borra las anulaciones temporales de emulación incluso
  cuando OpenClaw no inició el proceso del navegador por sí mismo.
- Para perfiles locales gestionados, `openclaw browser stop` detiene el proceso
  del navegador iniciado.
- `openclaw browser start --headless` se aplica solo a esa solicitud de inicio y
  solo cuando OpenClaw inicia un navegador local gestionado. No reescribe
  `browser.headless` ni la configuración del perfil, y no tiene efecto para un
  navegador que ya está en ejecución.
- En hosts Linux sin `DISPLAY` ni `WAYLAND_DISPLAY`, los perfiles locales
  gestionados se ejecutan automáticamente en modo sin interfaz, salvo que
  `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` o
  `browser.profiles.<name>.headless=false` solicite explícitamente un navegador visible.

## Si falta el comando

Si `openclaw browser` es un comando desconocido, revisa `plugins.allow` en
`~/.openclaw/openclaw.json`.

Cuando `plugins.allow` está presente, enumera explícitamente el Plugin de navegador
incluido, salvo que la configuración ya tenga un bloque raíz `browser`:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Un bloque raíz `browser` explícito, por ejemplo `browser.enabled=true` o
`browser.profiles.<name>`, también activa el Plugin de navegador incluido bajo una
lista restrictiva de Plugins permitidos.

Relacionado: [Herramienta de navegador](/es/tools/browser#missing-browser-command-or-tool)

## Perfiles

Los perfiles son configuraciones con nombre de enrutamiento del navegador. En la práctica:

- `openclaw`: inicia o se adjunta a una instancia dedicada de Chrome gestionada por OpenClaw (directorio de datos de usuario aislado).
- `user`: controla tu sesión existente de Chrome con sesión iniciada mediante Chrome DevTools MCP.
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

`tabs` devuelve primero `suggestedTargetId`, luego el `tabId` estable, como `t1`,
la etiqueta opcional y el `targetId` sin procesar. Los agentes deben pasar
`suggestedTargetId` de vuelta a `focus`, `close`, instantáneas y acciones. Puedes
asignar una etiqueta con `open --label`, `tab new --label` o `tab label`; se
aceptan etiquetas, ids de pestaña, ids de destino sin procesar y prefijos únicos
de ids de destino.
El campo de solicitud sigue llamándose `targetId` por compatibilidad, pero acepta
estas referencias de pestaña. Trata los ids de destino sin procesar como
identificadores de diagnóstico, no como memoria duradera del agente.
Cuando Chromium reemplaza el destino sin procesar subyacente durante una
navegación o el envío de un formulario, OpenClaw conserva el `tabId`/la etiqueta
estable adjunta a la pestaña de reemplazo cuando puede demostrar la coincidencia.
Los ids de destino sin procesar siguen siendo volátiles; prefiere
`suggestedTargetId`.

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
- Los perfiles `existing-session` / `user` admiten capturas de pantalla de página
  y capturas `--ref` desde la salida de la instantánea, pero no capturas de
  pantalla CSS `--element`.
- `--labels` superpone las referencias de la instantánea actual en la captura de
  pantalla. En perfiles respaldados por Playwright, funciona con `--full-page`
  (superposición de etiquetas de página completa), `--ref` (superposición de
  etiquetas de recorte de elemento por referencia ARIA) y `--element`
  (superposición de etiquetas de recorte de elemento por selector CSS); en modos
  de recorte de elemento, las etiquetas se proyectan en relación con el elemento.
  La respuesta también incluye un arreglo `annotations` con el cuadro delimitador
  de cada referencia. Cada elemento tiene `ref`, `number`, `role`, `name` opcional
  y `box: {x, y, width, height}`; las coordenadas están en el espacio de la imagen
  capturada (viewport / página completa / relativo al elemento). El campo se omite
  cuando está vacío.
  Los perfiles `existing-session` renderizan una superposición chrome-mcp en las
  capturas de pantalla de página, pero no usan el helper de proyección de
  Playwright ni incluyen `annotations`; las capturas de pantalla CSS `--element`
  no se admiten allí. Sin Playwright ni chrome-mcp, las capturas de pantalla con
  etiquetas no están disponibles. Versiones anteriores ignoraban `--full-page`,
  `--ref` y `--element` en capturas de pantalla con etiquetas de Playwright y
  siempre devolvían una captura del viewport; ahora las capturas de pantalla con
  etiquetas respetan esos ámbitos.
- `snapshot --urls` agrega destinos de enlaces descubiertos a las instantáneas de
  IA para que los agentes puedan elegir destinos de navegación directos en lugar
  de adivinar solo a partir del texto del enlace.

Navegar/hacer clic/escribir (automatización de IU basada en referencias):

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
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
```

`evaluate --fn` acepta el código fuente de una función, una expresión o el cuerpo
de una sentencia. Los cuerpos de sentencia se envuelven como funciones asíncronas,
así que usa `return` para el valor que quieres recibir. Usa
`evaluate --timeout-ms <ms>` cuando la función del lado de la página pueda
necesitar más tiempo que el tiempo de espera predeterminado de evaluate.

Las respuestas de acciones devuelven el `targetId` sin procesar actual después de
un reemplazo de página activado por la acción cuando OpenClaw puede demostrar la
pestaña de reemplazo. Los scripts deben seguir almacenando y pasando
`suggestedTargetId`/etiquetas para flujos de trabajo duraderos.

Helpers de archivos y diálogos:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

Los perfiles gestionados de Chrome guardan las descargas ordinarias activadas por
clic en el directorio de descargas de OpenClaw (`/tmp/openclaw/downloads` de forma
predeterminada, o la raíz temporal configurada). Usa `waitfordownload` o
`download` cuando el agente necesite esperar un archivo específico y devolver su
ruta; esos esperadores explícitos son dueños de la siguiente descarga.
Las cargas aceptan archivos desde la raíz temporal de cargas de OpenClaw y medios
entrantes gestionados por OpenClaw, incluidas referencias `media://inbound/<id>` y
`media/inbound/<id>` relativas al sandbox. Las referencias de medios anidadas, el
recorrido de rutas y las rutas locales arbitrarias siguen rechazándose.
Cuando una acción abre un diálogo modal, la respuesta de la acción devuelve
`blockedByDialog` con `browserState.dialogs.pending`; pasa `--dialog-id` para
responderlo directamente. Los diálogos gestionados fuera de OpenClaw aparecen en
`browserState.dialogs.recent`.

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

Usa el perfil `user` integrado, o crea tu propio perfil `existing-session`:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

La ruta predeterminada de existing-session es la conexión automática de Chrome MCP solo del host. Si el navegador ya se está
ejecutando con un endpoint de DevTools, pasa `--cdp-url` para que Chrome MCP se adjunte a ese endpoint en su lugar.
Para Docker, Browserless u otras configuraciones remotas donde no se necesitan las semánticas de Chrome MCP, usa un
perfil CDP.

Límites actuales de existing-session:

- las acciones basadas en instantáneas usan refs, no selectores CSS
- `browser.actionTimeoutMs` aplica de forma predeterminada 60000 ms a las solicitudes `act` compatibles cuando
  los llamadores omiten `timeoutMs`; el `timeoutMs` por llamada sigue teniendo prioridad.
- `click` solo hace clic izquierdo
- `type` no admite `slowly=true`
- `press` no admite `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` y `evaluate` rechazan
  las anulaciones de tiempo de espera por llamada
- `select` admite un solo valor
- `wait --load networkidle` no se admite en perfiles de sesión existente (funciona en CDP administrado y sin procesar/remoto)
- las cargas de archivos requieren `--ref` / `--input-ref`, no admiten `--element`
  CSS y actualmente admiten un archivo a la vez
- los hooks de diálogo no admiten `--timeout`
- las capturas de pantalla admiten capturas de página y `--ref`, pero no `--element` CSS
- `responsebody`, la interceptación de descargas, la exportación a PDF y las acciones por lotes aún
  requieren un navegador administrado o un perfil CDP sin procesar

## Control remoto del navegador (proxy de host de Node)

Si el Gateway se ejecuta en una máquina distinta de la del navegador, ejecuta un **host de Node** en la máquina que tiene Chrome/Brave/Edge/Chromium. El Gateway enviará las acciones del navegador a ese nodo mediante proxy (no se requiere un servidor de control de navegador separado).

Usa `gateway.nodes.browser.mode` para controlar el enrutamiento automático y `gateway.nodes.browser.node` para fijar un nodo específico si hay varios conectados.

Seguridad + configuración remota: [Herramienta de navegador](/es/tools/browser), [Acceso remoto](/es/gateway/remote), [Tailscale](/es/gateway/tailscale), [Seguridad](/es/gateway/security)

## Relacionado

- [Referencia de CLI](/es/cli)
- [Navegador](/es/tools/browser)
