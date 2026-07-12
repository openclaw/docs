---
read_when:
    - Erstellen oder Signieren von Mac-Debug-Builds
summary: Signierungsschritte für von Paketierungsskripten erzeugte macOS-Debug-Builds
title: macOS-Signierung
x-i18n:
    generated_at: "2026-07-12T15:39:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 663c08c031417d5a9f048581421e4fe9f69480917582f74746af675bcca5cf95
    source_path: platforms/mac/signing.md
    workflow: 16
---

# Mac-Signierung (Debug-Builds)

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) erstellt und paketiert die App unter einem festen Pfad (`dist/OpenClaw.app`) und ruft anschließend [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) auf, um sie zu signieren. TCC-Berechtigungen sind an die Bundle-ID und die Codesignatur gebunden. Wenn beide (und der feste Pfad der App) bei erneuten Builds unverändert bleiben, vergisst macOS die erteilten TCC-Berechtigungen nicht (Mitteilungen, Bedienungshilfen, Bildschirmaufnahme, Mikrofon, Spracherkennung).

- Die Debug-Bundle-ID lautet standardmäßig `ai.openclaw.mac.debug` (Überschreibung mit `BUNDLE_ID=...`).
- Node: `>=22.19.0 <23` oder `>=23.11.0` (`engines` in der `package.json` des Repositorys). Das Paketierungsskript erstellt außerdem die Control UI (`pnpm ui:build`).
- Standardmäßig ist eine echte Signierungsidentität erforderlich. Das Codesign-Skript wird mit einem Fehler beendet, wenn keine gefunden wurde und `ALLOW_ADHOC_SIGNING` nicht gesetzt ist. Die Ad-hoc-Signierung (`SIGN_IDENTITY="-"`) muss ausdrücklich aktiviert werden und bewahrt TCC-Berechtigungen nicht über erneute Builds hinweg. Siehe [macOS-Berechtigungen](/de/platforms/mac/permissions).
- Liest `SIGN_IDENTITY` aus der Umgebung (z. B. `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` oder ein Developer ID Application-Zertifikat). Wenn die Variable nicht gesetzt ist, wählt `codesign-mac-app.sh` automatisch eine Identität in dieser Reihenfolge aus: Developer ID Application, Apple Distribution, Apple Development und anschließend die erste gefundene gültige Codesignaturidentität.
- `CODESIGN_TIMESTAMP=auto` (Standard) aktiviert vertrauenswürdige Zeitstempel nur für Developer ID Application-Signaturen. Legen Sie `on`/`off` fest, um die jeweilige Einstellung zu erzwingen.
- Ergänzt Info.plist um `OpenClawBuildTimestamp` (ISO8601 UTC) und `OpenClawGitCommit` (Kurz-Hash, `unknown`, falls nicht verfügbar), damit die Registerkarte „Über“ Build, Git und den Debug-/Release-Kanal anzeigen kann.
- Führt nach der Signierung eine Team-ID-Prüfung durch und schlägt fehl, wenn eine Mach-O-Datei innerhalb des Bundles eine andere Team-ID aufweist. Legen Sie `SKIP_TEAM_ID_CHECK=1` fest, um die Prüfung zu überspringen.

## Verwendung

```bash
# aus dem Stammverzeichnis des Repositorys
scripts/package-mac-app.sh                                                      # wählt die Identität automatisch aus; Fehler, wenn keine gefunden wird
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # echtes Zertifikat
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # Ad-hoc (Berechtigungen bleiben nicht erhalten)
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # ausdrücklich Ad-hoc (gleicher Vorbehalt)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # nur für die Entwicklung: Behelfslösung für abweichende Sparkle-Team-ID
```

### Hinweis zur Ad-hoc-Signierung

`SIGN_IDENTITY="-"` deaktiviert die Hardened Runtime (`--options runtime`), um Abstürze zu verhindern, wenn die App eingebettete Frameworks (wie Sparkle) lädt, die nicht dieselbe Team-ID verwenden. Ad-hoc-Signaturen verhindern außerdem die dauerhafte Speicherung von TCC-Berechtigungen. Wiederherstellungsschritte finden Sie unter [macOS-Berechtigungen](/de/platforms/mac/permissions).

## Build-Metadaten für „Über“

Die Registerkarte „Über“ liest `OpenClawBuildTimestamp` und `OpenClawGitCommit` aus Info.plist, um Version, Build-Datum, Git-Commit und anzuzeigen, ob es sich um einen DEBUG-Build handelt (über `#if DEBUG`). Führen Sie das Paketierungsskript nach Codeänderungen erneut aus, um diese Werte zu aktualisieren.

## Verwandte Themen

- [macOS-App](/de/platforms/macos)
- [macOS-Berechtigungen](/de/platforms/mac/permissions)
