---
read_when:
    - Vuoi capire come funziona la memoria
    - Vuoi sapere quali file di memoria scrivere
summary: Come OpenClaw ricorda le informazioni tra le sessioni
title: Panoramica della memoria
x-i18n:
    generated_at: "2026-05-10T19:30:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef7a67b06615897167d7aac8a9f52fe7df9eee86f5d8d1504291ec750e674833
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw ricorda le informazioni scrivendo **file Markdown semplici** nello
workspace del tuo agente. Il modello "ricorda" solo ciò che viene salvato su disco: non esiste
uno stato nascosto.

## Come funziona

Il tuo agente ha tre file relativi alla memoria:

- **`MEMORY.md`**: memoria a lungo termine. Fatti, preferenze e
  decisioni durevoli. Caricato all'inizio di ogni sessione DM.
- **`memory/YYYY-MM-DD.md`**: note giornaliere. Contesto in corso e osservazioni.
  Le note di oggi e di ieri vengono caricate automaticamente.
- **`DREAMS.md`** (opzionale): Diario dei sogni e riepiloghi degli sweep di Dreaming
  per revisione umana, incluse voci di backfill storico fondate su evidenze.

Questi file si trovano nel workspace dell'agente (predefinito: `~/.openclaw/workspace`).

## Cosa va dove

`MEMORY.md` è il livello compatto e curato. Usalo per fatti durevoli,
preferenze, decisioni permanenti e brevi riepiloghi che dovrebbero essere disponibili
all'inizio di una sessione privata principale. Non è pensato per essere una trascrizione grezza,
un registro giornaliero o un archivio esaustivo.

I file `memory/YYYY-MM-DD.md` sono il livello di lavoro. Usali per note giornaliere
dettagliate, osservazioni, riepiloghi di sessione e contesto grezzo che potrebbe essere ancora utile
in seguito. Questi file sono indicizzati per `memory_search` e `memory_get`, ma non vengono
iniettati nel normale prompt di bootstrap a ogni turno.

Nel tempo, l'agente dovrebbe distillare il materiale utile dalle note giornaliere
in `MEMORY.md` e rimuovere le voci a lungo termine obsolete. Le istruzioni generate del workspace
e il flusso Heartbeat possono farlo periodicamente; non devi modificare manualmente
`MEMORY.md` per ogni dettaglio ricordato.

Se `MEMORY.md` supera il budget dei file di bootstrap, OpenClaw mantiene intatto il file su
disco ma tronca la copia iniettata nel contesto del modello. Consideralo un segnale per
spostare il materiale dettagliato di nuovo in `memory/*.md`, mantenere solo il
riepilogo durevole in `MEMORY.md`, oppure aumentare i limiti di bootstrap se vuoi
esplicitamente spendere più budget di prompt. Usa `/context list`, `/context detail` oppure
`openclaw doctor` per vedere dimensioni grezze e iniettate e lo stato di troncamento.

<Tip>
Se vuoi che il tuo agente ricordi qualcosa, chiediglielo semplicemente: "Ricorda che
preferisco TypeScript." Lo scriverà nel file appropriato.
</Tip>

## Impegni dedotti

Alcuni follow-up futuri non sono fatti durevoli. Se menzioni un colloquio
domani, la memoria utile potrebbe essere "fai un controllo dopo il colloquio", non "conserva
questo per sempre in `MEMORY.md`."

Gli [impegni](/it/concepts/commitments) sono memorie di follow-up opzionali e di breve durata
per questo caso. OpenClaw li deduce in un passaggio nascosto in background, li limita
allo stesso agente e canale, e consegna i check-in dovuti tramite Heartbeat.
I promemoria espliciti usano comunque le [attività pianificate](/it/automation/cron-jobs).

## Strumenti di memoria

L'agente ha due strumenti per lavorare con la memoria:

- **`memory_search`**: trova note rilevanti usando la ricerca semantica, anche quando
  la formulazione differisce dall'originale.
- **`memory_get`**: legge un file di memoria specifico o un intervallo di righe.

Entrambi gli strumenti sono forniti dal Plugin Active Memory (predefinito: `memory-core`).

## Plugin companion Memory Wiki

Se vuoi che la memoria durevole si comporti più come una knowledge base mantenuta che come
semplici note grezze, usa il Plugin incluso `memory-wiki`.

`memory-wiki` compila la conoscenza durevole in un vault wiki con:

- struttura delle pagine deterministica
- affermazioni ed evidenze strutturate
- tracciamento di contraddizioni e freschezza
- dashboard generate
- digest compilati per consumer agente/runtime
- strumenti nativi wiki come `wiki_search`, `wiki_get`, `wiki_apply` e `wiki_lint`

Non sostituisce il Plugin Active Memory. Il Plugin Active Memory continua
a possedere richiamo, promozione e Dreaming. `memory-wiki` aggiunge accanto ad esso
un livello di conoscenza ricco di provenienza.

Vedi [Memory Wiki](/it/plugins/memory-wiki).

## Ricerca della memoria

Quando è configurato un provider di embedding, `memory_search` usa la **ricerca ibrida**:
combina la similarità vettoriale (significato semantico) con la corrispondenza per parole chiave
(termini esatti come ID e simboli di codice). Funziona subito, appena hai
una chiave API per qualsiasi provider supportato.

<Info>
OpenClaw rileva automaticamente il tuo provider di embedding dalle chiavi API disponibili. Se hai
configurato una chiave OpenAI, Gemini, Voyage o Mistral, la ricerca della memoria viene
abilitata automaticamente.
</Info>

Per dettagli su come funziona la ricerca, sulle opzioni di regolazione e sulla configurazione dei provider, vedi
[Ricerca della memoria](/it/concepts/memory-search).

## Backend di memoria

<CardGroup cols={3}>
<Card title="Integrato (predefinito)" icon="database" href="/it/concepts/memory-builtin">
Basato su SQLite. Funziona subito con ricerca per parole chiave, similarità vettoriale e
ricerca ibrida. Nessuna dipendenza aggiuntiva.
</Card>
<Card title="QMD" icon="search" href="/it/concepts/memory-qmd">
Sidecar local-first con reranking, espansione delle query e capacità di indicizzare
directory esterne al workspace.
</Card>
<Card title="Honcho" icon="brain" href="/it/concepts/memory-honcho">
Memoria cross-session AI-native con modellazione utente, ricerca semantica e
consapevolezza multi-agente. Installazione tramite Plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/it/plugins/memory-lancedb">
Memoria inclusa basata su LanceDB con embedding compatibili con OpenAI, richiamo automatico,
acquisizione automatica e supporto per embedding Ollama locali.
</Card>
</CardGroup>

## Livello wiki della conoscenza

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/it/plugins/memory-wiki">
Compila la memoria durevole in un vault wiki ricco di provenienza, con affermazioni,
dashboard, modalità bridge e workflow compatibili con Obsidian.
</Card>
</CardGroup>

## Flush automatico della memoria

Prima che [Compaction](/it/concepts/compaction) riepiloghi la tua conversazione, OpenClaw
esegue un turno silenzioso che ricorda all'agente di salvare il contesto importante nei file
di memoria. È attivo per impostazione predefinita: non devi configurare nulla.

Per mantenere quel turno di manutenzione su un modello locale, imposta un override esatto del modello
per il flush della memoria:

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

L'override si applica solo al turno di flush della memoria e non eredita la
catena di fallback della sessione attiva.

<Tip>
Il flush della memoria previene la perdita di contesto durante Compaction. Se il tuo agente ha
fatti importanti nella conversazione che non sono ancora stati scritti in un file, verranno
salvati automaticamente prima che avvenga il riepilogo.
</Tip>

## Dreaming

Dreaming è un passaggio opzionale di consolidamento in background per la memoria. Raccoglie
segnali a breve termine, assegna punteggi ai candidati e promuove solo gli elementi qualificati nella
memoria a lungo termine (`MEMORY.md`).

È progettato per mantenere la memoria a lungo termine ad alto segnale:

- **Opt-in**: disabilitato per impostazione predefinita.
- **Pianificato**: quando è abilitato, `memory-core` gestisce automaticamente un job Cron ricorrente
  per uno sweep completo di Dreaming.
- **Con soglie**: le promozioni devono superare gate di punteggio, frequenza di richiamo e
  diversità delle query.
- **Revisionabile**: i riepiloghi di fase e le voci del diario vengono scritti in `DREAMS.md`
  per revisione umana.

Per il comportamento delle fasi, i segnali di punteggio e i dettagli del Diario dei sogni, vedi
[Dreaming](/it/concepts/dreaming).

## Backfill fondato ed elevazione live

Il sistema Dreaming ora ha due corsie di revisione strettamente correlate:

- **Dreaming live** lavora dallo store Dreaming a breve termine sotto
  `memory/.dreams/` ed è ciò che la normale fase profonda usa quando decide cosa
  può passare a `MEMORY.md`.
- **Backfill fondato** legge le note storiche `memory/YYYY-MM-DD.md` come
  file giornalieri autonomi e scrive output di revisione strutturato in `DREAMS.md`.

Il backfill fondato è utile quando vuoi riprodurre note più vecchie e ispezionare cosa
il sistema considera durevole senza modificare manualmente `MEMORY.md`.

Quando usi:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

i candidati durevoli fondati non vengono promossi direttamente. Vengono messi in staging nello
stesso store Dreaming a breve termine che la normale fase profonda usa già. Questo
significa che:

- `DREAMS.md` resta la superficie di revisione umana.
- lo store a breve termine resta la superficie di ranking rivolta alla macchina.
- `MEMORY.md` viene comunque scritto solo dalla promozione profonda.

Se decidi che la riproduzione non è stata utile, puoi rimuovere gli artefatti in staging
senza toccare le normali voci del diario o lo stato di richiamo normale:

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
- [Memoria Honcho](/it/concepts/memory-honcho): memoria cross-session AI-native.
- [Memory LanceDB](/it/plugins/memory-lancedb): Plugin basato su LanceDB con embedding compatibili con OpenAI.
- [Memory Wiki](/it/plugins/memory-wiki): vault di conoscenza compilato e strumenti nativi wiki.
- [Ricerca della memoria](/it/concepts/memory-search): pipeline di ricerca, provider e regolazione.
- [Dreaming](/it/concepts/dreaming): promozione in background dal richiamo a breve termine alla memoria a lungo termine.
- [Riferimento di configurazione della memoria](/it/reference/memory-config): tutte le manopole di configurazione.
- [Compaction](/it/concepts/compaction): come Compaction interagisce con la memoria.

## Correlati

- [Active Memory](/it/concepts/active-memory)
- [Ricerca della memoria](/it/concepts/memory-search)
- [Motore di memoria integrato](/it/concepts/memory-builtin)
- [Memoria Honcho](/it/concepts/memory-honcho)
- [Memory LanceDB](/it/plugins/memory-lancedb)
- [Impegni](/it/concepts/commitments)
