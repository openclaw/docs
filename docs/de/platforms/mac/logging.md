---
read_when:
    - macOS-Logs erfassen oder die Protokollierung privater Daten untersuchen
    - Debugging von Problemen im Lebenszyklus von Sprachaktivierung und Sitzungen
summary: 'OpenClaw-Protokollierung: rollierende Diagnose-Dateiprotokolle + Datenschutz-Flags für das Unified Log'
title: macOS-Protokollierung
x-i18n:
    generated_at: "2026-05-06T06:56:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c001008311d4e3f245add4cce32bdcc3eed9d897b30f6884c0649d2f0523df
    source_path: platforms/mac/logging.md
    workflow: 16
---

# Logging (macOS)

## Rotierendes Diagnosedatei-Log (Debug-Bereich)

OpenClaw leitet macOS-App-Logs über swift-log weiter (standardmäßig Unified Logging) und kann bei Bedarf ein lokales, rotierendes Datei-Log auf die Festplatte schreiben, wenn Sie eine dauerhafte Aufzeichnung benötigen.

- Detailgrad: **Debug-Bereich → Logs → App logging → Detailgrad**
- Aktivieren: **Debug-Bereich → Logs → App logging → „Rotierendes Diagnose-Log schreiben (JSONL)”**
- Speicherort: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (rotiert automatisch; alte Dateien erhalten die Endungen `.1`, `.2`, …)
- Leeren: **Debug-Bereich → Logs → App logging → „Leeren”**

Hinweise:

- Dies ist **standardmäßig deaktiviert**. Aktivieren Sie es nur während der aktiven Fehlersuche.
- Behandeln Sie die Datei als vertraulich; geben Sie sie nicht ohne Prüfung weiter.

## Private Daten im Unified Logging unter macOS

Unified Logging schwärzt die meisten Nutzdaten, sofern ein Subsystem nicht `privacy -off` aktiviert. Laut Peters Beitrag zu macOS-[Datenschutzbesonderheiten beim Logging](https://steipete.me/posts/2025/logging-privacy-shenanigans) (2025) wird dies über eine plist in `/Library/Preferences/Logging/Subsystems/` gesteuert, die nach dem Subsystemnamen benannt ist. Nur neue Logeinträge übernehmen das Flag, aktivieren Sie es daher, bevor Sie ein Problem reproduzieren.

## Für OpenClaw aktivieren (`ai.openclaw`)

- Schreiben Sie die plist zuerst in eine temporäre Datei und installieren Sie sie dann atomar als root:

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

- Ein Neustart ist nicht erforderlich; logd erkennt die Datei schnell, aber nur neue Logzeilen enthalten private Nutzdaten.
- Zeigen Sie die detailliertere Ausgabe mit dem vorhandenen Hilfsprogramm an, z. B. `./scripts/clawlog.sh --category WebChat --last 5m`.

## Nach der Fehlersuche deaktivieren

- Entfernen Sie die Überschreibung: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- Führen Sie optional `sudo log config --reload` aus, damit logd die Überschreibung sofort verwirft.
- Denken Sie daran, dass diese Oberfläche Telefonnummern und Nachrichtentexte enthalten kann; lassen Sie die plist nur so lange bestehen, wie Sie die zusätzlichen Details aktiv benötigen.

## Verwandt

- [macOS-App](/de/platforms/macos)
- [Gateway-Logging](/de/gateway/logging)
