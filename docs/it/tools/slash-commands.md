---
read_when:
    - Usare o configurare i comandi della chat
    - Debuggare l'instradamento dei comandi o i permessi
sidebarTitle: Slash commands
summary: 'Comandi slash: testo vs nativi, configurazione e comandi supportati'
title: Comandi slash
x-i18n:
    generated_at: "2026-04-26T11:40:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75bf58d02738e30bfdc00ad1c264b2f066eebd2819f4ea0209f504f279755993
    source_path: tools/slash-commands.md
    workflow: 15
---

I comandi sono gestiti dal Gateway. La maggior parte dei comandi deve essere inviata come messaggio **autonomo** che inizia con `/`. Il comando bash della chat solo host usa `! <cmd>` (con `/bash <cmd>` come alias).

Quando una conversazione o un thread è associato a una sessione ACP, il normale testo di follow-up viene instradato a quell'harness ACP. I comandi di gestione del Gateway restano comunque locali: `/acp ...` raggiunge sempre il gestore dei comandi ACP di OpenClaw, e `/status` più `/unfocus` restano locali ogni volta che la gestione dei comandi è abilitata per quella superficie.

Esistono due sistemi correlati:

<AccordionGroup>
  <Accordion title="Comandi">
    Messaggi `/...` autonomi.
  </Accordion>
  <Accordion title="Direttive">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Le direttive vengono rimosse dal messaggio prima che il modello lo veda.
    - Nei normali messaggi di chat (non composti solo da direttive), sono trattate come "suggerimenti inline" e **non** rendono persistenti le impostazioni della sessione.
    - Nei messaggi composti solo da direttive (il messaggio contiene solo direttive), diventano persistenti nella sessione e rispondono con una conferma.
    - Le direttive vengono applicate solo ai **mittenti autorizzati**. Se `commands.allowFrom` è impostato, è l'unica allowlist usata; altrimenti l'autorizzazione deriva dalle allowlist/associazioni del canale più `commands.useAccessGroups`. I mittenti non autorizzati vedono le direttive trattate come testo semplice.

  </Accordion>
  <Accordion title="Scorciatoie inline">
    Solo per mittenti inclusi nell'allowlist/autorizzati: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    Vengono eseguite immediatamente, sono rimosse prima che il modello veda il messaggio e il testo rimanente continua attraverso il flusso normale.

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
  Abilita il parsing di `/...` nei messaggi di chat. Nelle superfici senza comandi nativi (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), i comandi testuali continuano a funzionare anche se imposti questo valore su `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registra i comandi nativi. Auto: attivo per Discord/Telegram; disattivo per Slack (finché non aggiungi i comandi slash); ignorato per i provider senza supporto nativo. Imposta `channels.discord.commands.native`, `channels.telegram.commands.native` o `channels.slack.commands.native` per sovrascrivere per singolo provider (bool oppure `"auto"`). `false` cancella all'avvio i comandi registrati in precedenza su Discord/Telegram. I comandi Slack sono gestiti nell'app Slack e non vengono rimossi automaticamente.
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registra in modo nativo i comandi **skill** quando supportato. Auto: attivo per Discord/Telegram; disattivo per Slack (Slack richiede la creazione di un comando slash per ogni skill). Imposta `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` o `channels.slack.commands.nativeSkills` per sovrascrivere per singolo provider (bool oppure `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Abilita `! <cmd>` per eseguire comandi della shell host (`/bash <cmd>` è un alias; richiede le allowlist `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Controlla per quanto tempo bash attende prima di passare alla modalità in background (`0` manda immediatamente in background).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Abilita `/config` (legge/scrive `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Abilita `/mcp` (legge/scrive la configurazione MCP gestita da OpenClaw sotto `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Abilita `/plugins` (rilevamento/stato dei plugin più controlli di installazione e abilitazione/disabilitazione).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Abilita `/debug` (override solo runtime).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Abilita `/restart` più le azioni dello strumento di riavvio del gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Imposta l'allowlist esplicita del proprietario per le superfici di comandi/strumenti riservate al proprietario. Separata da `commands.allowFrom`.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Per canale: fa sì che i comandi riservati al proprietario richiedano l'**identità del proprietario** per essere eseguiti su quella superficie. Quando è `true`, il mittente deve corrispondere a un candidato proprietario risolto (per esempio una voce in `commands.ownerAllowFrom` o metadati nativi del provider che identificano il proprietario) oppure avere l'ambito interno `operator.admin` su un canale di messaggi interno. Una voce wildcard in `allowFrom` del canale, o un elenco di candidati proprietari vuoto/non risolto, **non** è sufficiente: i comandi riservati al proprietario falliscono in modalità chiusa su quel canale. Lascia questa opzione disattivata se vuoi che i comandi riservati al proprietario siano controllati solo da `ownerAllowFrom` e dalle allowlist standard dei comandi.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Controlla come gli id del proprietario appaiono nel prompt di sistema.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Imposta facoltativamente il segreto HMAC usato quando `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Allowlist per provider per l'autorizzazione dei comandi. Quando configurata, è l'unica fonte di autorizzazione per comandi e direttive (le allowlist/associazioni del canale e `commands.useAccessGroups` vengono ignorate). Usa `"*"` per un valore predefinito globale; le chiavi specifiche del provider hanno la precedenza.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Applica allowlist/policy ai comandi quando `commands.allowFrom` non è impostato.
</ParamField>

## Elenco dei comandi

Fonte di verità corrente:

- i built-in del core provengono da `src/auto-reply/commands-registry.shared.ts`
- i comandi dock generati provengono da `src/auto-reply/commands-registry.data.ts`
- i comandi dei plugin provengono dalle chiamate `registerCommand()` dei plugin
- l'effettiva disponibilità sul tuo gateway dipende comunque dai flag di configurazione, dalla superficie del canale e dai plugin installati/abilitati

### Comandi built-in del core

<AccordionGroup>
  <Accordion title="Sessioni ed esecuzioni">
    - `/new [model]` avvia una nuova sessione; `/reset` è l'alias di reset.
    - `/reset soft [message]` mantiene la trascrizione corrente, elimina gli id di sessione backend CLI riutilizzati e riesegue il caricamento di avvio/prompt di sistema sul posto.
    - `/compact [instructions]` compatta il contesto della sessione. Vedi [Compaction](/it/concepts/compaction).
    - `/stop` interrompe l'esecuzione corrente.
    - `/session idle <duration|off>` e `/session max-age <duration|off>` gestiscono la scadenza dell'associazione al thread.
    - `/export-session [path]` esporta la sessione corrente in HTML. Alias: `/export`.
    - `/export-trajectory [path]` esporta un [trajectory bundle](/it/tools/trajectory) JSONL per la sessione corrente. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Modello e controlli di esecuzione">
    - `/think <level>` imposta il livello di ragionamento. Le opzioni provengono dal profilo provider del modello attivo; i livelli comuni sono `off`, `minimal`, `low`, `medium` e `high`, con livelli personalizzati come `xhigh`, `adaptive`, `max` oppure il binario `on` solo dove supportato. Alias: `/thinking`, `/t`.
    - `/verbose on|off|full` attiva o disattiva l'output verboso. Alias: `/v`.
    - `/trace on|off` attiva o disattiva l'output di trace dei plugin per la sessione corrente.
    - `/fast [status|on|off]` mostra o imposta la modalità rapida.
    - `/reasoning [on|off|stream]` attiva o disattiva la visibilità del ragionamento. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` attiva o disattiva la modalità elevata. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` mostra o imposta i valori predefiniti di exec.
    - `/model [name|#|status]` mostra o imposta il modello.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` elenca i provider o i modelli di un provider.
    - `/queue <mode>` gestisce il comportamento della coda (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) più opzioni come `debounce:2s cap:25 drop:summarize`.

  </Accordion>
  <Accordion title="Scoperta e stato">
    - `/help` mostra il riepilogo breve della guida.
    - `/commands` mostra il catalogo dei comandi generato.
    - `/tools [compact|verbose]` mostra cosa può usare in questo momento l'agente corrente.
    - `/status` mostra lo stato di esecuzione/runtime, incluse le etichette `Execution`/`Runtime` e l'uso/quota del provider quando disponibili.
    - `/crestodian <request>` esegue l'assistente di configurazione e riparazione Crestodian da un DM del proprietario.
    - `/tasks` elenca le attività in background attive/recenti per la sessione corrente.
    - `/context [list|detail|json]` spiega come viene assemblato il contesto.
    - `/whoami` mostra il tuo id mittente. Alias: `/id`.
    - `/usage off|tokens|full|cost` controlla il footer di utilizzo per risposta o stampa un riepilogo locale dei costi.

  </Accordion>
  <Accordion title="Skills, allowlist, approvazioni">
    - `/skill <name> [input]` esegue una skill per nome.
    - `/allowlist [list|add|remove] ...` gestisce le voci dell'allowlist. Solo testo.
    - `/approve <id> <decision>` risolve le richieste di approvazione exec.
    - `/btw <question>` pone una domanda laterale senza modificare il contesto futuro della sessione. Vedi [BTW](/it/tools/btw).

  </Accordion>
  <Accordion title="Subagent e ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` gestisce le esecuzioni dei sub-agent per la sessione corrente.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gestisce le sessioni ACP e le opzioni di runtime.
    - `/focus <target>` associa il thread Discord corrente o l'argomento/conversazione Telegram a una destinazione di sessione.
    - `/unfocus` rimuove l'associazione corrente.
    - `/agents` elenca gli agenti associati al thread per la sessione corrente.
    - `/kill <id|#|all>` interrompe uno o tutti i sub-agent in esecuzione.
    - `/steer <id|#> <message>` invia istruzioni a un sub-agent in esecuzione. Alias: `/tell`.

  </Accordion>
  <Accordion title="Scritture riservate al proprietario e amministrazione">
    - `/config show|get|set|unset` legge o scrive `openclaw.json`. Solo proprietario. Richiede `commands.config: true`.
    - `/mcp show|get|set|unset` legge o scrive la configurazione del server MCP gestita da OpenClaw sotto `mcp.servers`. Solo proprietario. Richiede `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` ispeziona o modifica lo stato dei plugin. `/plugin` è un alias. Solo proprietario per le scritture. Richiede `commands.plugins: true`.
    - `/debug show|set|unset|reset` gestisce gli override solo runtime della configurazione. Solo proprietario. Richiede `commands.debug: true`.
    - `/restart` riavvia OpenClaw quando abilitato. Predefinito: abilitato; imposta `commands.restart: false` per disabilitarlo.
    - `/send on|off|inherit` imposta la policy di invio. Solo proprietario.

  </Accordion>
  <Accordion title="Voce, TTS, controllo del canale">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` controlla il TTS. Vedi [TTS](/it/tools/tts).
    - `/activation mention|always` imposta la modalità di attivazione del gruppo.
    - `/bash <command>` esegue un comando della shell host. Solo testo. Alias: `! <command>`. Richiede `commands.bash: true` più le allowlist `tools.elevated`.
    - `!poll [sessionId]` controlla un job bash in background.
    - `!stop [sessionId]` arresta un job bash in background.

  </Accordion>
</AccordionGroup>

### Comandi dock generati

I comandi dock sono generati dai plugin di canale con supporto dei comandi nativi. Set integrato corrente:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

### Comandi dei plugin integrati

I plugin integrati possono aggiungere altri comandi slash. Comandi integrati correnti in questo repo:

- `/dreaming [on|off|status|help]` attiva o disattiva il dreaming della memoria. Vedi [Dreaming](/it/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gestisce il flusso di pairing/configurazione del dispositivo. Vedi [Pairing](/it/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` arma temporaneamente i comandi del Node del telefono ad alto rischio.
- `/voice status|list [limit]|set <voiceId|name>` gestisce la configurazione della voce Talk. Su Discord, il nome del comando nativo è `/talkvoice`.
- `/card ...` invia preset di rich card LINE. Vedi [LINE](/it/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` ispeziona e controlla l'harness app-server Codex integrato. Vedi [Codex harness](/it/plugins/codex-harness).
- Comandi solo QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Comandi skill dinamici

Le Skills richiamabili dall'utente sono esposte anche come comandi slash:

- `/skill <name> [input]` funziona sempre come punto di ingresso generico.
- le Skills possono anche apparire come comandi diretti come `/prose` quando la skill/il plugin li registra.
- la registrazione dei comandi skill nativi è controllata da `commands.nativeSkills` e `channels.<provider>.commands.nativeSkills`.

<AccordionGroup>
  <Accordion title="Note sugli argomenti e sul parser">
    - I comandi accettano facoltativamente `:` tra il comando e gli argomenti (per esempio `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` accetta un alias di modello, `provider/model` o un nome provider (corrispondenza fuzzy); se non c'è corrispondenza, il testo viene trattato come corpo del messaggio.
    - Per il dettaglio completo dell'utilizzo del provider, usa `openclaw status --usage`.
    - `/allowlist add|remove` richiede `commands.config=true` e rispetta `configWrites` del canale.
    - Nei canali multi-account, anche `/allowlist --account <id>` orientato alla configurazione e `/config set channels.<provider>.accounts.<id>...` rispettano `configWrites` dell'account di destinazione.
    - `/usage` controlla il footer di utilizzo per risposta; `/usage cost` stampa un riepilogo locale dei costi dai log di sessione OpenClaw.
    - `/restart` è abilitato per impostazione predefinita; imposta `commands.restart: false` per disabilitarlo.
    - `/plugins install <spec>` accetta le stesse specifiche plugin di `openclaw plugins install`: percorso/archive locale, pacchetto npm o `clawhub:<pkg>`.
    - `/plugins enable|disable` aggiorna la configurazione del plugin e può richiedere un riavvio.

  </Accordion>
  <Accordion title="Comportamento specifico del canale">
    - Comando nativo solo Discord: `/vc join|leave|status` controlla i canali vocali (non disponibile come testo). `join` richiede una guild e un canale vocale/stage selezionato. Richiede `channels.discord.voice` e comandi nativi.
    - I comandi di associazione ai thread Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) richiedono che le associazioni ai thread effettive siano abilitate (`session.threadBindings.enabled` e/o `channels.discord.threadBindings.enabled`).
    - Riferimento dei comandi ACP e comportamento runtime: [ACP agents](/it/tools/acp-agents).

  </Accordion>
  <Accordion title="Sicurezza di verbose / trace / fast / reasoning">
    - `/verbose` è pensato per il debug e per una visibilità aggiuntiva; mantienilo **disattivato** nell'uso normale.
    - `/trace` è più limitato di `/verbose`: rivela solo le righe di trace/debug dei plugin e mantiene disattivo il normale chatter verboso di strumenti.
    - `/fast on|off` rende persistente un override della sessione. Usa l'opzione `inherit` dell'interfaccia Sessions per cancellarlo e tornare ai valori predefiniti della configurazione.
    - `/fast` è specifico del provider: OpenAI/OpenAI Codex lo mappano a `service_tier=priority` sugli endpoint nativi Responses, mentre le richieste Anthropic pubbliche dirette, incluso il traffico autenticato OAuth inviato a `api.anthropic.com`, lo mappano a `service_tier=auto` o `standard_only`. Vedi [OpenAI](/it/providers/openai) e [Anthropic](/it/providers/anthropic).
    - I riepiloghi degli errori degli strumenti vengono comunque mostrati quando pertinenti, ma il testo dettagliato dell'errore è incluso solo quando `/verbose` è `on` o `full`.
    - `/reasoning`, `/verbose` e `/trace` sono rischiosi in contesti di gruppo: possono rivelare ragionamento interno, output degli strumenti o diagnostica dei plugin che non intendevi esporre. È preferibile lasciarli disattivati, soprattutto nelle chat di gruppo.

  </Accordion>
  <Accordion title="Cambio modello">
    - `/model` rende immediatamente persistente il nuovo modello della sessione.
    - Se l'agente è inattivo, l'esecuzione successiva lo usa subito.
    - Se un'esecuzione è già attiva, OpenClaw contrassegna un cambio live come in attesa e riavvia nel nuovo modello solo in un punto di retry pulito.
    - Se l'attività degli strumenti o l'output della risposta è già iniziato, il cambio in attesa può restare in coda fino a una successiva opportunità di retry o al turno utente seguente.
    - Nella TUI locale, `/crestodian [request]` ritorna dalla normale TUI dell'agente a Crestodian. Questo è separato dalla modalità rescue del canale di messaggi e non concede autorità di configurazione remota.

  </Accordion>
  <Accordion title="Percorso rapido e scorciatoie inline">
    - **Percorso rapido:** i messaggi composti solo da comandi provenienti da mittenti inclusi nell'allowlist vengono gestiti immediatamente (saltano coda + modello).
    - **Mention gating di gruppo:** i messaggi composti solo da comandi provenienti da mittenti inclusi nell'allowlist bypassano i requisiti di menzione.
    - **Scorciatoie inline (solo mittenti inclusi nell'allowlist):** alcuni comandi funzionano anche quando sono incorporati in un messaggio normale e vengono rimossi prima che il modello veda il testo rimanente.
      - Esempio: `hey /status` attiva una risposta di stato e il testo rimanente continua nel flusso normale.
    - Attualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - I messaggi composti solo da comandi ma non autorizzati vengono ignorati silenziosamente, e i token inline `/...` sono trattati come testo semplice.

  </Accordion>
  <Accordion title="Comandi skill e argomenti nativi">
    - **Comandi skill:** le Skills `user-invocable` sono esposte come comandi slash. I nomi vengono sanitizzati in `a-z0-9_` (massimo 32 caratteri); le collisioni ricevono suffissi numerici (per esempio `_2`).
      - `/skill <name> [input]` esegue una skill per nome (utile quando i limiti dei comandi nativi impediscono i comandi per singola skill).
      - Per impostazione predefinita, i comandi skill vengono inoltrati al modello come richiesta normale.
      - Le Skills possono facoltativamente dichiarare `command-dispatch: tool` per instradare il comando direttamente a uno strumento (deterministico, senza modello).
      - Esempio: `/prose` (plugin OpenProse) — vedi [OpenProse](/it/prose).
    - **Argomenti dei comandi nativi:** Discord usa l'autocompletamento per le opzioni dinamiche (e menu a pulsanti quando ometti argomenti obbligatori). Telegram e Slack mostrano un menu a pulsanti quando un comando supporta scelte e ometti l'argomento. Le scelte dinamiche vengono risolte rispetto al modello della sessione di destinazione, quindi le opzioni specifiche del modello come i livelli di `/think` seguono l'override `/model` di quella sessione.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` risponde a una domanda di runtime, non a una domanda di configurazione: **cosa questo agente può usare in questo momento in questa conversazione**.

- `/tools` predefinito è compatto e ottimizzato per una scansione rapida.
- `/tools verbose` aggiunge brevi descrizioni.
- Le superfici con comandi nativi che supportano argomenti espongono lo stesso cambio di modalità `compact|verbose`.
- I risultati sono limitati alla sessione, quindi cambiare agente, canale, thread, autorizzazione del mittente o modello può cambiare l'output.
- `/tools` include gli strumenti effettivamente raggiungibili a runtime, compresi strumenti core, strumenti di plugin connessi e strumenti posseduti dal canale.

Per modificare profili e override, usa il pannello Tools della Control UI o le superfici di configurazione/catalogo invece di trattare `/tools` come un catalogo statico.

## Superfici di utilizzo (cosa appare dove)

- **Utilizzo/quota del provider** (esempio: "Claude 80% left") appare in `/status` per il provider del modello corrente quando il tracciamento dell'utilizzo è abilitato. OpenClaw normalizza le finestre dei provider in `% left`; per MiniMax, i campi percentuali con solo il residuo vengono invertiti prima della visualizzazione e le risposte `model_remains` privilegiano la voce del modello chat più un'etichetta del piano con tag del modello.
- **Righe token/cache** in `/status` possono ricorrere all'ultima voce di utilizzo della trascrizione quando l'istantanea live della sessione è scarsa. I valori live esistenti diversi da zero hanno comunque la precedenza, e il fallback della trascrizione può anche recuperare l'etichetta del modello runtime attivo più un totale orientato al prompt più grande quando i totali memorizzati mancano o sono inferiori.
- **Execution vs runtime:** `/status` riporta `Execution` per il percorso sandbox effettivo e `Runtime` per chi sta effettivamente eseguendo la sessione: `OpenClaw Pi Default`, `OpenAI Codex`, un backend CLI o un backend ACP.
- **Token/costo per risposta** è controllato da `/usage off|tokens|full` (aggiunto alle risposte normali).
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

`/debug` consente di impostare override di configurazione **solo runtime** (in memoria, non su disco). Solo proprietario. Disabilitato per impostazione predefinita; abilitalo con `commands.debug: true`.

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

## Output di trace dei plugin

`/trace` consente di attivare o disattivare le **righe di trace/debug dei plugin limitate alla sessione** senza abilitare la modalità verbose completa.

Esempi:

```text
/trace
/trace on
/trace off
```

Note:

- `/trace` senza argomento mostra lo stato trace corrente della sessione.
- `/trace on` abilita le righe di trace dei plugin per la sessione corrente.
- `/trace off` le disabilita nuovamente.
- Le righe di trace dei plugin possono apparire in `/status` e come messaggio diagnostico di follow-up dopo la normale risposta dell'assistente.
- `/trace` non sostituisce `/debug`; `/debug` continua a gestire gli override di configurazione solo runtime.
- `/trace` non sostituisce `/verbose`; il normale output verbose di strumenti/stato continua ad appartenere a `/verbose`.

## Aggiornamenti della configurazione

`/config` scrive nella configurazione su disco (`openclaw.json`). Solo proprietario. Disabilitato per impostazione predefinita; abilitalo con `commands.config: true`.

Esempi:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
La configurazione viene validata prima della scrittura; le modifiche non valide vengono rifiutate. Gli aggiornamenti `/config` persistono tra i riavvii.
</Note>

## Aggiornamenti MCP

`/mcp` scrive le definizioni dei server MCP gestite da OpenClaw sotto `mcp.servers`. Solo proprietario. Disabilitato per impostazione predefinita; abilitalo con `commands.mcp: true`.

Esempi:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` memorizza la configurazione nella configurazione di OpenClaw, non nelle impostazioni del progetto possedute da Pi. Gli adapter runtime decidono quali trasporti sono effettivamente eseguibili.
</Note>

## Aggiornamenti dei plugin

`/plugins` consente agli operatori di ispezionare i plugin rilevati e attivare o disattivare l'abilitazione nella configurazione. I flussi in sola lettura possono usare `/plugin` come alias. Disabilitato per impostazione predefinita; abilitalo con `commands.plugins: true`.

Esempi:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` e `/plugins show` usano il rilevamento reale dei plugin rispetto al workspace corrente più la configurazione su disco.
- `/plugins enable|disable` aggiorna solo la configurazione dei plugin; non installa né disinstalla i plugin.
- Dopo modifiche di abilitazione/disabilitazione, riavvia il gateway per applicarle.

</Note>

## Note sulla superficie

<AccordionGroup>
  <Accordion title="Sessioni per superficie">
    - I **comandi testuali** vengono eseguiti nella normale sessione di chat (i DM condividono `main`, i gruppi hanno una propria sessione).
    - I **comandi nativi** usano sessioni isolate:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (prefisso configurabile tramite `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (indirizza la sessione della chat tramite `CommandTargetSessionKey`)
    - **`/stop`** prende come destinazione la sessione di chat attiva, così può interrompere l'esecuzione corrente.

  </Accordion>
  <Accordion title="Specifiche di Slack">
    `channels.slack.slashCommand` è ancora supportato per un singolo comando in stile `/openclaw`. Se abiliti `commands.native`, devi creare un comando slash Slack per ogni comando built-in (con gli stessi nomi di `/help`). I menu degli argomenti dei comandi per Slack vengono forniti come pulsanti Block Kit effimeri.

    Eccezione nativa Slack: registra `/agentstatus` (non `/status`) perché Slack riserva `/status`. Il comando testuale `/status` continua a funzionare nei messaggi Slack.

  </Accordion>
</AccordionGroup>

## Domande laterali BTW

`/btw` è una rapida **domanda laterale** sulla sessione corrente.

A differenza della normale chat:

- usa la sessione corrente come contesto di background,
- viene eseguito come chiamata separata one-shot **senza strumenti**,
- non modifica il contesto futuro della sessione,
- non viene scritto nella cronologia della trascrizione,
- viene consegnato come risultato laterale live invece che come normale messaggio dell'assistente.

Questo rende `/btw` utile quando vuoi un chiarimento temporaneo mentre l'attività principale continua.

Esempio:

```text
/btw cosa stiamo facendo in questo momento?
```

Vedi [BTW Side Questions](/it/tools/btw) per il comportamento completo e i dettagli della UX del client.

## Correlati

- [Creazione di Skills](/it/tools/creating-skills)
- [Skills](/it/tools/skills)
- [Configurazione delle Skills](/it/tools/skills-config)
