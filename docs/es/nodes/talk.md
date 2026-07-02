---
read_when:
    - Implementación del modo Hablar en macOS/iOS/Android
    - Cambiar el comportamiento de voz/TTS/interrupción
summary: 'Modo de conversación: conversaciones de voz continuas con STT/TTS local y voz en tiempo real'
title: Modo de conversación
x-i18n:
    generated_at: "2026-07-02T22:22:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 696e9693cd6b4a18500221230db17c94ffd01fe6f9c7fcf271b74072bb035a82
    source_path: nodes/talk.md
    workflow: 16
---

El modo de conversación tiene dos formas en tiempo de ejecución:

- Conversación nativa de macOS/iOS/Android usa reconocimiento de voz local, chat del Gateway y TTS `talk.speak`. Los nodos anuncian la capacidad `talk` y declaran los comandos `talk.*` que admiten.
- Conversación en iOS usa WebRTC gestionado por el cliente para configuraciones en tiempo real de OpenAI que seleccionan `webrtc` u omiten el transporte. Las configuraciones en tiempo real explícitas `gateway-relay`, `provider-websocket` y que no sean de OpenAI permanecen en el relé gestionado por el Gateway; las configuraciones que no son en tiempo real usan el bucle de voz nativo.
- Conversación en el navegador usa `talk.client.create` para sesiones `webrtc` y `provider-websocket` gestionadas por el cliente, o `talk.session.create` para sesiones `gateway-relay` gestionadas por el Gateway. `managed-room` está reservado para la transferencia del Gateway y las salas tipo walkie-talkie.
- Conversación en Android puede optar por sesiones de relé en tiempo real gestionadas por el Gateway con `talk.realtime.mode: "realtime"` y `talk.realtime.transport: "gateway-relay"`. De lo contrario, permanece en reconocimiento de voz nativo, chat del Gateway y `talk.speak`.
- Los clientes solo de transcripción usan `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, y luego `talk.session.appendAudio`, `talk.session.cancelTurn` y `talk.session.close` cuando necesitan subtítulos o dictado sin una respuesta de voz del asistente.

La conversación nativa es un bucle continuo de conversación por voz:

1. Escuchar voz
2. Enviar la transcripción al modelo mediante la sesión activa
3. Esperar la respuesta
4. Reproducirla con el proveedor de conversación configurado (`talk.speak`)

La conversación en tiempo real gestionada por el cliente reenvía las llamadas a herramientas del proveedor mediante `talk.client.toolCall`; esos clientes no llaman directamente a `chat.send` para consultas en tiempo real.
Mientras una consulta en tiempo real está activa, los clientes de conversación pueden usar `talk.client.steer` o
`talk.session.steer` para clasificar la entrada hablada como `status`, `steer`, `cancel` o
`followup`. La dirección aceptada se encola en la ejecución integrada activa; la dirección
rechazada devuelve un motivo estructurado como `no_active_run`, `not_streaming`
o `compacting`.

La conversación solo de transcripción emite el mismo sobre común de eventos de conversación que las sesiones en tiempo real y STT/TTS, pero usa `mode: "transcription"` y `brain: "none"`. Es para subtítulos, dictado y captura de voz solo de observación; las notas de voz subidas de una sola vez siguen usando la ruta de medios/audio.

## Comportamiento (macOS)

- **Superposición siempre activa** mientras el modo de conversación está habilitado.
- Transiciones de fase **Escuchando → Pensando → Hablando**.
- En una **pausa breve** (ventana de silencio), se envía la transcripción actual.
- Las respuestas se **escriben en WebChat** (igual que al escribir).
- **Interrumpir al hablar** (activado de forma predeterminada): si el usuario empieza a hablar mientras el asistente está hablando, detenemos la reproducción y registramos la marca de tiempo de la interrupción para el siguiente prompt.

## Directivas de voz en las respuestas

El asistente puede anteponer a su respuesta una **sola línea JSON** para controlar la voz:

```json
{ "voice": "<voice-id>", "once": true }
```

Reglas:

- Solo la primera línea no vacía.
- Las claves desconocidas se ignoran.
- `once: true` se aplica solo a la respuesta actual.
- Sin `once`, la voz se convierte en la nueva predeterminada para el modo de conversación.
- La línea JSON se elimina antes de la reproducción TTS.

Claves admitidas:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

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
          voice: "cedar",
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

Valores predeterminados:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: cuando no está definido, Conversación conserva la ventana de pausa predeterminada de la plataforma antes de enviar la transcripción (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: selecciona el proveedor de conversación activo. Usa `elevenlabs`, `mlx` o `system` para las rutas de reproducción locales de macOS.
- `providers.<provider>.voiceId`: recurre a `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` para ElevenLabs (o a la primera voz de ElevenLabs cuando hay una clave de API disponible).
- `providers.elevenlabs.modelId`: el valor predeterminado es `eleven_v3` cuando no está definido.
- `providers.mlx.modelId`: el valor predeterminado es `mlx-community/Soprano-80M-bf16` cuando no está definido.
- `providers.elevenlabs.apiKey`: recurre a `ELEVENLABS_API_KEY` (o al perfil de shell del gateway si está disponible).
- `consultThinkingLevel`: anulación opcional del nivel de pensamiento para la ejecución completa del agente de OpenClaw detrás de las llamadas en tiempo real `openclaw_agent_consult`.
- `consultFastMode`: anulación opcional del modo rápido para llamadas en tiempo real `openclaw_agent_consult`.
- `realtime.provider`: selecciona el proveedor de voz en tiempo real activo. Usa `openai` para WebRTC, `google` para WebSocket del proveedor, o un proveedor solo de puente mediante el relé del Gateway.
- `realtime.providers.<provider>` almacena la configuración en tiempo real propiedad del proveedor. El navegador solo recibe credenciales de sesión efímeras o restringidas, nunca una clave de API estándar.
- `realtime.providers.openai.voice`: id de voz integrado de OpenAI Realtime. Las voces actuales de `gpt-realtime-2` son `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` y `cedar`; se recomiendan `marin` y `cedar` para obtener la mejor calidad.
- `realtime.transport`: `webrtc` usa WebRTC de OpenAI gestionado por el cliente en iOS y en el navegador. `provider-websocket` está gestionado por el navegador, pero permanece en el relé del Gateway en iOS. `gateway-relay` mantiene el audio del proveedor en el Gateway; Android usa tiempo real solo para este transporte y, de lo contrario, conserva su bucle nativo STT/TTS.
- `realtime.brain`: `agent-consult` enruta las llamadas a herramientas en tiempo real mediante la política del Gateway; `direct-tools` es el comportamiento heredado de compatibilidad de herramientas directas; `none` es para transcripción u orquestación externa.
- `realtime.consultRouting`: `provider-direct` conserva la respuesta directa del proveedor cuando omite `openclaw_agent_consult`; `force-agent-consult` hace que el relé del Gateway enrute las transcripciones finales del usuario mediante OpenClaw.
- `realtime.instructions`: agrega instrucciones del sistema orientadas al proveedor al prompt en tiempo real integrado de OpenClaw. Úsalo para el estilo y tono de voz; OpenClaw conserva la guía predeterminada de `openclaw_agent_consult`.
- `talk.catalog` expone los modos, transportes, estrategias de brain, formatos de audio en tiempo real y marcas de capacidad válidos de cada proveedor para que los clientes de conversación propios puedan evitar combinaciones no admitidas.
- Los proveedores de transcripción en streaming se descubren mediante `talk.catalog.transcription`. El relé actual del Gateway usa la configuración del proveedor de streaming de llamada de voz hasta que se agregue la superficie dedicada de configuración de transcripción de conversación.
- `speechLocale`: id de configuración regional BCP 47 opcional para el reconocimiento de voz de conversación en el dispositivo en iOS/macOS. Déjalo sin definir para usar el valor predeterminado del dispositivo.
- `outputFormat`: el valor predeterminado es `pcm_44100` en macOS/iOS y `pcm_24000` en Android (define `mp3_*` para forzar streaming MP3)

## IU de macOS

- Alternancia de la barra de menús: **Conversación**
- Pestaña de configuración: grupo **Modo de conversación** (id de voz + alternancia de interrupción)
- Superposición:
  - **Escuchando**: la nube pulsa con el nivel del micrófono
  - **Pensando**: animación de hundimiento
  - **Hablando**: anillos radiantes
  - Clic en la nube: dejar de hablar
  - Clic en X: salir del modo de conversación

## IU de Android

- Alternancia de la pestaña Voz: **Conversación**
- **Micrófono** manual y **Conversación** son modos de captura en tiempo de ejecución mutuamente excluyentes.
- El micrófono manual se detiene cuando la aplicación sale del primer plano o el usuario abandona la pestaña Voz.
- El modo de conversación sigue ejecutándose hasta que se desactiva o el nodo de Android se desconecta, y usa el tipo de servicio en primer plano de micrófono de Android mientras está activo.

## Notas

- Requiere permisos de Voz + Micrófono.
- La conversación nativa usa la sesión activa del Gateway y solo recurre al sondeo del historial cuando los eventos de respuesta no están disponibles.
- La conversación en tiempo real gestionada por el cliente usa `talk.client.toolCall` para `openclaw_agent_consult` en lugar de exponer `chat.send` a sesiones gestionadas por el proveedor.
- La conversación solo de transcripción usa `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` y `talk.session.close`; los clientes se suscriben a `talk.event` para actualizaciones parciales/finales de transcripción.
- El gateway resuelve la reproducción de conversación mediante `talk.speak` usando el proveedor de conversación activo. Android recurre al TTS del sistema local solo cuando ese RPC no está disponible.
- La reproducción local MLX de macOS usa el asistente incluido `openclaw-mlx-tts` cuando está presente, o un ejecutable en `PATH`. Define `OPENCLAW_MLX_TTS_BIN` para apuntar a un binario asistente personalizado durante el desarrollo.
- `stability` para `eleven_v3` se valida como `0.0`, `0.5` o `1.0`; otros modelos aceptan `0..1`.
- `latency_tier` se valida como `0..4` cuando está definido.
- Android admite formatos de salida `pcm_16000`, `pcm_22050`, `pcm_24000` y `pcm_44100` para streaming AudioTrack de baja latencia.

## Relacionado

- [Activación por voz](/es/nodes/voicewake)
- [Audio y notas de voz](/es/nodes/audio)
- [Comprensión de medios](/es/nodes/media-understanding)
