---
read_when:
    - Modifica del parsing o dei valori predefiniti per il livello di ragionamento, la modalità rapida o la verbosità
summary: Sintassi delle direttive per /think, /fast, /verbose e visibilità del ragionamento
title: Livelli di ragionamento
x-i18n:
    generated_at: "2026-04-05T14:07:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: f60aeb6ab4c7ce858f725f589f54184b29d8c91994d18c8deafa75179b9a62cb
    source_path: tools/thinking.md
    workflow: 15
---

# Livelli di ragionamento (direttive /think)

## Cosa fa

- Direttiva inline in qualsiasi corpo in ingresso: `/t <level>`, `/think:<level>` o `/thinking <level>`.
- Livelli (alias): `off | minimal | low | medium | high | xhigh | adaptive`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (budget massimo)
  - xhigh → “ultrathink+” (solo modelli GPT-5.2 + Codex)
  - adaptive → budget di ragionamento adattivo gestito dal provider (supportato per la famiglia di modelli Anthropic Claude 4.6)
  - `x-high`, `x_high`, `extra-high`, `extra high` e `extra_high` vengono mappati a `xhigh`.
  - `highest`, `max` vengono mappati a `high`.
- Note sui provider:
  - I modelli Anthropic Claude 4.6 usano `adaptive` per impostazione predefinita quando non è impostato alcun livello di ragionamento esplicito.
  - MiniMax (`minimax/*`) sul percorso di streaming compatibile con Anthropic usa per impostazione predefinita `thinking: { type: "disabled" }` a meno che tu non imposti esplicitamente il ragionamento nei parametri del modello o della richiesta. Questo evita delta `reasoning_content` trapelati dal formato di stream Anthropic non nativo di MiniMax.
  - Z.AI (`zai/*`) supporta solo il ragionamento binario (`on`/`off`). Qualsiasi livello diverso da `off` viene trattato come `on` (mappato a `low`).
  - Moonshot (`moonshot/*`) mappa `/think off` a `thinking: { type: "disabled" }` e qualsiasi livello diverso da `off` a `thinking: { type: "enabled" }`. Quando il ragionamento è abilitato, Moonshot accetta solo `tool_choice` `auto|none`; OpenClaw normalizza i valori incompatibili in `auto`.

## Ordine di risoluzione

1. Direttiva inline nel messaggio (si applica solo a quel messaggio).
2. Override della sessione (impostato inviando un messaggio contenente solo una direttiva).
3. Valore predefinito per agente (`agents.list[].thinkingDefault` nella configurazione).
4. Valore predefinito globale (`agents.defaults.thinkingDefault` nella configurazione).
5. Fallback: `adaptive` per i modelli Anthropic Claude 4.6, `low` per gli altri modelli con capacità di ragionamento, `off` altrimenti.

## Impostare un valore predefinito della sessione

- Invia un messaggio che contenga **solo** la direttiva (gli spazi sono consentiti), ad esempio `/think:medium` o `/t high`.
- Questo resta attivo per la sessione corrente (per mittente per impostazione predefinita); viene cancellato da `/think:off` o dal reset per inattività della sessione.
- Viene inviata una risposta di conferma (`Thinking level set to high.` / `Thinking disabled.`). Se il livello non è valido (ad esempio `/thinking big`), il comando viene rifiutato con un suggerimento e lo stato della sessione rimane invariato.
- Invia `/think` (o `/think:`) senza argomento per vedere il livello di ragionamento corrente.

## Applicazione per agente

- **Pi incorporato**: il livello risolto viene passato al runtime dell'agente Pi in-process.

## Modalità rapida (/fast)

- Livelli: `on|off`.
- Un messaggio contenente solo la direttiva attiva un override della modalità rapida della sessione e risponde con `Fast mode enabled.` / `Fast mode disabled.`.
- Invia `/fast` (o `/fast status`) senza modalità per vedere lo stato effettivo corrente della modalità rapida.
- OpenClaw risolve la modalità rapida in questo ordine:
  1. `/fast on|off` inline/con sola direttiva
  2. Override della sessione
  3. Valore predefinito per agente (`agents.list[].fastModeDefault`)
  4. Configurazione per modello: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Per `openai/*`, la modalità rapida viene mappata all'elaborazione prioritaria OpenAI inviando `service_tier=priority` nelle richieste Responses supportate.
- Per `openai-codex/*`, la modalità rapida invia lo stesso flag `service_tier=priority` su Codex Responses. OpenClaw mantiene un unico interruttore `/fast` condiviso tra entrambi i percorsi di autenticazione.
- Per le richieste pubbliche dirette `anthropic/*`, incluso il traffico autenticato OAuth inviato a `api.anthropic.com`, la modalità rapida viene mappata ai service tier Anthropic: `/fast on` imposta `service_tier=auto`, `/fast off` imposta `service_tier=standard_only`.
- Per `minimax/*` sul percorso compatibile con Anthropic, `/fast on` (o `params.fastMode: true`) riscrive `MiniMax-M2.7` in `MiniMax-M2.7-highspeed`.
- I parametri espliciti del modello Anthropic `serviceTier` / `service_tier` hanno la precedenza sul valore predefinito della modalità rapida quando entrambi sono impostati. OpenClaw continua a saltare l'iniezione del service tier Anthropic per URL base proxy non Anthropic.

## Direttive verbose (/verbose o /v)

- Livelli: `on` (minimo) | `full` | `off` (predefinito).
- Un messaggio contenente solo la direttiva attiva/disattiva la verbosità della sessione e risponde con `Verbose logging enabled.` / `Verbose logging disabled.`; i livelli non validi restituiscono un suggerimento senza modificare lo stato.
- `/verbose off` memorizza un override esplicito della sessione; cancellalo tramite l'interfaccia Sessions scegliendo `inherit`.
- La direttiva inline si applica solo a quel messaggio; altrimenti si applicano i valori predefiniti della sessione/globali.
- Invia `/verbose` (o `/verbose:`) senza argomento per vedere il livello di verbosità corrente.
- Quando la verbosità è attiva, gli agenti che emettono risultati di strumenti strutturati (Pi, altri agenti JSON) inviano ogni chiamata di strumento come un proprio messaggio solo metadati, preceduto da `<emoji> <tool-name>: <arg>` quando disponibile (percorso/comando). Questi riepiloghi degli strumenti vengono inviati non appena ogni strumento si avvia (bolle separate), non come delta di streaming.
- I riepiloghi dei fallimenti degli strumenti restano visibili in modalità normale, ma i suffissi con i dettagli grezzi dell'errore sono nascosti a meno che verbose non sia `on` o `full`.
- Quando verbose è `full`, anche gli output degli strumenti vengono inoltrati dopo il completamento (bolla separata, troncata a una lunghezza sicura). Se attivi/disattivi `/verbose on|full|off` mentre un'esecuzione è in corso, le bolle successive degli strumenti rispettano la nuova impostazione.

## Visibilità del ragionamento (/reasoning)

- Livelli: `on|off|stream`.
- Un messaggio contenente solo la direttiva attiva/disattiva la visualizzazione dei blocchi di ragionamento nelle risposte.
- Quando è abilitata, il ragionamento viene inviato come **messaggio separato** preceduto da `Reasoning:`.
- `stream` (solo Telegram): trasmette il ragionamento nella bolla bozza di Telegram mentre la risposta viene generata, poi invia la risposta finale senza ragionamento.
- Alias: `/reason`.
- Invia `/reasoning` (o `/reasoning:`) senza argomento per vedere il livello di ragionamento corrente.
- Ordine di risoluzione: direttiva inline, poi override della sessione, poi valore predefinito per agente (`agents.list[].reasoningDefault`), poi fallback (`off`).

## Correlati

- La documentazione della modalità elevata è disponibile in [Elevated mode](/tools/elevated).

## Heartbeat

- Il corpo della sonda heartbeat è il prompt heartbeat configurato (predefinito: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Le direttive inline in un messaggio heartbeat si applicano normalmente (ma evita di cambiare i valori predefiniti della sessione dagli heartbeat).
- La consegna dell'heartbeat usa per impostazione predefinita solo il payload finale. Per inviare anche il messaggio separato `Reasoning:` (quando disponibile), imposta `agents.defaults.heartbeat.includeReasoning: true` o per agente `agents.list[].heartbeat.includeReasoning: true`.

## Interfaccia web chat

- Il selettore del livello di ragionamento della web chat riflette il livello memorizzato della sessione dal session store/config in ingresso quando la pagina viene caricata.
- La scelta di un altro livello scrive immediatamente l'override della sessione tramite `sessions.patch`; non attende l'invio successivo e non è un override one-shot `thinkingOnce`.
- La prima opzione è sempre `Default (<resolved level>)`, dove il valore predefinito risolto proviene dal modello attivo della sessione: `adaptive` per Claude 4.6 su Anthropic/Bedrock, `low` per gli altri modelli con capacità di ragionamento, `off` altrimenti.
- Il selettore resta consapevole del provider:
  - la maggior parte dei provider mostra `off | minimal | low | medium | high | adaptive`
  - Z.AI mostra il binario `off | on`
- `/think:<level>` continua a funzionare e aggiorna lo stesso livello di sessione memorizzato, così le direttive della chat e il selettore restano sincronizzati.
