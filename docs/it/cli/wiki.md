---
read_when:
    - Vuoi usare la CLI memory-wiki
    - Stai documentando o modificando `openclaw wiki`
summary: Riferimento CLI per `openclaw wiki` (stato del vault memory-wiki, ricerca, compilazione, lint, applicazione, bridge e helper di Obsidian)
title: Wiki
x-i18n:
    generated_at: "2026-04-30T08:45:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67fe56c9bff7b24570f890733314857dd261fca8233051681a83c171656ff27d
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Ispeziona e mantieni il vault `memory-wiki`.

Fornito dal Plugin `memory-wiki` incluso.

Correlati:

- [Plugin Memory Wiki](/it/plugins/memory-wiki)
- [Panoramica della memoria](/it/concepts/memory)
- [CLI: memoria](/it/cli/memory)

## A cosa serve

Usa `openclaw wiki` quando vuoi un vault di conoscenza compilato con:

- ricerca nativa della wiki e lettura delle pagine
- sintesi ricche di provenienza
- report su contraddizioni e aggiornamento
- importazioni bridge dal Plugin di memoria attiva
- helper CLI Obsidian opzionali

## Comandi comuni

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
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

Ispeziona la modalità corrente del vault, lo stato di integrità e la disponibilità della CLI Obsidian.

Usalo per primo quando non sei sicuro che il vault sia inizializzato, che la modalità bridge sia integra o che l'integrazione Obsidian sia disponibile.

Quando la modalità bridge è attiva e configurata per leggere gli artefatti di memoria, questo comando interroga il Gateway in esecuzione, così vede lo stesso contesto del Plugin di memoria attiva della memoria di agent/runtime.

### `wiki doctor`

Esegui controlli di integrità della wiki ed evidenzia problemi di configurazione o del vault.

Quando la modalità bridge è attiva e configurata per leggere gli artefatti di memoria, questo comando interroga il Gateway in esecuzione prima di creare il report. Le importazioni bridge disabilitate e le configurazioni bridge che non leggono artefatti di memoria restano locali/offline.

I problemi tipici includono:

- modalità bridge abilitata senza artefatti di memoria pubblici
- layout del vault non valido o mancante
- CLI Obsidian esterna mancante quando è prevista la modalità Obsidian

### `wiki init`

Crea il layout del vault wiki e le pagine iniziali.

Questo inizializza la struttura radice, inclusi gli indici di primo livello e le directory cache.

### `wiki ingest <path-or-url>`

Importa contenuti nel livello sorgente della wiki.

Note:

- l'inserimento da URL è controllato da `ingest.allowUrlIngest`
- le pagine sorgente importate mantengono la provenienza nel frontmatter
- la compilazione automatica può essere eseguita dopo l'inserimento quando è abilitata

### `wiki compile`

Ricostruisci indici, blocchi correlati, dashboard e digest compilati.

Questo scrive artefatti stabili destinati alle macchine in:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Se `render.createDashboards` è abilitato, la compilazione aggiorna anche le pagine di report.

### `wiki lint`

Esegui il lint del vault e segnala:

- problemi strutturali
- lacune di provenienza
- contraddizioni
- domande aperte
- pagine/affermazioni a bassa attendibilità
- pagine/affermazioni obsolete

Eseguilo dopo aggiornamenti significativi della wiki.

### `wiki search <query>`

Cerca nei contenuti della wiki.

Il comportamento dipende dalla configurazione:

- `search.backend`: `shared` o `local`
- `search.corpus`: `wiki`, `memory` o `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` o `raw-claim`

Usa `wiki search` quando vuoi dettagli di ranking o provenienza specifici della wiki. Per un singolo passaggio ampio di richiamo condiviso, preferisci `openclaw memory search` quando il Plugin di memoria attiva espone la ricerca condivisa.

Le modalità di ricerca aiutano l'agente a scegliere la superficie giusta:

- `find-person`: alias, handle, profili social, ID canonici e pagine persona
- `route-question`: suggerimenti su chi consultare/per cosa usarlo al meglio e contesto delle relazioni
- `source-evidence`: pagine sorgente e campi di evidenza strutturati
- `raw-claim`: testo dell'affermazione strutturato con metadati di affermazione/evidenza

Esempi:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

L'output testuale include righe `Claim:` ed `Evidence:` quando un risultato corrisponde a un'affermazione strutturata. L'output JSON espone inoltre `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` ed `evidenceSourceIds` per l'approfondimento lato agente.

### `wiki get <lookup>`

Leggi una pagina wiki per ID o percorso relativo.

Esempi:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Applica modifiche mirate senza interventi liberi sulle pagine.

I flussi supportati includono:

- creare/aggiornare una pagina di sintesi
- aggiornare i metadati della pagina
- collegare ID sorgente
- aggiungere domande
- aggiungere contraddizioni
- aggiornare attendibilità/stato
- scrivere affermazioni strutturate

Questo comando esiste affinché la wiki possa evolvere in sicurezza senza modificare manualmente i blocchi gestiti.

### `wiki bridge import`

Importa artefatti di memoria pubblici dal Plugin di memoria attiva in pagine sorgente basate su bridge.

Usalo in modalità `bridge` quando vuoi importare nel vault wiki gli artefatti di memoria esportati più recenti.

Per le letture attive di artefatti bridge, la CLI instrada l'importazione tramite Gateway RPC, così l'importazione usa il contesto runtime del Plugin di memoria. Se le importazioni bridge sono disabilitate o le letture degli artefatti sono disattivate, il comando mantiene il comportamento locale/offline a importazione zero.

### `wiki unsafe-local import`

Importa da percorsi locali configurati esplicitamente in modalità `unsafe-local`.

Questa funzionalità è intenzionalmente sperimentale e limitata alla stessa macchina.

### `wiki obsidian ...`

Comandi helper Obsidian per vault eseguiti in modalità compatibile con Obsidian.

Sottocomandi:

- `status`
- `search`
- `open`
- `command`
- `daily`

Questi richiedono la CLI ufficiale `obsidian` in `PATH` quando `obsidian.useOfficialCli` è abilitato.

## Indicazioni pratiche d'uso

- Usa `wiki search` + `wiki get` quando la provenienza e l'identità della pagina sono importanti.
- Usa `wiki apply` invece di modificare a mano le sezioni generate gestite.
- Usa `wiki lint` prima di fidarti di contenuti contraddittori o a bassa attendibilità.
- Usa `wiki compile` dopo importazioni massive o modifiche alle sorgenti quando vuoi subito dashboard e digest compilati aggiornati.
- Usa `wiki bridge import` quando la modalità bridge dipende da artefatti di memoria appena esportati.

## Collegamenti alla configurazione

Il comportamento di `openclaw wiki` è determinato da:

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
