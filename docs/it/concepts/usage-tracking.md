---
read_when:
    - Stai collegando le superfici di utilizzo/quota del provider
    - Devi spiegare il comportamento del monitoraggio dell'utilizzo o i requisiti di autenticazione
summary: Superfici di monitoraggio dell'utilizzo e requisiti delle credenziali
title: Monitoraggio dell'utilizzo
x-i18n:
    generated_at: "2026-07-01T18:14:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa9b2b0b19ca0b4beeea40bfd50b07a92155178d5ec0e1877013843e0caba4fb
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Che cos'è

- Recupera l'utilizzo/la quota dei provider direttamente dai loro endpoint di utilizzo.
- Nessun costo stimato; solo finestre di quota riportate dal provider o riepiloghi dello stato dell'account.
- L'output di stato della finestra di quota leggibile dalle persone è normalizzato in `X% left`, anche quando un'API upstream segnala quota consumata, quota rimanente o solo conteggi grezzi. I provider senza finestre di quota reimpostabili possono invece mostrare testo riepilogativo del provider, ad esempio un saldo.
- `/status` a livello di sessione e `session_status` possono ripiegare sull'ultima voce di utilizzo della trascrizione quando lo snapshot della sessione live è scarso. Questo fallback completa i contatori mancanti di token/cache, può recuperare l'etichetta del modello runtime attivo e preferisce il totale più grande orientato al prompt quando i metadati di sessione sono mancanti o inferiori. I valori live esistenti diversi da zero hanno comunque la precedenza.

## Dove compare

- `/status` nelle chat: scheda di stato ricca di emoji con token di sessione + costo stimato (solo chiave API). L'utilizzo del provider viene mostrato per il **provider del modello corrente** quando disponibile, come finestra `X% left` normalizzata o testo riepilogativo del provider.
- `/usage off|tokens|full` nelle chat: piè di pagina di utilizzo per risposta.
- `/usage cost` nelle chat: riepilogo dei costi locali aggregato dai log di sessione OpenClaw.
- CLI: `openclaw status --usage` stampa una ripartizione completa per provider.
- CLI: `openclaw channels list` stampa lo stesso snapshot di utilizzo insieme alla configurazione del provider (usa `--no-usage` per saltarlo).
- Barra dei menu macOS: sezione "Utilizzo" sotto Context (solo se disponibile).

## Modalità predefinita del piè di pagina di utilizzo

`/usage off|tokens|full` imposta il piè di pagina per una sessione e viene ricordato per quella sessione. `messages.responseUsage` inizializza quella modalità per le sessioni che non ne hanno scelta una, così il piè di pagina può essere attivo per impostazione predefinita senza digitare `/usage` ogni volta.

Imposta una modalità per ogni canale, oppure una mappa per canale con un fallback `default`:

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // or: { "default": "off", "discord": "full" }
  },
}
```

### Tre stati di sessione distinti

Il campo `responseUsage` di una sessione ha tre stati rappresentabili, ciascuno con semantiche diverse:

| Stato                    | Valore salvato                  | Modalità effettiva                                                        |
| ------------------------ | ------------------------------- | ------------------------------------------------------------------------- |
| **Non impostato / eredita** | `undefined` (assente)          | Ricade sul valore predefinito di configurazione `messages.responseUsage`, poi `off`. |
| **Disattivato esplicito** | `"off"` (salvato)              | Sempre disattivato: un valore predefinito di configurazione diverso da off non può riabilitare il piè di pagina. |
| **Attivato esplicito**   | `"tokens"` o `"full"` (salvato) | Quella modalità, indipendentemente dal valore predefinito di configurazione. |

### Precedenza

Modalità effettiva = override di sessione → voce di configurazione del canale → `default` → `off`.

Un `/usage off` esplicito viene **persistito** come valore letterale `"off"` nella sessione, non è equivalente a "non impostato". Questo significa che un valore predefinito `messages.responseUsage` diverso da off non può riattivare il piè di pagina dopo che l'utente lo ha disabilitato esplicitamente.

### Reimpostare vs disattivare

- `/usage off` — forza la disattivazione del piè di pagina e persiste quella scelta. Un valore predefinito configurato diverso da off non può sovrascriverla.
- `/usage reset` (alias: `inherit`, `clear`, `default`) — cancella l'override di sessione. La sessione quindi **eredita** il valore predefinito effettivo della configurazione (`messages.responseUsage`). Se non è configurato alcun valore predefinito, il piè di pagina è disattivato (invariato rispetto a prima). Usalo per "tornare al valore predefinito" senza attivare esplicitamente il piè di pagina.
- Un reset completo della sessione (`/reset` o `/new`) o un rollover della sessione **preserva** la preferenza esplicita della modalità di utilizzo, così la scelta di visualizzazione dell'utente sopravvive ai rollover di sessione. Solo `/usage reset` (e i suoi alias) cancella davvero l'override.

### Comportamento di commutazione

`/usage` senza argomenti cicla: off → tokens → full → off. Il punto di partenza del ciclo è la modalità corrente **effettiva** (override di sessione che ricade sul valore predefinito di configurazione quando non impostato), quindi il ciclo è sempre coerente con ciò che l'utente vede nel piè di pagina.

### Configurazione

Senza configurazione, il comportamento precedente rimane valido (piè di pagina disattivato fino a `/usage`). Usa `/usage reset` per cancellare un override di sessione e tornare a ereditare il valore predefinito configurato.

## Piè di pagina `/usage full` personalizzato

`/usage full` mostra un piè di pagina compatto integrato con modello, reasoning, veloce/lento, finestra di contesto e costo quando questi campi sono disponibili. I campi token e cache restano disponibili per i template personalizzati. Non è richiesto alcun file template.

`messages.usageTemplate` è solo per layout personalizzati avanzati. Il valore è un percorso di file JSON (supporta `~`) o un oggetto inline, e sostituisce il piè di pagina integrato quando valido:

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

I template mancanti o vuoti ricadono silenziosamente sul piè di pagina integrato. Anche i template configurati non leggibili o non validi ricadono sul piè di pagina integrato ed emettono un avviso per l'operatore.

Parti dalla forma integrata per i template personalizzati, poi modifica le parti che vuoi cambiare:

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": {
    "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿",
    "block": "░▏▎▍▌▋▊▉█",
    "shade": "░▒▓█",
    "moon": "🌑🌘🌗🌖🌕",
    "level": "▁▂▃▄▅▆▇█",
    "weather": ["🥶", "☁️", "🌥", "⛅️", "🌤", "☀️"],
    "plants": ["🪾", "🍂", "🌱", "☘️", "🍀", "🌿"],
    "moons6": ["🌑", "🌚", "🌘", "🌗", "🌖", "🌝"],
  },
  "aliases": {
    "models": {
      "claude-opus-4-6": "opus46",
      "claude-opus-4-8": "opus48",
      "claude-sonnet-4-6": "sonnet46",
      "claude-haiku-4-5": "haiku45",
      "gpt-5.5": "gpt5.5",
    },
    "reasoning": {
      "off": "🌑",
      "minimal": "🌚",
      "low": "🌘",
      "medium": "🌗",
      "high": "🌕",
      "xhigh": "🌝",
    },
  },
  "output": {
    "sep": "",
    "default": [
      { "text": "{model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
      { "map": "model.is_fallback", "cases": { "true": "🔄" } },
      { "map": "model.is_override", "cases": { "true": "📌" } },
      { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
      { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
      {
        "when": "context.max_tokens",
        "text": "\u00A0| 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      { "when": "cost.turn_usd", "text": "\u00A0💰{cost.turn_usd|fixed:4}" },
    ],
    "surfaces": {
      "discord": [
        { "text": "-# -\n" },
        { "text": "-# {model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
        { "map": "model.is_fallback", "cases": { "true": "🔄" } },
        { "map": "model.is_override", "cases": { "true": "📌" } },
        { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
        {
          "when": "context.max_tokens",
          "text": "\u00A0| 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        { "when": "cost.turn_usd", "text": "\u00A0💰{cost.turn_usd|fixed:4}" },
      ],
    },
  },
}
```

### Forma

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "<name>": "low-to-high glyphs" }, // string (1 glyph/char) or array
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // joins surviving pieces
    "default": [
      /* pieces */
    ], // fallback for any surface
    "surfaces": {
      "discord": [
        /* pieces */
      ],
      "telegram": [
        /* pieces */
      ],
    },
  },
}
```

Ogni superficie è un elenco ordinato di **pezzi**; il motore renderizza ciascuno, elimina quelli vuoti e unisce i rimanenti con `sep`. Una superficie senza voce usa `output.default`.

### Percorsi del contratto

Un pezzo legge i valori dal contratto per turno tramite dot-path. I valori assenti sono vuoti (quindi una guardia `when` o un `|fallback` mantiene pulito il pezzo).

| Percorso                                                                            | Significato                            |
| ----------------------------------------------------------------------------------- | -------------------------------------- |
| `surface`                                                                           | id canale (`discord`/`telegram`/ecc.)  |
| `model.provider` / `model.display_name`                                             | id provider / id modello               |
| `model.reasoning`                                                                   | effort (da `off` a `xhigh`)            |
| `model.is_fallback` / `model.is_override`                                           | bool: fallback usato / modello fissato |
| `state.fast_mode`                                                                   | bool: veloce vs lento                  |
| `context.max_tokens` / `context.pct_used`                                           | budget finestra / 0-100 usato          |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | aggregato del turno                    |
| `usage.has_split_tokens` / `usage.has_total_only_tokens` / `usage.cache_hit_pct`    | guardie di visualizzazione token e percentuale cache |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | solo chiamata finale al modello        |
| `cost.turn_usd`                                                                     | costo stimato del turno                |
| `identity.name` / `identity.emoji`                                                  | nome agente / emoji scelta             |

(Le finestre di rate limit del provider **non** fanno parte di questo contratto.)

### Verbi

Passa un valore attraverso i verbi da sinistra a destra; un segmento che non è un verbo è il fallback.

| Verbo           | Effetto                               | Esempio                           |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | conteggio compatto                    | `272000 -> 272k`                  |
| `fixed:N`       | N decimali (predefinito 2)            | `0.0377`                          |
| `dur`           | secondi in durata                     | `14820 -> 4h07m`                  |
| `pct`           | aggiunge `%`                          | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | da usato a rimanente              |
| `alias:TABLE`   | lookup in `aliases`, eco se non elencato | `medium -> 🌗`                 |
| `meter:W:SCALE` | barra a glifi di W celle su un valore 0-100 | `[⣿⣿⠐⠐⠐]` (`meter:1` = un glifo) |

### Forme dei pezzi

- `{ "text": "📚 {context.max_tokens|num}" }`: letterale + interpolazione.
- `{ "when": "<path>", "text": "..." }`: renderizza solo se il percorso è truthy.
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: valore in glifo.
- `{ "each": "limits.windows", "item": "{label}" }`: itera un array.

### Esempio

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "braille": "⠐⡀⡄⡆⡇⣇⣧⣷⣿" },
  "aliases": { "reasoning": { "medium": "🌗", "high": "🌕" } },
  "output": {
    "surfaces": {
      "discord": [
        { "text": "{model.display_name}" },
        { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": " ⚡", "false": " 🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
      ],
    },
  },
}
```

renderizza ad es. `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`.

## Provider + credenziali

- **Anthropic (Claude)**: token OAuth nei profili di autenticazione.
- **GitHub Copilot**: token OAuth nei profili di autenticazione.
- **Gemini CLI**: token OAuth nei profili di autenticazione.
  - L'utilizzo JSON ripiega su `stats`; `stats.cached` viene normalizzato in
    `cacheRead`.
- **OpenAI Codex**: token OAuth nei profili di autenticazione (accountId usato quando presente).
- **MiniMax**: chiave API o profilo di autenticazione OAuth MiniMax. OpenClaw tratta
  `minimax`, `minimax-cn` e `minimax-portal` come la stessa superficie di quota
  MiniMax, preferisce l'OAuth MiniMax memorizzato quando presente e altrimenti ripiega
  su `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` o `MINIMAX_API_KEY`.
  Il polling dell'utilizzo deriva l'host del Coding Plan da `models.providers.minimax-portal.baseUrl`
  o `models.providers.minimax.baseUrl` quando configurato, e altrimenti usa l'host
  MiniMax CN.
  I campi grezzi `usage_percent` / `usagePercent` di MiniMax indicano la quota
  **rimanente**, quindi OpenClaw li inverte prima della visualizzazione; i campi basati sul conteggio hanno la precedenza quando
  presenti.
  - Le etichette della finestra del piano di coding provengono dai campi ore/minuti del provider quando
    presenti, poi ripiegano sull'intervallo `start_time` / `end_time`.
  - Se l'endpoint del piano di coding restituisce `model_remains`, OpenClaw preferisce la
    voce del modello chat, deriva l'etichetta della finestra dai timestamp quando i campi espliciti
    `window_hours` / `window_minutes` sono assenti e include il nome del modello
    nell'etichetta del piano.
- **Xiaomi MiMo**: chiave API tramite env/config/store di autenticazione (`XIAOMI_API_KEY`).
- **z.ai**: chiave API tramite env/config/store di autenticazione.
- **DeepSeek**: chiave API tramite env/config/store di autenticazione (`DEEPSEEK_API_KEY`).
  OpenClaw chiama l'endpoint del saldo di DeepSeek e mostra il saldo riportato dal provider
  come testo invece di una finestra di quota percentuale rimanente.

L'utilizzo viene nascosto quando non è possibile risolvere credenziali utilizzabili per l'utilizzo del provider. I provider
possono fornire logica di autenticazione dell'utilizzo specifica del Plugin; altrimenti OpenClaw ripiega su
credenziali OAuth/chiave API corrispondenti dai profili di autenticazione, dalle variabili d'ambiente
o dalla configurazione.

## Correlati

- [Uso dei token e costi](/it/reference/token-use)
- [Utilizzo API e costi](/it/reference/api-usage-costs)
- [Caching dei prompt](/it/reference/prompt-caching)
