---
read_when:
    - Erstellen oder Signieren von Mac-Debug-Builds
summary: Signierungsschritte für macOS-Debug-Builds, die von Paketierungsskripten erzeugt werden
title: macOS-Signierung
x-i18n:
    generated_at: "2026-07-16T13:14:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 406211dadc9293cf7983e75ae7dd98234f9088351234cf06c33df2f63d1b9b97
    source_path: platforms/mac/signing.md
    workflow: 16
---

# Mac-Signierung (Debug-Builds)

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) erstellt und paketiert die App unter einem festen Pfad (`dist/OpenClaw.app`) und ruft anschließend [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) auf, um sie zu signieren. TCC-Berechtigungen sind an die Bundle-ID und die Codesignatur gebunden. Wenn beide (und der feste Pfad der App) über erneute Builds hinweg unverändert bleiben, vergisst macOS die TCC-Freigaben nicht (Mitteilungen, Bedienungshilfen, Bildschirmaufnahme, Mikrofon, Spracherkennung).

- Die Debug-Bundle-ID ist standardmäßig `ai.openclaw.mac.debug` (mit `BUNDLE_ID=...` überschreibbar).
- Node: `>=22.22.3 <23`, `>=24.15.0 <25` oder `>=25.9.0` (Repo `package.json` `engines`). Das Paketierungsskript erstellt außerdem die Control UI (`pnpm ui:build`).
- Standardmäßig ist eine echte Signierungsidentität erforderlich. Das Codesign-Skript wird mit einem Fehler beendet, wenn keine gefunden wird und `ALLOW_ADHOC_SIGNING` nicht festgelegt ist. Die Ad-hoc-Signierung (`SIGN_IDENTITY="-"`) muss ausdrücklich aktiviert werden und bewahrt TCC-Berechtigungen nicht über erneute Builds hinweg. Siehe [macOS-Berechtigungen](/de/platforms/mac/permissions).
- Liest `SIGN_IDENTITY` aus der Umgebung (z. B. `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` oder ein Developer-ID-Application-Zertifikat). Ist die Variable nicht gesetzt, wählt `codesign-mac-app.sh` automatisch eine Identität in dieser Reihenfolge aus: Developer ID Application, Apple Distribution, Apple Development und anschließend die erste gefundene gültige Codesignaturidentität.
- `CODESIGN_TIMESTAMP=auto` (Standardwert) aktiviert vertrauenswürdige Zeitstempel nur für Developer-ID-Application-Signaturen. Legen Sie `on`/`off` fest, um die Einstellung in die jeweilige Richtung zu erzwingen.
- Ergänzt Info.plist um `OpenClawBuildTimestamp` (ISO8601 UTC) und `OpenClawGitCommit` (Kurz-Hash, `unknown`, falls nicht verfügbar), damit der Tab „Über“ Build, Git und den Debug-/Release-Kanal anzeigen kann.
- Führt nach der Signierung eine Team-ID-Prüfung durch und schlägt fehl, wenn eine Mach-O-Datei innerhalb des Bundles eine andere Team-ID aufweist. Legen Sie `SKIP_TEAM_ID_CHECK=1` fest, um die Prüfung zu umgehen.

## Verwendung

```bash
# vom Repo-Stammverzeichnis aus
scripts/package-mac-app.sh                                                      # wählt die Identität automatisch aus; Fehler, wenn keine gefunden wird
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # echtes Zertifikat
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # ad hoc (Berechtigungen bleiben nicht erhalten)
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # ausdrücklich ad hoc (mit derselben Einschränkung)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # nur für die Entwicklung vorgesehene Problemumgehung bei abweichender Sparkle-Team-ID
```

### Hinweis zur Ad-hoc-Signierung

`SIGN_IDENTITY="-"` deaktiviert die Hardened Runtime (`--options runtime`), um Abstürze zu verhindern, wenn die App eingebettete Frameworks (wie Sparkle) lädt, die nicht dieselbe Team-ID verwenden. Ad-hoc-Signaturen verhindern außerdem die dauerhafte Speicherung von TCC-Berechtigungen. Wiederherstellungsschritte finden Sie unter [macOS-Berechtigungen](/de/platforms/mac/permissions).

## Build-Metadaten für „Über“

Der Tab „Über“ liest `OpenClawBuildTimestamp` und `OpenClawGitCommit` aus Info.plist, um Version, Build-Datum, Git-Commit und den DEBUG-Status des Builds (über `#if DEBUG`) anzuzeigen. Führen Sie das Paketierungsskript nach Codeänderungen erneut aus, um diese Werte zu aktualisieren.

## Verwandte Themen

- [macOS-App](/de/platforms/macos)
- [macOS-Berechtigungen](/de/platforms/mac/permissions)
