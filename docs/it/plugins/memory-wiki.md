---
read_when:
    - Vuoi conoscenza persistente oltre alle semplici note MEMORY.md
    - Stai configurando il Plugin memory-wiki incluso
    - Vuoi comprendere wiki_search, wiki_get o la modalità bridge
summary: 'memory-wiki: archivio di conoscenza compilato con provenienza, affermazioni, dashboard e modalità bridge'
title: Wiki della memoria
x-i18n:
    generated_at: "2026-06-27T17:51:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91512fbab8bfa87d3be29a75c217f99dbae11d9d7065fcc5ae9aa2c51847ec42
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` è un Plugin in bundle che trasforma la memoria durevole in un
vault di conoscenza compilato.

**Non** sostituisce il Plugin di memoria attiva. Il Plugin di memoria attiva
continua a gestire richiamo, promozione, indicizzazione e Dreaming. `memory-wiki`
lo affianca e compila la conoscenza durevole in una wiki navigabile con pagine
deterministiche, affermazioni strutturate, provenienza, dashboard e digest
leggibili dalle macchine.

Usalo quando vuoi che la memoria si comporti più come un livello di conoscenza
mantenuto e meno come un insieme disordinato di file Markdown.

## Cosa aggiunge

- Un vault wiki dedicato con layout di pagina deterministico
- Metadati strutturati per affermazioni e prove, non solo prosa
- Provenienza, confidenza, contraddizioni e domande aperte a livello di pagina
- Digest compilati per agent/runtime consumer
- Strumenti wiki-nativi per cercare/ottenere/applicare/controllare
- Importazioni Open Knowledge Format in concetti wiki compilati
- Modalità bridge opzionale che importa artefatti pubblici dal Plugin di memoria attiva
- Modalità di rendering compatibile con Obsidian e integrazione CLI opzionali

## Come si integra con la memoria

Pensa alla separazione in questo modo:

| Livello                                                 | Responsabilità                                                                            |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Plugin di memoria attiva (`memory-core`, QMD, Honcho, ecc.) | Richiamo, ricerca semantica, promozione, Dreaming, runtime della memoria                  |
| `memory-wiki`                                           | Pagine wiki compilate, sintesi ricche di provenienza, dashboard, ricerca/get/apply specifici della wiki |

Se il Plugin di memoria attiva espone artefatti di richiamo condivisi, OpenClaw può cercare
in entrambi i livelli in un unico passaggio con `memory_search corpus=all`.

Quando hai bisogno di ranking specifico della wiki, provenienza o accesso diretto alle pagine,
usa invece gli strumenti wiki-nativi.

## Pattern ibrido consigliato

Un buon default per configurazioni local-first è:

- QMD come backend di memoria attiva per richiamo e ampia ricerca semantica
- `memory-wiki` in modalità `bridge` per pagine di conoscenza durevole sintetizzata

Questa separazione funziona bene perché ogni livello resta focalizzato:

- QMD mantiene ricercabili note grezze, esportazioni di sessione e raccolte aggiuntive
- `memory-wiki` compila entità stabili, affermazioni, dashboard e pagine sorgente

Regola pratica:

- usa `memory_search` quando vuoi un unico passaggio di richiamo ampio sulla memoria
- usa `wiki_search` e `wiki_get` quando vuoi risultati wiki consapevoli della provenienza
- usa `memory_search corpus=all` quando vuoi che la ricerca condivisa copra entrambi i livelli

Se la modalità bridge segnala zero artefatti esportati, il Plugin di memoria attiva
non sta ancora esponendo input bridge pubblici. Esegui prima `openclaw wiki doctor`,
poi conferma che il Plugin di memoria attiva supporti artefatti pubblici.

Quando la modalità bridge è attiva e `bridge.readMemoryArtifacts` è abilitato,
`openclaw wiki status`, `openclaw wiki doctor` e `openclaw wiki bridge
import` leggono tramite il Gateway in esecuzione. Questo mantiene i controlli bridge della CLI allineati
con il contesto runtime del Plugin di memoria. Se il bridge è disabilitato o le letture degli artefatti
sono disattivate, quei comandi mantengono il loro comportamento locale/offline.

## Modalità del vault

`memory-wiki` supporta tre modalità del vault:

### `isolated`

Vault proprio, sorgenti proprie, nessuna dipendenza da `memory-core`.

Usala quando vuoi che la wiki sia un archivio di conoscenza curato autonomo.

### `bridge`

Legge artefatti di memoria pubblici ed eventi di memoria dal Plugin di memoria attiva
tramite interfacce pubbliche del plugin SDK.

Usala quando vuoi che la wiki compili e organizzi gli artefatti esportati dal Plugin di memoria
senza accedere agli internals privati del Plugin.

La modalità bridge può indicizzare:

- artefatti di memoria esportati
- report dei dream
- note giornaliere
- file radice della memoria
- log degli eventi di memoria

### `unsafe-local`

Via di fuga esplicita sulla stessa macchina per percorsi locali privati.

Questa modalità è intenzionalmente sperimentale e non portabile. Usala solo quando
comprendi il confine di fiducia e hai specificamente bisogno di accesso al filesystem locale che
la modalità bridge non può fornire.

## Layout del vault

Il Plugin inizializza un vault così:

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

Il contenuto gestito resta all'interno di blocchi generati. I blocchi di note umane sono preservati.

I gruppi principali di pagine sono:

- `sources/` per materiale grezzo importato e pagine supportate dal bridge
- `entities/` per cose, persone, sistemi, progetti e oggetti durevoli
- `concepts/` per idee, astrazioni, pattern e policy
- `syntheses/` per riepiloghi compilati e rollup mantenuti
- `reports/` per dashboard generate

## Importazioni Open Knowledge Format

`memory-wiki` può importare bundle Open Knowledge Format estratti con:

```bash
openclaw wiki okf import ./bundles/ga4
```

Questa è la soluzione più pulita quando un catalogo dati, un crawler di documentazione o
un agent di arricchimento produce già OKF: mantieni OKF come artefatto di scambio portabile,
poi lascia che `memory-wiki` lo trasformi in pagine concetto native di OpenClaw e
digest compilati.

L'importer segue la struttura OKF v0.1:

- i file `.md` non riservati sono documenti concetto
- ogni concetto importato richiede un campo frontmatter `type` non vuoto
- i valori OKF `type` sconosciuti sono accettati
- i file riservati `index.md` e `log.md` non vengono importati come concetti
- i link markdown interrotti o esterni sono preservati

Le pagine dei concetti importate vengono appiattite sotto `concepts/` in modo che i percorsi esistenti di compilazione, ricerca, recupero, dashboard e prompt-digest le vedano senza aggiungere un secondo albero wiki. Ogni pagina mantiene l'ID concetto OKF originale, il percorso sorgente, `type`, `resource`, `tags`, timestamp e l'intero frontmatter del produttore. I link OKF interni vengono riscritti verso le pagine concetto wiki generate ed emessi anche come voci strutturate `relationships` con `kind: okf-link`.

## Affermazioni strutturate ed evidenze

Le pagine possono contenere frontmatter `claims` strutturato, non solo testo libero.

Ogni affermazione può includere:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

Le voci di evidenza possono includere:

- `kind`
- `sourceId`
- `path`
- `lines`
- `weight`
- `confidence`
- `privacyTier`
- `note`
- `updatedAt`

Questo è ciò che fa agire il wiki più come uno strato di convinzioni che come una raccolta passiva di note. Le affermazioni possono essere tracciate, valutate, contestate e ricondotte alle fonti.

## Metadati delle entità per gli agenti

Le pagine entità possono contenere anche metadati di instradamento per l'uso da parte degli agenti. Si tratta di frontmatter generico, quindi funziona per persone, team, sistemi, progetti o qualsiasi altro tipo di entità.

I campi comuni includono:

- `entityType`: per esempio `person`, `team`, `system` o `project`
- `canonicalId`: chiave di identità stabile usata tra alias e importazioni
- `aliases`: nomi, handle o etichette che devono risolversi alla stessa pagina
- `privacyTier`: `public`, `local-private`, `sensitive` o `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: suggerimenti di instradamento compatti
- `lastRefreshedAt`: timestamp di aggiornamento della fonte separato dall'ora di modifica della pagina
- `personCard`: scheda di instradamento opzionale specifica per persona con handle, social, email, fuso orario, corsia, richieste da fare, richieste da evitare, attendibilità e privacy
- `relationships`: archi tipizzati verso pagine correlate con destinazione, tipo, peso, attendibilità, tipo di evidenza, livello di privacy e nota

Per un wiki delle persone, l'agente dovrebbe di solito iniziare con `reports/person-agent-directory.md`, poi aprire la pagina della persona con `wiki_get` prima di usare dettagli di contatto o fatti dedotti.

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

Il passaggio di compilazione legge le pagine wiki, normalizza i riepiloghi ed emette artefatti stabili destinati alle macchine sotto:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Questi digest esistono in modo che gli agenti e il codice runtime non debbano analizzare pagine Markdown.

L'output compilato alimenta anche:

- indicizzazione wiki di primo passaggio per i flussi search/get
- ricerca degli ID affermazione verso le pagine proprietarie
- supplementi compatti per prompt
- generazione di report/dashboard

## Dashboard e report di salute

Quando `render.createDashboards` è abilitato, la compilazione mantiene dashboard sotto `reports/`.

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
- cluster di affermazioni concorrenti
- affermazioni prive di evidenza strutturata
- pagine e affermazioni a bassa attendibilità
- freschezza obsoleta o sconosciuta
- pagine con domande irrisolte
- schede di instradamento persona/entità
- archi di relazione strutturati
- copertura delle classi di evidenza
- livelli di privacy non pubblici che richiedono revisione prima dell'uso

## Ricerca e recupero

`memory-wiki` supporta due backend di ricerca:

- `shared`: usa il flusso di ricerca della memoria condivisa quando disponibile
- `local`: cerca localmente nel wiki

Supporta inoltre tre corpora:

- `wiki`
- `memory`
- `all`

Comportamento importante:

- `wiki_search` e `wiki_get` usano i digest compilati come primo passaggio quando possibile
- gli ID delle affermazioni possono risolversi alla pagina proprietaria
- le affermazioni contestate/obsolete/fresche influenzano il ranking
- le etichette di provenienza possono sopravvivere nei risultati
- la modalità di ricerca può orientare il ranking per la ricerca di persone, l'instradamento delle domande, l'evidenza delle fonti o le affermazioni grezze

Regola pratica:

- usa `memory_search corpus=all` per un ampio passaggio di richiamo
- usa `wiki_search` + `wiki_get` quando ti interessano ranking specifico del wiki, provenienza o struttura delle convinzioni a livello di pagina

Modalità di ricerca:

- `auto`: impostazione predefinita bilanciata
- `find-person`: potenzia entità simili a persone, alias, handle, social e ID canonici
- `route-question`: potenzia schede agente, suggerimenti ask-for, suggerimenti best-used-for e contesto delle relazioni
- `source-evidence`: potenzia pagine sorgente e metadati di evidenza strutturata
- `raw-claim`: potenzia le affermazioni strutturate corrispondenti e restituisce metadati di affermazione/evidenza nei risultati

Quando un risultato corrisponde a un'affermazione strutturata, `wiki_search` può restituire `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` e `evidenceSourceIds` nel suo payload dei dettagli. Anche l'output testuale include righe compatte `Claim:` ed `Evidence:` quando disponibili.

## Strumenti per agenti

Il Plugin registra questi strumenti:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Cosa fanno:

- `wiki_status`: modalità vault corrente, salute, disponibilità della CLI Obsidian
- `wiki_search`: cerca pagine wiki e, quando configurato, corpora di memoria condivisa; accetta `mode` per ricerca di persone, instradamento delle domande, evidenza delle fonti o drilldown delle affermazioni grezze
- `wiki_get`: legge una pagina wiki per ID/percorso o ripiega sul corpus di memoria condivisa
- `wiki_apply`: mutazioni ristrette di sintesi/metadati senza interventi liberi sulla pagina
- `wiki_lint`: controlli strutturali, lacune di provenienza, contraddizioni, domande aperte

Il plugin registra anche un supplemento di corpus di memoria non esclusivo, quindi
`memory_search` e `memory_get` condivisi possono raggiungere la wiki quando il plugin di memoria attiva
supporta la selezione del corpus.

## Comportamento di prompt e contesto

Quando `context.includeCompiledDigestPrompt` è abilitato, le sezioni del prompt di memoria
aggiungono uno snapshot compilato compatto da `agent-digest.json`.

Quello snapshot è intenzionalmente piccolo e ad alto valore informativo:

- solo pagine principali
- solo claim principali
- conteggio delle contraddizioni
- conteggio delle domande
- qualificatori di confidenza/freschezza

Questa opzione è opt-in perché cambia la forma del prompt ed è utile soprattutto per motori di contesto
o assemblaggi di prompt legacy che consumano esplicitamente supplementi di memoria.

## Configurazione

Metti la configurazione sotto `plugins.entries.memory-wiki.config`:

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

Interruttori principali:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` o `obsidian`
- `bridge.readMemoryArtifacts`: importa gli artefatti pubblici del plugin di memoria attiva
- `bridge.followMemoryEvents`: include i log degli eventi in modalità bridge
- `search.backend`: `shared` o `local`
- `search.corpus`: `wiki`, `memory` o `all`
- `context.includeCompiledDigestPrompt`: aggiunge uno snapshot compatto del digest alle sezioni del prompt di memoria
- `render.createBacklinks`: genera blocchi correlati deterministici
- `render.createDashboards`: genera pagine dashboard

### Esempio: QMD + modalità bridge

Usa questa modalità quando vuoi QMD per il richiamo e `memory-wiki` per un livello
di conoscenza mantenuto:

```json5
{
  memory: {
    backend: "qmd",
  },
  plugins: {
    entries: {
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

- QMD responsabile del richiamo della memoria attiva
- `memory-wiki` focalizzato su pagine compilate e dashboard
- forma del prompt invariata finché non abiliti intenzionalmente i prompt con digest compilato

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

Vedi [CLI: wiki](/it/cli/wiki) per il riferimento completo dei comandi.

## Supporto Obsidian

Quando `vault.renderMode` è `obsidian`, il plugin scrive Markdown compatibile con Obsidian
e può opzionalmente usare la CLI ufficiale `obsidian`.

I workflow supportati includono:

- verifica dello stato
- ricerca nel vault
- apertura di una pagina
- invocazione di un comando Obsidian
- passaggio alla nota giornaliera

Questo è opzionale. La wiki funziona comunque in modalità nativa senza Obsidian.

## Workflow consigliato

1. Mantieni il tuo plugin di memoria attiva per richiamo/promozione/dreaming.
2. Abilita `memory-wiki`.
3. Inizia con la modalità `isolated` a meno che tu non voglia esplicitamente la modalità bridge.
4. Usa `wiki_search` / `wiki_get` quando la provenienza è importante.
5. Usa `wiki_apply` per sintesi mirate o aggiornamenti dei metadati.
6. Esegui `wiki_lint` dopo modifiche significative.
7. Attiva le dashboard se vuoi visibilità su elementi obsoleti/contraddizioni.

## Documenti correlati

- [Panoramica della memoria](/it/concepts/memory)
- [CLI: memory](/it/cli/memory)
- [CLI: wiki](/it/cli/wiki)
- [Panoramica del Plugin SDK](/it/plugins/sdk-overview)
