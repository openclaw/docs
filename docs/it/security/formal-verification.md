---
permalink: /security/formal-verification/
read_when:
    - Stai esaminando le garanzie o i limiti del modello di sicurezza formale
    - Vuoi riprodurre o aggiornare i controlli dei modelli di sicurezza TLA+/TLC
summary: Modelli di sicurezza verificati da macchina per i percorsi a rischio più elevato di OpenClaw.
title: Verifica formale (modelli di sicurezza)
x-i18n:
    generated_at: "2026-04-05T14:04:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f7cd2461dcc00d320a5210e50279d76a7fa84e0830c440398323d75e262a38a
    source_path: security/formal-verification.md
    workflow: 15
---

# Verifica formale (modelli di sicurezza)

Questa pagina tiene traccia dei **modelli di sicurezza formali** di OpenClaw (oggi TLA+/TLC; altro se necessario).

> Nota: alcuni link meno recenti potrebbero riferirsi al nome precedente del progetto.

**Obiettivo (stella polare):** fornire un argomento verificato da macchina secondo cui OpenClaw applica la propria
policy di sicurezza prevista (autorizzazione, isolamento delle sessioni, gating degli strumenti e
sicurezza rispetto a configurazioni errate), sotto ipotesi esplicite.

**Cos'è questo (oggi):** una **suite di regressione di sicurezza** eseguibile e guidata dall'attaccante:

- Ogni affermazione ha un model-check eseguibile su uno spazio di stati finito.
- Molte affermazioni hanno un **modello negativo** associato che produce una traccia di controesempio per una classe di bug realistica.

**Cosa non è (ancora):** una prova che “OpenClaw è sicuro sotto tutti gli aspetti” o che l'intera implementazione TypeScript sia corretta.

## Dove si trovano i modelli

I modelli sono mantenuti in un repository separato: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## Avvertenze importanti

- Questi sono **modelli**, non l'intera implementazione TypeScript. È possibile che ci sia deriva tra modello e codice.
- I risultati sono limitati dallo spazio di stati esplorato da TLC; uno stato “green” non implica sicurezza oltre le ipotesi e i limiti modellati.
- Alcune affermazioni si basano su ipotesi ambientali esplicite (ad esempio distribuzione corretta, input di configurazione corretti).

## Riprodurre i risultati

Oggi, i risultati si riproducono clonando localmente il repo dei modelli ed eseguendo TLC (vedi sotto). Una futura iterazione potrebbe offrire:

- modelli eseguiti in CI con artefatti pubblici (tracce di controesempio, log di esecuzione)
- un flusso ospitato “esegui questo modello” per controlli piccoli e limitati

Per iniziare:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# È richiesto Java 11+ (TLC gira sulla JVM).
# Il repo include una versione fissata di `tla2tools.jar` (strumenti TLA+) e fornisce `bin/tlc` + target Make.

make <target>
```

### Esposizione del Gateway e configurazione errata di gateway aperto

**Affermazione:** il bind oltre il loopback senza autenticazione può rendere possibile una compromissione remota / aumenta l'esposizione; token/password bloccano attaccanti non autenticati (secondo le ipotesi del modello).

- Esecuzioni green:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- Rosso (atteso):
  - `make gateway-exposure-v2-negative`

Vedi anche: `docs/gateway-exposure-matrix.md` nel repo dei modelli.

### Pipeline exec del nodo (capacità a rischio più elevato)

**Affermazione:** `exec host=node` richiede (a) allowlist dei comandi del nodo più comandi dichiarati e (b) approvazione live quando configurata; le approvazioni sono tokenizzate per impedire il replay (nel modello).

- Esecuzioni green:
  - `make nodes-pipeline`
  - `make approvals-token`
- Rosso (atteso):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### Store del pairing (gating DM)

**Affermazione:** le richieste di pairing rispettano TTL e limiti sulle richieste in sospeso.

- Esecuzioni green:
  - `make pairing`
  - `make pairing-cap`
- Rosso (atteso):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### Gating dell'ingresso (menzioni + bypass dei comandi di controllo)

**Affermazione:** in contesti di gruppo che richiedono menzione, un “comando di controllo” non autorizzato non può bypassare il gating per menzione.

- Green:
  - `make ingress-gating`
- Rosso (atteso):
  - `make ingress-gating-negative`

### Isolamento di instradamento/session-key

**Affermazione:** i DM da peer distinti non confluiscono nella stessa sessione salvo esplicito collegamento/configurazione.

- Green:
  - `make routing-isolation`
- Rosso (atteso):
  - `make routing-isolation-negative`

## v1++: modelli bounded aggiuntivi (concorrenza, retry, correttezza delle tracce)

Questi sono modelli successivi che aumentano la fedeltà rispetto a modalità di errore del mondo reale (aggiornamenti non atomici, retry e fan-out dei messaggi).

### Concorrenza / idempotenza dello store del pairing

**Affermazione:** uno store di pairing dovrebbe applicare `MaxPending` e idempotenza anche sotto interleaving (cioè “check-then-write” deve essere atomico / bloccato; refresh non dovrebbe creare duplicati).

Cosa significa:

- Con richieste concorrenti, non puoi superare `MaxPending` per un canale.
- Richieste/refresh ripetuti per la stessa coppia `(channel, sender)` non dovrebbero creare righe pending live duplicate.

- Esecuzioni green:
  - `make pairing-race` (controllo del limite atomico/bloccato)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- Rosso (atteso):
  - `make pairing-race-negative` (race del limite begin/commit non atomico)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### Correlazione / idempotenza delle tracce in ingresso

**Affermazione:** l'ingestione dovrebbe preservare la correlazione delle tracce attraverso il fan-out ed essere idempotente sotto i retry del provider.

Cosa significa:

- Quando un evento esterno diventa più messaggi interni, ogni parte mantiene la stessa identità di traccia/evento.
- I retry non producono doppia elaborazione.
- Se mancano gli ID evento del provider, la deduplicazione usa una chiave di fallback sicura (ad esempio trace ID) per evitare di scartare eventi distinti.

- Green:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- Rosso (atteso):
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### Precedenza di routing dmScope + identityLinks

**Affermazione:** l'instradamento deve mantenere isolate per default le sessioni DM e deve far convergere le sessioni solo quando esplicitamente configurato (precedenza del canale + identity links).

Cosa significa:

- Gli override dmScope specifici del canale devono prevalere sui default globali.
- Gli identityLinks dovrebbero far convergere solo all'interno di gruppi esplicitamente collegati, non tra peer non correlati.

- Green:
  - `make routing-precedence`
  - `make routing-identitylinks`
- Rosso (atteso):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`
