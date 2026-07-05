---
read_when:
    - Trabajar en las rutas de activación por voz o PTT
summary: Modos de activación por voz y pulsar para hablar, más detalles de enrutamiento en la app para Mac
title: Activación por voz (macOS)
x-i18n:
    generated_at: "2026-07-05T11:29:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a0a5ac44931b578daa4f74b3728a65a1c19ab9742e2d4b9f4c6db49fa5d7b8a
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Activación por voz y pulsar para hablar

## Requisitos

La activación por voz y pulsar para hablar requieren macOS 26 o posterior. En versiones anteriores de macOS, los controles se ocultan de la página de ajustes de voz, que en su lugar muestra el requisito de macOS 26.

## Modos

- **Modo de palabra de activación** (predeterminado): un reconocedor de voz siempre activo espera tokens de activación (`swabbleTriggerWords`). Cuando hay coincidencia, inicia la captura, muestra la superposición con texto parcial y envía automáticamente tras el silencio.
- **Pulsar para hablar (mantener Option derecha)**: mantén pulsada la tecla Option derecha para capturar de inmediato, sin necesidad de activación. La superposición aparece mientras se mantiene pulsada; al soltarla, finaliza y reenvía tras una breve demora para que puedas editar el texto.

## Comportamiento en tiempo de ejecución (palabra de activación)

- El reconocedor vive en `VoiceWakeRuntime`.
- La activación se dispara solo cuando hay una pausa significativa entre la palabra de activación y la siguiente palabra (`triggerPauseWindow` = 0,55 s). La superposición/el timbre pueden iniciarse durante la pausa incluso antes de que comience el comando.
- Ventanas de silencio: 2,0 s (`silenceWindow`) cuando el habla está fluyendo, 5,0 s (`triggerOnlySilenceWindow`) si solo se oyó la activación.
- Detención forzada: 120 s (`captureHardStop`) para evitar sesiones descontroladas.
- Antirrebote entre sesiones: 350 ms (`debounceAfterSend`) después de un envío.
- La superposición se controla mediante `VoiceWakeOverlayController`, con coloración de texto confirmado/volátil.
- Después del envío, el reconocedor se reinicia limpiamente para escuchar la siguiente activación.

## Invariantes del ciclo de vida

- Si la activación por voz está habilitada y los permisos están concedidos, el reconocedor de palabra de activación permanece escuchando, salvo durante una captura activa de pulsar para hablar.
- La retirada de la superposición, incluida la retirada manual mediante el botón X, siempre reanuda el reconocedor: `VoiceSessionCoordinator.overlayDidDismiss` llama a `VoiceWakeRuntime.refresh(state:)` en cada ruta de retirada. Consulta [Superposición de voz](/es/platforms/mac/voice-overlay) para ver el modelo de sesión/token.

## Detalles de pulsar para hablar

- La detección de atajos usa un monitor global `.flagsChanged` para Option derecha (`keyCode 61` + `.option`). Solo observa eventos; nunca los intercepta.
- La captura vive en `VoicePushToTalk`: inicia el reconocimiento de voz de inmediato, transmite parciales a la superposición y llama a `VoiceWakeForwarder` al soltar.
- Iniciar pulsar para hablar pausa el runtime de palabra de activación para evitar tomas de audio simultáneas; se reinicia automáticamente después de soltar.
- Permisos: requiere Micrófono + Voz; recibir eventos de teclado necesita aprobación de Accesibilidad/Monitorización de entrada.
- Teclados externos: algunos no exponen Option derecha como se espera. Ofrece un atajo alternativo si los usuarios informan fallos.

## Ajustes visibles para el usuario

- Interruptor **Activación por voz**: habilita el runtime de palabra de activación.
- **Mantener Option derecha para hablar**: habilita el monitor de pulsar para hablar.
- Selectores de idioma y micrófono, un medidor de nivel en vivo, una tabla de palabras de activación y un probador (solo local, nunca reenvía).
- El selector de micrófono conserva la última selección si un dispositivo se desconecta, muestra una indicación de desconexión y vuelve temporalmente al valor predeterminado del sistema hasta que regrese.
- **Sonidos**: timbres al detectar la activación y al enviar, con el sonido del sistema macOS "Glass" como predeterminado. Elige cualquier archivo cargable por `NSSound` (p. ej., MP3/WAV/AIFF) por evento, o elige **Sin sonido**.

## Comportamiento de reenvío

- Al reenviar, `VoiceWakeForwarder.selectedSessionOptions` elige la clave de sesión activa de WebChat si hay una configurada; de lo contrario, la clave de sesión principal del Gateway.
- Busca esa sesión mediante `sessions.list` y deriva el canal de entrega y el destino del contexto de entrega de la sesión (recurriendo a su último canal/destino y luego a una clave de sesión analizada), con WebChat como valor predeterminado si no se resuelve nada.
- Si la entrega falla, el error se registra (categoría `voicewake.forward`) y la ejecución sigue siendo visible mediante los registros de WebChat/sesión.

## Carga útil de reenvío

- `VoiceWakeForwarder.prefixedTranscript(_:)` antepone una línea de indicación para la máquina (nombre de host resuelto, con alternativa a "este Mac") antes de la transcripción, compartida entre las rutas de palabra de activación y pulsar para hablar.

## Verificación rápida

- Activa pulsar para hablar, mantén pulsada Option derecha, habla y suelta: la superposición debería mostrar parciales y luego enviar.
- Mientras se mantiene pulsada, las orejas de la barra de menús deberían permanecer agrandadas (`triggerVoiceEars(ttl: nil)`); se reducen después de soltar.

## Relacionado

- [Activación por voz](/es/nodes/voicewake)
- [Superposición de voz](/es/platforms/mac/voice-overlay)
- [Aplicación macOS](/es/platforms/macos)
