---
read_when:
    - Verhalten der Sprachüberlagerung anpassen
summary: Lebenszyklus des Sprach-Overlays bei Überschneidung von Aktivierungswort und Push-to-Talk
title: Sprach-Overlay
x-i18n:
    generated_at: "2026-07-12T15:31:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: eef571c3e8d41a97779537b1b373fab25b08f63575b50e5019f6c5fbcb782c52
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
---

# Lebenszyklus des Sprach-Overlays (macOS)

Zielgruppe: Mitwirkende an der macOS-App. Ziel: ein vorhersehbares Verhalten des Sprach-Overlays bei Überschneidungen von Aktivierungswort und Push-to-Talk.

## Verhalten

- Wenn das Overlay aufgrund des Aktivierungsworts bereits sichtbar ist und der Benutzer die Tastenkombination drückt, übernimmt die Push-to-Talk-Sitzung den vorhandenen Text, anstatt ihn zurückzusetzen. Das Overlay bleibt sichtbar, solange die Tastenkombination gedrückt wird. Beim Loslassen: senden, wenn nach dem Entfernen von Leerraum Text vorhanden ist, andernfalls schließen.
- Nur das Aktivierungswort sendet bei Stille weiterhin automatisch; Push-to-Talk sendet sofort beim Loslassen.

## Implementierung

- `VoiceSessionCoordinator` (`apps/macos/Sources/OpenClaw/VoiceSessionCoordinator.swift`) ist der alleinige Eigentümer der aktiven Sprachsitzung. Es handelt sich um ein `@MainActor @Observable`-Singleton, nicht um einen Actor. API: `startSession`, `updatePartial`, `finalize`, `sendNow`, `dismiss`, `updateLevel`, `snapshot`. Jede Sitzung enthält ein `UUID`-Token; Aufrufe mit einem veralteten oder nicht übereinstimmenden Token werden verworfen.
- `VoiceWakeOverlayController` (`VoiceWakeOverlayController+Session.swift`) rendert das Overlay und leitet Benutzeraktionen (`requestSend`, `dismiss`) über das Sitzungstoken an den Koordinator weiter. Er verwaltet den Sitzungsstatus niemals selbst.
- Push-to-Talk (`VoicePushToTalk.begin()`) übernimmt sichtbaren Overlay-Text als `adoptedPrefix` (über `VoiceSessionCoordinator.shared.snapshot()`), sodass beim Drücken der Tastenkombination während der Anzeige des Aktivierungswort-Overlays der Text erhalten bleibt und neue Sprache angehängt wird. Beim Loslassen wartet es bis zu 1.5s auf ein endgültiges Transkript, bevor es auf den aktuellen Text zurückgreift.
- Bei `dismiss` ruft das Overlay `VoiceSessionCoordinator.overlayDidDismiss` auf, wodurch `VoiceWakeRuntime.refresh(state:)` ausgelöst wird. So wird das Abhören des Aktivierungsworts nach dem manuellen Schließen über X, dem Schließen bei leerem Text und dem Schließen nach dem Senden jeweils fortgesetzt.
- Einheitlicher Sendepfad: Wenn der Text nach dem Entfernen von Leerraum leer ist, schließen; andernfalls spielt `sendNow` den Sendeton einmal ab, leitet den Text über `VoiceWakeForwarder` weiter und schließt anschließend das Overlay.

## Protokollierung

Das Sprachsubsystem ist `ai.openclaw`; jede Komponente protokolliert unter ihrer eigenen Kategorie:

| Kategorie               | Komponente                                      |
| ----------------------- | ----------------------------------------------- |
| `voicewake.coordinator` | `VoiceSessionCoordinator`                       |
| `voicewake.overlay`     | `VoiceWakeOverlayController`/`VoiceWakeOverlay` |
| `voicewake.ptt`         | Push-to-Talk-Tastenkombination und -Aufnahme    |
| `voicewake.runtime`     | Aktivierungswort-Laufzeit                       |
| `voicewake.chime`       | Wiedergabe des Signaltons                       |
| `voicewake.sync`        | Globale Einstellungssynchronisierung            |
| `voicewake.forward`     | Weiterleitung des Transkripts                   |
| `voicewake.meter`       | Mikrofonpegelüberwachung                        |

## Checkliste zur Fehlerbehebung

- Streamen Sie die Protokolle, während Sie ein hängen gebliebenes Overlay reproduzieren:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Vergewissern Sie sich, dass nur ein aktives Sitzungstoken vorhanden ist; veraltete Rückrufe werden vom Koordinator verworfen.
- Stellen Sie sicher, dass beim Loslassen von Push-to-Talk stets `end()` mit dem aktiven Token aufgerufen wird; wenn der Text leer ist, muss das Overlay ohne Signalton oder Senden geschlossen werden.

## Verwandte Themen

- [macOS-App](/de/platforms/macos)
- [Sprachaktivierung (macOS)](/de/platforms/mac/voicewake)
- [Sprechmodus](/de/nodes/talk)
