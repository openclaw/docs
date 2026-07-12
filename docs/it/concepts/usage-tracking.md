---
read_when:
    - Stai collegando le interfacce di utilizzo/quota del provider
    - Devi spiegare il comportamento del monitoraggio dell'utilizzo o i requisiti di autenticazione
summary: Superfici di monitoraggio dell’utilizzo e requisiti delle credenziali
title: Monitoraggio dell'utilizzo
x-i18n:
    generated_at: "2026-07-12T07:01:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c413dcbe838d94c57ba3f6ef9609331e139de6d0abbdb3860753a519bd490314
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Che cos'è

- Recupera l'utilizzo e le quote del provider direttamente dall'endpoint di utilizzo di ciascun provider. Nessuna stima della fatturazione del provider; solo nomi dei piani, finestre delle quote, saldi, spesa, budget, cronologia dei costi giornalieri, attribuzione di token/modelli o riepiloghi dello stato dell'account comunicati dal provider.
- L'output leggibile delle finestre delle quote viene normalizzato nel formato `X% rimanente`, anche quando un provider comunica la quota consumata, la quota rimanente o soltanto conteggi grezzi. I provider privi di finestre delle quote reimpostabili mostrano invece un testo riepilogativo del provider, ad esempio un saldo.
- Il comando `/status` a livello di sessione e lo strumento `session_status` usano come ripiego il registro della trascrizione della sessione quando nell'istantanea della sessione attiva mancano i dati sui token o sul modello. Questo ripiego completa i contatori mancanti di token e cache, può recuperare l'etichetta del modello di runtime attivo e preferisce il totale maggiore relativo al prompt quando i metadati della sessione sono mancanti o inferiori (`totalTokensFresh !== true`, zero o sotto il valore ricavato dalla trascrizione). I valori attivi diversi da zero hanno sempre la precedenza sul ripiego.

## Dove compare

- `/status` nelle chat: scheda di stato con i token della sessione e il costo stimato (solo per i modelli con chiave API). Quando disponibile, mostra l'utilizzo del provider per il **provider del modello corrente**, come finestra normalizzata `X% rimanente` o testo riepilogativo del provider.
- `/usage off|tokens|full` nelle chat: piè di pagina con l'utilizzo per ogni risposta.
- `/usage cost` nelle chat: riepilogo locale dei costi aggregato dai registri delle sessioni di OpenClaw.
- CLI: `openclaw status --usage` stampa una suddivisione completa dell'utilizzo e delle quote per provider.
- CLI: `openclaw models status` elenca i profili di autenticazione OAuth/token e mostra un riepilogo delle finestre di utilizzo accanto a ogni provider che ne dispone.
- Interfaccia di controllo: **Utilizzo** mostra le schede relative al piano e alla fatturazione del provider sopra l'analisi dei token e dei costi stimati derivata dalle sessioni di OpenClaw. Le credenziali API amministrative di Anthropic e OpenAI aggiungono la spesa comunicata dal provider per oggi, 7 giorni e 30 giorni, le tendenze giornaliere, i totali dei token, i modelli principali e le categorie di costo.
- Interfaccia di controllo: il popover dell'anello di contesto nell'editor della chat mostra l'**utilizzo del piano** per i provider in abbonamento: barre per ciascuna finestra (5 ore, settimanale, limitata al modello) con gli orari di reimpostazione, il piano del provider quando noto, ad esempio `Max (20x)`, e i crediti per l'utilizzo aggiuntivo. Le sessioni fatturate tramite un piano nascondono le stime in dollari per token; le sessioni fatturate tramite API mantengono `Costo stimato` e la suddivisione dei costi per tipo. Le configurazioni della CLI di Claude Code (`claude-cli`) riutilizzano lo stesso utilizzo dell'abbonamento Anthropic.
- Barra dei menu di macOS: quando sono disponibili istantanee dell'utilizzo del provider, sotto Contesto compare una sezione principale "Utilizzo". Consulta [Barra dei menu](/it/platforms/mac/menu-bar).

`openclaw channels list` non stampa più l'utilizzo del provider; indirizza invece gli utenti a `openclaw status` o `openclaw models list`.

## Cronologia dei costi di Anthropic e OpenAI

La quota dell'abbonamento e la fatturazione API sono superfici distinte del provider:

- Le credenziali di abbonamento/configurazione di Anthropic continuano a mostrare le finestre delle quote di Claude e i budget facoltativi per l'utilizzo aggiuntivo. Imposta `ANTHROPIC_ADMIN_KEY` o `ANTHROPIC_ADMIN_API_KEY` per mostrare invece la cronologia delle API di utilizzo e costo dell'organizzazione. Una credenziale del provider Anthropic che inizia con `sk-ant-admin` viene rilevata automaticamente.
- OAuth di OpenAI ChatGPT/Codex continua a mostrare il piano, le finestre delle quote e il saldo dei crediti. Imposta `OPENAI_ADMIN_KEY` per mostrare invece la cronologia dei costi e dell'utilizzo dei completamenti dell'organizzazione; facoltativamente, imposta `OPENAI_PROJECT_ID` per limitarla a un singolo progetto. OpenClaw non invia mai alle API dell'organizzazione le credenziali di inferenza provenienti da `OPENAI_API_KEY`, dalla configurazione del provider o dai profili di autenticazione, perché tali chiavi potrebbero appartenere a endpoint personalizzati.

Le credenziali amministrative hanno la precedenza perché forniscono la fatturazione effettiva dell'organizzazione. OpenClaw non combina questi totali comunicati dal provider con le proprie stime locali delle sessioni; le due sezioni rispondono intenzionalmente a domande diverse.

## Modalità predefinita del piè di pagina dell'utilizzo

`/usage off|tokens|full` imposta il piè di pagina per una sessione e la scelta viene memorizzata per tale
sessione. `messages.responseUsage` definisce inizialmente questa modalità per le sessioni che non ne hanno
scelta una, in modo che il piè di pagina possa essere attivo per impostazione predefinita senza digitare `/usage` ogni volta.

Imposta una modalità per ogni canale oppure una mappa per canale con `default` come ripiego:

```jsonc
{
  "messages": {
    "responseUsage": "tokens",
    // oppure: { "default": "off", "discord": "full" }
  },
}
```

Valori accettati: `"off"`, `"tokens"`, `"full"` e l'alias precedente `"on"` (trattato come `"tokens"`).

### Tre stati distinti della sessione

Il campo `responseUsage` di una sessione può rappresentare tre stati, ciascuno con
una semantica diversa:

| Stato                         | Valore memorizzato              | Modalità effettiva                                                                        |
| ----------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------- |
| **Non impostato / ereditato** | `undefined` (assente)            | Usa il valore predefinito di configurazione `messages.responseUsage`, quindi `off`.       |
| **Disattivazione esplicita**  | `"off"` (memorizzato)            | Sempre disattivato; un valore predefinito diverso da off non può riattivare il piè di pagina. |
| **Attivazione esplicita**     | `"tokens"` o `"full"` (memorizzato) | Tale modalità, indipendentemente dal valore predefinito di configurazione.                 |

### Precedenza

Modalità effettiva = sostituzione della sessione → voce di configurazione del canale → `default` → `off`.

Un comando esplicito `/usage off` viene **mantenuto** nella sessione come valore letterale `"off"` e
non equivale a "non impostato". Un valore predefinito `messages.responseUsage` diverso da `off`
non può riattivare il piè di pagina dopo che l'utente lo ha disabilitato esplicitamente.

### Reimpostazione e disattivazione

- `/usage off` disattiva forzatamente il piè di pagina e mantiene questa scelta. Un valore predefinito
  configurato diverso da `off` non può sostituirla.
- `/usage reset` (alias: `default`, `inherit`, `inherited`, `clear`, `unpin`) cancella la sostituzione della
  sessione. La sessione **eredita** quindi il valore predefinito effettivo della configurazione
  (`messages.responseUsage`). Se non è configurato alcun valore predefinito, il piè di pagina resta disattivato.
- Una reimpostazione completa della sessione (`/reset` o `/new`) o il passaggio a una nuova sessione **mantiene**
  la preferenza esplicita della modalità di utilizzo, affinché la scelta di visualizzazione dell'utente sopravviva
  ai passaggi di sessione. Solo `/usage reset` (e i relativi alias) cancella la sostituzione.

### Comportamento ciclico

`/usage` senza argomenti alterna ciclicamente: off → tokens → full → off. Il punto iniziale
del ciclo è la modalità corrente **effettiva** (la sostituzione della sessione, oppure
il valore predefinito della configurazione quando non è impostata), quindi il ciclo corrisponde sempre a ciò che
l'utente vede attualmente nel piè di pagina.

### Configurazione

Senza configurazione, viene mantenuto il comportamento precedente (piè di pagina disattivato finché non si usa `/usage`). Usa
`/usage reset` per cancellare una sostituzione della sessione ed ereditare nuovamente il valore predefinito configurato.

## Piè di pagina personalizzato di `/usage full`

`/usage tokens` visualizza sempre una semplice riga `Utilizzo: X in entrata / Y in uscita` (oltre ai suffissi relativi alla cache e
al costo stimato, quando disponibili). Solo `/usage full` visualizza il piè di pagina più dettagliato
descritto di seguito.

`/usage full` mostra un piè di pagina compatto integrato con modello, ragionamento, modalità veloce/lenta,
finestra di contesto e costo, quando questi campi sono disponibili. Per il piè di pagina integrato non è
necessario alcun file di modello.

`messages.usageTemplate` è destinato esclusivamente ai layout personalizzati avanzati. Il valore è un
percorso di file JSON (supporta `~`) o un oggetto inline e, quando è valido, sostituisce il piè di pagina
integrato. Un percorso di file viene monitorato e ricaricato in tempo reale quando cambia.

```json
{
  "messages": {
    "usageTemplate": "~/.openclaw/usage-footer.json"
  }
}
```

I modelli mancanti o vuoti usano automaticamente il piè di pagina integrato senza avvisi. Anche i
modelli configurati illeggibili o non validi (JSON errato o struttura priva di elementi visualizzabili)
usano il piè di pagina integrato ed emettono un avviso per l'operatore.

Crea i modelli personalizzati partendo dalla struttura integrata, quindi modifica le parti che desideri
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
      { "text": "{model.provider}{identity.emoji|🤖}{model.display_name|alias:models}" },
      { "map": "model.is_fallback", "cases": { "true": "🔄" } },
      { "map": "model.is_override", "cases": { "true": "📌" } },
      { "when": "model.reasoning", "text": "{model.reasoning|alias:reasoning}" },
      { "map": "state.fast_mode", "cases": { "true": "⚡️", "false": "🐌" } },
      {
        "when": "context.max_tokens",
        "text": " | 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
      },
      { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
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
          "text": " | 📚[{context.pct_used|meter:5:braille}]{context.max_tokens|num}",
        },
        { "when": "cost.turn_usd", "text": " 💰{cost.turn_usd|fixed:4}" },
      ],
    },
  },
}
```

### Struttura

```jsonc
{
  "schema": "openclaw.usageBar.v1",
  "scales": { "<name>": "low-to-high glyphs" }, // string (1 glyph/char) or array
  "aliases": { "<table>": { "<value>": "<label>" } },
  "output": {
    "sep": "", // joins surviving pieces
    "default": [/* pieces */], // fallback for any surface
    "surfaces": {
      "discord": [/* pieces */],
      "telegram": [/* pieces */],
    },
  },
}
```

Ogni superficie è un elenco ordinato di **elementi**; il motore visualizza ciascun elemento, elimina
quelli vuoti e unisce quelli rimanenti con `sep`. Una superficie senza una voce usa
`output.default`.

### Percorsi del contratto

Un elemento legge i valori dal contratto di ogni turno tramite un percorso con punti. I valori assenti sono
vuoti, così una condizione `when` o un `|fallback` mantiene pulito l'elemento.

| Percorso                                                                            | Significato                                                                                                  |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `surface`                                                                           | ID del canale (`discord`/`telegram`/ecc.)                                                                    |
| `agentId` / `chat_type`                                                             | ID dell'agente proprietario / tipo di superficie della chat                                                  |
| `model.id` / `model.display_name` / `model.provider`                                | ID del modello / nome visualizzato / ID del provider                                                         |
| `model.actual`, `model.resolved_ref`                                                | riferimento provider/modello effettivamente usato per il turno                                               |
| `model.requested`                                                                   | riferimento provider/modello richiesto (prima del fallback)                                                  |
| `model.reasoning`                                                                   | livello di elaborazione (da `off` a `xhigh`)                                                                 |
| `model.is_fallback` / `model.is_override`                                           | booleano: fallback usato / modello fissato                                                                   |
| `model.override_source` / `model.auth_mode`                                         | etichetta dell'origine dell'override / modalità delle credenziali (`oauth`, `api-key`, `token`, `mixed`, `aws-sdk`, `unknown`) |
| `state.fast_mode`                                                                   | booleano: veloce o lento                                                                                     |
| `state.compactions`                                                                 | numero di Compaction per la sessione                                                                         |
| `context.max_tokens` / `context.used_tokens` / `context.pct_used`                   | capacità della finestra / token occupati / percentuale usata da 0 a 100                                      |
| `usage.input_tokens` / `usage.output_tokens` / `usage.total_tokens`                 | aggregato del turno                                                                                          |
| `usage.cache_read_tokens` / `usage.cache_write_tokens`                              | token letti dalla cache e scritti nella cache per il turno                                                   |
| `usage.has_tokens` / `usage.has_split_tokens` / `usage.has_total_only_tokens`       | condizioni di visualizzazione dei token                                                                      |
| `usage.cache_hit_pct`                                                               | quota di letture dalla cache sul totale dei token del prompt                                                 |
| `usage.last.input_tokens` / `usage.last.output_tokens` / `usage.last.cache_hit_pct` | solo chiamata finale al modello (include anche `cache_read_tokens`, `cache_write_tokens`, `total_tokens`)     |
| `cost.turn_usd` / `cost.available`                                                  | costo stimato del turno / disponibilità di una tabella dei costi                                             |
| `timing.duration_ms`                                                                | durata effettiva del turno                                                                                   |
| `identity.name` / `identity.emoji` / `identity.avatar`                              | nome dell'identità dell'agente / emoji / avatar                                                              |
| `session.id`                                                                        | ID della sessione                                                                                            |

(Le finestre dei limiti di frequenza del provider **non** fanno parte di questo contratto; attualmente non esistono percorsi con valori di tipo array, quindi un elemento `each` non ha nulla su cui iterare.)

### Verbi

Applica i verbi a un valore da sinistra a destra tramite pipe; un segmento che non è un verbo costituisce il fallback.

| Verbo           | Effetto                                      | Esempio                           |
| --------------- | -------------------------------------------- | --------------------------------- |
| `num`           | conteggio compatto                           | `272000 -> 272k`                  |
| `fixed:N`       | N cifre decimali (valore predefinito: 2)     | `0.0377`                          |
| `dur`           | da secondi a durata                          | `14820 -> 4h07m`                  |
| `pct`           | aggiunge `%`                                 | `96 -> 96%`                       |
| `inv`           | `100 - x`                                    | da percentuale usata a rimanente  |
| `alias:TABLE`   | ricerca in `aliases`, restituisce il valore se non elencato | `medium -> 🌗`          |
| `meter:W:SCALE` | barra di glifi di W celle per un valore da 0 a 100 | `[⣿⣿⠐⠐⠐]` (`meter:1` = un glifo) |

### Formati degli elementi

- `{ "text": "📚 {context.max_tokens|num}" }`: valore letterale + interpolazione.
- `{ "when": "<path>", "text": "..." }`: viene visualizzato solo se il percorso ha un valore vero.
- `{ "map": "<path>", "cases": { "true": "⚡", "false": "🐌" } }`: converte il valore in un glifo (un caso `_default` gestisce i valori senza corrispondenza).
- `{ "each": "<array-path>", "item": "{label}" }`: itera su un percorso con valore di tipo array (nessun percorso del contratto attuale è un array).

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

produce, ad esempio, `claude-sonnet-4-6 🌗 🐌 | 📚 [⣿⣿⣿⣿⣧]272k`.

## Provider e credenziali

L'utilizzo viene nascosto quando non è possibile risolvere credenziali utilizzabili per l'accesso ai dati di utilizzo del provider. OpenClaw
rileva automaticamente i Plugin dei provider abilitati che dichiarano
`contracts.usageProviders` e implementano sia `resolveUsageAuth` sia
`fetchUsageSnapshot`; non esiste un elenco separato di provider consentiti nel core. Il contratto
statico limita l'ambito del rilevamento senza importare tutti i Plugin dei provider. Ogni
Plugin gestisce il proprio endpoint upstream e la relativa mappatura della risposta. L'istantanea
condivisa mantiene nomi dei piani, finestre delle quote, saldi, spese e budget
indipendenti dal provider per i componenti che utilizzano CLI, app e interfaccia di controllo.

- **Anthropic (Claude)**: token OAuth nei profili di autenticazione. Se il token OAuth non include
  l'ambito `user:profile`, viene usata come fallback una sessione web di `claude.ai` (`CLAUDE_AI_SESSION_KEY`,
  `CLAUDE_WEB_SESSION_KEY` o un cookie `sessionKey=` in `CLAUDE_WEB_COOKIE`), se configurata.
  Quando Anthropic li comunica, vengono inclusi i limiti specifici del modello e le spese/i budget
  mensili per l'utilizzo aggiuntivo abilitato. Una chiave esplicita dell'API di amministrazione Anthropic,
  oppure un profilo provider `sk-ant-admin...` rilevato automaticamente, mostra invece il costo
  dell'organizzazione degli ultimi 30 giorni e la cronologia dell'API Messages.
- **ClawRouter**: chiave API (`CLAWROUTER_API_KEY`). Mostra una finestra di budget mensile
  e un budget tipizzato in USD, se configurato; altrimenti mostra la spesa aggregata e un
  riepilogo di richieste, token e costi.
- **DeepSeek**: chiave API tramite ambiente/configurazione/archivio di autenticazione (`DEEPSEEK_API_KEY`).
  Mostra il saldo di ogni valuta comunicata dal provider.
- **GitHub Copilot**: token OAuth nei profili di autenticazione.
- **Gemini CLI**: token OAuth nei profili di autenticazione.
- **MiniMax**: chiave API o profilo di autenticazione OAuth MiniMax. OpenClaw considera
  `minimax`, `minimax-cn` e `minimax-portal` come un'unica superficie delle quote MiniMax,
  preferisce le credenziali OAuth MiniMax archiviate, se presenti, e altrimenti usa come fallback
  `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` o `MINIMAX_API_KEY`.
  Il polling dell'utilizzo ricava l'host del Coding Plan da `models.providers.minimax-portal.baseUrl`
  o `models.providers.minimax.baseUrl`, se configurato; altrimenti usa
  l'host MiniMax CN.
  I campi non elaborati `usage_percent` / `usagePercent` di MiniMax indicano la quota
  **rimanente**, quindi OpenClaw li inverte prima della visualizzazione; quando presenti,
  hanno la precedenza i campi basati sul conteggio.
  - Le etichette delle finestre derivano dai campi di ore/minuti del provider, quando presenti, quindi
    usano come fallback l'intervallo tra `start_time` e `end_time`.
  - Se l'endpoint del piano di programmazione restituisce `model_remains`, OpenClaw preferisce la
    voce del modello di chat, ricava l'etichetta della finestra dai timestamp quando i campi espliciti
    `window_hours` / `window_minutes` sono assenti e include il nome del modello
    nell'etichetta del piano.
- **OpenAI (piano Codex/ChatGPT)**: token OAuth nei profili di autenticazione (l'header
  `ChatGPT-Account-Id` viene inviato quando è presente un ID account). Mostra il piano ChatGPT,
  le finestre Codex reimpostabili e, quando comunicato, un saldo di crediti. I crediti rimangono
  crediti del provider; OpenClaw non li etichetta come dollari. `OPENAI_ADMIN_KEY` aggiunge
  il costo dell'organizzazione degli ultimi 30 giorni e la cronologia dell'utilizzo delle richieste di completamento,
  quando la chiave dispone dell'accesso a Usage Dashboard. Le credenziali di inferenza non vengono mai inoltrate alle API dell'organizzazione.
- **OpenRouter**: chiave API o chiave API supportata da OAuth (`OPENROUTER_API_KEY` o un profilo
  di autenticazione). Combina l'endpoint dei crediti dell'account con l'endpoint della quota della chiave,
  così saldo e spesa dell'account, budget della chiave e utilizzo giornaliero/settimanale/mensile vengono
  mostrati quando la credenziale consente di accedervi. Ciascun endpoint può arricchire l'istantanea
  in modo indipendente.
- **Venice**: chiave API tramite ambiente/configurazione/archivio di autenticazione (`VENICE_API_KEY`). Mostra i saldi
  in USD e DIEM, oltre all'utilizzo dell'allocazione DIEM per epoca, quando comunicato.
- **Xiaomi MiMo**: due superfici di utilizzo separate. Il pagamento in base al consumo usa una chiave API
  (`XIAOMI_API_KEY`); il Token Plan usa una chiave distinta (`XIAOMI_TOKEN_PLAN_API_KEY`).
  Attualmente nessuno dei due comunica finestre delle quote.
- **z.ai**: chiave API tramite ambiente/configurazione/archivio di autenticazione (`ZAI_API_KEY` o `Z_AI_API_KEY`).

## Contenuti correlati

- [Utilizzo e costi dei token](/it/reference/token-use)
- [Utilizzo e costi delle API](/it/reference/api-usage-costs)
- [Memorizzazione nella cache dei prompt](/it/reference/prompt-caching)
- [Barra dei menu](/it/platforms/mac/menu-bar)
