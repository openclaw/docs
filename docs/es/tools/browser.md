---
read_when:
    - Añadiendo automatización del navegador controlada por el agente
    - Depurando por qué openclaw está interfiriendo con tu propio Chrome
    - Implementando ajustes y ciclo de vida del navegador en la aplicación de macOS
summary: Servicio integrado de control del navegador + comandos de acción
title: Navegador (administrado por OpenClaw)
x-i18n:
    generated_at: "2026-04-25T18:21:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6379873662b21972493f62951c0fb87c4a9ec6350cec750acaf6a50235bd69c3
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw puede ejecutar un **perfil dedicado de Chrome/Brave/Edge/Chromium** que el agente controla.
Está aislado de tu navegador personal y se gestiona mediante un pequeño
servicio de control local dentro del Gateway (solo loopback).

Vista para principiantes:

- Piensa en ello como un **navegador independiente solo para el agente**.
- El perfil `openclaw` **no** toca tu perfil de navegador personal.
- El agente puede **abrir pestañas, leer páginas, hacer clic y escribir** en un entorno seguro.
- El perfil integrado `user` se adjunta a tu sesión real iniciada de Chrome mediante Chrome MCP.

## Lo que obtienes

- Un perfil de navegador independiente llamado **openclaw** (acento naranja de forma predeterminada).
- Control determinista de pestañas (listar/abrir/enfocar/cerrar).
- Acciones del agente (clic/escribir/arrastrar/seleccionar), instantáneas, capturas de pantalla, PDF.
- Una Skill incluida `browser-automation` que enseña a los agentes el bucle de recuperación de snapshot,
  stable-tab, stale-ref y bloqueadores manuales cuando el plugin de navegador está habilitado.
- Compatibilidad opcional con varios perfiles (`openclaw`, `work`, `remote`, ...).

Este navegador **no** es tu navegador de uso diario. Es una superficie segura y aislada para
automatización y verificación del agente.

## Inicio rápido

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Si recibes “Browser disabled”, habilítalo en la configuración (consulta más abajo) y reinicia el
Gateway.

Si `openclaw browser` no existe en absoluto, o el agente dice que la herramienta de navegador
no está disponible, ve a [Comando o herramienta de navegador faltante](/es/tools/browser#missing-browser-command-or-tool).

## Control del Plugin

La herramienta predeterminada `browser` es un plugin incluido. Desactívala para sustituirla por otro plugin que registre el mismo nombre de herramienta `browser`:

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

Los valores predeterminados requieren tanto `plugins.entries.browser.enabled` **como** `browser.enabled=true`. Desactivar solo el plugin elimina la CLI `openclaw browser`, el método de gateway `browser.request`, la herramienta del agente y el servicio de control como una sola unidad; tu configuración `browser.*` permanece intacta para un reemplazo.

Los cambios en la configuración del navegador requieren un reinicio del Gateway para que el plugin pueda volver a registrar su servicio.

## Guía para agentes

Nota sobre el perfil de herramientas: `tools.profile: "coding"` incluye `web_search` y
`web_fetch`, pero no incluye la herramienta completa `browser`. Si el agente o un
subagente generado debe usar automatización del navegador, agrega browser en la etapa del perfil:

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
política de subagentes se aplica después del filtrado por perfil.

El plugin de navegador incluye dos niveles de guía para agentes:

- La descripción de la herramienta `browser` contiene el contrato compacto siempre activo: elegir
  el perfil correcto, mantener las referencias en la misma pestaña, usar `tabId`/etiquetas para dirigir pestañas, y cargar la skill de navegador para trabajo de varios pasos.
- La Skill incluida `browser-automation` contiene el bucle operativo más largo:
  comprobar primero estado/pestañas, etiquetar pestañas de tareas, tomar snapshot antes de actuar, volver a tomar snapshot
  después de cambios de la UI, recuperar referencias obsoletas una vez, e informar de bloqueadores como inicio de sesión/2FA/captcha o
  cámara/micrófono como acción manual en lugar de adivinar.

Las Skills incluidas por el plugin aparecen en las Skills disponibles del agente cuando el
plugin está habilitado. Las instrucciones completas de la Skill se cargan bajo demanda, por lo que los turnos rutinarios no pagan el costo completo en tokens.

## Comando o herramienta de navegador faltante

Si `openclaw browser` es desconocido después de una actualización, falta `browser.request`, o el agente informa que la herramienta de navegador no está disponible, la causa habitual es una lista `plugins.allow` que omite `browser`. Agrégalo:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` y `tools.alsoAllow: ["browser"]` no sustituyen la pertenencia a la lista de permitidos: la lista de permitidos controla la carga del plugin, y la política de herramientas solo se ejecuta después de la carga. Quitar `plugins.allow` por completo también restaura el valor predeterminado.

## Perfiles: `openclaw` frente a `user`

- `openclaw`: navegador administrado y aislado (no requiere extensión).
- `user`: perfil integrado de adjunto Chrome MCP para tu **sesión real iniciada de Chrome**.

Para llamadas a la herramienta de navegador del agente:

- Predeterminado: usa el navegador aislado `openclaw`.
- Prefiere `profile="user"` cuando importen las sesiones iniciadas existentes y el usuario
  esté en el equipo para hacer clic/aprobar cualquier solicitud de adjunción.
- `profile` es la anulación explícita cuando quieres un modo de navegador específico.

Establece `browser.defaultProfile: "openclaw"` si quieres el modo administrado de forma predeterminada.

## Configuración

Los ajustes del navegador viven en `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // actívalo solo para acceso confiable a redes privadas
      // allowPrivateNetwork: true, // alias heredado
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // anulación heredada de un solo perfil
    remoteCdpTimeoutMs: 1500, // tiempo de espera HTTP de CDP remoto (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // tiempo de espera del handshake WebSocket de CDP remoto (ms)
    localLaunchTimeoutMs: 15000, // tiempo de espera de detección de Chrome administrado local (ms)
    localCdpReadyTimeoutMs: 8000, // tiempo de espera de disponibilidad de CDP local tras el inicio (ms)
    actionTimeoutMs: 60000, // tiempo de espera predeterminado de acciones del navegador (ms)
    tabCleanup: {
      enabled: true, // default: true
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

<Accordion title="Puertos y accesibilidad">

- El servicio de control se vincula a loopback en un puerto derivado de `gateway.port` (predeterminado `18791` = gateway + 2). Anular `gateway.port` o `OPENCLAW_GATEWAY_PORT` desplaza los puertos derivados dentro de la misma familia.
- Los perfiles locales `openclaw` asignan automáticamente `cdpPort`/`cdpUrl`; establécelos solo para CDP remoto. `cdpUrl` tiene como valor predeterminado el puerto CDP local administrado cuando no se establece.
- `remoteCdpTimeoutMs` se aplica a las comprobaciones de accesibilidad HTTP de CDP remoto y de `attachOnly`, así como a las solicitudes HTTP de apertura de pestañas; `remoteCdpHandshakeTimeoutMs` se aplica a sus handshakes de WebSocket CDP.
- `localLaunchTimeoutMs` es el presupuesto para que un proceso de Chrome administrado lanzado localmente
  exponga su endpoint HTTP de CDP. `localCdpReadyTimeoutMs` es el
  presupuesto de seguimiento para la disponibilidad del websocket CDP después de que se detecta el proceso.
  Auméntalos en Raspberry Pi, VPS de gama baja o hardware antiguo donde Chromium
  arranca lentamente. Los valores están limitados a 120000 ms.
- `actionTimeoutMs` es el presupuesto predeterminado para solicitudes `act` del navegador cuando el llamador no pasa `timeoutMs`. El transporte cliente añade una pequeña ventana adicional para que las esperas largas puedan completarse en lugar de agotar el tiempo en el límite HTTP.
- `tabCleanup` es una limpieza best-effort para pestañas abiertas por sesiones de navegador del agente principal. La limpieza del ciclo de vida de subagentes, Cron y ACP sigue cerrando sus pestañas rastreadas explícitas al final de la sesión; las sesiones principales mantienen reutilizables las pestañas activas y luego cierran en segundo plano las pestañas rastreadas inactivas o sobrantes.

</Accordion>

<Accordion title="Política SSRF">

- La navegación del navegador y la apertura de pestañas están protegidas contra SSRF antes de la navegación y se vuelven a comprobar de la mejor manera posible en la URL final `http(s)` después.
- En modo estricto SSRF, la detección remota de endpoints CDP y las sondas `/json/version` (`cdpUrl`) también se comprueban.
- Las variables de entorno `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` y `NO_PROXY` de Gateway/proveedor no usan automáticamente proxy para el navegador administrado por OpenClaw. Los lanzamientos administrados de Chrome van directos de forma predeterminada para que los ajustes de proxy del proveedor no debiliten las comprobaciones SSRF del navegador.
- Para usar proxy para el propio navegador administrado, pasa banderas explícitas de proxy de Chrome mediante `browser.extraArgs`, como `--proxy-server=...` o `--proxy-pac-url=...`. El modo estricto SSRF bloquea el enrutamiento explícito del navegador mediante proxy salvo que el acceso del navegador a redes privadas esté habilitado intencionadamente.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` está desactivado de forma predeterminada; actívalo solo cuando el acceso del navegador a redes privadas sea intencionadamente de confianza.
- `browser.ssrfPolicy.allowPrivateNetwork` sigue siendo compatible como alias heredado.

</Accordion>

<Accordion title="Comportamiento del perfil">

- `attachOnly: true` significa no iniciar nunca un navegador local; solo adjuntarse si ya hay uno en ejecución.
- `headless` puede establecerse globalmente o por perfil local administrado. Los valores por perfil anulan `browser.headless`, por lo que un perfil iniciado localmente puede permanecer headless mientras otro sigue siendo visible.
- `POST /start?headless=true` y `openclaw browser start --headless` solicitan un
  inicio puntual en modo headless para perfiles locales administrados sin reescribir
  `browser.headless` ni la configuración del perfil. Los perfiles existing-session, attach-only y
  CDP remoto rechazan la anulación porque OpenClaw no inicia esos
  procesos de navegador.
- En hosts Linux sin `DISPLAY` ni `WAYLAND_DISPLAY`, los perfiles locales administrados
  usan de forma predeterminada el modo headless automáticamente cuando ni el entorno ni la
  configuración del perfil/global eligen explícitamente el modo con interfaz. `openclaw browser status --json`
  informa `headlessSource` como `env`, `profile`, `config`,
  `request`, `linux-display-fallback` o `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` fuerza los inicios locales administrados en modo headless para el
  proceso actual. `OPENCLAW_BROWSER_HEADLESS=0` fuerza el modo con interfaz para inicios ordinarios
  y devuelve un error accionable en hosts Linux sin servidor de pantalla;
  una solicitud explícita `start --headless` sigue teniendo prioridad para ese inicio puntual.
- `executablePath` puede establecerse globalmente o por perfil local administrado. Los valores por perfil anulan `browser.executablePath`, por lo que distintos perfiles administrados pueden iniciar distintos navegadores basados en Chromium.
- `color` (nivel superior y por perfil) da color a la UI del navegador para que puedas ver qué perfil está activo.
- El perfil predeterminado es `openclaw` (administrado independiente). Usa `defaultProfile: "user"` para optar por el navegador de usuario con sesión iniciada.
- Orden de detección automática: navegador predeterminado del sistema si está basado en Chromium; de lo contrario Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` usa Chrome DevTools MCP en lugar de CDP sin procesar. No establezcas `cdpUrl` para ese driver.
- Establece `browser.profiles.<name>.userDataDir` cuando un perfil existing-session deba adjuntarse a un perfil de usuario de Chromium no predeterminado (Brave, Edge, etc.).

</Accordion>

</AccordionGroup>

## Usar Brave (u otro navegador basado en Chromium)

Si tu navegador **predeterminado del sistema** está basado en Chromium (Chrome/Brave/Edge/etc),
OpenClaw lo usa automáticamente. Establece `browser.executablePath` para anular la
detección automática. `~` se expande al directorio home de tu sistema operativo:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

O establécelo en la configuración, por plataforma:

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

`executablePath` por perfil solo afecta a los perfiles locales administrados que OpenClaw
inicia. En cambio, los perfiles `existing-session` se adjuntan a un navegador ya en ejecución,
y los perfiles CDP remotos usan el navegador detrás de `cdpUrl`.

## Control local frente a remoto

- **Control local (predeterminado):** el Gateway inicia el servicio de control loopback y puede lanzar un navegador local.
- **Control remoto (host de Node):** ejecuta un host de Node en la máquina que tiene el navegador; el Gateway redirige las acciones del navegador hacia él.
- **CDP remoto:** establece `browser.profiles.<name>.cdpUrl` (o `browser.cdpUrl`) para
  adjuntarte a un navegador remoto basado en Chromium. En este caso, OpenClaw no iniciará un navegador local.
- Para servicios CDP administrados externamente en loopback (por ejemplo Browserless en
  Docker publicado en `127.0.0.1`), establece también `attachOnly: true`. CDP loopback
  sin `attachOnly` se trata como un perfil de navegador local administrado por OpenClaw.
- `headless` solo afecta a los perfiles locales administrados que OpenClaw inicia. No reinicia ni cambia navegadores existing-session ni CDP remotos.
- `executablePath` sigue la misma regla de perfil local administrado. Cambiarlo en un
  perfil local administrado en ejecución marca ese perfil para reinicio/reconciliación para que el
  siguiente inicio use el nuevo binario.

El comportamiento al detenerse difiere según el modo del perfil:

- perfiles locales administrados: `openclaw browser stop` detiene el proceso del navegador que
  OpenClaw inició
- perfiles attach-only y CDP remotos: `openclaw browser stop` cierra la sesión activa
  de control y libera anulaciones de emulación de Playwright/CDP (viewport,
  esquema de color, configuración regional, zona horaria, modo sin conexión y estado similar), aunque
  OpenClaw no haya iniciado ningún proceso de navegador

Las URL de CDP remoto pueden incluir autenticación:

- Tokens en query (p. ej., `https://provider.example?token=<token>`)
- Autenticación HTTP Basic (p. ej., `https://user:pass@provider.example`)

OpenClaw conserva la autenticación al llamar a endpoints `/json/*` y al conectarse
al WebSocket CDP. Prefiere variables de entorno o gestores de secretos para los
tokens en lugar de confirmarlos en archivos de configuración.

## Proxy de navegador de Node (predeterminado sin configuración)

Si ejecutas un **host de Node** en la máquina que tiene tu navegador, OpenClaw puede
enrutar automáticamente las llamadas a la herramienta de navegador a ese Node sin configuración adicional del navegador.
Esta es la ruta predeterminada para gateways remotos.

Notas:

- El host de Node expone su servidor local de control del navegador mediante un **comando proxy**.
- Los perfiles provienen de la propia configuración `browser.profiles` del node (igual que en local).
- `nodeHost.browserProxy.allowProfiles` es opcional. Déjalo vacío para el comportamiento heredado/predeterminado: todos los perfiles configurados siguen siendo accesibles a través del proxy, incluidas las rutas de crear/eliminar perfil.
- Si estableces `nodeHost.browserProxy.allowProfiles`, OpenClaw lo trata como un límite de privilegio mínimo: solo se pueden dirigir perfiles de la lista de permitidos, y las rutas persistentes de crear/eliminar perfil se bloquean en la superficie del proxy.
- Desactívalo si no lo quieres:
  - En el node: `nodeHost.browserProxy.enabled=false`
  - En el gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP remoto alojado)

[Browserless](https://browserless.io) es un servicio Chromium alojado que expone
URL de conexión CDP por HTTPS y WebSocket. OpenClaw puede usar cualquiera de las dos formas, pero
para un perfil de navegador remoto la opción más sencilla es la URL directa de WebSocket
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
- Elige el endpoint regional que coincida con tu cuenta de Browserless (consulta su documentación).
- Si Browserless te da una URL base HTTPS, puedes convertirla a
  `wss://` para una conexión CDP directa o mantener la URL HTTPS y dejar que OpenClaw
  detecte `/json/version`.

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
proceso de OpenClaw. Browserless también debe anunciar un endpoint accesible que coincida;
establece Browserless `EXTERNAL` en esa misma base WebSocket pública hacia OpenClaw, como
`ws://127.0.0.1:3000`, `ws://browserless:3000` o una dirección privada estable
de red Docker. Si `/json/version` devuelve `webSocketDebuggerUrl` apuntando a
una dirección a la que OpenClaw no puede acceder, CDP HTTP puede parecer correcto mientras que el adjunto WebSocket sigue fallando.

No dejes `attachOnly` sin establecer para un perfil Browserless en loopback. Sin
`attachOnly`, OpenClaw trata el puerto loopback como un perfil de navegador local administrado
y puede informar que el puerto está en uso pero no pertenece a OpenClaw.

## Proveedores CDP WebSocket directos

Algunos servicios de navegador alojados exponen un endpoint **WebSocket directo** en lugar de
la detección CDP estándar basada en HTTP (`/json/version`). OpenClaw acepta tres
formatos de URL CDP y elige automáticamente la estrategia de conexión correcta:

- **Detección HTTP(S)** — `http://host[:port]` o `https://host[:port]`.
  OpenClaw llama a `/json/version` para descubrir la URL del depurador WebSocket y luego
  se conecta. Sin respaldo WebSocket.
- **Endpoints WebSocket directos** — `ws://host[:port]/devtools/<kind>/<id>` o
  `wss://...` con una ruta `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw se conecta directamente mediante un handshake WebSocket y omite
  por completo `/json/version`.
- **Raíces WebSocket simples** — `ws://host[:port]` o `wss://host[:port]` sin
  ruta `/devtools/...` (p. ej. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw intenta primero la detección HTTP
  `/json/version` (normalizando el esquema a `http`/`https`);
  si la detección devuelve un `webSocketDebuggerUrl`, se usa; de lo contrario, OpenClaw
  recurre a un handshake WebSocket directo en la raíz simple. Si el
  endpoint WebSocket anunciado rechaza el handshake CDP pero la raíz simple configurada
  lo acepta, OpenClaw también recurre a esa raíz. Esto permite que un `ws://` simple
  apuntando a un Chrome local siga conectándose, ya que Chrome solo acepta
  actualizaciones WebSocket en la ruta específica por destino de `/json/version`, mientras que los proveedores
  alojados pueden seguir usando su endpoint WebSocket raíz cuando su endpoint de detección
  anuncia una URL de corta duración que no es adecuada para Playwright CDP.

### Browserbase

[Browserbase](https://www.browserbase.com) es una plataforma en la nube para ejecutar
navegadores headless con resolución integrada de CAPTCHA, modo sigiloso y proxies
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
  desde el [panel general](https://www.browserbase.com/overview).
- Sustituye `<BROWSERBASE_API_KEY>` por tu clave API real de Browserbase.
- Browserbase crea automáticamente una sesión de navegador al conectar por WebSocket, por lo que no
  hace falta un paso manual de creación de sesión.
- El nivel gratuito permite una sesión concurrente y una hora de navegador al mes.
  Consulta [precios](https://www.browserbase.com/pricing) para los límites de los planes de pago.
- Consulta la [documentación de Browserbase](https://docs.browserbase.com) para la referencia completa
  de API, guías del SDK y ejemplos de integración.

## Seguridad

Ideas clave:

- El control del navegador es solo loopback; el acceso fluye a través de la autenticación del Gateway o del emparejamiento de Node.
- La API HTTP independiente del navegador en loopback usa **solo autenticación con secreto compartido**:
  autenticación bearer con token del gateway, `x-openclaw-password` o autenticación HTTP Basic con la
  contraseña configurada del gateway.
- Los encabezados de identidad de Tailscale Serve y `gateway.auth.mode: "trusted-proxy"` **no**
  autentican esta API independiente del navegador en loopback.
- Si el control del navegador está habilitado y no hay configurada autenticación con secreto compartido, OpenClaw
  genera automáticamente `gateway.auth.token` al iniciarse y lo persiste en la configuración.
- OpenClaw **no** genera automáticamente ese token cuando `gateway.auth.mode` ya es
  `password`, `none` o `trusted-proxy`.
- Mantén el Gateway y cualquier host de node en una red privada (Tailscale); evita la exposición pública.
- Trata las URL/tokens de CDP remoto como secretos; prefiere variables de entorno o un gestor de secretos.

Consejos para CDP remoto:

- Prefiere endpoints cifrados (HTTPS o WSS) y tokens de corta duración cuando sea posible.
- Evita incrustar tokens de larga duración directamente en archivos de configuración.

## Perfiles (multinavegador)

OpenClaw admite varios perfiles nombrados (configuraciones de enrutamiento). Los perfiles pueden ser:

- **administrados por OpenClaw**: una instancia dedicada de navegador basado en Chromium con su propio directorio de datos de usuario + puerto CDP
- **remotos**: una URL CDP explícita (navegador basado en Chromium ejecutándose en otro lugar)
- **sesión existente**: tu perfil actual de Chrome mediante autoconexión de Chrome DevTools MCP

Valores predeterminados:

- El perfil `openclaw` se crea automáticamente si falta.
- El perfil `user` está integrado para adjunto existing-session de Chrome MCP.
- Los perfiles existing-session son opt-in más allá de `user`; créalos con `--driver existing-session`.
- Los puertos CDP locales se asignan de **18800–18899** de forma predeterminada.
- Al eliminar un perfil, su directorio de datos local se mueve a la Papelera.

Todos los endpoints de control aceptan `?profile=<name>`; la CLI usa `--browser-profile`.

## Sesión existente mediante Chrome DevTools MCP

OpenClaw también puede adjuntarse a un perfil de navegador basado en Chromium en ejecución a través del
servidor oficial Chrome DevTools MCP. Esto reutiliza las pestañas y el estado de inicio de sesión
ya abiertos en ese perfil de navegador.

Referencias oficiales de contexto y configuración:

- [Chrome for Developers: Usa Chrome DevTools MCP con tu sesión del navegador](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README de Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Perfil integrado:

- `user`

Opcional: crea tu propio perfil existing-session personalizado si quieres un
nombre, color o directorio de datos del navegador diferentes.

Comportamiento predeterminado:

- El perfil integrado `user` usa autoconexión de Chrome MCP, que apunta al
  perfil local predeterminado de Google Chrome.

Usa `userDataDir` para Brave, Edge, Chromium o un perfil de Chrome no predeterminado:

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
3. Mantén el navegador en ejecución y aprueba el prompt de conexión cuando OpenClaw se adjunte.

Páginas de inspección habituales:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Prueba rápida de adjunto en vivo:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Qué aspecto tiene el éxito:

- `status` muestra `driver: existing-session`
- `status` muestra `transport: chrome-mcp`
- `status` muestra `running: true`
- `tabs` lista las pestañas del navegador que ya tienes abiertas
- `snapshot` devuelve refs de la pestaña activa seleccionada

Qué comprobar si el adjunto no funciona:

- el navegador de destino basado en Chromium es versión `144+`
- la depuración remota está habilitada en la página de inspección de ese navegador
- el navegador mostró el prompt de consentimiento de adjunción y lo aceptaste
- `openclaw doctor` migra la configuración antigua del navegador basada en extensiones y comprueba que
  Chrome está instalado localmente para perfiles predeterminados de autoconexión, pero no puede
  habilitar por ti la depuración remota en el navegador

Uso por parte del agente:

- Usa `profile="user"` cuando necesites el estado del navegador del usuario con sesión iniciada.
- Si usas un perfil existing-session personalizado, pasa ese nombre de perfil explícito.
- Elige este modo solo cuando el usuario esté en el equipo para aprobar el
  prompt de adjunción.
- el Gateway o el host de Node pueden generar `npx chrome-devtools-mcp@latest --autoConnect`

Notas:

- Esta ruta es de mayor riesgo que el perfil aislado `openclaw` porque puede
  actuar dentro de tu sesión de navegador con sesión iniciada.
- OpenClaw no inicia el navegador para este driver; solo se adjunta.
- OpenClaw usa aquí el flujo oficial `--autoConnect` de Chrome DevTools MCP. Si
  `userDataDir` está establecido, se pasa para apuntar a ese directorio de datos de usuario.
- Existing-session puede adjuntarse en el host seleccionado o a través de un
  Node de navegador conectado. Si Chrome está en otro lugar y no hay ningún browser node conectado, usa
  CDP remoto o un host de Node en su lugar.

### Inicio personalizado de Chrome MCP

Anula el servidor Chrome DevTools MCP generado por perfil cuando el flujo predeterminado
`npx chrome-devtools-mcp@latest` no sea lo que quieres (hosts sin conexión,
versiones fijadas, binarios integrados):

| Campo        | Qué hace                                                                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Ejecutable que se genera en lugar de `npx`. Se resuelve tal cual; se respetan las rutas absolutas.                   |
| `mcpArgs`    | Array de argumentos pasado literalmente a `mcpCommand`. Sustituye los argumentos predeterminados `chrome-devtools-mcp@latest --autoConnect`. |

Cuando `cdpUrl` está establecido en un perfil existing-session, OpenClaw omite
`--autoConnect` y reenvía automáticamente el endpoint a Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (endpoint de detección HTTP de DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (WebSocket CDP directo).

Las banderas de endpoint y `userDataDir` no pueden combinarse: cuando `cdpUrl` está establecido,
`userDataDir` se ignora para el inicio de Chrome MCP, ya que Chrome MCP se adjunta al
navegador en ejecución detrás del endpoint en lugar de abrir un directorio
de perfil.

<Accordion title="Limitaciones de funciones de existing-session">

En comparación con el perfil administrado `openclaw`, los drivers existing-session están más limitados:

- **Capturas de pantalla** — las capturas de página y las capturas de elementos con `--ref` funcionan; los selectores CSS `--element` no. `--full-page` no puede combinarse con `--ref` ni con `--element`. Playwright no es necesario para capturas de pantalla de página ni de elementos basadas en ref.
- **Acciones** — `click`, `type`, `hover`, `scrollIntoView`, `drag` y `select` requieren refs de snapshot (sin selectores CSS). `click-coords` hace clic en coordenadas visibles del viewport y no requiere una ref de snapshot. `click` es solo con botón izquierdo. `type` no admite `slowly=true`; usa `fill` o `press`. `press` no admite `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` y `evaluate` no admiten tiempos de espera por llamada. `select` acepta un solo valor.
- **Wait / upload / dialog** — `wait --url` admite patrones exactos, de subcadena y glob; `wait --load networkidle` no es compatible. Los hooks de carga requieren `ref` o `inputRef`, un archivo a la vez, sin CSS `element`. Los hooks de diálogo no admiten anulaciones de tiempo de espera.
- **Funciones solo administradas** — acciones por lotes, exportación a PDF, interceptación de descargas y `responsebody` siguen requiriendo la ruta de navegador administrado.

</Accordion>

## Garantías de aislamiento

- **Directorio dedicado de datos de usuario**: nunca toca tu perfil de navegador personal.
- **Puertos dedicados**: evita `9222` para prevenir colisiones con flujos de desarrollo.
- **Control determinista de pestañas**: `tabs` devuelve primero `suggestedTargetId`, luego
  identificadores estables `tabId` como `t1`, etiquetas opcionales y el `targetId` sin procesar.
  Los agentes deben reutilizar `suggestedTargetId`; los id sin procesar siguen disponibles para
  depuración y compatibilidad.

## Selección del navegador

Al iniciar localmente, OpenClaw elige el primero disponible:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Puedes anularlo con `browser.executablePath`.

Plataformas:

- macOS: comprueba `/Applications` y `~/Applications`.
- Linux: comprueba ubicaciones habituales de Chrome/Brave/Edge/Chromium en `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` y
  `/usr/lib/chromium-browser`.
- Windows: comprueba ubicaciones habituales de instalación.

## API de control (opcional)

Para scripting y depuración, el Gateway expone una pequeña **API HTTP
de control solo loopback** más una CLI `openclaw browser` correspondiente (snapshots, refs, wait
potenciados, salida JSON, flujos de depuración). Consulta
[API de control del navegador](/es/tools/browser-control) para la referencia completa.

## Solución de problemas

Para problemas específicos de Linux (especialmente snap Chromium), consulta
[Solución de problemas del navegador](/es/tools/browser-linux-troubleshooting).

Para configuraciones divididas WSL2 Gateway + Windows Chrome en hosts distintos, consulta
[Solución de problemas de WSL2 + Windows + CDP remoto de Chrome](/es/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Fallo de inicio de CDP frente a bloqueo SSRF de navegación

Son clases de fallo distintas y apuntan a rutas de código diferentes.

- **El fallo de inicio o preparación de CDP** significa que OpenClaw no puede confirmar que el plano de control del navegador está en buen estado.
- **El bloqueo SSRF de navegación** significa que el plano de control del navegador está en buen estado, pero un destino de navegación de página es rechazado por la política.

Ejemplos habituales:

- Fallo de inicio o preparación de CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` cuando un
    servicio CDP externo en loopback está configurado sin `attachOnly: true`
- Bloqueo SSRF de navegación:
  - los flujos `open`, `navigate`, snapshot o apertura de pestañas fallan con un error de política de navegador/red mientras `start` y `tabs` siguen funcionando

Usa esta secuencia mínima para separar ambos:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Cómo interpretar los resultados:

- Si `start` falla con `not reachable after start`, primero soluciona la disponibilidad de CDP.
- Si `start` tiene éxito pero `tabs` falla, el plano de control sigue sin estar en buen estado. Trata esto como un problema de accesibilidad de CDP, no como un problema de navegación de página.
- Si `start` y `tabs` tienen éxito pero `open` o `navigate` fallan, el plano de control del navegador está activo y el fallo está en la política de navegación o en la página de destino.
- Si `start`, `tabs` y `open` tienen éxito, la ruta básica de control del navegador administrado está en buen estado.

Detalles importantes del comportamiento:

- La configuración del navegador usa de forma predeterminada un objeto de política SSRF de fallo seguro incluso cuando no configuras `browser.ssrfPolicy`.
- Para el perfil administrado local loopback `openclaw`, las comprobaciones de estado de CDP omiten intencionadamente la aplicación de accesibilidad SSRF del navegador para el propio plano de control local de OpenClaw.
- La protección de navegación es independiente. Un resultado correcto de `start` o `tabs` no significa que un destino posterior de `open` o `navigate` esté permitido.

Guía de seguridad:

- **No** relajes la política SSRF del navegador de forma predeterminada.
- Prefiere excepciones de host limitadas como `hostnameAllowlist` o `allowedHostnames` en lugar de un acceso amplio a redes privadas.
- Usa `dangerouslyAllowPrivateNetwork: true` solo en entornos intencionadamente de confianza donde el acceso del navegador a redes privadas sea necesario y revisado.

## Herramientas del agente + cómo funciona el control

El agente obtiene **una herramienta** para la automatización del navegador:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Cómo se corresponde:

- `browser snapshot` devuelve un árbol estable de UI (AI o ARIA).
- `browser act` usa los id `ref` del snapshot para hacer clic/escribir/arrastrar/seleccionar.
- `browser screenshot` captura píxeles (página completa, elemento o refs etiquetadas).
- `browser doctor` comprueba el Gateway, el plugin, el perfil, el navegador y la disponibilidad de pestañas.
- `browser` acepta:
  - `profile` para elegir un perfil de navegador nombrado (openclaw, chrome o CDP remoto).
  - `target` (`sandbox` | `host` | `node`) para seleccionar dónde vive el navegador.
  - En sesiones aisladas con sandbox, `target: "host"` requiere `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Si se omite `target`: las sesiones en sandbox usan `sandbox` de forma predeterminada; las sesiones sin sandbox usan `host`.
  - Si hay conectado un Node con capacidad de navegador, la herramienta puede enrutar automáticamente hacia él a menos que fijes `target="host"` o `target="node"`.

Esto mantiene al agente determinista y evita selectores frágiles.

## Relacionado

- [Resumen de herramientas](/es/tools) — todas las herramientas de agente disponibles
- [Sandboxing](/es/gateway/sandboxing) — control del navegador en entornos con sandbox
- [Seguridad](/es/gateway/security) — riesgos y endurecimiento del control del navegador
