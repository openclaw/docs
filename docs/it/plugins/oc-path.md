---
read_when:
    - Vuoi esaminare o modificare un singolo elemento terminale all'interno di un file dell'area di lavoro dal terminale
    - Stai eseguendo script sullo stato dell'area di lavoro e hai bisogno di uno schema di indirizzamento stabile e indipendente dal tipo
    - Stai decidendo se abilitare il Plugin facoltativo `oc-path` su un Gateway self-hosted
summary: 'Plugin `oc-path` incluso: fornisce la CLI `openclaw path` per lo schema di indirizzamento dei file dell''area di lavoro `oc://`'
title: Plugin OC Path
x-i18n:
    generated_at: "2026-07-12T07:16:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb7bb1aacd37e5cc9c391372b871dc519f4048232d93a0016138ae00a6985a59
    source_path: plugins/oc-path.md
    workflow: 16
---

Il Plugin `oc-path` incluso aggiunge la CLI [`openclaw path`](/it/cli/path) per lo
schema di indirizzamento dei file dell'area di lavoro `oc://`. È distribuito nel repository
OpenClaw in `extensions/oc-path/`, ma è facoltativo: dopo l'installazione o la compilazione
rimane inattivo finché non viene abilitato.

Gli indirizzi `oc://` puntano a una singola foglia (o a un insieme di foglie definito tramite caratteri jolly) all'interno
di un file dell'area di lavoro. Il Plugin riconosce quattro tipi di file:

- **markdown** (`.md`): frontmatter, sezioni, elementi, campi
- **jsonc** (`.jsonc`, `.json`): commenti e formattazione preservati
- **jsonl** (`.jsonl`, `.ndjson`): record organizzati per riga
- **yaml** (`.yaml`, `.yml`, `.lobster`): nodi mappa, sequenza e scalari tramite
  l'API `Document` del pacchetto `yaml`

Chi gestisce un'installazione autonoma e le estensioni degli editor usa la CLI per leggere o scrivere una singola foglia
senza interagire direttamente con l'SDK tramite script; gli agenti e gli hook la trattano come un
substrato deterministico, così i round trip con fedeltà a livello di byte e la protezione
della sentinella di oscuramento si applicano uniformemente a tutti i tipi. Consulta il
[riferimento della CLI](/it/cli/path) per la grammatica completa, l'elenco dei flag per ogni verbo e
gli esempi svolti per ciascun tipo di file; questa pagina spiega perché e come abilitare il
Plugin.

## Perché abilitarlo

Abilita `oc-path` quando script, hook o strumenti locali degli agenti devono puntare a
una parte precisa dello stato dell'area di lavoro senza richiedere un parser dedicato per ogni struttura di file. Un
singolo indirizzo `oc://` può identificare una chiave del frontmatter markdown, un elemento di sezione, una
foglia di configurazione JSONC, un campo evento JSONL o un passaggio di un flusso di lavoro YAML.

Questo è importante per i flussi di lavoro dei manutentori, nei quali la modifica deve rimanere contenuta,
verificabile e ripetibile: esaminare un valore, trovare i record corrispondenti, simulare
una scrittura, quindi applicare la modifica soltanto a quella foglia lasciando invariati commenti, terminazioni di riga e
formattazione circostante.

Motivi comuni per abilitarlo:

- **Automazione locale**: gli script di shell risolvono o aggiornano un singolo valore dell'area di lavoro
  con `openclaw path … --json`, anziché includere codice di analisi separato per markdown, JSONC,
  JSONL e YAML.
- **Modifiche visibili agli agenti**: prima della scrittura, un agente mostra la differenza di una simulazione per una sola
  foglia indirizzata, più semplice da esaminare rispetto alla riscrittura libera di un
  file.
- **Integrazioni con gli editor**: un editor associa `oc://AGENTS.md/tools/gh` al
  nodo markdown e al numero di riga esatti, senza dedurli dal testo dell'intestazione.
- **Diagnostica**: `emit` esegue un round trip di un file attraverso il parser e l'emettitore,
  consentendo di verificare se un tipo di file è stabile a livello di byte prima di fare affidamento sulle
  modifiche automatiche.

```bash
# Il plugin GitHub è abilitato in questa configurazione?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Quali nomi di chiamate agli strumenti compaiono nel registro di questa sessione?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# Quali byte scriverebbe questa piccola modifica alla configurazione?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

`oc-path` non è intenzionalmente responsabile della semantica di livello superiore. I Plugin di
memoria continuano a gestire le scritture in memoria, i comandi di configurazione continuano a gestire l'intera
configurazione e il ripristino dell'ultima configurazione valida nota (LKG) continua a gestire
il ripristino e la promozione. `oc-path` è il livello ristretto di indirizzamento e di operazioni sui
file con preservazione dei byte attorno al quale possono essere costruiti tali strumenti di livello superiore.

## Dove viene eseguito

Il Plugin viene eseguito **all'interno del processo della CLI `openclaw`** sull'host nel quale
viene invocato il comando. Non richiede un Gateway in esecuzione e non apre alcun
socket di rete; ogni verbo è una trasformazione pura applicata al file indicato.

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

`onStartup: false` esclude il Plugin dal percorso di avvio del Gateway.
`commandAliases` e `activation.onCommands` indicano alla CLI di caricare il Plugin
in modo differito la prima volta che viene eseguito `openclaw path …`, quindi le installazioni che non usano mai
il verbo non sostengono alcun costo.

## Abilitazione

```bash
openclaw plugins enable oc-path
```

Riavvia il Gateway, se ne esegui uno, affinché l'istantanea del manifesto acquisisca il nuovo
stato. Le invocazioni dirette di `openclaw path` funzionano immediatamente sullo stesso host;
la CLI carica il Plugin su richiesta.

Disabilitalo con:

```bash
openclaw plugins disable oc-path
```

## Dipendenze

Tutte le dipendenze dei parser sono locali al Plugin; l'abilitazione di `oc-path` non aggiunge
nuovi pacchetti al runtime principale:

| Dipendenza     | Scopo                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| `commander`    | Collegamento dei sottocomandi `resolve`, `find`, `set`, `validate`, `emit`. |
| `jsonc-parser` | Analisi JSONC e modifiche delle foglie con preservazione di commenti e virgole finali. |
| `markdown-it`  | Tokenizzazione Markdown per il modello di sezioni, elementi e campi.   |
| `yaml`         | Analisi, emissione e modifica di `Document` YAML con preservazione di commenti e stile di flusso. |

JSONL rimane implementato manualmente: l'analisi per riga è più semplice di qualsiasi
dipendenza e l'analisi di ogni riga passa già attraverso `jsonc-parser`.

## Funzionalità fornite

| Superficie                     | Fornita da                                              |
| ------------------------------ | ------------------------------------------------------- |
| CLI `openclaw path`            | `extensions/oc-path/cli-registration.ts`                |
| Parser/formattatore `oc://`    | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| Analisi/emissione/modifica per tipo | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}` |
| Risoluzione/ricerca/impostazione universali | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Protezione della sentinella di oscuramento | `extensions/oc-path/src/oc-path/sentinel.ts`  |

Attualmente la CLI è l'unica superficie pubblica. I verbi del substrato sono privati del
Plugin; i consumatori usano la CLI oppure creano il proprio Plugin basato
sull'SDK.

## Relazione con altri Plugin

- **`memory-*`**: le scritture in memoria passano attraverso i Plugin di memoria, non
  attraverso `oc-path`. `oc-path` è un substrato generico per i file; i Plugin di memoria vi sovrappongono
  la propria semantica.
- **LKG**: `path` non gestisce il ripristino dell'ultima configurazione valida nota. Se un
  file modificato tramite `path` è anche monitorato da LKG, il ciclo successivo di osservazione della configurazione
  decide se promuoverlo o ripristinarlo; considera una modifica tramite `path` come
  qualsiasi altra scrittura diretta sullo stesso file.

## Sicurezza

`set` scrive byte non elaborati attraverso il percorso di emissione del substrato, che applica
automaticamente la protezione della sentinella di oscuramento. La scrittura di una foglia contenente
`__OPENCLAW_REDACTED__`, in forma esatta o come sottostringa, viene rifiutata
con `OC_EMIT_SENTINEL`. La CLI rimuove inoltre la sentinella letterale da ogni
output leggibile o JSON che stampa, sostituendola con `[REDACTED]`, affinché le
acquisizioni del terminale e le pipeline non espongano mai il marcatore.

## Contenuti correlati

- [Riferimento della CLI `openclaw path`](/it/cli/path)
- [Gestire i Plugin](/it/plugins/manage-plugins)
- [Creare Plugin](/it/plugins/building-plugins)
