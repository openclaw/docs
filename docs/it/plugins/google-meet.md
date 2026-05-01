---
read_when:
    - Vuoi che un agente OpenClaw partecipi a una chiamata Google Meet
    - Vuoi che un agente OpenClaw crei una nuova chiamata Google Meet
    - Stai configurando Chrome, un nodo Chrome o Twilio come trasporto di Google Meet
summary: 'Plugin Google Meet: accesso a URL Meet espliciti tramite Chrome o Twilio con impostazioni predefinite per la voce in tempo reale'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-01T08:32:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9d0d195fc709e487ef1bf5603fdb32fade1b6a0a13aa9bed5110979490f92ff
    source_path: plugins/google-meet.md
    workflow: 16
---

Il supporto dei partecipanti Google Meet per OpenClaw è esplicito per progettazione:

- Partecipa solo a un URL esplicito `https://meet.google.com/...`.
- Può creare un nuovo spazio Meet tramite l'API Google Meet, quindi partecipare all'URL
  restituito.
- `realtime` voice è la modalità predefinita.
- Realtime voice può richiamare l'agente OpenClaw completo quando servono
  ragionamento più approfondito o strumenti.
- Gli agenti scelgono il comportamento di partecipazione con `mode`: usa `realtime` per ascolto/risposta vocale
  dal vivo, oppure `transcribe` per partecipare/controllare il browser senza il
  bridge realtime voice.
- L'autenticazione inizia come OAuth Google personale o come profilo Chrome già connesso.
- Non c'è alcun annuncio automatico del consenso.
- Il backend audio predefinito di Chrome è `BlackHole 2ch`.
- Chrome può essere eseguito localmente o su un host Node associato.
- Twilio accetta un numero dial-in più un PIN opzionale o una sequenza DTMF.
- Il comando CLI è `googlemeet`; `meet` è riservato a workflow di teleconferenza
  più ampi dell'agente.

## Avvio rapido

Installa le dipendenze audio locali e configura un provider realtime voice
backend. OpenAI è il predefinito; anche Google Gemini Live funziona con
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` installa il dispositivo audio virtuale `BlackHole 2ch`. L'installer di Homebrew
richiede un riavvio prima che macOS esponga il dispositivo:

```bash
sudo reboot
```

Dopo il riavvio, verifica entrambi gli elementi:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
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

L'output di configurazione è pensato per essere leggibile dagli agenti e consapevole della modalità. Riporta il profilo Chrome,
il pinning del Node e, per le partecipazioni Chrome realtime, il bridge audio BlackHole/SoX
e i controlli dell'introduzione realtime ritardata. Per partecipazioni solo osservazione, controlla lo stesso
trasporto con `--mode transcribe`; quella modalità salta i prerequisiti audio realtime
perché non ascolta né parla attraverso il bridge:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Quando la delega Twilio è configurata, la configurazione segnala anche se il
Plugin `voice-call`, le credenziali Twilio e l'esposizione Webhook pubblica sono pronti.
Tratta qualsiasi controllo `ok: false` come un blocco per il trasporto e la modalità controllati
prima di chiedere a un agente di partecipare. Usa `openclaw googlemeet setup --json` per
script o output leggibile dalla macchina. Usa `--transport chrome`,
`--transport chrome-node` o `--transport twilio` per pre-verificare un trasporto specifico
prima che un agente provi a usarlo.

Per Twilio, pre-verifica sempre il trasporto in modo esplicito quando il trasporto predefinito
è Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Questo intercetta cablaggio `voice-call` mancante, credenziali Twilio o esposizione
Webhook non raggiungibile prima che l'agente provi a chiamare la riunione.

Partecipa a una riunione:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Oppure lascia che un agente partecipi tramite lo strumento `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Crea una nuova riunione e partecipavi:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Crea solo l'URL senza partecipare:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` ha due percorsi:

- Creazione API: usata quando le credenziali OAuth di Google Meet sono configurate. Questo è
  il percorso più deterministico e non dipende dallo stato dell'interfaccia del browser.
- Fallback browser: usato quando le credenziali OAuth sono assenti. OpenClaw usa il
  Node Chrome fissato, apre `https://meet.google.com/new`, aspetta che Google
  reindirizzi a un vero URL con codice riunione, quindi restituisce quell'URL. Questo percorso richiede
  che il profilo Chrome di OpenClaw sul Node sia già connesso a Google.
  L'automazione del browser gestisce il prompt del microfono al primo avvio di Meet; quel prompt
  non è trattato come errore di accesso a Google.
  Anche i flussi di partecipazione e creazione provano a riutilizzare una scheda Meet esistente prima di aprirne una
  nuova. La corrispondenza ignora query string URL innocue come `authuser`, quindi un
  nuovo tentativo dell'agente dovrebbe focalizzare la riunione già aperta invece di creare una seconda
  scheda Chrome.

L'output del comando/strumento include un campo `source` (`api` o `browser`) così gli agenti
possono spiegare quale percorso è stato usato. `create` partecipa alla nuova riunione per impostazione predefinita e
restituisce `joined: true` più la sessione di partecipazione. Per generare solo l'URL, usa
`create --no-join` nella CLI oppure passa `"join": false` allo strumento.

Oppure di' a un agente: "Crea un Google Meet, partecipavi con realtime voice e inviami
il link." L'agente dovrebbe chiamare `google_meet` con `action: "create"` e
poi condividere il `meetingUri` restituito.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Per una partecipazione solo osservazione/controllo browser, imposta `"mode": "transcribe"`. Questo non
avvia il bridge duplex del modello realtime, non richiede BlackHole o SoX
e non risponderà vocalmente nella riunione. Le partecipazioni Chrome in questa modalità evitano anche
la concessione del permesso microfono/camera di OpenClaw ed evitano il percorso **Usa
microfono** di Meet. Se Meet mostra un interstiziale di scelta audio, l'automazione prova
il percorso senza microfono e altrimenti segnala un'azione manuale invece di aprire
il microfono locale.

Durante le sessioni realtime, lo stato di `google_meet` include la salute del browser e del bridge audio
come `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, ultimi timestamp di input/output,
contatori di byte e stato di chiusura del bridge. Se appare un prompt sicuro della pagina Meet,
l'automazione del browser lo gestisce quando può. Accesso, ammissione dell'host e
prompt di permesso browser/OS sono segnalati come azione manuale con un motivo e
un messaggio da far riferire all'agente. Le sessioni Chrome gestite emettono l'introduzione o
la frase di test solo dopo che la salute del browser riporta `inCall: true`; altrimenti lo stato riporta
`speechReady: false` e il tentativo di parlato viene bloccato invece di fingere che
l'agente abbia parlato nella riunione.

Le partecipazioni Chrome locali passano attraverso il profilo browser OpenClaw connesso. La modalità realtime
richiede `BlackHole 2ch` per il percorso microfono/altoparlante usato da OpenClaw. Per
audio duplex pulito, usa dispositivi virtuali separati o un grafo in stile Loopback; un
singolo dispositivo BlackHole è sufficiente per un primo smoke test ma può creare eco.

### Gateway locale + Chrome Parallels

Non serve un Gateway OpenClaw completo o una chiave API del modello dentro una VM macOS
solo per fare in modo che la VM possieda Chrome. Esegui il Gateway e l'agente localmente, quindi esegui un
host Node nella VM. Abilita una volta il Plugin incluso nella VM così il Node
pubblicizza il comando Chrome:

Cosa viene eseguito dove:

- Host Gateway: OpenClaw Gateway, workspace dell'agente, chiavi modello/API, provider realtime
  e configurazione del Plugin Google Meet.
- VM macOS Parallels: OpenClaw CLI/host Node, Google Chrome, SoX, BlackHole 2ch
  e un profilo Chrome connesso a Google.
- Non necessario nella VM: servizio Gateway, configurazione dell'agente, chiave OpenAI/GPT o configurazione
  del provider modello.

Installa le dipendenze della VM:

```bash
brew install blackhole-2ch sox
```

Riavvia la VM dopo aver installato BlackHole affinché macOS esponga `BlackHole 2ch`:

```bash
sudo reboot
```

Dopo il riavvio, verifica che la VM veda il dispositivo audio e i comandi SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Installa o aggiorna OpenClaw nella VM, quindi abilita lì il Plugin incluso:

```bash
openclaw plugins enable google-meet
```

Avvia l'host Node nella VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Se `<gateway-host>` è un IP LAN e non stai usando TLS, il Node rifiuta il
WebSocket in chiaro a meno che tu non aderisca esplicitamente per quella rete privata attendibile:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` è ambiente di processo, non un'impostazione
`openclaw.json`. `openclaw node install` la memorizza nell'ambiente LaunchAgent
quando è presente sul comando di installazione.

Approva il Node dall'host Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Conferma che il Gateway veda il Node e che pubblicizzi sia `googlemeet.chrome`
sia la capacità browser/`browser.proxy`:

```bash
openclaw nodes status
```

Instrada Meet attraverso quel Node sull'host Gateway:

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

Ora partecipa normalmente dall'host Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

oppure chiedi all'agente di usare lo strumento `google_meet` con `transport: "chrome-node"`.

Per uno smoke test a comando singolo che crea o riutilizza una sessione, pronuncia una frase
nota e stampa la salute della sessione:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Durante la partecipazione realtime, l'automazione browser di OpenClaw compila il nome ospite, fa clic su
Partecipa/Chiedi di partecipare e accetta la scelta "Usa microfono" al primo avvio di Meet quando quel
prompt appare. Durante la partecipazione solo osservazione o la creazione riunione solo browser, continua
oltre lo stesso prompt senza microfono quando quella scelta è disponibile.
Se il profilo browser non è connesso, Meet è in attesa dell'ammissione dell'host,
Chrome necessita del permesso microfono/camera per una partecipazione realtime, oppure Meet è bloccato
su un prompt che l'automazione non è riuscita a risolvere, il risultato di join/test-speech riporta
`manualActionRequired: true` con `manualActionReason` e
`manualActionMessage`. Gli agenti dovrebbero smettere di ritentare la partecipazione, riportare quel messaggio esatto
più gli attuali `browserUrl`/`browserTitle`, e riprovare solo dopo che
l'azione manuale nel browser è completa.

Se `chromeNode.node` è omesso, OpenClaw seleziona automaticamente solo quando esattamente un
Node connesso pubblicizza sia `googlemeet.chrome` sia il controllo browser. Se
sono connessi diversi Node capaci, imposta `chromeNode.node` sull'id del Node,
sul nome visualizzato o sull'IP remoto.

Controlli comuni degli errori:

- `Configured Google Meet node ... is not usable: offline`: il nodo fissato è
  noto al Gateway ma non è disponibile. Gli agenti devono trattare quel nodo come
  stato diagnostico, non come host Chrome utilizzabile, e segnalare il blocco di
  configurazione invece di ricorrere a un altro transport, salvo che l'utente lo
  abbia richiesto.
- `No connected Google Meet-capable node`: avvia `openclaw node run` nella VM,
  approva l'abbinamento e assicurati che `openclaw plugins enable google-meet` e
  `openclaw plugins enable browser` siano stati eseguiti nella VM. Conferma
  inoltre che l'host Gateway consenta entrambi i comandi del nodo con
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: installa `blackhole-2ch` sull'host
  controllato e riavvia prima di usare l'audio di Chrome locale.
- `BlackHole 2ch audio device not found on the node`: installa `blackhole-2ch`
  nella VM e riavvia la VM.
- Chrome si apre ma non riesce a partecipare: accedi al profilo del browser
  dentro la VM, oppure mantieni impostato `chrome.guestName` per partecipare come
  ospite. La partecipazione automatica come ospite usa l'automazione del browser
  OpenClaw tramite il proxy browser del nodo; assicurati che la configurazione del
  browser del nodo punti al profilo desiderato, per esempio
  `browser.defaultProfile: "user"` o un profilo di sessione esistente con nome.
- Schede Meet duplicate: lascia abilitato `chrome.reuseExistingTab: true`.
  OpenClaw attiva una scheda esistente per lo stesso URL Meet prima di aprirne
  una nuova, e la creazione di riunioni dal browser riusa una scheda
  `https://meet.google.com/new` in corso o una scheda di richiesta dell'account
  Google prima di aprirne un'altra.
- Nessun audio: in Meet, instrada microfono/altoparlante tramite il percorso del
  dispositivo audio virtuale usato da OpenClaw; usa dispositivi virtuali separati
  o instradamento in stile Loopback per un audio duplex pulito.

## Note di installazione

L'impostazione predefinita realtime di Chrome usa due strumenti esterni:

- `sox`: utilità audio da riga di comando. Il Plugin usa comandi espliciti per
  dispositivi CoreAudio per il bridge audio PCM16 predefinito a 24 kHz.
- `blackhole-2ch`: driver audio virtuale per macOS. Crea il dispositivo audio
  `BlackHole 2ch` attraverso cui Chrome/Meet può instradare l'audio.

OpenClaw non include né ridistribuisce nessuno dei due pacchetti. La
documentazione chiede agli utenti di installarli come dipendenze dell'host tramite
Homebrew. SoX è concesso in licenza come `LGPL-2.0-only AND GPL-2.0-only`;
BlackHole è GPL-3.0. Se crei un installer o un appliance che include BlackHole
con OpenClaw, verifica i termini di licenza upstream di BlackHole oppure ottieni
una licenza separata da Existential Audio.

## Transport

### Chrome

Il transport Chrome apre l'URL Meet tramite il controllo browser di OpenClaw e
partecipa con il profilo browser OpenClaw autenticato. Su macOS, il Plugin
controlla la presenza di `BlackHole 2ch` prima dell'avvio. Se configurato, esegue
anche un comando di salute del bridge audio e un comando di avvio prima di aprire
Chrome. Usa `chrome` quando Chrome/audio sono sull'host Gateway; usa
`chrome-node` quando Chrome/audio sono su un nodo abbinato, come una VM macOS
Parallels. Per Chrome locale, scegli il profilo con `browser.defaultProfile`;
`chrome.browserProfile` viene passato agli host `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Instrada l'audio del microfono e dell'altoparlante di Chrome tramite il bridge
audio OpenClaw locale. Se `BlackHole 2ch` non è installato, la partecipazione
fallisce con un errore di configurazione invece di partecipare silenziosamente
senza un percorso audio.

### Twilio

Il transport Twilio è un dial plan rigoroso delegato al Plugin Voice Call. Non
analizza le pagine Meet per trovare numeri di telefono.

Usalo quando la partecipazione tramite Chrome non è disponibile o vuoi una
soluzione di fallback con chiamata telefonica. Google Meet deve esporre un numero
di accesso telefonico e un PIN per la riunione; OpenClaw non li ricava dalla
pagina Meet.

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

Riavvia o ricarica il Gateway dopo aver abilitato `voice-call`; le modifiche alla
configurazione dei Plugin non compaiono in un processo Gateway già in esecuzione
finché non viene ricaricato.

Poi verifica:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Quando la delega Twilio è collegata, `googlemeet setup` include controlli
`twilio-voice-call-plugin`, `twilio-voice-call-credentials` e
`twilio-voice-call-webhook` riusciti.

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

OAuth è facoltativo per creare un link Meet perché `googlemeet create` può
ricorrere all'automazione del browser. Configura OAuth quando vuoi la creazione
tramite API ufficiale, la risoluzione degli spazi o i controlli preflight
dell'API Meet Media.

L'accesso all'API Google Meet usa OAuth utente: crea un client OAuth Google
Cloud, richiedi gli scope necessari, autorizza un account Google, quindi salva il
refresh token risultante nella configurazione del Plugin Google Meet oppure
fornisci le variabili d'ambiente `OPENCLAW_GOOGLE_MEET_*`.

OAuth non sostituisce il percorso di partecipazione tramite Chrome. I transport
Chrome e Chrome-node partecipano comunque tramite un profilo Chrome autenticato,
BlackHole/SoX e un nodo connesso quando usi la partecipazione via browser. OAuth
serve solo per il percorso ufficiale dell'API Google Meet: creare spazi riunione,
risolvere spazi ed eseguire controlli preflight dell'API Meet Media.

### Creare le credenziali Google

In Google Cloud Console:

1. Crea o seleziona un progetto Google Cloud.
2. Abilita **Google Meet REST API** per quel progetto.
3. Configura la schermata di consenso OAuth.
   - **Internal** è l'opzione più semplice per un'organizzazione Google Workspace.
   - **External** funziona per configurazioni personali/di test; mentre l'app è
     in Testing, aggiungi come utente di test ogni account Google che autorizzerà
     l'app.
4. Aggiungi gli scope richiesti da OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Crea un ID client OAuth.
   - Tipo di applicazione: **Web application**.
   - URI di reindirizzamento autorizzato:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Copia l'ID client e il client secret.

`meetings.space.created` è richiesto da Google Meet `spaces.create`.
`meetings.space.readonly` consente a OpenClaw di risolvere URL/codici Meet in
spazi. `meetings.conference.media.readonly` serve per il preflight dell'API Meet
Media e per il lavoro sui media; Google potrebbe richiedere l'iscrizione alla
Developer Preview per l'uso effettivo dell'API Media. Se ti servono solo
partecipazioni Chrome basate su browser, salta completamente OAuth.

### Generare il refresh token

Configura `oauth.clientId` e, facoltativamente, `oauth.clientSecret`, oppure
passali come variabili d'ambiente, quindi esegui:

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

Usa la modalità manuale quando il browser non riesce a raggiungere il callback
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

Preferisci le variabili d'ambiente quando non vuoi il refresh token nella
configurazione. Se sono presenti sia valori di configurazione sia valori
d'ambiente, il Plugin risolve prima la configurazione e poi usa l'ambiente come
fallback.

Il consenso OAuth include creazione di spazi Meet, accesso in lettura agli spazi
Meet e accesso in lettura ai media delle conferenze Meet. Se ti sei autenticato
prima che esistesse il supporto alla creazione di riunioni, riesegui
`openclaw googlemeet auth login --json` in modo che il refresh token abbia lo
scope `meetings.space.created`.

### Verificare OAuth con doctor

Esegui il doctor OAuth quando vuoi un controllo di salute rapido e senza segreti:

```bash
openclaw googlemeet doctor --oauth --json
```

Questo non carica il runtime Chrome né richiede un nodo Chrome connesso. Controlla
che la configurazione OAuth esista e che il refresh token possa generare un
access token. Il report JSON include solo campi di stato come `ok`,
`configured`, `tokenSource`, `expiresAt` e messaggi dei controlli; non stampa
l'access token, il refresh token o il client secret.

Risultati comuni:

| Controllo            | Significato                                                                            |
| -------------------- | -------------------------------------------------------------------------------------- |
| `oauth-config`       | Sono presenti `oauth.clientId` più `oauth.refreshToken`, oppure un access token in cache. |
| `oauth-token`        | L'access token in cache è ancora valido, oppure il refresh token ha generato un nuovo access token. |
| `meet-spaces-get`    | Il controllo facoltativo `--meeting` ha risolto uno spazio Meet esistente.             |
| `meet-spaces-create` | Il controllo facoltativo `--create-space` ha creato un nuovo spazio Meet.              |

Per dimostrare anche l'abilitazione dell'API Google Meet e lo scope
`spaces.create`, esegui il controllo di creazione con effetti collaterali:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` crea un URL Meet usa e getta. Usalo quando devi confermare che
il progetto Google Cloud abbia l'API Meet abilitata e che l'account autorizzato
abbia lo scope `meetings.space.created`.

Per dimostrare l'accesso in lettura a uno spazio riunione esistente:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` e `resolve-space` dimostrano l'accesso in lettura a
uno spazio esistente a cui l'account Google autorizzato può accedere. Un `403` da
questi controlli di solito significa che l'API Google Meet REST è disabilitata,
che al refresh token autorizzato manca lo scope richiesto, oppure che l'account
Google non può accedere a quello spazio Meet. Un errore di refresh-token significa
che devi rieseguire `openclaw googlemeet auth login --json` e salvare il nuovo
blocco `oauth`.

Non servono credenziali OAuth per il fallback del browser. In quella modalità,
l'autenticazione Google proviene dal profilo Chrome autenticato sul nodo
selezionato, non dalla configurazione OpenClaw.

Queste variabili d'ambiente sono accettate come fallback:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` o `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` o `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` o `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` o `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` o
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` o `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` o `GOOGLE_MEET_PREVIEW_ACK`

Risolvi un URL Meet, un codice o `spaces/{id}` tramite `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Esegui il preflight prima delle operazioni multimediali:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Elenca gli artefatti della riunione e le presenze dopo che Meet ha creato i record della conferenza:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Con `--meeting`, `artifacts` e `attendance` usano per impostazione predefinita il record della conferenza più recente. Passa `--all-conference-records` quando vuoi tutti i record conservati per quella riunione.

La ricerca nel calendario può risolvere l'URL della riunione da Google Calendar prima di leggere gli artefatti Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` cerca nel calendario `primary` di oggi un evento Calendar con un link Google Meet. Usa `--event <query>` per cercare testo corrispondente negli eventi e `--calendar <id>` per un calendario non principale. La ricerca nel calendario richiede un nuovo accesso OAuth che includa l'ambito di sola lettura degli eventi Calendar. `calendar-events` mostra un'anteprima degli eventi Meet corrispondenti e contrassegna l'evento che `latest`, `artifacts`, `attendance` o `export` sceglierà.

Se conosci già l'id del record della conferenza, indirizzalo direttamente:

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

`artifacts` restituisce i metadati del record della conferenza più i metadati delle risorse di partecipanti, registrazioni, trascrizioni, voci di trascrizione strutturate e note intelligenti quando Google li espone per la riunione. Usa `--no-transcript-entries` per saltare la ricerca delle voci nelle riunioni di grandi dimensioni. `attendance` espande i partecipanti in righe di sessione partecipante con orari di prima/ultima visualizzazione, durata totale della sessione, flag di ritardo/uscita anticipata e risorse partecipante duplicate unite per utente connesso o nome visualizzato. Passa `--no-merge-duplicates` per mantenere separate le risorse partecipante grezze, `--late-after-minutes` per regolare il rilevamento dei ritardi e `--early-before-minutes` per regolare il rilevamento delle uscite anticipate.

`export` scrive una cartella contenente `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` e `manifest.json`. `manifest.json` registra l'input scelto, le opzioni di esportazione, i record della conferenza, i file di output, i conteggi, la sorgente del token, l'evento Calendar quando ne è stato usato uno e qualsiasi avviso di recupero parziale. Passa `--zip` per scrivere anche un archivio portatile accanto alla cartella. Passa `--include-doc-bodies` per esportare il testo dei Google Docs collegati di trascrizioni e note intelligenti tramite Google Drive `files.export`; questo richiede un nuovo accesso OAuth che includa l'ambito di sola lettura Drive Meet. Senza `--include-doc-bodies`, le esportazioni includono solo metadati Meet e voci di trascrizione strutturate. Se Google restituisce un errore parziale sugli artefatti, ad esempio un errore di elenco delle note intelligenti, di voce di trascrizione o di corpo documento Drive, il riepilogo e il manifest mantengono l'avviso invece di far fallire l'intera esportazione. Usa `--dry-run` per recuperare gli stessi dati di artefatti/presenze e stampare il JSON del manifest senza creare la cartella o lo ZIP. È utile prima di scrivere una grande esportazione o quando un agente ha bisogno solo di conteggi, record selezionati e avvisi.

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

Imposta `"dryRun": true` per restituire solo il manifest di esportazione e saltare le scritture dei file.

Esegui lo smoke live protetto su una riunione reale conservata:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Ambiente smoke live:

- `OPENCLAW_LIVE_TEST=1` abilita i test live protetti.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` punta a un URL Meet, un codice o `spaces/{id}` conservato.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` o `GOOGLE_MEET_CLIENT_ID` fornisce l'id client OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` o `GOOGLE_MEET_REFRESH_TOKEN` fornisce il token di aggiornamento.
- Facoltativo: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` e `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` usano gli stessi nomi di fallback senza il prefisso `OPENCLAW_`.

Lo smoke live di base per artefatti/presenze richiede `https://www.googleapis.com/auth/meetings.space.readonly` e `https://www.googleapis.com/auth/meetings.conference.media.readonly`. La ricerca nel calendario richiede `https://www.googleapis.com/auth/calendar.events.readonly`. L'esportazione del corpo documento Drive richiede `https://www.googleapis.com/auth/drive.meet.readonly`.

Crea un nuovo spazio Meet:

```bash
openclaw googlemeet create
```

Il comando stampa il nuovo `meeting uri`, la sorgente e la sessione di accesso. Con credenziali OAuth usa l'API Google Meet ufficiale. Senza credenziali OAuth usa come fallback il profilo browser con accesso eseguito del Node Chrome fissato. Gli agenti possono usare lo strumento `google_meet` con `action: "create"` per creare e partecipare in un solo passaggio. Per la creazione solo URL, passa `"join": false`.

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

Se il fallback del browser incontra l'accesso Google o un blocco di autorizzazione Meet prima di poter creare l'URL, il metodo Gateway restituisce una risposta non riuscita e lo strumento `google_meet` restituisce dettagli strutturati invece di una stringa semplice:

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

Quando un agente vede `manualActionRequired: true`, dovrebbe segnalare `manualActionMessage` più il contesto Node/scheda del browser e smettere di aprire nuove schede Meet finché l'operatore non completa il passaggio nel browser.

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

La creazione di un Meet partecipa per impostazione predefinita. Il trasporto Chrome o Chrome-node richiede ancora un profilo Google Chrome con accesso eseguito per partecipare tramite il browser. Se il profilo non ha eseguito l'accesso, OpenClaw segnala `manualActionRequired: true` o un errore di fallback del browser e chiede all'operatore di completare l'accesso Google prima di riprovare.

Imposta `preview.enrollmentAcknowledged: true` solo dopo aver confermato che il tuo progetto Cloud, il principale OAuth e i partecipanti alla riunione sono iscritti al Google Workspace Developer Preview Program per le API multimediali Meet.

## Configurazione

Il percorso realtime comune di Chrome richiede solo che il plugin sia abilitato, BlackHole, SoX e una chiave di provider voce realtime backend. OpenAI è l'impostazione predefinita; imposta `realtime.provider: "google"` per usare Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Imposta la configurazione del plugin in `plugins.entries.google-meet.config`:

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
- `chromeNode.node`: id/nome/IP Node facoltativo per `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: nome usato nella schermata ospite Meet senza accesso
- `chrome.autoJoin: true`: compilazione del nome ospite e clic su Partecipa ora best-effort tramite l'automazione browser di OpenClaw su `chrome-node`
- `chrome.reuseExistingTab: true`: attiva una scheda Meet esistente invece di aprire duplicati
- `chrome.waitForInCallMs: 20000`: attende che la scheda Meet segnali lo stato in chiamata prima di attivare l'introduzione realtime
- `chrome.audioFormat: "pcm16-24khz"`: formato audio della coppia di comandi. Usa `"g711-ulaw-8khz"` solo per coppie di comandi legacy/personalizzate che emettono ancora audio telefonico.
- `chrome.audioInputCommand`: comando SoX che legge da CoreAudio `BlackHole 2ch` e scrive audio in `chrome.audioFormat`
- `chrome.audioOutputCommand`: comando SoX che legge audio in `chrome.audioFormat` e scrive su CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: comando microfono locale facoltativo che scrive PCM mono little-endian con segno a 16 bit per il rilevamento dell'interruzione umana mentre la riproduzione dell'assistente è attiva. Attualmente si applica al bridge di coppia di comandi `chrome` ospitato dal Gateway.
- `chrome.bargeInRmsThreshold: 650`: livello RMS che conta come interruzione umana su `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: livello di picco che conta come interruzione umana su `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: ritardo minimo tra cancellazioni ripetute di interruzioni umane
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: brevi risposte parlate, con `openclaw_agent_consult` per risposte più approfondite
- `realtime.introMessage`: breve verifica parlata di disponibilità quando il bridge realtime si connette; impostala su `""` per partecipare in silenzio
- `realtime.agentId`: id agente OpenClaw facoltativo per `openclaw_agent_consult`; valore predefinito `main`

Override facoltativi:

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

`voiceCall.enabled` ha valore predefinito `true`; con il trasporto Twilio delega la
chiamata PSTN effettiva, il DTMF e il saluto introduttivo al Plugin Voice Call. Voice Call
riproduce la sequenza DTMF prima di aprire lo stream multimediale realtime, quindi usa il
testo introduttivo salvato come saluto realtime iniziale. Se `voice-call` non è
abilitato, Google Meet può comunque convalidare e registrare il piano di composizione, ma non può
effettuare la chiamata Twilio.

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

Usa `transport: "chrome"` quando Chrome viene eseguito sull'host Gateway. Usa
`transport: "chrome-node"` quando Chrome viene eseguito su un Node associato, ad esempio una VM Parallels.
In entrambi i casi il modello realtime e `openclaw_agent_consult` vengono eseguiti sull'host
Gateway, quindi le credenziali del modello restano lì.

Usa `action: "status"` per elencare le sessioni attive o ispezionare un ID sessione. Usa
`action: "speak"` con `sessionId` e `message` per far parlare immediatamente l'agente realtime.
Usa `action: "test_speech"` per creare o riutilizzare la sessione,
attivare una frase nota e restituire lo stato `inCall` quando l'host Chrome può
segnalarlo. `test_speech` forza sempre `mode: "realtime"` e non riesce se gli viene chiesto di
essere eseguito in `mode: "transcribe"` perché le sessioni di sola osservazione intenzionalmente non possono
emettere parlato. Il suo risultato `speechOutputVerified` si basa sull'aumento dei byte di output audio realtime
durante questa chiamata di test, quindi una sessione riutilizzata con audio precedente
non conta come nuovo controllo vocale riuscito. Usa `action: "leave"` per contrassegnare
una sessione come terminata.

`status` include lo stato di Chrome quando disponibile:

- `inCall`: Chrome sembra essere dentro la chiamata Meet
- `micMuted`: stato del microfono Meet in modalità best-effort
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: il
  profilo del browser richiede accesso manuale, ammissione da parte dell'host Meet, autorizzazioni o
  riparazione del controllo del browser prima che il parlato possa funzionare
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: indica se
  il parlato gestito da Chrome è consentito ora. `speechReady: false` significa che OpenClaw non ha
  inviato la frase introduttiva/di test nel bridge audio.
- `providerConnected` / `realtimeReady`: stato del bridge vocale realtime
- `lastInputAt` / `lastOutputAt`: ultimo audio visto dal bridge o inviato al bridge
- `lastSuppressedInputAt` / `suppressedInputBytes`: input loopback ignorato mentre
  la riproduzione dell'assistente è attiva

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Consultazione dell'agente realtime

La modalità realtime di Chrome è ottimizzata per un loop vocale dal vivo. Il provider vocale
realtime ascolta l'audio della riunione e parla attraverso il bridge audio configurato.
Quando il modello realtime ha bisogno di ragionamento più approfondito, informazioni aggiornate o normali
strumenti OpenClaw, può chiamare `openclaw_agent_consult`.

Lo strumento di consultazione esegue dietro le quinte il normale agente OpenClaw con il contesto recente
della trascrizione della riunione e restituisce una risposta parlata concisa alla sessione vocale
realtime. Il modello vocale può quindi pronunciare quella risposta nella riunione.
Usa lo stesso strumento condiviso di consultazione realtime di Voice Call.

Per impostazione predefinita, le consultazioni vengono eseguite sull'agente `main`. Imposta `realtime.agentId` quando una
corsia Meet deve consultare uno spazio di lavoro di agente OpenClaw dedicato, impostazioni predefinite del modello,
policy degli strumenti, memoria e cronologia della sessione.

`realtime.toolPolicy` controlla l'esecuzione della consultazione:

- `safe-read-only`: espone lo strumento di consultazione e limita l'agente normale a
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` e
  `memory_get`.
- `owner`: espone lo strumento di consultazione e lascia che l'agente normale usi la policy degli strumenti
  dell'agente normale.
- `none`: non espone lo strumento di consultazione al modello vocale realtime.

La chiave della sessione di consultazione ha ambito per sessione Meet, quindi le chiamate di consultazione successive
possono riutilizzare il contesto di consultazione precedente durante la stessa riunione.

Per forzare un controllo di prontezza parlato dopo che Chrome ha completato l'accesso alla chiamata:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Per lo smoke test completo di accesso e parlato:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Checklist del test live

Usa questa sequenza prima di affidare una riunione a un agente non supervisionato:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Stato Chrome-node atteso:

- `googlemeet setup` è tutto verde.
- `googlemeet setup` include `chrome-node-connected` quando Chrome-node è il
  trasporto predefinito o un Node è fissato.
- `nodes status` mostra il Node selezionato connesso.
- Il Node selezionato dichiara sia `googlemeet.chrome` sia `browser.proxy`.
- La scheda Meet entra nella chiamata e `test-speech` restituisce lo stato di Chrome con
  `inCall: true`.

Per un host Chrome remoto come una VM macOS Parallels, questo è il controllo sicuro più breve
dopo l'aggiornamento del Gateway o della VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Questo dimostra che il Plugin Gateway è caricato, il Node VM è connesso con il
token corrente e il bridge audio Meet è disponibile prima che un agente apra una
vera scheda di riunione.

Per uno smoke test Twilio, usa una riunione che espone i dettagli di accesso telefonico:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Stato Twilio atteso:

- `googlemeet setup` include controlli verdi `twilio-voice-call-plugin`,
  `twilio-voice-call-credentials` e `twilio-voice-call-webhook`.
- `voicecall` è disponibile nella CLI dopo il ricaricamento del Gateway.
- La sessione restituita ha `transport: "twilio"` e un `twilio.voiceCallId`.
- `openclaw logs --follow` mostra il TwiML DTMF servito prima del TwiML realtime, poi un
  bridge realtime con il saluto iniziale in coda.
- `googlemeet leave <sessionId>` termina la chiamata vocale delegata.

## Risoluzione dei problemi

### L'agente non riesce a vedere lo strumento Google Meet

Conferma che il Plugin sia abilitato nella configurazione del Gateway e ricarica il Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Se hai appena modificato `plugins.entries.google-meet`, riavvia o ricarica il Gateway.
L'agente in esecuzione vede solo gli strumenti dei Plugin registrati dal processo Gateway
corrente.

### Nessun Node con funzionalità Google Meet connesso

Sull'host Node, esegui:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Sull'host Gateway, approva il Node e verifica i comandi:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Il Node deve essere connesso ed elencare `googlemeet.chrome` più `browser.proxy`.
La configurazione del Gateway deve consentire quei comandi Node:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Se `googlemeet setup` non supera `chrome-node-connected` o il log del Gateway segnala
`gateway token mismatch`, reinstalla o riavvia il Node con il token Gateway corrente.
Per un Gateway LAN questo di solito significa:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Poi ricarica il servizio Node ed esegui di nuovo:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Il browser si apre ma l'agente non riesce a entrare

Esegui `googlemeet test-speech` e ispeziona lo stato di Chrome restituito. Se
segnala `manualActionRequired: true`, mostra `manualActionMessage` all'operatore
e smetti di riprovare finché l'azione nel browser non è completa.

Azioni manuali comuni:

- Accedi al profilo Chrome.
- Ammetti l'ospite dall'account host Meet.
- Concedi a Chrome le autorizzazioni per microfono/fotocamera quando compare il prompt di autorizzazione nativo
  di Chrome.
- Chiudi o ripara una finestra di autorizzazione Meet bloccata.

Non segnalare "not signed in" solo perché Meet mostra "Do you want people to
hear you in the meeting?" Quello è l'interstiziale di scelta audio di Meet; OpenClaw
fa clic su **Use microphone** tramite automazione del browser quando disponibile e continua
ad attendere il vero stato della riunione. Per il fallback del browser solo per creazione, OpenClaw
può fare clic su **Continue without microphone** perché creare l'URL non richiede
il percorso audio realtime.

### La creazione della riunione non riesce

`googlemeet create` usa prima l'endpoint `spaces.create` dell'API Google Meet
quando le credenziali OAuth sono configurate. Senza credenziali OAuth, ripiega
sul browser del Node Chrome fissato. Conferma:

- Per la creazione tramite API: `oauth.clientId` e `oauth.refreshToken` sono configurati,
  oppure sono presenti variabili d'ambiente `OPENCLAW_GOOGLE_MEET_*` corrispondenti.
- Per la creazione tramite API: il token di aggiornamento è stato creato dopo che il supporto alla creazione è stato
  aggiunto. I token più vecchi potrebbero non avere lo scope `meetings.space.created`; riesegui
  `openclaw googlemeet auth login --json` e aggiorna la configurazione del Plugin.
- Per il fallback del browser: `defaultTransport: "chrome-node"` e
  `chromeNode.node` puntano a un Node connesso con `browser.proxy` e
  `googlemeet.chrome`.
- Per il fallback del browser: il profilo Chrome di OpenClaw su quel Node è connesso
  a Google e può aprire `https://meet.google.com/new`.
- Per il fallback del browser: i tentativi riutilizzano una scheda esistente `https://meet.google.com/new`
  o una scheda di prompt dell'account Google prima di aprire una nuova scheda. Se un agente va in timeout,
  riprova la chiamata allo strumento invece di aprire manualmente un'altra scheda Meet.
- Per il fallback del browser: se lo strumento restituisce `manualActionRequired: true`, usa
  `browser.nodeId`, `browser.targetId`, `browserUrl` e
  `manualActionMessage` restituiti per guidare l'operatore. Non riprovare in loop finché quell'
  azione non è completa.
- Per il fallback del browser: se Meet mostra "Do you want people to hear you in the
  meeting?", lascia aperta la scheda. OpenClaw dovrebbe fare clic su **Use microphone** o, per
  il fallback solo per creazione, su **Continue without microphone** tramite automazione del browser
  e continuare ad attendere l'URL Meet generato. Se non può farlo, l'
  errore dovrebbe menzionare `meet-audio-choice-required`, non `google-login-required`.

### L'agente entra ma non parla

Controlla il percorso realtime:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Usa `mode: "realtime"` per ascolto/risposta. `mode: "transcribe"` intenzionalmente
non avvia il bridge vocale realtime duplex. `googlemeet test-speech`
controlla sempre il percorso realtime e segnala se per quella invocazione sono
stati osservati byte di output del bridge. Se `speechOutputVerified` è false e
`speechOutputTimedOut` è true, il provider realtime potrebbe aver accettato
l'enunciato, ma OpenClaw non ha visto nuovi byte di output raggiungere il
bridge audio di Chrome.

Verifica anche:

- Una chiave provider realtime è disponibile sull'host del Gateway, ad esempio
  `OPENAI_API_KEY` o `GEMINI_API_KEY`.
- `BlackHole 2ch` è visibile sull'host di Chrome.
- `sox` esiste sull'host di Chrome.
- Microfono e altoparlante di Meet sono instradati attraverso il percorso audio
  virtuale usato da OpenClaw.

`googlemeet doctor [session-id]` stampa la sessione, il nodo, lo stato in
chiamata, il motivo dell'azione manuale, la connessione del provider realtime,
`realtimeReady`, l'attività di input/output audio, gli ultimi timestamp audio, i
contatori di byte e l'URL del browser. Usa `googlemeet status [session-id] --json`
quando ti serve il JSON grezzo. Usa `googlemeet doctor --oauth` quando devi
verificare l'aggiornamento OAuth di Google Meet senza esporre token; aggiungi
`--meeting` o `--create-space` quando ti serve anche una prova dell'API di
Google Meet.

Se un agente è andato in timeout e vedi una scheda Meet già aperta, ispeziona
quella scheda senza aprirne un'altra:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

L'azione strumento equivalente è `recover_current_tab`. Porta in primo piano e
ispeziona una scheda Meet esistente per il trasporto selezionato. Con `chrome`,
usa il controllo locale del browser tramite il Gateway; con `chrome-node`, usa
il nodo Chrome configurato. Non apre una nuova scheda né crea una nuova
sessione; segnala il blocco corrente, ad esempio stato di accesso, ammissione,
permessi o scelta audio. Il comando CLI comunica con il Gateway configurato,
quindi il Gateway deve essere in esecuzione; `chrome-node` richiede anche che il
nodo Chrome sia connesso.

### I controlli di configurazione Twilio falliscono

`twilio-voice-call-plugin` fallisce quando `voice-call` non è consentito o non è abilitato.
Aggiungilo a `plugins.allow`, abilita `plugins.entries.voice-call` e ricarica il
Gateway.

`twilio-voice-call-credentials` fallisce quando al backend Twilio mancano account
SID, token di autenticazione o numero chiamante. Impostali sull'host del Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` fallisce quando `voice-call` non ha esposizione
Webhook pubblica, oppure quando `publicUrl` punta a loopback o a spazio di rete
privato. Imposta `plugins.entries.voice-call.config.publicUrl` sull'URL pubblico
del provider oppure configura un tunnel/Tailscale per l'esposizione di
`voice-call`.

Gli URL di loopback e privati non sono validi per le callback dell'operatore.
Non usare `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` o `fd00::/8` come `publicUrl`.

Per un URL pubblico stabile:

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

Per lo sviluppo locale, usa un tunnel o un'esposizione Tailscale invece di un
URL host privato:

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

Poi riavvia o ricarica il Gateway ed esegui:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` verifica solo la prontezza per impostazione predefinita. Per
eseguire un dry run su un numero specifico:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Aggiungi `--yes` solo quando vuoi intenzionalmente effettuare una chiamata di
notifica in uscita live:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### La chiamata Twilio parte ma non entra mai nella riunione

Conferma che l'evento Meet esponga i dettagli di accesso telefonico. Passa il
numero di accesso esatto e il PIN, oppure una sequenza DTMF personalizzata:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Usa `w` iniziali o virgole in `--dtmf-sequence` se il provider richiede una
pausa prima di inserire il PIN.

Se la chiamata telefonica viene creata ma l'elenco partecipanti di Meet non
mostra mai il partecipante collegato via telefono:

- Esegui `openclaw voicecall status --call-id <id>` e conferma che la chiamata
  sia ancora attiva.
- Esegui `openclaw voicecall tail` e controlla che i Webhook Twilio stiano
  arrivando al Gateway.
- Esegui `openclaw logs --follow` e cerca la sequenza Twilio Meet: Google
  Meet delega l'accesso, Voice Call memorizza il TwiML DTMF pre-connessione,
  serve quel TwiML iniziale, poi serve il TwiML realtime e avvia il bridge
  realtime con `initialGreeting=queued`.
- Riesegui `openclaw googlemeet setup --transport twilio`; un controllo di
  configurazione verde è necessario ma non prova che la sequenza PIN della
  riunione sia corretta.
- Conferma che il numero di accesso telefonico appartenga allo stesso invito
  Meet e alla stessa regione del PIN.
- Aumenta le pause iniziali in `--dtmf-sequence` se Meet risponde lentamente, ad
  esempio `wwww123456#`.
- Se il partecipante entra ma non senti il saluto, controlla
  `openclaw logs --follow` per TwiML realtime, avvio del bridge realtime e
  `initialGreeting=queued`. Il saluto viene generato dal messaggio iniziale
  `voicecall.start` dopo la connessione del bridge realtime.

Se i Webhook non arrivano, esegui prima il debug del Plugin Voice Call: il
provider deve raggiungere `plugins.entries.voice-call.config.publicUrl` o il
tunnel configurato. Vedi [Risoluzione dei problemi delle chiamate vocali](/it/plugins/voice-call#troubleshooting).

## Note

L'API media ufficiale di Google Meet è orientata alla ricezione, quindi parlare
in una chiamata Meet richiede comunque un percorso partecipante. Questo Plugin
mantiene visibile quel confine: Chrome gestisce la partecipazione via browser e
l'instradamento audio locale; Twilio gestisce la partecipazione tramite accesso
telefonico.

La modalità realtime di Chrome richiede `BlackHole 2ch` più una delle seguenti
opzioni:

- `chrome.audioInputCommand` più `chrome.audioOutputCommand`: OpenClaw possiede
  il bridge del modello realtime e instrada l'audio in `chrome.audioFormat` tra
  quei comandi e il provider vocale realtime selezionato. Il percorso Chrome
  predefinito è PCM16 a 24 kHz; G.711 mu-law a 8 kHz rimane disponibile per le
  coppie di comandi legacy.
- `chrome.audioBridgeCommand`: un comando bridge esterno possiede l'intero
  percorso audio locale e deve uscire dopo aver avviato o validato il suo daemon.

Per audio duplex pulito, instrada l'output di Meet e il microfono di Meet
attraverso dispositivi virtuali separati o un grafo di dispositivi virtuali in
stile Loopback. Un singolo dispositivo BlackHole condiviso può rimandare in eco
gli altri partecipanti nella chiamata.

Con il bridge Chrome a coppia di comandi, `chrome.bargeInInputCommand` può
ascoltare un microfono locale separato e cancellare la riproduzione
dell'assistente quando l'umano inizia a parlare. Questo mantiene il parlato
umano davanti all'output dell'assistente anche quando l'input local loopback
BlackHole condiviso viene temporaneamente soppresso durante la riproduzione
dell'assistente. Come `chrome.audioInputCommand` e `chrome.audioOutputCommand`,
è un comando locale configurato dall'operatore. Usa un percorso di comando
esplicito e affidabile o un elenco di argomenti, e non puntarlo a script da
posizioni non attendibili.

`googlemeet speak` attiva il bridge audio realtime attivo per una sessione
Chrome. `googlemeet leave` arresta quel bridge. Per le sessioni Twilio delegate
tramite il Plugin Voice Call, `leave` riaggancia anche la chiamata vocale
sottostante.

## Correlati

- [Plugin chiamate vocali](/it/plugins/voice-call)
- [Modalità talk](/it/nodes/talk)
- [Creare Plugin](/it/plugins/building-plugins)
