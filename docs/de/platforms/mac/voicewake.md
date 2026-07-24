---
read_when:
    - Arbeiten an Aktivierungswort- oder PTT-Pfaden
summary: Sprachaktivierungs- und Push-to-Talk-Modi sowie Routingdetails in der Mac-App
title: Sprachaktivierung (macOS)
x-i18n:
    generated_at: "2026-07-24T04:30:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d3b2a01ee997b4158bf88b9ef54b1e523503722620f943d594323516619e7502
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Sprachaktivierung und Push-to-Talk

## Anforderungen

Sprachaktivierung und Push-to-Talk erfordern macOS 26 oder neuer. Unter älteren macOS-Versionen sind die Bedienelemente auf der Seite mit den Spracheinstellungen ausgeblendet; stattdessen wird dort auf die Anforderung von macOS 26 hingewiesen.

Für die Sprachaktivierung muss Apple Speech die geräteinterne Erkennung für die ausgewählte Sprache unterstützen. Die App verweigert den Start der passiven Aktivierungsworterkennung, wenn dieser ausschließlich lokale Vertrag nicht verfügbar ist; sie greift niemals auf die Netzwerkerkennung zurück. Push-to-Talk, Sprechmodus und das Diktieren im Schnellchat sind ausdrückliche Benutzeraktionen und dürfen für eine breitere Sprachabdeckung die Netzwerkdienste von Apple Speech verwenden.

## Modi

- **Aktivierungswortmodus** (Standard): Eine ständig aktive, geräteinterne Spracherkennung wartet auf Auslöser-Token (`swabbleTriggerWords`). Bei einer Übereinstimmung startet sie die Aufnahme, zeigt das Overlay mit dem vorläufigen Text an und sendet nach einer Sprechpause automatisch.
- **Push-to-Talk (rechte Wahltaste gedrückt halten)**: Halten Sie die rechte Wahltaste gedrückt, um die Aufnahme sofort zu starten; ein Auslöser ist nicht erforderlich. Das Overlay wird angezeigt, solange die Taste gedrückt ist. Beim Loslassen wird die Aufnahme abgeschlossen und nach einer kurzen Verzögerung weitergeleitet, damit Sie den Text bearbeiten können.

## Laufzeitverhalten (Aktivierungswort)

- Die Spracherkennung befindet sich in `VoiceWakeRuntime`.
- Der Auslöser wird nur aktiviert, wenn zwischen dem Aktivierungswort und dem nächsten Wort eine deutliche Pause liegt (`triggerPauseWindow` = 0.55s). Overlay und Signalton können bereits während der Pause starten, noch bevor der Befehl beginnt.
- Stille-Zeitfenster: 2.0s (`silenceWindow`) bei fortlaufender Sprache, 5.0s (`triggerOnlySilenceWindow`), wenn nur der Auslöser erkannt wurde.
- Fester Abbruch: 120s (`captureHardStop`), um außer Kontrolle geratene Sitzungen zu verhindern.
- Entprellzeit zwischen Sitzungen: 350ms (`debounceAfterSend`) nach dem Senden.
- Das Overlay wird über `VoiceWakeOverlayController` gesteuert und stellt bestätigten und vorläufigen Text unterschiedlich farbig dar.
- Nach dem Senden wird die Spracherkennung sauber neu gestartet, um auf den nächsten Auslöser zu warten.

## Lebenszyklusinvarianten

- Wenn die Sprachaktivierung aktiviert ist und die Berechtigungen erteilt wurden, bleibt die Aktivierungsworterkennung aktiv, außer während einer laufenden Push-to-Talk-Aufnahme.
- Beim Schließen des Overlays wird die Spracherkennung immer fortgesetzt, auch beim manuellen Schließen über die X-Schaltfläche: `VoiceSessionCoordinator.overlayDidDismiss` ruft bei jedem Schließpfad `VoiceWakeRuntime.refresh(state:)` auf. Informationen zum Sitzungs-/Token-Modell finden Sie unter [Sprach-Overlay](/de/platforms/mac/voice-overlay).

## Einzelheiten zu Push-to-Talk

- Die Tastenkombinationserkennung verwendet einen globalen `.flagsChanged`-Monitor für die rechte Wahltaste (`keyCode 61` + `.option`). Er beobachtet Ereignisse nur und unterdrückt sie niemals.
- Die Aufnahme befindet sich in `VoicePushToTalk`: Sie startet Speech sofort, überträgt vorläufige Ergebnisse fortlaufend an das Overlay und ruft beim Loslassen `VoiceWakeForwarder` auf.
- Beim Start von Push-to-Talk wird die Aktivierungswort-Laufzeit pausiert, um konkurrierende Audiozugriffe zu vermeiden; nach dem Loslassen wird sie automatisch neu gestartet.
- Berechtigungen: Mikrofon und Spracherkennung sind erforderlich; für den Empfang von Tastenereignissen ist die Genehmigung für Bedienungshilfen/Eingabeüberwachung erforderlich.
- Externe Tastaturen: Einige stellen die rechte Wahltaste nicht wie erwartet bereit. Bieten Sie eine alternative Tastenkombination an, wenn Benutzer von nicht erkannten Betätigungen berichten.

## Benutzersichtbare Einstellungen

- Schalter **Sprachaktivierung**: Aktiviert die Aktivierungswort-Laufzeit.
- **Rechte Wahltaste zum Sprechen gedrückt halten**: Aktiviert den Push-to-Talk-Monitor.
- Wenn die ausgewählte Sprache auf diesem Mac keine geräteinterne Erkennung unterstützt, bleibt die Sprachaktivierung deaktiviert, während Push-to-Talk und der Sprechmodus weiterhin verfügbar sind.
- Auswahlfelder für Sprache und Mikrofon, eine Live-Pegelanzeige, eine Tabelle mit Auslösewörtern und ein Tester (ausschließlich lokal, leitet niemals etwas weiter).
- Das Auswahlfeld für das Mikrofon behält die letzte Auswahl bei, wenn ein Gerät getrennt wird, zeigt einen Hinweis zur unterbrochenen Verbindung an und greift bis zur erneuten Verbindung vorübergehend auf die Systemvorgabe zurück.
- **Töne**: Signaltöne bei Erkennung des Auslösers und beim Senden; standardmäßig wird der macOS-Systemton „Glass“ verwendet. Wählen Sie pro Ereignis eine beliebige, von `NSSound` ladbare Datei (z. B. MP3/WAV/AIFF), oder wählen Sie **Kein Ton**.

## Weiterleitungsverhalten

- Bei der Weiterleitung wählt `VoiceWakeForwarder.selectedSessionOptions` den Schlüssel der aktiven WebChat-Sitzung aus, sofern einer festgelegt ist, andernfalls den Schlüssel der Hauptsitzung des Gateways.
- Die Sitzung wird über `sessions.list` gesucht. Zustellungskanal und Ziel werden aus dem Zustellungskontext der Sitzung abgeleitet (ersatzweise aus deren letztem Kanal/Ziel und anschließend aus einem analysierten Sitzungsschlüssel); wenn nichts aufgelöst werden kann, wird standardmäßig WebChat verwendet.
- Wenn die Zustellung fehlschlägt, wird der Fehler protokolliert (Kategorie `voicewake.forward`), und der Lauf bleibt weiterhin über die WebChat-/Sitzungsprotokolle sichtbar.

## Weiterleitungsnutzlast

- `VoiceWakeForwarder.prefixedTranscript(_:)` stellt dem Transkript eine Zeile mit einem Gerätehinweis voran (aufgelöster Hostname, ersatzweise „dieser Mac“), die sowohl für den Aktivierungswort- als auch den Push-to-Talk-Pfad verwendet wird.

## Schnelle Überprüfung

- Aktivieren Sie Push-to-Talk, halten Sie die rechte Wahltaste gedrückt, sprechen Sie und lassen Sie sie los: Das Overlay sollte zunächst vorläufige Ergebnisse anzeigen und sie anschließend senden.
- Während Sie die Taste gedrückt halten, sollten die Ohren in der Menüleiste vergrößert bleiben (`triggerVoiceEars(ttl: nil)`); nach dem Loslassen werden sie wieder kleiner.

## Verwandte Themen

- [Sprachaktivierung](/de/nodes/voicewake)
- [Sprach-Overlay](/de/platforms/mac/voice-overlay)
- [macOS-App](/de/platforms/macos)
