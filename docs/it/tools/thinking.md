---
read_when:
    - Regolazione dell’analisi o dei valori predefiniti delle direttive di ragionamento, modalità rapida o dettaglio
summary: Sintassi delle direttive per /think, /fast, /verbose, /trace e visibilità del ragionamento
title: Livelli di ragionamento
x-i18n:
    generated_at: "2026-05-04T18:24:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: fcd1cd76ca5d0b08656e0629df656ad8aa037201d8de68093b3e46eb0708f811
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
  - adaptive → thinking adattivo gestito dal provider (supportato per Claude 4.6 su Anthropic/Bedrock, Anthropic Claude Opus 4.7 e thinking dinamico di Google Gemini)
  - max → ragionamento massimo del provider (Anthropic Claude Opus 4.7; Ollama lo mappa al suo effort `think` nativo più alto)
  - `x-high`, `x_high`, `extra-high`, `extra high` ed `extra_high` mappano a `xhigh`.
  - `highest` mappa a `high`.
- Note sui provider:
  - I menu e i selettori di thinking sono guidati dal profilo del provider. I Plugin provider dichiarano l'insieme esatto di livelli per il modello selezionato, incluse etichette come il binario `on`.
  - `adaptive`, `xhigh` e `max` vengono pubblicizzati solo per profili provider/modello che li supportano. Le direttive digitate per livelli non supportati vengono rifiutate con le opzioni valide di quel modello.
  - I livelli non supportati già salvati vengono rimappati in base al rango del profilo del provider. `adaptive` esegue il fallback a `medium` sui modelli non adattivi, mentre `xhigh` e `max` eseguono il fallback al livello non-off supportato più grande per il modello selezionato.
  - I modelli Anthropic Claude 4.6 usano `adaptive` come valore predefinito quando non è impostato alcun livello di thinking esplicito.
  - Anthropic Claude Opus 4.7 non usa il thinking adattivo come valore predefinito. Il valore predefinito di effort della sua API resta di proprietà del provider, a meno che tu non imposti esplicitamente un livello di thinking.
  - Anthropic Claude Opus 4.7 mappa `/think xhigh` al thinking adattivo più `output_config.effort: "xhigh"`, perché `/think` è una direttiva di thinking e `xhigh` è l'impostazione di effort di Opus 4.7.
  - Anthropic Claude Opus 4.7 espone anche `/think max`; mappa allo stesso percorso di effort massimo di proprietà del provider.
  - I modelli DeepSeek V4 espongono `/think xhigh|max`; entrambi mappano a `reasoning_effort: "max"` di DeepSeek, mentre i livelli non-off inferiori mappano a `high`.
  - I modelli Ollama con capacità di thinking espongono `/think low|medium|high|max`; `max` mappa al `think: "high"` nativo perché l'API nativa di Ollama accetta le stringhe di effort `low`, `medium` e `high`.
  - I modelli OpenAI GPT mappano `/think` attraverso il supporto dell'effort dell'API Responses specifico del modello. `/think off` invia `reasoning.effort: "none"` solo quando il modello di destinazione lo supporta; altrimenti OpenClaw omette il payload di ragionamento disabilitato invece di inviare un valore non supportato.
  - Le voci di catalogo personalizzate compatibili con OpenAI possono abilitare `/think xhigh` impostando `models.providers.<provider>.models[].compat.supportedReasoningEfforts` in modo da includere `"xhigh"`. Questo usa gli stessi metadati di compatibilità che mappano i payload in uscita dell'effort di ragionamento OpenAI, quindi menu, convalida di sessione, CLI dell'agente e `llm-task` concordano con il comportamento di trasporto.
  - I riferimenti OpenRouter Hunter Alpha configurati e obsoleti saltano l'iniezione di ragionamento del proxy perché quella rotta ritirata poteva restituire testo di risposta finale tramite campi di ragionamento.
  - Google Gemini mappa `/think adaptive` al thinking dinamico di proprietà del provider di Gemini. Le richieste Gemini 3 omettono un `thinkingLevel` fisso, mentre le richieste Gemini 2.5 inviano `thinkingBudget: -1`; i livelli fissi continuano a mappare al `thinkingLevel` o budget Gemini più vicino per quella famiglia di modelli.
  - MiniMax (`minimax/*`) sul percorso di streaming compatibile con Anthropic usa per impostazione predefinita `thinking: { type: "disabled" }`, a meno che tu non imposti esplicitamente il thinking nei parametri del modello o della richiesta. Questo evita delta `reasoning_content` trapelati dal formato di stream Anthropic non nativo di MiniMax.
  - Z.AI (`zai/*`) supporta solo il thinking binario (`on`/`off`). Qualsiasi livello diverso da `off` viene trattato come `on` (mappato a `low`).
  - Moonshot (`moonshot/*`) mappa `/think off` a `thinking: { type: "disabled" }` e qualsiasi livello diverso da `off` a `thinking: { type: "enabled" }`. Quando il thinking è abilitato, Moonshot accetta solo `tool_choice` `auto|none`; OpenClaw normalizza i valori incompatibili su `auto`.

## Ordine di risoluzione

1. Direttiva inline sul messaggio (si applica solo a quel messaggio).
2. Override di sessione (impostato inviando un messaggio contenente solo la direttiva).
3. Valore predefinito per agente (`agents.list[].thinkingDefault` nella configurazione).
4. Valore predefinito globale (`agents.defaults.thinkingDefault` nella configurazione).
5. Fallback: valore predefinito dichiarato dal provider quando disponibile; altrimenti i modelli con capacità di ragionamento risolvono a `medium` o al livello non-`off` supportato più vicino per quel modello, e i modelli senza ragionamento restano `off`.

## Impostare un valore predefinito di sessione

- Invia un messaggio che contiene **solo** la direttiva (spazi consentiti), ad esempio `/think:medium` o `/t high`.
- Rimane attivo per la sessione corrente (per mittente per impostazione predefinita); viene cancellato da `/think:off` o dal reset per inattività della sessione.
- Viene inviata una risposta di conferma (`Thinking level set to high.` / `Thinking disabled.`). Se il livello non è valido (ad esempio `/thinking big`), il comando viene rifiutato con un suggerimento e lo stato della sessione resta invariato.
- Invia `/think` (o `/think:`) senza argomento per vedere il livello di thinking corrente.

## Applicazione per agente

- **Pi incorporato**: il livello risolto viene passato al runtime dell'agente Pi in-process.
- **Backend CLI Claude**: i livelli diversi da off vengono passati a Claude Code come `--effort` quando si usa `claude-cli`; vedi [backend CLI](/it/gateway/cli-backends).

## Modalità veloce (/fast)

- Livelli: `on|off`.
- Un messaggio contenente solo la direttiva alterna un override di sessione della modalità veloce e risponde `Fast mode enabled.` / `Fast mode disabled.`.
- Invia `/fast` (o `/fast status`) senza modalità per vedere lo stato effettivo corrente della modalità veloce.
- OpenClaw risolve la modalità veloce in questo ordine:
  1. `/fast on|off` inline/contenente solo la direttiva
  2. Override di sessione
  3. Valore predefinito per agente (`agents.list[].fastModeDefault`)
  4. Configurazione per modello: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Per `openai/*`, la modalità veloce mappa all'elaborazione prioritaria OpenAI inviando `service_tier=priority` sulle richieste Responses supportate.
- Per `openai-codex/*`, la modalità veloce invia lo stesso flag `service_tier=priority` sulle Responses Codex. OpenClaw mantiene un unico toggle `/fast` condiviso tra entrambi i percorsi di autenticazione.
- Per le richieste pubbliche dirette `anthropic/*`, incluso il traffico autenticato tramite OAuth inviato a `api.anthropic.com`, la modalità veloce mappa ai tier di servizio Anthropic: `/fast on` imposta `service_tier=auto`, `/fast off` imposta `service_tier=standard_only`.
- Per `minimax/*` sul percorso compatibile con Anthropic, `/fast on` (o `params.fastMode: true`) riscrive `MiniMax-M2.7` in `MiniMax-M2.7-highspeed`.
- I parametri modello Anthropic espliciti `serviceTier` / `service_tier` sovrascrivono il valore predefinito della modalità veloce quando entrambi sono impostati. OpenClaw continua a saltare l'iniezione del tier di servizio Anthropic per URL base proxy non Anthropic.
- `/status` mostra `Fast` solo quando la modalità veloce è abilitata.

## Direttive verbose (/verbose o /v)

- Livelli: `on` (minimale) | `full` | `off` (predefinito).
- Un messaggio contenente solo la direttiva alterna il verbose di sessione e risponde `Verbose logging enabled.` / `Verbose logging disabled.`; i livelli non validi restituiscono un suggerimento senza modificare lo stato.
- `/verbose off` salva un override di sessione esplicito; cancellalo tramite l'interfaccia utente Sessioni scegliendo `inherit`.
- La direttiva inline influisce solo su quel messaggio; in caso contrario si applicano i valori predefiniti di sessione/globali.
- Invia `/verbose` (o `/verbose:`) senza argomento per vedere il livello verbose corrente.
- Quando verbose è attivo, gli agenti che emettono risultati strutturati degli strumenti (Pi, altri agenti JSON) rinviano ogni chiamata di strumento come messaggio separato contenente solo metadati, con prefisso `<emoji> <tool-name>: <arg>` quando disponibile. Questi riepiloghi degli strumenti vengono inviati appena ogni strumento si avvia (bolle separate), non come delta di streaming.
- I riepiloghi degli errori degli strumenti restano visibili in modalità normale, ma i suffissi con i dettagli grezzi degli errori sono nascosti a meno che verbose sia `on` o `full`.
- Quando verbose è `full`, anche gli output degli strumenti vengono inoltrati dopo il completamento (bolla separata, troncata a una lunghezza sicura). Se attivi `/verbose on|full|off` mentre un'esecuzione è in corso, le bolle successive degli strumenti rispettano la nuova impostazione.
- `agents.defaults.toolProgressDetail` controlla la forma dei riepiloghi degli strumenti di `/verbose` e delle righe strumento delle bozze di avanzamento. Usa `"explain"` (predefinito) per etichette umane compatte come `🛠️ Exec: checking JS syntax`; usa `"raw"` quando vuoi anche il comando/dettaglio grezzo aggiunto per il debug. `agents.list[].toolProgressDetail` per agente sovrascrive il valore predefinito.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Direttive di tracciamento Plugin (/trace)

- Livelli: `on` | `off` (predefinito).
- Un messaggio contenente solo la direttiva alterna l'output di tracciamento Plugin della sessione e risponde `Plugin trace enabled.` / `Plugin trace disabled.`.
- La direttiva inline influisce solo su quel messaggio; in caso contrario si applicano i valori predefiniti di sessione/globali.
- Invia `/trace` (o `/trace:`) senza argomento per vedere il livello di tracciamento corrente.
- `/trace` è più ristretto di `/verbose`: espone solo righe di traccia/debug di proprietà del Plugin, come i riepiloghi di debug di Active Memory.
- Le righe di traccia possono apparire in `/status` e come messaggio diagnostico successivo dopo la normale risposta dell'assistente.

## Visibilità del ragionamento (/reasoning)

- Livelli: `on|off|stream`.
- Un messaggio contenente solo la direttiva alterna la visualizzazione dei blocchi di thinking nelle risposte.
- Quando abilitato, il ragionamento viene inviato come **messaggio separato** con prefisso `Reasoning:`.
- `stream` (solo Telegram): trasmette in streaming il ragionamento nella bolla bozza di Telegram mentre la risposta viene generata, poi invia la risposta finale senza ragionamento.
- Alias: `/reason`.
- Invia `/reasoning` (o `/reasoning:`) senza argomento per vedere il livello di ragionamento corrente.
- Ordine di risoluzione: direttiva inline, poi override di sessione, poi valore predefinito per agente (`agents.list[].reasoningDefault`), poi fallback (`off`).

I tag di ragionamento dei modelli locali malformati vengono gestiti in modo conservativo. I blocchi `<think>...</think>` chiusi restano nascosti nelle risposte normali, e anche il ragionamento non chiuso dopo testo già visibile viene nascosto. Se una risposta è interamente racchiusa in un singolo tag di apertura non chiuso e altrimenti verrebbe consegnata come testo vuoto, OpenClaw rimuove il tag di apertura malformato e consegna il testo rimanente.

## Correlati

- La documentazione della modalità elevata si trova in [Modalità elevata](/it/tools/elevated).

## Heartbeat

- Il corpo della sonda Heartbeat è il prompt Heartbeat configurato (predefinito: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Le direttive inline in un messaggio Heartbeat si applicano come di consueto (ma evita di modificare i valori predefiniti di sessione dagli Heartbeat).
- La consegna Heartbeat usa per impostazione predefinita solo il payload finale. Per inviare anche il messaggio `Reasoning:` separato (quando disponibile), imposta `agents.defaults.heartbeat.includeReasoning: true` o `agents.list[].heartbeat.includeReasoning: true` per agente.

## Interfaccia web chat

- Il selettore di thinking della chat web rispecchia il livello salvato della sessione dallo store/configurazione della sessione in ingresso quando la pagina viene caricata.
- La scelta di un altro livello scrive immediatamente l'override di sessione tramite `sessions.patch`; non attende il prossimo invio e non è un override `thinkingOnce` valido per una sola volta.
- La prima opzione è sempre `Default (<resolved level>)`, dove il valore predefinito risolto proviene dal profilo di thinking del provider del modello di sessione attivo più la stessa logica di fallback usata da `/status` e `session_status`.
- Il selettore usa `thinkingLevels` restituito dalla riga/impostazioni predefinite della sessione del Gateway, con `thinkingOptions` mantenuto come elenco di etichette legacy. L'interfaccia utente del browser non mantiene un proprio elenco regex di provider; i Plugin possiedono gli insiemi di livelli specifici per modello.
- `/think:<level>` continua a funzionare e aggiorna lo stesso livello di sessione salvato, quindi le direttive della chat e il selettore restano sincronizzati.

## Profili provider

- I plugin provider possono esporre `resolveThinkingProfile(ctx)` per definire i livelli supportati dal modello e il valore predefinito.
- I plugin provider che inoltrano modelli Claude tramite proxy devono riutilizzare `resolveClaudeThinkingProfile(modelId)` da `openclaw/plugin-sdk/provider-model-shared` in modo che i cataloghi Anthropic diretti e quelli proxy restino allineati.
- Ogni livello del profilo ha un `id` canonico memorizzato (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` o `max`) e può includere una `label` di visualizzazione. I provider binari usano `{ id: "low", label: "on" }`.
- I plugin degli strumenti che devono convalidare un override esplicito del ragionamento devono usare `api.runtime.agent.resolveThinkingPolicy({ provider, model })` più `api.runtime.agent.normalizeThinkingLevel(...)`; non devono mantenere proprie liste di livelli per provider/modello.
- I plugin degli strumenti con accesso ai metadati configurati dei modelli personalizzati possono passare `catalog` a `resolveThinkingPolicy` in modo che le adesioni esplicite di `compat.supportedReasoningEfforts` si riflettano nella convalida lato plugin.
- Gli hook legacy pubblicati (`supportsXHighThinking`, `isBinaryThinking` e `resolveDefaultThinkingLevel`) restano come adattatori di compatibilità, ma i nuovi insiemi di livelli personalizzati devono usare `resolveThinkingProfile`.
- Le righe e i valori predefiniti del Gateway espongono `thinkingLevels`, `thinkingOptions` e `thinkingDefault` in modo che i client ACP/chat visualizzino gli stessi id e label del profilo usati dalla convalida a runtime.
