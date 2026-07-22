---
read_when:
    - Adición de automatización del navegador controlada por agentes
    - Depuración de por qué OpenClaw interfiere con tu propia instalación de Chrome
    - Implementación de la configuración y el ciclo de vida del navegador en la aplicación para macOS
summary: Servicio integrado de control del navegador + comandos de acción
title: Navegador (gestionado por OpenClaw)
x-i18n:
    generated_at: "2026-07-22T10:49:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3afa2dda17520ae6c53fe3f1a7a12e7ca8a1414b2c12b79cf4a09ac8906bb3ca
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw puede ejecutar un **perfil dedicado de Chrome/Brave/Edge/Chromium** controlado por el agente. Funciona mediante un pequeño servicio de control local dentro del Gateway (solo en la interfaz de bucle invertido) y está aislado del navegador personal.

- Puede considerarse un **navegador independiente y exclusivo para el agente**. El perfil `openclaw` nunca interactúa con el perfil del navegador personal.
- El agente abre pestañas, lee páginas, hace clic y escribe en este entorno aislado.
- En cambio, el perfil integrado `user` se conecta mediante Chrome DevTools MCP a la sesión real iniciada en Chrome.

## Qué se obtiene

- Un perfil de navegador independiente llamado **openclaw** (con detalle naranja de forma predeterminada).
- Control determinista de pestañas (enumerar/abrir/enfocar/cerrar).
- Acciones del agente (hacer clic/escribir/arrastrar/seleccionar), instantáneas, capturas de pantalla y archivos PDF.
- Los perfiles basados en Playwright guardan las navegaciones directas a archivos adjuntos en el directorio de descargas administrado y devuelven metadatos `{ url, suggestedFilename, path }` después de validar la política de la URL final.
- Las acciones del agente basadas en Playwright devuelven una matriz `downloads` con los mismos metadatos administrados cuando la acción inicia inmediatamente una o más descargas.
- Una Skill `browser-automation` incluida que enseña a los agentes el ciclo de recuperación de instantáneas,
  pestañas estables, referencias obsoletas y bloqueos manuales cuando el Plugin
  del navegador está habilitado.
- Compatibilidad opcional con varios perfiles (`openclaw`, `work`, `remote`, ...).

Este navegador **no** está pensado para el uso diario. Es una superficie segura
y aislada para la automatización y verificación por parte del agente.

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

Si `openclaw browser` no existe en absoluto, o el agente indica que la herramienta del navegador
no está disponible, vaya a [Comando o herramienta del navegador ausente](#missing-browser-command-or-tool).

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

Los valores predeterminados necesitan tanto `plugins.entries.browser.enabled` **como** `browser.enabled=true`. Si solo se deshabilita el Plugin, se eliminan conjuntamente la CLI `openclaw browser`, el método del Gateway `browser.request`, la herramienta del agente y el servicio de control; la configuración de `browser.*` permanece intacta para un sustituto.

Los cambios en la configuración del navegador requieren reiniciar el Gateway para que el Plugin pueda volver a registrar su servicio.

## Orientación para agentes

Nota sobre los perfiles de herramientas: `tools.profile: "coding"` incluye `web_search` y
`web_fetch`, pero no la herramienta `browser` completa. Para permitir que el agente o un
subagente generado utilice la automatización del navegador, añada el navegador en la fase
de perfil:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Para un solo agente, utilice `agents.entries.*.tools.alsoAllow: ["browser"]`.
`tools.subagents.tools.allow: ["browser"]` por sí solo no es suficiente porque la política de subagentes
se aplica después del filtrado por perfil.

El Plugin del navegador incluye dos niveles de orientación para agentes:

- La descripción de la herramienta `browser` contiene el contrato compacto siempre activo: elegir
  el perfil adecuado, mantener las referencias en la misma pestaña, utilizar `tabId`/etiquetas para seleccionar
  pestañas y cargar la Skill del navegador para el trabajo de varios pasos.
- La Skill `browser-automation` incluida contiene el ciclo operativo más amplio:
  comprobar primero el estado y las pestañas, etiquetar las pestañas de la tarea, crear una instantánea antes de actuar, volver a crearla
  después de los cambios en la interfaz de usuario, recuperar una vez las referencias obsoletas e informar del inicio de sesión, la autenticación de dos factores, los captcha o
  los bloqueos de cámara o micrófono como acciones manuales en lugar de hacer suposiciones.

Las Skills incluidas en el Plugin aparecen entre las Skills disponibles del agente cuando el
Plugin está habilitado. Las instrucciones completas de la Skill se cargan bajo demanda, por lo que los turnos
rutinarios no incurren en el coste completo de tokens.

## Comando o herramienta del navegador ausente

Si `openclaw browser` se desconoce después de una actualización, falta `browser.request` o el agente informa de que la herramienta del navegador no está disponible, la causa habitual es una lista `plugins.allow` que omite `browser` y la inexistencia de un bloque de configuración raíz `browser`. Añádalo:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Un bloque raíz `browser` explícito (cualquier clave bajo `browser`, como
`browser.enabled=true` o `browser.profiles.<name>`) activa el Plugin
del navegador incluido incluso con una lista `plugins.allow` restrictiva, de acuerdo con el comportamiento de la configuración
de canales incluidos. `plugins.entries.browser.enabled=true` y
`tools.alsoAllow: ["browser"]` no sustituyen por sí solos la pertenencia a la lista
de permitidos. Eliminar por completo `plugins.allow` también restaura el valor predeterminado.

## Perfiles: `openclaw`, `user`, `chrome`

- `openclaw`: navegador administrado y aislado (no requiere extensión).
- `user`: perfil integrado de conexión mediante Chrome DevTools MCP para la sesión **real
  iniciada en Chrome**. Chrome muestra un mensaje bloqueante "Allow remote debugging?"
  la primera vez que OpenClaw se conecta, por lo que debe haber alguien frente al equipo.
- `chrome`: perfil integrado de la [extensión de Chrome](/es/tools/chrome-extension) para
  la sesión **real iniciada en Chrome**. Funciona desde un teléfono sin que haya nadie frente al
  equipo porque controla las pestañas mediante la extensión del navegador de OpenClaw en lugar del
  puerto de depuración remota, por lo que no aparece el mensaje "Allow remote debugging?".

Para las llamadas a la herramienta del navegador del agente:

- Valor predeterminado: utilizar el navegador aislado `openclaw`.
- Preferir `profile="chrome"` (extensión) cuando las sesiones existentes con inicio de sesión sean importantes
  y el usuario esté **lejos del equipo** (Telegram, WhatsApp, etc.).
- Preferir `profile="user"` (Chrome MCP) cuando las sesiones existentes con inicio de sesión sean importantes
  y el usuario esté **frente al equipo** para aprobar el mensaje de conexión.
- `profile` es la anulación explícita cuando se desea un modo de navegador específico.

Configure `browser.defaultProfile: "openclaw"` si se desea utilizar de forma predeterminada el modo administrado.

## Configuración

Los ajustes del navegador se encuentran en `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // valor predeterminado: true
    evaluateEnabled: true, // valor predeterminado: true; false deshabilita act:evaluate (JS arbitrario)
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // habilítelo solo para el acceso de confianza a redes privadas
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // anulación heredada para un solo perfil
    tabCleanup: {
      enabled: true, // valor predeterminado: true
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
cuando el llamador no proporciona explícitamente `snapshotFormat` o
`mode`; consulte [API de control del navegador](/es/tools/browser-control) para conocer las opciones
de instantánea por llamada.

### Propiedad de la limpieza de pestañas

La limpieza de pestañas de sesión solo se aplica a las pestañas creadas por la herramienta del navegador de OpenClaw
con `action: "open"`. OpenClaw no adopta las pestañas que ya estaban abiertas,
que abrió el usuario o cuya propiedad se desconoce. El bloque
`browser.tabCleanup` controla las limpiezas periódicas por inactividad y por límite en las sesiones
principales; deshabilitarlo no deshabilita la limpieza explícita del ciclo de vida de las sesiones.

Para las aperturas locales del host, la propiedad con un destino CDP nativo estable y una identidad
del navegador se almacena en el estado SQLite compartido. Esos registros sobreviven al reinicio del Gateway
y siguen siendo aptos para `/new` y otras limpiezas del ciclo de vida de las sesiones;
la limpieza del ciclo de vida de las sesiones incluye la finalización de sesiones de subagentes, cron y ACP.
Los registros cuyo destino expuesto a la herramienta es el destino CDP nativo también siguen siendo aptos
para las limpiezas por inactividad y por límite de sesión después de un reinicio. Los identificadores de destino de Chrome MCP son
locales al proceso, por lo que los registros inactivos de sesiones existentes esperan a la limpieza del ciclo de vida
en lugar de arriesgarse a una limpieza por inactividad sobre actividad que no puede atribuirse
de forma segura después del reinicio. Esta ruta persistente puede abarcar perfiles administrados por OpenClaw,
perfiles CDP remotos normales y perfiles de sesiones existentes con un
`cdpUrl` explícito, siempre que OpenClaw pueda resolver tanto el destino nativo como una identidad
estable del navegador. Antes de cerrar un registro persistente, OpenClaw comprueba que el
perfil configurado y la instancia del navegador sigan coincidiendo.

Los `--autoConnect` de Chrome MCP, los puntos de conexión CDP cuya respuesta `/json/version` carezca
de una identidad estable del navegador y las aperturas cuyo destino nativo no pueda resolverse
se mantienen como seguimiento local al proceso con el mejor esfuerzo posible. Pueden limpiarse mientras ese
proceso del Gateway esté en ejecución, pero no se cierran automáticamente tras un
reinicio del Gateway. Las pestañas que quedaron abiertas antes de que estuviera disponible el seguimiento persistente no
se adoptan retroactivamente; cierre esas pestañas manualmente.

La limpieza se realiza con el mejor esfuerzo posible, pero no se garantiza que todas las pestañas aptas se cierren
inmediatamente. Un fallo transitorio en la comprobación de la propiedad o en el cierre deja pendiente la limpieza
persistente para un intento posterior. Los reintentos no son ilimitados: cuando el navegador
permanece inaccesible y la pestaña no se ha utilizado durante más de un día, se elimina la fila
de seguimiento para que el almacén persistente no pueda llenarse de pestañas que nunca puedan
volver a verificarse.

### Visión de capturas de pantalla (compatibilidad con modelos de solo texto)

Cuando el modelo principal es de solo texto (sin compatibilidad visual o multimodal), las capturas
de pantalla del navegador devuelven bloques de imagen que el modelo no puede leer. Las capturas de pantalla del navegador
reutilizan la configuración existente de comprensión de imágenes, por lo que un modelo de imagen
configurado para la comprensión multimedia puede describir las capturas de pantalla como texto sin necesidad de
ajustes de modelo específicos del navegador.

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // Añada candidatos alternativos; se utiliza el primero que funcione
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

1. El agente llama a `browser screenshot` y se captura una imagen en el disco como de costumbre.
2. La herramienta de navegador consulta al entorno de ejecución de comprensión de imágenes existente si
   puede describir la captura de pantalla mediante los modelos de imágenes multimedia configurados, los modelos
   multimedia compartidos, los valores predeterminados de los modelos de imágenes o un proveedor de imágenes respaldado por autenticación.
3. El modelo de visión devuelve una descripción textual, que se encapsula con
   `wrapExternalContent` (protección contra inyección de prompts) y se devuelve al agente
   como un bloque de texto en lugar de un bloque de imagen.
4. Si la comprensión de imágenes no está disponible, se omite o falla, el navegador vuelve
   a devolver el bloque de imagen original.

Los bloques de imágenes de capturas de pantalla son resultados privados de herramientas: el agente puede inspeccionarlos,
pero OpenClaw no los adjunta automáticamente a las respuestas del canal. Para compartir una
captura de pantalla, solicite al agente que la envíe explícitamente con la herramienta de mensajes.

Utilice los campos `tools.media.image` / `tools.media.models` existentes para los modelos
alternativos, los tiempos de espera, los límites de bytes, los perfiles y la configuración de solicitudes del proveedor.

Si el modelo principal activo ya admite visión y no se ha configurado ningún modelo explícito
de comprensión de imágenes, OpenClaw conserva el resultado de imagen normal para que el
modelo principal pueda leer directamente la captura de pantalla.

<AccordionGroup>

<Accordion title="Puertos y accesibilidad">

- El servicio de control se vincula a la interfaz de bucle invertido en un puerto derivado de `gateway.port` (valor predeterminado `18791` = Gateway + 2). `OPENCLAW_GATEWAY_PORT` tiene prioridad sobre `gateway.port`; cualquiera de los dos desplaza los puertos derivados de la misma familia.
- Los perfiles `openclaw` locales asignan automáticamente `cdpPort`/`cdpUrl` desde un intervalo que comienza 9 puertos por encima del puerto de control (valor predeterminado `18800`-`18899`); configúrelos únicamente para
  perfiles CDP remotos o para conectarse al endpoint de una sesión existente. `cdpUrl` utiliza de forma predeterminada
  el puerto CDP local administrado cuando no se establece.
- La accesibilidad de CDP remoto y `attachOnly`, los protocolos de enlace WebSocket y el inicio local
  de Chrome administrado utilizan plazos integrados.
- Los fallos repetidos de inicio o disponibilidad de Chrome administrado activan un disyuntor por
  perfil. Tras varios fallos consecutivos, OpenClaw pausa brevemente los nuevos intentos
  de inicio en lugar de generar Chromium en cada llamada a la herramienta de navegador. Corrija
  el problema de inicio, desactive el navegador si no es necesario o reinicie el
  Gateway después de la reparación.

</Accordion>

<Accordion title="Política de SSRF">

- Las solicitudes de navegación del navegador y de apertura de pestañas se comprueban previamente. Durante la acción y el periodo de gracia limitado posterior a ella, las interacciones protegidas de Playwright (clic, clic por coordenadas, pasar el cursor, arrastrar, desplazar, seleccionar, pulsar, escribir, rellenar formularios y evaluar) interceptan las cargas de documentos de nivel superior y de subtramas denegadas por la política antes de que se envíen bytes de la solicitud HTTP y, después, vuelven a comprobar en la medida de lo posible la URL final de `http(s)`.
- Antes de cada nuevo inicio de Chrome administrado por OpenClaw, OpenClaw desactiva en la medida de lo posible la predicción de red, lo que suprime la preconexión especulativa observada de Chromium para esas cargas denegadas. Se trata de defensa en profundidad, no de un límite de política: un navegador reutilizado tras reiniciar el servicio de control y otros backends de navegador podrían no compartir este refuerzo. El enrutamiento de Playwright sigue sin ser un cortafuegos de red y no intercepta los saltos de redirección, la primera solicitud de una ventana emergente, el tráfico de Service Worker, el código de página que se ejecuta después del periodo limitado de protección ni todas las rutas de recursos secundarios o en segundo plano. El aislamiento completo del tráfico saliente requiere aislamiento por parte del propietario o un proxy que aplique la política.
- En el modo SSRF estricto, también se comprueban la detección de endpoints CDP remotos y las sondas `/json/version` (`cdpUrl`).
- Las variables de entorno `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` y `NO_PROXY` del Gateway/proveedor no hacen que el navegador administrado por OpenClaw use automáticamente un proxy. Chrome administrado se inicia directamente de forma predeterminada para que la configuración del proxy del proveedor no debilite las comprobaciones SSRF del navegador.
- Las sondas de disponibilidad de CDP local administrado por OpenClaw y las conexiones WebSocket de DevTools omiten el proxy de red administrado para el endpoint de bucle invertido exacto iniciado, por lo que `openclaw browser start` sigue funcionando cuando un proxy del operador bloquea el tráfico saliente de bucle invertido.
- Para que el propio navegador administrado use un proxy, pase indicadores explícitos de proxy de Chrome mediante `browser.extraArgs`, como `--proxy-server=...` o `--proxy-pac-url=...`. El modo SSRF estricto bloquea el enrutamiento explícito del navegador mediante proxy a menos que se habilite intencionadamente el acceso del navegador a la red privada.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` está desactivado de forma predeterminada; habilítelo únicamente cuando se confíe intencionadamente en el acceso del navegador a la red privada.
- `browser.ssrfPolicy.allowPrivateNetwork` continúa siendo compatible como alias heredado.

</Accordion>

<Accordion title="Comportamiento de los perfiles">

- `attachOnly: true` significa que nunca se inicia un navegador local; solo se conecta si ya hay uno en ejecución.
- `headless` se puede establecer globalmente o para cada perfil local administrado. Los valores por perfil prevalecen sobre `browser.headless`, por lo que un perfil iniciado localmente puede permanecer sin interfaz gráfica mientras otro sigue visible.
- `POST /start?headless=true` y `openclaw browser start --headless` solicitan un
  inicio único sin interfaz gráfica para los perfiles locales administrados sin reescribir
  `browser.headless` ni la configuración del perfil. Los perfiles de sesión existente, de solo conexión y
  CDP remotos rechazan la sobrescritura porque OpenClaw no inicia esos
  procesos del navegador.
- En hosts Linux sin `DISPLAY` ni `WAYLAND_DISPLAY`, los perfiles locales administrados
  utilizan automáticamente de forma predeterminada el modo sin interfaz gráfica cuando ni el entorno ni la configuración
  del perfil/global eligen explícitamente el modo con interfaz gráfica. Utilice la forma inequívoca a nivel del navegador
  `openclaw browser --json status`; `openclaw browser status --json` al final
  también funciona porque `status` no define su propio `--json`. El comando indica
  `headlessSource` como `env`, `profile`, `config`,
  `request`, `linux-display-fallback` o `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` fuerza los inicios locales administrados sin interfaz gráfica para el
  proceso actual. `OPENCLAW_BROWSER_HEADLESS=0` fuerza el modo con interfaz gráfica para los inicios
  normales y devuelve un error procesable en hosts Linux sin servidor de pantalla;
  una solicitud explícita de `start --headless` sigue teniendo prioridad para ese inicio concreto.
- La ruta de control del navegador y el cliente programático conservan el `error`
  legible por humanos del error de ausencia de pantalla y exponen el motivo estable
  `no_display_for_headed_profile`. Sus `details` contienen únicamente `profile`,
  `requestedHeadless`, `headlessSource` y `displayPresent`, por lo que los clientes de API pueden
  elegir la solución correcta sin buscar coincidencias en el texto del mensaje.
- Para un perfil local administrado en ejecución, el estado y doctor consultan el
  endpoint CDP a nivel del navegador de Chrome para obtener el renderizador, el backend, el dispositivo/controlador, el estado
  de las funciones, las soluciones alternativas del controlador y las capacidades de vídeo
  acelerado. El resultado se almacena en caché para ese proceso del navegador y se expone íntegramente mediante
  `openclaw browser --json status`. Una llamada pasiva de estado no inicia Chrome.
  Los navegadores de sesión existente, de extensión, CDP remotos y de entorno aislado permanecen separados
  y no se inspeccionan mediante esta ruta de host administrado.
- Chrome administrado sin interfaz gráfica sigue utilizando el valor predeterminado conservador `--disable-gpu`.
  Los diagnósticos no habilitan la aceleración, no añaden una configuración global de aceleración
  ni conceden acceso del navegador de entorno aislado a dispositivos.
- `executablePath` se puede establecer globalmente o para cada perfil local administrado. Los valores por perfil prevalecen sobre `browser.executablePath`, por lo que distintos perfiles administrados pueden iniciar diferentes navegadores basados en Chromium. Ambas formas aceptan `~` para el directorio de inicio del sistema operativo.
- `color` (en el nivel superior y por perfil) tiñe la interfaz de usuario del navegador para que pueda verse qué perfil está activo.
- El perfil predeterminado es `openclaw` (independiente administrado). Utilice `defaultProfile: "user"` para optar por el navegador del usuario con sesión iniciada.
- Orden de detección automática: navegador predeterminado del sistema si está basado en Chromium; en caso contrario, Chrome, Brave, Edge, Chromium y Chrome Canary.
- `driver: "existing-session"` utiliza Chrome DevTools MCP en lugar de CDP sin procesar. Puede conectarse mediante la conexión automática de Chrome MCP o mediante `cdpUrl` cuando ya se dispone de un endpoint de DevTools para el navegador en ejecución.
- `driver: "extension"` controla el Chrome con sesión iniciada mediante la [extensión de Chrome de OpenClaw](/es/tools/chrome-extension). El relé es propietario de su endpoint de bucle invertido, por lo que estos perfiles no aceptan `cdpUrl`. Este es el único modo de navegador con sesión iniciada que funciona sin que haya nadie frente al equipo.
- Establezca `browser.profiles.<name>.userDataDir` cuando un perfil de sesión existente deba conectarse a un perfil de usuario de Chromium que no sea el predeterminado (Brave, Edge, etc.). Esta ruta también acepta `~` para el directorio de inicio del sistema operativo.

</Accordion>

</AccordionGroup>

## Usar Brave u otro navegador basado en Chromium

Si el navegador **predeterminado del sistema** está basado en Chromium (Chrome/Brave/Edge/etc.),
OpenClaw lo utiliza automáticamente. Establezca `browser.executablePath` para sobrescribir
la detección automática. Los valores `executablePath` del nivel superior y por perfil aceptan `~`
para el directorio de inicio del sistema operativo:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

También puede establecerlo en la configuración, según la plataforma:

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
inicia. En cambio, los perfiles `existing-session` se conectan a un navegador que ya está en ejecución,
y los perfiles CDP remotos utilizan el navegador situado detrás de `cdpUrl`.

## Control local frente a remoto

- **Control local (predeterminado):** el Gateway inicia el servicio de control en la interfaz de bucle invertido y puede iniciar un navegador local.
- **Control remoto (host de Node):** ejecute un host de Node en la máquina que contiene el navegador; el Gateway redirige las acciones del navegador hacia él.
- **CDP remoto:** establezca `browser.profiles.<name>.cdpUrl` (o `browser.cdpUrl`) para
  conectarse a un navegador remoto basado en Chromium. En este caso, OpenClaw no iniciará un navegador local.
- Para servicios CDP administrados externamente en la interfaz de bucle invertido (por ejemplo, Browserless en
  Docker publicado en `127.0.0.1`), establezca también `attachOnly: true`. Un CDP de bucle invertido
  sin `attachOnly` se trata como un perfil de navegador local administrado por OpenClaw.
- `headless` solo afecta a los perfiles locales administrados que OpenClaw inicia. No reinicia ni modifica los navegadores de sesión existente o CDP remotos.
- `executablePath` sigue la misma regla de los perfiles locales administrados. Al cambiarlo en un
  perfil local administrado en ejecución, dicho perfil queda marcado para reiniciarse o conciliarse, de modo que el
  siguiente inicio utilice el nuevo binario.

El comportamiento al detenerse varía según el modo del perfil:

- perfiles locales administrados: `openclaw browser stop` detiene el proceso del navegador que
  inició OpenClaw
- perfiles de solo conexión y CDP remotos: `openclaw browser stop` cierra la sesión
  de control activa y libera las sobrescrituras de emulación de Playwright/CDP (ventana gráfica,
  esquema de colores, configuración regional, zona horaria, modo sin conexión y estados similares), aunque
  OpenClaw no haya iniciado ningún proceso del navegador

Las URL de CDP remoto pueden incluir autenticación:

- Tokens de consulta (p. ej., `https://provider.example?token=<token>`)
- Autenticación HTTP Basic (p. ej., `https://user:pass@provider.example`)

OpenClaw conserva la autenticación al llamar a los endpoints `/json/*` y al conectarse
al WebSocket de CDP. Se recomienda usar variables de entorno o gestores de secretos para los
tokens en lugar de incluirlos en archivos de configuración.

## Proxy de navegador del Node (configuración cero predeterminada)

Si se ejecuta un **host de Node** en la máquina donde se encuentra el navegador, OpenClaw puede
enrutar automáticamente las llamadas de herramientas del navegador a ese Node sin ninguna configuración adicional del navegador.
Esta es la ruta predeterminada para gateways remotos.

Notas:

- El host de Node expone su servidor local de control del navegador mediante un **comando proxy**.
- Los perfiles proceden de la propia configuración `browser.profiles` del Node (igual que en local).
- El comando proxy nunca permite modificaciones persistentes de perfiles (`create-profile`, `delete-profile`, `reset-profile`), independientemente de `allowProfiles`; estos cambios deben realizarse directamente en el Node.
- `nodeHost.browserProxy.allowProfiles` es opcional. Déjelo vacío para mantener el comportamiento heredado/predeterminado: todos los perfiles configurados siguen siendo accesibles a través del proxy.
- Si se establece `nodeHost.browserProxy.allowProfiles`, OpenClaw lo trata como un límite de privilegio mínimo que restringe los nombres de perfil a los que puede dirigirse el proxy.
- Desactívelo si no se desea usar:
  - En el Node: `nodeHost.browserProxy.enabled=false`
  - En el Gateway: `gateway.nodes.browser.mode="off"` (también acepta `"auto"` para elegir un único Node de navegador conectado o `"manual"` para exigir un parámetro de Node explícito)

## Browserless (CDP remoto alojado)

[Browserless](https://browserless.io) es un servicio Chromium alojado que expone
URL de conexión CDP mediante HTTPS y WebSocket. OpenClaw puede usar cualquiera de las dos formas, pero,
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

- Sustituya `<BROWSERLESS_API_KEY>` por el token real de Browserless.
- Elija el endpoint regional que corresponda a la cuenta de Browserless (consulte su documentación).
- Si Browserless proporciona una URL base HTTPS, se puede convertir a
  `wss://` para establecer una conexión CDP directa o conservar la URL HTTPS y permitir que OpenClaw
  detecte `/json/version`.

### Browserless Docker en el mismo host

Cuando Browserless se aloja de forma propia en Docker y OpenClaw se ejecuta en el host,
Browserless debe tratarse como un servicio CDP administrado externamente:

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
una dirección inaccesible para OpenClaw, el HTTP de CDP puede parecer operativo aunque la
conexión mediante WebSocket siga fallando.

No deje `attachOnly` sin establecer para un perfil de Browserless en bucle local. Sin
`attachOnly`, OpenClaw trata el puerto de bucle local como un perfil de navegador
administrado localmente y puede indicar que el puerto está en uso, pero que no pertenece a OpenClaw.

## Proveedores de CDP mediante WebSocket directo

Algunos servicios de navegador alojados exponen un endpoint de **WebSocket directo** en lugar
de la detección de CDP estándar basada en HTTP (`/json/version`). OpenClaw acepta tres
formatos de URL de CDP y elige automáticamente la estrategia de conexión adecuada:

- **Detección HTTP(S)**: `http://host[:port]` o `https://host[:port]`.
  OpenClaw llama a `/json/version` para detectar la URL de WebSocket del depurador y, a continuación,
  se conecta. No hay mecanismo alternativo de WebSocket.
- **Endpoints de WebSocket directo**: `ws://host[:port]/devtools/<kind>/<id>` o
  `wss://...` con una ruta `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw se conecta directamente mediante un protocolo de enlace de WebSocket y omite
  por completo `/json/version`.
- **Raíces de WebSocket simples**: `ws://host[:port]` o `wss://host[:port]` sin
  una ruta `/devtools/...` (por ejemplo, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw intenta primero la detección HTTP
  mediante `/json/version` (normalizando el esquema a `http`/`https`);
  si la detección devuelve un `webSocketDebuggerUrl`, se utiliza; de lo contrario, OpenClaw
  recurre a un protocolo de enlace de WebSocket directo en la raíz simple. Si el endpoint
  de WebSocket anunciado rechaza el protocolo de enlace CDP, pero la raíz simple configurada
  lo acepta, OpenClaw también recurre a esa raíz. Esto permite que una `ws://` simple
  que apunte a un Chrome local siga conectándose, ya que Chrome solo acepta actualizaciones a WebSocket
  en la ruta específica de cada destino obtenida de `/json/version`, mientras que los proveedores
  alojados pueden seguir usando su endpoint de WebSocket raíz cuando su endpoint de detección
  anuncia una URL de corta duración que no resulta adecuada para CDP de Playwright.

`openclaw browser doctor` usa la misma lógica de detección inicial y mecanismo alternativo de WebSocket
que la conexión en tiempo de ejecución, por lo que los diagnósticos no indican como inaccesible
una URL de raíz simple que se conecta correctamente.

### Browserbase

[Browserbase](https://www.browserbase.com) es una plataforma en la nube para ejecutar
navegadores sin interfaz gráfica con resolución de CAPTCHA integrada, modo sigiloso y proxies
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
  desde el [panel Overview](https://www.browserbase.com/overview).
- Sustituya `<BROWSERBASE_API_KEY>` por la clave de API real de Browserbase.
- Browserbase crea automáticamente una sesión de navegador al conectarse mediante WebSocket, por lo que no
  se necesita ningún paso de creación manual de la sesión.
- Consulte los [precios](https://www.browserbase.com/pricing) para conocer los límites actuales del nivel gratuito y los planes de pago.
- Consulte la [documentación de Browserbase](https://docs.browserbase.com) para obtener la referencia completa de la API,
  las guías del SDK y ejemplos de integración.

### Notte

[Notte](https://www.notte.cc) es una plataforma en la nube para ejecutar navegadores
sin interfaz gráfica con funciones integradas de ocultación, proxies residenciales y un
gateway WebSocket nativo de CDP.

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
- Sustituya `<NOTTE_API_KEY>` por la clave de API real de Notte.
- Notte crea automáticamente una sesión de navegador al conectarse mediante WebSocket, por lo que no se necesita
  ningún paso de creación manual de la sesión. La sesión se destruye cuando el
  WebSocket se desconecta.
- Consulte los [precios](https://www.notte.cc/#pricing) para conocer los límites actuales del nivel gratuito y los planes de pago.
- Consulte la [documentación de Notte](https://docs.notte.cc) para obtener la referencia completa de la API, las
  guías del SDK y ejemplos de integración.

## Seguridad

Conceptos clave:

- El control del navegador está limitado al bucle local; el acceso se realiza mediante la autenticación del Gateway o el emparejamiento del Node.
- La API HTTP independiente del navegador en bucle local usa **únicamente autenticación con secreto compartido**:
  autenticación de portador con el token del Gateway, `x-openclaw-password` o autenticación HTTP básica con la
  contraseña configurada del Gateway.
- Los encabezados de identidad de Tailscale Serve y `gateway.auth.mode: "trusted-proxy"`
  **no** autentican esta API independiente del navegador en bucle local.
- Si el control del navegador está habilitado y no se ha configurado ninguna autenticación con secreto compartido, OpenClaw
  genera y conserva automáticamente una credencial de control del navegador durante el inicio:
  un token cuando `gateway.auth.mode` es `none`, o una contraseña cuando es
  `trusted-proxy` (conservada mediante `gateway.auth.password` para que los clientes
  de bucle local externos al proceso puedan resolverla). La generación automática se omite cuando ya
  hay configurada una credencial de cadena explícita para ese modo o cuando
  `gateway.auth.mode` es `password`.
- Configure explícitamente `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` o
  `OPENCLAW_GATEWAY_PASSWORD` si se desea un secreto estable bajo control propio
  en lugar del generado.

Consejos para CDP remoto:

- Siempre que sea posible, se recomienda usar endpoints cifrados (HTTPS o WSS) y tokens de corta duración.
- Evite incluir tokens de larga duración directamente en archivos de configuración.
- Mantenga el Gateway y cualquier host de Node en una red privada (Tailscale); evite la exposición pública.
- Trate las URL y los tokens de CDP remoto como secretos; se recomienda usar variables de entorno o un gestor de secretos.

## Perfiles (varios navegadores)

OpenClaw admite varios perfiles con nombre (configuraciones de enrutamiento). Los perfiles pueden ser:

- **administrados por OpenClaw**: una instancia dedicada de un navegador basado en Chromium con su propio directorio de datos de usuario y puerto CDP
- **remotos**: una URL de CDP explícita (navegador basado en Chromium que se ejecuta en otro lugar)
- **sesión existente**: el perfil de Chrome existente mediante la conexión automática de Chrome DevTools MCP

Valores predeterminados:

- El perfil `openclaw` se crea automáticamente si no existe.
- El perfil `user` está integrado para conectarse a una sesión existente mediante Chrome MCP.
- Los perfiles de sesión existente son opcionales aparte de `user`; créelos con `--driver existing-session`.
- Los puertos CDP locales se asignan de forma predeterminada en el intervalo **18800-18899**.
- Al eliminar un perfil, su directorio de datos local se mueve a la papelera.

Todos los endpoints de control aceptan `?profile=<name>`; la CLI usa `--browser-profile`.

## Sesión existente mediante Chrome DevTools MCP

OpenClaw también puede conectarse a un perfil de navegador basado en Chromium en ejecución mediante el
servidor oficial de Chrome DevTools MCP. De este modo se reutilizan las pestañas y el estado de inicio de sesión
que ya están abiertos en ese perfil del navegador.

Referencias oficiales de contexto y configuración:

- [Chrome para desarrolladores: usar Chrome DevTools MCP con una sesión del navegador](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README de Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Perfil integrado: `user`. Cree un perfil personalizado de sesión existente si
se desea otro nombre, color o directorio de datos del navegador.

De forma predeterminada, el perfil integrado `user` usa la conexión automática de Chrome MCP, que
se dirige al perfil local predeterminado de Google Chrome. Use `userDataDir` para Brave,
Edge, Chromium o un perfil de Chrome que no sea el predeterminado. `~` se expande al directorio principal
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
2. Habilite la depuración remota.
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
- el navegador mostró la solicitud de consentimiento para la conexión y se aceptó
- si Chrome se inició con un valor explícito de `--remote-debugging-port`, establezca
  `browser.profiles.<name>.cdpUrl` en ese endpoint de DevTools en lugar de depender
  de la conexión automática de Chrome MCP
- `openclaw doctor` migra la configuración antigua del navegador basada en extensiones y comprueba que
  Chrome esté instalado localmente para los perfiles predeterminados de conexión automática, pero no puede
  habilitar la depuración remota del navegador

Uso por parte del agente:

- Use `profile="user"` cuando necesite el estado de la sesión iniciada del navegador del usuario.
- Si usa un perfil personalizado de sesión existente, proporcione explícitamente el nombre de ese perfil.
- Elija este modo únicamente cuando el usuario esté frente al equipo para aprobar la solicitud
  de conexión.
- El host del Gateway o del Node puede iniciar `npx chrome-devtools-mcp@latest --autoConnect`.

Notas:

- Esta ruta conlleva más riesgos que el perfil aislado `openclaw`, porque puede
  realizar acciones dentro de la sesión iniciada del navegador.
- OpenClaw no inicia el navegador para este controlador; solo se conecta a él.
- Aquí, OpenClaw usa el flujo oficial `--autoConnect` de Chrome DevTools MCP. Si
  se establece `userDataDir`, se transmite para usar como destino ese directorio de datos de usuario.
- La sesión existente puede conectarse en el host seleccionado o mediante un
  Node de navegador conectado. Si Chrome se encuentra en otro lugar y no hay ningún Node de navegador conectado, use
  CDP remoto o un host de Node.
- Los destinos de Chrome MCP y las referencias de instantáneas se limitan a un único subproceso de MCP. Después de
  reiniciar ese proceso, vuelva a ejecutar `browser tabs`, seleccione explícitamente un destino
  nuevo antes de realizar operaciones específicas del destino y genere una nueva instantánea antes de usar referencias.
  Cada referencia solo es válida para su destino y su instantánea más reciente. Los alias antiguos no se
  transfieren a una pestaña de reemplazo, aunque su URL coincida.
- Actualmente, Chrome DevTools MCP enruta las herramientas de página mediante un identificador numérico de página
  local al proceso. Los identificadores limitados al proceso impiden su reutilización tras reemplazar el subproceso, pero
  el reemplazo del contexto del navegador dentro del proceso entre llamadas consecutivas a herramientas todavía puede
  redirigir una acción. Para lograr un enrutamiento completamente atómico, se necesita compatibilidad ascendente de las herramientas de página
  con identificadores de destino estables.

### Inicio personalizado de Chrome MCP

Sobrescriba por perfil el servidor de Chrome DevTools MCP iniciado cuando el flujo predeterminado
`npx chrome-devtools-mcp@latest` no sea el deseado (hosts sin conexión,
versiones fijadas o binarios incluidos localmente):

| Campo        | Función                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Ejecutable que se inicia en lugar de `npx`. Se resuelve tal cual; se respetan las rutas absolutas.                                          |
| `mcpArgs`    | Matriz de argumentos que se pasa literalmente a `mcpCommand`. Reemplaza los argumentos predeterminados de `chrome-devtools-mcp@latest --autoConnect`. |

Cuando se establece `cdpUrl` en un perfil de sesión existente, OpenClaw omite
`--autoConnect` y reenvía automáticamente el endpoint a Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (endpoint de detección HTTP de DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (WebSocket CDP directo).

Los indicadores de endpoint y `userDataDir` no pueden combinarse: cuando se establece `cdpUrl`,
se ignora `userDataDir` para iniciar Chrome MCP, ya que Chrome MCP se conecta al
navegador en ejecución situado detrás del endpoint en lugar de abrir un directorio
de perfil.

<Accordion title="Limitaciones de la función de sesión existente">

En comparación con el perfil administrado `openclaw`, los controladores de sesión existente tienen más restricciones:

- **Capturas de pantalla** - funcionan las capturas de página y las capturas de elementos `--ref`; los selectores CSS `--element` no. Playwright no es necesario para las capturas de página ni de elementos basadas en referencias. (`--full-page` no puede combinarse con `--ref` ni `--element` en ningún perfil, no solo en los de sesión existente).
- **Acciones** - `click`, `type`, `hover`, `scrollIntoView`, `drag` y `select` requieren referencias de instantánea (no selectores CSS). `click-coords` hace clic en coordenadas visibles de la ventana gráfica y no requiere una referencia de instantánea. `click` solo admite el botón izquierdo (sin sobrescrituras de botón ni modificadores). `type` no admite `slowly=true`; use `fill` o `press`. `press` no admite `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select` y `fill` no admiten sobrescrituras de `timeoutMs` por llamada; `evaluate` sí. `select` acepta un único valor. `batch` no es compatible; envíe las acciones individualmente.
- **Espera, carga y cuadros de diálogo** - `wait --url` admite patrones exactos, de subcadena y glob (igual que el modo administrado); `wait --load networkidle` no es compatible con los perfiles de sesión existente (funciona con perfiles administrados y CDP sin procesar/remoto). Los hooks de carga requieren `ref` o `inputRef`, un archivo a la vez y sin `element` de CSS. Los hooks de cuadros de diálogo no admiten sobrescrituras de tiempo de espera ni `dialogId`.
- **Visibilidad de los cuadros de diálogo** - Las respuestas de las acciones del navegador administrado incluyen `blockedByDialog` y `browserState.dialogs.pending` cuando una acción abre un cuadro de diálogo modal; las instantáneas también incluyen el estado del cuadro de diálogo pendiente. Responda con `browser dialog --accept/--dismiss --dialog-id <id>` mientras haya un cuadro de diálogo pendiente. Los cuadros de diálogo gestionados fuera de OpenClaw aparecen en `browserState.dialogs.recent`.
- **Funciones exclusivas del modo administrado** - La exportación a PDF, la interceptación de descargas y `responsebody` siguen requiriendo la ruta del navegador administrado.

</Accordion>

## Garantías de aislamiento

- **Directorio de datos de usuario dedicado**: nunca accede al perfil personal del navegador.
- **Puertos dedicados**: evita `9222` para impedir colisiones con los flujos de trabajo de desarrollo.
- **Control determinista de pestañas**: `tabs` devuelve primero `suggestedTargetId` y, después,
  identificadores estables `tabId`, como `t1`, etiquetas opcionales y el valor `targetId` sin procesar.
  Los agentes deben reutilizar `suggestedTargetId`; los identificadores sin procesar siguen disponibles para
  la depuración y la compatibilidad.

## Selección del navegador

Al iniciarse localmente, OpenClaw elige el primero disponible:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Puede sobrescribirlo con `browser.executablePath`.

Plataformas:

- macOS: comprueba `/Applications` y `~/Applications`.
- Linux: comprueba las ubicaciones habituales de Chrome, Brave, Edge y Chromium en `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` y
  `/usr/lib/chromium-browser`, además de Chromium administrado por Playwright en
  `PLAYWRIGHT_BROWSERS_PATH` o `~/.cache/ms-playwright`.
- Windows: comprueba las ubicaciones de instalación habituales.

## API de control (opcional)

Para crear scripts y depurar, el Gateway expone una pequeña **API de control HTTP
solo para loopback**, además de una CLI `openclaw browser` equivalente (instantáneas, referencias, funciones
avanzadas de espera, salida JSON y flujos de trabajo de depuración). Consulte
[API de control del navegador](/es/tools/browser-control) para obtener la referencia completa.

## Solución de problemas

Para problemas específicos de Linux (especialmente Chromium mediante snap), consulte
[Solución de problemas del navegador](/es/tools/browser-linux-troubleshooting).

Para configuraciones con el Gateway en WSL2 y Chrome en Windows en hosts separados, consulte
[Solución de problemas de WSL2 + Windows + CDP remoto de Chrome](/es/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Fallo de inicio de CDP frente a bloqueo SSRF de navegación

Son clases de fallos distintas y apuntan a rutas de código diferentes.

- Un **fallo de inicio o disponibilidad de CDP** significa que OpenClaw no puede confirmar que el plano de control del navegador funcione correctamente.
- Un **bloqueo SSRF de navegación** significa que el plano de control del navegador funciona correctamente, pero la política rechaza el destino de navegación de una página.

Ejemplos habituales:

- Fallo de inicio o disponibilidad de CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` cuando se configura un
    servicio CDP externo de loopback sin `attachOnly: true`
- Bloqueo SSRF de navegación:
  - Los flujos de `open`, `navigate`, instantánea o apertura de pestañas fallan con un error de política del navegador o de red, mientras que `start` y `tabs` siguen funcionando

Use esta secuencia mínima para distinguirlos:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Cómo interpretar los resultados:

- Si `start` falla con `not reachable after start`, solucione primero la disponibilidad de CDP.
- Si `start` funciona correctamente, pero `tabs` falla, el plano de control aún no funciona correctamente. Trátelo como un problema de accesibilidad de CDP, no como un problema de navegación de páginas.
- Si `start` y `tabs` funcionan correctamente, pero `open` o `navigate` fallan, el plano de control del navegador está activo y el fallo se encuentra en la política de navegación o en la página de destino.
- Si `start`, `tabs` y `open` funcionan correctamente, la ruta básica de control del navegador administrado funciona correctamente.

Detalles importantes del comportamiento:

- De forma predeterminada, la configuración del navegador usa un objeto de política SSRF que bloquea en caso de fallo, aunque no se configure `browser.ssrfPolicy`.
- Para el perfil administrado local de loopback `openclaw`, las comprobaciones de estado de CDP omiten intencionadamente la aplicación de la accesibilidad SSRF del navegador para el propio plano de control local de OpenClaw.
- La protección de navegación es independiente. Un resultado correcto de `start` o `tabs` no significa que se permita un destino posterior de `open` o `navigate`.

Directrices de seguridad:

- **No** flexibilice de forma predeterminada la política SSRF del navegador.
- Prefiera excepciones de host específicas, como `hostnameAllowlist` o `allowedHostnames`, en lugar de un acceso amplio a la red privada.
- Use `dangerouslyAllowPrivateNetwork: true` únicamente en entornos de confianza intencionados donde el acceso del navegador a la red privada sea necesario y se haya revisado.

## Herramientas del agente y funcionamiento del control

El agente recibe **una herramienta** para la automatización del navegador:

- `browser` - diagnóstico/estado/inicio/detención/pestañas/apertura/enfoque/cierre/instantánea/captura de pantalla/navegación/acción

Correspondencias:

- `browser snapshot` devuelve un árbol de interfaz de usuario estable (IA o ARIA).
- `browser act` utiliza los ID `ref` de la instantánea para hacer clic, escribir, arrastrar o seleccionar.
- `browser screenshot` captura píxeles (de la página completa, de un elemento o de referencias etiquetadas).
- `browser doctor` comprueba la disponibilidad del Gateway, el plugin, el perfil, el navegador y la pestaña.
- `browser` acepta:
  - `profile` para elegir un perfil de navegador con nombre (openclaw, chrome o CDP remoto).
  - `target` (`sandbox` | `host` | `node`) para seleccionar dónde se ejecuta el navegador.
  - En las sesiones en entorno aislado, `target: "host"` requiere `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Si se omite `target`: las sesiones en entorno aislado usan `sandbox` de forma predeterminada y las sesiones sin entorno aislado usan `host` de forma predeterminada.
  - Si hay un Node con capacidad de navegador conectado, la herramienta puede dirigir automáticamente las operaciones a este, a menos que se fije `target="host"` o `target="node"`.

Esto mantiene el agente determinista y evita selectores frágiles.

## Contenido relacionado

- [Descripción general de las herramientas](/es/tools) - todas las herramientas disponibles para el agente
- [Aislamiento](/es/gateway/sandboxing) - control del navegador en entornos aislados
- [Seguridad](/es/gateway/security) - riesgos y medidas de protección del control del navegador
