---
read_when:
    - Quieres que un agente de OpenClaw se una a una llamada de Google Meet
    - Estás configurando Chrome, un nodo Chrome o Twilio como transporte de Google Meet
summary: 'Plugin de Google Meet: unirse a URL de Meet explícitas mediante Chrome o Twilio con valores predeterminados de voz en tiempo real'
title: Plugin de Google Meet
x-i18n:
    generated_at: "2026-04-24T05:40:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c89587eeab8440b2ded2c352cc73209753fc4697d9fdf44cfe39de9d1d76b3f
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet (Plugin)

Compatibilidad con participantes de Google Meet para OpenClaw.

El Plugin es explícito por diseño:

- Solo se une a una URL explícita `https://meet.google.com/...`.
- La voz `realtime` es el modo predeterminado.
- La voz en tiempo real puede volver a llamar al agente completo de OpenClaw cuando se necesita un razonamiento más profundo
  o herramientas.
- La autenticación comienza como OAuth personal de Google o un perfil de Chrome ya autenticado.
- No hay anuncio automático de consentimiento.
- El backend de audio predeterminado de Chrome es `BlackHole 2ch`.
- Chrome puede ejecutarse localmente o en un host de node emparejado.
- Twilio acepta un número de acceso telefónico más un PIN o secuencia DTMF opcionales.
- El comando de CLI es `googlemeet`; `meet` está reservado para flujos más amplios
  de teleconferencia de agentes.

## Inicio rápido

Instala las dependencias de audio locales y asegúrate de que el proveedor de tiempo real pueda usar
OpenAI:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

`blackhole-2ch` instala el dispositivo de audio virtual `BlackHole 2ch`. El instalador de
Homebrew requiere un reinicio antes de que macOS exponga el dispositivo:

```bash
sudo reboot
```

Después del reinicio, verifica ambas cosas:

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

Chrome se une como el perfil de Chrome que ya ha iniciado sesión. En Meet, elige `BlackHole 2ch` para
la ruta de micrófono/altavoz usada por OpenClaw. Para un audio dúplex limpio, usa
dispositivos virtuales separados o un grafo estilo Loopback; un solo dispositivo BlackHole
es suficiente para una primera prueba smoke, pero puede producir eco.

### Gateway local + Chrome en Parallels

**No** necesitas un Gateway completo de OpenClaw ni una clave API de modelo dentro de una VM de macOS
solo para que la VM sea la propietaria de Chrome. Ejecuta el Gateway y el agente localmente, y luego ejecuta un
host de node en la VM. Habilita el Plugin integrado en la VM una vez para que el node
anuncie el comando de Chrome:

Qué se ejecuta dónde:

- Host del Gateway: Gateway de OpenClaw, espacio de trabajo del agente, claves de modelo/API, proveedor
  de tiempo real y configuración del Plugin de Google Meet.
- VM macOS de Parallels: CLI/host de node de OpenClaw, Google Chrome, SoX, BlackHole 2ch
  y un perfil de Chrome autenticado en Google.
- No es necesario en la VM: servicio Gateway, configuración del agente, clave OpenAI/GPT ni configuración de proveedor de modelos.

Instala las dependencias de la VM:

```bash
brew install blackhole-2ch sox
```

Reinicia la VM después de instalar BlackHole para que macOS exponga `BlackHole 2ch`:

```bash
sudo reboot
```

Después del reinicio, verifica que la VM puede ver el dispositivo de audio y los comandos de SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Instala o actualiza OpenClaw en la VM y luego habilita allí el Plugin integrado:

```bash
openclaw plugins enable google-meet
```

Inicia el host de node en la VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Aprueba el node desde el host del Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Confirma que el Gateway ve el node y que anuncia `googlemeet.chrome`:

```bash
openclaw nodes status
```

Enruta Meet a través de ese node en el host del Gateway:

```json5
{
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

Si se omite `chromeNode.node`, OpenClaw selecciona automáticamente solo cuando exactamente un
node conectado anuncia `googlemeet.chrome`. Si hay varios nodes compatibles
conectados, establece `chromeNode.node` con el ID del node, nombre visible o IP remota.

Comprobaciones comunes de fallos:

- `No connected Google Meet-capable node`: inicia `openclaw node run` en la VM,
  aprueba el emparejamiento y asegúrate de haber ejecutado `openclaw plugins enable google-meet`
  en la VM.
- `BlackHole 2ch audio device not found on the node`: instala `blackhole-2ch`
  en la VM y reiníciala.
- Chrome se abre pero no puede unirse: inicia sesión en Chrome dentro de la VM y confirma que
  ese perfil puede unirse manualmente a la URL de Meet.
- Sin audio: en Meet, enruta micrófono/altavoz a través de la ruta de dispositivo virtual de audio
  usada por OpenClaw; usa dispositivos virtuales separados o un enrutamiento estilo Loopback
  para un dúplex limpio.

## Notas de instalación

El valor predeterminado de Chrome en tiempo real usa dos herramientas externas:

- `sox`: utilidad de audio de línea de comandos. El Plugin usa sus comandos `rec` y `play`
  para el puente de audio predeterminado G.711 mu-law a 8 kHz.
- `blackhole-2ch`: controlador de audio virtual de macOS. Crea el dispositivo de audio
  `BlackHole 2ch` a través del cual Chrome/Meet puede enrutar.

OpenClaw no incluye ni redistribuye ninguno de los dos paquetes. La documentación pide a los usuarios que
los instalen como dependencias del host mediante Homebrew. SoX tiene licencia
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole es GPL-3.0. Si compilas un
instalador o dispositivo que incluya BlackHole junto con OpenClaw, revisa los
términos de licencia ascendente de BlackHole o consigue una licencia independiente de Existential Audio.

## Transportes

### Chrome

El transporte Chrome abre la URL de Meet en Google Chrome y se une como el perfil de Chrome
autenticado. En macOS, el Plugin comprueba `BlackHole 2ch` antes del inicio.
Si está configurado, también ejecuta un comando de estado del puente de audio y un comando de inicio
antes de abrir Chrome. Usa `chrome` cuando Chrome/audio vivan en el host del Gateway;
usa `chrome-node` cuando Chrome/audio vivan en un node emparejado como una VM macOS de Parallels.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Enruta el audio del micrófono y altavoz de Chrome a través del puente de audio local de OpenClaw.
Si `BlackHole 2ch` no está instalado, la unión falla con un error de configuración
en lugar de unirse silenciosamente sin una ruta de audio.

### Twilio

El transporte Twilio es un plan de marcación estricto delegado al Plugin Voice Call. No
analiza páginas de Meet para buscar números de teléfono.

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

El acceso a la API de medios de Google Meet usa primero un cliente OAuth personal. Configura
`oauth.clientId` y opcionalmente `oauth.clientSecret`, luego ejecuta:

```bash
openclaw googlemeet auth login --json
```

El comando imprime un bloque de configuración `oauth` con un token de actualización. Usa PKCE,
callback localhost en `http://localhost:8085/oauth2callback` y un flujo manual
de copiar/pegar con `--manual`.

Estas variables de entorno se aceptan como respaldos:

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

Ejecuta la comprobación previa antes del trabajo con medios:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Establece `preview.enrollmentAcknowledged: true` solo después de confirmar que tu
proyecto de Cloud, principal de OAuth y participantes de la reunión están inscritos en el Google
Workspace Developer Preview Program para las API de medios de Meet.

## Configuración

La ruta común de Chrome en tiempo real solo necesita el Plugin habilitado, BlackHole, SoX
y una clave de OpenAI:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

Establece la configuración del Plugin bajo `plugins.entries.google-meet.config`:

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
- `chromeNode.node`: ID/nombre/IP opcional del node para `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.audioInputCommand`: comando SoX `rec` que escribe audio
  G.711 mu-law a 8 kHz en stdout
- `chrome.audioOutputCommand`: comando SoX `play` que lee audio G.711 mu-law a 8 kHz
  desde stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: respuestas habladas breves, con
  `openclaw_agent_consult` para respuestas más profundas

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
    toolPolicy: "owner",
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

Usa `transport: "chrome"` cuando Chrome se ejecute en el host del Gateway. Usa
`transport: "chrome-node"` cuando Chrome se ejecute en un node emparejado como una VM de Parallels.
En ambos casos, el modelo en tiempo real y `openclaw_agent_consult` se ejecutan en el
host del Gateway, por lo que las credenciales del modelo permanecen allí.

Usa `action: "status"` para listar sesiones activas o inspeccionar un ID de sesión. Usa
`action: "leave"` para marcar una sesión como terminada.

## Consulta de agente en tiempo real

El modo Chrome en tiempo real está optimizado para un bucle de voz en vivo. El proveedor
de voz en tiempo real escucha el audio de la reunión y habla a través del puente de audio configurado.
Cuando el modelo en tiempo real necesita un razonamiento más profundo, información actual o herramientas normales
de OpenClaw, puede llamar a `openclaw_agent_consult`.

La herramienta de consulta ejecuta entre bastidores el agente normal de OpenClaw con contexto
de la transcripción reciente de la reunión y devuelve una respuesta hablada concisa a la sesión
de voz en tiempo real. El modelo de voz puede entonces decir esa respuesta dentro de la reunión.

`realtime.toolPolicy` controla la ejecución de la consulta:

- `safe-read-only`: expone la herramienta de consulta y limita el agente normal a
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` y
  `memory_get`.
- `owner`: expone la herramienta de consulta y deja que el agente normal use la política
  normal de herramientas del agente.
- `none`: no expone la herramienta de consulta al modelo de voz en tiempo real.

La clave de sesión de consulta tiene alcance por sesión de Meet, de modo que las llamadas de seguimiento a la consulta
pueden reutilizar el contexto previo de consulta durante la misma reunión.

## Notas

La API oficial de medios de Google Meet está orientada a recepción, por lo que hablar dentro de una llamada de Meet
sigue necesitando una ruta de participante. Este Plugin mantiene ese límite visible:
Chrome se encarga de la participación del navegador y del enrutamiento de audio local; Twilio se encarga
de la participación mediante acceso telefónico.

El modo Chrome en tiempo real necesita una de estas opciones:

- `chrome.audioInputCommand` más `chrome.audioOutputCommand`: OpenClaw es propietario del
  puente del modelo en tiempo real y canaliza audio G.711 mu-law a 8 kHz entre esos
  comandos y el proveedor de voz en tiempo real seleccionado.
- `chrome.audioBridgeCommand`: un comando de puente externo es propietario de toda la ruta local
  de audio y debe salir después de iniciar o validar su daemon.

Para un audio dúplex limpio, enruta la salida de Meet y el micrófono de Meet a través de dispositivos
virtuales separados o de un grafo de dispositivos virtuales estilo Loopback. Un único
dispositivo BlackHole compartido puede devolver con eco a la llamada el audio de otros participantes.

`googlemeet leave` detiene el puente de audio en tiempo real por pares de comandos para sesiones de Chrome.
Para las sesiones de Twilio delegadas a través del Plugin Voice Call, también cuelga
la llamada de voz subyacente.

## Relacionado

- [Plugin Voice call](/es/plugins/voice-call)
- [Modo Talk](/es/nodes/talk)
- [Compilar plugins](/es/plugins/building-plugins)
