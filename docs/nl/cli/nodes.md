---
read_when:
    - Je beheert gekoppelde nodes (camera's, scherm, canvas)
    - Je moet verzoeken goedkeuren of node-opdrachten aanroepen
summary: CLI-referentie voor `openclaw nodes` (status, koppelen, aanroepen, camera/canvas/scherm)
title: Nodes
x-i18n:
    generated_at: "2026-06-27T17:21:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e752e4a5809e01ee7970204c84d9f1008f146d8a55954f6ed5de527a6a124bc7
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Beheer gekoppelde nodes (apparaten) en roep node-capabilities aan.

Gerelateerd:

- Nodes-overzicht: [Nodes](/nl/nodes)
- Camera: [Camera-nodes](/nl/nodes/camera)
- Afbeeldingen: [Afbeeldingsnodes](/nl/nodes/images)

Algemene opties:

- `--url`, `--token`, `--timeout`, `--json`

## Algemene commando's

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

`nodes list` drukt tabellen af voor wachtende/gekoppelde nodes. Gekoppelde rijen bevatten de meest recente verbindingsleeftijd (Laatste verbinding).
Gebruik `--connected` om alleen momenteel verbonden nodes te tonen. Gebruik `--last-connected <duration>` om
te filteren op nodes die binnen een duur verbinding hebben gemaakt (bijv. `24h`, `7d`).
Gebruik `nodes remove --node <id|name|ip>` om een node-koppeling te verwijderen. Voor een
apparaat-ondersteunde node trekt dit de `node`-rol van het apparaat in `devices/paired.json`
in en verbreekt het de sessies met node-rol (een apparaat met gemengde rollen behoudt de rij en
verliest alleen de `node`-rol; een apparaat met alleen de node-rol wordt verwijderd); het wist ook alle
overeenkomende verouderde koppelingsrecords voor nodes die eigendom zijn van de Gateway. `operator.pairing` kan
niet-operator-node-rijen verwijderen; een aanroeper met een apparaattoken die zijn eigen node-rol intrekt op een
apparaat met gemengde rollen heeft daarnaast `operator.admin` nodig.

Opmerking over goedkeuring:

- `openclaw nodes pending` heeft alleen pairing-scope nodig.
- `gateway.nodes.pairing.autoApproveCidrs` kan de wachtende stap alleen overslaan voor
  expliciet vertrouwde, eerste `role: node`-apparaatkoppeling. Dit staat standaard
  uit en keurt geen upgrades goed.
- `openclaw nodes approve <requestId>` erft extra scopevereisten van de
  wachtende aanvraag:
  - aanvraag zonder commando: alleen pairing
  - niet-exec-nodecommando's: pairing + write
  - `system.run` / `system.run.prepare` / `system.which`: pairing + admin

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
De `nodes`-CLI is nu gericht op capabilities: directe RPC via `nodes invoke`, plus pairing, camera,
scherm, locatie, Canvas en meldingen. Canvas-commando's worden geïmplementeerd door de gebundelde experimentele Canvas-plugin; core behoudt een compatibiliteitshaak zodat ze onder `openclaw nodes canvas` blijven.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Nodes](/nl/nodes)
