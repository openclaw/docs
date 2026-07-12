---
read_when:
    - Modifica dell'interfaccia del menu Mac o della logica di stato
summary: Logica dello stato della barra dei menu e informazioni mostrate agli utenti
title: Barra dei menu
x-i18n:
    generated_at: "2026-07-12T07:14:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 480a85f383a6495c0e45850a322c0c67c4cc35e21d2d29b4bd86f42fdbf9430a
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

## Cosa viene mostrato

- Lo stato di lavoro corrente dell'agente viene visualizzato nell'icona della barra dei menu e nella prima riga di stato del menu.
- Lo stato di integrità viene nascosto mentre è in corso un'attività; riappare quando tutte le sessioni sono inattive.
- Una voce radice "Contesto" apre un sottomenu con le sessioni recenti anziché espanderle nel menu radice.
- Un blocco "Nodi" nel menu radice elenca solo i **dispositivi** associati (da `node.list`), non le voci relative a client/presenza.
- Una sezione radice "Utilizzo" appare sotto Contesto quando sono disponibili istantanee dell'utilizzo del provider, seguite dai dettagli sui costi, se disponibili.

## Modello di stato

- Origine: `WorkActivityStore` (`apps/macos/Sources/OpenClaw/WorkActivityStore.swift`).
- Gli eventi arrivano come `ControlAgentEvent` con un `runId`; il gestore (`ControlChannel.routeWorkActivity`) legge `sessionKey` dal payload dell'evento e usa `"main"` come valore predefinito se assente.
- Priorità: la sessione principale (`sessionKey == "main"` per impostazione predefinita) ha sempre la precedenza. Se la sessione principale è attiva, il suo stato viene mostrato immediatamente. Se è inattiva, viene mostrata invece la sessione non principale attiva più di recente. L'archivio non cambia sessione durante un'attività; passa a un'altra sessione solo quando quella corrente diventa inattiva o quella principale diventa attiva.
- Tipi di attività:
  - `job`: esecuzione di comandi di alto livello (`state: started|streaming|done|error|...`).
  - `tool`: `phase: start|result` con `name` e `meta`/`args` facoltativi.

## Enumerazione IconState (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (sostituzione per il debug)

### ActivityKind -> simbolo del badge

`ActivityKind` incapsula un `ToolKind` (`bash`, `read`, `write`, `edit`, `attach`, `other`) o un semplice `job`. Ciascuno corrisponde a un badge SF Symbol disegnato sopra l'icona della creatura (`IconState.badgeSymbolName`):

| Tipo            | Simbolo                            |
| --------------- | ---------------------------------- |
| `bash`          | `chevron.left.slash.chevron.right` |
| `read`          | `doc`                              |
| `write`         | `pencil`                           |
| `edit`          | `pencil.tip`                       |
| `attach`        | `paperclip`                        |
| `other` / `job` | `gearshape.fill`                   |

### Corrispondenza visiva

- `idle`: creatura normale, nessun badge.
- `workingMain`: badge con simbolo, tinta piena (risalto `.primary`), animazione delle zampe "al lavoro".
- `workingOther`: badge con simbolo, tinta attenuata (risalto `.secondary`), nessun movimento rapido.
- `overridden`: usa il simbolo e la tinta scelti indipendentemente dall'attività reale.

## Sottomenu del contesto

- Il menu principale mostra una riga "Contesto" con il numero e lo stato delle sessioni; apre un sottomenu (`MenuSessionsInjector`).
- L'intestazione del sottomenu mostra il numero di sessioni attive nelle ultime 24 ore.
- Ogni riga di sessione mantiene la barra dei token, l'età, l'anteprima, le opzioni per attivare o disattivare il ragionamento e la modalità dettagliata e le azioni di reimpostazione, Compaction ed eliminazione.
- I messaggi di caricamento, disconnessione ed errore durante il caricamento delle sessioni vengono visualizzati nel sottomenu del contesto.
- Le sezioni relative all'utilizzo e ai costi rimangono al livello principale sotto Contesto, così da poter essere consultate a colpo d'occhio senza aprire il sottomenu.

## Testo della riga di stato (menu)

- Mentre il lavoro è attivo: `<Session role> · <activity label>` (`"\(roleLabel) · \(activity.label)"` in `MenuContentView`), dove l'etichetta del ruolo è `Main` o `Other`.
- Quando è inattivo: torna al riepilogo dello stato di integrità.

## Acquisizione degli eventi

- Origine: eventi `agent` del canale di controllo, instradati da `ControlChannel.routeWorkActivity(from:)`.
- Campi analizzati:
  - `stream: "job"` con `data.state` per l'avvio/arresto.
  - `stream: "tool"` con `data.phase`, `data.name` e `data.meta`/`data.args` facoltativi.
- Le etichette degli strumenti provengono da `ToolDisplayRegistry.resolve(name:args:meta:)`; per i nomi non risolti viene utilizzato il nome grezzo dello strumento.

## Override di debug

- Impostazioni > Debug > selettore "Icon override":
  - `System (auto)` (predefinito)
  - `Working: main` / `Working: other` (per tipo di strumento: bash, lettura, scrittura, modifica, altro)
  - `Idle`
- Memorizzato nella chiave `UserDefaults` `openclaw.iconOverride`; associato a `IconState.overridden`.

## Elenco di controllo per i test

- Avviare un processo della sessione principale: l'icona cambia immediatamente e la riga di stato mostra l'etichetta della sessione principale.
- Avviare un processo di una sessione non principale mentre quella principale è inattiva: l'icona e lo stato mostrano la sessione non principale e rimangono stabili fino al suo completamento.
- Avviare la sessione principale mentre un'altra sessione è attiva: l'icona passa immediatamente alla sessione principale.
- Raffiche rapide di strumenti: il badge non sfarfalla (finestra di tolleranza di 2 secondi prima di rimuovere uno strumento che ha terminato, `WorkActivityStore.toolResultGrace`).
- La riga dello stato di integrità ricompare quando tutte le sessioni sono inattive.

## Correlati

- [App macOS](/it/platforms/macos)
- [Icona della barra dei menu](/it/platforms/mac/icon)
