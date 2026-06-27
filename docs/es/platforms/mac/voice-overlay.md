---
read_when:
    - Ajustar el comportamiento de la superposición de voz
summary: Ciclo de vida de la superposición de voz cuando la palabra de activación y pulsar para hablar se solapan
title: Superposición de voz
x-i18n:
    generated_at: "2026-05-06T09:05:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b30f50512e557bd5a50f0e4e8b7955a847b3b554694347d56638581fcda9514
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Ciclo de vida de la superposición de voz (macOS)

Público: colaboradores de la aplicación macOS. Objetivo: mantener predecible la superposición de voz cuando la palabra de activación y pulsar para hablar se superponen.

## Intención actual

- Si la superposición ya está visible por la palabra de activación y el usuario pulsa la tecla de acceso rápido, la sesión de la tecla de acceso rápido _adopta_ el texto existente en lugar de restablecerlo. La superposición permanece visible mientras se mantiene pulsada la tecla de acceso rápido. Cuando el usuario la suelta: envía si hay texto recortado; de lo contrario, descarta.
- Solo la palabra de activación sigue enviándose automáticamente al detectar silencio; pulsar para hablar envía inmediatamente al soltar.

## Implementado (9 de dic. de 2025)

- Las sesiones de superposición ahora llevan un token por captura (palabra de activación o pulsar para hablar). Las actualizaciones parciales/finales/de envío/descarte/nivel se descartan cuando el token no coincide, lo que evita callbacks obsoletos.
- Pulsar para hablar adopta cualquier texto visible de la superposición como prefijo (por lo que pulsar la tecla de acceso rápido mientras la superposición de activación está visible conserva el texto y añade la nueva voz). Espera hasta 1,5 s una transcripción final antes de recurrir al texto actual.
- El registro de timbre/superposición se emite en `info` en las categorías `voicewake.overlay`, `voicewake.ptt` y `voicewake.chime` (inicio de sesión, parcial, final, envío, descarte, motivo del timbre).

## Próximos pasos

1. **VoiceSessionCoordinator (actor)**
   - Posee exactamente una `VoiceSession` a la vez.
   - API (basada en tokens): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - Descarta callbacks que llevan tokens obsoletos (evita que reconocedores antiguos vuelvan a abrir la superposición).
2. **VoiceSession (modelo)**
   - Campos: `token`, `source` (wakeWord|pushToTalk), texto confirmado/volátil, indicadores de timbre, temporizadores (envío automático, inactividad), `overlayMode` (display|editing|sending), fecha límite de enfriamiento.
3. **Vinculación de superposición**
   - `VoiceSessionPublisher` (`ObservableObject`) refleja la sesión activa en SwiftUI.
   - `VoiceWakeOverlayView` renderiza solo mediante el publisher; nunca muta directamente singletons globales.
   - Las acciones de usuario de la superposición (`sendNow`, `dismiss`, `edit`) vuelven a llamar al coordinador con el token de sesión.
4. **Ruta de envío unificada**
   - En `endCapture`: si el texto recortado está vacío → descartar; si no, `performSend(session:)` (reproduce el timbre de envío una vez, reenvía, descarta).
   - Pulsar para hablar: sin demora; palabra de activación: demora opcional para el envío automático.
   - Aplica un enfriamiento breve al entorno de ejecución de activación después de que termine pulsar para hablar para que la palabra de activación no se reactive de inmediato.
5. **Registro**
   - El coordinador emite registros `.info` en el subsistema `ai.openclaw`, categorías `voicewake.overlay` y `voicewake.chime`.
   - Eventos clave: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## Lista de comprobación de depuración

- Transmite los registros mientras reproduces una superposición persistente:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Verifica que haya un solo token de sesión activo; el coordinador debe descartar los callbacks obsoletos.
- Asegúrate de que soltar pulsar para hablar siempre llame a `endCapture` con el token activo; si el texto está vacío, espera `dismiss` sin timbre ni envío.

## Pasos de migración (sugeridos)

1. Añade `VoiceSessionCoordinator`, `VoiceSession` y `VoiceSessionPublisher`.
2. Refactoriza `VoiceWakeRuntime` para crear/actualizar/finalizar sesiones en lugar de tocar directamente `VoiceWakeOverlayController`.
3. Refactoriza `VoicePushToTalk` para adoptar sesiones existentes y llamar a `endCapture` al soltar; aplica enfriamiento del entorno de ejecución.
4. Conecta `VoiceWakeOverlayController` al publisher; elimina las llamadas directas desde el entorno de ejecución/PTT.
5. Añade pruebas de integración para adopción de sesiones, enfriamiento y descarte de texto vacío.

## Relacionado

- [Aplicación macOS](/es/platforms/macos)
- [Activación por voz (macOS)](/es/platforms/mac/voicewake)
- [Modo de conversación](/es/nodes/talk)
