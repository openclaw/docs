---
read_when:
    - Crear scripts o depurar el navegador del agente mediante la API de control local
    - Buscas la referencia de CLI `openclaw browser`
    - Agregar automatización personalizada del navegador con snapshots y referencias
summary: API de control del navegador de OpenClaw, referencia de CLI y acciones de scripting
title: API de control del navegador
x-i18n:
    generated_at: "2026-04-26T11:38:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: bdaaff3d218aeee4c9a01478b3a3380b813ad4578d7eb74120e0745c87af66f6
    source_path: tools/browser-control.md
    workflow: 15
---

Para la configuración, el ajuste y la solución de problemas, consulta [Navegador](/es/tools/browser).
Esta página es la referencia de la API HTTP de control local, la CLI `openclaw browser`
y los patrones de scripting (snapshots, refs, esperas, flujos de depuración).

## API de control (opcional)

Solo para integraciones locales, el Gateway expone una pequeña API HTTP de loopback:

- Estado/inicio/detención: `GET /`, `POST /start`, `POST /stop`
- Pestañas: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/captura de pantalla: `GET /snapshot`, `POST /screenshot`
- Acciones: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Descargas: `POST /download`, `POST /wait/download`
- Depuración: `GET /console`, `POST /pdf`
- Depuración: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Red: `POST /response/body`
- Estado: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Estado: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Configuración: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Todos los endpoints aceptan `?profile=<name>`. `POST /start?headless=true` solicita un
inicio headless de una sola vez para perfiles locales administrados sin cambiar la
configuración persistida del navegador; los perfiles de solo conexión, CDP remoto y sesión existente rechazan
esa sobrescritura porque OpenClaw no inicia esos procesos de navegador.

Si está configurada la autenticación del gateway con secreto compartido, las rutas HTTP del navegador también requieren autenticación:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` o autenticación HTTP Basic con esa contraseña

Notas:

- Esta API de navegador loopback independiente **no** consume encabezados de identidad de proxy de confianza ni de
  Tailscale Serve.
- Si `gateway.auth.mode` es `none` o `trusted-proxy`, estas rutas de navegador loopback
  no heredan esos modos con identidad; mantenlas solo en loopback.

### Contrato de error de `/act`

`POST /act` usa una respuesta de error estructurada para fallos de validación y
política a nivel de ruta:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valores actuales de `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): falta `kind` o no se reconoce.
- `ACT_INVALID_REQUEST` (HTTP 400): la carga útil de la acción falló en normalización o validación.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): se usó `selector` con un tipo de acción no compatible.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (o `wait --fn`) está deshabilitado por configuración.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` de nivel superior o por lotes entra en conflicto con el objetivo de la solicitud.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): la acción no es compatible con perfiles de sesión existente.

Otros fallos en tiempo de ejecución aún pueden devolver `{ "error": "<message>" }` sin un
campo `code`.

### Requisito de Playwright

Algunas funciones (`navigate`/`act`/snapshot de IA/snapshot por roles, capturas de pantalla de elementos,
PDF) requieren Playwright. Si Playwright no está instalado, esos endpoints devuelven
un error 501 claro.

Lo que sigue funcionando sin Playwright:

- Snapshots ARIA
- Snapshots de accesibilidad estilo rol (`--interactive`, `--compact`,
  `--depth`, `--efficient`) cuando hay disponible un WebSocket CDP por pestaña. Esto es
  un respaldo para inspección y descubrimiento de refs; Playwright sigue siendo el motor principal de acciones.
- Capturas de pantalla de página para el navegador administrado `openclaw` cuando hay disponible un WebSocket CDP por pestaña
- Capturas de pantalla de página para perfiles `existing-session` / Chrome MCP
- Capturas de pantalla basadas en refs de `existing-session` (`--ref`) a partir de la salida del snapshot

Lo que aún requiere Playwright:

- `navigate`
- `act`
- Snapshots de IA que dependen del formato nativo de snapshot de IA de Playwright
- Capturas de pantalla de elementos con selector CSS (`--element`)
- Exportación PDF completa del navegador

Las capturas de pantalla de elementos también rechazan `--full-page`; la ruta devuelve `fullPage is
not supported for element screenshots`.

Si ves `Playwright is not available in this gateway build`, repara las dependencias incluidas del tiempo de ejecución del Plugin de navegador para que `playwright-core` esté instalado,
luego reinicia el gateway. Para instalaciones empaquetadas, ejecuta `openclaw doctor --fix`.
Para Docker, instala también los binarios del navegador Chromium como se muestra a continuación.

#### Instalación de Playwright en Docker

Si tu Gateway se ejecuta en Docker, evita `npx playwright` (conflictos con anulaciones de npm).
Usa la CLI incluida en su lugar:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Para conservar las descargas del navegador, establece `PLAYWRIGHT_BROWSERS_PATH` (por ejemplo,
`/home/node/.cache/ms-playwright`) y asegúrate de que `/home/node` se conserve mediante
`OPENCLAW_HOME_VOLUME` o un bind mount. Consulta [Docker](/es/install/docker).

## Cómo funciona (interno)

Un pequeño servidor de control loopback acepta solicitudes HTTP y se conecta a navegadores basados en Chromium mediante CDP. Las acciones avanzadas (clic/escritura/snapshot/PDF) pasan por Playwright sobre CDP; cuando falta Playwright, solo están disponibles las operaciones que no usan Playwright. El agente ve una interfaz estable mientras que los navegadores y perfiles locales/remotos cambian libremente por debajo.

## Referencia rápida de la CLI

Todos los comandos aceptan `--browser-profile <name>` para apuntar a un perfil específico y `--json` para salida legible por máquina.

<AccordionGroup>

<Accordion title="Conceptos básicos: estado, pestañas, abrir/enfocar/cerrar">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # inicio headless local administrado de una sola vez
openclaw browser stop            # también borra la emulación en attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # acceso directo a la pestaña actual
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Inspección: captura de pantalla, snapshot, consola, errores, solicitudes">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # o --ref e12
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
openclaw browser click 12 --double           # o e12 para refs por rol
openclaw browser click-coords 120 340        # coordenadas del viewport
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="Estado: cookies, storage, sin conexión, encabezados, geolocalización, dispositivo">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear para quitar
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Notas:

- `upload` y `dialog` son llamadas de **preparación**; ejecútalas antes del clic o `press` que active el selector de archivos o diálogo.
- `click`/`type`/etc requieren una `ref` de `snapshot` (`12` numérico, ref por rol `e12` o ref ARIA accionable `ax12`). Los selectores CSS intencionalmente no son compatibles para acciones. Usa `click-coords` cuando la posición visible en el viewport sea el único objetivo confiable.
- Las rutas de descarga, trace y upload están restringidas a las raíces temporales de OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (respaldo: `${os.tmpdir()}/openclaw/...`).
- `upload` también puede establecer directamente entradas de archivo mediante `--input-ref` o `--element`.

Los IDs y etiquetas estables de pestañas sobreviven al reemplazo de objetivos sin procesar de Chromium cuando OpenClaw
puede demostrar la pestaña de reemplazo, como la misma URL o una sola pestaña antigua que se convierte en una
sola pestaña nueva después del envío de un formulario. Los IDs de objetivo sin procesar siguen siendo volátiles; en scripts, prefiere
`suggestedTargetId` de `tabs`.

Resumen de flags de snapshot:

- `--format ai` (predeterminado con Playwright): snapshot de IA con refs numéricos (`aria-ref="<n>"`).
- `--format aria`: árbol de accesibilidad con refs `axN`. Cuando Playwright está disponible, OpenClaw enlaza refs con IDs DOM de backend a la página activa para que las acciones posteriores puedan usarlas; de lo contrario, trata la salida solo como de inspección.
- `--efficient` (o `--mode efficient`): preajuste compacto de snapshot por roles. Establece `browser.snapshotDefaults.mode: "efficient"` para que este sea el valor predeterminado (consulta [Configuración del Gateway](/es/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` fuerzan un snapshot por roles con refs `ref=e12`. `--frame "<iframe>"` limita los snapshots por roles a un iframe.
- `--labels` añade una captura de pantalla solo del viewport con etiquetas de refs superpuestas (imprime `MEDIA:<path>`).
- `--urls` agrega destinos de enlaces detectados a los snapshots de IA.

## Snapshots y refs

OpenClaw admite dos estilos de “snapshot”:

- **Snapshot de IA (refs numéricos)**: `openclaw browser snapshot` (predeterminado; `--format ai`)
  - Salida: un snapshot de texto que incluye refs numéricos.
  - Acciones: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Internamente, la ref se resuelve mediante `aria-ref` de Playwright.

- **Snapshot por roles (refs por rol como `e12`)**: `openclaw browser snapshot --interactive` (o `--compact`, `--depth`, `--selector`, `--frame`)
  - Salida: una lista/árbol basado en roles con `[ref=e12]` (y opcionalmente `[nth=1]`).
  - Acciones: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Internamente, la ref se resuelve mediante `getByRole(...)` (más `nth()` para duplicados).
  - Añade `--labels` para incluir una captura de pantalla del viewport con etiquetas `e12` superpuestas.
  - Añade `--urls` cuando el texto del enlace sea ambiguo y el agente necesite
    objetivos de navegación concretos.

- **Snapshot ARIA (refs ARIA como `ax12`)**: `openclaw browser snapshot --format aria`
  - Salida: el árbol de accesibilidad como nodos estructurados.
  - Acciones: `openclaw browser click ax12` funciona cuando la ruta de snapshot puede enlazar
    la ref mediante Playwright e IDs DOM de backend de Chrome.
- Si Playwright no está disponible, los snapshots ARIA aún pueden ser útiles para
  inspección, pero puede que las refs no sean accionables. Vuelve a generar el snapshot con `--format ai`
  o `--interactive` cuando necesites refs de acción.
- Prueba en Docker para la ruta de respaldo raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  inicia Chromium con CDP, ejecuta `browser doctor --deep` y verifica que los snapshots por roles
  incluyan URL de enlaces, elementos clicables promovidos por cursor y metadatos de iframe.

Comportamiento de refs:

- Las refs **no son estables entre navegaciones**; si algo falla, vuelve a ejecutar `snapshot` y usa una ref nueva.
- `/act` devuelve el `targetId` sin procesar actual después del reemplazo activado por la acción
  cuando puede demostrar la pestaña de reemplazo. Sigue usando IDs/etiquetas estables de pestaña para
  los comandos posteriores.
- Si el snapshot por roles se tomó con `--frame`, las refs por rol quedan limitadas a ese iframe hasta el siguiente snapshot por roles.
- Las refs `axN` desconocidas o obsoletas fallan de inmediato en lugar de pasar a
  `aria-ref` de Playwright. Ejecuta un snapshot nuevo en la misma pestaña cuando
  eso ocurra.

## Mejoras de espera

Puedes esperar por más cosas que solo tiempo/texto:

- Esperar una URL (Playwright admite globs):
  - `openclaw browser wait --url "**/dash"`
- Esperar un estado de carga:
  - `openclaw browser wait --load networkidle`
- Esperar un predicado de JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Esperar a que un selector se vuelva visible:
  - `openclaw browser wait "#main"`

Estas opciones pueden combinarse:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Flujos de depuración

Cuando una acción falla (por ejemplo, “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. Usa `click <ref>` / `type <ref>` (prefiere refs por rol en modo interactivo)
3. Si aún falla: `openclaw browser highlight <ref>` para ver a qué está apuntando Playwright
4. Si la página se comporta de forma extraña:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Para una depuración profunda: graba un trace:
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

Los snapshots por roles en JSON incluyen `refs` más un pequeño bloque `stats` (líneas/caracteres/refs/interactivo) para que las herramientas puedan razonar sobre el tamaño y la densidad de la carga útil.

## Controles de estado y entorno

Son útiles para flujos de trabajo de “hacer que el sitio se comporte como X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Sin conexión: `set offline on|off`
- Encabezados: `set headers --headers-json '{"X-Debug":"1"}'` (la forma heredada `set headers --json '{"X-Debug":"1"}'` sigue siendo compatible)
- Autenticación HTTP Basic: `set credentials user pass` (o `--clear`)
- Geolocalización: `set geo <lat> <lon> --origin "https://example.com"` (o `--clear`)
- Media: `set media dark|light|no-preference|none`
- Zona horaria / configuración regional: `set timezone ...`, `set locale ...`
- Dispositivo / viewport:
  - `set device "iPhone 14"` (preajustes de dispositivos de Playwright)
  - `set viewport 1280 720`

## Seguridad y privacidad

- El perfil de navegador de openclaw puede contener sesiones iniciadas; trátalo como información sensible.
- `browser act kind=evaluate` / `openclaw browser evaluate` y `wait --fn`
  ejecutan JavaScript arbitrario en el contexto de la página. La inyección de prompts puede dirigir
  esto. Desactívalo con `browser.evaluateEnabled=false` si no lo necesitas.
- Para notas sobre inicios de sesión y antibots (X/Twitter, etc.), consulta [Inicio de sesión en el navegador + publicación en X/Twitter](/es/tools/browser-login).
- Mantén privado el host del Gateway/nodo (solo loopback o tailnet).
- Los endpoints CDP remotos son potentes; túnelizalos y protégelos.

Ejemplo de modo estricto (bloquea destinos privados/internos de forma predeterminada):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // allow exacto opcional
    },
  },
}
```

## Relacionado

- [Navegador](/es/tools/browser) — descripción general, configuración, perfiles, seguridad
- [Inicio de sesión en el navegador](/es/tools/browser-login) — iniciar sesión en sitios
- [Solución de problemas del navegador en Linux](/es/tools/browser-linux-troubleshooting)
- [Solución de problemas del navegador en WSL2](/es/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
