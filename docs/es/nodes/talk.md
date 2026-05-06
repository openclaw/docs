---
read_when:
    - Implementación del modo de conversación en macOS/iOS/Android
    - Cambiar el comportamiento de voz/TTS/interrupción
summary: 'Modo de conversación: conversaciones de voz continuas con STT/TTS local y voz en tiempo real'
title: Modo de conversación
x-i18n:
    generated_at: "2026-05-06T05:41:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: a04304a1dd6c3feefa89c0c8c66f8026a7d28b573776fcf14237c3481fbc772a
    source_path: nodes/talk.md
    workflow: 16
---

El modo de voz tiene dos formas de runtime:

- La voz nativa en macOS/iOS/Android usa reconocimiento de voz local, chat del Gateway y TTS `talk.speak`. Los nodos anuncian la capacidad `talk` y declaran los comandos `talk.*` que admiten.
- La voz en navegador usa `talk.client.create` para sesiones `webrtc` y `provider-websocket` propiedad del cliente, o `talk.session.create` para sesiones `gateway-relay` propiedad del Gateway. `managed-room` está reservado para la transferencia del Gateway y las salas de walkie-talkie.
- Los clientes solo de transcripción usan `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, luego `talk.session.appendAudio`, `talk.session.cancelTurn` y `talk.session.close` cuando necesitan subtítulos o dictado sin una respuesta de voz del asistente.

La voz nativa es un bucle continuo de conversación por voz:

1. Escuchar el habla
2. Enviar la transcripción al modelo mediante la sesión activa
3. Esperar la respuesta
4. Reproducirla mediante el proveedor de voz configurado (`talk.speak`)

La voz realtime en navegador reenvía las llamadas a herramientas del proveedor mediante `talk.client.toolCall`; los clientes de navegador no llaman a `chat.send` directamente para consultas realtime.

La voz solo de transcripción emite el mismo envoltorio común de eventos de voz que las sesiones realtime y STT/TTS, pero usa `mode: "transcription"` y `brain: "none"`. Es para subtítulos, dictado y captura de voz solo de observación; las notas de voz cargadas de una sola vez siguen usando la ruta de medios/audio.

## Comportamiento (macOS)

- **Superposición siempre visible** mientras el modo de voz está habilitado.
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
- Sin `once`, la voz pasa a ser el nuevo valor predeterminado para el modo de voz.
- La línea JSON se elimina antes de la reproducción TTS.

Claves admitidas:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (PPM), `stability`, `similarity`, `style`, `speakerBoost`
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
          model: "gpt-realtime",
          voice: "alloy",
        },
      },
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

Valores predeterminados:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: cuando no está definido, la voz mantiene la ventana de pausa predeterminada de la plataforma antes de enviar la transcripción (`700 ms en macOS y Android, 900 ms en iOS`)
- `provider`: selecciona el proveedor de voz activo. Usa `elevenlabs`, `mlx` o `system` para las rutas de reproducción locales de macOS.
- `providers.<provider>.voiceId`: recurre a `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` para ElevenLabs (o a la primera voz de ElevenLabs cuando hay una clave de API disponible).
- `providers.elevenlabs.modelId`: el valor predeterminado es `eleven_v3` cuando no está definido.
- `providers.mlx.modelId`: el valor predeterminado es `mlx-community/Soprano-80M-bf16` cuando no está definido.
- `providers.elevenlabs.apiKey`: recurre a `ELEVENLABS_API_KEY` (o al perfil de shell del Gateway si está disponible).
- `realtime.provider`: selecciona el proveedor de voz realtime activo del navegador/servidor. Usa `openai` para WebRTC, `google` para WebSocket de proveedor, o un proveedor solo de puente mediante relay del Gateway.
- `realtime.providers.<provider>` almacena la configuración realtime propiedad del proveedor. El navegador recibe solo credenciales de sesión efímeras o restringidas, nunca una clave de API estándar.
- `realtime.brain`: `agent-consult` enruta las llamadas realtime a herramientas mediante la política del Gateway; `direct-tools` es un comportamiento de compatibilidad solo para propietarios; `none` es para transcripción u orquestación externa.
- `talk.catalog` expone los modos, transportes, estrategias de cerebro, formatos de audio realtime y banderas de capacidad válidos de cada proveedor para que los clientes de voz propios puedan evitar combinaciones no admitidas.
- Los proveedores de transcripción por streaming se descubren mediante `talk.catalog.transcription`. El relay actual del Gateway usa la configuración del proveedor de streaming de Voice Call hasta que se añada la superficie de configuración dedicada de transcripción de voz.
- `speechLocale`: id de configuración regional BCP 47 opcional para el reconocimiento de voz de voz en dispositivo en iOS/macOS. Déjalo sin definir para usar el valor predeterminado del dispositivo.
- `outputFormat`: el valor predeterminado es `pcm_44100` en macOS/iOS y `pcm_24000` en Android (define `mp3_*` para forzar streaming MP3)

## Interfaz de usuario de macOS

- Interruptor de la barra de menús: **Voz**
- Pestaña de configuración: grupo **Modo de voz** (id de voz + interruptor de interrupción)
- Superposición:
  - **Escuchando**: la nube pulsa con el nivel del micrófono
  - **Pensando**: animación descendente
  - **Hablando**: anillos radiantes
  - Clic en la nube: detener el habla
  - Clic en X: salir del modo de voz

## Interfaz de usuario de Android

- Interruptor de la pestaña de voz: **Voz**
- **Micrófono** manual y **Voz** son modos de captura runtime mutuamente excluyentes.
- Micrófono manual se detiene cuando la aplicación sale del primer plano o el usuario abandona la pestaña de voz.
- El modo de voz sigue ejecutándose hasta que se desactiva o el nodo Android se desconecta, y usa el tipo de servicio en primer plano de micrófono de Android mientras está activo.

## Notas

- Requiere permisos de voz y micrófono.
- La voz nativa usa la sesión activa del Gateway y solo recurre al sondeo del historial cuando los eventos de respuesta no están disponibles.
- La voz realtime en navegador usa `talk.client.toolCall` para `openclaw_agent_consult` en lugar de exponer `chat.send` a sesiones de navegador propiedad del proveedor.
- La voz solo de transcripción usa `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` y `talk.session.close`; los clientes se suscriben a `talk.event` para recibir actualizaciones parciales/finales de la transcripción.
- El gateway resuelve la reproducción de voz mediante `talk.speak` usando el proveedor de voz activo. Android recurre a TTS local del sistema solo cuando ese RPC no está disponible.
- La reproducción MLX local de macOS usa el helper `openclaw-mlx-tts` incluido cuando está presente, o un ejecutable en `PATH`. Define `OPENCLAW_MLX_TTS_BIN` para apuntar a un binario helper personalizado durante el desarrollo.
- `stability` para `eleven_v3` se valida como `0.0`, `0.5` o `1.0`; otros modelos aceptan `0..1`.
- `latency_tier` se valida como `0..4` cuando está definido.
- Android admite formatos de salida `pcm_16000`, `pcm_22050`, `pcm_24000` y `pcm_44100` para streaming AudioTrack de baja latencia.

## Relacionado

- [Activación por voz](/es/nodes/voicewake)
- [Audio y notas de voz](/es/nodes/audio)
- [Comprensión de medios](/es/nodes/media-understanding)
