---
read_when:
    - Lavorare sul comportamento del canale WhatsApp/web o sull'instradamento della inbox
summary: Supporto del canale WhatsApp, controlli di accesso, comportamento di consegna e operazioni
title: WhatsApp
x-i18n:
    generated_at: "2026-04-24T08:32:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51305dbf83109edb64d07bcafd5fe738ff97e3d2c779adfaef2e8406d1d93caf
    source_path: channels/whatsapp.md
    workflow: 15
---

Stato: pronto per la produzione tramite WhatsApp Web (Baileys). Il Gateway gestisce la/e sessione/i collegate.

## Installazione (su richiesta)

- L'onboarding (`openclaw onboard`) e `openclaw channels add --channel whatsapp`
  propongono l'installazione del Plugin WhatsApp la prima volta che lo selezioni.
- `openclaw channels login --channel whatsapp` offre anche il flusso di installazione quando
  il Plugin non è ancora presente.
- Canale dev + checkout git: usa per impostazione predefinita il percorso del Plugin locale.
- Stable/Beta: usa per impostazione predefinita il pacchetto npm `@openclaw/whatsapp`.

L'installazione manuale resta disponibile:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Abbinamento" icon="link" href="/it/channels/pairing">
    Il criterio DM predefinito è l'abbinamento per mittenti sconosciuti.
  </Card>
  <Card title="Risoluzione dei problemi del canale" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica trasversale ai canali e procedure di ripristino.
  </Card>
  <Card title="Configurazione del gateway" icon="settings" href="/it/gateway/configuration">
    Modelli completi di configurazione del canale ed esempi.
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

  <Step title="Avvia il gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Approva la prima richiesta di abbinamento (se usi la modalità pairing)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Le richieste di abbinamento scadono dopo 1 ora. Le richieste in sospeso sono limitate a 3 per canale.

  </Step>
</Steps>

<Note>
OpenClaw consiglia, quando possibile, di usare WhatsApp con un numero separato. (I metadati del canale e il flusso di configurazione sono ottimizzati per questa configurazione, ma sono supportate anche le configurazioni con numero personale.)
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
    L'onboarding supporta la modalità con numero personale e scrive una baseline compatibile con la chat verso sé stessi:

    - `dmPolicy: "allowlist"`
    - `allowFrom` include il tuo numero personale
    - `selfChatMode: true`

    In fase di runtime, le protezioni per la chat verso sé stessi si basano sul numero proprio collegato e su `allowFrom`.

  </Accordion>

  <Accordion title="Ambito canale solo WhatsApp Web">
    Il canale della piattaforma di messaggistica è basato su WhatsApp Web (`Baileys`) nell'attuale architettura dei canali OpenClaw.

    Non esiste un canale di messaggistica WhatsApp Twilio separato nel registro integrato dei canali chat.

  </Accordion>
</AccordionGroup>

## Modello di runtime

- Il Gateway gestisce il socket WhatsApp e il ciclo di riconnessione.
- Gli invii in uscita richiedono un listener WhatsApp attivo per l'account di destinazione.
- Le chat di stato e broadcast vengono ignorate (`@status`, `@broadcast`).
- Le chat dirette usano le regole della sessione DM (`session.dmScope`; il valore predefinito `main` comprime i DM nella sessione principale dell'agente).
- Le sessioni di gruppo sono isolate (`agent:<agentId>:whatsapp:group:<jid>`).
- Il trasporto WhatsApp Web rispetta le variabili d'ambiente proxy standard sull'host del gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / varianti minuscole). Preferisci la configurazione proxy a livello host rispetto a impostazioni proxy WhatsApp specifiche del canale.

## Controllo accessi e attivazione

<Tabs>
  <Tab title="Criterio DM">
    `channels.whatsapp.dmPolicy` controlla l'accesso alle chat dirette:

    - `pairing` (predefinito)
    - `allowlist`
    - `open` (richiede che `allowFrom` includa `"*"`)
    - `disabled`

    `allowFrom` accetta numeri in stile E.164 (normalizzati internamente).

    Sovrascrittura multi-account: `channels.whatsapp.accounts.<id>.dmPolicy` (e `allowFrom`) ha priorità sui valori predefiniti a livello canale per quell'account.

    Dettagli del comportamento a runtime:

    - gli abbinamenti vengono persistiti nell'allow-store del canale e uniti a `allowFrom` configurato
    - se non è configurata alcuna allowlist, il numero proprio collegato è consentito per impostazione predefinita
    - OpenClaw non esegue mai l'abbinamento automatico dei DM in uscita `fromMe` (messaggi che invii a te stesso dal dispositivo collegato)

  </Tab>

  <Tab title="Criterio gruppo + allowlist">
    L'accesso ai gruppi ha due livelli:

    1. **Allowlist dell'appartenenza al gruppo** (`channels.whatsapp.groups`)
       - se `groups` è omesso, tutti i gruppi sono idonei
       - se `groups` è presente, agisce come allowlist dei gruppi (`"*"` consentito)

    2. **Criterio mittente del gruppo** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: l'allowlist dei mittenti viene bypassata
       - `allowlist`: il mittente deve corrispondere a `groupAllowFrom` (oppure `*`)
       - `disabled`: blocca tutto il traffico in ingresso dei gruppi

    Fallback dell'allowlist dei mittenti:

    - se `groupAllowFrom` non è impostato, il runtime usa `allowFrom` come fallback quando disponibile
    - le allowlist dei mittenti vengono valutate prima dell'attivazione per menzione/risposta

    Nota: se non esiste alcun blocco `channels.whatsapp`, il fallback del criterio di gruppo a runtime è `allowlist` (con log di avviso), anche se `channels.defaults.groupPolicy` è impostato.

  </Tab>

  <Tab title="Menzioni + /activation">
    Le risposte nei gruppi richiedono per impostazione predefinita una menzione.

    Il rilevamento delle menzioni include:

    - menzioni WhatsApp esplicite dell'identità del bot
    - pattern regex di menzione configurati (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - rilevamento implicito della risposta al bot (il mittente della risposta corrisponde all'identità del bot)

    Nota di sicurezza:

    - la citazione/risposta soddisfa solo il controllo di menzione; **non** concede l'autorizzazione al mittente
    - con `groupPolicy: "allowlist"`, i mittenti non presenti in allowlist restano comunque bloccati anche se rispondono al messaggio di un utente presente in allowlist

    Comando di attivazione a livello sessione:

    - `/activation mention`
    - `/activation always`

    `activation` aggiorna lo stato della sessione (non la configurazione globale). È protetto dal controllo del proprietario.

  </Tab>
</Tabs>

## Comportamento con numero personale e chat verso sé stessi

Quando il numero proprio collegato è presente anche in `allowFrom`, si attivano le protezioni WhatsApp per la chat verso sé stessi:

- salta le conferme di lettura nei turni di chat verso sé stessi
- ignora il comportamento di attivazione automatica mention-JID che altrimenti farebbe ping a te stesso
- se `messages.responsePrefix` non è impostato, le risposte nella chat verso sé stessi usano per impostazione predefinita `[{identity.name}]` oppure `[openclaw]`

## Normalizzazione dei messaggi e contesto

<AccordionGroup>
  <Accordion title="Envelope in ingresso + contesto di risposta">
    I messaggi WhatsApp in ingresso vengono racchiusi nell'envelope condiviso di ingresso.

    Se esiste una risposta citata, il contesto viene aggiunto in questa forma:

    ```text
    [Risposta a <sender> id:<stanzaId>]
    <corpo citato o segnaposto media>
    [/Risposta]
    ```

    Vengono anche popolati i campi dei metadati di risposta quando disponibili (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164).

  </Accordion>

  <Accordion title="Segnaposto media ed estrazione di posizione/contatto">
    I messaggi in ingresso con soli media vengono normalizzati con segnaposto come:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    I corpi delle posizioni usano testo conciso con coordinate. Le etichette/commenti delle posizioni e i dettagli dei contatti/vCard vengono resi come metadati non attendibili delimitati, non come testo inline nel prompt.

  </Accordion>

  <Accordion title="Iniezione della cronologia di gruppo in sospeso">
    Per i gruppi, i messaggi non elaborati possono essere bufferizzati e inseriti come contesto quando il bot viene infine attivato.

    - limite predefinito: `50`
    - configurazione: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` disabilita

    Marcatori di iniezione:

    - `[Messaggi della chat dal tuo ultimo reply - per contesto]`
    - `[Messaggio corrente - rispondi a questo]`

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

    Sovrascrittura per account:

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

## Consegna, chunking e media

<AccordionGroup>
  <Accordion title="Chunking del testo">
    - limite chunk predefinito: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - la modalità `newline` preferisce i confini dei paragrafi (righe vuote), poi usa come fallback un chunking sicuro per lunghezza
  </Accordion>

  <Accordion title="Comportamento dei media in uscita">
    - supporta payload di immagini, video, audio (nota vocale PTT) e documenti
    - `audio/ogg` viene riscritto in `audio/ogg; codecs=opus` per la compatibilità con le note vocali
    - la riproduzione GIF animata è supportata tramite `gifPlayback: true` negli invii video
    - le didascalie vengono applicate al primo elemento multimediale quando si inviano payload di risposta multi-media
    - l'origine dei media può essere HTTP(S), `file://` o percorsi locali
  </Accordion>

  <Accordion title="Limiti di dimensione dei media e comportamento di fallback">
    - limite di salvataggio dei media in ingresso: `channels.whatsapp.mediaMaxMb` (predefinito `50`)
    - limite di invio dei media in uscita: `channels.whatsapp.mediaMaxMb` (predefinito `50`)
    - le sovrascritture per account usano `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - le immagini vengono ottimizzate automaticamente (ridimensionamento/scansione qualità) per rientrare nei limiti
    - in caso di errore nell'invio dei media, il fallback del primo elemento invia un avviso testuale invece di eliminare silenziosamente la risposta
  </Accordion>
</AccordionGroup>

## Citazione della risposta

WhatsApp supporta la citazione nativa della risposta, in cui le risposte in uscita citano visibilmente il messaggio in ingresso. Controllala con `channels.whatsapp.replyToMode`.

| Valore   | Comportamento                                                                       |
| -------- | ----------------------------------------------------------------------------------- |
| `"auto"` | Cita il messaggio in ingresso quando il provider lo supporta; altrimenti salta la citazione |
| `"on"`   | Cita sempre il messaggio in ingresso; usa come fallback un invio semplice se la citazione viene rifiutata |
| `"off"`  | Non cita mai; invia come messaggio semplice                                         |

Il valore predefinito è `"auto"`. Le sovrascritture per account usano `channels.whatsapp.accounts.<id>.replyToMode`.

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

| Livello       | Reazioni di ack | Reazioni avviate dall'agente | Descrizione                                       |
| ------------- | --------------- | ---------------------------- | ------------------------------------------------- |
| `"off"`       | No              | No                           | Nessuna reazione                                  |
| `"ack"`       | Sì              | No                           | Solo reazioni di ack (ricevuta pre-risposta)      |
| `"minimal"`   | Sì              | Sì (conservative)            | Ack + reazioni dell'agente con guida conservativa |
| `"extensive"` | Sì              | Sì (encouraged)              | Ack + reazioni dell'agente con guida incoraggiante |

Predefinito: `"minimal"`.

Le sovrascritture per account usano `channels.whatsapp.accounts.<id>.reactionLevel`.

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
Le reazioni di conferma sono controllate da `reactionLevel` — vengono soppresse quando `reactionLevel` è `"off"`.

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

- inviate immediatamente dopo che il messaggio in ingresso è stato accettato (prima della risposta)
- i guasti vengono registrati nei log ma non bloccano la normale consegna della risposta
- la modalità gruppo `mentions` reagisce nei turni attivati da menzione; l'attivazione di gruppo `always` agisce come bypass per questo controllo
- WhatsApp usa `channels.whatsapp.ackReaction` (il legacy `messages.ackReaction` non viene usato qui)

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
    - l'autenticazione legacy predefinita in `~/.openclaw/credentials/` è ancora riconosciuta/migrata per i flussi dell'account predefinito
  </Accordion>

  <Accordion title="Comportamento del logout">
    `openclaw channels logout --channel whatsapp [--account <id>]` cancella lo stato di autenticazione WhatsApp per quell'account.

    Nelle directory di autenticazione legacy, `oauth.json` viene preservato mentre i file di autenticazione Baileys vengono rimossi.

  </Accordion>
</AccordionGroup>

## Strumenti, azioni e scritture di configurazione

- Il supporto degli strumenti dell'agente include l'azione di reazione WhatsApp (`react`).
- Controlli delle azioni:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Le scritture di configurazione avviate dal canale sono abilitate per impostazione predefinita (disabilita con `channels.whatsapp.configWrites=false`).

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
    Gli invii in uscita falliscono rapidamente quando non esiste un listener gateway attivo per l'account di destinazione.

    Assicurati che il gateway sia in esecuzione e che l'account sia collegato.

  </Accordion>

  <Accordion title="Messaggi di gruppo ignorati inaspettatamente">
    Controlla in questo ordine:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - voci dell'allowlist `groups`
    - controllo delle menzioni (`requireMention` + pattern di menzione)
    - chiavi duplicate in `openclaw.json` (JSON5): le voci successive sovrascrivono quelle precedenti, quindi mantieni un solo `groupPolicy` per ambito

  </Accordion>

  <Accordion title="Avviso runtime Bun">
    Il runtime del gateway WhatsApp dovrebbe usare Node. Bun è segnalato come incompatibile per un funzionamento stabile del gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompt di sistema

WhatsApp supporta prompt di sistema in stile Telegram per gruppi e chat dirette tramite le mappe `groups` e `direct`.

Gerarchia di risoluzione per i messaggi di gruppo:

La mappa `groups` effettiva viene determinata per prima: se l'account definisce il proprio `groups`, sostituisce completamente la mappa `groups` radice (nessun merge profondo). La ricerca del prompt viene quindi eseguita sulla singola mappa risultante:

1. **Prompt di sistema specifico del gruppo** (`groups["<groupId>"].systemPrompt`): usato se la voce del gruppo specifico definisce un `systemPrompt`.
2. **Prompt di sistema wildcard del gruppo** (`groups["*"].systemPrompt`): usato quando la voce del gruppo specifico è assente o non definisce `systemPrompt`.

Gerarchia di risoluzione per i messaggi diretti:

La mappa `direct` effettiva viene determinata per prima: se l'account definisce il proprio `direct`, sostituisce completamente la mappa `direct` radice (nessun merge profondo). La ricerca del prompt viene quindi eseguita sulla singola mappa risultante:

1. **Prompt di sistema specifico del diretto** (`direct["<peerId>"].systemPrompt`): usato se la voce del peer specifico definisce un `systemPrompt`.
2. **Prompt di sistema wildcard del diretto** (`direct["*"].systemPrompt`): usato quando la voce del peer specifico è assente o non definisce `systemPrompt`.

Nota: `dms` resta il bucket leggero di override della cronologia per singolo DM (`dms.<id>.historyLimit`); gli override dei prompt si trovano sotto `direct`.

**Differenza rispetto al comportamento multi-account di Telegram:** In Telegram, `groups` radice viene intenzionalmente soppresso per tutti gli account in una configurazione multi-account — anche per gli account che non definiscono `groups` propri — per impedire che un bot riceva messaggi di gruppo per gruppi a cui non appartiene. WhatsApp non applica questa protezione: `groups` radice e `direct` radice vengono sempre ereditati dagli account che non definiscono un override a livello account, indipendentemente da quanti account siano configurati. In una configurazione WhatsApp multi-account, se vuoi prompt di gruppo o diretti per account, definisci esplicitamente la mappa completa sotto ogni account invece di affidarti ai valori predefiniti a livello radice.

Comportamento importante:

- `channels.whatsapp.groups` è sia una mappa di configurazione per gruppo sia l'allowlist dei gruppi a livello chat. Sia all'ambito radice sia all'ambito account, `groups["*"]` significa "tutti i gruppi sono ammessi" per quell'ambito.
- Aggiungi un `systemPrompt` wildcard di gruppo solo quando vuoi già che quell'ambito ammetta tutti i gruppi. Se vuoi ancora che sia idoneo solo un insieme fisso di ID gruppo, non usare `groups["*"]` come valore predefinito del prompt. Ripeti invece il prompt su ogni voce di gruppo esplicitamente in allowlist.
- L'ammissione del gruppo e l'autorizzazione del mittente sono controlli separati. `groups["*"]` amplia l'insieme dei gruppi che possono raggiungere la gestione di gruppo, ma non autorizza di per sé tutti i mittenti in quei gruppi. L'accesso del mittente è ancora controllato separatamente da `channels.whatsapp.groupPolicy` e `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` non ha lo stesso effetto collaterale per i DM. `direct["*"]` fornisce solo una configurazione predefinita della chat diretta dopo che un DM è già stato ammesso da `dmPolicy` più `allowFrom` o dalle regole del pairing-store.

Esempio:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Usa solo se tutti i gruppi devono essere ammessi nell'ambito radice.
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
            // Questo account definisce i propri groups, quindi i groups radice sono
            // completamente sostituiti. Per mantenere una wildcard, definisci
            // esplicitamente anche "*" qui.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Concentrati sulla gestione del progetto.",
            },
            // Usa solo se tutti i gruppi devono essere ammessi in questo account.
            "*": { systemPrompt: "Prompt predefinito per i gruppi di lavoro." },
          },
          direct: {
            // Questo account definisce la propria mappa direct, quindi le voci direct radice
            // vengono completamente sostituite. Per mantenere una wildcard, definisci
            // esplicitamente anche "*" qui.
            "+15551234567": { systemPrompt: "Prompt per una chat diretta di lavoro specifica." },
            "*": { systemPrompt: "Prompt predefinito per le chat dirette di lavoro." },
          },
        },
      },
    },
  },
}
```

## Riferimenti alla configurazione

Riferimento principale:

- [Riferimento configurazione - WhatsApp](/it/gateway/config-channels#whatsapp)

Campi WhatsApp ad alta priorità:

- accesso: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- consegna: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- multi-account: `accounts.<id>.enabled`, `accounts.<id>.authDir`, override a livello account
- operazioni: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- comportamento della sessione: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompt: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Correlati

- [Abbinamento](/it/channels/pairing)
- [Gruppi](/it/channels/groups)
- [Sicurezza](/it/gateway/security)
- [Instradamento dei canali](/it/channels/channel-routing)
- [Instradamento multi-agent](/it/concepts/multi-agent)
- [Risoluzione dei problemi](/it/channels/troubleshooting)
