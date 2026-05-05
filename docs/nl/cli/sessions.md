---
read_when:
    - Je wilt opgeslagen sessies weergeven en recente activiteit bekijken
summary: CLI-reference voor `openclaw sessions` (opgeslagen sessies weergeven + gebruik)
title: Sessies
x-i18n:
    generated_at: "2026-05-05T08:25:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: a204189952bc82788eb724c0a6b6db93c7d6795ad69bb6d498e8575236c3272e
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Geef opgeslagen gesprekssessies weer.

Sessielijsten zijn geen beschikbaarheidscontroles voor kanalen/aanbieders. Ze tonen bewaarde gespreksrijen uit sessieopslaglocaties. Een stil Discord-, Slack-, Telegram- of ander kanaal kan succesvol opnieuw verbinden zonder een nieuwe sessierij aan te maken totdat een bericht wordt verwerkt. Gebruik `openclaw channels status --probe`, `openclaw status --deep` of `openclaw health --verbose` wanneer je actuele kanaalconnectiviteit nodig hebt.

`openclaw sessions`- en Gateway-`sessions.list`-antwoorden zijn standaard begrensd, zodat grote, langlevende opslaglocaties het CLI-proces of de Gateway-gebeurtenislus niet kunnen monopoliseren. De CLI retourneert standaard de nieuwste 100 sessies; geef `--limit <n>` mee voor een kleiner/groter venster of `--limit all` wanneer je bewust de volledige opslag nodig hebt. JSON-antwoorden bevatten `totalCount`, `limitApplied` en `hasMore` wanneer aanroepers moeten tonen dat er meer rijen bestaan.

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

- standaard: geconfigureerde standaard-agentopslag
- `--verbose`: uitgebreide logboekregistratie
- `--agent <id>`: één geconfigureerde agentopslag
- `--all-agents`: alle geconfigureerde agentopslaglocaties samenvoegen
- `--store <path>`: expliciet opslagpad (kan niet worden gecombineerd met `--agent` of `--all-agents`)
- `--limit <n|all>`: maximaal aantal rijen om uit te voeren (standaard `100`; `all` herstelt volledige uitvoer)

Exporteer een trajectbundel voor een opgeslagen sessie:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Dit is het opdrachtpad dat wordt gebruikt door de `/export-trajectory`-slashopdracht nadat de eigenaar het uitvoerverzoek heeft goedgekeurd. De uitvoermap wordt altijd opgelost binnen `.openclaw/trajectory-exports/` onder de geselecteerde werkruimte.

`openclaw sessions --all-agents` leest geconfigureerde agentopslaglocaties. Gateway- en ACP-sessiedetectie zijn breder: ze bevatten ook opslaglocaties die alleen op schijf staan en worden gevonden onder de standaardhoofdmap `agents/` of een gesjabloneerde `session.store`-hoofdmap. Die gevonden opslaglocaties moeten worden opgelost naar reguliere `sessions.json`-bestanden binnen de agenthoofdmap; symlinks en paden buiten de hoofdmap worden overgeslagen.

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

Voer nu onderhoud uit (in plaats van te wachten op de volgende schrijfronde):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` gebruikt `session.maintenance`-instellingen uit de configuratie:

- Scope-opmerking: `openclaw sessions cleanup` onderhoudt sessieopslaglocaties, transcripties en traject-sidecars. Het ruimt geen Cron-uitvoeringslogboeken op (`cron/runs/<jobId>.jsonl`); die worden beheerd door `cron.runLog.maxBytes` en `cron.runLog.keepLines` in [Cron-configuratie](/nl/automation/cron-jobs#configuration) en uitgelegd in [Cron-onderhoud](/nl/automation/cron-jobs#maintenance).
- Opschonen verwijdert ook niet-gerefereerde primaire transcripties, Compaction-controlepunten en traject-sidecars die ouder zijn dan `session.maintenance.pruneAfter`; bestanden waarnaar nog steeds wordt verwezen door `sessions.json` blijven behouden.

- `--dry-run`: bekijk vooraf hoeveel vermeldingen zouden worden verwijderd/afgetopt zonder te schrijven.
  - In tekstmodus drukt dry-run een actietabel per sessie af (`Action`, `Key`, `Age`, `Model`, `Flags`), zodat je kunt zien wat behouden blijft versus wat wordt verwijderd.
- `--enforce`: pas onderhoud toe, zelfs wanneer `session.maintenance.mode` `warn` is.
- `--fix-missing`: verwijder vermeldingen waarvan transcriptiebestanden ontbreken, zelfs als ze normaal gesproken nog niet door leeftijd/aantal zouden vervallen.
- `--active-key <key>`: bescherm een specifieke actieve sleutel tegen verwijdering door het schijfbudget. Duurzame externe gespreksverwijzingen, zoals groepssessies en chat-sessies met thread-scope, worden ook behouden door onderhoud op basis van leeftijd/aantal/schijfbudget.
- `--agent <id>`: voer opschoning uit voor één geconfigureerde agentopslag.
- `--all-agents`: voer opschoning uit voor alle geconfigureerde agentopslaglocaties.
- `--store <path>`: voer uit tegen een specifiek `sessions.json`-bestand.
- `--json`: druk een JSON-samenvatting af. Met `--all-agents` bevat de uitvoer één samenvatting per opslaglocatie.

Wanneer een Gateway bereikbaar is, wordt niet-dry-run-opschoning voor geconfigureerde agentopslaglocaties via de Gateway verzonden, zodat deze dezelfde sessieopslagschrijver gebruikt als runtimeverkeer. Gebruik `--store <path>` voor expliciet offlineherstel van een opslagbestand.

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
