---
read_when:
    - Quieres que un agente de OpenClaw se una a una llamada de Google Meet
    - Quieres que un agente de OpenClaw cree una nueva llamada de Google Meet
    - Está configurando Chrome, un nodo de Chrome o Twilio como transporte de Google Meet
summary: 'Plugin de Google Meet: unirse a URL explícitas de Meet mediante Chrome o Twilio con valores predeterminados de voz en tiempo real'
title: Plugin de Google Meet
x-i18n:
    generated_at: "2026-04-30T05:52:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b989c872fee0dca31680f67559cd26b715303f7c6f4eeda51fc63889bb0383c
    source_path: plugins/google-meet.md
    workflow: 16
---

OpenClaw admite participantes de Google Meet; el plugin es explícito por diseño:

- Solo se une a una URL explícita `https://meet.google.com/...`.
- Puede crear un nuevo espacio de Meet mediante la API de Google Meet y luego unirse a la
  URL devuelta.
- La voz `realtime` es el modo predeterminado.
- La voz realtime puede volver a llamar al agente completo de OpenClaw cuando se necesitan
  razonamiento más profundo o herramientas.
- Los agentes eligen el comportamiento de unión con `mode`: usa `realtime` para escuchar y
  responder en vivo, o `transcribe` para unirse/controlar el navegador sin el puente de voz
  realtime.
- La autenticación empieza como OAuth personal de Google o como un perfil de Chrome con sesión ya iniciada.
- No hay anuncio automático de consentimiento.
- El backend de audio predeterminado de Chrome es `BlackHole 2ch`.
- Chrome puede ejecutarse localmente o en un host de Node emparejado.
- Twilio acepta un número de marcación más un PIN o una secuencia DTMF opcional.
- El comando de la CLI es `googlemeet`; `meet` está reservado para flujos de trabajo de
  teleconferencia de agentes más amplios.

## Inicio rápido

Instala las dependencias locales de audio y configura un proveedor backend de voz realtime.
OpenAI es el predeterminado; Google Gemini Live también funciona con
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

La salida de configuración está pensada para que los agentes la puedan leer y tenga en cuenta el modo. Informa el perfil de Chrome, la fijación de Node y, para uniones de Chrome realtime, el puente de audio BlackHole/SoX y las comprobaciones de introducción realtime retrasada. Para uniones de solo observación, comprueba el mismo transporte con `--mode transcribe`; ese modo omite los requisitos previos de audio realtime porque no escucha ni habla a través del puente:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Cuando la delegación de Twilio está configurada, la configuración también informa si el
plugin `voice-call` y las credenciales de Twilio están listos. Trata cualquier comprobación `ok: false`
como un bloqueo para el transporte y modo comprobados antes de pedir a un agente que se una. Usa `openclaw googlemeet setup --json` para scripts o salida legible por máquina. Usa `--transport chrome`, `--transport chrome-node` o `--transport twilio`
para comprobar previamente un transporte específico antes de que un agente lo intente.

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

- Creación por API: se usa cuando están configuradas las credenciales OAuth de Google Meet. Esta es
  la ruta más determinista y no depende del estado de la interfaz del navegador.
- Respaldo del navegador: se usa cuando faltan credenciales OAuth. OpenClaw usa el
  Node de Chrome fijado, abre `https://meet.google.com/new`, espera a que Google
  redirija a una URL real con código de reunión y luego devuelve esa URL. Esta ruta requiere
  que el perfil de Chrome de OpenClaw en el Node ya tenga sesión iniciada en Google.
  La automatización del navegador gestiona el aviso inicial de micrófono propio de Meet; ese aviso
  no se trata como un fallo de inicio de sesión de Google.
  Los flujos de unión y creación también intentan reutilizar una pestaña existente de Meet antes de abrir una
  nueva. La coincidencia ignora cadenas de consulta inofensivas en la URL, como `authuser`, por lo que un
  reintento del agente debería enfocar la reunión ya abierta en lugar de crear una segunda
  pestaña de Chrome.

La salida del comando/herramienta incluye un campo `source` (`api` o `browser`) para que los agentes
puedan explicar qué ruta se usó. `create` se une a la nueva reunión de forma predeterminada y
devuelve `joined: true` más la sesión de unión. Para solo acuñar la URL, usa
`create --no-join` en la CLI o pasa `"join": false` a la herramienta.

O dile a un agente: "Crea un Google Meet, únete con voz realtime y envíame
el enlace." El agente debería llamar a `google_meet` con `action: "create"` y
luego compartir el `meetingUri` devuelto.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Para una unión de solo observación/control del navegador, establece `"mode": "transcribe"`. Eso
no inicia el puente dúplex del modelo realtime, no requiere BlackHole ni SoX,
y no responderá con voz en la reunión. Las uniones de Chrome en este modo también evitan
la concesión de permisos de micrófono/cámara de OpenClaw y evitan la ruta **Usar
micrófono** de Meet. Si Meet muestra una pantalla intermedia de elección de audio, la automatización intenta
la ruta sin micrófono y, de lo contrario, informa de una acción manual en lugar de abrir
el micrófono local.

Durante las sesiones realtime, el estado de `google_meet` incluye la salud del navegador y del puente de audio,
como `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, marcas de tiempo de la última entrada/salida,
contadores de bytes y estado cerrado del puente. Si aparece un aviso seguro de la página de Meet,
la automatización del navegador lo gestiona cuando puede. El inicio de sesión, la admisión por parte del anfitrión y
los avisos de permisos del navegador/SO se informan como acción manual con una razón y
un mensaje para que el agente los transmita. Las sesiones administradas de Chrome solo emiten la frase de introducción o
de prueba después de que la salud del navegador informe `inCall: true`; de lo contrario, el estado informa
`speechReady: false` y el intento de habla se bloquea en lugar de fingir que el
agente habló en la reunión.

Las uniones locales de Chrome usan el perfil de navegador de OpenClaw con sesión iniciada. El modo realtime
requiere `BlackHole 2ch` para la ruta de micrófono/altavoz usada por OpenClaw. Para
audio dúplex limpio, usa dispositivos virtuales separados o un gráfico estilo Loopback; un
único dispositivo BlackHole basta para una primera prueba de humo, pero puede hacer eco.

### Gateway local + Chrome en Parallels

**No** necesitas un Gateway completo de OpenClaw ni una clave de API de modelo dentro de una VM de macOS
solo para que la VM sea dueña de Chrome. Ejecuta el Gateway y el agente localmente y luego ejecuta un
host de Node en la VM. Habilita una vez el plugin incluido en la VM para que el Node
anuncie el comando de Chrome:

Qué se ejecuta dónde:

- Host del Gateway: OpenClaw Gateway, área de trabajo del agente, claves de modelo/API, proveedor realtime
  y configuración del plugin de Google Meet.
- VM de macOS en Parallels: CLI/host de Node de OpenClaw, Google Chrome, SoX, BlackHole 2ch
  y un perfil de Chrome con sesión iniciada en Google.
- No necesario en la VM: servicio Gateway, configuración del agente, clave de OpenAI/GPT o configuración del
  proveedor de modelo.

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

Inicia el host de Node en la VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Si `<gateway-host>` es una IP de LAN y no estás usando TLS, el Node rechaza el
WebSocket en texto plano a menos que optes por permitirlo para esa red privada de confianza:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` es entorno de proceso, no una configuración de
`openclaw.json`. `openclaw node install` lo almacena en el entorno de LaunchAgent
cuando está presente en el comando de instalación.

Aprueba el Node desde el host del Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Confirma que el Gateway ve el Node y que anuncia tanto `googlemeet.chrome`
como la capacidad de navegador/`browser.proxy`:

```bash
openclaw nodes status
```

Enruta Meet por ese Node en el host del Gateway:

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

Para una prueba de humo de un solo comando que crea o reutiliza una sesión, dice una frase conocida
e imprime la salud de la sesión:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Durante la unión realtime, la automatización del navegador de OpenClaw rellena el nombre de invitado, hace clic en
Unirse/Solicitar unirse y acepta la opción inicial "Usar micrófono" de Meet cuando aparece ese
aviso. Durante la unión de solo observación o la creación de reuniones solo con navegador, continúa
más allá del mismo aviso sin micrófono cuando esa opción está disponible.
Si el perfil del navegador no tiene sesión iniciada, Meet está esperando la admisión del anfitrión,
Chrome necesita permiso de micrófono/cámara para una unión realtime, o Meet está bloqueado
en un aviso que la automatización no pudo resolver, el resultado de join/test-speech informa
`manualActionRequired: true` con `manualActionReason` y
`manualActionMessage`. Los agentes deben dejar de reintentar la unión, informar ese mensaje exacto
más el `browserUrl`/`browserTitle` actual, y reintentar solo después de que la
acción manual del navegador esté completa.

Si se omite `chromeNode.node`, OpenClaw selecciona automáticamente solo cuando exactamente un
Node conectado anuncia tanto `googlemeet.chrome` como control de navegador. Si
hay varios Nodes capaces conectados, establece `chromeNode.node` en el id del Node,
nombre para mostrar o IP remota.

Comprobaciones de fallos comunes:

- `Configured Google Meet node ... is not usable: offline`: el nodo fijado es
  conocido por el Gateway, pero no está disponible. Los agentes deben tratar ese
  nodo como estado de diagnóstico, no como un host Chrome utilizable, e informar
  el bloqueo de configuración en lugar de recurrir a otro transporte, salvo que
  el usuario lo haya pedido.
- `No connected Google Meet-capable node`: inicia `openclaw node run` en la VM,
  aprueba el emparejamiento y asegúrate de que `openclaw plugins enable google-meet` y
  `openclaw plugins enable browser` se hayan ejecutado en la VM. Confirma también
  que el host del Gateway permita ambos comandos de nodo con
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: instala `blackhole-2ch` en el host
  que se está comprobando y reinicia antes de usar el audio local de Chrome.
- `BlackHole 2ch audio device not found on the node`: instala `blackhole-2ch`
  en la VM y reinicia la VM.
- Chrome se abre, pero no puede unirse: inicia sesión en el perfil del navegador dentro de la VM, o
  mantén `chrome.guestName` configurado para unirse como invitado. La unión automática como invitado usa la
  automatización de navegador de OpenClaw mediante el proxy de navegador del nodo; asegúrate de que la
  configuración del navegador del nodo apunte al perfil que quieres, por ejemplo
  `browser.defaultProfile: "user"` o un perfil de sesión existente con nombre.
- Pestañas de Meet duplicadas: deja `chrome.reuseExistingTab: true` habilitado. OpenClaw
  activa una pestaña existente para la misma URL de Meet antes de abrir una nueva, y
  la creación de reuniones desde el navegador reutiliza una pestaña en curso de `https://meet.google.com/new`
  o de solicitud de cuenta de Google antes de abrir otra.
- Sin audio: en Meet, enruta el micrófono/altavoz por la ruta del dispositivo de audio virtual
  usada por OpenClaw; usa dispositivos virtuales separados o enrutamiento de estilo Loopback
  para audio dúplex limpio.

## Notas de instalación

El valor predeterminado en tiempo real de Chrome usa dos herramientas externas:

- `sox`: utilidad de audio de línea de comandos. El plugin usa comandos explícitos de dispositivo
  CoreAudio para el puente de audio PCM16 predeterminado de 24 kHz.
- `blackhole-2ch`: controlador de audio virtual de macOS. Crea el dispositivo de audio
  `BlackHole 2ch` por el que Chrome/Meet puede enrutar.

OpenClaw no incluye ni redistribuye ninguno de los dos paquetes. La documentación pide a los usuarios
que los instalen como dependencias del host mediante Homebrew. SoX tiene licencia
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole es GPL-3.0. Si compilas un
instalador o dispositivo que incluya BlackHole con OpenClaw, revisa los términos de licencia
upstream de BlackHole u obtén una licencia separada de Existential Audio.

## Transportes

### Chrome

El transporte de Chrome abre la URL de Meet mediante el control de navegador de OpenClaw y se une
como el perfil de navegador de OpenClaw con sesión iniciada. En macOS, el plugin comprueba
`BlackHole 2ch` antes del inicio. Si está configurado, también ejecuta un comando de estado
del puente de audio y un comando de inicio antes de abrir Chrome. Usa `chrome` cuando
Chrome/audio residan en el host del Gateway; usa `chrome-node` cuando Chrome/audio residan
en un nodo emparejado, como una VM de macOS en Parallels. Para Chrome local, elige el
perfil con `browser.defaultProfile`; `chrome.browserProfile` se pasa a
hosts `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Enruta el audio del micrófono y del altavoz de Chrome mediante el puente de audio local de OpenClaw.
Si `BlackHole 2ch` no está instalado, la unión falla con un error de configuración
en lugar de unirse silenciosamente sin una ruta de audio.

### Twilio

El transporte de Twilio es un plan de marcado estricto delegado al plugin Voice Call. No
analiza páginas de Meet para buscar números de teléfono.

Úsalo cuando la participación con Chrome no esté disponible o cuando quieras una alternativa
de llamada telefónica. Google Meet debe exponer un número de acceso telefónico y un PIN para la
reunión; OpenClaw no los descubre desde la página de Meet.

Habilita el plugin Voice Call en el host del Gateway, no en el nodo de Chrome:

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

Proporciona las credenciales de Twilio mediante el entorno o la configuración. El entorno mantiene
los secretos fuera de `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Reinicia o recarga el Gateway después de habilitar `voice-call`; los cambios de configuración
de plugins no aparecen en un proceso de Gateway ya en ejecución hasta que se recarga.

Luego verifica:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Cuando la delegación de Twilio está conectada, `googlemeet setup` incluye comprobaciones
correctas de `twilio-voice-call-plugin` y `twilio-voice-call-credentials`.

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
a la automatización del navegador. Configura OAuth cuando quieras creación mediante la API oficial,
resolución de espacios o comprobaciones previas de Meet Media API.

El acceso a Google Meet API usa OAuth de usuario: crea un cliente OAuth de Google Cloud,
solicita los permisos necesarios, autoriza una cuenta de Google y luego almacena el
token de actualización resultante en la configuración del plugin Google Meet o proporciona las
variables de entorno `OPENCLAW_GOOGLE_MEET_*`.

OAuth no sustituye la ruta de unión de Chrome. Los transportes Chrome y Chrome-node
siguen uniéndose mediante un perfil de Chrome con sesión iniciada, BlackHole/SoX y un nodo
conectado cuando usas participación por navegador. OAuth solo es para la ruta oficial de
Google Meet API: crear espacios de reunión, resolver espacios y ejecutar comprobaciones
previas de Meet Media API.

### Crear credenciales de Google

En Google Cloud Console:

1. Crea o selecciona un proyecto de Google Cloud.
2. Habilita **Google Meet REST API** para ese proyecto.
3. Configura la pantalla de consentimiento OAuth.
   - **Internal** es lo más sencillo para una organización de Google Workspace.
   - **External** funciona para configuraciones personales/de prueba; mientras la app esté en Testing,
     añade como usuario de prueba cada cuenta de Google que autorizará la app.
4. Añade los permisos que solicita OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Crea un ID de cliente OAuth.
   - Tipo de aplicación: **Web application**.
   - URI de redirección autorizado:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Copia el ID de cliente y el secreto de cliente.

`meetings.space.created` es requerido por Google Meet `spaces.create`.
`meetings.space.readonly` permite que OpenClaw resuelva URLs/códigos de Meet a espacios.
`meetings.conference.media.readonly` es para comprobaciones previas de Meet Media API y trabajo
de medios; Google puede requerir inscripción en Developer Preview para el uso real de Media API.
Si solo necesitas uniones de Chrome basadas en navegador, omite OAuth por completo.

### Emitir el token de actualización

Configura `oauth.clientId` y opcionalmente `oauth.clientSecret`, o pásalos como
variables de entorno, y luego ejecuta:

```bash
openclaw googlemeet auth login --json
```

El comando imprime un bloque de configuración `oauth` con un token de actualización. Usa PKCE,
callback de localhost en `http://localhost:8085/oauth2callback` y un flujo manual
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

Almacena el objeto `oauth` bajo la configuración del plugin Google Meet:

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

Prefiere variables de entorno cuando no quieras tener el token de actualización en la configuración.
Si hay valores tanto en configuración como en entorno, el plugin resuelve primero la configuración
y luego usa el entorno como alternativa.

El consentimiento OAuth incluye creación de espacios de Meet, acceso de lectura a espacios de Meet y acceso
de lectura a medios de conferencias de Meet. Si te autenticaste antes de que existiera el soporte
para creación de reuniones, vuelve a ejecutar `openclaw googlemeet auth login --json` para que el token
de actualización tenga el permiso `meetings.space.created`.

### Verificar OAuth con doctor

Ejecuta el doctor de OAuth cuando quieras una comprobación de estado rápida y sin secretos:

```bash
openclaw googlemeet doctor --oauth --json
```

Esto no carga el runtime de Chrome ni requiere un nodo de Chrome conectado. Comprueba que
exista configuración OAuth y que el token de actualización pueda emitir un token de acceso.
El informe JSON incluye solo campos de estado como `ok`, `configured`,
`tokenSource`, `expiresAt` y mensajes de comprobación; no imprime el token de acceso,
el token de actualización ni el secreto de cliente.

Resultados comunes:

| Comprobación         | Significado                                                                            |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` más `oauth.refreshToken`, o un token de acceso en caché, está presente. |
| `oauth-token`        | El token de acceso en caché sigue siendo válido, o el token de actualización emitió un token de acceso nuevo. |
| `meet-spaces-get`    | La comprobación opcional `--meeting` resolvió un espacio de Meet existente.             |
| `meet-spaces-create` | La comprobación opcional `--create-space` creó un nuevo espacio de Meet.                |

Para demostrar también la habilitación de Google Meet API y el permiso `spaces.create`, ejecuta la
comprobación de creación con efecto secundario:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` crea una URL de Meet desechable. Úsalo cuando necesites confirmar
que el proyecto de Google Cloud tiene la Meet API habilitada y que la cuenta autorizada
tiene el permiso `meetings.space.created`.

Para demostrar acceso de lectura a un espacio de reunión existente:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` y `resolve-space` demuestran acceso de lectura a un espacio
existente al que la cuenta de Google autorizada puede acceder. Un `403` de estas comprobaciones
normalmente significa que Google Meet REST API está deshabilitada, que al token de actualización
con consentimiento le falta el permiso requerido, o que la cuenta de Google no puede acceder a ese espacio
de Meet. Un error de token de actualización significa que debes volver a ejecutar `openclaw googlemeet auth login
--json` y almacenar el nuevo bloque `oauth`.

No se necesitan credenciales OAuth para la alternativa de navegador. En ese modo, la autenticación de Google
proviene del perfil de Chrome con sesión iniciada en el nodo seleccionado, no de la configuración
de OpenClaw.

Estas variables de entorno se aceptan como alternativas:

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

Enumera los artefactos de la reunión y la asistencia después de que Meet haya creado los registros de conferencia:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Con `--meeting`, `artifacts` y `attendance` usan de forma predeterminada el registro de conferencia más reciente. Pasa `--all-conference-records` cuando quieras todos los registros conservados de esa reunión.

La búsqueda en Calendar puede resolver la URL de la reunión desde Google Calendar antes de leer los artefactos de Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` busca en el calendario `primary` de hoy un evento de Calendar con un enlace de Google Meet. Usa `--event <query>` para buscar texto de evento coincidente y `--calendar <id>` para un calendario no principal. La búsqueda en Calendar requiere un inicio de sesión OAuth reciente que incluya el alcance de solo lectura de eventos de Calendar. `calendar-events` previsualiza los eventos de Meet coincidentes y marca el evento que elegirán `latest`, `artifacts`, `attendance` o `export`.

Si ya conoces el id del registro de conferencia, indícalo directamente:

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

`artifacts` devuelve metadatos del registro de conferencia junto con metadatos de recursos de participantes, grabaciones, transcripciones, entradas de transcripción estructuradas y notas inteligentes cuando Google los expone para la reunión. Usa `--no-transcript-entries` para omitir la búsqueda de entradas en reuniones grandes. `attendance` expande los participantes en filas de sesiones de participante con horas de primera/última aparición, duración total de la sesión, indicadores de llegada tarde/salida anticipada y recursos de participante duplicados fusionados por usuario con sesión iniciada o nombre visible. Pasa `--no-merge-duplicates` para mantener separados los recursos de participante sin procesar, `--late-after-minutes` para ajustar la detección de llegadas tarde y `--early-before-minutes` para ajustar la detección de salidas anticipadas.

`export` escribe una carpeta que contiene `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` y `manifest.json`. `manifest.json` registra la entrada elegida, las opciones de exportación, los registros de conferencia, los archivos de salida, los recuentos, el origen del token, el evento de Calendar cuando se usó uno y cualquier advertencia de recuperación parcial. Pasa `--zip` para escribir también un archivo portátil junto a la carpeta. Pasa `--include-doc-bodies` para exportar el texto de Google Docs de transcripciones enlazadas y notas inteligentes mediante Google Drive `files.export`; esto requiere un inicio de sesión OAuth reciente que incluya el alcance de solo lectura de Drive Meet. Sin `--include-doc-bodies`, las exportaciones incluyen solo metadatos de Meet y entradas de transcripción estructuradas. Si Google devuelve un fallo parcial de artefacto, como un error de listado de notas inteligentes, entrada de transcripción o cuerpo de documento de Drive, el resumen y el manifiesto conservan la advertencia en lugar de hacer fallar toda la exportación. Usa `--dry-run` para obtener los mismos datos de artefactos/asistencia e imprimir el JSON del manifiesto sin crear la carpeta ni el ZIP. Esto resulta útil antes de escribir una exportación grande o cuando un agente solo necesita recuentos, registros seleccionados y advertencias.

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

Establece `"dryRun": true` para devolver solo el manifiesto de exportación y omitir las escrituras de archivos.

Ejecuta la prueba rápida en vivo protegida contra una reunión real conservada:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Entorno de prueba rápida en vivo:

- `OPENCLAW_LIVE_TEST=1` habilita las pruebas en vivo protegidas.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` apunta a una URL de Meet conservada, un código o
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` o `GOOGLE_MEET_CLIENT_ID` proporciona el id de cliente OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` o `GOOGLE_MEET_REFRESH_TOKEN` proporciona el token de actualización.
- Opcional: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` y
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` usan los mismos nombres alternativos sin el prefijo `OPENCLAW_`.

La prueba rápida en vivo base de artefactos/asistencia necesita `https://www.googleapis.com/auth/meetings.space.readonly` y `https://www.googleapis.com/auth/meetings.conference.media.readonly`. La búsqueda en Calendar necesita `https://www.googleapis.com/auth/calendar.events.readonly`. La exportación de cuerpos de documento de Drive necesita `https://www.googleapis.com/auth/drive.meet.readonly`.

Crea un espacio de Meet reciente:

```bash
openclaw googlemeet create
```

El comando imprime el nuevo `meeting uri`, el origen y la sesión de unión. Con credenciales OAuth usa la API oficial de Google Meet. Sin credenciales OAuth usa como alternativa el perfil de navegador con sesión iniciada del nodo Chrome fijado. Los agentes pueden usar la herramienta `google_meet` con `action: "create"` para crear y unirse en un solo paso. Para la creación solo de URL, pasa `"join": false`.

Ejemplo de salida JSON de la alternativa del navegador:

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

Si la alternativa del navegador encuentra un inicio de sesión de Google o un bloqueo de permisos de Meet antes de poder crear la URL, el método de Gateway devuelve una respuesta fallida y la herramienta `google_meet` devuelve detalles estructurados en lugar de una cadena simple:

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

Cuando un agente ve `manualActionRequired: true`, debe informar el `manualActionMessage` junto con el contexto del nodo/pestaña del navegador y dejar de abrir nuevas pestañas de Meet hasta que el operador complete el paso en el navegador.

Ejemplo de salida JSON de la creación mediante API:

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

Crear un Meet se une de forma predeterminada. El transporte Chrome o Chrome-node sigue necesitando un perfil de Google Chrome con sesión iniciada para unirse mediante el navegador. Si el perfil tiene la sesión cerrada, OpenClaw informa `manualActionRequired: true` o un error de alternativa del navegador y pide al operador que complete el inicio de sesión de Google antes de reintentar.

Establece `preview.enrollmentAcknowledged: true` solo después de confirmar que tu proyecto de Cloud, el principal de OAuth y los participantes de la reunión están inscritos en el Google Workspace Developer Preview Program para las API multimedia de Meet.

## Configuración

La ruta común en tiempo real de Chrome solo necesita que el plugin esté habilitado, BlackHole, SoX y una clave de proveedor de voz en tiempo real de backend. OpenAI es el valor predeterminado; establece `realtime.provider: "google"` para usar Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
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
- `chromeNode.node`: id/nombre/IP de nodo opcional para `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: nombre usado en la pantalla de invitado de Meet sin sesión iniciada
- `chrome.autoJoin: true`: relleno de nombre de invitado y clic en Join Now con el mejor esfuerzo mediante la automatización de navegador de OpenClaw en `chrome-node`
- `chrome.reuseExistingTab: true`: activar una pestaña de Meet existente en lugar de abrir duplicados
- `chrome.waitForInCallMs: 20000`: esperar a que la pestaña de Meet informe que está en llamada antes de activar la introducción en tiempo real
- `chrome.audioFormat: "pcm16-24khz"`: formato de audio del par de comandos. Usa
  `"g711-ulaw-8khz"` solo para pares de comandos heredados/personalizados que todavía emiten audio telefónico.
- `chrome.audioInputCommand`: comando SoX que lee desde CoreAudio `BlackHole 2ch` y escribe audio en `chrome.audioFormat`
- `chrome.audioOutputCommand`: comando SoX que lee audio en `chrome.audioFormat` y escribe en CoreAudio `BlackHole 2ch`
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: respuestas habladas breves, con `openclaw_agent_consult` para respuestas más profundas
- `realtime.introMessage`: comprobación breve de disponibilidad hablada cuando el puente en tiempo real se conecta; establécelo en `""` para unirse en silencio
- `realtime.agentId`: id opcional de agente de OpenClaw para
  `openclaw_agent_consult`; el valor predeterminado es `main`

Anulaciones opcionales:

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
  },
  chromeNode: {
    node: "parallels-macos",
  },
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

`voiceCall.enabled` tiene como valor predeterminado `true`; con el transporte Twilio delega la llamada PSTN real y DTMF al plugin Voice Call. Si `voice-call` no está habilitado, Google Meet aún puede validar y registrar el plan de marcación, pero no puede realizar la llamada Twilio.

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

Usa `transport: "chrome"` cuando Chrome se ejecuta en el host del Gateway. Usa
`transport: "chrome-node"` cuando Chrome se ejecuta en un Node emparejado, como una VM de Parallels.
En ambos casos, el modelo en tiempo real y `openclaw_agent_consult` se ejecutan en el
host del Gateway, por lo que las credenciales del modelo permanecen allí.

Usa `action: "status"` para listar sesiones activas o inspeccionar un ID de sesión. Usa
`action: "speak"` con `sessionId` y `message` para hacer que el agente en tiempo real
hable de inmediato. Usa `action: "test_speech"` para crear o reutilizar la sesión,
activar una frase conocida y devolver el estado de `inCall` cuando el host de Chrome pueda
informarlo. `test_speech` siempre fuerza `mode: "realtime"` y falla si se le pide
ejecutarse en `mode: "transcribe"` porque las sesiones de solo observación intencionalmente no pueden
emitir voz. Su resultado `speechOutputVerified` se basa en que los bytes de salida de audio en tiempo real
aumenten durante esta llamada de prueba, por lo que una sesión reutilizada con audio anterior
no cuenta como una comprobación de voz exitosa nueva. Usa `action: "leave"` para marcar
una sesión como finalizada.

`status` incluye el estado de Chrome cuando está disponible:

- `inCall`: Chrome parece estar dentro de la llamada de Meet
- `micMuted`: estado aproximado del micrófono de Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: el
  perfil del navegador necesita inicio de sesión manual, admisión del anfitrión de Meet, permisos o
  reparación del control del navegador antes de que la voz pueda funcionar
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: si
  la voz gestionada de Chrome está permitida ahora. `speechReady: false` significa que OpenClaw no
  envió la frase de introducción/prueba al puente de audio.
- `providerConnected` / `realtimeReady`: estado del puente de voz en tiempo real
- `lastInputAt` / `lastOutputAt`: último audio visto desde el puente o enviado a él

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Consulta del agente en tiempo real

El modo en tiempo real de Chrome está optimizado para un bucle de voz en vivo. El
proveedor de voz en tiempo real escucha el audio de la reunión y habla a través del puente de audio configurado.
Cuando el modelo en tiempo real necesita razonamiento más profundo, información actual o herramientas normales de
OpenClaw, puede llamar a `openclaw_agent_consult`.

La herramienta de consulta ejecuta el agente normal de OpenClaw en segundo plano con el contexto reciente de
transcripción de la reunión y devuelve una respuesta hablada concisa a la sesión de voz en tiempo real.
El modelo de voz puede entonces decir esa respuesta en la reunión.
Usa la misma herramienta de consulta compartida en tiempo real que Voice Call.

De forma predeterminada, las consultas se ejecutan contra el agente `main`. Configura `realtime.agentId` cuando un
carril de Meet deba consultar un espacio de trabajo de agente de OpenClaw dedicado, valores predeterminados del modelo,
política de herramientas, memoria e historial de sesión.

`realtime.toolPolicy` controla la ejecución de consulta:

- `safe-read-only`: expone la herramienta de consulta y limita el agente normal a
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` y
  `memory_get`.
- `owner`: expone la herramienta de consulta y permite que el agente normal use la política de herramientas normal
  del agente.
- `none`: no expone la herramienta de consulta al modelo de voz en tiempo real.

La clave de sesión de consulta tiene alcance por sesión de Meet, por lo que las llamadas de consulta de seguimiento
pueden reutilizar el contexto de consulta anterior durante la misma reunión.

Para forzar una comprobación de preparación hablada después de que Chrome se haya unido completamente a la llamada:

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

Usa esta secuencia antes de entregar una reunión a un agente desatendido:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Estado esperado de Chrome-node:

- `googlemeet setup` está todo en verde.
- `googlemeet setup` incluye `chrome-node-connected` cuando Chrome-node es el
  transporte predeterminado o hay un Node fijado.
- `nodes status` muestra el Node seleccionado conectado.
- El Node seleccionado anuncia tanto `googlemeet.chrome` como `browser.proxy`.
- La pestaña de Meet se une a la llamada y `test-speech` devuelve el estado de Chrome con
  `inCall: true`.

Para un host remoto de Chrome, como una VM de macOS en Parallels, esta es la comprobación segura
más corta después de actualizar el Gateway o la VM:

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

Para una prueba de Twilio, usa una reunión que exponga detalles de marcación telefónica:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Estado esperado de Twilio:

- `googlemeet setup` incluye comprobaciones verdes de `twilio-voice-call-plugin` y
  `twilio-voice-call-credentials`.
- `voicecall` está disponible en la CLI después de recargar el Gateway.
- La sesión devuelta tiene `transport: "twilio"` y un `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` cuelga la llamada de voz delegada.

## Solución de problemas

### El agente no puede ver la herramienta de Google Meet

Confirma que el Plugin esté habilitado en la configuración del Gateway y recarga el Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Si acabas de editar `plugins.entries.google-meet`, reinicia o recarga el Gateway.
El agente en ejecución solo ve las herramientas de Plugin registradas por el proceso actual del Gateway.

### No hay ningún Node conectado compatible con Google Meet

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

El Node debe estar conectado y listar `googlemeet.chrome` más `browser.proxy`.
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
Para un Gateway de LAN, esto normalmente significa:

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

Ejecuta `googlemeet test-speech` e inspecciona el estado de Chrome devuelto. Si
informa `manualActionRequired: true`, muestra `manualActionMessage` al operador
y deja de reintentar hasta que la acción del navegador esté completa.

Acciones manuales comunes:

- Iniciar sesión en el perfil de Chrome.
- Admitir al invitado desde la cuenta anfitriona de Meet.
- Conceder permisos de micrófono/cámara de Chrome cuando aparezca el aviso de permiso nativo de Chrome.
- Cerrar o reparar un diálogo de permisos de Meet bloqueado.

No informes "not signed in" solo porque Meet muestre "Do you want people to
hear you in the meeting?" Ese es el intersticial de elección de audio de Meet; OpenClaw
hace clic en **Use microphone** mediante automatización del navegador cuando está disponible y sigue
esperando el estado real de la reunión. Para la alternativa de navegador solo de creación, OpenClaw
puede hacer clic en **Continue without microphone** porque crear la URL no necesita
la ruta de audio en tiempo real.

### Falla la creación de la reunión

`googlemeet create` primero usa el endpoint `spaces.create` de la API de Google Meet
cuando las credenciales de OAuth están configuradas. Sin credenciales de OAuth, recurre
al navegador del Node de Chrome fijado. Confirma:

- Para creación por API: `oauth.clientId` y `oauth.refreshToken` están configurados,
  o existen variables de entorno `OPENCLAW_GOOGLE_MEET_*` coincidentes.
- Para creación por API: el token de actualización se emitió después de que se agregara el soporte de creación.
  A los tokens anteriores les puede faltar el alcance `meetings.space.created`; vuelve a ejecutar
  `openclaw googlemeet auth login --json` y actualiza la configuración del Plugin.
- Para la alternativa de navegador: `defaultTransport: "chrome-node"` y
  `chromeNode.node` apuntan a un Node conectado con `browser.proxy` y
  `googlemeet.chrome`.
- Para la alternativa de navegador: el perfil de Chrome de OpenClaw en ese Node ha iniciado sesión
  en Google y puede abrir `https://meet.google.com/new`.
- Para la alternativa de navegador: los reintentos reutilizan una pestaña existente de `https://meet.google.com/new`
  o de aviso de cuenta de Google antes de abrir una pestaña nueva. Si un agente agota el tiempo,
  reintenta la llamada de la herramienta en lugar de abrir manualmente otra pestaña de Meet.
- Para la alternativa de navegador: si la herramienta devuelve `manualActionRequired: true`, usa
  los valores devueltos `browser.nodeId`, `browser.targetId`, `browserUrl` y
  `manualActionMessage` para guiar al operador. No reintentes en bucle hasta que esa
  acción esté completa.
- Para la alternativa de navegador: si Meet muestra "Do you want people to hear you in the
  meeting?", deja la pestaña abierta. OpenClaw debería hacer clic en **Use microphone** o, para
  la alternativa solo de creación, en **Continue without microphone** mediante automatización del navegador
  y seguir esperando la URL de Meet generada. Si no puede, el error
  debería mencionar `meet-audio-choice-required`, no `google-login-required`.

### El agente se une pero no habla

Comprueba la ruta en tiempo real:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Usa `mode: "realtime"` para escuchar/responder con voz. `mode: "transcribe"` intencionalmente
no inicia el puente de voz dúplex en tiempo real. `googlemeet test-speech`
siempre comprueba la ruta en tiempo real e informa si se observaron bytes de salida del puente
para esa invocación. Si `speechOutputVerified` es false y
`speechOutputTimedOut` es true, es posible que el proveedor en tiempo real haya aceptado la
emisión, pero OpenClaw no vio que nuevos bytes de salida llegaran al puente de audio de Chrome.

Verifica también:

- Hay una clave de proveedor en tiempo real disponible en el host del Gateway, como
  `OPENAI_API_KEY` o `GEMINI_API_KEY`.
- `BlackHole 2ch` es visible en el host de Chrome.
- `sox` existe en el host de Chrome.
- El micrófono y el altavoz de Meet están enrutados a través de la ruta de audio virtual usada por
  OpenClaw.

`googlemeet doctor [session-id]` imprime la sesión, el Node, el estado en llamada,
el motivo de acción manual, la conexión del proveedor en tiempo real, `realtimeReady`, la actividad de
entrada/salida de audio, las últimas marcas de tiempo de audio, contadores de bytes y la URL del navegador.
Usa `googlemeet status [session-id]` cuando necesites el JSON sin procesar. Usa
`googlemeet doctor --oauth` cuando necesites verificar la actualización de OAuth de Google Meet
sin exponer tokens; agrega `--meeting` o `--create-space` cuando también necesites una
prueba de la API de Google Meet.

Si un agente agotó el tiempo y puedes ver una pestaña de Meet ya abierta, inspecciona esa pestaña
sin abrir otra:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

La acción de herramienta equivalente es `recover_current_tab`. Enfoca e inspecciona una
pestaña de Meet existente para el transporte seleccionado. Con `chrome`, usa control local
del navegador a través del Gateway; con `chrome-node`, usa el Node de Chrome configurado.
No abre una pestaña nueva ni crea una sesión nueva; informa el
bloqueador actual, como inicio de sesión, admisión, permisos o estado de elección de audio.
El comando de la CLI habla con el Gateway configurado, por lo que el Gateway debe estar en ejecución;
`chrome-node` también requiere que el Node de Chrome esté conectado.

### Fallan las comprobaciones de configuración de Twilio

`twilio-voice-call-plugin` falla cuando `voice-call` no está permitido o no está habilitado.
Agrégalo a `plugins.allow`, habilita `plugins.entries.voice-call` y recarga el
Gateway.

`twilio-voice-call-credentials` falla cuando al backend de Twilio le falta el
SID de cuenta, el token de autenticación o el número llamante. Configúralos en el host del Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Luego reinicia o recarga el Gateway y ejecuta:

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` solo comprueba la preparación de forma predeterminada. Para hacer un simulacro con un número específico:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Agrega `--yes` únicamente cuando quieras realizar intencionalmente una llamada
de notificación saliente en vivo:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### La llamada de Twilio se inicia, pero nunca entra a la reunión

Confirma que el evento de Meet expone los detalles de marcado telefónico. Pasa el número
exacto de marcado y el PIN, o una secuencia DTMF personalizada:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Usa `w` inicial o comas en `--dtmf-sequence` si el proveedor necesita una pausa
antes de introducir el PIN.

## Notas

La API multimedia oficial de Google Meet está orientada a la recepción, por lo que hablar en una
llamada de Meet sigue necesitando una ruta de participante. Este Plugin mantiene visible ese límite:
Chrome gestiona la participación del navegador y el enrutamiento de audio local; Twilio gestiona
la participación mediante marcado telefónico.

El modo en tiempo real de Chrome necesita `BlackHole 2ch` más una de estas opciones:

- `chrome.audioInputCommand` más `chrome.audioOutputCommand`: OpenClaw posee el
  puente del modelo en tiempo real y canaliza el audio en `chrome.audioFormat` entre esos
  comandos y el proveedor de voz en tiempo real seleccionado. La ruta predeterminada de Chrome es
  PCM16 de 24 kHz; G.711 mu-law de 8 kHz sigue disponible para pares de comandos heredados.
- `chrome.audioBridgeCommand`: un comando de puente externo posee toda la ruta de
  audio local y debe salir después de iniciar o validar su daemon.

Para obtener audio dúplex limpio, enruta la salida de Meet y el micrófono de Meet mediante dispositivos
virtuales separados o un gráfico de dispositivos virtuales de estilo Loopback. Un único dispositivo
BlackHole compartido puede devolver el eco de otros participantes a la llamada.

`googlemeet speak` activa el puente de audio en tiempo real activo para una sesión de Chrome.
`googlemeet leave` detiene ese puente. En sesiones de Twilio delegadas
mediante el Plugin de llamada de voz, `leave` también cuelga la llamada de voz subyacente.

## Relacionado

- [Plugin de llamada de voz](/es/plugins/voice-call)
- [Modo de conversación](/es/nodes/talk)
- [Creación de Plugins](/es/plugins/building-plugins)
