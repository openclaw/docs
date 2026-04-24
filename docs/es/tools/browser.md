---
read_when:
    - Agregar automatización del navegador controlada por el agente
    - Depurar por qué openclaw está interfiriendo con su propio Chrome
    - Implementar la configuración y el ciclo de vida del navegador en la aplicación de macOS
summary: Servicio integrado de control del navegador + comandos de acción
title: Navegador (administrado por OpenClaw)
x-i18n:
    generated_at: "2026-04-24T09:01:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80805676213ef5195093163874a848955b3c25364b20045a8d759d03ac088e14
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw puede ejecutar un **perfil dedicado de Chrome/Brave/Edge/Chromium** que el agente controla.
Está aislado de su navegador personal y se administra mediante un pequeño servicio local de
control dentro de Gateway (solo loopback).

Vista para principiantes:

- Piense en ello como un **navegador separado, solo para el agente**.
- El perfil `openclaw` **no** toca su perfil personal del navegador.
- El agente puede **abrir pestañas, leer páginas, hacer clic y escribir** en una vía segura.
- El perfil integrado `user` se conecta a su sesión real iniciada de Chrome mediante Chrome MCP.

## Qué obtiene

- Un perfil de navegador separado llamado **openclaw** (acento naranja de forma predeterminada).
- Control determinista de pestañas (listar/abrir/enfocar/cerrar).
- Acciones del agente (clic/escritura/arrastrar/seleccionar), instantáneas, capturas de pantalla, PDFs.
- Compatibilidad opcional con varios perfiles (`openclaw`, `work`, `remote`, ...).

Este navegador **no** es su navegador principal de uso diario. Es una superficie segura y aislada para
automatización y verificación del agente.

## Inicio rápido

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Si recibe “Browser disabled”, habilítelo en la configuración (consulte más abajo) y reinicie
Gateway.

Si `openclaw browser` falta por completo, o el agente dice que la herramienta del navegador
no está disponible, vaya a [Falta el comando o la herramienta del navegador](/es/tools/browser#missing-browser-command-or-tool).

## Control del Plugin

La herramienta predeterminada `browser` es un Plugin incluido. Desactívelo para reemplazarlo por otro Plugin que registre el mismo nombre de herramienta `browser`:

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

Los valores predeterminados necesitan tanto `plugins.entries.browser.enabled` **como** `browser.enabled=true`. Desactivar solo el Plugin elimina como una sola unidad la CLI `openclaw browser`, el método de Gateway `browser.request`, la herramienta del agente y el servicio de control; su configuración `browser.*` permanece intacta para un reemplazo.

Los cambios de configuración del navegador requieren reiniciar Gateway para que el Plugin pueda volver a registrar su servicio.

## Falta el comando o la herramienta del navegador

Si `openclaw browser` es desconocido después de una actualización, falta `browser.request` o el agente informa que la herramienta del navegador no está disponible, la causa habitual es una lista `plugins.allow` que omite `browser`. Agréguelo:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` y `tools.alsoAllow: ["browser"]` no sustituyen la pertenencia a la lista de permitidos: la lista de permitidos controla la carga del Plugin, y la política de herramientas solo se ejecuta después de la carga. Eliminar por completo `plugins.allow` también restaura el valor predeterminado.

## Perfiles: `openclaw` frente a `user`

- `openclaw`: navegador administrado y aislado (no requiere extensión).
- `user`: perfil integrado de conexión Chrome MCP para su sesión **real iniciada de Chrome**.

Para llamadas de herramientas de navegador del agente:

- Predeterminado: usar el navegador aislado `openclaw`.
- Prefiera `profile="user"` cuando importen las sesiones existentes ya iniciadas y el usuario
  esté en el equipo para hacer clic/aprobar cualquier solicitud de conexión.
- `profile` es el reemplazo explícito cuando desea un modo de navegador específico.

Configure `browser.defaultProfile: "openclaw"` si desea el modo administrado de forma predeterminada.

## Configuración

La configuración del navegador está en `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // predeterminado: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // habilitar solo para acceso confiable a redes privadas
      // allowPrivateNetwork: true, // alias heredado
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // reemplazo heredado de perfil único
    remoteCdpTimeoutMs: 1500, // tiempo de espera HTTP remoto de CDP (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // tiempo de espera del protocolo de enlace WebSocket remoto de CDP (ms)
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

- El servicio de control se vincula a loopback en un puerto derivado de `gateway.port` (predeterminado `18791` = gateway + 2). Reemplazar `gateway.port` o `OPENCLAW_GATEWAY_PORT` desplaza los puertos derivados dentro de la misma familia.
- Los perfiles locales `openclaw` asignan automáticamente `cdpPort`/`cdpUrl`; configúrelos solo para CDP remoto. `cdpUrl` usa de forma predeterminada el puerto CDP local administrado cuando no está configurado.
- `remoteCdpTimeoutMs` se aplica a comprobaciones de accesibilidad HTTP de CDP remoto (no loopback); `remoteCdpHandshakeTimeoutMs` se aplica a protocolos de enlace WebSocket de CDP remoto.

</Accordion>

<Accordion title="Política SSRF">

- La navegación del navegador y abrir pestañas están protegidos contra SSRF antes de navegar y se vuelven a comprobar en la medida de lo posible en la URL final `http(s)` después.
- En modo SSRF estricto, también se comprueban el descubrimiento del endpoint CDP remoto y las sondas `/json/version` (`cdpUrl`).
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` está desactivado de forma predeterminada; habilítelo solo cuando el acceso del navegador a redes privadas sea intencionadamente de confianza.
- `browser.ssrfPolicy.allowPrivateNetwork` sigue siendo compatible como alias heredado.

</Accordion>

<Accordion title="Comportamiento del perfil">

- `attachOnly: true` significa no iniciar nunca un navegador local; solo conectarse si ya hay uno en ejecución.
- `color` (nivel superior y por perfil) colorea la interfaz del navegador para que pueda ver qué perfil está activo.
- El perfil predeterminado es `openclaw` (independiente administrado). Use `defaultProfile: "user"` para optar por el navegador del usuario con sesión iniciada.
- Orden de detección automática: navegador predeterminado del sistema si está basado en Chromium; en caso contrario Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` usa Chrome DevTools MCP en lugar de CDP sin formato. No configure `cdpUrl` para ese driver.
- Configure `browser.profiles.<name>.userDataDir` cuando un perfil existing-session deba conectarse a un perfil de usuario de Chromium no predeterminado (Brave, Edge, etc.).

</Accordion>

</AccordionGroup>

## Use Brave (u otro navegador basado en Chromium)

Si su navegador **predeterminado del sistema** está basado en Chromium (Chrome/Brave/Edge/etc.),
OpenClaw lo usa automáticamente. Configure `browser.executablePath` para reemplazar
la detección automática:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

O configúrelo en la configuración, por plataforma:

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

## Control local frente a remoto

- **Control local (predeterminado):** Gateway inicia el servicio de control loopback y puede lanzar un navegador local.
- **Control remoto (host de Node):** ejecute un host de Node en el equipo que tenga el navegador; Gateway redirige las acciones del navegador hacia él.
- **CDP remoto:** configure `browser.profiles.<name>.cdpUrl` (o `browser.cdpUrl`) para
  conectarse a un navegador remoto basado en Chromium. En este caso, OpenClaw no lanzará un navegador local.

El comportamiento de detención difiere según el modo de perfil:

- perfiles administrados locales: `openclaw browser stop` detiene el proceso del navegador que
  OpenClaw lanzó
- perfiles solo de conexión y perfiles CDP remotos: `openclaw browser stop` cierra la sesión de
  control activa y libera los reemplazos de emulación de Playwright/CDP (viewport,
  combinación de colores, configuración regional, zona horaria, modo sin conexión y estados similares), aunque OpenClaw no haya lanzado ningún proceso de navegador

Las URL de CDP remoto pueden incluir autenticación:

- Tokens de consulta (por ejemplo, `https://provider.example?token=<token>`)
- Autenticación HTTP Basic (por ejemplo, `https://user:pass@provider.example`)

OpenClaw conserva la autenticación al llamar a los endpoints `/json/*` y al conectarse
al WebSocket de CDP. Prefiera variables de entorno o administradores de secretos para
los tokens en lugar de confirmarlos en archivos de configuración.

## Proxy de navegador de Node (predeterminado sin configuración)

Si ejecuta un **host de Node** en el equipo que tiene su navegador, OpenClaw puede
redirigir automáticamente las llamadas de herramientas del navegador a ese Node sin configuración adicional del navegador.
Esta es la ruta predeterminada para gateways remotos.

Notas:

- El host de Node expone su servidor local de control del navegador mediante un **comando proxy**.
- Los perfiles provienen de la propia configuración `browser.profiles` del Node (igual que en local).
- `nodeHost.browserProxy.allowProfiles` es opcional. Déjelo vacío para el comportamiento heredado/predeterminado: todos los perfiles configurados seguirán siendo accesibles a través del proxy, incluidas las rutas de crear/eliminar perfiles.
- Si configura `nodeHost.browserProxy.allowProfiles`, OpenClaw lo trata como un límite de privilegio mínimo: solo se pueden seleccionar perfiles de la lista de permitidos y las rutas persistentes de crear/eliminar perfiles se bloquean en la superficie del proxy.
- Desactívelo si no lo desea:
  - En el Node: `nodeHost.browserProxy.enabled=false`
  - En Gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP remoto alojado)

[Browserless](https://browserless.io) es un servicio alojado de Chromium que expone
URL de conexión CDP mediante HTTPS y WebSocket. OpenClaw puede usar cualquiera de las dos formas, pero
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

- Reemplace `<BROWSERLESS_API_KEY>` por su token real de Browserless.
- Elija el endpoint regional que coincida con su cuenta de Browserless (consulte su documentación).
- Si Browserless le proporciona una URL base HTTPS, puede convertirla a
  `wss://` para una conexión CDP directa o mantener la URL HTTPS y dejar que OpenClaw
  descubra `/json/version`.

## Proveedores CDP WebSocket directos

Algunos servicios de navegador alojados exponen un endpoint **WebSocket directo** en lugar del
descubrimiento CDP estándar basado en HTTP (`/json/version`). OpenClaw acepta tres
formas de URL CDP y elige automáticamente la estrategia de conexión correcta:

- **Descubrimiento HTTP(S)** — `http://host[:port]` o `https://host[:port]`.
  OpenClaw llama a `/json/version` para descubrir la URL del depurador WebSocket y luego
  se conecta. Sin alternativa WebSocket.
- **Endpoints WebSocket directos** — `ws://host[:port]/devtools/<kind>/<id>` o
  `wss://...` con una ruta `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw se conecta directamente mediante un protocolo de enlace WebSocket y omite
  por completo `/json/version`.
- **Raíces WebSocket sin ruta** — `ws://host[:port]` o `wss://host[:port]` sin
  ruta `/devtools/...` (por ejemplo [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw intenta primero el
  descubrimiento HTTP `/json/version` (normalizando el esquema a `http`/`https`);
  si el descubrimiento devuelve un `webSocketDebuggerUrl`, se usa; en caso contrario, OpenClaw
  recurre a un protocolo de enlace WebSocket directo en la raíz sin ruta. Esto permite que un
  `ws://` sin ruta que apunte a un Chrome local siga conectándose, ya que Chrome solo
  acepta actualizaciones WebSocket en la ruta específica por destino de
  `/json/version`.

### Browserbase

[Browserbase](https://www.browserbase.com) es una plataforma en la nube para ejecutar
navegadores sin interfaz con resolución integrada de CAPTCHA, modo sigiloso y
proxies residenciales.

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

- [Regístrese](https://www.browserbase.com/sign-up) y copie su **API Key**
  desde el [panel Overview](https://www.browserbase.com/overview).
- Reemplace `<BROWSERBASE_API_KEY>` por su clave API real de Browserbase.
- Browserbase crea automáticamente una sesión del navegador al conectarse por WebSocket, por lo que no
  se necesita un paso manual de creación de sesión.
- El nivel gratuito permite una sesión concurrente y una hora de navegador al mes.
  Consulte [pricing](https://www.browserbase.com/pricing) para los límites de los planes de pago.
- Consulte la [documentación de Browserbase](https://docs.browserbase.com) para obtener la
  referencia completa de la API, guías de SDK y ejemplos de integración.

## Seguridad

Ideas clave:

- El control del navegador es solo loopback; el acceso fluye a través de la autenticación de Gateway o del emparejamiento de Nodes.
- La API HTTP independiente del navegador en loopback usa **solo autenticación con secreto compartido**:
  autenticación bearer con token de gateway, `x-openclaw-password` o autenticación HTTP Basic con la
  contraseña configurada del gateway.
- Los encabezados de identidad de Tailscale Serve y `gateway.auth.mode: "trusted-proxy"` **no**
  autentican esta API independiente del navegador en loopback.
- Si el control del navegador está habilitado y no hay autenticación con secreto compartido configurada, OpenClaw
  genera automáticamente `gateway.auth.token` al iniciar y lo conserva en la configuración.
- OpenClaw **no** genera automáticamente ese token cuando `gateway.auth.mode` ya es
  `password`, `none` o `trusted-proxy`.
- Mantenga Gateway y cualquier host de Node en una red privada (Tailscale); evite la exposición pública.
- Trate las URL/tokens CDP remotos como secretos; prefiera variables de entorno o un gestor de secretos.

Consejos para CDP remoto:

- Prefiera endpoints cifrados (HTTPS o WSS) y tokens de corta duración cuando sea posible.
- Evite incrustar tokens de larga duración directamente en archivos de configuración.

## Perfiles (multinavegador)

OpenClaw admite varios perfiles con nombre (configuraciones de enrutamiento). Los perfiles pueden ser:

- **administrados por OpenClaw**: una instancia dedicada de navegador basado en Chromium con su propio directorio de datos de usuario + puerto CDP
- **remoto**: una URL CDP explícita (navegador basado en Chromium que se ejecuta en otro lugar)
- **sesión existente**: su perfil actual de Chrome mediante conexión automática de Chrome DevTools MCP

Valores predeterminados:

- El perfil `openclaw` se crea automáticamente si falta.
- El perfil `user` está integrado para conexión de sesión existente de Chrome MCP.
- Los perfiles de sesión existente son de participación voluntaria más allá de `user`; créelos con `--driver existing-session`.
- Los puertos CDP locales se asignan a partir de **18800–18899** de forma predeterminada.
- Eliminar un perfil mueve su directorio local de datos a la Papelera.

Todos los endpoints de control aceptan `?profile=<name>`; la CLI usa `--browser-profile`.

## Sesión existente mediante Chrome DevTools MCP

OpenClaw también puede conectarse a un perfil de navegador basado en Chromium ya en ejecución mediante el
servidor oficial Chrome DevTools MCP. Esto reutiliza las pestañas y el estado de inicio de sesión
ya abiertos en ese perfil del navegador.

Referencias oficiales de contexto y configuración:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Perfil integrado:

- `user`

Opcional: cree su propio perfil personalizado de sesión existente si desea un
nombre, color o directorio de datos del navegador distintos.

Comportamiento predeterminado:

- El perfil integrado `user` usa conexión automática de Chrome MCP, que apunta al
  perfil local predeterminado de Google Chrome.

Use `userDataDir` para Brave, Edge, Chromium o un perfil de Chrome no predeterminado:

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

1. Abra la página de inspección de ese navegador para depuración remota.
2. Habilite la depuración remota.
3. Mantenga el navegador en ejecución y apruebe la solicitud de conexión cuando OpenClaw se conecte.

Páginas comunes de inspección:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Prueba de humo de conexión en vivo:

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
- `tabs` enumera las pestañas del navegador que ya tiene abiertas
- `snapshot` devuelve refs de la pestaña en vivo seleccionada

Qué comprobar si la conexión no funciona:

- que el navegador basado en Chromium de destino sea versión `144+`
- que la depuración remota esté habilitada en la página de inspección de ese navegador
- que el navegador haya mostrado la solicitud de consentimiento de conexión y usted la haya aceptado
- `openclaw doctor` migra la configuración antigua del navegador basada en extensiones y comprueba que
  Chrome esté instalado localmente para perfiles predeterminados de conexión automática, pero no puede
  habilitar por usted la depuración remota del lado del navegador

Uso por parte del agente:

- Use `profile="user"` cuando necesite el estado del navegador del usuario con sesión iniciada.
- Si usa un perfil personalizado de sesión existente, pase ese nombre de perfil explícito.
- Elija este modo solo cuando el usuario esté en el equipo para aprobar la solicitud
  de conexión.
- Gateway o el host de Node pueden generar `npx chrome-devtools-mcp@latest --autoConnect`

Notas:

- Esta ruta tiene más riesgo que el perfil aislado `openclaw` porque puede
  actuar dentro de la sesión de navegador con la que ha iniciado sesión.
- OpenClaw no inicia el navegador para este driver; solo se conecta.
- OpenClaw usa aquí el flujo oficial `--autoConnect` de Chrome DevTools MCP. Si
  `userDataDir` está configurado, se pasa para apuntar a ese directorio de datos de usuario.
- La sesión existente puede conectarse en el host seleccionado o a través de un
  Node de navegador conectado. Si Chrome reside en otro lugar y no hay ningún Node de navegador conectado, use
  CDP remoto o un host de Node en su lugar.

<Accordion title="Limitaciones de la función de sesión existente">

En comparación con el perfil administrado `openclaw`, los drivers de sesión existente tienen más limitaciones:

- **Capturas de pantalla** — las capturas de página y las capturas de elementos con `--ref` funcionan; los selectores CSS `--element` no. `--full-page` no puede combinarse con `--ref` ni con `--element`. Playwright no es necesario para capturas de pantalla de página o de elementos basadas en ref.
- **Acciones** — `click`, `type`, `hover`, `scrollIntoView`, `drag` y `select` requieren refs de snapshot (sin selectores CSS). `click` es solo con el botón izquierdo. `type` no admite `slowly=true`; use `fill` o `press`. `press` no admite `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` y `evaluate` no admiten tiempos de espera por llamada. `select` acepta un solo valor.
- **Wait / upload / dialog** — `wait --url` admite patrones exactos, de subcadena y glob; `wait --load networkidle` no es compatible. Los hooks de carga requieren `ref` o `inputRef`, un archivo a la vez, sin CSS `element`. Los hooks de diálogo no admiten reemplazos de tiempo de espera.
- **Funciones solo administradas** — acciones por lotes, exportación a PDF, interceptación de descargas y `responsebody` siguen requiriendo la ruta del navegador administrado.

</Accordion>

## Garantías de aislamiento

- **Directorio de datos de usuario dedicado**: nunca toca su perfil personal del navegador.
- **Puertos dedicados**: evita `9222` para prevenir colisiones con flujos de trabajo de desarrollo.
- **Control determinista de pestañas**: apunta a las pestañas por `targetId`, no a la “última pestaña”.

## Selección del navegador

Al iniciarse localmente, OpenClaw elige el primero disponible:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Puede reemplazar esto con `browser.executablePath`.

Plataformas:

- macOS: comprueba `/Applications` y `~/Applications`.
- Linux: busca `google-chrome`, `brave`, `microsoft-edge`, `chromium`, etc.
- Windows: comprueba ubicaciones de instalación comunes.

## API de control (opcional)

Para secuencias de comandos y depuración, Gateway expone una pequeña **API HTTP
de control solo loopback** más una CLI correspondiente `openclaw browser` (snapshots, refs, mejoras de
wait, salida JSON, flujos de trabajo de depuración). Consulte
[API de control del navegador](/es/tools/browser-control) para la referencia completa.

## Solución de problemas

Para problemas específicos de Linux (especialmente snap Chromium), consulte
[Solución de problemas del navegador](/es/tools/browser-linux-troubleshooting).

Para configuraciones de host dividido WSL2 Gateway + Windows Chrome, consulte
[Solución de problemas de WSL2 + Windows + CDP remoto de Chrome](/es/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Fallo de inicio de CDP frente a bloqueo SSRF de navegación

Son clases de fallos diferentes y apuntan a rutas de código distintas.

- **Fallo de inicio o preparación de CDP** significa que OpenClaw no puede confirmar que el plano de control del navegador está en buen estado.
- **Bloqueo SSRF de navegación** significa que el plano de control del navegador está en buen estado, pero un destino de navegación de página es rechazado por la política.

Ejemplos comunes:

- Fallo de inicio o preparación de CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Bloqueo SSRF de navegación:
  - los flujos `open`, `navigate`, snapshot o de apertura de pestañas fallan con un error de política de navegador/red mientras que `start` y `tabs` siguen funcionando

Use esta secuencia mínima para separar ambos casos:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Cómo interpretar los resultados:

- Si `start` falla con `not reachable after start`, primero resuelva la preparación de CDP.
- Si `start` funciona pero `tabs` falla, el plano de control sigue sin estar en buen estado. Trátelo como un problema de accesibilidad de CDP, no de navegación de páginas.
- Si `start` y `tabs` funcionan pero `open` o `navigate` fallan, el plano de control del navegador está activo y el fallo está en la política de navegación o en la página de destino.
- Si `start`, `tabs` y `open` funcionan, la ruta básica de control del navegador administrado está en buen estado.

Detalles importantes del comportamiento:

- La configuración del navegador usa por defecto un objeto de política SSRF de cierre por fallo incluso cuando no configura `browser.ssrfPolicy`.
- Para el perfil administrado local `openclaw` en loopback, las comprobaciones de estado de CDP omiten intencionadamente la aplicación de accesibilidad SSRF del navegador para el propio plano de control local de OpenClaw.
- La protección de navegación es independiente. Un resultado correcto de `start` o `tabs` no significa que un destino posterior de `open` o `navigate` esté permitido.

Guía de seguridad:

- **No** relaje la política SSRF del navegador de forma predeterminada.
- Prefiera excepciones limitadas de host como `hostnameAllowlist` o `allowedHostnames` en lugar de un acceso amplio a redes privadas.
- Use `dangerouslyAllowPrivateNetwork: true` solo en entornos intencionadamente confiables donde el acceso del navegador a redes privadas sea necesario y esté revisado.

## Herramientas del agente + cómo funciona el control

El agente obtiene **una herramienta** para automatización del navegador:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Cómo se relaciona:

- `browser snapshot` devuelve un árbol de interfaz estable (AI o ARIA).
- `browser act` usa los id `ref` del snapshot para hacer clic/escribir/arrastrar/seleccionar.
- `browser screenshot` captura píxeles (página completa o elemento).
- `browser` acepta:
  - `profile` para elegir un perfil de navegador con nombre (openclaw, chrome o CDP remoto).
  - `target` (`sandbox` | `host` | `node`) para seleccionar dónde reside el navegador.
  - En sesiones aisladas, `target: "host"` requiere `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Si se omite `target`: las sesiones aisladas usan `sandbox` de forma predeterminada y las sesiones no aisladas usan `host`.
  - Si hay un Node con capacidad de navegador conectado, la herramienta puede redirigirse automáticamente a él a menos que fije `target="host"` o `target="node"`.

Esto mantiene al agente determinista y evita selectores frágiles.

## Relacionado

- [Descripción general de herramientas](/es/tools) — todas las herramientas de agente disponibles
- [Sandboxing](/es/gateway/sandboxing) — control del navegador en entornos aislados
- [Seguridad](/es/gateway/security) — riesgos y refuerzo del control del navegador
