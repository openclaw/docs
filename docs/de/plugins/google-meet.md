---
read_when:
    - Sie möchten, dass ein OpenClaw-Agent an einem Google Meet-Anruf teilnimmt
    - Sie möchten, dass ein OpenClaw-Agent einen neuen Google-Meet-Anruf erstellt.
    - Sie konfigurieren Chrome, einen Chrome-Node oder Twilio als Transport für Google Meet
summary: 'Google-Meet-Plugin: Expliziten Meet-URLs über Chrome oder Twilio beitreten, standardmäßig mit Sprachantworten des Agenten'
title: Google-Meet-Plugin
x-i18n:
    generated_at: "2026-07-12T15:33:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5a3a0d2675bdfaeaa869652593fd1931c3afdefe0ed95f13935dade976ff038c
    source_path: plugins/google-meet.md
    workflow: 16
---

Das Plugin `google-meet` nimmt im Namen eines OpenClaw-Agenten über explizite Meet-URLs an Besprechungen teil. Sein Funktionsumfang ist bewusst eng begrenzt:

- Es nimmt nur über URLs der Form `https://meet.google.com/...` teil; es wählt sich niemals selbstständig über eine gefundene Telefonnummer in eine Besprechung ein.
- `googlemeet create` kann über die Google Meet API (oder einen Browser-Fallback) eine neue Meet-URL erzeugen und nimmt standardmäßig daran teil.
- Die Teilnahme über Chrome verwendet ein angemeldetes Chrome-Profil, optional auf einem gekoppelten Node. Die Teilnahme über Twilio wählt über das [Plugin für Sprachanrufe](/de/plugins/voice-call) eine Telefonnummer sowie PIN/DTMF; eine Meet-URL kann nicht direkt angewählt werden.
- `mode: "agent"` (Standard) transkribiert die Sprache der Teilnehmenden mit einem Echtzeit-Provider, leitet sie an den konfigurierten OpenClaw-Agenten weiter und gibt die Antwort mit der regulären OpenClaw-TTS aus. Mit `mode: "bidi"` kann ein Echtzeit-Sprachmodell direkt antworten. `mode: "transcribe"` nimmt nur beobachtend und ohne Sprachausgabe teil.
- Wenn das Plugin einem Anruf beitritt, erfolgt keine automatische Einwilligungsankündigung.
- Der CLI-Befehl lautet `googlemeet`; `meet` ist umfassenderen Telekonferenz-Workflows für Agenten vorbehalten.

## Schnellstart

Installieren Sie die lokalen Audioabhängigkeiten und legen Sie anschließend einen Schlüssel für einen Echtzeit-Provider fest. OpenAI ist der standardmäßige Transkriptions-Provider für den Modus `agent`; Google Gemini Live ist als Sprach-Provider für den Modus `bidi` verfügbar:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# nur erforderlich, wenn realtime.voiceProvider für den bidi-Modus auf "google" gesetzt ist
export GEMINI_API_KEY=...
```

`blackhole-2ch` installiert das virtuelle Audiogerät `BlackHole 2ch`, über das Chrome das Audio leitet. Das Homebrew-Installationsprogramm erfordert einen Neustart, bevor macOS das Gerät bereitstellt:

```bash
sudo reboot
```

Überprüfen Sie nach dem Neustart beide Komponenten:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Aktivieren Sie das Plugin:

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

Überprüfen Sie die Einrichtung und treten Sie anschließend bei:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Die Ausgabe von `setup` ist für Agenten lesbar und berücksichtigt Modus und Transport: Sie meldet das Chrome-Profil, die Node-Zuweisung und bei Echtzeitbeitritten über Chrome die BlackHole-/SoX-Audiobrücke sowie die Prüfung der verzögerten Einführung. Rein beobachtende Beitritte überspringen die Echtzeitvoraussetzungen:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Wenn die Delegierung an Twilio konfiguriert ist, meldet `setup` außerdem, ob `voice-call`, die Twilio-Anmeldedaten und die öffentliche Webhook-Bereitstellung einsatzbereit sind. Behandeln Sie jede Prüfung mit `ok: false` als Blocker für diesen Transport/Modus, bevor ein Agent beitritt. Verwenden Sie `--json` für eine maschinenlesbare Ausgabe und `--transport chrome|chrome-node|twilio`, um einen bestimmten Transport vorab zu prüfen:

```bash
openclaw googlemeet setup --transport twilio
```

Alternativ können Sie einen Agenten über das Tool `google_meet` beitreten lassen:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Auf Gateway-Hosts ohne macOS bleibt `google_meet` für Artefakt-, Kalender-, Einrichtungs-, Transkriptions-, Twilio- und `chrome-node`-Aktionen sichtbar. Die lokale Sprachausgabe über Chrome (`transport: "chrome"` mit `mode: "agent"` oder `"bidi"`) wird jedoch blockiert, bevor sie die Audiobrücke erreicht, da dieser Pfad derzeit von macOS und `BlackHole 2ch` abhängt. Verwenden Sie stattdessen `mode: "transcribe"`, die Einwahl über Twilio oder einen macOS-Host mit `chrome-node`.

### Besprechung erstellen

```bash
openclaw googlemeet create --transport chrome-node --mode agent
openclaw googlemeet create --no-join
```

`create` verfügt über zwei Pfade, die im Feld `source` des Ergebnisses angegeben werden:

- **`api`**: Wird verwendet, wenn OAuth-Anmeldedaten für Google Meet konfiguriert sind. Deterministisch; hängt nicht vom Zustand der Browseroberfläche ab.
- **`browser`**: Wird ohne OAuth-Anmeldedaten verwendet. OpenClaw öffnet `https://meet.google.com/new` auf dem zugewiesenen Chrome-Node und wartet darauf, dass Google zu einer echten URL mit Besprechungscode weiterleitet; das OpenClaw-Chrome-Profil auf diesem Node muss bereits bei Google angemeldet sein. Sowohl der Beitritt als auch die Erstellung verwenden einen vorhandenen Meet-Tab (oder einen laufenden `.../new`-Tab bzw. einen Tab mit einer Aufforderung für das Google-Konto), bevor ein neuer geöffnet wird; beim Tab-Abgleich werden unproblematische Abfragezeichenfolgen wie `authuser` ignoriert.

`create` nimmt standardmäßig teil und gibt `joined: true` sowie die Beitrittssitzung zurück. Übergeben Sie `--no-join` (CLI) oder `"join": false` (Tool), um nur die URL zu erzeugen.

Legen Sie für über die API erstellte Räume eine explizite Zugriffsrichtlinie fest, statt die Standardeinstellung des Google-Kontos zu übernehmen:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

| `--access-type` | Wer ohne Anklopfen beitreten kann                                           |
| --------------- | --------------------------------------------------------------------------- |
| `OPEN`          | Alle Personen mit der Meet-URL                                               |
| `TRUSTED`       | Vertrauenswürdige Benutzer der Hostorganisation, eingeladene externe Benutzer und Einwahlbenutzer |
| `RESTRICTED`    | Nur eingeladene Personen                                                     |

Dies gilt nur für über die API erstellte Räume, daher muss OAuth konfiguriert sein. Wenn Sie sich authentifiziert haben, bevor diese Option verfügbar war, führen Sie nach dem Hinzufügen des Bereichs `meetings.space.settings` zum OAuth-Einwilligungsbildschirm erneut `openclaw googlemeet auth login --json` aus.

Wenn der Browser-Fallback durch eine Google-Anmeldung oder eine Meet-Berechtigungsanforderung blockiert wird, gibt das Tool `manualActionRequired: true` mit `manualActionReason`, `manualActionMessage` und `browser.nodeId`/`browser.targetId`/`browserUrl` zurück. Melden Sie diese Nachricht und öffnen Sie keine weiteren Meet-Tabs, bis der Betreiber den Schritt im Browser abgeschlossen hat.

### Rein beobachtender Beitritt

Legen Sie `"mode": "transcribe"` fest, um die bidirektionale Echtzeitbrücke zu überspringen (keine BlackHole-/SoX-Anforderung, keine Sprachausgabe). Chrome-Beitritte im Transkriptionsmodus überspringen außerdem die Erteilung der Mikrofon-/Kameraberechtigung durch OpenClaw und den Meet-Pfad **Use microphone**; wenn Meet den Zwischenschritt zur Audioauswahl anzeigt, versucht die Automatisierung zuerst **Continue without microphone**. Verwaltete Chrome-Transporte installieren in diesem Modus einen nach bestem Bemühen arbeitenden Beobachter für Meet-Untertitel. `googlemeet status --json` und `googlemeet doctor` melden `captioning`, `captionsEnabledAttempted`, `transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText` und einen Auszug in `recentTranscript`.

Lesen Sie für das begrenzte Sitzungstranskript den exakt verfolgten Meet-Tab aus:

```bash
openclaw googlemeet transcript <session-id>
openclaw googlemeet transcript <session-id> --since <next-index> --json
```

Der Beobachter hält maximal 2,000 abgeschlossene Untertitelzeilen auf der Meet-Seite vor. Sichtbarer, fortschreitender Text verbleibt im Zustandsauszug, bis die Untertitelzeile abgeschlossen ist. Daher kann das Speichern von `nextIndex` eine spätere Texterweiterung nicht überspringen; beim Verlassen werden sichtbare Zeilen vor der Momentaufnahme abgeschlossen. `droppedLines` meldet Zeilen, die am Anfang verloren gingen, wenn die Obergrenze überschritten wurde. Die Transkripte der vier zuletzt beendeten Sitzungen bleiben lesbar, bis das Gateway neu gestartet wird. Ältere beendete Transkripte geben `evicted: true` zurück. Dies ist bewusst Laufzeitspeicher und kein dauerhafter Speicher für den Besprechungsverlauf: Ein Neustart des Gateways, das Schließen des Tabs vor einer Momentaufnahme oder das Überschreiten der dokumentierten Obergrenzen kann zum Verlust von Untertiteln führen.

Für eine Ja/Nein-Hörprüfung:

```bash
openclaw googlemeet test-listen <meet-url> --transport chrome-node
```

Der Befehl tritt im Transkriptionsmodus bei, wartet auf neue Untertitel- bzw. Transkriptbewegungen und gibt `listenVerified`, `listenTimedOut`, Felder für manuelle Aktionen und den aktuellen Zustand der Untertitel zurück.

### Zustand der Echtzeitsitzung

Während Sitzungen mit Sprachausgabe meldet der Status von `google_meet` den Zustand von Chrome und der Audiobrücke: `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, die Zeitstempel der letzten Ein- und Ausgabe, Bytezähler und den Schließzustand der Brücke. Verwaltete Chrome-Sitzungen geben die Einführungs-/Testphrase erst aus, nachdem der Zustand `inCall: true` meldet; andernfalls gilt `speechReady: false`, und der Sprechversuch wird blockiert, statt unbemerkt wirkungslos zu bleiben.

Lokale Chrome-Beitritte erfolgen über das angemeldete OpenClaw-Browserprofil und benötigen `BlackHole 2ch` für den Mikrofon-/Lautsprecherpfad. Ein einzelnes BlackHole-Gerät reicht für einen ersten Smoke-Test aus, kann jedoch ein Echo verursachen; verwenden Sie für sauberes Duplex-Audio separate virtuelle Geräte oder einen Loopback-ähnlichen Signalgraphen.

## Lokales Gateway + Parallels Chrome

Ein vollständiges Gateway oder ein Modell-API-Schlüssel ist innerhalb einer macOS-VM nicht erforderlich, wenn sie lediglich Chrome bereitstellen soll. Führen Sie das Gateway und den Agenten lokal aus; führen Sie einen Node-Host in der VM aus.

| Ausführungsort       | Komponenten                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| Gateway-Host         | OpenClaw Gateway, Agenten-Arbeitsbereich, Modell-/API-Schlüssel, Echtzeit-Provider, Konfiguration des Google-Meet-Plugins |
| Parallels-macOS-VM   | OpenClaw CLI/Node-Host, Chrome, SoX, BlackHole 2ch, ein bei Google angemeldetes Chrome-Profil        |
| In der VM nicht erforderlich | Gateway-Dienst, Agentenkonfiguration, Einrichtung des Modell-Providers                              |

Installieren Sie die VM-Abhängigkeiten, starten Sie neu und überprüfen Sie die Installation:

```bash
brew install blackhole-2ch sox
sudo reboot
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Aktivieren Sie das Plugin in der VM und starten Sie den Node-Host:

```bash
openclaw plugins enable google-meet
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Wenn `<gateway-host>` eine LAN-IP ohne TLS ist, stimmen Sie der Verwendung dieses vertrauenswürdigen privaten Netzwerks zu:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Verwenden Sie dasselbe Flag bei der Installation als LaunchAgent (es handelt sich um eine Prozessumgebungsvariable, die in der LaunchAgent-Umgebung gespeichert wird, wenn sie beim Installationsbefehl vorhanden ist, und nicht um eine Einstellung in `openclaw.json`):

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

Genehmigen Sie den Node auf dem Gateway-Host und bestätigen Sie anschließend, dass er sowohl `googlemeet.chrome` als auch die Browserfähigkeit/`browser.proxy` bereitstellt:

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
      allowCommands: ["googlemeet.chrome", "browser.proxy"],
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

Für einen Smoke-Test mit nur einem Befehl, der eine Sitzung erstellt oder wiederverwendet, eine bekannte Phrase ausgibt und den Sitzungszustand anzeigt:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Während eines Echtzeitbeitritts trägt die Browserautomatisierung den Gastnamen ein, klickt auf Join/Ask to join und akzeptiert die Meet-Aufforderung **Use microphone** bei der ersten Verwendung, wenn sie angezeigt wird (oder **Continue without microphone** bei einem rein beobachtenden Beitritt und einer ausschließlich browserbasierten Besprechungserstellung). Wenn das Profil abgemeldet ist, Meet auf die Zulassung durch den Host wartet, Chrome eine Mikrofon-/Kameraberechtigung benötigt oder Meet bei einer ungelösten Aufforderung hängen bleibt, meldet das Ergebnis `manualActionRequired: true` mit `manualActionReason` und `manualActionMessage`. Beenden Sie weitere Versuche, melden Sie diese Nachricht zusammen mit `browserUrl`/`browserTitle` und versuchen Sie es erst erneut, nachdem die manuelle Aktion abgeschlossen wurde.

Wenn `chromeNode.node` ausgelassen wird, nimmt OpenClaw nur dann eine automatische Auswahl vor, wenn genau ein verbundener Node sowohl `googlemeet.chrome` als auch die Browsersteuerung bereitstellt; legen Sie `chromeNode.node` fest (Node-ID, Anzeigename oder Remote-IP), wenn mehrere geeignete Nodes verbunden sind.

### Häufige Fehlerprüfungen

| Symptom                                                  | Behebung                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Configured Google Meet node ... is not usable: offline` | Der festgelegte Node ist bekannt, aber nicht verfügbar. Melden Sie den Einrichtungsblocker; weichen Sie nicht ohne Aufforderung stillschweigend auf einen anderen Transport aus.                                                                                                                                    |
| `No connected Google Meet-capable node`                  | Führen Sie `openclaw node run` in der VM aus, genehmigen Sie das Pairing und führen Sie dort `openclaw plugins enable google-meet` sowie `openclaw plugins enable browser` aus. Vergewissern Sie sich, dass `gateway.nodes.allowCommands` die Einträge `googlemeet.chrome` und `browser.proxy` enthält.                              |
| `BlackHole 2ch audio device not found`                   | Installieren Sie `blackhole-2ch` auf dem überprüften Host und starten Sie ihn neu.                                                                                                                                                                                                       |
| `BlackHole 2ch audio device not found on the node`       | Installieren Sie `blackhole-2ch` in der VM und starten Sie die VM neu.                                                                                                                                                                                                                |
| Chrome wird geöffnet, kann aber nicht beitreten                             | Melden Sie sich in der VM beim Browserprofil an oder lassen Sie `chrome.guestName` festgelegt. Der automatische Gastbeitritt verwendet die OpenClaw-Browserautomatisierung über den Browser-Proxy des Nodes; legen Sie `browser.defaultProfile` des Nodes (oder ein benanntes Profil mit bestehender Sitzung) auf das gewünschte Profil fest. |
| Doppelte Meet-Tabs                                      | Belassen Sie `chrome.reuseExistingTab: true`. OpenClaw aktiviert zunächst einen vorhandenen Tab für dieselbe URL, und beim Erstellen wird ein laufender `.../new`-Tab oder ein Tab mit einer Google-Kontoabfrage wiederverwendet, bevor ein weiterer geöffnet wird.                                                                      |
| Kein Audio                                                 | Leiten Sie Meet-Mikrofon und -Lautsprecher über den von OpenClaw verwendeten virtuellen Audiopfad; verwenden Sie separate virtuelle Geräte oder ein Loopback-artiges Routing für sauberes Duplex-Audio.                                                                                                              |

## Installationshinweise

Die Chrome-Standardeinstellung für Talkback verwendet zwei externe Werkzeuge, die OpenClaw weder bündelt noch weiterverteilt; installieren Sie sie über Homebrew als Host-Abhängigkeiten:

- `sox`: Befehlszeilen-Audiowerkzeug. Das Plugin führt für die standardmäßige 24-kHz-PCM16-Audiobrücke explizite CoreAudio-Gerätebefehle aus.
- `blackhole-2ch`: Virtueller macOS-Audiotreiber, der das Gerät `BlackHole 2ch` bereitstellt, über das Chrome/Meet geroutet werden.

SoX ist unter `LGPL-2.0-only AND GPL-2.0-only` lizenziert; BlackHole unter GPL-3.0. Wenn Sie ein Installationsprogramm oder eine Appliance erstellen, die BlackHole mit OpenClaw bündelt, prüfen Sie die Upstream-Lizenzierung von BlackHole oder erwerben Sie eine separate Lizenz von Existential Audio.

## Transporte

| Transport     | Verwenden, wenn                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `chrome`      | Chrome/Audio auf dem Gateway-Host ausgeführt werden                                                        |
| `chrome-node` | Chrome/Audio auf einem gekoppelten Node ausgeführt werden (beispielsweise in einer Parallels-macOS-VM)                        |
| `twilio`      | Telefonische Einwahl als Ausweichlösung über das Voice-Call-Plugin, wenn die Teilnahme über Chrome nicht verfügbar ist |

### Chrome

Öffnet die Meet-URL über die OpenClaw-Browsersteuerung und tritt mit dem angemeldeten OpenClaw-Browserprofil bei. Unter macOS prüft das Plugin vor dem Start, ob `BlackHole 2ch` vorhanden ist, und führt bei entsprechender Konfiguration einen Befehl zur Zustandsprüfung bzw. zum Starten der Audiobrücke aus, bevor Chrome geöffnet wird. Wählen Sie für lokales Chrome das Profil mit `browser.defaultProfile`; `chrome.browserProfile` wird stattdessen an `chrome-node`-Hosts übergeben.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Das Audio von Chrome-Mikrofon und -Lautsprecher wird über die lokale OpenClaw-Audiobrücke geleitet. Wenn `BlackHole 2ch` nicht installiert ist, schlägt der Beitritt mit einem Einrichtungsfehler fehl, statt ohne Audiopfad beizutreten.

### Twilio

Ein strikter Einwahlplan, der an das [Voice-Call-Plugin](/de/plugins/voice-call) delegiert wird. Meet-Seiten werden nicht nach Telefonnummern durchsucht; Google Meet muss für das Meeting eine Einwahlnummer und eine PIN bereitstellen.

Aktivieren Sie Voice Call auf dem Gateway-Host, nicht auf dem Chrome-Node:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // oder auf "twilio" setzen, wenn Twilio die Standardeinstellung sein soll
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
            instructions: "Tritt diesem Google Meet als OpenClaw-Agent bei. Fasse dich kurz.",
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

Starten oder laden Sie den Gateway nach dem Aktivieren von `voice-call` neu; Änderungen an der Plugin-Konfiguration werden erst nach dem Neuladen wirksam. Überprüfen Sie Folgendes:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Wenn die Twilio-Delegierung eingerichtet ist, enthält `googlemeet setup` die Prüfungen `twilio-voice-call-plugin`, `twilio-voice-call-credentials` und `twilio-voice-call-webhook`.

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

OAuth ist zum Erstellen eines Meet-Links optional, da `googlemeet create` auf Browserautomatisierung zurückgreifen kann. Konfigurieren Sie OAuth für die Erstellung über die offizielle API, die Auflösung von Räumen oder die Vorabprüfung der Meet Media API. Beitritte über Chrome/Chrome-Node sind niemals von OAuth abhängig; sie verwenden in jedem Fall ein angemeldetes Chrome-Profil, BlackHole/SoX und (bei `chrome-node`) einen verbundenen Node.

### Google-Anmeldedaten erstellen

In der Google Cloud Console:

<Steps>
<Step title="Projekt erstellen oder auswählen">
</Step>
<Step title="Google Meet REST API aktivieren">
</Step>
<Step title="OAuth consent screen konfigurieren">
Internal ist für eine Google-Workspace-Organisation am einfachsten. External eignet sich für persönliche/Testeinrichtungen; solange sich die Anwendung im Status Testing befindet, fügen Sie jedes Google-Konto, das sie autorisieren soll, als Testnutzer hinzu.
</Step>
<Step title="Angeforderte Bereiche hinzufügen">
- `https://www.googleapis.com/auth/meetings.space.created`
- `https://www.googleapis.com/auth/meetings.space.readonly`
- `https://www.googleapis.com/auth/meetings.space.settings`
- `https://www.googleapis.com/auth/meetings.conference.media.readonly`
- `https://www.googleapis.com/auth/calendar.events.readonly` (Kalendersuche)
- `https://www.googleapis.com/auth/drive.meet.readonly` (Export des Dokumentinhalts von Transkripten/intelligenten Notizen)

</Step>
<Step title="OAuth client ID erstellen">
Anwendungstyp **Web application**. Autorisierte Weiterleitungs-URI:

```text
http://localhost:8085/oauth2callback
```

</Step>
<Step title="Client-ID und Client-Geheimnis kopieren">
</Step>
</Steps>

`meetings.space.created` wird von `spaces.create` benötigt. `meetings.space.readonly` löst Meet-URLs/-Codes in Räume auf. Mit `meetings.space.settings` kann OpenClaw beim Erstellen eines Raums über die API `SpaceConfig`-Einstellungen wie `accessType` übergeben. `meetings.conference.media.readonly` ist für die Vorabprüfung der Meet Media API und Medienarbeit vorgesehen; Google kann für die tatsächliche Nutzung der Media API eine Registrierung für Developer Preview verlangen. `calendar.events.readonly` wird nur für die Kalendersuche mit `--today`/`--event` benötigt. `drive.meet.readonly` wird nur für den Export mit `--include-doc-bodies` benötigt. Wenn Sie ausschließlich browserbasierte Chrome-Beitritte benötigen, überspringen Sie OAuth vollständig.

### Aktualisierungstoken erzeugen

Konfigurieren Sie `oauth.clientId` und optional `oauth.clientSecret` (oder übergeben Sie sie als Umgebungsvariablen) und führen Sie anschließend Folgendes aus:

```bash
openclaw googlemeet auth login --json
```

Dadurch wird ein PKCE-Ablauf mit einem localhost-Callback unter `http://localhost:8085/oauth2callback` ausgeführt und ein `oauth`-Konfigurationsblock mit einem Aktualisierungstoken ausgegeben. Fügen Sie `--manual` für einen Kopieren-und-Einfügen-Ablauf hinzu, wenn der Browser den lokalen Callback nicht erreichen kann:

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

Bevorzugen Sie Umgebungsvariablen, wenn Sie das Aktualisierungstoken nicht in der Konfiguration speichern möchten; zuerst wird die Konfiguration ausgewertet, anschließend dient die Umgebung als Ausweichlösung. Wenn Sie sich authentifiziert haben, bevor die Unterstützung für Meeting-Erstellung, Kalendersuche oder den Export von Dokumentinhalten verfügbar war, führen Sie `openclaw googlemeet auth login --json` erneut aus, damit das Aktualisierungstoken die aktuellen Bereiche abdeckt.

### OAuth mit doctor überprüfen

```bash
openclaw googlemeet doctor --oauth --json
```

Damit wird überprüft, ob die OAuth-Konfiguration vorhanden ist und das Aktualisierungstoken ein Zugriffstoken erzeugen kann, ohne die Chrome-Laufzeit zu laden oder einen verbundenen Node zu benötigen. Der Bericht enthält ausschließlich Statusfelder (`ok`, `configured`, `tokenSource`, `expiresAt`, Prüfungsmeldungen) und gibt niemals das Zugriffstoken, Aktualisierungstoken oder Client-Geheimnis aus.

| Prüfung                | Bedeutung                                                                          |
| -------------------- | -------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` sowie `oauth.refreshToken` oder ein zwischengespeichertes Zugriffstoken sind vorhanden |
| `oauth-token`        | Das zwischengespeicherte Zugriffstoken ist weiterhin gültig oder das Aktualisierungstoken hat ein neues erzeugt    |
| `meet-spaces-get`    | Die optionale Prüfung `--meeting` hat einen vorhandenen Meet-Raum aufgelöst                       |
| `meet-spaces-create` | Die optionale Prüfung `--create-space` hat einen neuen Meet-Raum erstellt                         |

Weisen Sie die Aktivierung der Meet API und den Geltungsbereich `spaces.create` mit der zustandsverändernden Erstellungsprüfung nach:

```bash
openclaw googlemeet doctor --oauth --create-space --json
```

Weisen Sie den Lesezugriff auf einen vorhandenen Bereich nach:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Ein `403` bei diesen Prüfungen bedeutet normalerweise, dass die Meet REST API deaktiviert ist, dem Aktualisierungstoken der erforderliche Geltungsbereich fehlt oder das Google-Konto nicht auf diesen Bereich zugreifen kann. Bei einem Aktualisierungstokenfehler müssen Sie `openclaw googlemeet auth login --json` erneut ausführen und den neuen `oauth`-Block speichern.

Für den Browser-Fallback ist kein OAuth erforderlich. Die Google-Authentifizierung erfolgt dort über das angemeldete Chrome-Profil auf dem ausgewählten Node und nicht über die OpenClaw-Konfiguration.

Diese Umgebungsvariablen werden als Fallbacks akzeptiert:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` oder `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` oder `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` oder `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` oder `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` oder `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` oder `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` oder `GOOGLE_MEET_PREVIEW_ACK`

### Auflösen, Vorabprüfung und Artefakte lesen

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

Mit `--meeting` verwenden `artifacts` und `attendance` standardmäßig den neuesten Konferenzdatensatz. Übergeben Sie `--all-conference-records`, um alle aufbewahrten Datensätze zu verwenden.

Die Kalendersuche ermittelt die Besprechungs-URL aus Google Calendar, bevor Artefakte gelesen werden. Dafür ist ein Aktualisierungstoken erforderlich, das den Nur-Lese-Geltungsbereich für Kalenderereignisse enthält:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Wöchentliche Synchronisierung"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` durchsucht den heutigen `primary`-Kalender nach einem Ereignis mit einem Meet-Link. `--event <query>` durchsucht übereinstimmenden Ereignistext. `--calendar <id>` adressiert einen nicht primären Kalender. `calendar-events` zeigt eine Vorschau der übereinstimmenden Ereignisse an und kennzeichnet, welches davon `latest`/`artifacts`/`attendance`/`export` auswählt.

Wenn Sie die ID des Konferenzdatensatzes bereits kennen, können Sie ihn direkt adressieren:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Schließen Sie den Raum für einen über die API erstellten Bereich:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Ruft `spaces.endActiveConference` auf und erfordert OAuth mit dem Geltungsbereich `meetings.space.created` für einen Bereich, den das autorisierte Konto verwalten kann. Akzeptiert eine Meet-URL, einen Besprechungscode oder `spaces/{id}` und löst die Angabe zunächst in die API-Bereichsressource auf. Dies ist von `googlemeet leave` getrennt: `leave` beendet die lokale bzw. sitzungsbezogene Teilnahme von OpenClaw. `end-active-conference` fordert Google Meet auf, die aktive Konferenz für den Bereich zu beenden.

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

`artifacts` gibt Metadaten zum Konferenzdatensatz sowie Ressourcenmetadaten zu Teilnehmern, Aufzeichnungen, Transkripten, strukturierten Transkripteinträgen und intelligenten Notizen zurück, sofern Google diese bereitstellt. `--no-transcript-entries` überspringt bei großen Besprechungen die Suche nach Einträgen. `attendance` erweitert Teilnehmer zu Zeilen für Teilnehmersitzungen, die den Zeitpunkt der ersten und letzten Anwesenheit, die gesamte Sitzungsdauer, Kennzeichnungen für verspätetes Erscheinen bzw. vorzeitiges Verlassen sowie doppelte Teilnehmerressourcen enthalten, die nach angemeldetem Benutzer oder Anzeigenamen zusammengeführt wurden. `--no-merge-duplicates` hält unverarbeitete Ressourcen getrennt. `--late-after-minutes`/`--early-before-minutes` passen die Schwellenwerte an.

`export` schreibt einen Ordner mit `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` und `manifest.json`. `manifest.json` zeichnet die ausgewählte Eingabe, Exportoptionen, Konferenzdatensätze, Ausgabedateien, Anzahlen, Tokenquelle, alle verwendeten Kalenderereignisse und Warnungen zu unvollständigen Abrufen auf. `--zip` schreibt zusätzlich ein portables Archiv neben den Ordner. `--include-doc-bodies` exportiert den Text verknüpfter Google Docs mit Transkripten bzw. intelligenten Notizen über Drive `files.export`. Dafür ist der Nur-Lese-Geltungsbereich für Drive Meet erforderlich. Ohne diese Option enthalten Exporte nur Meet-Metadaten und strukturierte Transkripteinträge. Bei einem teilweisen Artefaktfehler – beim Auflisten intelligenter Notizen, bei einem Transkripteintrag oder beim Dokumentinhalt – bleibt die Warnung in der Zusammenfassung bzw. im Manifest erhalten, statt den gesamten Export fehlschlagen zu lassen. `--dry-run` ruft dieselben Daten ab und gibt das Manifest-JSON aus, ohne den Ordner oder die ZIP-Datei zu erstellen.

Agenten verwenden dieselben Aktionen über das Tool `google_meet` (`export`, `create` mit `accessType`, `end_active_conference`, `test_listen`); siehe [Tool](#tool).

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
| `OPENCLAW_LIVE_TEST=1`                                                                                                    | Aktiviert abgesicherte Live-Tests                                      |
| `OPENCLAW_GOOGLE_MEET_LIVE_MEETING`                                                                                       | Aufbewahrte Meet-URL, Code oder `spaces/{id}`                           |
| `OPENCLAW_GOOGLE_MEET_CLIENT_ID` / `GOOGLE_MEET_CLIENT_ID`                                                                | OAuth-Client-ID                                                        |
| `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` / `GOOGLE_MEET_REFRESH_TOKEN`                                                        | Aktualisierungstoken                                                    |
| `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` | Optional; dieselben Fallback-Namen ohne das Präfix `OPENCLAW_` funktionieren ebenfalls |

Der grundlegende Smoke-Test für Artefakte und Anwesenheit benötigt `meetings.space.readonly` und `meetings.conference.media.readonly`. Die Kalendersuche benötigt `calendar.events.readonly`. Der Export von Dokumentinhalten aus Drive benötigt `drive.meet.readonly`.

### Erstellungsbeispiele

```bash
openclaw googlemeet create
```

Gibt die neue Besprechungs-URI, die Quelle und die Beitrittssitzung aus. Mit OAuth wird die Meet API verwendet, ohne OAuth das angemeldete Profil des angehefteten Chrome-Node. JSON des Browser-Fallbacks:

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
  "error": "google-login-required: Melden Sie sich im OpenClaw-Browserprofil bei Google an und versuchen Sie anschließend erneut, die Besprechung zu erstellen.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Melden Sie sich im OpenClaw-Browserprofil bei Google an und versuchen Sie anschließend erneut, die Besprechung zu erstellen.",
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

Bei der Erstellung wird standardmäßig beigetreten. Chrome bzw. Chrome-Node benötigt jedoch weiterhin ein angemeldetes Google-Profil, um über den Browser beizutreten. Wenn das Profil abgemeldet ist, meldet OpenClaw `manualActionRequired: true` oder einen Browser-Fallback-Fehler und fordert den Betreiber auf, die Google-Anmeldung abzuschließen, bevor er es erneut versucht.

Legen Sie `preview.enrollmentAcknowledged: true` erst fest, nachdem Sie bestätigt haben, dass Ihr Cloud-Projekt, der OAuth-Prinzipal und die Besprechungsteilnehmer für das Google Workspace Developer Preview Program für Meet-Medien-APIs registriert sind.

## Konfiguration

Der übliche Chrome-Agentenpfad benötigt lediglich das aktivierte Plugin, BlackHole, SoX, einen Schlüssel für einen Echtzeit-Provider und einen konfigurierten OpenClaw-TTS-Provider:

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

| Schlüssel                          | Standardwert                             | Hinweise                                                                                                                                                                                                                       |
| --------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `defaultTransport`                | `"chrome"`                               |                                                                                                                                                                                                                                |
| `defaultMode`                     | `"agent"`                                | `"realtime"` wird als veralteter Alias für `"agent"` akzeptiert; neue Aufrufer sollten `"agent"` verwenden                                                                                                                     |
| `chromeNode.node`                 | nicht festgelegt                         | Node-ID/-Name/-IP für `chrome-node`; erforderlich, wenn mehr als ein geeigneter Node verbunden sein kann                                                                                                                       |
| `chrome.launch`                   | `true`                                   | Startet Chrome für den Beitritt; nur auf `false` setzen, wenn eine bereits geöffnete Sitzung wiederverwendet wird                                                                                                              |
| `chrome.audioBackend`             | `"blackhole-2ch"`                        |                                                                                                                                                                                                                                |
| `chrome.guestName`                | `"OpenClaw Agent"`                       | Wird auf dem Meet-Gastbildschirm im abgemeldeten Zustand angezeigt                                                                                                                                                             |
| `chrome.autoJoin`                 | `true`                                   | Bestmögliches Ausfüllen des Gastnamens und Klicken auf Join Now auf `chrome-node`                                                                                                                                              |
| `chrome.reuseExistingTab`         | `true`                                   | Aktiviert einen vorhandenen Meet-Tab, statt Duplikate zu öffnen                                                                                                                                                                |
| `chrome.waitForInCallMs`          | `20000`                                  | Wartet, bis der Meet-Tab meldet, dass der Anruf läuft, bevor die Talkback-Begrüßung ausgelöst wird                                                                                                                             |
| `chrome.audioFormat`              | `"pcm16-24khz"`                          | Audioformat des Befehlspaars; `"g711-ulaw-8khz"` ist nur für veraltete/benutzerdefinierte Befehlspaare vorgesehen, die Telefonie-Audio ausgeben                                                                                |
| `chrome.audioBufferBytes`         | `4096`                                   | SoX-Verarbeitungspuffer für generierte Audiobefehle des Befehlspaars (die Hälfte des SoX-Standardpuffers von 8192 Byte, wodurch die Pipe-Latenz sinkt); Werte werden auf mindestens 17 Byte begrenzt                              |
| `chrome.audioInputCommand`        | generierter SoX-Befehl                   | Liest von CoreAudio `BlackHole 2ch` und schreibt Audio im Format `chrome.audioFormat`                                                                                                                                           |
| `chrome.audioOutputCommand`       | generierter SoX-Befehl                   | Liest Audio im Format `chrome.audioFormat` und schreibt nach CoreAudio `BlackHole 2ch`                                                                                                                                          |
| `chrome.bargeInInputCommand`      | nicht festgelegt                         | Optionaler lokaler Mikrofonbefehl, der vorzeichenbehaftetes 16-Bit-Little-Endian-Mono-PCM zur Erkennung menschlicher Unterbrechungen während der Assistentenwiedergabe schreibt; gilt für die vom Gateway gehostete Befehlspaar-Bridge |
| `chrome.bargeInRmsThreshold`      | `650`                                    | RMS-Pegel, der als menschliche Unterbrechung gewertet wird                                                                                                                                                                     |
| `chrome.bargeInPeakThreshold`     | `2500`                                   | Spitzenpegel, der als menschliche Unterbrechung gewertet wird                                                                                                                                                                  |
| `chrome.bargeInCooldownMs`        | `900`                                    | Mindestverzögerung zwischen wiederholtem Aufheben von Unterbrechungen                                                                                                                                                           |
| `mode` (pro Anfrage)              | `"agent"`                                | Talkback-Modus; siehe Tabelle [Agent- und Bidi-Modi](#agent-and-bidi-modes)                                                                                                                                                     |
| `realtime.provider`               | `"openai"`                               | Kompatibilitäts-Fallback, der verwendet wird, wenn die nachfolgenden bereichsspezifischen Felder nicht festgelegt sind                                                                                                         |
| `realtime.transcriptionProvider`  | `"openai"`                               | Provider-ID, die der Modus `agent` für die Echtzeittranskription verwendet                                                                                                                                                      |
| `realtime.voiceProvider`          | nicht festgelegt                         | Provider-ID, die der Modus `bidi` für direkte Echtzeit-Sprachausgabe verwendet; für Gemini Live auf `"google"` setzen, während die Transkription im Agent-Modus bei OpenAI verbleibt. Mit `realtime.model` kombinieren, um das konkrete Gemini-Live-Modell auszuwählen. |
| `realtime.toolPolicy`             | `"safe-read-only"`                       | Siehe [Agent- und Bidi-Modi](#agent-and-bidi-modes)                                                                                                                                                                            |
| `realtime.instructions`           | kurze Anweisungen für gesprochene Antworten | Weist das Modell an, kurz zu sprechen und für ausführlichere Antworten `openclaw_agent_consult` zu verwenden                                                                                                                   |
| `realtime.introMessage`           | `"Say exactly: I'm here and listening."` | Wird einmal gesprochen, wenn die Echtzeit-Bridge verbunden wird; auf `""` setzen, um lautlos beizutreten                                                                                                                       |
| `realtime.agentId`                | `"main"`                                 | Für `openclaw_agent_consult` verwendete OpenClaw-Agent-ID                                                                                                                                                                      |
| `voiceCall.enabled`               | `true`                                   | Delegiert den Twilio-PSTN-Anruf, DTMF und die Begrüßung an das Voice-Call-Plugin                                                                                                                                                |
| `voiceCall.dtmfDelayMs`           | `12000`                                  | Anfängliche Wartezeit vor der Wiedergabe einer aus einer PIN abgeleiteten DTMF-Sequenz über Twilio                                                                                                                             |
| `voiceCall.postDtmfSpeechDelayMs` | `5000`                                   | Verzögerung vor dem Anfordern der Echtzeit-Begrüßung, nachdem Voice Call den Twilio-Verbindungsabschnitt gestartet hat                                                                                                         |

Mit `chrome.audioBridgeCommand` und `chrome.audioBridgeHealthCommand` kann eine externe Bridge den gesamten lokalen Audiopfad anstelle von `chrome.audioInputCommand`/`chrome.audioOutputCommand` übernehmen; die Einschränkung, welcher Modus sie verwenden kann, finden Sie unter [Hinweise](#notes).

Für die veraltete Struktur `realtime.provider: "google"` ist eine `openclaw doctor --fix`-Migration vorhanden: Sie verschiebt diese Absicht nach `realtime.voiceProvider: "google"` sowie `realtime.transcriptionProvider: "openai"`, sofern diese Felder noch nicht festgelegt sind.

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
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        speakerVoice: "Kore",
      },
    },
  },
}
```

ElevenLabs sowohl für das Zuhören als auch für das Sprechen im Agent-Modus:

```json5
{
  messages: {
    tts: {
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          modelId: "eleven_v3",
          speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
        },
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

Die dauerhafte Meet-Stimme stammt aus `messages.tts.providers.elevenlabs.speakerVoiceId`. Agent-Antworten können außerdem antwortspezifische `[[tts:speakerVoiceId=... model=eleven_v3]]`-Direktiven verwenden, wenn Überschreibungen des TTS-Modells aktiviert sind; für Besprechungen ist jedoch die Konfiguration der deterministische Standard. Beim Beitritt zeigen die Protokolle `transcriptionProvider=elevenlabs`, und jede gesprochene Antwort protokolliert `provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>`.

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

Bei `voiceCall.enabled: true` (dem Standardwert) und Twilio-Transport platziert Voice Call die DTMF-Sequenz, bevor der Echtzeit-Medienstream geöffnet wird, und verwendet anschließend den gespeicherten Begrüßungstext als erste Echtzeit-Begrüßung. Wenn `voice-call` nicht aktiviert ist, kann Google Meet den Einwahlplan weiterhin validieren und aufzeichnen, aber den Twilio-Anruf nicht tätigen.

Lassen Sie `voiceCall.gatewayUrl` ungesetzt, um die lokale vertrauenswürdige Gateway-Laufzeit zu verwenden, die den
aufrufenden Agenten für den gesamten Anruf beibehält. Eine konfigurierte Gateway-URL bleibt ein explizites WebSocket-Ziel und
kann die Plugin-Herkunft nicht authentifizieren; Beitritte von nicht standardmäßigen Agenten schlagen sicher fehl, statt stillschweigend
einen anderen Agenten zu verwenden. Führen Sie Google Meet und Voice Call im selben Gateway-Prozess aus, wenn ein Routing
pro Agent erforderlich ist.

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

| `action`                | Zweck                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `join`                  | Einer expliziten Meet-URL beitreten                                                                                |
| `create`                | Einen Raum erstellen (und standardmäßig beitreten); unterstützt `accessType`/`entryPointAccess`                   |
| `status`                | Aktive Sitzungen auflisten oder eine anhand der `sessionId` prüfen                                                 |
| `setup_status`          | Dieselben Prüfungen wie `googlemeet setup` ausführen                                                               |
| `resolve_space`         | Eine URL/einen Code/`spaces/{id}` über `spaces.get` auflösen                                                       |
| `preflight`             | Voraussetzungen für OAuth und die Besprechungsauflösung überprüfen                                                 |
| `latest`                | Den neuesten Konferenzdatensatz für eine Besprechung finden                                                        |
| `calendar_events`       | Vorschau von Kalenderereignissen mit Meet-Links anzeigen                                                           |
| `artifacts`             | Konferenzdatensätze und Metadaten zu Teilnehmern/Aufzeichnungen/Transkripten/intelligenten Notizen auflisten       |
| `attendance`            | Teilnehmer und Teilnehmersitzungen auflisten                                                                       |
| `export`                | Paket aus Artefakten/Anwesenheit/Transkript/Manifest schreiben; für ausschließlich das Manifest `"dryRun": true` setzen |
| `recover_current_tab`   | Einen vorhandenen Meet-Tab fokussieren/prüfen, ohne einen neuen zu öffnen                                          |
| `transcript`            | Das begrenzte Untertiteltranskript lesen; `sinceIndex` setzt am vorherigen `nextIndex` fort                         |
| `leave`                 | Eine Sitzung beenden (Chrome klickt auf Leave; schließt nur selbst geöffnete Tabs; Twilio legt auf)                |
| `end_active_conference` | Die aktive Google-Meet-Konferenz für einen API-verwalteten Raum beenden                                             |
| `speak`                 | Den Echtzeit-Agenten anhand von `sessionId` und `message` sofort sprechen lassen                                   |
| `test_speech`           | Eine Sitzung erstellen/wiederverwenden, einen bekannten Satz auslösen und den Chrome-Status zurückgeben            |
| `test_listen`           | Eine reine Beobachtungssitzung erstellen/wiederverwenden und auf Bewegung bei Untertiteln/Transkript warten        |

`test_speech` erzwingt immer `mode: "agent"` oder `"bidi"` und schlägt fehl, wenn die Ausführung mit `mode: "transcribe"` angefordert wird, da reine Beobachtungssitzungen keine Sprache ausgeben können. Das Ergebnis `speechOutputVerified` basiert darauf, dass die Anzahl der Echtzeit-Audioausgabebytes während dieses Aufrufs zunimmt; eine wiederverwendete Sitzung mit älteren Audiodaten gilt daher nicht als neue Prüfung.

Bei Chrome-Transporten lässt `leave` einen wiederverwendeten, benutzereigenen Tab geöffnet, nachdem auf die Meet-Schaltfläche Leave call geklickt wurde. Von OpenClaw geöffnete Tabs werden nach dem Verlassen geschlossen.

Verwenden Sie `transport: "chrome"`, wenn Chrome auf dem Gateway-Host ausgeführt wird, und `transport: "chrome-node"`, wenn es auf einem gekoppelten Node ausgeführt wird. In beiden Fällen werden die Modell-Provider und `openclaw_agent_consult` auf dem Gateway-Host ausgeführt, sodass die Modell-Anmeldedaten dort verbleiben. Protokolle im Agentenmodus enthalten beim Start der Bridge den aufgelösten Transkriptions-Provider und das Modell sowie nach jeder synthetisierten Antwort den TTS-Provider, das Modell, die Stimme, das Ausgabeformat und die Abtastrate. Das unverarbeitete `mode: "realtime"` wird weiterhin als veralteter Kompatibilitätsalias für `mode: "agent"` akzeptiert, aber nicht mehr im `mode`-Enum des Tools aufgeführt.

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

Zuerst das Zuhören validieren, bevor Sie behaupten, dass eine Besprechung verwendbar ist:

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
  "message": "Sage genau: Ich bin hier und höre zu."
}
```

`status` enthält den Chrome-Status, sofern verfügbar:

| Feld                                                                  | Bedeutung                                                                                                                        |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `inCall`                                                              | Chrome scheint sich im Meet-Anruf zu befinden                                                                                     |
| `micMuted`                                                            | Nach bestem Bemühen ermittelter Zustand des Meet-Mikrofons                                                                         |
| `manualActionRequired` / `manualActionReason` / `manualActionMessage` | Das Browserprofil benötigt eine manuelle Anmeldung, Zulassung durch den Meet-Host, Berechtigungen oder eine Reparatur der Browsersteuerung, bevor die Sprachausgabe funktionieren kann |
| `speechReady` / `speechBlockedReason` / `speechBlockedMessage`        | Ob die verwaltete Chrome-Sprachausgabe jetzt zulässig ist; `speechReady: false` bedeutet, dass OpenClaw den Einleitungs-/Testsatz nicht gesendet hat |
| `providerConnected` / `realtimeReady`                                 | Zustand der Echtzeit-Sprach-Bridge                                                                                                |
| `lastInputAt` / `lastOutputAt`                                        | Letzte von der Bridge empfangene/an sie gesendete Audiodaten                                                                       |
| `audioOutputRouted` / `audioOutputDeviceLabel`                        | Ob die Medienausgabe des Meet-Tabs aktiv an das BlackHole-Gerät der Bridge weitergeleitet wurde                                    |
| `lastSuppressedInputAt` / `suppressedInputBytes`                      | Ignorierte Loopback-Eingabe, während die Assistentenwiedergabe aktiv ist                                                           |

## Agenten- und Bidi-Modi

| Modus   | Wer die Antwort bestimmt         | Pfad der Sprachausgabe                    | Verwenden, wenn                                                    |
| ------- | -------------------------------- | ----------------------------------------- | ------------------------------------------------------------------ |
| `agent` | Der konfigurierte OpenClaw-Agent | Normale OpenClaw-TTS-Laufzeit             | Sie das Verhalten „Mein Agent ist in der Besprechung“ wünschen     |
| `bidi`  | Das Echtzeit-Sprachmodell        | Audioantwort des Echtzeit-Sprach-Providers | Sie eine Sprachkonversation mit möglichst geringer Latenz wünschen |

`agent`-Modus: Der Echtzeit-Transkriptions-Provider hört die Besprechungs-Audiodaten, endgültige Teilnehmertranskripte werden durch den konfigurierten OpenClaw-Agenten geleitet und die Antwort wird über die reguläre OpenClaw-TTS ausgegeben. Zeitlich nahe Fragmente endgültiger Transkripte werden vor der Konsultation zusammengeführt, damit ein gesprochener Beitrag nicht mehrere veraltete Teilantworten erzeugt; die Echtzeiteingabe wird unterdrückt, solange sich in der Warteschlange befindliche Assistentenaudiodaten noch wiedergegeben werden, und kürzlich aufgetretene assistentenähnliche Transkriptechos werden vor der Konsultation ignoriert, damit der BlackHole-Loopback den Agenten nicht auf seine eigene Sprachausgabe antworten lässt.

`bidi`-Modus: Das Echtzeit-Sprachmodell antwortet direkt und kann `openclaw_agent_consult` für tiefergehende Überlegungen, aktuelle Informationen oder normale OpenClaw-Tools aufrufen. Das Konsultationstool führt im Hintergrund den regulären OpenClaw-Agenten mit dem aktuellen Kontext des Besprechungstranskripts aus und gibt eine prägnante gesprochene Antwort zurück; im `agent`-Modus sendet OpenClaw diese Antwort direkt an TTS, im `bidi`-Modus kann das Echtzeit-Sprachmodell sie wiedergeben. Es verwendet dieselbe gemeinsame Konsultationsmechanik wie Voice Call.

Standardmäßig werden Konsultationen mit dem Agenten `main` ausgeführt; legen Sie `realtime.agentId` fest, um einen Meet-Kanal auf einen dedizierten Agenten-Arbeitsbereich, Modellstandards, eine Tool-Richtlinie, einen Speicher und einen Sitzungsverlauf zu verweisen. Konsultationen im Agentenmodus verwenden einen sitzungsbezogenen Schlüssel `agent:<id>:subagent:google-meet:<session>`, sodass Folgefragen den Besprechungskontext beibehalten und gleichzeitig die normale Agentenrichtlinie übernehmen. Wenn ein Agent `google_meet` im Agentenmodus aufruft, verzweigt die Konsultationssitzung vor der Antwort auf Teilnehmeräußerungen vom aktuellen Transkript des Aufrufers; die Meet-Sitzung bleibt getrennt, sodass Folgefragen in der Besprechung das Transkript des Aufrufers nicht direkt verändern.

`realtime.toolPolicy` steuert den Konsultationslauf:

| Richtlinie       | Verhalten                                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Das Konsultationstool bereitstellen; den regulären Agenten auf `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, `memory_get` beschränken |
| `owner`          | Das Konsultationstool bereitstellen; dem regulären Agenten die Verwendung seiner normalen Tool-Richtlinie erlauben                    |
| `none`           | Dem Echtzeit-Sprachmodell das Konsultationstool nicht bereitstellen                                                                   |

Der Schlüssel der Konsultationssitzung ist auf die jeweilige Meet-Sitzung beschränkt, sodass nachfolgende Konsultationsaufrufe während derselben Besprechung den vorherigen Konsultationskontext wiederverwenden.

Erzwingen Sie eine gesprochene Bereitschaftsprüfung, nachdem Chrome vollständig beigetreten ist:

```bash
openclaw googlemeet speak meet_... "Sage genau: Ich bin hier und höre zu."
```

Vollständiger Beitritts- und Sprachtest:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Sage genau: Ich bin hier und höre zu."
```

## Checkliste für Live-Tests

Bevor Sie eine Besprechung einem unbeaufsichtigten Agenten überlassen:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Sage genau: Google-Meet-Sprachtest abgeschlossen."
```

Erwarteter Chrome-Node-Zustand:

- `googlemeet setup` zeigt überall grün an und enthält `chrome-node-connected`, wenn Chrome-Node der Standardtransport ist oder ein Node festgelegt wurde.
- `nodes status` zeigt den ausgewählten Node als verbunden an, wobei sowohl `googlemeet.chrome` als auch `browser.proxy` bereitgestellt werden.
- Der Meet-Tab tritt bei und `test-speech` gibt den Chrome-Status mit `inCall: true` zurück.

Für einen entfernten Chrome-Host wie eine Parallels-macOS-VM ist dies die kürzeste sichere Prüfung nach einer Aktualisierung des Gateway oder der VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Dies weist nach, dass das Gateway-Plugin geladen ist, der VM-Node mit dem aktuellen Token verbunden ist und die Meet-Audio-Bridge verfügbar ist, bevor ein Agent einen echten Besprechungs-Tab öffnet.

Verwenden Sie für einen Twilio-Funktionstest eine Besprechung, die Einwahldaten per Telefon bereitstellt:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Erwarteter Twilio-Zustand:

- `googlemeet setup` umfasst grüne Prüfungen für `twilio-voice-call-plugin`, `twilio-voice-call-credentials` und `twilio-voice-call-webhook`.
- `voicecall` ist nach dem Neuladen des Gateways in der CLI verfügbar.
- Die zurückgegebene Sitzung enthält `transport: "twilio"` und eine `twilio.voiceCallId`.
- `openclaw logs --follow` zeigt, dass DTMF-TwiML vor Echtzeit-TwiML bereitgestellt wird, gefolgt von einer Echtzeit-Bridge, in deren Warteschlange die anfängliche Begrüßung steht.
- `googlemeet leave <sessionId>` beendet den delegierten Sprachanruf.

## Fehlerbehebung

### Der Agent kann das Google-Meet-Tool nicht sehen

Vergewissern Sie sich, dass das Plugin aktiviert ist, und laden Sie das Gateway neu. Der laufende Agent sieht nur Plugin-Tools, die vom aktuellen Gateway-Prozess registriert wurden:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Auf Gateway-Hosts ohne macOS bleibt `google_meet` sichtbar, lokale Chrome-Aktionen für die Audioausgabe werden jedoch blockiert, bevor sie die Audio-Bridge erreichen. Verwenden Sie `mode: "transcribe"`, die Twilio-Einwahl oder einen macOS-Host mit `chrome-node` anstelle des standardmäßigen lokalen Chrome-Agent-Pfads.

### Kein verbundener Google-Meet-fähiger Node

Auf dem Node-Host:

```bash
openclaw plugins enable google-meet
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

Der Node muss verbunden sein und `googlemeet.chrome` sowie `browser.proxy` auflisten. Die Gateway-Konfiguration muss beide zulassen:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Wenn bei `googlemeet setup` die Prüfung `chrome-node-connected` fehlschlägt oder das Gateway-Protokoll `gateway token mismatch` meldet, installieren Sie den Node mit dem aktuellen Gateway-Token neu oder starten Sie ihn damit neu:

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

### Browser wird geöffnet, aber der Agent kann nicht beitreten

Führen Sie `googlemeet test-listen` für rein beobachtende Beitritte oder `googlemeet test-speech` für Echtzeitbeitritte aus und prüfen Sie anschließend den zurückgegebenen Chrome-Status. Wenn einer der Befehle `manualActionRequired: true` meldet, zeigen Sie dem Betreiber `manualActionMessage` an und unternehmen Sie keine weiteren Versuche, bis die Browseraktion abgeschlossen ist.

Häufige manuelle Aktionen: beim Chrome-Profil anmelden; den Gast über das Meet-Hostkonto zulassen; Chrome Berechtigungen für Mikrofon/Kamera erteilen, wenn die native Aufforderung erscheint; einen hängen gebliebenen Meet-Berechtigungsdialog schließen oder beheben.

Melden Sie nicht „nicht angemeldet“, nur weil Meet fragt „Do you want people to hear you in the meeting?“; dies ist die Zwischenseite von Meet zur Audioauswahl. OpenClaw klickt über die Browserautomatisierung auf **Use microphone**, sofern verfügbar, und wartet weiter auf den tatsächlichen Besprechungsstatus; beim reinen Erstellen über den Browser-Fallback kann es stattdessen auf **Continue without microphone** klicken, da zum Erzeugen der URL kein Echtzeit-Audiopfad erforderlich ist.

### Erstellen der Besprechung schlägt fehl

`googlemeet create` verwendet bei konfiguriertem OAuth die Meet-API `spaces.create`, andernfalls den angehefteten Browser des Chrome-Nodes. Prüfen Sie Folgendes:

- **Erstellung per API**: `oauth.clientId` und `oauth.refreshToken` (oder entsprechende `OPENCLAW_GOOGLE_MEET_*`-Umgebungsvariablen) sind vorhanden, und das Aktualisierungstoken wurde nach dem Hinzufügen der Erstellungsunterstützung erzeugt; älteren Tokens fehlt möglicherweise `meetings.space.created`. Führen Sie daher `openclaw googlemeet auth login --json` erneut aus.
- **Browser-Fallback**: `defaultTransport: "chrome-node"` und `chromeNode.node` verweisen auf einen verbundenen Node mit `browser.proxy` und `googlemeet.chrome`; das OpenClaw-Chrome-Profil auf diesem Node ist angemeldet und kann `https://meet.google.com/new` öffnen.
- **Wiederholungsversuche des Browser-Fallbacks**: Verwenden Sie einen vorhandenen `.../new`-Tab oder einen Tab mit einer Google-Kontoaufforderung erneut, bevor Sie einen neuen öffnen; wiederholen Sie den Tool-Aufruf, statt manuell einen weiteren Tab zu öffnen.
- **Manuelle Aktion**: Wenn das Tool `manualActionRequired: true` zurückgibt, verwenden Sie `browser.nodeId`, `browser.targetId`, `browserUrl` und `manualActionMessage`, um den Betreiber anzuleiten; führen Sie keine Wiederholungsversuche in einer Schleife aus.
- **Zwischenseite zur Audioauswahl**: Wenn Meet „Do you want people to hear you in the meeting?“ anzeigt, lassen Sie den Tab geöffnet. OpenClaw sollte auf **Use microphone** oder (nur beim Erstellen) **Continue without microphone** klicken und weiter auf die generierte URL warten; wenn dies nicht möglich ist, sollte der Fehler `meet-audio-choice-required` und nicht `google-login-required` nennen.

### Agent tritt bei, spricht aber nicht

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Verwenden Sie `mode: "agent"` für den Pfad STT -> OpenClaw-Agent -> TTS und `mode: "bidi"` für den direkten Echtzeit-Sprach-Fallback. `mode: "transcribe"` startet absichtlich keine Rücksprechbrücke. Führen Sie zur rein beobachtenden Fehlerdiagnose `openclaw googlemeet status --json <session-id>` aus, nachdem Teilnehmer gesprochen haben, und prüfen Sie `captioning`, `transcriptLines` und `lastCaptionText`. Wenn `inCall` wahr ist, `transcriptLines` jedoch bei `0` bleibt, sind die Meet-Untertitel möglicherweise deaktiviert, seit der Installation des Beobachters hat niemand gesprochen, die Meet-Benutzeroberfläche wurde geändert oder Live-Untertitel sind für die Sprache bzw. das Konto der Besprechung nicht verfügbar.

`googlemeet test-speech` prüft immer den Echtzeitpfad und meldet, ob bei diesem Aufruf Ausgabebytes der Brücke festgestellt wurden. Wenn `speechOutputVerified` falsch und `speechOutputTimedOut` wahr ist, hat der Echtzeit-Provider die Äußerung möglicherweise akzeptiert, OpenClaw hat jedoch keine neuen Ausgabebytes erkannt, die die Chrome-Audiobrücke erreicht haben.

Prüfen Sie außerdem: Auf dem Gateway-Host ist ein Schlüssel für einen Echtzeit-Provider (`OPENAI_API_KEY` oder `GEMINI_API_KEY`) verfügbar; `BlackHole 2ch` ist auf dem Chrome-Host sichtbar; `sox` ist dort vorhanden; Meet-Mikrofon und -Lautsprecher werden über den virtuellen Audiopfad geleitet (`doctor` sollte für lokale Chrome-Echtzeitbeitritte `meet output routed: yes` anzeigen).

`googlemeet doctor [session-id]` gibt Sitzung, Node, Anrufstatus, Grund für manuelles Eingreifen, Verbindung zum Echtzeit-Provider, `realtimeReady`, Audioeingabe-/Audioausgabeaktivität, letzte Audiozeitstempel, Byte-Zähler und Browser-URL aus. Verwenden Sie `googlemeet status [session-id] --json` für unaufbereitetes JSON und `googlemeet doctor --oauth` (ergänzen Sie `--meeting` oder `--create-space`), um die OAuth-Aktualisierung zu überprüfen, ohne Tokens offenzulegen.

Wenn bei einem Agent ein Zeitlimit überschritten wurde und bereits ein Meet-Tab geöffnet ist, prüfen Sie ihn, ohne einen weiteren zu öffnen:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Die entsprechende Tool-Aktion lautet `recover_current_tab`: Sie fokussiert und prüft einen vorhandenen Meet-Tab für den ausgewählten Transport (`chrome` für lokale Browsersteuerung, `chrome-node` für die konfigurierte Node), ohne einen neuen Tab oder eine neue Sitzung zu öffnen, und meldet das aktuelle Hindernis (Anmeldung, Zulassung, Berechtigungen, Status der Audioauswahl). Der CLI-Befehl kommuniziert mit dem konfigurierten Gateway, das ausgeführt werden muss; `chrome-node` erfordert außerdem, dass die Node verbunden ist.

### Twilio-Einrichtungsprüfungen schlagen fehl

`twilio-voice-call-plugin` schlägt fehl, wenn `voice-call` nicht zugelassen oder nicht aktiviert ist: Fügen Sie es zu `plugins.allow` hinzu, aktivieren Sie `plugins.entries.voice-call` und laden Sie das Gateway neu.

`twilio-voice-call-credentials` schlägt fehl, wenn im Twilio-Backend die Konto-SID, das Authentifizierungstoken oder die Anrufernummer fehlt:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` schlägt fehl, wenn `voice-call` keine öffentliche Webhook-Erreichbarkeit hat oder `publicUrl` auf den Loopback- oder privaten Netzwerkbereich verweist. Verwenden Sie nicht `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` oder `fd00::/8` als `publicUrl`; Anbieter-Callbacks können diese Adressen nicht erreichen. Setzen Sie `plugins.entries.voice-call.config.publicUrl` auf eine öffentliche URL oder konfigurieren Sie eine Tunnel-/Tailscale-Erreichbarkeit:

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

Verwenden Sie für die lokale Entwicklung statt einer privaten Host-URL eine Tunnel- oder Tailscale-Erreichbarkeit:

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

Fügen Sie `--yes` nur hinzu, wenn Sie absichtlich einen echten ausgehenden Anruf tätigen möchten:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Der Twilio-Anruf beginnt, tritt der Besprechung aber nie bei

Vergewissern Sie sich, dass das Meet-Ereignis Einwahldaten per Telefon bereitstellt, und übergeben Sie die exakte Einwahlnummer sowie die PIN oder eine benutzerdefinierte DTMF-Sequenz:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Verwenden Sie ein vorangestelltes `w` oder Kommas in `--dtmf-sequence`, um vor der PIN eine Pause einzufügen.

Wenn der Anruf erstellt wird, die Meet-Teilnehmerliste den eingewählten Teilnehmer aber nie anzeigt:

- `openclaw googlemeet doctor <session-id>`: Prüfen Sie die delegierte Twilio-Anruf-ID, ob DTMF in die Warteschlange gestellt wurde und ob die Einleitungsansage angefordert wurde.
- `openclaw voicecall status --call-id <id>`: Vergewissern Sie sich, dass der Anruf noch aktiv ist.
- `openclaw voicecall tail`: Vergewissern Sie sich, dass Twilio-Webhooks am Gateway eingehen.
- `openclaw logs --follow`: Suchen Sie nach der Twilio-Meet-Sequenz: Google Meet delegiert den Beitritt, Voice Call speichert und liefert DTMF-TwiML vor dem Verbindungsaufbau, Voice Call liefert Echtzeit-TwiML für den Twilio-Anruf und anschließend fordert Google Meet mit `voicecall.speak` eine Einleitungsansage an.
- Führen Sie `openclaw googlemeet setup --transport twilio` erneut aus; eine erfolgreiche Einrichtungsprüfung ist erforderlich, beweist jedoch nicht, dass die PIN-Sequenz der Besprechung korrekt ist.
- Vergewissern Sie sich, dass die Einwahlnummer zu derselben Meet-Einladung und Region wie die PIN gehört.
- Erhöhen Sie `voiceCall.dtmfDelayMs` gegenüber dem Standardwert von 12 Sekunden, wenn Meet langsam antwortet oder das Anruftranskript nach dem Senden von DTMF vor dem Verbindungsaufbau weiterhin die PIN-Aufforderung anzeigt.
- Wenn der Teilnehmer beitritt, Sie die Ansage jedoch nicht hören, prüfen Sie `openclaw logs --follow` auf die nach DTMF gesendete `voicecall.speak`-Anforderung und entweder die TTS-Wiedergabe über den Medienstrom oder den Twilio-`<Say>`-Fallback. Wenn das Transkript weiterhin „Geben Sie die Besprechungs-PIN ein“ anzeigt, ist die Telefonverbindung dem Meet-Raum noch nicht beigetreten, sodass die Teilnehmer keine Sprachausgabe hören.

Wenn keine Webhooks eingehen, untersuchen Sie zuerst das Voice-Call-Plugin: Der Provider muss `plugins.entries.voice-call.config.publicUrl` oder den konfigurierten Tunnel erreichen können. Siehe [Fehlerbehebung für Sprachanrufe](/de/plugins/voice-call#troubleshooting).

## Hinweise

Die offizielle Medien-API von Google Meet ist auf den Empfang ausgerichtet, daher erfordert das Sprechen in einem Anruf weiterhin einen Teilnehmerpfad. Dieses Plugin macht diese Grenze sichtbar: Chrome übernimmt die Browserteilnahme und die lokale Audioleitung; Twilio übernimmt die Teilnahme per Telefoneinwahl.

Chrome-Rücksprechmodi benötigen `BlackHole 2ch` sowie eine der folgenden Optionen:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw verwaltet die Brücke und leitet Audio im Format `chrome.audioFormat` zwischen diesen Befehlen und dem ausgewählten Provider weiter. Der Modus `agent` verwendet Echtzeittranskription plus reguläres TTS; der Modus `bidi` verwendet den Echtzeit-Sprach-Provider. Der Standardpfad ist PCM16 mit 24 kHz und `chrome.audioBufferBytes: 4096`; G.711 μ-Law mit 8 kHz bleibt für ältere Befehlspaare verfügbar.
- `chrome.audioBridgeCommand`: Ein externer Brückenbefehl verwaltet den gesamten lokalen Audiopfad und muss nach dem Starten oder Überprüfen seines Daemons beendet werden. Nur für `bidi` gültig, da der Modus `agent` für TTS direkten Zugriff auf das Befehlspaar benötigt.

Bei der Chrome-Bridge mit Befehlspaar kann `chrome.bargeInInputCommand` ein separates lokales Mikrofon abhören und die Wiedergabe des Assistenten löschen, sobald ein Mensch zu sprechen beginnt. Dadurch hat menschliche Sprache Vorrang vor der Ausgabe des Assistenten, selbst wenn der gemeinsam verwendete BlackHole-Loopback-Eingang während der Assistentenwiedergabe vorübergehend unterdrückt wird. Wie `chrome.audioInputCommand`/`chrome.audioOutputCommand` ist dies ein vom Betreiber konfigurierter lokaler Befehl: Verwenden Sie einen expliziten vertrauenswürdigen Befehlspfad oder eine Argumentliste, niemals ein Skript aus einem nicht vertrauenswürdigen Speicherort.

Für sauberes Duplex-Audio leiten Sie die Meet-Ausgabe und das Meet-Mikrofon über getrennte virtuelle Geräte oder einen virtuellen Gerätegraphen nach Loopback-Art; ein einzelnes gemeinsam verwendetes BlackHole-Gerät kann andere Teilnehmer zurück in den Anruf spiegeln.

`googlemeet speak` aktiviert die aktive Talkback-Audio-Bridge für eine Chrome-Sitzung; `googlemeet leave` beendet sie (und legt bei Twilio-Sitzungen, die über Voice Call delegiert wurden, den zugrunde liegenden Anruf auf). Verwenden Sie `googlemeet end-active-conference`, um außerdem die aktive Google Meet-Konferenz für einen API-verwalteten Bereich zu schließen.

## Verwandte Themen

- [Sprachanruf-Plugin](/de/plugins/voice-call)
- [Sprechmodus](/de/nodes/talk)
- [Plugins erstellen](/de/plugins/building-plugins)
