---
read_when:
    - Je beheert gekoppelde nodes (camera's, scherm, canvas)
    - U moet aanvragen goedkeuren of Node-opdrachten uitvoeren
summary: CLI-referentie voor `openclaw nodes` (status, koppelen, aanroepen, camera/canvas/scherm)
title: Nodes
x-i18n:
    generated_at: "2026-05-06T17:54:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: f3eb0d23037c939e4022115a2d65e0e9cb25a872daed715b8652979ce6707cf7
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Beheer gekoppelde nodes (apparaten) en roep node-mogelijkheden aan.

Gerelateerd:

- Nodes-overzicht: [Nodes](/nl/nodes)
- Camera: [Camera-nodes](/nl/nodes/camera)
- Afbeeldingen: [Afbeeldingsnodes](/nl/nodes/images)

Veelgebruikte opties:

- `--url`, `--token`, `--timeout`, `--json`

## Veelgebruikte opdrachten

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

`nodes list` drukt tabellen af met wachtende/gekoppelde nodes. Gekoppelde rijen bevatten de leeftijd van de meest recente verbinding (Laatste verbinding).
Gebruik `--connected` om alleen momenteel verbonden nodes te tonen. Gebruik `--last-connected <duration>` om
te filteren op nodes die binnen een duur verbinding hebben gemaakt (bijv. `24h`, `7d`).
Gebruik `nodes remove --node <id|name|ip>` om een verouderd, door de gateway beheerd koppelingsrecord voor een node te verwijderen.

Opmerking over goedkeuring:

- `openclaw nodes pending` heeft alleen het koppelingsbereik nodig.
- `gateway.nodes.pairing.autoApproveCidrs` kan de wachtende stap alleen overslaan voor
  expliciet vertrouwde, eerste koppeling van apparaten met `role: node`. Dit staat standaard
  uit en keurt geen upgrades goed.
- `openclaw nodes approve <requestId>` erft extra bereikvereisten van de
  wachtende aanvraag:
  - aanvraag zonder opdracht: alleen koppeling
  - node-opdrachten zonder exec: koppeling + schrijven
  - `system.run` / `system.run.prepare` / `system.which`: koppeling + admin

## Aanroepen

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Aanroepvlaggen:

- `--params <json>`: JSON-objecttekenreeks (standaard `{}`).
- `--invoke-timeout <ms>`: time-out voor node-aanroep (standaard `15000`).
- `--idempotency-key <key>`: optionele idempotentiesleutel.
- `system.run` en `system.run.prepare` worden hier geblokkeerd; gebruik de `exec`-tool met `host=node` voor shelluitvoering.

Gebruik voor shelluitvoering op een node de `exec`-tool met `host=node` in plaats van `openclaw nodes run`.
De `nodes`-CLI is nu gericht op mogelijkheden: directe RPC via `nodes invoke`, plus koppeling, camera,
scherm, locatie, canvas en meldingen.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Nodes](/nl/nodes)
