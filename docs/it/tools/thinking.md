---
read_when:
    - Modificare l'analisi o i valori predefiniti delle direttive di ragionamento, modalità rapida o modalità verbosa
summary: Sintassi delle direttive per /think, /fast, /verbose, /trace e visibilità del ragionamento
title: Livelli di ragionamento
x-i18n:
    generated_at: "2026-04-21T19:21:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: c77f6f1318c428bbd21725ea5f32f8088506a10cbbf5b5cbca5973c72a5a81f9
    source_path: tools/thinking.md
    workflow: 15
---

# Livelli di ragionamento (direttive `/think`)

## Cosa fa

- Direttiva inline in qualsiasi body in ingresso: `/t <level>`, `/think:<level>` oppure `/thinking <level>`.
- Livelli (alias): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (budget massimo)
  - xhigh → “ultrathink+” (GPT-5.2 + modelli Codex e sforzo Anthropic Claude Opus 4.7)
  - adaptive → ragionamento adattivo gestito dal provider (supportato per Claude 4.6 su Anthropic/Bedrock e Anthropic Claude Opus 4.7)
  - max → ragionamento massimo del provider (attualmente Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` e `extra_high` corrispondono a `xhigh`.
  - `highest` corrisponde a `high`.
- Note sui provider:
  - I menu e i selettori di ragionamento sono guidati dal profilo provider. I plugin provider dichiarano l'esatto insieme di livelli per il modello selezionato, incluse etichette come `on` binario.
  - `adaptive`, `xhigh` e `max` vengono pubblicizzati solo per i profili provider/modello che li supportano. Le direttive digitate per livelli non supportati vengono rifiutate con le opzioni valide per quel modello.
  - I livelli non supportati già memorizzati vengono rimappati in base al rango del profilo provider. `adaptive` ripiega su `medium` nei modelli non adattivi, mentre `xhigh` e `max` ripiegano sul livello non-`off` più alto supportato per il modello selezionato.
  - I modelli Anthropic Claude 4.6 usano `adaptive` come valore predefinito quando non è impostato alcun livello di ragionamento esplicito.
  - Anthropic Claude Opus 4.7 non usa il ragionamento adattivo come predefinito. Il valore predefinito dello sforzo API rimane gestito dal provider, a meno che tu non imposti esplicitamente un livello di ragionamento.
  - Anthropic Claude Opus 4.7 mappa `/think xhigh` a ragionamento adattivo più `output_config.effort: "xhigh"`, perché `/think` è una direttiva di ragionamento e `xhigh` è l'impostazione di sforzo di Opus 4.7.
  - Anthropic Claude Opus 4.7 espone anche `/think max`; viene mappato allo stesso percorso di sforzo massimo gestito dal provider.
  - I modelli OpenAI GPT mappano `/think` tramite il supporto allo sforzo specifico del modello nell'API Responses. `/think off` invia `reasoning.effort: "none"` solo quando il modello di destinazione lo supporta; altrimenti OpenClaw omette il payload di ragionamento disabilitato invece di inviare un valore non supportato.
  - MiniMax (`minimax/*`) nel percorso di streaming compatibile con Anthropic usa come predefinito `thinking: { type: "disabled" }`, a meno che tu non imposti esplicitamente il ragionamento nei parametri del modello o della richiesta. Questo evita fughe di delta `reasoning_content` dal formato stream Anthropic non nativo di MiniMax.
  - Z.AI (`zai/*`) supporta solo il ragionamento binario (`on`/`off`). Qualsiasi livello diverso da `off` viene trattato come `on` (mappato a `low`).
  - Moonshot (`moonshot/*`) mappa `/think off` a `thinking: { type: "disabled" }` e qualsiasi livello diverso da `off` a `thinking: { type: "enabled" }`. Quando il ragionamento è abilitato, Moonshot accetta solo `tool_choice` `auto|none`; OpenClaw normalizza i valori incompatibili in `auto`.

## Ordine di risoluzione

1. Direttiva inline nel messaggio (si applica solo a quel messaggio).
2. Override di sessione (impostato inviando un messaggio contenente solo una direttiva).
3. Valore predefinito per agente (`agents.list[].thinkingDefault` nella configurazione).
4. Valore predefinito globale (`agents.defaults.thinkingDefault` nella configurazione).
5. Fallback: valore predefinito dichiarato dal provider quando disponibile, `low` per gli altri modelli del catalogo contrassegnati come capaci di ragionamento, `off` altrimenti.

## Impostare un valore predefinito di sessione

- Invia un messaggio che sia **solo** la direttiva (spazi consentiti), ad esempio `/think:medium` oppure `/t high`.
- Questo rimane valido per la sessione corrente (per mittente per impostazione predefinita); viene cancellato con `/think:off` o con il reset per inattività della sessione.
- Viene inviata una risposta di conferma (`Thinking level set to high.` / `Thinking disabled.`). Se il livello non è valido (ad esempio `/thinking big`), il comando viene rifiutato con un suggerimento e lo stato della sessione resta invariato.
- Invia `/think` (o `/think:`) senza argomento per vedere il livello di ragionamento corrente.

## Applicazione per agente

- **Pi incorporato**: il livello risolto viene passato al runtime in-process dell'agente Pi.

## Modalità rapida (`/fast`)

- Livelli: `on|off`.
- Un messaggio contenente solo la direttiva attiva/disattiva un override di sessione per la modalità rapida e risponde `Fast mode enabled.` / `Fast mode disabled.`.
- Invia `/fast` (o `/fast status`) senza modalità per vedere lo stato effettivo corrente della modalità rapida.
- OpenClaw risolve la modalità rapida in questo ordine:
  1. `/fast on|off` inline/con sola direttiva
  2. Override di sessione
  3. Valore predefinito per agente (`agents.list[].fastModeDefault`)
  4. Configurazione per modello: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Per `openai/*`, la modalità rapida si mappa all'elaborazione prioritaria di OpenAI inviando `service_tier=priority` sulle richieste Responses supportate.
- Per `openai-codex/*`, la modalità rapida invia lo stesso flag `service_tier=priority` su Codex Responses. OpenClaw mantiene un unico interruttore `/fast` condiviso tra entrambi i percorsi di autenticazione.
- Per le richieste pubbliche dirette `anthropic/*`, incluso il traffico autenticato OAuth inviato a `api.anthropic.com`, la modalità rapida si mappa ai service tier Anthropic: `/fast on` imposta `service_tier=auto`, `/fast off` imposta `service_tier=standard_only`.
- Per `minimax/*` sul percorso compatibile con Anthropic, `/fast on` (o `params.fastMode: true`) riscrive `MiniMax-M2.7` in `MiniMax-M2.7-highspeed`.
- Parametri espliciti del modello Anthropic `serviceTier` / `service_tier` hanno la precedenza sul valore predefinito della modalità rapida quando entrambi sono impostati. OpenClaw continua comunque a saltare l'iniezione del service tier Anthropic per URL base proxy non Anthropic.

## Direttive verbose (`/verbose` o `/v`)

- Livelli: `on` (minimo) | `full` | `off` (predefinito).
- Un messaggio contenente solo la direttiva attiva/disattiva il verbose di sessione e risponde `Verbose logging enabled.` / `Verbose logging disabled.`; i livelli non validi restituiscono un suggerimento senza cambiare lo stato.
- `/verbose off` memorizza un override di sessione esplicito; cancellalo tramite l'interfaccia Sessions scegliendo `inherit`.
- La direttiva inline si applica solo a quel messaggio; altrimenti si applicano i valori predefiniti di sessione/globali.
- Invia `/verbose` (o `/verbose:`) senza argomento per vedere il livello verbose corrente.
- Quando il verbose è attivo, gli agenti che emettono risultati di tool strutturati (Pi, altri agenti JSON) rimandano ogni chiamata di tool come un proprio messaggio di soli metadati, preceduto da `<emoji> <tool-name>: <arg>` quando disponibile (path/comando). Questi riepiloghi dei tool vengono inviati non appena ogni tool inizia (bubble separate), non come delta di streaming.
- I riepiloghi dei fallimenti dei tool restano visibili in modalità normale, ma i suffissi con i dettagli grezzi degli errori sono nascosti a meno che verbose non sia `on` o `full`.
- Quando verbose è `full`, anche gli output dei tool vengono inoltrati al completamento (bubble separata, troncata a una lunghezza sicura). Se attivi `/verbose on|full|off` mentre un'esecuzione è in corso, le bubble dei tool successive rispettano la nuova impostazione.

## Direttive di trace del plugin (`/trace`)

- Livelli: `on` | `off` (predefinito).
- Un messaggio contenente solo la direttiva attiva/disattiva l'output di trace del plugin per la sessione e risponde `Plugin trace enabled.` / `Plugin trace disabled.`.
- La direttiva inline si applica solo a quel messaggio; altrimenti si applicano i valori predefiniti di sessione/globali.
- Invia `/trace` (o `/trace:`) senza argomento per vedere il livello di trace corrente.
- `/trace` è più limitato di `/verbose`: espone solo righe di trace/debug possedute dal plugin, come i riepiloghi di debug di Active Memory.
- Le righe di trace possono comparire in `/status` e come messaggio diagnostico di follow-up dopo la normale risposta dell'assistente.

## Visibilità del ragionamento (`/reasoning`)

- Livelli: `on|off|stream`.
- Un messaggio contenente solo la direttiva attiva/disattiva la visualizzazione dei blocchi di ragionamento nelle risposte.
- Quando è abilitato, il ragionamento viene inviato come **messaggio separato** preceduto da `Reasoning:`.
- `stream` (solo Telegram): trasmette il ragionamento nella bubble bozza di Telegram mentre la risposta viene generata, poi invia la risposta finale senza ragionamento.
- Alias: `/reason`.
- Invia `/reasoning` (o `/reasoning:`) senza argomento per vedere il livello di ragionamento corrente.
- Ordine di risoluzione: direttiva inline, poi override di sessione, poi valore predefinito per agente (`agents.list[].reasoningDefault`), poi fallback (`off`).

## Correlati

- La documentazione sulla modalità elevata si trova in [Modalità elevata](/it/tools/elevated).

## Heartbeat

- Il body del probe Heartbeat è il prompt heartbeat configurato (predefinito: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Le direttive inline in un messaggio heartbeat si applicano normalmente (ma evita di cambiare i valori predefiniti di sessione dai heartbeat).
- La consegna Heartbeat usa come predefinito solo il payload finale. Per inviare anche il messaggio separato `Reasoning:` (quando disponibile), imposta `agents.defaults.heartbeat.includeReasoning: true` oppure `agents.list[].heartbeat.includeReasoning: true` per agente.

## Interfaccia web chat

- Il selettore del ragionamento nella web chat rispecchia il livello memorizzato della sessione dal session store/configurazione in ingresso quando la pagina viene caricata.
- Scegliere un altro livello scrive immediatamente l'override di sessione tramite `sessions.patch`; non aspetta l'invio successivo e non è un override one-shot `thinkingOnce`.
- La prima opzione è sempre `Default (<resolved level>)`, dove il valore predefinito risolto proviene dal profilo di ragionamento del provider del modello attivo della sessione.
- Il selettore usa `thinkingOptions` restituito dalla riga di sessione Gateway. L'interfaccia browser non mantiene un proprio elenco regex dei provider; i plugin possiedono gli insiemi di livelli specifici del modello.
- `/think:<level>` continua a funzionare e aggiorna lo stesso livello di sessione memorizzato, quindi le direttive della chat e il selettore restano sincronizzati.

## Profili provider

- I plugin provider possono esporre `resolveThinkingProfile(ctx)` per definire i livelli supportati e il valore predefinito del modello.
- Ogni livello del profilo ha un `id` canonico memorizzato (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` o `max`) e può includere una `label` di visualizzazione. I provider binari usano `{ id: "low", label: "on" }`.
- Gli hook legacy pubblicati (`supportsXHighThinking`, `isBinaryThinking` e `resolveDefaultThinkingLevel`) restano come adattatori di compatibilità, ma i nuovi insiemi di livelli personalizzati dovrebbero usare `resolveThinkingProfile`.
- Le righe Gateway espongono `thinkingOptions` e `thinkingDefault` così i client ACP/chat mostrano lo stesso profilo usato dalla validazione runtime.
