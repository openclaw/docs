---
read_when:
    - Modifica dell'interfaccia utente del menu Mac o della logica di stato
summary: Logica dello stato della barra dei menu e ciò che viene mostrato agli utenti
title: Barra dei menu
x-i18n:
    generated_at: "2026-05-06T09:00:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: c569ced20b2f6a639d52d373cc8b55a42d7c015a0b234d5154ce67ac03c2eaf6
    source_path: platforms/mac/menu-bar.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## Cosa viene mostrato

- Mostriamo lo stato di lavoro corrente dell'agente nell'icona della barra dei menu e nella prima riga di stato del menu.
- Lo stato di salute è nascosto mentre il lavoro è attivo; ritorna quando tutte le sessioni sono inattive.
- Un sottomenu radice "Contesto" contiene le sessioni recenti invece di espanderle direttamente nel menu radice.
- Il blocco "Nodes" nel menu radice elenca solo i **dispositivi** (nodi associati tramite `node.list`), non le voci client/presenza.
- Una sezione radice "Utilizzo" appare sotto Contesto quando sono disponibili snapshot dell'utilizzo del provider, seguita dai dettagli sui costi di utilizzo quando disponibili.

## Modello di stato

- Sessioni: gli eventi arrivano con `runId` (per esecuzione) più `sessionKey` nel payload. La sessione "main" è la chiave `main`; se assente, ripieghiamo sulla sessione aggiornata più di recente.
- Priorità: main vince sempre. Se main è attiva, il suo stato viene mostrato immediatamente. Se main è inattiva, viene mostrata la sessione non-main attiva più di recente. Non oscilliamo durante l'attività; cambiamo solo quando la sessione corrente diventa inattiva o main diventa attiva.
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

- `idle`: creatura normale.
- `workingMain`: badge con glifo, tinta piena, animazione "working" delle zampe.
- `workingOther`: badge con glifo, tinta attenuata, nessuno scatto.
- `overridden`: usa il glifo/la tinta scelti indipendentemente dall'attività.

## Sottomenu Contesto

- Il menu radice mostra una riga "Contesto" con conteggio/stato delle sessioni e apre un sottomenu.
- L'intestazione del sottomenu Contesto mostra il conteggio delle sessioni attive nelle ultime 24 ore.
- Ogni riga di sessione mantiene la propria barra dei token, età, anteprima, azioni di thinking/verbose, reset, compact ed eliminazione.
- I messaggi di caricamento, disconnessione ed errore di caricamento delle sessioni appaiono nel sottomenu Contesto.
- I dettagli di utilizzo del provider e dei costi di utilizzo restano a livello radice sotto Contesto, così rimangono consultabili a colpo d'occhio senza aprire il sottomenu.

## Testo della riga di stato (menu)

- Mentre il lavoro è attivo: `<Session role> · <activity label>`
  - Esempi: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- Quando è inattivo: ripiega sul riepilogo dello stato di salute.

## Acquisizione eventi

- Origine: eventi `agent` del canale di controllo (`ControlChannel.handleAgentEvent`).
- Campi analizzati:
  - `stream: "job"` con `data.state` per avvio/arresto.
  - `stream: "tool"` con `data.phase`, `name`, `meta`/`args` opzionali.
- Etichette:
  - `exec`: prima riga di `args.command`.
  - `read`/`write`: percorso abbreviato.
  - `edit`: percorso più tipo di modifica dedotto da `meta`/conteggi diff.
  - ripiego: nome dello strumento.

## Override di debug

- Impostazioni ▸ Debug ▸ selettore "Override icona":
  - `System (auto)` (predefinito)
  - `Working: main` (per tipo di strumento)
  - `Working: other` (per tipo di strumento)
  - `Idle`
- Salvato tramite `@AppStorage("iconOverride")`; mappato a `IconState.overridden`.

## Checklist di test

- Attiva un job della sessione main: verifica che l'icona cambi immediatamente e che la riga di stato mostri l'etichetta main.
- Attiva un job di sessione non-main mentre main è inattiva: icona/stato mostrano la non-main; resta stabile finché non termina.
- Avvia main mentre un'altra sessione è attiva: l'icona passa istantaneamente a main.
- Raffiche rapide di strumenti: assicurati che il badge non lampeggi (grazia TTL sui risultati degli strumenti).
- La riga di salute riappare quando tutte le sessioni sono inattive.

## Correlati

- [app macOS](/it/platforms/macos)
- [Icona della barra dei menu](/it/platforms/mac/icon)
