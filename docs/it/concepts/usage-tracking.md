---
read_when:
    - Stai collegando le superfici di utilizzo/quota del fornitore
    - Devi spiegare il comportamento del monitoraggio dell'utilizzo o i requisiti di autenticazione
summary: Interfacce di monitoraggio dell'utilizzo e requisiti delle credenziali
title: Monitoraggio dell'utilizzo
x-i18n:
    generated_at: "2026-05-02T08:21:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4faa5daff55668a6be73981b730edece51939d99954e784907c99fb101fcaaa7
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Che cos'è

- Estrae utilizzo/quota del provider direttamente dai relativi endpoint di utilizzo.
- Nessun costo stimato; solo le finestre riportate dal provider.
- L'output di stato leggibile è normalizzato in `X% left`, anche quando un'API upstream segnala quota consumata, quota rimanente o solo conteggi grezzi.
- `/status` a livello di sessione e `session_status` possono ripiegare sull'ultima voce di utilizzo della trascrizione quando lo snapshot della sessione live è scarno. Questo fallback completa i contatori mancanti di token/cache, può recuperare l'etichetta del modello runtime attivo e preferisce il totale più grande orientato al prompt quando i metadati della sessione mancano o sono inferiori. I valori live esistenti diversi da zero continuano ad avere la precedenza.

## Dove compare

- `/status` nelle chat: scheda di stato ricca di emoji con token di sessione + costo stimato (solo chiave API). L'utilizzo del provider viene mostrato per il **provider del modello corrente**, quando disponibile, come finestra normalizzata `X% left`.
- `/usage off|tokens|full` nelle chat: piè di pagina di utilizzo per risposta (OAuth mostra solo i token).
- `/usage cost` nelle chat: riepilogo locale dei costi aggregato dai log di sessione OpenClaw.
- CLI: `openclaw status --usage` stampa un dettaglio completo per provider.
- CLI: `openclaw channels list` stampa lo stesso snapshot di utilizzo insieme alla configurazione del provider (usa `--no-usage` per saltarlo).
- Barra dei menu macOS: sezione “Utilizzo” sotto Context (solo se disponibile).

## Provider + credenziali

- **Anthropic (Claude)**: token OAuth nei profili di autenticazione.
- **GitHub Copilot**: token OAuth nei profili di autenticazione.
- **Gemini CLI**: token OAuth nei profili di autenticazione.
  - L'utilizzo JSON ripiega su `stats`; `stats.cached` viene normalizzato in `cacheRead`.
- **OpenAI Codex**: token OAuth nei profili di autenticazione (`accountId` usato quando presente).
- **MiniMax**: chiave API o profilo di autenticazione OAuth MiniMax. OpenClaw tratta `minimax`, `minimax-cn` e `minimax-portal` come la stessa superficie di quota MiniMax, preferisce l'OAuth MiniMax salvato quando presente e altrimenti ripiega su `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` o `MINIMAX_API_KEY`. Il polling dell'utilizzo ricava l'host Coding Plan da `models.providers.minimax-portal.baseUrl` o `models.providers.minimax.baseUrl` quando configurato, e altrimenti usa l'host MiniMax CN. I campi grezzi `usage_percent` / `usagePercent` di MiniMax indicano la quota **rimanente**, quindi OpenClaw li inverte prima della visualizzazione; i campi basati su conteggi hanno la precedenza quando presenti.
  - Le etichette della finestra del coding plan provengono dai campi ore/minuti del provider quando presenti, poi ripiegano sull'intervallo `start_time` / `end_time`.
  - Se l'endpoint del coding plan restituisce `model_remains`, OpenClaw preferisce la voce del modello chat, ricava l'etichetta della finestra dai timestamp quando i campi espliciti `window_hours` / `window_minutes` sono assenti e include il nome del modello nell'etichetta del piano.
- **Xiaomi MiMo**: chiave API tramite env/config/auth store (`XIAOMI_API_KEY`).
- **z.ai**: chiave API tramite env/config/auth store.

L'utilizzo viene nascosto quando non è possibile risolvere credenziali di utilizzo provider utilizzabili. I provider possono fornire logica di autenticazione dell'utilizzo specifica del Plugin; altrimenti OpenClaw ripiega sulle credenziali OAuth/chiave API corrispondenti da profili di autenticazione, variabili d'ambiente o configurazione.

## Correlati

- [Uso dei token e costi](/it/reference/token-use)
- [Utilizzo e costi API](/it/reference/api-usage-costs)
- [Caching dei prompt](/it/reference/prompt-caching)
