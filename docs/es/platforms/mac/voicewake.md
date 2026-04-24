---
read_when:
    - Trabajar en rutas de activación por voz o PTT
summary: Modos de activación por voz y pulsar para hablar, además de detalles de enrutamiento en la app de macOS
title: Voice wake (macOS)
x-i18n:
    generated_at: "2026-04-24T05:38:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0273c24764f0baf440a19f31435d6ee62ab040c1ec5a97d7733d3ec8b81b0641
    source_path: platforms/mac/voicewake.md
    workflow: 15
---

# Activación por voz y pulsar para hablar

## Modos

- **Modo de palabra de activación** (predeterminado): el reconocedor de voz siempre activo espera tokens de activación (`swabbleTriggerWords`). Al detectarlos, inicia la captura, muestra la superposición con texto parcial y envía automáticamente tras un período de silencio.
- **Pulsar para hablar (mantener Option derecha)**: mantén pulsada la tecla Option derecha para capturar de inmediato, sin activación. La superposición aparece mientras se mantiene pulsada; al soltarla, se finaliza y se reenvía tras un breve retraso para que puedas ajustar el texto.

## Comportamiento en runtime (palabra de activación)

- El reconocedor de voz vive en `VoiceWakeRuntime`.
- La activación solo se dispara cuando hay una **pausa significativa** entre la palabra de activación y la siguiente palabra (separación de ~0,55 s). La superposición/tono puede comenzar en la pausa incluso antes de que empiece el comando.
- Ventanas de silencio: 2,0 s cuando el habla fluye, 5,0 s si solo se oyó el disparador.
- Detención forzada: 120 s para evitar sesiones descontroladas.
- Debounce entre sesiones: 350 ms.
- La superposición se controla mediante `VoiceWakeOverlayController` con coloración comprometida/volátil.
- Tras el envío, el reconocedor se reinicia limpiamente para escuchar el siguiente disparador.

## Invariantes del ciclo de vida

- Si Voice Wake está habilitado y se han concedido permisos, el reconocedor de palabra de activación debe estar escuchando (excepto durante una captura explícita de pulsar para hablar).
- La visibilidad de la superposición (incluida la ocultación manual mediante el botón X) nunca debe impedir que el reconocedor reanude la escucha.

## Modo de fallo de superposición pegada (anterior)

Antes, si la superposición se quedaba visible y la cerrabas manualmente, Voice Wake podía parecer “muerto” porque el intento de reinicio del runtime podía quedar bloqueado por la visibilidad de la superposición y no se programaba ningún reinicio posterior.

Endurecimiento:

- El reinicio del runtime de activación ya no se bloquea por la visibilidad de la superposición.
- La finalización del cierre de la superposición activa `VoiceWakeRuntime.refresh(...)` mediante `VoiceSessionCoordinator`, de modo que cerrar manualmente con la X siempre reanuda la escucha.

## Detalles específicos de pulsar para hablar

- La detección de hotkey usa un monitor global `.flagsChanged` para la **Option derecha** (`keyCode 61` + `.option`). Solo observamos eventos (sin interceptarlos).
- La canalización de captura vive en `VoicePushToTalk`: inicia Speech inmediatamente, transmite parciales a la superposición y llama a `VoiceWakeForwarder` al soltar.
- Cuando empieza pulsar para hablar, pausamos el runtime de palabra de activación para evitar taps de audio en competencia; se reinicia automáticamente después de soltar.
- Permisos: requiere Micrófono + Speech; ver eventos requiere aprobación de Accesibilidad/Input Monitoring.
- Teclados externos: algunos pueden no exponer la Option derecha como se espera; ofrece un atajo alternativo si los usuarios informan fallos.

## Ajustes visibles para el usuario

- Interruptor **Voice Wake**: habilita el runtime de palabra de activación.
- **Hold Cmd+Fn to talk**: habilita el monitor de pulsar para hablar. Deshabilitado en macOS < 26.
- Selectores de idioma y micrófono, medidor de nivel en vivo, tabla de palabras de activación, probador (solo local; no reenvía).
- El selector de micrófono conserva la última selección si un dispositivo se desconecta, muestra una pista de desconexión y recurre temporalmente al dispositivo predeterminado del sistema hasta que vuelva.
- **Sounds**: tonos al detectar el disparador y al enviar; el valor predeterminado es el sonido del sistema “Glass” de macOS. Puedes elegir cualquier archivo cargable por `NSSound` (por ejemplo MP3/WAV/AIFF) para cada evento o elegir **No Sound**.

## Comportamiento de reenvío

- Cuando Voice Wake está habilitado, las transcripciones se reenvían al gateway/agente activo (el mismo modo local o remoto que usa el resto de la app de macOS).
- Las respuestas se entregan al **último proveedor principal usado** (WhatsApp/Telegram/Discord/WebChat). Si la entrega falla, el error se registra y la ejecución sigue siendo visible mediante WebChat/registros de sesión.

## Carga de reenvío

- `VoiceWakeForwarder.prefixedTranscript(_:)` antepone la pista de la máquina antes de enviar. Compartido entre las rutas de palabra de activación y pulsar para hablar.

## Verificación rápida

- Activa pulsar para hablar, mantén Cmd+Fn, habla y suelta: la superposición debe mostrar parciales y luego enviar.
- Mientras mantienes pulsado, las orejas de la barra de menú deben seguir agrandadas (usa `triggerVoiceEars(ttl:nil)`); vuelven a la normalidad tras soltar.

## Relacionado

- [Voice wake](/es/nodes/voicewake)
- [Superposición de voz](/es/platforms/mac/voice-overlay)
- [App de macOS](/es/platforms/macos)
