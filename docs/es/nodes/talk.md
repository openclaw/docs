---
read_when:
    - Implementación del modo Hablar en macOS/iOS/Android
    - Cambiar el comportamiento de voz/TTS/interrupción
summary: 'Modo de conversación: conversaciones de voz continuas mediante STT/TTS local y voz en tiempo real'
title: Modo de conversación
x-i18n:
    generated_at: "2026-07-11T23:13:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4180dcbf7a62cd03e2d18f2c568ed2182c9cf2f80159154a7d261bcb9b3ebee0
    source_path: nodes/talk.md
    workflow: 16
---

El modo Talk abarca cinco modalidades de ejecución:

- **Talk nativo en macOS/iOS/Android**: reconocimiento de voz local, chat mediante el Gateway y TTS con `talk.speak`. Los Nodes anuncian la capacidad `talk` y declaran qué comandos `talk.*` admiten.
- **Talk en iOS (tiempo real)**: WebRTC gestionado por el cliente para configuraciones de tiempo real de OpenAI que seleccionan el transporte `webrtc` u omiten el transporte. Las configuraciones de tiempo real que especifican `gateway-relay`, `provider-websocket` y proveedores distintos de OpenAI permanecen en el relé gestionado por el Gateway; las configuraciones que no son de tiempo real usan el bucle de voz nativo.
- **Talk en el navegador**: `talk.client.create` para sesiones `webrtc`/`provider-websocket` gestionadas por el cliente, o `talk.session.create` para sesiones `gateway-relay` gestionadas por el Gateway. `managed-room` está reservado para la transferencia al Gateway y las salas de comunicación tipo walkie-talkie.
- **Talk en Android (tiempo real)**: actívelo con `talk.realtime.mode: "realtime"` y `talk.realtime.transport: "gateway-relay"`. De lo contrario, Android sigue usando el reconocimiento de voz nativo, el chat mediante el Gateway y `talk.speak`.
- **Clientes solo de transcripción**: `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, seguido de `talk.session.appendAudio`, `talk.session.cancelTurn` y `talk.session.close` para subtítulos o dictado sin una respuesta de voz del asistente. Las notas de voz subidas de una sola toma siguen usando la ruta de audio de [comprensión de contenido multimedia](/es/nodes/media-understanding).

Talk nativo es un bucle continuo: escucha la voz, envía la transcripción al modelo mediante la sesión activa, espera la respuesta y luego la reproduce mediante el proveedor de Talk configurado (`talk.speak`).

Talk en tiempo real gestionado por el cliente reenvía las llamadas a herramientas del proveedor mediante `talk.client.toolCall`, en lugar de llamar directamente a `chat.send`. Mientras hay una consulta en tiempo real activa, los clientes pueden llamar a `talk.client.steer` o `talk.session.steer` para clasificar la entrada de voz como `status`, `steer`, `cancel` o `followup`. Las instrucciones de control aceptadas se ponen en cola en la ejecución integrada activa; las rechazadas devuelven un motivo como `no_active_run`, `not_streaming` o `compacting`.

Talk solo de transcripción emite el mismo sobre de eventos de Talk que las sesiones en tiempo real y de STT/TTS, pero usa `mode: "transcription"` y `brain: "none"`. Todas las sesiones de Talk difunden eventos por el canal `talk.event`; los clientes se suscriben a él para recibir actualizaciones parciales/finales de la transcripción (`transcript.delta`/`transcript.done`) y otros datos de telemetría de la sesión.

## Comportamiento (macOS)

- Superposición siempre visible mientras el modo Talk está activado.
- Transiciones de fase **Escuchando &rarr; Pensando &rarr; Hablando**.
- Tras una pausa breve (intervalo de silencio), se envía la transcripción actual.
- Las respuestas se escriben en WebChat (igual que al escribirlas).
- **Interrumpir al detectar voz** (activado de forma predeterminada): si el usuario habla mientras el asistente está hablando, la reproducción se detiene y se registra la marca de tiempo de la interrupción para la siguiente instrucción.

## Directivas de voz en las respuestas

El asistente puede anteponer a una respuesta una sola línea JSON para controlar la voz:

```json
{ "voice": "<voice-id>", "once": true }
```

Reglas:

- Solo la primera línea no vacía; la línea JSON se elimina antes de la reproducción TTS.
- Las claves desconocidas se ignoran.
- `once: true` se aplica únicamente a la respuesta actual; sin esta opción, la voz se convierte en la nueva predeterminada del modo Talk.

Claves compatibles: `voice` / `voice_id` / `voiceId`, `model` / `model_id` / `modelId`, `speed`, `rate` (PPM), `stability`, `similarity`, `style`, `speakerBoost`, `seed`, `normalize`, `lang`, `output_format`, `latency_tier`, `once`.

## Configuración (`~/.openclaw/openclaw.json`)

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          apiKey: "openai_api_key",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
      instructions: "Habla con calidez y mantén las respuestas breves.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

| Clave                                    | Valor predeterminado                        | Notas                                                                                                                                                                                                                                                                      |
| ---------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`                               | -                                          | Proveedor TTS activo de Talk. Use `elevenlabs`, `mlx` o `system` para las rutas de reproducción local en macOS.                                                                                                                                                            |
| `providers.<id>.voiceId`                 | -                                          | ElevenLabs recurre a `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` o a la primera voz disponible con una clave de API.                                                                                                                                                           |
| `providers.elevenlabs.modelId`           | `eleven_v3`                                |                                                                                                                                                                                                                                                                            |
| `providers.mlx.modelId`                  | `mlx-community/Soprano-80M-bf16`           |                                                                                                                                                                                                                                                                            |
| `providers.elevenlabs.apiKey`            | -                                          | Recurre a `ELEVENLABS_API_KEY` (o al perfil de shell del Gateway, si está disponible).                                                                                                                                                                                     |
| `speechLocale`                           | valor predeterminado del dispositivo       | Identificador de configuración regional BCP 47 para el reconocimiento de voz de Talk en el dispositivo en iOS/macOS.                                                                                                                                                      |
| `silenceTimeoutMs`                       | `700` ms en macOS/Android, `900` ms en iOS | Intervalo de pausa antes de que Talk envíe la transcripción.                                                                                                                                                                                                               |
| `interruptOnSpeech`                      | `true`                                     |                                                                                                                                                                                                                                                                            |
| `outputFormat`                           | `pcm_44100` en macOS/iOS, `pcm_24000` en Android | Establezca `mp3_*` para forzar la transmisión en MP3.                                                                                                                                                                                                                 |
| `consultThinkingLevel`                   | sin establecer                             | Anulación del nivel de razonamiento para la ejecución del agente que gestiona las llamadas en tiempo real a `openclaw_agent_consult`.                                                                                                                                     |
| `consultFastMode`                        | sin establecer                             | Anulación del modo rápido para las llamadas en tiempo real a `openclaw_agent_consult`.                                                                                                                                                                                     |
| `realtime.provider`                      | -                                          | `openai` para WebRTC, `google` para WebSocket del proveedor o un proveedor exclusivo del puente mediante el relé del Gateway.                                                                                                                                             |
| `realtime.providers.<id>`                | -                                          | Configuración de tiempo real gestionada por el proveedor. Los navegadores reciben únicamente credenciales de sesión efímeras/restringidas, nunca una clave de API estándar.                                                                                               |
| `realtime.providers.openai.speakerVoice` | `alloy`                                    | Identificador de voz integrado de OpenAI Realtime (la clave anterior `voice` aún funciona, pero está obsoleta). Voces actuales de `gpt-realtime-2.1`: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `marin`, `sage`, `shimmer`, `verse`; se recomiendan `marin` y `cedar` para obtener la mejor calidad. |
| `realtime.transport`                     | -                                          | `webrtc`: WebRTC de OpenAI gestionado por el cliente en iOS y en el navegador. `provider-websocket`: gestionado por el navegador; en iOS permanece en el relé del Gateway. `gateway-relay`: mantiene el audio del proveedor en el Gateway; Android usa tiempo real únicamente con este transporte. |
| `realtime.brain`                         | -                                          | `agent-consult` enruta las llamadas a herramientas en tiempo real mediante la política del Gateway; `direct-tools` proporciona compatibilidad heredada con herramientas directas; `none` se usa para transcripción/orquestación externa.                                      |
| `realtime.consultRouting`                | -                                          | `provider-direct` conserva la respuesta directa del proveedor cuando este omite `openclaw_agent_consult`; `force-agent-consult` enruta en su lugar las transcripciones finales del usuario mediante OpenClaw.                                                              |
| `realtime.instructions`                  | -                                          | Añade instrucciones del sistema orientadas al proveedor a la instrucción integrada de tiempo real de OpenClaw (estilo/tono de voz); se conserva la guía predeterminada de `openclaw_agent_consult`.                                                                        |

`talk.catalog` expone los identificadores canónicos de proveedores y los alias del registro, los modos, transportes, estrategias de cerebro, formatos de audio en tiempo real y marcas de capacidades válidos de cada proveedor, así como el resultado de disponibilidad seleccionado en tiempo de ejecución. Los clientes propios de Talk deben consultar ese catálogo en lugar de mantener localmente los alias de proveedores; si un Gateway antiguo omite la disponibilidad del grupo, considérela no verificada en vez de definitivamente no configurada. Los proveedores de transcripción en streaming se detectan mediante `talk.catalog.transcription`; el relay actual del Gateway utiliza la configuración del proveedor de streaming de Voice Call hasta que se publique una superficie de configuración dedicada para la transcripción de Talk.

## Interfaz de macOS

- Opción de la barra de menús: **Talk**
- Pestaña de configuración: grupo **Talk Mode** (identificador de voz + opción de interrupción)
- Superposición: el orbe representa la forma de onda universal de Talk (compartida con iOS, watchOS y Android). Durante la escucha, sigue el nivel del micrófono en directo; durante la reproducción, sigue la envolvente real de reproducción de TTS; durante el procesamiento, respira suavemente. Haga clic en el orbe para pausar o reanudar, haga doble clic para detener la reproducción de voz y haga clic en X para salir del modo Talk.

## Interfaz de Android

- Opción de la pestaña de voz: **Talk**
- **Mic** manual y **Talk** son modos de captura mutuamente excluyentes.
- El micrófono manual y Talk en tiempo real priorizan el micrófono de unos auriculares Bluetooth Classic o BLE conectados; si se desconectan, la aplicación solicita otra entrada de auriculares o recurre al micrófono predeterminado, y restablece la preferencia predeterminada cuando finaliza la captura.
- El micrófono manual se detiene cuando la aplicación deja de estar en primer plano o el usuario abandona la pestaña de voz.
- El modo Talk continúa ejecutándose hasta que se desactiva o se desconecta el Node; mientras está activo, utiliza el tipo de servicio en primer plano de micrófono de Android.
- Android admite los formatos de salida `pcm_16000`, `pcm_22050`, `pcm_24000` y `pcm_44100` para el streaming de baja latencia mediante `AudioTrack`.

## Notas

- Requiere permisos de reconocimiento de voz y micrófono.
- Talk nativo utiliza la sesión activa del Gateway y solo recurre a la consulta periódica del historial cuando los eventos de respuesta no están disponibles.
- El Gateway resuelve la reproducción de Talk mediante `talk.speak` usando el proveedor activo de Talk. Android recurre al TTS local del sistema solo cuando ese RPC no está disponible.
- La reproducción local con MLX en macOS utiliza el auxiliar `openclaw-mlx-tts` incluido cuando está presente, o un ejecutable disponible en `PATH`. Establezca `OPENCLAW_MLX_TTS_BIN` para que apunte a un binario auxiliar personalizado durante el desarrollo.
- Intervalos de valores de las directivas de voz (ElevenLabs): `stability`, `similarity` y `style` aceptan `0..1`; `speed` acepta `0.5..2`; `latency_tier` acepta `0..4`.

## Contenido relacionado

- [Activación por voz](/es/nodes/voicewake)
- [Notas de audio y voz](/es/nodes/audio)
- [Comprensión de contenido multimedia](/es/nodes/media-understanding)
