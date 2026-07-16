---
read_when:
    - Je beheert gekoppelde nodes (camera's, scherm, canvas)
    - Je moet verzoeken goedkeuren of Node-opdrachten uitvoeren
summary: CLI-referentie voor `openclaw nodes` (status, koppelen, aanroepen, camera/canvas/scherm/locatie/melden)
title: Nodes
x-i18n:
    generated_at: "2026-07-16T15:25:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5b57235006d803fe09f626a65157dfb1f620d3d3c6f337e33132bcffdf4f1e37
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Beheer gekoppelde nodes (apparaten) en roep nodemogelijkheden aan.

Gerelateerd: [Overzicht van nodes](/nl/nodes) - [Aanwezigheid op actieve computer](/nodes/presence) - [Cameranodes](/nl/nodes/camera) - [Afbeeldingsnodes](/nl/nodes/images)

Algemene opties voor elke subopdracht: `--url <url>`, `--token <token>`, `--timeout <ms>` (standaard `10000`), `--json`.

## Status

```bash
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
openclaw nodes list
openclaw nodes describe --node <idOrNameOrIp>
```

`status` en `list` accepteren beide `--connected` (alleen verbonden nodes) en `--last-connected <duration>` (bijv. `24h`, `7d`; alleen nodes die binnen de tijdsduur verbinding hebben gemaakt). `list` toont wachtende en gekoppelde nodes in afzonderlijke tabellen, waarbij gekoppelde rijen de tijd sinds de meest recente verbinding (Last Connect) bevatten; `status` toont één samengevoegde tabel met per node details over mogelijkheden, versie en laatste invoer. Een verbonden macOS-node rapporteert de laatste invoer alleen zolang de toegankelijkheidsmachtiging is verleend, en de meest recente rij is gemarkeerd met `active`; zie [Aanwezigheid op actieve computer](/nodes/presence). `describe` toont de mogelijkheden, machtigingen, activiteit en effectieve/wachtende aanroepopdrachten van één node.

## Koppelen

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
```

Deze opdrachten beheren de door de Gateway beheerde `node.pair.*`-opslag, afzonderlijk van apparaatkoppeling (`openclaw devices approve`) die de WS-`connect`-handshake van de node toestaat. Zie [Nodes](/nl/nodes) voor hoe beide zich tot elkaar verhouden.

- `remove` trekt de vermelding voor de gekoppelde rol van de node in. Voor een door een apparaat ondersteunde node trekt dit de rol `node` in de opslag voor apparaatkoppelingen in en verbreekt het de sessies met de noderol: een apparaat met gemengde rollen behoudt zijn rij en verliest alleen de rol `node`, terwijl de rij van een apparaat met alleen een noderol wordt verwijderd. Ook wordt elke overeenkomende verouderde, door de Gateway beheerde nodekoppelingsrecord gewist.
- `pending` heeft alleen het bereik `operator.pairing` nodig.
- `gateway.nodes.pairing.autoApproveCidrs` kan de wachtstap overslaan voor expliciet vertrouwde, eerste apparaatkoppeling met `role: node`. Standaard uitgeschakeld; keurt rolupgrades niet goed.
- `gateway.nodes.pairing.sshVerify` (standaard ingeschakeld) keurt de eerste apparaatkoppeling met `role: node` automatisch goed wanneer de Gateway de apparaatsleutel via SSH naar de nodehost kan verifiëren; het eerste mogelijkhedenoppervlak wordt in dezelfde stap goedgekeurd. Zie [Nodekoppeling](/nl/gateway/pairing#ssh-verified-device-auto-approval-default).
- De bereikvereisten voor `approve` volgen de gedeclareerde opdrachten van de wachtende aanvraag:
  - aanvraag zonder opdracht: `operator.pairing`
  - gewone nodeopdrachten: `operator.pairing` + `operator.write`
  - beheerdergevoelige opdrachten (`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` en `system.execApprovals.get/set`): `operator.pairing` + `operator.admin`
- bereik `remove`: `operator.pairing` kan noderijen zonder operator verwijderen; een aanroeper met een apparaattoken die zijn eigen noderol op een apparaat met gemengde rollen intrekt, heeft daarnaast `operator.admin` nodig.

## Aanroepen

```bash
openclaw nodes invoke --node <id> --command system.which --params '{"bins":["uname"]}'
```

Vlaggen:

- `--command <command>` (verplicht): bijv. `canvas.eval`.
- `--params <json>`: tekenreeks met JSON-object (standaard `{}`).
- `--invoke-timeout <ms>`: time-out voor nodeaanroep (standaard `15000`).
- `--idempotency-key <key>`: optionele idempotentiesleutel.

`system.run` en `system.run.prepare` worden hier geblokkeerd; gebruik in plaats daarvan het hulpprogramma `exec` met `host=node` voor shelluitvoering. `system.which` is toegestaan via `invoke`.

## Melding, pushbericht, locatie, scherm

```bash
openclaw nodes notify --node <id> --title "Build" --body "Done" --priority timeSensitive
openclaw nodes push --node <id> --title "OpenClaw" --environment sandbox
openclaw nodes location get --node <id> --accuracy precise
openclaw nodes screen record --node <id> --duration 10s --fps 10 --out ./clip.mp4
```

- `notify` verzendt een lokale melding op een node die `system.notify` declareert, waaronder macOS-, iOS-, Android- en directe watchOS-nodes. Voor directe bezorging via watchOS moet OpenClaw actief zijn. Vereist `--title` of `--body`. Opties: `--sound <name>`, `--priority <passive|active|timeSensitive>`, `--delivery <system|overlay|auto>` (standaard `system`), `--invoke-timeout <ms>` (standaard `15000`).
- `push` verzendt een APNs-testpushbericht naar een iOS-node. Opties: `--title <text>` (standaard `OpenClaw`), `--body <text>`, `--environment <sandbox|production>` om de gedetecteerde APNs-omgeving te overschrijven.
- `location get` haalt de huidige locatie van de node op. Opties: `--max-age <ms>` (een locatiebepaling uit de cache hergebruiken), `--accuracy <coarse|balanced|precise>`, `--location-timeout <ms>` (standaard `10000`), `--invoke-timeout <ms>` (standaard `20000`).
- `screen record` neemt een korte clip op en toont het opgeslagen pad (of schrijft JSON met `--json`). Opties: `--screen <index>` (standaard `0`), `--duration <ms|10s>` (standaard `10000`), `--fps <fps>` (standaard `10`), `--no-audio`, `--out <path>`, `--invoke-timeout <ms>` (standaard `120000`).

Opdrachten voor Camera en Canvas hebben hun eigen documentatie: [Cameranodes](/nl/nodes/camera), [Canvas](/nl/platforms/mac/canvas). Canvas wordt geïmplementeerd door de meegeleverde experimentele Canvas-plugin; de kern behoudt `openclaw nodes canvas` als compatibiliteitskoppelpunt.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Nodes](/nl/nodes)
