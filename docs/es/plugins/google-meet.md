---
read_when:
    - Quieres que un agente de OpenClaw se una a una llamada de Google Meet
    - Estás configurando Chrome, un Node de Chrome o Twilio como transporte de Google Meet
summary: 'Plugin de Google Meet: unirse a URLs explícitas de Meet mediante Chrome o Twilio con valores predeterminados de voz en tiempo real'
title: Plugin de Google Meet
x-i18n:
    generated_at: "2026-04-24T09:51:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: f1673ac4adc9cf163194a340dd6e451d0e4d28bb62adeb126898298e62106d43
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet (Plugin)

Soporte de participante de Google Meet para OpenClaw.

El Plugin es explícito por diseño:

- Solo se une a una URL explícita de `https://meet.google.com/...`.
- La voz `realtime` es el modo predeterminado.
- La voz en tiempo real puede volver a llamar al agente completo de OpenClaw cuando se necesita razonamiento más profundo o herramientas.
- La autenticación comienza como Google OAuth personal o un perfil de Chrome que ya haya iniciado sesión.
- No hay anuncio automático de consentimiento.
- El backend de audio predeterminado de Chrome es `BlackHole 2ch`.
- Chrome puede ejecutarse localmente o en un host Node emparejado.
- Twilio acepta un número de acceso telefónico más una secuencia opcional de PIN o DTMF.
- El comando de la CLI es `googlemeet`; `meet` está reservado para flujos de teleconferencia de agentes más amplios.

## Inicio rápido

Instala las dependencias de audio locales y configura un proveedor de voz en tiempo real de backend. OpenAI es el predeterminado; Google Gemini Live también funciona con `realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` instala el dispositivo de audio virtual `BlackHole 2ch`. El instalador de Homebrew requiere un reinicio antes de que macOS exponga el dispositivo:

```bash
sudo reboot
```

Después de reiniciar, verifica ambas partes:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
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

Comprueba la configuración:

```bash
openclaw googlemeet setup
```

Únete a una reunión:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

O deja que un agente se una mediante la herramienta `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij"
}
```

Chrome se une como el perfil de Chrome con sesión iniciada. En Meet, elige `BlackHole 2ch` para la ruta de micrófono/altavoz usada por OpenClaw. Para un audio dúplex limpio, usa dispositivos virtuales separados o un grafo de estilo Loopback; un único dispositivo BlackHole es suficiente para una primera prueba rápida, pero puede generar eco.

### Gateway local + Chrome en Parallels

**No** necesitas un Gateway completo de OpenClaw ni una clave de API de modelo dentro de una VM de macOS solo para hacer que la VM sea la propietaria de Chrome. Ejecuta el Gateway y el agente localmente, y luego ejecuta un host Node en la VM. Habilita el Plugin incluido en la VM una vez para que el Node anuncie el comando de Chrome:

Qué se ejecuta en cada lugar:

- Host del Gateway: OpenClaw Gateway, espacio de trabajo del agente, claves de modelo/API, proveedor en tiempo real y la configuración del Plugin de Google Meet.
- VM macOS de Parallels: CLI/host Node de OpenClaw, Google Chrome, SoX, BlackHole 2ch y un perfil de Chrome con sesión iniciada en Google.
- No se necesita en la VM: servicio Gateway, configuración del agente, clave de OpenAI/GPT o configuración del proveedor del modelo.

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
command -v rec play
```

Instala o actualiza OpenClaw en la VM y luego habilita allí el Plugin incluido:

```bash
openclaw plugins enable google-meet
```

Inicia el host Node en la VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Si `<gateway-host>` es una IP de LAN y no estás usando TLS, el Node rechaza el WebSocket en texto plano a menos que lo habilites explícitamente para esa red privada de confianza:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` es una variable de entorno del proceso, no una configuración de `openclaw.json`. `openclaw node install` la almacena en el entorno del LaunchAgent cuando está presente en el comando de instalación.

Aprueba el Node desde el host del Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Confirma que el Gateway ve el Node y que anuncia `googlemeet.chrome`:

```bash
openclaw nodes status
```

Enruta Meet a través de ese Node en el host del Gateway:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
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

Si se omite `chromeNode.node`, OpenClaw selecciona automáticamente solo cuando exactamente un Node conectado anuncia `googlemeet.chrome`. Si hay varios Nodes compatibles conectados, establece `chromeNode.node` en el id del Node, el nombre para mostrar o la IP remota.

Comprobaciones comunes de fallos:

- `No connected Google Meet-capable node`: inicia `openclaw node run` en la VM, aprueba el emparejamiento y asegúrate de haber ejecutado `openclaw plugins enable google-meet` en la VM. Confirma también que el host del Gateway permite el comando del Node con `gateway.nodes.allowCommands: ["googlemeet.chrome"]`.
- `BlackHole 2ch audio device not found on the node`: instala `blackhole-2ch` en la VM y reinicia la VM.
- Chrome se abre pero no puede unirse: inicia sesión en Chrome dentro de la VM y confirma que ese perfil puede unirse manualmente a la URL de Meet.
- Sin audio: en Meet, enruta el micrófono/altavoz a través de la ruta del dispositivo de audio virtual usada por OpenClaw; usa dispositivos virtuales separados o enrutamiento de estilo Loopback para un audio dúplex limpio.

## Notas de instalación

El valor predeterminado en tiempo real de Chrome usa dos herramientas externas:

- `sox`: utilidad de audio de línea de comandos. El Plugin usa sus comandos `rec` y `play` para el puente de audio predeterminado de 8 kHz G.711 mu-law.
- `blackhole-2ch`: controlador de audio virtual de macOS. Crea el dispositivo de audio `BlackHole 2ch` por el que Chrome/Meet puede enrutar.

OpenClaw no incluye ni redistribuye ninguno de los dos paquetes. La documentación pide a los usuarios que los instalen como dependencias del host mediante Homebrew. SoX tiene licencia `LGPL-2.0-only AND GPL-2.0-only`; BlackHole es GPL-3.0. Si creas un instalador o dispositivo que incluya BlackHole con OpenClaw, revisa los términos de licencia upstream de BlackHole u obtén una licencia aparte de Existential Audio.

## Transportes

### Chrome

El transporte de Chrome abre la URL de Meet en Google Chrome y se une como el perfil de Chrome con sesión iniciada. En macOS, el Plugin comprueba `BlackHole 2ch` antes del inicio. Si está configurado, también ejecuta un comando de comprobación del estado del puente de audio y un comando de inicio antes de abrir Chrome. Usa `chrome` cuando Chrome/audio se ejecuten en el host del Gateway; usa `chrome-node` cuando Chrome/audio se ejecuten en un Node emparejado, como una VM macOS de Parallels.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Enruta el audio del micrófono y del altavoz de Chrome a través del puente de audio local de OpenClaw. Si `BlackHole 2ch` no está instalado, la unión falla con un error de configuración en lugar de unirse silenciosamente sin una ruta de audio.

### Twilio

El transporte de Twilio es un plan de marcado estricto delegado al Plugin de Voice Call. No analiza páginas de Meet para buscar números de teléfono.

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

El acceso a la API multimedia de Google Meet usa primero un cliente OAuth personal. Configura `oauth.clientId` y opcionalmente `oauth.clientSecret`, y luego ejecuta:

```bash
openclaw googlemeet auth login --json
```

El comando imprime un bloque de configuración `oauth` con un token de actualización. Usa PKCE, devolución de llamada localhost en `http://localhost:8085/oauth2callback` y un flujo manual de copiar/pegar con `--manual`.

Estas variables de entorno se aceptan como alternativas:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` o `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` o `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` o `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` o `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` o
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` o `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` o `GOOGLE_MEET_PREVIEW_ACK`

Resuelve una URL de Meet, código o `spaces/{id}` mediante `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Ejecuta la comprobación previa antes del trabajo multimedia:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Establece `preview.enrollmentAcknowledged: true` solo después de confirmar que tu proyecto de Cloud, principal de OAuth y participantes de la reunión están inscritos en el Google Workspace Developer Preview Program para las API multimedia de Meet.

## Configuración

La ruta común en tiempo real de Chrome solo necesita el Plugin habilitado, BlackHole, SoX y una clave de proveedor de voz en tiempo real de backend. OpenAI es el predeterminado; establece `realtime.provider: "google"` para usar Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Establece la configuración del Plugin en `plugins.entries.google-meet.config`:

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
- `chromeNode.node`: id/nombre/IP del Node opcional para `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.audioInputCommand`: comando SoX `rec` que escribe audio de 8 kHz G.711 mu-law en stdout
- `chrome.audioOutputCommand`: comando SoX `play` que lee audio de 8 kHz G.711 mu-law desde stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: respuestas habladas breves, con `openclaw_agent_consult` para respuestas más profundas
- `realtime.introMessage`: breve verificación hablada de disponibilidad cuando se conecta el puente en tiempo real; establécelo en `""` para unirse en silencio

Sobrescrituras opcionales:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    provider: "google",
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

Usa `transport: "chrome"` cuando Chrome se ejecute en el host del Gateway. Usa `transport: "chrome-node"` cuando Chrome se ejecute en un Node emparejado, como una VM de Parallels. En ambos casos, el modelo en tiempo real y `openclaw_agent_consult` se ejecutan en el host del Gateway, por lo que las credenciales del modelo permanecen allí.

Usa `action: "status"` para listar sesiones activas o inspeccionar un ID de sesión. Usa `action: "speak"` con `sessionId` y `message` para hacer que el agente en tiempo real hable de inmediato. Usa `action: "leave"` para marcar una sesión como finalizada.

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Consulta del agente en tiempo real

El modo `realtime` de Chrome está optimizado para un bucle de voz en vivo. El proveedor de voz en tiempo real escucha el audio de la reunión y habla a través del puente de audio configurado. Cuando el modelo en tiempo real necesita razonamiento más profundo, información actual o herramientas normales de OpenClaw, puede llamar a `openclaw_agent_consult`.

La herramienta de consulta ejecuta el agente normal de OpenClaw en segundo plano con el contexto reciente de la transcripción de la reunión y devuelve una respuesta hablada concisa a la sesión de voz en tiempo real. Luego, el modelo de voz puede volver a decir esa respuesta en la reunión.

`realtime.toolPolicy` controla la ejecución de la consulta:

- `safe-read-only`: expone la herramienta de consulta y limita el agente normal a `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` y `memory_get`.
- `owner`: expone la herramienta de consulta y permite que el agente normal use la política de herramientas normal del agente.
- `none`: no expone la herramienta de consulta al modelo de voz en tiempo real.

La clave de sesión de consulta tiene alcance por sesión de Meet, por lo que las llamadas de consulta de seguimiento pueden reutilizar el contexto previo de consulta durante la misma reunión.

Para forzar una verificación hablada de disponibilidad después de que Chrome se haya unido completamente a la llamada:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

## Notas

La API multimedia oficial de Google Meet está orientada a la recepción, por lo que hablar en una llamada de Meet sigue necesitando una ruta de participante. Este Plugin mantiene ese límite visible: Chrome gestiona la participación del navegador y el enrutamiento de audio local; Twilio gestiona la participación mediante acceso telefónico.

El modo `realtime` de Chrome necesita uno de estos dos:

- `chrome.audioInputCommand` más `chrome.audioOutputCommand`: OpenClaw se encarga del puente del modelo en tiempo real y canaliza audio de 8 kHz G.711 mu-law entre esos comandos y el proveedor de voz en tiempo real seleccionado.
- `chrome.audioBridgeCommand`: un comando de puente externo se encarga de toda la ruta de audio local y debe salir después de iniciar o validar su daemon.

Para un audio dúplex limpio, enruta la salida de Meet y el micrófono de Meet a través de dispositivos virtuales separados o un grafo de dispositivos virtuales de estilo Loopback. Un único dispositivo BlackHole compartido puede devolver con eco a la llamada el audio de otros participantes.

`googlemeet speak` activa el puente de audio en tiempo real activo para una sesión de Chrome. `googlemeet leave` detiene ese puente. Para sesiones de Twilio delegadas mediante el Plugin de Voice Call, `leave` también cuelga la llamada de voz subyacente.

## Relacionado

- [Plugin de Voice Call](/es/plugins/voice-call)
- [Modo de conversación](/es/nodes/talk)
- [Creación de plugins](/es/plugins/building-plugins)
