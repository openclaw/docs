---
read_when:
    - Vuoi conoscenza persistente oltre le semplici note in MEMORY.md
    - Stai configurando il plugin bundled memory-wiki
    - Vuoi capire wiki_search, wiki_get o la modalità bridge
summary: 'memory-wiki: archivio di conoscenza compilato con provenienza, affermazioni, dashboard e modalità bridge'
title: Memory wiki
x-i18n:
    generated_at: "2026-04-24T08:52:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9b2637514878a87f57f1f7d19128f0a4f622852c1a25d632410cb679f081b8e
    source_path: plugins/memory-wiki.md
    workflow: 15
---

`memory-wiki` è un plugin bundled che trasforma la memoria durevole in un
archivio di conoscenza compilato.

Non sostituisce il plugin di memoria attivo. Il plugin di memoria attivo continua
a gestire recall, promozione, indicizzazione e Dreaming. `memory-wiki` si affianca a esso
e compila la conoscenza durevole in un wiki navigabile con pagine deterministiche,
affermazioni strutturate, provenienza, dashboard e digest leggibili da macchina.

Usalo quando vuoi che la memoria si comporti più come un livello di conoscenza mantenuto e
meno come un mucchio di file Markdown.

## Cosa aggiunge

- Un archivio wiki dedicato con layout di pagina deterministico
- Metadati strutturati di affermazioni ed evidenze, non solo prosa
- Provenienza a livello di pagina, confidenza, contraddizioni e domande aperte
- Digest compilati per agenti/consumer runtime
- Strumenti search/get/apply/lint nativi del wiki
- Modalità bridge facoltativa che importa artefatti pubblici dal plugin di memoria attivo
- Modalità di rendering compatibile con Obsidian e integrazione CLI facoltative

## Come si integra con la memoria

Pensa alla divisione così:

| Livello                                                 | Gestisce                                                                                  |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Plugin di memoria attivo (`memory-core`, QMD, Honcho, ecc.) | Recall, ricerca semantica, promozione, Dreaming, runtime della memoria                    |
| `memory-wiki`                                           | Pagine wiki compilate, sintesi ricche di provenienza, dashboard, wiki-specific search/get/apply |

Se il plugin di memoria attivo espone artefatti di recall condivisi, OpenClaw può cercare
entrambi i livelli in un unico passaggio con `memory_search corpus=all`.

Quando ti servono ranking wiki-specifici, provenienza o accesso diretto alle pagine, usa invece gli
strumenti nativi del wiki.

## Modello ibrido consigliato

Un'impostazione predefinita solida per setup local-first è:

- QMD come backend di memoria attivo per recall e ricerca semantica ampia
- `memory-wiki` in modalità `bridge` per pagine di conoscenza durevoli e sintetizzate

Questa divisione funziona bene perché ogni livello resta focalizzato:

- QMD mantiene ricercabili note grezze, esportazioni di sessione e collezioni aggiuntive
- `memory-wiki` compila entità stabili, affermazioni, dashboard e pagine sorgente

Regola pratica:

- usa `memory_search` quando vuoi un ampio passaggio di recall su tutta la memoria
- usa `wiki_search` e `wiki_get` quando vuoi risultati wiki con consapevolezza della provenienza
- usa `memory_search corpus=all` quando vuoi che la ricerca condivisa copra entrambi i livelli

Se la modalità bridge segnala zero artefatti esportati, il plugin di memoria attivo
attualmente non sta ancora esponendo input bridge pubblici. Esegui prima `openclaw wiki doctor`,
poi conferma che il plugin di memoria attivo supporti artefatti pubblici.

## Modalità archivio

`memory-wiki` supporta tre modalità archivio:

### `isolated`

Archivio proprio, sorgenti proprie, nessuna dipendenza da `memory-core`.

Usala quando vuoi che il wiki sia il proprio archivio di conoscenza curato.

### `bridge`

Legge artefatti di memoria pubblici ed eventi di memoria dal plugin di memoria attivo
tramite seam pubblici del Plugin SDK.

Usala quando vuoi che il wiki compili e organizzi gli artefatti esportati dal plugin di memoria
senza raggiungere interni privati del plugin.

La modalità bridge può indicizzare:

- artefatti di memoria esportati
- report Dreaming
- note giornaliere
- file root della memoria
- log degli eventi di memoria

### `unsafe-local`

Escape hatch esplicita della stessa macchina per percorsi privati locali.

Questa modalità è intenzionalmente sperimentale e non portabile. Usala solo quando
comprendi il confine di trust e hai specificamente bisogno dell'accesso al file system locale che
la modalità bridge non può fornire.

## Layout dell'archivio

Il plugin inizializza un archivio così:

```text
<vault>/
  AGENTS.md
  WIKI.md
  index.md
  inbox.md
  entities/
  concepts/
  syntheses/
  sources/
  reports/
  _attachments/
  _views/
  .openclaw-wiki/
```

Il contenuto gestito resta all'interno di blocchi generati. I blocchi di note umane vengono preservati.

I principali gruppi di pagine sono:

- `sources/` per materiale grezzo importato e pagine supportate da bridge
- `entities/` per elementi durevoli, persone, sistemi, progetti e oggetti
- `concepts/` per idee, astrazioni, pattern e policy
- `syntheses/` per riepiloghi compilati e rollup mantenuti
- `reports/` per dashboard generate

## Affermazioni ed evidenze strutturate

Le pagine possono contenere frontmatter strutturato `claims`, non solo testo libero.

Ogni affermazione può includere:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

Le voci di evidenza possono includere:

- `sourceId`
- `path`
- `lines`
- `weight`
- `note`
- `updatedAt`

Questo è ciò che fa agire il wiki più come un livello di credenze che come un semplice
deposito passivo di note. Le affermazioni possono essere tracciate, valutate, contestate e risolte rispetto alle fonti.

## Pipeline di compilazione

Il passaggio di compilazione legge le pagine wiki, normalizza i riepiloghi ed emette
artefatti stabili orientati alla macchina sotto:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Questi digest esistono per permettere ad agenti e codice runtime di non dover fare scraping delle pagine Markdown.

L'output compilato alimenta anche:

- indicizzazione wiki di primo passaggio per i flussi search/get
- lookup degli id delle affermazioni verso le pagine proprietarie
- supplementi di prompt compatti
- generazione di report/dashboard

## Dashboard e report di salute

Quando `render.createDashboards` è abilitato, compile mantiene dashboard sotto
`reports/`.

I report integrati includono:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`

Questi report tracciano aspetti come:

- cluster di note contraddittorie
- cluster di affermazioni concorrenti
- affermazioni prive di evidenza strutturata
- pagine e affermazioni a bassa confidenza
- freschezza obsoleta o sconosciuta
- pagine con domande irrisolte

## Ricerca e recupero

`memory-wiki` supporta due backend di ricerca:

- `shared`: usa il flusso di ricerca memoria condivisa quando disponibile
- `local`: cerca il wiki localmente

Supporta inoltre tre corpora:

- `wiki`
- `memory`
- `all`

Comportamento importante:

- `wiki_search` e `wiki_get` usano i digest compilati come primo passaggio quando possibile
- gli id delle affermazioni possono risolversi alla pagina proprietaria
- affermazioni contestate/obsolete/fresche influenzano il ranking
- le etichette di provenienza possono sopravvivere nei risultati

Regola pratica:

- usa `memory_search corpus=all` per un ampio passaggio di recall
- usa `wiki_search` + `wiki_get` quando ti interessano ranking wiki-specifici,
  provenienza o struttura delle credenze a livello di pagina

## Strumenti dell'agente

Il plugin registra questi strumenti:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Cosa fanno:

- `wiki_status`: modalità archivio corrente, salute, disponibilità della CLI Obsidian
- `wiki_search`: cerca pagine wiki e, quando configurato, corpora di memoria condivisa
- `wiki_get`: legge una pagina wiki per id/percorso oppure usa come fallback il corpus di memoria condivisa
- `wiki_apply`: mutazioni ristrette di sintesi/metadati senza chirurgia libera della pagina
- `wiki_lint`: controlli strutturali, gap di provenienza, contraddizioni, domande aperte

Il plugin registra anche un supplemento non esclusivo del corpus di memoria, così
`memory_search` e `memory_get` condivisi possono raggiungere il wiki quando il plugin di memoria attivo supporta la selezione del corpus.

## Comportamento di prompt e contesto

Quando `context.includeCompiledDigestPrompt` è abilitato, le sezioni di prompt della memoria
aggiungono un'istantanea compilata compatta da `agent-digest.json`.

Questa istantanea è intenzionalmente piccola e ad alto segnale:

- solo pagine principali
- solo affermazioni principali
- conteggio delle contraddizioni
- conteggio delle domande
- qualificatori di confidenza/freschezza

È opt-in perché cambia la forma del prompt ed è utile soprattutto per motori
di contesto o assemblaggio legacy del prompt che consumano esplicitamente supplementi di memoria.

## Configurazione

Inserisci la configurazione sotto `plugins.entries.memory-wiki.config`:

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "isolated",
          vault: {
            path: "~/.openclaw/wiki/main",
            renderMode: "obsidian",
          },
          obsidian: {
            enabled: true,
            useOfficialCli: true,
            vaultName: "OpenClaw Wiki",
            openAfterWrites: false,
          },
          bridge: {
            enabled: false,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          ingest: {
            autoCompile: true,
            maxConcurrentJobs: 1,
            allowUrlIngest: true,
          },
          search: {
            backend: "shared",
            corpus: "wiki",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
          render: {
            preserveHumanBlocks: true,
            createBacklinks: true,
            createDashboards: true,
          },
        },
      },
    },
  },
}
```

Toggle principali:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` oppure `obsidian`
- `bridge.readMemoryArtifacts`: importa gli artefatti pubblici del plugin di memoria attivo
- `bridge.followMemoryEvents`: include log degli eventi in modalità bridge
- `search.backend`: `shared` oppure `local`
- `search.corpus`: `wiki`, `memory` oppure `all`
- `context.includeCompiledDigestPrompt`: aggiunge una compatta istantanea digest alle sezioni di prompt della memoria
- `render.createBacklinks`: genera blocchi correlati deterministici
- `render.createDashboards`: genera pagine dashboard

### Esempio: QMD + modalità bridge

Usalo quando vuoi QMD per recall e `memory-wiki` per un livello di
conoscenza mantenuto:

```json5
{
  memory: {
    backend: "qmd",
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          search: {
            backend: "shared",
            corpus: "all",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
        },
      },
    },
  },
}
```

Questo mantiene:

- QMD responsabile del recall della memoria attiva
- `memory-wiki` focalizzato su pagine compilate e dashboard
- forma del prompt invariata finché non abiliti intenzionalmente i prompt digest compilati

## CLI

`memory-wiki` espone anche una superficie CLI di primo livello:

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha
openclaw wiki apply synthesis "Alpha Summary" --body "..." --source-id source.alpha
openclaw wiki bridge import
openclaw wiki obsidian status
```

Vedi [CLI: wiki](/it/cli/wiki) per il riferimento completo ai comandi.

## Supporto Obsidian

Quando `vault.renderMode` è `obsidian`, il plugin scrive Markdown
compatibile con Obsidian e può facoltativamente usare la CLI ufficiale `obsidian`.

I flussi di lavoro supportati includono:

- probe dello stato
- ricerca nell'archivio
- apertura di una pagina
- invocazione di un comando Obsidian
- salto alla nota giornaliera

Questo è facoltativo. Il wiki continua a funzionare in modalità nativa senza Obsidian.

## Flusso di lavoro consigliato

1. Mantieni il tuo plugin di memoria attivo per recall/promozione/Dreaming.
2. Abilita `memory-wiki`.
3. Inizia con la modalità `isolated` a meno che tu non voglia esplicitamente la modalità bridge.
4. Usa `wiki_search` / `wiki_get` quando la provenienza è importante.
5. Usa `wiki_apply` per sintesi ristrette o aggiornamenti di metadati.
6. Esegui `wiki_lint` dopo modifiche significative.
7. Attiva le dashboard se vuoi visibilità su elementi obsoleti/contraddizioni.

## Documentazione correlata

- [Panoramica Memory](/it/concepts/memory)
- [CLI: memory](/it/cli/memory)
- [CLI: wiki](/it/cli/wiki)
- [Panoramica Plugin SDK](/it/plugins/sdk-overview)
