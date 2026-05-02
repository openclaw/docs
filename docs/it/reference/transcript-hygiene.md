---
read_when:
    - Stai eseguendo il debug dei rifiuti delle richieste del provider legati alla struttura della trascrizione
    - Stai modificando la sanificazione della trascrizione o la logica di riparazione delle chiamate agli strumenti
    - Stai esaminando le discrepanze negli ID delle chiamate agli strumenti tra provider
summary: 'Riferimento: regole di sanitizzazione e riparazione delle trascrizioni specifiche per fornitore'
title: Igiene della trascrizione
x-i18n:
    generated_at: "2026-05-02T08:34:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6976d4349e47954f49c9dbf300822013851b604ed665f4ab647c62025760a96c
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw applica **correzioni specifiche per provider** alle trascrizioni prima di un'esecuzione (durante la costruzione del contesto del modello). La maggior parte di queste sono modifiche **in memoria** usate per soddisfare requisiti rigorosi dei provider. Un passaggio separato di riparazione del file di sessione può anche riscrivere il JSONL archiviato prima del caricamento della sessione, eliminando righe JSONL malformate oppure riparando turni persistiti sintatticamente validi ma noti per essere rifiutati da un
provider durante la riesecuzione. Quando avviene una riparazione, il file originale viene sottoposto a backup accanto
al file di sessione.

L'ambito include:

- Contesto del prompt solo a runtime escluso dai turni della trascrizione visibili all'utente
- Sanitizzazione degli ID delle chiamate di strumento
- Validazione dell'input delle chiamate di strumento
- Riparazione dell'abbinamento dei risultati degli strumenti
- Validazione / ordinamento dei turni
- Pulizia delle firme di pensiero
- Pulizia delle firme di thinking
- Sanitizzazione dei payload immagine
- Pulizia dei blocchi di testo vuoti prima della riesecuzione del provider
- Etichettatura della provenienza dell'input utente (per prompt instradati tra sessioni)
- Riparazione dei turni di errore assistente vuoti per la riesecuzione Bedrock Converse

Se ti servono dettagli sull'archiviazione delle trascrizioni, vedi:

- [Approfondimento sulla gestione delle sessioni](/it/reference/session-management-compaction)

---

## Regola globale: il contesto runtime non è trascrizione utente

Il contesto runtime/di sistema può essere aggiunto al prompt del modello per un turno, ma non è
contenuto creato dall'utente finale. OpenClaw mantiene un corpo del prompt separato
destinato alla trascrizione per risposte Gateway, follow-up in coda, ACP, CLI ed esecuzioni Pi
incorporate. I turni utente visibili archiviati usano quel corpo della trascrizione invece del
prompt arricchito dal runtime.

Per le sessioni legacy che hanno già persistito wrapper runtime, le superfici della cronologia Gateway
applicano una proiezione di visualizzazione prima di restituire i messaggi a WebChat,
TUI, client REST o SSE.

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

I payload immagine vengono sempre sanitizzati per prevenire rifiuti lato provider dovuti a limiti
di dimensione (ridimensionamento/ricompressione di immagini base64 sovradimensionate).

Questo aiuta anche a controllare la pressione sui token causata dalle immagini per i modelli con capacità visive.
Dimensioni massime inferiori riducono generalmente l'uso di token; dimensioni superiori preservano i dettagli.

Implementazione:

- `sanitizeSessionMessagesImages` in `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` in `src/agents/tool-images.ts`
- Il lato massimo dell'immagine è configurabile tramite `agents.defaults.imageMaxDimensionPx` (predefinito: `1200`).
- I blocchi di testo vuoti vengono rimossi mentre questo passaggio attraversa il contenuto di riesecuzione. I turni
  assistente che diventano vuoti vengono eliminati dalla copia di riesecuzione; i turni utente e di risultato strumento
  che diventano vuoti ricevono un segnaposto non vuoto per contenuto omesso.

---

## Regola globale: chiamate di strumento malformate

I blocchi assistente di chiamata di strumento a cui mancano sia `input` sia `arguments` vengono eliminati
prima che il contesto del modello venga costruito. Questo previene rifiuti dei provider causati da chiamate di strumento
persistite parzialmente (per esempio, dopo un errore di limite di frequenza).

Implementazione:

- `sanitizeToolCallInputs` in `src/agents/session-transcript-repair.ts`
- Applicato in `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

---

## Regola globale: provenienza dell'input tra sessioni

Quando un agente invia un prompt in un'altra sessione tramite `sessions_send` (incluse
le fasi di risposta/annuncio tra agenti), OpenClaw persiste il turno utente creato con:

- `message.provenance.kind = "inter_session"`

OpenClaw antepone anche un marcatore nello stesso turno `[Inter-session message ... isUser=false]`
prima del testo del prompt instradato, così la chiamata al modello attiva può distinguere
l'output di una sessione esterna dalle istruzioni dell'utente finale esterno. Questo marcatore include
la sessione sorgente, il canale e lo strumento quando disponibili. La trascrizione usa ancora
`role: "user"` per compatibilità con i provider, ma sia il testo visibile sia i metadati di provenienza
contrassegnano il turno come dati tra sessioni.

Durante la ricostruzione del contesto, OpenClaw applica lo stesso marcatore ai turni utente
tra sessioni persistiti in precedenza che hanno solo metadati di provenienza.

---

## Matrice dei provider (comportamento corrente)

**OpenAI / OpenAI Codex**

- Solo sanitizzazione delle immagini.
- Elimina firme di reasoning orfane (elementi reasoning autonomi senza un blocco di contenuto successivo) per le trascrizioni OpenAI Responses/Codex, ed elimina il reasoning OpenAI rieseguibile dopo un cambio di route del modello.
- Preserva i payload degli elementi reasoning di OpenAI Responses rieseguibili, inclusi elementi encrypted empty-summary, così la riesecuzione manuale/WebSocket mantiene lo stato `rs_*` richiesto abbinato agli elementi di output dell'assistente.
- Nessuna sanitizzazione degli ID delle chiamate di strumento.
- La riparazione dell'abbinamento dei risultati degli strumenti può spostare output reali corrispondenti e sintetizzare output in stile Codex `aborted` per chiamate di strumento mancanti.
- Nessuna validazione o riordinamento dei turni.
- Gli output di strumento mancanti della famiglia OpenAI Responses vengono sintetizzati come `aborted` per corrispondere alla normalizzazione della riesecuzione Codex.
- Nessuna rimozione delle firme di pensiero.

**Gemma 4 compatibile con OpenAI**

- I blocchi storici di thinking/reasoning dell'assistente vengono rimossi prima della riesecuzione, così i server Gemma 4 locali
  compatibili con OpenAI non ricevono contenuto di reasoning di turni precedenti.
- Le continuazioni di chiamate di strumento nello stesso turno corrente mantengono il blocco di reasoning dell'assistente
  collegato alla chiamata di strumento finché il risultato dello strumento non è stato rieseguito.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitizzazione degli ID delle chiamate di strumento: strettamente alfanumerica.
- Riparazione dell'abbinamento dei risultati degli strumenti e risultati di strumento sintetici.
- Validazione dei turni (alternanza dei turni in stile Gemini).
- Correzione dell'ordinamento dei turni Google (antepone un piccolo bootstrap utente se la cronologia inizia con assistente).
- Antigravity Claude: normalizza le firme di thinking; elimina i blocchi thinking non firmati.

**Anthropic / Minimax (compatibile con Anthropic)**

- Riparazione dell'abbinamento dei risultati degli strumenti e risultati di strumento sintetici.
- Validazione dei turni (unisce turni utente consecutivi per soddisfare l'alternanza rigorosa).
- I turni finali di prefill dell'assistente vengono rimossi dai payload Anthropic Messages
  in uscita quando il thinking è abilitato, incluse le route Cloudflare AI Gateway.
- I blocchi thinking con firme di riesecuzione mancanti, vuote o composte solo da spazi vengono rimossi
  prima della conversione del provider. Se questo svuota un turno assistente, OpenClaw mantiene
  la forma del turno con testo non vuoto di reasoning omesso.
- I turni assistente più vecchi solo thinking che devono essere rimossi vengono sostituiti con
  testo non vuoto di reasoning omesso, così gli adattatori provider non eliminano il turno
  di riesecuzione.

**Amazon Bedrock (Converse API)**

- I turni assistente di errore stream vuoti vengono riparati in un blocco di testo fallback non vuoto
  prima della riesecuzione. Bedrock Converse rifiuta i messaggi assistente con `content: []`, quindi
  anche i turni assistente persistiti con `stopReason: "error"` e contenuto vuoto vengono
  riparati su disco prima del caricamento.
- I turni assistente di errore stream che contengono solo blocchi di testo vuoti vengono eliminati
  dalla copia di riesecuzione in memoria invece di rieseguire un blocco vuoto non valido.
- I blocchi thinking Claude con firme di riesecuzione mancanti, vuote o composte solo da spazi vengono
  rimossi prima della riesecuzione Converse. Se questo svuota un turno assistente, OpenClaw
  mantiene la forma del turno con testo non vuoto di reasoning omesso.
- I turni assistente più vecchi solo thinking che devono essere rimossi vengono sostituiti con
  testo non vuoto di reasoning omesso, così la riesecuzione Converse mantiene la forma rigorosa dei turni.
- La riesecuzione filtra i turni assistente delivery-mirror di OpenClaw e quelli iniettati dal gateway.
- La sanitizzazione delle immagini si applica tramite la regola globale.

**Mistral (incluso il rilevamento basato su ID modello)**

- Sanitizzazione degli ID delle chiamate di strumento: strict9 (alfanumerica, lunghezza 9).

**OpenRouter Gemini**

- Pulizia delle firme di pensiero: rimuove valori `thought_signature` non base64 (mantiene base64).

**OpenRouter Anthropic**

- I turni finali di prefill dell'assistente vengono rimossi dai payload modello Anthropic
  compatibili con OpenAI verificati di OpenRouter quando il reasoning è abilitato, in linea
  con il comportamento di riesecuzione Anthropic diretto e Cloudflare Anthropic.

**Tutto il resto**

- Solo sanitizzazione delle immagini.

---

## Comportamento storico (prima di 2026.1.22)

Prima della release 2026.1.22, OpenClaw applicava più livelli di igiene delle trascrizioni:

- Un **plugin transcript-sanitize** veniva eseguito a ogni costruzione del contesto e poteva:
  - Riparare l'abbinamento tra uso strumento/risultato.
  - Sanitizzare gli ID delle chiamate di strumento (inclusa una modalità non rigorosa che preservava `_`/`-`).
- Il runner eseguiva anche sanitizzazione specifica per provider, duplicando il lavoro.
- Mutazioni aggiuntive avvenivano al di fuori della policy del provider, incluse:
  - Rimozione dei tag `<final>` dal testo dell'assistente prima della persistenza.
  - Eliminazione dei turni di errore assistente vuoti.
  - Troncamento del contenuto dell'assistente dopo le chiamate di strumento.

Questa complessità ha causato regressioni tra provider (in particolare nell'abbinamento `call_id|fc_id` di
`openai-responses`). La pulizia della 2026.1.22 ha rimosso il plugin, centralizzato
la logica nel runner e reso OpenAI **senza modifiche** oltre alla sanitizzazione delle immagini.

## Correlati

- [Gestione delle sessioni](/it/concepts/session)
- [Potatura delle sessioni](/it/concepts/session-pruning)
