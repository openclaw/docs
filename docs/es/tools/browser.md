---
read_when:
    - Agregar automatización del navegador controlada por el agente
    - Depurar por qué openclaw está interfiriendo con tu propio Chrome
    - Implementar la configuración y el ciclo de vida del navegador en la aplicación de macOS
summary: Servicio integrado de control del navegador + comandos de acción
title: Navegador (gestionado por OpenClaw)
x-i18n:
    generated_at: "2026-04-26T11:38:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: aba4c06f351296145b7a282bb692c2d10dba0668f90aabf1d981fb18199c3d74
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw puede ejecutar un **perfil dedicado de Chrome/Brave/Edge/Chromium** que el agente controla.
Está aislado de tu navegador personal y se gestiona mediante un pequeño
servicio de control local dentro del Gateway (solo loopback).

Vista para principiantes:

- Piensa en ello como un **navegador separado, solo para el agente**.
- El perfil `openclaw` **no** toca el perfil de tu navegador personal.
- El agente puede **abrir pestañas, leer páginas, hacer clic y escribir** en un entorno seguro.
- El perfil integrado `user` se conecta a tu sesión real de Chrome iniciada mediante Chrome MCP.

## Qué obtienes

- Un perfil de navegador separado llamado **openclaw** (acento naranja de forma predeterminada).
- Control determinista de pestañas (listar/abrir/enfocar/cerrar).
- Acciones del agente (clic/escribir/arrastrar/seleccionar), snapshots, capturas de pantalla, PDF.
- Una skill integrada `browser-automation` que enseña a los agentes el bucle de recuperación de snapshot,
  pestaña estable, referencia obsoleta y bloqueador manual cuando el plugin del navegador está habilitado.
- Compatibilidad opcional con múltiples perfiles (`openclaw`, `work`, `remote`, ...).

Este navegador **no** es tu navegador principal del día a día. Es una superficie segura y aislada para
la automatización y verificación por parte del agente.

## Inicio rápido

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Si aparece “Browser disabled”, habilítalo en la configuración (consulta más abajo) y reinicia el
Gateway.

Si `openclaw browser` no aparece en absoluto, o el agente dice que la herramienta de navegador
no está disponible, ve a [Comando o herramienta de navegador ausente](/es/tools/browser#missing-browser-command-or-tool).

## Control del plugin

La herramienta `browser` predeterminada es un plugin integrado. Desactívala para reemplazarla por otro plugin que registre el mismo nombre de herramienta `browser`:

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

Los valores predeterminados necesitan tanto `plugins.entries.browser.enabled` **como** `browser.enabled=true`. Desactivar solo el plugin elimina la CLI `openclaw browser`, el método del gateway `browser.request`, la herramienta del agente y el servicio de control como una sola unidad; tu configuración `browser.*` permanece intacta para un reemplazo.

Los cambios en la configuración del navegador requieren reiniciar el Gateway para que el plugin pueda volver a registrar su servicio.

## Guía para el agente

Nota sobre el perfil de herramientas: `tools.profile: "coding"` incluye `web_search` y
`web_fetch`, pero no incluye la herramienta completa `browser`. Si el agente o un
subagente generado debe usar automatización del navegador, agrega browser en la
etapa del perfil:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Para un solo agente, usa `agents.list[].tools.alsoAllow: ["browser"]`.
`tools.subagents.tools.allow: ["browser"]` por sí solo no es suficiente porque la
política del subagente se aplica después del filtrado por perfil.

El plugin del navegador incluye dos niveles de guía para el agente:

- La descripción de la herramienta `browser` contiene el contrato compacto siempre activo: elegir
  el perfil correcto, mantener las referencias en la misma pestaña, usar `tabId`/etiquetas para
  apuntar a pestañas y cargar la skill del navegador para trabajo de varios pasos.
- La skill integrada `browser-automation` contiene el bucle operativo más largo:
  comprobar primero el estado/pestañas, etiquetar las pestañas de tarea, hacer snapshot antes de actuar, volver a hacer snapshot
  después de cambios en la interfaz, recuperar referencias obsoletas una vez e informar del inicio de sesión/2FA/captcha o
  bloqueadores de cámara/micrófono como acción manual en lugar de adivinar.

Las Skills incluidas en plugins aparecen en las skills disponibles del agente cuando el
plugin está habilitado. Las instrucciones completas de la skill se cargan bajo demanda, por lo que
los turnos rutinarios no pagan el costo completo en tokens.

## Comando o herramienta de navegador ausente

Si `openclaw browser` es desconocido tras una actualización, falta `browser.request`, o el agente informa que la herramienta de navegador no está disponible, la causa habitual es una lista `plugins.allow` que omite `browser`. Agrégalo:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` y `tools.alsoAllow: ["browser"]` no sustituyen la pertenencia a la lista de permitidos: la lista de permitidos controla la carga del plugin, y la política de herramientas solo se ejecuta después de la carga. Eliminar por completo `plugins.allow` también restaura el valor predeterminado.

## Perfiles: `openclaw` frente a `user`

- `openclaw`: navegador gestionado y aislado (no requiere extensión).
- `user`: perfil integrado de conexión de Chrome MCP para tu **sesión real de Chrome iniciada**.

Para llamadas de la herramienta de navegador del agente:

- Predeterminado: usa el navegador aislado `openclaw`.
- Prefiere `profile="user"` cuando importen las sesiones ya iniciadas y el usuario
  esté frente al ordenador para hacer clic/aprobar cualquier aviso de conexión.
- `profile` es la anulación explícita cuando quieres un modo de navegador específico.

Establece `browser.defaultProfile: "openclaw"` si quieres el modo gestionado de forma predeterminada.

## Configuración

La configuración del navegador vive en `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // predeterminado: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opta por esto solo para acceso confiable a redes privadas
      // allowPrivateNetwork: true, // alias heredado
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // anulación heredada de perfil único
    remoteCdpTimeoutMs: 1500, // tiempo de espera HTTP de CDP remoto (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // tiempo de espera del handshake WebSocket de CDP remoto (ms)
    localLaunchTimeoutMs: 15000, // tiempo de espera de descubrimiento de Chrome gestionado local (ms)
    localCdpReadyTimeoutMs: 8000, // tiempo de espera local de disponibilidad de CDP tras el lanzamiento (ms)
    actionTimeoutMs: 60000, // tiempo de espera predeterminado para acciones del navegador (ms)
    tabCleanup: {
      enabled: true, // predeterminado: true
      idleMinutes: 120, // establece 0 para desactivar la limpieza por inactividad
      maxTabsPerSession: 8, // establece 0 para desactivar el límite por sesión
      sweepMinutes: 5,
    },
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

<AccordionGroup>

<Accordion title="Puertos y alcance">

- El servicio de control se enlaza a loopback en un puerto derivado de `gateway.port` (predeterminado `18791` = gateway + 2). Anular `gateway.port` o `OPENCLAW_GATEWAY_PORT` desplaza los puertos derivados en la misma familia.
- Los perfiles locales `openclaw` asignan automáticamente `cdpPort`/`cdpUrl`; configúralos solo para CDP remoto. `cdpUrl` usa de forma predeterminada el puerto local CDP gestionado cuando no se configura.
- `remoteCdpTimeoutMs` se aplica a las comprobaciones de alcance HTTP de CDP remoto y `attachOnly`
  y a las solicitudes HTTP de apertura de pestañas; `remoteCdpHandshakeTimeoutMs` se aplica a
  sus handshakes WebSocket de CDP.
- `localLaunchTimeoutMs` es el presupuesto para que un proceso Chrome gestionado lanzado localmente
  exponga su endpoint HTTP CDP. `localCdpReadyTimeoutMs` es el
  presupuesto posterior para la disponibilidad del websocket CDP después de descubrir el proceso.
  Auméntalos en Raspberry Pi, VPS de gama baja o hardware antiguo donde Chromium
  se inicia lentamente. Los valores deben ser enteros positivos de hasta `120000` ms; los
  valores de configuración no válidos se rechazan.
- `actionTimeoutMs` es el presupuesto predeterminado para solicitudes `act` del navegador cuando el llamador no pasa `timeoutMs`. El transporte del cliente añade una pequeña ventana de margen para que las esperas largas puedan terminar en lugar de agotar el tiempo en el límite HTTP.
- `tabCleanup` es una limpieza de mejor esfuerzo para las pestañas abiertas por sesiones de navegador del agente principal. La limpieza del ciclo de vida de subagentes, Cron y ACP sigue cerrando sus pestañas rastreadas explícitas al final de la sesión; las sesiones principales mantienen reutilizables las pestañas activas y luego cierran en segundo plano las pestañas rastreadas inactivas o sobrantes.

</Accordion>

<Accordion title="Política SSRF">

- La navegación del navegador y open-tab están protegidas contra SSRF antes de la navegación y se vuelven a comprobar, en la medida de lo posible, sobre la URL final `http(s)` después.
- En el modo SSRF estricto, también se comprueban el descubrimiento del endpoint CDP remoto y los sondeos `/json/version` (`cdpUrl`).
- Las variables de entorno `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` y `NO_PROXY` del Gateway/proveedor no actúan automáticamente como proxy del navegador gestionado por OpenClaw. El Chrome gestionado se inicia en modo directo de forma predeterminada para que la configuración de proxy del proveedor no debilite las comprobaciones SSRF del navegador.
- Para aplicar proxy al propio navegador gestionado, pasa flags explícitos de proxy de Chrome mediante `browser.extraArgs`, como `--proxy-server=...` o `--proxy-pac-url=...`. El modo SSRF estricto bloquea el enrutamiento explícito del navegador mediante proxy salvo que el acceso del navegador a redes privadas esté habilitado intencionalmente.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` está desactivado de forma predeterminada; habilítalo solo cuando el acceso del navegador a redes privadas sea intencionadamente de confianza.
- `browser.ssrfPolicy.allowPrivateNetwork` sigue siendo compatible como alias heredado.

</Accordion>

<Accordion title="Comportamiento del perfil">

- `attachOnly: true` significa no iniciar nunca un navegador local; solo conectarse si ya hay uno en ejecución.
- `headless` puede configurarse globalmente o por perfil gestionado local. Los valores por perfil anulan `browser.headless`, de modo que un perfil iniciado localmente puede mantenerse en modo headless mientras otro sigue visible.
- `POST /start?headless=true` y `openclaw browser start --headless` solicitan un
  inicio headless de una sola vez para perfiles gestionados locales sin reescribir
  `browser.headless` ni la configuración del perfil. Los perfiles de sesión existente, solo conexión y
  CDP remoto rechazan la anulación porque OpenClaw no inicia esos
  procesos de navegador.
- En hosts Linux sin `DISPLAY` ni `WAYLAND_DISPLAY`, los perfiles gestionados locales
  pasan a headless de forma predeterminada automáticamente cuando ni el entorno ni la configuración del perfil/global
  eligen explícitamente el modo con interfaz. `openclaw browser status --json`
  informa `headlessSource` como `env`, `profile`, `config`,
  `request`, `linux-display-fallback` o `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` fuerza inicios locales gestionados en modo headless para el
  proceso actual. `OPENCLAW_BROWSER_HEADLESS=0` fuerza el modo con interfaz para inicios ordinarios
  y devuelve un error accionable en hosts Linux sin servidor de pantalla;
  una solicitud explícita `start --headless` sigue teniendo prioridad para ese único inicio.
- `executablePath` puede configurarse globalmente o por perfil gestionado local. Los valores por perfil anulan `browser.executablePath`, de modo que distintos perfiles gestionados pueden iniciar distintos navegadores basados en Chromium. Ambas formas aceptan `~` para el directorio personal de tu sistema operativo.
- `color` (nivel superior y por perfil) tiñe la interfaz del navegador para que puedas ver qué perfil está activo.
- El perfil predeterminado es `openclaw` (gestionado independiente). Usa `defaultProfile: "user"` para optar por el navegador de usuario con sesión iniciada.
- Orden de detección automática: navegador predeterminado del sistema si está basado en Chromium; en caso contrario Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` usa Chrome DevTools MCP en lugar de CDP sin procesar. No configures `cdpUrl` para ese driver.
- Establece `browser.profiles.<name>.userDataDir` cuando un perfil de sesión existente deba conectarse a un perfil de usuario Chromium no predeterminado (Brave, Edge, etc.). Esta ruta también acepta `~` para el directorio personal de tu sistema operativo.

</Accordion>

</AccordionGroup>

## Usar Brave (u otro navegador basado en Chromium)

Si tu navegador **predeterminado del sistema** está basado en Chromium (Chrome/Brave/Edge/etc),
OpenClaw lo usa automáticamente. Establece `browser.executablePath` para anular la
detección automática. Los valores `executablePath` de nivel superior y por perfil aceptan `~`
para el directorio personal de tu sistema operativo:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

O configúralo en la configuración, según la plataforma:

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

`executablePath` por perfil solo afecta a los perfiles gestionados localmente que OpenClaw
inicia. Los perfiles `existing-session` se conectan en su lugar a un navegador ya en ejecución,
y los perfiles CDP remotos usan el navegador que está detrás de `cdpUrl`.

## Control local frente a remoto

- **Control local (predeterminado):** el Gateway inicia el servicio de control por loopback y puede lanzar un navegador local.
- **Control remoto (host de nodo):** ejecuta un host de nodo en la máquina que tiene el navegador; el Gateway envía por proxy las acciones del navegador a ese host.
- **CDP remoto:** establece `browser.profiles.<name>.cdpUrl` (o `browser.cdpUrl`) para
  conectarte a un navegador remoto basado en Chromium. En este caso, OpenClaw no lanzará un navegador local.
- Para servicios CDP gestionados externamente en loopback (por ejemplo Browserless en
  Docker publicado en `127.0.0.1`), establece también `attachOnly: true`. CDP en loopback
  sin `attachOnly` se trata como un perfil de navegador local gestionado por OpenClaw.
- `headless` solo afecta a los perfiles gestionados localmente que OpenClaw inicia. No reinicia ni cambia los navegadores de sesión existente o CDP remoto.
- `executablePath` sigue la misma regla de perfil gestionado local. Cambiarlo en un
  perfil gestionado local en ejecución marca ese perfil para reinicio/reconciliación para que el
  siguiente inicio use el nuevo binario.

El comportamiento al detener difiere según el modo del perfil:

- perfiles gestionados localmente: `openclaw browser stop` detiene el proceso del navegador que
  OpenClaw lanzó
- perfiles solo-conexión y CDP remoto: `openclaw browser stop` cierra la sesión de control activa
  y libera las anulaciones de emulación de Playwright/CDP (viewport,
  combinación de colores, configuración regional, zona horaria, modo sin conexión y
  estado similar), aunque OpenClaw no haya lanzado ningún proceso de navegador

Las URL CDP remotas pueden incluir autenticación:

- Tokens en query (p. ej., `https://provider.example?token=<token>`)
- Autenticación HTTP Basic (p. ej., `https://user:pass@provider.example`)

OpenClaw preserva la autenticación al llamar a endpoints `/json/*` y al conectarse
al WebSocket CDP. Prefiere variables de entorno o gestores de secretos para los
tokens en lugar de confirmarlos en archivos de configuración.

## Proxy de navegador del nodo (valor predeterminado de configuración cero)

Si ejecutas un **host de nodo** en la máquina que tiene tu navegador, OpenClaw puede
redirigir automáticamente las llamadas a herramientas del navegador a ese nodo sin ninguna configuración adicional del navegador.
Esta es la ruta predeterminada para gateways remotos.

Notas:

- El host de nodo expone su servidor de control local del navegador mediante un **comando proxy**.
- Los perfiles provienen de la propia configuración `browser.profiles` del nodo (igual que en local).
- `nodeHost.browserProxy.allowProfiles` es opcional. Déjalo vacío para el comportamiento heredado/predeterminado: todos los perfiles configurados siguen siendo accesibles a través del proxy, incluidas las rutas de creación/eliminación de perfiles.
- Si estableces `nodeHost.browserProxy.allowProfiles`, OpenClaw lo trata como un límite de mínimo privilegio: solo se puede apuntar a los perfiles incluidos en la lista de permitidos, y las rutas persistentes de creación/eliminación de perfiles se bloquean en la superficie del proxy.
- Desactívalo si no lo quieres:
  - En el nodo: `nodeHost.browserProxy.enabled=false`
  - En el gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP remoto alojado)

[Browserless](https://browserless.io) es un servicio Chromium alojado que expone
URL de conexión CDP por HTTPS y WebSocket. OpenClaw puede usar cualquiera de las dos formas, pero
para un perfil de navegador remoto la opción más simple es la URL WebSocket directa
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
- Elige el endpoint regional que corresponda a tu cuenta de Browserless (consulta su documentación).
- Si Browserless te da una URL base HTTPS, puedes convertirla a
  `wss://` para una conexión CDP directa o mantener la URL HTTPS y dejar que OpenClaw
  descubra `/json/version`.

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
proceso de OpenClaw. Browserless también debe anunciar un endpoint accesible correspondiente;
establece `EXTERNAL` de Browserless con esa misma base WebSocket pública hacia OpenClaw, como
`ws://127.0.0.1:3000`, `ws://browserless:3000` o una dirección privada estable de red Docker.
Si `/json/version` devuelve `webSocketDebuggerUrl` apuntando a
una dirección a la que OpenClaw no puede acceder, el HTTP CDP puede parecer correcto mientras que la
conexión WebSocket sigue fallando.

No dejes `attachOnly` sin establecer para un perfil Browserless en loopback. Sin
`attachOnly`, OpenClaw trata el puerto loopback como un perfil de navegador local gestionado
y puede informar que el puerto está en uso pero no pertenece a OpenClaw.

## Proveedores CDP WebSocket directos

Algunos servicios de navegador alojados exponen un endpoint **WebSocket directo** en lugar de
la detección CDP estándar basada en HTTP (`/json/version`). OpenClaw acepta tres
formas de URL CDP y elige automáticamente la estrategia de conexión correcta:

- **Detección HTTP(S)** — `http://host[:port]` o `https://host[:port]`.
  OpenClaw llama a `/json/version` para descubrir la URL del depurador WebSocket y luego
  se conecta. No hay retroceso a WebSocket.
- **Endpoints WebSocket directos** — `ws://host[:port]/devtools/<kind>/<id>` o
  `wss://...` con una ruta `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw se conecta directamente mediante un handshake WebSocket y omite
  por completo `/json/version`.
- **Raíces WebSocket vacías** — `ws://host[:port]` o `wss://host[:port]` sin
  ruta `/devtools/...` (p. ej. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw intenta primero la detección HTTP
  de `/json/version` (normalizando el esquema a `http`/`https`);
  si la detección devuelve un `webSocketDebuggerUrl`, se usa; de lo contrario, OpenClaw
  recurre a un handshake WebSocket directo en la raíz vacía. Si el endpoint WebSocket
  anunciado rechaza el handshake CDP pero la raíz vacía configurada
  lo acepta, OpenClaw también recurre a esa raíz. Esto permite que un `ws://` vacío
  apuntado a un Chrome local siga conectando, ya que Chrome solo acepta actualizaciones WebSocket
  en la ruta específica por destino de `/json/version`, mientras que los proveedores
  alojados pueden seguir usando su endpoint WebSocket raíz cuando su endpoint de detección
  anuncia una URL efímera que no es adecuada para Playwright CDP.

### Browserbase

[Browserbase](https://www.browserbase.com) es una plataforma en la nube para ejecutar
navegadores headless con resolución de CAPTCHA integrada, modo stealth y proxies
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

- [Regístrate](https://www.browserbase.com/sign-up) y copia tu **API Key**
  desde el [panel Overview](https://www.browserbase.com/overview).
- Sustituye `<BROWSERBASE_API_KEY>` por tu clave API real de Browserbase.
- Browserbase crea automáticamente una sesión de navegador al conectar por WebSocket, así que no
  se necesita ningún paso manual de creación de sesión.
- El plan gratuito permite una sesión concurrente y una hora de navegador al mes.
  Consulta [pricing](https://www.browserbase.com/pricing) para los límites de los planes de pago.
- Consulta la [documentación de Browserbase](https://docs.browserbase.com) para la
  referencia completa de la API, guías del SDK y ejemplos de integración.

## Seguridad

Ideas clave:

- El control del navegador es solo por loopback; el acceso fluye a través de la autenticación del Gateway o del emparejamiento del nodo.
- La API HTTP independiente del navegador en loopback usa **solo autenticación con secreto compartido**:
  token bearer del gateway, `x-openclaw-password` o autenticación HTTP Basic con la
  contraseña de gateway configurada.
- Los encabezados de identidad de Tailscale Serve y `gateway.auth.mode: "trusted-proxy"` no
  autentican esta API independiente del navegador en loopback.
- Si el control del navegador está habilitado y no hay autenticación con secreto compartido configurada, OpenClaw
  genera automáticamente `gateway.auth.token` al arrancar y lo persiste en la configuración.
- OpenClaw **no** genera automáticamente ese token cuando `gateway.auth.mode` ya es
  `password`, `none` o `trusted-proxy`.
- Mantén el Gateway y cualquier host de nodo en una red privada (Tailscale); evita la exposición pública.
- Trata las URL/tokens CDP remotos como secretos; prefiere variables de entorno o un gestor de secretos.

Consejos para CDP remoto:

- Prefiere endpoints cifrados (HTTPS o WSS) y tokens de corta duración cuando sea posible.
- Evita incrustar directamente tokens de larga duración en archivos de configuración.

## Perfiles (multinavegador)

OpenClaw admite varios perfiles con nombre (configuraciones de enrutamiento). Los perfiles pueden ser:

- **gestionados por OpenClaw**: una instancia dedicada de navegador basado en Chromium con su propio directorio de datos de usuario + puerto CDP
- **remoto**: una URL CDP explícita (navegador basado en Chromium ejecutándose en otro lugar)
- **sesión existente**: tu perfil existente de Chrome mediante conexión automática de Chrome DevTools MCP

Valores predeterminados:

- El perfil `openclaw` se crea automáticamente si falta.
- El perfil `user` está integrado para la conexión de sesión existente de Chrome MCP.
- Los perfiles de sesión existente son opcionales además de `user`; créalos con `--driver existing-session`.
- Los puertos CDP locales se asignan a partir de **18800–18899** de forma predeterminada.
- Al eliminar un perfil, su directorio local de datos se mueve a la Papelera.

Todos los endpoints de control aceptan `?profile=<name>`; la CLI usa `--browser-profile`.

## Sesión existente mediante Chrome DevTools MCP

OpenClaw también puede conectarse a un perfil de navegador basado en Chromium en ejecución mediante el
servidor oficial Chrome DevTools MCP. Esto reutiliza las pestañas y el estado de inicio de sesión
ya abiertos en ese perfil de navegador.

Referencias oficiales de contexto y configuración:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Perfil integrado:

- `user`

Opcional: crea tu propio perfil personalizado de sesión existente si quieres un
nombre, color o directorio de datos del navegador diferente.

Comportamiento predeterminado:

- El perfil integrado `user` usa conexión automática de Chrome MCP, que apunta al
  perfil local predeterminado de Google Chrome.

Usa `userDataDir` para Brave, Edge, Chromium o un perfil de Chrome no predeterminado.
`~` se expande al directorio personal de tu sistema operativo:

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

1. Abre la página de inspección de ese navegador para la depuración remota.
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
- `tabs` enumera las pestañas del navegador que ya tenías abiertas
- `snapshot` devuelve refs de la pestaña activa seleccionada

Qué comprobar si la conexión no funciona:

- que el navegador de destino basado en Chromium sea la versión `144+`
- que la depuración remota esté habilitada en la página de inspección de ese navegador
- que el navegador haya mostrado el aviso de consentimiento de conexión y lo hayas aceptado
- `openclaw doctor` migra la configuración antigua del navegador basada en extensiones y comprueba que
  Chrome esté instalado localmente para los perfiles predeterminados de conexión automática, pero no puede
  habilitar por ti la depuración remota en el navegador

Uso por parte del agente:

- Usa `profile="user"` cuando necesites el estado del navegador del usuario con sesión iniciada.
- Si usas un perfil personalizado de sesión existente, pasa ese nombre de perfil explícito.
- Elige este modo solo cuando el usuario esté frente al ordenador para aprobar el aviso
  de conexión.
- el Gateway o el host del nodo pueden ejecutar `npx chrome-devtools-mcp@latest --autoConnect`

Notas:

- Esta ruta tiene más riesgo que el perfil aislado `openclaw` porque puede
  actuar dentro de tu sesión de navegador iniciada.
- OpenClaw no inicia el navegador para este driver; solo se conecta.
- OpenClaw usa aquí el flujo oficial `--autoConnect` de Chrome DevTools MCP. Si
  `userDataDir` está configurado, se transmite para apuntar a ese directorio de datos de usuario.
- Existing-session puede conectarse en el host seleccionado o mediante un
  nodo de navegador conectado. Si Chrome está en otro lugar y no hay ningún nodo de navegador conectado, usa
  CDP remoto o un host de nodo en su lugar.

### Inicio personalizado de Chrome MCP

Anula el servidor Chrome DevTools MCP generado por perfil cuando el flujo
predeterminado `npx chrome-devtools-mcp@latest` no es lo que quieres (hosts sin conexión,
versiones fijadas, binarios integrados en el proveedor):

| Campo        | Qué hace                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Ejecutable que se inicia en lugar de `npx`. Se resuelve tal cual; se respetan las rutas absolutas.                                          |
| `mcpArgs`    | Matriz de argumentos pasada literalmente a `mcpCommand`. Sustituye los argumentos predeterminados `chrome-devtools-mcp@latest --autoConnect`. |

Cuando `cdpUrl` está configurado en un perfil de sesión existente, OpenClaw omite
`--autoConnect` y reenvía automáticamente el endpoint a Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (endpoint de detección HTTP de DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (WebSocket CDP directo).

Las flags de endpoint y `userDataDir` no pueden combinarse: cuando `cdpUrl` está configurado,
`userDataDir` se ignora para el inicio de Chrome MCP, ya que Chrome MCP se conecta al
navegador en ejecución detrás del endpoint en lugar de abrir un directorio de
perfil.

<Accordion title="Limitaciones de funcionalidades de existing-session">

En comparación con el perfil gestionado `openclaw`, los drivers de sesión existente están más limitados:

- **Capturas de pantalla** — funcionan las capturas de página y las capturas de elementos con `--ref`; los selectores CSS `--element` no. `--full-page` no puede combinarse con `--ref` ni con `--element`. Playwright no es necesario para capturas de página o de elementos basadas en ref.
- **Acciones** — `click`, `type`, `hover`, `scrollIntoView`, `drag` y `select` requieren refs de snapshot (sin selectores CSS). `click-coords` hace clic en coordenadas visibles del viewport y no requiere una ref de snapshot. `click` es solo con el botón izquierdo. `type` no admite `slowly=true`; usa `fill` o `press`. `press` no admite `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` y `evaluate` no admiten tiempos de espera por llamada. `select` acepta un único valor.
- **Wait / upload / dialog** — `wait --url` admite patrones exactos, de subcadena y glob; `wait --load networkidle` no está admitido. Los hooks de carga requieren `ref` o `inputRef`, un archivo a la vez, sin `element` CSS. Los hooks de diálogo no admiten anulaciones de tiempo de espera.
- **Funciones solo gestionadas** — acciones por lotes, exportación a PDF, interceptación de descargas y `responsebody` siguen requiriendo la ruta del navegador gestionado.

</Accordion>

## Garantías de aislamiento

- **Directorio de datos de usuario dedicado**: nunca toca el perfil de tu navegador personal.
- **Puertos dedicados**: evita `9222` para impedir colisiones con flujos de trabajo de desarrollo.
- **Control determinista de pestañas**: `tabs` devuelve primero `suggestedTargetId`, luego
  manejadores estables `tabId` como `t1`, etiquetas opcionales y el `targetId` sin procesar.
  Los agentes deben reutilizar `suggestedTargetId`; los ids sin procesar siguen disponibles para
  depuración y compatibilidad.

## Selección de navegador

Al iniciar localmente, OpenClaw elige el primero disponible:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Puedes anularlo con `browser.executablePath`.

Plataformas:

- macOS: comprueba `/Applications` y `~/Applications`.
- Linux: comprueba ubicaciones comunes de Chrome/Brave/Edge/Chromium en `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` y
  `/usr/lib/chromium-browser`.
- Windows: comprueba ubicaciones de instalación comunes.

## API de control (opcional)

Para scripting y depuración, el Gateway expone una pequeña **API HTTP de control
solo por loopback** más una CLI correspondiente `openclaw browser` (snapshots, refs, capacidades
adicionales de wait, salida JSON, flujos de trabajo de depuración). Consulta
[API de control del navegador](/es/tools/browser-control) para la referencia completa.

## Resolución de problemas

Para problemas específicos de Linux (especialmente snap Chromium), consulta
[Resolución de problemas del navegador](/es/tools/browser-linux-troubleshooting).

Para configuraciones de host dividido WSL2 Gateway + Windows Chrome, consulta
[Resolución de problemas de WSL2 + Windows + CDP remoto de Chrome](/es/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Fallo de inicio de CDP frente a bloqueo SSRF de navegación

Son clases de fallo diferentes y apuntan a rutas de código distintas.

- **Fallo de inicio o de disponibilidad de CDP** significa que OpenClaw no puede confirmar que el plano de control del navegador esté en buen estado.
- **Bloqueo SSRF de navegación** significa que el plano de control del navegador está en buen estado, pero un destino de navegación de página es rechazado por la política.

Ejemplos comunes:

- Fallo de inicio o disponibilidad de CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` cuando un
    servicio CDP externo en loopback está configurado sin `attachOnly: true`
- Bloqueo SSRF de navegación:
  - los flujos `open`, `navigate`, snapshot o apertura de pestañas fallan con un error de política del navegador/red mientras `start` y `tabs` siguen funcionando

Usa esta secuencia mínima para separar ambos casos:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Cómo interpretar los resultados:

- Si `start` falla con `not reachable after start`, primero resuelve la disponibilidad de CDP.
- Si `start` funciona pero `tabs` falla, el plano de control sigue sin estar en buen estado. Trátalo como un problema de alcance de CDP, no como un problema de navegación de páginas.
- Si `start` y `tabs` funcionan pero `open` o `navigate` fallan, el plano de control del navegador está activo y el fallo está en la política de navegación o en la página de destino.
- Si `start`, `tabs` y `open` funcionan, la ruta básica de control del navegador gestionado está en buen estado.

Detalles importantes del comportamiento:

- La configuración del navegador usa de forma predeterminada un objeto de política SSRF de cierre por defecto incluso cuando no configuras `browser.ssrfPolicy`.
- Para el perfil gestionado local `openclaw` en loopback, las comprobaciones de estado de CDP omiten intencionadamente la aplicación del alcance SSRF del navegador para el propio plano de control local de OpenClaw.
- La protección de navegación es independiente. Que `start` o `tabs` funcionen no significa que un destino posterior de `open` o `navigate` esté permitido.

Guía de seguridad:

- **No** relajes la política SSRF del navegador de forma predeterminada.
- Prefiere excepciones de host limitadas como `hostnameAllowlist` o `allowedHostnames` frente a un acceso amplio a redes privadas.
- Usa `dangerouslyAllowPrivateNetwork: true` solo en entornos intencionadamente confiables donde el acceso del navegador a redes privadas sea necesario y revisado.

## Herramientas del agente + cómo funciona el control

El agente obtiene **una herramienta** para la automatización del navegador:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Cómo se mapea:

- `browser snapshot` devuelve un árbol de interfaz estable (AI o ARIA).
- `browser act` usa los ids `ref` del snapshot para hacer clic/escribir/arrastrar/seleccionar.
- `browser screenshot` captura píxeles (página completa, elemento o refs etiquetadas).
- `browser doctor` comprueba la disponibilidad del Gateway, plugin, perfil, navegador y pestaña.
- `browser` acepta:
  - `profile` para elegir un perfil de navegador con nombre (openclaw, chrome o CDP remoto).
  - `target` (`sandbox` | `host` | `node`) para seleccionar dónde vive el navegador.
  - En sesiones aisladas en sandbox, `target: "host"` requiere `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Si se omite `target`: las sesiones en sandbox usan `sandbox` de forma predeterminada, las sesiones sin sandbox usan `host`.
  - Si hay conectado un nodo con capacidad de navegador, la herramienta puede redirigirse automáticamente a él a menos que fijes `target="host"` o `target="node"`.

Esto mantiene al agente determinista y evita selectores frágiles.

## Relacionado

- [Resumen de herramientas](/es/tools) — todas las herramientas de agente disponibles
- [Sandboxing](/es/gateway/sandboxing) — control del navegador en entornos aislados en sandbox
- [Seguridad](/es/gateway/security) — riesgos del control del navegador y endurecimiento
