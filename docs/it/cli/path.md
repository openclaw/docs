---
read_when:
    - Vuoi leggere o scrivere un nodo foglia all'interno di un file dell'area di lavoro dal terminale
    - Stai scrivendo script rispetto allo stato dell'area di lavoro e vuoi uno schema di indirizzamento stabile e agnostico rispetto al tipo
    - Stai eseguendo il debug di un percorso `oc://` (convalida la sintassi, verifica a cosa viene risolto)
summary: Riferimento CLI per `openclaw path` (ispeziona e modifica i file dell'area di lavoro tramite lo schema di indirizzamento `oc://`)
title: Percorso
x-i18n:
    generated_at: "2026-05-10T19:29:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0b965b791fa658dd04015bb7b5c8c458f6527092473c61cd701eff24a5770fe
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Accesso shell fornito da Plugin al substrato di indirizzamento `oc://`: uno schema di percorsi con dispatch per tipo per ispezionare e modificare file dell'area di lavoro indirizzabili (markdown, jsonc, jsonl). Chi esegue in self-hosting, gli autori di Plugin e le estensioni per editor lo usano per leggere, trovare o aggiornare una posizione ristretta senza scrivere parser manuali per ogni file.

La CLI rispecchia i verbi pubblici del substrato:

- `resolve` è concreto e a corrispondenza singola.
- `find` è il verbo a corrispondenza multipla per wildcard, unioni, predicati ed espansione posizionale.
- `set` accetta solo percorsi concreti o marcatori di inserimento; i pattern wildcard vengono rifiutati prima della scrittura.

`path` è fornito dal Plugin opzionale incluso `oc-path`. Abilitalo prima del primo utilizzo:

```bash
openclaw plugins enable oc-path
```

## Perché usarlo

Lo stato di OpenClaw è distribuito tra markdown modificato da persone, configurazione JSONC commentata e log JSONL append-only. Script shell, hook e agenti spesso hanno bisogno di un singolo piccolo valore da quei file: una chiave frontmatter, un'impostazione di Plugin, un campo di record di log o un elemento puntato sotto una sezione denominata.

`openclaw path` offre a quei chiamanti un indirizzo stabile invece di un grep, una regex o un parser una tantum per ogni tipo di file. Lo stesso percorso `oc://` può essere validato, risolto, cercato, eseguito in dry-run e scritto dal terminale, rendendo l'automazione mirata più facile da revisionare e più sicura da rieseguire. È particolarmente utile quando vuoi aggiornare una singola foglia preservando il resto dei commenti, le terminazioni di riga e la formattazione circostante del file.

Usalo quando ciò che vuoi ha un indirizzo logico, ma la forma fisica del file varia:

- Un hook vuole leggere un'impostazione da JSONC commentato senza perdere i commenti quando scrive di nuovo il valore.
- Uno script di manutenzione vuole trovare ogni campo evento corrispondente in un log JSONL senza caricare tutto il log in un parser personalizzato.
- Un'estensione per editor vuole saltare a una sezione markdown o a un elemento puntato tramite slug, poi renderizzare la riga esatta a cui ha risolto.
- Un agente vuole eseguire in dry-run una piccola modifica dell'area di lavoro prima di applicarla, con i byte modificati visibili in revisione.

Probabilmente non ti serve `openclaw path` per modifiche ordinarie a file interi, migrazioni di configurazione complesse o scritture specifiche della memoria. Queste dovrebbero usare il comando o il Plugin proprietario. `path` serve per piccole operazioni su file indirizzabili, in cui un comando terminale ripetibile è più chiaro di un altro parser su misura.

## Come viene usato

Leggere un valore da un file di configurazione modificato da persone:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Visualizzare in anteprima una scrittura senza toccare il disco:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Trovare record corrispondenti in un log JSONL append-only:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

Indirizzare un'istruzione in markdown per sezione ed elemento invece che per numero di riga:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Validare un percorso in CI o in uno script preflight prima che lo script legga o scriva:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Questi comandi sono pensati per essere copiati negli script shell. Usa `--json` quando un chiamante ha bisogno di output strutturato e `--human` quando una persona sta ispezionando il risultato.

## Come funziona

`openclaw path` fa quattro cose:

1. Analizza l'indirizzo `oc://` in slot: file, sezione, elemento, campo e sessione opzionale.
2. Sceglie l'adapter del tipo di file dall'estensione di destinazione (`.md`, `.jsonc`, `.jsonl` e alias correlati).
3. Risolve gli slot rispetto all'AST di quel tipo di file: intestazioni/elementi markdown, chiavi oggetto/indici array JSONC o record di riga JSONL.
4. Per `set`, emette byte modificati tramite lo stesso adapter, in modo che le parti intatte del file mantengano commenti, terminazioni di riga e formattazione vicina dove il tipo lo supporta.

`resolve` e `set` richiedono un solo target concreto. `find` è il verbo esplorativo: espande wildcard, unioni, predicati e ordinali nelle corrispondenze concrete che puoi ispezionare prima di sceglierne una da scrivere.

## Sottocomandi

| Sottocomando            | Scopo                                                                        |
| ----------------------- | ---------------------------------------------------------------------------- |
| `resolve <oc-path>`     | Stampa la corrispondenza concreta al percorso (o "non trovato").             |
| `find <pattern>`        | Elenca le corrispondenze per un percorso wildcard / unione / predicato.       |
| `set <oc-path> <value>` | Scrive una foglia o un target di inserimento a un percorso concreto. Supporta `--dry-run`. |
| `validate <oc-path>`    | Solo parsing; stampa la scomposizione strutturale (file / sezione / elemento / campo). |
| `emit <file>`           | Esegue il round-trip di un file tramite `parseXxx` + `emitXxx` (diagnostica di fedeltà dei byte). |

## Flag globali

| Flag            | Scopo                                                                    |
| --------------- | ------------------------------------------------------------------------ |
| `--cwd <dir>`   | Risolve lo slot file rispetto a questa directory (predefinito: `process.cwd()`). |
| `--file <path>` | Sovrascrive il percorso risolto dello slot file (accesso assoluto).      |
| `--json`        | Forza l'output JSON (predefinito quando stdout non è un TTY).            |
| `--human`       | Forza l'output umano (predefinito quando stdout è un TTY).               |
| `--dry-run`     | (solo su `set`) stampa i byte che verrebbero scritti senza scrivere.     |

## Sintassi `oc://`

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Regole degli slot: `field` richiede `item`, e `item` richiede `section`. In tutti e quattro gli slot:

- **Segmenti tra virgolette** — `"a/b.c"` conserva i separatori `/` e `.`.
  Il contenuto è byte-literal; `"` e `\` non sono consentiti dentro le virgolette.
  Anche lo slot file è consapevole delle virgolette: `oc://"skills/email-drafter"/Tools/$last`
  tratta `skills/email-drafter` come un singolo percorso file.
- **Predicati** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`,
  `[k>=v]`. Gli operatori numerici richiedono che entrambi i lati siano convertibili in numeri finiti.
- **Unioni** — `{a,b,c}` corrisponde a una qualsiasi delle alternative.
- **Wildcard** — `*` (singolo sotto-segmento) e `**` (zero o più,
  ricorsivo). `find` le accetta; `resolve` e `set` le rifiutano come ambigue.
- **Posizionale** — `$last` risolve all'ultimo indice / ultima chiave dichiarata.
- **Ordinale** — `#N` per l'ennesima corrispondenza in ordine di documento.
- **Marcatori di inserimento** — `+`, `+key`, `+nnn` per inserimenti con chiave / indicizzati
  (usa con `set`).
- **Ambito sessione** — `?session=cron-daily` ecc. Ortogonale alla nidificazione degli slot.
  I valori di sessione sono raw, non percent-decoded; non possono contenere caratteri di controllo o delimitatori di query riservati (`?`, `&`, `%`).

I caratteri riservati (`?`, `&`, `%`) fuori da segmenti tra virgolette, predicati o unioni vengono rifiutati. I caratteri di controllo (U+0000-U+001F, U+007F) vengono rifiutati ovunque, incluso il valore di query `session`.

`formatOcPath(parseOcPath(path)) === path` è garantito per i percorsi canonici.
I parametri di query non canonici vengono ignorati tranne il primo valore non vuoto `session=`.

## Indirizzamento per tipo di file

| Tipo       | Modello di indirizzamento                                                              |
| ---------- | --------------------------------------------------------------------------------------- |
| Markdown   | Sezioni H2 per slug, elementi puntati per slug o `#N`, frontmatter tramite `[frontmatter]`. |
| JSONC/JSON | Chiavi oggetto e indici array; i punti dividono i sotto-segmenti nidificati salvo se tra virgolette. |
| JSONL      | Indirizzi di riga di primo livello (`L1`, `L2`, `$last`), poi discesa in stile JSONC dentro la riga. |

`resolve` restituisce una corrispondenza strutturata: `root`, `node`, `leaf` o
`insertion-point`, con numero di riga a base 1. I valori foglia sono esposti come testo più un `leafType`, così gli autori di Plugin possono renderizzare anteprime senza dipendere dalla forma dell'AST specifica del tipo.

## Contratto di mutazione

`set` scrive un target concreto:

- I valori frontmatter markdown e i campi elemento `- key: value` sono foglie stringa.
  Gli inserimenti markdown aggiungono sezioni, chiavi frontmatter o elementi di sezione e renderizzano una forma markdown canonica per il file modificato.
- Le scritture di foglie JSONC convertono il valore stringa nel tipo di foglia esistente
  (`string`, `number` finito, `true`/`false` o `null`). Gli inserimenti in oggetti e array JSONC analizzano `<value>` come JSON e usano il percorso di modifica `jsonc-parser` per le normali scritture di foglie, preservando commenti e formattazione vicina.
- Le scritture di foglie JSONL convertono come JSONC dentro una riga. La sostituzione e l'aggiunta di righe intere analizzano `<value>` come JSON. Il JSONL renderizzato preserva la convenzione dominante del file per le terminazioni di riga LF/CRLF.

Usa `--dry-run` prima di scritture visibili all'utente quando i byte esatti contano. Il substrato preserva output byte-identico per round-trip parse/emit, ma una mutazione può canonicalizzare la regione modificata o il file a seconda del tipo.

## Esempi

```bash
# Validate a path (no filesystem access)
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# Read a leaf
openclaw path resolve 'oc://gateway.jsonc/version'

# Wildcard search
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# Dry-run a write
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# Apply the write
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Byte-fidelity round-trip (diagnostic)
openclaw path emit ./AGENTS.md
```

Altri esempi di grammatica:

```bash
# Quote keys containing / or .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

# Predicate search over JSONC children
openclaw path find 'oc://config.jsonc/plugins/[enabled=true]/id'

# Insert into a JSONC array
openclaw path set 'oc://config.jsonc/items/+1' '{"id":"new","enabled":true}' --dry-run

# Insert a JSONC object key
openclaw path set 'oc://config.jsonc/plugins/+github' '{"enabled":true}' --dry-run

# Append a JSONL event
openclaw path set 'oc://session.jsonl/+' '{"event":"checkpoint","ok":true}' --file ./logs/session.jsonl

# Resolve the last JSONL value line
openclaw path resolve 'oc://session.jsonl/$last/event' --file ./logs/session.jsonl

# Address markdown frontmatter
openclaw path resolve 'oc://AGENTS.md/[frontmatter]/name'

# Insert markdown frontmatter
openclaw path set 'oc://AGENTS.md/[frontmatter]/+description' 'Agent instructions' --dry-run

# Find markdown item fields
openclaw path find 'oc://SKILL.md/Tools/*/send_email'

# Validate a session-scoped path
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk?session=cron-daily'
```

## Ricette per tipo di file

Gli stessi cinque verbi funzionano per tutti i tipi; lo schema di indirizzamento esegue il dispatch in base all'estensione del file. Gli esempi sotto usano le fixture dalla descrizione della PR.

### Markdown

```text
<!-- frontmatter.md -->
---
name: drafter
description: email drafting agent
tier: core
---
## Tools
- gh: GitHub CLI
- curl: HTTP client
- send_email: enabled
```

```bash
$ openclaw path resolve 'oc://x.md/[frontmatter]/tier' --file frontmatter.md --human
leaf @ L4: "core" (string)

$ openclaw path resolve 'oc://x.md/tools/gh/gh' --file frontmatter.md --human
leaf @ L9: "GitHub CLI" (string)

$ openclaw path find 'oc://x.md/tools/*' --file frontmatter.md --human
3 matches for oc://x.md/tools/*:
  oc://x.md/tools/gh           →  node @ L9 [md-item]
  oc://x.md/tools/curl         →  node @ L10 [md-item]
  oc://x.md/tools/send-email   →  node @ L11 [md-item]
```

Il predicato `[frontmatter]` indirizza il blocco frontmatter YAML; `tools`
corrisponde all'intestazione `## Tools` tramite slug, e le foglie degli elementi mantengono la loro forma slug anche quando la sorgente usa underscore (`send_email` → `send-email`).

### JSONC

```text
// config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": false, "role": "chat"}
  }
}
```

```bash
$ openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --file config.jsonc --human
leaf @ L4: "true" (boolean)

$ openclaw path set 'oc://config.jsonc/plugins/slack/enabled' 'true' --file config.jsonc --dry-run
--dry-run: would write 142 bytes to /…/config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": true, "role": "chat"}
  }
}
```

Le modifiche JSONC passano attraverso `jsonc-parser`, quindi commenti e spaziatura sopravvivono a un
`set`. Esegui prima con `--dry-run` per ispezionare i byte prima del commit.

### JSONL

```text
{"event":"start","userId":"u1","ts":1}
{"event":"action","userId":"u1","ts":2}
{"event":"end","userId":"u1","ts":3}
```

```bash
$ openclaw path find 'oc://session.jsonl/[event=action]/userId' --file session.jsonl --human
1 match for oc://session.jsonl/[event=action]/userId:
  oc://session.jsonl/L2/userId  →  leaf @ L2: "u1" (string)

$ openclaw path resolve 'oc://session.jsonl/L2/ts' --file session.jsonl --human
leaf @ L2: "2" (number)
```

Ogni riga è un record. Indirizza tramite predicato (`[event=action]`) quando non
conosci il numero di riga, oppure tramite il segmento canonico `LN` quando lo conosci.

## Riferimento dei sottocomandi

### `resolve <oc-path>`

Legge una singola foglia o un nodo. I caratteri jolly vengono rifiutati: usa `find` per quelli.
Esce con `0` in caso di corrispondenza, `1` in caso di mancata corrispondenza pulita, `2` in caso di errore di parsing o pattern rifiutato.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Enumera ogni corrispondenza per un pattern con carattere jolly / predicato / unione. Esce con `0`
in presenza di almeno una corrispondenza, `1` con zero corrispondenze. I caratteri jolly nello slot del file vengono rifiutati con
`OC_PATH_FILE_WILDCARD_UNSUPPORTED`: passa un file concreto (il globbing
multi-file è una funzionalità futura).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Scrive una foglia. Abbinalo a `--dry-run` per visualizzare in anteprima i byte che verrebbero
scritti senza toccare il file. Esce con `0` in caso di scrittura riuscita, `1` se
il substrato rifiuta (per esempio, una guardia sentinella attivata), `2` in caso di errori di parsing.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

Il marcatore di inserimento `+key` crea il figlio denominato se non esiste già;
`+nnn` e `+` semplice funzionano rispettivamente per l'inserimento indicizzato e in append.

### `validate <oc-path>`

Controllo di solo parsing. Nessun accesso al filesystem. Utile quando vuoi confermare che un
percorso modello sia ben formato prima di sostituire le variabili, oppure quando vuoi
la scomposizione strutturale per il debug:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

Esce con `0` quando è valido, `1` quando non è valido (con `code` e
`message` strutturati), `2` in caso di errori negli argomenti.

### `emit <file>`

Esegue il round-trip di un file attraverso il parser e l'emettitore specifici per tipo. L'output dovrebbe
essere identico byte per byte all'input su un file valido: una divergenza indica un
bug del parser o una sentinella attivata. Utile per il debug del comportamento del substrato su
input reali.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Codici di uscita

| Codice | Significato                                                                    |
| ---- | -------------------------------------------------------------------------- |
| `0`  | Successo. (`resolve` / `find`: almeno una corrispondenza. `set`: scrittura riuscita.) |
| `1`  | Nessuna corrispondenza, oppure `set` rifiutato dal substrato (nessun errore a livello di sistema).      |
| `2`  | Errore negli argomenti o di parsing.                                                   |

## Modalità di output

`openclaw path` è sensibile al TTY: output leggibile dall'utente su un terminale, JSON quando
stdout è collegato a una pipe o reindirizzato. `--json` e `--human` sovrascrivono il
rilevamento automatico.

## Note

- `set` scrive byte attraverso il percorso di emissione del substrato, che applica automaticamente la
  guardia sentinella di redazione. Una foglia che contiene
  `__OPENCLAW_REDACTED__` (letteralmente o come sottostringa) viene rifiutata al momento della scrittura.
- Il parsing JSONC e le modifiche delle foglie usano la dipendenza `jsonc-parser`
  locale al Plugin, quindi commenti e formattazione vengono preservati nelle normali scritture di foglie
  invece di passare attraverso un parser/percorso di ri-rendering scritto a mano.
- `path` non conosce LKG. Se il file è tracciato da LKG, la successiva
  chiamata observe decide se promuovere / recuperare. `set --batch` per
  multi-set atomico attraverso il ciclo di vita di promozione/recupero LKG è pianificato
  insieme al substrato di recupero LKG.

## Correlati

- [Riferimento CLI](/it/cli)
