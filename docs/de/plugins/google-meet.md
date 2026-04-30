---
read_when:
    - Sie möchten, dass ein OpenClaw-Agent an einem Google Meet-Anruf teilnimmt
    - Sie möchten, dass ein OpenClaw-Agent einen neuen Google Meet-Anruf erstellt
    - Sie konfigurieren Chrome, Chrome-Node oder Twilio als Google Meet-Transport
summary: 'Google Meet-Plugin: expliziten Meet-URLs über Chrome oder Twilio mit Standardvorgaben für Echtzeit-Sprache beitreten'
title: Google Meet-Plugin
x-i18n:
    generated_at: "2026-04-30T07:05:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b989c872fee0dca31680f67559cd26b715303f7c6f4eeda51fc63889bb0383c
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet-Teilnehmerunterstützung für OpenClaw — das Plugin ist bewusst explizit ausgelegt:

- Es tritt nur einer expliziten `https://meet.google.com/...`-URL bei.
- Es kann über die Google Meet API einen neuen Meet-Raum erstellen und dann der
  zurückgegebenen URL beitreten.
- `realtime`-Sprache ist der Standardmodus.
- Realtime-Sprache kann in den vollständigen OpenClaw Agent zurückrufen, wenn
  tiefere Schlussfolgerungen oder Tools benötigt werden.
- Agenten wählen das Beitrittsverhalten mit `mode`: Verwenden Sie `realtime` für
  Live-Mithören/Rücksprechen oder `transcribe`, um den Browser ohne die
  Realtime-Sprachbrücke beizutreten/zu steuern.
- Die Authentifizierung beginnt mit persönlichem Google OAuth oder einem bereits
  angemeldeten Chrome-Profil.
- Es gibt keine automatische Zustimmungsankündigung.
- Das standardmäßige Chrome-Audio-Backend ist `BlackHole 2ch`.
- Chrome kann lokal oder auf einem gekoppelten Node-Host ausgeführt werden.
- Twilio akzeptiert eine Einwahlnummer plus optionaler PIN oder DTMF-Sequenz.
- Der CLI-Befehl ist `googlemeet`; `meet` ist für umfassendere
  Telekonferenz-Workflows von Agenten reserviert.

## Schnellstart

Installieren Sie die lokalen Audio-Abhängigkeiten und konfigurieren Sie einen
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
modusabhängig. Sie meldet Chrome-Profil, Node-Pinning und, bei Realtime-Chrome-
Beitritten, die BlackHole/SoX-Audiobrücke sowie verzögerte Prüfungen der
Realtime-Einführung. Für reine Beobachtungsbeitritte prüfen Sie denselben
Transport mit `--mode transcribe`; dieser Modus überspringt die
Realtime-Audio-Voraussetzungen, weil er weder über die Brücke hört noch über sie
spricht:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Wenn Twilio-Delegation konfiguriert ist, meldet das Setup außerdem, ob das
`voice-call`-Plugin und die Twilio-Anmeldedaten bereit sind. Behandeln Sie jede
Prüfung mit `ok: false` als Blocker für den geprüften Transport und Modus, bevor
Sie einen Agenten bitten beizutreten. Verwenden Sie `openclaw googlemeet setup --json`
für Skripte oder maschinenlesbare Ausgabe. Verwenden Sie `--transport chrome`,
`--transport chrome-node` oder `--transport twilio`, um einen bestimmten
Transport vorab zu prüfen, bevor ein Agent ihn versucht.

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
  "mode": "realtime"
}
```

Ein neues Meeting erstellen und ihm beitreten:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Nur die URL erstellen, ohne beizutreten:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` hat zwei Pfade:

- API-Erstellung: Wird verwendet, wenn Google Meet OAuth-Anmeldedaten
  konfiguriert sind. Dies ist der deterministischste Pfad und hängt nicht vom
  Zustand der Browser-UI ab.
- Browser-Fallback: Wird verwendet, wenn OAuth-Anmeldedaten fehlen. OpenClaw
  verwendet den gepinnten Chrome-Node, öffnet `https://meet.google.com/new`,
  wartet, bis Google zu einer echten Meeting-Code-URL weiterleitet, und gibt
  diese URL dann zurück. Dieser Pfad erfordert, dass das OpenClaw Chrome-Profil
  auf dem Node bereits bei Google angemeldet ist.
  Die Browser-Automatisierung behandelt Meets eigene erstmalige Mikrofonabfrage;
  diese Abfrage wird nicht als Google-Anmeldefehler behandelt.
  Beitritts- und Erstellungsabläufe versuchen außerdem, einen vorhandenen
  Meet-Tab wiederzuverwenden, bevor ein neuer geöffnet wird. Der Abgleich
  ignoriert harmlose URL-Abfragezeichenfolgen wie `authuser`, sodass ein
  erneuter Agentenversuch das bereits geöffnete Meeting fokussieren sollte,
  statt einen zweiten Chrome-Tab zu erstellen.

Die Befehls-/Tool-Ausgabe enthält ein Feld `source` (`api` oder `browser`),
damit Agenten erklären können, welcher Pfad verwendet wurde. `create` tritt dem
neuen Meeting standardmäßig bei und gibt `joined: true` plus die Beitrittssitzung
zurück. Um nur die URL zu erzeugen, verwenden Sie `create --no-join` in der CLI
oder übergeben Sie `"join": false` an das Tool.

Oder sagen Sie einem Agenten: „Erstellen Sie ein Google Meet, treten Sie ihm mit
Realtime-Sprache bei und senden Sie mir den Link.“ Der Agent sollte `google_meet`
mit `action: "create"` aufrufen und dann die zurückgegebene `meetingUri` teilen.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Für einen reinen Beobachtungs-/Browsersteuerungsbeitritt setzen Sie `"mode": "transcribe"`.
Das startet nicht die Duplex-Realtime-Modellbrücke, erfordert weder BlackHole
noch SoX und spricht nicht in das Meeting zurück. Chrome-Beitritte in diesem
Modus vermeiden außerdem die OpenClaw-Erteilung von Mikrofon-/Kameraberechtigungen
und den Meet-Pfad **Mikrofon verwenden**. Wenn Meet eine Audioauswahl-
Zwischenseite zeigt, versucht die Automatisierung den Pfad ohne Mikrofon und
meldet andernfalls eine manuelle Aktion, statt das lokale Mikrofon zu öffnen.

Während Realtime-Sitzungen enthält der `google_meet`-Status Browser- und
Audiobrücken-Integrität wie `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, Zeitstempel der letzten
Ein-/Ausgabe, Byte-Zähler und den geschlossenen Zustand der Brücke. Wenn eine
sichere Meet-Seitenabfrage erscheint, behandelt die Browser-Automatisierung sie,
wenn sie kann. Anmelde-, Gastgeberzulassungs- und Browser-/OS-Berechtigungsabfragen
werden als manuelle Aktion mit Grund und Nachricht gemeldet, die der Agent
weitergeben soll. Verwaltete Chrome-Sitzungen geben die Einführungs- oder
Testphrase erst aus, nachdem die Browser-Integrität `inCall: true` meldet;
andernfalls meldet der Status `speechReady: false`, und der Sprechversuch wird
blockiert, statt vorzugeben, der Agent habe in das Meeting gesprochen.

Lokale Chrome-Beitritte erfolgen über das angemeldete OpenClaw-Browserprofil.
Der Realtime-Modus erfordert `BlackHole 2ch` für den von OpenClaw verwendeten
Mikrofon-/Lautsprecherpfad. Für sauberes Duplex-Audio verwenden Sie getrennte
virtuelle Geräte oder einen Loopback-artigen Graphen; ein einzelnes BlackHole-
Gerät reicht für einen ersten Smoke-Test aus, kann aber Echo verursachen.

### Lokales Gateway + Parallels Chrome

Sie benötigen kein vollständiges OpenClaw Gateway und keinen Modell-API-Schlüssel
innerhalb einer macOS-VM, nur damit die VM Chrome besitzt. Führen Sie Gateway und
Agent lokal aus und starten Sie dann einen Node-Host in der VM. Aktivieren Sie
das gebündelte Plugin einmal in der VM, damit der Node den Chrome-Befehl
ankündigt:

Was wo läuft:

- Gateway-Host: OpenClaw Gateway, Agent-Arbeitsbereich, Modell-/API-Schlüssel,
  Realtime-Provider und die Google Meet-Plugin-Konfiguration.
- Parallels-macOS-VM: OpenClaw CLI/Node-Host, Google Chrome, SoX, BlackHole 2ch
  und ein bei Google angemeldetes Chrome-Profil.
- In der VM nicht benötigt: Gateway-Dienst, Agent-Konfiguration, OpenAI/GPT-
  Schlüssel oder Modell-Provider-Einrichtung.

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
dann das gebündelte Plugin:

```bash
openclaw plugins enable google-meet
```

Starten Sie den Node-Host in der VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Wenn `<gateway-host>` eine LAN-IP ist und Sie kein TLS verwenden, verweigert der
Node den Klartext-WebSocket, sofern Sie sich nicht ausdrücklich für dieses
vertrauenswürdige private Netzwerk entscheiden:

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
`googlemeet.chrome` als auch Browser-Fähigkeit/`browser.proxy` ankündigt:

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

Treten Sie nun wie gewohnt vom Gateway-Host aus bei:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

oder bitten Sie den Agenten, das `google_meet`-Tool mit `transport: "chrome-node"`
zu verwenden.

Für einen Ein-Befehl-Smoke-Test, der eine Sitzung erstellt oder wiederverwendet,
eine bekannte Phrase spricht und die Sitzungsintegrität ausgibt:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Während des Realtime-Beitritts trägt die OpenClaw-Browser-Automatisierung den
Gastnamen ein, klickt auf Beitreten/Beitritt anfragen und akzeptiert Meets
erstmalige Auswahl „Mikrofon verwenden“, wenn diese Abfrage erscheint. Während
eines reinen Beobachtungsbeitritts oder einer browserbasierten Meeting-Erstellung
fährt sie bei derselben Abfrage ohne Mikrofon fort, wenn diese Auswahl verfügbar
ist. Wenn das Browserprofil nicht angemeldet ist, Meet auf Gastgeberzulassung
wartet, Chrome Mikrofon-/Kameraberechtigung für einen Realtime-Beitritt benötigt
oder Meet auf einer Abfrage festhängt, die die Automatisierung nicht lösen konnte,
meldet das Ergebnis von join/test-speech `manualActionRequired: true` mit
`manualActionReason` und `manualActionMessage`. Agenten sollten den Beitrittsversuch
nicht weiter wiederholen, diese genaue Nachricht plus die aktuelle `browserUrl`/
`browserTitle` melden und erst nach Abschluss der manuellen Browseraktion erneut
versuchen.

Wenn `chromeNode.node` weggelassen wird, wählt OpenClaw nur dann automatisch aus,
wenn genau ein verbundener Node sowohl `googlemeet.chrome` als auch Browsersteuerung
ankündigt. Wenn mehrere geeignete Nodes verbunden sind, setzen Sie `chromeNode.node`
auf die Node-ID, den Anzeigenamen oder die Remote-IP.

Häufige Fehlerprüfungen:

- `Configured Google Meet node ... is not usable: offline`: Die fixierte Node ist dem Gateway
  bekannt, aber nicht verfügbar. Agenten sollten diese Node als
  Diagnosezustand behandeln, nicht als nutzbaren Chrome-Host, und den
  Einrichtungsblocker melden, statt auf einen anderen Transport zurückzufallen,
  außer der Benutzer hat dies ausdrücklich angefordert.
- `No connected Google Meet-capable node`: Starten Sie `openclaw node run` in der VM,
  genehmigen Sie das Pairing, und stellen Sie sicher, dass `openclaw plugins enable google-meet` und
  `openclaw plugins enable browser` in der VM ausgeführt wurden. Bestätigen Sie außerdem, dass der
  Gateway-Host beide Node-Befehle mit
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]` erlaubt.
- `BlackHole 2ch audio device not found`: Installieren Sie `blackhole-2ch` auf dem geprüften Host
  und starten Sie ihn neu, bevor Sie lokales Chrome-Audio verwenden.
- `BlackHole 2ch audio device not found on the node`: Installieren Sie `blackhole-2ch`
  in der VM und starten Sie die VM neu.
- Chrome öffnet sich, kann aber nicht beitreten: Melden Sie sich im Browserprofil innerhalb der VM an, oder
  lassen Sie `chrome.guestName` für den Gastbeitritt gesetzt. Der automatische Gastbeitritt verwendet OpenClaw
  Browser-Automatisierung über den Node-Browser-Proxy; stellen Sie sicher, dass die Node-Browser-
  Konfiguration auf das gewünschte Profil verweist, zum Beispiel
  `browser.defaultProfile: "user"` oder ein benanntes Profil einer bestehenden Sitzung.
- Doppelte Meet-Tabs: Lassen Sie `chrome.reuseExistingTab: true` aktiviert. OpenClaw
  aktiviert einen bestehenden Tab für dieselbe Meet-URL, bevor ein neuer geöffnet wird, und
  die Browser-Meeting-Erstellung verwendet einen laufenden `https://meet.google.com/new`-
  oder Google-Konto-Aufforderungstab wieder, bevor ein weiterer geöffnet wird.
- Kein Audio: Leiten Sie in Meet Mikrofon-/Lautsprecher-Audio über den von OpenClaw verwendeten
  virtuellen Audiogerätepfad; verwenden Sie separate virtuelle Geräte oder Loopback-ähnliches Routing
  für sauberes Duplex-Audio.

## Installationshinweise

Der Chrome-Echtzeitstandard verwendet zwei externe Tools:

- `sox`: Audio-Dienstprogramm für die Befehlszeile. Das Plugin verwendet explizite CoreAudio-
  Gerätebefehle für die standardmäßige 24-kHz-PCM16-Audio-Bridge.
- `blackhole-2ch`: virtueller macOS-Audiotreiber. Er erstellt das Audiogerät `BlackHole 2ch`,
  über das Chrome/Meet routen kann.

OpenClaw bündelt oder verteilt keines der beiden Pakete. Die Dokumentation fordert Benutzer auf,
sie als Host-Abhängigkeiten über Homebrew zu installieren. SoX ist lizenziert als
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole ist GPL-3.0. Wenn Sie ein
Installationsprogramm oder eine Appliance erstellen, die BlackHole mit OpenClaw bündelt, prüfen Sie die
Upstream-Lizenzbedingungen von BlackHole oder beschaffen Sie eine separate Lizenz von Existential Audio.

## Transporte

### Chrome

Der Chrome-Transport öffnet die Meet-URL über die OpenClaw Browser-Steuerung und tritt
als das angemeldete OpenClaw Browserprofil bei. Unter macOS prüft das Plugin vor dem Start auf
`BlackHole 2ch`. Falls konfiguriert, führt es außerdem vor dem Öffnen von Chrome einen Audio-Bridge-
Health-Befehl und einen Startbefehl aus. Verwenden Sie `chrome`, wenn
Chrome/Audio auf dem Gateway-Host laufen; verwenden Sie `chrome-node`, wenn Chrome/Audio auf
einer gekoppelten Node wie einer Parallels-macOS-VM laufen. Wählen Sie für lokales Chrome das
Profil mit `browser.defaultProfile`; `chrome.browserProfile` wird an
`chrome-node`-Hosts übergeben.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Leiten Sie Chrome-Mikrofon- und Lautsprecheraudio über die lokale OpenClaw-Audio-
Bridge. Wenn `BlackHole 2ch` nicht installiert ist, schlägt der Beitritt mit einem Einrichtungsfehler fehl,
statt ohne Audiopfad stillschweigend beizutreten.

### Twilio

Der Twilio-Transport ist ein strikt an das Voice Call-Plugin delegierter Wählplan. Er
parst Meet-Seiten nicht nach Telefonnummern.

Verwenden Sie dies, wenn die Teilnahme über Chrome nicht verfügbar ist oder Sie einen Telefon-Einwahl-
Fallback wünschen. Google Meet muss eine Telefonnummer für die Einwahl und eine PIN für das
Meeting bereitstellen; OpenClaw ermittelt diese nicht aus der Meet-Seite.

Aktivieren Sie das Voice Call-Plugin auf dem Gateway-Host, nicht auf der Chrome-Node:

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
Geheimnisse aus `openclaw.json` heraus:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Starten oder laden Sie das Gateway nach dem Aktivieren von `voice-call` neu; Änderungen an der Plugin-Konfiguration
erscheinen in einem bereits laufenden Gateway-Prozess erst nach einem Reload.

Prüfen Sie dann:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Wenn die Twilio-Delegation verdrahtet ist, enthält `googlemeet setup` erfolgreiche
`twilio-voice-call-plugin`- und `twilio-voice-call-credentials`-Prüfungen.

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

OAuth ist für das Erstellen eines Meet-Links optional, weil `googlemeet create` auf
Browser-Automatisierung zurückfallen kann. Konfigurieren Sie OAuth, wenn Sie offizielle API-Erstellung,
Space-Auflösung oder Meet Media API-Preflight-Prüfungen wünschen.

Der Zugriff auf die Google Meet API verwendet Benutzer-OAuth: Erstellen Sie einen Google Cloud-OAuth-Client,
fordern Sie die erforderlichen Scopes an, autorisieren Sie ein Google-Konto, und speichern Sie dann das
resultierende Refresh-Token in der Google Meet-Plugin-Konfiguration oder stellen Sie die
`OPENCLAW_GOOGLE_MEET_*`-Umgebungsvariablen bereit.

OAuth ersetzt nicht den Chrome-Beitrittspfad. Chrome- und Chrome-node-Transporte
treten weiterhin über ein angemeldetes Chrome-Profil, BlackHole/SoX und eine verbundene
Node bei, wenn Sie Browser-Teilnahme verwenden. OAuth ist nur für den offiziellen Google
Meet API-Pfad vorgesehen: Meeting-Spaces erstellen, Spaces auflösen und Meet Media API-
Preflight-Prüfungen ausführen.

### Google-Anmeldedaten erstellen

In der Google Cloud Console:

1. Erstellen oder wählen Sie ein Google Cloud-Projekt aus.
2. Aktivieren Sie **Google Meet REST API** für dieses Projekt.
3. Konfigurieren Sie den OAuth-Zustimmungsbildschirm.
   - **Intern** ist für eine Google Workspace-Organisation am einfachsten.
   - **Extern** funktioniert für persönliche/Test-Setups; während sich die App im Testmodus befindet,
     fügen Sie jedes Google-Konto, das die App autorisieren wird, als Testbenutzer hinzu.
4. Fügen Sie die von OpenClaw angeforderten Scopes hinzu:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Erstellen Sie eine OAuth-Client-ID.
   - Anwendungstyp: **Webanwendung**.
   - Autorisierte Weiterleitungs-URI:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Kopieren Sie Client-ID und Client-Secret.

`meetings.space.created` wird von Google Meet `spaces.create` benötigt.
`meetings.space.readonly` ermöglicht OpenClaw, Meet-URLs/Codes in Spaces aufzulösen.
`meetings.conference.media.readonly` ist für Meet Media API-Preflight und Medien-
Arbeiten vorgesehen; Google kann für die tatsächliche Media API-Nutzung eine Developer Preview-Registrierung verlangen.
Wenn Sie nur browserbasierte Chrome-Beitritte benötigen, überspringen Sie OAuth vollständig.

### Refresh-Token erzeugen

Konfigurieren Sie `oauth.clientId` und optional `oauth.clientSecret`, oder übergeben Sie sie als
Umgebungsvariablen, und führen Sie dann aus:

```bash
openclaw googlemeet auth login --json
```

Der Befehl gibt einen `oauth`-Konfigurationsblock mit einem Refresh-Token aus. Er verwendet PKCE,
einen localhost-Callback auf `http://localhost:8085/oauth2callback` und einen manuellen
Kopieren/Einfügen-Ablauf mit `--manual`.

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

Bevorzugen Sie Umgebungsvariablen, wenn Sie das Refresh-Token nicht in der Konfiguration haben möchten.
Wenn sowohl Konfigurations- als auch Umgebungswerte vorhanden sind, löst das Plugin zuerst die Konfiguration
und danach den Umgebungs-Fallback auf.

Die OAuth-Zustimmung umfasst die Erstellung von Meet-Spaces, Lesezugriff auf Meet-Spaces und Lesezugriff auf Meet-
Konferenzmedien. Wenn Sie sich authentifiziert haben, bevor Unterstützung für die Meeting-Erstellung
existierte, führen Sie `openclaw googlemeet auth login --json` erneut aus, damit das Refresh-
Token den Scope `meetings.space.created` hat.

### OAuth mit doctor prüfen

Führen Sie den OAuth-doctor aus, wenn Sie eine schnelle, nicht geheime Health-Prüfung wünschen:

```bash
openclaw googlemeet doctor --oauth --json
```

Dies lädt nicht die Chrome-Runtime und erfordert keine verbundene Chrome-Node. Es
prüft, dass eine OAuth-Konfiguration vorhanden ist und dass das Refresh-Token ein Access-
Token erzeugen kann. Der JSON-Bericht enthält nur Statusfelder wie `ok`, `configured`,
`tokenSource`, `expiresAt` und Prüfnachrichten; er gibt weder Access-
Token, Refresh-Token noch Client-Secret aus.

Häufige Ergebnisse:

| Prüfung              | Bedeutung                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` plus `oauth.refreshToken` oder ein zwischengespeichertes Access-Token ist vorhanden. |
| `oauth-token`        | Das zwischengespeicherte Access-Token ist noch gültig, oder das Refresh-Token hat ein neues Access-Token erzeugt. |
| `meet-spaces-get`    | Optionale `--meeting`-Prüfung hat einen bestehenden Meet-Space aufgelöst.                 |
| `meet-spaces-create` | Optionale `--create-space`-Prüfung hat einen neuen Meet-Space erstellt.                  |

Um die Aktivierung der Google Meet API und den `spaces.create`-Scope ebenfalls nachzuweisen, führen Sie die
nebenwirkungsbehaftete Erstellungsprüfung aus:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` erstellt eine Wegwerf-Meet-URL. Verwenden Sie dies, wenn Sie bestätigen müssen,
dass im Google Cloud-Projekt die Meet API aktiviert ist und dass das autorisierte
Konto den Scope `meetings.space.created` hat.

Um Lesezugriff für einen bestehenden Meeting-Space nachzuweisen:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` und `resolve-space` weisen Lesezugriff auf einen bestehenden
Space nach, auf den das autorisierte Google-Konto zugreifen kann. Ein `403` aus diesen Prüfungen
bedeutet normalerweise, dass die Google Meet REST API deaktiviert ist, dem zugestimmten Refresh-Token
der erforderliche Scope fehlt oder das Google-Konto nicht auf diesen Meet-
Space zugreifen kann. Ein Refresh-Token-Fehler bedeutet, dass Sie `openclaw googlemeet auth login
--json` erneut ausführen und den neuen `oauth`-Block speichern sollten.

Für den Browser-Fallback sind keine OAuth-Anmeldedaten erforderlich. In diesem Modus stammt Google-
Auth aus dem angemeldeten Chrome-Profil auf der ausgewählten Node, nicht aus der
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

Führen Sie vor Medienarbeiten einen Preflight aus:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Listen Sie Meeting-Artefakte und Anwesenheit auf, nachdem Meet Konferenzdatensätze erstellt hat:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Mit `--meeting` verwenden `artifacts` und `attendance` standardmäßig den neuesten Konferenzdatensatz. Übergeben Sie `--all-conference-records`, wenn Sie alle aufbewahrten Datensätze für dieses Meeting möchten.

Die Kalendersuche kann die Meeting-URL aus Google Calendar auflösen, bevor Meet-Artefakte gelesen werden:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` durchsucht den heutigen `primary`-Kalender nach einem Calendar-Ereignis mit einem Google Meet-Link. Verwenden Sie `--event <query>`, um passenden Ereignistext zu durchsuchen, und `--calendar <id>` für einen nicht primären Kalender. Die Kalendersuche erfordert eine frische OAuth-Anmeldung, die den schreibgeschützten Calendar-Events-Scope einschließt. `calendar-events` zeigt passende Meet-Ereignisse in der Vorschau an und markiert das Ereignis, das `latest`, `artifacts`, `attendance` oder `export` auswählen wird.

Wenn Sie die Konferenzdatensatz-ID bereits kennen, adressieren Sie sie direkt:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

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

`artifacts` gibt Metadaten des Konferenzdatensatzes sowie Metadaten zu Teilnehmern, Aufzeichnungen, Transkripten, strukturierten Transkripteinträgen und Smart-Note-Ressourcen zurück, wenn Google sie für das Meeting bereitstellt. Verwenden Sie `--no-transcript-entries`, um die Eintragssuche bei großen Meetings zu überspringen. `attendance` erweitert Teilnehmer zu Teilnehmer-Sitzungszeilen mit Zeiten für erstes/letztes Gesehenwerden, Gesamtsitzungsdauer, Kennzeichen für Verspätung/frühes Verlassen sowie nach angemeldetem Benutzer oder Anzeigename zusammengeführten doppelten Teilnehmerressourcen. Übergeben Sie `--no-merge-duplicates`, um rohe Teilnehmerressourcen getrennt zu halten, `--late-after-minutes`, um die Verspätungserkennung anzupassen, und `--early-before-minutes`, um die Erkennung für frühes Verlassen anzupassen.

`export` schreibt einen Ordner mit `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` und `manifest.json`. `manifest.json` protokolliert die gewählte Eingabe, Exportoptionen, Konferenzdatensätze, Ausgabedateien, Zählwerte, Token-Quelle, das Calendar-Ereignis, wenn eines verwendet wurde, sowie alle Warnungen zu teilweisem Abruf. Übergeben Sie `--zip`, um zusätzlich ein portables Archiv neben den Ordner zu schreiben. Übergeben Sie `--include-doc-bodies`, um verknüpfte Transkript- und Smart-Note-Google-Docs-Texte über Google Drive `files.export` zu exportieren; dies erfordert eine frische OAuth-Anmeldung, die den schreibgeschützten Drive-Meet-Scope einschließt. Ohne `--include-doc-bodies` enthalten Exporte nur Meet-Metadaten und strukturierte Transkripteinträge. Wenn Google einen teilweisen Artefaktfehler zurückgibt, etwa einen Fehler bei Smart-Note-Auflistung, Transkripteintrag oder Drive-Dokumenttext, behalten Zusammenfassung und Manifest die Warnung bei, statt den gesamten Export fehlschlagen zu lassen. Verwenden Sie `--dry-run`, um dieselben Artefakt-/Anwesenheitsdaten abzurufen und das Manifest-JSON auszugeben, ohne den Ordner oder die ZIP-Datei zu erstellen. Das ist nützlich, bevor ein großer Export geschrieben wird oder wenn ein Agent nur Zählwerte, ausgewählte Datensätze und Warnungen benötigt.

Agenten können dasselbe Paket auch über das `google_meet`-Tool erstellen:

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

Führen Sie den abgesicherten Live-Smoke gegen ein echtes aufbewahrtes Meeting aus:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Live-Smoke-Umgebung:

- `OPENCLAW_LIVE_TEST=1` aktiviert abgesicherte Live-Tests.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` zeigt auf eine aufbewahrte Meet-URL, einen Code oder
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` oder `GOOGLE_MEET_CLIENT_ID` stellt die OAuth-Client-ID bereit.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` oder `GOOGLE_MEET_REFRESH_TOKEN` stellt das Aktualisierungstoken bereit.
- Optional: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` und
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` verwenden dieselben Fallback-Namen
  ohne das Präfix `OPENCLAW_`.

Der Basis-Live-Smoke für Artefakte/Anwesenheit benötigt `https://www.googleapis.com/auth/meetings.space.readonly` und `https://www.googleapis.com/auth/meetings.conference.media.readonly`. Die Kalendersuche benötigt `https://www.googleapis.com/auth/calendar.events.readonly`. Der Export von Drive-Dokumenttexten benötigt `https://www.googleapis.com/auth/drive.meet.readonly`.

Erstellen Sie einen frischen Meet-Space:

```bash
openclaw googlemeet create
```

Der Befehl gibt die neue `meeting uri`, die Quelle und die Beitrittssitzung aus. Mit OAuth-Anmeldedaten verwendet er die offizielle Google Meet API. Ohne OAuth-Anmeldedaten verwendet er als Fallback das angemeldete Browserprofil der gepinnten Chrome-Node. Agenten können das `google_meet`-Tool mit `action: "create"` verwenden, um in einem Schritt zu erstellen und beizutreten. Für eine reine URL-Erstellung übergeben Sie `"join": false`.

Beispiel-JSON-Ausgabe des Browser-Fallbacks:

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

Wenn der Browser-Fallback auf eine Google-Anmeldung oder eine Meet-Berechtigungssperre trifft, bevor er die URL erstellen kann, gibt die Gateway-Methode eine fehlgeschlagene Antwort zurück und das `google_meet`-Tool gibt strukturierte Details statt einer einfachen Zeichenkette zurück:

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

Wenn ein Agent `manualActionRequired: true` sieht, sollte er die `manualActionMessage` plus den Browser-Node-/Tab-Kontext melden und keine neuen Meet-Tabs mehr öffnen, bis der Operator den Browser-Schritt abgeschlossen hat.

Beispiel-JSON-Ausgabe der API-Erstellung:

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

Beim Erstellen eines Meet wird standardmäßig beigetreten. Der Chrome- oder Chrome-Node-Transport benötigt weiterhin ein angemeldetes Google Chrome-Profil, um über den Browser beizutreten. Wenn das Profil abgemeldet ist, meldet OpenClaw `manualActionRequired: true` oder einen Browser-Fallback-Fehler und fordert den Operator auf, die Google-Anmeldung abzuschließen, bevor erneut versucht wird.

Setzen Sie `preview.enrollmentAcknowledged: true` erst, nachdem Sie bestätigt haben, dass Ihr Cloud-Projekt, der OAuth-Principal und die Meeting-Teilnehmer im Google Workspace Developer Preview Program für Meet-Medien-APIs registriert sind.

## Konfiguration

Der gemeinsame Chrome-Echtzeitpfad benötigt nur ein aktiviertes Plugin, BlackHole, SoX und einen Schlüssel für einen Backend-Echtzeit-Voice-Provider. OpenAI ist der Standard; setzen Sie `realtime.provider: "google"`, um Google Gemini Live zu verwenden:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Setzen Sie die Plugin-Konfiguration unter `plugins.entries.google-meet.config`:

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
- `chromeNode.node`: optionale Node-ID/Name/IP für `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: Name, der auf dem abgemeldeten Meet-Gastbildschirm verwendet wird
- `chrome.autoJoin: true`: bestmögliches Ausfüllen des Gastnamens und Klicken auf „Jetzt teilnehmen“
  über die OpenClaw-Browserautomatisierung auf `chrome-node`
- `chrome.reuseExistingTab: true`: einen vorhandenen Meet-Tab aktivieren, statt Duplikate zu öffnen
- `chrome.waitForInCallMs: 20000`: warten, bis der Meet-Tab meldet, dass er im Anruf ist,
  bevor die Echtzeit-Einführung ausgelöst wird
- `chrome.audioFormat: "pcm16-24khz"`: Audioformat für Befehlspaare. Verwenden Sie
  `"g711-ulaw-8khz"` nur für alte/benutzerdefinierte Befehlspaare, die weiterhin
  Telefonie-Audio ausgeben.
- `chrome.audioInputCommand`: SoX-Befehl, der von CoreAudio `BlackHole 2ch` liest
  und Audio in `chrome.audioFormat` schreibt
- `chrome.audioOutputCommand`: SoX-Befehl, der Audio in `chrome.audioFormat` liest
  und nach CoreAudio `BlackHole 2ch` schreibt
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: kurze gesprochene Antworten, mit
  `openclaw_agent_consult` für ausführlichere Antworten
- `realtime.introMessage`: kurze gesprochene Bereitschaftsprüfung, wenn die Echtzeit-Bridge
  verbunden wird; setzen Sie sie auf `""`, um still beizutreten
- `realtime.agentId`: optionale OpenClaw-Agent-ID für
  `openclaw_agent_consult`; standardmäßig `main`

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

`voiceCall.enabled` ist standardmäßig `true`; mit Twilio-Transport delegiert es den eigentlichen PSTN-Anruf und DTMF an das Voice Call-Plugin. Wenn `voice-call` nicht aktiviert ist, kann Google Meet den Wählplan weiterhin validieren und aufzeichnen, aber den Twilio-Anruf nicht platzieren.

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

Verwenden Sie `transport: "chrome"`, wenn Chrome auf dem Gateway-Host ausgeführt wird. Verwenden Sie
`transport: "chrome-node"`, wenn Chrome auf einem gekoppelten Node wie einer Parallels-
VM ausgeführt wird. In beiden Fällen laufen das Realtime-Modell und `openclaw_agent_consult` auf dem
Gateway-Host, sodass die Modell-Zugangsdaten dort bleiben.

Verwenden Sie `action: "status"`, um aktive Sitzungen aufzulisten oder eine Sitzungs-ID zu prüfen. Verwenden Sie
`action: "speak"` mit `sessionId` und `message`, damit der Realtime-Agent
sofort spricht. Verwenden Sie `action: "test_speech"`, um die Sitzung zu erstellen oder wiederzuverwenden,
eine bekannte Phrase auszulösen und den `inCall`-Zustand zurückzugeben, wenn der Chrome-Host ihn
melden kann. `test_speech` erzwingt immer `mode: "realtime"` und schlägt fehl, wenn es
in `mode: "transcribe"` ausgeführt werden soll, weil reine Beobachtungssitzungen absichtlich keine
Sprache ausgeben können. Das Ergebnis `speechOutputVerified` basiert darauf, dass die Realtime-Audioausgabe-
Bytes während dieses Testaufrufs zunehmen, sodass eine wiederverwendete Sitzung mit älterem Audio
nicht als frische erfolgreiche Sprachprüfung zählt. Verwenden Sie `action: "leave"`, um eine
Sitzung als beendet zu markieren.

`status` enthält Chrome-Integritätsdaten, wenn verfügbar:

- `inCall`: Chrome scheint sich im Meet-Anruf zu befinden
- `micMuted`: bestmöglicher Meet-Mikrofonstatus
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: das
  Browserprofil benötigt manuelle Anmeldung, Zulassung durch den Meet-Host, Berechtigungen oder
  Reparatur der Browsersteuerung, bevor Sprache funktionieren kann
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: ob
  verwaltete Chrome-Sprachausgabe jetzt zulässig ist. `speechReady: false` bedeutet, dass OpenClaw
  die Intro-/Testphrase nicht in die Audio-Bridge gesendet hat.
- `providerConnected` / `realtimeReady`: Status der Realtime-Sprach-Bridge
- `lastInputAt` / `lastOutputAt`: zuletzt vom Bridge-Eingang empfangenes oder an die Bridge gesendetes Audio

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Realtime-Agent-Beratung

Der Chrome-Realtime-Modus ist für eine Live-Sprachschleife optimiert. Der Realtime-Sprach-
Provider hört das Meeting-Audio und spricht über die konfigurierte Audio-Bridge.
Wenn das Realtime-Modell tiefere Schlussfolgerungen, aktuelle Informationen oder normale
OpenClaw-Tools benötigt, kann es `openclaw_agent_consult` aufrufen.

Das Beratungs-Tool führt im Hintergrund den regulären OpenClaw-Agenten mit aktuellem
Meeting-Transkriptkontext aus und gibt eine knappe gesprochene Antwort an die Realtime-
Sprachsitzung zurück. Das Sprachmodell kann diese Antwort dann zurück in das Meeting sprechen.
Es verwendet dasselbe gemeinsam genutzte Realtime-Beratungs-Tool wie Voice Call.

Standardmäßig laufen Beratungen gegen den `main`-Agenten. Setzen Sie `realtime.agentId`, wenn eine
Meet-Lane einen dedizierten OpenClaw-Agent-Arbeitsbereich, Modellstandards,
Tool-Richtlinie, Speicher und Sitzungsverlauf verwenden soll.

`realtime.toolPolicy` steuert den Beratungslauf:

- `safe-read-only`: stellt das Beratungs-Tool bereit und beschränkt den regulären Agenten auf
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` und
  `memory_get`.
- `owner`: stellt das Beratungs-Tool bereit und erlaubt dem regulären Agenten, die normale
  Agent-Tool-Richtlinie zu verwenden.
- `none`: stellt dem Realtime-Sprachmodell das Beratungs-Tool nicht bereit.

Der Beratungssitzungsschlüssel ist pro Meet-Sitzung begrenzt, sodass nachfolgende Beratungsaufrufe
während desselben Meetings den vorherigen Beratungskontext wiederverwenden können.

So erzwingen Sie eine gesprochene Bereitschaftsprüfung, nachdem Chrome dem Anruf vollständig beigetreten ist:

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

Verwenden Sie diese Sequenz, bevor Sie ein Meeting an einen unbeaufsichtigten Agenten übergeben:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Erwarteter Chrome-node-Status:

- `googlemeet setup` ist vollständig grün.
- `googlemeet setup` enthält `chrome-node-connected`, wenn Chrome-node der
  Standardtransport ist oder ein Node angeheftet ist.
- `nodes status` zeigt, dass der ausgewählte Node verbunden ist.
- Der ausgewählte Node kündigt sowohl `googlemeet.chrome` als auch `browser.proxy` an.
- Der Meet-Tab tritt dem Anruf bei und `test-speech` gibt Chrome-Integritätsdaten mit
  `inCall: true` zurück.

Für einen entfernten Chrome-Host wie eine Parallels-macOS-VM ist dies die kürzeste
sichere Prüfung nach der Aktualisierung des Gateway oder der VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Das beweist, dass das Gateway-Plugin geladen ist, der VM-Node mit dem
aktuellen Token verbunden ist und die Meet-Audio-Bridge verfügbar ist, bevor ein Agent einen
echten Meeting-Tab öffnet.

Für einen Twilio-Smoke verwenden Sie ein Meeting, das Telefoneinwahldaten bereitstellt:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Erwarteter Twilio-Status:

- `googlemeet setup` enthält grüne Prüfungen für `twilio-voice-call-plugin` und
  `twilio-voice-call-credentials`.
- `voicecall` ist nach dem Gateway-Neuladen in der CLI verfügbar.
- Die zurückgegebene Sitzung hat `transport: "twilio"` und eine `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` legt den delegierten Sprachanruf auf.

## Fehlerbehebung

### Agent kann das Google-Meet-Tool nicht sehen

Bestätigen Sie, dass das Plugin in der Gateway-Konfiguration aktiviert ist, und laden Sie das Gateway neu:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Wenn Sie gerade `plugins.entries.google-meet` bearbeitet haben, starten oder laden Sie das Gateway neu.
Der laufende Agent sieht nur Plugin-Tools, die vom aktuellen Gateway-
Prozess registriert wurden.

### Kein verbundener Google-Meet-fähiger Node

Führen Sie auf dem Node-Host Folgendes aus:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Genehmigen Sie auf dem Gateway-Host den Node und prüfen Sie die Befehle:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Der Node muss verbunden sein und `googlemeet.chrome` plus `browser.proxy` auflisten.
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
`gateway token mismatch` meldet, installieren Sie den Node mit dem aktuellen Gateway-
Token neu oder starten Sie ihn neu. Für ein LAN-Gateway bedeutet das normalerweise:

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

Führen Sie `googlemeet test-speech` aus und prüfen Sie die zurückgegebenen Chrome-Integritätsdaten. Wenn sie
`manualActionRequired: true` melden, zeigen Sie dem Bediener `manualActionMessage`
und beenden Sie weitere Wiederholungen, bis die Browseraktion abgeschlossen ist.

Häufige manuelle Aktionen:

- Beim Chrome-Profil anmelden.
- Den Gast über das Meet-Hostkonto zulassen.
- Chrome-Mikrofon-/Kameraberechtigungen erteilen, wenn die native Chrome-Berechtigungs-
  Aufforderung erscheint.
- Einen blockierten Meet-Berechtigungsdialog schließen oder reparieren.

Melden Sie nicht „nicht angemeldet“, nur weil Meet „Do you want people to
hear you in the meeting?“ anzeigt. Das ist Meets Audio-Auswahl-Zwischenschritt; OpenClaw
klickt **Use microphone** per Browserautomatisierung, wenn verfügbar, und wartet weiter
auf den echten Meeting-Status. Beim rein erstellenden Browser-Fallback kann OpenClaw
**Continue without microphone** anklicken, weil das Erstellen der URL den
Realtime-Audiopfad nicht benötigt.

### Meeting-Erstellung schlägt fehl

`googlemeet create` verwendet zuerst den Google-Meet-API-Endpunkt `spaces.create`,
wenn OAuth-Zugangsdaten konfiguriert sind. Ohne OAuth-Zugangsdaten wird auf den
angehefteten Chrome-Node-Browser zurückgefallen. Bestätigen Sie:

- Für API-Erstellung: `oauth.clientId` und `oauth.refreshToken` sind konfiguriert,
  oder passende `OPENCLAW_GOOGLE_MEET_*`-Umgebungsvariablen sind vorhanden.
- Für API-Erstellung: Das Refresh-Token wurde erstellt, nachdem die Erstellungsunterstützung
  hinzugefügt wurde. Älteren Tokens fehlt möglicherweise der Scope `meetings.space.created`; führen Sie
  `openclaw googlemeet auth login --json` erneut aus und aktualisieren Sie die Plugin-Konfiguration.
- Für Browser-Fallback: `defaultTransport: "chrome-node"` und
  `chromeNode.node` zeigen auf einen verbundenen Node mit `browser.proxy` und
  `googlemeet.chrome`.
- Für Browser-Fallback: Das OpenClaw-Chrome-Profil auf diesem Node ist bei
  Google angemeldet und kann `https://meet.google.com/new` öffnen.
- Für Browser-Fallback: Wiederholungen verwenden einen vorhandenen `https://meet.google.com/new`-
  oder Google-Kontoaufforderungs-Tab wieder, bevor ein neuer Tab geöffnet wird. Wenn ein Agent eine Zeitüberschreitung erreicht,
  wiederholen Sie den Tool-Aufruf, statt manuell einen weiteren Meet-Tab zu öffnen.
- Für Browser-Fallback: Wenn das Tool `manualActionRequired: true` zurückgibt, verwenden Sie
  die zurückgegebenen Werte `browser.nodeId`, `browser.targetId`, `browserUrl` und
  `manualActionMessage`, um den Bediener anzuleiten. Wiederholen Sie nicht in einer Schleife, bis diese
  Aktion abgeschlossen ist.
- Für Browser-Fallback: Wenn Meet „Do you want people to hear you in the
  meeting?“ anzeigt, lassen Sie den Tab geöffnet. OpenClaw sollte **Use microphone** oder, beim
  rein erstellenden Fallback, **Continue without microphone** per Browser-
  Automatisierung anklicken und weiter auf die generierte Meet-URL warten. Wenn das nicht möglich ist, sollte der
  Fehler `meet-audio-choice-required` erwähnen, nicht `google-login-required`.

### Agent tritt bei, spricht aber nicht

Prüfen Sie den Realtime-Pfad:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Verwenden Sie `mode: "realtime"` für Zuhören/Rücksprechen. `mode: "transcribe"` startet absichtlich
nicht die duplexfähige Realtime-Sprach-Bridge. `googlemeet test-speech`
prüft immer den Realtime-Pfad und meldet, ob für diesen Aufruf Bridge-Ausgabe-Bytes
beobachtet wurden. Wenn `speechOutputVerified` false und
`speechOutputTimedOut` true ist, hat der Realtime-Provider die
Äußerung möglicherweise akzeptiert, aber OpenClaw hat keine neuen Ausgabe-Bytes gesehen, die die Chrome-Audio-
Bridge erreichen.

Prüfen Sie außerdem:

- Ein Realtime-Provider-Schlüssel ist auf dem Gateway-Host verfügbar, etwa
  `OPENAI_API_KEY` oder `GEMINI_API_KEY`.
- `BlackHole 2ch` ist auf dem Chrome-Host sichtbar.
- `sox` ist auf dem Chrome-Host vorhanden.
- Meet-Mikrofon und -Lautsprecher sind über den von
  OpenClaw verwendeten virtuellen Audiopfad geroutet.

`googlemeet doctor [session-id]` gibt Sitzung, Node, In-Call-Status,
Grund für manuelle Aktion, Realtime-Provider-Verbindung, `realtimeReady`, Audio-
Eingabe-/Ausgabeaktivität, letzte Audiozeitstempel, Byte-Zähler und Browser-URL aus.
Verwenden Sie `googlemeet status [session-id]`, wenn Sie das rohe JSON benötigen. Verwenden Sie
`googlemeet doctor --oauth`, wenn Sie Google-Meet-OAuth-Refresh
ohne Offenlegung von Tokens prüfen müssen; fügen Sie `--meeting` oder `--create-space` hinzu, wenn Sie außerdem einen
Google-Meet-API-Nachweis benötigen.

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
aktuellen Blocker, etwa Anmeldung, Zulassung, Berechtigungen oder Audio-Auswahlstatus.
Der CLI-Befehl spricht mit dem konfigurierten Gateway, daher muss das Gateway laufen;
`chrome-node` erfordert außerdem, dass der Chrome-Node verbunden ist.

### Twilio-Einrichtungsprüfungen schlagen fehl

`twilio-voice-call-plugin` schlägt fehl, wenn `voice-call` nicht zugelassen oder nicht aktiviert ist.
Fügen Sie es zu `plugins.allow` hinzu, aktivieren Sie `plugins.entries.voice-call`, und laden Sie das
Gateway neu.

`twilio-voice-call-credentials` schlägt fehl, wenn dem Twilio-Backend Konto-
SID, Auth-Token oder Anrufernummer fehlen. Legen Sie diese auf dem Gateway-Host fest:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Starten Sie das Gateway anschließend neu oder laden Sie es neu und führen Sie aus:

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` prüft standardmäßig nur die Bereitschaft. Für einen Testlauf mit einer bestimmten Nummer:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Fügen Sie `--yes` nur hinzu, wenn Sie bewusst einen echten ausgehenden Benachrichtigungsanruf
starten möchten:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio-Anruf startet, tritt dem Meeting aber nie bei

Bestätigen Sie, dass das Meet-Ereignis Telefoneinwahldetails bereitstellt. Übergeben Sie die exakte Einwahl-
nummer und PIN oder eine benutzerdefinierte DTMF-Sequenz:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Verwenden Sie führende `w` oder Kommas in `--dtmf-sequence`, wenn der Provider vor der
Eingabe der PIN eine Pause benötigt.

## Hinweise

Die offizielle Medien-API von Google Meet ist empfangsorientiert, daher braucht das Sprechen in einen Meet-
Anruf weiterhin einen Teilnehmerpfad. Dieses Plugin hält diese Grenze sichtbar:
Chrome übernimmt die Browser-Teilnahme und das lokale Audio-Routing; Twilio übernimmt die
Telefoneinwahl-Teilnahme.

Der Chrome-Echtzeitmodus benötigt `BlackHole 2ch` sowie entweder:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw verwaltet die
  Echtzeitmodell-Bridge und leitet Audio in `chrome.audioFormat` zwischen diesen
  Befehlen und dem ausgewählten Echtzeit-Sprach-Provider weiter. Der standardmäßige Chrome-Pfad ist
  24 kHz PCM16; 8 kHz G.711 mu-law bleibt für Legacy-Befehlspaare verfügbar.
- `chrome.audioBridgeCommand`: Ein externer Bridge-Befehl verwaltet den gesamten lokalen
  Audiopfad und muss nach dem Starten oder Validieren seines Daemons beendet werden.

Für sauberes Duplex-Audio leiten Sie Meet-Ausgabe und Meet-Mikrofon über separate
virtuelle Geräte oder einen virtuellen Gerätegraphen im Loopback-Stil. Ein einzelnes gemeinsam genutztes
BlackHole-Gerät kann andere Teilnehmer zurück in den Anruf spiegeln.

`googlemeet speak` löst die aktive Echtzeit-Audio-Bridge für eine Chrome-
Sitzung aus. `googlemeet leave` stoppt diese Bridge. Bei Twilio-Sitzungen, die
über das Voice Call Plugin delegiert werden, legt `leave` auch den zugrunde liegenden Sprachanruf auf.

## Verwandte Themen

- [Sprachanruf-Plugin](/de/plugins/voice-call)
- [Sprechmodus](/de/nodes/talk)
- [Plugins erstellen](/de/plugins/building-plugins)
