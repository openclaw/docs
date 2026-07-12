---
read_when:
    - Creación de scripts o depuración del navegador del agente mediante la API de control local
    - ¿Busca la referencia de la CLI `openclaw browser`?
    - Adición de automatización personalizada del navegador con instantáneas y referencias
summary: API de control del navegador de OpenClaw, referencia de la CLI y acciones de automatización mediante scripts
title: API de control del navegador
x-i18n:
    generated_at: "2026-07-12T14:52:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8063f55c9881e45e65492dc40e2902bf05feb08ae9a74986ba2d7621e0dbe71a
    source_path: tools/browser-control.md
    workflow: 16
---

Para la instalación, la configuración y la resolución de problemas, consulte [Navegador](/es/tools/browser).
Esta página es la referencia de la API HTTP de control local, la CLI `openclaw browser`
y los patrones de automatización mediante scripts (instantáneas, referencias, esperas y flujos de depuración).

## API de control (opcional)

Solo para integraciones locales, el Gateway expone una pequeña API HTTP de bucle invertido.
Este servidor independiente es opcional: establezca la variable de entorno
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` en el entorno del servicio del gateway
y reinicie el gateway antes de que los endpoints HTTP estén disponibles. Sin
esta variable, el entorno de ejecución de control del navegador sigue funcionando mediante la CLI y
las herramientas del agente, pero nada escucha en el puerto de control de bucle invertido.

- Estado/inicio/detención: `GET /`, `GET /doctor`, `POST /start`, `POST /stop`, `POST /reset-profile`
- Perfiles: `GET /profiles`, `POST /profiles/create`, `DELETE /profiles/:name`
- Pestañas: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`, `POST /tabs/action`
- Instantánea/captura de pantalla: `GET /snapshot`, `POST /screenshot`
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

`POST /tabs/action` es el formato por lotes que la CLI utiliza internamente para
los subcomandos `browser tab` (`{"action":"new"|"label"|"select"|"close"|"list", ...}`);
al automatizar directamente mediante scripts, prefiera las rutas específicas para pestañas anteriores.

Todos los endpoints aceptan `?profile=<name>`. `POST /start?headless=true` solicita un
inicio puntual sin interfaz gráfica para perfiles locales administrados sin cambiar la configuración
persistente del navegador; los perfiles de solo conexión, CDP remoto y sesión existente rechazan
esa sobrescritura porque OpenClaw no inicia esos procesos del navegador.

Para los endpoints de pestañas, `targetId` es el nombre del campo de compatibilidad. Prefiera pasar
`suggestedTargetId` desde `GET /tabs` o `POST /tabs/open`; también se aceptan las etiquetas y los
identificadores `tabId`, como `t1`. Los identificadores de destino CDP sin procesar y los prefijos únicos
de dichos identificadores siguen funcionando, pero son identificadores de diagnóstico volátiles.

Si se configura la autenticación del gateway mediante secreto compartido, las rutas HTTP del navegador también requieren autenticación:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` o autenticación HTTP Basic con esa contraseña

Notas:

- Esta API independiente del navegador mediante bucle invertido **no** utiliza encabezados de identidad de
  proxy de confianza ni de Tailscale Serve.
- Si `gateway.auth.mode` es `none` o `trusted-proxy`, estas rutas del navegador mediante bucle
  invertido no heredan esos modos basados en identidad; manténgalas accesibles solo mediante bucle invertido.

### Contrato de errores de `/act`

`POST /act` utiliza una respuesta de error estructurada para los fallos de validación y
de políticas en el nivel de ruta:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valores actuales de `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): falta `kind` o no se reconoce.
- `ACT_INVALID_REQUEST` (HTTP 400): la carga de la acción no superó la normalización o la validación.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): se utilizó `selector` con un tipo de acción no compatible.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (o `wait --fn`) está desactivado por la configuración.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): el `targetId` de nivel superior o por lotes entra en conflicto con el destino de la solicitud.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): la acción no es compatible con perfiles de sesión existente.

Otros fallos del entorno de ejecución aún pueden devolver `{ "error": "<message>" }` sin un
campo `code`.

### Requisito de Playwright

Algunas funciones (navegación/acción/instantánea de IA/instantánea de roles, capturas de elementos y
PDF) requieren Playwright. Si Playwright no está instalado, esos endpoints devuelven
un error 501 claro.

Qué sigue funcionando sin Playwright:

- Instantáneas ARIA
- Instantáneas de accesibilidad con formato de roles (`--interactive`, `--compact`,
  `--depth`, `--efficient`) cuando hay disponible un WebSocket CDP por pestaña. Esta es
  una alternativa para la inspección y la detección de referencias; Playwright sigue siendo el motor
  principal de acciones.
- Capturas de página para el navegador `openclaw` administrado cuando hay disponible un WebSocket
  CDP por pestaña
- Capturas de página para perfiles `existing-session` / Chrome MCP
- Capturas basadas en referencias (`--ref`) para `existing-session` a partir de la salida de instantáneas

Qué sigue necesitando Playwright:

- `navigate`
- `act`
- Instantáneas de IA que dependen del formato nativo de instantáneas de IA de Playwright
- Capturas de elementos mediante selectores CSS (`--element`)
- Exportación completa del navegador a PDF

Las capturas de elementos también rechazan `--full-page`; la ruta devuelve `fullPage is
not supported for element screenshots`.

Si aparece `Playwright is not available in this gateway build`, al Gateway
empaquetado le falta la dependencia principal del entorno de ejecución del navegador. Reinstale o actualice
OpenClaw y, a continuación, reinicie el gateway. Para Docker, instale también los archivos binarios
del navegador Chromium como se muestra a continuación.

#### Instalación de Playwright en Docker

Si el Gateway se ejecuta en Docker, evite `npx playwright` (conflictos de sobrescritura de npm).
Para imágenes personalizadas, incorpore Chromium en la imagen:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

Para una imagen existente, instálelo mediante la CLI incluida:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Para conservar las descargas del navegador, establezca `PLAYWRIGHT_BROWSERS_PATH` (por ejemplo,
`/home/node/.cache/ms-playwright`) y asegúrese de que `/home/node` se conserve mediante
`OPENCLAW_HOME_VOLUME` o un montaje enlazado. OpenClaw detecta automáticamente el
Chromium persistente en Linux. Consulte [Docker](/es/install/docker).

## Cómo funciona (interno)

Un pequeño servidor de control mediante bucle invertido acepta solicitudes HTTP y se conecta a navegadores basados en Chromium mediante CDP. Las acciones avanzadas (hacer clic/escribir/obtener instantáneas/PDF) pasan por Playwright sobre CDP; cuando Playwright no está disponible, solo están disponibles las operaciones que no dependen de Playwright. El agente utiliza una única interfaz estable mientras los navegadores y perfiles locales/remotos se intercambian libremente por debajo.

## Referencia rápida de la CLI

Todos los comandos aceptan `--browser-profile <name>` para seleccionar un perfil específico y `--json` para obtener una salida legible por máquinas.

<AccordionGroup>

<Accordion title="Conceptos básicos: estado, pestañas, abrir/enfocar/cerrar">

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep    # añade una comprobación activa mediante instantánea
openclaw browser start
openclaw browser start --headless # inicio puntual local administrado sin interfaz gráfica
openclaw browser stop            # también borra la emulación en conexiones de solo conexión/CDP remoto
openclaw browser reset-profile   # mueve los datos del navegador del perfil a la papelera
openclaw browser tabs
openclaw browser tab             # acceso directo a la pestaña actual
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

<Accordion title="Perfiles: enumerar, crear, eliminar">

```bash
openclaw browser profiles
openclaw browser create-profile --name research --color "#0066CC"
openclaw browser create-profile --name attach --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser delete-profile --name research
```

</Accordion>

<Accordion title="Inspección: captura, instantánea, consola, errores, solicitudes">

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
openclaw browser snapshot --out snapshot.txt
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
openclaw browser click 12 --double           # o e12 para referencias de roles
openclaw browser click-coords 120 340        # coordenadas de la ventana gráfica
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref e12
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

<Accordion title="Estado: cookies, almacenamiento, modo sin conexión, encabezados, ubicación geográfica, dispositivo">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear para eliminarlas
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Notas:

- La herramienta `browser` orientada al agente expone `action=download` (requiere `ref` y
  `path`) y `action=waitfordownload` (`path` opcional). Ambas devuelven la URL de
  descarga guardada, el nombre de archivo sugerido y la ruta local protegida. La
  interceptación explícita de descargas está disponible para perfiles de Playwright
  administrados; los perfiles de sesiones existentes devuelven un error de operación
  no compatible.
- Se recomienda usar cargas atómicas mediante el selector de archivos: pase el activador `--ref` junto con la carga para que OpenClaw prepare y haga clic en una sola solicitud. `upload` solo con rutas sigue siendo compatible cuando se pretende usar un activador posterior. Use `--input-ref` o `--element` para establecer directamente una entrada de archivo. `dialog` es una llamada de preparación; ejecútela antes del clic o la pulsación que activa el diálogo. Si una acción abre una ventana modal, la respuesta de la acción incluye `blockedByDialog` y `browserState.dialogs.pending`; pase ese `dialogId` para responder directamente. Los diálogos gestionados fuera de OpenClaw aparecen en `browserState.dialogs.recent`.
- `click`/`type`/etc. requieren una `ref` de `snapshot` (numérica `12`, referencia de rol `e12` o referencia ARIA accionable `ax12`). Los selectores CSS no son compatibles intencionadamente para las acciones. Use `click-coords` cuando la posición visible en el viewport sea el único objetivo fiable.
- Las rutas de descarga y de traza están restringidas a las raíces temporales de OpenClaw: `/tmp/openclaw{,/downloads}` (alternativa: `${os.tmpdir()}/openclaw/...`).
- `upload` acepta archivos de la raíz temporal de cargas de OpenClaw y
  contenido multimedia entrante administrado por OpenClaw. Se puede hacer referencia al
  contenido multimedia entrante administrado mediante `media://inbound/<id>`,
  `media/inbound/<id>` relativo al sandbox o una ruta resuelta dentro del
  directorio de contenido multimedia entrante administrado. Se siguen rechazando las referencias
  anidadas a contenido multimedia, el recorrido de directorios, los enlaces simbólicos, los enlaces duros
  y las rutas locales arbitrarias.
- `upload` también puede establecer directamente entradas de archivo mediante `--input-ref` o `--element`.

Los identificadores y las etiquetas estables de pestañas sobreviven al reemplazo de destinos sin procesar de Chromium cuando OpenClaw
puede demostrar cuál es la pestaña de reemplazo, como ocurre con un par antiguo/nuevo único para la misma URL o
cuando una sola pestaña antigua se convierte en una sola pestaña nueva tras enviar un formulario. Los reemplazos
ambiguos con URL duplicadas reciben identificadores nuevos. Los identificadores de destino sin procesar siguen siendo
volátiles; en los scripts, se recomienda usar `suggestedTargetId` de `tabs`.

Resumen de las opciones de instantáneas:

- `--format ai` (valor predeterminado con Playwright): instantánea para IA con referencias numéricas (`aria-ref="<n>"`).
- `--format aria`: árbol de accesibilidad con referencias `axN`. Cuando Playwright está disponible, OpenClaw vincula las referencias con identificadores DOM del backend a la página activa para que las acciones posteriores puedan usarlas; de lo contrario, trate la salida únicamente como material de inspección.
- `--efficient` (o `--mode efficient`): preajuste de instantánea compacta de roles. Establezca `browser.snapshotDefaults.mode: "efficient"` para que sea el valor predeterminado (consulte [Configuración del Gateway](/es/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` fuerzan una instantánea de roles con referencias `ref=e12`. `--frame "<iframe>"` limita las instantáneas de roles a un iframe.
- Con Playwright, `--labels` añade una captura de pantalla con etiquetas de referencia
  superpuestas (muestra `MEDIA:<path>`) y un arreglo `annotations` con el
  cuadro delimitador de cada referencia. En `screenshot`, las etiquetas respaldadas por Playwright funcionan con `--full-page`,
  `--ref` y `--element`; en `snapshot`, la captura de pantalla adjunta sigue
  limitándose al viewport. Los perfiles de sesión existente/chrome-mcp muestran etiquetas superpuestas en
  las capturas de pantalla de la página, pero no devuelven `annotations` ni usan el asistente de
  proyección de página completa/referencia/elemento de Playwright. Sin Playwright ni chrome-mcp,
  las capturas de pantalla con etiquetas no están disponibles.
- `--urls` añade los destinos de enlaces detectados a las instantáneas para IA.

## Instantáneas y referencias

OpenClaw admite dos estilos de "instantánea":

- **Instantánea para IA (referencias numéricas)**: `openclaw browser snapshot` (predeterminado; `--format ai`)
  - Salida: una instantánea de texto que incluye referencias numéricas.
  - Acciones: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Internamente, la referencia se resuelve mediante `aria-ref` de Playwright.

- **Instantánea de roles (referencias de rol como `e12`)**: `openclaw browser snapshot --interactive` (o `--compact`, `--depth`, `--selector`, `--frame`)
  - Salida: una lista o árbol basado en roles con `[ref=e12]` (y `[nth=1]` opcional).
  - Acciones: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Internamente, la referencia se resuelve mediante `getByRole(...)` (más `nth()` para duplicados).
  - Añada `--labels` para incluir una captura de pantalla con etiquetas `e12` superpuestas. En
    los perfiles respaldados por Playwright, esto también devuelve metadatos del cuadro delimitador por referencia
    (`annotations[]`).
  - Añada `--urls` cuando el texto del enlace sea ambiguo y el agente necesite
    destinos de navegación concretos.

- **Instantánea ARIA (referencias ARIA como `ax12`)**: `openclaw browser snapshot --format aria`
  - Salida: el árbol de accesibilidad como nodos estructurados.
  - Acciones: `openclaw browser click ax12` funciona cuando la ruta de la instantánea puede vincular
    la referencia mediante Playwright y los identificadores DOM del backend de Chrome.
- Si Playwright no está disponible, las instantáneas ARIA aún pueden ser útiles para la
  inspección, pero es posible que las referencias no sean accionables. Vuelva a crear la instantánea con `--format ai`
  o `--interactive` cuando necesite referencias de acción.
- Prueba con Docker para la ruta alternativa de CDP sin procesar: `pnpm test:docker:browser-cdp-snapshot`
  inicia Chromium con CDP, ejecuta `browser doctor --deep` y verifica que las instantáneas de
  roles incluyan URL de enlaces, elementos en los que se puede hacer clic detectados por el cursor y metadatos de iframe.

Comportamiento de las referencias:

- Las referencias **no son estables entre navegaciones**; si algo falla, vuelva a ejecutar `snapshot` y use una referencia nueva.
- `/act` devuelve el `targetId` sin procesar actual después de un reemplazo activado por una acción
  cuando puede demostrar cuál es la pestaña de reemplazo. Siga usando identificadores o etiquetas estables de pestañas para
  los comandos posteriores.
- Si la instantánea de roles se tomó con `--frame`, las referencias de rol quedan limitadas a ese iframe hasta la siguiente instantánea de roles.
- Las referencias `axN` desconocidas u obsoletas fallan de inmediato en lugar de recurrir al
  selector `aria-ref` de Playwright. Ejecute una instantánea nueva en la misma pestaña cuando
  esto ocurra.

## Capacidades avanzadas de espera

Se puede esperar por algo más que tiempo o texto:

- Esperar una URL (Playwright admite patrones glob):
  - `openclaw browser wait --url "**/dash"`
- Esperar un estado de carga:
  - `openclaw browser wait --load networkidle`
  - Compatible con perfiles CDP administrados `openclaw` y sin procesar/remotos. Los perfiles que usan el controlador `existing-session` (incluido el perfil `user` predeterminado) rechazan `networkidle`; use esperas con `--url`, `--text`, un selector o `--fn` en esos perfiles.
- Esperar un predicado de JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Esperar a que un selector sea visible:
  - `openclaw browser wait "#main"`

Estas opciones se pueden combinar:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Flujos de trabajo de depuración

Cuando una acción falla (por ejemplo, "no visible", "infracción del modo estricto", "cubierto"):

1. `openclaw browser snapshot --interactive`
2. Use `click <ref>` / `type <ref>` (se recomiendan las referencias de rol en el modo interactivo)
3. Si sigue fallando: `openclaw browser highlight <ref>` para ver a qué apunta Playwright
4. Si la página se comporta de forma extraña:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Para una depuración profunda, registre una traza:
   - `openclaw browser trace start`
   - reproduzca el problema
   - `openclaw browser trace stop` (muestra `TRACE:<path>`)

## Salida JSON

`--json` sirve para scripts y herramientas estructuradas.

Ejemplos:

```bash
openclaw browser --json status
openclaw browser --json snapshot --interactive
openclaw browser --json requests --filter api
openclaw browser --json cookies
```

Las instantáneas de roles en JSON incluyen `refs` y un pequeño bloque `stats` (líneas/caracteres/referencias/elementos interactivos) para que las herramientas puedan evaluar el tamaño y la densidad de la carga útil.

## Controles de estado y entorno

Son útiles para flujos de trabajo del tipo "hacer que el sitio se comporte como X":

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Almacenamiento: `storage local|session get|set|clear`
- Sin conexión: `set offline on|off`
- Encabezados: `set headers --headers-json '{"X-Debug":"1"}'` (o la forma posicional `set headers '{"X-Debug":"1"}'`)
- Autenticación HTTP básica: `set credentials user pass` (o `--clear`)
- Geolocalización: `set geo <lat> <lon> --origin "https://example.com"` (o `--clear`)
- Contenido multimedia: `set media dark|light|no-preference|none`
- Zona horaria/configuración regional: `set timezone ...`, `set locale ...`
- Dispositivo/viewport:
  - `set device "iPhone 14"` (preajustes de dispositivos de Playwright)
  - `set viewport 1280 720`

## Seguridad y privacidad

- El perfil de navegador de OpenClaw puede contener sesiones autenticadas; trátelo como información confidencial.
- `browser act kind=evaluate` / `openclaw browser evaluate` y `wait --fn`
  ejecutan JavaScript arbitrario en el contexto de la página. Una inyección de prompt puede dirigir
  esta ejecución. Desactívela con `browser.evaluateEnabled=false` si no la necesita.
- `openclaw browser evaluate --fn` acepta el código fuente de una función, una expresión o
  el cuerpo de una sentencia. Los cuerpos de sentencias se envuelven como funciones asíncronas, por lo que debe usar
  `return` para el valor que desea obtener. Use `--timeout-ms <ms>` cuando la
  función del lado de la página pueda necesitar más tiempo que el límite de evaluación predeterminado.
- Para inicios de sesión y notas sobre sistemas antibot (X/Twitter, etc.), consulte [Inicio de sesión en el navegador y publicación en X/Twitter](/es/tools/browser-login).
- Mantenga privado el host del Gateway/Node (solo loopback o tailnet).
- Los endpoints CDP remotos son potentes; use un túnel y protéjalos.

Ejemplo de modo estricto (bloquea de forma predeterminada los destinos privados/internos):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // permiso exacto opcional
    },
  },
}
```

## Temas relacionados

- [Navegador](/es/tools/browser) - descripción general, configuración, perfiles y seguridad
- [Inicio de sesión en el navegador](/es/tools/browser-login) - inicio de sesión en sitios
- [Solución de problemas del navegador en Linux](/es/tools/browser-linux-troubleshooting)
- [Solución de problemas del navegador en WSL2](/es/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
