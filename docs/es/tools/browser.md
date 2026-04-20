---
read_when:
    - Agregar automatización del navegador controlada por el agente
    - Depurar por qué openclaw está interfiriendo con tu propio Chrome
    - Implementar la configuración y el ciclo de vida del navegador en la app de macOS
summary: Servicio integrado de control del navegador + comandos de acción
title: Navegador (administrado por OpenClaw)
x-i18n:
    generated_at: "2026-04-20T05:21:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f7d37b34ba48dc7c38f8c2e77f8bb97af987eac6a874ebfc921f950fb59de4b
    source_path: tools/browser.md
    workflow: 15
---

# Navegador (administrado por openclaw)

OpenClaw puede ejecutar un **perfil dedicado de Chrome/Brave/Edge/Chromium** que el agente controla.
Está aislado de tu navegador personal y se administra mediante un pequeño servicio local
de control dentro de Gateway (solo loopback).

Vista para principiantes:

- Piensa en esto como un **navegador separado, solo para el agente**.
- El perfil `openclaw` **no** toca el perfil de tu navegador personal.
- El agente puede **abrir pestañas, leer páginas, hacer clic y escribir** en un entorno seguro.
- El perfil integrado `user` se conecta a tu sesión real de Chrome con inicio de sesión mediante Chrome MCP.

## Qué obtienes

- Un perfil de navegador separado llamado **openclaw** (acento naranja de forma predeterminada).
- Control determinista de pestañas (listar/abrir/enfocar/cerrar).
- Acciones del agente (clic/escribir/arrastrar/seleccionar), snapshots, capturas de pantalla, PDF.
- Compatibilidad opcional con varios perfiles (`openclaw`, `work`, `remote`, ...).

Este navegador **no** es tu navegador principal del día a día. Es una superficie
segura y aislada para la automatización y verificación por parte del agente.

## Inicio rápido

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Si ves “Browser disabled”, actívalo en la configuración (consulta abajo) y reinicia
Gateway.

Si `openclaw browser` no aparece en absoluto, o el agente dice que la herramienta de navegador
no está disponible, ve a [Falta el comando o la herramienta del navegador](/es/tools/browser#missing-browser-command-or-tool).

## Control del Plugin

La herramienta `browser` predeterminada ahora es un Plugin incluido que se envía activado
de forma predeterminada. Eso significa que puedes desactivarlo o reemplazarlo sin quitar el resto del
sistema de plugins de OpenClaw:

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

Desactiva el Plugin incluido antes de instalar otro plugin que proporcione el
mismo nombre de herramienta `browser`. La experiencia predeterminada del navegador necesita ambos:

- `plugins.entries.browser.enabled` no desactivado
- `browser.enabled=true`

Si desactivas solo el plugin, la CLI de navegador incluida (`openclaw browser`),
el método de gateway (`browser.request`), la herramienta del agente y el servicio predeterminado de control del navegador
desaparecen juntos. Tu configuración `browser.*` permanece intacta para que un
plugin de reemplazo la reutilice.

El Plugin de navegador incluido ahora también es propietario de la implementación del runtime del navegador.
El núcleo conserva solo helpers compartidos del Plugin SDK, además de reexportaciones de compatibilidad para
rutas de importación internas más antiguas. En la práctica, quitar o reemplazar el paquete del plugin del navegador
elimina el conjunto de funciones del navegador en lugar de dejar detrás un segundo runtime
propiedad del núcleo.

Los cambios en la configuración del navegador siguen requiriendo reiniciar Gateway para que el Plugin incluido
pueda volver a registrar su servicio de navegador con la nueva configuración.

## Falta el comando o la herramienta del navegador

Si `openclaw browser` de repente pasa a ser un comando desconocido después de una actualización, o
el agente informa de que falta la herramienta del navegador, la causa más común es una lista restrictiva
`plugins.allow` que no incluye `browser`.

Ejemplo de configuración rota:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

Corrígelo agregando `browser` a la lista de plugins permitidos:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Notas importantes:

- `browser.enabled=true` no es suficiente por sí solo cuando `plugins.allow` está configurado.
- `plugins.entries.browser.enabled=true` tampoco es suficiente por sí solo cuando `plugins.allow` está configurado.
- `tools.alsoAllow: ["browser"]` **no** carga el Plugin de navegador incluido. Solo ajusta la política de herramientas después de que el plugin ya se haya cargado.
- Si no necesitas una lista restrictiva de plugins permitidos, quitar `plugins.allow` también restaura el comportamiento predeterminado del navegador incluido.

Síntomas típicos:

- `openclaw browser` es un comando desconocido.
- falta `browser.request`.
- El agente informa que la herramienta del navegador no está disponible o falta.

## Perfiles: `openclaw` frente a `user`

- `openclaw`: navegador administrado y aislado (no requiere extensión).
- `user`: perfil integrado de conexión de Chrome MCP para tu sesión **real de Chrome con inicio de sesión**.

Para las llamadas de la herramienta de navegador del agente:

- Predeterminado: usa el navegador aislado `openclaw`.
- Prefiere `profile="user"` cuando importen las sesiones existentes con inicio de sesión y el usuario
  esté en la computadora para hacer clic o aprobar cualquier aviso de conexión.
- `profile` es la anulación explícita cuando quieres un modo de navegador específico.

Configura `browser.defaultProfile: "openclaw"` si quieres el modo administrado de forma predeterminada.

## Configuración

La configuración del navegador se encuentra en `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    remoteCdpTimeoutMs: 1500, // remote CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // remote CDP WebSocket handshake timeout (ms)
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

Notas:

- El servicio de control del navegador se enlaza a loopback en un puerto derivado de `gateway.port`
  (predeterminado: `18791`, que es gateway + 2).
- Si sobrescribes el puerto de Gateway (`gateway.port` o `OPENCLAW_GATEWAY_PORT`),
  los puertos derivados del navegador cambian para permanecer en la misma “familia”.
- `cdpUrl` usa de forma predeterminada el puerto CDP local administrado cuando no está configurado.
- `remoteCdpTimeoutMs` se aplica a las comprobaciones de accesibilidad de CDP remoto (no loopback).
- `remoteCdpHandshakeTimeoutMs` se aplica a las comprobaciones de accesibilidad del handshake WebSocket de CDP remoto.
- La navegación del navegador y la apertura de pestañas están protegidas contra SSRF antes de la navegación y se vuelven a comprobar en la medida de lo posible en la URL final `http(s)` después de la navegación.
- En el modo SSRF estricto, la detección y las sondas del endpoint CDP remoto (`cdpUrl`, incluidas las búsquedas de `/json/version`) también se comprueban.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` está desactivado de forma predeterminada. Establécelo en `true` solo cuando confíes intencionalmente en el acceso del navegador a la red privada.
- `browser.ssrfPolicy.allowPrivateNetwork` sigue siendo compatible como alias heredado por compatibilidad.
- `attachOnly: true` significa “nunca iniciar un navegador local; solo conectarse si ya está en ejecución”.
- `color` + el `color` por perfil tiñen la IU del navegador para que puedas ver qué perfil está activo.
- El perfil predeterminado es `openclaw` (navegador independiente administrado por OpenClaw). Usa `defaultProfile: "user"` para optar por el navegador del usuario con inicio de sesión.
- Orden de detección automática: navegador predeterminado del sistema si está basado en Chromium; en caso contrario Chrome → Brave → Edge → Chromium → Chrome Canary.
- Los perfiles `openclaw` locales asignan `cdpPort`/`cdpUrl` automáticamente; configúralos solo para CDP remoto.
- `driver: "existing-session"` usa Chrome DevTools MCP en lugar de CDP sin formato. No
  configures `cdpUrl` para ese driver.
- Configura `browser.profiles.<name>.userDataDir` cuando un perfil existing-session
  deba conectarse a un perfil de usuario Chromium no predeterminado, como Brave o Edge.

## Usar Brave (u otro navegador basado en Chromium)

Si tu navegador **predeterminado del sistema** está basado en Chromium (Chrome/Brave/Edge/etc.),
OpenClaw lo usa automáticamente. Configura `browser.executablePath` para sobrescribir
la detección automática:

Ejemplo de CLI:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

```json5
// macOS
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
  }
}

// Windows
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  }
}

// Linux
{
  browser: {
    executablePath: "/usr/bin/brave-browser"
  }
}
```

## Control local frente a remoto

- **Control local (predeterminado):** Gateway inicia el servicio de control en loopback y puede iniciar un navegador local.
- **Control remoto (host de Node):** ejecuta un host de Node en la máquina que tiene el navegador; Gateway envía mediante proxy las acciones del navegador hacia él.
- **CDP remoto:** configura `browser.profiles.<name>.cdpUrl` (o `browser.cdpUrl`) para
  conectarte a un navegador remoto basado en Chromium. En este caso, OpenClaw no iniciará un navegador local.

El comportamiento al detenerse difiere según el modo del perfil:

- perfiles locales administrados: `openclaw browser stop` detiene el proceso del navegador que
  OpenClaw inició
- perfiles solo de conexión y perfiles CDP remotos: `openclaw browser stop` cierra la sesión de
  control activa y libera las anulaciones de emulación de Playwright/CDP (viewport,
  combinación de colores, configuración regional, zona horaria, modo sin conexión y estados similares), aunque
  OpenClaw no haya iniciado ningún proceso de navegador

Las URL de CDP remoto pueden incluir autenticación:

- Tokens de consulta (por ejemplo, `https://provider.example?token=<token>`)
- Autenticación HTTP Basic (por ejemplo, `https://user:pass@provider.example`)

OpenClaw conserva la autenticación al llamar a los endpoints `/json/*` y al conectarse
al WebSocket de CDP. Prefiere variables de entorno o gestores de secretos para los
tokens en lugar de confirmarlos en archivos de configuración.

## Proxy de navegador de Node (predeterminado sin configuración)

Si ejecutas un **host de Node** en la máquina que tiene tu navegador, OpenClaw puede
enrutar automáticamente las llamadas a la herramienta del navegador a ese Node sin ninguna configuración adicional del navegador.
Esta es la ruta predeterminada para gateways remotos.

Notas:

- El host de Node expone su servidor local de control del navegador mediante un **comando proxy**.
- Los perfiles provienen de la propia configuración `browser.profiles` del nodo (igual que en local).
- `nodeHost.browserProxy.allowProfiles` es opcional. Déjalo vacío para el comportamiento heredado/predeterminado: todos los perfiles configurados siguen siendo accesibles a través del proxy, incluidas las rutas de creación/eliminación de perfiles.
- Si configuras `nodeHost.browserProxy.allowProfiles`, OpenClaw lo trata como un límite de privilegio mínimo: solo se pueden usar los perfiles permitidos, y las rutas persistentes de creación/eliminación de perfiles se bloquean en la superficie del proxy.
- Desactívalo si no lo quieres:
  - En el nodo: `nodeHost.browserProxy.enabled=false`
  - En el gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP remoto alojado)

[Browserless](https://browserless.io) es un servicio alojado de Chromium que expone
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

- Reemplaza `<BROWSERLESS_API_KEY>` por tu token real de Browserless.
- Elige el endpoint de región que coincida con tu cuenta de Browserless (consulta su documentación).
- Si Browserless te da una URL base HTTPS, puedes convertirla a
  `wss://` para una conexión CDP directa o conservar la URL HTTPS y dejar que OpenClaw
  descubra `/json/version`.

## Proveedores CDP directos por WebSocket

Algunos servicios de navegador alojados exponen un endpoint **WebSocket directo** en lugar de
la detección CDP estándar basada en HTTP (`/json/version`). OpenClaw acepta tres
formatos de URL CDP y elige automáticamente la estrategia de conexión correcta:

- **Detección HTTP(S)** — `http://host[:port]` o `https://host[:port]`.
  OpenClaw llama a `/json/version` para descubrir la URL del depurador WebSocket y luego
  se conecta. Sin fallback a WebSocket.
- **Endpoints WebSocket directos** — `ws://host[:port]/devtools/<kind>/<id>` o
  `wss://...` con una ruta `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw se conecta directamente mediante un handshake WebSocket y omite
  por completo `/json/version`.
- **Raíces WebSocket simples** — `ws://host[:port]` o `wss://host[:port]` sin
  una ruta `/devtools/...` (por ejemplo, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw intenta primero la detección HTTP
  de `/json/version` (normalizando el esquema a `http`/`https`);
  si la detección devuelve un `webSocketDebuggerUrl`, se usa; en caso contrario, OpenClaw
  recurre a un handshake WebSocket directo en la raíz simple. Esto cubre
  tanto puertos de depuración remota de estilo Chrome como proveedores solo WebSocket.

`ws://host:port` / `wss://host:port` simples sin una ruta `/devtools/...`
apuntando a una instancia local de Chrome son compatibles mediante el fallback
que intenta primero la detección: Chrome solo acepta actualizaciones WebSocket en la ruta específica por navegador
o por destino devuelta por `/json/version`, por lo que un handshake solo en la raíz
fallaría.

### Browserbase

[Browserbase](https://www.browserbase.com) es una plataforma en la nube para ejecutar
navegadores sin interfaz con resolución de CAPTCHA integrada, modo sigiloso y proxies
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
- Reemplaza `<BROWSERBASE_API_KEY>` por tu clave de API real de Browserbase.
- Browserbase crea automáticamente una sesión de navegador al conectarse por WebSocket, así que no
  hace falta ningún paso manual de creación de sesión.
- El nivel gratuito permite una sesión concurrente y una hora de navegador al mes.
  Consulta los [precios](https://www.browserbase.com/pricing) para conocer los límites de los planes de pago.
- Consulta la [documentación de Browserbase](https://docs.browserbase.com) para ver la referencia completa de la API,
  guías del SDK y ejemplos de integración.

## Seguridad

Ideas clave:

- El control del navegador es solo loopback; el acceso fluye a través de la autenticación de Gateway o del emparejamiento de nodos.
- La API HTTP independiente del navegador en loopback usa **solo autenticación con secreto compartido**:
  auth bearer con el token de gateway, `x-openclaw-password` o autenticación HTTP Basic con la
  contraseña configurada del gateway.
- Los encabezados de identidad de Tailscale Serve y `gateway.auth.mode: "trusted-proxy"` **no**
  autentican esta API HTTP independiente del navegador en loopback.
- Si el control del navegador está activado y no se configura ninguna autenticación con secreto compartido, OpenClaw
  genera automáticamente `gateway.auth.token` al iniciar y lo persiste en la configuración.
- OpenClaw **no** genera automáticamente ese token cuando `gateway.auth.mode` ya es
  `password`, `none` o `trusted-proxy`.
- Mantén Gateway y cualquier host de nodo en una red privada (Tailscale); evita la exposición pública.
- Trata las URL y los tokens de CDP remoto como secretos; prefiere variables de entorno o un gestor de secretos.

Consejos para CDP remoto:

- Prefiere endpoints cifrados (HTTPS o WSS) y tokens de corta duración cuando sea posible.
- Evita incrustar tokens de larga duración directamente en archivos de configuración.

## Perfiles (varios navegadores)

OpenClaw admite varios perfiles con nombre (configuraciones de enrutamiento). Los perfiles pueden ser:

- **administrados por openclaw**: una instancia dedicada de navegador basado en Chromium con su propio directorio de datos de usuario + puerto CDP
- **remoto**: una URL CDP explícita (navegador basado en Chromium ejecutándose en otro lugar)
- **sesión existente**: tu perfil de Chrome existente mediante conexión automática de Chrome DevTools MCP

Valores predeterminados:

- El perfil `openclaw` se crea automáticamente si falta.
- El perfil `user` está integrado para la conexión de sesión existente de Chrome MCP.
- Los perfiles de sesión existente son opcionales además de `user`; créalos con `--driver existing-session`.
- Los puertos CDP locales se asignan del rango **18800–18899** de forma predeterminada.
- Al eliminar un perfil, su directorio de datos local se mueve a la papelera.

Todos los endpoints de control aceptan `?profile=<name>`; la CLI usa `--browser-profile`.

## Sesión existente mediante Chrome DevTools MCP

OpenClaw también puede conectarse a un perfil de navegador basado en Chromium en ejecución a través del
servidor oficial Chrome DevTools MCP. Esto reutiliza las pestañas y el estado de inicio de sesión
ya abiertos en ese perfil del navegador.

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

1. Abre la página de inspección de ese navegador para la depuración remota.
2. Activa la depuración remota.
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

Cómo se ve un resultado correcto:

- `status` muestra `driver: existing-session`
- `status` muestra `transport: chrome-mcp`
- `status` muestra `running: true`
- `tabs` enumera las pestañas del navegador que ya tienes abiertas
- `snapshot` devuelve refs de la pestaña activa seleccionada

Qué comprobar si la conexión no funciona:

- el navegador basado en Chromium de destino es la versión `144+`
- la depuración remota está activada en la página de inspección de ese navegador
- el navegador mostró el aviso de consentimiento de conexión y lo aceptaste
- `openclaw doctor` migra la configuración antigua del navegador basada en extensiones y comprueba que
  Chrome esté instalado localmente para los perfiles predeterminados con conexión automática, pero no puede
  activar por ti la depuración remota del lado del navegador

Uso por parte del agente:

- Usa `profile="user"` cuando necesites el estado del navegador del usuario con sesión iniciada.
- Si usas un perfil personalizado de sesión existente, pasa ese nombre de perfil explícito.
- Elige este modo solo cuando el usuario esté en la computadora para aprobar el
  aviso de conexión.
- Gateway o el host del nodo pueden ejecutar `npx chrome-devtools-mcp@latest --autoConnect`

Notas:

- Esta ruta es de mayor riesgo que el perfil aislado `openclaw` porque puede
  actuar dentro de tu sesión de navegador con inicio de sesión.
- OpenClaw no inicia el navegador para este driver; solo se conecta a una
  sesión existente.
- OpenClaw usa aquí el flujo oficial `--autoConnect` de Chrome DevTools MCP. Si
  `userDataDir` está configurado, OpenClaw lo transmite para apuntar a ese
  directorio de datos de usuario de Chromium explícito.
- Las capturas de pantalla de sesión existente admiten capturas de página y capturas de elementos
  con `--ref` desde snapshots, pero no selectores CSS `--element`.
- Las capturas de pantalla de páginas de sesión existente funcionan sin Playwright mediante Chrome MCP.
  Las capturas de elementos basadas en refs (`--ref`) también funcionan allí, pero `--full-page`
  no se puede combinar con `--ref` ni con `--element`.
- Las acciones de sesión existente siguen siendo más limitadas que la ruta del navegador
  administrado:
  - `click`, `type`, `hover`, `scrollIntoView`, `drag` y `select` requieren
    refs de snapshot en lugar de selectores CSS
  - `click` es solo con el botón izquierdo (sin sobrescrituras de botón ni modificadores)
  - `type` no admite `slowly=true`; usa `fill` o `press`
  - `press` no admite `delayMs`
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill` y `evaluate` no
    admiten sobrescrituras de timeout por llamada
  - `select` actualmente admite solo un único valor
- La sesión existente `wait --url` admite patrones exactos, de subcadena y glob
  como otros drivers de navegador. `wait --load networkidle` aún no es compatible.
- Los hooks de carga de sesión existente requieren `ref` o `inputRef`, admiten un archivo
  a la vez y no admiten direccionamiento CSS mediante `element`.
- Los hooks de diálogos de sesión existente no admiten sobrescrituras de timeout.
- Algunas funciones aún requieren la ruta del navegador administrado, incluidas acciones por lotes,
  exportación a PDF, interceptación de descargas y `responsebody`.
- La sesión existente puede conectarse en el host seleccionado o a través de un nodo de navegador conectado.
  Si Chrome está en otro lugar y no hay ningún nodo de navegador conectado, usa
  CDP remoto o un host de nodo en su lugar.

## Garantías de aislamiento

- **Directorio dedicado de datos de usuario**: nunca toca el perfil de tu navegador personal.
- **Puertos dedicados**: evita `9222` para prevenir colisiones con flujos de trabajo de desarrollo.
- **Control determinista de pestañas**: apunta a las pestañas por `targetId`, no por “última pestaña”.

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
- Linux: busca `google-chrome`, `brave`, `microsoft-edge`, `chromium`, etc.
- Windows: comprueba ubicaciones de instalación comunes.

## API de control (opcional)

Solo para integraciones locales, Gateway expone una pequeña API HTTP en loopback:

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

Todos los endpoints aceptan `?profile=<name>`.

Si la autenticación de gateway con secreto compartido está configurada, las rutas HTTP del navegador también requieren autenticación:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` o autenticación HTTP Basic con esa contraseña

Notas:

- Esta API independiente del navegador en loopback **no** consume encabezados de identidad de trusted-proxy ni de
  Tailscale Serve.
- Si `gateway.auth.mode` es `none` o `trusted-proxy`, estas rutas de navegador en loopback
  no heredan esos modos con identidad; mantenlas solo en loopback.

### Contrato de error de `/act`

`POST /act` usa una respuesta de error estructurada para fallos de validación y
de política a nivel de ruta:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valores actuales de `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): falta `kind` o no se reconoce.
- `ACT_INVALID_REQUEST` (HTTP 400): la carga útil de la acción falló en la normalización o validación.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): se usó `selector` con un tipo de acción no compatible.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (o `wait --fn`) está desactivado por configuración.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` de nivel superior o por lotes entra en conflicto con el destino de la solicitud.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): la acción no es compatible con perfiles de sesión existente.

Otros fallos de runtime aún pueden devolver `{ "error": "<message>" }` sin un
campo `code`.

### Requisito de Playwright

Algunas funciones (navigate/act/AI snapshot/role snapshot, capturas de pantalla de elementos,
PDF) requieren Playwright. Si Playwright no está instalado, esos endpoints devuelven
un error 501 claro.

Qué sigue funcionando sin Playwright:

- Snapshots ARIA
- Capturas de pantalla de página para el navegador administrado `openclaw` cuando haya un WebSocket
  CDP por pestaña disponible
- Capturas de pantalla de página para perfiles `existing-session` / Chrome MCP
- Capturas de pantalla basadas en refs de `existing-session` (`--ref`) a partir de la salida de snapshot

Qué sigue necesitando Playwright:

- `navigate`
- `act`
- AI snapshots / role snapshots
- Capturas de pantalla de elementos con selector CSS (`--element`)
- Exportación completa de PDF del navegador

Las capturas de pantalla de elementos también rechazan `--full-page`; la ruta devuelve `fullPage is
not supported for element screenshots`.

Si ves `Playwright is not available in this gateway build`, instala el paquete completo
de Playwright (no `playwright-core`) y reinicia el gateway, o reinstala
OpenClaw con compatibilidad para navegador.

#### Instalación de Playwright en Docker

Si tu Gateway se ejecuta en Docker, evita `npx playwright` (conflictos con npm override).
Usa la CLI incluida en su lugar:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Para conservar las descargas del navegador, configura `PLAYWRIGHT_BROWSERS_PATH` (por ejemplo,
`/home/node/.cache/ms-playwright`) y asegúrate de que `/home/node` se conserve mediante
`OPENCLAW_HOME_VOLUME` o un bind mount. Consulta [Docker](/es/install/docker).

## Cómo funciona (interno)

Flujo de alto nivel:

- Un pequeño **servidor de control** acepta solicitudes HTTP.
- Se conecta a navegadores basados en Chromium (Chrome/Brave/Edge/Chromium) mediante **CDP**.
- Para acciones avanzadas (click/type/snapshot/PDF), usa **Playwright** sobre
  CDP.
- Cuando falta Playwright, solo están disponibles las operaciones que no dependen de Playwright.

Este diseño mantiene al agente en una interfaz estable y determinista, al tiempo que te permite
intercambiar navegadores y perfiles locales o remotos.

## Referencia rápida de la CLI

Todos los comandos aceptan `--browser-profile <name>` para dirigirse a un perfil específico.
Todos los comandos también aceptan `--json` para salida legible por máquina (cargas útiles estables).

Básicos:

- `openclaw browser status`
- `openclaw browser start`
- `openclaw browser stop`
- `openclaw browser tabs`
- `openclaw browser tab`
- `openclaw browser tab new`
- `openclaw browser tab select 2`
- `openclaw browser tab close 2`
- `openclaw browser open https://example.com`
- `openclaw browser focus abcd1234`
- `openclaw browser close abcd1234`

Inspección:

- `openclaw browser screenshot`
- `openclaw browser screenshot --full-page`
- `openclaw browser screenshot --ref 12`
- `openclaw browser screenshot --ref e12`
- `openclaw browser snapshot`
- `openclaw browser snapshot --format aria --limit 200`
- `openclaw browser snapshot --interactive --compact --depth 6`
- `openclaw browser snapshot --efficient`
- `openclaw browser snapshot --labels`
- `openclaw browser snapshot --selector "#main" --interactive`
- `openclaw browser snapshot --frame "iframe#main" --interactive`
- `openclaw browser console --level error`

Nota sobre el ciclo de vida:

- Para perfiles solo de conexión y de CDP remoto, `openclaw browser stop` sigue siendo el
  comando correcto de limpieza después de las pruebas. Cierra la sesión de control activa y
  borra las anulaciones temporales de emulación en lugar de finalizar el navegador
  subyacente.
- `openclaw browser errors --clear`
- `openclaw browser requests --filter api --clear`
- `openclaw browser pdf`
- `openclaw browser responsebody "**/api" --max-chars 5000`

Acciones:

- `openclaw browser navigate https://example.com`
- `openclaw browser resize 1280 720`
- `openclaw browser click 12 --double`
- `openclaw browser click e12 --double`
- `openclaw browser type 23 "hello" --submit`
- `openclaw browser press Enter`
- `openclaw browser hover 44`
- `openclaw browser scrollintoview e12`
- `openclaw browser drag 10 11`
- `openclaw browser select 9 OptionA OptionB`
- `openclaw browser download e12 report.pdf`
- `openclaw browser waitfordownload report.pdf`
- `openclaw browser upload /tmp/openclaw/uploads/file.pdf`
- `openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'`
- `openclaw browser dialog --accept`
- `openclaw browser wait --text "Done"`
- `openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"`
- `openclaw browser evaluate --fn '(el) => el.textContent' --ref 7`
- `openclaw browser highlight e12`
- `openclaw browser trace start`
- `openclaw browser trace stop`

Estado:

- `openclaw browser cookies`
- `openclaw browser cookies set session abc123 --url "https://example.com"`
- `openclaw browser cookies clear`
- `openclaw browser storage local get`
- `openclaw browser storage local set theme dark`
- `openclaw browser storage session clear`
- `openclaw browser set offline on`
- `openclaw browser set headers --headers-json '{"X-Debug":"1"}'`
- `openclaw browser set credentials user pass`
- `openclaw browser set credentials --clear`
- `openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"`
- `openclaw browser set geo --clear`
- `openclaw browser set media dark`
- `openclaw browser set timezone America/New_York`
- `openclaw browser set locale en-US`
- `openclaw browser set device "iPhone 14"`

Notas:

- `upload` y `dialog` son llamadas de **preparación**; ejecútalas antes del click/press
  que activa el selector de archivos o el diálogo.
- Las rutas de salida de descargas y trazas están restringidas a raíces temporales de OpenClaw:
  - trazas: `/tmp/openclaw` (fallback: `${os.tmpdir()}/openclaw`)
  - descargas: `/tmp/openclaw/downloads` (fallback: `${os.tmpdir()}/openclaw/downloads`)
- Las rutas de carga están restringidas a una raíz temporal de cargas de OpenClaw:
  - cargas: `/tmp/openclaw/uploads` (fallback: `${os.tmpdir()}/openclaw/uploads`)
- `upload` también puede configurar directamente entradas de archivo mediante `--input-ref` o `--element`.
- `snapshot`:
  - `--format ai` (predeterminado cuando Playwright está instalado): devuelve un AI snapshot con refs numéricas (`aria-ref="<n>"`).
  - `--format aria`: devuelve el árbol de accesibilidad (sin refs; solo inspección).
  - `--efficient` (o `--mode efficient`): preset compacto de role snapshot (interactive + compact + depth + maxChars menor).
  - Predeterminado de configuración (solo herramienta/CLI): configura `browser.snapshotDefaults.mode: "efficient"` para usar snapshots eficientes cuando quien llama no pasa un modo (consulta [Configuración de Gateway](/es/gateway/configuration-reference#browser)).
  - Las opciones de role snapshot (`--interactive`, `--compact`, `--depth`, `--selector`) fuerzan un snapshot basado en roles con refs como `ref=e12`.
  - `--frame "<iframe selector>"` limita los role snapshots a un iframe (se combina con refs de rol como `e12`).
  - `--interactive` genera una lista plana y fácil de elegir de elementos interactivos (ideal para ejecutar acciones).
  - `--labels` agrega una captura de pantalla solo de la ventana visible con etiquetas de ref superpuestas (imprime `MEDIA:<path>`).
- `click`/`type`/etc. requieren una `ref` de `snapshot` (ya sea la numérica `12` o la ref de rol `e12`).
  Los selectores CSS no son compatibles intencionalmente para acciones.

## Snapshots y refs

OpenClaw admite dos estilos de “snapshot”:

- **AI snapshot (refs numéricas)**: `openclaw browser snapshot` (predeterminado; `--format ai`)
  - Salida: un snapshot de texto que incluye refs numéricas.
  - Acciones: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Internamente, la ref se resuelve mediante `aria-ref` de Playwright.

- **Role snapshot (refs de rol como `e12`)**: `openclaw browser snapshot --interactive` (o `--compact`, `--depth`, `--selector`, `--frame`)
  - Salida: una lista o árbol basado en roles con `[ref=e12]` (y opcionalmente `[nth=1]`).
  - Acciones: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Internamente, la ref se resuelve mediante `getByRole(...)` (más `nth()` para duplicados).
  - Agrega `--labels` para incluir una captura de pantalla de la ventana visible con etiquetas `e12` superpuestas.

Comportamiento de las refs:

- Las refs **no son estables entre navegaciones**; si algo falla, vuelve a ejecutar `snapshot` y usa una ref nueva.
- Si el role snapshot se tomó con `--frame`, las refs de rol quedan limitadas a ese iframe hasta el siguiente role snapshot.

## Mejoras de `wait`

Puedes esperar algo más que tiempo/texto:

- Esperar una URL (globs compatibles con Playwright):
  - `openclaw browser wait --url "**/dash"`
- Esperar un estado de carga:
  - `openclaw browser wait --load networkidle`
- Esperar un predicado de JS:
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

Cuando falla una acción (por ejemplo, “not visible”, “strict mode violation”, “covered”):

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

Los role snapshots en JSON incluyen `refs` más un pequeño bloque `stats` (lines/chars/refs/interactive) para que las herramientas puedan razonar sobre el tamaño y la densidad de la carga útil.

## Controles de estado y entorno

Son útiles para flujos de trabajo de “hacer que el sitio se comporte como X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Sin conexión: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (el heredado `set headers --json '{"X-Debug":"1"}'` sigue siendo compatible)
- Auth HTTP basic: `set credentials user pass` (o `--clear`)
- Geolocalización: `set geo <lat> <lon> --origin "https://example.com"` (o `--clear`)
- Media: `set media dark|light|no-preference|none`
- Zona horaria / configuración regional: `set timezone ...`, `set locale ...`
- Dispositivo / viewport:
  - `set device "iPhone 14"` (presets de dispositivos de Playwright)
  - `set viewport 1280 720`

## Seguridad y privacidad

- El perfil de navegador openclaw puede contener sesiones con inicio de sesión; trátalo como sensible.
- `browser act kind=evaluate` / `openclaw browser evaluate` y `wait --fn`
  ejecutan JavaScript arbitrario en el contexto de la página. La inyección de prompts puede guiar
  esto. Desactívalo con `browser.evaluateEnabled=false` si no lo necesitas.
- Para inicios de sesión y notas anti-bot (X/Twitter, etc.), consulta [Inicio de sesión del navegador + publicación en X/Twitter](/es/tools/browser-login).
- Mantén privado el gateway o host del nodo (solo loopback o tailnet).
- Los endpoints CDP remotos son potentes; canalízalos de forma segura y protégelos.

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

## Solución de problemas

Para problemas específicos de Linux (especialmente Chromium de snap), consulta
[Solución de problemas del navegador](/es/tools/browser-linux-troubleshooting).

Para configuraciones de host dividido entre Gateway en WSL2 y Chrome en Windows, consulta
[Solución de problemas de WSL2 + Windows + Chrome remoto CDP](/es/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Fallo de inicio de CDP frente a bloqueo SSRF de navegación

Son clases de fallo diferentes y apuntan a rutas de código distintas.

- **Un fallo de inicio o preparación de CDP** significa que OpenClaw no puede confirmar que el plano de control del navegador esté en buen estado.
- **Un bloqueo SSRF de navegación** significa que el plano de control del navegador está en buen estado, pero un destino de navegación de página es rechazado por la política.

Ejemplos comunes:

- Fallo de inicio o preparación de CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Bloqueo SSRF de navegación:
  - los flujos `open`, `navigate`, snapshot o apertura de pestañas fallan con un error de política del navegador o de red mientras `start` y `tabs` siguen funcionando

Usa esta secuencia mínima para diferenciar ambos casos:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Cómo interpretar los resultados:

- Si `start` falla con `not reachable after start`, primero soluciona la preparación de CDP.
- Si `start` tiene éxito pero `tabs` falla, el plano de control sigue sin estar en buen estado. Trátalo como un problema de accesibilidad de CDP, no como un problema de navegación de página.
- Si `start` y `tabs` tienen éxito pero `open` o `navigate` fallan, el plano de control del navegador está activo y el fallo está en la política de navegación o en la página de destino.
- Si `start`, `tabs` y `open` tienen éxito, la ruta básica de control del navegador administrado está en buen estado.

Detalles importantes del comportamiento:

- La configuración del navegador usa de forma predeterminada un objeto de política SSRF de cierre por defecto incluso cuando no configuras `browser.ssrfPolicy`.
- Para el perfil administrado local `openclaw` en loopback, las comprobaciones de estado de CDP omiten intencionalmente la aplicación de accesibilidad SSRF del navegador para el propio plano de control local de OpenClaw.
- La protección de navegación es independiente. Un resultado correcto de `start` o `tabs` no significa que un destino posterior de `open` o `navigate` esté permitido.

Guía de seguridad:

- **No** relajes la política SSRF del navegador de forma predeterminada.
- Prefiere excepciones de host específicas como `hostnameAllowlist` o `allowedHostnames` en lugar de un acceso amplio a redes privadas.
- Usa `dangerouslyAllowPrivateNetwork: true` solo en entornos intencionalmente confiables donde el acceso del navegador a redes privadas sea necesario y haya sido revisado.

Ejemplo: navegación bloqueada, plano de control en buen estado

- `start` tiene éxito
- `tabs` tiene éxito
- `open http://internal.example` falla

Eso normalmente significa que el inicio del navegador está bien y que el destino de navegación necesita una revisión de política.

Ejemplo: inicio bloqueado antes de que la navegación importe

- `start` falla con `not reachable after start`
- `tabs` también falla o no puede ejecutarse

Eso apunta al inicio del navegador o a la accesibilidad de CDP, no a un problema de lista de permitidos de URL de página.

## Herramientas del agente + cómo funciona el control

El agente obtiene **una herramienta** para la automatización del navegador:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Cómo se asigna:

- `browser snapshot` devuelve un árbol de IU estable (AI o ARIA).
- `browser act` usa los ID `ref` del snapshot para hacer clic, escribir, arrastrar o seleccionar.
- `browser screenshot` captura píxeles (página completa o elemento).
- `browser` acepta:
  - `profile` para elegir un perfil de navegador con nombre (openclaw, chrome o CDP remoto).
  - `target` (`sandbox` | `host` | `node`) para seleccionar dónde vive el navegador.
  - En sesiones aisladas, `target: "host"` requiere `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Si se omite `target`: las sesiones aisladas usan `sandbox` de forma predeterminada y las no aisladas usan `host`.
  - Si hay un nodo con capacidad de navegador conectado, la herramienta puede enrutar automáticamente hacia él a menos que fijes `target="host"` o `target="node"`.

Esto mantiene al agente determinista y evita selectores frágiles.

## Relacionado

- [Descripción general de las herramientas](/es/tools) — todas las herramientas de agente disponibles
- [Aislamiento](/es/gateway/sandboxing) — control del navegador en entornos aislados
- [Seguridad](/es/gateway/security) — riesgos y refuerzo del control del navegador
