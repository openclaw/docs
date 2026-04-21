---
read_when:
    - Usare o configurare i comandi della chat
    - Debug del routing dei comandi o delle autorizzazioni
summary: 'Comandi slash: testo vs nativi, configurazione e comandi supportati'
title: Comandi slash
x-i18n:
    generated_at: "2026-04-21T17:45:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26923608329ba2aeece2d4bc8edfa40ae86e03719a9f590f26ff79f57d97521d
    source_path: tools/slash-commands.md
    workflow: 15
---

# Comandi slash

I comandi sono gestiti dal Gateway. La maggior parte dei comandi deve essere inviata come messaggio **autonomo** che inizia con `/`.
Il comando di chat bash solo host usa `! <cmd>` (con `/bash <cmd>` come alias).

Esistono due sistemi correlati:

- **Comandi**: messaggi `/...` autonomi.
- **Direttive**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Le direttive vengono rimosse dal messaggio prima che il modello lo veda.
  - Nei normali messaggi di chat (non composti solo da direttive), vengono trattate come “suggerimenti inline” e **non** mantengono le impostazioni della sessione.
  - Nei messaggi composti solo da direttive (il messaggio contiene solo direttive), persistono nella sessione e rispondono con una conferma.
  - Le direttive vengono applicate solo ai **mittenti autorizzati**. Se `commands.allowFrom` è impostato, è l'unica
    allowlist usata; altrimenti l'autorizzazione deriva dalle allowlist/associazione del canale più `commands.useAccessGroups`.
    I mittenti non autorizzati vedono le direttive trattate come testo normale.

Esistono anche alcune **scorciatoie inline** (solo mittenti in allowlist/autorizzati): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Vengono eseguite immediatamente, rimosse prima che il modello veda il messaggio, e il testo rimanente continua nel flusso normale.

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

- `commands.text` (predefinito `true`) abilita il parsing di `/...` nei messaggi di chat.
  - Sulle superfici senza comandi nativi (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), i comandi testuali continuano a funzionare anche se lo imposti su `false`.
- `commands.native` (predefinito `"auto"`) registra i comandi nativi.
  - Auto: attivo per Discord/Telegram; disattivo per Slack (finché non aggiungi i comandi slash); ignorato per i provider senza supporto nativo.
  - Imposta `channels.discord.commands.native`, `channels.telegram.commands.native` o `channels.slack.commands.native` per sovrascrivere per provider (bool o `"auto"`).
  - `false` cancella i comandi registrati in precedenza su Discord/Telegram all'avvio. I comandi Slack sono gestiti nell'app Slack e non vengono rimossi automaticamente.
- `commands.nativeSkills` (predefinito `"auto"`) registra i comandi **skill** in modo nativo quando supportato.
  - Auto: attivo per Discord/Telegram; disattivo per Slack (Slack richiede la creazione di un comando slash per skill).
  - Imposta `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` o `channels.slack.commands.nativeSkills` per sovrascrivere per provider (bool o `"auto"`).
- `commands.bash` (predefinito `false`) abilita `! <cmd>` per eseguire comandi della shell host (`/bash <cmd>` è un alias; richiede le allowlist `tools.elevated`).
- `commands.bashForegroundMs` (predefinito `2000`) controlla per quanto tempo bash attende prima di passare alla modalità in background (`0` manda subito in background).
- `commands.config` (predefinito `false`) abilita `/config` (legge/scrive `openclaw.json`).
- `commands.mcp` (predefinito `false`) abilita `/mcp` (legge/scrive la configurazione MCP gestita da OpenClaw sotto `mcp.servers`).
- `commands.plugins` (predefinito `false`) abilita `/plugins` (individuazione/stato dei plugin più controlli di installazione e abilitazione/disabilitazione).
- `commands.debug` (predefinito `false`) abilita `/debug` (override solo runtime).
- `commands.restart` (predefinito `true`) abilita `/restart` più le azioni degli strumenti di riavvio del gateway.
- `commands.ownerAllowFrom` (opzionale) imposta l'allowlist esplicita del proprietario per le superfici di comandi/strumenti solo proprietario. È separata da `commands.allowFrom`.
- `commands.ownerDisplay` controlla come gli ID del proprietario appaiono nel system prompt: `raw` o `hash`.
- `commands.ownerDisplaySecret` imposta facoltativamente il segreto HMAC usato quando `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (opzionale) imposta un'allowlist per provider per l'autorizzazione dei comandi. Quando configurata, è l'
  unica fonte di autorizzazione per comandi e direttive (`commands.useAccessGroups`
  e le allowlist/associazione del canale vengono ignorati). Usa `"*"` per un valore predefinito globale; le chiavi specifiche del provider lo sovrascrivono.
- `commands.useAccessGroups` (predefinito `true`) applica allowlist/policy ai comandi quando `commands.allowFrom` non è impostato.

## Elenco dei comandi

Fonte di riferimento attuale:

- i built-in core provengono da `src/auto-reply/commands-registry.shared.ts`
- i comandi dock generati provengono da `src/auto-reply/commands-registry.data.ts`
- i comandi dei plugin provengono dalle chiamate `registerCommand()` dei plugin
- la disponibilità effettiva sul tuo gateway dipende comunque dai flag di configurazione, dalla superficie del canale e dai plugin installati/abilitati

### Comandi built-in core

Comandi built-in disponibili oggi:

- `/new [model]` avvia una nuova sessione; `/reset` è l'alias di reset.
- `/reset soft [message]` mantiene la trascrizione corrente, elimina gli ID di sessione del backend CLI riutilizzati e riesegue in-place il caricamento del prompt di avvio/sistema.
- `/compact [instructions]` compatta il contesto della sessione. Vedi [/concepts/compaction](/it/concepts/compaction).
- `/stop` interrompe l'esecuzione corrente.
- `/session idle <duration|off>` e `/session max-age <duration|off>` gestiscono la scadenza del binding del thread.
- `/think <level>` imposta il livello di pensiero. Le opzioni provengono dal profilo provider del modello attivo; i livelli comuni sono `off`, `minimal`, `low`, `medium` e `high`, con livelli personalizzati come `xhigh`, `adaptive`, `max` o `on` binario solo dove supportato. Alias: `/thinking`, `/t`.
- `/verbose on|off|full` attiva o disattiva l'output verboso. Alias: `/v`.
- `/trace on|off` attiva o disattiva l'output di trace del plugin per la sessione corrente.
- `/fast [status|on|off]` mostra o imposta la modalità veloce.
- `/reasoning [on|off|stream]` attiva o disattiva la visibilità del reasoning. Alias: `/reason`.
- `/elevated [on|off|ask|full]` attiva o disattiva la modalità elevated. Alias: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` mostra o imposta i valori predefiniti di exec.
- `/model [name|#|status]` mostra o imposta il modello.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` elenca i provider o i modelli di un provider.
- `/queue <mode>` gestisce il comportamento della coda (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) più opzioni come `debounce:2s cap:25 drop:summarize`.
- `/help` mostra il riepilogo della guida breve.
- `/commands` mostra il catalogo dei comandi generato.
- `/tools [compact|verbose]` mostra cosa l'agente corrente può usare in questo momento.
- `/status` mostra lo stato di runtime, compreso l'uso/la quota del provider quando disponibile.
- `/tasks` elenca le attività in background attive/recenti per la sessione corrente.
- `/context [list|detail|json]` spiega come viene assemblato il contesto.
- `/export-session [path]` esporta la sessione corrente in HTML. Alias: `/export`.
- `/whoami` mostra il tuo ID mittente. Alias: `/id`.
- `/skill <name> [input]` esegue una skill per nome.
- `/allowlist [list|add|remove] ...` gestisce le voci dell'allowlist. Solo testo.
- `/approve <id> <decision>` risolve le richieste di approvazione exec.
- `/btw <question>` pone una domanda laterale senza cambiare il contesto futuro della sessione. Vedi [/tools/btw](/it/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` gestisce le esecuzioni dei sub-agent per la sessione corrente.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gestisce le sessioni ACP e le opzioni di runtime.
- `/focus <target>` associa il thread Discord o l'argomento/conversazione Telegram correnti a una destinazione di sessione.
- `/unfocus` rimuove l'associazione corrente.
- `/agents` elenca gli agenti associati al thread per la sessione corrente.
- `/kill <id|#|all>` interrompe uno o tutti i sub-agent in esecuzione.
- `/steer <id|#> <message>` invia steering a un sub-agent in esecuzione. Alias: `/tell`.
- `/config show|get|set|unset` legge o scrive `openclaw.json`. Solo proprietario. Richiede `commands.config: true`.
- `/mcp show|get|set|unset` legge o scrive la configurazione del server MCP gestita da OpenClaw sotto `mcp.servers`. Solo proprietario. Richiede `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` ispeziona o modifica lo stato dei plugin. `/plugin` è un alias. Solo proprietario per le scritture. Richiede `commands.plugins: true`.
- `/debug show|set|unset|reset` gestisce gli override di configurazione solo runtime. Solo proprietario. Richiede `commands.debug: true`.
- `/usage off|tokens|full|cost` controlla il footer di utilizzo per risposta o stampa un riepilogo locale dei costi.
- `/tts on|off|status|provider|limit|summary|audio|help` controlla TTS. Vedi [/tools/tts](/it/tools/tts).
- `/restart` riavvia OpenClaw quando abilitato. Predefinito: abilitato; imposta `commands.restart: false` per disabilitarlo.
- `/activation mention|always` imposta la modalità di attivazione del gruppo.
- `/send on|off|inherit` imposta la policy di invio. Solo proprietario.
- `/bash <command>` esegue un comando della shell host. Solo testo. Alias: `! <command>`. Richiede `commands.bash: true` più le allowlist `tools.elevated`.
- `!poll [sessionId]` controlla un job bash in background.
- `!stop [sessionId]` ferma un job bash in background.

### Comandi dock generati

I comandi dock sono generati dai plugin di canale con supporto ai comandi nativi. Set bundled attuale:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Comandi dei plugin bundled

I plugin bundled possono aggiungere altri comandi slash. Comandi bundled attuali in questo repository:

- `/dreaming [on|off|status|help]` attiva o disattiva il dreaming della memoria. Vedi [Dreaming](/it/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gestisce il flusso di associazione/configurazione del dispositivo. Vedi [Pairing](/it/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` arma temporaneamente i comandi del nodo telefono ad alto rischio.
- `/voice status|list [limit]|set <voiceId|name>` gestisce la configurazione della voce Talk. Su Discord, il nome del comando nativo è `/talkvoice`.
- `/card ...` invia preset di rich card LINE. Vedi [LINE](/it/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` ispeziona e controlla l'harness app-server Codex bundled. Vedi [Codex Harness](/it/plugins/codex-harness).
- Comandi solo QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Comandi skill dinamici

Anche le Skills invocabili dall'utente sono esposte come comandi slash:

- `/skill <name> [input]` funziona sempre come punto di ingresso generico.
- le skill possono anche apparire come comandi diretti come `/prose` quando la skill/il plugin li registra.
- la registrazione nativa dei comandi skill è controllata da `commands.nativeSkills` e `channels.<provider>.commands.nativeSkills`.

Note:

- I comandi accettano facoltativamente `:` tra il comando e gli argomenti (per esempio `/think: high`, `/send: on`, `/help:`).
- `/new <model>` accetta un alias di modello, `provider/model` o un nome provider (corrispondenza fuzzy); se non c'è corrispondenza, il testo viene trattato come corpo del messaggio.
- Per il dettaglio completo dell'utilizzo del provider, usa `openclaw status --usage`.
- `/allowlist add|remove` richiede `commands.config=true` e rispetta `configWrites` del canale.
- Nei canali multi-account, anche `/allowlist --account <id>` orientato alla configurazione e `/config set channels.<provider>.accounts.<id>...` rispettano `configWrites` dell'account di destinazione.
- `/usage` controlla il footer di utilizzo per risposta; `/usage cost` stampa un riepilogo locale dei costi dai log di sessione di OpenClaw.
- `/restart` è abilitato per impostazione predefinita; imposta `commands.restart: false` per disabilitarlo.
- `/plugins install <spec>` accetta le stesse specifiche plugin di `openclaw plugins install`: percorso/archivio locale, pacchetto npm oppure `clawhub:<pkg>`.
- `/plugins enable|disable` aggiorna la configurazione del plugin e può richiedere un riavvio.
- Comando nativo solo Discord: `/vc join|leave|status` controlla i canali vocali (richiede `channels.discord.voice` e i comandi nativi; non disponibile come testo).
- I comandi Discord di binding del thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) richiedono che i thread binding effettivi siano abilitati (`session.threadBindings.enabled` e/o `channels.discord.threadBindings.enabled`).
- Riferimento del comando ACP e comportamento di runtime: [ACP Agents](/it/tools/acp-agents).
- `/verbose` è pensato per il debug e per una visibilità aggiuntiva; mantienilo **off** nell'uso normale.
- `/trace` è più ristretto di `/verbose`: mostra solo le righe di trace/debug proprie del plugin e mantiene disattivo il normale chatter verboso di strumenti.
- `/fast on|off` rende persistente un override di sessione. Usa l'opzione `inherit` nella UI Sessioni per cancellarlo e tornare ai valori predefiniti della configurazione.
- `/fast` è specifico del provider: OpenAI/OpenAI Codex lo mappano a `service_tier=priority` sugli endpoint nativi Responses, mentre le richieste Anthropic pubbliche dirette, incluso il traffico autenticato via OAuth inviato a `api.anthropic.com`, lo mappano a `service_tier=auto` o `standard_only`. Vedi [OpenAI](/it/providers/openai) e [Anthropic](/it/providers/anthropic).
- I riepiloghi dei fallimenti degli strumenti vengono comunque mostrati quando pertinenti, ma il testo dettagliato del fallimento è incluso solo quando `/verbose` è `on` o `full`.
- `/reasoning`, `/verbose` e `/trace` sono rischiosi nelle impostazioni di gruppo: possono rivelare reasoning interno, output degli strumenti o diagnostica dei plugin che non intendevi esporre. È preferibile lasciarli disattivati, soprattutto nelle chat di gruppo.
- `/model` rende persistente immediatamente il nuovo modello della sessione.
- Se l'agente è inattivo, l'esecuzione successiva lo usa subito.
- Se un'esecuzione è già attiva, OpenClaw contrassegna uno switch live come in sospeso e riavvia nel nuovo modello solo a un punto pulito di retry.
- Se l'attività degli strumenti o l'output della risposta sono già iniziati, lo switch in sospeso può restare in coda fino a una successiva opportunità di retry o al prossimo turno utente.
- **Percorso veloce:** i messaggi composti solo da comandi provenienti da mittenti in allowlist vengono gestiti immediatamente (saltano coda + modello).
- **Controllo tramite menzione nei gruppi:** i messaggi composti solo da comandi provenienti da mittenti in allowlist saltano i requisiti di menzione.
- **Scorciatoie inline (solo mittenti in allowlist):** alcuni comandi funzionano anche se incorporati in un messaggio normale e vengono rimossi prima che il modello veda il testo rimanente.
  - Esempio: `hey /status` attiva una risposta di stato, e il testo rimanente continua nel flusso normale.
- Attualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- I messaggi composti solo da comandi non autorizzati vengono ignorati silenziosamente, e i token inline `/...` vengono trattati come testo normale.
- **Comandi skill:** le Skills `user-invocable` sono esposte come comandi slash. I nomi vengono sanificati in `a-z0-9_` (massimo 32 caratteri); le collisioni ricevono suffissi numerici (per esempio `_2`).
  - `/skill <name> [input]` esegue una skill per nome (utile quando i limiti dei comandi nativi impediscono comandi per singola skill).
  - Per impostazione predefinita, i comandi skill vengono inoltrati al modello come una richiesta normale.
  - Le skill possono dichiarare facoltativamente `command-dispatch: tool` per instradare il comando direttamente a uno strumento (deterministico, senza modello).
  - Esempio: `/prose` (plugin OpenProse) — vedi [OpenProse](/it/prose).
- **Argomenti dei comandi nativi:** Discord usa l'autocompletamento per le opzioni dinamiche (e menu a pulsanti quando ometti argomenti obbligatori). Telegram e Slack mostrano un menu a pulsanti quando un comando supporta scelte e ometti l'argomento.

## `/tools`

`/tools` risponde a una domanda di runtime, non di configurazione: **che cosa questo agente può usare in questo momento in
questa conversazione**.

- Il valore predefinito di `/tools` è compatto e ottimizzato per una rapida scansione.
- `/tools verbose` aggiunge brevi descrizioni.
- Le superfici con comandi nativi che supportano argomenti espongono lo stesso selettore di modalità `compact|verbose`.
- I risultati sono limitati alla sessione, quindi cambiare agente, canale, thread, autorizzazione del mittente o modello può
  modificare l'output.
- `/tools` include gli strumenti effettivamente raggiungibili a runtime, inclusi strumenti core, strumenti di plugin collegati e strumenti del canale.

Per modificare profili e override, usa il pannello Tools della UI Control o le superfici config/catalogo invece
di trattare `/tools` come un catalogo statico.

## Superfici di utilizzo (cosa appare dove)

- **Utilizzo/quota del provider** (esempio: “Claude 80% left”) appare in `/status` per il provider del modello corrente quando il tracciamento dell'utilizzo è abilitato. OpenClaw normalizza le finestre del provider in `% left`; per MiniMax, i campi percentuali solo-rimanenti vengono invertiti prima della visualizzazione, e le risposte `model_remains` privilegiano la voce del modello chat più un'etichetta di piano associata al modello.
- Le **righe token/cache** in `/status` possono usare come fallback l'ultima voce di utilizzo della trascrizione quando lo snapshot live della sessione è scarno. I valori live esistenti e diversi da zero mantengono comunque la priorità, e il fallback dalla trascrizione può anche recuperare l'etichetta del modello di runtime attivo più un totale più ampio orientato al prompt quando i totali memorizzati mancano o sono inferiori.
- I **token/costo per risposta** sono controllati da `/usage off|tokens|full` (aggiunti alle risposte normali).
- `/model status` riguarda **modelli/auth/endpoint**, non l'utilizzo.

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
- `/model status` mostra la vista dettagliata, incluso l'endpoint del provider configurato (`baseUrl`) e la modalità API (`api`) quando disponibili.

## Override di debug

`/debug` ti permette di impostare override di configurazione **solo runtime** (in memoria, non su disco). Solo proprietario. Disabilitato per impostazione predefinita; abilitalo con `commands.debug: true`.

Esempi:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Note:

- Gli override si applicano immediatamente alle nuove letture della configurazione, ma **non** scrivono in `openclaw.json`.
- Usa `/debug reset` per cancellare tutti gli override e tornare alla configurazione su disco.

## Output di trace del plugin

`/trace` ti permette di attivare o disattivare le **righe di trace/debug del plugin limitate alla sessione** senza attivare la modalità verbosa completa.

Esempi:

```text
/trace
/trace on
/trace off
```

Note:

- `/trace` senza argomenti mostra lo stato trace corrente della sessione.
- `/trace on` abilita le righe di trace del plugin per la sessione corrente.
- `/trace off` le disabilita di nuovo.
- Le righe di trace del plugin possono apparire in `/status` e come messaggio diagnostico di follow-up dopo la normale risposta dell'assistente.
- `/trace` non sostituisce `/debug`; `/debug` continua a gestire gli override di configurazione solo runtime.
- `/trace` non sostituisce `/verbose`; il normale output verboso di strumenti/stato continua a appartenere a `/verbose`.

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

Note:

- La configurazione viene validata prima della scrittura; le modifiche non valide vengono rifiutate.
- Gli aggiornamenti di `/config` persistono tra i riavvii.

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

- `/mcp` memorizza la configurazione nella configurazione di OpenClaw, non nelle impostazioni del progetto possedute da Pi.
- Gli adattatori di runtime decidono quali trasporti sono effettivamente eseguibili.

## Aggiornamenti dei plugin

`/plugins` permette agli operatori di ispezionare i plugin individuati e attivare/disattivare l'abilitazione nella configurazione. I flussi in sola lettura possono usare `/plugin` come alias. Disabilitato per impostazione predefinita; abilitalo con `commands.plugins: true`.

Esempi:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Note:

- `/plugins list` e `/plugins show` usano il rilevamento reale dei plugin rispetto al workspace corrente più la configurazione su disco.
- `/plugins enable|disable` aggiorna solo la configurazione del plugin; non installa né disinstalla plugin.
- Dopo modifiche di enable/disable, riavvia il gateway per applicarle.

## Note sulla superficie

- I **comandi testuali** vengono eseguiti nella normale sessione di chat (i DM condividono `main`, i gruppi hanno la propria sessione).
- I **comandi nativi** usano sessioni isolate:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefisso configurabile tramite `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (punta alla sessione della chat tramite `CommandTargetSessionKey`)
- **`/stop`** punta alla sessione di chat attiva così può interrompere l'esecuzione corrente.
- **Slack:** `channels.slack.slashCommand` è ancora supportato per un singolo comando in stile `/openclaw`. Se abiliti `commands.native`, devi creare un comando slash Slack per ogni comando built-in (stessi nomi di `/help`). I menu degli argomenti dei comandi per Slack vengono forniti come pulsanti Block Kit effimeri.
  - Eccezione nativa Slack: registra `/agentstatus` (non `/status`) perché Slack riserva `/status`. Il comando testuale `/status` continua a funzionare nei messaggi Slack.

## Domande laterali BTW

`/btw` è una rapida **domanda laterale** sulla sessione corrente.

A differenza della chat normale:

- usa la sessione corrente come contesto di sfondo,
- viene eseguito come chiamata one-shot separata **senza strumenti**,
- non modifica il contesto futuro della sessione,
- non viene scritto nella cronologia della trascrizione,
- viene consegnato come risultato laterale live invece che come normale messaggio dell'assistente.

Questo rende `/btw` utile quando vuoi un chiarimento temporaneo mentre l'attività principale
continua.

Esempio:

```text
/btw what are we doing right now?
```

Vedi [BTW Side Questions](/it/tools/btw) per il comportamento completo e i dettagli
della UX del client.
