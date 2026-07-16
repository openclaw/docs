---
read_when:
    - Configurazione del supporto per iMessage
    - Debug dell'invio e della ricezione di iMessage
summary: Supporto nativo per iMessage tramite imsg (JSON-RPC su stdio), con azioni API private per risposte, tapback, effetti, sondaggi, allegati e gestione dei gruppi. Opzione preferita per le nuove configurazioni iMessage di OpenClaw quando i requisiti dell'host sono soddisfatti.
title: iMessage
x-i18n:
    generated_at: "2026-07-16T13:49:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 78b7ff7621e66e3b0122b5581c097140b7f62998b78981741bd3edbc0e1608bd
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Per la consueta distribuzione di OpenClaw con iMessage, eseguire il Gateway e `imsg` sullo stesso host macOS con accesso effettuato a Messaggi. Se il Gateway viene eseguito altrove, configurare `channels.imessage.cliPath` affinché punti a un wrapper SSH trasparente che esegua `imsg` sul Mac.

**Il ripristino dei messaggi in entrata è automatico.** Dopo il riavvio di un bridge o del Gateway, iMessage riproduce i messaggi persi durante l'interruzione e sopprime la vecchia «bomba di arretrati» che Apple può scaricare dopo un ripristino Push, eliminando i duplicati affinché nulla venga inoltrato due volte. Non è necessaria alcuna configurazione per abilitarlo: vedere [Ripristino dei messaggi in entrata dopo il riavvio di un bridge o del Gateway](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
Il supporto per BlueBubbles è stato rimosso. Migrare le configurazioni `channels.bluebubbles` a `channels.imessage`; OpenClaw supporta iMessage esclusivamente tramite `imsg`. Consultare [Rimozione di BlueBubbles e percorso iMessage con imsg](/it/announcements/bluebubbles-imessage) per l'annuncio breve oppure [Migrazione da BlueBubbles](/it/channels/imessage-from-bluebubbles) per la tabella di migrazione completa.
</Warning>

Stato: integrazione CLI esterna nativa. Il Gateway avvia `imsg rpc` e comunica tramite JSON-RPC su stdio, senza daemon o porta separati. La modalità API privata è fortemente consigliata per un canale iMessage completo; risposte, tapback, effetti, sondaggi, risposte agli allegati e azioni di gruppo richiedono `imsg launch` e una verifica riuscita dell'API privata.

Per la comune configurazione locale, la procedura di configurazione di OpenClaw può proporre, previa conferma dell'utente, l'installazione o l'aggiornamento di `imsg` tramite Homebrew sul Mac con accesso effettuato a Messaggi. La configurazione manuale e le topologie con wrapper SSH restano a carico dell'operatore: installare o aggiornare `imsg` nello stesso contesto utente che eseguirà il Gateway o il wrapper.

<CardGroup cols={3}>
  <Card title="Azioni dell'API privata" icon="wand-sparkles" href="#private-api-actions">
    Risposte, tapback, effetti, sondaggi, allegati e gestione dei gruppi.
  </Card>
  <Card title="Associazione" icon="link" href="/it/channels/pairing">
    Per impostazione predefinita, i messaggi diretti di iMessage utilizzano la modalità di associazione.
  </Card>
  <Card title="Mac remoto" icon="terminal" href="#remote-mac-over-ssh">
    Utilizzare un wrapper SSH quando il Gateway non viene eseguito sul Mac di Messaggi.
  </Card>
  <Card title="Riferimento della configurazione" icon="settings" href="/it/gateway/config-channels#imessage">
    Riferimento completo dei campi di iMessage.
  </Card>
</CardGroup>

## Configurazione rapida

<Tabs>
  <Tab title="Mac locale (percorso rapido)">
    <Steps>
      <Step title="Installare e verificare imsg">

```bash
brew install steipete/tap/imsg
brew update && brew upgrade imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

        Quando la procedura guidata di configurazione locale rileva la mancanza del comando predefinito `imsg`, può proporre l'installazione di `steipete/tap/imsg` tramite Homebrew. Se rileva un'istanza di `imsg` gestita da Homebrew, può proporne la reinstallazione o l'aggiornamento. I wrapper `cliPath` personalizzati non vengono modificati.

      </Step>

      <Step title="Configurare OpenClaw">

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

      <Step title="Avviare il Gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Approvare la prima associazione per messaggio diretto (dmPolicy predefinita)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Le richieste di associazione scadono dopo 1 ora.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac remoto tramite SSH">
    La maggior parte delle configurazioni non richiede SSH. Utilizzare questa topologia solo quando il Gateway non può essere eseguito sul Mac con accesso effettuato a Messaggi. OpenClaw richiede soltanto un `cliPath` compatibile con stdio, quindi è possibile configurare `cliPath` affinché punti a uno script wrapper che si connetta tramite SSH a un Mac remoto ed esegua `imsg`.
    Installare e aggiornare `imsg` su tale Mac remoto, non sull'host del Gateway:

```bash
ssh messages-mac 'brew install steipete/tap/imsg && brew update && brew upgrade imsg'
```

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Configurazione consigliata quando gli allegati sono abilitati:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // usato per recuperare gli allegati tramite SCP
      includeAttachments: true,
      // Facoltativo: ulteriori radici consentite per gli allegati (unite a quella
      // predefinita /Users/*/Library/Messages/Attachments).
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Se `remoteHost` non è impostato, OpenClaw tenta di rilevarlo automaticamente analizzando lo script wrapper SSH.
    `remoteHost` deve essere `host` o `user@host` (senza spazi né opzioni SSH); i valori non sicuri vengono ignorati.
    OpenClaw utilizza la verifica rigorosa della chiave host per SCP, pertanto la chiave host del relay deve già essere presente in `~/.ssh/known_hosts`.
    I percorsi degli allegati vengono convalidati rispetto alle radici consentite (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Qualsiasi wrapper `cliPath` o proxy SSH posto davanti a `imsg` DEVE comportarsi come una pipe stdio trasparente per una connessione JSON-RPC di lunga durata. Per tutta la durata del canale, OpenClaw scambia tramite stdin/stdout del wrapper piccoli messaggi JSON-RPC delimitati da nuove righe:

- Inoltrare ogni blocco/riga di stdin **non appena i byte sono disponibili**, senza attendere EOF.
- Inoltrare tempestivamente ogni blocco/riga di stdout nella direzione opposta.
- Preservare le nuove righe.
- Evitare letture bloccanti di dimensione fissa (`read(4096)`, `cat | buffer`, `read` predefinito della shell) che possono impedire il passaggio di frame piccoli.
- Mantenere stderr separato dal flusso stdout di JSON-RPC.

Un wrapper che memorizza stdin nel buffer finché non viene riempito un blocco di grandi dimensioni produrrà sintomi simili a un'interruzione di iMessage, come `imsg rpc timeout (chats.list)` o ripetuti riavvii del canale, anche se `imsg rpc` funziona correttamente. `ssh -T host imsg "$@"` (sopra) è sicuro perché inoltra gli argomenti `cliPath` di OpenClaw, come `rpc` e `--db`. Le pipeline come `ssh host imsg | grep -v '^DEBUG'` NON lo sono: anche gli strumenti con buffering per riga possono trattenere i frame; se è necessario applicare filtri, utilizzare `stdbuf -oL -eL` in ogni fase.
</Warning>

  </Tab>
</Tabs>

## Requisiti e autorizzazioni (macOS)

- Sul Mac che esegue `imsg` deve essere stato effettuato l'accesso a Messaggi.
- L'accesso completo al disco è obbligatorio per il contesto del processo che esegue OpenClaw/`imsg` (accesso al database di Messaggi).
- L'autorizzazione di automazione è obbligatoria per inviare messaggi tramite Messages.app.
- Per le azioni avanzate (reazione / modifica / annullamento dell'invio / risposta in thread / effetti / sondaggi / operazioni sui gruppi), la protezione dell'integrità del sistema deve essere disabilitata; vedere [Abilitazione dell'API privata di imsg](#enabling-the-imsg-private-api). L'invio e la ricezione di testo e contenuti multimediali di base funzionano senza disabilitarla.

<Tip>
Le autorizzazioni vengono concesse per ciascun contesto di processo. Se il Gateway viene eseguito senza interfaccia utente (LaunchAgent/SSH), eseguire una volta un comando interattivo nello stesso contesto per attivare le richieste di autorizzazione:

```bash
imsg chats --limit 1
# oppure
imsg send <handle> "test"
```

</Tip>

<Accordion title="Gli invii tramite wrapper SSH non riescono con AppleEvents -1743">
  Una configurazione SSH remota può leggere le chat, superare `channels status --probe` ed elaborare i messaggi in entrata, mentre gli invii in uscita continuano a non riuscire a causa di un errore di autorizzazione AppleEvents:

```text
Non autorizzato a inviare eventi Apple a Messaggi. (-1743)
```

Controllare il database TCC dell'utente con accesso effettuato sul Mac oppure System Settings > Privacy & Security > Automation. Se la voce di Automation è registrata per `/usr/libexec/sshd-keygen-wrapper` anziché per `imsg` o per il processo della shell locale, macOS potrebbe non mostrare un'opzione di Messaggi utilizzabile per tale client SSH lato server:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

In tale stato, ripetere `tccutil reset AppleEvents` o eseguire nuovamente `imsg send` tramite lo stesso wrapper SSH potrebbe continuare a non riuscire, perché il contesto di processo che necessita dell'autorizzazione di automazione per Messaggi è il wrapper SSH, non un'app a cui l'interfaccia utente possa concederla.

Utilizzare invece uno dei contesti di processo `imsg` supportati:

- Eseguire il Gateway, o almeno il bridge `imsg`, nella sessione locale dell'utente con accesso effettuato a Messaggi.
- Avviare il Gateway con un LaunchAgent per tale utente dopo aver concesso l'accesso completo al disco e l'autorizzazione di automazione dalla stessa sessione.
- Se si mantiene la topologia SSH con due utenti, verificare che un reale `imsg send` in uscita riesca tramite il wrapper esatto prima di abilitare il canale. Se non è possibile concedergli l'autorizzazione di automazione, riconfigurare il sistema con una configurazione `imsg` a utente singolo anziché affidarsi al wrapper SSH per gli invii.

</Accordion>

## Abilitazione dell'API privata di imsg

`imsg` viene distribuito con due modalità operative. Per OpenClaw, la modalità API privata è la configurazione consigliata perché fornisce al canale le azioni native di iMessage attese dagli utenti. La modalità di base resta utile per installazioni a basso rischio, per la verifica iniziale o per host sui quali non è possibile disabilitare SIP.

- **Modalità di base** (predefinita, non richiede modifiche a SIP): testo e contenuti multimediali in uscita tramite `send`, monitoraggio/cronologia in entrata, elenco delle chat. È quanto viene fornito immediatamente da una nuova installazione di `brew install steipete/tap/imsg` con le autorizzazioni macOS standard indicate sopra.
- **Modalità API privata**: `imsg` inserisce una dylib helper in `Messages.app` per chiamare funzioni interne di `IMCore`. Ciò abilita `react`, `edit`, `unsend`, `reply` (in thread), `sendWithEffect`, `poll` e `poll-vote` (sondaggi nativi di Messaggi), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, oltre agli indicatori di digitazione e alle conferme di lettura.

L'insieme di azioni consigliato in questa pagina richiede la modalità API privata. Il README di `imsg` indica esplicitamente il requisito:

> Le funzionalità avanzate come `read`, `typing`, `launch`, invio avanzato supportato dal bridge, modifica dei messaggi e gestione delle chat sono facoltative. Richiedono che SIP sia disabilitato e che una dylib helper venga inserita in `Messages.app`. `imsg launch` rifiuta di eseguire l'inserimento quando SIP è abilitato.

La tecnica di inserimento dell'helper utilizza la dylib di `imsg` per accedere alle API private di Messaggi. Nel percorso iMessage di OpenClaw non sono presenti server di terze parti né un runtime BlueBubbles.

<Warning>
**La disabilitazione di SIP comporta un reale compromesso in termini di sicurezza.** SIP è una delle protezioni principali di macOS contro l'esecuzione di codice di sistema modificato; disabilitarlo a livello di sistema amplia la superficie di attacco e può causare ulteriori effetti collaterali. In particolare, **la disabilitazione di SIP sui Mac con Apple Silicon disabilita anche la possibilità di installare ed eseguire app iOS sul Mac**.

Considerarla una scelta operativa deliberata, soprattutto su un Mac personale principale. Per un'implementazione iMessage di OpenClaw di livello produttivo, è preferibile un Mac dedicato o un utente bot macOS per il quale sia accettabile abilitare il bridge. Se il modello di minaccia non consente di disabilitare SIP in alcun ambiente, iMessage incluso è limitato alla modalità di base: solo invio e ricezione di testo e contenuti multimediali, senza reazioni / modifica / annullamento dell'invio / effetti / operazioni sui gruppi.
</Warning>

### Configurazione

1. **Installare (o aggiornare) `imsg`** sul Mac che esegue Messages.app:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg status --json
   ```

   L'output di `imsg status --json` riporta `bridge_version`, `rpc_methods` e `selectors` per ciascun metodo, in modo da mostrare ciò che la build corrente supporta prima dell'avvio.

2. **Disabilitare System Integrity Protection e, nelle versioni moderne di macOS, Library Validation.** L'iniezione di una dylib ausiliaria non Apple nel componente firmato da Apple `Messages.app` richiede che SIP sia disabilitato **e** che la convalida delle librerie sia meno restrittiva. Il passaggio relativo a SIP in modalità di recupero dipende dalla versione di macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** disabilitare Library Validation tramite Terminale, riavviare in modalità di recupero, eseguire `csrutil disable`, quindi riavviare.
   - **macOS 11+ (Big Sur e versioni successive), Intel:** accedere alla modalità di recupero (o al recupero via Internet), eseguire `csrutil disable`, quindi riavviare.
   - **macOS 11+, Apple Silicon:** usare la sequenza di avvio con il pulsante di accensione per accedere alla modalità di recupero; nelle versioni recenti di macOS tenere premuto il tasto **Maiusc sinistro** quando si fa clic su Continue, quindi eseguire `csrutil disable`. Le configurazioni delle macchine virtuali seguono una procedura separata, quindi creare prima uno snapshot della VM.

   **Su macOS 11 e versioni successive, il solo comando `csrutil disable` di solito non è sufficiente.** Apple continua ad applicare la convalida delle librerie a `Messages.app` in quanto binario della piattaforma, quindi un componente ausiliario con firma ad hoc viene rifiutato (`Library Validation failed: ... platform binary, but mapped file is not`) anche con SIP disabilitato. Dopo aver disabilitato SIP, disabilitare anche la convalida delle librerie e riavviare:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), verificato sulla versione 26.5.1:** SIP disabilitato **insieme** al comando `DisableLibraryValidation` riportato sopra è sufficiente per iniettare il componente ausiliario dalle versioni 26.0 alla 26.5.x. **Non sono necessari boot-args.** Il plist è il fattore determinante e il passaggio mancante più comune quando l'iniezione non riesce su Tahoe:
   - **Con il plist:** `imsg launch` esegue l'iniezione e `imsg status` restituisce `advanced_features: true`.
   - **Senza il plist (anche con SIP disabilitato):** `imsg launch` non riesce e restituisce `Failed to launch: Timeout waiting for Messages.app to initialize`. AMFI rifiuta il componente ausiliario con firma ad hoc durante il caricamento, quindi il bridge non diventa mai pronto e l'avvio scade. Questo timeout è il sintomo riscontrato più spesso su Tahoe; la soluzione è il plist indicato sopra, non interventi più drastici.

   Se l'iniezione di `imsg launch` o specifiche funzionalità di `selectors` iniziano a restituire false dopo un aggiornamento di macOS, questo controllo è in genere la causa. Verificare lo stato di SIP e della convalida delle librerie prima di presumere che il passaggio relativo a SIP non sia riuscito. Se tali impostazioni sono corrette e il bridge non riesce comunque a eseguire l'iniezione, raccogliere `imsg status --json` insieme all'output di `imsg launch` e segnalarlo al progetto `imsg`, invece di indebolire ulteriori controlli di sicurezza a livello di sistema.

3. **Iniettare il componente ausiliario.** Con SIP disabilitato e l'accesso eseguito in Messages.app:

   ```bash
   imsg launch
   ```

   `imsg launch` rifiuta di eseguire l'iniezione se SIP è ancora abilitato, quindi questo comando funge anche da conferma dell'esecuzione del passaggio 2.

4. **Verificare il bridge da OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   La voce iMessage dovrebbe restituire `works` e `imsg status --json | jq '{rpc_methods, selectors}'` dovrebbe mostrare le funzionalità esposte dalla build di macOS in uso. La creazione di sondaggi richiede `selectors.pollPayloadMessage`; la votazione richiede sia `selectors.pollVoteMessage` sia il metodo RPC `poll.vote`. Il plugin OpenClaw pubblicizza solo le azioni supportate dal probe memorizzato nella cache, mentre con una cache vuota mantiene un comportamento ottimistico ed esegue il probe al primo invio.

Se `openclaw channels status --probe` segnala il canale come `works`, ma azioni specifiche generano "iMessage `<action>` richiede il bridge API privato imsg" al momento dell'invio, eseguire nuovamente `imsg launch`: il componente ausiliario può disconnettersi (riavvio di Messages.app, aggiornamento del sistema operativo e così via) e lo stato `available: true` memorizzato nella cache continuerà a pubblicizzare le azioni finché il probe successivo non lo aggiornerà.

### Quando SIP rimane abilitato

Se la disabilitazione di SIP non è accettabile per il proprio modello di minaccia:

- `imsg` passa alla modalità di base: solo testo, contenuti multimediali e ricezione.
- Il plugin OpenClaw continua a pubblicizzare l'invio di testo/contenuti multimediali e il monitoraggio in entrata; nasconde `react`, `edit`, `unsend`, `reply`, `sendWithEffect` e le operazioni di gruppo dalla superficie delle azioni, in base al controllo delle funzionalità per ciascun metodo.
- È possibile utilizzare un Mac separato non Apple Silicon (o un Mac dedicato al bot) con SIP disabilitato per il carico di lavoro iMessage, mantenendo SIP abilitato sui dispositivi principali. Consultare [Utente macOS dedicato al bot (identità iMessage separata)](#deployment-patterns) più avanti.

## Controllo degli accessi e instradamento

<Tabs>
  <Tab title="Criterio per i messaggi diretti">
    `channels.imessage.dmPolicy` controlla i messaggi diretti:

    - `pairing` (impostazione predefinita)
    - `allowlist` (richiede almeno una voce `allowFrom`)
    - `open` (richiede che `allowFrom` includa `"*"`)
    - `disabled`

    Campo dell'elenco consentiti: `channels.imessage.allowFrom`.

    Le voci dell'elenco consentiti devono identificare i mittenti: handle o gruppi statici di accesso dei mittenti (`accessGroup:<name>`). Usare `channels.imessage.groupAllowFrom` per destinazioni di chat quali `chat_id:*`, `chat_guid:*` o `chat_identifier:*`; usare `channels.imessage.groups` per chiavi numeriche `chat_id` del registro.

  </Tab>

  <Tab title="Criterio dei gruppi + menzioni">
    `channels.imessage.groupPolicy` controlla la gestione dei gruppi:

    - `allowlist` (impostazione predefinita)
    - `open`
    - `disabled`

    Elenco consentiti dei mittenti dei gruppi: `channels.imessage.groupAllowFrom`.

    Le voci `groupAllowFrom` possono anche fare riferimento a gruppi statici di accesso dei mittenti (`accessGroup:<name>`).

    Ripiego in fase di esecuzione: se `groupAllowFrom` non è impostato, i controlli dei mittenti dei gruppi iMessage usano `allowFrom`; impostare `groupAllowFrom` quando l'ammissione dei messaggi diretti e dei gruppi deve essere diversa. Un `groupAllowFrom: []` esplicitamente vuoto non ricorre al ripiego: blocca tutti i mittenti dei gruppi con `allowlist`.
    Nota sul runtime: se `channels.imessage` è completamente assente, il runtime ricorre a `groupPolicy="allowlist"` e registra un avviso (anche se `channels.defaults.groupPolicy` è impostato).

    <Warning>
    L'instradamento dei gruppi con `groupPolicy: "allowlist"` applica **due** controlli consecutivi:

    1. **Elenco consentiti dei mittenti** (`channels.imessage.groupAllowFrom`): handle, `accessGroup:<name>`, `chat_guid`, `chat_identifier` o `chat_id`. Un elenco effettivo vuoto (nessun `groupAllowFrom` e nessun ripiego `allowFrom`) blocca tutti i mittenti dei gruppi.
    2. **Registro dei gruppi** (`channels.imessage.groups`): viene applicato quando la mappa contiene voci; la chat deve corrispondere a una voce esplicita per `chat_id` o al carattere jolly `groups: { "*": { ... } }`. Quando `groups` è vuoto o assente, solo l'elenco consentiti dei mittenti determina l'ammissione.

    Se non è configurato alcun elenco consentiti effettivo dei mittenti dei gruppi, ogni messaggio di gruppo viene scartato prima del controllo del registro. Ciascun controllo ha un proprio segnale di livello `warn` al livello di registrazione predefinito e indica una soluzione diversa:

    - una volta per account all'avvio, quando l'elenco consentiti effettivo dei mittenti dei gruppi è vuoto: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`; correggere impostando `channels.imessage.groupAllowFrom` (o `allowFrom`); l'aggiunta delle sole voci `groups` lascia il controllo 1 a bloccare tutti i mittenti.
    - una volta per `chat_id` in fase di esecuzione, quando un mittente ha superato il controllo 1 ma la chat non è presente in un registro `groups` popolato: `imessage: dropping group message from chat_id=<id> ...`; correggere aggiungendo quel `chat_id` (o `"*"`) sotto `channels.imessage.groups`.

    I messaggi diretti non sono interessati: seguono un percorso di codice diverso.

    Configurazione consigliata per il flusso dei gruppi con `groupPolicy: "allowlist"`:

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

    `groupAllowFrom` da solo ammette tali mittenti in qualsiasi gruppo; aggiungere il blocco `groups` per limitare le chat consentite e impostare opzioni per chat come `requireMention`.
    </Warning>

    Controllo delle menzioni per i gruppi:

    - iMessage non dispone di metadati nativi per le menzioni
    - il rilevamento delle menzioni usa espressioni regolari (`agents.list[].groupChat.mentionPatterns`, con ripiego su `messages.groupChat.mentionPatterns`)
    - senza espressioni configurate, il controllo delle menzioni non può essere applicato
    - i comandi di controllo provenienti da mittenti autorizzati ignorano il controllo delle menzioni

    `systemPrompt` per gruppo:

    Ogni voce sotto `channels.imessage.groups.*` accetta una stringa facoltativa `systemPrompt`, inserita nel prompt di sistema dell'agente a ogni turno che gestisce un messaggio in quel gruppo. La risoluzione rispecchia `channels.whatsapp.groups`:

    1. **Prompt di sistema specifico del gruppo** (`groups["<chat_id>"].systemPrompt`): usato quando nella mappa esiste la voce del gruppo specifico **e** la relativa chiave `systemPrompt` è definita. Se `systemPrompt` è una stringa vuota (`""`), il carattere jolly viene soppresso e al gruppo non viene applicato alcun prompt di sistema.
    2. **Prompt di sistema con carattere jolly per i gruppi** (`groups["*"].systemPrompt`): usato quando la voce del gruppo specifico è completamente assente dalla mappa o quando esiste ma non definisce alcuna chiave `systemPrompt`.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Usa l'ortografia britannica." },
            "8421": {
              requireMention: true,
              systemPrompt: "Questa è la chat del turno di reperibilità. Limita le risposte a meno di 3 frasi.",
            },
            "9907": {
              // soppressione esplicita: il carattere jolly "Usa l'ortografia britannica." non si applica qui
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    I prompt per gruppo si applicano solo ai messaggi di gruppo; i messaggi diretti non sono interessati.

  </Tab>

  <Tab title="Sessioni e risposte deterministiche">
    - I messaggi diretti usano l'instradamento diretto; i gruppi usano l'instradamento di gruppo.
    - Con il valore predefinito `session.dmScope=main`, i messaggi diretti iMessage confluiscono nella sessione principale dell'agente.
    - Le sessioni dei gruppi sono isolate (`agent:<agentId>:imessage:group:<chat_id>`).
    - Le risposte vengono reinstradate a iMessage usando i metadati del canale e della destinazione di origine.

    Comportamento dei thread assimilabili a gruppi:

    Alcuni thread iMessage con più partecipanti possono arrivare con `is_group=false`.
    Se tale `chat_id` è configurato esplicitamente sotto `channels.imessage.groups`, OpenClaw lo tratta come traffico di gruppo, applicando i controlli di gruppo e l'isolamento della sessione di gruppo.

  </Tab>
</Tabs>

## Associazioni delle conversazioni ACP

Le chat iMessage possono essere associate a sessioni ACP.

Procedura rapida per l'operatore:

- Eseguire `/acp spawn codex --bind here` all'interno del messaggio diretto o della chat di gruppo consentita.
- I messaggi successivi nella stessa conversazione iMessage vengono instradati alla sessione ACP avviata.
- `/new` e `/reset` reimpostano sul posto la stessa sessione ACP associata.
- `/acp close` chiude la sessione ACP e rimuove l'associazione.

Le associazioni persistenti configurate usano voci `bindings[]` di primo livello con `type: "acp"` e `match.channel: "imessage"`.

`match.peer.id` può usare:

- un handle normalizzato per messaggi diretti, come `+15555550123` o `user@example.com`
- `chat_id:<id>` (consigliato per associazioni di gruppo stabili)
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

Consultare [Agenti ACP](/it/tools/acp-agents) per il comportamento condiviso delle associazioni ACP.

## Modelli di distribuzione

<AccordionGroup>
  <Accordion title="Utente macOS dedicato al bot (identità iMessage separata)">
    Usare un Apple ID e un utente macOS dedicati, in modo da isolare il traffico del bot dal profilo personale di Messaggi.

    Procedura tipica:

    1. Creare/accedere con un utente macOS dedicato.
    2. Accedere a Messaggi con l'ID Apple del bot in tale account utente.
    3. Installare `imsg` in tale account utente.
    4. Creare un wrapper SSH affinché OpenClaw possa eseguire `imsg` nel contesto di tale account utente.
    5. Impostare `channels.imessage.accounts.<id>.cliPath` e `.dbPath` in modo che puntino a tale profilo utente.

    La prima esecuzione potrebbe richiedere autorizzazioni tramite GUI (Automazione + Accesso completo al disco) nella sessione utente del bot.

  </Accordion>

  <Accordion title="Mac remoto tramite Tailscale (esempio)">
    Topologia comune:

    - il gateway viene eseguito su Linux/VM
    - iMessage + `imsg` vengono eseguiti su un Mac nella propria tailnet
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

    Usare chiavi SSH affinché sia SSH sia SCP funzionino in modo non interattivo.
    Assicurarsi innanzitutto che la chiave dell'host sia considerata attendibile (ad esempio `ssh bot@mac-mini.tailnet-1234.ts.net`), in modo che `known_hosts` venga popolato.

  </Accordion>

  <Accordion title="Schema multi-account">
    iMessage supporta la configurazione per account in `channels.imessage.accounts`.

    Ogni account può sovrascrivere campi quali `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, le impostazioni della cronologia e gli elenchi di autorizzazione delle radici degli allegati.

  </Accordion>

  <Accordion title="Cronologia dei messaggi diretti">
    Impostare `channels.imessage.dmHistoryLimit` per inizializzare le nuove sessioni di messaggi diretti con la cronologia recente decodificata di `imsg` per tale conversazione. Usare `channels.imessage.dms["<sender>"].historyLimit` per le sostituzioni specifiche per mittente, incluso `0` per disabilitare la cronologia per un mittente.

    La cronologia dei messaggi diretti di iMessage viene recuperata su richiesta da `imsg`. Se `dmHistoryLimit` non è impostato, l'inizializzazione globale della cronologia dei messaggi diretti è disabilitata, ma un valore positivo di `channels.imessage.dms["<sender>"].historyLimit` specifico per mittente continua ad abilitarla per tale mittente.

  </Accordion>
</AccordionGroup>

## Contenuti multimediali, suddivisione e destinazioni di consegna

<AccordionGroup>
  <Accordion title="Allegati e contenuti multimediali">
    - l'acquisizione degli allegati in ingresso è **disattivata per impostazione predefinita** — impostare `channels.imessage.includeAttachments: true` per inoltrare foto, memo vocali, video e altri allegati all'agente. Se è disabilitata, gli iMessage contenenti solo allegati vengono scartati prima di raggiungere l'agente e potrebbero non produrre alcuna riga di log `Inbound message`.
    - i percorsi degli allegati remoti possono essere recuperati tramite SCP quando è impostato `remoteHost`
    - i percorsi degli allegati devono corrispondere alle radici consentite:
      - `channels.imessage.attachmentRoots` (locale)
      - `channels.imessage.remoteAttachmentRoots` (modalità SCP remota)
      - le radici configurate estendono lo schema radice predefinito `/Users/*/Library/Messages/Attachments` (vengono unite, non sostituite)
    - SCP usa la verifica rigorosa della chiave dell'host (`StrictHostKeyChecking=yes`)
    - la dimensione dei contenuti multimediali in uscita usa `channels.imessage.mediaMaxMb` (valore predefinito: 16 MB)

  </Accordion>

  <Accordion title="Testo in uscita e suddivisione">
    - limite della porzione di testo: `channels.imessage.textChunkLimit` (valore predefinito: 4000)
    - modalità di suddivisione: `channels.imessage.streaming.chunkMode`
      - `length` (valore predefinito)
      - `newline` (suddivisione a partire dai paragrafi)
    - il grassetto/corsivo/sottolineato/barrato Markdown in uscita viene convertito in testo formattato nativo (i destinatari con macOS 15+ visualizzano la formattazione; quelli con versioni precedenti visualizzano testo normale senza i marcatori); le tabelle Markdown vengono convertite in base alla modalità delle tabelle Markdown del canale
    - `channels.imessage.sendTransport` (valore predefinito `auto`, `bridge`, `applescript`) seleziona il modo in cui `imsg` effettua gli invii

  </Accordion>

  <Accordion title="Formati di indirizzamento">
    Destinazioni esplicite preferite:

    - `chat_id:123` (consigliato per un instradamento stabile)
    - `chat_guid:...`
    - `chat_identifier:...`

    Sono supportate anche le destinazioni tramite identificativo:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Azioni dell'API privata

Quando `imsg launch` è in esecuzione e `openclaw channels status --probe` segnala `privateApi.available: true`, lo strumento per i messaggi può usare azioni native di iMessage oltre ai normali invii di testo.

Tutte le azioni sono abilitate per impostazione predefinita; usare `channels.imessage.actions` per disabilitarle singolarmente:

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
    - **react**: aggiunge/rimuove tapback di iMessage (`messageId`, `emoji`, `remove`). I tapback supportati corrispondono ad amore, mi piace, non mi piace, risata, enfasi e domanda. La rimozione senza emoji elimina qualsiasi tapback impostato.
    - **reply**: invia una risposta in thread a un messaggio esistente (`messageId`, `text` o `message`, più `chatGuid`, `chatId`, `chatIdentifier` o `to`). La risposta con allegato richiede inoltre una build di `imsg` il cui `send-rich` supporti `--file`.
    - **sendWithEffect**: invia testo con un effetto di iMessage (`text` o `message`, `effect` o `effectId`). Nomi brevi: slam, loud, gentle, invisibleink, confetti, lasers, fireworks, balloon, heart, echo, happybirthday, shootingstar, sparkles, spotlight.
    - **edit**: modifica un messaggio inviato nelle versioni supportate di macOS/API privata (`messageId`, `text` o `newText`). È possibile modificare solo i messaggi inviati dal gateway stesso.
    - **unsend**: ritira un messaggio inviato nelle versioni supportate di macOS/API privata (`messageId`). È possibile ritirare solo i messaggi inviati dal gateway stesso.
    - **upload-file**: invia contenuti multimediali/file (`buffer` in formato base64 oppure un `media`/`path`/`filePath` caricato, `filename`, `asVoice` facoltativo). Alias precedente: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: gestiscono le chat di gruppo quando la destinazione corrente è una conversazione di gruppo. Queste azioni modificano l'identità di Messaggi dell'host, quindi richiedono un mittente proprietario o un client Gateway `operator.admin`.
    - **poll**: crea un sondaggio nativo di Messaggi di Apple (`pollQuestion`, `pollOption` ripetuto da 2 a 12 volte, più `chatGuid`, `chatId`, `chatIdentifier` o `to`). I destinatari con iOS/iPadOS/macOS 26+ possono visualizzarlo e votare in modo nativo; le versioni precedenti del sistema operativo ricevono il testo alternativo "Sondaggio inviato". Richiede `selectors.pollPayloadMessage`.
    - **poll-vote**: vota in un sondaggio esistente (`pollId` o `messageId`, più esattamente uno tra `pollOptionIndex`, `pollOptionId` o `pollOptionText`). Richiede `selectors.pollVoteMessage` e il metodo RPC `poll.vote`.

    I sondaggi in ingresso accettati vengono presentati all'agente con la domanda, le etichette numerate delle opzioni, il conteggio dei voti e l'ID del messaggio del sondaggio richiesto da `poll-vote`.

  </Accordion>

  <Accordion title="ID dei messaggi">
    Il contesto iMessage in ingresso include sia valori brevi `MessageSid` sia GUID completi dei messaggi (`MessageSidFull`), quando disponibili. Gli ID brevi sono limitati alla cache recente delle risposte basata su SQLite e vengono verificati rispetto alla chat corrente prima dell'uso. Se un ID breve scade, riprovare con il relativo `MessageSidFull` specificando come destinazione la conversazione che lo ha fornito. Gli ID completi non ignorano l'associazione alla conversazione o all'account, quindi sostituire un ID proveniente da un'altra chat con uno della destinazione corrente. Le chiamate remote delegate possono rifiutare ID completi obsoleti quando non sono disponibili elementi che attestino la conversazione corrente.

  </Accordion>

  <Accordion title="Rilevamento delle funzionalità">
    OpenClaw nasconde le azioni dell'API privata solo quando lo stato della verifica memorizzato nella cache indica che il bridge non è disponibile. Se lo stato è sconosciuto, le azioni rimangono visibili e l'invio avvia le verifiche in modo differito, affinché la prima azione possa riuscire dopo `imsg launch` senza un aggiornamento manuale separato dello stato.

  </Accordion>

  <Accordion title="Conferme di lettura e indicatore di digitazione">
    Quando il bridge dell'API privata è attivo, le chat in ingresso accettate vengono contrassegnate come lette e le chat dirette mostrano un indicatore di digitazione non appena il turno viene accettato, mentre l'agente prepara il contesto e genera la risposta. Disabilitare la marcatura come letto con:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Le build precedenti di `imsg`, antecedenti alla verifica dell'elenco delle funzionalità per metodo, disattivano silenziosamente la digitazione/lettura; OpenClaw registra un avviso una tantum a ogni riavvio, in modo da poter attribuire la conferma mancante.

  </Accordion>

  <Accordion title="Tapback in ingresso">
    OpenClaw si iscrive ai tapback di iMessage e instrada le reazioni accettate come eventi di sistema anziché come normale testo del messaggio, pertanto il tapback di un utente non attiva un normale ciclo di risposta.

    La modalità di notifica è controllata da `channels.imessage.reactionNotifications`:

    - `"own"` (valore predefinito): invia una notifica solo quando gli utenti reagiscono ai messaggi scritti dal bot.
    - `"all"`: invia una notifica per tutti i tapback in ingresso provenienti da mittenti autorizzati.
    - `"off"`: ignora i tapback in ingresso.

    Le sostituzioni per account usano `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Reazioni di approvazione (👍 / 👎)">
    Quando `approvals.exec.enabled` o `approvals.plugin.enabled` è impostato su true e la richiesta viene instradata a iMessage, il gateway consegna una richiesta di approvazione in modo nativo e accetta un tapback per risolverla:

    - `👍` (tapback Mi piace) → `allow-once`
    - `👎` (tapback Non mi piace) → `deny`
    - `allow-always` rimane un'alternativa manuale: inviare `/approve <id> allow-always` come risposta normale.

    La gestione delle reazioni richiede che l'identificativo dell'utente che reagisce sia incluso esplicitamente tra gli approvatori. L'elenco degli approvatori viene letto da `channels.imessage.allowFrom` (o `channels.imessage.accounts.<id>.allowFrom`); aggiungere il numero di telefono dell'utente in formato E.164 o il relativo indirizzo email dell'ID Apple (le destinazioni chat come `chat_id:*` non sono voci valide per gli approvatori). La voce jolly `"*"` viene rispettata, ma consente a qualsiasi mittente di approvare; un elenco di approvatori vuoto disabilita completamente la scorciatoia tramite reazione. La scorciatoia tramite reazione ignora intenzionalmente `reactionNotifications`, `dmPolicy` e `groupAllowFrom`, poiché l'elenco di autorizzazione degli approvatori espliciti è l'unico controllo rilevante per la risoluzione dell'approvazione.

    L'autorizzazione del comando testuale `/approve` segue lo stesso elenco: quando `channels.imessage.allowFrom` non è vuoto, `/approve <id> <decision>` viene autorizzato in base a tale elenco di approvatori (non al più ampio elenco di autorizzazione dei messaggi diretti) e i mittenti consentiti dall'elenco dei messaggi diretti ma non inclusi in `allowFrom` ricevono un rifiuto esplicito. Quando `allowFrom` è vuoto, rimane attiva l'alternativa della stessa chat e `/approve` autorizza chiunque sia consentito dall'elenco di autorizzazione dei messaggi diretti. Aggiungere ogni operatore che deve poter approvare, tramite `/approve` o tramite reazioni, a `allowFrom`.

    Note per l'operatore:
    - L'associazione della reazione viene memorizzata sia in memoria sia nell'archivio persistente con chiavi del Gateway (con TTL corrispondente alla scadenza dell'approvazione); inoltre, il Gateway interroga periodicamente le richieste in sospeso per rilevare i tapback, pertanto un tapback ricevuto poco dopo il riavvio del Gateway risolve comunque l'approvazione.
    - Il tapback `is_from_me=true` dell'operatore stesso (ad esempio da un dispositivo Apple abbinato) risolve l'approvazione quando tale identificativo è configurato esplicitamente come approvatore.
    - Le richieste di approvazione vengono instradate in una conversazione di gruppo solo quando sono configurati approvatori espliciti; altrimenti qualsiasi membro del gruppo potrebbe approvare.
    - I tapback legacy in formato testuale (`Liked "…"` testo normale proveniente da client Apple molto datati) non possono risolvere le approvazioni perché non contengono alcun GUID del messaggio; la risoluzione tramite reazione richiede i metadati strutturati del tapback emessi dagli attuali client macOS/iOS.

  </Accordion>
</AccordionGroup>

## Scritture della configurazione

Per impostazione predefinita, iMessage consente scritture della configurazione avviate dal canale (per `/config set|unset` quando `commands.config: true`).

Per disabilitarle:

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

## Aggregazione dei DM con invio suddiviso (comando + URL in un'unica composizione)

Quando un utente digita insieme un comando e un URL, ad esempio `Dump https://example.com/article`, l'app Messaggi di Apple suddivide l'invio in **due righe `chat.db` distinte**:

1. Un messaggio di testo (`"Dump"`).
2. Un fumetto di anteprima dell'URL (`"https://..."`) con le immagini dell'anteprima OG come allegati.

Nella maggior parte delle configurazioni, le due righe arrivano a OpenClaw a circa 0.8-2.0 s di distanza. Senza aggregazione, l'agente riceve soltanto il comando nel turno 1 (e spesso risponde «inviami l'URL») prima che l'URL arrivi nel turno 2. Ciò dipende dalla pipeline di invio di Apple, non da OpenClaw né da `imsg`.

`channels.imessage.coalesceSameSenderDms` abilita per un DM il buffering delle righe consecutive dello stesso mittente. Quando `imsg` espone il marcatore strutturale dell'anteprima URL `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` in una delle righe di origine, OpenClaw unisce soltanto quell'effettivo invio suddiviso e mantiene tutte le altre righe nel buffer come turni distinti. Nelle build `imsg` meno recenti, che non emettono alcun metadato del fumetto, OpenClaw non può distinguere un invio suddiviso da invii separati, quindi ripiega sull'unione del gruppo. In questo modo viene mantenuto il comportamento precedente all'introduzione dei metadati, anziché trasformare gli invii suddivisi `Dump <url>` in due turni. Le chat di gruppo continuano a distribuire ogni messaggio separatamente, preservando la struttura dei turni tra più utenti.

<Tabs>
  <Tab title="Quando abilitarla">
    Abilitarla quando:

    - Si distribuiscono Skills che prevedono `command + payload` in un unico messaggio (dump, incolla, salva, accoda e così via).
    - Gli utenti incollano URL insieme ai comandi.
    - È accettabile la latenza aggiuntiva dei turni nei DM (vedere sotto).

    Lasciarla disabilitata quando:

    - È necessaria la latenza minima dei comandi per gli attivatori DM costituiti da una sola parola.
    - Tutti i flussi sono comandi singoli senza payload successivi.

  </Tab>
  <Tab title="Abilitazione">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // abilitazione esplicita (valore predefinito: false)
        },
      },
    }
    ```

    Con il flag attivo e senza un valore `messages.inbound.byChannel.imessage` esplicito o un valore globale `messages.inbound.debounceMs`, la finestra di debounce viene ampliata a **7000 ms** (il valore predefinito legacy è 0 ms, ossia nessun debounce). La finestra più ampia è necessaria perché la cadenza dell'invio suddiviso delle anteprime URL di Apple può estendersi per diversi secondi mentre Messages.app emette la riga dell'anteprima.

    Per regolare manualmente la finestra:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms coprono i ritardi osservati delle anteprime URL di Messages.app.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Compromessi">
    - **L'unione precisa richiede i metadati correnti del payload `imsg`.** Quando è presente `balloon_bundle_id`, viene unito soltanto l'effettivo invio suddiviso; l'unione di ripiego senza metadati descritta sopra è una compatibilità temporanea con le versioni precedenti, che verrà rimossa quando `imsg` aggregherà gli invii suddivisi a monte.
    - **Latenza aggiuntiva per i messaggi DM.** Con il flag attivo, ogni DM (inclusi i comandi di controllo autonomi e i messaggi di testo successivi singoli) attende fino alla scadenza della finestra di debounce prima della distribuzione, nel caso sia in arrivo una riga di anteprima URL. I messaggi delle chat di gruppo continuano a essere distribuiti immediatamente.
    - **L'output unito è limitato.** Il testo unito è limitato a 4000 caratteri con un marcatore `…[truncated]` esplicito; gli allegati sono limitati a 20; le voci di origine sono limitate a 10 (oltre tale limite vengono conservate la prima e le più recenti). Ogni GUID di origine viene registrato in `coalescedMessageGuids` per la telemetria a valle.
    - **Solo DM.** Le chat di gruppo ricadono nella distribuzione per singolo messaggio, affinché il bot resti reattivo quando più persone stanno scrivendo.
    - **Abilitazione esplicita per singolo canale.** Gli altri canali (Discord, Slack, Telegram, WhatsApp, …) non sono interessati. Le configurazioni legacy di BlueBubbles che impostano `channels.bluebubbles.coalesceSameSenderDms` devono migrare tale valore in `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Scenari e contenuto ricevuto dall'agente

La colonna «Flag attivo» mostra il comportamento su una build `imsg` che emette `balloon_bundle_id`. Nelle build `imsg` meno recenti che non emettono alcun metadato del fumetto, le righe indicate di seguito come «Due turni»/«N turni» ricadono invece in un'unione legacy (un solo turno): OpenClaw non può distinguere strutturalmente un invio suddiviso da invii separati, quindi mantiene l'unione precedente all'introduzione dei metadati. La separazione precisa si attiva quando la build emette i metadati del fumetto.

| Composizione dell'utente                                            | Risultato prodotto da `chat.db`    | Flag disattivato (predefinito)                 | Flag attivo + finestra (imsg emette i metadati del fumetto)                                                      |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (un invio)                              | 2 righe a circa 1 s di distanza                   | Due turni dell'agente: solo «Dump», quindi l'URL | Un turno: testo unito `Dump https://example.com`                                                    |
| `Save this 📎image.jpg caption` (allegato + testo)                | 2 righe senza metadati del fumetto URL | Due turni                               | Due turni dopo il rilevamento dei metadati; un turno unito nelle sessioni meno recenti/precedenti al latch prive di metadati       |
| `/status` (comando autonomo)                                     | 1 riga                               | Distribuzione immediata                        | **Attesa fino alla scadenza della finestra, quindi distribuzione**                                                                |
| URL incollato da solo                                                   | 1 riga                               | Distribuzione immediata                        | Attesa fino alla scadenza della finestra, quindi distribuzione                                                                    |
| Testo + URL inviati deliberatamente come due messaggi separati a distanza di minuti | 2 righe fuori dalla finestra               | Due turni                               | Due turni (la finestra scade tra i due messaggi)                                                             |
| Raffica rapida (>10 piccoli DM entro la finestra)                          | N righe senza metadati del fumetto URL | N turni                                 | N turni dopo il rilevamento dei metadati; un turno unito e limitato nelle sessioni meno recenti/precedenti al latch prive di metadati |
| Due persone scrivono in una chat di gruppo                                  | N righe da M mittenti               | M+ turni (uno per gruppo del mittente)        | M+ turni — le chat di gruppo non vengono aggregate                                                            |

## Ripristino dei messaggi in ingresso dopo il riavvio di un bridge o del Gateway

iMessage recupera i messaggi persi mentre il Gateway era inattivo e, allo stesso tempo, elimina la vecchia «raffica di arretrati» che Apple può riversare dopo un ripristino Push. Il comportamento predefinito è sempre attivo e si basa sulla deduplicazione dei messaggi in ingresso.

- **Deduplicazione della riproduzione.** Ogni messaggio in ingresso distribuito viene registrato tramite il relativo GUID Apple nello stato persistente del Plugin (`imessage.inbound-dedupe`), acquisito durante l'ingestione e confermato dopo la gestione (rilasciato in caso di errore transitorio, affinché possa essere riprovato). Tutto ciò che è già stato gestito viene eliminato anziché essere distribuito due volte. Questo consente al ripristino di riprodurre in modo aggressivo senza una contabilità per singolo messaggio.
- **Ripristino dopo l'inattività.** All'avvio, il monitor memorizza l'ultimo rowid `chat.db` distribuito (un cursore persistente per account) e lo passa a `imsg watch.subscribe` come `since_rowid`, affinché imsg riproduca le righe arrivate mentre il Gateway era inattivo e poi prosegua con quelle in tempo reale. La riproduzione è limitata alle 500 righe più recenti e ai messaggi risalenti al massimo a circa 2 ore prima; la deduplicazione elimina tutto ciò che è già stato gestito.
- **Limite temporale per gli arretrati obsoleti.** Le righe oltre il limite di avvio sono effettivamente in tempo reale; una riga la cui data di invio precede di oltre circa 15 minuti quella di arrivo appartiene agli arretrati riversati da Push e viene eliminata. Le righe riprodotte (in corrispondenza o al di sotto del limite) utilizzano invece la finestra di ripristino più ampia, così un messaggio perso di recente viene consegnato, mentre la cronologia remota non lo è.

Il ripristino funziona sia con le configurazioni `cliPath` locali sia con quelle remote, perché la riproduzione `since_rowid` viene eseguita tramite la stessa connessione RPC `imsg`. La differenza risiede nella finestra: quando il Gateway può leggere `chat.db` (in locale), fissa il limite del rowid di avvio, limita l'intervallo di riproduzione e consegna i messaggi persi risalenti al massimo a un paio d'ore prima. Tramite una connessione SSH `cliPath` remota, non può leggere il database, quindi la riproduzione non è limitata e ogni riga utilizza il limite temporale in tempo reale: recupera comunque i messaggi persi di recente ed elimina comunque gli arretrati obsoleti, ma con la finestra in tempo reale più ristretta. Per usufruire della finestra di ripristino più ampia, eseguire il Gateway sul Mac che ospita Messaggi.

### Segnale visibile all'operatore

Gli arretrati eliminati vengono registrati al livello predefinito e non vengono mai ignorati silenziosamente (il flag `recovery` indica quale finestra è stata applicata):

```text
imessage: arretrato obsoleto in ingresso eliminato account=<id> inviato=<iso> ripristino=<bool> (<N> eliminati dall'avvio)
```

### Migrazione

`channels.imessage.catchup.*` è deprecato: il ripristino dopo l'inattività è automatico e non richiede alcuna configurazione per le nuove installazioni. Le configurazioni esistenti con `catchup.enabled: true` continuano a essere rispettate come profilo di compatibilità per la finestra di riproduzione del ripristino. I blocchi di recupero disabilitati (`enabled: false` o senza `enabled: true`) sono stati ritirati; `openclaw doctor --fix` li rimuove.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="imsg non trovato o RPC non supportato">
    Verificare il file binario e il supporto RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Se il sondaggio segnala che RPC non è supportato, aggiornare `imsg`. Se le azioni dell'API privata non sono disponibili, eseguire `imsg launch` nella sessione dell'utente macOS connesso ed effettuare nuovamente il sondaggio. Se il Gateway non è in esecuzione su macOS, utilizzare la configurazione Mac remoto tramite SSH descritta sopra anziché il percorso locale predefinito `imsg`.

  </Accordion>

  <Accordion title="I messaggi vengono inviati, ma gli iMessage in ingresso non arrivano">
    Innanzitutto, verificare se il messaggio ha raggiunto il Mac locale. Se `chat.db` non cambia, OpenClaw non può ricevere il messaggio anche quando `imsg status --json` segnala un bridge integro.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Se i messaggi inviati dal telefono non creano nuove righe, ripristinare il livello Messaggi e Apple Push di macOS prima di modificare la configurazione di OpenClaw. Spesso è sufficiente un aggiornamento una tantum del servizio:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Inviare un nuovo iMessage dal telefono e verificare la presenza di una nuova riga `chat.db` o di un evento `imsg watch` prima di eseguire il debug delle sessioni OpenClaw. Non eseguire questa operazione come ciclo periodico di riavvio del bridge; ripetuti `imsg launch` insieme a riavvii del Gateway durante attività in corso possono interrompere le consegne e lasciare bloccate le esecuzioni del canale in corso.

  </Accordion>

  <Accordion title="Il Gateway non è in esecuzione su macOS">
    Il valore predefinito `cliPath: "imsg"` deve essere eseguito sul Mac connesso a Messaggi. Su Linux o Windows, impostare `channels.imessage.cliPath` su uno script wrapper che si connetta tramite SSH a quel Mac ed esegua `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Quindi eseguire:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="I messaggi diretti vengono ignorati">
    Verificare:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - approvazioni dell'associazione (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="I messaggi di gruppo vengono ignorati">
    Verificare:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` comportamento dell'elenco consentiti
    - configurazione del modello di menzione (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Gli allegati remoti non funzionano">
    Verificare:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autenticazione con chiave SSH/SCP dall'host del Gateway
    - la chiave dell'host esiste in `~/.ssh/known_hosts` sull'host del Gateway
    - il percorso remoto è leggibile sul Mac che esegue Messaggi

  </Accordion>

  <Accordion title="Le richieste di autorizzazione di macOS non sono state confermate">
    Eseguire nuovamente i comandi in un terminale GUI interattivo nello stesso contesto utente/sessione e approvare le richieste:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Verificare che l'accesso completo al disco e l'autorizzazione all'automazione siano concessi per il contesto del processo che esegue OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Riferimenti per la configurazione

- [Riferimento per la configurazione - iMessage](/it/gateway/config-channels#imessage)
- [Configurazione del Gateway](/it/gateway/configuration)
- [Associazione](/it/channels/pairing)

## Contenuti correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Rimozione di BlueBubbles e percorso iMessage con imsg](/it/announcements/bluebubbles-imessage) — annuncio e riepilogo della migrazione
- [Migrazione da BlueBubbles](/it/channels/imessage-from-bluebubbles) — tabella di conversione della configurazione e passaggio graduale
- [Associazione](/it/channels/pairing) — autenticazione dei messaggi diretti e flusso di associazione
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e controllo tramite menzione
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e rafforzamento della sicurezza
