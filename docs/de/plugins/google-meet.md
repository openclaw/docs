---
read_when:
    - Sie möchten, dass ein OpenClaw-Agent an einem Google-Meet-Anruf teilnimmt
    - Sie möchten, dass ein OpenClaw-Agent einen neuen Google-Meet-Anruf erstellt
    - Sie konfigurieren Chrome, einen Chrome-Node oder Twilio als Google-Meet-Transport.
summary: 'Google-Meet-Plugin: Über Chrome oder Twilio expliziten Meet-URLs beitreten, mit standardmäßig aktivierter Sprachantwort des Agenten'
title: Google-Meet-Plugin
x-i18n:
    generated_at: "2026-07-24T03:55:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8a611e283fe900984a29b563969936a641c7af430b05933eb03b98dc93b5d0c8
    source_path: plugins/google-meet.md
    workflow: 16
---

Das Plugin `google-meet` nimmt im Namen eines OpenClaw-Agenten über explizite Meet-URLs an Besprechungen teil. Sein Funktionsumfang ist bewusst eng begrenzt:

- Es tritt nur über `https://meet.google.com/...`-URLs bei; es wählt sich niemals über eine selbst ermittelte Telefonnummer in eine Besprechung ein.
- `googlemeet create` kann über die Google Meet API (oder einen Browser-Fallback) eine neue Meet-URL erzeugen und tritt ihr standardmäßig bei.
- Die Teilnahme über Chrome verwendet ein angemeldetes Chrome-Profil, optional auf einem gekoppelten Node. Bei der Teilnahme über Twilio wird über das [Plugin für Sprachanrufe](/de/plugins/voice-call) eine Telefonnummer einschließlich PIN/DTMF gewählt; eine Meet-URL kann nicht direkt angewählt werden.
- `mode: "agent"` (Standard) transkribiert die Sprache der Teilnehmer mit einem Echtzeit-Provider, leitet sie an den konfigurierten OpenClaw-Agenten weiter und gibt die Antwort mit der regulären OpenClaw-Sprachausgabe aus. Mit `mode: "bidi"` antwortet ein Echtzeit-Sprachmodell direkt. `mode: "transcribe"` tritt ausschließlich als Beobachter ohne Antwortmöglichkeit bei.
- Beim Beitritt des Plugins zu einem Anruf erfolgt keine automatische Einwilligungsansage.
- Der CLI-Befehl lautet `googlemeet`; `meet` ist für umfassendere Telefonkonferenzabläufe von Agenten reserviert.

## Schnellstart

Installieren Sie das Plugin und die lokalen Audioabhängigkeiten und legen Sie anschließend einen Schlüssel für einen Echtzeit-Provider fest. OpenAI ist der standardmäßige Transkriptions-Provider für den Modus `agent`; Google Gemini Live ist als Sprach-Provider für den Modus `bidi` verfügbar:

```bash
openclaw plugins install npm:@openclaw/google-meet
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# nur erforderlich, wenn realtime.voiceProvider für den bidi-Modus auf "google" gesetzt ist
export GEMINI_API_KEY=...
```

`blackhole-2ch` installiert das virtuelle Audiogerät `BlackHole 2ch`, über das Chrome das Audio weiterleitet. Das Homebrew-Installationsprogramm erfordert einen Neustart, bevor macOS das Gerät bereitstellt:

```bash
sudo reboot
```

Überprüfen Sie nach dem Neustart beide Komponenten:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Das Plugin ist nach der Installation standardmäßig aktiviert. Fügen Sie nur dann einen Eintrag hinzu, wenn Sie es anpassen möchten:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        config: {},
      },
    },
  },
}
```

Führen Sie `openclaw plugins disable google-meet` aus, wenn das Plugin nicht aktiv sein soll.

Prüfen Sie die Einrichtung und treten Sie anschließend bei:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Die Ausgabe von `setup` ist für Agenten lesbar und berücksichtigt Modus und Transport: Sie meldet das Chrome-Profil, die Bindung an einen Node und bei Chrome-Echtzeitbeitritten die BlackHole-/SoX-Audiobrücke sowie die Prüfung der verzögerten Einleitung. Reine Beobachterbeitritte überspringen die Echtzeitvoraussetzungen:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Wenn die Delegierung an Twilio konfiguriert ist, meldet `setup` außerdem, ob `voice-call`, die Twilio-Anmeldedaten und die öffentliche Webhook-Bereitstellung einsatzbereit sind. Behandeln Sie jede Prüfung vom Typ `ok: false` für diesen Transport/Modus als blockierend, bevor ein Agent beitritt. Verwenden Sie `--json` für maschinenlesbare Ausgaben und `--transport chrome|chrome-node|twilio`, um einen bestimmten Transport vorab zu prüfen:

```bash
openclaw googlemeet setup --transport twilio
```

Alternativ kann ein Agent über das Tool `google_meet` beitreten:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Auf Gateway-Hosts ohne macOS bleibt `google_meet` für Artefakt-, Kalender-, Einrichtungs-, Transkriptions-, Twilio- und `chrome-node`-Aktionen sichtbar. Die lokale Sprachantwort über Chrome (`transport: "chrome"` mit `mode: "agent"` oder `"bidi"`) wird jedoch blockiert, bevor sie die Audiobrücke erreicht, da dieser Pfad derzeit von macOS-`BlackHole 2ch` abhängt. Verwenden Sie stattdessen `mode: "transcribe"`, die Twilio-Einwahl oder einen macOS-`chrome-node`-Host.

### Besprechung erstellen

```bash
openclaw googlemeet create --transport chrome-node --mode agent
openclaw googlemeet create --no-join
```

`create` verfügt über zwei Pfade, die im Feld `source` des Ergebnisses angegeben werden:

- **`api`**: Wird verwendet, wenn Google-Meet-OAuth-Anmeldedaten konfiguriert sind. Deterministisch; unabhängig vom Zustand der Browseroberfläche.
- **`browser`**: Wird ohne OAuth-Anmeldedaten verwendet. OpenClaw öffnet `https://meet.google.com/new` auf dem festgelegten Chrome-Node und wartet, bis Google zu einer echten URL mit Besprechungscode weiterleitet; das OpenClaw-Chrome-Profil auf diesem Node muss bereits bei Google angemeldet sein. Sowohl beim Beitreten als auch beim Erstellen wird ein vorhandener Meet-Tab (oder ein Tab mit einer laufenden `.../new`- bzw. Google-Kontoaufforderung) wiederverwendet, bevor ein neuer geöffnet wird; beim Tab-Abgleich werden unproblematische Abfragezeichenfolgen wie `authuser` ignoriert.

`create` tritt standardmäßig bei und gibt `joined: true` zusammen mit der Beitrittssitzung zurück. Übergeben Sie `--no-join` (CLI) oder `"join": false` (Tool), um nur die URL zu erzeugen.

Legen Sie für über die API erstellte Räume eine explizite Zugriffsrichtlinie fest, statt die Standardeinstellung des Google-Kontos zu übernehmen:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

| `--access-type` | Wer ohne Anklopfen beitreten kann                                   |
| --------------- | ------------------------------------------------------------------- |
| `OPEN`          | Jeder mit der Meet-URL                                              |
| `TRUSTED`       | Vertrauenswürdige Benutzer der Hostorganisation, eingeladene externe Benutzer und Einwahlbenutzer |
| `RESTRICTED`    | Nur eingeladene Personen                                            |

Dies gilt nur für über die API erstellte Räume, daher muss OAuth konfiguriert sein. Wenn Sie sich authentifiziert haben, bevor diese Option verfügbar war, führen Sie `openclaw googlemeet auth login --json` erneut aus, nachdem Sie den Scope `meetings.space.settings` zum OAuth-Einwilligungsbildschirm hinzugefügt haben.

Wenn der Browser-Fallback durch eine Google-Anmeldung oder eine Meet-Berechtigung blockiert wird, gibt das Tool `manualActionRequired: true` mit `manualActionReason`, `manualActionMessage` und den Angaben `browser.nodeId`/`browser.targetId`/`browserUrl` zurück. Melden Sie diese Nachricht und öffnen Sie keine neuen Meet-Tabs mehr, bis die Bedienperson den Schritt im Browser abgeschlossen hat.

### Beitritt nur als Beobachter

Legen Sie `"mode": "transcribe"` fest, um die bidirektionale Echtzeitbrücke zu überspringen (keine BlackHole-/SoX-Anforderung, keine Sprachantwort). Chrome-Beitritte im Transkriptionsmodus überspringen außerdem die OpenClaw-Berechtigung für Mikrofon/Kamera und den Meet-Pfad **Use microphone**. Wenn Meet den Zwischendialog zur Audioauswahl anzeigt, versucht die Automatisierung zuerst **Continue without microphone**. Verwaltete Chrome-Transporte installieren in jedem Modus nach Möglichkeit einen Meet-Untertitelbeobachter, damit dauerhafte Notizen verfügbar sind, ohne den Live-Konsultationspfad des Agenten zu ändern. `googlemeet status --json` und `googlemeet doctor` melden `captioning`, `captionsEnabledAttempted`, `transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText` und ein `recentTranscript`-Endsegment.

Lesen Sie für das begrenzte Sitzungstranskript den exakt verfolgten Meet-Tab:

```bash
openclaw googlemeet transcript <session-id>
openclaw googlemeet transcript <session-id> --since <next-index> --json
```

Der Beobachter hält höchstens 2.000 abgeschlossene Untertitelzeilen auf der Meet-Seite vor. Sichtbarer fortschreitender Text verbleibt im Zustands-Endsegment, bis die Untertitelzeile abgeschlossen ist. Daher kann das Speichern von `nextIndex` eine spätere Texterweiterung nicht überspringen; beim Verlassen werden sichtbare Zeilen vor dem Snapshot abgeschlossen. `droppedLines` meldet Zeilen, die am Anfang verloren gingen, wenn die Obergrenze überschritten wurde. Das begrenzte `googlemeet transcript`-Endsegment enthält weiterhin nur die vier zuletzt beendeten Sitzungen und wird mit dem Gateway zurückgesetzt. Unabhängig davon fügt OpenClaw während der gesamten Besprechung abgeschlossene Untertitelzeilen an die gemeinsame Zustandsdatenbank an und schreibt beim Verlassen eine abgeleitete Zusammenfassung. Verwenden Sie [`openclaw transcripts`](/de/cli/transcripts), um diese dauerhaften Notizen zu prüfen oder zu exportieren.

Automatische Notizen sind standardmäßig aktiviert. Legen Sie `transcripts.enabled: false` fest, um
dauerhafte Notizen global zu deaktivieren; der explizite Modus `transcribe` stellt weiterhin nur
sein begrenztes Live-Endsegment bereit. Twilio-Beitritte verfügen nicht über den Untertitelstrom des Browsers und
werden über diesen Pfad nicht erfasst.

Für eine Ja/Nein-Prüfung des Mithörens:

```bash
openclaw googlemeet test-listen <meet-url> --transport chrome-node
```

Der Befehl tritt im Transkriptionsmodus bei, wartet auf neue Untertitel-/Transkriptaktivität und gibt `listenVerified`, `listenTimedOut`, Felder für manuelle Aktionen sowie den aktuellen Untertitelzustand zurück.

### Zustand der Echtzeitsitzung

Während Sitzungen mit Sprachantwort meldet der Status `google_meet` den Zustand der Chrome-/Audiobrücke: `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, Zeitstempel der letzten Ein-/Ausgabe, Bytezähler und den Zustand „Brücke geschlossen“. Verwaltete Chrome-Sitzungen sprechen den Einleitungs-/Testsatz erst aus, nachdem der Zustand `inCall: true` meldet; andernfalls wird `speechReady: false` gemeldet und der Sprachversuch blockiert, statt ohne Rückmeldung wirkungslos zu bleiben.

Lokale Chrome-Beitritte erfolgen über das angemeldete OpenClaw-Browserprofil und benötigen `BlackHole 2ch` für den Mikrofon-/Lautsprecherpfad. Ein einzelnes BlackHole-Gerät reicht für einen ersten Smoke-Test aus, kann jedoch ein Echo verursachen. Verwenden Sie separate virtuelle Geräte oder eine Loopback-ähnliche Verschaltung für sauberes bidirektionales Audio.

## Lokaler Gateway + Parallels Chrome

Ein vollständiger Gateway oder Modell-API-Schlüssel ist innerhalb einer macOS-VM nicht erforderlich, wenn sie lediglich Chrome bereitstellen soll. Führen Sie den Gateway und den Agenten lokal aus; führen Sie in der VM einen Node-Host aus.

| Ausführungsort       | Ausgeführte Komponenten                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| Gateway-Host         | OpenClaw Gateway, Agenten-Arbeitsbereich, Modell-/API-Schlüssel, Echtzeit-Provider, Konfiguration des Google-Meet-Plugins |
| Parallels-macOS-VM   | OpenClaw-CLI/Node-Host, Chrome, SoX, BlackHole 2ch, ein bei Google angemeldetes Chrome-Profil    |
| In der VM nicht erforderlich | Gateway-Dienst, Agentenkonfiguration, Einrichtung des Modell-Providers                    |

Installieren Sie die VM-Abhängigkeiten, starten Sie neu und führen Sie die Überprüfung durch:

```bash
brew install blackhole-2ch sox
sudo reboot
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Installieren Sie das Plugin in der VM, wo es standardmäßig aktiviert wird, und starten Sie den Node-Host:

```bash
openclaw plugins install npm:@openclaw/google-meet
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Wenn `<gateway-host>` eine LAN-IP ohne TLS ist, stimmen Sie der Verwendung dieses vertrauenswürdigen privaten Netzwerks ausdrücklich zu:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Verwenden Sie dasselbe Flag bei der Installation als LaunchAgent (es handelt sich um eine Prozessumgebungsvariable, die in der LaunchAgent-Umgebung gespeichert wird, wenn sie beim Installationsbefehl vorhanden ist, nicht um eine `openclaw.json`-Einstellung):

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

Genehmigen Sie den Node vom Gateway-Host aus und vergewissern Sie sich anschließend, dass er sowohl `googlemeet.chrome` als auch die Browserfunktion/`browser.proxy` bekannt gibt:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Leiten Sie Meet über diesen Node:

```json5
{
  gateway: {
    nodes: {
      commands: { allow: ["googlemeet.chrome", "browser.proxy"] },
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chrome: {
            guestName: "OpenClaw Agent",
            autoJoin: true,
            reuseExistingTab: true,
          },
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

Treten Sie nun wie gewohnt vom Gateway-Host aus bei:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Für einen Smoke-Test mit einem einzigen Befehl, der eine Sitzung erstellt oder wiederverwendet, einen bekannten Satz spricht und den Sitzungszustand ausgibt:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Beim Echtzeitbeitritt füllt die Browserautomatisierung den Gastnamen aus, klickt auf Join/Ask to join und bestätigt die beim ersten Start von Meet angezeigte Aufforderung „Use microphone“, sofern sie erscheint (oder „Continue without microphone“ beim Beitritt im reinen Beobachtungsmodus und bei der ausschließlichen Erstellung eines Meetings im Browser). Wenn das Profil abgemeldet ist, Meet auf die Zulassung durch den Host wartet, Chrome eine Mikrofon-/Kameraberechtigung benötigt oder Meet bei einer nicht beantworteten Aufforderung festhängt, meldet das Ergebnis `manualActionRequired: true` mit `manualActionReason` und `manualActionMessage`. Beenden Sie die Wiederholungsversuche, melden Sie diese Nachricht zusammen mit `browserUrl`/`browserTitle`, und versuchen Sie es erst erneut, nachdem die manuelle Aktion abgeschlossen wurde.

Wenn `chromeNode.node` weggelassen wird, wählt OpenClaw nur dann automatisch aus, wenn genau eine verbundene Node sowohl `googlemeet.chrome` als auch Browsersteuerung ankündigt; legen Sie `chromeNode.node` (Node-ID, Anzeigename oder Remote-IP) fest, wenn mehrere geeignete Nodes verbunden sind.

### Häufige Fehlerprüfungen

| Symptom                                                  | Behebung                                                                                                                                                                                                                                                                                   |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Configured Google Meet node ... is not usable: offline` | Die festgelegte Node ist bekannt, aber nicht verfügbar. Melden Sie den Einrichtungsblocker; weichen Sie nicht stillschweigend auf einen anderen Transportweg aus, sofern dies nicht angefordert wurde.                                                                                                                                                      |
| `No connected Google Meet-capable node`                  | Installieren Sie `npm:@openclaw/google-meet` in der VM, führen Sie `openclaw plugins enable browser` aus, starten Sie `openclaw node run`, und genehmigen Sie die Kopplung. Falls Google Meet ausdrücklich deaktiviert wurde, aktivieren Sie es ebenfalls. Vergewissern Sie sich, dass `gateway.nodes.commands.allow` `googlemeet.chrome` und `browser.proxy` enthält. |
| `BlackHole 2ch audio device not found`                   | Installieren Sie `blackhole-2ch` auf dem zu prüfenden Host und starten Sie ihn neu.                                                                                                                                                                                                                         |
| `BlackHole 2ch audio device not found on the node`       | Installieren Sie `blackhole-2ch` in der VM und starten Sie die VM neu.                                                                                                                                                                                                                                  |
| Chrome wird geöffnet, kann aber nicht beitreten                             | Melden Sie sich im Browserprofil der VM an oder lassen Sie `chrome.guestName` gesetzt. Der automatische Gastbeitritt verwendet die OpenClaw-Browserautomatisierung über den Node-Browser-Proxy; verweisen Sie mit `browser.defaultProfile` der Node (oder einem benannten Profil mit bestehender Sitzung) auf das gewünschte Profil.                   |
| Doppelte Meet-Tabs                                      | Lassen Sie `chrome.reuseExistingTab: true`. OpenClaw aktiviert einen vorhandenen Tab für dieselbe URL, und die Erstellung verwendet einen laufenden `.../new`- oder Google-Konto-Aufforderungstab erneut, bevor ein weiterer geöffnet wird.                                                                                        |
| Kein Ton                                                 | Leiten Sie Meet-Mikrofon und -Lautsprecher über den von OpenClaw verwendeten virtuellen Audiopfad; verwenden Sie für sauberes Duplex-Audio getrennte virtuelle Geräte oder eine Loopback-artige Weiterleitung.                                                                                                                                |

## Installationshinweise

Der Standard für die Chrome-Audiorückgabe verwendet zwei externe Werkzeuge, die OpenClaw weder bündelt noch weiterverteilt; installieren Sie sie über Homebrew als Host-Abhängigkeiten:

- `sox`: Befehlszeilen-Audiowerkzeug. Das Plugin gibt explizite CoreAudio-Gerätebefehle für die standardmäßige PCM16-Audiobrücke mit 24 kHz aus.
- `blackhole-2ch`: Virtueller macOS-Audiotreiber, der das Gerät `BlackHole 2ch` bereitstellt, über das Chrome/Meet weitergeleitet werden.

SoX ist unter `LGPL-2.0-only AND GPL-2.0-only` lizenziert; BlackHole unter GPL-3.0. Wenn Sie ein Installationsprogramm oder eine Appliance erstellen, die BlackHole mit OpenClaw bündelt, prüfen Sie die Upstream-Lizenzierung von BlackHole oder erwerben Sie eine separate Lizenz von Existential Audio.

## Transportwege

| Transportweg     | Verwenden, wenn                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `chrome`      | Chrome/Audio auf dem Gateway-Host ausgeführt werden                                                        |
| `chrome-node` | Chrome/Audio auf einer gekoppelten Node ausgeführt werden (beispielsweise einer Parallels-macOS-VM)                        |
| `twilio`      | Telefonische Einwahl als Ausweichlösung über das Voice-Call-Plugin, wenn eine Teilnahme über Chrome nicht verfügbar ist |

### Chrome

Öffnet die Meet-URL über die OpenClaw-Browsersteuerung und tritt mit dem angemeldeten OpenClaw-Browserprofil bei. Unter macOS prüft das Plugin vor dem Start auf `BlackHole 2ch` und führt, sofern konfiguriert, einen Befehl zur Zustandsprüfung/zum Starten der Audiobrücke aus, bevor Chrome geöffnet wird. Wählen Sie für lokales Chrome das Profil mit `browser.defaultProfile` aus; `chrome.browserProfile` wird stattdessen an `chrome-node`-Hosts übergeben.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Das Mikrofon-/Lautsprecheraudio von Chrome wird über die lokale OpenClaw-Audiobrücke geleitet. Wenn `BlackHole 2ch` nicht installiert ist, schlägt der Beitritt mit einem Einrichtungsfehler fehl, anstatt ohne Audiopfad beizutreten.

### Twilio

Ein strikter Wählplan, der an das [Voice-Call-Plugin](/de/plugins/voice-call) delegiert wird. Meet-Seiten werden nicht nach Telefonnummern durchsucht; Google Meet muss für das Meeting eine Einwahlnummer und PIN bereitstellen.

Aktivieren Sie Voice Call auf dem Gateway-Host, nicht auf der Chrome-Node:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // oder auf "twilio" setzen, wenn Twilio der Standard sein soll
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          inboundPolicy: "allowlist",
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Treten Sie diesem Google Meet als OpenClaw-Agent bei. Fassen Sie sich kurz.",
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                silenceDurationMs: 500,
                startSensitivity: "high",
              },
            },
          },
        },
      },
      google: {
        enabled: true,
      },
    },
  },
}
```

Stellen Sie die Twilio-Anmeldedaten über die Umgebung bereit, damit Geheimnisse nicht in `openclaw.json` gespeichert werden:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

Verwenden Sie stattdessen `realtime.provider: "openai"` mit `OPENAI_API_KEY`, wenn OpenAI der Echtzeit-Sprach-Provider ist.

Starten oder laden Sie den Gateway nach der Aktivierung von `voice-call` neu; Änderungen an der Plugin-Konfiguration werden erst nach dem Neuladen wirksam. Überprüfen Sie Folgendes:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Wenn die Twilio-Delegierung eingerichtet ist, enthält `googlemeet setup` Prüfungen für `twilio-voice-call-plugin`, `twilio-voice-call-credentials` und `twilio-voice-call-webhook`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Verwenden Sie `--dtmf-sequence` für eine benutzerdefinierte Sequenz, mit vorangestelltem `w` oder Kommas für eine Pause vor der PIN:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth und Vorabprüfung

OAuth ist für die Erstellung eines Meet-Links optional, da `googlemeet create` auf Browserautomatisierung zurückgreifen kann. Konfigurieren Sie OAuth für die Erstellung über die offizielle API, die Auflösung von Spaces oder die Vorabprüfung der Meet Media API. Beitritte über Chrome/Chrome-Node hängen nie von OAuth ab; sie verwenden in jedem Fall ein angemeldetes Chrome-Profil, BlackHole/SoX und (für `chrome-node`) eine verbundene Node.

### Google-Anmeldedaten erstellen

In der Google Cloud Console:

<Steps>
<Step title="Projekt erstellen oder auswählen">
</Step>
<Step title="Google Meet REST API aktivieren">
</Step>
<Step title="OAuth-Zustimmungsbildschirm konfigurieren">
Internal ist für eine Google-Workspace-Organisation am einfachsten. External eignet sich für persönliche/Testkonfigurationen; solange sich die Anwendung im Status Testing befindet, fügen Sie jedes Google-Konto, das sie autorisieren soll, als Testnutzer hinzu.
</Step>
<Step title="Die angeforderten Bereiche hinzufügen">
- `https://www.googleapis.com/auth/meetings.space.created`
- `https://www.googleapis.com/auth/meetings.space.readonly`
- `https://www.googleapis.com/auth/meetings.space.settings`
- `https://www.googleapis.com/auth/meetings.conference.media.readonly`
- `https://www.googleapis.com/auth/calendar.events.readonly` (Kalendersuche)
- `https://www.googleapis.com/auth/drive.meet.readonly` (Export des Dokumentinhalts von Transkripten/intelligenten Notizen)

</Step>
<Step title="OAuth-Client-ID erstellen">
Anwendungstyp **Web application**. Autorisierte Weiterleitungs-URI:

```text
http://localhost:8085/oauth2callback
```

</Step>
<Step title="Client-ID und Client-Secret kopieren">
</Step>
</Steps>

`meetings.space.created` wird von `spaces.create` benötigt. `meetings.space.readonly` löst Meet-URLs/-Codes in Spaces auf. Mit `meetings.space.settings` kann OpenClaw bei der API-Raumerstellung `SpaceConfig`-Einstellungen wie `accessType` übergeben. `meetings.conference.media.readonly` ist für die Vorabprüfung und Medienarbeit der Meet Media API vorgesehen; Google kann für die tatsächliche Nutzung der Media API eine Anmeldung für die Developer Preview verlangen. `calendar.events.readonly` wird nur für die Kalendersuche mit `--today`/`--event` benötigt. `drive.meet.readonly` wird nur für den Export mit `--include-doc-bodies` benötigt. Wenn Sie ausschließlich browserbasierte Chrome-Beitritte benötigen, überspringen Sie OAuth vollständig.

### Refresh-Token erstellen

Konfigurieren Sie `oauth.clientId` und optional `oauth.clientSecret` (oder übergeben Sie sie als Umgebungsvariablen), und führen Sie anschließend Folgendes aus:

```bash
openclaw googlemeet auth login --json
```

Dadurch wird ein PKCE-Ablauf mit einem localhost-Callback auf `http://localhost:8085/oauth2callback` ausgeführt und ein `oauth`-Konfigurationsblock mit einem Refresh-Token ausgegeben. Fügen Sie `--manual` für einen Kopieren-und-Einfügen-Ablauf hinzu, wenn der Browser den lokalen Callback nicht erreichen kann:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

JSON-Ausgabe:

```json
{
  "oauth": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "refreshToken": "refresh-token",
    "accessToken": "access-token",
    "expiresAt": 1770000000000
  },
  "scope": "..."
}
```

Speichern Sie das `oauth`-Objekt unter der Plugin-Konfiguration:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          oauth: {
            clientId: "your-client-id",
            clientSecret: "your-client-secret",
            refreshToken: "refresh-token",
          },
        },
      },
    },
  },
}
```

Bevorzugen Sie Umgebungsvariablen, wenn Sie das Refresh-Token nicht in der Konfiguration speichern möchten; zuerst wird die Konfiguration ausgewertet, dann ersatzweise die Umgebung. Wenn Sie sich authentifiziert haben, bevor Unterstützung für Meeting-Erstellung, Kalendersuche oder Dokumentinhaltexport verfügbar war, führen Sie `openclaw googlemeet auth login --json` erneut aus, damit das Refresh-Token den aktuellen Umfangssatz abdeckt.

### OAuth mit Doctor überprüfen

```bash
openclaw googlemeet doctor --oauth --json
```

Damit wird geprüft, ob eine OAuth-Konfiguration vorhanden ist und das Aktualisierungstoken ein Zugriffstoken ausstellen kann, ohne die Chrome-Laufzeit zu laden oder eine verbundene Node zu benötigen. Der Bericht enthält nur Statusfelder (`ok`, `configured`, `tokenSource`, `expiresAt`, Prüfmeldungen) und gibt niemals das Zugriffstoken, das Aktualisierungstoken oder das Client-Geheimnis aus.

| Prüfung              | Bedeutung                                                                        |
| -------------------- | -------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` plus `oauth.refreshToken` oder ein zwischengespeichertes Zugriffstoken ist vorhanden |
| `oauth-token`        | Das zwischengespeicherte Zugriffstoken ist noch gültig oder das Aktualisierungstoken hat ein neues ausgestellt |
| `meet-spaces-get`    | Die optionale Prüfung `--meeting` hat einen vorhandenen Meet-Bereich aufgelöst |
| `meet-spaces-create` | Die optionale Prüfung `--create-space` hat einen neuen Meet-Bereich erstellt |

Weisen Sie die Aktivierung der Meet API und den Bereich `spaces.create` mit der zustandsverändernden Erstellungsprüfung nach:

```bash
openclaw googlemeet doctor --oauth --create-space --json
```

Weisen Sie den Lesezugriff auf einen vorhandenen Bereich nach:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Ein `403` bei diesen Prüfungen bedeutet normalerweise, dass die Meet-REST-API deaktiviert ist, dem Aktualisierungstoken der erforderliche Bereich fehlt oder das Google-Konto nicht auf diesen Bereich zugreifen kann. Ein Aktualisierungstokenfehler bedeutet, dass `openclaw googlemeet auth login --json` erneut ausgeführt und der neue Block `oauth` gespeichert werden muss.

Für den Browser-Fallback ist kein OAuth erforderlich; die Google-Authentifizierung erfolgt dort über das angemeldete Chrome-Profil auf der ausgewählten Node und nicht über die OpenClaw-Konfiguration.

Diese Umgebungsvariablen werden als Fallbacks akzeptiert:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` oder `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` oder `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` oder `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` oder `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` oder `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` oder `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` oder `GOOGLE_MEET_PREVIEW_ACK`

### Artefakte auflösen, vorab prüfen und lesen

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Nachdem Meet Konferenzdatensätze erstellt hat:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Bei `--meeting`, `artifacts` und `attendance` wird standardmäßig der neueste Konferenzdatensatz verwendet; übergeben Sie `--all-conference-records` für jeden aufbewahrten Datensatz.

Die Kalendersuche löst die Besprechungs-URL aus Google Calendar auf, bevor Artefakte gelesen werden (erfordert ein Aktualisierungstoken, das den Nur-Lese-Bereich für Kalenderereignisse enthält):

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` durchsucht den heutigen Kalender `primary` nach einem Ereignis mit einem Meet-Link; `--event <query>` durchsucht übereinstimmenden Ereignistext; `--calendar <id>` richtet sich an einen nicht primären Kalender. `calendar-events` zeigt eine Vorschau übereinstimmender Ereignisse an und kennzeichnet, welches `latest`/`artifacts`/`attendance`/`export` auswählen wird.

Wenn die ID des Konferenzdatensatzes bereits bekannt ist, können Sie ihn direkt adressieren:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Schließen Sie den Raum für einen per API erstellten Bereich:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Ruft `spaces.endActiveConference` auf und erfordert OAuth mit dem Bereich `meetings.space.created` für einen Bereich, den das autorisierte Konto verwalten kann. Akzeptiert eine Meet-URL, einen Besprechungscode oder `spaces/{id}` und löst dies zunächst in die API-Bereichsressource auf. Dies ist von `googlemeet leave` getrennt: `leave` beendet die lokale/Sitzungsteilnahme von OpenClaw; `end-active-conference` fordert Google Meet auf, die aktive Konferenz für den Bereich zu beenden.

Erstellen Sie einen lesbaren Bericht:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` gibt Metadaten des Konferenzdatensatzes sowie Metadaten zu Teilnehmer-, Aufzeichnungs-, Transkript-, strukturierten Transkripteintrags- und Smart-Note-Ressourcen zurück, sofern Google sie bereitstellt. `--no-transcript-entries` überspringt die Eintragssuche bei großen Besprechungen. `attendance` erweitert Teilnehmer zu Teilnehmer-Sitzungszeilen mit Zeitpunkten der ersten/letzten Anwesenheit, Gesamtsitzungsdauer, Kennzeichnungen für Verspätung/frühes Verlassen und zusammengeführten doppelten Teilnehmerressourcen nach angemeldetem Benutzer oder Anzeigenamen; `--no-merge-duplicates` hält Rohressourcen getrennt, `--late-after-minutes`/`--early-before-minutes` passen die Schwellenwerte an.

`export` schreibt einen Ordner mit `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` und `manifest.json`. `manifest.json` zeichnet die gewählte Eingabe, Exportoptionen, Konferenzdatensätze, Ausgabedateien, Anzahlen, Tokenquelle, alle verwendeten Kalenderereignisse und Warnungen über unvollständigen Abruf auf. `--zip` schreibt außerdem ein portables Archiv neben den Ordner. `--include-doc-bodies` exportiert den Text verknüpfter Google-Docs-Dokumente für Transkripte/Smart Notes über Drive `files.export` (erfordert den Nur-Lese-Bereich für Drive Meet); ohne diesen enthalten Exporte nur Meet-Metadaten und strukturierte Transkripteinträge. Bei einem teilweisen Artefaktfehler (Fehler beim Auflisten von Smart Notes, bei einem Transkripteintrag oder Dokumentinhalt) bleibt die Warnung in der Zusammenfassung/im Manifest erhalten, statt den gesamten Export fehlschlagen zu lassen. `--dry-run` ruft dieselben Daten ab und gibt das Manifest-JSON aus, ohne den Ordner oder die ZIP-Datei zu erstellen.

Agenten verwenden dieselben Aktionen über das Werkzeug `google_meet` (`export`, `create` mit `accessType`, `end_active_conference`, `test_listen`); siehe [Werkzeug](#tool).

### Live-Smoke-Test

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

| Variable                                                                                                                  | Zweck                                                                  |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `OPENCLAW_LIVE_TEST=1`                                                                                                    | Aktiviert geschützte Live-Tests                                        |
| `OPENCLAW_GOOGLE_MEET_LIVE_MEETING`                                                                                       | Aufbewahrte Meet-URL, Code oder `spaces/{id}`                          |
| `OPENCLAW_GOOGLE_MEET_CLIENT_ID` / `GOOGLE_MEET_CLIENT_ID`                                                                | OAuth-Client-ID                                                        |
| `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` / `GOOGLE_MEET_REFRESH_TOKEN`                                                        | Aktualisierungstoken                                                   |
| `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` | Optional; dieselben Fallback-Namen ohne das Präfix `OPENCLAW_` funktionieren ebenfalls |

Der grundlegende Artefakt-/Anwesenheits-Smoke-Test benötigt `meetings.space.readonly` und `meetings.conference.media.readonly`. Die Kalendersuche benötigt `calendar.events.readonly`. Der Export von Drive-Dokumentinhalten benötigt `drive.meet.readonly`.

### Erstellungsbeispiele

```bash
openclaw googlemeet create
```

Gibt die neue Besprechungs-URI, die Quelle und die Beitrittssitzung aus. Mit OAuth wird die Meet API verwendet; ohne OAuth das angemeldete Profil der angehefteten Chrome-Node. Browser-Fallback-JSON:

```json
{
  "source": "browser",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Wenn der Browser-Fallback zuerst auf die Google-Anmeldung oder eine Meet-Berechtigungssperre trifft, gibt `google_meet` strukturierte Details statt einer einfachen Zeichenfolge zurück:

```json
{
  "source": "browser",
  "error": "google-login-required: Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

JSON der API-Erstellung:

```json
{
  "source": "api",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "space": {
    "name": "spaces/abc-defg-hij",
    "meetingCode": "abc-defg-hij",
    "meetingUri": "https://meet.google.com/abc-defg-hij"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Bei der Erstellung wird standardmäßig beigetreten, aber Chrome/Chrome-Node benötigt weiterhin ein angemeldetes Google-Profil, um über den Browser beizutreten. Wenn das Profil abgemeldet ist, meldet OpenClaw `manualActionRequired: true` oder einen Browser-Fallback-Fehler und fordert die Bedienperson auf, die Google-Anmeldung abzuschließen, bevor der Vorgang erneut versucht wird.

Setzen Sie `preview.enrollmentAcknowledged: true` erst, nachdem Sie bestätigt haben, dass Ihr Cloud-Projekt, OAuth-Prinzipal und die Besprechungsteilnehmer beim Google Workspace Developer Preview Program für Meet-Medien-APIs registriert sind.

## Konfiguration

Der übliche Chrome-Agentenpfad benötigt nur das aktivierte Plugin, BlackHole, SoX, einen Echtzeit-Provider-Schlüssel und einen konfigurierten OpenClaw-TTS-Provider:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

### Standardwerte

| Schlüssel                          | Standardwert                             | Hinweise                                                                                                                                                                                                          |
| --------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultTransport`                | `"chrome"`                       |                                                                                                                                                                                                                   |
| `defaultMode`                | `"agent"`                       | `"realtime"` wird als veralteter Alias für `"agent"` akzeptiert; neue Aufrufer sollten `"agent"` verwenden                                                                                 |
| `chromeNode.node`                | nicht gesetzt                            | Node-ID/-Name/-IP für `chrome-node`; erforderlich, wenn mehr als ein geeigneter Node verbunden sein kann                                                                                                     |
| `chrome.launch`                | `true`                       | Startet Chrome für den Beitritt; setzen Sie `false` nur, wenn eine bereits geöffnete Sitzung wiederverwendet wird                                                                                       |
| `chrome.audioBackend`                | `"blackhole-2ch"`                       |                                                                                                                                                                                                                   |
| `chrome.guestName`                | `"OpenClaw Agent"`                       | Wird auf dem Meet-Gastbildschirm im abgemeldeten Zustand angezeigt                                                                                                                                                |
| `chrome.autoJoin`                | `true`                       | Bestmögliches Ausfüllen des Gastnamens und Klicken auf Join Now bei `chrome-node`                                                                                                                            |
| `chrome.reuseExistingTab`                | `true`                       | Aktiviert einen vorhandenen Meet-Tab, statt Duplikate zu öffnen                                                                                                                                                   |
| `chrome.waitForInCallMs`                | `20000`                       | Wartet, bis der Meet-Tab meldet, dass der Anruf aktiv ist, bevor die Talkback-Begrüßung ausgelöst wird                                                                                                             |
| `chrome.audioFormat`                | `"pcm16-24khz"`                       | Audioformat des Befehlspaars; `"g711-ulaw-8khz"` ist nur für veraltete/benutzerdefinierte Befehlspaare vorgesehen, die Telefonie-Audio ausgeben                                                                    |
| `chrome.audioBufferBytes`                | `4096`                       | SoX-Verarbeitungspuffer für generierte Audiobefehle des Befehlspaars (die Hälfte des standardmäßigen 8192-Byte-Puffers von SoX, wodurch die Pipe-Latenz sinkt); Werte werden auf mindestens 17 Byte begrenzt          |
| `chrome.audioInputCommand`                | generierter SoX-Befehl                   | Liest aus CoreAudio `BlackHole 2ch` und schreibt Audio in `chrome.audioFormat`                                                                                                                                   |
| `chrome.audioOutputCommand`                | generierter SoX-Befehl                   | Liest Audio in `chrome.audioFormat` und schreibt in CoreAudio `BlackHole 2ch`                                                                                                                                    |
| `chrome.bargeInInputCommand`                | nicht gesetzt                            | Optionaler lokaler Mikrofonbefehl, der vorzeichenbehaftetes, monophones 16-Bit-Little-Endian-PCM zur Erkennung menschlicher Unterbrechungen während der Assistentenwiedergabe schreibt; gilt für die vom Gateway gehostete Befehlspaar-Bridge |
| `chrome.bargeInRmsThreshold`                | `650`                       | RMS-Pegel, der als menschliche Unterbrechung gewertet wird                                                                                                                                                        |
| `chrome.bargeInPeakThreshold`                | `2500`                       | Spitzenpegel, der als menschliche Unterbrechung gewertet wird                                                                                                                                                     |
| `chrome.bargeInCooldownMs`                | `900`                       | Mindestverzögerung zwischen wiederholtem Aufheben von Unterbrechungen                                                                                                                                              |
| `mode` (pro Anfrage)  | `"agent"`                       | Talkback-Modus; siehe Tabelle [Agenten- und Bidi-Modi](#agent-and-bidi-modes)                                                                                                                                      |
| `realtime.provider`                | `"openai"`                       | Kompatibilitäts-Fallback, der verwendet wird, wenn die unten aufgeführten bereichsspezifischen Felder nicht gesetzt sind                                                                                           |
| `realtime.transcriptionProvider`                | `"openai"`                       | Provider-ID, die im Modus `agent` für die Echtzeittranskription verwendet wird                                                                                                                         |
| `realtime.voiceProvider`                | nicht gesetzt                            | Provider-ID, die im Modus `bidi` für direkte Echtzeitsprachübertragung verwendet wird; setzen Sie sie für Gemini Live auf `"google"`, während die Transkription im Agentenmodus bei OpenAI bleibt. Kombinieren Sie dies mit `realtime.model`, um das konkrete Gemini-Live-Modell auszuwählen. |
| `realtime.toolPolicy`                | `"safe-read-only"`                       | Siehe [Agenten- und Bidi-Modi](#agent-and-bidi-modes)                                                                                                                                                             |
| `realtime.instructions`                | Anweisungen für kurze gesprochene Antworten | Weist das Modell an, sich kurz zu fassen und für ausführlichere Antworten `openclaw_agent_consult` zu verwenden                                                                                                         |
| `realtime.introMessage`                | `"Say exactly: I'm here and listening."`                       | Wird einmal gesprochen, wenn die Echtzeit-Bridge eine Verbindung herstellt; setzen Sie den Wert auf `""`, um ohne Begrüßung beizutreten                                                             |
| `realtime.agentId`                | `"main"`                       | OpenClaw-Agenten-ID, die für `openclaw_agent_consult` verwendet wird                                                                                                                                                    |
| `voiceCall.enabled`                | `true`                       | Delegiert den Twilio-PSTN-Anruf, DTMF und die Begrüßung an das Voice-Call-Plugin                                                                                                                                  |
| `voiceCall.dtmfDelayMs`                | `12000`                       | Anfängliche Wartezeit vor dem Abspielen einer aus einer PIN abgeleiteten DTMF-Sequenz über Twilio                                                                                                                  |
| `voiceCall.postDtmfSpeechDelayMs`                | `5000`                       | Verzögerung vor dem Anfordern der Echtzeitbegrüßung, nachdem Voice Call den Twilio-Verbindungsabschnitt gestartet hat                                                                                              |

Mit `chrome.audioBridgeCommand` und `chrome.audioBridgeHealthCommand` kann eine externe Bridge anstelle von `chrome.audioInputCommand`/`chrome.audioOutputCommand` den gesamten lokalen Audiopfad übernehmen; die Einschränkung, welcher Modus diese verwenden kann, finden Sie unter [Hinweise](#notes).

Für die veraltete Form `realtime.provider: "google"` ist eine `openclaw doctor --fix`-Migration vorhanden: Sie überträgt diese Absicht auf `realtime.voiceProvider: "google"` und `realtime.transcriptionProvider: "openai"`, sofern diese Felder noch nicht gesetzt sind.

### Optionale Überschreibungen

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  browser: {
    defaultProfile: "openclaw",
  },
  chrome: {
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
    bargeInInputCommand: [
      "sox",
      "-q",
      "-t",
      "coreaudio",
      "External Microphone",
      "-r",
      "24000",
      "-c",
      "1",
      "-b",
      "16",
      "-e",
      "signed-integer",
      "-t",
      "raw",
      "-",
    ],
  },
  chromeNode: {
    node: "parallels-macos",
  },
  defaultMode: "agent",
  realtime: {
    provider: "openai",
    transcriptionProvider: "openai",
    voiceProvider: "google",
    model: "gemini-3.1-flash-live-preview",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Sage genau: Ich bin da.",
    providers: {
      google: {
        speakerVoice: "Kore",
      },
    },
  },
}
```

ElevenLabs sowohl für das Zuhören als auch für das Sprechen im Agentenmodus:

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        modelId: "eleven_v3",
        speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
      },
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        config: {
          realtime: {
            transcriptionProvider: "elevenlabs",
            providers: {
              elevenlabs: {
                modelId: "scribe_v2_realtime",
                audioFormat: "ulaw_8000",
                sampleRate: 8000,
                commitStrategy: "vad",
              },
            },
          },
        },
      },
    },
  },
}
```

Die dauerhafte Meet-Stimme stammt aus `tts.providers.elevenlabs.speakerVoiceId`. Agentenantworten können außerdem antwortspezifische `[[tts:speakerVoiceId=... model=eleven_v3]]`-Direktiven verwenden, wenn Überschreibungen des TTS-Modells aktiviert sind; für Besprechungen ist die Konfiguration jedoch der deterministische Standard. Beim Beitritt zeigen die Protokolle `transcriptionProvider=elevenlabs`, und jede gesprochene Antwort protokolliert `provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>`.

Nur-Twilio-Konfiguration:

```json5
{
  defaultTransport: "twilio",
  twilio: {
    defaultDialInNumber: "+15551234567",
    defaultPin: "123456",
  },
  voiceCall: {
    gatewayUrl: "ws://127.0.0.1:18789",
  },
}
```

Bei `voiceCall.enabled: true` (dem Standardwert) und Twilio-Transport sendet Voice Call die DTMF-Sequenz, bevor der Echtzeit-Medienstream geöffnet wird, und verwendet anschließend den gespeicherten Begrüßungstext als anfängliche Echtzeitbegrüßung. Wenn `voice-call` nicht aktiviert ist, kann Google Meet den Einwahlplan weiterhin validieren und aufzeichnen, den Twilio-Anruf jedoch nicht tätigen.

Lassen Sie `voiceCall.gatewayUrl` nicht gesetzt, um die lokale vertrauenswürdige Gateway-Laufzeit zu verwenden, die den
aufrufenden Agenten während des gesamten Aufrufs beibehält. Eine konfigurierte Gateway-URL bleibt ein explizites WebSocket-Ziel und
kann die Herkunft des Plugins nicht authentifizieren; Beitritte von nicht standardmäßigen Agenten schlagen sicher fehl, statt stillschweigend
einen anderen Agenten zu verwenden. Führen Sie Google Meet und Voice Call im selben Gateway-Prozess aus, wenn agentenspezifisches
Routing erforderlich ist.

## Tool

Agenten verwenden das Tool `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

| `action`                | Zweck                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `join`                  | Einer expliziten Meet-URL beitreten                                                               |
| `create`                | Einen Raum erstellen (und standardmäßig beitreten); unterstützt `accessType`/`entryPointAccess` |
| `status`                | Aktive Sitzungen auflisten oder eine anhand von `sessionId` untersuchen                    |
| `setup_status`          | Dieselben Prüfungen wie `googlemeet setup` ausführen                                              |
| `resolve_space`         | Eine URL/einen Code/`spaces/{id}` über `spaces.get` auflösen                           |
| `preflight`             | Voraussetzungen für OAuth und die Besprechungsauflösung validieren                                |
| `latest`                | Den neuesten Konferenzdatensatz für eine Besprechung suchen                                       |
| `calendar_events`       | Vorschau von Kalenderereignissen mit Meet-Links anzeigen                                          |
| `artifacts`             | Konferenzdatensätze sowie Metadaten zu Teilnehmern/Aufzeichnungen/Transkripten/Smart Notes auflisten |
| `attendance`            | Teilnehmer und Teilnehmersitzungen auflisten                                                      |
| `export`                | Das Paket aus Artefakten/Anwesenheit/Transkript/Manifest schreiben; `"dryRun": true` nur für das Manifest setzen |
| `recover_current_tab`   | Einen vorhandenen Meet-Tab fokussieren/untersuchen, ohne einen neuen zu öffnen                     |
| `transcript`            | Das begrenzte Untertiteltranskript lesen; `sinceIndex` setzt ab dem vorherigen `nextIndex` fort |
| `leave`                 | Eine Sitzung beenden (Chrome klickt auf „Anruf verlassen“; schließt nur selbst geöffnete Tabs; Twilio legt auf) |
| `end_active_conference` | Die aktive Google-Meet-Konferenz für einen API-verwalteten Raum beenden                            |
| `speak`                 | Den Echtzeit-Agenten mit `sessionId` und `message` sofort sprechen lassen          |
| `test_speech`           | Eine Sitzung erstellen/wiederverwenden, eine bekannte Phrase auslösen und den Chrome-Zustand zurückgeben |
| `test_listen`           | Eine reine Beobachtungssitzung erstellen/wiederverwenden und auf Bewegung bei Untertiteln/Transkript warten |

`test_speech` erzwingt immer `mode: "agent"` oder `"bidi"` und schlägt fehl, wenn die Ausführung in `mode: "transcribe"` angefordert wird, da reine Beobachtungssitzungen keine Sprache ausgeben können. `speechOutputVerified` erfordert sowohl neue Echtzeitausgabebytes als auch neue, nicht stumme Audiodaten, die während dieser Ausgabe über den Mikrofonaufnahmepfad der Bridge zurückkehren. Ältere Ausgaben oder Loopback-Signale einer wiederverwendeten Sitzung zählen nicht, und das bloße Anwachsen der Sink-Bytes wird nicht mehr als verifizierte Sprachausgabe gemeldet.

Bei Chrome-Transporten hält `leave` einen wiederverwendeten, benutzereigenen Tab geöffnet, nachdem auf die Meet-Schaltfläche zum Verlassen des Anrufs geklickt wurde. Von OpenClaw geöffnete Tabs werden nach dem Verlassen geschlossen.

Verwenden Sie `transport: "chrome"`, wenn Chrome auf dem Gateway-Host ausgeführt wird, und `transport: "chrome-node"`, wenn es auf einem gekoppelten Node ausgeführt wird. In beiden Fällen werden die Modell-Provider und `openclaw_agent_consult` auf dem Gateway-Host ausgeführt, sodass die Modellanmeldedaten dort verbleiben. Protokolle im Agentenmodus enthalten beim Start der Bridge den aufgelösten Transkriptions-Provider und das Modell sowie nach jeder synthetisierten Antwort den TTS-Provider, das Modell, die Stimme, das Ausgabeformat und die Abtastrate. Das unverarbeitete `mode: "realtime"` wird weiterhin als veralteter Kompatibilitätsalias für `mode: "agent"` akzeptiert, aber nicht mehr im `mode`-Enum des Tools aufgeführt.

`create` mit einem API-gestützten Raum und einer expliziten Zugriffsrichtlinie:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

Die aktive Konferenz eines bekannten Raums beenden:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

Zuerst die Wiedergabe validieren, bevor behauptet wird, dass eine Besprechung nutzbar ist:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Bei Bedarf sprechen:

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Sagen Sie genau: Ich bin hier und höre zu."
}
```

`status` enthält den Chrome-Zustand, sofern verfügbar:

| Feld                                                                  | Bedeutung                                                                                                              |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `inCall`                                                              | Chrome scheint sich im Meet-Anruf zu befinden                                                                          |
| `micMuted`                                                            | Nach bestem Wissen ermittelter Zustand des Meet-Mikrofons                                                              |
| `manualActionRequired` / `manualActionReason` / `manualActionMessage` | Das Browserprofil erfordert eine manuelle Anmeldung, die Zulassung durch den Meet-Host, Berechtigungen oder eine Reparatur der Browsersteuerung, bevor Sprachausgabe funktionieren kann |
| `speechReady` / `speechBlockedReason` / `speechBlockedMessage`        | Ob verwaltete Chrome-Sprachausgabe derzeit zulässig ist; `speechReady: false` bedeutet, dass OpenClaw die Einleitungs-/Testphrase nicht gesendet hat |
| `providerConnected` / `realtimeReady`                                 | Zustand der Echtzeit-Sprach-Bridge                                                                                    |
| `lastInputAt` / `lastOutputAt`                                        | Zuletzt von der Bridge empfangene/an sie gesendete Audiodaten                                                         |
| `audioOutputRouted` / `audioOutputDeviceLabel`                        | Ob die Medienausgabe des Meet-Tabs aktiv an das BlackHole-Gerät der Bridge weitergeleitet wurde                        |
| `lastOutputLoopbackAt` / `outputLoopbackSignalBytes`                  | Neue Ausgabe, deren Wellenform-Fingerabdruck auf dem BlackHole-Mikrofonaufnahmepfad korreliert wurde                    |
| `lastOutputLoopbackCorrelation`                                       | Korrelationswert, der das aufgenommene Signal mit der aktuellen Generierung der Assistentenausgabe verknüpft           |
| `outputGeneration` / `verifiedOutputGeneration`                       | Monotone IDs; Gleichheit bedeutet, dass die aktuelle Ausgabe und nicht eine ältere Äußerung den Loopback-Nachweis bestanden hat |
| `lastOutputLoopbackRms` / `lastOutputLoopbackPeak`                    | Audioenergiediagnose für den zuletzt verifizierten Loopback-Aufnahmeblock                                               |
| `lastSuppressedInputAt` / `suppressedInputBytes`                      | Während der Wiedergabe durch den Assistenten ignorierte Loopback-Eingabe                                                |

## Agenten- und Bidi-Modi

| Modus   | Wer über die Antwort entscheidet | Pfad der Sprachausgabe                  | Verwenden, wenn                                        |
| ------- | --------------------------------- | --------------------------------------- | ------------------------------------------------------ |
| `agent` | Der konfigurierte OpenClaw-Agent | Normale OpenClaw-TTS-Laufzeit           | Sie das Verhalten „Mein Agent ist in der Besprechung“ wünschen |
| `bidi`  | Das Echtzeit-Sprachmodell         | Audioantwort des Echtzeit-Sprach-Providers | Sie eine Konversations-Sprachschleife mit geringstmöglicher Latenz wünschen |

`agent`-Modus: Der Echtzeit-Transkriptions-Provider empfängt die Besprechungs-Audiodaten, endgültige Teilnehmertranskripte werden durch den konfigurierten OpenClaw-Agenten geleitet und die Antwort wird über die reguläre OpenClaw-TTS ausgegeben. Zeitlich nahe Fragmente endgültiger Transkripte werden vor der Konsultation zusammengeführt, damit eine einzelne gesprochene Äußerung nicht mehrere veraltete Teilantworten erzeugt; Echtzeiteingaben werden unterdrückt, solange sich in der Warteschlange befindliche Assistentenaudiodaten noch wiedergegeben werden, und kürzlich erkannte, assistentenähnliche Transkriptechos werden vor der Konsultation ignoriert, damit der BlackHole-Loopback den Agenten nicht auf seine eigene Sprachausgabe antworten lässt.

`bidi`-Modus: Das Echtzeit-Sprachmodell antwortet direkt und kann `openclaw_agent_consult` für tiefergehende Schlussfolgerungen, aktuelle Informationen oder normale OpenClaw-Tools aufrufen. Das Konsultationstool führt im Hintergrund den regulären OpenClaw-Agenten mit dem Kontext des aktuellen Besprechungstranskripts aus und gibt eine knappe gesprochene Antwort zurück; im `agent`-Modus sendet OpenClaw diese Antwort direkt an TTS, im `bidi`-Modus kann das Echtzeit-Sprachmodell sie wiedergeben. Es verwendet dieselbe gemeinsame Konsultationslogik wie Voice Call.

Standardmäßig werden Konsultationen mit dem Agenten `main` ausgeführt; setzen Sie `realtime.agentId`, um eine Meet-Spur auf einen dedizierten Agenten-Arbeitsbereich, Modellstandards, eine Tool-Richtlinie, den Speicher und den Sitzungsverlauf zu verweisen. Konsultationen im Agentenmodus verwenden einen besprechungsspezifischen `agent:<id>:subagent:google-meet:<session>`-Sitzungsschlüssel, sodass Folgefragen den Besprechungskontext beibehalten und gleichzeitig die normale Agentenrichtlinie übernehmen. Wenn ein Agent `google_meet` im Agentenmodus aufruft, zweigt die Beratersitzung das aktuelle Transkript des Aufrufers ab, bevor sie auf Teilnehmeräußerungen antwortet; die Meet-Sitzung bleibt getrennt, sodass Folgefragen in der Besprechung das Transkript des Aufrufers nicht direkt verändern.

`realtime.toolPolicy` steuert den Konsultationslauf:

| Richtlinie       | Verhalten                                                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Das Konsultationstool bereitstellen; den regulären Agenten auf `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, `memory_get` beschränken |
| `owner`          | Das Konsultationstool bereitstellen; dem regulären Agenten die Verwendung seiner normalen Tool-Richtlinie erlauben                |
| `none`           | Das Konsultationstool dem Echtzeit-Sprachmodell nicht bereitstellen                                                              |

Der Konsultations-Sitzungsschlüssel ist auf die jeweilige Meet-Sitzung beschränkt, sodass nachfolgende Konsultationsaufrufe innerhalb derselben Besprechung den vorherigen Konsultationskontext wiederverwenden.

Eine gesprochene Bereitschaftsprüfung erzwingen, nachdem Chrome vollständig beigetreten ist:

```bash
openclaw googlemeet speak meet_... "Sagen Sie genau: Ich bin hier und höre zu."
```

Vollständiger Beitritts- und Sprachtest:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Sagen Sie genau: Ich bin hier und höre zu."
```

## Checkliste für Live-Tests

Bevor Sie eine Besprechung einem unbeaufsichtigten Agenten übergeben:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Sagen Sie genau: Google-Meet-Sprachtest abgeschlossen."
```

Erwarteter Chrome-Node-Zustand:

- `googlemeet setup` ist vollständig grün und umfasst `chrome-node-connected`, wenn Chrome-node der Standardtransport ist oder eine Node festgelegt wurde.
- `nodes status` zeigt die ausgewählte Node als verbunden an, wobei sowohl `googlemeet.chrome` als auch `browser.proxy` angekündigt werden.
- Der Meet-Tab tritt bei und `test-speech` gibt den Chrome-Integritätsstatus mit `inCall: true` zurück.

Für einen entfernten Chrome-Host wie eine Parallels-macOS-VM ist dies die kürzeste sichere Prüfung nach einer Aktualisierung des Gateways oder der VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Damit wird nachgewiesen, dass das Gateway-Plugin geladen ist, die VM-Node mit dem aktuellen Token verbunden ist und die Meet-Audiobrücke verfügbar ist, bevor ein Agent einen echten Meeting-Tab öffnet.

Verwenden Sie für einen Twilio-Smoke-Test ein Meeting, das Telefoneinwahldaten bereitstellt:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Erwarteter Twilio-Status:

- `googlemeet setup` umfasst grüne Prüfungen für `twilio-voice-call-plugin`, `twilio-voice-call-credentials` und `twilio-voice-call-webhook`.
- `voicecall` ist nach dem Neuladen des Gateways in der CLI verfügbar.
- Die zurückgegebene Sitzung enthält `transport: "twilio"` und eine `twilio.voiceCallId`.
- `openclaw logs --follow` zeigt, dass DTMF-TwiML vor Echtzeit-TwiML bereitgestellt wurde, gefolgt von einer Echtzeitbrücke mit eingereihter anfänglicher Begrüßung.
- `googlemeet leave <sessionId>` beendet den delegierten Sprachanruf.

## Fehlerbehebung

### Agent kann das Google-Meet-Tool nicht sehen

Vergewissern Sie sich, dass das Plugin aktiviert ist, und laden Sie das Gateway neu. Der laufende Agent sieht nur Plugin-Tools, die vom aktuellen Gateway-Prozess registriert wurden:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Auf Gateway-Hosts ohne macOS bleibt `google_meet` sichtbar, lokale Chrome-Rücksprechaktionen werden jedoch blockiert, bevor sie die Audiobrücke erreichen. Verwenden Sie statt des standardmäßigen lokalen Chrome-Agent-Pfads `mode: "transcribe"`, die Twilio-Einwahl oder einen macOS-Host mit `chrome-node`.

### Keine verbundene Google-Meet-fähige Node

Auf dem Node-Host:

```bash
openclaw plugins install npm:@openclaw/google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Auf dem Gateway-Host:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Die Node muss verbunden sein und `googlemeet.chrome` sowie `browser.proxy` aufführen. Die Gateway-Konfiguration muss beides zulassen:

```json5
{
  gateway: {
    nodes: {
      commands: { allow: ["browser.proxy", "googlemeet.chrome"] },
    },
  },
}
```

Wenn `googlemeet setup` bei `chrome-node-connected` fehlschlägt oder das Gateway-Protokoll `gateway token mismatch` meldet, installieren oder starten Sie die Node mit dem aktuellen Gateway-Token neu:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Laden Sie anschließend den Node-Dienst neu und führen Sie Folgendes erneut aus:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Browser wird geöffnet, aber Agent kann nicht beitreten

Führen Sie `googlemeet test-listen` für reine Beobachterbeitritte oder `googlemeet test-speech` für Echtzeitbeitritte aus und prüfen Sie anschließend den zurückgegebenen Chrome-Integritätsstatus. Wenn eines von beiden `manualActionRequired: true` meldet, zeigen Sie der bedienenden Person `manualActionMessage` an und versuchen Sie es nicht erneut, bis die Browseraktion abgeschlossen ist.

Häufige manuelle Aktionen: beim Chrome-Profil anmelden; den Gast über das Meet-Hostkonto zulassen; Chrome den Zugriff auf Mikrofon und Kamera gewähren, wenn die native Aufforderung erscheint; einen hängen gebliebenen Meet-Berechtigungsdialog schließen oder beheben.

Melden Sie nicht „nicht angemeldet“, nur weil Meet fragt „Sollen andere Sie in der Videokonferenz hören?“; dabei handelt es sich um den Meet-Zwischenschritt zur Audioauswahl. OpenClaw klickt, sofern verfügbar, per Browserautomatisierung auf **Mikrofon verwenden** und wartet weiter auf den tatsächlichen Meeting-Status. Beim Browser-Fallback ausschließlich zur Erstellung kann stattdessen auf **Ohne Mikrofon fortfahren** geklickt werden, da zum Erzeugen der URL kein Echtzeit-Audiopfad erforderlich ist.

### Meeting-Erstellung schlägt fehl

`googlemeet create` verwendet bei konfiguriertem OAuth die Meet-API `spaces.create`, andernfalls den Browser der festgelegten Chrome-Node. Prüfen Sie Folgendes:

- **API-Erstellung**: `oauth.clientId` und `oauth.refreshToken` (oder entsprechende `OPENCLAW_GOOGLE_MEET_*`-Umgebungsvariablen) sind vorhanden und das Aktualisierungstoken wurde nach dem Hinzufügen der Erstellungsunterstützung erzeugt. Älteren Tokens fehlt möglicherweise `meetings.space.created`; führen Sie daher `openclaw googlemeet auth login --json` erneut aus.
- **Browser-Fallback**: `defaultTransport: "chrome-node"` und `chromeNode.node` verweisen auf eine verbundene Node mit `browser.proxy` und `googlemeet.chrome`. Das OpenClaw-Chrome-Profil auf dieser Node ist angemeldet und kann `https://meet.google.com/new` öffnen.
- **Wiederholungsversuche beim Browser-Fallback**: Verwenden Sie einen vorhandenen `.../new`- oder Google-Konto-Aufforderungstab erneut, bevor Sie einen neuen öffnen. Wiederholen Sie den Tool-Aufruf, statt manuell einen weiteren Tab zu öffnen.
- **Manuelle Aktion**: Wenn das Tool `manualActionRequired: true` zurückgibt, verwenden Sie `browser.nodeId`, `browser.targetId`, `browserUrl` und `manualActionMessage`, um die bedienende Person anzuleiten. Wiederholen Sie den Vorgang nicht in einer Schleife.
- **Zwischenschritt zur Audioauswahl**: Wenn Meet „Sollen andere Sie in der Videokonferenz hören?“ anzeigt, lassen Sie den Tab geöffnet. OpenClaw sollte auf **Mikrofon verwenden** oder – nur bei der Erstellung – auf **Ohne Mikrofon fortfahren** klicken und weiter auf die erzeugte URL warten. Wenn dies nicht möglich ist, sollte der Fehler `meet-audio-choice-required` und nicht `google-login-required` erwähnen.

### Agent tritt bei, spricht aber nicht

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Verwenden Sie `mode: "agent"` für den Pfad STT -> OpenClaw-Agent -> TTS und `mode: "bidi"` für den direkten Echtzeit-Sprach-Fallback. `mode: "transcribe"` startet absichtlich keine Rücksprechbrücke. Führen Sie zur Fehlerbehebung im reinen Beobachtermodus `openclaw googlemeet status --json <session-id>` aus, nachdem Teilnehmende gesprochen haben, und prüfen Sie `captioning`, `transcriptLines` und `lastCaptionText`. Wenn `inCall` wahr ist, `transcriptLines` jedoch weiterhin `0` bleibt, sind die Meet-Untertitel möglicherweise deaktiviert, seit der Installation des Beobachters hat niemand gesprochen, die Meet-Oberfläche hat sich geändert oder Live-Untertitel sind für die Sprache oder das Konto des Meetings nicht verfügbar.

`googlemeet test-speech` prüft immer den Echtzeitpfad und meldet, ob bei diesem Aufruf Ausgabebytes der Brücke beobachtet wurden. Wenn `speechOutputVerified` falsch und `speechOutputTimedOut` wahr ist, hat der Echtzeit-Provider die Äußerung möglicherweise akzeptiert, OpenClaw hat jedoch nicht erkannt, dass neue Ausgabebytes die Chrome-Audiobrücke erreicht haben.

Prüfen Sie außerdem Folgendes: Auf dem Gateway-Host ist ein Schlüssel für einen Echtzeit-Provider (`OPENAI_API_KEY` oder `GEMINI_API_KEY`) verfügbar; `BlackHole 2ch` ist auf dem Chrome-Host sichtbar; `sox` ist dort vorhanden; Meet-Mikrofon und -Lautsprecher werden über den virtuellen Audiopfad geleitet (`doctor` sollte für lokale Chrome-Echtzeitbeitritte `meet output routed: yes` anzeigen).

`googlemeet doctor [session-id]` gibt Sitzung, Node, Anrufstatus, Grund für die manuelle Aktion, Verbindung zum Echtzeit-Provider, `realtimeReady`, Audioeingabe-/-ausgabeaktivität, letzte Audiozeitstempel, Bytezähler und Browser-URL aus. Verwenden Sie `googlemeet status [session-id] --json` für unformatiertes JSON und `googlemeet doctor --oauth` (ergänzen Sie `--meeting` oder `--create-space`), um die OAuth-Aktualisierung zu prüfen, ohne Tokens offenzulegen.

Wenn bei einem Agent ein Zeitlimit überschritten wurde und bereits ein Meet-Tab geöffnet ist, prüfen Sie ihn, ohne einen weiteren zu öffnen:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Die entsprechende Tool-Aktion ist `recover_current_tab`: Sie fokussiert und prüft einen vorhandenen Meet-Tab für den ausgewählten Transport – lokale Browsersteuerung für `chrome`, die konfigurierte Node für `chrome-node` –, ohne einen neuen Tab oder eine neue Sitzung zu öffnen, und meldet den aktuellen Blockierungsgrund (Anmeldung, Zulassung, Berechtigungen, Audioauswahlstatus). Der CLI-Befehl kommuniziert mit dem konfigurierten Gateway, das ausgeführt werden muss. `chrome-node` erfordert außerdem, dass die Node verbunden ist.

### Twilio-Einrichtungsprüfungen schlagen fehl

`twilio-voice-call-plugin` schlägt fehl, wenn `voice-call` nicht zulässig oder nicht aktiviert ist: Fügen Sie es zu `plugins.allow` hinzu, aktivieren Sie `plugins.entries.voice-call` und laden Sie das Gateway neu.

`twilio-voice-call-credentials` schlägt fehl, wenn beim Twilio-Backend Konto-SID, Authentifizierungstoken oder Anrufernummer fehlen:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` schlägt fehl, wenn `voice-call` nicht öffentlich für Webhooks erreichbar ist oder `publicUrl` auf einen Loopback- oder privaten Netzwerkbereich verweist. Verwenden Sie `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` oder `fd00::/8` nicht als `publicUrl`. Carrier-Rückrufe können diese Adressen nicht erreichen. Legen Sie `plugins.entries.voice-call.config.publicUrl` auf eine öffentliche URL fest oder konfigurieren Sie eine Tunnel-/Tailscale-Bereitstellung:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          fromNumber: "+15550001234",
          publicUrl: "https://voice.example.com/voice/webhook",
        },
      },
    },
  },
}
```

Verwenden Sie für die lokale Entwicklung statt einer privaten Host-URL einen Tunnel oder eine Tailscale-Bereitstellung:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // oder
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Starten oder laden Sie das Gateway neu und führen Sie anschließend Folgendes aus:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` prüft standardmäßig nur die Bereitschaft. Führen Sie einen Probelauf für eine bestimmte Nummer durch:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Fügen Sie `--yes` nur hinzu, wenn absichtlich ein echter ausgehender Anruf getätigt werden soll:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio-Anruf startet, tritt dem Meeting aber nie bei

Vergewissern Sie sich, dass das Meet-Ereignis Telefoneinwahldaten bereitstellt, und übergeben Sie die genaue Einwahlnummer sowie die PIN oder eine benutzerdefinierte DTMF-Sequenz:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Verwenden Sie führende `w` oder Kommas in `--dtmf-sequence` für eine Pause vor der PIN.

Wenn der Anruf erstellt wurde, die Meet-Teilnehmerliste den eingewählten Teilnehmenden jedoch nie anzeigt:

- `openclaw googlemeet doctor <session-id>`: Prüfen Sie die delegierte Twilio-Anruf-ID, ob DTMF eingereiht wurde und ob die einleitende Begrüßung angefordert wurde.
- `openclaw voicecall status --call-id <id>`: Prüfen Sie, ob der Anruf noch aktiv ist.
- `openclaw voicecall tail`: Prüfen Sie, ob Twilio-Webhooks beim Gateway eingehen.
- `openclaw logs --follow`: Suchen Sie nach der Twilio-Meet-Sequenz: Google Meet delegiert den Beitritt, Voice Call speichert Pre-Connect-DTMF-TwiML und stellt es bereit, Voice Call stellt Echtzeit-TwiML für den Twilio-Anruf bereit und anschließend fordert Google Meet mit `voicecall.speak` eine einleitende Sprachausgabe an.
- Führen Sie `openclaw googlemeet setup --transport twilio` erneut aus. Eine grüne Einrichtungsprüfung ist erforderlich, weist jedoch nicht nach, dass die Meeting-PIN-Sequenz korrekt ist.
- Vergewissern Sie sich, dass die Einwahlnummer zur gleichen Meet-Einladung und Region wie die PIN gehört.
- Erhöhen Sie `voiceCall.dtmfDelayMs` gegenüber dem Standardwert von 12 Sekunden, wenn Meet langsam antwortet oder das Anruftranskript nach dem Senden des Pre-Connect-DTMF weiterhin die PIN-Aufforderung anzeigt.
- Wenn der Teilnehmende beitritt, aber die Begrüßung nicht zu hören ist, prüfen Sie `openclaw logs --follow` auf die nach DTMF erfolgende `voicecall.speak`-Anforderung und entweder die TTS-Wiedergabe über den Medienstream oder den Twilio-`<Say>`-Fallback. Wenn das Transkript weiterhin „Meeting-PIN eingeben“ anzeigt, ist der Telefonzweig dem Meet-Raum noch nicht beigetreten, sodass Teilnehmende keine Sprachausgabe hören.

Wenn Webhooks nicht eintreffen, debuggen Sie zuerst das Voice-Call-Plugin: Der Provider muss `plugins.entries.voice-call.config.publicUrl` oder den konfigurierten Tunnel erreichen können. Siehe [Fehlerbehebung für Sprachanrufe](/de/plugins/voice-call#troubleshooting).

## Hinweise

Die offizielle Medien-API von Google Meet ist auf den Empfang ausgerichtet, daher ist zum Sprechen in einem Anruf weiterhin ein Teilnehmerpfad erforderlich. Dieses Plugin macht diese Abgrenzung deutlich: Chrome übernimmt die Browserteilnahme und das lokale Audio-Routing; Twilio übernimmt die Einwahl per Telefon.

Chrome-Talkback-Modi benötigen `BlackHole 2ch` sowie eine der folgenden Optionen:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw steuert die Bridge und leitet Audio in `chrome.audioFormat` zwischen diesen Befehlen und dem ausgewählten Provider weiter. Der Modus `agent` verwendet Echtzeittranskription plus reguläre TTS; der Modus `bidi` verwendet den Echtzeit-Sprach-Provider. Der Standardpfad ist 24 kHz PCM16 mit `chrome.audioBufferBytes: 4096`; 8 kHz G.711 mu-law bleibt für veraltete Befehlspaare verfügbar.
- `chrome.audioBridgeCommand`: Ein externer Bridge-Befehl steuert den gesamten lokalen Audiopfad und muss nach dem Starten oder Validieren seines Daemons beendet werden. Nur für `bidi` gültig, da der Modus `agent` direkten Zugriff auf das Befehlspaar für TTS benötigt.

Bei der Chrome-Bridge mit Befehlspaar kann `chrome.bargeInInputCommand` ein separates lokales Mikrofon überwachen und die Wiedergabe des Assistenten löschen, sobald eine Person zu sprechen beginnt. Dadurch hat menschliche Sprache Vorrang vor der Assistentenausgabe, selbst wenn der gemeinsam verwendete BlackHole-Loopback-Eingang während der Assistentenwiedergabe vorübergehend unterdrückt wird. Wie `chrome.audioInputCommand`/`chrome.audioOutputCommand` ist dies ein vom Betreiber konfigurierter lokaler Befehl: Verwenden Sie einen expliziten vertrauenswürdigen Befehlspfad oder eine Argumentliste und niemals ein Skript aus einem nicht vertrauenswürdigen Speicherort.

Für sauberes Duplex-Audio leiten Sie die Meet-Ausgabe und das Meet-Mikrofon über separate virtuelle Geräte oder einen virtuellen Gerätegraphen nach Art von Loopback; ein einzelnes gemeinsam verwendetes BlackHole-Gerät kann Audio anderer Teilnehmer zurück in den Anruf übertragen und so ein Echo verursachen.

`googlemeet speak` aktiviert die aktive Talkback-Audio-Bridge für eine Chrome-Sitzung; `googlemeet leave` stoppt sie (und legt bei über Voice Call delegierten Twilio-Sitzungen den zugrunde liegenden Anruf auf). Verwenden Sie `googlemeet end-active-conference`, um bei einem API-verwalteten Bereich auch die aktive Google-Meet-Konferenz zu schließen.

## Verwandte Themen

- [Übersicht über Meeting-Plugins](/de/plugins/meeting-plugins)
- [Voice-Call-Plugin](/de/plugins/voice-call)
- [Sprechmodus](/de/nodes/talk)
- [Plugins erstellen](/de/plugins/building-plugins)
