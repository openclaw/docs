---
read_when:
    - Si desidera che un agente OpenClaw partecipi a una chiamata Google Meet
    - Vuoi che un agente OpenClaw crei una nuova chiamata Google Meet
    - Si sta configurando Chrome, il nodo Chrome o Twilio come trasporto per Google Meet
summary: 'Plugin Google Meet: partecipa a URL Meet espliciti tramite Chrome o Twilio con impostazioni predefinite per la risposta vocale dell’agente'
title: Plugin di Google Meet
x-i18n:
    generated_at: "2026-07-16T14:37:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5a3a0d2675bdfaeaa869652593fd1931c3afdefe0ed95f13935dade976ff038c
    source_path: plugins/google-meet.md
    workflow: 16
---

Il plugin `google-meet` accede a URL Meet espliciti per conto di un agente OpenClaw. È volutamente limitato:

- Accede solo a URL `https://meet.google.com/...`; non effettua mai l'accesso telefonico a una riunione usando un numero di telefono individuato autonomamente.
- `googlemeet create` può generare un nuovo URL Meet tramite l'API Google Meet (o un fallback del browser) e accedervi per impostazione predefinita.
- La partecipazione tramite Chrome usa un profilo Chrome autenticato, facoltativamente su un Node associato. La partecipazione tramite Twilio chiama un numero di telefono con PIN/DTMF attraverso il [Plugin per le chiamate vocali](/it/plugins/voice-call); non può chiamare direttamente un URL Meet.
- `mode: "agent"` (impostazione predefinita) trascrive il parlato dei partecipanti con un provider in tempo reale, lo inoltra all'agente OpenClaw configurato e pronuncia la risposta con il normale TTS di OpenClaw. `mode: "bidi"` consente a un modello vocale in tempo reale di rispondere direttamente. `mode: "transcribe"` accede in modalità di sola osservazione, senza possibilità di risposta vocale.
- Quando il plugin accede a una chiamata, non viene riprodotto alcun annuncio automatico per il consenso.
- Il comando CLI è `googlemeet`; `meet` è riservato ai flussi di lavoro più ampi dell'agente per le teleconferenze.

## Avvio rapido

Installare le dipendenze audio locali, quindi impostare la chiave di un provider in tempo reale. OpenAI è il provider di trascrizione predefinito per la modalità `agent`; Google Gemini Live è disponibile come provider vocale della modalità `bidi`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# necessario solo quando realtime.voiceProvider è "google" per la modalità bidi
export GEMINI_API_KEY=...
```

`blackhole-2ch` installa il dispositivo audio virtuale `BlackHole 2ch` attraverso il quale Chrome instrada l'audio. Il programma di installazione di Homebrew richiede un riavvio prima che macOS renda disponibile il dispositivo:

```bash
sudo reboot
```

Dopo il riavvio, verificare entrambi i componenti:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Abilitare il plugin:

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

Controllare la configurazione, quindi accedere:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

L'output di `setup` è leggibile dall'agente e tiene conto della modalità e del trasporto: indica il profilo Chrome, il vincolo al Node e, per gli accessi Chrome in tempo reale, il bridge audio BlackHole/SoX e il controllo dell'introduzione ritardata. Gli accessi in sola osservazione ignorano i prerequisiti per il tempo reale:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Quando è configurata la delega a Twilio, `setup` indica anche se `voice-call`, le credenziali Twilio e l'esposizione pubblica del Webhook sono pronti. Considerare qualsiasi controllo `ok: false` come un impedimento per quella combinazione di trasporto e modalità prima che un agente acceda. Usare `--json` per un output leggibile dalla macchina e `--transport chrome|chrome-node|twilio` per verificare in anticipo uno specifico trasporto:

```bash
openclaw googlemeet setup --transport twilio
```

In alternativa, consentire a un agente di accedere tramite lo strumento `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Sugli host Gateway non macOS, `google_meet` rimane disponibile per le azioni relative ad artefatti, calendario, configurazione, trascrizione, Twilio e `chrome-node`, ma la risposta vocale di Chrome locale (`transport: "chrome"` con `mode: "agent"` o `"bidi"`) viene bloccata prima di raggiungere il bridge audio, perché questo percorso dipende attualmente da `BlackHole 2ch` di macOS. Usare invece `mode: "transcribe"`, l'accesso telefonico tramite Twilio o un host `chrome-node` macOS.

### Creare una riunione

```bash
openclaw googlemeet create --transport chrome-node --mode agent
openclaw googlemeet create --no-join
```

`create` dispone di due percorsi, indicati nel campo `source` del risultato:

- **`api`**: usato quando sono configurate le credenziali OAuth di Google Meet. È deterministico e non dipende dallo stato dell'interfaccia del browser.
- **`browser`**: usato senza credenziali OAuth. OpenClaw apre `https://meet.google.com/new` sul Node Chrome vincolato e attende che Google reindirizzi a un URL reale con codice riunione; il profilo Chrome di OpenClaw su quel Node deve essere già autenticato a Google. Sia l'accesso sia la creazione riutilizzano una scheda Meet esistente (o una scheda con `.../new` / richiesta dell'account Google in corso) prima di aprirne una nuova; la corrispondenza delle schede ignora stringhe di query innocue come `authuser`.

`create` accede per impostazione predefinita e restituisce `joined: true` insieme alla sessione di accesso. Specificare `--no-join` (CLI) o `"join": false` (strumento) per generare soltanto l'URL.

Per le stanze create tramite API, impostare un criterio di accesso esplicito anziché ereditare l'impostazione predefinita dell'account Google:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

| `--access-type` | Chi può accedere senza chiedere l'ammissione                         |
| --------------- | ------------------------------------------------------------------- |
| `OPEN`          | Chiunque disponga dell'URL Meet                                     |
| `TRUSTED`       | Utenti attendibili dell'organizzazione dell'host, utenti esterni invitati e utenti con accesso telefonico |
| `RESTRICTED`    | Solo gli invitati                                                   |

Questo vale soltanto per le stanze create tramite API, quindi OAuth deve essere configurato. Se l'autenticazione è stata eseguita prima dell'introduzione di questa opzione, eseguire nuovamente `openclaw googlemeet auth login --json` dopo aver aggiunto l'ambito `meetings.space.settings` alla schermata per il consenso OAuth.

Se il fallback del browser incontra un blocco dovuto all'accesso a Google o alle autorizzazioni Meet, lo strumento restituisce `manualActionRequired: true` con `manualActionReason`, `manualActionMessage` e `browser.nodeId`/`browser.targetId`/`browserUrl`. Segnalare tale messaggio e non aprire nuove schede Meet finché l'operatore non completa il passaggio nel browser.

### Accesso in sola osservazione

Impostare `"mode": "transcribe"` per ignorare il bridge duplex in tempo reale (nessun requisito BlackHole/SoX e nessuna risposta vocale). Gli accessi Chrome in modalità di trascrizione ignorano anche la concessione delle autorizzazioni per microfono/fotocamera da parte di OpenClaw e il percorso **Use microphone** di Meet; se Meet mostra la schermata intermedia per la scelta dell'audio, l'automazione prova prima **Continue without microphone**. In questa modalità, i trasporti Chrome gestiti installano un osservatore dei sottotitoli di Meet con esito non garantito. `googlemeet status --json` e `googlemeet doctor` indicano `captioning`, `captionsEnabledAttempted`, `transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText` e una coda `recentTranscript`.

Per la trascrizione limitata della sessione, leggere l'esatta scheda Meet monitorata:

```bash
openclaw googlemeet transcript <session-id>
openclaw googlemeet transcript <session-id> --since <next-index> --json
```

L'osservatore conserva al massimo 2.000 righe di sottotitoli completate nella pagina Meet. Il testo progressivo visibile rimane nella coda relativa allo stato di integrità finché la riga dei sottotitoli non viene completata, quindi il salvataggio di `nextIndex` non può omettere una successiva espansione del testo; l'uscita finalizza le righe visibili prima dell'istantanea. `droppedLines` indica le righe perse all'inizio quando viene superato il limite. Le trascrizioni delle quattro sessioni terminate più di recente rimangono leggibili fino al riavvio del Gateway. Le trascrizioni terminate meno recenti restituiscono `evicted: true`. Si tratta intenzionalmente di memoria di runtime, non di archiviazione permanente della cronologia delle riunioni: il riavvio del Gateway, la chiusura della scheda prima di un'istantanea o il superamento dei limiti documentati possono causare la perdita dei sottotitoli.

Per una verifica di ascolto con risposta sì/no:

```bash
openclaw googlemeet test-listen <meet-url> --transport chrome-node
```

Accede in modalità di trascrizione, attende un nuovo avanzamento dei sottotitoli o della trascrizione e restituisce `listenVerified`, `listenTimedOut`, i campi relativi all'azione manuale e lo stato attuale dei sottotitoli.

### Stato della sessione in tempo reale

Durante le sessioni con risposta vocale, lo stato `google_meet` indica lo stato di Chrome e del bridge audio: `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, i timestamp dell'ultimo input/output, i contatori di byte e lo stato di chiusura del bridge. Le sessioni Chrome gestite pronunciano la frase introduttiva/di prova solo dopo che lo stato indica `inCall: true`; in caso contrario, `speechReady: false` e il tentativo di riproduzione vocale viene bloccato anziché non produrre silenziosamente alcun effetto.

Gli accessi Chrome locali usano il profilo browser OpenClaw autenticato e richiedono `BlackHole 2ch` per il percorso microfono/altoparlante. Un singolo dispositivo BlackHole è sufficiente per una prima prova di base, ma può generare eco; per un audio duplex pulito, usare dispositivi virtuali separati o un grafo in stile Loopback.

## Gateway locale + Chrome in Parallels

All'interno di una VM macOS non sono necessari un Gateway completo o una chiave API del modello soltanto per dotarla di Chrome. Eseguire localmente il Gateway e l'agente; eseguire un host Node nella VM.

| Posizione di esecuzione | Componenti                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| Host Gateway         | Gateway OpenClaw, area di lavoro dell'agente, chiavi modello/API, provider in tempo reale, configurazione del plugin Google Meet |
| VM macOS Parallels   | CLI/host Node OpenClaw, Chrome, SoX, BlackHole 2ch, un profilo Chrome autenticato a Google      |
| Non necessario nella VM | Servizio Gateway, configurazione dell'agente, configurazione del provider del modello           |

Installare le dipendenze nella VM, riavviare e verificare:

```bash
brew install blackhole-2ch sox
sudo reboot
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Abilitare il plugin nella VM e avviare l'host Node:

```bash
openclaw plugins enable google-meet
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Se `<gateway-host>` è un indirizzo IP LAN senza TLS, acconsentire esplicitamente per tale rete privata attendibile:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Usare la stessa variabile quando si esegue l'installazione come LaunchAgent (è una variabile di ambiente del processo, archiviata nell'ambiente LaunchAgent quando è presente nel comando di installazione, non un'impostazione `openclaw.json`):

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

Approvare il Node dall'host Gateway, quindi verificare che esponga sia `googlemeet.chrome` sia la funzionalità del browser/`browser.proxy`:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Instradare Meet attraverso tale Node:

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

Ora accedere normalmente dall'host Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Per una prova di base con un solo comando che crea o riutilizza una sessione, pronuncia una frase nota e stampa lo stato della sessione:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Durante l'accesso in tempo reale, l'automazione del browser compila il nome dell'ospite, fa clic su Join/Ask to join e accetta la richiesta "Use microphone" mostrata da Meet al primo utilizzo, quando compare (oppure "Continue without microphone" durante l'accesso in sola osservazione e la creazione della riunione solo tramite browser). Se il profilo non è autenticato, Meet è in attesa dell'ammissione da parte dell'host, Chrome richiede l'autorizzazione per microfono/fotocamera oppure Meet è bloccato su una richiesta non risolta, il risultato indica `manualActionRequired: true` con `manualActionReason` e `manualActionMessage`. Interrompere i tentativi, segnalare tale messaggio insieme a `browserUrl`/`browserTitle` e riprovare soltanto dopo il completamento dell'azione manuale.

Se `chromeNode.node` viene omesso, OpenClaw effettua la selezione automatica solo quando esattamente un Node connesso dichiara sia `googlemeet.chrome` sia il controllo del browser; specificare `chromeNode.node` (ID del Node, nome visualizzato o IP remoto) quando sono connessi più Node idonei.

### Controlli per gli errori comuni

| Sintomo                                                  | Soluzione                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Configured Google Meet node ... is not usable: offline` | Il Node specificato è noto ma non disponibile. Segnalare l'impedimento alla configurazione; non effettuare silenziosamente il fallback a un altro trasporto, salvo richiesta esplicita.                                                                                                                                    |
| `No connected Google Meet-capable node`                  | Eseguire `openclaw node run` nella VM, approvare l'associazione, quindi eseguire `openclaw plugins enable google-meet` e `openclaw plugins enable browser` al suo interno. Verificare che `gateway.nodes.allowCommands` includa `googlemeet.chrome` e `browser.proxy`.                              |
| `BlackHole 2ch audio device not found`                   | Installare `blackhole-2ch` sull'host sottoposto a verifica e riavviarlo.                                                                                                                                                                                                       |
| `BlackHole 2ch audio device not found on the node`       | Installare `blackhole-2ch` nella VM e riavviare la VM.                                                                                                                                                                                                                |
| Chrome si apre ma non riesce a partecipare                             | Accedere al profilo del browser nella VM oppure mantenere impostato `chrome.guestName`. La partecipazione automatica del guest usa l'automazione del browser di OpenClaw tramite il proxy del browser del Node; indirizzare il valore `browser.defaultProfile` del Node (o un profilo denominato di una sessione esistente) al profilo desiderato. |
| Schede di Meet duplicate                                      | Lasciare `chrome.reuseExistingTab: true`. OpenClaw attiva una scheda esistente per lo stesso URL e, prima di aprirne un'altra, riutilizza una scheda `.../new` in corso o una scheda con la richiesta dell'account Google.                                                                      |
| Audio assente                                                 | Instradare il microfono e gli altoparlanti di Meet attraverso il percorso audio virtuale usato da OpenClaw; utilizzare dispositivi virtuali separati o un instradamento in stile Loopback per un audio duplex pulito.                                                                                                              |

## Note sull'installazione

L'impostazione predefinita per la risposta vocale di Chrome usa due strumenti esterni che OpenClaw non include né ridistribuisce; installarli come dipendenze dell'host tramite Homebrew:

- `sox`: utilità audio da riga di comando. Il Plugin esegue comandi espliciti per i dispositivi CoreAudio relativi al bridge audio PCM16 predefinito a 24 kHz.
- `blackhole-2ch`: driver audio virtuale per macOS che fornisce il dispositivo `BlackHole 2ch` attraverso cui viene instradato Chrome/Meet.

SoX è concesso in licenza `LGPL-2.0-only AND GPL-2.0-only`; BlackHole è GPL-3.0. Se si crea un programma di installazione o un'appliance che include BlackHole insieme a OpenClaw, verificare le condizioni di licenza upstream di BlackHole oppure ottenere una licenza separata da Existential Audio.

## Trasporti

| Trasporto     | Utilizzare quando                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `chrome`      | Chrome e l'audio sono in esecuzione sull'host del Gateway                                                        |
| `chrome-node` | Chrome e l'audio sono in esecuzione su un Node associato (ad esempio una VM macOS Parallels)                        |
| `twilio`      | Fallback tramite chiamata telefonica con il Plugin Voice Call, quando la partecipazione tramite Chrome non è disponibile |

### Chrome

Apre l'URL di Meet tramite il controllo del browser di OpenClaw e partecipa usando il profilo del browser OpenClaw connesso. Su macOS, il Plugin verifica la presenza di `BlackHole 2ch` prima dell'avvio e, se configurato, esegue un comando di controllo dello stato o di avvio del bridge audio prima di aprire Chrome. Per Chrome locale, scegliere il profilo con `browser.defaultProfile`; `chrome.browserProfile` viene invece passato agli host `chrome-node`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

L'audio del microfono e degli altoparlanti di Chrome viene instradato attraverso il bridge audio locale di OpenClaw. Se `BlackHole 2ch` non è installato, la partecipazione non riesce e restituisce un errore di configurazione, invece di avvenire senza un percorso audio.

### Twilio

Un piano di composizione rigoroso delegato al [Plugin Voice Call](/it/plugins/voice-call). Non analizza le pagine di Meet alla ricerca di numeri di telefono; Google Meet deve rendere disponibili un numero telefonico e un PIN per accedere alla riunione.

Abilitare Voice Call sull'host del Gateway, non sul Node Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // oppure impostare "twilio" se Twilio deve essere il valore predefinito
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
            instructions: "Partecipa a questo Google Meet come agente OpenClaw. Sii conciso.",
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

Fornire le credenziali Twilio tramite l'ambiente per evitare di inserire dati segreti in `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

Utilizzare invece `realtime.provider: "openai"` con `OPENAI_API_KEY` se OpenAI è il provider vocale in tempo reale.

Riavviare o ricaricare il Gateway dopo aver abilitato `voice-call`; le modifiche alla configurazione del Plugin non hanno effetto fino al ricaricamento. Verificare:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Quando la delega a Twilio è configurata, `googlemeet setup` include i controlli `twilio-voice-call-plugin`, `twilio-voice-call-credentials` e `twilio-voice-call-webhook`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Utilizzare `--dtmf-sequence` per una sequenza personalizzata, anteponendo `w` o delle virgole per inserire una pausa prima del PIN:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth e verifica preliminare

OAuth è facoltativo per creare un link di Meet, perché `googlemeet create` può effettuare il fallback all'automazione del browser. Configurare OAuth per la creazione tramite l'API ufficiale, la risoluzione degli spazi o la verifica preliminare dell'API Meet Media. Le partecipazioni tramite Chrome/Chrome-node non dipendono mai da OAuth; usano comunque un profilo Chrome connesso, BlackHole/SoX e, per `chrome-node`, un Node connesso.

### Creare le credenziali Google

In Google Cloud Console:

<Steps>
<Step title="Creare o selezionare un progetto">
</Step>
<Step title="Abilitare l'API REST di Google Meet">
</Step>
<Step title="Configurare la schermata per il consenso OAuth">
Internal è l'opzione più semplice per un'organizzazione Google Workspace. External è adatta alle configurazioni personali o di prova; mentre l'app è in Testing, aggiungere come utente di prova ogni account Google che dovrà autorizzarla.
</Step>
<Step title="Aggiungere gli ambiti richiesti">
- `https://www.googleapis.com/auth/meetings.space.created`
- `https://www.googleapis.com/auth/meetings.space.readonly`
- `https://www.googleapis.com/auth/meetings.space.settings`
- `https://www.googleapis.com/auth/meetings.conference.media.readonly`
- `https://www.googleapis.com/auth/calendar.events.readonly` (ricerca nel calendario)
- `https://www.googleapis.com/auth/drive.meet.readonly` (esportazione del corpo del documento della trascrizione o della nota intelligente)

</Step>
<Step title="Creare un ID client OAuth">
Tipo di applicazione **Web application**. URI di reindirizzamento autorizzato:

```text
http://localhost:8085/oauth2callback
```

</Step>
<Step title="Copiare l'ID client e il client secret">
</Step>
</Steps>

`meetings.space.created` è richiesto da `spaces.create`. `meetings.space.readonly` risolve gli URL o i codici di Meet in spazi. `meetings.space.settings` consente a OpenClaw di passare impostazioni `SpaceConfig`, come `accessType`, durante la creazione di una stanza tramite API. `meetings.conference.media.readonly` serve per la verifica preliminare dell'API Meet Media e le operazioni multimediali; Google potrebbe richiedere l'iscrizione al programma Developer Preview per l'uso effettivo dell'API Media. `calendar.events.readonly` è necessario solo per la ricerca nel calendario tramite `--today`/`--event`. `drive.meet.readonly` è necessario solo per l'esportazione tramite `--include-doc-bodies`. Se servono soltanto partecipazioni basate sul browser tramite Chrome, ignorare completamente OAuth.

### Generare il token di aggiornamento

Configurare `oauth.clientId` e, facoltativamente, `oauth.clientSecret` (oppure passarli come variabili di ambiente), quindi eseguire:

```bash
openclaw googlemeet auth login --json
```

Questo comando esegue un flusso PKCE con un callback localhost su `http://localhost:8085/oauth2callback` e stampa un blocco di configurazione `oauth` contenente un token di aggiornamento. Aggiungere `--manual` per usare un flusso basato su copia e incolla quando il browser non riesce a raggiungere il callback locale:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

Output JSON:

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

Memorizzare l'oggetto `oauth` nella configurazione del Plugin:

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

Preferire le variabili di ambiente quando non si desidera inserire il token di aggiornamento nella configurazione; viene risolta prima la configurazione e poi, come fallback, l'ambiente. Se l'autenticazione è stata eseguita prima che fosse disponibile il supporto per la creazione delle riunioni, la ricerca nel calendario o l'esportazione del corpo dei documenti, eseguire nuovamente `openclaw googlemeet auth login --json` affinché il token di aggiornamento includa l'insieme di ambiti corrente.

### Verificare OAuth con doctor

```bash
openclaw googlemeet doctor --oauth --json
```

Questo comando verifica che la configurazione OAuth esista e che il token di aggiornamento possa generare un token di accesso, senza caricare il runtime di Chrome né richiedere un Node connesso. Il rapporto include solo campi di stato (`ok`, `configured`, `tokenSource`, `expiresAt`, messaggi di controllo) e non stampa mai il token di accesso, il token di aggiornamento o il client secret.

| Controllo                | Significato                                                                          |
| -------------------- | -------------------------------------------------------------------------------- |
| `oauth-config`       | Sono presenti `oauth.clientId` insieme a `oauth.refreshToken`, oppure un token di accesso memorizzato nella cache |
| `oauth-token`        | Il token di accesso memorizzato nella cache è ancora valido oppure il token di aggiornamento ne ha generato uno nuovo    |
| `meet-spaces-get`    | Il controllo facoltativo `--meeting` ha risolto uno spazio Meet esistente                       |
| `meet-spaces-create` | Il controllo facoltativo `--create-space` ha creato un nuovo spazio Meet                         |

Dimostrare l'abilitazione dell'API Meet e l'ambito `spaces.create` con il controllo di creazione che produce effetti collaterali:

```bash
openclaw googlemeet doctor --oauth --create-space --json
```

Dimostrare l'accesso in lettura a uno spazio esistente:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Un `403` restituito da questi controlli indica in genere che l'API REST di Meet è disabilitata, che al token di aggiornamento manca l'ambito richiesto oppure che l'account Google non può accedere a tale spazio. Un errore del token di aggiornamento indica che occorre eseguire nuovamente `openclaw googlemeet auth login --json` e memorizzare il nuovo blocco `oauth`.

Per il fallback del browser non è necessario OAuth; in questo caso, l'autenticazione Google proviene dal profilo Chrome connesso sul Node selezionato, non dalla configurazione di OpenClaw.

Queste variabili di ambiente sono accettate come fallback:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` o `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` o `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` o `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` o `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` o `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` o `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` o `GOOGLE_MEET_PREVIEW_ACK`

### Risolvere, eseguire il controllo preliminare e leggere gli artefatti

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Dopo che Meet ha creato i record della conferenza:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Con `--meeting`, `artifacts` e `attendance` viene usato per impostazione predefinita il record della conferenza più recente; passare `--all-conference-records` per ogni record conservato.

La ricerca nel calendario risolve l'URL della riunione da Google Calendar prima di leggere gli artefatti (richiede un token di aggiornamento che includa l'ambito di sola lettura degli eventi di Calendar):

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` cerca nel calendario `primary` di oggi un evento con un link Meet; `--event <query>` cerca il testo corrispondente dell'evento; `--calendar <id>` seleziona un calendario non principale. `calendar-events` mostra un'anteprima degli eventi corrispondenti e indica quale verrà scelto da `latest`/`artifacts`/`attendance`/`export`.

Se l'ID del record della conferenza è già noto, specificarlo direttamente:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Chiudere la stanza per uno spazio creato tramite API:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Chiama `spaces.endActiveConference` e richiede OAuth con l'ambito `meetings.space.created` per uno spazio che l'account autorizzato può gestire. Accetta un URL Meet, un codice riunione o `spaces/{id}` e lo risolve prima nella risorsa dello spazio API. Questa operazione è distinta da `googlemeet leave`: `leave` interrompe la partecipazione locale/alla sessione di OpenClaw; `end-active-conference` richiede a Google Meet di terminare la conferenza attiva per lo spazio.

Scrivere un report leggibile:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` restituisce i metadati del record della conferenza insieme ai metadati delle risorse relative a partecipanti, registrazione, trascrizione, voci strutturate della trascrizione e note intelligenti, quando Google li rende disponibili. `--no-transcript-entries` ignora la ricerca delle voci per le riunioni di grandi dimensioni. `attendance` espande i partecipanti in righe di sessione dei partecipanti con orari della prima e dell'ultima presenza, durata totale della sessione, indicatori di ritardo e uscita anticipata e risorse duplicate dei partecipanti unite in base all'utente connesso o al nome visualizzato; `--no-merge-duplicates` mantiene separate le risorse non elaborate, mentre `--late-after-minutes`/`--early-before-minutes` regolano le soglie.

`export` scrive una cartella contenente `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` e `manifest.json`. `manifest.json` registra l'input scelto, le opzioni di esportazione, i record delle conferenze, i file di output, i conteggi, l'origine del token, l'eventuale evento di Calendar utilizzato e gli avvisi relativi al recupero parziale. `--zip` scrive inoltre un archivio portabile accanto alla cartella. `--include-doc-bodies` esporta il testo dei documenti Google collegati relativi a trascrizioni e note intelligenti tramite Drive `files.export` (richiede l'ambito di sola lettura Meet di Drive); senza di esso, le esportazioni includono solo i metadati di Meet e le voci strutturate della trascrizione. Un errore parziale degli artefatti (errore nell'elenco delle note intelligenti, nelle voci della trascrizione o nel corpo del documento) mantiene l'avviso nel riepilogo/manifesto anziché causare il fallimento dell'intera esportazione. `--dry-run` recupera gli stessi dati e stampa il JSON del manifesto senza creare la cartella o il file ZIP.

Gli agenti usano le stesse azioni tramite lo strumento `google_meet` (`export`, `create` con `accessType`, `end_active_conference`, `test_listen`); vedere [Strumento](#tool).

### Test smoke in ambiente live

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

| Variabile                                                                                                                 | Scopo                                                                  |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `OPENCLAW_LIVE_TEST=1`                                                                                                    | Abilita i test live protetti                                           |
| `OPENCLAW_GOOGLE_MEET_LIVE_MEETING`                                                                                       | URL Meet, codice o `spaces/{id}` conservato                            |
| `OPENCLAW_GOOGLE_MEET_CLIENT_ID` / `GOOGLE_MEET_CLIENT_ID`                                                                | ID client OAuth                                                        |
| `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` / `GOOGLE_MEET_REFRESH_TOKEN`                                                        | Token di aggiornamento                                                 |
| `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` | Facoltative; funzionano anche gli stessi nomi di fallback senza il prefisso `OPENCLAW_` |

Il test smoke di base per artefatti/presenze richiede `meetings.space.readonly` e `meetings.conference.media.readonly`. La ricerca nel calendario richiede `calendar.events.readonly`. L'esportazione del corpo dei documenti Drive richiede `drive.meet.readonly`.

### Esempi di creazione

```bash
openclaw googlemeet create
```

Stampa l'URI della nuova riunione, l'origine e la sessione di partecipazione. Con OAuth usa l'API Meet; senza OAuth usa il profilo connesso del Node Chrome fissato. JSON del fallback del browser:

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

Se il fallback del browser incontra prima la pagina di accesso a Google o un blocco delle autorizzazioni di Meet, `google_meet` restituisce dettagli strutturati anziché una semplice stringa:

```json
{
  "source": "browser",
  "error": "google-login-required: Accedi a Google nel profilo del browser OpenClaw, quindi riprova a creare la riunione.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Accedi a Google nel profilo del browser OpenClaw, quindi riprova a creare la riunione.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Accedi - Account Google"
  }
}
```

JSON della creazione tramite API:

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

Per impostazione predefinita, la creazione comporta la partecipazione, ma Chrome/Chrome-node richiede comunque un profilo Google connesso per partecipare tramite il browser; se la sessione non è attiva, OpenClaw segnala `manualActionRequired: true` o un errore del fallback del browser e richiede all'operatore di completare l'accesso a Google prima di riprovare.

Impostare `preview.enrollmentAcknowledged: true` solo dopo aver verificato che il progetto Cloud, l'entità OAuth e i partecipanti alla riunione siano iscritti al Google Workspace Developer Preview Program per le API multimediali di Meet.

## Configurazione

Il percorso comune dell'agente Chrome richiede solo che il plugin sia abilitato, BlackHole, SoX, una chiave di un provider in tempo reale e un provider TTS di OpenClaw configurato:

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

### Impostazioni predefinite

| Chiave                            | Valore predefinito                       | Note                                                                                                                                                                                                              |
| --------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultTransport`                | `"chrome"`                       |                                                                                                                                                                                                                   |
| `defaultMode`                | `"agent"`                       | `"realtime"` è accettato come alias legacy di `"agent"`; i nuovi chiamanti dovrebbero usare `"agent"`                                                                                     |
| `chromeNode.node`                | non impostato                            | ID/nome/IP del Node per `chrome-node`; obbligatorio quando può essere connesso più di un Node idoneo                                                                                                         |
| `chrome.launch`                | `true`                       | Avvia Chrome per partecipare; impostare `false` solo quando si riutilizza una sessione già aperta                                                                                                      |
| `chrome.audioBackend`                | `"blackhole-2ch"`                       |                                                                                                                                                                                                                   |
| `chrome.guestName`                | `"OpenClaw Agent"`                       | Visualizzato nella schermata ospite di Meet senza accesso                                                                                                                                                         |
| `chrome.autoJoin`                | `true`                       | Compilazione best effort del nome ospite e clic su Join Now in `chrome-node`                                                                                                                                 |
| `chrome.reuseExistingTab`                | `true`                       | Attiva una scheda Meet esistente anziché aprirne di duplicate                                                                                                                                                     |
| `chrome.waitForInCallMs`                | `20000`                       | Attende che la scheda Meet segnali la chiamata in corso prima di avviare l'introduzione vocale di risposta                                                                                                        |
| `chrome.audioFormat`                | `"pcm16-24khz"`                       | Formato audio della coppia di comandi; `"g711-ulaw-8khz"` è riservato alle coppie di comandi legacy/personalizzate che emettono audio telefonico                                                                  |
| `chrome.audioBufferBytes`                | `4096`                       | Buffer di elaborazione SoX per i comandi audio generati della coppia di comandi (metà del buffer predefinito di SoX, pari a 8192 byte, per ridurre la latenza della pipe); i valori sono limitati a un minimo di 17 byte |
| `chrome.audioInputCommand`                | comando SoX generato                     | Legge da CoreAudio `BlackHole 2ch`, scrive l'audio in `chrome.audioFormat`                                                                                                                                       |
| `chrome.audioOutputCommand`                | comando SoX generato                     | Legge l'audio in `chrome.audioFormat`, scrive in CoreAudio `BlackHole 2ch`                                                                                                                                       |
| `chrome.bargeInInputCommand`                | non impostato                            | Comando opzionale del microfono locale che scrive PCM mono little-endian con segno a 16 bit per rilevare l'interruzione umana durante la riproduzione dell'assistente; si applica al bridge della coppia di comandi ospitato dal Gateway |
| `chrome.bargeInRmsThreshold`                | `650`                       | Livello RMS considerato un'interruzione umana                                                                                                                                                                     |
| `chrome.bargeInPeakThreshold`                | `2500`                       | Livello di picco considerato un'interruzione umana                                                                                                                                                                |
| `chrome.bargeInCooldownMs`                | `900`                       | Ritardo minimo tra cancellazioni ripetute dovute a interruzioni                                                                                                                                                    |
| `mode` (per richiesta) | `"agent"`                      | Modalità di risposta vocale; consultare la tabella [Modalità agente e bidirezionale](#agent-and-bidi-modes)                                                                                                       |
| `realtime.provider`                | `"openai"`                       | Fallback di compatibilità utilizzato quando i campi con ambito riportati di seguito non sono impostati                                                                                                            |
| `realtime.transcriptionProvider`                | `"openai"`                       | ID del provider utilizzato dalla modalità `agent` per la trascrizione in tempo reale                                                                                                                    |
| `realtime.voiceProvider`                | non impostato                            | ID del provider utilizzato dalla modalità `bidi` per la voce diretta in tempo reale; impostare `"google"` per Gemini Live mantenendo su OpenAI la trascrizione in modalità agente. Abbinare a `realtime.model` per scegliere il modello Gemini Live specifico. |
| `realtime.toolPolicy`                | `"safe-read-only"`                       | Consultare [Modalità agente e bidirezionale](#agent-and-bidi-modes)                                                                                                                                                 |
| `realtime.instructions`                | istruzioni per risposte vocali brevi     | Indica al modello di parlare brevemente e di usare `openclaw_agent_consult` per risposte più approfondite                                                                                                               |
| `realtime.introMessage`                | `"Say exactly: I'm here and listening."`                       | Pronunciato una volta quando il bridge in tempo reale si connette; impostare `""` per partecipare senza messaggio vocale                                                                             |
| `realtime.agentId`                | `"main"`                       | ID dell'agente OpenClaw utilizzato per `openclaw_agent_consult`                                                                                                                                                          |
| `voiceCall.enabled`                | `true`                       | Delega la chiamata PSTN Twilio, il DTMF e il saluto introduttivo al Plugin Voice Call                                                                                                                              |
| `voiceCall.dtmfDelayMs`                | `12000`                       | Attesa iniziale prima di riprodurre tramite Twilio una sequenza DTMF derivata da un PIN                                                                                                                            |
| `voiceCall.postDtmfSpeechDelayMs`                | `5000`                       | Ritardo prima di richiedere il saluto introduttivo in tempo reale dopo l'avvio della tratta Twilio da parte di Voice Call                                                                                          |

`chrome.audioBridgeCommand` e `chrome.audioBridgeHealthCommand` consentono a un bridge esterno di gestire l'intero percorso audio locale anziché `chrome.audioInputCommand`/`chrome.audioOutputCommand`; consultare le [Note](#notes) per il vincolo relativo alla modalità che può utilizzarli.

Esiste una migrazione `openclaw doctor --fix` per la struttura legacy `realtime.provider: "google"`: trasferisce tale intento in `realtime.voiceProvider: "google"` più `realtime.transcriptionProvider: "openai"` quando questi campi non sono già impostati.

### Override facoltativi

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
    model: "gemini-3.1-flash-live-preview",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Di' esattamente: sono qui.",
    providers: {
      google: {
        speakerVoice: "Kore",
      },
    },
  },
}
```

ElevenLabs sia per l'ascolto sia per la sintesi vocale in modalità agente:

```json5
{
  messages: {
    tts: {
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          modelId: "eleven_v3",
          speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
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

La voce persistente di Meet proviene da `messages.tts.providers.elevenlabs.speakerVoiceId`. Le risposte dell'agente possono inoltre utilizzare direttive `[[tts:speakerVoiceId=... model=eleven_v3]]` per singola risposta quando gli override del modello TTS sono abilitati, ma per le riunioni la configurazione costituisce il valore predefinito deterministico. Al momento della partecipazione, i log mostrano `transcriptionProvider=elevenlabs`, mentre ogni risposta pronunciata registra `provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>`.

Configurazione solo per Twilio:

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

Con `voiceCall.enabled: true` (il valore predefinito) e il trasporto Twilio, Voice Call invia la sequenza DTMF prima di aprire il flusso multimediale in tempo reale, quindi utilizza il testo introduttivo salvato come saluto iniziale in tempo reale. Se `voice-call` non è abilitato, Google Meet può comunque convalidare e registrare il piano di composizione, ma non può effettuare la chiamata Twilio.

Lasciare `voiceCall.gatewayUrl` non impostato per usare il runtime Gateway locale attendibile, che mantiene l'agente
chiamante per l'intera chiamata. Un URL Gateway configurato rimane una destinazione WebSocket esplicita e
non può autenticare la provenienza del plugin; le connessioni di agenti non predefiniti vengono rifiutate in modo sicuro anziché
usare silenziosamente un altro agente. Eseguire Google Meet e Voice Call nello stesso processo Gateway quando è richiesto
l'instradamento per agente.

## Strumento

Gli agenti usano lo strumento `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

| `action`                | Scopo                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `join`                  | Partecipare tramite un URL Meet esplicito                                                         |
| `create`                | Creare uno spazio (e parteciparvi per impostazione predefinita); supporta `accessType`/`entryPointAccess` |
| `status`                | Elencare le sessioni attive o esaminarne una tramite `sessionId`                            |
| `setup_status`          | Eseguire gli stessi controlli di `googlemeet setup`                                               |
| `resolve_space`         | Risolvere un URL/codice/`spaces/{id}` tramite `spaces.get`                              |
| `preflight`             | Convalidare OAuth e i prerequisiti per la risoluzione della riunione                               |
| `latest`                | Trovare il record di conferenza più recente per una riunione                                      |
| `calendar_events`       | Visualizzare l'anteprima degli eventi di Calendar con link Meet                                   |
| `artifacts`             | Elencare i record di conferenza e i metadati di partecipanti/registrazioni/trascrizioni/note intelligenti |
| `attendance`            | Elencare i partecipanti e le relative sessioni                                                    |
| `export`                | Scrivere il pacchetto di artefatti/presenze/trascrizione/manifesto; impostare `"dryRun": true` per il solo manifesto |
| `recover_current_tab`   | Portare in primo piano/esaminare una scheda Meet esistente senza aprirne una nuova                |
| `transcript`            | Leggere la trascrizione limitata dei sottotitoli; `sinceIndex` riprende dal precedente `nextIndex` |
| `leave`                 | Terminare una sessione (Chrome fa clic sul pulsante per uscire; chiude solo le schede che ha aperto; Twilio riaggancia) |
| `end_active_conference` | Terminare la conferenza Google Meet attiva per uno spazio gestito tramite API                      |
| `speak`                 | Far parlare immediatamente l'agente in tempo reale, specificando `sessionId` e `message` |
| `test_speech`           | Creare/riutilizzare una sessione, attivare una frase nota e restituire lo stato di Chrome          |
| `test_listen`           | Creare/riutilizzare una sessione di sola osservazione e attendere variazioni nei sottotitoli/nella trascrizione |

`test_speech` forza sempre `mode: "agent"` o `"bidi"` e non riesce se gli viene richiesto di essere eseguito in `mode: "transcribe"`, perché le sessioni di sola osservazione non possono emettere voce. Il risultato `speechOutputVerified` si basa sull'aumento dei byte di output audio in tempo reale durante quella chiamata, quindi una sessione riutilizzata con audio precedente non viene considerata un nuovo controllo.

Per i trasporti Chrome, `leave` mantiene aperta una scheda riutilizzata di proprietà dell'utente dopo aver fatto clic sul pulsante di Meet per uscire dalla chiamata. Le schede aperte da OpenClaw vengono chiuse dopo l'uscita.

Usare `transport: "chrome"` quando Chrome viene eseguito sull'host Gateway, `transport: "chrome-node"` quando viene eseguito su un Node associato. In entrambi i casi, i provider dei modelli e `openclaw_agent_consult` vengono eseguiti sull'host Gateway, quindi le credenziali del modello rimangono lì. I log in modalità agente includono il provider/modello di trascrizione risolto all'avvio del bridge e il provider/modello/voce/formato di output/frequenza di campionamento TTS dopo ogni risposta sintetizzata. Il valore grezzo `mode: "realtime"` è ancora accettato come alias di compatibilità legacy per `mode: "agent"`, ma non è più pubblicizzato nell'enum `mode` dello strumento.

`create` con una stanza supportata da API e criteri di accesso espliciti:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

Terminare la conferenza attiva di una stanza nota:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

Convalida inizialmente in ascolto prima di dichiarare utile una riunione:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Parlare su richiesta:

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Di' esattamente: sono qui e sto ascoltando."
}
```

`status` include lo stato di Chrome quando disponibile:

| Campo                                                                 | Significato                                                                                                             |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `inCall`                                                              | Chrome sembra trovarsi all'interno della chiamata Meet                                                                 |
| `micMuted`                                                            | Stato del microfono di Meet determinato con il massimo impegno                                                         |
| `manualActionRequired` / `manualActionReason` / `manualActionMessage` | Il profilo del browser richiede accesso manuale, ammissione da parte dell'host Meet, autorizzazioni o riparazione del controllo del browser prima che la voce possa funzionare |
| `speechReady` / `speechBlockedReason` / `speechBlockedMessage`        | Indica se la voce gestita di Chrome è attualmente consentita; `speechReady: false` significa che OpenClaw non ha inviato la frase introduttiva/di test |
| `providerConnected` / `realtimeReady`                                 | Stato del bridge vocale in tempo reale                                                                                 |
| `lastInputAt` / `lastOutputAt`                                        | Ultimo audio ricevuto dal/inviato al bridge                                                                            |
| `audioOutputRouted` / `audioOutputDeviceLabel`                        | Indica se l'output multimediale della scheda Meet è stato instradato attivamente al dispositivo BlackHole del bridge   |
| `lastSuppressedInputAt` / `suppressedInputBytes`                      | Input di loopback ignorato mentre è attiva la riproduzione dell'assistente                                             |

## Modalità agente e bidi

| Modalità | Chi decide la risposta             | Percorso di output vocale                | Da usare quando                                              |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | L'agente OpenClaw configurato | Runtime TTS OpenClaw normale            | Si desidera il comportamento «il mio agente è nella riunione» |
| `bidi`  | Il modello vocale in tempo reale | Risposta audio del provider vocale in tempo reale | Si desidera il ciclo vocale conversazionale con la latenza più bassa |

Modalità `agent`: il provider di trascrizione in tempo reale ascolta l'audio della riunione, le trascrizioni finali dei partecipanti vengono instradate attraverso l'agente OpenClaw configurato e la risposta viene pronunciata tramite il normale TTS di OpenClaw. I frammenti vicini della trascrizione finale vengono accorpati prima della consultazione, affinché un singolo turno parlato non produca diverse risposte parziali obsolete; l'input in tempo reale viene soppresso mentre l'audio dell'assistente in coda è ancora in riproduzione e le eco recenti della trascrizione simili a quelle dell'assistente vengono ignorate prima della consultazione, affinché il loopback BlackHole non induca l'agente a rispondere alla propria voce.

Modalità `bidi`: il modello vocale in tempo reale risponde direttamente e può chiamare `openclaw_agent_consult` per un ragionamento più approfondito, informazioni aggiornate o i normali strumenti OpenClaw. Lo strumento di consultazione esegue dietro le quinte il normale agente OpenClaw con il contesto recente della trascrizione della riunione e restituisce una risposta parlata concisa; in modalità `agent` OpenClaw invia direttamente tale risposta al TTS, mentre in modalità `bidi` il modello vocale in tempo reale può pronunciarla. Usa lo stesso meccanismo di consultazione condiviso di Voice Call.

Per impostazione predefinita, le consultazioni vengono eseguite sull'agente `main`; impostare `realtime.agentId` per indirizzare una corsia Meet verso uno spazio di lavoro dedicato dell'agente, impostazioni predefinite del modello, criteri degli strumenti, memoria e cronologia delle sessioni. Le consultazioni in modalità agente usano una chiave di sessione `agent:<id>:subagent:google-meet:<session>` per riunione, così le domande successive mantengono il contesto della riunione ereditando i normali criteri dell'agente. Quando un agente chiama `google_meet` in modalità agente, la sessione del consulente crea una diramazione dalla trascrizione corrente del chiamante prima di rispondere agli interventi dei partecipanti; la sessione Meet rimane separata, affinché le domande successive della riunione non modifichino direttamente la trascrizione del chiamante.

`realtime.toolPolicy` controlla l'esecuzione della consultazione:

| Criterio           | Comportamento                                                                                                                      |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Esporre lo strumento di consultazione; limitare l'agente normale a `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, `memory_get` |
| `owner`          | Esporre lo strumento di consultazione; consentire all'agente normale di usare i propri criteri degli strumenti                    |
| `none`           | Non esporre lo strumento di consultazione al modello vocale in tempo reale                                                        |

La chiave della sessione di consultazione è circoscritta a ogni sessione Meet, quindi le chiamate di consultazione successive riutilizzano il contesto di consultazione precedente durante la stessa riunione.

Forzare un controllo vocale di disponibilità dopo che Chrome ha completato l'accesso:

```bash
openclaw googlemeet speak meet_... "Di' esattamente: sono qui e sto ascoltando."
```

Smoke test completo di accesso e parlato:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Di' esattamente: sono qui e sto ascoltando."
```

## Elenco di controllo per il test live

Prima di affidare una riunione a un agente non sorvegliato:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Di' esattamente: test vocale di Google Meet completato."
```

Stato Chrome-node previsto:

- `googlemeet setup` è completamente verde e include `chrome-node-connected` quando Chrome-node è il trasporto predefinito o un Node è fissato.
- `nodes status` mostra il Node selezionato connesso e che pubblicizza sia `googlemeet.chrome` sia `browser.proxy`.
- La scheda Meet accede alla riunione e `test-speech` restituisce lo stato di Chrome con `inCall: true`.

Per un host Chrome remoto, come una VM macOS Parallels, il controllo sicuro più breve dopo l'aggiornamento del Gateway o della VM è:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Ciò dimostra che il plugin Gateway è caricato, che il Node della VM è connesso con il token corrente e che il bridge audio di Meet è disponibile prima che un agente apra una vera scheda di riunione.

Per uno smoke test Twilio, usare una riunione che esponga i dettagli di accesso telefonico:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Stato Twilio previsto:

- `googlemeet setup` include controlli verdi per `twilio-voice-call-plugin`, `twilio-voice-call-credentials` e `twilio-voice-call-webhook`.
- `voicecall` è disponibile nella CLI dopo il ricaricamento del Gateway.
- La sessione restituita contiene `transport: "twilio"` e un `twilio.voiceCallId`.
- `openclaw logs --follow` mostra il TwiML DTMF servito prima del TwiML in tempo reale, quindi un bridge in tempo reale con il saluto iniziale in coda.
- `googlemeet leave <sessionId>` termina la chiamata vocale delegata.

## Risoluzione dei problemi

### L'agente non riesce a vedere lo strumento Google Meet

Verificare che il Plugin sia abilitato e ricaricare il Gateway; l'agente in esecuzione vede solo gli strumenti dei Plugin registrati dal processo Gateway corrente:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Sugli host Gateway non macOS, `google_meet` rimane visibile, ma le azioni locali di risposta vocale di Chrome vengono bloccate prima di raggiungere il bridge audio. Usare invece `mode: "transcribe"`, l'accesso telefonico Twilio o un host `chrome-node` macOS, anziché il percorso predefinito dell'agente Chrome locale.

### Nessun Node con funzionalità Google Meet connesso

Sull'host del Node:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Sull'host del Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Il Node deve essere connesso ed elencare `googlemeet.chrome` oltre a `browser.proxy`; la configurazione del Gateway deve consentirli entrambi:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Se `googlemeet setup` non supera `chrome-node-connected`, oppure il log del Gateway segnala `gateway token mismatch`, reinstallare o riavviare il Node con il token Gateway corrente:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Quindi ricaricare il servizio del Node ed eseguire nuovamente:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Il browser si apre, ma l'agente non riesce a partecipare

Eseguire `googlemeet test-listen` per partecipazioni di sola osservazione oppure `googlemeet test-speech` per partecipazioni in tempo reale, quindi esaminare lo stato di integrità di Chrome restituito. Se uno dei due segnala `manualActionRequired: true`, mostrare `manualActionMessage` all'operatore e interrompere i tentativi finché l'azione nel browser non è completata.

Azioni manuali comuni: accedere al profilo Chrome; ammettere l'ospite dall'account host di Meet; concedere a Chrome le autorizzazioni per microfono e videocamera quando appare la richiesta nativa; chiudere o risolvere una finestra di dialogo bloccata relativa alle autorizzazioni di Meet.

Non segnalare "accesso non effettuato" solo perché Meet chiede "Do you want people to hear you in the meeting?"; si tratta della schermata intermedia di Meet per la scelta dell'audio. Quando disponibile, OpenClaw fa clic su **Use microphone** tramite l'automazione del browser e continua ad attendere lo stato effettivo della riunione; per il fallback del browser dedicato alla sola creazione, può invece fare clic su **Continue without microphone**, poiché la generazione dell'URL non richiede il percorso audio in tempo reale.

### La creazione della riunione non riesce

`googlemeet create` usa l'API Meet `spaces.create` quando OAuth è configurato; altrimenti usa il browser Chrome del Node fissato. Verificare quanto segue:

- **Creazione tramite API**: `oauth.clientId` e `oauth.refreshToken` (oppure le variabili di ambiente `OPENCLAW_GOOGLE_MEET_*` corrispondenti) sono presenti e il token di aggiornamento è stato generato dopo l'aggiunta del supporto per la creazione; i token meno recenti potrebbero non includere `meetings.space.created`, quindi eseguire nuovamente `openclaw googlemeet auth login --json`.
- **Fallback del browser**: `defaultTransport: "chrome-node"` e `chromeNode.node` puntano a un Node connesso dotato di `browser.proxy` e `googlemeet.chrome`; il profilo Chrome di OpenClaw su tale Node ha effettuato l'accesso e può aprire `https://meet.google.com/new`.
- **Nuovi tentativi del fallback del browser**: riutilizzare una scheda esistente di `.../new` o della richiesta dell'account Google prima di aprirne una nuova; ripetere la chiamata allo strumento anziché aprire manualmente un'altra scheda.
- **Azione manuale**: se lo strumento restituisce `manualActionRequired: true`, usare `browser.nodeId`, `browser.targetId`, `browserUrl` e `manualActionMessage` per guidare l'operatore; non riprovare in ciclo.
- **Schermata intermedia per la scelta dell'audio**: se Meet mostra "Do you want people to hear you in the meeting?", lasciare aperta la scheda. OpenClaw dovrebbe fare clic su **Use microphone** oppure, solo per la creazione, su **Continue without microphone** e continuare ad attendere l'URL generato; se non riesce, l'errore dovrebbe menzionare `meet-audio-choice-required`, non `google-login-required`.

### L'agente partecipa, ma non parla

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Usare `mode: "agent"` per il percorso STT -> agente OpenClaw -> TTS, oppure `mode: "bidi"` per il fallback vocale diretto in tempo reale. `mode: "transcribe"` non avvia intenzionalmente alcun bridge di risposta vocale. Per il debug in sola osservazione, eseguire `openclaw googlemeet status --json <session-id>` dopo che i partecipanti hanno parlato e controllare `captioning`, `transcriptLines`, `lastCaptionText`. Se `inCall` è true ma `transcriptLines` rimane `0`, i sottotitoli di Meet potrebbero essere disabilitati, nessuno potrebbe aver parlato da quando è stato installato l'osservatore, l'interfaccia utente di Meet potrebbe essere cambiata oppure i sottotitoli in tempo reale potrebbero non essere disponibili per la lingua o l'account della riunione.

`googlemeet test-speech` controlla sempre il percorso in tempo reale e segnala se per tale invocazione sono stati osservati byte in uscita dal bridge. Se `speechOutputVerified` è false e `speechOutputTimedOut` è true, il provider in tempo reale potrebbe aver accettato l'enunciato, ma OpenClaw non ha rilevato nuovi byte in uscita raggiungere il bridge audio di Chrome.

Verificare inoltre quanto segue: sull'host del Gateway è disponibile una chiave del provider in tempo reale (`OPENAI_API_KEY` o `GEMINI_API_KEY`); `BlackHole 2ch` è visibile sull'host Chrome; `sox` è presente su tale host; il microfono e l'altoparlante di Meet sono instradati attraverso il percorso audio virtuale (`doctor` dovrebbe mostrare `meet output routed: yes` per le partecipazioni Chrome locali in tempo reale).

`googlemeet doctor [session-id]` visualizza sessione, Node, stato della chiamata, motivo dell'azione manuale, connessione del provider in tempo reale, `realtimeReady`, attività di ingresso/uscita audio, timestamp dell'ultima attività audio, contatori di byte e URL del browser. Usare `googlemeet status [session-id] --json` per il JSON non elaborato e `googlemeet doctor --oauth` (aggiungere `--meeting` o `--create-space`) per verificare l'aggiornamento OAuth senza esporre i token.

Se un agente ha raggiunto il timeout ed è già aperta una scheda Meet, esaminarla senza aprirne un'altra:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

L'azione equivalente dello strumento è `recover_current_tab`: porta in primo piano ed esamina una scheda Meet esistente per il trasporto selezionato (controllo locale del browser per `chrome`, Node configurato per `chrome-node`) senza aprire una nuova scheda o sessione e segnala l'impedimento corrente (accesso, ammissione, autorizzazioni, stato della scelta audio). Il comando CLI comunica con il Gateway configurato, che deve essere in esecuzione; `chrome-node` richiede inoltre che il Node sia connesso.

### I controlli di configurazione di Twilio non riescono

`twilio-voice-call-plugin` non riesce quando `voice-call` non è consentito o non è abilitato: aggiungerlo a `plugins.allow`, abilitare `plugins.entries.voice-call`, quindi ricaricare il Gateway.

`twilio-voice-call-credentials` non riesce quando al backend Twilio mancano il SID dell'account, il token di autenticazione o il numero del chiamante:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` non riesce quando `voice-call` non dispone di un'esposizione Webhook pubblica oppure `publicUrl` punta allo spazio di rete loopback/privato. Non usare `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` o `fd00::/8` come `publicUrl`; i callback dell'operatore telefonico non possono raggiungerli. Impostare `plugins.entries.voice-call.config.publicUrl` su un URL pubblico oppure configurare l'esposizione tramite tunnel/Tailscale:

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

Per lo sviluppo locale, usare un tunnel o un'esposizione Tailscale anziché l'URL di un host privato:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // oppure
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Riavviare o ricaricare il Gateway, quindi:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

Per impostazione predefinita, `voicecall smoke` verifica soltanto la disponibilità. Eseguire una prova senza chiamata per un numero specifico:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Aggiungere `--yes` soltanto per effettuare intenzionalmente una chiamata in uscita reale:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### La chiamata Twilio si avvia, ma non accede mai alla riunione

Verificare che l'evento Meet esponga i dettagli per l'accesso telefonico e specificare il numero esatto per l'accesso telefonico insieme al PIN oppure una sequenza DTMF personalizzata:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Usare `w` iniziali o virgole in `--dtmf-sequence` per inserire una pausa prima del PIN.

Se la chiamata viene creata, ma l'elenco dei partecipanti di Meet non mostra mai il partecipante con accesso telefonico:

- `openclaw googlemeet doctor <session-id>`: verificare l'ID della chiamata Twilio delegata, se il DTMF è stato accodato e se è stato richiesto il saluto introduttivo.
- `openclaw voicecall status --call-id <id>`: verificare che la chiamata sia ancora attiva.
- `openclaw voicecall tail`: verificare che i Webhook Twilio stiano arrivando al Gateway.
- `openclaw logs --follow`: cercare la sequenza Twilio Meet: Google Meet delega la partecipazione, Voice Call memorizza e serve il TwiML DTMF precedente alla connessione, Voice Call serve il TwiML in tempo reale per la chiamata Twilio, quindi Google Meet richiede il messaggio introduttivo con `voicecall.speak`.
- Eseguire nuovamente `openclaw googlemeet setup --transport twilio`; è necessario un controllo di configurazione verde, ma ciò non dimostra che la sequenza PIN della riunione sia corretta.
- Verificare che il numero per l'accesso telefonico appartenga allo stesso invito Meet e alla stessa regione del PIN.
- Aumentare `voiceCall.dtmfDelayMs` rispetto al valore predefinito di 12 secondi se Meet risponde lentamente o se la trascrizione della chiamata mostra ancora la richiesta del PIN dopo l'invio del DTMF precedente alla connessione.
- Se il partecipante accede ma non si sente il saluto, controllare `openclaw logs --follow` per la richiesta `voicecall.speak` successiva al DTMF e verificare la riproduzione TTS del flusso multimediale oppure il fallback Twilio `<Say>`. Se la trascrizione mostra ancora "enter the meeting PIN", il segmento telefonico non ha ancora effettuato l'accesso alla sala Meet, quindi i partecipanti non sentiranno alcun messaggio vocale.

Se i Webhook non arrivano, eseguire prima il debug del Plugin Voice Call: il provider deve poter raggiungere `plugins.entries.voice-call.config.publicUrl` o il tunnel configurato. Consultare [Risoluzione dei problemi delle chiamate vocali](/it/plugins/voice-call#troubleshooting).

## Note

L'API multimediale ufficiale di Google Meet è orientata alla ricezione, quindi per parlare durante una chiamata è comunque necessario un percorso da partecipante. Questo Plugin mantiene visibile tale separazione: Chrome gestisce la partecipazione tramite browser e l'instradamento audio locale; Twilio gestisce la partecipazione tramite accesso telefonico.

Le modalità di risposta vocale di Chrome richiedono `BlackHole 2ch` e inoltre una delle seguenti opzioni:

- `chrome.audioInputCommand` più `chrome.audioOutputCommand`: OpenClaw gestisce il bridge e convoglia l'audio in `chrome.audioFormat` tra questi comandi e il provider selezionato. La modalità `agent` utilizza la trascrizione in tempo reale insieme al normale TTS; la modalità `bidi` utilizza il provider vocale in tempo reale. Il percorso predefinito è PCM16 a 24 kHz con `chrome.audioBufferBytes: 4096`; G.711 mu-law a 8 kHz resta disponibile per le coppie di comandi legacy.
- `chrome.audioBridgeCommand`: un comando bridge esterno gestisce l'intero percorso audio locale e deve terminare dopo aver avviato o convalidato il proprio daemon. Valido solo per `bidi`, poiché la modalità `agent` richiede l'accesso diretto alla coppia di comandi per il TTS.

Con il bridge Chrome basato su coppia di comandi, `chrome.bargeInInputCommand` può ascoltare un microfono locale separato e interrompere la riproduzione dell'assistente quando una persona inizia a parlare, dando priorità alla voce umana rispetto all'output dell'assistente anche mentre l'ingresso di loopback BlackHole condiviso viene temporaneamente soppresso durante la riproduzione dell'assistente. Come `chrome.audioInputCommand`/`chrome.audioOutputCommand`, è un comando locale configurato dall'operatore: utilizzare un percorso di comando attendibile esplicito o un elenco di argomenti, mai uno script proveniente da una posizione non attendibile.

Per un audio duplex pulito, instradare l'output di Meet e il microfono di Meet tramite dispositivi virtuali separati o un grafo di dispositivi virtuali in stile Loopback; un singolo dispositivo BlackHole condiviso può reintrodurre nella chiamata l'audio degli altri partecipanti sotto forma di eco.

`googlemeet speak` attiva il bridge audio di risposta vocale attivo per una sessione Chrome; `googlemeet leave` lo arresta (e, per le sessioni Twilio delegate tramite Chiamata vocale, termina la chiamata sottostante). Utilizzare `googlemeet end-active-conference` per chiudere anche la conferenza Google Meet attiva per uno spazio gestito tramite API.

## Correlati

- [Plugin per le chiamate vocali](/it/plugins/voice-call)
- [Modalità conversazione](/it/nodes/talk)
- [Creazione di Plugin](/it/plugins/building-plugins)
