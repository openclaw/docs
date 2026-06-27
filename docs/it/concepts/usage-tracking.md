---
read_when:
    - Stai collegando le superfici di utilizzo/quota dei provider
    - Devi spiegare il comportamento del monitoraggio dell'utilizzo o i requisiti di autenticazione
summary: Superfici di monitoraggio dell'utilizzo e requisiti delle credenziali
title: Monitoraggio dell'utilizzo
x-i18n:
    generated_at: "2026-06-27T17:29:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 953f9671093c26f874b19fc0e6f8aee0ebf3379d4a6698bc8548abf942e37a59
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Che cos’è

- Recupera l’utilizzo/la quota dei fornitori direttamente dai loro endpoint di utilizzo.
- Nessun costo stimato; solo finestre di quota o riepiloghi dello stato
  dell’account riportati dal fornitore.
- L’output leggibile dello stato della finestra di quota viene normalizzato in `X% left`, anche
  quando un’API upstream riporta quota consumata, quota rimanente o solo conteggi
  grezzi. I fornitori senza finestre di quota reimpostabili possono invece mostrare
  testo di riepilogo del fornitore, ad esempio un saldo.
- `/status` e `session_status` a livello di sessione possono ripiegare sull’ultima
  voce di utilizzo della trascrizione quando lo snapshot della sessione live è scarno. Quel
  fallback completa i contatori mancanti di token/cache, può recuperare l’etichetta del modello
  runtime attivo e preferisce il totale più grande orientato al prompt quando i metadati
  della sessione mancano o sono più piccoli. I valori live non nulli esistenti hanno comunque la precedenza.

## Dove viene mostrato

- `/status` nelle chat: scheda di stato ricca di emoji con token di sessione + costo stimato (solo chiave API). L’utilizzo del fornitore viene mostrato per il **fornitore del modello corrente** quando disponibile come finestra normalizzata `X% left` o testo di riepilogo del fornitore.
- `/usage off|tokens|full` nelle chat: piè di pagina di utilizzo per risposta (OAuth mostra solo i token).
- `/usage cost` nelle chat: riepilogo dei costi locali aggregato dai log di sessione OpenClaw.
- CLI: `openclaw status --usage` stampa una ripartizione completa per fornitore.
- CLI: `openclaw channels list` stampa lo stesso snapshot di utilizzo insieme alla configurazione del fornitore (usa `--no-usage` per saltarlo).
- Barra dei menu macOS: sezione "Utilizzo" sotto Contesto (solo se disponibile).

## Modalità predefinita del piè di pagina di utilizzo

`/usage off|tokens|full` imposta il piè di pagina per una sessione e viene ricordato per quella
sessione. `messages.responseUsage` inizializza quella modalità per le sessioni che non ne hanno
scelta una, quindi il piè di pagina può essere attivo per impostazione predefinita senza digitare `/usage` ogni volta.

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

Il campo `responseUsage` di una sessione ha tre stati rappresentabili, ciascuno con
semantiche diverse:

| Stato                   | Valore memorizzato             | Modalità effettiva                                                    |
| ----------------------- | ------------------------------ | --------------------------------------------------------------------- |
| **Non impostato / eredita** | `undefined` (assente)       | Passa al valore predefinito di configurazione `messages.responseUsage`, poi a `off`. |
| **Off esplicito**       | `"off"` (memorizzato)          | Sempre disattivato: un valore predefinito non off non può riattivare il piè di pagina. |
| **On esplicito**        | `"tokens"` o `"full"` (memorizzato) | Quella modalità, indipendentemente dal valore predefinito di configurazione. |

### Precedenza

Modalità effettiva = override della sessione → voce di configurazione del canale → `default` → `off`.

Un `/usage off` esplicito viene **persistito** come valore letterale `"off"` nella
sessione, non equivale a "non impostato". Questo significa che un valore predefinito
`messages.responseUsage` diverso da off non può riattivare il piè di pagina dopo che l’utente lo ha disabilitato esplicitamente.

### Reimpostare vs disattivare

- `/usage off` — forza la disattivazione del piè di pagina e persiste quella scelta. Un valore predefinito
  configurato diverso da off non può sovrascriverla.
- `/usage reset` (alias: `inherit`, `clear`, `default`) — cancella l’override della sessione.
  La sessione quindi **eredita** il valore predefinito effettivo della configurazione
  (`messages.responseUsage`). Se non è configurato alcun valore predefinito, il piè di pagina è disattivato
  (come prima). Usalo per "tornare al valore predefinito" senza attivare esplicitamente
  il piè di pagina.
- Un reset completo della sessione (`/reset` o `/new`) o un rollover della sessione **preserva**
  la preferenza esplicita della modalità di utilizzo, così la scelta di visualizzazione dell’utente sopravvive
  ai rollover di sessione. Solo `/usage reset` (e i suoi alias) cancella effettivamente
  l’override.

### Comportamento del toggle

`/usage` senza argomenti cicla: off → tokens → full → off. Il punto di partenza
del ciclo è la modalità corrente **effettiva** (l’override della sessione che passa
al valore predefinito di configurazione quando non impostato), quindi il ciclo è sempre coerente con ciò
che l’utente vede nel piè di pagina.

### Configurazione

Senza configurazione resta valido il comportamento precedente (piè di pagina disattivato fino a `/usage`). Usa
`/usage reset` per cancellare un override di sessione e tornare a ereditare il valore predefinito configurato.

## Piè di pagina personalizzato di `/usage full`

`/usage full` mostra un piè di pagina compatto integrato con modello, reasoning, veloce/lento,
finestra di contesto, token del turno, cache e costo quando quei campi sono disponibili. Non
è richiesto alcun file template.

`messages.usageTemplate` serve solo per layout personalizzati avanzati. Il valore è un
percorso di file JSON (supporta `~`) o un oggetto inline, e sostituisce il piè di pagina
integrato quando valido:

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

Template mancanti o vuoti ripiegano silenziosamente sul piè di pagina integrato. Anche
template configurati non leggibili o non validi ripiegano sul piè di pagina integrato ed emettono un
avviso per l’operatore.

Parti dalla forma integrata per i template personalizzati, poi modifica le parti che vuoi
cambiare:

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
      { "text": "{model.provider}{identity.emoji|🤖} {model.display_name|alias:models}" },
      { "map": "model.is_fallback", "cases": { "true": " 🔄" } },
      { "map": "model.is_override", "cases": { "true": " 📌" } },
      { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
      { "map": "state.fast_mode", "cases": { "true": " ⚡", "false": " 🐌" } },
      {
        "when": "context.max_tokens",
        "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      {
        "when": "usage.has_split_tokens",
        "text": " ↕️ {usage.input_tokens|num|?}/{usage.output_tokens|num|?}",
      },
      { "when": "usage.has_total_only_tokens", "text": " ↕️ {usage.total_tokens|num}" },
      { "when": "usage.cache_hit_pct", "text": " 🗄 {usage.cache_hit_pct|pct}" },
      { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
    ],
    "surfaces": {
      "discord": [
        { "text": "-# -\n" },
        { "text": "-# {model.provider}{identity.emoji|🤖} {model.display_name|alias:models}" },
        { "map": "model.is_fallback", "cases": { "true": "🔄" } },
        { "map": "model.is_override", "cases": { "true": "📌" } },
        { "when": "model.reasoning", "text": " {model.reasoning|alias:reasoning}" },
        { "map": "state.fast_mode", "cases": { "true": " ⚡️", "false": " 🐌" } },
        {
          "when": "context.max_tokens",
          "text": " | 📚 [{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        {
          "when": "usage.has_split_tokens",
          "text": " ↕️ {usage.input_tokens|num|?}/{usage.output_tokens|num|?}",
        },
        { "when": "usage.has_total_only_tokens", "text": " ↕️ {usage.total_tokens|num}" },
        { "when": "usage.cache_hit_pct", "text": " 🗄 {usage.cache_hit_pct|pct}" },
        { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
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

Ogni superficie è un elenco ordinato di **pezzi**; il motore li renderizza, scarta
quelli vuoti e unisce i superstiti con `sep`. Una superficie senza voce usa
`output.default`.

### Percorsi del contratto

Un pezzo legge i valori dal contratto per turno tramite dot-path. I valori assenti sono
vuoti (quindi una guardia `when` o un `|fallback` mantiene pulito il pezzo).

| Percorso                                                                            | Significato                            |
| ----------------------------------------------------------------------------------- | -------------------------------------- |
| `surface`                                                                           | id canale (`discord`/`telegram`/ecc.)  |
| `model.provider` / `model.display_name`                                             | id fornitore / id modello              |
| `model.reasoning`                                                                   | effort (da `off` a `xhigh`)            |
| `model.is_fallback` / `model.is_override`                                           | bool: fallback usato / modello fissato |
| `state.fast_mode`                                                                   | bool: veloce vs lento                  |
| `context.max_tokens` / `context.pct_used`                                           | budget finestra / 0-100 usato          |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | aggregato del turno                    |
| `usage.has_split_tokens` / `usage.has_total_only_tokens` / `usage.cache_hit_pct`    | guardie di visualizzazione token e percentuale cache |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | solo chiamata finale al modello        |
| `cost.turn_usd`                                                                     | costo stimato del turno                |
| `identity.name` / `identity.emoji`                                                  | nome agente / emoji scelta             |

(Le finestre di rate limit del fornitore **non** fanno parte di questo contratto.)

### Verbi

Canalizza un valore attraverso i verbi da sinistra a destra; un segmento non verbo è il fallback.

| Verbo           | Effetto                               | Esempio                           |
| --------------- | ------------------------------------- | --------------------------------- |
| `num`           | conteggio compatto                    | `272000 -> 272k`                  |
| `fixed:N`       | N decimali (predefinito 2)            | `0.0377`                          |
| `dur`           | secondi in durata                     | `14820 -> 4h07m`                  |
| `pct`           | aggiunge `%`                          | `96 -> 96%`                       |
| `inv`           | `100 - x`                             | da usato a rimanente              |
| `alias:TABLE`   | ricerca in `aliases`, eco se non elencato | `medium -> 🌗`                |
| `meter:W:SCALE` | barra di glifi W celle su un valore 0-100 | `[⣿⣿⠐⠐⠐]` (`meter:1` = un glifo) |

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

genera ad esempio `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`.

## Provider + credenziali

- **Anthropic (Claude)**: token OAuth nei profili di autenticazione.
- **GitHub Copilot**: token OAuth nei profili di autenticazione.
- **Gemini CLI**: token OAuth nei profili di autenticazione.
  - L'uso JSON ripiega su `stats`; `stats.cached` viene normalizzato in
    `cacheRead`.
- **OpenAI Codex**: token OAuth nei profili di autenticazione (`accountId` usato quando presente).
- **MiniMax**: chiave API o profilo di autenticazione OAuth MiniMax. OpenClaw tratta
  `minimax`, `minimax-cn` e `minimax-portal` come la stessa superficie di quota
  MiniMax, preferisce l'OAuth MiniMax salvato quando presente e altrimenti ripiega
  su `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` o `MINIMAX_API_KEY`.
  Il polling dell'uso deriva l'host Coding Plan da `models.providers.minimax-portal.baseUrl`
  o `models.providers.minimax.baseUrl` quando configurati, e altrimenti usa l'host
  MiniMax CN.
  I campi grezzi `usage_percent` / `usagePercent` di MiniMax indicano la quota
  **rimanente**, quindi OpenClaw li inverte prima della visualizzazione; i campi
  basati su conteggio hanno la precedenza quando presenti.
  - Le etichette della finestra Coding Plan provengono dai campi ore/minuti del provider quando
    presenti, quindi ripiegano sull'intervallo `start_time` / `end_time`.
  - Se l'endpoint coding-plan restituisce `model_remains`, OpenClaw preferisce la
    voce del modello chat, deriva l'etichetta della finestra dai timestamp quando i campi espliciti
    `window_hours` / `window_minutes` sono assenti e include il nome del modello
    nell'etichetta del piano.
- **Xiaomi MiMo**: chiave API tramite env/config/archivio di autenticazione (`XIAOMI_API_KEY`).
- **z.ai**: chiave API tramite env/config/archivio di autenticazione.
- **DeepSeek**: chiave API tramite env/config/archivio di autenticazione (`DEEPSEEK_API_KEY`).
  OpenClaw chiama l'endpoint del saldo di DeepSeek e mostra il saldo riportato
  dal provider come testo invece di una finestra di quota percentuale rimanente.

L'uso è nascosto quando non è possibile risolvere alcuna autenticazione di uso provider utilizzabile. I provider
possono fornire una logica di autenticazione dell'uso specifica del Plugin; altrimenti OpenClaw ripiega sulle
credenziali OAuth/chiave API corrispondenti dai profili di autenticazione, dalle variabili d'ambiente
o dalla configurazione.

## Correlati

- [Uso dei token e costi](/it/reference/token-use)
- [Uso e costi API](/it/reference/api-usage-costs)
- [Caching dei prompt](/it/reference/prompt-caching)
