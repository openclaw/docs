---
read_when:
    - Creación de scripts o depuración del navegador del agente mediante la API de control local
    - ¿Buscas la referencia de la CLI de `openclaw browser`?
    - Añadir automatización personalizada del navegador con instantáneas y referencias
summary: API de control del navegador de OpenClaw, referencia de la CLI y acciones de scripting
title: API de control del navegador
x-i18n:
    generated_at: "2026-05-11T20:54:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 317ac82cb9060ae1f9495a992dcbb25356ef23b98a5802cf0ed65d1720c2a57d
    source_path: tools/browser-control.md
    workflow: 16
---

Para configuración, ajustes y solución de problemas, consulta [Browser](/es/tools/browser).
Esta página es la referencia para la API HTTP de control local, la CLI `openclaw browser`
y los patrones de scripting (instantáneas, referencias, esperas, flujos de depuración).

## API de control (opcional)

Solo para integraciones locales, el Gateway expone una pequeña API HTTP de loopback:

- Estado/inicio/detención: `GET /`, `POST /start`, `POST /stop`
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
- Configuración: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Todos los endpoints aceptan `?profile=<name>`. `POST /start?headless=true` solicita un
inicio headless de un solo uso para perfiles administrados locales sin cambiar la
configuración persistida del navegador; los perfiles de solo adjuntar, CDP remoto
y sesión existente rechazan esa anulación porque OpenClaw no inicia esos procesos
del navegador.

Si la autenticación del Gateway con secreto compartido está configurada, las rutas HTTP del navegador también requieren autenticación:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` o autenticación HTTP Basic con esa contraseña

Notas:

- Esta API independiente de navegador por loopback **no** consume encabezados de identidad de proxy de confianza ni de
  Tailscale Serve.
- Si `gateway.auth.mode` es `none` o `trusted-proxy`, estas rutas de navegador por loopback
  no heredan esos modos que portan identidad; mantenlas solo para loopback.

### Contrato de error de `/act`

`POST /act` usa una respuesta de error estructurada para validación a nivel de ruta y
fallos de política:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valores actuales de `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): falta `kind` o no se reconoce.
- `ACT_INVALID_REQUEST` (HTTP 400): la carga de acción no superó la normalización o la validación.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): se usó `selector` con un tipo de acción no admitido.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (o `wait --fn`) está deshabilitado por configuración.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): el `targetId` de nivel superior o por lotes entra en conflicto con el destino de la solicitud.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): la acción no es compatible con perfiles de sesión existente.

Otros fallos de tiempo de ejecución aún pueden devolver `{ "error": "<message>" }` sin un
campo `code`.

### Requisito de Playwright

Algunas funciones (navigate/act/instantánea de IA/instantánea de roles, capturas de pantalla de elementos,
PDF) requieren Playwright. Si Playwright no está instalado, esos endpoints devuelven
un error 501 claro.

Lo que sigue funcionando sin Playwright:

- Instantáneas ARIA
- Instantáneas de accesibilidad de estilo rol (`--interactive`, `--compact`,
  `--depth`, `--efficient`) cuando hay disponible un WebSocket CDP por pestaña. Esto es
  una alternativa para inspección y descubrimiento de referencias; Playwright sigue siendo el motor
  de acciones principal.
- Capturas de pantalla de página para el navegador administrado `openclaw` cuando hay disponible un
  WebSocket CDP por pestaña
- Capturas de pantalla de página para perfiles `existing-session` / Chrome MCP
- Capturas de pantalla basadas en referencias de `existing-session` (`--ref`) desde la salida de instantánea

Lo que todavía necesita Playwright:

- `navigate`
- `act`
- Instantáneas de IA que dependen del formato nativo de instantánea de IA de Playwright
- Capturas de pantalla de elementos con selectores CSS (`--element`)
- exportación completa de PDF del navegador

Las capturas de pantalla de elementos también rechazan `--full-page`; la ruta devuelve `fullPage is
not supported for element screenshots`.

Si ves `Playwright is not available in this gateway build`, al Gateway empaquetado
le falta la dependencia principal de tiempo de ejecución del navegador. Reinstala o actualiza
OpenClaw y luego reinicia el gateway. Para Docker, instala también los binarios del navegador
Chromium como se muestra a continuación.

#### Instalación de Playwright en Docker

Si tu Gateway se ejecuta en Docker, evita `npx playwright` (conflictos de anulaciones de npm).
Para imágenes personalizadas, incorpora Chromium en la imagen:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

Para una imagen existente, instala mediante la CLI incluida en su lugar:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Para persistir descargas del navegador, establece `PLAYWRIGHT_BROWSERS_PATH` (por ejemplo,
`/home/node/.cache/ms-playwright`) y asegúrate de que `/home/node` se persista mediante
`OPENCLAW_HOME_VOLUME` o un montaje bind. OpenClaw detecta automáticamente el Chromium persistido
en Linux. Consulta [Docker](/es/install/docker).

## Cómo funciona (interno)

Un pequeño servidor de control por loopback acepta solicitudes HTTP y se conecta a navegadores basados en Chromium mediante CDP. Las acciones avanzadas (click/type/snapshot/PDF) pasan por Playwright sobre CDP; cuando falta Playwright, solo están disponibles las operaciones que no usan Playwright. El agente ve una interfaz estable mientras los navegadores y perfiles locales/remotos se intercambian libremente por debajo.

## Referencia rápida de la CLI

Todos los comandos aceptan `--browser-profile <name>` para apuntar a un perfil específico y `--json` para salida legible por máquina.

<AccordionGroup>

<Accordion title="Basics: status, tabs, open/focus/close">

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

- `upload` y `dialog` son llamadas de **preparación**; ejecútalas antes del click/press que activa el selector/diálogo.
- `click`/`type`/etc requieren una `ref` de `snapshot` (`12` numérica, referencia de rol `e12` o referencia ARIA accionable `ax12`). Los selectores CSS no son compatibles intencionalmente para acciones. Usa `click-coords` cuando la posición visible en el viewport sea el único destino confiable.
- Las rutas de descarga, trazado y carga están restringidas a las raíces temporales de OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (alternativa: `${os.tmpdir()}/openclaw/...`).
- `upload` también puede establecer entradas de archivo directamente mediante `--input-ref` o `--element`.

Los ids y etiquetas de pestaña estables sobreviven al reemplazo de destino raw de Chromium cuando OpenClaw
puede probar la pestaña de reemplazo, como la misma URL o una única pestaña antigua que se convierte en una
única pestaña nueva después del envío de un formulario. Los ids de destino raw siguen siendo volátiles; prefiere
`suggestedTargetId` de `tabs` en scripts.

Resumen de flags de instantánea:

- `--format ai` (predeterminado con Playwright): instantánea de IA con referencias numéricas (`aria-ref="<n>"`).
- `--format aria`: árbol de accesibilidad con referencias `axN`. Cuando Playwright está disponible, OpenClaw vincula referencias con ids DOM de backend a la página activa para que las acciones posteriores puedan usarlas; de lo contrario, trata la salida solo como inspección.
- `--efficient` (o `--mode efficient`): preajuste compacto de instantánea de rol. Establece `browser.snapshotDefaults.mode: "efficient"` para que sea el valor predeterminado (consulta [configuración del Gateway](/es/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` fuerzan una instantánea de rol con referencias `ref=e12`. `--frame "<iframe>"` limita las instantáneas de rol a un iframe.
- `--labels` agrega una captura de pantalla solo del viewport con etiquetas de referencia superpuestas (imprime `MEDIA:<path>`).
- `--urls` agrega destinos de enlaces descubiertos a las instantáneas de IA.

## Instantáneas y referencias

OpenClaw admite dos estilos de "instantánea":

- **Instantánea de IA (referencias numéricas)**: `openclaw browser snapshot` (predeterminado; `--format ai`)
  - Salida: una instantánea de texto que incluye referencias numéricas.
  - Acciones: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Internamente, la referencia se resuelve mediante `aria-ref` de Playwright.

- **Instantánea de rol (referencias de rol como `e12`)**: `openclaw browser snapshot --interactive` (o `--compact`, `--depth`, `--selector`, `--frame`)
  - Salida: una lista/árbol basado en roles con `[ref=e12]` (y `[nth=1]` opcional).
  - Acciones: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Internamente, la referencia se resuelve mediante `getByRole(...)` (más `nth()` para duplicados).
  - Agrega `--labels` para incluir una captura de pantalla del viewport con etiquetas `e12` superpuestas.
  - Agrega `--urls` cuando el texto del enlace sea ambiguo y el agente necesite destinos de
    navegación concretos.

- **Instantánea ARIA (referencias ARIA como `ax12`)**: `openclaw browser snapshot --format aria`
  - Salida: el árbol de accesibilidad como nodos estructurados.
  - Acciones: `openclaw browser click ax12` funciona cuando la ruta de la instantánea puede vincular
    la referencia mediante Playwright y los id. de DOM del backend de Chrome.
- Si Playwright no está disponible, las instantáneas ARIA aún pueden ser útiles para
  la inspección, pero las referencias podrían no ser accionables. Vuelve a tomar una instantánea con `--format ai`
  o `--interactive` cuando necesites referencias de acción.
- Prueba de Docker para la ruta de reserva raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  inicia Chromium con CDP, ejecuta `browser doctor --deep` y verifica que las instantáneas
  de roles incluyan URL de enlaces, elementos clicables promovidos por cursor y metadatos de iframe.

Comportamiento de referencias:

- Las referencias **no son estables entre navegaciones**; si algo falla, vuelve a ejecutar `snapshot` y usa una referencia nueva.
- `/act` devuelve el `targetId` sin procesar actual después de un reemplazo activado por acción
  cuando puede demostrar la pestaña de reemplazo. Sigue usando id. o etiquetas de pestaña estables para
  los comandos posteriores.
- Si la instantánea de roles se tomó con `--frame`, las referencias de roles quedan limitadas a ese iframe hasta la siguiente instantánea de roles.
- Las referencias `axN` desconocidas u obsoletas fallan rápido en lugar de recurrir al selector
  `aria-ref` de Playwright. Ejecuta una instantánea nueva en la misma pestaña cuando
  eso ocurra.

## Mejoras de espera

Puedes esperar más que solo tiempo/texto:

- Esperar URL (globs admitidos por Playwright):
  - `openclaw browser wait --url "**/dash"`
- Esperar estado de carga:
  - `openclaw browser wait --load networkidle`
- Esperar un predicado JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Esperar a que un selector sea visible:
  - `openclaw browser wait "#main"`

Se pueden combinar:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Flujos de depuración

Cuando una acción falla (por ejemplo, "no visible", "infracción de modo estricto", "cubierto"):

1. `openclaw browser snapshot --interactive`
2. Usa `click <ref>` / `type <ref>` (prefiere referencias de roles en modo interactivo)
3. Si todavía falla: `openclaw browser highlight <ref>` para ver a qué apunta Playwright
4. Si la página se comporta de forma extraña:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Para depuración profunda: graba una traza:
   - `openclaw browser trace start`
   - reproduce el problema
   - `openclaw browser trace stop` (imprime `TRACE:<path>`)

## Salida JSON

`--json` es para scripts y herramientas estructuradas.

Ejemplos:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Las instantáneas de roles en JSON incluyen `refs` además de un pequeño bloque `stats` (lines/chars/refs/interactive) para que las herramientas puedan razonar sobre el tamaño y la densidad de la carga útil.

## Controles de estado y entorno

Son útiles para flujos de trabajo de "hacer que el sitio se comporte como X":

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Almacenamiento: `storage local|session get|set|clear`
- Sin conexión: `set offline on|off`
- Encabezados: `set headers --headers-json '{"X-Debug":"1"}'` (el `set headers --json '{"X-Debug":"1"}'` heredado sigue siendo compatible)
- Autenticación básica HTTP: `set credentials user pass` (o `--clear`)
- Geolocalización: `set geo <lat> <lon> --origin "https://example.com"` (o `--clear`)
- Medios: `set media dark|light|no-preference|none`
- Zona horaria / configuración regional: `set timezone ...`, `set locale ...`
- Dispositivo / viewport:
  - `set device "iPhone 14"` (preajustes de dispositivo de Playwright)
  - `set viewport 1280 720`

## Seguridad y privacidad

- El perfil de navegador de openclaw puede contener sesiones iniciadas; trátalo como información confidencial.
- `browser act kind=evaluate` / `openclaw browser evaluate` y `wait --fn`
  ejecutan JavaScript arbitrario en el contexto de la página. La inyección de prompts puede dirigir
  esto. Desactívalo con `browser.evaluateEnabled=false` si no lo necesitas.
- Para notas sobre inicios de sesión y antibot (X/Twitter, etc.), consulta [Inicio de sesión en navegador + publicación en X/Twitter](/es/tools/browser-login).
- Mantén privado el host de Gateway/node (loopback o solo tailnet).
- Los endpoints CDP remotos son potentes; protégelos y usa túneles.

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
- [Solución de problemas de Browser en WSL2](/es/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
