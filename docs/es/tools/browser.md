---
read_when:
    - Agregar automatización del navegador controlada por agentes
    - Depurar por qué OpenClaw interfiere con tu propio Chrome
    - Implementar ajustes del navegador + ciclo de vida en la app de macOS
summary: Servicio de control de navegador integrado + comandos de acción
title: Navegador (gestionado por OpenClaw)
x-i18n:
    generated_at: "2026-06-27T13:00:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d24586c4ac1e271c24511be98e30725f4f589e9f5e703294190058bc3e6a123
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw puede ejecutar un **perfil dedicado de Chrome/Brave/Edge/Chromium** que controla el agente.
Está aislado de tu navegador personal y se administra mediante un pequeño servicio
de control local dentro del Gateway (solo loopback).

Vista para principiantes:

- Piensa en él como un **navegador separado, solo para el agente**.
- El perfil `openclaw` **no** toca tu perfil de navegador personal.
- El agente puede **abrir pestañas, leer páginas, hacer clic y escribir** en una vía segura.
- El perfil integrado `user` se conecta a tu sesión real de Chrome con sesión iniciada mediante Chrome MCP.

## Qué obtienes

- Un perfil de navegador separado llamado **openclaw** (acento naranja de forma predeterminada).
- Control determinista de pestañas (listar/abrir/enfocar/cerrar).
- Acciones del agente (clic/escribir/arrastrar/seleccionar), instantáneas, capturas de pantalla, archivos PDF.
- Una skill `browser-automation` incluida que enseña a los agentes el bucle de recuperación de instantáneas,
  pestañas estables, referencias obsoletas y bloqueadores manuales cuando el Plugin de navegador
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

Si aparece "Browser disabled", habilítalo en la configuración (ver abajo) y reinicia el
Gateway.

Si `openclaw browser` no aparece en absoluto, o el agente dice que la herramienta de navegador
no está disponible, ve a [Comando o herramienta de navegador faltante](/es/tools/browser#missing-browser-command-or-tool).

## Control del Plugin

La herramienta `browser` predeterminada es un Plugin incluido. Deshabilítalo para reemplazarlo por otro Plugin que registre el mismo nombre de herramienta `browser`:

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

Los valores predeterminados necesitan tanto `plugins.entries.browser.enabled` **como** `browser.enabled=true`. Deshabilitar solo el Plugin elimina la CLI `openclaw browser`, el método Gateway `browser.request`, la herramienta del agente y el servicio de control como una unidad; tu configuración `browser.*` permanece intacta para un reemplazo.

Los cambios de configuración del navegador requieren reiniciar el Gateway para que el Plugin pueda volver a registrar su servicio.

## Guía para agentes

Nota de perfil de herramientas: `tools.profile: "coding"` incluye `web_search` y
`web_fetch`, pero no incluye la herramienta completa `browser`. Si el agente o un
subagente generado debe usar automatización del navegador, añade browser en la etapa
del perfil:

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
política de subagentes se aplica después del filtrado de perfiles.

El Plugin de navegador incluye dos niveles de guía para agentes:

- La descripción de la herramienta `browser` contiene el contrato compacto siempre activo: elegir
  el perfil correcto, mantener las referencias en la misma pestaña, usar `tabId`/etiquetas para
  dirigir pestañas y cargar la skill de navegador para trabajos de varios pasos.
- La skill incluida `browser-automation` contiene el bucle operativo más largo:
  comprobar estado/pestañas primero, etiquetar pestañas de tareas, tomar una instantánea antes de actuar, volver a tomar una instantánea
  después de cambios en la interfaz, recuperar referencias obsoletas una vez e informar bloqueadores de inicio de sesión/2FA/captcha o
  cámara/micrófono como acción manual en vez de adivinar.

Las Skills incluidas por Plugins aparecen en las Skills disponibles del agente cuando el
Plugin está habilitado. Las instrucciones completas de la skill se cargan bajo demanda, por lo que los turnos
rutinarios no pagan el costo completo en tokens.

## Comando o herramienta de navegador faltante

Si `openclaw browser` es desconocido después de una actualización, falta `browser.request` o el agente informa que la herramienta de navegador no está disponible, la causa habitual es una lista `plugins.allow` que omite `browser` y no existe ningún bloque raíz de configuración `browser`. Añádelo:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Un bloque raíz explícito `browser`, por ejemplo `browser.enabled=true` o `browser.profiles.<name>`, activa el Plugin de navegador incluido incluso con un `plugins.allow` restrictivo, coincidiendo con el comportamiento de configuración de canales. `plugins.entries.browser.enabled=true` y `tools.alsoAllow: ["browser"]` no sustituyen por sí solos la pertenencia a la lista de permitidos. Eliminar `plugins.allow` por completo también restaura el valor predeterminado.

## Perfiles: `openclaw` frente a `user`

- `openclaw`: navegador administrado y aislado (no requiere extensión).
- `user`: perfil integrado de conexión Chrome MCP para tu sesión **real de Chrome con sesión iniciada**.

Para llamadas de la herramienta de navegador del agente:

- Valor predeterminado: usar el navegador aislado `openclaw`.
- Prefiere `profile="user"` cuando importen las sesiones existentes con inicio de sesión y el usuario
  esté en el equipo para hacer clic/aprobar cualquier aviso de conexión.
- `profile` es la anulación explícita cuando quieres un modo de navegador específico.

Define `browser.defaultProfile: "openclaw"` si quieres el modo administrado de forma predeterminada.

## Configuración

La configuración del navegador reside en `~/.openclaw/openclaw.json`.

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
    localLaunchTimeoutMs: 15000, // local managed Chrome discovery timeout (ms)
    localCdpReadyTimeoutMs: 8000, // local managed post-launch CDP readiness timeout (ms)
    actionTimeoutMs: 60000, // default browser act timeout (ms)
    tabCleanup: {
      enabled: true, // default: true
      idleMinutes: 120, // set 0 to disable idle cleanup
      maxTabsPerSession: 8, // set 0 to disable the per-session cap
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

### Visión de capturas de pantalla (compatibilidad con modelos de solo texto)

Cuando el modelo principal es de solo texto (sin compatibilidad con visión/multimodal), las
capturas de pantalla del navegador devuelven bloques de imagen que el modelo no puede leer. Las capturas de pantalla del navegador
reutilizan la configuración existente de comprensión de imágenes, por lo que un modelo de imagen
configurado para comprensión de medios puede describir capturas de pantalla como texto sin ninguna
configuración de modelo específica para navegador.

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

1. El agente llama a `browser screenshot` → la imagen se captura en disco como de costumbre.
2. La herramienta de navegador pregunta al runtime existente de comprensión de imágenes si
   puede describir la captura usando modelos de imagen de medios configurados, modelos de medios compartidos,
   valores predeterminados de modelo de imagen o un proveedor de imagen respaldado por autenticación.
3. El modelo de visión devuelve una descripción de texto, que se envuelve con
   `wrapExternalContent` (protección contra inyección de prompts) y se devuelve al agente
   como bloque de texto en vez de bloque de imagen.
4. Si la comprensión de imágenes no está disponible, se omite o falla, el navegador vuelve
   a devolver el bloque de imagen original.

Usa los campos existentes `tools.media.image` / `tools.media.models` para alternativas de modelos,
tiempos de espera, límites de bytes, perfiles y configuración de solicitudes de proveedores.

Si el modelo principal activo ya admite visión y no hay ningún modelo explícito de
comprensión de imágenes configurado, OpenClaw conserva el resultado de imagen normal para que el
modelo principal pueda leer la captura directamente.

<AccordionGroup>

<Accordion title="Puertos y alcanzabilidad">

- El servicio de control se vincula a loopback en un puerto derivado de `gateway.port` (predeterminado `18791` = gateway + 2). Anular `gateway.port` u `OPENCLAW_GATEWAY_PORT` desplaza los puertos derivados dentro de la misma familia.
- Los perfiles locales `openclaw` asignan automáticamente `cdpPort`/`cdpUrl`; defínelos solo para
  perfiles CDP remotos o conexión a endpoint de sesión existente. `cdpUrl` toma como valor predeterminado
  el puerto CDP local administrado cuando no se establece.
- `remoteCdpTimeoutMs` se aplica a comprobaciones de alcanzabilidad HTTP de CDP remotas y `attachOnly`,
  y a solicitudes HTTP de apertura de pestañas; `remoteCdpHandshakeTimeoutMs` se aplica a
  sus handshakes WebSocket CDP.
- `localLaunchTimeoutMs` es el presupuesto para que un proceso Chrome administrado iniciado localmente
  exponga su endpoint HTTP CDP. `localCdpReadyTimeoutMs` es el presupuesto
  de seguimiento para la disponibilidad de websocket CDP después de descubrir el proceso.
  Aumenta estos valores en Raspberry Pi, VPS de gama baja o hardware antiguo donde Chromium
  arranca lentamente. Los valores deben ser enteros positivos de hasta `120000` ms; los valores
  de configuración no válidos se rechazan.
- Los fallos repetidos de inicio/disponibilidad de Chrome administrado activan un cortocircuito por
  perfil. Después de varios fallos consecutivos, OpenClaw pausa brevemente los nuevos intentos de inicio
  en vez de lanzar Chromium en cada llamada de herramienta de navegador. Corrige
  el problema de inicio, deshabilita el navegador si no es necesario o reinicia el
  Gateway después de la reparación.
- `actionTimeoutMs` es el presupuesto predeterminado para solicitudes `act` del navegador cuando el llamador no pasa `timeoutMs`. El transporte del cliente añade una pequeña ventana adicional para que las esperas largas puedan terminar en vez de agotar el tiempo en el límite HTTP.
- `tabCleanup` es una limpieza de máximo esfuerzo para pestañas abiertas por sesiones de navegador del agente principal. La limpieza de ciclo de vida de subagentes, cron y ACP sigue cerrando sus pestañas rastreadas explícitas al final de la sesión; las sesiones principales mantienen reutilizables las pestañas activas y luego cierran en segundo plano las pestañas rastreadas inactivas o excedentes.

</Accordion>

<Accordion title="Política SSRF">

- La navegación del navegador y la apertura de pestañas están protegidas contra SSRF antes de la navegación y se vuelven a comprobar con el mejor esfuerzo en la URL final `http(s)` después.
- En modo SSRF estricto, también se comprueban el descubrimiento remoto de endpoints CDP y las sondas `/json/version` (`cdpUrl`).
- Las variables de entorno `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` y `NO_PROXY` del Gateway/proveedor no aplican proxy automáticamente al navegador gestionado por OpenClaw. Chrome gestionado se inicia directamente por defecto para que la configuración de proxy del proveedor no debilite las comprobaciones SSRF del navegador.
- Las sondas locales de preparación CDP gestionadas por OpenClaw y las conexiones WebSocket de DevTools omiten el proxy de red gestionado para el endpoint loopback iniciado exacto, por lo que `openclaw browser start` sigue funcionando cuando un proxy del operador bloquea el egreso loopback.
- Para aplicar proxy al propio navegador gestionado, pasa flags explícitos de proxy de Chrome mediante `browser.extraArgs`, como `--proxy-server=...` o `--proxy-pac-url=...`. El modo SSRF estricto bloquea el enrutamiento explícito por proxy del navegador salvo que el acceso del navegador a redes privadas esté habilitado intencionadamente.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` está desactivado por defecto; habilítalo solo cuando el acceso del navegador a redes privadas sea de confianza intencionadamente.
- `browser.ssrfPolicy.allowPrivateNetwork` sigue admitiéndose como alias heredado.

</Accordion>

<Accordion title="Comportamiento del perfil">

- `attachOnly: true` significa no iniciar nunca un navegador local; solo adjuntarse si ya hay uno en ejecución.
- `headless` se puede configurar globalmente o por perfil local gestionado. Los valores por perfil anulan `browser.headless`, por lo que un perfil iniciado localmente puede permanecer headless mientras otro sigue visible.
- `POST /start?headless=true` y `openclaw browser start --headless` solicitan un
  inicio headless de un solo uso para perfiles locales gestionados sin reescribir
  `browser.headless` ni la configuración del perfil. Los perfiles de sesión existente, attach-only y
  CDP remoto rechazan la anulación porque OpenClaw no inicia esos
  procesos de navegador.
- En hosts Linux sin `DISPLAY` ni `WAYLAND_DISPLAY`, los perfiles locales gestionados
  pasan a headless automáticamente cuando ni el entorno ni la configuración de perfil/global
  eligen explícitamente el modo con interfaz. `openclaw browser status --json`
  informa `headlessSource` como `env`, `profile`, `config`,
  `request`, `linux-display-fallback` o `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` fuerza los inicios locales gestionados en modo headless para el
  proceso actual. `OPENCLAW_BROWSER_HEADLESS=0` fuerza el modo con interfaz para los
  inicios ordinarios y devuelve un error accionable en hosts Linux sin servidor de pantalla;
  una solicitud explícita `start --headless` sigue teniendo prioridad para ese inicio.
- `executablePath` se puede configurar globalmente o por perfil local gestionado. Los valores por perfil anulan `browser.executablePath`, por lo que distintos perfiles gestionados pueden iniciar distintos navegadores basados en Chromium. Ambas formas aceptan `~` para el directorio de inicio de tu sistema operativo.
- `color` (de nivel superior y por perfil) tiñe la interfaz del navegador para que puedas ver qué perfil está activo.
- El perfil predeterminado es `openclaw` (independiente gestionado). Usa `defaultProfile: "user"` para optar por el navegador de usuario con sesión iniciada.
- Orden de detección automática: navegador predeterminado del sistema si está basado en Chromium; de lo contrario Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` usa Chrome DevTools MCP en lugar de CDP sin procesar. Puede adjuntarse mediante la conexión automática de Chrome MCP o mediante `cdpUrl` cuando ya tienes un endpoint de DevTools para el navegador en ejecución.
- Configura `browser.profiles.<name>.userDataDir` cuando un perfil de sesión existente deba adjuntarse a un perfil de usuario de Chromium no predeterminado (Brave, Edge, etc.). Esta ruta también acepta `~` para el directorio de inicio de tu sistema operativo.

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
inicia. Los perfiles `existing-session` se adjuntan a un navegador que ya está en ejecución
en su lugar, y los perfiles CDP remotos usan el navegador detrás de `cdpUrl`.

## Control local frente a remoto

- **Control local (predeterminado):** el Gateway inicia el servicio de control loopback y puede iniciar un navegador local.
- **Control remoto (host de Node):** ejecuta un host de Node en la máquina que tiene el navegador; el Gateway aplica proxy a las acciones del navegador hacia él.
- **CDP remoto:** configura `browser.profiles.<name>.cdpUrl` (o `browser.cdpUrl`) para
  adjuntarte a un navegador remoto basado en Chromium. En este caso, OpenClaw no iniciará un navegador local.
- Para servicios CDP gestionados externamente en loopback (por ejemplo Browserless en
  Docker publicado en `127.0.0.1`), configura también `attachOnly: true`. CDP en loopback
  sin `attachOnly` se trata como un perfil de navegador local gestionado por OpenClaw.
- `headless` solo afecta a los perfiles locales gestionados que OpenClaw inicia. No reinicia ni cambia navegadores de sesión existente o CDP remotos.
- `executablePath` sigue la misma regla de perfil local gestionado. Cambiarlo en un
  perfil local gestionado en ejecución marca ese perfil para reinicio/reconciliación, de modo que el
  siguiente inicio use el nuevo binario.

El comportamiento al detener varía según el modo del perfil:

- perfiles locales gestionados: `openclaw browser stop` detiene el proceso del navegador que
  OpenClaw inició
- perfiles attach-only y CDP remotos: `openclaw browser stop` cierra la sesión de
  control activa y libera las anulaciones de emulación de Playwright/CDP (viewport,
  esquema de color, locale, zona horaria, modo sin conexión y estado similar), aunque
  OpenClaw no haya iniciado ningún proceso de navegador

Las URL CDP remotas pueden incluir autenticación:

- Tokens de consulta (p. ej., `https://provider.example?token=<token>`)
- Autenticación HTTP Basic (p. ej., `https://user:pass@provider.example`)

OpenClaw conserva la autenticación al llamar a endpoints `/json/*` y al conectarse
al WebSocket CDP. Prefiere variables de entorno o gestores de secretos para
tokens en lugar de confirmarlos en archivos de configuración.

## Proxy de navegador de Node (predeterminado sin configuración)

Si ejecutas un **host de Node** en la máquina que tiene tu navegador, OpenClaw puede
enrutar automáticamente las llamadas a herramientas de navegador a ese nodo sin configuración adicional del navegador.
Esta es la ruta predeterminada para gateways remotos.

Notas:

- El host de Node expone su servidor local de control de navegador mediante un **comando de proxy**.
- Los perfiles provienen de la propia configuración `browser.profiles` del nodo (igual que localmente).
- `nodeHost.browserProxy.allowProfiles` es opcional. Déjalo vacío para el comportamiento heredado/predeterminado: todos los perfiles configurados siguen siendo accesibles mediante el proxy, incluidas las rutas de creación/eliminación de perfiles.
- Si configuras `nodeHost.browserProxy.allowProfiles`, OpenClaw lo trata como un límite de privilegio mínimo: solo se pueden seleccionar perfiles en la lista de permitidos, y las rutas persistentes de creación/eliminación de perfiles se bloquean en la superficie del proxy.
- Deshabilítalo si no lo quieres:
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
  `wss://` para una conexión CDP directa o conservar la URL HTTPS y dejar que OpenClaw
  descubra `/json/version`.

### Browserless Docker en el mismo host

Cuando Browserless se aloja por cuenta propia en Docker y OpenClaw se ejecuta en el host, trata
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
proceso de OpenClaw. Browserless también debe anunciar un endpoint accesible coincidente;
configura `EXTERNAL` de Browserless con esa misma base WebSocket pública para OpenClaw, como
`ws://127.0.0.1:3000`, `ws://browserless:3000` o una dirección de red Docker
privada estable. Si `/json/version` devuelve `webSocketDebuggerUrl` apuntando a
una dirección que OpenClaw no puede alcanzar, el HTTP de CDP puede parecer correcto mientras que la
conexión WebSocket sigue fallando.

No dejes `attachOnly` sin configurar para un perfil Browserless en loopback. Sin
`attachOnly`, OpenClaw trata el puerto loopback como un perfil de navegador local gestionado
y puede informar de que el puerto está en uso pero no es propiedad de OpenClaw.

## Proveedores CDP WebSocket directos

Algunos servicios de navegador alojados exponen un endpoint **WebSocket directo** en lugar del
descubrimiento CDP estándar basado en HTTP (`/json/version`). OpenClaw acepta tres
formas de URL CDP y elige automáticamente la estrategia de conexión adecuada:

- **Descubrimiento HTTP(S)** - `http://host[:port]` o `https://host[:port]`.
  OpenClaw llama a `/json/version` para descubrir la URL del depurador WebSocket y luego
  se conecta. Sin alternativa WebSocket.
- **Endpoints WebSocket directos** - `ws://host[:port]/devtools/<kind>/<id>` o
  `wss://...` con una ruta `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw se conecta directamente mediante un handshake WebSocket y omite
  `/json/version` por completo.
- **Raíces WebSocket simples** - `ws://host[:port]` o `wss://host[:port]` sin
  ruta `/devtools/...` (p. ej. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw intenta primero el descubrimiento HTTP
  `/json/version` (normalizando el esquema a `http`/`https`);
  si el descubrimiento devuelve un `webSocketDebuggerUrl`, se usa; de lo contrario, OpenClaw
  recurre a un handshake WebSocket directo en la raíz simple. Si el endpoint
  WebSocket anunciado rechaza el handshake CDP pero la raíz simple configurada
  lo acepta, OpenClaw también recurre a esa raíz. Esto permite que una raíz `ws://`
  simple que apunte a un Chrome local siga conectándose, ya que Chrome solo acepta upgrades WebSocket
  en la ruta específica por destino de `/json/version`, mientras que los proveedores
  alojados aún pueden usar su endpoint WebSocket raíz cuando su endpoint de descubrimiento
  anuncia una URL de corta duración que no es adecuada para Playwright CDP.

`openclaw browser doctor` usa la misma lógica de descubrimiento primero y alternativa WebSocket
que el adjunto en tiempo de ejecución, por lo que una URL de raíz simple que se conecta correctamente no se
informa como inaccesible en los diagnósticos.

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
  desde el [panel de información general](https://www.browserbase.com/overview).
- Reemplaza `<BROWSERBASE_API_KEY>` por tu clave de API real de Browserbase.
- Browserbase crea automáticamente una sesión de navegador al conectar por WebSocket, por lo que no
  se necesita ningún paso manual de creación de sesión.
- El nivel gratuito permite una sesión simultánea y una hora de navegador al mes.
  Consulta los [precios](https://www.browserbase.com/pricing) para ver los límites de los planes de pago.
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

- [Regístrate](https://console.notte.cc) y copia tu **API Key** desde la
  página de configuración de la consola.
- Reemplaza `<NOTTE_API_KEY>` por tu clave de API real de Notte.
- Notte crea automáticamente una sesión de navegador al conectar por WebSocket, por lo que no se necesita ningún paso manual
  de creación de sesión. La sesión se destruye cuando se desconecta el
  WebSocket.
- El nivel gratuito permite cinco sesiones simultáneas y 100 horas de navegador
  de por vida. Consulta los [precios](https://www.notte.cc/#pricing) para ver los límites de los planes de pago.
- Consulta la [documentación de Notte](https://docs.notte.cc) para obtener la referencia completa de la API, guías del SDK
  y ejemplos de integración.

## Seguridad

Ideas clave:

- El control del navegador es solo de loopback; el acceso fluye a través de la autenticación del Gateway o el emparejamiento de Node.
- La API HTTP de navegador de loopback independiente usa **solo autenticación con secreto compartido**:
  autenticación bearer con token del Gateway, `x-openclaw-password` o autenticación HTTP Basic con la
  contraseña configurada del Gateway.
- Los encabezados de identidad de Tailscale Serve y `gateway.auth.mode: "trusted-proxy"` no
  autentican esta API de navegador de loopback independiente.
- Si el control del navegador está habilitado y no hay configurada ninguna autenticación con secreto compartido, OpenClaw
  genera un token de Gateway solo de tiempo de ejecución para ese arranque. Configura
  `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` u
  `OPENCLAW_GATEWAY_PASSWORD` explícitamente si los clientes necesitan un secreto estable entre
  reinicios.
- OpenClaw **no** genera automáticamente ese token cuando `gateway.auth.mode` ya es
  `password`, `none` o `trusted-proxy`.
- Mantén el Gateway y cualquier host de Node en una red privada (Tailscale); evita la exposición pública.
- Trata las URL y los tokens de CDP remoto como secretos; prefiere variables de entorno o un gestor de secretos.

Consejos para CDP remoto:

- Prefiere endpoints cifrados (HTTPS o WSS) y tokens de corta duración cuando sea posible.
- Evita incrustar tokens de larga duración directamente en archivos de configuración.

## Perfiles (varios navegadores)

OpenClaw admite varios perfiles con nombre (configuraciones de enrutamiento). Los perfiles pueden ser:

- **administrado por openclaw**: una instancia dedicada de navegador basado en Chromium con su propio directorio de datos de usuario + puerto CDP
- **remoto**: una URL CDP explícita (navegador basado en Chromium ejecutándose en otro lugar)
- **sesión existente**: tu perfil de Chrome existente mediante conexión automática de Chrome DevTools MCP

Valores predeterminados:

- El perfil `openclaw` se crea automáticamente si falta.
- El perfil `user` está integrado para adjuntar a una sesión existente de Chrome MCP.
- Los perfiles de sesión existente son opcionales más allá de `user`; créalos con `--driver existing-session`.
- Los puertos CDP locales se asignan desde **18800-18899** de forma predeterminada.
- Al eliminar un perfil, su directorio de datos local se mueve a la Papelera.

Todos los endpoints de control aceptan `?profile=<name>`; la CLI usa `--browser-profile`.

## Sesión existente mediante Chrome DevTools MCP

OpenClaw también puede adjuntarse a un perfil de navegador basado en Chromium en ejecución mediante el
servidor oficial Chrome DevTools MCP. Esto reutiliza las pestañas y el estado de inicio de sesión
ya abiertos en ese perfil de navegador.

Referencias oficiales de contexto y configuración:

- [Chrome for Developers: Usa Chrome DevTools MCP con tu sesión de navegador](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README de Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Perfil integrado:

- `user`

Opcional: crea tu propio perfil personalizado de sesión existente si quieres un
nombre, color o directorio de datos de navegador diferente.

Comportamiento predeterminado:

- El perfil integrado `user` usa la conexión automática de Chrome MCP, que apunta al
  perfil local predeterminado de Google Chrome.

Usa `userDataDir` para Brave, Edge, Chromium o un perfil de Chrome no predeterminado.
`~` se expande al directorio de inicio de tu sistema operativo:

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

Prueba rápida de adjuntar en vivo:

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
- `snapshot` devuelve referencias de la pestaña en vivo seleccionada

Qué comprobar si adjuntar no funciona:

- el navegador de destino basado en Chromium tiene la versión `144+`
- la depuración remota está habilitada en la página de inspección de ese navegador
- el navegador mostró la solicitud de consentimiento para adjuntar y la aceptaste
- si Chrome se inició con un `--remote-debugging-port` explícito, establece
  `browser.profiles.<name>.cdpUrl` en ese endpoint de DevTools en lugar de depender
  de la conexión automática de Chrome MCP
- `openclaw doctor` migra la configuración antigua de navegador basada en extensiones y comprueba que
  Chrome esté instalado localmente para los perfiles predeterminados de conexión automática, pero no puede
  habilitar por ti la depuración remota del lado del navegador

Uso del agente:

- Usa `profile="user"` cuando necesites el estado de navegador con sesión iniciada del usuario.
- Si usas un perfil personalizado de sesión existente, pasa ese nombre de perfil explícito.
- Elige este modo solo cuando el usuario esté frente al ordenador para aprobar la solicitud
  de adjuntar.
- el Gateway o el host de Node puede iniciar `npx chrome-devtools-mcp@latest --autoConnect`

Notas:

- Esta ruta implica mayor riesgo que el perfil aislado `openclaw` porque puede
  actuar dentro de tu sesión de navegador iniciada.
- OpenClaw no inicia el navegador para este controlador; solo se adjunta.
- OpenClaw usa aquí el flujo oficial `--autoConnect` de Chrome DevTools MCP. Si
  `userDataDir` está definido, se pasa para apuntar a ese directorio de datos de usuario.
- La sesión existente puede adjuntarse en el host seleccionado o a través de un
  Node de navegador conectado. Si Chrome vive en otro lugar y no hay ningún Node de navegador conectado, usa
  CDP remoto o un host de Node en su lugar.

### Lanzamiento personalizado de Chrome MCP

Sobrescribe el servidor Chrome DevTools MCP iniciado por perfil cuando el flujo predeterminado
`npx chrome-devtools-mcp@latest` no sea lo que quieres (hosts sin conexión,
versiones fijadas, binarios vendorizados):

| Campo        | Qué hace                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Ejecutable que se inicia en lugar de `npx`. Se resuelve tal cual; se respetan las rutas absolutas.                                          |
| `mcpArgs`    | Arreglo de argumentos pasado literalmente a `mcpCommand`. Reemplaza los argumentos predeterminados `chrome-devtools-mcp@latest --autoConnect`. |

Cuando `cdpUrl` se define en un perfil de sesión existente, OpenClaw omite
`--autoConnect` y reenvía automáticamente el endpoint a Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (endpoint de descubrimiento HTTP de DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (WebSocket CDP directo).

Las flags de endpoint y `userDataDir` no se pueden combinar: cuando `cdpUrl` está definido,
`userDataDir` se ignora para el lanzamiento de Chrome MCP, ya que Chrome MCP se adjunta al
navegador en ejecución detrás del endpoint en lugar de abrir un directorio de
perfil.

<Accordion title="Existing-session feature limitations">

En comparación con el perfil administrado `openclaw`, los controladores de sesión existente están más restringidos:

- **Capturas de pantalla** - las capturas de página y las capturas de elementos con `--ref` funcionan; los selectores CSS `--element` no. `--full-page` no puede combinarse con `--ref` ni `--element`. Playwright no es necesario para capturas de pantalla de página o de elementos basadas en referencias.
- **Acciones** - `click`, `type`, `hover`, `scrollIntoView`, `drag` y `select` requieren referencias de instantánea (sin selectores CSS). `click-coords` hace clic en coordenadas visibles del viewport y no requiere una referencia de instantánea. `click` solo usa el botón izquierdo. `type` no admite `slowly=true`; usa `fill` o `press`. `press` no admite `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` y `evaluate` no admiten timeouts por llamada. `select` acepta un único valor.
- **Espera / carga / diálogo** - `wait --url` admite patrones exactos, de subcadena y glob; `wait --load networkidle` no es compatible con perfiles de sesión existente (funciona en perfiles administrados y perfiles CDP sin procesar/remotos). Los hooks de carga requieren `ref` o `inputRef`, un archivo a la vez, sin `element` CSS. Los hooks de diálogo no admiten sobrescrituras de timeout ni `dialogId`.
- **Visibilidad de diálogos** - Las respuestas de acciones del navegador administrado incluyen `blockedByDialog` y `browserState.dialogs.pending` cuando una acción abre un diálogo modal; las instantáneas también incluyen el estado de diálogo pendiente. Responde con `browser dialog --accept/--dismiss --dialog-id <id>` mientras haya un diálogo pendiente. Los diálogos gestionados fuera de OpenClaw aparecen en `browserState.dialogs.recent`.
- **Funciones solo administradas** - las acciones por lotes, la exportación a PDF, la interceptación de descargas y `responsebody` siguen requiriendo la ruta de navegador administrado.

</Accordion>

## Garantías de aislamiento

- **Directorio de datos de usuario dedicado**: nunca toca tu perfil de navegador personal.
- **Puertos dedicados**: evita `9222` para prevenir colisiones con flujos de trabajo de desarrollo.
- **Control determinista de pestañas**: `tabs` devuelve primero `suggestedTargetId`, luego
  identificadores estables `tabId` como `t1`, etiquetas opcionales y el `targetId` sin procesar.
  Los agentes deben reutilizar `suggestedTargetId`; los id sin procesar siguen disponibles para
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
  `/usr/lib/chromium-browser`, además de Chromium administrado por Playwright bajo
  `PLAYWRIGHT_BROWSERS_PATH` o `~/.cache/ms-playwright`.
- Windows: comprueba ubicaciones de instalación comunes.

## API de control (opcional)

Para scripts y depuración, el Gateway expone una pequeña **API HTTP de control
solo de loopback** más una CLI `openclaw browser` correspondiente (instantáneas, referencias, espera
potenciada, salida JSON, flujos de depuración). Consulta
[API de control del navegador](/es/tools/browser-control) para la referencia completa.

## Solución de problemas

Para problemas específicos de Linux (especialmente Chromium snap), consulta
[Solución de problemas del navegador](/es/tools/browser-linux-troubleshooting).

Para configuraciones WSL2 Gateway + Windows Chrome con host dividido, consulta
[Solución de problemas de WSL2 + Windows + CDP remoto de Chrome](/es/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Fallo de arranque de CDP frente a bloqueo SSRF de navegación

Estas son clases de fallo distintas y apuntan a rutas de código distintas.

- **Fallo de arranque o preparación de CDP** significa que OpenClaw no puede confirmar que el plano de control del navegador esté en buen estado.
- **Bloqueo SSRF de navegación** significa que el plano de control del navegador está en buen estado, pero la política rechaza un destino de navegación de página.

Ejemplos comunes:

- Fallo de arranque o preparación de CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` cuando se configura un
    servicio CDP externo de loopback sin `attachOnly: true`
- Bloqueo SSRF de navegación:
  - Los flujos de `open`, `navigate`, captura de estado o apertura de pestañas fallan con un error de política de navegador/red mientras `start` y `tabs` siguen funcionando

Usa esta secuencia mínima para separar ambos casos:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Cómo leer los resultados:

- Si `start` falla con `not reachable after start`, soluciona primero la preparación de CDP.
- Si `start` se completa correctamente pero `tabs` falla, el plano de control sigue en mal estado. Trátalo como un problema de alcanzabilidad de CDP, no como un problema de navegación de página.
- Si `start` y `tabs` se completan correctamente pero `open` o `navigate` falla, el plano de control del navegador está activo y el fallo está en la política de navegación o en la página de destino.
- Si `start`, `tabs` y `open` se completan correctamente, la ruta básica de control del navegador gestionado está en buen estado.

Detalles importantes de comportamiento:

- La configuración del navegador usa de forma predeterminada un objeto de política SSRF de cierre seguro incluso cuando no configuras `browser.ssrfPolicy`.
- Para el perfil gestionado local loopback `openclaw`, las comprobaciones de estado de CDP omiten intencionadamente la aplicación de alcanzabilidad SSRF del navegador para el propio plano de control local de OpenClaw.
- La protección de navegación es independiente. Un resultado correcto de `start` o `tabs` no significa que se permita un destino posterior de `open` o `navigate`.

Guía de seguridad:

- **No** relajes la política SSRF del navegador de forma predeterminada.
- Prefiere excepciones de host específicas como `hostnameAllowlist` o `allowedHostnames` en lugar de un acceso amplio a redes privadas.
- Usa `dangerouslyAllowPrivateNetwork: true` solo en entornos intencionadamente confiables donde el acceso del navegador a redes privadas sea necesario y haya sido revisado.

## Herramientas del agente + cómo funciona el control

El agente recibe **una herramienta** para la automatización del navegador:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Cómo se asigna:

- `browser snapshot` devuelve un árbol de IU estable (IA o ARIA).
- `browser act` usa los ID `ref` de la captura de estado para hacer clic/escribir/arrastrar/seleccionar.
- `browser screenshot` captura píxeles (página completa, elemento o refs etiquetadas).
- `browser doctor` comprueba la preparación de Gateway, Plugin, perfil, navegador y pestaña.
- `browser` acepta:
  - `profile` para elegir un perfil de navegador con nombre (openclaw, chrome o CDP remoto).
  - `target` (`sandbox` | `host` | `node`) para seleccionar dónde vive el navegador.
  - En sesiones en entorno aislado, `target: "host"` requiere `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Si se omite `target`: las sesiones en entorno aislado usan `sandbox` de forma predeterminada; las sesiones sin entorno aislado usan `host` de forma predeterminada.
  - Si hay un nodo compatible con navegador conectado, la herramienta puede enrutar automáticamente hacia él a menos que fijes `target="host"` o `target="node"`.

Esto mantiene al agente determinista y evita selectores frágiles.

## Relacionado

- [Resumen de herramientas](/es/tools) - todas las herramientas de agente disponibles
- [Entorno aislado](/es/gateway/sandboxing) - control del navegador en entornos aislados
- [Seguridad](/es/gateway/security) - riesgos y endurecimiento del control del navegador
