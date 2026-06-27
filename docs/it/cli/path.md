---
read_when:
    - Vuoi leggere o scrivere una foglia all'interno di un file del workspace dal terminale
    - Stai scrivendo script basati sullo stato dell'area di lavoro e vuoi uno schema di indirizzamento stabile e indipendente dal tipo
    - Stai eseguendo il debug di un percorso `oc://` (convalida la sintassi, vedi in cosa si risolve)
summary: Riferimento CLI per `openclaw path` (ispeziona e modifica i file dell'area di lavoro tramite lo schema di indirizzamento `oc://`)
title: Percorso
x-i18n:
    generated_at: "2026-06-27T17:21:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88e560c19cf34851b0237986e15b48ad7d0e32699e2c12c559dfeecf6fcf761b
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Accesso shell fornito da Plugin al substrato di indirizzamento `oc://`: uno
schema di percorsi con dispatch per tipo per ispezionare e modificare file
dello spazio di lavoro indirizzabili (markdown, jsonc, jsonl, yaml/yml/lobster).
Chi esegue hosting autonomo, gli autori di plugin e le estensioni per editor lo
usano per leggere, trovare o aggiornare una posizione ristretta senza creare
parser specifici per ogni file.

La CLI rispecchia i verbi pubblici del substrato:

- `resolve` è concreto e a corrispondenza singola.
- `find` è il verbo multi-corrispondenza per wildcard, unioni, predicati ed
  espansione posizionale.
- `set` accetta solo percorsi concreti o marcatori di inserimento; i pattern
  wildcard vengono rifiutati prima della scrittura.

`path` è fornito dal plugin opzionale in bundle `oc-path`. Abilitalo prima del
primo utilizzo:

```bash
openclaw plugins enable oc-path
```

## Perché usarlo

Lo stato di OpenClaw è distribuito tra markdown modificato da esseri umani,
configurazione JSONC commentata, log JSONL append-only e file YAML di workflow
o specifiche. Script shell, hook e agenti spesso hanno bisogno di un piccolo
valore da quei file: una chiave frontmatter, un'impostazione di plugin, il
campo di un record di log, uno step YAML o un elemento elenco sotto una sezione
con nome.

`openclaw path` offre a quei chiamanti un indirizzo stabile invece di un grep,
una regex o un parser ad hoc per ogni tipo di file. Lo stesso percorso `oc://`
può essere validato, risolto, cercato, provato in dry-run e scritto dal
terminale, rendendo le automazioni ristrette più facili da revisionare e più
sicure da rieseguire. È particolarmente utile quando vuoi aggiornare una sola
foglia preservando il resto dei commenti del file, i fine riga e la
formattazione circostante.

Usalo quando ciò che cerchi ha un indirizzo logico, ma la forma fisica del file
varia:

- Un hook vuole leggere un'impostazione da JSONC commentato senza perdere i
  commenti quando riscrive il valore.
- Uno script di manutenzione vuole trovare ogni campo evento corrispondente in
  un log JSONL senza caricare l'intero log in un parser personalizzato.
- Un'estensione per editor vuole passare a una sezione markdown o a un elemento
  elenco per slug, poi renderizzare la riga esatta a cui è stata risolta.
- Un agente vuole provare in dry-run una piccola modifica allo spazio di lavoro
  prima di applicarla, con i byte modificati visibili in revisione.

Probabilmente non ti serve `openclaw path` per normali modifiche di interi
file, migrazioni di configurazione complesse o scritture specifiche della
memoria. Queste dovrebbero usare il comando o il plugin proprietario. `path` è
per operazioni su file piccole e indirizzabili, dove un comando terminale
ripetibile è più chiaro di un altro parser su misura.

## Come viene usato

Leggi un valore da un file di configurazione modificato da esseri umani:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Visualizza in anteprima una scrittura senza toccare il disco:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Trova record corrispondenti in un log JSONL append-only:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

Indirizza un'istruzione in markdown per sezione ed elemento invece che per
numero di riga:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Valida un percorso in CI o in uno script di preflight prima che lo script legga
o scriva:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Questi comandi sono pensati per essere copiabili negli script shell. Usa
`--json` quando un chiamante ha bisogno di output strutturato e `--human`
quando una persona sta ispezionando il risultato.

## Come funziona

`openclaw path` fa quattro cose:

1. Analizza l'indirizzo `oc://` in slot: file, sezione, elemento, campo e
   sessione opzionale.
2. Sceglie l'adapter per tipo di file dall'estensione di destinazione (`.md`,
   `.jsonc`, `.jsonl`, `.yaml`, `.yml`, `.lobster` e alias correlati).
3. Risolve gli slot rispetto all'AST di quel tipo di file: intestazioni/elementi
   markdown, chiavi oggetto/indici array JSONC, record di riga JSONL o nodi
   mappa/sequenza YAML.
4. Per `set`, emette i byte modificati tramite lo stesso adapter, così le parti
   intatte del file mantengono commenti, fine riga e formattazione vicina dove
   il tipo lo supporta.

`resolve` e `set` richiedono un solo target concreto. `find` è il verbo
esplorativo: espande wildcard, unioni, predicati e ordinali nelle corrispondenze
concrete che puoi ispezionare prima di sceglierne una da scrivere.

## Sottocomandi

| Sottocomando            | Scopo                                                                        |
| ----------------------- | ---------------------------------------------------------------------------- |
| `resolve <oc-path>`     | Stampa la corrispondenza concreta al percorso (o "non trovato").             |
| `find <pattern>`        | Elenca le corrispondenze per un percorso wildcard / unione / predicato.       |
| `set <oc-path> <value>` | Scrive una foglia o un target di inserimento a un percorso concreto. Supporta `--dry-run`. |
| `validate <oc-path>`    | Solo parsing; stampa la scomposizione strutturale (file / sezione / elemento / campo). |
| `emit <file>`           | Fa round-trip di un file tramite `parseXxx` + `emitXxx` (diagnostica di fedeltà dei byte). |

## Flag globali

| Flag            | Scopo                                                                    |
| --------------- | ------------------------------------------------------------------------ |
| `--cwd <dir>`   | Risolve lo slot file rispetto a questa directory (predefinito: `process.cwd()`). |
| `--file <path>` | Sovrascrive il percorso risolto dello slot file (accesso assoluto).      |
| `--json`        | Forza l'output JSON (predefinito quando stdout non è un TTY).            |
| `--human`       | Forza l'output leggibile da persone (predefinito quando stdout è un TTY). |
| `--dry-run`     | (solo su `set`) stampa i byte che verrebbero scritti senza scrivere.     |
| `--diff`        | (con `set --dry-run`) stampa un diff unificato invece dei byte completi. |

## Sintassi `oc://`

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Regole degli slot: `field` richiede `item` e `item` richiede `section`. Su tutti
e quattro gli slot:

- **Segmenti tra virgolette** — `"a/b.c"` sopravvive ai separatori `/` e `.`.
  Il contenuto è letterale a livello di byte; `"` e `\` non sono ammessi dentro
  le virgolette. Anche lo slot file riconosce le virgolette:
  `oc://"skills/email-drafter"/Tools/$last` tratta `skills/email-drafter` come
  un singolo percorso file.
- **Predicati** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`,
  `[k>=v]`. Gli operatori numerici richiedono che entrambi i lati possano
  convertirsi in numeri finiti.
- **Unioni** — `{a,b,c}` corrisponde a una qualsiasi delle alternative.
- **Wildcard** — `*` (singolo sotto-segmento) e `**` (zero o più, ricorsivo).
  `find` le accetta; `resolve` e `set` le rifiutano perché ambigue.
- **Posizionale** — `$first` / `$last` si risolvono al primo / ultimo indice o
  alla prima / ultima chiave dichiarata.
- **Ordinale** — `#N` per l'ennesima corrispondenza in ordine di documento.
- **Marcatori di inserimento** — `+`, `+key`, `+nnn` per inserimento con chiave /
  indicizzato (da usare con `set`).
- **Ambito sessione** — `?session=cron-daily` ecc. Ortogonale
  all'annidamento degli slot. I valori di sessione sono grezzi, non
  percent-decoded; non possono contenere caratteri di controllo o delimitatori
  di query riservati (`?`, `&`, `%`).

I caratteri riservati (`?`, `&`, `%`) fuori da segmenti tra virgolette, di
predicato o di unione vengono rifiutati. I caratteri di controllo
(U+0000-U+001F, U+007F) vengono rifiutati ovunque, incluso il valore di query
`session`.

`formatOcPath(parseOcPath(path)) === path` è garantito per i percorsi canonici.
I parametri di query non canonici vengono ignorati, tranne il primo valore
`session=` non vuoto.

## Indirizzamento per tipo di file

| Tipo              | Modello di indirizzamento                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| Markdown          | Sezioni H2 per slug, elementi elenco per slug o `#N`, frontmatter tramite `[frontmatter]`.          |
| JSONC/JSON        | Chiavi oggetto e indici array; i punti separano sotto-segmenti annidati salvo se tra virgolette.    |
| JSONL             | Indirizzi di riga di primo livello (`L1`, `L2`, `$first`, `$last`), poi discesa stile JSONC dentro la riga. |
| YAML/YML/.lobster | Chiavi mappa e indici sequenza; commenti e stile flow sono gestiti dall'API documento YAML.         |

`resolve` restituisce una corrispondenza strutturata: `root`, `node`, `leaf` o
`insertion-point`, con un numero di riga basato su 1. I valori foglia vengono
esposti come testo più un `leafType`, così gli autori di plugin possono
renderizzare anteprime senza dipendere dalla forma dell'AST specifica del tipo.

## Contratto di mutazione

`set` scrive un target concreto:

- I valori frontmatter markdown e i campi elemento `- key: value` sono foglie
  stringa. Gli inserimenti markdown aggiungono sezioni, chiavi frontmatter o
  elementi di sezione e renderizzano una forma markdown canonica per il file
  modificato.
- Le scritture di foglie JSONC convertono il valore stringa nel tipo della
  foglia esistente (`string`, `number` finito, `true`/`false` o `null`). Usa
  `--value-json` quando una sostituzione di foglia JSONC/JSON/JSONL dovrebbe
  analizzare `<value>` come JSON e può cambiare forma, ad esempio sostituendo
  una scorciatoia stringa SecretRef con un oggetto. Gli inserimenti di oggetti e
  array JSONC analizzano `<value>` come JSON e usano il percorso di modifica
  `jsonc-parser` per le normali scritture di foglie, preservando commenti e
  formattazione vicina.
- Le scritture di foglie JSONL convertono come JSONC dentro una riga. La
  sostituzione di un'intera riga e l'append analizzano `<value>` come JSON. Il
  JSONL renderizzato preserva la convenzione dominante del file per i fine riga
  LF/CRLF.
- Le scritture di foglie YAML convertono al tipo scalare esistente (`string`,
  `number` finito, `true`/`false` o `null`). Gli inserimenti YAML usano l'API
  documento del pacchetto `yaml` in bundle per aggiornamenti di mappe/sequenze.
  I documenti YAML malformati con errori del parser vengono rifiutati prima
  della mutazione con `parse-error`.

Usa `--dry-run` prima di scritture visibili all'utente quando i byte esatti
contano. Il substrato preserva output byte-identico per round-trip parse/emit,
ma una mutazione può canonicalizzare la regione modificata o il file a seconda
del tipo. Aggiungi `--diff` quando vuoi l'anteprima come patch prima/dopo
focalizzata invece del file renderizzato completo.

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

# Dry-run a write as a unified diff
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# Apply the write
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Byte-fidelity round-trip (diagnostic)
openclaw path emit ./AGENTS.md
```

Altri esempi di grammatica:

```bash
# Quote keys containing / or .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

# Deep JSON/JSONC paths can use slash segments; they normalize to dotted subsegments
openclaw path set 'oc://openclaw.json/agents/list/0/tools/exec/security' 'allowlist' --dry-run

# Replace a JSONC leaf with a parsed object
openclaw path set 'oc://openclaw.json/gateway/auth/token' '{"source":"file","provider":"secrets","id":"/test"}' --value-json --dry-run

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

# Resolve a YAML workflow step
openclaw path resolve 'oc://workflow.yaml/steps/0/id'

# Update a YAML scalar
openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --dry-run

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

Gli stessi cinque verbi funzionano tra i vari tipi; lo schema di indirizzamento esegue il dispatch in base all'estensione del file. Gli esempi seguenti usano le fixture dalla descrizione della PR.

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

Il predicato `[frontmatter]` indirizza il blocco YAML frontmatter; `tools` corrisponde all'intestazione `## Tools` tramite slug, e le foglie degli elementi mantengono la loro forma slug anche quando il sorgente usa underscore (`send_email` → `send-email`).

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

Le modifiche JSONC passano attraverso `jsonc-parser`, quindi commenti e spazi vengono conservati dopo un `set`. Esegui prima con `--dry-run` per ispezionare i byte prima di confermare.

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

Ogni riga è un record. Indirizza tramite predicato (`[event=action]`) quando non conosci il numero di riga, oppure tramite il segmento canonico `LN` quando lo conosci.

### YAML

```text
# workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify
    command: openclaw.invoke
```

```bash
$ openclaw path resolve 'oc://workflow.yaml/steps/0/id' --file workflow.yaml --human
leaf @ L3: "fetch" (string)

$ openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --file workflow.yaml --dry-run
--dry-run: would write 99 bytes to /…/workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify-renamed
    command: openclaw.invoke
```

YAML usa l'API `Document` del pacchetto `yaml` invece di un parser artigianale, quindi i normali cicli parse/emit conservano commenti e forma di authoring mentre i percorsi risolti usano lo stesso modello map-key / sequence-index di JSONC. Lo stesso adattatore gestisce file `.yaml`, `.yml` e `.lobster`.

## Riferimento dei sottocomandi

### `resolve <oc-path>`

Legge una singola foglia o un singolo nodo. I wildcard vengono rifiutati: usa `find` per quelli. Esce con `0` in caso di corrispondenza, `1` in caso di mancata corrispondenza pulita, `2` in caso di errore di parsing o pattern rifiutato.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Enumera ogni corrispondenza per un pattern wildcard / predicato / unione. Esce con `0` con almeno una corrispondenza, `1` con zero corrispondenze. I wildcard nello slot del file vengono rifiutati con `OC_PATH_FILE_WILDCARD_UNSUPPORTED`: passa un file concreto (il globbing multi-file è una funzionalità futura).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Scrive una foglia. Abbinalo a `--dry-run` per visualizzare in anteprima i byte che verrebbero scritti senza toccare il file. Aggiungi `--diff` per un'anteprima diff unificata. Esce con `0` in caso di scrittura riuscita, `1` se il substrato rifiuta (per esempio, se viene raggiunta una guardia sentinella), `2` in caso di errori di parsing.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

Il marker di inserimento `+key` crea il figlio nominato se non esiste già; `+nnn` e il semplice `+` funzionano rispettivamente per l'inserimento indicizzato e per l'append.

### `validate <oc-path>`

Controllo di solo parsing. Nessun accesso al filesystem. Utile quando vuoi confermare che un percorso template sia ben formato prima di sostituire variabili, oppure quando vuoi la scomposizione strutturale per il debug:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

Esce con `0` quando valido, `1` quando non valido (con `code` e `message` strutturati), `2` in caso di errori negli argomenti.

### `emit <file>`

Esegue un round-trip di un file attraverso parser ed emitter per tipo. L'output dovrebbe essere byte-identico all'input su un file corretto: una divergenza indica un bug del parser o il raggiungimento di una sentinella. Utile per il debug del comportamento del substrato su input reali.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Codici di uscita

| Codice | Significato                                                                 |
| ------ | --------------------------------------------------------------------------- |
| `0`    | Successo. (`resolve` / `find`: almeno una corrispondenza. `set`: scrittura riuscita.) |
| `1`    | Nessuna corrispondenza, oppure `set` rifiutato dal substrato (nessun errore a livello di sistema). |
| `2`    | Errore di argomento o di parsing.                                           |

## Modalità di output

`openclaw path` è consapevole del TTY: output leggibile da umani su terminale, JSON quando stdout viene inviato a una pipe o reindirizzato. `--json` e `--human` sovrascrivono il rilevamento automatico.

## Note

- `set` scrive byte attraverso il percorso emit del substrato, che applica automaticamente la guardia della sentinella di redazione. Una foglia che contiene `__OPENCLAW_REDACTED__` (alla lettera o come sottostringa) viene rifiutata al momento della scrittura.
- Il parsing JSONC e le modifiche alle foglie usano la dipendenza `jsonc-parser` locale del Plugin, quindi commenti e formattazione vengono conservati nelle normali scritture di foglie invece di passare attraverso un percorso di parser/re-render artigianale.
- `path` non conosce LKG. Se il file è tracciato da LKG, la chiamata observe successiva decide se promuovere / recuperare. `set --batch` per multi-set atomico attraverso il ciclo di vita promuovi/recupera di LKG è pianificato insieme al substrato di recupero LKG.

## Correlati

- [Riferimento CLI](/it/cli)
