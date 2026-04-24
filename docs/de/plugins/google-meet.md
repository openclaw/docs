---
read_when:
    - Sie möchten, dass ein OpenClaw-Agent einem Google Meet-Anruf beitritt
    - Sie konfigurieren Chrome, Chrome-Node oder Twilio als Google Meet-Transport.
summary: 'Google Meet Plugin: explizite Meet-URLs über Chrome oder Twilio mit standardmäßigen Echtzeit-Sprachvorgaben beitreten'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-04-24T09:51:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: f1673ac4adc9cf163194a340dd6e451d0e4d28bb62adeb126898298e62106d43
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet (Plugin)

Google Meet-Teilnehmerunterstützung für OpenClaw.

Das Plugin ist absichtlich explizit gestaltet:

- Es tritt nur einer expliziten `https://meet.google.com/...`-URL bei.
- `realtime`-Sprachausgabe ist der Standardmodus.
- Realtime-Sprachausgabe kann bei Bedarf an den vollständigen OpenClaw-Agenten zurückdelegieren, wenn tiefergehendes Reasoning oder Tools erforderlich sind.
- Die Authentifizierung beginnt als persönliches Google OAuth oder mit einem bereits angemeldeten Chrome-Profil.
- Es gibt keine automatische Zustimmungshinweisansage.
- Das standardmäßige Chrome-Audio-Backend ist `BlackHole 2ch`.
- Chrome kann lokal oder auf einem gekoppelten Node-Host laufen.
- Twilio akzeptiert eine Einwahlnummer plus optionale PIN oder DTMF-Sequenz.
- Der CLI-Befehl ist `googlemeet`; `meet` ist für allgemeinere Telekonferenz-Workflows von Agenten reserviert.

## Schnellstart

Installieren Sie die lokalen Audioabhängigkeiten und konfigurieren Sie einen Backend-Anbieter für Realtime-Sprachausgabe. OpenAI ist der Standard; Google Gemini Live funktioniert ebenfalls mit `realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# oder
export GEMINI_API_KEY=...
```

`blackhole-2ch` installiert das virtuelle Audiogerät `BlackHole 2ch`. Das Installationsprogramm von Homebrew erfordert einen Neustart, bevor macOS das Gerät bereitstellt:

```bash
sudo reboot
```

Überprüfen Sie nach dem Neustart beide Komponenten:

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

Überprüfen Sie die Einrichtung:

```bash
openclaw googlemeet setup
```

Einem Meeting beitreten:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Oder einen Agenten über das Tool `google_meet` beitreten lassen:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij"
}
```

Chrome tritt als das angemeldete Chrome-Profil bei. Wählen Sie in Meet `BlackHole 2ch` für den Mikrofon-/Lautsprecherpfad, den OpenClaw verwendet. Für sauberes Duplex-Audio verwenden Sie separate virtuelle Geräte oder einen Loopback-ähnlichen Graphen; ein einzelnes BlackHole-Gerät reicht für einen ersten Smoke-Test aus, kann aber Echo verursachen.

### Lokales Gateway + Parallels Chrome

Sie benötigen **kein** vollständiges OpenClaw Gateway oder keinen Modell-API-Schlüssel innerhalb einer macOS-VM, nur damit die VM Chrome hostet. Führen Sie das Gateway und den Agenten lokal aus und starten Sie dann einen Node-Host in der VM. Aktivieren Sie das gebündelte Plugin einmal in der VM, damit der Node den Chrome-Befehl bekanntgibt:

Was wo läuft:

- Gateway-Host: OpenClaw Gateway, Agent-Workspace, Modell-/API-Schlüssel, Realtime-Anbieter und die Google Meet-Plugin-Konfiguration.
- Parallels macOS-VM: OpenClaw CLI/Node-Host, Google Chrome, SoX, BlackHole 2ch und ein bei Google angemeldetes Chrome-Profil.
- In der VM nicht erforderlich: Gateway-Dienst, Agent-Konfiguration, OpenAI-/GPT-Schlüssel oder Einrichtung eines Modellanbieters.

Installieren Sie die Abhängigkeiten in der VM:

```bash
brew install blackhole-2ch sox
```

Starten Sie die VM nach der Installation von BlackHole neu, damit macOS `BlackHole 2ch` bereitstellt:

```bash
sudo reboot
```

Überprüfen Sie nach dem Neustart, ob die VM das Audiogerät und die SoX-Befehle sehen kann:

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

Wenn `<gateway-host>` eine LAN-IP ist und Sie kein TLS verwenden, verweigert der Node das unverschlüsselte WebSocket, es sei denn, Sie erlauben dies ausdrücklich für dieses vertrauenswürdige private Netzwerk:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ist eine Prozessumgebung und keine `openclaw.json`-Einstellung. `openclaw node install` speichert sie in der LaunchAgent-Umgebung, wenn sie beim Installationsbefehl vorhanden ist.

Genehmigen Sie den Node vom Gateway-Host aus:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Bestätigen Sie, dass das Gateway den Node sieht und dass er `googlemeet.chrome` bekanntgibt:

```bash
openclaw nodes status
```

Leiten Sie Meet auf dem Gateway-Host über diesen Node:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
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

oder fordern Sie den Agenten auf, das Tool `google_meet` mit `transport: "chrome-node"` zu verwenden.

Wenn `chromeNode.node` ausgelassen wird, wählt OpenClaw nur dann automatisch aus, wenn genau ein verbundener Node `googlemeet.chrome` bekanntgibt. Wenn mehrere geeignete Nodes verbunden sind, setzen Sie `chromeNode.node` auf die Node-ID, den Anzeigenamen oder die entfernte IP.

Häufige Fehlerprüfungen:

- `No connected Google Meet-capable node`: Starten Sie `openclaw node run` in der VM, genehmigen Sie das Pairing und stellen Sie sicher, dass `openclaw plugins enable google-meet` in der VM ausgeführt wurde. Bestätigen Sie außerdem, dass der Gateway-Host den Node-Befehl mit `gateway.nodes.allowCommands: ["googlemeet.chrome"]` erlaubt.
- `BlackHole 2ch audio device not found on the node`: Installieren Sie `blackhole-2ch` in der VM und starten Sie die VM neu.
- Chrome wird geöffnet, kann aber nicht beitreten: Melden Sie sich in der VM in Chrome an und bestätigen Sie, dass dieses Profil der Meet-URL manuell beitreten kann.
- Kein Audio: Leiten Sie in Meet Mikrofon und Lautsprecher über den virtuellen Audiogerätepfad, den OpenClaw verwendet; verwenden Sie separate virtuelle Geräte oder Loopback-ähnliches Routing für sauberes Duplex-Audio.

## Installationshinweise

Der standardmäßige Chrome-Realtime-Pfad verwendet zwei externe Tools:

- `sox`: Audio-Dienstprogramm für die Befehlszeile. Das Plugin verwendet seine Befehle `rec` und `play` für die standardmäßige 8-kHz-G.711-μ-law-Audiobrücke.
- `blackhole-2ch`: virtueller macOS-Audiotreiber. Er erstellt das Audiogerät `BlackHole 2ch`, über das Chrome/Meet geroutet werden kann.

OpenClaw bündelt oder vertreibt keines der beiden Pakete. Die Dokumentation weist Benutzer an, sie als Host-Abhängigkeiten über Homebrew zu installieren. SoX ist unter `LGPL-2.0-only AND GPL-2.0-only` lizenziert; BlackHole unter GPL-3.0. Wenn Sie ein Installationsprogramm oder eine Appliance erstellen, die BlackHole zusammen mit OpenClaw bündelt, prüfen Sie die vorgelagerten Lizenzbedingungen von BlackHole oder erwerben Sie eine separate Lizenz von Existential Audio.

## Transporte

### Chrome

Der Chrome-Transport öffnet die Meet-URL in Google Chrome und tritt als das angemeldete Chrome-Profil bei. Unter macOS prüft das Plugin vor dem Start auf `BlackHole 2ch`. Falls konfiguriert, führt es außerdem einen Health-Befehl für die Audiobrücke und einen Startbefehl aus, bevor Chrome geöffnet wird. Verwenden Sie `chrome`, wenn Chrome/Audiopfad auf dem Gateway-Host liegen; verwenden Sie `chrome-node`, wenn Chrome/Audiopfad auf einem gekoppelten Node wie einer Parallels-macOS-VM liegen.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Leiten Sie Mikrofon- und Lautsprecheraudio von Chrome über die lokale OpenClaw-Audiobrücke. Wenn `BlackHole 2ch` nicht installiert ist, schlägt der Beitritt mit einem Einrichtungsfehler fehl, anstatt stillschweigend ohne Audiopfad beizutreten.

### Twilio

Der Twilio-Transport ist ein strikter Wählplan, der an das Voice Call-Plugin delegiert wird. Er analysiert keine Meet-Seiten, um Telefonnummern zu ermitteln.

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

Der Zugriff auf die Google Meet Media API verwendet zunächst einen persönlichen OAuth-Client. Konfigurieren Sie `oauth.clientId` und optional `oauth.clientSecret`, und führen Sie dann Folgendes aus:

```bash
openclaw googlemeet auth login --json
```

Der Befehl gibt einen `oauth`-Konfigurationsblock mit einem Refresh-Token aus. Er verwendet PKCE, einen localhost-Callback auf `http://localhost:8085/oauth2callback` und mit `--manual` einen manuellen Kopieren-/Einfügen-Ablauf.

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

Führen Sie die Vorabprüfung vor Medienarbeit aus:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Setzen Sie `preview.enrollmentAcknowledged: true` erst, nachdem Sie bestätigt haben, dass Ihr Cloud-Projekt, Ihr OAuth-Principal und die Meeting-Teilnehmer im Google Workspace Developer Preview Program für Meet-Medien-APIs registriert sind.

## Konfiguration

Der übliche Chrome-Realtime-Pfad benötigt nur das aktivierte Plugin, BlackHole, SoX und einen API-Schlüssel für einen Backend-Anbieter für Realtime-Sprachausgabe. OpenAI ist der Standard; setzen Sie `realtime.provider: "google"`, um Google Gemini Live zu verwenden:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# oder
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
- `chromeNode.node`: optionale Node-ID/-Name/-IP für `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.audioInputCommand`: SoX-Befehl `rec`, der 8-kHz-G.711-μ-law-Audio in stdout schreibt
- `chrome.audioOutputCommand`: SoX-Befehl `play`, der 8-kHz-G.711-μ-law-Audio aus stdin liest
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: kurze gesprochene Antworten, mit
  `openclaw_agent_consult` für tiefergehende Antworten
- `realtime.introMessage`: kurze gesprochene Bereitschaftsprüfung, wenn die Realtime-Brücke verbunden wird; setzen Sie es auf `""`, um still beizutreten

Optionale Überschreibungen:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
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

Verwenden Sie `transport: "chrome"`, wenn Chrome auf dem Gateway-Host läuft. Verwenden Sie `transport: "chrome-node"`, wenn Chrome auf einem gekoppelten Node wie einer Parallels-VM läuft. In beiden Fällen laufen das Realtime-Modell und `openclaw_agent_consult` auf dem Gateway-Host, sodass die Modellzugangsdaten dort verbleiben.

Verwenden Sie `action: "status"`, um aktive Sitzungen aufzulisten oder eine Sitzungs-ID zu prüfen. Verwenden Sie `action: "speak"` mit `sessionId` und `message`, damit der Realtime-Agent sofort spricht. Verwenden Sie `action: "leave"`, um eine Sitzung als beendet zu markieren.

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Realtime-Agentenberatung

Der Chrome-Realtime-Modus ist für eine Live-Sprachschleife optimiert. Der Anbieter für Realtime-Sprachausgabe hört das Meeting-Audio und spricht über die konfigurierte Audiobrücke. Wenn das Realtime-Modell tiefergehendes Reasoning, aktuelle Informationen oder normale OpenClaw-Tools benötigt, kann es `openclaw_agent_consult` aufrufen.

Das Consult-Tool führt im Hintergrund den regulären OpenClaw-Agenten mit aktuellem Meeting-Transkriptkontext aus und gibt eine knappe gesprochene Antwort an die Realtime-Sprachsitzung zurück. Das Sprachmodell kann diese Antwort dann wieder in das Meeting sprechen.

`realtime.toolPolicy` steuert den Consult-Lauf:

- `safe-read-only`: das Consult-Tool verfügbar machen und den regulären Agenten auf `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` und `memory_get` beschränken.
- `owner`: das Consult-Tool verfügbar machen und dem regulären Agenten die normale Agenten-Toolrichtlinie erlauben.
- `none`: das Consult-Tool dem Realtime-Sprachmodell nicht verfügbar machen.

Der Consult-Sitzungsschlüssel ist pro Meet-Sitzung begrenzt, sodass nachfolgende Consult-Aufrufe während desselben Meetings den bisherigen Consult-Kontext wiederverwenden können.

Um eine gesprochene Bereitschaftsprüfung zu erzwingen, nachdem Chrome dem Anruf vollständig beigetreten ist:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

## Hinweise

Die offizielle Media API von Google Meet ist auf Empfang ausgerichtet, daher ist für das Sprechen in einen Meet-Anruf weiterhin ein Teilnehmerpfad erforderlich. Dieses Plugin hält diese Grenze sichtbar: Chrome übernimmt die Browser-Teilnahme und das lokale Audio-Routing; Twilio übernimmt die Teilnahme per Telefoneinwahl.

Der Chrome-Realtime-Modus benötigt entweder:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw verwaltet die Realtime-Modellbrücke und leitet 8-kHz-G.711-μ-law-Audio zwischen diesen Befehlen und dem ausgewählten Anbieter für Realtime-Sprachausgabe weiter.
- `chrome.audioBridgeCommand`: Ein externer Brückenbefehl verwaltet den gesamten lokalen Audiopfad und muss beendet werden, nachdem sein Daemon gestartet oder validiert wurde.

Für sauberes Duplex-Audio leiten Sie Meet-Ausgabe und Meet-Mikrofon über separate virtuelle Geräte oder einen Loopback-ähnlichen Graphen für virtuelle Geräte. Ein einzelnes gemeinsam genutztes BlackHole-Gerät kann andere Teilnehmer zurück in den Anruf echoen.

`googlemeet speak` löst die aktive Realtime-Audiobrücke für eine Chrome-Sitzung aus. `googlemeet leave` stoppt diese Brücke. Bei Twilio-Sitzungen, die über das Voice Call-Plugin delegiert werden, legt `leave` auch den zugrunde liegenden Sprachanruf auf.

## Verwandt

- [Voice Call Plugin](/de/plugins/voice-call)
- [Sprechmodus](/de/nodes/talk)
- [Plugins erstellen](/de/plugins/building-plugins)
