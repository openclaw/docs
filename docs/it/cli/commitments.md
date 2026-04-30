---
read_when:
    - Vuoi esaminare gli impegni successivi dedotti
    - Vuoi ignorare i check-in in sospeso
    - Stai verificando cosa può fornire Heartbeat
summary: Riferimento CLI per `openclaw commitments` (ispeziona e scarta le azioni successive dedotte)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-04-30T08:42:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37d5e5dca25cf649a5069360aa4e41fcc33d042dea99f643b98c07189c58f21c
    source_path: cli/commitments.md
    workflow: 16
---

Elenca e gestisce gli impegni di follow-up dedotti.

Gli impegni sono memorie di follow-up facoltative e di breve durata create dal
contesto della conversazione. Consulta [Impegni dedotti](/it/concepts/commitments)
per la guida concettuale.

Senza sottocomando, `openclaw commitments` elenca gli impegni in sospeso.

## Utilizzo

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## Opzioni

- `--all`: mostra tutti gli stati invece dei soli impegni in sospeso.
- `--agent <id>`: filtra per un singolo ID agente.
- `--status <status>`: filtra per stato. Valori: `pending`, `sent`,
  `dismissed`, `snoozed` o `expired`.
- `--json`: produce JSON leggibile dalle macchine.

## Esempi

Elenca gli impegni in sospeso:

```bash
openclaw commitments
```

Elenca ogni impegno archiviato:

```bash
openclaw commitments --all
```

Filtra per un singolo agente:

```bash
openclaw commitments --agent main
```

Trova gli impegni posticipati:

```bash
openclaw commitments --status snoozed
```

Ignora uno o più impegni:

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

Esporta come JSON:

```bash
openclaw commitments --all --json
```

## Output

L'output testuale include:

- ID dell'impegno
- stato
- tipo
- prima scadenza utile
- ambito
- testo di check-in suggerito

L'output JSON include anche il percorso dell'archivio degli impegni e i record
archiviati completi.

## Correlati

- [Impegni dedotti](/it/concepts/commitments)
- [Panoramica della memoria](/it/concepts/memory)
- [Heartbeat](/it/gateway/heartbeat)
- [Attività pianificate](/it/automation/cron-jobs)
