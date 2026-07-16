---
read_when:
    - Je wilt opgeslagen sessies weergeven en recente activiteit bekijken
summary: CLI-referentie voor `openclaw sessions` (opgeslagen sessies en gebruik weergeven)
title: Sessies
x-i18n:
    generated_at: "2026-07-16T15:25:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e00d846229dfad1ada1a8c9a548e26f26247d3f7e5a35106903f6cd4818878b5
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Opgeslagen gesprekssessies weergeven.

Sessielijsten zijn geen controles van de bereikbaarheid van kanalen/providers. Ze tonen opgeslagen
gespreksrijen uit sessieopslagen. Een stil Discord-, Slack-, Telegram- of
ander kanaal kan opnieuw verbinding maken zonder een nieuwe sessierij aan te maken,
totdat een bericht wordt verwerkt. Gebruik `openclaw channels status --probe`,
`openclaw status --deep` of `openclaw health --verbose` wanneer je actuele
kanaalconnectiviteit nodig hebt.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --store ./tmp/sessions.json
openclaw sessions --json
```

Vlaggen:

| Vlag                 | Beschrijving                                                            |
| -------------------- | ---------------------------------------------------------------------- |
| `--agent <id>`       | Eén geconfigureerde agentopslag (standaard: geconfigureerde standaardagent).        |
| `--all-agents`       | Alle geconfigureerde agentopslagen samenvoegen.                                 |
| `--store <path>`     | Expliciet opslagpad (kan niet worden gecombineerd met `--agent` of `--all-agents`). |
| `--active <minutes>` | Alleen sessies tonen die in de afgelopen N minuten zijn bijgewerkt.                  |
| `--limit <n\|all>`   | Maximumaantal uit te voeren rijen (standaard `100`; `all` herstelt de volledige uitvoer).        |
| `--json`             | Machineleesbare uitvoer.                                               |
| `--verbose`          | Uitgebreide logboekregistratie.                                                       |

`openclaw sessions` en de Gateway-RPC `sessions.list` zijn standaard begrensd,
zodat grote, langlevende opslagen het CLI-proces of de eventlus van de Gateway
niet kunnen monopoliseren. De CLI retourneert standaard de 100 nieuwste sessies; geef `--limit <n>`
door voor een kleiner/groter venster of `--limit all` wanneer je doelbewust de
volledige opslag nodig hebt. JSON-antwoorden bevatten `totalCount`, `limitApplied` en `hasMore`
wanneer aanroepers moeten aangeven dat er meer rijen bestaan.

RPC-clients kunnen `configuredAgentsOnly: true` doorgeven om de brede, gecombineerde
detectiebron te behouden, maar alleen rijen te retourneren voor agents die momenteel in de configuratie aanwezig zijn.
Control UI gebruikt die modus standaard, zodat verwijderde of uitsluitend op schijf aanwezige agentopslagen
niet opnieuw in de sessieweergave verschijnen.

`--all-agents` leest geconfigureerde agentopslagen. Sessiedetectie via Gateway en ACP
is breder: deze omvat ook SQLite-opslagen die worden afgeleid van
geconfigureerde agenthoofdmappen of een hoofdmap met sjabloon `session.store`. Verouderde selectiepaden
moeten binnen de hoofdmap van de agent worden gevonden; symbolische koppelingen en paden buiten de hoofdmap worden
overgeslagen.

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
    { "agentId": "main", "key": "agent:main:main", "model": "openai/gpt-5.6-sol" },
    { "agentId": "work", "key": "agent:work:main", "model": "anthropic/claude-sonnet-4-6" }
  ]
}
```

## Voortgang van traject volgen

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` geeft recente runtime-trajectgebeurtenissen weer als compacte
voortgangsregels. Zonder `--session-key` volgt het eerst actieve sessies en daarna
de laatst opgeslagen sessie. `--tail <count>` bepaalt hoeveel bestaande gebeurtenissen
worden afgedrukt vóór de volgmodus; standaard `80`, en `0` begint bij het huidige einde.
`--follow` blijft de geselecteerde door SQLite ondersteunde sessie of een expliciet
verouderd trajectbestand volgen.

De voortgangsweergave is bewust terughoudend: prompttekst, toolargumenten
en de inhoud van toolresultaten worden niet afgedrukt. Toolaanroepen tonen de toolnaam met
`{...redacted...}`; toolresultaten tonen een status zoals `ok`, `error` of `done`;
regels voor modelvoltooiing tonen provider/model en eindstatus.

## Een trajectbundel exporteren

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Dit is het commandopad dat wordt gebruikt door de slash-opdracht `/export-trajectory` nadat
de eigenaar het uitvoeringsverzoek heeft goedgekeurd. De uitvoermap wordt altijd bepaald
binnen `.openclaw/trajectory-exports/` onder de geselecteerde werkruimte.

## Opschoningsonderhoud

Voer het onderhoud nu uit in plaats van te wachten op de volgende schrijfcyclus:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` gebruikt de instellingen van `session.maintenance` uit de configuratie
([Configuratiereferentie](/nl/gateway/config-agents#session)):

- Opmerking over bereik: `openclaw sessions cleanup` onderhoudt sessieopslagen,
  transcripties, trajectrijen en verouderde traject-sidecars. Het snoeit
  geen uitvoeringsgeschiedenis van Cron, die automatisch de nieuwste 2000 rijen per taak bewaart
  ([Cron-configuratie](/nl/automation/cron-jobs#configuration)).
- Bij het opschonen worden ook niet-verwezen verouderde/gearchiveerde transcriptartefacten,
  Compaction-controlepunten en traject-sidecars ouder dan
  `session.maintenance.pruneAfter` gesnoeid; artefacten waarnaar nog wordt verwezen door SQLite-
  sessierijen blijven behouden.
- Opschoning rapporteert de verwijdering van kortlevende Gateway-modeluitvoeringsprobes afzonderlijk als
  `modelRunPruned`. Dit komt alleen overeen met strikt expliciete sleutels in de vorm
  `agent:*:explicit:model-run-<uuid>`. De bewaartermijn is een vaste `24h` en is
  afhankelijk van druk: verouderde proberijen worden alleen verwijderd wanneer
  onderhouds-/capaciteitsdruk voor sessie-items wordt bereikt. Wanneer dit wordt uitgevoerd, vindt de opschoning van modeluitvoeringen
  plaats vóór de globale opschoning van verouderde items en de capaciteitsbegrenzing.

Vlaggen:

| Vlag                 | Beschrijving                                                                                                                                                                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run`          | Voorbeeld tonen van hoeveel items zouden worden gesnoeid/begrensd zonder te schrijven. In tekstmodus wordt een actietabel per sessie afgedrukt (`Action`, `Key`, `Age`, `Model`, `Flags`) plus een samenvatting gegroepeerd op sessielabel.                                                                                                       |
| `--enforce`          | Onderhoud toepassen, zelfs wanneer `session.maintenance.mode` `warn` is.                                                                                                                                                                                                                                          |
| `--fix-missing`      | Verouderde items verwijderen waarvan de gearchiveerde transcriptartefacten ontbreken of alleen een koptekst bevatten/leeg zijn, zelfs als ze normaal gesproken nog niet op basis van leeftijd/aantal zouden worden verwijderd.                                                                                                                                                             |
| `--fix-dm-scope`     | Wanneer `session.dmScope` `main` is, verouderde directe-DM-rijen met peer-sleutel buiten gebruik stellen die zijn achtergebleven door eerdere routering via `per-peer`, `per-channel-peer` of `per-account-channel-peer`. Gebruik eerst `--dry-run`; bij toepassing worden die rijen uit SQLite verwijderd en blijven hun verouderde transcriptartefacten als verwijderde archieven behouden. |
| `--active-key <key>` | Een specifieke actieve sleutel beschermen tegen verwijdering vanwege het schijfbudget. Duurzame externe gespreksverwijzingen, zoals groepssessies en chatgesprekken binnen een thread, blijven ook behouden bij onderhoud op basis van leeftijd/aantal/schijfbudget.                                                                                               |
| `--agent <id>`       | Opschoning uitvoeren voor één geconfigureerde agentopslag.                                                                                                                                                                                                                                                                |
| `--all-agents`       | Opschoning uitvoeren voor alle geconfigureerde agentopslagen.                                                                                                                                                                                                                                                               |
| `--store <path>`     | Uitvoeren voor een specifiek verouderd selecteerpad voor opslag.                                                                                                                                                                                                                                                         |
| `--json`             | Een JSON-samenvatting afdrukken. Met `--all-agents` bevat de uitvoer één samenvatting per opslag.                                                                                                                                                                                                                          |

Wanneer een Gateway bereikbaar is, wordt opschoning zonder proefuitvoering voor geconfigureerde agentopslagen
via de Gateway verzonden, zodat dezelfde schrijver voor sessieopslag wordt gebruikt als voor runtime-
verkeer. Gebruik `--store <path>` voor expliciet offlineherstel van een verouderde opslagselector.

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

## Een sessie comprimeren

Maak contextbudget vrij voor een vastgelopen of te grote sessie. `openclaw sessions
compact <key>` is de volwaardige wrapper rond de Gateway-RPC `sessions.compact`
en vereist een actieve Gateway.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- Zonder `--max-lines` vat het Gateway-LLM het transcript samen. De CLI
  legt standaard geen clientdeadline op; de Gateway beheert de
  geconfigureerde Compaction-levenscyclus.
- Met `--max-lines <n>` wordt het afgekapt tot de laatste `n` transcriptregels en
  wordt het eerdere transcript gearchiveerd als een `.bak`-sidecar.
- `--agent <id>`: agent die eigenaar is van de sessie; vereist voor `global`-sleutels.
- `--url` / `--token` / `--password`: overschrijvingen voor de Gateway-verbinding.
- `--timeout <ms>`: optionele RPC-time-out aan clientzijde in milliseconden.
- `--json`: de onbewerkte RPC-payload afdrukken.

De opdracht wordt met een niet-nulstatus afgesloten wanneer de Gateway een mislukte Compaction meldt of
onbereikbaar is, zodat crons en scripts een stille no-op nooit voor succes aanzien.

<Note>
`openclaw agent --message '/compact ...'` is **geen** Compaction-pad. Slash-opdrachten
vanuit de CLI worden geweigerd door de controle op geautoriseerde afzenders; die
aanroep wordt met een niet-nulstatus afgesloten en geeft een aanwijzing die hierheen verwijst, in plaats van stil
niets te doen.
</Note>

### sessions.compact-RPC

`openclaw gateway call sessions.compact --params '<json>'` accepteert:

| Veld      | Type        | Vereist | Beschrijving                                                |
| ---------- | ----------- | -------- | ---------------------------------------------------------- |
| `key`      | string      | ja      | Te comprimeren sessiesleutel (bijvoorbeeld `agent:main:main`).    |
| `agentId`  | string      | nee       | Agent-id die eigenaar is van de sessie (voor `global`-sleutels).        |
| `maxLines` | integer ≥ 1 | nee       | Inkorten tot de laatste N regels in plaats van samenvatting door het LLM. |

Voorbeeldrespons voor samenvatting door het LLM:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

Voorbeeldrespons voor inkorten (`--max-lines 200`):

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

- [Sessieconfiguratie](/nl/gateway/config-agents#session)
- [Sessiebeheer](/nl/concepts/session)
- [Compaction](/nl/concepts/compaction)
- [CLI-referentie](/nl/cli)
