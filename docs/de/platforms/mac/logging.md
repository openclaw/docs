---
read_when:
    - macOS-Protokolle erfassen oder die Protokollierung privater Daten untersuchen
    - Fehlerbehebung bei Problemen mit dem Lebenszyklus von Sprachaktivierung und Sitzungen
summary: 'OpenClaw-Protokollierung: rotierende Diagnoseprotokolldatei + einheitliche Datenschutzoptionen für Protokolle'
title: macOS-Protokollierung
x-i18n:
    generated_at: "2026-07-12T15:38:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ef0fd91bd7fc0a8b5f598cfe8f5de551795a4badd0f6634c5bcbd4f3916bfc64
    source_path: platforms/mac/logging.md
    workflow: 16
---

# Protokollierung (macOS)

## Rotierende Diagnoseprotokolldatei (Debug-Bereich)

Die macOS-App protokolliert über swift-log (standardmäßig einheitliche Protokollierung) und kann für eine dauerhafte Erfassung zusätzlich eine rotierende lokale Protokolldatei schreiben (`DiagnosticsFileLog`).

- Aktivieren: **Debug pane -> Logs -> App logging -> "Write rolling diagnostics log (JSONL)"** (standardmäßig deaktiviert).
- Ausführlichkeit: Auswahlfeld **Debug pane -> Logs -> App logging -> Verbosity**.
- Speicherort: `~/Library/Logs/OpenClaw/diagnostics.jsonl`.
- Rotation: Rotation bei 5 MB; bis zu 5 Sicherungen mit den Suffixen `.1`...`.5` (die älteste wird gelöscht).
- Löschen: **Debug pane -> Logs -> App logging -> "Clear"** löscht die aktive Datei und alle Sicherungen.

Behandeln Sie die Datei als vertraulich; geben Sie sie nicht ohne vorherige Prüfung weiter.

## Private Daten in der einheitlichen Protokollierung unter macOS

Die einheitliche Protokollierung schwärzt die meisten Nutzdaten, sofern ein Subsystem nicht `privacy -off` aktiviert. Dies wird durch eine Plist-Datei in `/Library/Preferences/Logging/Subsystems/` gesteuert, deren Schlüssel der Name des Subsystems ist. Das Flag gilt nur für neue Protokolleinträge. Aktivieren Sie es daher, bevor Sie ein Problem reproduzieren. Hintergrund: [Besonderheiten des Datenschutzes bei der macOS-Protokollierung](https://steipete.me/posts/2025/logging-privacy-shenanigans).

## Für OpenClaw aktivieren (`ai.openclaw`)

Schreiben Sie die Plist-Datei zunächst in eine temporäre Datei und installieren Sie sie anschließend atomar als root:

```bash
cat <<'EOF' >/tmp/ai.openclaw.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>DEFAULT-OPTIONS</key>
    <dict>
        <key>Enable-Private-Data</key>
        <true/>
    </dict>
</dict>
</plist>
EOF
sudo install -m 644 -o root -g wheel /tmp/ai.openclaw.plist /Library/Preferences/Logging/Subsystems/ai.openclaw.plist
```

Es ist kein Neustart erforderlich; logd übernimmt die Datei schnell, aber nur neue Protokollzeilen enthalten private Nutzdaten. Zeigen Sie die ausführlichere Ausgabe mit `./scripts/clawlog.sh --category WebChat --last 5m` an (`--last`/`-l` legt den Zeitraum fest, Standardwert `5m`; `--category`/`-c` filtert nach Kategorie).

## Nach dem Debugging deaktivieren

- Entfernen Sie die Überschreibung: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Führen Sie optional `sudo log config --reload` aus, damit logd die Überschreibung sofort verwirft.
- Diese Oberfläche kann Telefonnummern und Nachrichteninhalte enthalten; lassen Sie die Plist-Datei nur bestehen, solange sie aktiv benötigt wird.

## Verwandte Themen

- [macOS-App](/de/platforms/macos)
- [Gateway-Protokollierung](/de/gateway/logging)
