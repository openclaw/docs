---
read_when:
    - Stai lavorando sul comportamento del canale WhatsApp/web o sull'instradamento della casella di posta
summary: Supporto del canale WhatsApp, controlli di accesso, comportamento di consegna e operazioni
title: WhatsApp
x-i18n:
    generated_at: "2026-04-05T13:46:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: c16a468b3f47fdf7e4fc3fd745b5c49c7ccebb7af0e8c87c632b78b04c583e49
    source_path: channels/whatsapp.md
    workflow: 15
---

# WhatsApp (canale Web)

Stato: pronto per la produzione tramite WhatsApp Web (Baileys). Il gateway gestisce le sessioni collegate.

## Installazione (su richiesta)

- L'onboarding (`openclaw onboard`) e `openclaw channels add --channel whatsapp`
  propongono di installare il plugin WhatsApp la prima volta che lo selezioni.
- Anche `openclaw channels login --channel whatsapp` offre il flusso di installazione quando
  il plugin non è ancora presente.
- Canale dev + checkout git: per impostazione predefinita usa il percorso locale del plugin.
- Stable/Beta: per impostazione predefinita usa il pacchetto npm `@openclaw/whatsapp`.

L'installazione manuale resta disponibile:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Associazione" icon="link" href="/it/channels/pairing">
    La policy DM predefinita è l'associazione per i mittenti sconosciuti.
  </Card>
  <Card title="Risoluzione dei problemi dei canali" icon="wrench" href="/channels/troubleshooting">
    Diagnostica cross-channel e procedure di riparazione.
  </Card>
  <Card title="Configurazione del gateway" icon="settings" href="/gateway/configuration">
    Modelli ed esempi completi di configurazione del canale.
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

  <Step title="Avvia il gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Approva la prima richiesta di associazione (se usi la modalità pairing)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Le richieste di associazione scadono dopo 1 ora. Le richieste in sospeso sono limitate a 3 per canale.

  </Step>
</Steps>

<Note>
OpenClaw consiglia di eseguire WhatsApp su un numero separato quando possibile. (I metadati del canale e il flusso di configurazione sono ottimizzati per questa configurazione, ma sono supportate anche le configurazioni con numero personale.)
</Note>

## Modelli di distribuzione

<AccordionGroup>
  <Accordion title="Numero dedicato (consigliato)">
    Questa è la modalità operativa più pulita:

    - identità WhatsApp separata per OpenClaw
    - allowlist DM e confini di instradamento più chiari
    - minore probabilità di confusione con le chat a sé stessi

    Modello di policy minimo:

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
    L'onboarding supporta la modalità numero personale e scrive una baseline adatta alle chat con sé stessi:

    - `dmPolicy: "allowlist"`
    - `allowFrom` include il tuo numero personale
    - `selfChatMode: true`

    A runtime, le protezioni per le chat con sé stessi si basano sul numero personale collegato e su `allowFrom`.

  </Accordion>

  <Accordion title="Ambito del canale solo WhatsApp Web">
    Il canale della piattaforma di messaggistica è basato su WhatsApp Web (`Baileys`) nell'attuale architettura dei canali di OpenClaw.

    Non esiste un canale di messaggistica WhatsApp Twilio separato nel registro integrato dei canali chat.

  </Accordion>
</AccordionGroup>

## Modello di runtime

- Il gateway gestisce il socket WhatsApp e il ciclo di riconnessione.
- Gli invii in uscita richiedono un listener WhatsApp attivo per l'account di destinazione.
- Le chat di stato e broadcast vengono ignorate (`@status`, `@broadcast`).
- Le chat dirette usano le regole di sessione DM (`session.dmScope`; per impostazione predefinita `main` comprime i DM nella sessione principale dell'agente).
- Le sessioni di gruppo sono isolate (`agent:<agentId>:whatsapp:group:<jid>`).

## Controllo dell'accesso e attivazione

<Tabs>
  <Tab title="Policy DM">
    `channels.whatsapp.dmPolicy` controlla l'accesso alle chat dirette:

    - `pairing` (predefinito)
    - `allowlist`
    - `open` (richiede che `allowFrom` includa `"*"`)
    - `disabled`

    `allowFrom` accetta numeri in stile E.164 (normalizzati internamente).

    Override multi-account: `channels.whatsapp.accounts.<id>.dmPolicy` (e `allowFrom`) hanno precedenza sui valori predefiniti a livello di canale per quell'account.

    Dettagli del comportamento a runtime:

    - le associazioni vengono mantenute nell'allow-store del canale e unite a `allowFrom` configurato
    - se non è configurata alcuna allowlist, il numero personale collegato è consentito per impostazione predefinita
    - i DM in uscita `fromMe` non vengono mai associati automaticamente

  </Tab>

  <Tab title="Policy di gruppo + allowlist">
    L'accesso ai gruppi ha due livelli:

    1. **Allowlist dell'appartenenza al gruppo** (`channels.whatsapp.groups`)
       - se `groups` è omesso, tutti i gruppi sono idonei
       - se `groups` è presente, agisce come allowlist dei gruppi (`"*"` consentito)

    2. **Policy mittente del gruppo** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: la allowlist dei mittenti viene bypassata
       - `allowlist`: il mittente deve corrispondere a `groupAllowFrom` (o `*`)
       - `disabled`: blocca tutti gli ingressi dai gruppi

    Fallback della allowlist dei mittenti:

    - se `groupAllowFrom` non è impostato, il runtime torna a `allowFrom` quando disponibile
    - le allowlist dei mittenti vengono valutate prima dell'attivazione per menzione/risposta

    Nota: se non esiste alcun blocco `channels.whatsapp`, il fallback della policy di gruppo a runtime è `allowlist` (con un log di avviso), anche se `channels.defaults.groupPolicy` è impostato.

  </Tab>

  <Tab title="Menzioni + /activation">
    Per impostazione predefinita, le risposte nei gruppi richiedono una menzione.

    Il rilevamento delle menzioni include:

    - menzioni esplicite di WhatsApp dell'identità del bot
    - pattern regex di menzione configurati (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - rilevamento implicito della risposta al bot (il mittente della risposta corrisponde all'identità del bot)

    Nota di sicurezza:

    - la citazione/risposta soddisfa solo il gating della menzione; **non** concede l'autorizzazione del mittente
    - con `groupPolicy: "allowlist"`, i mittenti non presenti in allowlist restano bloccati anche se rispondono al messaggio di un utente presente in allowlist

    Comando di attivazione a livello di sessione:

    - `/activation mention`
    - `/activation always`

    `activation` aggiorna lo stato della sessione (non la config globale). È protetto dal proprietario.

  </Tab>
</Tabs>

## Comportamento con numero personale e chat con sé stessi

Quando il numero personale collegato è presente anche in `allowFrom`, si attivano le protezioni per le chat con sé stessi su WhatsApp:

- salta le conferme di lettura per i turni di chat con sé stessi
- ignora il comportamento di attivazione automatica tramite mention-JID che altrimenti invierebbe una menzione a te stesso
- se `messages.responsePrefix` non è impostato, per impostazione predefinita le risposte alle chat con sé stessi usano `[{identity.name}]` o `[openclaw]`

## Normalizzazione dei messaggi e contesto

<AccordionGroup>
  <Accordion title="Envelope in ingresso + contesto della risposta">
    I messaggi WhatsApp in ingresso sono racchiusi nell'envelope condivisa dei messaggi in ingresso.

    Se esiste una risposta citata, il contesto viene aggiunto in questa forma:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Anche i campi dei metadati della risposta vengono popolati quando disponibili (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 del mittente).

  </Accordion>

  <Accordion title="Placeholder dei media ed estrazione di posizione/contatto">
    I messaggi in ingresso contenenti solo media vengono normalizzati con placeholder come:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    I payload di posizione e contatto vengono normalizzati in contesto testuale prima dell'instradamento.

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

    I turni di chat con sé stessi saltano le conferme di lettura anche quando sono abilitate globalmente.

  </Accordion>
</AccordionGroup>

## Consegna, suddivisione e media

<AccordionGroup>
  <Accordion title="Suddivisione del testo">
    - limite predefinito dei blocchi: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - la modalità `newline` preferisce i confini dei paragrafi (righe vuote), poi ricade sulla suddivisione sicura per lunghezza
  </Accordion>

  <Accordion title="Comportamento dei media in uscita">
    - supporta payload di immagine, video, audio (messaggio vocale PTT) e documento
    - `audio/ogg` viene riscritto in `audio/ogg; codecs=opus` per compatibilità con i messaggi vocali
    - la riproduzione di GIF animate è supportata tramite `gifPlayback: true` negli invii video
    - le didascalie vengono applicate al primo elemento multimediale quando si inviano payload di risposta con più media
    - la sorgente dei media può essere HTTP(S), `file://` o percorsi locali
  </Accordion>

  <Accordion title="Limiti di dimensione dei media e comportamento di fallback">
    - limite di salvataggio dei media in ingresso: `channels.whatsapp.mediaMaxMb` (predefinito `50`)
    - limite di invio dei media in uscita: `channels.whatsapp.mediaMaxMb` (predefinito `50`)
    - gli override per account usano `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - le immagini vengono ottimizzate automaticamente (ridimensionamento/scansione qualità) per rientrare nei limiti
    - in caso di errore nell'invio di media, il fallback del primo elemento invia un avviso testuale invece di eliminare silenziosamente la risposta
  </Accordion>
</AccordionGroup>

## Livello di reazione

`channels.whatsapp.reactionLevel` controlla quanto ampiamente l'agente usa le reazioni emoji su WhatsApp:

| Livello       | Reazioni di ack | Reazioni avviate dall'agente | Descrizione                                        |
| ------------- | --------------- | ---------------------------- | -------------------------------------------------- |
| `"off"`       | No              | No                           | Nessuna reazione                                   |
| `"ack"`       | Sì              | No                           | Solo reazioni di ack (ricevuta pre-risposta)       |
| `"minimal"`   | Sì              | Sì (conservative)            | Ack + reazioni dell'agente con guida conservativa  |
| `"extensive"` | Sì              | Sì (encouraged)              | Ack + reazioni dell'agente con guida incoraggiata  |

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

## Reazioni di acknowledgment

WhatsApp supporta reazioni di ack immediate alla ricezione in ingresso tramite `channels.whatsapp.ackReaction`.
Le reazioni di ack sono regolate da `reactionLevel` — vengono soppresse quando `reactionLevel` è `"off"`.

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

- inviate immediatamente dopo che il messaggio in ingresso è stato accettato (pre-risposta)
- gli errori vengono registrati nei log ma non bloccano la normale consegna della risposta
- la modalità gruppo `mentions` reagisce nei turni attivati da menzione; l'attivazione di gruppo `always` agisce come bypass per questo controllo
- WhatsApp usa `channels.whatsapp.ackReaction` (qui non viene usato il legacy `messages.ackReaction`)

## Multi-account e credenziali

<AccordionGroup>
  <Accordion title="Selezione dell'account e valori predefiniti">
    - gli id account provengono da `channels.whatsapp.accounts`
    - selezione dell'account predefinito: `default` se presente, altrimenti il primo id account configurato (ordinato)
    - gli id account vengono normalizzati internamente per il lookup
  </Accordion>

  <Accordion title="Percorsi delle credenziali e compatibilità legacy">
    - percorso auth attuale: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - file di backup: `creds.json.bak`
    - l'auth legacy predefinita in `~/.openclaw/credentials/` è ancora riconosciuta/migrata per i flussi dell'account predefinito
  </Accordion>

  <Accordion title="Comportamento del logout">
    `openclaw channels logout --channel whatsapp [--account <id>]` cancella lo stato auth di WhatsApp per quell'account.

    Nelle directory auth legacy, `oauth.json` viene preservato mentre i file auth di Baileys vengono rimossi.

  </Accordion>
</AccordionGroup>

## Strumenti, azioni e scritture di configurazione

- Il supporto degli strumenti dell'agente include l'azione di reazione WhatsApp (`react`).
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
    Gli invii in uscita falliscono rapidamente quando non esiste alcun listener gateway attivo per l'account di destinazione.

    Assicurati che il gateway sia in esecuzione e che l'account sia collegato.

  </Accordion>

  <Accordion title="Messaggi di gruppo ignorati in modo imprevisto">
    Controlla in questo ordine:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - voci della allowlist `groups`
    - gating delle menzioni (`requireMention` + pattern di menzione)
    - chiavi duplicate in `openclaw.json` (JSON5): le voci successive sovrascrivono quelle precedenti, quindi mantieni un solo `groupPolicy` per ambito

  </Accordion>

  <Accordion title="Avviso runtime Bun">
    Il runtime del gateway WhatsApp dovrebbe usare Node. Bun è segnalato come incompatibile per il funzionamento stabile del gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Riferimenti alla configurazione

Riferimento principale:

- [Riferimento configurazione - WhatsApp](/gateway/configuration-reference#whatsapp)

Campi WhatsApp ad alto segnale:

- accesso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- consegna: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- multi-account: `accounts.<id>.enabled`, `accounts.<id>.authDir`, override a livello di account
- operazioni: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- comportamento della sessione: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`

## Correlati

- [Associazione](/it/channels/pairing)
- [Gruppi](/it/channels/groups)
- [Sicurezza](/gateway/security)
- [Instradamento dei canali](/it/channels/channel-routing)
- [Instradamento multi-agent](/concepts/multi-agent)
- [Risoluzione dei problemi](/channels/troubleshooting)
