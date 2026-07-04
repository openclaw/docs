---
read_when:
    - Lavorare sul comportamento del canale WhatsApp/web o sull’instradamento della casella in arrivo
summary: Supporto del canale WhatsApp, controlli di accesso, comportamento di recapito e operazioni
title: WhatsApp
x-i18n:
    generated_at: "2026-07-04T10:43:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a968c08c461708fb4b8cabe4528af2514b0a5768d272abab8f88e36e24bde302
    source_path: channels/whatsapp.md
    workflow: 16
---

Stato: pronto per la produzione tramite WhatsApp Web (Baileys). Il Gateway gestisce le sessioni collegate.

## Installazione (su richiesta)

- L'onboarding (`openclaw onboard`) e `openclaw channels add --channel whatsapp`
  chiedono di installare il Plugin WhatsApp la prima volta che lo selezioni.
- `openclaw channels login --channel whatsapp` offre anche il flusso di installazione quando
  il Plugin non è ancora presente.
- Canale dev + checkout git: usa per impostazione predefinita il percorso del Plugin locale.
- Stable/Beta: installa prima il Plugin ufficiale `@openclaw/whatsapp` da ClawHub,
  con npm come fallback.
- Il runtime WhatsApp è distribuito al di fuori del pacchetto npm core di OpenClaw, così
  le dipendenze di runtime specifiche di WhatsApp restano nel Plugin esterno.

L'installazione manuale resta disponibile:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Usa il pacchetto npm semplice (`@openclaw/whatsapp`) solo quando hai bisogno del fallback
del registro. Fissa una versione esatta solo quando hai bisogno di un'installazione riproducibile.

<CardGroup cols={3}>
  <Card title="Abbinamento" icon="link" href="/it/channels/pairing">
    La policy DM predefinita è l'abbinamento per i mittenti sconosciuti.
  </Card>
  <Card title="Risoluzione dei problemi del canale" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica cross-channel e playbook di riparazione.
  </Card>
  <Card title="Configurazione del Gateway" icon="settings" href="/it/gateway/configuration">
    Pattern ed esempi completi di configurazione del canale.
  </Card>
</CardGroup>

## Configurazione rapida

<Steps>
  <Step title="Configura la policy di accesso WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="Collega WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    L'accesso attuale è basato su QR. In ambienti remoti o headless, assicurati di
    avere un percorso affidabile per consegnare il codice QR live al telefono che lo
    scansionerà prima di avviare l'accesso.

    Per un account specifico:

```bash
openclaw channels login --channel whatsapp --account work
```

    Per allegare una directory di autenticazione WhatsApp Web esistente/personalizzata prima dell'accesso:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Avvia il Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Approva la prima richiesta di abbinamento (se usi la modalità di abbinamento)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Le richieste di abbinamento scadono dopo 1 ora. Le richieste in sospeso sono limitate a 3 per canale.

  </Step>
</Steps>

<Note>
OpenClaw consiglia di eseguire WhatsApp su un numero separato quando possibile. (I metadati del canale e il flusso di configurazione sono ottimizzati per questa configurazione, ma sono supportate anche le configurazioni con numero personale.)
</Note>

<Warning>
L'attuale flusso di configurazione di WhatsApp è solo QR. I QR renderizzati nel terminale, gli screenshot,
i PDF o gli allegati in chat possono scadere o diventare illeggibili durante il relay
da una macchina remota. Per host remoti/headless, preferisci un percorso di consegna diretto
dell'immagine QR alla cattura manuale dal terminale.
</Warning>

## Chiamare il richiedente corrente con MeowCaller (sperimentale)

Il Plugin WhatsApp può esporre `whatsapp_call` nei turni dell'agente originati da WhatsApp. Lo strumento
usa [MeowCaller](https://github.com/purpshell/meowcaller) per effettuare una chiamata vocale WhatsApp al
richiedente autorizzato corrente e riproduce un messaggio TTS di OpenClaw dopo la risposta. Lo strumento
non accetta un numero di destinazione, quindi un prompt non può reindirizzare la chiamata a terzi.
Questa funzionalità sperimentale è disabilitata per impostazione predefinita.

<Warning>
MeowCaller è sperimentale, non ha una release taggata e usa una sessione di dispositivo collegato whatsmeow
abbinata separatamente. Non può riutilizzare le credenziali Baileys del Plugin WhatsApp. L'abbinamento aggiunge
un altro dispositivo collegato allo stesso account WhatsApp. Scansiona con l'identità WhatsApp usata da
OpenClaw. La modalità numero personale/self-chat non può chiamare se stessa; usa un numero OpenClaw dedicato
per chiamare il tuo numero personale.
</Warning>

<Steps>
  <Step title="Abilita le chiamate sperimentali">

    Aggiungi `actions.calls: true` al canale WhatsApp in `openclaw.json`:

```json
{
  "channels": {
    "whatsapp": {
      "actions": {
        "calls": true
      }
    }
  }
}
```

    Unisci questa impostazione alla tua configurazione WhatsApp esistente, quindi riavvia il Gateway. Quando
    l'impostazione è assente o `false`, OpenClaw non espone lo strumento `whatsapp_call` all'agente.

  </Step>

  <Step title="Installa la CLI MeowCaller revisionata">

    L'adapter si aspetta un eseguibile chiamato `meowcaller` nel `PATH` dell'host del Gateway.
    Finché [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7) non viene unita, compila
    il branch revisionato al commit `752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f`:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    Assicurati che `$HOME/.local/bin` sia anche nel `PATH` del servizio Gateway. Questa revisione fornisce
    comandi espliciti `pair` e `notify` solo invio. `notify` non apre microfono, altoparlante,
    dispositivo video, sink audio in ingresso o acquisizione diagnostica. Non sostituirlo con il comando
    `play` della CLI di esempio.

  </Step>

  <Step title="Abbina il dispositivo collegato MeowCaller">

    Chiedi all'agente WhatsApp di controllare la configurazione delle chiamate. L'azione di stato `whatsapp_call` riporta la
    directory di stato specifica dell'account e il comando di abbinamento. Per l'account predefinito:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Esegui il comando in un terminale interattivo. Scansiona il suo QR da **WhatsApp > Dispositivi collegati**
    e attendi `MeowCaller linked device ready`. Il comando poi termina. Mantieni `wa-voip.db`
    privato; è la sessione di dispositivo collegato MeowCaller. L'azione di stato `whatsapp_call`
    restituisce il comando e la shell specifici dell'account quando usi un account non predefinito. Su
    Windows, esegui il suo comando PowerShell; MeowCaller crea la directory dello store.

  </Step>

  <Step title="Configura TTS e chiama da WhatsApp">

    Configura un [provider TTS](/it/tools/tts) capace di telefonia, riavvia il Gateway, quindi invia una
    richiesta WhatsApp come `Call me and say the build finished.` Lo strumento risolve il mittente
    dal contesto in ingresso attendibile, sintetizza un file WAV temporaneo privato, esegue MeowCaller per una
    finestra di chiamata limitata ed elimina poi il file audio. OpenClaw passa esplicitamente lo store
    dell'account, attende uno stato di uscita zero dopo risposta, riproduzione e riaggancio, e tratta
    un timeout o un'uscita diversa da zero come chiamata strumento non riuscita.

  </Step>
</Steps>

Limiti attuali:

- solo chiamate audio in uscita uno-a-uno
- nessun numero di destinazione arbitrario
- nessuna autenticazione condivisa con la connessione chat
- nessuna autochiamata dalla modalità numero personale/self-chat
- l'audio sintetizzato è limitato a 60 secondi
- nessuna ricevuta di udibilità lato telefono oltre al completamento di risposta/riproduzione/riaggancio di MeowCaller
- OpenClaw arresta il processo companion dopo una finestra limitata di 115-175 secondi, incluse
  le fasi di connessione, risposta, riproduzione e arresto di MeowCaller

## Pattern di distribuzione

<AccordionGroup>
  <Accordion title="Numero dedicato (consigliato)">
    Questa è la modalità operativa più pulita:

    - identità WhatsApp separata per OpenClaw
    - allowlist DM e confini di routing più chiari
    - minore probabilità di confusione con self-chat

    Pattern di policy minimo:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Fallback con numero personale">
    L'onboarding supporta la modalità numero personale e scrive una baseline adatta a self-chat:

    - `dmPolicy: "allowlist"`
    - `allowFrom` include il tuo numero personale
    - `selfChatMode: true`

    Nel runtime, le protezioni self-chat si basano sul numero proprio collegato e su `allowFrom`.

  </Accordion>

  <Accordion title="Ambito canale solo WhatsApp Web">
    Il canale della piattaforma di messaggistica è basato su WhatsApp Web (`Baileys`) nell'attuale architettura dei canali OpenClaw.

    Non esiste un canale di messaggistica WhatsApp Twilio separato nel registro dei canali chat integrato.

  </Accordion>
</AccordionGroup>

## Modello runtime

- Il Gateway gestisce il socket WhatsApp e il ciclo di riconnessione.
- Il watchdog di riconnessione usa l'attività del trasporto WhatsApp Web, non solo il volume di messaggi app in ingresso, quindi una sessione di dispositivo collegato silenziosa non viene riavviata solo perché nessuno ha inviato un messaggio di recente. Un limite più lungo di silenzio applicativo forza comunque una riconnessione se i frame di trasporto continuano ad arrivare ma nessun messaggio applicativo viene gestito per la finestra del watchdog; dopo una riconnessione transitoria per una sessione attiva di recente, quel controllo di silenzio applicativo usa il normale timeout dei messaggi per la prima finestra di ripristino.
- I timing del socket Baileys sono espliciti sotto `web.whatsapp.*`: `keepAliveIntervalMs` controlla i ping applicativi di WhatsApp Web, `connectTimeoutMs` controlla il timeout dell'handshake di apertura e `defaultQueryTimeoutMs` controlla le attese delle query Baileys più i limiti locali di OpenClaw per invio/presenza in uscita e operazioni di conferma di lettura in ingresso.
- Gli invii in uscita richiedono un listener WhatsApp attivo per l'account di destinazione.
- Gli invii di gruppo allegano metadati di menzione nativi per token `@+<digits>` e `@<digits>` nel testo e nelle didascalie dei media quando il token corrisponde ai metadati dei partecipanti WhatsApp correnti, inclusi i gruppi basati su LID.
- Le chat di stato e broadcast vengono ignorate (`@status`, `@broadcast`).
- Il watchdog di riconnessione segue l'attività del trasporto WhatsApp Web, non solo il volume di messaggi app in ingresso: le sessioni di dispositivo collegato silenziose restano attive mentre i frame di trasporto continuano, ma uno stallo del trasporto forza la riconnessione ben prima del successivo percorso di disconnessione remota.
- Le chat dirette usano le regole di sessione DM (`session.dmScope`; il valore predefinito `main` accorpa i DM alla sessione principale dell'agente).
- Le sessioni di gruppo sono isolate (`agent:<agentId>:whatsapp:group:<jid>`).
- I Canali/Newsletter WhatsApp possono essere destinazioni in uscita esplicite con il loro JID nativo `@newsletter`. Gli invii di newsletter in uscita usano metadati di sessione del canale (`agent:<agentId>:whatsapp:channel:<jid>`) invece della semantica di sessione DM.
- Il trasporto WhatsApp Web rispetta le variabili d'ambiente proxy standard sull'host del Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / varianti minuscole). Preferisci la configurazione proxy a livello host rispetto alle impostazioni proxy WhatsApp specifiche del canale.
- Quando `messages.removeAckAfterReply` è abilitato, OpenClaw cancella la reazione di ack WhatsApp dopo la consegna di una risposta visibile.

## Prompt di approvazione

WhatsApp può renderizzare prompt di approvazione per exec e Plugin con reazioni `👍` / `👎`. La consegna è
controllata dalla configurazione di inoltro approvazioni di livello superiore:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session",
    },
    plugin: {
      enabled: true,
      mode: "targets",
      targets: [{ channel: "whatsapp", to: "+15551234567" }],
    },
  },
}
```

`approvals.exec` e `approvals.plugin` sono indipendenti. Abilitare WhatsApp come canale collega solo
il trasporto; non invia prompt di approvazione a meno che la famiglia di approvazioni corrispondente sia abilitata
e instradi verso WhatsApp. La modalità session consegna approvazioni emoji native solo per approvazioni che
hanno origine da WhatsApp. La modalità target usa la pipeline di inoltro condivisa per target WhatsApp
espliciti e non crea un fanout separato di DM approvatore.

Le reazioni di approvazione WhatsApp richiedono approvatori WhatsApp espliciti da `allowFrom` o `"*"`.
`defaultTo` controlla i normali target predefiniti dei messaggi; non è un approvatore di approvazioni. I comandi
manuali `/approve` passano comunque attraverso il normale percorso di autorizzazione del mittente WhatsApp prima della
risoluzione dell'approvazione.

## Hook del Plugin e privacy

I messaggi in ingresso di WhatsApp possono contenere contenuto personale dei messaggi, numeri di telefono,
identificatori di gruppo, nomi dei mittenti e campi di correlazione della sessione. Per questo motivo,
WhatsApp non trasmette i payload degli hook `message_received` in ingresso ai plugin
a meno che tu non acconsenta esplicitamente:

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

Puoi limitare il consenso a un account:

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        work: {
          pluginHooks: {
            messageReceived: true,
          },
        },
      },
    },
  },
}
```

Abilitalo solo per i plugin che ritieni affidabili per ricevere contenuti e
identificatori dei messaggi WhatsApp in ingresso.

## Controllo degli accessi e attivazione

<Tabs>
  <Tab title="Criterio DM">
    `channels.whatsapp.dmPolicy` controlla l'accesso alle chat dirette:

    - `pairing` (predefinito)
    - `allowlist`
    - `open` (richiede che `allowFrom` includa `"*"`)
    - `disabled`

    `allowFrom` accetta numeri in stile E.164 (normalizzati internamente).

    `allowFrom` è una lista di controllo degli accessi per i mittenti DM. Non limita gli invii espliciti in uscita ai JID dei gruppi WhatsApp o ai JID dei canali `@newsletter`.

    Override multi-account: `channels.whatsapp.accounts.<id>.dmPolicy` (e `allowFrom`) hanno la precedenza sui valori predefiniti a livello di canale per quell'account.

    Dettagli sul comportamento runtime:

    - gli abbinamenti vengono mantenuti nell'allow-store del canale e uniti con `allowFrom` configurato
    - automazione pianificata e fallback del destinatario Heartbeat usano target di consegna espliciti o `allowFrom` configurato; le approvazioni di abbinamento DM non sono destinatari Cron o Heartbeat impliciti
    - se non è configurata alcuna allowlist, il numero personale collegato è consentito per impostazione predefinita
    - OpenClaw non abbina mai automaticamente DM `fromMe` in uscita (messaggi che invii a te stesso dal dispositivo collegato)

  </Tab>

  <Tab title="Criterio gruppi + allowlist">
    L'accesso ai gruppi ha due livelli:

    1. **Allowlist di appartenenza ai gruppi** (`channels.whatsapp.groups`)
       - se `groups` è omesso, tutti i gruppi sono idonei
       - se `groups` è presente, agisce come allowlist di gruppi (`"*"` consentito)

    2. **Criterio mittenti di gruppo** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist dei mittenti bypassata
       - `allowlist`: il mittente deve corrispondere a `groupAllowFrom` (o `*`)
       - `disabled`: blocca tutto l'ingresso dai gruppi

    Fallback dell'allowlist dei mittenti:

    - se `groupAllowFrom` non è impostato, il runtime ripiega su `allowFrom` quando disponibile
    - le allowlist dei mittenti vengono valutate prima dell'attivazione tramite menzione/risposta

    Nota: se non esiste alcun blocco `channels.whatsapp`, il fallback runtime del criterio di gruppo è `allowlist` (con un log di avviso), anche se `channels.defaults.groupPolicy` è impostato.

  </Tab>

  <Tab title="Menzioni + /activation">
    Le risposte nei gruppi richiedono una menzione per impostazione predefinita.

    Il rilevamento delle menzioni include:

    - menzioni WhatsApp esplicite dell'identità del bot
    - pattern regex di menzione configurati (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - trascrizioni di note vocali in ingresso per messaggi di gruppo autorizzati
    - rilevamento implicito di risposta al bot (il mittente della risposta corrisponde all'identità del bot)

    Nota di sicurezza:

    - citazione/risposta soddisfa solo il requisito della menzione; **non** concede l'autorizzazione al mittente
    - con `groupPolicy: "allowlist"`, i mittenti non inclusi nell'allowlist restano bloccati anche se rispondono al messaggio di un utente incluso nell'allowlist

    Comando di attivazione a livello di sessione:

    - `/activation mention`
    - `/activation always`

    `activation` aggiorna lo stato della sessione (non la configurazione globale). È limitato al proprietario.

  </Tab>
</Tabs>

## Binding ACP configurati

WhatsApp supporta binding ACP persistenti con voci `bindings[]` di primo livello:

```json5
{
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "direct", id: "+15555550123" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "group", id: "120363424282127706@g.us" },
      },
    },
  ],
}
```

- Le chat dirette corrispondono a numeri E.164 come `+15555550123`.
- I gruppi corrispondono a JID di gruppi WhatsApp come `120363424282127706@g.us`.
- Allowlist dei gruppi, criterio dei mittenti e gating tramite menzione o attivazione vengono eseguiti prima che OpenClaw garantisca l'esistenza della sessione ACP configurata.
- Un binding ACP configurato corrispondente possiede la route. I gruppi broadcast WhatsApp non distribuiscono quel turno alle normali sessioni WhatsApp.

## Comportamento del numero personale e della chat con se stessi

Quando il numero personale collegato è presente anche in `allowFrom`, si attivano le protezioni per la chat con se stessi di WhatsApp:

- salta le conferme di lettura per i turni di chat con se stessi
- ignora il comportamento di attivazione automatica mention-JID che altrimenti ti invierebbe un ping
- se `messages.responsePrefix` non è impostato, le risposte nella chat con se stessi usano per impostazione predefinita `[{identity.name}]` o `[openclaw]`

## Normalizzazione dei messaggi e contesto

<AccordionGroup>
  <Accordion title="Envelope in ingresso + contesto della risposta">
    I messaggi WhatsApp in arrivo sono racchiusi nell'envelope in ingresso condiviso.

    Se esiste una risposta citata, il contesto viene aggiunto in questa forma:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Anche i campi di metadati della risposta vengono popolati quando disponibili (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 del mittente).
    Quando il target della risposta citata è un media scaricabile, OpenClaw lo salva tramite
    il normale store dei media in ingresso e lo espone come `MediaPath`/`MediaType`, così
    l'agente può ispezionare l'immagine referenziata invece di vedere solo
    `<media:image>`.

  </Accordion>

  <Accordion title="Segnaposto media ed estrazione di posizione/contatto">
    I messaggi in ingresso composti solo da media vengono normalizzati con segnaposto come:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Le note vocali di gruppo autorizzate vengono trascritte prima del gating tramite menzione quando il
    corpo è solo `<media:audio>`, quindi pronunciare la menzione del bot nella nota vocale può
    attivare la risposta. Se la trascrizione continua a non menzionare il bot, la
    trascrizione viene mantenuta nella cronologia di gruppo in sospeso invece del segnaposto grezzo.

    I corpi delle posizioni usano testo conciso con coordinate. Etichette/commenti di posizione e dettagli di contatti/vCard sono resi come metadati non attendibili in blocchi delimitati, non come testo inline del prompt.

  </Accordion>

  <Accordion title="Iniezione della cronologia di gruppo in sospeso">
    Per i gruppi, i messaggi non elaborati possono essere memorizzati nel buffer e iniettati come contesto quando il bot viene finalmente attivato.

    - limite predefinito: `50`
    - configurazione: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` disabilita

    Marcatori di iniezione:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Conferme di lettura">
    Le conferme di lettura sono abilitate per impostazione predefinita per i messaggi WhatsApp in ingresso accettati.

    Disabilita globalmente:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Override per account:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    I turni di chat con se stessi saltano le conferme di lettura anche quando sono abilitate globalmente.

  </Accordion>
</AccordionGroup>

## Consegna, suddivisione in blocchi e media

<AccordionGroup>
  <Accordion title="Suddivisione del testo in blocchi">
    - limite blocco predefinito: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - la modalità `newline` preferisce i confini di paragrafo (righe vuote), quindi ripiega sulla suddivisione in blocchi sicura per lunghezza

  </Accordion>

  <Accordion title="Comportamento dei media in uscita">
    - supporta payload di immagini, video, audio (nota vocale PTT) e documenti
    - i media audio vengono inviati tramite il payload `audio` di Baileys con `ptt: true`, quindi i client WhatsApp li visualizzano come nota vocale push-to-talk
    - i payload di risposta preservano `audioAsVoice`; l'output nota vocale TTS per WhatsApp resta su questo percorso PTT anche quando il provider restituisce MP3 o WebM
    - l'audio Ogg/Opus nativo viene inviato come `audio/ogg; codecs=opus` per la compatibilità con le note vocali
    - l'audio non Ogg, incluso l'output MP3/WebM di Microsoft Edge TTS, viene transcodificato con `ffmpeg` a Ogg/Opus mono a 48 kHz prima della consegna PTT
    - `/tts latest` invia l'ultima risposta dell'assistente come una nota vocale e sopprime invii ripetuti per la stessa risposta; `/tts chat on|off|default` controlla l'auto-TTS per la chat WhatsApp corrente
    - la riproduzione di GIF animate è supportata tramite `gifPlayback: true` negli invii video
    - `forceDocument` / `asDocument` invia immagini, GIF e video in uscita tramite il payload documento di Baileys per evitare la compressione media di WhatsApp preservando il nome file risolto e il tipo MIME
    - le didascalie vengono applicate al primo elemento media quando si inviano payload di risposta multi-media, tranne per le note vocali PTT, che inviano prima l'audio e il testo visibile separatamente perché i client WhatsApp non visualizzano le didascalie delle note vocali in modo coerente
    - la sorgente media può essere HTTP(S), `file://` o percorsi locali

  </Accordion>

  <Accordion title="Limiti di dimensione dei media e comportamento di fallback">
    - limite di salvataggio dei media in ingresso: `channels.whatsapp.mediaMaxMb` (predefinito `50`)
    - limite di invio dei media in uscita: `channels.whatsapp.mediaMaxMb` (predefinito `50`)
    - gli override per account usano `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - le immagini vengono ottimizzate automaticamente (ridimensionamento/scansione qualità) per rientrare nei limiti, a meno che `forceDocument` / `asDocument` richieda la consegna come documento
    - in caso di errore nell'invio dei media, il fallback del primo elemento invia un avviso testuale invece di eliminare silenziosamente la risposta

  </Accordion>
</AccordionGroup>

## Citazione nelle risposte

WhatsApp supporta la citazione nativa nelle risposte, in cui le risposte in uscita citano visibilmente il messaggio in ingresso. Controllala con `channels.whatsapp.replyToMode`.

| Valore      | Comportamento                                                        |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Non citare mai; invia come messaggio semplice                         |
| `"first"`   | Cita solo il primo blocco di risposta in uscita                       |
| `"all"`     | Cita ogni blocco di risposta in uscita                                |
| `"batched"` | Cita le risposte in batch in coda lasciando non citate le risposte immediate |

Il valore predefinito è `"off"`. Gli override per account usano `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## Livello di reazione

`channels.whatsapp.reactionLevel` controlla quanto ampiamente l'agente usa reazioni emoji su WhatsApp:

| Livello       | Reazioni di ack | Reazioni avviate dall'agente | Descrizione                                      |
| ------------- | --------------- | ---------------------------- | ------------------------------------------------ |
| `"off"`       | No              | No                           | Nessuna reazione                                 |
| `"ack"`       | Sì              | No                           | Solo reazioni di ack (conferma prima della risposta) |
| `"minimal"`   | Sì              | Sì (conservativo)            | Ack + reazioni dell'agente con guida conservativa |
| `"extensive"` | Sì              | Sì (incoraggiato)            | Ack + reazioni dell'agente con guida incoraggiata |

Predefinito: `"minimal"`.

Gli override per account usano `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Reazioni di riconoscimento

WhatsApp supporta reazioni di ack immediate alla ricezione in ingresso tramite `channels.whatsapp.ackReaction`.
Le reazioni di ack sono vincolate da `reactionLevel`: vengono soppresse quando `reactionLevel` è `"off"`.

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

Note sul comportamento:

- inviata immediatamente dopo l'accettazione del messaggio in ingresso (prima della risposta)
- se `ackReaction` è presente senza `emoji`, WhatsApp usa l'emoji identità dell'agente instradato, ripiegando su "👀"; ometti `ackReaction` o imposta `emoji: ""` per non inviare alcuna reazione di conferma
- gli errori vengono registrati nei log ma non bloccano la normale consegna della risposta
- la modalità gruppo `mentions` reagisce nei turni attivati da menzione; l'attivazione gruppo `always` agisce come bypass per questo controllo
- WhatsApp usa `channels.whatsapp.ackReaction` (il legacy `messages.ackReaction` non viene usato qui)

## Reazioni di stato del ciclo di vita

Imposta `messages.statusReactions.enabled: true` per consentire a WhatsApp di sostituire la reazione di conferma durante un turno invece di lasciare un'emoji di ricevuta statica. Quando è abilitato, OpenClaw usa lo stesso slot di reazione del messaggio in ingresso per gli stati del ciclo di vita come in coda, ragionamento, attività degli strumenti, Compaction, completato ed errore.

```json5
{
  messages: {
    statusReactions: {
      enabled: true,
      emojis: {
        deploy: "🛫",
        build: "🏗️",
        concierge: "💁",
      },
    },
  },
}
```

Note sul comportamento:

- `channels.whatsapp.ackReaction` controlla comunque se le reazioni di stato sono idonee per messaggi diretti e gruppi.
- La reazione di stato in coda usa la stessa emoji di conferma effettiva delle reazioni di conferma semplici.
- WhatsApp ha uno slot di reazione bot per messaggio, quindi gli aggiornamenti del ciclo di vita sostituiscono sul posto la reazione corrente.
- `messages.removeAckAfterReply: true` cancella la reazione di stato finale dopo il mantenimento completato/errore configurato.
- Le categorie di emoji degli strumenti includono `tool`, `coding`, `web`, `deploy`, `build` e `concierge`.

## Multi-account e credenziali

<AccordionGroup>
  <Accordion title="Selezione dell'account e valori predefiniti">
    - gli ID account provengono da `channels.whatsapp.accounts`
    - selezione dell'account predefinito: `default` se presente, altrimenti il primo ID account configurato (ordinato)
    - gli ID account vengono normalizzati internamente per la ricerca

  </Accordion>

  <Accordion title="Percorsi delle credenziali e compatibilità legacy">
    - percorso di autenticazione corrente: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - file di backup: `creds.json.bak`
    - l'autenticazione predefinita legacy in `~/.openclaw/credentials/` è ancora riconosciuta/migrata per i flussi dell'account predefinito

  </Accordion>

  <Accordion title="Comportamento del logout">
    `openclaw channels logout --channel whatsapp [--account <id>]` cancella lo stato di autenticazione WhatsApp per quell'account.

    Quando un Gateway è raggiungibile, il logout arresta prima il listener WhatsApp attivo per l'account selezionato, in modo che la sessione collegata non continui a ricevere messaggi fino al riavvio successivo. Anche `openclaw channels remove --channel whatsapp` arresta il listener attivo prima di disabilitare o eliminare la configurazione dell'account.

    Nelle directory di autenticazione legacy, `oauth.json` viene preservato mentre i file di autenticazione Baileys vengono rimossi.

  </Accordion>
</AccordionGroup>

## Strumenti, azioni e scritture della configurazione

- Il supporto strumenti dell'agente include l'azione di reazione WhatsApp (`react`).
- Gate delle azioni:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Le scritture della configurazione avviate dal canale sono abilitate per impostazione predefinita (disabilitale tramite `channels.whatsapp.configWrites=false`).

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Non collegato (QR richiesto)">
    Sintomo: lo stato del canale segnala non collegato.

    Correzione:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Collegato ma disconnesso / ciclo di riconnessione">
    Sintomo: account collegato con disconnessioni ripetute o tentativi di riconnessione.

    Gli account silenziosi possono rimanere connessi oltre il normale timeout dei messaggi; il watchdog
    si riavvia quando l'attività del trasporto WhatsApp Web si interrompe, il socket si chiude oppure
    l'attività a livello applicazione rimane silenziosa oltre la finestra di sicurezza più lunga.

    Se i log mostrano ripetutamente `status=408 Request Time-out Connection was lost`, regola
    i tempi del socket Baileys sotto `web.whatsapp`. Inizia accorciando
    `keepAliveIntervalMs` sotto il timeout di inattività della tua rete e aumentando
    `connectTimeoutMs` su collegamenti lenti o con perdite:

    ```json5
    {
      web: {
        whatsapp: {
          keepAliveIntervalMs: 15000,
          connectTimeoutMs: 60000,
          defaultQueryTimeoutMs: 60000,
        },
      },
    }
    ```

    Correzione:

    ```bash
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    Se il ciclo persiste dopo aver corretto connettività dell'host e tempi, esegui il backup
    della directory di autenticazione dell'account e ricollega quell'account:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Se `~/.openclaw/logs/whatsapp-health.log` indica `Gateway inactive` ma
    `openclaw gateway status` e `openclaw channels status --probe` mostrano che il
    Gateway e WhatsApp sono integri, esegui `openclaw doctor`. Su Linux, doctor
    avvisa della presenza di voci crontab legacy che invocano ancora
    `~/.openclaw/bin/ensure-whatsapp.sh`; rimuovi quelle voci obsolete con
    `crontab -e` perché Cron può non avere l'ambiente user-bus di systemd e
    far sì che quel vecchio script segnali erroneamente lo stato del Gateway.

    Se necessario, ricollega con `channels login`.

  </Accordion>

  <Accordion title="Il login QR scade dietro un proxy">
    Sintomo: `openclaw channels login --channel whatsapp` non riesce prima di mostrare un codice QR utilizzabile con `status=408 Request Time-out` o una disconnessione del socket TLS.

    Il login WhatsApp Web usa l'ambiente proxy standard dell'host Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, varianti minuscole e `NO_PROXY`). Verifica che il processo Gateway erediti l'ambiente proxy e che `NO_PROXY` non corrisponda a `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Nessun listener attivo durante l'invio">
    Gli invii in uscita falliscono rapidamente quando non esiste alcun listener Gateway attivo per l'account di destinazione.

    Assicurati che il Gateway sia in esecuzione e che l'account sia collegato.

  </Accordion>

  <Accordion title="La risposta appare nella trascrizione ma non in WhatsApp">
    Le righe della trascrizione registrano ciò che l'agente ha generato. La consegna WhatsApp viene controllata separatamente: OpenClaw considera inviata una risposta automatica solo dopo che Baileys restituisce un ID messaggio in uscita per almeno un invio visibile di testo o contenuti multimediali.

    Le reazioni di conferma sono ricevute indipendenti prima della risposta. Una reazione riuscita non prova che la successiva risposta testuale o multimediale sia stata accettata da WhatsApp.

    Controlla i log del Gateway per `auto-reply delivery failed` o `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Messaggi di gruppo ignorati inaspettatamente">
    Controlla in questo ordine:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - voci allowlist `groups`
    - gate delle menzioni (`requireMention` + pattern di menzione)
    - chiavi duplicate in `openclaw.json` (JSON5): le voci successive sovrascrivono quelle precedenti, quindi mantieni un solo `groupPolicy` per ambito

    Se `channels.whatsapp.groups` è presente, WhatsApp può comunque osservare messaggi da altri gruppi, ma OpenClaw li scarta prima dell'instradamento della sessione. Aggiungi il JID del gruppo a `channels.whatsapp.groups` oppure aggiungi `groups["*"]` per ammettere tutti i gruppi mantenendo l'autorizzazione del mittente sotto `groupPolicy` e `groupAllowFrom`.

  </Accordion>

  <Accordion title="Avviso runtime Bun">
    Il runtime del Gateway WhatsApp dovrebbe usare Node. Bun è segnalato come incompatibile per il funzionamento stabile del Gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompt di sistema

WhatsApp supporta prompt di sistema in stile Telegram per gruppi e chat dirette tramite le mappe `groups` e `direct`.

Gerarchia di risoluzione per i messaggi di gruppo:

La mappa `groups` effettiva viene determinata per prima: se l'account definisce i propri `groups`, sostituisce completamente la mappa `groups` root (nessun deep merge). La ricerca del prompt viene quindi eseguita sulla singola mappa risultante:

1. **Prompt di sistema specifico del gruppo** (`groups["<groupId>"].systemPrompt`): usato quando la voce del gruppo specifico esiste nella mappa **e** la sua chiave `systemPrompt` è definita. Se `systemPrompt` è una stringa vuota (`""`), il wildcard viene soppresso e non viene applicato alcun prompt di sistema.
2. **Prompt di sistema wildcard del gruppo** (`groups["*"].systemPrompt`): usato quando la voce del gruppo specifico è del tutto assente dalla mappa, oppure quando esiste ma non definisce alcuna chiave `systemPrompt`.

Gerarchia di risoluzione per i messaggi diretti:

La mappa `direct` effettiva viene determinata per prima: se l'account definisce la propria `direct`, sostituisce completamente la mappa `direct` root (nessun deep merge). La ricerca del prompt viene quindi eseguita sulla singola mappa risultante:

1. **Prompt di sistema specifico del diretto** (`direct["<peerId>"].systemPrompt`): usato quando la voce del peer specifico esiste nella mappa **e** la sua chiave `systemPrompt` è definita. Se `systemPrompt` è una stringa vuota (`""`), il wildcard viene soppresso e non viene applicato alcun prompt di sistema.
2. **Prompt di sistema wildcard del diretto** (`direct["*"].systemPrompt`): usato quando la voce del peer specifico è del tutto assente dalla mappa, oppure quando esiste ma non definisce alcuna chiave `systemPrompt`.

<Note>
`dms` rimane il bucket leggero di override della cronologia per singolo DM (`dms.<id>.historyLimit`). Gli override dei prompt si trovano sotto `direct`.
</Note>

**Differenza rispetto al comportamento multi-account di Telegram:** In Telegram, la root `groups` viene intenzionalmente soppressa per tutti gli account in una configurazione multi-account, anche per gli account che non definiscono propri `groups`, per impedire a un bot di ricevere messaggi di gruppo per gruppi a cui non appartiene. WhatsApp non applica questa protezione: root `groups` e root `direct` vengono sempre ereditati dagli account che non definiscono override a livello account, indipendentemente dal numero di account configurati. In una configurazione WhatsApp multi-account, se vuoi prompt di gruppo o diretti per account, definisci esplicitamente la mappa completa sotto ogni account invece di affidarti ai valori predefiniti a livello root.

Comportamento importante:

- `channels.whatsapp.groups` è sia una mappa di configurazione per gruppo sia l'allowlist dei gruppi a livello chat. Sia nell'ambito root sia nell'ambito account, `groups["*"]` significa "tutti i gruppi sono ammessi" per quell'ambito.
- Aggiungi un `systemPrompt` di gruppo wildcard solo quando vuoi già che quell'ambito ammetta tutti i gruppi. Se vuoi ancora che sia idoneo solo un insieme fisso di ID gruppo, non usare `groups["*"]` per il prompt predefinito. Ripeti invece il prompt su ogni voce di gruppo esplicitamente allowlistata.
- L'ammissione al gruppo e l'autorizzazione del mittente sono controlli separati. `groups["*"]` amplia l'insieme di gruppi che può raggiungere la gestione dei gruppi, ma da solo non autorizza ogni mittente in quei gruppi. L'accesso dei mittenti è comunque controllato separatamente da `channels.whatsapp.groupPolicy` e `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` non ha lo stesso effetto collaterale per i DM. `direct["*"]` fornisce solo una configurazione predefinita per chat dirette dopo che un DM è già stato ammesso da `dmPolicy` più `allowFrom` o dalle regole del pairing-store.

Esempio:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Usa solo se tutti i gruppi devono essere ammessi nell'ambito radice.
        // Si applica a tutti gli account che non definiscono la propria mappa dei gruppi.
        "*": { systemPrompt: "Prompt predefinito per tutti i gruppi." },
      },
      direct: {
        // Si applica a tutti gli account che non definiscono la propria mappa diretta.
        "*": { systemPrompt: "Prompt predefinito per tutte le chat dirette." },
      },
      accounts: {
        work: {
          groups: {
            // Questo account definisce i propri gruppi, quindi i gruppi radice vengono
            // sostituiti completamente. Per mantenere un carattere jolly, definisci esplicitamente "*" anche qui.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Concentrati sulla gestione del progetto.",
            },
            // Usa solo se tutti i gruppi devono essere ammessi in questo account.
            "*": { systemPrompt: "Prompt predefinito per i gruppi di lavoro." },
          },
          direct: {
            // Questo account definisce la propria mappa diretta, quindi le voci dirette radice
            // vengono sostituite completamente. Per mantenere un carattere jolly, definisci esplicitamente "*" anche qui.
            "+15551234567": { systemPrompt: "Prompt per una chat diretta di lavoro specifica." },
            "*": { systemPrompt: "Prompt predefinito per le chat dirette di lavoro." },
          },
        },
      },
    },
  },
}
```

## Puntatori al riferimento di configurazione

Riferimento principale:

- [Riferimento di configurazione - WhatsApp](/it/gateway/config-channels#whatsapp)

Campi WhatsApp ad alto valore informativo:

- accesso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- consegna: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- multi-account: `accounts.<id>.enabled`, `accounts.<id>.authDir`, override a livello di account
- operazioni: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- comportamento della sessione: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompt: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Correlati

- [Abbinamento](/it/channels/pairing)
- [Gruppi](/it/channels/groups)
- [Sicurezza](/it/gateway/security)
- [Instradamento dei canali](/it/channels/channel-routing)
- [Instradamento multi-agente](/it/concepts/multi-agent)
- [Risoluzione dei problemi](/it/channels/troubleshooting)
