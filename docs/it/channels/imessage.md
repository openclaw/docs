---
read_when:
    - Configurazione del supporto per iMessage
    - Debug dell'invio/ricezione di iMessage
summary: Supporto nativo per iMessage tramite imsg (JSON-RPC su stdio), con azioni API private per risposte, tapback, effetti, allegati e gestione dei gruppi. Preferito per le nuove configurazioni iMessage di OpenClaw quando i requisiti dell'host sono compatibili.
title: iMessage
x-i18n:
    generated_at: "2026-05-11T20:20:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: cbce499e35c3dac12e6bb3f157d624a02a9bc8c26356f3decdfe62c85db6ee15
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Per le distribuzioni OpenClaw iMessage, usa `imsg` su un host macOS Messages con accesso effettuato. Se il Gateway viene eseguito su Linux o Windows, punta `channels.imessage.cliPath` a un wrapper SSH che esegue `imsg` sul Mac.

**Il recupero dopo inattività del Gateway è facoltativo.** Quando abilitato (`channels.imessage.catchup.enabled: true`), il gateway riproduce i messaggi in ingresso arrivati in `chat.db` mentre era offline (crash, riavvio, sospensione del Mac) al successivo avvio. Disabilitato per impostazione predefinita — vedi [Recupero dopo inattività del gateway](#catching-up-after-gateway-downtime). Chiude [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649).
</Note>

<Warning>
Il supporto a BlueBubbles è stato rimosso. Migra le configurazioni `channels.bluebubbles` a `channels.imessage`; OpenClaw supporta iMessage solo tramite `imsg`. Inizia da [Rimozione di BlueBubbles e percorso imsg per iMessage](/it/announcements/bluebubbles-imessage) per l'annuncio breve, oppure da [Da BlueBubbles](/it/channels/imessage-from-bluebubbles) per la tabella di migrazione completa.
</Warning>

Stato: integrazione CLI esterna nativa. Gateway avvia `imsg rpc` e comunica tramite JSON-RPC su stdio (nessun demone/porta separato). Le azioni avanzate richiedono `imsg launch` e una verifica riuscita dell'API privata.

<CardGroup cols={3}>
  <Card title="Azioni API private" icon="wand-sparkles" href="#private-api-actions">
    Risposte, tapback, effetti, allegati e gestione dei gruppi.
  </Card>
  <Card title="Associazione" icon="link" href="/it/channels/pairing">
    I DM iMessage usano per impostazione predefinita la modalità di associazione.
  </Card>
  <Card title="Mac remoto" icon="terminal" href="#remote-mac-over-ssh">
    Usa un wrapper SSH quando il Gateway non è in esecuzione sul Mac con Messages.
  </Card>
  <Card title="Riferimento di configurazione" icon="settings" href="/it/gateway/config-channels#imessage">
    Riferimento completo dei campi iMessage.
  </Card>
</CardGroup>

## Configurazione rapida

<Tabs>
  <Tab title="Mac locale (percorso rapido)">
    <Steps>
      <Step title="Installa e verifica imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="Configura OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Avvia gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Approva la prima associazione DM (dmPolicy predefinita)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Le richieste di associazione scadono dopo 1 ora.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac remoto tramite SSH">
    OpenClaw richiede solo un `cliPath` compatibile con stdio, quindi puoi puntare `cliPath` a uno script wrapper che si connette via SSH a un Mac remoto ed esegue `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Configurazione consigliata quando gli allegati sono abilitati:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Se `remoteHost` non è impostato, OpenClaw tenta di rilevarlo automaticamente analizzando lo script wrapper SSH.
    `remoteHost` deve essere `host` o `user@host` (senza spazi o opzioni SSH).
    OpenClaw usa la verifica rigorosa della chiave host per SCP, quindi la chiave host del relay deve già esistere in `~/.ssh/known_hosts`.
    I percorsi degli allegati sono convalidati rispetto alle radici consentite (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Requisiti e permessi (macOS)

- Messages deve avere l'accesso effettuato sul Mac che esegue `imsg`.
- È richiesto l'accesso completo al disco per il contesto del processo che esegue OpenClaw/`imsg` (accesso al DB di Messages).
- È richiesto il permesso di automazione per inviare messaggi tramite Messages.app.
- Per le azioni avanzate (reazione / modifica / annullamento invio / risposta in thread / effetti / operazioni sui gruppi), System Integrity Protection deve essere disabilitato — vedi [Abilitare l'API privata di imsg](#enabling-the-imsg-private-api) sotto. L'invio/ricezione di testo e media di base funziona senza.

<Tip>
I permessi vengono concessi per contesto di processo. Se gateway viene eseguito senza interfaccia (LaunchAgent/SSH), esegui un comando interattivo una tantum nello stesso contesto per attivare le richieste:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Abilitare l'API privata di imsg

`imsg` viene fornito in due modalità operative:

- **Modalità di base** (predefinita, nessuna modifica SIP necessaria): testo e media in uscita tramite `send`, monitoraggio/cronologia in ingresso, elenco chat. È ciò che ottieni subito dopo una nuova installazione con `brew install steipete/tap/imsg` più i permessi macOS standard indicati sopra.
- **Modalità API privata**: `imsg` inietta una dylib helper in `Messages.app` per chiamare funzioni interne di `IMCore`. Questo sblocca `react`, `edit`, `unsend`, `reply` (in thread), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, oltre a indicatori di digitazione e ricevute di lettura.

Per raggiungere la superficie di azioni avanzate documentata da questa pagina del canale, serve la modalità API privata. Il README di `imsg` è esplicito sul requisito:

> Funzionalità avanzate come `read`, `typing`, `launch`, invio avanzato basato su bridge, mutazione dei messaggi e gestione delle chat sono facoltative. Richiedono che SIP sia disabilitato e che una dylib helper venga iniettata in `Messages.app`. `imsg launch` rifiuta l'iniezione quando SIP è abilitato.

La tecnica di iniezione dell'helper usa la dylib di `imsg` per raggiungere le API private di Messages. Nel percorso OpenClaw iMessage non è presente alcun server di terze parti né runtime BlueBubbles.

<Warning>
**Disabilitare SIP è un vero compromesso di sicurezza.** SIP è una delle protezioni principali di macOS contro l'esecuzione di codice di sistema modificato; disattivarlo a livello di sistema apre ulteriore superficie di attacco ed effetti collaterali. In particolare, **disabilitare SIP sui Mac Apple Silicon disabilita anche la possibilità di installare ed eseguire app iOS sul Mac**.

Consideralo una scelta operativa deliberata, non un'impostazione predefinita. Se il tuo modello di minaccia non può tollerare SIP disattivato, iMessage integrato è limitato alla modalità di base — solo invio/ricezione di testo e media, niente reazioni / modifica / annullamento invio / effetti / operazioni sui gruppi.
</Warning>

### Configurazione

1. **Installa (o aggiorna) `imsg`** sul Mac che esegue Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   L'output di `imsg status --json` riporta `bridge_version`, `rpc_methods` e `selectors` per metodo, così puoi vedere cosa supporta la build corrente prima di iniziare.

2. **Disabilita System Integrity Protection.** Questa operazione dipende dalla versione di macOS perché il requisito Apple sottostante dipende da sistema operativo e hardware:
   - **macOS 10.13–10.15 (Sierra–Catalina):** disabilita Library Validation tramite Terminale, riavvia in Recovery Mode, esegui `csrutil disable`, riavvia.
   - **macOS 11+ (Big Sur e successivi), Intel:** Recovery Mode (o Internet Recovery), `csrutil disable`, riavvia.
   - **macOS 11+, Apple Silicon:** sequenza di avvio con pulsante di accensione per entrare in Recovery; nelle versioni recenti di macOS tieni premuto il tasto **Maiusc sinistro** quando fai clic su Continua, poi `csrutil disable`. Le configurazioni con macchina virtuale seguono un flusso separato — crea prima uno snapshot della VM.
   - **macOS 26 / Tahoe:** le policy di library validation e i controlli dei diritti privati di `imagent` sono stati ulteriormente irrigiditi; `imsg` potrebbe richiedere una build aggiornata per restare compatibile. Se l'iniezione di `imsg launch` o specifici `selectors` iniziano a restituire false dopo un aggiornamento major di macOS, controlla le note di rilascio di `imsg` prima di presumere che il passaggio SIP sia riuscito.

   Segui il flusso Recovery Mode di Apple per il tuo Mac per disabilitare SIP prima di eseguire `imsg launch`.

3. **Inietta l'helper.** Con SIP disabilitato e accesso effettuato in Messages.app:

   ```bash
   imsg launch
   ```

   `imsg launch` rifiuta l'iniezione quando SIP è ancora abilitato, quindi questo funge anche da conferma che il passaggio 2 abbia avuto effetto.

4. **Verifica il bridge da OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   La voce iMessage dovrebbe riportare `works`, e `imsg status --json | jq '.selectors'` dovrebbe mostrare `retractMessagePart: true` più eventuali selettori di modifica / digitazione / lettura esposti dalla tua build macOS. Il gating per metodo del Plugin OpenClaw in `actions.ts` pubblicizza solo le azioni il cui selettore sottostante è `true`, quindi la superficie di azione che vedi nell'elenco strumenti dell'agente riflette ciò che il bridge può effettivamente fare su questo host.

Se `openclaw channels status --probe` segnala il canale come `works` ma azioni specifiche generano "iMessage `<action>` requires the imsg private API bridge" al momento della dispatch, esegui di nuovo `imsg launch` — l'helper può disattivarsi (riavvio di Messages.app, aggiornamento OS, ecc.) e lo stato `available: true` memorizzato nella cache continuerà a pubblicizzare le azioni fino a quando la prossima verifica non lo aggiorna.

### Quando non puoi disabilitare SIP

Se SIP disabilitato non è accettabile per il tuo modello di minaccia:

- `imsg` ripiega sulla modalità di base — solo testo + media + ricezione.
- Il Plugin OpenClaw continua a pubblicizzare invio di testo/media e monitoraggio in ingresso; nasconde solo `react`, `edit`, `unsend`, `reply`, `sendWithEffect` e operazioni sui gruppi dalla superficie di azione (secondo il gate di capacità per metodo).
- Puoi eseguire un Mac separato non Apple Silicon (o un Mac bot dedicato) con SIP disattivato per il carico di lavoro iMessage, mantenendo SIP abilitato sui dispositivi principali. Vedi [Utente bot macOS dedicato (identità iMessage separata)](#deployment-patterns) sotto.

## Controllo degli accessi e routing

<Tabs>
  <Tab title="Policy DM">
    `channels.imessage.dmPolicy` controlla i messaggi diretti:

    - `pairing` (predefinito)
    - `allowlist`
    - `open` (richiede che `allowFrom` includa `"*"`)
    - `disabled`

    Campo allowlist: `channels.imessage.allowFrom`.

    Le voci dell'allowlist possono essere handle, gruppi statici di accesso mittente (`accessGroup:<name>`) o destinazioni chat (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Policy gruppi + menzioni">
    `channels.imessage.groupPolicy` controlla la gestione dei gruppi:

    - `allowlist` (predefinito quando configurato)
    - `open`
    - `disabled`

    Allowlist mittenti dei gruppi: `channels.imessage.groupAllowFrom`.

    Le voci di `groupAllowFrom` possono anche fare riferimento a gruppi statici di accesso mittente (`accessGroup:<name>`).

    Fallback runtime: se `groupAllowFrom` non è impostato, i controlli sui mittenti dei gruppi iMessage ripiegano su `allowFrom` quando disponibile.
    Nota runtime: se `channels.imessage` manca completamente, il runtime ripiega su `groupPolicy="allowlist"` e registra un avviso (anche se `channels.defaults.groupPolicy` è impostato).

    <Warning>
    Il routing dei gruppi ha **due** gate di allowlist eseguiti in sequenza, ed entrambi devono passare:

    1. **Allowlist mittente / destinazione chat** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier` o `chat_id`.
    2. **Registro gruppi** (`channels.imessage.groups`) — con `groupPolicy: "allowlist"`, questo gate richiede una voce wildcard `groups: { "*": { ... } }` (imposta `allowAll = true`) oppure una voce esplicita per `chat_id` sotto `groups`.

    Se il gate 2 non contiene nulla, ogni messaggio di gruppo viene scartato. Il Plugin emette due segnali di livello `warn` al livello di log predefinito:

    - una volta per account all'avvio: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - una volta per `chat_id` in runtime: `imessage: dropping group message from chat_id=<id> ...`

    I DM continuano a funzionare perché seguono un percorso di codice diverso.

    Configurazione minima per mantenere attivi i gruppi con `groupPolicy: "allowlist"`:

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: { "*": { "requireMention": true } },
        },
      },
    }
    ```

    Se quelle righe `warn` compaiono nel log del Gateway, il gate 2 sta scartando i messaggi: aggiungi il blocco `groups`.
    </Warning>

    Menziona il gating per i gruppi:

    - iMessage non ha metadati nativi per le menzioni
    - il rilevamento delle menzioni usa pattern regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - senza pattern configurati, il gating delle menzioni non può essere applicato

    I comandi di controllo provenienti da mittenti autorizzati possono bypassare il gating delle menzioni nei gruppi.

    `systemPrompt` per gruppo:

    Ogni voce sotto `channels.imessage.groups.*` accetta una stringa `systemPrompt` opzionale. Il valore viene iniettato nel prompt di sistema dell'agente a ogni turno che gestisce un messaggio in quel gruppo. La risoluzione rispecchia la risoluzione del prompt per gruppo usata da `channels.whatsapp.groups`:

    1. **Prompt di sistema specifico del gruppo** (`groups["<chat_id>"].systemPrompt`): usato quando la voce specifica del gruppo esiste nella mappa **e** la sua chiave `systemPrompt` è definita. Se `systemPrompt` è una stringa vuota (`""`), il wildcard viene soppresso e a quel gruppo non viene applicato alcun prompt di sistema.
    2. **Prompt di sistema wildcard per gruppi** (`groups["*"].systemPrompt`): usato quando la voce specifica del gruppo è completamente assente dalla mappa, o quando esiste ma non definisce alcuna chiave `systemPrompt`.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Use British spelling." },
            "8421": {
              requireMention: true,
              systemPrompt: "This is the on-call rotation chat. Keep replies under 3 sentences.",
            },
            "9907": {
              // explicit suppression: the wildcard "Use British spelling." does not apply here
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    I prompt per gruppo si applicano solo ai messaggi di gruppo: i messaggi diretti in questo canale non sono interessati.

  </Tab>

  <Tab title="Sessioni e risposte deterministiche">
    - I DM usano il routing diretto; i gruppi usano il routing di gruppo.
    - Con `session.dmScope=main` predefinito, i DM iMessage confluiscono nella sessione principale dell'agente.
    - Le sessioni di gruppo sono isolate (`agent:<agentId>:imessage:group:<chat_id>`).
    - Le risposte vengono instradate di nuovo a iMessage usando i metadati del canale/target di origine.

    Comportamento dei thread simili a gruppi:

    Alcuni thread iMessage con più partecipanti possono arrivare con `is_group=false`.
    Se quel `chat_id` è configurato esplicitamente sotto `channels.imessage.groups`, OpenClaw lo tratta come traffico di gruppo (gating di gruppo + isolamento della sessione di gruppo).

  </Tab>
</Tabs>

## Binding delle conversazioni ACP

Anche le chat iMessage legacy possono essere associate a sessioni ACP.

Flusso rapido per l'operatore:

- Esegui `/acp spawn codex --bind here` dentro il DM o la chat di gruppo consentita.
- I messaggi futuri nella stessa conversazione iMessage vengono instradati alla sessione ACP generata.
- `/new` e `/reset` reimpostano sul posto la stessa sessione ACP associata.
- `/acp close` chiude la sessione ACP e rimuove il binding.

I binding persistenti configurati sono supportati tramite voci `bindings[]` di primo livello con `type: "acp"` e `match.channel: "imessage"`.

`match.peer.id` può usare:

- handle DM normalizzato come `+15555550123` o `user@example.com`
- `chat_id:<id>` (consigliato per binding di gruppo stabili)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Esempio:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

Consulta [Agenti ACP](/it/tools/acp-agents) per il comportamento condiviso dei binding ACP.

## Pattern di deployment

<AccordionGroup>
  <Accordion title="Utente macOS bot dedicato (identità iMessage separata)">
    Usa un Apple ID e un utente macOS dedicati, così il traffico del bot è isolato dal tuo profilo personale di Messaggi.

    Flusso tipico:

    1. Crea/accedi con un utente macOS dedicato.
    2. Accedi a Messaggi con l'Apple ID del bot in quell'utente.
    3. Installa `imsg` in quell'utente.
    4. Crea un wrapper SSH così OpenClaw può eseguire `imsg` nel contesto di quell'utente.
    5. Punta `channels.imessage.accounts.<id>.cliPath` e `.dbPath` a quel profilo utente.

    La prima esecuzione può richiedere approvazioni GUI (Automazione + Accesso completo al disco) nella sessione utente del bot.

  </Accordion>

  <Accordion title="Mac remoto tramite Tailscale (esempio)">
    Topologia comune:

    - il Gateway gira su Linux/VM
    - iMessage + `imsg` gira su un Mac nella tua tailnet
    - il wrapper `cliPath` usa SSH per eseguire `imsg`
    - `remoteHost` abilita il recupero degli allegati via SCP

    Esempio:

    ```json5
    {
      channels: {
        imessage: {
          enabled: true,
          cliPath: "~/.openclaw/scripts/imsg-ssh",
          remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
          includeAttachments: true,
          dbPath: "/Users/bot/Library/Messages/chat.db",
        },
      },
    }
    ```

    ```bash
    #!/usr/bin/env bash
    exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
    ```

    Usa chiavi SSH così sia SSH sia SCP sono non interattivi.
    Assicurati prima che la chiave host sia attendibile (per esempio `ssh bot@mac-mini.tailnet-1234.ts.net`) così `known_hosts` viene popolato.

  </Accordion>

  <Accordion title="Pattern multi-account">
    iMessage supporta la configurazione per account sotto `channels.imessage.accounts`.

    Ogni account può sovrascrivere campi come `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, impostazioni della cronologia e allowlist delle radici degli allegati.

  </Accordion>
</AccordionGroup>

## Media, chunking e target di recapito

<AccordionGroup>
  <Accordion title="Allegati e media">
    - l'acquisizione degli allegati in ingresso è **disattivata per impostazione predefinita**: imposta `channels.imessage.includeAttachments: true` per inoltrare foto, memo vocali, video e altri allegati all'agente. Quando è disattivata, gli iMessage composti solo da allegati vengono scartati prima di raggiungere l'agente e potrebbero non produrre alcuna riga di log `Inbound message`.
    - i percorsi degli allegati remoti possono essere recuperati via SCP quando `remoteHost` è impostato
    - i percorsi degli allegati devono corrispondere a radici consentite:
      - `channels.imessage.attachmentRoots` (locale)
      - `channels.imessage.remoteAttachmentRoots` (modalità SCP remota)
      - pattern di radice predefinito: `/Users/*/Library/Messages/Attachments`
    - SCP usa il controllo rigoroso della chiave host (`StrictHostKeyChecking=yes`)
    - la dimensione dei media in uscita usa `channels.imessage.mediaMaxMb` (predefinito 16 MB)

  </Accordion>

  <Accordion title="Chunking in uscita">
    - limite dei chunk di testo: `channels.imessage.textChunkLimit` (predefinito 4000)
    - modalità chunk: `channels.imessage.chunkMode`
      - `length` (predefinita)
      - `newline` (suddivisione con priorità ai paragrafi)

  </Accordion>

  <Accordion title="Formati di indirizzamento">
    Target espliciti preferiti:

    - `chat_id:123` (consigliato per routing stabile)
    - `chat_guid:...`
    - `chat_identifier:...`

    Sono supportati anche i target handle:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Azioni API private

Quando `imsg launch` è in esecuzione e `openclaw channels status --probe` segnala `privateApi.available: true`, lo strumento messaggi può usare azioni native di iMessage oltre ai normali invii di testo.

```json5
{
  channels: {
    imessage: {
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
        renameGroup: true,
        setGroupIcon: true,
        addParticipant: true,
        removeParticipant: true,
        leaveGroup: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Azioni disponibili">
    - **react**: aggiungi/rimuovi tapback iMessage (`messageId`, `emoji`, `remove`). I tapback supportati mappano a amore, mi piace, non mi piace, risata, enfasi e domanda.
    - **reply**: invia una risposta in thread a un messaggio esistente (`messageId`, `text` o `message`, più `chatGuid`, `chatId`, `chatIdentifier` o `to`).
    - **sendWithEffect**: invia testo con un effetto iMessage (`text` o `message`, `effect` o `effectId`).
    - **edit**: modifica un messaggio inviato su versioni macOS/API private supportate (`messageId`, `text` o `newText`).
    - **unsend**: ritira un messaggio inviato su versioni macOS/API private supportate (`messageId`).
    - **upload-file**: invia media/file (`buffer` in base64 o un `media`/`path`/`filePath` idratato, `filename`, `asVoice` opzionale). Alias legacy: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: gestisci le chat di gruppo quando il target corrente è una conversazione di gruppo.

  </Accordion>

  <Accordion title="ID dei messaggi">
    Il contesto iMessage in ingresso include sia valori `MessageSid` brevi sia GUID completi dei messaggi quando disponibili. Gli ID brevi sono limitati alla cache recente in memoria delle risposte e vengono verificati rispetto alla chat corrente prima dell'uso. Se un ID breve è scaduto o appartiene a un'altra chat, riprova con il `MessageSidFull` completo.

  </Accordion>

  <Accordion title="Rilevamento delle capability">
    OpenClaw nasconde le azioni API private solo quando lo stato della probe memorizzato nella cache indica che il bridge non è disponibile. Se lo stato è sconosciuto, le azioni restano visibili e il dispatch esegue le probe in modo lazy, così la prima azione può riuscire dopo `imsg launch` senza un aggiornamento manuale separato dello stato.

  </Accordion>

  <Accordion title="Conferme di lettura e digitazione">
    Quando il bridge API privato è attivo, le chat in ingresso accettate vengono contrassegnate come lette prima del dispatch e al mittente viene mostrata una bolla di digitazione mentre l'agente genera. Disattiva la marcatura come letto con:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Le build `imsg` più vecchie che precedono l'elenco di capability per metodo disabiliteranno silenziosamente digitazione/lettura; OpenClaw registra un avviso una tantum a ogni riavvio, così la conferma mancante è attribuibile.

  </Accordion>
</AccordionGroup>

## Scritture di configurazione

iMessage consente per impostazione predefinita scritture di configurazione avviate dal canale (per `/config set|unset` quando `commands.config: true`).

Disattiva:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Coalescing dei DM split-send (comando + URL in una sola composizione)

Quando un utente digita insieme un comando e un URL, per esempio `Dump https://example.com/article`, l'app Messaggi di Apple divide l'invio in **due righe `chat.db` separate**:

1. Un messaggio di testo (`"Dump"`).
2. Un fumetto di anteprima URL (`"https://..."`) con immagini di anteprima OG come allegati.

Le due righe arrivano a OpenClaw a circa 0,8-2,0 s di distanza nella maggior parte delle configurazioni. Senza coalescing, l'agente riceve solo il comando al turno 1, risponde (spesso "inviami l'URL") e vede l'URL solo al turno 2, momento in cui il contesto del comando è già perso. Questo è il pipeline di invio di Apple, non qualcosa introdotto da OpenClaw o `imsg`.

`channels.imessage.coalesceSameSenderDms` abilita per un DM la fusione di righe consecutive dello stesso mittente in un singolo turno dell'agente. Le chat di gruppo continuano a fare dispatch per messaggio, così la struttura dei turni multiutente viene preservata.

<Tabs>
  <Tab title="Quando abilitarlo">
    Abilitalo quando:

    - Distribuisci Skills che si aspettano `command + payload` in un unico messaggio (dump, incolla, salva, coda, ecc.).
    - I tuoi utenti incollano URL, immagini o contenuti lunghi insieme ai comandi.
    - Puoi accettare la latenza aggiuntiva dei turni DM (vedi sotto).

    Lascialo disattivato quando:

    - Ti serve la latenza minima dei comandi per trigger DM di una sola parola.
    - Tutti i tuoi flussi sono comandi one-shot senza follow-up con payload.

  </Tab>
  <Tab title="Enabling">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Con il flag attivo e senza un `messages.inbound.byChannel.imessage` esplicito, la finestra di debounce si amplia a **2500 ms** (il valore predefinito legacy è 0 ms, nessun debounce). La finestra più ampia è necessaria perché la cadenza di invio separato di Apple, pari a 0,8-2,0 s, non rientra in un valore predefinito più stretto.

    Per regolare personalmente la finestra:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is
            // slow or under memory pressure (observed gap can stretch past 2 s
            // then).
            imessage: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Trade-offs">
    - **Latenza aggiunta per i messaggi DM.** Con il flag attivo, ogni DM (inclusi i comandi di controllo autonomi e i follow-up con un solo testo) attende fino alla finestra di debounce prima dell'invio, nel caso stia arrivando una riga del payload. I messaggi delle chat di gruppo mantengono l'invio immediato.
    - **L'output unito è limitato.** Il testo unito ha un limite di 4000 caratteri con un marcatore esplicito `…[truncated]`; gli allegati hanno un limite di 20; le voci sorgente hanno un limite di 10 (oltre tale limite vengono mantenute la prima e le più recenti). Ogni GUID sorgente viene tracciato in `coalescedMessageGuids` per la telemetria a valle.
    - **Solo DM.** Le chat di gruppo passano all'invio per messaggio, così il bot resta reattivo quando più persone stanno scrivendo.
    - **Opt-in, per canale.** Gli altri canali (Telegram, WhatsApp, Slack, …) non sono interessati. Le configurazioni BlueBubbles legacy che impostano `channels.bluebubbles.coalesceSameSenderDms` devono migrare quel valore in `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Scenari e cosa vede l'agente

| L'utente compone                                                   | `chat.db` produce     | Flag disattivato (predefinito)          | Flag attivato + finestra di 2500 ms                                      |
| ------------------------------------------------------------------ | --------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (un invio)                              | 2 righe a ~1 s di distanza | Due turni agente: solo "Dump", poi URL | Un turno: testo unito `Dump https://example.com`                        |
| `Save this 📎image.jpg caption` (allegato + testo)                | 2 righe               | Due turni (allegato scartato all'unione) | Un turno: testo + immagine conservati                                    |
| `/status` (comando autonomo)                                      | 1 riga                | Invio immediato                         | **Attende fino alla finestra, poi invia**                                |
| URL incollato da solo                                              | 1 riga                | Invio immediato                         | Invio immediato (una sola voce nel bucket)                               |
| Testo + URL inviati come due messaggi separati deliberati, a minuti di distanza | 2 righe fuori finestra | Due turni                               | Due turni (la finestra scade tra loro)                                   |
| Raffica rapida (>10 piccoli DM nella finestra)                     | N righe               | N turni                                 | Un turno, output limitato (prima + più recenti, limiti di testo/allegati applicati) |
| Due persone scrivono in una chat di gruppo                         | N righe da M mittenti | M+ turni (uno per bucket mittente)      | M+ turni: le chat di gruppo non vengono coalesciute                      |

## Recupero dopo inattività del Gateway

Quando il Gateway è offline (crash, riavvio, sospensione del Mac, macchina spenta), `imsg watch` riprende dallo stato corrente di `chat.db` quando il Gateway torna attivo: tutto ciò che è arrivato durante l'intervallo, per impostazione predefinita, non viene mai visto. Il recupero riproduce quei messaggi all'avvio successivo, così l'agente non perde silenziosamente traffico in ingresso.

Il recupero è **disabilitato per impostazione predefinita**. Abilitalo per canale:

```ts
channels: {
  imessage: {
    catchup: {
      enabled: true,             // master switch (default: false)
      maxAgeMinutes: 120,        // skip rows older than now - 2h (default: 120, clamp 1..720)
      perRunLimit: 50,           // max rows replayed per startup (default: 50, clamp 1..500)
      firstRunLookbackMinutes: 30, // first run with no cursor: look back 30 min (default: 30)
      maxFailureRetries: 10,     // give up on a wedged guid after 10 dispatch failures (default: 10)
    },
  },
}
```

### Come viene eseguito

Un passaggio per ogni avvio di `monitorIMessageProvider`, sequenziato come `imsg launch` pronto → `watch.subscribe` → `performIMessageCatchup` → ciclo di invio live. Il recupero usa `chats.list` + `messages.history` per chat tramite lo stesso client JSON-RPC usato da `imsg watch`. Tutto ciò che arriva durante il passaggio di recupero attraversa normalmente l'invio live; la cache di deduplica in ingresso esistente assorbe eventuali sovrapposizioni con le righe riprodotte.

Ogni riga riprodotta viene fatta passare nel percorso di invio live (`evaluateIMessageInbound` + `dispatchInboundMessage`), quindi allowlist, policy di gruppo, debouncer, cache echo e conferme di lettura si comportano in modo identico sui messaggi riprodotti e live.

### Semantica di cursore e nuovi tentativi

Il recupero mantiene un cursore per account in `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` (la directory di stato OpenClaw predefinita è `~/.openclaw`, sovrascrivibile con `OPENCLAW_STATE_DIR`):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- Il cursore avanza a ogni invio riuscito e viene mantenuto quando l'invio di una riga genera un'eccezione: l'avvio successivo ritenta la stessa riga dal cursore mantenuto.
- Dopo `maxFailureRetries` eccezioni consecutive sullo stesso `guid`, il recupero registra un `warn` e forza l'avanzamento del cursore oltre il messaggio bloccato, così gli avvii successivi possono progredire.
- I guid già abbandonati vengono saltati non appena visti (senza tentativo di invio) nelle esecuzioni successive e conteggiati in `skippedGivenUp` nel riepilogo dell'esecuzione.

### Segnali visibili all'operatore

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

Una riga `WARN ... capped to perRunLimit` significa che un singolo avvio non ha svuotato tutto l'arretrato. Aumenta `perRunLimit` (massimo 500) se i tuoi intervalli superano regolarmente il passaggio predefinito di 50 righe.

### Quando lasciarlo disattivato

- Il Gateway viene eseguito in modo continuo con riavvio automatico tramite watchdog e gli intervalli sono sempre < pochi secondi: il valore predefinito disattivato va bene.
- Il volume di DM è basso e i messaggi persi non cambierebbero il comportamento dell'agente: la finestra iniziale `firstRunLookbackMinutes` può inviare vecchio contesto inatteso alla prima abilitazione.

Quando attivi il recupero, il primo avvio senza cursore guarda indietro solo di `firstRunLookbackMinutes` (predefinito 30 min), non nell'intera finestra `maxAgeMinutes`: questo evita di riprodurre una lunga cronologia di messaggi precedenti all'abilitazione.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="imsg not found or RPC unsupported">
    Convalida il binario e il supporto RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Se la sonda segnala che RPC non è supportato, aggiorna `imsg`. Se le azioni API private non sono disponibili, esegui `imsg launch` nella sessione utente macOS con accesso effettuato ed esegui di nuovo la sonda. Se il Gateway non è in esecuzione su macOS, usa invece la configurazione Mac remoto tramite SSH qui sopra al posto del percorso `imsg` locale predefinito.

  </Accordion>

  <Accordion title="Gateway is not running on macOS">
    Il valore predefinito `cliPath: "imsg"` deve essere eseguito sul Mac con accesso a Messaggi. Su Linux o Windows, imposta `channels.imessage.cliPath` su uno script wrapper che esegue SSH su quel Mac ed esegue `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Poi esegui:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DMs are ignored">
    Controlla:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - approvazioni di associazione (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Group messages are ignored">
    Controlla:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - comportamento allowlist di `channels.imessage.groups`
    - configurazione dei pattern di menzione (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Remote attachments fail">
    Controlla:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autenticazione con chiave SSH/SCP dall'host del Gateway
    - la chiave host esiste in `~/.ssh/known_hosts` sull'host del Gateway
    - leggibilità del percorso remoto sul Mac che esegue Messaggi

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    Riesegui in un terminale GUI interattivo nello stesso contesto utente/sessione e approva le richieste:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Conferma che Accesso completo al disco + Automazione siano concessi per il contesto del processo che esegue OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Puntatori al riferimento di configurazione

- [Riferimento di configurazione - iMessage](/it/gateway/config-channels#imessage)
- [Configurazione del Gateway](/it/gateway/configuration)
- [Associazione](/it/channels/pairing)

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Rimozione di BlueBubbles e il percorso iMessage imsg](/it/announcements/bluebubbles-imessage) — annuncio e riepilogo della migrazione
- [Da BlueBubbles](/it/channels/imessage-from-bluebubbles) — tabella di traduzione della configurazione e passaggio graduale
- [Associazione](/it/channels/pairing) — autenticazione DM e flusso di associazione
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e gating delle menzioni
- [Routing dei canali](/it/channels/channel-routing) — routing delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e rafforzamento
