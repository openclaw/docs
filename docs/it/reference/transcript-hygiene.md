---
read_when:
    - Stai diagnosticando i rigetti delle richieste da parte del fornitore legati alla struttura della trascrizione
    - Stai modificando la sanitizzazione della trascrizione o la logica di riparazione delle chiamate agli strumenti
    - Stai indagando sulle discrepanze degli ID delle chiamate agli strumenti tra fornitori
summary: 'Riferimento: regole di sanitizzazione e riparazione delle trascrizioni specifiche per provider'
title: Igiene della trascrizione
x-i18n:
    generated_at: "2026-05-10T19:51:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 197081fe829cf6463e84c5ead9b4c631a8088e771e68163a35ed39d9efbdbf6a
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw applica **correzioni specifiche del fornitore** alle trascrizioni prima di un'esecuzione (durante la costruzione del contesto del modello). La maggior parte di queste sono regolazioni **in memoria** usate per soddisfare requisiti rigorosi dei fornitori. Un passaggio separato di riparazione del file di sessione può anche riscrivere il JSONL archiviato prima che la sessione venga caricata, ma solo per righe malformate o turni persistiti che non sono record durevoli validi. Le risposte dell'assistente consegnate sono preservate su disco; la rimozione del pre-riempimento dell'assistente specifica del fornitore avviene solo durante la costruzione dei payload in uscita. Quando avviene una riparazione, viene creato un backup del file originale accanto al file di sessione.

L'ambito include:

- Mantenimento del contesto del prompt solo a runtime fuori dai turni della trascrizione visibili all'utente
- Sanificazione degli id delle chiamate agli strumenti
- Validazione dell'input delle chiamate agli strumenti
- Riparazione dell'abbinamento dei risultati degli strumenti
- Validazione / ordinamento dei turni
- Pulizia delle firme dei pensieri
- Pulizia delle firme di ragionamento
- Sanificazione dei payload immagine
- Pulizia dei blocchi di testo vuoti prima della riproduzione del fornitore
- Marcatura della provenienza dell'input utente (per prompt instradati tra sessioni)
- Riparazione dei turni di errore dell'assistente vuoti per la riproduzione Bedrock Converse

Se ti servono dettagli sull'archiviazione delle trascrizioni, vedi:

- [Approfondimento sulla gestione delle sessioni](/it/reference/session-management-compaction)

---

## Regola globale: il contesto di runtime non è la trascrizione utente

Il contesto di runtime/sistema può essere aggiunto al prompt del modello per un turno, ma non è contenuto scritto dall'utente finale. OpenClaw mantiene un corpo del prompt separato, rivolto alla trascrizione, per risposte Gateway, follow-up in coda, ACP, CLI ed esecuzioni Pi incorporate. I turni utente visibili archiviati usano quel corpo della trascrizione invece del prompt arricchito a runtime.

Per le sessioni legacy che hanno già persistito wrapper di runtime, le superfici di cronologia Gateway applicano una proiezione di visualizzazione prima di restituire i messaggi a client WebChat, TUI, REST o SSE.

---

## Dove viene eseguito

Tutta l'igiene della trascrizione è centralizzata nel runner incorporato:

- Selezione della policy: `src/agents/transcript-policy.ts`
- Applicazione di sanificazione/riparazione: `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

La policy usa `provider`, `modelApi` e `modelId` per decidere cosa applicare.

Separatamente dall'igiene della trascrizione, i file di sessione vengono riparati (se necessario) prima del caricamento:

- `repairSessionFileIfNeeded` in `src/agents/session-file-repair.ts`
- Chiamato da `run/attempt.ts` e `compact.ts` (runner incorporato)

---

## Regola globale: sanificazione delle immagini

I payload immagine vengono sempre sanificati per prevenire rifiuti lato fornitore dovuti ai limiti di dimensione (ridimensionamento/ricompressione di immagini base64 troppo grandi).

Questo aiuta anche a controllare la pressione sui token guidata dalle immagini per modelli con capacità di visione. Dimensioni massime inferiori generalmente riducono l'uso di token; dimensioni superiori preservano i dettagli.

Implementazione:

- `sanitizeSessionMessagesImages` in `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` in `src/agents/tool-images.ts`
- Il lato massimo dell'immagine è configurabile tramite `agents.defaults.imageMaxDimensionPx` (predefinito: `1200`).
- I blocchi di testo vuoti vengono rimossi mentre questo passaggio percorre il contenuto di riproduzione. I turni dell'assistente che diventano vuoti vengono eliminati dalla copia di riproduzione; i turni utente e di risultato strumento che diventano vuoti ricevono un segnaposto non vuoto per contenuto omesso.

---

## Regola globale: chiamate agli strumenti malformate

I blocchi di chiamata strumento dell'assistente che non hanno sia `input` sia `arguments` vengono eliminati prima che il contesto del modello venga costruito. Questo previene rifiuti dei fornitori da chiamate agli strumenti persistite parzialmente (per esempio dopo un errore di limite di frequenza).

Implementazione:

- `sanitizeToolCallInputs` in `src/agents/session-transcript-repair.ts`
- Applicato in `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

---

## Regola globale: provenienza dell'input tra sessioni

Quando un agente invia un prompt in un'altra sessione tramite `sessions_send` (inclusi passaggi di risposta/annuncio da agente ad agente), OpenClaw persiste il turno utente creato con:

- `message.provenance.kind = "inter_session"`

OpenClaw antepone anche un marcatore nello stesso turno `[Inter-session message ... isUser=false]` prima del testo del prompt instradato, così la chiamata del modello attivo può distinguere l'output di una sessione esterna dalle istruzioni dell'utente finale esterno. Questo marcatore include sessione sorgente, canale e strumento quando disponibili. La trascrizione usa comunque `role: "user"` per compatibilità con i fornitori, ma sia il testo visibile sia i metadati di provenienza marcano il turno come dati tra sessioni.

Durante la ricostruzione del contesto, OpenClaw applica lo stesso marcatore ai turni utente tra sessioni persistiti in precedenza che hanno solo metadati di provenienza.

---

## Matrice dei fornitori (comportamento attuale)

**OpenAI / OpenAI Codex**

- Solo sanificazione delle immagini.
- Elimina firme di ragionamento orfane (elementi di ragionamento autonomi senza un blocco di contenuto successivo) per trascrizioni OpenAI Responses/Codex, ed elimina il ragionamento OpenAI riproducibile dopo un cambio di route del modello.
- Preserva i payload degli elementi di ragionamento OpenAI Responses riproducibili, inclusi gli elementi crittografati con riepilogo vuoto, così la riproduzione manuale/WebSocket mantiene lo stato `rs_*` richiesto abbinato agli elementi di output dell'assistente.
- Native ChatGPT Codex Responses segue la parità wire di Codex riproducendo payload precedenti di ragionamento/messaggio/funzione di Responses senza id degli elementi precedenti, preservando al contempo la `prompt_cache_key` della sessione.
- Nessuna sanificazione degli id delle chiamate agli strumenti.
- La riparazione dell'abbinamento dei risultati degli strumenti può spostare output reali corrispondenti e sintetizzare output `aborted` in stile Codex per chiamate agli strumenti mancanti.
- Nessuna validazione o riordinamento dei turni.
- Gli output strumento mancanti della famiglia OpenAI Responses vengono sintetizzati come `aborted` per corrispondere alla normalizzazione di riproduzione di Codex.
- Nessuna rimozione delle firme dei pensieri.

**OpenAI-compatible Chat Completions**

- I blocchi storici di ragionamento/pensiero dell'assistente vengono rimossi prima della riproduzione, così i server locali e in stile proxy compatibili con OpenAI non ricevono campi di ragionamento di turni precedenti come `reasoning` o `reasoning_content`.
- Le continuazioni di chiamata strumento nello stesso turno corrente mantengono il blocco di ragionamento dell'assistente collegato alla chiamata strumento finché il risultato strumento non è stato riprodotto.
- Le eccezioni possedute dal fornitore possono disattivare questo comportamento quando il loro protocollo wire richiede metadati di ragionamento riprodotti.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanificazione degli id delle chiamate agli strumenti: rigorosamente alfanumerico.
- Riparazione dell'abbinamento dei risultati degli strumenti e risultati strumento sintetici.
- Validazione dei turni (alternanza dei turni in stile Gemini).
- Correzione dell'ordinamento dei turni Google (antepone un minuscolo bootstrap utente se la cronologia inizia con l'assistente).
- Antigravity Claude: normalizza le firme di ragionamento; elimina i blocchi di ragionamento non firmati.

**Anthropic / Minimax (compatibile con Anthropic)**

- Riparazione dell'abbinamento dei risultati degli strumenti e risultati strumento sintetici.
- Validazione dei turni (unisce turni utente consecutivi per soddisfare l'alternanza rigorosa).
- I turni finali di pre-riempimento dell'assistente vengono rimossi dai payload Anthropic Messages in uscita quando il ragionamento è abilitato, incluse le route Cloudflare AI Gateway.
- I blocchi di ragionamento con firme di riproduzione mancanti, vuote o solo spazi vengono rimossi prima della conversione del fornitore. Se ciò svuota un turno dell'assistente, OpenClaw mantiene la forma del turno con testo non vuoto di ragionamento omesso.
- I turni più vecchi dell'assistente solo di ragionamento che devono essere rimossi vengono sostituiti con testo non vuoto di ragionamento omesso, così gli adattatori del fornitore non eliminano il turno di riproduzione.

**Amazon Bedrock (Converse API)**

- I turni di errore di streaming dell'assistente vuoti vengono riparati in un blocco di testo di fallback non vuoto prima della riproduzione. Bedrock Converse rifiuta i messaggi dell'assistente con `content: []`, quindi anche i turni dell'assistente persistiti con `stopReason: "error"` e contenuto vuoto vengono riparati su disco prima del caricamento.
- I turni di errore di streaming dell'assistente che contengono solo blocchi di testo vuoti vengono eliminati dalla copia di riproduzione in memoria invece di riprodurre un blocco vuoto non valido.
- I blocchi di ragionamento Claude con firme di riproduzione mancanti, vuote o solo spazi vengono rimossi prima della riproduzione Converse. Se ciò svuota un turno dell'assistente, OpenClaw mantiene la forma del turno con testo non vuoto di ragionamento omesso.
- I turni più vecchi dell'assistente solo di ragionamento che devono essere rimossi vengono sostituiti con testo non vuoto di ragionamento omesso, così la riproduzione Converse mantiene la forma rigorosa dei turni.
- La riproduzione filtra i turni dell'assistente mirror di consegna OpenClaw e iniettati dal Gateway.
- La sanificazione delle immagini si applica tramite la regola globale.

**Mistral (incluso rilevamento basato sull'id del modello)**

- Sanificazione degli id delle chiamate agli strumenti: strict9 (alfanumerico di lunghezza 9).

**OpenRouter Gemini**

- Pulizia delle firme dei pensieri: rimuove i valori `thought_signature` non base64 (mantiene base64).

**OpenRouter Anthropic**

- I turni finali di pre-riempimento dell'assistente vengono rimossi dai payload di modelli Anthropic OpenAI-compatible verificati di OpenRouter quando il ragionamento è abilitato, allineandosi al comportamento di riproduzione Anthropic diretto e Cloudflare Anthropic.

**Tutto il resto**

- Solo sanificazione delle immagini.

---

## Comportamento storico (prima di 2026.1.22)

Prima della release 2026.1.22, OpenClaw applicava più livelli di igiene della trascrizione:

- Un'estensione **transcript-sanitize** veniva eseguita a ogni costruzione del contesto e poteva:
  - Riparare l'abbinamento tra uso e risultato degli strumenti.
  - Sanificare gli id delle chiamate agli strumenti (inclusa una modalità non rigorosa che preservava `_`/`-`).
- Il runner eseguiva anche sanificazione specifica del fornitore, duplicando il lavoro.
- Ulteriori mutazioni avvenivano fuori dalla policy del fornitore, inclusi:
  - Rimozione dei tag `<final>` dal testo dell'assistente prima della persistenza.
  - Eliminazione dei turni di errore dell'assistente vuoti.
  - Troncamento del contenuto dell'assistente dopo le chiamate agli strumenti.

Questa complessità ha causato regressioni tra fornitori (in particolare l'abbinamento `call_id|fc_id` di `openai-responses`). La pulizia 2026.1.22 ha rimosso l'estensione, centralizzato la logica nel runner e reso OpenAI **senza interventi** oltre la sanificazione delle immagini.

## Correlati

- [Gestione delle sessioni](/it/concepts/session)
- [Potatura delle sessioni](/it/concepts/session-pruning)
