---
read_when:
    - Stai eseguendo il debug di rifiuti delle richieste del provider legati alla forma del transcript
    - Stai modificando la logica di sanitizzazione del transcript o di riparazione delle chiamate agli strumenti
    - Stai analizzando discrepanze degli ID delle chiamate agli strumenti tra provider
summary: 'Riferimento: regole di sanitizzazione e riparazione del transcript specifiche per provider'
title: Igiene del transcript
x-i18n:
    generated_at: "2026-04-25T18:22:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 880a72d4f73e195ff93f26537d3c80c88dc454691765d3d44032ff43076a07c3
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

Questo documento descrive le **correzioni specifiche per provider** applicate ai transcript prima di un'esecuzione
(costruzione del contesto del modello). La maggior parte di queste sono regolazioni **in memoria** usate per soddisfare
requisiti rigorosi del provider. Un passaggio separato di riparazione del file di sessione può anche riscrivere
il JSONL archiviato prima che la sessione venga caricata, eliminando righe JSONL malformate oppure
riparando turni persistiti che sono sintatticamente validi ma noti per essere rifiutati da un
provider durante il replay. Quando avviene una riparazione, il file originale viene salvato in backup accanto al
file di sessione.

L'ambito include:

- Contesto di prompt solo runtime che rimane fuori dai turni del transcript visibili all'utente
- Sanitizzazione degli ID delle chiamate agli strumenti
- Validazione degli input delle chiamate agli strumenti
- Riparazione dell'accoppiamento dei risultati degli strumenti
- Validazione / ordinamento dei turni
- Pulizia della firma di thought
- Sanitizzazione del payload immagine
- Tagging della provenienza dell'input utente (per prompt instradati tra sessioni)
- Riparazione dei turni di errore dell'assistente vuoti per il replay Bedrock Converse

Se hai bisogno dei dettagli sull'archiviazione dei transcript, vedi:

- [Approfondimento sulla gestione delle sessioni e Compaction](/it/reference/session-management-compaction)

---

## Regola globale: il contesto runtime non è transcript utente

Il contesto runtime/system può essere aggiunto al prompt del modello per un turno, ma non è
contenuto creato dall'utente finale. OpenClaw mantiene un corpo del prompt separato rivolto al transcript
per risposte Gateway, followup in coda, ACP, CLI ed esecuzioni Pi
incorporate. I turni utente visibili archiviati usano quel corpo del transcript invece del
prompt arricchito dal runtime.

Per le sessioni legacy che hanno già persistito wrapper runtime, le
superfici di cronologia Gateway applicano una proiezione di visualizzazione prima di restituire i messaggi a WebChat,
TUI, client REST o SSE.

---

## Dove viene eseguito

Tutta l'igiene del transcript è centralizzata nell'embedded runner:

- Selezione del criterio: `src/agents/transcript-policy.ts`
- Applicazione della sanitizzazione/riparazione: `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

Il criterio usa `provider`, `modelApi` e `modelId` per decidere cosa applicare.

Separatamente dall'igiene del transcript, i file di sessione vengono riparati (se necessario) prima del caricamento:

- `repairSessionFileIfNeeded` in `src/agents/session-file-repair.ts`
- Chiamato da `run/attempt.ts` e `compact.ts` (embedded runner)

---

## Regola globale: sanitizzazione delle immagini

I payload immagine vengono sempre sanitizzati per prevenire rifiuti lato provider dovuti a limiti
di dimensione (ridimensionamento/ricompressione di immagini base64 sovradimensionate).

Questo aiuta anche a controllare la pressione dei token guidata dalle immagini per i modelli con capacità di visione.
Dimensioni massime più basse generalmente riducono l'uso dei token; dimensioni più alte preservano il dettaglio.

Implementazione:

- `sanitizeSessionMessagesImages` in `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` in `src/agents/tool-images.ts`
- Il lato massimo dell'immagine è configurabile tramite `agents.defaults.imageMaxDimensionPx` (predefinito: `1200`).

---

## Regola globale: chiamate agli strumenti malformate

I blocchi di chiamata agli strumenti dell'assistente che non hanno né `input` né `arguments` vengono eliminati
prima che venga costruito il contesto del modello. Questo previene rifiuti del provider dovuti a chiamate agli strumenti
persistite parzialmente (ad esempio dopo un errore di rate limit).

Implementazione:

- `sanitizeToolCallInputs` in `src/agents/session-transcript-repair.ts`
- Applicato in `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

---

## Regola globale: provenienza degli input tra sessioni

Quando un agente invia un prompt in un'altra sessione tramite `sessions_send` (inclusi
i passaggi di risposta/annuncio agent-to-agent), OpenClaw persiste il turno utente creato con:

- `message.provenance.kind = "inter_session"`

Questi metadati vengono scritti al momento dell'aggiunta al transcript e non cambiano il ruolo
(`role: "user"` resta tale per compatibilità con il provider). I lettori del transcript possono usarli
per evitare di trattare i prompt interni instradati come istruzioni create dall'utente finale.

Durante la ricostruzione del contesto, OpenClaw antepone anche un breve marker `[Inter-session message]`
a quei turni utente in memoria così il modello può distinguerli dalle
istruzioni esterne dell'utente finale.

---

## Matrice dei provider (comportamento attuale)

**OpenAI / OpenAI Codex**

- Solo sanitizzazione delle immagini.
- Elimina firme reasoning orfane (elementi reasoning standalone senza un blocco contenuto successivo) per transcript OpenAI Responses/Codex, ed elimina reasoning OpenAI riproducibile dopo un cambio di route del modello.
- Nessuna sanitizzazione degli ID delle chiamate agli strumenti.
- La riparazione dell'accoppiamento dei risultati degli strumenti può spostare output reali corrispondenti e sintetizzare output `aborted` in stile Codex per chiamate agli strumenti mancanti.
- Nessuna validazione o riordinamento dei turni.
- Gli output mancanti della famiglia OpenAI Responses vengono sintetizzati come `aborted` per allinearsi alla normalizzazione del replay Codex.
- Nessuna rimozione delle firme di thought.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitizzazione degli ID delle chiamate agli strumenti: alfanumerico rigoroso.
- Riparazione dell'accoppiamento dei risultati degli strumenti e risultati sintetici degli strumenti.
- Validazione dei turni (alternanza dei turni in stile Gemini).
- Correzione dell'ordinamento dei turni Google (antepone un piccolo bootstrap utente se la cronologia inizia con l'assistente).
- Antigravity Claude: normalizza le firme thinking; elimina i blocchi thinking senza firma.

**Anthropic / Minimax (compatibile con Anthropic)**

- Riparazione dell'accoppiamento dei risultati degli strumenti e risultati sintetici degli strumenti.
- Validazione dei turni (unisce turni utente consecutivi per soddisfare l'alternanza rigorosa).

**Amazon Bedrock (API Converse)**

- I turni vuoti dell'assistente dovuti a errori di stream vengono riparati in un blocco di testo fallback non vuoto
  prima del replay. Bedrock Converse rifiuta i messaggi dell'assistente con `content: []`, quindi
  i turni dell'assistente persistiti con `stopReason: "error"` e contenuto vuoto vengono anch'essi riparati su disco prima del caricamento.
- Il replay filtra i turni dell'assistente mirror di consegna OpenClaw e quelli inseriti dal gateway.
- La sanitizzazione delle immagini si applica tramite la regola globale.

**Mistral (incluso il rilevamento basato su model-id)**

- Sanitizzazione degli ID delle chiamate agli strumenti: strict9 (alfanumerico di lunghezza 9).

**OpenRouter Gemini**

- Pulizia della firma di thought: rimuove i valori `thought_signature` non base64 (mantiene quelli base64).

**Tutto il resto**

- Solo sanitizzazione delle immagini.

---

## Comportamento storico (pre-2026.1.22)

Prima del rilascio 2026.1.22, OpenClaw applicava più livelli di igiene del transcript:

- Un'estensione **transcript-sanitize** veniva eseguita a ogni costruzione del contesto e poteva:
  - Riparare l'accoppiamento uso/risultato degli strumenti.
  - Sanitizzare gli ID delle chiamate agli strumenti (inclusa una modalità non rigorosa che preservava `_`/`-`).
- Il runner eseguiva anche sanitizzazione specifica per provider, duplicando il lavoro.
- Ulteriori mutazioni avvenivano fuori dal criterio del provider, tra cui:
  - Rimozione dei tag `<final>` dal testo dell'assistente prima della persistenza.
  - Eliminazione di turni di errore vuoti dell'assistente.
  - Troncamento del contenuto dell'assistente dopo le chiamate agli strumenti.

Questa complessità ha causato regressioni cross-provider (in particolare nell'accoppiamento
`openai-responses` `call_id|fc_id`). La pulizia del 2026.1.22 ha rimosso l'estensione, centralizzato
la logica nel runner e reso OpenAI **intoccabile** oltre alla sanitizzazione delle immagini.

## Correlati

- [Gestione delle sessioni](/it/concepts/session)
- [Potatura della sessione](/it/concepts/session-pruning)
