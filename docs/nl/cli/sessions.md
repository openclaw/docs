---
read_when:
    - Je wilt opgeslagen sessies weergeven en recente activiteit zien
summary: CLI-referentie voor `openclaw sessions` (opgeslagen sessies weergeven + gebruik)
title: Sessies
x-i18n:
    generated_at: "2026-06-27T17:22:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b9454e4b6ef925f8f90b5e8beceb6bea6404539f460cb78bcf82e241dff168d
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Geef opgeslagen gesprekssessies weer.

Sessielijsten zijn geen livenesscontroles voor kanalen/providers. Ze tonen opgeslagen
gespreksrijen uit sessiestores. Een stil Discord-, Slack-, Telegram- of
ander kanaal kan succesvol opnieuw verbinden zonder een nieuwe sessierij te maken
totdat een bericht wordt verwerkt. Gebruik `openclaw channels status --probe`,
`openclaw status --deep` of `openclaw health --verbose` wanneer je live
kanaalconnectiviteit nodig hebt.

Antwoorden van `openclaw sessions` en Gateway `sessions.list` zijn standaard
begrensd zodat grote, langlevende stores het CLI-proces of de Gateway-eventloop
niet kunnen monopoliseren. De CLI retourneert standaard de nieuwste 100 sessies; geef
`--limit <n>` mee voor een kleiner/groter venster of `--limit all` wanneer je bewust
de volledige store nodig hebt. JSON-antwoorden bevatten `totalCount`, `limitApplied` en
`hasMore` wanneer aanroepers moeten tonen dat er meer rijen bestaan.

RPC-clients kunnen `configuredAgentsOnly: true` meegeven om de brede gecombineerde
ontdekkingsbron te behouden, maar alleen rijen te retourneren voor agents die momenteel
in de configuratie aanwezig zijn. Control UI gebruikt die modus standaard, zodat verwijderde
of alleen-op-schijf agentstores niet opnieuw verschijnen in de Sessions-weergave.

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

Tail menselijk leesbare trajectvoortgang voor opgeslagen sessies:

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` rendert recente trajectory JSONL-events als compacte voortgangsregels. Zonder `--session-key` tailt het eerst actieve sessies en daarna de nieuwste opgeslagen sessie. `--tail <count>` bepaalt hoeveel bestaande events worden afgedrukt vóór volgmodus; de standaard is `80`, en `0` begint aan het huidige einde. `--follow` blijft de geselecteerde trajectbestanden volgen, inclusief verplaatste bestanden waarnaar wordt verwezen door `<session>.trajectory-path.json`.

De voortgangsweergave is bewust conservatief: prompttekst, toolargumenten en bodies van toolresultaten worden niet afgedrukt. Toolaanroepen tonen de toolnaam met `{...redacted...}`; toolresultaten tonen status zoals `ok`, `error` of `done`; regels voor modelvoltooiing tonen provider/model en terminale status.

Exporteer een trajectbundel voor een opgeslagen sessie:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Dit is het commandopad dat wordt gebruikt door het `/export-trajectory` slashcommand nadat
de eigenaar het exec-verzoek heeft goedgekeurd. De uitvoermap wordt altijd opgelost
binnen `.openclaw/trajectory-exports/` onder de geselecteerde werkruimte.

`openclaw sessions --all-agents` leest geconfigureerde agentstores. Gateway- en ACP-
sessieontdekking zijn breder: ze omvatten ook alleen-op-schijf stores die worden gevonden onder
de standaardroot `agents/` of een getemplate `session.store`-root. Die
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

## Opschoononderhoud

Voer onderhoud nu uit (in plaats van te wachten op de volgende schrijfcyclus):

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

- Scope-opmerking: `openclaw sessions cleanup` onderhoudt sessiestores, transcripties en trajectory-sidecars. Het snoeit geen Cron-runhistorie; die wordt beheerd door `cron.runLog.keepLines` in [Cron-configuratie](/nl/automation/cron-jobs#configuration) en uitgelegd in [Cron-onderhoud](/nl/automation/cron-jobs#maintenance).
- Opschoning snoeit ook niet-verwezen primaire transcripties, Compaction-checkpoints en trajectory-sidecars ouder dan `session.maintenance.pruneAfter`; bestanden waarnaar nog wordt verwezen door `sessions.json` blijven behouden.
- Opschoning rapporteert kortlevende gateway-model-run-probeopschoning apart als `modelRunPruned`. Dit matcht alleen strikte expliciete sleutels met de vorm `agent:*:explicit:model-run-<uuid>`. De vaste retentie is `24h`, maar deze is drukgestuurd: stale proberijen worden alleen verwijderd wanneer session-entry-onderhoud/capdruk wordt bereikt. Wanneer dit draait, vindt model-run-opschoning plaats vóór globale stale opschoning en afkapping.

- `--dry-run`: bekijk vooraf hoeveel entries zouden worden gesnoeid/afgekapt zonder te schrijven.
  - In tekstmodus drukt dry-run een actietabel per sessie af (`Action`, `Key`, `Age`, `Model`, `Flags`) plus een samenvatting gegroepeerd per sessielabel, zodat je kunt zien wat behouden versus verwijderd zou worden.
- `--enforce`: pas onderhoud toe, zelfs wanneer `session.maintenance.mode` `warn` is.
- `--fix-missing`: verwijder entries waarvan transcriptiebestanden ontbreken of alleen een header/leeg zijn, zelfs als ze normaal nog niet door leeftijd/aantal zouden uitvallen.
- `--fix-dm-scope`: wanneer `session.dmScope` `main` is, retire stale peer-keyed direct-DM-rijen die zijn achtergebleven door eerdere `per-peer`-, `per-channel-peer`- of `per-account-channel-peer`-routing. Gebruik eerst `--dry-run`; het toepassen van de opschoning verwijdert die rijen uit `sessions.json` en bewaart hun transcripties als verwijderde archieven.
- `--active-key <key>`: bescherm een specifieke actieve sleutel tegen disk-budget-evictie. Duurzame externe gespreksverwijzingen, zoals groepssessies en thread-scoped chatsessies, blijven ook behouden door onderhoud op leeftijd/aantal/diskbudget.
- `--agent <id>`: voer opschoning uit voor één geconfigureerde agentstore.
- `--all-agents`: voer opschoning uit voor alle geconfigureerde agentstores.
- `--store <path>`: voer uit tegen een specifiek `sessions.json`-bestand.
- `--json`: druk een JSON-samenvatting af. Met `--all-agents` bevat de uitvoer één samenvatting per store.

Wanneer een Gateway bereikbaar is, wordt niet-dry-run opschoning voor geconfigureerde agentstores
via de Gateway verzonden, zodat deze dezelfde session-store-writer deelt als runtimeverkeer.
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

## Een sessie compacten

Win contextbudget terug voor een vastgelopen of te grote sessie. `openclaw sessions compact <key>` is de eersteklas wrapper rond de `sessions.compact` gateway-RPC en vereist een draaiende gateway.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- Zonder `--max-lines` vat de gateway-LLM de transcriptie samen. Dit kan traag zijn, dus de standaardwaarde voor `--timeout` is `180000` ms.
- Met `--max-lines <n>` wordt afgekapt tot de laatste `n` transcriptieregels en wordt de eerdere transcriptie gearchiveerd als een `.bak`-sidecar.
- `--agent <id>`: agent die eigenaar is van de sessie; vereist voor `global`-sleutels.
- `--url` / `--token` / `--password`: overschrijvingen voor gatewayverbinding.
- `--timeout <ms>`: RPC-timeout in milliseconden.
- `--json`: druk de ruwe RPC-payload af.

Het commando eindigt met een niet-nulcode wanneer de gateway een mislukte Compaction rapporteert of onbereikbaar is, zodat crons en scripts een stille no-op nooit verwarren met succes.

> Opmerking: `openclaw agent --message '/compact ...'` is **geen** Compaction-pad. Slashcommands vanuit de CLI worden geweigerd door de authorized-sender-controle; die aanroep eindigt met een niet-nulcode met begeleiding die hiernaar verwijst in plaats van stil niets te doen.

### sessions.compact-RPC

`openclaw gateway call sessions.compact --params '<json>'` accepteert:

| Veld       | Type        | Vereist | Beschrijving                                               |
| ---------- | ----------- | ------- | ---------------------------------------------------------- |
| `key`      | string      | ja      | Sessiesleutel om te compacten (bijvoorbeeld `agent:main:main`). |
| `agentId`  | string      | nee     | Agent-id dat eigenaar is van de sessie (voor `global`-sleutels). |
| `maxLines` | integer ≥ 1 | nee     | Kap af tot de laatste N regels in plaats van LLM-samenvatting. |

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
