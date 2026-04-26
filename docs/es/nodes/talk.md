---
read_when:
    - Implementar el modo Talk en macOS/iOS/Android
    - Cambiar el comportamiento de voz/TTS/interrupción
summary: 'Modo Talk: conversaciones de voz continuas con proveedores de TTS configurados'
title: Modo Talk
x-i18n:
    generated_at: "2026-04-26T11:33:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: afdddaa81c0a09076eaeeafd25295b0c02681f03b273ec4afe4ea2afa692dc2a
    source_path: nodes/talk.md
    workflow: 15
---

El modo Talk es un bucle continuo de conversación por voz:

1. Escuchar el habla
2. Enviar la transcripción al modelo (sesión principal, `chat.send`)
3. Esperar la respuesta
4. Reproducirla mediante el proveedor Talk configurado (`talk.speak`)

## Comportamiento (macOS)

- **Superposición siempre activa** mientras el modo Talk está habilitado.
- Transiciones de fase **Escuchando → Pensando → Hablando**.
- Ante una **pausa breve** (ventana de silencio), se envía la transcripción actual.
- Las respuestas se **escriben en WebChat** (igual que al teclear).
- **Interrumpir al hablar** (activado por defecto): si el usuario empieza a hablar mientras el asistente está hablando, detenemos la reproducción y anotamos la marca de tiempo de la interrupción para el siguiente prompt.

## Directivas de voz en las respuestas

El asistente puede anteponer a su respuesta una **única línea JSON** para controlar la voz:

```json
{ "voice": "<voice-id>", "once": true }
```

Reglas:

- Solo la primera línea no vacía.
- Las claves desconocidas se ignoran.
- `once: true` se aplica solo a la respuesta actual.
- Sin `once`, la voz se convierte en el nuevo valor predeterminado del modo Talk.
- La línea JSON se elimina antes de la reproducción TTS.

Claves compatibles:

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
  },
}
```

Valores predeterminados:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: cuando no está configurado, Talk mantiene la ventana de pausa predeterminada de la plataforma antes de enviar la transcripción (`700 ms en macOS y Android, 900 ms en iOS`)
- `provider`: selecciona el proveedor Talk activo. Usa `elevenlabs`, `mlx` o `system` para las rutas de reproducción local en macOS.
- `providers.<provider>.voiceId`: usa como respaldo `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` para ElevenLabs (o la primera voz de ElevenLabs cuando hay una clave API disponible).
- `providers.elevenlabs.modelId`: usa `eleven_v3` por defecto cuando no está configurado.
- `providers.mlx.modelId`: usa `mlx-community/Soprano-80M-bf16` por defecto cuando no está configurado.
- `providers.elevenlabs.apiKey`: usa como respaldo `ELEVENLABS_API_KEY` (o el perfil de shell del Gateway si está disponible).
- `speechLocale`: id de locale BCP 47 opcional para el reconocimiento de voz Talk en el dispositivo en iOS/macOS. Déjalo sin configurar para usar el valor predeterminado del dispositivo.
- `outputFormat`: usa `pcm_44100` por defecto en macOS/iOS y `pcm_24000` en Android (establece `mp3_*` para forzar transmisión MP3)

## IU de macOS

- Conmutador de la barra de menú: **Talk**
- Pestaña de configuración: grupo **Modo Talk** (id de voz + conmutador de interrupción)
- Superposición:
  - **Escuchando**: la nube pulsa con el nivel del micrófono
  - **Pensando**: animación de hundimiento
  - **Hablando**: anillos radiantes
  - Clic en la nube: detener el habla
  - Clic en X: salir del modo Talk

## IU de Android

- Conmutador en la pestaña Voz: **Talk**
- **Mic** manual y **Talk** son modos de captura en tiempo de ejecución mutuamente excluyentes.
- Mic manual se detiene cuando la app sale del primer plano o el usuario abandona la pestaña Voz.
- El modo Talk sigue ejecutándose hasta que se desactiva o el Node Android se desconecta, y usa el tipo de servicio en primer plano de micrófono de Android mientras está activo.

## Notas

- Requiere permisos de Voz + Micrófono.
- Usa `chat.send` contra la clave de sesión `main`.
- El gateway resuelve la reproducción Talk mediante `talk.speak` usando el proveedor Talk activo. Android recurre a TTS local del sistema solo cuando ese RPC no está disponible.
- La reproducción MLX local en macOS usa el helper incluido `openclaw-mlx-tts` cuando está presente, o un ejecutable en `PATH`. Establece `OPENCLAW_MLX_TTS_BIN` para apuntar a un binario helper personalizado durante el desarrollo.
- `stability` para `eleven_v3` se valida a `0.0`, `0.5` o `1.0`; otros modelos aceptan `0..1`.
- `latency_tier` se valida a `0..4` cuando está configurado.
- Android admite formatos de salida `pcm_16000`, `pcm_22050`, `pcm_24000` y `pcm_44100` para transmisión AudioTrack de baja latencia.

## Relacionado

- [Voice wake](/es/nodes/voicewake)
- [Audio y notas de voz](/es/nodes/audio)
- [Comprensión de medios](/es/nodes/media-understanding)
