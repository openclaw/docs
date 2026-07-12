---
read_when:
    - Trabajo en las vías de activación por voz o PTT
summary: Modos de activación por voz y pulsar para hablar, además de detalles de enrutamiento en la aplicación para Mac
title: Activación por voz (macOS)
x-i18n:
    generated_at: "2026-07-11T23:15:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a0a5ac44931b578daa4f74b3728a65a1c19ab9742e2d4b9f4c6db49fa5d7b8a
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Activación por voz y pulsar para hablar

## Requisitos

La activación por voz y la función de pulsar para hablar requieren macOS 26 o posterior. En versiones anteriores de macOS, los controles se ocultan de la página de ajustes de voz, que en su lugar muestra el requisito de macOS 26.

## Modos

- **Modo de palabra de activación** (predeterminado): un reconocedor de voz siempre activo espera los términos de activación (`swabbleTriggerWords`). Cuando detecta uno, inicia la captura, muestra la superposición con el texto parcial y envía automáticamente el contenido después de un período de silencio.
- **Pulsar para hablar (mantener pulsada la tecla Option derecha)**: mantén pulsada la tecla Option derecha para iniciar la captura inmediatamente, sin necesidad de un término de activación. La superposición aparece mientras se mantiene pulsada; al soltarla, finaliza la captura y reenvía el contenido tras una breve pausa para que puedas editar el texto.

## Comportamiento en tiempo de ejecución (palabra de activación)

- El reconocedor se encuentra en `VoiceWakeRuntime`.
- La activación solo se produce cuando hay una pausa perceptible entre la palabra de activación y la siguiente palabra (`triggerPauseWindow` = 0,55 s). La superposición o el sonido pueden iniciarse durante la pausa, incluso antes de que comience la orden.
- Períodos de silencio: 2,0 s (`silenceWindow`) cuando el habla continúa; 5,0 s (`triggerOnlySilenceWindow`) si solo se ha oído el término de activación.
- Límite máximo: 120 s (`captureHardStop`) para evitar sesiones descontroladas.
- Tiempo de espera entre sesiones: 350 ms (`debounceAfterSend`) después de un envío.
- La superposición se controla mediante `VoiceWakeOverlayController`, con colores distintos para el texto confirmado y el provisional.
- Después del envío, el reconocedor se reinicia correctamente para escuchar el siguiente término de activación.

## Invariantes del ciclo de vida

- Si la activación por voz está habilitada y se han concedido los permisos, el reconocedor de la palabra de activación permanece escuchando, excepto durante una captura activa de pulsar para hablar.
- Al cerrar la superposición, incluido el cierre manual mediante el botón X, siempre se reanuda el reconocedor: `VoiceSessionCoordinator.overlayDidDismiss` llama a `VoiceWakeRuntime.refresh(state:)` en todas las rutas de cierre. Consulta [Superposición de voz](/es/platforms/mac/voice-overlay) para obtener información sobre el modelo de sesiones y tokens.

## Detalles de pulsar para hablar

- La detección de la tecla de acceso rápido utiliza un monitor global de `.flagsChanged` para la tecla Option derecha (`keyCode 61` + `.option`). Solo observa los eventos, nunca los intercepta.
- La captura se realiza en `VoicePushToTalk`: inicia el reconocimiento de voz inmediatamente, transmite los resultados parciales a la superposición y llama a `VoiceWakeForwarder` al soltar la tecla.
- Al iniciar la función de pulsar para hablar, se pausa el entorno de ejecución de la palabra de activación para evitar capturas de audio simultáneas; se reinicia automáticamente al soltar la tecla.
- Permisos: requiere acceso al micrófono y al reconocimiento de voz; para recibir eventos del teclado se necesita la autorización de accesibilidad o de supervisión de entrada.
- Teclados externos: algunos no exponen la tecla Option derecha como se espera. Ofrece un atajo alternativo si los usuarios informan de que no se detectan las pulsaciones.

## Ajustes visibles para el usuario

- Interruptor **Activación por voz**: habilita el entorno de ejecución de la palabra de activación.
- **Mantener pulsada la tecla Option derecha para hablar**: habilita el monitor de pulsar para hablar.
- Selectores de idioma y micrófono, un medidor de nivel en tiempo real, una tabla de términos de activación y una herramienta de prueba (solo local, nunca reenvía).
- El selector de micrófono conserva la última selección si se desconecta un dispositivo, muestra una indicación de desconexión y utiliza temporalmente el dispositivo predeterminado del sistema hasta que el dispositivo vuelve a estar disponible.
- **Sonidos**: reproduce sonidos al detectar el término de activación y al enviar; de forma predeterminada, utiliza el sonido del sistema "Glass" de macOS. Selecciona para cada evento cualquier archivo compatible con `NSSound` (por ejemplo, MP3/WAV/AIFF) o elige **Sin sonido**.

## Comportamiento del reenvío

- Al reenviar, `VoiceWakeForwarder.selectedSessionOptions` selecciona la clave de la sesión activa de WebChat si hay una configurada; de lo contrario, selecciona la clave de la sesión principal del Gateway.
- Busca esa sesión mediante `sessions.list` y obtiene el canal y el destino de entrega a partir del contexto de entrega de la sesión. Si no están disponibles, utiliza su último canal y destino y, después, una clave de sesión analizada. Si no se puede resolver nada, utiliza WebChat de forma predeterminada.
- Si la entrega falla, el error se registra (categoría `voicewake.forward`) y la ejecución sigue siendo visible mediante WebChat o los registros de la sesión.

## Carga útil del reenvío

- `VoiceWakeForwarder.prefixedTranscript(_:)` antepone a la transcripción una línea de indicación para la máquina (el nombre resuelto del host o, si no está disponible, "este Mac"), compartida por las rutas de la palabra de activación y de pulsar para hablar.

## Verificación rápida

- Activa la función de pulsar para hablar, mantén pulsada la tecla Option derecha, habla y suéltala: la superposición debe mostrar los resultados parciales y, después, enviarlos.
- Mientras mantienes pulsada la tecla, las orejas de la barra de menús deben permanecer ampliadas (`triggerVoiceEars(ttl: nil)`); vuelven a su tamaño normal al soltarla.

## Temas relacionados

- [Activación por voz](/es/nodes/voicewake)
- [Superposición de voz](/es/platforms/mac/voice-overlay)
- [Aplicación para macOS](/es/platforms/macos)
