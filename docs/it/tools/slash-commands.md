---
read_when:
    - Uso o configurazione dei comandi di chat
    - Risoluzione dei problemi relativi all'instradamento dei comandi o alle autorizzazioni
sidebarTitle: Slash commands
summary: 'Comandi slash: testuali vs nativi, configurazione e comandi supportati'
title: Comandi slash
x-i18n:
    generated_at: "2026-05-02T21:01:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2829a33601eb53a63b914ad1a6c3bf51be4298fe3bd34faf6475f60a2d491d2
    source_path: tools/slash-commands.md
    workflow: 16
---

Comandi gestiti dal Gateway. La maggior parte dei comandi deve essere inviata come messaggio **autonomo** che inizia con `/`. Il comando chat bash solo host usa `! <cmd>` (con `/bash <cmd>` come alias).

Quando una conversazione o un thread è associato a una sessione ACP, il normale testo di follow-up viene instradato a quell'harness ACP. I comandi di gestione del Gateway restano comunque locali: `/acp ...` raggiunge sempre il gestore comandi ACP di OpenClaw, e `/status` più `/unfocus` restano locali ogni volta che la gestione dei comandi è abilitata per la superficie.

Ci sono due sistemi correlati:

<AccordionGroup>
  <Accordion title="Comandi">
    Messaggi `/...` autonomi.
  </Accordion>
  <Accordion title="Direttive">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Le direttive vengono rimosse dal messaggio prima che il modello lo veda.
    - Nei normali messaggi chat (non solo direttive), sono trattate come "suggerimenti inline" e **non** rendono persistenti le impostazioni della sessione.
    - Nei messaggi solo direttive (il messaggio contiene solo direttive), vengono mantenute nella sessione e rispondono con una conferma.
    - Le direttive vengono applicate solo per **mittenti autorizzati**. Se `commands.allowFrom` è impostato, è l'unica allowlist usata; altrimenti l'autorizzazione proviene dalle allowlist/associazioni del canale più `commands.useAccessGroups`. I mittenti non autorizzati vedono le direttive trattate come testo semplice.

  </Accordion>
  <Accordion title="Scorciatoie inline">
    Solo mittenti in allowlist/autorizzati: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Vengono eseguite immediatamente, sono rimosse prima che il modello veda il messaggio, e il testo restante continua nel flusso normale.

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
  Abilita il parsing di `/...` nei messaggi chat. Sulle superfici senza comandi nativi (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), i comandi testuali funzionano comunque anche se lo imposti su `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registra i comandi nativi. Auto: attivo per Discord/Telegram; disattivo per Slack (finché non aggiungi comandi slash); ignorato per i provider senza supporto nativo. Imposta `channels.discord.commands.native`, `channels.telegram.commands.native` o `channels.slack.commands.native` per sovrascrivere per provider (booleano o `"auto"`). `false` cancella i comandi registrati in precedenza su Discord/Telegram all'avvio. I comandi Slack sono gestiti nell'app Slack e non vengono rimossi automaticamente.
</ParamField>
Su Discord, le specifiche dei comandi nativi possono includere `descriptionLocalizations`, che OpenClaw pubblica come `description_localizations` di Discord e include nei confronti di riconciliazione.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registra in modo nativo i comandi **skill** quando supportati. Auto: attivo per Discord/Telegram; disattivo per Slack (Slack richiede la creazione di un comando slash per ogni skill). Imposta `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` o `channels.slack.commands.nativeSkills` per sovrascrivere per provider (booleano o `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Abilita `! <cmd>` per eseguire comandi della shell host (`/bash <cmd>` è un alias; richiede allowlist `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Controlla per quanto tempo bash attende prima di passare alla modalità in background (`0` manda subito in background).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Abilita `/config` (legge/scrive `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Abilita `/mcp` (legge/scrive la configurazione MCP gestita da OpenClaw sotto `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Abilita `/plugins` (rilevamento/stato dei Plugin più controlli di installazione e abilitazione/disabilitazione).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Abilita `/debug` (sovrascritture solo runtime).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Abilita `/restart` più le azioni strumento di riavvio del gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Imposta la allowlist esplicita del proprietario per le superfici di comandi/strumenti riservate al proprietario. Questo è l'account dell'operatore umano che può approvare azioni pericolose ed eseguire comandi come `/diagnostics`, `/export-trajectory` e `/config`. È separato da `commands.allowFrom` e dall'accesso tramite associazione DM.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Per canale: fa sì che i comandi riservati al proprietario richiedano **identità del proprietario** per essere eseguiti su quella superficie. Quando `true`, il mittente deve corrispondere a un candidato proprietario risolto (per esempio una voce in `commands.ownerAllowFrom` o metadati proprietario nativi del provider) oppure detenere lo scope interno `operator.admin` su un canale di messaggi interno. Una voce wildcard in `allowFrom` del canale, o un elenco di candidati proprietario vuoto/non risolto, **non** è sufficiente: i comandi riservati al proprietario falliscono in modo chiuso su quel canale. Lascia questa opzione disattivata se vuoi che i comandi riservati al proprietario siano protetti solo da `ownerAllowFrom` e dalle allowlist di comando standard.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Controlla come gli ID proprietario compaiono nel prompt di sistema.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Imposta facoltativamente il segreto HMAC usato quando `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Allowlist per provider per l'autorizzazione dei comandi. Quando configurata, è l'unica fonte di autorizzazione per comandi e direttive (le allowlist/associazioni dei canali e `commands.useAccessGroups` sono ignorate). Usa `"*"` per un valore predefinito globale; le chiavi specifiche del provider lo sovrascrivono.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Applica allowlist/policy per i comandi quando `commands.allowFrom` non è impostato.
</ParamField>

## Elenco comandi

Fonte di verità attuale:

- i comandi integrati core provengono da `src/auto-reply/commands-registry.shared.ts`
- i comandi dock generati provengono da `src/auto-reply/commands-registry.data.ts`
- i comandi Plugin provengono dalle chiamate `registerCommand()` del Plugin
- la disponibilità effettiva sul tuo gateway dipende comunque da flag di configurazione, superficie del canale e Plugin installati/abilitati

### Comandi integrati core

<AccordionGroup>
  <Accordion title="Sessioni ed esecuzioni">
    - `/new [model]` avvia una nuova sessione; `/reset` è l'alias di reset.
    - La Control UI intercetta `/new` digitato per creare e passare a una nuova sessione dashboard; `/reset` digitato continua a eseguire il reset in-place del Gateway.
    - `/reset soft [message]` mantiene la trascrizione corrente, elimina gli ID sessione backend CLI riutilizzati e riesegue in-place il caricamento di avvio/prompt di sistema.
    - `/compact [instructions]` compatta il contesto della sessione. Vedi [Compaction](/it/concepts/compaction).
    - `/stop` interrompe l'esecuzione corrente.
    - `/session idle <duration|off>` e `/session max-age <duration|off>` gestiscono la scadenza dell'associazione del thread.
    - `/export-session [path]` esporta la sessione corrente in HTML. Alias: `/export`.
    - `/export-trajectory [path]` richiede l'approvazione exec, poi esporta un [bundle traiettoria](/it/tools/trajectory) JSONL per la sessione corrente. Usalo quando ti servono prompt, strumenti e timeline della trascrizione per una sessione OpenClaw. Nelle chat di gruppo, il prompt di approvazione e il risultato dell'esportazione vengono inviati privatamente al proprietario. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Controlli modello ed esecuzione">
    - `/think <level>` imposta il livello di pensiero. Le opzioni provengono dal profilo provider del modello attivo; i livelli comuni sono `off`, `minimal`, `low`, `medium` e `high`, con livelli personalizzati come `xhigh`, `adaptive`, `max` o binario `on` solo dove supportati. Alias: `/thinking`, `/t`.
    - `/verbose on|off|full` attiva/disattiva l'output verboso. Alias: `/v`.
    - `/trace on|off` attiva/disattiva l'output trace dei Plugin per la sessione corrente.
    - `/fast [status|on|off]` mostra o imposta la modalità veloce.
    - `/reasoning [on|off|stream]` attiva/disattiva la visibilità del reasoning. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` attiva/disattiva la modalità elevata. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` mostra o imposta i valori predefiniti exec.
    - `/model [name|#|status]` mostra o imposta il modello.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` elenca i provider configurati/disponibili tramite auth o i modelli per un provider; aggiungi `all` per esplorare il catalogo completo di quel provider.
    - `/queue <mode>` gestisce il comportamento della coda (`steer`, legacy `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) più opzioni come `debounce:0.5s cap:25 drop:summarize`; `/queue default` o `/queue reset` cancella la sovrascrittura della sessione. Vedi [Coda comandi](/it/concepts/queue) e [Coda di steering](/it/concepts/queue-steering).

  </Accordion>
  <Accordion title="Rilevamento e stato">
    - `/help` mostra il riepilogo breve della guida.
    - `/commands` mostra il catalogo comandi generato.
    - `/tools [compact|verbose]` mostra cosa può usare l'agente corrente in questo momento.
    - `/status` mostra lo stato di esecuzione/runtime, incluse le etichette `Execution`/`Runtime` e l'uso/quota del provider quando disponibile.
    - `/diagnostics [note]` è il flusso di report di supporto riservato al proprietario per bug del Gateway ed esecuzioni harness Codex. Richiede ogni volta un'approvazione exec esplicita prima di eseguire `openclaw gateway diagnostics export --json`; non approvare la diagnostica con una regola allow-all. Dopo l'approvazione, invia un report incollabile con il percorso del bundle locale, riepilogo del manifest, note sulla privacy e ID sessione rilevanti. Nelle chat di gruppo, il prompt di approvazione e il report vengono inviati privatamente al proprietario. Quando la sessione attiva usa l'harness OpenAI Codex, la stessa approvazione invia anche feedback Codex rilevante ai server OpenAI e la risposta completata elenca gli ID sessione OpenClaw, gli ID thread Codex e i comandi `codex resume <thread-id>`. Vedi [Esportazione diagnostica](/it/gateway/diagnostics).
    - `/crestodian <request>` esegue l'helper di configurazione e riparazione Crestodian da un DM del proprietario.
    - `/tasks` elenca le attività in background attive/recenti per la sessione corrente.
    - `/context [list|detail|json]` spiega come viene assemblato il contesto.
    - `/whoami` mostra il tuo ID mittente. Alias: `/id`.
    - `/usage off|tokens|full|cost` controlla il footer di utilizzo per risposta o stampa un riepilogo dei costi locale.

  </Accordion>
  <Accordion title="Skills, allowlist, approvazioni">
    - `/skill <name> [input]` esegue una skill per nome.
    - `/allowlist [list|add|remove] ...` gestisce le voci allowlist. Solo testo.
    - `/approve <id> <decision>` risolve i prompt di approvazione exec.
    - `/btw <question>` pone una domanda laterale senza cambiare il contesto futuro della sessione. Vedi [BTW](/it/tools/btw).

  </Accordion>
  <Accordion title="Sottoagenti e ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` gestisce le esecuzioni dei sottoagenti per la sessione corrente.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gestisce le sessioni ACP e le opzioni di runtime.
    - `/focus <target>` associa il thread Discord corrente o l'argomento/conversazione Telegram corrente a una destinazione di sessione.
    - `/unfocus` rimuove l'associazione corrente.
    - `/agents` elenca gli agenti associati al thread per la sessione corrente.
    - `/kill <id|#|all>` interrompe uno o tutti i sottoagenti in esecuzione.
    - `/steer <id|#> <message>` invia indicazioni a un sottoagente in esecuzione. Alias: `/tell`.

  </Accordion>
  <Accordion title="Scritture solo proprietario e amministrazione">
    - `/config show|get|set|unset` legge o scrive `openclaw.json`. Solo proprietario. Richiede `commands.config: true`.
    - `/mcp show|get|set|unset` legge o scrive la configurazione del server MCP gestita da OpenClaw sotto `mcp.servers`. Solo proprietario. Richiede `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` ispeziona o modifica lo stato dei plugin. `/plugin` è un alias. Solo proprietario per le scritture. Richiede `commands.plugins: true`.
    - `/debug show|set|unset|reset` gestisce gli override di configurazione solo runtime. Solo proprietario. Richiede `commands.debug: true`.
    - `/restart` riavvia OpenClaw quando abilitato. Predefinito: abilitato; imposta `commands.restart: false` per disabilitarlo.
    - `/send on|off|inherit` imposta la policy di invio. Solo proprietario.

  </Accordion>
  <Accordion title="Voce, TTS, controllo del canale">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` controlla TTS. Vedi [TTS](/it/tools/tts).
    - `/activation mention|always` imposta la modalità di attivazione del gruppo.
    - `/bash <command>` esegue un comando della shell host. Solo testo. Alias: `! <command>`. Richiede `commands.bash: true` più allowlist `tools.elevated`.
    - `!poll [sessionId]` controlla un job bash in background.
    - `!stop [sessionId]` arresta un job bash in background.

  </Accordion>
</AccordionGroup>

### Comandi dock generati

I comandi dock cambiano il percorso di risposta della sessione corrente verso un altro
canale collegato. Vedi [Channel docking](/it/concepts/channel-docking) per configurazione,
esempi e risoluzione dei problemi.

I comandi dock sono generati dai plugin di canale con supporto per comandi nativi. Set incluso corrente:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Usa i comandi dock da una chat diretta per cambiare il percorso di risposta della sessione corrente verso un altro canale collegato. L'agente mantiene lo stesso contesto di sessione, ma le risposte future per quella sessione vengono consegnate al peer del canale selezionato.

I comandi dock richiedono `session.identityLinks`. Il mittente di origine e il peer di destinazione devono appartenere allo stesso gruppo di identità, ad esempio `["telegram:123", "discord:456"]`. Se un utente Telegram con id `123` invia `/dock_discord`, OpenClaw memorizza `lastChannel: "discord"` e `lastTo: "456"` nella sessione attiva. Se il mittente non è collegato a un peer Discord, il comando risponde con un suggerimento di configurazione invece di passare alla chat normale.

Il docking cambia solo il percorso della sessione attiva. Non crea account di canale, non concede accesso, non aggira le allowlist dei canali e non sposta la cronologia della trascrizione in un'altra sessione. Usa `/dock-telegram`, `/dock-slack`, `/dock-mattermost` o un altro comando dock generato per cambiare di nuovo il percorso.

### Comandi dei plugin inclusi

I plugin inclusi possono aggiungere altri comandi slash. Comandi inclusi correnti in questo repo:

- `/dreaming [on|off|status|help]` attiva o disattiva il memory dreaming. Vedi [Dreaming](/it/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gestisce il flusso di associazione/configurazione dei dispositivi. Vedi [Associazione](/it/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` arma temporaneamente comandi del nodo telefono ad alto rischio.
- `/voice status|list [limit]|set <voiceId|name>` gestisce la configurazione della voce Talk. Su Discord, il nome del comando nativo è `/talkvoice`.
- `/card ...` invia preset di schede LINE avanzate. Vedi [LINE](/it/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` ispeziona e controlla l'harness app-server Codex incluso. Vedi [Harness Codex](/it/plugins/codex-harness).
- Comandi solo QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Comandi Skills dinamici

Le Skills invocabili dall'utente sono esposte anche come comandi slash:

- `/skill <name> [input]` funziona sempre come entrypoint generico.
- le Skills possono anche comparire come comandi diretti come `/prose` quando la skill o il plugin li registra.
- la registrazione dei comandi Skills nativi è controllata da `commands.nativeSkills` e `channels.<provider>.commands.nativeSkills`.
- le specifiche dei comandi possono fornire `descriptionLocalizations` per superfici native che supportano descrizioni localizzate, incluso Discord.

<AccordionGroup>
  <Accordion title="Note su argomenti e parser">
    - I comandi accettano un `:` opzionale tra il comando e gli argomenti (ad es. `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` accetta un alias di modello, `provider/model` o un nome di provider (corrispondenza fuzzy); se non c'è corrispondenza, il testo viene trattato come corpo del messaggio.
    - Per il riepilogo completo dell'utilizzo dei provider, usa `openclaw status --usage`.
    - `/allowlist add|remove` richiede `commands.config=true` e rispetta `configWrites` del canale.
    - Nei canali multi-account, anche `/allowlist --account <id>` con destinazione configurazione e `/config set channels.<provider>.accounts.<id>...` rispettano `configWrites` dell'account di destinazione.
    - `/usage` controlla il piè di pagina di utilizzo per risposta; `/usage cost` stampa un riepilogo dei costi locale dai log di sessione OpenClaw.
    - `/restart` è abilitato per impostazione predefinita; imposta `commands.restart: false` per disabilitarlo.
    - `/plugins install <spec>` accetta le stesse specifiche di plugin di `openclaw plugins install`: percorso/archivio locale, pacchetto npm, `git:<repo>` o `clawhub:<pkg>`, quindi richiede un riavvio del Gateway perché i moduli sorgente del plugin sono cambiati.
    - `/plugins enable|disable` aggiorna la configurazione del plugin e attiva il ricaricamento dei plugin del Gateway per i nuovi turni dell'agente.

  </Accordion>
  <Accordion title="Comportamento specifico del canale">
    - Comando nativo solo Discord: `/vc join|leave|status` controlla i canali vocali (non disponibile come testo). `join` richiede un server e un canale vocale/stage selezionato. Richiede `channels.discord.voice` e comandi nativi.
    - I comandi Discord di associazione ai thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) richiedono che le associazioni effettive dei thread siano abilitate (`session.threadBindings.enabled` e/o `channels.discord.threadBindings.enabled`).
    - Riferimento dei comandi ACP e comportamento di runtime: [Agenti ACP](/it/tools/acp-agents).

  </Accordion>
  <Accordion title="Sicurezza verbose / trace / fast / reasoning">
    - `/verbose` è pensato per il debug e maggiore visibilità; tienilo **disattivato** nell'uso normale.
    - `/trace` è più ristretto di `/verbose`: rivela solo righe trace/debug di proprietà del plugin e mantiene disattivato il normale rumore verbose degli strumenti.
    - `/fast on|off` mantiene un override di sessione. Usa l'opzione `inherit` nell'interfaccia Sessions per cancellarlo e tornare ai valori predefiniti di configurazione.
    - `/fast` è specifico del provider: OpenAI/OpenAI Codex lo mappano a `service_tier=priority` sugli endpoint Responses nativi, mentre le richieste Anthropic pubbliche dirette, incluso il traffico autenticato OAuth inviato a `api.anthropic.com`, lo mappano a `service_tier=auto` o `standard_only`. Vedi [OpenAI](/it/providers/openai) e [Anthropic](/it/providers/anthropic).
    - I riepiloghi degli errori degli strumenti sono comunque mostrati quando rilevanti, ma il testo dettagliato degli errori è incluso solo quando `/verbose` è `on` o `full`.
    - `/reasoning`, `/verbose` e `/trace` sono rischiosi in contesti di gruppo: possono rivelare ragionamento interno, output degli strumenti o diagnostica dei plugin che non intendevi esporre. Preferisci lasciarli disattivati, specialmente nelle chat di gruppo.

  </Accordion>
  <Accordion title="Cambio modello">
    - `/model` mantiene immediatamente il nuovo modello di sessione.
    - Se l'agente è inattivo, la prossima esecuzione lo usa subito.
    - Se un'esecuzione è già attiva, OpenClaw contrassegna un cambio live come in sospeso e riavvia nel nuovo modello solo in un punto di retry pulito.
    - Se l'attività degli strumenti o l'output di risposta è già iniziato, il cambio in sospeso può restare in coda fino a una successiva opportunità di retry o al turno utente successivo.
    - Nella TUI locale, `/crestodian [request]` ritorna dalla TUI normale dell'agente a Crestodian. Questo è separato dalla modalità di recupero del canale messaggi e non concede autorità di configurazione remota.

  </Accordion>
  <Accordion title="Percorso rapido e scorciatoie inline">
    - **Percorso rapido:** i messaggi solo comando provenienti da mittenti in allowlist vengono gestiti immediatamente (bypassano coda + modello).
    - **Gating delle menzioni di gruppo:** i messaggi solo comando provenienti da mittenti in allowlist bypassano i requisiti di menzione.
    - **Scorciatoie inline (solo mittenti in allowlist):** alcuni comandi funzionano anche quando incorporati in un messaggio normale e vengono rimossi prima che il modello veda il testo restante.
      - Esempio: `hey /status` attiva una risposta di stato e il testo restante continua attraverso il flusso normale.
    - Attualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - I messaggi solo comando non autorizzati vengono ignorati silenziosamente e i token inline `/...` sono trattati come testo semplice.

  </Accordion>
  <Accordion title="Comandi Skills e argomenti nativi">
    - **Comandi Skills:** le Skills `user-invocable` sono esposte come comandi slash. I nomi sono normalizzati a `a-z0-9_` (max 32 caratteri); le collisioni ricevono suffissi numerici (ad es. `_2`).
      - `/skill <name> [input]` esegue una skill per nome (utile quando i limiti dei comandi nativi impediscono comandi per singola skill).
      - Per impostazione predefinita, i comandi Skills vengono inoltrati al modello come richiesta normale.
      - Le Skills possono facoltativamente dichiarare `command-dispatch: tool` per instradare il comando direttamente a uno strumento (deterministico, senza modello).
      - Esempio: `/prose` (plugin OpenProse) — vedi [OpenProse](/it/prose).
    - **Argomenti dei comandi nativi:** Discord usa il completamento automatico per le opzioni dinamiche (e menu a pulsanti quando ometti argomenti obbligatori). Telegram e Slack mostrano un menu a pulsanti quando un comando supporta scelte e ometti l'argomento. Le scelte dinamiche sono risolte rispetto al modello della sessione di destinazione, quindi opzioni specifiche del modello come i livelli di `/think` seguono l'override `/model` di quella sessione.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` risponde a una domanda di runtime, non a una domanda di configurazione: **cosa può usare questo agente in questo momento in questa conversazione**.

- Il `/tools` predefinito è compatto e ottimizzato per una scansione rapida.
- `/tools verbose` aggiunge descrizioni brevi.
- Le superfici di comando native che supportano argomenti espongono lo stesso cambio di modalità di `compact|verbose`.
- I risultati hanno ambito di sessione, quindi cambiare agente, canale, thread, autorizzazione del mittente o modello può cambiare l'output.
- `/tools` include gli strumenti effettivamente raggiungibili a runtime, inclusi strumenti core, strumenti dei plugin connessi e strumenti di proprietà del canale.

Per modificare profili e override, usa il pannello Tools della Control UI o le superfici config/catalogo invece di trattare `/tools` come un catalogo statico.

## Superfici di utilizzo (cosa viene mostrato dove)

- **Uso/quota del provider** (esempio: "Claude 80% rimasto") viene mostrato in `/status` per il provider del modello corrente quando il tracciamento dell'uso e abilitato. OpenClaw normalizza le finestre dei provider in `% left`; per MiniMax, i campi percentuali solo-rimanente vengono invertiti prima della visualizzazione, e le risposte `model_remains` preferiscono la voce del modello chat piu un'etichetta di piano con tag del modello.
- **Righe token/cache** in `/status` possono ripiegare sull'ultima voce di uso della trascrizione quando lo snapshot della sessione live e scarno. I valori live non nulli esistenti hanno comunque la precedenza, e il fallback della trascrizione puo anche recuperare l'etichetta del modello runtime attivo piu un totale orientato al prompt piu grande quando i totali salvati mancano o sono piu piccoli.
- **Esecuzione e runtime:** `/status` riporta `Execution` per il percorso sandbox effettivo e `Runtime` per chi sta effettivamente eseguendo la sessione: `OpenClaw Pi Default`, `OpenAI Codex`, un backend CLI o un backend ACP.
- **Token/costo per risposta** e controllato da `/usage off|tokens|full` (aggiunto alle risposte normali).
- `/model status` riguarda **modelli/auth/endpoint**, non l'uso.

## Selezione del modello (`/model`)

`/model` e implementato come direttiva.

Esempi:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

Note:

- `/model` e `/model list` mostrano un selettore compatto e numerato (famiglia di modelli + provider disponibili).
- Su Discord, `/model` e `/models` aprono un selettore interattivo con menu a discesa per provider e modello piu un passaggio Submit.
- `/model <#>` seleziona da quel selettore (e preferisce il provider corrente quando possibile).
- `/model status` mostra la vista dettagliata, incluso l'endpoint del provider configurato (`baseUrl`) e la modalita API (`api`) quando disponibili.

## Override di debug

`/debug` ti consente di impostare override di configurazione **solo runtime** (memoria, non disco). Solo proprietario. Disabilitato per impostazione predefinita; abilita con `commands.debug: true`.

Esempi:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Gli override si applicano immediatamente alle nuove letture della configurazione, ma **non** scrivono in `openclaw.json`. Usa `/debug reset` per cancellare tutti gli override e tornare alla configurazione su disco.
</Note>

## Output di trace dei Plugin

`/trace` ti consente di attivare o disattivare **righe di trace/debug Plugin con ambito di sessione** senza attivare la modalita completamente dettagliata.

Esempi:

```text
/trace
/trace on
/trace off
```

Note:

- `/trace` senza argomenti mostra lo stato di trace della sessione corrente.
- `/trace on` abilita le righe di trace Plugin per la sessione corrente.
- `/trace off` le disabilita di nuovo.
- Le righe di trace Plugin possono comparire in `/status` e come messaggio diagnostico successivo dopo la normale risposta dell'assistente.
- `/trace` non sostituisce `/debug`; `/debug` gestisce ancora gli override di configurazione solo runtime.
- `/trace` non sostituisce `/verbose`; il normale output dettagliato di strumenti/stato appartiene ancora a `/verbose`.

## Aggiornamenti della configurazione

`/config` scrive nella tua configurazione su disco (`openclaw.json`). Solo proprietario. Disabilitato per impostazione predefinita; abilita con `commands.config: true`.

Esempi:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
La configurazione viene convalidata prima della scrittura; le modifiche non valide vengono rifiutate. Gli aggiornamenti di `/config` persistono tra i riavvii.
</Note>

## Aggiornamenti MCP

`/mcp` scrive le definizioni dei server MCP gestiti da OpenClaw sotto `mcp.servers`. Solo proprietario. Disabilitato per impostazione predefinita; abilita con `commands.mcp: true`.

Esempi:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` salva la configurazione nella configurazione di OpenClaw, non nelle impostazioni di progetto di proprieta di Pi. Gli adattatori runtime decidono quali trasporti siano effettivamente eseguibili.
</Note>

## Aggiornamenti dei Plugin

`/plugins` consente agli operatori di ispezionare i plugin rilevati e attivare o disattivare l'abilitazione nella configurazione. I flussi di sola lettura possono usare `/plugin` come alias. Disabilitato per impostazione predefinita; abilita con `commands.plugins: true`.

Esempi:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` e `/plugins show` usano il rilevamento reale dei plugin rispetto al workspace corrente piu la configurazione su disco.
- `/plugins install` installa da ClawHub, npm, git, directory locali e archivi.
- `/plugins enable|disable` aggiorna solo la configurazione dei plugin; non installa ne disinstalla plugin.
- Le modifiche di abilitazione e disabilitazione ricaricano a caldo le superfici runtime dei Plugin del Gateway per i nuovi turni agente; install richiede un riavvio del Gateway perche i moduli sorgente del plugin sono cambiati.

</Note>

## Note sulle superfici

<AccordionGroup>
  <Accordion title="Sessioni per superficie">
    - I **comandi di testo** vengono eseguiti nella normale sessione chat (i DM condividono `main`, i gruppi hanno la propria sessione).
    - I **comandi nativi** usano sessioni isolate:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (prefisso configurabile tramite `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (indirizza la sessione chat tramite `CommandTargetSessionKey`)
    - **`/stop`** prende di mira la sessione chat attiva cosi puo interrompere l'esecuzione corrente.

  </Accordion>
  <Accordion title="Specifiche Slack">
    `channels.slack.slashCommand` e ancora supportato per un singolo comando stile `/openclaw`. Se abiliti `commands.native`, devi creare un comando slash Slack per ogni comando integrato (stessi nomi di `/help`). I menu degli argomenti dei comandi per Slack vengono forniti come pulsanti Block Kit effimeri.

    Eccezione nativa Slack: registra `/agentstatus` (non `/status`) perche Slack riserva `/status`. Il testo `/status` funziona comunque nei messaggi Slack.

  </Accordion>
</AccordionGroup>

## Domande laterali BTW

`/btw` e una rapida **domanda laterale** sulla sessione corrente.

A differenza della chat normale:

- usa la sessione corrente come contesto di sfondo,
- viene eseguito come chiamata one-shot separata **senza strumenti**,
- non modifica il contesto futuro della sessione,
- non viene scritto nella cronologia della trascrizione,
- viene consegnato come risultato laterale live invece di un normale messaggio dell'assistente.

Questo rende `/btw` utile quando vuoi una chiarificazione temporanea mentre l'attivita principale continua.

Esempio:

```text
/btw what are we doing right now?
```

Vedi [Domande laterali BTW](/it/tools/btw) per il comportamento completo e i dettagli UX del client.

## Correlati

- [Creazione di Skills](/it/tools/creating-skills)
- [Skills](/it/tools/skills)
- [Configurazione di Skills](/it/tools/skills-config)
