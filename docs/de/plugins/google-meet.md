---
read_when:
    - Sie möchten, dass ein OpenClaw-Agent an einem Google Meet-Anruf teilnimmt
    - Sie möchten, dass ein OpenClaw-Agent einen neuen Google Meet-Anruf erstellt
    - Sie konfigurieren Chrome, Chrome-Node oder Twilio als Google Meet-Transport
summary: 'Google Meet-Plugin: expliziten Meet-URLs über Chrome oder Twilio mit Echtzeit-Sprachvorgaben beitreten'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-05-04T02:24:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 77ab70d27d47bcc037144c7c6cfad6f93f307355b6ebcf3ee75c85b96a24af2f
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet-Teilnehmerunterstützung für OpenClaw — das Plugin ist bewusst explizit gestaltet:

- Es tritt nur einer expliziten `https://meet.google.com/...`-URL bei.
- Es kann über die Google Meet API einen neuen Meet-Raum erstellen und dann der
  zurückgegebenen URL beitreten.
- `realtime`-Sprache ist der Standardmodus.
- Realtime-Sprache kann bei Bedarf für tieferes Reasoning oder Tools an den vollständigen
  OpenClaw-Agenten zurückrufen.
- Agenten wählen das Beitrittsverhalten mit `mode`: Verwenden Sie `realtime` für live
  Zuhören/Rücksprechen oder `transcribe`, um dem Browser beizutreten/ihn zu steuern, ohne die
  Realtime-Sprachbrücke.
- Auth startet als persönliches Google OAuth oder als bereits angemeldetes Chrome-Profil.
- Es gibt keine automatische Zustimmungshinweis-Ansage.
- Das Standard-Audio-Backend von Chrome ist `BlackHole 2ch`.
- Chrome kann lokal oder auf einem gekoppelten Node-Host ausgeführt werden.
- Twilio akzeptiert eine Einwahlnummer plus optionale PIN oder DTMF-Sequenz; es
  kann keine Meet-URL direkt anwählen.
- Der CLI-Befehl ist `googlemeet`; `meet` ist für umfassendere Agent-
  Telekonferenz-Workflows reserviert.

## Schnellstart

Installieren Sie die lokalen Audio-Abhängigkeiten und konfigurieren Sie einen Backend-Realtime-Sprach-
Provider. OpenAI ist der Standard; Google Gemini Live funktioniert ebenfalls mit
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` installiert das virtuelle Audiogerät `BlackHole 2ch`. Der Installer von Homebrew
erfordert einen Neustart, bevor macOS das Gerät bereitstellt:

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

Die Setup-Ausgabe ist so gedacht, dass sie für Agenten lesbar und modusbewusst ist. Sie meldet Chrome-
Profil, Node-Pinning und, für Realtime-Chrome-Beitritte, die BlackHole/SoX-Audio-
Brücke sowie verzögerte Prüfungen der Realtime-Einführung. Für Nur-Beobachten-Beitritte prüfen Sie denselben
Transport mit `--mode transcribe`; dieser Modus überspringt Realtime-Audio-Voraussetzungen,
weil er weder über die Brücke zuhört noch darüber spricht:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Wenn Twilio-Delegation konfiguriert ist, meldet Setup außerdem, ob das
`voice-call`-Plugin, die Twilio-Anmeldedaten und die öffentliche Webhook-Erreichbarkeit bereit sind.
Behandeln Sie jede Prüfung mit `ok: false` als Blocker für den geprüften Transport und Modus,
bevor Sie einen Agenten bitten beizutreten. Verwenden Sie `openclaw googlemeet setup --json` für
Skripte oder maschinenlesbare Ausgabe. Verwenden Sie `--transport chrome`,
`--transport chrome-node` oder `--transport twilio`, um einen bestimmten
Transport vorab zu prüfen, bevor ein Agent ihn versucht.

Für Twilio sollten Sie den Transport immer explizit vorab prüfen, wenn der Standardtransport
Chrome ist:

```bash
openclaw googlemeet setup --transport twilio
```

Das erkennt fehlende `voice-call`-Verdrahtung, Twilio-Anmeldedaten oder nicht erreichbare
Webhook-Erreichbarkeit, bevor der Agent versucht, das Meeting anzuwählen.

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

Das agentenseitige `google_meet`-Tool bleibt auf Nicht-macOS-Hosts für
Artefakt-, Kalender-, Setup-, Transcribe-, Twilio- und `chrome-node`-Flows verfügbar. Lokale
Chrome-Rücksprech-Aktionen werden dort blockiert, weil der gebündelte Chrome-Audiopfad
derzeit von macOS `BlackHole 2ch` abhängt. Verwenden Sie unter Linux `mode: "transcribe"`,
Twilio-Einwahl oder einen macOS-`chrome-node`-Host für Chrome-Rücksprech-
Teilnahme.

Ein neues Meeting erstellen und ihm beitreten:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Verwenden Sie für per API erstellte Räume Google Meet `SpaceConfig.accessType`, wenn Sie möchten,
dass die Ohne-Anklopfen-Richtlinie des Raums explizit ist, statt von den Google-
Kontostandards geerbt zu werden:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode realtime
```

`OPEN` lässt alle Personen mit der Meet-URL ohne Anklopfen beitreten. `TRUSTED` lässt die
vertrauenswürdigen Benutzer der Host-Organisation, eingeladene externe Benutzer und Einwahlbenutzer
ohne Anklopfen beitreten. `RESTRICTED` beschränkt den Eintritt ohne Anklopfen auf Eingeladene. Diese
Einstellungen gelten nur für den offiziellen Erstellungspfad der Google Meet API, daher müssen OAuth-
Anmeldedaten konfiguriert sein.

Wenn Sie Google Meet authentifiziert haben, bevor diese Option verfügbar war, führen Sie
`openclaw googlemeet auth login --json` erneut aus, nachdem Sie den
Scope `meetings.space.settings` zu Ihrem Google OAuth-Zustimmungsbildschirm hinzugefügt haben.

Nur die URL erstellen, ohne beizutreten:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` hat zwei Pfade:

- API-Erstellung: wird verwendet, wenn Google Meet OAuth-Anmeldedaten konfiguriert sind. Dies ist
  der deterministischste Pfad und hängt nicht vom Browser-UI-Zustand ab.
- Browser-Fallback: wird verwendet, wenn OAuth-Anmeldedaten fehlen. OpenClaw verwendet den
  gepinnten Chrome-Node, öffnet `https://meet.google.com/new`, wartet darauf, dass Google auf
  eine echte Meeting-Code-URL weiterleitet, und gibt dann diese URL zurück. Dieser Pfad erfordert,
  dass das OpenClaw-Chrome-Profil auf dem Node bereits bei Google angemeldet ist.
  Die Browser-Automatisierung verarbeitet Meets eigene Mikrofonaufforderung beim ersten Start; diese Aufforderung
  wird nicht als Google-Anmeldefehler behandelt.
  Beitritts- und Erstellungs-Flows versuchen außerdem, einen vorhandenen Meet-Tab wiederzuverwenden, bevor sie einen
  neuen öffnen. Der Abgleich ignoriert harmlose URL-Abfragezeichenfolgen wie `authuser`, sodass ein
  erneuter Agentenversuch das bereits geöffnete Meeting fokussieren sollte, statt einen zweiten
  Chrome-Tab zu erstellen.

Die Befehls-/Tool-Ausgabe enthält ein Feld `source` (`api` oder `browser`), damit Agenten
erklären können, welcher Pfad verwendet wurde. `create` tritt dem neuen Meeting standardmäßig bei und
gibt `joined: true` plus die Beitrittssitzung zurück. Um nur die URL zu prägen, verwenden Sie
`create --no-join` in der CLI oder übergeben Sie `"join": false` an das Tool.

Oder sagen Sie einem Agenten: „Erstellen Sie ein Google Meet, treten Sie ihm mit Realtime-Sprache bei und senden
Sie mir den Link.“ Der Agent sollte `google_meet` mit `action: "create"` aufrufen und
anschließend die zurückgegebene `meetingUri` teilen.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Für einen Nur-Beobachten-/Browsersteuerungs-Beitritt setzen Sie `"mode": "transcribe"`. Dadurch wird
die Duplex-Realtime-Sprachbrücke nicht gestartet, BlackHole oder SoX werden nicht benötigt,
und es wird nicht in das Meeting zurückgesprochen. Chrome-Beitritte in diesem Modus vermeiden außerdem
OpenClaws Mikrofon-/Kameraberechtigungserteilung und vermeiden den Meet-Pfad **Mikrofon verwenden**.
Wenn Meet eine Audioauswahl-Zwischenseite anzeigt, versucht die Automatisierung
den Pfad ohne Mikrofon und meldet andernfalls eine manuelle Aktion, statt
das lokale Mikrofon zu öffnen. Im Transcribe-Modus installieren verwaltete Chrome-Transporte außerdem
einen Best-Effort-Meet-Untertitelbeobachter. `googlemeet status --json` und
`googlemeet doctor` zeigen `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`
und einen kurzen `recentTranscript`-Rest an, damit Betreiber erkennen können, ob der Browser
dem Anruf beigetreten ist und ob Meet-Untertitel Text erzeugen.
Verwenden Sie `openclaw googlemeet test-listen <meet-url> --transport chrome-node`, wenn
Sie eine Ja/Nein-Prüfung benötigen: Es tritt im Transcribe-Modus bei, wartet auf frische Untertitel- oder
Transkriptbewegung und gibt `listenVerified`, `listenTimedOut`, Felder für manuelle
Aktionen und den neuesten Untertitelzustand zurück.

Während Realtime-Sitzungen enthält der `google_meet`-Status den Browser- und Audio-Brücken-
Zustand wie `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, letzte Ein-/Ausgabe-
Zeitstempel, Byte-Zähler und den geschlossenen Zustand der Brücke. Wenn eine sichere Meet-Seitenaufforderung
erscheint, verarbeitet die Browser-Automatisierung sie, wenn sie kann. Login, Host-Zulassung und
Browser-/OS-Berechtigungsaufforderungen werden als manuelle Aktion mit Grund und
Nachricht gemeldet, die der Agent weitergeben kann. Verwaltete Chrome-Sitzungen geben die Einführung oder
Testphrase erst aus, nachdem der Browserzustand `inCall: true` meldet; andernfalls meldet der Status
`speechReady: false` und der Sprechversuch wird blockiert, statt vorzugeben, der
Agent habe ins Meeting gesprochen.

Lokale Chrome-Beitritte erfolgen über das angemeldete OpenClaw-Browserprofil. Der Realtime-Modus
erfordert `BlackHole 2ch` für den Mikrofon-/Lautsprecherpfad, den OpenClaw verwendet. Für
sauberes Duplex-Audio verwenden Sie separate virtuelle Geräte oder einen Loopback-artigen Graphen; ein
einzelnes BlackHole-Gerät reicht für einen ersten Smoke-Test, kann aber ein Echo erzeugen.

### Lokaler Gateway + Parallels Chrome

Sie benötigen **keinen** vollständigen OpenClaw Gateway oder Modell-API-Schlüssel in einer macOS-VM,
nur damit die VM Chrome besitzt. Führen Sie Gateway und Agent lokal aus und führen Sie dann einen
Node-Host in der VM aus. Aktivieren Sie das gebündelte Plugin einmal in der VM, damit der Node
den Chrome-Befehl annonciert:

Was wo läuft:

- Gateway-Host: OpenClaw Gateway, Agenten-Workspace, Modell-/API-Schlüssel, Realtime-
  Provider und die Google Meet-Plugin-Konfiguration.
- Parallels-macOS-VM: OpenClaw CLI/Node-Host, Google Chrome, SoX, BlackHole 2ch
  und ein bei Google angemeldetes Chrome-Profil.
- Nicht in der VM benötigt: Gateway-Dienst, Agentenkonfiguration, OpenAI/GPT-Schlüssel oder Modell-
  Provider-Einrichtung.

Installieren Sie die VM-Abhängigkeiten:

```bash
brew install blackhole-2ch sox
```

Starten Sie die VM nach der Installation von BlackHole neu, damit macOS `BlackHole 2ch` bereitstellt:

```bash
sudo reboot
```

Prüfen Sie nach dem Neustart, dass die VM das Audiogerät und die SoX-Befehle sehen kann:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Installieren oder aktualisieren Sie OpenClaw in der VM und aktivieren Sie dort anschließend das gebündelte Plugin:

```bash
openclaw plugins enable google-meet
```

Starten Sie den Node-Host in der VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Wenn `<gateway-host>` eine LAN-IP ist und Sie kein TLS verwenden, verweigert der Node das
Plaintext-WebSocket, sofern Sie sich nicht explizit für dieses vertrauenswürdige private Netzwerk entscheiden:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Verwenden Sie dieselbe Umgebungsvariable, wenn Sie den Node als LaunchAgent installieren:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ist eine Prozessumgebung, keine
`openclaw.json`-Einstellung. `openclaw node install` speichert sie in der LaunchAgent-
Umgebung, wenn sie beim Installationsbefehl vorhanden ist.

Genehmigen Sie den Node vom Gateway-Host aus:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Bestätigen Sie, dass der Gateway den Node sieht und dass er sowohl `googlemeet.chrome`
als auch Browser-Fähigkeit/`browser.proxy` annonciert:

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

oder bitten Sie den Agenten, das `google_meet`-Tool mit `transport: "chrome-node"` zu verwenden.

Für einen Ein-Befehl-Smoke-Test, der eine Sitzung erstellt oder wiederverwendet, eine bekannte
Phrase spricht und den Sitzungszustand ausgibt:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Während des Echtzeit-Beitritts füllt die OpenClaw-Browser-Automatisierung den Gastnamen aus, klickt auf
Beitreten/Beitritt anfragen und akzeptiert Meets Erstausführungs-Auswahl „Mikrofon verwenden“, wenn diese
Aufforderung angezeigt wird. Beim beobachtenden Beitritt oder bei der reinen Browser-Erstellung eines Meetings
fährt sie bei derselben Aufforderung ohne Mikrofon fort, wenn diese Auswahl verfügbar ist.
Wenn das Browser-Profil nicht angemeldet ist, Meet auf die Zulassung durch den Host wartet,
Chrome für einen Echtzeit-Beitritt Mikrofon-/Kameraberechtigung benötigt oder Meet bei einer
Aufforderung festhängt, die die Automatisierung nicht auflösen konnte, meldet das Ergebnis von join/test-speech
`manualActionRequired: true` mit `manualActionReason` und
`manualActionMessage`. Agents sollten den Beitrittsversuch nicht weiter wiederholen, genau diese
Meldung sowie die aktuellen Werte für `browserUrl`/`browserTitle` melden und erst erneut versuchen,
nachdem die manuelle Browser-Aktion abgeschlossen ist.

Wenn `chromeNode.node` weggelassen wird, wählt OpenClaw nur dann automatisch aus, wenn genau ein
verbundener Node sowohl `googlemeet.chrome` als auch Browser-Steuerung meldet. Wenn
mehrere geeignete Nodes verbunden sind, setzen Sie `chromeNode.node` auf die Node-ID,
den Anzeigenamen oder die Remote-IP.

Häufige Fehlerprüfungen:

- `Configured Google Meet node ... is not usable: offline`: Der festgelegte Node ist
  dem Gateway bekannt, aber nicht verfügbar. Agents sollten diesen Node als
  Diagnosezustand behandeln, nicht als verwendbaren Chrome-Host, und den Setup-Blocker
  melden, statt auf einen anderen Transport zurückzufallen, sofern der Benutzer dies nicht verlangt hat.
- `No connected Google Meet-capable node`: Starten Sie `openclaw node run` in der VM,
  genehmigen Sie die Kopplung und stellen Sie sicher, dass `openclaw plugins enable google-meet` und
  `openclaw plugins enable browser` in der VM ausgeführt wurden. Bestätigen Sie außerdem, dass der
  Gateway-Host beide Node-Befehle mit
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]` erlaubt.
- `BlackHole 2ch audio device not found`: Installieren Sie `blackhole-2ch` auf dem geprüften Host
  und starten Sie neu, bevor Sie lokales Chrome-Audio verwenden.
- `BlackHole 2ch audio device not found on the node`: Installieren Sie `blackhole-2ch`
  in der VM und starten Sie die VM neu.
- Chrome öffnet sich, kann aber nicht beitreten: Melden Sie sich im Browser-Profil innerhalb der VM an oder
  lassen Sie `chrome.guestName` für den Gastbeitritt gesetzt. Der automatische Gastbeitritt nutzt die OpenClaw-
  Browser-Automatisierung über den Node-Browser-Proxy; stellen Sie sicher, dass die Node-Browser-
  Konfiguration auf das gewünschte Profil verweist, zum Beispiel
  `browser.defaultProfile: "user"` oder ein benanntes existing-session-Profil.
- Doppelte Meet-Tabs: Lassen Sie `chrome.reuseExistingTab: true` aktiviert. OpenClaw
  aktiviert einen bestehenden Tab für dieselbe Meet-URL, bevor ein neuer geöffnet wird, und
  die Browser-Meeting-Erstellung verwendet einen laufenden `https://meet.google.com/new`
  oder Google-Konto-Aufforderungs-Tab wieder, bevor ein weiterer geöffnet wird.
- Kein Audio: Leiten Sie in Meet Mikrofon-/Lautsprecher-Audio über den von OpenClaw verwendeten
  Pfad des virtuellen Audiogeräts; verwenden Sie separate virtuelle Geräte oder Routing im Loopback-Stil
  für sauberes Duplex-Audio.

## Installationshinweise

Der Chrome-Talkback-Standard verwendet zwei externe Werkzeuge:

- `sox`: Befehlszeilen-Audio-Dienstprogramm. Das Plugin verwendet explizite CoreAudio-
  Gerätebefehle für die standardmäßige 24-kHz-PCM16-Audiobrücke.
- `blackhole-2ch`: virtueller macOS-Audiotreiber. Er erstellt das Audiogerät `BlackHole 2ch`,
  über das Chrome/Meet geroutet werden kann.

OpenClaw bündelt oder vertreibt keines der beiden Pakete. Die Dokumentation fordert Benutzer auf,
sie als Host-Abhängigkeiten über Homebrew zu installieren. SoX ist lizenziert als
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole ist GPL-3.0. Wenn Sie ein
Installationsprogramm oder Appliance-Image erstellen, das BlackHole mit OpenClaw bündelt, prüfen Sie die
Upstream-Lizenzbedingungen von BlackHole oder beziehen Sie eine separate Lizenz von Existential Audio.

## Transporte

### Chrome

Der Chrome-Transport öffnet die Meet-URL über die OpenClaw-Browser-Steuerung und tritt
als angemeldetes OpenClaw-Browser-Profil bei. Unter macOS prüft das Plugin vor dem Start auf
`BlackHole 2ch`. Wenn konfiguriert, führt es außerdem vor dem Öffnen von Chrome einen Health-Befehl
und einen Startbefehl für die Audiobrücke aus. Verwenden Sie `chrome`, wenn
Chrome/Audio auf dem Gateway-Host laufen; verwenden Sie `chrome-node`, wenn Chrome/Audio
auf einem gekoppelten Node wie einer Parallels-macOS-VM laufen. Wählen Sie für lokales Chrome das
Profil mit `browser.defaultProfile`; `chrome.browserProfile` wird an
`chrome-node`-Hosts übergeben.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Leiten Sie Chrome-Mikrofon- und Lautsprecher-Audio durch die lokale OpenClaw-Audiobrücke.
Wenn `BlackHole 2ch` nicht installiert ist, schlägt der Beitritt mit einem Setup-Fehler fehl,
anstatt still ohne Audiopfad beizutreten.

### Twilio

Der Twilio-Transport ist ein strikter Wählplan, der an das Voice Call-Plugin delegiert wird. Er
parst Meet-Seiten nicht nach Telefonnummern.

Verwenden Sie dies, wenn die Chrome-Teilnahme nicht verfügbar ist oder Sie einen Telefon-Einwahl-
Fallback wünschen. Google Meet muss eine Telefon-Einwahlnummer und PIN für das
Meeting bereitstellen; OpenClaw ermittelt diese nicht aus der Meet-Seite.

Aktivieren Sie das Voice Call-Plugin auf dem Gateway-Host, nicht auf dem Chrome-Node:

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

Stellen Sie Twilio-Anmeldedaten über Umgebung oder Konfiguration bereit. Die Umgebung hält
Secrets aus `openclaw.json` heraus:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Starten Sie das Gateway neu oder laden Sie es neu, nachdem Sie `voice-call` aktiviert haben; Plugin-Konfigurationsänderungen
erscheinen in einem bereits laufenden Gateway-Prozess erst, nachdem er neu geladen wurde.

Prüfen Sie anschließend:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Wenn die Twilio-Delegation verdrahtet ist, enthält `googlemeet setup` erfolgreiche
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

## OAuth und Vorabprüfung

OAuth ist zum Erstellen eines Meet-Links optional, da `googlemeet create` auf
Browser-Automatisierung zurückfallen kann. Konfigurieren Sie OAuth, wenn Sie offizielle API-Erstellung,
Space-Auflösung oder Meet Media API-Vorabprüfungen möchten.

Google Meet-API-Zugriff verwendet Benutzer-OAuth: Erstellen Sie einen Google Cloud-OAuth-Client,
fordern Sie die erforderlichen Scopes an, autorisieren Sie ein Google-Konto und speichern Sie anschließend das
resultierende Refresh Token in der Google Meet-Plugin-Konfiguration oder stellen Sie die
Umgebungsvariablen `OPENCLAW_GOOGLE_MEET_*` bereit.

OAuth ersetzt den Chrome-Beitrittspfad nicht. Chrome- und Chrome-node-Transporte
treten weiterhin über ein angemeldetes Chrome-Profil, BlackHole/SoX und einen verbundenen
Node bei, wenn Sie Browser-Teilnahme verwenden. OAuth ist nur für den offiziellen Google
Meet-API-Pfad vorgesehen: Meeting-Spaces erstellen, Spaces auflösen und Meet Media API-
Vorabprüfungen ausführen.

### Google-Anmeldedaten erstellen

In der Google Cloud Console:

1. Erstellen oder wählen Sie ein Google Cloud-Projekt.
2. Aktivieren Sie **Google Meet REST API** für dieses Projekt.
3. Konfigurieren Sie den OAuth-Zustimmungsbildschirm.
   - **Intern** ist für eine Google Workspace-Organisation am einfachsten.
   - **Extern** funktioniert für persönliche/Test-Setups; solange die App im Testmodus ist,
     fügen Sie jedes Google-Konto, das die App autorisieren soll, als Testbenutzer hinzu.
4. Fügen Sie die Scopes hinzu, die OpenClaw anfordert:
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
`accessType` bei der API-Raumerstellung zu übergeben.
`meetings.conference.media.readonly` ist für Meet Media API-Vorabprüfungen und Medienarbeit
vorgesehen; Google kann für die tatsächliche Media API-Nutzung eine Developer Preview-Registrierung verlangen.
Wenn Sie nur browserbasierte Chrome-Beitritte benötigen, überspringen Sie OAuth vollständig.

### Refresh Token erzeugen

Konfigurieren Sie `oauth.clientId` und optional `oauth.clientSecret`, oder übergeben Sie sie als
Umgebungsvariablen, und führen Sie dann aus:

```bash
openclaw googlemeet auth login --json
```

Der Befehl gibt einen `oauth`-Konfigurationsblock mit einem Refresh Token aus. Er verwendet PKCE,
einen localhost-Callback auf `http://localhost:8085/oauth2callback` und einen manuellen
Kopieren/Einfügen-Flow mit `--manual`.

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

Bevorzugen Sie Umgebungsvariablen, wenn Sie das Refresh Token nicht in der Konfiguration haben möchten.
Wenn sowohl Konfigurations- als auch Umgebungswerte vorhanden sind, löst das Plugin zuerst die Konfiguration
und danach den Umgebungs-Fallback auf.

Die OAuth-Zustimmung umfasst Meet-Space-Erstellung, Meet-Space-Lesezugriff und Meet-
Konferenzmedien-Lesezugriff. Wenn Sie sich authentifiziert haben, bevor Unterstützung für die Meeting-Erstellung
existierte, führen Sie `openclaw googlemeet auth login --json` erneut aus, damit das Refresh
Token den Scope `meetings.space.created` hat.

### OAuth mit doctor prüfen

Führen Sie den OAuth-doctor aus, wenn Sie eine schnelle, geheimnisfreie Health-Prüfung möchten:

```bash
openclaw googlemeet doctor --oauth --json
```

Dies lädt nicht die Chrome-Laufzeit und erfordert keinen verbundenen Chrome-Node. Es
prüft, ob eine OAuth-Konfiguration existiert und ob das Refresh Token ein Access Token
erzeugen kann. Der JSON-Bericht enthält nur Statusfelder wie `ok`, `configured`,
`tokenSource`, `expiresAt` und Prüfnachrichten; er gibt weder das Access
Token noch Refresh Token oder Client-Secret aus.

Häufige Ergebnisse:

| Prüfung              | Bedeutung                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` plus `oauth.refreshToken` oder ein zwischengespeichertes Access Token ist vorhanden. |
| `oauth-token`        | Das zwischengespeicherte Access Token ist noch gültig, oder das Refresh Token hat ein neues Access Token erzeugt. |
| `meet-spaces-get`    | Optionale `--meeting`-Prüfung hat einen bestehenden Meet-Space aufgelöst.                |
| `meet-spaces-create` | Optionale `--create-space`-Prüfung hat einen neuen Meet-Space erstellt.                  |

Um auch die Google Meet API-Aktivierung und den Scope `spaces.create` nachzuweisen, führen Sie die
Seiteneffekt-behaftete Erstellungsprüfung aus:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` erstellt eine temporäre Meet-URL. Verwenden Sie es, wenn Sie bestätigen müssen,
dass im Google Cloud-Projekt die Meet API aktiviert ist und das autorisierte
Konto den Scope `meetings.space.created` hat.

So weisen Sie Lesezugriff auf einen vorhandenen Meeting-Space nach:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` und `resolve-space` weisen Lesezugriff auf einen vorhandenen
Space nach, auf den das autorisierte Google-Konto zugreifen kann. Ein `403` aus diesen Prüfungen
bedeutet normalerweise, dass die Google Meet REST API deaktiviert ist, dem zugestimmten Refresh Token
der erforderliche Scope fehlt oder das Google-Konto nicht auf diesen Meet-
Space zugreifen kann. Ein Refresh-Token-Fehler bedeutet, dass Sie `openclaw googlemeet auth login
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

Führen Sie vor Medienarbeiten den Preflight aus:

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
OAuth-Anmeldung, die den readonly-Scope für Calendar-Ereignisse enthält.
`calendar-events` zeigt die passenden Meet-Ereignisse in der Vorschau und markiert das Ereignis, das
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
OpenClaw akzeptiert eine Meet-URL, einen Meeting-Code oder eine `spaces/{id}`-Eingabe und löst sie
zur API-Space-Ressource auf, bevor die aktive Konferenz beendet wird.
Dies ist von `googlemeet leave` getrennt: `leave` stoppt die lokale/Sitzungs-
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
Transkripten, strukturierten Transkripteintrags- und Smart-Note-Ressourcen zurück, wenn
Google sie für das Meeting bereitstellt. Verwenden Sie `--no-transcript-entries`, um bei großen Meetings
die Eintragssuche zu überspringen. `attendance` erweitert Teilnehmer zu
Teilnehmer-Sitzungszeilen mit Zeiten für erstes/letztes Erscheinen, gesamter Sitzungsdauer,
Flags für Verspätung/frühes Verlassen und nach angemeldetem Benutzer oder Anzeigenamen zusammengeführten
doppelten Teilnehmerressourcen. Übergeben Sie `--no-merge-duplicates`, um unverarbeitete Teilnehmer-
Ressourcen getrennt zu halten, `--late-after-minutes`, um die Erkennung von Verspätungen anzupassen, und
`--early-before-minutes`, um die Erkennung von frühem Verlassen anzupassen.

`export` schreibt einen Ordner mit `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` und `manifest.json`.
`manifest.json` protokolliert die gewählte Eingabe, Exportoptionen, Konferenzdatensätze,
Ausgabedateien, Zählwerte, Token-Quelle, das Calendar-Ereignis, wenn eines verwendet wurde, und alle
Warnungen zu teilweisen Abrufen. Übergeben Sie `--zip`, um zusätzlich ein portables Archiv neben
dem Ordner zu schreiben. Übergeben Sie `--include-doc-bodies`, um verknüpften Transkript- und
Smart-Note-Text aus Google Docs über Google Drive `files.export` zu exportieren; dies erfordert eine
frische OAuth-Anmeldung, die den readonly-Scope für Drive Meet enthält. Ohne
`--include-doc-bodies` enthalten Exporte nur Meet-Metadaten und strukturierte Transkript-
Einträge. Wenn Google einen teilweisen Artefaktfehler zurückgibt, etwa einen Fehler beim Auflisten von Smart Notes,
bei Transkripteinträgen oder beim Drive-Dokumentinhalt, behalten Zusammenfassung und
Manifest die Warnung, anstatt den gesamten Export fehlschlagen zu lassen.
Verwenden Sie `--dry-run`, um dieselben Artefakt-/Anwesenheitsdaten abzurufen und das
Manifest-JSON auszugeben, ohne den Ordner oder die ZIP-Datei zu erstellen. Das ist nützlich, bevor Sie
einen großen Export schreiben oder wenn ein Agent nur Zählwerte, ausgewählte Datensätze und
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

Für eine Validierung mit Zuhören zuerst sollten Agenten `test_listen` verwenden, bevor sie behaupten, dass das
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

Führen Sie die Live-Browserprüfung mit Zuhören zuerst gegen ein Meeting aus, in dem jemand
sprechen wird und Meet-Untertitel verfügbar sind:

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
  das Refresh Token bereit.
- Optional: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` und
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` verwenden dieselben Fallback-Namen
  ohne das Präfix `OPENCLAW_`.

Der Basis-Live-Smoke für Artefakte/Anwesenheit benötigt
`https://www.googleapis.com/auth/meetings.space.readonly` und
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Die Kalendersuche
benötigt `https://www.googleapis.com/auth/calendar.events.readonly`. Der Export von Drive-
Dokumentinhalten benötigt
`https://www.googleapis.com/auth/drive.meet.readonly`.

Erstellen Sie einen frischen Meet-Space:

```bash
openclaw googlemeet create
```

Der Befehl gibt die neue `meeting uri`, die Quelle und die Beitrittssitzung aus. Mit OAuth-
Anmeldedaten verwendet er die offizielle Google Meet API. Ohne OAuth-Anmeldedaten verwendet er
als Fallback das angemeldete Browserprofil des gepinnten Chrome-Node. Agenten können
das `google_meet`-Tool mit `action: "create"` verwenden, um in einem Schritt zu erstellen und beizutreten.
Für eine reine URL-Erstellung übergeben Sie `"join": false`.

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

Wenn der Browser-Fallback auf eine Google-Anmeldung oder eine Meet-Berechtigungssperre trifft, bevor er
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

Setzen Sie `preview.enrollmentAcknowledged: true` nur, nachdem Sie bestätigt haben, dass Ihr Cloud-
Projekt, der OAuth-Prinzipal und die Meeting-Teilnehmer im Google
Workspace Developer Preview Program für Meet Media APIs registriert sind.

## Konfiguration

Der gemeinsame Chrome-Agent-Pfad benötigt nur ein aktiviertes Plugin, BlackHole, SoX, einen
Schlüssel für einen Realtime-Transkriptions-Provider und einen konfigurierten OpenClaw-TTS-Provider.
OpenAI ist der standardmäßige Transkriptions-Provider; setzen Sie `realtime.provider: "google"`,
um Google Gemini Live für den `bidi`-Modus zu verwenden:

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
- `defaultMode: "agent"` (`"realtime"` wird als Kompatibilitätsalias für
  `"agent"` akzeptiert)
- `chromeNode.node`: optionale Node-ID, optionaler Node-Name oder optionale IP für `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: Name, der auf dem Meet-Gastbildschirm im abgemeldeten Zustand verwendet wird
- `chrome.autoJoin: true`: bestmögliches Ausfüllen des Gastnamens und Klicken auf „Jetzt teilnehmen“
  über OpenClaw-Browserautomatisierung auf `chrome-node`
- `chrome.reuseExistingTab: true`: einen vorhandenen Meet-Tab aktivieren, statt
  Duplikate zu öffnen
- `chrome.waitForInCallMs: 20000`: warten, bis der Meet-Tab meldet, dass er sich im Anruf befindet,
  bevor die Echtzeit-Einführung ausgelöst wird
- `chrome.audioFormat: "pcm16-24khz"`: Audioformat für das Befehlspaar. Verwenden Sie
  `"g711-ulaw-8khz"` nur für ältere oder benutzerdefinierte Befehlspaare, die noch
  Telefonie-Audio ausgeben.
- `chrome.audioInputCommand`: SoX-Befehl, der aus CoreAudio `BlackHole 2ch`
  liest und Audio in `chrome.audioFormat` schreibt
- `chrome.audioOutputCommand`: SoX-Befehl, der Audio in `chrome.audioFormat`
  liest und nach CoreAudio `BlackHole 2ch` schreibt
- `chrome.bargeInInputCommand`: optionaler lokaler Mikrofonbefehl, der
  vorzeichenbehaftetes 16-Bit-Little-Endian-Mono-PCM für die Erkennung menschlicher Unterbrechungen schreibt,
  während die Assistentenwiedergabe aktiv ist. Dies gilt derzeit für die vom Gateway gehostete
  `chrome`-Befehlspaar-Brücke.
- `chrome.bargeInRmsThreshold: 650`: RMS-Pegel, der als menschliche
  Unterbrechung auf `chrome.bargeInInputCommand` zählt
- `chrome.bargeInPeakThreshold: 2500`: Spitzenpegel, der als menschliche
  Unterbrechung auf `chrome.bargeInInputCommand` zählt
- `chrome.bargeInCooldownMs: 900`: Mindestverzögerung zwischen wiederholten
  Löschungen menschlicher Unterbrechungen
- `mode: "agent"`: Standardmodus für Rücksprache. Sprache von Teilnehmern wird vom
  konfigurierten Echtzeit-Transkriptions-Provider transkribiert, an den konfigurierten
  OpenClaw-Agenten in einer Sub-Agent-Sitzung pro Meeting gesendet und über die
  normale OpenClaw-TTS-Laufzeitumgebung zurückgesprochen.
- `mode: "bidi"`: Fallback-Modus für ein direktes bidirektionales Echtzeitmodell. Der
  Echtzeit-Sprach-Provider beantwortet Teilnehmersprache direkt und kann
  `openclaw_agent_consult` für tiefere, toolgestützte Antworten aufrufen.
- `mode: "transcribe"`: reiner Beobachtungsmodus ohne Rücksprache-Brücke.
- `realtime.provider: "openai"`: Provider-ID, die vom Modus `agent` für Echtzeit-
  Transkription und vom Modus `bidi` für Echtzeit-Sprache verwendet wird.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: kurze gesprochene Antworten, mit
  `openclaw_agent_consult` für tiefere Antworten
- `realtime.introMessage`: kurze gesprochene Bereitschaftsprüfung, wenn die Echtzeit-Brücke
  eine Verbindung herstellt; setzen Sie dies auf `""`, um still beizutreten
- `realtime.agentId`: optionale OpenClaw-Agent-ID für
  `openclaw_agent_consult`; Standardwert ist `main`

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

`voiceCall.enabled` ist standardmäßig `true`; mit Twilio-Transport delegiert es den
eigentlichen PSTN-Anruf, DTMF und die Begrüßung an das Voice Call-Plugin. Voice Call
spielt die DTMF-Sequenz ab, bevor der Echtzeit-Medienstrom geöffnet wird, und verwendet dann den
gespeicherten Einführungstext als erste Echtzeit-Begrüßung. Wenn `voice-call` nicht
aktiviert ist, kann Google Meet den Wählplan weiterhin validieren und aufzeichnen, aber den
Twilio-Anruf nicht platzieren.

## Werkzeug

Agenten können das Tool `google_meet` verwenden:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Verwenden Sie `transport: "chrome"`, wenn Chrome auf dem Gateway-Host ausgeführt wird. Verwenden Sie
`transport: "chrome-node"`, wenn Chrome auf einer gekoppelten Node wie einer Parallels-
VM ausgeführt wird. In beiden Fällen laufen die Modell-Provider und `openclaw_agent_consult` auf dem
Gateway-Host, sodass Modell-Zugangsdaten dort verbleiben. Mit dem standardmäßigen `mode: "agent"`
übernimmt der Echtzeit-Transkriptions-Provider das Zuhören, der konfigurierte OpenClaw-
Agent erzeugt die Antwort, und reguläres OpenClaw-TTS spricht sie in Meet. Verwenden Sie
`mode: "bidi"`, wenn das Echtzeit-Sprachmodell direkt antworten soll.
`mode: "realtime"` wird weiterhin als Kompatibilitätsalias für
`mode: "agent"` akzeptiert.

Verwenden Sie `action: "status"`, um aktive Sitzungen aufzulisten oder eine Sitzungs-ID zu prüfen. Verwenden Sie
`action: "speak"` mit `sessionId` und `message`, damit der Echtzeit-Agent
sofort spricht. Verwenden Sie `action: "test_speech"`, um die Sitzung zu erstellen oder wiederzuverwenden,
eine bekannte Phrase auszulösen und den Zustand `inCall` zurückzugeben, wenn der Chrome-Host ihn
melden kann. `test_speech` erzwingt immer `mode: "agent"` und schlägt fehl, wenn es aufgefordert wird,
in `mode: "transcribe"` zu laufen, da reine Beobachtungssitzungen absichtlich keine
Sprache ausgeben können. Das Ergebnis `speechOutputVerified` basiert darauf, dass die Echtzeit-Audioausgabe-
Bytes während dieses Testaufrufs zunehmen, sodass eine wiederverwendete Sitzung mit älterem Audio
nicht als frische erfolgreiche Sprachprüfung zählt. Verwenden Sie `action: "leave"`, um
eine Sitzung als beendet zu markieren.

`status` enthält Chrome-Zustand, wenn verfügbar:

- `inCall`: Chrome scheint sich innerhalb des Meet-Anrufs zu befinden
- `micMuted`: bestmöglicher Meet-Mikrofonstatus
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: das
  Browserprofil benötigt manuelle Anmeldung, Meet-Host-Zulassung, Berechtigungen oder
  Browsersteuerungsreparatur, bevor Sprache funktionieren kann
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: ob
  verwaltete Chrome-Sprache jetzt erlaubt ist. `speechReady: false` bedeutet, dass OpenClaw
  die Einführungs- oder Testphrase nicht in die Audio-Brücke gesendet hat.
- `providerConnected` / `realtimeReady`: Zustand der Echtzeit-Sprachbrücke
- `lastInputAt` / `lastOutputAt`: zuletzt von der Brücke gesehenes oder an sie gesendetes Audio
- `audioOutputRouted` / `audioOutputDeviceLabel`: ob die Medienausgabe des Meet-Tabs
  aktiv an das von der Brücke verwendete BlackHole-Gerät geleitet wurde
- `lastSuppressedInputAt` / `suppressedInputBytes`: local loopback-Eingabe, die ignoriert wurde, während
  Assistentenwiedergabe aktiv ist

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Agent- und Bidi-Modi

Der Chrome-Modus `agent` ist für das Verhalten „mein Agent ist im Meeting“ optimiert. Der
Echtzeit-Transkriptions-Provider hört das Meeting-Audio, finale Teilnehmer-
Transkripte werden an den konfigurierten OpenClaw-Agenten weitergeleitet, und die Antwort wird
über die normale OpenClaw-TTS-Laufzeitumgebung gesprochen. Setzen Sie `mode: "bidi"`, wenn
das Echtzeit-Sprachmodell direkt antworten soll.
Nahe beieinanderliegende finale Transkriptfragmente werden vor der Konsultation zusammengeführt, damit eine gesprochene
Äußerung nicht mehrere veraltete Teilantworten erzeugt. Echtzeit-Eingabe wird außerdem
unterdrückt, während in die Warteschlange gestelltes Assistenten-Audio noch abgespielt wird,
und kürzliche assistentenähnliche Transkript-Echos werden vor der Agentenkonsultation ignoriert,
damit der BlackHole-local loopback den Agenten nicht seine eigene Sprache beantworten lässt.

| Modus   | Wer die Antwort entscheidet       | Sprachausgabepfad                     | Verwenden Sie dies, wenn                                  |
| ------- | --------------------------------- | ------------------------------------- | --------------------------------------------------------- |
| `agent` | Der konfigurierte OpenClaw-Agent  | Normale OpenClaw-TTS-Laufzeitumgebung | Sie Verhalten wie „mein Agent ist im Meeting“ möchten     |
| `bidi`  | Das Echtzeit-Sprachmodell         | Audioantwort des Echtzeit-Sprach-Providers | Sie die Gesprächsschleife mit der niedrigsten Latenz möchten |

Im `bidi`-Modus kann das Echtzeitmodell `openclaw_agent_consult` aufrufen, wenn es tiefergehendes Reasoning, aktuelle Informationen oder normale OpenClaw-Tools benötigt.

Das Consult-Tool führt im Hintergrund den regulären OpenClaw-Agenten mit aktuellem Meeting-Transkriptkontext aus und gibt eine knappe gesprochene Antwort zurück. Im `agent`-Modus sendet OpenClaw diese Antwort direkt an die TTS-Runtime; im `bidi`-Modus kann das Echtzeit-Sprachmodell das Consult-Ergebnis zurück in das Meeting sprechen. Es verwendet dieselbe gemeinsame Consult-Mechanik wie Voice Call.

Standardmäßig werden Consult-Aufrufe gegen den `main`-Agenten ausgeführt. Setzen Sie `realtime.agentId`, wenn eine Meet-Lane einen dedizierten OpenClaw-Agent-Workspace, Modellstandards, Tool-Richtlinie, Memory und Sitzungsverlauf verwenden soll.

Consult-Aufrufe im Agent-Modus verwenden einen sitzungsbezogenen Sitzungsschlüssel `agent:<id>:subagent:google-meet:<session>`, damit Folgefragen den Meeting-Kontext behalten und gleichzeitig die normale Agent-Richtlinie vom konfigurierten Agenten übernehmen.

`realtime.toolPolicy` steuert den Consult-Lauf:

- `safe-read-only`: Das Consult-Tool bereitstellen und den regulären Agenten auf `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` und `memory_get` beschränken.
- `owner`: Das Consult-Tool bereitstellen und dem regulären Agenten die normale Agent-Tool-Richtlinie erlauben.
- `none`: Das Consult-Tool dem Echtzeit-Sprachmodell nicht bereitstellen.

Der Consult-Sitzungsschlüssel ist pro Meet-Sitzung begrenzt, sodass nachfolgende Consult-Aufrufe während desselben Meetings vorherigen Consult-Kontext wiederverwenden können.

Um eine gesprochene Bereitschaftsprüfung zu erzwingen, nachdem Chrome dem Anruf vollständig beigetreten ist:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Für den vollständigen Join-and-Speak-Smoke:

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

Erwarteter Chrome-Node-Status:

- `googlemeet setup` ist vollständig grün.
- `googlemeet setup` enthält `chrome-node-connected`, wenn Chrome-node der Standardtransport ist oder eine Node festgelegt ist.
- `nodes status` zeigt, dass die ausgewählte Node verbunden ist.
- Die ausgewählte Node bewirbt sowohl `googlemeet.chrome` als auch `browser.proxy`.
- Der Meet-Tab tritt dem Anruf bei, und `test-speech` gibt Chrome-Health mit `inCall: true` zurück.

Für einen Remote-Chrome-Host wie eine Parallels-macOS-VM ist dies die kürzeste sichere Prüfung nach dem Aktualisieren des Gateway oder der VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Das belegt, dass das Gateway-Plugin geladen ist, die VM-Node mit dem aktuellen Token verbunden ist und die Meet-Audio-Bridge verfügbar ist, bevor ein Agent einen echten Meeting-Tab öffnet.

Für einen Twilio-Smoke verwenden Sie ein Meeting, das Telefoneinwahldaten bereitstellt:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Erwarteter Twilio-Status:

- `googlemeet setup` enthält grüne Prüfungen für `twilio-voice-call-plugin`,
  `twilio-voice-call-credentials` und `twilio-voice-call-webhook`.
- `voicecall` ist nach dem Neuladen des Gateway in der CLI verfügbar.
- Die zurückgegebene Sitzung hat `transport: "twilio"` und eine `twilio.voiceCallId`.
- `openclaw logs --follow` zeigt, dass DTMF-TwiML vor Echtzeit-TwiML bereitgestellt wurde, danach eine
  Echtzeit-Bridge mit der eingereihten ersten Begrüßung.
- `googlemeet leave <sessionId>` legt den delegierten Sprachanruf auf.

## Fehlerbehebung

### Agent kann das Google Meet-Tool nicht sehen

Bestätigen Sie, dass das Plugin in der Gateway-Konfiguration aktiviert ist, und laden Sie das Gateway neu:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Wenn Sie gerade `plugins.entries.google-meet` bearbeitet haben, starten oder laden Sie das Gateway neu.
Der laufende Agent sieht nur Plugin-Tools, die vom aktuellen Gateway-Prozess
registriert wurden.

Auf nicht-macOS-Gateway-Hosts bleibt das agentenseitige Tool `google_meet` sichtbar,
aber lokale Chrome-Rücksprechaktionen werden blockiert, bevor sie die Audio-Bridge erreichen.
Lokales Chrome-Rücksprech-Audio hängt derzeit von macOS `BlackHole 2ch` ab. Daher
sollten Linux-Agenten `mode: "transcribe"`, Twilio-Einwahl oder stattdessen einen macOS-
`chrome-node`-Host anstelle des standardmäßigen lokalen Chrome-Agent-Pfads verwenden.

### Kein verbundener Google Meet-fähiger Node

Führen Sie auf dem Node-Host aus:

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
Die Gateway-Konfiguration muss diese Node-Befehle erlauben:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Wenn `googlemeet setup` bei `chrome-node-connected` fehlschlägt oder das Gateway-Protokoll
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

### Browser wird geöffnet, aber Agent kann nicht beitreten

Führen Sie `googlemeet test-listen` für reine Beobachtungsbeitritte oder `googlemeet test-speech`
für Echtzeitbeitritte aus, und prüfen Sie anschließend die zurückgegebene Chrome-Zustandsprüfung. Wenn eine der beiden Prüfungen
`manualActionRequired: true` meldet, zeigen Sie dem Bediener `manualActionMessage`
an und beenden Sie Wiederholungen, bis die Browseraktion abgeschlossen ist.

Häufige manuelle Aktionen:

- Beim Chrome-Profil anmelden.
- Den Gast über das Meet-Hostkonto zulassen.
- Chrome-Mikrofon-/Kameraberechtigungen erteilen, wenn die native Berechtigungsabfrage
  von Chrome erscheint.
- Einen hängenden Meet-Berechtigungsdialog schließen oder reparieren.

Melden Sie nicht „nicht angemeldet“, nur weil Meet „Do you want people to
hear you in the meeting?“ anzeigt. Das ist Meets Zwischenschritt zur Audioauswahl; OpenClaw
klickt **Use microphone** per Browserautomatisierung, wenn verfügbar, und wartet weiter
auf den tatsächlichen Meeting-Status. Für den Browser-Fallback nur zur Erstellung kann OpenClaw
**Continue without microphone** klicken, weil das Erstellen der URL den Echtzeit-Audiopfad nicht benötigt.

### Meeting-Erstellung schlägt fehl

`googlemeet create` verwendet zuerst den Google Meet API-Endpunkt `spaces.create`,
wenn OAuth-Anmeldedaten konfiguriert sind. Ohne OAuth-Anmeldedaten fällt es
auf den angehefteten Chrome-Node-Browser zurück. Bestätigen Sie:

- Für API-Erstellung: `oauth.clientId` und `oauth.refreshToken` sind konfiguriert,
  oder passende Umgebungsvariablen `OPENCLAW_GOOGLE_MEET_*` sind vorhanden.
- Für API-Erstellung: Das Refresh-Token wurde erstellt, nachdem Erstellungsunterstützung
  hinzugefügt wurde. Ältere Tokens enthalten möglicherweise nicht den Scope `meetings.space.created`; führen Sie
  `openclaw googlemeet auth login --json` erneut aus und aktualisieren Sie die Plugin-Konfiguration.
- Für Browser-Fallback: `defaultTransport: "chrome-node"` und
  `chromeNode.node` zeigen auf einen verbundenen Node mit `browser.proxy` und
  `googlemeet.chrome`.
- Für Browser-Fallback: Das OpenClaw-Chrome-Profil auf diesem Node ist bei Google angemeldet
  und kann `https://meet.google.com/new` öffnen.
- Für Browser-Fallback: Wiederholungen verwenden einen vorhandenen `https://meet.google.com/new`-
  oder Google-Konto-Aufforderungs-Tab erneut, bevor ein neuer Tab geöffnet wird. Wenn ein Agent eine Zeitüberschreitung erreicht,
  wiederholen Sie den Tool-Aufruf, statt manuell einen weiteren Meet-Tab zu öffnen.
- Für Browser-Fallback: Wenn das Tool `manualActionRequired: true` zurückgibt, verwenden Sie
  die zurückgegebenen Werte `browser.nodeId`, `browser.targetId`, `browserUrl` und
  `manualActionMessage`, um den Bediener anzuleiten. Wiederholen Sie nicht in einer Schleife, bis diese
  Aktion abgeschlossen ist.
- Für Browser-Fallback: Wenn Meet „Do you want people to hear you in the
  meeting?“ anzeigt, lassen Sie den Tab geöffnet. OpenClaw sollte per Browserautomatisierung
  **Use microphone** oder, beim Fallback nur zur Erstellung, **Continue without microphone**
  klicken und weiter auf die generierte Meet-URL warten. Wenn das nicht möglich ist, sollte der
  Fehler `meet-audio-choice-required` erwähnen, nicht `google-login-required`.

### Agent tritt bei, spricht aber nicht

Prüfen Sie den Echtzeitpfad:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Verwenden Sie `mode: "agent"` für den normalen Pfad STT -> OpenClaw-Agent -> TTS-Rücksprache
oder `mode: "bidi"` für den direkten Echtzeit-Sprach-Fallback. `mode: "transcribe"`
startet die Rücksprech-Bridge absichtlich nicht. Für reine Beobachtungsdiagnosen
führen Sie `openclaw googlemeet status --json <session-id>` aus, nachdem Teilnehmende gesprochen haben,
und prüfen Sie `captioning`, `transcriptLines` und `lastCaptionText`. Wenn `inCall`
true ist, aber `transcriptLines` bei `0` bleibt, sind Meet-Untertitel möglicherweise deaktiviert, niemand
hat gesprochen, seit der Beobachter installiert wurde, die Meet-Benutzeroberfläche hat sich geändert, oder Live-
Untertitel sind für die Meetingsprache bzw. das Konto nicht verfügbar.

`googlemeet test-speech` prüft immer den Echtzeitpfad und meldet, ob
Bridge-Ausgabebytes für diesen Aufruf beobachtet wurden. Wenn `speechOutputVerified` false und
`speechOutputTimedOut` true ist, hat der Echtzeit-Provider die
Äußerung möglicherweise akzeptiert, aber OpenClaw hat keine neuen Ausgabebytes gesehen, die die Chrome-Audio-
Bridge erreichen.

Überprüfen Sie außerdem:

- Auf dem Gateway-Host ist ein Echtzeit-Provider-Schlüssel verfügbar, etwa
  `OPENAI_API_KEY` oder `GEMINI_API_KEY`.
- `BlackHole 2ch` ist auf dem Chrome-Host sichtbar.
- `sox` ist auf dem Chrome-Host vorhanden.
- Meet-Mikrofon und -Lautsprecher werden über den von OpenClaw verwendeten virtuellen Audiopfad
  geleitet. `doctor` sollte für lokale Chrome-Echtzeitbeitritte `meet output routed: yes` anzeigen.

`googlemeet doctor [session-id]` gibt Sitzung, Node, Anrufstatus,
Grund für manuelle Aktion, Echtzeit-Provider-Verbindung, `realtimeReady`, Audio-
Eingabe-/Ausgabeaktivität, letzte Audio-Zeitstempel, Bytezähler und Browser-URL aus.
Verwenden Sie `googlemeet status [session-id] --json`, wenn Sie das rohe JSON benötigen. Verwenden Sie
`googlemeet doctor --oauth`, wenn Sie die Google Meet-OAuth-Aktualisierung
ohne Offenlegung von Tokens überprüfen müssen; fügen Sie `--meeting` oder `--create-space` hinzu, wenn Sie außerdem einen
Google Meet API-Nachweis benötigen.

Wenn ein Agent eine Zeitüberschreitung erreicht hat und Sie bereits einen geöffneten Meet-Tab sehen, prüfen Sie diesen Tab,
ohne einen weiteren zu öffnen:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Die entsprechende Tool-Aktion ist `recover_current_tab`. Sie fokussiert und prüft einen
vorhandenen Meet-Tab für den ausgewählten Transport. Mit `chrome` verwendet sie lokale
Browsersteuerung über das Gateway; mit `chrome-node` verwendet sie den konfigurierten
Chrome-Node. Sie öffnet keinen neuen Tab und erstellt keine neue Sitzung; sie meldet den
aktuellen Blocker, etwa Anmeldung, Zulassung, Berechtigungen oder Audioauswahlstatus.
Der CLI-Befehl spricht mit dem konfigurierten Gateway, daher muss das Gateway laufen;
`chrome-node` erfordert außerdem, dass der Chrome-Node verbunden ist.

### Twilio-Einrichtungsprüfungen schlagen fehl

`twilio-voice-call-plugin` schlägt fehl, wenn `voice-call` nicht erlaubt oder nicht aktiviert ist.
Fügen Sie es zu `plugins.allow` hinzu, aktivieren Sie `plugins.entries.voice-call`, und laden Sie das
Gateway neu.

`twilio-voice-call-credentials` schlägt fehl, wenn dem Twilio-Backend Konto-
SID, Auth-Token oder Anrufernummer fehlen. Setzen Sie diese auf dem Gateway-Host:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` schlägt fehl, wenn `voice-call` keine öffentliche Webhook-
Verfügbarkeit hat oder wenn `publicUrl` auf loopback oder privaten Netzwerkadressraum zeigt.
Setzen Sie `plugins.entries.voice-call.config.publicUrl` auf die öffentliche Provider-URL oder
konfigurieren Sie eine `voice-call`-Tunnel-/Tailscale-Verfügbarkeit.

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

Verwenden Sie für lokale Entwicklung eine Tunnel- oder Tailscale-Verfügbarkeit statt einer privaten
Host-URL:

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

Starten oder laden Sie dann das Gateway neu und führen Sie aus:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` ist standardmäßig nur eine Bereitschaftsprüfung. Für einen Testlauf mit einer bestimmten Nummer:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Fügen Sie `--yes` nur hinzu, wenn Sie bewusst einen ausgehenden Live-Benachrichtigungsanruf
platzieren möchten:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio-Anruf startet, tritt dem Meeting aber nie bei

Bestätigen Sie, dass das Meet-Ereignis Telefon-Einwahldetails bereitstellt. Übergeben Sie die genaue Einwahl-
nummer und PIN oder eine benutzerdefinierte DTMF-Sequenz:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Verwenden Sie führende `w` oder Kommas in `--dtmf-sequence`, wenn der Provider vor
Eingabe der PIN eine Pause benötigt.

Wenn der Telefonanruf erstellt wird, aber die Meet-Teilnehmerliste den Einwahl-
Teilnehmer nie anzeigt:

- Führen Sie `openclaw googlemeet doctor <session-id>` aus, um die delegierte Twilio-
  Anruf-ID zu bestätigen, ob DTMF eingereiht wurde und ob die Einführungsbegrüßung angefordert wurde.
- Führen Sie `openclaw voicecall status --call-id <id>` aus und bestätigen Sie, dass der Anruf noch
  aktiv ist.
- Führen Sie `openclaw voicecall tail` aus und prüfen Sie, ob Twilio-Webhooks am
  Gateway ankommen.
- Führen Sie `openclaw logs --follow` aus und suchen Sie nach der Twilio-Meet-Sequenz: Google
  Meet delegiert den Beitritt, Voice Call startet die Telefonverbindung, Google Meet wartet
  `voiceCall.dtmfDelayMs`, sendet DTMF mit `voicecall.dtmf`, wartet
  `voiceCall.postDtmfSpeechDelayMs` und fordert dann Einführungsansprache mit
  `voicecall.speak` an.
- Führen Sie `openclaw googlemeet setup --transport twilio` erneut aus; eine grüne Einrichtungsprüfung ist
  erforderlich, beweist aber nicht, dass die Meeting-PIN-Sequenz korrekt ist.
- Bestätigen Sie, dass die Einwahlnummer zur gleichen Meet-Einladung und Region wie
  die PIN gehört.
- Erhöhen Sie `voiceCall.dtmfDelayMs`, wenn Meet langsam antwortet oder das Anruftranskript
  nach dem Senden von DTMF weiterhin die Aufforderung zur PIN-Eingabe zeigt.
- Wenn der Teilnehmer beitritt, Sie die Begrüßung aber nicht hören, prüfen Sie
  `openclaw logs --follow` auf die Post-DTMF-Anforderung `voicecall.speak` und
  entweder Medienstream-TTS-Wiedergabe oder den Twilio-`<Say>`-Fallback. Wenn das Anruf-
  transkript weiterhin „enter the meeting PIN“ enthält, ist die Telefonverbindung dem
  Meet-Raum noch nicht beigetreten, sodass Meetingteilnehmende keine Sprache hören.

Wenn Webhooks nicht ankommen, debuggen Sie zuerst das Voice Call Plugin: Der Provider muss `plugins.entries.voice-call.config.publicUrl` oder den konfigurierten Tunnel erreichen. Siehe [Fehlerbehebung für Voice Call](/de/plugins/voice-call#troubleshooting).

## Hinweise

Die offizielle Medien-API von Google Meet ist empfangsorientiert, daher benötigt das Sprechen in einen Meet-Anruf weiterhin einen Teilnehmerpfad. Dieses Plugin macht diese Grenze sichtbar: Chrome übernimmt die Browser-Teilnahme und das lokale Audio-Routing; Twilio übernimmt die Telefon-Einwahlteilnahme.

Chrome-Talkback-Modi benötigen `BlackHole 2ch` sowie entweder:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw besitzt die Bridge und leitet Audio in `chrome.audioFormat` zwischen diesen Befehlen und dem ausgewählten Provider weiter. Der Agent-Modus verwendet Echtzeit-Transkription plus reguläres TTS; der bidi-Modus verwendet den Echtzeit-Voice-Provider. Der Standard-Chrome-Pfad ist 24 kHz PCM16; 8 kHz G.711 mu-law bleibt für ältere Befehlspaare verfügbar.
- `chrome.audioBridgeCommand`: Ein externer Bridge-Befehl besitzt den gesamten lokalen Audiopfad und muss nach dem Starten oder Validieren seines Daemons beendet werden. Dies ist nur für `bidi` gültig, da der `agent`-Modus direkten Zugriff auf Befehlspaare für TTS benötigt.

Für sauberes Duplex-Audio routen Sie Meet-Ausgabe und Meet-Mikrofon über getrennte virtuelle Geräte oder einen virtuellen Gerätegraphen im Loopback-Stil. Ein einzelnes gemeinsam genutztes BlackHole-Gerät kann andere Teilnehmer zurück in den Anruf echoen.

Mit der Chrome-Bridge aus Befehlspaaren kann `chrome.bargeInInputCommand` ein separates lokales Mikrofon abhören und die Assistentenwiedergabe löschen, wenn der Mensch zu sprechen beginnt. Dadurch bleibt menschliche Sprache vor der Assistentenausgabe, selbst wenn die gemeinsam genutzte BlackHole-loopback-Eingabe während der Assistentenwiedergabe vorübergehend unterdrückt wird. Wie `chrome.audioInputCommand` und `chrome.audioOutputCommand` ist dies ein lokal vom Operator konfigurierter Befehl. Verwenden Sie einen expliziten vertrauenswürdigen Befehlspfad oder eine Argumentliste, und verweisen Sie nicht auf Skripte aus nicht vertrauenswürdigen Orten.

`googlemeet speak` löst die aktive Talkback-Audio-Bridge für eine Chrome-Sitzung aus. `googlemeet leave` stoppt diese Bridge. Für Twilio-Sitzungen, die über das Voice Call Plugin delegiert werden, legt `leave` auch den zugrunde liegenden Sprachanruf auf. Verwenden Sie `googlemeet end-active-conference`, wenn Sie außerdem die aktive Google Meet-Konferenz für einen API-verwalteten Bereich schließen möchten.

## Verwandte Themen

- [Voice Call Plugin](/de/plugins/voice-call)
- [Talk-Modus](/de/nodes/talk)
- [Plugins erstellen](/de/plugins/building-plugins)
