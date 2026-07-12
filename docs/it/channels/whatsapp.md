---
read_when:
    - Lavorare sul comportamento del canale WhatsApp/web o sull'instradamento della posta in arrivo
summary: Supporto del canale WhatsApp, controlli di accesso, comportamento di recapito e operazioni
title: WhatsApp
x-i18n:
    generated_at: "2026-07-12T06:50:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f416d2b7a75e9c4798ded34a1ec5d9d7f49ab99a56977f1383347936fe47af55
    source_path: channels/whatsapp.md
    workflow: 16
---

Stato: pronto per la produzione tramite WhatsApp Web (Baileys). Il Gateway gestisce le sessioni collegate; non esiste un canale WhatsApp Twilio separato.

## Installazione

`openclaw onboard` e `openclaw channels add --channel whatsapp` richiedono di installare il Plugin la prima volta che lo si seleziona; se il Plugin non è presente, `openclaw channels login --channel whatsapp` offre lo stesso flusso di installazione. I checkout di sviluppo usano il percorso locale del Plugin; le installazioni stable/beta installano prima `@openclaw/whatsapp` da ClawHub, con ripiego su npm. Il runtime di WhatsApp viene distribuito separatamente dal pacchetto npm principale di OpenClaw, quindi le sue dipendenze di runtime rimangono associate al Plugin esterno. Installazione manuale:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Usare il pacchetto npm semplice (`@openclaw/whatsapp`) solo come ripiego per il registro; bloccare una versione esatta solo per un'installazione riproducibile.

<CardGroup cols={3}>
  <Card title="Associazione" icon="link" href="/it/channels/pairing">
    Il criterio predefinito per i messaggi diretti è l'associazione per i mittenti sconosciuti.
  </Card>
  <Card title="Risoluzione dei problemi dei canali" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica tra canali e procedure operative di riparazione.
  </Card>
  <Card title="Configurazione del Gateway" icon="settings" href="/it/gateway/configuration">
    Schemi ed esempi completi di configurazione dei canali.
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

    L'accesso avviene esclusivamente tramite QR. Sugli host remoti o senza interfaccia grafica, predisporre un metodo affidabile per inviare il QR attivo al telefono prima di avviare l'accesso; i QR visualizzati nel terminale, gli screenshot o gli allegati in chat possono scadere durante il trasferimento.

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

    Le richieste di associazione scadono dopo 1 ora; sono consentite al massimo 3 richieste in sospeso per account.

  </Step>
</Steps>

<Note>
È consigliato un numero WhatsApp separato, per il quale configurazione e metadati sono ottimizzati, ma sono pienamente supportate anche le configurazioni con numero personale e chat con sé stessi.
</Note>

## Schemi di distribuzione

<AccordionGroup>
  <Accordion title="Numero dedicato (consigliato)">
    - identità WhatsApp separata per OpenClaw
    - elenchi consentiti per i messaggi diretti e confini di instradamento più chiari
    - minore probabilità di confusione con le chat con sé stessi

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
    La procedura iniziale supporta la modalità con numero personale e scrive una configurazione di base adatta alle chat con sé stessi: `dmPolicy: "allowlist"`, `allowFrom` contenente il proprio numero e `selfChatMode: true`. Le protezioni di runtime per le chat con sé stessi si basano sul numero personale collegato e su `allowFrom`.
  </Accordion>
</AccordionGroup>

## Modello di runtime

- Il Gateway gestisce il socket WhatsApp e il ciclo di riconnessione.
- Un watchdog monitora indipendentemente due segnali: l'attività del trasporto WhatsApp Web non elaborata e l'attività dei messaggi dell'applicazione. Una sessione silenziosa ma connessa non viene riavviata solo perché non sono arrivati messaggi di recente; la riconnessione viene forzata soltanto quando i frame di trasporto non arrivano più per una finestra interna fissa, non configurabile dall'utente, oppure quando i messaggi dell'applicazione rimangono assenti per oltre 4 volte il normale timeout dei messaggi. Subito dopo la riconnessione di una sessione attiva di recente, la prima finestra usa il normale timeout dei messaggi, più breve, anziché la finestra quadruplicata. OpenClaw può rispondere automaticamente ai messaggi offline che Baileys consegna nelle prime fasi della riconnessione, entro la durata della deduplicazione degli ID dei messaggi in ingresso; l'avvio iniziale mantiene la breve protezione contro la cronologia obsoleta.
- Le tempistiche del socket Baileys sono esplicite in `web.whatsapp.*`: `keepAliveIntervalMs` (intervallo dei ping dell'applicazione), `connectTimeoutMs` (timeout dell'handshake di apertura), `defaultQueryTimeoutMs` (attese delle query Baileys, oltre ai timeout di OpenClaw per invio e presenza in uscita e conferme di lettura in ingresso).
- Gli invii in uscita richiedono un listener WhatsApp attivo per l'account di destinazione; in caso contrario, non riescono immediatamente.
- Gli invii ai gruppi allegano metadati nativi delle menzioni per i token `@+<digits>` e `@<digits>` presenti nel testo e nelle didascalie multimediali, quando il token corrisponde ai metadati correnti di un partecipante, inclusi i gruppi basati su LID.
- Le chat di stato e broadcast (`@status`, `@broadcast`) vengono ignorate.
- Le chat dirette usano le regole di sessione dei messaggi diretti (`session.dmScope`; il valore predefinito `main` raggruppa i messaggi diretti nella sessione principale dell'agente). Le sessioni di gruppo sono isolate per JID (`agent:<agentId>:whatsapp:group:<jid>`).
- I canali e le newsletter di WhatsApp possono essere destinazioni esplicite in uscita tramite il relativo JID nativo `@newsletter`, usando i metadati di sessione del canale (`agent:<agentId>:whatsapp:channel:<jid>`) anziché la semantica dei messaggi diretti.
- Il trasporto WhatsApp Web rispetta le variabili d'ambiente proxy standard sull'host del Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` e le varianti in minuscolo). Preferire la configurazione proxy a livello di host rispetto alle impostazioni per singolo canale.
- Quando `messages.removeAckAfterReply` è abilitato, OpenClaw rimuove la reazione di conferma dopo la consegna di una risposta visibile.

## Chiamare il richiedente corrente con MeowCaller (sperimentale)

Il Plugin può rendere disponibile `whatsapp_call` nei turni dell'agente originati da WhatsApp. Usa [MeowCaller](https://github.com/purpshell/meowcaller) per effettuare una chiamata vocale WhatsApp al richiedente autorizzato corrente e riprodurre un messaggio TTS di OpenClaw dopo la risposta. Lo strumento non dispone di un parametro per il numero di destinazione, quindi un prompt non può reindirizzare la chiamata. È disabilitato per impostazione predefinita.

<Warning>
MeowCaller è sperimentale, non dispone di una versione con tag e usa una sessione di dispositivo collegato whatsmeow associata separatamente: non può riutilizzare le credenziali Baileys del Plugin. L'associazione aggiunge un altro dispositivo collegato allo stesso account WhatsApp; eseguire la scansione con l'identità usata da OpenClaw. La modalità con numero personale e chat con sé stessi non può chiamare sé stessa; usare un numero OpenClaw dedicato per chiamare il proprio numero personale.
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

    Quando l'opzione è assente o impostata su `false`, OpenClaw non rende disponibile lo strumento `whatsapp_call`.

  </Step>

  <Step title="Installare la CLI di MeowCaller revisionata">

    L'adattatore richiede un eseguibile `meowcaller` nel `PATH` dell'host del Gateway. Finché la [PR n. 7 di MeowCaller](https://github.com/purpshell/meowcaller/pull/7) non sarà integrata, compilare il ramo revisionato:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    Assicurarsi che `$HOME/.local/bin` sia incluso nel `PATH` del servizio Gateway. Questa revisione dispone dei comandi espliciti `pair` e `notify`, destinato al solo invio; `notify` non accede a microfono, altoparlante, dispositivo video o acquisizione diagnostica. Non sostituirlo con il comando `play` della CLI di esempio upstream.

  </Step>

  <Step title="Associare il dispositivo collegato di MeowCaller">

    Chiedere all'agente WhatsApp di controllare la configurazione delle chiamate; l'azione di stato di `whatsapp_call` riporta la directory di stato specifica dell'account e il comando di associazione. Per l'account predefinito:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Eseguire il comando in modalità interattiva, scansionare il QR da **WhatsApp > Linked devices** e attendere `MeowCaller linked device ready`. Mantenere privato `wa-voip.db`: contiene la sessione di MeowCaller. Gli account non predefiniti ricevono dall'azione di stato il proprio percorso di archiviazione; su Windows, eseguire il relativo comando PowerShell.

  </Step>

  <Step title="Configurare il TTS ed effettuare una chiamata da WhatsApp">

    Configurare un [fornitore TTS](/it/tools/tts) compatibile con la telefonia, riavviare il Gateway, quindi inviare una richiesta come `Chiamami e dì che la compilazione è terminata.` Lo strumento ricava il mittente dal contesto attendibile in ingresso, sintetizza un file WAV privato temporaneo, esegue MeowCaller entro una finestra di chiamata limitata ed elimina successivamente il file audio. OpenClaw passa esplicitamente l'archivio dell'account, attende uno stato di uscita pari a zero dopo risposta, riproduzione e riaggancio e considera un timeout o uno stato di uscita diverso da zero come una chiamata allo strumento non riuscita.

  </Step>
</Steps>

Limiti: solo chiamate audio in uscita individuali, nessun numero di destinazione arbitrario, nessuna autenticazione condivisa con la connessione della chat, nessuna chiamata a sé stessi dalla modalità con numero personale e chat con sé stessi, audio sintetizzato limitato a 60 secondi, nessuna conferma di udibilità sul telefono oltre al completamento di risposta, riproduzione e riaggancio di MeowCaller; OpenClaw arresta inoltre il processo ausiliario dopo una finestra limitata di 115-175 secondi, che comprende le fasi di connessione, risposta, riproduzione e arresto di MeowCaller.

## Richieste di approvazione

WhatsApp può visualizzare le richieste di approvazione dell'esecuzione e dei Plugin come reazioni `👍`/`👎`, controllate dalla configurazione di inoltro delle approvazioni di primo livello:

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

`approvals.exec` e `approvals.plugin` sono indipendenti; abilitare WhatsApp come canale collega soltanto il trasporto e non invia nulla, a meno che la famiglia di approvazioni corrispondente non sia abilitata e instradata verso quel canale. La modalità di sessione invia approvazioni emoji native solo per le approvazioni originate da WhatsApp. La modalità di destinazione usa la pipeline di inoltro condivisa per le destinazioni esplicite e non crea una distribuzione separata dei messaggi diretti agli approvatori.

Le reazioni di approvazione di WhatsApp richiedono approvatori espliciti in `allowFrom` oppure `"*"`. `defaultTo` imposta le normali destinazioni predefinite dei messaggi, non un elenco di approvatori. I comandi manuali `/approve` seguono comunque il normale percorso di autorizzazione del mittente WhatsApp prima della risoluzione dell'approvazione.

## Hook dei Plugin e privacy

I messaggi WhatsApp in ingresso possono contenere dati personali, numeri di telefono, identificatori di gruppo, nomi dei mittenti e campi di correlazione delle sessioni. WhatsApp non trasmette ai Plugin i payload dell'hook `message_received` in ingresso, a meno che non si abiliti esplicitamente questa funzione:

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

Limitare l'abilitazione a un singolo account tramite `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived`. Abilitare questa opzione solo per i Plugin a cui si affidano i contenuti e gli identificatori WhatsApp in ingresso.

## Controllo degli accessi e attivazione

<Tabs>
  <Tab title="Criterio per i messaggi diretti">
    `channels.whatsapp.dmPolicy`:

    | Valore | Comportamento |
    | --- | --- |
    | `pairing` (predefinito) | I mittenti sconosciuti richiedono l'associazione; il proprietario approva |
    | `allowlist` | Sono ammessi solo i mittenti inclusi in `allowFrom` |
    | `open` | Richiede che `allowFrom` includa `"*"` |
    | `disabled` | Blocca tutti i messaggi diretti |

    `allowFrom` accetta numeri in formato E.164, normalizzati internamente. È esclusivamente un elenco di controllo degli accessi per i mittenti dei messaggi diretti: non limita gli invii espliciti in uscita verso JID di gruppo o JID di canale `@newsletter`.

    Sostituzione per configurazioni con più account: `channels.whatsapp.accounts.<id>.dmPolicy` e `.allowFrom` hanno la precedenza sui valori predefiniti a livello di canale per quell'account.

    Note sul runtime:

    - gli abbinamenti persistono nell'archivio delle autorizzazioni del canale e vengono uniti al valore `allowFrom` configurato
    - l'automazione pianificata e il destinatario di ripiego dell'Heartbeat usano destinazioni di consegna esplicite o il valore `allowFrom` configurato; le approvazioni degli abbinamenti nei messaggi diretti non implicano che tali utenti siano destinatari di Cron/Heartbeat
    - se non è configurato alcun elenco di autorizzazioni, il numero personale collegato è consentito per impostazione predefinita
    - OpenClaw non abbina mai automaticamente i messaggi diretti `fromMe` in uscita (messaggi inviati a sé stessi dal dispositivo collegato)

  </Tab>

  <Tab title="Criteri per i gruppi ed elenchi di autorizzazioni">
    L'accesso ai gruppi prevede due livelli:

    1. **Elenco di autorizzazioni per l'appartenenza ai gruppi** (`channels.whatsapp.groups`): se `groups` è omesso, tutti i gruppi sono idonei; se presente, funge da elenco di autorizzazioni per i gruppi (`"*"` li ammette tutti).
    2. **Criterio per i mittenti nei gruppi** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`): `open` ignora l'elenco di autorizzazioni dei mittenti, `allowlist` richiede una corrispondenza in `groupAllowFrom` (o `*`), mentre `disabled` blocca tutti i messaggi di gruppo in entrata.

    Se `groupAllowFrom` non è impostato, i controlli sui mittenti usano come ripiego `allowFrom` quando contiene delle voci. Gli elenchi di autorizzazioni dei mittenti vengono valutati prima dell'attivazione tramite menzione/risposta.

    Se non esiste alcun blocco `channels.whatsapp`, in fase di esecuzione viene usato come ripiego `groupPolicy: "allowlist"` (con un avviso nel registro), anche se `channels.defaults.groupPolicy` è impostato su un altro valore.

    <Note>
    La risoluzione dell'appartenenza ai gruppi dispone di una protezione per gli account singoli: se è configurato un solo account WhatsApp e il relativo `accounts.<id>.groups` è un oggetto vuoto esplicito (`{}`), viene considerato come "non impostato" e viene usata come ripiego la mappa radice `channels.whatsapp.groups`, anziché bloccare silenziosamente tutti i gruppi. Con 2 o più account configurati, una mappa dell'account esplicitamente vuota rimane vuota e non usa alcun ripiego: ciò consente a un account di disabilitare intenzionalmente tutti i gruppi senza influire sugli altri account.
    </Note>

  </Tab>

  <Tab title="Menzioni e /activation">
    Per impostazione predefinita, le risposte nei gruppi richiedono una menzione. Il rilevamento delle menzioni include:

    - menzioni WhatsApp esplicite dell'identità del bot
    - espressioni regolari configurate per le menzioni (`agents.list[].groupChat.mentionPatterns`, con ripiego su `messages.groupChat.mentionPatterns`)
    - trascrizioni delle note vocali in entrata per i messaggi di gruppo autorizzati
    - rilevamento implicito delle risposte al bot (il mittente a cui si risponde corrisponde all'identità del bot)

    Sicurezza: una citazione/risposta soddisfa solo il requisito della menzione, ma **non** concede l'autorizzazione al mittente. Con `groupPolicy: "allowlist"`, i mittenti non inclusi nell'elenco di autorizzazioni rimangono bloccati anche quando rispondono al messaggio di un utente autorizzato.

    Comando di attivazione a livello di sessione: `/activation mention` o `/activation always`. Aggiorna lo stato della sessione (non la configurazione globale) ed è riservato al proprietario.

  </Tab>
</Tabs>

## Associazioni ACP configurate

WhatsApp supporta associazioni ACP persistenti tramite `bindings[]` al livello principale:

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

Le chat dirette corrispondono ai numeri E.164; i gruppi corrispondono ai JID di gruppo WhatsApp. Gli elenchi di autorizzazioni dei gruppi, i criteri per i mittenti e il requisito di attivazione tramite menzione vengono applicati prima che OpenClaw verifichi l'esistenza della sessione ACP associata. Un'associazione corrispondente assume il controllo dell'instradamento: i gruppi di trasmissione non distribuiscono quel turno alle normali sessioni WhatsApp.

## Comportamento del numero personale e della chat con sé stessi

Quando il numero personale collegato è presente anche in `allowFrom`, si attivano le protezioni per le chat con sé stessi: le conferme di lettura vengono omesse per i turni di queste chat, viene ignorato il comportamento di attivazione automatica tramite JID di menzione che invierebbe una notifica a sé stessi e, quando `messages.responsePrefix` non è impostato, le risposte usano per impostazione predefinita `[{identity.name}]` (o `[openclaw]`).

## Normalizzazione dei messaggi e contesto

<AccordionGroup>
  <Accordion title="Busta in entrata e contesto della risposta">
    I messaggi in arrivo vengono racchiusi nella busta condivisa per i messaggi in entrata. Una risposta con citazione aggiunge il contesto nel seguente formato:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    I metadati della risposta (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 del mittente) vengono compilati quando disponibili. Se la destinazione citata è un contenuto multimediale scaricabile, OpenClaw lo salva tramite il normale archivio dei contenuti multimediali in entrata ed espone `MediaPath`/`MediaType`, affinché l'agente possa esaminarlo direttamente anziché visualizzare soltanto `<media:image>`.

  </Accordion>

  <Accordion title="Segnaposto multimediali ed estrazione di posizione/contatti">
    I messaggi contenenti solo elementi multimediali vengono normalizzati nei segnaposto: `<media:image>`, `<media:video>`, `<media:audio>`, `<media:document>`, `<media:sticker>`.

    Le note vocali autorizzate nei gruppi vengono trascritte prima di verificare il requisito della menzione quando il corpo contiene soltanto `<media:audio>`; in questo modo, pronunciare la menzione del bot nella nota vocale può attivare la risposta. Se la trascrizione continua a non menzionare il bot, rimane nella cronologia di gruppo in sospeso anziché essere sostituita dal segnaposto non elaborato.

    I corpi dei messaggi di posizione vengono visualizzati come testo conciso con le coordinate. Le etichette/i commenti di posizione e i dettagli dei contatti/vCard vengono visualizzati come metadati non attendibili delimitati, non come testo incorporato nel prompt.

  </Accordion>

  <Accordion title="Inserimento della cronologia di gruppo in sospeso">
    I messaggi di gruppo non elaborati vengono memorizzati temporaneamente e inseriti come contesto quando il bot viene infine attivato.

    - limite predefinito: `50`
    - configurazione: `channels.whatsapp.historyLimit`, con ripiego su `messages.groupChat.historyLimit`
    - `0` disabilita la funzionalità

    Marcatori di inserimento: `[Chat messages since your last reply - for context]` e `[Current message - respond to this]`.

  </Accordion>

  <Accordion title="Conferme di lettura">
    Abilitate per impostazione predefinita per i messaggi in entrata accettati. Per disabilitarle globalmente:

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    Impostazione sostitutiva per account: `channels.whatsapp.accounts.<id>.sendReadReceipts`. I turni delle chat con sé stessi omettono le conferme di lettura anche quando sono abilitate globalmente.

  </Accordion>
</AccordionGroup>

## Consegna, suddivisione in blocchi e contenuti multimediali

<AccordionGroup>
  <Accordion title="Suddivisione del testo in blocchi">
    - limite predefinito per blocco: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`; `newline` privilegia i confini dei paragrafi (righe vuote), quindi usa come ripiego una suddivisione sicura in base alla lunghezza

  </Accordion>

  <Accordion title="Comportamento dei contenuti multimediali in uscita">
    - supporta payload di immagini, video, audio (nota vocale PTT) e documenti
    - l'audio viene inviato come payload `audio` di Baileys con `ptt: true`, apparendo come una nota vocale push-to-talk; `audioAsVoice` viene mantenuto nei payload di risposta, affinché l'output delle note vocali TTS rimanga su questo percorso indipendentemente dal formato sorgente del fornitore
    - l'audio Ogg/Opus nativo viene inviato come `audio/ogg; codecs=opus`; qualsiasi altro formato (incluso l'output MP3/WebM di TTS di Microsoft Edge) viene transcodificato con `ffmpeg` in Ogg/Opus mono a 48 kHz prima della consegna PTT
    - `/tts latest` invia l'ultima risposta dell'assistente come un'unica nota vocale ed evita invii ripetuti della stessa risposta; `/tts chat on|off|default` controlla il TTS automatico per la chat corrente
    - `gifPlayback: true` nei video inviati abilita la riproduzione delle GIF animate
    - `forceDocument`/`asDocument` instrada immagini, GIF e video in uscita tramite il payload per documenti di Baileys per evitare la compressione multimediale di WhatsApp, preservando il nome file e il tipo MIME risolti
    - le didascalie vengono applicate al primo elemento multimediale di una risposta con più elementi, eccetto le note vocali PTT: l'audio viene inviato per primo senza didascalia, quindi la didascalia viene inviata come messaggio di testo separato (i client WhatsApp non visualizzano in modo coerente le didascalie delle note vocali)
    - la sorgente multimediale può essere HTTP(S), `file://` o un percorso locale

  </Accordion>

  <Accordion title="Limiti delle dimensioni dei contenuti multimediali e comportamento di ripiego">
    - limite di salvataggio in entrata e limite di invio in uscita: `channels.whatsapp.mediaMaxMb` (valore predefinito `50`)
    - impostazione sostitutiva per account: `channels.whatsapp.accounts.<id>.mediaMaxMb`
    - le immagini vengono ottimizzate automaticamente (ridimensionamento/variazione della qualità) per rispettare i limiti, salvo quando `forceDocument`/`asDocument` richiede la consegna come documento
    - se l'invio dei contenuti multimediali non riesce, il ripiego per il primo elemento invia un avviso testuale anziché eliminare silenziosamente la risposta

  </Accordion>
</AccordionGroup>

## Citazione nelle risposte

`channels.whatsapp.replyToMode` controlla la citazione nativa nelle risposte (le risposte in uscita citano visibilmente il messaggio in entrata):

| Valore            | Comportamento                                                        |
| ----------------- | -------------------------------------------------------------------- |
| `"off"` (predefinito) | Non cita mai; invia come messaggio semplice                      |
| `"first"`         | Cita soltanto il primo blocco della risposta in uscita               |
| `"all"`           | Cita ogni blocco della risposta in uscita                            |
| `"batched"`       | Cita le risposte raggruppate in coda; non cita le risposte immediate |

Impostazione sostitutiva per account: `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## Livello delle reazioni

`channels.whatsapp.reactionLevel` controlla l'ampiezza con cui l'agente usa le reazioni emoji:

| Livello               | Reazioni di conferma | Reazioni avviate dall'agente      |
| --------------------- | -------------------- | --------------------------------- |
| `"off"`               | No                   | No                                |
| `"ack"`               | Sì                   | No                                |
| `"minimal"` (predefinito) | Sì               | Sì, indicazioni prudenti          |
| `"extensive"`         | Sì                   | Sì, indicazioni incoraggianti     |

Impostazione sostitutiva per account: `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## Reazioni di conferma

`channels.whatsapp.ackReaction` invia una reazione immediata alla ricezione di un messaggio in entrata, subordinata a `reactionLevel` (soppressa quando è `"off"`):

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

Note: viene inviata immediatamente dopo l'accettazione del messaggio in entrata (prima della risposta); se `ackReaction` è presente senza `emoji`, WhatsApp usa l'emoji dell'identità dell'agente instradato, con "👀" come ripiego (omettere `ackReaction` o impostare `emoji: ""` per non inviare alcuna conferma); gli errori vengono registrati ma non bloccano la consegna della risposta; la modalità di gruppo `mentions` reagisce soltanto ai turni attivati da una menzione, mentre l'attivazione di gruppo `always` ignora questo controllo; WhatsApp usa esclusivamente `channels.whatsapp.ackReaction` (il precedente `messages.ackReaction` non si applica qui).

## Reazioni allo stato del ciclo di vita

Impostare `messages.statusReactions.enabled: true` per consentire a WhatsApp di sostituire la reazione di conferma durante un turno anziché lasciare un'emoji di ricezione statica, passando ciclicamente tra stati quali in coda, elaborazione, attività degli strumenti, Compaction, completato ed errore:

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

Note: `channels.whatsapp.ackReaction` continua a controllare l'idoneità per i messaggi diretti e i gruppi; lo stato in coda usa la stessa emoji effettiva delle normali reazioni di conferma; WhatsApp dispone di un solo spazio per la reazione del bot per ogni messaggio, quindi gli aggiornamenti del ciclo di vita sostituiscono sul posto la reazione corrente; `messages.removeAckAfterReply: true` rimuove la reazione di stato finale dopo il periodo configurato di mantenimento dello stato completato/errore; le categorie di emoji degli strumenti includono `tool`, `coding`, `web`, `deploy`, `build` e `concierge`.

## Più account e credenziali

<AccordionGroup>
  <Accordion title="Selezione degli account e valori predefiniti">
    Gli ID degli account provengono da `channels.whatsapp.accounts`. La selezione predefinita usa l'account `default`, se presente; altrimenti usa il primo ID account configurato (in ordine alfabetico). Gli ID degli account vengono normalizzati internamente per la ricerca.
  </Accordion>

  <Accordion title="Credential paths and legacy compatibility">
    - percorso di autenticazione attuale: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (backup: `creds.json.bak`)
    - l'autenticazione predefinita legacy in `~/.openclaw/credentials/` viene ancora riconosciuta/migrata per i flussi dell'account predefinito

  </Accordion>

  <Accordion title="Logout behavior">
    `openclaw channels logout --channel whatsapp [--account <id>]` cancella lo stato di autenticazione WhatsApp per tale account. Quando un Gateway è raggiungibile, la disconnessione arresta prima il listener attivo per quell'account, così la sessione collegata smette di ricevere messaggi prima del riavvio successivo. Anche `openclaw channels remove --channel whatsapp` arresta il listener attivo prima di disabilitare o eliminare la configurazione dell'account.

    Nelle directory di autenticazione legacy, `oauth.json` viene conservato mentre i file di autenticazione di Baileys vengono rimossi.

  </Accordion>
</AccordionGroup>

## Strumenti, azioni e scritture della configurazione

- Il supporto degli strumenti dell'agente include l'azione di reazione di WhatsApp (`react`).
- Controlli delle azioni: `channels.whatsapp.actions.reactions`, `channels.whatsapp.actions.polls` (le azioni esistenti hanno come valore predefinito `true`), `channels.whatsapp.actions.calls` (valore predefinito `false`, vedere MeowCaller sopra).
- Le scritture della configurazione avviate dal canale sono abilitate per impostazione predefinita; disabilitarle tramite `channels.whatsapp.configWrites: false`.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Not linked (QR required)">
    Sintomo: lo stato del canale indica che non è collegato.

```bash
openclaw channels login --channel whatsapp
openclaw channels status
```

  </Accordion>

  <Accordion title="Linked but disconnected / reconnect loop">
    Sintomo: account collegato con disconnessioni o tentativi di riconnessione ripetuti.

    Gli account inattivi possono restare connessi oltre il normale timeout dei messaggi; il watchdog esegue il riavvio solo quando si interrompe l'attività del trasporto WhatsApp Web, il socket si chiude oppure l'attività a livello applicativo rimane assente oltre la finestra di sicurezza più lunga (vedere Modello di runtime sopra).

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

    Se il ciclo persiste dopo aver corretto la connettività dell'host e le temporizzazioni, eseguire il backup della directory di autenticazione dell'account e collegarlo nuovamente:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Se `~/.openclaw/logs/whatsapp-health.log` riporta `Gateway inactive`, ma sia `openclaw gateway status` sia `openclaw channels status --probe` indicano uno stato integro, eseguire `openclaw doctor`. Su Linux, doctor segnala le voci legacy del crontab che invocano lo script ritirato `~/.openclaw/bin/ensure-whatsapp.sh`; rimuovere tali voci con `crontab -e` — cron potrebbe non disporre dell'ambiente del bus utente di systemd e far sì che il vecchio script segnali erroneamente lo stato del Gateway.

  </Accordion>

  <Accordion title="QR login times out behind a proxy">
    Sintomo: `openclaw channels login --channel whatsapp` non riesce prima di mostrare un codice QR utilizzabile, con `status=408 Request Time-out` o una disconnessione del socket TLS.

    L'accesso a WhatsApp Web utilizza l'ambiente proxy standard dell'host del Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, varianti in minuscolo, `NO_PROXY`). Verificare che il processo del Gateway erediti le variabili d'ambiente del proxy e che `NO_PROXY` non corrisponda a `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="No active listener when sending">
    Gli invii in uscita non riescono immediatamente quando non esiste alcun listener attivo del Gateway per l'account di destinazione. Verificare che il Gateway sia in esecuzione e che l'account sia collegato.
  </Accordion>

  <Accordion title="Reply appears in transcript but not in WhatsApp">
    Le righe della trascrizione registrano ciò che l'agente ha generato; la consegna tramite WhatsApp viene verificata separatamente. OpenClaw considera inviata una risposta automatica solo dopo che Baileys restituisce un ID di messaggio in uscita per almeno un invio visibile di testo o contenuti multimediali.

    Le reazioni di conferma sono ricevute indipendenti che precedono la risposta — una reazione riuscita non dimostra che la successiva risposta testuale o multimediale sia stata accettata. Controllare nei log del Gateway la presenza di `auto-reply delivery failed` o `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Group messages unexpectedly ignored">
    Controllare in quest'ordine: `groupPolicy`, `groupAllowFrom`/`allowFrom`, le voci dell'elenco consentito `groups`, il controllo delle menzioni (`requireMention` + modelli di menzione) e le chiavi duplicate in `openclaw.json` (in JSON5 le voci successive sostituiscono quelle precedenti — mantenere un solo `groupPolicy` per ambito).

    Se `channels.whatsapp.groups` è presente, WhatsApp può comunque osservare i messaggi provenienti da altri gruppi, ma OpenClaw li elimina prima dell'instradamento della sessione. Aggiungere il JID del gruppo a `channels.whatsapp.groups` oppure aggiungere `groups["*"]` per ammettere tutti i gruppi, mantenendo l'autorizzazione dei mittenti sotto il controllo di `groupPolicy`/`groupAllowFrom`.

  </Accordion>

  <Accordion title="Bun runtime warning">
    Il runtime del Gateway WhatsApp deve utilizzare Node. Bun è contrassegnato come incompatibile con il funzionamento stabile del Gateway per WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompt di sistema

WhatsApp supporta prompt di sistema in stile Telegram per gruppi e chat dirette tramite le mappe `groups` e `direct`.

Risoluzione per i messaggi di gruppo: viene determinata innanzitutto la mappa `groups` effettiva — se l'account definisce una propria chiave `groups`, questa sostituisce completamente la mappa `groups` radice (nessuna unione profonda). La ricerca del prompt viene quindi eseguita su quell'unica mappa risultante:

1. **Prompt specifico del gruppo** (`groups["<groupId>"].systemPrompt`): utilizzato quando la voce del gruppo esiste **e** la relativa chiave `systemPrompt` è definita. Una stringa vuota (`""`) impedisce l'uso del carattere jolly e non applica alcun prompt.
2. **Prompt con carattere jolly per i gruppi** (`groups["*"].systemPrompt`): utilizzato quando la voce specifica del gruppo è assente oppure esiste senza una chiave `systemPrompt`.

La risoluzione per i messaggi diretti segue lo stesso schema con la mappa `direct` e `direct["*"]`.

<Note>
`dms` rimane il contenitore leggero per la sostituzione della cronologia di ogni messaggio diretto (`dms.<id>.historyLimit`). Le sostituzioni dei prompt si trovano in `direct`.
</Note>

<Note>
Questo comportamento, in cui l'account sostituisce la radice per la risoluzione dei prompt, è una semplice sostituzione superficiale: qualsiasi chiave `groups`/`direct` dell'account, incluso un oggetto vuoto esplicito, sostituisce la mappa radice. È diverso dal controllo dell'elenco consentito per l'appartenenza ai gruppi descritto sopra, che include una protezione per gli account singoli in caso di un `groups: {}` accidentalmente vuoto.
</Note>

**Differenza rispetto a Telegram:** Telegram ignora `groups` alla radice per ogni account in una configurazione con più account (anche per gli account privi di una propria chiave `groups`) per impedire che un bot riceva messaggi da gruppi ai quali non appartiene. WhatsApp non applica questa protezione — `groups`/`direct` alla radice vengono ereditati da qualsiasi account che non abbia una propria sostituzione, indipendentemente dal numero di account. In una configurazione WhatsApp con più account, definire esplicitamente la mappa completa sotto ogni account se si desiderano prompt specifici per account.

Comportamento importante:

- `channels.whatsapp.groups` è sia una mappa di configurazione per gruppo sia l'elenco consentito dei gruppi a livello di chat. Sia nell'ambito radice sia nell'ambito dell'account, `groups["*"]` significa "tutti i gruppi sono ammessi" per tale ambito.
- Aggiungere un `systemPrompt` con carattere jolly solo se si desidera già che tale ambito ammetta tutti i gruppi. Per mantenere idoneo soltanto un insieme fisso di ID di gruppo, ripetere il prompt in ogni voce esplicitamente inclusa nell'elenco consentito anziché utilizzare `groups["*"]`.
- L'ammissione del gruppo e l'autorizzazione del mittente sono controlli separati. `groups["*"]` amplia i gruppi che raggiungono la gestione dei gruppi; non autorizza tutti i mittenti di tali gruppi — questo rimane sotto il controllo di `groupPolicy`/`groupAllowFrom`.
- `channels.whatsapp.direct` non ha un effetto collaterale equivalente per i messaggi diretti: `direct["*"]` fornisce soltanto una configurazione predefinita dopo che un messaggio diretto è già stato ammesso da `dmPolicy` insieme ad `allowFrom` o alle regole dell'archivio degli abbinamenti.

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

## Riferimenti alla configurazione

Riferimento principale: [Riferimento della configurazione - WhatsApp](/it/gateway/config-channels#whatsapp)

| Area                    | Campi                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Accesso                 | `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`                                             |
| Consegna                | `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`                |
| Più account             | `accounts.<id>.enabled`, `accounts.<id>.authDir` e altre sostituzioni specifiche per account                   |
| Operazioni              | `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`       |
| Comportamento sessione  | `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`                                   |
| Prompt                  | `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt` |

## Contenuti correlati

- [Abbinamento](/it/channels/pairing)
- [Gruppi](/it/channels/groups)
- [Sicurezza](/it/gateway/security)
- [Instradamento dei canali](/it/channels/channel-routing)
- [Instradamento multi-agente](/it/concepts/multi-agent)
- [Risoluzione dei problemi](/it/channels/troubleshooting)
