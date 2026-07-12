---
read_when:
    - Quieres que un agente de OpenClaw se una a una llamada de Google Meet
    - Quieres que un agente de OpenClaw cree una nueva llamada de Google Meet
    - Estás configurando Chrome, el nodo de Chrome o Twilio como transporte de Google Meet
summary: 'Plugin de Google Meet: únete a URLs explícitas de Meet mediante Chrome o Twilio con respuestas de voz del agente habilitadas de forma predeterminada'
title: Plugin de Google Meet
x-i18n:
    generated_at: "2026-07-12T14:38:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5a3a0d2675bdfaeaa869652593fd1931c3afdefe0ed95f13935dade976ff038c
    source_path: plugins/google-meet.md
    workflow: 16
---

El plugin `google-meet` se une a URL explícitas de Meet en nombre de un agente de OpenClaw. Su alcance es deliberadamente limitado:

- Solo se une a URL `https://meet.google.com/...`; nunca llama a una reunión mediante un número de teléfono que haya descubierto por sí mismo.
- `googlemeet create` puede generar una nueva URL de Meet mediante la API de Google Meet (o una alternativa basada en el navegador) y se une a ella de forma predeterminada.
- La participación mediante Chrome utiliza un perfil de Chrome con una sesión iniciada, opcionalmente en un nodo emparejado. La participación mediante Twilio llama a un número de teléfono más un PIN/DTMF a través del [plugin de llamadas de voz](/es/plugins/voice-call); no puede llamar directamente a una URL de Meet.
- `mode: "agent"` (valor predeterminado) transcribe la voz de los participantes con un proveedor en tiempo real, la envía al agente de OpenClaw configurado y reproduce la respuesta mediante el TTS habitual de OpenClaw. `mode: "bidi"` permite que un modelo de voz en tiempo real responda directamente. `mode: "transcribe"` se une solo como observador, sin responder por voz.
- No se anuncia automáticamente el consentimiento cuando el plugin se une a una llamada.
- El comando de la CLI es `googlemeet`; `meet` está reservado para flujos de trabajo más amplios de teleconferencia con agentes.

## Inicio rápido

Instale las dependencias de audio locales y, a continuación, configure la clave de un proveedor en tiempo real. OpenAI es el proveedor de transcripción predeterminado para el modo `agent`; Google Gemini Live está disponible como proveedor de voz para el modo `bidi`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# solo es necesario cuando realtime.voiceProvider es "google" para el modo bidi
export GEMINI_API_KEY=...
```

`blackhole-2ch` instala el dispositivo de audio virtual `BlackHole 2ch` a través del cual Chrome enruta el audio. El instalador de Homebrew requiere reiniciar antes de que macOS exponga el dispositivo:

```bash
sudo reboot
```

Después de reiniciar, verifique ambos componentes:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Habilite el plugin:

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

Compruebe la configuración y, a continuación, únase:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

La salida de `setup` es legible por agentes y tiene en cuenta el modo y el transporte: informa sobre el perfil de Chrome, la fijación del nodo y, para las conexiones de Chrome en tiempo real, el puente de audio BlackHole/SoX y la comprobación de la introducción retrasada. Las conexiones solo como observador omiten los requisitos previos de tiempo real:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Cuando está configurada la delegación a Twilio, `setup` también informa si `voice-call`, las credenciales de Twilio y la exposición pública del Webhook están preparados. Considere cualquier comprobación con `ok: false` como un impedimento para ese transporte o modo antes de que se una un agente. Use `--json` para obtener una salida legible por máquinas y `--transport chrome|chrome-node|twilio` para comprobar previamente un transporte específico:

```bash
openclaw googlemeet setup --transport twilio
```

O permita que un agente se una mediante la herramienta `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

En hosts del Gateway que no sean macOS, `google_meet` permanece visible para acciones de artefactos, calendario, configuración, transcripción, Twilio y `chrome-node`, pero la respuesta por voz de Chrome local (`transport: "chrome"` con `mode: "agent"` o `"bidi"`) se bloquea antes de llegar al puente de audio, porque esa ruta depende actualmente de `BlackHole 2ch` en macOS. Use `mode: "transcribe"`, la conexión telefónica mediante Twilio o, en su lugar, un host `chrome-node` con macOS.

### Crear una reunión

```bash
openclaw googlemeet create --transport chrome-node --mode agent
openclaw googlemeet create --no-join
```

`create` tiene dos rutas, indicadas en el campo `source` del resultado:

- **`api`**: se utiliza cuando están configuradas las credenciales OAuth de Google Meet. Es determinista y no depende del estado de la interfaz del navegador.
- **`browser`**: se utiliza sin credenciales OAuth. OpenClaw abre `https://meet.google.com/new` en el nodo de Chrome fijado y espera a que Google redirija a una URL real con código de reunión; el perfil de Chrome de OpenClaw de ese nodo ya debe tener una sesión iniciada en Google. Tanto la unión como la creación reutilizan una pestaña de Meet existente (o una pestaña en curso de `.../new` o de solicitud de cuenta de Google) antes de abrir una nueva; la coincidencia de pestañas ignora cadenas de consulta inofensivas como `authuser`.

`create` se une de forma predeterminada y devuelve `joined: true` junto con la sesión de conexión. Pase `--no-join` (CLI) o `"join": false` (herramienta) para generar únicamente la URL.

Para las salas creadas mediante la API, establezca una política de acceso explícita en lugar de heredar el valor predeterminado de la cuenta de Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

| `--access-type` | Quién puede unirse sin solicitar acceso                                            |
| --------------- | --------------------------------------------------------------------------------- |
| `OPEN`          | Cualquier persona con la URL de Meet                                               |
| `TRUSTED`       | Usuarios de confianza de la organización del anfitrión, usuarios externos invitados y usuarios que se conecten por teléfono |
| `RESTRICTED`    | Solo personas invitadas                                                            |

Esto solo se aplica a las salas creadas mediante la API, por lo que OAuth debe estar configurado. Si se autenticó antes de que existiera esta opción, vuelva a ejecutar `openclaw googlemeet auth login --json` después de añadir el ámbito `meetings.space.settings` a la pantalla de consentimiento de OAuth.

Si la alternativa basada en el navegador encuentra un bloqueo de inicio de sesión de Google o de permisos de Meet, la herramienta devuelve `manualActionRequired: true` con `manualActionReason`, `manualActionMessage` y `browser.nodeId`/`browser.targetId`/`browserUrl`. Informe de ese mensaje y deje de abrir nuevas pestañas de Meet hasta que el operador complete el paso en el navegador.

### Unión solo como observador

Establezca `"mode": "transcribe"` para omitir el puente dúplex en tiempo real (sin necesidad de BlackHole/SoX y sin respuesta por voz). Las conexiones de Chrome en modo de transcripción también omiten la concesión de permisos de micrófono/cámara de OpenClaw y la ruta **Use microphone** de Meet; si Meet muestra la pantalla intermedia de selección de audio, la automatización intenta primero **Continue without microphone**. Los transportes de Chrome administrados en este modo instalan un observador de subtítulos de Meet con el mejor esfuerzo posible. `googlemeet status --json` y `googlemeet doctor` informan de `captioning`, `captionsEnabledAttempted`, `transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText` y una cola `recentTranscript`.

Para consultar la transcripción limitada de la sesión, lea la pestaña de Meet exacta de la que se realiza el seguimiento:

```bash
openclaw googlemeet transcript <session-id>
openclaw googlemeet transcript <session-id> --since <next-index> --json
```

El observador conserva como máximo 2,000 líneas de subtítulos completadas en la página de Meet. El texto progresivo visible permanece en la cola de estado hasta que se completa la fila de subtítulos, por lo que guardar `nextIndex` no puede omitir una ampliación posterior del texto; al salir, se finalizan las filas visibles antes de la instantánea. `droppedLines` informa de las líneas perdidas al principio cuando se supera el límite. Las transcripciones de las cuatro sesiones finalizadas más recientemente siguen disponibles hasta que se reinicia el Gateway. Las transcripciones finalizadas más antiguas devuelven `evicted: true`. Se trata deliberadamente de memoria de ejecución, no de almacenamiento persistente del historial de reuniones: reiniciar el Gateway, cerrar la pestaña antes de una instantánea o superar los límites documentados puede provocar la pérdida de subtítulos.

Para realizar una prueba de escucha con respuesta sí/no:

```bash
openclaw googlemeet test-listen <meet-url> --transport chrome-node
```

Se une en modo de transcripción, espera a que haya movimiento nuevo en los subtítulos o la transcripción y devuelve `listenVerified`, `listenTimedOut`, los campos de acción manual y el estado actual de los subtítulos.

### Estado de la sesión en tiempo real

Durante las sesiones con respuesta por voz, el estado de `google_meet` informa sobre el estado de Chrome y del puente de audio: `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, las marcas de tiempo de la última entrada y salida, los contadores de bytes y el estado de cierre del puente. Las sesiones de Chrome administradas solo reproducen la frase de introducción o prueba después de que el estado indique `inCall: true`; de lo contrario, se establece `speechReady: false` y el intento de reproducción de voz se bloquea en lugar de no hacer nada silenciosamente.

Las conexiones de Chrome local se realizan mediante el perfil de navegador de OpenClaw con una sesión iniciada y necesitan `BlackHole 2ch` para la ruta de micrófono y altavoz. Un único dispositivo BlackHole es suficiente para una primera prueba básica, pero puede producir eco; use dispositivos virtuales separados o un grafo similar a Loopback para obtener audio dúplex limpio.

## Gateway local + Chrome en Parallels

No se necesita un Gateway completo ni una clave de API de modelo dentro de una máquina virtual macOS únicamente para proporcionarle Chrome. Ejecute el Gateway y el agente localmente; ejecute un host de nodo en la máquina virtual.

| Dónde se ejecuta       | Qué                                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| Host del Gateway       | Gateway de OpenClaw, espacio de trabajo del agente, claves de modelo/API, proveedor en tiempo real, configuración del plugin de Google Meet |
| Máquina virtual macOS de Parallels | CLI/host de nodo de OpenClaw, Chrome, SoX, BlackHole 2ch y un perfil de Chrome con una sesión iniciada en Google |
| No es necesario en la máquina virtual | Servicio del Gateway, configuración del agente, configuración del proveedor de modelos              |

Instale las dependencias de la máquina virtual, reinicie y verifique:

```bash
brew install blackhole-2ch sox
sudo reboot
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Habilite el plugin en la máquina virtual e inicie el host de nodo:

```bash
openclaw plugins enable google-meet
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Si `<gateway-host>` es una IP de LAN sin TLS, habilítelo explícitamente para esa red privada de confianza:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Use la misma variable al instalarlo como LaunchAgent (es una variable de entorno del proceso, almacenada en el entorno de LaunchAgent cuando está presente en el comando de instalación, no una opción de `openclaw.json`):

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

Apruebe el nodo desde el host del Gateway y, a continuación, confirme que anuncia tanto `googlemeet.chrome` como la capacidad del navegador/`browser.proxy`:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Enrute Meet a través de ese nodo:

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

Ahora únase normalmente desde el host del Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Para realizar una prueba básica con un solo comando que crea o reutiliza una sesión, reproduce una frase conocida y muestra el estado de la sesión:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Durante la conexión en tiempo real, la automatización del navegador rellena el nombre del invitado, hace clic en Join/Ask to join y acepta la solicitud inicial de Meet "Use microphone" cuando aparece (o "Continue without microphone" durante la conexión solo como observador y la creación de reuniones únicamente mediante el navegador). Si la sesión del perfil está cerrada, Meet está esperando la admisión del anfitrión, Chrome necesita permisos de micrófono/cámara o Meet está bloqueado en una solicitud sin resolver, el resultado informa de `manualActionRequired: true` con `manualActionReason` y `manualActionMessage`. Deje de reintentar, informe de ese mensaje junto con `browserUrl`/`browserTitle` y vuelva a intentarlo solo después de que se complete la acción manual.

Si se omite `chromeNode.node`, OpenClaw selecciona automáticamente un nodo solo cuando exactamente un nodo conectado anuncia tanto `googlemeet.chrome` como el control del navegador; fije `chromeNode.node` (id. del nodo, nombre para mostrar o IP remota) cuando haya varios nodos compatibles conectados.

### Comprobaciones de errores comunes

| Síntoma                                                  | Solución                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Configured Google Meet node ... is not usable: offline` | El nodo fijado es conocido, pero no está disponible. Informe del bloqueo de configuración; no recurra silenciosamente a otro transporte salvo que se solicite.                                                                                                                                    |
| `No connected Google Meet-capable node`                  | Ejecute `openclaw node run` en la VM, apruebe el emparejamiento y ejecute allí `openclaw plugins enable google-meet` y `openclaw plugins enable browser`. Confirme que `gateway.nodes.allowCommands` incluya `googlemeet.chrome` y `browser.proxy`.                              |
| `BlackHole 2ch audio device not found`                   | Instale `blackhole-2ch` en el host que se está comprobando y reinícielo.                                                                                                                                                                                                       |
| `BlackHole 2ch audio device not found on the node`       | Instale `blackhole-2ch` en la VM y reinicie la VM.                                                                                                                                                                                                                |
| Chrome se abre, pero no puede unirse                             | Inicie sesión en el perfil del navegador de la VM o mantenga configurado `chrome.guestName`. La unión automática como invitado utiliza la automatización del navegador de OpenClaw mediante el proxy del navegador del nodo; establezca `browser.defaultProfile` del nodo (o un perfil con nombre de una sesión existente) en el perfil que desee. |
| Pestañas de Meet duplicadas                                      | Mantenga `chrome.reuseExistingTab: true`. OpenClaw activa una pestaña existente para la misma URL y, antes de abrir otra, la creación reutiliza una pestaña `.../new` en curso o una pestaña de solicitud de cuenta de Google.                                                                      |
| Sin audio                                                 | Enrute el micrófono y el altavoz de Meet mediante la ruta de audio virtual utilizada por OpenClaw; use dispositivos virtuales independientes o un enrutamiento similar a Loopback para obtener audio dúplex limpio.                                                                                                              |

## Notas de instalación

La configuración predeterminada de respuesta por Chrome utiliza dos herramientas externas que OpenClaw no incluye ni redistribuye; instálelas como dependencias del host mediante Homebrew:

- `sox`: utilidad de audio de línea de comandos. El plugin emite comandos explícitos para dispositivos CoreAudio destinados al puente de audio PCM16 predeterminado de 24 kHz.
- `blackhole-2ch`: controlador de audio virtual de macOS que proporciona el dispositivo `BlackHole 2ch` por el que se enrutan Chrome y Meet.

SoX tiene licencia `LGPL-2.0-only AND GPL-2.0-only`; BlackHole tiene licencia GPL-3.0. Si crea un instalador o dispositivo que incluya BlackHole con OpenClaw, revise las licencias originales de BlackHole u obtenga una licencia independiente de Existential Audio.

## Transportes

| Transporte    | Cuándo usarlo                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `chrome`      | Chrome y el audio se ejecutan en el host del Gateway                                                        |
| `chrome-node` | Chrome y el audio se ejecutan en un nodo emparejado (por ejemplo, una VM de macOS en Parallels)                        |
| `twilio`      | Alternativa de acceso telefónico mediante el plugin Voice Call cuando no esté disponible la participación por Chrome |

### Chrome

Abre la URL de Meet mediante el control del navegador de OpenClaw y se une con el perfil del navegador de OpenClaw que tenga la sesión iniciada. En macOS, el plugin comprueba la presencia de `BlackHole 2ch` antes de iniciarse y, si está configurado, ejecuta un comando de comprobación de estado o inicio del puente de audio antes de abrir Chrome. Para Chrome local, seleccione el perfil mediante `browser.defaultProfile`; en cambio, `chrome.browserProfile` se transmite a los hosts `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

El audio del micrófono y del altavoz de Chrome se enruta mediante el puente de audio local de OpenClaw. Si `BlackHole 2ch` no está instalado, la unión falla con un error de configuración en lugar de unirse sin una ruta de audio.

### Twilio

Un plan de marcado estricto delegado al [plugin Voice Call](/es/plugins/voice-call). No analiza las páginas de Meet para encontrar números de teléfono; Google Meet debe proporcionar un número de acceso telefónico y un PIN para la reunión.

Active Voice Call en el host del Gateway, no en el nodo de Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // o establezca "twilio" si Twilio debe ser el valor predeterminado
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          inboundPolicy: "allowlist",
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Únete a este Google Meet como agente de OpenClaw. Sé breve.",
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                silenceDurationMs: 500,
                startSensitivity: "high",
              },
            },
          },
        },
      },
      google: {
        enabled: true,
      },
    },
  },
}
```

Proporcione las credenciales de Twilio mediante el entorno para mantener los secretos fuera de `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

Use en su lugar `realtime.provider: "openai"` con `OPENAI_API_KEY` si OpenAI es el proveedor de voz en tiempo real.

Reinicie o vuelva a cargar el Gateway después de activar `voice-call`; los cambios en la configuración del plugin no surten efecto hasta que se vuelva a cargar. Compruébelo:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Cuando la delegación de Twilio está conectada, `googlemeet setup` incluye las comprobaciones `twilio-voice-call-plugin`, `twilio-voice-call-credentials` y `twilio-voice-call-webhook`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Use `--dtmf-sequence` para una secuencia personalizada, con una `w` inicial o comas para introducir una pausa antes del PIN:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth y comprobación previa

OAuth es opcional para crear un enlace de Meet, ya que `googlemeet create` puede recurrir a la automatización del navegador. Configure OAuth para la creación mediante la API oficial, la resolución de espacios o la comprobación previa de la API Meet Media. Las uniones mediante Chrome o Chrome-node nunca dependen de OAuth; en ambos casos utilizan un perfil de Chrome con la sesión iniciada, BlackHole/SoX y, para `chrome-node`, un nodo conectado.

### Crear credenciales de Google

En Google Cloud Console:

<Steps>
<Step title="Create or select a project">
</Step>
<Step title="Enable the Google Meet REST API">
</Step>
<Step title="Configure the OAuth consent screen">
Internal es la opción más sencilla para una organización de Google Workspace. External funciona para configuraciones personales o de prueba; mientras la aplicación esté en Testing, añada como usuario de prueba cada cuenta de Google que vaya a autorizarla.
</Step>
<Step title="Add the requested scopes">
- `https://www.googleapis.com/auth/meetings.space.created`
- `https://www.googleapis.com/auth/meetings.space.readonly`
- `https://www.googleapis.com/auth/meetings.space.settings`
- `https://www.googleapis.com/auth/meetings.conference.media.readonly`
- `https://www.googleapis.com/auth/calendar.events.readonly` (consulta de Calendar)
- `https://www.googleapis.com/auth/drive.meet.readonly` (exportación del cuerpo de documentos de transcripciones o notas inteligentes)

</Step>
<Step title="Create an OAuth client ID">
Tipo de aplicación **Web application**. URI de redireccionamiento autorizado:

```text
http://localhost:8085/oauth2callback
```

</Step>
<Step title="Copy the client ID and client secret">
</Step>
</Steps>

`meetings.space.created` es obligatorio para `spaces.create`. `meetings.space.readonly` resuelve las URL o los códigos de Meet en espacios. `meetings.space.settings` permite que OpenClaw transmita ajustes de `SpaceConfig`, como `accessType`, durante la creación de salas mediante la API. `meetings.conference.media.readonly` se utiliza para la comprobación previa de la API Meet Media y el trabajo con contenido multimedia; Google puede exigir la inscripción en Developer Preview para el uso efectivo de la API Media. `calendar.events.readonly` solo es necesario para la consulta del calendario mediante `--today` o `--event`. `drive.meet.readonly` solo es necesario para la exportación mediante `--include-doc-bodies`. Si solo necesita uniones con Chrome basadas en el navegador, omita OAuth por completo.

### Generar el token de actualización

Configure `oauth.clientId` y, opcionalmente, `oauth.clientSecret` (o proporciónelos como variables de entorno) y, a continuación, ejecute:

```bash
openclaw googlemeet auth login --json
```

Esto ejecuta un flujo PKCE con una devolución de llamada local en `http://localhost:8085/oauth2callback` e imprime un bloque de configuración `oauth` con un token de actualización. Añada `--manual` para utilizar un flujo de copiar y pegar cuando el navegador no pueda acceder a la devolución de llamada local:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

Salida JSON:

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

Almacene el objeto `oauth` en la configuración del plugin:

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

Dé preferencia a las variables de entorno cuando no desee incluir el token de actualización en la configuración; primero se resuelve la configuración y después se utiliza el entorno como alternativa. Si se autenticó antes de que existiera la compatibilidad con la creación de reuniones, la consulta del calendario o la exportación del cuerpo de documentos, vuelva a ejecutar `openclaw googlemeet auth login --json` para que el token de actualización abarque el conjunto de ámbitos actual.

### Comprobar OAuth con doctor

```bash
openclaw googlemeet doctor --oauth --json
```

Esto comprueba que exista la configuración de OAuth y que el token de actualización pueda generar un token de acceso, sin cargar el entorno de ejecución de Chrome ni requerir un nodo conectado. El informe solo incluye campos de estado (`ok`, `configured`, `tokenSource`, `expiresAt` y mensajes de comprobación) y nunca muestra el token de acceso, el token de actualización ni el secreto de cliente.

| Comprobación          | Significado                                                                          |
| -------------------- | -------------------------------------------------------------------------------- |
| `oauth-config`       | Están presentes `oauth.clientId` y `oauth.refreshToken`, o bien un token de acceso almacenado en caché |
| `oauth-token`        | El token de acceso almacenado en caché sigue siendo válido o el token de actualización ha generado uno nuevo    |
| `meet-spaces-get`    | La comprobación opcional `--meeting` resolvió un espacio de Meet existente                       |
| `meet-spaces-create` | La comprobación opcional `--create-space` creó un espacio de Meet nuevo                         |

Demuestre la habilitación de la API de Meet y el alcance de `spaces.create` con la comprobación de creación que produce efectos secundarios:

```bash
openclaw googlemeet doctor --oauth --create-space --json
```

Demuestre el acceso de lectura a un espacio existente:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Un `403` en estas comprobaciones suele significar que la API REST de Meet está deshabilitada, que al token de actualización le falta el alcance requerido o que la cuenta de Google no puede acceder a ese espacio. Un error del token de actualización significa que se debe volver a ejecutar `openclaw googlemeet auth login --json` y almacenar el nuevo bloque `oauth`.

No se necesita OAuth para el mecanismo alternativo del navegador; en ese caso, la autenticación de Google procede del perfil de Chrome con sesión iniciada en el Node seleccionado, no de la configuración de OpenClaw.

Estas variables de entorno se aceptan como mecanismos alternativos:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` o `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` o `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` o `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` o `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` o `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` o `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` o `GOOGLE_MEET_PREVIEW_ACK`

### Resolver, realizar comprobaciones previas y leer artefactos

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Después de que Meet haya creado registros de conferencia:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Con `--meeting`, `artifacts` y `attendance` usan de forma predeterminada el registro de conferencia más reciente; pase `--all-conference-records` para incluir todos los registros conservados.

La búsqueda en Calendar resuelve la URL de la reunión desde Google Calendar antes de leer los artefactos (requiere un token de actualización que incluya el alcance de solo lectura de eventos de Calendar):

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` busca en el calendario `primary` de hoy un evento con un enlace de Meet; `--event <query>` busca texto coincidente en los eventos; `--calendar <id>` selecciona un calendario no principal. `calendar-events` muestra una vista previa de los eventos coincidentes e indica cuál elegirán `latest`/`artifacts`/`attendance`/`export`.

Si ya conoce el identificador del registro de conferencia, úselo directamente:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Cierre la sala de un espacio creado mediante la API:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Llama a `spaces.endActiveConference` y requiere OAuth con el alcance `meetings.space.created` para un espacio que pueda administrar la cuenta autorizada. Acepta una URL de Meet, un código de reunión o `spaces/{id}`, y primero lo resuelve al recurso de espacio de la API. Esto es independiente de `googlemeet leave`: `leave` detiene la participación local o de sesión de OpenClaw; `end-active-conference` solicita a Google Meet que finalice la conferencia activa del espacio.

Escriba un informe legible:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` devuelve los metadatos del registro de conferencia, además de los metadatos de los recursos de participantes, grabaciones, transcripciones, entradas estructuradas de transcripción y notas inteligentes cuando Google los expone. `--no-transcript-entries` omite la consulta de entradas en reuniones grandes. `attendance` expande los participantes en filas de sesiones de participantes con las horas de primera y última aparición, la duración total de las sesiones, indicadores de llegada tardía y salida anticipada, y combina los recursos de participantes duplicados por usuario con sesión iniciada o nombre para mostrar; `--no-merge-duplicates` mantiene separados los recursos sin procesar, y `--late-after-minutes`/`--early-before-minutes` ajustan los umbrales.

`export` escribe una carpeta con `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` y `manifest.json`. `manifest.json` registra la entrada elegida, las opciones de exportación, los registros de conferencia, los archivos de salida, los recuentos, el origen del token, cualquier evento de Calendar utilizado y las advertencias de recuperación parcial. `--zip` también escribe un archivo portátil junto a la carpeta. `--include-doc-bodies` exporta el texto de los documentos de Google vinculados de transcripciones y notas inteligentes mediante `files.export` de Drive (requiere el alcance de solo lectura de Meet en Drive); sin esta opción, las exportaciones solo incluyen los metadatos de Meet y las entradas estructuradas de transcripción. Un fallo parcial de un artefacto (al enumerar notas inteligentes, recuperar entradas de transcripción o recuperar el cuerpo de un documento) conserva la advertencia en el resumen o manifiesto, en lugar de hacer que falle toda la exportación. `--dry-run` recupera los mismos datos e imprime el JSON del manifiesto sin crear la carpeta ni el ZIP.

Los agentes usan las mismas acciones mediante la herramienta `google_meet` (`export`, `create` con `accessType`, `end_active_conference`, `test_listen`); consulte [Herramienta](#tool).

### Prueba rápida en vivo

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

| Variable                                                                                                                  | Propósito                                                               |
| ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `OPENCLAW_LIVE_TEST=1`                                                                                                    | Habilita las pruebas en vivo protegidas                                 |
| `OPENCLAW_GOOGLE_MEET_LIVE_MEETING`                                                                                       | URL de Meet, código o `spaces/{id}` conservado                          |
| `OPENCLAW_GOOGLE_MEET_CLIENT_ID` / `GOOGLE_MEET_CLIENT_ID`                                                                | Identificador de cliente OAuth                                          |
| `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` / `GOOGLE_MEET_REFRESH_TOKEN`                                                        | Token de actualización                                                  |
| `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` | Opcional; también funcionan los mismos nombres alternativos sin el prefijo `OPENCLAW_` |

La prueba rápida básica de artefactos y asistencia necesita `meetings.space.readonly` y `meetings.conference.media.readonly`. La búsqueda en Calendar necesita `calendar.events.readonly`. La exportación del cuerpo de documentos de Drive necesita `drive.meet.readonly`.

### Ejemplos de creación

```bash
openclaw googlemeet create
```

Imprime el URI de la nueva reunión, el origen y la sesión de unión. Con OAuth usa la API de Meet; sin OAuth, usa el perfil con sesión iniciada del Node de Chrome fijado. JSON del mecanismo alternativo del navegador:

```json
{
  "source": "navegador",
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

Si el mecanismo alternativo del navegador encuentra primero el inicio de sesión de Google o un bloqueo de permisos de Meet, `google_meet` devuelve detalles estructurados en lugar de una cadena de texto sin formato:

```json
{
  "source": "navegador",
  "error": "google-login-required: Inicie sesión en Google en el perfil de navegador de OpenClaw y vuelva a intentar crear la reunión.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Inicie sesión en Google en el perfil de navegador de OpenClaw y vuelva a intentar crear la reunión.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

JSON de creación mediante la API:

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

De forma predeterminada, la creación también inicia la unión, pero Chrome o el Node de Chrome siguen necesitando un perfil de Google con sesión iniciada para unirse mediante el navegador; si la sesión está cerrada, OpenClaw informa de `manualActionRequired: true` o de un error del mecanismo alternativo del navegador y solicita al operador que complete el inicio de sesión de Google antes de volver a intentarlo.

Establezca `preview.enrollmentAcknowledged: true` solo después de confirmar que el proyecto de Cloud, el principal de OAuth y los participantes de la reunión están inscritos en Google Workspace Developer Preview Program para las API multimedia de Meet.

## Configuración

La ruta común del agente de Chrome solo necesita que el plugin esté habilitado, BlackHole, SoX, una clave de proveedor en tiempo real y un proveedor de TTS de OpenClaw configurado:

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

### Valores predeterminados

| Clave                             | Valor predeterminado                      | Notas                                                                                                                                                                                                                 |
| --------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultTransport`                | `"chrome"`                               |                                                                                                                                                                                                                       |
| `defaultMode`                     | `"agent"`                                | `"realtime"` se acepta como alias heredado de `"agent"`; los nuevos clientes deben usar `"agent"`                                                                                                                     |
| `chromeNode.node`                 | sin definir                              | Id./nombre/IP del Node para `chrome-node`; obligatorio cuando puede haber conectado más de un Node compatible                                                                                                        |
| `chrome.launch`                   | `true`                                   | Inicia Chrome para unirse; use `false` únicamente al reutilizar una sesión ya abierta                                                                                                                                |
| `chrome.audioBackend`             | `"blackhole-2ch"`                        |                                                                                                                                                                                                                       |
| `chrome.guestName`                | `"OpenClaw Agent"`                       | Se muestra en la pantalla de invitado de Meet sin sesión iniciada                                                                                                                                                     |
| `chrome.autoJoin`                 | `true`                                   | Intenta rellenar el nombre de invitado y hacer clic en Join Now en `chrome-node`                                                                                                                                      |
| `chrome.reuseExistingTab`         | `true`                                   | Activa una pestaña de Meet existente en lugar de abrir duplicados                                                                                                                                                     |
| `chrome.waitForInCallMs`          | `20000`                                  | Espera a que la pestaña de Meet indique que está en la llamada antes de reproducir la introducción de respuesta por voz                                                                                               |
| `chrome.audioFormat`              | `"pcm16-24khz"`                          | Formato de audio del par de comandos; `"g711-ulaw-8khz"` es solo para pares de comandos heredados o personalizados que emiten audio de telefonía                                                                      |
| `chrome.audioBufferBytes`         | `4096`                                   | Búfer de procesamiento de SoX para comandos de audio generados del par de comandos (la mitad del búfer predeterminado de SoX de 8192 bytes, lo que reduce la latencia de la canalización); los valores se limitan a un mínimo de 17 bytes |
| `chrome.audioInputCommand`        | comando SoX generado                     | Lee desde CoreAudio `BlackHole 2ch` y escribe audio en `chrome.audioFormat`                                                                                                                                           |
| `chrome.audioOutputCommand`       | comando SoX generado                     | Lee audio en `chrome.audioFormat` y escribe en CoreAudio `BlackHole 2ch`                                                                                                                                              |
| `chrome.bargeInInputCommand`      | sin definir                              | Comando opcional del micrófono local que escribe PCM mono de 16 bits con signo y endianidad little-endian para detectar interrupciones humanas durante la reproducción del asistente; se aplica al puente del par de comandos alojado en el Gateway |
| `chrome.bargeInRmsThreshold`      | `650`                                    | Nivel RMS considerado una interrupción humana                                                                                                                                                                         |
| `chrome.bargeInPeakThreshold`     | `2500`                                   | Nivel máximo considerado una interrupción humana                                                                                                                                                                      |
| `chrome.bargeInCooldownMs`        | `900`                                    | Retraso mínimo entre borrados repetidos por interrupción                                                                                                                                                              |
| `mode` (por solicitud)            | `"agent"`                                | Modo de respuesta por voz; consulte la tabla [Modos de agente y bidi](#agent-and-bidi-modes)                                                                                                                          |
| `realtime.provider`               | `"openai"`                               | Alternativa de compatibilidad utilizada cuando los campos delimitados siguientes no están definidos                                                                                                                  |
| `realtime.transcriptionProvider`  | `"openai"`                               | Id. del proveedor que utiliza el modo `agent` para la transcripción en tiempo real                                                                                                                                    |
| `realtime.voiceProvider`          | sin definir                              | Id. del proveedor que utiliza el modo `bidi` para voz directa en tiempo real; configúrelo como `"google"` para Gemini Live mientras mantiene la transcripción del modo de agente en OpenAI. Combínelo con `realtime.model` para elegir el modelo específico de Gemini Live. |
| `realtime.toolPolicy`             | `"safe-read-only"`                       | Consulte [Modos de agente y bidi](#agent-and-bidi-modes)                                                                                                                                                              |
| `realtime.instructions`           | instrucciones breves de respuesta oral   | Indica al modelo que hable brevemente y use `openclaw_agent_consult` para ofrecer respuestas más detalladas                                                                                                           |
| `realtime.introMessage`           | `"Say exactly: I'm here and listening."` | Se reproduce una vez cuando se conecta el puente en tiempo real; configúrelo como `""` para unirse en silencio                                                                                                        |
| `realtime.agentId`                | `"main"`                                 | Id. del agente de OpenClaw utilizado para `openclaw_agent_consult`                                                                                                                                                    |
| `voiceCall.enabled`               | `true`                                   | Delega la llamada PSTN de Twilio, DTMF y el saludo introductorio al Plugin Voice Call                                                                                                                                 |
| `voiceCall.dtmfDelayMs`           | `12000`                                  | Espera inicial antes de reproducir mediante Twilio una secuencia DTMF derivada de un PIN                                                                                                                              |
| `voiceCall.postDtmfSpeechDelayMs` | `5000`                                   | Retraso antes de solicitar el saludo introductorio en tiempo real después de que Voice Call inicia el tramo de Twilio                                                                                                 |

`chrome.audioBridgeCommand` y `chrome.audioBridgeHealthCommand` permiten que un puente externo controle toda la ruta de audio local en lugar de `chrome.audioInputCommand`/`chrome.audioOutputCommand`; consulte [Notas](#notes) para conocer la restricción sobre qué modo puede utilizarlos.

Existe una migración de `openclaw doctor --fix` para la forma heredada `realtime.provider: "google"`: traslada esa intención a `realtime.voiceProvider: "google"` junto con `realtime.transcriptionProvider: "openai"` cuando esos campos aún no están definidos.

### Anulaciones opcionales

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
    provider: "openai",
    transcriptionProvider: "openai",
    voiceProvider: "google",
    model: "gemini-3.1-flash-live-preview",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        speakerVoice: "Kore",
      },
    },
  },
}
```

ElevenLabs tanto para escuchar como para hablar en modo de agente:

```json5
{
  messages: {
    tts: {
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          modelId: "eleven_v3",
          speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
        },
      },
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        config: {
          realtime: {
            transcriptionProvider: "elevenlabs",
            providers: {
              elevenlabs: {
                modelId: "scribe_v2_realtime",
                audioFormat: "ulaw_8000",
                sampleRate: 8000,
                commitStrategy: "vad",
              },
            },
          },
        },
      },
    },
  },
}
```

La voz persistente de Meet proviene de `messages.tts.providers.elevenlabs.speakerVoiceId`. Las respuestas del agente también pueden utilizar directivas por respuesta `[[tts:speakerVoiceId=... model=eleven_v3]]` cuando las anulaciones del modelo TTS están habilitadas, pero la configuración es el valor predeterminado determinista para las reuniones. Al unirse, los registros muestran `transcriptionProvider=elevenlabs`, y cada respuesta oral registra `provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>`.

Configuración exclusiva para Twilio:

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

Con `voiceCall.enabled: true` (el valor predeterminado) y el transporte de Twilio, Voice Call introduce la secuencia DTMF antes de abrir el flujo multimedia en tiempo real y, a continuación, utiliza el texto introductorio guardado como saludo inicial en tiempo real. Si `voice-call` no está habilitado, Google Meet aún puede validar y registrar el plan de marcación, pero no puede realizar la llamada de Twilio.

Deja `voiceCall.gatewayUrl` sin definir para usar el entorno de ejecución local de confianza del Gateway, que conserva al
agente que realiza la invocación durante toda la llamada. Una URL de Gateway configurada sigue siendo un destino WebSocket explícito y
no puede autenticar la procedencia del Plugin; las incorporaciones de agentes no predeterminados fallan de forma segura en lugar de
usar silenciosamente otro agente. Ejecuta Google Meet y Voice Call en el mismo proceso del Gateway cuando se requiera
enrutamiento por agente.

## Herramienta

Los agentes usan la herramienta `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

| `action`                | Propósito                                                                                                      |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| `join`                  | Unirse a una URL explícita de Meet                                                                             |
| `create`                | Crear un espacio (y unirse de forma predeterminada); admite `accessType`/`entryPointAccess`                    |
| `status`                | Enumerar las sesiones activas o inspeccionar una mediante `sessionId`                                          |
| `setup_status`          | Ejecutar las mismas comprobaciones que `googlemeet setup`                                                      |
| `resolve_space`         | Resolver una URL, un código o `spaces/{id}` mediante `spaces.get`                                              |
| `preflight`             | Validar los requisitos previos de OAuth y resolución de la reunión                                             |
| `latest`                | Buscar el registro de conferencia más reciente de una reunión                                                  |
| `calendar_events`       | Previsualizar eventos de Calendar con enlaces de Meet                                                          |
| `artifacts`             | Enumerar registros de conferencias y metadatos de participantes, grabaciones, transcripciones y notas inteligentes |
| `attendance`            | Enumerar participantes y sesiones de participantes                                                             |
| `export`                | Escribir el paquete de artefactos, asistencia, transcripción y manifiesto; establecer `"dryRun": true` para generar solo el manifiesto |
| `recover_current_tab`   | Enfocar o inspeccionar una pestaña de Meet existente sin abrir una nueva                                       |
| `transcript`            | Leer la transcripción acotada de subtítulos; `sinceIndex` reanuda desde el `nextIndex` anterior                |
| `leave`                 | Finalizar una sesión (Chrome hace clic en el botón para salir; cierra solo las pestañas que abrió; Twilio cuelga) |
| `end_active_conference` | Finalizar la conferencia activa de Google Meet de un espacio administrado mediante la API                      |
| `speak`                 | Hacer que el agente en tiempo real hable de inmediato, dados `sessionId` y `message`                           |
| `test_speech`           | Crear o reutilizar una sesión, activar una frase conocida y devolver el estado de Chrome                       |
| `test_listen`           | Crear o reutilizar una sesión solo de observación y esperar cambios en los subtítulos o la transcripción       |

`test_speech` siempre fuerza `mode: "agent"` o `"bidi"` y falla si se solicita su ejecución en `mode: "transcribe"`, porque las sesiones solo de observación no pueden emitir voz. Su resultado `speechOutputVerified` se basa en que aumenten los bytes de salida de audio en tiempo real durante esa llamada, por lo que una sesión reutilizada con audio anterior no cuenta como una comprobación nueva.

Para los transportes de Chrome, `leave` mantiene abierta una pestaña reutilizada propiedad del usuario después de hacer clic en el botón de Meet para salir de la llamada. Las pestañas abiertas por OpenClaw se cierran después de salir.

Usa `transport: "chrome"` cuando Chrome se ejecute en el host del Gateway y `transport: "chrome-node"` cuando se ejecute en un nodo emparejado. En ambos casos, los proveedores de modelos y `openclaw_agent_consult` se ejecutan en el host del Gateway, por lo que las credenciales del modelo permanecen allí. Los registros del modo agente incluyen el proveedor y el modelo de transcripción resueltos al iniciar el puente, así como el proveedor, el modelo, la voz, el formato de salida y la frecuencia de muestreo de TTS después de cada respuesta sintetizada. El valor sin procesar `mode: "realtime"` todavía se acepta como alias heredado de compatibilidad para `mode: "agent"`, pero ya no se anuncia en la enumeración `mode` de la herramienta.

`create` con una sala respaldada por la API y una política de acceso explícita:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

Finalizar la conferencia activa de una sala conocida:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

Validación escuchando primero antes de afirmar que una reunión es útil:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Hablar bajo demanda:

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Di exactamente: Estoy aquí y escuchando."
}
```

`status` incluye el estado de Chrome cuando está disponible:

| Campo                                                                 | Significado                                                                                                                           |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `inCall`                                                              | Chrome parece estar dentro de la llamada de Meet                                                                                      |
| `micMuted`                                                            | Estado aproximado del micrófono de Meet                                                                                               |
| `manualActionRequired` / `manualActionReason` / `manualActionMessage` | El perfil del navegador necesita inicio de sesión manual, admisión del anfitrión de Meet, permisos o reparación del control del navegador antes de que pueda funcionar la voz |
| `speechReady` / `speechBlockedReason` / `speechBlockedMessage`        | Indica si se permite ahora la voz administrada de Chrome; `speechReady: false` significa que OpenClaw no envió la frase de introducción o prueba |
| `providerConnected` / `realtimeReady`                                 | Estado del puente de voz en tiempo real                                                                                               |
| `lastInputAt` / `lastOutputAt`                                        | Último audio recibido del puente o enviado a este                                                                                     |
| `audioOutputRouted` / `audioOutputDeviceLabel`                        | Indica si la salida multimedia de la pestaña de Meet se enrutó activamente al dispositivo BlackHole del puente                       |
| `lastSuppressedInputAt` / `suppressedInputBytes`                      | Entrada de bucle invertido ignorada mientras está activa la reproducción del asistente                                                |

## Modos agente y bidi

| Modo    | Quién decide la respuesta        | Ruta de salida de voz                         | Cuándo usarlo                                                      |
| ------- | -------------------------------- | --------------------------------------------- | ------------------------------------------------------------------ |
| `agent` | El agente de OpenClaw configurado | Entorno de ejecución TTS normal de OpenClaw   | Cuando se desea el comportamiento «mi agente está en la reunión»   |
| `bidi`  | El modelo de voz en tiempo real  | Respuesta de audio del proveedor de voz en tiempo real | Cuando se desea el bucle de voz conversacional de menor latencia |

Modo `agent`: el proveedor de transcripción en tiempo real escucha el audio de la reunión, las transcripciones finales de los participantes se enrutan a través del agente de OpenClaw configurado y la respuesta se reproduce mediante el TTS habitual de OpenClaw. Los fragmentos cercanos de la transcripción final se agrupan antes de la consulta para que un turno hablado no produzca varias respuestas parciales obsoletas; la entrada en tiempo real se suprime mientras el audio del asistente en cola sigue reproduciéndose, y los ecos recientes de transcripción similares a la voz del asistente se ignoran antes de la consulta para que el bucle invertido de BlackHole no haga que el agente responda a su propia voz.

Modo `bidi`: el modelo de voz en tiempo real responde directamente y puede llamar a `openclaw_agent_consult` para obtener razonamiento más profundo, información actual o las herramientas normales de OpenClaw. La herramienta de consulta ejecuta en segundo plano el agente habitual de OpenClaw con el contexto reciente de la transcripción de la reunión y devuelve una respuesta hablada concisa; en el modo `agent`, OpenClaw envía esa respuesta directamente a TTS, y en el modo `bidi`, el modelo de voz en tiempo real puede reproducirla. Usa el mismo mecanismo de consulta compartido que Voice Call.

De forma predeterminada, las consultas se ejecutan con el agente `main`; establece `realtime.agentId` para dirigir un canal de Meet a un espacio de trabajo de agente dedicado, valores predeterminados del modelo, política de herramientas, memoria e historial de sesiones. Las consultas del modo agente usan una clave de sesión `agent:<id>:subagent:google-meet:<session>` por reunión, de modo que las preguntas de seguimiento conserven el contexto de la reunión mientras heredan la política normal del agente. Cuando un agente llama a `google_meet` en modo agente, la sesión del consultor bifurca la transcripción actual del llamador antes de responder a la intervención de un participante; la sesión de Meet permanece separada para que los seguimientos de la reunión no modifiquen directamente la transcripción del llamador.

`realtime.toolPolicy` controla la ejecución de la consulta:

| Política         | Comportamiento                                                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Exponer la herramienta de consulta; limitar el agente habitual a `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, `memory_get` |
| `owner`          | Exponer la herramienta de consulta; permitir que el agente habitual use su política normal de herramientas                       |
| `none`           | No exponer la herramienta de consulta al modelo de voz en tiempo real                                                             |

La clave de sesión de consulta tiene un ámbito por sesión de Meet, por lo que las llamadas de consulta de seguimiento reutilizan el contexto de consultas anterior durante la misma reunión.

Fuerza una comprobación hablada de disponibilidad después de que Chrome se haya unido por completo:

```bash
openclaw googlemeet speak meet_... "Di exactamente: Estoy aquí y escuchando."
```

Prueba de humo completa de unión y habla:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Di exactamente: Estoy aquí y escuchando."
```

## Lista de comprobación de la prueba en vivo

Antes de entregar una reunión a un agente sin supervisión:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Di exactamente: Prueba de voz de Google Meet completada."
```

Estado esperado de Chrome-node:

- `googlemeet setup` muestra todo en verde e incluye `chrome-node-connected` cuando Chrome-node es el transporte predeterminado o hay un nodo fijado.
- `nodes status` muestra el nodo seleccionado como conectado y anuncia tanto `googlemeet.chrome` como `browser.proxy`.
- La pestaña de Meet se une y `test-speech` devuelve el estado de Chrome con `inCall: true`.

Para un host de Chrome remoto, como una máquina virtual de macOS en Parallels, la comprobación segura más breve después de actualizar el Gateway o la máquina virtual es:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Esto demuestra que el Plugin del Gateway está cargado, que el nodo de la máquina virtual está conectado con el token actual y que el puente de audio de Meet está disponible antes de que un agente abra una pestaña de reunión real.

Para una prueba de humo de Twilio, usa una reunión que proporcione datos de acceso telefónico:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Estado esperado de Twilio:

- `googlemeet setup` incluye comprobaciones verdes de `twilio-voice-call-plugin`, `twilio-voice-call-credentials` y `twilio-voice-call-webhook`.
- `voicecall` está disponible en la CLI después de recargar el Gateway.
- La sesión devuelta tiene `transport: "twilio"` y un `twilio.voiceCallId`.
- `openclaw logs --follow` muestra que el TwiML de DTMF se sirve antes que el TwiML en tiempo real, seguido de un puente en tiempo real con el saludo inicial en cola.
- `googlemeet leave <sessionId>` cuelga la llamada de voz delegada.

## Solución de problemas

### El agente no puede ver la herramienta de Google Meet

Confirme que el plugin esté habilitado y recargue el Gateway; el agente en ejecución solo ve las herramientas de plugins registradas por el proceso actual del Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

En hosts del Gateway que no sean macOS, `google_meet` permanece visible, pero las acciones de respuesta por voz del Chrome local se bloquean antes de llegar al puente de audio. Use `mode: "transcribe"`, la conexión telefónica de Twilio o un host `chrome-node` con macOS en lugar de la ruta predeterminada del agente de Chrome local.

### No hay ningún nodo conectado compatible con Google Meet

En el host del nodo:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

En el host del Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

El nodo debe estar conectado y mostrar `googlemeet.chrome` junto con `browser.proxy`; la configuración del Gateway debe permitir ambos:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Si `googlemeet setup` falla en `chrome-node-connected`, o el registro del Gateway informa `gateway token mismatch`, reinstale o reinicie el nodo con el token actual del Gateway:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

A continuación, recargue el servicio del nodo y vuelva a ejecutar:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### El navegador se abre, pero el agente no puede unirse

Ejecute `googlemeet test-listen` para uniones de solo observación o `googlemeet test-speech` para uniones en tiempo real y, a continuación, inspeccione el estado de Chrome devuelto. Si alguno informa `manualActionRequired: true`, muestre `manualActionMessage` al operador y deje de reintentar hasta que se complete la acción en el navegador.

Acciones manuales habituales: iniciar sesión en el perfil de Chrome; admitir al invitado desde la cuenta anfitriona de Meet; conceder permisos de micrófono/cámara a Chrome cuando aparezca el aviso nativo; cerrar o corregir un cuadro de diálogo de permisos de Meet bloqueado.

No informe «no se ha iniciado sesión» solo porque Meet pregunte «Do you want people to hear you in the meeting?»; esa es la pantalla intermedia de elección de audio de Meet. OpenClaw hace clic en **Use microphone** mediante la automatización del navegador cuando está disponible y sigue esperando el estado real de la reunión; para el modo alternativo del navegador de solo creación, puede hacer clic en **Continue without microphone**, ya que generar la URL no necesita la ruta de audio en tiempo real.

### Falla la creación de la reunión

`googlemeet create` usa `spaces.create` de la API de Meet cuando OAuth está configurado; de lo contrario, usa el navegador del nodo de Chrome fijado. Confirme lo siguiente:

- **Creación mediante API**: `oauth.clientId` y `oauth.refreshToken` (o las variables de entorno `OPENCLAW_GOOGLE_MEET_*` correspondientes) están presentes, y el token de actualización se generó después de que se añadiera la compatibilidad con la creación; los tokens anteriores pueden carecer de `meetings.space.created`, así que vuelva a ejecutar `openclaw googlemeet auth login --json`.
- **Modo alternativo del navegador**: `defaultTransport: "chrome-node"` y `chromeNode.node` apuntan a un nodo conectado con `browser.proxy` y `googlemeet.chrome`; el perfil de Chrome de OpenClaw en ese nodo tiene una sesión iniciada y puede abrir `https://meet.google.com/new`.
- **Reintentos del modo alternativo del navegador**: reutilice una pestaña existente de `.../new` o del aviso de la cuenta de Google antes de abrir una nueva; reintente la llamada a la herramienta en lugar de abrir manualmente otra pestaña.
- **Acción manual**: si la herramienta devuelve `manualActionRequired: true`, use `browser.nodeId`, `browser.targetId`, `browserUrl` y `manualActionMessage` para orientar al operador; no reintente en bucle.
- **Pantalla intermedia de elección de audio**: si Meet muestra «Do you want people to hear you in the meeting?», deje abierta la pestaña. OpenClaw debería hacer clic en **Use microphone** o, solo para la creación, en **Continue without microphone**, y seguir esperando la URL generada; si no puede hacerlo, el error debería mencionar `meet-audio-choice-required`, no `google-login-required`.

### El agente se une, pero no habla

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Use `mode: "agent"` para la ruta STT -> agente de OpenClaw -> TTS y `mode: "bidi"` para el modo alternativo directo de voz en tiempo real. `mode: "transcribe"` no inicia deliberadamente ningún puente de respuesta por voz. Para la depuración de solo observación, ejecute `openclaw googlemeet status --json <session-id>` después de que hablen los participantes y compruebe `captioning`, `transcriptLines` y `lastCaptionText`. Si `inCall` es verdadero, pero `transcriptLines` permanece en `0`, es posible que los subtítulos de Meet estén deshabilitados, que nadie haya hablado desde que se instaló el observador, que haya cambiado la interfaz de Meet o que los subtítulos en directo no estén disponibles para el idioma o la cuenta de la reunión.

`googlemeet test-speech` siempre comprueba la ruta en tiempo real e informa si se observaron bytes de salida del puente para esa invocación. Si `speechOutputVerified` es falso y `speechOutputTimedOut` es verdadero, es posible que el proveedor en tiempo real haya aceptado la intervención, pero OpenClaw no haya detectado que nuevos bytes de salida llegaran al puente de audio de Chrome.

Verifique también lo siguiente: hay disponible una clave de proveedor en tiempo real (`OPENAI_API_KEY` o `GEMINI_API_KEY`) en el host del Gateway; `BlackHole 2ch` es visible en el host de Chrome; `sox` está instalado allí; el micrófono y el altavoz de Meet están enrutados mediante la ruta de audio virtual (`doctor` debería mostrar `meet output routed: yes` para las uniones en tiempo real mediante Chrome local).

`googlemeet doctor [session-id]` muestra la sesión, el nodo, el estado de la llamada, el motivo de la acción manual, la conexión del proveedor en tiempo real, `realtimeReady`, la actividad de entrada/salida de audio, las últimas marcas de tiempo del audio, los contadores de bytes y la URL del navegador. Use `googlemeet status [session-id] --json` para obtener el JSON sin procesar y `googlemeet doctor --oauth` (añada `--meeting` o `--create-space`) para verificar la actualización de OAuth sin exponer tokens.

Si se agotó el tiempo de espera de un agente y ya hay una pestaña de Meet abierta, inspecciónela sin abrir otra:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

La acción equivalente de la herramienta es `recover_current_tab`: enfoca e inspecciona una pestaña de Meet existente para el transporte seleccionado (control local del navegador para `chrome`, el nodo configurado para `chrome-node`) sin abrir una nueva pestaña ni sesión, e informa del bloqueo actual (inicio de sesión, admisión, permisos o estado de elección de audio). El comando de la CLI se comunica con el Gateway configurado, que debe estar en ejecución; `chrome-node` también requiere que el nodo esté conectado.

### Fallan las comprobaciones de configuración de Twilio

`twilio-voice-call-plugin` falla cuando `voice-call` no está permitido o habilitado: añádalo a `plugins.allow`, habilite `plugins.entries.voice-call` y recargue el Gateway.

`twilio-voice-call-credentials` falla cuando al backend de Twilio le faltan el SID de la cuenta, el token de autenticación o el número de llamada:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` falla cuando `voice-call` no tiene una exposición pública del Webhook o cuando `publicUrl` apunta al bucle invertido o a un espacio de red privado. No use `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` ni `fd00::/8` como `publicUrl`; las devoluciones de llamada del operador no pueden acceder a esas direcciones. Establezca `plugins.entries.voice-call.config.publicUrl` en una URL pública o configure una exposición mediante un túnel o Tailscale:

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

Para el desarrollo local, use una exposición mediante túnel o Tailscale en lugar de una URL de host privada:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // o
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Reinicie o recargue el Gateway y, a continuación:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

De forma predeterminada, `voicecall smoke` solo comprueba la disponibilidad. Simule la llamada a un número específico:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Añada `--yes` únicamente para realizar deliberadamente una llamada saliente real:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### La llamada de Twilio comienza, pero nunca entra en la reunión

Confirme que el evento de Meet muestre los datos de conexión telefónica y proporcione el número exacto de conexión junto con el PIN o una secuencia DTMF personalizada:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Use `w` iniciales o comas en `--dtmf-sequence` para introducir una pausa antes del PIN.

Si se crea la llamada, pero la lista de participantes de Meet nunca muestra al participante conectado por teléfono:

- `openclaw googlemeet doctor <session-id>`: confirme el identificador de la llamada delegada de Twilio, si DTMF se puso en cola y si se solicitó el saludo introductorio.
- `openclaw voicecall status --call-id <id>`: confirme que la llamada siga activa.
- `openclaw voicecall tail`: confirme que los Webhooks de Twilio estén llegando al Gateway.
- `openclaw logs --follow`: busque la secuencia de Twilio para Meet: Google Meet delega la unión, Voice Call almacena y sirve el TwiML de DTMF previo a la conexión, Voice Call sirve el TwiML en tiempo real para la llamada de Twilio y, a continuación, Google Meet solicita el mensaje introductorio mediante `voicecall.speak`.
- Vuelva a ejecutar `openclaw googlemeet setup --transport twilio`; se requiere una comprobación de configuración verde, pero esto no demuestra que la secuencia del PIN de la reunión sea correcta.
- Confirme que el número de conexión telefónica pertenezca a la misma invitación y región de Meet que el PIN.
- Aumente `voiceCall.dtmfDelayMs` con respecto al valor predeterminado de 12 segundos si Meet tarda en responder o si la transcripción de la llamada sigue mostrando la solicitud del PIN después de que se enviara el DTMF previo a la conexión.
- Si el participante se une, pero no se oye el saludo, compruebe en `openclaw logs --follow` la solicitud `voicecall.speak` posterior al DTMF y la reproducción TTS mediante flujo multimedia o el modo alternativo `<Say>` de Twilio. Si la transcripción sigue mostrando «enter the meeting PIN», el tramo telefónico todavía no se ha unido a la sala de Meet, por lo que los participantes no oirán el mensaje.

Si no llegan los Webhooks, depure primero el plugin Voice Call: el proveedor debe poder acceder a `plugins.entries.voice-call.config.publicUrl` o al túnel configurado. Consulte [Solución de problemas de llamadas de voz](/es/plugins/voice-call#troubleshooting).

## Notas

La API multimedia oficial de Google Meet está orientada a la recepción, por lo que hablar durante una llamada sigue requiriendo una ruta de participante. Este plugin mantiene visible ese límite: Chrome gestiona la participación mediante el navegador y el enrutamiento de audio local; Twilio gestiona la participación mediante conexión telefónica.

Los modos de respuesta por voz de Chrome necesitan `BlackHole 2ch` junto con una de las siguientes opciones:

- `chrome.audioInputCommand` junto con `chrome.audioOutputCommand`: OpenClaw controla el puente y canaliza el audio en `chrome.audioFormat` entre esos comandos y el proveedor seleccionado. El modo `agent` usa transcripción en tiempo real junto con TTS normal; el modo `bidi` usa el proveedor de voz en tiempo real. La ruta predeterminada es PCM16 a 24 kHz con `chrome.audioBufferBytes: 4096`; G.711 mu-law a 8 kHz sigue disponible para pares de comandos heredados.
- `chrome.audioBridgeCommand`: un comando de puente externo controla toda la ruta de audio local y debe finalizar después de iniciar o validar su daemon. Solo es válido para `bidi`, porque el modo `agent` necesita acceso directo al par de comandos para TTS.

Con el puente de Chrome basado en un par de comandos, `chrome.bargeInInputCommand` puede escuchar un micrófono local independiente y detener la reproducción del asistente cuando una persona empieza a hablar, manteniendo la voz humana por delante de la salida del asistente incluso mientras la entrada de retorno compartida de BlackHole se suprime temporalmente durante la reproducción del asistente. Al igual que `chrome.audioInputCommand`/`chrome.audioOutputCommand`, es un comando local configurado por el operador: use una ruta de comando explícita y de confianza o una lista de argumentos; nunca un script procedente de una ubicación que no sea de confianza.

Para obtener audio dúplex limpio, enrute la salida de Meet y el micrófono de Meet mediante dispositivos virtuales independientes o un grafo de dispositivos virtuales similar a Loopback; un único dispositivo BlackHole compartido puede devolver el audio de otros participantes a la llamada y provocar eco.

`googlemeet speak` activa el puente de audio de respuesta para una sesión de Chrome; `googlemeet leave` lo detiene (y, en las sesiones de Twilio delegadas mediante Voice Call, cuelga la llamada subyacente). Use `googlemeet end-active-conference` para cerrar también la conferencia activa de Google Meet en un espacio administrado mediante la API.

## Relacionado

- [Plugin de llamadas de voz](/es/plugins/voice-call)
- [Modo de conversación](/es/nodes/talk)
- [Creación de plugins](/es/plugins/building-plugins)
