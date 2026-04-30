---
read_when:
    - Stai eseguendo il debug dei rifiuti delle richieste del provider legati alla struttura della trascrizione
    - Stai modificando la sanitizzazione della trascrizione o la logica di riparazione delle chiamate agli strumenti
    - Stai esaminando le discrepanze degli ID delle chiamate agli strumenti tra i provider
summary: 'Riferimento: regole specifiche del provider per la sanitizzazione e la riparazione delle trascrizioni'
title: Igiene della trascrizione
x-i18n:
    generated_at: "2026-04-30T09:12:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: d95f065d87ce58019ff2e6cdd6801879404d3b4fa402d26fc6fed9d51966b0a1
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw applica **correzioni specifiche del provider** alle trascrizioni prima di un'esecuzione (durante la creazione del contesto del modello). La maggior parte di queste sono regolazioni **in memoria** usate per soddisfare requisiti rigidi del provider. Un passaggio separato di riparazione del file di sessione può anche riscrivere il JSONL memorizzato prima del caricamento della sessione, eliminando righe JSONL malformate o riparando turni persistiti sintatticamente validi ma noti per essere rifiutati da un
provider durante la riproduzione. Quando avviene una riparazione, il file originale viene salvato come backup accanto
al file di sessione.

L'ambito include:

- Contesto del prompt solo runtime tenuto fuori dai turni di trascrizione visibili all'utente
- Sanificazione degli ID delle chiamate di strumento
- Convalida dell'input delle chiamate di strumento
- Riparazione dell'abbinamento dei risultati degli strumenti
- Convalida / ordinamento dei turni
- Pulizia delle firme del pensiero
- Pulizia delle firme di ragionamento
- Sanificazione dei payload immagine
- Pulizia dei blocchi di testo vuoti prima della riproduzione del provider
- Etichettatura della provenienza dell'input utente (per prompt instradati tra sessioni)
- Riparazione dei turni di errore dell'assistente vuoti per la riproduzione Bedrock Converse

Se ti servono dettagli sull'archiviazione delle trascrizioni, consulta:

- [Approfondimento sulla gestione delle sessioni](/it/reference/session-management-compaction)

---

## Regola globale: il contesto runtime non è la trascrizione utente

Il contesto runtime/di sistema può essere aggiunto al prompt del modello per un turno, ma
non è contenuto scritto dall'utente finale. OpenClaw mantiene un corpo del prompt separato
rivolto alla trascrizione per risposte Gateway, follow-up in coda, ACP, CLI ed esecuzioni Pi
incorporate. I turni utente visibili memorizzati usano quel corpo della trascrizione invece del
prompt arricchito dal runtime.

Per le sessioni legacy che hanno già persistito wrapper runtime, le superfici della cronologia Gateway
applicano una proiezione di visualizzazione prima di restituire i messaggi ai client WebChat,
TUI, REST o SSE.

---

## Dove viene eseguito

Tutta l'igiene delle trascrizioni è centralizzata nel runner incorporato:

- Selezione della policy: `src/agents/transcript-policy.ts`
- Applicazione di sanificazione/riparazione: `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

La policy usa `provider`, `modelApi` e `modelId` per decidere cosa applicare.

Separatamente dall'igiene delle trascrizioni, i file di sessione vengono riparati (se necessario) prima del caricamento:

- `repairSessionFileIfNeeded` in `src/agents/session-file-repair.ts`
- Chiamato da `run/attempt.ts` e `compact.ts` (runner incorporato)

---

## Regola globale: sanificazione delle immagini

I payload immagine vengono sempre sanificati per prevenire rifiuti lato provider dovuti ai limiti
di dimensione (ridimensionamento/ricompressione delle immagini base64 troppo grandi).

Questo aiuta anche a controllare la pressione sui token guidata dalle immagini per i modelli compatibili con la visione.
Dimensioni massime inferiori in genere riducono l'uso dei token; dimensioni superiori preservano i dettagli.

Implementazione:

- `sanitizeSessionMessagesImages` in `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` in `src/agents/tool-images.ts`
- Il lato massimo dell'immagine è configurabile tramite `agents.defaults.imageMaxDimensionPx` (predefinito: `1200`).
- I blocchi di testo vuoti vengono rimossi mentre questo passaggio attraversa il contenuto di riproduzione. I turni
  dell'assistente che diventano vuoti vengono eliminati dalla copia di riproduzione; i turni utente e dei risultati
  degli strumenti che diventano vuoti ricevono un segnaposto non vuoto per contenuto omesso.

---

## Regola globale: chiamate di strumento malformate

I blocchi di chiamata di strumento dell'assistente privi sia di `input` sia di `arguments` vengono eliminati
prima che il contesto del modello venga creato. Questo evita rifiuti del provider causati da chiamate di strumento
persistite parzialmente (per esempio dopo un errore di limite di frequenza).

Implementazione:

- `sanitizeToolCallInputs` in `src/agents/session-transcript-repair.ts`
- Applicato in `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

---

## Regola globale: provenienza dell'input tra sessioni

Quando un agente invia un prompt in un'altra sessione tramite `sessions_send` (inclusi
i passaggi di risposta/annuncio da agente ad agente), OpenClaw persiste il turno utente creato con:

- `message.provenance.kind = "inter_session"`

OpenClaw antepone anche un marcatore nello stesso turno `[Inter-session message ... isUser=false]`
prima del testo del prompt instradato, così la chiamata al modello attiva può distinguere
l'output di una sessione esterna dalle istruzioni esterne dell'utente finale. Questo marcatore include
la sessione di origine, il canale e lo strumento quando disponibili. La trascrizione usa comunque
`role: "user"` per compatibilità con il provider, ma sia il testo visibile sia i metadati di provenienza
marcano il turno come dati tra sessioni.

Durante la ricostruzione del contesto, OpenClaw applica lo stesso marcatore ai turni utente
tra sessioni persistiti più vecchi che hanno solo metadati di provenienza.

---

## Matrice dei provider (comportamento attuale)

**OpenAI / OpenAI Codex**

- Solo sanificazione delle immagini.
- Elimina le firme di ragionamento orfane (elementi di ragionamento autonomi senza un blocco di contenuto successivo) per le trascrizioni OpenAI Responses/Codex, ed elimina il ragionamento OpenAI riproducibile dopo un cambio di instradamento del modello.
- Preserva i payload degli elementi di ragionamento riproducibili di OpenAI Responses, inclusi gli elementi con riepilogo vuoto cifrato, così la riproduzione manuale/WebSocket mantiene lo stato `rs_*` richiesto abbinato agli elementi di output dell'assistente.
- Nessuna sanificazione degli ID delle chiamate di strumento.
- La riparazione dell'abbinamento dei risultati degli strumenti può spostare output reali corrispondenti e sintetizzare output `aborted` in stile Codex per chiamate di strumento mancanti.
- Nessuna convalida o riordinamento dei turni.
- Gli output di strumenti mancanti della famiglia OpenAI Responses vengono sintetizzati come `aborted` per corrispondere alla normalizzazione della riproduzione Codex.
- Nessuna rimozione delle firme del pensiero.

**Gemma 4 compatibile con OpenAI**

- I blocchi storici di pensiero/ragionamento dell'assistente vengono rimossi prima della riproduzione, così i server
  Gemma 4 locali compatibili con OpenAI non ricevono contenuto di ragionamento di turni precedenti.
- Le continuazioni con chiamata di strumento nello stesso turno corrente mantengono il blocco di ragionamento dell'assistente
  collegato alla chiamata di strumento finché il risultato dello strumento non è stato riprodotto.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanificazione degli ID delle chiamate di strumento: alfanumerico rigoroso.
- Riparazione dell'abbinamento dei risultati degli strumenti e risultati sintetici degli strumenti.
- Convalida dei turni (alternanza dei turni in stile Gemini).
- Correzione dell'ordinamento dei turni Google (antepone un piccolo bootstrap utente se la cronologia inizia con l'assistente).
- Antigravity Claude: normalizza le firme di ragionamento; elimina i blocchi di ragionamento non firmati.

**Anthropic / Minimax (compatibile con Anthropic)**

- Riparazione dell'abbinamento dei risultati degli strumenti e risultati sintetici degli strumenti.
- Convalida dei turni (unisce turni utente consecutivi per soddisfare l'alternanza rigorosa).
- I turni finali di precompilazione dell'assistente vengono rimossi dai payload Anthropic Messages
  in uscita quando il ragionamento è abilitato, incluse le route Cloudflare AI Gateway.
- I blocchi di ragionamento con firme di riproduzione mancanti, vuote o bianche vengono rimossi
  prima della conversione del provider. Se questo svuota un turno dell'assistente, OpenClaw mantiene
  la forma del turno con testo non vuoto di ragionamento omesso.
- I turni assistente più vecchi composti solo da ragionamento che devono essere rimossi vengono sostituiti con
  testo non vuoto di ragionamento omesso, così gli adapter del provider non eliminano il turno di riproduzione.

**Amazon Bedrock (Converse API)**

- I turni di errore di streaming dell'assistente vuoti vengono riparati in un blocco di testo di fallback non vuoto
  prima della riproduzione. Bedrock Converse rifiuta messaggi dell'assistente con `content: []`, quindi
  anche i turni assistente persistiti con `stopReason: "error"` e contenuto vuoto vengono
  riparati su disco prima del caricamento.
- I turni di errore di streaming dell'assistente che contengono solo blocchi di testo vuoti vengono eliminati
  dalla copia di riproduzione in memoria invece di riprodurre un blocco vuoto non valido.
- I blocchi di ragionamento Claude con firme di riproduzione mancanti, vuote o bianche vengono
  rimossi prima della riproduzione Converse. Se questo svuota un turno dell'assistente, OpenClaw
  mantiene la forma del turno con testo non vuoto di ragionamento omesso.
- I turni assistente più vecchi composti solo da ragionamento che devono essere rimossi vengono sostituiti con
  testo non vuoto di ragionamento omesso, così la riproduzione Converse mantiene la forma rigorosa dei turni.
- La riproduzione filtra i turni assistente mirror di consegna OpenClaw e quelli iniettati dal Gateway.
- La sanificazione delle immagini si applica tramite la regola globale.

**Mistral (incluso il rilevamento basato su model-id)**

- Sanificazione degli ID delle chiamate di strumento: strict9 (alfanumerico di lunghezza 9).

**OpenRouter Gemini**

- Pulizia delle firme del pensiero: rimuove i valori `thought_signature` non base64 (mantiene base64).

**Tutto il resto**

- Solo sanificazione delle immagini.

---

## Comportamento storico (prima di 2026.1.22)

Prima della release 2026.1.22, OpenClaw applicava più livelli di igiene delle trascrizioni:

- Un'estensione **transcript-sanitize** veniva eseguita a ogni creazione del contesto e poteva:
  - Riparare l'abbinamento uso/risultato degli strumenti.
  - Sanificare gli ID delle chiamate di strumento (inclusa una modalità non rigorosa che preservava `_`/`-`).
- Il runner eseguiva anche una sanificazione specifica del provider, duplicando il lavoro.
- Ulteriori mutazioni avvenivano fuori dalla policy del provider, tra cui:
  - Rimozione dei tag `<final>` dal testo dell'assistente prima della persistenza.
  - Eliminazione dei turni di errore dell'assistente vuoti.
  - Taglio del contenuto dell'assistente dopo le chiamate di strumento.

Questa complessità ha causato regressioni tra provider (in particolare nell'abbinamento `call_id|fc_id`
di `openai-responses`). La pulizia di 2026.1.22 ha rimosso l'estensione, centralizzato
la logica nel runner e reso OpenAI **senza interventi** oltre alla sanificazione delle immagini.

## Correlati

- [Gestione delle sessioni](/it/concepts/session)
- [Sfoltimento delle sessioni](/it/concepts/session-pruning)
