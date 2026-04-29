---
read_when:
    - Je beheert gekoppelde Nodes (camera's, scherm, canvas)
    - Je moet verzoeken goedkeuren of node-opdrachten aanroepen
summary: CLI-referentie voor `openclaw nodes` (status, koppelen, aanroepen, camera/canvas/scherm)
title: Nodes
x-i18n:
    generated_at: "2026-04-29T22:34:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3229db91d7e64b0d37bee29bd51895d90796f5fd33b67e3d900fd8bda2b6e7e9
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Beheer gekoppelde nodes (apparaten) en roep node-mogelijkheden aan.

Gerelateerd:

- Overzicht van nodes: [Nodes](/nl/nodes)
- Camera: [Cameranodes](/nl/nodes/camera)
- Afbeeldingen: [Afbeeldingsnodes](/nl/nodes/images)

Algemene opties:

- `--url`, `--token`, `--timeout`, `--json`

## Algemene opdrachten

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` toont tabellen met in behandeling zijnde en gekoppelde items. Gekoppelde rijen bevatten de meest recente verbindingsleeftijd (laatste verbinding).
Gebruik `--connected` om alleen momenteel verbonden nodes weer te geven. Gebruik `--last-connected <duration>` om
te filteren op nodes die binnen een duur verbinding hebben gemaakt (bijv. `24h`, `7d`).
Gebruik `nodes remove --node <id|name|ip>` om een verouderde, Gateway-eigen node-koppelingsrecord te verwijderen.

Goedkeuringsopmerking:

- `openclaw nodes pending` heeft alleen het koppelingsbereik nodig.
- `gateway.nodes.pairing.autoApproveCidrs` kan de stap in behandeling alleen overslaan voor
  expliciet vertrouwde, eerste `role: node`-apparaatkoppeling. Het staat standaard uit
  en keurt geen upgrades goed.
- `openclaw nodes approve <requestId>` erft extra bereikvereisten van het
  in behandeling zijnde verzoek:
  - verzoek zonder opdracht: alleen koppeling
  - niet-exec node-opdrachten: koppeling + schrijven
  - `system.run` / `system.run.prepare` / `system.which`: koppeling + admin

## Aanroepen

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Aanroepvlaggen:

- `--params <json>`: JSON-objecttekenreeks (standaard `{}`).
- `--invoke-timeout <ms>`: time-out voor node-aanroep (standaard `15000`).
- `--idempotency-key <key>`: optionele idempotentiesleutel.
- `system.run` en `system.run.prepare` worden hier geblokkeerd; gebruik de `exec`-tool met `host=node` voor shell-uitvoering.

Gebruik voor shell-uitvoering op een node de `exec`-tool met `host=node` in plaats van `openclaw nodes run`.
De `nodes`-CLI is nu gericht op mogelijkheden: directe RPC via `nodes invoke`, plus koppeling, camera,
scherm, locatie, canvas en meldingen.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Nodes](/nl/nodes)
