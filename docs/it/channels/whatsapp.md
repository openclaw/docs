---
read_when:
    - Lavorare sul comportamento del canale WhatsApp/web o sull'instradamento della posta in arrivo
summary: Supporto del canale WhatsApp, controlli di accesso, comportamento di consegna e operazioni
title: WhatsApp
x-i18n:
    generated_at: "2026-04-30T08:40:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5d0268e068de0001a11a6ed87fe70df8e685d1dcc87c8142ee5b3c77d7a727f3
    source_path: channels/whatsapp.md
    workflow: 16
---

Stato: pronto per la produzione tramite WhatsApp Web (Baileys). Il Gateway gestisce le sessioni collegate.

## Installazione (su richiesta)

- L'onboarding (`openclaw onboard`) e `openclaw channels add --channel whatsapp`
  chiedono di installare il plugin WhatsApp la prima volta che lo selezioni.
- `openclaw channels login --channel whatsapp` offre anche il flusso di installazione quando
  il plugin non è ancora presente.
- Canale dev + checkout git: usa come predefinito il percorso del plugin locale.
- Stable/Beta: usa il pacchetto npm `@openclaw/whatsapp` quando è pubblicato un pacchetto
  corrente.

L'installazione manuale resta disponibile:

```bash
openclaw plugins install @openclaw/whatsapp
```

Se npm segnala il pacchetto di proprietà di OpenClaw come deprecato o mancante, usa una
build OpenClaw pacchettizzata corrente oppure un checkout locale finché il treno dei pacchetti npm
non si aggiorna.

<CardGroup cols={3}>
  <Card title="Abbinamento" icon="link" href="/it/channels/pairing">
    Il criterio DM predefinito è l'abbinamento per mittenti sconosciuti.
  </Card>
  <Card title="Risoluzione dei problemi del canale" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica cross-channel e playbook di riparazione.
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

  <Step title="Avvia il gateway">

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

## Pattern di distribuzione

<AccordionGroup>
  <Accordion title="Numero dedicato (consigliato)">
    Questa è la modalità operativa più pulita:

    - identità WhatsApp separata per OpenClaw
    - allowlist DM e confini di instradamento più chiari
    - minore probabilità di confusione con le chat con se stessi

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
    L'onboarding supporta la modalità con numero personale e scrive una baseline compatibile con la chat con se stessi:

    - `dmPolicy: "allowlist"`
    - `allowFrom` include il tuo numero personale
    - `selfChatMode: true`

    A runtime, le protezioni per la chat con se stessi si basano sul numero self collegato e su `allowFrom`.

  </Accordion>

  <Accordion title="Ambito del canale solo WhatsApp Web">
    Il canale della piattaforma di messaggistica è basato su WhatsApp Web (`Baileys`) nell'architettura corrente dei canali OpenClaw.

    Non esiste un canale di messaggistica Twilio WhatsApp separato nel registro dei canali chat integrato.

  </Accordion>
</AccordionGroup>

## Modello runtime

- Il Gateway gestisce il socket WhatsApp e il loop di riconnessione.
- Il watchdog di riconnessione usa l'attività del trasporto WhatsApp Web, non solo il volume dei messaggi app in ingresso, quindi una sessione silenziosa di un dispositivo collegato non viene riavviata solo perché nessuno ha inviato messaggi di recente. Un limite più lungo di silenzio applicativo forza comunque una riconnessione se i frame di trasporto continuano ad arrivare ma non viene gestito alcun messaggio applicativo durante la finestra del watchdog; dopo una riconnessione transitoria per una sessione attiva di recente, quel controllo di silenzio applicativo usa il normale timeout dei messaggi per la prima finestra di recupero.
- I timing del socket Baileys sono espliciti sotto `web.whatsapp.*`: `keepAliveIntervalMs` controlla i ping applicativi WhatsApp Web, `connectTimeoutMs` controlla il timeout dell'handshake di apertura e `defaultQueryTimeoutMs` controlla i timeout delle query Baileys.
- Gli invii in uscita richiedono un listener WhatsApp attivo per l'account di destinazione.
- Le chat di stato e broadcast vengono ignorate (`@status`, `@broadcast`).
- Il watchdog di riconnessione segue l'attività del trasporto WhatsApp Web, non solo il volume dei messaggi app in ingresso: le sessioni silenziose di dispositivi collegati restano attive mentre i frame di trasporto continuano, ma uno stallo del trasporto forza la riconnessione molto prima del successivo percorso di disconnessione remota.
- Le chat dirette usano le regole di sessione DM (`session.dmScope`; il valore predefinito `main` accorpa i DM alla sessione principale dell'agente).
- Le sessioni di gruppo sono isolate (`agent:<agentId>:whatsapp:group:<jid>`).
- Il trasporto WhatsApp Web rispetta le variabili di ambiente proxy standard sull'host del gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / varianti minuscole). Preferisci la configurazione proxy a livello host rispetto alle impostazioni proxy WhatsApp specifiche del canale.
- Quando `messages.removeAckAfterReply` è abilitato, OpenClaw cancella la reazione di ack WhatsApp dopo la consegna di una risposta visibile.

## Hook dei plugin e privacy

I messaggi WhatsApp in ingresso possono contenere contenuto personale dei messaggi, numeri di telefono,
identificatori di gruppo, nomi dei mittenti e campi di correlazione della sessione. Per questo motivo,
WhatsApp non trasmette payload hook `message_received` in ingresso ai plugin
a meno che tu non scelga esplicitamente di abilitarli:

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

Abilitalo solo per plugin di cui ti fidi per ricevere contenuti e identificatori
dei messaggi WhatsApp in ingresso.

## Controllo degli accessi e attivazione

<Tabs>
  <Tab title="Criterio DM">
    `channels.whatsapp.dmPolicy` controlla l'accesso alle chat dirette:

    - `pairing` (predefinito)
    - `allowlist`
    - `open` (richiede che `allowFrom` includa `"*"`)
    - `disabled`

    `allowFrom` accetta numeri in stile E.164 (normalizzati internamente).

    Override multi-account: `channels.whatsapp.accounts.<id>.dmPolicy` (e `allowFrom`) hanno precedenza sui valori predefiniti a livello canale per quell'account.

    Dettagli del comportamento runtime:

    - gli abbinamenti vengono mantenuti nello store allow del canale e uniti con `allowFrom` configurato
    - se non è configurata alcuna allowlist, il numero self collegato è consentito per impostazione predefinita
    - OpenClaw non abbina mai automaticamente i DM `fromMe` in uscita (messaggi che invii a te stesso dal dispositivo collegato)

  </Tab>

  <Tab title="Criterio di gruppo + allowlist">
    L'accesso ai gruppi ha due livelli:

    1. **Allowlist di appartenenza ai gruppi** (`channels.whatsapp.groups`)
       - se `groups` è omesso, tutti i gruppi sono idonei
       - se `groups` è presente, agisce come allowlist di gruppi (`"*"` consentito)

    2. **Criterio mittente di gruppo** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist mittenti bypassata
       - `allowlist`: il mittente deve corrispondere a `groupAllowFrom` (o `*`)
       - `disabled`: blocca tutti gli ingressi di gruppo

    Fallback dell'allowlist mittenti:

    - se `groupAllowFrom` non è impostato, il runtime ricorre a `allowFrom` quando disponibile
    - le allowlist mittenti vengono valutate prima dell'attivazione tramite menzione/risposta

    Nota: se non esiste alcun blocco `channels.whatsapp`, il fallback runtime del criterio di gruppo è `allowlist` (con un log di avviso), anche se `channels.defaults.groupPolicy` è impostato.

  </Tab>

  <Tab title="Menzioni + /activation">
    Le risposte nei gruppi richiedono una menzione per impostazione predefinita.

    Il rilevamento delle menzioni include:

    - menzioni WhatsApp esplicite dell'identità del bot
    - pattern regex di menzione configurati (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - trascrizioni delle note vocali in ingresso per messaggi di gruppo autorizzati
    - rilevamento implicito di risposta al bot (il mittente della risposta corrisponde all'identità del bot)

    Nota di sicurezza:

    - citazione/risposta soddisfa solo il gating della menzione; **non** concede autorizzazione al mittente
    - con `groupPolicy: "allowlist"`, i mittenti non inclusi nell'allowlist sono comunque bloccati anche se rispondono al messaggio di un utente incluso nell'allowlist

    Comando di attivazione a livello sessione:

    - `/activation mention`
    - `/activation always`

    `activation` aggiorna lo stato della sessione (non la configurazione globale). È vincolato al proprietario.

  </Tab>
</Tabs>

## Comportamento con numero personale e chat con se stessi

Quando il numero self collegato è presente anche in `allowFrom`, si attivano le protezioni WhatsApp per la chat con se stessi:

- salta le conferme di lettura per i turni di chat con se stessi
- ignora il comportamento di auto-trigger mention-JID che altrimenti ti invierebbe un ping
- se `messages.responsePrefix` non è impostato, le risposte in chat con se stessi usano come predefinito `[{identity.name}]` o `[openclaw]`

## Normalizzazione dei messaggi e contesto

<AccordionGroup>
  <Accordion title="Envelope in ingresso + contesto della risposta">
    I messaggi WhatsApp in arrivo vengono racchiusi nell'envelope in ingresso condiviso.

    Se esiste una risposta citata, il contesto viene aggiunto in questa forma:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Quando disponibili, vengono popolati anche i campi dei metadati della risposta (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 del mittente).

  </Accordion>

  <Accordion title="Placeholder multimediali ed estrazione di posizione/contatto">
    I messaggi in ingresso solo multimediali vengono normalizzati con placeholder come:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Le note vocali di gruppo autorizzate vengono trascritte prima del gating della menzione quando il
    corpo è solo `<media:audio>`, quindi pronunciare la menzione del bot nella nota vocale può
    attivare la risposta. Se la trascrizione non menziona comunque il bot, la
    trascrizione viene mantenuta nella cronologia di gruppo in sospeso invece del placeholder grezzo.

    I corpi delle posizioni usano testo conciso con coordinate. Etichette/commenti delle posizioni e dettagli di contatto/vCard vengono resi come metadati non attendibili in blocchi fenced, non come testo inline del prompt.

  </Accordion>

  <Accordion title="Iniezione della cronologia di gruppo in sospeso">
    Per i gruppi, i messaggi non elaborati possono essere bufferizzati e iniettati come contesto quando il bot viene finalmente attivato.

    - limite predefinito: `50`
    - configurazione: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` disabilita

    Marker di iniezione:

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

## Consegna, suddivisione in chunk e media

<AccordionGroup>
  <Accordion title="Suddivisione del testo in chunk">
    - limite di chunk predefinito: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - la modalità `newline` preferisce i confini di paragrafo (righe vuote), poi ricorre alla suddivisione in chunk sicura per lunghezza

  </Accordion>

  <Accordion title="Comportamento dei media in uscita">
    - supporta payload di immagini, video, audio (nota vocale PTT) e documenti
    - i media audio vengono inviati tramite il payload `audio` di Baileys con `ptt: true`, quindi i client WhatsApp li visualizzano come una nota vocale push-to-talk
    - i payload di risposta preservano `audioAsVoice`; l'output della nota vocale TTS per WhatsApp resta su questo percorso PTT anche quando il provider restituisce MP3 o WebM
    - l'audio Ogg/Opus nativo viene inviato come `audio/ogg; codecs=opus` per la compatibilità con le note vocali
    - l'audio non Ogg, incluso l'output MP3/WebM del TTS di Microsoft Edge, viene transcodificato con `ffmpeg` in Ogg/Opus mono a 48 kHz prima della consegna PTT
    - `/tts latest` invia l'ultima risposta dell'assistente come una singola nota vocale e sopprime gli invii ripetuti per la stessa risposta; `/tts chat on|off|default` controlla il TTS automatico per la chat WhatsApp corrente
    - la riproduzione delle GIF animate è supportata tramite `gifPlayback: true` negli invii video
    - le didascalie vengono applicate al primo elemento multimediale quando si inviano payload di risposta con più media, tranne le note vocali PTT, che inviano prima l'audio e il testo visibile separatamente perché i client WhatsApp non visualizzano le didascalie delle note vocali in modo coerente
    - la sorgente dei media può essere HTTP(S), `file://` o percorsi locali

  </Accordion>

  <Accordion title="Limiti di dimensione dei media e comportamento di fallback">
    - limite di salvataggio dei media in ingresso: `channels.whatsapp.mediaMaxMb` (predefinito `50`)
    - limite di invio dei media in uscita: `channels.whatsapp.mediaMaxMb` (predefinito `50`)
    - gli override per account usano `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - le immagini vengono ottimizzate automaticamente (ridimensionamento/scansione della qualità) per rientrare nei limiti
    - in caso di errore nell'invio dei media, il fallback del primo elemento invia un avviso testuale invece di scartare la risposta silenziosamente

  </Accordion>
</AccordionGroup>

## Citazione delle risposte

WhatsApp supporta la citazione nativa delle risposte, in cui le risposte in uscita citano visibilmente il messaggio in ingresso. Controllala con `channels.whatsapp.replyToMode`.

| Valore      | Comportamento                                                        |
| ----------- | -------------------------------------------------------------------- |
| `"off"`     | Non citare mai; invia come messaggio semplice                        |
| `"first"`   | Cita solo il primo frammento di risposta in uscita                   |
| `"all"`     | Cita ogni frammento di risposta in uscita                            |
| `"batched"` | Cita le risposte raggruppate in coda lasciando non citate le risposte immediate |

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

| Livello       | Reazioni di conferma | Reazioni avviate dall'agente | Descrizione                                      |
| ------------- | -------------------- | ---------------------------- | ------------------------------------------------ |
| `"off"`       | No                   | No                           | Nessuna reazione                                 |
| `"ack"`       | Sì                   | No                           | Solo reazioni di conferma (ricevuta pre-risposta) |
| `"minimal"`   | Sì                   | Sì (conservativo)            | Conferma + reazioni dell'agente con linee guida conservative |
| `"extensive"` | Sì                   | Sì (incoraggiate)            | Conferma + reazioni dell'agente con linee guida incoraggiate |

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

WhatsApp supporta reazioni di conferma immediate alla ricezione in ingresso tramite `channels.whatsapp.ackReaction`.
Le reazioni di conferma sono controllate da `reactionLevel`: vengono soppresse quando `reactionLevel` è `"off"`.

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

- inviate immediatamente dopo l'accettazione dell'ingresso (pre-risposta)
- gli errori vengono registrati ma non bloccano la normale consegna della risposta
- la modalità gruppo `mentions` reagisce nei turni attivati da menzioni; l'attivazione del gruppo `always` agisce da bypass per questo controllo
- WhatsApp usa `channels.whatsapp.ackReaction` (il legacy `messages.ackReaction` non viene usato qui)

## Account multipli e credenziali

<AccordionGroup>
  <Accordion title="Selezione dell'account e impostazioni predefinite">
    - gli ID account provengono da `channels.whatsapp.accounts`
    - selezione predefinita dell'account: `default` se presente, altrimenti il primo ID account configurato (ordinato)
    - gli ID account vengono normalizzati internamente per la ricerca

  </Accordion>

  <Accordion title="Percorsi delle credenziali e compatibilità legacy">
    - percorso di autenticazione corrente: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - file di backup: `creds.json.bak`
    - l'autenticazione predefinita legacy in `~/.openclaw/credentials/` viene ancora riconosciuta/migrata per i flussi dell'account predefinito

  </Accordion>

  <Accordion title="Comportamento di logout">
    `openclaw channels logout --channel whatsapp [--account <id>]` cancella lo stato di autenticazione WhatsApp per quell'account.

    Nelle directory di autenticazione legacy, `oauth.json` viene preservato mentre i file di autenticazione Baileys vengono rimossi.

  </Accordion>
</AccordionGroup>

## Strumenti, azioni e scritture della configurazione

- Il supporto agli strumenti dell'agente include l'azione di reazione WhatsApp (`react`).
- Gate delle azioni:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Le scritture della configurazione avviate dal canale sono abilitate per impostazione predefinita (disabilita tramite `channels.whatsapp.configWrites=false`).

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Non collegato (QR richiesto)">
    Sintomo: lo stato del canale segnala che non è collegato.

    Correzione:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Collegato ma disconnesso / ciclo di riconnessione">
    Sintomo: account collegato con disconnessioni ripetute o tentativi di riconnessione.

    Gli account inattivi possono rimanere connessi oltre il normale timeout dei messaggi; il watchdog
    si riavvia quando l'attività del trasporto WhatsApp Web si interrompe, il socket si chiude o
    l'attività a livello applicazione resta silenziosa oltre la finestra di sicurezza più lunga.

    Se i log mostrano ripetutamente `status=408 Request Time-out Connection was lost`, regola
    i tempi del socket Baileys sotto `web.whatsapp`. Inizia riducendo
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

    Se necessario, ricollega con `channels login`.

  </Accordion>

  <Accordion title="Il login QR va in timeout dietro un proxy">
    Sintomo: `openclaw channels login --channel whatsapp` non riesce prima di mostrare un codice QR utilizzabile, con `status=408 Request Time-out` o una disconnessione del socket TLS.

    Il login WhatsApp Web usa l'ambiente proxy standard dell'host Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, varianti minuscole e `NO_PROXY`). Verifica che il processo Gateway erediti l'ambiente proxy e che `NO_PROXY` non corrisponda a `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Nessun listener attivo durante l'invio">
    Gli invii in uscita falliscono rapidamente quando non esiste alcun listener Gateway attivo per l'account di destinazione.

    Assicurati che il Gateway sia in esecuzione e che l'account sia collegato.

  </Accordion>

  <Accordion title="La risposta appare nella trascrizione ma non in WhatsApp">
    Le righe della trascrizione registrano ciò che l'agente ha generato. La consegna WhatsApp viene controllata separatamente: OpenClaw considera un'auto-risposta inviata solo dopo che Baileys restituisce un ID di messaggio in uscita per almeno un invio visibile di testo o media.

    Le reazioni di ack sono ricevute pre-risposta indipendenti. Una reazione riuscita non dimostra che la successiva risposta di testo o media sia stata accettata da WhatsApp.

    Controlla i log del Gateway per `auto-reply delivery failed` o `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Messaggi di gruppo ignorati in modo inatteso">
    Controlla in quest'ordine:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - voci della lista consentita `groups`
    - gating delle menzioni (`requireMention` + pattern di menzione)
    - chiavi duplicate in `openclaw.json` (JSON5): le voci successive sovrascrivono quelle precedenti, quindi mantieni un solo `groupPolicy` per ambito

  </Accordion>

  <Accordion title="Avviso sul runtime Bun">
    Il runtime del Gateway WhatsApp dovrebbe usare Node. Bun è segnalato come incompatibile per il funzionamento stabile del Gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompt di sistema

WhatsApp supporta prompt di sistema in stile Telegram per gruppi e chat dirette tramite le mappe `groups` e `direct`.

Gerarchia di risoluzione per i messaggi di gruppo:

La mappa `groups` effettiva viene determinata per prima: se l'account definisce il proprio `groups`, sostituisce completamente la mappa `groups` radice (nessun merge profondo). La ricerca del prompt viene quindi eseguita sulla singola mappa risultante:

1. **Prompt di sistema specifico del gruppo** (`groups["<groupId>"].systemPrompt`): usato quando la voce del gruppo specifico esiste nella mappa **e** la sua chiave `systemPrompt` è definita. Se `systemPrompt` è una stringa vuota (`""`), il wildcard viene soppresso e non viene applicato alcun prompt di sistema.
2. **Prompt di sistema wildcard del gruppo** (`groups["*"].systemPrompt`): usato quando la voce del gruppo specifico è completamente assente dalla mappa, oppure quando esiste ma non definisce alcuna chiave `systemPrompt`.

Gerarchia di risoluzione per i messaggi diretti:

La mappa `direct` effettiva viene determinata per prima: se l'account definisce il proprio `direct`, sostituisce completamente la mappa `direct` radice (nessun merge profondo). La ricerca del prompt viene quindi eseguita sulla singola mappa risultante:

1. **Prompt di sistema specifico del messaggio diretto** (`direct["<peerId>"].systemPrompt`): usato quando la voce del peer specifico esiste nella mappa **e** la sua chiave `systemPrompt` è definita. Se `systemPrompt` è una stringa vuota (`""`), il wildcard viene soppresso e non viene applicato alcun prompt di sistema.
2. **Prompt di sistema wildcard del messaggio diretto** (`direct["*"].systemPrompt`): usato quando la voce del peer specifico è completamente assente dalla mappa, oppure quando esiste ma non definisce alcuna chiave `systemPrompt`.

<Note>
`dms` rimane il contenitore leggero per override della cronologia per singolo DM (`dms.<id>.historyLimit`). Gli override dei prompt risiedono sotto `direct`.
</Note>

**Differenza rispetto al comportamento multi-account di Telegram:** In Telegram, `groups` radice viene intenzionalmente soppresso per tutti gli account in una configurazione multi-account, anche per gli account che non definiscono un proprio `groups`, per impedire a un bot di ricevere messaggi di gruppo da gruppi a cui non appartiene. WhatsApp non applica questa protezione: `groups` radice e `direct` radice vengono sempre ereditati dagli account che non definiscono override a livello di account, indipendentemente dal numero di account configurati. In una configurazione WhatsApp multi-account, se vuoi prompt di gruppo o diretti per account, definisci esplicitamente la mappa completa sotto ciascun account invece di fare affidamento sui valori predefiniti a livello radice.

Comportamento importante:

- `channels.whatsapp.groups` è sia una mappa di configurazione per gruppo sia la lista consentita dei gruppi a livello di chat. Sia nell'ambito radice sia in quello dell'account, `groups["*"]` significa "tutti i gruppi sono ammessi" per quell'ambito.
- Aggiungi un gruppo jolly `systemPrompt` solo quando vuoi già che quell'ambito ammetta tutti i gruppi. Se vuoi ancora che sia idoneo solo un insieme fisso di ID gruppo, non usare `groups["*"]` per il prompt predefinito. Ripeti invece il prompt in ogni voce di gruppo esplicitamente inclusa nella lista consentita.
- L'ammissione del gruppo e l'autorizzazione del mittente sono controlli separati. `groups["*"]` amplia l'insieme dei gruppi che possono raggiungere la gestione dei gruppi, ma di per sé non autorizza ogni mittente in quei gruppi. L'accesso del mittente è comunque controllato separatamente da `channels.whatsapp.groupPolicy` e `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` non ha lo stesso effetto collaterale per i DM. `direct["*"]` fornisce solo una configurazione predefinita per chat diretta dopo che un DM è già stato ammesso da `dmPolicy` più `allowFrom` o dalle regole dell'archivio di abbinamento.

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

## Puntatori alla guida di riferimento della configurazione

Riferimento principale:

- [Guida di riferimento della configurazione - WhatsApp](/it/gateway/config-channels#whatsapp)

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
