---
read_when:
    - Fehlende oder hängende macOS-Berechtigungsaufforderungen debuggen
    - Entscheiden, ob Sie Node oder einer CLI-Laufzeitumgebung Bedienungshilfen gewähren
    - macOS-App paketieren oder signieren
    - Bundle-IDs oder App-Installationspfade ändern
summary: macOS-Berechtigungspersistenz (TCC) und Signierungsanforderungen
title: macOS-Berechtigungen
x-i18n:
    generated_at: "2026-06-27T17:43:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b7e21c53bff16c3023e2b6509894717c3d0ef96524951b0d0c5975d2fc91019
    source_path: platforms/mac/permissions.md
    workflow: 16
---

macOS-Berechtigungen sind fragil. TCC verknüpft eine Berechtigung mit der
Codesignatur, der Bundle-ID und dem Speicherpfad der App. Wenn sich eine dieser Angaben ändert,
behandelt macOS die App als neu und kann Eingabeaufforderungen verwerfen oder ausblenden.

## Anforderungen für stabile Berechtigungen

- Gleicher Pfad: Führen Sie die App von einem festen Speicherort aus (für OpenClaw `dist/OpenClaw.app`).
- Gleiche Bundle-ID: Das Ändern der Bundle-ID erzeugt eine neue Berechtigungsidentität.
- Signierte App: Unsigned- oder Ad-hoc-signierte Builds behalten Berechtigungen nicht dauerhaft bei.
- Konsistente Signatur: Verwenden Sie ein echtes Apple-Development- oder Developer-ID-Zertifikat,
  damit die Signatur über Rebuilds hinweg stabil bleibt.

Ad-hoc-Signaturen erzeugen bei jedem Build eine neue Identität. macOS vergisst frühere
Berechtigungen, und Eingabeaufforderungen können vollständig verschwinden, bis veraltete Einträge gelöscht werden.

## Bedienungshilfen-Berechtigungen für Node- und CLI-Laufzeiten

Gewähren Sie Bedienungshilfen-Zugriff vorzugsweise OpenClaw.app, Peekaboo.app oder einem anderen signierten
Helper mit eigener Bundle-ID statt einem generischen `node`-Binary.

macOS TCC gewährt Bedienungshilfen-Zugriff für die Code-Identität des Prozesses, den es sieht. Wenn ein
Homebrew-, nvm-, pnpm- oder npm-Workflow dazu führt, dass ein gemeinsam genutztes `node`-Executable
Bedienungshilfen-Zugriff erhält, kann jedes JavaScript-Paket, das über dasselbe
Executable gestartet wird, GUI-Automatisierungsrechte erben.

Behandeln Sie einen `node`-Eintrag in den Systemeinstellungen als weitreichende Berechtigung für diese Node-
Laufzeit, nicht als Berechtigung für ein einzelnes npm-Paket. Vermeiden Sie es, `node` Bedienungshilfen-Zugriff zu gewähren,
es sei denn, Sie vertrauen jedem Skript und Paket, das über genau diese
Node-Installation gestartet wird.

Wenn Sie `node` versehentlich Bedienungshilfen-Zugriff gewährt haben, entfernen Sie diesen Eintrag aus
Systemeinstellungen -> Datenschutz & Sicherheit -> Bedienungshilfen. Gewähren Sie die Berechtigung anschließend der signierten
App oder dem Helper, der die UI-Automatisierung besitzen soll.

## Wiederherstellungs-Checkliste, wenn Eingabeaufforderungen verschwinden

1. Beenden Sie die App.
2. Entfernen Sie den App-Eintrag in Systemeinstellungen -> Datenschutz & Sicherheit.
3. Starten Sie die App erneut vom selben Pfad und gewähren Sie die Berechtigungen erneut.
4. Wenn die Eingabeaufforderung weiterhin nicht erscheint, setzen Sie TCC-Einträge mit `tccutil` zurück und versuchen Sie es erneut.
5. Einige Berechtigungen erscheinen erst nach einem vollständigen macOS-Neustart wieder.

Beispiel-Resets (Bundle-ID nach Bedarf ersetzen):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Berechtigungen für Dateien und Ordner (Schreibtisch/Dokumente/Downloads)

macOS kann auch Schreibtisch, Dokumente und Downloads für Terminal-/Hintergrundprozesse sperren. Wenn Dateilesevorgänge oder Verzeichnisauflistungen hängen bleiben, gewähren Sie Zugriff für denselben Prozesskontext, der Dateioperationen ausführt (zum Beispiel Terminal/iTerm, eine über LaunchAgent gestartete App oder ein SSH-Prozess).

Workaround: Verschieben Sie Dateien in den OpenClaw-Arbeitsbereich (`~/.openclaw/workspace`), wenn Sie ordnerspezifische Berechtigungen vermeiden möchten.

Wenn Sie Berechtigungen testen, signieren Sie immer mit einem echten Zertifikat. Ad-hoc-
Builds sind nur für schnelle lokale Läufe akzeptabel, bei denen Berechtigungen keine Rolle spielen.

## Verwandt

- [macOS-App](/de/platforms/macos)
- [macOS-Signierung](/de/platforms/mac/signing)
