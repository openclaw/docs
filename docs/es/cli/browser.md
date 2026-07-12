---
read_when:
    - Usas `openclaw browser` y quieres ejemplos de tareas comunes
    - Se desea controlar un navegador que se ejecuta en otra máquina mediante un host Node
    - Quieres conectarte a tu Chrome local con la sesión iniciada mediante Chrome MCP
summary: Referencia de la CLI para `openclaw browser` (ciclo de vida, perfiles, pestañas, acciones, estado y depuración)
title: Navegador
x-i18n:
    generated_at: "2026-07-12T14:21:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 50e9da3fa6899d830e38d8548313c70b5615c2ed3d70dd372a1fe147ff5db053
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

Gestiona la superficie de control del navegador de OpenClaw y ejecuta acciones del navegador: ciclo de vida, perfiles, pestañas, instantáneas, capturas de pantalla, navegación, entrada, emulación de estado y depuración.

Relacionado: [Herramienta de navegador](/es/tools/browser)

## Opciones comunes

- `--url <gatewayWsUrl>`: URL de WebSocket del Gateway (de forma predeterminada, usa la configuración).
- `--token <token>`: token del Gateway (si es necesario).
- `--timeout <ms>`: tiempo de espera de la solicitud en ms (valor predeterminado: `30000`).
- `--expect-final`: espera una respuesta final del Gateway.
- `--browser-profile <name>`: elige un perfil de navegador (valor predeterminado: `openclaw` o `browser.defaultProfile`).
- `--json`: salida legible por máquinas (cuando sea compatible). Esta es una opción del navegador, por lo que
  debe colocarse antes del subcomando para evitar ambigüedades, como en
  `openclaw browser --json status`. También funciona al final, como en
  `openclaw browser status --json`, cuando el comando secundario seleccionado no
  define su propia opción `--json`.

## Inicio rápido (local)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Los agentes pueden ejecutar la misma comprobación de disponibilidad con `browser({ action: "doctor" })`.

## Solución rápida de problemas

Si `start` falla con `not reachable after start`, primero solucione los problemas de disponibilidad de CDP. Si `start` y `tabs` se ejecutan correctamente, pero `open` o `navigate` fallan, el plano de control del navegador funciona correctamente y el fallo suele deberse a un bloqueo de la política SSRF de navegación.

Secuencia mínima:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Orientación detallada: [Solución de problemas del navegador](/es/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

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

- `doctor --deep` añade una prueba de instantánea en vivo: resulta útil cuando la disponibilidad básica de CDP es correcta, pero se necesita comprobar que se puede inspeccionar la pestaña actual.
- Para un perfil local administrado que esté en ejecución, `status` y `doctor` informan de los diagnósticos
  gráficos almacenados en caché de Chrome: clasificación de hardware/software, renderizador,
  backend, dispositivo/controlador, detalles de las funciones y del estado deshabilitado, y capacidades
  de vídeo acelerado. `openclaw browser --json status` devuelve la carga útil estructurada completa.
  La consulta pasiva del estado nunca inicia Chrome únicamente para recopilar estos datos.
- `stop` cierra la sesión de control activa y elimina las anulaciones temporales de emulación, incluso para perfiles `attachOnly` y CDP remotos en los que OpenClaw no haya iniciado el proceso del navegador. Para los perfiles locales administrados, `stop` también detiene el proceso del navegador generado.
- `start --headless` solo se aplica a esa solicitud de inicio y únicamente cuando OpenClaw inicia un navegador local administrado. No modifica `browser.headless` ni la configuración del perfil y no tiene efecto si el navegador ya está en ejecución.
- En hosts Linux sin `DISPLAY` ni `WAYLAND_DISPLAY`, los perfiles locales administrados se ejecutan automáticamente sin interfaz gráfica, salvo que `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` o `browser.profiles.<name>.headless=false` soliciten explícitamente un navegador visible.

## Si falta el comando

Si `openclaw browser` es un comando desconocido, compruebe `plugins.allow` en `~/.openclaw/openclaw.json`. Cuando `plugins.allow` esté presente, incluya explícitamente el plugin de navegador integrado, salvo que la configuración ya tenga un bloque raíz `browser`:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Un bloque raíz `browser` explícito (por ejemplo, `browser.enabled=true` o `browser.profiles.<name>`) también activa el plugin de navegador integrado cuando existe una lista restrictiva de plugins permitidos.

Relacionado: [Herramienta de navegador](/es/tools/browser#missing-browser-command-or-tool)

## Perfiles

Los perfiles son configuraciones con nombre para el enrutamiento del navegador:

- `openclaw` (valor predeterminado): inicia una instancia dedicada de Chrome administrada por OpenClaw o se conecta a ella (directorio de datos de usuario aislado).
- `user`: controla la sesión existente de Chrome con la sesión iniciada mediante Chrome DevTools MCP.
- perfiles CDP personalizados: apuntan a un endpoint CDP local o remoto.

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

Utilice un perfil específico con `--browser-profile <name>` en cualquier subcomando; por ejemplo, `openclaw browser --browser-profile work tabs`.

En macOS, `system-profiles` enumera los perfiles reales de Chrome, Brave, Edge o Chromium disponibles en el host. `import-profile` descifra sus cookies después de una única solicitud de consentimiento de macOS Keychain/Touch ID y las inyecta en un nuevo perfil administrado por OpenClaw. Solo importa cookies; el almacenamiento local e IndexedDB no se modifican. Algunas sesiones de Google utilizan credenciales de sesión vinculadas al dispositivo (DBSC) y pueden seguir requiriendo una nueva autenticación después de la importación.

Cuando la aplicación de macOS utiliza un Gateway local, puede ofrecer esta importación una vez y establecer el perfil importado aislado como predeterminado para la navegación del agente. La importación siempre requiere un clic explícito; si se completa o se descarta, se suprimen las solicitudes automáticas posteriores, y **Settings → General → Browser login** sigue disponible para volver a importar.

La importación de perfiles del sistema está habilitada de forma predeterminada. Establezca `browser.allowSystemProfileImport=false` para deshabilitar tanto las importaciones desde la CLI como las iniciadas por agentes. La importación es local al host y no puede ejecutarse mediante el proxy del Node del navegador.

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

`tabs` devuelve primero `suggestedTargetId`, después el `tabId` estable (como `t1`), la etiqueta opcional y el `targetId` sin procesar. Pase `suggestedTargetId` de nuevo a `focus`, `close`, las instantáneas y las acciones. Asigne una etiqueta con `open --label`, `tab new --label` o `tab label`; se aceptan etiquetas, identificadores de pestaña, identificadores de destino sin procesar y prefijos únicos de identificadores de destino. El campo de solicitud sigue llamándose `targetId` por compatibilidad, pero acepta cualquiera de estas referencias de pestaña.

Los identificadores de destino sin procesar son referencias de diagnóstico volátiles, no memoria duradera del agente: cuando Chromium sustituye el destino subyacente sin procesar durante una navegación o el envío de un formulario, OpenClaw mantiene el `tabId` o la etiqueta estable asociado a la pestaña sustituta cuando puede demostrar la coincidencia. Se recomienda utilizar `suggestedTargetId`.

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

- `--full-page` solo sirve para capturas de páginas; no puede combinarse con `--ref` ni `--element`.
- Los perfiles `existing-session` y `user` admiten capturas de pantalla de páginas y capturas `--ref` a partir de la salida de las instantáneas, pero no capturas CSS con `--element`.
- `--labels` superpone las referencias de la instantánea actual en la captura de pantalla. En perfiles basados en Playwright, funciona con `--full-page` (superposición de página completa), `--ref` (superposición de recorte de elemento mediante referencia ARIA) y `--element` (superposición de recorte de elemento mediante selector CSS); en los modos de recorte de elemento, las etiquetas se proyectan en relación con el elemento. La respuesta también incluye una matriz `annotations` (se omite cuando está vacía) con el cuadro delimitador de cada referencia: `ref`, `number`, `role`, `name` opcional y `box: {x, y, width, height}` en el espacio de coordenadas de la imagen capturada (ventana gráfica / página completa / relativo al elemento).
  Los perfiles `existing-session` renderizan una superposición de chrome-mcp en las capturas de pantalla de páginas, pero no utilizan el auxiliar de proyección de Playwright ni incluyen `annotations`; las capturas CSS con `--element` no son compatibles. Sin Playwright ni chrome-mcp, no se pueden generar capturas de pantalla con etiquetas.
- `snapshot --urls` añade los destinos de los enlaces descubiertos a las instantáneas para IA, de modo que los agentes puedan elegir destinos de navegación directa en lugar de deducirlos únicamente a partir del texto del enlace.

Navegar, hacer clic y escribir (automatización de la interfaz basada en referencias):

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

`evaluate --fn` acepta el código fuente de una función, una expresión o el cuerpo de una sentencia. Los cuerpos de sentencias se encapsulan como funciones asíncronas, por lo que debe utilizarse `return` para el valor que se quiera devolver. Utilice `--timeout-ms` cuando la función del lado de la página pueda necesitar más tiempo que el límite predeterminado de evaluación. `browser.evaluateEnabled=false` (valor predeterminado: `true`) deshabilita tanto `evaluate` como `wait --fn`.

Las respuestas de las acciones devuelven el `targetId` sin procesar actual después de una sustitución de página provocada por una acción cuando OpenClaw puede demostrar cuál es la pestaña sustituta. Aun así, los scripts deben almacenar y pasar `suggestedTargetId` o las etiquetas en los flujos de trabajo de larga duración.

Auxiliares para archivos y cuadros de diálogo:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

Los perfiles administrados de Chrome guardan las descargas normales iniciadas mediante un clic en el directorio de descargas de OpenClaw (`/tmp/openclaw/downloads` de forma predeterminada o la raíz temporal configurada). Utilice `waitfordownload` o `download` cuando el agente deba esperar un archivo específico y devolver su ruta; estas esperas explícitas se hacen cargo de la siguiente descarga. Las cargas aceptan archivos de la raíz temporal de cargas de OpenClaw y contenido multimedia entrante administrado por OpenClaw, incluidas referencias `media://inbound/<id>` y `media/inbound/<id>` relativas al entorno aislado. Se rechazan las referencias multimedia anidadas, el recorrido de rutas y las rutas locales arbitrarias.

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

Cookies y almacenamiento:

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

Use el perfil integrado `user` o cree su propio perfil `existing-session`:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

La ruta predeterminada de existing-session es la conexión automática de Chrome MCP exclusiva del host. Si el navegador ya se está ejecutando con un endpoint de DevTools, proporcione `--cdp-url` para que Chrome MCP se conecte a ese endpoint en su lugar. Para Docker, Browserless u otras configuraciones remotas donde no se necesite la semántica de Chrome MCP, use en su lugar un perfil CDP.

Limitaciones actuales de existing-session:

- Las acciones basadas en instantáneas usan referencias, no selectores CSS.
- Cuando los emisores de llamadas omiten `timeoutMs`, `browser.actionTimeoutMs` establece de forma predeterminada en 60000 ms las solicitudes `act` compatibles; el valor `timeoutMs` de cada llamada sigue teniendo prioridad.
- `click` solo admite el clic izquierdo.
- `type` no admite `slowly=true`.
- `press` no admite `delayMs`.
- `hover`, `scrollintoview`, `drag`, `select` y `fill` rechazan las anulaciones del tiempo de espera por llamada; `evaluate` acepta `--timeout-ms`.
- `select` solo admite un valor.
- `wait --load networkidle` no es compatible (funciona en perfiles CDP administrados y sin procesar/remotos).
- Las cargas de archivos requieren `--ref` / `--input-ref`, no admiten `--element` de CSS y permiten un archivo a la vez.
- Los hooks de los cuadros de diálogo no admiten `--timeout`.
- Las capturas de pantalla admiten capturas de página y `--ref`, pero no `--element` de CSS.
- `responsebody`, la interceptación de descargas, la exportación a PDF y las acciones por lotes aún requieren un navegador administrado o un perfil CDP sin procesar.

## Control remoto del navegador (proxy del host Node)

Si el Gateway se ejecuta en una máquina distinta de la del navegador, ejecute un **host Node** en la máquina que tenga Chrome/Brave/Edge/Chromium. El Gateway redirige las acciones del navegador a ese Node; no se necesita un servidor independiente de control del navegador.

Use `gateway.nodes.browser.mode` para controlar el enrutamiento automático y `gateway.nodes.browser.node` para fijar un Node específico si hay varios conectados.

Seguridad y configuración remota: [Herramienta de navegador](/es/tools/browser), [Acceso remoto](/es/gateway/remote), [Tailscale](/es/gateway/tailscale), [Seguridad](/es/gateway/security)

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Navegador](/es/tools/browser)
