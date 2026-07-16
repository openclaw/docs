---
read_when:
    - Si desidera esaminare gli impegni di follow-up dedotti
    - Si desidera ignorare i check-in in sospeso
    - Si sta verificando cosa potrebbe inviare l’Heartbeat
summary: Riferimento CLI per `openclaw commitments` (ispezionare e ignorare i follow-up dedotti)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-16T14:06:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: db8a7d8f5756ccb18ed0990fcedf50d1072bb67e775c29eefdbd1a7dd795b7b0
    source_path: cli/commitments.md
    workflow: 16
---

Elenca e gestisce gli impegni di follow-up dedotti.

Gli impegni sono facoltativi (`commitments.enabled`), memorie di follow-up di breve durata
create dal contesto della conversazione e recapitate tramite Heartbeat. Consultare
[Impegni dedotti](/it/concepts/commitments) per la guida concettuale e la configurazione.

Senza sottocomandi, `openclaw commitments` elenca gli impegni in sospeso.

## Utilizzo

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## Opzioni

- `--all`: mostra tutti gli stati anziché solo gli impegni in sospeso.
- `--agent <id>`: filtra in base all'ID di un agente.
- `--status <status>`: filtra per stato. Valori: `pending`, `sent`,
  `dismissed`, `snoozed` o `expired`. I valori sconosciuti causano la chiusura con un errore.
- `--json`: produce JSON leggibile dalle macchine.

`dismiss` contrassegna gli ID degli impegni specificati come `dismissed`, affinché Heartbeat non
li recapiti.

## Esempi

Elencare gli impegni in sospeso:

```bash
openclaw commitments
```

Elencare tutti gli impegni archiviati:

```bash
openclaw commitments --all
```

Filtrare in base a un agente:

```bash
openclaw commitments --agent main
```

Trovare gli impegni posticipati:

```bash
openclaw commitments --status snoozed
```

Ignorare uno o più impegni:

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

Esportare in formato JSON:

```bash
openclaw commitments --all --json
```

## Output

L'output testuale mostra il numero di impegni, il percorso del database SQLite condiviso, gli eventuali filtri attivi
e una riga per ciascun impegno:

- ID dell'impegno
- stato
- tipo (`event_check_in`, `deadline_check`, `care_check_in` o `open_loop`)
- prima scadenza possibile
- ambito (agente/canale/destinazione)
- testo suggerito per la verifica

L'output JSON include il numero, i filtri attivi per stato e agente, il
percorso del database SQLite condiviso e tutti i record archiviati.

## Argomenti correlati

- [Impegni dedotti](/it/concepts/commitments)
- [Panoramica della memoria](/it/concepts/memory)
- [Heartbeat](/it/gateway/heartbeat)
- [Attività pianificate](/it/automation/cron-jobs)
