---
read_when:
    - Je beheert gekoppelde nodes (camera's, scherm, canvas)
    - Je moet verzoeken goedkeuren of node-commando's aanroepen
summary: CLI-referentie voor `openclaw nodes` (status, koppelen, aanroepen, camera/canvas/scherm)
title: Nodes
x-i18n:
    generated_at: "2026-05-07T13:14:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 681c199462d5f58c3e4346713263a78e7513335f087c713877e3050e21c8e15f
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Beheer gekoppelde nodes (apparaten) en roep node-mogelijkheden aan.

Gerelateerd:

- Node-overzicht: [Nodes](/nl/nodes)
- Camera: [Camera-nodes](/nl/nodes/camera)
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

`nodes list` drukt tabellen af voor in behandeling zijnde/gekoppelde items. Gekoppelde rijen bevatten de leeftijd van de meest recente verbinding (Laatste verbinding).
Gebruik `--connected` om alleen momenteel verbonden nodes weer te geven. Gebruik `--last-connected <duration>` om
te filteren op nodes die binnen een duur verbinding hebben gemaakt (bijv. `24h`, `7d`).
Gebruik `nodes remove --node <id|name|ip>` om een verouderd, door de Gateway beheerd node-koppelingsrecord te verwijderen.

Goedkeuringsopmerking:

- `openclaw nodes pending` heeft alleen koppelingsscope nodig.
- `gateway.nodes.pairing.autoApproveCidrs` kan de stap voor in behandeling zijnde aanvragen alleen overslaan voor
  expliciet vertrouwde, eerste `role: node`-apparaatkoppeling. Dit staat standaard uit
  en keurt upgrades niet goed.
- `openclaw nodes approve <requestId>` erft extra scopevereisten van de
  in behandeling zijnde aanvraag:
  - opdrachtloze aanvraag: alleen koppeling
  - niet-exec node-opdrachten: koppeling + schrijven
  - `system.run` / `system.run.prepare` / `system.which`: koppeling + beheerder

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
scherm, locatie, Canvas en meldingen. Canvas-opdrachten worden geïmplementeerd door de gebundelde experimentele Canvas-Plugin; de core behoudt een compatibiliteitshaak zodat ze onder `openclaw nodes canvas` blijven.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Nodes](/nl/nodes)
