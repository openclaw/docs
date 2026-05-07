---
read_when:
    - Regolazione del parsing o dei valori predefiniti delle direttive thinking, fast-mode o verbose
summary: Sintassi delle direttive per /think, /fast, /verbose, /trace e la visibilità del ragionamento
title: Livelli di ragionamento
x-i18n:
    generated_at: "2026-05-07T13:27:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8890563aa0171d41549f1d1a6af3279babbcba17eb19302753275e9e2ff01980
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
  - adaptive → ragionamento adattivo gestito dal provider (supportato per Claude 4.6 su Anthropic/Bedrock, Anthropic Claude Opus 4.7 e Google Gemini dynamic thinking)
  - max → ragionamento massimo del provider (Anthropic Claude Opus 4.7; Ollama lo mappa al suo effort `think` nativo più alto)
  - `x-high`, `x_high`, `extra-high`, `extra high` e `extra_high` mappano a `xhigh`.
  - `highest` mappa a `high`.
- Note sui provider:
  - I menu e i selettori di Thinking sono guidati dal profilo del provider. I Plugin provider dichiarano l'insieme esatto di livelli per il modello selezionato, incluse etichette come il binario `on`.
  - `adaptive`, `xhigh` e `max` vengono pubblicizzati solo per profili provider/modello che li supportano. Le direttive digitate per livelli non supportati vengono rifiutate con le opzioni valide di quel modello.
  - I livelli non supportati già memorizzati vengono rimappati in base al rango del profilo provider. `adaptive` ripiega su `medium` sui modelli non adattivi, mentre `xhigh` e `max` ripiegano sul livello non-off più alto supportato dal modello selezionato.
  - I modelli Anthropic Claude 4.6 usano per impostazione predefinita `adaptive` quando non è impostato alcun livello di thinking esplicito.
  - Anthropic Claude Opus 4.7 non usa per impostazione predefinita il thinking adattivo. Il valore predefinito dell'effort della sua API resta di proprietà del provider, salvo impostare esplicitamente un livello di thinking.
  - Anthropic Claude Opus 4.7 mappa `/think xhigh` al thinking adattivo più `output_config.effort: "xhigh"`, perché `/think` è una direttiva di thinking e `xhigh` è l'impostazione di effort di Opus 4.7.
  - Anthropic Claude Opus 4.7 espone anche `/think max`; viene mappato allo stesso percorso di effort massimo di proprietà del provider.
  - I modelli Direct DeepSeek V4 espongono `/think xhigh|max`; entrambi mappano a DeepSeek `reasoning_effort: "max"`, mentre i livelli non-off inferiori mappano a `high`.
  - I modelli DeepSeek V4 instradati tramite OpenRouter espongono `/think xhigh` e inviano valori `reasoning_effort` supportati da OpenRouter. Gli override `max` memorizzati ripiegano su `xhigh`.
  - I modelli Ollama con capacità di thinking espongono `/think low|medium|high|max`; `max` mappa a `think: "high"` nativo perché l'API nativa di Ollama accetta le stringhe di effort `low`, `medium` e `high`.
  - I modelli OpenAI GPT mappano `/think` attraverso il supporto dell'effort specifico del modello nella Responses API. `/think off` invia `reasoning.effort: "none"` solo quando il modello di destinazione lo supporta; altrimenti OpenClaw omette il payload di ragionamento disabilitato invece di inviare un valore non supportato.
  - Le voci di catalogo personalizzate compatibili con OpenAI possono abilitare `/think xhigh` impostando `models.providers.<provider>.models[].compat.supportedReasoningEfforts` in modo da includere `"xhigh"`. Usa gli stessi metadati compat che mappano i payload di effort di ragionamento OpenAI in uscita, quindi menu, validazione della sessione, CLI agent e `llm-task` restano coerenti con il comportamento di trasporto.
  - I riferimenti OpenRouter Hunter Alpha configurati obsoleti saltano l'iniezione del ragionamento proxy perché quella route ritirata poteva restituire il testo della risposta finale tramite campi di ragionamento.
  - Google Gemini mappa `/think adaptive` al dynamic thinking di proprietà del provider Gemini. Le richieste Gemini 3 omettono un `thinkingLevel` fisso, mentre le richieste Gemini 2.5 inviano `thinkingBudget: -1`; i livelli fissi continuano a mappare al `thinkingLevel` o budget Gemini più vicino per quella famiglia di modelli.
  - MiniMax (`minimax/*`) sul percorso di streaming compatibile con Anthropic usa per impostazione predefinita `thinking: { type: "disabled" }`, salvo impostare esplicitamente il thinking nei parametri del modello o della richiesta. Questo evita delta `reasoning_content` trapelati dal formato stream Anthropic non nativo di MiniMax.
  - Z.AI (`zai/*`) supporta solo thinking binario (`on`/`off`). Qualsiasi livello diverso da `off` viene trattato come `on` (mappato a `low`).
  - Moonshot (`moonshot/*`) mappa `/think off` a `thinking: { type: "disabled" }` e qualsiasi livello diverso da `off` a `thinking: { type: "enabled" }`. Quando il thinking è abilitato, Moonshot accetta solo `tool_choice` `auto|none`; OpenClaw normalizza i valori incompatibili a `auto`.

## Ordine di risoluzione

1. Direttiva inline nel messaggio (si applica solo a quel messaggio).
2. Override di sessione (impostato inviando un messaggio contenente solo la direttiva).
3. Valore predefinito per agent (`agents.list[].thinkingDefault` nella configurazione).
4. Valore predefinito globale (`agents.defaults.thinkingDefault` nella configurazione).
5. Fallback: valore predefinito dichiarato dal provider quando disponibile; altrimenti i modelli con capacità di ragionamento si risolvono a `medium` o al livello non-`off` supportato più vicino per quel modello, mentre i modelli senza ragionamento restano `off`.

## Impostare un valore predefinito di sessione

- Invia un messaggio che sia **solo** la direttiva (spazi consentiti), ad esempio `/think:medium` o `/t high`.
- Rimane valido per la sessione corrente (per impostazione predefinita per mittente); viene cancellato da `/think:off` o dal reset della sessione per inattività.
- Viene inviata una risposta di conferma (`Thinking level set to high.` / `Thinking disabled.`). Se il livello non è valido (ad esempio `/thinking big`), il comando viene rifiutato con un suggerimento e lo stato della sessione resta invariato.
- Invia `/think` (o `/think:`) senza argomento per vedere il livello di thinking corrente.

## Applicazione per agent

- **Pi incorporato**: il livello risolto viene passato al runtime agent Pi in-process.
- **Backend CLI Claude**: i livelli diversi da off vengono passati a Claude Code come `--effort` quando si usa `claude-cli`; vedi [Backend CLI](/it/gateway/cli-backends).

## Modalità veloce (/fast)

- Livelli: `on|off`.
- Un messaggio contenente solo la direttiva attiva/disattiva un override della modalità veloce di sessione e risponde `Fast mode enabled.` / `Fast mode disabled.`.
- Invia `/fast` (o `/fast status`) senza modalità per vedere lo stato effettivo corrente della modalità veloce.
- OpenClaw risolve la modalità veloce in questo ordine:
  1. `/fast on|off` inline/con sola direttiva
  2. Override di sessione
  3. Valore predefinito per agent (`agents.list[].fastModeDefault`)
  4. Configurazione per modello: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Per `openai/*`, la modalità veloce mappa all'elaborazione prioritaria OpenAI inviando `service_tier=priority` nelle richieste Responses supportate.
- Per `openai-codex/*`, la modalità veloce invia lo stesso flag `service_tier=priority` nelle Responses Codex. OpenClaw mantiene un unico toggle `/fast` condiviso tra entrambi i percorsi di autenticazione.
- Per le richieste pubbliche dirette `anthropic/*`, incluso il traffico autenticato con OAuth inviato a `api.anthropic.com`, la modalità veloce mappa ai service tier Anthropic: `/fast on` imposta `service_tier=auto`, `/fast off` imposta `service_tier=standard_only`.
- Per `minimax/*` sul percorso compatibile con Anthropic, `/fast on` (o `params.fastMode: true`) riscrive `MiniMax-M2.7` in `MiniMax-M2.7-highspeed`.
- I parametri modello Anthropic espliciti `serviceTier` / `service_tier` sovrascrivono il valore predefinito della modalità veloce quando entrambi sono impostati. OpenClaw continua comunque a saltare l'iniezione del service tier Anthropic per URL base proxy non Anthropic.
- `/status` mostra `Fast` solo quando la modalità veloce è abilitata.

## Direttive verbose (/verbose o /v)

- Livelli: `on` (minimo) | `full` | `off` (predefinito).
- Un messaggio contenente solo la direttiva attiva/disattiva il verbose di sessione e risponde `Verbose logging enabled.` / `Verbose logging disabled.`; i livelli non validi restituiscono un suggerimento senza cambiare lo stato.
- `/verbose off` memorizza un override di sessione esplicito; cancellalo tramite l'interfaccia Sessions scegliendo `inherit`.
- La direttiva inline influisce solo su quel messaggio; altrimenti si applicano i valori predefiniti di sessione/globali.
- Invia `/verbose` (o `/verbose:`) senza argomento per vedere il livello verbose corrente.
- Quando verbose è attivo, gli agent che emettono risultati tool strutturati (Pi, altri agent JSON) reinviano ogni chiamata tool come un messaggio autonomo di soli metadati, con prefisso `<emoji> <tool-name>: <arg>` quando disponibile. Questi riepiloghi tool vengono inviati appena ogni tool si avvia (bolle separate), non come delta in streaming.
- I riepiloghi degli errori tool restano visibili in modalità normale, ma i suffissi con dettagli di errore grezzi sono nascosti salvo che verbose sia `on` o `full`.
- Quando verbose è `full`, anche gli output tool vengono inoltrati al completamento (bolla separata, troncata a una lunghezza sicura). Se attivi/disattivi `/verbose on|full|off` mentre un'esecuzione è in corso, le bolle tool successive rispettano la nuova impostazione.
- `agents.defaults.toolProgressDetail` controlla la forma dei riepiloghi tool di `/verbose` e delle righe tool nelle bozze di avanzamento. Usa `"explain"` (predefinito) per etichette umane compatte come `🛠️ Exec: checking JS syntax`; usa `"raw"` quando vuoi anche il comando/dettaglio grezzo aggiunto per il debug. `agents.list[].toolProgressDetail` per agent sovrascrive il valore predefinito.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Direttive di traccia Plugin (/trace)

- Livelli: `on` | `off` (predefinito).
- Un messaggio contenente solo la direttiva attiva/disattiva l'output di traccia Plugin di sessione e risponde `Plugin trace enabled.` / `Plugin trace disabled.`.
- La direttiva inline influisce solo su quel messaggio; altrimenti si applicano i valori predefiniti di sessione/globali.
- Invia `/trace` (o `/trace:`) senza argomento per vedere il livello di traccia corrente.
- `/trace` è più ristretto di `/verbose`: espone solo righe di traccia/debug di proprietà del Plugin, come i riepiloghi di debug di Active Memory.
- Le righe di traccia possono apparire in `/status` e come messaggio diagnostico successivo dopo la normale risposta dell'assistente.

## Visibilità del ragionamento (/reasoning)

- Livelli: `on|off|stream`.
- Un messaggio contenente solo la direttiva attiva/disattiva la visualizzazione dei blocchi di thinking nelle risposte.
- Quando abilitato, il ragionamento viene inviato come **messaggio separato** con prefisso `Reasoning:`.
- `stream` (solo Telegram): trasmette in streaming il ragionamento nella bolla bozza di Telegram mentre la risposta viene generata, poi invia la risposta finale senza ragionamento.
- Alias: `/reason`.
- Invia `/reasoning` (o `/reasoning:`) senza argomento per vedere il livello di ragionamento corrente.
- Ordine di risoluzione: direttiva inline, poi override di sessione, poi valore predefinito per agent (`agents.list[].reasoningDefault`), poi fallback (`off`).

I tag di ragionamento di modelli locali malformati vengono gestiti in modo conservativo. I blocchi chiusi `<think>...</think>` restano nascosti nelle risposte normali, e anche il ragionamento non chiuso dopo testo già visibile viene nascosto. Se una risposta è interamente racchiusa in un singolo tag di apertura non chiuso e altrimenti verrebbe consegnata come testo vuoto, OpenClaw rimuove il tag di apertura malformato e consegna il testo restante.

## Correlati

- La documentazione della modalità elevata si trova in [Modalità elevata](/it/tools/elevated).

## Heartbeat

- Il corpo della sonda Heartbeat è il prompt Heartbeat configurato (predefinito: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Le direttive inline in un messaggio Heartbeat si applicano come al solito (ma evita di cambiare i valori predefiniti di sessione dagli Heartbeat).
- La consegna Heartbeat usa per impostazione predefinita solo il payload finale. Per inviare anche il messaggio `Reasoning:` separato (quando disponibile), imposta `agents.defaults.heartbeat.includeReasoning: true` o `agents.list[].heartbeat.includeReasoning: true` per agent.

## Interfaccia web chat

- Il selettore del livello di ragionamento della chat web rispecchia il livello memorizzato della sessione dallo store/config della sessione in ingresso quando la pagina viene caricata.
- Scegliere un altro livello scrive immediatamente l'override della sessione tramite `sessions.patch`; non attende il prossimo invio e non è un override una tantum `thinkingOnce`.
- La prima opzione è sempre la scelta per cancellare l'override. Mostra `Inherited: <resolved level>` quando la sessione eredita un valore predefinito effettivo diverso da off, oppure `Off` quando il ragionamento ereditato è disabilitato.
- Le scelte esplicite del selettore sono etichettate come override, preservando al contempo le etichette del provider quando presenti (per esempio `Override: maximum` per un'opzione `max` etichettata dal provider).
- Il selettore usa `thinkingLevels` restituito dalla riga/dai valori predefiniti della sessione Gateway, con `thinkingOptions` mantenuto come elenco legacy di etichette. L'interfaccia browser non mantiene un proprio elenco di regex dei provider; i Plugin possiedono i set di livelli specifici dei modelli.
- `/think:<level>` funziona ancora e aggiorna lo stesso livello di sessione memorizzato, quindi le direttive della chat e il selettore restano sincronizzati.

## Profili dei provider

- I Plugin dei provider possono esporre `resolveThinkingProfile(ctx)` per definire i livelli supportati e il valore predefinito del modello.
- I Plugin dei provider che inoltrano modelli Claude dovrebbero riutilizzare `resolveClaudeThinkingProfile(modelId)` da `openclaw/plugin-sdk/provider-model-shared` affinché i cataloghi Anthropic diretti e proxy restino allineati.
- Ogni livello del profilo ha un `id` canonico memorizzato (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, o `max`) e può includere una `label` di visualizzazione. I provider binari usano `{ id: "low", label: "on" }`.
- I Plugin degli strumenti che devono validare un override esplicito del ragionamento dovrebbero usare `api.runtime.agent.resolveThinkingPolicy({ provider, model })` più `api.runtime.agent.normalizeThinkingLevel(...)`; non dovrebbero mantenere propri elenchi di livelli per provider/modello.
- I Plugin degli strumenti con accesso ai metadati configurati dei modelli personalizzati possono passare `catalog` a `resolveThinkingPolicy` in modo che le adesioni `compat.supportedReasoningEfforts` siano riflesse nella validazione lato Plugin.
- Gli hook legacy pubblicati (`supportsXHighThinking`, `isBinaryThinking`, e `resolveDefaultThinkingLevel`) restano adattatori di compatibilità, ma i nuovi set di livelli personalizzati dovrebbero usare `resolveThinkingProfile`.
- Le righe/i valori predefiniti Gateway espongono `thinkingLevels`, `thinkingOptions`, e `thinkingDefault` affinché i client ACP/chat mostrino gli stessi ID ed etichette di profilo usati dalla validazione runtime.
