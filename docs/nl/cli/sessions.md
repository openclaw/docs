---
read_when:
    - Je wilt opgeslagen sessies weergeven en recente activiteit bekijken
summary: CLI-referentie voor `openclaw sessions` (opgeslagen sessies weergeven + gebruik)
title: Sessies
x-i18n:
    generated_at: "2026-07-04T20:37:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c24ee8a632998624ee41945b26ace3bfe37cadf9447f7632c373784a9301bde
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Toon opgeslagen gesprekssessies.

Sessielijsten zijn geen beschikbaarheidscontroles voor kanalen/providers. Ze tonen bewaarde
gespreksrijen uit sessiestores. Een stille Discord-, Slack-, Telegram- of
ander kanaal kan succesvol opnieuw verbinden zonder een nieuwe sessierij aan te maken
totdat een bericht is verwerkt. Gebruik `openclaw channels status --probe`,
`openclaw status --deep` of `openclaw health --verbose` wanneer je live
kanaalconnectiviteit nodig hebt.

`openclaw sessions`- en Gateway-`sessions.list`-antwoorden zijn standaard
begrensd, zodat grote stores die lang blijven bestaan het CLI-proces of de Gateway
event loop niet kunnen monopoliseren. De CLI retourneert standaard de nieuwste 100 sessies; geef
`--limit <n>` mee voor een kleiner/groter venster of `--limit all` wanneer je bewust
de volledige store nodig hebt. JSON-antwoorden bevatten `totalCount`, `limitApplied` en
`hasMore` wanneer callers moeten tonen dat er meer rijen bestaan.

RPC-clients kunnen `configuredAgentsOnly: true` meegeven om de brede gecombineerde
ontdekkingsbron te behouden, maar alleen rijen te retourneren voor agents die momenteel in de config aanwezig zijn.
Control UI gebruikt die modus standaard, zodat verwijderde of alleen-op-schijf agentstores
niet opnieuw verschijnen in de Sessies-weergave.

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
- `--limit <n|all>`: maximaal aantal rijen om uit te voeren (standaard `100`; `all` herstelt volledige uitvoer)

Volg menselijk leesbare trajectvoortgang voor opgeslagen sessies:

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` geeft recente traject-JSONL-events weer als compacte voortgangsregels. Zonder `--session-key` volgt het eerst actieve sessies en daarna de laatst opgeslagen sessie. `--tail <count>` bepaalt hoeveel bestaande events worden afgedrukt vóór volgmodus; de standaard is `80`, en `0` begint bij het huidige einde. `--follow` blijft de geselecteerde trajectbestanden volgen, inclusief verplaatste bestanden waarnaar wordt verwezen door `<session>.trajectory-path.json`.

De voortgangsweergave is bewust conservatief: prompttekst, toolargumenten en toolresultaatinhoud worden niet afgedrukt. Toolaanroepen tonen de toolnaam met `{...redacted...}`; toolresultaten tonen status zoals `ok`, `error` of `done`; regels voor modelvoltooiing tonen provider/model en terminale status.

Exporteer een trajectbundel voor een opgeslagen sessie:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Dit is het commandopad dat door het slash-commando `/export-trajectory` wordt gebruikt nadat
de owner het exec-verzoek goedkeurt. De uitvoermap wordt altijd opgelost
binnen `.openclaw/trajectory-exports/` onder de geselecteerde workspace.

`openclaw sessions --all-agents` leest geconfigureerde agentstores. Gateway- en ACP-
sessieontdekking is breder: die bevat ook alleen-op-schijf stores die zijn gevonden onder
de standaard `agents/`-root of een getemplate `session.store`-root. Die
ontdekte stores moeten worden opgelost naar reguliere `sessions.json`-bestanden binnen de
agentroot; symlinks en paden buiten de root worden overgeslagen.

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

## Opschoningsonderhoud

Voer onderhoud nu uit (in plaats van te wachten op de volgende schrijfronde):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` gebruikt `session.maintenance`-instellingen uit config:

- Scope-opmerking: `openclaw sessions cleanup` onderhoudt sessiestores, transcripts en traject-sidecars. Het ruimt geen Cron-runhistorie op; die wordt beheerd door `cron.runLog.keepLines` in [Cron-configuratie](/nl/automation/cron-jobs#configuration) en uitgelegd in [Cron-onderhoud](/nl/automation/cron-jobs#maintenance).
- Opschoning verwijdert ook niet-gerefereerde primaire transcripts, Compaction-checkpoints en traject-sidecars die ouder zijn dan `session.maintenance.pruneAfter`; bestanden waarnaar nog wordt verwezen door `sessions.json` blijven behouden.
- Opschoning rapporteert het opruimen van kortlevende Gateway-modelrunprobes apart als `modelRunPruned`. Dit matcht alleen strikte expliciete sleutels met de vorm `agent:*:explicit:model-run-<uuid>`. De vaste bewaartermijn is `24h`, maar deze is drukgestuurd: stale proberijen worden alleen verwijderd wanneer onderhouds-/capdruk voor sessie-items is bereikt. Wanneer het draait, gebeurt modelrun-opruiming vóór globale stale opschoning en capping.

- `--dry-run`: bekijk vooraf hoeveel items zouden worden verwijderd/gecapt zonder te schrijven.
  - In tekstmodus drukt de proefrun een actietabel per sessie af (`Action`, `Key`, `Age`, `Model`, `Flags`) plus een samenvatting gegroepeerd op sessielabel, zodat je kunt zien wat behouden versus verwijderd zou worden.
- `--enforce`: onderhoud toepassen zelfs wanneer `session.maintenance.mode` `warn` is.
- `--fix-missing`: items verwijderen waarvan transcriptbestanden ontbreken of alleen een header hebben/leeg zijn, zelfs als ze normaal nog niet op leeftijd/aantal zouden uitvallen.
- `--fix-dm-scope`: wanneer `session.dmScope` `main` is, stale peer-keyed direct-DM-rijen uitfaseren die zijn achtergelaten door eerdere `per-peer`-, `per-channel-peer`- of `per-account-channel-peer`-routing. Gebruik eerst `--dry-run`; het toepassen van de opschoning verwijdert die rijen uit `sessions.json` en behoudt hun transcripts als verwijderde archieven.
- `--active-key <key>`: bescherm een specifieke actieve sleutel tegen verwijdering door het schijfbudget. Duurzame externe gesprekspointers, zoals groepssessies en thread-scoped chatsessies, worden ook behouden door onderhoud op leeftijd/aantal/schijfbudget.
- `--agent <id>`: opschoning uitvoeren voor één geconfigureerde agentstore.
- `--all-agents`: opschoning uitvoeren voor alle geconfigureerde agentstores.
- `--store <path>`: uitvoeren tegen een specifiek `sessions.json`-bestand.
- `--json`: een JSON-samenvatting afdrukken. Met `--all-agents` bevat de uitvoer één samenvatting per store.

Wanneer een Gateway bereikbaar is, wordt niet-proefrunopschoning voor geconfigureerde agentstores
via de Gateway verstuurd, zodat deze dezelfde sessiestore-writer deelt als runtimeverkeer.
Gebruik `--store <path>` voor expliciete offline reparatie van een storebestand.

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

## Een sessie compacteren

Win contextbudget terug voor een vastgelopen of te grote sessie. `openclaw sessions compact <key>` is de eersteklas wrapper rond de `sessions.compact` Gateway-RPC en vereist een actieve Gateway.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- Zonder `--max-lines` vat de Gateway het transcript samen met een LLM. De CLI legt standaard geen clientdeadline op; de Gateway bezit de geconfigureerde Compaction-levenscyclus.
- Met `--max-lines <n>` kapt het af tot de laatste `n` transcriptregels en archiveert het het eerdere transcript als een `.bak`-sidecar.
- `--agent <id>`: agent die eigenaar is van de sessie; vereist voor `global`-sleutels.
- `--url` / `--token` / `--password`: Gateway-verbindingsoverschrijvingen.
- `--timeout <ms>`: optionele client-side RPC-time-out in milliseconden.
- `--json`: de ruwe RPC-payload afdrukken.

Het commando sluit af met een niet-nulcode wanneer de Gateway een mislukte Compaction rapporteert of onbereikbaar is, zodat crons en scripts een stille no-op nooit voor succes aanzien.

> Opmerking: `openclaw agent --message '/compact ...'` is **geen** Compaction-pad. Slash-commando's vanuit de CLI worden geweigerd door de authorized-sender-controle; die aanroep sluit af met een niet-nulcode met begeleiding die hierheen verwijst in plaats van stil niets te doen.

### sessions.compact-RPC

`openclaw gateway call sessions.compact --params '<json>'` accepteert:

| Veld       | Type        | Vereist | Beschrijving                                               |
| ---------- | ----------- | ------- | ---------------------------------------------------------- |
| `key`      | string      | ja      | Sessiesleutel om te compacteren (bijvoorbeeld `agent:main:main`). |
| `agentId`  | string      | nee     | Agent-id die eigenaar is van de sessie (voor `global`-sleutels). |
| `maxLines` | integer ≥ 1 | nee     | Afkappen tot de laatste N regels in plaats van LLM-samenvatting. |

Voorbeeldantwoord voor LLM-samenvatting:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

Voorbeeldantwoord voor afkappen (`--max-lines 200`):

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "archived": "/home/user/.openclaw/agents/main/sessions/transcripts/<id>.jsonl.bak",
  "kept": 200
}
```

## Gerelateerd

- Sessieconfiguratie: [Configuratiereferentie](/nl/gateway/config-agents#session)
- [CLI-referentie](/nl/cli)
- [Sessiebeheer](/nl/concepts/session)
