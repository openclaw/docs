---
read_when:
    - Stai collegando le superfici di utilizzo/quota del fornitore
    - È necessario spiegare il comportamento del tracciamento dell'utilizzo o i requisiti di autenticazione
summary: Superfici di monitoraggio dell'utilizzo e requisiti delle credenziali
title: Monitoraggio dell'utilizzo
x-i18n:
    generated_at: "2026-05-06T08:48:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14210813bf3c078a1323b1560a1a3da586f55880e05a9b310e1b6a2d5490f956
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Cos'è

- Recupera l'utilizzo/quota dei provider direttamente dai loro endpoint di utilizzo.
- Nessun costo stimato; solo le finestre riportate dal provider.
- L'output di stato leggibile è normalizzato in `X% left`, anche quando un'API
  upstream segnala quota consumata, quota rimanente o solo conteggi grezzi.
- `/status` a livello di sessione e `session_status` possono ripiegare sull'ultima
  voce di utilizzo della trascrizione quando lo snapshot della sessione live è scarno. Quel
  fallback completa i contatori mancanti di token/cache, può recuperare l'etichetta del modello
  runtime attivo e preferisce il totale orientato al prompt più grande quando i metadati
  della sessione sono mancanti o inferiori. I valori live non zero esistenti hanno comunque priorità.

## Dove compare

- `/status` nelle chat: scheda di stato ricca di emoji con token della sessione + costo stimato (solo chiave API). L'utilizzo del provider viene mostrato per il **provider del modello corrente** quando disponibile come finestra normalizzata `X% left`.
- `/usage off|tokens|full` nelle chat: piè di pagina di utilizzo per risposta (OAuth mostra solo i token).
- `/usage cost` nelle chat: riepilogo dei costi locali aggregato dai log di sessione di OpenClaw.
- CLI: `openclaw status --usage` stampa un dettaglio completo per provider.
- CLI: `openclaw channels list` stampa lo stesso snapshot di utilizzo insieme alla configurazione del provider (usa `--no-usage` per saltarlo).
- Barra dei menu macOS: sezione "Utilizzo" sotto Contesto (solo se disponibile).

## Provider + credenziali

- **Anthropic (Claude)**: token OAuth nei profili di autenticazione.
- **GitHub Copilot**: token OAuth nei profili di autenticazione.
- **Gemini CLI**: token OAuth nei profili di autenticazione.
  - L'utilizzo JSON ripiega su `stats`; `stats.cached` viene normalizzato in
    `cacheRead`.
- **OpenAI Codex**: token OAuth nei profili di autenticazione (`accountId` usato quando presente).
- **MiniMax**: chiave API o profilo di autenticazione OAuth MiniMax. OpenClaw tratta
  `minimax`, `minimax-cn` e `minimax-portal` come la stessa superficie di quota MiniMax,
  preferisce l'OAuth MiniMax salvato quando presente e altrimenti ripiega su
  `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` o `MINIMAX_API_KEY`.
  Il polling dell'utilizzo deriva l'host del Coding Plan da `models.providers.minimax-portal.baseUrl`
  o `models.providers.minimax.baseUrl` quando configurati, e altrimenti usa l'host
  MiniMax CN.
  I campi grezzi `usage_percent` / `usagePercent` di MiniMax indicano la quota
  **rimanente**, quindi OpenClaw li inverte prima della visualizzazione; i campi basati su conteggi hanno priorità quando
  presenti.
  - Le etichette della finestra del coding-plan provengono dai campi ore/minuti del provider quando
    presenti, poi ripiegano sull'intervallo `start_time` / `end_time`.
  - Se l'endpoint del coding-plan restituisce `model_remains`, OpenClaw preferisce la
    voce del modello chat, deriva l'etichetta della finestra dai timestamp quando i campi espliciti
    `window_hours` / `window_minutes` sono assenti, e include il nome del modello
    nell'etichetta del piano.
- **Xiaomi MiMo**: chiave API tramite env/config/auth store (`XIAOMI_API_KEY`).
- **z.ai**: chiave API tramite env/config/auth store.

L'utilizzo è nascosto quando non è possibile risolvere alcuna autenticazione utilizzabile per l'utilizzo del provider. I provider
possono fornire logica di autenticazione dell'utilizzo specifica del Plugin; altrimenti OpenClaw ripiega su
credenziali OAuth/chiave API corrispondenti da profili di autenticazione, variabili d'ambiente
o configurazione.

## Correlati

- [Uso dei token e costi](/it/reference/token-use)
- [Utilizzo e costi API](/it/reference/api-usage-costs)
- [Caching dei prompt](/it/reference/prompt-caching)
