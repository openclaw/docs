---
read_when:
    - Verhalten des Menüleistensymbols ändern
summary: Status und Animationen des Menüleistensymbols für OpenClaw unter macOS
title: Menüleistensymbol
x-i18n:
    generated_at: "2026-07-24T03:54:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8a38f1253f0c376ef2ce6c0ae339b67084c472c764964bcc7ad21e10133e2b47
    source_path: platforms/mac/icon.md
    workflow: 16
---

# Zustände des Menüleistensymbols

Geltungsbereich: macOS-App (`apps/macos`). Darstellung: `CritterIconRenderer.makeIcon(...)`. Verknüpfung von Animation und Zustand: `CritterStatusLabel` + `CritterStatusLabel+Behavior.swift`.

## Zustände

| Zustand                 | Auslöser                                   | Darstellung                                                                                              |
| ----------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Inaktiv                 | Standard                                   | Normale Blinzel-/Wackelanimation; offene Augen behalten einen glänzenden Lichtreflex                     |
| Pausiert                | `isPaused=true`                         | Antennen hängen mit offenen Augen herab („außer Dienst“); keine Bewegung                                 |
| Schlafend               | Gateway getrennt/nicht konfiguriert        | Antennen hängen herab und die Augen schließen sich zu `⌣ ⌣`-Lidern; keine Bewegung          |
| Feier                   | Nachricht gesendet (`sendCelebrationTick`)    | Augen zeigen für ~0.9s fröhliche `∩ ∩`-Bögen, zusätzlich erfolgt ein Beinschlag             |
| Sprachaktivierung (große Ohren) | Aktivierungswort erkannt           | Antennen richten sich gerade und höher auf (`earScale=1.9`); nach Stille werden sie zurückgesetzt    |
| Arbeitend               | `isWorking=true` oder ein aktiver `IconState` | Schnelleres Beinwackeln (`legWiggle` bis `1.0`) plus ein kleiner horizontaler Versatz; zusätzlich zum Wackeln im inaktiven Zustand |

Ein Werkzeugaktivitäts-Badge (SF-Symbol-Plakette, z. B. `chevron.left.slash.chevron.right` für die Ausführung) kann über demselben Tierchensymbol dargestellt werden, wenn eine Sitzung einen aktiven Auftrag oder ein aktives Werkzeug hat. Dieses Badge stammt aus `IconState`/`ActivityKind`; das vollständige Zustandsmodell finden Sie unter [Menüleiste](/de/platforms/mac/menu-bar).

## Ohren bei Sprachaktivierung

- Auslöser: `AppStateStore.shared.triggerVoiceEars(ttl: nil)`, aufgerufen aus der Erfassungspipeline für die Sprachaktivierung (`VoiceWakeRuntime`) sowie aus den Debug-/Testwerkzeugen für die Sprachaktivierung (`VoiceWakeTester`, `VoiceWakeOverlayController`).
- Stopp: `stopVoiceEars()`, wird aufgerufen, wenn die Erfassung abgeschlossen wird.
- Stillefenster vor dem Abschluss: normalerweise `2.0s`, `5.0s`, wenn nur das Aktivierungswort erkannt wurde und keine weitere Sprache folgte (`VoiceWakeRuntime.silenceWindow` / `triggerOnlySilenceWindow`).
- Während der Verstärkung sind die Timer für Blinzeln, Wackeln, Beine und Ohren im inaktiven Zustand ausgesetzt (`earBoostActive` steuert die Animationsaufgabe in `CritterStatusLabel+Behavior`).

## Formen und Größen

- Zeichenfläche: 18x18pt-Vorlagenbild, gerendert in einen 36x36px-Bitmap-Pufferspeicher (2x), damit das Symbol auf Retina-Displays scharf bleibt.
- Die Ohrskalierung verwendet standardmäßig `1.0`; die Sprachverstärkung setzt `earScale=1.9`, ohne den Gesamtrahmen zu ändern.
- `antennaDroop` (0-1) klappt die Antennen für die pausierte und schlafende Haltung nach unten.
- Das Beinwuseln verwendet `legWiggle` bis `1.0` mit einem kleinen horizontalen Wackeln.

## Verhaltenshinweise

- Es gibt keinen externen CLI-/Broker-Schalter für die Ohren oder den Arbeitszustand; beide werden intern durch App-Signale (`AppState.setWorking`, `AppState.triggerVoiceEars`) gesteuert, um unbeabsichtigtes Flattern zu vermeiden.
- Halten Sie jede neue TTL kurz (deutlich unter 10s), damit das Symbol schnell zum Ausgangszustand zurückkehrt, wenn ein Auftrag hängen bleibt.

## Verwandte Themen

- [Menüleiste](/de/platforms/mac/menu-bar)
- [macOS-App](/de/platforms/macos)
