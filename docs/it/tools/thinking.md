---
read_when:
    - Regolazione del parsing o dei valori predefiniti delle direttive thinking, fast-mode o verbose
summary: Sintassi delle direttive per /think, /fast, /verbose, /trace e la visibilità del ragionamento
title: Livelli di ragionamento
x-i18n:
    generated_at: "2026-04-30T09:18:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9fabead8d2f58fc5bce3bf8b281ad9d52da2cd02ba2777bc1597359537b7705
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
  - xhigh → “ultrathink+” (modelli GPT-5.2+ e Codex, più lo sforzo di Anthropic Claude Opus 4.7)
  - adaptive → ragionamento adattivo gestito dal provider (supportato per Claude 4.6 su Anthropic/Bedrock, Anthropic Claude Opus 4.7 e il ragionamento dinamico di Google Gemini)
  - max → ragionamento massimo del provider (Anthropic Claude Opus 4.7; Ollama lo mappa al suo massimo sforzo `think` nativo)
  - `x-high`, `x_high`, `extra-high`, `extra high` ed `extra_high` vengono mappati a `xhigh`.
  - `highest` viene mappato a `high`.
- Note sui provider:
  - I menu e i selettori di ragionamento sono guidati dal profilo del provider. I Plugin del provider dichiarano l'insieme esatto di livelli per il modello selezionato, incluse etichette come il valore binario `on`.
  - `adaptive`, `xhigh` e `max` vengono pubblicizzati solo per i profili provider/modello che li supportano. Le direttive digitate per livelli non supportati vengono rifiutate con le opzioni valide di quel modello.
  - I livelli non supportati già memorizzati vengono rimappati in base al rango del profilo del provider. `adaptive` ricade su `medium` nei modelli non adattivi, mentre `xhigh` e `max` ricadono sul livello non-`off` più alto supportato per il modello selezionato.
  - I modelli Anthropic Claude 4.6 usano `adaptive` per impostazione predefinita quando non è impostato alcun livello di ragionamento esplicito.
  - Anthropic Claude Opus 4.7 non usa il ragionamento adattivo per impostazione predefinita. L'impostazione predefinita dello sforzo della sua API resta di proprietà del provider, a meno che non imposti esplicitamente un livello di ragionamento.
  - Anthropic Claude Opus 4.7 mappa `/think xhigh` al ragionamento adattivo più `output_config.effort: "xhigh"`, perché `/think` è una direttiva di ragionamento e `xhigh` è l'impostazione di sforzo di Opus 4.7.
  - Anthropic Claude Opus 4.7 espone anche `/think max`; viene mappato allo stesso percorso di sforzo massimo di proprietà del provider.
  - I modelli Ollama con capacità di ragionamento espongono `/think low|medium|high|max`; `max` viene mappato a `think: "high"` nativo perché l'API nativa di Ollama accetta le stringhe di sforzo `low`, `medium` e `high`.
  - I modelli OpenAI GPT mappano `/think` tramite il supporto allo sforzo dell'API Responses specifico del modello. `/think off` invia `reasoning.effort: "none"` solo quando il modello di destinazione lo supporta; altrimenti OpenClaw omette il payload di ragionamento disabilitato invece di inviare un valore non supportato.
  - Le voci di catalogo personalizzate compatibili con OpenAI possono abilitare `/think xhigh` impostando `models.providers.<provider>.models[].compat.supportedReasoningEfforts` in modo che includa `"xhigh"`. Questo usa gli stessi metadati di compatibilità che mappano i payload in uscita dello sforzo di ragionamento OpenAI, così menu, convalida della sessione, CLI dell'agente e `llm-task` concordano con il comportamento del trasporto.
  - I riferimenti configurati obsoleti a OpenRouter Hunter Alpha saltano l'iniezione di ragionamento del proxy perché quella route ritirata poteva restituire testo di risposta finale attraverso i campi di ragionamento.
  - Google Gemini mappa `/think adaptive` al ragionamento dinamico di proprietà del provider di Gemini. Le richieste Gemini 3 omettono un `thinkingLevel` fisso, mentre le richieste Gemini 2.5 inviano `thinkingBudget: -1`; i livelli fissi vengono comunque mappati al `thinkingLevel` o budget Gemini più vicino per quella famiglia di modelli.
  - MiniMax (`minimax/*`) sul percorso di streaming compatibile con Anthropic usa per impostazione predefinita `thinking: { type: "disabled" }`, a meno che tu non imposti esplicitamente il ragionamento nei parametri del modello o nei parametri della richiesta. Questo evita la fuoriuscita di delta `reasoning_content` dal formato di streaming Anthropic non nativo di MiniMax.
  - Z.AI (`zai/*`) supporta solo il ragionamento binario (`on`/`off`). Qualsiasi livello non-`off` viene trattato come `on` (mappato a `low`).
  - Moonshot (`moonshot/*`) mappa `/think off` a `thinking: { type: "disabled" }` e qualsiasi livello non-`off` a `thinking: { type: "enabled" }`. Quando il ragionamento è abilitato, Moonshot accetta solo `tool_choice` `auto|none`; OpenClaw normalizza i valori incompatibili a `auto`.

## Ordine di risoluzione

1. Direttiva inline nel messaggio (si applica solo a quel messaggio).
2. Override di sessione (impostato inviando un messaggio contenente solo la direttiva).
3. Predefinito per agente (`agents.list[].thinkingDefault` nella configurazione).
4. Predefinito globale (`agents.defaults.thinkingDefault` nella configurazione).
5. Ripiego: predefinito dichiarato dal provider quando disponibile; altrimenti i modelli capaci di ragionamento si risolvono a `medium` o al livello non-`off` supportato più vicino per quel modello, e i modelli senza ragionamento restano `off`.

## Impostare un valore predefinito di sessione

- Invia un messaggio che sia **solo** la direttiva (spazi consentiti), per esempio `/think:medium` o `/t high`.
- Rimane valido per la sessione corrente (per mittente per impostazione predefinita); viene cancellato da `/think:off` o dal reset della sessione per inattività.
- Viene inviata una risposta di conferma (`Thinking level set to high.` / `Thinking disabled.`). Se il livello non è valido (per esempio `/thinking big`), il comando viene rifiutato con un suggerimento e lo stato della sessione resta invariato.
- Invia `/think` (o `/think:`) senza argomento per vedere il livello di ragionamento corrente.

## Applicazione per agente

- **Pi incorporato**: il livello risolto viene passato al runtime dell'agente Pi in-process.

## Modalità veloce (/fast)

- Livelli: `on|off`.
- Un messaggio contenente solo la direttiva attiva/disattiva un override della modalità veloce di sessione e risponde `Fast mode enabled.` / `Fast mode disabled.`.
- Invia `/fast` (o `/fast status`) senza modalità per vedere lo stato effettivo corrente della modalità veloce.
- OpenClaw risolve la modalità veloce in questo ordine:
  1. `/fast on|off` inline/solo direttiva
  2. Override di sessione
  3. Predefinito per agente (`agents.list[].fastModeDefault`)
  4. Configurazione per modello: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Ripiego: `off`
- Per `openai/*`, la modalità veloce viene mappata all'elaborazione prioritaria OpenAI inviando `service_tier=priority` nelle richieste Responses supportate.
- Per `openai-codex/*`, la modalità veloce invia lo stesso flag `service_tier=priority` nelle Responses Codex. OpenClaw mantiene un unico toggle `/fast` condiviso tra entrambi i percorsi di autenticazione.
- Per le richieste pubbliche dirette `anthropic/*`, incluso il traffico autenticato tramite OAuth inviato a `api.anthropic.com`, la modalità veloce viene mappata ai livelli di servizio Anthropic: `/fast on` imposta `service_tier=auto`, `/fast off` imposta `service_tier=standard_only`.
- Per `minimax/*` sul percorso compatibile con Anthropic, `/fast on` (o `params.fastMode: true`) riscrive `MiniMax-M2.7` in `MiniMax-M2.7-highspeed`.
- I parametri modello Anthropic espliciti `serviceTier` / `service_tier` sovrascrivono il valore predefinito della modalità veloce quando sono impostati entrambi. OpenClaw continua comunque a saltare l'iniezione del livello di servizio Anthropic per gli URL base proxy non Anthropic.
- `/status` mostra `Fast` solo quando la modalità veloce è abilitata.

## Direttive dettagliate (/verbose o /v)

- Livelli: `on` (minimo) | `full` | `off` (predefinito).
- Un messaggio contenente solo la direttiva attiva/disattiva la verbosità di sessione e risponde `Verbose logging enabled.` / `Verbose logging disabled.`; i livelli non validi restituiscono un suggerimento senza modificare lo stato.
- `/verbose off` memorizza un override di sessione esplicito; cancellalo tramite l'interfaccia Sessions scegliendo `inherit`.
- La direttiva inline influisce solo su quel messaggio; negli altri casi si applicano i valori predefiniti di sessione/globali.
- Invia `/verbose` (o `/verbose:`) senza argomento per vedere il livello di verbosità corrente.
- Quando la verbosità è attiva, gli agenti che emettono risultati di strumenti strutturati (Pi, altri agenti JSON) inviano ogni chiamata a strumento come proprio messaggio solo metadati, con prefisso `<emoji> <tool-name>: <arg>` quando disponibile (percorso/comando). Questi riepiloghi degli strumenti vengono inviati non appena ciascuno strumento parte (bolle separate), non come delta di streaming.
- I riepiloghi dei fallimenti degli strumenti restano visibili in modalità normale, ma i suffissi con i dettagli grezzi degli errori sono nascosti a meno che la verbosità sia `on` o `full`.
- Quando la verbosità è `full`, anche gli output degli strumenti vengono inoltrati dopo il completamento (bolla separata, troncata a una lunghezza sicura). Se attivi/disattivi `/verbose on|full|off` mentre un'esecuzione è in corso, le bolle degli strumenti successive rispettano la nuova impostazione.

## Direttive di trace dei Plugin (/trace)

- Livelli: `on` | `off` (predefinito).
- Un messaggio contenente solo la direttiva attiva/disattiva l'output di trace dei Plugin di sessione e risponde `Plugin trace enabled.` / `Plugin trace disabled.`.
- La direttiva inline influisce solo su quel messaggio; negli altri casi si applicano i valori predefiniti di sessione/globali.
- Invia `/trace` (o `/trace:`) senza argomento per vedere il livello di trace corrente.
- `/trace` è più ristretto di `/verbose`: espone solo le righe di trace/debug di proprietà dei Plugin, come i riepiloghi di debug di Active Memory.
- Le righe di trace possono comparire in `/status` e come messaggio diagnostico successivo dopo la normale risposta dell'assistente.

## Visibilità del ragionamento (/reasoning)

- Livelli: `on|off|stream`.
- Un messaggio contenente solo la direttiva attiva/disattiva la visualizzazione dei blocchi di ragionamento nelle risposte.
- Quando è abilitato, il ragionamento viene inviato come **messaggio separato** con prefisso `Reasoning:`.
- `stream` (solo Telegram): trasmette in streaming il ragionamento nella bolla bozza di Telegram mentre la risposta viene generata, poi invia la risposta finale senza ragionamento.
- Alias: `/reason`.
- Invia `/reasoning` (o `/reasoning:`) senza argomento per vedere il livello di ragionamento corrente.
- Ordine di risoluzione: direttiva inline, poi override di sessione, poi predefinito per agente (`agents.list[].reasoningDefault`), poi ripiego (`off`).

I tag di ragionamento dei modelli locali malformati vengono gestiti in modo conservativo. I blocchi chiusi `<think>...</think>` restano nascosti nelle risposte normali, e anche il ragionamento non chiuso dopo testo già visibile viene nascosto. Se una risposta è interamente racchiusa in un singolo tag di apertura non chiuso e altrimenti verrebbe consegnata come testo vuoto, OpenClaw rimuove il tag di apertura malformato e consegna il testo rimanente.

## Correlato

- La documentazione della modalità elevata si trova in [Modalità elevata](/it/tools/elevated).

## Heartbeat

- Il corpo del probe Heartbeat è il prompt heartbeat configurato (predefinito: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Le direttive inline in un messaggio heartbeat si applicano come di consueto (ma evita di modificare i valori predefiniti di sessione dagli heartbeat).
- La consegna Heartbeat usa per impostazione predefinita solo il payload finale. Per inviare anche il messaggio separato `Reasoning:` (quando disponibile), imposta `agents.defaults.heartbeat.includeReasoning: true` o, per agente, `agents.list[].heartbeat.includeReasoning: true`.

## Interfaccia web della chat

- Il selettore di ragionamento della chat web rispecchia il livello memorizzato della sessione dallo store/configurazione della sessione in ingresso quando la pagina viene caricata.
- Scegliere un altro livello scrive immediatamente l'override di sessione tramite `sessions.patch`; non attende l'invio successivo e non è un override una tantum `thinkingOnce`.
- La prima opzione è sempre `Default (<resolved level>)`, dove il valore predefinito risolto proviene dal profilo di ragionamento del provider del modello della sessione attiva più la stessa logica di ripiego usata da `/status` e `session_status`.
- Il selettore usa `thinkingLevels` restituiti dalla riga/default della sessione del Gateway, con `thinkingOptions` mantenuto come elenco di etichette legacy. L'interfaccia browser non mantiene un proprio elenco di regex del provider; i Plugin possiedono gli insiemi di livelli specifici del modello.
- `/think:<level>` funziona ancora e aggiorna lo stesso livello di sessione memorizzato, quindi le direttive della chat e il selettore restano sincronizzati.

## Profili dei provider

- I Plugin dei provider possono esporre `resolveThinkingProfile(ctx)` per definire i livelli supportati e il valore predefinito del modello.
- I Plugin dei provider che fanno da proxy ai modelli Claude dovrebbero riutilizzare `resolveClaudeThinkingProfile(modelId)` da `openclaw/plugin-sdk/provider-model-shared` in modo che i cataloghi Anthropic diretti e proxy restino allineati.
- Ogni livello del profilo ha un `id` canonico memorizzato (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` o `max`) e può includere una `label` di visualizzazione. I provider binari usano `{ id: "low", label: "on" }`.
- I Plugin degli strumenti che devono convalidare un override esplicito del ragionamento dovrebbero usare `api.runtime.agent.resolveThinkingPolicy({ provider, model })` insieme a `api.runtime.agent.normalizeThinkingLevel(...)`; non dovrebbero mantenere elenchi propri dei livelli per provider/modello.
- I Plugin degli strumenti con accesso ai metadati configurati dei modelli personalizzati possono passare `catalog` a `resolveThinkingPolicy` in modo che le adesioni esplicite a `compat.supportedReasoningEfforts` siano riflesse nella convalida lato Plugin.
- Gli hook legacy pubblicati (`supportsXHighThinking`, `isBinaryThinking` e `resolveDefaultThinkingLevel`) restano come adattatori di compatibilità, ma i nuovi insiemi di livelli personalizzati dovrebbero usare `resolveThinkingProfile`.
- Le righe e i valori predefiniti del Gateway espongono `thinkingLevels`, `thinkingOptions` e `thinkingDefault` affinché i client ACP/chat visualizzino gli stessi id e label del profilo usati dalla convalida a runtime.
