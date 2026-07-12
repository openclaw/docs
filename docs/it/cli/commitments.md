---
read_when:
    - Vuoi esaminare gli impegni di follow-up dedotti
    - Vuoi ignorare i check-in in sospeso
    - Stai verificando ciò che Heartbeat può recapitare
summary: Riferimento CLI per `openclaw commitments` (ispezionare e ignorare i follow-up dedotti)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-12T06:55:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4323273a5d73975532f4728dc5e40c5d59e0c6d2e31a538f96bf3451e3fdf4d9
    source_path: cli/commitments.md
    workflow: 16
---

Elenca e gestisce gli impegni di follow-up dedotti.

Gli impegni sono facoltativi (`commitments.enabled`) e consistono in memorie di follow-up di breve durata create dal contesto della conversazione e recapitate tramite Heartbeat. Consulta [Impegni dedotti](/it/concepts/commitments) per la guida concettuale e la configurazione.

Senza sottocomandi, `openclaw commitments` elenca gli impegni in sospeso.

## Utilizzo

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## Opzioni

- `--all`: mostra tutti gli stati anziché soltanto gli impegni in sospeso.
- `--agent <id>`: filtra in base all'id di un singolo agente.
- `--status <status>`: filtra per stato. Valori: `pending`, `sent`, `dismissed`, `snoozed` o `expired`. I valori sconosciuti causano la terminazione con un errore.
- `--json`: produce JSON leggibile dalla macchina.

`dismiss` contrassegna gli id degli impegni specificati come `dismissed`, affinché Heartbeat non li recapiti.

## Esempi

Elencare gli impegni in sospeso:

```bash
openclaw commitments
```

Elencare tutti gli impegni memorizzati:

```bash
openclaw commitments --all
```

Filtrare in base a un singolo agente:

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

L'output testuale mostra il numero di impegni, il percorso dell'archivio, gli eventuali filtri attivi e una riga per ciascun impegno:

- id dell'impegno
- stato
- tipo (`event_check_in`, `deadline_check`, `care_check_in` o `open_loop`)
- prima scadenza possibile
- ambito (agente/canale/destinazione)
- testo suggerito per la verifica

L'output JSON include il conteggio, i filtri attivi per stato e agente, il percorso dell'archivio degli impegni e i record memorizzati completi.

## Argomenti correlati

- [Impegni dedotti](/it/concepts/commitments)
- [Panoramica della memoria](/it/concepts/memory)
- [Heartbeat](/it/gateway/heartbeat)
- [Attività pianificate](/it/automation/cron-jobs)
