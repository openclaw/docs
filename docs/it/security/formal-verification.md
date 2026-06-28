---
permalink: /security/formal-verification/
read_when:
    - Esame delle garanzie o dei limiti del modello formale di sicurezza
    - Riprodurre o aggiornare i controlli del modello di sicurezza TLA+/TLC
summary: Modelli di sicurezza verificati meccanicamente per i percorsi a più alto rischio di OpenClaw.
title: Verifica formale (modelli di sicurezza)
x-i18n:
    generated_at: "2026-05-06T09:08:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 298b92f27abb8321be807fe4d95c7cd568a0fb8f543d168863b2adb9b3ddcde4
    source_path: security/formal-verification.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Questa pagina tiene traccia dei **modelli formali di sicurezza** di OpenClaw (TLA+/TLC oggi; altri secondo necessità).

> Nota: alcuni link meno recenti potrebbero fare riferimento al nome precedente del progetto.

**Obiettivo (guida):** fornire un'argomentazione verificata automaticamente secondo cui OpenClaw applica la sua policy di sicurezza prevista (autorizzazione, isolamento delle sessioni, controllo di accesso agli strumenti e sicurezza contro configurazioni errate), in base ad assunzioni esplicite.

**Che cos'è (oggi):** una **suite di regressione di sicurezza** eseguibile e guidata dall'attaccante:

- Ogni affermazione ha un controllo del modello eseguibile su uno spazio di stati finito.
- Molte affermazioni hanno un **modello negativo** abbinato che produce una traccia di controesempio per una classe di bug realistica.

**Che cosa non è (ancora):** una prova che "OpenClaw è sicuro sotto ogni aspetto" o che l'implementazione TypeScript completa è corretta.

## Dove risiedono i modelli

I modelli sono mantenuti in un repo separato: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## Avvertenze importanti

- Questi sono **modelli**, non l'implementazione TypeScript completa. È possibile una divergenza tra modello e codice.
- I risultati sono limitati dallo spazio di stati esplorato da TLC; "verde" non implica sicurezza oltre le assunzioni e i limiti modellati.
- Alcune affermazioni si basano su assunzioni ambientali esplicite (ad esempio, distribuzione corretta, input di configurazione corretti).

## Riprodurre i risultati

Oggi i risultati si riproducono clonando localmente il repo dei modelli ed eseguendo TLC (vedi sotto). Un'iterazione futura potrebbe offrire:

- modelli eseguiti in CI con artefatti pubblici (tracce di controesempio, log di esecuzione)
- un flusso di lavoro ospitato "esegui questo modello" per controlli piccoli e limitati

Per iniziare:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ required (TLC runs on the JVM).
# The repo vendors a pinned `tla2tools.jar` (TLA+ tools) and provides `bin/tlc` + Make targets.

make <target>
```

### Esposizione del Gateway e configurazione errata di Gateway aperto

**Affermazione:** eseguire il binding oltre il loopback senza autenticazione può rendere possibile una compromissione remota / aumenta l'esposizione; token/password bloccano gli attaccanti non autenticati (secondo le assunzioni del modello).

- Esecuzioni verdi:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Rosso (previsto):
  - `make gateway-exposure-v2-negative`

Vedi anche: `docs/gateway-exposure-matrix.md` nel repo dei modelli.

### Pipeline di esecuzione Node (capacità a rischio più elevato)

**Affermazione:** `exec host=node` richiede (a) un elenco di comandi Node consentiti più comandi dichiarati e (b) approvazione live quando configurata; le approvazioni sono tokenizzate per impedire la riproduzione (nel modello).

- Esecuzioni verdi:
  - `make nodes-pipeline`
  - `make approvals-token`
- Rosso (previsto):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### Archivio di pairing (controllo di accesso dei DM)

**Affermazione:** le richieste di pairing rispettano TTL e limiti delle richieste in sospeso.

- Esecuzioni verdi:
  - `make pairing`
  - `make pairing-cap`
- Rosso (previsto):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Controllo di accesso in ingresso (menzioni + bypass dei comandi di controllo)

**Affermazione:** nei contesti di gruppo che richiedono una menzione, un "comando di controllo" non autorizzato non può aggirare il controllo di accesso basato sulle menzioni.

- Verde:
  - `make ingress-gating`
- Rosso (previsto):
  - `make ingress-gating-negative`

### Isolamento del routing/della chiave di sessione

**Affermazione:** i DM provenienti da peer distinti non confluiscono nella stessa sessione, salvo collegamento/configurazione espliciti.

- Verde:
  - `make routing-isolation`
- Rosso (previsto):
  - `make routing-isolation-negative`

## v1++: modelli limitati aggiuntivi (concorrenza, tentativi, correttezza della traccia)

Questi sono modelli successivi che rafforzano la fedeltà rispetto a modalità di errore reali (aggiornamenti non atomici, tentativi e fan-out dei messaggi).

### Concorrenza / idempotenza dell'archivio di pairing

**Affermazione:** un archivio di pairing dovrebbe applicare `MaxPending` e l'idempotenza anche in caso di interleaving (cioè, "check-then-write" deve essere atomico / protetto da lock; il refresh non dovrebbe creare duplicati).

Che cosa significa:

- In presenza di richieste concorrenti, non puoi superare `MaxPending` per un canale.
- Richieste/refresh ripetuti per la stessa coppia `(channel, sender)` non dovrebbero creare righe live in sospeso duplicate.

- Esecuzioni verdi:
  - `make pairing-race` (controllo del limite atomico/protetto da lock)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- Rosso (previsto):
  - `make pairing-race-negative` (race non atomica del limite begin/commit)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Correlazione della traccia / idempotenza in ingresso

**Affermazione:** l'ingestione dovrebbe preservare la correlazione della traccia attraverso il fan-out ed essere idempotente in caso di tentativi del provider.

Che cosa significa:

- Quando un evento esterno diventa più messaggi interni, ogni parte mantiene la stessa identità di traccia/evento.
- I tentativi non causano una doppia elaborazione.
- Se mancano gli ID evento del provider, la deduplicazione ripiega su una chiave sicura (ad esempio, ID traccia) per evitare di eliminare eventi distinti.

- Verde:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- Rosso (previsto):
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### Precedenza dmScope nel routing + identityLinks

**Affermazione:** il routing deve mantenere isolate per impostazione predefinita le sessioni DM e accorpare le sessioni solo quando configurato esplicitamente (precedenza del canale + link di identità).

Che cosa significa:

- Gli override dmScope specifici del canale devono prevalere sui valori predefiniti globali.
- identityLinks dovrebbe accorpare solo all'interno di gruppi collegati espliciti, non tra peer non correlati.

- Verde:
  - `make routing-precedence`
  - `make routing-identitylinks`
- Rosso (previsto):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

## Correlati

- [Modello di minaccia](/it/security/THREAT-MODEL-ATLAS)
- [Contribuire al modello di minaccia](/it/security/CONTRIBUTING-THREAT-MODEL)
