---
read_when:
    - Quieres que un agente de OpenClaw se una a una llamada de Google Meet
    - Quieres que un agente de OpenClaw cree una nueva llamada de Google Meet
    - Estás configurando Chrome, nodo de Chrome o Twilio como transporte de Google Meet
summary: 'Plugin de Google Meet: unirse a URL explícitas de Meet mediante Chrome o Twilio con valores predeterminados de respuesta oral del agente'
title: Plugin de Google Meet
x-i18n:
    generated_at: "2026-07-05T11:29:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60b47f2a7bfb2e96a1f75daef4f130851e5190e3f600dd48c0675ec6a5cdc12a
    source_path: plugins/google-meet.md
    workflow: 16
---

El Plugin `google-meet` se une a URL explícitas de Meet en nombre de un agente de OpenClaw. Es deliberadamente limitado:

- Solo se une a URL `https://meet.google.com/...`; nunca llama a una reunión desde un número de teléfono que descubre por sí mismo.
- `googlemeet create` puede generar una nueva URL de Meet mediante la API de Google Meet (o una alternativa con navegador) y unirse a ella de forma predeterminada.
- La participación con Chrome usa un perfil de Chrome con sesión iniciada, opcionalmente en un nodo emparejado. La participación con Twilio llama a un número de teléfono más PIN/DTMF mediante el [Plugin de llamadas de voz](/es/plugins/voice-call); no puede llamar directamente a una URL de Meet.
- `mode: "agent"` (predeterminado) transcribe la voz de los participantes con un proveedor en tiempo real, la enruta al agente de OpenClaw configurado y reproduce la respuesta con el TTS normal de OpenClaw. `mode: "bidi"` permite que un modelo de voz en tiempo real responda directamente. `mode: "transcribe"` se une solo para observar, sin respuesta hablada.
- No hay anuncio automático de consentimiento cuando el Plugin se une a una llamada.
- El comando de CLI es `googlemeet`; `meet` está reservado para flujos de teleconferencia de agentes más amplios.

## Inicio rápido

Instala las dependencias locales de audio y luego define una clave de proveedor en tiempo real. OpenAI es el proveedor de transcripción predeterminado para el modo `agent`; Google Gemini Live está disponible como proveedor de voz para el modo `bidi`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
export GEMINI_API_KEY=...
```

`blackhole-2ch` instala el dispositivo de audio virtual `BlackHole 2ch` por el que Chrome enruta el audio. El instalador de Homebrew requiere reiniciar antes de que macOS exponga el dispositivo:

```bash
sudo reboot
```

Después de reiniciar, verifica ambas piezas:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Habilita el Plugin:

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

Comprueba la configuración y luego únete:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

La salida de `setup` es legible por agentes y consciente del modo/transporte: informa el perfil de Chrome, la fijación de nodo y, para uniones de Chrome en tiempo real, el puente de audio BlackHole/SoX y la comprobación de introducción retrasada. Las uniones solo de observación omiten los requisitos previos en tiempo real:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Cuando la delegación de Twilio está configurada, `setup` también informa si `voice-call`, las credenciales de Twilio y la exposición pública del Webhook están listos. Trata cualquier comprobación `ok: false` como un bloqueo para ese transporte/modo antes de que un agente se una. Usa `--json` para obtener salida legible por máquina y `--transport chrome|chrome-node|twilio` para comprobar previamente un transporte específico con antelación:

```bash
openclaw googlemeet setup --transport twilio
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

En hosts de Gateway que no sean macOS, `google_meet` sigue visible para acciones de artefactos, calendario, configuración, transcripción, Twilio y `chrome-node`, pero la respuesta hablada de Chrome local (`transport: "chrome"` con `mode: "agent"` o `"bidi"`) se bloquea antes de llegar al puente de audio, porque esa ruta actualmente depende de `BlackHole 2ch` en macOS. Usa `mode: "transcribe"`, llamada entrante de Twilio o un host `chrome-node` en macOS.

### Crear una reunión

```bash
openclaw googlemeet create --transport chrome-node --mode agent
openclaw googlemeet create --no-join
```

`create` tiene dos rutas, informadas en el campo `source` del resultado:

- **`api`**: se usa cuando las credenciales de OAuth de Google Meet están configuradas. Es determinista; no depende del estado de la interfaz del navegador.
- **`browser`**: se usa sin credenciales de OAuth. OpenClaw abre `https://meet.google.com/new` en el nodo de Chrome fijado y espera a que Google redirija a una URL real con código de reunión; el perfil de Chrome de OpenClaw en ese nodo ya debe tener sesión iniciada en Google. Tanto unirse como crear reutilizan una pestaña de Meet existente (o una pestaña `.../new` / de solicitud de cuenta de Google en curso) antes de abrir una nueva; la coincidencia de pestañas ignora cadenas de consulta inofensivas como `authuser`.

`create` se une de forma predeterminada y devuelve `joined: true` más la sesión de unión. Pasa `--no-join` (CLI) o `"join": false` (herramienta) para generar solo la URL.

Para salas creadas por API, define una política de acceso explícita en lugar de heredar el valor predeterminado de la cuenta de Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

| `--access-type` | Quién puede unirse sin pedir acceso                                      |
| --------------- | ------------------------------------------------------------------------ |
| `OPEN`          | Cualquiera con la URL de Meet                                            |
| `TRUSTED`       | Usuarios de confianza de la organización anfitriona, usuarios externos invitados y usuarios de llamada entrante |
| `RESTRICTED`    | Solo invitados                                                           |

Esto solo se aplica a salas creadas por API, por lo que OAuth debe estar configurado. Si te autenticaste antes de que existiera esta opción, vuelve a ejecutar `openclaw googlemeet auth login --json` después de agregar el alcance `meetings.space.settings` a tu pantalla de consentimiento de OAuth.

Si la alternativa con navegador encuentra un bloqueo de inicio de sesión de Google o de permisos de Meet, la herramienta devuelve `manualActionRequired: true` con `manualActionReason`, `manualActionMessage` y `browser.nodeId`/`browser.targetId`/`browserUrl`. Informa ese mensaje y deja de abrir nuevas pestañas de Meet hasta que el operador termine el paso en el navegador.

### Unión solo de observación

Define `"mode": "transcribe"` para omitir el puente dúplex en tiempo real (sin requisito de BlackHole/SoX, sin respuesta hablada). Las uniones de Chrome en modo de transcripción también omiten la concesión de permisos de micrófono/cámara de OpenClaw y la ruta **Usar micrófono** de Meet; si Meet muestra la pantalla intermedia de elección de audio, la automatización intenta primero **Continuar sin micrófono**. Los transportes de Chrome administrados en este modo instalan un observador de subtítulos de Meet de mejor esfuerzo. `googlemeet status --json` y `googlemeet doctor` informan `captioning`, `captionsEnabledAttempted`, `transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText` y una cola `recentTranscript`.

Para una prueba de escucha sí/no:

```bash
openclaw googlemeet test-listen <meet-url> --transport chrome-node
```

Se une en modo de transcripción, espera movimiento nuevo de subtítulos/transcripción y devuelve `listenVerified`, `listenTimedOut`, campos de acción manual y el estado actual de subtítulos.

### Estado de la sesión en tiempo real

Durante sesiones con respuesta hablada, el estado de `google_meet` informa la salud de Chrome y del puente de audio: `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, últimas marcas de tiempo de entrada/salida, contadores de bytes y estado de puente cerrado. Las sesiones de Chrome administradas solo dicen la frase de introducción/prueba después de que el estado informa `inCall: true`; de lo contrario, `speechReady: false` y el intento de voz se bloquea en lugar de no hacer nada silenciosamente.

Las uniones de Chrome local pasan por el perfil de navegador de OpenClaw con sesión iniciada y necesitan `BlackHole 2ch` para la ruta de micrófono/altavoz. Un solo dispositivo BlackHole es suficiente para una primera prueba de humo, pero puede producir eco; usa dispositivos virtuales separados o un grafo estilo Loopback para audio dúplex limpio.

## Gateway local + Chrome en Parallels

No se requiere un Gateway completo ni una clave de API de modelo dentro de una VM de macOS solo para darle Chrome. Ejecuta el Gateway y el agente localmente; ejecuta un host de nodo en la VM.

| Se ejecuta dónde     | Qué                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| Host de Gateway      | Gateway de OpenClaw, espacio de trabajo del agente, claves de modelo/API, proveedor en tiempo real, configuración del Plugin de Google Meet |
| VM de macOS en Parallels | CLI/host de nodo de OpenClaw, Chrome, SoX, BlackHole 2ch, un perfil de Chrome con sesión iniciada en Google |
| No necesario en la VM | Servicio de Gateway, configuración del agente, configuración del proveedor de modelo            |

Instala las dependencias de la VM, reinicia y verifica:

```bash
brew install blackhole-2ch sox
sudo reboot
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Habilita el Plugin en la VM e inicia el host de nodo:

```bash
openclaw plugins enable google-meet
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Si `<gateway-host>` es una IP de LAN sin TLS, acepta explícitamente esa red privada de confianza:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Usa la misma marca al instalar como LaunchAgent (es entorno de proceso, almacenado en el entorno de LaunchAgent cuando está presente en el comando de instalación, no una configuración de `openclaw.json`):

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

Aprueba el nodo desde el host de Gateway y luego confirma que anuncia tanto `googlemeet.chrome` como la capacidad de navegador/`browser.proxy`:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Enruta Meet a través de ese nodo:

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

Para una prueba de humo de un solo comando que crea o reutiliza una sesión, dice una frase conocida e imprime la salud de la sesión:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Durante la unión en tiempo real, la automatización del navegador rellena el nombre de invitado, hace clic en Unirse/Solicitar unirse y acepta la solicitud inicial de Meet de "Usar micrófono" cuando aparece (o "Continuar sin micrófono" durante una unión solo de observación y la creación de reuniones solo con navegador). Si el perfil tiene la sesión cerrada, Meet espera la admisión del anfitrión, Chrome necesita permiso de micrófono/cámara o Meet está atascado en una solicitud sin resolver, el resultado informa `manualActionRequired: true` con `manualActionReason` y `manualActionMessage`. Deja de reintentar, informa ese mensaje junto con `browserUrl`/`browserTitle` y reintenta solo después de que se complete la acción manual.

Si se omite `chromeNode.node`, OpenClaw selecciona automáticamente solo cuando exactamente un nodo conectado anuncia tanto `googlemeet.chrome` como control de navegador; fija `chromeNode.node` (id de nodo, nombre para mostrar o IP remota) cuando haya varios nodos compatibles conectados.

### Comprobaciones de fallos comunes

| Síntoma                                                  | Corrección                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Configured Google Meet node ... is not usable: offline` | El nodo fijado se conoce, pero no está disponible. Informa del bloqueo de configuración; no cambies silenciosamente a otro transporte salvo que se te pida.                                                                                                                                    |
| `No connected Google Meet-capable node`                  | Ejecuta `openclaw node run` en la VM, aprueba el emparejamiento y ejecuta `openclaw plugins enable google-meet` y `openclaw plugins enable browser` allí. Confirma que `gateway.nodes.allowCommands` incluya `googlemeet.chrome` y `browser.proxy`.                              |
| `BlackHole 2ch audio device not found`                   | Instala `blackhole-2ch` en el host que se está comprobando y reinicia.                                                                                                                                                                                                       |
| `BlackHole 2ch audio device not found on the node`       | Instala `blackhole-2ch` en la VM y reinicia la VM.                                                                                                                                                                                                                |
| Chrome se abre, pero no puede unirse                             | Inicia sesión en el perfil del navegador en la VM, o mantén `chrome.guestName` configurado. La unión automática como invitado usa la automatización de navegador de OpenClaw mediante el proxy de navegador del nodo; apunta `browser.defaultProfile` del nodo (o un perfil de sesión existente con nombre) al perfil que quieras. |
| Pestañas de Meet duplicadas                                      | Deja `chrome.reuseExistingTab: true`. OpenClaw activa una pestaña existente para la misma URL, y la creación reutiliza una pestaña `.../new` en curso o una pestaña de solicitud de cuenta de Google antes de abrir otra.                                                                      |
| Sin audio                                                 | Enruta el micrófono/altavoz de Meet por la ruta de audio virtual usada por OpenClaw; usa dispositivos virtuales separados o enrutamiento de estilo Loopback para audio dúplex limpio.                                                                                                              |

## Notas de instalación

El valor predeterminado de retorno de voz de Chrome usa dos herramientas externas que OpenClaw no incluye ni redistribuye; instálalas como dependencias del host mediante Homebrew:

- `sox`: utilidad de audio de línea de comandos. El plugin emite comandos explícitos de dispositivo CoreAudio para el puente de audio PCM16 predeterminado de 24 kHz.
- `blackhole-2ch`: controlador de audio virtual de macOS que proporciona el dispositivo `BlackHole 2ch` por el que Chrome/Meet enruta.

SoX tiene licencia `LGPL-2.0-only AND GPL-2.0-only`; BlackHole es GPL-3.0. Si compilas un instalador o dispositivo que incluya BlackHole con OpenClaw, revisa la licencia upstream de BlackHole u obtén una licencia separada de Existential Audio.

## Transportes

| Transporte     | Usar cuando                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `chrome`      | Chrome/audio se ejecutan en el host del Gateway                                                        |
| `chrome-node` | Chrome/audio se ejecutan en un nodo emparejado (por ejemplo, una VM macOS de Parallels)                        |
| `twilio`      | Reserva de marcado telefónico mediante el plugin Voice Call, cuando la participación por Chrome no está disponible |

### Chrome

Abre la URL de Meet mediante el control de navegador de OpenClaw y se une como el perfil de navegador de OpenClaw con sesión iniciada. En macOS, el plugin comprueba `BlackHole 2ch` antes del lanzamiento y, si está configurado, ejecuta un comando de estado/inicio del puente de audio antes de abrir Chrome. Para Chrome local, elige el perfil con `browser.defaultProfile`; `chrome.browserProfile` se pasa en su lugar a los hosts `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

El audio de micrófono/altavoz de Chrome se enruta por el puente de audio local de OpenClaw. Si `BlackHole 2ch` no está instalado, la unión falla con un error de configuración en lugar de unirse sin una ruta de audio.

### Twilio

Un plan de marcado estricto delegado al [plugin Voice Call](/es/plugins/voice-call). No analiza páginas de Meet para buscar números de teléfono; Google Meet debe exponer un número de marcado telefónico y PIN para la reunión.

Habilita Voice Call en el host del Gateway, no en el nodo Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
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
          inboundPolicy: "allowlist",
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Join this Google Meet as an OpenClaw agent. Be brief.",
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

Proporciona las credenciales de Twilio mediante el entorno para mantener los secretos fuera de `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

Usa `realtime.provider: "openai"` con `OPENAI_API_KEY` en su lugar si OpenAI es el proveedor de voz en tiempo real.

Reinicia o recarga el Gateway después de habilitar `voice-call`; los cambios de configuración del plugin no surten efecto hasta la recarga. Verifica:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Cuando la delegación de Twilio está conectada, `googlemeet setup` incluye comprobaciones de `twilio-voice-call-plugin`, `twilio-voice-call-credentials` y `twilio-voice-call-webhook`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Usa `--dtmf-sequence` para una secuencia personalizada, con `w` inicial o comas para una pausa antes del PIN:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth y comprobación previa

OAuth es opcional para crear un enlace de Meet, porque `googlemeet create` puede recurrir a la automatización del navegador. Configura OAuth para la creación con la API oficial, la resolución de espacios o la comprobación previa de la API Meet Media. Las uniones por Chrome/Chrome-node nunca dependen de OAuth; usan un perfil de Chrome con sesión iniciada, BlackHole/SoX y (para `chrome-node`) un nodo conectado de cualquier modo.

### Crear credenciales de Google

En Google Cloud Console:

<Steps>
<Step title="Crear o seleccionar un proyecto">
</Step>
<Step title="Habilitar la API REST de Google Meet">
</Step>
<Step title="Configurar la pantalla de consentimiento de OAuth">
Interna es la opción más sencilla para una organización de Google Workspace. Externa funciona para configuraciones personales/de prueba; mientras la app esté en Prueba, añade como usuario de prueba cada cuenta de Google que vaya a autorizarla.
</Step>
<Step title="Añadir los alcances solicitados">
- `https://www.googleapis.com/auth/meetings.space.created`
- `https://www.googleapis.com/auth/meetings.space.readonly`
- `https://www.googleapis.com/auth/meetings.space.settings`
- `https://www.googleapis.com/auth/meetings.conference.media.readonly`
- `https://www.googleapis.com/auth/calendar.events.readonly` (búsqueda en Calendar)
- `https://www.googleapis.com/auth/drive.meet.readonly` (exportación del cuerpo de documentos de transcripción/notas inteligentes)

</Step>
<Step title="Crear un ID de cliente OAuth">
Tipo de aplicación **Aplicación web**. URI de redirección autorizada:

```text
http://localhost:8085/oauth2callback
```

</Step>
<Step title="Copiar el ID de cliente y el secreto de cliente">
</Step>
</Steps>

`meetings.space.created` es obligatorio para `spaces.create`. `meetings.space.readonly` resuelve URL/códigos de Meet a espacios. `meetings.space.settings` permite que OpenClaw pase ajustes de `SpaceConfig`, como `accessType`, durante la creación de salas mediante la API. `meetings.conference.media.readonly` es para la comprobación previa de la API Meet Media y el trabajo multimedia; Google puede requerir inscripción en Developer Preview para el uso real de la API Media. `calendar.events.readonly` solo se necesita para la búsqueda de calendario con `--today`/`--event`. `drive.meet.readonly` solo se necesita para la exportación con `--include-doc-bodies`. Si solo necesitas uniones de Chrome basadas en navegador, omite OAuth por completo.

### Emitir el token de actualización

Configura `oauth.clientId` y, opcionalmente, `oauth.clientSecret` (o pásalos como variables de entorno), luego ejecuta:

```bash
openclaw googlemeet auth login --json
```

Esto ejecuta un flujo PKCE con una devolución de llamada localhost en `http://localhost:8085/oauth2callback` e imprime un bloque de configuración `oauth` con un token de actualización. Añade `--manual` para un flujo de copiar/pegar cuando el navegador no pueda alcanzar la devolución de llamada local:

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

Guarda el objeto `oauth` bajo la configuración del plugin:

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

Prefiere variables de entorno cuando no quieras el token de actualización en la configuración; la configuración se resuelve primero y luego se usa el entorno como reserva. Si te autenticaste antes de que existiera la compatibilidad con creación de reuniones, búsqueda de calendario o exportación de cuerpos de documentos, vuelve a ejecutar `openclaw googlemeet auth login --json` para que el token de actualización cubra el conjunto de alcances actual.

### Verificar OAuth con doctor

```bash
openclaw googlemeet doctor --oauth --json
```

Esto comprueba que exista configuración de OAuth y que el token de actualización pueda emitir un token de acceso, sin cargar el runtime de Chrome ni requerir un nodo conectado. El informe incluye solo campos de estado (`ok`, `configured`, `tokenSource`, `expiresAt`, mensajes de comprobación) y nunca imprime el token de acceso, el token de actualización ni el secreto de cliente.

| Comprobación                | Significado                                                                          |
| -------------------- | -------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` más `oauth.refreshToken`, o un token de acceso en caché, está presente |
| `oauth-token`        | El token de acceso en caché sigue siendo válido, o el token de actualización emitió uno nuevo    |
| `meet-spaces-get`    | La comprobación opcional `--meeting` resolvió un espacio de Meet existente                       |
| `meet-spaces-create` | La comprobación opcional `--create-space` creó un nuevo espacio de Meet                         |

Demuestra la habilitación de la API de Meet y el alcance de `spaces.create` con la comprobación de creación con efectos secundarios:

```bash
openclaw googlemeet doctor --oauth --create-space --json
```

Demuestra el acceso de lectura a un espacio existente:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Un `403` de estas comprobaciones normalmente significa que la API REST de Meet está deshabilitada, que al token de actualización le falta el alcance requerido o que la cuenta de Google no puede acceder a ese espacio. Un error de token de actualización significa que debes volver a ejecutar `openclaw googlemeet auth login --json` y guardar el nuevo bloque `oauth`.

No se necesita OAuth para el fallback del navegador; la autenticación de Google allí proviene del perfil de Chrome con sesión iniciada en el nodo seleccionado, no de la configuración de OpenClaw.

Estas variables de entorno se aceptan como fallbacks:

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

Con `--meeting`, `artifacts` y `attendance` usan de forma predeterminada el registro de conferencia más reciente; pasa `--all-conference-records` para cada registro conservado.

La búsqueda en Calendar resuelve la URL de la reunión desde Google Calendar antes de leer artefactos (requiere un token de actualización que incluya el alcance de solo lectura de eventos de Calendar):

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` busca en el calendario `primary` de hoy un evento con un enlace de Meet; `--event <query>` busca texto de evento coincidente; `--calendar <id>` apunta a un calendario no principal. `calendar-events` previsualiza eventos coincidentes y marca cuál elegirán `latest`/`artifacts`/`attendance`/`export`.

Si ya conoces el id del registro de conferencia, dirígete a él directamente:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Cierra la sala para un espacio creado por API:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Llama a `spaces.endActiveConference` y requiere OAuth con el alcance `meetings.space.created` para un espacio que la cuenta autorizada pueda administrar. Acepta una URL de Meet, un código de reunión o `spaces/{id}` y primero lo resuelve al recurso de espacio de la API. Esto es independiente de `googlemeet leave`: `leave` detiene la participación local/de sesión de OpenClaw; `end-active-conference` pide a Google Meet que finalice la conferencia activa del espacio.

Escribe un informe legible:

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

`artifacts` devuelve metadatos del registro de conferencia además de metadatos de recursos de participantes, grabaciones, transcripciones, entradas de transcripción estructuradas y notas inteligentes cuando Google los expone. `--no-transcript-entries` omite la búsqueda de entradas para reuniones grandes. `attendance` expande participantes en filas de sesión de participante con horas de primera/última aparición, duración total de la sesión, indicadores de llegada tarde/salida anticipada y recursos de participante duplicados fusionados por usuario con sesión iniciada o nombre mostrado; `--no-merge-duplicates` mantiene separados los recursos sin procesar, `--late-after-minutes`/`--early-before-minutes` ajustan los umbrales.

`export` escribe una carpeta con `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` y `manifest.json`. `manifest.json` registra la entrada elegida, las opciones de exportación, los registros de conferencia, los archivos de salida, los recuentos, el origen del token, cualquier evento de Calendar usado y las advertencias de recuperación parcial. `--zip` también escribe un archivo portable junto a la carpeta. `--include-doc-bodies` exporta el texto de Google Docs de transcripciones/notas inteligentes enlazadas mediante Drive `files.export` (requiere el alcance de solo lectura de Drive Meet); sin él, las exportaciones incluyen solo metadatos de Meet y entradas de transcripción estructuradas. Un fallo parcial de artefacto (error al listar notas inteligentes, entrada de transcripción o cuerpo de documento) conserva la advertencia en el resumen/manifiesto en lugar de hacer fallar toda la exportación. `--dry-run` obtiene los mismos datos e imprime el JSON del manifiesto sin crear la carpeta ni el ZIP.

Los agentes usan las mismas acciones mediante la herramienta `google_meet` (`export`, `create` con `accessType`, `end_active_conference`, `test_listen`); consulta [Herramienta](#tool).

### Prueba de humo en vivo

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

| Variable                                                                                                                  | Propósito                                                              |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `OPENCLAW_LIVE_TEST=1`                                                                                                    | Habilita pruebas en vivo protegidas                                    |
| `OPENCLAW_GOOGLE_MEET_LIVE_MEETING`                                                                                       | URL de Meet conservada, código o `spaces/{id}`                         |
| `OPENCLAW_GOOGLE_MEET_CLIENT_ID` / `GOOGLE_MEET_CLIENT_ID`                                                                | id de cliente OAuth                                                    |
| `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` / `GOOGLE_MEET_REFRESH_TOKEN`                                                        | Token de actualización                                                 |
| `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` | Opcional; también funcionan los mismos nombres de fallback sin el prefijo `OPENCLAW_` |

La prueba de humo base de artefactos/asistencia necesita `meetings.space.readonly` y `meetings.conference.media.readonly`. La búsqueda en Calendar necesita `calendar.events.readonly`. La exportación del cuerpo de documento de Drive necesita `drive.meet.readonly`.

### Ejemplos de creación

```bash
openclaw googlemeet create
```

Imprime el URI de la nueva reunión, el origen y la sesión de unión. Con OAuth usa la API de Meet; sin él, el perfil con sesión iniciada del nodo de Chrome fijado. JSON del fallback del navegador:

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

Si el fallback del navegador encuentra primero el inicio de sesión de Google o un bloqueo de permisos de Meet, `google_meet` devuelve detalles estructurados en lugar de una cadena simple:

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

JSON de creación por API:

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

La creación se une de forma predeterminada, pero Chrome/Chrome-node todavía necesita un perfil de Google con sesión iniciada para unirse mediante el navegador; si la sesión está cerrada, OpenClaw informa `manualActionRequired: true` o un error de fallback del navegador y pide al operador que complete el inicio de sesión de Google antes de reintentarlo.

Configura `preview.enrollmentAcknowledged: true` solo después de confirmar que tu proyecto de Cloud, el principal de OAuth y los participantes de la reunión están inscritos en el programa Google Workspace Developer Preview Program para las API de medios de Meet.

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

| Clave                             | Predeterminado                           | Notas                                                                                                                                                                                                                 |
| --------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultTransport`                | `"chrome"`                               |                                                                                                                                                                                                                       |
| `defaultMode`                     | `"agent"`                                | `"realtime"` se acepta como alias heredado de `"agent"`; los nuevos llamadores deben usar `"agent"`                                                                                                                    |
| `chromeNode.node`                 | sin establecer                           | Id/nombre/IP de Node para `chrome-node`; requerido cuando puede haber más de un nodo compatible conectado                                                                                                             |
| `chrome.launch`                   | `true`                                   | Inicia Chrome para unirse; establece `false` solo al reutilizar una sesión ya abierta                                                                                                                                  |
| `chrome.audioBackend`             | `"blackhole-2ch"`                        |                                                                                                                                                                                                                       |
| `chrome.guestName`                | `"OpenClaw Agent"`                       | Se muestra en la pantalla de invitado de Meet sin sesión iniciada                                                                                                                                                     |
| `chrome.autoJoin`                 | `true`                                   | Relleno de nombre de invitado y clic en Unirse ahora en `chrome-node` con el mayor esfuerzo posible                                                                                                                   |
| `chrome.reuseExistingTab`         | `true`                                   | Activa una pestaña existente de Meet en lugar de abrir duplicados                                                                                                                                                      |
| `chrome.waitForInCallMs`          | `20000`                                  | Espera a que la pestaña de Meet informe que está en llamada antes de disparar la introducción de respuesta hablada                                                                                                    |
| `chrome.audioFormat`              | `"pcm16-24khz"`                          | Formato de audio del par de comandos; `"g711-ulaw-8khz"` es solo para pares de comandos heredados/personalizados que emiten audio telefónico                                                                          |
| `chrome.audioBufferBytes`         | `4096`                                   | Búfer de procesamiento de SoX para comandos de audio generados del par de comandos (la mitad del búfer predeterminado de 8192 bytes de SoX, lo que reduce la latencia de tubería); los valores se limitan a un mínimo de 17 bytes |
| `chrome.audioInputCommand`        | comando SoX generado                     | Lee desde CoreAudio `BlackHole 2ch`, escribe audio en `chrome.audioFormat`                                                                                                                                            |
| `chrome.audioOutputCommand`       | comando SoX generado                     | Lee audio en `chrome.audioFormat`, escribe en CoreAudio `BlackHole 2ch`                                                                                                                                               |
| `chrome.bargeInInputCommand`      | sin establecer                           | Comando opcional de micrófono local que escribe PCM mono little-endian firmado de 16 bits para detectar interrupciones humanas durante la reproducción del asistente; se aplica al puente de par de comandos alojado en Gateway |
| `chrome.bargeInRmsThreshold`      | `650`                                    | Nivel RMS contado como interrupción humana                                                                                                                                                                            |
| `chrome.bargeInPeakThreshold`     | `2500`                                   | Nivel pico contado como interrupción humana                                                                                                                                                                           |
| `chrome.bargeInCooldownMs`        | `900`                                    | Retraso mínimo entre limpiezas de interrupción repetidas                                                                                                                                                              |
| `mode` (por solicitud)            | `"agent"`                                | Modo de respuesta hablada; consulta la tabla [Modos agent y bidi](#agent-and-bidi-modes)                                                                                                                             |
| `realtime.provider`               | `"openai"`                               | Fallback de compatibilidad usado cuando los campos con ámbito de abajo no están establecidos                                                                                                                          |
| `realtime.transcriptionProvider`  | `"openai"`                               | Id de proveedor usado por el modo `agent` para transcripción en tiempo real                                                                                                                                           |
| `realtime.voiceProvider`          | sin establecer                           | Id de proveedor usado por el modo `bidi` para voz directa en tiempo real; establécelo en `"google"` para Gemini Live mientras mantienes la transcripción en modo agent en OpenAI. Combínalo con `realtime.model` para elegir el modelo específico de Gemini Live. |
| `realtime.toolPolicy`             | `"safe-read-only"`                       | Consulta [Modos agent y bidi](#agent-and-bidi-modes)                                                                                                                                                                  |
| `realtime.instructions`           | instrucciones breves de respuesta hablada | Indica al modelo que hable brevemente y use `openclaw_agent_consult` para respuestas más profundas                                                                                                                    |
| `realtime.introMessage`           | `"Say exactly: I'm here and listening."` | Se pronuncia una vez cuando se conecta el puente realtime; establécelo en `""` para unirse en silencio                                                                                                                |
| `realtime.agentId`                | `"main"`                                 | Id de agente de OpenClaw usado para `openclaw_agent_consult`                                                                                                                                                          |
| `voiceCall.enabled`               | `true`                                   | Delega la llamada PSTN de Twilio, DTMF y el saludo de introducción al Plugin Voice Call                                                                                                                               |
| `voiceCall.dtmfDelayMs`           | `12000`                                  | Espera inicial antes de reproducir una secuencia DTMF derivada de PIN por Twilio                                                                                                                                       |
| `voiceCall.postDtmfSpeechDelayMs` | `5000`                                   | Retraso antes de solicitar el saludo de introducción realtime después de que Voice Call inicia el tramo de Twilio                                                                                                     |

`chrome.audioBridgeCommand` y `chrome.audioBridgeHealthCommand` permiten que un puente externo sea dueño de toda la ruta de audio local en lugar de `chrome.audioInputCommand`/`chrome.audioOutputCommand`; consulta [Notas](#notes) para la restricción sobre qué modo puede usarlos.

Existe una migración `openclaw doctor --fix` para la forma heredada `realtime.provider: "google"`: mueve esa intención a `realtime.voiceProvider: "google"` más `realtime.transcriptionProvider: "openai"` cuando esos campos aún no están establecidos.

### Sobrescrituras opcionales

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
    model: "gemini-2.5-flash-native-audio-preview-12-2025",
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

ElevenLabs para escuchar y hablar en modo agent:

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

La voz persistente de Meet viene de `messages.tts.providers.elevenlabs.speakerVoiceId`. Las respuestas del agente también pueden usar directivas por respuesta `[[tts:speakerVoiceId=... model=eleven_v3]]` cuando las sobrescrituras del modelo TTS están habilitadas, pero la configuración es el valor predeterminado determinista para reuniones. Al unirse, los registros muestran `transcriptionProvider=elevenlabs`, y cada respuesta hablada registra `provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>`.

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

Con `voiceCall.enabled: true` (el valor predeterminado) y transporte Twilio, Voice Call coloca la secuencia DTMF antes de abrir el flujo multimedia realtime y luego usa el texto de introducción guardado como saludo realtime inicial. Si `voice-call` no está habilitado, Google Meet aún puede validar y registrar el plan de marcado, pero no puede realizar la llamada de Twilio.

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

| `action`                | Propósito                                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------- |
| `join`                  | Unirse a una URL explícita de Meet                                                                        |
| `create`                | Crear un espacio (y unirse de forma predeterminada); admite `accessType`/`entryPointAccess`               |
| `status`                | Listar sesiones activas, o inspeccionar una por `sessionId`                                               |
| `setup_status`          | Ejecutar las mismas comprobaciones que `googlemeet setup`                                                 |
| `resolve_space`         | Resolver una URL/código/`spaces/{id}` mediante `spaces.get`                                               |
| `preflight`             | Validar OAuth y los prerrequisitos de resolución de la reunión                                            |
| `latest`                | Encontrar el registro de conferencia más reciente para una reunión                                        |
| `calendar_events`       | Previsualizar eventos de Calendar con enlaces de Meet                                                     |
| `artifacts`             | Listar registros de conferencia y metadatos de participantes/grabaciones/transcripciones/notas inteligentes |
| `attendance`            | Listar participantes y sesiones de participantes                                                          |
| `export`                | Escribir el paquete de artefactos/asistencia/transcripción/manifiesto; establece `"dryRun": true` solo para el manifiesto |
| `recover_current_tab`   | Enfocar/inspeccionar una pestaña de Meet existente sin abrir una nueva                                    |
| `leave`                 | Finalizar una sesión (cuelga la llamada subyacente de Twilio para sesiones delegadas)                     |
| `end_active_conference` | Finalizar la conferencia activa de Google Meet para un espacio gestionado por la API                      |
| `speak`                 | Hacer que el agente en tiempo real hable inmediatamente, dados `sessionId` y `message`                    |
| `test_speech`           | Crear/reutilizar una sesión, activar una frase conocida, devolver el estado de Chrome                     |
| `test_listen`           | Crear/reutilizar una sesión solo de observación, esperar movimiento en subtítulos/transcripción           |

`test_speech` siempre fuerza `mode: "agent"` o `"bidi"` y falla si se le pide ejecutarse en `mode: "transcribe"`, porque las sesiones solo de observación no pueden emitir voz. Su resultado `speechOutputVerified` se basa en que los bytes de salida de audio en tiempo real aumenten durante esa llamada, por lo que una sesión reutilizada con audio anterior no cuenta como una comprobación nueva.

Usa `transport: "chrome"` cuando Chrome se ejecuta en el host del Gateway, y `transport: "chrome-node"` cuando se ejecuta en un nodo emparejado. En ambos casos, los proveedores de modelos y `openclaw_agent_consult` se ejecutan en el host del Gateway, por lo que las credenciales del modelo permanecen allí. Los registros en modo agente incluyen el proveedor/modelo de transcripción resuelto al iniciar el puente y el proveedor/modelo/voz/formato de salida/frecuencia de muestreo de TTS después de cada respuesta sintetizada. El `mode: "realtime"` sin procesar todavía se acepta como alias de compatibilidad heredado para `mode: "agent"`, pero ya no se anuncia en el enum `mode` de la herramienta.

`create` con una sala respaldada por API y una política de acceso explícita:

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

Validación de escucha primero antes de afirmar que una reunión es útil:

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
  "message": "Say exactly: I'm here and listening."
}
```

`status` incluye el estado de Chrome cuando está disponible:

| Campo                                                                 | Significado                                                                                                           |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `inCall`                                                              | Chrome parece estar dentro de la llamada de Meet                                                                      |
| `micMuted`                                                            | Estado aproximado del micrófono de Meet                                                                               |
| `manualActionRequired` / `manualActionReason` / `manualActionMessage` | El perfil del navegador necesita inicio de sesión manual, admisión del anfitrión de Meet, permisos o reparación del control del navegador antes de que la voz pueda funcionar |
| `speechReady` / `speechBlockedReason` / `speechBlockedMessage`        | Si la voz gestionada de Chrome está permitida ahora; `speechReady: false` significa que OpenClaw no envió la frase de introducción/prueba |
| `providerConnected` / `realtimeReady`                                 | Estado del puente de voz en tiempo real                                                                               |
| `lastInputAt` / `lastOutputAt`                                        | Último audio visto desde/enviado al puente                                                                            |
| `audioOutputRouted` / `audioOutputDeviceLabel`                        | Si la salida multimedia de la pestaña de Meet se enrutó activamente al dispositivo BlackHole del puente               |
| `lastSuppressedInputAt` / `suppressedInputBytes`                      | Entrada de local loopback ignorada mientras la reproducción del asistente está activa                                 |

## Modos agente y bidi

| Modo    | Quién decide la respuesta       | Ruta de salida de voz                       | Úsalo cuando                                                       |
| ------- | ------------------------------- | ------------------------------------------- | ------------------------------------------------------------------ |
| `agent` | El agente OpenClaw configurado  | Runtime normal de TTS de OpenClaw           | Quieres el comportamiento de "mi agente está en la reunión"        |
| `bidi`  | El modelo de voz en tiempo real | Respuesta de audio del proveedor de voz en tiempo real | Quieres el bucle de voz conversacional de menor latencia |

Modo `agent`: el proveedor de transcripción en tiempo real escucha el audio de la reunión, las transcripciones finales de participantes se enrutan por el agente OpenClaw configurado y la respuesta se pronuncia mediante el TTS normal de OpenClaw. Los fragmentos cercanos de transcripción final se fusionan antes de la consulta para que un turno hablado no produzca varias respuestas parciales obsoletas; la entrada en tiempo real se suprime mientras el audio del asistente en cola aún se reproduce, y los ecos recientes de transcripción similares al asistente se ignoran antes de la consulta para que el local loopback de BlackHole no haga que el agente responda a su propia voz.

Modo `bidi`: el modelo de voz en tiempo real responde directamente y puede llamar a `openclaw_agent_consult` para razonamiento más profundo, información actual o herramientas normales de OpenClaw. La herramienta de consulta ejecuta el agente OpenClaw normal en segundo plano con contexto reciente de la transcripción de la reunión y devuelve una respuesta hablada concisa; en modo `agent`, OpenClaw envía esa respuesta directamente a TTS; en modo `bidi`, el modelo de voz en tiempo real puede pronunciarla. Usa la misma maquinaria de consulta compartida que Voice Call.

De forma predeterminada, las consultas se ejecutan contra el agente `main`; establece `realtime.agentId` para apuntar un carril de Meet a un espacio de trabajo de agente dedicado, valores predeterminados de modelo, política de herramientas, memoria e historial de sesión. Las consultas en modo agente usan una clave de sesión por reunión `agent:<id>:subagent:google-meet:<session>` para que las preguntas de seguimiento mantengan el contexto de la reunión mientras heredan la política normal del agente. Cuando un agente llama a `google_meet` en modo agente, la sesión consultora bifurca la transcripción actual del llamador antes de responder a la voz del participante; la sesión de Meet permanece separada para que los seguimientos de la reunión no muten directamente la transcripción del llamador.

`realtime.toolPolicy` controla la ejecución de la consulta:

| Política         | Comportamiento                                                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Expone la herramienta de consulta; limita el agente normal a `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, `memory_get` |
| `owner`          | Expone la herramienta de consulta; permite que el agente normal use su política de herramientas normal                           |
| `none`           | No expone la herramienta de consulta al modelo de voz en tiempo real                                                             |

La clave de sesión de consulta está acotada por sesión de Meet, por lo que las llamadas de consulta de seguimiento reutilizan el contexto de consulta anterior durante la misma reunión.

Forzar una comprobación de preparación hablada después de que Chrome se haya unido por completo:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Prueba rápida completa de unirse y hablar:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Lista de comprobación de prueba en vivo

Antes de entregar una reunión a un agente desatendido:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Estado esperado de Chrome-node:

- `googlemeet setup` está todo en verde e incluye `chrome-node-connected` cuando Chrome-node es el transporte predeterminado o hay un nodo fijado.
- `nodes status` muestra el nodo seleccionado conectado, anunciando tanto `googlemeet.chrome` como `browser.proxy`.
- La pestaña de Meet se une, y `test-speech` devuelve el estado de Chrome con `inCall: true`.

Para un host remoto de Chrome como una VM de macOS en Parallels, la comprobación segura más corta después de actualizar el Gateway o la VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Eso demuestra que el Plugin de Gateway está cargado, que el nodo de la VM está conectado con el token actual y que el puente de audio de Meet está disponible antes de que un agente abra una pestaña de reunión real.

Para una prueba rápida de Twilio, usa una reunión que exponga detalles de marcación telefónica:

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
- `openclaw logs --follow` muestra TwiML de DTMF servido antes de TwiML en tiempo real, luego un puente en tiempo real con el saludo inicial en cola.
- `googlemeet leave <sessionId>` cuelga la llamada de voz delegada.

## Solución de problemas

### El agente no puede ver la herramienta de Google Meet

Confirma que el Plugin está habilitado y recarga el Gateway; el agente en ejecución solo ve herramientas de Plugin registradas por el proceso actual del Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

En hosts de Gateway que no son macOS, `google_meet` permanece visible, pero las acciones locales de respuesta de Chrome se bloquean antes de llegar al puente de audio. Usa `mode: "transcribe"`, la marcación de Twilio o un host macOS `chrome-node` en lugar de la ruta predeterminada del agente local de Chrome.

### Ningún nodo compatible con Google Meet conectado

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

El nodo debe estar conectado y listar `googlemeet.chrome` además de `browser.proxy`; la configuración del Gateway debe permitir ambos:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Si `googlemeet setup` falla en `chrome-node-connected`, o el registro del Gateway informa `gateway token mismatch`, reinstala o reinicia el nodo con el token actual del Gateway:

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

### El navegador se abre, pero el agente no puede unirse

Ejecuta `googlemeet test-listen` para uniones solo de observación o `googlemeet test-speech` para uniones en tiempo real, luego inspecciona el estado de Chrome devuelto. Si cualquiera informa `manualActionRequired: true`, muestra `manualActionMessage` al operador y deja de reintentar hasta que se complete la acción del navegador.

Acciones manuales comunes: iniciar sesión en el perfil de Chrome; admitir al invitado desde la cuenta host de Meet; conceder permisos de micrófono/cámara a Chrome cuando aparezca el aviso nativo; cerrar o reparar un diálogo de permisos de Meet bloqueado.

No informes "not signed in" solo porque Meet pregunta "Do you want people to hear you in the meeting?"; ese es el intersticial de elección de audio de Meet. OpenClaw hace clic en **Use microphone** mediante automatización del navegador cuando está disponible y sigue esperando el estado real de la reunión; para el respaldo del navegador solo de creación, puede hacer clic en **Continue without microphone** en su lugar, ya que acuñar la URL no necesita la ruta de audio en tiempo real.

### Falla la creación de la reunión

`googlemeet create` usa la API de Meet `spaces.create` cuando OAuth está configurado; de lo contrario, usa el navegador del nodo Chrome fijado. Confirma:

- **Creación por API**: `oauth.clientId` y `oauth.refreshToken` (o variables de entorno `OPENCLAW_GOOGLE_MEET_*` coincidentes) están presentes, y el token de actualización se acuñó después de agregar soporte de creación; los tokens antiguos pueden carecer de `meetings.space.created`, así que vuelve a ejecutar `openclaw googlemeet auth login --json`.
- **Respaldo del navegador**: `defaultTransport: "chrome-node"` y `chromeNode.node` apuntan a un nodo conectado con `browser.proxy` y `googlemeet.chrome`; el perfil de Chrome de OpenClaw en ese nodo tiene la sesión iniciada y puede abrir `https://meet.google.com/new`.
- **Reintentos del respaldo del navegador**: reutiliza una pestaña existente `.../new` o de aviso de cuenta de Google antes de abrir una nueva; reintenta la llamada a la herramienta en lugar de abrir manualmente otra pestaña.
- **Acción manual**: si la herramienta devuelve `manualActionRequired: true`, usa `browser.nodeId`, `browser.targetId`, `browserUrl` y `manualActionMessage` para guiar al operador; no reintentes en bucle.
- **Intersticial de elección de audio**: si Meet muestra "Do you want people to hear you in the meeting?", deja la pestaña abierta. OpenClaw debería hacer clic en **Use microphone** o (solo creación) **Continue without microphone** y seguir esperando la URL generada; si no puede, el error debería mencionar `meet-audio-choice-required`, no `google-login-required`.

### El agente se une, pero no habla

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Usa `mode: "agent"` para la ruta STT -> agente de OpenClaw -> TTS, `mode: "bidi"` para el respaldo directo de voz en tiempo real. `mode: "transcribe"` inicia intencionalmente sin puente de respuesta. Para depuración solo de observación, ejecuta `openclaw googlemeet status --json <session-id>` después de que hablen los participantes y revisa `captioning`, `transcriptLines`, `lastCaptionText`. Si `inCall` es true pero `transcriptLines` permanece en `0`, es posible que los subtítulos de Meet estén deshabilitados, nadie haya hablado desde que se instaló el observador, la interfaz de Meet haya cambiado o los subtítulos en vivo no estén disponibles para el idioma o la cuenta de la reunión.

`googlemeet test-speech` siempre comprueba la ruta en tiempo real e informa si se observaron bytes de salida del puente para esa invocación. Si `speechOutputVerified` es false y `speechOutputTimedOut` es true, es posible que el proveedor en tiempo real haya aceptado el enunciado, pero OpenClaw no haya visto que nuevos bytes de salida lleguen al puente de audio de Chrome.

Verifica también: una clave de proveedor en tiempo real (`OPENAI_API_KEY` o `GEMINI_API_KEY`) está disponible en el host del Gateway; `BlackHole 2ch` es visible en el host de Chrome; `sox` existe allí; el micrófono/altavoz de Meet se enrutan a través de la ruta de audio virtual (`doctor` debería mostrar `meet output routed: yes` para uniones en tiempo real con Chrome local).

`googlemeet doctor [session-id]` imprime la sesión, el nodo, el estado en llamada, el motivo de acción manual, la conexión del proveedor en tiempo real, `realtimeReady`, la actividad de entrada/salida de audio, las últimas marcas de tiempo de audio, los contadores de bytes y la URL del navegador. Usa `googlemeet status [session-id] --json` para JSON sin procesar, y `googlemeet doctor --oauth` (agrega `--meeting` o `--create-space`) para verificar la actualización OAuth sin exponer tokens.

Si un agente agotó el tiempo de espera y una pestaña de Meet ya está abierta, inspecciónala sin abrir otra:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

La acción de herramienta equivalente es `recover_current_tab`: enfoca e inspecciona una pestaña de Meet existente para el transporte seleccionado (control del navegador local para `chrome`, el nodo configurado para `chrome-node`) sin abrir una nueva pestaña ni sesión, e informa el bloqueador actual (inicio de sesión, admisión, permisos, estado de elección de audio). El comando de CLI habla con el Gateway configurado, que debe estar en ejecución; `chrome-node` también requiere que el nodo esté conectado.

### Fallan las comprobaciones de configuración de Twilio

`twilio-voice-call-plugin` falla cuando `voice-call` no está permitido o no está habilitado: agrégalo a `plugins.allow`, habilita `plugins.entries.voice-call`, recarga el Gateway.

`twilio-voice-call-credentials` falla cuando al backend de Twilio le falta el SID de la cuenta, el token de autenticación o el número llamante:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` falla cuando `voice-call` no tiene exposición pública de Webhook, o `publicUrl` apunta a un espacio de red loopback/privado. No uses `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` ni `fd00::/8` como `publicUrl`; las devoluciones de llamada del operador no pueden alcanzarlas. Configura `plugins.entries.voice-call.config.publicUrl` con una URL pública, o configura una exposición de túnel/Tailscale:

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

Para desarrollo local, usa un túnel o exposición de Tailscale en lugar de una URL de host privado:

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

Reinicia o recarga el Gateway, luego:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` es solo de preparación de forma predeterminada. Haz un ensayo con un número específico:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Solo agrega `--yes` para realizar intencionalmente una llamada saliente en vivo:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### La llamada de Twilio empieza, pero nunca entra en la reunión

Confirma que el evento de Meet expone detalles de marcación telefónica, y pasa el número exacto de marcación más el PIN o una secuencia DTMF personalizada:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Usa `w` inicial o comas en `--dtmf-sequence` para una pausa antes del PIN.

Si la llamada se crea, pero la lista de participantes de Meet nunca muestra al participante de marcación:

- `openclaw googlemeet doctor <session-id>`: confirma el ID de llamada Twilio delegado, si DTMF se puso en cola y si se solicitó el saludo de introducción.
- `openclaw voicecall status --call-id <id>`: confirma que la llamada sigue activa.
- `openclaw voicecall tail`: confirma que los Webhooks de Twilio llegan al Gateway.
- `openclaw logs --follow`: busca la secuencia de Twilio Meet: Google Meet delega la unión, Voice Call almacena y sirve TwiML DTMF de preconexión, Voice Call sirve TwiML en tiempo real para la llamada de Twilio, luego Google Meet solicita discurso de introducción con `voicecall.speak`.
- Vuelve a ejecutar `openclaw googlemeet setup --transport twilio`; una comprobación de configuración en verde es obligatoria, pero no prueba que la secuencia del PIN de la reunión sea correcta.
- Confirma que el número de marcación pertenece a la misma invitación y región de Meet que el PIN.
- Aumenta `voiceCall.dtmfDelayMs` desde el valor predeterminado de 12 segundos si Meet responde lentamente o la transcripción de la llamada todavía muestra el aviso del PIN después de enviar el DTMF de preconexión.
- Si el participante se une, pero no escuchas el saludo, revisa `openclaw logs --follow` para ver la solicitud `voicecall.speak` posterior a DTMF y la reproducción TTS del flujo de medios o el respaldo `<Say>` de Twilio. Si la transcripción aún muestra "enter the meeting PIN", el tramo telefónico aún no se ha unido a la sala de Meet, por lo que los participantes no escucharán el habla.

Si los Webhooks no llegan, depura primero el Plugin Voice Call: el proveedor debe alcanzar `plugins.entries.voice-call.config.publicUrl` o el túnel configurado. Consulta [solución de problemas de llamadas de voz](/es/plugins/voice-call#troubleshooting).

## Notas

La API oficial de medios de Google Meet está orientada a la recepción, por lo que hablar en una llamada aún necesita una ruta de participante. Este Plugin mantiene visible ese límite: Chrome maneja la participación del navegador y el enrutamiento de audio local; Twilio maneja la participación por marcación telefónica.

Los modos de respuesta de Chrome necesitan `BlackHole 2ch` además de:

- `chrome.audioInputCommand` más `chrome.audioOutputCommand`: OpenClaw posee el puente y canaliza audio en `chrome.audioFormat` entre esos comandos y el proveedor seleccionado. El modo `agent` usa transcripción en tiempo real más TTS normal; el modo `bidi` usa el proveedor de voz en tiempo real. La ruta predeterminada es PCM16 de 24 kHz con `chrome.audioBufferBytes: 4096`; G.711 mu-law de 8 kHz sigue disponible para pares de comandos heredados.
- `chrome.audioBridgeCommand`: un comando de puente externo posee toda la ruta de audio local y debe salir después de iniciar o validar su daemon. Válido solo para `bidi`, porque el modo `agent` necesita acceso directo al par de comandos para TTS.

Con el puente de Chrome de par de comandos, `chrome.bargeInInputCommand` puede escuchar un micrófono local separado y borrar la reproducción del asistente cuando una persona empieza a hablar, manteniendo el habla humana por delante de la salida del asistente incluso mientras la entrada local loopback compartida de BlackHole se suprime temporalmente durante la reproducción del asistente. Al igual que `chrome.audioInputCommand`/`chrome.audioOutputCommand`, es un comando local configurado por el operador: usa una ruta de comando o lista de argumentos explícita y confiable, nunca un script de una ubicación no confiable.

Para audio dúplex limpio, enruta la salida de Meet y el micrófono de Meet a través de dispositivos virtuales separados o una gráfica de dispositivo virtual estilo Loopback; un único dispositivo BlackHole compartido puede devolver el eco de otros participantes a la llamada.

`googlemeet speak` activa el puente de audio de respuesta hablada activo para una sesión de Chrome; `googlemeet leave` lo detiene (y, en las sesiones de Twilio delegadas mediante Voice Call, cuelga la llamada subyacente). Usa `googlemeet end-active-conference` para cerrar también la conferencia activa de Google Meet de un espacio administrado por API.

## Relacionado

- [Plugin de llamada de voz](/es/plugins/voice-call)
- [Modo de conversación](/es/nodes/talk)
- [Creación de plugins](/es/plugins/building-plugins)
