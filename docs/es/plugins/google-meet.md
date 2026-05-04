---
read_when:
    - Quieres que un agente de OpenClaw se una a una llamada de Google Meet
    - Quieres que un agente de OpenClaw cree una nueva llamada de Google Meet
    - Estás configurando Chrome, un nodo de Chrome o Twilio como transporte de Google Meet
summary: 'Plugin de Google Meet: unirse a URLs explícitas de Meet mediante Chrome o Twilio con valores predeterminados de voz en tiempo real'
title: Plugin de Google Meet
x-i18n:
    generated_at: "2026-05-04T02:24:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 77ab70d27d47bcc037144c7c6cfad6f93f307355b6ebcf3ee75c85b96a24af2f
    source_path: plugins/google-meet.md
    workflow: 16
---

Compatibilidad de participantes de Google Meet para OpenClaw: el plugin es explícito por diseño:

- Solo se une a una URL explícita `https://meet.google.com/...`.
- Puede crear un nuevo espacio de Meet mediante la API de Google Meet y luego unirse a la
  URL devuelta.
- La voz `realtime` es el modo predeterminado.
- La voz en tiempo real puede volver a llamar al agente completo de OpenClaw cuando se necesitan
  razonamiento más profundo o herramientas.
- Los agentes eligen el comportamiento de unión con `mode`: usa `realtime` para escuchar
  y responder en vivo, o `transcribe` para unirse/controlar el navegador sin el
  puente de voz en tiempo real.
- La autenticación empieza como OAuth personal de Google o como un perfil de Chrome con sesión ya iniciada.
- No hay anuncio automático de consentimiento.
- El backend de audio predeterminado de Chrome es `BlackHole 2ch`.
- Chrome puede ejecutarse localmente o en un host de nodo emparejado.
- Twilio acepta un número de llamada entrante más un PIN o una secuencia DTMF opcionales; no
  puede marcar una URL de Meet directamente.
- El comando de la CLI es `googlemeet`; `meet` está reservado para flujos de trabajo de teleconferencia
  más amplios del agente.

## Inicio rápido

Instala las dependencias de audio locales y configura un proveedor de voz en tiempo real de backend. OpenAI es el predeterminado; Google Gemini Live también funciona con
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` instala el dispositivo de audio virtual `BlackHole 2ch`. El
instalador de Homebrew requiere reiniciar antes de que macOS exponga el dispositivo:

```bash
sudo reboot
```

Después de reiniciar, verifica ambas piezas:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Habilita el plugin:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Comprueba la configuración:

```bash
openclaw googlemeet setup
```

La salida de configuración está pensada para que los agentes puedan leerla y depende del modo. Informa sobre el perfil de Chrome, la fijación de nodo y, para uniones de Chrome en tiempo real, el puente de audio BlackHole/SoX y las comprobaciones de introducción en tiempo real retrasada. Para uniones solo de observación, comprueba el mismo transporte con `--mode transcribe`; ese modo omite los requisitos previos de audio en tiempo real porque no escucha ni habla a través del puente:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Cuando la delegación de Twilio está configurada, la configuración también informa si el
plugin `voice-call`, las credenciales de Twilio y la exposición pública del webhook están listos.
Trata cualquier comprobación `ok: false` como un bloqueo para el transporte y el modo comprobados
antes de pedir a un agente que se una. Usa `openclaw googlemeet setup --json` para
scripts o salida legible por máquina. Usa `--transport chrome`,
`--transport chrome-node` o `--transport twilio` para verificar previamente un
transporte específico antes de que un agente lo intente.

Para Twilio, verifica siempre el transporte explícitamente cuando el transporte predeterminado
sea Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Eso detecta cableado faltante de `voice-call`, credenciales de Twilio o exposición de
webhook inaccesible antes de que el agente intente marcar la reunión.

Únete a una reunión:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

O permite que un agente se una mediante la herramienta `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

La herramienta `google_meet` orientada al agente sigue disponible en hosts que no son macOS para
flujos de artefactos, calendario, configuración, transcripción, Twilio y `chrome-node`. Las acciones locales de respuesta de Chrome se bloquean allí porque la ruta de audio de Chrome incluida actualmente depende de `BlackHole 2ch` de macOS. En Linux, usa `mode: "transcribe"`,
marcado entrante de Twilio o un host macOS `chrome-node` para participación con respuesta de Chrome.

Crea una nueva reunión y únete a ella:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Para salas creadas por API, usa `SpaceConfig.accessType` de Google Meet cuando quieras
que la política sin solicitud de acceso de la sala sea explícita en lugar de heredarse de los valores predeterminados de la cuenta de Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode realtime
```

`OPEN` permite que cualquiera con la URL de Meet se una sin solicitar acceso. `TRUSTED` permite que los usuarios de confianza de la organización anfitriona, los usuarios externos invitados y los usuarios de llamada entrante se unan sin solicitar acceso. `RESTRICTED` limita la entrada sin solicitud de acceso a los invitados. Esta configuración solo se aplica a la ruta oficial de creación de la API de Google Meet, por lo que las credenciales de OAuth deben estar configuradas.

Si autenticaste Google Meet antes de que esta opción estuviera disponible, vuelve a ejecutar
`openclaw googlemeet auth login --json` después de añadir el alcance
`meetings.space.settings` a tu pantalla de consentimiento OAuth de Google.

Crea solo la URL sin unirte:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` tiene dos rutas:

- Creación por API: se usa cuando las credenciales OAuth de Google Meet están configuradas. Esta es
  la ruta más determinista y no depende del estado de la interfaz del navegador.
- Alternativa del navegador: se usa cuando no hay credenciales OAuth. OpenClaw usa el
  nodo de Chrome fijado, abre `https://meet.google.com/new`, espera a que Google
  redirija a una URL real con código de reunión y luego devuelve esa URL. Esta ruta requiere
  que el perfil de Chrome de OpenClaw en el nodo ya tenga una sesión iniciada en Google.
  La automatización del navegador gestiona el propio aviso inicial de micrófono de Meet; ese aviso
  no se trata como un fallo de inicio de sesión de Google.
  Los flujos de unión y creación también intentan reutilizar una pestaña de Meet existente antes de abrir una
  nueva. La coincidencia ignora cadenas de consulta de URL inocuas como `authuser`, por lo que un
  reintento del agente debería enfocar la reunión ya abierta en lugar de crear una segunda
  pestaña de Chrome.

La salida del comando/herramienta incluye un campo `source` (`api` o `browser`) para que los agentes
puedan explicar qué ruta se usó. `create` se une a la nueva reunión de forma predeterminada y
devuelve `joined: true` más la sesión de unión. Para solo acuñar la URL, usa
`create --no-join` en la CLI o pasa `"join": false` a la herramienta.

O dile a un agente: "Crea un Google Meet, únete con voz en tiempo real y envíame
el enlace." El agente debería llamar a `google_meet` con `action: "create"` y
luego compartir el `meetingUri` devuelto.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Para una unión solo de observación/control del navegador, establece `"mode": "transcribe"`. Eso no
inicia el puente de voz en tiempo real dúplex, no requiere BlackHole ni SoX,
y no responderá en la reunión. Las uniones de Chrome en este modo también evitan
la concesión de permiso de micrófono/cámara de OpenClaw y evitan la ruta **Usar
micrófono** de Meet. Si Meet muestra un intersticial de elección de audio, la automatización intenta
la ruta sin micrófono y, si no, informa de una acción manual en lugar de abrir
el micrófono local. En modo de transcripción, los transportes gestionados de Chrome también instalan
un observador de subtítulos de Meet de mejor esfuerzo. `googlemeet status --json` y
`googlemeet doctor` muestran `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`,
y una cola breve `recentTranscript` para que los operadores puedan saber si el navegador
se unió a la llamada y si los subtítulos de Meet están produciendo texto.
Usa `openclaw googlemeet test-listen <meet-url> --transport chrome-node` cuando
necesites una prueba de sí/no: se une en modo de transcripción, espera subtítulos nuevos o
movimiento de transcripción, y devuelve `listenVerified`, `listenTimedOut`, campos de
acción manual y el estado de subtítulos más reciente.

Durante las sesiones en tiempo real, el estado de `google_meet` incluye la salud del navegador y del puente de audio,
como `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, las últimas marcas de tiempo
de entrada/salida, contadores de bytes y el estado cerrado del puente. Si aparece un aviso seguro de página de Meet,
la automatización del navegador lo gestiona cuando puede. El inicio de sesión, la admisión por parte del anfitrión y
los avisos de permiso del navegador/SO se informan como acción manual con un motivo y
un mensaje para que el agente lo transmita. Las sesiones gestionadas de Chrome solo emiten la introducción o
la frase de prueba después de que la salud del navegador informe `inCall: true`; de lo contrario, el estado informa
`speechReady: false` y el intento de voz se bloquea en lugar de simular que el
agente habló en la reunión.

Las uniones locales de Chrome pasan por el perfil de navegador de OpenClaw con sesión iniciada. El modo en tiempo real
requiere `BlackHole 2ch` para la ruta de micrófono/altavoz que usa OpenClaw. Para
audio dúplex limpio, usa dispositivos virtuales separados o un grafo de estilo Loopback; un
solo dispositivo BlackHole es suficiente para una primera prueba de humo, pero puede producir eco.

### Gateway local + Chrome en Parallels

**No** necesitas un Gateway de OpenClaw completo ni una clave de API de modelo dentro de una VM de macOS
solo para que la VM sea propietaria de Chrome. Ejecuta el Gateway y el agente localmente, luego ejecuta un
host de nodo en la VM. Habilita el plugin incluido en la VM una vez para que el nodo
anuncie el comando de Chrome:

Qué se ejecuta dónde:

- Host de Gateway: Gateway de OpenClaw, espacio de trabajo del agente, claves de modelo/API, proveedor en tiempo real y la configuración del plugin de Google Meet.
- VM macOS de Parallels: CLI/host de nodo de OpenClaw, Google Chrome, SoX, BlackHole 2ch
  y un perfil de Chrome con sesión iniciada en Google.
- No se necesita en la VM: servicio de Gateway, configuración del agente, clave de OpenAI/GPT o configuración de proveedor de modelo.

Instala las dependencias de la VM:

```bash
brew install blackhole-2ch sox
```

Reinicia la VM después de instalar BlackHole para que macOS exponga `BlackHole 2ch`:

```bash
sudo reboot
```

Después de reiniciar, verifica que la VM pueda ver el dispositivo de audio y los comandos de SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Instala o actualiza OpenClaw en la VM y luego habilita allí el plugin incluido:

```bash
openclaw plugins enable google-meet
```

Inicia el host de nodo en la VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Si `<gateway-host>` es una IP de LAN y no estás usando TLS, el nodo rechaza el
WebSocket en texto plano a menos que aceptes explícitamente esa red privada de confianza:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Usa la misma variable de entorno al instalar el nodo como LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` es entorno de proceso, no una configuración de
`openclaw.json`. `openclaw node install` lo almacena en el entorno de LaunchAgent
cuando está presente en el comando de instalación.

Aprueba el nodo desde el host de Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Confirma que el Gateway ve el nodo y que anuncia tanto `googlemeet.chrome`
como la capacidad de navegador/`browser.proxy`:

```bash
openclaw nodes status
```

Enruta Meet a través de ese nodo en el host de Gateway:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome", "browser.proxy"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chrome: {
            guestName: "OpenClaw Agent",
            autoJoin: true,
            reuseExistingTab: true,
          },
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

Ahora únete normalmente desde el host de Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

o pide al agente que use la herramienta `google_meet` con `transport: "chrome-node"`.

Para una prueba de humo de un solo comando que crea o reutiliza una sesión, dice una frase conocida
e imprime el estado de la sesión:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Durante la unión en tiempo real, la automatización del navegador de OpenClaw rellena el nombre del invitado, hace clic en
Unirse/Solicitar unirse y acepta la opción inicial de Meet "Usar micrófono" cuando aparece ese
aviso. Durante una unión solo de observación o la creación de una reunión solo con navegador, continúa
más allá del mismo aviso sin micrófono cuando esa opción está disponible.
Si el perfil del navegador no tiene la sesión iniciada, Meet está esperando la admisión del anfitrión,
Chrome necesita permiso de micrófono/cámara para una unión en tiempo real, o Meet está bloqueado
en un aviso que la automatización no pudo resolver, el resultado de join/test-speech informa
`manualActionRequired: true` con `manualActionReason` y
`manualActionMessage`. Los agentes deben dejar de reintentar la unión, informar ese
mensaje exacto más el `browserUrl`/`browserTitle` actual, y reintentar solo después de que
la acción manual en el navegador esté completa.

Si se omite `chromeNode.node`, OpenClaw selecciona automáticamente solo cuando exactamente un
nodo conectado anuncia tanto `googlemeet.chrome` como control del navegador. Si
hay varios nodos capaces conectados, establece `chromeNode.node` en el id del nodo,
el nombre visible o la IP remota.

Comprobaciones de fallos comunes:

- `Configured Google Meet node ... is not usable: offline`: el nodo fijado es
  conocido por el Gateway pero no está disponible. Los agentes deben tratar ese nodo como
  estado de diagnóstico, no como un host Chrome utilizable, e informar el bloqueador de configuración
  en lugar de recurrir a otro transporte salvo que el usuario haya pedido eso.
- `No connected Google Meet-capable node`: inicia `openclaw node run` en la VM,
  aprueba el emparejamiento y asegúrate de que `openclaw plugins enable google-meet` y
  `openclaw plugins enable browser` se hayan ejecutado en la VM. Confirma también que el
  host del Gateway permite ambos comandos de nodo con
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: instala `blackhole-2ch` en el host
  que se está comprobando y reinicia antes de usar audio local de Chrome.
- `BlackHole 2ch audio device not found on the node`: instala `blackhole-2ch`
  en la VM y reinicia la VM.
- Chrome se abre pero no puede unirse: inicia sesión en el perfil del navegador dentro de la VM, o
  mantén `chrome.guestName` configurado para la unión como invitado. La unión automática como invitado usa la
  automatización del navegador de OpenClaw mediante el proxy de navegador del nodo; asegúrate de que la configuración del navegador
  del nodo apunte al perfil que quieres, por ejemplo
  `browser.defaultProfile: "user"` o un perfil con nombre de sesión existente.
- Pestañas de Meet duplicadas: deja `chrome.reuseExistingTab: true` habilitado. OpenClaw
  activa una pestaña existente para la misma URL de Meet antes de abrir una nueva, y
  la creación de reuniones en navegador reutiliza una pestaña en curso de `https://meet.google.com/new`
  o de aviso de cuenta de Google antes de abrir otra.
- Sin audio: en Meet, enruta el audio del micrófono/altavoz a través de la ruta del dispositivo de audio virtual
  usada por OpenClaw; usa dispositivos virtuales separados o enrutamiento estilo Loopback
  para audio dúplex limpio.

## Notas de instalación

El valor predeterminado de respuesta de audio de Chrome usa dos herramientas externas:

- `sox`: utilidad de audio de línea de comandos. El plugin usa comandos explícitos de dispositivo
  CoreAudio para el puente de audio PCM16 predeterminado de 24 kHz.
- `blackhole-2ch`: controlador de audio virtual de macOS. Crea el dispositivo de audio `BlackHole 2ch`
  por el que Chrome/Meet puede enrutar.

OpenClaw no incluye ni redistribuye ninguno de los dos paquetes. La documentación pide a los usuarios que
los instalen como dependencias del host mediante Homebrew. SoX tiene licencia
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole es GPL-3.0. Si creas un
instalador o dispositivo que incluya BlackHole con OpenClaw, revisa los términos de licencia
upstream de BlackHole u obtén una licencia separada de Existential Audio.

## Transportes

### Chrome

El transporte Chrome abre la URL de Meet mediante el control del navegador de OpenClaw y se une
como el perfil de navegador OpenClaw con sesión iniciada. En macOS, el plugin comprueba
`BlackHole 2ch` antes del inicio. Si está configurado, también ejecuta un comando de
salud del puente de audio y un comando de inicio antes de abrir Chrome. Usa `chrome` cuando
Chrome/audio residan en el host del Gateway; usa `chrome-node` cuando Chrome/audio residan
en un nodo emparejado, como una VM macOS de Parallels. Para Chrome local, elige el
perfil con `browser.defaultProfile`; `chrome.browserProfile` se pasa a los hosts
`chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Enruta el audio del micrófono y altavoz de Chrome a través del puente de audio local de OpenClaw.
Si `BlackHole 2ch` no está instalado, la unión falla con un error de configuración
en lugar de unirse silenciosamente sin una ruta de audio.

### Twilio

El transporte Twilio es un plan de marcado estricto delegado al plugin Voice Call. No
analiza páginas de Meet para buscar números de teléfono.

Úsalo cuando la participación con Chrome no esté disponible o quieras una alternativa de
marcado telefónico. Google Meet debe exponer un número telefónico de acceso y un PIN para la
reunión; OpenClaw no los descubre desde la página de Meet.

Habilita el plugin Voice Call en el host del Gateway, no en el nodo Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // or set "twilio" if Twilio should be the default
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
        },
      },
    },
  },
}
```

Proporciona las credenciales de Twilio mediante entorno o configuración. El entorno mantiene
los secretos fuera de `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Reinicia o recarga el Gateway después de habilitar `voice-call`; los cambios de configuración del plugin
no aparecen en un proceso de Gateway ya en ejecución hasta que se recarga.

Luego verifica:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Cuando la delegación de Twilio está conectada, `googlemeet setup` incluye comprobaciones
correctas de `twilio-voice-call-plugin`, `twilio-voice-call-credentials` y
`twilio-voice-call-webhook`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Usa `--dtmf-sequence` cuando la reunión necesite una secuencia personalizada:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth y preflight

OAuth es opcional para crear un enlace de Meet porque `googlemeet create` puede recurrir
a la automatización del navegador. Configura OAuth cuando quieras creación mediante API oficial,
resolución de espacios o comprobaciones preflight de la Meet Media API.

El acceso a Google Meet API usa OAuth de usuario: crea un cliente OAuth de Google Cloud,
solicita los alcances requeridos, autoriza una cuenta de Google y luego almacena el
token de actualización resultante en la configuración del plugin de Google Meet o proporciona las
variables de entorno `OPENCLAW_GOOGLE_MEET_*`.

OAuth no reemplaza la ruta de unión con Chrome. Los transportes Chrome y Chrome-node
siguen uniéndose mediante un perfil de Chrome con sesión iniciada, BlackHole/SoX y un nodo
conectado cuando usas participación mediante navegador. OAuth es solo para la ruta oficial de
Google Meet API: crear espacios de reunión, resolver espacios y ejecutar comprobaciones
preflight de la Meet Media API.

### Crear credenciales de Google

En Google Cloud Console:

1. Crea o selecciona un proyecto de Google Cloud.
2. Habilita **Google Meet REST API** para ese proyecto.
3. Configura la pantalla de consentimiento OAuth.
   - **Internal** es lo más simple para una organización de Google Workspace.
   - **External** funciona para configuraciones personales/de prueba; mientras la app esté en Testing,
     añade como usuario de prueba cada cuenta de Google que autorizará la app.
4. Añade los alcances que OpenClaw solicita:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Crea un ID de cliente OAuth.
   - Tipo de aplicación: **Web application**.
   - URI de redirección autorizada:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Copia el ID de cliente y el secreto de cliente.

`meetings.space.created` es requerido por `spaces.create` de Google Meet.
`meetings.space.readonly` permite a OpenClaw resolver URL/códigos de Meet a espacios.
`meetings.space.settings` permite a OpenClaw pasar configuraciones de `SpaceConfig` como
`accessType` durante la creación de salas mediante API.
`meetings.conference.media.readonly` es para preflight de la Meet Media API y trabajo con medios;
Google puede requerir inscripción en Developer Preview para el uso real de la Media API.
Si solo necesitas uniones de Chrome basadas en navegador, omite OAuth por completo.

### Emitir el token de actualización

Configura `oauth.clientId` y opcionalmente `oauth.clientSecret`, o pásalos como
variables de entorno, y luego ejecuta:

```bash
openclaw googlemeet auth login --json
```

El comando imprime un bloque de configuración `oauth` con un token de actualización. Usa PKCE,
callback localhost en `http://localhost:8085/oauth2callback` y un flujo manual
de copiar/pegar con `--manual`.

Ejemplos:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Usa el modo manual cuando el navegador no pueda alcanzar el callback local:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

La salida JSON incluye:

```json
{
  "oauth": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "refreshToken": "refresh-token",
    "accessToken": "access-token",
    "expiresAt": 1770000000000
  },
  "scope": "..."
}
```

Almacena el objeto `oauth` bajo la configuración del plugin de Google Meet:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          oauth: {
            clientId: "your-client-id",
            clientSecret: "your-client-secret",
            refreshToken: "refresh-token",
          },
        },
      },
    },
  },
}
```

Prefiere variables de entorno cuando no quieras el token de actualización en la configuración.
Si hay valores tanto de configuración como de entorno, el plugin resuelve primero la configuración
y luego recurre al entorno.

El consentimiento OAuth incluye creación de espacios de Meet, acceso de lectura a espacios de Meet y acceso
de lectura a medios de conferencias de Meet. Si te autenticaste antes de que existiera el soporte
para creación de reuniones, vuelve a ejecutar `openclaw googlemeet auth login --json` para que el token
de actualización tenga el alcance `meetings.space.created`.

### Verificar OAuth con doctor

Ejecuta el doctor de OAuth cuando quieras una comprobación de salud rápida y sin secretos:

```bash
openclaw googlemeet doctor --oauth --json
```

Esto no carga el runtime de Chrome ni requiere un nodo Chrome conectado. Comprueba
que exista configuración OAuth y que el token de actualización pueda emitir un token de acceso.
El informe JSON incluye solo campos de estado como `ok`, `configured`,
`tokenSource`, `expiresAt` y mensajes de comprobación; no imprime el token de acceso,
el token de actualización ni el secreto de cliente.

Resultados comunes:

| Comprobación         | Significado                                                                            |
| -------------------- | -------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` más `oauth.refreshToken`, o un token de acceso en caché, está presente. |
| `oauth-token`        | El token de acceso en caché sigue siendo válido, o el token de actualización emitió un nuevo token de acceso. |
| `meet-spaces-get`    | La comprobación opcional `--meeting` resolvió un espacio de Meet existente.             |
| `meet-spaces-create` | La comprobación opcional `--create-space` creó un nuevo espacio de Meet.                |

Para demostrar también la habilitación de Google Meet API y el alcance `spaces.create`, ejecuta la
comprobación de creación con efectos secundarios:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` crea una URL de Meet desechable. Úsalo cuando necesites confirmar
que el proyecto de Google Cloud tiene la API de Meet habilitada y que la cuenta
autorizada tiene el alcance `meetings.space.created`.

Para demostrar acceso de lectura a un espacio de reunión existente:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` y `resolve-space` demuestran acceso de lectura a un
espacio existente al que la cuenta de Google autorizada puede acceder. Un `403`
de estas comprobaciones suele significar que la API REST de Google Meet está
deshabilitada, que al token de actualización consentido le falta el alcance
requerido o que la cuenta de Google no puede acceder a ese espacio de Meet. Un
error de token de actualización significa que debes volver a ejecutar
`openclaw googlemeet auth login --json` y almacenar el nuevo bloque `oauth`.

No se necesitan credenciales de OAuth para el respaldo del navegador. En ese
modo, la autenticación de Google viene del perfil de Chrome con sesión iniciada
en el nodo seleccionado, no de la configuración de OpenClaw.

Estas variables de entorno se aceptan como respaldos:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` o `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` o `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` o `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` o `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` o
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` o `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` o `GOOGLE_MEET_PREVIEW_ACK`

Resuelve una URL de Meet, un código o `spaces/{id}` mediante `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Ejecuta la comprobación previa antes del trabajo multimedia:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Lista los artefactos de reunión y la asistencia después de que Meet haya creado
registros de conferencia:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Con `--meeting`, `artifacts` y `attendance` usan de forma predeterminada el
registro de conferencia más reciente. Pasa `--all-conference-records` cuando
quieras todos los registros conservados para esa reunión.

La búsqueda de Calendar puede resolver la URL de la reunión desde Google
Calendar antes de leer los artefactos de Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` busca en el calendario `primary` de hoy un evento de Calendar con un
enlace de Google Meet. Usa `--event <query>` para buscar texto de evento
coincidente y `--calendar <id>` para un calendario no principal. La búsqueda en
Calendar requiere un nuevo inicio de sesión OAuth que incluya el alcance de solo
lectura de eventos de Calendar. `calendar-events` previsualiza los eventos de
Meet coincidentes y marca el evento que elegirán `latest`, `artifacts`,
`attendance` o `export`.

Si ya conoces el id del registro de conferencia, dirígete a él directamente:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Finaliza una conferencia activa para un espacio creado por API cuando quieras
cerrar la sala después de la llamada:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Esto llama a `spaces.endActiveConference` de Google Meet y requiere OAuth con el
alcance `meetings.space.created` para un espacio que la cuenta autorizada pueda
administrar. OpenClaw acepta como entrada una URL de Meet, un código de reunión
o `spaces/{id}`, y la resuelve al recurso de espacio de la API antes de
finalizar la conferencia activa. Es independiente de `googlemeet leave`:
`leave` detiene la participación local/de sesión de OpenClaw, mientras que
`end-active-conference` pide a Google Meet que finalice la conferencia activa
del espacio.

Escribe un informe legible:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-attendance.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` devuelve metadatos de registro de conferencia más metadatos de
recursos de participantes, grabaciones, transcripciones, entradas de
transcripción estructuradas y notas inteligentes cuando Google los expone para
la reunión. Usa `--no-transcript-entries` para omitir la búsqueda de entradas en
reuniones grandes. `attendance` expande participantes en filas de sesiones de
participantes con horas de primera y última aparición, duración total de sesión,
marcas de llegada tarde/salida anticipada y recursos de participantes
duplicados fusionados por usuario con sesión iniciada o nombre mostrado. Pasa
`--no-merge-duplicates` para mantener separados los recursos de participantes
sin procesar, `--late-after-minutes` para ajustar la detección de llegadas tarde
y `--early-before-minutes` para ajustar la detección de salidas anticipadas.

`export` escribe una carpeta que contiene `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` y `manifest.json`.
`manifest.json` registra la entrada elegida, las opciones de exportación, los
registros de conferencia, los archivos de salida, los recuentos, el origen del
token, el evento de Calendar cuando se usó uno y cualquier advertencia de
recuperación parcial. Pasa `--zip` para escribir también un archivo portátil
junto a la carpeta. Pasa `--include-doc-bodies` para exportar el texto de Google
Docs de transcripciones y notas inteligentes enlazadas mediante `files.export`
de Google Drive; esto requiere un nuevo inicio de sesión OAuth que incluya el
alcance de solo lectura de Drive Meet. Sin `--include-doc-bodies`, las
exportaciones incluyen solo metadatos de Meet y entradas de transcripción
estructuradas. Si Google devuelve un fallo parcial de artefactos, como un error
de listado de notas inteligentes, de entradas de transcripción o del cuerpo de
documento de Drive, el resumen y el manifiesto conservan la advertencia en lugar
de hacer fallar toda la exportación. Usa `--dry-run` para obtener los mismos
datos de artefactos/asistencia e imprimir el JSON del manifiesto sin crear la
carpeta ni el ZIP. Eso es útil antes de escribir una exportación grande o cuando
un agente solo necesita recuentos, registros seleccionados y advertencias.

Los agentes también pueden crear el mismo paquete mediante la herramienta
`google_meet`:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

Establece `"dryRun": true` para devolver solo el manifiesto de exportación y
omitir las escrituras de archivos.

Los agentes también pueden crear una sala respaldada por API con una política de
acceso explícita:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime",
  "accessType": "OPEN"
}
```

Y pueden finalizar la conferencia activa de una sala conocida:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

Para la validación de escuchar primero, los agentes deben usar `test_listen`
antes de afirmar que la reunión es útil:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Ejecuta la prueba de humo en vivo protegida contra una reunión real conservada:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Ejecuta la sonda de navegador en vivo de escuchar primero contra una reunión
donde alguien hablará con subtítulos de Meet disponibles:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Entorno de prueba de humo en vivo:

- `OPENCLAW_LIVE_TEST=1` habilita las pruebas en vivo protegidas.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` apunta a una URL de Meet conservada, un
  código o `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` o `GOOGLE_MEET_CLIENT_ID` proporciona el id
  de cliente OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` o `GOOGLE_MEET_REFRESH_TOKEN`
  proporciona el token de actualización.
- Opcional: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` y
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` usan los mismos nombres de
  respaldo sin el prefijo `OPENCLAW_`.

La prueba de humo en vivo básica de artefactos/asistencia necesita
`https://www.googleapis.com/auth/meetings.space.readonly` y
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. La
búsqueda en Calendar necesita
`https://www.googleapis.com/auth/calendar.events.readonly`. La exportación del
cuerpo de documento de Drive necesita
`https://www.googleapis.com/auth/drive.meet.readonly`.

Crea un nuevo espacio de Meet:

```bash
openclaw googlemeet create
```

El comando imprime el nuevo `meeting uri`, el origen y la sesión de unión. Con
credenciales OAuth usa la API oficial de Google Meet. Sin credenciales OAuth usa
como respaldo el perfil de navegador con sesión iniciada del nodo de Chrome
fijado. Los agentes pueden usar la herramienta `google_meet` con
`action: "create"` para crear y unirse en un solo paso. Para crear solo la URL,
pasa `"join": false`.

Ejemplo de salida JSON del respaldo del navegador:

```json
{
  "source": "browser",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Si el respaldo del navegador encuentra el inicio de sesión de Google o un bloqueo
de permisos de Meet antes de poder crear la URL, el método de Gateway devuelve
una respuesta fallida y la herramienta `google_meet` devuelve detalles
estructurados en lugar de una cadena simple:

```json
{
  "source": "browser",
  "error": "google-login-required: Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

Cuando un agente ve `manualActionRequired: true`, debe informar el
`manualActionMessage` más el contexto de nodo/pestaña del navegador y dejar de
abrir nuevas pestañas de Meet hasta que el operador complete el paso del
navegador.

Ejemplo de salida JSON de creación por API:

```json
{
  "source": "api",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "space": {
    "name": "spaces/abc-defg-hij",
    "meetingCode": "abc-defg-hij",
    "meetingUri": "https://meet.google.com/abc-defg-hij"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Crear una reunión de Meet une de forma predeterminada. El transporte Chrome o
Chrome-node sigue necesitando un perfil de Google Chrome con sesión iniciada
para unirse mediante el navegador. Si el perfil tiene la sesión cerrada,
OpenClaw informa `manualActionRequired: true` o un error de respaldo del
navegador, y pide al operador que termine el inicio de sesión en Google antes de
reintentar.

Establece `preview.enrollmentAcknowledged: true` solo después de confirmar que
tu proyecto de Cloud, el principal de OAuth y los participantes de la reunión
están inscritos en Google Workspace Developer Preview Program para las API de
medios de Meet.

## Configuración

La ruta común del agente de Chrome solo necesita el Plugin habilitado,
BlackHole, SoX, una clave de proveedor de transcripción en tiempo real y un
proveedor de TTS de OpenClaw configurado. OpenAI es el proveedor de
transcripción predeterminado; establece `realtime.provider: "google"` para usar
Google Gemini Live en modo `bidi`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Define la configuración del Plugin en `plugins.entries.google-meet.config`:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Valores predeterminados:

- `defaultTransport: "chrome"`
- `defaultMode: "agent"` (`"realtime"` se acepta como alias de compatibilidad para
  `"agent"`)
- `chromeNode.node`: id/nombre/IP de Node opcional para `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: nombre usado en la pantalla de invitado
  de Meet sin sesión iniciada
- `chrome.autoJoin: true`: rellenado del nombre de invitado y clic en Unirse ahora
  con el mejor esfuerzo mediante la automatización del navegador de OpenClaw en `chrome-node`
- `chrome.reuseExistingTab: true`: activar una pestaña existente de Meet en lugar de
  abrir duplicados
- `chrome.waitForInCallMs: 20000`: esperar a que la pestaña de Meet informe que está en llamada
  antes de activar la introducción en tiempo real
- `chrome.audioFormat: "pcm16-24khz"`: formato de audio del par de comandos. Usa
  `"g711-ulaw-8khz"` solo para pares de comandos heredados/personalizados que todavía emiten
  audio de telefonía.
- `chrome.audioInputCommand`: comando de SoX que lee desde CoreAudio `BlackHole 2ch`
  y escribe audio en `chrome.audioFormat`
- `chrome.audioOutputCommand`: comando de SoX que lee audio en `chrome.audioFormat`
  y escribe en CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: comando de micrófono local opcional que escribe
  PCM mono little-endian firmado de 16 bits para detectar interrupciones humanas mientras
  la reproducción del asistente está activa. Actualmente esto se aplica al puente de par de comandos
  `chrome` alojado en el Gateway.
- `chrome.bargeInRmsThreshold: 650`: nivel RMS que cuenta como una interrupción humana
  en `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: nivel pico que cuenta como una interrupción humana
  en `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: retraso mínimo entre limpiezas repetidas de
  interrupciones humanas
- `mode: "agent"`: modo predeterminado de respuesta hablada. El habla de los participantes es transcrita por
  el proveedor de transcripción en tiempo real configurado, se envía al agente de
  OpenClaw configurado en una sesión de subagente por reunión y se reproduce mediante el
  runtime TTS normal de OpenClaw.
- `mode: "bidi"`: modo de modelo bidireccional directo en tiempo real de reserva. El
  proveedor de voz en tiempo real responde directamente al habla de los participantes y puede llamar a
  `openclaw_agent_consult` para respuestas más profundas o respaldadas por herramientas.
- `mode: "transcribe"`: modo solo observación sin el puente de respuesta hablada.
- `realtime.provider: "openai"`: id de proveedor usado por el modo `agent` para transcripción
  en tiempo real y por el modo `bidi` para voz en tiempo real.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: respuestas habladas breves, con
  `openclaw_agent_consult` para respuestas más profundas
- `realtime.introMessage`: breve comprobación hablada de disponibilidad cuando el puente en tiempo real
  se conecta; defínelo como `""` para unirse en silencio
- `realtime.agentId`: id de agente de OpenClaw opcional para
  `openclaw_agent_consult`; el valor predeterminado es `main`

Sobrescrituras opcionales:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  browser: {
    defaultProfile: "openclaw",
  },
  chrome: {
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
    bargeInInputCommand: [
      "sox",
      "-q",
      "-t",
      "coreaudio",
      "External Microphone",
      "-r",
      "24000",
      "-c",
      "1",
      "-b",
      "16",
      "-e",
      "signed-integer",
      "-t",
      "raw",
      "-",
    ],
  },
  chromeNode: {
    node: "parallels-macos",
  },
  defaultMode: "agent",
  realtime: {
    provider: "google",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

Configuración solo para Twilio:

```json5
{
  defaultTransport: "twilio",
  twilio: {
    defaultDialInNumber: "+15551234567",
    defaultPin: "123456",
  },
  voiceCall: {
    gatewayUrl: "ws://127.0.0.1:18789",
  },
}
```

`voiceCall.enabled` tiene `true` como valor predeterminado; con el transporte Twilio delega la
llamada PSTN real, DTMF y el saludo inicial al Plugin Voice Call. Voice Call
reproduce la secuencia DTMF antes de abrir el flujo multimedia en tiempo real y luego usa el
texto de introducción guardado como saludo inicial en tiempo real. Si `voice-call` no está
habilitado, Google Meet aún puede validar y registrar el plan de marcado, pero no puede
realizar la llamada de Twilio.

## Herramienta

Los agentes pueden usar la herramienta `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Usa `transport: "chrome"` cuando Chrome se ejecute en el host del Gateway. Usa
`transport: "chrome-node"` cuando Chrome se ejecute en un Node emparejado, como una VM de Parallels.
En ambos casos, los proveedores de modelos y `openclaw_agent_consult` se ejecutan en el
host del Gateway, por lo que las credenciales del modelo permanecen allí. Con el valor predeterminado
`mode: "agent"`, el proveedor de transcripción en tiempo real gestiona la escucha, el agente de OpenClaw
configurado produce la respuesta y el TTS normal de OpenClaw la reproduce en Meet. Usa
`mode: "bidi"` cuando quieras que el modelo de voz en tiempo real responda directamente.
`mode: "realtime"` sigue aceptándose como alias de compatibilidad para
`mode: "agent"`.

Usa `action: "status"` para listar sesiones activas o inspeccionar un ID de sesión. Usa
`action: "speak"` con `sessionId` y `message` para hacer que el agente en tiempo real
hable de inmediato. Usa `action: "test_speech"` para crear o reutilizar la sesión,
activar una frase conocida y devolver el estado `inCall` cuando el host de Chrome pueda
informarlo. `test_speech` siempre fuerza `mode: "agent"` y falla si se le pide
ejecutarse en `mode: "transcribe"` porque las sesiones solo observación no pueden
emitir habla de forma intencionada. Su resultado `speechOutputVerified` se basa en que los bytes
de salida de audio en tiempo real aumenten durante esta llamada de prueba, por lo que una sesión reutilizada con audio anterior
no cuenta como una comprobación de habla reciente y correcta. Usa `action: "leave"` para marcar
una sesión como finalizada.

`status` incluye el estado de Chrome cuando está disponible:

- `inCall`: Chrome parece estar dentro de la llamada de Meet
- `micMuted`: estado del micrófono de Meet con el mejor esfuerzo
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: el
  perfil del navegador necesita inicio de sesión manual, admisión del anfitrión de Meet, permisos o
  reparación del control del navegador antes de que el habla pueda funcionar
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: si
  el habla gestionada de Chrome está permitida ahora. `speechReady: false` significa que OpenClaw no
  envió la frase de introducción/prueba al puente de audio.
- `providerConnected` / `realtimeReady`: estado del puente de voz en tiempo real
- `lastInputAt` / `lastOutputAt`: último audio visto desde el puente o enviado a él
- `audioOutputRouted` / `audioOutputDeviceLabel`: si la salida multimedia de la pestaña de Meet
  se enrutó activamente al dispositivo BlackHole usado por el puente
- `lastSuppressedInputAt` / `suppressedInputBytes`: entrada de bucle de retorno ignorada mientras
  la reproducción del asistente está activa

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Modos Agent y Bidi

El modo `agent` de Chrome está optimizado para el comportamiento de "mi agente está en la reunión". El
proveedor de transcripción en tiempo real escucha el audio de la reunión, las transcripciones finales de los participantes
se enrutan a través del agente de OpenClaw configurado y la respuesta se
reproduce mediante el runtime TTS normal de OpenClaw. Define `mode: "bidi"` cuando quieras
que el modelo de voz en tiempo real responda directamente.
Los fragmentos cercanos de transcripción final se fusionan antes de la consulta para que un turno hablado
no produzca varias respuestas parciales obsoletas. La entrada en tiempo real también se
suprime mientras el audio del asistente en cola todavía se está reproduciendo,
y los ecos recientes de transcripciones parecidas al asistente se ignoran antes de la consulta al agente
para que el bucle de retorno de BlackHole no haga que el agente responda a su propia voz.

| Modo    | Quién decide la respuesta       | Ruta de salida de voz                         | Cuándo usarlo                                          |
| ------- | ------------------------------- | --------------------------------------------- | ------------------------------------------------------ |
| `agent` | El agente de OpenClaw configurado | Runtime TTS normal de OpenClaw                | Quieres el comportamiento de "mi agente está en la reunión" |
| `bidi`  | El modelo de voz en tiempo real | Respuesta de audio del proveedor de voz en tiempo real | Quieres el bucle de voz conversacional de menor latencia |

En el modo `bidi`, cuando el modelo en tiempo real necesita razonamiento más profundo, información actual
o herramientas normales de OpenClaw, puede llamar a `openclaw_agent_consult`.

La herramienta de consulta ejecuta el agente normal de OpenClaw en segundo plano con contexto reciente de
transcripción de la reunión y devuelve una respuesta hablada concisa. En el modo `agent`,
OpenClaw envía esa respuesta directamente al runtime TTS; en el modo `bidi`, el
modelo de voz en tiempo real puede decir el resultado de la consulta en la reunión. Usa
la misma maquinaria de consulta compartida que Voice Call.

De forma predeterminada, las consultas se ejecutan contra el agente `main`. Define `realtime.agentId` cuando un
carril de Meet deba consultar un espacio de trabajo de agente de OpenClaw dedicado, valores predeterminados de modelo,
política de herramientas, memoria e historial de sesión.

Las consultas en modo agente usan una clave de sesión `agent:<id>:subagent:google-meet:<session>`
por reunión para que las preguntas de seguimiento mantengan el contexto de la reunión mientras heredan la política
normal del agente desde el agente configurado.

`realtime.toolPolicy` controla la ejecución de la consulta:

- `safe-read-only`: exponer la herramienta de consulta y limitar el agente normal a
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` y
  `memory_get`.
- `owner`: exponer la herramienta de consulta y permitir que el agente normal use la política de herramientas
  normal del agente.
- `none`: no exponer la herramienta de consulta al modelo de voz en tiempo real.

La clave de sesión de consulta está delimitada por sesión de Meet, por lo que las llamadas de consulta de seguimiento
pueden reutilizar el contexto de consulta anterior durante la misma reunión.

Para forzar una comprobación hablada de disponibilidad después de que Chrome se haya unido por completo a la llamada:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Para la prueba completa de unirse y hablar:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Lista de comprobación de prueba en vivo

Usa esta secuencia antes de entregar una reunión a un agente sin supervisión:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Estado esperado de Chrome-node:

- `googlemeet setup` está completamente en verde.
- `googlemeet setup` incluye `chrome-node-connected` cuando Chrome-node es el
  transporte predeterminado o hay un Node fijado.
- `nodes status` muestra el Node seleccionado conectado.
- El Node seleccionado anuncia tanto `googlemeet.chrome` como `browser.proxy`.
- La pestaña de Meet se une a la llamada y `test-speech` devuelve el estado de Chrome con
  `inCall: true`.

Para un host remoto de Chrome, como una VM de macOS en Parallels, esta es la comprobación
segura más breve después de actualizar el Gateway o la VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Eso demuestra que el Plugin del Gateway está cargado, que el Node de la VM está conectado con el
token actual y que el puente de audio de Meet está disponible antes de que un agente abra una
pestaña de reunión real.

Para una prueba de Twilio, usa una reunión que exponga detalles de acceso telefónico:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Estado esperado de Twilio:

- `googlemeet setup` incluye comprobaciones verdes de `twilio-voice-call-plugin`,
  `twilio-voice-call-credentials` y `twilio-voice-call-webhook`.
- `voicecall` está disponible en la CLI después de recargar el Gateway.
- La sesión devuelta tiene `transport: "twilio"` y un `twilio.voiceCallId`.
- `openclaw logs --follow` muestra el TwiML de DTMF servido antes del TwiML en tiempo real, luego un
  puente en tiempo real con el saludo inicial en cola.
- `googlemeet leave <sessionId>` cuelga la llamada de voz delegada.

## Solución de problemas

### El agente no puede ver la herramienta de Google Meet

Confirma que el Plugin esté habilitado en la configuración del Gateway y recarga el Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Si acabas de editar `plugins.entries.google-meet`, reinicia o recarga el Gateway.
El agente en ejecución solo ve las herramientas de Plugin registradas por el proceso
actual del Gateway.

En hosts de Gateway que no son macOS, la herramienta `google_meet` orientada al agente permanece visible,
pero las acciones locales de respuesta por Chrome se bloquean antes de llegar al puente de audio.
El audio local de respuesta por Chrome actualmente depende de `BlackHole 2ch` de macOS, por lo que
los agentes Linux deberían usar `mode: "transcribe"`, acceso telefónico de Twilio o un host
`chrome-node` de macOS en lugar de la ruta predeterminada del agente local de Chrome.

### No hay ningún Node compatible con Google Meet conectado

En el host del Node, ejecuta:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

En el host del Gateway, aprueba el Node y verifica los comandos:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

El Node debe estar conectado y listar `googlemeet.chrome` además de `browser.proxy`.
La configuración del Gateway debe permitir esos comandos de Node:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Si `googlemeet setup` falla en `chrome-node-connected` o el registro del Gateway informa
`gateway token mismatch`, reinstala o reinicia el Node con el token actual del Gateway.
Para un Gateway de LAN, esto suele significar:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Luego recarga el servicio del Node y vuelve a ejecutar:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### El navegador se abre pero el agente no puede unirse

Ejecuta `googlemeet test-listen` para uniones de solo observación o `googlemeet test-speech`
para uniones en tiempo real, luego inspecciona el estado de Chrome devuelto. Si cualquiera de las pruebas
informa `manualActionRequired: true`, muestra `manualActionMessage` al operador
y deja de reintentar hasta que la acción del navegador se complete.

Acciones manuales habituales:

- Iniciar sesión en el perfil de Chrome.
- Admitir al invitado desde la cuenta anfitriona de Meet.
- Conceder permisos de micrófono/cámara a Chrome cuando aparezca el aviso de permiso
  nativo de Chrome.
- Cerrar o reparar un diálogo de permisos de Meet atascado.

No informes "not signed in" solo porque Meet muestre "Do you want people to
hear you in the meeting?" Ese es el intersticial de elección de audio de Meet; OpenClaw
hace clic en **Use microphone** mediante automatización del navegador cuando está disponible y sigue
esperando el estado real de la reunión. Para la alternativa de navegador solo para creación, OpenClaw
puede hacer clic en **Continue without microphone** porque crear la URL no necesita
la ruta de audio en tiempo real.

### La creación de la reunión falla

`googlemeet create` primero usa el endpoint `spaces.create` de la API de Google Meet
cuando las credenciales OAuth están configuradas. Sin credenciales OAuth, recurre
al navegador del Node de Chrome fijado. Confirma:

- Para la creación por API: `oauth.clientId` y `oauth.refreshToken` están configurados,
  o hay variables de entorno `OPENCLAW_GOOGLE_MEET_*` coincidentes.
- Para la creación por API: el token de actualización se emitió después de que se añadiera
  el soporte de creación. Los tokens anteriores pueden no tener el alcance `meetings.space.created`; vuelve a ejecutar
  `openclaw googlemeet auth login --json` y actualiza la configuración del Plugin.
- Para la alternativa de navegador: `defaultTransport: "chrome-node"` y
  `chromeNode.node` apuntan a un Node conectado con `browser.proxy` y
  `googlemeet.chrome`.
- Para la alternativa de navegador: el perfil de Chrome de OpenClaw en ese Node ha iniciado sesión
  en Google y puede abrir `https://meet.google.com/new`.
- Para la alternativa de navegador: los reintentos reutilizan una pestaña existente de `https://meet.google.com/new`
  o de solicitud de cuenta de Google antes de abrir una nueva pestaña. Si un agente agota el tiempo,
  reintenta la llamada a la herramienta en lugar de abrir manualmente otra pestaña de Meet.
- Para la alternativa de navegador: si la herramienta devuelve `manualActionRequired: true`, usa
  los valores devueltos `browser.nodeId`, `browser.targetId`, `browserUrl` y
  `manualActionMessage` para guiar al operador. No reintentes en bucle hasta que esa
  acción se complete.
- Para la alternativa de navegador: si Meet muestra "Do you want people to hear you in the
  meeting?", deja la pestaña abierta. OpenClaw debería hacer clic en **Use microphone** o, para
  la alternativa solo para creación, en **Continue without microphone** mediante automatización del
  navegador y seguir esperando la URL de Meet generada. Si no puede, el
  error debería mencionar `meet-audio-choice-required`, no `google-login-required`.

### El agente se une pero no habla

Comprueba la ruta en tiempo real:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Usa `mode: "agent"` para la ruta normal STT -> agente OpenClaw -> respuesta TTS,
o `mode: "bidi"` para la alternativa de voz directa en tiempo real. `mode: "transcribe"`
intencionalmente no inicia el puente de respuesta. Para depuración de solo observación,
ejecuta `openclaw googlemeet status --json <session-id>` después de que hablen los participantes
y comprueba `captioning`, `transcriptLines` y `lastCaptionText`. Si `inCall` es
true pero `transcriptLines` permanece en `0`, los subtítulos de Meet pueden estar deshabilitados, nadie
ha hablado desde que se instaló el observador, la interfaz de Meet cambió o los
subtítulos en directo no están disponibles para el idioma o la cuenta de la reunión.

`googlemeet test-speech` siempre comprueba la ruta en tiempo real e informa si
se observaron bytes de salida del puente para esa invocación. Si `speechOutputVerified` es false y
`speechOutputTimedOut` es true, es posible que el proveedor en tiempo real haya aceptado la
emisión, pero OpenClaw no vio que nuevos bytes de salida llegaran al puente de audio
de Chrome.

Verifica también:

- Hay una clave de proveedor en tiempo real disponible en el host del Gateway, como
  `OPENAI_API_KEY` o `GEMINI_API_KEY`.
- `BlackHole 2ch` está visible en el host de Chrome.
- `sox` existe en el host de Chrome.
- El micrófono y el altavoz de Meet están enrutados a través de la ruta de audio virtual usada por
  OpenClaw. `doctor` debería mostrar `meet output routed: yes` para uniones locales en tiempo real
  de Chrome.

`googlemeet doctor [session-id]` imprime la sesión, el Node, el estado en llamada,
el motivo de acción manual, la conexión del proveedor en tiempo real, `realtimeReady`, la actividad
de entrada/salida de audio, las últimas marcas de tiempo de audio, los contadores de bytes y la URL del navegador.
Usa `googlemeet status [session-id] --json` cuando necesites el JSON sin procesar. Usa
`googlemeet doctor --oauth` cuando necesites verificar la actualización OAuth de Google Meet
sin exponer tokens; añade `--meeting` o `--create-space` cuando también necesites una
prueba de la API de Google Meet.

Si un agente agotó el tiempo y puedes ver una pestaña de Meet ya abierta, inspecciona esa pestaña
sin abrir otra:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

La acción de herramienta equivalente es `recover_current_tab`. Enfoca e inspecciona una
pestaña de Meet existente para el transporte seleccionado. Con `chrome`, usa control local del
navegador a través del Gateway; con `chrome-node`, usa el Node de Chrome configurado.
No abre una pestaña nueva ni crea una sesión nueva; informa el
bloqueo actual, como inicio de sesión, admisión, permisos o estado de elección de audio.
El comando de la CLI habla con el Gateway configurado, por lo que el Gateway debe estar en ejecución;
`chrome-node` también requiere que el Node de Chrome esté conectado.

### Fallan las comprobaciones de configuración de Twilio

`twilio-voice-call-plugin` falla cuando `voice-call` no está permitido o no está habilitado.
Añádelo a `plugins.allow`, habilita `plugins.entries.voice-call` y recarga el
Gateway.

`twilio-voice-call-credentials` falla cuando al backend de Twilio le falta el SID de cuenta,
el token de autenticación o el número llamante. Configúralos en el host del Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` falla cuando `voice-call` no tiene exposición pública de Webhook
o cuando `publicUrl` apunta a loopback o a espacio de red privada.
Define `plugins.entries.voice-call.config.publicUrl` como la URL pública del proveedor o
configura una exposición de túnel/Tailscale para `voice-call`.

Las URL de loopback y privadas no son válidas para devoluciones de llamada de operadores. No uses
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` ni `fd00::/8` como `publicUrl`.

Para una URL pública estable:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          fromNumber: "+15550001234",
          publicUrl: "https://voice.example.com/voice/webhook",
        },
      },
    },
  },
}
```

Para desarrollo local, usa un túnel o una exposición de Tailscale en lugar de una URL de host
privado:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Luego reinicia o recarga el Gateway y ejecuta:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` es solo de preparación por defecto. Para hacer un simulacro con un número específico:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Añade `--yes` solo cuando quieras realizar intencionalmente una llamada saliente
de notificación en directo:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### La llamada de Twilio comienza pero nunca entra en la reunión

Confirma que el evento de Meet exponga los detalles de acceso telefónico. Pasa el número exacto
de acceso telefónico y el PIN o una secuencia DTMF personalizada:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Usa `w` iniciales o comas en `--dtmf-sequence` si el proveedor necesita una pausa
antes de introducir el PIN.

Si se crea la llamada telefónica pero la lista de Meet nunca muestra al participante
de acceso telefónico:

- Ejecuta `openclaw googlemeet doctor <session-id>` para confirmar el ID de llamada de Twilio
  delegada, si DTMF se puso en cola y si se solicitó el saludo introductorio.
- Ejecuta `openclaw voicecall status --call-id <id>` y confirma que la llamada sigue
  activa.
- Ejecuta `openclaw voicecall tail` y comprueba que los Webhooks de Twilio estén llegando al
  Gateway.
- Ejecuta `openclaw logs --follow` y busca la secuencia de Meet de Twilio: Google
  Meet delega la unión, Voice Call inicia el tramo telefónico, Google Meet espera
  `voiceCall.dtmfDelayMs`, envía DTMF con `voicecall.dtmf`, espera
  `voiceCall.postDtmfSpeechDelayMs` y luego solicita el discurso introductorio con
  `voicecall.speak`.
- Vuelve a ejecutar `openclaw googlemeet setup --transport twilio`; una comprobación de configuración verde es
  necesaria, pero no prueba que la secuencia del PIN de la reunión sea correcta.
- Confirma que el número de acceso telefónico pertenezca a la misma invitación y región de Meet que
  el PIN.
- Aumenta `voiceCall.dtmfDelayMs` si Meet contesta lentamente o si la transcripción de la llamada
  sigue mostrando la solicitud de introducir un PIN después de enviar DTMF.
- Si el participante se une pero no oyes el saludo, comprueba
  `openclaw logs --follow` para ver la solicitud `voicecall.speak` posterior a DTMF y
  la reproducción TTS por media-stream o la alternativa `<Say>` de Twilio. Si la
  transcripción de la llamada todavía contiene "enter the meeting PIN", el tramo telefónico aún no se ha unido
  a la sala de Meet, por lo que los participantes de la reunión no oirán el discurso.

Si los webhooks no llegan, depura primero el Plugin de llamada de voz: el proveedor debe
alcanzar `plugins.entries.voice-call.config.publicUrl` o el túnel configurado.
Consulta [Solución de problemas de llamadas de voz](/es/plugins/voice-call#troubleshooting).

## Notas

La API multimedia oficial de Google Meet está orientada a la recepción, por lo que hablar en una
llamada de Meet todavía necesita una ruta de participante. Este Plugin mantiene visible ese límite:
Chrome gestiona la participación en el navegador y el enrutamiento de audio local; Twilio gestiona
la participación telefónica por marcación.

Los modos de respuesta de Chrome necesitan `BlackHole 2ch` más una de estas opciones:

- `chrome.audioInputCommand` más `chrome.audioOutputCommand`: OpenClaw controla el
  puente y canaliza el audio en `chrome.audioFormat` entre esos comandos y el
  proveedor seleccionado. El modo agente usa transcripción en tiempo real más TTS normal;
  el modo bidi usa el proveedor de voz en tiempo real. La ruta predeterminada de Chrome es PCM16
  de 24 kHz; G.711 mu-law de 8 kHz sigue disponible para pares de comandos heredados.
- `chrome.audioBridgeCommand`: un comando de puente externo controla toda la ruta de
  audio local y debe salir después de iniciar o validar su daemon. Esto solo es
  válido para `bidi` porque el modo `agent` necesita acceso directo al par de comandos para TTS.

Para un audio dúplex limpio, enruta la salida de Meet y el micrófono de Meet mediante dispositivos
virtuales separados o un grafo de dispositivos virtuales de estilo Loopback. Un único dispositivo
BlackHole compartido puede devolver el eco de otros participantes a la llamada.

Con el puente de Chrome basado en pares de comandos, `chrome.bargeInInputCommand` puede escuchar un
micrófono local separado y limpiar la reproducción del asistente cuando la persona empieza a
hablar. Esto mantiene la voz humana por delante de la salida del asistente incluso cuando la entrada
local loopback compartida de BlackHole se suprime temporalmente durante la reproducción del asistente.
Al igual que `chrome.audioInputCommand` y `chrome.audioOutputCommand`, es un
comando local configurado por el operador. Usa una ruta de comando de confianza explícita o una
lista de argumentos, y no lo apuntes a scripts de ubicaciones no confiables.

`googlemeet speak` activa el puente de audio de respuesta activo para una sesión de Chrome.
`googlemeet leave` detiene ese puente. Para sesiones de Twilio delegadas
mediante el Plugin de llamada de voz, `leave` también cuelga la llamada de voz subyacente.
Usa `googlemeet end-active-conference` cuando también quieras cerrar la conferencia activa de
Google Meet para un espacio gestionado por API.

## Relacionado

- [Plugin de llamada de voz](/es/plugins/voice-call)
- [Modo de conversación](/es/nodes/talk)
- [Creación de plugins](/es/plugins/building-plugins)
