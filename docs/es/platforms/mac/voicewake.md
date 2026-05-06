---
read_when:
    - Trabajar en las rutas de activación por voz o PTT
summary: Modos de activación por voz y pulsar para hablar, además de detalles de enrutamiento en la aplicación para Mac
title: Activación por voz (macOS)
x-i18n:
    generated_at: "2026-05-06T09:05:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 312895b5767c447233bd77cbcd48ea81bb6c700080abc31974188b610a1b1ef0
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Activación por voz y pulsar para hablar

## Modos

- **Modo de palabra de activación** (predeterminado): el reconocedor de voz siempre activo espera tokens de activación (`swabbleTriggerWords`). Cuando hay una coincidencia, inicia la captura, muestra la superposición con texto parcial y envía automáticamente después del silencio.
- **Pulsar para hablar (mantener Opción derecha)**: mantén pulsada la tecla Opción derecha para capturar inmediatamente, sin activación necesaria. La superposición aparece mientras se mantiene pulsada; al soltar, finaliza y reenvía después de un breve retraso para que puedas ajustar el texto.

## Comportamiento en tiempo de ejecución (palabra de activación)

- El reconocedor de voz reside en `VoiceWakeRuntime`.
- La activación solo se dispara cuando hay una **pausa significativa** entre la palabra de activación y la siguiente palabra (separación de ~0.55 s). La superposición/el timbre puede comenzar en la pausa incluso antes de que empiece el comando.
- Ventanas de silencio: 2.0 s cuando el habla fluye, 5.0 s si solo se oyó la activación.
- Parada forzada: 120 s para evitar sesiones descontroladas.
- Antirrebote entre sesiones: 350 ms.
- La superposición se controla mediante `VoiceWakeOverlayController` con coloreado confirmado/volátil.
- Después de enviar, el reconocedor se reinicia limpiamente para escuchar la siguiente activación.

## Invariantes del ciclo de vida

- Si la activación por voz está habilitada y se han concedido los permisos, el reconocedor de palabra de activación debería estar escuchando (excepto durante una captura explícita de pulsar para hablar).
- La visibilidad de la superposición (incluido el cierre manual mediante el botón X) nunca debe impedir que el reconocedor se reanude.

## Modo de fallo de superposición persistente (anterior)

Anteriormente, si la superposición se quedaba bloqueada visible y la cerrabas manualmente, la activación por voz podía parecer "muerta" porque el intento de reinicio del tiempo de ejecución podía quedar bloqueado por la visibilidad de la superposición y no se programaba ningún reinicio posterior.

Refuerzo:

- El reinicio del tiempo de ejecución de activación ya no queda bloqueado por la visibilidad de la superposición.
- La finalización del cierre de la superposición activa un `VoiceWakeRuntime.refresh(...)` mediante `VoiceSessionCoordinator`, por lo que el cierre manual con X siempre reanuda la escucha.

## Detalles de pulsar para hablar

- La detección de atajos usa un monitor global `.flagsChanged` para **Opción derecha** (`keyCode 61` + `.option`). Solo observamos eventos (sin interceptarlos).
- La canalización de captura reside en `VoicePushToTalk`: inicia Speech inmediatamente, transmite parciales a la superposición y llama a `VoiceWakeForwarder` al soltar.
- Cuando se inicia pulsar para hablar, pausamos el tiempo de ejecución de palabra de activación para evitar tomas de audio en conflicto; se reinicia automáticamente después de soltar.
- Permisos: requiere Micrófono + Speech; ver eventos requiere aprobación de Accesibilidad/Monitoreo de entrada.
- Teclados externos: algunos pueden no exponer Opción derecha como se espera; ofrece un atajo alternativo si los usuarios informan omisiones.

## Ajustes visibles para el usuario

- Interruptor **Activación por voz**: habilita el tiempo de ejecución de palabra de activación.
- **Mantener Cmd+Fn para hablar**: habilita el monitor de pulsar para hablar. Deshabilitado en macOS < 26.
- Selectores de idioma y micrófono, medidor de nivel en vivo, tabla de palabras de activación, probador (solo local; no reenvía).
- El selector de micrófono conserva la última selección si un dispositivo se desconecta, muestra una pista de desconexión y recurre temporalmente al valor predeterminado del sistema hasta que regresa.
- **Sonidos**: timbres al detectar la activación y al enviar; el valor predeterminado es el sonido del sistema "Glass" de macOS. Puedes elegir cualquier archivo cargable con `NSSound` (por ejemplo, MP3/WAV/AIFF) para cada evento o elegir **Sin sonido**.

## Comportamiento de reenvío

- Cuando la activación por voz está habilitada, las transcripciones se reenvían al Gateway/agente activo (el mismo modo local frente a remoto que usa el resto de la app para Mac).
- Las respuestas se entregan al **proveedor principal usado por última vez** (WhatsApp/Telegram/Discord/WebChat). Si la entrega falla, el error se registra y la ejecución sigue visible mediante WebChat/registros de sesión.

## Carga útil de reenvío

- `VoiceWakeForwarder.prefixedTranscript(_:)` antepone la pista de la máquina antes de enviar. Se comparte entre las rutas de palabra de activación y de pulsar para hablar.

## Verificación rápida

- Activa pulsar para hablar, mantén Cmd+Fn, habla, suelta: la superposición debería mostrar parciales y luego enviar.
- Mientras mantienes pulsado, las orejas de la barra de menús deberían permanecer ampliadas (usa `triggerVoiceEars(ttl:nil)`); se reducen después de soltar.

## Relacionado

- [Activación por voz](/es/nodes/voicewake)
- [Superposición de voz](/es/platforms/mac/voice-overlay)
- [App de macOS](/es/platforms/macos)
