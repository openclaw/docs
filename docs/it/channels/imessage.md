---
read_when:
    - Configurazione del supporto per iMessage
    - Debug dell'invio/ricezione di iMessage
summary: Supporto iMessage nativo tramite imsg (JSON-RPC su stdio), con azioni API private per risposte, tapback, effetti, sondaggi, allegati e gestione dei gruppi. Preferito per le nuove configurazioni iMessage di OpenClaw quando i requisiti dell’host sono soddisfatti.
title: iMessage
x-i18n:
    generated_at: "2026-07-01T13:03:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0fbddd770d05762c64b81e9c6443ac8fd487ba15a34ed70b068a69776d355b81
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Per le distribuzioni OpenClaw iMessage, usa `imsg` su un host macOS Messages con accesso effettuato. Se il tuo Gateway gira su Linux o Windows, punta `channels.imessage.cliPath` a un wrapper SSH che esegue `imsg` sul Mac.

**Il recupero in ingresso è automatico.** Dopo il riavvio di un bridge o del gateway, iMessage riproduce i messaggi persi mentre era inattivo e sopprime il vecchio "backlog bomb" che Apple può scaricare dopo un recupero Push, deduplicando in modo che nulla venga inviato due volte. Non c'è alcuna configurazione da abilitare: vedi [Recupero in ingresso dopo il riavvio di un bridge o del gateway](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
Il supporto BlueBubbles è stato rimosso. Migra le configurazioni `channels.bluebubbles` a `channels.imessage`; OpenClaw supporta iMessage solo tramite `imsg`. Inizia con [Rimozione di BlueBubbles e il percorso imsg per iMessage](/it/announcements/bluebubbles-imessage) per l'annuncio breve, oppure [Provenire da BlueBubbles](/it/channels/imessage-from-bluebubbles) per la tabella di migrazione completa.
</Warning>

Stato: integrazione CLI esterna nativa. Gateway avvia `imsg rpc` e comunica tramite JSON-RPC su stdio (nessun demone/porta separato). Le azioni avanzate richiedono `imsg launch` e una verifica dell'API privata riuscita.

<CardGroup cols={3}>
  <Card title="Azioni API private" icon="wand-sparkles" href="#private-api-actions">
    Risposte, tapback, effetti, sondaggi, allegati e gestione dei gruppi.
  </Card>
  <Card title="Associazione" icon="link" href="/it/channels/pairing">
    I DM iMessage usano per impostazione predefinita la modalità di associazione.
  </Card>
  <Card title="Mac remoto" icon="terminal" href="#remote-mac-over-ssh">
    Usa un wrapper SSH quando il Gateway non è in esecuzione sul Mac Messages.
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
    OpenClaw usa il controllo rigoroso della chiave host per SCP, quindi la chiave host del relay deve già esistere in `~/.ssh/known_hosts`.
    I percorsi degli allegati vengono convalidati rispetto alle radici consentite (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Qualsiasi wrapper `cliPath` o proxy SSH che metti davanti a `imsg` DEVE comportarsi come una pipe stdio trasparente per JSON-RPC di lunga durata. OpenClaw scambia piccoli messaggi JSON-RPC delimitati da newline tramite stdin/stdout del wrapper per tutta la durata del canale:

- Inoltra ogni blocco/riga di stdin **non appena i byte sono disponibili**: non aspettare EOF.
- Inoltra prontamente ogni blocco/riga di stdout nella direzione inversa.
- Preserva i newline.
- Evita letture bloccanti a dimensione fissa (`read(4096)`, `cat | buffer`, `read` predefinito della shell) che possono bloccare piccoli frame.
- Tieni stderr separato dal flusso stdout JSON-RPC.

Un wrapper che bufferizza stdin finché non si riempie un blocco grande produrrà sintomi che sembrano un'interruzione di iMessage: `imsg rpc timeout (chats.list)` o riavvii ripetuti del canale, anche se `imsg rpc` stesso è sano. `ssh -T host imsg "$@"` (sopra) è sicuro perché inoltra gli argomenti `cliPath` di OpenClaw come `rpc` e `--db`. Pipeline come `ssh host imsg | grep -v '^DEBUG'` NON lo sono: gli strumenti con buffering per riga possono comunque trattenere i frame; usa `stdbuf -oL -eL` in ogni fase se devi filtrare.
</Warning>

  </Tab>
</Tabs>

## Requisiti e autorizzazioni (macOS)

- Messages deve avere l'accesso effettuato sul Mac che esegue `imsg`.
- Full Disk Access è richiesto per il contesto di processo che esegue OpenClaw/`imsg` (accesso al database di Messages).
- L'autorizzazione Automation è richiesta per inviare messaggi tramite Messages.app.
- Per le azioni avanzate (react / edit / unsend / threaded reply / effects / polls / group ops), System Integrity Protection deve essere disabilitata: vedi [Abilitare l'API privata imsg](#enabling-the-imsg-private-api) di seguito. L'invio/ricezione di testo e contenuti multimediali di base funziona senza.

<Tip>
Le autorizzazioni vengono concesse per contesto di processo. Se gateway viene eseguito headless (LaunchAgent/SSH), esegui un comando interattivo una tantum nello stesso contesto per attivare le richieste:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="Gli invii del wrapper SSH falliscono con AppleEvents -1743">
  Una configurazione SSH remota può leggere le chat, superare `channels status --probe` ed elaborare i messaggi in ingresso mentre gli invii in uscita falliscono comunque con un errore di autorizzazione AppleEvents:

```text
Not authorized to send Apple events to Messages. (-1743)
```

Controlla il database TCC dell'utente Mac con accesso effettuato o System Settings > Privacy & Security > Automation. Se la voce Automation è registrata per `/usr/libexec/sshd-keygen-wrapper` invece che per il processo `imsg` o shell locale, macOS potrebbe non esporre un interruttore Messages utilizzabile per quel client lato server SSH:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

In quello stato, ripetere `tccutil reset AppleEvents` o rieseguire `imsg send` tramite lo stesso wrapper SSH potrebbe continuare a fallire perché il contesto di processo che ha bisogno di Messages Automation è il wrapper SSH, non un'app a cui l'interfaccia utente può concederla.

Usa invece uno dei contesti di processo `imsg` supportati:

- Esegui il Gateway, o almeno il bridge `imsg`, nella sessione locale dell'utente Messages con accesso effettuato.
- Avvia il Gateway con un LaunchAgent per quell'utente dopo aver concesso Full Disk Access e Automation dalla stessa sessione.
- Se mantieni la topologia SSH a due utenti, verifica che un vero `imsg send` in uscita riesca tramite il wrapper esatto prima di abilitare il canale. Se non può essere concessa Automation, riconfigura una configurazione `imsg` a utente singolo invece di affidarti al wrapper SSH per gli invii.

</Accordion>

## Abilitare l'API privata imsg

`imsg` viene distribuito con due modalità operative:

- **Modalità di base** (predefinita, nessuna modifica SIP necessaria): testo e contenuti multimediali in uscita tramite `send`, watch/history in ingresso, elenco chat. Questo è ciò che ottieni subito da una nuova installazione `brew install steipete/tap/imsg` più le autorizzazioni macOS standard indicate sopra.
- **Modalità API privata**: `imsg` inietta una dylib helper in `Messages.app` per chiamare funzioni interne `IMCore`. Questo sblocca `react`, `edit`, `unsend`, `reply` (con thread), `sendWithEffect`, `poll` e `poll-vote` (sondaggi nativi di Messages), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, oltre a indicatori di digitazione e conferme di lettura.

Per raggiungere la superficie di azioni avanzate documentata in questa pagina del canale, hai bisogno della modalità API privata. Il README di `imsg` è esplicito sul requisito:

> Funzionalità avanzate come `read`, `typing`, `launch`, invio ricco basato su bridge, mutazione dei messaggi e gestione delle chat sono opzionali. Richiedono che SIP sia disabilitata e che una dylib helper venga iniettata in `Messages.app`. `imsg launch` rifiuta l'iniezione quando SIP è abilitata.

La tecnica di iniezione dell'helper usa la dylib propria di `imsg` per raggiungere le API private di Messages. Non c'è alcun server di terze parti o runtime BlueBubbles nel percorso OpenClaw iMessage.

<Warning>
**Disabilitare SIP è un vero compromesso di sicurezza.** SIP è una delle protezioni principali di macOS contro l'esecuzione di codice di sistema modificato; disattivarla a livello di sistema apre superficie di attacco aggiuntiva ed effetti collaterali. In particolare, **disabilitare SIP sui Mac Apple Silicon disabilita anche la possibilità di installare ed eseguire app iOS sul Mac**.

Considerala una scelta operativa deliberata, non un'impostazione predefinita. Se il tuo modello di minaccia non può tollerare SIP disattivata, iMessage incluso è limitato alla modalità di base: solo invio/ricezione di testo e media, niente reazioni / modifica / annulla invio / effetti / operazioni sui gruppi.
</Warning>

### Configurazione

1. **Installa (o aggiorna) `imsg`** sul Mac che esegue Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   L'output di `imsg status --json` riporta `bridge_version`, `rpc_methods` e `selectors` per metodo, così puoi vedere cosa supporta la build corrente prima di iniziare.

2. **Disabilita System Integrity Protection e (su macOS moderni) Library Validation.** L'iniezione di una dylib helper non Apple nella `Messages.app` firmata da Apple richiede SIP disattivata **e** la convalida delle librerie allentata. Il passaggio SIP in modalità Recovery è specifico per versione macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** disabilita Library Validation tramite Terminale, riavvia in Recovery Mode, esegui `csrutil disable`, riavvia.
   - **macOS 11+ (Big Sur e successivi), Intel:** Recovery Mode (o Internet Recovery), `csrutil disable`, riavvia.
   - **macOS 11+, Apple Silicon:** sequenza di avvio con pulsante di accensione per entrare in Recovery; nelle versioni macOS recenti tieni premuto il tasto **Left Shift** quando fai clic su Continue, poi `csrutil disable`. Le configurazioni con macchina virtuale seguono un flusso separato, quindi crea prima uno snapshot della VM.

   **Su macOS 11 e successivi, di solito `csrutil disable` da solo non basta.** Apple continua ad applicare la convalida delle librerie a `Messages.app` come binario di piattaforma, quindi un helper firmato ad hoc viene rifiutato (`Library Validation failed: ... platform binary, but mapped file is not`) anche con SIP disattivata. Dopo aver disabilitato SIP, disabilita anche la convalida delle librerie e riavvia:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), verificato su 26.5.1:** SIP disattivata **più** il comando `DisableLibraryValidation` sopra è sufficiente per iniettare l'helper da 26.0 a 26.5.x. **Non sono richiesti boot-args.** Il plist è il fattore decisivo e il passaggio mancante più comune quando l'iniezione fallisce su Tahoe:
   - **Con il plist:** `imsg launch` inietta e `imsg status` riporta `advanced_features: true`.
   - **Senza il plist (anche con SIP disattivata):** `imsg launch` fallisce con `Failed to launch: Timeout waiting for Messages.app to initialize`. AMFI rifiuta l'helper ad hoc al caricamento, quindi il bridge non diventa mai pronto e l'avvio va in timeout. Quel timeout è il sintomo che la maggior parte delle persone incontra su Tahoe, e la correzione è il plist sopra, non qualcosa di più drastico.

   Questo è stato confermato con un prima/dopo controllato su macOS 26.5.1 (Apple Silicon): con il plist, la dylib viene mappata in `Messages.app` e il bridge si avvia; rimuovi il plist e riavvia, e `imsg launch` produce l'errore di timeout sopra con la dylib non mappata.

   Se l'iniezione di `imsg launch` o specifici `selectors` iniziano a restituire false dopo un aggiornamento di macOS, questo gate è la causa più comune. Controlla lo stato di SIP e della convalida delle librerie prima di presumere che il passaggio SIP stesso sia fallito. Se queste impostazioni sono corrette e il bridge non riesce ancora a eseguire l'iniezione, raccogli `imsg status --json` insieme all'output di `imsg launch` e segnalalo al progetto `imsg` invece di indebolire ulteriori controlli di sicurezza a livello di sistema.

   Segui il flusso in modalità Recovery di Apple per il tuo Mac per disabilitare SIP prima di eseguire `imsg launch`.

3. **Inietta l'helper.** Con SIP disabilitato e Messages.app con accesso effettuato:

   ```bash
   imsg launch
   ```

   `imsg launch` rifiuta l'iniezione quando SIP è ancora abilitato, quindi funge anche da conferma che il passaggio 2 ha avuto effetto.

4. **Verifica il bridge da OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   La voce iMessage dovrebbe riportare `works`, e `imsg status --json | jq '{rpc_methods, selectors}'` dovrebbe mostrare le capacità esposte dalla tua build di macOS. La creazione di sondaggi richiede `selectors.pollPayloadMessage`; il voto richiede sia `selectors.pollVoteMessage` sia il metodo RPC `poll.vote`. Il Plugin OpenClaw pubblicizza solo le azioni supportate dalla probe memorizzata nella cache, mentre una cache vuota resta ottimistica ed esegue la probe al primo dispatch.

Se `openclaw channels status --probe` segnala il canale come `works` ma azioni specifiche generano "iMessage `<action>` requires the imsg private API bridge" al momento del dispatch, esegui di nuovo `imsg launch`: l'helper può disattivarsi (riavvio di Messages.app, aggiornamento del sistema operativo, ecc.) e lo stato `available: true` nella cache continuerà a pubblicizzare le azioni finché la probe successiva non lo aggiorna.

### Quando non puoi disabilitare SIP

Se SIP disabilitato non è accettabile per il tuo modello di minaccia:

- `imsg` ripiega sulla modalità di base: solo testo + media + ricezione.
- Il Plugin OpenClaw continua a pubblicizzare l'invio di testo/media e il monitoraggio in ingresso; nasconde semplicemente `react`, `edit`, `unsend`, `reply`, `sendWithEffect` e le operazioni di gruppo dalla superficie delle azioni (secondo il gate di capacità per metodo).
- Puoi eseguire un Mac separato non Apple Silicon (o un Mac dedicato al bot) con SIP disattivato per il workload iMessage, mantenendo SIP abilitato sui tuoi dispositivi principali. Vedi [Utente macOS bot dedicato (identità iMessage separata)](#deployment-patterns) sotto.

## Controllo degli accessi e routing

<Tabs>
  <Tab title="Criterio DM">
    `channels.imessage.dmPolicy` controlla i messaggi diretti:

    - `pairing` (predefinito)
    - `allowlist`
    - `open` (richiede che `allowFrom` includa `"*"`)
    - `disabled`

    Campo allowlist: `channels.imessage.allowFrom`.

    Le voci allowlist devono identificare i mittenti: handle o gruppi statici di accesso mittente (`accessGroup:<name>`). Usa `channels.imessage.groupAllowFrom` per target di chat come `chat_id:*`, `chat_guid:*` o `chat_identifier:*`; usa `channels.imessage.groups` per chiavi di registro `chat_id` numeriche.

  </Tab>

  <Tab title="Criterio gruppi + menzioni">
    `channels.imessage.groupPolicy` controlla la gestione dei gruppi:

    - `allowlist` (predefinito quando configurato)
    - `open`
    - `disabled`

    Allowlist dei mittenti di gruppo: `channels.imessage.groupAllowFrom`.

    Le voci `groupAllowFrom` possono anche fare riferimento a gruppi statici di accesso mittente (`accessGroup:<name>`).

    Fallback runtime: se `groupAllowFrom` non è impostato, i controlli sui mittenti dei gruppi iMessage usano `allowFrom`; imposta `groupAllowFrom` quando l'ammissione di DM e gruppi deve differire.
    Nota runtime: se `channels.imessage` manca completamente, il runtime ripiega su `groupPolicy="allowlist"` e registra un avviso (anche se `channels.defaults.groupPolicy` è impostato).

    <Warning>
    Il routing dei gruppi ha **due** gate allowlist eseguiti in sequenza, ed entrambi devono passare:

    1. **Allowlist mittente / target chat** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier` o `chat_id`.
    2. **Registro dei gruppi** (`channels.imessage.groups`) — con `groupPolicy: "allowlist"`, questo gate richiede una voce wildcard `groups: { "*": { ... } }` (imposta `allowAll = true`) oppure una voce esplicita per `chat_id` sotto `groups`.

    Se il gate 2 non contiene nulla, ogni messaggio di gruppo viene scartato. Il plugin emette due segnali di livello `warn` al livello di log predefinito:

    - una sola volta per account all'avvio: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - una sola volta per `chat_id` a runtime: `imessage: dropping group message from chat_id=<id> ...`

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

    Se quelle righe `warn` compaiono nel log del gateway, il gate 2 sta scartando: aggiungi il blocco `groups`.
    </Warning>

    Gate delle menzioni per i gruppi:

    - iMessage non ha metadati nativi per le menzioni
    - il rilevamento delle menzioni usa pattern regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - senza pattern configurati, il gate delle menzioni non può essere applicato

    I comandi di controllo da mittenti autorizzati possono aggirare il gate delle menzioni nei gruppi.

    `systemPrompt` per gruppo:

    Ogni voce sotto `channels.imessage.groups.*` accetta una stringa `systemPrompt` facoltativa. Il valore viene iniettato nel prompt di sistema dell'agente a ogni turno che gestisce un messaggio in quel gruppo. La risoluzione rispecchia la risoluzione del prompt per gruppo usata da `channels.whatsapp.groups`:

    1. **Prompt di sistema specifico del gruppo** (`groups["<chat_id>"].systemPrompt`): usato quando la voce del gruppo specifico esiste nella mappa **e** la sua chiave `systemPrompt` è definita. Se `systemPrompt` è una stringa vuota (`""`), la wildcard viene soppressa e nessun prompt di sistema viene applicato a quel gruppo.
    2. **Prompt di sistema wildcard del gruppo** (`groups["*"].systemPrompt`): usato quando la voce del gruppo specifico è completamente assente dalla mappa, oppure quando esiste ma non definisce alcuna chiave `systemPrompt`.

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
    - Con il valore predefinito `session.dmScope=main`, i DM iMessage confluiscono nella sessione principale dell'agente.
    - Le sessioni di gruppo sono isolate (`agent:<agentId>:imessage:group:<chat_id>`).
    - Le risposte vengono instradate di nuovo a iMessage usando i metadati di canale/target di origine.

    Comportamento dei thread di tipo gruppo:

    Alcuni thread iMessage con più partecipanti possono arrivare con `is_group=false`.
    Se quel `chat_id` è configurato esplicitamente sotto `channels.imessage.groups`, OpenClaw lo tratta come traffico di gruppo (gate di gruppo + isolamento della sessione di gruppo).

  </Tab>
</Tabs>

## Binding di conversazione ACP

Le chat iMessage legacy possono anche essere associate a sessioni ACP.

Flusso rapido per operatori:

- Esegui `/acp spawn codex --bind here` dentro il DM o la chat di gruppo consentita.
- I messaggi futuri in quella stessa conversazione iMessage vengono instradati alla sessione ACP generata.
- `/new` e `/reset` reimpostano la stessa sessione ACP associata sul posto.
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

Vedi [Agenti ACP](/it/tools/acp-agents) per il comportamento condiviso dei binding ACP.

## Pattern di distribuzione

<AccordionGroup>
  <Accordion title="Utente macOS bot dedicato (identità iMessage separata)">
    Usa un Apple ID e un utente macOS dedicati in modo che il traffico del bot sia isolato dal tuo profilo Messages personale.

    Flusso tipico:

    1. Crea/accedi con un utente macOS dedicato.
    2. Accedi a Messages con l'Apple ID del bot in quell'utente.
    3. Installa `imsg` in quell'utente.
    4. Crea un wrapper SSH in modo che OpenClaw possa eseguire `imsg` nel contesto di quell'utente.
    5. Punta `channels.imessage.accounts.<id>.cliPath` e `.dbPath` al profilo di quell'utente.

    La prima esecuzione può richiedere approvazioni GUI (Automation + Full Disk Access) nella sessione di quell'utente bot.

  </Accordion>

  <Accordion title="Mac remoto tramite Tailscale (esempio)">
    Topologia comune:

    - il gateway viene eseguito su Linux/VM
    - iMessage + `imsg` vengono eseguiti su un Mac nella tua tailnet
    - il wrapper `cliPath` usa SSH per eseguire `imsg`
    - `remoteHost` abilita il recupero degli allegati tramite SCP

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

    Usa chiavi SSH in modo che sia SSH sia SCP siano non interattivi.
    Assicurati prima che la chiave host sia attendibile (per esempio `ssh bot@mac-mini.tailnet-1234.ts.net`) così `known_hosts` viene popolato.

  </Accordion>

  <Accordion title="Pattern multi-account">
    iMessage supporta la configurazione per account sotto `channels.imessage.accounts`.

    Ogni account può sovrascrivere campi come `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, impostazioni della cronologia e allowlist delle root degli allegati.

  </Accordion>

  <Accordion title="Cronologia dei messaggi diretti">
    Imposta `channels.imessage.dmHistoryLimit` per inizializzare nuove sessioni di messaggi diretti con la cronologia `imsg` decodificata recente per quella conversazione. Usa `channels.imessage.dms["<sender>"].historyLimit` per override per mittente, incluso `0` per disabilitare la cronologia per un mittente.

    La cronologia DM di iMessage viene recuperata su richiesta da `imsg`. Lasciare `dmHistoryLimit` non impostato disabilita l'inizializzazione globale della cronologia DM, ma un valore positivo per mittente in `channels.imessage.dms["<sender>"].historyLimit` abilita comunque l'inizializzazione per quel mittente.

  </Accordion>
</AccordionGroup>

## Media, suddivisione in blocchi e target di consegna

<AccordionGroup>
  <Accordion title="Allegati e contenuti multimediali">
    - l'ingestione degli allegati in ingresso è **disattivata per impostazione predefinita** — imposta `channels.imessage.includeAttachments: true` per inoltrare foto, memo vocali, video e altri allegati all'agente. Quando è disattivata, gli iMessage composti solo da allegati vengono scartati prima di raggiungere l'agente e potrebbero non produrre affatto una riga di log `Inbound message`.
    - i percorsi degli allegati remoti possono essere recuperati tramite SCP quando `remoteHost` è impostato
    - i percorsi degli allegati devono corrispondere alle radici consentite:
      - `channels.imessage.attachmentRoots` (locale)
      - `channels.imessage.remoteAttachmentRoots` (modalità SCP remota)
      - schema di radice predefinito: `/Users/*/Library/Messages/Attachments`
    - SCP usa il controllo rigoroso della chiave host (`StrictHostKeyChecking=yes`)
    - la dimensione dei contenuti multimediali in uscita usa `channels.imessage.mediaMaxMb` (predefinito 16 MB)

  </Accordion>

  <Accordion title="Suddivisione in blocchi in uscita">
    - limite dei blocchi di testo: `channels.imessage.textChunkLimit` (predefinito 4000)
    - modalità di suddivisione: `channels.imessage.chunkMode`
      - `length` (predefinito)
      - `newline` (divisione che privilegia i paragrafi)

  </Accordion>

  <Accordion title="Formati di indirizzamento">
    Destinatari espliciti preferiti:

    - `chat_id:123` (consigliato per instradamento stabile)
    - `chat_guid:...`
    - `chat_identifier:...`

    Sono supportati anche i destinatari tramite handle:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Azioni API private

Quando `imsg launch` è in esecuzione e `openclaw channels status --probe` segnala `privateApi.available: true`, lo strumento di messaggistica può usare azioni native di iMessage oltre ai normali invii di testo.

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
        polls: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Azioni disponibili">
    - **react**: aggiunge/rimuove tapback di iMessage (`messageId`, `emoji`, `remove`). I tapback supportati corrispondono a amore, mi piace, non mi piace, risata, enfasi e domanda.
    - **reply**: invia una risposta in thread a un messaggio esistente (`messageId`, `text` o `message`, più `chatGuid`, `chatId`, `chatIdentifier` o `to`).
    - **sendWithEffect**: invia testo con un effetto iMessage (`text` o `message`, `effect` o `effectId`).
    - **edit**: modifica un messaggio inviato nelle versioni macOS/API private supportate (`messageId`, `text` o `newText`).
    - **unsend**: ritira un messaggio inviato nelle versioni macOS/API private supportate (`messageId`).
    - **upload-file**: invia contenuti multimediali/file (`buffer` come base64 o un `media`/`path`/`filePath` idratato, `filename`, `asVoice` facoltativo). Alias legacy: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: gestiscono le chat di gruppo quando il destinatario corrente è una conversazione di gruppo.
    - **poll**: crea un sondaggio nativo di Apple Messaggi (`pollQuestion`, `pollOption` ripetuto da 2 a 12 volte, più `chatGuid`, `chatId`, `chatIdentifier` o `to`). I destinatari su iOS/iPadOS/macOS 26+ lo visualizzano e votano nativamente; le versioni precedenti del sistema operativo ricevono un fallback testuale "Sent a poll". Richiede `selectors.pollPayloadMessage`.
    - **poll-vote**: vota in un sondaggio esistente (`pollId` o `messageId`, più esattamente uno tra `pollOptionIndex`, `pollOptionId` o `pollOptionText`). Richiede `selectors.pollVoteMessage` e il metodo RPC `poll.vote`.

    I sondaggi in ingresso accettati vengono resi per l'agente con la domanda, le etichette numerate delle opzioni, i conteggi dei voti e l'ID del messaggio del sondaggio richiesto da `poll-vote`.

  </Accordion>

  <Accordion title="ID messaggio">
    Il contesto iMessage in ingresso include sia valori `MessageSid` brevi sia GUID completi dei messaggi quando disponibili. Gli ID brevi sono limitati alla cache recente delle risposte basata su SQLite e vengono controllati rispetto alla chat corrente prima dell'uso. Se un ID breve è scaduto o appartiene a un'altra chat, riprova con il `MessageSidFull` completo.

  </Accordion>

  <Accordion title="Rilevamento delle capacità">
    OpenClaw nasconde le azioni API private solo quando lo stato della probe in cache indica che il bridge non è disponibile. Se lo stato è sconosciuto, le azioni restano visibili e inviano probe in modo pigro, così la prima azione può riuscire dopo `imsg launch` senza un aggiornamento manuale separato dello stato.

  </Accordion>

  <Accordion title="Conferme di lettura e digitazione">
    Quando il bridge API privato è attivo, le chat in ingresso accettate vengono segnate come lette e le chat dirette mostrano una bolla di digitazione appena il turno viene accettato, mentre l'agente prepara il contesto e genera. Disattiva la marcatura come letto con:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Le build `imsg` più vecchie, precedenti all'elenco delle capacità per metodo, disattiveranno silenziosamente digitazione/lettura; OpenClaw registra un avviso una sola volta per riavvio, così la conferma mancante è attribuibile.

  </Accordion>

  <Accordion title="Tapback in ingresso">
    OpenClaw sottoscrive i tapback di iMessage e instrada le reazioni accettate come eventi di sistema invece che come normale testo del messaggio, quindi un tapback dell'utente non attiva un normale ciclo di risposta.

    La modalità di notifica è controllata da `channels.imessage.reactionNotifications`:

    - `"own"` (predefinito): notifica solo quando gli utenti reagiscono a messaggi creati dal bot.
    - `"all"`: notifica tutti i tapback in ingresso da mittenti autorizzati.
    - `"off"`: ignora i tapback in ingresso.

    Le sostituzioni per account usano `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Reazioni di approvazione (👍 / 👎)">
    Quando `approvals.exec.enabled` o `approvals.plugin.enabled` è true e la richiesta viene instradata a iMessage, il gateway consegna nativamente una richiesta di approvazione e accetta un tapback per risolverla:

    - `👍` (tapback Mi piace) → `allow-once`
    - `👎` (tapback Non mi piace) → `deny`
    - `allow-always` resta un fallback manuale: invia `/approve <id> allow-always` come risposta normale.

    La gestione delle reazioni richiede che l'handle dell'utente che reagisce sia un approvatore esplicito. L'elenco degli approvatori viene letto da `channels.imessage.allowFrom` (o `channels.imessage.accounts.<id>.allowFrom`); aggiungi il numero di telefono dell'utente in formato E.164 o la sua email Apple ID. La voce jolly `"*"` è rispettata, ma consente a qualsiasi mittente di approvare. La scorciatoia tramite reazione bypassa intenzionalmente `reactionNotifications`, `dmPolicy` e `groupAllowFrom` perché la allowlist degli approvatori espliciti è l'unico gate rilevante per la risoluzione dell'approvazione.

    **Modifica di comportamento in questa release:** quando `channels.imessage.allowFrom` non è vuoto, il comando testuale `/approve <id> <decision>` ora viene autorizzato rispetto a quell'elenco di approvatori (non alla allowlist DM più ampia). I mittenti consentiti nella allowlist DM ma non in `allowFrom` riceveranno un rifiuto esplicito. Aggiungi a `allowFrom` ogni operatore che dovrebbe poter approvare tramite `/approve` (e tramite reazioni) per preservare il comportamento precedente. Quando `allowFrom` è vuoto, il fallback legacy "stessa chat" resta attivo e `/approve` continua ad autorizzare chiunque sia consentito dalla allowlist DM.

    Note per gli operatori:
    - Il binding della reazione viene memorizzato sia in memoria (con TTL corrispondente alla scadenza dell'approvazione) sia nello store persistente a chiave del gateway, quindi un tapback che arriva poco dopo un riavvio del gateway risolve comunque l'approvazione.
    - I tapback cross-device `is_from_me=true` (la reazione dell'operatore su un dispositivo Apple associato) vengono ignorati intenzionalmente, così il bot non può auto-approvarsi.
    - I tapback legacy in stile testo (`Liked "…"` come testo semplice da client Apple molto vecchi) non possono risolvere le approvazioni perché non trasportano alcun GUID del messaggio; la risoluzione tramite reazione richiede i metadati strutturati del tapback emessi dai client macOS / iOS attuali.

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

## Coalescenza dei DM con invio diviso (comando + URL in un'unica composizione)

Quando un utente digita insieme un comando e un URL — ad esempio `Dump https://example.com/article` — l'app Messaggi di Apple divide l'invio in **due righe `chat.db` separate**:

1. Un messaggio di testo (`"Dump"`).
2. Un fumetto di anteprima URL (`"https://..."`) con immagini di anteprima OG come allegati.

Le due righe arrivano a OpenClaw a circa 0,8-2,0 s di distanza nella maggior parte delle configurazioni. Senza coalescenza, l'agente riceve solo il comando al turno 1, risponde (spesso "send me the URL") e vede l'URL solo al turno 2 — quando il contesto del comando è già perso. Questo è il flusso di invio di Apple, non qualcosa introdotto da OpenClaw o `imsg`.

`channels.imessage.coalesceSameSenderDms` abilita per un DM il buffering di righe consecutive dello stesso mittente. Quando `imsg` espone il marcatore strutturale dell'anteprima URL `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` su una delle righe sorgente, OpenClaw unisce solo quel vero invio diviso e mantiene eventuali altre righe in buffer come turni separati. Nelle build `imsg` più vecchie che non emettono affatto metadati del fumetto, OpenClaw non può distinguere un invio diviso da invii separati, quindi ripiega sull'unione del bucket. Questo preserva il comportamento precedente ai metadati invece di far regredire gli invii divisi `Dump <url>` in due turni. Le chat di gruppo continuano a essere inviate per messaggio, così la struttura dei turni multiutente viene preservata.

<Tabs>
  <Tab title="Quando abilitarlo">
    Abilitalo quando:

    - Distribuisci Skills che si aspettano `command + payload` in un unico messaggio (dump, paste, save, queue, ecc.).
    - I tuoi utenti incollano URL insieme ai comandi.
    - Puoi accettare la latenza aggiuntiva dei turni DM (vedi sotto).

    Lascialo disattivato quando:

    - Ti serve la latenza minima dei comandi per trigger DM di una sola parola.
    - Tutti i tuoi flussi sono comandi one-shot senza payload successivi.

  </Tab>
  <Tab title="Abilitazione">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Con il flag attivo e senza un `messages.inbound.byChannel.imessage` esplicito o `messages.inbound.debounceMs` globale, la finestra di debounce si amplia a **7000 ms** (il valore predefinito legacy è 0 ms — nessun debounce). La finestra più ampia è necessaria perché la cadenza dell'invio diviso dell'anteprima URL di Apple può estendersi a diversi secondi mentre Messages.app emette la riga di anteprima.

    Per regolare personalmente la finestra:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms covers observed Messages.app URL-preview delays.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Compromessi">
    - **Il merging preciso richiede i metadati correnti del payload `imsg`.** Quando la riga dell'URL include `balloon_bundle_id`, solo quel vero invio suddiviso viene unito e le altre righe bufferizzate restano separate. Nelle build `imsg` più vecchie che non espongono metadati balloon, OpenClaw ripiega sul merging del bucket bufferizzato, così gli invii suddivisi `Dump <url>` non regrediscono in due turni (compatibilità retroattiva provvisoria, rimossa quando `imsg` coalescerà gli invii suddivisi a monte).
    - **Latenza aggiunta per i messaggi DM.** Con il flag attivo, ogni DM (inclusi i comandi di controllo autonomi e i follow-up con un solo testo) attende fino alla finestra di debounce prima del dispatch, nel caso stia arrivando una riga di anteprima URL. I messaggi delle chat di gruppo mantengono il dispatch istantaneo.
    - **L'output unito è limitato.** Il testo unito è limitato a 4000 caratteri con un marcatore esplicito `…[truncated]`; gli allegati sono limitati a 20; le voci sorgente sono limitate a 10 (oltre tale soglia vengono conservate la prima e le più recenti). Ogni GUID sorgente viene tracciato in `coalescedMessageGuids` per la telemetria a valle.
    - **Solo DM.** Le chat di gruppo ricadono nel dispatch per messaggio, così il bot resta reattivo quando più persone stanno scrivendo.
    - **Opt-in, per canale.** Gli altri canali (Telegram, WhatsApp, Slack, …) non sono interessati. Le configurazioni BlueBubbles legacy che impostano `channels.bluebubbles.coalesceSameSenderDms` devono migrare quel valore a `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Scenari e cosa vede l'agente

La colonna "Flag attivo" mostra il comportamento su una build `imsg` che emette `balloon_bundle_id`. Nelle build `imsg` più vecchie che non emettono alcun metadato balloon, le righe sotto contrassegnate come "Due turni" / "N turni" ricadono invece in un merging legacy (un turno): OpenClaw non può distinguere strutturalmente un invio suddiviso da invii separati, quindi preserva il merge precedente ai metadati. La separazione precisa si attiva quando la build emette metadati balloon.

| L'utente compone                                                   | `chat.db` produce                   | Flag disattivo (predefinito)                     | Flag attivo + finestra (imsg emette metadati balloon)                                               |
| ------------------------------------------------------------------ | ----------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (un invio)                              | 2 righe a ~1 s di distanza          | Due turni agente: solo "Dump", poi URL           | Un turno: testo unito `Dump https://example.com`                                                    |
| `Save this 📎image.jpg caption` (allegato + testo)                 | 2 righe senza metadati balloon URL  | Due turni                                        | Due turni dopo l'osservazione dei metadati; un turno unito nelle sessioni vecchie/pre-latch senza metadati |
| `/status` (comando autonomo)                                       | 1 riga                              | Dispatch istantaneo                              | **Attende fino alla finestra, poi esegue il dispatch**                                              |
| URL incollato da solo                                              | 1 riga                              | Dispatch istantaneo                              | Attende fino alla finestra, poi esegue il dispatch                                                  |
| Testo + URL inviati come due messaggi separati deliberati, a minuti di distanza | 2 righe fuori finestra              | Due turni                                        | Due turni (la finestra scade tra loro)                                                              |
| Flood rapido (>10 piccoli DM dentro la finestra)                   | N righe senza metadati balloon URL  | N turni                                          | N turni dopo l'osservazione dei metadati; un turno unito e limitato nelle sessioni vecchie/pre-latch senza metadati |
| Due persone scrivono in una chat di gruppo                         | N righe da M mittenti               | M+ turni (uno per bucket mittente)               | M+ turni — le chat di gruppo non vengono coalescite                                                 |

## Recupero inbound dopo un riavvio del bridge o del Gateway

iMessage recupera i messaggi persi mentre il Gateway era inattivo e, allo stesso tempo, sopprime la vecchia "bomba di backlog" che Apple può svuotare dopo un recupero Push. Il comportamento predefinito è sempre attivo, costruito sulla deduplicazione inbound.

- **Deduplicazione replay.** Ogni messaggio inbound sottoposto a dispatch viene registrato tramite il suo GUID Apple nello stato persistente del Plugin (`imessage.inbound-dedupe`), reclamato all'ingestione e confermato dopo la gestione (rilasciato in caso di errore transitorio, così può essere ritentato). Tutto ciò che è già stato gestito viene scartato invece di essere inviato due volte. È questo che permette al recupero di eseguire replay aggressivi senza bookkeeping per messaggio.
- **Recupero del downtime.** All'avvio, il monitor ricorda l'ultimo rowid `chat.db` inviato (un cursore persistito per account) e lo passa a `imsg watch.subscribe` come `since_rowid`, così imsg riproduce le righe arrivate mentre il Gateway era inattivo, poi segue il live. Il replay è limitato alle righe più recenti e ai messaggi vecchi fino a ~2 ore, e la deduplicazione scarta tutto ciò che è già stato gestito.
- **Recinto di età per il backlog obsoleto.** Le righe sopra il confine di avvio sono davvero live; una il cui timestamp di invio è più vecchio di ~15 minuti rispetto al suo arrivo è il backlog svuotato da Push e viene soppressa. Le righe riprodotte (al confine o sotto) usano invece la finestra di recupero più ampia, così un messaggio perso di recente viene consegnato mentre la cronologia antica no.

Il recupero funziona sia con setup `cliPath` locali sia remoti, perché il replay `since_rowid` passa sulla stessa connessione RPC `imsg`. La differenza è la finestra: quando il Gateway può leggere `chat.db` (locale), ancora il confine rowid di avvio, limita l'intervallo di replay e consegna i messaggi persi vecchi fino a un paio d'ore. Su un `cliPath` SSH remoto non può leggere il database, quindi il replay non è limitato e ogni riga usa il recinto di età live: recupera comunque i messaggi persi di recente e sopprime comunque il vecchio backlog, solo con la finestra live più stretta. Esegui il Gateway sul Mac di Messages per la finestra di recupero più ampia.

### Segnale visibile all'operatore

Il backlog soppresso viene registrato al livello predefinito, mai scartato silenziosamente (il flag `recovery` mostra quale finestra è stata applicata):

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### Migrazione

`channels.imessage.catchup.*` è deprecato — il recupero del downtime ora è automatico e non richiede configurazione per i nuovi setup. Le configurazioni esistenti con `catchup.enabled: true` restano rispettate come profilo di compatibilità per la finestra di replay del recupero. I blocchi catchup disabilitati (`enabled: false` o assenza di `enabled: true`) sono ritirati; `openclaw doctor --fix` li rimuove.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="imsg non trovato o RPC non supportato">
    Valida il binario e il supporto RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Se il probe segnala RPC non supportato, aggiorna `imsg`. Se le azioni API private non sono disponibili, esegui `imsg launch` nella sessione dell'utente macOS con accesso e ripeti il probe. Se il Gateway non è in esecuzione su macOS, usa invece il setup Mac remoto via SSH sopra al posto del percorso `imsg` locale predefinito.

  </Accordion>

  <Accordion title="I messaggi vengono inviati ma gli iMessage inbound non arrivano">
    Prima dimostra se il messaggio ha raggiunto il Mac locale. Se `chat.db` non cambia, OpenClaw non può ricevere il messaggio anche quando `imsg status --json` segnala un bridge sano.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Se i messaggi inviati dal telefono non creano nuove righe, ripara il livello macOS Messages e Apple Push prima di modificare la configurazione OpenClaw. Spesso basta un refresh una tantum dei servizi:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Invia un nuovo iMessage dal telefono e conferma una nuova riga `chat.db` o un evento `imsg watch` prima di eseguire il debug delle sessioni OpenClaw. Non eseguire questo come loop periodico di rilancio del bridge; `imsg launch` ripetuti più riavvii del Gateway durante il lavoro attivo possono interrompere le consegne e lasciare in sospeso le esecuzioni del canale in corso.

  </Accordion>

  <Accordion title="Il Gateway non è in esecuzione su macOS">
    Il `cliPath: "imsg"` predefinito deve essere eseguito sul Mac con accesso a Messages. Su Linux o Windows, imposta `channels.imessage.cliPath` su uno script wrapper che esegue SSH verso quel Mac ed esegue `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Poi esegui:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="I DM vengono ignorati">
    Controlla:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - approvazioni di pairing (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="I messaggi di gruppo vengono ignorati">
    Controlla:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - comportamento allowlist di `channels.imessage.groups`
    - configurazione dei pattern di menzione (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Gli allegati remoti falliscono">
    Controlla:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autenticazione con chiave SSH/SCP dall'host del Gateway
    - la chiave host esiste in `~/.ssh/known_hosts` sull'host del Gateway
    - leggibilità del percorso remoto sul Mac che esegue Messages

  </Accordion>

  <Accordion title="I prompt di autorizzazione macOS sono stati persi">
    Riesegui in un terminale GUI interattivo nello stesso contesto utente/sessione e approva i prompt:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Conferma che Accesso completo al disco + Automazione siano concessi per il contesto di processo che esegue OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Puntatori al riferimento di configurazione

- [Riferimento di configurazione - iMessage](/it/gateway/config-channels#imessage)
- [Configurazione Gateway](/it/gateway/configuration)
- [Pairing](/it/channels/pairing)

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Rimozione di BlueBubbles e il percorso iMessage imsg](/it/announcements/bluebubbles-imessage) — annuncio e riepilogo della migrazione
- [Migrazione da BlueBubbles](/it/channels/imessage-from-bluebubbles) — tabella di traduzione della configurazione e cutover passo per passo
- [Pairing](/it/channels/pairing) — autenticazione DM e flusso di pairing
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e gating delle menzioni
- [Instradamento canale](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
