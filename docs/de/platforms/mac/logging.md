---
read_when:
    - macOS-Protokolle erfassen oder die Protokollierung privater Daten untersuchen
    - Debugging von Problemen mit dem Lebenszyklus der Sprachaktivierung und Sitzung
summary: 'OpenClaw-Protokollierung: rotierendes Diagnose-Dateiprotokoll + einheitliche Datenschutz-Flags für Protokolle'
title: macOS-Protokollierung
x-i18n:
    generated_at: "2026-07-24T03:59:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ef0fd91bd7fc0a8b5f598cfe8f5de551795a4badd0f6634c5bcbd4f3916bfc64
    source_path: platforms/mac/logging.md
    workflow: 16
---

# Protokollierung (macOS)

## Rotierende Diagnoseprotokolldatei (Debug-Bereich)

Die macOS-App protokolliert über swift-log (standardmäßig einheitliche Protokollierung) und kann für eine dauerhafte Erfassung (`DiagnosticsFileLog`) zusätzlich in eine rotierende lokale Protokolldatei schreiben.

- Aktivieren: **Debug pane -> Logs -> App logging -> "Write rolling diagnostics log (JSONL)"** (standardmäßig deaktiviert).
- Ausführlichkeit: Auswahlfeld **Debug pane -> Logs -> App logging -> Verbosity**.
- Speicherort: `~/Library/Logs/OpenClaw/diagnostics.jsonl`.
- Rotation: erfolgt bei 5 MB; bis zu 5 Sicherungen mit den Suffixen `.1`...`.5` (die älteste wird gelöscht).
- Löschen: **Debug pane -> Logs -> App logging -> "Clear"** löscht die aktive Datei und alle Sicherungen.

Behandeln Sie die Datei als vertraulich; geben Sie sie nicht ohne vorherige Prüfung weiter.

## Private Daten in der einheitlichen Protokollierung unter macOS

Die einheitliche Protokollierung schwärzt die meisten Nutzdaten, sofern ein Subsystem nicht `privacy -off` aktiviert. Dies wird über eine plist-Datei in `/Library/Preferences/Logging/Subsystems/` gesteuert, deren Schlüssel der Name des Subsystems ist. Nur neue Protokolleinträge übernehmen das Flag. Aktivieren Sie es daher, bevor Sie ein Problem reproduzieren. Hintergrund: [Datenschutz-Eigenheiten der macOS-Protokollierung](https://steipete.me/posts/2025/logging-privacy-shenanigans).

## Für OpenClaw aktivieren (`ai.openclaw`)

Schreiben Sie die plist-Datei zunächst in eine temporäre Datei und installieren Sie sie anschließend atomar als root:

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

Es ist kein Neustart erforderlich; logd übernimmt die Datei schnell, aber nur neue Protokollzeilen enthalten private Nutzdaten. Zeigen Sie die ausführlichere Ausgabe mit `./scripts/clawlog.sh --category WebChat --last 5m` an (`--last`/`-l` legt den Zeitraum fest, standardmäßig `5m`; `--category`/`-c` filtert nach Kategorie).

## Nach dem Debugging deaktivieren

- Entfernen Sie die Außerkraftsetzung: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Führen Sie optional `sudo log config --reload` aus, damit logd die Außerkraftsetzung sofort verwirft.
- Diese Oberfläche kann Telefonnummern und Nachrichteninhalte enthalten; belassen Sie die plist-Datei nur so lange, wie sie aktiv benötigt wird.

## Verwandte Themen

- [macOS-App](/de/platforms/macos)
- [Gateway-Protokollierung](/de/gateway/logging)
