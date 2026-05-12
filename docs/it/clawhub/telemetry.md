---
read_when:
    - Al lavoro sui controlli di telemetria / privacy
    - Domande su quali dati vengono raccolti
summary: Telemetria di installazione raccolta tramite `clawhub sync` + disattivazione.
x-i18n:
    generated_at: "2026-05-12T04:10:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetria

ClawHub usa una **telemetria minima** per calcolare i **conteggi delle installazioni** (ciò che è effettivamente in uso) e per migliorare ordinamento e filtri.
Questo si basa sul comando CLI `clawhub sync`.

## Quando viene raccolta la telemetria

La telemetria viene inviata solo quando:

- Hai **effettuato l’accesso** nella CLI (richiediamo già l’autenticazione per i flussi di sincronizzazione/pubblicazione).
- Esegui `clawhub sync`.
- La telemetria **non è disabilitata** (vedi “Come disabilitarla” sotto).

Se non hai effettuato l’accesso, non viene segnalato nulla.

## Cosa raccogliamo

A ogni `clawhub sync`, la CLI segnala uno **snapshot completo** di ciò che ha trovato, raggruppato per radice di scansione (“cartella/radice”).

Per ogni radice memorizziamo:

- `rootId`: un **hash SHA-256** del percorso radice canonico (il server non vede mai il percorso grezzo).
- `label`: un’etichetta leggibile derivata dagli ultimi due segmenti del percorso (i percorsi home sono mostrati con `~`).
- `firstSeenAt`, `lastSeenAt`, `expiredAt` opzionale.

Per ogni skill trovato sotto una radice memorizziamo:

- `skillId` (risolto tramite slug; vengono tracciati solo gli skill esistenti nel registro).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (best-effort; attualmente la versione corrispondente nel registro, se nota).
- `removedAt` opzionale quando un’installazione segnalata in precedenza scompare da una radice.

### Cosa _non_ raccogliamo

- Nessun percorso assoluto grezzo delle cartelle (solo `rootId` con hash + una breve etichetta di visualizzazione).
- Nessun contenuto dei file.
- Nessun log per esecuzione, prompt o altro output della CLI.
- Nessun tracciamento per skill che non sono caricati nel registro (gli slug sconosciuti vengono ignorati).

## Conteggi delle installazioni

Manteniamo due contatori per skill:

- `installsCurrent`: utenti unici che attualmente hanno lo skill installato in almeno una radice attiva.
- `installsAllTime`: utenti unici che hanno mai segnalato lo skill come installato.

### Radici multiple

Se sincronizzi da più cartelle, trattiamo ogni radice di scansione in modo indipendente. Uno skill è “attualmente installato” se esiste in **qualsiasi** radice attiva.

### Rilevamento della disinstallazione

Poiché `sync` segnala l’insieme completo per radice:

- Se uno skill scompare da una radice alla sincronizzazione successiva, lo contrassegniamo come rimosso per quella radice.
- Se lo skill viene rimosso da tutte le tue radici, non viene più conteggiato in `installsCurrent`.
- `installsAllTime` non diminuisce mai, a meno che tu non elimini la telemetria (vedi sotto).

### Obsolescenza (120 giorni)

Le radici che non segnalano telemetria per **120 giorni** vengono contrassegnate come obsolete e le loro installazioni smettono di essere conteggiate in `installsCurrent`.
Questo viene valutato in modo lazy (alla segnalazione di telemetria successiva) per evitare job in background.

## Trasparenza + controlli utente

ClawHub fornisce una scheda privata “Installati” sul tuo profilo:

- Mostra le radici esatte + gli skill installati che memorizziamo.
- Include una vista di **esportazione JSON**.
- Include un’azione **Elimina telemetria** per rimuovere tutta la telemetria memorizzata per il tuo account.

Tutti gli altri vedono solo **contatori di installazione aggregati**; nessun altro può vedere le tue radici/cartelle.

L’eliminazione del tuo account elimina anche i tuoi dati di telemetria.

## Come disabilitare la telemetria

Imposta la variabile d’ambiente:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Con questa impostazione, la CLI non invierà telemetria durante `clawhub sync`.
