---
read_when:
    - Implementación del modo Talk en macOS/iOS/Android
    - Cambiar el comportamiento de voz/TTS/interrupción
summary: 'Modo de conversación: conversaciones de voz continuas con STT/TTS local y voz en tiempo real'
title: Modo conversación
x-i18n:
    generated_at: "2026-07-03T09:22:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9c8cdb6ffef7575348e94b36cd73a0613c336d8e811d6ce46d7518ee7c34b14
    source_path: nodes/talk.md
    workflow: 16
---

El modo de voz tiene dos formas en tiempo de ejecución:

- El modo de voz nativo de macOS/iOS/Android usa reconocimiento de voz local, chat del Gateway y TTS `talk.speak`. Los nodos anuncian la capacidad `talk` y declaran los comandos `talk.*` que admiten.
- El modo de voz de iOS usa WebRTC propiedad del cliente para configuraciones en tiempo real de OpenAI que seleccionan `webrtc` u omiten el transporte. Las configuraciones en tiempo real explícitas con `gateway-relay`, `provider-websocket` y no OpenAI permanecen en el relay propiedad del Gateway; las configuraciones que no son en tiempo real usan el bucle de voz nativo.
- El modo de voz en navegador usa `talk.client.create` para sesiones `webrtc` y `provider-websocket` propiedad del cliente, o `talk.session.create` para sesiones `gateway-relay` propiedad del Gateway. `managed-room` está reservado para la entrega del Gateway y salas tipo walkie-talkie.
- El modo de voz de Android puede optar por sesiones de relay en tiempo real propiedad del Gateway con `talk.realtime.mode: "realtime"` y `talk.realtime.transport: "gateway-relay"`. De lo contrario, permanece en reconocimiento de voz nativo, chat del Gateway y `talk.speak`.
- Los clientes solo de transcripción usan `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, luego `talk.session.appendAudio`, `talk.session.cancelTurn` y `talk.session.close` cuando necesitan subtítulos o dictado sin una respuesta de voz del asistente.

El modo de voz nativo es un bucle continuo de conversación por voz:

1. Escuchar voz
2. Enviar la transcripción al modelo mediante la sesión activa
3. Esperar la respuesta
4. Reproducirla con el proveedor de voz configurado (`talk.speak`)

El modo de voz en tiempo real propiedad del cliente reenvía las llamadas a herramientas del proveedor mediante `talk.client.toolCall`; esos clientes no llaman a `chat.send` directamente para consultas en tiempo real.
Mientras una consulta en tiempo real está activa, los clientes de voz pueden usar `talk.client.steer` o
`talk.session.steer` para clasificar la entrada hablada como `status`, `steer`, `cancel` o
`followup`. La dirección aceptada se encola en la ejecución integrada activa; la dirección
rechazada devuelve un motivo estructurado como `no_active_run`, `not_streaming`
o `compacting`.

El modo de voz solo de transcripción emite el mismo sobre común de eventos de voz que las sesiones en tiempo real y STT/TTS, pero usa `mode: "transcription"` y `brain: "none"`. Sirve para subtítulos, dictado y captura de voz solo de observación; las notas de voz cargadas de una sola vez siguen usando la ruta de medios/audio.

## Comportamiento (macOS)

- **Superposición siempre activa** mientras el modo de voz está habilitado.
- Transiciones de fase **Escuchando → Pensando → Hablando**.
- En una **pausa breve** (ventana de silencio), se envía la transcripción actual.
- Las respuestas se **escriben en WebChat** (igual que al escribir).
- **Interrumpir al hablar** (activado de forma predeterminada): si el usuario empieza a hablar mientras el asistente está hablando, detenemos la reproducción y anotamos la marca de tiempo de la interrupción para el siguiente prompt.

## Directivas de voz en las respuestas

El asistente puede anteponer a su respuesta una **única línea JSON** para controlar la voz:

```json
{ "voice": "<voice-id>", "once": true }
```

Reglas:

- Solo la primera línea no vacía.
- Las claves desconocidas se ignoran.
- `once: true` se aplica solo a la respuesta actual.
- Sin `once`, la voz se convierte en el nuevo valor predeterminado para el modo de voz.
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
- `silenceTimeoutMs`: cuando no está definido, el modo de voz conserva la ventana de pausa predeterminada de la plataforma antes de enviar la transcripción (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: selecciona el proveedor de voz activo. Usa `elevenlabs`, `mlx` o `system` para las rutas de reproducción locales de macOS.
- `providers.<provider>.voiceId`: recurre a `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` para ElevenLabs (o a la primera voz de ElevenLabs cuando la clave de API está disponible).
- `providers.elevenlabs.modelId`: usa `eleven_v3` de forma predeterminada cuando no está definido.
- `providers.mlx.modelId`: usa `mlx-community/Soprano-80M-bf16` de forma predeterminada cuando no está definido.
- `providers.elevenlabs.apiKey`: recurre a `ELEVENLABS_API_KEY` (o al perfil de shell del gateway si está disponible).
- `consultThinkingLevel`: anulación opcional del nivel de pensamiento para la ejecución completa del agente de OpenClaw detrás de llamadas en tiempo real a `openclaw_agent_consult`.
- `consultFastMode`: anulación opcional del modo rápido para llamadas en tiempo real a `openclaw_agent_consult`.
- `realtime.provider`: selecciona el proveedor de voz en tiempo real activo. Usa `openai` para WebRTC, `google` para WebSocket del proveedor o un proveedor solo de puente mediante relay del Gateway.
- `realtime.providers.<provider>` almacena la configuración en tiempo real propiedad del proveedor. El navegador recibe solo credenciales de sesión efímeras o restringidas, nunca una clave de API estándar.
- `realtime.providers.openai.voice`: identificador de voz OpenAI Realtime integrado. Las voces actuales de `gpt-realtime-2` son `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` y `cedar`; `marin` y `cedar` se recomiendan para obtener la mejor calidad.
- `realtime.transport`: `webrtc` usa WebRTC de OpenAI propiedad del cliente en iOS y en el navegador. `provider-websocket` es propiedad del navegador, pero permanece en el relay del Gateway en iOS. `gateway-relay` mantiene el audio del proveedor en el Gateway; Android usa tiempo real solo para este transporte y, de lo contrario, conserva su bucle STT/TTS nativo.
- `realtime.brain`: `agent-consult` enruta las llamadas a herramientas en tiempo real mediante la política del Gateway; `direct-tools` es el comportamiento heredado de compatibilidad con herramientas directas; `none` es para transcripción u orquestación externa.
- `realtime.consultRouting`: `provider-direct` conserva la respuesta directa del proveedor cuando omite `openclaw_agent_consult`; `force-agent-consult` hace que el relay del Gateway enrute las transcripciones de usuario finalizadas mediante OpenClaw en su lugar.
- `realtime.instructions`: agrega instrucciones del sistema orientadas al proveedor al prompt en tiempo real integrado de OpenClaw. Úsalo para el estilo y el tono de voz; OpenClaw conserva la guía predeterminada de `openclaw_agent_consult`.
- `talk.catalog` expone identificadores canónicos de proveedor y alias de registro junto con los modos, transportes, estrategias de brain, formatos de audio en tiempo real, indicadores de capacidad y resultado de preparación seleccionado en tiempo de ejecución válidos de cada proveedor. Los clientes de voz de primera parte deberían usar ese catálogo en lugar de mantener alias de proveedor localmente; un Gateway antiguo que omite la preparación de grupo está sin verificar, no definitivamente sin configurar.
- Los proveedores de transcripción en streaming se descubren mediante `talk.catalog.transcription`. El relay actual del Gateway usa la configuración del proveedor de streaming Voice Call hasta que se agregue la superficie de configuración dedicada de transcripción de voz.
- `speechLocale`: identificador de locale BCP 47 opcional para el reconocimiento de voz en el dispositivo del modo de voz en iOS/macOS. Déjalo sin definir para usar el valor predeterminado del dispositivo.
- `outputFormat`: usa `pcm_44100` de forma predeterminada en macOS/iOS y `pcm_24000` en Android (define `mp3_*` para forzar streaming MP3)

## Interfaz de macOS

- Alternador de la barra de menús: **Voz**
- Pestaña de configuración: grupo **Modo de voz** (identificador de voz + alternador de interrupción)
- Superposición:
  - **Escuchando**: la nube pulsa con el nivel del micrófono
  - **Pensando**: animación de hundimiento
  - **Hablando**: anillos radiantes
  - Clic en la nube: detener el habla
  - Clic en X: salir del modo de voz

## Interfaz de Android

- Alternador de la pestaña de voz: **Voz**
- **Micrófono** manual y **Voz** son modos de captura en tiempo de ejecución mutuamente excluyentes.
- Micrófono manual y voz en tiempo real prefieren un micrófono de auriculares Bluetooth Classic o BLE conectado. Si se desconecta, la app solicita otra entrada de auriculares o permite que Android use el micrófono predeterminado; detener la captura restaura la preferencia de micrófono predeterminada.
- Micrófono manual se detiene cuando la app deja el primer plano o el usuario sale de la pestaña de voz.
- Modo de voz sigue ejecutándose hasta que se desactiva o el nodo de Android se desconecta, y usa el tipo de servicio en primer plano de micrófono de Android mientras está activo.

## Notas

- Requiere permisos de voz y micrófono.
- El modo de voz nativo usa la sesión activa del Gateway y solo recurre al sondeo de historial cuando los eventos de respuesta no están disponibles.
- El modo de voz en tiempo real propiedad del cliente usa `talk.client.toolCall` para `openclaw_agent_consult` en lugar de exponer `chat.send` a sesiones propiedad del proveedor.
- El modo de voz solo de transcripción usa `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` y `talk.session.close`; los clientes se suscriben a `talk.event` para actualizaciones parciales/finales de la transcripción.
- El gateway resuelve la reproducción de voz mediante `talk.speak` usando el proveedor de voz activo. Android recurre a TTS local del sistema solo cuando ese RPC no está disponible.
- La reproducción local de MLX en macOS usa el helper incluido `openclaw-mlx-tts` cuando está presente, o un ejecutable en `PATH`. Define `OPENCLAW_MLX_TTS_BIN` para apuntar a un binario helper personalizado durante el desarrollo.
- `stability` para `eleven_v3` se valida como `0.0`, `0.5` o `1.0`; otros modelos aceptan `0..1`.
- `latency_tier` se valida como `0..4` cuando está definido.
- Android admite los formatos de salida `pcm_16000`, `pcm_22050`, `pcm_24000` y `pcm_44100` para streaming AudioTrack de baja latencia.

## Relacionado

- [Activación por voz](/es/nodes/voicewake)
- [Audio y notas de voz](/es/nodes/audio)
- [Comprensión de medios](/es/nodes/media-understanding)
