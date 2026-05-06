---
read_when:
    - Modifica dell'analisi o delle impostazioni predefinite delle direttive di ragionamento, modalità rapida o verbosità
summary: Sintassi delle direttive per /think, /fast, /verbose, /trace e visibilità del ragionamento
title: Livelli di ragionamento
x-i18n:
    generated_at: "2026-05-06T09:13:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19fed0d7d8499d177361d125027ca5001dfe73a4ea5bc7f7475faa10541c7a83
    source_path: tools/thinking.md
    workflow: 16
---

## Cosa fa

- Direttiva inline in qualsiasi corpo in ingresso: `/t <level>`, `/think:<level>` o `/thinking <level>`.
- Livelli (alias): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink" (budget massimo)
  - xhigh → "ultrathink+" (modelli GPT-5.2+ e Codex, più effort di Anthropic Claude Opus 4.7)
  - adaptive → ragionamento adattivo gestito dal provider (supportato per Claude 4.6 su Anthropic/Bedrock, Anthropic Claude Opus 4.7 e ragionamento dinamico di Google Gemini)
  - max → reasoning massimo del provider (Anthropic Claude Opus 4.7; Ollama lo mappa al proprio effort `think` nativo più alto)
  - `x-high`, `x_high`, `extra-high`, `extra high` e `extra_high` vengono mappati a `xhigh`.
  - `highest` viene mappato a `high`.
- Note sui provider:
  - I menu e i selettori di ragionamento sono guidati dal profilo del provider. I plugin del provider dichiarano l'insieme esatto dei livelli per il modello selezionato, incluse etichette come il valore binario `on`.
  - `adaptive`, `xhigh` e `max` vengono mostrati solo per profili provider/modello che li supportano. Le direttive digitate per livelli non supportati vengono rifiutate con le opzioni valide di quel modello.
  - I livelli non supportati già memorizzati vengono rimappati in base al rango del profilo del provider. `adaptive` ripiega su `medium` sui modelli non adattivi, mentre `xhigh` e `max` ripiegano sul livello non-off più alto supportato per il modello selezionato.
  - I modelli Anthropic Claude 4.6 usano `adaptive` come predefinito quando non è impostato alcun livello di ragionamento esplicito.
  - Anthropic Claude Opus 4.7 non usa il ragionamento adattivo come impostazione predefinita. Il suo effort API predefinito resta gestito dal provider a meno che non imposti esplicitamente un livello di ragionamento.
  - Anthropic Claude Opus 4.7 mappa `/think xhigh` al ragionamento adattivo più `output_config.effort: "xhigh"`, perché `/think` è una direttiva di ragionamento e `xhigh` è l'impostazione di effort di Opus 4.7.
  - Anthropic Claude Opus 4.7 espone anche `/think max`; viene mappato allo stesso percorso di effort massimo gestito dal provider.
  - I modelli Direct DeepSeek V4 espongono `/think xhigh|max`; entrambi vengono mappati a DeepSeek `reasoning_effort: "max"`, mentre i livelli inferiori non-off vengono mappati a `high`.
  - I modelli DeepSeek V4 instradati tramite OpenRouter espongono `/think xhigh` e inviano valori `reasoning_effort` supportati da OpenRouter. Gli override `max` memorizzati ripiegano su `xhigh`.
  - I modelli Ollama con capacità di ragionamento espongono `/think low|medium|high|max`; `max` viene mappato al nativo `think: "high"` perché l'API nativa di Ollama accetta le stringhe di effort `low`, `medium` e `high`.
  - I modelli OpenAI GPT mappano `/think` tramite il supporto all'effort specifico del modello della Responses API. `/think off` invia `reasoning.effort: "none"` solo quando il modello di destinazione lo supporta; altrimenti OpenClaw omette il payload di reasoning disabilitato invece di inviare un valore non supportato.
  - Le voci di catalogo personalizzate compatibili con OpenAI possono abilitare `/think xhigh` impostando `models.providers.<provider>.models[].compat.supportedReasoningEfforts` in modo che includa `"xhigh"`. Questo usa gli stessi metadati di compatibilità che mappano i payload di effort di reasoning OpenAI in uscita, quindi menu, validazione della sessione, CLI dell'agente e `llm-task` concordano con il comportamento del trasporto.
  - I riferimenti OpenRouter Hunter Alpha configurati obsoleti saltano l'iniezione di reasoning del proxy perché quella route ritirata poteva restituire testo della risposta finale tramite campi di reasoning.
  - Google Gemini mappa `/think adaptive` al ragionamento dinamico gestito dal provider di Gemini. Le richieste Gemini 3 omettono un `thinkingLevel` fisso, mentre le richieste Gemini 2.5 inviano `thinkingBudget: -1`; i livelli fissi continuano a essere mappati al `thinkingLevel` o al budget Gemini più vicino per quella famiglia di modelli.
  - MiniMax (`minimax/*`) sul percorso di streaming compatibile con Anthropic usa come predefinito `thinking: { type: "disabled" }` a meno che tu non imposti esplicitamente il ragionamento nei parametri del modello o della richiesta. Questo evita delta `reasoning_content` trapelati dal formato di stream Anthropic non nativo di MiniMax.
  - Z.AI (`zai/*`) supporta solo il ragionamento binario (`on`/`off`). Qualsiasi livello diverso da `off` viene trattato come `on` (mappato a `low`).
  - Moonshot (`moonshot/*`) mappa `/think off` a `thinking: { type: "disabled" }` e qualsiasi livello diverso da `off` a `thinking: { type: "enabled" }`. Quando il ragionamento è abilitato, Moonshot accetta solo `tool_choice` `auto|none`; OpenClaw normalizza i valori incompatibili a `auto`.

## Ordine di risoluzione

1. Direttiva inline sul messaggio (si applica solo a quel messaggio).
2. Override di sessione (impostato inviando un messaggio contenente solo la direttiva).
3. Predefinito per agente (`agents.list[].thinkingDefault` nella configurazione).
4. Predefinito globale (`agents.defaults.thinkingDefault` nella configurazione).
5. Fallback: predefinito dichiarato dal provider quando disponibile; altrimenti i modelli con capacità di reasoning vengono risolti a `medium` o al livello non-`off` supportato più vicino per quel modello, e i modelli senza reasoning restano `off`.

## Impostare un predefinito di sessione

- Invia un messaggio che sia **solo** la direttiva (spazi consentiti), ad esempio `/think:medium` o `/t high`.
- Rimane valido per la sessione corrente (per mittente, per impostazione predefinita); viene cancellato da `/think:off` o dal reset per inattività della sessione.
- Viene inviata una risposta di conferma (`Thinking level set to high.` / `Thinking disabled.`). Se il livello non è valido (ad esempio `/thinking big`), il comando viene rifiutato con un suggerimento e lo stato della sessione resta invariato.
- Invia `/think` (o `/think:`) senza argomento per vedere il livello di ragionamento corrente.

## Applicazione per agente

- **Pi incorporato**: il livello risolto viene passato al runtime dell'agente Pi in-process.
- **Backend Claude CLI**: i livelli diversi da off vengono passati a Claude Code come `--effort` quando si usa `claude-cli`; consulta [backend CLI](/it/gateway/cli-backends).

## Modalità veloce (/fast)

- Livelli: `on|off`.
- Un messaggio contenente solo la direttiva attiva/disattiva un override di sessione della modalità veloce e risponde `Fast mode enabled.` / `Fast mode disabled.`.
- Invia `/fast` (o `/fast status`) senza modalità per vedere lo stato effettivo corrente della modalità veloce.
- OpenClaw risolve la modalità veloce in questo ordine:
  1. `/fast on|off` inline/con solo direttiva
  2. Override di sessione
  3. Predefinito per agente (`agents.list[].fastModeDefault`)
  4. Configurazione per modello: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Per `openai/*`, la modalità veloce viene mappata all'elaborazione prioritaria di OpenAI inviando `service_tier=priority` nelle richieste Responses supportate.
- Per `openai-codex/*`, la modalità veloce invia lo stesso flag `service_tier=priority` nelle Responses Codex. OpenClaw mantiene un unico toggle `/fast` condiviso tra entrambi i percorsi di autenticazione.
- Per le richieste pubbliche dirette `anthropic/*`, incluso il traffico autenticato tramite OAuth inviato a `api.anthropic.com`, la modalità veloce viene mappata ai tier di servizio Anthropic: `/fast on` imposta `service_tier=auto`, `/fast off` imposta `service_tier=standard_only`.
- Per `minimax/*` sul percorso compatibile con Anthropic, `/fast on` (o `params.fastMode: true`) riscrive `MiniMax-M2.7` in `MiniMax-M2.7-highspeed`.
- I parametri modello Anthropic espliciti `serviceTier` / `service_tier` sovrascrivono il predefinito della modalità veloce quando sono entrambi impostati. OpenClaw continua a saltare l'iniezione del tier di servizio Anthropic per gli URL base di proxy non Anthropic.
- `/status` mostra `Fast` solo quando la modalità veloce è abilitata.

## Direttive verbose (/verbose o /v)

- Livelli: `on` (minimo) | `full` | `off` (predefinito).
- Un messaggio contenente solo la direttiva attiva/disattiva il verbose di sessione e risponde `Verbose logging enabled.` / `Verbose logging disabled.`; i livelli non validi restituiscono un suggerimento senza modificare lo stato.
- `/verbose off` memorizza un override di sessione esplicito; cancellalo tramite l'interfaccia Sessions scegliendo `inherit`.
- La direttiva inline influisce solo su quel messaggio; altrimenti si applicano i predefiniti di sessione/globali.
- Invia `/verbose` (o `/verbose:`) senza argomento per vedere il livello verbose corrente.
- Quando verbose è attivo, gli agenti che emettono risultati di strumenti strutturati (Pi, altri agenti JSON) inviano ogni chiamata strumento come un proprio messaggio solo metadati, con prefisso `<emoji> <tool-name>: <arg>` quando disponibile. Questi riepiloghi degli strumenti vengono inviati non appena ogni strumento si avvia (bolle separate), non come delta di streaming.
- I riepiloghi dei fallimenti degli strumenti restano visibili in modalità normale, ma i suffissi con dettagli di errore grezzi sono nascosti a meno che verbose sia `on` o `full`.
- Quando verbose è `full`, anche gli output degli strumenti vengono inoltrati dopo il completamento (bolla separata, troncata a una lunghezza sicura). Se attivi `/verbose on|full|off` mentre un'esecuzione è in corso, le bolle degli strumenti successive rispettano la nuova impostazione.
- `agents.defaults.toolProgressDetail` controlla la forma dei riepiloghi degli strumenti di `/verbose` e delle righe degli strumenti nelle bozze di avanzamento. Usa `"explain"` (predefinito) per etichette umane compatte come `🛠️ Exec: checking JS syntax`; usa `"raw"` quando vuoi anche il comando/dettaglio grezzo aggiunto per il debug. `agents.list[].toolProgressDetail` per agente sovrascrive il predefinito.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Direttive di trace Plugin (/trace)

- Livelli: `on` | `off` (predefinito).
- Un messaggio contenente solo la direttiva attiva/disattiva l'output di trace del plugin di sessione e risponde `Plugin trace enabled.` / `Plugin trace disabled.`.
- La direttiva inline influisce solo su quel messaggio; altrimenti si applicano i predefiniti di sessione/globali.
- Invia `/trace` (o `/trace:`) senza argomento per vedere il livello di trace corrente.
- `/trace` è più ristretto di `/verbose`: espone solo righe di trace/debug di proprietà del plugin, come i riepiloghi di debug di Active Memory.
- Le righe di trace possono comparire in `/status` e come messaggio diagnostico successivo dopo la normale risposta dell'assistente.

## Visibilità del reasoning (/reasoning)

- Livelli: `on|off|stream`.
- Un messaggio contenente solo la direttiva attiva/disattiva la visualizzazione dei blocchi di ragionamento nelle risposte.
- Quando abilitato, il reasoning viene inviato come **messaggio separato** con prefisso `Reasoning:`.
- `stream` (solo Telegram): trasmette il reasoning nella bolla bozza di Telegram mentre la risposta viene generata, quindi invia la risposta finale senza reasoning.
- Alias: `/reason`.
- Invia `/reasoning` (o `/reasoning:`) senza argomento per vedere il livello di reasoning corrente.
- Ordine di risoluzione: direttiva inline, poi override di sessione, poi predefinito per agente (`agents.list[].reasoningDefault`), poi fallback (`off`).

I tag di reasoning malformati dei modelli locali vengono gestiti in modo conservativo. I blocchi chiusi `<think>...</think>` restano nascosti nelle risposte normali, e anche il reasoning non chiuso dopo testo già visibile viene nascosto. Se una risposta è interamente racchiusa in un singolo tag di apertura non chiuso e altrimenti verrebbe consegnata come testo vuoto, OpenClaw rimuove il tag di apertura malformato e consegna il testo rimanente.

## Correlati

- La documentazione della modalità elevata si trova in [Modalità elevata](/it/tools/elevated).

## Heartbeat

- Il corpo della sonda Heartbeat è il prompt heartbeat configurato (predefinito: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Le direttive inline in un messaggio heartbeat si applicano come di consueto (ma evita di modificare i predefiniti di sessione dagli heartbeat).
- La consegna Heartbeat invia per impostazione predefinita solo il payload finale. Per inviare anche il messaggio `Reasoning:` separato (quando disponibile), imposta `agents.defaults.heartbeat.includeReasoning: true` o, per agente, `agents.list[].heartbeat.includeReasoning: true`.

## Interfaccia web chat

- Il selettore di ragionamento della web chat rispecchia il livello memorizzato della sessione dallo store/config della sessione in ingresso quando la pagina viene caricata.
- Scegliere un altro livello scrive immediatamente l'override di sessione tramite `sessions.patch`; non attende il prossimo invio e non è un override una tantum `thinkingOnce`.
- La prima opzione è sempre `Default (<resolved level>)`, dove il predefinito risolto proviene dal profilo di ragionamento del provider del modello della sessione attiva più la stessa logica di fallback usata da `/status` e `session_status`.
- Il selettore usa `thinkingLevels` restituito dalla riga/default della sessione del gateway, mantenendo `thinkingOptions` come elenco di etichette legacy. L'interfaccia browser non mantiene un proprio elenco regex dei provider; i plugin possiedono gli insiemi di livelli specifici per modello.
- `/think:<level>` continua a funzionare e aggiorna lo stesso livello di sessione memorizzato, quindi le direttive chat e il selettore restano sincronizzati.

## Profili provider

- I Plugin provider possono esporre `resolveThinkingProfile(ctx)` per definire i livelli supportati dal modello e il valore predefinito.
- I Plugin provider che fanno da proxy ai modelli Claude devono riutilizzare `resolveClaudeThinkingProfile(modelId)` da `openclaw/plugin-sdk/provider-model-shared` così che i cataloghi Anthropic diretti e proxy restino allineati.
- Ogni livello del profilo ha un `id` canonico memorizzato (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` o `max`) e può includere una `label` di visualizzazione. I provider binari usano `{ id: "low", label: "on" }`.
- I Plugin di strumenti che devono convalidare un override esplicito del reasoning devono usare `api.runtime.agent.resolveThinkingPolicy({ provider, model })` insieme a `api.runtime.agent.normalizeThinkingLevel(...)`; non devono mantenere elenchi propri di livelli per provider/modello.
- I Plugin di strumenti con accesso ai metadati configurati dei modelli personalizzati possono passare `catalog` a `resolveThinkingPolicy` così che le adesioni esplicite a `compat.supportedReasoningEfforts` siano riflesse nella convalida lato Plugin.
- Gli hook legacy pubblicati (`supportsXHighThinking`, `isBinaryThinking` e `resolveDefaultThinkingLevel`) restano come adattatori di compatibilità, ma i nuovi set di livelli personalizzati devono usare `resolveThinkingProfile`.
- Le righe/i valori predefiniti del Gateway espongono `thinkingLevels`, `thinkingOptions` e `thinkingDefault` così che i client ACP/chat visualizzino gli stessi id e label del profilo usati dalla convalida a runtime.
