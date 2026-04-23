---
read_when:
    - Vuoi usare la CLI memory-wiki
    - Stai documentando o modificando `openclaw wiki`
summary: Riferimento CLI per `openclaw wiki` (stato del vault memory-wiki, ricerca, compilazione, lint, applicazione, bridge e helper Obsidian)
title: wiki
x-i18n:
    generated_at: "2026-04-23T08:27:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: e94908532c35da4edf488266ddc6eee06e8f7833eeba5f2b5c0c7d5d45b65eef
    source_path: cli/wiki.md
    workflow: 15
---

# `openclaw wiki`

Ispeziona ed effettua la manutenzione del vault `memory-wiki`.

Fornito dal plugin `memory-wiki` incluso.

Correlati:

- [Plugin Memory Wiki](/it/plugins/memory-wiki)
- [Panoramica della memoria](/it/concepts/memory)
- [CLI: memory](/it/cli/memory)

## A cosa serve

Usa `openclaw wiki` quando vuoi un vault di conoscenza compilato con:

- ricerca nativa del wiki e lettura delle pagine
- sintesi ricche di provenienza
- report su contraddizioni e aggiornamento
- import bridge dal plugin di memoria attivo
- helper CLI Obsidian facoltativi

## Comandi comuni

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
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

Ispeziona la modalità corrente del vault, lo stato di salute e la disponibilità della CLI Obsidian.

Usalo per primo quando non sei sicuro che il vault sia inizializzato, che la modalità bridge
sia in salute o che l'integrazione Obsidian sia disponibile.

### `wiki doctor`

Esegue i controlli di salute del wiki e mostra i problemi di configurazione o del vault.

I problemi tipici includono:

- modalità bridge abilitata senza artefatti di memoria pubblici
- layout del vault non valido o mancante
- CLI Obsidian esterna mancante quando è prevista la modalità Obsidian

### `wiki init`

Crea il layout del vault wiki e le pagine iniziali.

Questo inizializza la struttura root, inclusi gli indici di livello superiore e le
directory cache.

### `wiki ingest <path-or-url>`

Importa contenuto nel livello sorgente del wiki.

Note:

- l'import da URL è controllato da `ingest.allowUrlIngest`
- le pagine sorgente importate mantengono la provenienza nel frontmatter
- la compilazione automatica può essere eseguita dopo l'import quando è abilitata

### `wiki compile`

Ricostruisce indici, blocchi correlati, dashboard e digest compilati.

Questo scrive artefatti stabili orientati alle macchine in:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Se `render.createDashboards` è abilitato, compile aggiorna anche le pagine di report.

### `wiki lint`

Esegue il lint del vault e segnala:

- problemi strutturali
- lacune di provenienza
- contraddizioni
- domande aperte
- pagine/claim a bassa confidenza
- pagine/claim non aggiornati

Eseguilo dopo aggiornamenti significativi del wiki.

### `wiki search <query>`

Cerca nel contenuto del wiki.

Il comportamento dipende dalla configurazione:

- `search.backend`: `shared` o `local`
- `search.corpus`: `wiki`, `memory` o `all`

Usa `wiki search` quando vuoi ranking specifico del wiki o dettagli di provenienza.
Per un singolo passaggio ampio di recupero condiviso, preferisci `openclaw memory search` quando il
plugin di memoria attivo espone la ricerca condivisa.

### `wiki get <lookup>`

Legge una pagina wiki per id o percorso relativo.

Esempi:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Applica mutazioni ristrette senza interventi manuali in formato libero sulla pagina.

I flussi supportati includono:

- creazione/aggiornamento di una pagina di sintesi
- aggiornamento dei metadati della pagina
- collegamento di source id
- aggiunta di domande
- aggiunta di contraddizioni
- aggiornamento di confidenza/stato
- scrittura di claim strutturati

Questo comando esiste affinché il wiki possa evolvere in sicurezza senza modificare manualmente
i blocchi gestiti.

### `wiki bridge import`

Importa artefatti di memoria pubblici dal plugin di memoria attivo in pagine sorgente
supportate da bridge.

Usalo in modalità `bridge` quando vuoi che gli ultimi artefatti di memoria esportati
vengano portati nel vault wiki.

### `wiki unsafe-local import`

Importa da percorsi locali configurati esplicitamente in modalità `unsafe-local`.

Questa funzione è intenzionalmente sperimentale e solo per la stessa macchina.

### `wiki obsidian ...`

Comandi helper Obsidian per vault eseguiti in modalità compatibile con Obsidian.

Sottocomandi:

- `status`
- `search`
- `open`
- `command`
- `daily`

Questi richiedono la CLI ufficiale `obsidian` in `PATH` quando
`obsidian.useOfficialCli` è abilitato.

## Indicazioni pratiche d'uso

- Usa `wiki search` + `wiki get` quando contano la provenienza e l'identità della pagina.
- Usa `wiki apply` invece di modificare manualmente le sezioni generate gestite.
- Usa `wiki lint` prima di considerare attendibile contenuto contraddittorio o a bassa confidenza.
- Usa `wiki compile` dopo import in blocco o modifiche alle sorgenti quando vuoi subito
  dashboard e digest compilati aggiornati.
- Usa `wiki bridge import` quando la modalità bridge dipende da artefatti di memoria
  appena esportati.

## Collegamenti con la configurazione

Il comportamento di `openclaw wiki` è modellato da:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Vedi [plugin Memory Wiki](/it/plugins/memory-wiki) per il modello di configurazione completo.
