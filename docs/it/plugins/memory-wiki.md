---
read_when:
    - Vuoi una conoscenza persistente oltre alle semplici note in MEMORY.md
    - Stai configurando il Plugin memory-wiki incluso
    - Vuoi comprendere wiki_search, wiki_get o la modalità bridge
summary: 'memory-wiki: archivio di conoscenza compilato con provenienza, affermazioni, cruscotti e modalità ponte'
title: Wiki della memoria
x-i18n:
    generated_at: "2026-04-30T09:04:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 744d569f8b0c9b668ea54dc057f808544359eaae87d5557de2e6acd1b31acd89
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` è un plugin in bundle che trasforma la memoria durevole in un vault di conoscenza compilato.

**Non** sostituisce il plugin Active Memory. Il plugin Active Memory continua a
occuparsi di richiamo, promozione, indicizzazione e Dreaming. `memory-wiki` gli sta accanto
e compila la conoscenza durevole in una wiki navigabile con pagine deterministiche,
affermazioni strutturate, provenienza, dashboard e digest leggibili dalla macchina.

Usalo quando vuoi che la memoria si comporti più come un livello di conoscenza mantenuto e
meno come un insieme disordinato di file Markdown.

## Cosa aggiunge

- Un vault wiki dedicato con layout delle pagine deterministico
- Metadati strutturati per affermazioni e prove, non solo prosa
- Provenienza, confidenza, contraddizioni e domande aperte a livello di pagina
- Digest compilati per consumatori agent/runtime
- Strumenti wiki-nativi di ricerca/lettura/applicazione/lint
- Modalità bridge opzionale che importa artefatti pubblici dal plugin Active Memory
- Modalità di rendering opzionale compatibile con Obsidian e integrazione CLI

## Come si integra con la memoria

Pensa alla separazione in questo modo:

| Livello                                                 | Responsabilità                                                                             |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Plugin Active Memory (`memory-core`, QMD, Honcho, ecc.) | Richiamo, ricerca semantica, promozione, Dreaming, runtime della memoria                   |
| `memory-wiki`                                           | Pagine wiki compilate, sintesi ricche di provenienza, dashboard, ricerca/lettura/applicazione specifiche della wiki |

Se il plugin Active Memory espone artefatti di richiamo condivisi, OpenClaw può cercare
in entrambi i livelli in un unico passaggio con `memory_search corpus=all`.

Quando ti servono ranking specifico della wiki, provenienza o accesso diretto alle pagine, usa invece
gli strumenti wiki-nativi.

## Pattern ibrido consigliato

Una buona impostazione predefinita per configurazioni local-first è:

- QMD come backend Active Memory per richiamo e ricerca semantica ampia
- `memory-wiki` in modalità `bridge` per pagine di conoscenza sintetizzata durevole

Questa separazione funziona bene perché ogni livello resta focalizzato:

- QMD mantiene ricercabili note grezze, esportazioni di sessione e raccolte aggiuntive
- `memory-wiki` compila entità stabili, affermazioni, dashboard e pagine sorgente

Regola pratica:

- usa `memory_search` quando vuoi un unico passaggio di richiamo ampio sulla memoria
- usa `wiki_search` e `wiki_get` quando vuoi risultati wiki consapevoli della provenienza
- usa `memory_search corpus=all` quando vuoi che la ricerca condivisa copra entrambi i livelli

Se la modalità bridge segnala zero artefatti esportati, il plugin Active Memory non sta
ancora esponendo input bridge pubblici. Esegui prima `openclaw wiki doctor`,
poi conferma che il plugin Active Memory supporti gli artefatti pubblici.

Quando la modalità bridge è attiva e `bridge.readMemoryArtifacts` è abilitato,
`openclaw wiki status`, `openclaw wiki doctor` e `openclaw wiki bridge
import` leggono attraverso il Gateway in esecuzione. Questo mantiene i controlli bridge della CLI allineati
con il contesto runtime del plugin di memoria. Se bridge è disabilitato o le letture degli artefatti
sono disattivate, questi comandi mantengono il loro comportamento locale/offline.

## Modalità del vault

`memory-wiki` supporta tre modalità del vault:

### `isolated`

Vault proprio, sorgenti proprie, nessuna dipendenza da `memory-core`.

Usala quando vuoi che la wiki sia un archivio di conoscenza curato a sé stante.

### `bridge`

Legge artefatti di memoria pubblici ed eventi di memoria dal plugin Active Memory
attraverso interfacce pubbliche del plugin SDK.

Usala quando vuoi che la wiki compili e organizzi gli artefatti esportati del plugin di memoria
senza accedere a componenti interni privati del plugin.

La modalità bridge può indicizzare:

- artefatti di memoria esportati
- report di Dreaming
- note giornaliere
- file radice della memoria
- log degli eventi di memoria

### `unsafe-local`

Scappatoia esplicita sulla stessa macchina per percorsi privati locali.

Questa modalità è intenzionalmente sperimentale e non portabile. Usala solo quando
comprendi il confine di fiducia e hai specificamente bisogno di accesso al filesystem locale che
la modalità bridge non può fornire.

## Layout del vault

Il plugin inizializza un vault così:

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

I gruppi principali di pagine sono:

- `sources/` per materiale grezzo importato e pagine supportate dal bridge
- `entities/` per elementi durevoli, persone, sistemi, progetti e oggetti
- `concepts/` per idee, astrazioni, pattern e policy
- `syntheses/` per riepiloghi compilati e rollup mantenuti
- `reports/` per dashboard generate

## Affermazioni e prove strutturate

Le pagine possono contenere frontmatter `claims` strutturato, non solo testo libero.

Ogni affermazione può includere:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

Le voci di prova possono includere:

- `kind`
- `sourceId`
- `path`
- `lines`
- `weight`
- `confidence`
- `privacyTier`
- `note`
- `updatedAt`

Questo è ciò che fa agire la wiki più come un livello di credenze che come un deposito passivo di note.
Le affermazioni possono essere tracciate, valutate, contestate e ricondotte alle fonti.

## Metadati delle entità rivolti agli agenti

Le pagine entità possono contenere anche metadati di routing per l'uso da parte degli agenti. Si tratta di
frontmatter generico, quindi funziona per persone, team, sistemi, progetti o qualsiasi altro
tipo di entità.

I campi comuni includono:

- `entityType`: per esempio `person`, `team`, `system` o `project`
- `canonicalId`: chiave di identità stabile usata tra alias e importazioni
- `aliases`: nomi, handle o etichette che devono risolversi alla stessa pagina
- `privacyTier`: `public`, `local-private`, `sensitive` o `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: suggerimenti di routing compatti
- `lastRefreshedAt`: timestamp di aggiornamento della sorgente separato dall'ora di modifica della pagina
- `personCard`: scheda di routing opzionale specifica per la persona con handle, profili social,
  email, fuso orario, corsia, cosa chiedere, cosa evitare di chiedere, confidenza e privacy
- `relationships`: archi tipizzati verso pagine correlate con target, tipo, peso,
  confidenza, tipo di prova, livello di privacy e nota

Per una wiki delle persone, l'agente dovrebbe di solito iniziare da
`reports/person-agent-directory.md`, poi aprire la pagina della persona con `wiki_get`
prima di usare dettagli di contatto o fatti dedotti.

Esempio:

```yaml
pageType: entity
entityType: person
id: entity.brad-groux
canonicalId: maintainer.brad-groux
aliases:
  - Brad
  - bgroux
privacyTier: local-private
bestUsedFor:
  - Microsoft Teams and Azure routing
notEnoughFor:
  - legal approval
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@bgroux"
  socials:
    - "https://x.example/bgroux"
  emails:
    - brad@example.com
  timezone: America/Chicago
  lane: Microsoft ecosystem
  askFor:
    - Teams rollout questions
  avoidAskingFor:
    - unrelated billing decisions
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.alice
    targetTitle: Alice
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.brad.teams
    text: Brad is useful for Microsoft Teams routing.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```

## Pipeline di compilazione

Il passaggio di compilazione legge le pagine wiki, normalizza i riepiloghi ed emette artefatti stabili
rivolti alla macchina in:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Questi digest esistono affinché gli agenti e il codice runtime non debbano estrarre dati dalle pagine
Markdown.

L'output compilato alimenta anche:

- indicizzazione wiki di primo passaggio per flussi di ricerca/lettura
- lookup degli ID affermazione verso le pagine proprietarie
- supplementi compatti per prompt
- generazione di report/dashboard

## Dashboard e report di salute

Quando `render.createDashboards` è abilitato, la compilazione mantiene dashboard in
`reports/`.

I report integrati includono:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`
- `reports/person-agent-directory.md`
- `reports/relationship-graph.md`
- `reports/provenance-coverage.md`
- `reports/privacy-review.md`

Questi report tracciano elementi come:

- cluster di note di contraddizione
- cluster di affermazioni in competizione
- affermazioni prive di prove strutturate
- pagine e affermazioni a bassa confidenza
- freschezza obsoleta o sconosciuta
- pagine con domande irrisolte
- schede di routing persona/entità
- archi di relazione strutturati
- copertura delle classi di prova
- livelli di privacy non pubblici che richiedono revisione prima dell'uso

## Ricerca e recupero

`memory-wiki` supporta due backend di ricerca:

- `shared`: usa il flusso di ricerca della memoria condivisa quando disponibile
- `local`: cerca localmente nella wiki

Supporta anche tre corpora:

- `wiki`
- `memory`
- `all`

Comportamento importante:

- `wiki_search` e `wiki_get` usano i digest compilati come primo passaggio quando possibile
- gli ID affermazione possono risolversi alla pagina proprietaria
- affermazioni contestate/obsolete/fresche influenzano il ranking
- le etichette di provenienza possono sopravvivere nei risultati
- la modalità di ricerca può orientare il ranking per ricerca di persone, routing delle domande, prove
  sorgente o affermazioni grezze

Regola pratica:

- usa `memory_search corpus=all` per un unico passaggio di richiamo ampio
- usa `wiki_search` + `wiki_get` quando ti interessano ranking specifico della wiki,
  provenienza o struttura delle credenze a livello di pagina

Modalità di ricerca:

- `auto`: predefinita bilanciata
- `find-person`: potenzia entità simili a persone, alias, handle, profili social e
  ID canonici
- `route-question`: potenzia schede agente, suggerimenti ask-for, suggerimenti best-used-for e
  contesto delle relazioni
- `source-evidence`: potenzia pagine sorgente e metadati di prova strutturati
- `raw-claim`: potenzia affermazioni strutturate corrispondenti e restituisce metadati
  di affermazione/prova nei risultati

Quando un risultato corrisponde a un'affermazione strutturata, `wiki_search` può restituire
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` e `evidenceSourceIds` nel payload dei dettagli. L'output testuale
include anche righe compatte `Claim:` ed `Evidence:` quando disponibili.

## Strumenti per agenti

Il plugin registra questi strumenti:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Cosa fanno:

- `wiki_status`: modalità del vault corrente, salute, disponibilità della CLI Obsidian
- `wiki_search`: cerca nelle pagine wiki e, quando configurato, nei corpora di memoria condivisa;
  accetta `mode` per ricerca di persone, routing delle domande, prove sorgente o drilldown su affermazioni grezze
- `wiki_get`: legge una pagina wiki per ID/percorso o ripiega sul corpus di memoria condivisa
- `wiki_apply`: mutazioni ristrette di sintesi/metadati senza modifiche libere delle pagine
- `wiki_lint`: controlli strutturali, lacune di provenienza, contraddizioni, domande aperte

Il plugin registra anche un supplemento non esclusivo al corpus di memoria, così
`memory_search` e `memory_get` condivisi possono raggiungere la wiki quando il plugin Active Memory
supporta la selezione del corpus.

## Comportamento di prompt e contesto

Quando `context.includeCompiledDigestPrompt` è abilitato, le sezioni di prompt della memoria
aggiungono una snapshot compilata compatta da `agent-digest.json`.

Quella snapshot è intenzionalmente piccola e ad alto segnale:

- solo pagine principali
- solo affermazioni principali
- conteggio delle contraddizioni
- conteggio delle domande
- qualificatori di confidenza/freschezza

È opt-in perché cambia la forma del prompt ed è principalmente utile per motori di contesto
o assembly di prompt legacy che consumano esplicitamente supplementi di memoria.

## Configurazione

Inserisci la configurazione in `plugins.entries.memory-wiki.config`:

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

Opzioni chiave:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` o `obsidian`
- `bridge.readMemoryArtifacts`: importa gli artefatti pubblici del plugin Active Memory
- `bridge.followMemoryEvents`: include i log degli eventi in modalità bridge
- `search.backend`: `shared` o `local`
- `search.corpus`: `wiki`, `memory` o `all`
- `context.includeCompiledDigestPrompt`: aggiunge uno snapshot compatto del digest alle sezioni del prompt di memoria
- `render.createBacklinks`: genera blocchi correlati deterministici
- `render.createDashboards`: genera pagine dashboard

### Esempio: modalità QMD + bridge

Usalo quando vuoi QMD per il richiamo e `memory-wiki` per un livello di
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

- QMD responsabile del richiamo della Active Memory
- `memory-wiki` focalizzato su pagine compilate e dashboard
- la forma del prompt invariata finché non abiliti intenzionalmente i prompt di digest compilati

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

Consulta [CLI: wiki](/it/cli/wiki) per il riferimento completo dei comandi.

## Supporto Obsidian

Quando `vault.renderMode` è `obsidian`, il plugin scrive Markdown compatibile con
Obsidian e può opzionalmente usare la CLI ufficiale `obsidian`.

I workflow supportati includono:

- rilevamento dello stato
- ricerca nel vault
- apertura di una pagina
- invocazione di un comando Obsidian
- passaggio alla nota giornaliera

Questo è facoltativo. La wiki funziona comunque in modalità nativa senza Obsidian.

## Workflow consigliato

1. Mantieni il tuo plugin Active Memory per richiamo/promozione/Dreaming.
2. Abilita `memory-wiki`.
3. Inizia con la modalità `isolated`, a meno che tu non voglia esplicitamente la modalità bridge.
4. Usa `wiki_search` / `wiki_get` quando la provenienza è importante.
5. Usa `wiki_apply` per sintesi circoscritte o aggiornamenti dei metadati.
6. Esegui `wiki_lint` dopo modifiche significative.
7. Attiva le dashboard se vuoi visibilità su elementi obsoleti/contraddizioni.

## Documenti correlati

- [Panoramica della memoria](/it/concepts/memory)
- [CLI: memory](/it/cli/memory)
- [CLI: wiki](/it/cli/wiki)
- [Panoramica del Plugin SDK](/it/plugins/sdk-overview)
