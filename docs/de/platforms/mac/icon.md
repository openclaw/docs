---
read_when:
    - Verhalten des Menüleistensymbols ändern
summary: Status und Animationen des Menüleistensymbols für OpenClaw unter macOS
title: Menüleistensymbol
x-i18n:
    generated_at: "2026-07-12T15:38:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8a38f1253f0c376ef2ce6c0ae339b67084c472c764964bcc7ad21e10133e2b47
    source_path: platforms/mac/icon.md
    workflow: 16
---

# Zustände des Menüleistensymbols

Geltungsbereich: macOS-App (`apps/macos`). Rendering: `CritterIconRenderer.makeIcon(...)`. Verknüpfung von Animation und Zustand: `CritterStatusLabel` + `CritterStatusLabel+Behavior.swift`.

## Zustände

| Zustand                    | Auslöser                                  | Darstellung                                                                                                   |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Inaktiv                    | Standard                                  | Normale Blinzel-/Wackelanimation; geöffnete Augen behalten einen glänzenden Lichtreflex                        |
| Pausiert                   | `isPaused=true`                           | Fühler hängen bei geöffneten Augen herab („außer Dienst“); keine Bewegung                                     |
| Schlafend                  | Gateway getrennt/nicht konfiguriert       | Fühler hängen herab und die Augen schließen sich zu `⌣ ⌣`-Lidern; keine Bewegung                              |
| Feier                      | Nachricht gesendet (`sendCelebrationTick`)| Augen blitzen für ~0.9s als fröhliche `∩ ∩`-Bögen auf, zusätzlich erfolgt ein Beinschlag                       |
| Sprachaktivierung (große Ohren) | Aktivierungswort erkannt             | Fühler richten sich gerade und höher auf (`earScale=1.9`); sinken nach Stille wieder ab                         |
| Arbeitend                  | `isWorking=true` oder ein aktiver `IconState` | Schnelleres Beinwackeln (`legWiggle` bis zu `1.0`) sowie ein kleiner horizontaler Versatz; zusätzlich zum Wackeln im inaktiven Zustand |

Ein Badge für Werkzeugaktivität (SF-Symbol-Plakette, z. B. `chevron.left.slash.chevron.right` für die Ausführung) kann über demselben Tierchensymbol dargestellt werden, wenn eine Sitzung einen aktiven Auftrag oder ein aktives Werkzeug hat. Dieses Badge stammt aus `IconState`/`ActivityKind`; das vollständige Zustandsmodell finden Sie unter [Menüleiste](/de/platforms/mac/menu-bar).

## Ohren bei Sprachaktivierung

- Auslöser: `AppStateStore.shared.triggerVoiceEars(ttl: nil)`, aufgerufen aus der Erfassungspipeline für die Sprachaktivierung (`VoiceWakeRuntime`) sowie aus den Debug-/Testwerkzeugen für die Sprachaktivierung (`VoiceWakeTester`, `VoiceWakeOverlayController`).
- Beenden: `stopVoiceEars()`, wird aufgerufen, wenn die Erfassung abgeschlossen wird.
- Stillefenster vor dem Abschluss: normalerweise `2.0s`, `5.0s`, wenn nur das Aktivierungswort erkannt wurde und keine weitere Sprache folgte (`VoiceWakeRuntime.silenceWindow` / `triggerOnlySilenceWindow`).
- Während der Verstärkung werden die Timer für Blinzeln/Wackeln/Beine/Ohren im inaktiven Zustand ausgesetzt (`earBoostActive` sperrt die Animationsaufgabe in `CritterStatusLabel+Behavior`).

## Formen und Größen

- Zeichenfläche: 18x18pt-Vorlagenbild, gerendert in einen 36x36px-Bitmap-Zwischenspeicher (2x), damit das Symbol auf Retina-Displays scharf bleibt.
- Die Ohrskalierung beträgt standardmäßig `1.0`; die Sprachverstärkung setzt `earScale=1.9`, ohne den Gesamtrahmen zu ändern.
- `antennaDroop` (0-1) klappt die Fühler für die pausierte und schlafende Pose nach unten.
- Das Beinwuseln verwendet `legWiggle` bis zu `1.0` mit einem kleinen horizontalen Ruckeln.

## Hinweise zum Verhalten

- Es gibt keinen externen CLI-/Broker-Schalter für die Ohren oder den Arbeitszustand; beide werden intern durch App-Signale (`AppState.setWorking`, `AppState.triggerVoiceEars`) gesteuert, um unbeabsichtigtes Flattern zu vermeiden.
- Halten Sie jede neue TTL kurz (deutlich unter 10s), damit das Symbol schnell zum Ausgangszustand zurückkehrt, falls ein Auftrag hängen bleibt.

## Verwandte Themen

- [Menüleiste](/de/platforms/mac/menu-bar)
- [macOS-App](/de/platforms/macos)
