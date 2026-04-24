---
read_when:
    - Stai collegando le superfici di utilizzo/quota del provider
    - Devi spiegare il comportamento del monitoraggio dell'utilizzo o i requisiti di autenticazione
summary: Superfici di monitoraggio dell'utilizzo e requisiti delle credenziali
title: Monitoraggio dell'utilizzo
x-i18n:
    generated_at: "2026-04-24T08:38:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 21c2ae0c32d9f28b301abed22d6edcb423d46831cb1d78f4c2908df0ecf82854
    source_path: concepts/usage-tracking.md
    workflow: 15
---

## Cos'è

- Recupera utilizzo/quota del provider direttamente dagli endpoint di utilizzo.
- Nessun costo stimato; solo le finestre riportate dal provider.
- L'output di stato leggibile è normalizzato in `X% left`, anche quando una
  API upstream riporta quota consumata, quota rimanente o solo conteggi grezzi.
- `/status` e `session_status` a livello di sessione possono ripiegare
  sull'ultima voce di utilizzo della trascrizione quando lo snapshot live della sessione è scarno. Questo
  fallback riempie i contatori mancanti di token/cache, può recuperare l'etichetta
  del modello runtime attivo e preferisce il totale orientato al prompt più grande quando mancano
  i metadati della sessione o sono inferiori. I valori live esistenti e non zero mantengono comunque la priorità.

## Dove compare

- `/status` nelle chat: scheda di stato ricca di emoji con token di sessione + costo stimato (solo chiave API). L'utilizzo del provider viene mostrato per il **provider del modello corrente** quando disponibile come finestra normalizzata `X% left`.
- `/usage off|tokens|full` nelle chat: footer di utilizzo per risposta (OAuth mostra solo i token).
- `/usage cost` nelle chat: riepilogo dei costi locali aggregato dai log di sessione OpenClaw.
- CLI: `openclaw status --usage` stampa una ripartizione completa per provider.
- CLI: `openclaw channels list` stampa lo stesso snapshot di utilizzo accanto alla configurazione del provider (usa `--no-usage` per saltarlo).
- barra dei menu macOS: sezione “Usage” sotto Context (solo se disponibile).

## Provider + credenziali

- **Anthropic (Claude)**: token OAuth nei profili di autenticazione.
- **GitHub Copilot**: token OAuth nei profili di autenticazione.
- **Gemini CLI**: token OAuth nei profili di autenticazione.
  - L'utilizzo JSON ripiega su `stats`; `stats.cached` viene normalizzato in
    `cacheRead`.
- **OpenAI Codex**: token OAuth nei profili di autenticazione (`accountId` usato quando presente).
- **MiniMax**: chiave API o profilo di autenticazione OAuth MiniMax. OpenClaw tratta
  `minimax`, `minimax-cn` e `minimax-portal` come la stessa superficie quota
  MiniMax, preferisce l'OAuth MiniMax memorizzato quando presente e altrimenti ripiega
  su `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` o `MINIMAX_API_KEY`.
  I campi raw `usage_percent` / `usagePercent` di MiniMax indicano quota **rimanente**,
  quindi OpenClaw li inverte prima della visualizzazione; i campi basati su conteggio hanno la priorità quando
  presenti.
  - Le etichette delle finestre del piano coding provengono dai campi ore/minuti del provider quando
    presenti, poi ripiegano sull'intervallo `start_time` / `end_time`.
  - Se l'endpoint del piano coding restituisce `model_remains`, OpenClaw preferisce la
    voce del modello chat, deriva l'etichetta della finestra dai timestamp quando i campi espliciti
    `window_hours` / `window_minutes` sono assenti e include il nome del modello
    nell'etichetta del piano.
- **Xiaomi MiMo**: chiave API tramite env/config/auth store (`XIAOMI_API_KEY`).
- **z.ai**: chiave API tramite env/config/auth store.

L'utilizzo viene nascosto quando non è possibile risolvere alcuna autenticazione di utilizzo del provider utilizzabile. I provider
possono fornire logica di autenticazione d'uso specifica del Plugin; altrimenti OpenClaw ripiega
sull'abbinamento delle credenziali OAuth/chiave API da profili di autenticazione, variabili d'ambiente
o configurazione.

## Correlati

- [Uso dei token e costi](/it/reference/token-use)
- [Utilizzo API e costi](/it/reference/api-usage-costs)
- [Caching del prompt](/it/reference/prompt-caching)
