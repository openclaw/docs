---
read_when:
    - Implementación del modo de conversación en macOS/iOS/Android
    - Cambiar el comportamiento de voz/TTS/interrupción
summary: 'Modo de conversación: conversaciones de voz continuas con STT/TTS local y voz en tiempo real'
title: Modo de conversación
x-i18n:
    generated_at: "2026-05-11T20:41:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 28e5feae8af8ff89472dfb73c44c590b2f7fab3c0ca335b67603c7fd9d50dfe7
    source_path: nodes/talk.md
    workflow: 16
---

El modo Talk tiene dos formas de runtime:

- Talk nativo de macOS/iOS/Android usa reconocimiento de voz local, chat de Gateway y TTS `talk.speak`. Los nodos anuncian la capacidad `talk` y declaran los comandos `talk.*` que admiten.
- Talk del navegador usa `talk.client.create` para sesiones `webrtc` y `provider-websocket` propiedad del cliente, o `talk.session.create` para sesiones `gateway-relay` propiedad de Gateway. `managed-room` está reservado para la transferencia de Gateway y salas tipo walkie-talkie.
- Los clientes solo de transcripción usan `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, luego `talk.session.appendAudio`, `talk.session.cancelTurn` y `talk.session.close` cuando necesitan subtítulos o dictado sin una respuesta de voz del asistente.

Talk nativo es un bucle continuo de conversación por voz:

1. Escuchar voz
2. Enviar la transcripción al modelo mediante la sesión activa
3. Esperar la respuesta
4. Reproducirla mediante el proveedor de Talk configurado (`talk.speak`)

Talk en tiempo real del navegador reenvía llamadas de herramientas del proveedor mediante `talk.client.toolCall`; los clientes de navegador no llaman directamente a `chat.send` para consultas en tiempo real.

Talk solo de transcripción emite el mismo sobre común de eventos de Talk que las sesiones en tiempo real y STT/TTS, pero usa `mode: "transcription"` y `brain: "none"`. Está pensado para subtítulos, dictado y captura de voz solo de observación; las notas de voz subidas de una sola vez siguen usando la ruta de medios/audio.

## Comportamiento (macOS)

- **Superposición siempre activa** mientras el modo Talk está habilitado.
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
- Sin `once`, la voz se convierte en el nuevo valor predeterminado para el modo Talk.
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
- `silenceTimeoutMs`: cuando no está definido, Talk conserva la ventana de pausa predeterminada de la plataforma antes de enviar la transcripción (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: selecciona el proveedor de Talk activo. Usa `elevenlabs`, `mlx` o `system` para las rutas de reproducción locales de macOS.
- `providers.<provider>.voiceId`: recurre a `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` para ElevenLabs (o a la primera voz de ElevenLabs cuando hay una clave de API disponible).
- `providers.elevenlabs.modelId`: usa `eleven_v3` de forma predeterminada cuando no está definido.
- `providers.mlx.modelId`: usa `mlx-community/Soprano-80M-bf16` de forma predeterminada cuando no está definido.
- `providers.elevenlabs.apiKey`: recurre a `ELEVENLABS_API_KEY` (o al perfil de shell de Gateway si está disponible).
- `consultThinkingLevel`: reemplazo opcional del nivel de pensamiento para la ejecución completa del agente de OpenClaw detrás de las llamadas `openclaw_agent_consult` en tiempo real.
- `consultFastMode`: reemplazo opcional del modo rápido para las llamadas `openclaw_agent_consult` en tiempo real.
- `realtime.provider`: selecciona el proveedor activo de voz en tiempo real de navegador/servidor. Usa `openai` para WebRTC, `google` para WebSocket del proveedor, o un proveedor solo de puente mediante relay de Gateway.
- `realtime.providers.<provider>` almacena la configuración en tiempo real propiedad del proveedor. El navegador recibe solo credenciales de sesión efímeras o restringidas, nunca una clave de API estándar.
- `realtime.providers.openai.voice`: id de voz integrado de OpenAI Realtime. Las voces actuales de `gpt-realtime-2` son `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` y `cedar`; se recomiendan `marin` y `cedar` para obtener la mejor calidad.
- `realtime.brain`: `agent-consult` enruta las llamadas de herramientas en tiempo real mediante la política de Gateway; `direct-tools` es un comportamiento de compatibilidad solo para el propietario; `none` es para transcripción u orquestación externa.
- `realtime.instructions`: agrega instrucciones de sistema orientadas al proveedor al prompt en tiempo real integrado de OpenClaw. Úsalo para el estilo y tono de voz; OpenClaw conserva la guía predeterminada de `openclaw_agent_consult`.
- `talk.catalog` expone los modos válidos, transportes, estrategias de brain, formatos de audio en tiempo real y banderas de capacidad de cada proveedor para que los clientes Talk de primera parte puedan evitar combinaciones no admitidas.
- Los proveedores de transcripción en streaming se descubren mediante `talk.catalog.transcription`. El relay actual de Gateway usa la configuración del proveedor de streaming de Voice Call hasta que se agregue la superficie de configuración dedicada de transcripción de Talk.
- `speechLocale`: id de locale BCP 47 opcional para el reconocimiento de voz Talk en el dispositivo en iOS/macOS. Déjalo sin definir para usar el valor predeterminado del dispositivo.
- `outputFormat`: usa `pcm_44100` de forma predeterminada en macOS/iOS y `pcm_24000` en Android (configura `mp3_*` para forzar streaming MP3)

## UI de macOS

- Alternancia de la barra de menús: **Talk**
- Pestaña de configuración: grupo **Talk Mode** (id de voz + alternancia de interrupción)
- Superposición:
  - **Escuchando**: la nube pulsa con el nivel del micrófono
  - **Pensando**: animación de hundimiento
  - **Hablando**: anillos radiantes
  - Clic en la nube: dejar de hablar
  - Clic en X: salir del modo Talk

## UI de Android

- Alternancia de la pestaña de voz: **Talk**
- **Mic** manual y **Talk** son modos de captura de runtime mutuamente excluyentes.
- Mic manual se detiene cuando la app deja el primer plano o el usuario sale de la pestaña Voz.
- Talk Mode sigue ejecutándose hasta que se desactiva o el nodo Android se desconecta, y usa el tipo de servicio en primer plano de micrófono de Android mientras está activo.

## Notas

- Requiere permisos de Voz + Micrófono.
- Talk nativo usa la sesión activa de Gateway y solo recurre al sondeo del historial cuando los eventos de respuesta no están disponibles.
- Talk en tiempo real del navegador usa `talk.client.toolCall` para `openclaw_agent_consult` en lugar de exponer `chat.send` a sesiones de navegador propiedad del proveedor.
- Talk solo de transcripción usa `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` y `talk.session.close`; los clientes se suscriben a `talk.event` para actualizaciones parciales/finales de la transcripción.
- El gateway resuelve la reproducción de Talk mediante `talk.speak` usando el proveedor de Talk activo. Android solo recurre al TTS local del sistema cuando ese RPC no está disponible.
- La reproducción MLX local de macOS usa el helper incluido `openclaw-mlx-tts` cuando está presente, o un ejecutable en `PATH`. Configura `OPENCLAW_MLX_TTS_BIN` para apuntar a un binario helper personalizado durante el desarrollo.
- `stability` para `eleven_v3` se valida como `0.0`, `0.5` o `1.0`; otros modelos aceptan `0..1`.
- `latency_tier` se valida como `0..4` cuando está configurado.
- Android admite los formatos de salida `pcm_16000`, `pcm_22050`, `pcm_24000` y `pcm_44100` para streaming AudioTrack de baja latencia.

## Relacionado

- [Activación por voz](/es/nodes/voicewake)
- [Audio y notas de voz](/es/nodes/audio)
- [Comprensión de medios](/es/nodes/media-understanding)
