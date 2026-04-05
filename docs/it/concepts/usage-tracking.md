---
read_when:
    - Stai collegando le superfici di utilizzo/quota del provider
    - Devi spiegare il comportamento del monitoraggio dell'utilizzo o i requisiti di autenticazione
summary: Superfici di monitoraggio dell'utilizzo e requisiti delle credenziali
title: Monitoraggio dell'utilizzo
x-i18n:
    generated_at: "2026-04-05T13:50:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62164492c61a8d602e3b73879c13ce3e14ce35964b7f2ffd389a4e6a7ec7e9c0
    source_path: concepts/usage-tracking.md
    workflow: 15
---

# Monitoraggio dell'utilizzo

## Che cos'è

- Recupera l'utilizzo/la quota del provider direttamente dai rispettivi endpoint di utilizzo.
- Nessun costo stimato; solo le finestre riportate dal provider.
- L'output di stato leggibile per gli esseri umani viene normalizzato in `X% left`, anche quando
  un'API upstream riporta quota consumata, quota rimanente o solo conteggi grezzi.
- `/status` a livello di sessione e `session_status` possono usare come fallback l'ultima
  voce di utilizzo della trascrizione quando l'istantanea della sessione live è scarsa. Questo
  fallback riempie i contatori mancanti di token/cache, può recuperare l'etichetta del modello
  di runtime attivo e preferisce il totale orientato al prompt più grande quando i metadati della sessione
  mancano o sono inferiori. I valori live esistenti diversi da zero continuano comunque ad avere la precedenza.

## Dove viene mostrato

- `/status` nelle chat: scheda di stato ricca di emoji con token di sessione + costo stimato (solo chiave API). L'utilizzo del provider viene mostrato per il **provider del modello corrente** quando disponibile come finestra normalizzata `X% left`.
- `/usage off|tokens|full` nelle chat: piè di pagina di utilizzo per risposta (OAuth mostra solo i token).
- `/usage cost` nelle chat: riepilogo locale dei costi aggregato dai log di sessione di OpenClaw.
- CLI: `openclaw status --usage` stampa una ripartizione completa per provider.
- CLI: `openclaw channels list` stampa la stessa istantanea di utilizzo accanto alla configurazione del provider (usa `--no-usage` per saltarla).
- barra dei menu macOS: sezione “Usage” sotto Context (solo se disponibile).

## Provider + credenziali

- **Anthropic (Claude)**: token OAuth nei profili auth.
- **GitHub Copilot**: token OAuth nei profili auth.
- **Gemini CLI**: token OAuth nei profili auth.
  - L'utilizzo JSON usa `stats` come fallback; `stats.cached` viene normalizzato in
    `cacheRead`.
- **OpenAI Codex**: token OAuth nei profili auth (`accountId` viene usato quando presente).
- **MiniMax**: chiave API o profilo auth MiniMax OAuth. OpenClaw tratta
  `minimax`, `minimax-cn` e `minimax-portal` come la stessa superficie quota MiniMax,
  preferisce il MiniMax OAuth archiviato quando presente e altrimenti usa come fallback
  `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` o `MINIMAX_API_KEY`.
  I campi grezzi `usage_percent` / `usagePercent` di MiniMax indicano la quota **rimanente**,
  quindi OpenClaw li inverte prima della visualizzazione; i campi basati sul conteggio hanno la precedenza quando
  presenti.
  - Le etichette della finestra del coding plan provengono dai campi ore/minuti del provider quando
    presenti, poi usano come fallback l'intervallo `start_time` / `end_time`.
  - Se l'endpoint del coding plan restituisce `model_remains`, OpenClaw preferisce la
    voce del modello chat, ricava l'etichetta della finestra dai timestamp quando i campi espliciti
    `window_hours` / `window_minutes` sono assenti e include il nome del modello
    nell'etichetta del piano.
- **Xiaomi MiMo**: chiave API tramite env/config/auth store (`XIAOMI_API_KEY`).
- **z.ai**: chiave API tramite env/config/auth store.

L'utilizzo viene nascosto quando non è possibile risolvere un'autenticazione utilizzabile per l'utilizzo del provider. I provider
possono fornire una logica di autenticazione per l'utilizzo specifica del plugin; altrimenti OpenClaw usa come fallback
credenziali OAuth/con chiave API corrispondenti da profili auth, variabili d'ambiente
o configurazione.
