---
read_when:
    - Stai eseguendo il debug di rifiuti di richieste del provider legati alla forma della trascrizione
    - Stai modificando la sanificazione della trascrizione o la logica di riparazione delle tool call
    - Stai investigando incompatibilità degli id delle tool call tra provider
summary: 'Riferimento: regole di sanificazione e riparazione delle trascrizioni specifiche per provider'
title: Igiene della trascrizione
x-i18n:
    generated_at: "2026-04-05T14:03:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 217afafb693cf89651e8fa361252f7b5c197feb98d20be4697a83e6dedc0ec3f
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# Igiene della trascrizione (correzioni lato provider)

Questo documento descrive le **correzioni specifiche per provider** applicate alle trascrizioni prima di un'esecuzione
(costruzione del contesto del modello). Questi sono aggiustamenti **in memoria** usati per soddisfare requisiti stringenti
dei provider. Questi passaggi di igiene **non** riscrivono la trascrizione JSONL memorizzata
su disco; tuttavia, un passaggio separato di riparazione del file di sessione può riscrivere file JSONL malformati
eliminando righe non valide prima che la sessione venga caricata. Quando avviene una riparazione, viene creato un backup
del file originale accanto al file di sessione.

L'ambito include:

- Sanificazione degli id delle tool call
- Convalida dell'input delle tool call
- Riparazione dell'associazione dei risultati degli strumenti
- Convalida / ordinamento dei turni
- Pulizia delle firme di pensiero
- Sanificazione del payload delle immagini
- Etichettatura della provenienza dell'input utente (per prompt instradati tra sessioni)

Se ti servono i dettagli sull'archiviazione delle trascrizioni, vedi:

- [/reference/session-management-compaction](/reference/session-management-compaction)

---

## Dove viene eseguito

Tutta l'igiene della trascrizione è centralizzata nell'embedded runner:

- Selezione della policy: `src/agents/transcript-policy.ts`
- Applicazione della sanificazione/riparazione: `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/google.ts`

La policy usa `provider`, `modelApi` e `modelId` per decidere cosa applicare.

Separatamente dall'igiene della trascrizione, i file di sessione vengono riparati (se necessario) prima del caricamento:

- `repairSessionFileIfNeeded` in `src/agents/session-file-repair.ts`
- Chiamato da `run/attempt.ts` e `compact.ts` (embedded runner)

---

## Regola globale: sanificazione delle immagini

I payload delle immagini vengono sempre sanificati per prevenire rifiuti lato provider dovuti a limiti
di dimensione (ridimensionamento/ricompressione di immagini base64 troppo grandi).

Questo aiuta anche a controllare la pressione dei token generata dalle immagini per i modelli con capacità visive.
Dimensioni massime più basse in genere riducono l'uso di token; dimensioni più alte preservano più dettaglio.

Implementazione:

- `sanitizeSessionMessagesImages` in `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` in `src/agents/tool-images.ts`
- Il lato massimo dell'immagine è configurabile tramite `agents.defaults.imageMaxDimensionPx` (predefinito: `1200`).

---

## Regola globale: tool call malformate

I blocchi assistant di tool call privi sia di `input` sia di `arguments` vengono eliminati
prima che venga costruito il contesto del modello. Questo previene rifiuti dei provider causati da tool call
parzialmente persistite (ad esempio dopo un errore di rate limit).

Implementazione:

- `sanitizeToolCallInputs` in `src/agents/session-transcript-repair.ts`
- Applicato in `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/google.ts`

---

## Regola globale: provenienza dell'input tra sessioni

Quando un agente invia un prompt in un'altra sessione tramite `sessions_send` (inclusi
i passaggi di reply/announce agent-to-agent), OpenClaw persiste il turno utente creato con:

- `message.provenance.kind = "inter_session"`

Questo metadato viene scritto al momento dell'aggiunta alla trascrizione e non cambia il ruolo
(`role: "user"` resta tale per compatibilità con il provider). I lettori della trascrizione possono usarlo
per evitare di trattare prompt interni instradati come istruzioni scritte dall'utente finale.

Durante la ricostruzione del contesto, OpenClaw antepone anche in memoria un breve marcatore `[Inter-session message]`
a quei turni utente così il modello può distinguerli dalle istruzioni esterne dell'utente finale.

---

## Matrice dei provider (comportamento attuale)

**OpenAI / OpenAI Codex**

- Solo sanificazione delle immagini.
- Elimina le firme di reasoning orfane (elementi reasoning standalone senza un blocco di contenuto successivo) per le trascrizioni OpenAI Responses/Codex.
- Nessuna sanificazione degli id delle tool call.
- Nessuna riparazione dell'associazione dei risultati degli strumenti.
- Nessuna convalida o riordinamento dei turni.
- Nessun risultato sintetico degli strumenti.
- Nessuna rimozione delle firme di pensiero.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanificazione degli id delle tool call: strettamente alfanumerica.
- Riparazione dell'associazione dei risultati degli strumenti e risultati sintetici degli strumenti.
- Convalida dei turni (alternanza dei turni in stile Gemini).
- Correzione dell'ordinamento dei turni Google (antepone un minuscolo bootstrap utente se la cronologia inizia con assistant).
- Antigravity Claude: normalizza le firme di pensiero; elimina i blocchi di pensiero senza firma.

**Anthropic / Minimax (compatibile Anthropic)**

- Riparazione dell'associazione dei risultati degli strumenti e risultati sintetici degli strumenti.
- Convalida dei turni (unisce turni utente consecutivi per soddisfare l'alternanza rigorosa).

**Mistral (incluso il rilevamento basato sull'id del modello)**

- Sanificazione degli id delle tool call: strict9 (alfanumerico di lunghezza 9).

**OpenRouter Gemini**

- Pulizia delle firme di pensiero: rimuove i valori `thought_signature` non base64 (mantiene quelli base64).

**Tutto il resto**

- Solo sanificazione delle immagini.

---

## Comportamento storico (pre-2026.1.22)

Prima della release 2026.1.22, OpenClaw applicava più livelli di igiene della trascrizione:

- Un'estensione di **transcript-sanitize** veniva eseguita a ogni costruzione del contesto e poteva:
  - Riparare l'associazione tra uso dello strumento e risultato.
  - Sanificare gli id delle tool call (inclusa una modalità non strict che preservava `_`/`-`).
- Il runner eseguiva anche sanificazione specifica per provider, duplicando il lavoro.
- Altre mutazioni avvenivano al di fuori della policy del provider, incluse:
  - Rimozione dei tag `<final>` dal testo assistant prima della persistenza.
  - Eliminazione dei turni assistant di errore vuoti.
  - Troncamento del contenuto assistant dopo le tool call.

Questa complessità causava regressioni tra provider (in particolare nell'associazione
`call_id|fc_id` di `openai-responses`). La pulizia del 2026.1.22 ha rimosso l'estensione, centralizzato
la logica nel runner e reso OpenAI **intoccabile** oltre alla sanificazione delle immagini.
