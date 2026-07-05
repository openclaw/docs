---
read_when:
    - Implementación del modo Talk en macOS/iOS/Android
    - Cambiar el comportamiento de voz/TTS/interrupción
summary: 'Modo de conversación: conversaciones de voz continuas mediante STT/TTS local y voz en tiempo real'
title: Modo de conversación
x-i18n:
    generated_at: "2026-07-05T11:26:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9fd8976b29ad6618337886aa58473c8459c4c5f7e67162f19cfbe1a61e4e4b65
    source_path: nodes/talk.md
    workflow: 16
---

El modo Talk cubre cinco formas de runtime:

- **Talk nativo de macOS/iOS/Android**: reconocimiento de voz local, chat de Gateway y TTS `talk.speak`. Los nodos anuncian la capacidad `talk` y declaran qué comandos `talk.*` admiten.
- **Talk de iOS (realtime)**: WebRTC propiedad del cliente para configuraciones realtime de OpenAI que seleccionan el transporte `webrtc` u omiten el transporte. Las configuraciones realtime explícitas de `gateway-relay`, `provider-websocket` y que no son de OpenAI permanecen en el relay propiedad de Gateway; las configuraciones no realtime usan el bucle de voz nativo.
- **Talk de navegador**: `talk.client.create` para sesiones `webrtc`/`provider-websocket` propiedad del cliente, o `talk.session.create` para sesiones `gateway-relay` propiedad de Gateway. `managed-room` está reservado para la entrega a Gateway y salas de walkie-talkie.
- **Talk de Android (realtime)**: actívalo con `talk.realtime.mode: "realtime"` y `talk.realtime.transport: "gateway-relay"`. De lo contrario, Android permanece en reconocimiento de voz nativo, chat de Gateway y `talk.speak`.
- **Clientes solo de transcripción**: `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, luego `talk.session.appendAudio`, `talk.session.cancelTurn` y `talk.session.close` para subtítulos/dictado sin una respuesta de voz del asistente. Las notas de voz cargadas de una sola vez siguen usando la ruta de audio de [comprensión multimedia](/es/nodes/media-understanding).

Talk nativo es un bucle continuo: escucha voz, envía la transcripción al modelo mediante la sesión activa, espera la respuesta y luego la reproduce con voz mediante el proveedor de Talk configurado (`talk.speak`).

Talk realtime propiedad del cliente reenvía las llamadas a herramientas del proveedor mediante `talk.client.toolCall` en lugar de llamar directamente a `chat.send`. Mientras una consulta realtime está activa, los clientes pueden llamar a `talk.client.steer` o `talk.session.steer` para clasificar la entrada hablada como `status`, `steer`, `cancel` o `followup`. La dirección aceptada se encola en la ejecución embebida activa; la dirección rechazada devuelve un motivo como `no_active_run`, `not_streaming` o `compacting`.

Talk solo de transcripción emite el mismo sobre de eventos de Talk que las sesiones realtime y STT/TTS, pero usa `mode: "transcription"` y `brain: "none"`. Todas las sesiones de Talk difunden eventos en el canal `talk.event`; los clientes se suscriben a él para recibir actualizaciones parciales/finales de transcripción (`transcript.delta`/`transcript.done`) y otra telemetría de sesión.

## Comportamiento (macOS)

- Superposición siempre activa mientras el modo Talk está habilitado.
- Transiciones de fase **Escuchando &rarr; Pensando &rarr; Hablando**.
- En una pausa corta (ventana de silencio), se envía la transcripción actual.
- Las respuestas se escriben en WebChat (igual que al escribir).
- **Interrumpir al hablar** (activado de forma predeterminada): si el usuario habla mientras el asistente está hablando, la reproducción se detiene y la marca de tiempo de la interrupción se anota para el siguiente prompt.

## Directivas de voz en las respuestas

El asistente puede anteponer a una respuesta una sola línea JSON para controlar la voz:

```json
{ "voice": "<voice-id>", "once": true }
```

Reglas:

- Solo la primera línea no vacía; la línea JSON se elimina antes de la reproducción TTS.
- Las claves desconocidas se ignoran.
- `once: true` se aplica solo a la respuesta actual; sin ella, la voz pasa a ser el nuevo valor predeterminado del modo Talk.

Claves admitidas: `voice` / `voice_id` / `voiceId`, `model` / `model_id` / `modelId`, `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`, `seed`, `normalize`, `lang`, `output_format`, `latency_tier`, `once`.

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
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

| Clave                                    | Valor predeterminado                       | Notas                                                                                                                                                                                                                                                                          |
| ---------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`                               | -                                          | Proveedor TTS de Talk activo. Usa `elevenlabs`, `mlx` o `system` para rutas de reproducción locales de macOS.                                                                                                                                                                  |
| `providers.<id>.voiceId`                 | -                                          | ElevenLabs recurre a `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`, o a la primera voz disponible con una clave de API.                                                                                                                                                               |
| `providers.elevenlabs.modelId`           | `eleven_v3`                                |                                                                                                                                                                                                                                                                                |
| `providers.mlx.modelId`                  | `mlx-community/Soprano-80M-bf16`           |                                                                                                                                                                                                                                                                                |
| `providers.elevenlabs.apiKey`            | -                                          | Recurre a `ELEVENLABS_API_KEY` (o al perfil de shell de gateway si está disponible).                                                                                                                                                                                           |
| `speechLocale`                           | valor predeterminado del dispositivo       | ID de configuración regional BCP 47 para el reconocimiento de voz de Talk en el dispositivo en iOS/macOS.                                                                                                                                                                      |
| `silenceTimeoutMs`                       | `700` ms macOS/Android, `900` ms iOS       | Ventana de pausa antes de que Talk envíe la transcripción.                                                                                                                                                                                                                     |
| `interruptOnSpeech`                      | `true`                                     |                                                                                                                                                                                                                                                                                |
| `outputFormat`                           | `pcm_44100` macOS/iOS, `pcm_24000` Android | Configura `mp3_*` para forzar streaming MP3.                                                                                                                                                                                                                                   |
| `consultThinkingLevel`                   | sin definir                                | Anulación del nivel de pensamiento para la ejecución del agente detrás de las llamadas realtime `openclaw_agent_consult`.                                                                                                                                                      |
| `consultFastMode`                        | sin definir                                | Anulación del modo rápido para llamadas realtime `openclaw_agent_consult`.                                                                                                                                                                                                     |
| `realtime.provider`                      | -                                          | `openai` para WebRTC, `google` para WebSocket del proveedor, o un proveedor solo de puente mediante relay de Gateway.                                                                                                                                                          |
| `realtime.providers.<id>`                | -                                          | Configuración realtime propiedad del proveedor. Los navegadores reciben solo credenciales de sesión efímeras/restringidas, nunca una clave de API estándar.                                                                                                                     |
| `realtime.providers.openai.speakerVoice` | `alloy`                                    | ID de voz integrada de OpenAI Realtime (la clave anterior `voice` todavía funciona, pero está obsoleta). Voces actuales de `gpt-realtime-2`: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `marin`, `sage`, `shimmer`, `verse`; se recomiendan `marin` y `cedar` para la mejor calidad. |
| `realtime.transport`                     | -                                          | `webrtc`: WebRTC de OpenAI propiedad del cliente en iOS y en el navegador. `provider-websocket`: propiedad del navegador, permanece en el relay de Gateway en iOS. `gateway-relay`: mantiene el audio del proveedor en Gateway; Android usa realtime solo con este transporte. |
| `realtime.brain`                         | -                                          | `agent-consult` enruta las llamadas a herramientas realtime mediante la política de Gateway; `direct-tools` es compatibilidad heredada con herramientas directas; `none` es para transcripción/orquestación externa.                                                            |
| `realtime.consultRouting`                | -                                          | `provider-direct` conserva la respuesta directa del proveedor cuando omite `openclaw_agent_consult`; `force-agent-consult` enruta las transcripciones de usuario finalizadas mediante OpenClaw en su lugar.                                                                     |
| `realtime.instructions`                  | -                                          | Añade instrucciones del sistema orientadas al proveedor al prompt realtime integrado de OpenClaw (estilo/tono de voz); la guía predeterminada de `openclaw_agent_consult` se mantiene.                                                                                        |

`talk.catalog` expone los ID canónicos de proveedor y los alias de registro, los modos/transportes/estrategias de brain/formatos de audio realtime/indicadores de capacidad válidos de cada proveedor, y el resultado de preparación seleccionado por el runtime. Los clientes Talk de primera parte deben leer ese catálogo en lugar de mantener alias de proveedor localmente; trata un Gateway antiguo que omite la preparación de grupo como no verificado, no como definitivamente no configurado. Los proveedores de transcripción por streaming se descubren mediante `talk.catalog.transcription`; el relay de Gateway actual usa la configuración del proveedor de streaming de Voice Call hasta que se publique una superficie de configuración de transcripción de Talk dedicada.

## Interfaz de usuario de macOS

- Alternancia en la barra de menús: **Talk**
- Pestaña Config: grupo **Modo Talk** (id. de voz + alternancia de interrupción)
- Superposición: Escuchando (la nube pulsa con el nivel del micrófono) &rarr; Pensando (animación de hundimiento) &rarr; Hablando (anillos radiantes). Haz clic en la nube para dejar de hablar, haz clic en X para salir del modo Talk.

## Interfaz de Android

- Alternancia en la pestaña Voz: **Talk**
- **Mic** manual y **Talk** son modos de captura mutuamente excluyentes.
- Mic manual y Talk en tiempo real prefieren un micrófono de auriculares Bluetooth Classic o BLE conectados; si se desconecta, la app solicita otra entrada de auriculares o vuelve al micrófono predeterminado, y restaura la preferencia predeterminada una vez que se detiene la captura.
- Mic manual se detiene cuando la app sale del primer plano o el usuario abandona la pestaña Voz.
- El modo Talk sigue ejecutándose hasta que se desactiva o el nodo se desconecta, usando el tipo de servicio en primer plano de micrófono de Android mientras está activo.
- Android admite los formatos de salida `pcm_16000`, `pcm_22050`, `pcm_24000` y `pcm_44100` para streaming de baja latencia con `AudioTrack`.

## Notas

- Requiere permisos de voz y micrófono.
- Talk nativo usa la sesión activa de Gateway y solo recurre al sondeo del historial cuando los eventos de respuesta no están disponibles.
- El gateway resuelve la reproducción de Talk mediante `talk.speak` usando el proveedor de Talk activo. Android solo recurre al TTS del sistema local cuando ese RPC no está disponible.
- La reproducción MLX local de macOS usa el auxiliar `openclaw-mlx-tts` incluido cuando está presente, o un ejecutable en `PATH`. Define `OPENCLAW_MLX_TTS_BIN` para apuntar a un binario auxiliar personalizado durante el desarrollo.
- Rangos de valores de directivas de voz (ElevenLabs): `stability`, `similarity` y `style` aceptan `0..1`; `speed` acepta `0.5..2`; `latency_tier` acepta `0..4`.

## Relacionado

- [Activación por voz](/es/nodes/voicewake)
- [Notas de audio y voz](/es/nodes/audio)
- [Comprensión multimedia](/es/nodes/media-understanding)
