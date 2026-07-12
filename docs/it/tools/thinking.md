---
read_when:
    - Modifica dell’analisi delle direttive o dei valori predefiniti relativi al ragionamento, alla modalità rapida o alla modalità dettagliata
summary: Sintassi delle direttive per /think, /fast, /verbose, /trace e visibilità del ragionamento
title: Livelli di ragionamento
x-i18n:
    generated_at: "2026-07-12T07:38:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 75170dd48f83dcb3ebb70eea2b37160208618d0aae23253c82fe88ce3afbc0e2
    source_path: tools/thinking.md
    workflow: 16
---

## Cosa fa

- Direttiva inline in qualsiasi corpo in entrata: `/t <level>`, `/think:<level>` o `/thinking <level>`.
- Livelli (alias): `off | minimal | low | medium | high | xhigh | adaptive | max | ultra`, che rispecchiano approssimativamente la classica scala di parole magiche di Anthropic "think" < "think hard" < "think harder" < "ultrathink":
  - minimal ~ "pensa"
  - low ~ "pensa intensamente"
  - medium ~ "pensa più intensamente"
  - high ~ "ultrathink" (budget massimo)
  - xhigh ~ "ultrathink+" (modelli GPT-5.2+ e Codex, oltre allo sforzo di Anthropic Claude Opus 4.7+)
  - adaptive → ragionamento adattivo gestito dal provider (supportato per Claude 4.6 su Anthropic/Bedrock, Anthropic Claude Opus 4.7+ e il ragionamento dinamico di Google Gemini)
  - max → ragionamento massimo del provider (Anthropic Claude Opus 4.7+; Ollama lo associa al massimo sforzo `think` nativo)
  - ultra → ragionamento massimo del provider più orchestrazione proattiva dei sotto-agenti, quando il modello/runtime selezionato la supporta
  - `x-high`, `x_high`, `extra-high`, `extra high` ed `extra_high` corrispondono a `xhigh`.
  - `highest` corrisponde a `high`.
- Note sui provider:
  - I menu e i selettori del ragionamento dipendono dal profilo del provider. I Plugin dei provider dichiarano l'insieme esatto di livelli per il modello selezionato, incluse etichette come il valore binario `on`.
  - `adaptive`, `xhigh`, `max` e `ultra` vengono mostrati solo per i profili provider/modello/runtime che li supportano. Le direttive digitate con livelli non supportati vengono rifiutate, indicando le opzioni valide per quel modello.
  - I livelli non supportati già memorizzati vengono rimappati in base alla classificazione del profilo del provider. `adaptive` torna a `medium` sui modelli non adattivi, mentre `xhigh` e `max` tornano al livello supportato più elevato diverso da `off` per il modello selezionato.
  - I modelli Anthropic Claude 4.6 usano per impostazione predefinita `adaptive` quando non è impostato esplicitamente alcun livello di ragionamento.
  - Anthropic Claude Opus 4.8 e Opus 4.7 mantengono il ragionamento disattivato, a meno che non si imposti esplicitamente un livello di ragionamento. Dopo l'attivazione del ragionamento adattivo, l'impostazione predefinita dello sforzo gestita dal provider per Opus 4.8 è `high`.
  - Anthropic Claude Opus 4.7+ associa `/think xhigh` al ragionamento adattivo più `output_config.effort: "xhigh"`, perché `/think` è una direttiva di ragionamento e `xhigh` è l'impostazione dello sforzo di Opus.
  - Anthropic Claude Opus 4.7+ espone anche `/think max`, che viene associato allo stesso percorso di sforzo massimo gestito dal provider.
  - I modelli DeepSeek V4 diretti espongono `/think xhigh|max`; entrambi corrispondono a `reasoning_effort: "max"` di DeepSeek, mentre i livelli inferiori diversi da `off` corrispondono a `high`.
  - I modelli DeepSeek V4 instradati tramite OpenRouter espongono `/think xhigh` e inviano i valori `reasoning.effort` supportati da OpenRouter anziché il valore `reasoning_effort` di primo livello nativo di DeepSeek. I livelli inferiori diversi da `off` corrispondono a `high`, mentre le sostituzioni `max` memorizzate tornano a `xhigh`.
  - I modelli Ollama con capacità di ragionamento espongono `/think low|medium|high|max`; `max` corrisponde al valore nativo `think: "high"`, poiché l'API nativa di Ollama accetta le stringhe di sforzo `low`, `medium` e `high`.
  - I modelli OpenAI GPT associano `/think` tramite il supporto dello sforzo specifico del modello nell'API Responses. `/think off` invia `reasoning.effort: "none"` solo quando il modello di destinazione lo supporta; in caso contrario, OpenClaw omette il payload di ragionamento disattivato anziché inviare un valore non supportato.
  - GPT-5.6 Sol e Terra espongono `/think ultra` in modo nativo tramite il runtime Codex. GPT-5.6 Luna espone livelli fino a `max`, perché il relativo catalogo Codex non dichiara Ultra.
  - Il runtime OpenClaw incorporato espone il valore logico `/think ultra` per GPT-5.6 Sol, Terra e Luna. Invia lo sforzo massimo del provider e aggiunge indicazioni per l'orchestrazione proattiva dei sotto-agenti limitata all'esecuzione.
  - Le voci personalizzate del catalogo compatibili con OpenAI possono attivare `/think xhigh` impostando `models.providers.<provider>.models[].compat.supportedReasoningEfforts` in modo da includere `"xhigh"`. Vengono usati gli stessi metadati di compatibilità che associano i payload in uscita relativi allo sforzo di ragionamento OpenAI, affinché menu, convalida della sessione, CLI dell'agente e `llm-task` siano coerenti con il comportamento del trasporto.
  - I riferimenti configurati obsoleti di OpenRouter Hunter Alpha ignorano l'inserimento del ragionamento del proxy, perché quel percorso ritirato poteva restituire il testo della risposta finale tramite i campi di ragionamento.
  - Google Gemini associa `/think adaptive` al ragionamento dinamico gestito dal provider di Gemini. Le richieste Gemini 3 omettono un valore fisso `thinkingLevel`, mentre le richieste Gemini 2.5 inviano `thinkingBudget: -1`; i livelli fissi continuano a essere associati al valore `thinkingLevel` o al budget Gemini più vicino per quella famiglia di modelli.
  - MiniMax M2.x (`minimax/MiniMax-M2*`) sul percorso di streaming compatibile con Anthropic usa per impostazione predefinita `thinking: { type: "disabled" }`, a meno che non si imposti esplicitamente il ragionamento nei parametri del modello o della richiesta. Ciò evita la fuoriuscita di delta `reasoning_content` dal formato di streaming Anthropic non nativo di M2.x. MiniMax-M3 (e M3.x) è esente: M3 emette blocchi di ragionamento Anthropic corretti e restituisce contenuto vuoto quando il ragionamento è disattivato, quindi OpenClaw mantiene M3 sul percorso di ragionamento omesso/adattivo del provider.
  - Z.AI (`zai/*`) è binario (`on`/`off`) per la maggior parte dei modelli GLM. GLM-5.2 è l'eccezione: espone `/think off|low|high|max`, associa `low` e `high` a `reasoning_effort: "high"` di Z.AI e associa `max` a `reasoning_effort: "max"`.
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) ragiona sempre. Il suo profilo espone solo `on` e OpenClaw omette il campo `thinking` in uscita, come richiesto da Moonshot. Gli altri modelli `moonshot/*` associano `/think off` a `thinking: { type: "disabled" }` e qualsiasi livello diverso da `off` a `thinking: { type: "enabled" }`. Quando il ragionamento è attivato, Moonshot accetta solo `tool_choice` `auto|none`; OpenClaw normalizza i valori incompatibili in `auto`.

## Ordine di risoluzione

1. Direttiva inline nel messaggio (si applica solo a quel messaggio).
2. Sostituzione della sessione (impostata inviando un messaggio contenente solo la direttiva).
3. Valore predefinito per agente (`agents.list[].thinkingDefault` nella configurazione).
4. Valore predefinito globale (`agents.defaults.thinkingDefault` nella configurazione).
5. Ripiego: valore predefinito dichiarato dal provider, se disponibile; altrimenti, i modelli con capacità di ragionamento vengono impostati su `medium` o sul livello supportato diverso da `off` più vicino per quel modello, mentre i modelli senza capacità di ragionamento restano su `off`.

## Impostazione di un valore predefinito per la sessione

- Invia un messaggio contenente **solo** la direttiva (sono consentiti spazi), ad esempio `/think:medium` o `/t high`.
- L'impostazione resta valida per la sessione corrente (per mittente, per impostazione predefinita). Usa `/think default` per cancellare la sostituzione della sessione ed ereditare il valore predefinito configurato/del provider; gli alias includono `inherit`, `clear`, `reset` e `unpin`.
- `/think off` memorizza una sostituzione esplicita che disattiva il ragionamento. Il ragionamento resta disattivato finché non modifichi o cancelli la sostituzione della sessione.
- Viene inviata una risposta di conferma (`Livello di ragionamento impostato su high.` / `Ragionamento disattivato.`). Se il livello non è valido (ad esempio `/thinking big`), il comando viene rifiutato con un suggerimento e lo stato della sessione rimane invariato.
- Invia `/think` (o `/think:`) senza argomenti per visualizzare il livello di ragionamento corrente.

## Applicazione per agente

- **OpenClaw incorporato**: il livello risolto viene passato al runtime dell'agente OpenClaw interno al processo.
- **Backend CLI Claude**: quando si usa `claude-cli`, i livelli concreti diversi da `off` vengono passati a Claude Code come `--effort`; `adaptive` rimuove i flag di sforzo configurati e delega lo sforzo effettivo all'ambiente, alle impostazioni e ai valori predefiniti del modello di Claude Code. Consulta [Backend CLI](/it/gateway/cli-backends).

## Modalità rapida (/fast)

- Livelli: `auto|on|off|default`.
- Un messaggio contenente solo la direttiva attiva o disattiva una sostituzione della modalità rapida per la sessione e risponde `Modalità rapida impostata su auto.`, `Modalità rapida attivata.` o `Modalità rapida disattivata.`. Usa `/fast default` per cancellare la sostituzione della sessione ed ereditare il valore predefinito configurato; gli alias includono `inherit`, `clear`, `reset` e `unpin`.
- Invia `/fast` (o `/fast status`) senza specificare una modalità per visualizzare lo stato effettivo corrente della modalità rapida.
- OpenClaw risolve la modalità rapida nel seguente ordine:
  1. Sostituzione inline/con sola direttiva `/fast auto|on|off` (`/fast default` cancella questo livello)
  2. Sostituzione della sessione
  3. Valore predefinito per agente (`agents.list[].fastModeDefault`)
  4. Configurazione per modello: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Ripiego: `off`
- `auto` mantiene la modalità della sessione/configurazione su auto, ma risolve ogni nuova chiamata al modello in modo indipendente. Le chiamate avviate prima del limite temporale automatico hanno la modalità rapida attivata; le successive chiamate di nuovo tentativo, ripiego, risultato dello strumento o continuazione iniziano con la modalità rapida disattivata. Il limite temporale predefinito è di 60 secondi; per modificarlo, imposta `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` sul modello attivo.
- Per `openai/*`, la modalità rapida corrisponde all'elaborazione prioritaria di OpenAI e invia `service_tier=priority` nelle richieste Responses supportate.
- Per i modelli `openai/*` / `openai-codex/*` basati su Codex, la modalità rapida invia lo stesso flag `service_tier=priority` nelle Responses di Codex. I turni nativi del server dell'app Codex ricevono il livello solo su `turn/start` o all'avvio/ripresa del thread, quindi `auto` non può modificare il livello di un turno del server dell'app già in esecuzione; si applica al turno successivo del modello avviato da OpenClaw.
- Per le richieste pubbliche dirette `anthropic/*`, incluso il traffico autenticato tramite OAuth inviato ad `api.anthropic.com`, la modalità rapida corrisponde ai livelli di servizio Anthropic: `/fast on` imposta `service_tier=auto`, `/fast off` imposta `service_tier=standard_only`.
- Per `minimax/*` sul percorso compatibile con Anthropic, `/fast on` (o `params.fastMode: true`) sostituisce `MiniMax-M2.7` con `MiniMax-M2.7-highspeed`.
- I parametri espliciti del modello Anthropic `serviceTier` / `service_tier` hanno la precedenza sul valore predefinito della modalità rapida quando sono impostati entrambi. OpenClaw continua a non inserire il livello di servizio Anthropic per gli URL di base proxy non Anthropic.
- `/status` mostra `Fast` quando la modalità rapida è attivata e `Fast:auto` quando la modalità configurata è auto.

## Direttive dettagliate (/verbose o /v)

- Livelli: `on` (minimo) | `full` | `off` (predefinito).
- Un messaggio contenente solo la direttiva attiva o disattiva i dettagli per la sessione e risponde `Registrazione dettagliata attivata.` / `Registrazione dettagliata disattivata.`; i livelli non validi restituiscono un suggerimento senza modificare lo stato.
- `/verbose off` memorizza una sostituzione esplicita della sessione; cancellala tramite l'interfaccia delle sessioni scegliendo `inherit`.
- I mittenti autorizzati dei canali esterni possono rendere persistente la sostituzione dettagliata della sessione. I client interni Gateway/webchat necessitano di `operator.admin` per renderla persistente.
- La direttiva inline riguarda solo quel messaggio; negli altri casi si applicano i valori predefiniti della sessione/globali.
- Invia `/verbose` (o `/verbose:`) senza argomenti per visualizzare il livello di dettaglio corrente.
- Quando i dettagli sono attivati, gli agenti che emettono risultati strutturati degli strumenti restituiscono ogni chiamata allo strumento come messaggio separato contenente solo metadati, con il prefisso `<emoji> <tool-name>: <arg>` quando disponibile. Questi riepiloghi degli strumenti vengono inviati non appena ogni strumento viene avviato (in messaggi separati), non come delta in streaming.
- I riepiloghi degli errori degli strumenti restano visibili in modalità normale, ma i suffissi con i dettagli grezzi degli errori vengono nascosti, a meno che il livello di dettaglio non sia `full`.
- Quando il livello di dettaglio è `full`, anche gli output degli strumenti vengono inoltrati al termine (in un messaggio separato, troncati a una lunghezza sicura). Se attivi o disattivi `/verbose on|full|off` mentre un'esecuzione è in corso, i successivi messaggi degli strumenti rispettano la nuova impostazione.
- `agents.defaults.toolProgressDetail` controlla la forma dei riepiloghi degli strumenti di `/verbose` e delle righe degli strumenti nelle bozze di avanzamento. Usa `"explain"` (predefinito) per etichette umane concise come `🛠️ Exec: controllo della sintassi JS`; usa `"raw"` se desideri aggiungere anche il comando/dettaglio grezzo per il debug. Il valore per agente `agents.list[].toolProgressDetail` sostituisce quello predefinito.
  - `explain`: `🛠️ Exec: controlla la sintassi JS per /tmp/app.js`
  - `raw`: `🛠️ Exec: controlla la sintassi JS per /tmp/app.js, node --check /tmp/app.js`

## Direttive di tracciamento dei Plugin (/trace)

- Livelli: `on` | `off` (predefinito).
- Un messaggio contenente solo la direttiva attiva o disattiva l'output di tracciamento dei Plugin per la sessione e risponde `Tracciamento dei Plugin attivato.` / `Tracciamento dei Plugin disattivato.`.
- La direttiva inline riguarda solo quel messaggio; negli altri casi si applicano i valori predefiniti della sessione/globali.
- Invia `/trace` (o `/trace:`) senza argomenti per visualizzare il livello di tracciamento corrente.
- `/trace` ha un ambito più ristretto di `/verbose`: espone solo le righe di tracciamento/debug appartenenti ai Plugin, come i riepiloghi di debug di Active Memory.
- Le righe di tracciamento possono apparire in `/status` e in un messaggio diagnostico successivo alla normale risposta dell'assistente.

## Visibilità del ragionamento (/reasoning)

- Livelli: `on|off|stream`.
- Un messaggio contenente solo la direttiva attiva o disattiva la visualizzazione dei blocchi di ragionamento nelle risposte.
- Quando l'opzione è abilitata, il ragionamento viene inviato come **messaggio separato** con il prefisso `Thinking`.
- `stream`: trasmette il ragionamento in streaming durante la generazione della risposta quando il canale attivo supporta le anteprime del ragionamento, quindi invia la risposta finale senza il ragionamento.
- Alias: `/reason`.
- Invia `/reasoning` (o `/reasoning:`) senza argomenti per visualizzare il livello di ragionamento corrente.
- Ordine di risoluzione: direttiva inline, quindi override della sessione, quindi valore predefinito per agente (`agents.list[].reasoningDefault`), quindi valore predefinito globale (`agents.defaults.reasoningDefault`), infine valore di ripiego (`off`).

I tag di ragionamento non validi dei modelli locali vengono gestiti in modo prudente. I blocchi `<think>...</think>` chiusi rimangono nascosti nelle risposte normali e viene nascosto anche il ragionamento non chiuso che segue testo già visibile. Se una risposta è interamente racchiusa in un singolo tag di apertura non chiuso e altrimenti verrebbe recapitata come testo vuoto, OpenClaw rimuove il tag di apertura non valido e recapita il testo rimanente.

## Argomenti correlati

- La documentazione sulla modalità con privilegi elevati è disponibile in [Modalità con privilegi elevati](/it/tools/elevated).

## Heartbeat

- Il corpo della verifica Heartbeat è il prompt Heartbeat configurato (valore predefinito: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Le direttive inline in un messaggio Heartbeat si applicano come di consueto (ma evita di modificare i valori predefiniti della sessione dagli Heartbeat).
- Per impostazione predefinita, la consegna Heartbeat include solo il payload finale. Per inviare anche il messaggio `Thinking` separato (quando disponibile), imposta `agents.defaults.heartbeat.includeReasoning: true` oppure, per un singolo agente, `agents.list[].heartbeat.includeReasoning: true`.

## Interfaccia utente della chat web

- Al caricamento della pagina, il selettore del ragionamento della chat web rispecchia il livello memorizzato della sessione, recuperato dall'archivio o dalla configurazione della sessione in ingresso.
- La selezione di un altro livello scrive immediatamente l'override della sessione tramite `sessions.patch`; non attende l'invio successivo e non costituisce un override monouso `thinkingOnce`.
- Se si invia un messaggio mentre sono ancora in corso le modifiche ai selettori del modello, del ragionamento o della velocità, il sistema attende tutte le patch dei selettori in sospeso; se una modifica non riesce, il messaggio non viene inviato e rimane disponibile per la revisione.
- La prima opzione consente sempre di rimuovere l'override. Mostra `Ereditato: <livello risolto>`, incluso `Ereditato: Disattivato` quando il ragionamento ereditato è disabilitato.
- Le scelte esplicite del selettore usano direttamente le rispettive etichette di livello, mantenendo le etichette del provider quando presenti (ad esempio `Maximum` per un'opzione `max` etichettata dal provider).
- Il selettore usa `thinkingLevels` restituito dalla riga o dai valori predefiniti della sessione del Gateway, mentre `thinkingOptions` viene mantenuto come elenco di etichette legacy. L'interfaccia utente del browser non mantiene un proprio elenco di espressioni regolari per i provider; i plugin definiscono gli insiemi di livelli specifici per ciascun modello.
- `/think:<level>` continua a funzionare e aggiorna lo stesso livello memorizzato della sessione, mantenendo sincronizzati le direttive della chat e il selettore.

## Profili dei provider

- I plugin dei provider possono esporre `resolveThinkingProfile(ctx)` per definire i livelli supportati dal modello e quello predefinito.
- I plugin dei provider che fungono da proxy per i modelli Claude devono riutilizzare `resolveClaudeThinkingProfile(modelId)` da `openclaw/plugin-sdk/provider-model-shared`, affinché i cataloghi Anthropic diretti e quelli proxy rimangano allineati.
- Ogni livello del profilo dispone di un `id` canonico memorizzato (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, `max` o `ultra`) e può includere un'`label` di visualizzazione. I provider binari usano `{ id: "low", label: "on" }`.
- Gli hook dei profili ricevono, quando disponibili, i dati unificati del catalogo, inclusi `reasoning`, `compat.thinkingFormat` e `compat.supportedReasoningEfforts`. Usa tali dati per esporre profili binari o personalizzati solo quando il contratto della richiesta configurato supporta il payload corrispondente.
- I plugin degli strumenti che devono convalidare un override esplicito del ragionamento devono usare `api.runtime.agent.resolveThinkingPolicy({ provider, model, agentRuntime })` insieme a `api.runtime.agent.normalizeThinkingLevel(...)`; non devono mantenere elenchi propri di livelli per provider o modello. Passa `agentRuntime` quando lo strumento gestisce il percorso di esecuzione, ad esempio per un'esecuzione sempre incorporata.
- I plugin degli strumenti che hanno accesso ai metadati configurati dei modelli personalizzati possono passare `catalog` a `resolveThinkingPolicy`, affinché le abilitazioni esplicite di `compat.supportedReasoningEfforts` siano considerate nella convalida eseguita dal plugin.
- Gli hook legacy pubblicati (`supportsXHighThinking`, `isBinaryThinking` e `resolveDefaultThinkingLevel`) rimangono come adattatori di compatibilità, ma i nuovi insiemi di livelli personalizzati devono usare `resolveThinkingProfile`.
- Le righe e i valori predefiniti del Gateway espongono `thinkingLevels`, `thinkingOptions` e `thinkingDefault`, affinché i client ACP e di chat mostrino gli stessi ID ed etichette dei profili usati dalla convalida in fase di esecuzione.
