---
read_when:
    - Configurare il supporto per iMessage
    - Debug dell'invio/ricezione di iMessage
summary: Supporto nativo per iMessage tramite imsg (JSON-RPC su stdio), con azioni API private per risposte, tapback, effetti, allegati e gestione dei gruppi. Preferito per le nuove configurazioni OpenClaw iMessage quando i requisiti dell'host sono adatti.
title: iMessage
x-i18n:
    generated_at: "2026-06-27T17:10:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 065c0426af6230f9be2f0a12ecc4553724d8ce1a2b6b0dad640b5ae8a8a480f0
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Per le distribuzioni OpenClaw iMessage, usa `imsg` su un host macOS Messages con accesso effettuato. Se il tuo Gateway viene eseguito su Linux o Windows, punta `channels.imessage.cliPath` a un wrapper SSH che esegue `imsg` sul Mac.

**Il recupero in ingresso è automatico.** Dopo il riavvio di un bridge o del gateway, iMessage riproduce i messaggi persi mentre era inattivo e sopprime la "bomba di arretrati" obsoleta che Apple può scaricare dopo un recupero Push, deduplicando in modo che nulla venga inviato due volte. Non c'è alcuna configurazione da abilitare: consulta [Recupero in ingresso dopo il riavvio di un bridge o gateway](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
Il supporto BlueBubbles è stato rimosso. Migra le configurazioni `channels.bluebubbles` a `channels.imessage`; OpenClaw supporta iMessage solo tramite `imsg`. Inizia da [Rimozione di BlueBubbles e percorso iMessage imsg](/it/announcements/bluebubbles-imessage) per l'annuncio breve, oppure da [Passaggio da BlueBubbles](/it/channels/imessage-from-bluebubbles) per la tabella di migrazione completa.
</Warning>

Stato: integrazione CLI esterna nativa. Gateway avvia `imsg rpc` e comunica tramite JSON-RPC su stdio (nessun daemon/porta separato). Le azioni avanzate richiedono `imsg launch` e un probe API privata riuscito.

<CardGroup cols={3}>
  <Card title="Azioni API private" icon="wand-sparkles" href="#private-api-actions">
    Risposte, tapback, effetti, allegati e gestione dei gruppi.
  </Card>
  <Card title="Abbinamento" icon="link" href="/it/channels/pairing">
    I DM iMessage usano per impostazione predefinita la modalità di abbinamento.
  </Card>
  <Card title="Mac remoto" icon="terminal" href="#remote-mac-over-ssh">
    Usa un wrapper SSH quando il Gateway non è in esecuzione sul Mac di Messages.
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

      <Step title="Approva il primo abbinamento DM (dmPolicy predefinita)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Le richieste di abbinamento scadono dopo 1 ora.
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
    OpenClaw usa un controllo rigoroso della chiave host per SCP, quindi la chiave host del relay deve già esistere in `~/.ssh/known_hosts`.
    I percorsi degli allegati vengono convalidati rispetto alle radici consentite (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Qualsiasi wrapper `cliPath` o proxy SSH che metti davanti a `imsg` DEVE comportarsi come una pipe stdio trasparente per JSON-RPC a lunga durata. OpenClaw scambia piccoli messaggi JSON-RPC delimitati da newline tramite stdin/stdout del wrapper per tutta la durata del canale:

- Inoltra ogni blocco/riga stdin **non appena i byte sono disponibili**: non attendere EOF.
- Inoltra prontamente ogni blocco/riga stdout nella direzione opposta.
- Preserva le newline.
- Evita letture bloccanti a dimensione fissa (`read(4096)`, `cat | buffer`, `read` shell predefinito) che possono affamare frame piccoli.
- Mantieni stderr separato dal flusso stdout JSON-RPC.

Un wrapper che bufferizza stdin finché non si riempie un blocco grande produrrà sintomi simili a un'interruzione di iMessage: `imsg rpc timeout (chats.list)` o riavvii ripetuti del canale, anche se `imsg rpc` stesso è sano. `ssh -T host imsg "$@"` (sopra) è sicuro perché inoltra gli argomenti `cliPath` di OpenClaw, come `rpc` e `--db`. Pipeline come `ssh host imsg | grep -v '^DEBUG'` NON lo sono: gli strumenti con buffering di riga possono comunque trattenere frame; usa `stdbuf -oL -eL` su ogni fase se devi filtrare.
</Warning>

  </Tab>
</Tabs>

## Requisiti e permessi (macOS)

- Messages deve avere accesso effettuato sul Mac che esegue `imsg`.
- È richiesto Accesso completo al disco per il contesto di processo che esegue OpenClaw/`imsg` (accesso al DB di Messages).
- È richiesto il permesso Automazione per inviare messaggi tramite Messages.app.
- Per le azioni avanzate (reazione / modifica / annullamento invio / risposta in thread / effetti / operazioni di gruppo), System Integrity Protection deve essere disabilitata: consulta [Abilitare l'API privata imsg](#enabling-the-imsg-private-api) più sotto. L'invio/ricezione di testo e media di base funziona senza.

<Tip>
I permessi vengono concessi per contesto di processo. Se gateway viene eseguito senza interfaccia (LaunchAgent/SSH), esegui un comando interattivo una tantum nello stesso contesto per attivare i prompt:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="Gli invii del wrapper SSH falliscono con AppleEvents -1743">
  Una configurazione SSH remota può leggere le chat, superare `channels status --probe` ed elaborare i messaggi in ingresso, mentre gli invii in uscita continuano a fallire con un errore di autorizzazione AppleEvents:

```text
Not authorized to send Apple events to Messages. (-1743)
```

Controlla il database TCC dell'utente Mac con accesso effettuato o Impostazioni di Sistema > Privacy e sicurezza > Automazione. Se la voce Automazione è registrata per `/usr/libexec/sshd-keygen-wrapper` invece che per `imsg` o per il processo shell locale, macOS potrebbe non esporre un interruttore Messages utilizzabile per quel client lato server SSH:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

In quello stato, ripetere `tccutil reset AppleEvents` o rieseguire `imsg send` tramite lo stesso wrapper SSH può continuare a fallire perché il contesto di processo che necessita dell'Automazione Messages è il wrapper SSH, non un'app a cui l'interfaccia utente può concederla.

Usa invece uno dei contesti di processo `imsg` supportati:

- Esegui il Gateway, o almeno il bridge `imsg`, nella sessione locale dell'utente Messages con accesso effettuato.
- Avvia il Gateway con un LaunchAgent per quell'utente dopo aver concesso Accesso completo al disco e Automazione dalla stessa sessione.
- Se mantieni la topologia SSH a due utenti, verifica che un vero `imsg send` in uscita riesca tramite l'esatto wrapper prima di abilitare il canale. Se non è possibile concedere l'Automazione, riconfigura una configurazione `imsg` a utente singolo invece di affidarti al wrapper SSH per gli invii.

</Accordion>

## Abilitare l'API privata imsg

`imsg` viene distribuito in due modalità operative:

- **Modalità di base** (predefinita, nessuna modifica SIP necessaria): testo e media in uscita tramite `send`, watch/cronologia in ingresso, elenco chat. Questo è ciò che ottieni subito da una nuova installazione `brew install steipete/tap/imsg` più i permessi macOS standard indicati sopra.
- **Modalità API privata**: `imsg` inietta una dylib helper in `Messages.app` per chiamare funzioni interne `IMCore`. Questo sblocca `react`, `edit`, `unsend`, `reply` (in thread), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, oltre agli indicatori di digitazione e alle conferme di lettura.

Per accedere alla superficie di azioni avanzate documentata in questa pagina del canale, ti serve la modalità API privata. Il README di `imsg` è esplicito sul requisito:

> Le funzionalità avanzate come `read`, `typing`, `launch`, invio ricco basato su bridge, mutazione dei messaggi e gestione delle chat sono opzionali. Richiedono che SIP sia disabilitato e che una dylib helper venga iniettata in `Messages.app`. `imsg launch` rifiuta l'iniezione quando SIP è abilitato.

La tecnica di iniezione dell'helper usa la dylib propria di `imsg` per raggiungere le API private di Messages. Non c'è alcun server di terze parti o runtime BlueBubbles nel percorso iMessage di OpenClaw.

<Warning>
**Disabilitare SIP è un compromesso di sicurezza reale.** SIP è una delle protezioni fondamentali di macOS contro l'esecuzione di codice di sistema modificato; disattivarlo a livello di sistema apre ulteriore superficie di attacco ed effetti collaterali. In particolare, **disabilitare SIP sui Mac Apple Silicon disabilita anche la possibilità di installare ed eseguire app iOS sul Mac**.

Consideralo una scelta operativa deliberata, non un'impostazione predefinita. Se il tuo modello di minaccia non può tollerare SIP disattivato, iMessage incluso è limitato alla modalità di base: solo invio/ricezione di testo e media, senza reazioni / modifica / annullamento invio / effetti / operazioni di gruppo.
</Warning>

### Configurazione

1. **Installa (o aggiorna) `imsg`** sul Mac che esegue Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   L'output di `imsg status --json` riporta `bridge_version`, `rpc_methods` e i `selectors` per metodo, così puoi vedere cosa supporta la build corrente prima di iniziare.

2. **Disabilita System Integrity Protection e (su macOS moderni) Library Validation.** Iniettare una dylib helper non Apple nella `Messages.app` firmata da Apple richiede SIP disattivato **e** la validazione delle librerie allentata. Il passaggio SIP in modalità Recovery è specifico per la versione di macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** disabilita Library Validation tramite Terminale, riavvia in Recovery Mode, esegui `csrutil disable`, riavvia.
   - **macOS 11+ (Big Sur e successivi), Intel:** Recovery Mode (o Internet Recovery), `csrutil disable`, riavvia.
   - **macOS 11+, Apple Silicon:** sequenza di avvio con pulsante di accensione per entrare in Recovery; nelle versioni recenti di macOS tieni premuto il tasto **Maiusc sinistro** quando fai clic su Continua, poi `csrutil disable`. Le configurazioni con macchina virtuale seguono un flusso separato, quindi fai prima uno snapshot della VM.

   **Su macOS 11 e successivi, di solito `csrutil disable` da solo non basta.** Apple applica ancora la validazione delle librerie a `Messages.app` come binario di piattaforma, quindi un helper firmato ad hoc viene rifiutato (`Library Validation failed: ... platform binary, but mapped file is not`) anche con SIP disattivato. Dopo aver disabilitato SIP, disabilita anche la validazione delle librerie e riavvia:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), verificato su 26.5.1:** SIP disattivato **più** il comando `DisableLibraryValidation` sopra è sufficiente per iniettare l'helper dalla 26.0 alla 26.5.x. **Non sono richiesti boot-args.** Il plist è il fattore decisivo e il passaggio mancante più comune quando l'iniezione fallisce su Tahoe:
   - **Con il plist:** `imsg launch` inietta e `imsg status` riporta `advanced_features: true`.
   - **Senza il plist (anche con SIP disattivato):** `imsg launch` fallisce con `Failed to launch: Timeout waiting for Messages.app to initialize`. AMFI rifiuta l'helper ad hoc al caricamento, quindi il bridge non diventa mai pronto e il lancio va in timeout. Quel timeout è il sintomo che la maggior parte delle persone incontra su Tahoe, e la correzione è il plist sopra, non qualcosa di più drastico.

   Questo è stato confermato con un prima/dopo controllato su macOS 26.5.1 (Apple Silicon): con il plist, la dylib viene mappata in `Messages.app` e il bridge si avvia; rimuovi il plist e riavvia, e `imsg launch` produce l'errore di timeout sopra con la dylib non mappata.

   Se l’iniezione di `imsg launch` o specifici `selectors` iniziano a restituire false dopo un aggiornamento di macOS, questo controllo è la causa abituale. Controlla lo stato di SIP e della convalida delle librerie prima di presumere che il passaggio SIP stesso sia fallito. Se queste impostazioni sono corrette e il bridge non riesce ancora a iniettare, raccogli `imsg status --json` più l’output di `imsg launch` e segnalalo al progetto `imsg` invece di indebolire ulteriori controlli di sicurezza a livello di sistema.

   Segui il flusso in modalità Recovery di Apple per il tuo Mac per disabilitare SIP prima di eseguire `imsg launch`.

3. **Inietta l’helper.** Con SIP disabilitato e Messages.app autenticata:

   ```bash
   imsg launch
   ```

   `imsg launch` rifiuta l’iniezione quando SIP è ancora abilitato, quindi serve anche come conferma che il passaggio 2 sia riuscito.

4. **Verifica il bridge da OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   La voce iMessage dovrebbe riportare `works`, e `imsg status --json | jq '.selectors'` dovrebbe mostrare `retractMessagePart: true` più qualunque selettore di modifica / digitazione / lettura esposto dalla tua build di macOS. Il gating per metodo del Plugin OpenClaw in `actions.ts` pubblicizza solo le azioni il cui selettore sottostante è `true`, quindi la superficie delle azioni che vedi nell’elenco degli strumenti dell’agente riflette ciò che il bridge può effettivamente fare su questo host.

Se `openclaw channels status --probe` segnala il canale come `works` ma azioni specifiche generano "iMessage `<action>` requires the imsg private API bridge" al momento del dispatch, esegui di nuovo `imsg launch`: l’helper può sganciarsi (riavvio di Messages.app, aggiornamento del sistema operativo, ecc.) e lo stato memorizzato nella cache `available: true` continuerà a pubblicizzare le azioni fino al prossimo aggiornamento del probe.

### Quando non puoi disabilitare SIP

Se SIP disabilitato non è accettabile per il tuo modello di minaccia:

- `imsg` ricorre alla modalità di base: solo testo + media + ricezione.
- Il Plugin OpenClaw pubblicizza ancora invio di testo/media e monitoraggio in ingresso; nasconde semplicemente `react`, `edit`, `unsend`, `reply`, `sendWithEffect` e le operazioni sui gruppi dalla superficie delle azioni (secondo il gate di capacità per metodo).
- Puoi eseguire un Mac separato non Apple Silicon (o un Mac bot dedicato) con SIP disattivato per il carico di lavoro iMessage, mantenendo SIP abilitato sui tuoi dispositivi principali. Vedi [Utente macOS bot dedicato (identità iMessage separata)](#deployment-patterns) sotto.

## Controllo degli accessi e instradamento

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` controlla i messaggi diretti:

    - `pairing` (predefinito)
    - `allowlist`
    - `open` (richiede che `allowFrom` includa `"*"`)
    - `disabled`

    Campo allowlist: `channels.imessage.allowFrom`.

    Le voci allowlist devono identificare i mittenti: handle o gruppi statici di accesso mittente (`accessGroup:<name>`). Usa `channels.imessage.groupAllowFrom` per destinazioni chat come `chat_id:*`, `chat_guid:*` o `chat_identifier:*`; usa `channels.imessage.groups` per chiavi di registro numeriche `chat_id`.

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` controlla la gestione dei gruppi:

    - `allowlist` (predefinito quando configurato)
    - `open`
    - `disabled`

    Allowlist dei mittenti di gruppo: `channels.imessage.groupAllowFrom`.

    Le voci `groupAllowFrom` possono anche fare riferimento a gruppi statici di accesso mittente (`accessGroup:<name>`).

    Fallback runtime: se `groupAllowFrom` non è impostato, i controlli sui mittenti dei gruppi iMessage usano `allowFrom`; imposta `groupAllowFrom` quando l’ammissione per DM e gruppi deve differire.
    Nota runtime: se `channels.imessage` manca completamente, il runtime ricorre a `groupPolicy="allowlist"` e registra un avviso (anche se `channels.defaults.groupPolicy` è impostato).

    <Warning>
    L’instradamento dei gruppi ha **due** gate allowlist eseguiti in sequenza, ed entrambi devono passare:

    1. **Allowlist mittente / destinazione chat** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier` o `chat_id`.
    2. **Registro dei gruppi** (`channels.imessage.groups`) — con `groupPolicy: "allowlist"`, questo gate richiede una voce wildcard `groups: { "*": { ... } }` (imposta `allowAll = true`) oppure una voce esplicita per `chat_id` sotto `groups`.

    Se il gate 2 non contiene nulla, ogni messaggio di gruppo viene scartato. Il Plugin emette due segnali di livello `warn` al livello di log predefinito:

    - una sola volta per account all’avvio: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - una sola volta per `chat_id` a runtime: `imessage: dropping group message from chat_id=<id> ...`

    I DM continuano a funzionare perché usano un percorso di codice diverso.

    Configurazione minima per mantenere i gruppi in transito con `groupPolicy: "allowlist"`:

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

    Gating delle menzioni per i gruppi:

    - iMessage non ha metadati nativi per le menzioni
    - il rilevamento delle menzioni usa pattern regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - senza pattern configurati, il gating delle menzioni non può essere applicato

    I comandi di controllo da mittenti autorizzati possono aggirare il gating delle menzioni nei gruppi.

    `systemPrompt` per gruppo:

    Ogni voce sotto `channels.imessage.groups.*` accetta una stringa opzionale `systemPrompt`. Il valore viene iniettato nel prompt di sistema dell’agente a ogni turno che gestisce un messaggio in quel gruppo. La risoluzione rispecchia la risoluzione del prompt per gruppo usata da `channels.whatsapp.groups`:

    1. **Prompt di sistema specifico del gruppo** (`groups["<chat_id>"].systemPrompt`): usato quando la voce specifica del gruppo esiste nella mappa **e** la sua chiave `systemPrompt` è definita. Se `systemPrompt` è una stringa vuota (`""`), il wildcard viene soppresso e a quel gruppo non viene applicato alcun prompt di sistema.
    2. **Prompt di sistema wildcard del gruppo** (`groups["*"].systemPrompt`): usato quando la voce specifica del gruppo è completamente assente dalla mappa, oppure quando esiste ma non definisce alcuna chiave `systemPrompt`.

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

  <Tab title="Sessions and deterministic replies">
    - I DM usano l’instradamento diretto; i gruppi usano l’instradamento di gruppo.
    - Con `session.dmScope=main` predefinito, i DM iMessage confluiscono nella sessione principale dell’agente.
    - Le sessioni di gruppo sono isolate (`agent:<agentId>:imessage:group:<chat_id>`).
    - Le risposte vengono instradate di nuovo a iMessage usando i metadati di canale/destinazione di origine.

    Comportamento di thread assimilabile a gruppo:

    Alcuni thread iMessage con più partecipanti possono arrivare con `is_group=false`.
    Se quel `chat_id` è configurato esplicitamente sotto `channels.imessage.groups`, OpenClaw lo tratta come traffico di gruppo (gating di gruppo + isolamento della sessione di gruppo).

  </Tab>
</Tabs>

## Binding delle conversazioni ACP

Anche le chat iMessage legacy possono essere associate a sessioni ACP.

Flusso rapido per l’operatore:

- Esegui `/acp spawn codex --bind here` dentro il DM o la chat di gruppo consentita.
- I messaggi futuri nella stessa conversazione iMessage vengono instradati alla sessione ACP generata.
- `/new` e `/reset` reimpostano sul posto la stessa sessione ACP associata.
- `/acp close` chiude la sessione ACP e rimuove il binding.

I binding persistenti configurati sono supportati tramite voci di primo livello `bindings[]` con `type: "acp"` e `match.channel: "imessage"`.

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
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    Usa un Apple ID e un utente macOS dedicati affinché il traffico del bot sia isolato dal tuo profilo Messages personale.

    Flusso tipico:

    1. Crea/accedi con un utente macOS dedicato.
    2. Accedi a Messages con l’Apple ID del bot in quell’utente.
    3. Installa `imsg` in quell’utente.
    4. Crea un wrapper SSH così OpenClaw può eseguire `imsg` nel contesto di quell’utente.
    5. Punta `channels.imessage.accounts.<id>.cliPath` e `.dbPath` a quel profilo utente.

    La prima esecuzione può richiedere approvazioni GUI (Automazione + Accesso completo al disco) nella sessione di quell’utente bot.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
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

    Usa chiavi SSH affinché sia SSH sia SCP siano non interattivi.
    Assicurati prima che la chiave dell’host sia attendibile (per esempio `ssh bot@mac-mini.tailnet-1234.ts.net`) così `known_hosts` viene popolato.

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage supporta la configurazione per account sotto `channels.imessage.accounts`.

    Ogni account può sovrascrivere campi come `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, impostazioni della cronologia e allowlist delle root degli allegati.

  </Accordion>

  <Accordion title="Direct-message history">
    Imposta `channels.imessage.dmHistoryLimit` per inizializzare le nuove sessioni di messaggi diretti con la cronologia recente decodificata di `imsg` per quella conversazione. Usa `channels.imessage.dms["<sender>"].historyLimit` per override per mittente, incluso `0` per disabilitare la cronologia per un mittente.

    La cronologia DM di iMessage viene recuperata su richiesta da `imsg`. Lasciare `dmHistoryLimit` non impostato disabilita l’inizializzazione globale della cronologia DM, ma un valore positivo per mittente di `channels.imessage.dms["<sender>"].historyLimit` abilita comunque l’inizializzazione per quel mittente.

  </Accordion>
</AccordionGroup>

## Media, suddivisione in blocchi e destinazioni di consegna

<AccordionGroup>
  <Accordion title="Allegati e contenuti multimediali">
    - l'acquisizione degli allegati in ingresso è **disattivata per impostazione predefinita** — imposta `channels.imessage.includeAttachments: true` per inoltrare foto, memo vocali, video e altri allegati all'agente. Se è disattivata, gli iMessage contenenti solo allegati vengono scartati prima di raggiungere l'agente e potrebbero non produrre alcuna riga di log `Inbound message`.
    - i percorsi degli allegati remoti possono essere recuperati tramite SCP quando `remoteHost` è impostato
    - i percorsi degli allegati devono corrispondere alle radici consentite:
      - `channels.imessage.attachmentRoots` (locale)
      - `channels.imessage.remoteAttachmentRoots` (modalità SCP remota)
      - modello di radice predefinito: `/Users/*/Library/Messages/Attachments`
    - SCP usa il controllo rigoroso della chiave host (`StrictHostKeyChecking=yes`)
    - la dimensione dei contenuti multimediali in uscita usa `channels.imessage.mediaMaxMb` (predefinito 16 MB)

  </Accordion>

  <Accordion title="Suddivisione in blocchi in uscita">
    - limite del blocco di testo: `channels.imessage.textChunkLimit` (predefinito 4000)
    - modalità di suddivisione: `channels.imessage.chunkMode`
      - `length` (predefinito)
      - `newline` (divisione dando priorità ai paragrafi)

  </Accordion>

  <Accordion title="Formati di indirizzamento">
    Destinatari espliciti preferiti:

    - `chat_id:123` (consigliato per un instradamento stabile)
    - `chat_guid:...`
    - `chat_identifier:...`

    Sono supportati anche i destinatari handle:

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
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Azioni disponibili">
    - **react**: aggiunge/rimuove i tapback di iMessage (`messageId`, `emoji`, `remove`). I tapback supportati corrispondono ad amore, mi piace, non mi piace, risata, enfasi e domanda.
    - **reply**: invia una risposta in thread a un messaggio esistente (`messageId`, `text` o `message`, più `chatGuid`, `chatId`, `chatIdentifier` o `to`).
    - **sendWithEffect**: invia testo con un effetto iMessage (`text` o `message`, `effect` o `effectId`).
    - **edit**: modifica un messaggio inviato su versioni macOS/API private supportate (`messageId`, `text` o `newText`).
    - **unsend**: ritira un messaggio inviato su versioni macOS/API private supportate (`messageId`).
    - **upload-file**: invia media/file (`buffer` come base64 o un `media`/`path`/`filePath` idratato, `filename`, `asVoice` opzionale). Alias legacy: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: gestiscono le chat di gruppo quando il destinatario corrente è una conversazione di gruppo.

  </Accordion>

  <Accordion title="ID dei messaggi">
    Il contesto iMessage in ingresso include sia valori `MessageSid` brevi sia GUID completi dei messaggi, quando disponibili. Gli ID brevi sono limitati alla cache recente delle risposte basata su SQLite e vengono verificati rispetto alla chat corrente prima dell'uso. Se un ID breve è scaduto o appartiene a un'altra chat, riprova con il `MessageSidFull` completo.

  </Accordion>

  <Accordion title="Rilevamento delle capacità">
    OpenClaw nasconde le azioni API private solo quando lo stato del probe in cache indica che il bridge non è disponibile. Se lo stato è sconosciuto, le azioni restano visibili e i probe vengono avviati in modo pigro, così la prima azione può riuscire dopo `imsg launch` senza un aggiornamento manuale separato dello stato.

  </Accordion>

  <Accordion title="Conferme di lettura e digitazione">
    Quando il bridge API private è attivo, le chat in ingresso accettate vengono contrassegnate come lette e le chat dirette mostrano un fumetto di digitazione non appena il turno viene accettato, mentre l'agente prepara il contesto e genera. Disattiva il contrassegno di lettura con:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Le build `imsg` più vecchie, precedenti all'elenco di capacità per metodo, disattiveranno silenziosamente digitazione/lettura; OpenClaw registra un avviso una tantum a ogni riavvio, così la conferma mancante è attribuibile.

  </Accordion>

  <Accordion title="Tapback in ingresso">
    OpenClaw si iscrive ai tapback di iMessage e instrada le reazioni accettate come eventi di sistema anziché come normale testo del messaggio, quindi un tapback dell'utente non attiva un normale ciclo di risposta.

    La modalità di notifica è controllata da `channels.imessage.reactionNotifications`:

    - `"own"` (predefinito): notifica solo quando gli utenti reagiscono a messaggi scritti dal bot.
    - `"all"`: notifica tutti i tapback in ingresso da mittenti autorizzati.
    - `"off"`: ignora i tapback in ingresso.

    Le sostituzioni per account usano `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Reazioni di approvazione (👍 / 👎)">
    Quando `approvals.exec.enabled` o `approvals.plugin.enabled` è true e la richiesta viene instradata a iMessage, il gateway consegna nativamente una richiesta di approvazione e accetta un tapback per risolverla:

    - `👍` (tapback Mi piace) → `allow-once`
    - `👎` (tapback Non mi piace) → `deny`
    - `allow-always` resta un fallback manuale: invia `/approve <id> allow-always` come normale risposta.

    La gestione delle reazioni richiede che l'handle dell'utente che reagisce sia un approvatore esplicito. L'elenco degli approvatori viene letto da `channels.imessage.allowFrom` (o `channels.imessage.accounts.<id>.allowFrom`); aggiungi il numero di telefono dell'utente in formato E.164 o la sua email Apple ID. La voce jolly `"*"` viene rispettata ma consente a qualsiasi mittente di approvare. La scorciatoia tramite reazione ignora intenzionalmente `reactionNotifications`, `dmPolicy` e `groupAllowFrom` perché l'allowlist degli approvatori espliciti è l'unico controllo rilevante per la risoluzione dell'approvazione.

    **Modifica del comportamento con questa release:** quando `channels.imessage.allowFrom` non è vuoto, il comando testuale `/approve <id> <decision>` è ora autorizzato rispetto a quell'elenco di approvatori (non alla allowlist DM più ampia). I mittenti consentiti nella allowlist DM ma non in `allowFrom` riceveranno un rifiuto esplicito. Aggiungi a `allowFrom` ogni operatore che deve poter approvare tramite `/approve` (e tramite reazioni) per preservare il comportamento precedente. Quando `allowFrom` è vuoto, il fallback legacy "stessa chat" resta in effetto e `/approve` continua ad autorizzare chiunque sia consentito dalla allowlist DM.

    Note per gli operatori:
    - Il binding della reazione viene archiviato sia in memoria (con TTL allineato alla scadenza dell'approvazione) sia nello store persistente con chiavi del Gateway, quindi un tapback che arriva poco dopo il riavvio di un Gateway risolve comunque l'approvazione.
    - I tapback cross-device `is_from_me=true` (la reazione dell'operatore su un dispositivo Apple associato) vengono intenzionalmente ignorati, così il bot non può auto-approvarsi.
    - I tapback legacy in stile testo (`Liked "…"` come testo semplice da client Apple molto vecchi) non possono risolvere approvazioni perché non trasportano alcun GUID del messaggio; la risoluzione tramite reazione richiede i metadati strutturati del tapback emessi dai client macOS / iOS attuali.

  </Accordion>
</AccordionGroup>

## Scritture di configurazione

iMessage consente per impostazione predefinita le scritture di configurazione avviate dal canale (per `/config set|unset` quando `commands.config: true`).

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

## Coalescenza dei DM split-send (comando + URL in un'unica composizione)

Quando un utente digita insieme un comando e un URL — ad esempio `Dump https://example.com/article` — l'app Messaggi di Apple divide l'invio in **due righe `chat.db` separate**:

1. Un messaggio di testo (`"Dump"`).
2. Un fumetto di anteprima URL (`"https://..."`) con immagini di anteprima OG come allegati.

Le due righe arrivano a OpenClaw a circa 0,8-2,0 s di distanza nella maggior parte delle configurazioni. Senza coalescenza, l'agente riceve solo il comando al turno 1, risponde (spesso "inviami l'URL") e vede l'URL solo al turno 2 — a quel punto il contesto del comando è già perso. Questo è il pipeline di invio di Apple, non qualcosa introdotto da OpenClaw o `imsg`.

`channels.imessage.coalesceSameSenderDms` abilita per un DM il buffering delle righe consecutive dello stesso mittente. Quando `imsg` espone il marcatore strutturale dell'anteprima URL `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` su una delle righe sorgente, OpenClaw unisce solo quel vero split-send e mantiene qualsiasi altra riga nel buffer come turni separati. Sulle build `imsg` più vecchie che non emettono affatto metadati del fumetto, OpenClaw non può distinguere uno split-send da invii separati, quindi ripiega sull'unione del bucket. Questo preserva il comportamento precedente ai metadati invece di far regredire gli split-send `Dump <url>` in due turni. Le chat di gruppo continuano a essere inviate per messaggio, così la struttura dei turni multiutente viene preservata.

<Tabs>
  <Tab title="Quando abilitarlo">
    Abilita quando:

    - Distribuisci Skills che si aspettano `command + payload` in un unico messaggio (dump, paste, save, queue, ecc.).
    - I tuoi utenti incollano URL insieme ai comandi.
    - Puoi accettare la latenza aggiunta al turno DM (vedi sotto).

    Lascia disattivato quando:

    - Hai bisogno della latenza minima dei comandi per trigger DM a parola singola.
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

    Con il flag attivo e senza `messages.inbound.byChannel.imessage` esplicito o `messages.inbound.debounceMs` globale, la finestra di debounce si amplia a **7000 ms** (il valore predefinito legacy è 0 ms — nessun debounce). La finestra più ampia è necessaria perché la cadenza split-send dell'anteprima URL di Apple può estendersi a diversi secondi mentre Messages.app emette la riga di anteprima.

    Per regolare tu stesso la finestra:

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
    - **L'unione precisa richiede metadati payload `imsg` attuali.** Quando la riga URL include `balloon_bundle_id`, solo quel vero split-send viene unito e le altre righe nel buffer restano separate. Sulle build `imsg` più vecchie che non espongono metadati del fumetto, OpenClaw ripiega sull'unione del bucket nel buffer, così gli split-send `Dump <url>` non regrediscono in due turni (compatibilità temporanea, rimossa quando `imsg` coalescerà gli split-send upstream).
    - **Latenza aggiunta per i messaggi DM.** Con il flag attivo, ogni DM (inclusi comandi di controllo autonomi e follow-up di solo testo) attende fino alla finestra di debounce prima dell'invio, nel caso stia arrivando una riga di anteprima URL. I messaggi delle chat di gruppo mantengono l'invio immediato.
    - **L'output unito è limitato.** Il testo unito è limitato a 4000 caratteri con un marcatore esplicito `…[truncated]`; gli allegati sono limitati a 20; le voci sorgente sono limitate a 10 (oltre tale soglia vengono conservate la prima e le più recenti). Ogni GUID sorgente viene tracciato in `coalescedMessageGuids` per la telemetria downstream.
    - **Solo DM.** Le chat di gruppo passano all'invio per messaggio, così il bot resta reattivo quando più persone stanno digitando.
    - **Opt-in, per canale.** Gli altri canali (Telegram, WhatsApp, Slack, …) non sono interessati. Le configurazioni BlueBubbles legacy che impostano `channels.bluebubbles.coalesceSameSenderDms` devono migrare quel valore a `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Scenari e cosa vede l'agente

La colonna "Flag on" mostra il comportamento su una build `imsg` che emette `balloon_bundle_id`. Sulle build `imsg` più vecchie che non emettono affatto metadati balloon, le righe sotto contrassegnate "Two turns" / "N turns" ripiegano invece su una fusione legacy (un turno): OpenClaw non può distinguere strutturalmente un invio suddiviso da invii separati, quindi conserva la fusione precedente ai metadati. La separazione precisa si attiva quando la build emette metadati balloon.

| L'utente compone                                                   | `chat.db` produce                   | Flag off (predefinito)                  | Flag on + finestra (imsg emette metadati balloon)                                                   |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (un invio)                              | 2 righe a ~1 s di distanza          | Due turni agente: solo "Dump", poi URL  | Un turno: testo unito `Dump https://example.com`                                                    |
| `Save this 📎image.jpg caption` (allegato + testo)                 | 2 righe senza metadati URL balloon  | Due turni                               | Due turni dopo che i metadati sono osservati; un turno unito nelle sessioni vecchie/pre-latch senza metadati |
| `/status` (comando autonomo)                                       | 1 riga                              | Invio immediato                         | **Attendi fino alla finestra, poi invia**                                                           |
| URL incollato da solo                                              | 1 riga                              | Invio immediato                         | Attendi fino alla finestra, poi invia                                                               |
| Testo + URL inviati come due messaggi separati intenzionali, a minuti di distanza | 2 righe fuori finestra              | Due turni                               | Due turni (la finestra scade tra loro)                                                              |
| Raffica rapida (>10 piccoli DM dentro la finestra)                 | N righe senza metadati URL balloon  | N turni                                 | N turni dopo che i metadati sono osservati; un turno unito limitato nelle sessioni vecchie/pre-latch senza metadati |
| Due persone che digitano in una chat di gruppo                     | N righe da M mittenti               | M+ turni (uno per bucket mittente)      | M+ turni — le chat di gruppo non vengono aggregate                                                 |

## Ripristino in ingresso dopo un riavvio del bridge o del gateway

iMessage recupera i messaggi persi mentre il gateway era inattivo e, allo stesso tempo, sopprime la vecchia "bomba di backlog" che Apple può svuotare dopo un ripristino Push. Il comportamento predefinito è sempre attivo, basato sulla deduplica in ingresso.

- **Deduplica del replay.** Ogni messaggio in ingresso inviato viene registrato tramite il suo GUID Apple nello stato persistente del plugin (`imessage.inbound-dedupe`), rivendicato all'ingestione e confermato dopo la gestione (rilasciato in caso di errore transitorio così può essere ritentato). Tutto ciò che è già stato gestito viene scartato invece di essere inviato due volte. Questo consente al ripristino di rieseguire il replay in modo aggressivo senza contabilità per singolo messaggio.
- **Ripristino del downtime.** All'avvio, il monitor ricorda l'ultimo rowid `chat.db` inviato (un cursore persistente per account) e lo passa a `imsg watch.subscribe` come `since_rowid`, così imsg riproduce le righe arrivate mentre il gateway era inattivo, poi segue il live. Il replay è limitato alle righe più recenti e ai messaggi vecchi fino a ~2 ore, e la deduplica scarta tutto ciò che è già stato gestito.
- **Recinzione per età del backlog obsoleto.** Le righe sopra il limite di avvio sono realmente live; una il cui invio è più vecchio di ~15 minuti rispetto all'arrivo è backlog da svuotamento Push e viene soppressa. Le righe riprodotte (al limite o sotto) usano invece la finestra di ripristino più ampia, quindi un messaggio perso di recente viene consegnato mentre la cronologia molto vecchia no.

Il ripristino funziona sia con configurazioni `cliPath` locali sia remote, perché il replay `since_rowid` passa sulla stessa connessione RPC `imsg`. La differenza è la finestra: quando il gateway può leggere `chat.db` (locale), ancora il limite rowid di avvio, limita l'intervallo del replay e consegna i messaggi persi fino a un paio d'ore prima. Su un `cliPath` SSH remoto non può leggere il database, quindi il replay non è limitato e ogni riga usa la recinzione per età live: recupera comunque i messaggi persi di recente e sopprime comunque il vecchio backlog, solo con la finestra live più stretta. Esegui il gateway sul Mac di Messages per la finestra di ripristino più ampia.

### Segnale visibile all'operatore

Il backlog soppresso viene registrato al livello predefinito, mai scartato silenziosamente (il flag `recovery` mostra quale finestra è stata applicata):

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### Migrazione

`channels.imessage.catchup.*` è deprecato: il ripristino del downtime ora è automatico e non richiede configurazione per le nuove installazioni. Le configurazioni esistenti con `catchup.enabled: true` continuano a essere rispettate come profilo di compatibilità per la finestra di replay del ripristino. I blocchi catchup disabilitati (`enabled: false` o senza `enabled: true`) sono ritirati; `openclaw doctor --fix` li rimuove.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="imsg not found or RPC unsupported">
    Convalida il binario e il supporto RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Se la sonda segnala RPC non supportato, aggiorna `imsg`. Se le azioni API private non sono disponibili, esegui `imsg launch` nella sessione dell'utente macOS con accesso effettuato e riprova la sonda. Se il Gateway non è in esecuzione su macOS, usa invece la configurazione Mac remoto via SSH sopra al posto del percorso `imsg` locale predefinito.

  </Accordion>

  <Accordion title="Messages send but inbound iMessages do not arrive">
    Prima dimostra se il messaggio ha raggiunto il Mac locale. Se `chat.db` non cambia, OpenClaw non può ricevere il messaggio anche quando `imsg status --json` segnala un bridge sano.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Se i messaggi inviati dal telefono non creano nuove righe, ripara il livello macOS Messages e Apple Push prima di modificare la configurazione di OpenClaw. Un aggiornamento una tantum del servizio spesso è sufficiente:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Invia un nuovo iMessage dal telefono e conferma una nuova riga `chat.db` o un evento `imsg watch` prima di eseguire il debug delle sessioni OpenClaw. Non eseguire questo come loop periodico di riavvio del bridge; `imsg launch` ripetuti più riavvii del gateway durante il lavoro attivo possono interrompere le consegne e lasciare bloccate le esecuzioni di canale in corso.

  </Accordion>

  <Accordion title="Gateway is not running on macOS">
    Il `cliPath: "imsg"` predefinito deve essere eseguito sul Mac connesso a Messages. Su Linux o Windows, imposta `channels.imessage.cliPath` su uno script wrapper che esegue SSH verso quel Mac ed esegue `imsg "$@"`.

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
    - approvazioni di pairing (`openclaw pairing list imessage`)

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
    - autenticazione con chiave SSH/SCP dall'host del gateway
    - la chiave host esiste in `~/.ssh/known_hosts` sull'host del gateway
    - leggibilità del percorso remoto sul Mac che esegue Messages

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    Riesegui in un terminale GUI interattivo nello stesso contesto utente/sessione e approva i prompt:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Conferma che Full Disk Access + Automation siano concessi per il contesto di processo che esegue OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Puntatori alla reference di configurazione

- [Reference di configurazione - iMessage](/it/gateway/config-channels#imessage)
- [Configurazione del Gateway](/it/gateway/configuration)
- [Pairing](/it/channels/pairing)

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Rimozione di BlueBubbles e il percorso imsg iMessage](/it/announcements/bluebubbles-imessage) — annuncio e riepilogo della migrazione
- [Da BlueBubbles](/it/channels/imessage-from-bluebubbles) — tabella di traduzione della configurazione e cutover passo per passo
- [Pairing](/it/channels/pairing) — autenticazione DM e flusso di pairing
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e gating delle menzioni
- [Routing dei canali](/it/channels/channel-routing) — routing delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
