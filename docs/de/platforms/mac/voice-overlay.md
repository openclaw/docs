---
read_when:
    - Verhalten des Sprach-Overlays anpassen
summary: Lebenszyklus des Voice-Overlays, wenn sich Wake-Word und Push-to-Talk überschneiden
title: Sprach-Overlay
x-i18n:
    generated_at: "2026-05-06T06:56:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b30f50512e557bd5a50f0e4e8b7955a847b3b554694347d56638581fcda9514
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Voice-Overlay-Lebenszyklus (macOS)

Zielgruppe: Mitwirkende an der macOS-App. Ziel: das Voice Overlay vorhersehbar halten, wenn Wake-Word und Push-to-Talk überlappen.

## Aktuelle Absicht

- Wenn das Overlay durch ein Wake-Word bereits sichtbar ist und der Benutzer die Tastenkombination drückt, übernimmt die Hotkey-Sitzung den vorhandenen Text, statt ihn zurückzusetzen. Das Overlay bleibt sichtbar, solange die Tastenkombination gehalten wird. Wenn der Benutzer loslässt: senden, wenn getrimmter Text vorhanden ist, andernfalls schließen.
- Wake-Word allein sendet weiterhin automatisch bei Stille; Push-to-Talk sendet sofort beim Loslassen.

## Implementiert (9. Dez. 2025)

- Overlay-Sitzungen tragen jetzt ein Token pro Aufnahme (Wake-Word oder Push-to-Talk). Partial-/Final-/Send-/Dismiss-/Level-Updates werden verworfen, wenn das Token nicht übereinstimmt, wodurch veraltete Callbacks vermieden werden.
- Push-to-Talk übernimmt jeden sichtbaren Overlay-Text als Präfix (wenn also die Tastenkombination gedrückt wird, während das Wake-Overlay sichtbar ist, bleibt der Text erhalten und neue Sprache wird angehängt). Es wartet bis zu 1,5 s auf ein finales Transkript, bevor auf den aktuellen Text zurückgefallen wird.
- Chime-/Overlay-Logging wird auf `info` in den Kategorien `voicewake.overlay`, `voicewake.ptt` und `voicewake.chime` ausgegeben (Sitzungsstart, partial, final, send, dismiss, Chime-Grund).

## Nächste Schritte

1. **VoiceSessionCoordinator (actor)**
   - Besitzt zu jedem Zeitpunkt genau eine `VoiceSession`.
   - API (tokenbasiert): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - Verwirft Callbacks mit veralteten Tokens (verhindert, dass alte Erkenner das Overlay erneut öffnen).
2. **VoiceSession (model)**
   - Felder: `token`, `source` (wakeWord|pushToTalk), festgeschriebener/flüchtiger Text, Chime-Flags, Timer (Auto-Send, Idle), `overlayMode` (display|editing|sending), Cooldown-Frist.
3. **Overlay-Binding**
   - `VoiceSessionPublisher` (`ObservableObject`) spiegelt die aktive Sitzung in SwiftUI.
   - `VoiceWakeOverlayView` rendert nur über den Publisher; es mutiert niemals globale Singletons direkt.
   - Overlay-Benutzeraktionen (`sendNow`, `dismiss`, `edit`) rufen den Coordinator mit dem Sitzungstoken zurück.
4. **Vereinheitlichter Sendepfad**
   - Bei `endCapture`: wenn getrimmter Text leer ist → schließen; andernfalls `performSend(session:)` (spielt Send-Chime einmal ab, leitet weiter, schließt).
   - Push-to-Talk: keine Verzögerung; Wake-Word: optionale Verzögerung für Auto-Send.
   - Wenden Sie nach Abschluss von Push-to-Talk einen kurzen Cooldown auf die Wake-Laufzeit an, damit das Wake-Word nicht sofort erneut auslöst.
5. **Logging**
   - Der Coordinator gibt `.info`-Logs im Subsystem `ai.openclaw` und in den Kategorien `voicewake.overlay` und `voicewake.chime` aus.
   - Wichtige Ereignisse: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## Debugging-Checkliste

- Streamen Sie Logs, während Sie ein hängenbleibendes Overlay reproduzieren:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Prüfen Sie, dass nur ein aktives Sitzungstoken vorhanden ist; veraltete Callbacks sollten vom Coordinator verworfen werden.
- Stellen Sie sicher, dass das Loslassen von Push-to-Talk immer `endCapture` mit dem aktiven Token aufruft; wenn der Text leer ist, erwarten Sie `dismiss` ohne Chime oder Senden.

## Migrationsschritte (vorgeschlagen)

1. `VoiceSessionCoordinator`, `VoiceSession` und `VoiceSessionPublisher` hinzufügen.
2. `VoiceWakeRuntime` so refaktorieren, dass Sitzungen erstellt/aktualisiert/beendet werden, statt `VoiceWakeOverlayController` direkt zu berühren.
3. `VoicePushToTalk` so refaktorieren, dass vorhandene Sitzungen übernommen werden und beim Loslassen `endCapture` aufgerufen wird; Runtime-Cooldown anwenden.
4. `VoiceWakeOverlayController` mit dem Publisher verdrahten; direkte Aufrufe aus Runtime/PTT entfernen.
5. Integrationstests für Sitzungsübernahme, Cooldown und Schließen bei leerem Text hinzufügen.

## Verwandt

- [macOS-App](/de/platforms/macos)
- [Voice Wake (macOS)](/de/platforms/mac/voicewake)
- [Talk-Modus](/de/nodes/talk)
