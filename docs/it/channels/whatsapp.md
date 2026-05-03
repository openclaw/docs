---
read_when:
    - Lavorare sul comportamento del canale WhatsApp/web o sull'instradamento della posta in arrivo
summary: Supporto del canale WhatsApp, controlli di accesso, comportamento di recapito e operazioni
title: WhatsApp
x-i18n:
    generated_at: "2026-05-03T21:27:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2f12709fc8ecb45e1b060647daf9a4624485d52b7b6436c3d07f171e6807babf
    source_path: channels/whatsapp.md
    workflow: 16
---

Stato: pronto per la produzione tramite WhatsApp Web (Baileys). Il Gateway gestisce le sessioni collegate.

## Installazione (su richiesta)

- L'onboarding (`openclaw onboard`) e `openclaw channels add --channel whatsapp`
  propongono di installare il Plugin WhatsApp la prima volta che lo selezioni.
- Anche `openclaw channels login --channel whatsapp` offre il flusso di installazione quando
  il Plugin non è ancora presente.
- Canale dev + checkout git: usa per impostazione predefinita il percorso locale del Plugin.
- Stable/Beta: usa il pacchetto npm `@openclaw/whatsapp` sul tag di release ufficiale
  corrente.

L'installazione manuale resta disponibile:

```bash
openclaw plugins install @openclaw/whatsapp
```

Usa il pacchetto senza versione per seguire il tag di release ufficiale corrente. Blocca una
versione esatta solo quando ti serve un'installazione riproducibile.

<CardGroup cols={3}>
  <Card title="Associazione" icon="link" href="/it/channels/pairing">
    Il criterio DM predefinito è l'associazione per i mittenti sconosciuti.
  </Card>
  <Card title="Risoluzione dei problemi dei canali" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica multicanale e playbook di riparazione.
  </Card>
  <Card title="Configurazione del Gateway" icon="settings" href="/it/gateway/configuration">
    Pattern ed esempi completi di configurazione dei canali.
  </Card>
</CardGroup>

## Configurazione rapida

<Steps>
  <Step title="Configura il criterio di accesso di WhatsApp">

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

    Per un account specifico:

```bash
openclaw channels login --channel whatsapp --account work
```

    Per collegare una directory di autenticazione WhatsApp Web esistente/personalizzata prima del login:

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

  <Step title="Approva la prima richiesta di associazione (se usi la modalità di associazione)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Le richieste di associazione scadono dopo 1 ora. Le richieste in sospeso sono limitate a 3 per canale.

  </Step>
</Steps>

<Note>
OpenClaw consiglia di eseguire WhatsApp su un numero separato quando possibile. (I metadati del canale e il flusso di configurazione sono ottimizzati per questa configurazione, ma sono supportate anche configurazioni con numero personale.)
</Note>

## Pattern di distribuzione

<AccordionGroup>
  <Accordion title="Numero dedicato (consigliato)">
    Questa è la modalità operativa più pulita:

    - identità WhatsApp separata per OpenClaw
    - allowlist DM e confini di instradamento più chiari
    - minore probabilità di confusione con chat con se stessi

    Pattern di criterio minimo:

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
    L'onboarding supporta la modalità con numero personale e scrive una baseline adatta alle chat con se stessi:

    - `dmPolicy: "allowlist"`
    - `allowFrom` include il tuo numero personale
    - `selfChatMode: true`

    In runtime, le protezioni per le chat con se stessi si basano sul numero proprio collegato e su `allowFrom`.

  </Accordion>

  <Accordion title="Ambito del canale solo WhatsApp Web">
    Il canale della piattaforma di messaggistica è basato su WhatsApp Web (`Baileys`) nell'architettura dei canali OpenClaw corrente.

    Non esiste un canale di messaggistica WhatsApp Twilio separato nel registro integrato dei canali chat.

  </Accordion>
</AccordionGroup>

## Modello runtime

- Il Gateway gestisce il socket WhatsApp e il ciclo di riconnessione.
- Il watchdog di riconnessione usa l'attività del trasporto WhatsApp Web, non solo il volume dei messaggi app in ingresso, quindi una sessione silenziosa di dispositivo collegato non viene riavviata solo perché nessuno ha inviato un messaggio di recente. Un limite più lungo di silenzio applicativo forza comunque una riconnessione se i frame di trasporto continuano ad arrivare ma non vengono gestiti messaggi applicativi durante la finestra del watchdog; dopo una riconnessione transitoria per una sessione attiva di recente, quel controllo del silenzio applicativo usa il normale timeout dei messaggi per la prima finestra di recupero.
- Le tempistiche del socket Baileys sono esplicite sotto `web.whatsapp.*`: `keepAliveIntervalMs` controlla i ping applicativi di WhatsApp Web, `connectTimeoutMs` controlla il timeout dell'handshake di apertura e `defaultQueryTimeoutMs` controlla i timeout delle query Baileys.
- Gli invii in uscita richiedono un listener WhatsApp attivo per l'account di destinazione.
- Gli invii nei gruppi allegano metadati nativi di menzione per i token `@+<digits>` e `@<digits>` nel testo e nelle didascalie dei media quando il token corrisponde ai metadati dei partecipanti WhatsApp correnti, inclusi i gruppi basati su LID.
- Le chat di stato e broadcast vengono ignorate (`@status`, `@broadcast`).
- Il watchdog di riconnessione segue l'attività del trasporto WhatsApp Web, non solo il volume dei messaggi app in ingresso: le sessioni silenziose di dispositivi collegati restano attive finché i frame di trasporto continuano, ma uno stallo del trasporto forza una riconnessione molto prima del percorso successivo di disconnessione remota.
- Le chat dirette usano le regole di sessione DM (`session.dmScope`; il valore predefinito `main` fa convergere i DM nella sessione principale dell'agente).
- Le sessioni di gruppo sono isolate (`agent:<agentId>:whatsapp:group:<jid>`).
- I Canali/Newsletter WhatsApp possono essere destinazioni esplicite in uscita con il loro JID nativo `@newsletter`. Gli invii newsletter in uscita usano i metadati di sessione del canale (`agent:<agentId>:whatsapp:channel:<jid>`) invece della semantica di sessione DM.
- Il trasporto WhatsApp Web rispetta le variabili di ambiente proxy standard sull'host del gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / varianti minuscole). Preferisci la configurazione proxy a livello host rispetto alle impostazioni proxy WhatsApp specifiche del canale.
- Quando `messages.removeAckAfterReply` è abilitato, OpenClaw cancella la reazione di ack WhatsApp dopo la consegna di una risposta visibile.

## Hook dei Plugin e privacy

I messaggi WhatsApp in ingresso possono contenere contenuti personali dei messaggi, numeri di telefono,
identificatori di gruppo, nomi dei mittenti e campi di correlazione della sessione. Per questo motivo,
WhatsApp non trasmette ai Plugin i payload degli hook `message_received` in ingresso
a meno che tu non scelga esplicitamente di abilitarlo:

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

Puoi limitare l'opt-in a un account:

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

Abilitalo solo per Plugin di cui ti fidi per ricevere contenuti e identificatori
dei messaggi WhatsApp in ingresso.

## Controllo dell'accesso e attivazione

<Tabs>
  <Tab title="Criterio DM">
    `channels.whatsapp.dmPolicy` controlla l'accesso alle chat dirette:

    - `pairing` (predefinito)
    - `allowlist`
    - `open` (richiede che `allowFrom` includa `"*"`)
    - `disabled`

    `allowFrom` accetta numeri in stile E.164 (normalizzati internamente).

    `allowFrom` è una lista di controllo accessi per i mittenti DM. Non limita gli invii espliciti in uscita ai JID dei gruppi WhatsApp o ai JID dei canali `@newsletter`.

    Override multi-account: `channels.whatsapp.accounts.<id>.dmPolicy` (e `allowFrom`) hanno precedenza sui valori predefiniti a livello di canale per quell'account.

    Dettagli del comportamento runtime:

    - le associazioni vengono persistite nell'allow-store del canale e unite con `allowFrom` configurato
    - l'automazione pianificata e il fallback dei destinatari Heartbeat usano destinazioni di recapito esplicite o `allowFrom` configurato; le approvazioni di associazione DM non sono destinatari Cron o Heartbeat impliciti
    - se non è configurata alcuna allowlist, il numero proprio collegato è consentito per impostazione predefinita
    - OpenClaw non associa mai automaticamente DM in uscita `fromMe` (messaggi che invii a te stesso dal dispositivo collegato)

  </Tab>

  <Tab title="Criterio gruppi + allowlist">
    L'accesso ai gruppi ha due livelli:

    1. **Allowlist di appartenenza ai gruppi** (`channels.whatsapp.groups`)
       - se `groups` è omesso, tutti i gruppi sono idonei
       - se `groups` è presente, agisce come allowlist dei gruppi (`"*"` consentito)

    2. **Criterio mittenti gruppo** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist mittenti bypassata
       - `allowlist`: il mittente deve corrispondere a `groupAllowFrom` (o `*`)
       - `disabled`: blocca tutti gli ingressi dai gruppi

    Fallback dell'allowlist mittenti:

    - se `groupAllowFrom` non è impostato, il runtime ripiega su `allowFrom` quando disponibile
    - le allowlist mittenti vengono valutate prima dell'attivazione tramite menzione/risposta

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

    - citazione/risposta soddisfa solo il gating della menzione; **non** concede autorizzazione al mittente
    - con `groupPolicy: "allowlist"`, i mittenti non inclusi nell'allowlist restano bloccati anche se rispondono al messaggio di un utente incluso nell'allowlist

    Comando di attivazione a livello di sessione:

    - `/activation mention`
    - `/activation always`

    `activation` aggiorna lo stato della sessione (non la configurazione globale). È vincolato al proprietario.

  </Tab>
</Tabs>

## Comportamento con numero personale e chat con se stessi

Quando il numero proprio collegato è presente anche in `allowFrom`, si attivano le salvaguardie per le chat WhatsApp con se stessi:

- salta le conferme di lettura per i turni di chat con se stessi
- ignora il comportamento di auto-attivazione tramite mention-JID che altrimenti invierebbe un ping a te stesso
- se `messages.responsePrefix` non è impostato, le risposte nelle chat con se stessi usano per impostazione predefinita `[{identity.name}]` o `[openclaw]`

## Normalizzazione dei messaggi e contesto

<AccordionGroup>
  <Accordion title="Envelope in ingresso + contesto di risposta">
    I messaggi WhatsApp in arrivo sono racchiusi nell'envelope in ingresso condiviso.

    Se esiste una risposta citata, il contesto viene aggiunto in questa forma:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Anche i campi dei metadati di risposta vengono popolati quando disponibili (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 del mittente).
    Quando il target della risposta citata è un media scaricabile, OpenClaw lo salva tramite
    il normale archivio media in ingresso e lo espone come `MediaPath`/`MediaType` così
    l'agente può ispezionare l'immagine referenziata invece di vedere solo
    `<media:image>`.

  </Accordion>

  <Accordion title="Placeholder media ed estrazione di posizione/contatto">
    I messaggi in ingresso solo media vengono normalizzati con placeholder come:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Le note vocali di gruppo autorizzate vengono trascritte prima del gating della menzione quando il
    corpo è solo `<media:audio>`, quindi pronunciare la menzione del bot nella nota vocale può
    attivare la risposta. Se la trascrizione ancora non menziona il bot, la
    trascrizione viene mantenuta nella cronologia di gruppo in sospeso invece del placeholder grezzo.

    I corpi delle posizioni usano testo conciso con coordinate. Etichette/commenti delle posizioni e dettagli di contatti/vCard vengono resi come metadati non attendibili in blocchi fenced, non come testo inline del prompt.

  </Accordion>

  <Accordion title="Inserimento della cronologia di gruppo in sospeso">
    Per i gruppi, i messaggi non elaborati possono essere bufferizzati e inseriti come contesto quando il bot viene finalmente attivato.

    - limite predefinito: `50`
    - config: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` disabilita

    Marcatori di inserimento:

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

    I turni di chat con sé stessi saltano le conferme di lettura anche quando sono abilitate globalmente.

  </Accordion>
</AccordionGroup>

## Consegna, suddivisione in blocchi e media

<AccordionGroup>
  <Accordion title="Suddivisione del testo in blocchi">
    - limite predefinito dei blocchi: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - la modalità `newline` preferisce i confini di paragrafo (righe vuote), poi ripiega su una suddivisione in blocchi sicura per lunghezza

  </Accordion>

  <Accordion title="Comportamento dei media in uscita">
    - supporta payload di immagini, video, audio (nota vocale PTT) e documenti
    - i media audio vengono inviati tramite il payload `audio` di Baileys con `ptt: true`, quindi i client WhatsApp li visualizzano come nota vocale push-to-talk
    - i payload di risposta preservano `audioAsVoice`; l'output di note vocali TTS per WhatsApp resta su questo percorso PTT anche quando il provider restituisce MP3 o WebM
    - l'audio Ogg/Opus nativo viene inviato come `audio/ogg; codecs=opus` per la compatibilità con le note vocali
    - l'audio non Ogg, incluso l'output MP3/WebM di Microsoft Edge TTS, viene transcodificato con `ffmpeg` in Ogg/Opus mono a 48 kHz prima della consegna PTT
    - `/tts latest` invia l'ultima risposta dell'assistente come una singola nota vocale e sopprime gli invii ripetuti per la stessa risposta; `/tts chat on|off|default` controlla l'auto-TTS per la chat WhatsApp corrente
    - la riproduzione di GIF animate è supportata tramite `gifPlayback: true` negli invii video
    - le didascalie vengono applicate al primo elemento multimediale quando si inviano payload di risposta multimediali, eccetto le note vocali PTT, che inviano prima l'audio e il testo visibile separatamente perché i client WhatsApp non visualizzano in modo coerente le didascalie delle note vocali
    - la sorgente media può essere HTTP(S), `file://` o percorsi locali

  </Accordion>

  <Accordion title="Limiti di dimensione dei media e comportamento di fallback">
    - limite di salvataggio dei media in ingresso: `channels.whatsapp.mediaMaxMb` (predefinito `50`)
    - limite di invio dei media in uscita: `channels.whatsapp.mediaMaxMb` (predefinito `50`)
    - gli override per account usano `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - le immagini vengono ottimizzate automaticamente (ridimensionamento/passata sulla qualità) per rispettare i limiti
    - in caso di errore nell'invio dei media, il fallback del primo elemento invia un avviso testuale invece di scartare silenziosamente la risposta

  </Accordion>
</AccordionGroup>

## Citazione nelle risposte

WhatsApp supporta la citazione nativa nelle risposte, in cui le risposte in uscita citano visibilmente il messaggio in ingresso. Controllala con `channels.whatsapp.replyToMode`.

| Valore      | Comportamento                                                        |
| ----------- | -------------------------------------------------------------------- |
| `"off"`     | Non cita mai; invia come messaggio semplice                          |
| `"first"`   | Cita solo il primo blocco di risposta in uscita                      |
| `"all"`     | Cita ogni blocco di risposta in uscita                               |
| `"batched"` | Cita le risposte in batch in coda lasciando non citate quelle immediate |

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

`channels.whatsapp.reactionLevel` controlla quanto ampiamente l'agente usa le reazioni emoji su WhatsApp:

| Livello       | Reazioni di ack | Reazioni avviate dall'agente | Descrizione                                         |
| ------------- | --------------- | ---------------------------- | --------------------------------------------------- |
| `"off"`       | No              | No                           | Nessuna reazione                                    |
| `"ack"`       | Sì              | No                           | Solo reazioni di ack (ricevuta pre-risposta)        |
| `"minimal"`   | Sì              | Sì (conservative)            | Ack + reazioni dell'agente con linee guida conservative |
| `"extensive"` | Sì              | Sì (encouraged)              | Ack + reazioni dell'agente con linee guida incoraggiate |

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
Le reazioni di ack sono vincolate da `reactionLevel` — vengono soppresse quando `reactionLevel` è `"off"`.

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

- inviate immediatamente dopo l'accettazione dell'input in ingresso (pre-risposta)
- gli errori vengono registrati ma non bloccano la normale consegna della risposta
- la modalità gruppo `mentions` reagisce sui turni attivati da menzione; l'attivazione gruppo `always` funge da bypass per questo controllo
- WhatsApp usa `channels.whatsapp.ackReaction` (il legacy `messages.ackReaction` non viene usato qui)

## Account multipli e credenziali

<AccordionGroup>
  <Accordion title="Selezione account e valori predefiniti">
    - gli id account provengono da `channels.whatsapp.accounts`
    - selezione dell'account predefinito: `default` se presente, altrimenti il primo id account configurato (ordinato)
    - gli id account vengono normalizzati internamente per la ricerca

  </Accordion>

  <Accordion title="Percorsi delle credenziali e compatibilità legacy">
    - percorso auth corrente: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - file di backup: `creds.json.bak`
    - l'auth predefinito legacy in `~/.openclaw/credentials/` è ancora riconosciuto/migrato per i flussi dell'account predefinito

  </Accordion>

  <Accordion title="Comportamento di logout">
    `openclaw channels logout --channel whatsapp [--account <id>]` cancella lo stato auth di WhatsApp per quell'account.

    Quando un Gateway è raggiungibile, il logout arresta prima il listener WhatsApp live per l'account selezionato, così la sessione collegata non continua a ricevere messaggi fino al riavvio successivo. `openclaw channels remove --channel whatsapp` arresta anche il listener live prima di disabilitare o eliminare la configurazione dell'account.

    Nelle directory auth legacy, `oauth.json` viene preservato mentre i file auth di Baileys vengono rimossi.

  </Accordion>
</AccordionGroup>

## Strumenti, azioni e scritture di configurazione

- Il supporto agli strumenti dell'agente include l'azione di reazione WhatsApp (`react`).
- Gate delle azioni:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Le scritture di configurazione avviate dal canale sono abilitate per impostazione predefinita (disabilitale tramite `channels.whatsapp.configWrites=false`).

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

    Gli account silenziosi possono restare connessi oltre il normale timeout dei messaggi; il watchdog
    si riavvia quando l'attività del trasporto WhatsApp Web si interrompe, il socket si chiude oppure
    l'attività a livello applicazione resta silenziosa oltre la finestra di sicurezza più lunga.

    Se i log mostrano ripetutamente `status=408 Request Time-out Connection was lost`, regola
    le temporizzazioni del socket Baileys sotto `web.whatsapp`. Inizia accorciando
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
    openclaw doctor
    openclaw logs --follow
    ```

    Se `~/.openclaw/logs/whatsapp-health.log` indica `Gateway inactive` ma
    `openclaw gateway status` e `openclaw channels status --probe` mostrano che il
    Gateway e WhatsApp sono integri, esegui `openclaw doctor`. Su Linux, doctor
    avvisa delle voci crontab legacy che invocano ancora
    `~/.openclaw/bin/ensure-whatsapp.sh`; rimuovi quelle voci obsolete con
    `crontab -e` perché cron può non avere l'ambiente systemd user-bus e
    fare in modo che il vecchio script segnali erroneamente lo stato del Gateway.

    Se necessario, ricollega con `channels login`.

  </Accordion>

  <Accordion title="Il login QR scade dietro un proxy">
    Sintomo: `openclaw channels login --channel whatsapp` fallisce prima di mostrare un codice QR utilizzabile con `status=408 Request Time-out` o una disconnessione del socket TLS.

    Il login WhatsApp Web usa l'ambiente proxy standard dell'host Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, varianti minuscole e `NO_PROXY`). Verifica che il processo Gateway erediti le variabili env del proxy e che `NO_PROXY` non corrisponda a `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Nessun listener attivo durante l'invio">
    Gli invii in uscita falliscono rapidamente quando non esiste alcun listener Gateway attivo per l'account di destinazione.

    Assicurati che il Gateway sia in esecuzione e che l'account sia collegato.

  </Accordion>

  <Accordion title="La risposta appare nella trascrizione ma non in WhatsApp">
    Le righe della trascrizione registrano ciò che l'agente ha generato. La consegna WhatsApp viene verificata separatamente: OpenClaw considera un'auto-risposta come inviata solo dopo che Baileys restituisce un id messaggio in uscita per almeno un invio di testo visibile o media.

    Le reazioni di ack sono ricevute pre-risposta indipendenti. Una reazione riuscita non prova che la successiva risposta testuale o multimediale sia stata accettata da WhatsApp.

    Controlla i log del Gateway per `auto-reply delivery failed` o `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Messaggi di gruppo ignorati inaspettatamente">
    Controlla in quest'ordine:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - voci allowlist di `groups`
    - gate di menzione (`requireMention` + pattern di menzione)
    - chiavi duplicate in `openclaw.json` (JSON5): le voci successive sovrascrivono quelle precedenti, quindi mantieni un solo `groupPolicy` per ambito

  </Accordion>

  <Accordion title="Avviso runtime Bun">
    Il runtime del Gateway WhatsApp deve usare Node. Bun viene segnalato come incompatibile per un funzionamento stabile del Gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompt di sistema

WhatsApp supporta prompt di sistema in stile Telegram per gruppi e chat dirette tramite le mappe `groups` e `direct`.

Gerarchia di risoluzione per i messaggi di gruppo:

La mappa `groups` effettiva viene determinata per prima: se l'account definisce i propri `groups`, sostituisce completamente la mappa `groups` radice (nessun merge profondo). La ricerca del prompt viene quindi eseguita sulla singola mappa risultante:

1. **Prompt di sistema specifico del gruppo** (`groups["<groupId>"].systemPrompt`): usato quando la voce del gruppo specifico esiste nella mappa **e** la sua chiave `systemPrompt` è definita. Se `systemPrompt` è una stringa vuota (`""`), il wildcard viene soppresso e non viene applicato alcun prompt di sistema.
2. **Prompt di sistema wildcard del gruppo** (`groups["*"].systemPrompt`): usato quando la voce del gruppo specifico è del tutto assente dalla mappa, oppure quando esiste ma non definisce alcuna chiave `systemPrompt`.

Gerarchia di risoluzione per i messaggi diretti:

La mappa `direct` effettiva viene determinata per prima: se l'account definisce la propria `direct`, sostituisce completamente la mappa `direct` radice (nessun merge profondo). La ricerca del prompt viene quindi eseguita sulla singola mappa risultante:

1. **Prompt di sistema specifico del diretto** (`direct["<peerId>"].systemPrompt`): usato quando la voce del peer specifico esiste nella mappa **e** la sua chiave `systemPrompt` è definita. Se `systemPrompt` è una stringa vuota (`""`), il wildcard viene soppresso e non viene applicato alcun prompt di sistema.
2. **Prompt di sistema wildcard del diretto** (`direct["*"].systemPrompt`): usato quando la voce del peer specifico è del tutto assente dalla mappa, oppure quando esiste ma non definisce alcuna chiave `systemPrompt`.

<Note>
`dms` resta il contenitore leggero di override della cronologia per DM (`dms.<id>.historyLimit`). Gli override dei prompt vivono sotto `direct`.
</Note>

**Differenza rispetto al comportamento multi-account di Telegram:** In Telegram, i `groups` radice vengono intenzionalmente soppressi per tutti gli account in una configurazione multi-account, anche per gli account che non definiscono `groups` propri, per impedire a un bot di ricevere messaggi di gruppo per gruppi a cui non appartiene. WhatsApp non applica questa protezione: i `groups` radice e `direct` radice vengono sempre ereditati dagli account che non definiscono override a livello di account, indipendentemente dal numero di account configurati. In una configurazione WhatsApp multi-account, se vuoi prompt di gruppo o diretti per account, definisci esplicitamente la mappa completa sotto ogni account invece di fare affidamento sui valori predefiniti a livello radice.

Comportamento importante:

- `channels.whatsapp.groups` è sia una mappa di configurazione per gruppo sia l'allowlist dei gruppi a livello di chat. Sia nello scope radice sia nello scope dell'account, `groups["*"]` significa "tutti i gruppi sono ammessi" per quello scope.
- Aggiungi un wildcard group `systemPrompt` solo quando vuoi già che quello scope ammetta tutti i gruppi. Se vuoi ancora che solo un insieme fisso di ID gruppo sia idoneo, non usare `groups["*"]` per il prompt predefinito. Invece, ripeti il prompt su ogni voce di gruppo esplicitamente inclusa nell'allowlist.
- L'ammissione del gruppo e l'autorizzazione del mittente sono controlli separati. `groups["*"]` amplia l'insieme di gruppi che possono raggiungere la gestione dei gruppi, ma da solo non autorizza ogni mittente in quei gruppi. L'accesso del mittente resta controllato separatamente da `channels.whatsapp.groupPolicy` e `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` non ha lo stesso effetto collaterale per i DM. `direct["*"]` fornisce solo una configurazione predefinita per chat dirette dopo che un DM è già stato ammesso da `dmPolicy` più `allowFrom` o dalle regole del pairing store.

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

## Puntatori alla reference di configurazione

Reference principale:

- [Reference di configurazione - WhatsApp](/it/gateway/config-channels#whatsapp)

Campi WhatsApp ad alto segnale:

- accesso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- consegna: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- multi-account: `accounts.<id>.enabled`, `accounts.<id>.authDir`, override a livello di account
- operazioni: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- comportamento sessione: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompt: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Correlati

- [Pairing](/it/channels/pairing)
- [Gruppi](/it/channels/groups)
- [Sicurezza](/it/gateway/security)
- [Instradamento canali](/it/channels/channel-routing)
- [Instradamento multi-agent](/it/concepts/multi-agent)
- [Risoluzione dei problemi](/it/channels/troubleshooting)
