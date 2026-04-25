---
read_when:
    - Sie möchten, dass ein OpenClaw-Agent einem Google-Meet-Anruf beitritt.
    - Sie möchten, dass ein OpenClaw-Agent einen neuen Google-Meet-Anruf erstellt.
    - Sie konfigurieren Chrome, einen Chrome-Node oder Twilio als Google-Meet-Transport.
summary: 'Google-Meet-Plugin: explizite Meet-URLs über Chrome oder Twilio mit standardmäßigen Echtzeit-Sprachvorgaben beitreten'
title: Google-Meet-Plugin
x-i18n:
    generated_at: "2026-04-25T13:51:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3329ea25e94eb20403464d041cd34de731b7620deeac6b32248655e885cd3729
    source_path: plugins/google-meet.md
    workflow: 15
---

Google-Meet-Teilnehmerunterstützung für OpenClaw — das Plugin ist bewusst explizit gestaltet:

- Es tritt nur einer expliziten `https://meet.google.com/...`-URL bei.
- Es kann über die Google-Meet-API einen neuen Meet-Raum erstellen und dann der
  zurückgegebenen URL beitreten.
- `realtime` voice ist der Standardmodus.
- Realtime voice kann in den vollständigen OpenClaw-Agenten zurückrufen, wenn tieferes
  Reasoning oder Tools benötigt werden.
- Agenten wählen das Beitrittsverhalten mit `mode`: Verwenden Sie `realtime` für Live-
  Zuhören/Sprechen oder `transcribe`, um dem Browser beizutreten/ihn zu steuern, ohne die
  Realtime-Voice-Bridge.
- Die Authentifizierung beginnt als persönliches Google OAuth oder mit einem bereits angemeldeten Chrome-Profil.
- Es gibt keine automatische Einwilligungsankündigung.
- Das Standard-Audio-Backend für Chrome ist `BlackHole 2ch`.
- Chrome kann lokal oder auf einem gekoppelten Node-Host laufen.
- Twilio akzeptiert eine Einwahlnummer plus optionale PIN oder DTMF-Sequenz.
- Der CLI-Befehl ist `googlemeet`; `meet` ist für umfassendere Agenten-
  Telekonferenz-Workflows reserviert.

## Schnellstart

Installieren Sie die lokalen Audioabhängigkeiten und konfigurieren Sie einen Backend-Provider für Realtime Voice.
OpenAI ist der Standard; Google Gemini Live funktioniert ebenfalls mit
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

Prüfen Sie nach dem Neustart beide Komponenten:

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

Prüfen Sie das Setup:

```bash
openclaw googlemeet setup
```

Die Ausgabe des Setups ist dafür gedacht, von Agenten gelesen zu werden. Sie meldet Chrome-Profil,
Audio-Bridge, Node-Pinning, verzögerte Realtime-Einführung und, wenn Twilio-Delegierung
konfiguriert ist, ob das Plugin `voice-call` und die Twilio-Anmeldedaten bereit sind.
Behandeln Sie jede Prüfung mit `ok: false` als Blocker, bevor Sie einen Agenten bitten beizutreten.
Verwenden Sie `openclaw googlemeet setup --json` für Skripte oder maschinenlesbare Ausgabe.

Einem Meeting beitreten:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Oder lassen Sie einen Agenten über das Tool `google_meet` beitreten:

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

- API-Erstellung: wird verwendet, wenn Google-Meet-OAuth-Anmeldedaten konfiguriert sind. Das ist
  der deterministischste Pfad und hängt nicht vom UI-Zustand des Browsers ab.
- Browser-Fallback: wird verwendet, wenn keine OAuth-Anmeldedaten vorhanden sind. OpenClaw verwendet den
  gepinnten Chrome-Node, öffnet `https://meet.google.com/new`, wartet darauf, dass Google zu einer echten
  URL mit Meeting-Code weiterleitet, und gibt dann diese URL zurück. Dieser Pfad erfordert,
  dass das OpenClaw-Chrome-Profil auf dem Node bereits bei Google angemeldet ist.
  Browser-Automatisierung verarbeitet die eigene Mikrofonaufforderung von Meet beim ersten Start; diese Aufforderung
  wird nicht als Fehler beim Google-Login behandelt.
  Beitritts- und Erstellungsabläufe versuchen außerdem, einen vorhandenen Meet-Tab wiederzuverwenden, bevor ein
  neuer geöffnet wird. Der Abgleich ignoriert harmlose URL-Query-Strings wie `authuser`, sodass ein
  Agenten-Retry das bereits geöffnete Meeting fokussieren sollte, statt einen zweiten
  Chrome-Tab zu erzeugen.

Die Ausgabe von Befehl/Tool enthält ein Feld `source` (`api` oder `browser`), sodass Agenten
erklären können, welcher Pfad verwendet wurde. `create` tritt dem neuen Meeting standardmäßig bei und
gibt `joined: true` plus die Beitrittssitzung zurück. Um nur die URL zu erzeugen, verwenden Sie
`create --no-join` im CLI oder übergeben `"join": false` an das Tool.

Oder sagen Sie einem Agenten: „Erstelle ein Google Meet, tritt mit Realtime Voice bei und sende
mir den Link.“ Der Agent sollte `google_meet` mit `action: "create"` aufrufen und
dann die zurückgegebene `meetingUri` teilen.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Für einen Join nur zum Beobachten/zur Browsersteuerung setzen Sie `"mode": "transcribe"`. Dadurch
wird die Duplex-Realtime-Modell-Bridge nicht gestartet, also spricht es nicht in das
Meeting zurück.

Während Realtime-Sitzungen enthält der Status von `google_meet` Browser- und Audio-Bridge-
Gesundheitsdaten wie `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, Zeitstempel der letzten Ein-/Ausgabe,
Byte-Zähler und den Status der geschlossenen Bridge. Wenn eine sichere Aufforderung auf der Meet-Seite erscheint,
verarbeitet die Browser-Automatisierung sie, wenn möglich. Login, Host-Zulassung und
Browser-/OS-Berechtigungsaufforderungen werden als manuelle Aktion mit Grund und Meldung
gemeldet, die der Agent weitergeben soll.

Chrome tritt als das angemeldete Chrome-Profil bei. Wählen Sie in Meet `BlackHole 2ch` für den
Mikrofon-/Lautsprecherpfad, den OpenClaw verwendet. Für sauberes Duplex-Audio verwenden Sie
getrennte virtuelle Geräte oder ein Routing im Stil von Loopback; ein einzelnes BlackHole-Gerät
reicht für einen ersten Smoke-Test aus, kann aber Echo verursachen.

### Lokales Gateway + Parallels Chrome

Sie benötigen **kein** vollständiges OpenClaw Gateway und keinen Modell-API-Schlüssel in einer macOS-VM,
nur damit die VM Eigentümer von Chrome ist. Führen Sie Gateway und Agent lokal aus und
führen Sie dann einen Node-Host in der VM aus. Aktivieren Sie das gebündelte Plugin einmal auf der VM,
damit der Node den Chrome-Befehl bekanntgibt:

Was wo läuft:

- Gateway-Host: OpenClaw Gateway, Agent-Workspace, Modell-/API-Schlüssel, Realtime-
  Provider und die Konfiguration des Google-Meet-Plugins.
- Parallels-macOS-VM: OpenClaw CLI/Node-Host, Google Chrome, SoX, BlackHole 2ch
  und ein bei Google angemeldetes Chrome-Profil.
- In der VM nicht erforderlich: Gateway-Service, Agent-Konfiguration, OpenAI-/GPT-Schlüssel oder Einrichtung des Modell-Providers.

Installieren Sie die VM-Abhängigkeiten:

```bash
brew install blackhole-2ch sox
```

Starten Sie die VM nach der Installation von BlackHole neu, damit macOS `BlackHole 2ch` bereitstellt:

```bash
sudo reboot
```

Prüfen Sie nach dem Neustart, ob die VM das Audiogerät und die SoX-Befehle sehen kann:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Installieren oder aktualisieren Sie OpenClaw in der VM und aktivieren Sie dann dort das gebündelte Plugin:

```bash
openclaw plugins enable google-meet
```

Starten Sie den Node-Host in der VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Wenn `<gateway-host>` eine LAN-IP ist und Sie kein TLS verwenden, verweigert der Node den
unverschlüsselten WebSocket, sofern Sie nicht für dieses vertrauenswürdige private Netzwerk opt-in aktivieren:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ist eine Prozessumgebungsvariable, keine
Einstellung in `openclaw.json`. `openclaw node install` speichert sie in der LaunchAgent-
Umgebung, wenn sie beim Installationsbefehl vorhanden ist.

Genehmigen Sie den Node vom Gateway-Host aus:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Bestätigen Sie, dass das Gateway den Node sieht und dass er sowohl `googlemeet.chrome`
als auch Browser-Capability/`browser.proxy` bekanntgibt:

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

Treten Sie jetzt vom Gateway-Host aus normal bei:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

oder bitten Sie den Agenten, das Tool `google_meet` mit `transport: "chrome-node"` zu verwenden.

Für einen Smoke-Test mit einem einzelnen Befehl, der eine Sitzung erstellt oder wiederverwendet, einen bekannten
Satz spricht und den Zustand der Sitzung ausgibt:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Während des Beitritts füllt die Browser-Automatisierung von OpenClaw den Gastnamen aus, klickt auf Join/Ask
to join und akzeptiert die „Use microphone“-Auswahl von Meet beim ersten Lauf, wenn diese Aufforderung
erscheint. Während der browserbasierten Erstellung eines Meetings kann sie auch an derselben
Aufforderung ohne Mikrofon vorbeigehen, wenn Meet die Schaltfläche zur Mikrofonverwendung nicht anbietet.
Wenn das Browser-Profil nicht angemeldet ist, Meet auf die
Zulassung durch den Host wartet, Chrome Mikrofon-/Kameraberechtigungen benötigt oder Meet auf einer
Aufforderung hängen bleibt, die von der Automatisierung nicht aufgelöst werden konnte, meldet das Ergebnis von Join/Test-Speech
`manualActionRequired: true` mit `manualActionReason` und
`manualActionMessage`. Agenten sollten aufhören, den Join erneut zu versuchen, genau
diese Meldung plus die aktuelle `browserUrl`/`browserTitle` melden und erst erneut versuchen,
nachdem die manuelle Browseraktion abgeschlossen ist.

Wenn `chromeNode.node` weggelassen wird, wählt OpenClaw nur dann automatisch aus, wenn genau ein
verbundener Node sowohl `googlemeet.chrome` als auch Browsersteuerung bekanntgibt. Wenn
mehrere geeignete Nodes verbunden sind, setzen Sie `chromeNode.node` auf die Node-ID,
den Anzeigenamen oder die entfernte IP.

Häufige Fehlerprüfungen:

- `No connected Google Meet-capable node`: Starten Sie `openclaw node run` in der VM,
  genehmigen Sie das Pairing und stellen Sie sicher, dass `openclaw plugins enable google-meet` und
  `openclaw plugins enable browser` in der VM ausgeführt wurden. Bestätigen Sie außerdem, dass der
  Gateway-Host beide Node-Befehle zulässt mit
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found on the node`: Installieren Sie `blackhole-2ch`
  in der VM und starten Sie die VM neu.
- Chrome öffnet sich, kann aber nicht beitreten: Melden Sie sich innerhalb der VM beim Browser-Profil an oder
  lassen Sie `chrome.guestName` für den Gastbeitritt gesetzt. Auto-Join für Gäste verwendet die Browser-
  Automatisierung von OpenClaw über den Browser-Proxy des Node; stellen Sie sicher, dass die Browser-
  Konfiguration des Node auf das gewünschte Profil zeigt, zum Beispiel
  `browser.defaultProfile: "user"` oder ein benanntes existing-session-Profil.
- Doppelte Meet-Tabs: Lassen Sie `chrome.reuseExistingTab: true` aktiviert. OpenClaw
  aktiviert einen vorhandenen Tab für dieselbe Meet-URL, bevor ein neuer geöffnet wird, und die
  browserbasierte Erstellung eines Meetings verwendet einen laufenden `https://meet.google.com/new`-
  oder Google-Konto-Prompt-Tab wieder, bevor ein weiterer geöffnet wird.
- Kein Audio: Leiten Sie in Meet Mikrofon/Lautsprecher über den Pfad des virtuellen Audiogeräts,
  den OpenClaw verwendet; verwenden Sie getrennte virtuelle Geräte oder Routing im Stil von Loopback
  für sauberes Duplex-Audio.

## Hinweise zur Installation

Der Realtime-Standard über Chrome verwendet zwei externe Tools:

- `sox`: Audio-Dienstprogramm für die Kommandozeile. Das Plugin verwendet dessen Befehle `rec` und `play`
  für die standardmäßige 8-kHz-G.711-mu-law-Audio-Bridge.
- `blackhole-2ch`: virtueller Audiotreiber für macOS. Er erstellt das Audiogerät `BlackHole 2ch`,
  über das Chrome/Meet routen kann.

OpenClaw bündelt oder vertreibt keines der beiden Pakete. In der Dokumentation werden die Benutzer aufgefordert,
sie über Homebrew als Host-Abhängigkeiten zu installieren. SoX ist lizenziert unter
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole unter GPL-3.0. Wenn Sie ein
Installationsprogramm oder eine Appliance erstellen, die BlackHole mit OpenClaw bündelt, prüfen Sie die
vorgelagerten Lizenzbedingungen von BlackHole oder holen Sie eine separate Lizenz von Existential Audio ein.

## Transports

### Chrome

Der Chrome-Transport öffnet die Meet-URL in Google Chrome und tritt als das angemeldete
Chrome-Profil bei. Unter macOS prüft das Plugin vor dem Start auf `BlackHole 2ch`.
Wenn konfiguriert, führt es außerdem einen Audio-Bridge-Health-Befehl und einen Startbefehl
aus, bevor Chrome geöffnet wird. Verwenden Sie `chrome`, wenn Chrome/Audio auf dem Gateway-Host leben;
verwenden Sie `chrome-node`, wenn Chrome/Audio auf einem gekoppelten Node leben, zum Beispiel in einer Parallels-
macOS-VM.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Leiten Sie Mikrofon- und Lautsprecheraudio von Chrome über die lokale OpenClaw-Audio-
Bridge. Wenn `BlackHole 2ch` nicht installiert ist, schlägt der Beitritt mit einem Setup-Fehler
fehl, statt stillschweigend ohne Audiopfad beizutreten.

### Twilio

Der Twilio-Transport ist ein strikter Wählplan, der an das Voice-Call-Plugin delegiert wird. Er
parst keine Meet-Seiten nach Telefonnummern.

Verwenden Sie dies, wenn die Teilnahme über Chrome nicht verfügbar ist oder Sie einen
Fallback für die Telefoneinwahl möchten. Google Meet muss eine Telefonnummer zur Einwahl und eine PIN für das
Meeting bereitstellen; OpenClaw erkennt diese nicht von der Meet-Seite.

Aktivieren Sie das Voice-Call-Plugin auf dem Gateway-Host, nicht auf dem Chrome-Node:

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

Stellen Sie Twilio-Anmeldedaten über die Umgebung oder die Konfiguration bereit. Die Umgebung hält
Secrets aus `openclaw.json` heraus:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Starten Sie das Gateway neu oder laden Sie es neu, nachdem Sie `voice-call` aktiviert haben; Plugin-Konfigurationsänderungen
erscheinen in einem bereits laufenden Gateway-Prozess erst, wenn er neu geladen wird.

Prüfen Sie dann:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Wenn die Twilio-Delegierung korrekt verdrahtet ist, enthält `googlemeet setup` erfolgreiche
Prüfungen `twilio-voice-call-plugin` und `twilio-voice-call-credentials`.

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

OAuth ist optional zum Erstellen eines Meet-Links, da `googlemeet create` auf Browser-
Automatisierung zurückfallen kann. Konfigurieren Sie OAuth, wenn Sie die offizielle API-Erstellung,
Space-Auflösung oder Preflight-Prüfungen der Meet Media API möchten.

Der Zugriff auf die Google-Meet-API verwendet Benutzer-OAuth: Erstellen Sie einen Google-Cloud-OAuth-Client,
fordern Sie die erforderlichen Scopes an, autorisieren Sie ein Google-Konto und speichern Sie dann das
resultierende Refresh-Token in der Konfiguration des Google-Meet-Plugins oder stellen Sie die
Umgebungsvariablen `OPENCLAW_GOOGLE_MEET_*` bereit.

OAuth ersetzt nicht den Join-Pfad über Chrome. Die Transports `chrome` und `chrome-node`
treten weiterhin über ein angemeldetes Chrome-Profil, BlackHole/SoX und einen verbundenen
Node bei, wenn Sie Browser-Teilnahme verwenden. OAuth ist nur für den offiziellen Google-
Meet-API-Pfad gedacht: Meeting-Spaces erstellen, Spaces auflösen und Preflight-Prüfungen der
Meet Media API ausführen.

### Google-Anmeldedaten erstellen

In der Google Cloud Console:

1. Erstellen oder wählen Sie ein Google-Cloud-Projekt aus.
2. Aktivieren Sie die **Google Meet REST API** für dieses Projekt.
3. Konfigurieren Sie den OAuth-Zustimmungsbildschirm.
   - **Internal** ist für eine Google-Workspace-Organisation am einfachsten.
   - **External** funktioniert für persönliche/Test-Setups; solange sich die App im Testing befindet,
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
`meetings.space.readonly` erlaubt OpenClaw, Meet-URLs/-Codes in Spaces aufzulösen.
`meetings.conference.media.readonly` ist für Preflight und Medien-
Arbeit der Meet Media API gedacht; Google kann für die tatsächliche Verwendung der Media API eine Developer-Preview-Teilnahme verlangen.
Wenn Sie nur browserbasierte Chrome-Joins benötigen, überspringen Sie OAuth vollständig.

### Das Refresh-Token erzeugen

Konfigurieren Sie `oauth.clientId` und optional `oauth.clientSecret`, oder übergeben Sie sie als
Umgebungsvariablen, und führen Sie dann aus:

```bash
openclaw googlemeet auth login --json
```

Der Befehl gibt einen Konfigurationsblock `oauth` mit einem Refresh-Token aus. Er verwendet PKCE,
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

Bevorzugen Sie Umgebungsvariablen, wenn Sie das Refresh-Token nicht in der Konfiguration haben möchten.
Wenn sowohl Konfigurations- als auch Umgebungswerte vorhanden sind, löst das Plugin zuerst die Konfiguration
auf und verwendet dann den Umgebungs-Fallback.

Die OAuth-Zustimmung umfasst das Erstellen von Meet-Spaces, Lesezugriff auf Meet-Spaces und Lesezugriff auf Meet-
Konferenzmedien. Wenn Sie sich authentifiziert haben, bevor die Unterstützung für die Erstellung von Meetings
existierte, führen Sie `openclaw googlemeet auth login --json` erneut aus, damit das Refresh-
Token den Scope `meetings.space.created` hat.

### OAuth mit doctor prüfen

Führen Sie den OAuth-Doctor aus, wenn Sie eine schnelle, nicht geheime Zustandsprüfung möchten:

```bash
openclaw googlemeet doctor --oauth --json
```

Dies lädt die Chrome-Laufzeit nicht und erfordert keinen verbundenen Chrome-Node. Es
prüft, dass eine OAuth-Konfiguration vorhanden ist und dass das Refresh-Token ein Access-
Token erzeugen kann. Der JSON-Bericht enthält nur Statusfelder wie `ok`, `configured`,
`tokenSource`, `expiresAt` und Prüfmeldungen; Access-Token, Refresh-Token oder Client-Secret
werden nicht ausgegeben.

Häufige Ergebnisse:

| Prüfung              | Bedeutung                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------ |
| `oauth-config`       | `oauth.clientId` plus `oauth.refreshToken` oder ein zwischengespeichertes Access-Token ist vorhanden. |
| `oauth-token`        | Das zwischengespeicherte Access-Token ist noch gültig, oder das Refresh-Token hat ein neues Access-Token erzeugt. |
| `meet-spaces-get`    | Die optionale Prüfung `--meeting` hat einen vorhandenen Meet-Space aufgelöst.              |
| `meet-spaces-create` | Die optionale Prüfung `--create-space` hat einen neuen Meet-Space erstellt.                |

Um auch die Aktivierung der Google-Meet-API und den Scope `spaces.create` nachzuweisen, führen Sie die
seiteneffektbehaftete Prüfung zur Erstellung aus:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` erstellt eine Wegwerf-Meet-URL. Verwenden Sie dies, wenn Sie bestätigen müssen,
dass im Google-Cloud-Projekt die Meet-API aktiviert ist und dass das autorisierte
Konto den Scope `meetings.space.created` besitzt.

Um Lesezugriff auf einen vorhandenen Meeting-Space nachzuweisen:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` und `resolve-space` weisen Lesezugriff auf einen vorhandenen
Space nach, auf den das autorisierte Google-Konto zugreifen kann. Ein `403` aus diesen Prüfungen
bedeutet normalerweise, dass die Google Meet REST API deaktiviert ist, dem bestätigten Refresh-Token
der erforderliche Scope fehlt oder das Google-Konto keinen Zugriff auf diesen Meet-
Space hat. Ein Refresh-Token-Fehler bedeutet, dass Sie `openclaw googlemeet auth login
--json` erneut ausführen und den neuen Block `oauth` speichern sollten.

Für den Browser-Fallback werden keine OAuth-Anmeldedaten benötigt. In diesem Modus stammt die Google-
Authentifizierung vom angemeldeten Chrome-Profil auf dem ausgewählten Node, nicht aus der
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

Führen Sie vor Medienarbeit Preflight aus:

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

Die Kalenderabfrage kann die Meeting-URL vor dem Lesen von Meet-Artefakten aus Google Calendar auflösen:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` durchsucht den heutigen Kalender `primary` nach einem Kalendereintrag mit einem
Google-Meet-Link. Verwenden Sie `--event <query>`, um nach passendem Ereignistext zu suchen, und
`--calendar <id>` für einen nicht primären Kalender. Die Kalenderabfrage erfordert einen frischen
OAuth-Login, der den readonly-Scope für Calendar-Ereignisse enthält.
`calendar-events` zeigt die passenden Meet-Ereignisse als Vorschau an und markiert das Ereignis, das
von `latest`, `artifacts`, `attendance` oder `export` ausgewählt wird.

Wenn Sie die ID des Konferenzdatensatzes bereits kennen, sprechen Sie ihn direkt an:

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

`artifacts` gibt Metadaten zu Konferenzdatensätzen sowie Metadaten zu Teilnehmern, Aufzeichnungen,
Transkripten, strukturierten Transkripteinträgen und Smart-Note-Ressourcen zurück, wenn
Google diese für das Meeting bereitstellt. Verwenden Sie `--no-transcript-entries`, um
die Abfrage von Einträgen bei großen Meetings zu überspringen. `attendance` erweitert Teilnehmer zu
Zeilen für Teilnehmersitzungen mit Zeiten für erstes/letztes Auftreten, Gesamtdauer der Sitzung,
Flags für verspätetes/frühes Verlassen und zusammengeführten doppelten Teilnehmerressourcen nach angemeldetem
Benutzer oder Anzeigename. Übergeben Sie `--no-merge-duplicates`, um rohe Teilnehmerressourcen getrennt zu halten,
`--late-after-minutes`, um die Erkennung von Verspätungen anzupassen, und
`--early-before-minutes`, um die Erkennung für frühes Verlassen anzupassen.

`export` schreibt einen Ordner mit `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` und `manifest.json`.
`manifest.json` protokolliert die gewählte Eingabe, Exportoptionen, Konferenzdatensätze,
Ausgabedateien, Zählwerte, Token-Quelle, Kalendereintrag, falls einer verwendet wurde, sowie
eventuelle Warnungen zu partieller Abfrage. Übergeben Sie `--zip`, um zusätzlich ein portables Archiv neben
dem Ordner zu schreiben. Übergeben Sie `--include-doc-bodies`, um verknüpften Text aus Transkripten und
Google Docs für Smart Notes über Google Drive `files.export` zu exportieren; dies erfordert einen
frischen OAuth-Login, der den readonly-Scope für Drive Meet enthält. Ohne
`--include-doc-bodies` enthalten Exporte nur Meet-Metadaten und strukturierte Transkripteinträge.
Wenn Google einen partiellen Artefaktfehler zurückgibt, etwa für eine Smart-Note-
Auflistung, einen Transkripteintrag oder einen Fehler beim Drive-Dokumenttext, behalten Zusammenfassung und
Manifest die Warnung bei, statt den gesamten Export fehlschlagen zu lassen.
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

Führen Sie den geschützten Live-Smoke gegen ein echtes aufbewahrtes Meeting aus:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Umgebung für Live-Smoke:

- `OPENCLAW_LIVE_TEST=1` aktiviert geschützte Live-Tests.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` zeigt auf eine aufbewahrte Meet-URL, einen Code oder
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` oder `GOOGLE_MEET_CLIENT_ID` stellt die OAuth-
  Client-ID bereit.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` oder `GOOGLE_MEET_REFRESH_TOKEN` stellt
  das Refresh-Token bereit.
- Optional: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` und
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` verwenden dieselben Fallback-Namen
  ohne das Präfix `OPENCLAW_`.

Der grundlegende Live-Smoke für Artefakte/Attendance benötigt
`https://www.googleapis.com/auth/meetings.space.readonly` und
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Die Kalender-
Abfrage benötigt `https://www.googleapis.com/auth/calendar.events.readonly`. Der Export von
Drive-Dokumenttexten benötigt
`https://www.googleapis.com/auth/drive.meet.readonly`.

Einen frischen Meet-Space erstellen:

```bash
openclaw googlemeet create
```

Der Befehl gibt die neue `meeting uri`, die Quelle und die Beitrittssitzung aus. Mit OAuth-
Anmeldedaten verwendet er die offizielle Google-Meet-API. Ohne OAuth-Anmeldedaten
verwendet er als Fallback das angemeldete Browser-Profil des gepinnten Chrome-Node. Agenten können
das Tool `google_meet` mit `action: "create"` verwenden, um in einem
Schritt zu erstellen und beizutreten. Für reine URL-Erstellung übergeben Sie `"join": false`.

Beispiel für JSON-Ausgabe aus dem Browser-Fallback:

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

Wenn der Browser-Fallback auf Google-Login oder einen Meet-Berechtigungsblocker stößt, bevor er
die URL erstellen kann, gibt die Gateway-Methode eine fehlgeschlagene Antwort zurück und das
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
Meet-Tabs zu öffnen, bis der Operator den Browserschritt abgeschlossen hat.

Beispiel für JSON-Ausgabe aus der API-Erstellung:

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

Das Erstellen eines Meet tritt standardmäßig bei. Der Transport `chrome` oder `chrome-node`
benötigt weiterhin ein bei Google angemeldetes Chrome-Profil, um über den Browser beizutreten. Wenn das
Profil abgemeldet ist, meldet OpenClaw `manualActionRequired: true` oder einen
Browser-Fallback-Fehler und fordert den Operator auf, den Google-Login abzuschließen, bevor
erneut versucht wird.

Setzen Sie `preview.enrollmentAcknowledged: true` erst, nachdem Sie bestätigt haben, dass Ihr Cloud-
Projekt, der OAuth-Principal und die Meeting-Teilnehmer im Google
Workspace Developer Preview Program für Meet-Medien-APIs registriert sind.

## Konfiguration

Der übliche Realtime-Pfad über Chrome benötigt nur das aktivierte Plugin, BlackHole, SoX
und einen Backend-Provider-Schlüssel für Realtime Voice. OpenAI ist der Standard; setzen Sie
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

Standards:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: optionale Node-ID/-Name/-IP für `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: Name, der auf dem Meet-Gastbildschirm im abgemeldeten Zustand verwendet wird
- `chrome.autoJoin: true`: bestmögliches Ausfüllen des Gastnamens und Klick auf Join Now
  über die OpenClaw-Browser-Automatisierung bei `chrome-node`
- `chrome.reuseExistingTab: true`: einen vorhandenen Meet-Tab aktivieren, statt
  Duplikate zu öffnen
- `chrome.waitForInCallMs: 20000`: warten, bis der Meet-Tab meldet, dass er im Anruf ist,
  bevor die Realtime-Einführung ausgelöst wird
- `chrome.audioInputCommand`: SoX-Befehl `rec`, der 8-kHz-G.711-mu-law-
  Audio auf stdout schreibt
- `chrome.audioOutputCommand`: SoX-Befehl `play`, der 8-kHz-G.711-mu-law-
  Audio von stdin liest
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: kurze gesprochene Antworten, mit
  `openclaw_agent_consult` für tiefere Antworten
- `realtime.introMessage`: kurze gesprochene Bereitschaftsprüfung, wenn die Realtime-Bridge
  verbindet; setzen Sie es auf `""`, um stumm beizutreten

Optionale Overrides:

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

`voiceCall.enabled` ist standardmäßig `true`; beim Transport über Twilio delegiert es den
eigentlichen PSTN-Anruf und DTMF an das Voice-Call-Plugin. Wenn `voice-call` nicht
aktiviert ist, kann Google Meet den Wählplan weiterhin validieren und aufzeichnen, aber es kann
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
Gateway-Host, sodass die Modell-Anmeldedaten dort bleiben.

Verwenden Sie `action: "status"`, um aktive Sitzungen aufzulisten oder eine Sitzungs-ID zu prüfen. Verwenden Sie
`action: "speak"` mit `sessionId` und `message`, damit der Realtime-Agent
sofort spricht. Verwenden Sie `action: "test_speech"`, um die Sitzung zu erstellen oder wiederzuverwenden,
einen bekannten Satz auszulösen und den Zustand `inCall` zurückzugeben, wenn der Chrome-Host ihn
melden kann. Verwenden Sie `action: "leave"`, um eine Sitzung als beendet zu markieren.

`status` enthält, wenn verfügbar, den Zustand von Chrome:

- `inCall`: Chrome scheint sich innerhalb des Meet-Anrufs zu befinden
- `micMuted`: bestmöglicher Zustand des Meet-Mikrofons
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: das
  Browser-Profil benötigt manuellen Login, Host-Zulassung, Berechtigungen oder
  Reparatur der Browsersteuerung, bevor Sprache funktionieren kann
- `providerConnected` / `realtimeReady`: Zustand der Realtime-Voice-Bridge
- `lastInputAt` / `lastOutputAt`: zuletzt von der Bridge empfangenes oder an sie gesendetes Audio

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Realtime-Agent-Consult

Der Realtime-Modus über Chrome ist für eine Live-Sprachschleife optimiert. Der Realtime-Voice-
Provider hört das Meeting-Audio und spricht über die konfigurierte Audio-Bridge.
Wenn das Realtime-Modell tieferes Reasoning, aktuelle Informationen oder normale
OpenClaw-Tools benötigt, kann es `openclaw_agent_consult` aufrufen.

Das Consult-Tool führt im Hintergrund den regulären OpenClaw-Agenten mit aktuellem
Kontext aus dem Meeting-Transkript aus und gibt eine kurze gesprochene Antwort an die Realtime-
Voice-Sitzung zurück. Das Sprachmodell kann diese Antwort dann zurück in das Meeting sprechen.
Es verwendet dasselbe gemeinsame Realtime-Consult-Tool wie Voice Call.

`realtime.toolPolicy` steuert den Consult-Lauf:

- `safe-read-only`: stellt das Consult-Tool bereit und begrenzt den regulären Agenten auf
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` und
  `memory_get`.
- `owner`: stellt das Consult-Tool bereit und lässt den regulären Agenten die normale
  Tool-Richtlinie des Agenten verwenden.
- `none`: stellt das Consult-Tool dem Realtime-Sprachmodell nicht bereit.

Der Sitzungsschlüssel für Consult ist pro Meet-Sitzung begrenzt, sodass Folgeaufrufe von Consult
während desselben Meetings früheren Consult-Kontext wiederverwenden können.

Um eine gesprochene Bereitschaftsprüfung zu erzwingen, nachdem Chrome vollständig dem Anruf beigetreten ist:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Für den vollständigen Join-and-Speak-Smoke:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Checkliste für Live-Tests

Verwenden Sie diese Reihenfolge, bevor Sie ein Meeting einem unbeaufsichtigten Agenten übergeben:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Erwarteter Zustand für Chrome-Node:

- `googlemeet setup` ist vollständig grün.
- `googlemeet setup` enthält `chrome-node-connected`, wenn `chrome-node` der
  Standard-Transport ist oder ein Node gepinnt ist.
- `nodes status` zeigt den ausgewählten Node als verbunden.
- Der ausgewählte Node gibt sowohl `googlemeet.chrome` als auch `browser.proxy` bekannt.
- Der Meet-Tab tritt dem Anruf bei und `test-speech` gibt Chrome-Gesundheitsdaten mit
  `inCall: true` zurück.

Für einen entfernten Chrome-Host wie eine Parallels-macOS-VM ist dies die kürzeste
sichere Prüfung nach dem Aktualisieren des Gateway oder der VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Damit ist nachgewiesen, dass das Gateway-Plugin geladen ist, der VM-Node mit dem
aktuellen Token verbunden ist und die Meet-Audio-Bridge verfügbar ist, bevor ein Agent
einen echten Meet-Tab öffnet.

Für einen Twilio-Smoke verwenden Sie ein Meeting, das Telefoneinwahldetails bereitstellt:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Erwarteter Twilio-Zustand:

- `googlemeet setup` enthält grüne Prüfungen `twilio-voice-call-plugin` und
  `twilio-voice-call-credentials`.
- `voicecall` ist nach dem Reload des Gateway im CLI verfügbar.
- Die zurückgegebene Sitzung hat `transport: "twilio"` und eine `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` legt den delegierten Voice-Call auf.

## Fehlerbehebung

### Der Agent kann das Google-Meet-Tool nicht sehen

Bestätigen Sie, dass das Plugin in der Gateway-Konfiguration aktiviert ist, und laden Sie das Gateway neu:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Wenn Sie gerade `plugins.entries.google-meet` bearbeitet haben, starten Sie das Gateway neu oder laden es neu.
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

Laden Sie dann den Node-Service neu und führen Sie erneut aus:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Der Browser öffnet sich, aber der Agent kann nicht beitreten

Führen Sie `googlemeet test-speech` aus und prüfen Sie die zurückgegebenen Chrome-Gesundheitsdaten. Wenn
`manualActionRequired: true` gemeldet wird, zeigen Sie dem Operator die `manualActionMessage`
an und beenden Sie weitere Wiederholungsversuche, bis die Browseraktion abgeschlossen ist.

Häufige manuelle Aktionen:

- Beim Chrome-Profil anmelden.
- Den Gast über das Meet-Host-Konto zulassen.
- Chrome Mikrofon-/Kameraberechtigungen erteilen, wenn die native Berechtigungs-
  Aufforderung von Chrome erscheint.
- Einen festhängenden Meet-Berechtigungsdialog schließen oder reparieren.

Melden Sie nicht „not signed in“, nur weil Meet „Do you want people to
hear you in the meeting?“ anzeigt. Das ist die Audio-Auswahl-Zwischenstufe von Meet; OpenClaw
klickt per Browser-Automatisierung auf **Use microphone**, wenn verfügbar, und wartet weiter
auf den echten Meeting-Zustand. Für browserbasierten Fallback nur zum Erstellen kann OpenClaw
auf **Continue without microphone** klicken, weil das Erstellen der URL den
Realtime-Audiopfad nicht benötigt.

### Das Erstellen eines Meetings schlägt fehl

`googlemeet create` verwendet zuerst den Endpunkt `spaces.create` der Google Meet API,
wenn OAuth-Anmeldedaten konfiguriert sind. Ohne OAuth-Anmeldedaten wird auf
den Browser des gepinnten Chrome-Node zurückgegriffen. Bestätigen Sie:

- Für API-Erstellung: `oauth.clientId` und `oauth.refreshToken` sind konfiguriert,
  oder passende Umgebungsvariablen `OPENCLAW_GOOGLE_MEET_*` sind vorhanden.
- Für API-Erstellung: Das Refresh-Token wurde erzeugt, nachdem die Unterstützung für `create`
  hinzugefügt wurde. Ältere Tokens können den Scope `meetings.space.created` vermissen; führen Sie
  `openclaw googlemeet auth login --json` erneut aus und aktualisieren Sie die Plugin-Konfiguration.
- Für Browser-Fallback: `defaultTransport: "chrome-node"` und
  `chromeNode.node` zeigen auf einen verbundenen Node mit `browser.proxy` und
  `googlemeet.chrome`.
- Für Browser-Fallback: Das OpenClaw-Chrome-Profil auf diesem Node ist bei
  Google angemeldet und kann `https://meet.google.com/new` öffnen.
- Für Browser-Fallback: Wiederholungsversuche verwenden einen vorhandenen `https://meet.google.com/new`-
  oder Google-Konto-Prompt-Tab wieder, bevor ein neuer Tab geöffnet wird. Wenn ein Agent in ein Timeout läuft,
  versuchen Sie den Tool-Aufruf erneut, statt manuell einen weiteren Meet-Tab zu öffnen.
- Für Browser-Fallback: Wenn das Tool `manualActionRequired: true` zurückgibt, verwenden Sie
  die zurückgegebenen Werte `browser.nodeId`, `browser.targetId`, `browserUrl` und
  `manualActionMessage`, um den Operator anzuleiten. Wiederholen Sie den Vorgang nicht in einer Schleife, bis
  diese Aktion abgeschlossen ist.
- Für Browser-Fallback: Wenn Meet „Do you want people to hear you in the
  meeting?“ anzeigt, lassen Sie den Tab offen. OpenClaw sollte auf **Use microphone** oder bei
  Fallback nur zum Erstellen auf **Continue without microphone** per Browser-
  Automatisierung klicken und weiter auf die erzeugte Meet-URL warten. Wenn das nicht gelingt, sollte
  der Fehler `meet-audio-choice-required` erwähnen, nicht `google-login-required`.

### Der Agent tritt bei, spricht aber nicht

Prüfen Sie den Realtime-Pfad:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Verwenden Sie `mode: "realtime"` für Zuhören/Sprechen. `mode: "transcribe"` startet
absichtlich nicht die Duplex-Realtime-Voice-Bridge.

Prüfen Sie außerdem:

- Auf dem Gateway-Host ist ein Realtime-Provider-Schlüssel verfügbar, z. B.
  `OPENAI_API_KEY` oder `GEMINI_API_KEY`.
- `BlackHole 2ch` ist auf dem Chrome-Host sichtbar.
- `rec` und `play` sind auf dem Chrome-Host vorhanden.
- Mikrofon und Lautsprecher von Meet sind über den von
  OpenClaw verwendeten virtuellen Audiopfad geroutet.

`googlemeet doctor [session-id]` gibt Sitzung, Node, In-Call-Zustand,
Grund für manuelle Aktion, Verbindung zum Realtime-Provider, `realtimeReady`, Audio-
Ein-/Ausgabeaktivität, letzte Audio-Zeitstempel, Byte-Zähler und Browser-URL aus.
Verwenden Sie `googlemeet status [session-id]`, wenn Sie das rohe JSON benötigen. Verwenden Sie
`googlemeet doctor --oauth`, wenn Sie das Refresh von Google-Meet-OAuth verifizieren müssen,
ohne Tokens offenzulegen; fügen Sie `--meeting` oder `--create-space` hinzu, wenn Sie auch einen
Nachweis über die Google Meet API benötigen.

Wenn ein Agent in ein Timeout lief und Sie bereits einen offenen Meet-Tab sehen, prüfen Sie diesen Tab,
ohne einen weiteren zu öffnen:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Die entsprechende Tool-Aktion ist `recover_current_tab`. Sie fokussiert und prüft einen
vorhandenen Meet-Tab auf dem konfigurierten Chrome-Node. Sie öffnet keinen neuen Tab und
erstellt keine neue Sitzung; sie meldet den aktuellen Blocker, etwa Login, Zulassung,
Berechtigungen oder Zustand der Audio-Auswahl. Der CLI-Befehl kommuniziert mit dem konfigurierten
Gateway, daher muss das Gateway laufen und der Chrome-Node verbunden sein.

### Twilio-Setup-Prüfungen schlagen fehl

`twilio-voice-call-plugin` schlägt fehl, wenn `voice-call` nicht erlaubt oder nicht aktiviert ist.
Fügen Sie es zu `plugins.allow` hinzu, aktivieren Sie `plugins.entries.voice-call` und laden Sie das
Gateway neu.

`twilio-voice-call-credentials` schlägt fehl, wenn im Twilio-Backend Account-
SID, Auth-Token oder Anrufernummer fehlen. Setzen Sie diese auf dem Gateway-Host:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Starten Sie dann das Gateway neu oder laden Sie es neu und führen Sie aus:

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` ist standardmäßig nur eine Bereitschaftsprüfung. Um eine bestimmte Nummer testweise trocken auszuführen:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Fügen Sie `--yes` nur hinzu, wenn Sie absichtlich einen echten ausgehenden Benachrichtigungsanruf
platzieren möchten:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Der Twilio-Anruf startet, tritt dem Meeting aber nie bei

Bestätigen Sie, dass das Meet-Ereignis Telefoneinwahldetails bereitstellt. Übergeben Sie die genaue Einwahl-
Nummer und PIN oder eine benutzerdefinierte DTMF-Sequenz:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Verwenden Sie führende `w` oder Kommata in `--dtmf-sequence`, wenn der Provider eine Pause
vor der Eingabe der PIN benötigt.

## Hinweise

Die offizielle Medien-API von Google Meet ist auf Empfang ausgerichtet, daher erfordert das Sprechen in einen Meet-
Anruf weiterhin einen Teilnehmerpfad. Dieses Plugin hält diese Grenze sichtbar:
Chrome übernimmt Browser-Teilnahme und lokales Audio-Routing; Twilio übernimmt
Telefon-Einwahlteilnahme.

Der Realtime-Modus über Chrome benötigt entweder:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw besitzt die
  Realtime-Modell-Bridge und leitet 8-kHz-G.711-mu-law-Audio zwischen diesen
  Befehlen und dem ausgewählten Realtime-Voice-Provider weiter.
- `chrome.audioBridgeCommand`: Ein externer Bridge-Befehl besitzt den vollständigen lokalen
  Audiopfad und muss nach dem Starten oder Validieren seines Daemons beendet werden.

Für sauberes Duplex-Audio leiten Sie Meet-Ausgabe und Meet-Mikrofon über getrennte
virtuelle Geräte oder eine virtuelle Gerätegruppe im Stil von Loopback. Ein einzelnes gemeinsam genutztes
BlackHole-Gerät kann andere Teilnehmer zurück in den Anruf echoen.

`googlemeet speak` löst die aktive Realtime-Audio-Bridge für eine Chrome-
Sitzung aus. `googlemeet leave` stoppt diese Bridge. Für Twilio-Sitzungen, die über das Voice-Call-
Plugin delegiert werden, legt `leave` auch den zugrunde liegenden Voice-Call auf.

## Verwandt

- [Voice-Call-Plugin](/de/plugins/voice-call)
- [Talk-Modus](/de/nodes/talk)
- [Plugins erstellen](/de/plugins/building-plugins)
