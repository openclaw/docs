---
read_when:
    - Mac-Debug-Builds erstellen oder signieren
summary: Signierschritte für macOS-Debug-Builds, die von Paketierungsskripten erzeugt werden
title: macOS-Signierung
x-i18n:
    generated_at: "2026-06-27T17:43:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df4ee44b6bdf09a24e0d05ed4354e2cb573372d12a667b4fcdfd7d6f88291082
    source_path: platforms/mac/signing.md
    workflow: 16
---

# Mac-Signierung (Debug-Builds)

Diese App wird normalerweise mit [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) gebaut. Das Skript führt jetzt Folgendes aus:

- legt eine stabile Debug-Bundle-ID fest: `ai.openclaw.mac.debug`
- schreibt die Info.plist mit dieser Bundle-ID (überschreibbar über `BUNDLE_ID=...`)
- ruft [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) auf, um das Haupt-Binary und das App-Bundle zu signieren, damit macOS jeden Neubuild als dasselbe signierte Bundle behandelt und TCC-Berechtigungen beibehält (Benachrichtigungen, Bedienungshilfen, Bildschirmaufnahme, Mikrofon, Sprachausgabe). Für stabile Berechtigungen verwenden Sie eine echte Signieridentität; Ad-hoc ist Opt-in und fragil (siehe [macOS-Berechtigungen](/de/platforms/mac/permissions)).
- verwendet standardmäßig `CODESIGN_TIMESTAMP=auto`; dies aktiviert vertrauenswürdige Zeitstempel für Developer-ID-Signaturen. Setzen Sie `CODESIGN_TIMESTAMP=off`, um Zeitstempel zu überspringen (Offline-Debug-Builds).
- fügt Build-Metadaten in die Info.plist ein: `OpenClawBuildTimestamp` (UTC) und `OpenClawGitCommit` (kurzer Hash), damit der Über-Dialog Build, Git und Debug-/Release-Kanal anzeigen kann.
- **Packaging verwendet standardmäßig Node 24**: Das Skript führt TS-Builds und den Build der Control UI aus. Node 22 LTS, derzeit `22.19+`, wird aus Kompatibilitätsgründen weiterhin unterstützt.
- liest `SIGN_IDENTITY` aus der Umgebung. Fügen Sie `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (oder Ihr Developer ID Application-Zertifikat) zu Ihrer Shell-RC hinzu, um immer mit Ihrem Zertifikat zu signieren. Ad-hoc-Signierung erfordert explizites Opt-in über `ALLOW_ADHOC_SIGNING=1` oder `SIGN_IDENTITY="-"` (für Berechtigungstests nicht empfohlen).
- führt nach dem Signieren ein Team-ID-Audit aus und schlägt fehl, wenn ein Mach-O innerhalb des App-Bundles von einer anderen Team-ID signiert wurde. Setzen Sie `SKIP_TEAM_ID_CHECK=1`, um dies zu umgehen.

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

Beim Signieren mit `SIGN_IDENTITY="-"` (Ad-hoc) deaktiviert das Skript automatisch die **Hardened Runtime** (`--options runtime`). Dies ist notwendig, um Abstürze zu verhindern, wenn die App versucht, eingebettete Frameworks (wie Sparkle) zu laden, die nicht dieselbe Team-ID haben. Ad-hoc-Signaturen beeinträchtigen außerdem die Persistenz von TCC-Berechtigungen; Wiederherstellungsschritte finden Sie unter [macOS-Berechtigungen](/de/platforms/mac/permissions).

## Build-Metadaten für „Über“

`package-mac-app.sh` versieht das Bundle mit:

- `OpenClawBuildTimestamp`: ISO 8601 UTC zum Paketierungszeitpunkt
- `OpenClawGitCommit`: kurzer Git-Hash (oder `unknown`, falls nicht verfügbar)

Der Über-Tab liest diese Schlüssel, um Version, Build-Datum, Git-Commit und ob es sich um einen Debug-Build handelt (über `#if DEBUG`) anzuzeigen. Führen Sie den Packager nach Codeänderungen aus, um diese Werte zu aktualisieren.

## Warum

TCC-Berechtigungen sind an die Bundle-ID _und_ die Codesignatur gebunden. Nicht signierte Debug-Builds mit wechselnden UUIDs führten dazu, dass macOS Berechtigungen nach jedem Neubuild vergaß. Das Signieren der Binaries (standardmäßig Ad-hoc) und das Beibehalten einer festen Bundle-ID/eines festen Pfads (`dist/OpenClaw.app`) erhält die Berechtigungen zwischen Builds, entsprechend dem VibeTunnel-Ansatz.

## Verwandte Themen

- [macOS-App](/de/platforms/macos)
- [macOS-Berechtigungen](/de/platforms/mac/permissions)
