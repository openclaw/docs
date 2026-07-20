---
read_when:
    - Añadir automatización del navegador controlada por agentes
    - Depuración de por qué OpenClaw interfiere con tu propia instalación de Chrome
    - Implementación de la configuración y el ciclo de vida del navegador en la aplicación para macOS
summary: Servicio integrado de control del navegador + comandos de acción
title: Navegador (gestionado por OpenClaw)
x-i18n:
    generated_at: "2026-07-20T01:00:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f87da83e30a15e4899b352c81a666d9e3324124781d103f443a75bc384382d36
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw puede ejecutar un **perfil dedicado de Chrome/Brave/Edge/Chromium** controlado por el agente. Funciona mediante un pequeño servicio de control local dentro del Gateway (solo en la interfaz de bucle invertido) y está aislado del navegador personal.

- Puede considerarse un **navegador independiente y exclusivo para el agente**. El perfil `openclaw` nunca interactúa con el perfil del navegador personal.
- El agente abre pestañas, lee páginas, hace clic y escribe en este entorno aislado.
- En cambio, el perfil integrado `user` se conecta a la sesión real de Chrome en la que se ha iniciado sesión mediante Chrome DevTools MCP.

## Qué se obtiene

- Un perfil de navegador independiente llamado **openclaw** (con un color de realce naranja de forma predeterminada).
- Control determinista de pestañas (enumerar/abrir/enfocar/cerrar).
- Acciones del agente (hacer clic/escribir/arrastrar/seleccionar), instantáneas, capturas de pantalla y archivos PDF.
- Los perfiles basados en Playwright guardan las navegaciones directas a archivos adjuntos en el directorio de descargas administrado y devuelven los metadatos `{ url, suggestedFilename, path }` tras validar la política de la URL final.
- Las acciones del agente basadas en Playwright devuelven un arreglo `downloads` con los mismos metadatos administrados cuando la acción inicia inmediatamente una o más descargas.
- Una Skill incluida, `browser-automation`, que enseña a los agentes el ciclo de recuperación de instantáneas,
  pestañas estables, referencias obsoletas y bloqueos manuales cuando el Plugin
  del navegador está habilitado.
- Compatibilidad opcional con varios perfiles (`openclaw`, `work`, `remote`, ...).

Este navegador **no** está destinado al uso diario. Es una superficie segura y aislada para
la automatización y verificación por parte del agente.

En macOS, es posible copiar explícitamente las cookies de un perfil del sistema de la familia Chrome a un perfil administrado independiente. El navegador administrado sigue utilizando su propio directorio de datos de usuario; solo se copian las cookies seleccionadas, mientras que el almacenamiento local e IndexedDB permanecen en el perfil original. Consulte [Perfiles](#profiles-multi-browser) o la [referencia de la CLI de `openclaw browser`](/es/cli/browser) para conocer los comandos y las limitaciones de importación.

## Inicio rápido

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

"Navegador deshabilitado" significa que el Plugin o `browser.enabled` está desactivado; consulte
[Configuración](#configuration) y [Control del Plugin](#plugin-control).

Si `openclaw browser` no aparece en absoluto o el agente indica que la herramienta del navegador
no está disponible, vaya a [Comando o herramienta del navegador ausente](#missing-browser-command-or-tool).

## Control del Plugin

La herramienta predeterminada `browser` es un Plugin incluido. Deshabilítelo para sustituirlo por otro Plugin que registre el mismo nombre de herramienta `browser`:

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

Los valores predeterminados requieren tanto `plugins.entries.browser.enabled` **como** `browser.enabled=true`. Deshabilitar únicamente el Plugin elimina conjuntamente la CLI `openclaw browser`, el método del Gateway `browser.request`, la herramienta del agente y el servicio de control; la configuración `browser.*` permanece intacta para un sustituto.

Los cambios en la configuración del navegador requieren reiniciar el Gateway para que el Plugin pueda volver a registrar su servicio.

## Orientación para el agente

Nota sobre el perfil de herramientas: `tools.profile: "coding"` incluye `web_search` y
`web_fetch`, pero no la herramienta `browser` completa. Para permitir que el agente o un
subagente generado utilicen la automatización del navegador, añada el navegador en la etapa
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
`tools.subagents.tools.allow: ["browser"]` por sí solo no es suficiente, porque la política de los subagentes
se aplica después del filtrado del perfil.

El Plugin del navegador incluye dos niveles de orientación para el agente:

- La descripción de la herramienta `browser` contiene el contrato compacto siempre activo: elegir
  el perfil correcto, mantener las referencias en la misma pestaña, utilizar `tabId`/etiquetas para seleccionar
  pestañas y cargar la Skill del navegador para el trabajo de varios pasos.
- La Skill incluida `browser-automation` contiene el ciclo operativo más extenso:
  comprobar primero el estado y las pestañas, etiquetar las pestañas de la tarea, crear una instantánea antes de actuar, volver a crearla
  después de los cambios en la interfaz, recuperar una vez las referencias obsoletas e informar del inicio de sesión, la autenticación de dos factores, los CAPTCHA o
  los bloqueos de cámara o micrófono como acciones manuales en lugar de hacer suposiciones.

Las Skills incluidas con el Plugin aparecen entre las Skills disponibles del agente cuando el
Plugin está habilitado. Las instrucciones completas de la Skill se cargan bajo demanda, por lo que los turnos
rutinarios no incurren en el coste completo de tokens.

## Comando o herramienta del navegador ausente

Si `openclaw browser` no se reconoce después de una actualización, falta `browser.request` o el agente informa de que la herramienta del navegador no está disponible, la causa habitual es una lista `plugins.allow` que omite `browser` y la ausencia de un bloque de configuración raíz `browser`. Añádalo:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Un bloque raíz explícito `browser` (cualquier clave bajo `browser`, como
`browser.enabled=true` o `browser.profiles.<name>`) activa el Plugin
del navegador incluido incluso con una lista `plugins.allow` restrictiva, de forma coherente con el comportamiento de configuración
de los canales incluidos. `plugins.entries.browser.enabled=true` y
`tools.alsoAllow: ["browser"]` no sustituyen por sí solos la pertenencia a la lista
de elementos permitidos. Eliminar `plugins.allow` por completo también restaura el valor predeterminado.

## Perfiles: `openclaw`, `user`, `chrome`

- `openclaw`: navegador administrado y aislado (no requiere extensión).
- `user`: perfil integrado de conexión mediante Chrome DevTools MCP para la sesión **real
  de Chrome en la que se ha iniciado sesión**. Chrome muestra un mensaje bloqueante "Allow remote debugging?"
  la primera vez que OpenClaw se conecta, por lo que alguien debe estar frente al equipo.
- `chrome`: perfil integrado de la [extensión de Chrome](/es/tools/chrome-extension) para la sesión **real de Chrome
  en la que se ha iniciado sesión**. Funciona desde un teléfono sin que haya nadie frente al
  equipo porque controla las pestañas mediante la extensión del navegador de OpenClaw en lugar del
  puerto de depuración remota, por lo que no aparece el mensaje "Allow remote debugging?".

Para las llamadas del agente a la herramienta del navegador:

- De forma predeterminada: utilice el navegador aislado `openclaw`.
- Priorice `profile="chrome"` (extensión) cuando las sesiones existentes en las que se ha iniciado sesión sean importantes
  y el usuario esté **lejos del equipo** (Telegram, WhatsApp, etc.).
- Priorice `profile="user"` (Chrome MCP) cuando las sesiones existentes en las que se ha iniciado sesión sean importantes
  y el usuario esté **frente al equipo** para aprobar el mensaje de conexión.
- `profile` es la anulación explícita cuando se desea un modo específico del navegador.

Configure `browser.defaultProfile: "openclaw"` si se desea utilizar el modo administrado de forma predeterminada.

## Configuración

La configuración del navegador se encuentra en `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // predeterminado: true
    evaluateEnabled: true, // predeterminado: true; false deshabilita act:evaluate (JS arbitrario)
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // habilitar solo para acceder a redes privadas de confianza
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // anulación heredada para un solo perfil
    tabCleanup: {
      enabled: true, // predeterminado: true
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
cuando un llamador no proporciona explícitamente `snapshotFormat` ni
`mode`; consulte la [API de control del navegador](/es/tools/browser-control) para conocer las opciones
de instantánea de cada llamada.

### Propiedad de la limpieza de pestañas

La limpieza de pestañas de sesión solo se aplica a las pestañas creadas por la herramienta del navegador de OpenClaw
con `action: "open"`. OpenClaw no adopta las pestañas que ya estaban abiertas,
que abrió el usuario o cuya propiedad se desconoce. El bloque
`browser.tabCleanup` controla las comprobaciones periódicas de inactividad y límites para las sesiones
principales; deshabilitarlo no deshabilita la limpieza explícita del ciclo de vida de las sesiones.

Para las aperturas locales del host, la propiedad con un destino CDP nativo estable y una identidad
del navegador se almacena en el estado SQLite compartido. Esos registros sobreviven al reinicio del Gateway
y continúan siendo aptos para `/new` y otras tareas de limpieza del ciclo de vida de las sesiones;
la limpieza del ciclo de vida de las sesiones incluye la finalización de sesiones de subagentes, Cron y ACP.
Los registros cuyo destino expuesto a la herramienta es el destino CDP nativo también siguen siendo aptos
para las comprobaciones de inactividad y límite por sesión después de un reinicio. Los identificadores de destino de Chrome MCP
son locales al proceso, por lo que los registros de sesiones existentes iniciados en frío esperan a la limpieza del ciclo de vida
en lugar de arriesgarse a una comprobación de inactividad sobre una actividad que no puede atribuirse
de forma segura después del reinicio. Esta ruta persistente puede abarcar perfiles administrados por OpenClaw,
perfiles CDP remotos normales y perfiles de sesiones existentes con un
`cdpUrl` explícito, siempre que OpenClaw pueda resolver tanto el destino nativo como una identidad
estable del navegador. Antes de cerrar un registro persistente, OpenClaw verifica que el
perfil configurado y la instancia del navegador sigan coincidiendo.

Los `--autoConnect` de Chrome MCP, los puntos de conexión CDP cuya respuesta `/json/version` carece
de una identidad estable del navegador y las aperturas cuyo destino nativo no puede resolverse
permanecen sujetos a un seguimiento de mejor esfuerzo local al proceso. Pueden limpiarse mientras ese
proceso del Gateway esté en ejecución, pero no se cierran automáticamente después de
reiniciar el Gateway. Las pestañas que quedaron abiertas antes de que estuviera disponible el seguimiento persistente no
se adoptan de forma retroactiva; cierre esas pestañas manualmente.

La limpieza se realiza según el mejor esfuerzo posible, sin garantizar que todas las pestañas aptas se cierren
de inmediato. Un fallo transitorio al comprobar la propiedad o cerrar una pestaña deja pendiente la limpieza
persistente para volver a intentarla más adelante.

### Visión de capturas de pantalla (compatibilidad con modelos de solo texto)

Cuando el modelo principal es de solo texto (sin compatibilidad con visión ni multimodal), las capturas de pantalla
del navegador devuelven bloques de imagen que el modelo no puede leer. Las capturas de pantalla del navegador
reutilizan la configuración existente de comprensión de imágenes, por lo que un modelo de imágenes
configurado para comprender contenido multimedia puede describir las capturas como texto sin necesidad de
ajustes de modelo específicos para el navegador.

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // Añada candidatos de reserva; se utiliza el primero que funcione
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // Los modelos multimedia compartidos también funcionan cuando se etiquetan como compatibles con imágenes.
      // models: [{ provider: "openai", model: "gpt-4o", capabilities: ["image"] }],
    },
  },
  agents: {
    defaults: {
      // También se respetan los valores predeterminados existentes del modelo de imágenes.
      // imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

**Cómo funciona:**

1. El agente llama a `browser screenshot` y se captura una imagen en el disco como de costumbre.
2. La herramienta del navegador pregunta al entorno de ejecución de comprensión de imágenes existente si
   puede describir la captura de pantalla mediante los modelos de imágenes multimedia configurados, los modelos
   multimedia compartidos, los valores predeterminados de los modelos de imágenes o un proveedor de imágenes respaldado por autenticación.
3. El modelo de visión devuelve una descripción de texto, que se envuelve con
   `wrapExternalContent` (protección contra inyección de prompts) y se devuelve al agente
   como un bloque de texto en lugar de un bloque de imagen.
4. Si la comprensión de imágenes no está disponible, se omite o falla, el navegador
   vuelve a devolver el bloque de imagen original.

Los bloques de imágenes de capturas de pantalla son resultados privados de herramientas: el agente puede inspeccionarlos,
pero OpenClaw no los adjunta automáticamente a las respuestas del canal. Para compartir una
captura de pantalla, solicite al agente que la envíe explícitamente con la herramienta de mensajes.

Utilice los campos `tools.media.image` / `tools.media.models` existentes para los modelos
de reserva, los tiempos de espera, los límites de bytes, los perfiles y la configuración de solicitudes del proveedor.

Si el modelo principal activo ya admite visión y no se ha configurado ningún modelo explícito
de comprensión de imágenes, OpenClaw conserva el resultado de imagen normal para que el
modelo principal pueda leer la captura de pantalla directamente.

<AccordionGroup>

<Accordion title="Puertos y accesibilidad">

- El servicio de control se vincula a la interfaz de bucle invertido en un puerto derivado de `gateway.port` (valor predeterminado `18791` = Gateway + 2). `OPENCLAW_GATEWAY_PORT` tiene prioridad sobre `gateway.port`; cualquiera de ellos desplaza los puertos derivados de la misma familia.
- Los perfiles locales `openclaw` asignan automáticamente `cdpPort`/`cdpUrl` a partir de un intervalo que comienza 9 puertos por encima del puerto de control (valor predeterminado `18800`-`18899`); configúrelos solo para
  perfiles CDP remotos o para adjuntar un punto de conexión de sesión existente. `cdpUrl` utiliza de forma predeterminada
  el puerto CDP local administrado cuando no se especifica.
- La accesibilidad de CDP remoto y `attachOnly`, los protocolos de enlace WebSocket y el inicio
  local de Chrome administrado utilizan plazos integrados.
- Los fallos reiterados de inicio o disponibilidad de Chrome administrado activan un disyuntor por
  perfil. Tras varios fallos consecutivos, OpenClaw pausa brevemente los nuevos intentos
  de inicio en lugar de generar Chromium en cada llamada a la herramienta del navegador. Corrija
  el problema de inicio, desactive el navegador si no es necesario o reinicie el
  Gateway después de la reparación.

</Accordion>

<Accordion title="Política de SSRF">

- Las solicitudes de navegación del navegador y de apertura de pestañas se comprueban previamente. Durante la acción y el periodo de gracia limitado posterior a ella, las interacciones protegidas de Playwright (clic, clic por coordenadas, pasar el cursor, arrastrar, desplazarse, seleccionar, pulsar, escribir, rellenar formularios y evaluar) interceptan las cargas de documentos de nivel superior y submarcos denegadas por la política antes de los bytes de la solicitud HTTP y, después, vuelven a comprobar con el mejor esfuerzo la URL `http(s)` final.
- Antes de cada nuevo inicio de Chrome administrado por OpenClaw, OpenClaw desactiva con el mejor esfuerzo la predicción de red, lo que suprime la preconexión especulativa de Chromium observada para esas cargas denegadas. Se trata de una defensa en profundidad, no de un límite de política: es posible que un navegador reutilizado tras reiniciar el servicio de control y otros backends de navegador no compartan este refuerzo. El enrutamiento de Playwright sigue sin ser un firewall de red y no intercepta los saltos de redirección, la primera solicitud de una ventana emergente, el tráfico de Service Worker, el código de página que se ejecuta después del periodo de protección limitado ni todas las rutas de recursos secundarios o en segundo plano. El aislamiento completo del tráfico saliente requiere aislamiento por parte del propietario o un proxy que aplique políticas.
- En el modo SSRF estricto, también se comprueban la detección de puntos de conexión CDP remotos y las sondas `/json/version` (`cdpUrl`).
- Las variables de entorno `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` y `NO_PROXY` del Gateway/proveedor no redirigen automáticamente el navegador administrado por OpenClaw mediante proxy. Chrome administrado se inicia directamente de forma predeterminada para que la configuración del proxy del proveedor no debilite las comprobaciones SSRF del navegador.
- Las sondas de disponibilidad de CDP local administrado por OpenClaw y las conexiones WebSocket de DevTools omiten el proxy de red administrado para el punto de conexión de bucle invertido exacto que se ha iniciado, por lo que `openclaw browser start` sigue funcionando cuando un proxy del operador bloquea el tráfico saliente de bucle invertido.
- Para redirigir mediante proxy el propio navegador administrado, pase indicadores de proxy explícitos de Chrome mediante `browser.extraArgs`, como `--proxy-server=...` o `--proxy-pac-url=...`. El modo SSRF estricto bloquea el enrutamiento explícito del navegador mediante proxy, salvo que se habilite intencionadamente el acceso del navegador a la red privada.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` está desactivado de forma predeterminada; actívelo solo cuando el acceso del navegador a la red privada sea de confianza de forma intencionada.
- `browser.ssrfPolicy.allowPrivateNetwork` sigue siendo compatible como alias heredado.

</Accordion>

<Accordion title="Comportamiento de los perfiles">

- `attachOnly: true` significa que nunca se inicia un navegador local; solo se adjunta si ya hay uno en ejecución.
- `headless` puede configurarse globalmente o por perfil local administrado. Los valores por perfil prevalecen sobre `browser.headless`, por lo que un perfil iniciado localmente puede permanecer sin interfaz gráfica mientras otro permanece visible.
- `POST /start?headless=true` y `openclaw browser start --headless` solicitan un
  inicio único sin interfaz gráfica para perfiles locales administrados sin reescribir
  `browser.headless` ni la configuración del perfil. Los perfiles de sesión existente, solo adjuntar y
  CDP remoto rechazan la anulación porque OpenClaw no inicia esos
  procesos del navegador.
- En hosts Linux sin `DISPLAY` ni `WAYLAND_DISPLAY`, los perfiles locales administrados
  utilizan automáticamente de forma predeterminada el modo sin interfaz gráfica cuando ni el entorno ni la configuración
  del perfil/global eligen explícitamente el modo con interfaz gráfica. Utilice la forma inequívoca a nivel del navegador
  `openclaw browser --json status`; `openclaw browser status --json` al final
  también funciona porque `status` no define su propio `--json`. El comando informa
  de `headlessSource` como `env`, `profile`, `config`,
  `request`, `linux-display-fallback` o `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` fuerza los inicios locales administrados sin interfaz gráfica para el
  proceso actual. `OPENCLAW_BROWSER_HEADLESS=0` fuerza el modo con interfaz gráfica para los inicios
  normales y devuelve un error procesable en hosts Linux sin servidor de pantalla;
  una solicitud explícita `start --headless` sigue teniendo prioridad para ese inicio concreto.
- La ruta de control del navegador y el cliente programático conservan el
  `error` legible por humanos del error de ausencia de pantalla y exponen el motivo estable
  `no_display_for_headed_profile`. Sus `details` contienen únicamente `profile`,
  `requestedHeadless`, `headlessSource` y `displayPresent`, para que los clientes de la API puedan
  elegir la corrección adecuada sin comparar el texto del mensaje.
- Para un perfil local administrado en ejecución, el estado y doctor consultan el
  punto de conexión CDP del navegador de Chrome para conocer el renderizador, el backend, el dispositivo/controlador, el estado
  de las funciones, las soluciones alternativas del controlador y las capacidades de vídeo acelerado. El resultado se
  almacena en caché para ese proceso del navegador y se expone por completo mediante
  `openclaw browser --json status`. Una llamada de estado pasiva no inicia Chrome.
  Los navegadores de sesión existente, extensión, CDP remoto y sandbox permanecen separados
  y no se inspeccionan mediante esta ruta del host administrado.
- Chrome administrado sin interfaz gráfica sigue utilizando el valor predeterminado conservador `--disable-gpu`.
  Los diagnósticos no habilitan la aceleración, no añaden una configuración global de aceleración
  ni conceden acceso de los navegadores sandbox al dispositivo.
- `executablePath` puede configurarse globalmente o por perfil local administrado. Los valores por perfil prevalecen sobre `browser.executablePath`, por lo que distintos perfiles administrados pueden iniciar diferentes navegadores basados en Chromium. Ambas formas aceptan `~` para el directorio principal del sistema operativo.
- `color` (en el nivel superior y por perfil) tiñe la interfaz de usuario del navegador para que se pueda ver qué perfil está activo.
- El perfil predeterminado es `openclaw` (independiente administrado). Utilice `defaultProfile: "user"` para habilitar el navegador del usuario con la sesión iniciada.
- Orden de detección automática: navegador predeterminado del sistema si está basado en Chromium; en caso contrario, Chrome, Brave, Edge, Chromium y Chrome Canary.
- `driver: "existing-session"` utiliza Chrome DevTools MCP en lugar de CDP sin procesar. Puede adjuntarse mediante la conexión automática de Chrome MCP o mediante `cdpUrl` cuando ya se dispone de un punto de conexión de DevTools para el navegador en ejecución.
- `driver: "extension"` controla el Chrome con la sesión iniciada mediante la [extensión de Chrome de OpenClaw](/es/tools/chrome-extension). El relé es propietario de su punto de conexión de bucle invertido, por lo que estos perfiles no aceptan `cdpUrl`. Este es el único modo de navegador con la sesión iniciada que funciona sin nadie frente al equipo.
- Configure `browser.profiles.<name>.userDataDir` cuando un perfil de sesión existente deba adjuntarse a un perfil de usuario de Chromium no predeterminado (Brave, Edge, etc.). Esta ruta también acepta `~` para el directorio principal del sistema operativo.

</Accordion>

</AccordionGroup>

## Usar Brave u otro navegador basado en Chromium

Si el navegador **predeterminado del sistema** está basado en Chromium (Chrome/Brave/Edge/etc.),
OpenClaw lo utiliza automáticamente. Configure `browser.executablePath` para anular la
detección automática. Los valores `executablePath` del nivel superior y por perfil aceptan `~`
para el directorio principal del sistema operativo:

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

El valor `executablePath` por perfil solo afecta a los perfiles locales administrados que OpenClaw
inicia. Los perfiles `existing-session` se adjuntan en su lugar a un navegador que ya está en ejecución,
y los perfiles CDP remotos utilizan el navegador ubicado detrás de `cdpUrl`.

## Control local frente a remoto

- **Control local (predeterminado):** el Gateway inicia el servicio de control de bucle invertido y puede iniciar un navegador local.
- **Control remoto (host de Node):** ejecute un host de Node en el equipo que tiene el navegador; el Gateway redirige las acciones del navegador mediante proxy hacia él.
- **CDP remoto:** configure `browser.profiles.<name>.cdpUrl` (o `browser.cdpUrl`) para
  adjuntarse a un navegador remoto basado en Chromium. En este caso, OpenClaw no iniciará un navegador local.
- Para servicios CDP administrados externamente en la interfaz de bucle invertido (por ejemplo, Browserless en
  Docker publicado en `127.0.0.1`), configure también `attachOnly: true`. Un CDP de bucle invertido
  sin `attachOnly` se trata como un perfil de navegador local administrado por OpenClaw.
- `headless` solo afecta a los perfiles locales administrados que OpenClaw inicia. No reinicia ni cambia los navegadores de sesión existente o CDP remoto.
- `executablePath` sigue la misma regla de los perfiles locales administrados. Al cambiarlo en un
  perfil local administrado en ejecución, se marca ese perfil para reiniciarlo/reconciliarlo, de modo que el
  siguiente inicio utilice el nuevo binario.

El comportamiento de detención varía según el modo del perfil:

- perfiles locales administrados: `openclaw browser stop` detiene el proceso del navegador que
  inició OpenClaw
- perfiles de solo adjuntar y CDP remoto: `openclaw browser stop` cierra la sesión de
  control activa y libera las anulaciones de emulación de Playwright/CDP (ventana gráfica,
  esquema de colores, configuración regional, zona horaria, modo sin conexión y estados similares), aunque
  OpenClaw no haya iniciado ningún proceso del navegador

Las URL de CDP remoto pueden incluir autenticación:

- Tokens de consulta (p. ej., `https://provider.example?token=<token>`)
- Autenticación HTTP Basic (p. ej., `https://user:pass@provider.example`)

OpenClaw conserva la autenticación al llamar a endpoints `/json/*` y al conectarse
al WebSocket de CDP. Se recomienda usar variables de entorno o gestores de secretos para los
tokens en lugar de incluirlos en archivos de configuración.

## Proxy de navegador de Node (opción predeterminada sin configuración)

Si se ejecuta un **host de Node** en la máquina que tiene el navegador, OpenClaw puede
redirigir automáticamente las llamadas de la herramienta de navegador a ese Node sin ninguna configuración adicional del navegador.
Esta es la ruta predeterminada para gateways remotos.

Notas:

- El host de Node expone su servidor local de control del navegador mediante un **comando proxy**.
- Los perfiles proceden de la configuración `browser.profiles` del propio Node (igual que en local).
- El comando proxy nunca permite modificaciones persistentes de perfiles (`create-profile`, `delete-profile`, `reset-profile`), independientemente de `allowProfiles`; esos cambios deben realizarse directamente en el Node.
- `nodeHost.browserProxy.allowProfiles` es opcional. Déjelo vacío para usar el comportamiento heredado/predeterminado: todos los perfiles configurados seguirán siendo accesibles mediante el proxy.
- Si se establece `nodeHost.browserProxy.allowProfiles`, OpenClaw lo trata como un límite de privilegio mínimo que restringe los nombres de perfil a los que se dirigirá el proxy.
- Desactívelo si no se desea usar:
  - En el Node: `nodeHost.browserProxy.enabled=false`
  - En el gateway: `gateway.nodes.browser.mode="off"` (también acepta `"auto"` para seleccionar un único Node de navegador conectado, o `"manual"` para exigir un parámetro de Node explícito)

## Browserless (CDP remoto alojado)

[Browserless](https://browserless.io) es un servicio Chromium alojado que expone
URL de conexión CDP mediante HTTPS y WebSocket. OpenClaw puede utilizar cualquiera de las dos formas, pero
para un perfil de navegador remoto, la opción más sencilla es la URL directa de WebSocket
de la documentación de conexión de Browserless.

Ejemplo:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
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

- Reemplace `<BROWSERLESS_API_KEY>` por el token real de Browserless.
- Elija el endpoint regional que corresponda a la cuenta de Browserless (consulte su documentación).
- Si Browserless proporciona una URL base HTTPS, puede convertirla a
  `wss://` para una conexión CDP directa o conservar la URL HTTPS y permitir que OpenClaw
  detecte `/json/version`.

### Browserless Docker en el mismo host

Cuando Browserless está autoalojado en Docker y OpenClaw se ejecuta en el host, se debe tratar
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

La dirección de `browser.profiles.browserless.cdpUrl` debe ser accesible desde el
proceso de OpenClaw. Browserless también debe anunciar un endpoint accesible correspondiente;
establezca `EXTERNAL` de Browserless en la misma base de WebSocket pública para OpenClaw, como
`ws://127.0.0.1:3000`, `ws://browserless:3000` o una dirección estable de la red
privada de Docker. Si `/json/version` devuelve `webSocketDebuggerUrl` que apunta a
una dirección inaccesible para OpenClaw, el HTTP de CDP puede parecer operativo mientras que la
conexión mediante WebSocket sigue fallando.

No deje `attachOnly` sin establecer para un perfil Browserless de bucle invertido. Sin
`attachOnly`, OpenClaw trata el puerto de bucle invertido como un perfil de navegador local
administrado y puede indicar que el puerto está en uso, pero no pertenece a OpenClaw.

## Proveedores de CDP mediante WebSocket directo

Algunos servicios de navegador alojados exponen un endpoint de **WebSocket directo** en lugar
de la detección estándar de CDP basada en HTTP (`/json/version`). OpenClaw acepta tres
formatos de URL de CDP y selecciona automáticamente la estrategia de conexión adecuada:

- **Detección HTTP(S)** - `http://host[:port]` o `https://host[:port]`.
  OpenClaw llama a `/json/version` para detectar la URL del depurador WebSocket y, después,
  se conecta. Sin alternativa mediante WebSocket.
- **Endpoints de WebSocket directo** - `ws://host[:port]/devtools/<kind>/<id>` o
  `wss://...` con una ruta `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw se conecta directamente mediante un protocolo de enlace WebSocket y omite
  `/json/version` por completo.
- **Raíces de WebSocket sin ruta** - `ws://host[:port]` o `wss://host[:port]` sin
  una ruta `/devtools/...` (p. ej., [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw intenta primero la detección HTTP
  de `/json/version` (normalizando el esquema a `http`/`https`);
  si la detección devuelve un `webSocketDebuggerUrl`, se utiliza; de lo contrario, OpenClaw
  recurre a un protocolo de enlace WebSocket directo en la raíz sin ruta. Si el endpoint
  de WebSocket anunciado rechaza el protocolo de enlace CDP, pero la raíz sin ruta configurada
  lo acepta, OpenClaw también recurre a esa raíz. Esto permite que un `ws://` sin ruta
  que apunte a una instancia local de Chrome pueda conectarse, ya que Chrome solo acepta actualizaciones de WebSocket
  en la ruta específica de cada destino obtenida de `/json/version`, mientras que los proveedores
  alojados pueden seguir utilizando su endpoint raíz de WebSocket cuando su endpoint de detección
  anuncia una URL de corta duración que no resulta adecuada para CDP de Playwright.

`openclaw browser doctor` utiliza la misma lógica de detección inicial y alternativa mediante WebSocket
que la conexión en tiempo de ejecución, por lo que los diagnósticos no indican como inaccesible
una URL de raíz sin ruta que se conecta correctamente.

### Browserbase

[Browserbase](https://www.browserbase.com) es una plataforma en la nube para ejecutar
navegadores sin interfaz con resolución de CAPTCHA integrada, modo sigiloso y proxies
residenciales.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
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

- [Regístrese](https://www.browserbase.com/sign-up) y copie la **API Key**
  desde el [Overview dashboard](https://www.browserbase.com/overview).
- Reemplace `<BROWSERBASE_API_KEY>` por la clave de API real de Browserbase.
- Browserbase crea automáticamente una sesión de navegador al conectarse mediante WebSocket, por lo que no
  se requiere ningún paso de creación manual de la sesión.
- Consulte los [precios](https://www.browserbase.com/pricing) para conocer los límites actuales del nivel gratuito y los planes de pago.
- Consulte la [documentación de Browserbase](https://docs.browserbase.com) para obtener la referencia completa de la API,
  guías del SDK y ejemplos de integración.

### Notte

[Notte](https://www.notte.cc) es una plataforma en la nube para ejecutar navegadores
sin interfaz con funciones sigilosas integradas, proxies residenciales y un gateway
WebSocket nativo de CDP.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "notte",
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

- [Regístrese](https://console.notte.cc) y copie la **API Key** desde la
  página de configuración de la consola.
- Reemplace `<NOTTE_API_KEY>` por la clave de API real de Notte.
- Notte crea automáticamente una sesión de navegador al conectarse mediante WebSocket, por lo que no
  se requiere ningún paso de creación manual de la sesión. La sesión se destruye cuando se
  desconecta el WebSocket.
- Consulte los [precios](https://www.notte.cc/#pricing) para conocer los límites actuales del nivel gratuito y los planes de pago.
- Consulte la [documentación de Notte](https://docs.notte.cc) para obtener la referencia completa de la API, guías
  del SDK y ejemplos de integración.

## Seguridad

Conceptos clave:

- El control del navegador solo está disponible mediante bucle invertido; el acceso se realiza mediante la autenticación del Gateway o el emparejamiento de Node.
- La API HTTP independiente del navegador mediante bucle invertido utiliza **únicamente autenticación mediante secreto compartido**:
  autenticación de portador con el token del gateway, `x-openclaw-password` o autenticación HTTP Basic con la
  contraseña configurada del gateway.
- Los encabezados de identidad de Tailscale Serve y `gateway.auth.mode: "trusted-proxy"`
  **no** autentican esta API independiente del navegador mediante bucle invertido.
- Si el control del navegador está activado y no se ha configurado ninguna autenticación mediante secreto compartido, OpenClaw
  genera automáticamente y conserva una credencial de control del navegador al iniciarse:
  un token cuando `gateway.auth.mode` es `none`, o una contraseña cuando es
  `trusted-proxy` (conservada mediante `gateway.auth.password` para que los clientes de
  bucle invertido externos al proceso puedan resolverla). La generación automática se omite cuando ya
  se ha configurado una credencial de cadena explícita para ese modo, o cuando
  `gateway.auth.mode` es `password`.
- Configure explícitamente `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` o
  `OPENCLAW_GATEWAY_PASSWORD` si se desea un secreto estable bajo control propio
  en lugar del generado.

Consejos para CDP remoto:

- Se recomienda usar endpoints cifrados (HTTPS o WSS) y tokens de corta duración siempre que sea posible.
- Evite incluir tokens de larga duración directamente en archivos de configuración.
- Mantenga el Gateway y todos los hosts de Node en una red privada (Tailscale); evite la exposición pública.
- Trate las URL y los tokens de CDP remoto como secretos; se recomienda usar variables de entorno o un gestor de secretos.

## Perfiles (varios navegadores)

OpenClaw admite varios perfiles con nombre (configuraciones de enrutamiento). Los perfiles pueden ser:

- **administrados por OpenClaw**: una instancia dedicada de navegador basado en Chromium con su propio directorio de datos de usuario y puerto CDP
- **remotos**: una URL de CDP explícita (navegador basado en Chromium que se ejecuta en otro lugar)
- **sesión existente**: el perfil de Chrome existente mediante la conexión automática de Chrome DevTools MCP

Valores predeterminados:

- El perfil `openclaw` se crea automáticamente si no existe.
- El perfil `user` está integrado para conectarse a una sesión existente mediante Chrome MCP.
- Los perfiles de sesiones existentes, aparte de `user`, son opcionales; créelos con `--driver existing-session`.
- Los puertos CDP locales se asignan de forma predeterminada en el intervalo **18800-18899**.
- Al eliminar un perfil, su directorio de datos local se mueve a la Papelera.

Todos los endpoints de control aceptan `?profile=<name>`; la CLI utiliza `--browser-profile`.

## Sesión existente mediante Chrome DevTools MCP

OpenClaw también puede conectarse a un perfil de navegador basado en Chromium en ejecución mediante el
servidor oficial Chrome DevTools MCP. De este modo, se reutilizan las pestañas y el estado de inicio de sesión
ya abiertos en ese perfil del navegador.

Referencias oficiales de contexto y configuración:

- [Chrome para desarrolladores: uso de Chrome DevTools MCP con una sesión del navegador](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README de Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Perfil integrado: `user`. Cree un perfil personalizado propio de sesión existente si
se desea un nombre, color o directorio de datos del navegador diferente.

De forma predeterminada, el perfil integrado `user` utiliza la conexión automática de Chrome MCP, que
se dirige al perfil local predeterminado de Google Chrome. Utilice `userDataDir` para Brave,
Edge, Chromium o un perfil de Chrome que no sea el predeterminado. `~` se expande al directorio personal
del sistema operativo:

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

Aspecto de una ejecución correcta:

- `status` muestra `driver: existing-session`
- `status` muestra `transport: chrome-mcp`
- `status` muestra `running: true`
- `tabs` enumera las pestañas del navegador que ya están abiertas
- `snapshot` devuelve referencias de la pestaña activa seleccionada

Qué comprobar si la conexión no funciona:

- el navegador de destino basado en Chromium tiene la versión `144+`
- la depuración remota está habilitada en la página de inspección de ese navegador
- el navegador mostró la solicitud de consentimiento para la conexión y esta se aceptó
- si Chrome se inició con un valor explícito de `--remote-debugging-port`, establezca
  `browser.profiles.<name>.cdpUrl` en ese endpoint de DevTools en lugar de depender
  de la conexión automática de Chrome MCP
- `openclaw doctor` migra la configuración antigua del navegador basada en extensiones y comprueba que
  Chrome esté instalado localmente para los perfiles predeterminados de conexión automática, pero no puede
  habilitar la depuración remota en el navegador

Uso por parte del agente:

- Use `profile="user"` cuando necesite el estado de la sesión iniciada del usuario en el navegador.
- Si utiliza un perfil personalizado de sesión existente, proporcione explícitamente el nombre de ese perfil.
- Elija este modo únicamente cuando el usuario esté frente al equipo para aprobar la solicitud
  de conexión.
- El host del Gateway o del Node puede iniciar `npx chrome-devtools-mcp@latest --autoConnect`.

Notas:

- Esta vía presenta un riesgo mayor que el perfil aislado `openclaw`, ya que puede
  realizar acciones dentro de la sesión iniciada del navegador.
- OpenClaw no inicia el navegador para este controlador; solo se conecta.
- Aquí, OpenClaw utiliza el flujo oficial `--autoConnect` de Chrome DevTools MCP. Si
  se establece `userDataDir`, se transmite para apuntar a ese directorio de datos del usuario.
- La sesión existente puede conectarse en el host seleccionado o mediante un
  Node de navegador conectado. Si Chrome se encuentra en otro lugar y no hay ningún Node de navegador conectado, utilice
  CDP remoto o un host de Node.
- Los destinos de Chrome MCP y las referencias de instantáneas se limitan a un único subproceso MCP. Después
  de reiniciar ese proceso, vuelva a ejecutar `browser tabs`, seleccione explícitamente un destino
  nuevo antes de realizar tareas específicas del destino y obtenga una nueva instantánea antes de utilizar las referencias.
  Cada referencia solo es válida para su destino y la instantánea más reciente. Los alias antiguos no
  se transfieren a una pestaña sustituta, aunque su URL coincida.
- Chrome DevTools MCP dirige actualmente las herramientas de página mediante un identificador numérico de página
  local al proceso. Los identificadores limitados al proceso impiden su reutilización tras sustituir el subproceso, pero
  la sustitución del contexto del navegador dentro del proceso entre llamadas consecutivas a herramientas aún puede
  redirigir una acción. El enrutamiento totalmente atómico requiere que las herramientas de página del proyecto
  original admitan identificadores de destino estables.

### Inicio personalizado de Chrome MCP

Sustituya por perfil el servidor Chrome DevTools MCP que se inicia cuando el flujo predeterminado
`npx chrome-devtools-mcp@latest` no sea el deseado (hosts sin conexión,
versiones fijadas, binarios incluidos localmente):

| Campo        | Función                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Ejecutable que se iniciará en lugar de `npx`. Se resuelve tal cual; se respetan las rutas absolutas.                                          |
| `mcpArgs`    | Matriz de argumentos que se pasa literalmente a `mcpCommand`. Sustituye los argumentos predeterminados de `chrome-devtools-mcp@latest --autoConnect`. |

Cuando se establece `cdpUrl` en un perfil de sesión existente, OpenClaw omite
`--autoConnect` y reenvía automáticamente el endpoint a Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (endpoint de descubrimiento HTTP de DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (WebSocket CDP directo).

Los indicadores de endpoint y `userDataDir` no se pueden combinar: cuando se establece `cdpUrl`,
se ignora `userDataDir` al iniciar Chrome MCP, ya que Chrome MCP se conecta al
navegador en ejecución situado detrás del endpoint en lugar de abrir un directorio
de perfil.

<Accordion title="Limitaciones de la funcionalidad de sesión existente">

En comparación con el perfil administrado `openclaw`, los controladores de sesión existente tienen más restricciones:

- **Capturas de pantalla** - funcionan las capturas de página y las capturas de elementos mediante `--ref`; los selectores CSS `--element` no funcionan. Playwright no es necesario para las capturas de pantalla de páginas ni de elementos basadas en referencias. (`--full-page` no se puede combinar con `--ref` ni `--element` en ningún perfil, no solo en los de sesión existente.)
- **Acciones** - `click`, `type`, `hover`, `scrollIntoView`, `drag` y `select` requieren referencias de instantáneas (no selectores CSS). `click-coords` hace clic en coordenadas visibles de la ventana gráfica y no requiere una referencia de instantánea. `click` solo admite el botón izquierdo (sin sustituciones de botón ni modificadores). `type` no admite `slowly=true`; utilice `fill` o `press`. `press` no admite `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select` y `fill` no admiten sustituciones de `timeoutMs` por llamada; `evaluate` sí las admite. `select` acepta un único valor. `batch` no es compatible; envíe las acciones individualmente.
- **Espera, carga y cuadros de diálogo** - `wait --url` admite patrones exactos, de subcadenas y glob (igual que el modo administrado); `wait --load networkidle` no es compatible con los perfiles de sesión existente (funciona en los perfiles administrados y CDP sin procesar/remotos). Los enlaces de carga requieren `ref` o `inputRef`, un archivo cada vez y sin `element` CSS. Los enlaces de cuadros de diálogo no admiten sustituciones del tiempo de espera ni `dialogId`.
- **Visibilidad de los cuadros de diálogo** - Las respuestas de las acciones del navegador administrado incluyen `blockedByDialog` y `browserState.dialogs.pending` cuando una acción abre un cuadro de diálogo modal; las instantáneas también incluyen el estado del cuadro de diálogo pendiente. Responda con `browser dialog --accept/--dismiss --dialog-id <id>` mientras haya un cuadro de diálogo pendiente. Los cuadros de diálogo gestionados fuera de OpenClaw aparecen en `browserState.dialogs.recent`.
- **Funciones exclusivas del modo administrado** - La exportación a PDF, la interceptación de descargas y `responsebody` siguen requiriendo la vía del navegador administrado.

</Accordion>

## Garantías de aislamiento

- **Directorio de datos del usuario dedicado**: nunca utiliza el perfil personal del navegador.
- **Puertos dedicados**: evita `9222` para impedir colisiones con los flujos de trabajo de desarrollo.
- **Control determinista de pestañas**: `tabs` devuelve primero `suggestedTargetId` y, a continuación,
  identificadores `tabId` estables, como `t1`, etiquetas opcionales y el valor `targetId` sin procesar.
  Los agentes deben reutilizar `suggestedTargetId`; los identificadores sin procesar siguen estando disponibles para
  depuración y compatibilidad.

## Selección del navegador

Al iniciarse localmente, OpenClaw elige el primero que esté disponible:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Puede sustituirlo mediante `browser.executablePath`.

Plataformas:

- macOS: comprueba `/Applications` y `~/Applications`.
- Linux: comprueba las ubicaciones habituales de Chrome, Brave, Edge y Chromium en `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` y
  `/usr/lib/chromium-browser`, además de Chromium administrado por Playwright en
  `PLAYWRIGHT_BROWSERS_PATH` o `~/.cache/ms-playwright`.
- Windows: comprueba las ubicaciones de instalación habituales.

## API de control (opcional)

Para tareas de automatización y depuración, el Gateway expone una pequeña **API HTTP de
control exclusiva para loopback**, además de una CLI `openclaw browser` correspondiente (instantáneas, referencias, funciones
avanzadas de espera, salida JSON y flujos de trabajo de depuración). Consulte
[API de control del navegador](/es/tools/browser-control) para obtener la referencia completa.

## Solución de problemas

Para problemas específicos de Linux (especialmente con Chromium instalado mediante snap), consulte
[Solución de problemas del navegador](/es/tools/browser-linux-troubleshooting).

Para configuraciones de hosts separados con el Gateway en WSL2 y Chrome en Windows, consulte
[Solución de problemas de WSL2 + Windows + CDP remoto de Chrome](/es/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Fallo de inicio de CDP frente a bloqueo SSRF de navegación

Son clases de fallos diferentes y apuntan a rutas de código distintas.

- Un **fallo de inicio o disponibilidad de CDP** significa que OpenClaw no puede confirmar que el plano de control del navegador esté en buen estado.
- Un **bloqueo SSRF de navegación** significa que el plano de control del navegador está en buen estado, pero la política rechaza el destino de navegación de una página.

Ejemplos habituales:

- Fallo de inicio o disponibilidad de CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` cuando se configura un
    servicio CDP externo de loopback sin `attachOnly: true`
- Bloqueo SSRF de navegación:
  - Los flujos de `open`, `navigate`, instantáneas o apertura de pestañas fallan con un error de política del navegador o de red, mientras que `start` y `tabs` siguen funcionando

Utilice esta secuencia mínima para distinguirlos:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Cómo interpretar los resultados:

- Si `start` falla con `not reachable after start`, investigue primero la disponibilidad de CDP.
- Si `start` se ejecuta correctamente, pero `tabs` falla, el plano de control sigue sin estar en buen estado. Trátelo como un problema de accesibilidad de CDP, no como un problema de navegación de páginas.
- Si `start` y `tabs` se ejecutan correctamente, pero `open` o `navigate` fallan, el plano de control del navegador está activo y el fallo se encuentra en la política de navegación o en la página de destino.
- Si `start`, `tabs` y `open` se ejecutan correctamente, la vía básica de control del navegador administrado está en buen estado.

Detalles importantes del comportamiento:

- De forma predeterminada, la configuración del navegador utiliza un objeto de política SSRF de cierre seguro aunque no se configure `browser.ssrfPolicy`.
- Para el perfil administrado de loopback local `openclaw`, las comprobaciones de estado de CDP omiten intencionadamente la aplicación de la accesibilidad SSRF del navegador para el plano de control local propio de OpenClaw.
- La protección de navegación es independiente. Que `start` o `tabs` se ejecuten correctamente no significa que se permita un destino posterior de `open` o `navigate`.

Orientación de seguridad:

- **No** flexibilice de forma predeterminada la política SSRF del navegador.
- Prefiera excepciones de host específicas, como `hostnameAllowlist` o `allowedHostnames`, en lugar de un acceso amplio a la red privada.
- Utilice `dangerouslyAllowPrivateNetwork: true` únicamente en entornos de confianza deliberadamente establecidos en los que el acceso del navegador a la red privada sea necesario y se haya revisado.

## Herramientas del agente y funcionamiento del control

El agente dispone de **una herramienta** para la automatización del navegador:

- `browser` - diagnóstico/estado/inicio/detención/pestañas/apertura/enfoque/cierre/instantánea/captura de pantalla/navegación/acción

Correspondencia:

- `browser snapshot` devuelve un árbol de interfaz de usuario estable (IA o ARIA).
- `browser act` utiliza los identificadores `ref` de la instantánea para hacer clic, escribir, arrastrar o seleccionar.
- `browser screenshot` captura píxeles (página completa, elemento o referencias etiquetadas).
- `browser doctor` comprueba la disponibilidad del Gateway, el plugin, el perfil, el navegador y la pestaña.
- `browser` acepta:
  - `profile` para elegir un perfil de navegador con nombre (openclaw, chrome o CDP remoto).
  - `target` (`sandbox` | `host` | `node`) para seleccionar dónde se ejecuta el navegador.
  - En las sesiones aisladas, `target: "host"` requiere `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Si se omite `target`: las sesiones aisladas usan `sandbox` de forma predeterminada y las sesiones no aisladas usan `host`.
  - Si hay conectado un nodo compatible con navegador, la herramienta puede dirigir automáticamente la solicitud a este, a menos que se fije `target="host"` o `target="node"`.

Esto mantiene el agente determinista y evita selectores frágiles.

## Contenido relacionado

- [Descripción general de las herramientas](/es/tools) - todas las herramientas disponibles para el agente
- [Aislamiento](/es/gateway/sandboxing) - control del navegador en entornos aislados
- [Seguridad](/es/gateway/security) - riesgos y refuerzo de seguridad del control del navegador
