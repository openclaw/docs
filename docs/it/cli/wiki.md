---
read_when:
    - Vuoi utilizzare la CLI memory-wiki
    - Stai documentando o modificando `openclaw wiki`
summary: Riferimento CLI per `openclaw wiki` (stato del vault memory-wiki, ricerca, compilazione, lint, applicazione, bridge, importazione da ChatGPT e strumenti ausiliari per Obsidian)
title: Wiki
x-i18n:
    generated_at: "2026-07-12T06:57:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e817fdd101c3fbe8c3c2aa51ab6a5e8e3bc35ce61376e746b7fceb0b87d0154
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Ispeziona e gestisce il vault `memory-wiki`. Fornito dal plugin `memory-wiki` incluso.

Correlati: [Plugin Memory Wiki](/it/plugins/memory-wiki), [Panoramica della memoria](/it/concepts/memory), [CLI: memoria](/it/cli/memory)

## Comandi comuni

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki okf import ./knowledge-catalog/okf/bundles/ga4
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki search "who should I ask about Teams?" --mode route-question
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha Summary" \
  --body "Short synthesis body" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Still active?"

openclaw wiki bridge import
openclaw wiki unsafe-local import
openclaw wiki chatgpt import --export ./chatgpt-export --dry-run
openclaw wiki chatgpt rollback <run-id>

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## Selezione dell'agente

Quando `plugins.entries.memory-wiki.config.vault.scope` è `agent`, seleziona il
vault con l'opzione di primo livello `--agent <id>`:

```bash
openclaw wiki --agent support status
openclaw wiki --agent support search "refund policy"
openclaw wiki --agent marketing ingest ./campaign-notes.md
```

In una configurazione con più agenti, `--agent` è obbligatorio per le operazioni
della CLI, in modo che un comando non possa leggere o scrivere un vault
predefinito arbitrario. Se è configurato un solo agente, tale agente rimane
quello predefinito. Gli ID agente sconosciuti causano un errore prima dell'avvio
dell'operazione sul vault. L'opzione non modifica il percorso selezionato quando
`vault.scope` è `global`.

I client del Gateway seguono la stessa regola: passa `agentId` nelle richieste
`wiki.*` basate sul vault in una configurazione multi-agente con ambito agente.
Un ID mancante o sconosciuto costituisce un errore. I turni dell'agente, gli
strumenti wiki, i supplementi al corpus della memoria e i riepiloghi compilati
dei prompt includono già il contesto dell'agente di runtime attivo.

## Comandi

### `wiki status`

Mostra modalità e ambito del vault, agente risolto, stato di integrità e disponibilità della CLI di Obsidian. Usalo per primo per verificare se il vault previsto è inizializzato, se la modalità bridge è integra o se l'integrazione con Obsidian è disponibile.

Quando la modalità bridge è attiva e configurata per leggere gli artefatti della memoria, questo comando interroga il Gateway in esecuzione, così da rilevare lo stesso contesto del plugin di memoria attivo usato dalla memoria dell'agente e del runtime.

### `wiki doctor`

Esegue i controlli di integrità della wiki e segnala le correzioni applicabili. Termina con un codice diverso da zero quando lo stato non è integro.

Quando la modalità bridge è attiva e configurata per leggere gli artefatti della memoria, questo comando interroga il Gateway in esecuzione prima di generare il rapporto. Le importazioni bridge disabilitate e le configurazioni bridge che non leggono gli artefatti della memoria rimangono locali e offline.

Problemi tipici:

- modalità bridge abilitata senza artefatti pubblici della memoria
- struttura del vault non valida o mancante
- CLI esterna di Obsidian mancante quando è prevista la modalità Obsidian

### `wiki init`

Crea la struttura del vault wiki e le pagine iniziali, inclusi gli indici di primo livello e le directory della cache.

### `wiki ingest <path>`

Importa un file Markdown o di testo locale nella cartella `sources/` della wiki come pagina sorgente. `<path>` deve essere un percorso di file locale; attualmente non è possibile importare da URL. Rifiuta i file binari.

Le pagine sorgente importate includono nel frontmatter i dati di provenienza (`sourceType: local-file`, `sourcePath`, `ingestedAt`). Al termine, l'importazione ricompila sempre il vault.

Opzioni: `--title <title>` sostituisce il titolo della sorgente (impostazione predefinita: derivato dal nome del file).

### `wiki okf import <path>`

Importa un bundle Open Knowledge Format non compresso nelle pagine concettuali della wiki.

L'importatore legge ogni documento concettuale `.md` non riservato nell'albero delle directory OKF, richiede un campo `type` non vuoto e tratta i valori OKF `type` sconosciuti come concetti generici. I file OKF riservati `index.md` e `log.md` non vengono importati come concetti.

Le pagine importate vengono collocate direttamente sotto `concepts/`, così i flussi esistenti di compilazione, ricerca, recupero, riepilogo e dashboard della wiki le rilevano immediatamente. L'ID concetto OKF originale, `type`, `resource`, `tags`, data e ora, percorso sorgente e frontmatter completo vengono conservati nel frontmatter della pagina. I collegamenti Markdown OKF interni vengono riscritti verso le pagine wiki generate; i collegamenti interrotti o esterni rimangono invariati. Al termine, l'importazione ricompila sempre il vault.

Esempi:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

Rigenera indici, blocchi correlati, dashboard e riepiloghi compilati. Scrive artefatti stabili destinati alle macchine in:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Se `render.createDashboards` è abilitato, la compilazione aggiorna anche le pagine dei rapporti.

### `wiki lint`

Analizza il vault e scrive un rapporto che comprende:

- problemi strutturali (collegamenti interrotti, ID mancanti o duplicati, tipo o titolo della pagina mancante, frontmatter non valido)
- lacune nella provenienza (ID sorgente mancanti, provenienza dell'importazione mancante)
- contraddizioni (contraddizioni segnalate, affermazioni in conflitto)
- domande aperte
- pagine e affermazioni con bassa attendibilità
- pagine e affermazioni obsolete

Esegui questo comando dopo aggiornamenti significativi della wiki.

### `wiki search <query>`

Cerca nei contenuti della wiki. Il comportamento dipende dalla configurazione:

- `search.backend`: `shared` o `local`
- `search.corpus`: `wiki`, `memory` o `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` o `raw-claim`

Usa `wiki search` per la classificazione e la provenienza specifiche della wiki. Per un'unica ricerca ampia nella memoria condivisa, preferisci `openclaw memory search` quando il plugin di memoria attivo espone la ricerca condivisa.

Modalità di ricerca:

- `find-person`: alias, handle, profili social, ID canonici e pagine delle persone
- `route-question`: indicazioni su chi consultare e per quali casi è più adatto, oltre al contesto delle relazioni
- `source-evidence`: pagine sorgente e campi di prova strutturati
- `raw-claim`: testo strutturato delle affermazioni con metadati relativi ad affermazioni e prove

Esempi:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

L'output testuale include le righe `Claim:` ed `Evidence:` quando un risultato corrisponde a un'affermazione strutturata. L'output JSON espone inoltre `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` ed `evidenceSourceIds` per l'analisi dettagliata da parte dell'agente.

### `wiki get <lookup>`

Legge una pagina wiki tramite ID o percorso relativo.

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Applica modifiche circoscritte senza interventi manuali e non strutturati sulle pagine:

- `apply synthesis <title>`: crea o aggiorna una pagina di sintesi con un corpo di riepilogo gestito
- `apply metadata <lookup>`: aggiorna i metadati di una pagina esistente

Entrambi accettano `--source-id`, `--contradiction`, `--question` (ciascuno ripetibile), `--confidence <n>` (0-1) e `--status <status>`. `apply metadata` accetta anche `--clear-confidence` per rimuovere un valore di attendibilità memorizzato. Questo è il metodo supportato per far evolvere le pagine wiki mantenendo intatti i blocchi generati e gestiti.

### `wiki bridge import`

Importa gli artefatti pubblici della memoria dal plugin di memoria attivo nelle pagine sorgente basate sul bridge. Usalo in modalità `bridge` per acquisire nel vault wiki gli artefatti della memoria esportati più di recente.

Per le letture attive degli artefatti bridge, la CLI instrada l'importazione tramite RPC del Gateway, in modo da usare il contesto del plugin di memoria del runtime. Se le importazioni bridge sono disabilitate o le letture degli artefatti non sono attive, il comando mantiene il comportamento locale e offline con zero importazioni. L'aggiornamento dell'indice dopo l'importazione è regolato da `ingest.autoCompile`.

### `wiki unsafe-local import`

Importa da percorsi locali configurati esplicitamente (`unsafeLocal.paths`) in modalità `unsafe-local`. Funzionalità volutamente sperimentale e limitata alla stessa macchina. L'aggiornamento dell'indice dopo l'importazione è regolato da `ingest.autoCompile`.

### `wiki chatgpt import`

Importa un'esportazione di ChatGPT nelle bozze delle pagine sorgente della wiki.

```bash
openclaw wiki chatgpt import --export ./chatgpt-export
openclaw wiki chatgpt import --export ./conversations.json --dry-run
```

| Opzione           | Valore predefinito | Descrizione                                                                    |
| ----------------- | ------------------- | ------------------------------------------------------------------------------ |
| `--export <path>` | (obbligatorio)      | Directory di esportazione di ChatGPT o percorso di `conversations.json`.       |
| `--dry-run`       | `false`             | Mostra in anteprima il numero di elementi creati, aggiornati e ignorati senza scrivere pagine. |

Un'importazione non simulata che modifica una pagina registra un ID di esecuzione dell'importazione, mostrato nel riepilogo e necessario per il ripristino.

### `wiki chatgpt rollback <run-id>`

Annulla un'esecuzione di importazione ChatGPT applicata in precedenza, rimuovendo le pagine create e ripristinando quelle sovrascritte. Non esegue alcuna operazione (e segnala `alreadyRolledBack`) se l'esecuzione è già stata annullata.

### `wiki obsidian ...`

Comandi di supporto per Obsidian destinati ai vault eseguiti in modalità compatibile con Obsidian: `status`, `search`, `open`, `command`, `daily`. Richiedono la CLI ufficiale `obsidian` nel `PATH` quando `obsidian.useOfficialCli` è abilitato.

La convalida della configurazione rifiuta `obsidian.useOfficialCli: true` quando
`vault.scope` è `agent`, perché `obsidian.vaultName` è un'unica impostazione globale,
non una mappatura per agente. Il rendering Markdown compatibile con Obsidian rimane
disponibile.

## Indicazioni pratiche per l'uso

- Usa `wiki search` + `wiki get` quando la provenienza e l'identità della pagina sono importanti.
- Usa `wiki apply` invece di modificare manualmente le sezioni generate e gestite.
- Usa `wiki lint` prima di considerare attendibili contenuti contraddittori o con bassa attendibilità.
- Usa `wiki compile` dopo importazioni in blocco o modifiche alle sorgenti quando desideri aggiornare immediatamente le dashboard e i riepiloghi compilati.
- Usa `wiki okf import` quando un catalogo dati, un'esportazione della documentazione o una pipeline di arricchimento dell'agente produce già bundle Markdown OKF.
- Usa `wiki bridge import` quando la modalità bridge dipende da artefatti della memoria esportati di recente.

## Collegamenti alla configurazione

Il comportamento di `openclaw wiki` è determinato da:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.vault.scope`
- `plugins.entries.memory-wiki.config.vault.path`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.ingest.autoCompile`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Consulta [Plugin Memory Wiki](/it/plugins/memory-wiki) per il modello di configurazione completo.

## Contenuti correlati

- [Riferimento della CLI](/it/cli)
- [Wiki della memoria](/it/plugins/memory-wiki)
