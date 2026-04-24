---
read_when:
    - Vuoi capire come funziona Memory
    - Vuoi sapere quali file di memoria scrivere
summary: Come OpenClaw ricorda le cose tra una sessione e l'altra
title: Panoramica di Memory
x-i18n:
    generated_at: "2026-04-24T08:37:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 761eac6d5c125ae5734dbd654032884846706e50eb8ef7942cdb51b74a1e73d4
    source_path: concepts/memory.md
    workflow: 15
---

OpenClaw ricorda le cose scrivendo **semplici file Markdown** nello spazio di
lavoro del tuo agente. Il modello “ricorda” solo ciò che viene salvato su disco -- non esiste
uno stato nascosto.

## Come funziona

Il tuo agente ha tre file collegati alla memoria:

- **`MEMORY.md`** -- memoria a lungo termine. Fatti durevoli, preferenze e
  decisioni. Caricato all'inizio di ogni sessione DM.
- **`memory/YYYY-MM-DD.md`** -- note giornaliere. Contesto e osservazioni in corso.
  Le note di oggi e di ieri vengono caricate automaticamente.
- **`DREAMS.md`** (facoltativo) -- diario dei sogni e riepiloghi delle
  sweep di Dreaming per revisione umana, incluse voci storiche di backfill ancorato.

Questi file si trovano nello spazio di lavoro dell'agente (predefinito `~/.openclaw/workspace`).

<Tip>
Se vuoi che il tuo agente ricordi qualcosa, basta chiederglielo: "Ricorda che
preferisco TypeScript." Lo scriverà nel file appropriato.
</Tip>

## Strumenti di memoria

L'agente ha due strumenti per lavorare con la memoria:

- **`memory_search`** -- trova note rilevanti usando la ricerca semantica, anche quando
  la formulazione differisce dall'originale.
- **`memory_get`** -- legge un file di memoria specifico o un intervallo di righe.

Entrambi gli strumenti sono forniti dal Plugin di memoria attivo (predefinito: `memory-core`).

## Plugin companion Memory Wiki

Se vuoi che la memoria durevole si comporti più come una base di conoscenza mantenuta che
come semplici note grezze, usa il Plugin incluso `memory-wiki`.

`memory-wiki` compila la conoscenza durevole in un vault wiki con:

- struttura di pagina deterministica
- claim ed evidenze strutturati
- tracciamento di contraddizioni e aggiornamento
- dashboard generate
- digest compilati per i consumer dell'agente/runtime
- strumenti nativi wiki come `wiki_search`, `wiki_get`, `wiki_apply` e `wiki_lint`

Non sostituisce il Plugin di memoria attivo. Il Plugin di memoria attivo continua
a gestire richiamo, promozione e Dreaming. `memory-wiki` aggiunge al suo fianco
un livello di conoscenza ricco di provenienza.

Vedi [Memory Wiki](/it/plugins/memory-wiki).

## Ricerca nella memoria

Quando è configurato un provider di embedding, `memory_search` usa la **ricerca
ibrida** -- combinando similarità vettoriale (significato semantico) e corrispondenza per parole chiave
(termini esatti come ID e simboli di codice). Funziona immediatamente una volta che hai
una chiave API per qualsiasi provider supportato.

<Info>
OpenClaw rileva automaticamente il tuo provider di embedding dalle chiavi API disponibili. Se
hai configurato una chiave OpenAI, Gemini, Voyage o Mistral, la ricerca nella memoria è
abilitata automaticamente.
</Info>

Per dettagli su come funziona la ricerca, opzioni di regolazione e configurazione dei provider, vedi
[Memory Search](/it/concepts/memory-search).

## Backend di memoria

<CardGroup cols={3}>
<Card title="Integrato (predefinito)" icon="database" href="/it/concepts/memory-builtin">
Basato su SQLite. Funziona subito con ricerca per parole chiave, similarità vettoriale e
ricerca ibrida. Nessuna dipendenza aggiuntiva.
</Card>
<Card title="QMD" icon="search" href="/it/concepts/memory-qmd">
Sidecar local-first con reranking, espansione della query e capacità di indicizzare
directory esterne allo spazio di lavoro.
</Card>
<Card title="Honcho" icon="brain" href="/it/concepts/memory-honcho">
Memoria cross-session AI-native con modellazione dell'utente, ricerca semantica e
consapevolezza multi-agente. Installazione Plugin.
</Card>
</CardGroup>

## Livello wiki della conoscenza

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/it/plugins/memory-wiki">
Compila la memoria durevole in un vault wiki ricco di provenienza con claim,
dashboard, modalità bridge e flussi di lavoro compatibili con Obsidian.
</Card>
</CardGroup>

## Flush automatico della memoria

Prima che la [Compaction](/it/concepts/compaction) riassuma la tua conversazione, OpenClaw
esegue un turno silenzioso che ricorda all'agente di salvare il contesto importante nei file di memoria.
Questo è attivo per impostazione predefinita -- non devi configurare nulla.

<Tip>
Il flush della memoria previene la perdita di contesto durante la Compaction. Se il tuo agente ha
fatti importanti nella conversazione che non sono ancora stati scritti in un file, questi
verranno salvati automaticamente prima che avvenga il riepilogo.
</Tip>

## Dreaming

Dreaming è un passaggio facoltativo di consolidamento in background per la memoria. Raccoglie
segnali a breve termine, assegna un punteggio ai candidati e promuove nella
memoria a lungo termine (`MEMORY.md`) solo gli elementi qualificati.

È progettato per mantenere alta la qualità del segnale nella memoria a lungo termine:

- **Opt-in**: disabilitato per impostazione predefinita.
- **Pianificato**: quando è abilitato, `memory-core` gestisce automaticamente un job Cron ricorrente
  per una sweep completa di Dreaming.
- **Con soglia**: le promozioni devono superare soglie di punteggio, frequenza di richiamo e
  diversità delle query.
- **Rivedibile**: riepiloghi di fase e voci del diario vengono scritti in `DREAMS.md`
  per revisione umana.

Per comportamento delle fasi, segnali di punteggio e dettagli del diario dei sogni, vedi
[Dreaming](/it/concepts/dreaming).

## Backfill ancorato e promozione live

Il sistema Dreaming ora ha due percorsi di revisione strettamente correlati:

- **Dreaming live** lavora dall'archivio Dreaming a breve termine sotto
  `memory/.dreams/` ed è ciò che la normale fase profonda usa quando decide cosa
  può essere promosso in `MEMORY.md`.
- **Backfill ancorato** legge le note storiche `memory/YYYY-MM-DD.md` come
  file giornalieri autonomi e scrive output di revisione strutturato in `DREAMS.md`.

Il backfill ancorato è utile quando vuoi ripercorrere note più vecchie e ispezionare cosa
il sistema ritiene durevole senza modificare manualmente `MEMORY.md`.

Quando usi:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

i candidati durevoli ancorati non vengono promossi direttamente. Vengono messi in stage
nello stesso archivio Dreaming a breve termine che la normale fase profonda già usa. Questo
significa:

- `DREAMS.md` resta la superficie di revisione umana.
- l'archivio a breve termine resta la superficie di ranking lato macchina.
- `MEMORY.md` continua a essere scritto solo dalla promozione profonda.

Se decidi che il replay non era utile, puoi rimuovere gli artefatti messi in stage
senza toccare le normali voci del diario o il normale stato di richiamo:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Controlla stato dell'indice e provider
openclaw memory search "query"  # Cerca dalla riga di comando
openclaw memory index --force   # Ricostruisce l'indice
```

## Approfondimenti

- [Builtin Memory Engine](/it/concepts/memory-builtin) -- backend SQLite predefinito
- [QMD Memory Engine](/it/concepts/memory-qmd) -- sidecar avanzato local-first
- [Honcho Memory](/it/concepts/memory-honcho) -- memoria cross-session AI-native
- [Memory Wiki](/it/plugins/memory-wiki) -- vault di conoscenza compilato e strumenti wiki-native
- [Memory Search](/it/concepts/memory-search) -- pipeline di ricerca, provider e
  regolazione
- [Dreaming](/it/concepts/dreaming) -- promozione in background
  dal richiamo a breve termine alla memoria a lungo termine
- [Riferimento configurazione Memory](/it/reference/memory-config) -- tutte le opzioni di configurazione
- [Compaction](/it/concepts/compaction) -- come la Compaction interagisce con la memoria

## Correlati

- [Active Memory](/it/concepts/active-memory)
- [Memory Search](/it/concepts/memory-search)
- [Builtin memory engine](/it/concepts/memory-builtin)
- [Honcho memory](/it/concepts/memory-honcho)
