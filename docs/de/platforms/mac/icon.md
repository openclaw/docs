---
read_when:
    - Verhalten des Menüleistensymbols ändern
summary: Zustände und Animationen des Menüleistensymbols für OpenClaw unter macOS
title: Menüleistensymbol
x-i18n:
    generated_at: "2026-05-06T06:56:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5497927721ff7486e9585a8a3edc2d5140408b2b0707acdcef2388e87bca20ec
    source_path: platforms/mac/icon.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Zustände des Menüleistensymbols

Autor: steipete · Aktualisiert: 2025-12-06 · Geltungsbereich: macOS-App (`apps/macos`)

- **Inaktiv:** Normale Symbolanimation (Blinken, gelegentliches Wackeln).
- **Pausiert:** Statuselement verwendet `appearsDisabled`; keine Bewegung.
- **Sprachauslöser (große Ohren):** Der Sprachaktivierungsdetektor ruft `AppState.triggerVoiceEars(ttl: nil)` auf, wenn das Aktivierungswort erkannt wird, und hält `earBoostActive=true`, während die Äußerung erfasst wird. Die Ohren werden größer skaliert (1,9x), erhalten zur besseren Lesbarkeit runde Ohrlöcher und werden dann nach 1 s Stille über `stopVoiceEars()` zurückgesetzt. Wird nur aus der sprachgesteuerten Pipeline in der App ausgelöst.
- **Arbeitend (Agent läuft):** `AppState.isWorking=true` steuert eine Mikroanimation für „Schwanz-/Beinbewegung“: schnelleres Beinwackeln und leichter Versatz, während Arbeit läuft. Derzeit rund um WebChat-Agent-Ausführungen umgeschaltet; fügen Sie dieselbe Umschaltung rund um andere lange Aufgaben hinzu, wenn Sie sie verdrahten.

Verdrahtungspunkte

- Sprachaktivierung: Runtime/Tester rufen bei Auslösung `AppState.triggerVoiceEars(ttl: nil)` und nach 1 s Stille `stopVoiceEars()` auf, um dem Erfassungsfenster zu entsprechen.
- Agent-Aktivität: Setzen Sie `AppStateStore.shared.setWorking(true/false)` rund um Arbeitsspannen (im WebChat-Agent-Aufruf bereits umgesetzt). Halten Sie Spannen kurz und setzen Sie sie in `defer`-Blöcken zurück, um hängengebliebene Animationen zu vermeiden.

Formen und Größen

- Basissymbol wird in `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)` gezeichnet.
- Ohrskalierung ist standardmäßig `1.0`; die Sprachverstärkung setzt `earScale=1.9` und schaltet `earHoles=true` um, ohne den Gesamtrahmen zu ändern (18×18 pt-Vorlagenbild, gerendert in einen 36×36 px-Retina-Backing-Store).
- Die schnelle Bewegung verwendet Beinwackeln bis zu ~1.0 mit einem kleinen horizontalen Zittern; sie wird additiv zu jedem bestehenden Inaktiv-Wackeln angewendet.

Verhaltenshinweise

- Keine externe CLI-/Broker-Umschaltung für Ohren/Arbeitszustand; behalten Sie dies intern bei den eigenen Signalen der App, um unbeabsichtigtes Hin- und Herschalten zu vermeiden.
- Halten Sie TTLs kurz (&lt;10 s), damit das Symbol schnell zum Ausgangszustand zurückkehrt, falls ein Job hängt.

## Verwandt

- [Menüleiste](/de/platforms/mac/menu-bar)
- [macOS-App](/de/platforms/macos)
