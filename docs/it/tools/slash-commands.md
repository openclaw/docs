---
read_when:
    - Usare o configurare comandi chat
    - Eseguire il debug dell'instradamento dei comandi o dei permessi
summary: 'Comandi slash: testo vs nativi, configurazione e comandi supportati'
title: Comandi slash
x-i18n:
    generated_at: "2026-04-05T14:08:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c91437140732d9accca1094f07b9e05f861a75ac344531aa24cc2ffe000630f
    source_path: tools/slash-commands.md
    workflow: 15
---

# Comandi slash

I comandi sono gestiti dal Gateway. La maggior parte dei comandi deve essere inviata come messaggio **autonomo** che inizia con `/`.
Il comando chat bash solo host usa `! <cmd>` (con `/bash <cmd>` come alias).

Esistono due sistemi correlati:

- **Comandi**: messaggi `/...` autonomi.
- **Direttive**: `/think`, `/fast`, `/verbose`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Le direttive vengono rimosse dal messaggio prima che il modello lo veda.
  - Nei normali messaggi chat (non composti solo da direttive), vengono trattate come “suggerimenti inline” e **non** rendono persistenti le impostazioni della sessione.
  - Nei messaggi composti solo da direttive (il messaggio contiene solo direttive), rendono persistenti le impostazioni nella sessione e rispondono con una conferma.
  - Le direttive vengono applicate solo per i **mittenti autorizzati**. Se `commands.allowFrom` è impostato, è l'unica
    allowlist usata; altrimenti l'autorizzazione deriva dalle allowlist/associazioni del canale più `commands.useAccessGroups`.
    I mittenti non autorizzati vedono le direttive trattate come testo normale.

Esistono anche alcune **scorciatoie inline** (solo per mittenti in allowlist/autorizzati): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Vengono eseguite immediatamente, vengono rimosse prima che il modello veda il messaggio e il testo rimanente continua nel flusso normale.

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
    restart: false,
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

- `commands.text` (predefinito `true`) abilita il parsing di `/...` nei messaggi chat.
  - Sulle superfici senza comandi nativi (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), i comandi testuali continuano a funzionare anche se imposti questo valore su `false`.
- `commands.native` (predefinito `"auto"`) registra i comandi nativi.
  - Auto: attivo per Discord/Telegram; disattivo per Slack (finché non aggiungi i comandi slash); ignorato per i provider senza supporto nativo.
  - Imposta `channels.discord.commands.native`, `channels.telegram.commands.native` o `channels.slack.commands.native` per sovrascrivere per provider (bool o `"auto"`).
  - `false` cancella i comandi registrati in precedenza su Discord/Telegram all'avvio. I comandi Slack sono gestiti nell'app Slack e non vengono rimossi automaticamente.
- `commands.nativeSkills` (predefinito `"auto"`) registra in modo nativo i comandi **skill** quando supportato.
  - Auto: attivo per Discord/Telegram; disattivo per Slack (Slack richiede la creazione di un comando slash per ogni skill).
  - Imposta `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` o `channels.slack.commands.nativeSkills` per sovrascrivere per provider (bool o `"auto"`).
- `commands.bash` (predefinito `false`) abilita `! <cmd>` per eseguire comandi shell host (`/bash <cmd>` è un alias; richiede le allowlist `tools.elevated`).
- `commands.bashForegroundMs` (predefinito `2000`) controlla quanto tempo bash aspetta prima di passare alla modalità background (`0` passa subito in background).
- `commands.config` (predefinito `false`) abilita `/config` (legge/scrive `openclaw.json`).
- `commands.mcp` (predefinito `false`) abilita `/mcp` (legge/scrive la configurazione MCP gestita da OpenClaw sotto `mcp.servers`).
- `commands.plugins` (predefinito `false`) abilita `/plugins` (scoperta/stato dei plugin più controlli di installazione + abilitazione/disabilitazione).
- `commands.debug` (predefinito `false`) abilita `/debug` (sovrascritture solo runtime).
- `commands.allowFrom` (opzionale) imposta una allowlist per provider per l'autorizzazione dei comandi. Quando configurata, è
  l'unica fonte di autorizzazione per comandi e direttive (le allowlist/associazioni del canale e `commands.useAccessGroups`
  vengono ignorati). Usa `"*"` come valore predefinito globale; le chiavi specifiche del provider lo sovrascrivono.
- `commands.useAccessGroups` (predefinito `true`) applica allowlist/policy ai comandi quando `commands.allowFrom` non è impostato.

## Elenco dei comandi

Testo + nativi (quando abilitati):

- `/help`
- `/commands`
- `/tools [compact|verbose]` (mostra cosa può usare l'agente corrente in questo momento; `verbose` aggiunge descrizioni)
- `/skill <name> [input]` (esegue una skill per nome)
- `/status` (mostra lo stato corrente; include utilizzo/quota del provider corrente del modello quando disponibile)
- `/tasks` (elenca le attività in background per la sessione corrente; mostra dettagli delle attività attive e recenti con conteggi di fallback locali all'agente)
- `/allowlist` (elenca/aggiunge/rimuove voci della allowlist)
- `/approve <id> <decision>` (risolve le richieste di approvazione exec; usa il messaggio di approvazione in sospeso per le decisioni disponibili)
- `/context [list|detail|json]` (spiega il “contesto”; `detail` mostra la dimensione per file + per strumento + per skill + del prompt di sistema)
- `/btw <question>` (pone una domanda laterale effimera sulla sessione corrente senza modificare il contesto futuro della sessione; vedi [/tools/btw](/tools/btw))
- `/export-session [path]` (alias: `/export`) (esporta la sessione corrente in HTML con il prompt di sistema completo)
- `/whoami` (mostra il tuo sender id; alias: `/id`)
- `/session idle <duration|off>` (gestisce il defocus automatico per inattività per le associazioni focus del thread)
- `/session max-age <duration|off>` (gestisce il defocus automatico per età massima rigida per le associazioni focus del thread)
- `/subagents list|kill|log|info|send|steer|spawn` (ispeziona, controlla o avvia esecuzioni di sottoagenti per la sessione corrente)
- `/acp spawn|cancel|steer|close|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|sessions` (ispeziona e controlla le sessioni runtime ACP)
- `/agents` (elenca gli agenti associati al thread per questa sessione)
- `/focus <target>` (Discord: associa questo thread, o un nuovo thread, a una destinazione sessione/sottoagente)
- `/unfocus` (Discord: rimuove l'associazione del thread corrente)
- `/kill <id|#|all>` (interrompe immediatamente uno o tutti i sottoagenti in esecuzione per questa sessione; nessun messaggio di conferma)
- `/steer <id|#> <message>` (indirizza subito un sottoagente in esecuzione: durante l'esecuzione quando possibile, altrimenti interrompe il lavoro corrente e riavvia sul messaggio di steering)
- `/tell <id|#> <message>` (alias di `/steer`)
- `/config show|get|set|unset` (rende persistente la configurazione su disco, solo proprietario; richiede `commands.config: true`)
- `/mcp show|get|set|unset` (gestisce la configurazione del server MCP OpenClaw, solo proprietario; richiede `commands.mcp: true`)
- `/plugins list|show|get|install|enable|disable` (ispeziona i plugin rilevati, installa nuovi plugin e attiva/disattiva l'abilitazione; scritture solo proprietario; richiede `commands.plugins: true`)
  - `/plugin` è un alias di `/plugins`.
  - `/plugin install <spec>` accetta le stesse specifiche plugin di `openclaw plugins install`: percorso/archive locale, pacchetto npm o `clawhub:<pkg>`.
  - Le scritture di abilitazione/disabilitazione rispondono comunque con un suggerimento di riavvio. Su un gateway in foreground osservato, OpenClaw può eseguire automaticamente quel riavvio subito dopo la scrittura.
- `/debug show|set|unset|reset` (sovrascritture runtime, solo proprietario; richiede `commands.debug: true`)
- `/usage off|tokens|full|cost` (piè di pagina per risposta dell'utilizzo o riepilogo locale dei costi)
- `/tts off|always|inbound|tagged|status|provider|limit|summary|audio` (controlla TTS; vedi [/tts](/tools/tts))
  - Discord: il comando nativo è `/voice` (Discord riserva `/tts`); il testo `/tts` continua a funzionare.
- `/stop`
- `/restart`
- `/dock-telegram` (alias: `/dock_telegram`) (sposta le risposte su Telegram)
- `/dock-discord` (alias: `/dock_discord`) (sposta le risposte su Discord)
- `/dock-slack` (alias: `/dock_slack`) (sposta le risposte su Slack)
- `/activation mention|always` (solo gruppi)
- `/send on|off|inherit` (solo proprietario)
- `/reset` o `/new [model]` (suggerimento modello opzionale; il resto viene inoltrato)
- `/think <off|minimal|low|medium|high|xhigh>` (scelte dinamiche per modello/provider; alias: `/thinking`, `/t`)
- `/fast status|on|off` (se ometti l'argomento mostra lo stato effettivo corrente della modalità fast)
- `/verbose on|full|off` (alias: `/v`)
- `/reasoning on|off|stream` (alias: `/reason`; quando è attivo, invia un messaggio separato con prefisso `Reasoning:`; `stream` = solo bozza Telegram)
- `/elevated on|off|ask|full` (alias: `/elev`; `full` salta le approvazioni exec)
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` (invia `/exec` per vedere lo stato corrente)
- `/model <name>` (alias: `/models`; oppure `/<alias>` da `agents.defaults.models.*.alias`)
- `/queue <mode>` (più opzioni come `debounce:2s cap:25 drop:summarize`; invia `/queue` per vedere le impostazioni correnti)
- `/bash <command>` (solo host; alias di `! <command>`; richiede `commands.bash: true` + allowlist `tools.elevated`)
- `/dreaming [off|core|rem|deep|status|help]` (attiva/disattiva la modalità dreaming o mostra lo stato; vedi [Dreaming](/it/concepts/memory-dreaming))

Solo testo:

- `/compact [instructions]` (vedi [/concepts/compaction](/it/concepts/compaction))
- `! <command>` (solo host; uno alla volta; usa `!poll` + `!stop` per lavori lunghi)
- `!poll` (controlla output / stato; accetta `sessionId` opzionale; funziona anche `/bash poll`)
- `!stop` (ferma il job bash in esecuzione; accetta `sessionId` opzionale; funziona anche `/bash stop`)

Note:

- I comandi accettano facoltativamente `:` tra comando e argomenti (es. `/think: high`, `/send: on`, `/help:`).
- `/new <model>` accetta un alias modello, `provider/model` o un nome provider (corrispondenza fuzzy); se non c'è corrispondenza, il testo viene trattato come corpo del messaggio.
- Per il dettaglio completo dell'utilizzo del provider, usa `openclaw status --usage`.
- `/allowlist add|remove` richiede `commands.config=true` e rispetta `configWrites` del canale.
- Nei canali multi-account, anche `/allowlist --account <id>` mirato alla configurazione e `/config set channels.<provider>.accounts.<id>...` rispettano `configWrites` dell'account di destinazione.
- `/usage` controlla il piè di pagina dell'utilizzo per risposta; `/usage cost` stampa un riepilogo locale dei costi dai log di sessione OpenClaw.
- `/restart` è abilitato per default; imposta `commands.restart: false` per disabilitarlo.
- Comando nativo solo Discord: `/vc join|leave|status` controlla i canali vocali (richiede `channels.discord.voice` e comandi nativi; non disponibile come testo).
- I comandi Discord di associazione ai thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) richiedono che le associazioni ai thread effettive siano abilitate (`session.threadBindings.enabled` e/o `channels.discord.threadBindings.enabled`).
- Riferimento dei comandi ACP e comportamento del runtime: [Agenti ACP](/tools/acp-agents).
- `/verbose` è pensato per debugging e visibilità aggiuntiva; tienilo **disattivato** nell'uso normale.
- `/fast on|off` rende persistente una sovrascrittura della sessione. Usa l'opzione `inherit` nella UI Sessions per cancellarla e tornare ai valori predefiniti della configurazione.
- `/fast` è specifico del provider: OpenAI/OpenAI Codex lo mappano a `service_tier=priority` sugli endpoint Responses nativi, mentre le richieste Anthropic pubbliche dirette, incluso il traffico autenticato OAuth inviato a `api.anthropic.com`, lo mappano a `service_tier=auto` o `standard_only`. Vedi [OpenAI](/it/providers/openai) e [Anthropic](/it/providers/anthropic).
- I riepiloghi dei fallimenti degli strumenti vengono comunque mostrati quando rilevanti, ma il testo dettagliato dei fallimenti è incluso solo quando `/verbose` è `on` o `full`.
- `/reasoning` (e `/verbose`) sono rischiosi nelle impostazioni di gruppo: potrebbero rivelare reasoning interno o output degli strumenti che non intendevi esporre. Preferisci lasciarli disattivati, soprattutto nelle chat di gruppo.
- `/model` rende subito persistente il nuovo modello della sessione.
- Se l'agente è inattivo, la successiva esecuzione lo userà immediatamente.
- Se un'esecuzione è già attiva, OpenClaw contrassegna uno switch live come in sospeso e riavvia nel nuovo modello solo in un punto pulito di retry.
- Se l'attività degli strumenti o l'output della risposta sono già iniziati, lo switch in sospeso può restare in coda fino a una successiva opportunità di retry o al turno utente seguente.
- **Percorso rapido:** i messaggi composti solo da comandi da mittenti in allowlist vengono gestiti immediatamente (bypass della coda + modello).
- **Blocco per menzioni nei gruppi:** i messaggi composti solo da comandi da mittenti in allowlist bypassano i requisiti di menzione.
- **Scorciatoie inline (solo mittenti in allowlist):** alcuni comandi funzionano anche quando incorporati in un normale messaggio e vengono rimossi prima che il modello veda il testo rimanente.
  - Esempio: `hey /status` attiva una risposta di stato e il testo rimanente continua nel flusso normale.
- Attualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- I messaggi composti solo da comandi non autorizzati vengono ignorati in silenzio e i token inline `/...` vengono trattati come testo normale.
- **Comandi skill:** le skill `user-invocable` sono esposte come comandi slash. I nomi vengono sanificati in `a-z0-9_` (massimo 32 caratteri); le collisioni ricevono suffissi numerici (es. `_2`).
  - `/skill <name> [input]` esegue una skill per nome (utile quando i limiti dei comandi nativi impediscono comandi per singola skill).
  - Per default, i comandi skill vengono inoltrati al modello come una richiesta normale.
  - Le skill possono opzionalmente dichiarare `command-dispatch: tool` per instradare il comando direttamente a uno strumento (deterministico, senza modello).
  - Esempio: `/prose` (plugin OpenProse) — vedi [OpenProse](/it/prose).
- **Argomenti dei comandi nativi:** Discord usa l'autocomplete per le opzioni dinamiche (e menu a pulsanti quando ometti argomenti obbligatori). Telegram e Slack mostrano un menu a pulsanti quando un comando supporta scelte e ometti l'argomento.

## `/tools`

`/tools` risponde a una domanda di runtime, non di configurazione: **cosa può usare questo agente in questo momento in
questa conversazione**.

- Il valore predefinito di `/tools` è compatto e ottimizzato per una scansione rapida.
- `/tools verbose` aggiunge brevi descrizioni.
- Le superfici con comandi nativi che supportano argomenti espongono lo stesso selettore di modalità `compact|verbose`.
- I risultati hanno ambito di sessione, quindi cambiare agente, canale, thread, autorizzazione del mittente o modello può
  modificarne l'output.
- `/tools` include gli strumenti effettivamente raggiungibili a runtime, compresi strumenti core, strumenti
  plugin connessi e strumenti di proprietà del canale.

Per modificare profili e sovrascritture, usa il pannello Tools della Control UI o le superfici config/catalog invece
di trattare `/tools` come un catalogo statico.

## Superfici di utilizzo (cosa viene mostrato dove)

- **Utilizzo/quota del provider** (esempio: “Claude 80% left”) compare in `/status` per il provider del modello corrente quando il tracciamento dell'utilizzo è abilitato. OpenClaw normalizza le finestre dei provider a `% left`; per MiniMax, i campi percentuali solo-rimanenti vengono invertiti prima della visualizzazione e le risposte `model_remains` preferiscono la voce del modello chat più un'etichetta del piano con tag del modello.
- **Righe token/cache** in `/status` possono ricorrere all'ultima voce di utilizzo della trascrizione quando lo snapshot live della sessione è scarso. I valori live esistenti e diversi da zero restano comunque prioritari, e il fallback della trascrizione può anche recuperare l'etichetta del modello runtime attivo più un totale orientato al prompt più grande quando i totali memorizzati mancano o sono inferiori.
- **Token/costo per risposta** è controllato da `/usage off|tokens|full` (aggiunto alle normali risposte).
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

- `/model` e `/model list` mostrano un selettore compatto numerato (famiglia di modelli + provider disponibili).
- Su Discord, `/model` e `/models` aprono un selettore interattivo con menu a discesa per provider e modello più un passaggio Submit.
- `/model <#>` seleziona da quel selettore (e preferisce il provider corrente quando possibile).
- `/model status` mostra la vista dettagliata, incluso l'endpoint configurato del provider (`baseUrl`) e la modalità API (`api`) quando disponibili.

## Sovrascritture di debug

`/debug` ti permette di impostare sovrascritture di configurazione **solo runtime** (in memoria, non su disco). Solo proprietario. Disabilitato per default; abilitalo con `commands.debug: true`.

Esempi:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Note:

- Le sovrascritture si applicano immediatamente alle nuove letture di configurazione, ma **non** scrivono in `openclaw.json`.
- Usa `/debug reset` per cancellare tutte le sovrascritture e tornare alla configurazione su disco.

## Aggiornamenti della configurazione

`/config` scrive nella configurazione su disco (`openclaw.json`). Solo proprietario. Disabilitato per default; abilitalo con `commands.config: true`.

Esempi:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Note:

- La configurazione viene validata prima della scrittura; le modifiche non valide vengono rifiutate.
- Gli aggiornamenti `/config` persistono tra i riavvii.

## Aggiornamenti MCP

`/mcp` scrive le definizioni del server MCP gestite da OpenClaw sotto `mcp.servers`. Solo proprietario. Disabilitato per default; abilitalo con `commands.mcp: true`.

Esempi:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Note:

- `/mcp` memorizza la configurazione nella configurazione OpenClaw, non nelle impostazioni del progetto di proprietà di Pi.
- Gli adapter runtime decidono quali trasporti siano effettivamente eseguibili.

## Aggiornamenti dei plugin

`/plugins` permette agli operatori di ispezionare i plugin rilevati e attivarne/disattivarne l'abilitazione nella configurazione. I flussi in sola lettura possono usare `/plugin` come alias. Disabilitato per default; abilitalo con `commands.plugins: true`.

Esempi:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Note:

- `/plugins list` e `/plugins show` usano la reale rilevazione dei plugin rispetto al workspace corrente più la configurazione su disco.
- `/plugins enable|disable` aggiorna solo la configurazione del plugin; non installa né disinstalla i plugin.
- Dopo modifiche di abilitazione/disabilitazione, riavvia il gateway per applicarle.

## Note sulle superfici

- **Comandi testuali** vengono eseguiti nella normale sessione chat (i DM condividono `main`, i gruppi hanno la propria sessione).
- **Comandi nativi** usano sessioni isolate:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefisso configurabile tramite `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (punta alla sessione chat tramite `CommandTargetSessionKey`)
- **`/stop`** punta alla sessione chat attiva in modo da poter interrompere l'esecuzione corrente.
- **Slack:** `channels.slack.slashCommand` è ancora supportato per un singolo comando in stile `/openclaw`. Se abiliti `commands.native`, devi creare un comando slash Slack per ogni comando integrato (stessi nomi di `/help`). I menu argomenti dei comandi per Slack vengono forniti come pulsanti effimeri Block Kit.
  - Eccezione nativa Slack: registra `/agentstatus` (non `/status`) perché Slack riserva `/status`. Il testo `/status` continua a funzionare nei messaggi Slack.

## Domande laterali BTW

`/btw` è una rapida **domanda laterale** sulla sessione corrente.

A differenza della normale chat:

- usa la sessione corrente come contesto di sfondo,
- viene eseguita come chiamata one-shot separata **senza strumenti**,
- non modifica il contesto futuro della sessione,
- non viene scritta nella cronologia della trascrizione,
- viene consegnata come risultato laterale live invece che come normale messaggio dell'assistente.

Questo rende `/btw` utile quando vuoi un chiarimento temporaneo mentre il compito
principale continua.

Esempio:

```text
/btw cosa stiamo facendo in questo momento?
```

Vedi [Domande laterali BTW](/tools/btw) per il comportamento completo e i dettagli
dell'esperienza utente client.
