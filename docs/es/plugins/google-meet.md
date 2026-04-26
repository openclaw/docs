---
read_when:
    - Quieres que un agente de OpenClaw se una a una llamada de Google Meet
    - Quieres que un agente de OpenClaw cree una nueva llamada de Google Meet
    - Estás configurando Chrome, Chrome Node o Twilio como transporte de Google Meet
summary: 'Plugin de Google Meet: unirse a URL explícitas de Meet mediante Chrome o Twilio con valores predeterminados de voz en tiempo real'
title: Plugin de Google Meet
x-i18n:
    generated_at: "2026-04-26T11:34:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1bd53db711e4729a9a7b18f7aaa3eedffd71a1e19349fc858537652b5d17cfcb
    source_path: plugins/google-meet.md
    workflow: 15
---

Compatibilidad con participantes de Google Meet para OpenClaw: el plugin es explícito por diseño:

- Solo se une a una URL explícita `https://meet.google.com/...`.
- Puede crear un nuevo espacio de Meet mediante la API de Google Meet y luego unirse a la URL devuelta.
- La voz `realtime` es el modo predeterminado.
- La voz en tiempo real puede volver a llamar al agente completo de OpenClaw cuando se necesiten razonamiento o herramientas más profundos.
- Los agentes eligen el comportamiento de unión con `mode`: usa `realtime` para escuchar/hablar en vivo, o `transcribe` para unirse/controlar el navegador sin el puente de voz en tiempo real.
- La autenticación comienza como Google OAuth personal o un perfil de Chrome que ya haya iniciado sesión.
- No hay anuncio automático de consentimiento.
- El backend de audio predeterminado de Chrome es `BlackHole 2ch`.
- Chrome puede ejecutarse localmente o en un host Node emparejado.
- Twilio acepta un número de acceso telefónico más una secuencia opcional de PIN o DTMF.
- El comando CLI es `googlemeet`; `meet` está reservado para flujos más amplios de teleconferencia del agente.

## Inicio rápido

Instala las dependencias locales de audio y configura un proveedor de voz en tiempo real de backend. OpenAI es el predeterminado; Google Gemini Live también funciona con
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# o
export GEMINI_API_KEY=...
```

`blackhole-2ch` instala el dispositivo de audio virtual `BlackHole 2ch`. El instalador de Homebrew
requiere un reinicio antes de que macOS exponga el dispositivo:

```bash
sudo reboot
```

Después del reinicio, verifica ambas piezas:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
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

La salida de configuración está pensada para que el agente pueda leerla. Informa del perfil de Chrome,
puente de audio, fijación de Node, introducción retardada en tiempo real y, cuando está configurada la delegación a Twilio,
si el plugin `voice-call` y las credenciales de Twilio están listos.
Trata cualquier comprobación `ok: false` como un bloqueo antes de pedir a un agente que se una.
Usa `openclaw googlemeet setup --json` para scripts o salida legible por máquina.
Usa `--transport chrome`, `--transport chrome-node` o `--transport twilio`
para verificar previamente un transporte específico antes de que un agente lo intente.

Únete a una reunión:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

O deja que un agente se una mediante la herramienta `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Crea una nueva reunión y únete a ella:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Crea solo la URL sin unirte:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` tiene dos rutas:

- Creación por API: se usa cuando las credenciales OAuth de Google Meet están configuradas. Esta es
  la ruta más determinista y no depende del estado de la UI del navegador.
- Respaldo por navegador: se usa cuando faltan credenciales OAuth. OpenClaw usa el Node Chrome fijado, abre `https://meet.google.com/new`, espera a que Google redirija a una URL real con código de reunión y luego devuelve esa URL. Esta ruta requiere
  que el perfil Chrome de OpenClaw en el Node ya haya iniciado sesión en Google.
  La automatización del navegador gestiona el propio aviso inicial de micrófono de Meet; ese aviso
  no se trata como un fallo de inicio de sesión en Google.
  Los flujos de unión y creación también intentan reutilizar una pestaña Meet existente antes de abrir una
  nueva. La coincidencia ignora cadenas de consulta inocuas como `authuser`, por lo que un
  reintento del agente debería enfocar la reunión ya abierta en lugar de crear una segunda
  pestaña de Chrome.

La salida del comando/herramienta incluye un campo `source` (`api` o `browser`) para que los agentes
puedan explicar qué ruta se utilizó. `create` se une a la nueva reunión por defecto y
devuelve `joined: true` más la sesión de unión. Para solo generar la URL, usa
`create --no-join` en la CLI o pasa `"join": false` a la herramienta.

O dile a un agente: "Crea un Google Meet, únete con voz en tiempo real y envíame
el enlace". El agente debería llamar a `google_meet` con `action: "create"` y
luego compartir el `meetingUri` devuelto.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Para una unión de solo observación/control del navegador, establece `"mode": "transcribe"`. Eso
no inicia el puente de modelo dúplex en tiempo real, por lo que no responderá por voz dentro de la
reunión.

Durante las sesiones en tiempo real, el estado de `google_meet` incluye el navegador y el puente de audio,
como `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, las marcas de tiempo de la última entrada/salida,
contadores de bytes y estado de cierre del puente. Si aparece un aviso seguro de la página de Meet,
la automatización del navegador lo maneja cuando puede. El inicio de sesión, la admisión del anfitrión y
los avisos de permisos del navegador/SO se informan como acción manual con un motivo y
un mensaje para que el agente lo retransmita.

Chrome se une como el perfil de Chrome que ha iniciado sesión. En Meet, elige `BlackHole 2ch` para
la ruta de micrófono/altavoz usada por OpenClaw. Para un audio dúplex limpio, usa
dispositivos virtuales separados o un gráfico de estilo Loopback; un único dispositivo BlackHole es
suficiente para una primera prueba, pero puede producir eco.

### Gateway local + Chrome en Parallels

**No** necesitas un Gateway completo de OpenClaw ni una clave API de modelo dentro de una VM de macOS
solo para que la VM sea la propietaria de Chrome. Ejecuta el Gateway y el agente localmente,
y luego ejecuta un host Node en la VM. Habilita allí una vez el plugin incluido para que el Node
anuncie el comando de Chrome:

Qué se ejecuta y dónde:

- Host del Gateway: Gateway de OpenClaw, espacio de trabajo del agente, claves de modelo/API, proveedor
  en tiempo real y configuración del plugin de Google Meet.
- VM macOS de Parallels: CLI/host Node de OpenClaw, Google Chrome, SoX, BlackHole 2ch
  y un perfil de Chrome con sesión iniciada en Google.
- No se necesita en la VM: servicio Gateway, configuración del agente, clave OpenAI/GPT ni
  configuración del proveedor de modelos.

Instala las dependencias de la VM:

```bash
brew install blackhole-2ch sox
```

Reinicia la VM después de instalar BlackHole para que macOS exponga `BlackHole 2ch`:

```bash
sudo reboot
```

Después del reinicio, verifica que la VM pueda ver el dispositivo de audio y los comandos de SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Instala o actualiza OpenClaw en la VM y luego habilita allí el plugin incluido:

```bash
openclaw plugins enable google-meet
```

Inicia el host Node en la VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Si `<gateway-host>` es una IP LAN y no estás usando TLS, el Node rechaza el
WebSocket en texto claro a menos que actives explícitamente esa red privada de confianza:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Usa la misma variable de entorno al instalar el Node como LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` es una variable de entorno del proceso, no una
configuración de `openclaw.json`. `openclaw node install` la almacena en el entorno del LaunchAgent
cuando está presente en el comando de instalación.

Aprueba el Node desde el host del Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Confirma que el Gateway ve el Node y que anuncia tanto `googlemeet.chrome`
como capacidad de navegador/`browser.proxy`:

```bash
openclaw nodes status
```

Enruta Meet a través de ese Node en el host del Gateway:

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

Ahora únete normalmente desde el host del Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

o pide al agente que use la herramienta `google_meet` con `transport: "chrome-node"`.

Para una prueba de humo de un solo comando que crea o reutiliza una sesión, pronuncia una frase
conocida e imprime el estado de salud de la sesión:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Durante la unión, la automatización del navegador de OpenClaw rellena el nombre de invitado, pulsa Join/Ask
to join y acepta la opción inicial de Meet "Use microphone" cuando aparece ese aviso.
Durante la creación de reunión solo con navegador, también puede continuar más allá del
mismo aviso sin micrófono si Meet no muestra el botón de usar micrófono.
Si el perfil del navegador no ha iniciado sesión, Meet está esperando
la admisión del anfitrión, Chrome necesita permiso de micrófono/cámara o Meet está atascado en un
aviso que la automatización no pudo resolver, el resultado de join/test-speech informa
`manualActionRequired: true` con `manualActionReason` y
`manualActionMessage`. Los agentes deberían dejar de reintentar la unión,
informar de ese mensaje exacto más `browserUrl`/`browserTitle` actuales y
reintentar solo después de que se complete la acción manual en el navegador.

Si se omite `chromeNode.node`, OpenClaw selecciona automáticamente solo cuando exactamente un
Node conectado anuncia tanto `googlemeet.chrome` como control del navegador. Si
hay varios Nodes capaces conectados, establece `chromeNode.node` en el ID del Node,
el nombre para mostrar o la IP remota.

Comprobaciones comunes de fallos:

- `Configured Google Meet node ... is not usable: offline`: el Node fijado es
  conocido por el Gateway pero no está disponible. Los agentes deberían tratar ese Node como
  estado de diagnóstico, no como un host Chrome utilizable, e informar del bloqueo de configuración
  en lugar de cambiar a otro transporte, salvo que el usuario lo haya pedido.
- `No connected Google Meet-capable node`: inicia `openclaw node run` en la VM,
  aprueba el emparejamiento y asegúrate de que se hayan ejecutado `openclaw plugins enable google-meet` y
  `openclaw plugins enable browser` en la VM. Confirma también que el
  host del Gateway permite ambos comandos del Node con
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: instala `blackhole-2ch` en el host
  que se está comprobando y reinicia antes de usar audio local de Chrome.
- `BlackHole 2ch audio device not found on the node`: instala `blackhole-2ch`
  en la VM y reinicia la VM.
- Chrome se abre pero no puede unirse: inicia sesión en el perfil del navegador dentro de la VM, o
  mantén `chrome.guestName` definido para la unión como invitado. La unión automática como invitado usa la
  automatización del navegador de OpenClaw a través del proxy de navegador del Node; asegúrate de que la configuración del navegador del Node apunte al perfil que quieres, por ejemplo
  `browser.defaultProfile: "user"` o un perfil existing-session con nombre.
- Pestañas duplicadas de Meet: mantén activado `chrome.reuseExistingTab: true`. OpenClaw
  activa una pestaña existente para la misma URL de Meet antes de abrir una nueva, y
  la creación de reuniones por navegador reutiliza una pestaña en curso `https://meet.google.com/new`
  o una pestaña de aviso de cuenta de Google antes de abrir otra.
- Sin audio: en Meet, enruta micrófono/altavoz por la ruta del dispositivo virtual de audio
  usada por OpenClaw; usa dispositivos virtuales separados o enrutamiento de estilo Loopback
  para un audio dúplex limpio.

## Notas de instalación

El valor predeterminado de tiempo real de Chrome usa dos herramientas externas:

- `sox`: utilidad de audio por línea de comandos. El plugin usa sus comandos `rec` y `play` para el puente de audio predeterminado G.711 mu-law de 8 kHz.
- `blackhole-2ch`: controlador de audio virtual para macOS. Crea el dispositivo de audio `BlackHole 2ch` por el que Chrome/Meet puede enrutar.

OpenClaw no incluye ni redistribuye ninguno de los dos paquetes. La documentación pide a los usuarios
instalarlos como dependencias del host mediante Homebrew. SoX tiene licencia
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole es GPL-3.0. Si compilas un
instalador o dispositivo que incluya BlackHole junto con OpenClaw, revisa las
condiciones de licencia upstream de BlackHole o consigue una licencia aparte de Existential Audio.

## Transportes

### Chrome

El transporte Chrome abre la URL de Meet en Google Chrome y se une como el perfil de Chrome con sesión iniciada. En macOS, el plugin comprueba `BlackHole 2ch` antes del inicio.
Si está configurado, también ejecuta un comando de comprobación del estado del puente de audio y un comando de inicio
antes de abrir Chrome. Usa `chrome` cuando Chrome/audio vivan en el host del Gateway;
usa `chrome-node` cuando Chrome/audio vivan en un Node emparejado, como una VM de macOS en Parallels.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Enruta el audio del micrófono y el altavoz de Chrome a través del puente de audio local de OpenClaw. Si `BlackHole 2ch` no está instalado, la unión falla con un error de configuración
en lugar de unirse silenciosamente sin una ruta de audio.

### Twilio

El transporte Twilio es un plan de marcado estricto delegado al plugin Voice Call. No
analiza páginas de Meet para encontrar números de teléfono.

Úsalo cuando la participación mediante Chrome no esté disponible o quieras un
respaldo por acceso telefónico. Google Meet debe exponer un número de acceso telefónico y un PIN para la
reunión; OpenClaw no los detecta desde la página de Meet.

Habilita el plugin Voice Call en el host del Gateway, no en el Node de Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // o establece "twilio" si Twilio debe ser el valor predeterminado
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
no aparecen en un proceso Gateway ya en ejecución hasta que se recarga.

Después verifica:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Cuando la delegación de Twilio está conectada, `googlemeet setup` incluye comprobaciones correctas de
`twilio-voice-call-plugin` y `twilio-voice-call-credentials`.

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

## OAuth y comprobación previa

OAuth es opcional para crear un enlace de Meet porque `googlemeet create` puede recurrir
a la automatización del navegador. Configura OAuth cuando quieras creación oficial por API,
resolución de espacios o comprobaciones previas de la API de medios de Meet.

El acceso a la API de Google Meet usa OAuth de usuario: crea un cliente OAuth de Google Cloud,
solicita los alcances requeridos, autoriza una cuenta de Google y luego guarda el
token de actualización resultante en la configuración del plugin Google Meet o proporciona las
variables de entorno `OPENCLAW_GOOGLE_MEET_*`.

OAuth no reemplaza la ruta de unión mediante Chrome. Los transportes Chrome y Chrome-node
siguen uniéndose a través de un perfil de Chrome con sesión iniciada, BlackHole/SoX y un Node
conectado cuando usas participación desde el navegador. OAuth es solo para la ruta oficial de la
API de Google Meet: crear espacios de reunión, resolver espacios y ejecutar comprobaciones previas de la API de medios de Meet.

### Crear credenciales de Google

En Google Cloud Console:

1. Crea o selecciona un proyecto de Google Cloud.
2. Habilita **Google Meet REST API** para ese proyecto.
3. Configura la pantalla de consentimiento OAuth.
   - **Internal** es lo más sencillo para una organización de Google Workspace.
   - **External** funciona para configuraciones personales/de prueba; mientras la aplicación esté en Testing,
     añade como usuarios de prueba cada cuenta de Google que vaya a autorizar la aplicación.
4. Añade los alcances que solicita OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Crea un ID de cliente OAuth.
   - Tipo de aplicación: **Web application**.
   - URI de redirección autorizada:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Copia el ID de cliente y el secreto de cliente.

`meetings.space.created` es obligatorio para `spaces.create` de Google Meet.
`meetings.space.readonly` permite a OpenClaw resolver URL/códigos de Meet a espacios.
`meetings.conference.media.readonly` es para comprobaciones previas de la API de medios de Meet y trabajo con medios;
Google puede requerir inscripción en Developer Preview para el uso real de la API de medios.
Si solo necesitas uniones basadas en navegador con Chrome, omite OAuth por completo.

### Generar el token de actualización

Configura `oauth.clientId` y opcionalmente `oauth.clientSecret`, o pásalos como
variables de entorno, y luego ejecuta:

```bash
openclaw googlemeet auth login --json
```

El comando imprime un bloque de configuración `oauth` con un token de actualización. Usa PKCE,
callback localhost en `http://localhost:8085/oauth2callback` y un flujo manual de
copiar/pegar con `--manual`.

Ejemplos:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Usa el modo manual cuando el navegador no pueda llegar al callback local:

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

Guarda el objeto `oauth` bajo la configuración del plugin Google Meet:

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
Si hay valores tanto en configuración como en entorno, el plugin resuelve primero la configuración
y luego recurre al entorno.

El consentimiento OAuth incluye creación de espacios de Meet, acceso de lectura a espacios de Meet y acceso de lectura a medios de conferencia de Meet. Si te autenticaste antes de que existiera
la compatibilidad de creación de reuniones, vuelve a ejecutar `openclaw googlemeet auth login --json` para que el token de actualización tenga el alcance `meetings.space.created`.

### Verificar OAuth con doctor

Ejecuta el doctor de OAuth cuando quieras una comprobación rápida de estado sin secretos:

```bash
openclaw googlemeet doctor --oauth --json
```

Esto no carga el runtime de Chrome ni requiere un Node Chrome conectado. Comprueba
que exista la configuración OAuth y que el token de actualización pueda generar un token de acceso. El informe JSON incluye solo campos de estado como `ok`, `configured`,
`tokenSource`, `expiresAt` y mensajes de comprobación; no imprime el token de acceso,
el token de actualización ni el secreto del cliente.

Resultados comunes:

| Comprobación         | Significado                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `oauth-config`       | Están presentes `oauth.clientId` más `oauth.refreshToken`, o un token de acceso en caché.  |
| `oauth-token`        | El token de acceso en caché sigue siendo válido, o el token de actualización generó uno nuevo. |
| `meet-spaces-get`    | La comprobación opcional `--meeting` resolvió un espacio Meet existente.                    |
| `meet-spaces-create` | La comprobación opcional `--create-space` creó un nuevo espacio Meet.                       |

Para demostrar además la habilitación de la API de Google Meet y el alcance `spaces.create`, ejecuta la
comprobación de creación con efectos secundarios:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` crea una URL de Meet desechable. Úsalo cuando necesites confirmar
que el proyecto de Google Cloud tiene habilitada la API de Meet y que la cuenta autorizada
tiene el alcance `meetings.space.created`.

Para demostrar acceso de lectura a un espacio de reunión existente:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` y `resolve-space` demuestran acceso de lectura a un espacio existente
al que la cuenta autorizada de Google puede acceder. Un `403` en estas comprobaciones
normalmente significa que Google Meet REST API está deshabilitada, que al token de actualización consentido
le falta el alcance requerido o que la cuenta de Google no puede acceder a ese
espacio Meet. Un error de token de actualización significa volver a ejecutar `openclaw googlemeet auth login
--json` y almacenar el nuevo bloque `oauth`.

No se necesitan credenciales OAuth para el respaldo por navegador. En ese modo, la autenticación de Google
proviene del perfil de Chrome con sesión iniciada en el Node seleccionado, no de la
configuración de OpenClaw.

Estas variables de entorno se aceptan como fallback:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` o `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` o `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` o `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` o `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` o
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` o `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` o `GOOGLE_MEET_PREVIEW_ACK`

Resuelve una URL, código o `spaces/{id}` de Meet mediante `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Ejecuta la comprobación previa antes del trabajo con medios:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Lista artefactos de la reunión y asistencia después de que Meet haya creado registros de conferencia:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Con `--meeting`, `artifacts` y `attendance` usan por defecto el registro de conferencia
más reciente. Pasa `--all-conference-records` cuando quieras todos los registros conservados
de esa reunión.

La búsqueda en Calendar puede resolver la URL de la reunión desde Google Calendar antes de leer
artefactos de Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` busca en el calendario `primary` de hoy un evento de Calendar con un
enlace de Google Meet. Usa `--event <query>` para buscar texto coincidente del evento y
`--calendar <id>` para un calendario no principal. La búsqueda en Calendar requiere un
inicio de sesión OAuth reciente que incluya el alcance de solo lectura de eventos de Calendar.
`calendar-events` muestra una vista previa de los eventos Meet coincidentes y marca el evento que
elegirán `latest`, `artifacts`, `attendance` o `export`.

Si ya conoces el ID del registro de conferencia, dirígelo directamente:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

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

`artifacts` devuelve metadatos del registro de conferencia más metadatos de recursos de participantes,
grabación, transcripción, entrada de transcripción estructurada y notas inteligentes cuando
Google los expone para la reunión. Usa `--no-transcript-entries` para omitir
la búsqueda de entradas en reuniones grandes. `attendance` expande los participantes en
filas de sesión de participante con horas de primera/última aparición, duración total de la sesión,
marcas de llegada tarde/salida temprana y recursos de participante duplicados fusionados por usuario con sesión iniciada
o nombre para mostrar. Pasa `--no-merge-duplicates` para mantener separados los recursos brutos de participantes, `--late-after-minutes` para ajustar la detección de llegadas tarde y
`--early-before-minutes` para ajustar la detección de salidas tempranas.

`export` escribe una carpeta que contiene `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` y `manifest.json`.
`manifest.json` registra la entrada elegida, las opciones de exportación, los registros de conferencia,
los archivos de salida, los recuentos, el origen del token, el evento de Calendar cuando se utilizó
y cualquier advertencia de recuperación parcial. Pasa `--zip` para escribir además un archivo portátil
junto a la carpeta. Pasa `--include-doc-bodies` para exportar el texto de Google Docs enlazados de transcripción y notas inteligentes mediante Google Drive `files.export`; esto requiere un
inicio de sesión OAuth reciente que incluya el alcance de solo lectura de Drive Meet. Sin
`--include-doc-bodies`, las exportaciones incluyen solo metadatos de Meet y entradas de transcripción estructuradas. Si Google devuelve un fallo parcial de artefacto, como un error de listado de notas inteligentes,
entrada de transcripción o cuerpo de documento de Drive, el resumen y el
manifiesto conservan la advertencia en lugar de hacer fallar toda la exportación.
Usa `--dry-run` para recuperar los mismos datos de artefactos/asistencia e imprimir el
JSON del manifiesto sin crear la carpeta ni el ZIP. Esto es útil antes de escribir
una exportación grande o cuando un agente solo necesita recuentos, registros seleccionados
y advertencias.

Los agentes también pueden crear el mismo paquete mediante la herramienta `google_meet`:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

Establece `"dryRun": true` para devolver solo el manifiesto de exportación y omitir la escritura de archivos.

Ejecuta la prueba activa protegida contra una reunión real retenida:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Entorno de prueba activa:

- `OPENCLAW_LIVE_TEST=1` habilita pruebas activas protegidas.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` apunta a una URL, código o `spaces/{id}` de Meet retenido.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` o `GOOGLE_MEET_CLIENT_ID` proporciona el ID
  de cliente OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` o `GOOGLE_MEET_REFRESH_TOKEN` proporciona
  el token de actualización.
- Opcional: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` y
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` usan los mismos nombres de fallback
  sin el prefijo `OPENCLAW_`.

La prueba activa básica de artefactos/asistencia necesita
`https://www.googleapis.com/auth/meetings.space.readonly` y
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. La
búsqueda en Calendar necesita `https://www.googleapis.com/auth/calendar.events.readonly`. La exportación del cuerpo de documentos de Drive necesita
`https://www.googleapis.com/auth/drive.meet.readonly`.

Crea un espacio Meet nuevo:

```bash
openclaw googlemeet create
```

El comando imprime el nuevo `meeting uri`, el origen y la sesión de unión. Con credenciales OAuth
usa la API oficial de Google Meet. Sin credenciales OAuth usa como fallback el perfil de navegador con sesión iniciada del Node Chrome fijado. Los agentes pueden
usar la herramienta `google_meet` con `action: "create"` para crear y unirse en un
solo paso. Para crear solo la URL, pasa `"join": false`.

Ejemplo de salida JSON del fallback por navegador:

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

Si el fallback por navegador encuentra un inicio de sesión de Google o un bloqueo de permisos de Meet antes de que
pueda crear la URL, el método del Gateway devuelve una respuesta fallida y la
herramienta `google_meet` devuelve detalles estructurados en lugar de una cadena simple:

```json
{
  "source": "browser",
  "error": "google-login-required: Inicia sesión en Google en el perfil de navegador de OpenClaw y luego vuelve a intentar crear la reunión.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Inicia sesión en Google en el perfil de navegador de OpenClaw y luego vuelve a intentar crear la reunión.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

Cuando un agente ve `manualActionRequired: true`, debería informar del
`manualActionMessage` más el contexto de navegador/pestaña del nodo y dejar de abrir nuevas
pestañas de Meet hasta que el operador complete el paso en el navegador.

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

La creación de un Meet se une por defecto. El transporte Chrome o Chrome-node sigue
necesitando un perfil de Google Chrome con sesión iniciada para unirse a través del navegador. Si el
perfil tiene la sesión cerrada, OpenClaw informa `manualActionRequired: true` o un
error de fallback del navegador y pide al operador que complete el inicio de sesión de Google antes de
volver a intentarlo.

Establece `preview.enrollmentAcknowledged: true` solo después de confirmar que tu proyecto de Cloud, el principal OAuth y los participantes de la reunión están inscritos en el Google
Workspace Developer Preview Program para las API de medios de Meet.

## Configuración

La ruta común de Chrome en tiempo real solo necesita el plugin habilitado, BlackHole, SoX
y una clave de proveedor de voz en tiempo real de backend. OpenAI es el predeterminado; establece
`realtime.provider: "google"` para usar Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# o
export GEMINI_API_KEY=...
```

Establece la configuración del plugin en `plugins.entries.google-meet.config`:

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
- `defaultMode: "realtime"`
- `chromeNode.node`: ID/nombre/IP opcional del nodo para `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: nombre usado en la pantalla de invitado
  de Meet sin sesión iniciada
- `chrome.autoJoin: true`: rellenado de nombre de invitado y clic en Join Now
  de mejor esfuerzo mediante automatización del navegador de OpenClaw en `chrome-node`
- `chrome.reuseExistingTab: true`: activa una pestaña Meet existente en lugar de
  abrir duplicados
- `chrome.waitForInCallMs: 20000`: espera a que la pestaña Meet informe de llamada activa
  antes de activar la introducción en tiempo real
- `chrome.audioInputCommand`: comando SoX `rec` que escribe audio G.711 mu-law
  de 8 kHz en stdout
- `chrome.audioOutputCommand`: comando SoX `play` que lee audio G.711 mu-law
  de 8 kHz desde stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: respuestas habladas breves, con
  `openclaw_agent_consult` para respuestas más profundas
- `realtime.introMessage`: breve comprobación hablada de disponibilidad cuando el puente en tiempo real
  se conecta; establécelo en `""` para unirse en silencio

Sobrescrituras opcionales:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    provider: "google",
    toolPolicy: "owner",
    introMessage: "Di exactamente: Estoy aquí.",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

Configuración solo de Twilio:

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

`voiceCall.enabled` usa `true` por defecto; con el transporte Twilio delega la
llamada PSTN real y DTMF al plugin Voice Call. Si `voice-call` no está
habilitado, Google Meet aún puede validar y registrar el plan de marcado, pero no
puede realizar la llamada de Twilio.

## Herramienta

Los agentes pueden usar la herramienta `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Usa `transport: "chrome"` cuando Chrome se ejecute en el host del Gateway. Usa
`transport: "chrome-node"` cuando Chrome se ejecute en un Node emparejado, como una VM de
Parallels. En ambos casos, el modelo en tiempo real y `openclaw_agent_consult` se ejecutan en el
host del Gateway, por lo que las credenciales del modelo permanecen allí.

Usa `action: "status"` para listar sesiones activas o inspeccionar un ID de sesión. Usa
`action: "speak"` con `sessionId` y `message` para hacer que el agente en tiempo real
hable inmediatamente. Usa `action: "test_speech"` para crear o reutilizar la sesión,
activar una frase conocida y devolver el estado `inCall` cuando el host Chrome puede
informarlo. Usa `action: "leave"` para marcar una sesión como terminada.

`status` incluye el estado de salud de Chrome cuando está disponible:

- `inCall`: Chrome parece estar dentro de la llamada de Meet
- `micMuted`: estado del micrófono de Meet de mejor esfuerzo
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: el
  perfil del navegador necesita inicio de sesión manual, admisión del anfitrión en Meet, permisos o
  reparación del control del navegador antes de que la voz pueda funcionar
- `providerConnected` / `realtimeReady`: estado del puente de voz en tiempo real
- `lastInputAt` / `lastOutputAt`: último audio visto desde o enviado al puente

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Di exactamente: Estoy aquí y escuchando."
}
```

## Consulta del agente en tiempo real

El modo en tiempo real de Chrome está optimizado para un bucle de voz en vivo. El proveedor de voz
en tiempo real escucha el audio de la reunión y habla a través del puente de audio configurado.
Cuando el modelo en tiempo real necesita razonamiento más profundo, información actual o herramientas normales de OpenClaw, puede llamar a `openclaw_agent_consult`.

La herramienta de consulta ejecuta el agente normal de OpenClaw entre bastidores con el contexto reciente de la transcripción de la reunión y devuelve una respuesta hablada concisa a la sesión de voz en tiempo real. El modelo de voz puede entonces pronunciar esa respuesta dentro de la reunión.
Usa la misma herramienta compartida de consulta en tiempo real que Voice Call.

`realtime.toolPolicy` controla la ejecución de la consulta:

- `safe-read-only`: expone la herramienta de consulta y limita el agente normal a
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` y
  `memory_get`.
- `owner`: expone la herramienta de consulta y permite que el agente normal use la política normal de herramientas del agente.
- `none`: no expone la herramienta de consulta al modelo de voz en tiempo real.

La clave de sesión de consulta tiene alcance por sesión de Meet, por lo que las llamadas de consulta posteriores
pueden reutilizar el contexto previo de consulta durante la misma reunión.

Para forzar una comprobación hablada de disponibilidad después de que Chrome se haya unido por completo a la llamada:

```bash
openclaw googlemeet speak meet_... "Di exactamente: Estoy aquí y escuchando."
```

Para la prueba completa de unión y habla:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Di exactamente: Estoy aquí y escuchando."
```

## Lista de comprobación de pruebas activas

Usa esta secuencia antes de entregar una reunión a un agente sin supervisión:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Di exactamente: Prueba de voz de Google Meet completada."
```

Estado esperado de Chrome-node:

- `googlemeet setup` está completamente en verde.
- `googlemeet setup` incluye `chrome-node-connected` cuando `chrome-node` es el
  transporte predeterminado o hay un nodo fijado.
- `nodes status` muestra el nodo seleccionado conectado.
- El nodo seleccionado anuncia tanto `googlemeet.chrome` como `browser.proxy`.
- La pestaña Meet se une a la llamada y `test-speech` devuelve estado de Chrome con
  `inCall: true`.

Para un host Chrome remoto como una VM macOS de Parallels, esta es la comprobación segura
más corta después de actualizar el Gateway o la VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Esto demuestra que el plugin del Gateway está cargado, que el nodo de la VM está conectado con el
token actual y que el puente de audio de Meet está disponible antes de que un agente abra una
pestaña real de reunión.

Para una prueba de humo de Twilio, usa una reunión que exponga detalles de acceso telefónico:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Estado esperado de Twilio:

- `googlemeet setup` incluye comprobaciones en verde de `twilio-voice-call-plugin` y
  `twilio-voice-call-credentials`.
- `voicecall` está disponible en la CLI después de recargar el Gateway.
- La sesión devuelta tiene `transport: "twilio"` y un `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` cuelga la llamada de voz delegada.

## Solución de problemas

### El agente no puede ver la herramienta Google Meet

Confirma que el plugin está habilitado en la configuración del Gateway y recarga el Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Si acabas de editar `plugins.entries.google-meet`, reinicia o recarga el Gateway.
El agente en ejecución solo ve las herramientas de plugins registradas por el proceso
actual del Gateway.

### No hay ningún nodo conectado compatible con Google Meet

En el host del nodo, ejecuta:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

En el host del Gateway, aprueba el nodo y verifica los comandos:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

El nodo debe estar conectado y listar `googlemeet.chrome` además de `browser.proxy`.
La configuración del Gateway debe permitir esos comandos de nodo:

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
`gateway token mismatch`, reinstala o reinicia el nodo con el token actual del Gateway.
Para un Gateway en LAN, esto normalmente significa:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Luego recarga el servicio del nodo y vuelve a ejecutar:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### El navegador se abre pero el agente no puede unirse

Ejecuta `googlemeet test-speech` e inspecciona el estado de Chrome devuelto. Si
informa `manualActionRequired: true`, muestra `manualActionMessage` al operador
y deja de reintentar hasta que se complete la acción en el navegador.

Acciones manuales comunes:

- Iniciar sesión en el perfil de Chrome.
- Admitir al invitado desde la cuenta anfitriona de Meet.
- Conceder permisos de micrófono/cámara a Chrome cuando aparezca el aviso nativo de permisos de Chrome.
- Cerrar o reparar un cuadro de diálogo atascado de permisos de Meet.

No informes “sin iniciar sesión” solo porque Meet muestre “Do you want people to
hear you in the meeting?” Ese es el intersticial de elección de audio de Meet; OpenClaw
hace clic en **Use microphone** mediante automatización del navegador cuando está disponible y sigue esperando el estado real de la reunión. Para el fallback de creación solo por navegador, OpenClaw
puede hacer clic en **Continue without microphone** porque crear la URL no necesita
la ruta de audio en tiempo real.

### Falla la creación de la reunión

`googlemeet create` primero usa el endpoint `spaces.create` de la API de Google Meet
cuando se configuran credenciales OAuth. Sin credenciales OAuth recurre
al navegador del nodo Chrome fijado. Confirma:

- Para creación por API: están configurados `oauth.clientId` y `oauth.refreshToken`,
  o están presentes variables de entorno `OPENCLAW_GOOGLE_MEET_*` equivalentes.
- Para creación por API: el token de actualización se generó después de que se
  añadiera la compatibilidad de creación. Los tokens antiguos pueden no tener el alcance `meetings.space.created`; vuelve a ejecutar
  `openclaw googlemeet auth login --json` y actualiza la configuración del plugin.
- Para el fallback por navegador: `defaultTransport: "chrome-node"` y
  `chromeNode.node` apuntan a un nodo conectado con `browser.proxy` y
  `googlemeet.chrome`.
- Para el fallback por navegador: el perfil de Chrome de OpenClaw en ese nodo ha iniciado sesión
  en Google y puede abrir `https://meet.google.com/new`.
- Para el fallback por navegador: los reintentos reutilizan una pestaña existente de `https://meet.google.com/new`
  o de aviso de cuenta de Google antes de abrir una nueva pestaña. Si un agente agota el tiempo,
  vuelve a intentar la llamada a la herramienta en lugar de abrir manualmente otra pestaña de Meet.
- Para el fallback por navegador: si la herramienta devuelve `manualActionRequired: true`, usa
  los valores devueltos `browser.nodeId`, `browser.targetId`, `browserUrl` y
  `manualActionMessage` para guiar al operador. No reintentes en bucle hasta que esa
  acción se complete.
- Para el fallback por navegador: si Meet muestra “Do you want people to hear you in the
  meeting?”, deja la pestaña abierta. OpenClaw debería hacer clic en **Use microphone** o, para
  fallback de solo creación, en **Continue without microphone** mediante automatización del
  navegador y seguir esperando la URL de Meet generada. Si no puede, el
  error debería mencionar `meet-audio-choice-required`, no `google-login-required`.

### El agente se une pero no habla

Comprueba la ruta en tiempo real:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Usa `mode: "realtime"` para escuchar/responder por voz. `mode: "transcribe"` intencionadamente
no inicia el puente de voz dúplex en tiempo real.

Verifica también:

- Hay disponible una clave de proveedor en tiempo real en el host del Gateway, como
  `OPENAI_API_KEY` o `GEMINI_API_KEY`.
- `BlackHole 2ch` es visible en el host de Chrome.
- `rec` y `play` existen en el host de Chrome.
- El micrófono y el altavoz de Meet están enrutados a través de la ruta de audio virtual usada por
  OpenClaw.

`googlemeet doctor [session-id]` imprime la sesión, nodo, estado de llamada,
motivo de acción manual, conexión del proveedor en tiempo real, `realtimeReady`, actividad de entrada/salida de audio, marcas de tiempo del último audio, contadores de bytes y URL del navegador.
Usa `googlemeet status [session-id]` cuando necesites el JSON sin procesar. Usa
`googlemeet doctor --oauth` cuando necesites verificar la actualización OAuth de Google Meet
sin exponer tokens; añade `--meeting` o `--create-space` cuando también necesites una prueba de API de Google Meet.

Si un agente agotó el tiempo y puedes ver una pestaña Meet ya abierta, inspecciona esa pestaña
sin abrir otra:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

La acción equivalente de la herramienta es `recover_current_tab`. Enfoca e inspecciona una
pestaña Meet existente para el transporte seleccionado. Con `chrome`, usa control local
del navegador a través del Gateway; con `chrome-node`, usa el nodo Chrome configurado. No abre una nueva pestaña ni crea una nueva sesión; informa del
bloqueo actual, como inicio de sesión, admisión, permisos o estado de elección de audio.
El comando CLI habla con el Gateway configurado, por lo que el Gateway debe estar en ejecución;
`chrome-node` también requiere que el nodo Chrome esté conectado.

### Fallan las comprobaciones de configuración de Twilio

`twilio-voice-call-plugin` falla cuando `voice-call` no está permitido o no está habilitado.
Añádelo a `plugins.allow`, habilita `plugins.entries.voice-call` y recarga el
Gateway.

`twilio-voice-call-credentials` falla cuando al backend de Twilio le faltan account
SID, auth token o número de origen. Establécelos en el host del Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Después reinicia o recarga el Gateway y ejecuta:

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` solo comprueba disponibilidad por defecto. Para hacer una prueba en seco con un número específico:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Añade `--yes` solo cuando quieras intencionadamente realizar una llamada saliente
real de notificación:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### La llamada de Twilio empieza pero nunca entra en la reunión

Confirma que el evento de Meet expone detalles de acceso telefónico. Pasa el número exacto de acceso telefónico y el PIN, o una secuencia DTMF personalizada:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Usa `w` inicial o comas en `--dtmf-sequence` si el proveedor necesita una pausa
antes de introducir el PIN.

## Notas

La API oficial de medios de Google Meet está orientada a recepción, así que hablar dentro de una llamada de Meet todavía necesita una ruta de participante. Este plugin mantiene ese límite visible:
Chrome gestiona la participación por navegador y el enrutamiento local de audio; Twilio gestiona la participación por acceso telefónico.

El modo en tiempo real de Chrome necesita una de estas opciones:

- `chrome.audioInputCommand` más `chrome.audioOutputCommand`: OpenClaw controla el
  puente del modelo en tiempo real y canaliza audio G.711 mu-law de 8 kHz entre esos
  comandos y el proveedor de voz en tiempo real seleccionado.
- `chrome.audioBridgeCommand`: un comando externo de puente controla toda la ruta local
  de audio y debe salir después de iniciar o validar su demonio.

Para un audio dúplex limpio, enruta la salida de Meet y el micrófono de Meet a través de dispositivos
virtuales separados o un grafo de dispositivos virtuales de estilo Loopback. Un único dispositivo BlackHole compartido puede devolver eco de otros participantes a la llamada.

`googlemeet speak` activa el puente activo de audio en tiempo real para una sesión de Chrome.
`googlemeet leave` detiene ese puente. Para sesiones de Twilio delegadas a través del plugin Voice Call, `leave` también cuelga la llamada de voz subyacente.

## Relacionado

- [Plugin Voice Call](/es/plugins/voice-call)
- [Modo Talk](/es/nodes/talk)
- [Creación de plugins](/es/plugins/building-plugins)
