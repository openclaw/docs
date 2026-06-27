---
read_when:
    - Automatizar con scripts o depurar el navegador del agente mediante la API de control local
    - Buscando la referencia de la CLI `openclaw browser`
    - Agregar automatización de navegador personalizada con instantáneas y referencias
summary: API de control del navegador de OpenClaw, referencia de CLI y acciones de scripting
title: API de control del navegador
x-i18n:
    generated_at: "2026-06-27T13:00:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ccfd1ec996b0fc211e2aefa0554e0fa5c7b0899ca981836134a3741b38bf7600
    source_path: tools/browser-control.md
    workflow: 16
---

For configuración, configuración y solución de problemas, consulta [Browser](/es/tools/browser).
Esta página es la referencia para la API HTTP de control local, la CLI `openclaw browser`
y los patrones de scripting (instantáneas, referencias, esperas, flujos de depuración).

## API de control (opcional)

Solo para integraciones locales, el Gateway expone una pequeña API HTTP de loopback.
Este servidor independiente es opcional: establece la variable de entorno
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` en el entorno del servicio del Gateway
y reinicia el Gateway antes de que los endpoints HTTP estén disponibles. Sin
esta variable, el runtime de control del navegador sigue funcionando mediante la CLI y
las herramientas del agente, pero nada escucha en el puerto de control de loopback.

- Estado/iniciar/detener: `GET /`, `POST /start`, `POST /stop`
- Pestañas: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Instantánea/captura de pantalla: `GET /snapshot`, `POST /screenshot`
- Acciones: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Descargas: `POST /download`, `POST /wait/download`
- Permisos: `POST /permissions/grant`
- Depuración: `GET /console`, `POST /pdf`
- Depuración: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Red: `POST /response/body`
- Estado: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Estado: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Ajustes: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Todos los endpoints aceptan `?profile=<name>`. `POST /start?headless=true` solicita un
lanzamiento headless único para perfiles locales administrados sin cambiar la
configuración persistida del navegador; los perfiles de solo adjuntar, CDP remoto y sesión existente rechazan
esa anulación porque OpenClaw no inicia esos procesos de navegador.

Para endpoints de pestañas, `targetId` es el nombre del campo de compatibilidad. Es preferible pasar
`suggestedTargetId` desde `GET /tabs` o `POST /tabs/open`; también se aceptan etiquetas e identificadores `tabId`
como `t1`. Los identificadores de destino CDP sin procesar y los prefijos únicos de identificadores de destino sin procesar
siguen funcionando, pero son identificadores de diagnóstico volátiles.

Si está configurada la autenticación del Gateway con secreto compartido, las rutas HTTP del navegador también requieren autenticación:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` o autenticación HTTP Basic con esa contraseña

Notas:

- Esta API independiente de navegador en loopback **no** consume encabezados de identidad de trusted-proxy ni de
  Tailscale Serve.
- Si `gateway.auth.mode` es `none` o `trusted-proxy`, estas rutas de navegador en loopback
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
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` se usó con un tipo de acción no admitido.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (o `wait --fn`) está deshabilitado por la configuración.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): el `targetId` de nivel superior o por lotes entra en conflicto con el destino de la solicitud.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): la acción no es compatible con perfiles de sesión existente.

Otros fallos de runtime aún pueden devolver `{ "error": "<message>" }` sin un
campo `code`.

### Requisito de Playwright

Algunas funciones (navigate/act/instantánea de IA/instantánea de rol, capturas de pantalla de elementos,
PDF) requieren Playwright. Si Playwright no está instalado, esos endpoints devuelven
un error 501 claro.

Lo que todavía funciona sin Playwright:

- Instantáneas ARIA
- Instantáneas de accesibilidad de estilo rol (`--interactive`, `--compact`,
  `--depth`, `--efficient`) cuando hay un WebSocket CDP por pestaña disponible. Esto es
  un fallback para inspección y descubrimiento de refs; Playwright sigue siendo el motor principal
  de acciones.
- Capturas de pantalla de página para el navegador administrado `openclaw` cuando hay un WebSocket CDP por pestaña
  disponible
- Capturas de pantalla de página para perfiles `existing-session` / Chrome MCP
- Capturas de pantalla basadas en refs de `existing-session` (`--ref`) desde la salida de snapshot

Lo que todavía necesita Playwright:

- `navigate`
- `act`
- Instantáneas de IA que dependen del formato nativo de instantánea de IA de Playwright
- Capturas de pantalla de elementos con selector CSS (`--element`)
- exportación completa del navegador a PDF

Las capturas de pantalla de elementos también rechazan `--full-page`; la ruta devuelve `fullPage is
not supported for element screenshots`.

Si ves `Playwright is not available in this gateway build`, al Gateway empaquetado
le falta la dependencia principal del runtime de navegador. Reinstala o actualiza
OpenClaw y luego reinicia el Gateway. Para Docker, instala también los binarios del navegador
Chromium como se muestra a continuación.

#### Instalación de Playwright en Docker

Si tu Gateway se ejecuta en Docker, evita `npx playwright` (conflictos de anulación de npm).
Para imágenes personalizadas, incorpora Chromium en la imagen:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

Para una imagen existente, instala mediante la CLI incluida en su lugar:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Para persistir las descargas del navegador, establece `PLAYWRIGHT_BROWSERS_PATH` (por ejemplo,
`/home/node/.cache/ms-playwright`) y asegúrate de que `/home/node` persista mediante
`OPENCLAW_HOME_VOLUME` o un bind mount. OpenClaw detecta automáticamente el Chromium persistido
en Linux. Consulta [Docker](/es/install/docker).

## Cómo funciona (interno)

Un pequeño servidor de control en loopback acepta solicitudes HTTP y se conecta a navegadores basados en Chromium mediante CDP. Las acciones avanzadas (click/type/snapshot/PDF) pasan por Playwright sobre CDP; cuando falta Playwright, solo están disponibles las operaciones que no son de Playwright. El agente ve una interfaz estable mientras los navegadores y perfiles locales/remotos se intercambian libremente por debajo.

## Referencia rápida de la CLI

Todos los comandos aceptan `--browser-profile <name>` para apuntar a un perfil específico, y `--json` para salida legible por máquinas.

<AccordionGroup>

<Accordion title="Conceptos básicos: estado, pestañas, abrir/enfocar/cerrar">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # one-shot local managed headless launch
openclaw browser stop            # also clears emulation on attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # shortcut for current tab
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Inspección: captura de pantalla, instantánea, consola, errores, solicitudes">

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
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Acciones: navegar, hacer clic, escribir, arrastrar, esperar, evaluar">

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

<Accordion title="Estado: cookies, almacenamiento, offline, encabezados, geo, dispositivo">

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

- `upload` y `dialog` son llamadas de **preparación**; ejecútalas antes del clic/pulsación que activa el selector/diálogo. Si una acción abre un modal, la respuesta de la acción incluye `blockedByDialog` y `browserState.dialogs.pending`; pasa ese `dialogId` para responder directamente. Los diálogos gestionados fuera de OpenClaw aparecen bajo `browserState.dialogs.recent`.
- `click`/`type`/etc requieren una `ref` de `snapshot` (numérica `12`, ref de rol `e12` o ref ARIA accionable `ax12`). Los selectores CSS no se admiten intencionadamente para acciones. Usa `click-coords` cuando la posición visible del viewport sea el único destino fiable.
- Las rutas de descarga y trace están restringidas a las raíces temporales de OpenClaw: `/tmp/openclaw{,/downloads}` (fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` acepta archivos desde la raíz temporal de subidas de OpenClaw y
  medios entrantes administrados por OpenClaw. Los medios entrantes administrados pueden referenciarse como
  `media://inbound/<id>`, ruta relativa al sandbox `media/inbound/<id>` o una ruta
  resuelta dentro del directorio de medios entrantes administrados. Las refs de medios anidadas,
  traversal, symlinks, hardlinks y rutas locales arbitrarias siguen rechazándose.
- `upload` también puede establecer entradas de archivo directamente mediante `--input-ref` o `--element`.

Los ids de pestaña estables y las etiquetas sobreviven al reemplazo de raw-target de Chromium cuando OpenClaw
puede probar la pestaña de reemplazo, como la misma URL o una sola pestaña antigua que se convierte en una
sola pestaña nueva tras el envío de un formulario. Los ids de destino sin procesar siguen siendo volátiles; prefiere
`suggestedTargetId` de `tabs` en scripts.

Resumen de flags de snapshot:

- `--format ai` (predeterminado con Playwright): instantánea de IA con refs numéricas (`aria-ref="<n>"`).
- `--format aria`: árbol de accesibilidad con refs `axN`. Cuando Playwright está disponible, OpenClaw enlaza las refs con ids DOM de backend a la página activa para que las acciones posteriores puedan usarlas; de lo contrario, trata la salida solo como inspección.
- `--efficient` (o `--mode efficient`): preset compacto de instantánea de roles. Configura `browser.snapshotDefaults.mode: "efficient"` para que sea el valor predeterminado (consulta [configuración de Gateway](/es/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` fuerzan una instantánea de roles con refs `ref=e12`. `--frame "<iframe>"` limita las instantáneas de roles a un iframe.
- Con Playwright, `--labels` añade una captura de pantalla con etiquetas de ref superpuestas
  (imprime `MEDIA:<path>`) además de un arreglo `annotations` con el cuadro
  delimitador de cada ref. En `screenshot`, las etiquetas respaldadas por Playwright funcionan con `--full-page`,
  `--ref` y `--element`; en `snapshot`, la captura de pantalla acompañante sigue siendo
  solo del viewport. Los perfiles existing-session/chrome-mcp renderizan etiquetas superpuestas en
  capturas de pantalla de página, pero no devuelven `annotations` ni usan el helper de proyección
  full-page/ref/element de Playwright. Sin Playwright o chrome-mcp,
  las capturas de pantalla etiquetadas no están disponibles.
- `--urls` añade los destinos de enlaces descubiertos a las instantáneas de IA.

## Instantáneas y refs

OpenClaw admite dos estilos de "instantánea":

- **Instantánea de IA (refs numéricas)**: `openclaw browser snapshot` (predeterminado; `--format ai`)
  - Salida: una instantánea de texto que incluye refs numéricas.
  - Acciones: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Internamente, la ref se resuelve mediante `aria-ref` de Playwright.

- **Instantánea de roles (refs de rol como `e12`)**: `openclaw browser snapshot --interactive` (o `--compact`, `--depth`, `--selector`, `--frame`)
  - Salida: una lista/árbol basada en roles con `[ref=e12]` (y `[nth=1]` opcional).
  - Acciones: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Internamente, la ref se resuelve mediante `getByRole(...)` (más `nth()` para duplicados).
  - Añade `--labels` para incluir una captura de pantalla con etiquetas `e12` superpuestas. En
    perfiles respaldados por Playwright, esto también devuelve metadatos de cuadro delimitador por ref
    (`annotations[]`).
  - Añade `--urls` cuando el texto del enlace sea ambiguo y el agente necesite objetivos de
    navegación concretos.

- **Instantánea ARIA (refs ARIA como `ax12`)**: `openclaw browser snapshot --format aria`
  - Salida: el árbol de accesibilidad como nodos estructurados.
  - Acciones: `openclaw browser click ax12` funciona cuando la ruta de instantánea puede enlazar
    la ref mediante Playwright e ids DOM de backend de Chrome.
- Si Playwright no está disponible, las instantáneas ARIA aún pueden ser útiles para
  inspección, pero las refs podrían no ser accionables. Vuelve a tomar la instantánea con `--format ai`
  o `--interactive` cuando necesites refs de acción.
- Prueba Docker para la ruta de fallback raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  inicia Chromium con CDP, ejecuta `browser doctor --deep` y verifica que las instantáneas de roles
  incluyan URLs de enlaces, elementos clicables promovidos por cursor y metadatos de iframe.

Comportamiento de refs:

- Las refs **no son estables entre navegaciones**; si algo falla, vuelve a ejecutar `snapshot` y usa una ref nueva.
- `/act` devuelve el `targetId` bruto actual después de un reemplazo activado por acción
  cuando puede probar la pestaña de reemplazo. Sigue usando ids/etiquetas de pestaña estables para
  comandos posteriores.
- Si la instantánea de roles se tomó con `--frame`, las refs de rol quedan limitadas a ese iframe hasta la siguiente instantánea de roles.
- Las refs `axN` desconocidas u obsoletas fallan rápido en vez de caer al selector
  `aria-ref` de Playwright. Ejecuta una instantánea nueva en la misma pestaña cuando
  ocurra eso.

## Mejoras de espera

Puedes esperar por más que solo tiempo/texto:

- Esperar una URL (globs admitidos por Playwright):
  - `openclaw browser wait --url "**/dash"`
- Esperar el estado de carga:
  - `openclaw browser wait --load networkidle`
  - Admitido en perfiles administrados `openclaw` y CDP bruto/remoto. Los perfiles `user` y `existing-session` rechazan `networkidle`; usa esperas con `--url`, `--text`, un selector o `--fn` allí.
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
2. Usa `click <ref>` / `type <ref>` (prefiere refs de rol en modo interactivo)
3. Si aún falla: `openclaw browser highlight <ref>` para ver a qué está apuntando Playwright
4. Si la página se comporta de forma extraña:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Para depuración profunda: graba una traza:
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

Las instantáneas de roles en JSON incluyen `refs` más un pequeño bloque `stats` (lines/chars/refs/interactive) para que las herramientas puedan razonar sobre el tamaño y la densidad del payload.

## Controles de estado y entorno

Estos son útiles para flujos de trabajo de "hacer que el sitio se comporte como X":

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Almacenamiento: `storage local|session get|set|clear`
- Sin conexión: `set offline on|off`
- Encabezados: `set headers --headers-json '{"X-Debug":"1"}'` (el legado `set headers --json '{"X-Debug":"1"}'` sigue siendo compatible)
- Autenticación básica HTTP: `set credentials user pass` (o `--clear`)
- Geolocalización: `set geo <lat> <lon> --origin "https://example.com"` (o `--clear`)
- Medios: `set media dark|light|no-preference|none`
- Zona horaria / configuración regional: `set timezone ...`, `set locale ...`
- Dispositivo / viewport:
  - `set device "iPhone 14"` (presets de dispositivo de Playwright)
  - `set viewport 1280 720`

## Seguridad y privacidad

- El perfil de navegador openclaw puede contener sesiones iniciadas; trátalo como sensible.
- `browser act kind=evaluate` / `openclaw browser evaluate` y `wait --fn`
  ejecutan JavaScript arbitrario en el contexto de la página. La inyección de prompts puede dirigir
  esto. Desactívalo con `browser.evaluateEnabled=false` si no lo necesitas.
- `openclaw browser evaluate --fn` acepta el código fuente de una función, una expresión o
  el cuerpo de una sentencia. Los cuerpos de sentencias se envuelven como funciones async, así que usa
  `return` para el valor que quieras recuperar. Usa `--timeout-ms <ms>` cuando la
  función del lado de la página pueda necesitar más tiempo que el timeout de evaluate predeterminado.
- Para inicios de sesión y notas anti-bot (X/Twitter, etc.), consulta [Inicio de sesión en navegador + publicación en X/Twitter](/es/tools/browser-login).
- Mantén privado el host de Gateway/node (loopback o solo tailnet).
- Los endpoints CDP remotos son potentes; encapsúlalos en túnel y protégelos.

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

- [Navegador](/es/tools/browser) - visión general, configuración, perfiles, seguridad
- [Inicio de sesión en navegador](/es/tools/browser-login) - iniciar sesión en sitios
- [Solución de problemas de navegador en Linux](/es/tools/browser-linux-troubleshooting)
- [Solución de problemas de navegador WSL2 para CDP remoto en Windows](/es/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
