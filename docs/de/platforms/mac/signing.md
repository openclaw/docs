---
read_when:
    - Mac-Debug-Builds erstellen oder signieren
summary: Signierschritte für macOS-Debug-Builds, die von Paketierungsskripten generiert werden
title: macOS-Signierung
x-i18n:
    generated_at: "2026-05-07T13:21:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 58a4edd3d0df0d06c6e60251345a8e4a658bc4a3fceb4c01a21a9e98aeabfb6f
    source_path: platforms/mac/signing.md
    workflow: 16
---

# Mac-Signierung (Debug-Builds)

Diese App wird normalerweise mit [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) gebaut. Das Skript:

- setzt einen stabilen Debug-Bundle-Identifier: `ai.openclaw.mac.debug`
- schreibt die Info.plist mit dieser Bundle-ID (überschreibbar über `BUNDLE_ID=...`)
- ruft [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) auf, um die Haupt-Binärdatei und das App-Bundle zu signieren, damit macOS jeden Rebuild als dasselbe signierte Bundle behandelt und TCC-Berechtigungen beibehält (Benachrichtigungen, Bedienungshilfen, Bildschirmaufnahme, Mikrofon, Sprachausgabe). Verwenden Sie für stabile Berechtigungen eine echte Signaturidentität; Ad-hoc ist optional und fragil (siehe [macOS-Berechtigungen](/de/platforms/mac/permissions)).
- verwendet standardmäßig `CODESIGN_TIMESTAMP=auto`; dies aktiviert vertrauenswürdige Zeitstempel für Developer-ID-Signaturen. Setzen Sie `CODESIGN_TIMESTAMP=off`, um die Zeitstempelung zu überspringen (Offline-Debug-Builds).
- fügt Build-Metadaten in die Info.plist ein: `OpenClawBuildTimestamp` (UTC) und `OpenClawGitCommit` (kurzer Hash), damit der Info-Bereich Build, Git sowie Debug-/Release-Kanal anzeigen kann.
- **Die Paketierung verwendet standardmäßig Node 24**: Das Skript führt TS-Builds und den Control-UI-Build aus. Node 22 LTS, derzeit `22.16+`, wird aus Kompatibilitätsgründen weiterhin unterstützt.
- liest `SIGN_IDENTITY` aus der Umgebung. Fügen Sie `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (oder Ihr Developer-ID-Application-Zertifikat) zu Ihrer Shell-rc hinzu, um immer mit Ihrem Zertifikat zu signieren. Ad-hoc-Signierung erfordert explizite Zustimmung über `ALLOW_ADHOC_SIGNING=1` oder `SIGN_IDENTITY="-"` (für Berechtigungstests nicht empfohlen).
- führt nach der Signierung ein Team-ID-Audit aus und schlägt fehl, wenn eine Mach-O-Datei im App-Bundle mit einer anderen Team ID signiert ist. Setzen Sie `SKIP_TEAM_ID_CHECK=1`, um dies zu umgehen.

## Verwendung

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### Hinweis zur Ad-hoc-Signierung

Beim Signieren mit `SIGN_IDENTITY="-"` (ad-hoc) deaktiviert das Skript automatisch die **Hardened Runtime** (`--options runtime`). Dies ist erforderlich, um Abstürze zu verhindern, wenn die App versucht, eingebettete Frameworks (wie Sparkle) zu laden, die nicht dieselbe Team ID verwenden. Ad-hoc-Signaturen unterbrechen außerdem die Persistenz von TCC-Berechtigungen; Wiederherstellungsschritte finden Sie unter [macOS-Berechtigungen](/de/platforms/mac/permissions).

## Build-Metadaten für „Info“

`package-mac-app.sh` versieht das Bundle mit:

- `OpenClawBuildTimestamp`: ISO8601-UTC zum Paketierungszeitpunkt
- `OpenClawGitCommit`: kurzer Git-Hash (oder `unknown`, falls nicht verfügbar)

Der Info-Tab liest diese Schlüssel, um Version, Build-Datum, Git-Commit und ob es sich um einen Debug-Build handelt (über `#if DEBUG`) anzuzeigen. Führen Sie den Packager nach Codeänderungen aus, um diese Werte zu aktualisieren.

## Warum

TCC-Berechtigungen sind an den Bundle-Identifier _und_ die Codesignatur gebunden. Nicht signierte Debug-Builds mit wechselnden UUIDs führten dazu, dass macOS Berechtigungen nach jedem Rebuild vergaß. Das Signieren der Binärdateien (standardmäßig ad-hoc) und das Beibehalten einer festen Bundle-ID/eines festen Pfads (`dist/OpenClaw.app`) bewahrt die Berechtigungen zwischen Builds und entspricht damit dem VibeTunnel-Ansatz.

## Verwandt

- [macOS-App](/de/platforms/macos)
- [macOS-Berechtigungen](/de/platforms/mac/permissions)
