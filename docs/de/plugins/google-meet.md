---
read_when:
    - Du möchtest, dass ein OpenClaw-Agent einem Google-Meet-Anruf beitritt
    - Du konfigurierst Chrome, Chrome-Node oder Twilio als Google-Meet-Transport
summary: 'Google-Meet-Plugin: explizite Meet-URLs über Chrome oder Twilio mit Realtime-Voice-Standards beitreten'
title: Google-Meet-Plugin
x-i18n:
    generated_at: "2026-04-24T08:58:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d430a1f2d6ee7fc1d997ef388a2e0d2915a6475480343e7060edac799dfc027
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet (Plugin)

Google-Meet-Teilnehmerunterstützung für OpenClaw.

Das Plugin ist bewusst explizit ausgelegt:

- Es tritt nur einer expliziten `https://meet.google.com/...`-URL bei.
- `realtime` voice ist der Standardmodus.
- Realtime voice kann bei Bedarf für tiefergehendes
  Reasoning oder Tools in den vollständigen OpenClaw-Agent zurückrufen.
- Die Authentifizierung beginnt mit persönlichem Google OAuth oder einem bereits angemeldeten Chrome-Profil.
- Es gibt keine automatische Einwilligungsankündigung.
- Das standardmäßige Chrome-Audio-Backend ist `BlackHole 2ch`.
- Chrome kann lokal oder auf einem gekoppelten Node-Host laufen.
- Twilio akzeptiert eine Einwahlnummer plus optionale PIN oder DTMF-Sequenz.
- Der CLI-Befehl lautet `googlemeet`; `meet` ist für allgemeinere Agent-
  Telekonferenz-Workflows reserviert.

## Schnellstart

Installiere die lokalen Audio-Abhängigkeiten und stelle sicher, dass der Realtime-Provider
OpenAI verwenden kann:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

`blackhole-2ch` installiert das virtuelle Audiogerät `BlackHole 2ch`. Der
Installer von Homebrew erfordert einen Neustart, bevor macOS das Gerät bereitstellt:

```bash
sudo reboot
```

Prüfe nach dem Neustart beide Komponenten:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Aktiviere das Plugin:

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

Einem Meeting beitreten:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Oder einen Agent über das Tool `google_meet` beitreten lassen:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij"
}
```

Chrome tritt als das angemeldete Chrome-Profil bei. Wähle in Meet `BlackHole 2ch` für
den Mikrofon-/Lautsprecherpfad, den OpenClaw verwendet. Für sauberes Duplex-Audio verwende
separate virtuelle Geräte oder ein Routing im Loopback-Stil; ein einzelnes BlackHole-Gerät ist
für einen ersten Smoke-Test ausreichend, kann aber Echo erzeugen.

### Lokales Gateway + Parallels Chrome

Du benötigst **kein** vollständiges OpenClaw-Gateway oder keinen Model-API-Key innerhalb einer macOS-VM,
nur damit Chrome in der VM läuft. Führe Gateway und Agent lokal aus und betreibe dann einen
Node-Host in der VM. Aktiviere das gebündelte Plugin einmal in der VM, damit der Node
den Chrome-Befehl ankündigt:

Was wo läuft:

- Gateway-Host: OpenClaw Gateway, Agent-Workspace, Model-/API-Keys, Realtime-
  Provider und die Google-Meet-Plugin-Konfiguration.
- Parallels-macOS-VM: OpenClaw CLI/Node-Host, Google Chrome, SoX, BlackHole 2ch
  und ein bei Google angemeldetes Chrome-Profil.
- In der VM nicht erforderlich: Gateway-Dienst, Agent-Konfiguration, OpenAI/GPT-Key oder Model-
  Provider-Setup.

Installiere die VM-Abhängigkeiten:

```bash
brew install blackhole-2ch sox
```

Starte die VM nach der Installation von BlackHole neu, damit macOS `BlackHole 2ch` bereitstellt:

```bash
sudo reboot
```

Prüfe nach dem Neustart, ob die VM das Audiogerät und die SoX-Befehle sehen kann:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Installiere oder aktualisiere OpenClaw in der VM und aktiviere dann dort das gebündelte Plugin:

```bash
openclaw plugins enable google-meet
```

Starte den Node-Host in der VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Wenn `<gateway-host>` eine LAN-IP ist und du TLS nicht verwendest, verweigert der Node den
Klartext-WebSocket, sofern du nicht ausdrücklich für dieses vertrauenswürdige private Netzwerk zustimmst:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Verwende dieselbe Umgebungsvariable, wenn du den Node als LaunchAgent installierst:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` ist Prozessumgebung, keine
`openclaw.json`-Einstellung. `openclaw node install` speichert sie in der LaunchAgent-
Umgebung, wenn sie beim Installationsbefehl vorhanden ist.

Genehmige den Node vom Gateway-Host aus:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Bestätige, dass das Gateway den Node sieht und dass er `googlemeet.chrome` ankündigt:

```bash
openclaw nodes status
```

Leite Meet auf dem Gateway-Host über diesen Node:

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

Nun normal vom Gateway-Host aus beitreten:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

oder den Agent anweisen, das Tool `google_meet` mit `transport: "chrome-node"` zu verwenden.

Wenn `chromeNode.node` ausgelassen wird, wählt OpenClaw nur dann automatisch aus, wenn genau ein
verbundener Node `googlemeet.chrome` ankündigt. Wenn mehrere geeignete Nodes
verbunden sind, setze `chromeNode.node` auf die Node-ID, den Anzeigenamen oder die Remote-IP.

Häufige Prüfungen bei Fehlern:

- `No connected Google Meet-capable node`: Starte `openclaw node run` in der VM,
  genehmige das Pairing und stelle sicher, dass `openclaw plugins enable google-meet` in
  der VM ausgeführt wurde. Bestätige außerdem, dass der Gateway-Host den Node-Befehl mit
  `gateway.nodes.allowCommands: ["googlemeet.chrome"]` erlaubt.
- `BlackHole 2ch audio device not found on the node`: Installiere `blackhole-2ch`
  in der VM und starte die VM neu.
- Chrome öffnet sich, kann aber nicht beitreten: Melde dich in Chrome innerhalb der VM an und bestätige, dass dieses
  Profil der Meet-URL manuell beitreten kann.
- Kein Audio: Route in Meet Mikrofon/Lautsprecher über den virtuellen Audiogerätepfad,
  den OpenClaw verwendet; verwende separate virtuelle Geräte oder Routing im Loopback-Stil
  für sauberes Duplex-Audio.

## Hinweise zur Installation

Der standardmäßige Chrome-Realtime-Pfad verwendet zwei externe Tools:

- `sox`: Kommandozeilen-Audio-Tool. Das Plugin verwendet seine Befehle `rec` und `play`
  für die standardmäßige 8-kHz-G.711-mu-law-Audiobrücke.
- `blackhole-2ch`: virtueller Audiotreiber für macOS. Er erstellt das Audiogerät `BlackHole 2ch`,
  über das Chrome/Meet routen kann.

OpenClaw bündelt oder verteilt keines der beiden Pakete weiter. Die Dokumentation fordert Benutzer auf,
sie als Host-Abhängigkeiten über Homebrew zu installieren. SoX ist unter
`LGPL-2.0-only AND GPL-2.0-only` lizenziert; BlackHole ist GPL-3.0. Wenn du einen
Installer oder eine Appliance baust, die BlackHole mit OpenClaw bündelt, prüfe die
upstream-Lizenzbedingungen von BlackHole oder hole eine separate Lizenz von Existential Audio ein.

## Transports

### Chrome

Der Chrome-Transport öffnet die Meet-URL in Google Chrome und tritt als das angemeldete
Chrome-Profil bei. Unter macOS prüft das Plugin vor dem Start auf `BlackHole 2ch`.
Falls konfiguriert, führt es außerdem einen Health-Befehl für die Audiobrücke und einen Startbefehl
aus, bevor Chrome geöffnet wird. Verwende `chrome`, wenn Chrome/Audio auf dem Gateway-Host laufen;
verwende `chrome-node`, wenn Chrome/Audio auf einem gekoppelten Node laufen, etwa in einer Parallels-
macOS-VM.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Leite Mikrofon- und Lautsprecheraudio von Chrome über die lokale OpenClaw-Audiobrücke.
Wenn `BlackHole 2ch` nicht installiert ist, schlägt der Beitritt mit einem Setup-Fehler
fehl, statt stillschweigend ohne Audiopfad beizutreten.

### Twilio

Der Twilio-Transport ist ein strikter Wählplan, der an das Voice-Call-Plugin delegiert wird. Er
parst keine Meet-Seiten nach Telefonnummern.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Verwende `--dtmf-sequence`, wenn das Meeting eine benutzerdefinierte Sequenz benötigt:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth und Preflight

Der Zugriff auf die Google-Meet-Media-API verwendet zunächst einen persönlichen OAuth-Client. Konfiguriere
`oauth.clientId` und optional `oauth.clientSecret`, und führe dann Folgendes aus:

```bash
openclaw googlemeet auth login --json
```

Der Befehl gibt einen `oauth`-Konfigurationsblock mit einem Refresh-Token aus. Er verwendet PKCE,
einen localhost-Callback auf `http://localhost:8085/oauth2callback` und einen manuellen
Copy/Paste-Ablauf mit `--manual`.

Diese Umgebungsvariablen werden als Fallback akzeptiert:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` oder `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` oder `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` oder `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` oder `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` oder
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` oder `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` oder `GOOGLE_MEET_PREVIEW_ACK`

Löse eine Meet-URL, einen Code oder `spaces/{id}` über `spaces.get` auf:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Führe Preflight vor der Medienarbeit aus:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Setze `preview.enrollmentAcknowledged: true` erst, nachdem du bestätigt hast, dass dein Cloud-
Projekt, OAuth-Prinzipal und Meeting-Teilnehmer im Google Workspace Developer Preview Program
für Meet-Media-APIs registriert sind.

## Konfiguration

Der gängige Chrome-Realtime-Pfad benötigt nur das aktivierte Plugin, BlackHole, SoX
und einen OpenAI-Key:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

Setze die Plugin-Konfiguration unter `plugins.entries.google-meet.config`:

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
- `chrome.audioInputCommand`: SoX-`rec`-Befehl, der 8-kHz-G.711-mu-law-
  Audio an stdout schreibt
- `chrome.audioOutputCommand`: SoX-`play`-Befehl, der 8-kHz-G.711-mu-law-
  Audio von stdin liest
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: kurze gesprochene Antworten, mit
  `openclaw_agent_consult` für tiefergehende Antworten
- `realtime.introMessage`: kurze gesprochene Bereitschaftsprüfung, wenn die Realtime-Brücke
  verbunden wird; setze sie auf `""`, um lautlos beizutreten

Optionale Overrides:

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
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
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

Verwende `transport: "chrome"`, wenn Chrome auf dem Gateway-Host läuft. Verwende
`transport: "chrome-node"`, wenn Chrome auf einem gekoppelten Node läuft, etwa in einer Parallels-
VM. In beiden Fällen laufen das Realtime-Modell und `openclaw_agent_consult` auf dem
Gateway-Host, sodass die Model-Credentials dort bleiben.

Verwende `action: "status"`, um aktive Sitzungen aufzulisten oder eine Sitzungs-ID zu prüfen. Verwende
`action: "speak"` mit `sessionId` und `message`, damit der Realtime-Agent
sofort spricht. Verwende `action: "leave"`, um eine Sitzung als beendet zu markieren.

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Realtime-Agent-Consult

Der Chrome-Realtime-Modus ist für eine Live-Sprachschleife optimiert. Der Realtime-Voice-
Provider hört das Meeting-Audio und spricht über die konfigurierte Audiobrücke.
Wenn das Realtime-Modell tiefergehendes Reasoning, aktuelle Informationen oder normale
OpenClaw-Tools benötigt, kann es `openclaw_agent_consult` aufrufen.

Das Consult-Tool führt im Hintergrund den regulären OpenClaw-Agent mit aktuellem
Meeting-Transkriptkontext aus und gibt eine knappe gesprochene Antwort an die Realtime-
Voice-Sitzung zurück. Das Voice-Modell kann diese Antwort dann in das Meeting zurücksprechen.

`realtime.toolPolicy` steuert den Consult-Lauf:

- `safe-read-only`: das Consult-Tool verfügbar machen und den regulären Agent auf
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` und
  `memory_get` beschränken.
- `owner`: das Consult-Tool verfügbar machen und dem regulären Agent die normale
  Tool-Richtlinie des Agent erlauben.
- `none`: das Consult-Tool dem Realtime-Voice-Modell nicht verfügbar machen.

Der Consult-Sitzungsschlüssel ist pro Meet-Sitzung begrenzt, sodass nachfolgende Consult-Aufrufe
während desselben Meetings vorherigen Consult-Kontext wiederverwenden können.

Um eine gesprochene Bereitschaftsprüfung zu erzwingen, nachdem Chrome dem Anruf vollständig beigetreten ist:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

## Hinweise

Die offizielle Media-API von Google Meet ist auf Empfang ausgerichtet, daher benötigt das Sprechen in einen Meet-
Anruf weiterhin einen Teilnehmerpfad. Dieses Plugin macht diese Grenze sichtbar:
Chrome übernimmt die Browser-Teilnahme und das lokale Audio-Routing; Twilio übernimmt
die Teilnahme per Telefoneinwahl.

Der Chrome-Realtime-Modus benötigt entweder:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw besitzt die
  Realtime-Model-Brücke und leitet 8-kHz-G.711-mu-law-Audio zwischen diesen
  Befehlen und dem ausgewählten Realtime-Voice-Provider weiter.
- `chrome.audioBridgeCommand`: ein externer Brückenbefehl übernimmt den gesamten lokalen
  Audiopfad und muss beendet werden, nachdem sein Daemon gestartet oder validiert wurde.

Für sauberes Duplex-Audio leite Meet-Ausgabe und Meet-Mikrofon über separate
virtuelle Geräte oder ein virtuelles Gerätegraphrouting im Loopback-Stil. Ein einzelnes gemeinsam genutztes
BlackHole-Gerät kann andere Teilnehmer zurück in den Anruf echoen.

`googlemeet speak` löst die aktive Realtime-Audiobrücke für eine Chrome-
Sitzung aus. `googlemeet leave` stoppt diese Brücke. Bei Twilio-Sitzungen, die über das Voice-Call-Plugin
delegiert werden, legt `leave` auch den zugrunde liegenden Sprachanruf auf.

## Verwandt

- [Voice-Call-Plugin](/de/plugins/voice-call)
- [Talk-Modus](/de/nodes/talk)
- [Plugins erstellen](/de/plugins/building-plugins)
