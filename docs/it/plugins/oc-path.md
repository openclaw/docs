---
read_when:
    - Vuoi ispezionare o modificare un singolo nodo foglia all'interno di un file dell'area di lavoro dal terminale
    - Stai scrivendo script rispetto allo stato dell'area di lavoro e hai bisogno di uno schema di indirizzamento stabile e indipendente dal tipo
    - Stai decidendo se abilitare il Plugin opzionale `oc-path` su un Gateway ospitato autonomamente
summary: 'Plugin `oc-path` incluso: fornisce la CLI `openclaw path` per lo schema di indirizzamento dei file dell''area di lavoro `oc://`'
title: Plugin OC Path
x-i18n:
    generated_at: "2026-05-10T19:44:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4d9d34094ebfa5850266b33d6a4f443e631fb207e519c1cf5fccfb735c200a0
    source_path: plugins/oc-path.md
    workflow: 16
---

Il Plugin `oc-path` incluso aggiunge la CLI [`openclaw path`](/it/cli/path) per lo
schema di indirizzamento dei file dell'area di lavoro `oc://`. Viene distribuito nel repository OpenClaw sotto
`extensions/oc-path/`, ma è facoltativo: installazione/build lo lascia inattivo finché non lo
abiliti.

Gli indirizzi `oc://` puntano a una singola foglia (o a un insieme di foglie con caratteri jolly) all'interno di
un file dell'area di lavoro. Il Plugin comprende oggi tre tipi di file:

- **markdown** (`.md`, `.mdx`): frontmatter, sezioni, elementi, campi
- **jsonc** (`.jsonc`, `.json5`, `.json`): commenti e formattazione preservati
- **jsonl** (`.jsonl`, `.ndjson`): record orientati alle righe

Chi usa self-hosting e le estensioni per editor usano la CLI per leggere o scrivere una singola foglia
senza usare direttamente script contro l'SDK; gli agenti e gli hook lo trattano come un
substrato deterministico, così i round-trip con fedeltà ai byte e la protezione del
sentinel di redazione si applicano uniformemente a tutti i tipi.

## Perché abilitarlo

Abilita `oc-path` quando vuoi che script, hook o strumenti locali per agenti puntino
a una porzione precisa dello stato dell'area di lavoro senza inventare un parser per ogni
forma di file. Un singolo indirizzo `oc://` può nominare una chiave del frontmatter markdown, un elemento
di sezione, una foglia di configurazione JSONC o un campo evento JSONL.

Questo conta per i flussi di lavoro dei maintainer in cui la modifica deve essere piccola,
verificabile e ripetibile: ispeziona un valore, trova record corrispondenti, esegui una dry-run di una
scrittura, poi applica solo quella foglia lasciando invariati commenti, terminazioni di riga e
formattazione vicina. Mantenerlo come Plugin facoltativo offre agli utenti avanzati il
substrato di indirizzamento senza inserire dipendenze di parser o superficie CLI nel
core per le installazioni che non ne hanno bisogno.

Motivi comuni per abilitarlo:

- **Automazione locale**: gli script shell possono risolvere o aggiornare un valore dell'area di lavoro
  con `openclaw path … --json` invece di includere codice di parsing separato per markdown, JSONC
  e JSONL.
- **Modifiche visibili all'agente**: un agente può mostrare una diff dry-run per una foglia
  indirizzata prima di scrivere, più facile da revisionare rispetto a una riscrittura libera del file.
- **Integrazioni con editor**: un editor può mappare `oc://AGENTS.md/tools/gh` al
  nodo markdown e al numero di riga esatti senza indovinare dal testo dell'intestazione.
- **Diagnostica**: `emit` esegue il round-trip di un file attraverso parser ed emitter, così
  puoi verificare se un tipo di file è stabile a livello di byte prima di affidarti a modifiche
  automatizzate.

Esempi concreti:

```bash
# Is the GitHub plugin enabled in this config?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Which tool-call names appear in this session log?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# What bytes would this tiny config edit write?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Il Plugin non è intenzionalmente il proprietario della semantica di livello superiore. I Plugin di memoria
continuano a possedere le scritture della memoria, i comandi di configurazione continuano a possedere la gestione
completa della configurazione, e la logica LKG continua a possedere ripristino/promozione. `oc-path` è il livello ristretto
di indirizzamento e operazioni su file con preservazione dei byte attorno al quale questi strumenti di livello superiore
possono costruire.

## Dove viene eseguito

Il Plugin viene eseguito **in-process dentro la CLI `openclaw`** sull'host da cui
invochi il comando. Non richiede un Gateway in esecuzione e non apre
socket di rete: ogni verbo è una trasformazione pura su un file che gli indichi.

I metadati del Plugin si trovano in `extensions/oc-path/openclaw.plugin.json`:

```json
{
  "id": "oc-path",
  "name": "OC Path",
  "activation": {
    "onStartup": false,
    "onCommands": ["path"]
  },
  "commandAliases": [{ "name": "path", "kind": "cli" }]
}
```

`onStartup: false` tiene il Plugin fuori dal percorso caldo del Gateway. `onCommands:
["path"]` indica alla CLI di caricare il Plugin in modo lazy la prima volta che esegui
`openclaw path …`, quindi le installazioni che non usano mai il verbo non pagano alcun costo.

## Abilitazione

```bash
openclaw plugins enable oc-path
```

Riavvia il Gateway (se ne esegui uno) affinché lo snapshot del manifest acquisisca il nuovo
stato. Le invocazioni dirette di `openclaw path` funzionano immediatamente sullo stesso host:
la CLI carica il Plugin su richiesta.

Disabilita con:

```bash
openclaw plugins disable oc-path
```

## Dipendenze

Tutte le dipendenze dei parser sono locali al Plugin: abilitare `oc-path` non introduce
nuovi pacchetti nel runtime core:

| Dipendenza     | Scopo                                                               |
| -------------- | ------------------------------------------------------------------- |
| `commander`    | Cablaggio dei sottocomandi per `resolve`, `find`, `set`, `validate`, `emit`. |
| `jsonc-parser` | Parsing JSONC + modifiche di foglie preservando commenti e virgole finali. |
| `markdown-it`  | Tokenizzazione Markdown per il modello sezione / elemento / campo.  |

JSONL resta implementato a mano: il parsing orientato alle righe è più semplice di qualsiasi
dipendenza, e il parsing JSONC per riga passa già attraverso `jsonc-parser`.

## Cosa fornisce

| Superficie                      | Fornita da                                              |
| ------------------------------ | ------------------------------------------------------- |
| CLI `openclaw path`            | `extensions/oc-path/cli-registration.ts`                |
| Parser / formatter `oc://`     | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| Parse / emit / edit per tipo   | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl}`       |
| Resolve / find / set universali | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Protezione sentinel di redazione | `extensions/oc-path/src/oc-path/sentinel.ts`          |

La CLI è oggi l'unica superficie pubblica. I verbi del substrato sono privati del
Plugin; i consumatori usano la CLI (o costruiscono il proprio Plugin sull'SDK).

## Relazione con altri Plugin

- **`memory-*`**: le scritture della memoria passano attraverso i Plugin di memoria, non `oc-path`.
  `oc-path` è un substrato di file generico; i Plugin di memoria applicano sopra
  la propria semantica.
- **LKG**: `path` non conosce il ripristino della configurazione Last-Known-Good. Se un
  file è tracciato da LKG, la successiva chiamata `observe` decide se promuovere o
  recuperare; `set --batch` per multi-set atomico attraverso il ciclo di vita di promozione/recupero
  LKG è pianificato insieme al substrato di recupero LKG.

## Sicurezza

`set` scrive byte grezzi attraverso il percorso emit del substrato, che applica automaticamente la
protezione del sentinel di redazione. Una foglia che contiene
`__OPENCLAW_REDACTED__` (alla lettera o come sottostringa) viene rifiutata al momento della scrittura
con `OC_EMIT_SENTINEL`. La CLI rimuove inoltre il sentinel letterale da qualsiasi
output umano o JSON che stampa, sostituendolo con `[REDACTED]`, così catture del terminale
e pipeline non fanno mai trapelare il marker.

## Correlati

- [Riferimento CLI `openclaw path`](/it/cli/path)
- [Gestire i Plugin](/it/plugins/manage-plugins)
- [Creare Plugin](/it/plugins/building-plugins)
