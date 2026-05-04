---
read_when:
    - Vuoi che un agente OpenClaw partecipi a una chiamata Google Meet
    - Vuoi che un agente OpenClaw crei una nuova chiamata Google Meet
    - Stai configurando Chrome, nodo Chrome o Twilio come trasporto per Google Meet
summary: 'Plugin Google Meet: accedi a URL Meet espliciti tramite Chrome o Twilio con valori predefiniti per la risposta vocale dell''agente'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-05-04T07:07:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4268ad895bbf83d649b9571c0888c27eb982ad9710dfb408f22f7818cdc5dbcb
    source_path: plugins/google-meet.md
    workflow: 16
---

Supporto dei partecipanti Google Meet per OpenClaw — il plugin è esplicito per progettazione:

- Si collega solo a un URL esplicito `https://meet.google.com/...`.
- Può creare un nuovo spazio Meet tramite l'API Google Meet, quindi collegarsi all'URL restituito.
- `agent` è la modalità predefinita di risposta vocale: la trascrizione in tempo reale ascolta, l'agente OpenClaw configurato risponde e il normale TTS di OpenClaw parla in Meet.
- `bidi` rimane disponibile come modalità di fallback diretta del modello vocale in tempo reale.
- Gli agenti scelgono il comportamento di accesso con `mode`: usa `agent` per ascolto/risposta vocale live, `bidi` per il fallback vocale diretto in tempo reale, oppure `transcribe` per collegarsi/controllare il browser senza il bridge di risposta vocale.
- L'autenticazione inizia come OAuth Google personale o come profilo Chrome già connesso.
- Non esiste alcun annuncio automatico di consenso.
- Il backend audio predefinito di Chrome è `BlackHole 2ch`.
- Chrome può essere eseguito localmente o su un host Node associato.
- Twilio accetta un numero di accesso telefonico più un PIN opzionale o una sequenza DTMF; non può chiamare direttamente un URL Meet.
- Il comando CLI è `googlemeet`; `meet` è riservato a flussi di teleconferenza più ampi degli agenti.

## Avvio rapido

Installa le dipendenze audio locali e configura un provider di trascrizione in tempo reale più il normale TTS di OpenClaw. OpenAI è il provider di trascrizione predefinito; anche Google Gemini Live funziona come fallback vocale `bidi` separato con `realtime.voiceProvider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
export GEMINI_API_KEY=...
```

`blackhole-2ch` installa il dispositivo audio virtuale `BlackHole 2ch`. Il programma di installazione di Homebrew richiede un riavvio prima che macOS esponga il dispositivo:

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

L'output di configurazione è pensato per essere leggibile dagli agenti e consapevole della modalità. Riporta profilo Chrome, assegnazione del Node, e, per accessi Chrome in tempo reale, il bridge audio BlackHole/SoX e i controlli ritardati dell'introduzione in tempo reale. Per accessi di sola osservazione, controlla lo stesso trasporto con `--mode transcribe`; quella modalità salta i prerequisiti audio in tempo reale perché non ascolta né parla attraverso il bridge:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Quando la delega Twilio è configurata, la configurazione riporta anche se il plugin `voice-call`, le credenziali Twilio e l'esposizione pubblica del Webhook sono pronti. Considera qualsiasi controllo `ok: false` come un blocco per il trasporto e la modalità controllati prima di chiedere a un agente di collegarsi. Usa `openclaw googlemeet setup --json` per script o output leggibile da macchine. Usa `--transport chrome`, `--transport chrome-node` o `--transport twilio` per verificare in anticipo un trasporto specifico prima che un agente lo provi.

Per Twilio, verifica sempre il trasporto in modo esplicito quando il trasporto predefinito è Chrome:

```bash
openclaw googlemeet setup --transport twilio
```

Questo rileva collegamenti `voice-call` mancanti, credenziali Twilio assenti o esposizione Webhook non raggiungibile prima che l'agente provi a chiamare la riunione.

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
  "mode": "agent"
}
```

Lo strumento `google_meet` rivolto agli agenti rimane disponibile su host non macOS per flussi di artefatti, calendario, configurazione, trascrizione, Twilio e `chrome-node`. Le azioni locali di risposta vocale Chrome sono bloccate lì perché il percorso audio Chrome integrato attualmente dipende da `BlackHole 2ch` su macOS. Su Linux, usa `mode: "transcribe"`, l'accesso telefonico Twilio o un host macOS `chrome-node` per la partecipazione Chrome con risposta vocale.

Crea una nuova riunione e partecipa:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

Per stanze create via API, usa `SpaceConfig.accessType` di Google Meet quando vuoi che la policy di accesso senza richiesta sia esplicita invece di essere ereditata dalle impostazioni predefinite dell'account Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` consente a chiunque abbia l'URL Meet di partecipare senza richiedere l'accesso. `TRUSTED` consente agli utenti attendibili dell'organizzazione host, agli utenti esterni invitati e agli utenti con accesso telefonico di partecipare senza richiedere l'accesso. `RESTRICTED` limita l'ingresso senza richiesta agli invitati. Queste impostazioni si applicano solo al percorso ufficiale di creazione tramite API Google Meet, quindi le credenziali OAuth devono essere configurate.

Se hai autenticato Google Meet prima che questa opzione fosse disponibile, riesegui `openclaw googlemeet auth login --json` dopo aver aggiunto lo scope `meetings.space.settings` alla schermata di consenso OAuth Google.

Crea solo l'URL senza partecipare:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` ha due percorsi:

- Creazione API: usata quando le credenziali OAuth Google Meet sono configurate. È il percorso più deterministico e non dipende dallo stato dell'interfaccia del browser.
- Fallback del browser: usato quando le credenziali OAuth sono assenti. OpenClaw usa il Node Chrome assegnato, apre `https://meet.google.com/new`, attende che Google reindirizzi a un vero URL con codice riunione, quindi restituisce quell'URL. Questo percorso richiede che il profilo Chrome di OpenClaw sul Node sia già connesso a Google. L'automazione del browser gestisce la richiesta iniziale del microfono propria di Meet; tale richiesta non viene trattata come un errore di accesso Google.
  Anche i flussi di partecipazione e creazione provano a riutilizzare una scheda Meet esistente prima di aprirne una nuova. La corrispondenza ignora stringhe di query URL innocue come `authuser`, quindi un nuovo tentativo dell'agente dovrebbe mettere a fuoco la riunione già aperta invece di creare una seconda scheda Chrome.

L'output del comando/strumento include un campo `source` (`api` o `browser`) in modo che gli agenti possano spiegare quale percorso è stato usato. `create` partecipa alla nuova riunione per impostazione predefinita e restituisce `joined: true` più la sessione di partecipazione. Per generare solo l'URL, usa `create --no-join` nella CLI o passa `"join": false` allo strumento.

Oppure dì a un agente: "Crea un Google Meet, partecipa con la modalità di risposta vocale dell'agente e mandami il link." L'agente dovrebbe chiamare `google_meet` con `action: "create"` e poi condividere il `meetingUri` restituito.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Per un accesso di sola osservazione/controllo del browser, imposta `"mode": "transcribe"`. Questo non avvia il bridge vocale duplex in tempo reale, non richiede BlackHole o SoX e non risponderà vocalmente nella riunione. Gli accessi Chrome in questa modalità evitano anche la concessione dei permessi microfono/fotocamera di OpenClaw ed evitano il percorso **Usa microfono** di Meet. Se Meet mostra una schermata intermedia di scelta audio, l'automazione prova il percorso senza microfono e altrimenti segnala un'azione manuale invece di aprire il microfono locale. In modalità trascrizione, i trasporti Chrome gestiti installano anche un osservatore delle didascalie Meet best-effort. `googlemeet status --json` e `googlemeet doctor` espongono `captioning`, `captionsEnabledAttempted`, `transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText` e una breve coda `recentTranscript` in modo che gli operatori possano capire se il browser è entrato nella chiamata e se le didascalie Meet stanno producendo testo.
Usa `openclaw googlemeet test-listen <meet-url> --transport chrome-node` quando hai bisogno di una verifica sì/no: partecipa in modalità trascrizione, attende didascalie fresche o movimento della trascrizione, e restituisce `listenVerified`, `listenTimedOut`, campi di azione manuale e lo stato più recente delle didascalie.

Durante le sessioni in tempo reale, lo stato di `google_meet` include la salute del browser e del bridge audio, come `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, timestamp dell'ultimo input/output, contatori di byte e stato di chiusura del bridge. Se compare una richiesta sicura della pagina Meet, l'automazione del browser la gestisce quando può. Accesso, ammissione da parte dell'host e richieste di permesso del browser/OS sono segnalati come azione manuale con un motivo e un messaggio che l'agente deve riferire. Le sessioni Chrome gestite emettono l'introduzione o la frase di test solo dopo che la salute del browser riporta `inCall: true`; altrimenti lo stato riporta `speechReady: false` e il tentativo di parlato viene bloccato invece di fingere che l'agente abbia parlato nella riunione.

Gli accessi Chrome locali passano attraverso il profilo browser OpenClaw connesso. La modalità in tempo reale richiede `BlackHole 2ch` per il percorso microfono/altoparlante usato da OpenClaw. Per un audio duplex pulito, usa dispositivi virtuali separati o un grafo in stile Loopback; un singolo dispositivo BlackHole è sufficiente per un primo smoke test ma può generare eco.

### Gateway locale + Chrome Parallels

Non hai bisogno di un Gateway OpenClaw completo o di una chiave API del modello dentro una VM macOS solo per fare in modo che la VM possieda Chrome. Esegui Gateway e agente localmente, poi esegui un host Node nella VM. Abilita una volta il plugin integrato sulla VM in modo che il Node annunci il comando Chrome:

Cosa viene eseguito dove:

- Host Gateway: OpenClaw Gateway, workspace dell'agente, chiavi modello/API, provider in tempo reale e configurazione del plugin Google Meet.
- VM macOS Parallels: CLI/host Node OpenClaw, Google Chrome, SoX, BlackHole 2ch e un profilo Chrome connesso a Google.
- Non necessario nella VM: servizio Gateway, configurazione agente, chiave OpenAI/GPT o configurazione del provider modello.

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

Installa o aggiorna OpenClaw nella VM, quindi abilita lì il plugin integrato:

```bash
openclaw plugins enable google-meet
```

Avvia l'host Node nella VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Se `<gateway-host>` è un IP LAN e non stai usando TLS, il Node rifiuta il WebSocket in chiaro a meno che tu non dia il consenso esplicito per quella rete privata attendibile:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Usa la stessa variabile di ambiente quando installi il Node come LaunchAgent:

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

Conferma che il Gateway veda il Node e che annunci sia `googlemeet.chrome` sia la capacità del browser/`browser.proxy`:

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

Per uno smoke test con un solo comando che crea o riutilizza una sessione, pronuncia una frase nota e stampa la salute della sessione:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Durante l'accesso in tempo reale, l'automazione del browser di OpenClaw compila il nome dell'ospite, fa clic su Join/Ask to join e accetta la scelta "Use microphone" di primo avvio di Meet quando viene visualizzato quel prompt. Durante l'accesso in sola osservazione o la creazione di una riunione solo da browser, prosegue oltre lo stesso prompt senza microfono quando quella scelta è disponibile. Se il profilo del browser non ha effettuato l'accesso, Meet è in attesa dell'ammissione da parte dell'host, Chrome richiede l'autorizzazione per microfono/fotocamera per un accesso in tempo reale, oppure Meet è bloccato su un prompt che l'automazione non è riuscita a risolvere, il risultato join/test-speech segnala `manualActionRequired: true` con `manualActionReason` e `manualActionMessage`. Gli agenti devono interrompere i tentativi di accesso, riportare quel messaggio esatto insieme agli attuali `browserUrl`/`browserTitle` e riprovare solo dopo il completamento dell'azione manuale nel browser.

Se `chromeNode.node` viene omesso, OpenClaw seleziona automaticamente solo quando esattamente un nodo connesso annuncia sia `googlemeet.chrome` sia il controllo del browser. Se sono connessi diversi nodi compatibili, imposta `chromeNode.node` sull'ID del nodo, sul nome visualizzato o sull'IP remoto.

Controlli comuni in caso di errore:

- `Configured Google Meet node ... is not usable: offline`: il nodo fissato è noto al Gateway ma non è disponibile. Gli agenti devono trattare quel nodo come stato diagnostico, non come host Chrome utilizzabile, e segnalare il blocco di configurazione invece di ripiegare su un altro trasporto, salvo diversa richiesta dell'utente.
- `No connected Google Meet-capable node`: avvia `openclaw node run` nella VM, approva l'associazione e assicurati che `openclaw plugins enable google-meet` e `openclaw plugins enable browser` siano stati eseguiti nella VM. Conferma anche che l'host Gateway consenta entrambi i comandi del nodo con `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: installa `blackhole-2ch` sull'host controllato e riavvia prima di usare l'audio Chrome locale.
- `BlackHole 2ch audio device not found on the node`: installa `blackhole-2ch` nella VM e riavvia la VM.
- Chrome si apre ma non riesce ad accedere: effettua l'accesso al profilo del browser dentro la VM, oppure mantieni `chrome.guestName` impostato per l'accesso come ospite. L'accesso automatico come ospite usa l'automazione del browser di OpenClaw tramite il proxy del browser del nodo; assicurati che la configurazione del browser del nodo punti al profilo desiderato, ad esempio `browser.defaultProfile: "user"` o un profilo di sessione esistente con nome.
- Schede Meet duplicate: lascia abilitato `chrome.reuseExistingTab: true`. OpenClaw attiva una scheda esistente per lo stesso URL Meet prima di aprirne una nuova, e la creazione di riunioni dal browser riutilizza una scheda `https://meet.google.com/new` in corso o una scheda di prompt dell'account Google prima di aprirne un'altra.
- Nessun audio: in Meet, instrada microfono/altoparlante attraverso il percorso del dispositivo audio virtuale usato da OpenClaw; usa dispositivi virtuali separati o un routing in stile Loopback per un audio duplex pulito.

## Note di installazione

L'impostazione predefinita di talk-back di Chrome usa due strumenti esterni:

- `sox`: utilità audio da riga di comando. Il Plugin usa comandi dispositivo CoreAudio espliciti per il bridge audio PCM16 predefinito a 24 kHz.
- `blackhole-2ch`: driver audio virtuale macOS. Crea il dispositivo audio `BlackHole 2ch` attraverso cui Chrome/Meet può effettuare il routing.

OpenClaw non include né ridistribuisce nessuno dei due pacchetti. La documentazione chiede agli utenti di installarli come dipendenze dell'host tramite Homebrew. SoX è concesso in licenza come `LGPL-2.0-only AND GPL-2.0-only`; BlackHole è GPL-3.0. Se crei un installer o un'appliance che include BlackHole con OpenClaw, verifica i termini di licenza upstream di BlackHole oppure ottieni una licenza separata da Existential Audio.

## Trasporti

### Chrome

Il trasporto Chrome apre l'URL Meet tramite il controllo browser di OpenClaw e accede con il profilo browser OpenClaw che ha effettuato l'accesso. Su macOS, il Plugin verifica la presenza di `BlackHole 2ch` prima dell'avvio. Se configurato, esegue anche un comando di stato del bridge audio e un comando di avvio prima di aprire Chrome. Usa `chrome` quando Chrome/audio risiedono sull'host Gateway; usa `chrome-node` quando Chrome/audio risiedono su un nodo associato, ad esempio una VM macOS Parallels. Per Chrome locale, scegli il profilo con `browser.defaultProfile`; `chrome.browserProfile` viene passato agli host `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Instrada l'audio del microfono e dell'altoparlante di Chrome attraverso il bridge audio locale di OpenClaw. Se `BlackHole 2ch` non è installato, l'accesso fallisce con un errore di configurazione invece di entrare silenziosamente senza un percorso audio.

### Twilio

Il trasporto Twilio è un piano di chiamata rigoroso delegato al Plugin Voice Call. Non analizza le pagine Meet per trovare numeri di telefono.

Usalo quando la partecipazione con Chrome non è disponibile o desideri un fallback di accesso telefonico. Google Meet deve esporre un numero di accesso telefonico e un PIN per la riunione; OpenClaw non li rileva dalla pagina Meet.

Abilita il Plugin Voice Call sull'host Gateway, non sul nodo Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
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
          inboundPolicy: "allowlist",
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Join this Google Meet as an OpenClaw agent. Be brief.",
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                silenceDurationMs: 500,
                startSensitivity: "high",
              },
            },
          },
        },
      },
      google: {
        enabled: true,
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
export GEMINI_API_KEY=...
```

Usa invece `realtime.provider: "openai"` con il Plugin provider OpenAI e `OPENAI_API_KEY` se quello è il tuo provider voce in tempo reale.

Riavvia o ricarica il Gateway dopo aver abilitato `voice-call`; le modifiche alla configurazione dei Plugin non compaiono in un processo Gateway già in esecuzione finché non viene ricaricato.

Poi verifica:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Quando la delega Twilio è collegata, `googlemeet setup` include controlli riusciti `twilio-voice-call-plugin`, `twilio-voice-call-credentials` e `twilio-voice-call-webhook`.

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

OAuth è facoltativo per creare un link Meet perché `googlemeet create` può ripiegare sull'automazione del browser. Configura OAuth quando desideri la creazione tramite API ufficiale, la risoluzione degli spazi o i controlli preflight della Meet Media API.

L'accesso alla Google Meet API usa OAuth utente: crea un client OAuth Google Cloud, richiedi gli ambiti necessari, autorizza un account Google, quindi archivia il refresh token risultante nella configurazione del Plugin Google Meet oppure fornisci le variabili d'ambiente `OPENCLAW_GOOGLE_MEET_*`.

OAuth non sostituisce il percorso di accesso Chrome. I trasporti Chrome e Chrome-node accedono comunque tramite un profilo Chrome con accesso effettuato, BlackHole/SoX e un nodo connesso quando usi la partecipazione dal browser. OAuth serve solo per il percorso ufficiale della Google Meet API: creare spazi riunione, risolvere spazi ed eseguire controlli preflight della Meet Media API.

### Creare credenziali Google

In Google Cloud Console:

1. Crea o seleziona un progetto Google Cloud.
2. Abilita **Google Meet REST API** per quel progetto.
3. Configura la schermata di consenso OAuth.
   - **Internal** è la scelta più semplice per un'organizzazione Google Workspace.
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

`meetings.space.created` è richiesto da Google Meet `spaces.create`.
`meetings.space.readonly` consente a OpenClaw di risolvere URL/codici Meet in spazi.
`meetings.space.settings` consente a OpenClaw di passare impostazioni `SpaceConfig` come `accessType` durante la creazione della stanza tramite API.
`meetings.conference.media.readonly` serve per il preflight della Meet Media API e il lavoro sui media; Google può richiedere l'iscrizione a Developer Preview per l'uso effettivo della Media API.
Se ti servono solo accessi Chrome basati su browser, salta completamente OAuth.

### Generare il refresh token

Configura `oauth.clientId` e facoltativamente `oauth.clientSecret`, oppure passali come variabili d'ambiente, quindi esegui:

```bash
openclaw googlemeet auth login --json
```

Il comando stampa un blocco di configurazione `oauth` con un refresh token. Usa PKCE, callback localhost su `http://localhost:8085/oauth2callback` e un flusso manuale copia/incolla con `--manual`.

Esempi:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Usa la modalità manuale quando il browser non può raggiungere il callback locale:

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

Archivia l'oggetto `oauth` nella configurazione del Plugin Google Meet:

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

Preferisci le variabili d'ambiente quando non vuoi il refresh token nella configurazione. Se sono presenti sia valori di configurazione sia valori d'ambiente, il Plugin risolve prima la configurazione e poi il fallback dall'ambiente.

Il consenso OAuth include creazione di spazi Meet, accesso in lettura agli spazi Meet e accesso in lettura ai media delle conferenze Meet. Se hai effettuato l'autenticazione prima che esistesse il supporto alla creazione di riunioni, riesegui `openclaw googlemeet auth login --json` in modo che il refresh token abbia l'ambito `meetings.space.created`.

### Verificare OAuth con doctor

Esegui il doctor OAuth quando desideri un rapido controllo di integrità senza segreti:

```bash
openclaw googlemeet doctor --oauth --json
```

Questo non carica il runtime Chrome né richiede un nodo Chrome connesso. Verifica che la configurazione OAuth esista e che il refresh token possa generare un access token. Il report JSON include solo campi di stato come `ok`, `configured`, `tokenSource`, `expiresAt` e messaggi di controllo; non stampa access token, refresh token o client secret.

Risultati comuni:

| Controllo            | Significato                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` insieme a `oauth.refreshToken`, oppure un token di accesso in cache, è presente. |
| `oauth-token`        | Il token di accesso in cache è ancora valido, oppure il token di refresh ha generato un nuovo token di accesso. |
| `meet-spaces-get`    | Il controllo opzionale `--meeting` ha risolto uno spazio Meet esistente.                    |
| `meet-spaces-create` | Il controllo opzionale `--create-space` ha creato un nuovo spazio Meet.                     |

Per dimostrare anche l'abilitazione dell'API Google Meet e l'ambito `spaces.create`, esegui il
controllo di creazione con effetti collaterali:

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
di solito significa che l'API REST Google Meet è disabilitata, che al token di refresh con consenso
manca l'ambito richiesto, oppure che l'account Google non può accedere a quello spazio Meet. Un errore del token di refresh significa che devi rieseguire `openclaw googlemeet auth login
--json` e archiviare il nuovo blocco `oauth`.

Non sono necessarie credenziali OAuth per il fallback del browser. In quella modalità, l'autenticazione Google
proviene dal profilo Chrome con accesso effettuato sul Node selezionato, non dalla
configurazione OpenClaw.

Queste variabili di ambiente sono accettate come fallback:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` or `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` or `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` or `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` or `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` or
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` or `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` or `GOOGLE_MEET_PREVIEW_ACK`

Risolvi un URL Meet, un codice o `spaces/{id}` tramite `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Esegui il preflight prima del lavoro sui contenuti multimediali:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Elenca gli artefatti della riunione e la partecipazione dopo che Meet ha creato i record della conferenza:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Con `--meeting`, `artifacts` e `attendance` usano per impostazione predefinita il record di conferenza più recente.
Passa `--all-conference-records` quando vuoi tutti i record conservati
per quella riunione.

La ricerca nel calendario può risolvere l'URL della riunione da Google Calendar prima di leggere
gli artefatti Meet:

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

Se conosci già l'ID del record di conferenza, indirizzalo direttamente:

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

`artifacts` restituisce i metadati del record di conferenza più i metadati delle risorse relative a partecipanti, registrazioni,
trascrizioni, voci di trascrizione strutturate e note intelligenti quando
Google li espone per la riunione. Usa `--no-transcript-entries` per saltare
la ricerca delle voci per riunioni di grandi dimensioni. `attendance` espande i partecipanti in
righe di sessione partecipante con orari di prima/ultima presenza, durata totale della sessione,
flag di ritardo/uscita anticipata e risorse partecipante duplicate unite per utente
con accesso effettuato o nome visualizzato. Passa `--no-merge-duplicates` per mantenere separate le risorse partecipante
grezze, `--late-after-minutes` per regolare il rilevamento dei ritardi e
`--early-before-minutes` per regolare il rilevamento dell'uscita anticipata.

`export` scrive una cartella contenente `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` e `manifest.json`.
`manifest.json` registra l'input scelto, le opzioni di esportazione, i record di conferenza,
i file di output, i conteggi, l'origine del token, l'evento Calendar quando ne è stato usato uno e qualsiasi
avviso di recupero parziale. Passa `--zip` per scrivere anche un archivio portabile accanto
alla cartella. Passa `--include-doc-bodies` per esportare il testo dei Google Docs collegati per trascrizioni e
note intelligenti tramite Google Drive `files.export`; questo richiede un
nuovo accesso OAuth che includa l'ambito di sola lettura Drive Meet. Senza
`--include-doc-bodies`, le esportazioni includono solo metadati Meet e voci di trascrizione
strutturate. Se Google restituisce un errore parziale degli artefatti, come un errore di elenco
delle note intelligenti, di voce di trascrizione o del corpo del documento Drive, il riepilogo e
il manifest mantengono l'avviso invece di far fallire l'intera esportazione.
Usa `--dry-run` per recuperare gli stessi dati di artefatti/partecipazione e stampare il
JSON del manifest senza creare la cartella o lo ZIP. È utile prima di scrivere
un'esportazione di grandi dimensioni o quando un agente ha bisogno solo di conteggi, record selezionati e
avvisi.

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

Imposta `"dryRun": true` per restituire solo il manifest di esportazione e saltare le scritture su file.

Gli agenti possono anche creare una stanza supportata da API con una policy di accesso esplicita:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
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

Per la validazione con ascolto prioritario, gli agenti dovrebbero usare `test_listen` prima di dichiarare che la
riunione è utile:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Esegui il live smoke protetto su una riunione reale conservata:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Esegui la sonda browser live con ascolto prioritario su una riunione in cui qualcuno
parlerà con i sottotitoli Meet disponibili:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Ambiente live smoke:

- `OPENCLAW_LIVE_TEST=1` abilita i test live protetti.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` punta a un URL Meet conservato, a un codice o a
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` or `GOOGLE_MEET_CLIENT_ID` fornisce l'ID client OAuth.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` or `GOOGLE_MEET_REFRESH_TOKEN` fornisce
  il token di refresh.
- Opzionale: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` e
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` usano gli stessi nomi di fallback
  senza il prefisso `OPENCLAW_`.

Il live smoke di base per artefatti/partecipazione richiede
`https://www.googleapis.com/auth/meetings.space.readonly` e
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. La ricerca nel calendario
richiede `https://www.googleapis.com/auth/calendar.events.readonly`. L'esportazione del corpo dei documenti Drive
richiede
`https://www.googleapis.com/auth/drive.meet.readonly`.

Crea un nuovo spazio Meet:

```bash
openclaw googlemeet create
```

Il comando stampa il nuovo `meeting uri`, l'origine e la sessione di partecipazione. Con credenziali OAuth
usa l'API ufficiale Google Meet. Senza credenziali OAuth
usa come fallback il profilo browser con accesso effettuato del Node Chrome fissato. Gli agenti possono
usare lo strumento `google_meet` con `action: "create"` per creare e partecipare in un unico
passaggio. Per la creazione del solo URL, passa `"join": false`.

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

Se il fallback del browser incontra un blocco di accesso Google o di autorizzazione Meet prima di
poter creare l'URL, il metodo Gateway restituisce una risposta non riuscita e lo strumento
`google_meet` restituisce dettagli strutturati invece di una semplice stringa:

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

Quando un agente vede `manualActionRequired: true`, dovrebbe segnalare il
`manualActionMessage` più il contesto Node/scheda del browser e smettere di aprire nuove
schede Meet finché l'operatore non completa il passaggio nel browser.

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

La creazione di un Meet esegue l'accesso per impostazione predefinita. Il trasporto Chrome o Chrome-node richiede comunque un profilo Google Chrome autenticato per accedere tramite il browser. Se il profilo è disconnesso, OpenClaw segnala `manualActionRequired: true` o un errore di fallback del browser e chiede all'operatore di completare l'accesso a Google prima di riprovare.

Imposta `preview.enrollmentAcknowledged: true` solo dopo aver confermato che il tuo progetto Cloud, il principale OAuth e i partecipanti alla riunione sono iscritti al Google Workspace Developer Preview Program per le API multimediali di Meet.

## Configurazione

Il percorso comune dell'agente Chrome richiede solo il Plugin abilitato, BlackHole, SoX, una chiave di provider di trascrizione in tempo reale e un provider TTS OpenClaw configurato. OpenAI è il provider di trascrizione predefinito; imposta `realtime.voiceProvider` su `"google"` e `realtime.model` per usare Google Gemini Live per la modalità `bidi` senza modificare il provider di trascrizione predefinito della modalità agente:

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

Valori predefiniti:

- `defaultTransport: "chrome"`
- `defaultMode: "agent"` (`"realtime"` è accettato solo come alias di compatibilità legacy per `"agent"`; le nuove chiamate agli strumenti dovrebbero indicare `"agent"`)
- `chromeNode.node`: ID/nome/IP opzionale del nodo per `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: nome usato nella schermata ospite Meet quando non si è autenticati
- `chrome.autoJoin: true`: inserimento del nome ospite e clic su Partecipa ora con il massimo impegno tramite l'automazione browser di OpenClaw su `chrome-node`
- `chrome.reuseExistingTab: true`: attiva una scheda Meet esistente invece di aprire duplicati
- `chrome.waitForInCallMs: 20000`: attende che la scheda Meet segnali lo stato in chiamata prima di attivare l'introduzione di risposta vocale
- `chrome.audioFormat: "pcm16-24khz"`: formato audio della coppia di comandi. Usa `"g711-ulaw-8khz"` solo per coppie di comandi legacy/personalizzate che emettono ancora audio telefonico.
- `chrome.audioBufferBytes: 4096`: buffer di elaborazione SoX per i comandi audio della coppia di comandi Chrome generati. È metà del buffer predefinito di SoX da 8192 byte, riducendo la latenza predefinita della pipe e lasciando margine per aumentarlo su host occupati. I valori inferiori al minimo di SoX vengono limitati a 17 byte.
- `chrome.audioInputCommand`: comando SoX che legge da CoreAudio `BlackHole 2ch` e scrive l'audio in `chrome.audioFormat`
- `chrome.audioOutputCommand`: comando SoX che legge l'audio in `chrome.audioFormat` e scrive su CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: comando microfono locale opzionale che scrive PCM mono little-endian a 16 bit con segno per rilevare l'interruzione umana mentre la riproduzione dell'assistente è attiva. Questo attualmente si applica al bridge della coppia di comandi `chrome` ospitato dal Gateway.
- `chrome.bargeInRmsThreshold: 650`: livello RMS che conta come interruzione umana su `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: livello di picco che conta come interruzione umana su `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: ritardo minimo tra azzeramenti ripetuti di interruzioni umane
- `mode: "agent"`: modalità predefinita di risposta vocale. Il parlato dei partecipanti viene trascritto dal provider di trascrizione in tempo reale configurato, inviato all'agente OpenClaw configurato in una sessione di sotto-agente per riunione e riprodotto vocalmente tramite il normale runtime TTS di OpenClaw.
- `mode: "bidi"`: modalità di fallback con modello bidirezionale diretto in tempo reale. Il provider vocale in tempo reale risponde direttamente al parlato dei partecipanti e può chiamare `openclaw_agent_consult` per risposte più approfondite/basate su strumenti.
- `mode: "transcribe"`: modalità solo osservazione senza il bridge di risposta vocale.
- `realtime.provider: "openai"`: fallback di compatibilità usato quando i campi provider con ambito sotto sono non impostati.
- `realtime.transcriptionProvider: "openai"`: ID provider usato dalla modalità `agent` per la trascrizione in tempo reale.
- `realtime.voiceProvider`: ID provider usato dalla modalità `bidi` per la voce diretta in tempo reale. Impostalo su `"google"` per usare Gemini Live mantenendo la trascrizione in modalità agente su OpenAI.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: risposte vocali brevi, con `openclaw_agent_consult` per risposte più approfondite
- `realtime.introMessage`: breve controllo vocale di prontezza quando il bridge in tempo reale si connette; impostalo su `""` per entrare in silenzio
- `realtime.agentId`: ID agente OpenClaw opzionale per `openclaw_agent_consult`; predefinito: `main`

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
  defaultMode: "agent",
  realtime: {
    provider: "openai",
    transcriptionProvider: "openai",
    voiceProvider: "google",
    model: "gemini-2.5-flash-native-audio-preview-12-2025",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        voice: "Kore",
      },
    },
  },
}
```

ElevenLabs sia per l'ascolto sia per il parlato in modalità agente:

```json5
{
  messages: {
    tts: {
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          modelId: "eleven_v3",
          voiceId: "pMsXgVXv3BLzUgSXRplE",
        },
      },
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        config: {
          realtime: {
            transcriptionProvider: "elevenlabs",
            providers: {
              elevenlabs: {
                modelId: "scribe_v2_realtime",
                audioFormat: "ulaw_8000",
                sampleRate: 8000,
                commitStrategy: "vad",
              },
            },
          },
        },
      },
    },
  },
}
```

La voce Meet persistente proviene da `messages.tts.providers.elevenlabs.voiceId`. Le risposte dell'agente possono anche usare direttive per risposta `[[tts:voiceId=... model=eleven_v3]]` quando gli override del modello TTS sono abilitati, ma la configurazione è il valore predefinito deterministico per le riunioni. All'accesso, i log dovrebbero mostrare `transcriptionProvider=elevenlabs` e ogni risposta parlata dovrebbe registrare `provider=elevenlabs model=eleven_v3 voice=<voiceId>`.

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

`voiceCall.enabled` è predefinito su `true`; con il trasporto Twilio delega la chiamata PSTN effettiva, il DTMF e il saluto introduttivo al Plugin Voice Call. Voice Call riproduce la sequenza DTMF prima di aprire lo stream multimediale in tempo reale, poi usa il testo introduttivo salvato come saluto iniziale in tempo reale. Se `voice-call` non è abilitato, Google Meet può comunque convalidare e registrare il piano di composizione, ma non può effettuare la chiamata Twilio.

## Strumento

Gli agenti possono usare lo strumento `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Usa `transport: "chrome"` quando Chrome viene eseguito sull'host Gateway. Usa `transport: "chrome-node"` quando Chrome viene eseguito su un nodo associato, come una VM Parallels. In entrambi i casi i provider dei modelli e `openclaw_agent_consult` vengono eseguiti sull'host Gateway, quindi le credenziali dei modelli restano lì. Con il valore predefinito `mode: "agent"`, il provider di trascrizione in tempo reale gestisce l'ascolto, l'agente OpenClaw configurato produce la risposta e il normale TTS OpenClaw la pronuncia in Meet. Usa `mode: "bidi"` quando vuoi che il modello vocale in tempo reale risponda direttamente. Il valore grezzo `mode: "realtime"` resta accettato come alias di compatibilità legacy per `mode: "agent"`, ma non è più pubblicizzato nello schema dello strumento dell'agente. I log in modalità agente includono il provider/modello di trascrizione risolto all'avvio del bridge e il provider TTS, il modello, la voce, il formato di output e la frequenza di campionamento dopo ogni risposta sintetizzata.

Usa `action: "status"` per elencare le sessioni attive o ispezionare un ID sessione. Usa `action: "speak"` con `sessionId` e `message` per fare parlare immediatamente l'agente in tempo reale. Usa `action: "test_speech"` per creare o riutilizzare la sessione, attivare una frase nota e restituire lo stato di integrità `inCall` quando l'host Chrome può segnalarlo. `test_speech` forza sempre `mode: "agent"` e non riesce se gli viene chiesto di eseguire in `mode: "transcribe"` perché le sessioni solo osservazione intenzionalmente non possono emettere parlato. Il suo risultato `speechOutputVerified` si basa sull'aumento dei byte di output audio in tempo reale durante questa chiamata di test, quindi una sessione riutilizzata con audio precedente non conta come nuovo controllo vocale riuscito. Usa `action: "leave"` per contrassegnare una sessione come terminata.

`status` include lo stato di integrità di Chrome quando disponibile:

- `inCall`: Chrome sembra essere all'interno della chiamata Meet
- `micMuted`: stato del microfono Meet con il massimo impegno
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: il profilo browser richiede accesso manuale, ammissione dall'host Meet, autorizzazioni o riparazione del controllo browser prima che il parlato possa funzionare
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: indica se il parlato gestito da Chrome è consentito ora. `speechReady: false` significa che OpenClaw non ha inviato la frase introduttiva/di test nel bridge audio.
- `providerConnected` / `realtimeReady`: stato del bridge vocale in tempo reale
- `lastInputAt` / `lastOutputAt`: ultimo audio ricevuto dal bridge o inviato al bridge
- `audioOutputRouted` / `audioOutputDeviceLabel`: indica se l'output multimediale della scheda Meet è stato instradato attivamente al dispositivo BlackHole usato dal bridge
- `lastSuppressedInputAt` / `suppressedInputBytes`: input di local loopback ignorato mentre la riproduzione dell'assistente è attiva

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Modalità agente e bidi

La modalità Chrome `agent` è ottimizzata per il comportamento "il mio agente è nella riunione". Il provider di trascrizione in tempo reale ascolta l'audio della riunione, le trascrizioni finali dei partecipanti vengono instradate attraverso l'agente OpenClaw configurato e la risposta viene pronunciata tramite il normale runtime TTS di OpenClaw. Imposta `mode: "bidi"` quando vuoi che il modello vocale in tempo reale risponda direttamente. I frammenti vicini di trascrizione finale vengono coalesciati prima della consultazione in modo che un turno parlato non produca diverse risposte parziali obsolete. Anche l'input in tempo reale viene soppresso mentre l'audio dell'assistente in coda è ancora in riproduzione, e gli echi recenti di trascrizioni simili all'assistente vengono ignorati prima della consultazione dell'agente, così il local loopback di BlackHole non fa sì che l'agente risponda al proprio parlato.

| Modalità | Chi decide la risposta        | Percorso di output vocale                 | Quando usarla                                                |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | L'agente OpenClaw configurato | Normale runtime TTS OpenClaw            | Vuoi il comportamento "il mio agente è nella riunione"        |
| `bidi`  | Il modello vocale in tempo reale      | Risposta audio del provider vocale in tempo reale | Vuoi il ciclo vocale conversazionale con la latenza più bassa |

In modalità `bidi`, quando il modello in tempo reale ha bisogno di ragionamento più approfondito, informazioni correnti o normali strumenti OpenClaw, può chiamare `openclaw_agent_consult`.

Lo strumento consult esegue dietro le quinte il normale agente OpenClaw con il contesto recente della trascrizione della riunione e restituisce una risposta parlata concisa. In modalità `agent`, OpenClaw invia quella risposta direttamente al runtime TTS; in modalità `bidi`, il modello vocale in tempo reale può pronunciare il risultato di consult nella riunione. Usa lo stesso meccanismo condiviso di consult di Voice Call.

Per impostazione predefinita, i consult vengono eseguiti sull'agente `main`. Imposta `realtime.agentId` quando una corsia Meet deve consultare uno spazio di lavoro agente OpenClaw dedicato, valori predefiniti del modello, policy degli strumenti, memoria e cronologia di sessione.

I consult in modalità agente usano una chiave di sessione per riunione `agent:<id>:subagent:google-meet:<session>`, così le domande di follow-up mantengono il contesto della riunione ereditando la normale policy dell'agente dall'agente configurato.

`realtime.toolPolicy` controlla l'esecuzione di consult:

- `safe-read-only`: espone lo strumento consult e limita il normale agente a `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` e `memory_get`.
- `owner`: espone lo strumento consult e consente al normale agente di usare la normale policy degli strumenti dell'agente.
- `none`: non espone lo strumento consult al modello vocale in tempo reale.

La chiave di sessione consult è limitata a ogni sessione Meet, quindi le chiamate consult di follow-up possono riutilizzare il contesto consult precedente durante la stessa riunione.

Per forzare un controllo di prontezza parlato dopo che Chrome ha completato l'accesso alla chiamata:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Per lo smoke completo join-and-speak:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Checklist per test live

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
- `googlemeet setup` include `chrome-node-connected` quando Chrome-node è il trasporto predefinito o un nodo è fissato.
- `nodes status` mostra il nodo selezionato connesso.
- Il nodo selezionato pubblicizza sia `googlemeet.chrome` sia `browser.proxy`.
- La scheda Meet entra nella chiamata e `test-speech` restituisce lo stato di Chrome con `inCall: true`.

Per un host Chrome remoto come una VM macOS Parallels, questo è il controllo sicuro più breve dopo l'aggiornamento del Gateway o della VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Questo dimostra che il plugin Gateway è caricato, il nodo VM è connesso con il token corrente e il bridge audio Meet è disponibile prima che un agente apra una scheda di riunione reale.

Per uno smoke Twilio, usa una riunione che espone i dettagli di accesso telefonico:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Stato Twilio previsto:

- `googlemeet setup` include controlli verdi `twilio-voice-call-plugin`, `twilio-voice-call-credentials` e `twilio-voice-call-webhook`.
- `voicecall` è disponibile nella CLI dopo il ricaricamento del Gateway.
- La sessione restituita ha `transport: "twilio"` e un `twilio.voiceCallId`.
- `openclaw logs --follow` mostra TwiML DTMF servito prima del TwiML in tempo reale, quindi un bridge in tempo reale con il saluto iniziale in coda.
- `googlemeet leave <sessionId>` chiude la chiamata vocale delegata.

## Risoluzione dei problemi

### L'agente non vede lo strumento Google Meet

Conferma che il plugin sia abilitato nella configurazione del Gateway e ricarica il Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Se hai appena modificato `plugins.entries.google-meet`, riavvia o ricarica il Gateway. L'agente in esecuzione vede solo gli strumenti plugin registrati dal processo Gateway corrente.

Sugli host Gateway non macOS, lo strumento rivolto all'agente `google_meet` resta visibile, ma le azioni locali di talk-back di Chrome vengono bloccate prima di raggiungere il bridge audio. L'audio talk-back locale di Chrome attualmente dipende da `BlackHole 2ch` su macOS, quindi gli agenti Linux dovrebbero usare `mode: "transcribe"`, accesso telefonico Twilio o un host `chrome-node` macOS invece del percorso agente Chrome locale predefinito.

### Nessun nodo connesso compatibile con Google Meet

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

Il nodo deve essere connesso ed elencare `googlemeet.chrome` più `browser.proxy`.
La configurazione Gateway deve consentire quei comandi del nodo:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Se `googlemeet setup` fallisce `chrome-node-connected` o il log del Gateway segnala `gateway token mismatch`, reinstalla o riavvia il nodo con il token Gateway corrente. Per un Gateway LAN questo di solito significa:

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

### Il browser si apre ma l'agente non riesce a entrare

Esegui `googlemeet test-listen` per ingressi solo osservazione o `googlemeet test-speech` per ingressi in tempo reale, quindi ispeziona lo stato di Chrome restituito. Se una delle due sonde segnala `manualActionRequired: true`, mostra `manualActionMessage` all'operatore e smetti di ritentare finché l'azione nel browser non è completata.

Azioni manuali comuni:

- Accedere al profilo Chrome.
- Ammettere l'ospite dall'account host Meet.
- Concedere a Chrome i permessi per microfono/fotocamera quando appare il prompt di permesso nativo di Chrome.
- Chiudere o riparare una finestra di dialogo dei permessi Meet bloccata.

Non segnalare "non connesso" solo perché Meet mostra "Do you want people to hear you in the meeting?" Quello è l'interstiziale di scelta audio di Meet; OpenClaw fa clic su **Use microphone** tramite automazione del browser quando disponibile e continua ad attendere il vero stato della riunione. Per il fallback browser di sola creazione, OpenClaw può fare clic su **Continue without microphone** perché la creazione dell'URL non richiede il percorso audio in tempo reale.

### La creazione della riunione fallisce

`googlemeet create` usa prima l'endpoint Google Meet API `spaces.create` quando le credenziali OAuth sono configurate. Senza credenziali OAuth ricade sul browser del nodo Chrome fissato. Conferma:

- Per la creazione API: `oauth.clientId` e `oauth.refreshToken` sono configurati, oppure sono presenti variabili d'ambiente corrispondenti `OPENCLAW_GOOGLE_MEET_*`.
- Per la creazione API: il token di aggiornamento è stato generato dopo l'aggiunta del supporto alla creazione. I token più vecchi potrebbero non avere lo scope `meetings.space.created`; riesegui `openclaw googlemeet auth login --json` e aggiorna la configurazione del plugin.
- Per il fallback browser: `defaultTransport: "chrome-node"` e `chromeNode.node` puntano a un nodo connesso con `browser.proxy` e `googlemeet.chrome`.
- Per il fallback browser: il profilo Chrome OpenClaw su quel nodo è connesso a Google e può aprire `https://meet.google.com/new`.
- Per il fallback browser: i tentativi riutilizzano una scheda esistente `https://meet.google.com/new` o una scheda di prompt dell'account Google prima di aprire una nuova scheda. Se un agente va in timeout, ritenta la chiamata dello strumento invece di aprire manualmente un'altra scheda Meet.
- Per il fallback browser: se lo strumento restituisce `manualActionRequired: true`, usa `browser.nodeId`, `browser.targetId`, `browserUrl` e `manualActionMessage` restituiti per guidare l'operatore. Non ritentare in un ciclo finché quell'azione non è completa.
- Per il fallback browser: se Meet mostra "Do you want people to hear you in the meeting?", lascia la scheda aperta. OpenClaw dovrebbe fare clic su **Use microphone** oppure, per il fallback di sola creazione, su **Continue without microphone** tramite automazione del browser e continuare ad attendere l'URL Meet generato. Se non può farlo, l'errore dovrebbe menzionare `meet-audio-choice-required`, non `google-login-required`.

### L'agente entra ma non parla

Controlla il percorso in tempo reale:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Usa `mode: "agent"` per il normale percorso STT -> agente OpenClaw -> talk-back TTS, oppure `mode: "bidi"` per il fallback vocale diretto in tempo reale. `mode: "transcribe"` intenzionalmente non avvia il bridge talk-back. Per il debug solo osservazione, esegui `openclaw googlemeet status --json <session-id>` dopo che i partecipanti hanno parlato e controlla `captioning`, `transcriptLines` e `lastCaptionText`. Se `inCall` è true ma `transcriptLines` resta a `0`, i sottotitoli Meet potrebbero essere disabilitati, nessuno ha parlato da quando l'osservatore è stato installato, l'interfaccia Meet è cambiata oppure i sottotitoli live non sono disponibili per la lingua/account della riunione.

`googlemeet test-speech` controlla sempre il percorso in tempo reale e segnala se per quell'invocazione sono stati osservati byte di output dal bridge. Se `speechOutputVerified` è false e `speechOutputTimedOut` è true, il provider in tempo reale potrebbe aver accettato l'enunciato, ma OpenClaw non ha visto nuovi byte di output raggiungere il bridge audio Chrome.

Verifica anche:

- Sull'host Gateway è disponibile una chiave di provider in tempo reale, come `OPENAI_API_KEY` o `GEMINI_API_KEY`.
- `BlackHole 2ch` è visibile sull'host Chrome.
- `sox` esiste sull'host Chrome.
- Microfono e altoparlante Meet sono instradati attraverso il percorso audio virtuale usato da OpenClaw. `doctor` dovrebbe mostrare `meet output routed: yes` per ingressi Chrome locali in tempo reale.

`googlemeet doctor [session-id]` stampa sessione, nodo, stato in chiamata, motivo dell'azione manuale, connessione al provider in tempo reale, `realtimeReady`, attività audio di input/output, ultimi timestamp audio, contatori di byte e URL del browser. Usa `googlemeet status [session-id] --json` quando hai bisogno del JSON grezzo. Usa `googlemeet doctor --oauth` quando devi verificare il refresh OAuth di Google Meet senza esporre token; aggiungi `--meeting` o `--create-space` quando ti serve anche una prova dell'API Google Meet.

Se un agente è andato in timeout e puoi vedere una scheda Meet già aperta, ispeziona quella scheda senza aprirne un'altra:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

L'azione strumento equivalente è `recover_current_tab`. Porta in primo piano e ispeziona una scheda Meet esistente per il trasporto selezionato. Con `chrome`, usa il controllo browser locale tramite il Gateway; con `chrome-node`, usa il nodo Chrome configurato. Non apre una nuova scheda né crea una nuova sessione; segnala il blocco corrente, come login, ammissione, permessi o stato di scelta audio. Il comando CLI parla con il Gateway configurato, quindi il Gateway deve essere in esecuzione; `chrome-node` richiede anche che il nodo Chrome sia connesso.

### I controlli di configurazione Twilio falliscono

`twilio-voice-call-plugin` fallisce quando `voice-call` non è consentito o non è abilitato.
Aggiungilo a `plugins.allow`, abilita `plugins.entries.voice-call` e ricarica il Gateway.

`twilio-voice-call-credentials` fallisce quando al backend Twilio mancano account SID, token di autenticazione o numero chiamante. Impostali sull'host Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` fallisce quando `voice-call` non ha esposizione Webhook pubblica oppure quando `publicUrl` punta a local loopback o a spazio di rete privata.
Imposta `plugins.entries.voice-call.config.publicUrl` sull'URL pubblico del provider oppure configura un'esposizione tunnel/Tailscale per `voice-call`.

Gli URL di loopback e privati non sono validi per i callback degli operatori. Non usare `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` o `fd00::/8` come `publicUrl`.

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

Poi riavvia o ricarica il Gateway ed esegui:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` verifica solo la preparazione per impostazione predefinita. Per eseguire una prova a secco su un numero specifico:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Aggiungi `--yes` solo quando vuoi intenzionalmente effettuare una chiamata di notifica
in uscita dal vivo:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### La chiamata Twilio parte ma non entra mai nella riunione

Conferma che l'evento Meet esponga i dettagli di accesso telefonico. Passa il numero
esatto di accesso telefonico e il PIN oppure una sequenza DTMF personalizzata:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Usa `w` iniziali o virgole in `--dtmf-sequence` se il provider richiede una pausa
prima di inserire il PIN.

Se la chiamata telefonica viene creata ma l'elenco dei partecipanti di Meet non mostra mai il
partecipante collegato telefonicamente:

- Esegui `openclaw googlemeet doctor <session-id>` per confermare l'ID della chiamata Twilio delegata, se DTMF è stato messo in coda e se è stato richiesto il saluto introduttivo.
- Esegui `openclaw voicecall status --call-id <id>` e conferma che la chiamata sia ancora attiva.
- Esegui `openclaw voicecall tail` e verifica che i Webhook Twilio stiano arrivando al Gateway.
- Esegui `openclaw logs --follow` e cerca la sequenza Twilio Meet: Google Meet delega l'accesso, Voice Call avvia la tratta telefonica, Google Meet attende `voiceCall.dtmfDelayMs`, invia DTMF con `voicecall.dtmf`, attende `voiceCall.postDtmfSpeechDelayMs`, poi richiede il parlato introduttivo con `voicecall.speak`.
- Esegui di nuovo `openclaw googlemeet setup --transport twilio`; un controllo di configurazione verde è necessario ma non dimostra che la sequenza del PIN della riunione sia corretta.
- Conferma che il numero di accesso telefonico appartenga allo stesso invito Meet e alla stessa regione del PIN.
- Aumenta `voiceCall.dtmfDelayMs` se Meet risponde lentamente o se la trascrizione della chiamata mostra ancora il prompt che richiede un PIN dopo l'invio del DTMF.
- Se il partecipante entra ma non senti il saluto, controlla `openclaw logs --follow` per la richiesta `voicecall.speak` post-DTMF e per la riproduzione TTS tramite media stream oppure il fallback Twilio `<Say>`. Se la trascrizione della chiamata contiene ancora "enter the meeting PIN", la tratta telefonica non è ancora entrata nella stanza Meet, quindi i partecipanti alla riunione non sentiranno il parlato.

Se i Webhook non arrivano, esegui prima il debug del Plugin Voice Call: il provider deve
raggiungere `plugins.entries.voice-call.config.publicUrl` o il tunnel configurato.
Vedi [Risoluzione dei problemi delle chiamate vocali](/it/plugins/voice-call#troubleshooting).

## Note

L'API multimediale ufficiale di Google Meet è orientata alla ricezione, quindi parlare in una chiamata Meet
richiede comunque un percorso partecipante. Questo Plugin mantiene visibile quel confine:
Chrome gestisce la partecipazione dal browser e l'instradamento audio locale; Twilio gestisce
la partecipazione telefonica in ingresso.

Le modalità talk-back di Chrome richiedono `BlackHole 2ch` più una delle seguenti opzioni:

- `chrome.audioInputCommand` più `chrome.audioOutputCommand`: OpenClaw possiede il bridge e convoglia l'audio in `chrome.audioFormat` tra quei comandi e il provider selezionato. La modalità agente usa trascrizione in tempo reale più TTS normale; la modalità bidi usa il provider vocale in tempo reale. Il percorso Chrome predefinito è PCM16 a 24 kHz con `chrome.audioBufferBytes: 4096`; G.711 mu-law a 8 kHz resta disponibile per coppie di comandi legacy.
- `chrome.audioBridgeCommand`: un comando bridge esterno possiede l'intero percorso audio locale e deve terminare dopo aver avviato o convalidato il proprio demone. Questo è valido solo per `bidi` perché la modalità `agent` richiede accesso diretto alla coppia di comandi per TTS.

Quando un agente chiama lo strumento `google_meet` in modalità agente, la sessione del consulente della riunione
biforca la trascrizione corrente del chiamante prima di rispondere al parlato dei partecipanti.
La sessione Meet resta comunque separata (`agent:<agentId>:subagent:google-meet:<sessionId>`)
quindi i follow-up della riunione non modificano direttamente la trascrizione del chiamante.

Per un audio duplex pulito, instrada l'output di Meet e il microfono di Meet attraverso dispositivi
virtuali separati o un grafo di dispositivi virtuali in stile Loopback. Un singolo dispositivo
BlackHole condiviso può rimandare l'eco degli altri partecipanti nella chiamata.

Con il bridge Chrome a coppia di comandi, `chrome.bargeInInputCommand` può ascoltare un
microfono locale separato e interrompere la riproduzione dell'assistente quando l'umano inizia
a parlare. Questo mantiene il parlato umano davanti all'output dell'assistente anche quando l'input
loopback BlackHole condiviso viene temporaneamente soppresso durante la riproduzione dell'assistente.
Come `chrome.audioInputCommand` e `chrome.audioOutputCommand`, è un comando locale
configurato dall'operatore. Usa un percorso di comando attendibile esplicito o un elenco
di argomenti, e non puntarlo a script provenienti da posizioni non attendibili.

`googlemeet speak` attiva il bridge audio talk-back attivo per una sessione Chrome.
`googlemeet leave` interrompe quel bridge. Per le sessioni Twilio delegate
tramite il Plugin Voice Call, `leave` chiude anche la chiamata vocale sottostante.
Usa `googlemeet end-active-conference` quando vuoi anche chiudere la conferenza
Google Meet attiva per uno spazio gestito dall'API.

## Correlati

- [Plugin Voice Call](/it/plugins/voice-call)
- [Modalità talk](/it/nodes/talk)
- [Creazione di Plugin](/it/plugins/building-plugins)
