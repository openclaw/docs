---
read_when:
    - Aggiunta di una nuova funzionalità di base e di un'interfaccia di registrazione dei plugin
    - Decidere se il codice appartiene al core, a un plugin del fornitore o a un plugin di funzionalità
    - Collegamento di un nuovo helper di runtime per canali o strumenti
sidebarTitle: Adding capabilities
summary: Guida per i collaboratori all'aggiunta di una nuova funzionalità condivisa al sistema di Plugin di OpenClaw
title: Aggiungere funzionalità (guida per i collaboratori)
x-i18n:
    generated_at: "2026-07-12T07:14:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3534b7521ab8183d91399cded8a3b397be46bf9bd18f2fdb88a8947bad67ffaa
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  Questa è una **guida per i contributori** destinata agli sviluppatori del core di OpenClaw. Se stai
  creando un plugin esterno, consulta invece [Creazione di plugin](/it/plugins/building-plugins).
  Per il riferimento architetturale approfondito (modello delle capability, proprietà,
  pipeline di caricamento, helper di runtime), consulta [Architettura interna dei Plugin](/it/plugins/architecture).
</Info>

Usa questa guida quando OpenClaw necessita di un nuovo dominio condiviso, come gli embedding, la
generazione di immagini, la generazione di video o una futura area funzionale supportata da fornitori.

La regola:

- **plugin** = confine di proprietà
- **capability** = contratto condiviso del core

Non collegare direttamente un fornitore a un canale o a uno strumento. Definisci prima la capability.

## Quando creare una capability

Crea una nuova capability solo quando sono vere **tutte** le condizioni seguenti:

1. Più di un fornitore potrebbe plausibilmente implementarla.
2. Canali, strumenti o plugin funzionali dovrebbero poterla utilizzare senza doversi occupare del fornitore.
3. Il core deve gestire fallback, criteri, configurazione o comportamento di distribuzione.

Se il lavoro riguarda un solo fornitore e non esiste ancora un contratto condiviso, definisci prima il contratto.

## La sequenza standard

1. Definisci il contratto tipizzato del core.
2. Aggiungi la registrazione del plugin per tale contratto.
3. Aggiungi un helper di runtime condiviso.
4. Collega un vero plugin di un fornitore come prova.
5. Sposta i consumatori funzionali o dei canali sull'helper di runtime.
6. Aggiungi test del contratto.
7. Documenta la configurazione destinata all'operatore e il modello di proprietà.

## Cosa va dove

| Livello                    | Responsabilità                                                                                                                                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Core**                   | Tipi di richiesta/risposta; registro e risoluzione dei provider; comportamento di fallback; schema di configurazione con metadati della documentazione `title`/`description` propagati ai nodi di oggetti annidati, caratteri jolly, elementi di array e composizione; superficie degli helper di runtime. |
| **Plugin del fornitore**   | Chiamate API del fornitore, gestione dell'autenticazione del fornitore, normalizzazione delle richieste specifica del fornitore e registrazione dell'implementazione della capability.                                                  |
| **Plugin funzionale/del canale** | Chiama `api.runtime.*` o l'helper `plugin-sdk/*-runtime` corrispondente. Non chiama mai direttamente l'implementazione di un fornitore.                                                                                           |

## Punti di estensione per provider e harness

Usa gli **hook dei provider** quando il comportamento appartiene al contratto del provider del modello anziché al ciclo generico dell'agente. Alcuni esempi sono i parametri di richiesta specifici del provider dopo la selezione del trasporto, la preferenza del profilo di autenticazione, le sovrapposizioni del prompt e l'instradamento di fallback successivo dopo il failover del modello o del profilo.

Usa gli **hook dell'harness dell'agente** quando il comportamento appartiene al runtime che sta eseguendo un turno. Gli harness possono classificare risultati espliciti del protocollo, come un output vuoto, un ragionamento senza output visibile o un piano strutturato senza risposta finale, affinché i criteri esterni di fallback del modello possano decidere se ripetere il tentativo.

Mantieni entrambi i punti di estensione circoscritti:

- Il core gestisce i criteri di nuovo tentativo e fallback.
- I plugin dei provider gestiscono i suggerimenti specifici del provider relativi a richieste, autenticazione e instradamento.
- I plugin degli harness gestiscono la classificazione dei tentativi specifica del runtime.
- I plugin di terze parti restituiscono suggerimenti, non modifiche dirette allo stato del core.

## Elenco di controllo dei file

Per una nuova capability, prevedi di intervenire nelle aree seguenti:

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

La generazione di immagini segue la struttura standard:

1. Il core definisce `ImageGenerationProvider`.
2. Il core espone `registerImageGenerationProvider(...)`.
3. Il core espone `api.runtime.imageGeneration.generate(...)` e `.listProviders(...)`.
4. I plugin dei fornitori (`comfy`, `deepinfra`, `fal`, `google`, `litellm`, `microsoft-foundry`, `minimax`, `openai`, `openrouter`, `vydra`, `xai`) registrano implementazioni supportate dai rispettivi fornitori.
5. I fornitori futuri registrano lo stesso contratto senza modificare canali o strumenti.

La chiave di configurazione è intenzionalmente separata dall'instradamento dell'analisi visiva:

- `agents.defaults.imageModel` analizza le immagini.
- `agents.defaults.imageGenerationModel` genera le immagini.

Mantienile separate affinché fallback e criteri restino espliciti.

## Provider di embedding

Usa `registerEmbeddingProvider(...)` / il contratto `embeddingProviders` per i
provider riutilizzabili di embedding vettoriali. Questo contratto è intenzionalmente più ampio
della memoria: strumenti, ricerca, recupero, strumenti di importazione o futuri plugin funzionali
possono utilizzare gli embedding senza dipendere dal motore della memoria. Anche la ricerca nella memoria
utilizza i provider generici `embeddingProviders`.

La precedente API di registrazione specifica per la memoria e il contratto
`memoryEmbeddingProviders` sono deprecati. Usa `registerEmbeddingProvider` e
`embeddingProviders` per tutti i nuovi provider di embedding.

## Elenco di controllo per la revisione

Prima di distribuire una nuova capability, verifica che:

- Nessun canale o strumento importi direttamente il codice di un fornitore.
- L'helper di runtime costituisca il percorso condiviso.
- Almeno un test del contratto verifichi la proprietà inclusa.
- La documentazione della configurazione indichi il nuovo modello o la nuova chiave di configurazione.
- La documentazione dei Plugin spieghi il confine di proprietà.

Se una PR ignora il livello delle capability e inserisce direttamente il comportamento specifico di un fornitore in un canale o uno strumento, rimandala indietro e definisci prima il contratto.

## Argomenti correlati

- [Architettura interna dei Plugin](/it/plugins/architecture) — modello delle capability, proprietà, pipeline di caricamento, helper di runtime.
- [Creazione di plugin](/it/plugins/building-plugins) — esercitazione per il primo plugin.
- [Panoramica dell'SDK](/it/plugins/sdk-overview) — mappa delle importazioni e riferimento dell'API di registrazione.
- [Creazione di Skills](/it/tools/creating-skills) — superficie complementare per i contributori.
