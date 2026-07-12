---
read_when:
    - Ajuste del comportamiento de la superposición de voz
summary: Ciclo de vida de la superposición de voz cuando se solapan la palabra de activación y «pulsar para hablar»
title: Superposición de voz
x-i18n:
    generated_at: "2026-07-11T23:17:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eef571c3e8d41a97779537b1b373fab25b08f63575b50e5019f6c5fbcb782c52
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
---

# Ciclo de vida de la superposición de voz (macOS)

Público: colaboradores de la aplicación para macOS. Objetivo: mantener un comportamiento predecible de la superposición de voz cuando la palabra de activación y la función de pulsar para hablar se solapan.

## Comportamiento

- Si la superposición ya está visible debido a la palabra de activación y el usuario pulsa la tecla de acceso rápido, la sesión de la tecla de acceso rápido adopta el texto existente en lugar de restablecerlo. La superposición permanece visible mientras se mantiene pulsada la tecla. Al soltarla: se envía si hay texto después de eliminar los espacios sobrantes; de lo contrario, se descarta.
- La palabra de activación por sí sola sigue enviando automáticamente al detectar silencio; la función de pulsar para hablar envía inmediatamente al soltar la tecla.

## Implementación

- `VoiceSessionCoordinator` (`apps/macos/Sources/OpenClaw/VoiceSessionCoordinator.swift`) es el único propietario de la sesión de voz activa. Es un singleton `@MainActor @Observable`, no un actor. API: `startSession`, `updatePartial`, `finalize`, `sendNow`, `dismiss`, `updateLevel`, `snapshot`. Cada sesión incluye un token `UUID`; las llamadas con un token obsoleto o que no coincide se descartan.
- `VoiceWakeOverlayController` (`VoiceWakeOverlayController+Session.swift`) renderiza la superposición y reenvía las acciones del usuario (`requestSend`, `dismiss`) al coordinador mediante el token de sesión. Nunca gestiona por sí mismo el estado de la sesión.
- La función de pulsar para hablar (`VoicePushToTalk.begin()`) adopta cualquier texto visible de la superposición como `adoptedPrefix` (mediante `VoiceSessionCoordinator.shared.snapshot()`), de modo que pulsar la tecla de acceso rápido mientras está visible la superposición de activación conserva el texto y agrega el nuevo discurso. Al soltarla, espera hasta 1,5 s a que llegue una transcripción final antes de recurrir al texto actual.
- Al ejecutar `dismiss`, la superposición llama a `VoiceSessionCoordinator.overlayDidDismiss`, lo que activa `VoiceWakeRuntime.refresh(state:)` para que el cierre manual con la X, el cierre por texto vacío y el cierre posterior al envío reanuden la escucha de la palabra de activación.
- Ruta de envío unificada: si el texto sin espacios sobrantes está vacío, se descarta; de lo contrario, `sendNow` reproduce una sola vez el sonido de envío, lo reenvía mediante `VoiceWakeForwarder` y, a continuación, descarta la superposición.

## Registro

El subsistema de voz es `ai.openclaw`; cada componente registra eventos en su propia categoría:

| Categoría               | Componente                                      |
| ----------------------- | ----------------------------------------------- |
| `voicewake.coordinator` | `VoiceSessionCoordinator`                       |
| `voicewake.overlay`     | `VoiceWakeOverlayController`/`VoiceWakeOverlay` |
| `voicewake.ptt`         | Tecla de acceso rápido y captura de pulsar para hablar |
| `voicewake.runtime`     | Entorno de ejecución de la palabra de activación |
| `voicewake.chime`       | Reproducción del sonido                         |
| `voicewake.sync`        | Sincronización de ajustes globales              |
| `voicewake.forward`     | Reenvío de la transcripción                     |
| `voicewake.meter`       | Monitor del nivel del micrófono                 |

## Lista de comprobación para la depuración

- Transmita los registros mientras reproduce una superposición persistente:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Verifique que solo haya un token de sesión activo; el coordinador descarta las devoluciones de llamada obsoletas.
- Confirme que, al soltar la tecla de pulsar para hablar, siempre se llame a `end()` con el token activo; si el texto está vacío, debe descartarse sin reproducir ningún sonido ni realizar ningún envío.

## Temas relacionados

- [Aplicación para macOS](/es/platforms/macos)
- [Activación por voz (macOS)](/es/platforms/mac/voicewake)
- [Modo de conversación](/es/nodes/talk)
