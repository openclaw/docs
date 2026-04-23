---
read_when:
    - Uso o configurazione dei comandi chat
    - Debug del routing dei comandi o dei permessi
summary: 'Comandi slash: testo vs nativi, configurazione e comandi supportati'
title: Comandi slash
x-i18n:
    generated_at: "2026-04-23T13:59:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13290dcdf649ae66603a92a0aca68460bb63ff476179cc2dded796aaa841d66c
    source_path: tools/slash-commands.md
    workflow: 15
---

# Comandi slash

I comandi sono gestiti dal Gateway. La maggior parte dei comandi deve essere inviata come messaggio **autonomo** che inizia con `/`.
Il comando chat bash solo host usa `! <cmd>` (con `/bash <cmd>` come alias).

Esistono due sistemi correlati:

- **Comandi**: messaggi `/...` autonomi.
- **Direttive**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Le direttive vengono rimosse dal messaggio prima che il modello lo veda.
  - Nei normali messaggi chat (non composti solo da direttive), vengono trattate come “hint inline” e **non** rendono persistenti le impostazioni della sessione.
  - Nei messaggi composti solo da direttive (il messaggio contiene solo direttive), diventano persistenti per la sessione e rispondono con un acknowledgment.
  - Le direttive vengono applicate solo per i **mittenti autorizzati**. Se `commands.allowFrom` è impostato, è l'unica
    allowlist usata; altrimenti l'autorizzazione deriva dalle allowlist/pairing del canale più `commands.useAccessGroups`.
    I mittenti non autorizzati vedono le direttive trattate come testo normale.

Esistono anche alcune **scorciatoie inline** (solo per mittenti autorizzati/in allowlist): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Vengono eseguite immediatamente, vengono rimosse prima che il modello veda il messaggio e il testo rimanente continua nel normale flusso.

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

- `commands.text` (predefinito `true`) abilita il parsing di `/...` nei messaggi chat.
  - Nelle superfici senza comandi nativi (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), i comandi testuali continuano a funzionare anche se imposti questo valore su `false`.
- `commands.native` (predefinito `"auto"`) registra i comandi nativi.
  - Auto: attivo per Discord/Telegram; disattivo per Slack (finché non aggiungi slash command); ignorato per i provider senza supporto nativo.
  - Imposta `channels.discord.commands.native`, `channels.telegram.commands.native` o `channels.slack.commands.native` per sovrascrivere per provider (bool o `"auto"`).
  - `false` cancella all'avvio i comandi registrati in precedenza su Discord/Telegram. I comandi Slack sono gestiti nell'app Slack e non vengono rimossi automaticamente.
- `commands.nativeSkills` (predefinito `"auto"`) registra i comandi **Skill** in modo nativo quando supportato.
  - Auto: attivo per Discord/Telegram; disattivo per Slack (Slack richiede la creazione di uno slash command per ogni skill).
  - Imposta `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` o `channels.slack.commands.nativeSkills` per sovrascrivere per provider (bool o `"auto"`).
- `commands.bash` (predefinito `false`) abilita `! <cmd>` per eseguire comandi shell host (`/bash <cmd>` è un alias; richiede le allowlist `tools.elevated`).
- `commands.bashForegroundMs` (predefinito `2000`) controlla per quanto tempo bash attende prima di passare alla modalità in background (`0` lo manda subito in background).
- `commands.config` (predefinito `false`) abilita `/config` (legge/scrive `openclaw.json`).
- `commands.mcp` (predefinito `false`) abilita `/mcp` (legge/scrive la configurazione MCP gestita da OpenClaw sotto `mcp.servers`).
- `commands.plugins` (predefinito `false`) abilita `/plugins` (discovery/stato dei plugin più controlli di installazione + abilitazione/disabilitazione).
- `commands.debug` (predefinito `false`) abilita `/debug` (override solo runtime).
- `commands.restart` (predefinito `true`) abilita `/restart` più le azioni tool di riavvio del gateway.
- `commands.ownerAllowFrom` (opzionale) imposta l'allowlist esplicita del proprietario per le superfici comando/tool riservate al proprietario. È separata da `commands.allowFrom`.
- `channels.<channel>.commands.enforceOwnerForCommands` per canale (opzionale, predefinito `false`) fa sì che i comandi riservati al proprietario richiedano l'**identità del proprietario** per essere eseguiti su quella superficie. Quando è `true`, il mittente deve corrispondere a un candidato proprietario risolto (per esempio una voce in `commands.ownerAllowFrom` o metadati proprietario nativi del provider) oppure possedere lo scope interno `operator.admin` su un canale di messaggi interno. Una voce wildcard in `allowFrom` del canale, o un elenco di candidati proprietario vuoto/non risolto, **non** è sufficiente: i comandi riservati al proprietario falliscono in modo chiuso su quel canale. Lascia questa opzione disattivata se vuoi che i comandi riservati al proprietario siano regolati solo da `ownerAllowFrom` e dalle allowlist standard dei comandi.
- `commands.ownerDisplay` controlla come gli ID del proprietario appaiono nel prompt di sistema: `raw` o `hash`.
- `commands.ownerDisplaySecret` imposta facoltativamente il segreto HMAC usato quando `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (opzionale) imposta un'allowlist per provider per l'autorizzazione dei comandi. Quando configurata, è
  l'unica fonte di autorizzazione per comandi e direttive (`commands.useAccessGroups` e le allowlist/pairing del canale
  vengono ignorati). Usa `"*"` per un valore predefinito globale; le chiavi specifiche del provider hanno priorità.
- `commands.useAccessGroups` (predefinito `true`) applica allowlist/policy per i comandi quando `commands.allowFrom` non è impostato.

## Elenco dei comandi

Fonte di verità attuale:

- i built-in core provengono da `src/auto-reply/commands-registry.shared.ts`
- i comandi dock generati provengono da `src/auto-reply/commands-registry.data.ts`
- i comandi plugin provengono dalle chiamate `registerCommand()` dei plugin
- la disponibilità effettiva sul tuo gateway dipende comunque da flag di configurazione, superficie del canale e plugin installati/abilitati

### Comandi built-in core

Comandi built-in disponibili oggi:

- `/new [model]` avvia una nuova sessione; `/reset` è l'alias di reset.
- `/reset soft [message]` mantiene la trascrizione corrente, elimina gli ID di sessione backend CLI riutilizzati e riesegue sul posto il caricamento di avvio/system prompt.
- `/compact [instructions]` esegue la Compaction del contesto della sessione. Vedi [/concepts/compaction](/it/concepts/compaction).
- `/stop` interrompe l'esecuzione corrente.
- `/session idle <duration|off>` e `/session max-age <duration|off>` gestiscono la scadenza del binding del thread.
- `/think <level>` imposta il livello di thinking. Le opzioni provengono dal profilo provider del modello attivo; i livelli comuni sono `off`, `minimal`, `low`, `medium` e `high`, con livelli personalizzati come `xhigh`, `adaptive`, `max` o il binario `on` solo dove supportato. Alias: `/thinking`, `/t`.
- `/verbose on|off|full` attiva o disattiva l'output verboso. Alias: `/v`.
- `/trace on|off` attiva o disattiva l'output di trace del plugin per la sessione corrente.
- `/fast [status|on|off]` mostra o imposta la modalità fast.
- `/reasoning [on|off|stream]` attiva o disattiva la visibilità del reasoning. Alias: `/reason`.
- `/elevated [on|off|ask|full]` attiva o disattiva la modalità elevated. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` mostra o imposta i valori predefiniti di exec.
- `/model [name|#|status]` mostra o imposta il modello.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` elenca i provider o i modelli di un provider.
- `/queue <mode>` gestisce il comportamento della queue (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) più opzioni come `debounce:2s cap:25 drop:summarize`.
- `/help` mostra il riepilogo breve della guida.
- `/commands` mostra il catalogo comandi generato.
- `/tools [compact|verbose]` mostra ciò che l'agente corrente può usare in questo momento.
- `/status` mostra lo stato del runtime, incluse le etichette `Runtime`/`Runner` e l'utilizzo/quota del provider quando disponibili.
- `/tasks` elenca i task in background attivi/recenti per la sessione corrente.
- `/context [list|detail|json]` spiega come viene assemblato il contesto.
- `/export-session [path]` esporta la sessione corrente in HTML. Alias: `/export`.
- `/export-trajectory [path]` esporta un [trajectory bundle](/it/tools/trajectory) JSONL per la sessione corrente. Alias: `/trajectory`.
- `/whoami` mostra il tuo ID mittente. Alias: `/id`.
- `/skill <name> [input]` esegue una skill per nome.
- `/allowlist [list|add|remove] ...` gestisce le voci dell'allowlist. Solo testo.
- `/approve <id> <decision>` risolve le richieste di approvazione exec.
- `/btw <question>` pone una domanda laterale senza modificare il contesto futuro della sessione. Vedi [/tools/btw](/it/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` gestisce le esecuzioni dei sub-agent per la sessione corrente.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gestisce le sessioni ACP e le opzioni di runtime.
- `/focus <target>` associa il thread Discord corrente o il topic/conversation Telegram a un target di sessione.
- `/unfocus` rimuove il binding corrente.
- `/agents` elenca gli agenti associati al thread per la sessione corrente.
- `/kill <id|#|all>` interrompe uno o tutti i sub-agent in esecuzione.
- `/steer <id|#> <message>` invia steering a un sub-agent in esecuzione. Alias: `/tell`.
- `/config show|get|set|unset` legge o scrive `openclaw.json`. Solo proprietario. Richiede `commands.config: true`.
- `/mcp show|get|set|unset` legge o scrive la configurazione server MCP gestita da OpenClaw sotto `mcp.servers`. Solo proprietario. Richiede `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` ispeziona o modifica lo stato dei plugin. `/plugin` è un alias. Solo proprietario per le operazioni di scrittura. Richiede `commands.plugins: true`.
- `/debug show|set|unset|reset` gestisce override di configurazione solo runtime. Solo proprietario. Richiede `commands.debug: true`.
- `/usage off|tokens|full|cost` controlla il footer di utilizzo per risposta o stampa un riepilogo locale dei costi.
- `/tts on|off|status|provider|limit|summary|audio|help` controlla il TTS. Vedi [/tools/tts](/it/tools/tts).
- `/restart` riavvia OpenClaw quando abilitato. Predefinito: abilitato; imposta `commands.restart: false` per disabilitarlo.
- `/activation mention|always` imposta la modalità di attivazione del gruppo.
- `/send on|off|inherit` imposta la policy di invio. Solo proprietario.
- `/bash <command>` esegue un comando shell host. Solo testo. Alias: `! <command>`. Richiede `commands.bash: true` più le allowlist `tools.elevated`.
- `!poll [sessionId]` controlla un job bash in background.
- `!stop [sessionId]` interrompe un job bash in background.

### Comandi dock generati

I comandi dock vengono generati dai plugin di canale con supporto ai comandi nativi. Set incluso attuale:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Comandi dei plugin inclusi

I plugin inclusi possono aggiungere altri slash command. Comandi inclusi attuali in questo repository:

- `/dreaming [on|off|status|help]` attiva o disattiva il Dreaming della memoria. Vedi [Dreaming](/it/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gestisce il flusso di pairing/setup del dispositivo. Vedi [Pairing](/it/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` arma temporaneamente i comandi del Node telefono ad alto rischio.
- `/voice status|list [limit]|set <voiceId|name>` gestisce la configurazione della voce Talk. Su Discord, il nome del comando nativo è `/talkvoice`.
- `/card ...` invia preset di rich card LINE. Vedi [LINE](/it/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` ispeziona e controlla l'harness app-server Codex incluso. Vedi [Codex Harness](/it/plugins/codex-harness).
- Comandi solo QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Comandi Skill dinamici

Le Skills invocabili dall'utente sono esposte anche come slash command:

- `/skill <name> [input]` funziona sempre come entrypoint generico.
- le skill possono anche apparire come comandi diretti come `/prose` quando la skill/il plugin li registra.
- la registrazione nativa dei comandi skill è controllata da `commands.nativeSkills` e `channels.<provider>.commands.nativeSkills`.

Note:

- I comandi accettano facoltativamente `:` tra il comando e gli argomenti (per esempio `/think: high`, `/send: on`, `/help:`).
- `/new <model>` accetta un alias di modello, `provider/model` o il nome di un provider (fuzzy match); se non c'è corrispondenza, il testo viene trattato come corpo del messaggio.
- Per il dettaglio completo dell'utilizzo del provider, usa `openclaw status --usage`.
- `/allowlist add|remove` richiede `commands.config=true` e rispetta `configWrites` del canale.
- Nei canali multi-account, `/allowlist --account <id>` mirato alla config e `/config set channels.<provider>.accounts.<id>...` rispettano anche `configWrites` dell'account di destinazione.
- `/usage` controlla il footer di utilizzo per risposta; `/usage cost` stampa un riepilogo locale dei costi dai log di sessione OpenClaw.
- `/restart` è abilitato per impostazione predefinita; imposta `commands.restart: false` per disabilitarlo.
- `/plugins install <spec>` accetta le stesse specifiche plugin di `openclaw plugins install`: percorso/archive locale, pacchetto npm o `clawhub:<pkg>`.
- `/plugins enable|disable` aggiorna la configurazione dei plugin e può richiedere un riavvio.
- Comando nativo solo Discord: `/vc join|leave|status` controlla i canali vocali (richiede `channels.discord.voice` e comandi nativi; non è disponibile come testo).
- I comandi Discord di binding del thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) richiedono che i thread binding effettivi siano abilitati (`session.threadBindings.enabled` e/o `channels.discord.threadBindings.enabled`).
- Riferimento comandi ACP e comportamento runtime: [ACP Agents](/it/tools/acp-agents).
- `/verbose` è pensato per debug e visibilità aggiuntiva; in uso normale tienilo **off**.
- `/trace` è più ristretto di `/verbose`: rivela solo le righe di trace/debug di proprietà dei plugin e mantiene disattivato il normale chatter verboso di tool.
- `/fast on|off` rende persistente un override di sessione. Usa l'opzione `inherit` nell'interfaccia Sessions per cancellarlo e tornare ai valori predefiniti della configurazione.
- `/fast` è specifico del provider: OpenAI/OpenAI Codex lo mappano a `service_tier=priority` sugli endpoint nativi Responses, mentre le richieste Anthropic pubbliche dirette, incluso il traffico autenticato OAuth inviato a `api.anthropic.com`, lo mappano a `service_tier=auto` o `standard_only`. Vedi [OpenAI](/it/providers/openai) e [Anthropic](/it/providers/anthropic).
- I riepiloghi dei guasti dei tool vengono comunque mostrati quando pertinenti, ma il testo dettagliato del guasto viene incluso solo quando `/verbose` è `on` o `full`.
- `/reasoning`, `/verbose` e `/trace` sono rischiosi in contesti di gruppo: possono rivelare reasoning interni, output dei tool o diagnostica dei plugin che non intendevi esporre. È preferibile lasciarli disattivati, soprattutto nelle chat di gruppo.
- `/model` rende persistente immediatamente il nuovo modello della sessione.
- Se l'agente è inattivo, l'esecuzione successiva lo usa subito.
- Se è già attiva un'esecuzione, OpenClaw contrassegna un cambio live come in sospeso e riavvia nel nuovo modello solo in un punto di retry pulito.
- Se l'attività dei tool o l'output della risposta sono già iniziati, il cambio in sospeso può restare in coda fino a un'opportunità di retry successiva o al prossimo turno utente.
- **Percorso rapido:** i messaggi composti solo da comandi provenienti da mittenti in allowlist vengono gestiti immediatamente (bypass di queue + modello).
- **Gating delle mention di gruppo:** i messaggi composti solo da comandi provenienti da mittenti in allowlist bypassano i requisiti delle mention.
- **Scorciatoie inline (solo mittenti in allowlist):** alcuni comandi funzionano anche quando sono incorporati in un messaggio normale e vengono rimossi prima che il modello veda il testo rimanente.
  - Esempio: `hey /status` attiva una risposta di stato e il testo rimanente continua nel normale flusso.
- Attualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- I messaggi composti solo da comandi non autorizzati vengono ignorati silenziosamente e i token inline `/...` vengono trattati come testo normale.
- **Comandi Skill:** le skill `user-invocable` sono esposte come slash command. I nomi vengono sanitizzati in `a-z0-9_` (max 32 caratteri); le collisioni ricevono suffissi numerici (per esempio `_2`).
  - `/skill <name> [input]` esegue una skill per nome (utile quando i limiti dei comandi nativi impediscono i comandi per-skill).
  - Per impostazione predefinita, i comandi skill vengono inoltrati al modello come richiesta normale.
  - Le skill possono facoltativamente dichiarare `command-dispatch: tool` per instradare il comando direttamente a un tool (deterministico, nessun modello).
  - Esempio: `/prose` (Plugin OpenProse) — vedi [OpenProse](/it/prose).
- **Argomenti dei comandi nativi:** Discord usa l'autocomplete per le opzioni dinamiche (e menu a pulsanti quando ometti argomenti richiesti). Telegram e Slack mostrano un menu a pulsanti quando un comando supporta scelte e ometti l'argomento.

## `/tools`

`/tools` risponde a una domanda di runtime, non a una domanda di configurazione: **che cosa questo agente può usare in questo momento in
questa conversazione**.

- Il valore predefinito di `/tools` è compatto e ottimizzato per una scansione rapida.
- `/tools verbose` aggiunge brevi descrizioni.
- Le superfici con comandi nativi che supportano argomenti espongono lo stesso selettore di modalità `compact|verbose`.
- I risultati hanno scope di sessione, quindi cambiare agente, canale, thread, autorizzazione del mittente o modello può
  modificare l'output.
- `/tools` include i tool realmente raggiungibili a runtime, inclusi tool core, tool dei plugin
  connessi e tool di proprietà del canale.

Per modificare profili e override, usa il pannello Tools dell'interfaccia di controllo o le superfici config/catalog
invece di trattare `/tools` come un catalogo statico.

## Superfici di utilizzo (cosa appare dove)

- **Utilizzo/quota del provider** (esempio: “Claude 80% left”) appare in `/status` per il provider del modello corrente quando il tracciamento dell'utilizzo è abilitato. OpenClaw normalizza le finestre del provider in `% left`; per MiniMax, i campi percentuali con solo residuo vengono invertiti prima della visualizzazione, e le risposte `model_remains` privilegiano la voce del modello chat più un'etichetta di piano con tag del modello.
- Le righe **token/cache** in `/status` possono ripiegare sull'ultima voce di utilizzo della trascrizione quando lo snapshot live della sessione è scarso. I valori live non zero esistenti hanno comunque priorità, e il fallback dalla trascrizione può anche recuperare l'etichetta del modello runtime attivo più un totale più ampio orientato al prompt quando i totali memorizzati mancano o sono inferiori.
- **Runtime vs runner:** `/status` riporta `Runtime` per il percorso di esecuzione effettivo e lo stato sandbox, e `Runner` per chi sta effettivamente eseguendo la sessione: Pi incorporato, provider supportato da CLI o harness/backend ACP.
- **Token/costo per risposta** è controllato da `/usage off|tokens|full` (aggiunto alle normali risposte).
- `/model status` riguarda **modelli/auth/endpoint**, non l'utilizzo.

## Selezione del modello (`/model`)

`/model` è implementato come direttiva.

Esempi:

```text
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

Note:

- `/model` e `/model list` mostrano un selettore compatto numerato (famiglia di modelli + provider disponibili).
- Su Discord, `/model` e `/models` aprono un selettore interattivo con menu a discesa per provider e modello più un passaggio Submit.
- `/model <#>` seleziona da quel selettore (e preferisce il provider corrente quando possibile).
- `/model status` mostra la vista dettagliata, incluso l'endpoint del provider configurato (`baseUrl`) e la modalità API (`api`) quando disponibili.

## Override di debug

`/debug` permette di impostare override di configurazione **solo runtime** (in memoria, non su disco). Solo proprietario. Disabilitato per impostazione predefinita; abilitalo con `commands.debug: true`.

Esempi:

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Note:

- Gli override si applicano immediatamente alle nuove letture di configurazione, ma **non** scrivono in `openclaw.json`.
- Usa `/debug reset` per cancellare tutti gli override e tornare alla configurazione su disco.

## Output di trace dei plugin

`/trace` permette di attivare o disattivare **righe di trace/debug dei plugin con scope di sessione** senza attivare la modalità verbosa completa.

Esempi:

```text
/trace
/trace on
/trace off
```

Note:

- `/trace` senza argomenti mostra lo stato trace corrente della sessione.
- `/trace on` abilita le righe di trace dei plugin per la sessione corrente.
- `/trace off` le disabilita di nuovo.
- Le righe di trace dei plugin possono apparire in `/status` e come messaggio diagnostico di follow-up dopo la normale risposta dell'assistente.
- `/trace` non sostituisce `/debug`; `/debug` continua a gestire gli override di configurazione solo runtime.
- `/trace` non sostituisce `/verbose`; il normale output verboso di tool/stato continua a competere a `/verbose`.

## Aggiornamenti della configurazione

`/config` scrive nella tua configurazione su disco (`openclaw.json`). Solo proprietario. Disabilitato per impostazione predefinita; abilitalo con `commands.config: true`.

Esempi:

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Note:

- La configurazione viene validata prima della scrittura; le modifiche non valide vengono rifiutate.
- Gli aggiornamenti di `/config` persistono dopo i riavvii.

## Aggiornamenti MCP

`/mcp` scrive le definizioni dei server MCP gestite da OpenClaw sotto `mcp.servers`. Solo proprietario. Disabilitato per impostazione predefinita; abilitalo con `commands.mcp: true`.

Esempi:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Note:

- `/mcp` memorizza la configurazione nella configurazione OpenClaw, non nelle impostazioni di progetto di proprietà di Pi.
- Gli adattatori runtime decidono quali trasporti sono effettivamente eseguibili.

## Aggiornamenti dei plugin

`/plugins` consente agli operatori di ispezionare i plugin rilevati e attivare/disattivare l'abilitazione nella configurazione. I flussi in sola lettura possono usare `/plugin` come alias. Disabilitato per impostazione predefinita; abilitalo con `commands.plugins: true`.

Esempi:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Note:

- `/plugins list` e `/plugins show` usano il reale rilevamento dei plugin rispetto al workspace corrente più la configurazione su disco.
- `/plugins enable|disable` aggiorna solo la configurazione dei plugin; non installa né disinstalla plugin.
- Dopo modifiche di abilitazione/disabilitazione, riavvia il gateway per applicarle.

## Note sulle superfici

- **Comandi testuali** vengono eseguiti nella normale sessione chat (i DM condividono `main`, i gruppi hanno una propria sessione).
- **Comandi nativi** usano sessioni isolate:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefisso configurabile tramite `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (ha come target la sessione chat tramite `CommandTargetSessionKey`)
- **`/stop`** ha come target la sessione chat attiva così può interrompere l'esecuzione corrente.
- **Slack:** `channels.slack.slashCommand` è ancora supportato per un singolo comando in stile `/openclaw`. Se abiliti `commands.native`, devi creare uno slash command Slack per ogni comando built-in (stessi nomi di `/help`). I menu degli argomenti dei comandi per Slack vengono distribuiti come pulsanti Block Kit effimeri.
  - Eccezione nativa Slack: registra `/agentstatus` (non `/status`) perché Slack riserva `/status`. Il testo `/status` continua comunque a funzionare nei messaggi Slack.

## Domande laterali BTW

`/btw` è una rapida **domanda laterale** sulla sessione corrente.

A differenza della normale chat:

- usa la sessione corrente come contesto di background,
- viene eseguito come chiamata one-shot separata **senza tool**,
- non modifica il contesto futuro della sessione,
- non viene scritto nella cronologia della trascrizione,
- viene consegnato come risultato laterale live invece che come normale messaggio dell'assistente.

Questo rende `/btw` utile quando vuoi un chiarimento temporaneo mentre il task
principale continua.

Esempio:

```text
/btw cosa stiamo facendo in questo momento?
```

Vedi [BTW Side Questions](/it/tools/btw) per il comportamento completo e i dettagli
dell'esperienza utente del client.
