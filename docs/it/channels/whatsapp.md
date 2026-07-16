---
read_when:
    - Interventi sul comportamento dei canali WhatsApp/web o sull'instradamento della posta in arrivo
summary: Supporto del canale WhatsApp, controlli degli accessi, comportamento di recapito e operazioni
title: WhatsApp
x-i18n:
    generated_at: "2026-07-16T13:55:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d9d6af1b32a428e0a35794fa4b5a8a861cb404a5b6848a265bf5d43f4cdad168
    source_path: channels/whatsapp.md
    workflow: 16
---

Stato: pronto per la produzione tramite WhatsApp Web (Baileys). Il Gateway gestisce le sessioni collegate; non esiste un canale WhatsApp Twilio separato.

## Installazione

`openclaw onboard` e `openclaw channels add --channel whatsapp` richiedono di installare il plugin la prima volta che viene selezionato; `openclaw channels login --channel whatsapp` offre lo stesso flusso di installazione se il plugin non è presente. I checkout di sviluppo utilizzano il percorso locale del plugin; le installazioni stable/beta installano prima `@openclaw/whatsapp` da ClawHub, con ripiego su npm. Il runtime di WhatsApp viene distribuito al di fuori del pacchetto npm principale di OpenClaw, quindi le sue dipendenze di runtime rimangono nel plugin esterno. Installazione manuale:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Utilizzare il pacchetto npm semplice (`@openclaw/whatsapp`) solo per il ripiego sul registro; fissare una versione esatta solo per un'installazione riproducibile.

<CardGroup cols={3}>
  <Card title="Associazione" icon="link" href="/it/channels/pairing">
    Il criterio predefinito per i messaggi diretti prevede l'associazione per i mittenti sconosciuti.
  </Card>
  <Card title="Risoluzione dei problemi del canale" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica tra canali e procedure operative di riparazione.
  </Card>
  <Card title="Configurazione del Gateway" icon="settings" href="/it/gateway/configuration">
    Pattern ed esempi completi per la configurazione dei canali.
  </Card>
</CardGroup>

## Configurazione rapida

<Steps>
  <Step title="Configurare il criterio di accesso">

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

  <Step title="Collegare WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    L'accesso avviene esclusivamente tramite QR. Su host remoti o headless, prima di avviare l'accesso predisporre un metodo affidabile per trasmettere al telefono il QR attivo; i QR visualizzati nel terminale, gli screenshot o gli allegati in chat possono scadere durante la trasmissione.

    Per un account specifico:

```bash
openclaw channels login --channel whatsapp --account work
```

    Per collegare una directory di autenticazione esistente o personalizzata prima dell'accesso:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Avviare il Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Approvare la prima richiesta di associazione (modalità di associazione)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Le richieste di associazione scadono dopo 1 ora; le richieste in sospeso sono limitate a 3 per account.

  </Step>
</Steps>

<Note>
È consigliato un numero WhatsApp separato (la configurazione e i metadati sono ottimizzati a tale scopo), ma sono pienamente supportate le configurazioni con numero personale o chat con sé stessi.
</Note>

## Pattern di distribuzione

<AccordionGroup>
  <Accordion title="Numero dedicato (consigliato)">
    - identità WhatsApp separata per OpenClaw
    - liste di mittenti consentiti per i messaggi diretti e confini di instradamento più chiari
    - minore probabilità di confusione nelle chat con sé stessi

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

  <Accordion title="Ripiego sul numero personale">
    L'onboarding supporta la modalità con numero personale e scrive una configurazione di base adatta alle chat con sé stessi: `dmPolicy: "allowlist"`, `allowFrom` incluso il proprio numero, `selfChatMode: true`. Le protezioni di runtime per le chat con sé stessi si basano sul numero personale collegato e su `allowFrom`.
  </Accordion>
</AccordionGroup>

## Modello di runtime

- Il Gateway gestisce il socket WhatsApp e il ciclo di riconnessione.
- Un watchdog monitora due segnali in modo indipendente: l'attività di trasporto grezza di WhatsApp Web e l'attività dei messaggi dell'applicazione. Una sessione inattiva ma connessa non viene riavviata solo perché non sono arrivati messaggi di recente; la riconnessione viene forzata esclusivamente quando i frame di trasporto non arrivano più per un intervallo interno fisso (non configurabile dall'utente) o i messaggi dell'applicazione rimangono assenti oltre 4 volte il normale timeout dei messaggi. Subito dopo una riconnessione di una sessione attiva di recente, il primo intervallo utilizza il normale timeout dei messaggi, più breve, anziché l'intervallo quadruplicato. OpenClaw può rispondere automaticamente ai messaggi offline consegnati in anticipo da Baileys durante tale riconnessione, entro la durata di deduplicazione degli ID dei messaggi in entrata; l'avvio iniziale mantiene la breve protezione contro la cronologia obsoleta.
- Le tempistiche del socket Baileys sono definite esplicitamente in `web.whatsapp.*`: `keepAliveIntervalMs` (intervallo di ping dell'applicazione), `connectTimeoutMs` (timeout dell'handshake di apertura), `defaultQueryTimeoutMs` (attese delle query Baileys, oltre ai timeout di OpenClaw per l'invio in uscita, la presenza e le conferme di lettura in entrata).
- Gli invii in uscita richiedono un listener WhatsApp attivo per l'account di destinazione; in caso contrario, l'invio non riesce immediatamente.
- Gli invii ai gruppi includono metadati nativi delle menzioni per i token `@+<digits>` e `@<digits>` (nel testo e nelle didascalie dei contenuti multimediali) quando il token corrisponde ai metadati correnti di un partecipante, inclusi i gruppi basati su LID.
- Le chat di stato e broadcast (`@status`, `@broadcast`) vengono ignorate.
- Le chat dirette utilizzano le regole di sessione dei messaggi diretti (`session.dmScope`; il valore predefinito `main` accorpa i messaggi diretti nella sessione principale dell'agente). Le sessioni dei gruppi sono isolate per JID (`agent:<agentId>:whatsapp:group:<jid>`).
- I canali e le newsletter di WhatsApp possono essere destinazioni esplicite in uscita tramite il relativo JID nativo `@newsletter`, utilizzando i metadati di sessione del canale (`agent:<agentId>:whatsapp:channel:<jid>`) anziché la semantica dei messaggi diretti.
- Il trasporto WhatsApp Web rispetta le variabili di ambiente proxy standard sull'host del Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` e le varianti in minuscolo). Preferire la configurazione proxy a livello di host rispetto alle impostazioni specifiche del canale.
- Con `messages.removeAckAfterReply` abilitato, OpenClaw rimuove la reazione di conferma quando viene recapitata una risposta visibile.

## Chiamare il richiedente corrente con MeowCaller (sperimentale)

Il plugin può esporre `whatsapp_call` nelle interazioni dell'agente provenienti da WhatsApp. Utilizza [MeowCaller](https://github.com/purpshell/meowcaller) per effettuare una chiamata vocale WhatsApp al richiedente autorizzato corrente e riprodurre un messaggio TTS di OpenClaw dopo la risposta. Lo strumento non dispone di un parametro per il numero di destinazione, pertanto un prompt non può reindirizzare la chiamata. Disabilitato per impostazione predefinita.

<Warning>
MeowCaller è sperimentale, non dispone di una release con tag e utilizza una sessione di dispositivo collegato whatsmeow associata separatamente: non può riutilizzare le credenziali Baileys del plugin. L'associazione aggiunge un altro dispositivo collegato allo stesso account WhatsApp; eseguire la scansione con l'identità utilizzata da OpenClaw. La modalità con numero personale o chat con sé stessi non può chiamare il proprio numero; utilizzare un numero OpenClaw dedicato per chiamare il proprio numero personale.
</Warning>

<Steps>
  <Step title="Abilitare le chiamate sperimentali">

    Aggiungere `actions.calls: true` alla configurazione del canale WhatsApp e riavviare il Gateway:

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

    Se assente o impostato su `false`, OpenClaw non espone lo strumento `whatsapp_call`.

  </Step>

  <Step title="Installare la CLI MeowCaller sottoposta a revisione">

    L'adattatore richiede un eseguibile `meowcaller` nel `PATH` dell'host del Gateway. Fino all'unione della [PR MeowCaller n. 7](https://github.com/purpshell/meowcaller/pull/7), compilare il branch sottoposto a revisione:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    Assicurarsi che `$HOME/.local/bin` sia incluso nel `PATH` del servizio Gateway. Questa revisione dispone di comandi espliciti `pair` e `notify` di solo invio; `notify` non apre alcun microfono, altoparlante, dispositivo video o acquisizione diagnostica. Non sostituirlo con il comando `play` della CLI di esempio upstream.

  </Step>

  <Step title="Associare il dispositivo collegato MeowCaller">

    Chiedere all'agente WhatsApp di verificare la configurazione delle chiamate (l'azione di stato `whatsapp_call` segnala la directory di stato specifica dell'account e il comando di associazione). Per l'account predefinito:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Eseguire il comando in modo interattivo, scansionare il QR da **WhatsApp > Linked devices** e attendere `MeowCaller linked device ready`. Mantenere privato `wa-voip.db`: è la sessione MeowCaller. Gli account non predefiniti ricevono il proprio percorso di archiviazione dall'azione di stato; su Windows, eseguire il relativo comando PowerShell.

  </Step>

  <Step title="Configurare il TTS ed effettuare una chiamata da WhatsApp">

    Configurare un [provider TTS](/it/tools/tts) compatibile con la telefonia, riavviare il Gateway, quindi inviare una richiesta come `Call me and say the build finished.` Lo strumento individua il mittente dal contesto attendibile in entrata, sintetizza un file WAV privato temporaneo, esegue MeowCaller per un intervallo di chiamata limitato ed elimina successivamente il file audio. OpenClaw passa esplicitamente l'archivio dell'account, attende uno stato di uscita pari a zero dopo risposta, riproduzione e riaggancio e considera un timeout o uno stato di uscita diverso da zero come una chiamata allo strumento non riuscita.

  </Step>
</Steps>

Limiti: solo chiamate audio in uscita individuali, nessun numero di destinazione arbitrario, nessuna autenticazione condivisa con la connessione della chat, nessuna chiamata a sé stessi dalla modalità con numero personale o chat con sé stessi, audio sintetizzato limitato a 60 secondi, nessuna conferma di udibilità sul dispositivo oltre al completamento di risposta, riproduzione e riaggancio di MeowCaller; OpenClaw arresta inoltre il processo complementare dopo un intervallo limitato di 115-175 secondi, che comprende le fasi di connessione, risposta, riproduzione e arresto di MeowCaller.

## Richieste di approvazione

WhatsApp può visualizzare le richieste di approvazione di esecuzione e del plugin come reazioni `👍`/`👎`, controllate dalla configurazione di inoltro delle approvazioni di livello superiore:

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

`approvals.exec` e `approvals.plugin` sono indipendenti; l'abilitazione di WhatsApp come canale collega soltanto il trasporto e non invia nulla, a meno che la famiglia di approvazioni corrispondente non sia abilitata e instradata verso tale canale. La modalità sessione recapita approvazioni tramite emoji native solo per le approvazioni originate da WhatsApp. La modalità destinazione utilizza la pipeline di inoltro condivisa per le destinazioni esplicite e non crea una distribuzione separata di messaggi diretti agli approvatori.

Le reazioni di approvazione di WhatsApp richiedono approvatori espliciti in `allowFrom` (o `"*"`). `defaultTo` imposta le normali destinazioni predefinite dei messaggi, non un elenco di approvatori. I comandi manuali `/approve` seguono comunque il normale percorso di autorizzazione del mittente WhatsApp prima della risoluzione dell'approvazione.

## Hook dei plugin e privacy

I messaggi WhatsApp in entrata possono contenere contenuti personali, numeri di telefono, identificatori di gruppi, nomi dei mittenti e campi di correlazione delle sessioni. WhatsApp non trasmette ai plugin i payload degli hook `message_received` in entrata, a meno che non venga fornito il consenso esplicito:

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

Limitare il consenso a un singolo account in `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived`. Abilitare questa opzione solo per i plugin ritenuti affidabili per la gestione dei contenuti e degli identificatori WhatsApp in entrata.

## Controllo degli accessi e attivazione

<Tabs>
  <Tab title="Criterio per i messaggi diretti">
    `channels.whatsapp.dmPolicy`:

    | Valore | Comportamento |
    | --- | --- |
    | `pairing` (predefinito) | I mittenti sconosciuti richiedono l'associazione; il proprietario approva |
    | `allowlist` | Sono ammessi solo i mittenti `allowFrom` |
    | `open` | Richiede che `allowFrom` includa `"*"` |
    | `disabled` | Blocca tutti i messaggi diretti |

    `allowFrom` accetta numeri in formato E.164 (normalizzati internamente). È esclusivamente un elenco di controllo degli accessi per i mittenti dei messaggi diretti: non limita gli invii espliciti in uscita verso JID di gruppo o JID di canale `@newsletter`.

    Sostituzione per più account: `channels.whatsapp.accounts.<id>.dmPolicy` (e `.allowFrom`) hanno la precedenza sui valori predefiniti a livello di canale per tale account.

    Note sul runtime:

    - gli abbinamenti persistono nell'archivio delle autorizzazioni del canale e vengono uniti con gli `allowFrom` configurati
    - l'automazione pianificata e il fallback del destinatario dell'Heartbeat usano destinazioni di consegna esplicite o gli `allowFrom` configurati; le approvazioni degli abbinamenti nei DM non implicano l'uso come destinatari di Cron/Heartbeat
    - se non è configurato alcun elenco di autorizzazione, il proprio numero collegato è consentito per impostazione predefinita
    - OpenClaw non abbina mai automaticamente i DM `fromMe` in uscita (messaggi inviati a sé stessi dal dispositivo collegato)

  </Tab>

  <Tab title="Criteri per i gruppi ed elenchi di autorizzazione">
    L'accesso ai gruppi prevede due livelli:

    1. **Elenco di autorizzazione per l'appartenenza ai gruppi** (`channels.whatsapp.groups`): se `groups` viene omesso, tutti i gruppi sono idonei; se presente, funge da elenco di autorizzazione dei gruppi (`"*"` li ammette tutti).
    2. **Criterio per i mittenti dei gruppi** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`): `open` ignora l'elenco di autorizzazione dei mittenti, `allowlist` richiede una corrispondenza con `groupAllowFrom` (o `*`), `disabled` blocca tutti i messaggi in entrata dei gruppi.

    Se `groupAllowFrom` non è impostato, i controlli sui mittenti ricorrono a `allowFrom` quando contiene voci. Gli elenchi di autorizzazione dei mittenti vengono valutati prima dell'attivazione tramite menzione/risposta.

    Se non esiste alcun blocco `channels.whatsapp`, in fase di esecuzione si ricorre a `groupPolicy: "allowlist"` (con un avviso nel log), anche se `channels.defaults.groupPolicy` è impostato su un valore diverso.

    <Note>
    La risoluzione dell'appartenenza ai gruppi dispone di una protezione per gli account singoli: se è configurato un solo account WhatsApp e il relativo `accounts.<id>.groups` è un oggetto vuoto esplicito (`{}`), viene considerato "non impostato" e si ricorre alla mappa `channels.whatsapp.groups` radice, anziché bloccare silenziosamente ogni gruppo. Con 2 o più account configurati, una mappa dell'account esplicitamente vuota rimane vuota e non ricorre al fallback: ciò consente a un account di disabilitare intenzionalmente tutti i gruppi senza influire sugli altri.
    </Note>

  </Tab>

  <Tab title="Menzioni e /activation">
    Per impostazione predefinita, le risposte nei gruppi richiedono una menzione. Il rilevamento delle menzioni include:

    - menzioni WhatsApp esplicite dell'identità del bot
    - pattern regex configurati per le menzioni (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - trascrizioni delle note vocali in entrata per i messaggi di gruppo autorizzati
    - rilevamento implicito delle risposte al bot (il mittente della risposta corrisponde all'identità del bot)

    Sicurezza: una citazione/risposta soddisfa soltanto il requisito della menzione, ma **non** concede l'autorizzazione al mittente. Con `groupPolicy: "allowlist"`, i mittenti non inclusi nell'elenco di autorizzazione rimangono bloccati anche quando rispondono al messaggio di un utente autorizzato.

    Comando di attivazione a livello di sessione: `/activation mention` o `/activation always`. Aggiorna lo stato della sessione (non la configurazione globale) ed è riservato al proprietario.

  </Tab>
</Tabs>

## Associazioni ACP configurate

WhatsApp supporta associazioni ACP persistenti tramite `bindings[]` di primo livello:

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

Le chat dirette corrispondono ai numeri E.164; i gruppi corrispondono ai JID dei gruppi WhatsApp. Gli elenchi di autorizzazione dei gruppi, il criterio per i mittenti e i requisiti di menzione/attivazione vengono applicati prima che OpenClaw garantisca l'esistenza della sessione ACP associata. Un'associazione corrispondente assume il controllo dell'instradamento: i gruppi di trasmissione non distribuiscono quel turno alle normali sessioni WhatsApp.

## Comportamento del numero personale e della chat con sé stessi

Quando il proprio numero collegato è presente anche in `allowFrom`, si attivano le protezioni per la chat con sé stessi: vengono omesse le conferme di lettura per i turni della chat con sé stessi, viene ignorato il comportamento di attivazione automatica tramite JID di menzione che causerebbe una notifica a sé stessi e le risposte vengono indirizzate per impostazione predefinita a `[{identity.name}]` (o `[openclaw]`) quando `messages.responsePrefix` non è impostato.

## Normalizzazione dei messaggi e contesto

<AccordionGroup>
  <Accordion title="Contenitore in entrata e contesto della risposta">
    I messaggi in arrivo vengono racchiusi nel contenitore condiviso per i messaggi in entrata. Una risposta citata aggiunge il contesto nel seguente formato:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    I metadati della risposta (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 del mittente) vengono compilati quando disponibili. Se la destinazione citata è un contenuto multimediale scaricabile, OpenClaw lo salva tramite il normale archivio dei contenuti multimediali in entrata ed espone `MediaPath`/`MediaType`, affinché l'agente possa esaminarlo direttamente anziché visualizzare soltanto `<media:image>`.

  </Accordion>

  <Accordion title="Segnaposto multimediali ed estrazione di posizione/contatti">
    I messaggi contenenti soltanto contenuti multimediali vengono normalizzati nei segnaposto: `<media:image>`, `<media:video>`, `<media:audio>`, `<media:document>`, `<media:sticker>`.

    Le note vocali autorizzate dei gruppi vengono trascritte prima del controllo della menzione quando il corpo contiene soltanto `<media:audio>`, pertanto pronunciare la menzione del bot nella nota vocale può attivare la risposta. Se la trascrizione continua a non menzionare il bot, rimane nella cronologia in sospeso del gruppo anziché essere sostituita dal segnaposto grezzo.

    I corpi delle posizioni vengono visualizzati come testo sintetico con le coordinate. Le etichette/i commenti delle posizioni e i dettagli dei contatti/vCard vengono visualizzati come metadati non attendibili delimitati, non come testo incorporato nel prompt.

  </Accordion>

  <Accordion title="Inserimento della cronologia in sospeso dei gruppi">
    I messaggi di gruppo non elaborati vengono memorizzati nel buffer e inseriti come contesto quando il bot viene infine attivato.

    - limite predefinito: `50`
    - configurazione: `channels.whatsapp.historyLimit`, fallback `messages.groupChat.historyLimit`
    - `0` disabilita

    Marcatori di inserimento: `[Chat messages since your last reply - for context]` e `[Current message - respond to this]`.

  </Accordion>

  <Accordion title="Conferme di lettura">
    Abilitate per impostazione predefinita per i messaggi in entrata accettati. Per disabilitarle globalmente:

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    Sostituzione per account: `channels.whatsapp.accounts.<id>.sendReadReceipts`. I turni della chat con sé stessi omettono le conferme di lettura anche quando sono abilitate globalmente.

  </Accordion>
</AccordionGroup>

## Consegna, suddivisione e contenuti multimediali

<AccordionGroup>
  <Accordion title="Suddivisione del testo">
    - limite predefinito dei frammenti: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.streaming.chunkMode = "length" | "newline"`; `newline` privilegia i confini dei paragrafi (righe vuote), quindi ricorre alla suddivisione sicura in base alla lunghezza

  </Accordion>

  <Accordion title="Comportamento dei contenuti multimediali in uscita">
    - supporta payload di immagini, video, audio (nota vocale PTT) e documenti
    - l'audio viene inviato come payload Baileys `audio` con `ptt: true`, visualizzato come nota vocale push-to-talk; `audioAsVoice` viene conservato nei payload di risposta, affinché l'output delle note vocali TTS rimanga su questo percorso indipendentemente dal formato sorgente del provider
    - l'audio Ogg/Opus nativo viene inviato come `audio/ogg; codecs=opus`; qualsiasi altro formato (incluso l'output MP3/WebM TTS di Microsoft Edge) viene transcodificato con `ffmpeg` in Ogg/Opus mono a 48 kHz prima della consegna PTT
    - `/tts latest` invia l'ultima risposta dell'assistente come un'unica nota vocale e impedisce invii ripetuti della stessa risposta; `/tts chat on|off|default` controlla il TTS automatico per la chat corrente
    - abilitare `gifPlayback: true` nell'invio di video consente la riproduzione come GIF animata
    - `forceDocument`/`asDocument` instrada immagini, GIF e video in uscita attraverso il payload per documenti di Baileys per evitare la compressione multimediale di WhatsApp, conservando il nome file e il tipo MIME risolti
    - le didascalie si applicano al primo elemento multimediale di una risposta con più contenuti multimediali, eccetto le note vocali PTT: l'audio viene inviato per primo senza didascalia, quindi la didascalia viene inviata come messaggio di testo separato (i client WhatsApp non visualizzano in modo coerente le didascalie delle note vocali)
    - la sorgente multimediale può essere HTTP(S), `file://` o un percorso locale

  </Accordion>

  <Accordion title="Limiti delle dimensioni dei contenuti multimediali e comportamento di fallback">
    - limite di salvataggio in entrata e limite di invio in uscita: `channels.whatsapp.mediaMaxMb` (valore predefinito `50`)
    - sostituzione per account: `channels.whatsapp.accounts.<id>.mediaMaxMb`
    - le immagini vengono ottimizzate automaticamente (ridimensionamento/variazione della qualità) per rispettare i limiti, a meno che `forceDocument`/`asDocument` non richieda la consegna come documento
    - in caso di errore nell'invio di contenuti multimediali, il fallback del primo elemento invia un avviso di testo anziché eliminare silenziosamente la risposta

  </Accordion>
</AccordionGroup>

## Citazione nelle risposte

`channels.whatsapp.replyToMode` controlla la citazione nativa nelle risposte (le risposte in uscita citano visibilmente il messaggio in entrata):

| Valore             | Comportamento                                                       |
| ----------------- | -------------------------------------------------------------- |
| `"off"` (predefinito) | Non citare mai; inviare come messaggio semplice                           |
| `"first"`         | Citare soltanto il primo frammento della risposta in uscita                      |
| `"all"`           | Citare ogni frammento della risposta in uscita                               |
| `"batched"`       | Citare le risposte raggruppate in coda; lasciare senza citazione le risposte immediate |

Sostituzione per account: `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## Livello delle reazioni

`channels.whatsapp.reactionLevel` controlla l'ampiezza con cui l'agente usa le reazioni emoji:

| Livello                 | Reazioni di conferma | Reazioni avviate dall'agente  |
| --------------------- | ------------- | -------------------------- |
| `"off"`               | No            | No                         |
| `"ack"`               | Sì           | No                         |
| `"minimal"` (predefinito) | Sì           | Sì, indicazioni prudenti |
| `"extensive"`         | Sì           | Sì, indicazioni incoraggiate   |

Sostituzione per account: `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## Reazioni di conferma

`channels.whatsapp.ackReaction` invia una reazione immediata alla ricezione di un messaggio in entrata, soggetta a `reactionLevel` (soppressa quando `"off"`):

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

Note: viene inviata immediatamente dopo l'accettazione del messaggio in entrata (prima della risposta); se `ackReaction` è presente senza `emoji`, WhatsApp usa l'emoji dell'identità dell'agente instradato, ricorrendo a "👀" come fallback (omettere `ackReaction` o impostare `emoji: ""` per non inviare alcuna conferma); gli errori vengono registrati, ma non bloccano la consegna della risposta; la modalità di gruppo `mentions` reagisce soltanto ai turni attivati da una menzione, mentre l'attivazione del gruppo `always` ignora tale controllo; WhatsApp usa soltanto `channels.whatsapp.ackReaction` (`messages.ackReaction` legacy non si applica qui).

## Reazioni allo stato del ciclo di vita

Impostare `messages.statusReactions.enabled: true` per consentire a WhatsApp di sostituire la reazione di conferma durante un turno, anziché lasciare un'emoji di ricezione statica, passando attraverso stati quali in coda, elaborazione, attività degli strumenti, Compaction, completamento ed errore:

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

Note: `channels.whatsapp.ackReaction` continua a controllare l'idoneità per i messaggi diretti e i gruppi; lo stato in coda usa la stessa emoji effettiva delle normali reazioni di conferma; WhatsApp dispone di un solo spazio per la reazione del bot per messaggio, pertanto gli aggiornamenti del ciclo di vita sostituiscono sul posto la reazione corrente; `messages.removeAckAfterReply: true` rimuove la reazione di stato finale dopo il periodo di permanenza configurato per completamento/errore; le categorie di emoji degli strumenti includono `tool`, `coding`, `web`, `deploy`, `build` e `concierge`.

## Account multipli e credenziali

<AccordionGroup>
  <Accordion title="Selezione dell'account e impostazioni predefinite">
    Gli ID account provengono da `channels.whatsapp.accounts`. La selezione dell'account predefinito è `default`, se presente; altrimenti viene usato il primo ID account configurato (in ordine alfabetico). Gli ID account vengono normalizzati internamente per la ricerca.
  </Accordion>

  <Accordion title="Percorsi delle credenziali e compatibilità con le versioni precedenti">
    - percorso di autenticazione corrente: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (backup: `creds.json.bak`)
    - l'autenticazione predefinita precedente in `~/.openclaw/credentials/` viene ancora riconosciuta/migrata per i flussi dell'account predefinito

  </Accordion>

  <Accordion title="Comportamento di disconnessione">
    `openclaw channels logout --channel whatsapp [--account <id>]` cancella lo stato di autenticazione WhatsApp per tale account. Quando un Gateway è raggiungibile, la disconnessione arresta prima il listener attivo per tale account, in modo che la sessione collegata smetta di ricevere messaggi prima del riavvio successivo. `openclaw channels remove --channel whatsapp` arresta inoltre il listener attivo prima di disabilitare o eliminare la configurazione dell'account.

    Nelle directory di autenticazione precedenti, `oauth.json` viene mantenuto mentre i file di autenticazione Baileys vengono rimossi.

  </Accordion>
</AccordionGroup>

## Strumenti, azioni e scritture della configurazione

- Il supporto degli strumenti dell'agente include l'azione di reazione di WhatsApp (`react`).
- Controlli delle azioni: `channels.whatsapp.actions.reactions`, `channels.whatsapp.actions.polls` (le azioni esistenti hanno come valore predefinito `true`), `channels.whatsapp.actions.calls` (valore predefinito `false`, vedere MeowCaller sopra).
- Le scritture della configurazione avviate dal canale sono abilitate per impostazione predefinita; disabilitarle tramite `channels.whatsapp.configWrites: false`.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Non collegato (codice QR richiesto)">
    Sintomo: lo stato del canale segnala che non è collegato.

```bash
openclaw channels login --channel whatsapp
openclaw channels status
```

  </Accordion>

  <Accordion title="Collegato ma disconnesso / ciclo di riconnessione">
    Sintomo: account collegato con disconnessioni o tentativi di riconnessione ripetuti.

    Gli account inattivi possono rimanere connessi oltre il normale timeout dei messaggi; il watchdog esegue il riavvio solo quando l'attività del trasporto WhatsApp Web si interrompe, il socket si chiude oppure l'attività a livello applicativo rimane silente oltre la finestra di sicurezza più lunga (vedere Modello di runtime sopra).

    Se i log mostrano ripetutamente `status=408 Request Time-out Connection was lost`, regolare le temporizzazioni del socket Baileys in `web.whatsapp`. Iniziare riducendo `keepAliveIntervalMs` al di sotto del timeout di inattività della rete e aumentando `connectTimeoutMs` sulle connessioni lente o con perdita di pacchetti:

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

    Se il ciclo persiste dopo aver corretto la connettività dell'host e le temporizzazioni, eseguire il backup della directory di autenticazione dell'account e ricollegarlo:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Se `~/.openclaw/logs/whatsapp-health.log` indica `Gateway inactive`, ma `openclaw gateway status` e `openclaw channels status --probe` risultano entrambi integri, eseguire `openclaw doctor`. Su Linux, doctor avvisa della presenza di voci crontab precedenti che richiamano lo script ritirato `~/.openclaw/bin/ensure-whatsapp.sh`; rimuovere tali voci con `crontab -e` — Cron può non disporre dell'ambiente del bus utente systemd e far sì che il vecchio script segnali erroneamente lo stato del Gateway.

  </Accordion>

  <Accordion title="Il login tramite QR scade dietro un proxy">
    Sintomo: `openclaw channels login --channel whatsapp` non riesce prima di mostrare un QR utilizzabile, con `status=408 Request Time-out` o una disconnessione del socket TLS.

    Il login di WhatsApp Web utilizza l'ambiente proxy standard dell'host del Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, varianti in minuscolo, `NO_PROXY`). Verificare che il processo del Gateway erediti l'ambiente proxy e che `NO_PROXY` non corrisponda a `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Nessun listener attivo durante l'invio">
    Gli invii in uscita non riescono immediatamente quando non esiste alcun listener del Gateway attivo per l'account di destinazione. Verificare che il Gateway sia in esecuzione e che l'account sia collegato.
  </Accordion>

  <Accordion title="La risposta compare nella trascrizione ma non in WhatsApp">
    Le righe della trascrizione registrano ciò che l'agente ha generato; la consegna su WhatsApp viene verificata separatamente. OpenClaw considera inviata una risposta automatica solo dopo che Baileys restituisce un ID messaggio in uscita per almeno un invio visibile di testo o contenuti multimediali.

    Le reazioni di conferma sono ricevute indipendenti che precedono la risposta: una reazione riuscita non dimostra che la successiva risposta testuale o multimediale sia stata accettata. Controllare nei log del Gateway la presenza di `auto-reply delivery failed` o `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Messaggi di gruppo ignorati inaspettatamente">
    Controllare nell'ordine seguente: `groupPolicy`, `groupAllowFrom`/`allowFrom`, le voci dell'elenco consentiti `groups`, il controllo delle menzioni (`requireMention` + modelli di menzione) e le chiavi duplicate in `openclaw.json` (le voci JSON5 successive sostituiscono quelle precedenti — mantenere un solo `groupPolicy` per ambito).

    Se `channels.whatsapp.groups` è presente, WhatsApp può comunque rilevare messaggi provenienti da altri gruppi, ma OpenClaw li scarta prima dell'instradamento della sessione. Aggiungere il JID del gruppo a `channels.whatsapp.groups`, oppure aggiungere `groups["*"]` per ammettere tutti i gruppi mantenendo l'autorizzazione del mittente sotto il controllo di `groupPolicy`/`groupAllowFrom`.

  </Accordion>

  <Accordion title="Avviso del runtime Bun">
    I Gateway OpenClaw richiedono Node. Bun non fornisce l'API `node:sqlite` utilizzata dall'archivio di stato canonico e doctor migra i servizi Bun precedenti a Node.
  </Accordion>
</AccordionGroup>

## Prompt di sistema

WhatsApp supporta prompt di sistema in stile Telegram per gruppi e chat dirette tramite le mappe `groups` e `direct`.

Risoluzione per i messaggi di gruppo: viene determinata innanzitutto la mappa `groups` effettiva — se l'account definisce una propria chiave `groups`, questa sostituisce completamente la mappa `groups` radice (senza unione profonda). La ricerca del prompt viene quindi eseguita su questa singola mappa risultante:

1. **Prompt specifico del gruppo** (`groups["<groupId>"].systemPrompt`): utilizzato quando la voce del gruppo esiste **e** la relativa chiave `systemPrompt` è definita. Una stringa vuota (`""`) sopprime il carattere jolly e non applica alcun prompt.
2. **Prompt con carattere jolly per i gruppi** (`groups["*"].systemPrompt`): utilizzato quando la voce specifica del gruppo è assente oppure esiste senza una chiave `systemPrompt`.

La risoluzione per i messaggi diretti segue lo stesso schema con la mappa `direct` e `direct["*"]`.

<Note>
`dms` rimane il contenitore leggero per le sostituzioni della cronologia per singolo messaggio diretto (`dms.<id>.historyLimit`). Le sostituzioni dei prompt si trovano in `direct`.
</Note>

<Note>
Questo comportamento, in cui l'account sostituisce la radice per la risoluzione dei prompt, è una semplice sostituzione superficiale: qualsiasi chiave `groups`/`direct` dell'account, incluso un oggetto vuoto esplicito, sostituisce la mappa radice. È diverso dal controllo dell'elenco consentiti relativo all'appartenenza ai gruppi descritto sopra, che prevede una rete di sicurezza per un singolo account in caso di `groups: {}` accidentalmente vuoto.
</Note>

**Differenza rispetto a Telegram:** Telegram sopprime `groups` radice per ogni account in una configurazione multi-account (anche per gli account senza un proprio `groups`) per impedire che un bot riceva messaggi da gruppi a cui non appartiene. WhatsApp non applica questa protezione: `groups`/`direct` radice vengono ereditati da qualsiasi account privo di una propria sostituzione, indipendentemente dal numero di account. In una configurazione WhatsApp multi-account, definire esplicitamente la mappa completa in ogni account se si desiderano prompt specifici per account.

Comportamento importante:

- `channels.whatsapp.groups` è sia una mappa di configurazione per gruppo sia l'elenco consentiti dei gruppi a livello di chat. Nell'ambito radice o dell'account, `groups["*"]` significa "sono ammessi tutti i gruppi" per tale ambito.
- Aggiungere un carattere jolly `systemPrompt` solo quando si desidera già che tale ambito ammetta tutti i gruppi. Per mantenere idoneo solo un insieme fisso di ID gruppo, ripetere il prompt in ogni voce esplicitamente consentita anziché utilizzare `groups["*"]`.
- L'ammissione del gruppo e l'autorizzazione del mittente sono controlli separati. `groups["*"]` amplia l'insieme dei gruppi che raggiungono la gestione dei gruppi; non autorizza ogni mittente in tali gruppi — questo rimane sotto il controllo di `groupPolicy`/`groupAllowFrom`.
- `channels.whatsapp.direct` non ha un effetto collaterale equivalente per i messaggi diretti: `direct["*"]` fornisce soltanto una configurazione predefinita dopo che un messaggio diretto è già stato ammesso da `dmPolicy` più `allowFrom` o dalle regole dell'archivio di associazione.

Esempio:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Utilizzare solo se tutti i gruppi devono essere ammessi nell'ambito radice.
        // Si applica a tutti gli account che non definiscono una propria mappa groups.
        "*": { systemPrompt: "Prompt predefinito per tutti i gruppi." },
      },
      direct: {
        // Si applica a tutti gli account che non definiscono una propria mappa direct.
        "*": { systemPrompt: "Prompt predefinito per tutte le chat dirette." },
      },
      accounts: {
        work: {
          groups: {
            // Questo account definisce i propri gruppi, quindi i gruppi radice vengono
            // sostituiti completamente. Per mantenere un carattere jolly, definire esplicitamente "*" anche qui.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Concentrarsi sulla gestione dei progetti.",
            },
            // Utilizzare solo se tutti i gruppi devono essere ammessi in questo account.
            "*": { systemPrompt: "Prompt predefinito per i gruppi di lavoro." },
          },
          direct: {
            // Questo account definisce una propria mappa direct, quindi le voci direct radice
            // vengono sostituite completamente. Per mantenere un carattere jolly, definire esplicitamente "*" anche qui.
            "+15551234567": { systemPrompt: "Prompt per una specifica chat diretta di lavoro." },
            "*": { systemPrompt: "Prompt predefinito per le chat dirette di lavoro." },
          },
        },
      },
    },
  },
}
```

## Riferimenti alla configurazione

Riferimento principale: [Riferimento alla configurazione - WhatsApp](/it/gateway/config-channels#whatsapp)

| Area             | Campi                                                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| Accesso          | `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`                                             |
| Consegna         | `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`      |
| Multi-account    | `accounts.<id>.enabled`, `accounts.<id>.authDir` e altre sostituzioni per account                              |
| Operazioni       | `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`       |
| Comportamento della sessione | `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`                                   |
| Prompt           | `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt` |

## Argomenti correlati

- [Associazione](/it/channels/pairing)
- [Gruppi](/it/channels/groups)
- [Sicurezza](/it/gateway/security)
- [Instradamento dei canali](/it/channels/channel-routing)
- [Instradamento multi-agente](/it/concepts/multi-agent)
- [Risoluzione dei problemi](/it/channels/troubleshooting)
