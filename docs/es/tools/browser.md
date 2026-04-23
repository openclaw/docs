---
read_when:
    - Adición de automatización del navegador controlada por el agente
    - Depuración de por qué openclaw está interfiriendo con tu propio Chrome
    - Implementación de ajustes del navegador + ciclo de vida en la app de macOS
summary: Servicio integrado de control del navegador + comandos de acción
title: Navegador (gestionado por OpenClaw)
x-i18n:
    generated_at: "2026-04-23T05:20:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 865b0020d66366a62939f8ed28b9cda88d56ee7f5245b1b24a4e804ce55ea42d
    source_path: tools/browser.md
    workflow: 15
---

# Navegador (gestionado por openclaw)

OpenClaw puede ejecutar un **perfil dedicado de Chrome/Brave/Edge/Chromium** controlado por el agente.
Está aislado de tu navegador personal y se gestiona mediante un pequeño servicio local de
control dentro del Gateway (solo loopback).

Vista para principiantes:

- Piensa en él como un **navegador separado, solo para el agente**.
- El perfil `openclaw` **no** toca tu perfil personal del navegador.
- El agente puede **abrir pestañas, leer páginas, hacer clic y escribir** en una vía segura.
- El perfil integrado `user` se conecta a tu sesión real de Chrome iniciada mediante Chrome MCP.

## Lo que obtienes

- Un perfil de navegador separado llamado **openclaw** (acento naranja de forma predeterminada).
- Control determinista de pestañas (enumerar/abrir/enfocar/cerrar).
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

Si obtienes “Browser disabled”, habilítalo en la configuración (consulta abajo) y reinicia el
Gateway.

Si `openclaw browser` no aparece en absoluto, o el agente indica que la herramienta de navegador
no está disponible, ve a [Falta el comando o la herramienta del navegador](/es/tools/browser#missing-browser-command-or-tool).

## Control del Plugin

La herramienta `browser` predeterminada ahora es un Plugin incluido que se entrega habilitado por
defecto. Eso significa que puedes desactivarlo o sustituirlo sin eliminar el resto del
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
mismo nombre de herramienta `browser`. La experiencia predeterminada del navegador necesita ambas cosas:

- `plugins.entries.browser.enabled` no desactivado
- `browser.enabled=true`

Si desactivas solo el plugin, la CLI de navegador incluida (`openclaw browser`),
el método del gateway (`browser.request`), la herramienta del agente y el servicio de control del navegador predeterminado
desaparecen todos a la vez. Tu configuración `browser.*` permanece intacta para que un
plugin de reemplazo la reutilice.

El Plugin de navegador incluido también controla ahora la implementación del runtime del navegador.
El núcleo conserva solo ayudantes compartidos del Plugin SDK más reexportaciones de compatibilidad para
rutas de importación internas antiguas. En la práctica, eliminar o sustituir el paquete del plugin de navegador elimina el conjunto de funciones del navegador en lugar de dejar detrás un segundo runtime controlado por el núcleo.

Los cambios de configuración del navegador siguen requiriendo reiniciar el Gateway para que el Plugin incluido
pueda volver a registrar su servicio de navegador con la nueva configuración.

## Falta el comando o la herramienta del navegador

Si `openclaw browser` pasa de repente a ser un comando desconocido después de una actualización, o
el agente informa de que falta la herramienta de navegador, la causa más habitual es una
lista restrictiva `plugins.allow` que no incluye `browser`.

Ejemplo de configuración rota:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

Corrígelo añadiendo `browser` a la lista de plugins permitidos:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Notas importantes:

- `browser.enabled=true` por sí solo no es suficiente cuando `plugins.allow` está establecido.
- `plugins.entries.browser.enabled=true` por sí solo tampoco es suficiente cuando `plugins.allow` está establecido.
- `tools.alsoAllow: ["browser"]` **no** carga el Plugin de navegador incluido. Solo ajusta la política de herramientas después de que el plugin ya esté cargado.
- Si no necesitas una lista restrictiva de plugins permitidos, eliminar `plugins.allow` también restaura el comportamiento predeterminado del navegador incluido.

Síntomas típicos:

- `openclaw browser` es un comando desconocido.
- Falta `browser.request`.
- El agente informa de que la herramienta de navegador no está disponible o falta.

## Perfiles: `openclaw` frente a `user`

- `openclaw`: navegador gestionado y aislado (no requiere extensión).
- `user`: perfil integrado de conexión mediante Chrome MCP a tu **sesión real de Chrome**
  con inicio de sesión.

Para las llamadas a la herramienta de navegador del agente:

- Predeterminado: usa el navegador aislado `openclaw`.
- Prefiere `profile="user"` cuando importen las sesiones ya iniciadas y el usuario
  esté delante del ordenador para hacer clic/aprobar cualquier solicitud de conexión.
- `profile` es la invalidación explícita cuando quieres un modo concreto de navegador.

Establece `browser.defaultProfile: "openclaw"` si quieres el modo gestionado de forma predeterminada.

## Configuración

Los ajustes del navegador viven en `~/.openclaw/openclaw.json`.

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

- El servicio de control del navegador hace bind a loopback en un puerto derivado de `gateway.port`
  (predeterminado: `18791`, que es gateway + 2).
- Si invalidas el puerto del Gateway (`gateway.port` o `OPENCLAW_GATEWAY_PORT`),
  los puertos derivados del navegador se desplazan para permanecer en la misma “familia”.
- `cdpUrl` toma como valor predeterminado el puerto CDP local gestionado cuando no está establecido.
- `remoteCdpTimeoutMs` se aplica a las comprobaciones de alcance de CDP remotas (fuera de loopback).
- `remoteCdpHandshakeTimeoutMs` se aplica a las comprobaciones de alcance del protocolo de enlace WebSocket de CDP remoto.
- La navegación del navegador/abrir pestaña está protegida contra SSRF antes de navegar y se vuelve a comprobar, en la medida de lo posible, en la URL final `http(s)` después de navegar.
- En modo SSRF estricto, también se comprueban el descubrimiento y las sondas de endpoints CDP remotos (`cdpUrl`, incluidas búsquedas `/json/version`).
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` está desactivado de forma predeterminada. Establécelo en `true` solo cuando confíes intencionalmente en el acceso del navegador a redes privadas.
- `browser.ssrfPolicy.allowPrivateNetwork` sigue siendo compatible como alias heredado.
- `attachOnly: true` significa “nunca iniciar un navegador local; solo conectarse si ya está en ejecución”.
- `color` + `color` por perfil tiñen la IU del navegador para que puedas ver qué perfil está activo.
- El perfil predeterminado es `openclaw` (navegador independiente gestionado por OpenClaw). Usa `defaultProfile: "user"` para optar por el navegador de usuario con sesión iniciada.
- Orden de autodetección: navegador predeterminado del sistema si está basado en Chromium; si no, Chrome → Brave → Edge → Chromium → Chrome Canary.
- Los perfiles locales `openclaw` asignan automáticamente `cdpPort`/`cdpUrl`; establécelos solo para CDP remoto.
- `driver: "existing-session"` usa Chrome DevTools MCP en lugar de CDP sin procesar. No
  establezcas `cdpUrl` para ese controlador.
- Establece `browser.profiles.<name>.userDataDir` cuando un perfil de sesión existente
  deba conectarse a un perfil de usuario Chromium no predeterminado, como Brave o Edge.

## Usar Brave (u otro navegador basado en Chromium)

Si tu navegador **predeterminado del sistema** está basado en Chromium (Chrome/Brave/Edge/etc.),
OpenClaw lo usa automáticamente. Establece `browser.executablePath` para invalidar
la autodetección:

Ejemplo con CLI:

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

- **Control local (predeterminado):** el Gateway inicia el servicio de control loopback y puede lanzar un navegador local.
- **Control remoto (host node):** ejecuta un host node en la máquina que tiene el navegador; el Gateway hace de proxy para las acciones del navegador.
- **CDP remoto:** establece `browser.profiles.<name>.cdpUrl` (o `browser.cdpUrl`) para
  conectarte a un navegador remoto basado en Chromium. En este caso, OpenClaw no lanzará un navegador local.

El comportamiento al detenerse difiere según el modo de perfil:

- perfiles locales gestionados: `openclaw browser stop` detiene el proceso del navegador que
  OpenClaw lanzó
- perfiles de solo conexión y CDP remoto: `openclaw browser stop` cierra la
  sesión de control activa y libera las invalidaciones de emulación de Playwright/CDP (viewport,
  esquema de color, configuración regional, zona horaria, modo sin conexión y estados similares), aunque
  OpenClaw no haya lanzado ningún proceso de navegador

Las URL de CDP remoto pueden incluir autenticación:

- Tokens de consulta (por ejemplo, `https://provider.example?token=<token>`)
- Autenticación HTTP Basic (por ejemplo, `https://user:pass@provider.example`)

OpenClaw conserva la autenticación al llamar a endpoints `/json/*` y al conectarse
al WebSocket de CDP. Prefiere variables de entorno o gestores de secretos para
los tokens en lugar de confirmarlos en archivos de configuración.

## Proxy de navegador de Node (valor predeterminado sin configuración)

Si ejecutas un **host node** en la máquina que tiene tu navegador, OpenClaw puede
enrutar automáticamente las llamadas a la herramienta de navegador a ese node sin ninguna configuración adicional del navegador.
Esta es la ruta predeterminada para gateways remotos.

Notas:

- El host node expone su servidor local de control del navegador mediante un **comando proxy**.
- Los perfiles provienen de la propia configuración `browser.profiles` del node (igual que en local).
- `nodeHost.browserProxy.allowProfiles` es opcional. Déjalo vacío para el comportamiento heredado/predeterminado: todos los perfiles configurados seguirán siendo accesibles mediante el proxy, incluidas las rutas de crear/eliminar perfil.
- Si estableces `nodeHost.browserProxy.allowProfiles`, OpenClaw lo trata como un límite de privilegio mínimo: solo se puede dirigir a los perfiles permitidos y las rutas persistentes de crear/eliminar perfil se bloquean en la superficie del proxy.
- Desactívalo si no lo quieres:
  - En el node: `nodeHost.browserProxy.enabled=false`
  - En el gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP remoto alojado)

[Browserless](https://browserless.io) es un servicio Chromium alojado que expone
URL de conexión CDP mediante HTTPS y WebSocket. OpenClaw puede usar cualquiera de las dos formas, pero
para un perfil remoto de navegador, la opción más sencilla es la URL WebSocket directa
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

## Proveedores CDP WebSocket directos

Algunos servicios de navegador alojados exponen un endpoint **WebSocket** directo en lugar
del descubrimiento CDP estándar basado en HTTP (`/json/version`). OpenClaw acepta tres
formatos de URL CDP y elige automáticamente la estrategia de conexión correcta:

- **Descubrimiento HTTP(S)** — `http://host[:port]` o `https://host[:port]`.
  OpenClaw llama a `/json/version` para descubrir la URL del depurador WebSocket y luego
  se conecta. No hay fallback de WebSocket.
- **Endpoints WebSocket directos** — `ws://host[:port]/devtools/<kind>/<id>` o
  `wss://...` con una ruta `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw se conecta directamente mediante un protocolo de enlace WebSocket y omite
  por completo `/json/version`.
- **Raíces WebSocket simples** — `ws://host[:port]` o `wss://host[:port]` sin
  ruta `/devtools/...` (por ejemplo, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw intenta primero el descubrimiento HTTP
  de `/json/version` (normalizando el esquema a `http`/`https`);
  si el descubrimiento devuelve un `webSocketDebuggerUrl`, se utiliza; en caso contrario, OpenClaw
  recurre a un protocolo de enlace WebSocket directo en la raíz simple. Esto cubre
  tanto puertos de depuración remota de estilo Chrome como proveedores que solo usan WebSocket.

`ws://host:port` / `wss://host:port` simples sin una ruta `/devtools/...`
apuntando a una instancia local de Chrome son compatibles mediante el
fallback de descubrimiento primero: Chrome solo acepta actualizaciones WebSocket en la ruta específica por navegador
o por destino que devuelve `/json/version`, de modo que un protocolo de enlace en la raíz simple por sí solo
fallaría.

### Browserbase

[Browserbase](https://www.browserbase.com) es una plataforma en la nube para ejecutar
navegadores sin interfaz gráfica con resolución integrada de CAPTCHA, modo sigiloso y
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

- [Regístrate](https://www.browserbase.com/sign-up) y copia tu **API Key**
  desde el [panel Overview](https://www.browserbase.com/overview).
- Sustituye `<BROWSERBASE_API_KEY>` por tu clave de API real de Browserbase.
- Browserbase crea automáticamente una sesión de navegador al conectarse por WebSocket, por lo que
  no se necesita ningún paso manual de creación de sesión.
- El nivel gratuito permite una sesión simultánea y una hora de navegador al mes.
  Consulta [pricing](https://www.browserbase.com/pricing) para los límites de los planes de pago.
- Consulta la [documentación de Browserbase](https://docs.browserbase.com) para ver la
  referencia completa de la API, guías del SDK y ejemplos de integración.

## Seguridad

Ideas clave:

- El control del navegador es solo por loopback; el acceso fluye a través de la autenticación del Gateway o del emparejamiento de node.
- La API HTTP independiente del navegador en loopback usa **solo autenticación con secreto compartido**:
  autenticación bearer por token del gateway, `x-openclaw-password` o autenticación HTTP Basic con la
  contraseña del gateway configurada.
- Las cabeceras de identidad de Tailscale Serve y `gateway.auth.mode: "trusted-proxy"` **no**
  autentican esta API independiente del navegador en loopback.
- Si el control del navegador está habilitado y no hay configurada autenticación con secreto compartido, OpenClaw
  genera automáticamente `gateway.auth.token` al arrancar y lo guarda en la configuración.
- OpenClaw **no** genera automáticamente ese token cuando `gateway.auth.mode` ya es
  `password`, `none` o `trusted-proxy`.
- Mantén el Gateway y cualquier host node en una red privada (Tailscale); evita la exposición pública.
- Trata las URL/tokens de CDP remoto como secretos; prefiere variables de entorno o un gestor de secretos.

Consejos para CDP remoto:

- Prefiere endpoints cifrados (HTTPS o WSS) y tokens de corta duración cuando sea posible.
- Evita incrustar tokens de larga duración directamente en archivos de configuración.

## Perfiles (multinavegador)

OpenClaw admite varios perfiles con nombre (configuraciones de enrutamiento). Los perfiles pueden ser:

- **gestionados por openclaw**: una instancia dedicada de navegador basado en Chromium con su propio directorio de datos de usuario + puerto CDP
- **remotos**: una URL CDP explícita (navegador basado en Chromium ejecutándose en otro lugar)
- **sesión existente**: tu perfil actual de Chrome mediante conexión automática a Chrome DevTools MCP

Valores predeterminados:

- El perfil `openclaw` se crea automáticamente si falta.
- El perfil `user` está integrado para la conexión de sesión existente de Chrome MCP.
- Los perfiles de sesión existente son opt-in más allá de `user`; créalos con `--driver existing-session`.
- Los puertos CDP locales se asignan en el rango **18800–18899** de forma predeterminada.
- Al eliminar un perfil, su directorio local de datos se mueve a la Papelera.

Todos los endpoints de control aceptan `?profile=<name>`; la CLI usa `--browser-profile`.

## Sesión existente mediante Chrome DevTools MCP

OpenClaw también puede conectarse a un perfil en ejecución de navegador basado en Chromium a través del
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

- El perfil integrado `user` usa la conexión automática de Chrome MCP, que apunta al
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
3. Mantén el navegador en ejecución y aprueba la solicitud de conexión cuando OpenClaw se conecte.

Páginas de inspección comunes:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Prueba rápida de conexión activa:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Cómo se ve un caso exitoso:

- `status` muestra `driver: existing-session`
- `status` muestra `transport: chrome-mcp`
- `status` muestra `running: true`
- `tabs` enumera las pestañas del navegador ya abiertas
- `snapshot` devuelve refs de la pestaña activa seleccionada

Qué comprobar si la conexión no funciona:

- el navegador basado en Chromium de destino es versión `144+`
- la depuración remota está habilitada en la página de inspección de ese navegador
- el navegador mostró y aceptaste la solicitud de consentimiento para conectarse
- `openclaw doctor` migra la configuración antigua del navegador basada en extensiones y comprueba que
  Chrome esté instalado localmente para perfiles predeterminados de conexión automática, pero no puede
  habilitar la depuración remota en el navegador por ti

Uso por parte del agente:

- Usa `profile="user"` cuando necesites el estado del navegador del usuario con sesión iniciada.
- Si usas un perfil personalizado de sesión existente, pasa ese nombre de perfil explícito.
- Elige este modo solo cuando el usuario esté delante del ordenador para aprobar la
  solicitud de conexión.
- el Gateway o el host node pueden generar `npx chrome-devtools-mcp@latest --autoConnect`

Notas:

- Esta ruta tiene más riesgo que el perfil aislado `openclaw` porque puede
  actuar dentro de tu sesión de navegador con inicio de sesión.
- OpenClaw no inicia el navegador para este controlador; solo se conecta a una
  sesión existente.
- OpenClaw usa aquí el flujo oficial `--autoConnect` de Chrome DevTools MCP. Si
  `userDataDir` está establecido, OpenClaw lo pasa para apuntar a ese
  directorio explícito de datos de usuario de Chromium.
- Las capturas de pantalla de sesión existente admiten capturas de página y capturas de elementos `--ref`
  desde instantáneas, pero no selectores CSS `--element`.
- Las capturas de pantalla de página de sesión existente funcionan sin Playwright mediante Chrome MCP.
  Las capturas de elementos basadas en ref (`--ref`) también funcionan allí, pero `--full-page`
  no puede combinarse con `--ref` ni con `--element`.
- Las acciones de sesión existente siguen siendo más limitadas que la
  ruta del navegador gestionado:
  - `click`, `type`, `hover`, `scrollIntoView`, `drag` y `select` requieren
    refs de instantánea en lugar de selectores CSS
  - `click` es solo con botón izquierdo (sin invalidaciones de botón ni modificadores)
  - `type` no admite `slowly=true`; usa `fill` o `press`
  - `press` no admite `delayMs`
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill` y `evaluate` no
    admiten invalidaciones de tiempo de espera por llamada
  - `select` actualmente solo admite un valor
- `wait --url` de sesión existente admite patrones exactos, de subcadena y glob
  como otros controladores de navegador. `wait --load networkidle` aún no es compatible.
- Los hooks de subida de sesión existente requieren `ref` o `inputRef`, admiten un archivo a la vez
  y no admiten selección CSS `element`.
- Los hooks de diálogo de sesión existente no admiten invalidaciones de tiempo de espera.
- Algunas funciones siguen requiriendo la ruta del navegador gestionado, incluidas
  acciones por lotes, exportación a PDF, interceptación de descargas y `responsebody`.
- La sesión existente puede conectarse en el host seleccionado o a través de un
  browser node conectado. Si Chrome está en otro lugar y no hay ningún browser node conectado, usa
  CDP remoto o un host node en su lugar.

## Garantías de aislamiento

- **Directorio de datos de usuario dedicado**: nunca toca tu perfil personal del navegador.
- **Puertos dedicados**: evita `9222` para prevenir colisiones con flujos de trabajo de desarrollo.
- **Control determinista de pestañas**: apunta a las pestañas por `targetId`, no por “última pestaña”.

## Selección de navegador

Al iniciarse localmente, OpenClaw elige el primero disponible:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Puedes invalidarlo con `browser.executablePath`.

Plataformas:

- macOS: comprueba `/Applications` y `~/Applications`.
- Linux: busca `google-chrome`, `brave`, `microsoft-edge`, `chromium`, etc.
- Windows: comprueba ubicaciones comunes de instalación.

## API de control (opcional)

Solo para integraciones locales, el Gateway expone una pequeña API HTTP en loopback:

- Estado/iniciar/detener: `GET /`, `POST /start`, `POST /stop`
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
- Ajustes: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Todos los endpoints aceptan `?profile=<name>`.

Si está configurada la autenticación del gateway con secreto compartido, las rutas HTTP del navegador también requieren autenticación:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` o autenticación HTTP Basic con esa contraseña

Notas:

- Esta API independiente del navegador en loopback **no** consume trusted-proxy ni
  cabeceras de identidad de Tailscale Serve.
- Si `gateway.auth.mode` es `none` o `trusted-proxy`, estas rutas de navegador en loopback
  no heredan esos modos con identidad; mantenlas solo en loopback.

### Contrato de errores de `/act`

`POST /act` usa una respuesta de error estructurada para validación a nivel de ruta y
fallos de política:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valores actuales de `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): falta `kind` o no se reconoce.
- `ACT_INVALID_REQUEST` (HTTP 400): la carga útil de la acción no superó la normalización o validación.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): se usó `selector` con un tipo de acción no compatible.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (o `wait --fn`) está desactivado por configuración.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` de nivel superior o por lotes entra en conflicto con el destino de la solicitud.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): la acción no es compatible con perfiles de sesión existente.

Otros fallos de runtime pueden seguir devolviendo `{ "error": "<message>" }` sin un
campo `code`.

### Requisito de Playwright

Algunas funciones (navigate/act/instantánea AI/instantánea por roles, capturas de pantalla de elementos,
PDF) requieren Playwright. Si Playwright no está instalado, esos endpoints devuelven
un error 501 claro.

Lo que sigue funcionando sin Playwright:

- Instantáneas ARIA
- Capturas de pantalla de página para el navegador gestionado `openclaw` cuando hay un WebSocket
  CDP por pestaña disponible
- Capturas de pantalla de página para perfiles `existing-session` / Chrome MCP
- Capturas de pantalla basadas en ref de `existing-session` (`--ref`) a partir de la salida de instantáneas

Lo que sigue necesitando Playwright:

- `navigate`
- `act`
- Instantáneas AI / instantáneas por roles
- Capturas de pantalla de elementos por selector CSS (`--element`)
- Exportación completa de PDF del navegador

Las capturas de pantalla de elementos también rechazan `--full-page`; la ruta devuelve `fullPage is
not supported for element screenshots`.

Si ves `Playwright is not available in this gateway build`, repara las dependencias de runtime
del Plugin de navegador incluido para que `playwright-core` esté instalado,
y luego reinicia el gateway. En instalaciones empaquetadas, ejecuta `openclaw doctor --fix`.
Para Docker, instala también los binarios del navegador Chromium como se muestra abajo.

#### Instalación de Playwright en Docker

Si tu Gateway se ejecuta en Docker, evita `npx playwright` (conflictos de invalidación de npm).
Usa en su lugar la CLI incluida:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Para conservar las descargas del navegador, establece `PLAYWRIGHT_BROWSERS_PATH` (por ejemplo,
`/home/node/.cache/ms-playwright`) y asegúrate de que `/home/node` se conserve mediante
`OPENCLAW_HOME_VOLUME` o un bind mount. Consulta [Docker](/es/install/docker).

## Cómo funciona (interno)

Flujo de alto nivel:

- Un pequeño **servidor de control** acepta solicitudes HTTP.
- Se conecta a navegadores basados en Chromium (Chrome/Brave/Edge/Chromium) mediante **CDP**.
- Para acciones avanzadas (clic/escritura/instantánea/PDF), usa **Playwright** sobre
  CDP.
- Cuando Playwright no está presente, solo están disponibles las operaciones que no dependen de Playwright.

Este diseño mantiene al agente sobre una interfaz estable y determinista, a la vez que te permite
cambiar navegadores y perfiles locales/remotos.

## Referencia rápida de la CLI

Todos los comandos aceptan `--browser-profile <name>` para apuntar a un perfil específico.
Todos los comandos también aceptan `--json` para salida legible por máquinas (cargas útiles estables).

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

- Para perfiles de solo conexión y CDP remoto, `openclaw browser stop` sigue siendo el
  comando correcto de limpieza después de las pruebas. Cierra la sesión de control activa y
  borra invalidaciones temporales de emulación en lugar de matar el
  navegador subyacente.
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

- `upload` y `dialog` son llamadas de **preparación**; ejecútalas antes del clic/tecla
  que desencadena el selector/diálogo.
- Las rutas de salida de descargas y trazas están limitadas a raíces temporales de OpenClaw:
  - trazas: `/tmp/openclaw` (respaldo: `${os.tmpdir()}/openclaw`)
  - descargas: `/tmp/openclaw/downloads` (respaldo: `${os.tmpdir()}/openclaw/downloads`)
- Las rutas de carga están limitadas a una raíz temporal de cargas de OpenClaw:
  - cargas: `/tmp/openclaw/uploads` (respaldo: `${os.tmpdir()}/openclaw/uploads`)
- `upload` también puede establecer entradas de archivo directamente mediante `--input-ref` o `--element`.
- `snapshot`:
  - `--format ai` (predeterminado cuando Playwright está instalado): devuelve una instantánea AI con refs numéricas (`aria-ref="<n>"`).
  - `--format aria`: devuelve el árbol de accesibilidad (sin refs; solo inspección).
  - `--efficient` (o `--mode efficient`): preajuste de instantánea compacta por roles (interactiva + compacta + profundidad + `maxChars` menor).
  - Valor predeterminado de configuración (solo herramienta/CLI): establece `browser.snapshotDefaults.mode: "efficient"` para usar instantáneas eficientes cuando quien llama no pasa un modo (consulta [Configuración del Gateway](/es/gateway/configuration-reference#browser)).
  - Las opciones de instantánea por roles (`--interactive`, `--compact`, `--depth`, `--selector`) fuerzan una instantánea basada en roles con refs como `ref=e12`.
  - `--frame "<iframe selector>"` limita las instantáneas por roles a un iframe (se combina con refs por roles como `e12`).
  - `--interactive` produce una lista plana y fácil de elegir de elementos interactivos (la mejor para dirigir acciones).
  - `--labels` añade una captura de pantalla solo del viewport con etiquetas ref superpuestas (imprime `MEDIA:<path>`).
- `click`/`type`/etc. requieren un `ref` de `snapshot` (ya sea numérico `12` o ref por roles `e12`).
  Los selectores CSS no son compatibles intencionalmente para acciones.

## Instantáneas y refs

OpenClaw admite dos estilos de “instantánea”:

- **Instantánea AI (refs numéricas)**: `openclaw browser snapshot` (predeterminada; `--format ai`)
  - Salida: una instantánea de texto que incluye refs numéricas.
  - Acciones: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Internamente, la ref se resuelve mediante `aria-ref` de Playwright.

- **Instantánea por roles (refs por roles como `e12`)**: `openclaw browser snapshot --interactive` (o `--compact`, `--depth`, `--selector`, `--frame`)
  - Salida: una lista/árbol basada en roles con `[ref=e12]` (y opcionalmente `[nth=1]`).
  - Acciones: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Internamente, la ref se resuelve mediante `getByRole(...)` (más `nth()` para duplicados).
  - Añade `--labels` para incluir una captura de pantalla del viewport con etiquetas `e12` superpuestas.

Comportamiento de las refs:

- Las refs **no son estables entre navegaciones**; si algo falla, vuelve a ejecutar `snapshot` y usa una ref nueva.
- Si la instantánea por roles se tomó con `--frame`, las refs por roles quedan limitadas a ese iframe hasta la siguiente instantánea por roles.

## Potenciadores de espera

Puedes esperar algo más que tiempo/texto:

- Esperar una URL (globs compatibles con Playwright):
  - `openclaw browser wait --url "**/dash"`
- Esperar un estado de carga:
  - `openclaw browser wait --load networkidle`
- Esperar un predicado JS:
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
2. Usa `click <ref>` / `type <ref>` (prefiere refs por roles en modo interactivo)
3. Si sigue fallando: `openclaw browser highlight <ref>` para ver a qué apunta Playwright
4. Si la página se comporta de forma extraña:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Para depuración profunda: registra una traza:
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

Las instantáneas por roles en JSON incluyen `refs` más un pequeño bloque `stats` (líneas/caracteres/refs/interactivos) para que las herramientas puedan razonar sobre el tamaño y la densidad de la carga útil.

## Controles de estado y entorno

Son útiles para flujos de trabajo de “haz que el sitio se comporte como X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Sin conexión: `set offline on|off`
- Cabeceras: `set headers --headers-json '{"X-Debug":"1"}'` (el heredado `set headers --json '{"X-Debug":"1"}'` sigue siendo compatible)
- Autenticación HTTP básica: `set credentials user pass` (o `--clear`)
- Geolocalización: `set geo <lat> <lon> --origin "https://example.com"` (o `--clear`)
- Medios: `set media dark|light|no-preference|none`
- Zona horaria / configuración regional: `set timezone ...`, `set locale ...`
- Dispositivo / viewport:
  - `set device "iPhone 14"` (preajustes de dispositivo de Playwright)
  - `set viewport 1280 720`

## Seguridad y privacidad

- El perfil de navegador openclaw puede contener sesiones iniciadas; trátalo como sensible.
- `browser act kind=evaluate` / `openclaw browser evaluate` y `wait --fn`
  ejecutan JavaScript arbitrario en el contexto de la página. La inyección de prompt puede dirigir
  esto. Desactívalo con `browser.evaluateEnabled=false` si no lo necesitas.
- Para inicios de sesión y notas anti-bot (X/Twitter, etc.), consulta [Inicio de sesión en navegador + publicación en X/Twitter](/es/tools/browser-login).
- Mantén privado el Gateway/host node (solo loopback o tailnet).
- Los endpoints CDP remotos son potentes; tunélalos y protégelos.

Ejemplo de modo estricto (bloquear destinos privados/internos de forma predeterminada):

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

## Solución de problemas

Para problemas específicos de Linux (especialmente Chromium de snap), consulta
[Solución de problemas del navegador](/es/tools/browser-linux-troubleshooting).

Para configuraciones divididas de WSL2 Gateway + Chrome de Windows en hosts distintos, consulta
[Solución de problemas de WSL2 + Windows + Chrome remoto por CDP](/es/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Fallo de arranque de CDP frente a bloqueo SSRF de navegación

Son clases de fallo distintas y apuntan a rutas de código distintas.

- **Fallo de arranque o de disponibilidad de CDP** significa que OpenClaw no puede confirmar que el plano de control del navegador esté en buen estado.
- **Bloqueo SSRF de navegación** significa que el plano de control del navegador está en buen estado, pero un destino de navegación de página es rechazado por la política.

Ejemplos comunes:

- Fallo de arranque o disponibilidad de CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Bloqueo SSRF de navegación:
  - Los flujos `open`, `navigate`, `snapshot` o de apertura de pestañas fallan con un error de política de navegador/red mientras `start` y `tabs` siguen funcionando

Usa esta secuencia mínima para separar ambos casos:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Cómo interpretar los resultados:

- Si `start` falla con `not reachable after start`, soluciona primero la disponibilidad de CDP.
- Si `start` tiene éxito pero `tabs` falla, el plano de control sigue sin estar en buen estado. Trátalo como un problema de alcance de CDP, no como un problema de navegación de página.
- Si `start` y `tabs` tienen éxito pero `open` o `navigate` fallan, el plano de control del navegador está activo y el fallo está en la política de navegación o en la página de destino.
- Si `start`, `tabs` y `open` tienen éxito, la ruta básica de control del navegador gestionado está en buen estado.

Detalles importantes del comportamiento:

- La configuración del navegador usa por defecto un objeto de política SSRF de fallo cerrado incluso cuando no configuras `browser.ssrfPolicy`.
- Para el perfil gestionado local por loopback `openclaw`, las comprobaciones de estado de CDP omiten intencionalmente la aplicación de alcance SSRF del navegador para el propio plano de control local de OpenClaw.
- La protección de navegación es independiente. Que `start` o `tabs` tengan éxito no significa que un destino posterior de `open` o `navigate` esté permitido.

Guía de seguridad:

- **No** relajes la política SSRF del navegador de forma predeterminada.
- Prefiere excepciones de host estrechas como `hostnameAllowlist` o `allowedHostnames` en lugar de acceso amplio a redes privadas.
- Usa `dangerouslyAllowPrivateNetwork: true` solo en entornos intencionalmente confiables donde el acceso del navegador a redes privadas sea necesario y se haya revisado.

Ejemplo: navegación bloqueada, plano de control en buen estado

- `start` tiene éxito
- `tabs` tiene éxito
- `open http://internal.example` falla

Eso normalmente significa que el arranque del navegador está bien y que el destino de navegación necesita revisión de política.

Ejemplo: arranque bloqueado antes de que importe la navegación

- `start` falla con `not reachable after start`
- `tabs` también falla o no puede ejecutarse

Eso apunta al lanzamiento del navegador o al alcance de CDP, no a un problema de lista de permitidos de URL de página.

## Herramientas del agente + cómo funciona el control

El agente recibe **una herramienta** para automatización del navegador:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Cómo se relaciona:

- `browser snapshot` devuelve un árbol de IU estable (AI o ARIA).
- `browser act` usa los ID `ref` de la instantánea para hacer clic/escribir/arrastrar/seleccionar.
- `browser screenshot` captura píxeles (página completa o elemento).
- `browser` acepta:
  - `profile` para elegir un perfil de navegador con nombre (openclaw, chrome o CDP remoto).
  - `target` (`sandbox` | `host` | `node`) para seleccionar dónde vive el navegador.
  - En sesiones en sandbox, `target: "host"` requiere `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Si se omite `target`: las sesiones en sandbox usan `sandbox` de forma predeterminada y las sesiones sin sandbox usan `host`.
  - Si hay un node con capacidad de navegador conectado, la herramienta puede enrutar automáticamente hacia él salvo que fijes `target="host"` o `target="node"`.

Esto mantiene al agente determinista y evita selectores frágiles.

## Relacionado

- [Resumen de herramientas](/es/tools) — todas las herramientas disponibles del agente
- [Sandboxing](/es/gateway/sandboxing) — control del navegador en entornos con sandbox
- [Seguridad](/es/gateway/security) — riesgos y refuerzo del control del navegador
