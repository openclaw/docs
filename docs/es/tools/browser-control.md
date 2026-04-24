---
read_when:
    - Programar scripts o depurar el navegador del agente mediante la API local de control
    - Buscas la referencia de la CLI de `openclaw browser`
    - Añadir automatización personalizada del navegador con instantáneas y refs
summary: API de control del navegador de OpenClaw, referencia de la CLI y acciones de scripting
title: API de control del navegador
x-i18n:
    generated_at: "2026-04-24T05:52:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: e29ad295085e2c36a6c2ce01366a4186e45a7ecfe1d3c3072353c55794b05b5f
    source_path: tools/browser-control.md
    workflow: 15
---

Para la configuración, la puesta en marcha y la solución de problemas, consulta [Navegador](/es/tools/browser).
Esta página es la referencia de la API HTTP local de control, de la CLI `openclaw browser`
y de patrones de scripting (instantáneas, refs, esperas y flujos de depuración).

## API de control (opcional)

Para integraciones solo locales, el Gateway expone una pequeña API HTTP loopback:

- Estado/inicio/parada: `GET /`, `POST /start`, `POST /stop`
- Pestañas: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Instantánea/captura de pantalla: `GET /snapshot`, `POST /screenshot`
- Acciones: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Descargas: `POST /download`, `POST /wait/download`
- Depuración: `GET /console`, `POST /pdf`
- Depuración: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Red: `POST /response/body`
- Estado: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Estado: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Configuración: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Todos los endpoints aceptan `?profile=<name>`.

Si la autenticación del gateway con secreto compartido está configurada, las rutas HTTP del navegador también requieren autenticación:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` o autenticación HTTP Basic con esa contraseña

Notas:

- Esta API de navegador loopback independiente **no** consume encabezados de identidad de trusted-proxy ni de Tailscale Serve.
- Si `gateway.auth.mode` es `none` o `trusted-proxy`, estas rutas loopback del navegador no heredan esos modos basados en identidad; mantenlas solo para loopback.

### Contrato de errores de `/act`

`POST /act` usa una respuesta de error estructurada para fallos de validación y
de política a nivel de ruta:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valores actuales de `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): falta `kind` o no se reconoce.
- `ACT_INVALID_REQUEST` (HTTP 400): la carga útil de la acción no superó la normalización o validación.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): se usó `selector` con un tipo de acción no compatible.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (o `wait --fn`) está desactivado por configuración.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` de nivel superior o por lotes entra en conflicto con el objetivo de la solicitud.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): la acción no es compatible con perfiles existing-session.

Otros fallos de runtime pueden seguir devolviendo `{ "error": "<message>" }` sin campo `code`.

### Requisito de Playwright

Algunas funciones (navigate/act/instantánea de IA/instantánea de rol, capturas de pantalla de elementos,
PDF) requieren Playwright. Si Playwright no está instalado, esos endpoints devuelven
un error 501 claro.

Lo que sigue funcionando sin Playwright:

- Instantáneas ARIA
- Capturas de pantalla de página para el navegador gestionado `openclaw` cuando hay disponible un
  WebSocket CDP por pestaña
- Capturas de pantalla de página para perfiles `existing-session` / Chrome MCP
- Capturas de pantalla basadas en ref (`--ref`) en `existing-session` a partir de la salida de instantánea

Lo que sigue necesitando Playwright:

- `navigate`
- `act`
- Instantáneas de IA / instantáneas de rol
- Capturas de pantalla de elementos por selector CSS (`--element`)
- Exportación PDF completa del navegador

Las capturas de pantalla de elementos también rechazan `--full-page`; la ruta devuelve `fullPage is
not supported for element screenshots`.

Si ves `Playwright is not available in this gateway build`, repara las
dependencias de runtime del plugin incluido de navegador para que `playwright-core` esté instalado,
y luego reinicia el gateway. Para instalaciones empaquetadas, ejecuta `openclaw doctor --fix`.
Para Docker, instala también los binarios del navegador Chromium como se muestra más abajo.

#### Instalación de Playwright en Docker

Si tu Gateway se ejecuta en Docker, evita `npx playwright` (conflictos de anulación de npm).
Usa la CLI incluida en su lugar:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Para conservar las descargas del navegador, establece `PLAYWRIGHT_BROWSERS_PATH` (por ejemplo,
`/home/node/.cache/ms-playwright`) y asegúrate de que `/home/node` se conserve mediante
`OPENCLAW_HOME_VOLUME` o un bind mount. Consulta [Docker](/es/install/docker).

## Cómo funciona (interno)

Un pequeño servidor local loopback de control acepta solicitudes HTTP y se conecta a navegadores basados en Chromium mediante CDP. Las acciones avanzadas (clic/escritura/instantánea/PDF) pasan por Playwright sobre CDP; cuando falta Playwright, solo están disponibles las operaciones que no dependen de Playwright. El agente ve una interfaz estable mientras los navegadores y perfiles locales/remotos se intercambian libremente por debajo.

## Referencia rápida de la CLI

Todos los comandos aceptan `--browser-profile <name>` para dirigirse a un perfil específico, y `--json` para salida legible por máquina.

<AccordionGroup>

<Accordion title="Básicos: estado, pestañas, open/focus/close">

```bash
openclaw browser status
openclaw browser start
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

<Accordion title="Inspección: screenshot, snapshot, console, errors, requests">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # or --ref e12
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Acciones: navigate, click, type, drag, wait, evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # or e12 for role refs
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

<Accordion title="Estado: cookies, storage, offline, headers, geo, device">

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

- `upload` y `dialog` son llamadas de **preparación**; ejecútalas antes del clic/press que active el selector o el diálogo.
- `click`/`type`/etc. requieren una `ref` de `snapshot` (numérica `12` o de rol `e12`). Los selectores CSS no se admiten intencionadamente para acciones.
- Las rutas de descarga, trazas y cargas están restringidas a las raíces temporales de OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (alternativa: `${os.tmpdir()}/openclaw/...`).
- `upload` también puede establecer entradas de archivo directamente mediante `--input-ref` o `--element`.

Resumen rápido de las marcas de instantánea:

- `--format ai` (predeterminado con Playwright): instantánea de IA con refs numéricas (`aria-ref="<n>"`).
- `--format aria`: árbol de accesibilidad, sin refs; solo inspección.
- `--efficient` (o `--mode efficient`): preajuste de instantánea compacta por rol. Establece `browser.snapshotDefaults.mode: "efficient"` para convertirlo en el predeterminado (consulta [Configuración del Gateway](/es/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` fuerzan una instantánea por rol con refs `ref=e12`. `--frame "<iframe>"` limita las instantáneas por rol a un iframe.
- `--labels` añade una captura de pantalla solo de la ventana gráfica con etiquetas de ref superpuestas (imprime `MEDIA:<path>`).

## Instantáneas y refs

OpenClaw admite dos estilos de “instantánea”:

- **Instantánea de IA (refs numéricas)**: `openclaw browser snapshot` (predeterminada; `--format ai`)
  - Salida: una instantánea de texto que incluye refs numéricas.
  - Acciones: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Internamente, la ref se resuelve mediante `aria-ref` de Playwright.

- **Instantánea por rol (refs de rol como `e12`)**: `openclaw browser snapshot --interactive` (o `--compact`, `--depth`, `--selector`, `--frame`)
  - Salida: una lista/árbol basado en roles con `[ref=e12]` (y opcionalmente `[nth=1]`).
  - Acciones: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Internamente, la ref se resuelve mediante `getByRole(...)` (más `nth()` para duplicados).
  - Añade `--labels` para incluir una captura de pantalla de la ventana gráfica con etiquetas `e12` superpuestas.

Comportamiento de las refs:

- Las refs **no son estables entre navegaciones**; si algo falla, vuelve a ejecutar `snapshot` y usa una ref nueva.
- Si la instantánea por rol se tomó con `--frame`, las refs por rol quedan limitadas a ese iframe hasta la siguiente instantánea por rol.

## Mejoras para wait

Puedes esperar a algo más que tiempo/texto:

- Esperar a una URL (globs compatibles con Playwright):
  - `openclaw browser wait --url "**/dash"`
- Esperar a un estado de carga:
  - `openclaw browser wait --load networkidle`
- Esperar a un predicado JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Esperar a que un selector se vuelva visible:
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

Cuando falle una acción (por ejemplo “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. Usa `click <ref>` / `type <ref>` (prefiere refs de rol en modo interactivo)
3. Si sigue fallando: `openclaw browser highlight <ref>` para ver a qué apunta Playwright
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

Las instantáneas por rol en JSON incluyen `refs` más un pequeño bloque `stats` (líneas/caracteres/refs/interactivo) para que las herramientas puedan razonar sobre el tamaño y la densidad de la carga útil.

## Controles de estado y entorno

Son útiles para flujos de trabajo del tipo “haz que el sitio se comporte como X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Almacenamiento: `storage local|session get|set|clear`
- Sin conexión: `set offline on|off`
- Encabezados: `set headers --headers-json '{"X-Debug":"1"}'` (la forma heredada `set headers --json '{"X-Debug":"1"}'` sigue siendo compatible)
- Autenticación básica HTTP: `set credentials user pass` (o `--clear`)
- Geolocalización: `set geo <lat> <lon> --origin "https://example.com"` (o `--clear`)
- Media: `set media dark|light|no-preference|none`
- Zona horaria / configuración regional: `set timezone ...`, `set locale ...`
- Dispositivo / viewport:
  - `set device "iPhone 14"` (preajustes de dispositivo de Playwright)
  - `set viewport 1280 720`

## Seguridad y privacidad

- El perfil del navegador de openclaw puede contener sesiones iniciadas; trátalo como material sensible.
- `browser act kind=evaluate` / `openclaw browser evaluate` y `wait --fn`
  ejecutan JavaScript arbitrario en el contexto de la página. La inyección de prompts puede dirigir
  esto. Desactívalo con `browser.evaluateEnabled=false` si no lo necesitas.
- Para inicios de sesión y notas anti-bot (X/Twitter, etc.), consulta [Inicio de sesión en navegador + publicación en X/Twitter](/es/tools/browser-login).
- Mantén privado el Gateway/host de nodo (solo loopback o tailnet).
- Los endpoints CDP remotos son potentes; tunélalos y protégelos.

Ejemplo de modo estricto (bloquear por defecto destinos privados/internos):

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

- [Navegador](/es/tools/browser) — resumen, configuración, perfiles, seguridad
- [Inicio de sesión en navegador](/es/tools/browser-login) — iniciar sesión en sitios
- [Solución de problemas del navegador en Linux](/es/tools/browser-linux-troubleshooting)
- [Solución de problemas del navegador en WSL2](/es/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
