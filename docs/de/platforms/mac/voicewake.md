---
read_when:
    - Arbeiten an Sprachaktivierung oder PTT-Pfaden
summary: Sprachaktivierungs- und Push-to-Talk-Modi sowie Routingdetails in der Mac-App
title: Sprachaktivierung (macOS)
x-i18n:
    generated_at: "2026-06-27T17:43:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 33c6132d03efb837ae06f4810ff87eb981ad742d793657bc607f4ec214bc2afa
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Sprachaktivierung & Push-to-Talk

## Anforderungen

Sprachaktivierung und Push-to-Talk erfordern macOS 26 oder neuer. Auf älteren macOS-Versionen
sind die Steuerelemente auf der Seite für Spracheinstellungen ausgeblendet, die die Anforderung
macOS 26 anzeigt.

## Modi

- **Wake-Word-Modus** (Standard): Die dauerhaft aktive Spracherkennung wartet auf Auslösewörter (`swabbleTriggerWords`). Bei einer Übereinstimmung startet sie die Aufnahme, zeigt das Overlay mit Teiltext an und sendet nach Stille automatisch.
- **Push-to-Talk (rechte Wahltaste halten)**: Halten Sie die rechte Wahltaste, um sofort aufzunehmen – kein Auslöser erforderlich. Das Overlay erscheint, während Sie die Taste halten; beim Loslassen wird finalisiert und nach kurzer Verzögerung weitergeleitet, damit Sie den Text noch anpassen können.

## Laufzeitverhalten (Wake-Word)

- Die Spracherkennung befindet sich in `VoiceWakeRuntime`.
- Der Auslöser wird nur aktiviert, wenn es zwischen dem Wake-Word und dem nächsten Wort eine **deutliche Pause** gibt (ca. 0,55 s Abstand). Overlay/Klangsignal können bereits bei der Pause starten, noch bevor der Befehl beginnt.
- Stillefenster: 2,0 s bei laufender Sprache, 5,0 s, wenn nur der Auslöser gehört wurde.
- Harte Begrenzung: 120 s, um ausufernde Sitzungen zu verhindern.
- Entprellung zwischen Sitzungen: 350 ms.
- Das Overlay wird über `VoiceWakeOverlayController` mit festgeschriebener/flüchtiger Einfärbung gesteuert.
- Nach dem Senden startet die Erkennung sauber neu, um auf den nächsten Auslöser zu warten.

## Lebenszyklus-Invarianten

- Wenn Sprachaktivierung aktiviert ist und Berechtigungen erteilt sind, sollte die Wake-Word-Erkennung zuhören (außer während einer expliziten Push-to-Talk-Aufnahme).
- Die Sichtbarkeit des Overlays (einschließlich manuellem Schließen über die X-Schaltfläche) darf niemals verhindern, dass die Erkennung fortgesetzt wird.

## Fehlermodus mit festhängendem Overlay (früher)

Früher konnte Voice Wake „tot“ wirken, wenn das Overlay sichtbar hängen blieb und Sie es manuell schlossen, weil der Neustartversuch der Laufzeit durch die Overlay-Sichtbarkeit blockiert werden konnte und kein weiterer Neustart geplant wurde.

Absicherung:

- Der Neustart der Wake-Laufzeit wird nicht mehr durch die Overlay-Sichtbarkeit blockiert.
- Der Abschluss des Overlay-Schließens löst über `VoiceSessionCoordinator` ein `VoiceWakeRuntime.refresh(...)` aus, sodass manuelles Schließen per X immer wieder mit dem Zuhören fortfährt.

## Push-to-Talk-Details

- Die Hotkey-Erkennung verwendet einen globalen `.flagsChanged`-Monitor für **rechte Wahltaste** (`keyCode 61` + `.option`). Wir beobachten Ereignisse nur (kein Unterdrücken).
- Die Aufnahmepipeline befindet sich in `VoicePushToTalk`: Sie startet Speech sofort, streamt Teilergebnisse an das Overlay und ruft beim Loslassen `VoiceWakeForwarder` auf.
- Wenn Push-to-Talk startet, pausieren wir die Wake-Word-Laufzeit, um konkurrierende Audio-Taps zu vermeiden; sie startet nach dem Loslassen automatisch neu.
- Berechtigungen: erfordert Mikrofon + Speech; zum Erkennen von Ereignissen ist die Zustimmung für Bedienungshilfen/Eingabeüberwachung erforderlich.
- Externe Tastaturen: Einige stellen die rechte Wahltaste möglicherweise nicht wie erwartet bereit – bieten Sie eine Ausweich-Tastenkombination an, wenn Benutzer Aussetzer melden.

## Benutzerseitige Einstellungen

- Umschalter **Sprachaktivierung**: aktiviert die Wake-Word-Laufzeit.
- **Rechte Wahltaste zum Sprechen halten**: aktiviert den Push-to-Talk-Monitor.
- Sprach- und Mikrofonauswahl, Live-Pegelmesser, Tabelle der Auslösewörter, Tester (nur lokal; leitet nicht weiter).
- Die Mikrofonauswahl behält die letzte Auswahl bei, wenn ein Gerät getrennt wird, zeigt einen Hinweis zur Trennung an und fällt vorübergehend auf den Systemstandard zurück, bis es wieder verfügbar ist.
- **Sounds**: Klangsignale bei Erkennung des Auslösers und beim Senden; Standard ist der macOS-Systemsound „Glass“. Sie können für jedes Ereignis eine beliebige von `NSSound` ladbare Datei (z. B. MP3/WAV/AIFF) auswählen oder **Kein Ton** wählen.

## Weiterleitungsverhalten

- Wenn Voice Wake aktiviert ist, werden Transkripte an den aktiven Gateway/Agent weitergeleitet (derselbe lokale bzw. Remote-Modus, den der Rest der Mac-App verwendet).
- Antworten werden an den **zuletzt verwendeten Haupt-Provider** (WhatsApp/Telegram/Discord/WebChat) zugestellt. Wenn die Zustellung fehlschlägt, wird der Fehler protokolliert und der Lauf bleibt weiterhin über WebChat-/Sitzungsprotokolle sichtbar.

## Weiterleitungspayload

- `VoiceWakeForwarder.prefixedTranscript(_:)` stellt vor dem Senden den Maschinenhinweis voran. Gemeinsam genutzt von Wake-Word- und Push-to-Talk-Pfaden.

## Schnelle Verifizierung

- Push-to-Talk einschalten, rechte Wahltaste halten, sprechen, loslassen: Das Overlay sollte Teilergebnisse anzeigen und anschließend senden.
- Während des Haltens sollten die Ohren in der Menüleiste vergrößert bleiben (verwendet `triggerVoiceEars(ttl:nil)`); nach dem Loslassen verschwinden sie.

## Verwandt

- [Sprachaktivierung](/de/nodes/voicewake)
- [Sprach-Overlay](/de/platforms/mac/voice-overlay)
- [macOS-App](/de/platforms/macos)
