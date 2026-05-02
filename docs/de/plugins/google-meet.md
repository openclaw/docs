---
read_when:
    - Sie möchten, dass ein OpenClaw-Agent an einem Google Meet-Anruf teilnimmt
    - Sie möchten, dass ein OpenClaw-Agent einen neuen Google Meet-Anruf erstellt
    - Sie konfigurieren Chrome, Chrome-Node oder Twilio als Google-Meet-Transport
summary: 'Google Meet-Plugin: Expliziten Meet-URLs über Chrome oder Twilio mit Standardwerten für Echtzeit-Sprachkommunikation beitreten'
title: Google Meet-Plugin
x-i18n:
    generated_at: "2026-05-02T20:50:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0dc515382d2cc7beacaf18a50b75cb0f4eda3038cfd8efe73ea3ce7b5007bc43
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet-Teilnehmerunterstützung für OpenClaw – das Plugin ist absichtlich explizit gestaltet:

- Es tritt nur einer expliziten `https://meet.google.com/...`-URL bei.
- Es kann über die Google Meet API einen neuen Meet-Raum erstellen und dann der
  zurückgegebenen URL beitreten.
- `realtime`-Sprache ist der Standardmodus.
- Realtime-Sprache kann bei Bedarf für tiefere Schlussfolgerungen oder Tools an
  den vollständigen OpenClaw-Agenten zurückrufen.
- Agenten wählen das Beitrittsverhalten mit `mode`: Verwenden Sie `realtime` für
  Live-Zuhören/Rücksprechen oder `transcribe`, um dem Browser beizutreten bzw.
  ihn zu steuern, ohne die Realtime-Sprachbrücke zu verwenden.
- Die Authentifizierung beginnt mit persönlichem Google OAuth oder einem bereits
  angemeldeten Chrome-Profil.
- Es gibt keine automatische Einwilligungsansage.
- Das standardmäßige Chrome-Audio-Backend ist `BlackHole 2ch`.
- Chrome kann lokal oder auf einem gekoppelten Node-Host ausgeführt werden.
- Twilio akzeptiert eine Einwahlnummer sowie eine optionale PIN oder
  DTMF-Sequenz; eine Meet-URL kann nicht direkt gewählt werden.
- Der CLI-Befehl ist `googlemeet`; `meet` ist für breitere
  Agenten-Telekonferenz-Workflows reserviert.

## Schnellstart

Installieren Sie die lokalen Audioabhängigkeiten und konfigurieren Sie einen
Backend-Provider für Realtime-Sprache. OpenAI ist der Standard; Google Gemini
Live funktioniert ebenfalls mit `realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` installiert das virtuelle Audiogerät `BlackHole 2ch`. Der
Installer von Homebrew erfordert einen Neustart, bevor macOS das Gerät verfügbar
macht:

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

Prüfen Sie die Einrichtung:

```bash
openclaw googlemeet setup
```

Die Setup-Ausgabe ist dafür gedacht, von Agenten gelesen zu werden, und ist
modusabhängig. Sie meldet Chrome-Profil, Node-Pinning und, für
Realtime-Chrome-Beitritte, die BlackHole/SoX-Audiobrücke sowie verzögerte
Realtime-Intro-Prüfungen. Für reine Beobachtungsbeitritte prüfen Sie denselben
Transport mit `--mode transcribe`; dieser Modus überspringt Realtime-Audio-
Voraussetzungen, weil er nicht über die Brücke zuhört oder spricht:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Wenn Twilio-Delegierung konfiguriert ist, meldet Setup außerdem, ob das
`voice-call`-Plugin, die Twilio-Zugangsdaten und die öffentliche Webhook-
Erreichbarkeit bereit sind. Behandeln Sie jede Prüfung mit `ok: false` als
Blocker für den geprüften Transport und Modus, bevor Sie einen Agenten um den
Beitritt bitten. Verwenden Sie `openclaw googlemeet setup --json` für Skripte
oder maschinenlesbare Ausgabe. Verwenden Sie `--transport chrome`,
`--transport chrome-node` oder `--transport twilio`, um einen bestimmten
Transport vorab zu prüfen, bevor ein Agent ihn versucht.

Für Twilio prüfen Sie den Transport immer explizit vorab, wenn der
Standardtransport Chrome ist:

```bash
openclaw googlemeet setup --transport twilio
```

Dadurch werden fehlende `voice-call`-Verdrahtung, Twilio-Zugangsdaten oder nicht
erreichbare Webhook-Bereitstellung erkannt, bevor der Agent versucht, die
Besprechung anzuwählen.

Einer Besprechung beitreten:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Oder lassen Sie einen Agenten über das `google_meet`-Tool beitreten:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Das agentenseitige `google_meet`-Tool bleibt auf Nicht-macOS-Hosts für
Artefakt-, Kalender-, Setup-, Transkriptions-, Twilio- und `chrome-node`-Abläufe
verfügbar. Lokale Chrome-Realtime-Aktionen werden dort blockiert, weil der
gebündelte Realtime-Chrome-Audiopfad derzeit von macOS `BlackHole 2ch` abhängt.
Unter Linux verwenden Sie `mode: "transcribe"`, Twilio-Einwahl oder einen
macOS-`chrome-node`-Host für Realtime-Chrome-Teilnahme.

Eine neue Besprechung erstellen und ihr beitreten:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Für per API erstellte Räume verwenden Sie Google Meet `SpaceConfig.accessType`,
wenn die No-Knock-Richtlinie des Raums explizit sein soll, statt von den
Standardeinstellungen des Google-Kontos geerbt zu werden:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode realtime
```

`OPEN` lässt alle Personen mit der Meet-URL ohne Anklopfen beitreten. `TRUSTED`
lässt vertrauenswürdige Benutzer der Host-Organisation, eingeladene externe
Benutzer und Einwahlbenutzer ohne Anklopfen beitreten. `RESTRICTED` beschränkt
den Eintritt ohne Anklopfen auf eingeladene Personen. Diese Einstellungen gelten
nur für den offiziellen Erstellungspfad der Google Meet API; daher müssen OAuth-
Zugangsdaten konfiguriert sein.

Wenn Sie Google Meet authentifiziert haben, bevor diese Option verfügbar war,
führen Sie `openclaw googlemeet auth login --json` nach dem Hinzufügen des
Scopes `meetings.space.settings` zu Ihrem Google OAuth-Einwilligungsbildschirm
erneut aus.

Nur die URL erstellen, ohne beizutreten:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` hat zwei Pfade:

- API-Erstellung: Wird verwendet, wenn Google Meet OAuth-Zugangsdaten
  konfiguriert sind. Dies ist der deterministischste Pfad und hängt nicht vom
  Zustand der Browseroberfläche ab.
- Browser-Fallback: Wird verwendet, wenn OAuth-Zugangsdaten fehlen. OpenClaw
  verwendet den gepinnten Chrome-Node, öffnet `https://meet.google.com/new`,
  wartet, bis Google auf eine echte Meeting-Code-URL weiterleitet, und gibt
  diese URL dann zurück. Dieser Pfad erfordert, dass das OpenClaw-Chrome-Profil
  auf dem Node bereits bei Google angemeldet ist. Browserautomatisierung
  behandelt Meets eigene Mikrofonaufforderung beim ersten Start; diese
  Aufforderung wird nicht als Google-Anmeldefehler behandelt.
  Beitritts- und Erstellungsabläufe versuchen außerdem, einen vorhandenen
  Meet-Tab wiederzuverwenden, bevor ein neuer geöffnet wird. Beim Abgleich
  werden harmlose URL-Abfragezeichenfolgen wie `authuser` ignoriert, sodass ein
  Agenten-Wiederholungsversuch die bereits geöffnete Besprechung fokussieren
  sollte, statt einen zweiten Chrome-Tab zu erstellen.

Die Befehls-/Tool-Ausgabe enthält ein Feld `source` (`api` oder `browser`),
damit Agenten erklären können, welcher Pfad verwendet wurde. `create` tritt der
neuen Besprechung standardmäßig bei und gibt `joined: true` plus die
Beitrittssitzung zurück. Um nur die URL zu erzeugen, verwenden Sie
`create --no-join` in der CLI oder übergeben Sie `"join": false` an das Tool.

Oder sagen Sie einem Agenten: „Erstellen Sie ein Google Meet, treten Sie mit
Realtime-Sprache bei und senden Sie mir den Link.“ Der Agent sollte `google_meet`
mit `action: "create"` aufrufen und anschließend den zurückgegebenen
`meetingUri` teilen.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Für einen reinen Beobachtungs-/Browsersteuerungsbeitritt setzen Sie
`"mode": "transcribe"`. Dadurch wird die Duplex-Realtime-Modellbrücke nicht
gestartet, BlackHole oder SoX werden nicht benötigt, und es wird nicht in die
Besprechung zurückgesprochen. Chrome-Beitritte in diesem Modus vermeiden
außerdem OpenClaws Mikrofon-/Kameraberechtigungserteilung und umgehen den Meet-
Pfad **Mikrofon verwenden**. Wenn Meet einen Audioauswahl-Zwischenschritt
anzeigt, versucht die Automatisierung den Pfad ohne Mikrofon und meldet andernfalls
eine manuelle Aktion, statt das lokale Mikrofon zu öffnen. Im Transkriptionsmodus
installieren verwaltete Chrome-Transporte außerdem bestmöglich einen Meet-
Untertitelbeobachter. `googlemeet status --json` und `googlemeet doctor` zeigen
`captioning`, `captionsEnabledAttempted`, `transcriptLines`, `lastCaptionAt`,
`lastCaptionSpeaker`, `lastCaptionText` und ein kurzes `recentTranscript`-Ende
an, damit Bediener erkennen können, ob der Browser dem Anruf beigetreten ist und
ob Meet-Untertitel Text erzeugen.
Verwenden Sie `openclaw googlemeet test-listen <meet-url> --transport chrome-node`,
wenn Sie eine Ja/Nein-Prüfung benötigen: Der Befehl tritt im Transkriptionsmodus
bei, wartet auf frische Untertitel- oder Transkriptbewegung und gibt
`listenVerified`, `listenTimedOut`, Felder für manuelle Aktionen sowie den
neuesten Untertitelzustand zurück.

Während Realtime-Sitzungen enthält der `google_meet`-Status den Zustand von
Browser und Audiobrücke, etwa `inCall`, `manualActionRequired`,
`providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`,
letzte Eingabe-/Ausgabezeitstempel, Byte-Zähler und den geschlossenen Zustand
der Brücke. Wenn eine sichere Meet-Seitenaufforderung erscheint, behandelt die
Browserautomatisierung sie, wenn sie kann. Anmelde-, Host-Zulassungs- und
Browser-/OS-Berechtigungsaufforderungen werden als manuelle Aktion mit Grund und
Nachricht gemeldet, die der Agent weitergeben kann. Verwaltete Chrome-Sitzungen
geben die Intro- oder Testphrase erst aus, nachdem der Browserzustand
`inCall: true` meldet; andernfalls meldet der Status `speechReady: false`, und
der Sprechversuch wird blockiert, statt vorzugeben, der Agent habe in die
Besprechung gesprochen.

Lokale Chrome-Beitritte erfolgen über das angemeldete OpenClaw-Browserprofil.
Der Realtime-Modus erfordert `BlackHole 2ch` für den von OpenClaw verwendeten
Mikrofon-/Lautsprecherpfad. Für sauberes Duplex-Audio verwenden Sie getrennte
virtuelle Geräte oder einen Loopback-artigen Graphen; ein einzelnes BlackHole-
Gerät reicht für einen ersten Smoke-Test aus, kann aber Echo erzeugen.

### Lokales Gateway + Parallels Chrome

Sie benötigen kein vollständiges OpenClaw Gateway und keinen Modell-API-Schlüssel
innerhalb einer macOS-VM, nur damit die VM Chrome besitzt. Führen Sie Gateway und
Agent lokal aus und starten Sie dann einen Node-Host in der VM. Aktivieren Sie
das gebündelte Plugin einmal in der VM, damit der Node den Chrome-Befehl
ankündigt:

Was wo ausgeführt wird:

- Gateway-Host: OpenClaw Gateway, Agenten-Arbeitsbereich, Modell-/API-Schlüssel,
  Realtime-Provider und die Google Meet-Plugin-Konfiguration.
- Parallels-macOS-VM: OpenClaw CLI/Node-Host, Google Chrome, SoX, BlackHole 2ch
  und ein bei Google angemeldetes Chrome-Profil.
- In der VM nicht erforderlich: Gateway-Dienst, Agentenkonfiguration,
  OpenAI/GPT-Schlüssel oder Einrichtung des Modell-Providers.

Installieren Sie die VM-Abhängigkeiten:

```bash
brew install blackhole-2ch sox
```

Starten Sie die VM nach der Installation von BlackHole neu, damit macOS
`BlackHole 2ch` verfügbar macht:

```bash
sudo reboot
```

Überprüfen Sie nach dem Neustart, ob die VM das Audiogerät und die SoX-Befehle
sehen kann:

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
Node den Klartext-WebSocket, sofern Sie diese vertrauenswürdige private Netzwerk-
Verbindung nicht ausdrücklich erlauben:

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

Bestätigen Sie, dass das Gateway den Node sieht und dass er sowohl
`googlemeet.chrome` als auch die Browser-Fähigkeit/`browser.proxy` ankündigt:

```bash
openclaw nodes status
```

Leiten Sie Meet auf dem Gateway-Host über diesen Node:

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

Treten Sie nun ganz normal vom Gateway-Host aus bei:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

oder bitten Sie den Agenten, das `google_meet`-Tool mit `transport: "chrome-node"`
zu verwenden.

Für einen Smoke-Test mit einem einzigen Befehl, der eine Sitzung erstellt oder
wiederverwendet, eine bekannte Phrase spricht und den Sitzungszustand ausgibt:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Während des Echtzeit-Beitritts füllt die OpenClaw-Browserautomatisierung den Gastnamen aus, klickt auf
Beitreten/Beitritt anfragen und akzeptiert Meets erste „Mikrofon verwenden“-Auswahl, wenn diese
Aufforderung erscheint. Beim beobachtenden Beitritt oder bei der reinen Browser-Erstellung eines Meetings
fährt sie bei derselben Aufforderung ohne Mikrofon fort, wenn diese Auswahl verfügbar ist.
Wenn das Browserprofil nicht angemeldet ist, Meet auf die Zulassung durch den Host wartet,
Chrome für einen Echtzeit-Beitritt eine Mikrofon-/Kameraberechtigung benötigt oder Meet bei einer
Aufforderung hängen bleibt, die die Automatisierung nicht auflösen konnte, meldet das Join-/Test-Speech-Ergebnis
`manualActionRequired: true` mit `manualActionReason` und
`manualActionMessage`. Agenten sollten weitere Beitrittsversuche stoppen, genau diese
Meldung plus die aktuelle `browserUrl`/`browserTitle` melden und erst erneut versuchen,
wenn die manuelle Browseraktion abgeschlossen ist.

Wenn `chromeNode.node` weggelassen wird, wählt OpenClaw nur dann automatisch aus, wenn genau eine
verbundene Node sowohl `googlemeet.chrome` als auch Browsersteuerung ankündigt. Wenn
mehrere geeignete Nodes verbunden sind, setzen Sie `chromeNode.node` auf die Node-ID,
den Anzeigenamen oder die Remote-IP.

Häufige Fehlerprüfungen:

- `Configured Google Meet node ... is not usable: offline`: Die angeheftete Node ist
  dem Gateway bekannt, aber nicht verfügbar. Agenten sollten diese Node als
  Diagnosezustand behandeln, nicht als verwendbaren Chrome-Host, und den Einrichtungsblocker
  melden, statt auf einen anderen Transport zurückzufallen, sofern der Benutzer dies nicht verlangt hat.
- `No connected Google Meet-capable node`: Starten Sie `openclaw node run` in der VM,
  genehmigen Sie das Pairing und stellen Sie sicher, dass `openclaw plugins enable google-meet` und
  `openclaw plugins enable browser` in der VM ausgeführt wurden. Bestätigen Sie außerdem, dass der
  Gateway-Host beide Node-Befehle mit
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]` erlaubt.
- `BlackHole 2ch audio device not found`: Installieren Sie `blackhole-2ch` auf dem geprüften Host
  und starten Sie neu, bevor Sie lokales Chrome-Audio verwenden.
- `BlackHole 2ch audio device not found on the node`: Installieren Sie `blackhole-2ch`
  in der VM und starten Sie die VM neu.
- Chrome öffnet sich, kann aber nicht beitreten: Melden Sie sich im Browserprofil innerhalb der VM an, oder
  lassen Sie `chrome.guestName` für den Gastbeitritt gesetzt. Der automatische Gastbeitritt verwendet die OpenClaw-
  Browserautomatisierung über den Node-Browser-Proxy; stellen Sie sicher, dass die Node-Browser-
  Konfiguration auf das gewünschte Profil zeigt, zum Beispiel
  `browser.defaultProfile: "user"` oder ein benanntes Existing-Session-Profil.
- Doppelte Meet-Tabs: Lassen Sie `chrome.reuseExistingTab: true` aktiviert. OpenClaw
  aktiviert einen bestehenden Tab für dieselbe Meet-URL, bevor ein neuer geöffnet wird, und
  die Browser-Meeting-Erstellung verwendet einen laufenden `https://meet.google.com/new`-
  oder Google-Konto-Aufforderungstab wieder, bevor ein weiterer geöffnet wird.
- Kein Audio: Leiten Sie in Meet Mikrofon-/Lautsprecher-Audio über den von OpenClaw verwendeten
  Pfad des virtuellen Audiogeräts; verwenden Sie separate virtuelle Geräte oder Loopback-artiges Routing
  für sauberes Duplex-Audio.

## Installationshinweise

Der Chrome-Echtzeitstandard verwendet zwei externe Tools:

- `sox`: Audio-Dienstprogramm für die Befehlszeile. Das Plugin verwendet explizite CoreAudio-
  Gerätebefehle für die standardmäßige 24-kHz-PCM16-Audio-Bridge.
- `blackhole-2ch`: virtueller macOS-Audiotreiber. Er erstellt das Audiogerät `BlackHole 2ch`,
  über das Chrome/Meet routen kann.

OpenClaw bündelt oder vertreibt keines der beiden Pakete. Die Dokumentation weist Benutzer an,
sie als Host-Abhängigkeiten über Homebrew zu installieren. SoX ist unter
`LGPL-2.0-only AND GPL-2.0-only` lizenziert; BlackHole unter GPL-3.0. Wenn Sie einen
Installer oder eine Appliance erstellen, die BlackHole mit OpenClaw bündelt, prüfen Sie die
Upstream-Lizenzbedingungen von BlackHole oder holen Sie eine separate Lizenz von Existential Audio ein.

## Transporte

### Chrome

Der Chrome-Transport öffnet die Meet-URL über die OpenClaw-Browsersteuerung und tritt
als angemeldetes OpenClaw-Browserprofil bei. Unter macOS prüft das Plugin vor dem Start auf
`BlackHole 2ch`. Falls konfiguriert, führt es außerdem einen Integritätsbefehl für die Audio-Bridge
und einen Startbefehl aus, bevor Chrome geöffnet wird. Verwenden Sie `chrome`, wenn
Chrome/Audio auf dem Gateway-Host laufen; verwenden Sie `chrome-node`, wenn Chrome/Audio
auf einer gepairten Node wie einer Parallels-macOS-VM laufen. Wählen Sie für lokales Chrome das
Profil mit `browser.defaultProfile`; `chrome.browserProfile` wird an
`chrome-node`-Hosts übergeben.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Leiten Sie Chrome-Mikrofon- und Lautsprecher-Audio durch die lokale OpenClaw-Audio-
Bridge. Wenn `BlackHole 2ch` nicht installiert ist, schlägt der Beitritt mit einem Einrichtungsfehler fehl,
statt stillschweigend ohne Audiopfad beizutreten.

### Twilio

Der Twilio-Transport ist ein strikter Wählplan, der an das Voice Call Plugin delegiert wird. Er
parst Meet-Seiten nicht nach Telefonnummern.

Verwenden Sie dies, wenn eine Teilnahme über Chrome nicht verfügbar ist oder Sie einen Telefon-Einwahl-
Fallback möchten. Google Meet muss für das Meeting eine Telefon-Einwahlnummer und PIN
bereitstellen; OpenClaw ermittelt diese nicht aus der Meet-Seite.

Aktivieren Sie das Voice Call Plugin auf dem Gateway-Host, nicht auf der Chrome-Node:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
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
        },
      },
    },
  },
}
```

Stellen Sie Twilio-Zugangsdaten über Umgebung oder Konfiguration bereit. Die Umgebung hält
Geheimnisse aus `openclaw.json` heraus:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Starten oder laden Sie das Gateway neu, nachdem Sie `voice-call` aktiviert haben; Plugin-Konfigurationsänderungen
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

Der Google Meet API-Zugriff verwendet Benutzer-OAuth: Erstellen Sie einen Google Cloud-OAuth-Client,
fordern Sie die erforderlichen Scopes an, autorisieren Sie ein Google-Konto und speichern Sie dann das
resultierende Refresh-Token in der Google Meet-Plugin-Konfiguration oder stellen Sie die
Umgebungsvariablen `OPENCLAW_GOOGLE_MEET_*` bereit.

OAuth ersetzt den Chrome-Beitrittspfad nicht. Chrome- und Chrome-node-Transporte
treten weiterhin über ein angemeldetes Chrome-Profil, BlackHole/SoX und eine verbundene
Node bei, wenn Sie Browserteilnahme verwenden. OAuth dient nur dem offiziellen Google
Meet API-Pfad: Meeting-Spaces erstellen, Spaces auflösen und Preflight-Prüfungen der Meet Media API
ausführen.

### Google-Zugangsdaten erstellen

In der Google Cloud Console:

1. Erstellen oder wählen Sie ein Google Cloud-Projekt aus.
2. Aktivieren Sie **Google Meet REST API** für dieses Projekt.
3. Konfigurieren Sie den OAuth-Zustimmungsbildschirm.
   - **Internal** ist für eine Google Workspace-Organisation am einfachsten.
   - **External** funktioniert für persönliche/Test-Setups; während sich die App im Testing befindet,
     fügen Sie jedes Google-Konto, das die App autorisieren soll, als Testbenutzer hinzu.
4. Fügen Sie die von OpenClaw angeforderten Scopes hinzu:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Erstellen Sie eine OAuth-Client-ID.
   - Anwendungstyp: **Web application**.
   - Autorisierte Weiterleitungs-URI:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Kopieren Sie die Client-ID und das Client-Secret.

`meetings.space.created` wird von Google Meet `spaces.create` benötigt.
`meetings.space.readonly` lässt OpenClaw Meet-URLs/-Codes zu Spaces auflösen.
`meetings.space.settings` lässt OpenClaw `SpaceConfig`-Einstellungen wie
`accessType` während der API-Raumerstellung übergeben.
`meetings.conference.media.readonly` ist für Preflight und Medienarbeit mit der Meet Media API
vorgesehen; Google kann für die tatsächliche Nutzung der Media API die Aufnahme in die Developer Preview verlangen.
Wenn Sie nur browserbasierte Chrome-Beitritte benötigen, überspringen Sie OAuth vollständig.

### Refresh-Token ausstellen

Konfigurieren Sie `oauth.clientId` und optional `oauth.clientSecret`, oder übergeben Sie sie als
Umgebungsvariablen, und führen Sie dann aus:

```bash
openclaw googlemeet auth login --json
```

Der Befehl gibt einen `oauth`-Konfigurationsblock mit einem Refresh-Token aus. Er verwendet PKCE,
einen localhost-Callback unter `http://localhost:8085/oauth2callback` und einen manuellen
Kopier-/Einfügeablauf mit `--manual`.

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

Speichern Sie das `oauth`-Objekt unter der Google Meet-Plugin-Konfiguration:

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

Bevorzugen Sie Umgebungsvariablen, wenn Sie das Refresh-Token nicht in der Konfiguration speichern möchten.
Wenn sowohl Konfigurations- als auch Umgebungswerte vorhanden sind, löst das Plugin zuerst die Konfiguration
und anschließend den Umgebungs-Fallback auf.

Die OAuth-Zustimmung umfasst Meet-Space-Erstellung, Lesezugriff auf Meet-Spaces und Lesezugriff auf Meet-
Konferenzmedien. Wenn Sie sich authentifiziert haben, bevor Unterstützung für die Meeting-Erstellung
existierte, führen Sie `openclaw googlemeet auth login --json` erneut aus, damit das Refresh-
Token den Scope `meetings.space.created` hat.

### OAuth mit Doctor prüfen

Führen Sie den OAuth-Doctor aus, wenn Sie eine schnelle Integritätsprüfung ohne Geheimnisse wünschen:

```bash
openclaw googlemeet doctor --oauth --json
```

Dies lädt nicht die Chrome-Runtime und erfordert keine verbundene Chrome-Node. Es
prüft, dass die OAuth-Konfiguration existiert und dass das Refresh-Token ein Access-
Token ausstellen kann. Der JSON-Bericht enthält nur Statusfelder wie `ok`, `configured`,
`tokenSource`, `expiresAt` und Prüfnachrichten; er gibt weder Access-
Token, Refresh-Token noch Client-Secret aus.

Häufige Ergebnisse:

| Prüfung             | Bedeutung                                                                               |
| ------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`      | `oauth.clientId` plus `oauth.refreshToken` oder ein zwischengespeichertes Access-Token ist vorhanden. |
| `oauth-token`       | Das zwischengespeicherte Access-Token ist noch gültig, oder das Refresh-Token hat ein neues Access-Token ausgestellt. |
| `meet-spaces-get`   | Optionale `--meeting`-Prüfung hat einen bestehenden Meet-Space aufgelöst.               |
| `meet-spaces-create` | Optionale `--create-space`-Prüfung hat einen neuen Meet-Space erstellt.                 |

Um auch die Aktivierung der Google Meet API und den Scope `spaces.create` nachzuweisen, führen Sie die
nebenwirkungsbehaftete Erstellungsprüfung aus:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` erstellt eine wegwerfbare Meet-URL. Verwenden Sie dies, wenn Sie bestätigen müssen,
dass für das Google Cloud-Projekt die Meet API aktiviert ist und das autorisierte
Konto den Scope `meetings.space.created` hat.

So weisen Sie Lesezugriff für einen vorhandenen Meeting-Space nach:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` und `resolve-space` weisen Lesezugriff auf einen vorhandenen
Space nach, auf den das autorisierte Google-Konto zugreifen kann. Ein `403` von diesen Prüfungen
bedeutet üblicherweise, dass die Google Meet REST API deaktiviert ist, dem zugestimmten Refresh Token
der erforderliche Scope fehlt oder das Google-Konto nicht auf diesen Meet-
Space zugreifen kann. Ein Refresh-Token-Fehler bedeutet: Führen Sie `openclaw googlemeet auth login
--json` erneut aus und speichern Sie den neuen `oauth`-Block.

Für den Browser-Fallback sind keine OAuth-Anmeldedaten erforderlich. In diesem Modus stammt die Google-
Authentifizierung aus dem angemeldeten Chrome-Profil auf der ausgewählten Node, nicht aus der
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

Führen Sie Preflight vor Medienarbeiten aus:

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
für dieses Meeting wünschen.

Die Kalendersuche kann die Meeting-URL aus Google Calendar auflösen, bevor
Meet-Artefakte gelesen werden:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` durchsucht den heutigen `primary`-Kalender nach einem Kalenderereignis mit einem
Google Meet-Link. Verwenden Sie `--event <query>`, um passenden Ereignistext zu suchen, und
`--calendar <id>` für einen nicht primären Kalender. Die Kalendersuche erfordert eine frische
OAuth-Anmeldung, die den Readonly-Scope für Calendar-Events enthält.
`calendar-events` zeigt die passenden Meet-Ereignisse als Vorschau an und markiert das Ereignis, das
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
Teilnahme von OpenClaw, während `end-active-conference` Google Meet anweist, die aktive
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

`artifacts` gibt Konferenzdatensatz-Metadaten sowie Metadaten zu Teilnehmer-, Aufzeichnungs-,
Transkript-, strukturierten Transkripteintrags- und Smart-Note-Ressourcen zurück, wenn
Google sie für das Meeting bereitstellt. Verwenden Sie `--no-transcript-entries`, um
den Eintragsabruf für große Meetings zu überspringen. `attendance` erweitert Teilnehmer zu
Teilnehmersitzungszeilen mit Zeiten für erstes/letztes Gesehenwerden, Gesamtdauer der Sitzung,
Markierungen für verspätetes Erscheinen/frühes Verlassen sowie zusammengeführten doppelten Teilnehmerressourcen nach angemeldetem
Benutzer oder Anzeigename. Übergeben Sie `--no-merge-duplicates`, um rohe Teilnehmer-
ressourcen getrennt zu halten, `--late-after-minutes`, um die Erkennung von Verspätung anzupassen, und
`--early-before-minutes`, um die Erkennung von frühem Verlassen anzupassen.

`export` schreibt einen Ordner mit `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` und `manifest.json`.
`manifest.json` zeichnet die gewählte Eingabe, Exportoptionen, Konferenzdatensätze,
Ausgabedateien, Zählwerte, Token-Quelle, das Kalenderereignis, wenn eines verwendet wurde, und alle
Warnungen zu teilweisem Abruf auf. Übergeben Sie `--zip`, um zusätzlich ein portables Archiv neben
dem Ordner zu schreiben. Übergeben Sie `--include-doc-bodies`, um verknüpfte Transkript- und
Smart-Note-Texte aus Google Docs über Google Drive `files.export` zu exportieren; dies erfordert eine
frische OAuth-Anmeldung, die den Drive Meet Readonly-Scope enthält. Ohne
`--include-doc-bodies` enthalten Exporte nur Meet-Metadaten und strukturierte Transkript-
einträge. Wenn Google einen teilweisen Artefaktfehler zurückgibt, etwa einen Smart-Note-
Listing-, Transkripteintrags- oder Drive-Dokumenttext-Fehler, behalten Zusammenfassung und
Manifest die Warnung bei, statt den gesamten Export fehlschlagen zu lassen.
Verwenden Sie `--dry-run`, um dieselben Artefakt-/Anwesenheitsdaten abzurufen und das
Manifest-JSON auszugeben, ohne den Ordner oder die ZIP-Datei zu erstellen. Das ist nützlich, bevor
ein großer Export geschrieben wird oder wenn ein Agent nur Zählwerte, ausgewählte Datensätze und
Warnungen benötigt.

Agents können dasselbe Bundle auch über das Tool `google_meet` erstellen:

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

Agents können auch einen API-gestützten Raum mit einer expliziten Zugriffsrichtlinie erstellen:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime",
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

Für Listen-first-Validierung sollten Agents `test_listen` verwenden, bevor sie behaupten, dass das
Meeting nützlich ist:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Führen Sie den abgesicherten Live-Smoke gegen ein echtes aufbewahrtes Meeting aus:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Führen Sie die Live-Listen-first-Browserprobe gegen ein Meeting aus, in dem jemand
sprechen wird und Meet-Untertitel verfügbar sind:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Live-Smoke-Umgebung:

- `OPENCLAW_LIVE_TEST=1` aktiviert abgesicherte Live-Tests.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` zeigt auf eine aufbewahrte Meet-URL, einen Code oder
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` oder `GOOGLE_MEET_CLIENT_ID` stellt die OAuth-
  Client-ID bereit.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` oder `GOOGLE_MEET_REFRESH_TOKEN` stellt
  das Refresh Token bereit.
- Optional: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` und
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` verwenden dieselben Fallback-Namen
  ohne das Präfix `OPENCLAW_`.

Der grundlegende Artefakt-/Anwesenheits-Live-Smoke benötigt
`https://www.googleapis.com/auth/meetings.space.readonly` und
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Die Kalendersuche benötigt `https://www.googleapis.com/auth/calendar.events.readonly`. Der Export von Drive-
Dokumenttext benötigt
`https://www.googleapis.com/auth/drive.meet.readonly`.

Erstellen Sie einen frischen Meet-Space:

```bash
openclaw googlemeet create
```

Der Befehl gibt die neue `meeting uri`, die Quelle und die Beitrittssitzung aus. Mit OAuth-
Anmeldedaten verwendet er die offizielle Google Meet API. Ohne OAuth-Anmeldedaten verwendet er
als Fallback das angemeldete Browserprofil der gepinnten Chrome-Node. Agents können
das Tool `google_meet` mit `action: "create"` verwenden, um in einem Schritt zu erstellen und beizutreten.
Für URL-only-Erstellung übergeben Sie `"join": false`.

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
Tool `google_meet` gibt strukturierte Details statt einer einfachen Zeichenfolge zurück:

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
Meet-Tabs mehr öffnen, bis der Operator den Browserschritt abgeschlossen hat.

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

Das Erstellen eines Meet tritt standardmäßig bei. Der Chrome- oder Chrome-Node-Transport benötigt weiterhin
ein angemeldetes Google Chrome-Profil, um über den Browser beizutreten. Wenn das
Profil abgemeldet ist, meldet OpenClaw `manualActionRequired: true` oder einen
Browser-Fallback-Fehler und fordert den Operator auf, die Google-Anmeldung abzuschließen, bevor
erneut versucht wird.

Setzen Sie `preview.enrollmentAcknowledged: true` erst, nachdem Sie bestätigt haben, dass Ihr Cloud-
Projekt, OAuth-Prinzipal und die Meeting-Teilnehmer im Google
Workspace Developer Preview Program für Meet-Medien-APIs registriert sind.

## Konfiguration

Der gemeinsame Chrome-Realtime-Pfad benötigt nur das aktivierte Plugin, BlackHole, SoX
und einen Backend-Realtime-Voice-Provider-Schlüssel. OpenAI ist der Standard; setzen Sie
`realtime.provider: "google"`, um Google Gemini Live zu verwenden:

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
- `defaultMode: "realtime"`
- `chromeNode.node`: optionale Node-ID, optionaler Node-Name oder optionale IP für `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: Name, der auf dem Meet-Gastbildschirm ohne Anmeldung verwendet wird
- `chrome.autoJoin: true`: Best-Effort-Ausfüllen des Gastnamens und Klicken auf „Jetzt teilnehmen“ über OpenClaw-Browserautomatisierung auf `chrome-node`
- `chrome.reuseExistingTab: true`: einen vorhandenen Meet-Tab aktivieren, statt Duplikate zu öffnen
- `chrome.waitForInCallMs: 20000`: warten, bis der Meet-Tab meldet, dass er sich im Anruf befindet, bevor die Realtime-Einführung ausgelöst wird
- `chrome.audioFormat: "pcm16-24khz"`: Audioformat für Befehlspaare. Verwenden Sie `"g711-ulaw-8khz"` nur für Legacy-/benutzerdefinierte Befehlspaare, die weiterhin Telefonie-Audio ausgeben.
- `chrome.audioInputCommand`: SoX-Befehl, der aus CoreAudio `BlackHole 2ch` liest und Audio in `chrome.audioFormat` schreibt
- `chrome.audioOutputCommand`: SoX-Befehl, der Audio in `chrome.audioFormat` liest und an CoreAudio `BlackHole 2ch` schreibt
- `chrome.bargeInInputCommand`: optionaler lokaler Mikrofonbefehl, der vorzeichenbehaftetes 16-Bit-Little-Endian-Mono-PCM zur Erkennung menschlicher Zwischenrufe schreibt, während die Assistentenwiedergabe aktiv ist. Dies gilt derzeit für die vom Gateway gehostete `chrome`-Befehlspaar-Bridge.
- `chrome.bargeInRmsThreshold: 650`: RMS-Pegel, der auf `chrome.bargeInInputCommand` als menschliche Unterbrechung zählt
- `chrome.bargeInPeakThreshold: 2500`: Spitzenpegel, der auf `chrome.bargeInInputCommand` als menschliche Unterbrechung zählt
- `chrome.bargeInCooldownMs: 900`: Mindestverzögerung zwischen wiederholten Löschungen menschlicher Unterbrechungen
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: kurze gesprochene Antworten, mit `openclaw_agent_consult` für ausführlichere Antworten
- `realtime.introMessage`: kurze gesprochene Bereitschaftsprüfung, wenn die Realtime-Bridge verbunden wird; setzen Sie den Wert auf `""`, um stumm beizutreten
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
  realtime: {
    provider: "google",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

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

`voiceCall.enabled` ist standardmäßig `true`; mit Twilio-Transport delegiert es den eigentlichen PSTN-Anruf, DTMF und die Begrüßungseinführung an das Voice-Call-Plugin. Voice Call spielt die DTMF-Sequenz ab, bevor der Realtime-Medienstream geöffnet wird, und verwendet dann den gespeicherten Einführungstext als anfängliche Realtime-Begrüßung. Wenn `voice-call` nicht aktiviert ist, kann Google Meet den Wählplan weiterhin validieren und aufzeichnen, aber den Twilio-Anruf nicht tätigen.

## Tool

Agenten können das `google_meet`-Tool verwenden:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Verwenden Sie `transport: "chrome"`, wenn Chrome auf dem Gateway-Host ausgeführt wird. Verwenden Sie `transport: "chrome-node"`, wenn Chrome auf einer gekoppelten Node wie einer Parallels-VM ausgeführt wird. In beiden Fällen werden das Realtime-Modell und `openclaw_agent_consult` auf dem Gateway-Host ausgeführt, sodass Modell-Anmeldedaten dort verbleiben.

Verwenden Sie `action: "status"`, um aktive Sitzungen aufzulisten oder eine Sitzungs-ID zu prüfen. Verwenden Sie `action: "speak"` mit `sessionId` und `message`, damit der Realtime-Agent sofort spricht. Verwenden Sie `action: "test_speech"`, um die Sitzung zu erstellen oder wiederzuverwenden, eine bekannte Phrase auszulösen und den `inCall`-Zustand zurückzugeben, wenn der Chrome-Host ihn melden kann. `test_speech` erzwingt immer `mode: "realtime"` und schlägt fehl, wenn es mit `mode: "transcribe"` ausgeführt werden soll, da reine Beobachtungssitzungen absichtlich keine Sprache ausgeben können. Das Ergebnis `speechOutputVerified` basiert darauf, dass die Realtime-Audioausgabebytes während dieses Testaufrufs zunehmen, daher zählt eine wiederverwendete Sitzung mit älterem Audio nicht als frische erfolgreiche Sprachprüfung. Verwenden Sie `action: "leave"`, um eine Sitzung als beendet zu markieren.

`status` enthält Chrome-Zustand, wenn verfügbar:

- `inCall`: Chrome scheint sich im Meet-Anruf zu befinden
- `micMuted`: Best-Effort-Status des Meet-Mikrofons
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: das Browserprofil benötigt manuelle Anmeldung, Zulassung durch den Meet-Host, Berechtigungen oder Browsersteuerungsreparatur, bevor Sprache funktionieren kann
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: ob verwaltete Chrome-Sprache jetzt erlaubt ist. `speechReady: false` bedeutet, dass OpenClaw die Einführungs-/Testphrase nicht in die Audio-Bridge gesendet hat.
- `providerConnected` / `realtimeReady`: Zustand der Realtime-Sprach-Bridge
- `lastInputAt` / `lastOutputAt`: zuletzt von der Bridge empfangenes oder an sie gesendetes Audio
- `lastSuppressedInputAt` / `suppressedInputBytes`: local loopback-Eingabe, die ignoriert wurde, während die Assistentenwiedergabe aktiv ist

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Realtime-Agentenabfrage

Der Chrome-Realtime-Modus ist für eine Live-Sprachschleife optimiert. Der Realtime-Sprach-Provider hört das Meeting-Audio und spricht über die konfigurierte Audio-Bridge. Wenn das Realtime-Modell tiefere Schlussfolgerungen, aktuelle Informationen oder normale OpenClaw-Tools benötigt, kann es `openclaw_agent_consult` aufrufen.

Das Abfrage-Tool führt im Hintergrund den regulären OpenClaw-Agenten mit aktuellem Meeting-Transkriptkontext aus und gibt eine prägnante gesprochene Antwort an die Realtime-Sprachsitzung zurück. Das Sprachmodell kann diese Antwort dann zurück in das Meeting sprechen. Es verwendet dasselbe gemeinsame Realtime-Abfrage-Tool wie Voice Call.

Standardmäßig werden Abfragen gegen den `main`-Agenten ausgeführt. Setzen Sie `realtime.agentId`, wenn eine Meet-Lane einen dedizierten OpenClaw-Agentenarbeitsbereich, Modellstandardwerte, Tool-Richtlinie, Speicher und Sitzungsverlauf abfragen soll.

`realtime.toolPolicy` steuert den Abfragelauf:

- `safe-read-only`: das Abfrage-Tool bereitstellen und den regulären Agenten auf `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` und `memory_get` beschränken.
- `owner`: das Abfrage-Tool bereitstellen und den regulären Agenten die normale Agenten-Tool-Richtlinie verwenden lassen.
- `none`: das Abfrage-Tool dem Realtime-Sprachmodell nicht bereitstellen.

Der Abfrage-Sitzungsschlüssel ist pro Meet-Sitzung abgegrenzt, sodass Folgeabfrageaufrufe während desselben Meetings früheren Abfragekontext wiederverwenden können.

Um eine gesprochene Bereitschaftsprüfung zu erzwingen, nachdem Chrome dem Anruf vollständig beigetreten ist:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Für den vollständigen Join-and-Speak-Smoke-Test:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Live-Test-Checkliste

Verwenden Sie diese Sequenz, bevor Sie ein Meeting an einen unbeaufsichtigten Agenten übergeben:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Erwarteter Chrome-Node-Zustand:

- `googlemeet setup` ist vollständig grün.
- `googlemeet setup` enthält `chrome-node-connected`, wenn Chrome-node der Standardtransport ist oder eine Node angeheftet ist.
- `nodes status` zeigt, dass die ausgewählte Node verbunden ist.
- Die ausgewählte Node kündigt sowohl `googlemeet.chrome` als auch `browser.proxy` an.
- Der Meet-Tab tritt dem Anruf bei und `test-speech` gibt Chrome-Zustand mit `inCall: true` zurück.

Für einen Remote-Chrome-Host wie eine Parallels-macOS-VM ist dies die kürzeste sichere Prüfung nach dem Aktualisieren des Gateway oder der VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Damit wird nachgewiesen, dass das Gateway-Plugin geladen ist, die VM-Node mit dem aktuellen Token verbunden ist und die Meet-Audio-Bridge verfügbar ist, bevor ein Agent einen echten Meeting-Tab öffnet.

Für einen Twilio-Smoke-Test verwenden Sie ein Meeting, das Einwahldetails per Telefon bereitstellt:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Erwarteter Twilio-Zustand:

- `googlemeet setup` enthält grüne Prüfungen für `twilio-voice-call-plugin`, `twilio-voice-call-credentials` und `twilio-voice-call-webhook`.
- `voicecall` ist nach dem Neuladen des Gateway in der CLI verfügbar.
- Die zurückgegebene Sitzung hat `transport: "twilio"` und eine `twilio.voiceCallId`.
- `openclaw logs --follow` zeigt, dass DTMF-TwiML vor Realtime-TwiML bereitgestellt wurde, anschließend eine Realtime-Bridge mit der anfänglichen Begrüßung in der Warteschlange.
- `googlemeet leave <sessionId>` legt den delegierten Sprachanruf auf.

## Fehlerbehebung

### Agent kann das Google-Meet-Tool nicht sehen

Bestätigen Sie, dass das Plugin in der Gateway-Konfiguration aktiviert ist, und laden Sie das Gateway neu:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Wenn Sie gerade `plugins.entries.google-meet` bearbeitet haben, starten oder laden Sie das Gateway neu. Der laufende Agent sieht nur Plugin-Tools, die vom aktuellen Gateway-Prozess registriert wurden.

Auf Nicht-macOS-Gateway-Hosts bleibt das agentenseitige `google_meet`-Tool sichtbar, aber lokale Chrome-Realtime-Aktionen werden blockiert, bevor sie die Audio-Bridge erreichen. Lokales Chrome-Realtime-Audio hängt derzeit von macOS `BlackHole 2ch` ab, daher sollten Linux-Agenten `mode: "transcribe"`, Twilio-Einwahl oder einen macOS-`chrome-node`-Host anstelle des standardmäßigen lokalen Chrome-Realtime-Pfads verwenden.

### Keine verbundene Google-Meet-fähige Node

Führen Sie auf dem Node-Host Folgendes aus:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Genehmigen Sie auf dem Gateway-Host die Node und prüfen Sie die Befehle:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Die Node muss verbunden sein und `googlemeet.chrome` sowie `browser.proxy` auflisten. Die Gateway-Konfiguration muss diese Node-Befehle zulassen:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Wenn `googlemeet setup` bei `chrome-node-connected` fehlschlägt oder das Gateway-Protokoll `gateway token mismatch` meldet, installieren oder starten Sie die Node mit dem aktuellen Gateway-Token neu. Für ein LAN-Gateway bedeutet das normalerweise:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Laden Sie dann den Node-Dienst neu und führen Sie erneut aus:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Browser öffnet sich, aber der Agent kann nicht beitreten

Führen Sie `googlemeet test-listen` für reine Beobachtungsbeitritte oder `googlemeet test-speech` für Realtime-Beitritte aus und prüfen Sie dann den zurückgegebenen Chrome-Zustand. Wenn eine der beiden Prüfungen `manualActionRequired: true` meldet, zeigen Sie dem Bediener `manualActionMessage` an und stoppen Sie Wiederholungsversuche, bis die Browseraktion abgeschlossen ist.

Häufige manuelle Aktionen:

- Melden Sie sich beim Chrome-Profil an.
- Lassen Sie den Gast über das Meet-Host-Konto zu.
- Gewähren Sie Chrome Mikrofon-/Kameraberechtigungen, wenn die native Berechtigungsaufforderung von Chrome angezeigt wird.
- Schließen oder reparieren Sie einen hängenden Meet-Berechtigungsdialog.

Melden Sie nicht "nicht angemeldet", nur weil Meet "Möchten Sie, dass andere Personen Sie in der Besprechung hören?" anzeigt. Das ist Meets Zwischenschritt zur Audioauswahl; OpenClaw klickt, wenn verfügbar, per Browserautomatisierung auf **Mikrofon verwenden** und wartet weiter auf den echten Besprechungsstatus. Für den reinen Erstellungs-Browser-Fallback kann OpenClaw auf **Ohne Mikrofon fortfahren** klicken, weil das Erstellen der URL den Echtzeit-Audiopfad nicht benötigt.

### Besprechungserstellung schlägt fehl

`googlemeet create` verwendet zuerst den Google Meet API-Endpunkt `spaces.create`,
wenn OAuth-Anmeldedaten konfiguriert sind. Ohne OAuth-Anmeldedaten fällt es auf
den gepinnten Chrome-Node-Browser zurück. Prüfen Sie:

- Für API-Erstellung: `oauth.clientId` und `oauth.refreshToken` sind konfiguriert,
  oder passende `OPENCLAW_GOOGLE_MEET_*`-Umgebungsvariablen sind vorhanden.
- Für API-Erstellung: Das Refresh-Token wurde erstellt, nachdem Unterstützung
  für Erstellung hinzugefügt wurde. Älteren Tokens fehlt möglicherweise der
  Scope `meetings.space.created`; führen Sie
  `openclaw googlemeet auth login --json` erneut aus und aktualisieren Sie die
  Plugin-Konfiguration.
- Für Browser-Fallback: `defaultTransport: "chrome-node"` und
  `chromeNode.node` zeigen auf eine verbundene Node mit `browser.proxy` und
  `googlemeet.chrome`.
- Für Browser-Fallback: Das OpenClaw-Chrome-Profil auf dieser Node ist bei
  Google angemeldet und kann `https://meet.google.com/new` öffnen.
- Für Browser-Fallback: Wiederholungen verwenden einen vorhandenen Tab
  `https://meet.google.com/new` oder einen Google-Konto-Aufforderungstab erneut,
  bevor ein neuer Tab geöffnet wird. Wenn bei einem Agent ein Timeout auftritt,
  wiederholen Sie den Tool-Aufruf, anstatt manuell einen weiteren Meet-Tab zu
  öffnen.
- Für Browser-Fallback: Wenn das Tool `manualActionRequired: true` zurückgibt,
  verwenden Sie die zurückgegebenen Werte `browser.nodeId`, `browser.targetId`,
  `browserUrl` und `manualActionMessage`, um die Bedienperson anzuleiten.
  Wiederholen Sie den Vorgang nicht in einer Schleife, bis diese Aktion
  abgeschlossen ist.
- Für Browser-Fallback: Wenn Meet "Möchten Sie, dass andere Personen Sie in der
  Besprechung hören?" anzeigt, lassen Sie den Tab geöffnet. OpenClaw sollte per
  Browserautomatisierung auf **Mikrofon verwenden** oder, beim reinen
  Erstellungs-Fallback, auf **Ohne Mikrofon fortfahren** klicken und weiter auf
  die generierte Meet-URL warten. Falls das nicht möglich ist, sollte der Fehler
  `meet-audio-choice-required` erwähnen, nicht `google-login-required`.

### Agent tritt bei, spricht aber nicht

Prüfen Sie den Echtzeitpfad:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Verwenden Sie `mode: "realtime"` für Zuhören und Rücksprechen. `mode: "transcribe"` startet absichtlich nicht die duplexfähige Echtzeit-Sprachbrücke. Für reines Beobachtungs-Debugging führen Sie nach dem Sprechen der Teilnehmenden `openclaw googlemeet status --json <session-id>` aus und prüfen Sie `captioning`, `transcriptLines` und `lastCaptionText`. Wenn `inCall` true ist, `transcriptLines` aber bei `0` bleibt, sind Meet-Untertitel möglicherweise deaktiviert, seit der Beobachter installiert wurde hat niemand gesprochen, die Meet-Benutzeroberfläche hat sich geändert oder Live-Untertitel sind für die Besprechungssprache bzw. das Konto nicht verfügbar.

`googlemeet test-speech` prüft immer den Echtzeitpfad und meldet, ob für diesen Aufruf Ausgabebytes der Brücke beobachtet wurden. Wenn `speechOutputVerified` false und `speechOutputTimedOut` true ist, hat der Echtzeit-Provider die Äußerung möglicherweise akzeptiert, aber OpenClaw hat nicht gesehen, dass neue Ausgabebytes die Chrome-Audiobrücke erreichen.

Prüfen Sie außerdem:

- Ein Echtzeit-Provider-Schlüssel ist auf dem Gateway-Host verfügbar, etwa
  `OPENAI_API_KEY` oder `GEMINI_API_KEY`.
- `BlackHole 2ch` ist auf dem Chrome-Host sichtbar.
- `sox` ist auf dem Chrome-Host vorhanden.
- Meet-Mikrofon und -Lautsprecher werden über den von OpenClaw verwendeten
  virtuellen Audiopfad geroutet.

`googlemeet doctor [session-id]` gibt die Sitzung, Node, den In-Call-Status,
den Grund für manuelle Aktion, die Echtzeit-Provider-Verbindung, `realtimeReady`,
Audio-Eingabe-/Ausgabeaktivität, letzte Audio-Zeitstempel, Byte-Zähler und die
Browser-URL aus. Verwenden Sie `googlemeet status [session-id] --json`, wenn Sie
das rohe JSON benötigen. Verwenden Sie `googlemeet doctor --oauth`, wenn Sie die
Google Meet OAuth-Aktualisierung prüfen müssen, ohne Tokens offenzulegen; fügen
Sie `--meeting` oder `--create-space` hinzu, wenn Sie zusätzlich einen Nachweis
über die Google Meet API benötigen.

Wenn bei einem Agent ein Timeout aufgetreten ist und Sie bereits einen geöffneten
Meet-Tab sehen, inspizieren Sie diesen Tab, ohne einen weiteren zu öffnen:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Die entsprechende Tool-Aktion ist `recover_current_tab`. Sie fokussiert und
inspiziert einen vorhandenen Meet-Tab für den ausgewählten Transport. Mit
`chrome` verwendet sie lokale Browsersteuerung über das Gateway; mit
`chrome-node` verwendet sie die konfigurierte Chrome-Node. Sie öffnet keinen
neuen Tab und erstellt keine neue Sitzung; sie meldet den aktuellen Blocker, etwa
Anmeldung, Zulassung, Berechtigungen oder den Audioauswahlstatus. Der CLI-Befehl
kommuniziert mit dem konfigurierten Gateway, daher muss das Gateway laufen;
`chrome-node` erfordert außerdem, dass die Chrome-Node verbunden ist.

### Twilio-Einrichtungsprüfungen schlagen fehl

`twilio-voice-call-plugin` schlägt fehl, wenn `voice-call` nicht erlaubt oder nicht aktiviert ist. Fügen Sie es zu `plugins.allow` hinzu, aktivieren Sie `plugins.entries.voice-call`, und laden Sie das Gateway neu.

`twilio-voice-call-credentials` schlägt fehl, wenn dem Twilio-Backend Konto-SID, Auth-Token oder Anrufernummer fehlen. Setzen Sie diese auf dem Gateway-Host:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` schlägt fehl, wenn `voice-call` keine öffentliche
Webhook-Bereitstellung hat oder wenn `publicUrl` auf local loopback oder einen privaten Netzwerkbereich zeigt.
Setzen Sie `plugins.entries.voice-call.config.publicUrl` auf die öffentliche Provider-URL oder
konfigurieren Sie eine `voice-call`-Tunnel-/Tailscale-Bereitstellung.

Loopback- und private URLs sind für Carrier-Callbacks nicht gültig. Verwenden Sie
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` oder `fd00::/8` nicht als `publicUrl`.

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

Verwenden Sie für lokale Entwicklung statt einer privaten Host-URL einen Tunnel
oder eine Tailscale-Bereitstellung:

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

Starten oder laden Sie anschließend das Gateway neu und führen Sie aus:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` prüft standardmäßig nur die Bereitschaft. Für einen Probelauf
mit einer bestimmten Nummer:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Fügen Sie `--yes` nur hinzu, wenn Sie bewusst einen echten ausgehenden
Benachrichtigungsanruf platzieren möchten:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio-Anruf startet, tritt der Besprechung aber nie bei

Bestätigen Sie, dass das Meet-Ereignis Telefoneinwahldetails bereitstellt. Geben
Sie die exakte Einwahlnummer und PIN oder eine benutzerdefinierte DTMF-Sequenz an:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Verwenden Sie ein führendes `w` oder Kommas in `--dtmf-sequence`, wenn der
Provider vor der PIN-Eingabe eine Pause benötigt.

Wenn der Telefonanruf erstellt wird, die Meet-Teilnehmerliste den
Einwahlteilnehmer aber nie anzeigt:

- Führen Sie `openclaw googlemeet doctor <session-id>` aus, um die delegierte
  Twilio-Anruf-ID zu bestätigen, ob DTMF eingereiht wurde und ob die Begrüßung
  angefordert wurde.
- Führen Sie `openclaw voicecall status --call-id <id>` aus und bestätigen Sie,
  dass der Anruf noch aktiv ist.
- Führen Sie `openclaw voicecall tail` aus und prüfen Sie, ob Twilio-Webhooks am
  Gateway ankommen.
- Führen Sie `openclaw logs --follow` aus und suchen Sie nach der
  Twilio-Meet-Sequenz: Google Meet delegiert den Beitritt, Voice Call startet
  die Telefonstrecke, Google Meet wartet `voiceCall.dtmfDelayMs`, sendet DTMF mit
  `voicecall.dtmf`, wartet `voiceCall.postDtmfSpeechDelayMs` und fordert dann
  Einleitungssprache mit `voicecall.speak` an.
- Führen Sie `openclaw googlemeet setup --transport twilio` erneut aus; eine
  grüne Einrichtungsprüfung ist erforderlich, beweist aber nicht, dass die
  Besprechungs-PIN-Sequenz korrekt ist.
- Bestätigen Sie, dass die Einwahlnummer zur selben Meet-Einladung und Region
  wie die PIN gehört.
- Erhöhen Sie `voiceCall.dtmfDelayMs`, wenn Meet langsam antwortet oder das
  Anruftranskript nach dem Senden von DTMF weiterhin die Aufforderung zur
  PIN-Eingabe zeigt.
- Wenn der Teilnehmer beitritt, Sie die Begrüßung aber nicht hören, prüfen Sie
  `openclaw logs --follow` auf die post-DTMF-Anfrage `voicecall.speak` und
  entweder die TTS-Wiedergabe über den Medienstream oder den Twilio-`<Say>`-Fallback. Wenn das Anruftranskript weiterhin "Besprechungs-PIN eingeben" enthält, ist die Telefonstrecke dem Meet-Raum noch nicht beigetreten, daher hören Besprechungsteilnehmende keine Sprache.

Wenn Webhooks nicht ankommen, debuggen Sie zuerst das Voice Call-Plugin: Der
Provider muss `plugins.entries.voice-call.config.publicUrl` oder den
konfigurierten Tunnel erreichen. Siehe [Voice Call-Fehlerbehebung](/de/plugins/voice-call#troubleshooting).

## Hinweise

Die offizielle Medien-API von Google Meet ist empfangsorientiert, daher benötigt
das Sprechen in einen Meet-Anruf weiterhin einen Teilnehmerpfad. Dieses Plugin
macht diese Grenze sichtbar: Chrome übernimmt Browserteilnahme und lokales
Audiorouting; Twilio übernimmt die Teilnahme per Telefoneinwahl.

Der Chrome-Echtzeitmodus benötigt `BlackHole 2ch` plus entweder:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw besitzt
  die Brücke zum Echtzeitmodell und leitet Audio in `chrome.audioFormat` zwischen
  diesen Befehlen und dem ausgewählten Echtzeit-Sprach-Provider weiter. Der
  standardmäßige Chrome-Pfad ist 24 kHz PCM16; 8 kHz G.711 mu-law bleibt für
  Legacy-Befehlspaare verfügbar.
- `chrome.audioBridgeCommand`: Ein externer Brückenbefehl besitzt den gesamten
  lokalen Audiopfad und muss nach dem Starten oder Validieren seines Daemon
  beendet werden.

Für sauberes Duplex-Audio routen Sie Meet-Ausgabe und Meet-Mikrofon über
getrennte virtuelle Geräte oder einen virtuellen Gerätegraph im Loopback-Stil.
Ein einzelnes gemeinsam genutztes BlackHole-Gerät kann andere Teilnehmende in
den Anruf zurückkoppeln.

Mit der Chrome-Brücke aus Befehlspaaren kann `chrome.bargeInInputCommand` auf
ein separates lokales Mikrofon hören und die Assistentenwiedergabe löschen, wenn
der Mensch zu sprechen beginnt. Dadurch bleibt menschliche Sprache vor der
Assistentenausgabe, selbst wenn die gemeinsam genutzte BlackHole-loopback-Eingabe
während der Assistentenwiedergabe vorübergehend unterdrückt ist. Wie
`chrome.audioInputCommand` und `chrome.audioOutputCommand` ist dies ein von der
Bedienperson konfigurierter lokaler Befehl. Verwenden Sie einen expliziten
vertrauenswürdigen Befehlspfad oder eine Argumentliste, und verweisen Sie nicht
auf Skripte aus nicht vertrauenswürdigen Speicherorten.

`googlemeet speak` löst die aktive Echtzeit-Audiobrücke für eine Chrome-Sitzung
aus. `googlemeet leave` stoppt diese Brücke. Für Twilio-Sitzungen, die über das
Voice Call-Plugin delegiert wurden, legt `leave` auch den zugrunde liegenden
Sprachanruf auf. Verwenden Sie `googlemeet end-active-conference`, wenn Sie auch
die aktive Google Meet-Konferenz für einen API-verwalteten Space schließen
möchten.

## Verwandt

- [Voice Call-Plugin](/de/plugins/voice-call)
- [Sprechmodus](/de/nodes/talk)
- [Plugins erstellen](/de/plugins/building-plugins)
