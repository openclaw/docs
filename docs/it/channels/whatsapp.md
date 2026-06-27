---
read_when:
    - Lavorare sul comportamento del canale WhatsApp/web o sull'instradamento della posta in arrivo
summary: Supporto al canale WhatsApp, controlli di accesso, comportamento di consegna e operazioni
title: WhatsApp
x-i18n:
    generated_at: "2026-06-27T17:14:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88f81adc38bd64d1e35f382dfc209e690c059d52e522e5cbdf77d1da45c9d15f
    source_path: channels/whatsapp.md
    workflow: 16
---

Stato: pronto per la produzione tramite WhatsApp Web (Baileys). Il Gateway gestisce le sessioni collegate.

## Installazione (su richiesta)

- L'onboarding (`openclaw onboard`) e `openclaw channels add --channel whatsapp`
  chiedono di installare il Plugin WhatsApp la prima volta che lo selezioni.
- Anche `openclaw channels login --channel whatsapp` offre il flusso di installazione quando
  il Plugin non è ancora presente.
- Canale dev + checkout git: usa per impostazione predefinita il percorso del Plugin locale.
- Stable/Beta: installa prima il Plugin ufficiale `@openclaw/whatsapp` da ClawHub,
  con npm come fallback.
- Il runtime di WhatsApp è distribuito al di fuori del pacchetto npm core di OpenClaw, così
  le dipendenze di runtime specifiche di WhatsApp restano con il Plugin esterno.

L'installazione manuale resta disponibile:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Usa il pacchetto npm semplice (`@openclaw/whatsapp`) solo quando ti serve il fallback
del registry. Fissa una versione esatta solo quando ti serve un'installazione riproducibile.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/it/channels/pairing">
    La policy DM predefinita è il pairing per i mittenti sconosciuti.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica cross-channel e playbook di riparazione.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/it/gateway/configuration">
    Pattern ed esempi completi di configurazione dei canali.
  </Card>
</CardGroup>

## Configurazione rapida

<Steps>
  <Step title="Configure WhatsApp access policy">

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

  <Step title="Link WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Il login attuale è basato su QR. In ambienti remoti o headless, assicurati di
    avere un percorso affidabile per consegnare il codice QR live al telefono che lo scannerizzerà
    prima di avviare il login.

    Per un account specifico:

```bash
openclaw channels login --channel whatsapp --account work
```

    Per collegare una directory auth WhatsApp Web esistente/personalizzata prima del login:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Start the gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Approve first pairing request (if using pairing mode)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Le richieste di pairing scadono dopo 1 ora. Le richieste in sospeso sono limitate a 3 per canale.

  </Step>
</Steps>

<Note>
OpenClaw consiglia di eseguire WhatsApp su un numero separato quando possibile. (I metadati del canale e il flusso di configurazione sono ottimizzati per questa configurazione, ma sono supportate anche configurazioni con numero personale.)
</Note>

<Warning>
Il flusso di configurazione WhatsApp attuale è solo QR. I QR renderizzati nel terminale, gli screenshot,
i PDF o gli allegati chat possono scadere o diventare illeggibili durante l'inoltro
da una macchina remota. Per host remoti/headless, preferisci un percorso di consegna diretto dell'immagine QR
rispetto alla cattura manuale dal terminale.
</Warning>

## Pattern di distribuzione

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    Questa è la modalità operativa più pulita:

    - identità WhatsApp separata per OpenClaw
    - allowlist DM e confini di routing più chiari
    - minore probabilità di confusione con chat a sé stessi

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

  <Accordion title="Personal-number fallback">
    L'onboarding supporta la modalità con numero personale e scrive una baseline adatta alle chat con sé stessi:

    - `dmPolicy: "allowlist"`
    - `allowFrom` include il tuo numero personale
    - `selfChatMode: true`

    Nel runtime, le protezioni per le chat con sé stessi si basano sul numero personale collegato e su `allowFrom`.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    Il canale della piattaforma di messaggistica è basato su WhatsApp Web (`Baileys`) nell'architettura attuale dei canali OpenClaw.

    Non esiste un canale di messaggistica Twilio WhatsApp separato nel registry dei canali chat integrato.

  </Accordion>
</AccordionGroup>

## Modello di runtime

- Il Gateway gestisce il socket WhatsApp e il ciclo di riconnessione.
- Il watchdog di riconnessione usa l'attività del trasporto WhatsApp Web, non solo il volume dei messaggi app in ingresso, quindi una sessione di dispositivo collegato silenziosa non viene riavviata solo perché nessuno ha inviato un messaggio di recente. Un limite più lungo di silenzio applicativo forza comunque una riconnessione se i frame di trasporto continuano ad arrivare ma non vengono gestiti messaggi applicativi per la finestra del watchdog; dopo una riconnessione transitoria per una sessione attiva di recente, quel controllo di silenzio applicativo usa il normale timeout dei messaggi per la prima finestra di ripristino.
- I timing del socket Baileys sono espliciti sotto `web.whatsapp.*`: `keepAliveIntervalMs` controlla i ping applicativi WhatsApp Web, `connectTimeoutMs` controlla il timeout dell'handshake di apertura, e `defaultQueryTimeoutMs` controlla le attese delle query Baileys più i limiti delle operazioni locali OpenClaw di invio/presenza in uscita e conferma di lettura in ingresso.
- Gli invii in uscita richiedono un listener WhatsApp attivo per l'account di destinazione.
- Gli invii ai gruppi allegano metadati nativi di menzione per i token `@+<digits>` e `@<digits>` nel testo e nelle didascalie dei media quando il token corrisponde ai metadati attuali dei partecipanti WhatsApp, inclusi i gruppi basati su LID.
- Le chat di stato e broadcast vengono ignorate (`@status`, `@broadcast`).
- Il watchdog di riconnessione segue l'attività del trasporto WhatsApp Web, non solo il volume dei messaggi app in ingresso: le sessioni silenziose di dispositivi collegati restano attive mentre i frame di trasporto continuano, ma uno stallo del trasporto forza una riconnessione ben prima del percorso successivo di disconnessione remota.
- Le chat dirette usano le regole di sessione DM (`session.dmScope`; il valore predefinito `main` consolida i DM nella sessione principale dell'agente).
- Le sessioni di gruppo sono isolate (`agent:<agentId>:whatsapp:group:<jid>`).
- I Canali/Newsletter WhatsApp possono essere target espliciti in uscita con il loro JID nativo `@newsletter`. Gli invii newsletter in uscita usano i metadati di sessione del canale (`agent:<agentId>:whatsapp:channel:<jid>`) invece della semantica di sessione DM.
- Il trasporto WhatsApp Web rispetta le variabili d'ambiente proxy standard sull'host del Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / varianti minuscole). Preferisci la configurazione proxy a livello host rispetto alle impostazioni proxy WhatsApp specifiche del canale.
- Quando `messages.removeAckAfterReply` è abilitato, OpenClaw cancella la reazione di ack WhatsApp dopo che una risposta visibile è stata consegnata.

## Prompt di approvazione

WhatsApp può renderizzare prompt di approvazione exec e Plugin con reazioni `👍` / `👎`. La consegna è
controllata dalla configurazione di forwarding delle approvazioni di primo livello:

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
e instradata verso WhatsApp. La modalità sessione consegna approvazioni emoji native solo per approvazioni che
hanno origine da WhatsApp. La modalità target usa la pipeline di forwarding condivisa per target WhatsApp
espliciti e non crea fanout DM separati verso gli approvatori.

Le reazioni di approvazione WhatsApp richiedono approvatori WhatsApp espliciti da `allowFrom` o `"*"`.
`defaultTo` controlla i normali target di messaggio predefiniti; non è un approvatore per le approvazioni. I comandi manuali
`/approve` passano comunque attraverso il normale percorso di autorizzazione del mittente WhatsApp prima
della risoluzione dell'approvazione.

## Hook dei Plugin e privacy

I messaggi in ingresso WhatsApp possono contenere contenuto personale dei messaggi, numeri di telefono,
identificatori di gruppo, nomi dei mittenti e campi di correlazione della sessione. Per questo motivo,
WhatsApp non trasmette payload hook `message_received` in ingresso ai Plugin
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

Abilitalo solo per Plugin che consideri affidabili per ricevere contenuti e identificatori
dei messaggi WhatsApp in ingresso.

## Controllo degli accessi e attivazione

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` controlla l'accesso alle chat dirette:

    - `pairing` (predefinito)
    - `allowlist`
    - `open` (richiede che `allowFrom` includa `"*"`)
    - `disabled`

    `allowFrom` accetta numeri in stile E.164 (normalizzati internamente).

    `allowFrom` è una lista di controllo accessi per mittenti DM. Non limita gli invii espliciti in uscita verso JID di gruppi WhatsApp o JID di canali `@newsletter`.

    Override multi-account: `channels.whatsapp.accounts.<id>.dmPolicy` (e `allowFrom`) hanno precedenza sui valori predefiniti a livello di canale per quell'account.

    Dettagli del comportamento runtime:

    - i pairing vengono persistiti nello store allow del canale e uniti con `allowFrom` configurato
    - l'automazione pianificata e il fallback dei destinatari Heartbeat usano target di consegna espliciti o `allowFrom` configurato; le approvazioni di pairing DM non sono destinatari Cron o Heartbeat impliciti
    - se non è configurata alcuna allowlist, il numero personale collegato è consentito per impostazione predefinita
    - OpenClaw non esegue mai auto-pairing dei DM in uscita `fromMe` (messaggi che invii a te stesso dal dispositivo collegato)

  </Tab>

  <Tab title="Group policy + allowlists">
    L'accesso ai gruppi ha due livelli:

    1. **Allowlist di appartenenza al gruppo** (`channels.whatsapp.groups`)
       - se `groups` è omesso, tutti i gruppi sono idonei
       - se `groups` è presente, agisce come allowlist di gruppi (`"*"` consentito)

    2. **Policy del mittente di gruppo** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist mittenti bypassata
       - `allowlist`: il mittente deve corrispondere a `groupAllowFrom` (o `*`)
       - `disabled`: blocca tutto l'ingresso dai gruppi

    Fallback dell'allowlist mittenti:

    - se `groupAllowFrom` non è impostato, il runtime ripiega su `allowFrom` quando disponibile
    - le allowlist mittenti vengono valutate prima dell'attivazione tramite menzione/risposta

    Nota: se non esiste alcun blocco `channels.whatsapp`, il fallback runtime della policy di gruppo è `allowlist` (con un log di avviso), anche se `channels.defaults.groupPolicy` è impostato.

  </Tab>

  <Tab title="Mentions + /activation">
    Le risposte nei gruppi richiedono una menzione per impostazione predefinita.

    Il rilevamento delle menzioni include:

    - menzioni WhatsApp esplicite dell'identità del bot
    - pattern regex di menzione configurati (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - trascrizioni di note vocali in ingresso per messaggi di gruppo autorizzati
    - rilevamento implicito di risposta al bot (il mittente della risposta corrisponde all'identità del bot)

    Nota di sicurezza:

    - citazione/risposta soddisfa solo il gating di menzione; **non** concede l'autorizzazione del mittente
    - con `groupPolicy: "allowlist"`, i mittenti non in allowlist sono comunque bloccati anche se rispondono al messaggio di un utente in allowlist

    Comando di attivazione a livello di sessione:

    - `/activation mention`
    - `/activation always`

    `activation` aggiorna lo stato della sessione (non la configurazione globale). È controllato dal proprietario.

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
- I gruppi corrispondono ai JID dei gruppi WhatsApp come `120363424282127706@g.us`.
- Allowlist dei gruppi, criteri del mittente e gating tramite menzione o attivazione vengono eseguiti prima che OpenClaw assicuri l’esistenza della sessione ACP configurata.
- Un binding ACP configurato corrispondente possiede la route. I gruppi broadcast WhatsApp non inoltrano quel turno alle normali sessioni WhatsApp.

## Comportamento del numero personale e della chat con se stessi

Quando il numero personale collegato è presente anche in `allowFrom`, si attivano le protezioni WhatsApp per la chat con se stessi:

- salta le conferme di lettura per i turni di chat con se stessi
- ignora il comportamento di attivazione automatica tramite JID di menzione che altrimenti invierebbe un ping a te stesso
- se `messages.responsePrefix` non è impostato, le risposte nella chat con se stessi usano come valore predefinito `[{identity.name}]` o `[openclaw]`

## Normalizzazione dei messaggi e contesto

<AccordionGroup>
  <Accordion title="Envelope in ingresso + contesto della risposta">
    I messaggi WhatsApp in arrivo vengono racchiusi nell’envelope in ingresso condiviso.

    Se esiste una risposta citata, il contesto viene aggiunto in questa forma:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Anche i campi dei metadati della risposta vengono popolati quando disponibili (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 del mittente).
    Quando il target della risposta citata è un media scaricabile, OpenClaw lo salva tramite
    il normale archivio dei media in ingresso e lo espone come `MediaPath`/`MediaType` in modo che
    l’agente possa ispezionare l’immagine referenziata invece di vedere soltanto
    `<media:image>`.

  </Accordion>

  <Accordion title="Placeholder media ed estrazione di posizione/contatto">
    I messaggi in ingresso composti solo da media vengono normalizzati con placeholder come:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Le note vocali autorizzate nei gruppi vengono trascritte prima del gating delle menzioni quando il
    corpo è solo `<media:audio>`, quindi pronunciare la menzione del bot nella nota vocale può
    attivare la risposta. Se la trascrizione continua a non menzionare il bot, la
    trascrizione viene mantenuta nella cronologia del gruppo in sospeso invece del placeholder grezzo.

    I corpi di posizione usano testo conciso con coordinate. Etichette/commenti di posizione e dettagli di contatto/vCard vengono resi come metadati non attendibili delimitati, non come testo inline del prompt.

  </Accordion>

  <Accordion title="Iniezione della cronologia del gruppo in sospeso">
    Per i gruppi, i messaggi non elaborati possono essere messi in buffer e iniettati come contesto quando il bot viene finalmente attivato.

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

    Disabilitazione globale:

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
    - la modalità `newline` preferisce i confini dei paragrafi (righe vuote), poi ripiega sulla suddivisione in blocchi sicura per lunghezza

  </Accordion>

  <Accordion title="Comportamento dei media in uscita">
    - supporta payload di immagini, video, audio (nota vocale PTT) e documenti
    - i media audio vengono inviati tramite il payload `audio` di Baileys con `ptt: true`, quindi i client WhatsApp li rendono come note vocali push-to-talk
    - i payload di risposta preservano `audioAsVoice`; l’output TTS come nota vocale per WhatsApp resta su questo percorso PTT anche quando il provider restituisce MP3 o WebM
    - l’audio Ogg/Opus nativo viene inviato come `audio/ogg; codecs=opus` per compatibilità con le note vocali
    - l’audio non Ogg, incluso l’output MP3/WebM di Microsoft Edge TTS, viene transcodificato con `ffmpeg` in Ogg/Opus mono a 48 kHz prima della consegna PTT
    - `/tts latest` invia l’ultima risposta dell’assistente come una singola nota vocale e sopprime invii ripetuti per la stessa risposta; `/tts chat on|off|default` controlla l’auto-TTS per la chat WhatsApp corrente
    - la riproduzione di GIF animate è supportata tramite `gifPlayback: true` negli invii video
    - `forceDocument` / `asDocument` invia immagini, GIF e video in uscita tramite il payload documento di Baileys per evitare la compressione dei media di WhatsApp preservando al tempo stesso il nome file risolto e il tipo MIME
    - le didascalie vengono applicate al primo elemento media quando si inviano payload di risposta multi-media, tranne che le note vocali PTT inviano prima l’audio e il testo visibile separatamente perché i client WhatsApp non rendono in modo coerente le didascalie delle note vocali
    - la sorgente dei media può essere HTTP(S), `file://` o percorsi locali

  </Accordion>

  <Accordion title="Limiti di dimensione dei media e comportamento di fallback">
    - limite di salvataggio dei media in ingresso: `channels.whatsapp.mediaMaxMb` (predefinito `50`)
    - limite di invio dei media in uscita: `channels.whatsapp.mediaMaxMb` (predefinito `50`)
    - gli override per account usano `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - le immagini vengono ottimizzate automaticamente (ridimensionamento/sweep della qualità) per rientrare nei limiti, a meno che `forceDocument` / `asDocument` richieda la consegna come documento
    - in caso di errore nell’invio dei media, il fallback del primo elemento invia un avviso testuale invece di eliminare silenziosamente la risposta

  </Accordion>
</AccordionGroup>

## Citazione delle risposte

WhatsApp supporta la citazione nativa delle risposte, in cui le risposte in uscita citano visibilmente il messaggio in ingresso. Controllala con `channels.whatsapp.replyToMode`.

| Valore      | Comportamento                                                        |
| ----------- | -------------------------------------------------------------------- |
| `"off"`     | Non citare mai; invia come messaggio semplice                        |
| `"first"`   | Cita solo il primo blocco di risposta in uscita                      |
| `"all"`     | Cita ogni blocco di risposta in uscita                               |
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

`channels.whatsapp.reactionLevel` controlla quanto ampiamente l’agente usa le reazioni emoji su WhatsApp:

| Livello       | Reazioni ack | Reazioni avviate dall’agente | Descrizione                                      |
| ------------- | ------------ | ---------------------------- | ------------------------------------------------ |
| `"off"`       | No           | No                           | Nessuna reazione                                 |
| `"ack"`       | Sì           | No                           | Solo reazioni ack (conferma pre-risposta)        |
| `"minimal"`   | Sì           | Sì (conservativo)            | Ack + reazioni dell’agente con guida conservativa |
| `"extensive"` | Sì           | Sì (incoraggiato)            | Ack + reazioni dell’agente con guida incoraggiata |

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

## Reazioni di conferma

WhatsApp supporta reazioni ack immediate alla ricezione in ingresso tramite `channels.whatsapp.ackReaction`.
Le reazioni ack sono controllate da `reactionLevel`: vengono soppresse quando `reactionLevel` è `"off"`.

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

- inviata immediatamente dopo l’accettazione dell’ingresso (pre-risposta)
- se `ackReaction` è presente senza `emoji`, WhatsApp usa l’emoji dell’identità dell’agente instradato, con fallback a "👀"; ometti `ackReaction` o imposta `emoji: ""` per non inviare alcuna reazione ack
- gli errori vengono registrati ma non bloccano la normale consegna della risposta
- la modalità gruppo `mentions` reagisce sui turni attivati da menzione; l’attivazione gruppo `always` agisce come bypass per questo controllo
- WhatsApp usa `channels.whatsapp.ackReaction` (il legacy `messages.ackReaction` non viene usato qui)

## Reazioni di stato del ciclo di vita

Imposta `messages.statusReactions.enabled: true` per consentire a WhatsApp di sostituire la reazione ack durante un turno invece di lasciare un’emoji di conferma statica. Quando è abilitato, OpenClaw usa lo stesso slot di reazione del messaggio in ingresso per stati del ciclo di vita come in coda, ragionamento, attività degli strumenti, Compaction, completato ed errore.

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

- `channels.whatsapp.ackReaction` controlla ancora se le reazioni di stato sono idonee per messaggi diretti e gruppi.
- La reazione di stato in coda usa la stessa emoji ack effettiva delle semplici reazioni ack.
- WhatsApp ha uno slot di reazione del bot per messaggio, quindi gli aggiornamenti del ciclo di vita sostituiscono sul posto la reazione corrente.
- `messages.removeAckAfterReply: true` cancella la reazione di stato finale dopo il mantenimento configurato per completato/errore.
- Le categorie di emoji degli strumenti includono `tool`, `coding`, `web`, `deploy`, `build` e `concierge`.

## Account multipli e credenziali

<AccordionGroup>
  <Accordion title="Selezione dell’account e valori predefiniti">
    - gli ID account provengono da `channels.whatsapp.accounts`
    - selezione dell’account predefinito: `default` se presente, altrimenti il primo ID account configurato (ordinato)
    - gli ID account vengono normalizzati internamente per la ricerca

  </Accordion>

  <Accordion title="Percorsi delle credenziali e compatibilità legacy">
    - percorso auth corrente: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - file di backup: `creds.json.bak`
    - l’auth predefinito legacy in `~/.openclaw/credentials/` è ancora riconosciuto/migrato per i flussi dell’account predefinito

  </Accordion>

  <Accordion title="Comportamento di logout">
    `openclaw channels logout --channel whatsapp [--account <id>]` cancella lo stato auth WhatsApp per quell’account.

    Quando un Gateway è raggiungibile, il logout arresta prima il listener WhatsApp live per l’account selezionato, in modo che la sessione collegata non continui a ricevere messaggi fino al riavvio successivo. Anche `openclaw channels remove --channel whatsapp` arresta il listener live prima di disabilitare o eliminare la configurazione dell’account.

    Nelle directory auth legacy, `oauth.json` viene preservato mentre i file auth di Baileys vengono rimossi.

  </Accordion>
</AccordionGroup>

## Strumenti, azioni e scritture di configurazione

- Il supporto agli strumenti dell’agente include l’azione di reazione WhatsApp (`react`).
- Gate delle azioni:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Le scritture di configurazione avviate dal canale sono abilitate per impostazione predefinita (disabilita tramite `channels.whatsapp.configWrites=false`).

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

  <Accordion title="Collegato ma disconnesso / loop di riconnessione">
    Sintomo: account collegato con disconnessioni ripetute o tentativi di riconnessione.

    Gli account silenziosi possono restare connessi oltre il normale timeout dei messaggi; il watchdog
    si riavvia quando l’attività del trasporto WhatsApp Web si interrompe, il socket si chiude oppure
    l’attività a livello applicativo resta silenziosa oltre la finestra di sicurezza più lunga.

    Se i log mostrano ripetuti `status=408 Request Time-out Connection was lost`, regola
    i tempi del socket Baileys sotto `web.whatsapp`. Inizia accorciando
    `keepAliveIntervalMs` sotto il timeout di inattività della tua rete e aumentando
    `connectTimeoutMs` su collegamenti lenti o con perdita:

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

    Se il ciclo persiste dopo aver corretto connettività host e tempi, esegui il backup
    della directory auth dell'account e ricollega quell'account:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Se `~/.openclaw/logs/whatsapp-health.log` dice `Gateway inactive` ma
    `openclaw gateway status` e `openclaw channels status --probe` mostrano che
    il Gateway e WhatsApp sono integri, esegui `openclaw doctor`. Su Linux, doctor
    avvisa delle voci crontab legacy che invocano ancora
    `~/.openclaw/bin/ensure-whatsapp.sh`; rimuovi quelle voci obsolete con
    `crontab -e` perché cron può non avere l'ambiente user-bus di systemd e
    far sì che quel vecchio script segnali erroneamente lo stato del Gateway.

    Se necessario, ricollega con `channels login`.

  </Accordion>

  <Accordion title="Il login QR scade dietro un proxy">
    Sintomo: `openclaw channels login --channel whatsapp` fallisce prima di mostrare un codice QR utilizzabile con `status=408 Request Time-out` o una disconnessione del socket TLS.

    Il login WhatsApp Web usa l'ambiente proxy standard dell'host Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, varianti minuscole e `NO_PROXY`). Verifica che il processo Gateway erediti l'ambiente proxy e che `NO_PROXY` non corrisponda a `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Nessun listener attivo durante l'invio">
    Gli invii in uscita falliscono rapidamente quando non esiste alcun listener Gateway attivo per l'account di destinazione.

    Assicurati che il Gateway sia in esecuzione e che l'account sia collegato.

  </Accordion>

  <Accordion title="La risposta appare nella trascrizione ma non in WhatsApp">
    Le righe della trascrizione registrano ciò che l'agente ha generato. La consegna WhatsApp viene controllata separatamente: OpenClaw considera una risposta automatica inviata solo dopo che Baileys restituisce un id messaggio in uscita per almeno un invio di testo visibile o contenuto multimediale.

    Le reazioni di ack sono ricevute pre-risposta indipendenti. Una reazione riuscita non prova che la successiva risposta di testo o contenuto multimediale sia stata accettata da WhatsApp.

    Controlla nei log del Gateway `auto-reply delivery failed` o `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Messaggi di gruppo ignorati in modo imprevisto">
    Controlla in questo ordine:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - voci allowlist `groups`
    - gating delle menzioni (`requireMention` + pattern di menzione)
    - chiavi duplicate in `openclaw.json` (JSON5): le voci successive sovrascrivono quelle precedenti, quindi mantieni un solo `groupPolicy` per ambito

    Se `channels.whatsapp.groups` è presente, WhatsApp può comunque osservare messaggi da altri gruppi, ma OpenClaw li scarta prima del routing di sessione. Aggiungi il JID del gruppo a `channels.whatsapp.groups` oppure aggiungi `groups["*"]` per ammettere tutti i gruppi mantenendo l'autorizzazione del mittente sotto `groupPolicy` e `groupAllowFrom`.

  </Accordion>

  <Accordion title="Avviso runtime Bun">
    Il runtime Gateway WhatsApp dovrebbe usare Node. Bun è segnalato come incompatibile per il funzionamento stabile del Gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompt di sistema

WhatsApp supporta prompt di sistema in stile Telegram per gruppi e chat dirette tramite le mappe `groups` e `direct`.

Gerarchia di risoluzione per i messaggi di gruppo:

La mappa `groups` effettiva viene determinata per prima: se l'account definisce i propri `groups`, sostituisce completamente la mappa `groups` radice (nessun deep merge). La ricerca del prompt viene quindi eseguita sulla singola mappa risultante:

1. **Prompt di sistema specifico del gruppo** (`groups["<groupId>"].systemPrompt`): usato quando la voce del gruppo specifico esiste nella mappa **e** la sua chiave `systemPrompt` è definita. Se `systemPrompt` è una stringa vuota (`""`), il wildcard viene soppresso e non viene applicato alcun prompt di sistema.
2. **Prompt di sistema wildcard del gruppo** (`groups["*"].systemPrompt`): usato quando la voce del gruppo specifico è completamente assente dalla mappa, oppure quando esiste ma non definisce alcuna chiave `systemPrompt`.

Gerarchia di risoluzione per i messaggi diretti:

La mappa `direct` effettiva viene determinata per prima: se l'account definisce il proprio `direct`, sostituisce completamente la mappa `direct` radice (nessun deep merge). La ricerca del prompt viene quindi eseguita sulla singola mappa risultante:

1. **Prompt di sistema specifico del direct** (`direct["<peerId>"].systemPrompt`): usato quando la voce del peer specifico esiste nella mappa **e** la sua chiave `systemPrompt` è definita. Se `systemPrompt` è una stringa vuota (`""`), il wildcard viene soppresso e non viene applicato alcun prompt di sistema.
2. **Prompt di sistema wildcard del direct** (`direct["*"].systemPrompt`): usato quando la voce del peer specifico è completamente assente dalla mappa, oppure quando esiste ma non definisce alcuna chiave `systemPrompt`.

<Note>
`dms` rimane il bucket leggero di override della cronologia per-DM (`dms.<id>.historyLimit`). Gli override dei prompt vivono sotto `direct`.
</Note>

**Differenza dal comportamento multi-account di Telegram:** In Telegram, `groups` radice viene intenzionalmente soppresso per tutti gli account in una configurazione multi-account, anche per gli account che non definiscono propri `groups`, per impedire a un bot di ricevere messaggi di gruppo per gruppi a cui non appartiene. WhatsApp non applica questa protezione: `groups` radice e `direct` radice vengono sempre ereditati dagli account che non definiscono override a livello account, indipendentemente da quanti account siano configurati. In una configurazione WhatsApp multi-account, se vuoi prompt di gruppo o direct per-account, definisci esplicitamente la mappa completa sotto ciascun account invece di affidarti ai predefiniti a livello radice.

Comportamento importante:

- `channels.whatsapp.groups` è sia una mappa di configurazione per-gruppo sia la allowlist dei gruppi a livello chat. All'ambito radice o account, `groups["*"]` significa "tutti i gruppi sono ammessi" per quell'ambito.
- Aggiungi un `systemPrompt` di gruppo wildcard solo quando vuoi già che quell'ambito ammetta tutti i gruppi. Se vuoi ancora che solo un insieme fisso di ID gruppo sia idoneo, non usare `groups["*"]` per il prompt predefinito. Invece, ripeti il prompt su ogni voce di gruppo esplicitamente in allowlist.
- L'ammissione del gruppo e l'autorizzazione del mittente sono controlli separati. `groups["*"]` amplia l'insieme di gruppi che può raggiungere la gestione dei gruppi, ma da solo non autorizza ogni mittente in quei gruppi. L'accesso del mittente è ancora controllato separatamente da `channels.whatsapp.groupPolicy` e `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` non ha lo stesso effetto collaterale per i DM. `direct["*"]` fornisce solo una configurazione direct-chat predefinita dopo che un DM è già stato ammesso da `dmPolicy` più `allowFrom` o dalle regole del pairing store.

Esempio:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Use only if all groups should be admitted at the root scope.
        // Applies to all accounts that do not define their own groups map.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // Applies to all accounts that do not define their own direct map.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // This account defines its own groups, so root groups are fully
            // replaced. To keep a wildcard, define "*" explicitly here too.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // Use only if all groups should be admitted in this account.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // This account defines its own direct map, so root direct entries are
            // fully replaced. To keep a wildcard, define "*" explicitly here too.
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
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

Campi WhatsApp ad alto segnale:

- accesso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- consegna: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- multi-account: `accounts.<id>.enabled`, `accounts.<id>.authDir`, override a livello account
- operazioni: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- comportamento di sessione: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompt: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Correlati

- [Pairing](/it/channels/pairing)
- [Gruppi](/it/channels/groups)
- [Sicurezza](/it/gateway/security)
- [Routing dei canali](/it/channels/channel-routing)
- [Routing multi-agente](/it/concepts/multi-agent)
- [Risoluzione dei problemi](/it/channels/troubleshooting)
