---
read_when:
    - Vuoi leggere o scrivere un valore terminale all'interno di un file dell'area di lavoro dal terminale
    - Stai creando script che interagiscono con lo stato dell'area di lavoro e desideri uno schema di indirizzamento stabile e indipendente dal tipo
    - Stai eseguendo il debug di un percorso `oc://` (verifica la sintassi e controlla a cosa viene risolto)
summary: Riferimento CLI per `openclaw path` (ispeziona e modifica i file dell'area di lavoro tramite lo schema di indirizzamento `oc://`)
title: Percorso
x-i18n:
    generated_at: "2026-07-12T06:57:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7afe5bd1c3a5fca8dd22c7d807e390e751ae7e895c54bf0e10e2734f3889436c
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Accesso dalla shell allo schema di indirizzamento `oc://`: una sintassi di percorso con dispatch in base al tipo per ispezionare e modificare i file indirizzabili dell'area di lavoro (markdown, jsonc, jsonl, yaml/yml/lobster). Chi gestisce un'installazione in proprio, gli autori di plugin e le estensioni degli editor lo usano per leggere, trovare o aggiornare una posizione specifica senza dover creare manualmente un parser per ogni tipo di file.

`path` è fornito dal plugin opzionale incluso `oc-path`. Abilitalo prima del primo utilizzo:

```bash
openclaw plugins enable oc-path
```

I verbi della CLI rispecchiano il modello di indirizzamento:

- `resolve` è concreto e restituisce una singola corrispondenza.
- `find` è il verbo per corrispondenze multiple con caratteri jolly, unioni, predicati ed espansione posizionale.
- `set` accetta solo percorsi concreti o marcatori di inserimento; i modelli con caratteri jolly vengono rifiutati prima della scrittura.
- `validate` analizza un percorso senza accedere al file system.
- `emit` esegue il round trip di un file tramite analisi ed emissione (diagnostica della fedeltà a livello di byte).

## Perché usarlo

Lo stato di OpenClaw è distribuito tra file markdown modificati manualmente, configurazioni JSONC con commenti, log JSONL a sola aggiunta e file YAML di flussi di lavoro o specifiche. Script, hook e agenti spesso necessitano di un singolo valore da questi file: una chiave di frontmatter, un'impostazione di un plugin, un campo di un record di log, un passaggio YAML o un elemento puntato sotto una sezione denominata.

`openclaw path` fornisce a questi chiamanti un indirizzo stabile, anziché richiedere un grep, un'espressione regolare o un parser specifico per ciascun tipo di file. Lo stesso percorso `oc://` può essere convalidato, risolto, cercato, simulato e scritto dal terminale, rendendo l'automazione circoscritta verificabile e ripetibile. Il resto del file viene preservato, quindi la scrittura di una singola foglia non altera i commenti, le terminazioni di riga o la formattazione circostante.

Usalo quando ciò che cerchi ha un indirizzo logico, ma la struttura del file varia:

- Un hook legge una singola impostazione da un file JSONC con commenti senza perdere i commenti quando riscrive il valore.
- Uno script di manutenzione trova ogni campo evento corrispondente in un log JSONL senza caricare l'intero log in un parser personalizzato.
- Un editor passa a una sezione markdown o a un elemento puntato tramite slug, quindi visualizza la riga esatta risolta.
- Un agente simula una piccola modifica dell'area di lavoro prima di applicarla, rendendo visibili nella revisione i byte modificati.

Evita `openclaw path` per le normali modifiche di interi file, le migrazioni articolate della configurazione o le scritture specifiche della memoria; in questi casi va usato il comando o il plugin responsabile. `path` è destinato a piccole operazioni su file indirizzabili, per le quali un comando di terminale ripetibile è preferibile a un altro parser su misura.

## Come si usa

Leggi un valore da un file di configurazione modificato manualmente:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Visualizza in anteprima una scrittura senza modificare il disco:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Trova i record corrispondenti in un log JSONL a sola aggiunta:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

Indirizza un'istruzione in markdown tramite sezione ed elemento anziché tramite numero di riga:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Convalida un percorso nella CI o in uno script di verifica preliminare prima che lo script esegua letture o scritture:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Questi comandi sono pensati per essere copiati negli script di shell. Usa `--json` quando un chiamante necessita di un output strutturato e `--human` quando una persona ispeziona il risultato.

## Come funziona

1. Analizza l'indirizzo `oc://` suddividendolo in posizioni: file, sezione, elemento, campo e una query di sessione facoltativa.
2. Seleziona l'adattatore per il tipo di file in base all'estensione di destinazione (`.md`, `.jsonc`, `.json`, `.jsonl`, `.ndjson`, `.yaml`, `.yml`, `.lobster`).
3. Risolve le posizioni rispetto alla struttura del tipo di file: intestazioni ed elementi markdown, chiavi di oggetti e indici di array JSONC, record di riga JSONL oppure nodi di mappa e sequenza YAML.
4. Per `set`, emette i byte modificati tramite lo stesso adattatore, in modo che le parti non modificate del file mantengano commenti, terminazioni di riga e formattazione circostante, laddove il tipo lo supporti.

`resolve` e `set` richiedono una singola destinazione concreta. `find` è il verbo esplorativo: espande caratteri jolly, unioni, predicati e ordinali nelle corrispondenze concrete che puoi ispezionare prima di scegliere quale scrivere.

## Sottocomandi

| Sottocomando            | Scopo                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| `resolve <oc-path>`     | Stampa la corrispondenza concreta nel percorso (oppure "non trovato").                        |
| `find <pattern>`        | Elenca le corrispondenze di un percorso con caratteri jolly, unioni o predicati.               |
| `set <oc-path> <value>` | Scrive una foglia o una destinazione di inserimento in un percorso concreto. Supporta `--dry-run`. |
| `validate <oc-path>`    | Esegue solo l'analisi; stampa la suddivisione strutturale (file/sezione/elemento/campo).        |
| `emit <file>`           | Esegue il round trip di un file tramite analisi ed emissione (diagnostica della fedeltà a livello di byte). |

## Opzioni globali

| Opzione         | Si applica a                     | Scopo                                                                                         |
| --------------- | -------------------------------- | --------------------------------------------------------------------------------------------- |
| `--cwd <dir>`   | `resolve`, `find`, `set`, `emit` | Risolve la posizione del file rispetto a questa directory (predefinita: `process.cwd()`).     |
| `--file <path>` | `resolve`, `find`, `set`, `emit` | Sostituisce il percorso risolto della posizione del file (accesso assoluto).                  |
| `--json`        | tutti                            | Forza l'output JSON (predefinito quando stdout non è un TTY).                                 |
| `--human`       | tutti                            | Forza l'output leggibile dall'utente (predefinito quando stdout è un TTY).                    |
| `--value-json`  | `set`                            | Analizza `<value>` come JSON per sostituire una foglia JSON/JSONC/JSONL.                      |
| `--dry-run`     | `set`                            | Stampa i byte che verrebbero scritti senza eseguire la scrittura.                            |
| `--diff`        | `set` (richiede `--dry-run`)     | Stampa una differenza unificata anziché tutti i byte.                                         |

`validate` accetta solo `--json` / `--human`; non accede al file system, quindi `--cwd` e `--file` non si applicano.

## Sintassi `oc://`

```text
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Regole delle posizioni: `field` richiede `item` e `item` richiede `section`. Per tutte e quattro le posizioni:

- **Segmenti tra virgolette** — `"a/b.c"` non viene suddiviso dai separatori `/` e `.`. Il contenuto è letterale a livello di byte; `"` e `\` non sono consentiti all'interno delle virgolette. Anche la posizione del file riconosce le virgolette: `oc://"skills/email-drafter"/Tools/$last` considera `skills/email-drafter` come un unico percorso di file.
- **Predicati** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`, `[k>=v]`. Gli operatori numerici richiedono che entrambi gli operandi siano convertibili in numeri finiti.
- **Unioni** — `{a,b,c}` corrisponde a una qualsiasi delle alternative.
- **Caratteri jolly** — `*` (singolo sottosegmento) e `**` (zero o più, ricorsivo). `find` li accetta; `resolve` e `set` li rifiutano perché ambigui.
- **Posizionali** — `$first` / `$last` si risolvono rispettivamente nel primo/ultimo indice o nella prima/ultima chiave dichiarata.
- **Ordinale** — `#N` per l'ennesima corrispondenza nell'ordine del documento.
- **Marcatori di inserimento** — `+`, `+key`, `+nnn` per inserimenti con chiave o indice (da usare con `set`).
- **Ambito della sessione** — `?session=cron-daily` ecc. È indipendente dall'annidamento delle posizioni. I valori di sessione sono grezzi, non decodificati in percentuale; non possono contenere caratteri di controllo o delimitatori di query riservati (`?`, `&`, `%`).

I caratteri riservati (`?`, `&`, `%`) al di fuori di segmenti tra virgolette, predicati o unioni vengono rifiutati. I caratteri di controllo (U+0000-U+001F, U+007F) vengono rifiutati ovunque, incluso il valore della query `session`.

`formatOcPath(parseOcPath(path)) === path` è garantito per i percorsi canonici. I parametri di query non canonici vengono ignorati, fatta eccezione per il primo valore `session=` non vuoto.

Limiti rigidi: un percorso è limitato a 4096 byte, a un massimo di 4 posizioni (file/sezione/elemento/campo), a un massimo di 64 sottosegmenti separati da punti per posizione e a un massimo di 256 livelli di attraversamento annidati per i percorsi JSON profondi. Separatamente, qualsiasi file JSONC/JSON di input superiore a 16 MiB viene rifiutato con una diagnostica di analisi anziché essere analizzato, per qualsiasi verbo che carichi il file.

## Indirizzamento per tipo di file

| Tipo          | Estensioni di file            | Modello di indirizzamento                                                                                      |
| ------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Markdown      | `.md`                         | Sezioni H2 tramite slug, elementi puntati tramite slug o `#N`, frontmatter tramite `[frontmatter]`.            |
| JSONC/JSON    | `.jsonc`, `.json`             | Chiavi di oggetti e indici di array; i punti separano i sottosegmenti annidati, salvo quando sono tra virgolette. |
| JSONL         | `.jsonl`, `.ndjson`           | Indirizzi di riga di primo livello (`L1`, `L2`, `$first`, `$last`), quindi discesa in stile JSONC all'interno della riga. |
| YAML/.lobster | `.yaml`, `.yml`, `.lobster`   | Chiavi di mappe e indici di sequenze; i commenti e lo stile di flusso sono gestiti dall'API del documento YAML. |

`resolve` restituisce una corrispondenza strutturata: `root`, `node`, `leaf` o `insertion-point`, con un numero di riga a partire da 1. I valori foglia vengono esposti come testo insieme a un `leafType`, affinché gli autori di plugin possano visualizzare anteprime senza dipendere dalla struttura AST specifica del tipo.

## Contratto di modifica

`set` scrive una singola destinazione concreta:

- I valori del frontmatter markdown e i campi degli elementi `- key: value` sono foglie di tipo stringa. Gli inserimenti markdown aggiungono sezioni, chiavi di frontmatter o elementi di sezione e generano una struttura markdown canonica per il file modificato. I corpi delle sezioni non sono scrivibili nel loro insieme tramite `set`.
- Le scritture di foglie JSONC convertono il valore stringa nel tipo della foglia esistente (`string`, `number` finito, `true`/`false` o `null`). Usa `--value-json` quando la sostituzione di una foglia JSONC/JSON/JSONL deve analizzare `<value>` come JSON e può cambiarne la struttura, ad esempio sostituendo una forma abbreviata stringa di riferimento a un segreto con un oggetto. Gli inserimenti in oggetti e array JSONC analizzano `<value>` come JSON e usano il percorso di modifica di `jsonc-parser` per le normali scritture di foglie, preservando commenti e formattazione circostante.
- Le scritture di foglie JSONL eseguono la conversione come JSONC all'interno di una riga. La sostituzione e l'aggiunta di intere righe analizzano `<value>` come JSON. Il JSONL generato preserva la convenzione dominante delle terminazioni di riga LF/CRLF del file (tramite voto di maggioranza sulle interruzioni di riga del file, così un file prevalentemente CRLF rimane CRLF anche in presenza di alcuni LF isolati).
- Le scritture di foglie YAML eseguono la conversione nel tipo scalare esistente (`string`, `number` finito, `true`/`false` o `null`). Gli inserimenti YAML usano l'API dei documenti del pacchetto `yaml` incluso per gli aggiornamenti di mappe e sequenze. I documenti YAML non validi con errori del parser vengono rifiutati prima della modifica con `parse-error`.

Usa `--dry-run` prima delle scritture visibili all'utente quando i byte esatti sono importanti. Le modifiche JSONC e YAML applicano patch al documento esistente (tramite `jsonc-parser` o l'API dei documenti `yaml`), quindi i byte non modificati vengono generalmente preservati; markdown ricostruisce il file dalla struttura analizzata a ogni modifica, il che può normalizzare la formattazione accessoria al di fuori della foglia modificata. Aggiungi `--diff` quando desideri visualizzare l'anteprima come patch mirata prima/dopo anziché come file completo generato.

## Esempi

```bash
# Convalida un percorso (senza accesso al file system)
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# Leggi una foglia
openclaw path resolve 'oc://gateway.jsonc/version'

# Ricerca con caratteri jolly
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# Simula una scrittura
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# Simula una scrittura come differenza unificata
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# Applica la scrittura
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Round trip con fedeltà a livello di byte (diagnostica)
openclaw path emit ./AGENTS.md
```

Altri esempi di grammatica:

```bash
# Racchiudi tra virgolette le chiavi contenenti / o .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

# I percorsi JSON/JSONC profondi possono usare segmenti separati da barre; vengono normalizzati in sottosegmenti separati da punti
openclaw path set 'oc://openclaw.json/agents/list/0/tools/exec/security' 'allowlist' --dry-run

# Sostituisci una foglia JSONC con un oggetto analizzato
openclaw path set 'oc://openclaw.json/gateway/auth/token' '{"source":"file","provider":"secrets","id":"/test"}' --value-json --dry-run

# Ricerca tramite predicato tra i figli JSONC
openclaw path find 'oc://config.jsonc/plugins/[enabled=true]/id'

# Inserisci in un array JSONC
openclaw path set 'oc://config.jsonc/items/+1' '{"id":"new","enabled":true}' --dry-run

# Inserisci una chiave di un oggetto JSONC
openclaw path set 'oc://config.jsonc/plugins/+github' '{"enabled":true}' --dry-run

# Aggiungi un evento JSONL
openclaw path set 'oc://session.jsonl/+' '{"event":"checkpoint","ok":true}' --file ./logs/session.jsonl

# Risolvi l'ultima riga di valori JSONL
openclaw path resolve 'oc://session.jsonl/$last/event' --file ./logs/session.jsonl

# Risolvi un passaggio di un flusso di lavoro YAML
openclaw path resolve 'oc://workflow.yaml/steps/0/id'

# Aggiorna uno scalare YAML
openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --dry-run

# Indirizza il frontmatter Markdown
openclaw path resolve 'oc://AGENTS.md/[frontmatter]/name'

# Inserisci il frontmatter Markdown
openclaw path set 'oc://AGENTS.md/[frontmatter]/+description' 'Agent instructions' --dry-run

# Trova i campi degli elementi Markdown
openclaw path find 'oc://SKILL.md/Tools/*/send_email'

# Convalida un percorso limitato alla sessione
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk?session=cron-daily'
```

## Ricette per tipo di file

Gli stessi cinque verbi funzionano per tutti i tipi; lo schema di indirizzamento seleziona il comportamento in base
all'estensione del file.

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

Il predicato `[frontmatter]` indirizza il blocco di frontmatter YAML; `tools`
corrisponde all'intestazione `## Tools` tramite slug, mentre le foglie degli elementi mantengono la forma slug
anche quando il sorgente usa caratteri di sottolineatura (`send_email` diventa `send-email`).

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
`set`. Esegui prima con `--dry-run` per esaminare i byte prima di applicare la modifica.
I file `.json` usano lo stesso adattatore e lo stesso percorso di modifica dei file `.jsonc`.

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

Ogni riga è un record. Indirizzalo tramite predicato (`[event=action]`) quando
non conosci il numero di riga, oppure tramite il segmento canonico `LN` quando lo conosci.
I file `.ndjson` usano lo stesso adattatore dei file `.jsonl`.

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

YAML usa l'API `Document` del pacchetto `yaml` anziché un parser
realizzato manualmente, quindi i normali cicli di analisi/emissione preservano i commenti e la
struttura di creazione, mentre i percorsi risolti usano lo stesso modello chiave-di-mappa/indice-di-sequenza di
JSONC. Lo stesso adattatore gestisce i file `.yaml`, `.yml` e `.lobster`.

## Riferimento dei sottocomandi

### `resolve <oc-path>`

Legge una singola foglia o un singolo nodo. I caratteri jolly vengono rifiutati: usa `find` in questi casi.
Termina con `0` in caso di corrispondenza, `1` in caso di mancata corrispondenza senza errori, `2` in caso di errore di analisi o schema
rifiutato.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Enumera tutte le corrispondenze per uno schema con caratteri jolly, predicati o unioni. Termina con `0`
in presenza di almeno una corrispondenza, `1` in assenza di corrispondenze. I caratteri jolly nello slot del file vengono rifiutati con
`OC_PATH_FILE_WILDCARD_UNSUPPORTED`: passa un file specifico (la corrispondenza glob
su più file è una funzionalità futura).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Scrive una foglia. Abbinalo a `--dry-run` per visualizzare in anteprima i byte che verrebbero
scritti senza modificare il file. Aggiungi `--diff` per un'anteprima unificata delle differenze.
Termina con `0` in caso di scrittura riuscita, `1` se il substrato rifiuta l'operazione (ad esempio,
quando si attiva una protezione tramite sentinella), `2` in caso di errori di analisi.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

L'indicatore di inserimento `+key` crea il figlio denominato se non
esiste già; `+nnn` e il semplice `+` consentono rispettivamente l'inserimento
per indice e l'aggiunta in coda.

### `validate <oc-path>`

Controllo della sola analisi. Nessun accesso al file system. Utile per verificare che un
percorso di modello sia ben formato prima di sostituire le variabili, oppure per ottenere
la scomposizione strutturale a fini di debug:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

Termina con `0` se valido, `1` se non valido (con `code` e
`message` strutturati), `2` in caso di errori negli argomenti.

### `emit <file>`

Esegue un ciclo completo di analisi ed emissione di un file tramite il parser e l'emettitore specifici del tipo. L'output dovrebbe
essere identico byte per byte all'input per un file valido; una divergenza indica un
errore del parser o l'attivazione di una sentinella. Utile per eseguire il debug del comportamento del substrato su
input reali.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Codici di uscita

| Codice | Significato                                                                    |
| ------ | ------------------------------------------------------------------------------ |
| `0`    | Operazione riuscita. (`resolve` / `find`: almeno una corrispondenza. `set`: scrittura riuscita.) |
| `1`    | Nessuna corrispondenza, oppure `set` rifiutato dal substrato (nessun errore a livello di sistema). |
| `2`    | Errore negli argomenti o nell'analisi.                                         |

## Modalità di output

`openclaw path` rileva il TTY: produce un output leggibile su un terminale e JSON quando
stdout viene inviato tramite pipe o reindirizzato. `--json` e `--human` sostituiscono il
rilevamento automatico.

## Note

- `set` scrive i byte attraverso il percorso di emissione del substrato, che applica
  automaticamente la protezione tramite sentinella di oscuramento. Una foglia contenente
  `__OPENCLAW_REDACTED__` (alla lettera o come sottostringa) viene rifiutata al momento della
  scrittura.
- L'analisi JSONC e le modifiche delle foglie usano la dipendenza `jsonc-parser`
  locale al plugin, quindi commenti e formattazione vengono preservati durante le normali
  scritture delle foglie, invece di passare attraverso un percorso di analisi e nuova generazione realizzato manualmente.
- `path` non gestisce il monitoraggio o il ripristino dell'ultima configurazione valida (LKG);
  tale ciclo di vita è gestito altrove. Se un file modificato tramite `path` è
  anche monitorato come LKG, la successiva lettura della configurazione decide se promuoverlo o
  ripristinarlo; considera una modifica tramite `path` come qualsiasi altra scrittura diretta su
  quel file.

## Correlati

- [Riferimento della CLI](/it/cli)
