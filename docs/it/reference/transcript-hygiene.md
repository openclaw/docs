---
read_when:
    - Stai eseguendo il debug di rifiuti delle richieste del provider legati alla forma della trascrizione
    - Stai modificando la sanitizzazione della trascrizione o la logica di riparazione delle chiamate di tool
    - Stai investigando mismatch degli ID delle chiamate di tool tra provider വിവിധi
summary: 'Riferimento: regole di sanitizzazione e riparazione delle trascrizioni specifiche del provider'
title: Igiene della trascrizione
x-i18n:
    generated_at: "2026-04-24T09:01:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: c206186f2c4816775db0f2c4663f07f5a55831a8920d1d0261ff9998bd82efc0
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# Igiene della trascrizione (correzioni specifiche del provider)

Questo documento descrive le **correzioni specifiche del provider** applicate alle trascrizioni prima di un'esecuzione
(costruzione del contesto del modello). Questi sono aggiustamenti **in-memory** usati per soddisfare requisiti
rigidi dei provider. Questi passaggi di igiene **non** riscrivono il transcript JSONL memorizzato
su disco; tuttavia, un passaggio separato di riparazione del file di sessione può riscrivere file JSONL
malformati eliminando le righe non valide prima che la sessione venga caricata. Quando avviene una riparazione, il file originale
viene salvato come backup accanto al file di sessione.

L'ambito include:

- Sanitizzazione degli ID delle chiamate di tool
- Validazione dell'input delle chiamate di tool
- Riparazione dell'associazione dei risultati dei tool
- Validazione / ordinamento dei turni
- Pulizia delle firme di thinking
- Sanitizzazione dei payload immagine
- Etichettatura della provenienza dell'input utente (per prompt instradati tra sessioni)

Se ti servono dettagli sull'archiviazione delle trascrizioni, consulta:

- [/reference/session-management-compaction](/it/reference/session-management-compaction)

---

## Dove viene eseguita

Tutta l'igiene della trascrizione è centralizzata nel runner embedded:

- Selezione dei criteri: `src/agents/transcript-policy.ts`
- Applicazione della sanitizzazione/riparazione: `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

I criteri usano `provider`, `modelApi` e `modelId` per decidere cosa applicare.

Separatamente dall'igiene della trascrizione, i file di sessione vengono riparati (se necessario) prima del caricamento:

- `repairSessionFileIfNeeded` in `src/agents/session-file-repair.ts`
- Chiamato da `run/attempt.ts` e `compact.ts` (runner embedded)

---

## Regola globale: sanitizzazione delle immagini

I payload immagine vengono sempre sanitizzati per prevenire il rifiuto lato provider dovuto a limiti
di dimensione (downscale/ricompressione di immagini base64 troppo grandi).

Questo aiuta anche a controllare la pressione dei token generata dalle immagini per i modelli con capacità vision.
Dimensioni massime più basse in genere riducono l'uso di token; dimensioni più alte preservano più dettaglio.

Implementazione:

- `sanitizeSessionMessagesImages` in `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` in `src/agents/tool-images.ts`
- Il lato massimo dell'immagine è configurabile tramite `agents.defaults.imageMaxDimensionPx` (predefinito: `1200`).

---

## Regola globale: chiamate di tool malformate

I blocchi di chiamata di tool dell'assistente a cui mancano sia `input` sia `arguments` vengono eliminati
prima che venga costruito il contesto del modello. Questo previene i rifiuti del provider dovuti a chiamate di tool
parzialmente persistite (per esempio, dopo un errore di rate limit).

Implementazione:

- `sanitizeToolCallInputs` in `src/agents/session-transcript-repair.ts`
- Applicato in `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

---

## Regola globale: provenienza dell'input tra sessioni

Quando un agente invia un prompt in un'altra sessione tramite `sessions_send` (inclusi
passaggi di reply/announce agent-to-agent), OpenClaw mantiene il turno utente creato con:

- `message.provenance.kind = "inter_session"`

Questi metadati vengono scritti al momento dell'aggiunta alla trascrizione e non cambiano il ruolo
(`role: "user"` resta invariato per compatibilità con il provider). I lettori della trascrizione possono usare
questo per evitare di trattare i prompt interni instradati come istruzioni scritte dall'utente finale.

Durante la ricostruzione del contesto, OpenClaw antepone anche in-memory un breve marcatore `[Inter-session message]`
a quei turni utente così il modello può distinguerli dalle istruzioni dell'utente finale esterno.

---

## Matrice dei provider (comportamento attuale)

**OpenAI / OpenAI Codex**

- Solo sanitizzazione delle immagini.
- Elimina firme di reasoning orfane (elementi di reasoning standalone senza un blocco di contenuto successivo) per le trascrizioni OpenAI Responses/Codex.
- Nessuna sanitizzazione degli ID delle chiamate di tool.
- Nessuna riparazione dell'associazione dei risultati dei tool.
- Nessuna validazione o riordinamento dei turni.
- Nessun risultato sintetico di tool.
- Nessuna rimozione delle firme di thinking.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitizzazione degli ID delle chiamate di tool: alfanumerico rigoroso.
- Riparazione dell'associazione dei risultati dei tool e risultati sintetici di tool.
- Validazione dei turni (alternanza dei turni in stile Gemini).
- Correzione dell'ordinamento dei turni Google (antepone un piccolo bootstrap utente se la cronologia inizia con l'assistente).
- Antigravity Claude: normalizza le firme di thinking; elimina i blocchi di thinking senza firma.

**Anthropic / Minimax (compatibile con Anthropic)**

- Riparazione dell'associazione dei risultati dei tool e risultati sintetici di tool.
- Validazione dei turni (unisce turni utente consecutivi per soddisfare l'alternanza rigorosa).

**Mistral (incluso il rilevamento basato su model-id)**

- Sanitizzazione degli ID delle chiamate di tool: strict9 (alfanumerico lunghezza 9).

**OpenRouter Gemini**

- Pulizia delle firme di thinking: rimuove i valori `thought_signature` non base64 (mantiene quelli base64).

**Tutto il resto**

- Solo sanitizzazione delle immagini.

---

## Comportamento storico (pre-2026.1.22)

Prima della release 2026.1.22, OpenClaw applicava più livelli di igiene della trascrizione:

- Un'estensione **transcript-sanitize** veniva eseguita a ogni costruzione del contesto e poteva:
  - Riparare l'associazione uso/risultato dei tool.
  - Sanitizzare gli ID delle chiamate di tool (inclusa una modalità non rigorosa che preservava `_`/`-`).
- Il runner eseguiva anche una sanitizzazione specifica del provider, duplicando il lavoro.
- Mutazioni aggiuntive avvenivano fuori dai criteri del provider, inclusi:
  - Rimozione dei tag `<final>` dal testo dell'assistente prima della persistenza.
  - Eliminazione dei turni di errore vuoti dell'assistente.
  - Taglio del contenuto dell'assistente dopo le chiamate di tool.

Questa complessità causava regressioni cross-provider (in particolare nell'associazione
`call_id|fc_id` di `openai-responses`). La pulizia del 2026.1.22 ha rimosso l'estensione, centralizzato
la logica nel runner e reso OpenAI **intoccabile** oltre alla sola sanitizzazione delle immagini.

## Correlati

- [Gestione della sessione](/it/concepts/session)
- [Pruning della sessione](/it/concepts/session-pruning)
