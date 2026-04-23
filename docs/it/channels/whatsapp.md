---
read_when:
    - Lavorare sul comportamento del canale WhatsApp/web o sull'instradamento della posta in arrivo
summary: Supporto del canale WhatsApp, controlli di accesso, comportamento di consegna e operazioni
title: WhatsApp
x-i18n:
    generated_at: "2026-04-23T08:24:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: e14735a33ffb48334b920a5e63645abf3445f56481b1ce8b7c128800e2adc981
    source_path: channels/whatsapp.md
    workflow: 15
---

# WhatsApp (canale Web)

Stato: pronto per la produzione tramite WhatsApp Web (Baileys). Il Gateway gestisce la/e sessione/i collegate.

## Installazione (on demand)

- L'onboarding (`openclaw onboard`) e `openclaw channels add --channel whatsapp`
  propongono l'installazione del plugin WhatsApp la prima volta che lo selezioni.
- Anche `openclaw channels login --channel whatsapp` offre il flusso di installazione quando
  il plugin non è ancora presente.
- Canale dev + checkout git: usa per impostazione predefinita il percorso del plugin locale.
- Stable/Beta: usa per impostazione predefinita il pacchetto npm `@openclaw/whatsapp`.

L'installazione manuale resta disponibile:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/it/channels/pairing">
    La policy DM predefinita è pairing per i mittenti sconosciuti.
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

    Per un account specifico:

```bash
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Avvia il Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Approva la prima richiesta di pairing (se usi la modalità pairing)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Le richieste di pairing scadono dopo 1 ora. Le richieste in sospeso sono limitate a 3 per canale.

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
    - minore probabilità di confusione con la chat verso se stessi

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
    L'onboarding supporta la modalità numero personale e scrive una baseline adatta alla chat verso se stessi:

    - `dmPolicy: "allowlist"`
    - `allowFrom` include il tuo numero personale
    - `selfChatMode: true`

    A runtime, le protezioni per la chat verso se stessi dipendono dal numero collegato dell'utente stesso e da `allowFrom`.

  </Accordion>

  <Accordion title="Ambito del canale solo WhatsApp Web">
    Il canale della piattaforma di messaggistica è basato su WhatsApp Web (`Baileys`) nell'attuale architettura dei canali di OpenClaw.

    Non esiste un canale di messaggistica WhatsApp Twilio separato nel registro integrato dei canali chat.

  </Accordion>
</AccordionGroup>

## Modello di runtime

- Il Gateway gestisce il socket WhatsApp e il loop di riconnessione.
- Gli invii in uscita richiedono un listener WhatsApp attivo per l'account di destinazione.
- Le chat di stato e broadcast vengono ignorate (`@status`, `@broadcast`).
- Le chat dirette usano le regole di sessione DM (`session.dmScope`; il valore predefinito `main` comprime i DM nella sessione principale dell'agente).
- Le sessioni di gruppo sono isolate (`agent:<agentId>:whatsapp:group:<jid>`).
- Il trasporto WhatsApp Web rispetta le variabili d'ambiente proxy standard sull'host Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / varianti minuscole). Preferisci la configurazione proxy a livello host rispetto alle impostazioni proxy WhatsApp specifiche del canale.

## Controllo degli accessi e attivazione

<Tabs>
  <Tab title="Policy DM">
    `channels.whatsapp.dmPolicy` controlla l'accesso alla chat diretta:

    - `pairing` (predefinito)
    - `allowlist`
    - `open` (richiede che `allowFrom` includa `"*"`)
    - `disabled`

    `allowFrom` accetta numeri in stile E.164 (normalizzati internamente).

    Override multi-account: `channels.whatsapp.accounts.<id>.dmPolicy` (e `allowFrom`) hanno la precedenza sulle impostazioni predefinite a livello di canale per quell'account.

    Dettagli del comportamento a runtime:

    - i pairing vengono conservati nell'allow-store del canale e uniti con `allowFrom` configurato
    - se non è configurata alcuna allowlist, il numero collegato dell'utente stesso è consentito per impostazione predefinita
    - i DM `fromMe` in uscita non vengono mai associati automaticamente

  </Tab>

  <Tab title="Policy di gruppo + allowlist">
    L'accesso ai gruppi ha due livelli:

    1. **Allowlist di appartenenza al gruppo** (`channels.whatsapp.groups`)
       - se `groups` è omesso, tutti i gruppi sono idonei
       - se `groups` è presente, agisce come allowlist di gruppi (`"*"` consentito)

    2. **Policy mittente del gruppo** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: l'allowlist del mittente viene ignorata
       - `allowlist`: il mittente deve corrispondere a `groupAllowFrom` (o `*`)
       - `disabled`: blocca tutto il traffico in ingresso dai gruppi

    Fallback dell'allowlist del mittente:

    - se `groupAllowFrom` non è impostato, il runtime usa `allowFrom` come fallback quando disponibile
    - le allowlist dei mittenti vengono valutate prima dell'attivazione per menzione/risposta

    Nota: se non esiste alcun blocco `channels.whatsapp`, il fallback della policy di gruppo a runtime è `allowlist` (con un log di avviso), anche se `channels.defaults.groupPolicy` è impostato.

  </Tab>

  <Tab title="Menzioni + /activation">
    Le risposte nei gruppi richiedono per impostazione predefinita una menzione.

    Il rilevamento delle menzioni include:

    - menzioni esplicite di WhatsApp dell'identità del bot
    - pattern regex di menzione configurati (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - rilevamento implicito della risposta al bot (il mittente della risposta corrisponde all'identità del bot)

    Nota di sicurezza:

    - la citazione/risposta soddisfa solo il requisito di menzione; **non** concede l'autorizzazione al mittente
    - con `groupPolicy: "allowlist"`, i mittenti non presenti nell'allowlist vengono comunque bloccati anche se rispondono al messaggio di un utente presente nell'allowlist

    Comando di attivazione a livello di sessione:

    - `/activation mention`
    - `/activation always`

    `activation` aggiorna lo stato della sessione (non la configurazione globale). È limitato al proprietario.

  </Tab>
</Tabs>

## Comportamento con numero personale e chat verso se stessi

Quando il numero collegato dell'utente stesso è presente anche in `allowFrom`, si attivano le protezioni WhatsApp per la chat verso se stessi:

- salta le conferme di lettura per i turni di chat verso se stessi
- ignora il comportamento di attivazione automatica tramite mention-JID che altrimenti invierebbe un ping a te stesso
- se `messages.responsePrefix` non è impostato, le risposte nella chat verso se stessi usano per impostazione predefinita `[{identity.name}]` o `[openclaw]`

## Normalizzazione dei messaggi e contesto

<AccordionGroup>
  <Accordion title="Envelope in ingresso + contesto di risposta">
    I messaggi WhatsApp in arrivo vengono racchiusi nello shared inbound envelope.

    Se esiste una risposta citata, il contesto viene aggiunto in questa forma:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Anche i campi dei metadati di risposta vengono compilati quando disponibili (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164).

  </Accordion>

  <Accordion title="Segnaposto dei media ed estrazione di posizione/contatto">
    I messaggi in ingresso contenenti solo media vengono normalizzati con segnaposto come:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    I payload di posizione e contatto vengono normalizzati in contesto testuale prima dell'instradamento.

  </Accordion>

  <Accordion title="Iniezione della cronologia di gruppo in sospeso">
    Per i gruppi, i messaggi non elaborati possono essere bufferizzati e iniettati come contesto quando il bot viene finalmente attivato.

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

    I turni di chat verso se stessi saltano le conferme di lettura anche quando sono abilitate globalmente.

  </Accordion>
</AccordionGroup>

## Consegna, suddivisione in blocchi e media

<AccordionGroup>
  <Accordion title="Suddivisione del testo in blocchi">
    - limite predefinito dei blocchi: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - la modalità `newline` privilegia i confini dei paragrafi (righe vuote), poi ripiega sulla suddivisione sicura per lunghezza
  </Accordion>

  <Accordion title="Comportamento dei media in uscita">
    - supporta payload di immagine, video, audio (nota vocale PTT) e documento
    - `audio/ogg` viene riscritto come `audio/ogg; codecs=opus` per la compatibilità con le note vocali
    - la riproduzione GIF animata è supportata tramite `gifPlayback: true` negli invii video
    - le didascalie vengono applicate al primo elemento multimediale quando si inviano payload di risposta multi-media
    - la sorgente dei media può essere HTTP(S), `file://` o percorsi locali
  </Accordion>

  <Accordion title="Limiti di dimensione dei media e comportamento di fallback">
    - limite di salvataggio dei media in ingresso: `channels.whatsapp.mediaMaxMb` (predefinito `50`)
    - limite di invio dei media in uscita: `channels.whatsapp.mediaMaxMb` (predefinito `50`)
    - gli override per account usano `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - le immagini vengono ottimizzate automaticamente (ridimensionamento/scansione qualità) per rientrare nei limiti
    - in caso di errore nell'invio dei media, il fallback del primo elemento invia un avviso testuale invece di eliminare silenziosamente la risposta
  </Accordion>
</AccordionGroup>

## Citazione delle risposte

WhatsApp supporta la citazione nativa delle risposte, in cui le risposte in uscita citano visibilmente il messaggio in ingresso. Puoi controllarla con `channels.whatsapp.replyToMode`.

| Valore   | Comportamento                                                                      |
| -------- | ---------------------------------------------------------------------------------- |
| `"auto"` | Cita il messaggio in ingresso quando il provider lo supporta; altrimenti salta la citazione |
| `"on"`   | Cita sempre il messaggio in ingresso; ripiega su un invio semplice se la citazione viene rifiutata |
| `"off"`  | Non cita mai; invia come messaggio semplice                                        |

Il valore predefinito è `"auto"`. Gli override per account usano `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "on",
    },
  },
}
```

## Livello di reazione

`channels.whatsapp.reactionLevel` controlla quanto ampiamente l'agente usa le reazioni emoji su WhatsApp:

| Livello       | Reazioni ack | Reazioni avviate dall'agente | Descrizione                                      |
| ------------- | ------------ | ---------------------------- | ------------------------------------------------ |
| `"off"`       | No           | No                           | Nessuna reazione                                 |
| `"ack"`       | Sì           | No                           | Solo reazioni ack (ricezione pre-risposta)       |
| `"minimal"`   | Sì           | Sì (conservative)            | Ack + reazioni dell'agente con guida conservativa |
| `"extensive"` | Sì           | Sì (encouraged)              | Ack + reazioni dell'agente con guida incoraggiante |

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
Le reazioni ack sono controllate da `reactionLevel` — vengono soppresse quando `reactionLevel` è `"off"`.

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

- inviata immediatamente dopo che il messaggio in ingresso è stato accettato (prima della risposta)
- gli errori vengono registrati nei log ma non bloccano la normale consegna della risposta
- la modalità gruppo `mentions` reagisce nei turni attivati da menzione; l'attivazione di gruppo `always` funge da bypass per questo controllo
- WhatsApp usa `channels.whatsapp.ackReaction` (qui il valore legacy `messages.ackReaction` non viene usato)

## Multi-account e credenziali

<AccordionGroup>
  <Accordion title="Selezione account e valori predefiniti">
    - gli ID account provengono da `channels.whatsapp.accounts`
    - selezione dell'account predefinito: `default` se presente, altrimenti il primo ID account configurato (ordinato)
    - gli ID account vengono normalizzati internamente per la ricerca
  </Accordion>

  <Accordion title="Percorsi delle credenziali e compatibilità legacy">
    - percorso attuale di auth: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - file di backup: `creds.json.bak`
    - l'auth legacy predefinita in `~/.openclaw/credentials/` è ancora riconosciuta/migrata per i flussi dell'account predefinito
  </Accordion>

  <Accordion title="Comportamento del logout">
    `openclaw channels logout --channel whatsapp [--account <id>]` cancella lo stato di autenticazione WhatsApp per quell'account.

    Nelle directory auth legacy, `oauth.json` viene mantenuto mentre i file auth di Baileys vengono rimossi.

  </Accordion>
</AccordionGroup>

## Strumenti, azioni e scritture di configurazione

- Il supporto degli strumenti dell'agente include l'azione di reazione WhatsApp (`react`).
- Gate delle azioni:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Le scritture di configurazione avviate dal canale sono abilitate per impostazione predefinita (disabilita con `channels.whatsapp.configWrites=false`).

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Non collegato (QR richiesto)">
    Sintomo: lo stato del canale risulta non collegato.

    Correzione:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Collegato ma disconnesso / loop di riconnessione">
    Sintomo: account collegato con disconnessioni ripetute o tentativi di riconnessione.

    Correzione:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Se necessario, ricollega con `channels login`.

  </Accordion>

  <Accordion title="Nessun listener attivo durante l'invio">
    Gli invii in uscita falliscono immediatamente quando non esiste alcun listener Gateway attivo per l'account di destinazione.

    Assicurati che il Gateway sia in esecuzione e che l'account sia collegato.

  </Accordion>

  <Accordion title="Messaggi di gruppo ignorati inaspettatamente">
    Controlla in questo ordine:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - voci allowlist di `groups`
    - gate delle menzioni (`requireMention` + pattern di menzione)
    - chiavi duplicate in `openclaw.json` (JSON5): le voci successive sovrascrivono quelle precedenti, quindi mantieni un solo `groupPolicy` per ambito

  </Accordion>

  <Accordion title="Avviso runtime Bun">
    Il runtime del Gateway WhatsApp deve usare Node. Bun è segnalato come incompatibile per il funzionamento stabile del Gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompt di sistema

WhatsApp supporta prompt di sistema in stile Telegram per gruppi e chat dirette tramite le mappe `groups` e `direct`.

Gerarchia di risoluzione per i messaggi di gruppo:

La mappa `groups` effettiva viene determinata per prima: se l'account definisce il proprio `groups`, sostituisce completamente la mappa `groups` root (nessun deep merge). La ricerca del prompt viene poi eseguita sulla singola mappa risultante:

1. **Prompt di sistema specifico del gruppo** (`groups["<groupId>"].systemPrompt`): usato se la voce del gruppo specifico definisce un `systemPrompt`.
2. **Prompt di sistema wildcard del gruppo** (`groups["*"].systemPrompt`): usato quando la voce del gruppo specifico è assente o non definisce alcun `systemPrompt`.

Gerarchia di risoluzione per i messaggi diretti:

La mappa `direct` effettiva viene determinata per prima: se l'account definisce il proprio `direct`, sostituisce completamente la mappa `direct` root (nessun deep merge). La ricerca del prompt viene poi eseguita sulla singola mappa risultante:

1. **Prompt di sistema specifico del messaggio diretto** (`direct["<peerId>"].systemPrompt`): usato se la voce del peer specifico definisce un `systemPrompt`.
2. **Prompt di sistema wildcard del messaggio diretto** (`direct["*"].systemPrompt`): usato quando la voce del peer specifico è assente o non definisce alcun `systemPrompt`.

Nota: `dms` rimane il bucket leggero di override della cronologia per singolo DM (`dms.<id>.historyLimit`); gli override dei prompt risiedono in `direct`.

**Differenza rispetto al comportamento multi-account di Telegram:** in Telegram, `groups` root viene intenzionalmente soppresso per tutti gli account in una configurazione multi-account — anche per gli account che non definiscono un proprio `groups` — per evitare che un bot riceva messaggi di gruppo per gruppi a cui non appartiene. WhatsApp non applica questa protezione: `groups` root e `direct` root vengono sempre ereditati dagli account che non definiscono un override a livello account, indipendentemente da quanti account siano configurati. In una configurazione WhatsApp multi-account, se vuoi prompt per gruppo o diretti per account, definisci esplicitamente la mappa completa sotto ogni account invece di fare affidamento sui valori predefiniti a livello root.

Comportamento importante:

- `channels.whatsapp.groups` è sia una mappa di configurazione per gruppo sia l'allowlist di gruppi a livello chat. Sia nell'ambito root sia nell'ambito account, `groups["*"]` significa "tutti i gruppi sono ammessi" per quell'ambito.
- Aggiungi un `systemPrompt` wildcard di gruppo solo quando vuoi già che quell'ambito ammetta tutti i gruppi. Se invece vuoi che sia idoneo solo un insieme fisso di ID gruppo, non usare `groups["*"]` per il prompt predefinito. Ripeti invece il prompt in ogni voce di gruppo esplicitamente presente nell'allowlist.
- L'ammissione al gruppo e l'autorizzazione del mittente sono controlli separati. `groups["*"]` amplia l'insieme dei gruppi che possono raggiungere la gestione dei gruppi, ma da solo non autorizza ogni mittente in quei gruppi. L'accesso del mittente è comunque controllato separatamente da `channels.whatsapp.groupPolicy` e `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` non ha lo stesso effetto collaterale per i DM. `direct["*"]` fornisce solo una configurazione predefinita per la chat diretta dopo che un DM è già stato ammesso da `dmPolicy` più `allowFrom` o dalle regole del pairing-store.

Esempio:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Usa solo se tutti i gruppi devono essere ammessi nell'ambito root.
        // Si applica a tutti gli account che non definiscono la propria mappa groups.
        "*": { systemPrompt: "Prompt predefinito per tutti i gruppi." },
      },
      direct: {
        // Si applica a tutti gli account che non definiscono la propria mappa direct.
        "*": { systemPrompt: "Prompt predefinito per tutte le chat dirette." },
      },
      accounts: {
        work: {
          groups: {
            // Questo account definisce il proprio groups, quindi i groups root vengono
            // completamente sostituiti. Per mantenere una wildcard, definisci esplicitamente anche "*" qui.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Concentrati sulla gestione del progetto.",
            },
            // Usa solo se tutti i gruppi devono essere ammessi in questo account.
            "*": { systemPrompt: "Prompt predefinito per i gruppi di lavoro." },
          },
          direct: {
            // Questo account definisce la propria mappa direct, quindi le voci direct root
            // vengono completamente sostituite. Per mantenere una wildcard, definisci esplicitamente anche "*" qui.
            "+15551234567": { systemPrompt: "Prompt per una specifica chat diretta di lavoro." },
            "*": { systemPrompt: "Prompt predefinito per le chat dirette di lavoro." },
          },
        },
      },
    },
  },
}
```

## Riferimenti alla documentazione di configurazione

Riferimento principale:

- [Riferimento alla configurazione - WhatsApp](/it/gateway/configuration-reference#whatsapp)

Campi WhatsApp ad alto segnale:

- accesso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- consegna: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- multi-account: `accounts.<id>.enabled`, `accounts.<id>.authDir`, override a livello account
- operazioni: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- comportamento della sessione: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompt: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Correlati

- [Pairing](/it/channels/pairing)
- [Gruppi](/it/channels/groups)
- [Sicurezza](/it/gateway/security)
- [Instradamento del canale](/it/channels/channel-routing)
- [Instradamento multi-agente](/it/concepts/multi-agent)
- [Risoluzione dei problemi](/it/channels/troubleshooting)
