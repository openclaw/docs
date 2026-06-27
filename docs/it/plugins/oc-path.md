---
read_when:
    - Vuoi ispezionare o modificare una singola foglia all’interno di un file del workspace dal terminale
    - Stai creando script contro lo stato del workspace e ti serve uno schema di indirizzamento stabile e indipendente dal tipo
    - Stai decidendo se abilitare il Plugin opzionale `oc-path` su un Gateway ospitato autonomamente
summary: 'Plugin `oc-path` in bundle: fornisce la CLI `openclaw path` per lo schema di indirizzamento dei file dell''area di lavoro `oc://`'
title: Plugin Percorso OC
x-i18n:
    generated_at: "2026-06-27T17:52:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: afb8ab86d04ef783986d05203f2c06b9cb718ad44ec31c797159ed49d9e1d5e3
    source_path: plugins/oc-path.md
    workflow: 16
---

Il plugin `oc-path` incluso aggiunge la CLI [`openclaw path`](/it/cli/path) per lo
schema di indirizzamento dei file dell'area di lavoro `oc://`. Viene distribuito nel repo OpenClaw sotto
`extensions/oc-path/`, ma è facoltativo: installazione e build lo lasciano inattivo finché non lo
abiliti.

Gli indirizzi `oc://` puntano a una singola foglia (o a un insieme di foglie con wildcard) dentro
un file dell'area di lavoro. Oggi il plugin comprende quattro tipi di file:

- **markdown** (`.md`, `.mdx`): frontmatter, sezioni, elementi, campi
- **jsonc** (`.jsonc`, `.json5`, `.json`): commenti e formattazione preservati
- **jsonl** (`.jsonl`, `.ndjson`): record orientati alle righe
- **yaml** (`.yaml`, `.yml`, `.lobster`): nodi mappa/sequenza/scalare tramite l'API del documento
  YAML

Chi gestisce istanze self-hosted e le estensioni per editor usano la CLI per leggere o scrivere una singola foglia
senza creare script direttamente contro l'SDK; agenti e hook lo trattano come un
substrato deterministico, così i round-trip fedeli ai byte e la protezione del
sentinella di redazione si applicano in modo uniforme tra i tipi.

## Perché abilitarlo

Abilita `oc-path` quando vuoi che script, hook o strumenti locali per agenti puntino
a una porzione precisa dello stato dell'area di lavoro senza inventare un parser per ogni forma
di file. Un singolo indirizzo `oc://` può nominare una chiave di frontmatter Markdown, un elemento
di sezione, una foglia di configurazione JSONC, un campo evento JSONL o un passaggio di workflow YAML.

Questo è importante per i workflow dei maintainer in cui la modifica deve essere piccola,
ispezionabile e ripetibile: ispeziona un valore, trova i record corrispondenti, esegui una simulazione
di scrittura, quindi applica solo quella foglia lasciando invariati commenti, terminatori di riga e
formattazione vicina. Mantenerlo come plugin facoltativo offre agli utenti esperti il
substrato di indirizzamento senza inserire dipendenze di parser o superficie CLI nel
core per installazioni che non ne hanno mai bisogno.

Motivi comuni per abilitarlo:

- **Automazione locale**: gli script shell possono risolvere o aggiornare un valore dell'area di lavoro
  con `openclaw path … --json` invece di portarsi dietro codice di parsing separato per Markdown, JSONC,
  JSONL e YAML.
- **Modifiche visibili all'agente**: un agente può mostrare un diff di simulazione per una singola
  foglia indirizzata prima di scrivere, più facile da rivedere rispetto a una riscrittura libera del file.
- **Integrazioni editor**: un editor può mappare `oc://AGENTS.md/tools/gh` al
  nodo Markdown esatto e al numero di riga senza dedurlo dal testo dell'intestazione.
- **Diagnostica**: `emit` esegue il round-trip di un file tramite parser ed emitter, così
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

Il plugin non è intenzionalmente il proprietario della semantica di livello superiore. I plugin di memoria
restano proprietari delle scritture in memoria, i comandi di configurazione restano proprietari della gestione completa
della configurazione e la logica LKG resta proprietaria di ripristino/promozione. `oc-path` è lo stretto
livello di indirizzamento e operazioni su file con preservazione dei byte attorno al quale quegli strumenti
di livello superiore possono costruire.

## Dove viene eseguito

Il plugin viene eseguito **in-process dentro la CLI `openclaw`** sull'host da cui
invochi il comando. Non richiede un Gateway in esecuzione e non apre alcun
socket di rete: ogni verbo è una pura trasformazione su un file che indichi.

I metadati del plugin si trovano in `extensions/oc-path/openclaw.plugin.json`:

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

`onStartup: false` tiene il plugin fuori dal percorso critico del Gateway. `onCommands:
["path"]` indica alla CLI di caricare il plugin in modo lazy la prima volta che esegui
`openclaw path …`, quindi le installazioni che non usano mai il verbo non pagano alcun costo.

## Abilitare

```bash
openclaw plugins enable oc-path
```

Riavvia il Gateway (se ne esegui uno) così lo snapshot del manifest acquisisce il nuovo
stato. Le invocazioni bare `openclaw path` funzionano subito sullo stesso host:
la CLI carica il plugin on demand.

Disabilita con:

```bash
openclaw plugins disable oc-path
```

## Dipendenze

Tutte le dipendenze dei parser sono locali al plugin: abilitare `oc-path` non porta
nuovi pacchetti nel runtime core:

| Dipendenza     | Scopo                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| `commander`    | Cablaggio dei sottocomandi per `resolve`, `find`, `set`, `validate`, `emit`. |
| `jsonc-parser` | Parsing JSONC + modifiche di foglie mantenendo commenti e virgole finali. |
| `markdown-it`  | Tokenizzazione Markdown per il modello sezione / elemento / campo.      |
| `yaml`         | Parsing / emit / modifica di `Document` YAML mantenendo commenti e stile flow. |

JSONL resta implementato manualmente: il parsing orientato alle righe è più semplice di qualsiasi
dipendenza, e il parsing JSONC per riga passa già da `jsonc-parser`.

## Cosa fornisce

| Superficie                     | Fornita da                                             |
| ------------------------------ | ------------------------------------------------------ |
| CLI `openclaw path`            | `extensions/oc-path/cli-registration.ts`               |
| Parser / formatter `oc://`     | `extensions/oc-path/src/oc-path/oc-path.ts`            |
| Parsing / emit / modifica per tipo | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}` |
| Resolve / find / set universali | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Protezione del sentinella di redazione | `extensions/oc-path/src/oc-path/sentinel.ts`           |

La CLI è oggi l'unica superficie pubblica. I verbi del substrato sono privati del
plugin; i consumer usano la CLI (o costruiscono il proprio plugin contro l'SDK).

## Relazione con altri plugin

- **`memory-*`**: le scritture in memoria passano dai plugin di memoria, non da `oc-path`.
  `oc-path` è un substrato generico per file; i plugin di memoria vi stratificano sopra la propria
  semantica.
- **LKG**: `path` non conosce il ripristino della configurazione Last-Known-Good. Se un
  file è tracciato da LKG, la chiamata `observe` successiva decide se promuovere o
  recuperare; `set --batch` per multi-set atomico tramite il ciclo di vita di promozione/recupero
  LKG è pianificato insieme al substrato di recupero LKG.

## Sicurezza

`set` scrive byte grezzi tramite il percorso emit del substrato, che applica automaticamente
la protezione del sentinella di redazione. Una foglia che contiene
`__OPENCLAW_REDACTED__` (letteralmente o come sottostringa) viene rifiutata al momento della scrittura
con `OC_EMIT_SENTINEL`. La CLI rimuove anche il sentinella letterale da qualsiasi
output umano o JSON che stampa, sostituendolo con `[REDACTED]` affinché acquisizioni
del terminale e pipeline non perdano mai il marker.

## Correlati

- [Riferimento CLI `openclaw path`](/it/cli/path)
- [Gestire i plugin](/it/plugins/manage-plugins)
- [Creare plugin](/it/plugins/building-plugins)
