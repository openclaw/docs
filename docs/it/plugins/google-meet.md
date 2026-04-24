---
read_when:
    - Vuoi che un agente OpenClaw partecipi a una chiamata Google Meet
    - Stai configurando Chrome, un Node Chrome o Twilio come trasporto Google Meet
summary: 'Plugin Google Meet: partecipazione a URL Meet espliciti tramite Chrome o Twilio con valori predefiniti vocali realtime'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-24T08:51:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0bf06b7ab585bf2dc9dbf6d890e1954e89e4deea148380e350d2d7f4d954f5e
    source_path: plugins/google-meet.md
    workflow: 15
---

# Plugin Google Meet

Supporto partecipante Google Meet per OpenClaw.

Il Plugin è volutamente esplicito:

- Si unisce solo a un URL esplicito `https://meet.google.com/...`.
- La voce `realtime` è la modalità predefinita.
- La voce realtime può richiamare l'agente OpenClaw completo quando servono
  ragionamento più profondo o strumenti.
- L'auth parte come Google OAuth personale o come profilo Chrome già autenticato.
- Non c'è alcun annuncio automatico di consenso.
- Il backend audio Chrome predefinito è `BlackHole 2ch`.
- Chrome può essere eseguito localmente o su un host Node associato.
- Twilio accetta un numero di dial-in più un PIN facoltativo o una sequenza DTMF.
- Il comando CLI è `googlemeet`; `meet` è riservato a flussi di lavoro più ampi
  di teleconferenza dell'agente.

## Avvio rapido

Installa le dipendenze audio locali e assicurati che il provider realtime possa usare
OpenAI:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

`blackhole-2ch` installa il dispositivo audio virtuale `BlackHole 2ch`. L'installer
Homebrew richiede un riavvio prima che macOS esponga il dispositivo:

```bash
sudo reboot
```

Dopo il riavvio, verifica entrambi i componenti:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Abilita il Plugin:

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

Controlla la configurazione:

```bash
openclaw googlemeet setup
```

Partecipa a una riunione:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Oppure lascia che un agente partecipi tramite lo strumento `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij"
}
```

Chrome si unisce come profilo Chrome autenticato. In Meet, scegli `BlackHole 2ch` per
il percorso microfono/altoparlante usato da OpenClaw. Per un audio duplex pulito, usa
dispositivi virtuali separati o un grafo in stile Loopback; un singolo dispositivo BlackHole è
sufficiente per un primo smoke test ma può produrre eco.

### Gateway locale + Chrome su Parallels

Non hai bisogno di un Gateway OpenClaw completo o di una chiave API del modello dentro una VM macOS
solo per far sì che la VM possieda Chrome. Esegui il Gateway e l'agente localmente, poi esegui un
host Node nella VM. Abilita il Plugin incluso nella VM una volta così il Node
pubblicizza il comando Chrome:

Cosa gira dove:

- Host Gateway: Gateway OpenClaw, workspace agente, chiavi modello/API, provider
  realtime e configurazione del Plugin Google Meet.
- VM macOS Parallels: CLI/host Node OpenClaw, Google Chrome, SoX, BlackHole 2ch
  e un profilo Chrome autenticato su Google.
- Non necessari nella VM: servizio Gateway, configurazione agente, chiave OpenAI/GPT o configurazione del provider di modelli.

Installa le dipendenze nella VM:

```bash
brew install blackhole-2ch sox
```

Riavvia la VM dopo aver installato BlackHole così macOS espone `BlackHole 2ch`:

```bash
sudo reboot
```

Dopo il riavvio, verifica che la VM possa vedere il dispositivo audio e i comandi SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Installa o aggiorna OpenClaw nella VM, poi abilita lì il Plugin incluso:

```bash
openclaw plugins enable google-meet
```

Avvia l'host Node nella VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Se `<gateway-host>` è un IP LAN e non stai usando TLS, il Node rifiuta il
WebSocket in chiaro a meno che tu non faccia opt-in per quella rete privata attendibile:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Usa la stessa variabile d'ambiente quando installi il Node come LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` è un ambiente di processo, non un'impostazione
di `openclaw.json`. `openclaw node install` la memorizza nell'ambiente del LaunchAgent
quando è presente nel comando di installazione.

Approva il Node dall'host Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Conferma che il Gateway veda il Node e che esso pubblicizzi `googlemeet.chrome`:

```bash
openclaw nodes status
```

Instrada Meet attraverso quel Node sull'host Gateway:

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

Ora unisciti normalmente dall'host Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

oppure chiedi all'agente di usare lo strumento `google_meet` con `transport: "chrome-node"`.

Se `chromeNode.node` viene omesso, OpenClaw esegue la selezione automatica solo quando esattamente un
Node connesso pubblicizza `googlemeet.chrome`. Se sono connessi più Node in grado di farlo, imposta `chromeNode.node` sull'id del Node, sul nome visualizzato o sull'IP remoto.

Controlli comuni in caso di errore:

- `No connected Google Meet-capable node`: avvia `openclaw node run` nella VM,
  approva l'associazione e assicurati che `openclaw plugins enable google-meet` sia stato eseguito
  nella VM. Conferma anche che l'host Gateway consenta il comando del Node con
  `gateway.nodes.allowCommands: ["googlemeet.chrome"]`.
- `BlackHole 2ch audio device not found on the node`: installa `blackhole-2ch`
  nella VM e riavviala.
- Chrome si apre ma non riesce a partecipare: accedi a Chrome dentro la VM e conferma che
  quel profilo possa unirsi manualmente all'URL Meet.
- Nessun audio: in Meet, instrada microfono/altoparlante attraverso il percorso del dispositivo audio virtuale
  usato da OpenClaw; usa dispositivi virtuali separati o routing in stile Loopback
  per un duplex pulito.

## Note di installazione

Il valore predefinito realtime di Chrome usa due strumenti esterni:

- `sox`: utility audio da riga di comando. Il Plugin usa i suoi comandi `rec` e `play`
  per il bridge audio predefinito G.711 mu-law a 8 kHz.
- `blackhole-2ch`: driver audio virtuale macOS. Crea il dispositivo audio
  `BlackHole 2ch` attraverso cui Chrome/Meet possono instradare l'audio.

OpenClaw non include né ridistribuisce nessuno dei due pacchetti. La documentazione chiede agli utenti di
installarli come dipendenze host tramite Homebrew. SoX è concesso in licenza come
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole è GPL-3.0. Se costruisci un
installer o appliance che include BlackHole insieme a OpenClaw, verifica i termini di
licenza upstream di BlackHole oppure ottieni una licenza separata da Existential Audio.

## Trasporti

### Chrome

Il trasporto Chrome apre l'URL Meet in Google Chrome e si unisce come profilo Chrome autenticato. Su macOS, il Plugin controlla la presenza di `BlackHole 2ch` prima dell'avvio.
Se configurato, esegue anche un comando di health del bridge audio e un comando di avvio
prima di aprire Chrome. Usa `chrome` quando Chrome/audio si trovano sull'host Gateway;
usa `chrome-node` quando Chrome/audio si trovano su un Node associato come una VM macOS Parallels.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Instrada l'audio di microfono e altoparlante di Chrome attraverso il bridge audio locale di OpenClaw.
Se `BlackHole 2ch` non è installato, l'operazione fallisce con un errore di configurazione
invece di unirsi silenziosamente senza un percorso audio.

### Twilio

Il trasporto Twilio è un piano di composizione rigoroso delegato al Plugin Voice Call. Non analizza
le pagine Meet per trovare numeri di telefono.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Usa `--dtmf-sequence` quando la riunione richiede una sequenza personalizzata:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth e preflight

L'accesso alla Google Meet Media API usa prima un client OAuth personale. Configura
`oauth.clientId` e facoltativamente `oauth.clientSecret`, poi esegui:

```bash
openclaw googlemeet auth login --json
```

Il comando stampa un blocco di configurazione `oauth` con un refresh token. Usa PKCE,
callback localhost su `http://localhost:8085/oauth2callback` e un flusso manuale
copia/incolla con `--manual`.

Queste variabili d'ambiente sono accettate come fallback:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` oppure `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` oppure `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` oppure `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` oppure `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` oppure
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` oppure `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` oppure `GOOGLE_MEET_PREVIEW_ACK`

Risolvi un URL Meet, un codice o `spaces/{id}` tramite `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Esegui il preflight prima del lavoro media:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Imposta `preview.enrollmentAcknowledged: true` solo dopo aver confermato che il tuo Cloud
project, principal OAuth e partecipanti alla riunione siano iscritti al Google
Workspace Developer Preview Program per le Meet media API.

## Configurazione

Il percorso realtime Chrome comune richiede solo il Plugin abilitato, BlackHole, SoX
e una chiave OpenAI:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

Imposta la configurazione del Plugin sotto `plugins.entries.google-meet.config`:

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

Valori predefiniti:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: id/nome/IP del Node facoltativo per `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.audioInputCommand`: comando SoX `rec` che scrive audio
  G.711 mu-law a 8 kHz su stdout
- `chrome.audioOutputCommand`: comando SoX `play` che legge audio
  G.711 mu-law a 8 kHz da stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: risposte vocali brevi, con
  `openclaw_agent_consult` per risposte più approfondite

Override facoltativi:

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
  },
}
```

Configurazione solo Twilio:

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

## Strumento

Gli agenti possono usare lo strumento `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Usa `transport: "chrome"` quando Chrome gira sull'host Gateway. Usa
`transport: "chrome-node"` quando Chrome gira su un Node associato come una VM
Parallels. In entrambi i casi il modello realtime e `openclaw_agent_consult` girano sull'host
Gateway, quindi le credenziali del modello restano lì.

Usa `action: "status"` per elencare le sessioni attive o ispezionare un ID sessione. Usa
`action: "leave"` per contrassegnare una sessione come terminata.

## Consult dell'agente realtime

La modalità realtime di Chrome è ottimizzata per un ciclo vocale live. Il provider voce
realtime ascolta l'audio della riunione e parla tramite il bridge audio configurato.
Quando il modello realtime ha bisogno di ragionamento più profondo, informazioni attuali o dei normali
strumenti OpenClaw, può chiamare `openclaw_agent_consult`.

Lo strumento di consult esegue dietro le quinte il normale agente OpenClaw con il contesto
della trascrizione recente della riunione e restituisce una risposta vocale concisa alla sessione vocale realtime. Il modello vocale può poi pronunciare quella risposta nella riunione.

`realtime.toolPolicy` controlla l'esecuzione di consult:

- `safe-read-only`: espone lo strumento di consult e limita il normale agente a
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` e
  `memory_get`.
- `owner`: espone lo strumento di consult e consente al normale agente di usare la normale
  policy degli strumenti dell'agente.
- `none`: non espone lo strumento di consult al modello vocale realtime.

La chiave di sessione di consult ha ambito per sessione Meet, così le chiamate di consult successive
possono riutilizzare il contesto di consult precedente durante la stessa riunione.

## Note

La media API ufficiale di Google Meet è orientata alla ricezione, quindi parlare in una chiamata
Meet richiede comunque un percorso da partecipante. Questo Plugin mantiene visibile quel confine:
Chrome gestisce la partecipazione via browser e l'instradamento audio locale; Twilio gestisce
la partecipazione via dial-in telefonico.

La modalità realtime Chrome richiede uno dei seguenti:

- `chrome.audioInputCommand` più `chrome.audioOutputCommand`: OpenClaw possiede il
  bridge del modello realtime e instrada l'audio G.711 mu-law a 8 kHz tra quei
  comandi e il provider vocale realtime selezionato.
- `chrome.audioBridgeCommand`: un comando bridge esterno possiede l'intero percorso
  audio locale e deve terminare dopo aver avviato o convalidato il proprio daemon.

Per un audio duplex pulito, instrada l'output Meet e il microfono Meet attraverso dispositivi
virtuali separati o un grafo di dispositivi virtuali in stile Loopback. Un singolo dispositivo
BlackHole condiviso può rimandare gli altri partecipanti nella chiamata.

`googlemeet leave` arresta il bridge audio realtime a coppia di comandi per le sessioni Chrome.
Per le sessioni Twilio delegate tramite il Plugin Voice Call, chiude anche la
chiamata vocale sottostante.

## Correlati

- [Plugin Voice Call](/it/plugins/voice-call)
- [Modalità talk](/it/nodes/talk)
- [Creazione di Plugin](/it/plugins/building-plugins)
