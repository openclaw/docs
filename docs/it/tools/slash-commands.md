---
read_when:
    - Uso o configurazione dei comandi chat
    - Debug del routing dei comandi o delle autorizzazioni
    - Comprendere come vengono registrati i comandi delle Skills
sidebarTitle: Slash commands
summary: Tutti i comandi slash, le direttive e le scorciatoie inline disponibili — configurazione, routing e comportamento per superficie.
title: Comandi slash
x-i18n:
    generated_at: "2026-06-30T14:06:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ada44bbb5623e53cc09d25f11655430fced4af2223051b88b60b2d92e6c707a3
    source_path: tools/slash-commands.md
    workflow: 16
---

Il Gateway gestisce i comandi inviati come messaggi autonomi che iniziano con `/`.
I comandi bash solo host usano `! <cmd>` (con `/bash <cmd>` come alias).

Quando una conversazione è associata a una sessione ACP, il testo normale viene instradato
all'harness ACP. I comandi di gestione del Gateway restano locali: `/acp ...` raggiunge sempre
il gestore comandi di OpenClaw, e `/status` più `/unfocus` restano locali ogni volta che
la gestione dei comandi è abilitata per la superficie.

## Tre tipi di comandi

<CardGroup cols={3}>
  <Card title="Comandi" icon="terminal">
    Messaggi autonomi `/...` gestiti dal Gateway. Devono essere inviati come
    unico contenuto del messaggio.
  </Card>
  <Card title="Direttive" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — rimosse dal messaggio prima che il modello
    lo veda. Rendono persistenti le impostazioni della sessione quando inviate da sole; agiscono come suggerimenti inline
    quando inviate con altro testo.
  </Card>
  <Card title="Scorciatoie inline" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — vengono eseguite immediatamente e sono
    rimosse prima che il modello veda il testo rimanente. Solo mittenti autorizzati.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Dettagli sul comportamento delle direttive">
    - Le direttive vengono rimosse dal messaggio prima che il modello lo veda.
    - Nei messaggi **solo direttive** (il messaggio contiene solo direttive), diventano
      persistenti nella sessione e rispondono con una conferma.
    - Nei messaggi di **chat normale** con altro testo, agiscono come suggerimenti inline e
      **non** rendono persistenti le impostazioni della sessione.
    - Le direttive si applicano solo ai **mittenti autorizzati**. Se `commands.allowFrom`
      è impostato, è l'unica allowlist usata; altrimenti l'autorizzazione proviene dalle
      allowlist/associazioni del canale più `commands.useAccessGroups`. I mittenti non autorizzati
      vedono le direttive trattate come testo semplice.
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
  Registra i comandi nativi. Auto: attivo per Discord/Telegram; disattivo per Slack;
  ignorato per i provider senza supporto nativo. Override per canale con
  `channels.<provider>.commands.native`. Su Discord, `false` salta la registrazione degli
  slash command; i comandi registrati in precedenza possono restare visibili finché non vengono rimossi.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registra nativamente i comandi skill quando supportato. Auto: attivo per
  Discord/Telegram; disattivo per Slack. Override con
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Abilita `! <cmd>` per eseguire comandi shell sull'host (alias `/bash <cmd>`). Richiede
  le allowlist `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Per quanto tempo bash attende prima di passare alla modalità in background (`0` passa in background
  immediatamente).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Abilita `/config` (legge/scrive `openclaw.json`). Solo owner.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Abilita `/mcp` (legge/scrive la configurazione MCP gestita da OpenClaw sotto `mcp.servers`). Solo owner.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Abilita `/plugins` (scoperta/stato dei plugin più installazione e abilitazione/disabilitazione). Solo owner per le scritture.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Abilita `/debug` (override di configurazione solo runtime). Solo owner.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Abilita `/restart` e le azioni degli strumenti di riavvio del gateway.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Allowlist esplicita degli owner per le superfici di comando solo owner. Separata da
  `commands.allowFrom` e dall'accesso tramite associazione DM.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Per canale: richiede l'identità owner per i comandi solo owner. Quando è `true`,
  il mittente deve corrispondere a `commands.ownerAllowFrom` o possedere lo scope interno `operator.admin`.
  Una voce jolly `allowFrom` **non** è sufficiente.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Controlla come gli ID owner appaiono nel prompt di sistema.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  Segreto HMAC usato quando `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Allowlist per provider per l'autorizzazione dei comandi. Quando configurata, è
  l'**unica** fonte di autorizzazione per comandi e direttive. Usa `"*"` per un
  default globale; le chiavi specifiche del provider lo sovrascrivono.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Applica allowlist/policy per i comandi quando `commands.allowFrom` non è impostato.
</ParamField>

## Elenco dei comandi

I comandi provengono da tre fonti:

- **Builtin core:** `src/auto-reply/commands-registry.shared.ts`
- **Comandi dock generati:** `src/auto-reply/commands-registry.data.ts`
- **Comandi Plugin:** chiamate plugin `registerCommand()`

La disponibilità dipende dai flag di configurazione, dalla superficie del canale e dai
plugin installati/abilitati.

### Comandi core

<AccordionGroup>
  <Accordion title="Sessioni ed esecuzioni">
    | Comando | Descrizione |
    | --- | --- |
    | `/new [model]` | Archivia la sessione corrente e ne avvia una nuova |
    | `/reset [soft [message]]` | Reimposta la sessione corrente sul posto. `soft` mantiene la trascrizione, scarta gli ID sessione backend CLI riutilizzati e riesegue l'avvio |
    | `/name <title>` | Assegna un nome o rinomina la sessione corrente. Ometti il titolo per vedere il nome corrente e un suggerimento |
    | `/compact [instructions]` | Compatta il contesto della sessione. Vedi [Compaction](/it/concepts/compaction) |
    | `/stop` | Interrompe l'esecuzione corrente |
    | `/session idle <duration\|off>` | Gestisce la scadenza per inattività del binding del thread |
    | `/session max-age <duration\|off>` | Gestisce la scadenza per età massima del binding del thread |
    | `/export-session [path]` | Esporta la sessione corrente in HTML. Alias: `/export` |
    | `/export-trajectory [path]` | Esporta un bundle di traiettoria JSONL per la sessione corrente. Alias: `/trajectory` |

    <Note>
      Control UI intercetta `/new` digitato per creare e passare a una nuova
      sessione dashboard, tranne quando `session.dmScope: "main"` è configurato
      e il parent corrente è la sessione principale dell'agente — in quel caso `/new`
      reimposta la sessione principale sul posto. `/reset` digitato esegue comunque il
      reset sul posto del Gateway. Usa `/model default` quando vuoi cancellare una
      selezione di modello di sessione fissata.
    </Note>

  </Accordion>

  <Accordion title="Controlli di modello ed esecuzione">
    | Comando | Descrizione |
    | --- | --- |
    | `/think <level\|default>` | Imposta il livello di pensiero o cancella l'override della sessione. Alias: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Attiva/disattiva l'output dettagliato. Alias: `/v` |
    | `/trace on\|off` | Attiva/disattiva l'output di trace dei plugin per la sessione corrente |
    | `/fast [status\|auto\|on\|off\|default]` | Mostra, imposta o cancella la modalità veloce |
    | `/reasoning [on\|off\|stream]` | Attiva/disattiva la visibilità del ragionamento. Alias: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Attiva/disattiva la modalità elevata. Alias: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Mostra o imposta i default di exec |
    | `/model [name\|#\|status]` | Mostra o imposta il modello |
    | `/models [provider] [page] [limit=<n>\|all]` | Elenca provider o modelli configurati/disponibili tramite autenticazione |
    | `/queue <mode>` | Gestisce il comportamento della coda delle esecuzioni attive. Vedi [Coda](/it/concepts/queue) e [Controllo della coda](/it/concepts/queue-steering) |
    | `/steer <message>` | Inietta indicazioni nell'esecuzione attiva. Alias: `/tell`. Vedi [Guida](/it/tools/steer) |

    <AccordionGroup>
      <Accordion title="sicurezza di verbose / trace / fast / reasoning">
        - `/verbose` è per il debug — tienilo **disattivato** nell'uso normale.
        - `/trace` rivela solo righe di trace/debug possedute dai plugin; il normale output dettagliato resta disattivato.
        - `/fast auto|on|off` rende persistente un override di sessione; usa l'opzione `inherit` nell'interfaccia Sessions per cancellarlo.
        - `/fast` è specifico del provider: OpenAI/Codex lo mappano a `service_tier=priority`; le richieste Anthropic dirette lo mappano a `service_tier=auto` o `standard_only`.
        - `/reasoning`, `/verbose` e `/trace` sono rischiosi nelle impostazioni di gruppo — possono rivelare ragionamento interno o diagnostica dei plugin. Tienili disattivati nelle chat di gruppo.

      </Accordion>
      <Accordion title="Dettagli sul cambio di modello">
        - `/model` rende persistente immediatamente il nuovo modello nella sessione.
        - Se l'agente è inattivo, l'esecuzione successiva lo usa subito.
        - Se un'esecuzione è attiva, il cambio viene contrassegnato come in sospeso e applicato al successivo punto di retry pulito.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Scoperta e stato">
    | Comando | Descrizione |
    | --- | --- |
    | `/help` | Mostra il breve riepilogo della guida |
    | `/commands` | Mostra il catalogo comandi generato |
    | `/tools [compact\|verbose]` | Mostra cosa può usare l'agente corrente in questo momento |
    | `/status` | Mostra stato di esecuzione/runtime, uptime di Gateway e sistema, salute dei plugin, più utilizzo/quota del provider |
    | `/status plugins` | Mostra la salute dettagliata dei plugin: errori di caricamento, quarantene, errori dei canali, problemi di dipendenze, avvisi di compatibilità |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | Gestisce il [goal](/it/tools/goal) durevole della sessione corrente |
    | `/diagnostics [note]` | Flusso di report di supporto solo owner. Chiede ogni volta l'approvazione exec |
    | `/crestodian <request>` | Esegue l'helper di configurazione e riparazione Crestodian da un DM owner |
    | `/tasks` | Elenca le attività in background attive/recenti per la sessione corrente |
    | `/context [list\|detail\|map\|json]` | Spiega come viene assemblato il contesto |
    | `/whoami` | Mostra il tuo ID mittente. Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Controlla il footer di utilizzo per risposta (`reset`/`inherit`/`clear`/`default` cancella l'override della sessione per ereditare di nuovo il default configurato) o stampa un riepilogo locale dei costi |
  </Accordion>

  <Accordion title="Skills, allowlist, approvazioni">
    | Comando | Descrizione |
    | --- | --- |
    | `/skill <name> [input]` | Esegue una skill per nome |
    | `/allowlist [list\|add\|remove] ...` | Gestisce le voci dell'allowlist. Solo testo |
    | `/approve <id> <decision>` | Risolve prompt di approvazione exec o plugin |
    | `/btw <question>` | Pone una domanda laterale senza modificare il contesto della sessione. Alias: `/side`. Vedi [BTW](/it/tools/btw) |
  </Accordion>

  <Accordion title="Sotto-agenti e ACP">
    | Comando | Descrizione |
    | --- | --- |
    | `/subagents list\|log\|info` | Ispeziona le esecuzioni dei sotto-agenti per la sessione corrente |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Gestisce le sessioni ACP e le opzioni di runtime. I controlli di runtime richiedono un proprietario esterno o un'identità amministratore Gateway interna |
    | `/focus <target>` | Associa il thread Discord corrente o l'argomento Telegram a un target di sessione |
    | `/unfocus` | Rimuove l'associazione del thread corrente |
    | `/agents` | Elenca gli agenti associati al thread per la sessione corrente |
  </Accordion>

  <Accordion title="Scritture solo proprietario e amministrazione">
    | Comando | Richiede | Descrizione |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Legge o scrive `openclaw.json`. Solo proprietario |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Legge o scrive la configurazione del server MCP gestita da OpenClaw. Solo proprietario |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Ispeziona o modifica lo stato dei Plugin. Solo proprietario per le scritture. Alias: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Override della configurazione solo runtime. Solo proprietario |
    | `/restart` | `commands.restart: true` (predefinito) | Riavvia OpenClaw |
    | `/send on\|off\|inherit` | proprietario | Imposta la policy di invio |
  </Accordion>

  <Accordion title="Voce, TTS, controllo del canale">
    | Comando | Descrizione |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Controlla TTS. Vedi [TTS](/it/tools/tts) |
    | `/activation mention\|always` | Imposta la modalità di attivazione del gruppo |
    | `/bash <command>` | Esegue un comando shell sull'host. Alias: `! <command>`. Richiede `commands.bash: true` |
    | `!poll [sessionId]` | Controlla un job bash in background |
    | `!stop [sessionId]` | Interrompe un job bash in background |
  </Accordion>
</AccordionGroup>

### Comandi Dock

I comandi Dock spostano la rotta di risposta della sessione attiva verso un altro canale collegato.
Vedi [Channel docking](/it/concepts/channel-docking) per configurazione e risoluzione dei problemi.

Generati dai Plugin di canale con supporto per comandi nativi:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

I comandi Dock richiedono `session.identityLinks`. Il mittente di origine e il peer di destinazione
devono essere nello stesso gruppo di identità.

### Comandi dei Plugin inclusi

| Comando                                                                                      | Descrizione                                                                         |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | Attiva o disattiva il dreaming della memoria (proprietario o amministratore Gateway). Vedi [Dreaming](/it/concepts/dreaming) |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | Gestisce l'associazione del dispositivo. Vedi [Pairing](/it/channels/pairing)                             |
| `/phone status\|arm ...\|disarm`                                                             | Arma temporaneamente comandi del nodo telefonico ad alto rischio                                       |
| `/voice status\|list\|set <voiceId>`                                                         | Gestisce la configurazione della voce Talk. Nome nativo Discord: `/talkvoice`                         |
| `/card ...`                                                                                  | Invia preset di rich card LINE. Vedi [LINE](/it/channels/line)                             |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | Controlla l'harness app-server Codex. Vedi [Codex harness](/it/plugins/codex-harness)   |

Solo QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Comandi Skill

Le Skills invocabili dall'utente sono esposte come comandi slash:

- `/skill <name> [input]` funziona sempre come punto di ingresso generico.
- Le Skills possono registrarsi come comandi diretti (ad esempio `/prose` per OpenProse).
- La registrazione nativa dei comandi Skill è controllata da `commands.nativeSkills` e
  `channels.<provider>.commands.nativeSkills`.
- I nomi vengono normalizzati in `a-z0-9_` (massimo 32 caratteri); le collisioni ricevono suffissi numerici.

<AccordionGroup>
  <Accordion title="Dispatch dei comandi Skill">
    Per impostazione predefinita, i comandi Skill vengono instradati al modello come una normale richiesta.

    Le Skills possono dichiarare `command-dispatch: tool` per instradare direttamente a uno strumento
    (deterministico, senza coinvolgimento del modello). Esempio: `/prose` (Plugin OpenProse)
    — vedi [OpenProse](/it/prose).

  </Accordion>
  <Accordion title="Argomenti dei comandi nativi">
    Discord usa il completamento automatico per opzioni dinamiche e menu con pulsanti quando gli
    argomenti richiesti sono omessi. Telegram e Slack mostrano un menu con pulsanti per i comandi con
    scelte. Le scelte dinamiche vengono risolte rispetto al modello della sessione target, quindi le opzioni
    specifiche del modello come i livelli di `/think` seguono l'override `/model` della sessione.
  </Accordion>
</AccordionGroup>

## `/tools` — cosa può usare ora l'agente

`/tools` risponde a una domanda di runtime: **cosa può usare questo agente in questo momento in questa
conversazione** — non un catalogo statico della configurazione.

```text
/tools         # compact view
/tools verbose # with short descriptions
```

I risultati sono nell'ambito della sessione. Cambiare agente, canale, thread, autorizzazione del mittente
o modello può cambiare l'output. Per modificare profili e override, usa il pannello Tools della Control UI
o le superfici di configurazione.

## `/model` — selezione del modello

```text
/model             # show model picker
/model list        # same
/model 3           # select by number from picker
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # clear the session model selection
/model status      # detailed view with endpoint and API mode
```

Su Discord, `/model` e `/models` aprono un selettore interattivo con menu a discesa
per provider e modello. Il selettore rispetta `agents.defaults.models`, incluse
le voci `provider/*`.

## `/config` — scritture della configurazione su disco

<Note>
  Solo proprietario. Disabilitato per impostazione predefinita — abilita con `commands.config: true`.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

La configurazione viene validata prima della scrittura. Le modifiche non valide vengono rifiutate. Gli aggiornamenti di `/config`
persistono tra i riavvii.

## `/mcp` — configurazione server MCP

<Note>
  Solo proprietario. Disabilitato per impostazione predefinita — abilita con `commands.mcp: true`.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` archivia la configurazione nella configurazione OpenClaw, non nelle impostazioni di progetto dell'agente incorporato.

## `/debug` — override solo runtime

<Note>
  Solo proprietario. Disabilitato per impostazione predefinita — abilita con `commands.debug: true`.
  Gli override si applicano immediatamente alle nuove letture della configurazione ma **non** scrivono su disco.
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins` — gestione Plugin

<Note>
  Solo proprietario per le scritture. Disabilitato per impostazione predefinita — abilita con `commands.plugins: true`.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` aggiorna la configurazione dei Plugin e ricarica a caldo il runtime dei Plugin del Gateway
per i nuovi turni dell'agente. `/plugins install` riavvia automaticamente i Gateway gestiti
perché i moduli sorgente dei Plugin sono cambiati.

## `/trace` — output di trace dei Plugin

```text
/trace          # show current trace state
/trace on
/trace off
```

`/trace` mostra le righe di trace/debug dei Plugin nell'ambito della sessione senza la modalità
verbose completa. Non sostituisce `/debug` (override di runtime) o `/verbose` (normale
output degli strumenti).

## `/btw` — domande laterali

`/btw` è una rapida domanda laterale sul contesto della sessione corrente. Alias: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

A differenza di un messaggio normale:

- Usa la sessione corrente come contesto di sfondo.
- Nelle sessioni dell'harness Codex, viene eseguito come thread laterale Codex effimero.
- **Non** modifica il contesto futuro della sessione.
- Non viene scritto nella cronologia della trascrizione.

Vedi [BTW side questions](/it/tools/btw) per il comportamento completo.

## Note sulle superfici

<AccordionGroup>
  <Accordion title="Ambito della sessione per superficie">
    - **Comandi testuali:** vengono eseguiti nella normale sessione chat (i DM condividono `main`, i gruppi hanno la propria sessione).
    - **Comandi nativi Discord:** `agent:<agentId>:discord:slash:<userId>`
    - **Comandi nativi Slack:** `agent:<agentId>:slack:slash:<userId>` (prefisso configurabile tramite `channels.slack.slashCommand.sessionPrefix`)
    - **Comandi nativi Telegram:** `telegram:slash:<userId>` (punta alla sessione chat tramite `CommandTargetSessionKey`)
    - **`/stop`** punta alla sessione chat attiva per interrompere l'esecuzione corrente.

  </Accordion>
  <Accordion title="Dettagli specifici di Slack">
    `channels.slack.slashCommand` supporta un singolo comando in stile `/openclaw`.
    Con `commands.native: true`, crea un comando slash Slack per ogni comando integrato.
    Registra `/agentstatus` (non `/status`) perché Slack riserva
    `/status`. Il testo `/status` continua a funzionare nei messaggi Slack.
  </Accordion>
  <Accordion title="Percorso rapido e scorciatoie inline">
    - I messaggi solo comando provenienti da mittenti allowlist vengono gestiti immediatamente (bypass di coda + modello).
    - Le scorciatoie inline (`/help`, `/commands`, `/status`, `/whoami`) funzionano anche incorporate nei messaggi normali e vengono rimosse prima che il modello veda il testo restante.
    - I messaggi solo comando non autorizzati vengono ignorati silenziosamente; i token inline `/...` vengono trattati come testo semplice.

  </Accordion>
  <Accordion title="Note sugli argomenti">
    - I comandi accettano un `:` opzionale tra comando e argomenti (`/think: high`, `/send: on`).
    - `/new <model>` accetta un alias di modello, `provider/model`, o un nome provider (corrispondenza fuzzy); se non trova corrispondenze, il testo viene trattato come corpo del messaggio.
    - `/allowlist add|remove` richiede `commands.config: true` e rispetta `configWrites` del canale.

  </Accordion>
</AccordionGroup>

## Uso e stato del provider

- **Uso/quota del provider** (ad esempio, "Claude 80% left") viene mostrato in `/status` per il provider del modello corrente quando il tracciamento dell'uso è abilitato.
- **Righe token/cache** in `/status` possono ricadere sull'ultima voce di uso della trascrizione quando lo snapshot live della sessione è scarso.
- **Esecuzione vs runtime:** `/status` riporta `Execution` per il percorso sandbox effettivo e `Runtime` per chi sta eseguendo la sessione: `OpenClaw Default`, `OpenAI Codex`, un backend CLI o un backend ACP.
- **Token/costo per risposta:** controllato da `/usage off|tokens|full`.
- `/model status` riguarda modelli/autenticazione/endpoint, non l'uso.

## Correlati

<CardGroup cols={2}>
  <Card title="Skills" href="/it/tools/skills" icon="puzzle-piece">
    Come vengono registrati e protetti i comandi slash Skill.
  </Card>
  <Card title="Creazione di Skills" href="/it/tools/creating-skills" icon="hammer">
    Crea una Skill che registra il proprio comando slash.
  </Card>
  <Card title="BTW" href="/it/tools/btw" icon="comments">
    Domande laterali senza modificare il contesto della sessione.
  </Card>
  <Card title="Steer" href="/it/tools/steer" icon="compass">
    Guida l'agente durante l'esecuzione con `/steer`.
  </Card>
</CardGroup>
