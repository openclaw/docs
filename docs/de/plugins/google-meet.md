---
read_when:
    - Sie möchten, dass ein OpenClaw-Agent an einem Google Meet-Anruf teilnimmt
    - Sie möchten, dass ein OpenClaw-Agent einen neuen Google Meet-Anruf erstellt
    - Sie konfigurieren Chrome, Chrome Node oder Twilio als Google Meet-Transport
summary: 'Google Meet Plugin: Expliziten Meet-URLs über Chrome oder Twilio mit Standardeinstellungen für Agent-Talkback beitreten'
title: Google Meet-Plugin
x-i18n:
    generated_at: "2026-05-04T06:43:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4268ad895bbf83d649b9571c0888c27eb982ad9710dfb408f22f7818cdc5dbcb
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet-Teilnehmerunterstützung für OpenClaw — das Plugin ist absichtlich explizit gestaltet:

- Es tritt nur einer expliziten `https://meet.google.com/...`-URL bei.
- Es kann über die Google Meet API einen neuen Meet-Raum erstellen und dann der
  zurückgegebenen URL beitreten.
- `agent` ist der Standard-Rücksprechmodus: Die Echtzeittranskription hört zu, der
  konfigurierte OpenClaw-Agent antwortet, und reguläres OpenClaw TTS spricht in Meet.
- `bidi` bleibt als Fallback-Modus für das direkte Echtzeit-Sprachmodell verfügbar.
- Agenten wählen das Beitrittsverhalten mit `mode`: Verwenden Sie `agent` für
  Live-Zuhören/Rücksprechen, `bidi` als direkten Echtzeit-Sprach-Fallback oder `transcribe`,
  um den Browser ohne Rücksprechbrücke beizutreten/zu steuern.
- Auth startet als persönliches Google OAuth oder als bereits angemeldetes Chrome-Profil.
- Es gibt keine automatische Einwilligungsankündigung.
- Das Standard-Audio-Backend von Chrome ist `BlackHole 2ch`.
- Chrome kann lokal oder auf einem gekoppelten Node-Host ausgeführt werden.
- Twilio akzeptiert eine Einwahlnummer plus optionale PIN oder DTMF-Sequenz; es
  kann eine Meet-URL nicht direkt wählen.
- Der CLI-Befehl ist `googlemeet`; `meet` ist für umfassendere
  Agent-Telekonferenz-Workflows reserviert.

## Schnellstart

Installieren Sie die lokalen Audio-Abhängigkeiten und konfigurieren Sie einen
Echtzeittranskriptions-Provider plus reguläres OpenClaw TTS. OpenAI ist der
Standard-Transkriptions-Provider; Google Gemini Live funktioniert ebenfalls als
separater `bidi`-Sprach-Fallback mit `realtime.voiceProvider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
export GEMINI_API_KEY=...
```

`blackhole-2ch` installiert das virtuelle Audiogerät `BlackHole 2ch`. Der
Homebrew-Installer erfordert einen Neustart, bevor macOS das Gerät bereitstellt:

```bash
sudo reboot
```

Prüfen Sie nach dem Neustart beide Komponenten:

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

Prüfen Sie die Einrichtung:

```bash
openclaw googlemeet setup
```

Die Setup-Ausgabe ist darauf ausgelegt, für Agenten lesbar und modusabhängig zu sein.
Sie meldet Chrome-Profil, Node-Fixierung und bei Echtzeit-Chrome-Beitritten die
BlackHole/SoX-Audiobrücke sowie verzögerte Prüfungen der Echtzeit-Einführung. Für
Beitritte nur zur Beobachtung prüfen Sie denselben Transport mit `--mode transcribe`;
dieser Modus überspringt Echtzeit-Audio-Voraussetzungen, weil er weder über die
Brücke zuhört noch über sie spricht:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Wenn Twilio-Delegierung konfiguriert ist, meldet das Setup auch, ob das
`voice-call`-Plugin, die Twilio-Anmeldedaten und die öffentliche Webhook-Erreichbarkeit
bereit sind. Behandeln Sie jede Prüfung mit `ok: false` als Blocker für den
geprüften Transport und Modus, bevor Sie einen Agenten zum Beitritt auffordern.
Verwenden Sie `openclaw googlemeet setup --json` für Skripte oder maschinenlesbare
Ausgabe. Verwenden Sie `--transport chrome`, `--transport chrome-node` oder
`--transport twilio`, um einen bestimmten Transport vorab zu prüfen, bevor ein
Agent ihn ausprobiert.

Für Twilio sollten Sie den Transport immer explizit vorab prüfen, wenn der
Standardtransport Chrome ist:

```bash
openclaw googlemeet setup --transport twilio
```

Das erkennt fehlende `voice-call`-Verdrahtung, Twilio-Anmeldedaten oder nicht
erreichbare Webhook-Veröffentlichung, bevor der Agent versucht, das Meeting anzuwählen.

Einem Meeting beitreten:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Oder lassen Sie einen Agenten über das `google_meet`-Tool beitreten:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Das agentenseitige `google_meet`-Tool bleibt auf Nicht-macOS-Hosts für Artefakt-,
Kalender-, Setup-, Transcribe-, Twilio- und `chrome-node`-Flows verfügbar. Lokale
Chrome-Rücksprechaktionen werden dort blockiert, weil der gebündelte Chrome-Audiopfad
derzeit von macOS `BlackHole 2ch` abhängt. Verwenden Sie unter Linux `mode: "transcribe"`,
Twilio-Einwahl oder einen macOS-`chrome-node`-Host für Chrome-Rücksprech-Teilnahme.

Ein neues Meeting erstellen und beitreten:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

Verwenden Sie für per API erstellte Räume Google Meet `SpaceConfig.accessType`,
wenn die No-Knock-Richtlinie des Raums explizit sein soll, statt von den
Standardeinstellungen des Google-Kontos geerbt zu werden:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` lässt alle Personen mit der Meet-URL ohne Anklopfen beitreten. `TRUSTED`
lässt vertrauenswürdige Benutzer der Host-Organisation, eingeladene externe
Benutzer und Einwahlbenutzer ohne Anklopfen beitreten. `RESTRICTED` beschränkt
den Eintritt ohne Anklopfen auf Eingeladene. Diese Einstellungen gelten nur für
den offiziellen Erstellungspfad der Google Meet API, daher müssen OAuth-Anmeldedaten
konfiguriert sein.

Wenn Sie Google Meet authentifiziert haben, bevor diese Option verfügbar war,
führen Sie `openclaw googlemeet auth login --json` erneut aus, nachdem Sie den
Scope `meetings.space.settings` zu Ihrem Google OAuth-Zustimmungsbildschirm
hinzugefügt haben.

Nur die URL erstellen, ohne beizutreten:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` hat zwei Pfade:

- API-Erstellung: Wird verwendet, wenn Google Meet OAuth-Anmeldedaten konfiguriert
  sind. Dies ist der deterministischste Pfad und hängt nicht vom Zustand der
  Browseroberfläche ab.
- Browser-Fallback: Wird verwendet, wenn OAuth-Anmeldedaten fehlen. OpenClaw
  verwendet den fixierten Chrome-Node, öffnet `https://meet.google.com/new`, wartet,
  bis Google zu einer echten Meeting-Code-URL weiterleitet, und gibt dann diese URL
  zurück. Dieser Pfad erfordert, dass das OpenClaw-Chrome-Profil auf dem Node bereits
  bei Google angemeldet ist. Die Browserautomatisierung verarbeitet die eigene
  Mikrofon-Erstaufforderung von Meet; diese Aufforderung wird nicht als Google-Loginfehler
  behandelt.
  Beitritts- und Erstellungsflows versuchen außerdem, einen vorhandenen Meet-Tab
  wiederzuverwenden, bevor sie einen neuen öffnen. Der Abgleich ignoriert harmlose
  URL-Abfragezeichenfolgen wie `authuser`, sodass ein Agenten-Wiederholungsversuch
  das bereits geöffnete Meeting fokussieren sollte, statt einen zweiten Chrome-Tab
  zu erstellen.

Die Befehls-/Tool-Ausgabe enthält ein `source`-Feld (`api` oder `browser`), damit
Agenten erklären können, welcher Pfad verwendet wurde. `create` tritt dem neuen
Meeting standardmäßig bei und gibt `joined: true` plus die Beitrittssitzung zurück.
Um nur die URL zu erzeugen, verwenden Sie `create --no-join` in der CLI oder
übergeben Sie `"join": false` an das Tool.

Oder sagen Sie einem Agenten: „Erstellen Sie ein Google Meet, treten Sie mit dem
Agent-Rücksprechmodus bei und senden Sie mir den Link.“ Der Agent sollte
`google_meet` mit `action: "create"` aufrufen und dann die zurückgegebene
`meetingUri` teilen.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Für einen Beitritt nur zur Beobachtung/Browsersteuerung setzen Sie `"mode": "transcribe"`.
Das startet nicht die Duplex-Echtzeit-Sprachbrücke, erfordert weder BlackHole noch
SoX und spricht nicht zurück in das Meeting. Chrome-Beitritte in diesem Modus vermeiden
auch OpenClaws Mikrofon-/Kameraberechtigungserteilung und den Meet-Pfad **Mikrofon
verwenden**. Wenn Meet einen Audioauswahl-Zwischenschritt zeigt, versucht die
Automatisierung den Pfad ohne Mikrofon und meldet andernfalls eine manuelle Aktion,
statt das lokale Mikrofon zu öffnen. Im Transcribe-Modus installieren verwaltete
Chrome-Transporte außerdem einen Best-Effort-Meet-Untertitelbeobachter.
`googlemeet status --json` und `googlemeet doctor` zeigen `captioning`,
`captionsEnabledAttempted`, `transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`,
`lastCaptionText` und einen kurzen `recentTranscript`-Nachlauf an, damit Operatoren
erkennen können, ob der Browser dem Anruf beigetreten ist und ob Meet-Untertitel
Text erzeugen.
Verwenden Sie `openclaw googlemeet test-listen <meet-url> --transport chrome-node`,
wenn Sie eine Ja/Nein-Prüfung benötigen: Sie tritt im Transcribe-Modus bei, wartet
auf frische Untertitel- oder Transkriptbewegung und gibt `listenVerified`,
`listenTimedOut`, Felder für manuelle Aktionen und den aktuellen Untertitelstatus
zurück.

Während Echtzeitsitzungen enthält der `google_meet`-Status Browser- und
Audiobrücken-Health-Daten wie `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, Zeitstempel der letzten
Ein-/Ausgabe, Byte-Zähler und den geschlossenen Brückenzustand. Wenn eine sichere
Meet-Seitenaufforderung erscheint, verarbeitet die Browserautomatisierung sie, wenn
sie kann. Login-, Host-Zulassungs- und Browser-/OS-Berechtigungsaufforderungen werden
als manuelle Aktion mit Grund und Nachricht gemeldet, damit der Agent sie weitergeben
kann. Verwaltete Chrome-Sitzungen geben die Einführungs- oder Testphrase erst aus,
nachdem der Browser-Health-Status `inCall: true` meldet; andernfalls meldet der
Status `speechReady: false` und der Sprachversuch wird blockiert, statt vorzugeben,
der Agent habe in das Meeting gesprochen.

Lokale Chrome-Beitritte erfolgen über das angemeldete OpenClaw-Browserprofil.
Echtzeitmodus erfordert `BlackHole 2ch` für den von OpenClaw verwendeten
Mikrofon-/Lautsprecherpfad. Für sauberes Duplex-Audio verwenden Sie getrennte
virtuelle Geräte oder einen Loopback-ähnlichen Graphen; ein einzelnes BlackHole-Gerät
reicht für einen ersten Smoke-Test aus, kann aber Echo erzeugen.

### Lokales Gateway + Parallels Chrome

Sie benötigen **kein** vollständiges OpenClaw Gateway und keinen Modell-API-Schlüssel
innerhalb einer macOS-VM, nur damit die VM Chrome besitzt. Führen Sie das Gateway
und den Agenten lokal aus und führen Sie dann einen Node-Host in der VM aus.
Aktivieren Sie das gebündelte Plugin einmal in der VM, damit der Node den
Chrome-Befehl ankündigt:

Was wo läuft:

- Gateway-Host: OpenClaw Gateway, Agent-Arbeitsbereich, Modell-/API-Schlüssel,
  Echtzeit-Provider und die Google Meet-Plugin-Konfiguration.
- Parallels-macOS-VM: OpenClaw CLI/Node-Host, Google Chrome, SoX, BlackHole 2ch
  und ein bei Google angemeldetes Chrome-Profil.
- In der VM nicht erforderlich: Gateway-Dienst, Agent-Konfiguration, OpenAI/GPT-Schlüssel
  oder Modell-Provider-Einrichtung.

Installieren Sie die VM-Abhängigkeiten:

```bash
brew install blackhole-2ch sox
```

Starten Sie die VM nach der Installation von BlackHole neu, damit macOS
`BlackHole 2ch` bereitstellt:

```bash
sudo reboot
```

Prüfen Sie nach dem Neustart, ob die VM das Audiogerät und die SoX-Befehle sieht:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Installieren oder aktualisieren Sie OpenClaw in der VM und aktivieren Sie dort
anschließend das gebündelte Plugin:

```bash
openclaw plugins enable google-meet
```

Starten Sie den Node-Host in der VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Wenn `<gateway-host>` eine LAN-IP ist und Sie kein TLS verwenden, verweigert der
Node den Klartext-WebSocket, sofern Sie sich nicht explizit für dieses vertrauenswürdige
private Netzwerk entscheiden:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Verwenden Sie dieselbe Umgebungsvariable, wenn Sie den Node als LaunchAgent
installieren:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ist eine Prozessumgebung, keine
`openclaw.json`-Einstellung. `openclaw node install` speichert sie in der
LaunchAgent-Umgebung, wenn sie beim Installationsbefehl vorhanden ist.

Genehmigen Sie den Node vom Gateway-Host aus:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Bestätigen Sie, dass das Gateway den Node sieht und dass er sowohl `googlemeet.chrome`
als auch Browserfähigkeit/`browser.proxy` ankündigt:

```bash
openclaw nodes status
```

Routen Sie Meet auf dem Gateway-Host über diesen Node:

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

oder bitten Sie den Agenten, das `google_meet`-Tool mit `transport: "chrome-node"`
zu verwenden.

Für einen Smoke-Test mit einem Befehl, der eine Sitzung erstellt oder wiederverwendet,
eine bekannte Phrase spricht und den Sitzungszustand ausgibt:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Beim Realtime-Beitritt füllt die OpenClaw-Browserautomatisierung den Gastnamen aus, klickt auf
Teilnehmen/Teilnahmeanfrage stellen und akzeptiert Meets erstmalige Auswahl „Mikrofon verwenden“, wenn diese
Aufforderung erscheint. Beim Beitritt im Nur-Beobachten-Modus oder bei der reinen Browser-Erstellung eines Meetings
fährt sie bei derselben Aufforderung ohne Mikrofon fort, wenn diese Auswahl verfügbar ist.
Wenn das Browserprofil nicht angemeldet ist, Meet auf die Zulassung durch den Host wartet,
Chrome für einen Realtime-Beitritt die Mikrofon-/Kameraberechtigung benötigt oder Meet bei einer
Aufforderung hängen bleibt, die die Automatisierung nicht auflösen konnte, meldet das Ergebnis von join/test-speech
`manualActionRequired: true` mit `manualActionReason` und
`manualActionMessage`. Agents sollten weitere Beitrittsversuche stoppen, genau diese
Meldung plus die aktuelle `browserUrl`/`browserTitle` melden und erst erneut versuchen, nachdem die
manuelle Browseraktion abgeschlossen ist.

Wenn `chromeNode.node` weggelassen wird, wählt OpenClaw nur dann automatisch aus, wenn genau ein
verbundener Node sowohl `googlemeet.chrome` als auch Browsersteuerung ankündigt. Wenn
mehrere geeignete Nodes verbunden sind, setzen Sie `chromeNode.node` auf die Node-ID,
den Anzeigenamen oder die Remote-IP.

Häufige Fehlerprüfungen:

- `Configured Google Meet node ... is not usable: offline`: Der festgelegte Node ist
  dem Gateway bekannt, aber nicht verfügbar. Agents sollten diesen Node als
  Diagnosezustand behandeln, nicht als verwendbaren Chrome-Host, und den Setup-Blocker
  melden, anstatt auf einen anderen Transport zurückzufallen, sofern der Benutzer dies nicht angefordert hat.
- `No connected Google Meet-capable node`: Starten Sie `openclaw node run` in der VM,
  genehmigen Sie das Pairing und stellen Sie sicher, dass `openclaw plugins enable google-meet` und
  `openclaw plugins enable browser` in der VM ausgeführt wurden. Bestätigen Sie außerdem, dass der
  Gateway-Host beide Node-Befehle mit
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]` zulässt.
- `BlackHole 2ch audio device not found`: Installieren Sie `blackhole-2ch` auf dem geprüften Host
  und starten Sie ihn neu, bevor Sie lokales Chrome-Audio verwenden.
- `BlackHole 2ch audio device not found on the node`: Installieren Sie `blackhole-2ch`
  in der VM und starten Sie die VM neu.
- Chrome wird geöffnet, kann aber nicht beitreten: Melden Sie sich im Browserprofil innerhalb der VM an, oder
  lassen Sie `chrome.guestName` für den Gastbeitritt gesetzt. Der automatische Gastbeitritt nutzt die OpenClaw-
  Browserautomatisierung über den Node-Browserproxy; stellen Sie sicher, dass die Node-Browserkonfiguration
  auf das gewünschte Profil zeigt, zum Beispiel
  `browser.defaultProfile: "user"` oder ein benanntes Existing-Session-Profil.
- Doppelte Meet-Tabs: Lassen Sie `chrome.reuseExistingTab: true` aktiviert. OpenClaw
  aktiviert einen vorhandenen Tab für dieselbe Meet-URL, bevor ein neuer geöffnet wird, und
  die Browser-Meeting-Erstellung verwendet einen laufenden `https://meet.google.com/new`-
  oder Google-Konto-Aufforderungs-Tab erneut, bevor ein weiterer geöffnet wird.
- Kein Audio: Leiten Sie in Meet Mikrofon-/Lautsprecheraudio über den von OpenClaw verwendeten
  Pfad des virtuellen Audiogeräts; verwenden Sie getrennte virtuelle Geräte oder Loopback-artiges Routing
  für sauberes Duplex-Audio.

## Installationshinweise

Der Standard für Chrome Talk-Back verwendet zwei externe Tools:

- `sox`: Befehlszeilen-Audiowerkzeug. Das Plugin verwendet explizite CoreAudio-
  Gerätebefehle für die standardmäßige 24-kHz-PCM16-Audiobrücke.
- `blackhole-2ch`: virtueller macOS-Audiotreiber. Er erstellt das Audiogerät `BlackHole 2ch`,
  über das Chrome/Meet routen kann.

OpenClaw bündelt oder vertreibt keines der beiden Pakete. Die Dokumentation weist Benutzer an,
sie als Host-Abhängigkeiten über Homebrew zu installieren. SoX ist als
`LGPL-2.0-only AND GPL-2.0-only` lizenziert; BlackHole ist GPL-3.0. Wenn Sie einen
Installer oder eine Appliance erstellen, die BlackHole mit OpenClaw bündelt, prüfen Sie die
Upstream-Lizenzbedingungen von BlackHole oder beziehen Sie eine separate Lizenz von Existential Audio.

## Transporte

### Chrome

Der Chrome-Transport öffnet die Meet-URL über die OpenClaw-Browsersteuerung und tritt
als das angemeldete OpenClaw-Browserprofil bei. Unter macOS prüft das Plugin vor dem Start auf
`BlackHole 2ch`. Falls konfiguriert, führt es außerdem einen Health-Befehl für die Audiobrücke
und einen Startbefehl aus, bevor Chrome geöffnet wird. Verwenden Sie `chrome`, wenn
Chrome/Audio auf dem Gateway-Host laufen; verwenden Sie `chrome-node`, wenn Chrome/Audio
auf einem gekoppelten Node wie einer Parallels-macOS-VM laufen. Wählen Sie für lokales Chrome das
Profil mit `browser.defaultProfile`; `chrome.browserProfile` wird an
`chrome-node`-Hosts übergeben.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Leiten Sie Chrome-Mikrofon- und Lautsprecheraudio über die lokale OpenClaw-Audiobrücke.
Wenn `BlackHole 2ch` nicht installiert ist, schlägt der Beitritt mit einem Setup-Fehler fehl,
anstatt stillschweigend ohne Audiopfad beizutreten.

### Twilio

Der Twilio-Transport ist ein strikter Wählplan, der an das Voice Call Plugin delegiert wird. Er
parst keine Meet-Seiten nach Telefonnummern.

Verwenden Sie dies, wenn Chrome-Teilnahme nicht verfügbar ist oder Sie einen Telefon-Dial-in-
Fallback wünschen. Google Meet muss für das Meeting eine Telefon-Einwahlnummer und PIN
bereitstellen; OpenClaw ermittelt diese nicht aus der Meet-Seite.

Aktivieren Sie das Voice Call Plugin auf dem Gateway-Host, nicht auf dem Chrome-Node:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // or set "twilio" if Twilio should be the default
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
            instructions: "Join this Google Meet as an OpenClaw agent. Be brief.",
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

Stellen Sie Twilio-Anmeldedaten über Umgebung oder Konfiguration bereit. Die Umgebung hält
Geheimnisse aus `openclaw.json` heraus:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

Verwenden Sie stattdessen `realtime.provider: "openai"` mit dem OpenAI-Provider-Plugin und
`OPENAI_API_KEY`, wenn dies Ihr Realtime-Voice-Provider ist.

Starten oder laden Sie das Gateway nach dem Aktivieren von `voice-call` neu; Plugin-Konfigurationsänderungen
erscheinen in einem bereits laufenden Gateway-Prozess erst nach dem Neuladen.

Prüfen Sie anschließend:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Wenn die Twilio-Delegierung verdrahtet ist, enthält `googlemeet setup` erfolgreiche
Prüfungen für `twilio-voice-call-plugin`, `twilio-voice-call-credentials` und
`twilio-voice-call-webhook`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Verwenden Sie `--dtmf-sequence`, wenn das Meeting eine benutzerdefinierte Sequenz benötigt:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth und Preflight

OAuth ist für das Erstellen eines Meet-Links optional, da `googlemeet create` auf
Browserautomatisierung zurückfallen kann. Konfigurieren Sie OAuth, wenn Sie offizielle API-Erstellung,
Space-Auflösung oder Preflight-Prüfungen der Meet Media API wünschen.

Der Zugriff auf die Google Meet API verwendet Benutzer-OAuth: Erstellen Sie einen Google Cloud-OAuth-Client,
fordern Sie die erforderlichen Scopes an, autorisieren Sie ein Google-Konto und speichern Sie dann das
resultierende Refresh-Token in der Google Meet Plugin-Konfiguration oder stellen Sie die
Umgebungsvariablen `OPENCLAW_GOOGLE_MEET_*` bereit.

OAuth ersetzt den Chrome-Beitrittspfad nicht. Chrome- und Chrome-node-Transporte
treten weiterhin über ein angemeldetes Chrome-Profil, BlackHole/SoX und einen verbundenen
Node bei, wenn Sie Browserteilnahme verwenden. OAuth ist nur für den offiziellen Google
Meet API-Pfad vorgesehen: Meeting Spaces erstellen, Spaces auflösen und Preflight-Prüfungen
der Meet Media API ausführen.

### Google-Anmeldedaten erstellen

In der Google Cloud Console:

1. Erstellen oder wählen Sie ein Google Cloud-Projekt aus.
2. Aktivieren Sie **Google Meet REST API** für dieses Projekt.
3. Konfigurieren Sie den OAuth-Zustimmungsbildschirm.
   - **Intern** ist für eine Google Workspace-Organisation am einfachsten.
   - **Extern** funktioniert für private/Test-Setups; solange sich die App im Testmodus befindet,
     fügen Sie jedes Google-Konto, das die App autorisieren wird, als Testbenutzer hinzu.
4. Fügen Sie die von OpenClaw angeforderten Scopes hinzu:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Erstellen Sie eine OAuth-Client-ID.
   - Anwendungstyp: **Webanwendung**.
   - Autorisierte Weiterleitungs-URI:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Kopieren Sie die Client-ID und das Client-Secret.

`meetings.space.created` wird von Google Meet `spaces.create` benötigt.
`meetings.space.readonly` ermöglicht OpenClaw, Meet-URLs/-Codes zu Spaces aufzulösen.
`meetings.space.settings` ermöglicht OpenClaw, `SpaceConfig`-Einstellungen wie
`accessType` während der API-Raumerstellung zu übergeben.
`meetings.conference.media.readonly` ist für Preflight und Medienarbeit mit der Meet Media API vorgesehen;
Google kann für die tatsächliche Nutzung der Media API eine Developer-Preview-Registrierung verlangen.
Wenn Sie nur browserbasierte Chrome-Beitritte benötigen, überspringen Sie OAuth vollständig.

### Refresh-Token ausstellen

Konfigurieren Sie `oauth.clientId` und optional `oauth.clientSecret`, oder übergeben Sie sie als
Umgebungsvariablen, und führen Sie dann aus:

```bash
openclaw googlemeet auth login --json
```

Der Befehl gibt einen `oauth`-Konfigurationsblock mit einem Refresh-Token aus. Er verwendet PKCE,
einen localhost-Callback auf `http://localhost:8085/oauth2callback` und mit `--manual`
einen manuellen Kopieren/Einfügen-Ablauf.

Beispiele:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Verwenden Sie den manuellen Modus, wenn der Browser den lokalen Callback nicht erreichen kann:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

Die JSON-Ausgabe enthält:

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

Speichern Sie das `oauth`-Objekt unter der Google Meet Plugin-Konfiguration:

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

Bevorzugen Sie Umgebungsvariablen, wenn Sie das Refresh-Token nicht in der Konfiguration haben möchten.
Wenn sowohl Konfigurations- als auch Umgebungswerte vorhanden sind, löst das Plugin zuerst die Konfiguration
auf und verwendet dann die Umgebung als Fallback.

Die OAuth-Zustimmung umfasst Meet-Space-Erstellung, Lesezugriff auf Meet-Spaces und
Lesezugriff auf Meet-Konferenzmedien. Wenn Sie sich authentifiziert haben, bevor Unterstützung für die Meeting-Erstellung
existierte, führen Sie `openclaw googlemeet auth login --json` erneut aus, damit das Refresh-
Token den Scope `meetings.space.created` hat.

### OAuth mit Doctor prüfen

Führen Sie den OAuth-Doctor aus, wenn Sie eine schnelle, geheimnisfreie Integritätsprüfung wünschen:

```bash
openclaw googlemeet doctor --oauth --json
```

Dies lädt die Chrome-Laufzeit nicht und erfordert keinen verbundenen Chrome-Node. Es
prüft, ob die OAuth-Konfiguration vorhanden ist und ob das Refresh-Token ein Access-
Token ausstellen kann. Der JSON-Bericht enthält nur Statusfelder wie `ok`, `configured`,
`tokenSource`, `expiresAt` und Prüfmeldungen; er gibt weder Access-
Token, Refresh-Token noch Client-Secret aus.

Häufige Ergebnisse:

| Prüfung             | Bedeutung                                                                               |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` plus `oauth.refreshToken` oder ein zwischengespeichertes Zugriffstoken ist vorhanden. |
| `oauth-token`        | Das zwischengespeicherte Zugriffstoken ist noch gültig, oder das Refresh-Token hat ein neues Zugriffstoken erzeugt. |
| `meet-spaces-get`    | Optionale `--meeting`-Prüfung hat einen vorhandenen Meet-Space aufgelöst.               |
| `meet-spaces-create` | Optionale `--create-space`-Prüfung hat einen neuen Meet-Space erstellt.                 |

Um auch die Aktivierung der Google Meet API und den `spaces.create`-Scope nachzuweisen, führen Sie die
erstellende Prüfung mit Seiteneffekt aus:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` erstellt eine temporäre Meet-URL. Verwenden Sie es, wenn Sie bestätigen müssen,
dass für das Google Cloud-Projekt die Meet API aktiviert ist und dass das autorisierte
Konto den Scope `meetings.space.created` hat.

Um Lesezugriff für einen vorhandenen Meeting-Space nachzuweisen:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` und `resolve-space` weisen Lesezugriff auf einen vorhandenen
Space nach, auf den das autorisierte Google-Konto zugreifen kann. Ein `403` aus diesen Prüfungen
bedeutet üblicherweise, dass die Google Meet REST API deaktiviert ist, dem zugestimmten Refresh-Token
der erforderliche Scope fehlt oder das Google-Konto nicht auf diesen Meet-Space
zugreifen kann. Ein Refresh-Token-Fehler bedeutet, dass Sie `openclaw googlemeet auth login
--json` erneut ausführen und den neuen `oauth`-Block speichern müssen.

Für den Browser-Fallback sind keine OAuth-Anmeldedaten erforderlich. In diesem Modus stammt die Google-
Authentifizierung aus dem angemeldeten Chrome-Profil auf dem ausgewählten Node, nicht aus der
OpenClaw-Konfiguration.

Diese Umgebungsvariablen werden als Fallbacks akzeptiert:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` oder `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` oder `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` oder `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` oder `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` oder
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` oder `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` oder `GOOGLE_MEET_PREVIEW_ACK`

Lösen Sie eine Meet-URL, einen Code oder `spaces/{id}` über `spaces.get` auf:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Führen Sie vor Medienarbeiten eine Vorabprüfung aus:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Listen Sie Meeting-Artefakte und Anwesenheit auf, nachdem Meet Konferenzdatensätze erstellt hat:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Mit `--meeting` verwenden `artifacts` und `attendance` standardmäßig den neuesten Konferenzdatensatz.
Übergeben Sie `--all-conference-records`, wenn Sie jeden aufbewahrten Datensatz
für dieses Meeting möchten.

Die Kalendersuche kann die Meeting-URL aus Google Calendar auflösen, bevor
Meet-Artefakte gelesen werden:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` durchsucht den heutigen `primary`-Kalender nach einem Calendar-Ereignis mit einem
Google Meet-Link. Verwenden Sie `--event <query>`, um passenden Ereignistext zu durchsuchen, und
`--calendar <id>` für einen nicht primären Kalender. Die Kalendersuche erfordert eine frische
OAuth-Anmeldung, die den schreibgeschützten Scope für Calendar-Ereignisse enthält.
`calendar-events` zeigt eine Vorschau der passenden Meet-Ereignisse und markiert das Ereignis, das
`latest`, `artifacts`, `attendance` oder `export` auswählen wird.

Wenn Sie die Konferenzdatensatz-ID bereits kennen, adressieren Sie sie direkt:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Beenden Sie eine aktive Konferenz für einen per API erstellten Space, wenn Sie den
Raum nach dem Anruf schließen möchten:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Dies ruft Google Meet `spaces.endActiveConference` auf und erfordert OAuth mit dem
Scope `meetings.space.created` für einen Space, den das autorisierte Konto verwalten kann.
OpenClaw akzeptiert eine Meet-URL, einen Meeting-Code oder `spaces/{id}` als Eingabe und löst sie
in die API-Space-Ressource auf, bevor die aktive Konferenz beendet wird.
Dies ist getrennt von `googlemeet leave`: `leave` beendet die lokale/Sitzungs-
Teilnahme von OpenClaw, während `end-active-conference` Google Meet auffordert, die aktive
Konferenz für den Space zu beenden.

Schreiben Sie einen lesbaren Bericht:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-attendance.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` gibt Metadaten zum Konferenzdatensatz sowie Metadaten zu Teilnehmern, Aufzeichnungen,
Transkripten, strukturierten Transkript-Einträgen und Smart-Note-Ressourcen zurück, wenn
Google sie für das Meeting bereitstellt. Verwenden Sie `--no-transcript-entries`, um die
Eintragssuche bei großen Meetings zu überspringen. `attendance` erweitert Teilnehmer zu
Teilnehmersitzungszeilen mit erstem/letztem Sichtungszeitpunkt, Gesamtdauer der Sitzung,
Kennzeichnungen für Verspätung/frühes Verlassen und zusammengeführten doppelten Teilnehmerressourcen nach angemeldetem
Benutzer oder Anzeigenamen. Übergeben Sie `--no-merge-duplicates`, um rohe Teilnehmer-
ressourcen getrennt zu halten, `--late-after-minutes`, um die Verspätungserkennung anzupassen, und
`--early-before-minutes`, um die Erkennung für frühes Verlassen anzupassen.

`export` schreibt einen Ordner mit `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` und `manifest.json`.
`manifest.json` zeichnet die gewählte Eingabe, Exportoptionen, Konferenzdatensätze,
Ausgabedateien, Zählwerte, Token-Quelle, das Calendar-Ereignis, wenn eines verwendet wurde, und alle
Warnungen zu teilweisem Abruf auf. Übergeben Sie `--zip`, um zusätzlich ein portables Archiv neben
dem Ordner zu schreiben. Übergeben Sie `--include-doc-bodies`, um verknüpfte Transkript- und
Smart-Note-Google-Docs-Texte über Google Drive `files.export` zu exportieren; dies erfordert eine
frische OAuth-Anmeldung, die den schreibgeschützten Drive Meet-Scope enthält. Ohne
`--include-doc-bodies` enthalten Exporte nur Meet-Metadaten und strukturierte Transkript-
Einträge. Wenn Google einen teilweisen Artefaktfehler zurückgibt, etwa einen Smart-Note-
Listing-, Transkript-Eintrags- oder Drive-Dokumenttext-Fehler, behalten Zusammenfassung und
Manifest die Warnung bei, statt den gesamten Export fehlschlagen zu lassen.
Verwenden Sie `--dry-run`, um dieselben Artefakt-/Anwesenheitsdaten abzurufen und das
Manifest-JSON auszugeben, ohne den Ordner oder die ZIP-Datei zu erstellen. Das ist nützlich, bevor
Sie einen großen Export schreiben oder wenn ein Agent nur Zählwerte, ausgewählte Datensätze und
Warnungen benötigt.

Agenten können dasselbe Bundle auch über das `google_meet`-Tool erstellen:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

Setzen Sie `"dryRun": true`, um nur das Exportmanifest zurückzugeben und Dateischreibvorgänge zu überspringen.

Agenten können auch einen API-gestützten Raum mit einer expliziten Zugriffsrichtlinie erstellen:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

Und sie können die aktive Konferenz für einen bekannten Raum beenden:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

Für eine Listen-zuerst-Validierung sollten Agenten `test_listen` verwenden, bevor sie behaupten, dass das
Meeting nützlich ist:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Führen Sie den geschützten Live-Smoke gegen ein echtes aufbewahrtes Meeting aus:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Führen Sie die Live-Browserprobe mit Listen-zuerst gegen ein Meeting aus, in dem jemand
spricht und Meet-Untertitel verfügbar sind:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Live-Smoke-Umgebung:

- `OPENCLAW_LIVE_TEST=1` aktiviert geschützte Live-Tests.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` verweist auf eine aufbewahrte Meet-URL, einen Code oder
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` oder `GOOGLE_MEET_CLIENT_ID` stellt die OAuth-
  Client-ID bereit.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` oder `GOOGLE_MEET_REFRESH_TOKEN` stellt
  das Refresh-Token bereit.
- Optional: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` und
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` verwenden dieselben Fallback-Namen
  ohne das Präfix `OPENCLAW_`.

Der Basis-Live-Smoke für Artefakte/Anwesenheit benötigt
`https://www.googleapis.com/auth/meetings.space.readonly` und
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Die Kalendersuche
benötigt `https://www.googleapis.com/auth/calendar.events.readonly`. Der Export von Drive-
Dokumenttexten benötigt
`https://www.googleapis.com/auth/drive.meet.readonly`.

Erstellen Sie einen frischen Meet-Space:

```bash
openclaw googlemeet create
```

Der Befehl gibt die neue `meeting uri`, die Quelle und die Beitrittssitzung aus. Mit OAuth-
Anmeldedaten verwendet er die offizielle Google Meet API. Ohne OAuth-Anmeldedaten verwendet er
das angemeldete Browserprofil des angehefteten Chrome-Node als Fallback. Agenten können
das `google_meet`-Tool mit `action: "create"` verwenden, um in einem Schritt zu erstellen und beizutreten.
Für reine URL-Erstellung übergeben Sie `"join": false`.

Beispiel-JSON-Ausgabe aus dem Browser-Fallback:

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

Wenn der Browser-Fallback auf eine Google-Anmeldung oder einen Meet-Berechtigungsblocker stößt, bevor er
die URL erstellen kann, gibt die Gateway-Methode eine fehlgeschlagene Antwort zurück und das
`google_meet`-Tool gibt strukturierte Details statt einer einfachen Zeichenfolge zurück:

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

Wenn ein Agent `manualActionRequired: true` sieht, sollte er die
`manualActionMessage` plus den Browser-Node-/Tab-Kontext melden und keine neuen
Meet-Tabs öffnen, bis der Operator den Browser-Schritt abgeschlossen hat.

Beispiel-JSON-Ausgabe aus der API-Erstellung:

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

Beim Erstellen eines Meet wird standardmäßig beigetreten. Der Chrome- oder Chrome-node-Transport benötigt weiterhin ein angemeldetes Google Chrome-Profil, um über den Browser beizutreten. Wenn das Profil abgemeldet ist, meldet OpenClaw `manualActionRequired: true` oder einen Browser-Fallback-Fehler und fordert den Operator auf, die Google-Anmeldung abzuschließen, bevor er es erneut versucht.

Setzen Sie `preview.enrollmentAcknowledged: true` erst, nachdem Sie bestätigt haben, dass Ihr Cloud-Projekt, OAuth-Prinzipal und die Besprechungsteilnehmer beim Google Workspace Developer Preview Program für Meet-Medien-APIs registriert sind.

## Konfiguration

Der gemeinsame Chrome-Agent-Pfad benötigt nur ein aktiviertes Plugin, BlackHole, SoX, einen Schlüssel für einen Realtime-Transkriptions-Provider und einen konfigurierten OpenClaw-TTS-Provider. OpenAI ist der Standard-Transkriptions-Provider; setzen Sie `realtime.voiceProvider` auf `"google"` und `realtime.model`, um Google Gemini Live für den `bidi`-Modus zu verwenden, ohne den Standard-Transkriptions-Provider des Agent-Modus zu ändern:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Legen Sie die Plugin-Konfiguration unter `plugins.entries.google-meet.config` fest:

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

Standardwerte:

- `defaultTransport: "chrome"`
- `defaultMode: "agent"` (`"realtime"` wird nur als Legacy-Kompatibilitätsalias für `"agent"` akzeptiert; neue Tool-Aufrufe sollten `"agent"` verwenden)
- `chromeNode.node`: optionale Node-ID, optionaler Name oder optionale IP für `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: Name, der auf dem Meet-Gastbildschirm im abgemeldeten Zustand verwendet wird
- `chrome.autoJoin: true`: Best-Effort-Ausfüllen des Gastnamens und Klick auf „Jetzt teilnehmen“ über die OpenClaw-Browserautomatisierung auf `chrome-node`
- `chrome.reuseExistingTab: true`: einen vorhandenen Meet-Tab aktivieren, statt Duplikate zu öffnen
- `chrome.waitForInCallMs: 20000`: warten, bis der Meet-Tab meldet, dass er sich im Anruf befindet, bevor die Talkback-Einführung ausgelöst wird
- `chrome.audioFormat: "pcm16-24khz"`: Audioformat für Befehlspaare. Verwenden Sie `"g711-ulaw-8khz"` nur für Legacy- oder benutzerdefinierte Befehlspaare, die weiterhin Telefonie-Audio ausgeben.
- `chrome.audioBufferBytes: 4096`: SoX-Verarbeitungspuffer für generierte Chrome-Audiobefehle von Befehlspaaren. Dies ist die Hälfte des standardmäßigen 8192-Byte-Puffers von SoX, wodurch die Standard-Pipe-Latenz reduziert wird, während Spielraum bleibt, ihn auf ausgelasteten Hosts zu erhöhen. Werte unter dem SoX-Minimum werden auf 17 Byte begrenzt.
- `chrome.audioInputCommand`: SoX-Befehl, der von CoreAudio `BlackHole 2ch` liest und Audio in `chrome.audioFormat` schreibt
- `chrome.audioOutputCommand`: SoX-Befehl, der Audio in `chrome.audioFormat` liest und nach CoreAudio `BlackHole 2ch` schreibt
- `chrome.bargeInInputCommand`: optionaler lokaler Mikrofonbefehl, der vorzeichenbehaftetes 16-Bit-Little-Endian-Mono-PCM für die Erkennung menschlicher Unterbrechungen schreibt, während die Assistentenwiedergabe aktiv ist. Dies gilt derzeit für die vom Gateway gehostete `chrome`-Befehlspaar-Bridge.
- `chrome.bargeInRmsThreshold: 650`: RMS-Pegel, der bei `chrome.bargeInInputCommand` als menschliche Unterbrechung zählt
- `chrome.bargeInPeakThreshold: 2500`: Spitzenpegel, der bei `chrome.bargeInInputCommand` als menschliche Unterbrechung zählt
- `chrome.bargeInCooldownMs: 900`: Mindestverzögerung zwischen wiederholtem Aufheben menschlicher Unterbrechungen
- `mode: "agent"`: Standard-Talkback-Modus. Teilnehmersprache wird vom konfigurierten Realtime-Transkriptions-Provider transkribiert, in einer besprechungsspezifischen Sub-Agent-Sitzung an den konfigurierten OpenClaw-Agent gesendet und über die normale OpenClaw-TTS-Laufzeit zurückgesprochen.
- `mode: "bidi"`: Fallback-Modus für ein direktes bidirektionales Realtime-Modell. Der Realtime-Sprach-Provider beantwortet Teilnehmersprache direkt und kann `openclaw_agent_consult` für tiefere oder toolgestützte Antworten aufrufen.
- `mode: "transcribe"`: reiner Beobachtungsmodus ohne Talkback-Bridge.
- `realtime.provider: "openai"`: Kompatibilitäts-Fallback, der verwendet wird, wenn die unten stehenden bereichsbezogenen Provider-Felder nicht gesetzt sind.
- `realtime.transcriptionProvider: "openai"`: Provider-ID, die vom `agent`-Modus für Realtime-Transkription verwendet wird.
- `realtime.voiceProvider`: Provider-ID, die vom `bidi`-Modus für direkte Realtime-Sprache verwendet wird. Setzen Sie dies auf `"google"`, um Gemini Live zu verwenden, während die Transkription im Agent-Modus auf OpenAI bleibt.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: kurze gesprochene Antworten, mit `openclaw_agent_consult` für tiefere Antworten
- `realtime.introMessage`: kurze gesprochene Bereitschaftsprüfung, wenn die Realtime-Bridge verbunden wird; setzen Sie dies auf `""`, um lautlos beizutreten
- `realtime.agentId`: optionale OpenClaw-Agent-ID für `openclaw_agent_consult`; Standardwert ist `main`

Optionale Überschreibungen:

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
    model: "gemini-2.5-flash-native-audio-preview-12-2025",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        voice: "Kore",
      },
    },
  },
}
```

ElevenLabs für Hören und Sprechen im Agent-Modus:

```json5
{
  messages: {
    tts: {
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          modelId: "eleven_v3",
          voiceId: "pMsXgVXv3BLzUgSXRplE",
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

Die persistente Meet-Stimme stammt aus `messages.tts.providers.elevenlabs.voiceId`. Agent-Antworten können außerdem antwortbezogene `[[tts:voiceId=... model=eleven_v3]]`-Direktiven verwenden, wenn TTS-Modellüberschreibungen aktiviert sind, aber die Konfiguration ist der deterministische Standard für Besprechungen. Beim Beitritt sollten die Logs `transcriptionProvider=elevenlabs` anzeigen, und jede gesprochene Antwort sollte `provider=elevenlabs model=eleven_v3 voice=<voiceId>` protokollieren.

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

`voiceCall.enabled` ist standardmäßig `true`; mit Twilio-Transport delegiert es den eigentlichen PSTN-Anruf, DTMF und die Einführungsbegrüßung an das Voice Call-Plugin. Voice Call spielt die DTMF-Sequenz ab, bevor der Realtime-Medienstrom geöffnet wird, und verwendet dann den gespeicherten Einführungstext als erste Realtime-Begrüßung. Wenn `voice-call` nicht aktiviert ist, kann Google Meet den Wählplan weiterhin validieren und aufzeichnen, den Twilio-Anruf jedoch nicht platzieren.

## Tool

Agenten können das `google_meet`-Tool verwenden:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Verwenden Sie `transport: "chrome"`, wenn Chrome auf dem Gateway-Host läuft. Verwenden Sie `transport: "chrome-node"`, wenn Chrome auf einer gekoppelten Node wie einer Parallels-VM läuft. In beiden Fällen laufen die Modell-Provider und `openclaw_agent_consult` auf dem Gateway-Host, sodass Modell-Anmeldedaten dort bleiben. Mit dem standardmäßigen `mode: "agent"` übernimmt der Realtime-Transkriptions-Provider das Zuhören, der konfigurierte OpenClaw-Agent erzeugt die Antwort, und reguläres OpenClaw-TTS spricht sie in Meet. Verwenden Sie `mode: "bidi"`, wenn das Realtime-Sprachmodell direkt antworten soll. Der rohe Wert `mode: "realtime"` wird weiterhin als Legacy-Kompatibilitätsalias für `mode: "agent"` akzeptiert, aber im Agent-Tool-Schema nicht mehr beworben. Logs im Agent-Modus enthalten beim Bridge-Start den aufgelösten Transkriptions-Provider und das Modell sowie nach jeder synthetisierten Antwort den TTS-Provider, das Modell, die Stimme, das Ausgabeformat und die Abtastrate.

Verwenden Sie `action: "status"`, um aktive Sitzungen aufzulisten oder eine Sitzungs-ID zu prüfen. Verwenden Sie `action: "speak"` mit `sessionId` und `message`, damit der Realtime-Agent sofort spricht. Verwenden Sie `action: "test_speech"`, um die Sitzung zu erstellen oder wiederzuverwenden, eine bekannte Phrase auszulösen und den `inCall`-Zustand zurückzugeben, wenn der Chrome-Host ihn melden kann. `test_speech` erzwingt immer `mode: "agent"` und schlägt fehl, wenn die Ausführung in `mode: "transcribe"` angefordert wird, da reine Beobachtungssitzungen absichtlich keine Sprache ausgeben können. Das Ergebnis `speechOutputVerified` basiert darauf, dass die Realtime-Audioausgabebytes während dieses Testaufrufs zunehmen; daher zählt eine wiederverwendete Sitzung mit älterem Audio nicht als neue erfolgreiche Sprachprüfung. Verwenden Sie `action: "leave"`, um eine Sitzung als beendet zu markieren.

`status` enthält Chrome-Zustandsdaten, wenn verfügbar:

- `inCall`: Chrome scheint sich im Meet-Anruf zu befinden
- `micMuted`: Best-Effort-Zustand des Meet-Mikrofons
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: das Browserprofil benötigt eine manuelle Anmeldung, Zulassung durch den Meet-Host, Berechtigungen oder eine Browsersteuerungsreparatur, bevor Sprache funktionieren kann
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: ob verwaltete Chrome-Sprache jetzt erlaubt ist. `speechReady: false` bedeutet, dass OpenClaw die Einführungs- oder Testphrase nicht in die Audio-Bridge gesendet hat.
- `providerConnected` / `realtimeReady`: Zustand der Realtime-Sprach-Bridge
- `lastInputAt` / `lastOutputAt`: zuletzt von der Bridge gesehenes oder an sie gesendetes Audio
- `audioOutputRouted` / `audioOutputDeviceLabel`: ob die Medienausgabe des Meet-Tabs aktiv an das von der Bridge verwendete BlackHole-Gerät geleitet wurde
- `lastSuppressedInputAt` / `suppressedInputBytes`: local loopback-Eingabe, die ignoriert wurde, während die Assistentenwiedergabe aktiv ist

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Agent- und Bidi-Modi

Der Chrome-`agent`-Modus ist für das Verhalten „mein Agent ist in der Besprechung“ optimiert. Der Realtime-Transkriptions-Provider hört das Besprechungsaudio, finale Teilnehmertranskripte werden durch den konfigurierten OpenClaw-Agent geleitet, und die Antwort wird über die normale OpenClaw-TTS-Laufzeit gesprochen. Setzen Sie `mode: "bidi"`, wenn das Realtime-Sprachmodell direkt antworten soll. Nahe beieinanderliegende finale Transkriptfragmente werden vor der Konsultation zusammengeführt, damit ein gesprochener Turn nicht mehrere veraltete Teilantworten erzeugt. Realtime-Eingabe wird außerdem unterdrückt, während in die Warteschlange gestelltes Assistentenaudio noch abgespielt wird, und kürzliche assistentenähnliche Transkript-Echos werden vor der Agent-Konsultation ignoriert, damit BlackHole-local loopback nicht dazu führt, dass der Agent auf seine eigene Sprache antwortet.

| Modus   | Wer die Antwort bestimmt      | Sprachausgabepfad                     | Verwendung, wenn                                      |
| ------- | ----------------------------- | ------------------------------------- | ----------------------------------------------------- |
| `agent` | Der konfigurierte OpenClaw-Agent | Normale OpenClaw-TTS-Laufzeit       | Sie das Verhalten „mein Agent ist in der Besprechung“ wünschen |
| `bidi`  | Das Realtime-Sprachmodell     | Audioantwort des Realtime-Sprach-Providers | Sie die Sprach-Konversationsschleife mit der niedrigsten Latenz wünschen |

Im `bidi`-Modus kann das Realtime-Modell `openclaw_agent_consult` aufrufen, wenn es tieferes Reasoning, aktuelle Informationen oder normale OpenClaw-Tools benötigt.

Das Consult-Tool führt im Hintergrund den regulären OpenClaw-Agent mit dem aktuellen Kontext des
Meeting-Transkripts aus und gibt eine prägnante gesprochene Antwort zurück. Im Modus `agent`
sendet OpenClaw diese Antwort direkt an die TTS-Laufzeit; im Modus `bidi` kann das
Realtime-Sprachmodell das Consult-Ergebnis in das Meeting zurücksprechen. Es verwendet
dieselbe gemeinsame Consult-Mechanik wie Voice Call.

Standardmäßig werden Consults mit dem Agent `main` ausgeführt. Legen Sie `realtime.agentId` fest, wenn eine
Meet-Lane einen dedizierten OpenClaw-Agent-Workspace, Modellvorgaben,
Tool-Richtlinie, Speicher und Sitzungsverlauf verwenden soll.

Consults im Agent-Modus verwenden einen sitzungsspezifischen Schlüssel
`agent:<id>:subagent:google-meet:<session>` pro Meeting, sodass Folgefragen den
Meeting-Kontext beibehalten und zugleich die normale Agent-Richtlinie vom konfigurierten
Agent übernehmen.

`realtime.toolPolicy` steuert den Consult-Lauf:

- `safe-read-only`: stellt das Consult-Tool bereit und beschränkt den regulären Agent auf
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` und
  `memory_get`.
- `owner`: stellt das Consult-Tool bereit und erlaubt dem regulären Agent, die normale
  Agent-Tool-Richtlinie zu verwenden.
- `none`: stellt dem Realtime-Sprachmodell das Consult-Tool nicht bereit.

Der Consult-Sitzungsschlüssel ist pro Meet-Sitzung abgegrenzt, sodass nachfolgende Consult-Aufrufe
während desselben Meetings den vorherigen Consult-Kontext wiederverwenden können.

Um eine gesprochene Bereitschaftsprüfung zu erzwingen, nachdem Chrome dem Anruf vollständig beigetreten ist:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Für den vollständigen Beitreten-und-Sprechen-Smoke:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Live-Test-Checkliste

Verwenden Sie diese Abfolge, bevor Sie ein Meeting an einen unbeaufsichtigten Agent übergeben:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Erwarteter Chrome-node-Zustand:

- `googlemeet setup` ist vollständig grün.
- `googlemeet setup` enthält `chrome-node-connected`, wenn Chrome-node der
  Standard-Transport ist oder ein Node festgelegt wurde.
- `nodes status` zeigt den ausgewählten Node als verbunden an.
- Der ausgewählte Node gibt sowohl `googlemeet.chrome` als auch `browser.proxy` bekannt.
- Der Meet-Tab tritt dem Anruf bei und `test-speech` gibt den Chrome-Zustand mit
  `inCall: true` zurück.

Für einen Remote-Chrome-Host wie eine Parallels-macOS-VM ist dies die kürzeste
sichere Prüfung nach dem Aktualisieren des Gateway oder der VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Das weist nach, dass das Gateway-Plugin geladen ist, der VM-Node mit dem
aktuellen Token verbunden ist und die Meet-Audio-Bridge verfügbar ist, bevor ein Agent einen
echten Meeting-Tab öffnet.

Verwenden Sie für einen Twilio-Smoke ein Meeting, das Telefoneinwahldaten bereitstellt:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Erwarteter Twilio-Zustand:

- `googlemeet setup` enthält grüne Prüfungen für `twilio-voice-call-plugin`,
  `twilio-voice-call-credentials` und `twilio-voice-call-webhook`.
- `voicecall` ist nach dem Gateway-Neuladen in der CLI verfügbar.
- Die zurückgegebene Sitzung hat `transport: "twilio"` und eine `twilio.voiceCallId`.
- `openclaw logs --follow` zeigt, dass DTMF-TwiML vor Realtime-TwiML bereitgestellt wurde, anschließend eine
  Realtime-Bridge mit eingereihter erster Begrüßung.
- `googlemeet leave <sessionId>` legt den delegierten Sprachanruf auf.

## Fehlerbehebung

### Agent kann das Google-Meet-Tool nicht sehen

Bestätigen Sie, dass das Plugin in der Gateway-Konfiguration aktiviert ist, und laden Sie das Gateway neu:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Wenn Sie gerade `plugins.entries.google-meet` bearbeitet haben, starten oder laden Sie das Gateway neu.
Der laufende Agent sieht nur Plugin-Tools, die vom aktuellen Gateway-Prozess
registriert wurden.

Auf Nicht-macOS-Gateway-Hosts bleibt das agentseitige Tool `google_meet` sichtbar,
aber lokale Chrome-Talkback-Aktionen werden blockiert, bevor sie die Audio-Bridge erreichen.
Lokales Chrome-Talkback-Audio hängt derzeit von macOS `BlackHole 2ch` ab, daher
sollten Linux-Agents `mode: "transcribe"`, Twilio-Einwahl oder einen macOS-
`chrome-node`-Host anstelle des standardmäßigen lokalen Chrome-Agent-Pfads verwenden.

### Kein verbundener Google-Meet-fähiger Node

Führen Sie auf dem Node-Host Folgendes aus:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Genehmigen Sie auf dem Gateway-Host den Node und überprüfen Sie die Befehle:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Der Node muss verbunden sein und `googlemeet.chrome` sowie `browser.proxy` auflisten.
Die Gateway-Konfiguration muss diese Node-Befehle zulassen:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Wenn `googlemeet setup` bei `chrome-node-connected` fehlschlägt oder das Gateway-Log
`gateway token mismatch` meldet, installieren oder starten Sie den Node mit dem aktuellen Gateway-
Token neu. Für ein LAN-Gateway bedeutet das normalerweise:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Laden Sie anschließend den Node-Dienst neu und führen Sie erneut aus:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Browser öffnet sich, aber Agent kann nicht beitreten

Führen Sie `googlemeet test-listen` für reine Beobachterbeitritte oder `googlemeet test-speech`
für Realtime-Beitritte aus und prüfen Sie anschließend den zurückgegebenen Chrome-Zustand. Wenn eine der Prüfungen
`manualActionRequired: true` meldet, zeigen Sie dem Bediener `manualActionMessage`
an und beenden Sie Wiederholungen, bis die Browser-Aktion abgeschlossen ist.

Häufige manuelle Aktionen:

- Melden Sie sich im Chrome-Profil an.
- Lassen Sie den Gast über das Meet-Host-Konto zu.
- Gewähren Sie Chrome Mikrofon-/Kameraberechtigungen, wenn die native Berechtigungsabfrage
  von Chrome angezeigt wird.
- Schließen oder reparieren Sie einen festhängenden Meet-Berechtigungsdialog.

Melden Sie nicht „nicht angemeldet“, nur weil Meet „Do you want people to
hear you in the meeting?“ anzeigt. Das ist der Meet-Zwischenschritt zur Audioauswahl; OpenClaw
klickt per Browser-Automatisierung auf **Use microphone**, sofern verfügbar, und wartet weiter
auf den echten Meeting-Zustand. Beim reinen Erstellungs-Browser-Fallback kann OpenClaw
auf **Continue without microphone** klicken, weil das Erstellen der URL den
Realtime-Audiopfad nicht benötigt.

### Meeting-Erstellung schlägt fehl

`googlemeet create` verwendet zuerst den Google-Meet-API-Endpunkt `spaces.create`,
wenn OAuth-Anmeldedaten konfiguriert sind. Ohne OAuth-Anmeldedaten fällt es
auf den festgelegten Chrome-Node-Browser zurück. Bestätigen Sie:

- Für API-Erstellung: `oauth.clientId` und `oauth.refreshToken` sind konfiguriert,
  oder passende Umgebungsvariablen `OPENCLAW_GOOGLE_MEET_*` sind vorhanden.
- Für API-Erstellung: Das Refresh-Token wurde erstellt, nachdem Unterstützung für Erstellung
  hinzugefügt wurde. Älteren Tokens fehlt möglicherweise der Scope `meetings.space.created`; führen Sie
  `openclaw googlemeet auth login --json` erneut aus und aktualisieren Sie die Plugin-Konfiguration.
- Für Browser-Fallback: `defaultTransport: "chrome-node"` und
  `chromeNode.node` zeigen auf einen verbundenen Node mit `browser.proxy` und
  `googlemeet.chrome`.
- Für Browser-Fallback: Das OpenClaw-Chrome-Profil auf diesem Node ist bei
  Google angemeldet und kann `https://meet.google.com/new` öffnen.
- Für Browser-Fallback: Wiederholungen verwenden einen bestehenden Tab
  `https://meet.google.com/new` oder einen Google-Konto-Abfragetab wieder, bevor ein neuer Tab geöffnet wird. Wenn ein Agent ein Timeout erreicht,
  wiederholen Sie den Tool-Aufruf, statt manuell einen weiteren Meet-Tab zu öffnen.
- Für Browser-Fallback: Wenn das Tool `manualActionRequired: true` zurückgibt, verwenden Sie
  die zurückgegebenen Werte `browser.nodeId`, `browser.targetId`, `browserUrl` und
  `manualActionMessage`, um den Bediener anzuleiten. Wiederholen Sie nicht in einer Schleife, bis diese
  Aktion abgeschlossen ist.
- Für Browser-Fallback: Wenn Meet „Do you want people to hear you in the
  meeting?“ anzeigt, lassen Sie den Tab geöffnet. OpenClaw sollte per Browser-
  Automatisierung auf **Use microphone** oder, beim reinen Erstellungs-Fallback, auf **Continue without microphone**
  klicken und weiter auf die generierte Meet-URL warten. Wenn das nicht gelingt, sollte der
  Fehler `meet-audio-choice-required` und nicht `google-login-required` erwähnen.

### Agent tritt bei, spricht aber nicht

Prüfen Sie den Realtime-Pfad:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Verwenden Sie `mode: "agent"` für den normalen Pfad STT -> OpenClaw-Agent -> TTS-Talkback
oder `mode: "bidi"` für den direkten Realtime-Sprach-Fallback. `mode: "transcribe"`
startet die Talkback-Bridge absichtlich nicht. Führen Sie für reine Beobachter-Debugs
`openclaw googlemeet status --json <session-id>` aus, nachdem Teilnehmende gesprochen haben,
und prüfen Sie `captioning`, `transcriptLines` und `lastCaptionText`. Wenn `inCall`
true ist, aber `transcriptLines` bei `0` bleibt, sind Meet-Untertitel möglicherweise deaktiviert, seit der
Beobachter installiert wurde hat niemand gesprochen, die Meet-Oberfläche hat sich geändert oder Live-
Untertitel sind für die Meeting-Sprache/das Konto nicht verfügbar.

`googlemeet test-speech` prüft immer den Realtime-Pfad und meldet, ob
Bridge-Ausgabebytes für diesen Aufruf beobachtet wurden. Wenn `speechOutputVerified` false ist und
`speechOutputTimedOut` true ist, hat der Realtime-Provider die
Äußerung möglicherweise angenommen, aber OpenClaw hat keine neuen Ausgabebytes zur Chrome-Audio-
Bridge gelangen sehen.

Überprüfen Sie außerdem:

- Ein Realtime-Provider-Schlüssel ist auf dem Gateway-Host verfügbar, etwa
  `OPENAI_API_KEY` oder `GEMINI_API_KEY`.
- `BlackHole 2ch` ist auf dem Chrome-Host sichtbar.
- `sox` ist auf dem Chrome-Host vorhanden.
- Meet-Mikrofon und -Lautsprecher sind über den von OpenClaw verwendeten virtuellen Audiopfad geroutet.
  `doctor` sollte bei lokalen Chrome-Realtime-Beitritten `meet output routed: yes` anzeigen.

`googlemeet doctor [session-id]` gibt Sitzung, Node, In-Call-Zustand,
Grund für manuelle Aktion, Realtime-Provider-Verbindung, `realtimeReady`, Audio-
Ein-/Ausgabeaktivität, letzte Audio-Zeitstempel, Byte-Zähler und Browser-URL aus.
Verwenden Sie `googlemeet status [session-id] --json`, wenn Sie das rohe JSON benötigen. Verwenden Sie
`googlemeet doctor --oauth`, wenn Sie die Google-Meet-OAuth-Aktualisierung prüfen müssen,
ohne Tokens offenzulegen; fügen Sie `--meeting` oder `--create-space` hinzu, wenn Sie außerdem einen
Google-Meet-API-Nachweis benötigen.

Wenn ein Agent ein Timeout erreicht hat und Sie sehen können, dass bereits ein Meet-Tab geöffnet ist, prüfen Sie diesen Tab,
ohne einen weiteren zu öffnen:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Die entsprechende Tool-Aktion ist `recover_current_tab`. Sie fokussiert und prüft einen
bestehenden Meet-Tab für den ausgewählten Transport. Mit `chrome` verwendet sie lokale
Browsersteuerung über das Gateway; mit `chrome-node` verwendet sie den konfigurierten
Chrome-Node. Sie öffnet keinen neuen Tab und erstellt keine neue Sitzung; sie meldet den
aktuellen Blocker, etwa Anmeldung, Zulassung, Berechtigungen oder Audioauswahlzustand.
Der CLI-Befehl spricht mit dem konfigurierten Gateway, daher muss das Gateway laufen;
`chrome-node` erfordert außerdem, dass der Chrome-Node verbunden ist.

### Twilio-Einrichtungsprüfungen schlagen fehl

`twilio-voice-call-plugin` schlägt fehl, wenn `voice-call` nicht erlaubt oder nicht aktiviert ist.
Fügen Sie es zu `plugins.allow` hinzu, aktivieren Sie `plugins.entries.voice-call` und laden Sie das
Gateway neu.

`twilio-voice-call-credentials` schlägt fehl, wenn dem Twilio-Backend Konto-
SID, Auth-Token oder Absendernummer fehlen. Setzen Sie diese auf dem Gateway-Host:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` schlägt fehl, wenn `voice-call` keine öffentliche Webhook-
Bereitstellung hat oder wenn `publicUrl` auf Loopback- oder privaten Netzwerkbereich zeigt.
Setzen Sie `plugins.entries.voice-call.config.publicUrl` auf die öffentliche Provider-URL oder
konfigurieren Sie einen `voice-call`-Tunnel/eine Tailscale-Bereitstellung.

Loopback- und private URLs sind für Carrier-Callbacks nicht gültig. Verwenden Sie nicht
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` oder `fd00::/8` als `publicUrl`.

Für eine stabile öffentliche URL:

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

Verwenden Sie für die lokale Entwicklung einen Tunnel oder eine Tailscale-Freigabe
anstelle einer privaten Host-URL:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Starten Sie anschließend den Gateway neu oder laden Sie ihn neu und führen Sie
Folgendes aus:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` prüft standardmäßig nur die Bereitschaft. So führen Sie einen
Testlauf für eine bestimmte Nummer aus:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Fügen Sie `--yes` nur hinzu, wenn Sie absichtlich einen echten ausgehenden
Benachrichtigungsanruf auslösen möchten:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio-Anruf startet, tritt dem Meeting aber nie bei

Bestätigen Sie, dass das Meet-Ereignis telefonische Einwahldaten bereitstellt.
Übergeben Sie die exakte Einwahlnummer und PIN oder eine benutzerdefinierte
DTMF-Sequenz:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Verwenden Sie führende `w` oder Kommas in `--dtmf-sequence`, wenn der Provider
vor der PIN-Eingabe eine Pause benötigt.

Wenn der Telefonanruf erstellt wird, die Meet-Teilnehmerliste den
Einwahlteilnehmer aber nie anzeigt:

- Führen Sie `openclaw googlemeet doctor <session-id>` aus, um die delegierte
  Twilio-Anruf-ID zu bestätigen, zu prüfen, ob DTMF in die Warteschlange gestellt
  wurde, und ob die Begrüßung angefordert wurde.
- Führen Sie `openclaw voicecall status --call-id <id>` aus und bestätigen Sie,
  dass der Anruf noch aktiv ist.
- Führen Sie `openclaw voicecall tail` aus und prüfen Sie, ob Twilio-Webhooks am
  Gateway ankommen.
- Führen Sie `openclaw logs --follow` aus und suchen Sie nach der
  Twilio-Meet-Sequenz: Google Meet delegiert den Beitritt, Voice Call startet
  die Telefonverbindung, Google Meet wartet `voiceCall.dtmfDelayMs`, sendet DTMF
  mit `voicecall.dtmf`, wartet `voiceCall.postDtmfSpeechDelayMs` und fordert dann
  die Begrüßungsansage mit `voicecall.speak` an.
- Führen Sie erneut `openclaw googlemeet setup --transport twilio` aus; eine
  erfolgreiche Setup-Prüfung ist erforderlich, beweist aber nicht, dass die
  Meeting-PIN-Sequenz korrekt ist.
- Bestätigen Sie, dass die Einwahlnummer zur selben Meet-Einladung und Region
  gehört wie die PIN.
- Erhöhen Sie `voiceCall.dtmfDelayMs`, wenn Meet langsam antwortet oder das
  Anruftranskript nach dem Senden von DTMF weiterhin die Aufforderung zur Eingabe
  einer PIN zeigt.
- Wenn der Teilnehmer beitritt, Sie die Begrüßung aber nicht hören, prüfen Sie
  `openclaw logs --follow` auf die post-DTMF-Anforderung `voicecall.speak` und
  entweder die Medienstream-TTS-Wiedergabe oder den Twilio-`<Say>`-Fallback. Wenn
  das Anruftranskript weiterhin "enter the meeting PIN" enthält, ist die
  Telefonverbindung dem Meet-Raum noch nicht beigetreten; Meeting-Teilnehmer
  hören daher keine Sprache.

Wenn Webhooks nicht ankommen, debuggen Sie zuerst das Voice Call Plugin: Der
Provider muss `plugins.entries.voice-call.config.publicUrl` oder den
konfigurierten Tunnel erreichen. Siehe [Fehlerbehebung für Voice Call](/de/plugins/voice-call#troubleshooting).

## Hinweise

Die offizielle Medien-API von Google Meet ist auf Empfang ausgerichtet, daher
benötigt das Sprechen in einen Meet-Anruf weiterhin einen Teilnehmerpfad. Dieses
Plugin macht diese Grenze sichtbar: Chrome übernimmt die Teilnahme im Browser
und das lokale Audio-Routing; Twilio übernimmt die telefonische Einwahl.

Chrome-Talkback-Modi benötigen `BlackHole 2ch` plus entweder:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw besitzt
  die Bridge und leitet Audio in `chrome.audioFormat` zwischen diesen Befehlen
  und dem ausgewählten Provider weiter. Der Agent-Modus verwendet
  Echtzeittranskription plus reguläres TTS; der Bidi-Modus verwendet den
  Echtzeit-Sprach-Provider. Der Standardpfad für Chrome ist 24 kHz PCM16 mit
  `chrome.audioBufferBytes: 4096`; 8 kHz G.711 mu-law bleibt für ältere
  Befehlspaare verfügbar.
- `chrome.audioBridgeCommand`: Ein externer Bridge-Befehl besitzt den gesamten
  lokalen Audiopfad und muss nach dem Starten oder Validieren seines Daemons
  beendet werden. Dies ist nur für `bidi` gültig, da der `agent`-Modus direkten
  Zugriff auf Befehlspaare für TTS benötigt.

Wenn ein Agent das Tool `google_meet` im Agent-Modus aufruft, verzweigt die
Meeting-Beratersitzung das aktuelle Transkript des Aufrufers, bevor sie auf
Teilnehmersprache antwortet. Die Meet-Sitzung bleibt weiterhin getrennt
(`agent:<agentId>:subagent:google-meet:<sessionId>`), sodass Meeting-Folgeaktionen
das Aufrufertranskript nicht direkt verändern.

Für sauberes Duplex-Audio leiten Sie Meet-Ausgabe und Meet-Mikrofon über
separate virtuelle Geräte oder einen virtuellen Geräte-Graph im Stil von
Loopback. Ein einzelnes gemeinsam genutztes BlackHole-Gerät kann andere
Teilnehmer in den Anruf zurückspiegeln.

Mit der Chrome-Bridge über Befehlspaare kann `chrome.bargeInInputCommand` ein
separates lokales Mikrofon abhören und die Assistentenwiedergabe löschen, wenn
der Mensch zu sprechen beginnt. Dadurch bleibt menschliche Sprache vor der
Assistentenausgabe, selbst wenn die gemeinsam genutzte BlackHole-loopback-Eingabe
während der Assistentenwiedergabe vorübergehend unterdrückt wird. Wie
`chrome.audioInputCommand` und `chrome.audioOutputCommand` ist dies ein lokal vom
Betreiber konfigurierter Befehl. Verwenden Sie einen expliziten vertrauenswürdigen
Befehlspfad oder eine Argumentliste und verweisen Sie nicht auf Skripte aus nicht
vertrauenswürdigen Speicherorten.

`googlemeet speak` löst die aktive Talkback-Audiobridge für eine Chrome-Sitzung
aus. `googlemeet leave` stoppt diese Bridge. Bei Twilio-Sitzungen, die über das
Voice Call Plugin delegiert werden, legt `leave` auch den zugrunde liegenden
Sprachanruf auf. Verwenden Sie `googlemeet end-active-conference`, wenn Sie auch
die aktive Google Meet-Konferenz für einen API-verwalteten Bereich schließen
möchten.

## Verwandte Themen

- [Voice Call Plugin](/de/plugins/voice-call)
- [Sprechmodus](/de/nodes/talk)
- [Plugins erstellen](/de/plugins/building-plugins)
