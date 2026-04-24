---
read_when:
    - Ajustar el comportamiento de la superposición de voz
summary: Ciclo de vida de la superposición de voz cuando se solapan la palabra de activación y push-to-talk
title: Superposición de voz
x-i18n:
    generated_at: "2026-04-24T05:38:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ae98afad57dffe73e2c878eef4f3253e4464d68cadf531e9239b017cc160f28
    source_path: platforms/mac/voice-overlay.md
    workflow: 15
---

# Ciclo de vida de la superposición de voz (macOS)

Público: colaboradores de la app de macOS. Objetivo: mantener predecible la superposición de voz cuando la palabra de activación y push-to-talk se solapan.

## Intención actual

- Si la superposición ya está visible por la palabra de activación y el usuario pulsa la tecla rápida, la sesión de hotkey _adopta_ el texto existente en lugar de restablecerlo. La superposición permanece visible mientras la hotkey está pulsada. Cuando el usuario la suelta: envía si hay texto tras recortarlo; de lo contrario, se descarta.
- La palabra de activación por sí sola sigue enviando automáticamente al detectar silencio; push-to-talk envía inmediatamente al soltar.

## Implementado (9 de diciembre de 2025)

- Las sesiones de superposición ahora llevan un token por captura (palabra de activación o push-to-talk). Las actualizaciones parcial/final/envío/descarte/nivel se descartan cuando el token no coincide, evitando callbacks obsoletos.
- Push-to-talk adopta cualquier texto visible de la superposición como prefijo (de modo que pulsar la hotkey mientras la superposición de activación está visible conserva el texto y añade nuevo habla). Espera hasta 1,5 s a una transcripción final antes de recurrir al texto actual.
- El registro de chime/superposición se emite a nivel `info` en las categorías `voicewake.overlay`, `voicewake.ptt` y `voicewake.chime` (inicio de sesión, parcial, final, envío, descarte, motivo del chime).

## Siguientes pasos

1. **VoiceSessionCoordinator (actor)**
   - Es propietario de exactamente un `VoiceSession` a la vez.
   - API (basada en token): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - Descarta callbacks que llevan tokens obsoletos (evita que reconocedores antiguos reabran la superposición).
2. **VoiceSession (modelo)**
   - Campos: `token`, `source` (wakeWord|pushToTalk), texto comprometido/volátil, flags de chime, temporizadores (autoenvío, inactividad), `overlayMode` (display|editing|sending), fecha límite de cooldown.
3. **Vinculación de superposición**
   - `VoiceSessionPublisher` (`ObservableObject`) refleja la sesión activa en SwiftUI.
   - `VoiceWakeOverlayView` renderiza solo a través del publicador; nunca muta directamente singletons globales.
   - Las acciones del usuario en la superposición (`sendNow`, `dismiss`, `edit`) devuelven la llamada al coordinador con el token de sesión.
4. **Ruta de envío unificada**
   - En `endCapture`: si el texto recortado está vacío → descartar; en caso contrario `performSend(session:)` (reproduce el chime de envío una sola vez, reenvía, descarta).
   - Push-to-talk: sin retardo; palabra de activación: retardo opcional para autoenvío.
   - Aplica un breve cooldown al runtime de activación después de que termine push-to-talk para que la palabra de activación no se vuelva a disparar inmediatamente.
5. **Registro**
   - El coordinador emite registros `.info` en el subsistema `ai.openclaw`, categorías `voicewake.overlay` y `voicewake.chime`.
   - Eventos clave: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## Lista de comprobación de depuración

- Transmite registros mientras reproduces una superposición persistente:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Verifica que solo haya un token de sesión activo; el coordinador debería descartar callbacks obsoletos.
- Asegúrate de que al soltar push-to-talk siempre se llama a `endCapture` con el token activo; si el texto está vacío, espera `dismiss` sin chime ni envío.

## Pasos de migración (sugeridos)

1. Añadir `VoiceSessionCoordinator`, `VoiceSession` y `VoiceSessionPublisher`.
2. Refactorizar `VoiceWakeRuntime` para crear/actualizar/finalizar sesiones en lugar de tocar `VoiceWakeOverlayController` directamente.
3. Refactorizar `VoicePushToTalk` para adoptar sesiones existentes y llamar a `endCapture` al soltar; aplicar cooldown del runtime.
4. Conectar `VoiceWakeOverlayController` al publicador; eliminar llamadas directas desde runtime/PTT.
5. Añadir pruebas de integración para adopción de sesión, cooldown y descarte de texto vacío.

## Relacionado

- [App de macOS](/es/platforms/macos)
- [Activación por voz (macOS)](/es/platforms/mac/voicewake)
- [Modo Talk](/es/nodes/talk)
