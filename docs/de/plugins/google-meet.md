---
read_when:
    - Sie möchten, dass ein OpenClaw-Agent einem Google Meet-Anruf beitritt
    - Sie möchten, dass ein OpenClaw-Agent einen neuen Google Meet-Anruf erstellt
    - Sie konfigurieren Chrome, Chrome-Node oder Twilio als Google Meet-Transport
summary: 'Google Meet-Plugin: expliziten Meet-URLs über Chrome oder Twilio mit Standardeinstellungen für Echtzeit-Sprachübertragung beitreten'
title: Google Meet-Plugin
x-i18n:
    generated_at: "2026-05-01T06:44:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67661177ca8a72e2e9a67bfee30a90fd02089a81b2ef90ba10f964dee962552b
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet-Teilnehmerunterstützung für OpenClaw — das Plugin ist bewusst explizit gestaltet:

- Es tritt nur einer expliziten `https://meet.google.com/...`-URL bei.
- Es kann über die Google Meet API einen neuen Meet-Raum erstellen und dann der
  zurückgegebenen URL beitreten.
- `realtime`-Sprache ist der Standardmodus.
- Realtime-Sprache kann an den vollständigen OpenClaw-Agent zurückrufen, wenn
  tieferes Schlussfolgern oder Tools benötigt werden.
- Agents wählen das Beitrittsverhalten mit `mode`: Verwenden Sie `realtime` für
  Live-Mithören und Rücksprechen oder `transcribe`, um dem Browser beizutreten
  und ihn zu steuern, ohne die Realtime-Sprachbrücke zu verwenden.
- Authentifizierung beginnt als persönliches Google OAuth oder als bereits
  angemeldetes Chrome-Profil.
- Es gibt keine automatische Zustimmungshinweis-Ansage.
- Das standardmäßige Chrome-Audio-Backend ist `BlackHole 2ch`.
- Chrome kann lokal oder auf einem gekoppelten Node-Host ausgeführt werden.
- Twilio akzeptiert eine Einwahlnummer plus optionale PIN oder DTMF-Sequenz.
- Der CLI-Befehl ist `googlemeet`; `meet` ist für breitere
  Agent-Telekonferenz-Workflows reserviert.

## Schnellstart

Installieren Sie die lokalen Audioabhängigkeiten und konfigurieren Sie einen
Backend-Provider für Realtime-Sprache. OpenAI ist die Standardeinstellung;
Google Gemini Live funktioniert ebenfalls mit
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` installiert das virtuelle Audiogerät `BlackHole 2ch`. Das
Homebrew-Installationsprogramm erfordert einen Neustart, bevor macOS das Gerät
bereitstellt:

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

Die Einrichtungsausgabe ist dafür vorgesehen, von Agents gelesen zu werden, und
ist modusabhängig. Sie meldet Chrome-Profil, Node-Pinning und bei Realtime-
Chrome-Beitritten die BlackHole/SoX-Audiobrücke sowie verzögerte Prüfungen der
Realtime-Einführung. Für reine Beobachtungsbeitritte prüfen Sie denselben
Transport mit `--mode transcribe`; dieser Modus überspringt die
Realtime-Audio-Voraussetzungen, weil er nicht über die Brücke zuhört oder
spricht:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Wenn Twilio-Delegation konfiguriert ist, meldet die Einrichtung außerdem, ob das
`voice-call`-Plugin, die Twilio-Anmeldedaten und die öffentliche
Webhook-Erreichbarkeit bereit sind. Behandeln Sie jede Prüfung mit `ok: false`
als Blocker für den geprüften Transport und Modus, bevor Sie einen Agent um den
Beitritt bitten. Verwenden Sie `openclaw googlemeet setup --json` für Skripte
oder maschinenlesbare Ausgabe. Verwenden Sie `--transport chrome`,
`--transport chrome-node` oder `--transport twilio`, um einen bestimmten
Transport vorab zu prüfen, bevor ein Agent ihn versucht.

Für Twilio sollten Sie den Transport immer explizit vorab prüfen, wenn der
Standardtransport Chrome ist:

```bash
openclaw googlemeet setup --transport twilio
```

Dadurch werden fehlende `voice-call`-Verdrahtung, Twilio-Anmeldedaten oder nicht
erreichbare Webhook-Bereitstellung erkannt, bevor der Agent versucht, die
Besprechung anzurufen.

Einer Besprechung beitreten:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Oder lassen Sie einen Agent über das `google_meet`-Tool beitreten:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Eine neue Besprechung erstellen und ihr beitreten:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Nur die URL erstellen, ohne beizutreten:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` hat zwei Pfade:

- API-Erstellung: wird verwendet, wenn Google Meet OAuth-Anmeldedaten
  konfiguriert sind. Dies ist der deterministischste Pfad und hängt nicht vom
  Browser-UI-Zustand ab.
- Browser-Fallback: wird verwendet, wenn OAuth-Anmeldedaten fehlen. OpenClaw
  verwendet den angehefteten Chrome-Node, öffnet `https://meet.google.com/new`,
  wartet darauf, dass Google zu einer echten Besprechungscode-URL weiterleitet,
  und gibt dann diese URL zurück. Dieser Pfad erfordert, dass das OpenClaw-
  Chrome-Profil auf dem Node bereits bei Google angemeldet ist.
  Die Browser-Automatisierung behandelt Meets eigene Mikrofonaufforderung beim
  ersten Start; diese Aufforderung wird nicht als Google-Anmeldefehler
  behandelt.
  Beitritts- und Erstellungsabläufe versuchen außerdem, einen vorhandenen
  Meet-Tab wiederzuverwenden, bevor ein neuer geöffnet wird. Der Abgleich
  ignoriert harmlose URL-Abfragezeichenfolgen wie `authuser`, sodass ein
  erneuter Agent-Versuch die bereits geöffnete Besprechung fokussieren sollte,
  statt einen zweiten Chrome-Tab zu erstellen.

Die Befehls-/Tool-Ausgabe enthält ein `source`-Feld (`api` oder `browser`),
damit Agents erklären können, welcher Pfad verwendet wurde. `create` tritt der
neuen Besprechung standardmäßig bei und gibt `joined: true` plus die
Beitrittssitzung zurück. Um nur die URL zu erzeugen, verwenden Sie
`create --no-join` in der CLI oder übergeben Sie `"join": false` an das Tool.

Oder sagen Sie einem Agent: „Erstellen Sie ein Google Meet, treten Sie mit
Realtime-Sprache bei und senden Sie mir den Link.“ Der Agent sollte `google_meet`
mit `action: "create"` aufrufen und anschließend die zurückgegebene `meetingUri`
teilen.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Für einen reinen Beobachtungs-/Browsersteuerungsbeitritt setzen Sie
`"mode": "transcribe"`. Dadurch wird die Duplex-Realtime-Modellbrücke nicht
gestartet, BlackHole oder SoX sind nicht erforderlich, und es wird nicht in die
Besprechung zurückgesprochen. Chrome-Beitritte in diesem Modus vermeiden
außerdem OpenClaws Mikrofon-/Kameraberechtigungserteilung und den Meet-Pfad
**Mikrofon verwenden**. Wenn Meet einen Zwischendialog zur Audioauswahl anzeigt,
versucht die Automatisierung den Pfad ohne Mikrofon und meldet andernfalls eine
manuelle Aktion, statt das lokale Mikrofon zu öffnen.

Während Realtime-Sitzungen enthält der `google_meet`-Status den Zustand des
Browsers und der Audiobrücke, etwa `inCall`, `manualActionRequired`,
`providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`,
Zeitstempel der letzten Eingabe/Ausgabe, Byte-Zähler und den geschlossenen
Zustand der Brücke. Wenn eine sichere Meet-Seitenaufforderung angezeigt wird,
behandelt die Browser-Automatisierung sie, soweit möglich. Anmeldung,
Host-Zulassung und Browser-/OS-Berechtigungsaufforderungen werden als manuelle
Aktion mit Grund und Nachricht gemeldet, damit der Agent sie weitergeben kann.
Verwaltete Chrome-Sitzungen geben die Einführung oder Testphrase erst aus,
nachdem der Browserzustand `inCall: true` meldet; andernfalls meldet der Status
`speechReady: false`, und der Sprechversuch wird blockiert, statt vorzugeben,
der Agent habe in die Besprechung gesprochen.

Lokale Chrome-Beitritte verwenden das angemeldete OpenClaw-Browserprofil.
Realtime-Modus erfordert `BlackHole 2ch` für den von OpenClaw genutzten
Mikrofon-/Lautsprecherpfad. Für sauberes Duplex-Audio verwenden Sie getrennte
virtuelle Geräte oder einen Loopback-artigen Graphen; ein einzelnes BlackHole-
Gerät reicht für einen ersten Smoke-Test, kann aber Echo erzeugen.

### Lokaler Gateway + Parallels Chrome

Sie benötigen keinen vollständigen OpenClaw Gateway oder Modell-API-Schlüssel in
einer macOS-VM, nur damit die VM Chrome besitzt. Führen Sie den Gateway und den
Agent lokal aus und führen Sie dann einen Node-Host in der VM aus. Aktivieren Sie
das gebündelte Plugin einmal in der VM, damit der Node den Chrome-Befehl
ankündigt:

Was wo läuft:

- Gateway-Host: OpenClaw Gateway, Agent-Arbeitsbereich, Modell-/API-Schlüssel,
  Realtime-Provider und die Konfiguration des Google Meet-Plugins.
- Parallels-macOS-VM: OpenClaw CLI/Node-Host, Google Chrome, SoX, BlackHole 2ch
  und ein bei Google angemeldetes Chrome-Profil.
- In der VM nicht benötigt: Gateway-Dienst, Agent-Konfiguration, OpenAI/GPT-
  Schlüssel oder Einrichtung eines Modell-Providers.

Installieren Sie die VM-Abhängigkeiten:

```bash
brew install blackhole-2ch sox
```

Starten Sie die VM nach der Installation von BlackHole neu, damit macOS
`BlackHole 2ch` bereitstellt:

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

Wenn `<gateway-host>` eine LAN-IP ist und Sie kein TLS verwenden, lehnt der Node
das Klartext-WebSocket ab, sofern Sie diese vertrauenswürdige private Verbindung
nicht ausdrücklich aktivieren:

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

Bestätigen Sie, dass der Gateway den Node sieht und dass er sowohl
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

oder bitten Sie den Agent, das `google_meet`-Tool mit
`transport: "chrome-node"` zu verwenden.

Für einen Ein-Befehl-Smoke-Test, der eine Sitzung erstellt oder wiederverwendet,
eine bekannte Phrase spricht und den Sitzungszustand ausgibt:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Während des Realtime-Beitritts füllt die OpenClaw-Browser-Automatisierung den
Gastnamen aus, klickt auf Beitreten/Beitritt anfragen und akzeptiert Meets
„Mikrofon verwenden“-Auswahl beim ersten Start, wenn diese Aufforderung
erscheint. Während eines reinen Beobachtungsbeitritts oder einer browserbasierten
Besprechungserstellung fährt sie bei derselben Aufforderung ohne Mikrofon fort,
wenn diese Auswahl verfügbar ist. Wenn das Browserprofil nicht angemeldet ist,
Meet auf Host-Zulassung wartet, Chrome für einen Realtime-Beitritt eine Mikrofon-/
Kameraberechtigung benötigt oder Meet bei einer Aufforderung festhängt, die die
Automatisierung nicht lösen konnte, meldet das Join-/Test-Speech-Ergebnis
`manualActionRequired: true` mit `manualActionReason` und
`manualActionMessage`. Agents sollten den erneuten Beitrittsversuch stoppen,
genau diese Nachricht plus die aktuelle `browserUrl`/`browserTitle` melden und
erst erneut versuchen, wenn die manuelle Browseraktion abgeschlossen ist.

Wenn `chromeNode.node` weggelassen wird, wählt OpenClaw nur dann automatisch aus,
wenn genau ein verbundener Node sowohl `googlemeet.chrome` als auch
Browsersteuerung ankündigt. Wenn mehrere geeignete Nodes verbunden sind, setzen
Sie `chromeNode.node` auf die Node-ID, den Anzeigenamen oder die Remote-IP.

Häufige Fehlerprüfungen:

- `Configured Google Meet node ... is not usable: offline`: die angeheftete Node ist
  dem Gateway bekannt, aber nicht verfügbar. Agenten sollten diese Node als
  Diagnosezustand behandeln, nicht als nutzbaren Chrome-Host, und den
  Einrichtungsblocker melden, statt auf einen anderen Transport zurückzufallen,
  es sei denn, der Benutzer hat dies angefordert.
- `No connected Google Meet-capable node`: starten Sie `openclaw node run` in der VM,
  genehmigen Sie das Pairing, und stellen Sie sicher, dass `openclaw plugins enable google-meet` und
  `openclaw plugins enable browser` in der VM ausgeführt wurden. Bestätigen Sie außerdem, dass der
  Gateway-Host beide Node-Befehle mit
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]` erlaubt.
- `BlackHole 2ch audio device not found`: installieren Sie `blackhole-2ch` auf dem Host,
  der geprüft wird, und starten Sie neu, bevor Sie lokales Chrome-Audio verwenden.
- `BlackHole 2ch audio device not found on the node`: installieren Sie `blackhole-2ch`
  in der VM und starten Sie die VM neu.
- Chrome wird geöffnet, kann aber nicht beitreten: Melden Sie sich beim Browserprofil innerhalb der VM an, oder
  lassen Sie `chrome.guestName` für den Gastbeitritt gesetzt. Der automatische Gastbeitritt verwendet OpenClaw
  Browserautomatisierung über den Node-Browser-Proxy; stellen Sie sicher, dass die Node-Browser-
  Konfiguration auf das gewünschte Profil verweist, zum Beispiel
  `browser.defaultProfile: "user"` oder ein benanntes Profil einer bestehenden Sitzung.
- Doppelte Meet-Tabs: Lassen Sie `chrome.reuseExistingTab: true` aktiviert. OpenClaw
  aktiviert einen vorhandenen Tab für dieselbe Meet-URL, bevor ein neuer geöffnet wird, und
  die Browser-Meeting-Erstellung verwendet einen laufenden `https://meet.google.com/new`-
  oder Google-Konto-Aufforderungs-Tab erneut, bevor ein weiterer geöffnet wird.
- Kein Audio: Leiten Sie in Meet Mikrofon/Lautsprecher über den von OpenClaw verwendeten
  Pfad des virtuellen Audiogeräts; verwenden Sie separate virtuelle Geräte oder Routing
  im Loopback-Stil für sauberes Duplex-Audio.

## Installationshinweise

Die Chrome-Echtzeit-Standardeinstellung verwendet zwei externe Tools:

- `sox`: Befehlszeilen-Audio-Dienstprogramm. Das Plugin verwendet explizite CoreAudio-
  Gerätebefehle für die standardmäßige 24-kHz-PCM16-Audiobrücke.
- `blackhole-2ch`: virtueller macOS-Audiotreiber. Er erstellt das Audiogerät `BlackHole 2ch`,
  über das Chrome/Meet routen kann.

OpenClaw bündelt oder vertreibt keines der beiden Pakete. Die Dokumentation weist Benutzer an,
sie als Host-Abhängigkeiten über Homebrew zu installieren. SoX ist lizenziert als
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole ist GPL-3.0. Wenn Sie ein
Installationsprogramm oder eine Appliance erstellen, die BlackHole mit OpenClaw bündelt, prüfen Sie die
Upstream-Lizenzbedingungen von BlackHole oder beziehen Sie eine separate Lizenz von Existential Audio.

## Transportarten

### Chrome

Der Chrome-Transport öffnet die Meet-URL über die OpenClaw-Browsersteuerung und tritt
als angemeldetes OpenClaw-Browserprofil bei. Unter macOS prüft das Plugin vor dem Start auf
`BlackHole 2ch`. Falls konfiguriert, führt es außerdem vor dem Öffnen von Chrome einen Audiobrücken-
Health-Befehl und Startbefehl aus. Verwenden Sie `chrome`, wenn
Chrome/Audio auf dem Gateway-Host laufen; verwenden Sie `chrome-node`, wenn Chrome/Audio
auf einer gekoppelten Node wie einer Parallels-macOS-VM laufen. Wählen Sie für lokales Chrome das
Profil mit `browser.defaultProfile`; `chrome.browserProfile` wird an
`chrome-node`-Hosts übergeben.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Leiten Sie Chrome-Mikrofon- und Lautsprecheraudio über die lokale OpenClaw-Audiobrücke.
Wenn `BlackHole 2ch` nicht installiert ist, schlägt der Beitritt mit einem Einrichtungsfehler fehl,
statt stillschweigend ohne Audiopfad beizutreten.

### Twilio

Der Twilio-Transport ist ein strikter Wählplan, der an das Voice-Call-Plugin delegiert wird. Er
analysiert keine Meet-Seiten nach Telefonnummern.

Verwenden Sie dies, wenn Chrome-Teilnahme nicht verfügbar ist oder Sie einen Telefon-Einwahl-
Fallback wünschen. Google Meet muss eine Telefon-Einwahlnummer und PIN für das
Meeting bereitstellen; OpenClaw ermittelt diese nicht aus der Meet-Seite.

Aktivieren Sie das Voice-Call-Plugin auf dem Gateway-Host, nicht auf der Chrome-Node:

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

Stellen Sie Twilio-Anmeldedaten über die Umgebung oder Konfiguration bereit. Die Umgebung hält
Geheimnisse aus `openclaw.json` heraus:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Starten Sie das Gateway neu oder laden Sie es neu, nachdem Sie `voice-call` aktiviert haben; Plugin-Konfigurationsänderungen
erscheinen in einem bereits laufenden Gateway-Prozess erst nach einem Neuladen.

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

## OAuth und Vorabprüfung

OAuth ist für das Erstellen eines Meet-Links optional, da `googlemeet create` auf
Browserautomatisierung zurückfallen kann. Konfigurieren Sie OAuth, wenn Sie offizielle API-Erstellung,
Space-Auflösung oder Vorabprüfungen der Meet Media API wünschen.

Der Zugriff auf die Google Meet API verwendet Benutzer-OAuth: Erstellen Sie einen Google Cloud-OAuth-Client,
fordern Sie die erforderlichen Scopes an, autorisieren Sie ein Google-Konto, und speichern Sie dann das
resultierende Refresh Token in der Google Meet-Plugin-Konfiguration oder stellen Sie die
`OPENCLAW_GOOGLE_MEET_*`-Umgebungsvariablen bereit.

OAuth ersetzt den Chrome-Beitrittspfad nicht. Chrome- und Chrome-node-Transporte
treten weiterhin über ein angemeldetes Chrome-Profil, BlackHole/SoX und eine verbundene
Node bei, wenn Sie Browserteilnahme verwenden. OAuth ist nur für den offiziellen Google
Meet API-Pfad vorgesehen: Meeting-Spaces erstellen, Spaces auflösen und Vorabprüfungen der Meet Media API
ausführen.

### Google-Anmeldedaten erstellen

In der Google Cloud Console:

1. Erstellen oder wählen Sie ein Google Cloud-Projekt aus.
2. Aktivieren Sie **Google Meet REST API** für dieses Projekt.
3. Konfigurieren Sie den OAuth-Zustimmungsbildschirm.
   - **Internal** ist für eine Google Workspace-Organisation am einfachsten.
   - **External** funktioniert für persönliche/Test-Setups; während sich die App in Testing befindet,
     fügen Sie jedes Google-Konto, das die App autorisieren soll, als Testbenutzer hinzu.
4. Fügen Sie die von OpenClaw angeforderten Scopes hinzu:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Erstellen Sie eine OAuth-Client-ID.
   - Anwendungstyp: **Web application**.
   - Autorisierte Weiterleitungs-URI:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Kopieren Sie die Client-ID und das Client Secret.

`meetings.space.created` wird von Google Meet `spaces.create` benötigt.
`meetings.space.readonly` ermöglicht OpenClaw, Meet-URLs/-Codes zu Spaces aufzulösen.
`meetings.conference.media.readonly` ist für die Meet Media API-Vorabprüfung und Medienarbeit
bestimmt; Google kann für die tatsächliche Nutzung der Media API eine Developer Preview-Registrierung verlangen.
Wenn Sie nur browserbasierte Chrome-Beitritte benötigen, überspringen Sie OAuth vollständig.

### Refresh Token erstellen

Konfigurieren Sie `oauth.clientId` und optional `oauth.clientSecret`, oder übergeben Sie sie als
Umgebungsvariablen, und führen Sie dann aus:

```bash
openclaw googlemeet auth login --json
```

Der Befehl gibt einen `oauth`-Konfigurationsblock mit einem Refresh Token aus. Er verwendet PKCE,
localhost-Callback auf `http://localhost:8085/oauth2callback` und einen manuellen
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

Bevorzugen Sie Umgebungsvariablen, wenn Sie das Refresh Token nicht in der Konfiguration haben möchten.
Wenn sowohl Konfigurations- als auch Umgebungswerte vorhanden sind, löst das Plugin zuerst die Konfiguration
und dann den Umgebungs-Fallback auf.

Die OAuth-Zustimmung umfasst Meet-Space-Erstellung, Lesezugriff auf Meet-Spaces und Lesezugriff auf Meet-
Konferenzmedien. Wenn Sie sich authentifiziert haben, bevor Unterstützung für die Meeting-Erstellung
existierte, führen Sie `openclaw googlemeet auth login --json` erneut aus, damit das Refresh
Token den Scope `meetings.space.created` hat.

### OAuth mit Doctor prüfen

Führen Sie den OAuth-Doctor aus, wenn Sie eine schnelle, geheimnisfreie Health-Prüfung wünschen:

```bash
openclaw googlemeet doctor --oauth --json
```

Dies lädt die Chrome-Laufzeit nicht und erfordert keine verbundene Chrome-Node. Es
prüft, ob OAuth-Konfiguration vorhanden ist und ob das Refresh Token ein Access
Token ausstellen kann. Der JSON-Bericht enthält nur Statusfelder wie `ok`, `configured`,
`tokenSource`, `expiresAt` und Prüfnachrichten; er gibt weder das Access
Token, Refresh Token noch Client Secret aus.

Häufige Ergebnisse:

| Prüfung              | Bedeutung                                                                               |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` plus `oauth.refreshToken` oder ein zwischengespeichertes Access Token ist vorhanden. |
| `oauth-token`        | Das zwischengespeicherte Access Token ist noch gültig, oder das Refresh Token hat ein neues Access Token ausgestellt. |
| `meet-spaces-get`    | Optionale `--meeting`-Prüfung hat einen vorhandenen Meet-Space aufgelöst.               |
| `meet-spaces-create` | Optionale `--create-space`-Prüfung hat einen neuen Meet-Space erstellt.                |

Um die Aktivierung der Google Meet API und den Scope `spaces.create` ebenfalls nachzuweisen, führen Sie die
seiteneffektbehaftete Erstellungsprüfung aus:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` erstellt eine wegwerfbare Meet-URL. Verwenden Sie dies, wenn Sie bestätigen müssen,
dass im Google Cloud-Projekt die Meet API aktiviert ist und das autorisierte
Konto den Scope `meetings.space.created` hat.

Um Lesezugriff für einen vorhandenen Meeting-Space nachzuweisen:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` und `resolve-space` weisen Lesezugriff auf einen vorhandenen
Space nach, auf den das autorisierte Google-Konto zugreifen kann. Ein `403` aus diesen Prüfungen
bedeutet in der Regel, dass die Google Meet REST API deaktiviert ist, dem zugestimmten Refresh Token
der erforderliche Scope fehlt oder das Google-Konto nicht auf diesen Meet-
Space zugreifen kann. Ein Refresh-Token-Fehler bedeutet: Führen Sie `openclaw googlemeet auth login
--json` erneut aus und speichern Sie den neuen `oauth`-Block.

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

Listen Sie Meeting-Artefakte und Teilnahme auf, nachdem Meet Konferenzdatensätze erstellt hat:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Mit `--meeting` verwenden `artifacts` und `attendance` standardmäßig den neuesten
Konferenzdatensatz. Übergeben Sie `--all-conference-records`, wenn Sie alle
beibehaltenen Datensätze für dieses Meeting möchten.

Die Kalendersuche kann die Meeting-URL aus Google Calendar auflösen, bevor
Meet-Artefakte gelesen werden:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` durchsucht den heutigen `primary`-Kalender nach einem Calendar-Ereignis
mit einem Google Meet-Link. Verwenden Sie `--event <query>`, um passenden
Ereignistext zu suchen, und `--calendar <id>` für einen nicht primären Kalender.
Die Kalendersuche erfordert eine neue OAuth-Anmeldung, die den schreibgeschützten
Scope für Calendar-Ereignisse enthält. `calendar-events` zeigt die passenden
Meet-Ereignisse in einer Vorschau an und markiert das Ereignis, das `latest`,
`artifacts`, `attendance` oder `export` auswählt.

Wenn Ihnen die Konferenzdatensatz-ID bereits bekannt ist, adressieren Sie sie direkt:

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

`artifacts` gibt Metadaten des Konferenzdatensatzes sowie Metadaten zu
Teilnehmern, Aufzeichnungen, Transkripten, strukturierten Transkripteinträgen
und Smart-Note-Ressourcen zurück, wenn Google sie für das Meeting bereitstellt.
Verwenden Sie `--no-transcript-entries`, um die Eintragsabfrage bei großen
Meetings zu überspringen. `attendance` erweitert Teilnehmer zu
Teilnehmersitzungszeilen mit Zeiten für erstes/letztes Auftreten,
Gesamtsitzungsdauer, Markierungen für Verspätung/frühes Verlassen und
duplizierten Teilnehmerressourcen, die nach angemeldetem Benutzer oder
Anzeigename zusammengeführt wurden. Übergeben Sie `--no-merge-duplicates`, um
Rohteilnehmerressourcen getrennt zu halten, `--late-after-minutes`, um die
Verspätungserkennung anzupassen, und `--early-before-minutes`, um die Erkennung
für frühes Verlassen anzupassen.

`export` schreibt einen Ordner mit `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` und `manifest.json`.
`manifest.json` zeichnet die gewählte Eingabe, Exportoptionen,
Konferenzdatensätze, Ausgabedateien, Zählwerte, Token-Quelle, das Calendar-Ereignis,
falls eines verwendet wurde, und alle Warnungen zu teilweisem Abruf auf.
Übergeben Sie `--zip`, um zusätzlich neben dem Ordner ein portables Archiv zu
schreiben. Übergeben Sie `--include-doc-bodies`, um verknüpfte Transkript- und
Smart-Note-Texte aus Google Docs über Google Drive `files.export` zu exportieren;
dies erfordert eine neue OAuth-Anmeldung, die den schreibgeschützten Drive
Meet-Scope enthält. Ohne `--include-doc-bodies` enthalten Exporte nur
Meet-Metadaten und strukturierte Transkripteinträge. Wenn Google einen
teilweisen Artefaktfehler zurückgibt, etwa einen Fehler beim Auflisten von
Smart Notes, bei Transkripteinträgen oder beim Drive-Dokumenttext, behalten
Zusammenfassung und Manifest die Warnung bei, statt den gesamten Export
fehlschlagen zu lassen. Verwenden Sie `--dry-run`, um dieselben Artefakt- und
Teilnahmedaten abzurufen und das Manifest-JSON auszugeben, ohne den Ordner oder
die ZIP-Datei zu erstellen. Das ist nützlich, bevor Sie einen großen Export
schreiben oder wenn ein Agent nur Zählwerte, ausgewählte Datensätze und
Warnungen benötigt.

Agents können dasselbe Bundle auch über das `google_meet`-Tool erstellen:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

Setzen Sie `"dryRun": true`, um nur das Exportmanifest zurückzugeben und
Dateischreibvorgänge zu überspringen.

Führen Sie den geschützten Live-Smoke gegen ein echtes beibehaltenes Meeting aus:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Live-Smoke-Umgebung:

- `OPENCLAW_LIVE_TEST=1` aktiviert geschützte Live-Tests.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` verweist auf eine beibehaltene Meet-URL,
  einen Code oder `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` oder `GOOGLE_MEET_CLIENT_ID` stellt die
  OAuth-Client-ID bereit.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` oder `GOOGLE_MEET_REFRESH_TOKEN` stellt
  das Refresh-Token bereit.
- Optional: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` und
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` verwenden dieselben
  Fallback-Namen ohne das Präfix `OPENCLAW_`.

Der Basis-Live-Smoke für Artefakte/Teilnahme benötigt
`https://www.googleapis.com/auth/meetings.space.readonly` und
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Die
Kalendersuche benötigt `https://www.googleapis.com/auth/calendar.events.readonly`.
Der Export von Drive-Dokumenttexten benötigt
`https://www.googleapis.com/auth/drive.meet.readonly`.

Erstellen Sie einen neuen Meet-Raum:

```bash
openclaw googlemeet create
```

Der Befehl gibt die neue `meeting uri`, die Quelle und die Beitrittssitzung aus.
Mit OAuth-Anmeldedaten verwendet er die offizielle Google Meet API. Ohne
OAuth-Anmeldedaten verwendet er als Fallback das angemeldete Browserprofil des
gepinnten Chrome-Node. Agents können das `google_meet`-Tool mit
`action: "create"` verwenden, um in einem Schritt zu erstellen und beizutreten.
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

Wenn der Browser-Fallback auf eine Google-Anmeldung oder einen Meet-Berechtigungsblocker
stößt, bevor er die URL erstellen kann, gibt die Gateway-Methode eine fehlgeschlagene
Antwort zurück, und das `google_meet`-Tool gibt strukturierte Details statt
einer einfachen Zeichenfolge zurück:

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
`manualActionMessage` sowie den Browser-Node-/Tab-Kontext melden und keine neuen
Meet-Tabs mehr öffnen, bis der Operator den Browser-Schritt abgeschlossen hat.

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

Das Erstellen eines Meet tritt standardmäßig bei. Der Chrome- oder
Chrome-Node-Transport benötigt weiterhin ein angemeldetes Google Chrome-Profil,
um über den Browser beizutreten. Wenn das Profil abgemeldet ist, meldet
OpenClaw `manualActionRequired: true` oder einen Browser-Fallback-Fehler und
fordert den Operator auf, die Google-Anmeldung abzuschließen, bevor er es erneut
versucht.

Setzen Sie `preview.enrollmentAcknowledged: true` erst, nachdem Sie bestätigt
haben, dass Ihr Cloud-Projekt, Ihr OAuth-Prinzipal und die Meeting-Teilnehmer
im Google Workspace Developer Preview Program für Meet-Medien-APIs registriert
sind.

## Konfiguration

Der gemeinsame Chrome-Echtzeitpfad benötigt nur das aktivierte Plugin,
BlackHole, SoX und einen Schlüssel für einen Backend-Echtzeit-Sprach-Provider.
OpenAI ist die Standardeinstellung; setzen Sie `realtime.provider: "google"`,
um Google Gemini Live zu verwenden:

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
- `chromeNode.node`: optionale Node-ID, optionaler Name oder optionale IP für `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: Name, der auf dem Meet-Gastbildschirm
  für abgemeldete Benutzer verwendet wird
- `chrome.autoJoin: true`: Best-Effort-Ausfüllen des Gastnamens und Klick auf
  „Join Now“ über die OpenClaw-Browserautomatisierung auf `chrome-node`
- `chrome.reuseExistingTab: true`: vorhandenen Meet-Tab aktivieren, statt
  Duplikate zu öffnen
- `chrome.waitForInCallMs: 20000`: warten, bis der Meet-Tab „im Anruf“ meldet,
  bevor die Echtzeit-Einführung ausgelöst wird
- `chrome.audioFormat: "pcm16-24khz"`: Audioformat für das Befehlspaar.
  Verwenden Sie `"g711-ulaw-8khz"` nur für alte/benutzerdefinierte Befehlspaare,
  die weiterhin Telefonie-Audio ausgeben.
- `chrome.audioInputCommand`: SoX-Befehl, der aus CoreAudio `BlackHole 2ch` liest
  und Audio in `chrome.audioFormat` schreibt
- `chrome.audioOutputCommand`: SoX-Befehl, der Audio in `chrome.audioFormat`
  liest und nach CoreAudio `BlackHole 2ch` schreibt
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: kurze gesprochene Antworten, mit
  `openclaw_agent_consult` für ausführlichere Antworten
- `realtime.introMessage`: kurze gesprochene Bereitschaftsprüfung, wenn die
  Echtzeit-Bridge verbindet; setzen Sie sie auf `""`, um stumm beizutreten
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

`voiceCall.enabled` ist standardmäßig `true`; mit Twilio-Transport delegiert es den
eigentlichen PSTN-Anruf, DTMF und die Begrüßungseinleitung an das Voice Call-Plugin. Voice Call
spielt die DTMF-Sequenz ab, bevor der Realtime-Medienstrom geöffnet wird, und verwendet dann den
gespeicherten Einleitungstext als anfängliche Realtime-Begrüßung. Wenn `voice-call` nicht
aktiviert ist, kann Google Meet den Wählplan weiterhin validieren und aufzeichnen, aber es kann
den Twilio-Anruf nicht platzieren.

## Tool

Agents können das `google_meet`-Tool verwenden:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Verwenden Sie `transport: "chrome"`, wenn Chrome auf dem Gateway-Host läuft. Verwenden Sie
`transport: "chrome-node"`, wenn Chrome auf einem gekoppelten Node läuft, etwa einer Parallels-
VM. In beiden Fällen laufen das Realtime-Modell und `openclaw_agent_consult` auf dem
Gateway-Host, sodass Modell-Anmeldedaten dort bleiben.

Verwenden Sie `action: "status"`, um aktive Sitzungen aufzulisten oder eine Sitzungs-ID zu prüfen. Verwenden Sie
`action: "speak"` mit `sessionId` und `message`, damit der Realtime-Agent
sofort spricht. Verwenden Sie `action: "test_speech"`, um die Sitzung zu erstellen oder wiederzuverwenden,
eine bekannte Phrase auszulösen und `inCall`-Integrität zurückzugeben, wenn der Chrome-Host sie
melden kann. `test_speech` erzwingt immer `mode: "realtime"` und schlägt fehl, wenn es in
`mode: "transcribe"` ausgeführt werden soll, weil reine Beobachtungssitzungen absichtlich keine
Sprache ausgeben können. Das Ergebnis `speechOutputVerified` basiert darauf, dass die Realtime-Audioausgabebytes
während dieses Testaufrufs zunehmen, sodass eine wiederverwendete Sitzung mit älterem Audio
nicht als frische erfolgreiche Sprachprüfung zählt. Verwenden Sie `action: "leave"`, um eine
Sitzung als beendet zu markieren.

`status` enthält Chrome-Integrität, wenn verfügbar:

- `inCall`: Chrome scheint sich im Meet-Anruf zu befinden
- `micMuted`: Best-Effort-Status des Meet-Mikrofons
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: das
  Browserprofil benötigt eine manuelle Anmeldung, Zulassung durch den Meet-Host, Berechtigungen oder
  eine Reparatur der Browser-Steuerung, bevor Sprache funktionieren kann
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: ob
  verwaltete Chrome-Sprache jetzt erlaubt ist. `speechReady: false` bedeutet, dass OpenClaw die
  Einleitungs-/Testphrase nicht in die Audio-Bridge gesendet hat.
- `providerConnected` / `realtimeReady`: Status der Realtime-Sprach-Bridge
- `lastInputAt` / `lastOutputAt`: zuletzt von der Bridge empfangenes oder an sie gesendetes Audio

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Realtime-Agent-Consult

Der Chrome-Realtime-Modus ist für eine Live-Sprachschleife optimiert. Der Realtime-Sprach-
Provider hört das Meeting-Audio und spricht über die konfigurierte Audio-Bridge.
Wenn das Realtime-Modell tieferes Reasoning, aktuelle Informationen oder normale
OpenClaw-Tools benötigt, kann es `openclaw_agent_consult` aufrufen.

Das Consult-Tool führt im Hintergrund den regulären OpenClaw-Agent mit aktuellem
Meeting-Transkriptkontext aus und gibt eine knappe gesprochene Antwort an die Realtime-
Sprachsitzung zurück. Das Sprachmodell kann diese Antwort dann zurück in das Meeting sprechen.
Es verwendet dasselbe gemeinsame Realtime-Consult-Tool wie Voice Call.

Standardmäßig laufen Consults gegen den `main`-Agent. Setzen Sie `realtime.agentId`, wenn eine
Meet-Lane einen dedizierten OpenClaw-Agent-Arbeitsbereich, Modellvorgaben,
Tool-Richtlinien, Speicher und Sitzungsverlauf konsultieren soll.

`realtime.toolPolicy` steuert den Consult-Lauf:

- `safe-read-only`: das Consult-Tool verfügbar machen und den regulären Agent auf
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` und
  `memory_get` beschränken.
- `owner`: das Consult-Tool verfügbar machen und dem regulären Agent erlauben, die normale
  Agent-Tool-Richtlinie zu verwenden.
- `none`: das Consult-Tool dem Realtime-Sprachmodell nicht verfügbar machen.

Der Consult-Sitzungsschlüssel ist pro Meet-Sitzung begrenzt, sodass nachfolgende Consult-Aufrufe
während desselben Meetings vorherigen Consult-Kontext wiederverwenden können.

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

Verwenden Sie diese Sequenz, bevor Sie ein Meeting an einen unbeaufsichtigten Agent übergeben:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Erwarteter Chrome-Node-Status:

- `googlemeet setup` ist vollständig grün.
- `googlemeet setup` enthält `chrome-node-connected`, wenn Chrome-Node der
  Standardtransport ist oder ein Node fixiert ist.
- `nodes status` zeigt, dass der ausgewählte Node verbunden ist.
- Der ausgewählte Node kündigt sowohl `googlemeet.chrome` als auch `browser.proxy` an.
- Der Meet-Tab tritt dem Anruf bei, und `test-speech` gibt Chrome-Integrität mit
  `inCall: true` zurück.

Für einen entfernten Chrome-Host wie eine Parallels-macOS-VM ist dies die kürzeste
sichere Prüfung nach einer Aktualisierung des Gateway oder der VM:

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

Für einen Twilio-Smoke verwenden Sie ein Meeting, das telefonische Einwahldetails bereitstellt:

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
- `googlemeet leave <sessionId>` legt den delegierten Sprachanruf auf.

## Fehlerbehebung

### Agent kann das Google Meet-Tool nicht sehen

Bestätigen Sie, dass das Plugin in der Gateway-Konfiguration aktiviert ist, und laden Sie das Gateway neu:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Wenn Sie gerade `plugins.entries.google-meet` bearbeitet haben, starten oder laden Sie das Gateway neu.
Der laufende Agent sieht nur Plugin-Tools, die vom aktuellen Gateway-
Prozess registriert wurden.

### Kein verbundener Google-Meet-fähiger Node

Führen Sie auf dem Node-Host aus:

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

Laden Sie dann den Node-Dienst neu und führen Sie erneut aus:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Browser öffnet sich, aber Agent kann nicht beitreten

Führen Sie `googlemeet test-speech` aus und prüfen Sie die zurückgegebene Chrome-Integrität. Wenn sie
`manualActionRequired: true` meldet, zeigen Sie dem Operator `manualActionMessage`
und stoppen Sie weitere Versuche, bis die Browseraktion abgeschlossen ist.

Häufige manuelle Aktionen:

- Im Chrome-Profil anmelden.
- Den Gast vom Meet-Host-Konto zulassen.
- Chrome-Mikrofon-/Kameraberechtigungen erteilen, wenn die native Berechtigungsabfrage von Chrome
  erscheint.
- Einen blockierten Meet-Berechtigungsdialog schließen oder reparieren.

Melden Sie nicht „nicht angemeldet“, nur weil Meet „Do you want people to
hear you in the meeting?“ anzeigt. Das ist Meets Audio-Auswahl-Zwischenschritt; OpenClaw
klickt **Use microphone** per Browser-Automatisierung an, wenn verfügbar, und wartet weiter
auf den echten Meeting-Status. Für den Create-only-Browser-Fallback kann OpenClaw
**Continue without microphone** anklicken, weil das Erstellen der URL den
Realtime-Audiopfad nicht benötigt.

### Meeting-Erstellung schlägt fehl

`googlemeet create` verwendet zuerst den Google Meet API-Endpunkt `spaces.create`,
wenn OAuth-Anmeldedaten konfiguriert sind. Ohne OAuth-Anmeldedaten fällt es auf
den fixierten Chrome-Node-Browser zurück. Bestätigen Sie:

- Für API-Erstellung: `oauth.clientId` und `oauth.refreshToken` sind konfiguriert,
  oder passende `OPENCLAW_GOOGLE_MEET_*`-Umgebungsvariablen sind vorhanden.
- Für API-Erstellung: Das Refresh-Token wurde erstellt, nachdem Create-Unterstützung
  hinzugefügt wurde. Älteren Token kann der Scope `meetings.space.created` fehlen; führen Sie
  `openclaw googlemeet auth login --json` erneut aus und aktualisieren Sie die Plugin-Konfiguration.
- Für Browser-Fallback: `defaultTransport: "chrome-node"` und
  `chromeNode.node` zeigen auf einen verbundenen Node mit `browser.proxy` und
  `googlemeet.chrome`.
- Für Browser-Fallback: Das OpenClaw-Chrome-Profil auf diesem Node ist bei Google angemeldet
  und kann `https://meet.google.com/new` öffnen.
- Für Browser-Fallback: Wiederholungen verwenden einen vorhandenen `https://meet.google.com/new`-
  oder Google-Konto-Eingabeaufforderungs-Tab wieder, bevor ein neuer Tab geöffnet wird. Wenn ein Agent eine Zeitüberschreitung erreicht,
  wiederholen Sie den Tool-Aufruf, statt manuell einen weiteren Meet-Tab zu öffnen.
- Für Browser-Fallback: Wenn das Tool `manualActionRequired: true` zurückgibt, verwenden Sie
  die zurückgegebenen Werte `browser.nodeId`, `browser.targetId`, `browserUrl` und
  `manualActionMessage`, um den Operator zu führen. Wiederholen Sie nicht in einer Schleife, bis diese
  Aktion abgeschlossen ist.
- Für Browser-Fallback: Wenn Meet „Do you want people to hear you in the
  meeting?“ anzeigt, lassen Sie den Tab geöffnet. OpenClaw sollte **Use microphone** oder, für
  den Create-only-Fallback, **Continue without microphone** per Browser-
  Automatisierung anklicken und weiter auf die generierte Meet-URL warten. Wenn das nicht gelingt, sollte der
  Fehler `meet-audio-choice-required` erwähnen, nicht `google-login-required`.

### Agent tritt bei, spricht aber nicht

Prüfen Sie den Realtime-Pfad:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Verwenden Sie `mode: "realtime"` für Zuhören/Rücksprechen. `mode: "transcribe"` startet absichtlich
nicht die Duplex-Realtime-Sprach-Bridge. `googlemeet test-speech`
prüft immer den Realtime-Pfad und meldet, ob Bridge-Ausgabebytes für diesen Aufruf
beobachtet wurden. Wenn `speechOutputVerified` false und
`speechOutputTimedOut` true ist, hat der Realtime-Provider die
Äußerung möglicherweise akzeptiert, aber OpenClaw hat nicht gesehen, dass neue Ausgabebytes die Chrome-Audio-
Bridge erreichen.

Prüfen Sie außerdem:

- Ein Realtime-Provider-Schlüssel ist auf dem Gateway-Host verfügbar, etwa
  `OPENAI_API_KEY` oder `GEMINI_API_KEY`.
- `BlackHole 2ch` ist auf dem Chrome-Host sichtbar.
- `sox` ist auf dem Chrome-Host vorhanden.
- Meet-Mikrofon und -Lautsprecher sind über den von OpenClaw verwendeten virtuellen Audiopfad
  geroutet.

`googlemeet doctor [session-id]` gibt Sitzung, Node, In-Call-Status,
Grund für manuelle Aktion, Realtime-Provider-Verbindung, `realtimeReady`, Audio-
Eingabe-/Ausgabeaktivität, letzte Audiozeitstempel, Byte-Zähler und Browser-URL aus.
Verwenden Sie `googlemeet status [session-id] --json`, wenn Sie das rohe JSON benötigen. Verwenden Sie
`googlemeet doctor --oauth`, wenn Sie Google-Meet-OAuth-Refresh prüfen müssen,
ohne Token offenzulegen; fügen Sie `--meeting` oder `--create-space` hinzu, wenn Sie außerdem einen
Google-Meet-API-Nachweis benötigen.

Wenn ein Agent eine Zeitüberschreitung erreicht hat und Sie sehen können, dass bereits ein Meet-Tab geöffnet ist, prüfen Sie diesen Tab,
ohne einen weiteren zu öffnen:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Die entsprechende Tool-Aktion ist `recover_current_tab`. Sie fokussiert und prüft einen
vorhandenen Meet-Tab für den ausgewählten Transport. Mit `chrome` verwendet sie die lokale
Browsersteuerung über das Gateway; mit `chrome-node` verwendet sie den konfigurierten
Chrome-Node. Sie öffnet keinen neuen Tab und erstellt keine neue Sitzung; sie meldet den
aktuellen Blocker, etwa Anmeldung, Zulassung, Berechtigungen oder den Status der
Audioauswahl. Der CLI-Befehl kommuniziert mit dem konfigurierten Gateway, daher muss das
Gateway laufen; `chrome-node` erfordert außerdem, dass der Chrome-Node verbunden ist.

### Twilio-Einrichtungsprüfungen schlagen fehl

`twilio-voice-call-plugin` schlägt fehl, wenn `voice-call` nicht erlaubt oder nicht aktiviert ist.
Fügen Sie es zu `plugins.allow` hinzu, aktivieren Sie `plugins.entries.voice-call`, und laden Sie das
Gateway neu.

`twilio-voice-call-credentials` schlägt fehl, wenn dem Twilio-Backend Konto-
SID, Auth-Token oder Anrufernummer fehlen. Legen Sie diese auf dem Gateway-Host fest:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` schlägt fehl, wenn `voice-call` keine öffentliche Webhook-
Erreichbarkeit hat oder wenn `publicUrl` auf Loopback oder privaten Netzwerkbereich zeigt.
Setzen Sie `plugins.entries.voice-call.config.publicUrl` auf die öffentliche Provider-URL oder
konfigurieren Sie einen `voice-call`-Tunnel bzw. eine Tailscale-Freigabe.

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

Verwenden Sie für die lokale Entwicklung einen Tunnel oder eine Tailscale-Freigabe statt einer privaten
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

Starten oder laden Sie anschließend das Gateway neu, und führen Sie Folgendes aus:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` ist standardmäßig nur eine Bereitschaftsprüfung. Für einen Testlauf mit einer bestimmten Nummer:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Fügen Sie `--yes` nur hinzu, wenn Sie absichtlich einen ausgehenden Live-Benachrichtigungsanruf
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

Verwenden Sie ein führendes `w` oder Kommas in `--dtmf-sequence`, wenn der Provider vor der
PIN-Eingabe eine Pause benötigt.

Wenn der Telefonanruf erstellt wird, die Meet-Teilnehmerliste den Einwahl-
teilnehmer aber nie anzeigt:

- Führen Sie `openclaw voicecall status --call-id <id>` aus, und bestätigen Sie, dass der Anruf noch
  aktiv ist.
- Führen Sie `openclaw voicecall tail` aus, und prüfen Sie, ob Twilio-Webhooks am
  Gateway ankommen.
- Führen Sie `openclaw googlemeet setup --transport twilio` erneut aus; eine grüne Einrichtungsprüfung ist
  erforderlich, beweist aber nicht, dass die Meeting-PIN-Sequenz korrekt ist.
- Bestätigen Sie, dass die Einwahlnummer zur selben Meet-Einladung und Region gehört wie
  die PIN.
- Erhöhen Sie die führenden Pausen in `--dtmf-sequence`, wenn Meet langsam antwortet, zum
  Beispiel `wwww123456#`.
- Wenn der Teilnehmer beitritt, Sie die Begrüßung aber nicht hören, prüfen Sie
  `openclaw voicecall tail` auf einen Twilio-Stream-Start, gefolgt von der Bereitschaft des Echtzeit-
  Providers. Die Begrüßung wird jetzt aus der initialen
  `voicecall.start`-Nachricht erzeugt, nachdem sich der Stream verbunden hat.

Wenn Webhooks nicht ankommen, debuggen Sie zuerst das Voice Call Plugin: Der Provider muss
`plugins.entries.voice-call.config.publicUrl` oder den konfigurierten Tunnel erreichen.
Siehe [Fehlerbehebung für Sprachanrufe](/de/plugins/voice-call#troubleshooting).

## Hinweise

Die offizielle Medien-API von Google Meet ist empfangsorientiert, daher benötigt das Sprechen in einen Meet-
Anruf weiterhin einen Teilnehmerpfad. Dieses Plugin macht diese Grenze sichtbar:
Chrome übernimmt die Browserteilnahme und das lokale Audio-Routing; Twilio übernimmt
die Teilnahme per Telefoneinwahl.

Der Chrome-Echtzeitmodus benötigt `BlackHole 2ch` plus entweder:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw besitzt die
  Echtzeitmodell-Bridge und leitet Audio in `chrome.audioFormat` zwischen diesen
  Befehlen und dem ausgewählten Echtzeit-Voice-Provider weiter. Der Standard-Chrome-Pfad ist
  24 kHz PCM16; 8 kHz G.711 mu-law bleibt für Legacy-Befehlspaare verfügbar.
- `chrome.audioBridgeCommand`: Ein externer Bridge-Befehl besitzt den gesamten lokalen
  Audiopfad und muss nach dem Starten oder Validieren seines Daemons beendet werden.

Für sauberes Duplex-Audio leiten Sie Meet-Ausgabe und Meet-Mikrofon durch getrennte
virtuelle Geräte oder einen virtuellen Gerätegraphen im Loopback-Stil. Ein einzelnes gemeinsam genutztes
BlackHole-Gerät kann andere Teilnehmer zurück in den Anruf spiegeln.

`googlemeet speak` löst die aktive Echtzeit-Audio-Bridge für eine Chrome-
Sitzung aus. `googlemeet leave` stoppt diese Bridge. Bei Twilio-Sitzungen, die
über das Voice Call Plugin delegiert werden, legt `leave` auch den zugrunde liegenden Sprachanruf auf.

## Verwandt

- [Voice Call Plugin](/de/plugins/voice-call)
- [Sprechmodus](/de/nodes/talk)
- [Plugins erstellen](/de/plugins/building-plugins)
