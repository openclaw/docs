---
read_when:
    - Je wilt opgeslagen sessies weergeven en recente activiteit bekijken
summary: CLI-referentie voor `openclaw sessions` (opgeslagen sessies weergeven + gebruik)
title: Sessies
x-i18n:
    generated_at: "2026-05-07T13:15:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: cdfdc9223f11da87b514f96e0a9505286e36d98647b3ff3a79b90588e4e69c1b
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Toon opgeslagen gesprekssessies.

Sessielijsten zijn geen livecontroles voor kanalen/providers. Ze tonen opgeslagen
gespreksrijen uit sessiestores. Een stille Discord, Slack, Telegram of een
ander kanaal kan opnieuw verbinden zonder een nieuwe sessierij aan te maken
totdat een bericht wordt verwerkt. Gebruik `openclaw channels status --probe`,
`openclaw status --deep` of `openclaw health --verbose` wanneer je live
kanaalconnectiviteit nodig hebt.

`openclaw sessions`- en Gateway `sessions.list`-reacties zijn standaard
begrensd, zodat grote langlopende stores het CLI-proces of de Gateway-eventloop
niet kunnen monopoliseren. De CLI retourneert standaard de nieuwste 100 sessies;
geef `--limit <n>` mee voor een kleiner/groter venster of `--limit all` wanneer
je bewust de volledige store nodig hebt. JSON-reacties bevatten `totalCount`,
`limitApplied` en `hasMore` wanneer aanroepers moeten tonen dat er meer rijen
bestaan.

RPC-clients kunnen `configuredAgentsOnly: true` meegeven om de brede
gecombineerde detectiebron te behouden maar alleen rijen te retourneren voor
agents die momenteel in de configuratie aanwezig zijn. Control UI gebruikt die
modus standaard, zodat verwijderde of alleen-op-schijf aanwezige agentstores
niet opnieuw in de Sessies-weergave verschijnen.

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

- standaard: geconfigureerde standaard-agentstore
- `--verbose`: uitgebreide logging
- `--agent <id>`: één geconfigureerde agentstore
- `--all-agents`: alle geconfigureerde agentstores samenvoegen
- `--store <path>`: expliciet storepad (kan niet worden gecombineerd met `--agent` of `--all-agents`)
- `--limit <n|all>`: maximaal aantal uit te voeren rijen (standaard `100`; `all` herstelt volledige uitvoer)

Exporteer een trajectbundel voor een opgeslagen sessie:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Dit is het commandopad dat door de slashcommand `/export-trajectory` wordt
gebruikt nadat de eigenaar het exec-verzoek heeft goedgekeurd. De uitvoermap
wordt altijd binnen `.openclaw/trajectory-exports/` onder de geselecteerde
workspace opgelost.

`openclaw sessions --all-agents` leest geconfigureerde agentstores. Gateway- en
ACP-sessiedetectie zijn breder: ze omvatten ook alleen-op-schijf aanwezige
stores die zijn gevonden onder de standaardroot `agents/` of een gesjabloneerde
`session.store`-root. Die ontdekte stores moeten worden opgelost naar reguliere
`sessions.json`-bestanden binnen de agentroot; symlinks en paden buiten de root
worden overgeslagen.

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

## Opschoononderhoud

Voer onderhoud nu uit (in plaats van te wachten op de volgende schrijfcylus):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` gebruikt `session.maintenance`-instellingen uit de configuratie:

- Scope-opmerking: `openclaw sessions cleanup` onderhoudt sessiestores, transcripten en traject-sidecars. Het ruimt geen Cron-runlogs op (`cron/runs/<jobId>.jsonl`); die worden beheerd door `cron.runLog.maxBytes` en `cron.runLog.keepLines` in [Cron-configuratie](/nl/automation/cron-jobs#configuration) en toegelicht in [Cron-onderhoud](/nl/automation/cron-jobs#maintenance).
- Opschoning verwijdert ook niet-gerefereerde primaire transcripten, Compaction-checkpoints en traject-sidecars ouder dan `session.maintenance.pruneAfter`; bestanden waarnaar nog steeds wordt verwezen door `sessions.json` blijven behouden.

- `--dry-run`: voorbeeld van hoeveel vermeldingen zouden worden verwijderd/afgekapt zonder te schrijven.
  - In tekstmodus drukt dry-run een actietabel per sessie af (`Action`, `Key`, `Age`, `Model`, `Flags`), zodat je kunt zien wat behouden blijft tegenover wat wordt verwijderd.
- `--enforce`: pas onderhoud toe, zelfs wanneer `session.maintenance.mode` `warn` is.
- `--fix-missing`: verwijder vermeldingen waarvan de transcriptbestanden ontbreken, zelfs als ze normaal gesproken nog niet op leeftijd/aantal zouden uitvallen.
- `--fix-dm-scope`: wanneer `session.dmScope` `main` is, ruim verouderde peer-keyed direct-DM-rijen op die zijn achtergelaten door eerdere routering met `per-peer`, `per-channel-peer` of `per-account-channel-peer`. Gebruik eerst `--dry-run`; het toepassen van de opschoning verwijdert die rijen uit `sessions.json` en bewaart hun transcripten als verwijderde archieven.
- `--active-key <key>`: bescherm een specifieke actieve sleutel tegen verwijdering door het schijfbudget. Duurzame externe gesprekspointers, zoals groepssessies en thread-gescopeerde chatsessies, worden ook behouden door onderhoud op basis van leeftijd/aantal/schijfbudget.
- `--agent <id>`: voer opschoning uit voor één geconfigureerde agentstore.
- `--all-agents`: voer opschoning uit voor alle geconfigureerde agentstores.
- `--store <path>`: voer uit tegen een specifiek `sessions.json`-bestand.
- `--json`: druk een JSON-samenvatting af. Met `--all-agents` bevat de uitvoer één samenvatting per store.

Wanneer een Gateway bereikbaar is, wordt niet-dry-run opschoning voor
geconfigureerde agentstores via de Gateway verzonden, zodat deze dezelfde
sessiestore-writer deelt als runtimeverkeer. Gebruik `--store <path>` voor
expliciete offline reparatie van een storebestand.

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
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "missing": 0,
      "dmScopeRetired": 0,
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
