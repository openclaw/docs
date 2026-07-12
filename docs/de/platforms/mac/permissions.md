---
read_when:
    - Fehlende oder nicht reagierende macOS-Berechtigungsabfragen debuggen
    - Entscheiden, ob Node oder einer CLI-Laufzeitumgebung Bedienungshilfen gewährt werden sollen
    - Paketieren oder Signieren der macOS-App
    - Bundle-IDs oder App-Installationspfade ändern
summary: Persistenz von macOS-Berechtigungen (TCC) und Signierungsanforderungen
title: macOS-Berechtigungen
x-i18n:
    generated_at: "2026-07-12T15:38:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c8431a1d5a27aed00c50c5d6c8c36554cf766051dfdccea677d0523bbc4189d4
    source_path: platforms/mac/permissions.md
    workflow: 16
---

macOS-Berechtigungsfreigaben sind fragil. TCC verknüpft eine Berechtigungsfreigabe mit der Codesignatur, der Bundle-ID und dem Speicherpfad der App. Wenn sich einer dieser Faktoren ändert, behandelt macOS die App als neu und zeigt Eingabeaufforderungen möglicherweise nicht mehr an oder verwirft sie.

## Anforderungen für stabile Berechtigungen

- Gleicher Pfad: Führen Sie die App von einem festen Speicherort aus (für OpenClaw `dist/OpenClaw.app`).
- Gleiche Bundle-ID: Die Bundle-ID von OpenClaw lautet `ai.openclaw.mac`; eine Änderung erzeugt eine neue Berechtigungsidentität.
- Signierte App: Bei unsignierten oder ad hoc signierten Builds bleiben Berechtigungen nicht dauerhaft erhalten.
- Konsistente Signatur: Verwenden Sie ein echtes Apple-Development- oder Developer-ID-Zertifikat, damit die Signatur über mehrere Builds hinweg stabil bleibt.

Ad-hoc-Signaturen erzeugen bei jedem Build eine neue Identität. macOS vergisst vorherige Freigaben, und Eingabeaufforderungen können vollständig verschwinden, bis die veralteten Einträge gelöscht werden.

## Bedienungshilfenfreigaben für Node- und CLI-Laufzeitumgebungen

Gewähren Sie Bedienungshilfenzugriff vorzugsweise OpenClaw.app, Peekaboo.app oder einem anderen signierten Hilfsprogramm mit eigener Bundle-ID statt einer generischen `node`-Binärdatei.

macOS TCC gewährt Bedienungshilfenzugriff der Codeidentität des erkannten Prozesses. Wenn ein Homebrew-, nvm-, pnpm- oder npm-Workflow dazu führt, dass eine gemeinsam verwendete ausführbare `node`-Datei Bedienungshilfenzugriff erhält, kann jedes über dieselbe ausführbare Datei gestartete JavaScript-Paket Berechtigungen zur Automatisierung der grafischen Benutzeroberfläche erben.

Behandeln Sie einen `node`-Eintrag in den Systemeinstellungen als umfassende Berechtigung für diese Node-Laufzeitumgebung, nicht als Berechtigung für ein einzelnes npm-Paket. Gewähren Sie `node` keinen Bedienungshilfenzugriff, außer Sie vertrauen jedem Skript und Paket, das über genau diese Node-Installation gestartet wird.

Wenn Sie `node` versehentlich Bedienungshilfenzugriff gewährt haben, entfernen Sie diesen Eintrag unter System Settings -> Privacy & Security -> Accessibility. Gewähren Sie die Berechtigung anschließend der signierten App oder dem Hilfsprogramm, das für die UI-Automatisierung zuständig sein soll.

## Checkliste zur Wiederherstellung, wenn Eingabeaufforderungen verschwinden

1. Beenden Sie die App.
2. Entfernen Sie den App-Eintrag unter System Settings -> Privacy & Security.
3. Starten Sie die App erneut vom selben Pfad und gewähren Sie die Berechtigungen erneut.
4. Wenn die Eingabeaufforderung weiterhin nicht erscheint, setzen Sie die TCC-Einträge mit `tccutil` zurück und versuchen Sie es erneut.
5. Einige Berechtigungen werden erst nach einem vollständigen Neustart von macOS wieder angezeigt.

Beispiele zum Zurücksetzen (unter Verwendung der Bundle-ID von OpenClaw, `ai.openclaw.mac`):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Berechtigungen für Dateien und Ordner (Schreibtisch/Dokumente/Downloads)

macOS kann auch den Zugriff von Terminal- und Hintergrundprozessen auf Schreibtisch, Dokumente und Downloads beschränken. Wenn das Lesen von Dateien oder das Auflisten von Verzeichnissen nicht abgeschlossen wird, gewähren Sie dem Prozesskontext Zugriff, der die Dateioperationen ausführt (zum Beispiel Terminal/iTerm, eine durch LaunchAgent gestartete App oder ein SSH-Prozess).

Problemumgehung: Verschieben Sie Dateien in den OpenClaw-Arbeitsbereich (`~/.openclaw/workspace`), wenn Sie separate Freigaben für einzelne Ordner vermeiden möchten.

Wenn Sie Berechtigungen testen, signieren Sie immer mit einem echten Zertifikat. Ad-hoc-Builds sind nur für schnelle lokale Ausführungen akzeptabel, bei denen Berechtigungen keine Rolle spielen.

## Verwandte Themen

- [macOS-App](/de/platforms/macos)
- [macOS-Signierung](/de/platforms/mac/signing)
