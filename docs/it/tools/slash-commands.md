---
read_when:
    - Utilizzo o configurazione dei comandi di chat
    - Risoluzione dei problemi relativi all'instradamento dei comandi o alle autorizzazioni
sidebarTitle: Slash commands
summary: 'Comandi slash: testuali rispetto a nativi, configurazione e comandi supportati'
title: Comandi slash
x-i18n:
    generated_at: "2026-05-11T20:39:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a9030d88abd04c395369f8f6587632b53f3249ea95a26726fb1f165dae2d0f6
    source_path: tools/slash-commands.md
    workflow: 16
---

I comandi sono gestiti dal Gateway. La maggior parte dei comandi deve essere inviata come messaggio **autonomo** che inizia con `/`. Il comando chat bash solo host usa `! <cmd>` (con `/bash <cmd>` come alias).

Quando una conversazione o un thread è associato a una sessione ACP, il normale testo di follow-up viene instradato a quell'harness ACP. I comandi di gestione del Gateway restano comunque locali: `/acp ...` raggiunge sempre il gestore dei comandi ACP di OpenClaw, e `/status` più `/unfocus` restano locali ogni volta che la gestione dei comandi è abilitata per la superficie.

Ci sono due sistemi correlati:

<AccordionGroup>
  <Accordion title="Comandi">
    Messaggi `/...` autonomi.
  </Accordion>
  <Accordion title="Direttive">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Le direttive vengono rimosse dal messaggio prima che il modello lo veda.
    - Nei normali messaggi di chat (non solo direttive), sono trattate come "suggerimenti inline" e **non** mantengono le impostazioni della sessione.
    - Nei messaggi composti solo da direttive (il messaggio contiene solo direttive), vengono mantenute nella sessione e rispondono con una conferma.
    - Le direttive vengono applicate solo per **mittenti autorizzati**. Se `commands.allowFrom` è impostato, è l'unica allowlist usata; altrimenti l'autorizzazione proviene dalle allowlist/associazione del canale più `commands.useAccessGroups`. I mittenti non autorizzati vedono le direttive trattate come testo normale.

  </Accordion>
  <Accordion title="Scorciatoie inline">
    Solo mittenti in allowlist/autorizzati: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Vengono eseguite immediatamente, rimosse prima che il modello veda il messaggio, e il testo rimanente prosegue nel flusso normale.

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
  Abilita l'analisi di `/...` nei messaggi di chat. Sulle superfici senza comandi nativi (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), i comandi testuali funzionano comunque anche se lo imposti su `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registra i comandi nativi. Auto: attivo per Discord/Telegram; disattivo per Slack (finché non aggiungi comandi slash); ignorato per i provider senza supporto nativo. Imposta `channels.discord.commands.native`, `channels.telegram.commands.native` o `channels.slack.commands.native` per sovrascrivere per provider (bool o `"auto"`). Su Discord, `false` salta la registrazione e la pulizia dei comandi slash durante l'avvio; i comandi registrati in precedenza possono restare visibili finché non li rimuovi dall'app Discord. I comandi Slack sono gestiti nell'app Slack e non vengono rimossi automaticamente.
</ParamField>
Su Discord, le specifiche dei comandi nativi possono includere `descriptionLocalizations`, che OpenClaw pubblica come `description_localizations` di Discord e include nei confronti di riconciliazione.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registra nativamente i comandi **skill** quando supportato. Auto: attivo per Discord/Telegram; disattivo per Slack (Slack richiede la creazione di un comando slash per skill). Imposta `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` o `channels.slack.commands.nativeSkills` per sovrascrivere per provider (bool o `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Abilita `! <cmd>` per eseguire comandi shell dell'host (`/bash <cmd>` è un alias; richiede allowlist `tools.elevated`).
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
  Abilita `/debug` (override solo runtime).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Abilita `/restart` più le azioni strumento di riavvio del Gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Imposta la allowlist esplicita del proprietario per comandi/superfici strumento riservati al proprietario. Questo è l'account dell'operatore umano che può approvare azioni pericolose ed eseguire comandi come `/diagnostics`, `/export-trajectory` e `/config`. È separato da `commands.allowFrom` e dall'accesso tramite associazione DM.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Per canale: richiede **l'identità del proprietario** per eseguire comandi riservati al proprietario su quella superficie. Quando `true`, il mittente deve corrispondere a un candidato proprietario risolto (per esempio una voce in `commands.ownerAllowFrom` o metadati proprietario nativi del provider) oppure possedere lo scope interno `operator.admin` su un canale di messaggi interno. Una voce wildcard in `allowFrom` del canale, o un elenco di candidati proprietario vuoto/non risolto, **non** è sufficiente: i comandi riservati al proprietario falliscono in modo chiuso su quel canale. Lascia disattivato se vuoi che i comandi riservati al proprietario siano protetti solo da `ownerAllowFrom` e dalle allowlist standard dei comandi.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Controlla come gli id proprietario appaiono nel prompt di sistema.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Imposta facoltativamente il segreto HMAC usato quando `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Allowlist per provider per l'autorizzazione dei comandi. Quando configurata, è l'unica fonte di autorizzazione per comandi e direttive (le allowlist/associazione del canale e `commands.useAccessGroups` vengono ignorate). Usa `"*"` per un valore predefinito globale; le chiavi specifiche del provider lo sovrascrivono.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Applica allowlist/policy per i comandi quando `commands.allowFrom` non è impostato.
</ParamField>

## Elenco dei comandi

Fonte di verità attuale:

- i comandi integrati core provengono da `src/auto-reply/commands-registry.shared.ts`
- i comandi dock generati provengono da `src/auto-reply/commands-registry.data.ts`
- i comandi Plugin provengono dalle chiamate `registerCommand()` dei Plugin
- la disponibilità effettiva sul tuo gateway dipende comunque dai flag di configurazione, dalla superficie del canale e dai Plugin installati/abilitati

### Comandi integrati core

<AccordionGroup>
  <Accordion title="Sessioni ed esecuzioni">
    - `/new [model]` avvia una nuova sessione; `/reset` è l'alias di reset.
    - Control UI intercetta `/new` digitato per creare e passare a una nuova sessione dashboard, tranne quando `session.dmScope: "main"` è configurato e il parent corrente è la sessione principale dell'agente; in quel caso `/new` reimposta la sessione principale sul posto. `/reset` digitato esegue comunque il reset sul posto del Gateway.
    - `/reset soft [message]` conserva la trascrizione corrente, elimina gli id sessione backend CLI riutilizzati, e riesegue sul posto il caricamento di avvio/prompt di sistema.
    - `/compact [instructions]` compatta il contesto della sessione. Vedi [Compaction](/it/concepts/compaction).
    - `/stop` interrompe l'esecuzione corrente.
    - `/session idle <duration|off>` e `/session max-age <duration|off>` gestiscono la scadenza dell'associazione dei thread.
    - `/export-session [path]` esporta la sessione corrente in HTML. Alias: `/export`.
    - `/export-trajectory [path]` richiede l'approvazione exec, poi esporta un [bundle di traiettoria](/it/tools/trajectory) JSONL per la sessione corrente. Usalo quando ti servono prompt, strumento e timeline della trascrizione per una sessione OpenClaw. Nelle chat di gruppo, il prompt di approvazione e il risultato dell'esportazione vanno privatamente al proprietario. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Controlli del modello e dell'esecuzione">
    - `/think <level|default>` imposta il livello di thinking o cancella l'override della sessione. Le opzioni provengono dal profilo provider del modello attivo; i livelli comuni sono `off`, `minimal`, `low`, `medium` e `high`, con livelli personalizzati come `xhigh`, `adaptive`, `max` o binario `on` solo dove supportati. Alias: `/thinking`, `/t`.
    - `/verbose on|off|full` attiva/disattiva l'output dettagliato. Alias: `/v`.
    - `/trace on|off` attiva/disattiva l'output di trace dei Plugin per la sessione corrente.
    - `/fast [status|on|off|default]` mostra, imposta o cancella la modalità rapida.
    - `/reasoning [on|off|stream]` attiva/disattiva la visibilità del reasoning. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` attiva/disattiva la modalità elevata. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` mostra o imposta i valori predefiniti di exec.
    - `/model [name|#|status]` mostra o imposta il modello.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` elenca i provider configurati/disponibili tramite auth o i modelli per un provider; aggiungi `all` per esplorare il catalogo completo di quel provider. Le voci `provider/*` in `agents.defaults.models` fanno sì che `/model` e `/models` mostrino i modelli rilevati solo per quei provider.
    - `/queue <mode>` gestisce il comportamento della coda (`steer`, legacy `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) più opzioni come `debounce:0.5s cap:25 drop:summarize`; `/queue default` o `/queue reset` cancella l'override della sessione. Vedi [Coda dei comandi](/it/concepts/queue) e [Coda di steering](/it/concepts/queue-steering).
    - `/steer <message>` inserisce indicazioni nell'esecuzione attiva per la sessione corrente, indipendentemente dalla modalità `/queue`. Non avvia una nuova esecuzione quando la sessione è inattiva. Alias: `/tell`. Vedi [Steer](/it/tools/steer).

  </Accordion>
  <Accordion title="Rilevamento e stato">
    - `/help` mostra il riepilogo breve della guida.
    - `/commands` mostra il catalogo dei comandi generato.
    - `/tools [compact|verbose]` mostra cosa può usare l'agente corrente in questo momento.
    - `/status` mostra lo stato di esecuzione/runtime, uptime del Gateway e del sistema, più utilizzo/quota del provider quando disponibile.
    - `/diagnostics [note]` è il flusso di report di supporto riservato al proprietario per bug del Gateway ed esecuzioni dell'harness Codex. Richiede l'approvazione exec esplicita ogni volta prima di eseguire `openclaw gateway diagnostics export --json`; non approvare diagnostics con una regola allow-all. Dopo l'approvazione, invia un report incollabile con il percorso del bundle locale, il riepilogo del manifest, note sulla privacy e id sessione rilevanti. Nelle chat di gruppo, il prompt di approvazione e il report vanno privatamente al proprietario. Quando la sessione attiva usa l'harness OpenAI Codex, la stessa approvazione invia anche feedback Codex rilevanti ai server OpenAI e la risposta completata elenca gli id sessione OpenClaw, gli id thread Codex e i comandi `codex resume <thread-id>`. Vedi [Esportazione diagnostics](/it/gateway/diagnostics).
    - `/crestodian <request>` esegue l'helper di configurazione e riparazione Crestodian da un DM del proprietario.
    - `/tasks` elenca le attività in background attive/recenti per la sessione corrente.
    - `/context [list|detail|map|json]` spiega come viene assemblato il contesto. `map` invia un'immagine treemap del contesto della sessione corrente.
    - `/whoami` mostra il tuo id mittente. Alias: `/id`.
    - `/usage off|tokens|full|cost` controlla il footer di utilizzo per risposta o stampa un riepilogo locale dei costi.

  </Accordion>
  <Accordion title="Skills, elenchi consentiti, approvazioni">
    - `/skill <name> [input]` esegue una skill per nome.
    - `/allowlist [list|add|remove] ...` gestisce le voci dell'elenco consentito. Solo testo.
    - `/approve <id> <decision>` risolve le richieste di approvazione exec.
    - `/btw <question>` pone una domanda laterale senza modificare il contesto futuro della sessione. Alias: `/side`. Vedi [BTW](/it/tools/btw).

  </Accordion>
  <Accordion title="Subagent e ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` gestisce le esecuzioni dei sub-agent per la sessione corrente.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gestisce le sessioni ACP e le opzioni di runtime.
    - `/focus <target>` associa il thread Discord corrente o l'argomento/conversazione Telegram a una destinazione di sessione.
    - `/unfocus` rimuove l'associazione corrente.
    - `/agents` elenca gli agenti associati al thread per la sessione corrente.
    - `/kill <id|#|all>` interrompe uno o tutti i sub-agent in esecuzione.
    - `/subagents steer <id|#> <message>` invia una direzione a un sub-agent in esecuzione. Vedi [Steer](/it/tools/steer).

  </Accordion>
  <Accordion title="Scritture riservate al proprietario e amministrazione">
    - `/config show|get|set|unset` legge o scrive `openclaw.json`. Solo proprietario. Richiede `commands.config: true`.
    - `/mcp show|get|set|unset` legge o scrive la configurazione dei server MCP gestiti da OpenClaw in `mcp.servers`. Solo proprietario. Richiede `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` ispeziona o modifica lo stato dei Plugin. `/plugin` è un alias. Solo proprietario per le scritture. Richiede `commands.plugins: true`.
    - `/debug show|set|unset|reset` gestisce override di configurazione solo runtime. Solo proprietario. Richiede `commands.debug: true`.
    - `/restart` riavvia OpenClaw quando abilitato. Predefinito: abilitato; imposta `commands.restart: false` per disabilitarlo.
    - `/send on|off|inherit` imposta la policy di invio. Solo proprietario.

  </Accordion>
  <Accordion title="Voce, TTS, controllo del canale">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` controlla il TTS. Vedi [TTS](/it/tools/tts).
    - `/activation mention|always` imposta la modalità di attivazione nei gruppi.
    - `/bash <command>` esegue un comando della shell host. Solo testo. Alias: `! <command>`. Richiede `commands.bash: true` più elenchi consentiti `tools.elevated`.
    - `!poll [sessionId]` controlla un job bash in background.
    - `!stop [sessionId]` arresta un job bash in background.

  </Accordion>
</AccordionGroup>

### Comandi dock generati

I comandi dock cambiano la rotta di risposta della sessione corrente verso un altro
canale collegato. Vedi [Docking dei canali](/it/concepts/channel-docking) per configurazione,
esempi e risoluzione dei problemi.

I comandi dock vengono generati dai Plugin dei canali con supporto ai comandi nativi. Set incluso corrente:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Usa i comandi dock da una chat diretta per cambiare la rotta di risposta della sessione corrente verso un altro canale collegato. L'agente mantiene lo stesso contesto di sessione, ma le risposte future per quella sessione vengono consegnate al peer del canale selezionato.

I comandi dock richiedono `session.identityLinks`. Il mittente sorgente e il peer di destinazione devono essere nello stesso gruppo di identità, per esempio `["telegram:123", "discord:456"]`. Se un utente Telegram con id `123` invia `/dock_discord`, OpenClaw memorizza `lastChannel: "discord"` e `lastTo: "456"` nella sessione attiva. Se il mittente non è collegato a un peer Discord, il comando risponde con un suggerimento di configurazione invece di passare alla normale chat.

Il docking modifica solo la rotta della sessione attiva. Non crea account di canale, non concede accesso, non aggira gli elenchi consentiti del canale né sposta la cronologia della trascrizione in un'altra sessione. Usa `/dock-telegram`, `/dock-slack`, `/dock-mattermost` o un altro comando dock generato per cambiare di nuovo la rotta.

### Comandi dei Plugin inclusi

I Plugin inclusi possono aggiungere altri comandi slash. Comandi inclusi correnti in questo repo:

- `/dreaming [on|off|status|help]` attiva o disattiva il dreaming della memoria. Vedi [Dreaming](/it/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gestisce il flusso di associazione/configurazione del dispositivo. Vedi [Associazione](/it/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` abilita temporaneamente i comandi ad alto rischio del nodo telefono.
- `/voice status|list [limit]|set <voiceId|name>` gestisce la configurazione della voce Talk. Su Discord, il nome del comando nativo è `/talkvoice`.
- `/card ...` invia preset di rich card LINE. Vedi [LINE](/it/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` ispeziona e controlla l'harness app-server Codex incluso. Vedi [Harness Codex](/it/plugins/codex-harness).
- Comandi solo QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Comandi skill dinamici

Le skill invocabili dall'utente sono esposte anche come comandi slash:

- `/skill <name> [input]` funziona sempre come entrypoint generico.
- le skill possono anche comparire come comandi diretti come `/prose` quando la skill/il Plugin li registra.
- la registrazione dei comandi skill nativi è controllata da `commands.nativeSkills` e `channels.<provider>.commands.nativeSkills`.
- le specifiche dei comandi possono fornire `descriptionLocalizations` per superfici native che supportano descrizioni localizzate, incluso Discord.

<AccordionGroup>
  <Accordion title="Note su argomenti e parser">
    - I comandi accettano un `:` opzionale tra il comando e gli argomenti (ad es. `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` accetta un alias di modello, `provider/model` o un nome di provider (corrispondenza fuzzy); se non c'è corrispondenza, il testo viene trattato come corpo del messaggio.
    - Per la suddivisione completa dell'uso per provider, usa `openclaw status --usage`.
    - `/allowlist add|remove` richiede `commands.config=true` e rispetta `configWrites` del canale.
    - Nei canali multi-account, anche `/allowlist --account <id>` mirato alla configurazione e `/config set channels.<provider>.accounts.<id>...` rispettano `configWrites` dell'account di destinazione.
    - `/usage` controlla il footer di utilizzo per risposta; `/usage cost` stampa un riepilogo locale dei costi dai log di sessione OpenClaw.
    - `/restart` è abilitato per impostazione predefinita; imposta `commands.restart: false` per disabilitarlo.
    - `/plugins install <spec>` accetta le stesse specifiche Plugin di `openclaw plugins install`: percorso/archivio locale, pacchetto npm, `git:<repo>` o `clawhub:<pkg>`, poi richiede un riavvio del Gateway perché i moduli sorgente del Plugin sono cambiati.
    - `/plugins enable|disable` aggiorna la configurazione del Plugin e attiva il ricaricamento dei Plugin del Gateway per i nuovi turni dell'agente.

  </Accordion>
  <Accordion title="Comportamento specifico del canale">
    - Comando nativo solo Discord: `/vc join|leave|status` controlla i canali vocali (non disponibile come testo). `join` richiede un server e un canale vocale/stage selezionato. Richiede `channels.discord.voice` e comandi nativi.
    - I comandi di associazione thread Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) richiedono che le associazioni thread effettive siano abilitate (`session.threadBindings.enabled` e/o `channels.discord.threadBindings.enabled`).
    - Riferimento dei comandi ACP e comportamento runtime: [Agenti ACP](/it/tools/acp-agents).

  </Accordion>
  <Accordion title="Sicurezza verbose / trace / fast / reasoning">
    - `/verbose` è pensato per il debug e visibilità extra; tienilo **disattivato** nell'uso normale.
    - `/trace` è più ristretto di `/verbose`: rivela solo righe trace/debug di proprietà del Plugin e mantiene disattivato il normale chatter verbose degli strumenti.
    - `/fast on|off` persiste un override della sessione. Usa l'opzione `inherit` della UI Sessioni per cancellarlo e tornare ai valori predefiniti della configurazione.
    - `/fast` è specifico del provider: OpenAI/OpenAI Codex lo mappano a `service_tier=priority` sugli endpoint Responses nativi, mentre le richieste Anthropic pubbliche dirette, incluso il traffico autenticato via OAuth inviato a `api.anthropic.com`, lo mappano a `service_tier=auto` o `standard_only`. Vedi [OpenAI](/it/providers/openai) e [Anthropic](/it/providers/anthropic).
    - I riepiloghi degli errori degli strumenti vengono comunque mostrati quando pertinenti, ma il testo dettagliato dell'errore è incluso solo quando `/verbose` è `on` o `full`.
    - `/reasoning`, `/verbose` e `/trace` sono rischiosi nelle impostazioni di gruppo: possono rivelare ragionamento interno, output degli strumenti o diagnostica dei Plugin che non intendevi esporre. Preferisci lasciarli disattivati, specialmente nelle chat di gruppo.

  </Accordion>
  <Accordion title="Cambio modello">
    - `/model` persiste immediatamente il nuovo modello di sessione.
    - Se l'agente è inattivo, la prossima esecuzione lo usa subito.
    - Se un'esecuzione è già attiva, OpenClaw contrassegna un cambio live come in sospeso e riavvia nel nuovo modello solo in un punto pulito di retry.
    - Se l'attività degli strumenti o l'output della risposta è già iniziato, il cambio in sospeso può restare in coda fino a una successiva opportunità di retry o al prossimo turno utente.
    - Nella TUI locale, `/crestodian [request]` torna dalla TUI normale dell'agente a Crestodian. Questo è separato dalla modalità di rescue dei canali di messaggistica e non concede autorità di configurazione remota.

  </Accordion>
  <Accordion title="Fast path e scorciatoie inline">
    - **Fast path:** i messaggi composti solo da comandi provenienti da mittenti nell'elenco consentito vengono gestiti immediatamente (bypass coda + modello).
    - **Gating delle menzioni nei gruppi:** i messaggi composti solo da comandi provenienti da mittenti nell'elenco consentito bypassano i requisiti di menzione.
    - **Scorciatoie inline (solo mittenti nell'elenco consentito):** alcuni comandi funzionano anche quando incorporati in un messaggio normale e vengono rimossi prima che il modello veda il testo restante.
      - Esempio: `hey /status` attiva una risposta di stato e il testo restante continua nel flusso normale.
    - Attualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - I messaggi solo comando non autorizzati vengono ignorati silenziosamente, e i token inline `/...` vengono trattati come testo semplice.

  </Accordion>
  <Accordion title="Comandi skill e argomenti nativi">
    - **Comandi skill:** le skill `user-invocable` sono esposte come comandi slash. I nomi sono sanificati in `a-z0-9_` (max 32 caratteri); le collisioni ricevono suffissi numerici (ad es. `_2`).
      - `/skill <name> [input]` esegue una skill per nome (utile quando i limiti dei comandi nativi impediscono comandi per singola skill).
      - Per impostazione predefinita, i comandi skill vengono inoltrati al modello come richiesta normale.
      - Le skill possono facoltativamente dichiarare `command-dispatch: tool` per instradare il comando direttamente a uno strumento (deterministico, senza modello).
      - Esempio: `/prose` (Plugin OpenProse) — vedi [OpenProse](/it/prose).
    - **Argomenti dei comandi nativi:** Discord usa il completamento automatico per le opzioni dinamiche (e menu a pulsanti quando ometti argomenti richiesti). Telegram e Slack mostrano un menu a pulsanti quando un comando supporta scelte e ometti l'argomento. Le scelte dinamiche vengono risolte rispetto al modello della sessione di destinazione, quindi opzioni specifiche del modello come i livelli di `/think` seguono l'override `/model` di quella sessione.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` risponde a una domanda di runtime, non a una domanda di configurazione: **cosa può usare questo agente in questo momento in questa conversazione**.

- `/tools` predefinito è compatto e ottimizzato per una scansione rapida.
- `/tools verbose` aggiunge descrizioni brevi.
- Le superfici con comandi nativi che supportano argomenti espongono lo stesso cambio di modalità di `compact|verbose`.
- I risultati sono limitati alla sessione, quindi cambiare agente, canale, thread, autorizzazione del mittente o modello può modificare l'output.
- `/tools` include gli strumenti effettivamente raggiungibili a runtime, inclusi strumenti core, strumenti dei Plugin collegati e strumenti di proprietà del canale.

Per modificare profili e override, usa il pannello Strumenti della UI di controllo o le superfici di configurazione/catalogo invece di trattare `/tools` come un catalogo statico.

## Superfici di utilizzo (cosa viene mostrato dove)

- **Utilizzo/quota del provider** (esempio: "Claude 80% rimanente") viene mostrato in `/status` per il provider del modello corrente quando il tracciamento dell'utilizzo è abilitato. OpenClaw normalizza le finestre dei provider in `% left`; per MiniMax, i campi percentuali solo-rimanenti vengono invertiti prima della visualizzazione, e le risposte `model_remains` preferiscono la voce del modello chat più un'etichetta di piano con tag del modello.
- **Righe token/cache** in `/status` possono ripiegare sull'ultima voce di utilizzo della trascrizione quando lo snapshot della sessione live è scarno. I valori live non nulli esistenti hanno comunque la precedenza, e il fallback della trascrizione può anche recuperare l'etichetta del modello runtime attivo più un totale orientato al prompt più grande quando i totali memorizzati mancano o sono inferiori.
- **Esecuzione vs runtime:** `/status` riporta `Execution` per il percorso sandbox effettivo e `Runtime` per chi sta effettivamente eseguendo la sessione: `OpenClaw Pi Default`, `OpenAI Codex`, un backend CLI o un backend ACP.
- **Token/costo per risposta** è controllato da `/usage off|tokens|full` (aggiunto alle risposte normali).
- `/model status` riguarda **modelli/autenticazione/endpoint**, non l'utilizzo.

## Selezione del modello (`/model`)

`/model` è implementato come direttiva.

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

- `/model` e `/model list` mostrano un selettore compatto e numerato (famiglia del modello + provider disponibili).
- Su Discord, `/model` e `/models` aprono un selettore interattivo con menu a discesa per provider e modello più un passaggio Invia. Il selettore rispetta `agents.defaults.models`, incluse le voci `provider/*`, quindi il rilevamento con ambito provider può mantenere il selettore sotto il limite di 25 opzioni dei componenti di Discord.
- `/model <#>` seleziona da quel selettore (e preferisce il provider corrente quando possibile).
- `/model status` mostra la vista dettagliata, incluso l'endpoint del provider configurato (`baseUrl`) e la modalità API (`api`) quando disponibili.

## Override di debug

`/debug` consente di impostare override di configurazione **solo runtime** (memoria, non disco). Solo proprietario. Disabilitato per impostazione predefinita; abilitalo con `commands.debug: true`.

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

`/trace` consente di attivare o disattivare **righe di trace/debug dei Plugin con ambito sessione** senza attivare la modalità completamente verbosa.

Esempi:

```text
/trace
/trace on
/trace off
```

Note:

- `/trace` senza argomenti mostra lo stato di trace della sessione corrente.
- `/trace on` abilita le righe di trace dei Plugin per la sessione corrente.
- `/trace off` le disabilita di nuovo.
- Le righe di trace dei Plugin possono comparire in `/status` e come messaggio diagnostico successivo dopo la normale risposta dell'assistente.
- `/trace` non sostituisce `/debug`; `/debug` gestisce ancora gli override di configurazione solo runtime.
- `/trace` non sostituisce `/verbose`; il normale output verboso di strumenti/stato appartiene ancora a `/verbose`.

## Aggiornamenti della configurazione

`/config` scrive nella tua configurazione su disco (`openclaw.json`). Solo proprietario. Disabilitato per impostazione predefinita; abilitalo con `commands.config: true`.

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

`/mcp` scrive definizioni di server MCP gestite da OpenClaw sotto `mcp.servers`. Solo proprietario. Disabilitato per impostazione predefinita; abilitalo con `commands.mcp: true`.

Esempi:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` archivia la configurazione nella configurazione di OpenClaw, non nelle impostazioni di progetto di proprietà di Pi. Gli adattatori runtime decidono quali trasporti siano effettivamente eseguibili.
</Note>

## Aggiornamenti dei Plugin

`/plugins` consente agli operatori di ispezionare i Plugin rilevati e attivare o disattivare l'abilitazione nella configurazione. I flussi in sola lettura possono usare `/plugin` come alias. Disabilitato per impostazione predefinita; abilitalo con `commands.plugins: true`.

Esempi:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` e `/plugins show` usano il rilevamento reale dei Plugin rispetto all'area di lavoro corrente più la configurazione su disco.
- `/plugins install` installa da ClawHub, npm, git, directory locali e archivi.
- `/plugins enable|disable` aggiorna solo la configurazione dei Plugin; non installa né disinstalla Plugin.
- Le modifiche di abilitazione e disabilitazione ricaricano a caldo le superfici runtime dei Plugin del Gateway per i nuovi turni dell'agente; l'installazione richiede un riavvio del Gateway perché i moduli sorgente dei Plugin sono cambiati.

</Note>

## Note sulle superfici

<AccordionGroup>
  <Accordion title="Sessioni per superficie">
    - **Comandi testuali** vengono eseguiti nella normale sessione chat (i DM condividono `main`, i gruppi hanno la propria sessione).
    - **Comandi nativi** usano sessioni isolate:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (prefisso configurabile tramite `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (indirizza la sessione chat tramite `CommandTargetSessionKey`)
    - **`/stop`** punta alla sessione chat attiva così può interrompere l'esecuzione corrente.

  </Accordion>
  <Accordion title="Specifiche di Slack">
    `channels.slack.slashCommand` è ancora supportato per un singolo comando in stile `/openclaw`. Se abiliti `commands.native`, devi creare un comando slash Slack per ogni comando integrato (stessi nomi di `/help`). I menu degli argomenti dei comandi per Slack vengono consegnati come pulsanti Block Kit effimeri.

    Eccezione nativa di Slack: registra `/agentstatus` (non `/status`) perché Slack riserva `/status`. Il testo `/status` funziona comunque nei messaggi Slack.

  </Accordion>
</AccordionGroup>

## Domande secondarie BTW

`/btw` è una **domanda secondaria** rapida sulla sessione corrente. `/side` è un alias.

A differenza della chat normale:

- usa la sessione corrente come contesto di sfondo,
- nelle sessioni dell'harness Codex, viene eseguita come thread secondario Codex effimero con le
  autorizzazioni Codex correnti e la superficie di strumenti nativa,
- nelle sessioni non Codex, mantiene il comportamento precedente di chiamata secondaria diretta una tantum,
- non modifica il contesto futuro della sessione,
- non viene scritta nella cronologia della trascrizione,
- viene consegnata come risultato secondario live invece che come normale messaggio dell'assistente.

Questo rende `/btw` utile quando vuoi un chiarimento temporaneo mentre l'attività principale continua.

Esempio:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Consulta [Domande secondarie BTW](/it/tools/btw) per il comportamento completo e i dettagli della UX del client.

## Correlati

- [Creazione di Skills](/it/tools/creating-skills)
- [Skills](/it/tools/skills)
- [Configurazione di Skills](/it/tools/skills-config)
