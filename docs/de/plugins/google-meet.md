---
read_when:
    - Sie möchten, dass ein OpenClaw-Agent einem Google-Meet-Anruf beitritt
    - Sie möchten, dass ein OpenClaw-Agent einen neuen Google-Meet-Anruf erstellt
    - Sie konfigurieren Chrome, Chrome-Node oder Twilio als Google-Meet-Transport
summary: 'Google-Meet-Plugin: explizite Meet-URLs über Chrome oder Twilio mit standardmäßigen Echtzeit-Sprachvorgaben beitreten'
title: Google-Meet-Plugin
x-i18n:
    generated_at: "2026-04-26T11:35:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1bd53db711e4729a9a7b18f7aaa3eedffd71a1e19349fc858537652b5d17cfcb
    source_path: plugins/google-meet.md
    workflow: 15
---

Google-Meet-Teilnehmerunterstützung für OpenClaw — das Plugin ist bewusst explizit gestaltet:

- Es tritt nur einer expliziten `https://meet.google.com/...`-URL bei.
- Es kann über die Google-Meet-API einen neuen Meet-Raum erstellen und dann der
  zurückgegebenen URL beitreten.
- Sprachmodus `realtime` ist der Standardmodus.
- Realtime-Sprachmodus kann bei Bedarf für tieferes Denken oder Tools zurück in den vollständigen OpenClaw-Agenten aufrufen.
- Agenten wählen das Beitrittsverhalten mit `mode`: Verwenden Sie `realtime` für Live-
  Zuhören/Sprechen, oder `transcribe`, um dem Browser beizutreten/ihn zu steuern, ohne die
  Realtime-Sprach-Bridge.
- Die Authentifizierung beginnt als persönliches Google OAuth oder über ein bereits angemeldetes Chrome-Profil.
- Es gibt keine automatische Zustimmungsmeldung.
- Das Standard-Chrome-Audio-Backend ist `BlackHole 2ch`.
- Chrome kann lokal oder auf einem gekoppelten Node-Host laufen.
- Twilio akzeptiert eine Einwahlnummer plus optionale PIN oder DTMF-Sequenz.
- Der CLI-Befehl ist `googlemeet`; `meet` ist für allgemeinere agentische
  Telekonferenz-Workflows reserviert.

## Schnellstart

Installieren Sie die lokalen Audio-Abhängigkeiten und konfigurieren Sie einen
Backend-Provider für Realtime-Sprachmodus. OpenAI ist der Standard; Google Gemini Live funktioniert ebenfalls mit
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# oder
export GEMINI_API_KEY=...
```

`blackhole-2ch` installiert das virtuelle Audiogerät `BlackHole 2ch`. Der Installer von Homebrew
erfordert einen Neustart, bevor macOS das Gerät bereitstellt:

```bash
sudo reboot
```

Prüfen Sie nach dem Neustart beide Teile:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
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

Setup prüfen:

```bash
openclaw googlemeet setup
```

Die Setup-Ausgabe ist so gedacht, dass Agenten sie lesen können. Sie meldet Chrome-Profil,
Audio-Bridge, Node-Pinning, verzögerte Realtime-Einführung und — wenn Twilio-Delegation
konfiguriert ist —, ob das Plugin `voice-call` und die Twilio-Anmeldedaten bereit sind.
Behandeln Sie jede Prüfung mit `ok: false` als Blocker, bevor Sie einen Agenten bitten beizutreten.
Verwenden Sie `openclaw googlemeet setup --json` für Skripte oder maschinenlesbare Ausgabe.
Verwenden Sie `--transport chrome`, `--transport chrome-node` oder `--transport twilio`,
um einen bestimmten Transport vorab zu prüfen, bevor ein Agent ihn verwendet.

Einer Besprechung beitreten:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Oder einen Agenten über das Tool `google_meet` beitreten lassen:

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

- API-Erstellung: wird verwendet, wenn Google-Meet-OAuth-Anmeldedaten konfiguriert sind. Dies ist
  der deterministischste Pfad und hängt nicht vom Zustand der Browser-UI ab.
- Browser-Fallback: wird verwendet, wenn OAuth-Anmeldedaten fehlen. OpenClaw verwendet den
  gepinnten Chrome-Node, öffnet `https://meet.google.com/new`, wartet, bis Google auf eine echte
  Meeting-Code-URL umleitet, und gibt dann diese URL zurück. Dieser Pfad erfordert,
  dass das OpenClaw-Chrome-Profil auf dem Node bereits bei Google angemeldet ist.
  Die Browser-Automatisierung behandelt den eigenen Mikrofon-Prompt von Meet beim ersten Start;
  dieser Prompt wird nicht als Fehler bei der Google-Anmeldung behandelt.
  Beitritts- und Erstellungsabläufe versuchen außerdem, einen vorhandenen Meet-Tab wiederzuverwenden, bevor
  ein neuer geöffnet wird. Der Abgleich ignoriert harmlose URL-Query-Strings wie `authuser`, sodass sich ein Retry durch einen Agenten auf die bereits geöffnete Besprechung konzentrieren sollte, statt einen zweiten Chrome-Tab zu erzeugen.

Die Befehls-/Tool-Ausgabe enthält ein Feld `source` (`api` oder `browser`), damit Agenten
erklären können, welcher Pfad verwendet wurde. `create` tritt der neuen Besprechung standardmäßig bei und
gibt `joined: true` plus die Beitrittssitzung zurück. Um nur die URL zu erzeugen, verwenden Sie
`create --no-join` in der CLI oder übergeben `"join": false` an das Tool.

Oder sagen Sie einem Agenten: „Erstelle ein Google Meet, tritt mit realtime-Sprachmodus bei und schick
mir den Link.“ Der Agent sollte `google_meet` mit `action: "create"` aufrufen und
dann die zurückgegebene `meetingUri` teilen.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Für einen nur beobachtenden / browsergesteuerten Beitritt setzen Sie `"mode": "transcribe"`. Dadurch
wird die Duplex-Realtime-Modell-Bridge nicht gestartet, sodass nicht zurück in die
Besprechung gesprochen wird.

Während Realtime-Sitzungen enthält `google_meet`-Status Informationen zum Zustand von Browser und Audio-Bridge
wie `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, letzte Ein-/Ausgabe-
Zeitstempel, Byte-Zähler und den Status der geschlossenen Bridge. Wenn ein sicherer
Meet-Seiten-Prompt erscheint, behandelt die Browser-Automatisierung ihn, wenn sie kann. Anmeldung,
Host-Zulassung und Browser-/OS-Berechtigungsprompts werden als manuelle Aktion mit
Grund und Nachricht gemeldet, die der Agent weitergeben soll.

Chrome tritt als das angemeldete Chrome-Profil bei. Wählen Sie in Meet `BlackHole 2ch` für den
Mikrofon-/Lautsprecherpfad, den OpenClaw verwendet. Für sauberes Duplex-Audio verwenden Sie
separate virtuelle Geräte oder ein Loopback-ähnliches Routing; ein einzelnes BlackHole-Gerät reicht
für einen ersten Smoke Test, kann aber Echo erzeugen.

### Lokales Gateway + Parallels Chrome

Sie benötigen **kein** vollständiges OpenClaw Gateway oder einen Modell-API-Schlüssel innerhalb einer macOS-VM,
nur damit die VM Chrome besitzt. Führen Sie Gateway und Agent lokal aus und lassen Sie dann in der VM
einen Node-Host laufen. Aktivieren Sie das gebündelte Plugin einmal in der VM, damit der Node
den Chrome-Befehl ankündigt:

Was läuft wo:

- Gateway-Host: OpenClaw Gateway, Agenten-Workspace, Modell-/API-Schlüssel, Realtime-
  Provider und die Konfiguration des Google-Meet-Plugins.
- Parallels-macOS-VM: OpenClaw CLI/Node-Host, Google Chrome, SoX, BlackHole 2ch,
  und ein bei Google angemeldetes Chrome-Profil.
- Nicht nötig in der VM: Gateway-Dienst, Agentenkonfiguration, OpenAI/GPT-Schlüssel oder
  Modell-Provider-Setup.

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
command -v rec play
```

Installieren oder aktualisieren Sie OpenClaw in der VM und aktivieren Sie dort dann das gebündelte Plugin:

```bash
openclaw plugins enable google-meet
```

Starten Sie den Node-Host in der VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Wenn `<gateway-host>` eine LAN-IP ist und Sie TLS nicht verwenden, verweigert der Node den
Klartext-WebSocket, sofern Sie nicht für dieses vertrauenswürdige private Netzwerk explizit opt-in setzen:

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
Einstellung in `openclaw.json`. `openclaw node install` speichert sie in der LaunchAgent-
Umgebung, wenn sie beim Installationsbefehl vorhanden ist.

Genehmigen Sie den Node vom Gateway-Host aus:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Bestätigen Sie, dass das Gateway den Node sieht und dass er sowohl `googlemeet.chrome`
als auch Browser-Fähigkeit/`browser.proxy` ankündigt:

```bash
openclaw nodes status
```

Leiten Sie Meet über diesen Node auf dem Gateway-Host:

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

Treten Sie jetzt wie gewohnt vom Gateway-Host aus bei:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

oder bitten Sie den Agenten, das Tool `google_meet` mit `transport: "chrome-node"` zu verwenden.

Für einen Smoke Test mit nur einem Befehl, der eine Sitzung erstellt oder wiederverwendet, einen bekannten
Satz spricht und den Sitzungszustand ausgibt:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Während des Beitritts füllt die OpenClaw-Browser-Automatisierung den Gastnamen aus, klickt auf Beitreten / Um Beitritt bitten
und akzeptiert die Meet-Erstauswahl „Mikrofon verwenden“, wenn dieser Prompt erscheint. Während der reinen browserbasierten Erstellung einer Besprechung kann sie auch
denselben Prompt ohne Mikrofon weiterführen, wenn Meet die Schaltfläche zum Verwenden des Mikrofons nicht anbietet.
Wenn das Browser-Profil nicht angemeldet ist, Meet auf Host-
Zulassung wartet, Chrome Mikrofon-/Kamera-Berechtigung benötigt oder Meet bei einem
Prompt hängen bleibt, den die Automatisierung nicht auflösen konnte, meldet das Ergebnis von join/test-speech
`manualActionRequired: true` mit `manualActionReason` und
`manualActionMessage`. Agenten sollten aufhören, den Beitritt zu retrien, genau
diese Nachricht plus die aktuelle `browserUrl`/`browserTitle` melden und erst erneut versuchen,
nachdem die manuelle Browser-Aktion abgeschlossen ist.

Wenn `chromeNode.node` weggelassen wird, wählt OpenClaw nur dann automatisch aus, wenn genau ein
verbundener Node sowohl `googlemeet.chrome` als auch Browser-Steuerung ankündigt. Wenn
mehrere geeignete Nodes verbunden sind, setzen Sie `chromeNode.node` auf die Node-ID,
den Anzeigenamen oder die entfernte IP.

Häufige Fehlerprüfungen:

- `Configured Google Meet node ... is not usable: offline`: der gepinnte Node ist
  dem Gateway bekannt, aber nicht verfügbar. Agenten sollten diesen Node als
  Diagnosezustand behandeln, nicht als nutzbaren Chrome-Host, und den Setup-Blocker
  melden, statt auf einen anderen Transport zurückzufallen, sofern der Benutzer nicht darum gebeten hat.
- `No connected Google Meet-capable node`: starten Sie `openclaw node run` in der VM,
  genehmigen Sie das Pairing und stellen Sie sicher, dass `openclaw plugins enable google-meet` und
  `openclaw plugins enable browser` in der VM ausgeführt wurden. Bestätigen Sie außerdem, dass der
  Gateway-Host beide Node-Befehle mit
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]` zulässt.
- `BlackHole 2ch audio device not found`: installieren Sie `blackhole-2ch` auf dem zu prüfenden Host
  und starten Sie neu, bevor Sie lokales Chrome-Audio verwenden.
- `BlackHole 2ch audio device not found on the node`: installieren Sie `blackhole-2ch`
  in der VM und starten Sie die VM neu.
- Chrome öffnet sich, kann aber nicht beitreten: Melden Sie sich im Browser-Profil innerhalb der VM an, oder
  lassen Sie `chrome.guestName` gesetzt für Gastbeitritt. Auto-Join als Gast verwendet OpenClaw-
  Browser-Automatisierung über den Browser-Proxy des Nodes; stellen Sie sicher, dass die Browser-
  Konfiguration des Nodes auf das gewünschte Profil zeigt, zum Beispiel
  `browser.defaultProfile: "user"` oder ein benanntes existing-session-Profil.
- Doppelte Meet-Tabs: Lassen Sie `chrome.reuseExistingTab: true` aktiviert. OpenClaw
  aktiviert einen vorhandenen Tab für dieselbe Meet-URL, bevor es einen neuen öffnet, und die
  browserbasierte Erstellung von Besprechungen verwendet einen laufenden `https://meet.google.com/new`
  oder einen Google-Konto-Prompt-Tab wieder, bevor ein weiterer geöffnet wird.
- Kein Audio: Leiten Sie in Meet Mikrofon/Lautsprecher durch den Pfad des virtuellen Audiogeräts,
  den OpenClaw verwendet; nutzen Sie separate virtuelle Geräte oder Loopback-ähnliches Routing
  für sauberes Duplex-Audio.

## Hinweise zur Installation

Der Chrome-Realtime-Standard verwendet zwei externe Tools:

- `sox`: Kommandozeilen-Audio-Tool. Das Plugin verwendet dessen Befehle `rec` und `play`
  für die standardmäßige 8-kHz-G.711-mu-law-Audio-Bridge.
- `blackhole-2ch`: virtueller Audiotreiber für macOS. Er erstellt das Audiogerät `BlackHole 2ch`,
  über das Chrome/Meet geroutet werden kann.

OpenClaw bündelt oder vertreibt keines der beiden Pakete. Die Dokumentation bittet Benutzer,
sie als Host-Abhängigkeiten über Homebrew zu installieren. SoX ist lizenziert als
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole ist GPL-3.0. Wenn Sie einen
Installer oder ein Appliance bauen, das BlackHole mit OpenClaw bündelt, prüfen Sie die
Upstream-Lizenzbedingungen von BlackHole oder beschaffen Sie eine separate Lizenz von Existential Audio.

## Transporte

### Chrome

Der Chrome-Transport öffnet die Meet-URL in Google Chrome und tritt als das angemeldete
Chrome-Profil bei. Unter macOS prüft das Plugin vor dem Start auf `BlackHole 2ch`.
Wenn konfiguriert, führt es außerdem einen Health-Befehl für die Audio-Bridge und einen Startup-Befehl
aus, bevor Chrome geöffnet wird. Verwenden Sie `chrome`, wenn Chrome/Audio auf dem Gateway-Host laufen;
verwenden Sie `chrome-node`, wenn Chrome/Audio auf einem gekoppelten Node wie einer Parallels-
macOS-VM laufen.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Leiten Sie Mikrofon- und Lautsprecheraudio von Chrome über die lokale OpenClaw-Audio-
Bridge. Wenn `BlackHole 2ch` nicht installiert ist, schlägt der Beitritt mit einem Setup-Fehler
fehl, statt stillschweigend ohne Audiopfad beizutreten.

### Twilio

Der Twilio-Transport ist ein strikter Einwahlplan, der an das Plugin Voice Call delegiert wird. Er
parst Meet-Seiten nicht nach Telefonnummern.

Verwenden Sie dies, wenn eine Teilnahme über Chrome nicht verfügbar ist oder Sie einen Rückfallpfad
über Telefoneinwahl möchten. Google Meet muss für die
Besprechung eine Telefonnummer und PIN zur Einwahl bereitstellen; OpenClaw entdeckt diese nicht auf der Meet-Seite.

Aktivieren Sie das Plugin Voice Call auf dem Gateway-Host, nicht auf dem Chrome-Node:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // oder setzen Sie "twilio", wenn Twilio der Standard sein soll
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

Stellen Sie Twilio-Anmeldedaten über die Umgebung oder die Konfiguration bereit. Über die Umgebung bleiben
Geheimnisse aus `openclaw.json` heraus:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Starten Sie das Gateway nach dem Aktivieren von `voice-call` neu oder laden Sie es neu; Änderungen an der Plugin-Konfiguration
werden in einem bereits laufenden Gateway-Prozess erst sichtbar, wenn dieser neu geladen wird.

Dann prüfen Sie:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Wenn die Twilio-Delegation korrekt verdrahtet ist, enthält `googlemeet setup` erfolgreiche
Prüfungen `twilio-voice-call-plugin` und `twilio-voice-call-credentials`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Verwenden Sie `--dtmf-sequence`, wenn die Besprechung eine benutzerdefinierte Sequenz benötigt:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth und Preflight

OAuth ist optional, um einen Meet-Link zu erstellen, weil `googlemeet create` auf
Browser-Automatisierung zurückfallen kann. Konfigurieren Sie OAuth, wenn Sie die offizielle API-Erstellung,
Space-Auflösung oder Preflight-Prüfungen der Meet Media API möchten.

Der Zugriff auf die Google-Meet-API verwendet Benutzer-OAuth: Erstellen Sie einen Google-Cloud-OAuth-Client,
fordern Sie die erforderlichen Scopes an, autorisieren Sie ein Google-Konto und speichern Sie dann den
resultierenden Refresh-Token in der Konfiguration des Google-Meet-Plugins oder stellen Sie die
Umgebungsvariablen `OPENCLAW_GOOGLE_MEET_*` bereit.

OAuth ersetzt den Chrome-Beitrittspfad nicht. Die Transporte Chrome und Chrome-node
treten weiterhin über ein angemeldetes Chrome-Profil, BlackHole/SoX und einen verbundenen
Node bei, wenn Sie Browser-Teilnahme verwenden. OAuth ist nur für den offiziellen Google-
Meet-API-Pfad: Besprechungs-Spaces erstellen, Spaces auflösen und Preflight-Prüfungen
der Meet Media API ausführen.

### Google-Anmeldedaten erstellen

In der Google Cloud Console:

1. Erstellen oder wählen Sie ein Google-Cloud-Projekt.
2. Aktivieren Sie für dieses Projekt die **Google Meet REST API**.
3. Konfigurieren Sie den OAuth-Consent-Screen.
   - **Internal** ist am einfachsten für eine Google-Workspace-Organisation.
   - **External** funktioniert für persönliche/Test-Setups; solange sich die App im Status Testing befindet,
     fügen Sie jedes Google-Konto, das die App autorisieren soll, als Testbenutzer hinzu.
4. Fügen Sie die von OpenClaw angeforderten Scopes hinzu:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Erstellen Sie eine OAuth-Client-ID.
   - Anwendungstyp: **Web application**.
   - Autorisierte Redirect-URI:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Kopieren Sie die Client-ID und das Client-Secret.

`meetings.space.created` ist für Google Meet `spaces.create` erforderlich.
`meetings.space.readonly` ermöglicht OpenClaw, Meet-URLs/-Codes zu Spaces aufzulösen.
`meetings.conference.media.readonly` ist für Preflight- und Medienarbeit mit der Meet Media API; Google kann für die tatsächliche Nutzung der Media API eine Developer-Preview-Einschreibung verlangen.
Wenn Sie nur browserbasierte Chrome-Beitritte benötigen, überspringen Sie OAuth vollständig.

### Den Refresh-Token erzeugen

Konfigurieren Sie `oauth.clientId` und optional `oauth.clientSecret` oder übergeben Sie sie als
Umgebungsvariablen und führen Sie dann aus:

```bash
openclaw googlemeet auth login --json
```

Der Befehl gibt einen `oauth`-Konfigurationsblock mit einem Refresh-Token aus. Er verwendet PKCE,
einen Localhost-Callback unter `http://localhost:8085/oauth2callback` und einen manuellen
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

Speichern Sie das Objekt `oauth` unter der Konfiguration des Google-Meet-Plugins:

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

Bevorzugen Sie Umgebungsvariablen, wenn Sie den Refresh-Token nicht in der Konfiguration haben möchten.
Wenn sowohl Konfigurations- als auch Umgebungswerte vorhanden sind, löst das Plugin zuerst die Konfiguration
auf und verwendet danach ein Env-Fallback.

Der OAuth-Consent umfasst Erstellung von Meet-Spaces, Lesezugriff auf Meet-Spaces und Lesezugriff auf Meet-
Konferenzmedien. Wenn Sie sich authentifiziert haben, bevor die Unterstützung für Meeting-Erstellung
vorhanden war, führen Sie `openclaw googlemeet auth login --json` erneut aus, damit der Refresh-
Token den Scope `meetings.space.created` hat.

### OAuth mit doctor prüfen

Führen Sie den OAuth-Doctor aus, wenn Sie eine schnelle, nicht geheime Integritätsprüfung möchten:

```bash
openclaw googlemeet doctor --oauth --json
```

Dadurch wird die Chrome-Laufzeit nicht geladen und kein verbundener Chrome-Node benötigt. Es
prüft, ob OAuth-Konfiguration vorhanden ist und ob der Refresh-Token einen Access-
Token erzeugen kann. Der JSON-Bericht enthält nur Statusfelder wie `ok`, `configured`,
`tokenSource`, `expiresAt` und Prüfmeldungen; er gibt weder Access-
Token, Refresh-Token noch Client-Secret aus.

Häufige Ergebnisse:

| Prüfung              | Bedeutung                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` plus `oauth.refreshToken` oder ein zwischengespeicherter Access-Token ist vorhanden. |
| `oauth-token`        | Der zwischengespeicherte Access-Token ist noch gültig oder der Refresh-Token hat einen neuen Access-Token erzeugt. |
| `meet-spaces-get`    | Die optionale Prüfung `--meeting` hat einen vorhandenen Meet-Space aufgelöst.            |
| `meet-spaces-create` | Die optionale Prüfung `--create-space` hat einen neuen Meet-Space erstellt.              |

Um zusätzlich die Aktivierung der Google-Meet-API und den Scope `spaces.create` zu belegen, führen Sie die
seiteneffektbehaftete Erstellungsprüfung aus:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` erstellt eine Wegwerf-Meet-URL. Verwenden Sie dies, wenn Sie bestätigen müssen,
dass im Google-Cloud-Projekt die Meet-API aktiviert ist und das autorisierte
Konto den Scope `meetings.space.created` hat.

Um den Lesezugriff auf einen vorhandenen Besprechungs-Space zu belegen:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` und `resolve-space` belegen den Lesezugriff auf einen vorhandenen
Space, auf den das autorisierte Google-Konto zugreifen kann. Ein `403` bei diesen Prüfungen
bedeutet normalerweise, dass die Google Meet REST API deaktiviert ist, dem bestätigten Refresh-Token
der erforderliche Scope fehlt oder das Google-Konto keinen Zugriff auf diesen Meet-
Space hat. Ein Refresh-Token-Fehler bedeutet, dass Sie `openclaw googlemeet auth login
--json` erneut ausführen und den neuen `oauth`-Block speichern sollten.

Für das Browser-Fallback werden keine OAuth-Anmeldedaten benötigt. In diesem Modus kommt die Google-
Authentifizierung aus dem angemeldeten Chrome-Profil auf dem ausgewählten Node, nicht aus der
OpenClaw-Konfiguration.

Diese Umgebungsvariablen werden als Fallback akzeptiert:

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

Führen Sie Preflight vor Medienarbeit aus:

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
Übergeben Sie `--all-conference-records`, wenn Sie jeden gespeicherten Datensatz
für diese Besprechung möchten.

Die Kalendersuche kann die Besprechungs-URL aus Google Calendar auflösen, bevor Meet-Artefakte gelesen werden:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` durchsucht den heutigen Kalender `primary` nach einem Calendar-Ereignis mit einem
Google-Meet-Link. Verwenden Sie `--event <query>`, um passenden Ereignistext zu durchsuchen, und
`--calendar <id>` für einen nicht-primären Kalender. Die Kalendersuche erfordert ein frisches
OAuth-Login, das den readonly-Scope für Calendar-Ereignisse enthält.
`calendar-events` zeigt passende Meet-Ereignisse in der Vorschau und markiert das Ereignis, das
`latest`, `artifacts`, `attendance` oder `export` auswählen wird.

Wenn Sie die ID des Konferenzdatensatzes bereits kennen, sprechen Sie sie direkt an:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Einen lesbaren Bericht schreiben:

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

`artifacts` gibt Metadaten zu Konferenzdatensätzen sowie Metadaten zu Teilnehmern,
Aufzeichnungen, Transkripten, strukturierten Transkript-Einträgen und Smart-Note-Ressourcen zurück, wenn
Google sie für die Besprechung bereitstellt. Verwenden Sie `--no-transcript-entries`, um
die Abfrage von Einträgen bei großen Besprechungen zu überspringen. `attendance` erweitert Teilnehmer in
Zeilen für Teilnehmersitzungen mit Zeitpunkten für erstes/letztes Auftreten, gesamter Sitzungsdauer,
Flags für spätes/frühes Verlassen und zusammengeführten doppelten Teilnehmerressourcen nach angemeldetem
Benutzer oder Anzeigename. Übergeben Sie `--no-merge-duplicates`, um rohe Teilnehmer-
Ressourcen getrennt zu halten, `--late-after-minutes`, um die Erkennung von Verspätung anzupassen, und
`--early-before-minutes`, um die Erkennung von frühem Verlassen anzupassen.

`export` schreibt einen Ordner mit `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` und `manifest.json`.
`manifest.json` erfasst die gewählte Eingabe, Exportoptionen, Konferenzdatensätze,
Ausgabedateien, Zählwerte, Token-Quelle, Calendar-Ereignis, wenn eines verwendet wurde, und etwaige
Warnungen bei partieller Abfrage. Übergeben Sie `--zip`, um zusätzlich ein portables Archiv neben
dem Ordner zu schreiben. Übergeben Sie `--include-doc-bodies`, um verlinkten Transkript- und
Smart-Note-Google-Docs-Text über Google Drive `files.export` zu exportieren; dies erfordert ein
frisches OAuth-Login mit dem Drive-Meet-Readonly-Scope. Ohne
`--include-doc-bodies` enthalten Exporte nur Meet-Metadaten und strukturierte Transkript-
Einträge. Wenn Google einen partiellen Artefaktfehler zurückgibt, z. B. bei einer Smart-Note-
Auflistung, einem Transkript-Eintrag oder einem Drive-Dokumenttext-Fehler, behalten die Zusammenfassung und
das Manifest die Warnung, statt den gesamten Export fehlschlagen zu lassen.
Verwenden Sie `--dry-run`, um dieselben Artefakt-/Attendance-Daten abzurufen und das
Manifest-JSON auszugeben, ohne den Ordner oder die ZIP-Datei zu erstellen. Das ist nützlich, bevor ein
großer Export geschrieben wird oder wenn ein Agent nur Zählwerte, ausgewählte Datensätze und
Warnungen benötigt.

Agenten können dasselbe Bundle auch über das Tool `google_meet` erstellen:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

Setzen Sie `"dryRun": true`, um nur das Export-Manifest zurückzugeben und Dateischreibvorgänge zu überspringen.

Führen Sie den geschützten Live-Smoke-Test gegen eine echte gespeicherte Besprechung aus:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Live-Smoke-Umgebung:

- `OPENCLAW_LIVE_TEST=1` aktiviert geschützte Live-Tests.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` zeigt auf eine gespeicherte Meet-URL, einen Code oder
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` oder `GOOGLE_MEET_CLIENT_ID` liefert die OAuth-
  Client-ID.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` oder `GOOGLE_MEET_REFRESH_TOKEN` liefert
  den Refresh-Token.
- Optional: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` und
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` verwenden dieselben Fallback-Namen
  ohne das Präfix `OPENCLAW_`.

Der grundlegende Live-Smoke-Test für Artefakte/Attendance benötigt
`https://www.googleapis.com/auth/meetings.space.readonly` und
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Die Calendar-
Suche benötigt `https://www.googleapis.com/auth/calendar.events.readonly`. Der Export von
Drive-Dokumenttext benötigt
`https://www.googleapis.com/auth/drive.meet.readonly`.

Einen neuen Meet-Space erstellen:

```bash
openclaw googlemeet create
```

Der Befehl gibt die neue `meeting uri`, die Quelle und die Beitrittssitzung aus. Mit OAuth-
Anmeldedaten verwendet er die offizielle Google-Meet-API. Ohne OAuth-Anmeldedaten
verwendet er als Fallback das angemeldete Browser-Profil des gepinnten Chrome-Nodes. Agenten können
das Tool `google_meet` mit `action: "create"` verwenden, um in einem
Schritt zu erstellen und beizutreten. Für Erstellung nur der URL übergeben Sie `"join": false`.

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

Wenn der Browser-Fallback auf eine Google-Anmeldung oder eine Berechtigungsblockade von Meet trifft, bevor er
die URL erstellen kann, gibt die Gateway-Methode eine fehlgeschlagene Antwort zurück, und das
Tool `google_meet` liefert strukturierte Details statt eines einfachen Strings:

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
`manualActionMessage` plus den Kontext von Browser-Node/Tab melden und aufhören, neue
Meet-Tabs zu öffnen, bis der Operator den Schritt im Browser abgeschlossen hat.

Beispiel-JSON-Ausgabe aus API-Erstellung:

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

Beim Erstellen eines Meets wird standardmäßig beigetreten. Der Transport Chrome oder Chrome-node
benötigt weiterhin ein bei Google angemeldetes Chrome-Profil, um über den Browser beizutreten. Wenn das
Profil abgemeldet ist, meldet OpenClaw `manualActionRequired: true` oder einen
Browser-Fallback-Fehler und fordert den Operator auf, die Google-Anmeldung abzuschließen, bevor
ein Retry erfolgt.

Setzen Sie `preview.enrollmentAcknowledged: true` erst, nachdem Sie bestätigt haben, dass Ihr Cloud-
Projekt, OAuth-Prinzipal und Besprechungsteilnehmer im Google-
Workspace-Developer-Preview-Programm für Meet-Media-APIs eingeschrieben sind.

## Konfiguration

Der übliche Chrome-Realtime-Pfad benötigt nur das aktivierte Plugin, BlackHole, SoX
und einen Schlüssel für einen Backend-Provider für Realtime-Sprachmodus. OpenAI ist der Standard; setzen Sie
`realtime.provider: "google"`, um Google Gemini Live zu verwenden:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# oder
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
- `chrome.guestName: "OpenClaw Agent"`: Name, der auf dem abgemeldeten Meet-Gast-
  Bildschirm verwendet wird
- `chrome.autoJoin: true`: best-effort Ausfüllen des Gastnamens und Klick auf Join Now
  über OpenClaw-Browser-Automatisierung auf `chrome-node`
- `chrome.reuseExistingTab: true`: einen vorhandenen Meet-Tab aktivieren, statt
  Duplikate zu öffnen
- `chrome.waitForInCallMs: 20000`: warten, bis der Meet-Tab meldet, dass er im Anruf ist,
  bevor die Realtime-Einführung ausgelöst wird
- `chrome.audioInputCommand`: SoX-Befehl `rec`, der 8-kHz-G.711-mu-law-
  Audio nach stdout schreibt
- `chrome.audioOutputCommand`: SoX-Befehl `play`, der 8-kHz-G.711-mu-law-
  Audio von stdin liest
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: kurze gesprochene Antworten mit
  `openclaw_agent_consult` für tiefere Antworten
- `realtime.introMessage`: kurze gesprochene Bereitschaftsprüfung, wenn die Realtime-Bridge
  verbindet; setzen Sie sie auf `""`, um still beizutreten

Optionale Überschreibungen:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    provider: "google",
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
eigentlichen PSTN-Anruf und DTMF an das Plugin Voice Call. Wenn `voice-call` nicht
aktiviert ist, kann Google Meet den Einwahlplan weiterhin validieren und aufzeichnen, aber es kann
den Twilio-Anruf nicht platzieren.

## Tool

Agenten können das Tool `google_meet` verwenden:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Verwenden Sie `transport: "chrome"`, wenn Chrome auf dem Gateway-Host läuft. Verwenden Sie
`transport: "chrome-node"`, wenn Chrome auf einem gekoppelten Node wie einer Parallels-
VM läuft. In beiden Fällen laufen das Realtime-Modell und `openclaw_agent_consult` auf dem
Gateway-Host, sodass Modell-Anmeldedaten dort bleiben.

Verwenden Sie `action: "status"`, um aktive Sitzungen aufzulisten oder eine Sitzungs-ID zu prüfen. Verwenden Sie
`action: "speak"` mit `sessionId` und `message`, damit der Realtime-Agent
sofort spricht. Verwenden Sie `action: "test_speech"`, um die Sitzung zu erstellen oder wiederzuverwenden,
einen bekannten Satz auszulösen und den Zustand `inCall` zurückzugeben, wenn der Chrome-Host ihn
melden kann. Verwenden Sie `action: "leave"`, um eine Sitzung als beendet zu markieren.

`status` enthält, wenn verfügbar, Informationen zum Chrome-Zustand:

- `inCall`: Chrome scheint innerhalb des Meet-Anrufs zu sein
- `micMuted`: best-effort Mikrofonstatus von Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: das
  Browser-Profil benötigt manuelle Anmeldung, Host-Zulassung in Meet, Berechtigungen oder
  Reparatur der Browser-Steuerung, bevor Sprache funktionieren kann
- `providerConnected` / `realtimeReady`: Zustand der Realtime-Sprach-Bridge
- `lastInputAt` / `lastOutputAt`: zuletzt vom bzw. zum Bridge-Audio gesehene Zeitpunkte

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Realtime-Agenten-Konsultation

Der Chrome-Realtime-Modus ist für einen Live-Sprachkreislauf optimiert. Der Realtime-Sprach-
Provider hört das Besprechungsaudio und spricht über die konfigurierte Audio-Bridge.
Wenn das Realtime-Modell tieferes Denken, aktuelle Informationen oder normale
OpenClaw-Tools benötigt, kann es `openclaw_agent_consult` aufrufen.

Das Konsultations-Tool führt hinter den Kulissen den regulären OpenClaw-Agenten mit aktuellem
Besprechungstranskript-Kontext aus und gibt eine knappe gesprochene Antwort an die Realtime-
Sprachsitzung zurück. Das Sprachmodell kann diese Antwort dann zurück in die Besprechung sprechen.
Es verwendet dasselbe gemeinsam genutzte Realtime-Konsultations-Tool wie Voice Call.

`realtime.toolPolicy` steuert den Konsultationslauf:

- `safe-read-only`: das Konsultations-Tool freigeben und den regulären Agenten auf
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` und
  `memory_get` beschränken.
- `owner`: das Konsultations-Tool freigeben und dem regulären Agenten die normale
  Tool-Richtlinie des Agenten erlauben.
- `none`: das Konsultations-Tool dem Realtime-Sprachmodell nicht bereitstellen.

Der Sitzungsschlüssel der Konsultation ist pro Meet-Sitzung begrenzt, sodass nachfolgende Konsultationsaufrufe
im Verlauf derselben Besprechung vorherigen Konsultationskontext wiederverwenden können.

Um nach vollständigem Beitritt von Chrome zum Anruf eine gesprochene Bereitschaftsprüfung zu erzwingen:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Für den vollständigen Join-and-Speak-Smoke-Test:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Checkliste für Live-Tests

Verwenden Sie diese Abfolge, bevor Sie ein Meeting an einen unbeaufsichtigten Agenten übergeben:

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
  Standardtransport ist oder ein Node festgelegt wurde.
- `nodes status` zeigt den ausgewählten verbundenen Node an.
- Der ausgewählte Node meldet sowohl `googlemeet.chrome` als auch `browser.proxy`.
- Der Meet-Tab tritt dem Anruf bei und `test-speech` gibt den Chrome-Zustand mit
  `inCall: true` zurück.

Für einen entfernten Chrome-Host wie eine Parallels-macOS-VM ist dies die
kürzeste sichere Prüfung nach einer Aktualisierung des Gateway oder der VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Damit wird nachgewiesen, dass das Gateway-Plugin geladen ist, der VM-Node mit
dem aktuellen Token verbunden ist und die Meet-Audiobrücke verfügbar ist, bevor
ein Agent einen echten Meeting-Tab öffnet.

Für einen Twilio-Smoke verwenden Sie ein Meeting, das Telefon-Einwahldaten
bereitstellt:

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
- `voicecall` ist in der CLI nach einem Gateway-Neuladen verfügbar.
- Die zurückgegebene Sitzung hat `transport: "twilio"` und eine `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` legt den delegierten Sprachanruf auf.

## Fehlerbehebung

### Agent kann das Google Meet-Tool nicht sehen

Bestätigen Sie, dass das Plugin in der Gateway-Konfiguration aktiviert ist, und
laden Sie das Gateway neu:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Wenn Sie gerade `plugins.entries.google-meet` bearbeitet haben, starten Sie das
Gateway neu oder laden Sie es neu. Der laufende Agent sieht nur Plugin-Tools,
die vom aktuellen Gateway-Prozess registriert wurden.

### Kein verbundener Google Meet-fähiger Node

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

Der Node muss verbunden sein und `googlemeet.chrome` sowie `browser.proxy`
auflisten. Die Gateway-Konfiguration muss diese Node-Befehle zulassen:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Wenn `googlemeet setup` bei `chrome-node-connected` fehlschlägt oder das
Gateway-Protokoll `gateway token mismatch` meldet, installieren Sie den Node mit
dem aktuellen Gateway-Token neu oder starten Sie ihn neu. Für ein LAN-Gateway
bedeutet das normalerweise:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Laden Sie dann den Node-Dienst neu und führen Sie erneut Folgendes aus:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Browser öffnet sich, aber Agent kann nicht beitreten

Führen Sie `googlemeet test-speech` aus und prüfen Sie den zurückgegebenen
Chrome-Zustand. Wenn dort `manualActionRequired: true` gemeldet wird, zeigen Sie
dem Operator `manualActionMessage` an und versuchen Sie es nicht erneut, bis die
Browseraktion abgeschlossen ist.

Häufige manuelle Aktionen:

- Im Chrome-Profil anmelden.
- Den Gast über das Meet-Hostkonto zulassen.
- Chrome Mikrofon-/Kameraberechtigungen erteilen, wenn die native
  Berechtigungsaufforderung von Chrome erscheint.
- Einen hängenden Meet-Berechtigungsdialog schließen oder reparieren.

Melden Sie nicht „not signed in“, nur weil Meet „Do you want people to hear you
in the meeting?“ anzeigt. Das ist der Audioauswahl-Zwischenschritt von Meet;
OpenClaw klickt per Browserautomatisierung auf **Use microphone**, wenn
verfügbar, und wartet weiter auf den echten Meeting-Status. Beim
reinen Browser-Fallback für die Erstellung kann OpenClaw auf **Continue without
microphone** klicken, weil zum Erstellen der URL kein Echtzeit-Audiopfad
erforderlich ist.

### Erstellung des Meetings schlägt fehl

`googlemeet create` verwendet zuerst den Google Meet API-Endpunkt `spaces.create`,
wenn OAuth-Zugangsdaten konfiguriert sind. Ohne OAuth-Zugangsdaten fällt es auf
den angehefteten Chrome-node-Browser zurück. Prüfen Sie Folgendes:

- Für die API-Erstellung: `oauth.clientId` und `oauth.refreshToken` sind
  konfiguriert, oder passende Umgebungsvariablen `OPENCLAW_GOOGLE_MEET_*` sind
  vorhanden.
- Für die API-Erstellung: Das Refresh-Token wurde erstellt, nachdem die
  Unterstützung für die Erstellung hinzugefügt wurde. Älteren Tokens fehlt
  möglicherweise der Scope `meetings.space.created`; führen Sie
  `openclaw googlemeet auth login --json` erneut aus und aktualisieren Sie die
  Plugin-Konfiguration.
- Für den Browser-Fallback: `defaultTransport: "chrome-node"` und
  `chromeNode.node` verweisen auf einen verbundenen Node mit `browser.proxy` und
  `googlemeet.chrome`.
- Für den Browser-Fallback: Das OpenClaw-Chrome-Profil auf diesem Node ist bei
  Google angemeldet und kann `https://meet.google.com/new` öffnen.
- Für den Browser-Fallback: Wiederholungsversuche verwenden einen vorhandenen
  `https://meet.google.com/new`-Tab oder einen Google-Konto-Aufforderungstab
  erneut, bevor ein neuer Tab geöffnet wird. Wenn ein Agent ein Timeout erreicht,
  wiederholen Sie den Tool-Aufruf, anstatt manuell einen weiteren Meet-Tab zu
  öffnen.
- Für den Browser-Fallback: Wenn das Tool `manualActionRequired: true`
  zurückgibt, verwenden Sie `browser.nodeId`, `browser.targetId`, `browserUrl`
  und `manualActionMessage`, um den Operator anzuleiten. Wiederholen Sie den
  Vorgang nicht in einer Schleife, bis diese Aktion abgeschlossen ist.
- Für den Browser-Fallback: Wenn Meet „Do you want people to hear you in the
  meeting?“ anzeigt, lassen Sie den Tab geöffnet. OpenClaw sollte per
  Browserautomatisierung auf **Use microphone** oder beim Fallback nur für die
  Erstellung auf **Continue without microphone** klicken und weiter auf die
  generierte Meet-URL warten. Wenn dies nicht möglich ist, sollte der Fehler
  `meet-audio-choice-required` erwähnen, nicht `google-login-required`.

### Agent tritt bei, spricht aber nicht

Prüfen Sie den Echtzeitpfad:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Verwenden Sie `mode: "realtime"` für Hören/Sprechen. `mode: "transcribe"` startet
absichtlich nicht die bidirektionale Echtzeit-Sprachbrücke.

Prüfen Sie außerdem:

- Auf dem Gateway-Host ist ein Schlüssel für einen Echtzeit-Anbieter verfügbar,
  zum Beispiel `OPENAI_API_KEY` oder `GEMINI_API_KEY`.
- `BlackHole 2ch` ist auf dem Chrome-Host sichtbar.
- `rec` und `play` sind auf dem Chrome-Host vorhanden.
- Meet-Mikrofon und Lautsprecher werden über den von OpenClaw verwendeten
  virtuellen Audiopfad geroutet.

`googlemeet doctor [session-id]` gibt die Sitzung, den Node, den In-Call-Status,
den Grund für die manuelle Aktion, die Verbindung des Echtzeit-Anbieters,
`realtimeReady`, Audioeingangs-/Audioausgangsaktivität, die letzten
Audio-Zeitstempel, Byte-Zähler und die Browser-URL aus. Verwenden Sie
`googlemeet status [session-id]`, wenn Sie das rohe JSON benötigen. Verwenden
Sie `googlemeet doctor --oauth`, wenn Sie die OAuth-Aktualisierung von Google
Meet prüfen müssen, ohne Tokens offenzulegen; fügen Sie `--meeting` oder
`--create-space` hinzu, wenn Sie zusätzlich einen Google Meet API-Nachweis
benötigen.

Wenn ein Agent ein Timeout erreicht hat und Sie bereits einen offenen Meet-Tab
sehen, prüfen Sie diesen Tab, ohne einen weiteren zu öffnen:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Die entsprechende Tool-Aktion ist `recover_current_tab`. Sie fokussiert einen
vorhandenen Meet-Tab und prüft ihn für den ausgewählten Transport. Mit `chrome`
verwendet sie lokale Browsersteuerung über das Gateway; mit `chrome-node`
verwendet sie den konfigurierten Chrome-Node. Sie öffnet keinen neuen Tab und
erstellt keine neue Sitzung; sie meldet die aktuelle Blockierung, zum Beispiel
Login-, Zulassungs-, Berechtigungs- oder Audioauswahlstatus. Der CLI-Befehl
spricht mit dem konfigurierten Gateway, daher muss das Gateway laufen; für
`chrome-node` muss zusätzlich der Chrome-Node verbunden sein.

### Twilio-Setup-Prüfungen schlagen fehl

`twilio-voice-call-plugin` schlägt fehl, wenn `voice-call` nicht erlaubt oder
nicht aktiviert ist. Fügen Sie es zu `plugins.allow` hinzu, aktivieren Sie
`plugins.entries.voice-call` und laden Sie das Gateway neu.

`twilio-voice-call-credentials` schlägt fehl, wenn dem Twilio-Backend die
account SID, das Auth-Token oder die Absendernummer fehlen. Setzen Sie diese auf
dem Gateway-Host:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Starten Sie dann das Gateway neu oder laden Sie es neu und führen Sie Folgendes
aus:

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` ist standardmäßig nur für die Bereitschaftsprüfung gedacht. Um
einen Probelauf für eine bestimmte Nummer auszuführen:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Fügen Sie `--yes` nur hinzu, wenn Sie absichtlich einen echten ausgehenden
Benachrichtigungsanruf tätigen möchten:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio-Anruf startet, tritt dem Meeting aber nie bei

Bestätigen Sie, dass das Meet-Ereignis Telefon-Einwahldaten bereitstellt.
Übergeben Sie die genaue Einwahlnummer und PIN oder eine benutzerdefinierte
DTMF-Sequenz:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Verwenden Sie führende `w` oder Kommas in `--dtmf-sequence`, wenn der Anbieter
vor der PIN-Eingabe eine Pause benötigt.

## Hinweise

Die offizielle Medien-API von Google Meet ist auf Empfang ausgerichtet, daher
ist zum Sprechen in einen Meet-Anruf weiterhin ein Teilnehmerpfad erforderlich.
Dieses Plugin macht diese Grenze sichtbar: Chrome übernimmt die Teilnahme im
Browser und das lokale Audio-Routing; Twilio übernimmt die Teilnahme per
Telefoneinwahl.

Der Chrome-Echtzeitmodus benötigt entweder:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw verwaltet
  die Echtzeit-Modellbrücke und leitet 8-kHz-G.711-mu-law-Audio zwischen diesen
  Befehlen und dem ausgewählten Echtzeit-Sprachanbieter weiter.
- `chrome.audioBridgeCommand`: Ein externer Brückenbefehl verwaltet den gesamten
  lokalen Audiopfad und muss nach dem Start oder der Validierung seines Daemons
  beendet werden.

Für sauberes bidirektionales Audio routen Sie die Meet-Ausgabe und das
Meet-Mikrofon über getrennte virtuelle Geräte oder einen virtuellen
Gerätegraphen im Stil von Loopback. Ein einzelnes gemeinsam genutztes
BlackHole-Gerät kann andere Teilnehmer zurück in den Anruf echon.

`googlemeet speak` löst die aktive Echtzeit-Audiobrücke für eine Chrome-Sitzung
aus. `googlemeet leave` stoppt diese Brücke. Bei Twilio-Sitzungen, die über das
Voice Call-Plugin delegiert werden, legt `leave` auch den zugrunde liegenden
Sprachanruf auf.

## Verwandt

- [Voice Call-Plugin](/de/plugins/voice-call)
- [Sprechmodus](/de/nodes/talk)
- [Plugins erstellen](/de/plugins/building-plugins)
