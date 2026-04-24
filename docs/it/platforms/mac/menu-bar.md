---
read_when:
    - Modificare la UI della barra dei menu Mac o la logica di stato
summary: Logica dello stato della barra dei menu e ciò che viene mostrato agli utenti
title: Barra dei menu
x-i18n:
    generated_at: "2026-04-24T08:50:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89b03f3b0f9e56057d4cbf10bd1252372c65a2b2ae5e0405a844e9a59b51405d
    source_path: platforms/mac/menu-bar.md
    workflow: 15
---

# Logica dello stato della barra dei menu

## Cosa viene mostrato

- Mostriamo lo stato attuale di lavoro dell'agente nell'icona della barra dei menu e nella prima riga di stato del menu.
- Lo stato di salute viene nascosto mentre è attivo del lavoro; ricompare quando tutte le sessioni sono inattive.
- Il blocco “Nodes” nel menu elenca solo i **dispositivi** (node abbinati tramite `node.list`), non le voci client/presence.
- Una sezione “Usage” appare sotto Context quando sono disponibili snapshot di utilizzo del provider.

## Modello di stato

- Sessioni: gli eventi arrivano con `runId` (per esecuzione) più `sessionKey` nel payload. La sessione “main” è la chiave `main`; se assente, usiamo come fallback la sessione aggiornata più di recente.
- Priorità: vince sempre main. Se main è attiva, il suo stato viene mostrato immediatamente. Se main è inattiva, viene mostrata la sessione non-main attiva più di recente. Non facciamo flip-flop durante l'attività; cambiamo solo quando la sessione corrente diventa inattiva o main diventa attiva.
- Tipi di attività:
  - `job`: esecuzione di comandi ad alto livello (`state: started|streaming|done|error`).
  - `tool`: `phase: start|result` con `toolName` e `meta/args`.

## Enum `IconState` (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (override di debug)

### `ActivityKind` → glifo

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- predefinito → 🛠️

### Mappatura visiva

- `idle`: critter normale.
- `workingMain`: badge con glifo, tinta piena, animazione “working” delle zampe.
- `workingOther`: badge con glifo, tinta attenuata, nessun movimento rapido.
- `overridden`: usa il glifo/la tinta scelti indipendentemente dall'attività.

## Testo della riga di stato (menu)

- Mentre il lavoro è attivo: `<Session role> · <activity label>`
  - Esempi: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- Quando è inattivo: torna al riepilogo dello stato di salute.

## Ingestione degli eventi

- Sorgente: eventi `agent` del canale di controllo (`ControlChannel.handleAgentEvent`).
- Campi parsati:
  - `stream: "job"` con `data.state` per avvio/arresto.
  - `stream: "tool"` con `data.phase`, `name`, `meta`/`args` facoltativi.
- Etichette:
  - `exec`: prima riga di `args.command`.
  - `read`/`write`: percorso abbreviato.
  - `edit`: percorso più tipo di modifica dedotto da `meta`/conteggi diff.
  - fallback: nome dello strumento.

## Override di debug

- Settings ▸ Debug ▸ selettore “Icon override”:
  - `System (auto)` (predefinito)
  - `Working: main` (per tipo di strumento)
  - `Working: other` (per tipo di strumento)
  - `Idle`
- Memorizzato tramite `@AppStorage("iconOverride")`; mappato a `IconState.overridden`.

## Checklist di test

- Attiva un job della sessione main: verifica che l'icona cambi immediatamente e che la riga di stato mostri l'etichetta main.
- Attiva un job di una sessione non-main mentre main è inattiva: icona/stato mostrano la non-main; restano stabili finché non termina.
- Avvia main mentre un'altra è attiva: l'icona passa subito a main.
- Raffiche rapide di strumenti: assicurati che il badge non sfarfalli (grace TTL sui risultati degli strumenti).
- La riga dello stato di salute ricompare quando tutte le sessioni sono inattive.

## Correlati

- [App macOS](/it/platforms/macos)
- [Icona della barra dei menu](/it/platforms/mac/icon)
