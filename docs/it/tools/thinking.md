---
read_when:
    - Regolare il ragionamento, la modalità fast o il parsing/le impostazioni predefinite della direttiva verbose
summary: Sintassi delle direttive per /think, /fast, /verbose, /trace e visibilità del ragionamento
title: Livelli di ragionamento
x-i18n:
    generated_at: "2026-04-24T09:08:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc251ffa601646bf8672200b416661ae91fb21ff84525eedf6d6c538ff0e36cf
    source_path: tools/thinking.md
    workflow: 15
---

## Cosa fa

- Direttiva inline in qualsiasi body in ingresso: `/t <level>`, `/think:<level>` oppure `/thinking <level>`.
- Livelli (alias): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (budget massimo)
  - xhigh → “ultrathink+” (modelli GPT-5.2+ e Codex, più effort Anthropic Claude Opus 4.7)
  - adaptive → ragionamento adattivo gestito dal provider (supportato per Claude 4.6 su Anthropic/Bedrock e Anthropic Claude Opus 4.7)
  - max → ragionamento massimo del provider (attualmente Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` e `extra_high` corrispondono a `xhigh`.
  - `highest` corrisponde a `high`.
- Note sui provider:
  - Menu e selettori del ragionamento sono guidati dal profilo provider. I Plugin provider dichiarano l'insieme esatto di livelli per il modello selezionato, incluse etichette come il binario `on`.
  - `adaptive`, `xhigh` e `max` vengono pubblicizzati solo per i profili provider/modello che li supportano. Le direttive tipizzate per livelli non supportati vengono rifiutate con le opzioni valide di quel modello.
  - I livelli non supportati già memorizzati vengono rimappati in base al rank del profilo provider. `adaptive` usa il fallback a `medium` sui modelli non adattivi, mentre `xhigh` e `max` usano il fallback al livello non-`off` supportato più alto per il modello selezionato.
  - I modelli Anthropic Claude 4.6 usano `adaptive` come predefinito quando non è impostato alcun livello di ragionamento esplicito.
  - Anthropic Claude Opus 4.7 non usa per impostazione predefinita il ragionamento adattivo. Il suo effort API predefinito resta di proprietà del provider a meno che tu non imposti esplicitamente un livello di ragionamento.
  - Anthropic Claude Opus 4.7 mappa `/think xhigh` al ragionamento adattivo più `output_config.effort: "xhigh"`, perché `/think` è una direttiva di ragionamento e `xhigh` è l'impostazione effort di Opus 4.7.
  - Anthropic Claude Opus 4.7 espone anche `/think max`; viene mappato allo stesso percorso max effort di proprietà del provider.
  - I modelli OpenAI GPT mappano `/think` tramite il supporto effort specifico del modello dell'API Responses. `/think off` invia `reasoning.effort: "none"` solo quando il modello di destinazione lo supporta; altrimenti OpenClaw omette il payload di ragionamento disabilitato invece di inviare un valore non supportato.
  - MiniMax (`minimax/*`) sul percorso streaming compatibile Anthropic usa come predefinito `thinking: { type: "disabled" }` a meno che tu non imposti esplicitamente il ragionamento nei parametri del modello o della richiesta. Questo evita leak di delta `reasoning_content` dal formato stream Anthropic non nativo di MiniMax.
  - Z.AI (`zai/*`) supporta solo il ragionamento binario (`on`/`off`). Qualsiasi livello diverso da `off` viene trattato come `on` (mappato a `low`).
  - Moonshot (`moonshot/*`) mappa `/think off` a `thinking: { type: "disabled" }` e qualsiasi livello diverso da `off` a `thinking: { type: "enabled" }`. Quando il ragionamento è abilitato, Moonshot accetta solo `tool_choice` `auto|none`; OpenClaw normalizza i valori incompatibili a `auto`.

## Ordine di risoluzione

1. Direttiva inline nel messaggio (si applica solo a quel messaggio).
2. Override di sessione (impostato inviando un messaggio contenente solo la direttiva).
3. Valore predefinito per agente (`agents.list[].thinkingDefault` nella configurazione).
4. Valore predefinito globale (`agents.defaults.thinkingDefault` nella configurazione).
5. Fallback: valore predefinito dichiarato dal provider quando disponibile; altrimenti i modelli capaci di ragionamento risolvono a `medium` o al livello non-`off` supportato più vicino per quel modello, e i modelli senza ragionamento restano su `off`.

## Impostare un valore predefinito di sessione

- Invia un messaggio composto **solo** dalla direttiva (spazi consentiti), ad esempio `/think:medium` oppure `/t high`.
- Questo resta valido per la sessione corrente (per mittente per impostazione predefinita); viene azzerato da `/think:off` o dal reset per inattività della sessione.
- Viene inviata una risposta di conferma (`Thinking level set to high.` / `Thinking disabled.`). Se il livello non è valido (ad esempio `/thinking big`), il comando viene rifiutato con un suggerimento e lo stato della sessione resta invariato.
- Invia `/think` (o `/think:`) senza argomento per vedere il livello di ragionamento corrente.

## Applicazione per agente

- **Pi embedded**: il livello risolto viene passato al runtime dell'agente Pi in-process.

## Modalità fast (/fast)

- Livelli: `on|off`.
- Un messaggio contenente solo la direttiva attiva/disattiva un override di sessione della modalità fast e risponde `Fast mode enabled.` / `Fast mode disabled.`.
- Invia `/fast` (o `/fast status`) senza modalità per vedere lo stato effettivo corrente della modalità fast.
- OpenClaw risolve la modalità fast in questo ordine:
  1. `/fast on|off` inline/contenente solo la direttiva
  2. Override di sessione
  3. Valore predefinito per agente (`agents.list[].fastModeDefault`)
  4. Configurazione per modello: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Per `openai/*`, la modalità fast viene mappata all'elaborazione prioritaria di OpenAI inviando `service_tier=priority` sulle richieste Responses supportate.
- Per `openai-codex/*`, la modalità fast invia lo stesso flag `service_tier=priority` su Codex Responses. OpenClaw mantiene un unico toggle `/fast` condiviso tra entrambi i percorsi auth.
- Per le richieste pubbliche dirette `anthropic/*`, incluso il traffico autenticato OAuth inviato a `api.anthropic.com`, la modalità fast viene mappata ai service tier Anthropic: `/fast on` imposta `service_tier=auto`, `/fast off` imposta `service_tier=standard_only`.
- Per `minimax/*` sul percorso compatibile Anthropic, `/fast on` (o `params.fastMode: true`) riscrive `MiniMax-M2.7` in `MiniMax-M2.7-highspeed`.
- I parametri espliciti di modello Anthropic `serviceTier` / `service_tier` sovrascrivono il valore predefinito della modalità fast quando entrambi sono impostati. OpenClaw continua comunque a saltare l'iniezione del service tier Anthropic per URL base proxy non Anthropic.
- `/status` mostra `Fast` solo quando la modalità fast è abilitata.

## Direttive verbose (/verbose o /v)

- Livelli: `on` (minimal) | `full` | `off` (predefinito).
- Un messaggio contenente solo la direttiva attiva/disattiva verbose di sessione e risponde `Verbose logging enabled.` / `Verbose logging disabled.`; i livelli non validi restituiscono un suggerimento senza cambiare stato.
- `/verbose off` memorizza un override esplicito di sessione; cancellalo tramite l'interfaccia Sessions scegliendo `inherit`.
- La direttiva inline si applica solo a quel messaggio; altrimenti si applicano i valori predefiniti di sessione/globali.
- Invia `/verbose` (o `/verbose:`) senza argomento per vedere il livello verbose corrente.
- Quando verbose è attivo, gli agenti che emettono risultati di strumenti strutturati (Pi, altri agenti JSON) rimandano ogni chiamata di strumento come proprio messaggio solo metadati, con prefisso `<emoji> <tool-name>: <arg>` quando disponibile (path/command). Questi riepiloghi degli strumenti vengono inviati appena ogni strumento inizia (bubble separate), non come delta in streaming.
- I riepiloghi dei fallimenti degli strumenti restano visibili in modalità normale, ma i suffissi dei dettagli raw degli errori sono nascosti a meno che verbose non sia `on` o `full`.
- Quando verbose è `full`, anche gli output degli strumenti vengono inoltrati dopo il completamento (bubble separata, troncata a una lunghezza sicura). Se attivi/disattivi `/verbose on|full|off` mentre un'esecuzione è in corso, le bubble degli strumenti successive rispettano la nuova impostazione.

## Direttive di trace del Plugin (/trace)

- Livelli: `on` | `off` (predefinito).
- Un messaggio contenente solo la direttiva attiva/disattiva l'output di trace del Plugin per la sessione e risponde `Plugin trace enabled.` / `Plugin trace disabled.`.
- La direttiva inline si applica solo a quel messaggio; altrimenti si applicano i valori predefiniti di sessione/globali.
- Invia `/trace` (o `/trace:`) senza argomento per vedere il livello di trace corrente.
- `/trace` è più ristretto di `/verbose`: espone solo le righe di trace/debug di proprietà del Plugin come i riepiloghi di debug di Active Memory.
- Le righe di trace possono comparire in `/status` e come messaggio diagnostico successivo alla normale risposta dell'assistente.

## Visibilità del ragionamento (/reasoning)

- Livelli: `on|off|stream`.
- Un messaggio contenente solo la direttiva attiva/disattiva la visualizzazione dei blocchi di ragionamento nelle risposte.
- Quando abilitato, il ragionamento viene inviato come **messaggio separato** con prefisso `Reasoning:`.
- `stream` (solo Telegram): manda in streaming il ragionamento nella bubble bozza di Telegram mentre la risposta viene generata, quindi invia la risposta finale senza ragionamento.
- Alias: `/reason`.
- Invia `/reasoning` (o `/reasoning:`) senza argomento per vedere il livello di ragionamento corrente.
- Ordine di risoluzione: direttiva inline, poi override di sessione, poi valore predefinito per agente (`agents.list[].reasoningDefault`), poi fallback (`off`).

## Correlati

- La documentazione della modalità elevata si trova in [Modalità elevata](/it/tools/elevated).

## Heartbeat

- Il body della probe Heartbeat è il prompt heartbeat configurato (predefinito: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Le direttive inline in un messaggio heartbeat si applicano normalmente (ma evita di cambiare i valori predefiniti di sessione dagli heartbeat).
- Il recapito Heartbeat usa come predefinito solo il payload finale. Per inviare anche il messaggio separato `Reasoning:` (quando disponibile), imposta `agents.defaults.heartbeat.includeReasoning: true` o `agents.list[].heartbeat.includeReasoning: true` per agente.

## UI della chat web

- Il selettore del ragionamento della chat web rispecchia il livello memorizzato della sessione dall'archivio/configurazione della sessione in ingresso quando la pagina viene caricata.
- Scegliere un altro livello scrive immediatamente l'override di sessione tramite `sessions.patch`; non aspetta l'invio successivo e non è un override one-shot `thinkingOnce`.
- La prima opzione è sempre `Default (<resolved level>)`, dove il valore predefinito risolto proviene dal profilo di ragionamento del provider del modello di sessione attivo più la stessa logica di fallback usata da `/status` e `session_status`.
- Il selettore usa `thinkingOptions` restituito dalla riga di sessione del gateway. L'interfaccia browser non mantiene un proprio elenco regex di provider; i Plugin possiedono gli insiemi di livelli specifici del modello.
- `/think:<level>` continua a funzionare e aggiorna lo stesso livello di sessione memorizzato, così le direttive chat e il selettore restano sincronizzati.

## Profili provider

- I Plugin provider possono esporre `resolveThinkingProfile(ctx)` per definire i livelli supportati e il valore predefinito del modello.
- Ogni livello del profilo ha un `id` canonico memorizzato (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` o `max`) e può includere un `label` visualizzato. I provider binari usano `{ id: "low", label: "on" }`.
- Gli hook legacy pubblicati (`supportsXHighThinking`, `isBinaryThinking` e `resolveDefaultThinkingLevel`) restano come adapter di compatibilità, ma i nuovi insiemi di livelli personalizzati dovrebbero usare `resolveThinkingProfile`.
- Le righe del gateway espongono `thinkingOptions` e `thinkingDefault` così i client ACP/chat renderizzano lo stesso profilo usato dalla validazione runtime.
