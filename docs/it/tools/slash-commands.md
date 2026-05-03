---
read_when:
    - Utilizzo o configurazione dei comandi di chat
    - Debug dell'instradamento dei comandi o delle autorizzazioni
sidebarTitle: Slash commands
summary: 'Comandi slash: testuali vs nativi, configurazione e comandi supportati'
title: Comandi slash
x-i18n:
    generated_at: "2026-05-03T21:45:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fbdd76ccd43159cabfbc3f15f7bddd2a7ada07fcd6eea2e169d2d88df18f28c
    source_path: tools/slash-commands.md
    workflow: 16
---

Commands are handled by the Gateway. Most commands must be sent as a **standalone** message that starts with `/`. The host-only bash chat command uses `! <cmd>` (with `/bash <cmd>` as an alias).

When a conversation or thread is bound to an ACP session, normal follow-up text routes to that ACP harness. Gateway management commands still stay local: `/acp ...` always reaches the OpenClaw ACP command handler, and `/status` plus `/unfocus` stay local whenever command handling is enabled for the surface.

There are two related systems:

<AccordionGroup>
  <Accordion title="Commands">
    Standalone `/...` messages.
  </Accordion>
  <Accordion title="Directives">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - Directives are stripped from the message before the model sees it.
    - In normal chat messages (not directive-only), they are treated as "inline hints" and do **not** persist session settings.
    - In directive-only messages (the message contains only directives), they persist to the session and reply with an acknowledgement.
    - Directives are only applied for **authorized senders**. If `commands.allowFrom` is set, it is the only allowlist used; otherwise authorization comes from channel allowlists/pairing plus `commands.useAccessGroups`. Unauthorized senders see directives treated as plain text.

  </Accordion>
  <Accordion title="Inline shortcuts">
    Allowlisted/authorized senders only: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    They run immediately, are stripped before the model sees the message, and the remaining text continues through the normal flow.

  </Accordion>
</AccordionGroup>

## Config

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
  Enables parsing `/...` in chat messages. On surfaces without native commands (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), text commands still work even if you set this to `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  Registers native commands. Auto: on for Discord/Telegram; off for Slack (until you add slash commands); ignored for providers without native support. Set `channels.discord.commands.native`, `channels.telegram.commands.native`, or `channels.slack.commands.native` to override per provider (bool or `"auto"`). On Discord, `false` skips slash-command registration and cleanup during startup; previously registered commands may remain visible until you remove them from the Discord app. Slack commands are managed in the Slack app and are not removed automatically.
</ParamField>
On Discord, native command specs may include `descriptionLocalizations`, which OpenClaw publishes as Discord `description_localizations` and includes in reconcile comparisons.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  Registers **skill** commands natively when supported. Auto: on for Discord/Telegram; off for Slack (Slack requires creating a slash command per skill). Set `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills`, or `channels.slack.commands.nativeSkills` to override per provider (bool or `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  Enables `! <cmd>` to run host shell commands (`/bash <cmd>` is an alias; requires `tools.elevated` allowlists).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  Controls how long bash waits before switching to background mode (`0` backgrounds immediately).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  Enables `/config` (reads/writes `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  Enables `/mcp` (reads/writes OpenClaw-managed MCP config under `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  Enables `/plugins` (plugin discovery/status plus install + enable/disable controls).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  Enables `/debug` (runtime-only overrides).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  Enables `/restart` plus gateway restart tool actions.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  Sets the explicit owner allowlist for owner-only command/tool surfaces. This is the human operator account that can approve dangerous actions and run commands such as `/diagnostics`, `/export-trajectory`, and `/config`. It is separate from `commands.allowFrom` and from DM pairing access.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  Per-channel: makes owner-only commands require **owner identity** to run on that surface. When `true`, the sender must either match a resolved owner candidate (for example an entry in `commands.ownerAllowFrom` or provider-native owner metadata) or hold internal `operator.admin` scope on an internal message channel. A wildcard entry in channel `allowFrom`, or an empty/unresolved owner-candidate list, is **not** sufficient — owner-only commands fail closed on that channel. Leave this off if you want owner-only commands gated only by `ownerAllowFrom` and the standard command allowlists.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  Controls how owner ids appear in the system prompt.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  Optionally sets the HMAC secret used when `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  Per-provider allowlist for command authorization. When configured, it is the only authorization source for commands and directives (channel allowlists/pairing and `commands.useAccessGroups` are ignored). Use `"*"` for a global default; provider-specific keys override it.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  Enforces allowlists/policies for commands when `commands.allowFrom` is not set.
</ParamField>

## Command list

Current source-of-truth:

- core built-ins come from `src/auto-reply/commands-registry.shared.ts`
- generated dock commands come from `src/auto-reply/commands-registry.data.ts`
- plugin commands come from plugin `registerCommand()` calls
- actual availability on your gateway still depends on config flags, channel surface, and installed/enabled plugins

### Core built-in commands

<AccordionGroup>
  <Accordion title="Sessions and runs">
    - `/new [model]` starts a new session; `/reset` is the reset alias.
    - Control UI intercepts typed `/new` to create and switch to a fresh dashboard session; typed `/reset` still runs the Gateway's in-place reset.
    - `/reset soft [message]` keeps the current transcript, drops reused CLI backend session ids, and reruns startup/system-prompt loading in-place.
    - `/compact [instructions]` compacts the session context. See [Compaction](/it/concepts/compaction).
    - `/stop` aborts the current run.
    - `/session idle <duration|off>` and `/session max-age <duration|off>` manage thread-binding expiry.
    - `/export-session [path]` exports the current session to HTML. Alias: `/export`.
    - `/export-trajectory [path]` asks for exec approval, then exports a JSONL [trajectory bundle](/it/tools/trajectory) for the current session. Use it when you need the prompt, tool, and transcript timeline for one OpenClaw session. In group chats, the approval prompt and export result go to the owner privately. Alias: `/trajectory`.

  </Accordion>
  <Accordion title="Model and run controls">
    - `/think <level>` sets the thinking level. Options come from the active model's provider profile; common levels are `off`, `minimal`, `low`, `medium`, and `high`, with custom levels such as `xhigh`, `adaptive`, `max`, or binary `on` only where supported. Aliases: `/thinking`, `/t`.
    - `/verbose on|off|full` toggles verbose output. Alias: `/v`.
    - `/trace on|off` toggles plugin trace output for the current session.
    - `/fast [status|on|off]` shows or sets fast mode.
    - `/reasoning [on|off|stream]` toggles reasoning visibility. Alias: `/reason`.
    - `/elevated [on|off|ask|full]` toggles elevated mode. Alias: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` shows or sets exec defaults.
    - `/model [name|#|status]` shows or sets the model.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` lists configured/auth-available providers or models for a provider; add `all` to browse that provider's full catalog.
    - `/queue <mode>` manages queue behavior (`steer`, legacy `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`) plus options like `debounce:0.5s cap:25 drop:summarize`; `/queue default` or `/queue reset` clears the session override. See [Command queue](/it/concepts/queue) and [Steering queue](/it/concepts/queue-steering).

  </Accordion>
  <Accordion title="Discovery and status">
    - `/help` shows the short help summary.
    - `/commands` shows the generated command catalog.
    - `/tools [compact|verbose]` shows what the current agent can use right now.
    - `/status` shows execution/runtime status, including `Execution`/`Runtime` labels and provider usage/quota when available.
    - `/diagnostics [note]` is the owner-only support-report flow for Gateway bugs and Codex harness runs. It asks for explicit exec approval every time before running `openclaw gateway diagnostics export --json`; do not approve diagnostics with an allow-all rule. After approval, it sends a pasteable report with the local bundle path, manifest summary, privacy notes, and relevant session ids. In group chats, the approval prompt and report go to the owner privately. When the active session uses the OpenAI Codex harness, the same approval also sends relevant Codex feedback to OpenAI servers and the completed reply lists the OpenClaw session ids, Codex thread ids, and `codex resume <thread-id>` commands. See [Diagnostics Export](/it/gateway/diagnostics).
    - `/crestodian <request>` runs the Crestodian setup and repair helper from an owner DM.
    - `/tasks` lists active/recent background tasks for the current session.
    - `/context [list|detail|json]` explains how context is assembled.
    - `/whoami` shows your sender id. Alias: `/id`.
    - `/usage off|tokens|full|cost` controls the per-response usage footer or prints a local cost summary.

  </Accordion>
  <Accordion title="Skills, allowlists, approvals">
    - `/skill <name> [input]` runs a skill by name.
    - `/allowlist [list|add|remove] ...` manages allowlist entries. Text-only.
    - `/approve <id> <decision>` resolves exec approval prompts.
    - `/btw <question>` asks a side question without changing future session context. Alias: `/side`. See [BTW](/it/tools/btw).

  </Accordion>
  <Accordion title="Subagenti e ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` gestisce le esecuzioni dei subagenti per la sessione corrente.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gestisce le sessioni ACP e le opzioni di runtime.
    - `/focus <target>` associa il thread Discord corrente o l'argomento/conversazione Telegram a una destinazione di sessione.
    - `/unfocus` rimuove l'associazione corrente.
    - `/agents` elenca gli agenti associati al thread per la sessione corrente.
    - `/kill <id|#|all>` interrompe uno o tutti i subagenti in esecuzione.
    - `/steer <id|#> <message>` invia istruzioni a un subagente in esecuzione. Alias: `/tell`.

  </Accordion>
  <Accordion title="Scritture riservate al proprietario e amministrazione">
    - `/config show|get|set|unset` legge o scrive `openclaw.json`. Riservato al proprietario. Richiede `commands.config: true`.
    - `/mcp show|get|set|unset` legge o scrive la configurazione dei server MCP gestita da OpenClaw in `mcp.servers`. Riservato al proprietario. Richiede `commands.mcp: true`.
    - `/plugins list|inspect|show|get|install|enable|disable` ispeziona o modifica lo stato dei Plugin. `/plugin` è un alias. Scritture riservate al proprietario. Richiede `commands.plugins: true`.
    - `/debug show|set|unset|reset` gestisce gli override di configurazione solo runtime. Riservato al proprietario. Richiede `commands.debug: true`.
    - `/restart` riavvia OpenClaw quando abilitato. Predefinito: abilitato; imposta `commands.restart: false` per disabilitarlo.
    - `/send on|off|inherit` imposta la policy di invio. Riservato al proprietario.

  </Accordion>
  <Accordion title="Voce, TTS, controllo del canale">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` controlla TTS. Vedi [TTS](/it/tools/tts).
    - `/activation mention|always` imposta la modalità di attivazione del gruppo.
    - `/bash <command>` esegue un comando della shell host. Solo testo. Alias: `! <command>`. Richiede `commands.bash: true` più le allowlist `tools.elevated`.
    - `!poll [sessionId]` controlla un job bash in background.
    - `!stop [sessionId]` arresta un job bash in background.

  </Accordion>
</AccordionGroup>

### Comandi dock generati

I comandi dock commutano la route di risposta della sessione corrente verso un altro canale collegato. Vedi [Channel docking](/it/concepts/channel-docking) per configurazione, esempi e risoluzione dei problemi.

I comandi dock sono generati dai Plugin di canale con supporto per i comandi nativi. Set incluso corrente:

- `/dock-discord` (alias: `/dock_discord`)
- `/dock-mattermost` (alias: `/dock_mattermost`)
- `/dock-slack` (alias: `/dock_slack`)
- `/dock-telegram` (alias: `/dock_telegram`)

Usa i comandi dock da una chat diretta per commutare la route di risposta della sessione corrente verso un altro canale collegato. L'agente mantiene lo stesso contesto di sessione, ma le risposte future per quella sessione vengono recapitate al peer del canale selezionato.

I comandi dock richiedono `session.identityLinks`. Il mittente di origine e il peer di destinazione devono appartenere allo stesso gruppo di identità, ad esempio `["telegram:123", "discord:456"]`. Se un utente Telegram con id `123` invia `/dock_discord`, OpenClaw memorizza `lastChannel: "discord"` e `lastTo: "456"` nella sessione attiva. Se il mittente non è collegato a un peer Discord, il comando risponde con un suggerimento di configurazione invece di passare alla chat normale.

Il docking cambia solo la route della sessione attiva. Non crea account di canale, non concede accesso, non aggira le allowlist del canale e non sposta la cronologia del transcript in un'altra sessione. Usa `/dock-telegram`, `/dock-slack`, `/dock-mattermost` o un altro comando dock generato per cambiare di nuovo route.

### Comandi dei Plugin inclusi

I Plugin inclusi possono aggiungere altri comandi slash. Comandi inclusi correnti in questo repo:

- `/dreaming [on|off|status|help]` attiva o disattiva il Dreaming della memoria. Vedi [Dreaming](/it/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gestisce il flusso di associazione/configurazione del dispositivo. Vedi [Pairing](/it/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` arma temporaneamente i comandi del Node telefonico ad alto rischio.
- `/voice status|list [limit]|set <voiceId|name>` gestisce la configurazione della voce Talk. Su Discord, il nome del comando nativo è `/talkvoice`.
- `/card ...` invia preset di rich card LINE. Vedi [LINE](/it/channels/line).
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` ispeziona e controlla l'harness app-server Codex incluso. Vedi [Codex harness](/it/plugins/codex-harness).
- Comandi solo QQBot:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Comandi skill dinamici

Le Skills invocabili dall'utente sono esposte anche come comandi slash:

- `/skill <name> [input]` funziona sempre come entrypoint generico.
- Le Skills possono anche apparire come comandi diretti, come `/prose`, quando la skill/il Plugin li registra.
- La registrazione dei comandi skill nativi è controllata da `commands.nativeSkills` e `channels.<provider>.commands.nativeSkills`.
- Le specifiche dei comandi possono fornire `descriptionLocalizations` per le superfici native che supportano descrizioni localizzate, incluso Discord.

<AccordionGroup>
  <Accordion title="Note su argomenti e parser">
    - I comandi accettano un `:` opzionale tra comando e argomenti (ad es. `/think: high`, `/send: on`, `/help:`).
    - `/new <model>` accetta un alias modello, `provider/model` o un nome provider (corrispondenza fuzzy); se non c'è corrispondenza, il testo viene trattato come corpo del messaggio.
    - Per un riepilogo completo dell'uso per provider, usa `openclaw status --usage`.
    - `/allowlist add|remove` richiede `commands.config=true` e rispetta `configWrites` del canale.
    - Nei canali multi-account, anche `/allowlist --account <id>` mirato alla configurazione e `/config set channels.<provider>.accounts.<id>...` rispettano `configWrites` dell'account di destinazione.
    - `/usage` controlla il footer di utilizzo per risposta; `/usage cost` stampa un riepilogo dei costi locale dai log delle sessioni OpenClaw.
    - `/restart` è abilitato per impostazione predefinita; imposta `commands.restart: false` per disabilitarlo.
    - `/plugins install <spec>` accetta le stesse specifiche Plugin di `openclaw plugins install`: percorso/archivio locale, pacchetto npm, `git:<repo>` o `clawhub:<pkg>`, quindi richiede un riavvio del Gateway perché i moduli sorgente del Plugin sono cambiati.
    - `/plugins enable|disable` aggiorna la configurazione del Plugin e attiva il ricaricamento dei Plugin del Gateway per i nuovi turni dell'agente.

  </Accordion>
  <Accordion title="Comportamento specifico del canale">
    - Comando nativo solo Discord: `/vc join|leave|status` controlla i canali vocali (non disponibile come testo). `join` richiede una guild e un canale voce/stage selezionato. Richiede `channels.discord.voice` e comandi nativi.
    - I comandi Discord di associazione al thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) richiedono che le associazioni effettive al thread siano abilitate (`session.threadBindings.enabled` e/o `channels.discord.threadBindings.enabled`).
    - Riferimento dei comandi ACP e comportamento runtime: [ACP agents](/it/tools/acp-agents).

  </Accordion>
  <Accordion title="Sicurezza per verbose / trace / fast / reasoning">
    - `/verbose` è pensato per il debug e per maggiore visibilità; tienilo **disattivato** nell'uso normale.
    - `/trace` è più ristretto di `/verbose`: rivela solo righe trace/debug di proprietà del Plugin e mantiene disattivato il normale rumore verboso degli strumenti.
    - `/fast on|off` persiste un override di sessione. Usa l'opzione `inherit` nell'interfaccia Sessions per cancellarlo e tornare ai valori predefiniti della configurazione.
    - `/fast` è specifico del provider: OpenAI/OpenAI Codex lo mappano a `service_tier=priority` sugli endpoint Responses nativi, mentre le richieste Anthropic pubbliche dirette, incluso il traffico autenticato OAuth inviato a `api.anthropic.com`, lo mappano a `service_tier=auto` o `standard_only`. Vedi [OpenAI](/it/providers/openai) e [Anthropic](/it/providers/anthropic).
    - I riepiloghi degli errori degli strumenti vengono comunque mostrati quando pertinenti, ma il testo dettagliato dell'errore è incluso solo quando `/verbose` è `on` o `full`.
    - `/reasoning`, `/verbose` e `/trace` sono rischiosi nei contesti di gruppo: possono rivelare ragionamento interno, output degli strumenti o diagnostica del Plugin che non intendevi esporre. Preferisci lasciarli disattivati, soprattutto nelle chat di gruppo.

  </Accordion>
  <Accordion title="Cambio modello">
    - `/model` persiste immediatamente il nuovo modello di sessione.
    - Se l'agente è inattivo, la prossima esecuzione lo usa subito.
    - Se un'esecuzione è già attiva, OpenClaw contrassegna un cambio live come in sospeso e riavvia con il nuovo modello solo in un punto di retry pulito.
    - Se l'attività degli strumenti o l'output di risposta è già iniziato, il cambio in sospeso può restare in coda fino a una successiva opportunità di retry o al prossimo turno dell'utente.
    - Nella TUI locale, `/crestodian [request]` torna dalla TUI normale dell'agente a Crestodian. Questo è separato dalla modalità rescue dei canali di messaggistica e non concede autorità di configurazione remota.

  </Accordion>
  <Accordion title="Fast path e scorciatoie inline">
    - **Fast path:** i messaggi contenenti solo comandi da mittenti in allowlist vengono gestiti immediatamente (bypass coda + modello).
    - **Gate su menzione di gruppo:** i messaggi contenenti solo comandi da mittenti in allowlist bypassano i requisiti di menzione.
    - **Scorciatoie inline (solo mittenti in allowlist):** alcuni comandi funzionano anche quando incorporati in un messaggio normale e vengono rimossi prima che il modello veda il testo restante.
      - Esempio: `hey /status` attiva una risposta di stato e il testo restante prosegue nel flusso normale.
    - Attualmente: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - I messaggi non autorizzati contenenti solo comandi vengono ignorati silenziosamente e i token inline `/...` vengono trattati come testo normale.

  </Accordion>
  <Accordion title="Comandi skill e argomenti nativi">
    - **Comandi skill:** le Skills `user-invocable` sono esposte come comandi slash. I nomi vengono sanificati in `a-z0-9_` (max 32 caratteri); le collisioni ricevono suffissi numerici (ad es. `_2`).
      - `/skill <name> [input]` esegue una skill per nome (utile quando i limiti dei comandi nativi impediscono comandi per singola skill).
      - Per impostazione predefinita, i comandi skill vengono inoltrati al modello come richiesta normale.
      - Le Skills possono facoltativamente dichiarare `command-dispatch: tool` per instradare il comando direttamente a uno strumento (deterministico, senza modello).
      - Esempio: `/prose` (Plugin OpenProse) — vedi [OpenProse](/it/prose).
    - **Argomenti dei comandi nativi:** Discord usa l'autocompletamento per le opzioni dinamiche (e menu a pulsanti quando ometti argomenti obbligatori). Telegram e Slack mostrano un menu a pulsanti quando un comando supporta scelte e ometti l'argomento. Le scelte dinamiche vengono risolte rispetto al modello della sessione di destinazione, quindi le opzioni specifiche del modello, come i livelli di `/think`, seguono l'override `/model` di quella sessione.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` risponde a una domanda di runtime, non a una domanda di configurazione: **cosa può usare questo agente in questo momento in questa conversazione**.

- `/tools` predefinito è compatto e ottimizzato per una scansione rapida.
- `/tools verbose` aggiunge brevi descrizioni.
- Le superfici di comandi nativi che supportano argomenti espongono lo stesso selettore di modalità `compact|verbose`.
- I risultati sono a livello di sessione, quindi cambiare agente, canale, thread, autorizzazione del mittente o modello può cambiare l'output.
- `/tools` include gli strumenti effettivamente raggiungibili a runtime, inclusi strumenti core, strumenti dei Plugin connessi e strumenti di proprietà del canale.

Per modificare profili e override, usa il pannello Tools della Control UI o le superfici di configurazione/catalogo invece di trattare `/tools` come un catalogo statico.

## Superfici di utilizzo (cosa appare dove)

- **Utilizzo/quota del provider** (esempio: "Claude 80% rimanente") viene mostrato in `/status` per il provider del modello corrente quando il tracciamento dell'utilizzo è abilitato. OpenClaw normalizza le finestre del provider in `% left`; per MiniMax, i campi percentuali solo rimanenti vengono invertiti prima della visualizzazione, e le risposte `model_remains` preferiscono la voce del modello di chat più un'etichetta di piano con tag del modello.
- **Righe token/cache** in `/status` possono usare come fallback la voce più recente di utilizzo della trascrizione quando lo snapshot della sessione live è scarno. I valori live esistenti diversi da zero hanno comunque la precedenza, e il fallback della trascrizione può anche recuperare l'etichetta del modello runtime attivo più un totale più grande orientato al prompt quando i totali salvati sono mancanti o inferiori.
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
- Su Discord, `/model` e `/models` aprono un selettore interattivo con menu a discesa per provider e modello più un passaggio Submit.
- `/model <#>` seleziona da quel selettore (e preferisce il provider corrente quando possibile).
- `/model status` mostra la vista dettagliata, inclusi endpoint del provider configurato (`baseUrl`) e modalità API (`api`) quando disponibili.

## Override di debug

`/debug` consente di impostare override di configurazione **solo runtime** (memoria, non disco). Solo proprietario. Disabilitato per impostazione predefinita; abilita con `commands.debug: true`.

Esempi:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
Gli override vengono applicati immediatamente alle nuove letture della configurazione, ma **non** scrivono in `openclaw.json`. Usa `/debug reset` per cancellare tutti gli override e tornare alla configurazione su disco.
</Note>

## Output di traccia Plugin

`/trace` consente di attivare/disattivare le **righe di traccia/debug dei plugin con ambito di sessione** senza attivare la modalità completamente dettagliata.

Esempi:

```text
/trace
/trace on
/trace off
```

Note:

- `/trace` senza argomento mostra lo stato attuale della traccia della sessione.
- `/trace on` abilita le righe di traccia dei plugin per la sessione corrente.
- `/trace off` le disabilita di nuovo.
- Le righe di traccia dei plugin possono apparire in `/status` e come messaggio diagnostico successivo dopo la normale risposta dell'assistente.
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
La configurazione viene validata prima della scrittura; le modifiche non valide vengono rifiutate. Gli aggiornamenti di `/config` persistono tra i riavvii.
</Note>

## Aggiornamenti MCP

`/mcp` scrive le definizioni dei server MCP gestite da OpenClaw sotto `mcp.servers`. Solo proprietario. Disabilitato per impostazione predefinita; abilita con `commands.mcp: true`.

Esempi:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` salva la configurazione nella configurazione di OpenClaw, non nelle impostazioni di progetto possedute da Pi. Gli adattatori runtime decidono quali trasporti sono effettivamente eseguibili.
</Note>

## Aggiornamenti dei plugin

`/plugins` consente agli operatori di ispezionare i plugin rilevati e attivare/disattivare l'abilitazione nella configurazione. I flussi in sola lettura possono usare `/plugin` come alias. Disabilitato per impostazione predefinita; abilita con `commands.plugins: true`.

Esempi:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` e `/plugins show` usano il rilevamento reale dei plugin rispetto allo spazio di lavoro corrente più la configurazione su disco.
- `/plugins install` installa da ClawHub, npm, git, directory locali e archivi.
- `/plugins enable|disable` aggiorna solo la configurazione dei plugin; non installa né disinstalla plugin.
- Le modifiche di abilitazione e disabilitazione ricaricano a caldo le superfici runtime dei plugin del Gateway per i nuovi turni agente; l'installazione richiede un riavvio del Gateway perché i moduli sorgente dei plugin sono cambiati.

</Note>

## Note sulle superfici

<AccordionGroup>
  <Accordion title="Sessioni per superficie">
    - **Comandi testuali** vengono eseguiti nella normale sessione di chat (i DM condividono `main`, i gruppi hanno la propria sessione).
    - **Comandi nativi** usano sessioni isolate:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (prefisso configurabile tramite `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (punta alla sessione di chat tramite `CommandTargetSessionKey`)
    - **`/stop`** punta alla sessione di chat attiva così può interrompere l'esecuzione corrente.

  </Accordion>
  <Accordion title="Specifiche Slack">
    `channels.slack.slashCommand` è ancora supportato per un singolo comando in stile `/openclaw`. Se abiliti `commands.native`, devi creare un comando slash Slack per ogni comando integrato (stessi nomi di `/help`). I menu degli argomenti dei comandi per Slack vengono consegnati come pulsanti Block Kit effimeri.

    Eccezione nativa Slack: registra `/agentstatus` (non `/status`) perché Slack riserva `/status`. Il testo `/status` funziona comunque nei messaggi Slack.

  </Accordion>
</AccordionGroup>

## Domande secondarie BTW

`/btw` è una rapida **domanda secondaria** sulla sessione corrente. `/side` è un alias.

A differenza della chat normale:

- usa la sessione corrente come contesto di sfondo,
- viene eseguita come chiamata one-shot separata **senza strumenti**,
- non modifica il contesto futuro della sessione,
- non viene scritta nella cronologia della trascrizione,
- viene consegnata come risultato secondario live invece che come normale messaggio dell'assistente.

Questo rende `/btw` utile quando vuoi un chiarimento temporaneo mentre l'attività principale continua.

Esempio:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

Vedi [Domande secondarie BTW](/it/tools/btw) per il comportamento completo e i dettagli UX del client.

## Correlati

- [Creazione di Skills](/it/tools/creating-skills)
- [Skills](/it/tools/skills)
- [Configurazione di Skills](/it/tools/skills-config)
