---
read_when:
    - Je wilt opgeslagen sessies weergeven en recente activiteit bekijken
summary: CLI-referentie voor `openclaw sessions` (opgeslagen sessies weergeven + gebruik)
title: Sessies
x-i18n:
    generated_at: "2026-05-02T20:42:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c9ec3ca55f7c5b6217b481e9da62f5416df73e69405a0dc15e77d2afeac723f
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Geef opgeslagen gesprekssessies weer.

Sessielijsten zijn geen liveness-controles voor kanalen/providers. Ze tonen bewaarde
gespreksrijen uit sessiestores. Een stille Discord-, Slack-, Telegram- of
ander kanaal kan succesvol opnieuw verbinden zonder een nieuwe sessierij te maken
totdat een bericht wordt verwerkt. Gebruik `openclaw channels status --probe`,
`openclaw status --deep` of `openclaw health --verbose` wanneer je live
kanaalconnectiviteit nodig hebt.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

Bereikselectie:

- standaard: geconfigureerde standaard agent-store
- `--verbose`: uitgebreide logging
- `--agent <id>`: één geconfigureerde agent-store
- `--all-agents`: alle geconfigureerde agent-stores samenvoegen
- `--store <path>`: expliciet store-pad (kan niet worden gecombineerd met `--agent` of `--all-agents`)

Exporteer een trajectbundel voor een opgeslagen sessie:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Dit is het opdrachtpad dat door de `/export-trajectory` slash-opdracht wordt gebruikt nadat
de eigenaar het exec-verzoek goedkeurt. De uitvoermap wordt altijd opgelost
binnen `.openclaw/trajectory-exports/` onder de geselecteerde workspace.

`openclaw sessions --all-agents` leest geconfigureerde agent-stores. Gateway- en ACP-
sessiedetectie is breder: die omvat ook disk-only stores die worden gevonden onder
de standaard `agents/`-root of een getemplate `session.store`-root. Die
gevonden stores moeten worden opgelost naar reguliere `sessions.json`-bestanden binnen de
agent-root; symlinks en paden buiten de root worden overgeslagen.

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
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## Opschoononderhoud

Voer onderhoud nu uit (in plaats van te wachten op de volgende schrijfcyclus):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` gebruikt `session.maintenance`-instellingen uit de config:

- Bereikopmerking: `openclaw sessions cleanup` onderhoudt sessiestores, transcripties en trajectory-sidecars. Het snoeit geen Cron-runlogs (`cron/runs/<jobId>.jsonl`), die worden beheerd door `cron.runLog.maxBytes` en `cron.runLog.keepLines` in [Cron-configuratie](/nl/automation/cron-jobs#configuration) en worden uitgelegd in [Cron-onderhoud](/nl/automation/cron-jobs#maintenance).

- `--dry-run`: bekijk vooraf hoeveel items zouden worden gesnoeid/afgetopt zonder te schrijven.
  - In tekstmodus drukt dry-run een actietabel per sessie af (`Action`, `Key`, `Age`, `Model`, `Flags`), zodat je kunt zien wat behouden versus verwijderd zou worden.
- `--enforce`: pas onderhoud toe, zelfs wanneer `session.maintenance.mode` `warn` is.
- `--fix-missing`: verwijder items waarvan transcriptiebestanden ontbreken, zelfs als ze normaal nog niet op leeftijd/aantal zouden uitvallen.
- `--active-key <key>`: bescherm een specifieke actieve sleutel tegen verwijdering door het schijfbudget. Duurzame externe gesprekspointers, zoals groepssessies en thread-gebonden chatsessies, worden ook behouden door onderhoud op leeftijd/aantal/schijfbudget.
- `--agent <id>`: voer opschoning uit voor één geconfigureerde agent-store.
- `--all-agents`: voer opschoning uit voor alle geconfigureerde agent-stores.
- `--store <path>`: voer uit tegen een specifiek `sessions.json`-bestand.
- `--json`: druk een JSON-samenvatting af. Met `--all-agents` bevat de uitvoer één samenvatting per store.

Wanneer een Gateway bereikbaar is, wordt niet-dry-run-opschoning voor geconfigureerde agent-stores
via de Gateway verzonden, zodat dezelfde sessiestore-writer wordt gedeeld als runtimeverkeer.
Gebruik `--store <path>` voor expliciet offline herstel van een store-bestand.

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
