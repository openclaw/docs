---
read_when:
    - Agregar automatización del navegador controlada por agentes
    - Depurar por qué openclaw interfiere con tu propio Chrome
    - Implementación de ajustes del navegador + ciclo de vida en la aplicación de macOS
summary: Servicio integrado de control del navegador + comandos de acción
title: Navegador (gestionado por OpenClaw)
x-i18n:
    generated_at: "2026-07-05T11:47:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee559960dc0a07855c46d339b25786d7e58cfbd91a3e150853642d9cc9c99137
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw puede ejecutar un **perfil dedicado de Chrome/Brave/Edge/Chromium** que controla el agente. Se ejecuta mediante un pequeño servicio de control local dentro del Gateway (solo loopback) y está aislado de tu navegador personal.

- Piensa en él como un **navegador separado, solo para el agente**. El perfil `openclaw` nunca toca tu perfil de navegador personal.
- El agente abre pestañas, lee páginas, hace clic y escribe en esta vía aislada.
- En cambio, el perfil integrado `user` se conecta a tu sesión real de Chrome con sesión iniciada, mediante Chrome DevTools MCP.

## Qué obtienes

- Un perfil de navegador separado llamado **openclaw** (acento naranja de forma predeterminada).
- Control determinista de pestañas (listar/abrir/enfocar/cerrar).
- Acciones del agente (clic/escritura/arrastrar/seleccionar), instantáneas, capturas de pantalla, PDF.
- Una skill `browser-automation` incluida que enseña a los agentes el bucle de recuperación de instantáneas,
  pestañas estables, referencias obsoletas y bloqueadores manuales cuando el Plugin del navegador
  está habilitado.
- Compatibilidad opcional con varios perfiles (`openclaw`, `work`, `remote`, ...).

Este navegador **no** es tu navegador diario. Es una superficie segura y aislada para
la automatización y verificación del agente.

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
[Configuración](#configuration) y [Control del Plugin](#plugin-control).

Si `openclaw browser` no existe en absoluto, o el agente dice que la herramienta de navegador
no está disponible, ve a [Falta el comando o la herramienta del navegador](#missing-browser-command-or-tool).

## Control del Plugin

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

Los valores predeterminados necesitan tanto `plugins.entries.browser.enabled` **como** `browser.enabled=true`. Deshabilitar solo el Plugin elimina el CLI `openclaw browser`, el método de Gateway `browser.request`, la herramienta del agente y el servicio de control como una unidad; tu configuración `browser.*` permanece intacta para un reemplazo.

Los cambios en la configuración del navegador requieren reiniciar el Gateway para que el Plugin pueda volver a registrar su servicio.

## Guía para agentes

Nota sobre el perfil de herramientas: `tools.profile: "coding"` incluye `web_search` y
`web_fetch`, pero no la herramienta completa `browser`. Para permitir que el agente o un
subagente generado use automatización del navegador, añade el navegador en la etapa de
perfil:

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

El Plugin del navegador incluye dos niveles de guía para agentes:

- La descripción de la herramienta `browser` lleva el contrato compacto siempre activo: elegir
  el perfil correcto, mantener las referencias en la misma pestaña, usar `tabId`/etiquetas para
  apuntar a pestañas y cargar la skill de navegador para trabajos de varios pasos.
- La skill incluida `browser-automation` lleva el bucle operativo más largo:
  comprobar primero el estado/las pestañas, etiquetar las pestañas de tarea, tomar una instantánea antes de actuar, volver a tomar una instantánea
  después de cambios de UI, recuperar referencias obsoletas una vez e informar inicios de sesión/2FA/captcha o
  bloqueadores de cámara/micrófono como acción manual en lugar de adivinar.

Las Skills incluidas por Plugins aparecen en las Skills disponibles del agente cuando el
Plugin está habilitado. Las instrucciones completas de la skill se cargan bajo demanda, por lo que los turnos
rutinarios no pagan el coste completo en tokens.

## Falta el comando o la herramienta del navegador

Si `openclaw browser` es desconocido después de una actualización, falta `browser.request` o el agente informa que la herramienta de navegador no está disponible, la causa habitual es una lista `plugins.allow` que omite `browser` y no existe ningún bloque de configuración raíz `browser`. Añádelo:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Un bloque raíz explícito `browser` (cualquier clave bajo `browser`, como
`browser.enabled=true` o `browser.profiles.<name>`) activa el Plugin de navegador incluido
incluso con un `plugins.allow` restrictivo, de forma coherente con el comportamiento de configuración de canales
incluidos. `plugins.entries.browser.enabled=true` y
`tools.alsoAllow: ["browser"]` no sustituyen por sí solos la pertenencia a la lista de permitidos.
Eliminar `plugins.allow` por completo también restaura el valor predeterminado.

## Perfiles: `openclaw` frente a `user`

- `openclaw`: navegador administrado y aislado (no requiere extensión).
- `user`: perfil integrado de conexión MCP de Chrome DevTools para tu sesión **real
  de Chrome con sesión iniciada**.

Para llamadas de herramientas de navegador del agente:

- Predeterminado: usar el navegador aislado `openclaw`.
- Prefiere `profile="user"` cuando importen las sesiones existentes con sesión iniciada y el usuario
  esté en el ordenador para hacer clic/aprobar cualquier aviso de conexión.
- `profile` es la anulación explícita cuando quieres un modo de navegador específico.

Define `browser.defaultProfile: "openclaw"` si quieres el modo administrado de forma predeterminada.

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

`browser.snapshotDefaults.mode: "efficient"` cambia el modo predeterminado de extracción de `snapshot`
cuando un llamador no pasa un `snapshotFormat` o `mode` explícito; consulta [API de control del navegador](/es/tools/browser-control) para ver las opciones de instantánea por llamada.

### Visión de capturas de pantalla (compatibilidad con modelos solo de texto)

Cuando el modelo principal es solo de texto (sin compatibilidad con visión/multimodal), las
capturas de pantalla del navegador devuelven bloques de imagen que el modelo no puede leer. Las capturas de pantalla del navegador
reutilizan la configuración existente de comprensión de imágenes, por lo que un modelo de imagen
configurado para comprensión multimedia puede describir capturas de pantalla como texto sin ninguna
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
2. La herramienta del navegador pregunta al runtime existente de comprensión de imágenes si
   puede describir la captura usando modelos multimedia de imagen configurados, modelos multimedia
   compartidos, valores predeterminados de modelo de imagen o un proveedor de imagen respaldado por autenticación.
3. El modelo de visión devuelve una descripción de texto, que se envuelve con
   `wrapExternalContent` (protección contra inyección de prompts) y se devuelve al agente
   como un bloque de texto en lugar de un bloque de imagen.
4. Si la comprensión de imágenes no está disponible, se omite o falla, el navegador recurre
   a devolver el bloque de imagen original.

Usa los campos existentes `tools.media.image` / `tools.media.models` para
alternativas de modelos, tiempos de espera, límites de bytes, perfiles y configuración de solicitudes a proveedores.

Si el modelo principal activo ya admite visión y no se ha configurado ningún modelo explícito de
comprensión de imágenes, OpenClaw conserva el resultado de imagen normal para que el
modelo principal pueda leer directamente la captura de pantalla.

<AccordionGroup>

<Accordion title="Puertos y accesibilidad">

- El servicio de control se vincula a loopback en un puerto derivado de `gateway.port` (predeterminado `18791` = gateway + 2). `OPENCLAW_GATEWAY_PORT` tiene prioridad sobre `gateway.port`; cualquiera de los dos desplaza los puertos derivados dentro de la misma familia.
- Los perfiles locales `openclaw` asignan automáticamente `cdpPort`/`cdpUrl` desde un rango que comienza 9 puertos por encima del puerto de control (predeterminado `18800`-`18899`); define esos valores solo para
  perfiles CDP remotos o conexión a endpoints de sesión existente. `cdpUrl` usa de forma predeterminada
  el puerto CDP local administrado cuando no se define.
- `remoteCdpTimeoutMs` se aplica a comprobaciones de accesibilidad HTTP de CDP remoto y `attachOnly`,
  y a solicitudes HTTP de apertura de pestañas; `remoteCdpHandshakeTimeoutMs` se aplica a
  sus handshakes WebSocket de CDP.
- `localLaunchTimeoutMs` es el presupuesto para que un proceso Chrome administrado lanzado localmente
  exponga su endpoint HTTP de CDP. `localCdpReadyTimeoutMs` es el presupuesto
  posterior para la preparación del websocket CDP después de descubrir el proceso.
  Aumenta estos valores en Raspberry Pi, VPS de gama baja o hardware antiguo donde Chromium
  arranca lentamente. Los valores deben ser enteros positivos hasta `120000` ms; los valores de
  configuración no válidos se rechazan.
- Los fallos repetidos de lanzamiento/preparación de Chrome administrado se cortan mediante circuito por
  perfil. Después de varios fallos consecutivos, OpenClaw pausa brevemente los nuevos intentos de
  lanzamiento en lugar de iniciar Chromium en cada llamada de herramienta del navegador. Corrige
  el problema de arranque, deshabilita el navegador si no se necesita o reinicia el
  Gateway después de la reparación.
- `actionTimeoutMs` es el presupuesto predeterminado para solicitudes `act` del navegador cuando el llamador no pasa `timeoutMs`. El transporte del cliente añade una pequeña ventana de margen para que las esperas largas puedan finalizar en lugar de agotar el tiempo en el límite HTTP.
- `tabCleanup` es una limpieza de mejor esfuerzo para pestañas abiertas por sesiones de navegador del agente principal. La limpieza de ciclo de vida de subagentes, cron y ACP sigue cerrando sus pestañas rastreadas explícitamente al final de la sesión; las sesiones principales mantienen reutilizables las pestañas activas y luego cierran en segundo plano las pestañas rastreadas inactivas o sobrantes.

</Accordion>

<Accordion title="Política SSRF">

- La navegación del navegador y las pestañas abiertas se protegen contra SSRF antes de la navegación y se vuelven a comprobar, en la medida de lo posible, en la URL final `http(s)` después.
- En modo SSRF estricto, también se comprueban la detección de endpoints CDP remotos y las sondas `/json/version` (`cdpUrl`).
- Las variables de entorno `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` y `NO_PROXY` de Gateway/proveedor no aplican proxy automáticamente al navegador gestionado por OpenClaw. Chrome gestionado se inicia directamente de forma predeterminada para que la configuración de proxy del proveedor no debilite las comprobaciones SSRF del navegador.
- Las sondas locales de preparación CDP gestionadas por OpenClaw y las conexiones WebSocket de DevTools omiten el proxy de red gestionado para el endpoint loopback exacto iniciado, por lo que `openclaw browser start` sigue funcionando cuando un proxy de operador bloquea la salida loopback.
- Para aplicar proxy al propio navegador gestionado, pasa flags de proxy explícitas de Chrome mediante `browser.extraArgs`, como `--proxy-server=...` o `--proxy-pac-url=...`. El modo SSRF estricto bloquea el enrutamiento explícito de proxy del navegador salvo que el acceso del navegador a redes privadas esté habilitado intencionalmente.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` está desactivado de forma predeterminada; habilítalo solo cuando se confíe intencionalmente en el acceso del navegador a redes privadas.
- `browser.ssrfPolicy.allowPrivateNetwork` sigue siendo compatible como alias heredado.

</Accordion>

<Accordion title="Profile behavior">

- `attachOnly: true` significa que nunca se inicia un navegador local; solo se adjunta si ya hay uno en ejecución.
- `headless` se puede configurar globalmente o por perfil local gestionado. Los valores por perfil anulan `browser.headless`, por lo que un perfil iniciado localmente puede seguir en modo headless mientras otro permanece visible.
- `POST /start?headless=true` y `openclaw browser start --headless` solicitan un
  lanzamiento headless puntual para perfiles locales gestionados sin reescribir
  `browser.headless` ni la configuración del perfil. Los perfiles de sesión existente, solo adjuntar y
  CDP remoto rechazan la anulación porque OpenClaw no inicia esos
  procesos de navegador.
- En hosts Linux sin `DISPLAY` ni `WAYLAND_DISPLAY`, los perfiles locales gestionados
  pasan automáticamente a headless de forma predeterminada cuando ni el entorno ni la configuración
  de perfil/global eligen explícitamente el modo con interfaz. `openclaw browser status --json`
  informa `headlessSource` como `env`, `profile`, `config`,
  `request`, `linux-display-fallback` o `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` fuerza lanzamientos locales gestionados en modo headless para el
  proceso actual. `OPENCLAW_BROWSER_HEADLESS=0` fuerza el modo con interfaz para inicios
  ordinarios y devuelve un error accionable en hosts Linux sin servidor de pantalla;
  una solicitud explícita `start --headless` sigue teniendo prioridad para ese lanzamiento.
- `executablePath` se puede configurar globalmente o por perfil local gestionado. Los valores por perfil anulan `browser.executablePath`, por lo que distintos perfiles gestionados pueden iniciar distintos navegadores basados en Chromium. Ambas formas aceptan `~` para el directorio de inicio de tu sistema operativo.
- `color` (de nivel superior y por perfil) tiñe la interfaz del navegador para que puedas ver qué perfil está activo.
- El perfil predeterminado es `openclaw` (standalone gestionado). Usa `defaultProfile: "user"` para optar por el navegador del usuario con sesión iniciada.
- Orden de detección automática: navegador predeterminado del sistema si está basado en Chromium; si no, Chrome, Brave, Edge, Chromium, Chrome Canary.
- `driver: "existing-session"` usa Chrome DevTools MCP en lugar de CDP sin procesar. Puede adjuntarse mediante la conexión automática de Chrome MCP, o mediante `cdpUrl` cuando ya tienes un endpoint de DevTools para el navegador en ejecución.
- Configura `browser.profiles.<name>.userDataDir` cuando un perfil de sesión existente deba adjuntarse a un perfil de usuario no predeterminado de Chromium (Brave, Edge, etc.). Esta ruta también acepta `~` para el directorio de inicio de tu sistema operativo.

</Accordion>

</AccordionGroup>

## Usar Brave u otro navegador basado en Chromium

Si tu navegador **predeterminado del sistema** está basado en Chromium (Chrome/Brave/Edge/etc),
OpenClaw lo usa automáticamente. Configura `browser.executablePath` para anular
la detección automática. Los valores `executablePath` de nivel superior y por perfil aceptan `~`
para el directorio de inicio de tu sistema operativo:

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

`executablePath` por perfil solo afecta a los perfiles locales gestionados que OpenClaw
inicia. Los perfiles `existing-session` se adjuntan a un navegador ya en ejecución
en su lugar, y los perfiles CDP remotos usan el navegador detrás de `cdpUrl`.

## Control local frente a remoto

- **Control local (predeterminado):** el Gateway inicia el servicio de control loopback y puede iniciar un navegador local.
- **Control remoto (host de nodo):** ejecuta un host de nodo en la máquina que tiene el navegador; el Gateway reenvía las acciones del navegador a él mediante proxy.
- **CDP remoto:** configura `browser.profiles.<name>.cdpUrl` (o `browser.cdpUrl`) para
  adjuntarte a un navegador remoto basado en Chromium. En este caso, OpenClaw no iniciará un navegador local.
- Para servicios CDP gestionados externamente en loopback (por ejemplo Browserless en
  Docker publicado en `127.0.0.1`), configura también `attachOnly: true`. CDP en loopback
  sin `attachOnly` se trata como un perfil de navegador local gestionado por OpenClaw.
- `headless` solo afecta a perfiles locales gestionados que OpenClaw inicia. No reinicia ni cambia navegadores de sesión existente o CDP remoto.
- `executablePath` sigue la misma regla de perfil local gestionado. Cambiarlo en un
  perfil local gestionado en ejecución marca ese perfil para reinicio/reconciliación para que el
  siguiente lanzamiento use el nuevo binario.

El comportamiento de detención varía según el modo de perfil:

- perfiles locales gestionados: `openclaw browser stop` detiene el proceso de navegador que
  OpenClaw inició
- perfiles solo adjuntar y CDP remoto: `openclaw browser stop` cierra la sesión de
  control activa y libera las anulaciones de emulación de Playwright/CDP (viewport,
  esquema de color, configuración regional, zona horaria, modo sin conexión y estado similar),
  aunque OpenClaw no haya iniciado ningún proceso de navegador

Las URL CDP remotas pueden incluir autenticación:

- Tokens de consulta (por ejemplo, `https://provider.example?token=<token>`)
- Autenticación HTTP Basic (por ejemplo, `https://user:pass@provider.example`)

OpenClaw conserva la autenticación al llamar a endpoints `/json/*` y al conectarse
al WebSocket CDP. Prefiere variables de entorno o gestores de secretos para
tokens en lugar de confirmarlos en archivos de configuración.

## Proxy de navegador de nodo (predeterminado sin configuración)

Si ejecutas un **host de nodo** en la máquina que tiene tu navegador, OpenClaw puede
enrutar automáticamente las llamadas de herramientas del navegador a ese nodo sin configuración adicional del navegador.
Esta es la ruta predeterminada para gateways remotos.

Notas:

- El host de nodo expone su servidor local de control del navegador mediante un **comando proxy**.
- Los perfiles provienen de la propia configuración `browser.profiles` del nodo (igual que en local).
- El comando proxy nunca permite mutaciones persistentes de perfiles (`create-profile`, `delete-profile`, `reset-profile`) independientemente de `allowProfiles`; realiza esos cambios directamente en el nodo.
- `nodeHost.browserProxy.allowProfiles` es opcional. Déjalo vacío para el comportamiento heredado/predeterminado: todos los perfiles configurados siguen siendo accesibles mediante el proxy.
- Si configuras `nodeHost.browserProxy.allowProfiles`, OpenClaw lo trata como un límite de privilegio mínimo que limita a qué nombres de perfil apuntará el proxy.
- Desactívalo si no lo quieres:
  - En el nodo: `nodeHost.browserProxy.enabled=false`
  - En el gateway: `gateway.nodes.browser.mode="off"` (también acepta `"auto"` para elegir un único nodo de navegador conectado, o `"manual"` para requerir un parámetro de nodo explícito)

## Browserless (CDP remoto alojado)

[Browserless](https://browserless.io) es un servicio Chromium alojado que expone
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
  detecte `/json/version`.

### Browserless Docker en el mismo host

Cuando Browserless está autoalojado en Docker y OpenClaw se ejecuta en el host, trata
Browserless como un servicio CDP gestionado externamente:

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
proceso de OpenClaw. Browserless también debe anunciar un endpoint alcanzable coincidente;
configura `EXTERNAL` de Browserless con esa misma base WebSocket pública para OpenClaw, como
`ws://127.0.0.1:3000`, `ws://browserless:3000` o una dirección estable de red
privada de Docker. Si `/json/version` devuelve `webSocketDebuggerUrl` apuntando a
una dirección que OpenClaw no puede alcanzar, CDP HTTP puede parecer correcto mientras la
adjunción WebSocket sigue fallando.

No dejes `attachOnly` sin configurar para un perfil Browserless en loopback. Sin
`attachOnly`, OpenClaw trata el puerto loopback como un perfil de navegador local gestionado
y puede informar que el puerto está en uso pero no es propiedad de OpenClaw.

## Proveedores CDP de WebSocket directo

Algunos servicios de navegador alojados exponen un endpoint **WebSocket directo** en lugar de
la detección CDP estándar basada en HTTP (`/json/version`). OpenClaw acepta tres
formas de URL CDP y elige automáticamente la estrategia de conexión correcta:

- **Detección HTTP(S)** - `http://host[:port]` o `https://host[:port]`.
  OpenClaw llama a `/json/version` para detectar la URL del depurador WebSocket y luego
  se conecta. Sin alternativa WebSocket.
- **Endpoints WebSocket directos** - `ws://host[:port]/devtools/<kind>/<id>` o
  `wss://...` con una ruta `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw se conecta directamente mediante un handshake WebSocket y omite
  `/json/version` por completo.
- **Raíces WebSocket desnudas** - `ws://host[:port]` o `wss://host[:port]` sin
  ruta `/devtools/...` (por ejemplo [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw intenta primero la detección HTTP
  `/json/version` (normalizando el esquema a `http`/`https`);
  si la detección devuelve un `webSocketDebuggerUrl`, se usa; de lo contrario OpenClaw
  recurre a un handshake WebSocket directo en la raíz desnuda. Si el endpoint
  WebSocket anunciado rechaza el handshake CDP pero la raíz desnuda configurada
  lo acepta, OpenClaw también recurre a esa raíz. Esto permite que una raíz desnuda `ws://`
  apuntada a un Chrome local siga conectándose, ya que Chrome solo acepta actualizaciones WebSocket
  en la ruta específica por destino de `/json/version`, mientras que los proveedores
  alojados pueden seguir usando su endpoint WebSocket raíz cuando su endpoint de detección
  anuncia una URL de corta duración que no es adecuada para Playwright CDP.

`openclaw browser doctor` usa la misma lógica de detección primero y alternativa WebSocket
que la adjunción en tiempo de ejecución, por lo que una URL de raíz desnuda que se conecta correctamente no se
informa como inalcanzable en los diagnósticos.

### Browserbase

[Browserbase](https://www.browserbase.com) es una plataforma en la nube para ejecutar
navegadores headless con resolución de CAPTCHA integrada, modo sigiloso y proxies
residenciales.

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

- [Regístrate](https://www.browserbase.com/sign-up) y copia tu **clave de API**
  desde el [panel de resumen](https://www.browserbase.com/overview).
- Reemplaza `<BROWSERBASE_API_KEY>` por tu clave de API real de Browserbase.
- Browserbase crea automáticamente una sesión de navegador al conectarse por WebSocket, por lo que no se necesita
  ningún paso manual de creación de sesión.
- Consulta los [precios](https://www.browserbase.com/pricing) para ver los límites actuales del nivel gratuito y los planes de pago.
- Consulta la [documentación de Browserbase](https://docs.browserbase.com) para obtener la referencia completa de la API,
  guías del SDK y ejemplos de integración.

### Notte

[Notte](https://www.notte.cc) es una plataforma en la nube para ejecutar navegadores
sin interfaz gráfica con sigilo integrado, proxies residenciales y un Gateway
WebSocket nativo de CDP.

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

- [Regístrate](https://console.notte.cc) y copia tu **clave de API** desde la
  página de configuración de la consola.
- Reemplaza `<NOTTE_API_KEY>` por tu clave de API real de Notte.
- Notte crea automáticamente una sesión de navegador al conectarse por WebSocket, por lo que no se necesita ningún paso manual
  de creación de sesión. La sesión se destruye cuando se desconecta el
  WebSocket.
- Consulta los [precios](https://www.notte.cc/#pricing) para ver los límites actuales del nivel gratuito y los planes de pago.
- Consulta la [documentación de Notte](https://docs.notte.cc) para obtener la referencia completa de la API, guías del SDK
  y ejemplos de integración.

## Seguridad

Ideas clave:

- El control del navegador es solo por local loopback; el acceso fluye a través de la autenticación del Gateway o el emparejamiento de Node.
- La API HTTP de navegador local loopback independiente usa **solo autenticación con secreto compartido**:
  autenticación bearer con token del Gateway, `x-openclaw-password` o autenticación HTTP básica con la
  contraseña del Gateway configurada.
- Los encabezados de identidad de Tailscale Serve y `gateway.auth.mode: "trusted-proxy"` **no**
  autentican esta API de navegador local loopback independiente.
- Si el control del navegador está habilitado y no se configuró ninguna autenticación con secreto compartido, OpenClaw
  genera automáticamente y persiste una credencial de control del navegador al inicio:
  un token cuando `gateway.auth.mode` es `none`, o una contraseña cuando es
  `trusted-proxy` (persistida mediante `gateway.auth.password` para que los clientes
  local loopback fuera del proceso puedan resolverla). La generación automática se omite cuando ya hay configurada
  una credencial de cadena explícita para ese modo, o cuando
  `gateway.auth.mode` es `password`.
- Configura `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` u
  `OPENCLAW_GATEWAY_PASSWORD` explícitamente si quieres un secreto estable que controles
  en lugar del generado.

Consejos de CDP remoto:

- Prefiere extremos cifrados (HTTPS o WSS) y tokens de corta duración cuando sea posible.
- Evita incrustar tokens de larga duración directamente en archivos de configuración.
- Mantén el Gateway y cualquier host Node en una red privada (Tailscale); evita la exposición pública.
- Trata las URL y tokens de CDP remoto como secretos; prefiere variables de entorno o un gestor de secretos.

## Perfiles (varios navegadores)

OpenClaw admite varios perfiles con nombre (configuraciones de enrutamiento). Los perfiles pueden ser:

- **gestionado por OpenClaw**: una instancia dedicada de navegador basado en Chromium con su propio directorio de datos de usuario + puerto CDP
- **remoto**: una URL CDP explícita (navegador basado en Chromium que se ejecuta en otro lugar)
- **sesión existente**: tu perfil de Chrome existente mediante conexión automática de Chrome DevTools MCP

Valores predeterminados:

- El perfil `openclaw` se crea automáticamente si falta.
- El perfil `user` está integrado para adjuntar una sesión existente de Chrome MCP.
- Los perfiles de sesión existente son opcionales más allá de `user`; créalos con `--driver existing-session`.
- Los puertos CDP locales se asignan desde **18800-18899** de forma predeterminada.
- Al eliminar un perfil, su directorio local de datos se mueve a la papelera.

Todos los extremos de control aceptan `?profile=<name>`; la CLI usa `--browser-profile`.

## Sesión existente mediante Chrome DevTools MCP

OpenClaw también puede adjuntarse a un perfil de navegador basado en Chromium en ejecución mediante el
servidor oficial de Chrome DevTools MCP. Esto reutiliza las pestañas y el estado de inicio de sesión
que ya están abiertos en ese perfil de navegador.

Referencias oficiales de contexto y configuración:

- [Chrome para desarrolladores: usar Chrome DevTools MCP con tu sesión de navegador](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README de Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Perfil integrado: `user`. Crea tu propio perfil personalizado de sesión existente si
quieres un nombre, color o directorio de datos del navegador diferente.

De forma predeterminada, el perfil integrado `user` usa la conexión automática de Chrome MCP, que
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
3. Mantén el navegador en ejecución y aprueba la solicitud de conexión cuando OpenClaw se adjunte.

Páginas de inspección comunes:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Prueba rápida de adjunción en vivo:

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
- `tabs` enumera tus pestañas de navegador ya abiertas
- `snapshot` devuelve referencias desde la pestaña en vivo seleccionada

Qué revisar si la adjunción no funciona:

- el navegador de destino basado en Chromium es la versión `144+`
- la depuración remota está habilitada en la página de inspección de ese navegador
- el navegador mostró la solicitud de consentimiento de adjunción y la aceptaste
- si Chrome se inició con un `--remote-debugging-port` explícito, define
  `browser.profiles.<name>.cdpUrl` en ese extremo de DevTools en lugar de depender
  de la conexión automática de Chrome MCP
- `openclaw doctor` migra la configuración antigua de navegador basada en extensiones y comprueba que
  Chrome esté instalado localmente para los perfiles predeterminados de conexión automática, pero no puede
  habilitar por ti la depuración remota del lado del navegador

Uso por agentes:

- Usa `profile="user"` cuando necesites el estado del navegador con sesión iniciada del usuario.
- Si usas un perfil personalizado de sesión existente, pasa ese nombre de perfil explícito.
- Elige este modo solo cuando el usuario esté en el equipo para aprobar la solicitud
  de adjunción.
- El Gateway o el host Node puede iniciar `npx chrome-devtools-mcp@latest --autoConnect`.

Notas:

- Esta ruta tiene más riesgo que el perfil aislado `openclaw` porque puede
  actuar dentro de tu sesión de navegador con sesión iniciada.
- OpenClaw no inicia el navegador para este controlador; solo se adjunta.
- OpenClaw usa aquí el flujo oficial `--autoConnect` de Chrome DevTools MCP. Si
  `userDataDir` está definido, se pasa para apuntar a ese directorio de datos de usuario.
- La sesión existente puede adjuntarse en el host seleccionado o mediante un
  Node de navegador conectado. Si Chrome vive en otro lugar y no hay ningún Node
  de navegador conectado, usa CDP remoto o un host Node en su lugar.

### Inicio personalizado de Chrome MCP

Sobrescribe el servidor Chrome DevTools MCP iniciado por perfil cuando el flujo predeterminado
`npx chrome-devtools-mcp@latest` no sea lo que quieres (hosts sin conexión,
versiones fijadas, binarios integrados):

| Campo        | Qué hace                                                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Ejecutable que se inicia en lugar de `npx`. Se resuelve tal cual; se respetan las rutas absolutas.                         |
| `mcpArgs`    | Matriz de argumentos pasada textualmente a `mcpCommand`. Reemplaza los argumentos predeterminados `chrome-devtools-mcp@latest --autoConnect`. |

Cuando `cdpUrl` está definido en un perfil de sesión existente, OpenClaw omite
`--autoConnect` y reenvía automáticamente el extremo a Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (extremo de descubrimiento HTTP de DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (WebSocket CDP directo).

Las banderas de extremo y `userDataDir` no se pueden combinar: cuando `cdpUrl` está definido,
`userDataDir` se ignora para el inicio de Chrome MCP, ya que Chrome MCP se adjunta al
navegador en ejecución detrás del extremo en lugar de abrir un directorio
de perfil.

<Accordion title="Limitaciones de la función de sesión existente">

En comparación con el perfil gestionado `openclaw`, los controladores de sesión existente están más restringidos:

- **Capturas de pantalla** - las capturas de página y las capturas de elementos con `--ref` funcionan; los selectores CSS `--element` no. Playwright no es necesario para capturas de pantalla de página o de elementos basadas en referencias. (`--full-page` no puede combinarse con `--ref` ni `--element` en ningún perfil, no solo en sesión existente).
- **Acciones** - `click`, `type`, `hover`, `scrollIntoView`, `drag` y `select` requieren referencias de instantánea (sin selectores CSS). `click-coords` hace clic en coordenadas visibles del viewport y no requiere una referencia de instantánea. `click` solo usa el botón izquierdo (sin sobrescrituras de botón ni modificadores). `type` no admite `slowly=true`; usa `fill` o `press`. `press` no admite `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` y `evaluate` no admiten sobrescrituras `timeoutMs` por llamada. `select` acepta un solo valor. `batch` no es compatible; envía las acciones individualmente.
- **Espera / carga / diálogo** - `wait --url` admite patrones exactos, de subcadena y glob (igual que gestionado); `wait --load networkidle` no es compatible con perfiles de sesión existente (funciona en perfiles gestionados y perfiles CDP sin procesar/remotos). Los hooks de carga requieren `ref` o `inputRef`, un archivo a la vez, sin `element` CSS. Los hooks de diálogo no admiten sobrescrituras de tiempo de espera ni `dialogId`.
- **Visibilidad de diálogos** - las respuestas de acciones del navegador gestionado incluyen `blockedByDialog` y `browserState.dialogs.pending` cuando una acción abre un diálogo modal; las instantáneas también incluyen el estado de diálogo pendiente. Responde con `browser dialog --accept/--dismiss --dialog-id <id>` mientras haya un diálogo pendiente. Los diálogos gestionados fuera de OpenClaw aparecen en `browserState.dialogs.recent`.
- **Funciones solo gestionadas** - la exportación a PDF, la interceptación de descargas y `responsebody` aún requieren la ruta de navegador gestionado.

</Accordion>

## Garantías de aislamiento

- **Directorio dedicado de datos de usuario**: nunca toca tu perfil personal de navegador.
- **Puertos dedicados**: evita `9222` para prevenir colisiones con flujos de trabajo de desarrollo.
- **Control determinista de pestañas**: `tabs` devuelve primero `suggestedTargetId`, luego
  identificadores `tabId` estables como `t1`, etiquetas opcionales y el `targetId` sin procesar.
  Los agentes deben reutilizar `suggestedTargetId`; los identificadores sin procesar siguen disponibles para
  depuración y compatibilidad.

## Selección de navegador

Al iniciar localmente, OpenClaw elige el primero disponible:

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

Para scripts y depuración, el Gateway expone una pequeña **API de control HTTP
solo para loopback** más una CLI `openclaw browser` correspondiente (instantáneas, refs, espera de
activaciones, salida JSON, flujos de depuración). Consulta
[API de control del navegador](/es/tools/browser-control) para ver la referencia completa.

## Solución de problemas

Para problemas específicos de Linux (especialmente snap Chromium), consulta
[Solución de problemas del navegador](/es/tools/browser-linux-troubleshooting).

Para configuraciones de host dividido con Gateway en WSL2 + Chrome de Windows, consulta
[Solución de problemas de WSL2 + Windows + CDP remoto de Chrome](/es/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Fallo de arranque de CDP frente a bloqueo SSRF de navegación

Estas son clases de fallo diferentes y apuntan a rutas de código diferentes.

- **Fallo de arranque o disponibilidad de CDP** significa que OpenClaw no puede confirmar que el plano de control del navegador esté en buen estado.
- **Bloqueo SSRF de navegación** significa que el plano de control del navegador está en buen estado, pero una página de destino de navegación es rechazada por la política.

Ejemplos comunes:

- Fallo de arranque o disponibilidad de CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` cuando se
    configura un servicio CDP externo de loopback sin `attachOnly: true`
- Bloqueo SSRF de navegación:
  - Los flujos `open`, `navigate`, de instantánea o de apertura de pestañas fallan con un error de política de navegador/red mientras `start` y `tabs` siguen funcionando

Usa esta secuencia mínima para separar ambos casos:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Cómo interpretar los resultados:

- Si `start` falla con `not reachable after start`, soluciona primero la disponibilidad de CDP.
- Si `start` tiene éxito pero `tabs` falla, el plano de control sigue sin estar en buen estado. Trátalo como un problema de alcanzabilidad de CDP, no como un problema de navegación de página.
- Si `start` y `tabs` tienen éxito pero `open` o `navigate` falla, el plano de control del navegador está activo y el fallo está en la política de navegación o en la página de destino.
- Si `start`, `tabs` y `open` tienen éxito, la ruta básica de control del navegador administrado está en buen estado.

Detalles importantes de comportamiento:

- La configuración del navegador usa de forma predeterminada un objeto de política SSRF fail-closed incluso cuando no configuras `browser.ssrfPolicy`.
- Para el perfil administrado `openclaw` de local loopback, las comprobaciones de estado de CDP omiten intencionalmente la aplicación de alcanzabilidad SSRF del navegador para el plano de control local propio de OpenClaw.
- La protección de navegación es independiente. Un resultado correcto de `start` o `tabs` no significa que un destino posterior de `open` o `navigate` esté permitido.

Guía de seguridad:

- **No** relajes la política SSRF del navegador de forma predeterminada.
- Prefiere excepciones de host acotadas, como `hostnameAllowlist` o `allowedHostnames`, en lugar de acceso amplio a redes privadas.
- Usa `dangerouslyAllowPrivateNetwork: true` solo en entornos intencionalmente confiables donde el acceso del navegador a redes privadas sea necesario y haya sido revisado.

## Herramientas del agente + cómo funciona el control

El agente obtiene **una herramienta** para la automatización del navegador:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Cómo se asigna:

- `browser snapshot` devuelve un árbol de interfaz de usuario estable (AI o ARIA).
- `browser act` usa los IDs `ref` de la instantánea para hacer clic/escribir/arrastrar/seleccionar.
- `browser screenshot` captura píxeles (página completa, elemento o refs etiquetadas).
- `browser doctor` comprueba la disponibilidad del Gateway, el plugin, el perfil, el navegador y las pestañas.
- `browser` acepta:
  - `profile` para elegir un perfil de navegador con nombre (openclaw, chrome o CDP remoto).
  - `target` (`sandbox` | `host` | `node`) para seleccionar dónde reside el navegador.
  - En sesiones con sandbox, `target: "host"` requiere `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Si se omite `target`: las sesiones con sandbox usan `sandbox` de forma predeterminada; las sesiones sin sandbox usan `host` de forma predeterminada.
  - Si hay un nodo con capacidad de navegador conectado, la herramienta puede enrutar automáticamente hacia él a menos que fijes `target="host"` o `target="node"`.

Esto mantiene al agente determinista y evita selectores frágiles.

## Relacionado

- [Resumen de herramientas](/es/tools) - todas las herramientas de agente disponibles
- [Sandboxing](/es/gateway/sandboxing) - control del navegador en entornos con sandbox
- [Seguridad](/es/gateway/security) - riesgos y endurecimiento del control del navegador
