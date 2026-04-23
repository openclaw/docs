---
read_when:
    - Stai eseguendo il debug dei rifiuti di richieste del provider legati alla forma della transcript
    - Stai modificando la sanitizzazione della transcript o la logica di riparazione delle chiamate agli strumenti
    - Stai analizzando incongruenze degli id delle chiamate agli strumenti tra provider
summary: 'Riferimento: regole di sanitizzazione e riparazione della transcript specifiche del provider'
title: Igiene della transcript
x-i18n:
    generated_at: "2026-04-23T08:36:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b528099b547155e5cf25be19e64a017d338b6f7b9c7ef51dc3ce2c2963193b8
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# Igiene della transcript (fixup del provider)

Questo documento descrive le **correzioni specifiche del provider** applicate alle transcript prima di un'esecuzione
(costruzione del contesto del modello). Questi sono aggiustamenti **in memoria** usati per soddisfare requisiti rigorosi
dei provider. Questi passaggi di igiene **non** riscrivono la transcript JSONL memorizzata
su disco; tuttavia, un passaggio separato di riparazione del file di sessione può riscrivere
file JSONL malformati eliminando righe non valide prima che la sessione venga caricata. Quando avviene una riparazione, il file originale
viene salvato in backup accanto al file di sessione.

L'ambito include:

- Sanitizzazione dell'id delle chiamate agli strumenti
- Convalida dell'input delle chiamate agli strumenti
- Riparazione dell'abbinamento dei risultati degli strumenti
- Convalida / ordinamento dei turni
- Pulizia della firma dei pensieri
- Sanitizzazione del payload delle immagini
- Etichettatura della provenienza dell'input utente (per prompt instradati tra sessioni)

Se ti servono i dettagli sull'archiviazione della transcript, vedi:

- [/reference/session-management-compaction](/it/reference/session-management-compaction)

---

## Dove viene eseguito

Tutta l'igiene della transcript è centralizzata nell'embedded runner:

- Selezione della policy: `src/agents/transcript-policy.ts`
- Applicazione di sanitizzazione/riparazione: `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

La policy usa `provider`, `modelApi` e `modelId` per decidere cosa applicare.

Separatamente dall'igiene della transcript, i file di sessione vengono riparati (se necessario) prima del caricamento:

- `repairSessionFileIfNeeded` in `src/agents/session-file-repair.ts`
- Chiamato da `run/attempt.ts` e `compact.ts` (embedded runner)

---

## Regola globale: sanitizzazione delle immagini

I payload delle immagini vengono sempre sanitizzati per evitare rifiuti lato provider dovuti a limiti
di dimensione (ridimensionamento/ricompressione di immagini base64 troppo grandi).

Questo aiuta anche a controllare la pressione sui token causata dalle immagini per i modelli con capacità di visione.
Dimensioni massime più basse riducono generalmente l'uso di token; dimensioni più alte preservano più dettaglio.

Implementazione:

- `sanitizeSessionMessagesImages` in `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` in `src/agents/tool-images.ts`
- Il lato massimo dell'immagine è configurabile tramite `agents.defaults.imageMaxDimensionPx` (predefinito: `1200`).

---

## Regola globale: chiamate agli strumenti malformate

I blocchi di chiamata agli strumenti dell'assistant che non hanno né `input` né `arguments` vengono eliminati
prima che venga costruito il contesto del modello. Questo previene rifiuti dei provider dovuti a chiamate agli strumenti
parzialmente persistite (per esempio dopo un errore di rate limit).

Implementazione:

- `sanitizeToolCallInputs` in `src/agents/session-transcript-repair.ts`
- Applicato in `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

---

## Regola globale: provenienza dell'input tra sessioni

Quando un agente invia un prompt in un'altra sessione tramite `sessions_send` (inclusi
i passaggi di reply/announce da agente ad agente), OpenClaw persiste il turno utente creato con:

- `message.provenance.kind = "inter_session"`

Questi metadati vengono scritti al momento dell'append della transcript e non cambiano il ruolo
(`role: "user"` rimane per compatibilità con i provider). I lettori della transcript possono usarli
per evitare di trattare i prompt interni instradati come istruzioni create dall'utente finale.

Durante la ricostruzione del contesto, OpenClaw antepone anche in memoria un breve marcatore `[Inter-session message]`
a quei turni utente, così il modello può distinguerli dalle
istruzioni esterne dell'utente finale.

---

## Matrice dei provider (comportamento attuale)

**OpenAI / OpenAI Codex**

- Solo sanitizzazione delle immagini.
- Elimina firme di reasoning orfane (elementi reasoning standalone senza un blocco content successivo) per transcript OpenAI Responses/Codex.
- Nessuna sanitizzazione dell'id delle chiamate agli strumenti.
- Nessuna riparazione dell'abbinamento dei risultati degli strumenti.
- Nessuna convalida o riordino dei turni.
- Nessun risultato sintetico degli strumenti.
- Nessuna rimozione della firma dei pensieri.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitizzazione dell'id delle chiamate agli strumenti: alfanumerico rigoroso.
- Riparazione dell'abbinamento dei risultati degli strumenti e risultati sintetici degli strumenti.
- Convalida dei turni (alternanza in stile Gemini).
- Fixup dell'ordinamento dei turni Google (antepone un piccolo bootstrap utente se la cronologia inizia con l'assistant).
- Antigravity Claude: normalizza le firme di thinking; elimina i blocchi di thinking senza firma.

**Anthropic / Minimax (compatibile con Anthropic)**

- Riparazione dell'abbinamento dei risultati degli strumenti e risultati sintetici degli strumenti.
- Convalida dei turni (unisce i turni utente consecutivi per soddisfare l'alternanza rigorosa).

**Mistral (incluso il rilevamento basato su model-id)**

- Sanitizzazione dell'id delle chiamate agli strumenti: strict9 (alfanumerico lunghezza 9).

**OpenRouter Gemini**

- Pulizia della firma dei pensieri: rimuove i valori `thought_signature` non base64 (mantiene quelli base64).

**Tutto il resto**

- Solo sanitizzazione delle immagini.

---

## Comportamento storico (pre-2026.1.22)

Prima della release 2026.1.22, OpenClaw applicava più livelli di igiene della transcript:

- Un'estensione **transcript-sanitize** veniva eseguita a ogni costruzione del contesto e poteva:
  - Riparare l'abbinamento tra uso/risultato degli strumenti.
  - Sanitizzare gli id delle chiamate agli strumenti (inclusa una modalità non rigorosa che preservava `_`/`-`).
- Il runner eseguiva anche sanitizzazione specifica del provider, duplicando il lavoro.
- Si verificavano mutazioni aggiuntive fuori dalla policy del provider, tra cui:
  - Rimozione dei tag `<final>` dal testo dell'assistant prima della persistenza.
  - Eliminazione dei turni di errore dell'assistant vuoti.
  - Troncamento del contenuto dell'assistant dopo le chiamate agli strumenti.

Questa complessità causava regressioni cross-provider (in particolare nell'abbinamento `call_id|fc_id`
di `openai-responses`). La pulizia del 2026.1.22 ha rimosso l'estensione, centralizzato
la logica nel runner e reso OpenAI **intoccabile** oltre alla sanitizzazione delle immagini.
