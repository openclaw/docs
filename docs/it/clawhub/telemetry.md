---
read_when:
    - Lavorare sui controlli di telemetria / privacy
    - Domande su quali dati vengono raccolti
summary: Telemetria di installazione raccolta tramite `clawhub sync` + disattivazione.
x-i18n:
    generated_at: "2026-05-12T12:49:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetria

ClawHub usa **telemetria minima** per calcolare i **conteggi delle installazioni** (ciò che è effettivamente in uso) e per supportare ordinamento/filtro migliori.
Questo si basa sul comando CLI `clawhub sync`.

## Quando viene raccolta la telemetria

La telemetria viene inviata solo quando:

- Hai **effettuato l’accesso** nella CLI (richiediamo già l’autenticazione per i flussi di sync/pubblicazione).
- Esegui `clawhub sync`.
- La telemetria **non è disabilitata** (vedi “Come disabilitare” di seguito).

Se non hai effettuato l’accesso, non viene segnalato nulla.

## Cosa raccogliamo

A ogni `clawhub sync`, la CLI segnala un’**istantanea completa** di ciò che ha trovato, raggruppata per radice di scansione (“cartella/radice”).

Per ogni radice memorizziamo:

- `rootId`: un **hash SHA-256** del percorso radice canonico (il server non vede mai il percorso grezzo).
- `label`: un’etichetta leggibile derivata dagli ultimi due segmenti del percorso (i percorsi home sono mostrati con `~`).
- `firstSeenAt`, `lastSeenAt`, `expiredAt` facoltativo.

Per ogni skill trovata sotto una radice memorizziamo:

- `skillId` (risolto tramite slug; vengono tracciate solo le skill presenti nel registro).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (best-effort; attualmente la versione corrispondente nel registro, se nota).
- `removedAt` facoltativo quando un’installazione segnalata in precedenza scompare da una radice.

### Cosa _non_ raccogliamo

- Nessun percorso assoluto grezzo delle cartelle (solo `rootId` con hash + una breve etichetta di visualizzazione).
- Nessun contenuto dei file.
- Nessun log per esecuzione, prompt o altro output della CLI.
- Nessun tracciamento per skill non caricate nel registro (gli slug sconosciuti vengono ignorati).

## Conteggi delle installazioni

Manteniamo due contatori per skill:

- `installsCurrent`: utenti unici che hanno attualmente la skill installata in almeno una radice attiva.
- `installsAllTime`: utenti unici che hanno mai segnalato la skill come installata.

### Radici multiple

Se esegui sync da più cartelle, trattiamo ogni radice di scansione in modo indipendente. Una skill è “attualmente installata” se esiste in **qualsiasi** radice attiva.

### Rilevamento della disinstallazione

Poiché `sync` segnala l’insieme completo per radice:

- Se una skill scompare da una radice al sync successivo, la contrassegniamo come rimossa per quella radice.
- Se la skill viene rimossa da tutte le tue radici, non viene più conteggiata in `installsCurrent`.
- `installsAllTime` non diminuisce mai, a meno che tu non elimini la telemetria (vedi sotto).

### Obsolescenza (120 giorni)

Le radici che non segnalano telemetria per **120 giorni** vengono contrassegnate come obsolete e le loro installazioni smettono di essere conteggiate in `installsCurrent`.
Questo viene valutato in modo pigro (alla segnalazione di telemetria successiva) per evitare processi in background.

## Trasparenza + controlli utente

ClawHub fornisce una scheda privata “Installate” sul tuo profilo:

- Mostra le radici esatte + le skill installate che memorizziamo.
- Include una vista di **esportazione JSON**.
- Include un’azione **Elimina telemetria** per rimuovere tutta la telemetria memorizzata per il tuo account.

Tutti gli altri vedono solo **contatori aggregati delle installazioni**; nessun altro può vedere le tue radici/cartelle.

Eliminare il tuo account elimina anche i tuoi dati di telemetria.

## Come disabilitare la telemetria

Imposta la variabile d’ambiente:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Con questa impostazione, la CLI non invierà telemetria durante `clawhub sync`.
