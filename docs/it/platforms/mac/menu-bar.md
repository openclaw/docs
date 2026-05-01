---
read_when:
    - Modificare l’interfaccia utente del menu Mac o la logica di stato
summary: Logica dello stato della barra dei menu e cosa viene mostrato agli utenti
title: Barra dei menu
x-i18n:
    generated_at: "2026-05-01T08:31:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 340b86a2e222fb1fe7fda4f0f0434127af1393a64348ea033ea284ba52866beb
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

# Logica dello stato della barra dei menu

## Cosa viene mostrato

- Mostriamo lo stato corrente del lavoro dell'agente nell'icona della barra dei menu e nella prima riga di stato del menu.
- Lo stato di integrità è nascosto mentre il lavoro è attivo; ritorna quando tutte le sessioni sono inattive.
- Un sottomenu radice “Contesto” contiene le sessioni recenti invece di espanderle direttamente nel menu radice.
- Il blocco “Nodes” nel menu radice elenca solo i **dispositivi** (Node associati tramite `node.list`), non le voci client/presenza.
- Una sezione radice “Utilizzo” appare sotto Contesto quando sono disponibili snapshot dell'utilizzo del provider, seguita dai dettagli sui costi di utilizzo quando disponibili.

## Modello di stato

- Sessioni: gli eventi arrivano con `runId` (per esecuzione) più `sessionKey` nel payload. La sessione “principale” è la chiave `main`; se assente, ripieghiamo sulla sessione aggiornata più di recente.
- Priorità: la principale vince sempre. Se la principale è attiva, il suo stato viene mostrato immediatamente. Se la principale è inattiva, viene mostrata la sessione non principale attiva più di recente. Non alterniamo avanti e indietro durante l'attività; cambiamo solo quando la sessione corrente diventa inattiva o la principale diventa attiva.
- Tipi di attività:
  - `job`: esecuzione di comandi ad alto livello (`state: started|streaming|done|error`).
  - `tool`: `phase: start|result` con `toolName` e `meta/args`.

## Enum IconState (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (override di debug)

### ActivityKind → glifo

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- predefinito → 🛠️

### Mappatura visiva

- `idle`: creaturina normale.
- `workingMain`: badge con glifo, tinta piena, animazione della zampa “al lavoro”.
- `workingOther`: badge con glifo, tinta attenuata, nessuno scatto.
- `overridden`: usa il glifo/la tinta scelti indipendentemente dall'attività.

## Sottomenu Contesto

- Il menu radice mostra una riga “Contesto” con un conteggio/stato delle sessioni e apre un sottomenu.
- L'intestazione del sottomenu Contesto mostra il conteggio delle sessioni attive nelle ultime 24 ore.
- Ogni riga di sessione mantiene barra dei token, età, anteprima, azioni di pensiero/verbose, reset, compressione ed eliminazione.
- I messaggi di caricamento, disconnessione ed errore di caricamento delle sessioni appaiono dentro il sottomenu Contesto.
- I dettagli sull'utilizzo del provider e sui costi di utilizzo restano al livello radice sotto Contesto, così rimangono consultabili a colpo d'occhio senza aprire il sottomenu.

## Testo della riga di stato (menu)

- Mentre il lavoro è attivo: `<Session role> · <activity label>`
  - Esempi: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- Quando inattivo: ripiega sul riepilogo dell'integrità.

## Acquisizione degli eventi

- Origine: eventi `agent` del canale di controllo (`ControlChannel.handleAgentEvent`).
- Campi analizzati:
  - `stream: "job"` con `data.state` per avvio/arresto.
  - `stream: "tool"` con `data.phase`, `name`, `meta`/`args` facoltativi.
- Etichette:
  - `exec`: prima riga di `args.command`.
  - `read`/`write`: percorso abbreviato.
  - `edit`: percorso più tipo di modifica dedotto da `meta`/conteggi diff.
  - ripiego: nome dello strumento.

## Override di debug

- Impostazioni ▸ Debug ▸ selettore “Override icona”:
  - `System (auto)` (predefinito)
  - `Working: main` (per tipo di strumento)
  - `Working: other` (per tipo di strumento)
  - `Idle`
- Archiviato tramite `@AppStorage("iconOverride")`; mappato a `IconState.overridden`.

## Checklist di test

- Attiva un job della sessione principale: verifica che l'icona cambi immediatamente e che la riga di stato mostri l'etichetta principale.
- Attiva un job di sessione non principale mentre la principale è inattiva: icona/stato mostrano la non principale; resta stabile finché non termina.
- Avvia la principale mentre un'altra è attiva: l'icona passa subito alla principale.
- Raffiche rapide di strumenti: assicurati che il badge non sfarfalli (periodo di grazia TTL sui risultati degli strumenti).
- La riga di integrità riappare quando tutte le sessioni sono inattive.

## Correlati

- [app macOS](/it/platforms/macos)
- [Icona della barra dei menu](/it/platforms/mac/icon)
