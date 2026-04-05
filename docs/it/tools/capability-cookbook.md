---
read_when:
    - Aggiunta di una nuova capacità core e della superficie di registrazione del plugin
    - Decisione se il codice appartiene al core, a un plugin vendor o a un plugin di funzionalità
    - Collegamento di un nuovo helper runtime per canali o strumenti
sidebarTitle: Adding Capabilities
summary: Guida per i collaboratori all'aggiunta di una nuova capacità condivisa al sistema di plugin OpenClaw
title: Aggiungere capacità (guida per i collaboratori)
x-i18n:
    generated_at: "2026-04-05T14:05:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29604d88e6df5205b835d71f3078b6223c58b6294135c3e201756c1bcac33ea3
    source_path: tools/capability-cookbook.md
    workflow: 15
---

# Aggiungere capacità

<Info>
  Questa è una **guida per i collaboratori** destinata agli sviluppatori core di OpenClaw. Se stai
  creando un plugin esterno, consulta invece [Building Plugins](/it/plugins/building-plugins).
</Info>

Usa questa guida quando OpenClaw richiede un nuovo dominio, come la generazione di immagini, la generazione di video
o qualche futura area di funzionalità supportata da vendor.

La regola è:

- plugin = confine di responsabilità
- capacità = contratto core condiviso

Questo significa che non dovresti iniziare collegando direttamente un vendor a un canale o a uno
strumento. Inizia definendo la capacità.

## Quando creare una capacità

Crea una nuova capacità quando tutte queste condizioni sono vere:

1. più di un vendor potrebbe plausibilmente implementarla
2. canali, strumenti o plugin di funzionalità dovrebbero utilizzarla senza preoccuparsi
   del vendor
3. il core deve gestire fallback, policy, configurazione o comportamento di distribuzione

Se il lavoro è solo lato vendor e non esiste ancora alcun contratto condiviso, fermati e definisci
prima il contratto.

## La sequenza standard

1. Definisci il contratto core tipizzato.
2. Aggiungi la registrazione del plugin per quel contratto.
3. Aggiungi un helper runtime condiviso.
4. Collega un plugin vendor reale come prova.
5. Sposta i consumer di funzionalità/canali sull'helper runtime.
6. Aggiungi test del contratto.
7. Documenta la configurazione rivolta agli operatori e il modello di responsabilità.

## Cosa va dove

Core:

- tipi di richiesta/risposta
- registro provider + risoluzione
- comportamento di fallback
- schema di configurazione più metadati documentali `title` / `description` propagati su nodi di oggetti annidati, wildcard, elementi di array e composizione
- superficie dell'helper runtime

Plugin vendor:

- chiamate API del vendor
- gestione auth del vendor
- normalizzazione delle richieste specifica del vendor
- registrazione dell'implementazione della capacità

Plugin di funzionalità/canale:

- chiama `api.runtime.*` o l'helper corrispondente `plugin-sdk/*-runtime`
- non chiama mai direttamente un'implementazione vendor

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
- uno o più pacchetti plugin bundled
- config/docs/tests

## Esempio: generazione di immagini

La generazione di immagini segue la forma standard:

1. il core definisce `ImageGenerationProvider`
2. il core espone `registerImageGenerationProvider(...)`
3. il core espone `runtime.imageGeneration.generate(...)`
4. i plugin `openai`, `google`, `fal` e `minimax` registrano implementazioni supportate dai vendor
5. i vendor futuri possono registrare lo stesso contratto senza modificare canali/strumenti

La chiave di configurazione è separata dal routing dell'analisi visiva:

- `agents.defaults.imageModel` = analizzare immagini
- `agents.defaults.imageGenerationModel` = generare immagini

Mantienile separate in modo che fallback e policy restino espliciti.

## Checklist di revisione

Prima di distribuire una nuova capacità, verifica:

- nessun canale/strumento importa direttamente codice vendor
- l'helper runtime è il percorso condiviso
- almeno un test del contratto verifica la responsabilità bundled
- la documentazione della configurazione nomina il nuovo modello/la nuova chiave di configurazione
- la documentazione dei plugin spiega il confine di responsabilità

Se una PR salta il livello della capacità e codifica rigidamente il comportamento del vendor in un
canale/strumento, rimandala indietro e definisci prima il contratto.
