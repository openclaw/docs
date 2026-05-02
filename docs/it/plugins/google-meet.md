---
read_when:
    - Vuoi che un agente OpenClaw si unisca a una chiamata Google Meet
    - Vuoi che un agente OpenClaw crei una nuova chiamata Google Meet
    - Stai configurando Chrome, un nodo Chrome o Twilio come trasporto Google Meet
summary: 'Plugin Google Meet: partecipa a URL Meet espliciti tramite Chrome o Twilio con impostazioni predefinite per la voce in tempo reale'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-02T20:48:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0dc515382d2cc7beacaf18a50b75cb0f4eda3038cfd8efe73ea3ce7b5007bc43
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet supporta i partecipanti per OpenClaw: il plugin è esplicito per progettazione:

- Entra solo in un URL `https://meet.google.com/...` esplicito.
- Può creare un nuovo spazio Meet tramite l'API Google Meet, quindi entrare nell'URL restituito.
- `realtime` voice è la modalità predefinita.
- La voce realtime può richiamare l'agente OpenClaw completo quando servono ragionamento più approfondito o strumenti.
- Gli agenti scelgono il comportamento di accesso con `mode`: usa `realtime` per ascolto/risposta vocale live, oppure `transcribe` per entrare/controllare il browser senza il bridge vocale realtime.
- L'autenticazione inizia come OAuth Google personale o come profilo Chrome già autenticato.
- Non c'è alcun annuncio automatico del consenso.
- Il backend audio predefinito di Chrome è `BlackHole 2ch`.
- Chrome può essere eseguito localmente o su un host Node associato.
- Twilio accetta un numero dial-in più un PIN o una sequenza DTMF facoltativi; non può chiamare direttamente un URL Meet.
- Il comando CLI è `googlemeet`; `meet` è riservato a flussi di teleconferenza più ampi dell'agente.

## Avvio rapido

Installa le dipendenze audio locali e configura un provider vocale realtime di backend. OpenAI è il predefinito; anche Google Gemini Live funziona con `realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` installa il dispositivo audio virtuale `BlackHole 2ch`. L'installer di Homebrew richiede un riavvio prima che macOS esponga il dispositivo:

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

L'output di setup è pensato per essere leggibile dagli agenti e consapevole della modalità. Riporta profilo Chrome, pinning del Node e, per gli accessi realtime con Chrome, il bridge audio BlackHole/SoX e i controlli ritardati dell'introduzione realtime. Per accessi in sola osservazione, controlla lo stesso trasporto con `--mode transcribe`; quella modalità salta i prerequisiti dell'audio realtime perché non ascolta né parla tramite il bridge:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Quando la delega Twilio è configurata, setup segnala anche se il plugin `voice-call`, le credenziali Twilio e l'esposizione pubblica del Webhook sono pronti. Considera qualsiasi controllo `ok: false` come un blocco per il trasporto e la modalità controllati prima di chiedere a un agente di entrare. Usa `openclaw googlemeet setup --json` per script o output leggibile da macchina. Usa `--transport chrome`, `--transport chrome-node` o `--transport twilio` per verificare preventivamente un trasporto specifico prima che un agente lo provi.

Per Twilio, verifica sempre esplicitamente il trasporto quando il trasporto predefinito è Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Questo intercetta cablaggio `voice-call` mancante, credenziali Twilio assenti o esposizione Webhook non raggiungibile prima che l'agente provi a chiamare la riunione.

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

Lo strumento `google_meet` rivolto agli agenti resta disponibile su host non macOS per flussi di artefatti, calendario, setup, trascrizione, Twilio e `chrome-node`. Le azioni realtime locali di Chrome sono bloccate lì perché il percorso audio realtime di Chrome incluso attualmente dipende da `BlackHole 2ch` su macOS. Su Linux, usa `mode: "transcribe"`, dial-in Twilio o un host `chrome-node` macOS per la partecipazione realtime con Chrome.

Crea una nuova riunione ed entraci:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Per stanze create tramite API, usa Google Meet `SpaceConfig.accessType` quando vuoi che la policy no-knock della stanza sia esplicita invece che ereditata dai valori predefiniti dell'account Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode realtime
```

`OPEN` consente a chiunque abbia l'URL Meet di entrare senza bussare. `TRUSTED` consente agli utenti attendibili dell'organizzazione host, agli utenti esterni invitati e agli utenti dial-in di entrare senza bussare. `RESTRICTED` limita l'ingresso senza bussare agli invitati. Queste impostazioni si applicano solo al percorso di creazione ufficiale dell'API Google Meet, quindi le credenziali OAuth devono essere configurate.

Se hai autenticato Google Meet prima che questa opzione fosse disponibile, riesegui `openclaw googlemeet auth login --json` dopo aver aggiunto lo scope `meetings.space.settings` alla schermata di consenso OAuth Google.

Crea solo l'URL senza entrare:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` ha due percorsi:

- Creazione API: usata quando le credenziali OAuth Google Meet sono configurate. Questo è il percorso più deterministico e non dipende dallo stato dell'interfaccia del browser.
- Fallback del browser: usato quando le credenziali OAuth sono assenti. OpenClaw usa il Node Chrome fissato, apre `https://meet.google.com/new`, attende che Google reindirizzi a un vero URL con codice riunione, quindi restituisce quell'URL. Questo percorso richiede che il profilo Chrome di OpenClaw sul Node sia già autenticato in Google.
  L'automazione del browser gestisce il prompt iniziale del microfono di Meet; quel prompt non viene trattato come un errore di accesso Google.
  Anche i flussi di accesso e creazione provano a riutilizzare una scheda Meet esistente prima di aprirne una nuova. La corrispondenza ignora stringhe di query URL innocue come `authuser`, quindi un nuovo tentativo dell'agente dovrebbe portare in primo piano la riunione già aperta invece di creare una seconda scheda Chrome.

L'output del comando/strumento include un campo `source` (`api` o `browser`) così gli agenti possono spiegare quale percorso è stato usato. `create` entra nella nuova riunione per impostazione predefinita e restituisce `joined: true` più la sessione di accesso. Per generare solo l'URL, usa `create --no-join` nella CLI o passa `"join": false` allo strumento.

Oppure dì a un agente: "Crea un Google Meet, entra con voce realtime e mandami il link." L'agente dovrebbe chiamare `google_meet` con `action: "create"` e poi condividere il `meetingUri` restituito.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Per un accesso in sola osservazione/controllo browser, imposta `"mode": "transcribe"`. Questo non avvia il bridge duplex del modello realtime, non richiede BlackHole o SoX e non risponderà vocalmente nella riunione. Gli accessi Chrome in questa modalità evitano anche la concessione dei permessi microfono/camera di OpenClaw ed evitano il percorso Meet **Usa microfono**. Se Meet mostra un interstitial di scelta audio, l'automazione prova il percorso senza microfono e altrimenti segnala un'azione manuale invece di aprire il microfono locale. In modalità transcribe, i trasporti Chrome gestiti installano anche un osservatore delle didascalie Meet best-effort. `googlemeet status --json` e `googlemeet doctor` espongono `captioning`, `captionsEnabledAttempted`, `transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText` e una breve coda `recentTranscript` così gli operatori possono capire se il browser è entrato nella chiamata e se le didascalie Meet stanno producendo testo.
Usa `openclaw googlemeet test-listen <meet-url> --transport chrome-node` quando ti serve una verifica sì/no: entra in modalità transcribe, attende didascalie fresche o movimento della trascrizione e restituisce `listenVerified`, `listenTimedOut`, campi di azione manuale e l'ultimo stato di salute delle didascalie.

Durante le sessioni realtime, lo stato di `google_meet` include la salute del browser e del bridge audio, come `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, timestamp dell'ultimo input/output, contatori di byte e stato di chiusura del bridge. Se compare un prompt sicuro della pagina Meet, l'automazione del browser lo gestisce quando può. Prompt di accesso, ammissione dell'host e permessi browser/OS vengono segnalati come azione manuale con un motivo e un messaggio che l'agente può riferire. Le sessioni Chrome gestite emettono l'introduzione o la frase di test solo dopo che la salute del browser riporta `inCall: true`; altrimenti lo stato riporta `speechReady: false` e il tentativo vocale viene bloccato invece di fingere che l'agente abbia parlato nella riunione.

Gli accessi Chrome locali passano tramite il profilo browser OpenClaw autenticato. La modalità realtime richiede `BlackHole 2ch` per il percorso microfono/altoparlante usato da OpenClaw. Per audio duplex pulito, usa dispositivi virtuali separati o un grafo in stile Loopback; un singolo dispositivo BlackHole è sufficiente per un primo smoke test ma può creare eco.

### Gateway locale + Chrome su Parallels

Non hai bisogno di un Gateway OpenClaw completo né di una chiave API del modello dentro una VM macOS solo per far possedere Chrome alla VM. Esegui il Gateway e l'agente localmente, quindi esegui un host Node nella VM. Abilita il plugin incluso nella VM una volta, così il Node annuncia il comando Chrome:

Cosa viene eseguito dove:

- Host Gateway: OpenClaw Gateway, workspace dell'agente, chiavi modello/API, provider realtime e configurazione del plugin Google Meet.
- VM macOS Parallels: CLI/host Node OpenClaw, Google Chrome, SoX, BlackHole 2ch e un profilo Chrome autenticato in Google.
- Non necessario nella VM: servizio Gateway, configurazione agente, chiave OpenAI/GPT o configurazione del provider del modello.

Installa le dipendenze della VM:

```bash
brew install blackhole-2ch sox
```

Riavvia la VM dopo aver installato BlackHole, così macOS espone `BlackHole 2ch`:

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

Avvia l'host Node nella VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Se `<gateway-host>` è un IP LAN e non stai usando TLS, il Node rifiuta il WebSocket in testo in chiaro a meno che tu non acconsenta per quella rete privata attendibile:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` è un ambiente di processo, non un'impostazione `openclaw.json`. `openclaw node install` lo memorizza nell'ambiente LaunchAgent quando è presente nel comando di installazione.

Approva il Node dall'host Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Conferma che il Gateway veda il Node e che annunci sia `googlemeet.chrome` sia la capability browser/`browser.proxy`:

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

Ora entra normalmente dall'host Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

oppure chiedi all'agente di usare lo strumento `google_meet` con `transport: "chrome-node"`.

Per uno smoke test con un solo comando che crea o riutilizza una sessione, pronuncia una frase nota e stampa la salute della sessione:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Durante l'ingresso in tempo reale, l'automazione browser di OpenClaw compila il nome dell'ospite, fa clic su Join/Ask to join e accetta la scelta "Use microphone" al primo avvio di Meet quando quel prompt appare. Durante l'ingresso in sola osservazione o la creazione di una riunione solo tramite browser, supera lo stesso prompt senza microfono quando quella scelta è disponibile. Se il profilo del browser non ha effettuato l'accesso, Meet è in attesa dell'ammissione da parte dell'host, Chrome richiede l'autorizzazione per microfono/camera per un ingresso in tempo reale, oppure Meet è bloccato su un prompt che l'automazione non è riuscita a risolvere, il risultato di join/test-speech riporta `manualActionRequired: true` con `manualActionReason` e `manualActionMessage`. Gli agenti devono interrompere i tentativi di ingresso, riportare esattamente quel messaggio insieme agli attuali `browserUrl`/`browserTitle` e riprovare solo dopo il completamento dell'azione manuale nel browser.

Se `chromeNode.node` è omesso, OpenClaw seleziona automaticamente solo quando esattamente un nodo connesso annuncia sia `googlemeet.chrome` sia il controllo del browser. Se sono connessi più nodi compatibili, imposta `chromeNode.node` sull'ID del nodo, sul nome visualizzato o sull'IP remoto.

Controlli comuni degli errori:

- `Configured Google Meet node ... is not usable: offline`: il nodo fissato è noto al Gateway ma non disponibile. Gli agenti devono trattare quel nodo come stato diagnostico, non come un host Chrome utilizzabile, e riportare il blocco di configurazione invece di ripiegare su un altro trasporto, a meno che l'utente non lo abbia richiesto.
- `No connected Google Meet-capable node`: avvia `openclaw node run` nella VM, approva l'abbinamento e assicurati che `openclaw plugins enable google-meet` e `openclaw plugins enable browser` siano stati eseguiti nella VM. Conferma anche che l'host Gateway consenta entrambi i comandi del nodo con `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: installa `blackhole-2ch` sull'host verificato e riavvia prima di usare l'audio Chrome locale.
- `BlackHole 2ch audio device not found on the node`: installa `blackhole-2ch` nella VM e riavvia la VM.
- Chrome si apre ma non riesce a entrare: accedi al profilo del browser dentro la VM, oppure mantieni `chrome.guestName` impostato per l'ingresso come ospite. L'ingresso automatico come ospite usa l'automazione browser di OpenClaw tramite il proxy browser del nodo; assicurati che la configurazione del browser del nodo punti al profilo desiderato, per esempio `browser.defaultProfile: "user"` oppure un profilo di sessione esistente con nome.
- Schede Meet duplicate: lascia abilitato `chrome.reuseExistingTab: true`. OpenClaw attiva una scheda esistente per lo stesso URL Meet prima di aprirne una nuova, e la creazione di riunioni tramite browser riusa una scheda `https://meet.google.com/new` in corso o una scheda di prompt dell'account Google prima di aprirne un'altra.
- Nessun audio: in Meet, instrada microfono/altoparlante attraverso il percorso del dispositivo audio virtuale usato da OpenClaw; usa dispositivi virtuali separati o un routing in stile Loopback per audio duplex pulito.

## Note di installazione

L'impostazione predefinita in tempo reale di Chrome usa due strumenti esterni:

- `sox`: utility audio da riga di comando. Il Plugin usa comandi espliciti del dispositivo CoreAudio per il bridge audio PCM16 predefinito a 24 kHz.
- `blackhole-2ch`: driver audio virtuale macOS. Crea il dispositivo audio `BlackHole 2ch` attraverso cui Chrome/Meet può instradare l'audio.

OpenClaw non include né ridistribuisce nessuno dei due pacchetti. La documentazione chiede agli utenti di installarli come dipendenze host tramite Homebrew. SoX è concesso in licenza come `LGPL-2.0-only AND GPL-2.0-only`; BlackHole è GPL-3.0. Se crei un programma di installazione o appliance che include BlackHole con OpenClaw, verifica i termini di licenza upstream di BlackHole oppure ottieni una licenza separata da Existential Audio.

## Trasporti

### Chrome

Il trasporto Chrome apre l'URL Meet tramite il controllo browser di OpenClaw ed entra con il profilo browser OpenClaw che ha effettuato l'accesso. Su macOS, il Plugin verifica la presenza di `BlackHole 2ch` prima dell'avvio. Se configurato, esegue anche un comando di integrità del bridge audio e un comando di avvio prima di aprire Chrome. Usa `chrome` quando Chrome/audio si trovano sull'host Gateway; usa `chrome-node` quando Chrome/audio si trovano su un nodo abbinato, come una VM macOS Parallels. Per Chrome locale, scegli il profilo con `browser.defaultProfile`; `chrome.browserProfile` viene passato agli host `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Instrada l'audio di microfono e altoparlante di Chrome attraverso il bridge audio locale di OpenClaw. Se `BlackHole 2ch` non è installato, l'ingresso fallisce con un errore di configurazione invece di entrare silenziosamente senza un percorso audio.

### Twilio

Il trasporto Twilio è un piano di composizione rigoroso delegato al Plugin Voice Call. Non analizza le pagine Meet alla ricerca di numeri di telefono.

Usalo quando la partecipazione tramite Chrome non è disponibile o desideri un fallback di chiamata telefonica. Google Meet deve esporre un numero di accesso telefonico e un PIN per la riunione; OpenClaw non li scopre dalla pagina Meet.

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

Fornisci le credenziali Twilio tramite ambiente o configurazione. L'ambiente mantiene i segreti fuori da `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Riavvia o ricarica il Gateway dopo aver abilitato `voice-call`; le modifiche alla configurazione del Plugin non appaiono in un processo Gateway già in esecuzione finché non viene ricaricato.

Quindi verifica:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Quando la delega Twilio è cablata, `googlemeet setup` include controlli riusciti per `twilio-voice-call-plugin`, `twilio-voice-call-credentials` e `twilio-voice-call-webhook`.

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

OAuth è facoltativo per creare un link Meet perché `googlemeet create` può ripiegare sull'automazione browser. Configura OAuth quando desideri la creazione tramite API ufficiale, la risoluzione degli spazi o controlli preflight della Meet Media API.

L'accesso alla Google Meet API usa OAuth utente: crea un client OAuth Google Cloud, richiedi gli ambiti necessari, autorizza un account Google, quindi memorizza il token di aggiornamento risultante nella configurazione del Plugin Google Meet oppure fornisci le variabili d'ambiente `OPENCLAW_GOOGLE_MEET_*`.

OAuth non sostituisce il percorso di ingresso Chrome. I trasporti Chrome e Chrome-node entrano comunque tramite un profilo Chrome che ha effettuato l'accesso, BlackHole/SoX e un nodo connesso quando usi la partecipazione tramite browser. OAuth serve solo per il percorso ufficiale della Google Meet API: creare spazi riunione, risolvere spazi ed eseguire controlli preflight della Meet Media API.

### Crea credenziali Google

In Google Cloud Console:

1. Crea o seleziona un progetto Google Cloud.
2. Abilita **Google Meet REST API** per quel progetto.
3. Configura la schermata di consenso OAuth.
   - **Internal** è l'opzione più semplice per un'organizzazione Google Workspace.
   - **External** funziona per configurazioni personali/di test; mentre l'app è in Testing, aggiungi come utente di test ogni account Google che autorizzerà l'app.
4. Aggiungi gli ambiti richiesti da OpenClaw:
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

6. Copia l'ID client e il client secret.

`meetings.space.created` è richiesto da Google Meet `spaces.create`. `meetings.space.readonly` permette a OpenClaw di risolvere URL/codici Meet in spazi. `meetings.space.settings` permette a OpenClaw di passare impostazioni `SpaceConfig` come `accessType` durante la creazione di stanze tramite API. `meetings.conference.media.readonly` serve per il preflight della Meet Media API e per il lavoro sui media; Google potrebbe richiedere l'iscrizione al Developer Preview per l'uso effettivo della Media API. Se ti servono solo ingressi Chrome basati su browser, salta completamente OAuth.

### Genera il token di aggiornamento

Configura `oauth.clientId` e facoltativamente `oauth.clientSecret`, oppure passali come variabili d'ambiente, quindi esegui:

```bash
openclaw googlemeet auth login --json
```

Il comando stampa un blocco di configurazione `oauth` con un token di aggiornamento. Usa PKCE, callback localhost su `http://localhost:8085/oauth2callback` e un flusso manuale di copia/incolla con `--manual`.

Esempi:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Usa la modalità manuale quando il browser non riesce a raggiungere il callback locale:

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

Memorizza l'oggetto `oauth` sotto la configurazione del Plugin Google Meet:

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

Preferisci le variabili d'ambiente quando non vuoi il token di aggiornamento nella configurazione. Se sono presenti sia valori di configurazione sia valori d'ambiente, il Plugin risolve prima la configurazione e poi il fallback dell'ambiente.

Il consenso OAuth include la creazione di spazi Meet, l'accesso in lettura agli spazi Meet e l'accesso in lettura ai media delle conferenze Meet. Se hai effettuato l'autenticazione prima che esistesse il supporto alla creazione di riunioni, riesegui `openclaw googlemeet auth login --json` in modo che il token di aggiornamento abbia l'ambito `meetings.space.created`.

### Verifica OAuth con doctor

Esegui il doctor OAuth quando desideri un controllo di integrità rapido e senza segreti:

```bash
openclaw googlemeet doctor --oauth --json
```

Questo non carica il runtime Chrome né richiede un nodo Chrome connesso. Verifica che la configurazione OAuth esista e che il token di aggiornamento possa generare un token di accesso. Il report JSON include solo campi di stato come `ok`, `configured`, `tokenSource`, `expiresAt` e messaggi di controllo; non stampa il token di accesso, il token di aggiornamento o il client secret.

Risultati comuni:

| Controllo            | Significato                                                                             |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` più `oauth.refreshToken`, oppure un token di accesso memorizzato nella cache, è presente. |
| `oauth-token`        | Il token di accesso memorizzato nella cache è ancora valido, oppure il token di aggiornamento ha generato un nuovo token di accesso. |
| `meet-spaces-get`    | Il controllo facoltativo `--meeting` ha risolto uno spazio Meet esistente.              |
| `meet-spaces-create` | Il controllo facoltativo `--create-space` ha creato un nuovo spazio Meet.               |

Per dimostrare anche l'abilitazione della Google Meet API e l'ambito `spaces.create`, esegui il controllo di creazione con effetti collaterali:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` crea un URL Meet usa e getta. Usalo quando devi confermare
che il progetto Google Cloud abbia l'API Meet abilitata e che l'account
autorizzato abbia lo scope `meetings.space.created`.

Per dimostrare l'accesso in lettura a uno spazio riunione esistente:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` e `resolve-space` dimostrano l'accesso in lettura a
uno spazio esistente a cui l'account Google autorizzato può accedere. Un `403`
da questi controlli di solito significa che l'API REST Google Meet è disabilitata,
che nel refresh token autorizzato manca lo scope richiesto, oppure che l'account
Google non può accedere a quello spazio Meet. Un errore di refresh token significa
che devi rieseguire `openclaw googlemeet auth login --json` e salvare il nuovo
blocco `oauth`.

Non sono necessarie credenziali OAuth per il fallback del browser. In quella
modalità, l'autenticazione Google proviene dal profilo Chrome con accesso
effettuato sul nodo selezionato, non dalla configurazione OpenClaw.

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

Elenca gli artefatti della riunione e le presenze dopo che Meet ha creato i record
della conferenza:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Con `--meeting`, `artifacts` e `attendance` usano per impostazione predefinita
il record conferenza più recente. Passa `--all-conference-records` quando vuoi
tutti i record conservati per quella riunione.

La ricerca nel calendario può risolvere l'URL della riunione da Google Calendar
prima di leggere gli artefatti Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` cerca nel calendario `primary` di oggi un evento Calendar con un link
Google Meet. Usa `--event <query>` per cercare nel testo degli eventi corrispondenti
e `--calendar <id>` per un calendario non primario. La ricerca nel calendario
richiede un nuovo login OAuth che includa lo scope di sola lettura degli eventi
Calendar. `calendar-events` mostra in anteprima gli eventi Meet corrispondenti
e contrassegna l'evento che `latest`, `artifacts`, `attendance` o `export`
sceglieranno.

Se conosci già l'id del record conferenza, indirizzalo direttamente:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Termina una conferenza attiva per uno spazio creato tramite API quando vuoi chiudere
la stanza dopo la chiamata:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Questo chiama Google Meet `spaces.endActiveConference` e richiede OAuth con lo
scope `meetings.space.created` per uno spazio che l'account autorizzato può
gestire. OpenClaw accetta in input un URL Meet, un codice riunione o `spaces/{id}`
e lo risolve nella risorsa spazio dell'API prima di terminare la conferenza attiva.
È separato da `googlemeet leave`: `leave` interrompe la partecipazione locale/di
sessione di OpenClaw, mentre `end-active-conference` chiede a Google Meet di
terminare la conferenza attiva per lo spazio.

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

`artifacts` restituisce i metadati del record conferenza più i metadati delle
risorse di partecipanti, registrazioni, trascrizioni, voci di trascrizione
strutturate e note intelligenti quando Google li espone per la riunione. Usa
`--no-transcript-entries` per saltare la ricerca delle voci nelle riunioni di
grandi dimensioni. `attendance` espande i partecipanti in righe di sessione
partecipante con orari di prima/ultima visualizzazione, durata totale della
sessione, flag di ritardo/uscita anticipata e risorse partecipante duplicate
unite per utente con accesso effettuato o nome visualizzato. Passa
`--no-merge-duplicates` per mantenere separate le risorse partecipante grezze,
`--late-after-minutes` per regolare il rilevamento dei ritardi e
`--early-before-minutes` per regolare il rilevamento delle uscite anticipate.

`export` scrive una cartella contenente `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` e `manifest.json`.
`manifest.json` registra l'input scelto, le opzioni di esportazione, i record
conferenza, i file di output, i conteggi, l'origine del token, l'evento Calendar
quando ne è stato usato uno ed eventuali avvisi di recupero parziale. Passa
`--zip` per scrivere anche un archivio portabile accanto alla cartella. Passa
`--include-doc-bodies` per esportare il testo dei Google Docs collegati per
trascrizioni e note intelligenti tramite Google Drive `files.export`; questo
richiede un nuovo login OAuth che includa lo scope Drive Meet di sola lettura.
Senza `--include-doc-bodies`, le esportazioni includono solo metadati Meet e
voci di trascrizione strutturate. Se Google restituisce un errore parziale sugli
artefatti, come un errore di elenco delle note intelligenti, delle voci di
trascrizione o del corpo documento Drive, il riepilogo e il manifest mantengono
l'avviso invece di far fallire l'intera esportazione. Usa `--dry-run` per
recuperare gli stessi dati di artefatti/presenze e stampare il JSON del manifest
senza creare la cartella o lo ZIP. È utile prima di scrivere un'esportazione di
grandi dimensioni o quando un agente ha bisogno solo di conteggi, record
selezionati e avvisi.

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

Imposta `"dryRun": true` per restituire solo il manifest di esportazione e saltare
le scritture su file.

Gli agenti possono anche creare una stanza supportata dall'API con una policy di
accesso esplicita:

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

Per la validazione con ascolto iniziale, gli agenti dovrebbero usare `test_listen`
prima di dichiarare che la riunione è utile:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Esegui lo smoke test live protetto su una vera riunione conservata:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Esegui la sonda live del browser con ascolto iniziale su una riunione in cui
qualcuno parlerà con sottotitoli Meet disponibili:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Ambiente dello smoke test live:

- `OPENCLAW_LIVE_TEST=1` abilita i test live protetti.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` punta a un URL Meet conservato, un codice o
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` o `GOOGLE_MEET_CLIENT_ID` fornisce l'id client
  OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` o `GOOGLE_MEET_REFRESH_TOKEN` fornisce il
  refresh token.
- Facoltativo: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` e
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` usano gli stessi nomi di fallback
  senza il prefisso `OPENCLAW_`.

Lo smoke test live di base per artefatti/presenze richiede
`https://www.googleapis.com/auth/meetings.space.readonly` e
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. La ricerca
nel calendario richiede `https://www.googleapis.com/auth/calendar.events.readonly`.
L'esportazione del corpo documento Drive richiede
`https://www.googleapis.com/auth/drive.meet.readonly`.

Crea un nuovo spazio Meet:

```bash
openclaw googlemeet create
```

Il comando stampa il nuovo `meeting uri`, l'origine e la sessione di partecipazione.
Con credenziali OAuth usa l'API ufficiale Google Meet. Senza credenziali OAuth
usa come fallback il profilo browser con accesso effettuato del nodo Chrome
fissato. Gli agenti possono usare lo strumento `google_meet` con `action: "create"`
per creare e partecipare in un unico passaggio. Per la creazione del solo URL,
passa `"join": false`.

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

Se il fallback del browser incontra il login Google o un blocco di autorizzazioni
Meet prima di poter creare l'URL, il metodo Gateway restituisce una risposta
non riuscita e lo strumento `google_meet` restituisce dettagli strutturati invece
di una semplice stringa:

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

Quando un agente vede `manualActionRequired: true`, deve segnalare
`manualActionMessage` più il contesto nodo/scheda del browser e smettere di
aprire nuove schede Meet finché l'operatore non completa il passaggio nel browser.

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

La creazione di un Meet comporta la partecipazione per impostazione predefinita.
Il trasporto Chrome o Chrome-node richiede comunque un profilo Google Chrome con
accesso effettuato per partecipare tramite browser. Se il profilo è disconnesso,
OpenClaw segnala `manualActionRequired: true` o un errore di fallback del browser
e chiede all'operatore di completare il login Google prima di riprovare.

Imposta `preview.enrollmentAcknowledged: true` solo dopo aver confermato che il
tuo progetto Cloud, il principale OAuth e i partecipanti alla riunione sono
iscritti al Google Workspace Developer Preview Program per le API multimediali
Meet.

## Configurazione

Il percorso realtime comune di Chrome richiede solo il Plugin abilitato, BlackHole,
SoX e una chiave di provider voce realtime di backend. OpenAI è il valore
predefinito; imposta `realtime.provider: "google"` per usare Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Imposta la configurazione del Plugin in `plugins.entries.google-meet.config`:

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
- `chrome.guestName: "OpenClaw Agent"`: nome usato nella schermata dell'ospite Meet non autenticato
- `chrome.autoJoin: true`: compilazione del nome ospite e clic su Partecipa ora best-effort tramite l'automazione del browser OpenClaw su `chrome-node`
- `chrome.reuseExistingTab: true`: attiva una scheda Meet esistente invece di aprire duplicati
- `chrome.waitForInCallMs: 20000`: attende che la scheda Meet segnali di essere in chiamata prima di attivare l'introduzione realtime
- `chrome.audioFormat: "pcm16-24khz"`: formato audio della coppia di comandi. Usa `"g711-ulaw-8khz"` solo per coppie di comandi legacy/personalizzate che emettono ancora audio telefonico.
- `chrome.audioInputCommand`: comando SoX che legge da CoreAudio `BlackHole 2ch` e scrive audio in `chrome.audioFormat`
- `chrome.audioOutputCommand`: comando SoX che legge audio in `chrome.audioFormat` e scrive su CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: comando opzionale del microfono locale che scrive PCM mono little-endian firmato a 16 bit per il rilevamento dell'interruzione umana mentre la riproduzione dell'assistente è attiva. Al momento si applica al bridge della coppia di comandi `chrome` ospitato dal Gateway.
- `chrome.bargeInRmsThreshold: 650`: livello RMS che conta come interruzione umana su `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: livello di picco che conta come interruzione umana su `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: ritardo minimo tra cancellazioni ripetute di interruzioni umane
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: risposte vocali brevi, con `openclaw_agent_consult` per risposte più approfondite
- `realtime.introMessage`: breve controllo vocale di prontezza quando il bridge realtime si connette; impostalo su `""` per entrare in silenzio
- `realtime.agentId`: id opzionale dell'agente OpenClaw per `openclaw_agent_consult`; il valore predefinito è `main`

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

`voiceCall.enabled` ha valore predefinito `true`; con il trasporto Twilio delega la chiamata PSTN effettiva, DTMF e il saluto introduttivo al Plugin Voice Call. Voice Call riproduce la sequenza DTMF prima di aprire lo stream multimediale realtime, poi usa il testo introduttivo salvato come saluto realtime iniziale. Se `voice-call` non è abilitato, Google Meet può comunque convalidare e registrare il piano di chiamata, ma non può effettuare la chiamata Twilio.

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

Usa `transport: "chrome"` quando Chrome è in esecuzione sull'host Gateway. Usa `transport: "chrome-node"` quando Chrome è in esecuzione su un nodo associato, come una VM Parallels. In entrambi i casi, il modello realtime e `openclaw_agent_consult` vengono eseguiti sull'host Gateway, quindi le credenziali del modello restano lì.

Usa `action: "status"` per elencare le sessioni attive o ispezionare un ID sessione. Usa `action: "speak"` con `sessionId` e `message` per far parlare immediatamente l'agente realtime. Usa `action: "test_speech"` per creare o riutilizzare la sessione, attivare una frase nota e restituire lo stato `inCall` quando l'host Chrome può segnalarlo. `test_speech` forza sempre `mode: "realtime"` e fallisce se gli viene chiesto di eseguire in `mode: "transcribe"` perché le sessioni di sola osservazione intenzionalmente non possono emettere parlato. Il suo risultato `speechOutputVerified` si basa sull'aumento dei byte di output audio realtime durante questa chiamata di test, quindi una sessione riutilizzata con audio precedente non conta come nuovo controllo vocale riuscito. Usa `action: "leave"` per contrassegnare una sessione come terminata.

`status` include lo stato di Chrome quando disponibile:

- `inCall`: Chrome sembra essere dentro la chiamata Meet
- `micMuted`: stato best-effort del microfono Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: il profilo del browser richiede accesso manuale, ammissione da parte dell'host Meet, autorizzazioni o riparazione del controllo browser prima che il parlato possa funzionare
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: indica se il parlato gestito da Chrome è consentito ora. `speechReady: false` significa che OpenClaw non ha inviato la frase introduttiva/di test nel bridge audio.
- `providerConnected` / `realtimeReady`: stato del bridge vocale realtime
- `lastInputAt` / `lastOutputAt`: ultimo audio visto dal bridge o inviato al bridge
- `lastSuppressedInputAt` / `suppressedInputBytes`: input local loopback ignorato mentre la riproduzione dell'assistente è attiva

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Consultazione dell'agente realtime

La modalità realtime di Chrome è ottimizzata per un ciclo vocale dal vivo. Il provider vocale realtime ascolta l'audio della riunione e parla attraverso il bridge audio configurato. Quando il modello realtime ha bisogno di ragionamento più approfondito, informazioni aggiornate o normali strumenti OpenClaw, può chiamare `openclaw_agent_consult`.

Lo strumento di consultazione esegue il normale agente OpenClaw dietro le quinte con il contesto recente della trascrizione della riunione e restituisce una risposta vocale concisa alla sessione vocale realtime. Il modello vocale può quindi pronunciare quella risposta nella riunione. Usa lo stesso strumento di consultazione realtime condiviso di Voice Call.

Per impostazione predefinita, le consultazioni vengono eseguite sull'agente `main`. Imposta `realtime.agentId` quando una corsia Meet deve consultare uno spazio di lavoro agente OpenClaw dedicato, valori predefiniti del modello, policy degli strumenti, memoria e cronologia della sessione.

`realtime.toolPolicy` controlla l'esecuzione della consultazione:

- `safe-read-only`: espone lo strumento di consultazione e limita l'agente normale a `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` e `memory_get`.
- `owner`: espone lo strumento di consultazione e lascia che l'agente normale usi la normale policy degli strumenti dell'agente.
- `none`: non espone lo strumento di consultazione al modello vocale realtime.

La chiave della sessione di consultazione ha ambito per sessione Meet, quindi le chiamate di consultazione successive possono riutilizzare il contesto di consultazione precedente durante la stessa riunione.

Per forzare un controllo vocale di prontezza dopo che Chrome ha completato l'ingresso nella chiamata:

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

Usa questa sequenza prima di affidare una riunione a un agente non supervisionato:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Stato previsto di Chrome-node:

- `googlemeet setup` è tutto verde.
- `googlemeet setup` include `chrome-node-connected` quando Chrome-node è il trasporto predefinito o un nodo è bloccato.
- `nodes status` mostra il nodo selezionato connesso.
- Il nodo selezionato annuncia sia `googlemeet.chrome` sia `browser.proxy`.
- La scheda Meet entra nella chiamata e `test-speech` restituisce lo stato di Chrome con `inCall: true`.

Per un host Chrome remoto, come una VM macOS Parallels, questo è il controllo sicuro più breve dopo l'aggiornamento del Gateway o della VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Questo dimostra che il Plugin Gateway è caricato, il nodo VM è connesso con il token corrente e il bridge audio Meet è disponibile prima che un agente apra una scheda di riunione reale.

Per uno smoke Twilio, usa una riunione che esponga i dettagli di accesso telefonico:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Stato previsto di Twilio:

- `googlemeet setup` include i controlli verdi `twilio-voice-call-plugin`, `twilio-voice-call-credentials` e `twilio-voice-call-webhook`.
- `voicecall` è disponibile nella CLI dopo il ricaricamento del Gateway.
- La sessione restituita ha `transport: "twilio"` e un `twilio.voiceCallId`.
- `openclaw logs --follow` mostra il TwiML DTMF servito prima del TwiML realtime, quindi un bridge realtime con il saluto iniziale in coda.
- `googlemeet leave <sessionId>` chiude la chiamata vocale delegata.

## Risoluzione dei problemi

### L'agente non vede lo strumento Google Meet

Conferma che il Plugin sia abilitato nella configurazione del Gateway e ricarica il Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Se hai appena modificato `plugins.entries.google-meet`, riavvia o ricarica il Gateway. L'agente in esecuzione vede solo gli strumenti del Plugin registrati dal processo Gateway corrente.

Sugli host Gateway non macOS, lo strumento `google_meet` rivolto all'agente resta visibile, ma le azioni realtime di Chrome locale vengono bloccate prima di raggiungere il bridge audio. L'audio realtime locale di Chrome al momento dipende da `BlackHole 2ch` su macOS, quindi gli agenti Linux dovrebbero usare `mode: "transcribe"`, l'accesso telefonico Twilio o un host `chrome-node` macOS invece del percorso realtime predefinito di Chrome locale.

### Nessun nodo compatibile con Google Meet connesso

Sull'host del nodo, esegui:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Sull'host Gateway, approva il nodo e verifica i comandi:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Il nodo deve essere connesso ed elencare `googlemeet.chrome` più `browser.proxy`. La configurazione del Gateway deve consentire quei comandi del nodo:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Se `googlemeet setup` fallisce `chrome-node-connected` o il log del Gateway segnala `gateway token mismatch`, reinstalla o riavvia il nodo con il token Gateway corrente. Per un Gateway LAN di solito significa:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Poi ricarica il servizio del nodo ed esegui di nuovo:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Il browser si apre ma l'agente non può entrare

Esegui `googlemeet test-listen` per ingressi di sola osservazione o `googlemeet test-speech` per ingressi realtime, poi ispeziona lo stato di Chrome restituito. Se una delle due verifiche segnala `manualActionRequired: true`, mostra `manualActionMessage` all'operatore e smetti di riprovare finché l'azione nel browser non è completa.

Azioni manuali comuni:

- Accedi al profilo Chrome.
- Ammetti l'ospite dall'account host Meet.
- Concedi le autorizzazioni per microfono/fotocamera a Chrome quando appare il prompt di autorizzazione nativo di Chrome.
- Chiudi o ripara una finestra di dialogo di autorizzazione Meet bloccata.

Non segnalare "not signed in" solo perché Meet mostra "Do you want people to
hear you in the meeting?" Questo è l'interstitial di scelta audio di Meet; OpenClaw
fa clic su **Use microphone** tramite automazione del browser quando disponibile e continua
ad attendere il vero stato della riunione. Per il fallback del browser limitato alla creazione, OpenClaw
può fare clic su **Continue without microphone** perché la creazione dell'URL non richiede
il percorso audio in tempo reale.

### La creazione della riunione non riesce

`googlemeet create` usa prima l'endpoint `spaces.create` dell'API Google Meet
quando le credenziali OAuth sono configurate. Senza credenziali OAuth ricorre
al fallback del browser Chrome node fissato. Verifica:

- Per la creazione tramite API: `oauth.clientId` e `oauth.refreshToken` sono configurati,
  oppure sono presenti variabili d'ambiente `OPENCLAW_GOOGLE_MEET_*` corrispondenti.
- Per la creazione tramite API: il token di refresh è stato emesso dopo l'aggiunta
  del supporto alla creazione. Ai token più vecchi potrebbe mancare lo scope
  `meetings.space.created`; esegui di nuovo
  `openclaw googlemeet auth login --json` e aggiorna la configurazione del plugin.
- Per il fallback del browser: `defaultTransport: "chrome-node"` e
  `chromeNode.node` puntano a un node connesso con `browser.proxy` e
  `googlemeet.chrome`.
- Per il fallback del browser: il profilo Chrome di OpenClaw su quel node ha effettuato l'accesso
  a Google e può aprire `https://meet.google.com/new`.
- Per il fallback del browser: i nuovi tentativi riutilizzano una scheda esistente
  `https://meet.google.com/new` o una scheda di richiesta dell'account Google prima di aprire una nuova scheda. Se un agent va in timeout,
  riprova la chiamata allo strumento invece di aprire manualmente un'altra scheda di Meet.
- Per il fallback del browser: se lo strumento restituisce `manualActionRequired: true`, usa
  i valori restituiti `browser.nodeId`, `browser.targetId`, `browserUrl` e
  `manualActionMessage` per guidare l'operatore. Non riprovare in ciclo finché
  quell'azione non è completa.
- Per il fallback del browser: se Meet mostra "Do you want people to hear you in the
  meeting?", lascia aperta la scheda. OpenClaw dovrebbe fare clic su **Use microphone** o, per
  il fallback limitato alla creazione, su **Continue without microphone** tramite automazione del browser
  e continuare ad attendere l'URL Meet generato. Se non può farlo, l'errore
  dovrebbe menzionare `meet-audio-choice-required`, non `google-login-required`.

### L'agent entra ma non parla

Controlla il percorso in tempo reale:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Usa `mode: "realtime"` per ascoltare/rispondere vocalmente. `mode: "transcribe"` intenzionalmente
non avvia il bridge vocale duplex in tempo reale. Per il debug in sola osservazione,
esegui `openclaw googlemeet status --json <session-id>` dopo che i partecipanti hanno parlato
e controlla `captioning`, `transcriptLines` e `lastCaptionText`. Se `inCall` è
true ma `transcriptLines` resta a `0`, i sottotitoli di Meet potrebbero essere disabilitati, nessuno
ha parlato da quando è stato installato l'osservatore, l'interfaccia di Meet è cambiata o i sottotitoli
in tempo reale non sono disponibili per la lingua/l'account della riunione.

`googlemeet test-speech` controlla sempre il percorso in tempo reale e segnala se
sono stati osservati byte di output del bridge per quella invocazione. Se `speechOutputVerified` è false e
`speechOutputTimedOut` è true, il provider in tempo reale potrebbe aver accettato
l'enunciato ma OpenClaw non ha visto nuovi byte di output raggiungere il bridge audio di Chrome.

Verifica anche:

- Una chiave del provider in tempo reale è disponibile sull'host Gateway, come
  `OPENAI_API_KEY` o `GEMINI_API_KEY`.
- `BlackHole 2ch` è visibile sull'host Chrome.
- `sox` esiste sull'host Chrome.
- Il microfono e l'altoparlante di Meet sono instradati attraverso il percorso audio virtuale usato da
  OpenClaw.

`googlemeet doctor [session-id]` stampa sessione, node, stato in chiamata,
motivo dell'azione manuale, connessione del provider in tempo reale, `realtimeReady`, attività
di input/output audio, ultimi timestamp audio, contatori di byte e URL del browser.
Usa `googlemeet status [session-id] --json` quando hai bisogno del JSON grezzo. Usa
`googlemeet doctor --oauth` quando devi verificare il refresh OAuth di Google Meet
senza esporre token; aggiungi `--meeting` o `--create-space` quando hai bisogno anche di una
prova dell'API Google Meet.

Se un agent è andato in timeout e puoi vedere una scheda Meet già aperta, ispeziona quella scheda
senza aprirne un'altra:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

L'azione strumento equivalente è `recover_current_tab`. Mette a fuoco e ispeziona una
scheda Meet esistente per il trasporto selezionato. Con `chrome`, usa il controllo locale
del browser tramite il Gateway; con `chrome-node`, usa il node Chrome configurato.
Non apre una nuova scheda né crea una nuova sessione; segnala il blocco
corrente, come login, ammissione, permessi o stato della scelta audio.
Il comando CLI parla con il Gateway configurato, quindi il Gateway deve essere in esecuzione;
`chrome-node` richiede anche che il node Chrome sia connesso.

### I controlli di configurazione Twilio non riescono

`twilio-voice-call-plugin` non riesce quando `voice-call` non è consentito o non è abilitato.
Aggiungilo a `plugins.allow`, abilita `plugins.entries.voice-call` e ricarica il
Gateway.

`twilio-voice-call-credentials` non riesce quando al backend Twilio mancano account
SID, token di autenticazione o numero chiamante. Impostali sull'host Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` non riesce quando `voice-call` non ha esposizione Webhook
pubblica, o quando `publicUrl` punta a local loopback o a uno spazio di rete privato.
Imposta `plugins.entries.voice-call.config.publicUrl` sull'URL pubblico del provider oppure
configura un tunnel/esposizione Tailscale per `voice-call`.

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

Per lo sviluppo locale, usa un tunnel o un'esposizione Tailscale invece di un URL
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

Quindi riavvia o ricarica il Gateway ed esegui:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` è solo un controllo di prontezza per impostazione predefinita. Per eseguire una prova a secco su un numero specifico:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Aggiungi `--yes` solo quando vuoi intenzionalmente effettuare una chiamata di notifica
in uscita reale:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### La chiamata Twilio parte ma non entra mai nella riunione

Conferma che l'evento Meet esponga i dettagli di chiamata telefonica. Passa il numero
di chiamata esatto e il PIN o una sequenza DTMF personalizzata:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Usa `w` iniziali o virgole in `--dtmf-sequence` se il provider richiede una pausa
prima di inserire il PIN.

Se la chiamata telefonica viene creata ma l'elenco dei partecipanti di Meet non mostra mai il partecipante
in chiamata:

- Esegui `openclaw googlemeet doctor <session-id>` per confermare l'ID chiamata Twilio
  delegato, se il DTMF è stato accodato e se il saluto introduttivo è stato richiesto.
- Esegui `openclaw voicecall status --call-id <id>` e conferma che la chiamata sia ancora
  attiva.
- Esegui `openclaw voicecall tail` e controlla che i Webhook Twilio arrivino al
  Gateway.
- Esegui `openclaw logs --follow` e cerca la sequenza Twilio Meet: Google
  Meet delega l'ingresso, Voice Call avvia la tratta telefonica, Google Meet attende
  `voiceCall.dtmfDelayMs`, invia DTMF con `voicecall.dtmf`, attende
  `voiceCall.postDtmfSpeechDelayMs`, quindi richiede il parlato introduttivo con
  `voicecall.speak`.
- Riesegui `openclaw googlemeet setup --transport twilio`; un controllo di configurazione verde è
  richiesto ma non prova che la sequenza del PIN della riunione sia corretta.
- Conferma che il numero di chiamata appartenga allo stesso invito Meet e alla stessa regione del
  PIN.
- Aumenta `voiceCall.dtmfDelayMs` se Meet risponde lentamente o la trascrizione della chiamata
  mostra ancora la richiesta di un PIN dopo l'invio del DTMF.
- Se il partecipante entra ma non senti il saluto, controlla
  `openclaw logs --follow` per la richiesta `voicecall.speak` post-DTMF e
  la riproduzione TTS media-stream o il fallback Twilio `<Say>`. Se la trascrizione della chiamata
  contiene ancora "enter the meeting PIN", la tratta telefonica non è ancora entrata
  nella stanza Meet, quindi i partecipanti alla riunione non sentiranno il parlato.

Se i Webhook non arrivano, esegui prima il debug del Plugin Voice Call: il provider deve
raggiungere `plugins.entries.voice-call.config.publicUrl` o il tunnel configurato.
Vedi [Risoluzione dei problemi delle chiamate vocali](/it/plugins/voice-call#troubleshooting).

## Note

L'API media ufficiale di Google Meet è orientata alla ricezione, quindi parlare in una chiamata Meet
richiede ancora un percorso partecipante. Questo plugin mantiene visibile quel confine:
Chrome gestisce la partecipazione dal browser e l'instradamento audio locale; Twilio gestisce
la partecipazione tramite chiamata telefonica.

La modalità in tempo reale di Chrome richiede `BlackHole 2ch` più uno dei seguenti:

- `chrome.audioInputCommand` più `chrome.audioOutputCommand`: OpenClaw possiede il
  bridge del modello in tempo reale e instrada l'audio in `chrome.audioFormat` tra quei
  comandi e il provider vocale in tempo reale selezionato. Il percorso Chrome predefinito è
  PCM16 a 24 kHz; G.711 mu-law a 8 kHz resta disponibile per le coppie di comandi legacy.
- `chrome.audioBridgeCommand`: un comando bridge esterno possiede l'intero percorso audio
  locale e deve terminare dopo aver avviato o validato il suo daemon.

Per un audio duplex pulito, instrada l'output di Meet e il microfono di Meet attraverso dispositivi
virtuali separati o un grafo di dispositivi virtuali in stile Loopback. Un singolo dispositivo
BlackHole condiviso può rimandare l'eco degli altri partecipanti nella chiamata.

Con il bridge Chrome a coppia di comandi, `chrome.bargeInInputCommand` può ascoltare un
microfono locale separato e interrompere la riproduzione dell'assistente quando l'umano inizia
a parlare. Questo mantiene il parlato umano davanti all'output dell'assistente anche quando l'input
local loopback BlackHole condiviso viene temporaneamente soppresso durante la riproduzione dell'assistente.
Come `chrome.audioInputCommand` e `chrome.audioOutputCommand`, è un
comando locale configurato dall'operatore. Usa un percorso comando o un elenco di argomenti esplicito e attendibile,
e non puntarlo a script provenienti da posizioni non attendibili.

`googlemeet speak` attiva il bridge audio in tempo reale attivo per una sessione
Chrome. `googlemeet leave` arresta quel bridge. Per le sessioni Twilio delegate
tramite il Plugin Voice Call, `leave` riaggancia anche la chiamata vocale sottostante.
Usa `googlemeet end-active-conference` quando vuoi anche chiudere la conferenza
Google Meet attiva per uno spazio gestito tramite API.

## Correlati

- [Plugin Voice Call](/it/plugins/voice-call)
- [Modalità conversazione](/it/nodes/talk)
- [Creare plugin](/it/plugins/building-plugins)
