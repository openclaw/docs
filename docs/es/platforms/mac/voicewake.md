---
read_when:
    - Trabajo en las vías de activación por voz o PTT
summary: Modos de activación por voz y pulsar para hablar, además de detalles de enrutamiento en la aplicación para Mac
title: Activación por voz (macOS)
x-i18n:
    generated_at: "2026-07-21T22:39:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d3b2a01ee997b4158bf88b9ef54b1e523503722620f943d594323516619e7502
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Activación por voz y pulsar para hablar

## Requisitos

La activación por voz y la función de pulsar para hablar requieren macOS 26 o posterior. En versiones anteriores de macOS, los controles se ocultan en la página de configuración de voz, que en su lugar muestra el requisito de macOS 26.

La activación por voz requiere que Apple Speech admita el reconocimiento en el dispositivo para el idioma seleccionado. La aplicación se niega a iniciar la escucha pasiva de la palabra de activación cuando ese contrato exclusivamente local no está disponible; nunca recurre al reconocimiento mediante la red. Pulsar para hablar, el modo de conversación y el dictado de chat rápido son acciones explícitas del usuario y pueden utilizar los servicios de red de Apple Speech para ofrecer una mayor cobertura de idiomas.

## Modos

- **Modo de palabra de activación** (predeterminado): un reconocedor de voz siempre activo y ejecutado en el dispositivo espera los tokens de activación (`swabbleTriggerWords`). Cuando encuentra una coincidencia, inicia la captura, muestra la superposición con el texto parcial y realiza el envío automáticamente después de un silencio.
- **Pulsar para hablar (mantener pulsada la tecla Opción derecha)**: mantenga pulsada la tecla Opción derecha para iniciar la captura inmediatamente, sin necesidad de una palabra de activación. La superposición aparece mientras se mantiene pulsada; al soltarla, finaliza la captura y reenvía el contenido tras un breve retraso para que se pueda editar el texto.

## Comportamiento en tiempo de ejecución (palabra de activación)

- El reconocedor reside en `VoiceWakeRuntime`.
- La activación solo se produce cuando hay una pausa significativa entre la palabra de activación y la siguiente palabra (`triggerPauseWindow` = 0.55s). La superposición o el sonido pueden iniciarse durante la pausa, incluso antes de que comience el comando.
- Ventanas de silencio: 2.0s (`silenceWindow`) cuando el habla continúa, 5.0s (`triggerOnlySilenceWindow`) si solo se ha oído la palabra de activación.
- Detención forzada: 120s (`captureHardStop`) para evitar sesiones descontroladas.
- Tiempo de espera entre sesiones: 350ms (`debounceAfterSend`) después de un envío.
- La superposición se controla mediante `VoiceWakeOverlayController`, con colores distintos para el texto confirmado y el provisional.
- Después del envío, el reconocedor se reinicia correctamente para escuchar la siguiente palabra de activación.

## Invariantes del ciclo de vida

- Si la activación por voz está habilitada y se han concedido los permisos, el reconocedor de la palabra de activación permanece escuchando, excepto durante una captura activa de pulsar para hablar.
- Al cerrar la superposición, incluso manualmente mediante el botón X, siempre se reanuda el reconocedor: `VoiceSessionCoordinator.overlayDidDismiss` llama a `VoiceWakeRuntime.refresh(state:)` en todas las rutas de cierre. Consulte [Superposición de voz](/es/platforms/mac/voice-overlay) para conocer el modelo de sesión y tokens.

## Detalles de pulsar para hablar

- La detección de la tecla de acceso rápido utiliza un monitor global `.flagsChanged` para la tecla Opción derecha (`keyCode 61` + `.option`). Solo observa los eventos, nunca los intercepta.
- La captura reside en `VoicePushToTalk`: inicia Speech inmediatamente, transmite resultados parciales a la superposición y llama a `VoiceWakeForwarder` al soltar la tecla.
- Al iniciar la función de pulsar para hablar se pausa el entorno de ejecución de la palabra de activación para evitar capturas de audio simultáneas; se reinicia automáticamente después de soltar la tecla.
- Permisos: requiere acceso al micrófono y al reconocimiento de voz; la recepción de eventos de teclado necesita la aprobación de Accesibilidad/Monitorización de entrada.
- Teclados externos: algunos no exponen la tecla Opción derecha de la forma esperada. Ofrezca un atajo alternativo si los usuarios informan de fallos de detección.

## Ajustes visibles para el usuario

- Interruptor **Activación por voz**: habilita el entorno de ejecución de la palabra de activación.
- **Mantener pulsada la tecla Opción derecha para hablar**: habilita el monitor de pulsar para hablar.
- Si el idioma seleccionado no admite el reconocimiento en el dispositivo en este Mac, la activación por voz permanece deshabilitada, mientras que pulsar para hablar y el modo de conversación siguen disponibles.
- Selectores de idioma y micrófono, un medidor de nivel en directo, una tabla de palabras de activación y una herramienta de prueba (exclusivamente local, nunca reenvía contenido).
- El selector de micrófono conserva la última selección si se desconecta un dispositivo, muestra un aviso de desconexión y utiliza temporalmente el dispositivo predeterminado del sistema hasta que vuelva a estar disponible.
- **Sonidos**: reproduce sonidos al detectar la activación y al realizar el envío; de forma predeterminada, utiliza el sonido del sistema "Glass" de macOS. Seleccione para cada evento cualquier archivo que pueda cargar `NSSound` (por ejemplo, MP3/WAV/AIFF), o elija **Sin sonido**.

## Comportamiento del reenvío

- Al reenviar, `VoiceWakeForwarder.selectedSessionOptions` selecciona la clave de la sesión activa de WebChat si se ha definido una; de lo contrario, selecciona la clave de la sesión principal del Gateway.
- Busca esa sesión mediante `sessions.list` y obtiene el canal y el destino de entrega a partir del contexto de entrega de la sesión (recurriendo primero a su último canal/destino y luego a una clave de sesión analizada); si no se puede resolver ninguno, utiliza WebChat de forma predeterminada.
- Si la entrega falla, el error se registra (categoría `voicewake.forward`) y la ejecución sigue estando visible mediante WebChat o los registros de sesión.

## Carga útil del reenvío

- `VoiceWakeForwarder.prefixedTranscript(_:)` antepone a la transcripción una línea con una indicación del equipo (el nombre de host resuelto o, como alternativa, "este Mac"), compartida entre las rutas de la palabra de activación y de pulsar para hablar.

## Verificación rápida

- Active la función de pulsar para hablar, mantenga pulsada la tecla Opción derecha, hable y suéltela: la superposición debe mostrar resultados parciales y después realizar el envío.
- Mientras se mantiene pulsada, las orejas de la barra de menús deben permanecer ampliadas (`triggerVoiceEars(ttl: nil)`); vuelven a su tamaño normal después de soltarla.

## Contenido relacionado

- [Activación por voz](/es/nodes/voicewake)
- [Superposición de voz](/es/platforms/mac/voice-overlay)
- [Aplicación para macOS](/es/platforms/macos)
