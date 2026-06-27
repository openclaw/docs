---
read_when:
    - Si desidera usare la CLI memory-wiki
    - Stai documentando o modificando `openclaw wiki`
summary: Riferimento CLI per `openclaw wiki` (stato dell'archivio memory-wiki, ricerca, compilazione, lint, applicazione, bridge e helper di Obsidian)
title: Wiki
x-i18n:
    generated_at: "2026-06-27T17:23:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c6679a5aad41a19dbcad6075c190c3eb533e3ba13a6d5018d56988a23b2d9023
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Ispeziona e mantiene il vault `memory-wiki`.

Fornito dal plugin `memory-wiki` incluso.

Correlati:

- [Plugin Memory Wiki](/it/plugins/memory-wiki)
- [Panoramica della memoria](/it/concepts/memory)
- [CLI: memory](/it/cli/memory)

## A cosa serve

Usa `openclaw wiki` quando vuoi un vault di conoscenza compilato con:

- ricerca nativa wiki e lettura delle pagine
- sintesi ricche di provenienza
- report su contraddizioni e aggiornamento
- importazioni bridge dal plugin di memoria attiva
- helper CLI Obsidian opzionali

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

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## Comandi

### `wiki status`

Ispeziona la modalità attuale del vault, lo stato di salute e la disponibilità della CLI Obsidian.

Usalo per primo quando non sai se il vault è inizializzato, se la modalità bridge
è in buono stato o se l'integrazione Obsidian è disponibile.

Quando la modalità bridge è attiva e configurata per leggere gli artefatti di memoria, questo comando
interroga il Gateway in esecuzione, così vede lo stesso contesto del plugin di memoria attiva di
memoria agent/runtime.

### `wiki doctor`

Esegue controlli di integrità wiki e mostra problemi di configurazione o del vault.

Quando la modalità bridge è attiva e configurata per leggere gli artefatti di memoria, questo comando
interroga il Gateway in esecuzione prima di costruire il report. Le importazioni bridge disabilitate
e le configurazioni bridge che non leggono artefatti di memoria restano locali/offline.

I problemi tipici includono:

- modalità bridge abilitata senza artefatti di memoria pubblici
- layout del vault non valido o mancante
- CLI Obsidian esterna mancante quando è prevista la modalità Obsidian

### `wiki init`

Crea il layout del vault wiki e le pagine iniziali.

Questo inizializza la struttura radice, inclusi indici di primo livello e directory
di cache.

### `wiki ingest <path-or-url>`

Importa contenuti nel livello sorgente della wiki.

Note:

- l'ingestione da URL è controllata da `ingest.allowUrlIngest`
- le pagine sorgente importate mantengono la provenienza nel frontmatter
- la compilazione automatica può essere eseguita dopo l'ingestione quando abilitata

### `wiki okf import <path>`

Importa un bundle Open Knowledge Format estratto in pagine concetto della wiki.

L'importatore legge ogni documento concetto `.md` non riservato nell'albero di directory OKF,
richiede un campo `type` non vuoto e tratta i valori OKF `type` sconosciuti come concetti generici.
I file OKF riservati `index.md` e `log.md` non vengono importati come concetti.

Le pagine importate vengono appiattite sotto `concepts/`, così i flussi wiki esistenti di compilazione,
ricerca, lettura, digest e dashboard le vedono immediatamente. L'ID concetto OKF originale,
`type`, `resource`, `tags`, timestamp, percorso sorgente e frontmatter completo
sono preservati nel frontmatter della pagina. I link markdown OKF interni
vengono riscritti verso le pagine wiki generate; i link interrotti o esterni restano
invariati.

Esempi:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

Ricostruisce indici, blocchi correlati, dashboard e digest compilati.

Questo scrive artefatti stabili orientati alla macchina in:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Se `render.createDashboards` è abilitato, la compilazione aggiorna anche le pagine report.

### `wiki lint`

Esegue il lint del vault e segnala:

- problemi strutturali
- lacune di provenienza
- contraddizioni
- domande aperte
- pagine/asserzioni a bassa affidabilità
- pagine/asserzioni obsolete

Eseguilo dopo aggiornamenti wiki significativi.

### `wiki search <query>`

Cerca nei contenuti wiki.

Il comportamento dipende dalla configurazione:

- `search.backend`: `shared` o `local`
- `search.corpus`: `wiki`, `memory` o `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` o
  `raw-claim`

Usa `wiki search` quando vuoi ranking specifico della wiki o dettagli di provenienza.
Per un passaggio ampio di richiamo condiviso, preferisci `openclaw memory search` quando il
plugin di memoria attiva espone la ricerca condivisa.

Le modalità di ricerca aiutano l'agente a scegliere la superficie giusta:

- `find-person`: alias, handle, profili social, ID canonici e pagine persona
- `route-question`: suggerimenti ask-for/best-used-for e contesto delle relazioni
- `source-evidence`: pagine sorgente e campi di evidenza strutturati
- `raw-claim`: testo di asserzione strutturato con metadati di asserzione/evidenza

Esempi:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

L'output testuale include righe `Claim:` ed `Evidence:` quando un risultato corrisponde a una
asserzione strutturata. L'output JSON espone inoltre `matchedClaimId`,
`matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` e
`evidenceSourceIds` per l'analisi lato agente.

### `wiki get <lookup>`

Legge una pagina wiki per ID o percorso relativo.

Esempi:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Applica mutazioni ristrette senza interventi liberi sulle pagine.

I flussi supportati includono:

- creare/aggiornare una pagina di sintesi
- aggiornare i metadati della pagina
- allegare ID sorgente
- aggiungere domande
- aggiungere contraddizioni
- aggiornare affidabilità/stato
- scrivere asserzioni strutturate

Questo comando esiste affinché la wiki possa evolvere in modo sicuro senza modificare manualmente
i blocchi gestiti.

### `wiki bridge import`

Importa artefatti di memoria pubblici dal plugin di memoria attiva in pagine sorgente
supportate da bridge.

Usalo in modalità `bridge` quando vuoi portare nel vault wiki gli ultimi artefatti di memoria
esportati.

Per le letture attive degli artefatti bridge, la CLI instrada l'importazione tramite Gateway RPC,
così l'importazione usa il contesto runtime del plugin di memoria. Se le importazioni bridge sono
disabilitate o le letture degli artefatti sono disattivate, il comando mantiene il comportamento locale/offline
a importazione zero.

### `wiki unsafe-local import`

Importa da percorsi locali configurati esplicitamente in modalità `unsafe-local`.

Questo è intenzionalmente sperimentale e solo sulla stessa macchina.

### `wiki obsidian ...`

Comandi helper Obsidian per vault eseguiti in modalità compatibile con Obsidian.

Sottocomandi:

- `status`
- `search`
- `open`
- `command`
- `daily`

Richiedono la CLI ufficiale `obsidian` in `PATH` quando
`obsidian.useOfficialCli` è abilitato.

## Indicazioni pratiche d'uso

- Usa `wiki search` + `wiki get` quando la provenienza e l'identità della pagina contano.
- Usa `wiki apply` invece di modificare a mano le sezioni generate gestite.
- Usa `wiki lint` prima di fidarti di contenuti contraddittori o a bassa affidabilità.
- Usa `wiki compile` dopo importazioni di massa o modifiche sorgente quando vuoi dashboard
  e digest compilati aggiornati immediatamente.
- Usa `wiki okf import` quando un catalogo dati, un'esportazione di documentazione o una pipeline
  di arricchimento agent emette già bundle markdown OKF.
- Usa `wiki bridge import` quando la modalità bridge dipende da artefatti di memoria
  appena esportati.

## Collegamenti alla configurazione

Il comportamento di `openclaw wiki` è modellato da:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Consulta [Plugin Memory Wiki](/it/plugins/memory-wiki) per il modello di configurazione completo.

## Correlati

- [Riferimento CLI](/it/cli)
- [Wiki della memoria](/it/plugins/memory-wiki)
