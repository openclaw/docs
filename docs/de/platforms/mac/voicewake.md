---
read_when:
    - Arbeiten an Sprachaktivierungs- oder PTT-Pfaden
summary: Sprachaktivierungs- und Push-to-Talk-Modi sowie Routing-Details in der Mac-App
title: Sprachaktivierung (macOS)
x-i18n:
    generated_at: "2026-05-06T06:56:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 312895b5767c447233bd77cbcd48ea81bb6c700080abc31974188b610a1b1ef0
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Voice Wake & Push-to-Talk

## Modi

- **Wake-Word-Modus** (Standard): Die ständig aktive Spracherkennung wartet auf Trigger-Token (`swabbleTriggerWords`). Bei einer Übereinstimmung startet sie die Aufnahme, zeigt das Overlay mit Teiltext an und sendet nach Stille automatisch.
- **Push-to-Talk (rechte Option-Taste halten)**: Halten Sie die rechte Option-Taste gedrückt, um sofort aufzunehmen – kein Trigger erforderlich. Das Overlay erscheint, solange die Taste gehalten wird; beim Loslassen wird finalisiert und nach einer kurzen Verzögerung weitergeleitet, damit Sie den Text anpassen können.

## Laufzeitverhalten (Wake-Word)

- Die Spracherkennung befindet sich in `VoiceWakeRuntime`.
- Der Trigger wird nur ausgelöst, wenn zwischen dem Wake Word und dem nächsten Wort eine **deutliche Pause** liegt (ca. 0,55 s Abstand). Overlay/Gong können bereits während der Pause starten, noch bevor der Befehl beginnt.
- Stillefenster: 2,0 s, wenn Sprache fließt, 5,0 s, wenn nur der Trigger gehört wurde.
- Harte Begrenzung: 120 s, um endlos laufende Sitzungen zu verhindern.
- Entprellung zwischen Sitzungen: 350 ms.
- Das Overlay wird über `VoiceWakeOverlayController` mit Committed/Volatile-Farbgebung gesteuert.
- Nach dem Senden startet die Erkennung sauber neu, um auf den nächsten Trigger zu warten.

## Lebenszyklus-Invarianten

- Wenn Voice Wake aktiviert ist und Berechtigungen erteilt wurden, sollte die Wake-Word-Erkennung zuhören (außer während einer expliziten Push-to-Talk-Aufnahme).
- Die Overlay-Sichtbarkeit (einschließlich manuellem Schließen über die X-Schaltfläche) darf nie verhindern, dass die Erkennung fortgesetzt wird.

## Fehlerfall mit hängen gebliebenem Overlay (früher)

Früher konnte Voice Wake „tot“ wirken, wenn das Overlay sichtbar hängen blieb und Sie es manuell geschlossen haben, weil der Neustartversuch der Laufzeit durch die Overlay-Sichtbarkeit blockiert werden konnte und kein anschließender Neustart geplant wurde.

Härtung:

- Der Neustart der Wake-Laufzeit wird nicht mehr durch die Overlay-Sichtbarkeit blockiert.
- Der Abschluss des Overlay-Schließens löst über `VoiceSessionCoordinator` ein `VoiceWakeRuntime.refresh(...)` aus, sodass ein manuelles Schließen per X das Zuhören immer fortsetzt.

## Push-to-Talk-Details

- Die Hotkey-Erkennung verwendet einen globalen `.flagsChanged`-Monitor für die **rechte Option-Taste** (`keyCode 61` + `.option`). Wir beobachten Ereignisse nur (kein Abfangen).
- Die Aufnahme-Pipeline befindet sich in `VoicePushToTalk`: Sie startet Speech sofort, streamt Teilergebnisse an das Overlay und ruft beim Loslassen `VoiceWakeForwarder` auf.
- Wenn Push-to-Talk startet, pausieren wir die Wake-Word-Laufzeit, um konkurrierende Audio-Taps zu vermeiden; sie startet nach dem Loslassen automatisch neu.
- Berechtigungen: erfordert Mikrofon + Speech; das Empfangen von Ereignissen benötigt Zustimmung für Bedienungshilfen/Eingabeüberwachung.
- Externe Tastaturen: Manche stellen die rechte Option-Taste möglicherweise nicht wie erwartet bereit – bieten Sie eine Ersatz-Tastenkombination an, wenn Benutzer verpasste Erkennungen melden.

## Benutzerseitige Einstellungen

- Schalter **Voice Wake**: aktiviert die Wake-Word-Laufzeit.
- **Cmd+Fn zum Sprechen halten**: aktiviert den Push-to-Talk-Monitor. Unter macOS < 26 deaktiviert.
- Sprach- und Mikrofonauswahl, Live-Pegelanzeige, Trigger-Wort-Tabelle, Tester (nur lokal; leitet nicht weiter).
- Die Mikrofonauswahl behält die letzte Auswahl bei, wenn ein Gerät getrennt wird, zeigt einen Hinweis zur Trennung an und fällt vorübergehend auf den Systemstandard zurück, bis es wieder verfügbar ist.
- **Töne**: Gongs bei Trigger-Erkennung und beim Senden; standardmäßig der macOS-Systemton „Glass“. Sie können für jedes Ereignis eine beliebige von `NSSound` ladbare Datei auswählen (z. B. MP3/WAV/AIFF) oder **Kein Ton** wählen.

## Weiterleitungsverhalten

- Wenn Voice Wake aktiviert ist, werden Transkripte an den aktiven Gateway/Agent weitergeleitet (derselbe lokale bzw. Remote-Modus, der vom Rest der Mac-App verwendet wird).
- Antworten werden an den **zuletzt verwendeten Haupt-Provider** zugestellt (WhatsApp/Telegram/Discord/WebChat). Wenn die Zustellung fehlschlägt, wird der Fehler protokolliert und der Lauf bleibt weiterhin über WebChat/Sitzungsprotokolle sichtbar.

## Weiterleitungs-Payload

- `VoiceWakeForwarder.prefixedTranscript(_:)` stellt vor dem Senden den Maschinenhinweis voran. Dies wird gemeinsam von Wake-Word- und Push-to-Talk-Pfaden verwendet.

## Schnelle Verifizierung

- Aktivieren Sie Push-to-Talk, halten Sie Cmd+Fn, sprechen Sie, lassen Sie los: Das Overlay sollte Teilergebnisse anzeigen und anschließend senden.
- Während des Haltens sollten die Ohren in der Menüleiste vergrößert bleiben (verwendet `triggerVoiceEars(ttl:nil)`); nach dem Loslassen werden sie wieder kleiner.

## Verwandt

- [Voice Wake](/de/nodes/voicewake)
- [Voice-Overlay](/de/platforms/mac/voice-overlay)
- [macOS-App](/de/platforms/macos)
