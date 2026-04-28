---
permalink: "/security/formal-verification/"
read_when:
- Esaminare le garanzie o i limiti dei modelli formali di sicurezza
- Reproducing or updating TLA+/TLC security model checks
summary: Modelli di sicurezza verificati automaticamente per i percorsi a rischio
  più elevato di OpenClaw.
title: Verifica formale (modelli di sicurezza)
x-i18n:
  generated_at: '2026-04-24T09:01:59Z'
  model: gpt-5.4
  provider: openai
  source_hash: 8f50fa9118a80054b8d556cd4f1901b2d5fcb37fb0866bd5357a1b0a46c74116
  source_path: security/formal-verification.md
  workflow: 15
---

Questa pagina tiene traccia dei **modelli formali di sicurezza** di OpenClaw (oggi TLA+/TLC; altro se necessario).

> Nota: alcuni link più vecchi potrebbero riferirsi al nome precedente del progetto.

**Obiettivo (north star):** fornire un'argomentazione verificata automaticamente che OpenClaw applichi la
policy di sicurezza prevista (autorizzazione, isolamento delle sessioni, gating degli strumenti e
sicurezza rispetto alle misconfigurazioni), sotto assunzioni esplicite.

**Che cos'è questo (oggi):** una **suite di regressione di sicurezza** eseguibile e guidata dall'attaccante:

- Ogni affermazione ha un model-check eseguibile su uno spazio di stati finito.
- Molte affermazioni hanno un **modello negativo** accoppiato che produce una traccia di controesempio per una classe realistica di bug.

**Che cosa non è (ancora):** una prova che “OpenClaw è sicuro sotto tutti gli aspetti” o che l'intera implementazione TypeScript sia corretta.

## Dove si trovano i modelli

I modelli sono mantenuti in un repository separato: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## Avvertenze importanti

- Questi sono **modelli**, non l'intera implementazione TypeScript. È possibile una divergenza tra modello e codice.
- I risultati sono limitati dallo spazio di stati esplorato da TLC; un risultato “verde” non implica sicurezza oltre le assunzioni e i limiti modellati.
- Alcune affermazioni si basano su assunzioni ambientali esplicite (ad es. distribuzione corretta, input di configurazione corretti).

## Riprodurre i risultati

Oggi i risultati si riproducono clonando localmente il repo dei modelli ed eseguendo TLC (vedi sotto). Una futura iterazione potrebbe offrire:

- modelli eseguiti in CI con artifact pubblici (tracce di controesempio, log delle esecuzioni)
- un workflow ospitato “esegui questo modello” per controlli piccoli e limitati

Per iniziare:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ richiesto (TLC gira sulla JVM).
# Il repo include un `tla2tools.jar` fissato (strumenti TLA+) e fornisce `bin/tlc` + target Make.

make <target>
```

### Esposizione del Gateway e misconfigurazione di gateway aperto

**Affermazione:** il bind oltre il loopback senza autenticazione può rendere possibile un compromesso remoto / aumenta l'esposizione; token/password bloccano attaccanti non autenticati (secondo le assunzioni del modello).

- Esecuzioni verdi:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Rosso (atteso):
  - `make gateway-exposure-v2-negative`

Vedi anche: `docs/gateway-exposure-matrix.md` nel repo dei modelli.

### Pipeline exec dei Node (capacità a rischio più elevato)

**Affermazione:** `exec host=node` richiede (a) allowlist dei comandi del node più comandi dichiarati e (b) approvazione live quando configurata; le approvazioni sono tokenizzate per prevenire replay (nel modello).

- Esecuzioni verdi:
  - `make nodes-pipeline`
  - `make approvals-token`
- Rosso (atteso):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### Archivio di abbinamento (gating DM)

**Affermazione:** le richieste di abbinamento rispettano TTL e limiti delle richieste in sospeso.

- Esecuzioni verdi:
  - `make pairing`
  - `make pairing-cap`
- Rosso (atteso):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Gating dell'ingresso (menzioni + bypass dei comandi di controllo)

**Affermazione:** nei contesti di gruppo che richiedono menzione, un “comando di controllo” non autorizzato non può bypassare il gating della menzione.

- Verde:
  - `make ingress-gating`
- Rosso (atteso):
  - `make ingress-gating-negative`

### Isolamento dell'instradamento/session-key

**Affermazione:** i DM da peer distinti non collassano nella stessa sessione a meno che non siano esplicitamente collegati/configurati.

- Verde:
  - `make routing-isolation`
- Rosso (atteso):
  - `make routing-isolation-negative`

## v1++: modelli limitati aggiuntivi (concorrenza, retry, correttezza delle trace)

Questi sono modelli successivi che aumentano la fedeltà rispetto ai reali modi di guasto (aggiornamenti non atomici, retry e fan-out dei messaggi).

### Concorrenza / idempotenza dell'archivio di abbinamento

**Affermazione:** un archivio di abbinamento dovrebbe imporre `MaxPending` e idempotenza anche sotto interleaving (cioè, “check-then-write” deve essere atomico / bloccato; refresh non dovrebbe creare duplicati).

Cosa significa:

- Sotto richieste concorrenti, non puoi superare `MaxPending` per un canale.
- Richieste/rinfreschi ripetuti per lo stesso `(channel, sender)` non dovrebbero creare righe pending live duplicate.

- Esecuzioni verdi:
  - `make pairing-race` (controllo del limite atomico/bloccato)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- Rosso (atteso):
  - `make pairing-race-negative` (race sul limite begin/commit non atomico)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Correlazione/idempotenza delle trace di ingresso

**Affermazione:** l'ingestione dovrebbe preservare la correlazione delle trace nel fan-out ed essere idempotente sotto retry del provider.

Cosa significa:

- Quando un evento esterno diventa più messaggi interni, ogni parte mantiene la stessa identità di trace/evento.
- I retry non comportano doppia elaborazione.
- Se mancano gli ID evento del provider, la deduplica usa il fallback a una chiave sicura (ad es. trace ID) per evitare di eliminare eventi distinti.

- Verde:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- Rosso (atteso):
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### Precedenza dmScope dell'instradamento + identityLinks

**Affermazione:** l'instradamento deve mantenere isolate per impostazione predefinita le sessioni DM e collassarle solo quando esplicitamente configurato (precedenza del canale + identity links).

Cosa significa:

- Gli override dmScope specifici del canale devono avere la precedenza sui valori predefiniti globali.
- Gli identityLinks dovrebbero collassare solo all'interno di gruppi esplicitamente collegati, non tra peer non correlati.

- Verde:
  - `make routing-precedence`
  - `make routing-identitylinks`
- Rosso (atteso):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

## Correlati

- [Modello di minaccia](/it/security/THREAT-MODEL-ATLAS)
- [Contribuire al modello di minaccia](/it/security/CONTRIBUTING-THREAT-MODEL)
