---
read_when:
    - Regolazione del parsing o dei valori predefiniti delle direttive di thinking, fast-mode o verbose
summary: Sintassi delle direttive per /think, /fast, /verbose, /trace e visibilità del ragionamento
title: Livelli di pensiero
x-i18n:
    generated_at: "2026-04-23T08:37:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66033bb9272c9b9ea8fc85dc91e33e95ce4c469c56a8cd10c19632a5aa8a2338
    source_path: tools/thinking.md
    workflow: 15
---

# Livelli di pensiero (/think directives)

## Cosa fa

- Direttiva inline in qualsiasi corpo in ingresso: `/t <level>`, `/think:<level>` oppure `/thinking <level>`.
- Livelli (alias): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (budget massimo)
  - xhigh → “ultrathink+” (modelli GPT-5.2 + Codex e livello di effort di Anthropic Claude Opus 4.7)
  - adaptive → thinking adattivo gestito dal provider (supportato per Claude 4.6 su Anthropic/Bedrock e Anthropic Claude Opus 4.7)
  - max → reasoning massimo del provider (attualmente Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` e `extra_high` vengono mappati a `xhigh`.
  - `highest` viene mappato a `high`.
- Note sui provider:
  - I menu e i selettori di thinking sono guidati dal profilo provider. I Plugin provider dichiarano l'esatto insieme di livelli per il modello selezionato, incluse etichette come il binario `on`.
  - `adaptive`, `xhigh` e `max` vengono pubblicizzati solo per i profili provider/modello che li supportano. Le direttive tipizzate per livelli non supportati vengono rifiutate con le opzioni valide di quel modello.
  - I livelli memorizzati esistenti ma non supportati vengono rimappati in base al rank del profilo provider. `adaptive` usa come fallback `medium` sui modelli non adattivi, mentre `xhigh` e `max` usano come fallback il più grande livello supportato diverso da off per il modello selezionato.
  - I modelli Anthropic Claude 4.6 usano come predefinito `adaptive` quando non è impostato alcun livello di thinking esplicito.
  - Anthropic Claude Opus 4.7 non usa il thinking adattivo come predefinito. Il valore predefinito dell'API per effort resta di proprietà del provider a meno che tu non imposti esplicitamente un livello di thinking.
  - Anthropic Claude Opus 4.7 mappa `/think xhigh` a thinking adattivo più `output_config.effort: "xhigh"`, perché `/think` è una direttiva di thinking e `xhigh` è l'impostazione di effort di Opus 4.7.
  - Anthropic Claude Opus 4.7 espone anche `/think max`; viene mappato allo stesso percorso max effort di proprietà del provider.
  - I modelli OpenAI GPT mappano `/think` tramite il supporto effort dell'API Responses specifico del modello. `/think off` invia `reasoning.effort: "none"` solo quando il modello di destinazione lo supporta; altrimenti OpenClaw omette il payload di reasoning disabilitato invece di inviare un valore non supportato.
  - MiniMax (`minimax/*`) sul percorso streaming compatibile con Anthropic usa come predefinito `thinking: { type: "disabled" }` a meno che tu non imposti esplicitamente il thinking nei parametri del modello o nei parametri della richiesta. Questo evita delta `reasoning_content` trapelati dal formato stream Anthropic non nativo di MiniMax.
  - Z.AI (`zai/*`) supporta solo thinking binario (`on`/`off`). Qualsiasi livello diverso da `off` viene trattato come `on` (mappato a `low`).
  - Moonshot (`moonshot/*`) mappa `/think off` a `thinking: { type: "disabled" }` e qualsiasi livello diverso da `off` a `thinking: { type: "enabled" }`. Quando il thinking è abilitato, Moonshot accetta solo `tool_choice` `auto|none`; OpenClaw normalizza i valori incompatibili in `auto`.

## Ordine di risoluzione

1. Direttiva inline nel messaggio (si applica solo a quel messaggio).
2. Override di sessione (impostato inviando un messaggio contenente solo la direttiva).
3. Predefinito per agente (`agents.list[].thinkingDefault` nella configurazione).
4. Predefinito globale (`agents.defaults.thinkingDefault` nella configurazione).
5. Fallback: predefinito dichiarato dal provider quando disponibile, `low` per altri modelli del catalogo contrassegnati come capaci di reasoning, `off` altrimenti.

## Impostazione di un valore predefinito di sessione

- Invia un messaggio che contenga **solo** la direttiva (spazi consentiti), ad esempio `/think:medium` oppure `/t high`.
- Questo resta attivo per la sessione corrente (per mittente per impostazione predefinita); viene cancellato da `/think:off` o dal reset per inattività della sessione.
- Viene inviata una risposta di conferma (`Thinking level set to high.` / `Thinking disabled.`). Se il livello non è valido (ad esempio `/thinking big`), il comando viene rifiutato con un suggerimento e lo stato della sessione resta invariato.
- Invia `/think` (oppure `/think:`) senza argomento per vedere il livello di thinking corrente.

## Applicazione per agente

- **Pi incorporato**: il livello risolto viene passato al runtime dell'agente Pi in-process.

## Modalità fast (/fast)

- Livelli: `on|off`.
- Un messaggio contenente solo la direttiva attiva/disattiva un override di sessione della modalità fast e risponde con `Fast mode enabled.` / `Fast mode disabled.`.
- Invia `/fast` (oppure `/fast status`) senza modalità per vedere lo stato effettivo corrente della modalità fast.
- OpenClaw risolve la modalità fast in questo ordine:
  1. `/fast on|off` inline/con sola direttiva
  2. Override di sessione
  3. Predefinito per agente (`agents.list[].fastModeDefault`)
  4. Configurazione per modello: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Per `openai/*`, la modalità fast si mappa all'elaborazione prioritaria OpenAI inviando `service_tier=priority` sulle richieste Responses supportate.
- Per `openai-codex/*`, la modalità fast invia lo stesso flag `service_tier=priority` sulle Responses Codex. OpenClaw mantiene un unico toggle `/fast` condiviso su entrambi i percorsi auth.
- Per richieste dirette pubbliche `anthropic/*`, incluso il traffico autenticato OAuth inviato a `api.anthropic.com`, la modalità fast si mappa ai service tier di Anthropic: `/fast on` imposta `service_tier=auto`, `/fast off` imposta `service_tier=standard_only`.
- Per `minimax/*` sul percorso compatibile con Anthropic, `/fast on` (oppure `params.fastMode: true`) riscrive `MiniMax-M2.7` in `MiniMax-M2.7-highspeed`.
- I parametri espliciti del modello Anthropic `serviceTier` / `service_tier` sovrascrivono il valore predefinito della modalità fast quando entrambi sono impostati. OpenClaw continua comunque a saltare l'iniezione del service tier Anthropic per URL base proxy non Anthropic.
- `/status` mostra `Fast` solo quando la modalità fast è abilitata.

## Direttive verbose (/verbose oppure /v)

- Livelli: `on` (minimal) | `full` | `off` (predefinito).
- Un messaggio contenente solo la direttiva attiva/disattiva il verbose di sessione e risponde con `Verbose logging enabled.` / `Verbose logging disabled.`; livelli non validi restituiscono un suggerimento senza modificare lo stato.
- `/verbose off` memorizza un override di sessione esplicito; cancellalo tramite l'interfaccia Sessions scegliendo `inherit`.
- La direttiva inline influenza solo quel messaggio; altrimenti si applicano i valori predefiniti di sessione/globali.
- Invia `/verbose` (oppure `/verbose:`) senza argomento per vedere il livello verbose corrente.
- Quando verbose è attivo, gli agenti che emettono risultati strutturati dei tool (Pi, altri agenti JSON) rimandano ogni chiamata tool come proprio messaggio solo-metadati, con prefisso `<emoji> <tool-name>: <arg>` quando disponibile (percorso/comando). Questi riepiloghi dei tool vengono inviati non appena ogni tool inizia (bolle separate), non come delta in streaming.
- I riepiloghi dei fallimenti dei tool restano visibili in modalità normale, ma i suffissi con i dettagli grezzi degli errori sono nascosti a meno che verbose non sia `on` o `full`.
- Quando verbose è `full`, anche gli output dei tool vengono inoltrati dopo il completamento (bolla separata, troncata a una lunghezza sicura). Se cambi `/verbose on|full|off` mentre un'esecuzione è in corso, le bolle successive dei tool rispettano la nuova impostazione.

## Direttive di trace dei Plugin (/trace)

- Livelli: `on` | `off` (predefinito).
- Un messaggio contenente solo la direttiva attiva/disattiva l'output trace dei Plugin di sessione e risponde con `Plugin trace enabled.` / `Plugin trace disabled.`.
- La direttiva inline influenza solo quel messaggio; altrimenti si applicano i valori predefiniti di sessione/globali.
- Invia `/trace` (oppure `/trace:`) senza argomento per vedere il livello trace corrente.
- `/trace` è più ristretto di `/verbose`: espone solo righe trace/debug di proprietà dei Plugin come i riepiloghi di debug di Active Memory.
- Le righe trace possono comparire in `/status` e come messaggio diagnostico di follow-up dopo la normale risposta dell'assistente.

## Visibilità del reasoning (/reasoning)

- Livelli: `on|off|stream`.
- Un messaggio contenente solo la direttiva attiva/disattiva la visualizzazione dei blocchi di thinking nelle risposte.
- Quando abilitato, il reasoning viene inviato come **messaggio separato** con prefisso `Reasoning:`.
- `stream` (solo Telegram): trasmette il reasoning nella bolla draft di Telegram mentre la risposta viene generata, poi invia la risposta finale senza reasoning.
- Alias: `/reason`.
- Invia `/reasoning` (oppure `/reasoning:`) senza argomento per vedere il livello di reasoning corrente.
- Ordine di risoluzione: direttiva inline, poi override di sessione, poi predefinito per agente (`agents.list[].reasoningDefault`), poi fallback (`off`).

## Correlati

- La documentazione della modalità Elevated si trova in [Modalità Elevated](/it/tools/elevated).

## Heartbeat

- Il corpo del probe Heartbeat è il prompt Heartbeat configurato (predefinito: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Le direttive inline in un messaggio Heartbeat si applicano normalmente (ma evita di cambiare i valori predefiniti di sessione dagli Heartbeat).
- La consegna Heartbeat usa come predefinito solo il payload finale. Per inviare anche il messaggio separato `Reasoning:` (quando disponibile), imposta `agents.defaults.heartbeat.includeReasoning: true` oppure `agents.list[].heartbeat.includeReasoning: true` per agente.

## Web chat UI

- Il selettore di thinking della web chat rispecchia il livello memorizzato della sessione dall'inbound session store/config quando la pagina viene caricata.
- Scegliere un altro livello scrive immediatamente l'override di sessione tramite `sessions.patch`; non attende l'invio successivo e non è un override one-shot `thinkingOnce`.
- La prima opzione è sempre `Default (<resolved level>)`, dove il valore predefinito risolto proviene dal profilo di thinking del provider del modello di sessione attivo.
- Il selettore usa `thinkingOptions` restituito dalla riga di sessione del Gateway. L'interfaccia browser non mantiene un proprio elenco regex di provider; i Plugin gestiscono gli insiemi di livelli specifici del modello.
- `/think:<level>` continua a funzionare e aggiorna lo stesso livello di sessione memorizzato, così direttive chat e selettore restano sincronizzati.

## Profili provider

- I Plugin provider possono esporre `resolveThinkingProfile(ctx)` per definire i livelli supportati e il valore predefinito del modello.
- Ogni livello del profilo ha un `id` canonico memorizzato (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` oppure `max`) e può includere un `label` di visualizzazione. I provider binari usano `{ id: "low", label: "on" }`.
- Gli hook legacy pubblicati (`supportsXHighThinking`, `isBinaryThinking` e `resolveDefaultThinkingLevel`) restano come adapter di compatibilità, ma i nuovi insiemi di livelli personalizzati dovrebbero usare `resolveThinkingProfile`.
- Le righe del Gateway espongono `thinkingOptions` e `thinkingDefault` così i client ACP/chat rendono lo stesso profilo usato dalla validazione runtime.
