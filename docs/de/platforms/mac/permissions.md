---
read_when:
    - Fehlende oder hängen gebliebene macOS-Berechtigungsabfragen debuggen
    - Entscheidung, ob Node oder einer CLI-Laufzeitumgebung Bedienungshilfen gewährt werden sollen
    - Paketieren oder Signieren der macOS-App
    - Bundle-IDs oder App-Installationspfade ändern
summary: Persistenz von macOS-Berechtigungen (TCC) und Signierungsanforderungen
title: macOS-Berechtigungen
x-i18n:
    generated_at: "2026-07-24T05:04:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e561aa641e44fc1e1b95a3db244f31124e4e51d13ae709bee188d86054301e34
    source_path: platforms/mac/permissions.md
    workflow: 16
---

macOS-Berechtigungsfreigaben sind fragil. TCC verknüpft eine Berechtigungsfreigabe mit der Codesignatur, der Bundle-ID und dem Speicherpfad der App. Wenn sich eine dieser Angaben ändert, behandelt macOS die App als neu und zeigt Berechtigungsabfragen möglicherweise nicht mehr an oder verwirft sie.

## Anforderungen für stabile Berechtigungen

- Gleicher Pfad: Führen Sie die App von einem festen Speicherort aus (für OpenClaw: `dist/OpenClaw.app`).
- Gleiche Bundle-ID: Die Bundle-ID von OpenClaw lautet `ai.openclaw.mac`; eine Änderung erzeugt eine neue Berechtigungsidentität.
- Signierte App: Bei unsignierten oder ad hoc signierten Builds bleiben Berechtigungen nicht erhalten.
- Konsistente Signatur: Verwenden Sie ein echtes Apple-Development- oder Developer-ID-Zertifikat, damit die Signatur über erneute Builds hinweg stabil bleibt.

Ad-hoc-Signaturen erzeugen bei jedem Build eine neue Identität. macOS vergisst vorherige Freigaben, und Berechtigungsabfragen können vollständig verschwinden, bis die veralteten Einträge gelöscht werden.

## Bedienungshilfen-Freigaben für Node- und CLI-Laufzeitumgebungen

Gewähren Sie Bedienungshilfen vorzugsweise OpenClaw.app, Peekaboo.app oder einem anderen signierten Hilfsprogramm mit eigener Bundle-ID statt einer generischen `node`-Binärdatei.

macOS TCC gewährt Bedienungshilfen für die Codeidentität des erkannten Prozesses. Wenn durch einen Homebrew-, nvm-, pnpm- oder npm-Workflow eine gemeinsam genutzte ausführbare `node`-Datei Zugriff auf Bedienungshilfen erhält, kann jedes JavaScript-Paket, das über dieselbe ausführbare Datei gestartet wird, Berechtigungen zur GUI-Automatisierung erben.

Behandeln Sie einen `node`-Eintrag in den Systemeinstellungen als umfassende Berechtigung für diese Node-Laufzeitumgebung und nicht als Berechtigung für ein einzelnes npm-Paket. Gewähren Sie `node` keinen Zugriff auf Bedienungshilfen, sofern Sie nicht jedem Skript und Paket vertrauen, das über genau diese Node-Installation gestartet wird.

Die Freigabe für Bedienungshilfen aktiviert nicht die Weitergabe von Aktivitätsdaten. **Settings -> Permissions -> Active computer detection** ist eine separate, standardmäßig deaktivierte Einstellung zur Weitergabe einer begrenzten Inaktivitätsdauer an Ihren Gateway. Wenn Sie sie deaktivieren, werden gespeicherte Aktivitätsdaten gelöscht, ohne den Zugriff auf Bedienungshilfen zu widerrufen oder die Verbindung zum Node zu trennen.

Wenn Sie `node` versehentlich Zugriff auf Bedienungshilfen gewährt haben, entfernen Sie diesen Eintrag unter System Settings -> Privacy & Security -> Accessibility. Gewähren Sie die Berechtigung anschließend der signierten App oder dem Hilfsprogramm, das für die UI-Automatisierung zuständig sein soll.

## Checkliste zur Wiederherstellung bei ausbleibenden Berechtigungsabfragen

1. Beenden Sie die App.
2. Entfernen Sie den App-Eintrag unter System Settings -> Privacy & Security.
3. Starten Sie die App erneut vom selben Pfad und gewähren Sie die Berechtigungen erneut.
4. Wenn die Abfrage weiterhin nicht angezeigt wird, setzen Sie die TCC-Einträge mit `tccutil` zurück und versuchen Sie es erneut.
5. Einige Berechtigungsabfragen werden erst nach einem vollständigen Neustart von macOS wieder angezeigt.

Beispiele für das Zurücksetzen (mit der Bundle-ID von OpenClaw, `ai.openclaw.mac`):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Berechtigungen für Dateien und Ordner (Schreibtisch/Dokumente/Downloads)

macOS kann den Zugriff von Terminal- und Hintergrundprozessen auf Schreibtisch, Dokumente und Downloads ebenfalls beschränken. Wenn das Lesen von Dateien oder das Auflisten von Verzeichnissen hängen bleibt, gewähren Sie dem Prozesskontext Zugriff, der die Dateioperationen ausführt (beispielsweise Terminal/iTerm, einer über LaunchAgent gestarteten App oder einem SSH-Prozess).

Problemumgehung: Verschieben Sie Dateien in den OpenClaw-Arbeitsbereich (`~/.openclaw/workspace`), wenn Sie keine Berechtigungen für einzelne Ordner erteilen möchten.

Wenn Sie Berechtigungen testen, signieren Sie stets mit einem echten Zertifikat. Ad-hoc-Builds sind nur für schnelle lokale Ausführungen akzeptabel, bei denen Berechtigungen keine Rolle spielen.

## Verwandte Themen

- [macOS-App](/de/platforms/macos)
- [macOS-Signierung](/de/platforms/mac/signing)
