---
read_when:
    - Stai eseguendo il debug dei rifiuti delle richieste del provider legati alla struttura della trascrizione
    - Stai modificando la sanificazione della trascrizione o la logica di riparazione delle chiamate agli strumenti
    - Stai esaminando le discrepanze degli ID delle chiamate agli strumenti tra provider
summary: 'Riferimento: regole di sanificazione e riparazione delle trascrizioni specifiche del provider'
title: Igiene della trascrizione
x-i18n:
    generated_at: "2026-06-27T18:15:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca1c747b33dc0d6730281d6c91d28a0f8a85bcc5e5cb00dbdebdb55157871a7d
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw applica **correzioni specifiche per provider** alle trascrizioni prima di un'esecuzione (durante la costruzione del contesto del modello). La maggior parte di queste sono regolazioni **in memoria** usate per soddisfare requisiti rigorosi dei provider. Un passaggio separato di riparazione del file di sessione può anche riscrivere il JSONL archiviato prima che la sessione venga caricata, ma solo per righe malformate o turni persistiti che sono record durevoli non validi. Le risposte dell'assistente consegnate vengono preservate su disco; la rimozione del prefill dell'assistente specifica per provider avviene solo durante la costruzione dei payload in uscita. Quando avviene una riparazione, il file originale viene scritto in un file sibling transitorio `*.bak-<pid>-<ts>` prima della sostituzione atomica e rimosso una volta che la sostituzione riesce; il backup viene conservato solo se la pulizia stessa non riesce (nel qual caso il percorso viene riportato).

L'ambito include:

- Contesto del prompt solo runtime che resta fuori dai turni di trascrizione visibili all'utente
- Sanificazione degli id delle chiamate agli strumenti
- Validazione dell'input delle chiamate agli strumenti
- Riparazione dell'abbinamento dei risultati degli strumenti
- Validazione / ordinamento dei turni
- Pulizia delle firme dei pensieri
- Pulizia delle firme di Thinking
- Sanificazione dei payload immagine
- Pulizia dei blocchi di testo vuoti prima della riproduzione del provider
- Pulizia dei turni di lunghezza incompleti solo di ragionamento prima della riproduzione del provider
- Marcatura della provenienza dell'input utente (per prompt instradati tra sessioni)
- Riparazione dei turni di errore dell'assistente vuoti per la riproduzione Bedrock Converse

Se hai bisogno dei dettagli di archiviazione delle trascrizioni, vedi:

- [Approfondimento sulla gestione delle sessioni](/it/reference/session-management-compaction)

---

## Regola globale: il contesto runtime non è trascrizione utente

Il contesto runtime/di sistema può essere aggiunto al prompt del modello per un turno, ma non è
contenuto creato dall'utente finale. OpenClaw mantiene un corpo del prompt separato
rivolto alla trascrizione per risposte Gateway, follow-up in coda, ACP, CLI ed esecuzioni OpenClaw
incorporate. I turni utente visibili archiviati usano quel corpo della trascrizione invece del
prompt arricchito dal runtime.

Per le sessioni legacy che hanno già persistito wrapper runtime, le superfici della cronologia Gateway
applicano una proiezione di visualizzazione prima di restituire i messaggi a WebChat,
TUI, client REST o SSE.

---

## Dove viene eseguito

Tutta l'igiene delle trascrizioni è centralizzata nel runner incorporato:

- Selezione della policy: `src/agents/transcript-policy.ts`
- Applicazione della sanificazione/riparazione: `sanitizeSessionHistory` in `src/agents/embedded-agent-runner/replay-history.ts`

La policy usa `provider`, `modelApi` e `modelId` per decidere cosa applicare.

Separatamente dall'igiene delle trascrizioni, i file di sessione vengono riparati (se necessario) prima del caricamento:

- `repairSessionFileIfNeeded` in `src/agents/session-file-repair.ts`
- Chiamato da `run/attempt.ts` e `compact.ts` (runner incorporato)

---

## Regola globale: sanificazione delle immagini

I payload immagine vengono sempre sanificati per prevenire rifiuti lato provider dovuti ai limiti
di dimensione (ridimensionamento/ricompressione delle immagini base64 sovradimensionate).

Questo aiuta anche a controllare la pressione sui token guidata dalle immagini per i modelli con capacità di visione.
Dimensioni massime inferiori in genere riducono l'uso di token; dimensioni superiori preservano i dettagli.

Implementazione:

- `sanitizeSessionMessagesImages` in `src/agents/embedded-agent-helpers/images.ts`
- `sanitizeContentBlocksImages` in `src/agents/tool-images.ts`
- Il lato massimo dell'immagine è configurabile tramite `agents.defaults.imageMaxDimensionPx` (predefinito: `1200`).
- I blocchi di testo vuoti vengono rimossi mentre questo passaggio attraversa il contenuto di riproduzione. I turni dell'assistente
  che diventano vuoti vengono eliminati dalla copia di riproduzione; i turni utente e di risultato degli strumenti
  che diventano vuoti ricevono un segnaposto non vuoto di contenuto omesso.

---

## Regola globale: chiamate agli strumenti malformate

I blocchi di chiamata agli strumenti dell'assistente a cui mancano sia `input` sia `arguments` vengono eliminati
prima che il contesto del modello venga costruito. Questo evita rifiuti dei provider causati da chiamate agli strumenti
persistite parzialmente (ad esempio dopo un errore di limite di frequenza).

Implementazione:

- `sanitizeToolCallInputs` in `src/agents/session-transcript-repair.ts`
- Applicato in `sanitizeSessionHistory` in `src/agents/embedded-agent-runner/replay-history.ts`

---

## Regola globale: turni incompleti solo di ragionamento

I turni dell'assistente che raggiungono il limite di output del provider con solo contenuto Thinking o
Thinking redatto vengono omessi dalla copia di riproduzione in memoria. Tali turni
contengono stato provider incompleto e possono includere una firma Thinking parziale.

I turni di lunghezza vuoti restano invariati, così come i turni di lunghezza con testo visibile, chiamate agli strumenti
o blocchi di contenuto sconosciuti. Le trascrizioni archiviate non vengono riscritte.

Implementazione:

- `normalizeAssistantReplayContent` in `src/agents/embedded-agent-runner/replay-history.ts`

---

## Regola globale: provenienza dell'input tra sessioni

Quando un agente invia un prompt in un'altra sessione tramite `sessions_send` (inclusi
i passaggi di risposta/annuncio da agente ad agente), OpenClaw persiste il turno utente creato con:

- `message.provenance.kind = "inter_session"`

OpenClaw antepone anche un marcatore dello stesso turno `[Inter-session message ... isUser=false]`
prima del testo del prompt instradato, così la chiamata attiva al modello può distinguere
l'output di sessioni esterne dalle istruzioni esterne dell'utente finale. Questo marcatore include
la sessione sorgente, il canale e lo strumento quando disponibili. La trascrizione usa ancora
`role: "user"` per compatibilità con i provider, ma sia il testo visibile sia i metadati di provenienza
marcano il turno come dati tra sessioni.

Durante la ricostruzione del contesto, OpenClaw applica lo stesso marcatore ai turni utente
tra sessioni persistiti in precedenza che hanno solo metadati di provenienza.

---

## Matrice dei provider (comportamento attuale)

**OpenAI / OpenAI Codex**

- Solo sanificazione delle immagini.
- Elimina le firme di ragionamento orfane (elementi di ragionamento autonomi senza un blocco di contenuto successivo) per le trascrizioni OpenAI Responses/Codex, ed elimina il ragionamento OpenAI riproducibile dopo un cambio di route del modello.
- Preserva i payload degli elementi di ragionamento OpenAI Responses riproducibili, inclusi gli elementi di riepilogo vuoti cifrati, così la riproduzione manuale/WebSocket mantiene lo stato `rs_*` richiesto abbinato agli elementi di output dell'assistente.
- Native ChatGPT Codex Responses segue la parità wire di Codex riproducendo i payload precedenti di ragionamento/messaggio/funzione di Responses senza ID degli elementi precedenti, preservando al contempo il `prompt_cache_key` della sessione.
- La riproduzione della famiglia OpenAI Responses preserva le coppie di ragionamento canoniche `call_*|fc_*` dello stesso modello, ma normalizza deterministicamente gli id `call_id` / elementi di chiamata funzione malformati o troppo lunghi prima della conversione del payload pi-ai.
- La riparazione dell'abbinamento dei risultati degli strumenti può spostare output reali corrispondenti e sintetizzare output in stile Codex `aborted` per chiamate agli strumenti mancanti.
- Nessuna validazione o riordinamento dei turni.
- Gli output degli strumenti mancanti della famiglia OpenAI Responses vengono sintetizzati come `aborted` per corrispondere alla normalizzazione della riproduzione Codex.
- Nessuna rimozione delle firme dei pensieri.

**Chat Completions compatibili con OpenAI**

- I blocchi storici di Thinking/ragionamento dell'assistente vengono rimossi prima della riproduzione affinché
  i server locali e proxy-style compatibili con OpenAI non ricevano campi di ragionamento di turni precedenti
  come `reasoning` o `reasoning_content`.
- Le continuazioni di chiamata agli strumenti nello stesso turno corrente mantengono il blocco di ragionamento dell'assistente
  collegato alla chiamata allo strumento finché il risultato dello strumento non è stato riprodotto.
- Le voci di modelli personalizzati/self-hosted con `reasoning: true` preservano i metadati di ragionamento
  riprodotti.
- Le eccezioni di proprietà del provider possono optare per l'esclusione quando il loro protocollo wire richiede
  metadati di ragionamento riprodotti.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanificazione degli id delle chiamate agli strumenti: alfanumerico rigoroso.
- Riparazione dell'abbinamento dei risultati degli strumenti e risultati degli strumenti sintetici.
- Validazione dei turni (alternanza dei turni in stile Gemini).
- Correzione dell'ordinamento dei turni Google (anteporre un piccolo bootstrap utente se la cronologia inizia con l'assistente).
- Antigravity Claude: normalizza le firme Thinking; elimina i blocchi Thinking non firmati.

**Anthropic / Minimax (compatibile con Anthropic)**

- Riparazione dell'abbinamento dei risultati degli strumenti e risultati degli strumenti sintetici.
- Validazione dei turni (unisce turni utente consecutivi per soddisfare l'alternanza rigorosa).
- I turni finali di prefill dell'assistente vengono rimossi dai payload Anthropic Messages
  in uscita quando Thinking è abilitato, incluse le route Cloudflare AI Gateway.
- Le firme Thinking dell'assistente pre-Compaction vengono rimosse prima della riproduzione del provider
  quando una sessione è stata compattata. Le firme Thinking sono legate crittograficamente
  al prefisso della conversazione al momento della generazione; dopo la Compaction il prefisso cambia
  (il contenuto riepilogato viene sostituito da un riepilogo di Compaction), quindi riprodurre
  le firme originali fa sì che Anthropic rifiuti la richiesta con "Invalid signature in thinking block".
  Il testo Thinking viene preservato come blocco non firmato e viene poi gestito dalla regola sotto.
- I blocchi Thinking con firme di riproduzione mancanti, vuote o blank vengono rimossi
  prima della conversione del provider. Se questo svuota un turno dell'assistente, OpenClaw mantiene
  la forma del turno con testo non vuoto di ragionamento omesso.
- I turni dell'assistente più vecchi solo Thinking che devono essere rimossi vengono sostituiti con
  testo non vuoto di ragionamento omesso, così gli adattatori dei provider non eliminano il turno
  di riproduzione.

**Amazon Bedrock (Converse API)**

- I turni di errore stream dell'assistente vuoti vengono riparati in un blocco di testo fallback non vuoto
  prima della riproduzione. Bedrock Converse rifiuta i messaggi dell'assistente con `content: []`, quindi
  anche i turni dell'assistente persistiti con `stopReason: "error"` e contenuto vuoto vengono
  riparati su disco prima del caricamento.
- I turni di errore stream dell'assistente che contengono solo blocchi di testo blank vengono eliminati
  dalla copia di riproduzione in memoria invece di riprodurre un blocco blank non valido.
- Le firme Thinking dell'assistente pre-Compaction vengono rimosse prima della riproduzione Converse
  quando una sessione è stata compattata, per lo stesso motivo di Anthropic
  sopra.
- I blocchi Thinking di Claude con firme di riproduzione mancanti, vuote o blank vengono
  rimossi prima della riproduzione Converse. Se questo svuota un turno dell'assistente, OpenClaw
  mantiene la forma del turno con testo non vuoto di ragionamento omesso.
- I turni dell'assistente più vecchi solo Thinking che devono essere rimossi vengono sostituiti con
  testo non vuoto di ragionamento omesso, così la riproduzione Converse mantiene la forma rigorosa dei turni.
- La riproduzione filtra i turni dell'assistente delivery-mirror di OpenClaw e iniettati dal gateway.
- La sanificazione delle immagini si applica tramite la regola globale.

**Mistral (incluso il rilevamento basato su model-id)**

- Sanificazione degli id delle chiamate agli strumenti: strict9 (alfanumerico di lunghezza 9).

**OpenRouter Gemini**

- Pulizia delle firme dei pensieri: rimuove i valori `thought_signature` non base64 (mantiene base64).

**OpenRouter Anthropic**

- I turni finali di prefill dell'assistente vengono rimossi dai payload dei modelli Anthropic
  verificati compatibili con OpenAI di OpenRouter quando il ragionamento è abilitato, in modo coerente
  con il comportamento di riproduzione diretto Anthropic e Cloudflare Anthropic.

**Tutto il resto**

- Solo sanificazione delle immagini.

---

## Comportamento storico (prima della 2026.1.22)

Prima della release 2026.1.22, OpenClaw applicava più livelli di igiene delle trascrizioni:

- Un'estensione **transcript-sanitize** veniva eseguita a ogni costruzione del contesto e poteva:
  - Riparare l'abbinamento uso/risultato degli strumenti.
  - Sanificare gli id delle chiamate agli strumenti (inclusa una modalità non rigorosa che preservava `_`/`-`).
- Anche il runner eseguiva sanificazione specifica per provider, duplicando il lavoro.
- Ulteriori mutazioni avvenivano fuori dalla policy del provider, tra cui:
  - Rimozione dei tag `<final>` dal testo dell'assistente prima della persistenza.
  - Eliminazione dei turni di errore dell'assistente vuoti.
  - Troncamento del contenuto dell'assistente dopo le chiamate agli strumenti.

Questa complessità ha causato regressioni cross-provider (in particolare l'abbinamento `call_id|fc_id` di
`openai-responses`). La pulizia della 2026.1.22 ha rimosso l'estensione, centralizzato
la logica nel runner e reso OpenAI **no-touch** oltre alla sanificazione delle immagini.

## Correlati

- [Gestione delle sessioni](/it/concepts/session)
- [Potatura delle sessioni](/it/concepts/session-pruning)
