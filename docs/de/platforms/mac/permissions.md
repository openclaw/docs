---
read_when:
    - Fehlerbehebung bei fehlenden oder hängen gebliebenen macOS-Berechtigungsabfragen
    - Entscheiden, ob Node oder einer CLI-Laufzeitumgebung Bedienungshilfen gewährt werden sollen
    - Paketieren oder Signieren der macOS-App
    - Bundle-IDs oder App-Installationspfade ändern
summary: Persistenz von macOS-Berechtigungen (TCC) und Anforderungen an die Signierung
title: macOS-Berechtigungen
x-i18n:
    generated_at: "2026-07-12T01:51:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c8431a1d5a27aed00c50c5d6c8c36554cf766051dfdccea677d0523bbc4189d4
    source_path: platforms/mac/permissions.md
    workflow: 16
---

macOS-Berechtigungen sind fragil. TCC verknüpft eine Berechtigung mit der Codesignatur, der Bundle-ID und dem Speicherpfad der App. Wenn sich einer dieser Werte ändert, behandelt macOS die App als neu und zeigt Berechtigungsabfragen möglicherweise nicht mehr an oder verwirft sie.

## Anforderungen für stabile Berechtigungen

- Gleicher Pfad: Führen Sie die App von einem festen Speicherort aus (für OpenClaw `dist/OpenClaw.app`).
- Gleiche Bundle-ID: Die Bundle-ID von OpenClaw lautet `ai.openclaw.mac`; eine Änderung erzeugt eine neue Berechtigungsidentität.
- Signierte App: Bei unsignierten oder ad hoc signierten Builds bleiben Berechtigungen nicht erhalten.
- Konsistente Signatur: Verwenden Sie ein echtes Apple-Development- oder Developer-ID-Zertifikat, damit die Signatur bei erneuten Builds stabil bleibt.

Ad-hoc-Signaturen erzeugen bei jedem Build eine neue Identität. macOS vergisst zuvor erteilte Berechtigungen, und Berechtigungsabfragen können vollständig verschwinden, bis die veralteten Einträge gelöscht werden.

## Bedienungshilfen-Berechtigungen für Node- und CLI-Laufzeitumgebungen

Erteilen Sie die Berechtigung für Bedienungshilfen vorzugsweise OpenClaw.app, Peekaboo.app oder einem anderen signierten Hilfsprogramm mit eigener Bundle-ID statt einer generischen `node`-Binärdatei.

macOS TCC erteilt die Berechtigung für Bedienungshilfen der Codeidentität des erkannten Prozesses. Wenn durch einen Homebrew-, nvm-, pnpm- oder npm-Workflow eine gemeinsam genutzte ausführbare `node`-Datei diese Berechtigung erhält, kann jedes über dieselbe ausführbare Datei gestartete JavaScript-Paket die Berechtigungen zur Automatisierung der grafischen Benutzeroberfläche übernehmen.

Betrachten Sie einen `node`-Eintrag in den Systemeinstellungen als umfassende Berechtigung für diese Node-Laufzeitumgebung und nicht als Berechtigung für ein einzelnes npm-Paket. Erteilen Sie `node` nur dann die Berechtigung für Bedienungshilfen, wenn Sie allen Skripten und Paketen vertrauen, die über genau diese Node-Installation gestartet werden.

Wenn Sie `node` versehentlich die Berechtigung für Bedienungshilfen erteilt haben, entfernen Sie diesen Eintrag unter System Settings -> Privacy & Security -> Accessibility. Erteilen Sie die Berechtigung anschließend der signierten App oder dem Hilfsprogramm, das für die Automatisierung der Benutzeroberfläche zuständig sein soll.

## Checkliste zur Wiederherstellung bei verschwundenen Berechtigungsabfragen

1. Beenden Sie die App.
2. Entfernen Sie den App-Eintrag unter System Settings -> Privacy & Security.
3. Starten Sie die App erneut vom selben Pfad und erteilen Sie die Berechtigungen erneut.
4. Wenn die Abfrage weiterhin nicht erscheint, setzen Sie die TCC-Einträge mit `tccutil` zurück und versuchen Sie es erneut.
5. Einige Berechtigungsabfragen erscheinen erst nach einem vollständigen Neustart von macOS wieder.

Beispiele für das Zurücksetzen (mit der Bundle-ID von OpenClaw, `ai.openclaw.mac`):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Berechtigungen für Dateien und Ordner (Schreibtisch/Dokumente/Downloads)

macOS kann den Zugriff von Terminal- und Hintergrundprozessen auf die Ordner „Schreibtisch“, „Dokumente“ und „Downloads“ ebenfalls beschränken. Wenn das Lesen von Dateien oder das Auflisten von Verzeichnissen nicht abgeschlossen wird, erteilen Sie dem Prozesskontext Zugriff, der die Dateioperationen ausführt (zum Beispiel Terminal/iTerm, einer über LaunchAgent gestarteten App oder einem SSH-Prozess).

Problemumgehung: Verschieben Sie die Dateien in den OpenClaw-Arbeitsbereich (`~/.openclaw/workspace`), wenn Sie keine Berechtigungen für einzelne Ordner erteilen möchten.

Wenn Sie Berechtigungen testen, signieren Sie immer mit einem echten Zertifikat. Ad-hoc-Builds sind nur für schnelle lokale Ausführungen akzeptabel, bei denen Berechtigungen keine Rolle spielen.

## Verwandte Themen

- [macOS-App](/de/platforms/macos)
- [macOS-Signierung](/de/platforms/mac/signing)
