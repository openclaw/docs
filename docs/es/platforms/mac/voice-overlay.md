---
read_when:
    - Ajuste del comportamiento de la superposición de voz
summary: Ciclo de vida de la superposición de voz cuando se solapan la palabra de activación y pulsar para hablar
title: Superposición de voz
x-i18n:
    generated_at: "2026-07-05T11:32:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eef571c3e8d41a97779537b1b373fab25b08f63575b50e5019f6c5fbcb782c52
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
---

# Ciclo de vida de la superposición de voz (macOS)

Audiencia: colaboradores de la app para macOS. Objetivo: mantener predecible la superposición de voz cuando la palabra de activación y pulsar para hablar se solapan.

## Comportamiento

- Si la superposición ya está visible por la palabra de activación y el usuario pulsa la tecla de acceso rápido, la sesión de tecla de acceso rápido adopta el texto existente en lugar de reiniciarlo. La superposición permanece visible mientras se mantiene pulsada la tecla de acceso rápido. Al soltarla: se envía si hay texto recortado; de lo contrario, se descarta.
- La palabra de activación por sí sola sigue enviándose automáticamente en silencio; pulsar para hablar envía inmediatamente al soltar.

## Implementación

- `VoiceSessionCoordinator` (`apps/macos/Sources/OpenClaw/VoiceSessionCoordinator.swift`) es el único propietario de la sesión de voz activa. Es un singleton `@MainActor @Observable`, no un actor. API: `startSession`, `updatePartial`, `finalize`, `sendNow`, `dismiss`, `updateLevel`, `snapshot`. Cada sesión lleva un token `UUID`; las llamadas con un token obsoleto o no coincidente se descartan.
- `VoiceWakeOverlayController` (`VoiceWakeOverlayController+Session.swift`) renderiza la superposición y reenvía las acciones del usuario (`requestSend`, `dismiss`) al coordinador mediante el token de sesión. Nunca posee por sí mismo el estado de la sesión.
- Pulsar para hablar (`VoicePushToTalk.begin()`) adopta cualquier texto visible de la superposición como `adoptedPrefix` (mediante `VoiceSessionCoordinator.shared.snapshot()`), de modo que pulsar la tecla de acceso rápido mientras la superposición de activación está visible conserva el texto y añade la nueva voz. Al soltar, espera hasta 1,5 s un transcrito final antes de recurrir al texto actual.
- En `dismiss`, la superposición llama a `VoiceSessionCoordinator.overlayDidDismiss`, lo que activa `VoiceWakeRuntime.refresh(state:)` para que el cierre manual con X, el descarte por texto vacío y el descarte posterior al envío reanuden la escucha de la palabra de activación.
- Ruta de envío unificada: si el texto recortado está vacío, descartar; de lo contrario, `sendNow` reproduce una vez el sonido de envío, reenvía mediante `VoiceWakeForwarder` y luego descarta.

## Registro

El subsistema de voz es `ai.openclaw`; cada componente registra en su propia categoría:

| Categoría               | Componente                                      |
| ----------------------- | ----------------------------------------------- |
| `voicewake.coordinator` | `VoiceSessionCoordinator`                       |
| `voicewake.overlay`     | `VoiceWakeOverlayController`/`VoiceWakeOverlay` |
| `voicewake.ptt`         | Tecla de acceso rápido y captura de pulsar para hablar |
| `voicewake.runtime`     | Runtime de palabra de activación                |
| `voicewake.chime`       | Reproducción de sonido                          |
| `voicewake.sync`        | Sincronización de ajustes globales              |
| `voicewake.forward`     | Reenvío de transcritos                          |
| `voicewake.meter`       | Monitor de nivel de micrófono                   |

## Lista de comprobación de depuración

- Transmite los registros mientras reproduces una superposición persistente:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Verifica que solo haya un token de sesión activo; las devoluciones de llamada obsoletas las descarta el coordinador.
- Confirma que soltar pulsar para hablar siempre llama a `end()` con el token activo; si el texto está vacío, se espera un descarte sin sonido ni envío.

## Relacionado

- [app para macOS](/es/platforms/macos)
- [Activación por voz (macOS)](/es/platforms/mac/voicewake)
- [Modo de conversación](/es/nodes/talk)
