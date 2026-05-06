---
read_when:
    - Aggiunta di una nuova funzionalità di base e di una superficie di registrazione Plugin
    - Decidere se il codice appartiene al nucleo, a un Plugin del fornitore o a un Plugin di funzionalità
    - Integrare un nuovo helper di runtime per canali o strumenti
sidebarTitle: Adding capabilities
summary: Guida per i contributori all'aggiunta di una nuova funzionalità condivisa al sistema Plugin di OpenClaw
title: Aggiunta di funzionalità (guida per i contributori)
x-i18n:
    generated_at: "2026-05-06T09:01:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e289c95d9dc5924b5cc7b67428386660b83052b6cf6f14fc4f838fc88b7a25c
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  Questa è una **guida per contributor** per gli sviluppatori core di OpenClaw. Se stai
  creando un plugin esterno, consulta invece [Creare plugin](/it/plugins/building-plugins).
  Per il riferimento approfondito sull'architettura (modello delle capacità, proprietà,
  pipeline di caricamento, helper di runtime), consulta [Interni dei plugin](/it/plugins/architecture).
</Info>

Usa questa guida quando OpenClaw ha bisogno di un nuovo dominio condiviso, come la generazione di immagini, la generazione di video o qualche futura area funzionale supportata da un fornitore.

La regola:

- **plugin** = confine di proprietà
- **capability** = contratto core condiviso

Non iniziare collegando direttamente un fornitore a un canale o a uno strumento. Inizia definendo la capacità.

## Quando creare una capacità

Crea una nuova capacità quando **tutte** queste condizioni sono vere:

1. Più di un fornitore potrebbe plausibilmente implementarla.
2. Canali, strumenti o plugin di funzionalità dovrebbero consumarla senza preoccuparsi del fornitore.
3. Il core deve possedere fallback, policy, configurazione o comportamento di consegna.

Se il lavoro riguarda solo un fornitore e non esiste ancora un contratto condiviso, fermati e definisci prima il contratto.

## La sequenza standard

1. Definisci il contratto core tipizzato.
2. Aggiungi la registrazione dei plugin per quel contratto.
3. Aggiungi un helper di runtime condiviso.
4. Collega un vero plugin di fornitore come prova.
5. Sposta i consumer di funzionalità/canali sull'helper di runtime.
6. Aggiungi test del contratto.
7. Documenta la configurazione rivolta all'operatore e il modello di proprietà.

## Cosa va dove

**Core:**

- Tipi di richiesta/risposta.
- Registro dei provider + risoluzione.
- Comportamento di fallback.
- Schema di configurazione con metadati documentali `title` / `description` propagati su nodi oggetto annidati, wildcard, elementi di array e composizione.
- Superficie dell'helper di runtime.

**Plugin del fornitore:**

- Chiamate API del fornitore.
- Gestione dell'autenticazione del fornitore.
- Normalizzazione delle richieste specifica del fornitore.
- Registrazione dell'implementazione della capacità.

**Plugin di funzionalità/canale:**

- Chiama `api.runtime.*` o l'helper corrispondente `plugin-sdk/*-runtime`.
- Non chiama mai direttamente un'implementazione del fornitore.

## Giunzioni di provider e harness

Usa gli **hook del provider** quando il comportamento appartiene al contratto del provider del modello invece che al ciclo agente generico. Gli esempi includono parametri di richiesta specifici del provider dopo la selezione del trasporto, preferenza del profilo di autenticazione, overlay dei prompt e instradamento di fallback di follow-up dopo failover di modello/profilo.

Usa gli **hook dell'harness dell'agente** quando il comportamento appartiene al runtime che esegue un turno. Gli harness possono classificare risultati di tentativi riusciti ma inutilizzabili, come risposte vuote, solo di ragionamento o solo di pianificazione, così la policy di fallback del modello esterno può prendere la decisione di riprovare.

Mantieni entrambe le giunzioni ristrette:

- Il core possiede la policy di retry/fallback.
- I plugin provider possiedono suggerimenti specifici del provider per richiesta/autenticazione/instradamento.
- I plugin harness possiedono la classificazione dei tentativi specifica del runtime.
- I plugin di terze parti restituiscono suggerimenti, non mutazioni dirette dello stato del core.

## Checklist dei file

Per una nuova capacità, aspettati di toccare queste aree:

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
- Uno o più pacchetti di plugin inclusi.
- Configurazione, documentazione, test.

## Esempio pratico: generazione di immagini

La generazione di immagini segue la forma standard:

1. Il core definisce `ImageGenerationProvider`.
2. Il core espone `registerImageGenerationProvider(...)`.
3. Il core espone `runtime.imageGeneration.generate(...)`.
4. I plugin `openai`, `google`, `fal` e `minimax` registrano implementazioni supportate da fornitori.
5. I fornitori futuri registrano lo stesso contratto senza modificare canali/strumenti.

La chiave di configurazione è intenzionalmente separata dall'instradamento dell'analisi visiva:

- `agents.defaults.imageModel` analizza immagini.
- `agents.defaults.imageGenerationModel` genera immagini.

Mantienile separate affinché fallback e policy restino espliciti.

## Checklist di revisione

Prima di distribuire una nuova capacità, verifica:

- Nessun canale/strumento importa direttamente codice del fornitore.
- L'helper di runtime è il percorso condiviso.
- Almeno un test del contratto asserisce la proprietà inclusa.
- La documentazione di configurazione nomina il nuovo modello/la nuova chiave di configurazione.
- La documentazione dei plugin spiega il confine di proprietà.

Se una PR salta il livello della capacità e codifica direttamente il comportamento del fornitore in un canale/strumento, rimandala indietro e definisci prima il contratto.

## Correlati

- [Interni dei plugin](/it/plugins/architecture) — modello delle capacità, proprietà, pipeline di caricamento, helper di runtime.
- [Creare plugin](/it/plugins/building-plugins) — tutorial per il primo plugin.
- [Panoramica dell'SDK](/it/plugins/sdk-overview) — mappa di importazione e riferimento dell'API di registrazione.
- [Creare Skills](/it/tools/creating-skills) — superficie contributor complementare.
