---
read_when:
    - Regolare l'analisi, la fast-mode oppure l'analisi delle direttive verbose o i valori predefiniti
summary: Sintassi delle direttive per /think, /fast, /verbose, /trace e visibilità del ragionamento
title: Livelli di ragionamento
x-i18n:
    generated_at: "2026-06-27T18:23:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cea488a92c6d2a5371dbe0488199f41a56b44616a2936b077644f8a8324e8129
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
  - xhigh → "ultrathink+" (modelli GPT-5.2+ e Codex, più sforzo Anthropic Claude Opus 4.7+)
  - adaptive → ragionamento adattivo gestito dal provider (supportato per Claude 4.6 su Anthropic/Bedrock, Anthropic Claude Opus 4.7+ e Google Gemini dynamic thinking)
  - max → ragionamento massimo del provider (Anthropic Claude Opus 4.7+; Ollama lo mappa al suo massimo sforzo nativo `think`)
  - `x-high`, `x_high`, `extra-high`, `extra high` ed `extra_high` vengono mappati a `xhigh`.
  - `highest` viene mappato a `high`.
- Note sui provider:
  - I menu e i selettori di thinking sono guidati dal profilo del provider. I Plugin dei provider dichiarano l'insieme esatto di livelli per il modello selezionato, incluse etichette come il valore binario `on`.
  - `adaptive`, `xhigh` e `max` vengono pubblicizzati solo per profili provider/modello che li supportano. Le direttive tipizzate per livelli non supportati vengono rifiutate con le opzioni valide per quel modello.
  - I livelli non supportati già memorizzati vengono rimappati in base al rango del profilo del provider. `adaptive` ripiega su `medium` sui modelli non adattivi, mentre `xhigh` e `max` ripiegano sul livello non-off più alto supportato per il modello selezionato.
  - I modelli Anthropic Claude 4.6 usano per impostazione predefinita `adaptive` quando non è impostato alcun livello di thinking esplicito.
  - Anthropic Claude Opus 4.8 e Opus 4.7 mantengono il thinking disattivato a meno che tu non imposti esplicitamente un livello di thinking. Il valore predefinito di sforzo di proprietà del provider per Opus 4.8 è `high` dopo l'abilitazione del thinking adattivo.
  - Anthropic Claude Opus 4.7+ mappa `/think xhigh` al thinking adattivo più `output_config.effort: "xhigh"`, perché `/think` è una direttiva di thinking e `xhigh` è l'impostazione di sforzo di Opus.
  - Anthropic Claude Opus 4.7+ espone anche `/think max`; viene mappato allo stesso percorso di sforzo massimo di proprietà del provider.
  - I modelli Direct DeepSeek V4 espongono `/think xhigh|max`; entrambi vengono mappati a DeepSeek `reasoning_effort: "max"`, mentre i livelli inferiori non-off vengono mappati a `high`.
  - I modelli DeepSeek V4 instradati tramite OpenRouter espongono `/think xhigh` e inviano valori `reasoning_effort` supportati da OpenRouter. Gli override `max` memorizzati ripiegano su `xhigh`.
  - I modelli Ollama capaci di thinking espongono `/think low|medium|high|max`; `max` viene mappato al valore nativo `think: "high"` perché l'API nativa di Ollama accetta le stringhe di sforzo `low`, `medium` e `high`.
  - I modelli OpenAI GPT mappano `/think` tramite il supporto dello sforzo specifico del modello nella Responses API. `/think off` invia `reasoning.effort: "none"` solo quando il modello di destinazione lo supporta; altrimenti OpenClaw omette il payload di ragionamento disabilitato invece di inviare un valore non supportato.
  - Le voci di catalogo personalizzate compatibili con OpenAI possono abilitare `/think xhigh` impostando `models.providers.<provider>.models[].compat.supportedReasoningEfforts` in modo da includere `"xhigh"`. Questo usa gli stessi metadati di compatibilità che mappano i payload in uscita dello sforzo di ragionamento OpenAI, quindi menu, validazione della sessione, CLI dell'agente e `llm-task` concordano con il comportamento di trasporto.
  - I riferimenti OpenRouter Hunter Alpha configurati e obsoleti saltano l'iniezione di ragionamento proxy perché quella rotta ritirata poteva restituire testo di risposta finale tramite campi di ragionamento.
  - Google Gemini mappa `/think adaptive` al dynamic thinking di proprietà del provider di Gemini. Le richieste Gemini 3 omettono un `thinkingLevel` fisso, mentre le richieste Gemini 2.5 inviano `thinkingBudget: -1`; i livelli fissi vengono comunque mappati al `thinkingLevel` o budget Gemini più vicino per quella famiglia di modelli.
  - MiniMax M2.x (`minimax/MiniMax-M2*`) sul percorso di streaming compatibile con Anthropic usa per impostazione predefinita `thinking: { type: "disabled" }` a meno che tu non imposti esplicitamente il thinking nei parametri del modello o della richiesta. Questo evita delta `reasoning_content` trapelati dal formato di stream Anthropic non nativo di M2.x. MiniMax-M3 (e M3.x) è esente: M3 emette blocchi di thinking Anthropic corretti e restituisce contenuto vuoto quando il thinking è disabilitato, quindi OpenClaw mantiene M3 sul percorso di thinking omesso/adattivo del provider.
  - Z.AI (`zai/*`) è binario (`on`/`off`) per la maggior parte dei modelli GLM. GLM-5.2 è l'eccezione: espone `/think off|low|high|max`, mappa `low` e `high` a Z.AI `reasoning_effort: "high"` e mappa `max` a `reasoning_effort: "max"`.
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) pensa sempre. Il suo profilo espone solo `on` e OpenClaw omette il campo in uscita `thinking` come richiesto da Moonshot. Gli altri modelli `moonshot/*` mappano `/think off` a `thinking: { type: "disabled" }` e qualsiasi livello non-`off` a `thinking: { type: "enabled" }`. Quando il thinking è abilitato, Moonshot accetta solo `tool_choice` `auto|none`; OpenClaw normalizza i valori incompatibili a `auto`.

## Ordine di risoluzione

1. Direttiva inline sul messaggio (si applica solo a quel messaggio).
2. Override di sessione (impostato inviando un messaggio composto solo dalla direttiva).
3. Valore predefinito per agente (`agents.list[].thinkingDefault` nella configurazione).
4. Valore predefinito globale (`agents.defaults.thinkingDefault` nella configurazione).
5. Fallback: valore predefinito dichiarato dal provider quando disponibile; altrimenti i modelli capaci di ragionamento si risolvono a `medium` o al livello non-`off` supportato più vicino per quel modello, e i modelli non capaci di ragionamento restano `off`.

## Impostare un valore predefinito di sessione

- Invia un messaggio che contenga **solo** la direttiva (spazi consentiti), ad esempio `/think:medium` o `/t high`.
- Resta valido per la sessione corrente (per mittente per impostazione predefinita). Usa `/think default` per cancellare l'override di sessione ed ereditare il valore predefinito configurato/del provider; gli alias includono `inherit`, `clear`, `reset` e `unpin`.
- `/think off` memorizza un override off esplicito. Disabilita il thinking finché non modifichi o cancelli l'override di sessione.
- Viene inviata una risposta di conferma (`Thinking level set to high.` / `Thinking disabled.`). Se il livello non è valido (ad esempio `/thinking big`), il comando viene rifiutato con un suggerimento e lo stato della sessione resta invariato.
- Invia `/think` (o `/think:`) senza argomento per vedere il livello di thinking corrente.

## Applicazione per agente

- **OpenClaw incorporato**: il livello risolto viene passato al runtime dell'agente OpenClaw in-process.
- **Backend Claude CLI**: i livelli non-off vengono passati a Claude Code come `--effort` quando si usa `claude-cli`; vedi [backend CLI](/it/gateway/cli-backends).

## Modalità veloce (/fast)

- Livelli: `auto|on|off|default`.
- Un messaggio composto solo dalla direttiva attiva/disattiva un override di sessione della modalità veloce e risponde `Fast mode set to auto.`, `Fast mode enabled.` o `Fast mode disabled.`. Usa `/fast default` per cancellare l'override di sessione ed ereditare il valore predefinito configurato; gli alias includono `inherit`, `clear`, `reset` e `unpin`.
- Invia `/fast` (o `/fast status`) senza modalità per vedere lo stato effettivo corrente della modalità veloce.
- OpenClaw risolve la modalità veloce in questo ordine:
  1. Override inline/solo direttiva `/fast auto|on|off` (`/fast default` cancella questo livello)
  2. Override di sessione
  3. Valore predefinito per agente (`agents.list[].fastModeDefault`)
  4. Configurazione per modello: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- `auto` mantiene la modalità sessione/configurazione come auto ma risolve ogni nuova chiamata al modello in modo indipendente. Le chiamate che iniziano prima del cutoff auto hanno la modalità veloce abilitata; le chiamate successive di retry, fallback, risultato di tool o continuazione iniziano con la modalità veloce disabilitata. Il cutoff predefinito è 60 secondi; imposta `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` sul modello attivo per modificarlo.
- Per `openai/*`, la modalità veloce viene mappata all'elaborazione prioritaria di OpenAI inviando `service_tier=priority` sulle richieste Responses supportate.
- Per i modelli `openai/*` / `openai-codex/*` supportati da Codex, la modalità veloce invia lo stesso flag `service_tier=priority` su Codex Responses. I turni app-server nativi di Codex ricevono il tier solo su `turn/start` o all'avvio/ripresa del thread, quindi `auto` non può cambiare tier a un turno app-server già in esecuzione; si applica al successivo turno di modello avviato da OpenClaw.
- Per le richieste pubbliche dirette `anthropic/*`, incluso il traffico autenticato tramite OAuth inviato a `api.anthropic.com`, la modalità veloce viene mappata ai tier di servizio Anthropic: `/fast on` imposta `service_tier=auto`, `/fast off` imposta `service_tier=standard_only`.
- Per `minimax/*` sul percorso compatibile con Anthropic, `/fast on` (o `params.fastMode: true`) riscrive `MiniMax-M2.7` in `MiniMax-M2.7-highspeed`.
- I parametri di modello Anthropic espliciti `serviceTier` / `service_tier` sovrascrivono il valore predefinito della modalità veloce quando entrambi sono impostati. OpenClaw salta comunque l'iniezione del tier di servizio Anthropic per URL di base proxy non Anthropic.
- `/status` mostra `Fast` quando la modalità veloce è abilitata e `Fast:auto` quando la modalità configurata è auto.

## Direttive verbose (/verbose o /v)

- Livelli: `on` (minimo) | `full` | `off` (predefinito).
- Un messaggio composto solo dalla direttiva attiva/disattiva verbose di sessione e risponde `Verbose logging enabled.` / `Verbose logging disabled.`; i livelli non validi restituiscono un suggerimento senza modificare lo stato.
- `/verbose off` memorizza un override di sessione esplicito; cancellalo tramite l'interfaccia Sessions scegliendo `inherit`.
- I mittenti autorizzati di canali esterni possono persistere l'override verbose di sessione. I client interni gateway/webchat necessitano di `operator.admin` per persisterlo.
- La direttiva inline influisce solo su quel messaggio; altrimenti si applicano i valori predefiniti di sessione/globali.
- Invia `/verbose` (o `/verbose:`) senza argomento per vedere il livello verbose corrente.
- Quando verbose è attivo, gli agenti che emettono risultati di tool strutturati inviano ogni chiamata di tool come messaggio separato solo metadati, prefissato con `<emoji> <tool-name>: <arg>` quando disponibile. Questi riepiloghi dei tool vengono inviati non appena ogni tool si avvia (bolle separate), non come delta di streaming.
- I riepiloghi di errore dei tool restano visibili in modalità normale, ma i suffissi con dettagli di errore grezzi sono nascosti a meno che verbose non sia `full`.
- Quando verbose è `full`, anche gli output dei tool vengono inoltrati dopo il completamento (bolla separata, troncata a una lunghezza sicura). Se attivi/disattivi `/verbose on|full|off` mentre un'esecuzione è in corso, le bolle di tool successive rispettano la nuova impostazione.
- `agents.defaults.toolProgressDetail` controlla la forma dei riepiloghi dei tool `/verbose` e delle righe tool delle bozze di avanzamento. Usa `"explain"` (predefinito) per etichette umane compatte come `🛠️ Exec: checking JS syntax`; usa `"raw"` quando vuoi anche il comando/dettaglio grezzo aggiunto per il debug. `agents.list[].toolProgressDetail` per agente sovrascrive il valore predefinito.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Direttive di traccia Plugin (/trace)

- Livelli: `on` | `off` (predefinito).
- Un messaggio composto solo dalla direttiva attiva/disattiva l'output di traccia Plugin di sessione e risponde `Plugin trace enabled.` / `Plugin trace disabled.`.
- La direttiva inline influisce solo su quel messaggio; altrimenti si applicano i valori predefiniti di sessione/globali.
- Invia `/trace` (o `/trace:`) senza argomento per vedere il livello di traccia corrente.
- `/trace` è più ristretto di `/verbose`: espone solo righe di traccia/debug di proprietà dei Plugin, come i riepiloghi di debug di Active Memory.
- Le righe di traccia possono apparire in `/status` e come messaggio diagnostico successivo dopo la normale risposta dell'assistente.

## Visibilità del ragionamento (/reasoning)

- Livelli: `on|off|stream`.
- Un messaggio composto solo dalla direttiva attiva/disattiva la visualizzazione dei blocchi di thinking nelle risposte.
- Quando abilitato, il ragionamento viene inviato come **messaggio separato** prefissato con `Thinking`.
- `stream`: trasmette in streaming il ragionamento mentre la risposta viene generata quando il canale attivo supporta le anteprime del ragionamento, quindi invia la risposta finale senza ragionamento.
- Alias: `/reason`.
- Invia `/reasoning` (o `/reasoning:`) senza argomento per vedere il livello di ragionamento corrente.
- Ordine di risoluzione: direttiva inline, poi override di sessione, poi valore predefinito per agente (`agents.list[].reasoningDefault`), poi valore predefinito globale (`agents.defaults.reasoningDefault`), poi fallback (`off`).

I tag di ragionamento del modello locale malformati vengono gestiti in modo conservativo. I blocchi `<think>...</think>` chiusi restano nascosti nelle risposte normali, e viene nascosto anche il ragionamento non chiuso dopo testo già visibile. Se una risposta è interamente racchiusa in un singolo tag di apertura non chiuso e altrimenti verrebbe consegnata come testo vuoto, OpenClaw rimuove il tag di apertura malformato e consegna il testo rimanente.

## Correlati

- La documentazione della modalità elevata si trova in [Modalità elevata](/it/tools/elevated).

## Heartbeat

- Il corpo della sonda Heartbeat è il prompt Heartbeat configurato (predefinito: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Le direttive inline in un messaggio Heartbeat si applicano come di consueto (ma evita di modificare i valori predefiniti della sessione dagli Heartbeat).
- La consegna Heartbeat usa per impostazione predefinita solo il payload finale. Per inviare anche il messaggio `Thinking` separato (quando disponibile), imposta `agents.defaults.heartbeat.includeReasoning: true` o, per singolo agente, `agents.list[].heartbeat.includeReasoning: true`.

## UI della chat web

- Il selettore del ragionamento della chat web rispecchia il livello memorizzato della sessione dall'archivio/configurazione della sessione in ingresso quando la pagina viene caricata.
- La scelta di un altro livello scrive immediatamente l'override della sessione tramite `sessions.patch`; non attende l'invio successivo e non è un override monouso `thinkingOnce`.
- La prima opzione è sempre la scelta per cancellare l'override. Mostra `Inherited: <resolved level>`, incluso `Inherited: Off` quando il ragionamento ereditato è disabilitato.
- Le scelte esplicite del selettore usano le etichette dirette dei rispettivi livelli, preservando le etichette del provider quando presenti (per esempio `Maximum` per un'opzione `max` etichettata dal provider).
- Il selettore usa `thinkingLevels` restituito dalla riga/predefiniti della sessione del Gateway, mantenendo `thinkingOptions` come elenco legacy di etichette. La UI del browser non mantiene un proprio elenco di regex dei provider; i plugin possiedono gli insiemi di livelli specifici del modello.
- `/think:<level>` continua a funzionare e aggiorna lo stesso livello di sessione memorizzato, quindi le direttive della chat e il selettore restano sincronizzati.

## Profili dei provider

- I plugin provider possono esporre `resolveThinkingProfile(ctx)` per definire i livelli supportati dal modello e il valore predefinito.
- I plugin provider che fanno da proxy ai modelli Claude dovrebbero riutilizzare `resolveClaudeThinkingProfile(modelId)` da `openclaw/plugin-sdk/provider-model-shared` in modo che i cataloghi Anthropic diretti e proxy restino allineati.
- Ogni livello di profilo ha un `id` canonico memorizzato (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` o `max`) e può includere una `label` di visualizzazione. I provider binari usano `{ id: "low", label: "on" }`.
- Gli hook di profilo ricevono i fatti del catalogo uniti quando disponibili, inclusi `reasoning`, `compat.thinkingFormat` e `compat.supportedReasoningEfforts`. Usa questi fatti per esporre profili binari o personalizzati solo quando il contratto di richiesta configurato supporta il payload corrispondente.
- I plugin di strumenti che devono validare un override esplicito del ragionamento dovrebbero usare `api.runtime.agent.resolveThinkingPolicy({ provider, model })` più `api.runtime.agent.normalizeThinkingLevel(...)`; non dovrebbero mantenere propri elenchi di livelli per provider/modello.
- I plugin di strumenti con accesso ai metadati configurati dei modelli personalizzati possono passare `catalog` a `resolveThinkingPolicy`, così gli opt-in `compat.supportedReasoningEfforts` vengono riflessi nella validazione lato plugin.
- Gli hook legacy pubblicati (`supportsXHighThinking`, `isBinaryThinking` e `resolveDefaultThinkingLevel`) restano come adattatori di compatibilità, ma i nuovi insiemi di livelli personalizzati dovrebbero usare `resolveThinkingProfile`.
- Le righe/i predefiniti del Gateway espongono `thinkingLevels`, `thinkingOptions` e `thinkingDefault` affinché i client ACP/chat visualizzino gli stessi id ed etichette di profilo usati dalla validazione runtime.
