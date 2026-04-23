---
read_when:
    - Regolazione dell'analisi o dei valori predefiniti delle direttive thinking, fast-mode o verbose
summary: Sintassi delle direttive per /think, /fast, /verbose, /trace e visibilità del reasoning
title: Livelli di thinking
x-i18n:
    generated_at: "2026-04-23T13:59:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4efe899f7b47244745a105583b3239effa7975fadd06bd7bcad6327afcc91207
    source_path: tools/thinking.md
    workflow: 15
---

# Livelli di thinking (direttive /think)

## Cosa fa

- Direttiva inline in qualsiasi corpo in ingresso: `/t <level>`, `/think:<level>` oppure `/thinking <level>`.
- Livelli (alias): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (budget massimo)
  - xhigh → “ultrathink+” (sforzo GPT-5.2 + modelli Codex e Anthropic Claude Opus 4.7)
  - adaptive → thinking adattivo gestito dal provider (supportato per Claude 4.6 su Anthropic/Bedrock e Anthropic Claude Opus 4.7)
  - max → reasoning massimo del provider (attualmente Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` e `extra_high` corrispondono a `xhigh`.
  - `highest` corrisponde a `high`.
- Note sui provider:
  - I menu e i selettori di thinking sono guidati dal profilo del provider. I plugin provider dichiarano l'insieme esatto di livelli per il modello selezionato, incluse etichette come il binario `on`.
  - `adaptive`, `xhigh` e `max` vengono pubblicizzati solo per i profili provider/modello che li supportano. Le direttive digitate per livelli non supportati vengono rifiutate con le opzioni valide di quel modello.
  - I livelli non supportati già memorizzati vengono rimappati in base al rango del profilo provider. `adaptive` ricade su `medium` nei modelli non adattivi, mentre `xhigh` e `max` ricadono sul livello non `off` più alto supportato per il modello selezionato.
  - I modelli Anthropic Claude 4.6 usano `adaptive` per impostazione predefinita quando non è impostato alcun livello di thinking esplicito.
  - Anthropic Claude Opus 4.7 non usa il thinking adattivo come predefinito. Il suo valore predefinito di effort API resta gestito dal provider a meno che tu non imposti esplicitamente un livello di thinking.
  - Anthropic Claude Opus 4.7 mappa `/think xhigh` al thinking adattivo più `output_config.effort: "xhigh"`, perché `/think` è una direttiva di thinking e `xhigh` è l'impostazione di effort di Opus 4.7.
  - Anthropic Claude Opus 4.7 espone anche `/think max`; viene mappato allo stesso percorso di effort massimo gestito dal provider.
  - I modelli OpenAI GPT mappano `/think` tramite il supporto `effort` specifico del modello nella Responses API. `/think off` invia `reasoning.effort: "none"` solo quando il modello di destinazione lo supporta; altrimenti OpenClaw omette il payload di reasoning disabilitato invece di inviare un valore non supportato.
  - MiniMax (`minimax/*`) sul percorso di streaming compatibile con Anthropic usa per impostazione predefinita `thinking: { type: "disabled" }` a meno che tu non imposti esplicitamente il thinking nei parametri del modello o della richiesta. Questo evita delta `reasoning_content` trapelati dal formato di stream Anthropic non nativo di MiniMax.
  - Z.AI (`zai/*`) supporta solo thinking binario (`on`/`off`). Qualsiasi livello diverso da `off` viene trattato come `on` (mappato su `low`).
  - Moonshot (`moonshot/*`) mappa `/think off` a `thinking: { type: "disabled" }` e qualsiasi livello diverso da `off` a `thinking: { type: "enabled" }`. Quando il thinking è abilitato, Moonshot accetta solo `tool_choice` `auto|none`; OpenClaw normalizza i valori incompatibili in `auto`.

## Ordine di risoluzione

1. Direttiva inline nel messaggio (si applica solo a quel messaggio).
2. Override di sessione (impostato inviando un messaggio contenente solo la direttiva).
3. Valore predefinito per agente (`agents.list[].thinkingDefault` nella config).
4. Valore predefinito globale (`agents.defaults.thinkingDefault` nella config).
5. Fallback: valore predefinito dichiarato dal provider quando disponibile; altrimenti i modelli con capacità di reasoning risolvono a `medium` o al livello non `off` supportato più vicino per quel modello, e i modelli senza reasoning restano `off`.

## Impostazione di un valore predefinito di sessione

- Invia un messaggio che sia **solo** la direttiva (spazi consentiti), per esempio `/think:medium` o `/t high`.
- Rimane per la sessione corrente (per mittente per impostazione predefinita); viene cancellato da `/think:off` o dal reset per inattività della sessione.
- Viene inviata una risposta di conferma (`Thinking level set to high.` / `Thinking disabled.`). Se il livello non è valido (per esempio `/thinking big`), il comando viene rifiutato con un suggerimento e lo stato della sessione rimane invariato.
- Invia `/think` (o `/think:`) senza argomento per vedere il livello di thinking corrente.

## Applicazione per agente

- **Pi incorporato**: il livello risolto viene passato al runtime dell'agente Pi in-process.

## Modalità veloce (/fast)

- Livelli: `on|off`.
- Un messaggio contenente solo la direttiva attiva/disattiva un override di sessione della modalità veloce e risponde `Fast mode enabled.` / `Fast mode disabled.`.
- Invia `/fast` (o `/fast status`) senza modalità per vedere lo stato effettivo corrente della modalità veloce.
- OpenClaw risolve la modalità veloce in questo ordine:
  1. `/fast on|off` inline/con sola direttiva
  2. Override di sessione
  3. Valore predefinito per agente (`agents.list[].fastModeDefault`)
  4. Config per modello: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Per `openai/*`, la modalità veloce viene mappata all'elaborazione prioritaria di OpenAI inviando `service_tier=priority` nelle richieste Responses supportate.
- Per `openai-codex/*`, la modalità veloce invia lo stesso flag `service_tier=priority` su Codex Responses. OpenClaw mantiene un unico interruttore condiviso `/fast` su entrambi i percorsi di autenticazione.
- Per richieste `anthropic/*` pubbliche dirette, incluso il traffico autenticato via OAuth inviato a `api.anthropic.com`, la modalità veloce viene mappata ai service tier Anthropic: `/fast on` imposta `service_tier=auto`, `/fast off` imposta `service_tier=standard_only`.
- Per `minimax/*` sul percorso compatibile con Anthropic, `/fast on` (o `params.fastMode: true`) riscrive `MiniMax-M2.7` in `MiniMax-M2.7-highspeed`.
- I parametri di modello espliciti Anthropic `serviceTier` / `service_tier` sostituiscono il valore predefinito della modalità veloce quando entrambi sono impostati. OpenClaw continua comunque a saltare l'iniezione del service tier Anthropic per URL base proxy non Anthropic.
- `/status` mostra `Fast` solo quando la modalità veloce è abilitata.

## Direttive verbose (/verbose o /v)

- Livelli: `on` (minimo) | `full` | `off` (predefinito).
- Un messaggio contenente solo la direttiva attiva/disattiva il verbose di sessione e risponde `Verbose logging enabled.` / `Verbose logging disabled.`; i livelli non validi restituiscono un suggerimento senza cambiare lo stato.
- `/verbose off` memorizza un override di sessione esplicito; cancellalo tramite l'interfaccia Sessions scegliendo `inherit`.
- La direttiva inline si applica solo a quel messaggio; in caso contrario si applicano i valori predefiniti di sessione/globali.
- Invia `/verbose` (o `/verbose:`) senza argomento per vedere il livello verbose corrente.
- Quando verbose è attivo, gli agenti che emettono risultati strutturati degli strumenti (Pi, altri agenti JSON) rimandano ogni chiamata di strumento come proprio messaggio solo metadati, con prefisso `<emoji> <tool-name>: <arg>` quando disponibile (path/comando). Questi riepiloghi degli strumenti vengono inviati non appena ogni strumento si avvia (bolle separate), non come delta in streaming.
- I riepiloghi dei fallimenti degli strumenti restano visibili in modalità normale, ma i suffissi dei dettagli di errore grezzi sono nascosti a meno che verbose non sia `on` o `full`.
- Quando verbose è `full`, anche gli output degli strumenti vengono inoltrati dopo il completamento (bolla separata, troncata a una lunghezza sicura). Se attivi `/verbose on|full|off` mentre un'esecuzione è in corso, le bolle degli strumenti successive rispettano la nuova impostazione.

## Direttive di trace del plugin (/trace)

- Livelli: `on` | `off` (predefinito).
- Un messaggio contenente solo la direttiva attiva/disattiva l'output di trace del plugin per la sessione e risponde `Plugin trace enabled.` / `Plugin trace disabled.`.
- La direttiva inline si applica solo a quel messaggio; in caso contrario si applicano i valori predefiniti di sessione/globali.
- Invia `/trace` (o `/trace:`) senza argomento per vedere il livello di trace corrente.
- `/trace` è più ristretto di `/verbose`: espone solo righe di trace/debug possedute dal plugin, come i riepiloghi di debug di Active Memory.
- Le righe di trace possono comparire in `/status` e come messaggio diagnostico di follow-up dopo la normale risposta dell'assistente.

## Visibilità del reasoning (/reasoning)

- Livelli: `on|off|stream`.
- Un messaggio contenente solo la direttiva attiva/disattiva la visualizzazione dei blocchi di thinking nelle risposte.
- Quando è abilitata, il reasoning viene inviato come **messaggio separato** con prefisso `Reasoning:`.
- `stream` (solo Telegram): trasmette il reasoning nella bolla bozza di Telegram mentre la risposta viene generata, poi invia la risposta finale senza reasoning.
- Alias: `/reason`.
- Invia `/reasoning` (o `/reasoning:`) senza argomento per vedere il livello di reasoning corrente.
- Ordine di risoluzione: direttiva inline, poi override di sessione, poi valore predefinito per agente (`agents.list[].reasoningDefault`), poi fallback (`off`).

## Correlati

- La documentazione della modalità elevata si trova in [Modalità elevata](/it/tools/elevated).

## Heartbeat

- Il corpo della probe Heartbeat è il prompt Heartbeat configurato (predefinito: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Le direttive inline in un messaggio Heartbeat si applicano normalmente (ma evita di cambiare i valori predefiniti della sessione dai Heartbeat).
- La consegna di Heartbeat usa per impostazione predefinita solo il payload finale. Per inviare anche il messaggio separato `Reasoning:` (quando disponibile), imposta `agents.defaults.heartbeat.includeReasoning: true` oppure per agente `agents.list[].heartbeat.includeReasoning: true`.

## Interfaccia web chat

- Il selettore di thinking della chat web rispecchia il livello memorizzato della sessione dall'archivio/config della sessione in ingresso quando la pagina viene caricata.
- La selezione di un altro livello scrive immediatamente l'override di sessione tramite `sessions.patch`; non aspetta l'invio successivo e non è un override one-shot `thinkingOnce`.
- La prima opzione è sempre `Default (<resolved level>)`, dove il valore predefinito risolto deriva dal profilo di thinking del provider del modello di sessione attivo più la stessa logica di fallback usata da `/status` e `session_status`.
- Il selettore usa `thinkingOptions` restituito dalla riga della sessione del Gateway. L'interfaccia browser non mantiene un proprio elenco regex dei provider; i plugin possiedono gli insiemi di livelli specifici del modello.
- `/think:<level>` continua a funzionare e aggiorna lo stesso livello di sessione memorizzato, quindi le direttive della chat e il selettore restano sincronizzati.

## Profili provider

- I plugin provider possono esporre `resolveThinkingProfile(ctx)` per definire i livelli supportati e il valore predefinito del modello.
- Ogni livello del profilo ha un `id` canonico memorizzato (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` o `max`) e può includere una `label` di visualizzazione. I provider binari usano `{ id: "low", label: "on" }`.
- Gli hook legacy pubblicati (`supportsXHighThinking`, `isBinaryThinking` e `resolveDefaultThinkingLevel`) restano come adattatori di compatibilità, ma i nuovi insiemi di livelli personalizzati dovrebbero usare `resolveThinkingProfile`.
- Le righe del Gateway espongono `thinkingOptions` e `thinkingDefault` così i client ACP/chat renderizzano lo stesso profilo usato dalla validazione runtime.
