---
read_when:
    - Aggiunta di una nuova funzionalità core e superficie di registrazione dei Plugin
    - Decidere se il codice appartiene al core, a un Plugin del fornitore o a un Plugin di funzionalità
    - Collegare un nuovo helper di runtime per canali o strumenti
sidebarTitle: Adding capabilities
summary: Guida per i contributori per aggiungere una nuova funzionalità condivisa al sistema di Plugin di OpenClaw
title: Aggiungere funzionalità (guida per contributori)
x-i18n:
    generated_at: "2026-06-27T17:46:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b8a25122a7b76ff5bbb7616748d5fad2397502f9accb5428134a75d65e872034
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  Questa è una **guida per contributori** destinata agli sviluppatori core di OpenClaw. Se stai
  creando un Plugin esterno, consulta invece [Creazione di Plugin](/it/plugins/building-plugins).
  Per il riferimento architetturale approfondito (modello di capability, ownership,
  pipeline di caricamento, helper di runtime), consulta [Interni dei Plugin](/it/plugins/architecture).
</Info>

Usa questa guida quando OpenClaw ha bisogno di un nuovo dominio condiviso, come embedding,
generazione di immagini, generazione di video o una futura area di funzionalità supportata da fornitori.

La regola:

- **plugin** = confine di ownership
- **capability** = contratto core condiviso

Non iniziare collegando direttamente un fornitore a un canale o a uno strumento. Inizia definendo la capability.

## Quando creare una capability

Crea una nuova capability quando **tutte** queste condizioni sono vere:

1. Più di un fornitore potrebbe plausibilmente implementarla.
2. Canali, strumenti o Plugin di funzionalità dovrebbero consumarla senza preoccuparsi del fornitore.
3. Il core deve possedere fallback, policy, configurazione o comportamento di consegna.

Se il lavoro riguarda solo un fornitore e non esiste ancora un contratto condiviso, fermati e definisci prima il contratto.

## La sequenza standard

1. Definisci il contratto core tipizzato.
2. Aggiungi la registrazione del Plugin per quel contratto.
3. Aggiungi un helper di runtime condiviso.
4. Collega un vero Plugin fornitore come prova.
5. Sposta i consumer di funzionalità/canale sull'helper di runtime.
6. Aggiungi test di contratto.
7. Documenta la configurazione visibile all'operatore e il modello di ownership.

## Cosa va dove

**Core:**

- Tipi di richiesta/risposta.
- Registro dei provider + risoluzione.
- Comportamento di fallback.
- Schema di configurazione con metadati di documentazione `title` / `description` propagati su nodi oggetto annidati, wildcard, elementi di array e composizione.
- Superficie dell'helper di runtime.

**Plugin fornitore:**

- Chiamate API del fornitore.
- Gestione dell'autenticazione del fornitore.
- Normalizzazione delle richieste specifica del fornitore.
- Registrazione dell'implementazione della capability.

**Plugin di funzionalità/canale:**

- Chiama `api.runtime.*` o l'helper `plugin-sdk/*-runtime` corrispondente.
- Non chiama mai direttamente un'implementazione del fornitore.

## Punti di integrazione per provider e harness

Usa gli **hook del provider** quando il comportamento appartiene al contratto del provider del modello invece che al ciclo generico dell'agente. Gli esempi includono parametri di richiesta specifici del provider dopo la selezione del trasporto, preferenza del profilo di autenticazione, overlay dei prompt e instradamento del fallback di follow-up dopo il failover di modello/profilo.

Usa gli **hook dell'harness dell'agente** quando il comportamento appartiene al runtime che esegue un turno. Gli harness possono classificare risultati espliciti del protocollo come output vuoto, ragionamento senza output visibile o un piano strutturato senza una risposta finale, in modo che la policy di fallback esterna del modello possa prendere la decisione di ritentare.

Mantieni entrambi i punti di integrazione stretti:

- Il core possiede la policy di retry/fallback.
- I Plugin provider possiedono suggerimenti di richiesta/autenticazione/instradamento specifici del provider.
- I Plugin harness possiedono la classificazione dei tentativi specifica del runtime.
- I Plugin di terze parti restituiscono suggerimenti, non mutazioni dirette dello stato core.

## Checklist dei file

Per una nuova capability, prevedi di toccare queste aree:

- `src/<capability>/types.ts`
- `src/<capability>/...registry/runtime.ts`
- `src/plugins/types.ts`
- `src/plugins/registry.ts`
- `src/plugins/captured-registration.ts`
- `src/plugins/contracts/registry.ts`
- `src/plugins/runtime/types-core.ts`
- `src/plugins/runtime/index.ts`
- `src/plugin-sdk/<capability>.ts`
- `src/plugin-sdk/<capability>-runtime.ts`
- Uno o più pacchetti Plugin inclusi.
- Configurazione, documentazione, test.

## Esempio pratico: generazione di immagini

La generazione di immagini segue la forma standard:

1. Il core definisce `ImageGenerationProvider`.
2. Il core espone `registerImageGenerationProvider(...)`.
3. Il core espone `runtime.imageGeneration.generate(...)`.
4. I Plugin `openai`, `google`, `fal` e `minimax` registrano implementazioni supportate da fornitori.
5. I fornitori futuri registrano lo stesso contratto senza modificare canali/strumenti.

La chiave di configurazione è intenzionalmente separata dall'instradamento dell'analisi visiva:

- `agents.defaults.imageModel` analizza le immagini.
- `agents.defaults.imageGenerationModel` genera immagini.

Mantienile separate affinché fallback e policy rimangano espliciti.

## Provider di embedding

Usa `embeddingProviders` per provider di embedding vettoriali riutilizzabili. Questo contratto
è intenzionalmente più ampio della memoria: strumenti, ricerca, retrieval, importatori o
futuri Plugin di funzionalità possono consumare embedding senza dipendere dal motore
di memoria.

La ricerca nella memoria può consumare `embeddingProviders` generici. Il vecchio
contratto `memoryEmbeddingProviders` è una compatibilità deprecata mentre i provider
specifici per la memoria esistenti migrano; i nuovi provider di embedding riutilizzabili dovrebbero usare
`embeddingProviders`.

## Checklist di revisione

Prima di distribuire una nuova capability, verifica:

- Nessun canale/strumento importa direttamente codice del fornitore.
- L'helper di runtime è il percorso condiviso.
- Almeno un test di contratto verifica l'ownership inclusa.
- La documentazione della configurazione nomina la nuova chiave modello/configurazione.
- La documentazione dei Plugin spiega il confine di ownership.

Se una PR salta il livello di capability e codifica rigidamente il comportamento del fornitore in un canale/strumento, rimandala indietro e definisci prima il contratto.

## Correlati

- [Interni dei Plugin](/it/plugins/architecture) — modello di capability, ownership, pipeline di caricamento, helper di runtime.
- [Creazione di Plugin](/it/plugins/building-plugins) — tutorial per il primo Plugin.
- [Panoramica SDK](/it/plugins/sdk-overview) — mappa degli import e riferimento API di registrazione.
- [Creazione di Skills](/it/tools/creating-skills) — superficie complementare per contributori.
