---
read_when:
    - Je wilt opgeslagen sessies weergeven en recente activiteit bekijken
summary: CLI-referentie voor `openclaw sessions` (opgeslagen sessies weergeven + gebruik)
title: Sessies
x-i18n:
    generated_at: "2026-05-05T01:44:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6eb484ab1fa7686cf42dd00e640c4ae8616c4ea1c29873ea72694d72b9c680e7
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Toon opgeslagen gesprekssessies.

Sessielijsten zijn geen livecontroles voor kanalen/providers. Ze tonen blijvend opgeslagen gespreksrijen uit sessiestores. Een stille Discord, Slack, Telegram of ander kanaal kan succesvol opnieuw verbinden zonder een nieuwe sessierij aan te maken totdat een bericht wordt verwerkt. Gebruik `openclaw channels status --probe`, `openclaw status --deep` of `openclaw health --verbose` wanneer je live kanaalconnectiviteit nodig hebt.

Antwoorden van `openclaw sessions` en Gateway `sessions.list` zijn standaard begrensd, zodat grote, lang bestaande stores het CLI-proces of de Gateway-eventloop niet kunnen monopoliseren. De CLI retourneert standaard de nieuwste 100 sessies; geef `--limit <n>` mee voor een kleiner/groter venster of `--limit all` wanneer je bewust de volledige store nodig hebt. JSON-antwoorden bevatten `totalCount`, `limitApplied` en `hasMore` wanneer aanroepers moeten tonen dat er meer rijen bestaan.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --verbose
openclaw sessions --json
```

Scope-selectie:

- standaard: geconfigureerde standaardagentstore
- `--verbose`: uitgebreide logging
- `--agent <id>`: één geconfigureerde agentstore
- `--all-agents`: alle geconfigureerde agentstores samenvoegen
- `--store <path>`: expliciet storepad (kan niet worden gecombineerd met `--agent` of `--all-agents`)
- `--limit <n|all>`: maximaal aantal rijen om uit te voeren (standaard `100`; `all` herstelt volledige uitvoer)

Exporteer een trajectbundel voor een opgeslagen sessie:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Dit is het commandopad dat wordt gebruikt door de slashopdracht `/export-trajectory` nadat de eigenaar het exec-verzoek heeft goedgekeurd. De uitvoermap wordt altijd opgelost binnen `.openclaw/trajectory-exports/` onder de geselecteerde werkruimte.

`openclaw sessions --all-agents` leest geconfigureerde agentstores. Sessie-detectie van Gateway en ACP is breder: die omvat ook stores die alleen op schijf staan en worden gevonden onder de standaardroot `agents/` of een getemplate root voor `session.store`. Die gevonden stores moeten worden opgelost naar gewone `sessions.json`-bestanden binnen de agentroot; symlinks en paden buiten de root worden overgeslagen.

JSON-voorbeelden:

`openclaw sessions --all-agents --json`:

```json
{
  "path": null,
  "stores": [
    { "agentId": "main", "path": "/home/user/.openclaw/agents/main/sessions/sessions.json" },
    { "agentId": "work", "path": "/home/user/.openclaw/agents/work/sessions/sessions.json" }
  ],
  "allAgents": true,
  "count": 2,
  "totalCount": 2,
  "limitApplied": 100,
  "hasMore": false,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## Onderhoud opschonen

Voer onderhoud nu uit (in plaats van te wachten op de volgende schrijfcyclus):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` gebruikt `session.maintenance`-instellingen uit de configuratie:

- Scope-opmerking: `openclaw sessions cleanup` onderhoudt sessiestores, transcripten en trajectory-sidecars. Het snoeit geen Cron-runlogs (`cron/runs/<jobId>.jsonl`); die worden beheerd door `cron.runLog.maxBytes` en `cron.runLog.keepLines` in [Cron-configuratie](/nl/automation/cron-jobs#configuration) en uitgelegd in [Cron-onderhoud](/nl/automation/cron-jobs#maintenance).

- `--dry-run`: bekijk vooraf hoeveel items zouden worden gesnoeid/begrensd zonder te schrijven.
  - In tekstmodus drukt dry-run een actietabel per sessie af (`Action`, `Key`, `Age`, `Model`, `Flags`), zodat je kunt zien wat zou worden behouden versus verwijderd.
- `--enforce`: pas onderhoud toe, zelfs wanneer `session.maintenance.mode` `warn` is.
- `--fix-missing`: verwijder items waarvan transcriptbestanden ontbreken, zelfs als ze normaal nog niet op basis van leeftijd/aantal zouden vervallen.
- `--active-key <key>`: bescherm een specifieke actieve sleutel tegen verwijdering door schijfbudget. Duurzame externe gesprekspointers, zoals groepssessies en thread-gebonden chatsessies, worden ook behouden door onderhoud op basis van leeftijd/aantal/schijfbudget.
- `--agent <id>`: voer opschoning uit voor één geconfigureerde agentstore.
- `--all-agents`: voer opschoning uit voor alle geconfigureerde agentstores.
- `--store <path>`: voer uit tegen een specifiek `sessions.json`-bestand.
- `--json`: druk een JSON-samenvatting af. Met `--all-agents` bevat de uitvoer één samenvatting per store.

Wanneer een Gateway bereikbaar is, wordt niet-dry-run opschoning voor geconfigureerde agentstores via de Gateway verzonden, zodat deze dezelfde sessiestore-writer gebruikt als runtimeverkeer. Gebruik `--store <path>` voor expliciet offline herstel van een storebestand.

`openclaw sessions cleanup --all-agents --dry-run --json`:

```json
{
  "allAgents": true,
  "mode": "warn",
  "dryRun": true,
  "stores": [
    {
      "agentId": "main",
      "storePath": "/home/user/.openclaw/agents/main/sessions/sessions.json",
      "beforeCount": 120,
      "afterCount": 80,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

Gerelateerd:

- Sessieconfiguratie: [Configuratiereferentie](/nl/gateway/config-agents#session)

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Sessiebeheer](/nl/concepts/session)
