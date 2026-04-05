---
read_when:
    - Vuoi capire come funziona la memoria
    - Vuoi sapere quali file di memoria scrivere
summary: Come OpenClaw ricorda le cose tra sessioni diverse
title: Panoramica della memoria
x-i18n:
    generated_at: "2026-04-05T13:50:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89fbd20cf2bcdf461a9e311ee0ff43b5f69d9953519656eecd419b4a419256f8
    source_path: concepts/memory.md
    workflow: 15
---

# Panoramica della memoria

OpenClaw ricorda le cose scrivendo **semplici file Markdown** nel workspace del
tuo agente. Il modello "ricorda" solo ciò che viene salvato su disco -- non c'è
alcuno stato nascosto.

## Come funziona

Il tuo agente ha due posti in cui archiviare i ricordi:

- **`MEMORY.md`** -- memoria a lungo termine. Fatti durevoli, preferenze e
  decisioni. Viene caricato all'inizio di ogni sessione DM.
- **`memory/YYYY-MM-DD.md`** -- note giornaliere. Contesto in evoluzione e osservazioni.
  Le note di oggi e di ieri vengono caricate automaticamente.

Questi file si trovano nel workspace dell'agente (predefinito `~/.openclaw/workspace`).

<Tip>
Se vuoi che il tuo agente ricordi qualcosa, basta chiederglielo: "Ricorda che
preferisco TypeScript." Lo scriverà nel file appropriato.
</Tip>

## Strumenti di memoria

L'agente dispone di due strumenti per lavorare con la memoria:

- **`memory_search`** -- trova note pertinenti usando la ricerca semantica, anche quando
  la formulazione differisce dall'originale.
- **`memory_get`** -- legge un file di memoria specifico o un intervallo di righe.

Entrambi gli strumenti sono forniti dal plugin di memoria attivo (predefinito: `memory-core`).

## Ricerca nella memoria

Quando è configurato un provider di embedding, `memory_search` usa la **ricerca
ibrida** -- combinando similarità vettoriale (significato semantico) con corrispondenza per parole chiave
(termini esatti come ID e simboli di codice). Funziona subito, una volta che hai
una chiave API per qualsiasi provider supportato.

<Info>
OpenClaw rileva automaticamente il provider di embedding dalle chiavi API disponibili. Se hai
configurato una chiave OpenAI, Gemini, Voyage o Mistral, la ricerca nella memoria è
abilitata automaticamente.
</Info>

Per i dettagli su come funziona la ricerca, le opzioni di regolazione e la configurazione del provider, vedi
[Ricerca nella memoria](/concepts/memory-search).

## Backend di memoria

<CardGroup cols={3}>
<Card title="Integrato (predefinito)" icon="database" href="/concepts/memory-builtin">
Basato su SQLite. Funziona subito con ricerca per parole chiave, similarità vettoriale e
ricerca ibrida. Nessuna dipendenza aggiuntiva.
</Card>
<Card title="QMD" icon="search" href="/concepts/memory-qmd">
Sidecar local-first con reranking, espansione delle query e la possibilità di indicizzare
directory esterne al workspace.
</Card>
<Card title="Honcho" icon="brain" href="/concepts/memory-honcho">
Memoria cross-session nativa per l'AI con modellazione dell'utente, ricerca semantica e
consapevolezza multi-agente. Installazione tramite plugin.
</Card>
</CardGroup>

## Flush automatico della memoria

Prima che la [compattazione](/concepts/compaction) riassuma la tua conversazione, OpenClaw
esegue un turno silenzioso che ricorda all'agente di salvare il contesto importante nei file di memoria.
Questa funzione è attiva per impostazione predefinita -- non devi configurare nulla.

<Tip>
Il flush della memoria previene la perdita di contesto durante la compattazione. Se il tuo agente ha
fatti importanti nella conversazione che non sono ancora stati scritti in un file, verranno
salvati automaticamente prima che avvenga il riepilogo.
</Tip>

## Dreaming (sperimentale)

Dreaming è un passaggio opzionale di consolidamento della memoria in background. Rivisita
i richiami a breve termine dai file giornalieri (`memory/YYYY-MM-DD.md`), li valuta e
promuove nella memoria a lungo termine (`MEMORY.md`) solo gli elementi qualificati.

È progettato per mantenere alta la qualità della memoria a lungo termine:

- **Adesione esplicita**: disabilitato per impostazione predefinita.
- **Pianificato**: quando abilitato, `memory-core` gestisce automaticamente l'attività
  ricorrente.
- **Con soglia**: le promozioni devono superare soglie di punteggio, frequenza di richiamo e
  diversità delle query.

Per il comportamento delle modalità (`off`, `core`, `rem`, `deep`), i segnali di valutazione e i parametri di regolazione,
vedi [Dreaming (sperimentale)](/concepts/memory-dreaming).

## CLI

```bash
openclaw memory status          # Controlla lo stato dell'indice e del provider
openclaw memory search "query"  # Cerca dalla riga di comando
openclaw memory index --force   # Ricostruisce l'indice
```

## Ulteriori letture

- [Motore di memoria integrato](/concepts/memory-builtin) -- backend SQLite predefinito
- [Motore di memoria QMD](/concepts/memory-qmd) -- sidecar avanzato local-first
- [Memoria Honcho](/concepts/memory-honcho) -- memoria cross-session nativa per l'AI
- [Ricerca nella memoria](/concepts/memory-search) -- pipeline di ricerca, provider e
  regolazione
- [Dreaming (sperimentale)](/concepts/memory-dreaming) -- promozione in background
  dal richiamo a breve termine alla memoria a lungo termine
- [Riferimento della configurazione della memoria](/reference/memory-config) -- tutti i parametri di configurazione
- [Compattazione](/concepts/compaction) -- come la compattazione interagisce con la memoria
