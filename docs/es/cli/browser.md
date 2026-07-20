---
read_when:
    - Usa `openclaw browser` y busca ejemplos de tareas comunes
    - Quieres controlar un navegador que se ejecuta en otro equipo mediante un host de Node
    - Quieres conectarte a tu Chrome local con la sesión iniciada mediante Chrome MCP
summary: Referencia de la CLI para `openclaw browser` (ciclo de vida, perfiles, pestañas, acciones, estado y depuración)
title: Navegador
x-i18n:
    generated_at: "2026-07-20T00:45:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1cb233c5060c19120ab24b13e166cbd40035c81e6dd6ef0e70a4877a852f3b9a
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

Gestiona la superficie de control del navegador de OpenClaw y ejecuta acciones del navegador: ciclo de vida, perfiles, pestañas, instantáneas, capturas de pantalla, navegación, entrada, emulación de estado y depuración.

Relacionado: [Herramienta de navegador](/es/tools/browser)

## Opciones comunes

- `--url <gatewayWsUrl>`: URL de WebSocket del Gateway (de forma predeterminada, se usa la configuración).
- `--token <token>`: token del Gateway (si es necesario).
- `--timeout <ms>`: tiempo de espera de la solicitud en ms (valor predeterminado: `30000`).
- `--expect-final`: espera una respuesta final del Gateway.
- `--browser-profile <name>`: selecciona un perfil de navegador (valor predeterminado: `openclaw` o `browser.defaultProfile`).
- `--json`: salida legible por máquina (cuando se admite). Esta es una opción de nivel de navegador, por lo que
  debe colocarse antes del subcomando para obtener una forma inequívoca, como
  `openclaw browser --json status`. Colocarla al final, como en
  `openclaw browser status --json`, también funciona cuando el comando secundario seleccionado no
  define su propio `--json`.

## Inicio rápido (local)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Los agentes pueden ejecutar la misma comprobación de disponibilidad con `browser({ action: "doctor" })`.

## Solución rápida de problemas

Si `start` falla con `not reachable after start`, primero debe solucionarse la disponibilidad de CDP. Si `start` y `tabs` se ejecutan correctamente, pero `open` o `navigate` falla, el plano de control del navegador está en buen estado y el fallo suele deberse a un bloqueo de la política SSRF de navegación.

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

- `doctor --deep` añade una prueba de instantánea en vivo: resulta útil cuando la disponibilidad básica de CDP es correcta, pero se desea comprobar que la pestaña actual puede inspeccionarse.
- Para un perfil administrado local en ejecución, `status` y `doctor` muestran diagnósticos
  gráficos almacenados en caché de Chrome: clasificación de hardware/software, renderizador,
  backend, dispositivo/controlador, detalles de funciones y estados deshabilitados, y capacidades
  de vídeo acelerado. `openclaw browser --json status` devuelve la carga útil estructurada completa.
  La consulta pasiva del estado nunca inicia Chrome solo para recopilar estos datos.
- `stop` cierra la sesión de control activa y borra las anulaciones temporales de emulación, incluso para `attachOnly` y perfiles CDP remotos en los que OpenClaw no inició el proceso del navegador. En perfiles administrados locales, `stop` también detiene el proceso del navegador iniciado.
- `start --headless` se aplica únicamente a esa solicitud de inicio y solo cuando OpenClaw inicia un navegador administrado local. No reescribe `browser.headless` ni la configuración del perfil y no tiene efecto en un navegador que ya esté en ejecución.
- En hosts Linux sin `DISPLAY` ni `WAYLAND_DISPLAY`, los perfiles administrados locales se ejecutan automáticamente sin interfaz gráfica, a menos que `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` o `browser.profiles.<name>.headless=false` solicite explícitamente un navegador visible.

## Si falta el comando

Si `openclaw browser` es un comando desconocido, compruebe `plugins.allow` en `~/.openclaw/openclaw.json`. Cuando `plugins.allow` esté presente, incluya explícitamente el plugin de navegador integrado, a menos que la configuración ya tenga un bloque raíz `browser`:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Un bloque raíz `browser` explícito (por ejemplo, `browser.enabled=true` o `browser.profiles.<name>`) también activa el plugin de navegador integrado con una lista restrictiva de plugins permitidos.

Relacionado: [Herramienta de navegador](/es/tools/browser#missing-browser-command-or-tool)

## Perfiles

Los perfiles son configuraciones con nombre para el enrutamiento del navegador:

- `openclaw` (valor predeterminado): inicia una instancia dedicada de Chrome administrada por OpenClaw o se conecta a ella (directorio aislado de datos de usuario).
- `user`: controla la sesión existente de Chrome con la sesión iniciada mediante Chrome DevTools MCP.
- perfiles CDP personalizados: apuntan a un punto de conexión CDP local o remoto.

```bash
openclaw browser profiles
openclaw browser system-profiles
openclaw browser system-profiles --browser brave
openclaw browser import-profile --browser chrome --system Default --into imported
openclaw browser import-profile --system "Profile 1" --into work --domains google.com,youtube.com
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Use un perfil específico con `--browser-profile <name>` en cualquier subcomando, por ejemplo, `openclaw browser --browser-profile work tabs`.

En macOS, `system-profiles` enumera los perfiles reales de Chrome, Brave, Edge o Chromium disponibles en el host. `import-profile` descifra sus cookies después de una única solicitud de consentimiento del Llavero de macOS/Touch ID y las inyecta en un perfil nuevo administrado por OpenClaw. Solo importa las cookies; el almacenamiento local e IndexedDB no cambian. Algunas sesiones de Google usan credenciales de sesión vinculadas al dispositivo (DBSC) y pueden seguir requiriendo una nueva autenticación después de la importación.

Cuando la aplicación de macOS utiliza un Gateway local, puede ofrecer esta importación una vez y convertir el perfil aislado importado en el perfil predeterminado para la navegación del agente. La importación siempre requiere un clic explícito; una importación correcta o el descarte de la solicitud impiden que vuelvan a mostrarse solicitudes automáticas, y **Settings → General → Browser login** sigue disponible para volver a importar.

La importación de perfiles del sistema está habilitada de forma predeterminada. Establezca `browser.allowSystemProfileImport=false` para deshabilitar tanto las importaciones desde la CLI como las iniciadas por agentes. La importación es local al host y no puede ejecutarse mediante el proxy de Node del navegador.

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

`tabs` devuelve primero `suggestedTargetId`, seguido del `tabId` estable (como `t1`), la etiqueta opcional y el `targetId` sin procesar. Vuelva a pasar `suggestedTargetId` a `focus`, `close`, las instantáneas y las acciones. Asigne una etiqueta con `open --label`, `tab new --label` o `tab label`; se aceptan etiquetas, identificadores de pestaña, identificadores de destino sin procesar y prefijos únicos de identificadores de destino. El campo de solicitud sigue llamándose `targetId` por compatibilidad, pero acepta cualquiera de estas referencias de pestaña.

Los identificadores de destino sin procesar son identificadores de diagnóstico volátiles, no memoria persistente del agente: cuando Chromium sustituye el destino sin procesar subyacente durante una navegación o el envío de un formulario, OpenClaw mantiene el `tabId`/la etiqueta estable asociado a la pestaña de sustitución cuando puede demostrar la correspondencia. Es preferible usar `suggestedTargetId`.

## Instantáneas, capturas de pantalla y acciones

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

- `--full-page` solo sirve para capturas de página; no puede combinarse con `--ref` ni `--element`.
- Los perfiles `existing-session` / `user` admiten capturas de pantalla de páginas y capturas `--ref` a partir de la salida de las instantáneas, pero no capturas de pantalla mediante `--element` de CSS.
- `--labels` superpone las referencias de la instantánea actual en la captura de pantalla. En perfiles basados en Playwright, funciona con `--full-page` (superposición de página completa), `--ref` (superposición de recorte de elemento mediante una referencia ARIA) y `--element` (superposición de recorte de elemento mediante un selector CSS); en los modos de recorte de elementos, las etiquetas se proyectan con respecto al elemento. La respuesta también incluye una matriz `annotations` (se omite cuando está vacía) con el cuadro delimitador de cada referencia: `ref`, `number`, `role`, `name` opcional y `box: {x, y, width, height}` en el espacio de coordenadas de la imagen capturada (ventana gráfica / página completa / relativo al elemento).
  Los perfiles `existing-session` representan una superposición de chrome-mcp en las capturas de pantalla de páginas, pero no utilizan el asistente de proyección de Playwright ni incluyen `annotations`; las capturas mediante `--element` de CSS no se admiten en ellos. Sin Playwright ni chrome-mcp, no están disponibles las capturas de pantalla con etiquetas.
- `snapshot --urls` añade los destinos de enlaces detectados a las instantáneas de IA para que los agentes puedan seleccionar destinos de navegación directa en lugar de deducirlos únicamente a partir del texto del enlace.

Navegar/hacer clic/escribir (automatización de la interfaz de usuario basada en referencias):

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

`evaluate --fn` acepta el código fuente de una función, una expresión o un cuerpo de instrucciones. Los cuerpos de instrucciones se encapsulan como funciones asíncronas, por lo que debe usarse `return` para el valor que se desea obtener. Use `--timeout-ms` cuando la función ejecutada en la página pueda necesitar más tiempo que el tiempo de espera predeterminado de evaluación. `browser.evaluateEnabled=false` (valor predeterminado: `true`) deshabilita tanto `evaluate` como `wait --fn`.

Las respuestas de las acciones devuelven el `targetId` sin procesar actual después de una sustitución de página provocada por una acción cuando OpenClaw puede demostrar cuál es la pestaña de sustitución. No obstante, los scripts deben almacenar y pasar `suggestedTargetId`/etiquetas para los flujos de trabajo de larga duración.

Asistentes para archivos y cuadros de diálogo:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

Los perfiles administrados de Chrome guardan las descargas ordinarias iniciadas al hacer clic en el directorio de descargas de OpenClaw (`/tmp/openclaw/downloads` de forma predeterminada, o la raíz temporal configurada). Use `waitfordownload` o `download` cuando el agente necesite esperar un archivo específico y devolver su ruta; esos procesos de espera explícitos se hacen cargo de la siguiente descarga. Las cargas aceptan archivos de la raíz temporal de cargas de OpenClaw y contenido multimedia entrante administrado por OpenClaw, incluidas referencias `media://inbound/<id>` y `media/inbound/<id>` relativas al entorno aislado. Se rechazan las referencias de contenido multimedia anidadas, el recorrido de directorios y las rutas locales arbitrarias.

Cuando una acción abre un cuadro de diálogo modal, la respuesta de la acción devuelve `blockedByDialog` con `browserState.dialogs.pending`; pase `--dialog-id` para responder directamente. Los cuadros de diálogo gestionados fuera de OpenClaw aparecen en `browserState.dialogs.recent`.

## Estado y almacenamiento

Ventana gráfica y emulación:

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

Utilice el perfil `user` integrado o cree su propio perfil `existing-session`:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

La ruta de sesión existente predeterminada corresponde a la conexión automática de Chrome MCP solo en el host. Si el navegador ya se está ejecutando con un endpoint de DevTools, proporcione `--cdp-url` para que Chrome MCP se conecte a ese endpoint. Para Docker, Browserless u otras configuraciones remotas donde no se necesite la semántica de Chrome MCP, utilice en su lugar un perfil CDP.

Limitaciones actuales de las sesiones existentes:

- Las acciones basadas en instantáneas utilizan referencias, no selectores CSS.
- Las solicitudes `act` compatibles utilizan un valor predeterminado integrado de 60000 ms cuando los invocadores omiten `timeoutMs`; el valor `timeoutMs` por llamada sigue teniendo prioridad.
- `click` solo admite el clic izquierdo.
- `type` no admite `slowly=true`.
- `press` no admite `delayMs`.
- `hover`, `scrollintoview`, `drag`, `select` y `fill` rechazan las anulaciones del tiempo de espera por llamada; `evaluate` acepta `--timeout-ms`.
- `select` solo admite un valor.
- `wait --load networkidle` no es compatible (funciona en perfiles administrados y CDP sin procesar/remotos).
- Las cargas de archivos requieren `--ref` / `--input-ref`, no admiten `--element` de CSS y permiten un archivo a la vez.
- Los hooks de diálogo no admiten `--timeout`.
- Las capturas de pantalla admiten capturas de página y `--ref`, pero no `--element` de CSS.
- `responsebody`, la interceptación de descargas, la exportación a PDF y las acciones por lotes todavía requieren un navegador administrado o un perfil CDP sin procesar.

## Control remoto del navegador (proxy del host Node)

Si el Gateway se ejecuta en una máquina distinta de la del navegador, ejecute un **host Node** en la máquina que tenga Chrome/Brave/Edge/Chromium. El Gateway actúa como proxy de las acciones del navegador hacia ese Node; no se requiere un servidor independiente de control del navegador.

Utilice `gateway.nodes.browser.mode` para controlar el enrutamiento automático y `gateway.nodes.browser.node` para fijar un Node específico si hay varios conectados.

Seguridad y configuración remota: [Herramienta de navegador](/es/tools/browser), [Acceso remoto](/es/gateway/remote), [Tailscale](/es/gateway/tailscale), [Seguridad](/es/gateway/security)

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Navegador](/es/tools/browser)
