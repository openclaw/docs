---
read_when:
    - Modifica dell’analisi, della modalità rapida o dell’analisi sintattica o dei valori predefiniti delle direttive verbose
summary: Sintassi delle direttive per /think, /fast, /verbose, /trace e visibilità del ragionamento
title: Livelli di ragionamento
x-i18n:
    generated_at: "2026-05-05T01:50:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2282c9eccda4693680bbfbfc42de508021f4472b00d40a1a8c1bc19a4516012
    source_path: tools/thinking.md
    workflow: 16
---

## Cosa fa

- Direttiva inline in qualsiasi corpo in ingresso: `/t <level>`, `/think:<level>` o `/thinking <level>`.
- Livelli (alias): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “pensa”
  - low → “pensa intensamente”
  - medium → “pensa più intensamente”
  - high → “ultrathink” (budget massimo)
  - xhigh → “ultrathink+” (modelli GPT-5.2+ e Codex, più effort Anthropic Claude Opus 4.7)
  - adaptive → ragionamento adattivo gestito dal provider (supportato per Claude 4.6 su Anthropic/Bedrock, Anthropic Claude Opus 4.7 e ragionamento dinamico Google Gemini)
  - max → ragionamento massimo del provider (Anthropic Claude Opus 4.7; Ollama lo mappa al suo effort `think` nativo più alto)
  - `x-high`, `x_high`, `extra-high`, `extra high` ed `extra_high` si mappano a `xhigh`.
  - `highest` si mappa a `high`.
- Note sui provider:
  - I menu e i selettori di ragionamento sono guidati dai profili provider. I plugin dei provider dichiarano l'esatto insieme di livelli per il modello selezionato, incluse etichette come il valore binario `on`.
  - `adaptive`, `xhigh` e `max` vengono mostrati solo per profili provider/modello che li supportano. Le direttive digitate per livelli non supportati vengono rifiutate con le opzioni valide per quel modello.
  - I livelli non supportati già salvati vengono rimappati in base al rango del profilo provider. `adaptive` torna a `medium` sui modelli non adattivi, mentre `xhigh` e `max` tornano al più grande livello non `off` supportato per il modello selezionato.
  - I modelli Anthropic Claude 4.6 usano `adaptive` come impostazione predefinita quando non è impostato alcun livello di ragionamento esplicito.
  - Anthropic Claude Opus 4.7 non usa il ragionamento adattivo come impostazione predefinita. Il valore predefinito dell'effort della sua API resta di proprietà del provider, salvo impostare esplicitamente un livello di ragionamento.
  - Anthropic Claude Opus 4.7 mappa `/think xhigh` al ragionamento adattivo più `output_config.effort: "xhigh"`, perché `/think` è una direttiva di ragionamento e `xhigh` è l'impostazione di effort di Opus 4.7.
  - Anthropic Claude Opus 4.7 espone anche `/think max`; viene mappato allo stesso percorso di effort massimo di proprietà del provider.
  - I modelli Direct DeepSeek V4 espongono `/think xhigh|max`; entrambi si mappano a DeepSeek `reasoning_effort: "max"`, mentre i livelli inferiori non `off` si mappano a `high`.
  - I modelli DeepSeek V4 instradati tramite OpenRouter espongono `/think xhigh` e inviano valori `reasoning_effort` supportati da OpenRouter. Gli override `max` salvati tornano a `xhigh`.
  - I modelli Ollama con supporto al ragionamento espongono `/think low|medium|high|max`; `max` si mappa al valore nativo `think: "high"` perché l'API nativa di Ollama accetta le stringhe di effort `low`, `medium` e `high`.
  - I modelli OpenAI GPT mappano `/think` tramite il supporto di effort specifico del modello nella Responses API. `/think off` invia `reasoning.effort: "none"` solo quando il modello di destinazione lo supporta; altrimenti OpenClaw omette il payload di ragionamento disabilitato invece di inviare un valore non supportato.
  - Le voci di catalogo personalizzate compatibili con OpenAI possono abilitare `/think xhigh` impostando `models.providers.<provider>.models[].compat.supportedReasoningEfforts` in modo che includa `"xhigh"`. Questo usa gli stessi metadati di compatibilità che mappano i payload di effort del ragionamento OpenAI in uscita, quindi menu, validazione della sessione, CLI dell'agente e `llm-task` concordano con il comportamento di trasporto.
  - I riferimenti OpenRouter Hunter Alpha configurati ma obsoleti saltano l'iniezione di ragionamento del proxy perché quella route ritirata poteva restituire il testo della risposta finale tramite campi di ragionamento.
  - Google Gemini mappa `/think adaptive` al ragionamento dinamico di proprietà del provider di Gemini. Le richieste Gemini 3 omettono un `thinkingLevel` fisso, mentre le richieste Gemini 2.5 inviano `thinkingBudget: -1`; i livelli fissi si mappano comunque al `thinkingLevel` o al budget Gemini più vicino per quella famiglia di modelli.
  - MiniMax (`minimax/*`) nel percorso di streaming compatibile con Anthropic usa per impostazione predefinita `thinking: { type: "disabled" }`, salvo impostare esplicitamente il ragionamento nei parametri del modello o nei parametri della richiesta. Questo evita delte `reasoning_content` trapelate dal formato di stream Anthropic non nativo di MiniMax.
  - Z.AI (`zai/*`) supporta solo il ragionamento binario (`on`/`off`). Qualsiasi livello non `off` viene trattato come `on` (mappato a `low`).
  - Moonshot (`moonshot/*`) mappa `/think off` a `thinking: { type: "disabled" }` e qualsiasi livello non `off` a `thinking: { type: "enabled" }`. Quando il ragionamento è abilitato, Moonshot accetta solo `tool_choice` `auto|none`; OpenClaw normalizza i valori incompatibili a `auto`.

## Ordine di risoluzione

1. Direttiva inline sul messaggio (si applica solo a quel messaggio).
2. Override di sessione (impostato inviando un messaggio composto solo dalla direttiva).
3. Valore predefinito per agente (`agents.list[].thinkingDefault` nella configurazione).
4. Valore predefinito globale (`agents.defaults.thinkingDefault` nella configurazione).
5. Fallback: valore predefinito dichiarato dal provider quando disponibile; altrimenti i modelli capaci di ragionamento si risolvono a `medium` o al livello non `off` supportato più vicino per quel modello, mentre i modelli senza ragionamento restano `off`.

## Impostare un valore predefinito di sessione

- Invia un messaggio che sia **solo** la direttiva (spazi consentiti), ad esempio `/think:medium` o `/t high`.
- Rimane valido per la sessione corrente (per mittente per impostazione predefinita); viene cancellato da `/think:off` o dal reset per inattività della sessione.
- Viene inviata una risposta di conferma (`Thinking level set to high.` / `Thinking disabled.`). Se il livello non è valido (ad esempio `/thinking big`), il comando viene rifiutato con un suggerimento e lo stato della sessione rimane invariato.
- Invia `/think` (o `/think:`) senza argomento per vedere il livello di ragionamento corrente.

## Applicazione per agente

- **Pi incorporato**: il livello risolto viene passato al runtime dell'agente Pi in-process.
- **Backend Claude CLI**: i livelli non off vengono passati a Claude Code come `--effort` quando si usa `claude-cli`; vedi [backend CLI](/it/gateway/cli-backends).

## Modalità veloce (/fast)

- Livelli: `on|off`.
- Un messaggio composto solo dalla direttiva attiva o disattiva un override della modalità veloce di sessione e risponde `Fast mode enabled.` / `Fast mode disabled.`.
- Invia `/fast` (o `/fast status`) senza modalità per vedere lo stato effettivo corrente della modalità veloce.
- OpenClaw risolve la modalità veloce in questo ordine:
  1. Inline/solo direttiva `/fast on|off`
  2. Override di sessione
  3. Valore predefinito per agente (`agents.list[].fastModeDefault`)
  4. Configurazione per modello: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Per `openai/*`, la modalità veloce si mappa all'elaborazione prioritaria di OpenAI inviando `service_tier=priority` sulle richieste Responses supportate.
- Per `openai-codex/*`, la modalità veloce invia lo stesso flag `service_tier=priority` su Codex Responses. OpenClaw mantiene un unico toggle `/fast` condiviso tra entrambi i percorsi di autenticazione.
- Per le richieste pubbliche dirette `anthropic/*`, incluso il traffico autenticato con OAuth inviato a `api.anthropic.com`, la modalità veloce si mappa ai service tier Anthropic: `/fast on` imposta `service_tier=auto`, `/fast off` imposta `service_tier=standard_only`.
- Per `minimax/*` nel percorso compatibile con Anthropic, `/fast on` (o `params.fastMode: true`) riscrive `MiniMax-M2.7` in `MiniMax-M2.7-highspeed`.
- I parametri modello Anthropic espliciti `serviceTier` / `service_tier` sovrascrivono il valore predefinito della modalità veloce quando entrambi sono impostati. OpenClaw continua comunque a saltare l'iniezione del service tier Anthropic per URL base proxy non Anthropic.
- `/status` mostra `Fast` solo quando la modalità veloce è abilitata.

## Direttive verbose (/verbose o /v)

- Livelli: `on` (minimo) | `full` | `off` (predefinito).
- Un messaggio composto solo dalla direttiva attiva o disattiva il verbose di sessione e risponde `Verbose logging enabled.` / `Verbose logging disabled.`; livelli non validi restituiscono un suggerimento senza modificare lo stato.
- `/verbose off` salva un override di sessione esplicito; cancellalo tramite l'interfaccia Sessions scegliendo `inherit`.
- La direttiva inline influisce solo su quel messaggio; altrimenti si applicano i valori predefiniti di sessione/globali.
- Invia `/verbose` (o `/verbose:`) senza argomento per vedere il livello verbose corrente.
- Quando verbose è attivo, gli agenti che emettono risultati strutturati degli strumenti (Pi, altri agenti JSON) rimandano ogni chiamata di strumento come messaggio separato composto solo da metadati, con prefisso `<emoji> <tool-name>: <arg>` quando disponibile. Questi riepiloghi degli strumenti vengono inviati appena ogni strumento parte (bolle separate), non come delte di streaming.
- I riepiloghi dei fallimenti degli strumenti restano visibili in modalità normale, ma i suffissi con dettagli grezzi degli errori sono nascosti salvo che verbose sia `on` o `full`.
- Quando verbose è `full`, anche gli output degli strumenti vengono inoltrati dopo il completamento (bolla separata, troncata a una lunghezza sicura). Se attivi o disattivi `/verbose on|full|off` mentre un'esecuzione è in corso, le bolle degli strumenti successive rispettano la nuova impostazione.
- `agents.defaults.toolProgressDetail` controlla la forma dei riepiloghi degli strumenti di `/verbose` e delle righe degli strumenti nelle bozze di avanzamento. Usa `"explain"` (predefinito) per etichette umane compatte come `🛠️ Exec: checking JS syntax`; usa `"raw"` quando vuoi anche il comando/dettaglio grezzo aggiunto per il debug. `agents.list[].toolProgressDetail` per agente sovrascrive il valore predefinito.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Direttive di trace del Plugin (/trace)

- Livelli: `on` | `off` (predefinito).
- Un messaggio composto solo dalla direttiva attiva o disattiva l'output di trace dei plugin per la sessione e risponde `Plugin trace enabled.` / `Plugin trace disabled.`.
- La direttiva inline influisce solo su quel messaggio; altrimenti si applicano i valori predefiniti di sessione/globali.
- Invia `/trace` (o `/trace:`) senza argomento per vedere il livello di trace corrente.
- `/trace` è più ristretto di `/verbose`: espone solo righe di trace/debug di proprietà dei plugin, come i riepiloghi di debug di Active Memory.
- Le righe di trace possono apparire in `/status` e come messaggio diagnostico successivo dopo la normale risposta dell'assistente.

## Visibilità del ragionamento (/reasoning)

- Livelli: `on|off|stream`.
- Un messaggio composto solo dalla direttiva attiva o disattiva la visualizzazione dei blocchi di ragionamento nelle risposte.
- Quando abilitato, il ragionamento viene inviato come **messaggio separato** con prefisso `Reasoning:`.
- `stream` (solo Telegram): trasmette il ragionamento nella bolla di bozza Telegram mentre la risposta viene generata, poi invia la risposta finale senza ragionamento.
- Alias: `/reason`.
- Invia `/reasoning` (o `/reasoning:`) senza argomento per vedere il livello di ragionamento corrente.
- Ordine di risoluzione: direttiva inline, poi override di sessione, poi valore predefinito per agente (`agents.list[].reasoningDefault`), poi fallback (`off`).

I tag di ragionamento dei modelli locali malformati vengono gestiti in modo conservativo. I blocchi chiusi `<think>...</think>` restano nascosti nelle risposte normali, e anche il ragionamento non chiuso dopo testo già visibile viene nascosto. Se una risposta è interamente racchiusa in un singolo tag di apertura non chiuso e altrimenti verrebbe consegnata come testo vuoto, OpenClaw rimuove il tag di apertura malformato e consegna il testo rimanente.

## Correlato

- La documentazione della modalità elevata si trova in [Modalità elevata](/it/tools/elevated).

## Heartbeat

- Il corpo della probe Heartbeat è il prompt heartbeat configurato (predefinito: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Le direttive inline in un messaggio heartbeat si applicano come di consueto (ma evita di modificare i valori predefiniti di sessione dagli heartbeat).
- La consegna Heartbeat usa per impostazione predefinita solo il payload finale. Per inviare anche il messaggio `Reasoning:` separato (quando disponibile), imposta `agents.defaults.heartbeat.includeReasoning: true` o `agents.list[].heartbeat.includeReasoning: true` per agente.

## Interfaccia web chat

- Il selettore del ragionamento della web chat rispecchia il livello salvato della sessione dallo store/configurazione della sessione in ingresso quando la pagina si carica.
- La scelta di un altro livello scrive immediatamente l'override di sessione tramite `sessions.patch`; non attende l'invio successivo e non è un override monouso `thinkingOnce`.
- La prima opzione è sempre `Default (<resolved level>)`, dove il valore predefinito risolto deriva dal profilo di ragionamento del provider del modello della sessione attiva più la stessa logica di fallback usata da `/status` e `session_status`.
- Il selettore usa `thinkingLevels` restituiti dalla riga/defaults della sessione del gateway, con `thinkingOptions` mantenuto come elenco di etichette legacy. L'interfaccia del browser non mantiene una propria lista regex di provider; i plugin possiedono gli insiemi di livelli specifici per modello.
- `/think:<level>` continua a funzionare e aggiorna lo stesso livello di sessione salvato, quindi le direttive chat e il selettore restano sincronizzati.

## Profili provider

- I plugin provider possono esporre `resolveThinkingProfile(ctx)` per definire i livelli supportati dal modello e il valore predefinito.
- I plugin provider che effettuano proxy di modelli Claude devono riutilizzare `resolveClaudeThinkingProfile(modelId)` da `openclaw/plugin-sdk/provider-model-shared` in modo che i cataloghi Anthropic diretti e proxy rimangano allineati.
- Ogni livello del profilo ha un `id` canonico memorizzato (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` o `max`) e può includere una `label` di visualizzazione. I provider binari usano `{ id: "low", label: "on" }`.
- I plugin di strumenti che devono convalidare un override esplicito del thinking devono usare `api.runtime.agent.resolveThinkingPolicy({ provider, model })` insieme a `api.runtime.agent.normalizeThinkingLevel(...)`; non devono mantenere proprie liste di livelli per provider/modello.
- I plugin di strumenti con accesso ai metadati configurati dei modelli personalizzati possono passare `catalog` a `resolveThinkingPolicy` affinché gli opt-in `compat.supportedReasoningEfforts` siano riflessi nella convalida lato plugin.
- Gli hook legacy pubblicati (`supportsXHighThinking`, `isBinaryThinking` e `resolveDefaultThinkingLevel`) rimangono come adattatori di compatibilità, ma i nuovi insiemi di livelli personalizzati devono usare `resolveThinkingProfile`.
- Le righe e i valori predefiniti del Gateway espongono `thinkingLevels`, `thinkingOptions` e `thinkingDefault` affinché i client ACP/chat renderizzino gli stessi id e label del profilo usati dalla convalida a runtime.
