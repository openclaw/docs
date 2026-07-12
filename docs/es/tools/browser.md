---
read_when:
    - Adición de automatización del navegador controlada por el agente
    - Depuración de por qué OpenClaw interfiere con tu propia instalación de Chrome
    - Implementación de la configuración y el ciclo de vida del navegador en la aplicación para macOS
summary: Servicio integrado de control del navegador + comandos de acción
title: Navegador (gestionado por OpenClaw)
x-i18n:
    generated_at: "2026-07-12T14:50:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cf43bd54994d29d48cfc1e16889ec34af83e885c1dd1b63c287f0df116c7f0bf
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw puede ejecutar un **perfil dedicado de Chrome/Brave/Edge/Chromium** controlado por el agente. Funciona mediante un pequeño servicio de control local dentro del Gateway (solo bucle invertido) y está aislado del navegador personal.

- Se puede considerar un **navegador independiente y exclusivo para el agente**. El perfil `openclaw` nunca interactúa con el perfil del navegador personal.
- El agente abre pestañas, lee páginas, hace clic y escribe en este entorno aislado.
- En cambio, el perfil integrado `user` se conecta a la sesión real iniciada en Chrome mediante Chrome DevTools MCP.

## Qué se obtiene

- Un perfil de navegador independiente llamado **openclaw** (con detalle naranja de forma predeterminada).
- Control determinista de pestañas (listar/abrir/enfocar/cerrar).
- Acciones del agente (hacer clic/escribir/arrastrar/seleccionar), instantáneas, capturas de pantalla y archivos PDF.
- Los perfiles basados en Playwright guardan las navegaciones directas a archivos adjuntos en el directorio de descargas administrado y devuelven metadatos `{ url, suggestedFilename, path }` después de validar la política de la URL final.
- Las acciones del agente basadas en Playwright devuelven un arreglo `downloads` con los mismos metadatos administrados cuando la acción inicia inmediatamente una o más descargas.
- Una skill `browser-automation` incluida que enseña a los agentes el ciclo de recuperación de instantáneas,
  pestañas estables, referencias obsoletas y bloqueos manuales cuando el Plugin del navegador
  está habilitado.
- Compatibilidad opcional con varios perfiles (`openclaw`, `work`, `remote`, ...).

Este navegador **no** está destinado al uso cotidiano. Es una superficie segura y aislada para
la automatización y verificación por parte del agente.

En macOS, se pueden copiar explícitamente cookies de un perfil del sistema basado en Chrome a un perfil administrado independiente. El navegador administrado sigue utilizando su propio directorio de datos de usuario; solo se copian las cookies seleccionadas, mientras que el almacenamiento local e IndexedDB no se transfieren. Consulte [Perfiles](#profiles-multi-browser) o la [referencia de la CLI `openclaw browser`](/es/cli/browser) para conocer los comandos de importación y sus limitaciones.

## Inicio rápido

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

«Navegador deshabilitado» significa que el Plugin o `browser.enabled` está desactivado; consulte
[Configuración](#configuration) y [Control del Plugin](#plugin-control).

Si `openclaw browser` no está disponible en absoluto o el agente indica que la herramienta del navegador
no está disponible, vaya a [Falta el comando o la herramienta del navegador](#missing-browser-command-or-tool).

## Control del Plugin

La herramienta `browser` predeterminada es un Plugin incluido. Deshabilítelo para sustituirlo por otro Plugin que registre el mismo nombre de herramienta `browser`:

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

Los valores predeterminados necesitan tanto `plugins.entries.browser.enabled` **como** `browser.enabled=true`. Deshabilitar únicamente el Plugin elimina como una sola unidad la CLI `openclaw browser`, el método del Gateway `browser.request`, la herramienta del agente y el servicio de control; la configuración `browser.*` permanece intacta para un reemplazo.

Los cambios en la configuración del navegador requieren reiniciar el Gateway para que el Plugin pueda volver a registrar su servicio.

## Orientación para agentes

Nota sobre el perfil de herramientas: `tools.profile: "coding"` incluye `web_search` y
`web_fetch`, pero no la herramienta `browser` completa. Para permitir que el agente o un
subagente generado utilice la automatización del navegador, añada el navegador en la etapa
del perfil:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Para un solo agente, utilice `agents.list[].tools.alsoAllow: ["browser"]`.
`tools.subagents.tools.allow: ["browser"]` por sí solo no es suficiente porque la política de los subagentes
se aplica después del filtrado por perfil.

El Plugin del navegador incluye dos niveles de orientación para agentes:

- La descripción de la herramienta `browser` contiene el contrato compacto siempre activo: elegir
  el perfil correcto, mantener las referencias en la misma pestaña, utilizar `tabId`/etiquetas para seleccionar
  pestañas y cargar la skill del navegador para tareas de varios pasos.
- La skill `browser-automation` incluida contiene el ciclo operativo más extenso:
  comprobar primero el estado y las pestañas, etiquetar las pestañas de la tarea, crear una instantánea antes de actuar, volver a crearla
  después de cambios en la interfaz de usuario, recuperar una vez las referencias obsoletas e informar de bloqueos de inicio de sesión/2FA/captcha o
  cámara/micrófono como acciones manuales en lugar de hacer suposiciones.

Las skills incluidas en el Plugin aparecen entre las skills disponibles del agente cuando el
Plugin está habilitado. Las instrucciones completas de la skill se cargan bajo demanda, de modo que los turnos
rutinarios no incurren en el coste total de tokens.

## Falta el comando o la herramienta del navegador

Si `openclaw browser` no se reconoce después de una actualización, falta `browser.request` o el agente informa que la herramienta del navegador no está disponible, la causa habitual es una lista `plugins.allow` que omite `browser` y la ausencia de un bloque raíz de configuración `browser`. Añádalo:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Un bloque raíz `browser` explícito (cualquier clave bajo `browser`, como
`browser.enabled=true` o `browser.profiles.<name>`) activa el Plugin del navegador incluido
incluso con un `plugins.allow` restrictivo, de acuerdo con el comportamiento de la configuración
de canales incluidos. `plugins.entries.browser.enabled=true` y
`tools.alsoAllow: ["browser"]` no sustituyen por sí solos la pertenencia a la lista de permitidos.
Eliminar por completo `plugins.allow` también restaura el valor predeterminado.

## Perfiles: `openclaw`, `user`, `chrome`

- `openclaw`: navegador administrado y aislado (no requiere extensión).
- `user`: perfil integrado de conexión mediante Chrome DevTools MCP para la sesión **real
  iniciada en Chrome**. Chrome muestra un mensaje bloqueante «Allow remote debugging?»
  la primera vez que OpenClaw se conecta, por lo que debe haber alguien ante el equipo.
- `chrome`: perfil integrado de la [extensión de Chrome](/es/tools/chrome-extension) para
  la sesión **real iniciada en Chrome**. Funciona desde un teléfono sin que haya nadie ante el
  equipo porque controla las pestañas mediante la extensión de navegador de OpenClaw en lugar del
  puerto de depuración remota, por lo que no aparece el mensaje «Allow remote debugging?».

Para las llamadas del agente a la herramienta del navegador:

- De forma predeterminada, utilice el navegador aislado `openclaw`.
- Utilice preferentemente `profile="chrome"` (extensión) cuando las sesiones con inicio de sesión existentes sean importantes
  y el usuario esté **lejos del equipo** (Telegram, WhatsApp, etc.).
- Utilice preferentemente `profile="user"` (Chrome MCP) cuando las sesiones con inicio de sesión existentes sean importantes
  y el usuario esté **ante el equipo** para aprobar el mensaje de conexión.
- `profile` es la anulación explícita cuando se desea un modo de navegador específico.

Establezca `browser.defaultProfile: "openclaw"` si desea utilizar el modo administrado de forma predeterminada.

## Configuración

La configuración del navegador se encuentra en `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // predeterminado: true
    evaluateEnabled: true, // predeterminado: true; false deshabilita act:evaluate (JS arbitrario)
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // habilitar solo para acceso de confianza a redes privadas
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // anulación heredada para un solo perfil
    remoteCdpTimeoutMs: 1500, // tiempo de espera HTTP de CDP remoto (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // tiempo de espera del protocolo de enlace WebSocket de CDP remoto (ms)
    localLaunchTimeoutMs: 15000, // tiempo de espera para detectar Chrome administrado local (ms)
    localCdpReadyTimeoutMs: 8000, // tiempo de espera de preparación de CDP local tras el inicio (ms)
    actionTimeoutMs: 60000, // tiempo de espera predeterminado de las acciones del navegador (ms)
    tabCleanup: {
      enabled: true, // predeterminado: true
      idleMinutes: 120, // establecer en 0 para deshabilitar la limpieza por inactividad
      maxTabsPerSession: 8, // establecer en 0 para deshabilitar el límite por sesión
      sweepMinutes: 5,
    },
    // snapshotDefaults: { mode: "efficient" }, // modo de instantánea predeterminado cuando el llamador no especifica uno
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

`browser.snapshotDefaults.mode: "efficient"` cambia el modo de extracción predeterminado de `snapshot`
cuando el llamador no proporciona un `snapshotFormat` o `mode` explícito; consulte la
[API de control del navegador](/es/tools/browser-control) para conocer las opciones de instantánea
por llamada.

### Visión de capturas de pantalla (compatibilidad con modelos de solo texto)

Cuando el modelo principal es de solo texto (sin compatibilidad con visión/multimodal), las capturas de pantalla
del navegador devuelven bloques de imagen que el modelo no puede leer. Las capturas de pantalla del navegador
reutilizan la configuración existente de comprensión de imágenes, por lo que un modelo de imagen
configurado para comprender contenido multimedia puede describir las capturas como texto sin ninguna
configuración de modelo específica del navegador.

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // Añada candidatos alternativos; se utiliza el primero que tenga éxito
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // Los modelos multimedia compartidos también funcionan cuando están etiquetados para admitir imágenes.
      // models: [{ provider: "openai", model: "gpt-4o", capabilities: ["image"] }],
    },
  },
  agents: {
    defaults: {
      // También se respetan los valores predeterminados existentes del modelo de imagen.
      // imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

**Cómo funciona:**

1. El agente llama a `browser screenshot` y la imagen se captura en el disco como de costumbre.
2. La herramienta del navegador consulta al entorno de ejecución existente de comprensión de imágenes si
   puede describir la captura utilizando los modelos de imagen multimedia configurados, los modelos multimedia
   compartidos, los valores predeterminados del modelo de imagen o un proveedor de imágenes respaldado por autenticación.
3. El modelo de visión devuelve una descripción de texto, que se encapsula con
   `wrapExternalContent` (protección contra inyección de prompts) y se devuelve al agente
   como un bloque de texto en lugar de un bloque de imagen.
4. Si la comprensión de imágenes no está disponible, se omite o falla, el navegador
   vuelve a devolver el bloque de imagen original.

Los bloques de imagen de las capturas de pantalla son resultados privados de la herramienta: el agente puede inspeccionarlos,
pero OpenClaw no los adjunta automáticamente a las respuestas de los canales. Para compartir una
captura de pantalla, solicite al agente que la envíe explícitamente con la herramienta de mensajes.

Utilice los campos existentes `tools.media.image` / `tools.media.models` para los modelos
alternativos, tiempos de espera, límites de bytes, perfiles y configuración de solicitudes del proveedor.

Si el modelo principal activo ya admite visión y no se ha configurado ningún modelo explícito
de comprensión de imágenes, OpenClaw conserva el resultado de imagen normal para que el
modelo principal pueda leer directamente la captura de pantalla.

<AccordionGroup>

<Accordion title="Puertos y accesibilidad">

- El servicio de control se vincula a la interfaz de bucle invertido en un puerto derivado de `gateway.port` (valor predeterminado `18791` = Gateway + 2). `OPENCLAW_GATEWAY_PORT` tiene prioridad sobre `gateway.port`; cualquiera de los dos desplaza los puertos derivados de la misma familia.
- Los perfiles locales de `openclaw` asignan automáticamente `cdpPort`/`cdpUrl` de un intervalo que comienza 9 puertos por encima del puerto de control (valor predeterminado `18800`-`18899`); configúrelos solo para
  perfiles CDP remotos o para conectarse al endpoint de una sesión existente. Cuando no se establece, `cdpUrl` usa de forma predeterminada
  el puerto CDP local administrado.
- `remoteCdpTimeoutMs` se aplica a las comprobaciones de accesibilidad HTTP de CDP
  remoto y `attachOnly`, así como a las solicitudes HTTP para abrir pestañas; `remoteCdpHandshakeTimeoutMs` se aplica a
  sus negociaciones WebSocket de CDP. La enumeración persistente de pestañas remotas de Playwright
  usa el mayor de los dos como plazo de la operación.
- `localLaunchTimeoutMs` es el tiempo disponible para que un proceso de Chrome administrado
  iniciado localmente exponga su endpoint HTTP de CDP. `localCdpReadyTimeoutMs` es el
  tiempo adicional para que el WebSocket de CDP esté listo una vez detectado el proceso.
  Aumente estos valores en Raspberry Pi, VPS de gama baja o hardware antiguo donde Chromium
  se inicie lentamente. Los valores deben ser enteros positivos de hasta `120000` ms; los valores
  de configuración no válidos se rechazan.
- Los fallos repetidos de inicio o preparación de Chrome administrado activan un cortacircuitos por
  perfil. Tras varios fallos consecutivos, OpenClaw pausa brevemente los nuevos intentos de
  inicio en lugar de generar Chromium en cada llamada a una herramienta del navegador. Corrija
  el problema de inicio, desactive el navegador si no es necesario o reinicie el
  Gateway después de la reparación.
- `actionTimeoutMs` es el tiempo predeterminado para las solicitudes `act` del navegador cuando el invocador no proporciona `timeoutMs`. El transporte del cliente añade un pequeño margen para que las esperas prolongadas puedan finalizar en lugar de agotar el tiempo de espera en el límite HTTP.
- `tabCleanup` realiza, en la medida de lo posible, la limpieza de las pestañas abiertas por sesiones de navegador del agente principal. La limpieza del ciclo de vida de subagentes, cron y ACP sigue cerrando sus pestañas explícitamente rastreadas al finalizar la sesión; las sesiones principales mantienen reutilizables las pestañas activas y luego cierran en segundo plano las pestañas rastreadas inactivas o sobrantes.

</Accordion>

<Accordion title="Política de SSRF">

- Las solicitudes de navegación del navegador y de apertura de pestañas se comprueban previamente. Durante la acción y un período de gracia limitado posterior, las interacciones protegidas de Playwright (clic, clic por coordenadas, desplazamiento del puntero, arrastre, desplazamiento, selección, pulsación, escritura, rellenado de formularios y evaluación) interceptan las cargas de documentos del nivel superior y de submarcos que la política deniega antes de que se envíen bytes de la solicitud HTTP y, a continuación, vuelven a comprobar en la medida de lo posible la URL `http(s)` final.
- Antes de cada nuevo inicio de Chrome administrado por OpenClaw, OpenClaw desactiva en la medida de lo posible la predicción de red, lo que suprime la preconexión especulativa observada de Chromium para esas cargas denegadas. Esta es una defensa en profundidad, no un límite de la política: un navegador reutilizado tras reiniciar el servicio de control y otros backends de navegador podrían no compartir esta protección. El enrutamiento de Playwright sigue sin ser un cortafuegos de red y no intercepta los saltos de redirección, la primera solicitud de una ventana emergente, el tráfico de Service Worker, el código de la página que se ejecuta después del período limitado de protección ni todas las rutas de recursos secundarios o en segundo plano. El aislamiento completo del tráfico de salida requiere aislamiento por parte del propietario o un proxy que aplique la política.
- En el modo SSRF estricto, también se comprueban la detección de endpoints CDP remotos y las sondas de `/json/version` (`cdpUrl`).
- Las variables de entorno `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` y `NO_PROXY` del Gateway/proveedor no redirigen automáticamente mediante proxy el navegador administrado por OpenClaw. Chrome administrado se inicia directamente de forma predeterminada para que la configuración del proxy del proveedor no debilite las comprobaciones SSRF del navegador.
- Las sondas locales de preparación de CDP administradas por OpenClaw y las conexiones WebSocket de DevTools omiten el proxy de red administrado para el endpoint de bucle invertido exacto iniciado, por lo que `openclaw browser start` sigue funcionando cuando un proxy del operador bloquea el tráfico de salida de bucle invertido.
- Para redirigir mediante proxy el propio navegador administrado, proporcione indicadores explícitos del proxy de Chrome mediante `browser.extraArgs`, como `--proxy-server=...` o `--proxy-pac-url=...`. El modo SSRF estricto bloquea el enrutamiento explícito del proxy del navegador, salvo que se habilite intencionadamente el acceso del navegador a la red privada.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` está desactivado de forma predeterminada; habilítelo solo cuando se confíe intencionadamente en el acceso del navegador a la red privada.
- `browser.ssrfPolicy.allowPrivateNetwork` sigue siendo compatible como alias heredado.

</Accordion>

<Accordion title="Comportamiento de los perfiles">

- `attachOnly: true` significa que nunca se inicia un navegador local; solo se establece la conexión si ya hay uno en ejecución.
- `headless` se puede establecer globalmente o por cada perfil local administrado. Los valores específicos del perfil prevalecen sobre `browser.headless`, por lo que un perfil iniciado localmente puede permanecer sin interfaz gráfica mientras otro sigue siendo visible.
- `POST /start?headless=true` y `openclaw browser start --headless` solicitan un
  inicio puntual sin interfaz gráfica para los perfiles locales administrados sin reescribir
  `browser.headless` ni la configuración del perfil. Los perfiles de sesión existente, de solo conexión y
  CDP remotos rechazan la sobrescritura porque OpenClaw no inicia esos
  procesos de navegador.
- En hosts Linux sin `DISPLAY` ni `WAYLAND_DISPLAY`, los perfiles locales administrados
  usan automáticamente de forma predeterminada el modo sin interfaz gráfica cuando ni el entorno ni la configuración
  global o del perfil eligen explícitamente el modo con interfaz gráfica. Use la forma inequívoca a nivel del navegador
  `openclaw browser --json status`; `openclaw browser status --json` al final
  también funciona porque `status` no define su propio `--json`. El comando indica
  `headlessSource` como `env`, `profile`, `config`,
  `request`, `linux-display-fallback` o `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` fuerza los inicios locales administrados sin interfaz gráfica para el
  proceso actual. `OPENCLAW_BROWSER_HEADLESS=0` fuerza el modo con interfaz gráfica para los inicios
  normales y devuelve un error que indica cómo actuar en hosts Linux sin servidor de pantalla;
  una solicitud explícita `start --headless` sigue teniendo prioridad para ese inicio.
- La ruta de control del navegador y el cliente programático conservan el `error` legible
  por humanos del error por falta de pantalla y exponen el motivo estable
  `no_display_for_headed_profile`. Sus `details` contienen únicamente `profile`,
  `requestedHeadless`, `headlessSource` y `displayPresent`, para que los clientes de la API puedan
  elegir la solución correcta sin comparar el texto del mensaje.
- Para un perfil local administrado en ejecución, el estado y doctor consultan el
  endpoint CDP del navegador de Chrome para obtener el estado del renderizador, el backend,
  el dispositivo/controlador y las funcionalidades, las soluciones alternativas del controlador y las
  capacidades de vídeo acelerado. El resultado se almacena en caché para ese proceso del navegador y se expone
  por completo mediante `openclaw browser --json status`. Una llamada de estado pasiva no inicia Chrome.
  Los navegadores de sesión existente, extensión, CDP remoto y sandbox permanecen separados
  y no se inspeccionan mediante esta ruta de host administrado.
- Chrome administrado sin interfaz gráfica sigue usando el valor predeterminado conservador `--disable-gpu`.
  Los diagnósticos no habilitan la aceleración, no añaden una configuración global de aceleración
  ni conceden al navegador sandbox acceso a dispositivos.
- `executablePath` se puede establecer globalmente o por cada perfil local administrado. Los valores específicos del perfil prevalecen sobre `browser.executablePath`, por lo que distintos perfiles administrados pueden iniciar diferentes navegadores basados en Chromium. Ambas formas aceptan `~` para el directorio de inicio del sistema operativo.
- `color` (en el nivel superior y por perfil) aplica un color a la interfaz del navegador para que pueda identificar qué perfil está activo.
- El perfil predeterminado es `openclaw` (instancia independiente administrada). Use `defaultProfile: "user"` para optar por el navegador del usuario con la sesión iniciada.
- Orden de detección automática: navegador predeterminado del sistema si está basado en Chromium; de lo contrario, Chrome, Brave, Edge, Chromium y Chrome Canary.
- `driver: "existing-session"` usa Chrome DevTools MCP en lugar de CDP sin procesar. Puede conectarse mediante la conexión automática de Chrome MCP o mediante `cdpUrl` cuando ya se dispone de un endpoint de DevTools para el navegador en ejecución.
- `driver: "extension"` controla Chrome con la sesión iniciada mediante la [extensión de Chrome de OpenClaw](/es/tools/chrome-extension). El relé controla su endpoint de bucle invertido, por lo que estos perfiles no aceptan `cdpUrl`. Este es el único modo de navegador con sesión iniciada que funciona sin nadie frente al equipo.
- Establezca `browser.profiles.<name>.userDataDir` cuando un perfil de sesión existente deba conectarse a un perfil de usuario de Chromium que no sea el predeterminado (Brave, Edge, etc.). Esta ruta también acepta `~` para el directorio de inicio del sistema operativo.

</Accordion>

</AccordionGroup>

## Usar Brave u otro navegador basado en Chromium

Si el navegador **predeterminado del sistema** está basado en Chromium (Chrome/Brave/Edge/etc.),
OpenClaw lo usa automáticamente. Establezca `browser.executablePath` para sobrescribir la
detección automática. Los valores de `executablePath` del nivel superior y por perfil aceptan `~`
para el directorio de inicio del sistema operativo:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

O configúrelo en la configuración, según la plataforma:

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

El valor `executablePath` de cada perfil solo afecta a los perfiles administrados locales que inicia OpenClaw. Los perfiles `existing-session` se conectan, en cambio, a un navegador que ya está en ejecución, y los perfiles CDP remotos usan el navegador especificado mediante `cdpUrl`.

## Control local frente a remoto

- **Control local (predeterminado):** el Gateway inicia el servicio de control de bucle invertido y puede iniciar un navegador local.
- **Control remoto (host del Node):** ejecute un host del Node en la máquina que tiene el navegador; el Gateway actúa como proxy de las acciones del navegador hacia él.
- **CDP remoto:** establezca `browser.profiles.<name>.cdpUrl` (o `browser.cdpUrl`) para conectarse a un navegador remoto basado en Chromium. En este caso, OpenClaw no iniciará un navegador local.
- Para los servicios CDP administrados externamente en la interfaz de bucle invertido (por ejemplo, Browserless en Docker publicado en `127.0.0.1`), establezca también `attachOnly: true`. Un CDP en la interfaz de bucle invertido sin `attachOnly` se trata como un perfil de navegador local administrado por OpenClaw.
- `headless` solo afecta a los perfiles administrados locales que inicia OpenClaw. No reinicia ni cambia los navegadores de sesiones existentes ni los navegadores CDP remotos.
- `executablePath` sigue la misma regla de los perfiles administrados locales. Si se cambia en un perfil administrado local en ejecución, ese perfil queda marcado para reiniciarse o reconciliarse, de modo que el siguiente inicio use el nuevo binario.

El comportamiento al detenerse varía según el modo del perfil:

- perfiles administrados locales: `openclaw browser stop` detiene el proceso del navegador que inició OpenClaw
- perfiles de solo conexión y CDP remotos: `openclaw browser stop` cierra la sesión de control activa y libera las anulaciones de emulación de Playwright/CDP (ventana gráfica, esquema de colores, configuración regional, zona horaria, modo sin conexión y estados similares), aunque OpenClaw no haya iniciado ningún proceso de navegador

Las URL de CDP remoto pueden incluir autenticación:

- Tokens de consulta (p. ej., `https://provider.example?token=<token>`)
- Autenticación básica HTTP (p. ej., `https://user:pass@provider.example`)

OpenClaw conserva la autenticación al llamar a los endpoints `/json/*` y al conectarse al WebSocket de CDP. Para los tokens, use preferentemente variables de entorno o gestores de secretos en lugar de incluirlos en archivos de configuración.

## Proxy de navegador del Node (opción predeterminada sin configuración)

Si ejecuta un **host del Node** en la máquina que tiene el navegador, OpenClaw puede enrutar automáticamente las llamadas de la herramienta del navegador a ese Node sin ninguna configuración adicional del navegador. Esta es la ruta predeterminada para los gateways remotos.

Notas:

- El host del Node expone su servidor local de control del navegador mediante un **comando de proxy**.
- Los perfiles proceden de la configuración `browser.profiles` del propio Node (igual que en local).
- El comando de proxy nunca permite mutaciones persistentes de perfiles (`create-profile`, `delete-profile`, `reset-profile`), independientemente de `allowProfiles`; realice esos cambios directamente en el Node.
- `nodeHost.browserProxy.allowProfiles` es opcional. Déjelo vacío para conservar el comportamiento heredado/predeterminado: todos los perfiles configurados siguen siendo accesibles mediante el proxy.
- Si establece `nodeHost.browserProxy.allowProfiles`, OpenClaw lo trata como un límite de privilegio mínimo que restringe los nombres de perfil a los que puede dirigirse el proxy.
- Desactívelo si no lo desea:
  - En el Node: `nodeHost.browserProxy.enabled=false`
  - En el Gateway: `gateway.nodes.browser.mode="off"` (también acepta `"auto"` para elegir un único Node de navegador conectado, o `"manual"` para exigir un parámetro de Node explícito)

## Browserless (CDP remoto alojado)

[Browserless](https://browserless.io) es un servicio Chromium alojado que expone
URL de conexión CDP mediante HTTPS y WebSocket. OpenClaw puede usar cualquiera de
las dos formas, pero para un perfil de navegador remoto la opción más sencilla es
la URL WebSocket directa de la documentación de conexión de Browserless.

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

- Sustituya `<BROWSERLESS_API_KEY>` por su token real de Browserless.
- Elija el endpoint de región que corresponda a su cuenta de Browserless (consulte su documentación).
- Si Browserless proporciona una URL base HTTPS, puede convertirla a
  `wss://` para establecer una conexión CDP directa o conservar la URL HTTPS y permitir que OpenClaw
  detecte `/json/version`.

### Browserless Docker en el mismo host

Cuando Browserless está autoalojado en Docker y OpenClaw se ejecuta en el host, trate
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

La dirección de `browser.profiles.browserless.cdpUrl` debe ser accesible desde el
proceso de OpenClaw. Browserless también debe anunciar un endpoint accesible coincidente;
establezca `EXTERNAL` de Browserless en la misma base WebSocket accesible públicamente
desde OpenClaw, como `ws://127.0.0.1:3000`, `ws://browserless:3000` o una dirección
privada estable de la red de Docker. Si `/json/version` devuelve un
`webSocketDebuggerUrl` que apunta a una dirección inaccesible para OpenClaw, el HTTP
de CDP puede parecer operativo mientras la conexión mediante WebSocket sigue fallando.

No deje `attachOnly` sin establecer para un perfil de Browserless en loopback. Sin
`attachOnly`, OpenClaw trata el puerto de loopback como un perfil de navegador local
gestionado y puede indicar que el puerto está en uso, pero no pertenece a OpenClaw.

## Proveedores de CDP con WebSocket directo

Algunos servicios de navegador alojados exponen un endpoint de **WebSocket directo**
en lugar de la detección CDP estándar basada en HTTP (`/json/version`). OpenClaw acepta
tres formatos de URL CDP y elige automáticamente la estrategia de conexión adecuada:

- **Detección HTTP(S)** - `http://host[:port]` o `https://host[:port]`.
  OpenClaw llama a `/json/version` para detectar la URL WebSocket del depurador y,
  a continuación, se conecta. No se recurre a WebSocket como alternativa.
- **Endpoints de WebSocket directo** - `ws://host[:port]/devtools/<kind>/<id>` o
  `wss://...` con una ruta `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw se conecta directamente mediante un protocolo de enlace WebSocket y omite
  por completo `/json/version`.
- **Raíces WebSocket sin ruta** - `ws://host[:port]` o `wss://host[:port]` sin
  una ruta `/devtools/...` (por ejemplo, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw intenta primero la detección
  HTTP mediante `/json/version` (normalizando el esquema a `http`/`https`);
  si la detección devuelve un `webSocketDebuggerUrl`, lo utiliza; en caso contrario,
  OpenClaw recurre a un protocolo de enlace WebSocket directo en la raíz sin ruta.
  Si el endpoint WebSocket anunciado rechaza el protocolo de enlace CDP, pero la raíz
  sin ruta configurada lo acepta, OpenClaw también recurre a esa raíz. Esto permite
  que una URL `ws://` sin ruta que apunte a un Chrome local siga conectándose, ya que
  Chrome solo acepta actualizaciones a WebSocket en la ruta específica de cada destino
  obtenida de `/json/version`, mientras que los proveedores alojados pueden seguir
  utilizando su endpoint WebSocket raíz cuando su endpoint de detección anuncia una
  URL de corta duración que no resulta adecuada para el CDP de Playwright.

`openclaw browser doctor` utiliza la misma lógica de detectar primero y recurrir
después a WebSocket que la conexión en tiempo de ejecución, por lo que una URL raíz
sin ruta que se conecte correctamente no se indica como inaccesible en el diagnóstico.

### Browserbase

[Browserbase](https://www.browserbase.com) es una plataforma en la nube para ejecutar
navegadores sin interfaz gráfica, con resolución de CAPTCHA, modo sigiloso y proxies
residenciales integrados.

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
- Sustituya `<BROWSERBASE_API_KEY>` por su clave de API real de Browserbase.
- Browserbase crea automáticamente una sesión de navegador al conectarse mediante
  WebSocket, por lo que no se necesita ningún paso de creación manual de sesión.
- Consulte los [precios](https://www.browserbase.com/pricing) para conocer los límites actuales del nivel gratuito y los planes de pago.
- Consulte la [documentación de Browserbase](https://docs.browserbase.com) para obtener la referencia completa de la API,
  guías del SDK y ejemplos de integración.

### Notte

[Notte](https://www.notte.cc) es una plataforma en la nube para ejecutar navegadores
sin interfaz gráfica, con modo sigiloso, proxies residenciales y un Gateway WebSocket
nativo de CDP integrados.

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

- [Regístrese](https://console.notte.cc) y copie su **API Key** desde la
  página de configuración de la consola.
- Sustituya `<NOTTE_API_KEY>` por su clave de API real de Notte.
- Notte crea automáticamente una sesión de navegador al conectarse mediante
  WebSocket, por lo que no se necesita ningún paso de creación manual de sesión.
  La sesión se destruye cuando se desconecta WebSocket.
- Consulte los [precios](https://www.notte.cc/#pricing) para conocer los límites actuales del nivel gratuito y los planes de pago.
- Consulte la [documentación de Notte](https://docs.notte.cc) para obtener la referencia completa de la API, guías del
  SDK y ejemplos de integración.

## Seguridad

Conceptos clave:

- El control del navegador solo está disponible mediante loopback; el acceso pasa por la autenticación del Gateway o el emparejamiento del Node.
- La API HTTP independiente del navegador mediante loopback utiliza **solo autenticación mediante secreto compartido**:
  autenticación de portador con el token del Gateway, `x-openclaw-password` o autenticación HTTP Basic con la
  contraseña configurada del Gateway.
- Los encabezados de identidad de Tailscale Serve y `gateway.auth.mode: "trusted-proxy"` **no**
  autentican esta API independiente del navegador mediante loopback.
- Si el control del navegador está activado y no hay configurada ninguna autenticación mediante secreto compartido, OpenClaw
  genera y conserva automáticamente una credencial de control del navegador durante el inicio:
  un token cuando `gateway.auth.mode` es `none`, o una contraseña cuando es
  `trusted-proxy` (conservada mediante `gateway.auth.password` para que los clientes
  de loopback externos al proceso puedan resolverla). La generación automática se omite cuando ya
  hay configurada una credencial de cadena explícita para ese modo o cuando
  `gateway.auth.mode` es `password`.
- Configure explícitamente `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` o
  `OPENCLAW_GATEWAY_PASSWORD` si desea un secreto estable bajo su control
  en lugar del generado.

Consejos para CDP remoto:

- Siempre que sea posible, prefiera endpoints cifrados (HTTPS o WSS) y tokens de corta duración.
- Evite insertar directamente tokens de larga duración en los archivos de configuración.
- Mantenga el Gateway y todos los hosts de Node en una red privada (Tailscale); evite la exposición pública.
- Trate las URL y los tokens de CDP remoto como secretos; prefiera variables de entorno o un gestor de secretos.

## Perfiles (varios navegadores)

OpenClaw admite varios perfiles con nombre (configuraciones de enrutamiento). Los perfiles pueden ser:

- **gestionado por OpenClaw**: una instancia dedicada de navegador basado en Chromium con su propio directorio de datos de usuario y puerto CDP
- **remoto**: una URL CDP explícita (navegador basado en Chromium que se ejecuta en otro lugar)
- **sesión existente**: su perfil de Chrome existente mediante la conexión automática de Chrome DevTools MCP

Valores predeterminados:

- El perfil `openclaw` se crea automáticamente si no existe.
- El perfil `user` está integrado para conectarse a sesiones existentes mediante Chrome MCP.
- Los perfiles de sesión existente, aparte de `user`, son opcionales; créelos con `--driver existing-session`.
- Los puertos CDP locales se asignan de **18800-18899** de forma predeterminada.
- Al eliminar un perfil, su directorio de datos local se mueve a la Papelera.

Todos los endpoints de control aceptan `?profile=<name>`; la CLI utiliza `--browser-profile`.

## Sesión existente mediante Chrome DevTools MCP

OpenClaw también puede conectarse a un perfil de navegador basado en Chromium en ejecución mediante el
servidor oficial Chrome DevTools MCP. Esto reutiliza las pestañas y el estado de inicio de sesión
que ya están abiertos en ese perfil de navegador.

Referencias oficiales de contexto y configuración:

- [Chrome para desarrolladores: usar Chrome DevTools MCP con la sesión del navegador](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README de Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Perfil integrado: `user`. Cree su propio perfil personalizado de sesión existente si
desea un nombre, color o directorio de datos del navegador diferente.

De forma predeterminada, el perfil integrado `user` utiliza la conexión automática de Chrome MCP, que
se dirige al perfil local predeterminado de Google Chrome. Utilice `userDataDir` para Brave,
Edge, Chromium o un perfil de Chrome que no sea el predeterminado. `~` se expande al directorio
personal del sistema operativo:

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

A continuación, en el navegador correspondiente:

1. Abra la página de inspección de ese navegador para la depuración remota.
2. Active la depuración remota.
3. Mantenga el navegador en ejecución y apruebe la solicitud de conexión cuando OpenClaw se conecte.

Páginas de inspección habituales:

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

Aspecto de una conexión correcta:

- `status` muestra `driver: existing-session`
- `status` muestra `transport: chrome-mcp`
- `status` muestra `running: true`
- `tabs` enumera las pestañas del navegador que ya están abiertas
- `snapshot` devuelve referencias de la pestaña en vivo seleccionada

Qué comprobar si la conexión no funciona:

- el navegador de destino basado en Chromium tiene la versión `144+`
- la depuración remota está activada en la página de inspección de ese navegador
- el navegador mostró la solicitud de consentimiento de conexión y esta se aceptó
- si Chrome se inició con un `--remote-debugging-port` explícito, establezca
  `browser.profiles.<name>.cdpUrl` en ese endpoint de DevTools en lugar de depender
  de la conexión automática de Chrome MCP
- `openclaw doctor` migra la configuración antigua del navegador basada en extensiones y comprueba que
  Chrome esté instalado localmente para los perfiles predeterminados de conexión automática, pero no puede
  activar la depuración remota en el navegador

Uso por parte del agente:

- Use `profile="user"` cuando necesite el estado del navegador con la sesión iniciada del usuario.
- Si utiliza un perfil personalizado de sesión existente, pase explícitamente el nombre de ese perfil.
- Elija este modo únicamente cuando el usuario esté frente al equipo para aprobar la solicitud de conexión.
- El host del Gateway o del Node puede iniciar `npx chrome-devtools-mcp@latest --autoConnect`.

Notas:

- Esta vía conlleva más riesgos que el perfil aislado `openclaw`, porque puede actuar dentro de la sesión iniciada del navegador.
- OpenClaw no inicia el navegador para este controlador; únicamente se conecta a él.
- Aquí OpenClaw utiliza el flujo oficial `--autoConnect` de Chrome DevTools MCP. Si se establece `userDataDir`, se pasa para apuntar a ese directorio de datos de usuario.
- La sesión existente puede conectarse en el host seleccionado o mediante un Node de navegador conectado. Si Chrome se encuentra en otro lugar y no hay ningún Node de navegador conectado, utilice CDP remoto o un host de Node.
- Los destinos de Chrome MCP y las referencias de las instantáneas están limitados a un subproceso MCP. Después de reiniciarse ese proceso, vuelva a ejecutar `browser tabs`, seleccione explícitamente un destino nuevo antes de realizar operaciones específicas del destino y genere una nueva instantánea antes de utilizar referencias. Cada referencia solo es válida para su destino y su instantánea más reciente. Los alias antiguos no se transfieren a una pestaña de reemplazo, aunque su URL coincida.
- Actualmente, Chrome DevTools MCP dirige las herramientas de página mediante un identificador numérico de página local al proceso. Los identificadores limitados al proceso impiden su reutilización tras reemplazar el subproceso, pero el reemplazo del contexto del navegador dentro del mismo proceso entre llamadas de herramientas adyacentes todavía puede redirigir una acción. Un direccionamiento completamente atómico requiere que las herramientas de página upstream admitan identificadores de destino estables.

### Inicio personalizado de Chrome MCP

Sobrescriba por perfil el servidor Chrome DevTools MCP iniciado cuando el flujo predeterminado `npx chrome-devtools-mcp@latest` no sea el deseado (hosts sin conexión, versiones fijadas, binarios incluidos localmente):

| Campo        | Función                                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Ejecutable que se inicia en lugar de `npx`. Se resuelve tal cual; se respetan las rutas absolutas.                                    |
| `mcpArgs`    | Matriz de argumentos que se pasa literalmente a `mcpCommand`. Sustituye los argumentos predeterminados `chrome-devtools-mcp@latest --autoConnect`. |

Cuando se establece `cdpUrl` en un perfil de sesión existente, OpenClaw omite `--autoConnect` y reenvía automáticamente el punto de conexión a Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (punto de conexión de detección HTTP de DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (WebSocket CDP directo).

Los indicadores del punto de conexión y `userDataDir` no pueden combinarse: cuando se establece `cdpUrl`, `userDataDir` se ignora al iniciar Chrome MCP, ya que Chrome MCP se conecta al navegador en ejecución detrás del punto de conexión en lugar de abrir un directorio de perfil.

<Accordion title="Limitaciones de la función de sesión existente">

En comparación con el perfil administrado `openclaw`, los controladores de sesión existente tienen más restricciones:

- **Capturas de pantalla** - funcionan las capturas de página y las capturas de elementos mediante `--ref`; los selectores CSS `--element` no. Playwright no es necesario para las capturas de página ni para las capturas de elementos basadas en referencias. (`--full-page` no puede combinarse con `--ref` ni `--element` en ningún perfil, no solo en los de sesión existente).
- **Acciones** - `click`, `type`, `hover`, `scrollIntoView`, `drag` y `select` requieren referencias de instantánea (no selectores CSS). `click-coords` hace clic en coordenadas visibles del área de visualización y no requiere una referencia de instantánea. `click` solo admite el botón izquierdo (sin sobrescrituras de botón ni modificadores). `type` no admite `slowly=true`; utilice `fill` o `press`. `press` no admite `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select` y `fill` no admiten sobrescrituras de `timeoutMs` por llamada; `evaluate` sí. `select` acepta un único valor. `batch` no es compatible; envíe las acciones individualmente.
- **Espera / carga / diálogo** - `wait --url` admite patrones exactos, de subcadena y glob (igual que el perfil administrado); `wait --load networkidle` no es compatible con los perfiles de sesión existente (sí funciona en perfiles administrados y perfiles CDP sin procesar/remotos). Los hooks de carga requieren `ref` o `inputRef`, un archivo cada vez y ningún `element` CSS. Los hooks de diálogo no admiten sobrescrituras de tiempo de espera ni `dialogId`.
- **Visibilidad de los diálogos** - Las respuestas de acciones del navegador administrado incluyen `blockedByDialog` y `browserState.dialogs.pending` cuando una acción abre un diálogo modal; las instantáneas también incluyen el estado de los diálogos pendientes. Responda con `browser dialog --accept/--dismiss --dialog-id <id>` mientras haya un diálogo pendiente. Los diálogos gestionados fuera de OpenClaw aparecen en `browserState.dialogs.recent`.
- **Funciones exclusivas del modo administrado** - La exportación a PDF, la interceptación de descargas y `responsebody` siguen requiriendo la vía del navegador administrado.

</Accordion>

## Garantías de aislamiento

- **Directorio de datos de usuario dedicado**: nunca toca el perfil personal del navegador.
- **Puertos dedicados**: evita `9222` para impedir colisiones con flujos de trabajo de desarrollo.
- **Control determinista de pestañas**: `tabs` devuelve primero `suggestedTargetId`, seguido de identificadores `tabId` estables como `t1`, etiquetas opcionales y el `targetId` sin procesar. Los agentes deben reutilizar `suggestedTargetId`; los identificadores sin procesar siguen disponibles para depuración y compatibilidad.

## Selección del navegador

Al iniciarse localmente, OpenClaw elige el primero disponible:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Puede sobrescribir esta selección con `browser.executablePath`.

Plataformas:

- macOS: comprueba `/Applications` y `~/Applications`.
- Linux: comprueba ubicaciones habituales de Chrome/Brave/Edge/Chromium en `/usr/bin`, `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` y `/usr/lib/chromium-browser`, además de Chromium administrado por Playwright en `PLAYWRIGHT_BROWSERS_PATH` o `~/.cache/ms-playwright`.
- Windows: comprueba las ubicaciones de instalación habituales.

## API de control (opcional)

Para automatización y depuración, el Gateway expone una pequeña **API de control HTTP limitada a la interfaz de bucle invertido**, junto con una CLI `openclaw browser` equivalente (instantáneas, referencias, funciones avanzadas de espera, salida JSON y flujos de trabajo de depuración). Consulte [API de control del navegador](/es/tools/browser-control) para obtener la referencia completa.

## Solución de problemas

Para problemas específicos de Linux (especialmente Chromium instalado mediante snap), consulte [Solución de problemas del navegador](/es/tools/browser-linux-troubleshooting).

Para configuraciones de host dividido con Gateway en WSL2 y Chrome en Windows, consulte [Solución de problemas de WSL2 + Windows + CDP remoto de Chrome](/es/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Fallo de inicio de CDP frente a bloqueo SSRF de navegación

Son clases de fallo diferentes y apuntan a rutas de código distintas.

- **Un fallo de inicio o disponibilidad de CDP** significa que OpenClaw no puede confirmar que el plano de control del navegador esté en buen estado.
- **Un bloqueo SSRF de navegación** significa que el plano de control del navegador está en buen estado, pero la política rechaza el destino de navegación de una página.

Ejemplos habituales:

- Fallo de inicio o disponibilidad de CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` cuando se configura un servicio CDP externo en la interfaz de bucle invertido sin `attachOnly: true`
- Bloqueo SSRF de navegación:
  - Los flujos de `open`, `navigate`, instantáneas o apertura de pestañas fallan con un error de política del navegador o de red, mientras que `start` y `tabs` siguen funcionando

Utilice esta secuencia mínima para distinguirlos:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Cómo interpretar los resultados:

- Si `start` falla con `not reachable after start`, solucione primero la disponibilidad de CDP.
- Si `start` funciona, pero `tabs` falla, el plano de control sigue sin estar en buen estado. Trátelo como un problema de accesibilidad de CDP, no como un problema de navegación de páginas.
- Si `start` y `tabs` funcionan, pero `open` o `navigate` falla, el plano de control del navegador está activo y el fallo se encuentra en la política de navegación o en la página de destino.
- Si `start`, `tabs` y `open` funcionan, la vía básica de control del navegador administrado está en buen estado.

Detalles importantes del comportamiento:

- La configuración del navegador utiliza de forma predeterminada un objeto de política SSRF que deniega el acceso en caso de fallo, aunque no se configure `browser.ssrfPolicy`.
- Para el perfil administrado local `openclaw` en la interfaz de bucle invertido, las comprobaciones de estado de CDP omiten deliberadamente la aplicación de la accesibilidad SSRF del navegador para el plano de control local propio de OpenClaw.
- La protección de navegación es independiente. Que `start` o `tabs` se complete correctamente no significa que se permita un destino posterior de `open` o `navigate`.

Directrices de seguridad:

- **No** relaje la política SSRF del navegador de forma predeterminada.
- Prefiera excepciones de host específicas, como `hostnameAllowlist` o `allowedHostnames`, en lugar de un acceso amplio a redes privadas.
- Utilice `dangerouslyAllowPrivateNetwork: true` únicamente en entornos deliberadamente de confianza donde el acceso del navegador a redes privadas sea necesario y se haya revisado.

## Herramientas del agente y funcionamiento del control

El agente recibe **una herramienta** para la automatización del navegador:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Correspondencia:

- `browser snapshot` devuelve un árbol de interfaz estable (IA o ARIA).
- `browser act` utiliza los identificadores `ref` de la instantánea para hacer clic, escribir, arrastrar y seleccionar.
- `browser screenshot` captura píxeles (página completa, elemento o referencias etiquetadas).
- `browser doctor` comprueba la disponibilidad del Gateway, el Plugin, el perfil, el navegador y las pestañas.
- `browser` acepta:
  - `profile` para elegir un perfil de navegador con nombre (openclaw, chrome o CDP remoto).
  - `target` (`sandbox` | `host` | `node`) para seleccionar dónde reside el navegador.
  - En sesiones aisladas, `target: "host"` requiere `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Si se omite `target`: las sesiones aisladas utilizan `sandbox` de forma predeterminada y las sesiones no aisladas utilizan `host`.
  - Si hay conectado un Node con capacidad de navegador, la herramienta puede dirigir automáticamente las operaciones hacia él, salvo que se fije `target="host"` o `target="node"`.

Esto mantiene el comportamiento determinista del agente y evita selectores frágiles.

## Temas relacionados

- [Descripción general de las herramientas](/es/tools) - todas las herramientas disponibles para el agente
- [Aislamiento](/es/gateway/sandboxing) - control del navegador en entornos aislados
- [Seguridad](/es/gateway/security) - riesgos y refuerzo del control del navegador
