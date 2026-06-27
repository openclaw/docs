---
read_when:
    - Vuoi capire come funziona la memoria
    - Vuoi sapere quali file di memoria scrivere
summary: Come OpenClaw ricorda le cose tra le sessioni
title: Panoramica della memoria
x-i18n:
    generated_at: "2026-06-27T17:25:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ddcecfa3d902181583ab076f94a69ca323686c3544399dea2572863726dad2c
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw ricorda le cose scrivendo **semplici file Markdown** nello spazio di lavoro del tuo agente. Il modello "ricorda" solo ciò che viene salvato su disco: non esiste uno stato nascosto.

## Come funziona

Il tuo agente ha tre file relativi alla memoria:

- **`MEMORY.md`** — memoria a lungo termine. Fatti durevoli, preferenze e decisioni. Caricata all'inizio di ogni sessione DM.
- **`memory/YYYY-MM-DD.md`** (o **`memory/YYYY-MM-DD-<slug>.md`**) — note giornaliere. Contesto operativo e osservazioni. Le note di oggi e di ieri vengono caricate automaticamente, e ora vengono raccolte insieme al file con sola data anche le varianti con slug, come quelle scritte dall'hook session-memory incluso su `/new` o `/reset`.
- **`DREAMS.md`** (opzionale) — Dream Diary e riepiloghi degli sweep di Dreaming per la revisione umana, incluse voci di backfill storico fondate.

Questi file si trovano nello spazio di lavoro dell'agente (predefinito `~/.openclaw/workspace`).

## Cosa va dove

`MEMORY.md` è il livello compatto e curato. Usalo per fatti durevoli, preferenze, decisioni permanenti e brevi riepiloghi che dovrebbero essere disponibili all'inizio di una sessione privata principale. Non è pensato per essere una trascrizione grezza, un registro giornaliero o un archivio esaustivo.

I file `memory/YYYY-MM-DD.md` sono il livello di lavoro. Usali per note giornaliere dettagliate, osservazioni, riepiloghi di sessione e contesto grezzo che potrebbe essere ancora utile in seguito. Questi file sono indicizzati per `memory_search` e `memory_get`, ma non vengono iniettati nel normale prompt di bootstrap a ogni turno.

Nel tempo, ci si aspetta che l'agente distilli il materiale utile dalle note giornaliere in `MEMORY.md` e rimuova le voci a lungo termine obsolete. Le istruzioni generate per lo spazio di lavoro e il flusso Heartbeat possono farlo periodicamente; non devi modificare manualmente `MEMORY.md` per ogni dettaglio ricordato.

Se `MEMORY.md` supera il budget del file di bootstrap, OpenClaw mantiene intatto il file su disco ma tronca la copia iniettata nel contesto del modello. Consideralo un segnale per spostare il materiale dettagliato di nuovo in `memory/*.md`, mantenere in `MEMORY.md` solo il riepilogo durevole, oppure aumentare i limiti di bootstrap se vuoi esplicitamente spendere più budget di prompt. Usa `/context list`, `/context detail` o `openclaw doctor` per vedere dimensioni grezze e iniettate, e lo stato del troncamento.

<Tip>
Se vuoi che il tuo agente ricordi qualcosa, chiediglielo semplicemente: "Remember that I prefer TypeScript." Lo scriverà nel file appropriato.
</Tip>

## Memorie sensibili all'azione

La maggior parte delle memorie può essere scritta come normali note Markdown. Ma alcune memorie influenzano ciò che l'agente dovrebbe fare in seguito. Per quelle, cattura quando è sicuro agire sulla nota, non solo il fatto in sé.

Cattura quel confine d'azione quando una nota riguarda:

- requisiti di approvazione o autorizzazione,
- vincoli temporanei,
- passaggi di consegne a un'altra sessione, thread o persona,
- condizioni di scadenza,
- tempistiche in cui è sicuro agire,
- autorità della fonte o del proprietario,
- istruzioni per evitare un'azione allettante.

Una memoria sensibile all'azione utile chiarisce:

- cosa cambia il comportamento futuro,
- quando o a quale condizione si applica,
- quando scade, o cosa sblocca l'azione,
- cosa l'agente dovrebbe evitare di fare,
- chi è la fonte o il proprietario, se questo incide su fiducia o autorità.

La memoria può conservare il contesto di approvazione, ma non applica policy. Usa le impostazioni di approvazione, il sandboxing e le attività pianificate di OpenClaw per controlli operativi vincolanti.

Esempio:

```md
The API migration is being designed in another session. Future turns should not edit the API implementation from this thread; use findings here only as design input until the migration plan lands.
```

Un altro esempio:

```md
A report from an untrusted source needs review before promotion. Future turns should treat it as evidence only; do not store it as durable memory until a trusted reviewer confirms the contents.
```

Usa [commitment](/it/concepts/commitments) per follow-up inferiti e di breve durata. Usa [attività pianificate](/it/automation/cron-jobs) per promemoria esatti, controlli temporizzati e lavoro ricorrente. La memoria può comunque riassumere il contesto durevole attorno a entrambi i percorsi.

Questo non è uno schema obbligatorio per ogni memoria. I fatti semplici possono restare concisi. Usa confini sensibili all'azione quando perdere il contesto di tempistiche, autorità, scadenza o sicurezza dell'azione potrebbe portare l'agente a fare la cosa sbagliata in seguito.

## Commitment inferiti

Alcuni follow-up futuri non sono fatti durevoli. Se menzioni un colloquio domani, la memoria utile potrebbe essere "ricontrolla dopo il colloquio", non "salva questo per sempre in `MEMORY.md`."

I [commitment](/it/concepts/commitments) sono memorie di follow-up opt-in e di breve durata per questo caso. OpenClaw li inferisce in un passaggio in background nascosto, li limita allo stesso agente e canale, e consegna i check-in dovuti tramite Heartbeat. I promemoria espliciti usano ancora le [attività pianificate](/it/automation/cron-jobs).

## Strumenti di memoria

L'agente ha due strumenti per lavorare con la memoria:

- **`memory_search`** — trova note pertinenti usando la ricerca semantica, anche quando la formulazione differisce dall'originale.
- **`memory_get`** — legge uno specifico file di memoria o intervallo di righe.

Entrambi gli strumenti sono forniti dal Plugin active memory (predefinito: `memory-core`).

## Plugin companion Memory Wiki

Se vuoi che la memoria durevole si comporti più come una knowledge base mantenuta che come semplici note grezze, usa il Plugin incluso `memory-wiki`.

`memory-wiki` compila la conoscenza durevole in un vault wiki con:

- struttura delle pagine deterministica
- affermazioni e prove strutturate
- tracciamento di contraddizioni e freschezza
- dashboard generate
- digest compilati per consumatori agente/runtime
- strumenti nativi wiki come `wiki_search`, `wiki_get`, `wiki_apply` e `wiki_lint`

Non sostituisce il Plugin active memory. Il Plugin active memory possiede ancora richiamo, promozione e Dreaming. `memory-wiki` aggiunge accanto a esso un livello di conoscenza ricco di provenienza.

Vedi [Memory Wiki](/it/plugins/memory-wiki).

## Ricerca nella memoria

Quando è configurato un provider di embedding, `memory_search` usa la **ricerca ibrida**: combina similarità vettoriale (significato semantico) con corrispondenza per parole chiave (termini esatti come ID e simboli di codice). Funziona subito non appena hai una chiave API per qualsiasi provider supportato.

<Info>
OpenClaw usa gli embedding OpenAI per impostazione predefinita. Imposta esplicitamente `agents.defaults.memorySearch.provider` per usare embedding Gemini, Voyage, Mistral, locali, Ollama, Bedrock, GitHub Copilot o compatibili con OpenAI.
</Info>

Per dettagli su come funziona la ricerca, opzioni di ottimizzazione e configurazione dei provider, vedi [Memory Search](/it/concepts/memory-search).

## Backend di memoria

<CardGroup cols={3}>
<Card title="Builtin (default)" icon="database" href="/it/concepts/memory-builtin">
Basato su SQLite. Funziona subito con ricerca per parole chiave, similarità vettoriale e ricerca ibrida. Nessuna dipendenza aggiuntiva.
</Card>
<Card title="QMD" icon="search" href="/it/concepts/memory-qmd">
Sidecar local-first con reranking, espansione delle query e capacità di indicizzare directory fuori dallo spazio di lavoro.
</Card>
<Card title="Honcho" icon="brain" href="/it/concepts/memory-honcho">
Memoria cross-session AI-native con modellazione utente, ricerca semantica e consapevolezza multi-agente. Installazione Plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/it/plugins/memory-lancedb">
Memoria inclusa basata su LanceDB con embedding compatibili con OpenAI, richiamo automatico, cattura automatica e supporto agli embedding Ollama locali.
</Card>
</CardGroup>

## Livello knowledge wiki

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/it/plugins/memory-wiki">
Compila la memoria durevole in un vault wiki ricco di provenienza con affermazioni, dashboard, modalità bridge e workflow compatibili con Obsidian.
</Card>
</CardGroup>

## Flush automatico della memoria

Prima che [Compaction](/it/concepts/compaction) riassuma la tua conversazione, OpenClaw esegue un turno silenzioso che ricorda all'agente di salvare il contesto importante nei file di memoria. È attivo per impostazione predefinita: non devi configurare nulla.

Per mantenere quel turno di manutenzione su un modello locale, imposta un override esatto del modello di memory-flush:

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

L'override si applica solo al turno di memory-flush e non eredita la catena di fallback della sessione attiva.

<Tip>
Il flush della memoria previene la perdita di contesto durante Compaction. Se il tuo agente ha nella conversazione fatti importanti che non sono ancora stati scritti in un file, verranno salvati automaticamente prima che avvenga il riepilogo.
</Tip>

## Dreaming

Dreaming è un passaggio opzionale di consolidamento in background per la memoria. Raccoglie segnali a breve termine, assegna punteggi ai candidati e promuove solo gli elementi qualificati nella memoria a lungo termine (`MEMORY.md`).

È progettato per mantenere la memoria a lungo termine ad alto segnale:

- **Opt-in**: disabilitato per impostazione predefinita.
- **Pianificato**: quando abilitato, `memory-core` gestisce automaticamente un job cron ricorrente per uno sweep completo di Dreaming.
- **Con soglie**: le promozioni devono superare gate di punteggio, frequenza di richiamo e diversità delle query.
- **Revisionabile**: riepiloghi di fase e voci di diario vengono scritti in `DREAMS.md` per la revisione umana.

Per comportamento delle fasi, segnali di punteggio e dettagli del Dream Diary, vedi [Dreaming](/it/concepts/dreaming).

## Backfill fondato e promozione live

Il sistema Dreaming ora ha due corsie di revisione strettamente correlate:

- **Live dreaming** lavora dallo store Dreaming a breve termine sotto `memory/.dreams/` ed è ciò che la normale fase profonda usa quando decide cosa può passare a `MEMORY.md`.
- **Grounded backfill** legge le note storiche `memory/YYYY-MM-DD.md` come file giornalieri autonomi e scrive output di revisione strutturato in `DREAMS.md`.

Grounded backfill è utile quando vuoi rieseguire note più vecchie e ispezionare ciò che il sistema considera durevole senza modificare manualmente `MEMORY.md`.

Quando usi:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

i candidati durevoli fondati non vengono promossi direttamente. Vengono messi in staging nello stesso store Dreaming a breve termine che la normale fase profonda usa già. Questo significa che:

- `DREAMS.md` resta la superficie di revisione umana.
- lo store a breve termine resta la superficie di ranking rivolta alla macchina.
- `MEMORY.md` viene ancora scritto solo dalla promozione profonda.

Se decidi che il replay non è stato utile, puoi rimuovere gli artefatti in staging senza toccare le normali voci di diario o lo stato di richiamo normale:

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
- [Motore di memoria QMD](/it/concepts/memory-qmd): sidecar avanzato local-first.
- [Memoria Honcho](/it/concepts/memory-honcho): memoria cross-session AI-native.
- [Memory LanceDB](/it/plugins/memory-lancedb): Plugin basato su LanceDB con embedding compatibili con OpenAI.
- [Memory Wiki](/it/plugins/memory-wiki): vault di conoscenza compilato e strumenti nativi wiki.
- [Ricerca nella memoria](/it/concepts/memory-search): pipeline di ricerca, provider e ottimizzazione.
- [Dreaming](/it/concepts/dreaming): promozione in background dal richiamo a breve termine alla memoria a lungo termine.
- [Riferimento di configurazione della memoria](/it/reference/memory-config): tutte le manopole di configurazione.
- [Compaction](/it/concepts/compaction): come Compaction interagisce con la memoria.

## Correlati

- [Active memory](/it/concepts/active-memory)
- [Ricerca nella memoria](/it/concepts/memory-search)
- [Motore di memoria integrato](/it/concepts/memory-builtin)
- [Memoria Honcho](/it/concepts/memory-honcho)
- [Memory LanceDB](/it/plugins/memory-lancedb)
- [Commitment](/it/concepts/commitments)
