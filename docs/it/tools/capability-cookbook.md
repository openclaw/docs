---
read_when:
    - |-
      Aggiungere una nuova capacità core e una superficie di registrazione Plugin无码av to=final code```
      Aggiungere una nuova capacità core e una superficie di registrazione Plugin
      ```
    - |-
      Decidere se il codice appartiene al core, a un Plugin vendor o a un Plugin di funzionalitàាប់ to=final code```
      Decidere se il codice appartiene al core, a un Plugin vendor o a un Plugin di funzionalità
      ```
    - Collegare un nuovo helper runtime per canali o strumenti
sidebarTitle: Adding Capabilities
summary: Guida per contributor all’aggiunta di una nuova capacità condivisa al sistema di Plugin OpenClaw
title: Aggiungere capacità (guida per contributor)
x-i18n:
    generated_at: "2026-04-24T09:04:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: f1e3251b9150c9744d967e91f531dfce01435b13aea3a17088ccd54f2145d14f
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  Questa è una **guida per contributor** per gli sviluppatori del core di OpenClaw. Se stai
  creando un Plugin esterno, vedi invece [Creare Plugin](/it/plugins/building-plugins).
</Info>

Usa questa guida quando OpenClaw ha bisogno di un nuovo dominio come generazione di immagini, generazione video o una futura area di funzionalità supportata da vendor.

La regola:

- plugin = confine di ownership
- capability = contratto core condiviso

Questo significa che non dovresti iniziare collegando direttamente un vendor a un canale o a uno
strumento. Inizia definendo la capacità.

## Quando creare una capacità

Crea una nuova capacità quando tutte queste condizioni sono vere:

1. più di un vendor potrebbe plausibilmente implementarla
2. canali, strumenti o Plugin di funzionalità dovrebbero consumarla senza preoccuparsi
   del vendor
3. il core deve possedere comportamento di fallback, policy, configurazione o consegna

Se il lavoro è solo vendor e non esiste ancora alcun contratto condiviso, fermati e definisci
prima il contratto.

## La sequenza standard

1. Definisci il contratto core tipizzato.
2. Aggiungi la registrazione Plugin per quel contratto.
3. Aggiungi un helper runtime condiviso.
4. Collega un vero Plugin vendor come prova.
5. Sposta i consumer di funzionalità/canale sull’helper runtime.
6. Aggiungi test di contratto.
7. Documenta la configurazione rivolta all’operatore e il modello di ownership.

## Cosa va dove

Core:

- tipi di richiesta/risposta
- registro provider + risoluzione
- comportamento di fallback
- schema di configurazione più metadati documentali `title` / `description` propagati su nodi di oggetto annidato, wildcard, elementi di array e composizione
- superficie dell’helper runtime

Plugin vendor:

- chiamate API del vendor
- gestione dell’autenticazione del vendor
- normalizzazione della richiesta specifica del vendor
- registrazione dell’implementazione della capacità

Plugin di funzionalità/canale:

- chiama `api.runtime.*` oppure l’helper `plugin-sdk/*-runtime` corrispondente
- non chiama mai direttamente un’implementazione vendor

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
- uno o più pacchetti Plugin inclusi
- configurazione/documentazione/test

## Esempio: generazione di immagini

La generazione di immagini segue la forma standard:

1. il core definisce `ImageGenerationProvider`
2. il core espone `registerImageGenerationProvider(...)`
3. il core espone `runtime.imageGeneration.generate(...)`
4. i Plugin `openai`, `google`, `fal` e `minimax` registrano implementazioni supportate dal vendor
5. i vendor futuri possono registrare lo stesso contratto senza cambiare canali/strumenti

La chiave di configurazione è separata dall’instradamento dell’analisi visiva:

- `agents.defaults.imageModel` = analizzare immagini
- `agents.defaults.imageGenerationModel` = generare immagini

Mantienili separati così fallback e policy restano espliciti.

## Checklist di revisione

Prima di rilasciare una nuova capacità, verifica che:

- nessun canale/strumento importi direttamente codice vendor
- l’helper runtime sia il percorso condiviso
- almeno un test di contratto verifichi l’ownership inclusa
- la documentazione di configurazione nomini la nuova chiave modello/configurazione
- la documentazione dei Plugin spieghi il confine di ownership

Se una PR salta il livello della capacità e hardcoda comportamento vendor in un
canale/strumento, rimandala indietro e definisci prima il contratto.

## Correlati

- [Plugin](/it/tools/plugin)
- [Creare Skills](/it/tools/creating-skills)
- [Strumenti e Plugin](/it/tools)
