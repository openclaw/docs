---
read_when:
    - Vuoi capire come funziona la memoria
    - Vuoi sapere quali file di memoria scrivere
summary: Come OpenClaw ricorda le informazioni tra le sessioni
title: Panoramica della memoria
x-i18n:
    generated_at: "2026-04-30T08:46:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: ecf6cf2c95ce3ee78d62923e795f16957088f0eb6620ed50647cff05b99bd572
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw ricorda le cose scrivendo **semplici file Markdown** nello spazio di lavoro del tuo agente. Il modello "ricorda" solo ciò che viene salvato su disco: non esiste alcuno stato nascosto.

## Come funziona

Il tuo agente ha tre file relativi alla memoria:

- **`MEMORY.md`** — memoria a lungo termine. Fatti, preferenze e decisioni durevoli. Caricato all'inizio di ogni sessione DM.
- **`memory/YYYY-MM-DD.md`** — note giornaliere. Contesto e osservazioni correnti. Le note di oggi e di ieri vengono caricate automaticamente.
- **`DREAMS.md`** (facoltativo) — Diario dei sogni e riepiloghi delle scansioni di Dreaming per la revisione umana, incluse voci di backfill storico fondate su evidenze.

Questi file si trovano nello spazio di lavoro dell'agente (predefinito `~/.openclaw/workspace`).

<Tip>
Se vuoi che il tuo agente ricordi qualcosa, chiediglielo semplicemente: "Ricorda che preferisco TypeScript." Lo scriverà nel file appropriato.
</Tip>

## Impegni inferiti

Alcuni follow-up futuri non sono fatti durevoli. Se menzioni un colloquio domani, il ricordo utile potrebbe essere "ricontrollare dopo il colloquio", non "salvare questo per sempre in `MEMORY.md`."

Gli [impegni](/it/concepts/commitments) sono ricordi di follow-up opzionali e di breve durata per questo caso. OpenClaw li inferisce in un passaggio nascosto in background, li limita allo stesso agente e canale, e consegna i check-in dovuti tramite Heartbeat. I promemoria espliciti usano comunque le [attività pianificate](/it/automation/cron-jobs).

## Strumenti di memoria

L'agente ha due strumenti per lavorare con la memoria:

- **`memory_search`** — trova note pertinenti usando la ricerca semantica, anche quando la formulazione differisce dall'originale.
- **`memory_get`** — legge un file di memoria specifico o un intervallo di righe.

Entrambi gli strumenti sono forniti dal plugin di memoria attiva (predefinito: `memory-core`).

## Plugin companion Memory Wiki

Se vuoi che la memoria durevole si comporti più come una knowledge base mantenuta che come semplici note grezze, usa il plugin incluso `memory-wiki`.

`memory-wiki` compila la conoscenza durevole in un vault wiki con:

- struttura delle pagine deterministica
- affermazioni ed evidenze strutturate
- tracciamento di contraddizioni e freschezza
- dashboard generate
- digest compilati per consumatori agente/runtime
- strumenti nativi per wiki come `wiki_search`, `wiki_get`, `wiki_apply` e `wiki_lint`

Non sostituisce il plugin di memoria attiva. Il plugin di memoria attiva possiede ancora recupero, promozione e Dreaming. `memory-wiki` aggiunge accanto a esso un livello di conoscenza ricco di provenienza.

Vedi [Memory Wiki](/it/plugins/memory-wiki).

## Ricerca nella memoria

Quando è configurato un provider di embedding, `memory_search` usa la **ricerca ibrida**: combina la similarità vettoriale (significato semantico) con la corrispondenza di parole chiave (termini esatti come ID e simboli di codice). Funziona immediatamente non appena hai una chiave API per qualsiasi provider supportato.

<Info>
OpenClaw rileva automaticamente il tuo provider di embedding dalle chiavi API disponibili. Se hai configurato una chiave OpenAI, Gemini, Voyage o Mistral, la ricerca nella memoria viene abilitata automaticamente.
</Info>

Per dettagli su come funziona la ricerca, sulle opzioni di ottimizzazione e sulla configurazione dei provider, vedi [Ricerca nella memoria](/it/concepts/memory-search).

## Backend di memoria

<CardGroup cols={3}>
<Card title="Builtin (default)" icon="database" href="/it/concepts/memory-builtin">
Basato su SQLite. Funziona immediatamente con ricerca per parole chiave, similarità vettoriale e ricerca ibrida. Nessuna dipendenza aggiuntiva.
</Card>
<Card title="QMD" icon="search" href="/it/concepts/memory-qmd">
Sidecar local-first con reranking, espansione delle query e capacità di indicizzare directory fuori dallo spazio di lavoro.
</Card>
<Card title="Honcho" icon="brain" href="/it/concepts/memory-honcho">
Memoria cross-session nativa per IA con modellazione dell'utente, ricerca semantica e consapevolezza multi-agente. Installazione tramite plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/it/plugins/memory-lancedb">
Memoria inclusa basata su LanceDB con embedding compatibili con OpenAI, auto-recall, acquisizione automatica e supporto per embedding Ollama locali.
</Card>
</CardGroup>

## Livello wiki di conoscenza

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/it/plugins/memory-wiki">
Compila la memoria durevole in un vault wiki ricco di provenienza con affermazioni, dashboard, modalità bridge e workflow compatibili con Obsidian.
</Card>
</CardGroup>

## Flush automatico della memoria

Prima che [Compaction](/it/concepts/compaction) riassuma la tua conversazione, OpenClaw esegue un turno silenzioso che ricorda all'agente di salvare il contesto importante nei file di memoria. È attivo per impostazione predefinita: non devi configurare nulla.

Per mantenere quel turno di manutenzione su un modello locale, imposta un override esatto del modello per il flush della memoria:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

L'override si applica solo al turno di flush della memoria e non eredita la catena di fallback della sessione attiva.

<Tip>
Il flush della memoria impedisce la perdita di contesto durante Compaction. Se il tuo agente ha nella conversazione fatti importanti che non sono ancora stati scritti in un file, verranno salvati automaticamente prima che venga creato il riepilogo.
</Tip>

## Dreaming

Dreaming è un passaggio facoltativo di consolidamento in background per la memoria. Raccoglie segnali a breve termine, assegna punteggi ai candidati e promuove solo gli elementi qualificati nella memoria a lungo termine (`MEMORY.md`).

È progettato per mantenere la memoria a lungo termine ad alto segnale:

- **Opt-in**: disabilitato per impostazione predefinita.
- **Pianificato**: quando abilitato, `memory-core` gestisce automaticamente un job Cron ricorrente per una scansione completa di Dreaming.
- **Con soglie**: le promozioni devono superare gate di punteggio, frequenza di richiamo e diversità delle query.
- **Revisionabile**: i riepiloghi delle fasi e le voci del diario vengono scritti in `DREAMS.md` per la revisione umana.

Per il comportamento delle fasi, i segnali di punteggio e i dettagli del Diario dei sogni, vedi [Dreaming](/it/concepts/dreaming).

## Backfill fondato su evidenze e promozione live

Il sistema di Dreaming ora ha due corsie di revisione strettamente correlate:

- **Dreaming live** lavora dall'archivio di Dreaming a breve termine sotto `memory/.dreams/` ed è ciò che la normale fase approfondita usa quando decide cosa può passare a `MEMORY.md`.
- **Backfill fondato su evidenze** legge le note storiche `memory/YYYY-MM-DD.md` come file giornalieri autonomi e scrive l'output di revisione strutturato in `DREAMS.md`.

Il backfill fondato su evidenze è utile quando vuoi riprodurre note più vecchie e ispezionare ciò che il sistema considera durevole senza modificare manualmente `MEMORY.md`.

Quando usi:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

i candidati durevoli fondati su evidenze non vengono promossi direttamente. Vengono preparati nello stesso archivio di Dreaming a breve termine che la normale fase approfondita usa già. Questo significa che:

- `DREAMS.md` rimane la superficie di revisione umana.
- l'archivio a breve termine rimane la superficie di ranking rivolta alla macchina.
- `MEMORY.md` viene ancora scritto solo dalla promozione approfondita.

Se decidi che la riproduzione non è stata utile, puoi rimuovere gli artefatti preparati senza toccare le normali voci del diario o lo stato normale di recall:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Check index status and provider
openclaw memory search "query"  # Search from the command line
openclaw memory index --force   # Rebuild the index
```

## Ulteriori letture

- [Motore di memoria integrato](/it/concepts/memory-builtin): backend SQLite predefinito.
- [Motore di memoria QMD](/it/concepts/memory-qmd): sidecar local-first avanzato.
- [Memoria Honcho](/it/concepts/memory-honcho): memoria cross-session nativa per IA.
- [Memory LanceDB](/it/plugins/memory-lancedb): plugin basato su LanceDB con embedding compatibili con OpenAI.
- [Memory Wiki](/it/plugins/memory-wiki): vault di conoscenza compilato e strumenti nativi per wiki.
- [Ricerca nella memoria](/it/concepts/memory-search): pipeline di ricerca, provider e ottimizzazione.
- [Dreaming](/it/concepts/dreaming): promozione in background dal recall a breve termine alla memoria a lungo termine.
- [Riferimento di configurazione della memoria](/it/reference/memory-config): tutte le opzioni di configurazione.
- [Compaction](/it/concepts/compaction): come Compaction interagisce con la memoria.

## Correlati

- [Memoria attiva](/it/concepts/active-memory)
- [Ricerca nella memoria](/it/concepts/memory-search)
- [Motore di memoria integrato](/it/concepts/memory-builtin)
- [Memoria Honcho](/it/concepts/memory-honcho)
- [Memory LanceDB](/it/plugins/memory-lancedb)
- [Impegni](/it/concepts/commitments)
