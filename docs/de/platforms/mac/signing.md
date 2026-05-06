---
read_when:
    - Mac-Debug-Builds erstellen oder signieren
summary: Schritte zum Signieren von macOS-Debug-Builds, die von Paketierungsskripten erzeugt werden
title: macOS-Signierung
x-i18n:
    generated_at: "2026-05-06T06:56:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08a2f18f0f813c0bb7352b393531ad69d24da55de2e6ec6446febe0661eb4598
    source_path: platforms/mac/signing.md
    workflow: 16
---

# Mac-Signierung (Debug-Builds)

Diese App wird normalerweise mit [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) gebaut. Das Skript führt jetzt Folgendes aus:

- setzt eine stabile Debug-Bundle-ID: `ai.openclaw.mac.debug`
- schreibt die Info.plist mit dieser Bundle-ID (Überschreiben über `BUNDLE_ID=...`)
- ruft [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) auf, um die Haupt-Binary und das App-Bundle zu signieren, damit macOS jeden Rebuild als dasselbe signierte Bundle behandelt und TCC-Berechtigungen beibehält (Benachrichtigungen, Bedienungshilfen, Bildschirmaufnahme, Mikrofon, Sprache). Verwenden Sie für stabile Berechtigungen eine echte Signierungsidentität; Ad-hoc ist Opt-in und fragil (siehe [macOS-Berechtigungen](/de/platforms/mac/permissions)).
- verwendet standardmäßig `CODESIGN_TIMESTAMP=auto`; dadurch werden vertrauenswürdige Zeitstempel für Developer-ID-Signaturen aktiviert. Setzen Sie `CODESIGN_TIMESTAMP=off`, um die Zeitstempelung zu überspringen (Offline-Debug-Builds).
- fügt Build-Metadaten in die Info.plist ein: `OpenClawBuildTimestamp` (UTC) und `OpenClawGitCommit` (kurzer Hash), damit der Info-Bereich Build, Git und Debug-/Release-Kanal anzeigen kann.
- **Das Packaging verwendet standardmäßig Node 24**: Das Skript führt TS-Builds und den Build der Control UI aus. Node 22 LTS, derzeit `22.14+`, bleibt aus Kompatibilitätsgründen unterstützt.
- liest `SIGN_IDENTITY` aus der Umgebung. Fügen Sie `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (oder Ihr Developer-ID-Application-Zertifikat) zu Ihrer Shell-RC hinzu, um immer mit Ihrem Zertifikat zu signieren. Ad-hoc-Signierung erfordert ein explizites Opt-in über `ALLOW_ADHOC_SIGNING=1` oder `SIGN_IDENTITY="-"` (für Berechtigungstests nicht empfohlen).
- führt nach der Signierung ein Team-ID-Audit aus und schlägt fehl, wenn eine Mach-O-Datei innerhalb des App-Bundles mit einer anderen Team-ID signiert ist. Setzen Sie `SKIP_TEAM_ID_CHECK=1`, um dies zu umgehen.

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

Beim Signieren mit `SIGN_IDENTITY="-"` (ad-hoc) deaktiviert das Skript automatisch die **Hardened Runtime** (`--options runtime`). Dies ist erforderlich, um Abstürze zu verhindern, wenn die App versucht, eingebettete Frameworks (wie Sparkle) zu laden, die nicht dieselbe Team-ID verwenden. Ad-hoc-Signaturen verhindern außerdem die Persistenz von TCC-Berechtigungen; Wiederherstellungsschritte finden Sie unter [macOS-Berechtigungen](/de/platforms/mac/permissions).

## Build-Metadaten für „Info“

`package-mac-app.sh` versieht das Bundle mit:

- `OpenClawBuildTimestamp`: ISO8601-UTC zum Packaging-Zeitpunkt
- `OpenClawGitCommit`: kurzer Git-Hash (oder `unknown`, falls nicht verfügbar)

Der Tab „Info“ liest diese Schlüssel, um Version, Build-Datum, Git-Commit und ob es sich um einen Debug-Build handelt (über `#if DEBUG`), anzuzeigen. Führen Sie den Packager nach Codeänderungen aus, um diese Werte zu aktualisieren.

## Warum

TCC-Berechtigungen sind an die Bundle-ID _und_ die Codesignatur gebunden. Unsigned Debug-Builds mit wechselnden UUIDs führten dazu, dass macOS erteilte Berechtigungen nach jedem Rebuild vergaß. Das Signieren der Binaries (standardmäßig ad-hoc) und das Beibehalten einer festen Bundle-ID/eines festen Pfads (`dist/OpenClaw.app`) bewahrt die Berechtigungen zwischen Builds und entspricht dem Ansatz von VibeTunnel.

## Verwandt

- [macOS-App](/de/platforms/macos)
- [macOS-Berechtigungen](/de/platforms/mac/permissions)
