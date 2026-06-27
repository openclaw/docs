---
read_when:
    - Implementación del modo Conversación en macOS/iOS/Android
    - Cambiar el comportamiento de voz/TTS/interrupción
summary: 'Modo conversación: conversaciones de voz continuas mediante STT/TTS local y voz en tiempo real'
title: Modo de conversación
x-i18n:
    generated_at: "2026-06-27T11:55:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 47ae6c1abc763688ab5bbea1c23c9f4f27fe2f4b13cfade61917f5a1a912f057
    source_path: nodes/talk.md
    workflow: 16
---

El modo Hablar tiene dos formas de ejecución:

- Hablar nativo de macOS/iOS/Android usa reconocimiento de voz local, chat de Gateway y TTS `talk.speak`. Los nodos anuncian la capacidad `talk` y declaran los comandos `talk.*` que admiten.
- Hablar en navegador usa `talk.client.create` para sesiones `webrtc` y `provider-websocket` propiedad del cliente, o `talk.session.create` para sesiones `gateway-relay` propiedad de Gateway. `managed-room` está reservado para la transferencia de Gateway y salas de walkie-talkie.
- Hablar en Android puede optar por sesiones de retransmisión en tiempo real propiedad de Gateway con `talk.realtime.mode: "realtime"` y `talk.realtime.transport: "gateway-relay"`. De lo contrario, permanece en reconocimiento de voz nativo, chat de Gateway y `talk.speak`.
- Los clientes de solo transcripción usan `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, luego `talk.session.appendAudio`, `talk.session.cancelTurn` y `talk.session.close` cuando necesitan subtítulos o dictado sin una respuesta de voz del asistente.

Hablar nativo es un bucle continuo de conversación por voz:

1. Escuchar habla
2. Enviar la transcripción al modelo mediante la sesión activa
3. Esperar la respuesta
4. Reproducirla mediante el proveedor de Hablar configurado (`talk.speak`)

Hablar en tiempo real en navegador reenvía las llamadas a herramientas del proveedor mediante `talk.client.toolCall`; los clientes de navegador no llaman a `chat.send` directamente para consultas en tiempo real.
Mientras una consulta en tiempo real está activa, los clientes de Hablar pueden usar `talk.client.steer` o
`talk.session.steer` para clasificar la entrada hablada como `status`, `steer`, `cancel` o
`followup`. La orientación aceptada se encola en la ejecución integrada activa; la orientación
rechazada devuelve un motivo estructurado como `no_active_run`, `not_streaming`
o `compacting`.

Hablar de solo transcripción emite el mismo sobre común de eventos de Hablar que las sesiones en tiempo real y STT/TTS, pero usa `mode: "transcription"` y `brain: "none"`. Es para subtítulos, dictado y captura de voz de solo observación; las notas de voz cargadas de una sola vez siguen usando la ruta de medios/audio.

## Comportamiento (macOS)

- **Superposición siempre activa** mientras el modo Hablar está habilitado.
- Transiciones de fase **Escuchando → Pensando → Hablando**.
- En una **pausa breve** (ventana de silencio), se envía la transcripción actual.
- Las respuestas se **escriben en WebChat** (igual que al escribir).
- **Interrumpir al hablar** (activado de forma predeterminada): si el usuario empieza a hablar mientras el asistente está hablando, detenemos la reproducción y registramos la marca de tiempo de la interrupción para el siguiente prompt.

## Directivas de voz en las respuestas

El asistente puede anteponer a su respuesta una **única línea JSON** para controlar la voz:

```json
{ "voice": "<voice-id>", "once": true }
```

Reglas:

- Solo la primera línea no vacía.
- Las claves desconocidas se ignoran.
- `once: true` se aplica solo a la respuesta actual.
- Sin `once`, la voz pasa a ser el nuevo valor predeterminado para el modo Hablar.
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
- `silenceTimeoutMs`: cuando no se establece, Hablar conserva la ventana de pausa predeterminada de la plataforma antes de enviar la transcripción (`700 ms en macOS y Android, 900 ms en iOS`)
- `provider`: selecciona el proveedor de Hablar activo. Usa `elevenlabs`, `mlx` o `system` para las rutas de reproducción locales de macOS.
- `providers.<provider>.voiceId`: recurre a `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` para ElevenLabs (o a la primera voz de ElevenLabs cuando hay una clave de API disponible).
- `providers.elevenlabs.modelId`: usa `eleven_v3` de forma predeterminada cuando no se establece.
- `providers.mlx.modelId`: usa `mlx-community/Soprano-80M-bf16` de forma predeterminada cuando no se establece.
- `providers.elevenlabs.apiKey`: recurre a `ELEVENLABS_API_KEY` (o al perfil de shell de gateway si está disponible).
- `consultThinkingLevel`: anulación opcional del nivel de pensamiento para la ejecución completa del agente de OpenClaw detrás de las llamadas `openclaw_agent_consult` en tiempo real.
- `consultFastMode`: anulación opcional del modo rápido para llamadas `openclaw_agent_consult` en tiempo real.
- `realtime.provider`: selecciona el proveedor activo de voz en tiempo real de navegador/servidor. Usa `openai` para WebRTC, `google` para WebSocket de proveedor, o un proveedor solo de puente mediante la retransmisión de Gateway.
- `realtime.providers.<provider>` almacena la configuración en tiempo real propiedad del proveedor. El navegador recibe solo credenciales de sesión efímeras o restringidas, nunca una clave de API estándar.
- `realtime.providers.openai.voice`: id de voz integrada de OpenAI Realtime. Las voces actuales de `gpt-realtime-2` son `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` y `cedar`; `marin` y `cedar` se recomiendan para la mejor calidad.
- `realtime.transport`: `webrtc` y `provider-websocket` son transportes en tiempo real de navegador. Android usa la retransmisión en tiempo real solo cuando esto es `gateway-relay`; de lo contrario, Hablar en Android usa su bucle STT/TTS nativo.
- `realtime.brain`: `agent-consult` enruta las llamadas a herramientas en tiempo real mediante la política de Gateway; `direct-tools` es el comportamiento heredado de compatibilidad de herramientas directas; `none` es para transcripción u orquestación externa.
- `realtime.consultRouting`: `provider-direct` preserva la respuesta directa del proveedor cuando omite `openclaw_agent_consult`; `force-agent-consult` hace que la retransmisión de Gateway enrute las transcripciones de usuario finalizadas mediante OpenClaw en su lugar.
- `realtime.instructions`: agrega instrucciones del sistema orientadas al proveedor al prompt en tiempo real integrado de OpenClaw. Úsalo para el estilo y tono de voz; OpenClaw conserva la guía predeterminada de `openclaw_agent_consult`.
- `talk.catalog` expone los modos, transportes, estrategias de cerebro, formatos de audio en tiempo real y marcas de capacidad válidos de cada proveedor para que los clientes de Hablar de primera parte puedan evitar combinaciones no admitidas.
- Los proveedores de transcripción en streaming se descubren mediante `talk.catalog.transcription`. La retransmisión actual de Gateway usa la configuración del proveedor de streaming de Voice Call hasta que se agregue la superficie de configuración dedicada de transcripción de Hablar.
- `speechLocale`: id de locale BCP 47 opcional para el reconocimiento de voz de Hablar en el dispositivo en iOS/macOS. Déjalo sin establecer para usar el valor predeterminado del dispositivo.
- `outputFormat`: usa `pcm_44100` de forma predeterminada en macOS/iOS y `pcm_24000` en Android (establece `mp3_*` para forzar streaming MP3)

## IU de macOS

- Alternador de la barra de menús: **Hablar**
- Pestaña de configuración: grupo **Modo Hablar** (id de voz + alternador de interrupción)
- Superposición:
  - **Escuchando**: la nube pulsa con el nivel del micrófono
  - **Pensando**: animación de hundimiento
  - **Hablando**: anillos radiantes
  - Clic en la nube: detener el habla
  - Clic en X: salir del modo Hablar

## IU de Android

- Alternador de la pestaña Voz: **Hablar**
- **Mic** manual y **Hablar** son modos de captura de ejecución mutuamente excluyentes.
- Mic manual se detiene cuando la app sale del primer plano o el usuario abandona la pestaña Voz.
- El modo Hablar sigue ejecutándose hasta que se desactiva o el nodo Android se desconecta, y usa el tipo de servicio en primer plano de micrófono de Android mientras está activo.

## Notas

- Requiere permisos de Voz + Micrófono.
- Hablar nativo usa la sesión activa de Gateway y solo recurre al sondeo de historial cuando los eventos de respuesta no están disponibles.
- Hablar en tiempo real en navegador usa `talk.client.toolCall` para `openclaw_agent_consult` en lugar de exponer `chat.send` a sesiones de navegador propiedad del proveedor.
- Hablar de solo transcripción usa `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` y `talk.session.close`; los clientes se suscriben a `talk.event` para actualizaciones parciales/finales de transcripción.
- El gateway resuelve la reproducción de Hablar mediante `talk.speak` usando el proveedor de Hablar activo. Android recurre a TTS del sistema local solo cuando ese RPC no está disponible.
- La reproducción local MLX de macOS usa el ayudante incluido `openclaw-mlx-tts` cuando está presente, o un ejecutable en `PATH`. Establece `OPENCLAW_MLX_TTS_BIN` para apuntar a un binario de ayudante personalizado durante el desarrollo.
- `stability` para `eleven_v3` se valida como `0.0`, `0.5` o `1.0`; otros modelos aceptan `0..1`.
- `latency_tier` se valida como `0..4` cuando se establece.
- Android admite formatos de salida `pcm_16000`, `pcm_22050`, `pcm_24000` y `pcm_44100` para streaming AudioTrack de baja latencia.

## Relacionado

- [Activación por voz](/es/nodes/voicewake)
- [Audio y notas de voz](/es/nodes/audio)
- [Comprensión de medios](/es/nodes/media-understanding)
