---
read_when:
    - Trabajando en rutas de activación por voz o PTT
summary: Modos de activación por voz y pulsar para hablar, además de detalles de enrutamiento en la aplicación de Mac
title: Activación por voz (macOS)
x-i18n:
    generated_at: "2026-06-27T12:04:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 33c6132d03efb837ae06f4810ff87eb981ad742d793657bc607f4ec214bc2afa
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Activación por voz y pulsar para hablar

## Requisitos

La activación por voz y pulsar para hablar requieren macOS 26 o una versión más reciente. En versiones anteriores de macOS,
los controles están ocultos en la página de ajustes de Voz, que muestra el requisito de macOS 26.

## Modos

- **Modo de palabra de activación** (predeterminado): el reconocedor de voz siempre activo espera tokens de activación (`swabbleTriggerWords`). Cuando hay coincidencia, inicia la captura, muestra la superposición con texto parcial y envía automáticamente tras el silencio.
- **Pulsar para hablar (mantener Opción derecha)**: mantén pulsada la tecla Opción derecha para capturar de inmediato, sin activación necesaria. La superposición aparece mientras se mantiene pulsada; al soltar, finaliza y reenvía tras un breve retraso para que puedas ajustar el texto.

## Comportamiento en tiempo de ejecución (palabra de activación)

- El reconocedor de voz vive en `VoiceWakeRuntime`.
- La activación solo se dispara cuando hay una **pausa significativa** entre la palabra de activación y la palabra siguiente (intervalo de ~0,55 s). La superposición/el timbre puede empezar en la pausa, incluso antes de que comience el comando.
- Ventanas de silencio: 2,0 s cuando el habla está fluyendo, 5,0 s si solo se oyó la activación.
- Parada forzada: 120 s para evitar sesiones descontroladas.
- Antirrebote entre sesiones: 350 ms.
- La superposición se controla mediante `VoiceWakeOverlayController` con coloreado confirmado/volátil.
- Tras enviar, el reconocedor se reinicia limpiamente para escuchar la siguiente activación.

## Invariantes del ciclo de vida

- Si la activación por voz está habilitada y los permisos están concedidos, el reconocedor de palabra de activación debería estar escuchando (excepto durante una captura explícita de pulsar para hablar).
- La visibilidad de la superposición (incluido el descarte manual mediante el botón X) nunca debe impedir que el reconocedor se reanude.

## Modo de fallo de superposición persistente (anterior)

Antes, si la superposición se quedaba visible y la cerrabas manualmente, la activación por voz podía parecer "muerta" porque el intento de reinicio del tiempo de ejecución podía quedar bloqueado por la visibilidad de la superposición y no se programaba ningún reinicio posterior.

Endurecimiento:

- El reinicio del tiempo de ejecución de activación ya no está bloqueado por la visibilidad de la superposición.
- La finalización del descarte de la superposición dispara un `VoiceWakeRuntime.refresh(...)` mediante `VoiceSessionCoordinator`, de modo que descartar manualmente con X siempre reanuda la escucha.

## Detalles de pulsar para hablar

- La detección de la tecla rápida usa un monitor global `.flagsChanged` para **Opción derecha** (`keyCode 61` + `.option`). Solo observamos eventos (sin tragarlos).
- La canalización de captura vive en `VoicePushToTalk`: inicia Voz de inmediato, transmite parciales a la superposición y llama a `VoiceWakeForwarder` al soltar.
- Cuando comienza pulsar para hablar, pausamos el tiempo de ejecución de palabra de activación para evitar tomas de audio en duelo; se reinicia automáticamente tras soltar.
- Permisos: requiere Micrófono + Voz; ver eventos necesita aprobación de Accesibilidad/Monitorización de entrada.
- Teclados externos: algunos pueden no exponer Opción derecha como se espera; ofrece un atajo alternativo si los usuarios informan de fallos.

## Ajustes visibles para el usuario

- Conmutador **Activación por voz**: habilita el tiempo de ejecución de palabra de activación.
- **Mantener Opción derecha para hablar**: habilita el monitor de pulsar para hablar.
- Selectores de idioma y micrófono, medidor de nivel en vivo, tabla de palabras de activación, probador (solo local; no reenvía).
- El selector de micrófono conserva la última selección si un dispositivo se desconecta, muestra una indicación de desconectado y vuelve temporalmente al valor predeterminado del sistema hasta que regrese.
- **Sonidos**: timbres al detectar activación y al enviar; el valor predeterminado es el sonido del sistema "Glass" de macOS. Puedes elegir cualquier archivo cargable por `NSSound` (p. ej., MP3/WAV/AIFF) para cada evento o elegir **Sin sonido**.

## Comportamiento de reenvío

- Cuando la activación por voz está habilitada, las transcripciones se reenvían al Gateway/agente activo (el mismo modo local frente a remoto que usa el resto de la aplicación de Mac).
- Las respuestas se entregan al **proveedor principal usado por última vez** (WhatsApp/Telegram/Discord/WebChat). Si la entrega falla, el error se registra y la ejecución sigue visible mediante WebChat/registros de sesión.

## Carga útil de reenvío

- `VoiceWakeForwarder.prefixedTranscript(_:)` antepone la sugerencia de máquina antes de enviar. Se comparte entre las rutas de palabra de activación y pulsar para hablar.

## Verificación rápida

- Activa pulsar para hablar, mantén Opción derecha, habla y suelta: la superposición debería mostrar parciales y luego enviar.
- Mientras mantienes pulsado, las orejas de la barra de menús deberían permanecer agrandadas (usa `triggerVoiceEars(ttl:nil)`); se reducen tras soltar.

## Relacionado

- [Activación por voz](/es/nodes/voicewake)
- [Superposición de voz](/es/platforms/mac/voice-overlay)
- [Aplicación de macOS](/es/platforms/macos)
