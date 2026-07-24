---
read_when:
    - Verhalten des Sprach-Overlays anpassen
summary: Lebenszyklus des Sprach-Overlays bei Überschneidung von Aktivierungswort und Push-to-Talk
title: Sprach-Overlay
x-i18n:
    generated_at: "2026-07-24T04:00:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: eef571c3e8d41a97779537b1b373fab25b08f63575b50e5019f6c5fbcb782c52
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
---

# Lebenszyklus des Sprach-Overlays (macOS)

Zielgruppe: Mitwirkende an der macOS-App. Ziel: vorhersagbares Verhalten des Sprach-Overlays bei Überschneidungen von Aktivierungswort und Push-to-Talk.

## Verhalten

- Wenn das Overlay aufgrund des Aktivierungsworts bereits sichtbar ist und die Person den Hotkey drückt, übernimmt die Hotkey-Sitzung den vorhandenen Text, statt ihn zurückzusetzen. Das Overlay bleibt sichtbar, solange der Hotkey gedrückt gehalten wird. Beim Loslassen: senden, wenn nach dem Entfernen umgebender Leerzeichen Text vorhanden ist, andernfalls schließen.
- Nur das Aktivierungswort sendet bei Stille weiterhin automatisch; Push-to-Talk sendet sofort beim Loslassen.

## Implementierung

- `VoiceSessionCoordinator` (`apps/macos/Sources/OpenClaw/VoiceSessionCoordinator.swift`) ist der alleinige Eigentümer der aktiven Sprachsitzung. Es handelt sich um einen `@MainActor @Observable`-Singleton, nicht um einen Actor. API: `startSession`, `updatePartial`, `finalize`, `sendNow`, `dismiss`, `updateLevel`, `snapshot`. Jede Sitzung enthält ein `UUID`-Token; Aufrufe mit einem veralteten oder nicht übereinstimmenden Token werden verworfen.
- `VoiceWakeOverlayController` (`VoiceWakeOverlayController+Session.swift`) rendert das Overlay und leitet Benutzeraktionen (`requestSend`, `dismiss`) über das Sitzungstoken durch den Koordinator zurück. Es verwaltet den Sitzungszustand niemals selbst.
- Push-to-Talk (`VoicePushToTalk.begin()`) übernimmt sichtbaren Overlay-Text als `adoptedPrefix` (über `VoiceSessionCoordinator.shared.snapshot()`), sodass beim Drücken des Hotkeys während der Anzeige des Aktivierungswort-Overlays der Text erhalten bleibt und neue Sprache angehängt wird. Beim Loslassen wartet es bis zu 1.5s auf ein endgültiges Transkript, bevor es auf den aktuellen Text zurückgreift.
- Bei `dismiss` ruft das Overlay `VoiceSessionCoordinator.overlayDidDismiss` auf, wodurch `VoiceWakeRuntime.refresh(state:)` ausgelöst wird. So wird das Lauschen auf das Aktivierungswort nach manuellem Schließen über X, dem Schließen bei leerem Text und dem Schließen nach dem Senden jeweils fortgesetzt.
- Einheitlicher Sendepfad: Ist der Text nach dem Entfernen umgebender Leerzeichen leer, wird das Overlay geschlossen; andernfalls spielt `sendNow` den Sendeton einmal ab, leitet den Text über `VoiceWakeForwarder` weiter und schließt anschließend das Overlay.

## Protokollierung

Das Sprachsubsystem ist `ai.openclaw`; jede Komponente protokolliert unter ihrer eigenen Kategorie:

| Kategorie                | Komponente                                       |
| ----------------------- | ----------------------------------------------- |
| `voicewake.coordinator` | `VoiceSessionCoordinator`                       |
| `voicewake.overlay`     | `VoiceWakeOverlayController`/`VoiceWakeOverlay` |
| `voicewake.ptt`         | Push-to-Talk-Hotkey und Aufnahme                 |
| `voicewake.runtime`     | Aktivierungswort-Laufzeit                               |
| `voicewake.chime`       | Wiedergabe des Signaltons                                  |
| `voicewake.sync`        | Globale Einstellungssynchronisierung                            |
| `voicewake.forward`     | Weiterleitung des Transkripts                           |
| `voicewake.meter`       | Mikrofonpegelüberwachung                               |

## Debugging-Checkliste

- Streamen Sie die Protokolle, während Sie ein hängen gebliebenes Overlay reproduzieren:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Stellen Sie sicher, dass nur ein aktives Sitzungstoken vorhanden ist; veraltete Callbacks werden vom Koordinator verworfen.
- Vergewissern Sie sich, dass beim Loslassen von Push-to-Talk stets `end()` mit dem aktiven Token aufgerufen wird; wenn der Text leer ist, sollte das Overlay ohne Signalton und ohne Senden geschlossen werden.

## Verwandte Themen

- [macOS-App](/de/platforms/macos)
- [Sprachaktivierung (macOS)](/de/platforms/mac/voicewake)
- [Gesprächsmodus](/de/nodes/talk)
