---
read_when:
    - Uso o configurazione dei comandi chat
    - Debug del routing dei comandi o delle autorizzazioni
    - Comprendere come vengono registrati i comandi Skills
sidebarTitle: Slash commands
summary: Tutti i comandi slash, le direttive e le scorciatoie inline disponibili — configurazione, instradamento e comportamento per superficie.
title: Comandi slash
x-i18n:
    generated_at: "2026-06-27T18:23:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5f53a5209d1c99c593d646b4ecc12e7074f72766cf3d1278c4d13511369d29bc
    source_path: tools/slash-commands.md
    workflow: 16
---

Il Gateway gestisce i comandi inviati come messaggi autonomi che iniziano con `/`.
I comandi bash solo host usano `! <cmd>` (con `/bash <cmd>` come alias).

Quando una conversazione è associata a una sessione ACP, il testo normale viene instradato
all'harness ACP. I comandi di gestione del Gateway restano locali: `/acp ...` raggiunge sempre
il gestore dei comandi di OpenClaw, e `/status` più `/unfocus` restano locali ogni volta che
la gestione dei comandi è abilitata per la superficie.

## Tre tipi di comandi

<CardGroup cols={3}>
  <Card title="Comandi" icon="terminal">
    Messaggi `/...` autonomi gestiti dal Gateway. Devono essere inviati come
    unico contenuto del messaggio.
  </Card>
  <Card title="Direttive" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — rimosse dal messaggio prima che il modello
    lo veda. Rendono persistenti le impostazioni della sessione quando vengono inviate da sole; agiscono come suggerimenti inline
    quando vengono inviate con altro testo.
  </Card>
  <Card title="Scorciatoie inline" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — vengono eseguite subito e sono
    rimosse prima che il modello veda il testo rimanente. Solo mittenti autorizzati.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Dettagli sul comportamento delle direttive">
    - Le direttive vengono rimosse dal messaggio prima che il modello lo veda.
    - Nei messaggi **solo direttive** (il messaggio contiene solo direttive), vengono
      salvate nella sessione e ricevono una risposta di conferma.
    - Nei messaggi di **chat normale** con altro testo, agiscono come suggerimenti inline e
      **non** rendono persistenti le impostazioni della sessione.
    - Le direttive si applicano solo ai **mittenti autorizzati**. Se `commands.allowFrom`
      è impostato, è l'unica allowlist usata; altrimenti l'autorizzazione deriva dalle
      allowlist/associazioni del canale più `commands.useAccessGroups`. I mittenti non autorizzati
      vedono le direttive trattate come testo normale.
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
  Abilita il parsing di `/...` nei messaggi di chat. Sulle superfici senza comandi nativi
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams), i comandi testuali
  funzionano anche quando è impostato su `false`.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registra i comandi nativi. Auto: attivo per Discord/Telegram; disattivo per Slack;
  ignorato per i provider senza supporto nativo. Esegui l'override per canale con
  `channels.<provider>.commands.native`. Su Discord, `false` salta la registrazione degli slash command;
  i comandi registrati in precedenza possono restare visibili finché non vengono rimossi.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registra nativamente i comandi Skills quando supportati. Auto: attivo per
  Discord/Telegram; disattivo per Slack. Esegui l'override con
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  Abilita `! <cmd>` per eseguire comandi shell dell'host (alias `/bash <cmd>`). Richiede
  le allowlist `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Per quanto tempo bash attende prima di passare alla modalità in background (`0` passa
  subito in background).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  Abilita `/config` (legge/scrive `openclaw.json`). Solo owner.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  Abilita `/mcp` (legge/scrive la configurazione MCP gestita da OpenClaw sotto `mcp.servers`). Solo owner.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  Abilita `/plugins` (rilevamento/stato dei plugin più installazione + abilitazione/disabilitazione). Solo owner per le scritture.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  Abilita `/debug` (override della configurazione solo runtime). Solo owner.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  Abilita `/restart` e le azioni strumento di riavvio del gateway.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  Allowlist esplicita degli owner per le superfici di comando solo owner. Separata da
  `commands.allowFrom` e dall'accesso tramite associazione DM.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Per canale: richiede l'identità owner per i comandi solo owner. Quando `true`,
  il mittente deve corrispondere a `commands.ownerAllowFrom` o possedere lo scope interno `operator.admin`.
  Una voce wildcard `allowFrom` **non** è sufficiente.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Controlla come gli id owner appaiono nel prompt di sistema.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  Segreto HMAC usato quando `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  Allowlist per provider per l'autorizzazione dei comandi. Quando configurata, è
  l'**unica** fonte di autorizzazione per comandi e direttive. Usa `"*"` per un
  valore predefinito globale; le chiavi specifiche del provider la sovrascrivono.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Applica allowlist/policy per i comandi quando `commands.allowFrom` non è impostato.
</ParamField>

## Elenco dei comandi

I comandi provengono da tre fonti:

- **Integrati core:** `src/auto-reply/commands-registry.shared.ts`
- **Comandi dock generati:** `src/auto-reply/commands-registry.data.ts`
- **Comandi Plugin:** chiamate `registerCommand()` dei plugin

La disponibilità dipende dai flag di configurazione, dalla superficie del canale e dai
plugin installati/abilitati.

### Comandi core

<AccordionGroup>
  <Accordion title="Sessioni ed esecuzioni">
    | Comando | Descrizione |
    | --- | --- |
    | `/new [model]` | Archivia la sessione corrente e ne avvia una nuova |
    | `/reset [soft [message]]` | Reimposta la sessione corrente sul posto. `soft` mantiene la trascrizione, elimina gli id di sessione del backend CLI riutilizzati e riesegue l'avvio |
    | `/name <title>` | Assegna un nome o rinomina la sessione corrente. Ometti il titolo per vedere il nome corrente e un suggerimento |
    | `/compact [instructions]` | Compatta il contesto della sessione. Vedi [Compaction](/it/concepts/compaction) |
    | `/stop` | Interrompe l'esecuzione corrente |
    | `/session idle <duration\|off>` | Gestisce la scadenza per inattività dell'associazione del thread |
    | `/session max-age <duration\|off>` | Gestisce la scadenza per età massima dell'associazione del thread |
    | `/export-session [path]` | Esporta la sessione corrente in HTML. Alias: `/export` |
    | `/export-trajectory [path]` | Esporta un bundle di traiettoria JSONL per la sessione corrente. Alias: `/trajectory` |

    <Note>
      Control UI intercetta `/new` digitato per creare e passare a una nuova
      sessione della dashboard, tranne quando è configurato `session.dmScope: "main"`
      e il genitore corrente è la sessione principale dell'agente — in quel caso `/new`
      reimposta la sessione principale sul posto. `/reset` digitato esegue comunque il reset
      sul posto del Gateway. Usa `/model default` quando vuoi cancellare una selezione
      del modello di sessione fissata.
    </Note>

  </Accordion>

  <Accordion title="Controlli di modello ed esecuzione">
    | Comando | Descrizione |
    | --- | --- |
    | `/think <level\|default>` | Imposta il livello di ragionamento o cancella l'override della sessione. Alias: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | Attiva o disattiva l'output dettagliato. Alias: `/v` |
    | `/trace on\|off` | Attiva o disattiva l'output di trace dei plugin per la sessione corrente |
    | `/fast [status\|auto\|on\|off\|default]` | Mostra, imposta o cancella la modalità fast |
    | `/reasoning [on\|off\|stream]` | Attiva o disattiva la visibilità del reasoning. Alias: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | Attiva o disattiva la modalità elevata. Alias: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | Mostra o imposta i valori predefiniti di exec |
    | `/model [name\|#\|status]` | Mostra o imposta il modello |
    | `/models [provider] [page] [limit=<n>\|all]` | Elenca provider o modelli configurati/disponibili tramite auth |
    | `/queue <mode>` | Gestisce il comportamento della coda delle esecuzioni attive. Vedi [Coda](/it/concepts/queue) e [indirizzamento della coda](/it/concepts/queue-steering) |
    | `/steer <message>` | Inietta indicazioni nell'esecuzione attiva. Alias: `/tell`. Vedi [Steer](/it/tools/steer) |

    <AccordionGroup>
      <Accordion title="sicurezza verbose / trace / fast / reasoning">
        - `/verbose` serve per il debug — tienilo **disattivato** nell'uso normale.
        - `/trace` rivela solo righe di trace/debug di proprietà dei plugin; il normale rumore verbose resta disattivato.
        - `/fast auto|on|off` salva un override della sessione; usa l'opzione `inherit` della UI Sessioni per cancellarlo.
        - `/fast` è specifico del provider: OpenAI/Codex lo mappa a `service_tier=priority`; le richieste Anthropic dirette lo mappano a `service_tier=auto` o `standard_only`.
        - `/reasoning`, `/verbose` e `/trace` sono rischiosi nelle impostazioni di gruppo — possono rivelare reasoning interno o diagnostica dei plugin. Tienili disattivati nelle chat di gruppo.

      </Accordion>
      <Accordion title="Dettagli sul cambio di modello">
        - `/model` salva subito il nuovo modello nella sessione.
        - Se l'agente è inattivo, l'esecuzione successiva lo usa immediatamente.
        - Se un'esecuzione è attiva, il cambio viene contrassegnato come in sospeso e applicato al prossimo punto di retry pulito.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Rilevamento e stato">
    | Comando | Descrizione |
    | --- | --- |
    | `/help` | Mostra il riepilogo breve dell'aiuto |
    | `/commands` | Mostra il catalogo dei comandi generato |
    | `/tools [compact\|verbose]` | Mostra cosa può usare l'agente corrente in questo momento |
    | `/status` | Mostra stato di esecuzione/runtime, uptime di Gateway e sistema, integrità dei plugin, più utilizzo/quota del provider |
    | `/status plugins` | Mostra l'integrità dettagliata dei plugin: errori di caricamento, quarantene, errori dei canali, problemi di dipendenze, avvisi di compatibilità |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | Gestisce il [goal](/it/tools/goal) durevole della sessione corrente |
    | `/diagnostics [note]` | Flusso di report di supporto solo owner. Chiede l'approvazione exec ogni volta |
    | `/crestodian <request>` | Esegue l'helper di configurazione e riparazione Crestodian da un DM owner |
    | `/tasks` | Elenca attività in background attive/recenti per la sessione corrente |
    | `/context [list\|detail\|map\|json]` | Spiega come viene assemblato il contesto |
    | `/whoami` | Mostra il tuo id mittente. Alias: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | Controlla il footer di utilizzo per risposta (`reset`/`inherit`/`clear`/`default` cancella l'override della sessione per ereditare di nuovo il valore predefinito configurato) o stampa un riepilogo dei costi locale |
  </Accordion>

  <Accordion title="Skills, allowlist, approvazioni">
    | Comando | Descrizione |
    | --- | --- |
    | `/skill <name> [input]` | Esegue una skill per nome |
    | `/allowlist [list\|add\|remove] ...` | Gestisce le voci allowlist. Solo testo |
    | `/approve <id> <decision>` | Risolve prompt di approvazione exec o plugin |
    | `/btw <question>` | Pone una domanda collaterale senza cambiare il contesto della sessione. Alias: `/side`. Vedi [BTW](/it/tools/btw) |
  </Accordion>

  <Accordion title="Subagenti e ACP">
    | Comando | Descrizione |
    | --- | --- |
    | `/subagents list\|log\|info` | Ispeziona le esecuzioni dei subagenti per la sessione corrente |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | Gestisce le sessioni ACP e le opzioni di runtime |
    | `/focus <target>` | Associa il thread Discord corrente o l'argomento Telegram a una destinazione di sessione |
    | `/unfocus` | Rimuove l'associazione del thread corrente |
    | `/agents` | Elenca gli agenti associati al thread per la sessione corrente |
  </Accordion>

  <Accordion title="Scritture solo proprietario e amministrazione">
    | Comando | Richiede | Descrizione |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | Legge o scrive `openclaw.json`. Solo proprietario |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | Legge o scrive la configurazione del server MCP gestita da OpenClaw. Solo proprietario |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Ispeziona o modifica lo stato dei plugin. Solo proprietario per le scritture. Alias: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | Override della configurazione solo runtime. Solo proprietario |
    | `/restart` | `commands.restart: true` (predefinito) | Riavvia OpenClaw |
    | `/send on\|off\|inherit` | proprietario | Imposta la policy di invio |
  </Accordion>

  <Accordion title="Voce, TTS, controllo del canale">
    | Comando | Descrizione |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | Controlla TTS. Vedi [TTS](/it/tools/tts) |
    | `/activation mention\|always` | Imposta la modalità di attivazione dei gruppi |
    | `/bash <command>` | Esegue un comando della shell host. Alias: `! <command>`. Richiede `commands.bash: true` |
    | `!poll [sessionId]` | Controlla un job bash in background |
    | `!stop [sessionId]` | Interrompe un job bash in background |
  </Accordion>
</AccordionGroup>

### Comandi dock

I comandi dock spostano il percorso di risposta della sessione attiva verso un altro canale collegato.
Vedi [Docking dei canali](/it/concepts/channel-docking) per configurazione e risoluzione dei problemi.

Generati dai plugin di canale con supporto per comandi nativi:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

I comandi dock richiedono `session.identityLinks`. Il mittente sorgente e il peer di destinazione
devono essere nello stesso gruppo di identità.

### Comandi dei plugin inclusi

| Comando                                                                                      | Descrizione                                                                       |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | Attiva o disattiva il dreaming della memoria. Vedi [Dreaming](/it/concepts/dreaming) |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | Gestisce l'associazione dei dispositivi. Vedi [Associazione](/it/channels/pairing)   |
| `/phone status\|arm ...\|disarm`                                                             | Abilita temporaneamente i comandi del nodo telefonico ad alto rischio             |
| `/voice status\|list\|set <voiceId>`                                                         | Gestisce la configurazione della voce Talk. Nome nativo Discord: `/talkvoice`     |
| `/card ...`                                                                                  | Invia preset di rich card LINE. Vedi [LINE](/it/channels/line)                       |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | Controlla l'harness app-server Codex. Vedi [Harness Codex](/it/plugins/codex-harness) |

Solo QQBot: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Comandi Skills

Le Skills invocabili dall'utente sono esposte come comandi slash:

- `/skill <name> [input]` funziona sempre come entrypoint generico.
- Le Skills possono registrarsi come comandi diretti (ad esempio `/prose` per OpenProse).
- La registrazione dei comandi Skills nativi è controllata da `commands.nativeSkills` e
  `channels.<provider>.commands.nativeSkills`.
- I nomi vengono normalizzati in `a-z0-9_` (massimo 32 caratteri); le collisioni ricevono suffissi numerici.

<AccordionGroup>
  <Accordion title="Dispatch dei comandi Skill">
    Per impostazione predefinita, i comandi Skills vengono instradati al modello come una richiesta normale.

    Le Skills possono dichiarare `command-dispatch: tool` per instradare direttamente a uno strumento
    (deterministico, senza coinvolgimento del modello). Esempio: `/prose` (plugin OpenProse)
    — vedi [OpenProse](/it/prose).

  </Accordion>
  <Accordion title="Argomenti dei comandi nativi">
    Discord usa il completamento automatico per le opzioni dinamiche e menu a pulsanti quando gli
    argomenti richiesti vengono omessi. Telegram e Slack mostrano un menu a pulsanti per i comandi con
    scelte. Le scelte dinamiche vengono risolte rispetto al modello della sessione di destinazione, quindi le opzioni
    specifiche del modello come i livelli di `/think` seguono l'override `/model` della sessione.
  </Accordion>
</AccordionGroup>

## `/tools` — cosa può usare ora l'agente

`/tools` risponde a una domanda di runtime: **cosa può usare questo agente in questo momento in questa
conversazione** — non un catalogo statico di configurazione.

```text
/tools         # vista compatta
/tools verbose # con descrizioni brevi
```

I risultati sono limitati alla sessione. Cambiare agente, canale, thread, autorizzazione
del mittente o modello può cambiare l'output. Per modificare profili e override,
usa il pannello Tools della Control UI o le superfici di configurazione.

## `/model` — selezione del modello

```text
/model             # mostra il selettore di modelli
/model list        # uguale
/model 3           # seleziona per numero dal selettore
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # cancella la selezione del modello della sessione
/model status      # vista dettagliata con endpoint e modalità API
```

Su Discord, `/model` e `/models` aprono un selettore interattivo con menu a discesa per provider e
modello. Il selettore rispetta `agents.defaults.models`, incluse le voci
`provider/*`.

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

`/mcp` memorizza la configurazione nella configurazione OpenClaw, non nelle impostazioni del progetto dell'agente incorporato.

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

## `/plugins` — gestione dei plugin

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

`/plugins enable|disable` aggiorna la configurazione dei plugin ed esegue l'hot reload del runtime dei plugin Gateway
per i nuovi turni agente. `/plugins install` riavvia automaticamente i Gateway gestiti
perché i moduli sorgente dei plugin sono cambiati.

## `/trace` — output di trace dei plugin

```text
/trace          # mostra lo stato di trace corrente
/trace on
/trace off
```

`/trace` rivela le righe di trace/debug dei plugin limitate alla sessione senza la modalità verbosa
completa. Non sostituisce `/debug` (override runtime) o `/verbose` (normale
output degli strumenti).

## `/btw` — domande laterali

`/btw` è una domanda laterale rapida sul contesto della sessione corrente. Alias: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

A differenza di un messaggio normale:

- Usa la sessione corrente come contesto di sfondo.
- Nelle sessioni harness Codex, viene eseguito come thread laterale Codex effimero.
- **Non** cambia il contesto futuro della sessione.
- Non viene scritto nella cronologia della trascrizione.

Vedi [Domande laterali BTW](/it/tools/btw) per il comportamento completo.

## Note sulle superfici

<AccordionGroup>
  <Accordion title="Ambito della sessione per superficie">
    - **Comandi testuali:** vengono eseguiti nella normale sessione chat (i DM condividono `main`, i gruppi hanno la propria sessione).
    - **Comandi nativi Discord:** `agent:<agentId>:discord:slash:<userId>`
    - **Comandi nativi Slack:** `agent:<agentId>:slack:slash:<userId>` (prefisso configurabile tramite `channels.slack.slashCommand.sessionPrefix`)
    - **Comandi nativi Telegram:** `telegram:slash:<userId>` (puntano alla sessione chat tramite `CommandTargetSessionKey`)
    - **`/stop`** punta alla sessione chat attiva per interrompere l'esecuzione corrente.

  </Accordion>
  <Accordion title="Specifiche Slack">
    `channels.slack.slashCommand` supporta un singolo comando in stile `/openclaw`.
    Con `commands.native: true`, crea un comando slash Slack per ogni comando
    integrato. Registra `/agentstatus` (non `/status`) perché Slack riserva
    `/status`. Il testo `/status` funziona comunque nei messaggi Slack.
  </Accordion>
  <Accordion title="Percorso rapido e scorciatoie inline">
    - I messaggi contenenti solo comandi da mittenti nella allowlist vengono gestiti immediatamente (bypass di coda + modello).
    - Le scorciatoie inline (`/help`, `/commands`, `/status`, `/whoami`) funzionano anche incorporate nei messaggi normali e vengono rimosse prima che il modello veda il testo rimanente.
    - I messaggi non autorizzati contenenti solo comandi vengono ignorati silenziosamente; i token inline `/...` vengono trattati come testo semplice.

  </Accordion>
  <Accordion title="Note sugli argomenti">
    - I comandi accettano un `:` opzionale tra comando e argomenti (`/think: high`, `/send: on`).
    - `/new <model>` accetta un alias di modello, `provider/model` o un nome provider (corrispondenza fuzzy); se non c'è corrispondenza, il testo viene trattato come corpo del messaggio.
    - `/allowlist add|remove` richiede `commands.config: true` e rispetta `configWrites` del canale.

  </Accordion>
</AccordionGroup>

## Uso e stato del provider

- **Uso/quota del provider** (ad esempio, "Claude 80% left") viene mostrato in `/status` per il provider del modello corrente quando il tracciamento dell'uso è abilitato.
- Le **righe token/cache** in `/status` possono ricadere sull'ultima voce di uso della trascrizione quando lo snapshot live della sessione è scarso.
- **Esecuzione vs runtime:** `/status` segnala `Execution` per il percorso sandbox effettivo e `Runtime` per chi sta eseguendo la sessione: `OpenClaw Default`, `OpenAI Codex`, un backend CLI o un backend ACP.
- **Token/costo per risposta:** controllato da `/usage off|tokens|full`.
- `/model status` riguarda modelli/auth/endpoint, non l'uso.

## Correlati

<CardGroup cols={2}>
  <Card title="Skills" href="/it/tools/skills" icon="puzzle-piece">
    Come vengono registrati e protetti i comandi slash delle Skills.
  </Card>
  <Card title="Creare Skills" href="/it/tools/creating-skills" icon="hammer">
    Crea una Skill che registra il proprio comando slash.
  </Card>
  <Card title="BTW" href="/it/tools/btw" icon="comments">
    Domande laterali senza cambiare il contesto della sessione.
  </Card>
  <Card title="Steer" href="/it/tools/steer" icon="compass">
    Guida l'agente durante l'esecuzione con `/steer`.
  </Card>
</CardGroup>
