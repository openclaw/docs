---
read_when:
    - Desideri conoscenze persistenti che vadano oltre semplici note in MEMORY.md
    - Stai configurando il Plugin memory-wiki incluso nel bundle
    - Servono vault wiki separati per gli agenti in un unico Gateway
    - Vuoi comprendere wiki_search, wiki_get o la modalità bridge
summary: 'memory-wiki: archivio di conoscenze compilato con provenienza, affermazioni, dashboard e modalità bridge'
title: Wiki della memoria
x-i18n:
    generated_at: "2026-07-12T07:17:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf6c046bfa062b9df6deaa0753d992f9dbc45e2506d6ed4fb1a2836141a901c7
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` è un plugin incluso che compila conoscenze persistenti in una
wiki navigabile: pagine deterministiche, affermazioni strutturate corredate di prove,
provenienza, dashboard e riepiloghi leggibili dalle macchine.

Non sostituisce il plugin di memoria attiva. Il recupero, la promozione, l'indicizzazione e
il Dreaming restano sotto la responsabilità del backend di memoria configurato
(`memory-core`, QMD, Honcho e così via). `memory-wiki` opera al suo fianco e compila
le conoscenze in un livello wiki mantenuto.

| Livello                  | Responsabilità                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| Plugin di memoria attiva | Recupero, ricerca semantica, promozione, Dreaming, runtime della memoria                    |
| `memory-wiki`            | Pagine wiki compilate, sintesi ricche di provenienza, dashboard, ricerca/lettura/applicazione della wiki |

Regola pratica:

- `memory_search` per un'unica ricerca ampia in tutti i corpora configurati
- `wiki_search` / `wiki_get` quando servono classificazione specifica della wiki, provenienza o struttura delle convinzioni a livello di pagina
- `memory_search corpus=all` per includere entrambi i livelli in una sola chiamata, quando il plugin di memoria attiva supporta la selezione del corpus

Una configurazione comune incentrata sull'esecuzione locale: QMD come backend di memoria attiva per il recupero e
`memory-wiki` in modalità `bridge` per pagine sintetizzate persistenti. Consulta
l'esempio QMD + modalità bridge nella sezione [Configurazione](#configuration).

Se la modalità bridge segnala zero artefatti esportati, il plugin di memoria attiva
non sta attualmente esponendo input bridge pubblici. Esegui prima `openclaw wiki doctor`,
quindi verifica che il plugin di memoria attiva supporti gli artefatti pubblici.

## Modalità del vault

- `isolated` (predefinita): vault e origini propri, senza dipendenze dal plugin di memoria attiva. Usala per un archivio di conoscenze curato e autosufficiente.
- `bridge`: legge gli artefatti pubblici della memoria e i registri degli eventi dal plugin di memoria attiva attraverso le interfacce pubbliche dell'SDK dei plugin. Usala per compilare gli artefatti esportati dal plugin di memoria senza accedere ai suoi componenti interni privati.
- `unsafe-local`: via di fuga esplicita sulla stessa macchina per percorsi locali privati. Intenzionalmente sperimentale e non portabile; usala solo se comprendi il confine di attendibilità e ti serve specificamente un accesso al file system locale che la modalità bridge non può fornire.

La modalità e l'ambito del vault sono scelte separate:

- `vaultMode` determina la provenienza degli input della wiki.
- `vault.scope` determina se tutti gli agenti usano un unico vault o se ogni agente dispone di un vault figlio.

`vault.scope: "global"` è l'impostazione predefinita e mantiene il comportamento
esistente con un singolo vault. Usa `vault.scope: "agent"` con la modalità
`isolated` o `bridge` quando gli agenti non devono condividere pagine wiki,
riepiloghi compilati, risultati di ricerca o scritture.
L'ambito agente non può essere combinato con la modalità `unsafe-local`, perché i
percorsi privati configurati non sono input di proprietà dell'agente. La convalida
della configurazione rifiuta questa combinazione.

La modalità bridge può indicizzare, in base alle opzioni di configurazione `bridge.*`:

- gli artefatti di memoria esportati (`indexMemoryRoot`)
- le note giornaliere (`indexDailyNotes`)
- i rapporti del Dreaming (`indexDreamReports`)
- i registri degli eventi della memoria (`followMemoryEvents`)

Quando la modalità bridge è attiva e `bridge.readMemoryArtifacts` è abilitato,
`openclaw wiki status`, `openclaw wiki doctor` e `openclaw wiki bridge
import` vengono instradati attraverso il Gateway in esecuzione, affinché vedano lo
stesso contesto del plugin di memoria attiva usato dalla memoria dell'agente/runtime.
Se il bridge è disabilitato o la lettura degli artefatti è disattivata, questi
comandi mantengono il comportamento locale/offline.

## Struttura del vault

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

Il contenuto gestito rimane all'interno dei blocchi generati; i blocchi di note
umane vengono mantenuti durante le rigenerazioni.

- `sources/`: materiale grezzo importato e pagine basate su bridge/unsafe-local
- `entities/`: elementi persistenti, persone, sistemi, progetti, oggetti
- `concepts/`: idee, astrazioni, schemi, criteri (anche destinazione delle importazioni OKF)
- `syntheses/`: riepiloghi compilati e aggregazioni mantenute
- `reports/`: dashboard generate

## Importazioni Open Knowledge Format

```bash
openclaw wiki okf import ./bundles/ga4
```

Importa un pacchetto Open Knowledge Format estratto nelle pagine dei concetti
della wiki. È una buona soluzione quando un catalogo dati, un crawler di
documentazione o un agente di arricchimento produce già OKF: mantieni OKF come
artefatto di scambio portabile e lascia che `memory-wiki` lo trasformi in pagine
di concetti native di OpenClaw e in riepiloghi compilati.

- i file `.md` non riservati sono documenti di concetti
- ogni concetto importato richiede un campo frontmatter `type` non vuoto; se `type` è assente, viene generato un avviso `missing-type` e il file viene ignorato
- i valori `type` sconosciuti sono accettati come concetti generici
- `index.md` e `log.md` sono riservati e non vengono mai importati come concetti
- i collegamenti Markdown non validi o esterni vengono lasciati invariati

Le pagine importate vengono appiattite sotto `concepts/`, in modo che i flussi
esistenti di compilazione, ricerca, lettura e dashboard possano utilizzarle senza
un secondo albero wiki. Ogni pagina mantiene l'ID originale del concetto OKF, il
percorso di origine, `type`, `resource`, `tags`, il timestamp e il frontmatter
completo del produttore. I collegamenti OKF interni vengono riscritti verso le
pagine dei concetti wiki generate e producono anche voci `relationships`
strutturate con `kind: okf-link`.

## Affermazioni strutturate e prove

Le pagine contengono frontmatter `claims` strutturato, non soltanto testo libero.
Ogni affermazione può includere `id`, `text`, `status`, `confidence`, `evidence[]`
e `updatedAt`. Ogni voce di prova può includere `kind`, `sourceId`, `path`,
`lines`, `weight`, `confidence`, `privacyTier`, `note` e `updatedAt`.

In questo modo la wiki si comporta come un livello di convinzioni, non come un
deposito passivo di note. Le affermazioni possono essere monitorate, valutate,
contestate e ricondotte alle origini per la risoluzione.

## Metadati delle entità destinati agli agenti

Le pagine delle entità contengono metadati generici di instradamento utilizzabili
per persone, team, sistemi, progetti o qualsiasi altro tipo di entità:

- `entityType`: per esempio `person`, `team`, `system`, `project`
- `canonicalId`: chiave di identità stabile tra alias e importazioni
- `aliases`: nomi, handle o etichette che rimandano alla stessa pagina
- `privacyTier`: stringa in formato libero; `public` è considerato esente da revisione, mentre qualsiasi altro valore (per esempio `local-private`, `sensitive`, `confirm-before-use`) viene segnalato in `reports/privacy-review.md`
- `bestUsedFor` / `notEnoughFor`: indicazioni compatte per l'instradamento
- `lastRefreshedAt`: timestamp di aggiornamento dell'origine, distinto dall'ora di modifica della pagina
- `personCard`: scheda di instradamento facoltativa specifica per una persona (handle, social, email, fuso orario, area, richieste appropriate, richieste da evitare, attendibilità, livello di privacy)
- `relationships`: collegamenti tipizzati a pagine correlate (destinazione, tipo, peso, attendibilità, tipo di prova, livello di privacy, nota)

Per una wiki di persone, inizia da `reports/person-agent-directory.md`, quindi
apri la pagina della persona con `wiki_get` prima di usare dati di contatto o
fatti dedotti.

<Accordion title="Esempio di pagina di un'entità">
```yaml
pageType: entity
entityType: person
id: entity.example-person
canonicalId: maintainer.example-person
aliases:
  - Alex
  - example-handle
privacyTier: local-private
bestUsedFor:
  - Example ecosystem routing
notEnoughFor:
  - legal approval
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@example-handle"
  socials:
    - "https://x.example/example-handle"
  emails:
    - alex@example.com
  timezone: America/Chicago
  lane: Example ecosystem
  askFor:
    - Example rollout questions
  avoidAskingFor:
    - unrelated billing decisions
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.other-person
    targetTitle: Other Person
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.example.routing
    text: Alex is useful for example-ecosystem routing.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```
</Accordion>

## Pipeline di compilazione

La compilazione legge le pagine della wiki, normalizza i riepiloghi e genera
artefatti stabili destinati alle macchine in:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Gli agenti e il codice di runtime leggono questi riepiloghi invece di analizzare
il Markdown. L'output compilato alimenta inoltre l'indicizzazione wiki di primo
passaggio per ricerca/lettura, la risoluzione degli ID delle affermazioni verso
le pagine proprietarie, integrazioni compatte per i prompt e la generazione
dei rapporti.

## Dashboard e rapporti sullo stato

Quando `render.createDashboards` è abilitato, la compilazione mantiene le
dashboard in `reports/`:

| Rapporto                            | Elementi monitorati                                      |
| ----------------------------------- | -------------------------------------------------------- |
| `reports/open-questions.md`         | pagine con domande irrisolte                             |
| `reports/contradictions.md`         | gruppi di note contraddittorie                           |
| `reports/low-confidence.md`         | pagine e affermazioni con scarsa attendibilità           |
| `reports/claim-health.md`           | affermazioni prive di prove strutturate                  |
| `reports/stale-pages.md`            | pagine obsolete o con aggiornamento sconosciuto          |
| `reports/person-agent-directory.md` | schede di instradamento di persone/entità                 |
| `reports/relationship-graph.md`     | collegamenti strutturati tra relazioni                   |
| `reports/provenance-coverage.md`    | copertura delle classi di prova                          |
| `reports/privacy-review.md`         | livelli di privacy non pubblici da esaminare prima dell'uso |

## Ricerca e recupero

Due backend di ricerca:

- `shared`: usa il flusso di ricerca condiviso della memoria, quando disponibile
- `local`: cerca localmente nella wiki

Tre corpora: `wiki`, `memory`, `all`.

- `wiki_search` / `wiki_get` usano, quando possibile, i riepiloghi compilati come primo passaggio
- gli ID delle affermazioni rimandano alla pagina proprietaria
- le affermazioni contestate/obsolete/aggiornate influenzano la classificazione
- le etichette di provenienza vengono mantenute nei risultati

Modalità di ricerca (parametro `--mode` / `mode` dello strumento):

| Modalità          | Elementi favoriti                                                                 |
| ----------------- | --------------------------------------------------------------------------------- |
| `auto`            | impostazione predefinita bilanciata                                                |
| `find-person`     | entità simili a persone, alias, handle, profili social, ID canonici                |
| `route-question`  | schede degli agenti, indicazioni sulle richieste appropriate/sull'uso ottimale, contesto delle relazioni |
| `source-evidence` | pagine di origine e metadati delle prove strutturate                               |
| `raw-claim`       | affermazioni strutturate corrispondenti; restituisce metadati di affermazioni/prove |

Quando un risultato corrisponde a un'affermazione strutturata, `wiki_search`
restituisce `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` ed `evidenceSourceIds` nel payload dei dettagli. L'output testuale
include righe compatte `Claim:` ed `Evidence:` quando disponibili.

## Strumenti per gli agenti

| Strumento     | Scopo                                                                                                                                                                            |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wiki_status` | modalità e ambito attuali del vault, agente risolto, stato di integrità, disponibilità della CLI di Obsidian                                                                      |
| `wiki_search` | cerca nelle pagine wiki e, quando configurato, nel corpus di memoria condiviso; accetta `mode` per cercare persone, instradare domande, ottenere prove dalle fonti o esaminare affermazioni grezze |
| `wiki_get`    | legge una pagina wiki per id/percorso, ripiegando sul corpus di memoria condiviso quando la ricerca condivisa è abilitata e la consultazione non produce risultati                |
| `wiki_apply`  | modifiche mirate a sintesi/metadati senza interventi liberi sulle pagine                                                                                                          |
| `wiki_lint`   | controlli strutturali, lacune nella provenienza, contraddizioni, domande aperte                                                                                                    |

Il plugin registra anche un'integrazione non esclusiva del corpus di memoria, così le funzioni condivise
`memory_search` e `memory_get` possono accedere alla wiki quando il plugin di memoria attivo
supporta la selezione del corpus.

## Comportamento di prompt e contesto

Quando `context.includeCompiledDigestPrompt` è abilitato, le sezioni del prompt di memoria
aggiungono un'istantanea compilata e compatta da `agent-digest.json`: solo le pagine
principali, solo le affermazioni principali, numero di contraddizioni, numero di domande,
qualificatori di attendibilità/aggiornamento. Questa funzionalità è facoltativa perché modifica la struttura del prompt; è rilevante soprattutto
per i motori di contesto o per la composizione dei prompt che utilizzano esplicitamente le
integrazioni della memoria.

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
            scope: "global",
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
          unsafeLocal: {
            allowPrivateMemoryCoreAccess: false,
            paths: [],
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

Opzioni principali:

| Chiave                                     | Valori / predefinito                             | Note                                                                                                   |
| ------------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `vaultMode`                                | `isolated` (predefinito), `bridge`, `unsafe-local` | sceglie il comportamento di input e integrazione                                                       |
| `vault.scope`                              | `global` (predefinito), `agent`                  | un vault condiviso oppure un vault secondario per ciascun agente                                       |
| `vault.path`                               | valore globale predefinito `~/.openclaw/wiki/main` | vault globale esatto; la directory padre per l'ambito agente è per impostazione predefinita `~/.openclaw/wiki` |
| `vault.renderMode`                         | `native` (predefinito), `obsidian`               |                                                                                                        |
| `bridge.readMemoryArtifacts`               | predefinito `true`                               | importa gli artefatti pubblici del plugin di memoria attivo                                            |
| `bridge.followMemoryEvents`                | predefinito `true`                               | include i registri degli eventi in modalità bridge                                                     |
| `unsafeLocal.allowPrivateMemoryCoreAccess` | predefinito `false`                              | necessario per eseguire importazioni `unsafe-local`                                                    |
| `unsafeLocal.paths`                        | predefinito `[]`                                 | percorsi locali espliciti da importare in modalità `unsafe-local`                                      |
| `search.backend`                           | `shared` (predefinito), `local`                  |                                                                                                        |
| `search.corpus`                            | `wiki` (predefinito), `memory`, `all`            |                                                                                                        |
| `context.includeCompiledDigestPrompt`      | predefinito `false`                              | aggiunge alle sezioni del prompt di memoria l'istantanea compatta del riepilogo dell'agente selezionato |
| `render.createBacklinks`                   | predefinito `true`                               | genera blocchi correlati deterministici                                                                |
| `render.createDashboards`                  | predefinito `true`                               | genera pagine di dashboard                                                                             |

### Vault per agente

Imposta `vault.scope` su `agent` per assegnare a ogni agente configurato una wiki separata.
In questo ambito, `vault.path` è una directory padre e OpenClaw aggiunge l'id
normalizzato dell'agente:

```json5
{
  agents: {
    list: [{ id: "support" }, { id: "marketing" }],
  },
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          vault: {
            scope: "agent",
            path: "~/.openclaw/wiki",
          },
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
          },
        },
      },
    },
  },
}
```

Questo produce `~/.openclaw/wiki/support` e
`~/.openclaw/wiki/marketing`. Se `vault.path` viene omesso nell'ambito agente, la
directory padre predefinita è `~/.openclaw/wiki`. L'agente `main` predefinito mantiene quindi
il percorso esistente `~/.openclaw/wiki/main`.

Gli strumenti dell'agente, i riepiloghi compilati del prompt e l'integrazione wiki esposta tramite
`memory_search` / `memory_get` risolvono il vault dal contesto dell'agente attivo.
Per le chiamate CLI e Gateway in una configurazione con più agenti, specifica
esplicitamente l'agente con `openclaw wiki --agent <agentId> ...` oppure con
`agentId` nella richiesta Gateway. Quando non viene fornito alcun id, un singolo agente configurato
rimane quello predefinito.

In modalità bridge, le importazioni con ambito agente accettano un artefatto di memoria pubblico solo quando
il relativo `agentIds` include l'agente selezionato. Gli artefatti appartenenti a un altro agente,
privi di metadati di proprietà o con un proprietario sconosciuto vengono ignorati. L'ambito globale
mantiene il comportamento esistente per gli artefatti condivisi.

<Warning>
La modifica di `vault.scope` non copia né suddivide un vault esistente. Nell'ambito agente,
un valore `vault.path` configurato esplicitamente diventa una directory padre; pertanto sposta o
importa intenzionalmente le pagine esistenti prima di trasferire gli agenti di produzione. Prima
esegui il backup del vault.

I vault per agente costituiscono un confine di conoscenza nello stesso processo, non un confine di
sicurezza del sistema operativo. I plugin e gli strumenti non isolati con accesso al file system dell'host possono
comunque leggere la directory di un altro agente. Usa l'[isolamento](/it/gateway/sandboxing) o
[profili Gateway separati](/it/gateway/multiple-gateways) quando gli agenti non si considerano
reciprocamente attendibili.
</Warning>

### Esempio: QMD + modalità bridge

Usa questa configurazione quando vuoi QMD per il recupero e `memory-wiki` come livello di
conoscenza gestito. Ogni livello rimane focalizzato sul proprio compito: QMD mantiene ricercabili
le note grezze, le esportazioni delle sessioni e le raccolte aggiuntive, mentre `memory-wiki` compila
entità stabili, affermazioni, dashboard e pagine delle fonti.

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

Questo mantiene QMD responsabile del recupero della memoria attiva, `memory-wiki` concentrato sulle
pagine compilate e sulle dashboard e la struttura del prompt invariata finché non abiliti
intenzionalmente i prompt con riepiloghi compilati.

## CLI

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

Consulta [CLI: wiki](/it/cli/wiki) per il riferimento completo dei comandi, inclusi
`wiki okf import`, `wiki apply metadata`, `wiki unsafe-local import`,
`wiki chatgpt import` / `wiki chatgpt rollback` e l'intero insieme di sottocomandi `wiki obsidian`.

## Supporto per Obsidian

Quando `vault.renderMode` è `obsidian`, il plugin scrive Markdown compatibile con Obsidian
e può facoltativamente usare la CLI ufficiale `obsidian` per verificare lo stato,
cercare nel vault, aprire una pagina, richiamare un comando e passare alla
nota giornaliera. Questa funzionalità è facoltativa; la wiki continua a funzionare in modalità nativa senza
Obsidian.

I vault con ambito agente possono comunque usare Markdown compatibile con Obsidian, ma la convalida della
configurazione rifiuta `obsidian.useOfficialCli: true` con `vault.scope: "agent"`.
L'impostazione attuale `obsidian.vaultName` è globale e non può selezionare un vault
Obsidian distinto per ciascun agente. Usa invece gli strumenti wiki e le operazioni della CLI,
oppure mantieni nell'ambito globale una wiki gestita tramite Obsidian.

## Flusso di lavoro consigliato

<Steps>
<Step title="Mantieni il plugin di memoria attiva per il recupero">
Il recupero, la promozione e il Dreaming rimangono sotto la responsabilità del backend di memoria configurato.
</Step>
<Step title="Abilita memory-wiki">
Inizia con la modalità `isolated`, a meno che tu non voglia esplicitamente la modalità bridge.
</Step>
<Step title="Usa wiki_search / wiki_get quando la provenienza è importante">
Preferiscili a `memory_search` quando desideri un ordinamento specifico della wiki o una struttura delle convinzioni a livello di pagina.
</Step>
<Step title="Usa wiki_apply per sintesi mirate o aggiornamenti dei metadati">
Evita di modificare manualmente i blocchi generati e gestiti.
</Step>
<Step title="Esegui wiki_lint dopo modifiche significative">
Rileva contraddizioni, domande aperte e lacune nella provenienza.
</Step>
<Step title="Abilita le dashboard per rendere visibili informazioni obsolete e contraddizioni">
Imposta `render.createDashboards: true` (predefinito).
</Step>
</Steps>

## Documentazione correlata

- [Panoramica della memoria](/it/concepts/memory)
- [CLI: memoria](/it/cli/memory)
- [CLI: wiki](/it/cli/wiki)
- [Panoramica dell'SDK dei Plugin](/it/plugins/sdk-overview)
