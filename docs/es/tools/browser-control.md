---
read_when:
    - Programar o depurar el navegador del agente mediante la API de control local
    - Buscando la referencia de CLI de `openclaw browser`
    - Agregar automatización personalizada del navegador con snapshots y refs
summary: API de control del navegador de OpenClaw, referencia de CLI y acciones de scripting
title: API de control del navegador
x-i18n:
    generated_at: "2026-07-05T11:43:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72412826cdf61f59fc9470be41834c9a35b0af2dff162fcc401e9d0f5790a2bb
    source_path: tools/browser-control.md
    workflow: 16
---

Para la configuración, los ajustes y la solución de problemas, consulta [Browser](/es/tools/browser).
Esta página es la referencia para la API HTTP de control local, la CLI `openclaw browser`
y los patrones de scripting (snapshots, refs, esperas, flujos de depuración).

## API de control (opcional)

Solo para integraciones locales, el Gateway expone una pequeña API HTTP de loopback.
Este servidor independiente es opcional: establece la variable de entorno
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` en el entorno del servicio gateway
y reinicia el gateway antes de que los endpoints HTTP estén disponibles. Sin
esta variable, el runtime de control del navegador sigue funcionando mediante la CLI y
las herramientas del agente, pero nada escucha en el puerto de control de loopback.

- Estado/iniciar/detener: `GET /`, `GET /doctor`, `POST /start`, `POST /stop`, `POST /reset-profile`
- Perfiles: `GET /profiles`, `POST /profiles/create`, `DELETE /profiles/:name`
- Pestañas: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`, `POST /tabs/action`
- Snapshot/captura de pantalla: `GET /snapshot`, `POST /screenshot`
- Acciones: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Descargas: `POST /download`, `POST /wait/download`
- Permisos: `POST /permissions/grant`
- Depuración: `GET /console`, `POST /pdf`
- Depuración: `GET /errors`, `GET /requests`, `GET /dialogs`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Red: `POST /response/body`
- Estado: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Estado: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Ajustes: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

`POST /tabs/action` es la forma por lotes que la CLI usa internamente para los
subcomandos de `browser tab` (`{"action":"new"|"label"|"select"|"close"|"list", ...}`);
prefiere las rutas de pestaña de propósito único anteriores al crear scripts directamente.

Todos los endpoints aceptan `?profile=<name>`. `POST /start?headless=true` solicita un
lanzamiento headless de un solo uso para perfiles gestionados locales sin cambiar la
configuración persistente del navegador; los perfiles de solo conexión, CDP remoto y
sesión existente rechazan esa anulación porque OpenClaw no lanza esos procesos de navegador.

Para endpoints de pestañas, `targetId` es el nombre del campo de compatibilidad. Prefiere pasar
`suggestedTargetId` desde `GET /tabs` o `POST /tabs/open`; también se aceptan etiquetas y
identificadores `tabId` como `t1`. Los ids de destino CDP sin procesar y los prefijos únicos
de ids de destino sin procesar siguen funcionando, pero son identificadores de diagnóstico volátiles.

Si la autenticación del gateway con secreto compartido está configurada, las rutas HTTP del navegador también requieren autenticación:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` o autenticación HTTP Basic con esa contraseña

Notas:

- Esta API de navegador de loopback independiente **no** consume encabezados de identidad de proxy de confianza ni de Tailscale Serve.
- Si `gateway.auth.mode` es `none` o `trusted-proxy`, estas rutas de navegador de loopback
  no heredan esos modos portadores de identidad; mantenlas solo en loopback.

### Contrato de errores de `/act`

`POST /act` usa una respuesta de error estructurada para validación a nivel de ruta y
fallos de política:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valores actuales de `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): falta `kind` o no se reconoce.
- `ACT_INVALID_REQUEST` (HTTP 400): el payload de la acción no superó la normalización o validación.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): se usó `selector` con un tipo de acción no compatible.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (o `wait --fn`) está deshabilitado por configuración.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): el `targetId` de nivel superior o por lotes entra en conflicto con el destino de la solicitud.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): la acción no es compatible con perfiles de sesión existente.

Otros fallos de runtime pueden seguir devolviendo `{ "error": "<message>" }` sin un
campo `code`.

### Requisito de Playwright

Algunas funciones (navigate/act/snapshot de IA/snapshot de rol, capturas de pantalla de elementos,
PDF) requieren Playwright. Si Playwright no está instalado, esos endpoints devuelven
un error 501 claro.

Lo que sigue funcionando sin Playwright:

- Snapshots ARIA
- Snapshots de accesibilidad estilo rol (`--interactive`, `--compact`,
  `--depth`, `--efficient`) cuando hay disponible un WebSocket CDP por pestaña. Esto es
  una alternativa para inspección y descubrimiento de refs; Playwright sigue siendo el motor
  de acciones principal.
- Capturas de pantalla de página para el navegador `openclaw` gestionado cuando hay disponible un
  WebSocket CDP por pestaña
- Capturas de pantalla de página para perfiles `existing-session` / Chrome MCP
- Capturas de pantalla basadas en refs de `existing-session` (`--ref`) desde la salida de snapshot

Lo que aún necesita Playwright:

- `navigate`
- `act`
- Snapshots de IA que dependen del formato nativo de snapshot de IA de Playwright
- Capturas de pantalla de elementos con selector CSS (`--element`)
- exportación completa del navegador a PDF

Las capturas de pantalla de elementos también rechazan `--full-page`; la ruta devuelve `fullPage is
not supported for element screenshots`.

Si ves `Playwright is not available in this gateway build`, al Gateway empaquetado
le falta la dependencia central de runtime del navegador. Reinstala o actualiza
OpenClaw y luego reinicia el gateway. Para Docker, instala también los binarios del navegador
Chromium como se muestra a continuación.

#### Instalación de Playwright en Docker

Si tu Gateway se ejecuta en Docker, evita `npx playwright` (conflictos de anulación de npm).
Para imágenes personalizadas, integra Chromium en la imagen:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

Para una imagen existente, instala mediante la CLI incluida en su lugar:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Para persistir las descargas del navegador, establece `PLAYWRIGHT_BROWSERS_PATH` (por ejemplo,
`/home/node/.cache/ms-playwright`) y asegúrate de que `/home/node` se persista mediante
`OPENCLAW_HOME_VOLUME` o un bind mount. OpenClaw detecta automáticamente el Chromium persistido
en Linux. Consulta [Docker](/es/install/docker).

## Cómo funciona (interno)

Un pequeño servidor de control de loopback acepta solicitudes HTTP y se conecta a navegadores basados en Chromium mediante CDP. Las acciones avanzadas (click/type/snapshot/PDF) pasan por Playwright sobre CDP; cuando falta Playwright, solo están disponibles las operaciones que no usan Playwright. El agente ve una interfaz estable mientras los navegadores y perfiles locales/remotos se intercambian libremente por debajo.

## Referencia rápida de la CLI

Todos los comandos aceptan `--browser-profile <name>` para apuntar a un perfil específico, y `--json` para salida legible por máquina.

<AccordionGroup>

<Accordion title="Basics: status, tabs, open/focus/close">

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep    # add a live snapshot probe
openclaw browser start
openclaw browser start --headless # one-shot local managed headless launch
openclaw browser stop            # also clears emulation on attach-only/remote CDP
openclaw browser reset-profile   # moves the profile's browser data to Trash
openclaw browser tabs
openclaw browser tab             # shortcut for current tab
openclaw browser tab new
openclaw browser tab new --label research
openclaw browser tab label abcd1234 research
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Profiles: list, create, delete">

```bash
openclaw browser profiles
openclaw browser create-profile --name research --color "#0066CC"
openclaw browser create-profile --name attach --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser delete-profile --name research
```

</Accordion>

<Accordion title="Inspection: screenshot, snapshot, console, errors, requests">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # or --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser snapshot --out snapshot.txt
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Actions: navigate, click, type, drag, wait, evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # or e12 for role refs
openclaw browser click-coords 120 340        # viewport coordinates
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser upload media://inbound/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="State: cookies, storage, offline, headers, geo, device">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear to remove
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Notas:

- `upload` y `dialog` son llamadas de **preparación**; ejecútalas antes del click/press que activa el selector/cuadro de diálogo. Si una acción abre un modal, la respuesta de la acción incluye `blockedByDialog` y `browserState.dialogs.pending`; pasa ese `dialogId` para responder directamente. Los cuadros de diálogo gestionados fuera de OpenClaw aparecen en `browserState.dialogs.recent`.
- `click`/`type`/etc requieren una `ref` de `snapshot` (numérica `12`, ref de rol `e12` o ref ARIA accionable `ax12`). Los selectores CSS no son compatibles intencionalmente para acciones. Usa `click-coords` cuando la posición visible del viewport sea el único destino fiable.
- Las rutas de descarga y traza están restringidas a las raíces temporales de OpenClaw: `/tmp/openclaw{,/downloads}` (alternativa: `${os.tmpdir()}/openclaw/...`).
- `upload` acepta archivos desde la raíz temporal de subidas de OpenClaw y
  medios entrantes gestionados por OpenClaw. Los medios entrantes gestionados pueden referenciarse como
  `media://inbound/<id>`, `media/inbound/<id>` relativo al sandbox, o una ruta resuelta
  dentro del directorio de medios entrantes gestionados. Las refs de medios anidadas,
  traversal, symlinks, hardlinks y rutas locales arbitrarias se siguen rechazando.
- `upload` también puede establecer entradas de archivo directamente mediante `--input-ref` o `--element`.

Los ids y las etiquetas de pestaña estables sobreviven al reemplazo raw-target de Chromium cuando OpenClaw
puede probar la pestaña de reemplazo, como la misma URL o una sola pestaña antigua que se convierte en una
sola pestaña nueva después del envío de un formulario. Los ids de destino sin procesar siguen siendo volátiles; prefiere
`suggestedTargetId` de `tabs` en los scripts.

Indicadores de instantáneas de un vistazo:

- `--format ai` (predeterminado con Playwright): instantánea de IA con referencias numéricas (`aria-ref="<n>"`).
- `--format aria`: árbol de accesibilidad con referencias `axN`. Cuando Playwright está disponible, OpenClaw vincula las referencias con ids DOM de backend a la página activa para que las acciones de seguimiento puedan usarlas; de lo contrario, trata la salida solo como inspección.
- `--efficient` (o `--mode efficient`): preajuste compacto de instantánea de roles. Configura `browser.snapshotDefaults.mode: "efficient"` para que sea el valor predeterminado (consulta [Configuración del Gateway](/es/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` fuerzan una instantánea de roles con referencias `ref=e12`. `--frame "<iframe>"` limita las instantáneas de roles a un iframe.
- Con Playwright, `--labels` agrega una captura de pantalla con etiquetas de referencia superpuestas
  (imprime `MEDIA:<path>`) más un arreglo `annotations` con el cuadro delimitador de
  cada referencia. En `screenshot`, las etiquetas respaldadas por Playwright funcionan con `--full-page`,
  `--ref` y `--element`; en `snapshot`, la captura de pantalla adjunta permanece
  limitada al viewport. Los perfiles existing-session/chrome-mcp renderizan etiquetas superpuestas en
  capturas de pantalla de página, pero no devuelven `annotations` ni usan el helper de
  proyección de página completa/referencia/elemento de Playwright. Sin Playwright o chrome-mcp,
  las capturas de pantalla etiquetadas no están disponibles.
- `--urls` agrega los destinos de enlaces descubiertos a las instantáneas de IA.

## Instantáneas y referencias

OpenClaw admite dos estilos de "instantánea":

- **Instantánea de IA (referencias numéricas)**: `openclaw browser snapshot` (predeterminado; `--format ai`)
  - Salida: una instantánea de texto que incluye referencias numéricas.
  - Acciones: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Internamente, la referencia se resuelve mediante `aria-ref` de Playwright.

- **Instantánea de roles (referencias de rol como `e12`)**: `openclaw browser snapshot --interactive` (o `--compact`, `--depth`, `--selector`, `--frame`)
  - Salida: una lista/árbol basada en roles con `[ref=e12]` (y `[nth=1]` opcional).
  - Acciones: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Internamente, la referencia se resuelve mediante `getByRole(...)` (más `nth()` para duplicados).
  - Agrega `--labels` para incluir una captura de pantalla con etiquetas `e12` superpuestas. En
    perfiles respaldados por Playwright, esto también devuelve metadatos de cuadro delimitador por referencia
    (`annotations[]`).
  - Agrega `--urls` cuando el texto del enlace sea ambiguo y el agente necesite objetivos de
    navegación concretos.

- **Instantánea ARIA (referencias ARIA como `ax12`)**: `openclaw browser snapshot --format aria`
  - Salida: el árbol de accesibilidad como nodos estructurados.
  - Acciones: `openclaw browser click ax12` funciona cuando la ruta de instantánea puede vincular
    la referencia mediante Playwright e ids DOM de backend de Chrome.
- Si Playwright no está disponible, las instantáneas ARIA aún pueden ser útiles para
  inspección, pero las referencias pueden no ser accionables. Vuelve a tomar una instantánea con `--format ai`
  o `--interactive` cuando necesites referencias de acción.
- Prueba de Docker para la ruta alternativa raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  inicia Chromium con CDP, ejecuta `browser doctor --deep` y verifica que las instantáneas de roles
  incluyan URL de enlaces, elementos clicables promovidos por cursor y metadatos de iframe.

Comportamiento de las referencias:

- Las referencias **no son estables entre navegaciones**; si algo falla, vuelve a ejecutar `snapshot` y usa una referencia nueva.
- `/act` devuelve el `targetId` sin procesar actual después de un reemplazo desencadenado por acción
  cuando puede probar la pestaña de reemplazo. Sigue usando ids/etiquetas de pestaña estables para
  comandos de seguimiento.
- Si la instantánea de roles se tomó con `--frame`, las referencias de rol quedan limitadas a ese iframe hasta la siguiente instantánea de roles.
- Las referencias `axN` desconocidas u obsoletas fallan rápido en lugar de pasar al
  selector `aria-ref` de Playwright. Ejecuta una instantánea nueva en la misma pestaña cuando
  eso ocurra.

## Potenciadores de espera

Puedes esperar más que solo tiempo/texto:

- Esperar URL (globs admitidos por Playwright):
  - `openclaw browser wait --url "**/dash"`
- Esperar estado de carga:
  - `openclaw browser wait --load networkidle`
  - Compatible con perfiles administrados `openclaw` y perfiles CDP sin procesar/remotos. Los perfiles que usan el controlador `existing-session` (incluido el perfil `user` predeterminado) rechazan `networkidle`; usa esperas con `--url`, `--text`, un selector o `--fn` allí.
- Esperar un predicado JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Esperar a que un selector se vuelva visible:
  - `openclaw browser wait "#main"`

Estos se pueden combinar:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Flujos de depuración

Cuando una acción falla (por ejemplo, "not visible", "strict mode violation", "covered"):

1. `openclaw browser snapshot --interactive`
2. Usa `click <ref>` / `type <ref>` (prefiere referencias de rol en modo interactivo)
3. Si sigue fallando: `openclaw browser highlight <ref>` para ver a qué apunta Playwright
4. Si la página se comporta de forma extraña:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Para depuración profunda: graba un trace:
   - `openclaw browser trace start`
   - reproduce el problema
   - `openclaw browser trace stop` (imprime `TRACE:<path>`)

## Salida JSON

`--json` es para scripting y herramientas estructuradas.

Ejemplos:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Las instantáneas de roles en JSON incluyen `refs` más un pequeño bloque `stats` (líneas/caracteres/referencias/interactivo) para que las herramientas puedan razonar sobre el tamaño y la densidad de la carga útil.

## Controles de estado y entorno

Son útiles para flujos de trabajo de "hacer que el sitio se comporte como X":

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Almacenamiento: `storage local|session get|set|clear`
- Sin conexión: `set offline on|off`
- Encabezados: `set headers --headers-json '{"X-Debug":"1"}'` (o la forma posicional `set headers '{"X-Debug":"1"}'`)
- Autenticación básica HTTP: `set credentials user pass` (o `--clear`)
- Geolocalización: `set geo <lat> <lon> --origin "https://example.com"` (o `--clear`)
- Medios: `set media dark|light|no-preference|none`
- Zona horaria / configuración regional: `set timezone ...`, `set locale ...`
- Dispositivo / viewport:
  - `set device "iPhone 14"` (preajustes de dispositivo de Playwright)
  - `set viewport 1280 720`

## Seguridad y privacidad

- El perfil de navegador openclaw puede contener sesiones iniciadas; trátalo como sensible.
- `browser act kind=evaluate` / `openclaw browser evaluate` y `wait --fn`
  ejecutan JavaScript arbitrario en el contexto de la página. La inyección de prompts puede orientar
  esto. Desactívalo con `browser.evaluateEnabled=false` si no lo necesitas.
- `openclaw browser evaluate --fn` acepta el origen de una función, una expresión o
  el cuerpo de una instrucción. Los cuerpos de instrucciones se envuelven como funciones asíncronas, así que usa
  `return` para el valor que quieres recuperar. Usa `--timeout-ms <ms>` cuando la
  función del lado de la página pueda necesitar más que el tiempo de espera de evaluate predeterminado.
- Para notas sobre inicios de sesión y anti-bot (X/Twitter, etc.), consulta [Inicio de sesión en navegador + publicación en X/Twitter](/es/tools/browser-login).
- Mantén privado el host Gateway/node (loopback o solo tailnet).
- Los endpoints CDP remotos son potentes; protégelos y pásalos por túnel.

Ejemplo de modo estricto (bloquear destinos privados/internos de forma predeterminada):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exact allow
    },
  },
}
```

## Relacionado

- [Navegador](/es/tools/browser) - descripción general, configuración, perfiles, seguridad
- [Inicio de sesión en navegador](/es/tools/browser-login) - iniciar sesión en sitios
- [Solución de problemas de Browser en Linux](/es/tools/browser-linux-troubleshooting)
- [Solución de problemas de Browser WSL2](/es/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
