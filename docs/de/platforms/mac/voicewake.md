---
read_when:
    - Arbeiten an Aktivierungswort- oder PTT-Pfaden
summary: Sprachaktivierungs- und Push-to-Talk-Modi sowie Routingdetails in der Mac-App
title: Sprachaktivierung (macOS)
x-i18n:
    generated_at: "2026-07-12T15:39:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2a0a5ac44931b578daa4f74b3728a65a1c19ab9742e2d4b9f4c6db49fa5d7b8a
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Sprachaktivierung und Push-to-Talk

## Anforderungen

Sprachaktivierung und Push-to-Talk erfordern macOS 26 oder neuer. Unter älteren macOS-Versionen sind die Steuerelemente auf der Seite mit den Spracheinstellungen ausgeblendet; stattdessen wird dort auf die Anforderung macOS 26 hingewiesen.

## Modi

- **Aktivierungswortmodus** (Standard): Eine ständig aktive Spracherkennung wartet auf Aktivierungswörter (`swabbleTriggerWords`). Bei einer Übereinstimmung beginnt sie mit der Aufnahme, zeigt das Overlay mit vorläufigem Text an und sendet nach einer Sprechpause automatisch.
- **Push-to-Talk (rechte Wahltaste gedrückt halten)**: Halten Sie die rechte Wahltaste gedrückt, um sofort mit der Aufnahme zu beginnen; ein Aktivierungswort ist nicht erforderlich. Das Overlay wird angezeigt, solange die Taste gedrückt bleibt. Beim Loslassen wird die Aufnahme abgeschlossen und nach einer kurzen Verzögerung weitergeleitet, damit Sie den Text bearbeiten können.

## Laufzeitverhalten (Aktivierungswort)

- Die Spracherkennung befindet sich in `VoiceWakeRuntime`.
- Die Aktivierung erfolgt nur, wenn zwischen dem Aktivierungswort und dem nächsten Wort eine deutliche Pause liegt (`triggerPauseWindow` = 0.55s). Overlay und Signalton können bereits während der Pause starten, noch bevor der Befehl beginnt.
- Zeitfenster für Sprechpausen: 2.0s (`silenceWindow`) bei laufender Spracheingabe, 5.0s (`triggerOnlySilenceWindow`), wenn nur das Aktivierungswort erkannt wurde.
- Erzwungener Abbruch: 120s (`captureHardStop`), um unkontrolliert fortlaufende Sitzungen zu verhindern.
- Entprellzeit zwischen Sitzungen: 350ms (`debounceAfterSend`) nach dem Senden.
- Das Overlay wird über `VoiceWakeOverlayController` gesteuert, wobei bestätigter und vorläufiger Text unterschiedlich eingefärbt werden.
- Nach dem Senden wird die Spracherkennung ordnungsgemäß neu gestartet, um auf das nächste Aktivierungswort zu warten.

## Lebenszyklusinvarianten

- Wenn die Sprachaktivierung aktiviert ist und die Berechtigungen erteilt wurden, bleibt die Aktivierungsworterkennung aktiv, außer während einer laufenden Push-to-Talk-Aufnahme.
- Das Schließen des Overlays, einschließlich des manuellen Schließens über die X-Schaltfläche, setzt die Spracherkennung immer fort: `VoiceSessionCoordinator.overlayDidDismiss` ruft in jedem Schließpfad `VoiceWakeRuntime.refresh(state:)` auf. Informationen zum Sitzungs-/Tokenmodell finden Sie unter [Sprach-Overlay](/de/platforms/mac/voice-overlay).

## Besonderheiten von Push-to-Talk

- Die Erkennung der Tastenkombination verwendet einen globalen `.flagsChanged`-Monitor für die rechte Wahltaste (`keyCode 61` + `.option`). Er beobachtet Ereignisse nur und fängt sie niemals ab.
- Die Aufnahme erfolgt in `VoicePushToTalk`: Die Spracherkennung wird sofort gestartet, vorläufige Ergebnisse werden an das Overlay übertragen und beim Loslassen wird `VoiceWakeForwarder` aufgerufen.
- Beim Start von Push-to-Talk wird die Aktivierungswort-Laufzeit angehalten, um konkurrierende Audioabgriffe zu vermeiden; nach dem Loslassen wird sie automatisch neu gestartet.
- Berechtigungen: Mikrofon und Spracherkennung sind erforderlich; für den Empfang von Tastenereignissen ist die Genehmigung für Bedienungshilfen/Eingabeüberwachung erforderlich.
- Externe Tastaturen: Einige stellen die rechte Wahltaste nicht wie erwartet bereit. Bieten Sie eine alternative Tastenkombination an, wenn Benutzer nicht erkannte Eingaben melden.

## Benutzereinstellungen

- Umschalter **Sprachaktivierung**: Aktiviert die Aktivierungswort-Laufzeit.
- **Rechte Wahltaste zum Sprechen gedrückt halten**: Aktiviert den Push-to-Talk-Monitor.
- Auswahlfelder für Sprache und Mikrofon, eine Live-Pegelanzeige, eine Tabelle mit Aktivierungswörtern und eine Testfunktion (nur lokal, leitet niemals etwas weiter).
- Die Mikrofonauswahl behält die letzte Auswahl bei, wenn ein Gerät getrennt wird, zeigt einen Hinweis zur unterbrochenen Verbindung an und weicht vorübergehend auf die Systemvorgabe aus, bis das Gerät wieder verfügbar ist.
- **Töne**: Signaltöne bei der Erkennung des Aktivierungsworts und beim Senden; standardmäßig wird der macOS-Systemton „Glass“ verwendet. Wählen Sie für jedes Ereignis eine beliebige von `NSSound` ladbare Datei (z. B. MP3/WAV/AIFF) oder wählen Sie **Kein Ton**.

## Weiterleitungsverhalten

- Bei der Weiterleitung wählt `VoiceWakeForwarder.selectedSessionOptions` den aktiven WebChat-Sitzungsschlüssel aus, falls einer festgelegt ist, andernfalls den Hauptsitzungsschlüssel des Gateways.
- Die Sitzung wird über `sessions.list` gesucht. Der Übermittlungskanal und das Ziel werden aus dem Übermittlungskontext der Sitzung abgeleitet; ersatzweise werden der letzte Kanal und das letzte Ziel und anschließend ein analysierter Sitzungsschlüssel verwendet. Wenn nichts aufgelöst werden kann, wird standardmäßig WebChat verwendet.
- Wenn die Übermittlung fehlschlägt, wird der Fehler protokolliert (Kategorie `voicewake.forward`), und der Lauf bleibt weiterhin über WebChat/Sitzungsprotokolle sichtbar.

## Weiterleitungsnutzlast

- `VoiceWakeForwarder.prefixedTranscript(_:)` stellt dem Transkript eine Zeile mit einem Maschinenhinweis voran (aufgelöster Hostname, ersatzweise „dieser Mac“), die sowohl für den Aktivierungswort- als auch für den Push-to-Talk-Pfad verwendet wird.

## Schnellprüfung

- Aktivieren Sie Push-to-Talk, halten Sie die rechte Wahltaste gedrückt, sprechen Sie und lassen Sie die Taste los: Das Overlay sollte zunächst vorläufige Ergebnisse anzeigen und diese anschließend senden.
- Während Sie die Taste gedrückt halten, sollten die Ohren in der Menüleiste vergrößert bleiben (`triggerVoiceEars(ttl: nil)`); nach dem Loslassen werden sie wieder kleiner.

## Verwandte Themen

- [Sprachaktivierung](/de/nodes/voicewake)
- [Sprach-Overlay](/de/platforms/mac/voice-overlay)
- [macOS-App](/de/platforms/macos)
