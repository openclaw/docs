---
read_when:
    - Añadir automatización de navegador controlada por el agente
    - Depurar por qué openclaw está interfiriendo con tu propio Chrome
    - Implementar configuración + ciclo de vida del navegador en la app de macOS
summary: Servicio integrado de control del navegador + comandos de acción
title: Navegador (gestionado por OpenClaw)
x-i18n:
    generated_at: "2026-04-24T05:52:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2fb0fc0b6235fa8a0324b754e247e015d5ca19d114d324d565ed4a19f9313f7e
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw puede ejecutar un **perfil dedicado de Chrome/Brave/Edge/Chromium** que el agente controla.
Está aislado de tu navegador personal y se gestiona mediante un pequeño
servicio local de control dentro del Gateway (solo loopback).

Visión para principiantes:

- Piensa en esto como un **navegador separado, solo para el agente**.
- El perfil `openclaw` **no** toca tu perfil personal del navegador.
- El agente puede **abrir pestañas, leer páginas, hacer clic y escribir** en una vía segura.
- El perfil integrado `user` se adjunta a tu sesión real de Chrome con inicio de sesión mediante Chrome MCP.

## Qué obtienes

- Un perfil de navegador separado llamado **openclaw** (acento naranja por defecto).
- Control determinista de pestañas (listar/abrir/enfocar/cerrar).
- Acciones del agente (clic/escritura/arrastrar/seleccionar), instantáneas, capturas de pantalla, PDF.
- Compatibilidad opcional con varios perfiles (`openclaw`, `work`, `remote`, ...).

Este navegador **no** es tu navegador de uso diario. Es una superficie segura y aislada para
automatización y verificación del agente.

## Inicio rápido

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Si obtienes “Browser disabled”, habilítalo en la configuración (ver más abajo) y reinicia el
Gateway.

Si falta por completo `openclaw browser`, o el agente dice que la herramienta del navegador
no está disponible, ve a [Comando o herramienta de navegador ausente](/es/tools/browser#missing-browser-command-or-tool).

## Control del Plugin

La herramienta predeterminada `browser` es un Plugin incluido. Desactívala para sustituirla por otro Plugin que registre el mismo nombre de herramienta `browser`:

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

Los valores predeterminados necesitan tanto `plugins.entries.browser.enabled` **como** `browser.enabled=true`. Desactivar solo el Plugin elimina de una vez la CLI `openclaw browser`, el método de gateway `browser.request`, la herramienta del agente y el servicio de control; tu configuración `browser.*` permanece intacta para un reemplazo.

Los cambios de configuración del navegador requieren reiniciar el Gateway para que el Plugin pueda volver a registrar su servicio.

## Comando o herramienta de navegador ausente

Si `openclaw browser` es desconocido tras una actualización, falta `browser.request` o el agente informa que la herramienta del navegador no está disponible, la causa habitual es una lista `plugins.allow` que omite `browser`. Añádelo:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` y `tools.alsoAllow: ["browser"]` no sustituyen la pertenencia a la lista de permitidos: la lista de permitidos controla la carga del Plugin, y la política de herramientas solo se ejecuta después de la carga. Eliminar por completo `plugins.allow` también restaura el valor predeterminado.

## Perfiles: `openclaw` vs `user`

- `openclaw`: navegador gestionado y aislado (no requiere extensión).
- `user`: perfil integrado de adjunte Chrome MCP para tu sesión **real de Chrome con inicio de sesión**.

Para llamadas a herramientas de navegador del agente:

- Predeterminado: usar el navegador aislado `openclaw`.
- Preferir `profile="user"` cuando importen sesiones existentes con inicio de sesión y el usuario
  esté delante del ordenador para hacer clic/aprobar cualquier solicitud de adjunte.
- `profile` es la sobrescritura explícita cuando quieres un modo de navegador específico.

Establece `browser.defaultProfile: "openclaw"` si quieres el modo gestionado por defecto.

## Configuración

Los ajustes del navegador están en `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // predeterminado: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // activar solo para acceso intencionadamente fiable a redes privadas
      // allowPrivateNetwork: true, // alias heredado
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // sobrescritura heredada de perfil único
    remoteCdpTimeoutMs: 1500, // tiempo de espera HTTP de CDP remoto (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // tiempo de espera del handshake WebSocket de CDP remoto (ms)
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
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

- El servicio de control se enlaza a loopback en un puerto derivado de `gateway.port` (predeterminado `18791` = gateway + 2). Sobrescribir `gateway.port` o `OPENCLAW_GATEWAY_PORT` desplaza los puertos derivados de la misma familia.
- Los perfiles locales `openclaw` asignan automáticamente `cdpPort`/`cdpUrl`; establécelos solo para CDP remoto. `cdpUrl` usa por defecto el puerto CDP local gestionado cuando no se establece.
- `remoteCdpTimeoutMs` se aplica a comprobaciones HTTP de accesibilidad de CDP remoto (no loopback); `remoteCdpHandshakeTimeoutMs` se aplica a handshakes WebSocket de CDP remoto.

</Accordion>

<Accordion title="Política SSRF">

- La navegación del navegador y la apertura de pestañas están protegidas contra SSRF antes de la navegación y se vuelven a comprobar por mejor esfuerzo en la URL final `http(s)` después.
- En modo SSRF estricto, también se comprueban el descubrimiento de endpoints CDP remotos y las sondas `/json/version` (`cdpUrl`).
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` está desactivado por defecto; actívalo solo cuando el acceso del navegador a la red privada sea intencionadamente fiable.
- `browser.ssrfPolicy.allowPrivateNetwork` sigue siendo compatible como alias heredado.

</Accordion>

<Accordion title="Comportamiento de perfiles">

- `attachOnly: true` significa no iniciar nunca un navegador local; solo adjuntarse si ya hay uno ejecutándose.
- `color` (de nivel superior y por perfil) tiñe la interfaz del navegador para que puedas ver qué perfil está activo.
- El perfil predeterminado es `openclaw` (independiente gestionado). Usa `defaultProfile: "user"` para optar por el navegador del usuario con inicio de sesión.
- Orden de autodetección: navegador predeterminado del sistema si está basado en Chromium; en caso contrario Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` usa Chrome DevTools MCP en lugar de CDP sin procesar. No establezcas `cdpUrl` para ese driver.
- Establece `browser.profiles.<name>.userDataDir` cuando un perfil existing-session deba adjuntarse a un perfil de usuario Chromium no predeterminado (Brave, Edge, etc.).

</Accordion>

</AccordionGroup>

## Usar Brave (u otro navegador basado en Chromium)

Si tu navegador **predeterminado del sistema** está basado en Chromium (Chrome/Brave/Edge/etc.),
OpenClaw lo usa automáticamente. Establece `browser.executablePath` para sobrescribir
la autodetección:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

O establécelo en la configuración, según la plataforma:

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

## Control local vs remoto

- **Control local (predeterminado):** el Gateway inicia el servicio de control de loopback y puede lanzar un navegador local.
- **Control remoto (host nodo):** ejecuta un host nodo en la máquina que tenga el navegador; el Gateway hace de proxy de las acciones del navegador hacia él.
- **CDP remoto:** establece `browser.profiles.<name>.cdpUrl` (o `browser.cdpUrl`) para
  adjuntarte a un navegador remoto basado en Chromium. En este caso, OpenClaw no lanzará un navegador local.

El comportamiento de parada difiere según el modo de perfil:

- perfiles gestionados locales: `openclaw browser stop` detiene el proceso del navegador que
  OpenClaw lanzó
- perfiles attach-only y CDP remoto: `openclaw browser stop` cierra la sesión activa
  de control y libera las sobrescrituras de emulación Playwright/CDP (viewport,
  esquema de color, idioma, zona horaria, modo offline y estados similares), aunque
  OpenClaw no haya lanzado ningún proceso de navegador

Las URL de CDP remoto pueden incluir autenticación:

- Tokens de consulta (por ejemplo, `https://provider.example?token=<token>`)
- Autenticación HTTP Basic (por ejemplo, `https://user:pass@provider.example`)

OpenClaw conserva la autenticación al llamar a endpoints `/json/*` y al conectarse
al WebSocket CDP. Prefiere variables de entorno o gestores de secretos para
los tokens en lugar de confirmarlos en archivos de configuración.

## Proxy de navegador de nodo (valor predeterminado sin configuración)

Si ejecutas un **host nodo** en la máquina que tiene tu navegador, OpenClaw puede
enrutar automáticamente las llamadas a herramientas del navegador a ese nodo sin configuración adicional del navegador.
Esta es la ruta predeterminada para gateways remotos.

Notas:

- El host nodo expone su servidor local de control del navegador mediante un **comando proxy**.
- Los perfiles proceden de la propia configuración `browser.profiles` del nodo (igual que en local).
- `nodeHost.browserProxy.allowProfiles` es opcional. Déjalo vacío para el comportamiento heredado/predeterminado: todos los perfiles configurados siguen siendo accesibles a través del proxy, incluidas las rutas de creación/eliminación de perfiles.
- Si estableces `nodeHost.browserProxy.allowProfiles`, OpenClaw lo trata como un límite de mínimo privilegio: solo se pueden dirigir perfiles incluidos en la lista de permitidos y las rutas persistentes de creación/eliminación de perfiles se bloquean en la superficie del proxy.
- Desactívalo si no lo quieres:
  - En el nodo: `nodeHost.browserProxy.enabled=false`
  - En el gateway: `gateway.nodes.browser.mode="off"`

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
  `wss://` para una conexión CDP directa o mantener la URL HTTPS y dejar que OpenClaw
  descubra `/json/version`.

## Proveedores CDP directos por WebSocket

Algunos servicios alojados de navegador exponen un endpoint **WebSocket directo** en lugar del
descubrimiento CDP estándar basado en HTTP (`/json/version`). OpenClaw acepta tres formas
de URL CDP y elige automáticamente la estrategia de conexión adecuada:

- **Descubrimiento HTTP(S)** — `http://host[:port]` o `https://host[:port]`.
  OpenClaw llama a `/json/version` para descubrir la URL del depurador WebSocket y luego
  se conecta. Sin respaldo WebSocket.
- **Endpoints WebSocket directos** — `ws://host[:port]/devtools/<kind>/<id>` o
  `wss://...` con una ruta `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw se conecta directamente mediante un handshake WebSocket y omite
  `/json/version` por completo.
- **Raíces WebSocket sin ruta** — `ws://host[:port]` o `wss://host[:port]` sin
  ruta `/devtools/...` (por ejemplo [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw intenta primero el
  descubrimiento HTTP `/json/version` (normalizando el esquema a `http`/`https`);
  si el descubrimiento devuelve un `webSocketDebuggerUrl`, se usa; de lo contrario, OpenClaw
  recurre a un handshake WebSocket directo en la raíz vacía. Esto permite que una
  `ws://` vacía apuntando a un Chrome local siga conectando, ya que Chrome solo
  acepta upgrades WebSocket en la ruta específica por objetivo obtenida de
  `/json/version`.

### Browserbase

[Browserbase](https://www.browserbase.com) es una plataforma cloud para ejecutar
navegadores headless con resolución integrada de CAPTCHA, modo sigiloso y proxis
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
- Browserbase crea automáticamente una sesión de navegador al conectarse por WebSocket, así que no
  hace falta un paso manual de creación de sesión.
- El nivel gratuito permite una sesión concurrente y una hora de navegador al mes.
  Consulta [precios](https://www.browserbase.com/pricing) para ver los límites de los planes de pago.
- Consulta la [documentación de Browserbase](https://docs.browserbase.com) para ver la referencia completa de la API,
  guías SDK y ejemplos de integración.

## Seguridad

Ideas clave:

- El control del navegador es solo loopback; el acceso fluye a través de la autenticación del Gateway o la vinculación del nodo.
- La API HTTP independiente de navegador en loopback usa **solo autenticación con secreto compartido**:
  autenticación bearer con token del gateway, `x-openclaw-password` o autenticación HTTP Basic con la
  contraseña configurada del gateway.
- Las cabeceras de identidad de Tailscale Serve y `gateway.auth.mode: "trusted-proxy"` **no**
  autentican esta API independiente de navegador en loopback.
- Si el control del navegador está habilitado y no hay configurada autenticación con secreto compartido, OpenClaw
  genera automáticamente `gateway.auth.token` al arrancar y lo persiste en la configuración.
- OpenClaw **no** genera automáticamente ese token cuando `gateway.auth.mode` ya es
  `password`, `none` o `trusted-proxy`.
- Mantén el Gateway y cualquier host de nodo en una red privada (Tailscale); evita la exposición pública.
- Trata las URL/tokens de CDP remoto como secretos; prefiere variables de entorno o un gestor de secretos.

Consejos para CDP remoto:

- Prefiere endpoints cifrados (HTTPS o WSS) y tokens de corta duración cuando sea posible.
- Evita incrustar tokens de larga duración directamente en archivos de configuración.

## Perfiles (multi-browser)

OpenClaw admite varios perfiles con nombre (configuraciones de enrutamiento). Los perfiles pueden ser:

- **gestionado por openclaw**: una instancia dedicada de navegador basado en Chromium con su propio directorio de datos de usuario + puerto CDP
- **remoto**: una URL CDP explícita (navegador basado en Chromium ejecutándose en otro lugar)
- **sesión existente**: tu perfil existente de Chrome mediante autoconexión de Chrome DevTools MCP

Valores predeterminados:

- El perfil `openclaw` se crea automáticamente si falta.
- El perfil `user` está integrado para el adjunte existing-session de Chrome MCP.
- Los perfiles existing-session son opt-in más allá de `user`; créalos con `--driver existing-session`.
- Los puertos CDP locales se asignan por defecto desde **18800–18899**.
- Eliminar un perfil mueve su directorio de datos local a la Papelera.

Todos los endpoints de control aceptan `?profile=<name>`; la CLI usa `--browser-profile`.

## Existing-session mediante Chrome DevTools MCP

OpenClaw también puede adjuntarse a un perfil de navegador basado en Chromium ya en ejecución mediante el
servidor oficial Chrome DevTools MCP. Esto reutiliza las pestañas y el estado de inicio de sesión
ya abiertos en ese perfil de navegador.

Referencias oficiales de contexto y configuración:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Perfil integrado:

- `user`

Opcional: crea tu propio perfil personalizado existing-session si quieres un
nombre, color o directorio de datos de navegador diferentes.

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
3. Mantén el navegador en ejecución y aprueba la solicitud de conexión cuando OpenClaw se adjunte.

Páginas habituales de inspección:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Prueba rápida de adjunte live:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Cómo es el éxito:

- `status` muestra `driver: existing-session`
- `status` muestra `transport: chrome-mcp`
- `status` muestra `running: true`
- `tabs` lista las pestañas ya abiertas del navegador
- `snapshot` devuelve referencias de la pestaña live seleccionada

Qué comprobar si el adjunte no funciona:

- el navegador objetivo basado en Chromium es versión `144+`
- la depuración remota está habilitada en la página de inspección de ese navegador
- el navegador mostró y tú aceptaste la solicitud de consentimiento de adjunte
- `openclaw doctor` migra la configuración antigua del navegador basada en extensiones y comprueba que
  Chrome esté instalado localmente para perfiles predeterminados de autoconexión, pero no puede
  habilitar por ti la depuración remota del lado del navegador

Uso por el agente:

- Usa `profile="user"` cuando necesites el estado del navegador con inicio de sesión del usuario.
- Si usas un perfil personalizado existing-session, pasa ese nombre de perfil explícito.
- Elige este modo solo cuando el usuario esté delante del ordenador para aprobar la
  solicitud de adjunte.
- el Gateway o el host nodo puede generar `npx chrome-devtools-mcp@latest --autoConnect`

Notas:

- Esta ruta tiene más riesgo que el perfil aislado `openclaw` porque puede
  actuar dentro de tu sesión de navegador con inicio de sesión.
- OpenClaw no lanza el navegador para este driver; solo se adjunta.
- OpenClaw usa aquí el flujo oficial Chrome DevTools MCP `--autoConnect`. Si
  `userDataDir` está establecido, se reenvía para apuntar a ese directorio de datos de usuario.
- existing-session puede adjuntarse en el host seleccionado o a través de un
  nodo de navegador conectado. Si Chrome vive en otro lugar y no hay ningún nodo de navegador conectado, usa
  CDP remoto o un host nodo en su lugar.

<Accordion title="Limitaciones de funciones de existing-session">

Comparados con el perfil gestionado `openclaw`, los drivers existing-session están más limitados:

- **Capturas de pantalla** — las capturas de página y las capturas de elemento con `--ref` funcionan; los selectores CSS `--element` no. `--full-page` no puede combinarse con `--ref` ni `--element`. No se requiere Playwright para capturas de página o de elemento basadas en referencias.
- **Acciones** — `click`, `type`, `hover`, `scrollIntoView`, `drag` y `select` requieren refs de snapshot (sin selectores CSS). `click` es solo con botón izquierdo. `type` no admite `slowly=true`; usa `fill` o `press`. `press` no admite `delayMs`. `hover`, `scrollIntoView`, `drag`, `select`, `fill` y `evaluate` no admiten tiempos de espera por llamada. `select` acepta un único valor.
- **Espera / subida / diálogo** — `wait --url` admite patrones exactos, subcadenas y glob; `wait --load networkidle` no es compatible. Los hooks de subida requieren `ref` o `inputRef`, un archivo cada vez, sin CSS `element`. Los hooks de diálogo no admiten sobrescrituras de tiempo de espera.
- **Funciones solo gestionadas** — acciones por lotes, exportación PDF, interceptación de descargas y `responsebody` siguen requiriendo la ruta de navegador gestionado.

</Accordion>

## Garantías de aislamiento

- **Directorio dedicado de datos de usuario**: nunca toca tu perfil personal del navegador.
- **Puertos dedicados**: evita `9222` para prevenir colisiones con flujos de desarrollo.
- **Control determinista de pestañas**: apunta a pestañas por `targetId`, no por “última pestaña”.

## Selección de navegador

Al lanzarlo localmente, OpenClaw elige el primero disponible:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Puedes sobrescribirlo con `browser.executablePath`.

Plataformas:

- macOS: comprueba `/Applications` y `~/Applications`.
- Linux: busca `google-chrome`, `brave`, `microsoft-edge`, `chromium`, etc.
- Windows: comprueba ubicaciones habituales de instalación.

## API de control (opcional)

Para scripting y depuración, el Gateway expone una pequeña **API HTTP
de control solo loopback** más una CLI coincidente `openclaw browser` (instantáneas, refs, mejoras de espera, salida JSON, flujos de depuración). Consulta
[API de control del navegador](/es/tools/browser-control) para la referencia completa.

## Solución de problemas

Para problemas específicos de Linux (especialmente Chromium en snap), consulta
[Solución de problemas del navegador](/es/tools/browser-linux-troubleshooting).

Para configuraciones divididas WSL2 Gateway + Chrome de Windows en host, consulta
[Solución de problemas de WSL2 + Windows + CDP remoto de Chrome](/es/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Fallo de arranque CDP vs bloqueo SSRF de navegación

Estas son clases de fallo diferentes y apuntan a rutas de código diferentes.

- **Fallo de arranque o preparación de CDP** significa que OpenClaw no puede confirmar que el plano de control del navegador esté en buen estado.
- **Bloqueo SSRF de navegación** significa que el plano de control del navegador está en buen estado, pero un destino de navegación de página es rechazado por la política.

Ejemplos habituales:

- Fallo de arranque o preparación de CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Bloqueo SSRF de navegación:
  - Los flujos `open`, `navigate`, snapshot u apertura de pestañas fallan con un error de política de navegador/red mientras `start` y `tabs` siguen funcionando

Usa esta secuencia mínima para separar ambos casos:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Cómo interpretar los resultados:

- Si `start` falla con `not reachable after start`, primero soluciona la preparación de CDP.
- Si `start` tiene éxito pero `tabs` falla, el plano de control sigue sin estar sano. Trata esto como un problema de accesibilidad de CDP, no como un problema de navegación de página.
- Si `start` y `tabs` tienen éxito pero `open` o `navigate` fallan, el plano de control del navegador está activo y el fallo está en la política de navegación o en la página de destino.
- Si `start`, `tabs` y `open` tienen éxito, la ruta básica de control del navegador gestionado está sana.

Detalles importantes de comportamiento:

- La configuración del navegador usa por defecto un objeto de política SSRF de fallo seguro incluso cuando no configuras `browser.ssrfPolicy`.
- Para el perfil gestionado local de loopback `openclaw`, las comprobaciones de estado de CDP omiten intencionadamente la aplicación de accesibilidad SSRF del navegador para el propio plano de control local de OpenClaw.
- La protección de navegación es independiente. Un resultado correcto de `start` o `tabs` no significa que un destino posterior de `open` o `navigate` esté permitido.

Guía de seguridad:

- **No** relajes la política SSRF del navegador por defecto.
- Prefiere excepciones estrechas de host como `hostnameAllowlist` o `allowedHostnames` en lugar de acceso amplio a red privada.
- Usa `dangerouslyAllowPrivateNetwork: true` solo en entornos intencionadamente fiables donde el acceso del navegador a red privada sea necesario y esté revisado.

## Herramientas del agente + cómo funciona el control

El agente obtiene **una herramienta** para automatización del navegador:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Cómo se asigna:

- `browser snapshot` devuelve un árbol UI estable (AI o ARIA).
- `browser act` usa los id `ref` del snapshot para hacer clic/escribir/arrastrar/seleccionar.
- `browser screenshot` captura píxeles (página completa o elemento).
- `browser` acepta:
  - `profile` para elegir un perfil de navegador con nombre (openclaw, chrome o CDP remoto).
  - `target` (`sandbox` | `host` | `node`) para seleccionar dónde vive el navegador.
  - En sesiones con sandbox, `target: "host"` requiere `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Si se omite `target`: las sesiones con sandbox usan por defecto `sandbox`, las sesiones sin sandbox usan por defecto `host`.
  - Si hay conectado un nodo con capacidad de navegador, la herramienta puede enrutar automáticamente a él salvo que fijes `target="host"` o `target="node"`.

Esto mantiene al agente determinista y evita selectores frágiles.

## Relacionado

- [Descripción general de herramientas](/es/tools) — todas las herramientas disponibles del agente
- [Sandboxing](/es/gateway/sandboxing) — control del navegador en entornos con sandbox
- [Seguridad](/es/gateway/security) — riesgos del control del navegador y endurecimiento
