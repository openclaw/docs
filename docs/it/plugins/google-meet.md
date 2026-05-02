---
read_when:
    - Vuoi che un agente OpenClaw partecipi a una chiamata Google Meet
    - Vuoi che un agente OpenClaw crei una nuova chiamata Google Meet
    - Stai configurando Chrome, un nodo Chrome o Twilio come trasporto per Google Meet
summary: 'Plugin Google Meet: accedi a URL Meet espliciti tramite Chrome o Twilio con impostazioni predefinite per la voce in tempo reale'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-02T08:29:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef6945172fed00e5583f655789fab9734e5232c6820bd3fafe7d7c4a48e2f33a
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet supporta i partecipanti per OpenClaw — il plugin è esplicito per progettazione:

- Si unisce solo a un URL esplicito `https://meet.google.com/...`.
- Può creare un nuovo spazio Meet tramite l'API Google Meet, quindi unirsi all'URL
  restituito.
- La voce `realtime` è la modalità predefinita.
- La voce in tempo reale può richiamare l'agente OpenClaw completo quando sono
  necessari ragionamenti più approfonditi o strumenti.
- Gli agenti scelgono il comportamento di partecipazione con `mode`: usa `realtime` per ascolto
  e risposta vocale dal vivo, oppure `transcribe` per unirsi/controllare il browser senza il
  bridge vocale in tempo reale.
- L'autenticazione parte come OAuth Google personale o come profilo Chrome già connesso.
- Non c'è alcun annuncio automatico di consenso.
- Il backend audio Chrome predefinito è `BlackHole 2ch`.
- Chrome può essere eseguito localmente o su un host Node associato.
- Twilio accetta un numero di accesso telefonico più un PIN opzionale o una sequenza DTMF.
- Il comando CLI è `googlemeet`; `meet` è riservato a flussi di teleconferenza
  più ampi degli agenti.

## Avvio rapido

Installa le dipendenze audio locali e configura un provider vocale in tempo reale
di backend. OpenAI è il predefinito; anche Google Gemini Live funziona con
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` installa il dispositivo audio virtuale `BlackHole 2ch`. Il programma
di installazione di Homebrew richiede un riavvio prima che macOS esponga il dispositivo:

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
della modalità. Riporta il profilo Chrome, il pinning del Node e, per le partecipazioni
Chrome in tempo reale, il bridge audio BlackHole/SoX e i controlli ritardati dell'intro
in tempo reale. Per partecipazioni di sola osservazione, controlla lo stesso trasporto
con `--mode transcribe`; quella modalità salta i prerequisiti audio in tempo reale
perché non ascolta né parla tramite il bridge:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Quando la delega Twilio è configurata, la configurazione segnala anche se il
plugin `voice-call`, le credenziali Twilio e l'esposizione pubblica del Webhook
sono pronti. Tratta qualsiasi controllo `ok: false` come un blocco per il trasporto
e la modalità controllati prima di chiedere a un agente di partecipare. Usa
`openclaw googlemeet setup --json` per script o output leggibile dalla macchina.
Usa `--transport chrome`, `--transport chrome-node` o `--transport twilio` per
precontrollare un trasporto specifico prima che un agente lo provi.

Per Twilio, precontrolla sempre il trasporto esplicitamente quando il trasporto
predefinito è Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Questo rileva cablaggio `voice-call` mancante, credenziali Twilio o esposizione
Webhook non raggiungibile prima che l'agente provi a chiamare la riunione.

Unisciti a una riunione:

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

Lo strumento `google_meet` rivolto agli agenti resta disponibile su host non macOS
per flussi di artefatti, calendario, configurazione, trascrizione, Twilio e
`chrome-node`. Le azioni Chrome locali in tempo reale sono bloccate lì perché il
percorso audio Chrome in tempo reale incluso attualmente dipende da macOS
`BlackHole 2ch`. Su Linux, usa `mode: "transcribe"`, l'accesso telefonico Twilio
o un host macOS `chrome-node` per partecipare con Chrome in tempo reale.

Crea una nuova riunione e unisciti:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Per stanze create tramite API, usa Google Meet `SpaceConfig.accessType` quando vuoi
che la policy di accesso senza bussare della stanza sia esplicita invece che ereditata
dai valori predefiniti dell'account Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode realtime
```

`OPEN` consente a chiunque abbia l'URL Meet di partecipare senza bussare. `TRUSTED`
consente agli utenti attendibili dell'organizzazione host, agli utenti esterni
invitati e agli utenti che chiamano telefonicamente di partecipare senza bussare.
`RESTRICTED` limita l'ingresso senza bussare agli invitati. Queste impostazioni
si applicano solo al percorso ufficiale di creazione tramite API Google Meet,
quindi le credenziali OAuth devono essere configurate.

Se hai autenticato Google Meet prima che questa opzione fosse disponibile, riesegui
`openclaw googlemeet auth login --json` dopo aver aggiunto l'ambito
`meetings.space.settings` alla schermata di consenso OAuth Google.

Crea solo l'URL senza partecipare:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` ha due percorsi:

- Creazione API: usata quando le credenziali OAuth Google Meet sono configurate. È
  il percorso più deterministico e non dipende dallo stato dell'interfaccia del browser.
- Fallback browser: usato quando le credenziali OAuth sono assenti. OpenClaw usa il
  Node Chrome fissato, apre `https://meet.google.com/new`, attende che Google reindirizzi
  a un vero URL con codice riunione, quindi restituisce quell'URL. Questo percorso richiede
  che il profilo Chrome OpenClaw sul Node abbia già effettuato l'accesso a Google.
  L'automazione del browser gestisce il prompt iniziale del microfono di Meet; quel prompt
  non viene trattato come un errore di accesso a Google.
  I flussi di partecipazione e creazione provano anche a riutilizzare una scheda Meet
  esistente prima di aprirne una nuova. La corrispondenza ignora stringhe di query URL
  innocue come `authuser`, quindi un nuovo tentativo dell'agente dovrebbe mettere a fuoco
  la riunione già aperta invece di creare una seconda scheda Chrome.

L'output del comando/strumento include un campo `source` (`api` o `browser`) così gli agenti
possono spiegare quale percorso è stato usato. `create` si unisce alla nuova riunione per
impostazione predefinita e restituisce `joined: true` più la sessione di partecipazione.
Per creare solo l'URL, usa `create --no-join` nella CLI oppure passa `"join": false` allo strumento.

Oppure di' a un agente: "Crea un Google Meet, unisciti con voce in tempo reale e mandami
il link." L'agente dovrebbe chiamare `google_meet` con `action: "create"` e poi condividere
il `meetingUri` restituito.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Per una partecipazione di sola osservazione/controllo browser, imposta `"mode": "transcribe"`.
Questo non avvia il bridge del modello duplex in tempo reale, non richiede BlackHole o SoX
e non risponderà nella riunione. Le partecipazioni Chrome in questa modalità evitano anche
la concessione di autorizzazioni microfono/fotocamera di OpenClaw ed evitano il percorso
**Usa microfono** di Meet. Se Meet mostra un interstitial di scelta audio, l'automazione prova
il percorso senza microfono e altrimenti segnala un'azione manuale invece di aprire il microfono
locale. In modalità transcribe, i trasporti Chrome gestiti installano anche un osservatore
delle didascalie Meet best-effort. `googlemeet status --json` e `googlemeet doctor` espongono
`captioning`, `captionsEnabledAttempted`, `transcriptLines`, `lastCaptionAt`,
`lastCaptionSpeaker`, `lastCaptionText` e una breve coda `recentTranscript` così gli operatori
possono capire se il browser ha partecipato alla chiamata e se le didascalie Meet stanno
producendo testo.
Usa `openclaw googlemeet test-listen <meet-url> --transport chrome-node` quando hai bisogno
di una verifica sì/no: partecipa in modalità transcribe, attende una nuova didascalia o un
movimento della trascrizione e restituisce `listenVerified`, `listenTimedOut`, campi di azione
manuale e lo stato più recente delle didascalie.

Durante le sessioni in tempo reale, lo stato `google_meet` include la salute del browser e
del bridge audio, come `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`,
`audioInputActive`, `audioOutputActive`, timestamp dell'ultimo input/output, contatori di byte
e stato di chiusura del bridge. Se appare un prompt sicuro della pagina Meet, l'automazione
del browser lo gestisce quando può. Accesso, ammissione da parte dell'host e prompt di
autorizzazione del browser/OS vengono segnalati come azione manuale con un motivo e un
messaggio che l'agente può riferire. Le sessioni Chrome gestite emettono la frase di intro
o test solo dopo che la salute del browser riporta `inCall: true`; altrimenti lo stato riporta
`speechReady: false` e il tentativo di parlato viene bloccato invece di fingere che l'agente
abbia parlato nella riunione.

Le partecipazioni Chrome locali avvengono tramite il profilo browser OpenClaw connesso.
La modalità in tempo reale richiede `BlackHole 2ch` per il percorso microfono/altoparlante
usato da OpenClaw. Per audio duplex pulito, usa dispositivi virtuali separati o un grafo
in stile Loopback; un singolo dispositivo BlackHole è sufficiente per un primo smoke test
ma può generare eco.

### Gateway locale + Parallels Chrome

**Non** serve un Gateway OpenClaw completo o una chiave API del modello dentro una VM macOS
solo per far sì che la VM possieda Chrome. Esegui Gateway e agente localmente, quindi esegui
un host Node nella VM. Abilita una volta il plugin incluso nella VM così il Node pubblicizza
il comando Chrome:

Cosa viene eseguito dove:

- Host Gateway: OpenClaw Gateway, workspace dell'agente, chiavi modello/API, provider in
  tempo reale e configurazione del plugin Google Meet.
- VM macOS Parallels: CLI/host Node OpenClaw, Google Chrome, SoX, BlackHole 2ch
  e un profilo Chrome con accesso a Google.
- Non necessario nella VM: servizio Gateway, configurazione agente, chiave OpenAI/GPT
  o configurazione del provider del modello.

Installa le dipendenze della VM:

```bash
brew install blackhole-2ch sox
```

Riavvia la VM dopo aver installato BlackHole così macOS espone `BlackHole 2ch`:

```bash
sudo reboot
```

Dopo il riavvio, verifica che la VM veda il dispositivo audio e i comandi SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Installa o aggiorna OpenClaw nella VM, quindi abilita lì il plugin incluso:

```bash
openclaw plugins enable google-meet
```

Avvia l'host Node nella VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Se `<gateway-host>` è un IP LAN e non stai usando TLS, il Node rifiuta il WebSocket
in chiaro a meno che tu non dia consenso esplicito per quella rete privata attendibile:

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
`openclaw.json`. `openclaw node install` lo memorizza nell'ambiente LaunchAgent
quando è presente nel comando di installazione.

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

Instrada Meet tramite quel Node sull'host Gateway:

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

Per uno smoke test con un solo comando che crea o riutilizza una sessione, pronuncia una frase
nota e stampa la salute della sessione:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Durante l'accesso in tempo reale, l'automazione del browser di OpenClaw inserisce il nome dell'ospite, fa clic su Join/Ask to join e accetta la scelta iniziale "Use microphone" di Meet quando compare quel prompt. Durante l'accesso in sola osservazione o la creazione di una riunione solo browser, supera lo stesso prompt senza microfono quando questa scelta è disponibile. Se il profilo del browser non ha effettuato l'accesso, Meet è in attesa dell'ammissione da parte dell'organizzatore, Chrome richiede l'autorizzazione per microfono/fotocamera per un accesso in tempo reale, oppure Meet è bloccato su un prompt che l'automazione non è riuscita a risolvere, il risultato di join/test-speech riporta `manualActionRequired: true` con `manualActionReason` e `manualActionMessage`. Gli agenti devono smettere di ritentare l'accesso, riportare quel messaggio esatto insieme agli attuali `browserUrl`/`browserTitle` e riprovare solo dopo il completamento dell'azione manuale nel browser.

Se `chromeNode.node` è omesso, OpenClaw seleziona automaticamente solo quando esattamente un nodo connesso annuncia sia `googlemeet.chrome` sia il controllo del browser. Se sono connessi più nodi compatibili, imposta `chromeNode.node` sull'id del nodo, sul nome visualizzato o sull'IP remoto.

Controlli comuni in caso di errore:

- `Configured Google Meet node ... is not usable: offline`: il nodo fissato è
  noto al Gateway ma non disponibile. Gli agenti devono trattare quel nodo come
  stato diagnostico, non come host Chrome utilizzabile, e riportare il blocco di
  configurazione invece di ricorrere a un altro trasporto, salvo richiesta
  esplicita dell'utente.
- `No connected Google Meet-capable node`: avvia `openclaw node run` nella VM,
  approva l'associazione e assicurati che `openclaw plugins enable google-meet` e
  `openclaw plugins enable browser` siano stati eseguiti nella VM. Conferma anche
  che l'host Gateway consenta entrambi i comandi del nodo con
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: installa `blackhole-2ch` sull'host
  controllato e riavvia prima di usare l'audio di Chrome locale.
- `BlackHole 2ch audio device not found on the node`: installa `blackhole-2ch`
  nella VM e riavvia la VM.
- Chrome si apre ma non riesce a entrare: accedi al profilo del browser dentro la
  VM, oppure mantieni `chrome.guestName` impostato per l'accesso come ospite.
  L'accesso automatico come ospite usa l'automazione del browser di OpenClaw
  tramite il proxy del browser del nodo; assicurati che la configurazione del
  browser del nodo punti al profilo desiderato, per esempio
  `browser.defaultProfile: "user"` o un profilo di sessione esistente con nome.
- Schede Meet duplicate: lascia abilitato `chrome.reuseExistingTab: true`.
  OpenClaw attiva una scheda esistente per lo stesso URL Meet prima di aprirne
  una nuova, e la creazione di riunioni nel browser riutilizza una scheda
  `https://meet.google.com/new` in corso o un prompt dell'account Google prima
  di aprirne un'altra.
- Nessun audio: in Meet, instrada microfono/altoparlante tramite il percorso del
  dispositivo audio virtuale usato da OpenClaw; usa dispositivi virtuali separati
  o un instradamento in stile Loopback per un audio duplex pulito.

## Note di installazione

L'impostazione predefinita in tempo reale di Chrome usa due strumenti esterni:

- `sox`: utilità audio da riga di comando. Il plugin usa comandi espliciti per
  dispositivi CoreAudio per il bridge audio PCM16 predefinito a 24 kHz.
- `blackhole-2ch`: driver audio virtuale per macOS. Crea il dispositivo audio
  `BlackHole 2ch` attraverso cui Chrome/Meet può instradare l'audio.

OpenClaw non include né ridistribuisce nessuno dei due pacchetti. La
documentazione chiede agli utenti di installarli come dipendenze dell'host
tramite Homebrew. SoX è concesso in licenza come `LGPL-2.0-only AND
GPL-2.0-only`; BlackHole è GPL-3.0. Se crei un installer o un'appliance che
include BlackHole con OpenClaw, esamina i termini di licenza upstream di
BlackHole o ottieni una licenza separata da Existential Audio.

## Trasporti

### Chrome

Il trasporto Chrome apre l'URL Meet tramite il controllo del browser di OpenClaw
ed entra con il profilo browser OpenClaw autenticato. Su macOS, il plugin
controlla la presenza di `BlackHole 2ch` prima dell'avvio. Se configurato,
esegue anche un comando di verifica dello stato del bridge audio e un comando di
avvio prima di aprire Chrome. Usa `chrome` quando Chrome/audio risiedono
sull'host Gateway; usa `chrome-node` quando Chrome/audio risiedono su un nodo
associato, come una VM macOS Parallels. Per Chrome locale, scegli il profilo con
`browser.defaultProfile`; `chrome.browserProfile` viene passato agli host
`chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Instrada l'audio di microfono e altoparlante di Chrome tramite il bridge audio
locale di OpenClaw. Se `BlackHole 2ch` non è installato, l'accesso fallisce con
un errore di configurazione invece di entrare silenziosamente senza un percorso
audio.

### Twilio

Il trasporto Twilio è un piano di chiamata rigoroso delegato al plugin Voice
Call. Non analizza le pagine Meet alla ricerca di numeri di telefono.

Usalo quando la partecipazione tramite Chrome non è disponibile o vuoi un
fallback di accesso telefonico. Google Meet deve esporre un numero telefonico di
accesso e un PIN per la riunione; OpenClaw non li ricava dalla pagina Meet.

Abilita il plugin Voice Call sull'host Gateway, non sul nodo Chrome:

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

Riavvia o ricarica il Gateway dopo avere abilitato `voice-call`; le modifiche
alla configurazione del plugin non compaiono in un processo Gateway già in
esecuzione finché non viene ricaricato.

Quindi verifica:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Quando la delega Twilio è collegata, `googlemeet setup` include controlli
riusciti per `twilio-voice-call-plugin`, `twilio-voice-call-credentials` e
`twilio-voice-call-webhook`.

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

OAuth è facoltativo per creare un link Meet perché `googlemeet create` può usare
come fallback l'automazione del browser. Configura OAuth quando vuoi la creazione
tramite API ufficiale, la risoluzione degli spazi o i controlli preflight
dell'API Meet Media.

L'accesso all'API Google Meet usa OAuth utente: crea un client OAuth Google
Cloud, richiedi gli scope necessari, autorizza un account Google, quindi archivia
il refresh token risultante nella configurazione del plugin Google Meet oppure
fornisci le variabili d'ambiente `OPENCLAW_GOOGLE_MEET_*`.

OAuth non sostituisce il percorso di accesso con Chrome. I trasporti Chrome e
Chrome-node continuano a entrare tramite un profilo Chrome autenticato,
BlackHole/SoX e un nodo connesso quando usi la partecipazione dal browser. OAuth
serve solo per il percorso ufficiale dell'API Google Meet: creare spazi riunione,
risolvere spazi ed eseguire controlli preflight dell'API Meet Media.

### Creare le credenziali Google

In Google Cloud Console:

1. Crea o seleziona un progetto Google Cloud.
2. Abilita **Google Meet REST API** per quel progetto.
3. Configura la schermata di consenso OAuth.
   - **Internal** è la scelta più semplice per un'organizzazione Google Workspace.
   - **External** funziona per configurazioni personali/di test; mentre l'app è
     in Testing, aggiungi come utente di test ogni account Google che autorizzerà
     l'app.
4. Aggiungi gli scope richiesti da OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
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
spazi. `meetings.space.settings` consente a OpenClaw di passare impostazioni
`SpaceConfig` come `accessType` durante la creazione di sale tramite API.
`meetings.conference.media.readonly` serve per il preflight dell'API Meet Media
e per il lavoro sui media; Google può richiedere l'iscrizione alla Developer
Preview per l'uso effettivo dell'API Media. Se ti servono solo accessi Chrome
basati su browser, salta completamente OAuth.

### Generare il refresh token

Configura `oauth.clientId` e opzionalmente `oauth.clientSecret`, oppure passali
come variabili d'ambiente, quindi esegui:

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

Usa la modalità manuale quando il browser non può raggiungere la callback locale:

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

Archivia l'oggetto `oauth` sotto la configurazione del plugin Google Meet:

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
configurazione. Se sono presenti sia valori di configurazione sia valori di
ambiente, il plugin risolve prima la configurazione e poi usa l'ambiente come
fallback.

Il consenso OAuth include la creazione di spazi Meet, l'accesso in lettura agli
spazi Meet e l'accesso in lettura ai media delle conferenze Meet. Se hai
effettuato l'autenticazione prima che esistesse il supporto per la creazione di
riunioni, riesegui `openclaw googlemeet auth login --json` in modo che il refresh
token abbia lo scope `meetings.space.created`.

### Verificare OAuth con doctor

Esegui il doctor OAuth quando vuoi un controllo rapido dello stato senza segreti:

```bash
openclaw googlemeet doctor --oauth --json
```

Questo non carica il runtime Chrome né richiede un nodo Chrome connesso.
Controlla che la configurazione OAuth esista e che il refresh token possa
generare un access token. Il report JSON include solo campi di stato come `ok`,
`configured`, `tokenSource`, `expiresAt` e messaggi dei controlli; non stampa
l'access token, il refresh token o il segreto client.

Risultati comuni:

| Controllo            | Significato                                                                            |
| -------------------- | -------------------------------------------------------------------------------------- |
| `oauth-config`       | Sono presenti `oauth.clientId` più `oauth.refreshToken`, o un access token in cache.   |
| `oauth-token`        | L'access token in cache è ancora valido, oppure il refresh token ne ha generato uno nuovo. |
| `meet-spaces-get`    | Il controllo facoltativo `--meeting` ha risolto uno spazio Meet esistente.             |
| `meet-spaces-create` | Il controllo facoltativo `--create-space` ha creato un nuovo spazio Meet.              |

Per provare anche l'abilitazione dell'API Google Meet e lo scope `spaces.create`,
esegui il controllo di creazione con effetti collaterali:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` crea un URL Meet temporaneo. Usalo quando devi confermare
che il progetto Google Cloud abbia l'API Meet abilitata e che l'account autorizzato
abbia l'ambito `meetings.space.created`.

Per dimostrare l'accesso in lettura a uno spazio riunione esistente:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` e `resolve-space` dimostrano l'accesso in lettura a uno
spazio esistente a cui l'account Google autorizzato può accedere. Un `403` da questi controlli
di solito significa che l'API REST di Google Meet è disabilitata, che il token di aggiornamento
con consenso non include l'ambito richiesto o che l'account Google non può accedere a quello
spazio Meet. Un errore del token di aggiornamento significa eseguire di nuovo `openclaw googlemeet auth login
--json` e salvare il nuovo blocco `oauth`.

Non sono necessarie credenziali OAuth per il fallback del browser. In questa modalità, l'autenticazione Google
proviene dal profilo Chrome connesso sul nodo selezionato, non dalla configurazione
OpenClaw.

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

Esegui il preflight prima del lavoro sui media:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Elenca gli artefatti della riunione e le presenze dopo che Meet ha creato i record della conferenza:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Con `--meeting`, `artifacts` e `attendance` usano per impostazione predefinita il record della conferenza più recente.
Passa `--all-conference-records` quando vuoi ogni record conservato
per quella riunione.

La ricerca nel calendario può risolvere l'URL della riunione da Google Calendar prima di leggere
gli artefatti di Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` cerca nel calendario `primary` di oggi un evento Calendar con un
link Google Meet. Usa `--event <query>` per cercare testo evento corrispondente e
`--calendar <id>` per un calendario non primario. La ricerca nel calendario richiede un nuovo
accesso OAuth che includa l'ambito di sola lettura degli eventi Calendar.
`calendar-events` mostra in anteprima gli eventi Meet corrispondenti e contrassegna l'evento che
`latest`, `artifacts`, `attendance` o `export` sceglierà.

Se conosci già l'id del record della conferenza, indirizzalo direttamente:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Termina una conferenza attiva per uno spazio creato tramite API quando vuoi chiudere la
stanza dopo la chiamata:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Questo chiama Google Meet `spaces.endActiveConference` e richiede OAuth con l'ambito
`meetings.space.created` per uno spazio che l'account autorizzato può gestire.
OpenClaw accetta un URL Meet, un codice riunione o un input `spaces/{id}` e lo risolve
nella risorsa spazio dell'API prima di terminare la conferenza attiva.
È separato da `googlemeet leave`: `leave` interrompe la partecipazione locale/di sessione
di OpenClaw, mentre `end-active-conference` chiede a Google Meet di terminare la conferenza attiva
per lo spazio.

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

`artifacts` restituisce i metadati del record della conferenza più i metadati delle risorse di partecipanti, registrazione,
trascrizione, voce di trascrizione strutturata e note intelligenti quando
Google li espone per la riunione. Usa `--no-transcript-entries` per saltare
la ricerca delle voci per riunioni grandi. `attendance` espande i partecipanti in
righe di sessione partecipante con orari di prima/ultima visualizzazione, durata totale della sessione,
flag di ritardo/uscita anticipata e risorse partecipante duplicate unite per utente connesso
o nome visualizzato. Passa `--no-merge-duplicates` per mantenere separate le risorse partecipante
grezze, `--late-after-minutes` per regolare il rilevamento dei ritardi e
`--early-before-minutes` per regolare il rilevamento delle uscite anticipate.

`export` scrive una cartella contenente `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` e `manifest.json`.
`manifest.json` registra l'input scelto, le opzioni di esportazione, i record della conferenza,
i file di output, i conteggi, l'origine del token, l'evento Calendar quando ne è stato usato uno e tutti gli
avvisi di recupero parziale. Passa `--zip` per scrivere anche un archivio portabile accanto
alla cartella. Passa `--include-doc-bodies` per esportare il testo dei Google Docs collegati di trascrizione e
note intelligenti tramite Google Drive `files.export`; questo richiede un
nuovo accesso OAuth che includa l'ambito di sola lettura Drive Meet. Senza
`--include-doc-bodies`, le esportazioni includono solo i metadati Meet e le voci di trascrizione
strutturate. Se Google restituisce un errore parziale sugli artefatti, come un errore di elenco
delle note intelligenti, di voce di trascrizione o di corpo documento Drive, il riepilogo e il
manifest mantengono l'avviso invece di far fallire l'intera esportazione.
Usa `--dry-run` per recuperare gli stessi dati di artefatti/presenze e stampare il
JSON del manifest senza creare la cartella o lo ZIP. È utile prima di scrivere
un'esportazione grande o quando un agent ha bisogno solo di conteggi, record selezionati e
avvisi.

Gli agent possono anche creare lo stesso bundle tramite lo strumento `google_meet`:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

Imposta `"dryRun": true` per restituire solo il manifest di esportazione e saltare la scrittura dei file.

Gli agent possono anche creare una stanza supportata dall'API con una policy di accesso esplicita:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime",
  "accessType": "OPEN"
}
```

E possono terminare la conferenza attiva per una stanza nota:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

Per la convalida con ascolto iniziale, gli agent devono usare `test_listen` prima di dichiarare che la
riunione è utile:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Esegui il live smoke protetto su una vera riunione conservata:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Esegui il probe del browser live con ascolto iniziale su una riunione in cui qualcuno
parlerà con i sottotitoli Meet disponibili:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Ambiente live smoke:

- `OPENCLAW_LIVE_TEST=1` abilita i test live protetti.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` punta a un URL Meet conservato, un codice o
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` o `GOOGLE_MEET_CLIENT_ID` fornisce l'id client OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` o `GOOGLE_MEET_REFRESH_TOKEN` fornisce
  il token di aggiornamento.
- Opzionale: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` e
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` usano gli stessi nomi di fallback
  senza il prefisso `OPENCLAW_`.

Il live smoke di base per artefatti/presenze richiede
`https://www.googleapis.com/auth/meetings.space.readonly` e
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. La ricerca nel calendario
richiede `https://www.googleapis.com/auth/calendar.events.readonly`. L'esportazione del corpo documento Drive
richiede
`https://www.googleapis.com/auth/drive.meet.readonly`.

Crea un nuovo spazio Meet:

```bash
openclaw googlemeet create
```

Il comando stampa il nuovo `meeting uri`, l'origine e la sessione di partecipazione. Con credenziali OAuth
usa l'API ufficiale di Google Meet. Senza credenziali OAuth
usa come fallback il profilo browser connesso del nodo Chrome fissato. Gli agent possono
usare lo strumento `google_meet` con `action: "create"` per creare e partecipare in un unico
passaggio. Per la creazione solo URL, passa `"join": false`.

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

Se il fallback del browser incontra l'accesso Google o un blocco dei permessi Meet prima di
poter creare l'URL, il metodo Gateway restituisce una risposta non riuscita e lo
strumento `google_meet` restituisce dettagli strutturati invece di una semplice stringa:

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

Quando un agent vede `manualActionRequired: true`, deve riportare il
`manualActionMessage` più il contesto nodo/scheda del browser e smettere di aprire nuove
schede Meet finché l'operatore non completa il passaggio nel browser.

Esempio di output JSON dalla creazione API:

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

La creazione di un Meet partecipa per impostazione predefinita. Il trasporto Chrome o Chrome-node richiede comunque
un profilo Google Chrome connesso per partecipare tramite il browser. Se il
profilo è disconnesso, OpenClaw riporta `manualActionRequired: true` o un
errore di fallback del browser e chiede all'operatore di completare l'accesso Google prima
di riprovare.

Imposta `preview.enrollmentAcknowledged: true` solo dopo aver confermato che il tuo progetto Cloud,
il principal OAuth e i partecipanti alla riunione sono iscritti al Google
Workspace Developer Preview Program per le API media di Meet.

## Configurazione

Il percorso realtime comune di Chrome richiede solo il plugin abilitato, BlackHole, SoX,
e una chiave di provider voce realtime backend. OpenAI è l'impostazione predefinita; imposta
`realtime.provider: "google"` per usare Google Gemini Live:

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

Valori predefiniti:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: id/nome/IP del nodo opzionale per `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: nome usato nella schermata ospite Meet
  non autenticata
- `chrome.autoJoin: true`: compilazione del nome ospite e clic su Partecipa ora
  con impegno ragionevole tramite automazione del browser OpenClaw su `chrome-node`
- `chrome.reuseExistingTab: true`: attiva una scheda Meet esistente invece di
  aprire duplicati
- `chrome.waitForInCallMs: 20000`: attende che la scheda Meet segnali di essere
  in chiamata prima di attivare l’introduzione in tempo reale
- `chrome.audioFormat: "pcm16-24khz"`: formato audio della coppia di comandi. Usa
  `"g711-ulaw-8khz"` solo per coppie di comandi legacy/personalizzate che emettono
  ancora audio telefonico.
- `chrome.audioInputCommand`: comando SoX che legge da CoreAudio `BlackHole 2ch`
  e scrive audio in `chrome.audioFormat`
- `chrome.audioOutputCommand`: comando SoX che legge audio in `chrome.audioFormat`
  e scrive su CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: comando opzionale per microfono locale che scrive
  PCM mono little-endian con segno a 16 bit per il rilevamento dell’interruzione
  umana mentre la riproduzione dell’assistente è attiva. Al momento si applica al
  bridge della coppia di comandi `chrome` ospitato dal Gateway.
- `chrome.bargeInRmsThreshold: 650`: livello RMS che viene conteggiato come
  interruzione umana su `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: livello di picco che viene conteggiato come
  interruzione umana su `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: ritardo minimo tra cancellazioni ripetute di
  interruzioni umane
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: brevi risposte parlate, con
  `openclaw_agent_consult` per risposte più approfondite
- `realtime.introMessage`: breve controllo parlato di disponibilità quando il
  bridge in tempo reale si connette; impostalo su `""` per entrare in silenzio
- `realtime.agentId`: id opzionale dell’agente OpenClaw per
  `openclaw_agent_consult`; il valore predefinito è `main`

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

`voiceCall.enabled` usa `true` come valore predefinito; con il trasporto Twilio
delega la chiamata PSTN effettiva, il DTMF e il saluto introduttivo al plugin
Voice Call. Voice Call riproduce la sequenza DTMF prima di aprire lo stream
multimediale in tempo reale, poi usa il testo introduttivo salvato come saluto
iniziale in tempo reale. Se `voice-call` non è abilitato, Google Meet può ancora
convalidare e registrare il piano di composizione, ma non può effettuare la
chiamata Twilio.

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

Usa `transport: "chrome"` quando Chrome viene eseguito sull’host Gateway. Usa
`transport: "chrome-node"` quando Chrome viene eseguito su un nodo associato,
come una VM Parallels. In entrambi i casi il modello in tempo reale e
`openclaw_agent_consult` vengono eseguiti sull’host Gateway, quindi le
credenziali del modello restano lì.

Usa `action: "status"` per elencare le sessioni attive o ispezionare un ID
sessione. Usa `action: "speak"` con `sessionId` e `message` per far parlare
subito l’agente in tempo reale. Usa `action: "test_speech"` per creare o
riutilizzare la sessione, attivare una frase nota e restituire lo stato
`inCall` quando l’host Chrome può segnalarlo. `test_speech` forza sempre
`mode: "realtime"` e fallisce se viene richiesto di eseguire in
`mode: "transcribe"` perché le sessioni di sola osservazione non possono
emettere parlato intenzionalmente. Il risultato `speechOutputVerified` si basa
sull’aumento dei byte di output audio in tempo reale durante questa chiamata di
test, quindi una sessione riutilizzata con audio precedente non conta come nuovo
controllo vocale riuscito. Usa `action: "leave"` per contrassegnare una sessione
come terminata.

`status` include lo stato di Chrome quando disponibile:

- `inCall`: Chrome sembra essere dentro la chiamata Meet
- `micMuted`: stato del microfono Meet con impegno ragionevole
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: il
  profilo del browser richiede login manuale, ammissione da parte dell’host Meet,
  permessi o riparazione del controllo browser prima che il parlato possa
  funzionare
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: indica se il
  parlato Chrome gestito è consentito ora. `speechReady: false` significa che
  OpenClaw non ha inviato la frase introduttiva/di test nel bridge audio.
- `providerConnected` / `realtimeReady`: stato del bridge vocale in tempo reale
- `lastInputAt` / `lastOutputAt`: ultimo audio visto dal bridge o inviato al bridge
- `lastSuppressedInputAt` / `suppressedInputBytes`: input di loopback ignorato
  mentre la riproduzione dell’assistente è attiva

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Consultazione dell’agente in tempo reale

La modalità in tempo reale di Chrome è ottimizzata per un loop vocale dal vivo.
Il provider vocale in tempo reale ascolta l’audio della riunione e parla tramite
il bridge audio configurato. Quando il modello in tempo reale richiede
ragionamento più approfondito, informazioni aggiornate o normali strumenti
OpenClaw, può chiamare `openclaw_agent_consult`.

Lo strumento di consultazione esegue il normale agente OpenClaw dietro le quinte
con il contesto recente della trascrizione della riunione e restituisce una
risposta parlata concisa alla sessione vocale in tempo reale. Il modello vocale
può quindi pronunciare quella risposta nella riunione. Usa lo stesso strumento
di consultazione condiviso in tempo reale di Voice Call.

Per impostazione predefinita, le consultazioni vengono eseguite sull’agente
`main`. Imposta `realtime.agentId` quando una corsia Meet deve consultare un
workspace agente OpenClaw dedicato, valori predefiniti del modello, policy degli
strumenti, memoria e cronologia della sessione.

`realtime.toolPolicy` controlla l’esecuzione della consultazione:

- `safe-read-only`: espone lo strumento di consultazione e limita l’agente
  regolare a `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` e
  `memory_get`.
- `owner`: espone lo strumento di consultazione e consente all’agente regolare
  di usare la normale policy degli strumenti dell’agente.
- `none`: non espone lo strumento di consultazione al modello vocale in tempo
  reale.

La chiave della sessione di consultazione è delimitata per sessione Meet, quindi
le chiamate di consultazione successive possono riutilizzare il contesto di
consultazione precedente durante la stessa riunione.

Per forzare un controllo parlato di disponibilità dopo che Chrome è entrato
completamente nella chiamata:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Per lo smoke completo di ingresso e parlato:

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

Stato Chrome-node atteso:

- `googlemeet setup` è tutto verde.
- `googlemeet setup` include `chrome-node-connected` quando Chrome-node è il
  trasporto predefinito o un nodo è fissato.
- `nodes status` mostra il nodo selezionato connesso.
- Il nodo selezionato pubblicizza sia `googlemeet.chrome` sia `browser.proxy`.
- La scheda Meet entra nella chiamata e `test-speech` restituisce lo stato Chrome
  con `inCall: true`.

Per un host Chrome remoto come una VM macOS Parallels, questo è il controllo
sicuro più breve dopo l’aggiornamento del Gateway o della VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Questo dimostra che il plugin Gateway è caricato, il nodo VM è connesso con il
token corrente e il bridge audio Meet è disponibile prima che un agente apra una
scheda riunione reale.

Per uno smoke Twilio, usa una riunione che espone i dettagli di chiamata
telefonica:

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
- `openclaw logs --follow` mostra TwiML DTMF servito prima di TwiML in tempo
  reale, poi un bridge in tempo reale con il saluto iniziale accodato.
- `googlemeet leave <sessionId>` chiude la chiamata vocale delegata.

## Risoluzione dei problemi

### L’agente non vede lo strumento Google Meet

Conferma che il plugin sia abilitato nella configurazione del Gateway e ricarica
il Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Se hai appena modificato `plugins.entries.google-meet`, riavvia o ricarica il
Gateway. L’agente in esecuzione vede solo gli strumenti dei plugin registrati
dal processo Gateway corrente.

Sugli host Gateway non macOS, lo strumento `google_meet` rivolto all’agente
rimane visibile, ma le azioni locali Chrome in tempo reale vengono bloccate prima
di raggiungere il bridge audio. L’audio locale Chrome in tempo reale dipende
attualmente da macOS `BlackHole 2ch`, quindi gli agenti Linux dovrebbero usare
`mode: "transcribe"`, la chiamata Twilio o un host `chrome-node` macOS invece
del percorso Chrome locale in tempo reale predefinito.

### Nessun nodo con capacità Google Meet connesso

Sull’host del nodo, esegui:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Sull’host Gateway, approva il nodo e verifica i comandi:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Il nodo deve essere connesso ed elencare `googlemeet.chrome` oltre a
`browser.proxy`. La configurazione del Gateway deve consentire quei comandi del
nodo:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Se `googlemeet setup` fallisce su `chrome-node-connected` o il log del Gateway
riporta `gateway token mismatch`, reinstalla o riavvia il nodo con il token
Gateway corrente. Per un Gateway LAN questo di solito significa:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Poi ricarica il servizio del nodo e riesegui:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Il browser si apre ma l’agente non riesce a entrare

Esegui `googlemeet test-listen` per ingressi di sola osservazione oppure
`googlemeet test-speech` per ingressi in tempo reale, poi ispeziona lo stato
Chrome restituito. Se una delle due sonde riporta `manualActionRequired: true`,
mostra `manualActionMessage` all’operatore e interrompi i tentativi finché
l’azione nel browser non è completa.

Azioni manuali comuni:

- Accedi al profilo Chrome.
- Ammetti l’ospite dall’account host Meet.
- Concedi i permessi microfono/camera di Chrome quando compare il prompt di
  permesso nativo di Chrome.
- Chiudi o ripara una finestra di dialogo dei permessi Meet bloccata.

Non segnalare "not signed in" solo perché Meet mostra "Do you want people to
hear you in the meeting?" Questo è l’interstitial di Meet per la scelta audio; OpenClaw
fa clic su **Use microphone** tramite automazione del browser quando disponibile e continua
ad attendere il reale stato della riunione. Per il fallback del browser di sola creazione, OpenClaw
può fare clic su **Continue without microphone** perché la creazione dell’URL non richiede
il percorso audio in tempo reale.

### La creazione della riunione non riesce

`googlemeet create` usa prima l’endpoint `spaces.create` dell’API Google Meet
quando sono configurate le credenziali OAuth. Senza credenziali OAuth, passa al
fallback del browser Chrome node bloccato. Verifica:

- Per la creazione tramite API: `oauth.clientId` e `oauth.refreshToken` sono configurati,
  oppure sono presenti variabili d’ambiente `OPENCLAW_GOOGLE_MEET_*` corrispondenti.
- Per la creazione tramite API: il token di aggiornamento è stato generato dopo l’aggiunta
  del supporto alla creazione. Ai token più vecchi potrebbe mancare lo scope `meetings.space.created`; esegui di nuovo
  `openclaw googlemeet auth login --json` e aggiorna la configurazione del plugin.
- Per il fallback del browser: `defaultTransport: "chrome-node"` e
  `chromeNode.node` puntano a un nodo connesso con `browser.proxy` e
  `googlemeet.chrome`.
- Per il fallback del browser: il profilo OpenClaw Chrome su quel nodo ha effettuato l’accesso
  a Google e può aprire `https://meet.google.com/new`.
- Per il fallback del browser: i tentativi riutilizzano una scheda esistente
  `https://meet.google.com/new` o una scheda di prompt dell’account Google prima di aprire una nuova scheda. Se un agente va in timeout,
  riprova la chiamata allo strumento invece di aprire manualmente un’altra scheda Meet.
- Per il fallback del browser: se lo strumento restituisce `manualActionRequired: true`, usa
  `browser.nodeId`, `browser.targetId`, `browserUrl` e
  `manualActionMessage` restituiti per guidare l’operatore. Non riprovare in loop finché
  quell’azione non è completa.
- Per il fallback del browser: se Meet mostra "Do you want people to hear you in the
  meeting?", lascia aperta la scheda. OpenClaw dovrebbe fare clic su **Use microphone** oppure, per il
  fallback di sola creazione, su **Continue without microphone** tramite automazione del browser
  e continuare ad attendere l’URL Meet generato. Se non riesce, l’errore dovrebbe menzionare
  `meet-audio-choice-required`, non `google-login-required`.

### L’agente entra ma non parla

Controlla il percorso in tempo reale:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Usa `mode: "realtime"` per ascolto/risposta vocale. `mode: "transcribe"` intenzionalmente
non avvia il bridge vocale duplex in tempo reale. Per il debug di sola osservazione,
esegui `openclaw googlemeet status --json <session-id>` dopo che i partecipanti hanno parlato
e controlla `captioning`, `transcriptLines` e `lastCaptionText`. Se `inCall` è
true ma `transcriptLines` rimane a `0`, i sottotitoli di Meet potrebbero essere disabilitati, nessuno
ha parlato da quando l’osservatore è stato installato, l’interfaccia di Meet è cambiata oppure i sottotitoli live
non sono disponibili per la lingua o l’account della riunione.

`googlemeet test-speech` controlla sempre il percorso in tempo reale e segnala se
sono stati osservati byte in uscita dal bridge per quella invocazione. Se `speechOutputVerified` è false e
`speechOutputTimedOut` è true, il provider in tempo reale potrebbe aver accettato
l’enunciato ma OpenClaw non ha visto nuovi byte in uscita raggiungere il bridge audio di Chrome.

Verifica anche:

- Sul host del Gateway è disponibile una chiave di provider in tempo reale, ad esempio
  `OPENAI_API_KEY` o `GEMINI_API_KEY`.
- `BlackHole 2ch` è visibile sul host Chrome.
- `sox` esiste sul host Chrome.
- Microfono e altoparlante di Meet sono instradati attraverso il percorso audio virtuale usato da
  OpenClaw.

`googlemeet doctor [session-id]` stampa sessione, nodo, stato in chiamata,
motivo dell’azione manuale, connessione del provider in tempo reale, `realtimeReady`, attività
di input/output audio, ultimi timestamp audio, contatori di byte e URL del browser.
Usa `googlemeet status [session-id] --json` quando ti serve il JSON grezzo. Usa
`googlemeet doctor --oauth` quando devi verificare l’aggiornamento OAuth di Google Meet
senza esporre token; aggiungi `--meeting` o `--create-space` quando ti serve anche una
prova dell’API Google Meet.

Se un agente è andato in timeout e puoi vedere una scheda Meet già aperta, ispeziona quella scheda
senza aprirne un’altra:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

L’azione strumento equivalente è `recover_current_tab`. Porta in primo piano e ispeziona una
scheda Meet esistente per il trasporto selezionato. Con `chrome`, usa il controllo del browser
locale tramite il Gateway; con `chrome-node`, usa il nodo Chrome configurato.
Non apre una nuova scheda né crea una nuova sessione; segnala il blocco
corrente, come login, ammissione, autorizzazioni o stato di scelta audio.
Il comando CLI comunica con il Gateway configurato, quindi il Gateway deve essere in esecuzione;
`chrome-node` richiede anche che il nodo Chrome sia connesso.

### I controlli di configurazione Twilio non riescono

`twilio-voice-call-plugin` non riesce quando `voice-call` non è consentito o non è abilitato.
Aggiungilo a `plugins.allow`, abilita `plugins.entries.voice-call` e ricarica il
Gateway.

`twilio-voice-call-credentials` non riesce quando al backend Twilio mancano il SID
dell’account, il token di autenticazione o il numero chiamante. Impostali sul host del Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` non riesce quando `voice-call` non ha esposizione Webhook
pubblica oppure quando `publicUrl` punta a loopback o a spazio di rete privato.
Imposta `plugins.entries.voice-call.config.publicUrl` sull’URL pubblico del provider oppure
configura un’esposizione tunnel/Tailscale per `voice-call`.

Gli URL di loopback e privati non sono validi per i callback degli operatori. Non usare
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
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

Per lo sviluppo locale, usa un tunnel o un’esposizione Tailscale invece di un URL
host privato:

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

`voicecall smoke` verifica solo la disponibilità per impostazione predefinita. Per simulare un numero specifico:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Aggiungi `--yes` solo quando vuoi intenzionalmente effettuare una chiamata
di notifica in uscita live:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### La chiamata Twilio parte ma non entra mai nella riunione

Conferma che l’evento Meet esponga i dettagli di chiamata telefonica. Passa il numero
di chiamata e il PIN esatti oppure una sequenza DTMF personalizzata:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Usa `w` iniziali o virgole in `--dtmf-sequence` se il provider ha bisogno di una pausa
prima dell’inserimento del PIN.

Se la chiamata telefonica viene creata ma l’elenco partecipanti di Meet non mostra mai il partecipante
telefonico:

- Esegui `openclaw googlemeet doctor <session-id>` per confermare l’ID della chiamata Twilio
  delegata, se il DTMF è stato accodato e se il saluto introduttivo è stato richiesto.
- Esegui `openclaw voicecall status --call-id <id>` e conferma che la chiamata sia ancora
  attiva.
- Esegui `openclaw voicecall tail` e controlla che i Webhook Twilio arrivino al
  Gateway.
- Esegui `openclaw logs --follow` e cerca la sequenza Twilio Meet: Google
  Meet delega l’ingresso, Voice Call memorizza il TwiML DTMF pre-connessione, serve
  quel TwiML iniziale, poi serve il TwiML in tempo reale e avvia il bridge in tempo reale
  con `initialGreeting=queued`.
- Esegui di nuovo `openclaw googlemeet setup --transport twilio`; un controllo di configurazione verde è
  richiesto ma non prova che la sequenza del PIN della riunione sia corretta.
- Conferma che il numero di chiamata appartenga allo stesso invito Meet e alla stessa regione del
  PIN.
- Aumenta le pause iniziali in `--dtmf-sequence` se Meet risponde lentamente, ad
  esempio `wwww123456#`.
- Se il partecipante entra ma non senti il saluto, controlla
  `openclaw logs --follow` per TwiML in tempo reale, avvio del bridge in tempo reale e
  `initialGreeting=queued`. Il saluto viene generato dal messaggio iniziale
  `voicecall.start` dopo la connessione del bridge in tempo reale.

Se i Webhook non arrivano, esegui prima il debug del plugin Voice Call: il provider deve
raggiungere `plugins.entries.voice-call.config.publicUrl` o il tunnel configurato.
Vedi [Risoluzione dei problemi delle chiamate vocali](/it/plugins/voice-call#troubleshooting).

## Note

L’API multimediale ufficiale di Google Meet è orientata alla ricezione, quindi parlare in una chiamata Meet
richiede comunque un percorso partecipante. Questo plugin mantiene visibile quel confine:
Chrome gestisce la partecipazione tramite browser e l’instradamento audio locale; Twilio gestisce
la partecipazione tramite chiamata telefonica.

La modalità in tempo reale di Chrome richiede `BlackHole 2ch` più uno tra:

- `chrome.audioInputCommand` più `chrome.audioOutputCommand`: OpenClaw possiede il
  bridge del modello in tempo reale e instrada l’audio in `chrome.audioFormat` tra quei
  comandi e il provider vocale in tempo reale selezionato. Il percorso Chrome predefinito è
  PCM16 a 24 kHz; G.711 mu-law a 8 kHz rimane disponibile per coppie di comandi legacy.
- `chrome.audioBridgeCommand`: un comando bridge esterno possiede l’intero percorso audio
  locale e deve uscire dopo aver avviato o validato il suo daemon.

Per audio duplex pulito, instrada output Meet e microfono Meet attraverso dispositivi
virtuali separati o un grafo di dispositivi virtuali in stile Loopback. Un singolo dispositivo
BlackHole condiviso può reimmettere nella chiamata l’eco degli altri partecipanti.

Con il bridge Chrome a coppia di comandi, `chrome.bargeInInputCommand` può ascoltare un
microfono locale separato e interrompere la riproduzione dell’assistente quando la persona inizia
a parlare. Questo mantiene la voce umana davanti all’output dell’assistente anche quando l’input condiviso
BlackHole loopback è temporaneamente soppresso durante la riproduzione dell’assistente.
Come `chrome.audioInputCommand` e `chrome.audioOutputCommand`, è un
comando locale configurato dall’operatore. Usa un percorso comando attendibile esplicito o
un elenco di argomenti, e non puntarlo a script da posizioni non attendibili.

`googlemeet speak` attiva il bridge audio in tempo reale attivo per una sessione
Chrome. `googlemeet leave` arresta quel bridge. Per le sessioni Twilio delegate
tramite il plugin Voice Call, `leave` chiude anche la chiamata vocale sottostante.
Usa `googlemeet end-active-conference` quando vuoi anche chiudere la conferenza
Google Meet attiva per uno spazio gestito tramite API.

## Correlati

- [Plugin di chiamata vocale](/it/plugins/voice-call)
- [Modalità conversazione](/it/nodes/talk)
- [Creazione di plugin](/it/plugins/building-plugins)
