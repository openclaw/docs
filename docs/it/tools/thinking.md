---
read_when:
    - Regolazione del parsing o dei valori predefiniti delle direttive thinking, modalità rapida o verbose
summary: Sintassi delle direttive per /think, /fast, /verbose, /trace e visibilità del ragionamento
title: Livelli di thinking
x-i18n:
    generated_at: "2026-04-21T08:30:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: edee9420e1cc3eccfa18d87061c4a4d6873e70cb51fff85305fafbcd6a5d6a7d
    source_path: tools/thinking.md
    workflow: 15
---

# Livelli di thinking (direttive `/think`)

## Cosa fa

- Direttiva inline in qualsiasi body in ingresso: `/t <level>`, `/think:<level>` oppure `/thinking <level>`.
- Livelli, alias: `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink”, budget massimo
  - xhigh → “ultrathink+”, effort per GPT-5.2 + modelli Codex e Anthropic Claude Opus 4.7
  - adaptive → thinking adattivo gestito dal provider, supportato per Claude 4.6 su Anthropic/Bedrock e Anthropic Claude Opus 4.7
  - max → ragionamento massimo del provider, attualmente Anthropic Claude Opus 4.7
  - `x-high`, `x_high`, `extra-high`, `extra high` e `extra_high` vengono mappati a `xhigh`.
  - `highest` viene mappato a `high`.
- Note sui provider:
  - `adaptive` viene pubblicizzato nei menu comandi e picker nativi solo per provider/modelli che dichiarano supporto al thinking adattivo. Resta accettato come direttiva digitata per compatibilità con configurazioni e alias esistenti.
  - `max` viene pubblicizzato nei menu comandi e picker nativi solo per provider/modelli che dichiarano supporto al thinking max. Le impostazioni `max` già memorizzate vengono rimappate al livello supportato più alto per il modello selezionato quando il modello non supporta `max`.
  - I modelli Anthropic Claude 4.6 usano `adaptive` per impostazione predefinita quando non è impostato alcun livello di thinking esplicito.
  - Anthropic Claude Opus 4.7 non usa thinking adattivo per impostazione predefinita. Il valore predefinito effort della sua API resta di proprietà del provider a meno che tu non imposti esplicitamente un livello di thinking.
  - Anthropic Claude Opus 4.7 mappa `/think xhigh` al thinking adattivo più `output_config.effort: "xhigh"`, perché `/think` è una direttiva thinking e `xhigh` è l'impostazione effort di Opus 4.7.
  - Anthropic Claude Opus 4.7 espone anche `/think max`; viene mappato allo stesso percorso max gestito dal provider.
  - I modelli OpenAI GPT mappano `/think` tramite il supporto effort specifico per modello della Responses API. `/think off` invia `reasoning.effort: "none"` solo quando il modello di destinazione lo supporta; altrimenti OpenClaw omette il payload di reasoning disabilitato invece di inviare un valore non supportato.
  - MiniMax (`minimax/*`) sul percorso streaming compatibile Anthropic usa per impostazione predefinita `thinking: { type: "disabled" }` a meno che tu non imposti esplicitamente thinking nei params del modello o della richiesta. Questo evita delta `reasoning_content` trapelati dal formato stream Anthropic non nativo di MiniMax.
  - Z.AI (`zai/*`) supporta solo thinking binario, `on`/`off`. Qualsiasi livello diverso da `off` viene trattato come `on`, mappato a `low`.
  - Moonshot (`moonshot/*`) mappa `/think off` a `thinking: { type: "disabled" }` e qualsiasi livello diverso da `off` a `thinking: { type: "enabled" }`. Quando il thinking è abilitato, Moonshot accetta solo `tool_choice` `auto|none`; OpenClaw normalizza i valori incompatibili in `auto`.

## Ordine di risoluzione

1. Direttiva inline nel messaggio, vale solo per quel messaggio.
2. Override di sessione, impostato inviando un messaggio contenente solo la direttiva.
3. Valore predefinito per agente, `agents.list[].thinkingDefault` nella configurazione.
4. Valore predefinito globale, `agents.defaults.thinkingDefault` nella configurazione.
5. Fallback: `adaptive` per i modelli Anthropic Claude 4.6, `off` per Anthropic Claude Opus 4.7 se non configurato esplicitamente, `low` per altri modelli capaci di ragionamento, `off` altrimenti.

## Impostare un valore predefinito di sessione

- Invia un messaggio che sia **solo** la direttiva, spazi consentiti, per esempio `/think:medium` oppure `/t high`.
- Questo resta valido per la sessione corrente, per mittente per impostazione predefinita; viene cancellato da `/think:off` o dal reset per inattività della sessione.
- Viene inviata una risposta di conferma, `Thinking level set to high.` / `Thinking disabled.`. Se il livello non è valido, per esempio `/thinking big`, il comando viene rifiutato con un suggerimento e lo stato della sessione resta invariato.
- Invia `/think` oppure `/think:` senza argomento per vedere il livello di thinking corrente.

## Applicazione per agente

- **Embedded Pi**: il livello risolto viene passato al runtime dell'agente Pi in-process.

## Modalità rapida (`/fast`)

- Livelli: `on|off`.
- Un messaggio contenente solo la direttiva attiva o disattiva un override di sessione della modalità rapida e risponde con `Fast mode enabled.` / `Fast mode disabled.`.
- Invia `/fast` oppure `/fast status` senza modalità per vedere lo stato effettivo corrente della modalità rapida.
- OpenClaw risolve la modalità rapida in questo ordine:
  1. `/fast on|off` inline o solo-direttiva
  2. Override di sessione
  3. Valore predefinito per agente, `agents.list[].fastModeDefault`
  4. Config per modello: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Per `openai/*`, la modalità rapida viene mappata all'elaborazione prioritaria OpenAI inviando `service_tier=priority` sulle richieste Responses supportate.
- Per `openai-codex/*`, la modalità rapida invia lo stesso flag `service_tier=priority` su Codex Responses. OpenClaw mantiene un unico toggle condiviso `/fast` per entrambi i percorsi auth.
- Per le richieste pubbliche dirette `anthropic/*`, incluso il traffico autenticato OAuth inviato a `api.anthropic.com`, la modalità rapida viene mappata ai service tier Anthropic: `/fast on` imposta `service_tier=auto`, `/fast off` imposta `service_tier=standard_only`.
- Per `minimax/*` sul percorso compatibile Anthropic, `/fast on`, oppure `params.fastMode: true`, riscrive `MiniMax-M2.7` in `MiniMax-M2.7-highspeed`.
- I params espliciti del modello Anthropic `serviceTier` / `service_tier` sostituiscono il valore predefinito della modalità rapida quando sono impostati entrambi. OpenClaw continua comunque a saltare l'iniezione del service tier Anthropic per URL base proxy non Anthropic.

## Direttive verbose (`/verbose` oppure `/v`)

- Livelli: `on`, minimale, `full`, `off`, predefinito.
- Un messaggio contenente solo la direttiva attiva o disattiva verbose di sessione e risponde con `Verbose logging enabled.` / `Verbose logging disabled.`; i livelli non validi restituiscono un suggerimento senza cambiare stato.
- `/verbose off` memorizza un override di sessione esplicito; cancellalo tramite la UI Sessions scegliendo `inherit`.
- La direttiva inline vale solo per quel messaggio; altrimenti si applicano i valori predefiniti di sessione o globali.
- Invia `/verbose` oppure `/verbose:` senza argomento per vedere il livello verbose corrente.
- Quando verbose è attivo, gli agenti che emettono risultati di strumenti strutturati, Pi e altri agenti JSON, inviano ogni tool call come proprio messaggio solo-metadati, con prefisso `<emoji> <tool-name>: <arg>` quando disponibile, percorso o comando. Questi riepiloghi degli strumenti vengono inviati non appena ogni strumento inizia, come bolle separate, non come delta di streaming.
- I riepiloghi dei fallimenti degli strumenti restano visibili in modalità normale, ma i suffissi del dettaglio di errore grezzo sono nascosti a meno che verbose non sia `on` o `full`.
- Quando verbose è `full`, anche gli output degli strumenti vengono inoltrati dopo il completamento, bolla separata, troncata a una lunghezza sicura. Se attivi `/verbose on|full|off` mentre un'esecuzione è in corso, le bolle successive degli strumenti rispettano la nuova impostazione.

## Direttive di trace del plugin (`/trace`)

- Livelli: `on` | `off`, predefinito.
- Un messaggio contenente solo la direttiva attiva o disattiva l'output trace del plugin per la sessione e risponde con `Plugin trace enabled.` / `Plugin trace disabled.`.
- La direttiva inline vale solo per quel messaggio; altrimenti si applicano i valori predefiniti di sessione o globali.
- Invia `/trace` oppure `/trace:` senza argomento per vedere il livello trace corrente.
- `/trace` è più ristretto di `/verbose`: espone solo righe di trace/debug di proprietà del plugin, come i riepiloghi di debug di Active Memory.
- Le righe di trace possono apparire in `/status` e come messaggio diagnostico di follow-up dopo la normale risposta dell'assistente.

## Visibilità del ragionamento (`/reasoning`)

- Livelli: `on|off|stream`.
- Un messaggio contenente solo la direttiva attiva o disattiva la visualizzazione dei blocchi di thinking nelle risposte.
- Quando è abilitato, il ragionamento viene inviato come **messaggio separato** con prefisso `Reasoning:`.
- `stream`, solo Telegram: trasmette in streaming il ragionamento nella bolla di bozza di Telegram mentre la risposta viene generata, poi invia la risposta finale senza ragionamento.
- Alias: `/reason`.
- Invia `/reasoning` oppure `/reasoning:` senza argomento per vedere il livello di ragionamento corrente.
- Ordine di risoluzione: direttiva inline, poi override di sessione, poi valore predefinito per agente, `agents.list[].reasoningDefault`, poi fallback, `off`.

## Correlati

- La documentazione della modalità elevata si trova in [Elevated mode](/it/tools/elevated).

## Heartbeat

- Il body del probe Heartbeat è il prompt Heartbeat configurato, predefinito: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`. Le direttive inline in un messaggio Heartbeat si applicano normalmente, ma evita di cambiare i valori predefiniti di sessione dagli Heartbeat.
- La consegna di Heartbeat usa per impostazione predefinita solo il payload finale. Per inviare anche il messaggio separato `Reasoning:`, quando disponibile, imposta `agents.defaults.heartbeat.includeReasoning: true` oppure per agente `agents.list[].heartbeat.includeReasoning: true`.

## Web chat UI

- Il selettore di thinking della web chat rispecchia all'apertura della pagina il livello memorizzato della sessione dall'archivio sessioni/configurazione in ingresso.
- Scegliere un altro livello scrive immediatamente l'override di sessione tramite `sessions.patch`; non aspetta il prossimo invio e non è un override monouso `thinkingOnce`.
- La prima opzione è sempre `Default (<resolved level>)`, dove il valore predefinito risolto deriva dal modello attivo della sessione: `adaptive` per Claude 4.6 su Anthropic, `off` per Anthropic Claude Opus 4.7 se non configurato, `low` per altri modelli capaci di ragionamento, `off` altrimenti.
- Il picker resta consapevole del provider:
  - la maggior parte dei provider mostra `off | minimal | low | medium | high`
  - Anthropic/Bedrock Claude 4.6 mostra `off | minimal | low | medium | high | adaptive`
  - Anthropic Claude Opus 4.7 mostra `off | minimal | low | medium | high | xhigh | adaptive | max`
  - Z.AI mostra il binario `off | on`
- `/think:<level>` continua a funzionare e aggiorna lo stesso livello di sessione memorizzato, così direttive chat e picker restano sincronizzati.
