---
read_when:
    - Regolazione del ragionamento, della modalità rapida o dell'analisi o dei valori predefiniti della direttiva verbosa
summary: Sintassi delle direttive per /think, /fast, /verbose, /trace e visibilità del ragionamento
title: Livelli di ragionamento
x-i18n:
    generated_at: "2026-05-04T07:09:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fa1b0a2b5f7b93a706488c3ad39dfe08c08eed0bdd30880eb4c07d730ee4d4f
    source_path: tools/thinking.md
    workflow: 16
---

## Cosa fa

- Direttiva inline in qualsiasi corpo in ingresso: `/t <level>`, `/think:<level>` o `/thinking <level>`.
- Livelli (alias): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (budget massimo)
  - xhigh → “ultrathink+” (modelli GPT-5.2+ e Codex, più effort di Anthropic Claude Opus 4.7)
  - adaptive → ragionamento adattivo gestito dal provider (supportato per Claude 4.6 su Anthropic/Bedrock, Anthropic Claude Opus 4.7 e il ragionamento dinamico di Google Gemini)
  - max → ragionamento massimo del provider (Anthropic Claude Opus 4.7; Ollama lo mappa al suo effort `think` nativo più alto)
  - `x-high`, `x_high`, `extra-high`, `extra high` e `extra_high` vengono mappati a `xhigh`.
  - `highest` viene mappato a `high`.
- Note sui provider:
  - I menu e i selettori di ragionamento sono guidati dal profilo del provider. I Plugin provider dichiarano l'insieme esatto di livelli per il modello selezionato, incluse etichette come il valore binario `on`.
  - `adaptive`, `xhigh` e `max` vengono pubblicizzati solo per i profili provider/modello che li supportano. Le direttive digitate per livelli non supportati vengono rifiutate con le opzioni valide per quel modello.
  - I livelli non supportati già salvati vengono rimappati in base al rango del profilo del provider. `adaptive` ricade su `medium` sui modelli non adattivi, mentre `xhigh` e `max` ricadono sul livello non-`off` più grande supportato per il modello selezionato.
  - I modelli Anthropic Claude 4.6 usano per impostazione predefinita `adaptive` quando non è impostato alcun livello di ragionamento esplicito.
  - Anthropic Claude Opus 4.7 non usa il ragionamento adattivo per impostazione predefinita. Il default dell'effort della sua API resta di proprietà del provider, a meno che tu non imposti esplicitamente un livello di ragionamento.
  - Anthropic Claude Opus 4.7 mappa `/think xhigh` al ragionamento adattivo più `output_config.effort: "xhigh"`, perché `/think` è una direttiva di ragionamento e `xhigh` è l'impostazione di effort di Opus 4.7.
  - Anthropic Claude Opus 4.7 espone anche `/think max`; viene mappato allo stesso percorso di effort massimo di proprietà del provider.
  - I modelli DeepSeek V4 espongono `/think xhigh|max`; entrambi vengono mappati a `reasoning_effort: "max"` di DeepSeek, mentre i livelli inferiori non-`off` vengono mappati a `high`.
  - I modelli Ollama con capacità di ragionamento espongono `/think low|medium|high|max`; `max` viene mappato a `think: "high"` nativo perché l'API nativa di Ollama accetta le stringhe di effort `low`, `medium` e `high`.
  - I modelli OpenAI GPT mappano `/think` tramite il supporto dell'effort specifico del modello nella Responses API. `/think off` invia `reasoning.effort: "none"` solo quando il modello di destinazione lo supporta; altrimenti OpenClaw omette il payload di ragionamento disabilitato invece di inviare un valore non supportato.
  - Le voci di catalogo personalizzate compatibili con OpenAI possono abilitare `/think xhigh` impostando `models.providers.<provider>.models[].compat.supportedReasoningEfforts` in modo da includere `"xhigh"`. Questo usa gli stessi metadati di compatibilità che mappano i payload di effort di ragionamento OpenAI in uscita, quindi menu, convalida della sessione, CLI dell'agente e `llm-task` concordano con il comportamento del trasporto.
  - I riferimenti configurati obsoleti a OpenRouter Hunter Alpha saltano l'iniezione del ragionamento proxy perché quella route ritirata poteva restituire testo di risposta finale tramite campi di ragionamento.
  - Google Gemini mappa `/think adaptive` al ragionamento dinamico di proprietà del provider di Gemini. Le richieste Gemini 3 omettono un `thinkingLevel` fisso, mentre le richieste Gemini 2.5 inviano `thinkingBudget: -1`; i livelli fissi vengono comunque mappati al `thinkingLevel` o al budget Gemini più vicino per quella famiglia di modelli.
  - MiniMax (`minimax/*`) sul percorso di streaming compatibile con Anthropic usa per impostazione predefinita `thinking: { type: "disabled" }` a meno che tu non imposti esplicitamente il ragionamento nei parametri del modello o della richiesta. Questo evita delta `reasoning_content` trapelati dal formato di stream Anthropic non nativo di MiniMax.
  - Z.AI (`zai/*`) supporta solo il ragionamento binario (`on`/`off`). Qualsiasi livello diverso da `off` viene trattato come `on` (mappato a `low`).
  - Moonshot (`moonshot/*`) mappa `/think off` a `thinking: { type: "disabled" }` e qualsiasi livello diverso da `off` a `thinking: { type: "enabled" }`. Quando il ragionamento è abilitato, Moonshot accetta solo `tool_choice` `auto|none`; OpenClaw normalizza i valori incompatibili a `auto`.

## Ordine di risoluzione

1. Direttiva inline sul messaggio (si applica solo a quel messaggio).
2. Override della sessione (impostato inviando un messaggio composto solo dalla direttiva).
3. Default per agente (`agents.list[].thinkingDefault` nella configurazione).
4. Default globale (`agents.defaults.thinkingDefault` nella configurazione).
5. Fallback: default dichiarato dal provider quando disponibile; altrimenti i modelli con capacità di ragionamento si risolvono a `medium` o al livello non-`off` supportato più vicino per quel modello, mentre i modelli senza ragionamento restano `off`.

## Impostare un default di sessione

- Invia un messaggio che contiene **solo** la direttiva (spazi consentiti), ad esempio `/think:medium` o `/t high`.
- Rimane valido per la sessione corrente (per mittente per impostazione predefinita); viene cancellato da `/think:off` o dal reset per inattività della sessione.
- Viene inviata una risposta di conferma (`Thinking level set to high.` / `Thinking disabled.`). Se il livello non è valido (ad esempio `/thinking big`), il comando viene rifiutato con un suggerimento e lo stato della sessione resta invariato.
- Invia `/think` (o `/think:`) senza argomento per vedere il livello di ragionamento corrente.

## Applicazione per agente

- **Pi incorporato**: il livello risolto viene passato al runtime dell'agente Pi in-process.

## Modalità veloce (/fast)

- Livelli: `on|off`.
- Un messaggio composto solo dalla direttiva attiva o disattiva un override della modalità veloce di sessione e risponde `Fast mode enabled.` / `Fast mode disabled.`.
- Invia `/fast` (o `/fast status`) senza modalità per vedere lo stato effettivo corrente della modalità veloce.
- OpenClaw risolve la modalità veloce in questo ordine:
  1. Inline/solo direttiva `/fast on|off`
  2. Override della sessione
  3. Default per agente (`agents.list[].fastModeDefault`)
  4. Configurazione per modello: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Per `openai/*`, la modalità veloce viene mappata all'elaborazione prioritaria di OpenAI inviando `service_tier=priority` nelle richieste Responses supportate.
- Per `openai-codex/*`, la modalità veloce invia lo stesso flag `service_tier=priority` nelle Responses Codex. OpenClaw mantiene un singolo toggle `/fast` condiviso tra entrambi i percorsi di autenticazione.
- Per le richieste pubbliche dirette `anthropic/*`, incluso il traffico autenticato tramite OAuth inviato a `api.anthropic.com`, la modalità veloce viene mappata ai tier di servizio Anthropic: `/fast on` imposta `service_tier=auto`, `/fast off` imposta `service_tier=standard_only`.
- Per `minimax/*` sul percorso compatibile con Anthropic, `/fast on` (o `params.fastMode: true`) riscrive `MiniMax-M2.7` in `MiniMax-M2.7-highspeed`.
- I parametri modello Anthropic espliciti `serviceTier` / `service_tier` sovrascrivono il default della modalità veloce quando entrambi sono impostati. OpenClaw salta comunque l'iniezione del tier di servizio Anthropic per gli URL base proxy non Anthropic.
- `/status` mostra `Fast` solo quando la modalità veloce è abilitata.

## Direttive verbose (/verbose o /v)

- Livelli: `on` (minimo) | `full` | `off` (default).
- Un messaggio composto solo dalla direttiva attiva o disattiva il verbose di sessione e risponde `Verbose logging enabled.` / `Verbose logging disabled.`; i livelli non validi restituiscono un suggerimento senza modificare lo stato.
- `/verbose off` salva un override esplicito di sessione; cancellalo tramite l'interfaccia Sessions scegliendo `inherit`.
- La direttiva inline influisce solo su quel messaggio; altrimenti si applicano i default di sessione/globali.
- Invia `/verbose` (o `/verbose:`) senza argomento per vedere il livello verbose corrente.
- Quando verbose è attivo, gli agenti che emettono risultati strutturati degli strumenti (Pi, altri agenti JSON) inviano ogni chiamata strumento come un proprio messaggio solo metadati, con prefisso `<emoji> <tool-name>: <arg>` quando disponibile. Questi riepiloghi degli strumenti vengono inviati appena ogni strumento si avvia (bolle separate), non come delta di streaming.
- I riepiloghi degli errori degli strumenti restano visibili in modalità normale, ma i suffissi con i dettagli grezzi dell'errore sono nascosti a meno che verbose sia `on` o `full`.
- Quando verbose è `full`, anche gli output degli strumenti vengono inoltrati dopo il completamento (bolla separata, troncata a una lunghezza sicura). Se attivi `/verbose on|full|off` mentre un'esecuzione è in corso, le bolle successive degli strumenti rispettano la nuova impostazione.
- `agents.defaults.toolProgressDetail` controlla la forma dei riepiloghi strumenti di `/verbose` e delle righe strumenti nelle bozze di avanzamento. Usa `"explain"` (default) per etichette umane compatte come `🛠️ Exec: checking JS syntax`; usa `"raw"` quando vuoi anche il comando/dettaglio grezzo aggiunto per il debug. `agents.list[].toolProgressDetail` per agente sovrascrive il default.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Direttive di trace dei Plugin (/trace)

- Livelli: `on` | `off` (default).
- Un messaggio composto solo dalla direttiva attiva o disattiva l'output di trace Plugin della sessione e risponde `Plugin trace enabled.` / `Plugin trace disabled.`.
- La direttiva inline influisce solo su quel messaggio; altrimenti si applicano i default di sessione/globali.
- Invia `/trace` (o `/trace:`) senza argomento per vedere il livello di trace corrente.
- `/trace` è più ristretto di `/verbose`: espone solo righe di trace/debug di proprietà del Plugin, come i riepiloghi di debug di Active Memory.
- Le righe di trace possono apparire in `/status` e come messaggio diagnostico di follow-up dopo la normale risposta dell'assistente.

## Visibilità del ragionamento (/reasoning)

- Livelli: `on|off|stream`.
- Un messaggio composto solo dalla direttiva attiva o disattiva la visualizzazione dei blocchi di ragionamento nelle risposte.
- Quando abilitato, il ragionamento viene inviato come **messaggio separato** con prefisso `Reasoning:`.
- `stream` (solo Telegram): trasmette in streaming il ragionamento nella bolla bozza di Telegram mentre la risposta viene generata, poi invia la risposta finale senza ragionamento.
- Alias: `/reason`.
- Invia `/reasoning` (o `/reasoning:`) senza argomento per vedere il livello di ragionamento corrente.
- Ordine di risoluzione: direttiva inline, poi override della sessione, poi default per agente (`agents.list[].reasoningDefault`), poi fallback (`off`).

I tag di ragionamento dei modelli locali malformati vengono gestiti in modo conservativo. I blocchi chiusi `<think>...</think>` restano nascosti nelle risposte normali, e anche il ragionamento non chiuso dopo testo già visibile viene nascosto. Se una risposta è interamente racchiusa in un singolo tag di apertura non chiuso e altrimenti verrebbe consegnata come testo vuoto, OpenClaw rimuove il tag di apertura malformato e consegna il testo restante.

## Correlati

- La documentazione della modalità elevata si trova in [Modalità elevata](/it/tools/elevated).

## Heartbeat

- Il corpo della sonda Heartbeat è il prompt Heartbeat configurato (default: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Le direttive inline in un messaggio Heartbeat si applicano come al solito (ma evita di modificare i default di sessione dagli Heartbeat).
- La consegna Heartbeat usa per impostazione predefinita solo il payload finale. Per inviare anche il messaggio separato `Reasoning:` (quando disponibile), imposta `agents.defaults.heartbeat.includeReasoning: true` o `agents.list[].heartbeat.includeReasoning: true` per agente.

## Interfaccia web chat

- Il selettore di ragionamento della web chat rispecchia il livello salvato della sessione dallo store/config della sessione in ingresso quando la pagina viene caricata.
- Scegliere un altro livello scrive immediatamente l'override di sessione tramite `sessions.patch`; non attende il prossimo invio e non è un override `thinkingOnce` usa e getta.
- La prima opzione è sempre `Default (<resolved level>)`, dove il default risolto deriva dal profilo di ragionamento del provider del modello della sessione attiva più la stessa logica di fallback usata da `/status` e `session_status`.
- Il selettore usa `thinkingLevels` restituito dalla riga/default della sessione del Gateway, con `thinkingOptions` mantenuto come elenco etichette legacy. L'interfaccia browser non mantiene un proprio elenco regex dei provider; i Plugin possiedono gli insiemi di livelli specifici del modello.
- `/think:<level>` funziona ancora e aggiorna lo stesso livello di sessione salvato, quindi le direttive chat e il selettore restano sincronizzati.

## Profili provider

- I Plugin provider possono esporre `resolveThinkingProfile(ctx)` per definire i livelli supportati dal modello e il valore predefinito.
- I Plugin provider che fungono da proxy per i modelli Claude dovrebbero riutilizzare `resolveClaudeThinkingProfile(modelId)` da `openclaw/plugin-sdk/provider-model-shared`, in modo che Anthropic diretto e i cataloghi proxy restino allineati.
- Ogni livello del profilo ha un `id` canonico memorizzato (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` o `max`) e può includere una `label` di visualizzazione. I provider binari usano `{ id: "low", label: "on" }`.
- I Plugin strumento che devono convalidare un override esplicito del ragionamento dovrebbero usare `api.runtime.agent.resolveThinkingPolicy({ provider, model })` più `api.runtime.agent.normalizeThinkingLevel(...)`; non dovrebbero mantenere elenchi propri di livelli per provider/modello.
- I Plugin strumento con accesso ai metadati configurati dei modelli personalizzati possono passare `catalog` a `resolveThinkingPolicy`, così gli opt-in `compat.supportedReasoningEfforts` vengono riflessi nella convalida lato plugin.
- Gli hook legacy pubblicati (`supportsXHighThinking`, `isBinaryThinking` e `resolveDefaultThinkingLevel`) restano adattatori di compatibilità, ma i nuovi insiemi di livelli personalizzati dovrebbero usare `resolveThinkingProfile`.
- Le righe/i valori predefiniti del Gateway espongono `thinkingLevels`, `thinkingOptions` e `thinkingDefault` così i client ACP/chat mostrano gli stessi id e label di profilo usati dalla convalida runtime.
