---
read_when:
    - Vuoi usare la CLI memory-wiki
    - Stai documentando o modificando `openclaw wiki`
summary: Riferimento CLI per `openclaw wiki` (stato del vault memory-wiki, ricerca, compilazione, lint, applicazione, bridge e helper Obsidian)
title: Wiki
x-i18n:
    generated_at: "2026-04-24T08:35:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: c25f7046ef0c29ed74204a5349edc2aa20ce79a355f49211a0ba0df4a5e4db3a
    source_path: cli/wiki.md
    workflow: 15
---

# `openclaw wiki`

Ispeziona e mantieni il vault `memory-wiki`.

Fornito dal Plugin incluso `memory-wiki`.

Correlati:

- [Plugin Memory Wiki](/it/plugins/memory-wiki)
- [Panoramica della memoria](/it/concepts/memory)
- [CLI: memory](/it/cli/memory)

## A cosa serve

Usa `openclaw wiki` quando vuoi un vault di conoscenza compilato con:

- ricerca nativa wiki
- lettura delle pagine
- sintesi ricche di provenienza
- report di contraddizioni e freschezza
- import bridge dal Plugin di memoria attivo
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

Ispeziona la modalità attuale del vault, lo stato di salute e la disponibilità della CLI Obsidian.

Usalo per primo quando non sei sicuro che il vault sia inizializzato, che la modalità bridge
sia sana o che l'integrazione Obsidian sia disponibile.

### `wiki doctor`

Esegui controlli di salute della wiki e fai emergere problemi di configurazione o del vault.

I problemi tipici includono:

- modalità bridge abilitata senza artefatti di memoria pubblici
- layout del vault non valido o mancante
- CLI Obsidian esterna mancante quando è prevista la modalità Obsidian

### `wiki init`

Crea il layout del vault wiki e le pagine iniziali.

Questo inizializza la struttura root, inclusi gli indici di primo livello e le directory cache.

### `wiki ingest <path-or-url>`

Importa contenuti nel layer sorgente della wiki.

Note:

- l'importazione da URL è controllata da `ingest.allowUrlIngest`
- le pagine sorgente importate mantengono la provenienza nel frontmatter
- la compilazione automatica può essere eseguita dopo l'importazione quando è abilitata

### `wiki compile`

Ricostruisci indici, blocchi correlati, dashboard e digest compilati.

Questo scrive artefatti stabili orientati alla macchina in:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Se `render.createDashboards` è abilitato, la compilazione aggiorna anche le pagine report.

### `wiki lint`

Esegui il lint del vault e segnala:

- problemi strutturali
- lacune di provenienza
- contraddizioni
- domande aperte
- pagine/claim a bassa confidenza
- pagine/claim obsoleti

Eseguilo dopo aggiornamenti significativi della wiki.

### `wiki search <query>`

Cerca contenuti nella wiki.

Il comportamento dipende dalla configurazione:

- `search.backend`: `shared` o `local`
- `search.corpus`: `wiki`, `memory` o `all`

Usa `wiki search` quando vuoi ranking specifico della wiki o dettagli di provenienza.
Per un singolo passaggio ampio di richiamo condiviso, preferisci `openclaw memory search` quando il
Plugin di memoria attivo espone la ricerca condivisa.

### `wiki get <lookup>`

Leggi una pagina wiki per ID o percorso relativo.

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
- allegare source id
- aggiungere domande
- aggiungere contraddizioni
- aggiornare confidence/status
- scrivere claim strutturati

Questo comando esiste così la wiki può evolvere in sicurezza senza modificare manualmente
i blocchi gestiti.

### `wiki bridge import`

Importa artefatti di memoria pubblici dal Plugin di memoria attivo nelle pagine sorgente
supportate da bridge.

Usalo in modalità `bridge` quando vuoi che gli ultimi artefatti di memoria esportati
vengano importati nel vault wiki.

### `wiki unsafe-local import`

Importa da percorsi locali configurati esplicitamente in modalità `unsafe-local`.

Questa modalità è intenzionalmente sperimentale e solo per la stessa macchina.

### `wiki obsidian ...`

Comandi helper Obsidian per vault eseguiti in modalità compatibile con Obsidian.

Sottocomandi:

- `status`
- `search`
- `open`
- `command`
- `daily`

Questi richiedono la CLI ufficiale `obsidian` nel `PATH` quando
`obsidian.useOfficialCli` è abilitato.

## Indicazioni pratiche d'uso

- Usa `wiki search` + `wiki get` quando la provenienza e l'identità della pagina contano.
- Usa `wiki apply` invece di modificare a mano sezioni generate gestite.
- Usa `wiki lint` prima di fidarti di contenuti contraddittori o a bassa confidenza.
- Usa `wiki compile` dopo importazioni in blocco o modifiche delle sorgenti quando vuoi subito dashboard e digest compilati aggiornati.
- Usa `wiki bridge import` quando la modalità bridge dipende da artefatti di memoria esportati di recente.

## Collegamenti con la configurazione

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
- [Memory wiki](/it/plugins/memory-wiki)
