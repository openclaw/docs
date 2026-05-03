---
read_when:
    - Stai eseguendo il debug dei rifiuti delle richieste del provider legati alla struttura della trascrizione
    - Stai modificando la sanitizzazione delle trascrizioni o la logica di riparazione delle chiamate agli strumenti
    - Stai esaminando le discrepanze degli id delle chiamate agli strumenti tra provider
summary: 'Riferimento: regole specifiche del provider per la sanitizzazione e la riparazione delle trascrizioni'
title: Igiene della trascrizione
x-i18n:
    generated_at: "2026-05-03T21:43:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff3a364a4c4d1c0d1e03b2860396c2d7e32c554d7acd0791ed2eaadae06d35ab
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw applica **correzioni specifiche del provider** alle trascrizioni prima di un'esecuzione (durante la costruzione del contesto del modello). La maggior parte di queste sono regolazioni **in memoria** usate per soddisfare requisiti rigorosi del provider. Un passaggio separato di riparazione del file di sessione può anche riscrivere il JSONL archiviato prima che la sessione venga caricata, ma solo per righe malformate o turni persistiti che non sono record durevoli validi. Le risposte dell'assistente consegnate sono preservate su disco; la rimozione del prefill dell'assistente specifica del provider avviene solo durante la costruzione dei payload in uscita. Quando si verifica una riparazione, viene creato un backup del file originale accanto al file di sessione.

L'ambito include:

- Contesto del prompt solo runtime che resta fuori dai turni della trascrizione visibili all'utente
- Sanitizzazione degli id delle chiamate agli strumenti
- Validazione dell'input delle chiamate agli strumenti
- Riparazione dell'abbinamento dei risultati degli strumenti
- Validazione / ordinamento dei turni
- Pulizia delle firme dei pensieri
- Pulizia delle firme di thinking
- Sanitizzazione dei payload immagine
- Pulizia dei blocchi di testo vuoti prima della riproduzione del provider
- Tagging della provenienza dell'input utente (per prompt instradati tra sessioni)
- Riparazione dei turni di errore dell'assistente vuoti per la riproduzione Bedrock Converse

Se ti servono dettagli sull'archiviazione delle trascrizioni, consulta:

- [Approfondimento sulla gestione delle sessioni](/it/reference/session-management-compaction)

---

## Regola globale: il contesto runtime non è la trascrizione dell'utente

Il contesto runtime/di sistema può essere aggiunto al prompt del modello per un turno, ma non è contenuto scritto dall'utente finale. OpenClaw mantiene un corpo del prompt separato e orientato alla trascrizione per le risposte Gateway, i follow-up in coda, ACP, CLI e le esecuzioni Pi incorporate. I turni utente visibili archiviati usano quel corpo della trascrizione invece del prompt arricchito dal runtime.

Per le sessioni legacy che hanno già persistito wrapper runtime, le superfici della cronologia Gateway applicano una proiezione di visualizzazione prima di restituire messaggi a client WebChat, TUI, REST o SSE.

---

## Dove viene eseguito

Tutta l'igiene delle trascrizioni è centralizzata nel runner incorporato:

- Selezione della policy: `src/agents/transcript-policy.ts`
- Applicazione di sanitizzazione/riparazione: `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

La policy usa `provider`, `modelApi` e `modelId` per decidere cosa applicare.

Separatamente dall'igiene delle trascrizioni, i file di sessione vengono riparati (se necessario) prima del caricamento:

- `repairSessionFileIfNeeded` in `src/agents/session-file-repair.ts`
- Chiamato da `run/attempt.ts` e `compact.ts` (runner incorporato)

---

## Regola globale: sanitizzazione delle immagini

I payload immagine vengono sempre sanitizzati per prevenire rifiuti lato provider dovuti ai limiti di dimensione (ridimensionamento/ricompressione di immagini base64 troppo grandi).

Questo aiuta anche a controllare la pressione sui token guidata dalle immagini per i modelli con capacità di visione. Dimensioni massime inferiori riducono generalmente l'uso di token; dimensioni superiori preservano i dettagli.

Implementazione:

- `sanitizeSessionMessagesImages` in `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` in `src/agents/tool-images.ts`
- Il lato massimo dell'immagine è configurabile tramite `agents.defaults.imageMaxDimensionPx` (predefinito: `1200`).
- I blocchi di testo vuoti vengono rimossi mentre questo passaggio attraversa il contenuto di riproduzione. I turni dell'assistente che diventano vuoti vengono eliminati dalla copia di riproduzione; i turni utente e di risultato strumento che diventano vuoti ricevono un placeholder non vuoto di contenuto omesso.

---

## Regola globale: chiamate agli strumenti malformate

I blocchi di chiamata agli strumenti dell'assistente a cui mancano sia `input` sia `arguments` vengono eliminati prima che venga costruito il contesto del modello. Questo previene rifiuti del provider causati da chiamate agli strumenti persistite parzialmente (per esempio, dopo un errore di limite di frequenza).

Implementazione:

- `sanitizeToolCallInputs` in `src/agents/session-transcript-repair.ts`
- Applicato in `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

---

## Regola globale: provenienza dell'input tra sessioni

Quando un agente invia un prompt in un'altra sessione tramite `sessions_send` (inclusi i passaggi di risposta/annuncio da agente ad agente), OpenClaw persiste il turno utente creato con:

- `message.provenance.kind = "inter_session"`

OpenClaw antepone anche un marker nello stesso turno `[Inter-session message ... isUser=false]` prima del testo del prompt instradato, così la chiamata al modello attiva può distinguere l'output di sessioni esterne dalle istruzioni esterne dell'utente finale. Questo marker include la sessione sorgente, il canale e lo strumento quando disponibili. La trascrizione usa comunque `role: "user"` per compatibilità con il provider, ma sia il testo visibile sia i metadati di provenienza contrassegnano il turno come dati tra sessioni.

Durante la ricostruzione del contesto, OpenClaw applica lo stesso marker ai turni utente tra sessioni persistiti in precedenza che hanno solo metadati di provenienza.

---

## Matrice provider (comportamento attuale)

**OpenAI / OpenAI Codex**

- Solo sanitizzazione delle immagini.
- Elimina firme di reasoning orfane (elementi di reasoning autonomi senza un blocco di contenuto successivo) per le trascrizioni OpenAI Responses/Codex, ed elimina il reasoning OpenAI riproducibile dopo un cambio di instradamento del modello.
- Preserva i payload degli elementi di reasoning riproducibili di OpenAI Responses, inclusi gli elementi cifrati con riepilogo vuoto, così la riproduzione manuale/WebSocket mantiene lo stato `rs_*` richiesto abbinato agli elementi di output dell'assistente.
- Nessuna sanitizzazione degli id delle chiamate agli strumenti.
- La riparazione dell'abbinamento dei risultati degli strumenti può spostare output reali abbinati e sintetizzare output `aborted` in stile Codex per chiamate agli strumenti mancanti.
- Nessuna validazione o riordinamento dei turni.
- Gli output degli strumenti mancanti della famiglia OpenAI Responses vengono sintetizzati come `aborted` per corrispondere alla normalizzazione di riproduzione Codex.
- Nessuna rimozione delle firme dei pensieri.

**Gemma 4 compatibile con OpenAI**

- I blocchi storici di thinking/reasoning dell'assistente vengono rimossi prima della riproduzione, così i server Gemma 4 locali compatibili con OpenAI non ricevono contenuto di reasoning dei turni precedenti.
- Le continuazioni con chiamata agli strumenti nello stesso turno corrente mantengono il blocco di reasoning dell'assistente collegato alla chiamata allo strumento finché il risultato dello strumento non è stato riprodotto.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitizzazione degli id delle chiamate agli strumenti: rigorosamente alfanumerici.
- Riparazione dell'abbinamento dei risultati degli strumenti e risultati degli strumenti sintetici.
- Validazione dei turni (alternanza dei turni in stile Gemini).
- Correzione dell'ordinamento dei turni Google (antepone un piccolo bootstrap utente se la cronologia inizia con l'assistente).
- Antigravity Claude: normalizza le firme di thinking; elimina i blocchi di thinking non firmati.

**Anthropic / Minimax (compatibile con Anthropic)**

- Riparazione dell'abbinamento dei risultati degli strumenti e risultati degli strumenti sintetici.
- Validazione dei turni (unisce turni utente consecutivi per soddisfare l'alternanza rigorosa).
- I turni finali di prefill dell'assistente vengono rimossi dai payload Anthropic Messages in uscita quando thinking è abilitato, incluse le rotte Cloudflare AI Gateway.
- I blocchi di thinking con firme di riproduzione mancanti, vuote o composte solo da spazi vengono rimossi prima della conversione del provider. Se questo svuota un turno dell'assistente, OpenClaw mantiene la forma del turno con testo non vuoto di reasoning omesso.
- I turni più vecchi dell'assistente solo thinking che devono essere rimossi vengono sostituiti con testo non vuoto di reasoning omesso, così gli adattatori del provider non eliminano il turno di riproduzione.

**Amazon Bedrock (Converse API)**

- I turni di errore di stream dell'assistente vuoti vengono riparati con un blocco di testo fallback non vuoto prima della riproduzione. Bedrock Converse rifiuta i messaggi dell'assistente con `content: []`, quindi anche i turni dell'assistente persistiti con `stopReason: "error"` e contenuto vuoto vengono riparati su disco prima del caricamento.
- I turni di errore di stream dell'assistente che contengono solo blocchi di testo vuoti vengono eliminati dalla copia di riproduzione in memoria invece di riprodurre un blocco vuoto non valido.
- I blocchi di thinking Claude con firme di riproduzione mancanti, vuote o composte solo da spazi vengono rimossi prima della riproduzione Converse. Se questo svuota un turno dell'assistente, OpenClaw mantiene la forma del turno con testo non vuoto di reasoning omesso.
- I turni più vecchi dell'assistente solo thinking che devono essere rimossi vengono sostituiti con testo non vuoto di reasoning omesso, così la riproduzione Converse mantiene la forma rigorosa dei turni.
- La riproduzione filtra i turni dell'assistente mirror di consegna OpenClaw e iniettati dal gateway.
- La sanitizzazione delle immagini si applica tramite la regola globale.

**Mistral (incluso il rilevamento basato su model-id)**

- Sanitizzazione degli id delle chiamate agli strumenti: strict9 (alfanumerici di lunghezza 9).

**OpenRouter Gemini**

- Pulizia delle firme dei pensieri: rimuove i valori `thought_signature` non base64 (mantiene base64).

**OpenRouter Anthropic**

- I turni finali di prefill dell'assistente vengono rimossi dai payload di modelli Anthropic compatibili con OpenAI verificati di OpenRouter quando reasoning è abilitato, corrispondendo al comportamento di riproduzione Anthropic diretto e Cloudflare Anthropic.

**Tutto il resto**

- Solo sanitizzazione delle immagini.

---

## Comportamento storico (prima di 2026.1.22)

Prima della release 2026.1.22, OpenClaw applicava più livelli di igiene delle trascrizioni:

- Un'estensione **transcript-sanitize** veniva eseguita a ogni costruzione del contesto e poteva:
  - Riparare l'abbinamento tra uso e risultato degli strumenti.
  - Sanitizzare gli id delle chiamate agli strumenti (inclusa una modalità non rigorosa che preservava `_`/`-`).
- Il runner eseguiva anche una sanitizzazione specifica del provider, duplicando il lavoro.
- Ulteriori mutazioni avvenivano fuori dalla policy del provider, incluse:
  - Rimozione dei tag `<final>` dal testo dell'assistente prima della persistenza.
  - Eliminazione dei turni di errore dell'assistente vuoti.
  - Troncamento del contenuto dell'assistente dopo le chiamate agli strumenti.

Questa complessità causava regressioni tra provider (in particolare l'abbinamento `call_id|fc_id` di `openai-responses`). La pulizia 2026.1.22 ha rimosso l'estensione, centralizzato la logica nel runner e reso OpenAI **no-touch** oltre alla sanitizzazione delle immagini.

## Correlati

- [Gestione delle sessioni](/it/concepts/session)
- [Potatura delle sessioni](/it/concepts/session-pruning)
