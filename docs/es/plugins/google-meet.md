---
read_when:
    - Quieres que un agente de OpenClaw se una a una llamada de Google Meet
    - Estás configurando Chrome, Chrome node o Twilio como transporte de Google Meet
summary: 'Plugin de Google Meet: unirse a URL de Meet explícitas mediante Chrome o Twilio con valores predeterminados de voz en tiempo real'
title: Plugin de Google Meet
x-i18n:
    generated_at: "2026-04-24T08:59:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d430a1f2d6ee7fc1d997ef388a2e0d2915a6475480343e7060edac799dfc027
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet (Plugin)

Compatibilidad con participantes de Google Meet para OpenClaw.

El Plugin es explícito por diseño:

- Solo se une a una URL explícita de `https://meet.google.com/...`.
- La voz `realtime` es el modo predeterminado.
- La voz en tiempo real puede volver a invocar al agente completo de OpenClaw cuando se necesita un razonamiento más profundo o herramientas.
- La autenticación comienza como OAuth personal de Google o con un perfil de Chrome que ya haya iniciado sesión.
- No hay anuncio automático de consentimiento.
- El backend de audio predeterminado de Chrome es `BlackHole 2ch`.
- Chrome puede ejecutarse localmente o en un host node emparejado.
- Twilio acepta un número de acceso telefónico más un PIN opcional o una secuencia DTMF.
- El comando de la CLI es `googlemeet`; `meet` está reservado para flujos de trabajo más amplios de teleconferencia de agentes.

## Inicio rápido

Instala las dependencias de audio locales y asegúrate de que el proveedor en tiempo real pueda usar OpenAI:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

`blackhole-2ch` instala el dispositivo de audio virtual `BlackHole 2ch`. El instalador de Homebrew requiere un reinicio antes de que macOS exponga el dispositivo:

```bash
sudo reboot
```

Después del reinicio, verifica ambas piezas:

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

Chrome se une como el perfil de Chrome que ha iniciado sesión. En Meet, elige `BlackHole 2ch` para la ruta de micrófono/altavoz usada por OpenClaw. Para un audio dúplex limpio, usa dispositivos virtuales separados o un grafo de estilo Loopback; un solo dispositivo BlackHole es suficiente para una primera prueba smoke, pero puede generar eco.

### Gateway local + Chrome en Parallels

**No** necesitas un Gateway completo de OpenClaw ni una clave de API de modelo dentro de una VM de macOS solo para que la VM sea la propietaria de Chrome. Ejecuta Gateway y el agente localmente, y luego ejecuta un host node en la VM. Habilita una vez el Plugin incluido en la VM para que el node anuncie el comando de Chrome:

Qué se ejecuta en cada lugar:

- Host de Gateway: OpenClaw Gateway, espacio de trabajo del agente, claves de modelo/API, proveedor en tiempo real y la configuración del Plugin de Google Meet.
- VM de macOS en Parallels: CLI/host node de OpenClaw, Google Chrome, SoX, BlackHole 2ch y un perfil de Chrome con sesión iniciada en Google.
- No es necesario en la VM: servicio Gateway, configuración del agente, clave OpenAI/GPT o configuración del proveedor de modelo.

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

Instala o actualiza OpenClaw en la VM y luego habilita allí el Plugin incluido:

```bash
openclaw plugins enable google-meet
```

Inicia el host node en la VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Si `<gateway-host>` es una IP de LAN y no estás usando TLS, el node rechazará el WebSocket en texto claro a menos que aceptes explícitamente esa red privada de confianza:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Usa la misma variable de entorno al instalar el node como LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` es una variable de entorno del proceso, no una configuración de `openclaw.json`. `openclaw node install` la guarda en el entorno de LaunchAgent cuando está presente en el comando de instalación.

Aprueba el node desde el host Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Confirma que Gateway ve el node y que anuncia `googlemeet.chrome`:

```bash
openclaw nodes status
```

Enruta Meet a través de ese node en el host Gateway:

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

Ahora únete normalmente desde el host Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

o pídele al agente que use la herramienta `google_meet` con `transport: "chrome-node"`.

Si se omite `chromeNode.node`, OpenClaw selecciona automáticamente solo cuando exactamente un node conectado anuncia `googlemeet.chrome`. Si hay varios nodes compatibles conectados, configura `chromeNode.node` con el id del node, el nombre para mostrar o la IP remota.

Comprobaciones comunes de fallos:

- `No connected Google Meet-capable node`: inicia `openclaw node run` en la VM, aprueba el emparejamiento y asegúrate de haber ejecutado `openclaw plugins enable google-meet` en la VM. También confirma que el host Gateway permite el comando del node con `gateway.nodes.allowCommands: ["googlemeet.chrome"]`.
- `BlackHole 2ch audio device not found on the node`: instala `blackhole-2ch` en la VM y reiníciala.
- Chrome se abre pero no puede unirse: inicia sesión en Chrome dentro de la VM y confirma que ese perfil puede unirse manualmente a la URL de Meet.
- No hay audio: en Meet, enruta el micrófono/altavoz a través de la ruta de dispositivo de audio virtual usada por OpenClaw; usa dispositivos virtuales separados o un enrutamiento de estilo Loopback para un audio dúplex limpio.

## Notas de instalación

El valor predeterminado de tiempo real de Chrome usa dos herramientas externas:

- `sox`: utilidad de audio de línea de comandos. El Plugin usa sus comandos `rec` y `play` para el puente de audio predeterminado de 8 kHz G.711 mu-law.
- `blackhole-2ch`: controlador de audio virtual para macOS. Crea el dispositivo de audio `BlackHole 2ch` por el que Chrome/Meet puede enrutar.

OpenClaw no incluye ni redistribuye ninguno de los dos paquetes. La documentación pide a los usuarios instalarlos como dependencias del host mediante Homebrew. La licencia de SoX es `LGPL-2.0-only AND GPL-2.0-only`; BlackHole es GPL-3.0. Si compilas un instalador o appliance que incluya BlackHole con OpenClaw, revisa los términos de licencia ascendentes de BlackHole u obtén una licencia independiente de Existential Audio.

## Transportes

### Chrome

El transporte de Chrome abre la URL de Meet en Google Chrome y se une como el perfil de Chrome que ha iniciado sesión. En macOS, el Plugin verifica `BlackHole 2ch` antes de iniciar. Si está configurado, también ejecuta un comando de comprobación del estado del puente de audio y un comando de inicio antes de abrir Chrome. Usa `chrome` cuando Chrome/audio estén en el host Gateway; usa `chrome-node` cuando Chrome/audio estén en un node emparejado, como una VM de macOS en Parallels.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Enruta el audio de micrófono y altavoz de Chrome a través del puente de audio local de OpenClaw. Si `BlackHole 2ch` no está instalado, la unión falla con un error de configuración en lugar de unirse silenciosamente sin una ruta de audio.

### Twilio

El transporte de Twilio es un plan de marcación estricto delegado al Plugin Voice Call. No analiza páginas de Meet para obtener números de teléfono.

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

El acceso a Google Meet Media API usa primero un cliente OAuth personal. Configura `oauth.clientId` y opcionalmente `oauth.clientSecret`, y luego ejecuta:

```bash
openclaw googlemeet auth login --json
```

El comando imprime un bloque de configuración `oauth` con un token de actualización. Usa PKCE, callback localhost en `http://localhost:8085/oauth2callback` y un flujo manual de copiar/pegar con `--manual`.

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

Ejecuta preflight antes del trabajo multimedia:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Configura `preview.enrollmentAcknowledged: true` solo después de confirmar que tu proyecto de Cloud, principal de OAuth y participantes de la reunión están inscritos en el Google Workspace Developer Preview Program para las API multimedia de Meet.

## Configuración

La ruta común de tiempo real con Chrome solo necesita el Plugin habilitado, BlackHole, SoX y una clave de OpenAI:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

Configura el Plugin en `plugins.entries.google-meet.config`:

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
- `chromeNode.node`: id/nombre/IP del node opcional para `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.audioInputCommand`: comando `rec` de SoX que escribe audio G.711 mu-law de 8 kHz en stdout
- `chrome.audioOutputCommand`: comando `play` de SoX que lee audio G.711 mu-law de 8 kHz desde stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: respuestas habladas breves, con `openclaw_agent_consult` para respuestas más profundas
- `realtime.introMessage`: breve comprobación hablada de disponibilidad cuando se conecta el puente en tiempo real; configúralo como `""` para unirse en silencio

Opciones de reemplazo:

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
    toolPolicy: "owner",
    introMessage: "Di exactamente: Estoy aquí.",
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

Usa `transport: "chrome"` cuando Chrome se ejecute en el host Gateway. Usa `transport: "chrome-node"` cuando Chrome se ejecute en un node emparejado, como una VM de Parallels. En ambos casos, el modelo en tiempo real y `openclaw_agent_consult` se ejecutan en el host Gateway, por lo que las credenciales del modelo permanecen allí.

Usa `action: "status"` para listar sesiones activas o inspeccionar un id de sesión. Usa `action: "speak"` con `sessionId` y `message` para hacer que el agente en tiempo real hable de inmediato. Usa `action: "leave"` para marcar una sesión como finalizada.

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Di exactamente: Estoy aquí y escuchando."
}
```

## Consulta del agente en tiempo real

El modo en tiempo real de Chrome está optimizado para un bucle de voz en vivo. El proveedor de voz en tiempo real escucha el audio de la reunión y habla a través del puente de audio configurado. Cuando el modelo en tiempo real necesita un razonamiento más profundo, información actual o herramientas normales de OpenClaw, puede llamar a `openclaw_agent_consult`.

La herramienta de consulta ejecuta entre bastidores el agente normal de OpenClaw con el contexto reciente de la transcripción de la reunión y devuelve una respuesta hablada concisa a la sesión de voz en tiempo real. El modelo de voz puede entonces decir esa respuesta de vuelta en la reunión.

`realtime.toolPolicy` controla la ejecución de la consulta:

- `safe-read-only`: expone la herramienta de consulta y limita el agente normal a `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` y `memory_get`.
- `owner`: expone la herramienta de consulta y permite que el agente normal use la política de herramientas normal del agente.
- `none`: no expone la herramienta de consulta al modelo de voz en tiempo real.

La clave de sesión de consulta tiene alcance por sesión de Meet, de modo que las llamadas de consulta de seguimiento pueden reutilizar el contexto previo de consulta durante la misma reunión.

Para forzar una comprobación hablada de disponibilidad después de que Chrome se haya unido completamente a la llamada:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

## Notas

La API multimedia oficial de Google Meet está orientada a la recepción, así que hablar dentro de una llamada de Meet sigue necesitando una ruta de participante. Este Plugin mantiene ese límite visible: Chrome se encarga de la participación desde el navegador y del enrutamiento local de audio; Twilio se encarga de la participación por marcación telefónica.

El modo en tiempo real de Chrome necesita una de estas opciones:

- `chrome.audioInputCommand` más `chrome.audioOutputCommand`: OpenClaw controla el puente del modelo en tiempo real y canaliza audio G.711 mu-law de 8 kHz entre esos comandos y el proveedor de voz en tiempo real seleccionado.
- `chrome.audioBridgeCommand`: un comando de puente externo controla toda la ruta de audio local y debe salir después de iniciar o validar su daemon.

Para un audio dúplex limpio, enruta la salida de Meet y el micrófono de Meet a través de dispositivos virtuales separados o de un grafo de dispositivos virtuales de estilo Loopback. Un único dispositivo BlackHole compartido puede devolver con eco a otros participantes dentro de la llamada.

`googlemeet speak` activa el puente de audio en tiempo real activo para una sesión de Chrome. `googlemeet leave` detiene ese puente. Para sesiones de Twilio delegadas a través del Plugin Voice Call, `leave` también cuelga la llamada de voz subyacente.

## Relacionado

- [Plugin Voice Call](/es/plugins/voice-call)
- [Modo de conversación](/es/nodes/talk)
- [Crear plugins](/es/plugins/building-plugins)
