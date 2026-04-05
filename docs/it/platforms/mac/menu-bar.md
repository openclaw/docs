---
read_when:
    - Stai regolando l'interfaccia del menu Mac o la logica di stato
summary: Logica di stato della barra dei menu e cosa viene mostrato agli utenti
title: Barra dei menu
x-i18n:
    generated_at: "2026-04-05T13:58:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8eb73c0e671a76aae4ebb653c65147610bf3e6d3c9c0943d150e292e7761d16d
    source_path: platforms/mac/menu-bar.md
    workflow: 15
---

# Logica di stato della barra dei menu

## Cosa viene mostrato

- Mostriamo lo stato di lavoro corrente dell'agente nell'icona della barra dei menu e nella prima riga di stato del menu.
- Lo stato di salute è nascosto mentre è in corso del lavoro; ritorna quando tutte le sessioni sono inattive.
- Il blocco “Nodes” nel menu elenca solo i **dispositivi** (nodi paired tramite `node.list`), non le voci client/presence.
- Una sezione “Usage” appare sotto Context quando sono disponibili istantanee di utilizzo del provider.

## Modello di stato

- Sessioni: gli eventi arrivano con `runId` (per esecuzione) più `sessionKey` nel payload. La sessione “main” è la chiave `main`; se assente, usiamo come fallback la sessione aggiornata più di recente.
- Priorità: main vince sempre. Se main è attiva, il suo stato viene mostrato immediatamente. Se main è inattiva, viene mostrata la sessione non-main attiva più recentemente. Non passiamo avanti e indietro durante l'attività; cambiamo solo quando la sessione corrente diventa inattiva o main diventa attiva.
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
- `workingMain`: badge con glifo, tinta piena, animazione “working” della gamba.
- `workingOther`: badge con glifo, tinta attenuata, senza scurry.
- `overridden`: usa il glifo/tinta scelti indipendentemente dall'attività.

## Testo della riga di stato (menu)

- Mentre il lavoro è attivo: `<Ruolo sessione> · <etichetta attività>`
  - Esempi: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- Quando è inattivo: torna al riepilogo dello stato di salute.

## Ingestione degli eventi

- Sorgente: eventi `agent` del control-channel (`ControlChannel.handleAgentEvent`).
- Campi analizzati:
  - `stream: "job"` con `data.state` per avvio/arresto.
  - `stream: "tool"` con `data.phase`, `name`, `meta`/`args` facoltativi.
- Etichette:
  - `exec`: prima riga di `args.command`.
  - `read`/`write`: percorso abbreviato.
  - `edit`: percorso più tipo di modifica dedotto da `meta`/conteggi diff.
  - fallback: nome dello strumento.

## Override di debug

- Impostazioni ▸ Debug ▸ selettore “Icon override”:
  - `System (auto)` (predefinito)
  - `Working: main` (per tipo di strumento)
  - `Working: other` (per tipo di strumento)
  - `Idle`
- Memorizzato tramite `@AppStorage("iconOverride")`; mappato su `IconState.overridden`.

## Checklist di test

- Attiva un job della sessione main: verifica che l'icona cambi immediatamente e che la riga di stato mostri l'etichetta main.
- Attiva un job di una sessione non-main mentre main è inattiva: icona/stato mostrano la non-main; restano stabili fino al termine.
- Avvia main mentre un'altra è attiva: l'icona passa immediatamente a main.
- Burst rapidi di strumenti: assicurati che il badge non sfarfalli (grace TTL sui risultati degli strumenti).
- La riga dello stato di salute riappare una volta che tutte le sessioni sono inattive.
