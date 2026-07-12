---
read_when:
    - Utilizzo o configurazione dei comandi di chat
    - Debug del routing dei comandi o delle autorizzazioni
    - Comprendere come vengono registrati i comandi delle Skills
sidebarTitle: Slash commands
summary: Tutti i comandi slash, le direttive e le scorciatoie inline disponibili — configurazione, instradamento e comportamento specifico per ogni superficie.
title: Comandi slash
x-i18n:
    generated_at: "2026-07-12T07:34:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0017f229610ff5b1f4ff4a11a77814575835cfd07c7d4dbcce8b0d51ed4f4dd1
    source_path: tools/slash-commands.md
    workflow: 16
---

Il Gateway gestisce i comandi inviati come messaggi autonomi che iniziano con `/`.
I comandi bash solo per l'host usano `! <cmd>` (con `/bash <cmd>` come alias).

Quando una conversazione è associata a una sessione ACP, il testo normale viene instradato
all'harness ACP. I comandi di gestione del Gateway rimangono locali: `/acp ...` raggiunge
sempre il gestore dei comandi di OpenClaw, mentre `/status` e `/unfocus` rimangono locali
ogni volta che la gestione dei comandi è abilitata per la superficie.

## Tre tipi di comandi

<CardGroup cols={3}>
  <Card title="Comandi" icon="terminal">
    Messaggi autonomi `/...` gestiti dal Gateway. Devono essere inviati come
    unico contenuto del messaggio.
  </Card>
  <Card title="Direttive" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue`: vengono rimossi dal messaggio prima che il modello
    lo elabori. Se inviati da soli, rendono persistenti le impostazioni della sessione;
    se inviati con altro testo, fungono da indicazioni inline.
  </Card>
  <Card title="Scorciatoie inline" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami`: vengono eseguiti immediatamente e
    rimossi prima che il modello elabori il testo rimanente. Solo mittenti autorizzati.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Dettagli sul comportamento delle direttive">
    - Le direttive vengono rimosse dal messaggio prima che il modello lo elabori.
    - Nei messaggi contenenti **solo direttive** (il messaggio contiene esclusivamente
      direttive), vengono rese persistenti nella sessione e ricevono una risposta di conferma.
    - Nei messaggi di **chat normale** contenenti altro testo, fungono da indicazioni inline e
      **non** rendono persistenti le impostazioni della sessione.
    - Le direttive si applicano solo ai **mittenti autorizzati**. Se `commands.allowFrom`
      è impostato, costituisce l'unico elenco di elementi consentiti utilizzato; altrimenti
      l'autorizzazione deriva dagli elenchi di elementi consentiti/associazione del canale
      insieme a `commands.useAccessGroups`. Per i mittenti non autorizzati, le direttive
      vengono trattate come testo normale.
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
  Abilita l'analisi di `/...` nei messaggi di chat. Sulle superfici senza comandi nativi
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams), i comandi testuali
  funzionano anche quando è impostato su `false`.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registra i comandi nativi. Modalità automatica: attiva per Discord/Telegram; disattiva
  per Slack; ignorata per i provider senza supporto nativo. È possibile sovrascriverla
  per ciascun canale con `channels.<provider>.commands.native`. Su Discord, `false`
  evita la registrazione dei comandi slash; i comandi registrati in precedenza potrebbero
  rimanere visibili finché non vengono rimossi.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registra in modo nativo i comandi delle Skills quando supportato. Modalità automatica:
  attiva per Discord/Telegram; disattiva per Slack. È possibile sovrascriverla con
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Abilita `! <cmd>` per eseguire comandi della shell dell'host (alias `/bash <cmd>`).
  Richiede gli elenchi di elementi consentiti di `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Durata dell'attesa di bash prima del passaggio alla modalità in background
  (`0` passa immediatamente in background).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Abilita `/config` (legge/scrive `openclaw.json`). Solo per il proprietario.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Abilita `/mcp` (legge/scrive la configurazione MCP gestita da OpenClaw in `mcp.servers`). Solo per il proprietario.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Abilita `/plugins` (rilevamento/stato dei plugin, oltre a installazione e abilitazione/disabilitazione). Solo il proprietario può effettuare operazioni di scrittura.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Abilita `/debug` (sostituzioni della configurazione valide solo in fase di esecuzione). Solo per il proprietario.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Abilita `/restart` e le azioni degli strumenti per il riavvio del Gateway.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Elenco esplicito dei proprietari consentiti per le superfici di comando riservate al proprietario.
  Separato da `commands.allowFrom` e dall'accesso tramite associazione dei messaggi diretti.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Per canale: richiede l'identità del proprietario per i comandi riservati al proprietario.
  Quando è `true`, il mittente deve corrispondere a `commands.ownerAllowFrom` o disporre
  dell'ambito interno `operator.admin`. Una voce jolly in `allowFrom` **non** è sufficiente.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Controlla come vengono visualizzati gli ID dei proprietari nel prompt di sistema.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  Segreto HMAC utilizzato quando è impostato `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Elenco di elementi consentiti per provider per l'autorizzazione dei comandi. Quando configurato, costituisce
  l'**unica** fonte di autorizzazione per comandi e direttive. Utilizza `"*"` come
  valore predefinito globale; le chiavi specifiche dei provider hanno la precedenza.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Applica gli elenchi di elementi consentiti e i criteri per i comandi quando `commands.allowFrom` non è impostato.
</ParamField>

## Elenco dei comandi

I comandi provengono da tre fonti:

- **Comandi integrati nel core:** `src/auto-reply/commands-registry.shared.ts`
- **Comandi dock generati:** `src/auto-reply/commands-registry.data.ts`
- **Comandi dei Plugin:** chiamate `registerCommand()` dei Plugin

La disponibilità dipende dai flag di configurazione, dall'interfaccia del canale e dai Plugin
installati e abilitati.

### Comandi del core

  <AccordionGroup>
  <Accordion title="Sessioni ed esecuzioni">
    | Comando | Descrizione |
    | --- | --- |
    | `/new [model]` | Archivia la sessione corrente e ne avvia una nuova |
    | `/reset [soft [message]]` | Reimposta la sessione corrente sul posto. `soft` conserva la trascrizione, elimina gli ID di sessione riutilizzati del backend CLI e riesegue l'avvio |
    | `/name <title>` | Assegna un nome alla sessione corrente o la rinomina. Ometti il titolo per visualizzare il nome corrente e un suggerimento |
    | `/compact [instructions]` | Esegue la Compaction del contesto della sessione. Vedi [Compaction](/it/concepts/compaction) |
    | `/stop` | Interrompe l'esecuzione corrente |
    | `/session idle <duration\|off>` | Gestisce la scadenza per inattività dell'associazione al thread |
    | `/session max-age <duration\|off>` | Gestisce la scadenza per età massima dell'associazione al thread |
    | `/export-session [path]` | Esporta la sessione corrente in HTML. Alias: `/export` |
    | `/export-trajectory [path]` | Esporta un pacchetto di traiettoria JSONL per la sessione corrente. Alias: `/trajectory` |

    <Note>
      Control UI intercetta il comando `/new` digitato per creare e passare a una nuova
      sessione della dashboard, tranne quando è configurato `session.dmScope: "main"`
      e l'elemento padre corrente è la sessione principale dell'agente; in tal caso `/new`
      reimposta sul posto la sessione principale. Il comando `/reset` digitato esegue comunque
      la reimpostazione sul posto del Gateway. Usa `/model default` quando vuoi cancellare
      la selezione del modello fissata per la sessione.
    </Note>

  </Accordion>

  <Accordion title="Controlli del modello e dell'esecuzione">
    | Comando | Descrizione |
    | --- | --- |
    | `/think <level\|default>` | Imposta il livello di elaborazione o cancella la sostituzione della sessione. Alias: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Attiva o disattiva l'output dettagliato. Alias: `/v` |
    | `/trace on\|off` | Attiva o disattiva l'output di tracciamento dei plugin per la sessione corrente |
    | `/fast [status\|auto\|on\|off\|default]` | Mostra, imposta o cancella la modalità rapida |
    | `/reasoning [on\|off\|stream]` | Attiva o disattiva la visibilità del ragionamento. Alias: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Attiva o disattiva la modalità con privilegi elevati. Alias: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Mostra o imposta i valori predefiniti di esecuzione |
    | `/login [codex\|openai\|openai-codex]` | Associa l'accesso a Codex/OpenAI da una chat privata o da una sessione dell'interfaccia web. Solo proprietari/amministratori |
    | `/model [name\|#\|status]` | Mostra o imposta il modello |
    | `/models [provider] [page] [limit=<n>\|all]` | Elenca i provider o i modelli configurati e disponibili per l'autenticazione |
    | `/queue <mode>` | Gestisce il comportamento della coda delle esecuzioni attive. Vedi [Coda](/it/concepts/queue) e [Gestione della coda](/it/concepts/queue-steering) |
    | `/steer <message>` | Inserisce indicazioni nell'esecuzione attiva. Alias: `/tell`. Vedi [Orientamento](/it/tools/steer) |

    <AccordionGroup>
      <Accordion title="Sicurezza di verbose / trace / fast / reasoning">
        - `/verbose` serve per il debug: mantienilo **disattivato** durante l'uso normale.
        - `/trace` mostra solo le righe di tracciamento/debug appartenenti ai plugin; il normale output dettagliato rimane disattivato.
        - `/fast auto|on|off` mantiene una sostituzione per la sessione; usa l'opzione `inherit` nell'interfaccia Sessioni per cancellarla.
        - `/fast` dipende dal provider: OpenAI/Codex lo associa a `service_tier=priority`; le richieste dirette ad Anthropic lo associano a `service_tier=auto` o `standard_only`.
        - `/reasoning`, `/verbose` e `/trace` sono rischiosi nelle conversazioni di gruppo: potrebbero rivelare ragionamenti interni o dati diagnostici dei plugin. Mantienili disattivati nelle chat di gruppo.

      </Accordion>
      <Accordion title="Dettagli sul cambio di modello">
        - `/model` memorizza immediatamente il nuovo modello nella sessione.
        - Se l'agente è inattivo, l'esecuzione successiva lo utilizza subito.
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
    | `/status` | Mostra lo stato di esecuzione/runtime, il tempo di attività del Gateway e del sistema, lo stato dei plugin, nonché l'utilizzo e la quota del provider |
    | `/status plugins` | Mostra lo stato dettagliato dei plugin: errori di caricamento, quarantene, errori dei plugin di canale, problemi con le dipendenze e avvisi di compatibilità. Richiede `commands.plugins: true` |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | Gestisce l'[obiettivo](/it/tools/goal) persistente della sessione corrente |
    | `/diagnostics [note]` | Procedura di segnalazione per l'assistenza riservata al proprietario. Richiede ogni volta l'approvazione per l'esecuzione |
    | `/crestodian <request>` | Esegue l'assistente Crestodian per la configurazione e la riparazione da un messaggio diretto del proprietario |
    | `/tasks` | Elenca le attività in background attive o recenti per la sessione corrente |
    | `/context [list\|detail\|map\|json]` | Spiega come viene assemblato il contesto |
    | `/whoami` | Mostra il tuo ID mittente. Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Controlla il piè di pagina sull'utilizzo per ogni risposta (`reset`/`inherit`/`clear`/`default` elimina la sostituzione della sessione per ereditare nuovamente il valore predefinito configurato) oppure mostra un riepilogo locale dei costi |
  </Accordion>

  <Accordion title="Skills, liste di elementi consentiti e approvazioni">
    | Comando | Descrizione |
    | --- | --- |
    | `/skill <name> [input]` | Esegue una skill in base al nome |
    | `/learn [request]` | Prepara una skill revisionabile dalla conversazione corrente o dalle fonti indicate tramite [Skill Workshop](/it/tools/skill-workshop) |
    | `/allowlist [list\|add\|remove] ...` | Gestisce le voci della lista di elementi consentiti. Solo testo |
    | `/approve <id> <decision>` | Risolve le richieste di approvazione per l'esecuzione o per i plugin |
    | `/btw <question>` | Pone una domanda secondaria senza modificare il contesto della sessione. Alias: `/side`. Consulta [BTW](/it/tools/btw) |
  </Accordion>

  <Accordion title="Subagenti e ACP">
    | Comando | Descrizione |
    | --- | --- |
    | `/subagents list\|log\|info` | Ispeziona le esecuzioni dei subagenti per la sessione corrente |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Gestisce le sessioni ACP e le opzioni di runtime. I controlli di runtime richiedono l'identità del proprietario esterno o dell'amministratore interno del Gateway |
    | `/focus <target>` | Associa il thread Discord o l'argomento Telegram corrente a una destinazione di sessione |
    | `/unfocus` | Rimuove l'associazione del thread corrente |
    | `/agents` | Elenca gli agenti associati al thread per la sessione corrente |
  </Accordion>

  <Accordion title="Scritture e amministrazione riservate al proprietario">
    | Comando | Requisito | Descrizione |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Legge o scrive `openclaw.json`. Riservato al proprietario |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Legge o scrive la configurazione dei server MCP gestiti da OpenClaw. Riservato al proprietario |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Ispeziona o modifica lo stato dei plugin. Le scritture sono riservate al proprietario. Alias: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Sostituzioni della configurazione valide solo durante il runtime. Riservato al proprietario |
    | `/restart` | `commands.restart: true` (predefinito) | Riavvia OpenClaw |
    | `/send on\|off\|inherit` | proprietario | Imposta i criteri di invio |
  </Accordion>

  <Accordion title="Voce, TTS e controllo del canale">
    | Comando | Descrizione |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Controlla la sintesi vocale. Consulta [TTS](/it/tools/tts) |
    | `/activation mention\|always` | Imposta la modalità di attivazione del gruppo |
    | `/bash <command>` | Esegue un comando della shell host. Alias: `! <command>`. Richiede `commands.bash: true` |
    | `!poll [sessionId]` | Controlla un processo bash in background |
    | `!stop [sessionId]` | Arresta un processo bash in background |
  </Accordion>
</AccordionGroup>

### Comandi di aggancio

I comandi di aggancio trasferiscono il percorso di risposta della sessione attiva a un altro canale collegato.
Consulta [Aggancio dei canali](/it/concepts/channel-docking) per la configurazione e la risoluzione dei problemi.

Generati dai plugin dei canali che supportano i comandi nativi:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

I comandi di aggancio richiedono `session.identityLinks`. Il mittente di origine e il peer di destinazione
devono appartenere allo stesso gruppo di identità.

### Comandi dei plugin inclusi

| Comando                                                 | Descrizione                                                                                                                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | Attiva o disattiva il dreaming della memoria (proprietario o amministratore del Gateway). Consulta [Dreaming](/it/concepts/dreaming)                                                                                                            |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | Gestisce l'associazione dei dispositivi. Consulta [Associazione](/it/channels/pairing)                                                                                                                                        |
| `/phone status\|arm ...\|disarm`                        | Abilita temporaneamente i comandi ad alto rischio del nodo (fotocamera/schermo/computer/scritture). Consulta [Uso del computer](/it/nodes/computer-use)                                                                               |
| `/voice status\|list\|set <voiceId>`                    | Gestisce la configurazione della voce di Talk. Nome nativo in Discord: `/talkvoice`                                                                                                                                    |
| `/card ...`                                             | Invia i modelli predefiniti di schede avanzate LINE. Consulta [LINE](/it/channels/line)                                                                                                                                        |
| `/codex <action> ...`                                   | Associa, dirige e ispeziona l'infrastruttura del server applicativo Codex (stato, thread, ripresa, modello, modalità rapida, autorizzazioni, compattazione, revisione, mcp, skill e altro). Consulta [Infrastruttura Codex](/it/plugins/codex-harness) |

Solo QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Comandi delle Skills

Le skill richiamabili dall'utente vengono esposte come comandi slash:

- `/skill <name> [input]` funziona sempre come punto di ingresso generico.
- Le Skills possono registrarsi come comandi diretti (ad esempio `/prose` per OpenProse).
- La registrazione dei comandi nativi delle skill è controllata da `commands.nativeSkills` e
  `channels.<provider>.commands.nativeSkills`.
- I nomi vengono normalizzati in `a-z0-9_` (massimo 32 caratteri); in caso di conflitto vengono aggiunti suffissi numerici.

<AccordionGroup>
  <Accordion title="Instradamento dei comandi delle Skills">
    Per impostazione predefinita, i comandi delle skill vengono inoltrati al modello come una richiesta normale.

    Le Skills possono dichiarare `command-dispatch: tool` per instradare direttamente a uno strumento
    (in modo deterministico, senza coinvolgere il modello). Esempio: `/prose` (plugin OpenProse)
    — consulta [OpenProse](/it/prose).

  </Accordion>
  <Accordion title="Argomenti dei comandi nativi">
    Discord usa il completamento automatico per le opzioni dinamiche e i menu a pulsanti quando vengono omessi
    gli argomenti obbligatori. Telegram e Slack mostrano un menu a pulsanti per i comandi con
    opzioni. Le opzioni dinamiche vengono risolte rispetto al modello della sessione di destinazione, quindi le opzioni
    specifiche del modello, come i livelli di `/think`, rispettano la sostituzione `/model` della sessione.
  </Accordion>
</AccordionGroup>

## `/tools`: cosa può usare ora l'agente

`/tools` risponde a una domanda sul runtime: **cosa può usare questo agente in questo momento in questa
conversazione** — non un catalogo statico della configurazione.

```text
/tools         # vista compatta
/tools verbose # con brevi descrizioni
```

I risultati sono specifici della sessione. Cambiare agente, canale, thread, autorizzazione
del mittente o modello può modificare l'output. Per modificare profili e sostituzioni,
usa il pannello Strumenti dell'interfaccia di controllo o le superfici di configurazione.

## `/model`: selezione del modello

```text
/model             # mostra il selettore del modello
/model list        # equivalente
/model 3           # seleziona in base al numero nel selettore
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # cancella la selezione del modello della sessione
/model status      # vista dettagliata con endpoint e modalità API
```

In Discord, `/model` e `/models` aprono un selettore interattivo con menu a discesa per provider e
modello. Il selettore rispetta `agents.defaults.models`, incluse le
voci `provider/*`.

## `/config`: scritture nella configurazione su disco

<Note>
  Riservato al proprietario. Disabilitato per impostazione predefinita — abilitalo con `commands.config: true`.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

La configurazione viene convalidata prima della scrittura. Le modifiche non valide vengono rifiutate. Gli aggiornamenti di `/config`
persistono tra i riavvii.

## `/mcp`: configurazione del server MCP

<Note>
  Riservato al proprietario. Disabilitato per impostazione predefinita — abilitalo con `commands.mcp: true`.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` memorizza la configurazione nella configurazione di OpenClaw, non nelle impostazioni di progetto dell'agente incorporato.
`/mcp show` oscura i campi contenenti credenziali, i valori riconosciuti dei flag delle credenziali
e gli argomenti noti che hanno la forma di segreti. Quando viene eseguito da un gruppo, la
configurazione viene inviata privatamente al proprietario; se non è disponibile un percorso privato verso il proprietario,
il comando interrompe l'esecuzione in modo sicuro e chiede al proprietario di riprovare da una chat
diretta.

## `/debug`: sostituzioni valide solo durante il runtime

<Note>
  Riservato al proprietario. Disabilitato per impostazione predefinita — abilitalo con `commands.debug: true`.
  Le sostituzioni si applicano immediatamente alle nuove letture della configurazione, ma **non** vengono scritte su disco.
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
  Le scritture sono riservate al proprietario. Disabilitato per impostazione predefinita — abilitalo con `commands.plugins: true`.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` aggiorna la configurazione del plugin e ricarica a caldo il runtime dei plugin del Gateway
per i nuovi turni dell'agente. `/plugins install` riavvia automaticamente i
Gateway gestiti perché i moduli sorgente del plugin sono cambiati.

## `/trace`: output di tracciamento dei plugin

```text
/trace          # mostra lo stato di tracciamento corrente
/trace on
/trace off
```

`/trace` mostra le righe di tracciamento/debug dei plugin specifiche della sessione senza la modalità dettagliata
completa. Non sostituisce `/debug` (sostituzioni di runtime) né `/verbose` (normale
output degli strumenti).

## `/btw`: domande secondarie

`/btw` è una domanda secondaria rapida sul contesto della sessione corrente. Alias: `/side`.

```text
/btw cosa stiamo facendo in questo momento?
/side cosa è cambiato mentre l'esecuzione principale proseguiva?
```

A differenza di un messaggio normale:

- Usa la sessione corrente come contesto di sfondo.
- Nelle sessioni dell'infrastruttura Codex, viene eseguita come thread secondario Codex temporaneo.
- **Non** modifica il contesto futuro della sessione.
- Non viene scritta nella cronologia della trascrizione.

Consulta [Domande secondarie BTW](/it/tools/btw) per il comportamento completo.

## Note sulle superfici

<AccordionGroup>
  <Accordion title="Ambito della sessione per superficie">
    - **Comandi testuali:** vengono eseguiti nella normale sessione di chat (i messaggi diretti condividono `main`, i gruppi dispongono di una propria sessione).
    - **Comandi nativi di Discord:** `agent:<agentId>:discord:slash:<userId>`
    - **Comandi nativi di Slack:** `agent:<agentId>:slack:slash:<userId>` (prefisso configurabile tramite `channels.slack.slashCommand.sessionPrefix`)
    - **Comandi nativi di Telegram:** `telegram:slash:<userId>` (hanno come destinazione la sessione di chat tramite `CommandTargetSessionKey`)
    - **`/login codex`** invia i codici di associazione del dispositivo solo tramite chat privata o percorsi di risposta dell'interfaccia web. Le invocazioni da gruppi/argomenti Telegram chiedono invece al proprietario di inviare un messaggio diretto al bot.
    - **`/stop`** ha come destinazione la sessione di chat attiva per interrompere l'esecuzione corrente.

  </Accordion>
  <Accordion title="Specificità di Slack">
    `channels.slack.slashCommand` supporta un singolo comando in stile `/openclaw`.
    Con `commands.native: true`, crea un comando slash Slack per ogni comando
    integrato. Registra `/agentstatus` (non `/status`) perché Slack riserva
    `/status`. Il comando testuale `/status` continua a funzionare nei messaggi Slack.
  </Accordion>
  <Accordion title="Percorso rapido e scorciatoie in linea">
    - I messaggi contenenti solo comandi provenienti da mittenti inclusi nell'elenco consentito vengono gestiti immediatamente (ignorando coda e modello).
    - Le scorciatoie in linea (`/help`, `/commands`, `/status`, `/whoami`) funzionano anche incorporate nei messaggi normali e vengono rimosse prima che il modello elabori il testo rimanente.
    - I messaggi non autorizzati contenenti solo comandi vengono ignorati silenziosamente; i token `/...` in linea vengono trattati come testo normale.

  </Accordion>
  <Accordion title="Note sugli argomenti">
    - I comandi accettano un `:` facoltativo tra il comando e gli argomenti (`/think: high`, `/send: on`).
    - `/new <model>` accetta un alias del modello, `provider/model` o il nome di un provider (corrispondenza approssimativa); se non viene trovata alcuna corrispondenza, il testo viene trattato come corpo del messaggio.
    - `/allowlist add|remove` richiede `commands.config: true` e rispetta `configWrites` del canale.

  </Accordion>
</AccordionGroup>

## Utilizzo e stato del provider

- **Utilizzo/quota del provider** (ad es. "Claude 80% rimanente") viene visualizzato in `/status` per il provider del modello corrente quando il monitoraggio dell'utilizzo è abilitato.
- **Righe relative a token/cache** in `/status` possono ripiegare sull'ultima voce di utilizzo della trascrizione quando l'istantanea della sessione attiva contiene pochi dati.
- **Esecuzione e runtime:** `/status` riporta `Execution` per il percorso effettivo della sandbox e `Runtime` per indicare chi esegue la sessione: `OpenClaw Default`, `OpenAI Codex`, un backend CLI o un backend ACP.
- **Token/costo per risposta:** controllati da `/usage off|tokens|full`.
- `/model status` riguarda modelli/autenticazione/endpoint, non l'utilizzo.

## Correlati

<CardGroup cols={2}>
  <Card title="Skills" href="/it/tools/skills" icon="puzzle-piece">
    Come vengono registrati e sottoposti a restrizioni i comandi slash delle Skills.
  </Card>
  <Card title="Creazione di Skills" href="/it/tools/creating-skills" icon="hammer">
    Crea una Skill che registri il proprio comando slash.
  </Card>
  <Card title="BTW" href="/it/tools/btw" icon="comments">
    Domande secondarie senza modificare il contesto della sessione.
  </Card>
  <Card title="Orientamento" href="/it/tools/steer" icon="compass">
    Guida l'agente durante l'esecuzione con `/steer`.
  </Card>
</CardGroup>
