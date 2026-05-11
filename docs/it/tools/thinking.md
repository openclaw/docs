---
read_when:
    - Modifica del parsing o dei valori predefiniti delle direttive thinking, fast-mode o verbose
summary: Sintassi delle direttive per /think, /fast, /verbose, /trace e visibilità del ragionamento
title: Livelli di ragionamento
x-i18n:
    generated_at: "2026-05-11T20:39:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: c75e2360a260aaf4571f2da6c7519fb4987e4c8c7947e3dc37f94a0ad260ad55
    source_path: tools/thinking.md
    workflow: 16
---

## Che cosa fa

- Direttiva inline in qualsiasi corpo in ingresso: `/t <level>`, `/think:<level>` o `/thinking <level>`.
- Livelli (alias): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink" (budget massimo)
  - xhigh → "ultrathink+" (modelli GPT-5.2+ e Codex, più effort Anthropic Claude Opus 4.7)
  - adaptive → pensiero adattivo gestito dal provider (supportato per Claude 4.6 su Anthropic/Bedrock, Anthropic Claude Opus 4.7 e pensiero dinamico Google Gemini)
  - max → ragionamento massimo del provider (Anthropic Claude Opus 4.7; Ollama lo mappa al suo effort `think` nativo più alto)
  - `x-high`, `x_high`, `extra-high`, `extra high` ed `extra_high` vengono mappati a `xhigh`.
  - `highest` viene mappato a `high`.
- Note sui provider:
  - I menu e i selettori del pensiero sono guidati dal profilo provider. I Plugin provider dichiarano l'insieme esatto di livelli per il modello selezionato, incluse etichette come `on` binario.
  - `adaptive`, `xhigh` e `max` sono pubblicizzati solo per i profili provider/modello che li supportano. Le direttive digitate per livelli non supportati vengono rifiutate con le opzioni valide per quel modello.
  - I livelli non supportati già memorizzati vengono rimappati in base al rango del profilo provider. `adaptive` ricade su `medium` sui modelli non adattivi, mentre `xhigh` e `max` ricadono sul livello non-`off` più grande supportato per il modello selezionato.
  - I modelli Anthropic Claude 4.6 usano `adaptive` come impostazione predefinita quando non è impostato alcun livello di pensiero esplicito.
  - Anthropic Claude Opus 4.7 non usa il pensiero adattivo come impostazione predefinita. Il default dell'effort della sua API resta di proprietà del provider, a meno che tu non imposti esplicitamente un livello di pensiero.
  - Anthropic Claude Opus 4.7 mappa `/think xhigh` al pensiero adattivo più `output_config.effort: "xhigh"`, perché `/think` è una direttiva di pensiero e `xhigh` è l'impostazione di effort di Opus 4.7.
  - Anthropic Claude Opus 4.7 espone anche `/think max`; viene mappato allo stesso percorso di effort massimo di proprietà del provider.
  - I modelli Direct DeepSeek V4 espongono `/think xhigh|max`; entrambi vengono mappati a DeepSeek `reasoning_effort: "max"`, mentre i livelli non-`off` inferiori vengono mappati a `high`.
  - I modelli DeepSeek V4 instradati tramite OpenRouter espongono `/think xhigh` e inviano valori `reasoning_effort` supportati da OpenRouter. Gli override `max` memorizzati ricadono su `xhigh`.
  - I modelli Ollama con capacità di pensiero espongono `/think low|medium|high|max`; `max` viene mappato al valore nativo `think: "high"` perché l'API nativa di Ollama accetta le stringhe di effort `low`, `medium` e `high`.
  - I modelli OpenAI GPT mappano `/think` tramite il supporto dell'effort specifico del modello nella Responses API. `/think off` invia `reasoning.effort: "none"` solo quando il modello di destinazione lo supporta; altrimenti OpenClaw omette il payload di ragionamento disabilitato invece di inviare un valore non supportato.
  - Le voci di catalogo personalizzate compatibili con OpenAI possono abilitare `/think xhigh` impostando `models.providers.<provider>.models[].compat.supportedReasoningEfforts` in modo che includa `"xhigh"`. Questo usa gli stessi metadati compat che mappano i payload di effort di ragionamento OpenAI in uscita, così menu, validazione della sessione, CLI dell'agente e `llm-task` concordano con il comportamento del trasporto.
  - I riferimenti OpenRouter Hunter Alpha configurati e obsoleti saltano l'iniezione del ragionamento proxy perché quella route ritirata poteva restituire testo della risposta finale tramite i campi di ragionamento.
  - Google Gemini mappa `/think adaptive` al pensiero dinamico di proprietà del provider Gemini. Le richieste Gemini 3 omettono un `thinkingLevel` fisso, mentre le richieste Gemini 2.5 inviano `thinkingBudget: -1`; i livelli fissi vengono comunque mappati al `thinkingLevel` o al budget Gemini più vicino per quella famiglia di modelli.
  - MiniMax (`minimax/*`) sul percorso di streaming compatibile con Anthropic usa per impostazione predefinita `thinking: { type: "disabled" }`, a meno che tu non imposti esplicitamente il pensiero nei parametri del modello o nei parametri della richiesta. Questo evita delta `reasoning_content` trapelati dal formato di stream Anthropic non nativo di MiniMax.
  - Z.AI (`zai/*`) supporta solo il pensiero binario (`on`/`off`). Qualsiasi livello diverso da `off` viene trattato come `on` (mappato a `low`).
  - Moonshot (`moonshot/*`) mappa `/think off` a `thinking: { type: "disabled" }` e qualsiasi livello diverso da `off` a `thinking: { type: "enabled" }`. Quando il pensiero è abilitato, Moonshot accetta solo `tool_choice` `auto|none`; OpenClaw normalizza i valori incompatibili a `auto`.

## Ordine di risoluzione

1. Direttiva inline nel messaggio (si applica solo a quel messaggio).
2. Override della sessione (impostato inviando un messaggio contenente solo la direttiva).
3. Default per agente (`agents.list[].thinkingDefault` nella config).
4. Default globale (`agents.defaults.thinkingDefault` nella config).
5. Fallback: default dichiarato dal provider quando disponibile; altrimenti i modelli con capacità di ragionamento si risolvono su `medium` o sul livello non-`off` supportato più vicino per quel modello, e i modelli senza ragionamento restano `off`.

## Impostare un default di sessione

- Invia un messaggio che sia **solo** la direttiva (spazi consentiti), per esempio `/think:medium` o `/t high`.
- Rimane valido per la sessione corrente (per mittente per impostazione predefinita). Usa `/think default` per cancellare l'override di sessione ed ereditare il default configurato/del provider; gli alias includono `inherit`, `clear`, `reset` e `unpin`.
- `/think off` memorizza un override off esplicito. Disabilita il pensiero finché non cambi o cancelli l'override di sessione.
- Viene inviata una risposta di conferma (`Thinking level set to high.` / `Thinking disabled.`). Se il livello non è valido (per esempio `/thinking big`), il comando viene rifiutato con un suggerimento e lo stato della sessione resta invariato.
- Invia `/think` (o `/think:`) senza argomento per vedere il livello di pensiero corrente.

## Applicazione per agente

- **Pi incorporato**: il livello risolto viene passato al runtime dell'agente Pi in-process.
- **Backend CLI Claude**: i livelli non-off vengono passati a Claude Code come `--effort` quando si usa `claude-cli`; vedi [backend CLI](/it/gateway/cli-backends).

## Modalità veloce (/fast)

- Livelli: `on|off|default`.
- Un messaggio contenente solo la direttiva attiva/disattiva un override di sessione della modalità veloce e risponde `Fast mode enabled.` / `Fast mode disabled.`. Usa `/fast default` per cancellare l'override di sessione ed ereditare il default configurato; gli alias includono `inherit`, `clear`, `reset` e `unpin`.
- Invia `/fast` (o `/fast status`) senza modalità per vedere lo stato effettivo corrente della modalità veloce.
- OpenClaw risolve la modalità veloce in questo ordine:
  1. Override inline/con sola direttiva `/fast on|off` (`/fast default` cancella questo livello)
  2. Override della sessione
  3. Default per agente (`agents.list[].fastModeDefault`)
  4. Config per modello: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Per `openai/*`, la modalità veloce viene mappata all'elaborazione prioritaria OpenAI inviando `service_tier=priority` nelle richieste Responses supportate.
- Per `openai-codex/*`, la modalità veloce invia lo stesso flag `service_tier=priority` nelle Responses Codex. OpenClaw mantiene un unico toggle `/fast` condiviso tra entrambi i percorsi di autenticazione.
- Per le richieste pubbliche dirette `anthropic/*`, incluso il traffico autenticato via OAuth inviato a `api.anthropic.com`, la modalità veloce viene mappata ai livelli di servizio Anthropic: `/fast on` imposta `service_tier=auto`, `/fast off` imposta `service_tier=standard_only`.
- Per `minimax/*` sul percorso compatibile con Anthropic, `/fast on` (o `params.fastMode: true`) riscrive `MiniMax-M2.7` in `MiniMax-M2.7-highspeed`.
- I parametri modello Anthropic espliciti `serviceTier` / `service_tier` sovrascrivono il default della modalità veloce quando entrambi sono impostati. OpenClaw continua comunque a saltare l'iniezione del livello di servizio Anthropic per URL di base proxy non Anthropic.
- `/status` mostra `Fast` solo quando la modalità veloce è abilitata.

## Direttive verbose (/verbose o /v)

- Livelli: `on` (minimo) | `full` | `off` (default).
- Un messaggio contenente solo la direttiva attiva/disattiva il verbose della sessione e risponde `Verbose logging enabled.` / `Verbose logging disabled.`; i livelli non validi restituiscono un suggerimento senza cambiare stato.
- `/verbose off` memorizza un override di sessione esplicito; cancellalo tramite l'interfaccia Sessions scegliendo `inherit`.
- La direttiva inline riguarda solo quel messaggio; altrimenti si applicano i default di sessione/globali.
- Invia `/verbose` (o `/verbose:`) senza argomento per vedere il livello verbose corrente.
- Quando verbose è attivo, gli agenti che emettono risultati di strumenti strutturati (Pi, altri agenti JSON) inviano ogni chiamata di strumento come messaggio separato solo metadati, prefissato con `<emoji> <tool-name>: <arg>` quando disponibile. Questi riepiloghi degli strumenti vengono inviati appena ogni strumento parte (bolle separate), non come delta di streaming.
- I riepiloghi degli errori degli strumenti restano visibili in modalità normale, ma i suffissi con il dettaglio grezzo dell'errore sono nascosti a meno che verbose sia `on` o `full`.
- Quando verbose è `full`, anche gli output degli strumenti vengono inoltrati dopo il completamento (bolla separata, troncata a una lunghezza sicura). Se attivi/disattivi `/verbose on|full|off` mentre un'esecuzione è in corso, le bolle successive degli strumenti rispettano la nuova impostazione.
- `agents.defaults.toolProgressDetail` controlla la forma dei riepiloghi degli strumenti di `/verbose` e delle righe strumenti nelle bozze di avanzamento. Usa `"explain"` (default) per etichette umane compatte come `🛠️ Exec: checking JS syntax`; usa `"raw"` quando vuoi anche il comando/dettaglio grezzo aggiunto per il debugging. `agents.list[].toolProgressDetail` per agente sovrascrive il default.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Direttive di trace dei Plugin (/trace)

- Livelli: `on` | `off` (default).
- Un messaggio contenente solo la direttiva attiva/disattiva l'output di trace dei Plugin della sessione e risponde `Plugin trace enabled.` / `Plugin trace disabled.`.
- La direttiva inline riguarda solo quel messaggio; altrimenti si applicano i default di sessione/globali.
- Invia `/trace` (o `/trace:`) senza argomento per vedere il livello di trace corrente.
- `/trace` è più ristretto di `/verbose`: espone solo righe di trace/debug di proprietà del Plugin, come i riepiloghi di debug Active Memory.
- Le righe di trace possono apparire in `/status` e come messaggio diagnostico successivo dopo la normale risposta dell'assistente.

## Visibilità del ragionamento (/reasoning)

- Livelli: `on|off|stream`.
- Un messaggio contenente solo la direttiva attiva/disattiva la visualizzazione dei blocchi di pensiero nelle risposte.
- Quando è abilitato, il ragionamento viene inviato come **messaggio separato** prefissato con `Reasoning:`.
- `stream` (solo Telegram): trasmette in streaming il ragionamento nella bolla bozza di Telegram mentre la risposta viene generata, poi invia la risposta finale senza ragionamento.
- Alias: `/reason`.
- Invia `/reasoning` (o `/reasoning:`) senza argomento per vedere il livello di ragionamento corrente.
- Ordine di risoluzione: direttiva inline, poi override di sessione, poi default per agente (`agents.list[].reasoningDefault`), poi default globale (`agents.defaults.reasoningDefault`), poi fallback (`off`).

I tag di ragionamento dei modelli locali malformati vengono gestiti in modo conservativo. I blocchi `<think>...</think>` chiusi restano nascosti nelle risposte normali, e anche il ragionamento non chiuso dopo testo già visibile viene nascosto. Se una risposta è completamente racchiusa in un singolo tag di apertura non chiuso e altrimenti verrebbe consegnata come testo vuoto, OpenClaw rimuove il tag di apertura malformato e consegna il testo rimanente.

## Correlati

- La documentazione della modalità elevata si trova in [Modalità elevata](/it/tools/elevated).

## Heartbeat

- Il corpo del probe Heartbeat è il prompt Heartbeat configurato (default: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Le direttive inline in un messaggio Heartbeat si applicano come di consueto (ma evita di cambiare i default di sessione dagli Heartbeat).
- La consegna Heartbeat usa per impostazione predefinita solo il payload finale. Per inviare anche il messaggio separato `Reasoning:` (quando disponibile), imposta `agents.defaults.heartbeat.includeReasoning: true` o `agents.list[].heartbeat.includeReasoning: true` per agente.

## Interfaccia web chat

- Il selettore del ragionamento della chat web rispecchia il livello memorizzato della sessione dallo store/config della sessione in ingresso quando la pagina viene caricata.
- La scelta di un altro livello scrive immediatamente l'override della sessione tramite `sessions.patch`; non attende il prossimo invio e non è un override monouso `thinkingOnce`.
- La prima opzione è sempre la scelta per cancellare l'override. Mostra `Inherited: <resolved level>` quando la sessione eredita un default effettivo non disattivato, oppure `Off` quando il ragionamento ereditato è disabilitato.
- Le scelte esplicite del selettore sono etichettate come override, preservando le etichette dei provider quando presenti (ad esempio `Override: maximum` per un'opzione `max` etichettata dal provider).
- Il selettore usa `thinkingLevels` restituito dalla riga/defaults della sessione del Gateway, con `thinkingOptions` mantenuto come elenco di etichette legacy. L'interfaccia utente del browser non mantiene un proprio elenco regex dei provider; i plugin possiedono gli insiemi di livelli specifici del modello.
- `/think:<level>` continua a funzionare e aggiorna lo stesso livello di sessione memorizzato, quindi le direttive della chat e il selettore restano sincronizzati.

## Profili dei provider

- I plugin dei provider possono esporre `resolveThinkingProfile(ctx)` per definire i livelli supportati e il default del modello.
- I plugin dei provider che fanno da proxy ai modelli Claude devono riutilizzare `resolveClaudeThinkingProfile(modelId)` da `openclaw/plugin-sdk/provider-model-shared`, in modo che i cataloghi Anthropic diretti e proxy restino allineati.
- Ogni livello di profilo ha un `id` canonico memorizzato (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` o `max`) e può includere una `label` di visualizzazione. I provider binari usano `{ id: "low", label: "on" }`.
- I plugin degli strumenti che devono convalidare un override esplicito del ragionamento devono usare `api.runtime.agent.resolveThinkingPolicy({ provider, model })` più `api.runtime.agent.normalizeThinkingLevel(...)`; non devono mantenere propri elenchi di livelli per provider/modello.
- I plugin degli strumenti con accesso ai metadati configurati dei modelli personalizzati possono passare `catalog` a `resolveThinkingPolicy`, così gli opt-in `compat.supportedReasoningEfforts` vengono riflessi nella convalida lato plugin.
- Gli hook legacy pubblicati (`supportsXHighThinking`, `isBinaryThinking` e `resolveDefaultThinkingLevel`) restano come adattatori di compatibilità, ma i nuovi insiemi di livelli personalizzati devono usare `resolveThinkingProfile`.
- Le righe/defaults del Gateway espongono `thinkingLevels`, `thinkingOptions` e `thinkingDefault`, così i client ACP/chat renderizzano gli stessi ID ed etichette dei profili usati dalla convalida di runtime.
