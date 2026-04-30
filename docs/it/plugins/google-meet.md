---
read_when:
    - Vuoi che un agente OpenClaw partecipi a una chiamata Google Meet
    - Vuoi che un agente OpenClaw crei una nuova chiamata su Google Meet
    - Stai configurando Chrome, un nodo Chrome o Twilio come trasporto per Google Meet
summary: 'Plugin di Google Meet: accedi a URL Meet espliciti tramite Chrome o Twilio con impostazioni predefinite per la voce in tempo reale'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-30T09:03:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b989c872fee0dca31680f67559cd26b715303f7c6f4eeda51fc63889bb0383c
    source_path: plugins/google-meet.md
    workflow: 16
---

Supporto dei partecipanti Google Meet per OpenClaw — il plugin è esplicito per progettazione:

- Entra solo in un URL esplicito `https://meet.google.com/...`.
- Può creare un nuovo spazio Meet tramite l'API Google Meet, quindi entrare nell'URL
  restituito.
- `realtime` voice è la modalità predefinita.
- La voce realtime può richiamare l'agente OpenClaw completo quando sono necessari
  ragionamento più approfondito o strumenti.
- Gli agenti scelgono il comportamento di accesso con `mode`: usa `realtime` per ascolto
  e risposta vocale live, oppure `transcribe` per entrare/controllare il browser senza il
  bridge vocale realtime.
- L'autenticazione parte come OAuth Google personale o come profilo Chrome già autenticato.
- Non c'è alcun annuncio automatico di consenso.
- Il backend audio Chrome predefinito è `BlackHole 2ch`.
- Chrome può essere eseguito localmente o su un host nodo associato.
- Twilio accetta un numero di chiamata in ingresso più PIN opzionale o sequenza DTMF.
- Il comando CLI è `googlemeet`; `meet` è riservato a flussi di teleconferenza più ampi
  dell'agente.

## Avvio rapido

Installa le dipendenze audio locali e configura un provider vocale realtime di
backend. OpenAI è il predefinito; anche Google Gemini Live funziona con
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` installa il dispositivo audio virtuale `BlackHole 2ch`. Il
programma di installazione di Homebrew richiede un riavvio prima che macOS esponga
il dispositivo:

```bash
sudo reboot
```

Dopo il riavvio, verifica entrambi gli elementi:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Abilita il plugin:

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

L'output di configurazione è pensato per essere leggibile dagli agenti e consapevole
della modalità. Riporta il profilo Chrome, il pinning del nodo e, per gli accessi
Chrome realtime, i controlli del bridge audio BlackHole/SoX e dell'introduzione
realtime ritardata. Per gli accessi solo osservazione, controlla lo stesso trasporto
con `--mode transcribe`; quella modalità salta i prerequisiti audio realtime perché
non ascolta né parla attraverso il bridge:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Quando la delega Twilio è configurata, la configurazione riporta anche se il
plugin `voice-call` e le credenziali Twilio sono pronti. Considera qualsiasi
controllo `ok: false` come un blocco per il trasporto e la modalità controllati
prima di chiedere a un agente di entrare. Usa `openclaw googlemeet setup --json`
per script o output leggibile da macchina. Usa `--transport chrome`, `--transport chrome-node` o `--transport twilio`
per eseguire un preflight di un trasporto specifico prima che un agente lo provi.

Entra in una riunione:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Oppure lascia che un agente entri tramite lo strumento `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Crea una nuova riunione ed entra:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Crea solo l'URL senza entrare:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` ha due percorsi:

- Creazione API: usata quando sono configurate credenziali OAuth Google Meet. È
  il percorso più deterministico e non dipende dallo stato dell'interfaccia del browser.
- Fallback browser: usato quando le credenziali OAuth sono assenti. OpenClaw usa il
  nodo Chrome fissato, apre `https://meet.google.com/new`, attende che Google
  reindirizzi a un URL reale con codice riunione, quindi restituisce quell'URL. Questo percorso richiede
  che il profilo Chrome di OpenClaw sul nodo abbia già effettuato l'accesso a Google.
  L'automazione del browser gestisce il prompt iniziale del microfono proprio di Meet; quel prompt
  non viene trattato come errore di accesso a Google.
  I flussi di accesso e creazione provano anche a riutilizzare una scheda Meet esistente prima di aprirne
  una nuova. La corrispondenza ignora stringhe di query innocue dell'URL come `authuser`, quindi un
  nuovo tentativo dell'agente dovrebbe mettere a fuoco la riunione già aperta invece di creare una seconda
  scheda Chrome.

L'output del comando/strumento include un campo `source` (`api` o `browser`) così gli agenti
possono spiegare quale percorso è stato usato. `create` entra nella nuova riunione per impostazione predefinita e
restituisce `joined: true` più la sessione di accesso. Per generare solo l'URL, usa
`create --no-join` nella CLI oppure passa `"join": false` allo strumento.

Oppure dì a un agente: "Create a Google Meet, join it with realtime voice, and send
me the link." L'agente dovrebbe chiamare `google_meet` con `action: "create"` e
poi condividere il `meetingUri` restituito.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Per un accesso solo osservazione/controllo browser, imposta `"mode": "transcribe"`. Questo
non avvia il bridge del modello realtime duplex, non richiede BlackHole o SoX,
e non risponderà vocalmente nella riunione. Gli accessi Chrome in questa modalità evitano anche
la concessione dei permessi microfono/fotocamera di OpenClaw ed evitano il percorso **Use
microphone** di Meet. Se Meet mostra un'interstitial di scelta audio, l'automazione prova
il percorso senza microfono e altrimenti segnala un'azione manuale invece di aprire
il microfono locale.

Durante le sessioni realtime, lo stato di `google_meet` include l'integrità del browser e del bridge audio
come `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, timestamp dell'ultimo input/output,
contatori di byte e stato di chiusura del bridge. Se compare un prompt sicuro della pagina Meet,
l'automazione del browser lo gestisce quando può. Login, ammissione dell'host e
prompt di autorizzazione browser/OS sono riportati come azione manuale con un motivo e
un messaggio che l'agente deve inoltrare. Le sessioni Chrome gestite emettono la frase introduttiva o
di test solo dopo che l'integrità del browser riporta `inCall: true`; altrimenti lo stato riporta
`speechReady: false` e il tentativo di parlare viene bloccato invece di fingere che
l'agente abbia parlato nella riunione.

Gli accessi Chrome locali passano attraverso il profilo browser OpenClaw autenticato. La modalità realtime
richiede `BlackHole 2ch` per il percorso microfono/altoparlante usato da OpenClaw. Per
audio duplex pulito, usa dispositivi virtuali separati o un grafo in stile Loopback; un
singolo dispositivo BlackHole è sufficiente per un primo smoke test ma può generare eco.

### Gateway locale + Chrome Parallels

Non serve un Gateway OpenClaw completo o una chiave API del modello dentro una VM macOS
solo per far sì che la VM possieda Chrome. Esegui il Gateway e l'agente localmente, poi esegui un
host nodo nella VM. Abilita una volta il plugin incluso nella VM così il nodo
pubblicizza il comando Chrome:

Cosa viene eseguito dove:

- Host Gateway: Gateway OpenClaw, workspace agente, chiavi modello/API, provider
  realtime e configurazione del plugin Google Meet.
- VM macOS Parallels: CLI/host nodo OpenClaw, Google Chrome, SoX, BlackHole 2ch,
  e un profilo Chrome autenticato in Google.
- Non necessari nella VM: servizio Gateway, configurazione agente, chiave OpenAI/GPT o configurazione
  del provider modello.

Installa le dipendenze della VM:

```bash
brew install blackhole-2ch sox
```

Riavvia la VM dopo aver installato BlackHole in modo che macOS esponga `BlackHole 2ch`:

```bash
sudo reboot
```

Dopo il riavvio, verifica che la VM possa vedere il dispositivo audio e i comandi SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Installa o aggiorna OpenClaw nella VM, quindi abilita lì il plugin incluso:

```bash
openclaw plugins enable google-meet
```

Avvia l'host nodo nella VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Se `<gateway-host>` è un IP LAN e non stai usando TLS, il nodo rifiuta il
WebSocket in chiaro a meno che tu non acconsenta esplicitamente per quella rete privata fidata:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Usa la stessa variabile d'ambiente quando installi il nodo come LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` è ambiente di processo, non un'impostazione
`openclaw.json`. `openclaw node install` la memorizza nell'ambiente del LaunchAgent
quando è presente nel comando di installazione.

Approva il nodo dall'host Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Conferma che il Gateway veda il nodo e che questo pubblicizzi sia `googlemeet.chrome`
sia la capability browser/`browser.proxy`:

```bash
openclaw nodes status
```

Instrada Meet attraverso quel nodo sull'host Gateway:

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

Ora entra normalmente dall'host Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

oppure chiedi all'agente di usare lo strumento `google_meet` con `transport: "chrome-node"`.

Per uno smoke test con un solo comando che crea o riusa una sessione, pronuncia una frase nota
e stampa l'integrità della sessione:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Durante l'accesso realtime, l'automazione browser di OpenClaw compila il nome ospite, fa clic su
Join/Ask to join e accetta la scelta iniziale "Use microphone" di Meet quando compare quel
prompt. Durante l'accesso solo osservazione o la creazione riunione solo browser, continua
oltre lo stesso prompt senza microfono quando quella scelta è disponibile.
Se il profilo browser non è autenticato, Meet è in attesa dell'ammissione dell'host,
Chrome ha bisogno del permesso microfono/fotocamera per un accesso realtime, oppure Meet è bloccato
su un prompt che l'automazione non ha potuto risolvere, il risultato di join/test-speech riporta
`manualActionRequired: true` con `manualActionReason` e
`manualActionMessage`. Gli agenti dovrebbero smettere di ritentare l'accesso, riportare quel messaggio esatto
più gli attuali `browserUrl`/`browserTitle`, e riprovare solo dopo che l'azione manuale
nel browser è completa.

Se `chromeNode.node` è omesso, OpenClaw seleziona automaticamente solo quando esattamente un
nodo connesso pubblicizza sia `googlemeet.chrome` sia il controllo browser. Se
sono connessi diversi nodi compatibili, imposta `chromeNode.node` sull'id del nodo,
sul nome visualizzato o sull'IP remoto.

Controlli di errore comuni:

- `Configured Google Meet node ... is not usable: offline`: il nodo fissato è
  noto al Gateway ma non disponibile. Gli agenti devono trattare quel nodo come
  stato diagnostico, non come host Chrome utilizzabile, e segnalare il blocco di
  configurazione invece di ripiegare su un altro trasporto, a meno che l'utente
  non lo abbia richiesto.
- `No connected Google Meet-capable node`: avvia `openclaw node run` nella VM,
  approva l'abbinamento e assicurati che `openclaw plugins enable google-meet` e
  `openclaw plugins enable browser` siano stati eseguiti nella VM. Conferma
  inoltre che l'host Gateway consenta entrambi i comandi del nodo con
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: installa `blackhole-2ch` sull'host
  controllato e riavvia prima di usare l'audio Chrome locale.
- `BlackHole 2ch audio device not found on the node`: installa `blackhole-2ch`
  nella VM e riavvia la VM.
- Chrome si apre ma non riesce a partecipare: accedi al profilo del browser
  dentro la VM, oppure mantieni `chrome.guestName` impostato per l'accesso come
  ospite. L'accesso automatico come ospite usa l'automazione del browser
  OpenClaw tramite il proxy browser del nodo; assicurati che la configurazione
  del browser del nodo punti al profilo desiderato, per esempio
  `browser.defaultProfile: "user"` o un profilo di sessione esistente con nome.
- Schede Meet duplicate: lascia `chrome.reuseExistingTab: true` abilitato.
  OpenClaw attiva una scheda esistente per lo stesso URL Meet prima di aprirne
  una nuova, e la creazione della riunione tramite browser riusa una scheda
  `https://meet.google.com/new` in corso o una scheda di richiesta dell'account
  Google prima di aprirne un'altra.
- Nessun audio: in Meet, instrada microfono/altoparlante attraverso il percorso
  del dispositivo audio virtuale usato da OpenClaw; usa dispositivi virtuali
  separati o instradamento in stile Loopback per un audio duplex pulito.

## Note di installazione

L'impostazione predefinita realtime di Chrome usa due strumenti esterni:

- `sox`: utilità audio da riga di comando. Il Plugin usa comandi dispositivo
  CoreAudio espliciti per il bridge audio PCM16 predefinito a 24 kHz.
- `blackhole-2ch`: driver audio virtuale macOS. Crea il dispositivo audio
  `BlackHole 2ch` attraverso cui Chrome/Meet può instradare l'audio.

OpenClaw non include né ridistribuisce nessuno dei due pacchetti. La
documentazione chiede agli utenti di installarli come dipendenze host tramite
Homebrew. SoX è concesso in licenza come `LGPL-2.0-only AND GPL-2.0-only`;
BlackHole è GPL-3.0. Se crei un installer o un appliance che include BlackHole
con OpenClaw, rivedi i termini di licenza upstream di BlackHole oppure ottieni
una licenza separata da Existential Audio.

## Trasporti

### Chrome

Il trasporto Chrome apre l'URL Meet tramite il controllo browser OpenClaw e
partecipa come profilo browser OpenClaw con accesso effettuato. Su macOS, il
Plugin verifica la presenza di `BlackHole 2ch` prima dell'avvio. Se configurato,
esegue anche un comando di stato del bridge audio e un comando di avvio prima di
aprire Chrome. Usa `chrome` quando Chrome/audio sono sull'host Gateway; usa
`chrome-node` quando Chrome/audio sono su un nodo abbinato, come una VM macOS
Parallels. Per Chrome locale, scegli il profilo con `browser.defaultProfile`;
`chrome.browserProfile` viene passato agli host `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Instrada l'audio del microfono e dell'altoparlante di Chrome attraverso il
bridge audio OpenClaw locale. Se `BlackHole 2ch` non è installato, l'accesso
fallisce con un errore di configurazione invece di partecipare silenziosamente
senza un percorso audio.

### Twilio

Il trasporto Twilio è un piano di chiamata rigoroso delegato al Plugin Voice
Call. Non analizza le pagine Meet per cercare numeri di telefono.

Usalo quando la partecipazione tramite Chrome non è disponibile o vuoi un
fallback di accesso telefonico. Google Meet deve esporre un numero di accesso
telefonico e un PIN per la riunione; OpenClaw non li scopre dalla pagina Meet.

Abilita il Plugin Voice Call sull'host Gateway, non sul nodo Chrome:

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

Fornisci le credenziali Twilio tramite ambiente o configurazione. L'ambiente
mantiene i segreti fuori da `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Riavvia o ricarica il Gateway dopo aver abilitato `voice-call`; le modifiche
alla configurazione del Plugin non compaiono in un processo Gateway già in
esecuzione finché non viene ricaricato.

Poi verifica:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Quando la delega Twilio è collegata, `googlemeet setup` include controlli
`twilio-voice-call-plugin` e `twilio-voice-call-credentials` riusciti.

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

OAuth è opzionale per creare un link Meet perché `googlemeet create` può
ripiegare sull'automazione del browser. Configura OAuth quando vuoi la creazione
tramite API ufficiale, la risoluzione degli spazi o i controlli preflight
dell'API Meet Media.

L'accesso all'API Google Meet usa OAuth utente: crea un client OAuth Google
Cloud, richiedi gli ambiti necessari, autorizza un account Google, quindi salva
il refresh token risultante nella configurazione del Plugin Google Meet o
fornisci le variabili di ambiente `OPENCLAW_GOOGLE_MEET_*`.

OAuth non sostituisce il percorso di accesso Chrome. I trasporti Chrome e
Chrome-node partecipano comunque tramite un profilo Chrome con accesso
effettuato, BlackHole/SoX e un nodo connesso quando usi la partecipazione via
browser. OAuth serve solo per il percorso API ufficiale di Google Meet: creare
spazi riunione, risolvere spazi ed eseguire controlli preflight dell'API Meet
Media.

### Crea credenziali Google

In Google Cloud Console:

1. Crea o seleziona un progetto Google Cloud.
2. Abilita **Google Meet REST API** per quel progetto.
3. Configura la schermata di consenso OAuth.
   - **Internal** è la soluzione più semplice per un'organizzazione Google Workspace.
   - **External** funziona per configurazioni personali/di test; mentre l'app è in Testing,
     aggiungi come utente di test ogni account Google che autorizzerà l'app.
4. Aggiungi gli ambiti richiesti da OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Crea un ID client OAuth.
   - Tipo di applicazione: **Web application**.
   - URI di reindirizzamento autorizzato:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Copia l'ID client e il segreto client.

`meetings.space.created` è richiesto da Google Meet `spaces.create`.
`meetings.space.readonly` consente a OpenClaw di risolvere URL/codici Meet in
spazi. `meetings.conference.media.readonly` serve per il preflight dell'API
Meet Media e il lavoro sui media; Google può richiedere l'iscrizione al
Developer Preview per l'uso effettivo dell'API Media. Se ti servono solo accessi
Chrome basati su browser, salta completamente OAuth.

### Genera il refresh token

Configura `oauth.clientId` e facoltativamente `oauth.clientSecret`, oppure
passali come variabili di ambiente, quindi esegui:

```bash
openclaw googlemeet auth login --json
```

Il comando stampa un blocco di configurazione `oauth` con un refresh token. Usa
PKCE, callback localhost su `http://localhost:8085/oauth2callback` e un flusso
manuale di copia/incolla con `--manual`.

Esempi:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Usa la modalità manuale quando il browser non riesce a raggiungere la callback
locale:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

L'output JSON include:

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

Salva l'oggetto `oauth` sotto la configurazione del Plugin Google Meet:

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

Preferisci le variabili di ambiente quando non vuoi il refresh token nella
configurazione. Se sono presenti sia valori di configurazione sia valori di
ambiente, il Plugin risolve prima la configurazione e poi il fallback di
ambiente.

Il consenso OAuth include la creazione di spazi Meet, l'accesso in lettura agli
spazi Meet e l'accesso in lettura ai media delle conferenze Meet. Se hai
autenticato prima che esistesse il supporto alla creazione di riunioni, riesegui
`openclaw googlemeet auth login --json` in modo che il refresh token abbia
l'ambito `meetings.space.created`.

### Verifica OAuth con doctor

Esegui il doctor OAuth quando vuoi un controllo di stato rapido e senza segreti:

```bash
openclaw googlemeet doctor --oauth --json
```

Questo non carica il runtime Chrome né richiede un nodo Chrome connesso.
Controlla che la configurazione OAuth esista e che il refresh token possa
generare un access token. Il report JSON include solo campi di stato come `ok`,
`configured`, `tokenSource`, `expiresAt` e messaggi di controllo; non stampa
access token, refresh token o segreto client.

Risultati comuni:

| Controllo            | Significato                                                                            |
| -------------------- | -------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` più `oauth.refreshToken`, o un access token in cache, è presente.     |
| `oauth-token`        | L'access token in cache è ancora valido, oppure il refresh token ne ha generato uno nuovo. |
| `meet-spaces-get`    | Il controllo opzionale `--meeting` ha risolto uno spazio Meet esistente.               |
| `meet-spaces-create` | Il controllo opzionale `--create-space` ha creato un nuovo spazio Meet.                |

Per dimostrare anche l'abilitazione dell'API Google Meet e l'ambito
`spaces.create`, esegui il controllo di creazione con effetto collaterale:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` crea un URL Meet temporaneo. Usalo quando devi confermare che
il progetto Google Cloud abbia l'API Meet abilitata e che l'account autorizzato
abbia l'ambito `meetings.space.created`.

Per dimostrare l'accesso in lettura per uno spazio riunione esistente:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` e `resolve-space` dimostrano l'accesso in lettura a
uno spazio esistente a cui l'account Google autorizzato può accedere. Un `403`
da questi controlli di solito significa che la Google Meet REST API è
disabilitata, che al refresh token con consenso manca l'ambito richiesto, o che
l'account Google non può accedere a quello spazio Meet. Un errore di
refresh-token significa rieseguire `openclaw googlemeet auth login --json` e
salvare il nuovo blocco `oauth`.

Non sono necessarie credenziali OAuth per il fallback tramite browser. In quella
modalità, l'autenticazione Google proviene dal profilo Chrome con accesso
effettuato sul nodo selezionato, non dalla configurazione OpenClaw.

Queste variabili di ambiente sono accettate come fallback:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` o `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` o `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` o `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` o `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` o
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` o `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` o `GOOGLE_MEET_PREVIEW_ACK`

Risolvi un URL, un codice Meet o `spaces/{id}` tramite `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Esegui il preflight prima del lavoro sui media:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Elenca gli artefatti della riunione e la partecipazione dopo che Meet ha creato i record della conferenza:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Con `--meeting`, `artifacts` e `attendance` usano per impostazione predefinita il record della conferenza più recente. Passa `--all-conference-records` quando vuoi ogni record conservato per quella riunione.

La ricerca nel calendario può risolvere l’URL della riunione da Google Calendar prima di leggere gli artefatti Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` cerca nel calendario `primary` di oggi un evento di Calendar con un link Google Meet. Usa `--event <query>` per cercare testo evento corrispondente e `--calendar <id>` per un calendario non principale. La ricerca nel calendario richiede un nuovo accesso OAuth che includa l’ambito di sola lettura degli eventi Calendar.
`calendar-events` mostra in anteprima gli eventi Meet corrispondenti e contrassegna l’evento che `latest`, `artifacts`, `attendance` o `export` sceglierà.

Se conosci già l’id del record della conferenza, indirizzalo direttamente:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Scrivi un report leggibile:

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

`artifacts` restituisce i metadati del record della conferenza più i metadati delle risorse di partecipante, registrazione, trascrizione, voce di trascrizione strutturata e note intelligenti quando Google li espone per la riunione. Usa `--no-transcript-entries` per saltare la ricerca delle voci per riunioni di grandi dimensioni. `attendance` espande i partecipanti in righe di sessione partecipante con orari di prima/ultima presenza, durata totale della sessione, flag di ritardo/uscita anticipata e risorse partecipante duplicate unite per utente autenticato o nome visualizzato. Passa `--no-merge-duplicates` per mantenere separate le risorse partecipante grezze, `--late-after-minutes` per regolare il rilevamento del ritardo e `--early-before-minutes` per regolare il rilevamento dell’uscita anticipata.

`export` scrive una cartella contenente `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` e `manifest.json`.
`manifest.json` registra l’input scelto, le opzioni di esportazione, i record della conferenza, i file di output, i conteggi, la fonte del token, l’evento Calendar quando ne è stato usato uno e gli eventuali avvisi di recupero parziale. Passa `--zip` per scrivere anche un archivio portabile accanto alla cartella. Passa `--include-doc-bodies` per esportare il testo dei Google Docs collegati di trascrizione e note intelligenti tramite Google Drive `files.export`; questo richiede un nuovo accesso OAuth che includa l’ambito di sola lettura Drive Meet. Senza `--include-doc-bodies`, le esportazioni includono solo metadati Meet e voci di trascrizione strutturate. Se Google restituisce un errore parziale sugli artefatti, come un errore di elenco note intelligenti, voce di trascrizione o corpo documento Drive, il riepilogo e il manifest conservano l’avviso invece di far fallire l’intera esportazione.
Usa `--dry-run` per recuperare gli stessi dati di artefatti/partecipazione e stampare il JSON del manifest senza creare la cartella o lo ZIP. È utile prima di scrivere un’esportazione grande o quando un agente ha bisogno solo di conteggi, record selezionati e avvisi.

Gli agenti possono anche creare lo stesso bundle tramite lo strumento `google_meet`:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

Imposta `"dryRun": true` per restituire solo il manifest di esportazione e saltare le scritture di file.

Esegui lo smoke test live protetto su una riunione reale conservata:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Ambiente dello smoke test live:

- `OPENCLAW_LIVE_TEST=1` abilita i test live protetti.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` punta a un URL, codice Meet o
  `spaces/{id}` conservato.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` o `GOOGLE_MEET_CLIENT_ID` fornisce l’id client OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` o `GOOGLE_MEET_REFRESH_TOKEN` fornisce il token di aggiornamento.
- Opzionali: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` e
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` usano gli stessi nomi di fallback
  senza il prefisso `OPENCLAW_`.

Lo smoke test live di base per artefatti/partecipazione richiede `https://www.googleapis.com/auth/meetings.space.readonly` e `https://www.googleapis.com/auth/meetings.conference.media.readonly`. La ricerca nel calendario richiede `https://www.googleapis.com/auth/calendar.events.readonly`. L’esportazione del corpo documento Drive richiede `https://www.googleapis.com/auth/drive.meet.readonly`.

Crea un nuovo spazio Meet:

```bash
openclaw googlemeet create
```

Il comando stampa il nuovo `meeting uri`, la fonte e la sessione di partecipazione. Con credenziali OAuth usa l’API ufficiale di Google Meet. Senza credenziali OAuth usa come fallback il profilo browser autenticato del nodo Chrome fissato. Gli agenti possono usare lo strumento `google_meet` con `action: "create"` per creare e partecipare in un solo passaggio. Per la creazione solo URL, passa `"join": false`.

Esempio di output JSON dal fallback del browser:

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

Se il fallback del browser incontra l’accesso Google o un blocco di autorizzazione Meet prima di poter creare l’URL, il metodo Gateway restituisce una risposta non riuscita e lo strumento `google_meet` restituisce dettagli strutturati invece di una semplice stringa:

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

Quando un agente vede `manualActionRequired: true`, deve riportare il `manualActionMessage` più il contesto nodo/scheda del browser e smettere di aprire nuove schede Meet finché l’operatore non completa il passaggio nel browser.

Esempio di output JSON dalla creazione tramite API:

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

La creazione di un Meet partecipa per impostazione predefinita. Il trasporto Chrome o nodo Chrome necessita comunque di un profilo Google Chrome autenticato per partecipare tramite il browser. Se il profilo è disconnesso, OpenClaw segnala `manualActionRequired: true` o un errore di fallback del browser e chiede all’operatore di completare l’accesso Google prima di riprovare.

Imposta `preview.enrollmentAcknowledged: true` solo dopo aver confermato che il tuo progetto Cloud, il principale OAuth e i partecipanti alla riunione sono iscritti al Google Workspace Developer Preview Program per le API multimediali Meet.

## Configurazione

Il percorso realtime Chrome comune richiede solo che il Plugin sia abilitato, BlackHole, SoX e una chiave di provider voce realtime backend. OpenAI è l’impostazione predefinita; imposta `realtime.provider: "google"` per usare Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
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

Impostazioni predefinite:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: id/nome/IP nodo opzionale per `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: nome usato nella schermata ospite Meet disconnessa
- `chrome.autoJoin: true`: compilazione del nome ospite e clic su Partecipa ora tramite automazione del browser OpenClaw su `chrome-node` con il massimo impegno
- `chrome.reuseExistingTab: true`: attiva una scheda Meet esistente invece di aprire duplicati
- `chrome.waitForInCallMs: 20000`: attende che la scheda Meet segnali che è in chiamata prima dell’attivazione dell’introduzione realtime
- `chrome.audioFormat: "pcm16-24khz"`: formato audio della coppia di comandi. Usa
  `"g711-ulaw-8khz"` solo per coppie di comandi legacy/personalizzate che emettono ancora audio di telefonia.
- `chrome.audioInputCommand`: comando SoX che legge da CoreAudio `BlackHole 2ch` e scrive audio in `chrome.audioFormat`
- `chrome.audioOutputCommand`: comando SoX che legge audio in `chrome.audioFormat` e scrive su CoreAudio `BlackHole 2ch`
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: risposte vocali brevi, con `openclaw_agent_consult` per risposte più approfondite
- `realtime.introMessage`: breve controllo vocale di disponibilità quando il bridge realtime si connette; impostalo a `""` per partecipare in silenzio
- `realtime.agentId`: id agente OpenClaw opzionale per `openclaw_agent_consult`; predefinito a `main`

Override opzionali:

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

`voiceCall.enabled` è predefinito a `true`; con il trasporto Twilio delega la chiamata PSTN effettiva e il DTMF al Plugin Voice Call. Se `voice-call` non è abilitato, Google Meet può comunque validare e registrare il piano di chiamata, ma non può effettuare la chiamata Twilio.

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

Usa `transport: "chrome"` quando Chrome è in esecuzione sull'host Gateway. Usa
`transport: "chrome-node"` quando Chrome è in esecuzione su un node associato, ad esempio una
VM Parallels. In entrambi i casi il modello in tempo reale e `openclaw_agent_consult` vengono eseguiti sull'host
Gateway, quindi le credenziali del modello restano lì.

Usa `action: "status"` per elencare le sessioni attive o ispezionare un ID sessione. Usa
`action: "speak"` con `sessionId` e `message` per far parlare subito l'agente in tempo reale. Usa `action: "test_speech"` per creare o riutilizzare la sessione,
attivare una frase nota e restituire lo stato di salute `inCall` quando l'host Chrome può
segnalarlo. `test_speech` forza sempre `mode: "realtime"` e fallisce se viene chiesto di
eseguirsi in `mode: "transcribe"` perché le sessioni di sola osservazione intenzionalmente non possono
emettere parlato. Il suo risultato `speechOutputVerified` si basa sull'aumento dei byte di output audio in tempo reale
durante questa chiamata di test, quindi una sessione riutilizzata con audio precedente
non conta come un nuovo controllo vocale riuscito. Usa `action: "leave"` per contrassegnare
una sessione come terminata.

`status` include lo stato di salute di Chrome quando disponibile:

- `inCall`: Chrome sembra essere dentro la chiamata Meet
- `micMuted`: stato del microfono Meet al meglio delle possibilità
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: il
  profilo del browser richiede accesso manuale, ammissione da parte dell'host Meet, autorizzazioni o
  riparazione del controllo browser prima che il parlato possa funzionare
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: indica se
  ora il parlato gestito da Chrome è consentito. `speechReady: false` significa che OpenClaw non ha
  inviato la frase introduttiva/di test nel bridge audio.
- `providerConnected` / `realtimeReady`: stato del bridge vocale in tempo reale
- `lastInputAt` / `lastOutputAt`: ultimo audio visto dal bridge o inviato al bridge

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Consultazione dell'agente in tempo reale

La modalità in tempo reale di Chrome è ottimizzata per un loop vocale live. Il provider vocale in tempo reale
ascolta l'audio della riunione e parla attraverso il bridge audio configurato.
Quando il modello in tempo reale ha bisogno di ragionamento più approfondito, informazioni aggiornate o normali
strumenti OpenClaw, può chiamare `openclaw_agent_consult`.

Lo strumento di consultazione esegue dietro le quinte il normale agente OpenClaw con il contesto recente
della trascrizione della riunione e restituisce una risposta parlata concisa alla sessione vocale
in tempo reale. Il modello vocale può quindi pronunciare quella risposta nella riunione.
Usa lo stesso strumento di consultazione in tempo reale condiviso di Voice Call.

Per impostazione predefinita, le consultazioni vengono eseguite sull'agente `main`. Imposta `realtime.agentId` quando una
corsia Meet deve consultare uno spazio di lavoro agente OpenClaw dedicato, impostazioni predefinite del modello,
policy degli strumenti, memoria e cronologia della sessione.

`realtime.toolPolicy` controlla l'esecuzione della consultazione:

- `safe-read-only`: espone lo strumento di consultazione e limita il normale agente a
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` e
  `memory_get`.
- `owner`: espone lo strumento di consultazione e consente al normale agente di usare la normale
  policy degli strumenti dell'agente.
- `none`: non espone lo strumento di consultazione al modello vocale in tempo reale.

La chiave della sessione di consultazione ha ambito per sessione Meet, quindi le chiamate di consultazione successive
possono riutilizzare il contesto di consultazione precedente durante la stessa riunione.

Per forzare un controllo di prontezza parlato dopo che Chrome ha completato l'accesso alla chiamata:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Per lo smoke completo di accesso e parlato:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Checklist del test live

Usa questa sequenza prima di affidare una riunione a un agente non presidiato:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Stato Chrome-node previsto:

- `googlemeet setup` è tutto verde.
- `googlemeet setup` include `chrome-node-connected` quando Chrome-node è il
  trasporto predefinito o un node è fissato.
- `nodes status` mostra il node selezionato connesso.
- Il node selezionato pubblicizza sia `googlemeet.chrome` sia `browser.proxy`.
- La scheda Meet entra nella chiamata e `test-speech` restituisce lo stato di salute di Chrome con
  `inCall: true`.

Per un host Chrome remoto, ad esempio una VM macOS Parallels, questo è il controllo sicuro
più breve dopo l'aggiornamento del Gateway o della VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Questo dimostra che il plugin Gateway è caricato, che il node della VM è connesso con il
token corrente e che il bridge audio Meet è disponibile prima che un agente apra una
vera scheda di riunione.

Per uno smoke Twilio, usa una riunione che espone i dettagli di accesso telefonico:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Stato Twilio previsto:

- `googlemeet setup` include controlli verdi `twilio-voice-call-plugin` e
  `twilio-voice-call-credentials`.
- `voicecall` è disponibile nella CLI dopo il ricaricamento del Gateway.
- La sessione restituita ha `transport: "twilio"` e un `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` chiude la chiamata vocale delegata.

## Risoluzione dei problemi

### L'agente non vede lo strumento Google Meet

Conferma che il plugin sia abilitato nella configurazione del Gateway e ricarica il Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Se hai appena modificato `plugins.entries.google-meet`, riavvia o ricarica il Gateway.
L'agente in esecuzione vede solo gli strumenti del plugin registrati dal processo Gateway
corrente.

### Nessun node con capacità Google Meet connesso

Sull'host del node, esegui:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Sull'host Gateway, approva il node e verifica i comandi:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Il node deve essere connesso ed elencare `googlemeet.chrome` più `browser.proxy`.
La configurazione del Gateway deve consentire quei comandi node:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Se `googlemeet setup` fallisce `chrome-node-connected` o il log del Gateway segnala
`gateway token mismatch`, reinstalla o riavvia il node con il token Gateway
corrente. Per un Gateway LAN questo di solito significa:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Poi ricarica il servizio node e riesegui:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Il browser si apre ma l'agente non riesce a entrare

Esegui `googlemeet test-speech` e ispeziona lo stato di salute di Chrome restituito. Se
segnala `manualActionRequired: true`, mostra `manualActionMessage` all'operatore
e smetti di riprovare finché l'azione nel browser non è completa.

Azioni manuali comuni:

- Accedere al profilo Chrome.
- Ammettere l'ospite dall'account host Meet.
- Concedere le autorizzazioni microfono/fotocamera di Chrome quando compare il prompt di autorizzazione nativo
  di Chrome.
- Chiudere o riparare una finestra di dialogo di autorizzazione Meet bloccata.

Non segnalare "not signed in" solo perché Meet mostra "Do you want people to
hear you in the meeting?" Quello è l'interstiziale di scelta audio di Meet; OpenClaw
fa clic su **Use microphone** tramite automazione del browser quando disponibile e continua ad
attendere il vero stato della riunione. Per il fallback browser di sola creazione, OpenClaw
può fare clic su **Continue without microphone** perché la creazione dell'URL non richiede
il percorso audio in tempo reale.

### La creazione della riunione fallisce

`googlemeet create` usa prima l'endpoint Google Meet API `spaces.create`
quando le credenziali OAuth sono configurate. Senza credenziali OAuth ripiega
sul browser del node Chrome fissato. Conferma:

- Per la creazione via API: `oauth.clientId` e `oauth.refreshToken` sono configurati,
  oppure sono presenti variabili d'ambiente `OPENCLAW_GOOGLE_MEET_*` corrispondenti.
- Per la creazione via API: il token di aggiornamento è stato generato dopo l'aggiunta del supporto alla creazione.
  I token più vecchi potrebbero non avere lo scope `meetings.space.created`; riesegui
  `openclaw googlemeet auth login --json` e aggiorna la configurazione del plugin.
- Per il fallback browser: `defaultTransport: "chrome-node"` e
  `chromeNode.node` puntano a un node connesso con `browser.proxy` e
  `googlemeet.chrome`.
- Per il fallback browser: il profilo Chrome OpenClaw su quel node ha effettuato l'accesso
  a Google e può aprire `https://meet.google.com/new`.
- Per il fallback browser: i tentativi riutilizzano una scheda esistente `https://meet.google.com/new`
  o una scheda di prompt dell'account Google prima di aprire una nuova scheda. Se un agente va in timeout,
  ritenta la chiamata dello strumento invece di aprire manualmente un'altra scheda Meet.
- Per il fallback browser: se lo strumento restituisce `manualActionRequired: true`, usa
  i valori restituiti `browser.nodeId`, `browser.targetId`, `browserUrl` e
  `manualActionMessage` per guidare l'operatore. Non riprovare in loop finché tale
  azione non è completa.
- Per il fallback browser: se Meet mostra "Do you want people to hear you in the
  meeting?", lascia aperta la scheda. OpenClaw dovrebbe fare clic su **Use microphone** o, per il
  fallback di sola creazione, su **Continue without microphone** tramite
  automazione del browser e continuare ad attendere l'URL Meet generato. Se non può, l'errore
  dovrebbe menzionare `meet-audio-choice-required`, non `google-login-required`.

### L'agente entra ma non parla

Controlla il percorso in tempo reale:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Usa `mode: "realtime"` per ascolto/risposta parlata. `mode: "transcribe"` intenzionalmente
non avvia il bridge vocale duplex in tempo reale. `googlemeet test-speech`
controlla sempre il percorso in tempo reale e segnala se sono stati osservati byte di output del bridge
per quella invocazione. Se `speechOutputVerified` è false e
`speechOutputTimedOut` è true, il provider in tempo reale potrebbe aver accettato
l'enunciato ma OpenClaw non ha visto nuovi byte di output raggiungere il bridge audio
di Chrome.

Verifica anche:

- Una chiave del provider in tempo reale è disponibile sull'host Gateway, ad esempio
  `OPENAI_API_KEY` o `GEMINI_API_KEY`.
- `BlackHole 2ch` è visibile sull'host Chrome.
- `sox` esiste sull'host Chrome.
- Il microfono e l'altoparlante di Meet sono instradati attraverso il percorso audio virtuale usato da
  OpenClaw.

`googlemeet doctor [session-id]` stampa sessione, node, stato in chiamata,
motivo dell'azione manuale, connessione del provider in tempo reale, `realtimeReady`, attività
di input/output audio, timestamp dell'ultimo audio, contatori di byte e URL del browser.
Usa `googlemeet status [session-id]` quando ti serve il JSON grezzo. Usa
`googlemeet doctor --oauth` quando devi verificare l'aggiornamento OAuth di Google Meet
senza esporre token; aggiungi `--meeting` o `--create-space` quando ti serve anche una
prova Google Meet API.

Se un agente è andato in timeout e vedi una scheda Meet già aperta, ispeziona quella scheda
senza aprirne un'altra:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

L'azione dello strumento equivalente è `recover_current_tab`. Mette a fuoco e ispeziona una
scheda Meet esistente per il trasporto selezionato. Con `chrome`, usa il controllo
browser locale tramite il Gateway; con `chrome-node`, usa il node Chrome configurato.
Non apre una nuova scheda né crea una nuova sessione; segnala il
blocco corrente, come login, ammissione, autorizzazioni o stato di scelta audio.
Il comando CLI parla con il Gateway configurato, quindi il Gateway deve essere in esecuzione;
`chrome-node` richiede anche che il node Chrome sia connesso.

### I controlli di configurazione Twilio falliscono

`twilio-voice-call-plugin` fallisce quando `voice-call` non è consentito o non è abilitato.
Aggiungilo a `plugins.allow`, abilita `plugins.entries.voice-call` e ricarica il
Gateway.

`twilio-voice-call-credentials` fallisce quando al backend Twilio mancano l'account
SID, il token di autenticazione o il numero del chiamante. Impostali sull'host del Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Quindi riavvia o ricarica il Gateway ed esegui:

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` è solo un controllo di prontezza per impostazione predefinita. Per simulare un numero specifico:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Aggiungi `--yes` solo quando vuoi intenzionalmente effettuare una chiamata di notifica
in uscita reale:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### La chiamata Twilio parte ma non entra mai nella riunione

Conferma che l'evento Meet esponga i dettagli di accesso telefonico. Passa il numero
di accesso telefonico esatto e il PIN oppure una sequenza DTMF personalizzata:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Usa `w` iniziali o virgole in `--dtmf-sequence` se il provider richiede una pausa
prima di inserire il PIN.

## Note

L'API multimediale ufficiale di Google Meet è orientata alla ricezione, quindi parlare in una chiamata Meet
richiede comunque un percorso da partecipante. Questo plugin mantiene visibile questo confine:
Chrome gestisce la partecipazione dal browser e il routing audio locale; Twilio gestisce
la partecipazione tramite accesso telefonico.

La modalità in tempo reale di Chrome richiede `BlackHole 2ch` più una delle seguenti opzioni:

- `chrome.audioInputCommand` più `chrome.audioOutputCommand`: OpenClaw possiede il
  bridge del modello in tempo reale e convoglia l'audio in `chrome.audioFormat` tra quei
  comandi e il provider vocale in tempo reale selezionato. Il percorso Chrome predefinito è
  PCM16 a 24 kHz; G.711 mu-law a 8 kHz resta disponibile per le coppie di comandi legacy.
- `chrome.audioBridgeCommand`: un comando bridge esterno possiede l'intero percorso
  audio locale e deve terminare dopo aver avviato o validato il suo daemon.

Per un audio duplex pulito, instrada l'output di Meet e il microfono di Meet attraverso dispositivi
virtuali separati o un grafo di dispositivi virtuali in stile Loopback. Un singolo dispositivo
BlackHole condiviso può rimandare l'eco degli altri partecipanti nella chiamata.

`googlemeet speak` attiva il bridge audio in tempo reale attivo per una sessione Chrome.
`googlemeet leave` arresta quel bridge. Per le sessioni Twilio delegate
tramite il plugin Voice Call, `leave` riaggancia anche la chiamata vocale sottostante.

## Correlati

- [Plugin per chiamate vocali](/it/plugins/voice-call)
- [Modalità conversazione](/it/nodes/talk)
- [Creazione di plugin](/it/plugins/building-plugins)
