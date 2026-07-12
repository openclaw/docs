---
permalink: /security/formal-verification/
read_when:
    - Revisione delle garanzie o dei limiti del modello formale di sicurezza
    - Riproduzione o aggiornamento delle verifiche del modello di sicurezza TLA+/TLC
summary: Modelli di sicurezza verificati automaticamente per i percorsi a più alto rischio di OpenClaw.
title: Verifica formale (modelli di sicurezza)
x-i18n:
    generated_at: "2026-07-12T07:29:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86342f6e2f54c08d5e0f8a08d0d488459650a6ace35e985ff886f847540202c9
    source_path: security/formal-verification.md
    workflow: 16
---

I modelli formali di sicurezza di OpenClaw (attualmente TLA+/TLC) forniscono un'argomentazione verificata automaticamente secondo cui specifici percorsi a rischio massimo — autorizzazione, isolamento delle sessioni, controllo dell'accesso agli strumenti e sicurezza in caso di configurazione errata — applicano i criteri previsti, sulla base di presupposti esplicitamente dichiarati.

> Nota: alcuni collegamenti meno recenti potrebbero fare riferimento al nome precedente del progetto.

## Che cos'è

Una suite eseguibile di test di regressione della sicurezza basata su scenari di attacco:

- Ogni affermazione dispone di una verifica del modello eseguibile su uno spazio degli stati finito.
- Molte affermazioni dispongono di un modello negativo associato che produce una traccia di controesempio per una classe realistica di bug.

Questa **non** è una prova che OpenClaw sia sicuro sotto ogni aspetto e non verifica l'intera implementazione TypeScript.

## Dove si trovano i modelli

I modelli sono gestiti in un repository separato: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

<Note>
Al momento tale repository non è raggiungibile (GitHub restituisce "Repository not found" al momento della stesura). Se risulta ancora non disponibile, chiedi nei canali dei manutentori di OpenClaw quale sia la posizione attuale prima di supporre che i modelli siano stati rimossi.
</Note>

## Avvertenze

- Si tratta di modelli, non dell'intera implementazione TypeScript: è possibile che il modello e il codice divergano.
- I risultati sono limitati dallo spazio degli stati esplorato da TLC. Un risultato positivo non implica sicurezza oltre i presupposti e i limiti modellati.
- Alcune affermazioni dipendono da presupposti espliciti sull'ambiente, ad esempio una distribuzione corretta e dati di configurazione corretti.

## Riproduzione dei risultati

Clona il repository dei modelli ed esegui TLC:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# È richiesto Java 11+ (TLC viene eseguito sulla JVM).
# Il repository include una versione fissata di tla2tools.jar e fornisce bin/tlc oltre ai target Make.

make <target>
```

Non esiste ancora un'integrazione CI con questo repository; un'iterazione futura potrebbe aggiungere modelli eseguiti dalla CI con artefatti pubblici (tracce di controesempio, registri di esecuzione) oppure un flusso ospitato "esegui questo modello" per piccole verifiche limitate.

## Affermazioni e target

### Esposizione del Gateway e configurazione errata di un Gateway aperto

**Affermazione:** l'associazione a interfacce diverse da loopback senza autenticazione può rendere possibile una compromissione remota e aumentare l'esposizione; un token o una password blocca gli autori di attacchi non autenticati, secondo i presupposti del modello.

| Risultato             | Target                                                           |
| --------------------- | ---------------------------------------------------------------- |
| Positivo              | `make gateway-exposure-v2`, `make gateway-exposure-v2-protected` |
| Negativo (previsto)   | `make gateway-exposure-v2-negative`                              |

Consulta anche `docs/gateway-exposure-matrix.md` nel repository dei modelli.

### Pipeline di esecuzione del Node (funzionalità a rischio massimo)

**Affermazione:** `exec host=node` richiede (a) un elenco di comandi consentiti per il Node insieme ai comandi dichiarati e (b) un'approvazione in tempo reale, se configurata; nel modello, le approvazioni vengono associate a token per impedirne il riutilizzo.

| Risultato             | Target                                                          |
| --------------------- | --------------------------------------------------------------- |
| Positivo              | `make nodes-pipeline`, `make approvals-token`                   |
| Negativo (previsto)   | `make nodes-pipeline-negative`, `make approvals-token-negative` |

### Archivio di associazione (controllo dell'accesso ai messaggi diretti)

**Affermazione:** le richieste di associazione rispettano il TTL e i limiti delle richieste in sospeso.

| Risultato             | Target                                               |
| --------------------- | ---------------------------------------------------- |
| Positivo              | `make pairing`, `make pairing-cap`                   |
| Negativo (previsto)   | `make pairing-negative`, `make pairing-cap-negative` |

### Controllo dell'ingresso (menzioni e aggiramento tramite comandi di controllo)

**Affermazione:** nei contesti di gruppo che richiedono una menzione, un comando di controllo non autorizzato non può aggirare il controllo basato sulle menzioni.

| Risultato             | Target                         |
| --------------------- | ------------------------------ |
| Positivo              | `make ingress-gating`          |
| Negativo (previsto)   | `make ingress-gating-negative` |

### Instradamento e isolamento delle chiavi di sessione

**Affermazione:** i messaggi diretti provenienti da interlocutori distinti non vengono accorpati nella stessa sessione, a meno che non siano esplicitamente collegati o configurati.

| Risultato             | Target                            |
| --------------------- | --------------------------------- |
| Positivo              | `make routing-isolation`          |
| Negativo (previsto)   | `make routing-isolation-negative` |

## Modelli v1++: concorrenza, nuovi tentativi e correttezza delle tracce

Modelli successivi che migliorano la fedeltà rispetto alle modalità di errore del mondo reale: aggiornamenti non atomici, nuovi tentativi e distribuzione dei messaggi.

### Concorrenza e idempotenza dell'archivio di associazione

**Affermazione:** l'archivio di associazione applica `MaxPending` e l'idempotenza anche in presenza di intercalamenti: la sequenza di verifica e scrittura deve essere atomica o protetta da blocco e l'aggiornamento non deve creare duplicati. In concreto: le richieste simultanee non possono superare `MaxPending` per un canale e richieste o aggiornamenti ripetuti per la stessa coppia `(channel, sender)` non creano righe in sospeso attive duplicate.

| Risultato             | Target                                                                                                                                                                      |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Positivo              | `make pairing-race` (verifica atomica o protetta da blocco del limite), `make pairing-idempotency`, `make pairing-refresh`, `make pairing-refresh-race`                      |
| Negativo (previsto)   | `make pairing-race-negative` (condizione di competizione non atomica tra inizio e commit sul limite), `make pairing-idempotency-negative`, `make pairing-refresh-negative`, `make pairing-refresh-race-negative` |

### Correlazione delle tracce e idempotenza dell'ingresso

**Affermazione:** l'acquisizione conserva la correlazione delle tracce durante la distribuzione ed è idempotente in caso di nuovi tentativi da parte del fornitore. Quando un evento esterno viene trasformato in più messaggi interni, ogni parte mantiene la stessa identità di traccia o evento; i nuovi tentativi non causano una doppia elaborazione; se mancano gli ID evento del fornitore, la deduplicazione ricorre a una chiave sicura, ad esempio l'ID traccia, per evitare di eliminare eventi distinti.

| Risultato             | Target                                                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Positivo              | `make ingress-trace`, `make ingress-trace2`, `make ingress-idempotency`, `make ingress-dedupe-fallback`                                     |
| Negativo (previsto)   | `make ingress-trace-negative`, `make ingress-trace2-negative`, `make ingress-idempotency-negative`, `make ingress-dedupe-fallback-negative` |

### Precedenza di dmScope nell'instradamento e identityLinks

**Affermazione:** l'instradamento mantiene isolate per impostazione predefinita le sessioni dei messaggi diretti e accorpa le sessioni soltanto quando è configurato esplicitamente, mediante la precedenza dei canali e i collegamenti di identità. Le impostazioni `dmScope` specifiche del canale prevalgono sui valori predefiniti globali; `identityLinks` accorpa le sessioni soltanto all'interno di gruppi collegati esplicitamente, non tra interlocutori non correlati.

| Risultato             | Target                                                                    |
| --------------------- | ------------------------------------------------------------------------- |
| Positivo              | `make routing-precedence`, `make routing-identitylinks`                   |
| Negativo (previsto)   | `make routing-precedence-negative`, `make routing-identitylinks-negative` |

## Contenuti correlati

- [Modello delle minacce](/it/security/THREAT-MODEL-ATLAS)
- [Contribuire al modello delle minacce](/it/security/CONTRIBUTING-THREAT-MODEL)
- [Risposta agli incidenti](/it/security/incident-response)
