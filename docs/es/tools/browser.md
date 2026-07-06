---
read_when:
    - Adición de automatización del navegador controlada por agentes
    - Depurar por qué OpenClaw interfiere con tu propio Chrome
    - Implementar la configuración del navegador y el ciclo de vida en la app de macOS
summary: Servicio integrado de control del navegador + comandos de acción
title: Navegador (gestionado por OpenClaw)
x-i18n:
    generated_at: "2026-07-06T10:52:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24095eddbad905a96b3aa15e4ee94aba8dffa05bafce01bfc7fda914d41266ef
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw puede ejecutar un **perfil dedicado de Chrome/Brave/Edge/Chromium** que controla el agente. Se ejecuta mediante un pequeño servicio de control local dentro del Gateway (solo loopback) y está aislado de tu navegador personal.

- Piensa en él como un **navegador separado, solo para el agente**. El perfil `openclaw` nunca toca tu perfil de navegador personal.
- El agente abre pestañas, lee páginas, hace clic y escribe en esta vía aislada.
- En cambio, el perfil integrado `user` se adjunta a tu sesión real de Chrome con sesión iniciada, mediante Chrome DevTools MCP.

## Qué obtienes

- Un perfil de navegador separado llamado **openclaw** (acento naranja de forma predeterminada).
- Control determinista de pestañas (listar/abrir/enfocar/cerrar).
- Acciones del agente (clic/escritura/arrastrar/seleccionar), instantáneas, capturas de pantalla, PDF.
- Los perfiles respaldados por Playwright guardan las navegaciones de adjuntos directos en el directorio de descargas administrado y devuelven metadatos `{ url, suggestedFilename, path }` después de la validación de la política de URL final.
- Las acciones del agente respaldadas por Playwright devuelven un arreglo `downloads` con los mismos metadatos administrados cuando la acción inicia inmediatamente una o más descargas.
- Una skill `browser-automation` incluida que enseña a los agentes el ciclo de recuperación de instantáneas,
  pestañas estables, referencias obsoletas y bloqueadores manuales cuando el Plugin del navegador
  está habilitado.
- Compatibilidad opcional con múltiples perfiles (`openclaw`, `work`, `remote`, ...).

Este navegador **no** es tu navegador de uso diario. Es una superficie segura y aislada para
automatización y verificación por agentes.

## Inicio rápido

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

"Browser disabled" significa que el Plugin o `browser.enabled` está desactivado; consulta
[Configuración](#configuration) y [Control de Plugin](#plugin-control).

Si `openclaw browser` no existe en absoluto, o el agente dice que la herramienta de navegador
no está disponible, ve a [Comando o herramienta de navegador ausente](#missing-browser-command-or-tool).

## Control de Plugin

La herramienta `browser` predeterminada es un Plugin incluido. Deshabilítala para sustituirla por otro Plugin que registre el mismo nombre de herramienta `browser`:

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

Los valores predeterminados necesitan tanto `plugins.entries.browser.enabled` **como** `browser.enabled=true`. Deshabilitar solo el Plugin elimina la CLI `openclaw browser`, el método de gateway `browser.request`, la herramienta del agente y el servicio de control como una sola unidad; tu configuración `browser.*` permanece intacta para un reemplazo.

Los cambios de configuración del navegador requieren reiniciar el Gateway para que el Plugin pueda volver a registrar su servicio.

## Guía para agentes

Nota sobre el perfil de herramientas: `tools.profile: "coding"` incluye `web_search` y
`web_fetch`, pero no la herramienta `browser` completa. Para permitir que el agente o un
subagente generado use automatización del navegador, añade browser en la etapa de perfil:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Para un solo agente, usa `agents.list[].tools.alsoAllow: ["browser"]`.
`tools.subagents.tools.allow: ["browser"]` por sí solo no basta porque la política de subagentes
se aplica después del filtrado de perfiles.

El Plugin de navegador incluye dos niveles de guía para agentes:

- La descripción de la herramienta `browser` lleva el contrato compacto siempre activo: elegir
  el perfil correcto, mantener las referencias en la misma pestaña, usar `tabId`/etiquetas para apuntar a pestañas
  y cargar la skill de navegador para trabajo de varios pasos.
- La skill `browser-automation` incluida lleva el ciclo operativo más largo:
  comprobar estado/pestañas primero, etiquetar pestañas de tarea, tomar una instantánea antes de actuar, volver a tomar instantánea
  después de cambios de UI, recuperar referencias obsoletas una vez e informar bloqueadores de inicio de sesión/2FA/captcha o
  cámara/micrófono como acción manual en lugar de adivinar.

Las skills incluidas por Plugins se listan en las skills disponibles del agente cuando el
Plugin está habilitado. Las instrucciones completas de la skill se cargan bajo demanda, por lo que los turnos
rutinarios no pagan el coste completo en tokens.

## Comando o herramienta de navegador ausente

Si `openclaw browser` es desconocido después de una actualización, falta `browser.request` o el agente informa que la herramienta de navegador no está disponible, la causa habitual es una lista `plugins.allow` que omite `browser` y no existe ningún bloque raíz de configuración `browser`. Añádelo:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Un bloque raíz explícito `browser` (cualquier clave bajo `browser`, como
`browser.enabled=true` o `browser.profiles.<name>`) activa el Plugin de navegador incluido
incluso con un `plugins.allow` restrictivo, coincidiendo con el comportamiento de configuración de canales incluidos. `plugins.entries.browser.enabled=true` y
`tools.alsoAllow: ["browser"]` no sustituyen por sí solos la pertenencia a la lista de permitidos. Eliminar `plugins.allow` por completo también restaura el valor predeterminado.

## Perfiles: `openclaw`, `user`, `chrome`

- `openclaw`: navegador administrado y aislado (no requiere extensión).
- `user`: perfil integrado de adjunto Chrome DevTools MCP para tu sesión **real
  de Chrome con sesión iniciada**. Chrome muestra una solicitud bloqueante "Allow remote debugging?"
  la primera vez que OpenClaw se adjunta, así que alguien debe estar frente al equipo.
- `chrome`: perfil integrado de [extensión de Chrome](/tools/chrome-extension) para
  tu sesión **real de Chrome con sesión iniciada**. Funciona desde un teléfono sin nadie en el
  escritorio porque controla pestañas mediante la extensión de navegador de OpenClaw en lugar del
  puerto de depuración remota, por lo que no aparece la solicitud "Allow remote debugging?".

Para llamadas de herramienta de navegador del agente:

- Predeterminado: usa el navegador aislado `openclaw`.
- Prefiere `profile="chrome"` (extensión) cuando importen las sesiones iniciadas existentes
  y el usuario esté **lejos del equipo** (Telegram, WhatsApp, etc.).
- Prefiere `profile="user"` (Chrome MCP) cuando importen las sesiones iniciadas existentes
  y el usuario esté **frente al equipo** para aprobar la solicitud de adjunto.
- `profile` es la anulación explícita cuando quieres un modo de navegador específico.

Establece `browser.defaultProfile: "openclaw"` si quieres el modo administrado de forma predeterminada.

## Configuración

La configuración del navegador vive en `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // default: true
    evaluateEnabled: true, // default: true; false disables act:evaluate (arbitrary JS)
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    remoteCdpTimeoutMs: 1500, // remote CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // remote CDP WebSocket handshake timeout (ms)
    localLaunchTimeoutMs: 15000, // local managed Chrome discovery timeout (ms)
    localCdpReadyTimeoutMs: 8000, // local managed post-launch CDP readiness timeout (ms)
    actionTimeoutMs: 60000, // default browser act timeout (ms)
    tabCleanup: {
      enabled: true, // default: true
      idleMinutes: 120, // set 0 to disable idle cleanup
      maxTabsPerSession: 8, // set 0 to disable the per-session cap
      sweepMinutes: 5,
    },
    // snapshotDefaults: { mode: "efficient" }, // default snapshot mode when the caller omits one
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        headless: true,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

`browser.snapshotDefaults.mode: "efficient"` cambia el modo predeterminado de extracción `snapshot`
cuando un llamador no pasa un `snapshotFormat` o
`mode` explícito; consulta [API de control del navegador](/es/tools/browser-control) para opciones de instantánea
por llamada.

### Visión de capturas de pantalla (compatibilidad con modelos solo de texto)

Cuando el modelo principal es solo de texto (sin compatibilidad de visión/multimodal), las capturas de pantalla del navegador
devuelven bloques de imagen que el modelo no puede leer. Las capturas de pantalla del navegador
reutilizan la configuración existente de comprensión de imágenes, por lo que un modelo de imagen
configurado para comprensión de medios puede describir capturas de pantalla como texto sin ninguna
configuración de modelo específica del navegador.

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // Add fallback candidates; first success wins
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // Shared media models also work when tagged for image support.
      // models: [{ provider: "openai", model: "gpt-4o", capabilities: ["image"] }],
    },
  },
  agents: {
    defaults: {
      // Existing image-model defaults are also honored.
      // imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

**Cómo funciona:**

1. El agente llama a `browser screenshot` y se captura una imagen en disco como de costumbre.
2. La herramienta de navegador pregunta al runtime existente de comprensión de imágenes si
   puede describir la captura de pantalla usando modelos de imagen de medios configurados, modelos de medios compartidos,
   valores predeterminados de modelo de imagen o un proveedor de imagen respaldado por autenticación.
3. El modelo de visión devuelve una descripción de texto, que se envuelve con
   `wrapExternalContent` (protección contra inyección de prompts) y se devuelve al agente
   como un bloque de texto en lugar de un bloque de imagen.
4. Si la comprensión de imágenes no está disponible, se omite o falla, el navegador vuelve
   a devolver el bloque de imagen original.

Usa los campos existentes `tools.media.image` / `tools.media.models` para sustitutos de modelo,
tiempos de espera, límites de bytes, perfiles y configuración de solicitudes de proveedor.

Si el modelo principal activo ya admite visión y no se configura ningún modelo explícito de
comprensión de imágenes, OpenClaw conserva el resultado normal de imagen para que el
modelo principal pueda leer la captura de pantalla directamente.

<AccordionGroup>

<Accordion title="Puertos y accesibilidad">

- El servicio de control se enlaza a loopback en un puerto derivado de `gateway.port` (valor predeterminado `18791` = gateway + 2). `OPENCLAW_GATEWAY_PORT` tiene prioridad sobre `gateway.port`; cualquiera de los dos desplaza los puertos derivados en la misma familia.
- Los perfiles locales de `openclaw` asignan automáticamente `cdpPort`/`cdpUrl` desde un rango que comienza 9 puertos por encima del puerto de control (valor predeterminado `18800`-`18899`); configúralos solo para
  perfiles CDP remotos o conexión a un endpoint de sesión existente. `cdpUrl` usa de forma predeterminada
  el puerto CDP local administrado cuando no está configurado.
- `remoteCdpTimeoutMs` se aplica a las comprobaciones de alcanzabilidad HTTP de CDP remoto y `attachOnly`,
  y a las solicitudes HTTP de apertura de pestañas; `remoteCdpHandshakeTimeoutMs` se aplica a
  sus handshakes CDP WebSocket. La enumeración persistente de pestañas remotas de Playwright
  usa el mayor de los dos como plazo límite de la operación.
- `localLaunchTimeoutMs` es el presupuesto para que un proceso administrado de Chrome lanzado localmente
  exponga su endpoint HTTP de CDP. `localCdpReadyTimeoutMs` es el
  presupuesto posterior para la preparación del websocket CDP después de descubrir el proceso.
  Auméntalos en Raspberry Pi, VPS de gama baja o hardware antiguo donde Chromium
  arranca lentamente. Los valores deben ser enteros positivos de hasta `120000` ms; los valores
  de configuración no válidos se rechazan.
- Los fallos repetidos de lanzamiento/preparación de Chrome administrado se interrumpen mediante circuito por
  perfil. Después de varios fallos consecutivos, OpenClaw pausa brevemente los nuevos intentos de lanzamiento
  en lugar de iniciar Chromium en cada llamada a una herramienta del navegador. Corrige
  el problema de inicio, desactiva el navegador si no se necesita, o reinicia el
  Gateway después de la reparación.
- `actionTimeoutMs` es el presupuesto predeterminado para las solicitudes `act` del navegador cuando el llamador no pasa `timeoutMs`. El transporte cliente agrega una pequeña ventana de margen para que las esperas largas puedan terminar en lugar de agotar el tiempo de espera en el límite HTTP.
- `tabCleanup` es una limpieza de mejor esfuerzo para pestañas abiertas por sesiones de navegador del agente principal. La limpieza del ciclo de vida de subagentes, Cron y ACP sigue cerrando sus pestañas rastreadas explícitas al final de la sesión; las sesiones principales mantienen reutilizables las pestañas activas y luego cierran en segundo plano las pestañas rastreadas inactivas o sobrantes.

</Accordion>

<Accordion title="Política SSRF">

- La navegación del navegador y la apertura de pestañas están protegidas contra SSRF antes de la navegación y se vuelven a comprobar, con mejor esfuerzo, en la URL final `http(s)` después.
- En modo SSRF estricto, también se comprueban el descubrimiento de endpoints CDP remotos y las sondas `/json/version` (`cdpUrl`).
- Las variables de entorno `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` y `NO_PROXY` de Gateway/proveedor no aplican proxy automáticamente al navegador administrado por OpenClaw. Chrome administrado se lanza directamente de forma predeterminada, para que la configuración de proxy del proveedor no debilite las comprobaciones SSRF del navegador.
- Las sondas de preparación de CDP local administradas por OpenClaw y las conexiones DevTools WebSocket omiten el proxy de red administrado para el endpoint loopback exacto lanzado, por lo que `openclaw browser start` sigue funcionando cuando un proxy del operador bloquea la salida loopback.
- Para aplicar proxy al propio navegador administrado, pasa flags explícitos de proxy de Chrome mediante `browser.extraArgs`, como `--proxy-server=...` o `--proxy-pac-url=...`. El modo SSRF estricto bloquea el enrutamiento explícito de proxy del navegador a menos que el acceso del navegador a redes privadas esté habilitado intencionalmente.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` está desactivado de forma predeterminada; habilítalo solo cuando el acceso del navegador a redes privadas sea de confianza intencionalmente.
- `browser.ssrfPolicy.allowPrivateNetwork` sigue siendo compatible como alias heredado.

</Accordion>

<Accordion title="Comportamiento de perfiles">

- `attachOnly: true` significa no lanzar nunca un navegador local; solo conectarse si ya hay uno en ejecución.
- `headless` puede configurarse globalmente o por perfil administrado local. Los valores por perfil anulan `browser.headless`, de modo que un perfil lanzado localmente puede permanecer headless mientras otro permanece visible.
- `POST /start?headless=true` y `openclaw browser start --headless` solicitan un
  lanzamiento headless de un solo uso para perfiles administrados locales sin reescribir
  `browser.headless` ni la configuración del perfil. Los perfiles de sesión existente, solo conexión y
  CDP remoto rechazan la anulación porque OpenClaw no lanza esos
  procesos de navegador.
- En hosts Linux sin `DISPLAY` ni `WAYLAND_DISPLAY`, los perfiles administrados locales
  usan headless automáticamente de forma predeterminada cuando ni el entorno ni la configuración
  global/del perfil eligen explícitamente el modo con interfaz. `openclaw browser status --json`
  informa `headlessSource` como `env`, `profile`, `config`,
  `request`, `linux-display-fallback` o `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` fuerza lanzamientos administrados locales headless para el
  proceso actual. `OPENCLAW_BROWSER_HEADLESS=0` fuerza el modo con interfaz para inicios
  ordinarios y devuelve un error accionable en hosts Linux sin servidor de pantalla;
  una solicitud explícita `start --headless` sigue ganando para ese lanzamiento único.
- `executablePath` puede configurarse globalmente o por perfil administrado local. Los valores por perfil anulan `browser.executablePath`, por lo que diferentes perfiles administrados pueden lanzar distintos navegadores basados en Chromium. Ambas formas aceptan `~` para el directorio home de tu SO.
- `color` (de nivel superior y por perfil) tiñe la interfaz del navegador para que puedas ver qué perfil está activo.
- El perfil predeterminado es `openclaw` (independiente administrado). Usa `defaultProfile: "user"` para optar por el navegador del usuario con sesión iniciada.
- Orden de detección automática: navegador predeterminado del sistema si está basado en Chromium; de lo contrario Chrome, Brave, Edge, Chromium, Chrome Canary.
- `driver: "existing-session"` usa Chrome DevTools MCP en lugar de CDP sin procesar. Puede conectarse mediante la conexión automática de Chrome MCP, o mediante `cdpUrl` cuando ya tienes un endpoint DevTools para el navegador en ejecución.
- `driver: "extension"` controla tu Chrome con sesión iniciada mediante la [extensión de Chrome de OpenClaw](/tools/chrome-extension). El relé es propietario de su endpoint loopback, por lo que estos perfiles no aceptan `cdpUrl`. Este es el único modo de navegador con sesión iniciada que funciona sin nadie en el equipo.
- Configura `browser.profiles.<name>.userDataDir` cuando un perfil de sesión existente deba conectarse a un perfil de usuario de Chromium no predeterminado (Brave, Edge, etc.). Esta ruta también acepta `~` para el directorio home de tu SO.

</Accordion>

</AccordionGroup>

## Usar Brave u otro navegador basado en Chromium

Si tu navegador **predeterminado del sistema** está basado en Chromium (Chrome/Brave/Edge/etc),
OpenClaw lo usa automáticamente. Configura `browser.executablePath` para anular
la detección automática. Los valores `executablePath` de nivel superior y por perfil aceptan `~`
para el directorio home de tu SO:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

O configúralo en la configuración, por plataforma:

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

`executablePath` por perfil solo afecta a perfiles administrados locales que OpenClaw
lanza. Los perfiles `existing-session` se conectan a un navegador que ya está en ejecución
en su lugar, y los perfiles CDP remotos usan el navegador detrás de `cdpUrl`.

## Control local frente a remoto

- **Control local (predeterminado):** el Gateway inicia el servicio de control loopback y puede lanzar un navegador local.
- **Control remoto (host de nodo):** ejecuta un host de nodo en la máquina que tiene el navegador; el Gateway aplica proxy a las acciones del navegador hacia él.
- **CDP remoto:** configura `browser.profiles.<name>.cdpUrl` (o `browser.cdpUrl`) para
  conectarte a un navegador remoto basado en Chromium. En este caso, OpenClaw no lanzará un navegador local.
- Para servicios CDP administrados externamente en loopback (por ejemplo Browserless en
  Docker publicado en `127.0.0.1`), configura también `attachOnly: true`. CDP en loopback
  sin `attachOnly` se trata como un perfil de navegador local administrado por OpenClaw.
- `headless` solo afecta a perfiles administrados locales que OpenClaw lanza. No reinicia ni cambia navegadores de sesión existente o CDP remotos.
- `executablePath` sigue la misma regla de perfil administrado local. Cambiarlo en un
  perfil administrado local en ejecución marca ese perfil para reinicio/reconciliación, de modo que el
  próximo lanzamiento use el nuevo binario.

El comportamiento al detener difiere según el modo de perfil:

- perfiles administrados locales: `openclaw browser stop` detiene el proceso de navegador que
  OpenClaw lanzó
- perfiles solo conexión y CDP remotos: `openclaw browser stop` cierra la sesión de control
  activa y libera las anulaciones de emulación de Playwright/CDP (viewport,
  esquema de color, configuración regional, zona horaria, modo sin conexión y estado similar), aunque
  OpenClaw no haya lanzado ningún proceso de navegador

Las URL de CDP remoto pueden incluir autenticación:

- Tokens de consulta (por ejemplo, `https://provider.example?token=<token>`)
- Autenticación HTTP Basic (por ejemplo, `https://user:pass@provider.example`)

OpenClaw conserva la autenticación al llamar a endpoints `/json/*` y al conectarse
al CDP WebSocket. Prefiere variables de entorno o gestores de secretos para
tokens en lugar de confirmarlos en archivos de configuración.

## Proxy de navegador de Node (valor predeterminado sin configuración)

Si ejecutas un **host de nodo** en la máquina que tiene tu navegador, OpenClaw puede
enrutar automáticamente las llamadas a herramientas del navegador a ese nodo sin ninguna configuración adicional del navegador.
Esta es la ruta predeterminada para gateways remotos.

Notas:

- El host de nodo expone su servidor local de control del navegador mediante un **comando proxy**.
- Los perfiles provienen de la propia configuración `browser.profiles` del nodo (igual que local).
- El comando proxy nunca permite mutaciones persistentes de perfiles (`create-profile`, `delete-profile`, `reset-profile`) independientemente de `allowProfiles`; realiza esos cambios directamente en el nodo.
- `nodeHost.browserProxy.allowProfiles` es opcional. Déjalo vacío para el comportamiento heredado/predeterminado: todos los perfiles configurados siguen siendo accesibles mediante el proxy.
- Si configuras `nodeHost.browserProxy.allowProfiles`, OpenClaw lo trata como un límite de privilegio mínimo que limita los nombres de perfil a los que apuntará el proxy.
- Desactívalo si no lo quieres:
  - En el nodo: `nodeHost.browserProxy.enabled=false`
  - En el gateway: `gateway.nodes.browser.mode="off"` (también acepta `"auto"` para elegir un único nodo de navegador conectado, o `"manual"` para requerir un parámetro de nodo explícito)

## Browserless (CDP remoto hospedado)

[Browserless](https://browserless.io) es un servicio Chromium hospedado que expone
URL de conexión CDP mediante HTTPS y WebSocket. OpenClaw puede usar cualquiera de las dos formas, pero
para un perfil de navegador remoto la opción más sencilla es la URL WebSocket directa
de la documentación de conexión de Browserless.

Ejemplo:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

Notas:

- Sustituye `<BROWSERLESS_API_KEY>` por tu token real de Browserless.
- Elige el endpoint de región que coincida con tu cuenta de Browserless (consulta su documentación).
- Si Browserless te da una URL base HTTPS, puedes convertirla a
  `wss://` para una conexión CDP directa o conservar la URL HTTPS y dejar que OpenClaw
  descubra `/json/version`.

### Browserless Docker en el mismo host

Cuando Browserless se autoaloja en Docker y OpenClaw se ejecuta en el host, trata
Browserless como un servicio CDP administrado externamente:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    profiles: {
      browserless: {
        cdpUrl: "ws://127.0.0.1:3000",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

La dirección en `browser.profiles.browserless.cdpUrl` debe ser accesible desde el
proceso de OpenClaw. Browserless también debe anunciar un endpoint accesible
coincidente; configura `EXTERNAL` de Browserless con esa misma base WebSocket
pública hacia OpenClaw, como `ws://127.0.0.1:3000`, `ws://browserless:3000` o una
dirección privada estable de red Docker. Si `/json/version` devuelve
`webSocketDebuggerUrl` apuntando a una dirección que OpenClaw no puede alcanzar,
el HTTP de CDP puede parecer correcto mientras que la conexión WebSocket aún
falla.

No dejes `attachOnly` sin configurar para un perfil Browserless de loopback. Sin
`attachOnly`, OpenClaw trata el puerto de loopback como un perfil de navegador
local administrado y puede informar que el puerto está en uso, pero que no
pertenece a OpenClaw.

## Proveedores directos de CDP WebSocket

Algunos servicios de navegadores alojados exponen un endpoint **WebSocket directo**
en lugar del descubrimiento CDP estándar basado en HTTP (`/json/version`).
OpenClaw acepta tres formas de URL CDP y elige automáticamente la estrategia de
conexión correcta:

- **Descubrimiento HTTP(S)** - `http://host[:port]` o `https://host[:port]`.
  OpenClaw llama a `/json/version` para descubrir la URL del depurador WebSocket
  y luego se conecta. Sin respaldo WebSocket.
- **Endpoints WebSocket directos** - `ws://host[:port]/devtools/<kind>/<id>` o
  `wss://...` con una ruta `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw se conecta directamente mediante un handshake WebSocket y omite
  `/json/version` por completo.
- **Raíces WebSocket sin ruta** - `ws://host[:port]` o `wss://host[:port]` sin
  ruta `/devtools/...` (por ejemplo, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw intenta primero el
  descubrimiento HTTP `/json/version` (normalizando el esquema a `http`/`https`);
  si el descubrimiento devuelve un `webSocketDebuggerUrl`, se usa; de lo contrario,
  OpenClaw recurre a un handshake WebSocket directo en la raíz sin ruta. Si el
  endpoint WebSocket anunciado rechaza el handshake CDP, pero la raíz sin ruta
  configurada lo acepta, OpenClaw también recurre a esa raíz. Esto permite que una
  raíz `ws://` sin ruta apuntando a un Chrome local todavía se conecte, ya que
  Chrome solo acepta actualizaciones WebSocket en la ruta específica por destino
  de `/json/version`, mientras que los proveedores alojados aún pueden usar su
  endpoint WebSocket raíz cuando su endpoint de descubrimiento anuncia una URL
  de corta duración que no es adecuada para CDP de Playwright.

`openclaw browser doctor` usa la misma lógica de primero descubrimiento y luego
respaldo WebSocket que la conexión en tiempo de ejecución, por lo que una URL de
raíz sin ruta que se conecta correctamente no se informa como inaccesible en los
diagnósticos.

### Browserbase

[Browserbase](https://www.browserbase.com) es una plataforma en la nube para
ejecutar navegadores sin interfaz con resolución integrada de CAPTCHA, modo
furtivo y proxies residenciales.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

Notas:

- [Regístrate](https://www.browserbase.com/sign-up) y copia tu **API Key**
  desde el [panel de información general](https://www.browserbase.com/overview).
- Sustituye `<BROWSERBASE_API_KEY>` por tu clave de API real de Browserbase.
- Browserbase crea automáticamente una sesión de navegador al conectarse por
  WebSocket, por lo que no se necesita un paso manual de creación de sesión.
- Consulta [precios](https://www.browserbase.com/pricing) para conocer los
  límites actuales del nivel gratuito y los planes de pago.
- Consulta la [documentación de Browserbase](https://docs.browserbase.com) para
  la referencia completa de la API, guías de SDK y ejemplos de integración.

### Notte

[Notte](https://www.notte.cc) es una plataforma en la nube para ejecutar
navegadores sin interfaz con capacidades integradas de sigilo, proxies
residenciales y un Gateway WebSocket nativo de CDP.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "notte",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      notte: {
        cdpUrl: "wss://us-prod.notte.cc/sessions/connect?token=<NOTTE_API_KEY>",
        color: "#7C3AED",
      },
    },
  },
}
```

Notas:

- [Regístrate](https://console.notte.cc) y copia tu **API Key** desde la página
  de configuración de la consola.
- Sustituye `<NOTTE_API_KEY>` por tu clave de API real de Notte.
- Notte crea automáticamente una sesión de navegador al conectarse por
  WebSocket, por lo que no se necesita un paso manual de creación de sesión. La
  sesión se destruye cuando se desconecta el WebSocket.
- Consulta [precios](https://www.notte.cc/#pricing) para conocer los límites
  actuales del nivel gratuito y los planes de pago.
- Consulta la [documentación de Notte](https://docs.notte.cc) para la referencia
  completa de la API, guías de SDK y ejemplos de integración.

## Seguridad

Ideas clave:

- El control del navegador es solo de loopback; el acceso fluye a través de la autenticación del Gateway o el emparejamiento del nodo.
- La API HTTP independiente del navegador de loopback usa **solo autenticación con secreto compartido**:
  autenticación bearer con token del gateway, `x-openclaw-password` o autenticación HTTP Basic con la
  contraseña de gateway configurada.
- Los encabezados de identidad de Tailscale Serve y `gateway.auth.mode: "trusted-proxy"` **no** autentican esta API independiente del navegador de loopback.
- Si el control del navegador está habilitado y no hay autenticación con secreto compartido configurada, OpenClaw
  genera automáticamente y persiste una credencial de control del navegador al iniciar:
  un token cuando `gateway.auth.mode` es `none`, o una contraseña cuando es
  `trusted-proxy` (persistida mediante `gateway.auth.password` para que los clientes
  de loopback fuera del proceso puedan resolverla). La generación automática se omite cuando ya hay una
  credencial de cadena explícita configurada para ese modo, o cuando
  `gateway.auth.mode` es `password`.
- Configura `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` u
  `OPENCLAW_GATEWAY_PASSWORD` explícitamente si quieres un secreto estable que controles
  en lugar del generado.

Consejos de CDP remoto:

- Prefiere endpoints cifrados (HTTPS o WSS) y tokens de corta duración cuando sea posible.
- Evita incrustar tokens de larga duración directamente en archivos de configuración.
- Mantén el Gateway y cualquier host de nodo en una red privada (Tailscale); evita la exposición pública.
- Trata las URL/tokens de CDP remoto como secretos; prefiere variables de entorno o un gestor de secretos.

## Perfiles (varios navegadores)

OpenClaw admite varios perfiles con nombre (configuraciones de enrutamiento). Los perfiles pueden ser:

- **gestionado por openclaw**: una instancia dedicada de navegador basado en Chromium con su propio directorio de datos de usuario + puerto CDP
- **remoto**: una URL CDP explícita (navegador basado en Chromium ejecutándose en otro lugar)
- **sesión existente**: tu perfil de Chrome existente mediante conexión automática de Chrome DevTools MCP

Valores predeterminados:

- El perfil `openclaw` se crea automáticamente si falta.
- El perfil `user` está incorporado para la conexión a sesión existente de Chrome MCP.
- Los perfiles de sesión existente son opcionales más allá de `user`; créalos con `--driver existing-session`.
- Los puertos CDP locales se asignan desde **18800-18899** de forma predeterminada.
- Eliminar un perfil mueve su directorio de datos local a la papelera.

Todos los endpoints de control aceptan `?profile=<name>`; la CLI usa `--browser-profile`.

## Sesión existente mediante Chrome DevTools MCP

OpenClaw también puede conectarse a un perfil de navegador basado en Chromium en ejecución mediante el
servidor oficial Chrome DevTools MCP. Esto reutiliza las pestañas y el estado de inicio de sesión
ya abiertos en ese perfil de navegador.

Referencias oficiales de contexto y configuración:

- [Chrome for Developers: Usa Chrome DevTools MCP con tu sesión de navegador](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README de Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Perfil incorporado: `user`. Crea tu propio perfil personalizado de sesión existente si
quieres un nombre, color o directorio de datos de navegador diferente.

De forma predeterminada, el perfil incorporado `user` usa la conexión automática de Chrome MCP, que
apunta al perfil local predeterminado de Google Chrome. Usa `userDataDir` para Brave,
Edge, Chromium o un perfil de Chrome no predeterminado. `~` se expande al directorio
principal de tu sistema operativo:

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

Luego, en el navegador correspondiente:

1. Abre la página de inspección de ese navegador para depuración remota.
2. Habilita la depuración remota.
3. Mantén el navegador en ejecución y aprueba el aviso de conexión cuando OpenClaw se conecte.

Páginas de inspección comunes:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Prueba rápida de conexión en vivo:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Cómo se ve el éxito:

- `status` muestra `driver: existing-session`
- `status` muestra `transport: chrome-mcp`
- `status` muestra `running: true`
- `tabs` lista tus pestañas de navegador ya abiertas
- `snapshot` devuelve referencias de la pestaña activa seleccionada

Qué comprobar si la conexión no funciona:

- el navegador de destino basado en Chromium tiene la versión `144+`
- la depuración remota está habilitada en la página de inspección de ese navegador
- el navegador mostró el aviso de consentimiento de conexión y lo aceptaste
- si Chrome se inició con un `--remote-debugging-port` explícito, configura
  `browser.profiles.<name>.cdpUrl` con ese endpoint de DevTools en lugar de depender
  de la conexión automática de Chrome MCP
- `openclaw doctor` migra la configuración antigua del navegador basada en extensión y comprueba que
  Chrome esté instalado localmente para los perfiles predeterminados de conexión automática, pero no puede
  habilitar la depuración remota del lado del navegador por ti

Uso por parte de agentes:

- Usa `profile="user"` cuando necesites el estado de navegador con sesión iniciada del usuario.
- Si usas un perfil personalizado de sesión existente, pasa ese nombre de perfil explícito.
- Elige este modo solo cuando el usuario esté en la computadora para aprobar el aviso
  de conexión.
- El Gateway o host de nodo puede generar `npx chrome-devtools-mcp@latest --autoConnect`.

Notas:

- Esta ruta tiene más riesgo que el perfil aislado `openclaw` porque puede
  actuar dentro de tu sesión de navegador iniciada.
- OpenClaw no inicia el navegador para este controlador; solo se conecta.
- OpenClaw usa aquí el flujo oficial `--autoConnect` de Chrome DevTools MCP. Si
  `userDataDir` está configurado, se pasa para apuntar a ese directorio de datos de usuario.
- La sesión existente puede conectarse en el host seleccionado o mediante un nodo
  de navegador conectado. Si Chrome está en otro lugar y no hay ningún nodo de navegador conectado, usa
  CDP remoto o un host de nodo en su lugar.

### Inicio personalizado de Chrome MCP

Anula el servidor Chrome DevTools MCP iniciado por perfil cuando el flujo predeterminado
`npx chrome-devtools-mcp@latest` no sea lo que quieres (hosts sin conexión,
versiones fijadas, binarios incluidos):

| Campo        | Qué hace                                                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Ejecutable que se inicia en lugar de `npx`. Se resuelve tal cual; se respetan las rutas absolutas.                         |
| `mcpArgs`    | Arreglo de argumentos pasado textualmente a `mcpCommand`. Sustituye los argumentos predeterminados `chrome-devtools-mcp@latest --autoConnect`. |

Cuando `cdpUrl` está configurado en un perfil de sesión existente, OpenClaw omite
`--autoConnect` y reenvía automáticamente el endpoint a Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (endpoint de descubrimiento HTTP de DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (CDP WebSocket directo).

Las banderas de endpoint y `userDataDir` no se pueden combinar: cuando `cdpUrl` está configurado,
`userDataDir` se ignora para el inicio de Chrome MCP, ya que Chrome MCP se conecta al
navegador en ejecución detrás del endpoint en lugar de abrir un directorio de
perfil.

<Accordion title="Limitaciones de la función de sesión existente">

En comparación con el perfil administrado `openclaw`, los controladores de sesión existente están más restringidos:

- **Capturas de pantalla** - las capturas de página y las capturas de elementos con `--ref` funcionan; los selectores CSS `--element` no. Playwright no es necesario para capturas de página ni de elementos basadas en ref. (`--full-page` no puede combinarse con `--ref` ni `--element` en ningún perfil, no solo en existing-session.)
- **Acciones** - `click`, `type`, `hover`, `scrollIntoView`, `drag` y `select` requieren refs de snapshot (sin selectores CSS). `click-coords` hace clic en coordenadas visibles del viewport y no requiere una ref de snapshot. `click` solo usa el botón izquierdo (sin sobrescrituras de botón ni modificadores). `type` no admite `slowly=true`; usa `fill` o `press`. `press` no admite `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` y `evaluate` no admiten sobrescrituras de `timeoutMs` por llamada. `select` acepta un único valor. `batch` no es compatible; envía las acciones individualmente.
- **Espera / carga / diálogo** - `wait --url` admite patrones exactos, de subcadena y glob (igual que managed); `wait --load networkidle` no es compatible con perfiles existing-session (funciona en perfiles managed y CDP raw/remote). Los hooks de carga requieren `ref` o `inputRef`, un archivo a la vez, sin `element` CSS. Los hooks de diálogo no admiten sobrescrituras de timeout ni `dialogId`.
- **Visibilidad de diálogos** - Las respuestas de acciones del navegador managed incluyen `blockedByDialog` y `browserState.dialogs.pending` cuando una acción abre un cuadro de diálogo modal; los snapshots también incluyen el estado de diálogo pendiente. Responde con `browser dialog --accept/--dismiss --dialog-id <id>` mientras haya un diálogo pendiente. Los diálogos gestionados fuera de OpenClaw aparecen en `browserState.dialogs.recent`.
- **Funciones solo de managed** - La exportación de PDF, la interceptación de descargas y `responsebody` siguen requiriendo la ruta del navegador managed.

</Accordion>

## Garantías de aislamiento

- **Directorio de datos de usuario dedicado**: nunca toca tu perfil personal del navegador.
- **Puertos dedicados**: evita `9222` para prevenir colisiones con flujos de trabajo de desarrollo.
- **Control determinista de pestañas**: `tabs` devuelve primero `suggestedTargetId`, luego
  handles `tabId` estables como `t1`, etiquetas opcionales y el `targetId` sin procesar.
  Los agentes deben reutilizar `suggestedTargetId`; los ids sin procesar siguen disponibles para
  depuración y compatibilidad.

## Selección del navegador

Al iniciarse localmente, OpenClaw elige el primero disponible:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Puedes sobrescribirlo con `browser.executablePath`.

Plataformas:

- macOS: comprueba `/Applications` y `~/Applications`.
- Linux: comprueba ubicaciones comunes de Chrome/Brave/Edge/Chromium bajo `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` y
  `/usr/lib/chromium-browser`, además del Chromium gestionado por Playwright bajo
  `PLAYWRIGHT_BROWSERS_PATH` o `~/.cache/ms-playwright`.
- Windows: comprueba ubicaciones de instalación comunes.

## API de control (opcional)

Para scripting y depuración, el Gateway expone una pequeña **API HTTP de control
solo local loopback**, además de una CLI `openclaw browser` correspondiente (snapshots, refs, mejoras de espera, salida
JSON, flujos de depuración). Consulta
[API de control del navegador](/es/tools/browser-control) para la referencia completa.

## Solución de problemas

Para problemas específicos de Linux (especialmente snap Chromium), consulta
[Solución de problemas del navegador](/es/tools/browser-linux-troubleshooting).

Para configuraciones divididas de WSL2 Gateway + Windows Chrome en hosts separados, consulta
[Solución de problemas de WSL2 + Windows + CDP remoto de Chrome](/es/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Fallo de inicio de CDP frente a bloqueo SSRF de navegación

Estas son clases de fallo distintas y apuntan a rutas de código distintas.

- **Fallo de inicio o preparación de CDP** significa que OpenClaw no puede confirmar que el plano de control del navegador esté sano.
- **Bloqueo SSRF de navegación** significa que el plano de control del navegador está sano, pero la política rechaza un destino de navegación de página.

Ejemplos comunes:

- Fallo de inicio o preparación de CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` cuando se
    configura un servicio CDP externo local loopback sin `attachOnly: true`
- Bloqueo SSRF de navegación:
  - Los flujos de `open`, `navigate`, snapshot o apertura de pestañas fallan con un error de política de navegador/red mientras `start` y `tabs` siguen funcionando

Usa esta secuencia mínima para separar ambos casos:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Cómo interpretar los resultados:

- Si `start` falla con `not reachable after start`, soluciona primero la preparación de CDP.
- Si `start` tiene éxito pero `tabs` falla, el plano de control sigue sin estar sano. Trata esto como un problema de alcance de CDP, no como un problema de navegación de página.
- Si `start` y `tabs` tienen éxito pero `open` o `navigate` falla, el plano de control del navegador está activo y el fallo está en la política de navegación o en la página de destino.
- Si `start`, `tabs` y `open` tienen éxito, la ruta básica de control del navegador managed está sana.

Detalles importantes de comportamiento:

- La configuración del navegador usa de forma predeterminada un objeto de política SSRF cerrado ante fallos incluso cuando no configuras `browser.ssrfPolicy`.
- Para el perfil managed `openclaw` de local loopback, las comprobaciones de salud de CDP omiten intencionadamente la aplicación de alcance SSRF del navegador para el propio plano de control local de OpenClaw.
- La protección de navegación es independiente. Un resultado exitoso de `start` o `tabs` no significa que un destino posterior de `open` o `navigate` esté permitido.

Guía de seguridad:

- **No** relajes la política SSRF del navegador de forma predeterminada.
- Prefiere excepciones estrechas de host como `hostnameAllowlist` o `allowedHostnames` en lugar de acceso amplio a redes privadas.
- Usa `dangerouslyAllowPrivateNetwork: true` solo en entornos intencionadamente confiables donde el acceso del navegador a redes privadas sea necesario y haya sido revisado.

## Herramientas del agente + cómo funciona el control

El agente recibe **una herramienta** para automatización del navegador:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Cómo se asigna:

- `browser snapshot` devuelve un árbol de UI estable (IA o ARIA).
- `browser act` usa los IDs `ref` del snapshot para hacer clic/escribir/arrastrar/seleccionar.
- `browser screenshot` captura píxeles (página completa, elemento o refs etiquetadas).
- `browser doctor` comprueba la preparación de Gateway, Plugin, perfil, navegador y pestañas.
- `browser` acepta:
  - `profile` para elegir un perfil de navegador con nombre (openclaw, chrome o CDP remoto).
  - `target` (`sandbox` | `host` | `node`) para seleccionar dónde vive el navegador.
  - En sesiones con sandbox, `target: "host"` requiere `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Si se omite `target`: las sesiones con sandbox usan `sandbox` de forma predeterminada, las sesiones sin sandbox usan `host` de forma predeterminada.
  - Si hay un Node con capacidad de navegador conectado, la herramienta puede enrutar automáticamente hacia él salvo que fijes `target="host"` o `target="node"`.

Esto mantiene al agente determinista y evita selectores frágiles.

## Relacionado

- [Resumen de herramientas](/es/tools) - todas las herramientas de agente disponibles
- [Sandboxing](/es/gateway/sandboxing) - control del navegador en entornos con sandbox
- [Seguridad](/es/gateway/security) - riesgos y endurecimiento del control del navegador
