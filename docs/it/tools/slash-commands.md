---
read_when:
    - Utilizzo o configurazione dei comandi di chat
    - Debug del routing dei comandi o delle autorizzazioni
    - Comprendere come vengono registrati i comandi delle Skills
sidebarTitle: Slash commands
summary: Tutti i comandi slash, le direttive e le scorciatoie inline disponibili — configurazione, instradamento e comportamento specifico per ogni interfaccia.
title: Comandi slash
x-i18n:
    generated_at: "2026-07-16T15:10:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e3a50447f4776d606476f3e8511595fd27bcb889d1e9e2620b1f062ac63fb3a0
    source_path: tools/slash-commands.md
    workflow: 16
---

Il Gateway gestisce i comandi inviati come messaggi autonomi che iniziano con `/`.
I comandi bash solo per l'host usano `! <cmd>` (con `/bash <cmd>` come alias).

Quando una conversazione è associata a una sessione ACP, il testo normale viene inoltrato
all'harness ACP. I comandi di gestione del Gateway rimangono locali: `/acp ...` raggiunge sempre
il gestore dei comandi di OpenClaw, mentre `/status` e `/unfocus` rimangono locali ogni volta che
la gestione dei comandi è abilitata per l'interfaccia.

## Tre tipi di comando

<CardGroup cols={3}>
  <Card title="Comandi" icon="terminal">
    Messaggi autonomi `/...` gestiti dal Gateway. Devono essere inviati come
    unico contenuto del messaggio.
  </Card>
  <Card title="Direttive" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — vengono rimossi dal messaggio prima che il modello
    lo visualizzi. Mantengono le impostazioni della sessione quando vengono inviati da soli; fungono da suggerimenti inline
    quando vengono inviati insieme ad altro testo.
  </Card>
  <Card title="Scorciatoie inline" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — vengono eseguiti immediatamente e
    rimossi prima che il modello visualizzi il testo rimanente. Solo per mittenti autorizzati.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Dettagli sul comportamento delle direttive">
    - Le direttive vengono rimosse dal messaggio prima che il modello lo visualizzi.
    - Nei messaggi contenenti **solo direttive** (il messaggio contiene esclusivamente direttive), queste
      vengono mantenute nella sessione e ricevono una risposta di conferma.
    - Nei messaggi di **chat normale** contenenti altro testo, fungono da suggerimenti inline e
      **non** mantengono le impostazioni della sessione.
    - Le direttive si applicano solo ai **mittenti autorizzati**. Se `commands.allowFrom`
      è impostato, costituisce l'unico elenco consentiti utilizzato; altrimenti l'autorizzazione deriva
      dagli elenchi consentiti/associazioni del canale e da `commands.useAccessGroups`. Per i mittenti
      non autorizzati, le direttive vengono trattate come testo normale.
  </Accordion>
</AccordionGroup>

## Configurazione

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<ParamField path="commands.text" type="boolean" default="true">
  Abilita l'analisi di `/...` nei messaggi di chat. Nelle interfacce prive di comandi nativi
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams), i comandi
  testuali funzionano anche quando l'opzione è impostata su `false`.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registra i comandi nativi. Modalità automatica: attiva per Discord/Telegram; disattiva per Slack;
  ignorata per i provider privi di supporto nativo. È possibile sovrascriverla per ciascun canale con
  `channels.<provider>.commands.native`. Su Discord, `false` evita la registrazione dei comandi slash;
  i comandi registrati in precedenza possono rimanere visibili fino alla loro rimozione.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registra in modo nativo i comandi delle Skills quando supportati. Modalità automatica: attiva per
  Discord/Telegram; disattiva per Slack. È possibile sovrascriverla con
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Abilita `! <cmd>` per eseguire comandi della shell dell'host (alias `/bash <cmd>`). Richiede
  gli elenchi consentiti `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Durata dell'attesa di bash prima del passaggio alla modalità in background (`0` passa
  immediatamente in background).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Abilita `/config` (legge/scrive `openclaw.json`). Solo per il proprietario.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Abilita `/mcp` (legge/scrive la configurazione MCP gestita da OpenClaw in `mcp.servers`). Solo per il proprietario.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Abilita `/plugins` (rilevamento/stato dei plugin, oltre a installazione e attivazione/disattivazione). Le operazioni di scrittura sono riservate al proprietario.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Abilita `/debug` (sostituzioni della configurazione valide solo durante l'esecuzione). Solo per il proprietario.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Abilita `/restart` e le richieste di riavvio esterne `SIGUSR1`.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Elenco consentiti esplicito del proprietario per le interfacce di comando riservate al proprietario. Separato da
  `commands.allowFrom` e dall'accesso tramite associazione dei messaggi diretti.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Per canale: richiede l'identità del proprietario per i comandi riservati al proprietario. Quando `true`,
  il mittente deve corrispondere a `commands.ownerAllowFrom` o disporre dell'ambito interno `operator.admin`.
  Una voce jolly `allowFrom` **non** è sufficiente.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Controlla il modo in cui gli ID del proprietario vengono visualizzati nel prompt di sistema.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  Segreto HMAC utilizzato quando `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Elenco consentiti per provider per l'autorizzazione dei comandi. Quando è configurato, costituisce
  l'**unica** fonte di autorizzazione per comandi e direttive. Utilizzare `"*"` come
  valore predefinito globale; le chiavi specifiche dei provider lo sovrascrivono.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Applica gli elenchi consentiti/le policy ai comandi quando `commands.allowFrom` non è impostato.
</ParamField>

## Elenco dei comandi

I comandi provengono da tre fonti:

- **Comandi integrati principali:** `src/auto-reply/commands-registry.shared.ts`
- **Comandi dock generati:** `src/auto-reply/commands-registry.data.ts`
- **Comandi dei plugin:** chiamate `registerCommand()` dei plugin

La disponibilità dipende dai flag di configurazione, dall'interfaccia del canale e dai plugin
installati/abilitati.

### Comandi principali

<AccordionGroup>
  <Accordion title="Sessioni ed esecuzioni">
    | Comando | Descrizione |
    | --- | --- |
    | `/new [model]` | Archivia la sessione corrente e ne avvia una nuova |
    | `/reset [soft [message]]` | Reimposta sul posto la sessione corrente. `soft` conserva la trascrizione, elimina gli ID di sessione riutilizzati del backend CLI ed esegue nuovamente l'avvio |
    | `/name <title>` | Assegna o modifica il nome della sessione corrente. Omettere il titolo per visualizzare il nome corrente e un suggerimento |
    | `/compact [instructions]` | Compatta il contesto della sessione. Consultare [Compaction](/it/concepts/compaction) |
    | `/stop` | Interrompe l'esecuzione corrente |
    | `/session idle <duration\|off>` | Gestisce la scadenza per inattività dell'associazione al thread |
    | `/session max-age <duration\|off>` | Gestisce la scadenza per età massima dell'associazione al thread |
    | `/export-session [path]` | Solo per il proprietario. Esporta la sessione corrente in HTML all'interno dell'area di lavoro. Alias: `/export` |
    | `/export-trajectory [path]` | Esporta un pacchetto della traiettoria JSONL per la sessione corrente. Alias: `/trajectory` |

    I percorsi `/export-session` espliciti sostituiscono i file esistenti all'interno
    dell'area di lavoro. Omettere il percorso per generare un nome file che eviti le collisioni.

    <Note>
      Control UI intercetta `/new` quando viene digitato per creare e passare a una nuova
      sessione del pannello di controllo, tranne quando `session.dmScope: "main"` è configurato
      e il genitore corrente è la sessione principale dell'agente: in tal caso `/new`
      reimposta sul posto la sessione principale. `/reset` digitato continua a eseguire la
      reimpostazione sul posto del Gateway. Utilizzare `/model default` per cancellare
      la selezione fissata del modello della sessione.
    </Note>

  </Accordion>

  <Accordion title="Controlli del modello e dell'esecuzione">
    | Comando | Descrizione |
    | --- | --- |
    | `/think <level\|default>` | Imposta il livello di elaborazione o cancella la sostituzione della sessione. Alias: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Attiva o disattiva l'output dettagliato. Alias: `/v` |
    | `/trace on\|off` | Attiva o disattiva l'output di traccia dei plugin per la sessione corrente |
    | `/fast [status\|auto\|on\|off\|default]` | Mostra, imposta o disattiva la modalità rapida |
    | `/reasoning [on\|off\|stream]` | Attiva o disattiva la visibilità del ragionamento. Alias: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Attiva o disattiva la modalità con privilegi elevati. Alias: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Mostra o imposta i valori predefiniti di esecuzione |
    | `/login [codex\|openai\|openai-codex]` | Associa l'accesso Codex/OpenAI da una chat privata o da una sessione dell'interfaccia Web. Solo per proprietari/amministratori |
    | `/model [name\|#\|status]` | Mostra o imposta il modello |
    | `/models [provider] [page] [limit=<n>\|all]` | Elenca i provider o i modelli configurati/disponibili per l'autenticazione |
    | `/queue <mode>` | Gestisce il comportamento della coda delle esecuzioni attive. Consultare [Coda](/it/concepts/queue) e [Controllo della coda](/it/concepts/queue-steering) |
    | `/steer <message>` | Inserisce indicazioni nell'esecuzione attiva. Alias: `/tell`. Consultare [Controllo](/it/tools/steer) |

    <AccordionGroup>
      <Accordion title="Sicurezza di output dettagliato / traccia / modalità rapida / ragionamento">
        - `/verbose` è destinato al debug: mantenerlo **disattivato** durante l'uso normale.
        - `/trace` mostra solo le righe di traccia/debug appartenenti ai plugin; il normale output dettagliato rimane disattivato.
        - `/fast auto|on|off` mantiene una sostituzione della sessione; utilizzare l'opzione `inherit` dell'interfaccia Sessioni per cancellarla.
        - `/fast` è specifico del provider: OpenAI/Codex lo mappano a `service_tier=priority`; le richieste Anthropic dirette lo mappano a `service_tier=auto` o `standard_only`.
        - `/reasoning`, `/verbose` e `/trace` comportano rischi nei contesti di gruppo: potrebbero rivelare ragionamenti interni o diagnostica dei plugin. Mantenerli disattivati nelle chat di gruppo.

      </Accordion>
      <Accordion title="Dettagli sul cambio di modello">
        - `/model` mantiene immediatamente il nuovo modello nella sessione.
        - Se l'agente è inattivo, l'esecuzione successiva lo utilizza immediatamente.
        - Se un'esecuzione è attiva, il cambio viene contrassegnato come in sospeso e applicato al successivo punto di nuovo tentativo pulito.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Rilevamento e stato">
    | Comando | Descrizione |
    | --- | --- |
    | `/help` | Mostra il riepilogo breve della guida |
    | `/commands` | Mostra il catalogo dei comandi generato |
    | `/tools [compact\|verbose]` | Mostra ciò che l'agente corrente può utilizzare in questo momento |
    | `/status` | Mostra lo stato dell'esecuzione/runtime, il tempo di attività del Gateway e del sistema, l'integrità dei plugin, nonché l'utilizzo/la quota del provider |
    | `/status plugins` | Mostra informazioni dettagliate sull'integrità dei plugin: errori di caricamento, quarantene, errori dei plugin dei canali, problemi di dipendenze, avvisi di compatibilità. Richiede `commands.plugins: true` |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | Gestisce l'[obiettivo](/it/tools/goal) persistente della sessione corrente |
    | `/diagnostics [note]` | Flusso del rapporto di supporto riservato al proprietario. Richiede ogni volta l'approvazione per l'esecuzione |
    | `/openclaw <request>` | Esegue l'assistente di configurazione e riparazione di OpenClaw da un messaggio diretto del proprietario |
    | `/tasks` | Elenca le attività in background attive/recenti per la sessione corrente |
    | `/context [list\|detail\|map\|json]` | Spiega come viene assemblato il contesto |
    | `/whoami` | Mostra l'ID del mittente. Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Controlla il piè di pagina sull'utilizzo per ciascuna risposta (`reset`/`inherit`/`clear`/`default` cancella la sostituzione della sessione per ereditare nuovamente il valore predefinito configurato) oppure stampa un riepilogo locale dei costi |
  </Accordion>

  <Accordion title="Skills, elenchi di autorizzazione, approvazioni">
    | Comando | Descrizione |
    | --- | --- |
    | `/skill <name> [input]` | Esegue una skill per nome |
    | `/learn [request]` | Crea una bozza di una skill revisionabile dalla conversazione corrente o dalle fonti indicate tramite [Skill Workshop](/it/tools/skill-workshop) |
    | `/allowlist [list\|add\|remove] ...` | Gestisce le voci dell'elenco di autorizzazione. Solo testo |
    | `/approve <id> <decision>` | Risolve le richieste di approvazione di exec o dei plugin |
    | `/btw <question>` | Pone una domanda secondaria senza modificare il contesto della sessione. Alias: `/side`. Consultare [BTW](/it/tools/btw) |
  </Accordion>

  <Accordion title="Subagenti e ACP">
    | Comando | Descrizione |
    | --- | --- |
    | `/subagents list\|log\|info` | Esamina le esecuzioni dei subagenti per la sessione corrente |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Gestisce le sessioni ACP e le opzioni di runtime. I controlli del runtime richiedono l'identità del proprietario esterno o dell'amministratore interno del Gateway |
    | `/focus <target>` | Associa il thread Discord o l'argomento Telegram corrente a una destinazione di sessione |
    | `/unfocus` | Rimuove l'associazione del thread corrente |
    | `/agents` | Elenca gli agenti associati a thread per la sessione corrente |
  </Accordion>

  <Accordion title="Scritture e amministrazione riservate al proprietario">
    | Comando | Requisiti | Descrizione |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Legge o scrive `openclaw.json`. Solo proprietario |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Legge o scrive la configurazione dei server MCP gestita da OpenClaw. Solo proprietario |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Esamina o modifica lo stato dei plugin. Le scritture sono riservate al proprietario. Alias: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Sostituzioni della configurazione solo per il runtime. Solo proprietario |
    | `/restart` | `commands.restart: true` (predefinito) | Riavvia OpenClaw |
    | `/send on\|off\|inherit` | proprietario | Imposta i criteri di invio |
  </Accordion>

  <Accordion title="Voce, TTS, controllo del canale">
    | Comando | Descrizione |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Controlla il TTS. Consultare [TTS](/it/tools/tts) |
    | `/activation mention\|always` | Imposta la modalità di attivazione dei gruppi |
    | `/bash <command>` | Esegue un comando della shell dell'host. Alias: `! <command>`. Richiede `commands.bash: true` |
    | `!poll [sessionId]` | Controlla un processo bash in background |
    | `!stop [sessionId]` | Arresta un processo bash in background |
  </Accordion>
</AccordionGroup>

### Comandi di aggancio

I comandi di aggancio spostano il percorso di risposta della sessione attiva su un altro canale collegato.
Per la configurazione e la risoluzione dei problemi, consultare [Aggancio dei canali](/it/concepts/channel-docking).

Generati dai plugin dei canali con supporto per i comandi nativi:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

I comandi di aggancio richiedono `session.identityLinks`. Il mittente di origine e il peer di destinazione
devono appartenere allo stesso gruppo di identità.

### Comandi dei plugin inclusi

| Comando                                                 | Descrizione                                                                                                                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | Attiva o disattiva il Dreaming della memoria (proprietario o amministratore del Gateway). Consultare [Dreaming](/it/concepts/dreaming)                                                                                                            |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | Gestisce l'associazione dei dispositivi. Consultare [Associazione](/it/channels/pairing)                                                                                                                                        |
| `/phone status\|arm ...\|disarm`                        | Abilita temporaneamente i comandi ad alto rischio del Node (fotocamera/schermo/computer/scritture). Consultare [Uso del computer](/it/nodes/computer-use)                                                                               |
| `/voice status\|list\|set <voiceId>`                    | Gestisce la configurazione vocale di Talk. Nome nativo di Discord: `/talkvoice`                                                                                                                                    |
| `/card ...`                                             | Invia i modelli predefiniti di schede avanzate LINE. Consultare [LINE](/it/channels/line)                                                                                                                                        |
| `/codex <action> ...`                                   | Associa, controlla ed esamina l'harness dell'app-server Codex (stato, thread, ripresa, modello, modalità rapida, autorizzazioni, compattazione, revisione, MCP, skill e altro). Consultare [Harness Codex](/it/plugins/codex-harness) |

Solo QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Comandi delle skill

Le skill richiamabili dagli utenti sono esposte come comandi slash:

- `/skill <name> [input]` funziona sempre come punto di ingresso generico.
- Le Skills possono registrarsi come comandi diretti (ad esempio `/prose` per OpenProse).
- La registrazione dei comandi nativi delle skill è controllata da `commands.nativeSkills` e
  `channels.<provider>.commands.nativeSkills`.
- I nomi vengono normalizzati in `a-z0-9_` (massimo 32 caratteri); in caso di collisione vengono aggiunti suffissi numerici.

<AccordionGroup>
  <Accordion title="Smistamento dei comandi delle skill">
    Per impostazione predefinita, i comandi delle skill vengono inoltrati al modello come una normale richiesta.

    Le Skills possono dichiarare `command-dispatch: tool` per inoltrare direttamente a uno strumento
    (in modo deterministico, senza coinvolgere il modello). Esempio: `/prose` (plugin OpenProse)
    — consultare [OpenProse](/it/prose).

  </Accordion>
  <Accordion title="Argomenti dei comandi nativi">
    Discord utilizza il completamento automatico per le opzioni dinamiche e i menu a pulsanti quando vengono omessi
    gli argomenti obbligatori. Telegram e Slack mostrano un menu a pulsanti per i comandi con
    opzioni. Le opzioni dinamiche vengono risolte rispetto al modello della sessione di destinazione, quindi le opzioni
    specifiche del modello, come i livelli `/think`, seguono la sostituzione `/model` della sessione.
  </Accordion>
</AccordionGroup>

## `/tools`: ciò che l'agente può utilizzare ora

`/tools` risponde a una domanda sul runtime: **ciò che questo agente può utilizzare in questo momento in questa
conversazione**, non un catalogo statico della configurazione.

```text
/tools         # visualizzazione compatta
/tools verbose # con brevi descrizioni
```

I risultati sono circoscritti alla sessione. La modifica dell'agente, del canale, del thread, dell'autorizzazione
del mittente o del modello può modificare l'output. Per modificare i profili e le sostituzioni,
utilizzare il pannello Strumenti della Control UI o le superfici di configurazione.

## `/model`: selezione del modello

```text
/model             # mostra il selettore del modello
/model list        # equivalente
/model 3           # seleziona per numero dal selettore
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # cancella la selezione del modello della sessione
/model status      # visualizzazione dettagliata con endpoint e modalità API
```

Su Discord, `/model` e `/models` aprono un selettore interattivo con menu a discesa per provider e
modello. Il selettore rispetta `agents.defaults.models`, incluse le
voci `provider/*`.

## `/config`: scritture della configurazione su disco

<Note>
  Solo proprietario. Disabilitato per impostazione predefinita; abilitarlo con `commands.config: true`.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

La configurazione viene convalidata prima della scrittura. Le modifiche non valide vengono rifiutate. Gli aggiornamenti di `/config`
persistono dopo i riavvii.

## `/mcp`: configurazione dei server MCP

<Note>
  Solo proprietario. Disabilitato per impostazione predefinita; abilitarlo con `commands.mcp: true`.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` memorizza la configurazione nella configurazione di OpenClaw, non nelle impostazioni del progetto dell'agente incorporato.
`/mcp show` oscura i campi contenenti credenziali, i valori dei flag riconosciuti relativi alle credenziali
e gli argomenti noti con formato simile a un segreto. Quando viene eseguito da un gruppo, la
configurazione viene inviata privatamente al proprietario; se non è disponibile alcun percorso privato verso il proprietario,
il comando termina in modo sicuro e chiede al proprietario di riprovare da una chat
diretta.

## `/debug`: sostituzioni solo per il runtime

<Note>
  Solo proprietario. Disabilitato per impostazione predefinita; abilitarlo con `commands.debug: true`.
  Le sostituzioni si applicano immediatamente alle nuove letture della configurazione, ma **non** scrivono su disco.
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins`: gestione dei plugin

<Note>
  Le scritture sono riservate al proprietario. Disabilitato per impostazione predefinita; abilitarlo con `commands.plugins: true`.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install clawhub:<package>
/plugins install npm:@openclaw/<official-package>
/plugins install npm:<package> --force
/plugins install git:<repository>@<ref> --force
```

`/plugins enable|disable` aggiorna la configurazione dei plugin e ricarica a caldo il runtime dei
plugin del Gateway per i nuovi turni dell'agente. `/plugins install` riavvia automaticamente i
Gateway gestiti perché i moduli sorgente dei plugin sono cambiati. Le installazioni attendibili da ClawHub
e dal catalogo ufficiale non richiedono conferme aggiuntive. Le origini arbitrarie npm,
git, archivio, `npm-pack:` e percorso locale mostrano un avviso sulla provenienza e
richiedono un `--force` finale dopo la verifica dell'origine. Questo flag conferma
l'origine e consente di sostituire un'installazione esistente; non aggira
`security.installPolicy` né i controlli di sicurezza del programma di installazione. Le versioni di ClawHub con
avvisi di rischio richiedono comunque il flag separato, disponibile solo nella shell,
`--acknowledge-clawhub-risk`. Anche le installazioni da marketplace, collegate e bloccate a una versione
rimangono disponibili solo nella shell.

## `/trace`: output di tracciamento dei plugin

```text
/trace          # mostra lo stato corrente del tracciamento
/trace on
/trace off
```

`/trace` mostra le righe di tracciamento/debug dei plugin circoscritte alla sessione senza attivare la modalità
completamente dettagliata. Non sostituisce `/debug` (sostituzioni del runtime) né `/verbose` (normale
output degli strumenti).

## `/btw`: domande secondarie

`/btw` è una domanda secondaria rapida sul contesto della sessione corrente. Alias: `/side`.

```text
/btw che cosa stiamo facendo in questo momento?
/side che cosa è cambiato mentre l'esecuzione principale proseguiva?
```

A differenza di un normale messaggio:

- Utilizza la sessione corrente come contesto di riferimento.
- Nelle sessioni dell'harness Codex, viene eseguita come thread secondario temporaneo di Codex.
- **Non** modifica il contesto futuro della sessione.
- Non viene scritta nella cronologia della trascrizione.

Per il comportamento completo, consultare [Domande secondarie BTW](/it/tools/btw).

## Note sulle superfici

<AccordionGroup>
  <Accordion title="Ambito della sessione per superficie">
    - **Comandi di testo:** vengono eseguiti nella normale sessione di chat (i messaggi diretti condividono `main`, i gruppi hanno una sessione propria).
    - **Comandi nativi di Discord:** `agent:<agentId>:discord:slash:<userId>`
    - **Comandi nativi di Slack:** `agent:<agentId>:slack:slash:<userId>` (prefisso configurabile tramite `channels.slack.slashCommand.sessionPrefix`)
    - **Comandi nativi di Telegram:** `telegram:slash:<userId>` (ha come destinazione la sessione di chat tramite `CommandTargetSessionKey`)
    - **`/login codex`** invia i codici di associazione dei dispositivi esclusivamente tramite chat privata o percorsi di risposta della Web UI. Le invocazioni da gruppi/argomenti Telegram chiedono invece al proprietario di inviare un messaggio diretto al bot.
    - **`/stop`** ha come destinazione la sessione di chat attiva per interrompere l'esecuzione corrente.

  </Accordion>
  <Accordion title="Specificità di Slack">
    `channels.slack.slashCommand` supporta un singolo comando in stile `/openclaw`.
    Con `commands.native: true`, creare un comando slash di Slack per ogni comando
    integrato. Registrare `/agentstatus` (non `/status`) perché Slack riserva
    `/status`. Il testo `/status` continua a funzionare nei messaggi di Slack.
  </Accordion>
  <Accordion title="Percorso rapido e scorciatoie inline">
    - I messaggi contenenti solo comandi provenienti da mittenti inclusi nell'elenco consentito vengono gestiti immediatamente (ignorando coda + modello).
    - Le scorciatoie inline (`/help`, `/commands`, `/status`, `/whoami`) funzionano anche se incorporate nei messaggi normali e vengono rimosse prima che il modello veda il testo rimanente.
    - I messaggi non autorizzati contenenti solo comandi vengono ignorati senza alcuna notifica; i token inline `/...` vengono trattati come testo normale.

  </Accordion>
  <Accordion title="Note sugli argomenti">
    - I comandi accettano un `:` facoltativo tra il comando e gli argomenti (`/think: high`, `/send: on`).
    - `/new <model>` accetta un alias del modello, `provider/model` o il nome di un provider (corrispondenza approssimativa); se non viene trovata alcuna corrispondenza, il testo viene trattato come corpo del messaggio.
    - `/allowlist add|remove` richiede `commands.config: true` e rispetta il valore `configWrites` del canale.

  </Accordion>
</AccordionGroup>

## Utilizzo e stato del provider

- **Utilizzo/quota del provider** (ad es. "Claude: 80% rimanente") viene visualizzato in `/status` per il provider del modello corrente quando il monitoraggio dell'utilizzo è abilitato.
- **Le righe relative a token/cache** in `/status` possono ricorrere alla voce di utilizzo più recente della trascrizione quando l'istantanea della sessione attiva contiene pochi dati.
- **Esecuzione e runtime:** `/status` indica `Execution` per il percorso effettivo della sandbox e `Runtime` per indicare chi esegue la sessione: `OpenClaw Default`, `OpenAI Codex`, un backend CLI o un backend ACP.
- **Token/costo per risposta:** controllati da `/usage off|tokens|full`.
- `/model status` riguarda modelli/autenticazione/endpoint, non l'utilizzo.

## Correlati

<CardGroup cols={2}>
  <Card title="Skills" href="/it/tools/skills" icon="puzzle-piece">
    Modalità di registrazione e autorizzazione dei comandi slash delle skill.
  </Card>
  <Card title="Creazione di skill" href="/it/tools/creating-skills" icon="hammer">
    Creare una skill che registri il proprio comando slash.
  </Card>
  <Card title="BTW" href="/it/tools/btw" icon="comments">
    Domande secondarie senza modificare il contesto della sessione.
  </Card>
  <Card title="Indirizzamento" href="/it/tools/steer" icon="compass">
    Guidare l'agente durante l'esecuzione con `/steer`.
  </Card>
</CardGroup>
