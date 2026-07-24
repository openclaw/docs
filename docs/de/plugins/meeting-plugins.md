---
read_when:
    - Sie möchten, dass ein OpenClaw-Agent an einer Videokonferenz teilnimmt
    - Sie wählen zwischen den Plugins für Google Meet-, Microsoft Teams- und Zoom-Besprechungen.
    - Sie benötigen die Einrichtung für gemeinsam genutztes Chrome, BlackHole, SoX oder den Besprechungsmodus
summary: Teilnahme an Google Meet-, Microsoft Teams- oder Zoom-Besprechungen auswählen und konfigurieren
title: Meeting-Plugins
x-i18n:
    generated_at: "2026-07-24T03:56:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f41488de018402e3d5cfd01fa5351cdb6107412477d5d54e2d9e186e0fc8ee94
    source_path: plugins/meeting-plugins.md
    workflow: 16
---

OpenClaw verfügt über separate Plugins für Google Meet, Microsoft Teams-Besprechungen und Zoom. Alle drei können über Chrome beitreten, verwenden dieselben Teilnahmemodi und können Chrome entweder auf dem Gateway-Host oder auf einer gekoppelten Node ausführen. Ihre Plattform-URLs, Installationsmodelle und zusätzlichen Funktionen unterscheiden sich.

Diese Plugins nehmen an Besprechungen teil. Sie sind von Messaging-Kanälen wie dem [Microsoft Teams-Kanal](/de/channels/msteams) und vom [Sprachanruf-Plugin](/de/plugins/voice-call) getrennt.

## Plugin auswählen

| Plattform       | Plugin                                      | Akzeptierte Besprechungslinks                                                                                 | Installation                                        | Teilnahmewege                                            | Plattformspezifische Funktionen                                                                                           |
| --------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Google Meet     | [`google-meet`](/de/plugins/google-meet)       | `meet.google.com/...`                                                                                       | Über npm oder ClawHub installieren; standardmäßig aktiviert | Lokales Chrome, Chrome auf einer gekoppelten Node oder Twilio-Einwahl | Kann Besprechungen über die Meet-API oder einen angemeldeten Browser erstellen; kann unterstützte Meet-Artefakte mit OAuth lesen |
| Microsoft Teams | [`teams-meetings`](/plugins/teams-meetings) | Geschäftslinks unter `teams.microsoft.com/l/meetup-join/...` und Verbraucherlinks unter `teams.live.com/meet/...` | Enthalten; standardmäßig aktiviert                  | Lokales Chrome oder Chrome auf einer gekoppelten Node     | Gastbeitritt zu Geschäfts- und Verbraucherbesprechungen                                                                   |
| Zoom            | [`zoom-meetings`](/plugins/zoom-meetings)   | `zoom.us/j/...` und Konto-Subdomains wie `example.zoom.us/j/...`                                      | Enthalten; standardmäßig aktiviert                  | Lokales Chrome oder Chrome auf einer gekoppelten Node     | Gastbeitritt über die Zoom Web App                                                                                        |

Wählen Sie Google Meet, wenn Sie Besprechungen erstellen, Google-API-Artefakte verwenden oder einen Twilio-Telefonweg benötigen. Wählen Sie Teams oder Zoom für die direkte Gastteilnahme über den Browser auf diesen Plattformen. Die Teams- und Zoom-Plugins erstellen keine Besprechungen, wählen sich nicht ein, rufen keine Anbieter-API auf und erstellen keine Audio-/Videoaufzeichnungen.

## Modus auswählen

Die drei Plugins verwenden dieselben Modi:

| Modus        | Verhalten                                                                                                     | Audioanforderungen                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `agent`      | Die Echtzeittranskription wird an den konfigurierten OpenClaw-Agenten gesendet; die reguläre OpenClaw-TTS spricht die Antwort. | Die Sprachausgabe über Chrome erfordert die BlackHole- und SoX-Brücke. |
| `bidi`       | Ein Echtzeit-Sprachmodell hört zu und antwortet direkt.                                                       | Die Sprachausgabe über Chrome erfordert die BlackHole- und SoX-Brücke. |
| `transcribe` | Nimmt nur beobachtend teil und stellt ein begrenztes Live-Untertiteltranskript bereit, wenn die Plattform Untertitel liefert. | Keine BlackHole- oder SoX-Brücke für die Sprachausgabe.    |

Verwenden Sie `transcribe`, wenn der Agent nur den Besprechungstext benötigt. Verwenden Sie `agent` für die normale OpenClaw-Logik und Tools. Verwenden Sie `bidi`, wenn eine direkte Sprachkommunikation mit niedriger Latenz wichtiger ist, als jede Gesprächsrunde über den regulären Agenten zu leiten.

Das begrenzte Live-Transkript bleibt nur im Modus `transcribe` verfügbar. In allen
drei Modi speichern Browserbeitritte außerdem abgeschlossene Untertitelzeilen und eine daraus abgeleitete
Zusammenfassung dauerhaft in der gemeinsamen Zustandsdatenbank. Beim Verlassen der Besprechung werden sichtbare
Untertitel abgeschlossen und die Zusammenfassung geschrieben; verwenden Sie [`openclaw transcripts`](/de/cli/transcripts),
um sie aufzulisten, zu prüfen oder zu exportieren. Dieser dauerhafte Notizpfad ändert weder das Live-
Transkript für die Agentenkonsultation noch erstellt er eine Audio-/Videoaufzeichnung.

Automatische Notizen sind standardmäßig aktiviert. Legen Sie `transcripts.enabled: false` fest, um
dauerhafte Notizen global zu deaktivieren. Eine ausdrücklich ausgewählte Sitzung vom Typ `transcribe` behält ihren
begrenzten Live-Untertitelverlauf bei, ohne dauerhafte Zeilen zu schreiben. Die Verfügbarkeit von Untertiteln
hängt weiterhin von der Besprechungsplattform, dem Konto, der Sprache und der Richtlinie des Hosts ab.

## Chrome und Audio vorbereiten

Chrome kann auf dem Gateway-Host oder auf einer gekoppelten Node ausgeführt werden. Eine entfernte Chrome-Node muss `browser.proxy` sowie den Plattformbefehl zulassen:

| Plugin          | Node-Befehl            |
| --------------- | ---------------------- |
| Google Meet     | `googlemeet.chrome`    |
| Microsoft Teams | `teamsmeetings.chrome` |
| Zoom            | `zoommeetings.chrome`  |

Führen Sie Chrome für den Modus `agent` oder `bidi` unter macOS aus und installieren Sie die gemeinsam genutzten Audioabhängigkeiten auf demselben Host:

```bash
brew install blackhole-2ch sox
sudo reboot
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Der Gateway-Host verwaltet weiterhin den OpenClaw-Agenten und die Modell-Anmeldedaten, wenn Chrome auf einer gekoppelten Node ausgeführt wird. Konfigurieren Sie für den Modus `agent` einen Provider für Echtzeittranskription und OpenClaw-TTS oder für den Modus `bidi` einen Echtzeit-Sprachprovider. Die Plattformanleitungen enthalten die Optionen für Provider und Audiobefehle.

## Plugins installieren oder deaktivieren

Installieren Sie Google Meet separat; nach der Installation ist es standardmäßig aktiviert. Microsoft Teams-Besprechungen und Zoom sind in OpenClaw enthalten und standardmäßig aktiviert:

```bash
# Nur Google Meet
openclaw plugins install npm:@openclaw/google-meet
```

Deaktivieren Sie alle Besprechungs-Plugins, die Sie nicht verwenden:

```bash
openclaw plugins disable google-meet
openclaw plugins disable teams-meetings
openclaw plugins disable zoom-meetings
```

Starten Sie das Gateway neu, wenn Ihr Plugin-Verwaltungspfad es nicht automatisch neu startet. Führen Sie anschließend vor dem Beitritt die Einrichtungsprüfung der Plattform aus.

## Prüfen und beitreten

| Plattform       | Einrichtungsprüfung             | Beitrittsbefehl                                                               |
| --------------- | ------------------------------- | ----------------------------------------------------------------------------- |
| Google Meet     | `openclaw googlemeet setup`    | `openclaw googlemeet join 'https://meet.google.com/abc-defg-hij'`             |
| Microsoft Teams | `openclaw teamsmeetings setup` | `openclaw teamsmeetings join 'https://teams.microsoft.com/l/meetup-join/...'` |
| Zoom            | `openclaw zoommeetings setup`  | `openclaw zoommeetings join 'https://zoom.us/j/1234567890'`                   |

Behandeln Sie jede fehlgeschlagene Einrichtungsprüfung als Hindernis für den betreffenden Transport und Modus. Wählen Sie für einen Smoke-Test mit reiner Beobachtung den Modus `transcribe` und bestätigen Sie, dass der Status eine aktive Anrufsitzung meldet, bevor Sie Untertiteltext erwarten.

Bei Smoke-Tests der Sprachausgabe erfordert die bestätigte Sprachwiedergabe mehr als nur Bytes, die vom Wiedergabebefehl akzeptiert wurden. Die gemeinsam genutzte Befehlspaar-Brücke korreliert einen begrenzten Wellenform-Fingerabdruck der aktuellen Ausgabegenerierung mit Audio, das über den Mikrofon-Aufnahmepfad von BlackHole zurückkehrt; Google Meet, Teams und Zoom melden `speechOutputVerified: true` nicht, wenn nur der Zähler für Ausgabebytes steigt oder Audio anderer Teilnehmer vorhanden ist.

## Plattformrichtlinien und Eingabeaufforderungen handhaben

Die Browserautomatisierung verarbeitet die üblichen Steuerelemente für Gastnamen, Kamera und Mikrofon vor dem Beitritt sowie für Beitritt, laufende Anrufe und Verlassen. Sie umgeht keine Richtlinien der Plattform oder des Organisators.

- Google Meet kann eine Google-Anmeldung, die Zulassung durch den Host oder eine Browser-Berechtigungsentscheidung erfordern.
- Microsoft Teams kann eine Mandantenanmeldung, E-Mail-Verifizierung oder Zulassung durch den Organisator erfordern.
- Zoom kann eine Authentifizierung, E-Mail-Verifizierung, einen Zugangscode, das Lösen eines CAPTCHA oder die Zulassung durch den Host erfordern; ein Konto kann außerdem den Browserbeitritt deaktivieren.

Wenn ein Beitritts- oder Statusergebnis `manualActionRequired` meldet, führen Sie den gemeldeten Schritt im selben OpenClaw-Chrome-Profil aus, bevor Sie es erneut versuchen. Das wiederholte Öffnen neuer Tabs löst keine Konto-, Mandanten-, Lobby- oder CAPTCHA-Sperre.

Nehmen Sie nur an Besprechungen teil, bei denen der Betreiber berechtigt ist, einen Agenten hinzuzufügen. Informieren Sie die Teilnehmer, wenn lokale Richtlinien oder Einwilligungsregeln die Offenlegung der automatisierten Teilnahme, Transkription oder synthetisierten Sprache erfordern.

## Discord-Sprachchat

[Discord-Sprachkanäle](/de/channels/discord#voice-channels) ermöglichen native Echtzeitgespräche nur mit Audio ohne Browserautomatisierung für Besprechungen. OpenClaw kann einem Sprachkanal beitreten, zuhören, Gesprächsrunden über einen OpenClaw-Agenten oder ein Echtzeit-Sprachmodell leiten und Antworten sprechen. Es sendet oder empfängt weder Kameravideo noch Bildschirmfreigaben, selbst wenn Personen im selben Discord-Kanal Video verwenden. Discord-Sprachchat ist daher eine verwandte Oberfläche für Live-Gespräche und kein viertes Browser-Besprechungs-Plugin.

## Plattformanleitungen

- [Google-Meet-Plugin](/de/plugins/google-meet)
- [Plugin für Microsoft Teams-Besprechungen](/plugins/teams-meetings)
- [Zoom-Besprechungs-Plugin](/plugins/zoom-meetings)
- [Plugins verwalten](/de/plugins/manage-plugins)
- [Browsersteuerung](/de/tools/browser)
