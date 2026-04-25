---
read_when:
    - Lavorare sul comportamento del canale WhatsApp/web o sull'instradamento della posta in arrivo
summary: Supporto del canale WhatsApp, controlli di accesso, comportamento di consegna e operazioni
title: WhatsApp
x-i18n:
    generated_at: "2026-04-25T18:18:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0935e7ac3676c57d83173a6dd9eedc489f77b278dfbc47bd811045078ee7e4d0
    source_path: channels/whatsapp.md
    workflow: 15
---

Stato: pronto per la produzione tramite WhatsApp Web (Baileys). Gateway gestisce la/e sessione/i collegate.

## Installazione (su richiesta)

- L'onboarding (`openclaw onboard`) e `openclaw channels add --channel whatsapp`
  richiedono di installare il Plugin WhatsApp la prima volta che lo selezioni.
- Anche `openclaw channels login --channel whatsapp` offre il flusso di installazione quando
  il Plugin non è ancora presente.
- Canale Dev + checkout git: usa per impostazione predefinita il percorso locale del Plugin.
- Stable/Beta: usa per impostazione predefinita il pacchetto npm `@openclaw/whatsapp`.

L'installazione manuale resta disponibile:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Abbinamento" icon="link" href="/it/channels/pairing">
    Il criterio DM predefinito è l'abbinamento per i mittenti sconosciuti.
  </Card>
  <Card title="Risoluzione dei problemi del canale" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica multi-canale e playbook di riparazione.
  </Card>
  <Card title="Configurazione del Gateway" icon="settings" href="/it/gateway/configuration">
    Modelli ed esempi completi di configurazione del canale.
  </Card>
</CardGroup>

## Configurazione rapida

<Steps>
  <Step title="Configura il criterio di accesso a WhatsApp">

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

  <Step title="Approva la prima richiesta di abbinamento (se usi la modalità abbinamento)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Le richieste di abbinamento scadono dopo 1 ora. Le richieste in sospeso sono limitate a 3 per canale.

  </Step>
</Steps>

<Note>
OpenClaw consiglia di usare WhatsApp con un numero separato quando possibile. (I metadati del canale e il flusso di configurazione sono ottimizzati per questa configurazione, ma sono supportate anche configurazioni con numero personale.)
</Note>

## Modelli di distribuzione

<AccordionGroup>
  <Accordion title="Numero dedicato (consigliato)">
    Questa è la modalità operativa più pulita:

    - identità WhatsApp separata per OpenClaw
    - allowlist DM e confini di instradamento più chiari
    - minore probabilità di confusione con la chat verso sé stessi

    Modello di criterio minimo:

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
    L'onboarding supporta la modalità numero personale e scrive una baseline adatta alla chat verso sé stessi:

    - `dmPolicy: "allowlist"`
    - `allowFrom` include il tuo numero personale
    - `selfChatMode: true`

    In fase di esecuzione, le protezioni per la chat verso sé stessi si basano sul numero proprio collegato e su `allowFrom`.

  </Accordion>

  <Accordion title="Ambito del canale solo WhatsApp Web">
    Il canale della piattaforma di messaggistica è basato su WhatsApp Web (`Baileys`) nell'attuale architettura dei canali di OpenClaw.

    Non esiste un canale di messaggistica WhatsApp Twilio separato nel registro integrato dei canali chat.

  </Accordion>
</AccordionGroup>

## Modello di runtime

- Gateway gestisce il socket WhatsApp e il ciclo di riconnessione.
- Gli invii in uscita richiedono un listener WhatsApp attivo per l'account di destinazione.
- Le chat di stato e broadcast vengono ignorate (`@status`, `@broadcast`).
- Le chat dirette usano le regole di sessione DM (`session.dmScope`; il valore predefinito `main` comprime i DM nella sessione principale dell'agente).
- Le sessioni di gruppo sono isolate (`agent:<agentId>:whatsapp:group:<jid>`).
- Il trasporto WhatsApp Web rispetta le variabili d'ambiente proxy standard sull'host Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / varianti in minuscolo). Preferisci la configurazione proxy a livello host invece delle impostazioni proxy WhatsApp specifiche del canale.

## Hook del Plugin e privacy

I messaggi in ingresso su WhatsApp possono contenere contenuto personale dei messaggi, numeri di telefono,
identificatori di gruppo, nomi dei mittenti e campi di correlazione della sessione. Per questo motivo,
WhatsApp non trasmette i payload degli hook in ingresso `message_received` ai Plugin
a meno che tu non lo abiliti esplicitamente:

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

Puoi limitare l'abilitazione a un solo account:

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

Abilita questa opzione solo per Plugin di cui ti fidi nel ricevere contenuti
e identificatori dei messaggi WhatsApp in ingresso.

## Controllo di accesso e attivazione

<Tabs>
  <Tab title="Criterio DM">
    `channels.whatsapp.dmPolicy` controlla l'accesso alle chat dirette:

    - `pairing` (predefinito)
    - `allowlist`
    - `open` (richiede che `allowFrom` includa `"*"`)
    - `disabled`

    `allowFrom` accetta numeri in stile E.164 (normalizzati internamente).

    Override multi-account: `channels.whatsapp.accounts.<id>.dmPolicy` (e `allowFrom`) hanno la precedenza sui valori predefiniti a livello di canale per quell'account.

    Dettagli del comportamento in fase di esecuzione:

    - gli abbinamenti vengono mantenuti nell'allow-store del canale e uniti con `allowFrom` configurato
    - se non è configurata alcuna allowlist, il numero proprio collegato è consentito per impostazione predefinita
    - OpenClaw non abbina mai automaticamente i DM in uscita `fromMe` (messaggi che invii a te stesso dal dispositivo collegato)

  </Tab>

  <Tab title="Criterio di gruppo + allowlist">
    L'accesso ai gruppi ha due livelli:

    1. **Allowlist di appartenenza al gruppo** (`channels.whatsapp.groups`)
       - se `groups` è omesso, tutti i gruppi sono idonei
       - se `groups` è presente, agisce come allowlist di gruppo (`"*"` consentito)

    2. **Criterio del mittente del gruppo** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: la allowlist del mittente viene bypassata
       - `allowlist`: il mittente deve corrispondere a `groupAllowFrom` (o `*`)
       - `disabled`: blocca tutto il traffico in ingresso dei gruppi

    Fallback della allowlist dei mittenti:

    - se `groupAllowFrom` non è impostato, il runtime usa `allowFrom` come fallback quando disponibile
    - le allowlist dei mittenti vengono valutate prima dell'attivazione per menzione/risposta

    Nota: se non esiste affatto alcun blocco `channels.whatsapp`, il fallback del criterio di gruppo in fase di esecuzione è `allowlist` (con un log di avviso), anche se `channels.defaults.groupPolicy` è impostato.

  </Tab>

  <Tab title="Menzioni + /activation">
    Le risposte nei gruppi richiedono per impostazione predefinita una menzione.

    Il rilevamento delle menzioni include:

    - menzioni WhatsApp esplicite dell'identità del bot
    - pattern regex di menzione configurati (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - rilevamento implicito di risposta al bot (il mittente della risposta corrisponde all'identità del bot)

    Nota di sicurezza:

    - la citazione/risposta soddisfa solo il gating della menzione; **non** concede l'autorizzazione al mittente
    - con `groupPolicy: "allowlist"`, i mittenti non presenti nella allowlist vengono comunque bloccati anche se rispondono al messaggio di un utente presente nella allowlist

    Comando di attivazione a livello di sessione:

    - `/activation mention`
    - `/activation always`

    `activation` aggiorna lo stato della sessione (non la configurazione globale). È limitato al proprietario.

  </Tab>
</Tabs>

## Comportamento con numero personale e chat verso sé stessi

Quando il numero proprio collegato è presente anche in `allowFrom`, si attivano le protezioni per la chat verso sé stessi di WhatsApp:

- salta le conferme di lettura per i turni di chat verso sé stessi
- ignora il comportamento di attivazione automatica mention-JID che altrimenti invierebbe una notifica a te stesso
- se `messages.responsePrefix` non è impostato, le risposte nella chat verso sé stessi usano per impostazione predefinita `[{identity.name}]` oppure `[openclaw]`

## Normalizzazione dei messaggi e contesto

<AccordionGroup>
  <Accordion title="Envelope in ingresso + contesto di risposta">
    I messaggi WhatsApp in ingresso vengono racchiusi nell'envelope in ingresso condiviso.

    Se esiste una risposta citata, il contesto viene aggiunto in questo formato:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    I campi dei metadati della risposta vengono anch'essi popolati quando disponibili (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164).

  </Accordion>

  <Accordion title="Segnaposto dei media ed estrazione di posizione/contatto">
    I messaggi in ingresso composti solo da media vengono normalizzati con segnaposto come:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    I corpi delle posizioni usano testo sintetico con coordinate. Le etichette/commenti delle posizioni e i dettagli di contatto/vCard vengono resi come metadati non attendibili delimitati, non come testo inline nel prompt.

  </Accordion>

  <Accordion title="Iniezione della cronologia di gruppo in sospeso">
    Per i gruppi, i messaggi non elaborati possono essere bufferizzati e iniettati come contesto quando il bot viene infine attivato.

    - limite predefinito: `50`
    - config: `channels.whatsapp.historyLimit`
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

    I turni di chat verso sé stessi saltano le conferme di lettura anche quando sono abilitate globalmente.

  </Accordion>
</AccordionGroup>

## Consegna, suddivisione in blocchi e media

<AccordionGroup>
  <Accordion title="Suddivisione del testo in blocchi">
    - limite predefinito dei blocchi: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - la modalità `newline` preferisce i confini dei paragrafi (righe vuote), poi ricorre alla suddivisione sicura per lunghezza
  </Accordion>

  <Accordion title="Comportamento dei media in uscita">
    - supporta payload di immagini, video, audio (messaggi vocali PTT) e documenti
    - i payload di risposta preservano `audioAsVoice`; WhatsApp invia i media audio come messaggi vocali PTT di Baileys
    - l'audio non Ogg, incluso l'output MP3/WebM TTS di Microsoft Edge, viene transcodificato in Ogg/Opus prima della consegna PTT
    - l'audio Ogg/Opus nativo viene inviato con `audio/ogg; codecs=opus` per compatibilità con i messaggi vocali
    - la riproduzione GIF animata è supportata tramite `gifPlayback: true` negli invii video
    - le didascalie vengono applicate al primo elemento multimediale quando si inviano payload di risposta multi-media, tranne che per i messaggi vocali PTT che inviano prima l'audio e il testo visibile separatamente perché i client WhatsApp non visualizzano le didascalie dei messaggi vocali in modo coerente
    - la sorgente dei media può essere HTTP(S), `file://` o percorsi locali
  </Accordion>

  <Accordion title="Limiti di dimensione dei media e comportamento di fallback">
    - limite di salvataggio dei media in ingresso: `channels.whatsapp.mediaMaxMb` (predefinito `50`)
    - limite di invio dei media in uscita: `channels.whatsapp.mediaMaxMb` (predefinito `50`)
    - gli override per account usano `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - le immagini vengono ottimizzate automaticamente (ridimensionamento/scansione qualità) per rientrare nei limiti
    - in caso di errore nell'invio dei media, il fallback del primo elemento invia un avviso di testo invece di eliminare silenziosamente la risposta
  </Accordion>
</AccordionGroup>

## Citazione delle risposte

WhatsApp supporta la citazione nativa delle risposte, in cui le risposte in uscita citano visibilmente il messaggio in ingresso. Controllala con `channels.whatsapp.replyToMode`.

| Valore      | Comportamento                                                         |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Non citare mai; invia come messaggio normale                          |
| `"first"`   | Cita solo il primo blocco della risposta in uscita                    |
| `"all"`     | Cita ogni blocco della risposta in uscita                             |
| `"batched"` | Cita le risposte accodate in batch lasciando senza citazione quelle immediate |

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

| Livello       | Reazioni di ack | Reazioni avviate dall'agente | Descrizione                                          |
| ------------- | --------------- | ---------------------------- | ---------------------------------------------------- |
| `"off"`       | No              | No                           | Nessuna reazione                                     |
| `"ack"`       | Sì              | No                           | Solo reazioni di ack (ricevuta pre-risposta)         |
| `"minimal"`   | Sì              | Sì (conservativo)            | Ack + reazioni dell'agente con linee guida prudenti  |
| `"extensive"` | Sì              | Sì (incoraggiato)            | Ack + reazioni dell'agente con linee guida ampliate  |

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

- inviate immediatamente dopo che l'elemento in ingresso è stato accettato (pre-risposta)
- gli errori vengono registrati nei log ma non bloccano la normale consegna della risposta
- la modalità gruppo `mentions` reagisce nei turni attivati da menzione; l'attivazione di gruppo `always` funziona come bypass di questo controllo
- WhatsApp usa `channels.whatsapp.ackReaction` (qui non viene usato il legacy `messages.ackReaction`)

## Multi-account e credenziali

<AccordionGroup>
  <Accordion title="Selezione dell'account e valori predefiniti">
    - gli id account provengono da `channels.whatsapp.accounts`
    - selezione dell'account predefinito: `default` se presente, altrimenti il primo id account configurato (ordinato)
    - gli id account vengono normalizzati internamente per la ricerca
  </Accordion>

  <Accordion title="Percorsi delle credenziali e compatibilità legacy">
    - percorso auth attuale: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - file di backup: `creds.json.bak`
    - l'auth predefinita legacy in `~/.openclaw/credentials/` è ancora riconosciuta/migrata per i flussi dell'account predefinito
  </Accordion>

  <Accordion title="Comportamento del logout">
    `openclaw channels logout --channel whatsapp [--account <id>]` cancella lo stato auth di WhatsApp per quell'account.

    Nelle directory auth legacy, `oauth.json` viene preservato mentre i file auth di Baileys vengono rimossi.

  </Accordion>
</AccordionGroup>

## Tools, azioni e scritture di configurazione

- Il supporto Tool dell'agente include l'azione di reazione WhatsApp (`react`).
- Gate delle azioni:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Le scritture di configurazione avviate dal canale sono abilitate per impostazione predefinita (disabilita tramite `channels.whatsapp.configWrites=false`).

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

    Correzione:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Se necessario, ricollega con `channels login`.

  </Accordion>

  <Accordion title="Nessun listener attivo durante l'invio">
    Gli invii in uscita falliscono immediatamente quando non esiste un listener Gateway attivo per l'account di destinazione.

    Assicurati che Gateway sia in esecuzione e che l'account sia collegato.

  </Accordion>

  <Accordion title="Messaggi di gruppo ignorati inaspettatamente">
    Controlla in questo ordine:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - voci della allowlist `groups`
    - gating delle menzioni (`requireMention` + pattern di menzione)
    - chiavi duplicate in `openclaw.json` (JSON5): le voci successive sovrascrivono quelle precedenti, quindi mantieni un solo `groupPolicy` per ambito

  </Accordion>

  <Accordion title="Avviso runtime Bun">
    Il runtime Gateway di WhatsApp dovrebbe usare Node. Bun è segnalato come incompatibile per un funzionamento stabile del Gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompt di sistema

WhatsApp supporta prompt di sistema in stile Telegram per gruppi e chat dirette tramite le mappe `groups` e `direct`.

Gerarchia di risoluzione per i messaggi di gruppo:

La mappa `groups` effettiva viene determinata per prima: se l'account definisce la propria `groups`, sostituisce completamente la mappa `groups` di root (nessun merge profondo). La ricerca del prompt viene quindi eseguita sulla singola mappa risultante:

1. **Prompt di sistema specifico del gruppo** (`groups["<groupId>"].systemPrompt`): usato quando la voce del gruppo specifico esiste nella mappa **e** la sua chiave `systemPrompt` è definita. Se `systemPrompt` è una stringa vuota (`""`), il wildcard viene soppresso e non viene applicato alcun prompt di sistema.
2. **Prompt di sistema wildcard del gruppo** (`groups["*"].systemPrompt`): usato quando la voce del gruppo specifico è completamente assente dalla mappa, oppure quando esiste ma non definisce alcuna chiave `systemPrompt`.

Gerarchia di risoluzione per i messaggi diretti:

La mappa `direct` effettiva viene determinata per prima: se l'account definisce la propria `direct`, sostituisce completamente la mappa `direct` di root (nessun merge profondo). La ricerca del prompt viene quindi eseguita sulla singola mappa risultante:

1. **Prompt di sistema specifico del diretto** (`direct["<peerId>"].systemPrompt`): usato quando la voce specifica del peer esiste nella mappa **e** la sua chiave `systemPrompt` è definita. Se `systemPrompt` è una stringa vuota (`""`), il wildcard viene soppresso e non viene applicato alcun prompt di sistema.
2. **Prompt di sistema wildcard del diretto** (`direct["*"].systemPrompt`): usato quando la voce del peer specifico è completamente assente dalla mappa, oppure quando esiste ma non definisce alcuna chiave `systemPrompt`.

Nota: `dms` resta il bucket leggero di override della cronologia per-DM (`dms.<id>.historyLimit`); gli override dei prompt si trovano sotto `direct`.

**Differenza rispetto al comportamento multi-account di Telegram:** in Telegram, `groups` di root viene intenzionalmente soppresso per tutti gli account in una configurazione multi-account — anche per gli account che non definiscono propri `groups` — per evitare che un bot riceva messaggi di gruppo per gruppi di cui non fa parte. WhatsApp non applica questa protezione: `groups` di root e `direct` di root vengono sempre ereditati dagli account che non definiscono un override a livello di account, indipendentemente da quanti account siano configurati. In una configurazione WhatsApp multi-account, se vuoi prompt per gruppo o diretti per account, definisci esplicitamente la mappa completa sotto ogni account invece di affidarti ai valori predefiniti a livello root.

Comportamento importante:

- `channels.whatsapp.groups` è sia una mappa di configurazione per gruppo sia la allowlist dei gruppi a livello chat. Nell'ambito root o dell'account, `groups["*"]` significa "tutti i gruppi sono ammessi" per quell'ambito.
- Aggiungi un `systemPrompt` di gruppo wildcard solo se vuoi già che quell'ambito ammetta tutti i gruppi. Se vuoi ancora che siano idonei solo un insieme fisso di ID gruppo, non usare `groups["*"]` per il prompt predefinito. Ripeti invece il prompt in ogni voce di gruppo esplicitamente presente nella allowlist.
- L'ammissione al gruppo e l'autorizzazione del mittente sono controlli separati. `groups["*"]` amplia l'insieme dei gruppi che possono raggiungere la gestione dei gruppi, ma di per sé non autorizza ogni mittente in quei gruppi. L'accesso del mittente è comunque controllato separatamente da `channels.whatsapp.groupPolicy` e `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` non ha lo stesso effetto collaterale per i DM. `direct["*"]` fornisce solo una configurazione predefinita della chat diretta dopo che un DM è già stato ammesso da `dmPolicy` più `allowFrom` o dalle regole del pairing-store.

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

Riferimento principale:

- [Riferimento alla configurazione - WhatsApp](/it/gateway/config-channels#whatsapp)

Campi WhatsApp ad alto segnale:

- accesso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- consegna: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- multi-account: `accounts.<id>.enabled`, `accounts.<id>.authDir`, override a livello di account
- operazioni: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- comportamento della sessione: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompt: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Correlati

- [Abbinamento](/it/channels/pairing)
- [Gruppi](/it/channels/groups)
- [Sicurezza](/it/gateway/security)
- [Instradamento del canale](/it/channels/channel-routing)
- [Instradamento multi-agente](/it/concepts/multi-agent)
- [Risoluzione dei problemi](/it/channels/troubleshooting)
