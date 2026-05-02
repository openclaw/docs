---
read_when:
    - Je wilt opgeslagen sessies weergeven en recente activiteit bekijken
summary: CLI-referentie voor `openclaw sessions` (opgeslagen sessies weergeven + gebruik)
title: Sessies
x-i18n:
    generated_at: "2026-05-02T11:12:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c7f0d521756ace4af05451b925256f89661bf971533541764c128e2be9d6431
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Geef opgeslagen gesprekssessies weer.

Sessielijsten zijn geen liveness-controles voor kanalen/providers. Ze tonen opgeslagen
gespreksrijen uit sessiestores. Een stille Discord, Slack, Telegram of
ander kanaal kan succesvol opnieuw verbinden zonder een nieuwe sessierij aan te maken
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

Scope-selectie:

- standaard: geconfigureerde standaard agent-store
- `--verbose`: uitgebreide logging
- `--agent <id>`: één geconfigureerde agent-store
- `--all-agents`: alle geconfigureerde agent-stores aggregeren
- `--store <path>`: expliciet store-pad (kan niet worden gecombineerd met `--agent` of `--all-agents`)

Exporteer een trajectbundel voor een opgeslagen sessie:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Dit is het commandopad dat wordt gebruikt door de slash-command `/export-trajectory` nadat
de eigenaar het exec-verzoek goedkeurt. De uitvoermap wordt altijd opgelost
binnen `.openclaw/trajectory-exports/` onder de geselecteerde workspace.

`openclaw sessions --all-agents` leest geconfigureerde agent-stores. Gateway- en ACP-
sessiedetectie is breder: die omvat ook stores die alleen op schijf staan en zijn gevonden onder
de standaardroot `agents/` of een getemplate `session.store`-root. Die
gevonden stores moeten oplossen naar reguliere `sessions.json`-bestanden binnen de
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

## Opschoningsonderhoud

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

- Scope-opmerking: `openclaw sessions cleanup` onderhoudt sessiestores, transcripten en trajectory-sidecars. Het ruimt geen Cron-runlogs (`cron/runs/<jobId>.jsonl`) op; die worden beheerd door `cron.runLog.maxBytes` en `cron.runLog.keepLines` in [Cron-configuratie](/nl/automation/cron-jobs#configuration) en uitgelegd in [Cron-onderhoud](/nl/automation/cron-jobs#maintenance).

- `--dry-run`: bekijk vooraf hoeveel vermeldingen zouden worden verwijderd/afgetopt zonder te schrijven.
  - In tekstmodus drukt dry-run een actietabel per sessie af (`Action`, `Key`, `Age`, `Model`, `Flags`), zodat je kunt zien wat zou worden behouden versus verwijderd.
- `--enforce`: pas onderhoud toe, zelfs wanneer `session.maintenance.mode` `warn` is.
- `--fix-missing`: verwijder vermeldingen waarvan transcriptbestanden ontbreken, zelfs als ze normaal gesproken nog niet door leeftijd/aantal zouden vervallen.
- `--active-key <key>`: bescherm een specifieke actieve sleutel tegen verwijdering vanwege het schijfbudget. Duurzame externe gesprekspointers, zoals groepssessies en thread-scoped chatsessies, worden ook behouden door onderhoud op basis van leeftijd/aantal/schijfbudget.
- `--agent <id>`: voer cleanup uit voor één geconfigureerde agent-store.
- `--all-agents`: voer cleanup uit voor alle geconfigureerde agent-stores.
- `--store <path>`: voer uit tegen een specifiek `sessions.json`-bestand.
- `--json`: druk een JSON-samenvatting af. Met `--all-agents` bevat de uitvoer één samenvatting per store.

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
