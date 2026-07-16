---
read_when:
    - Je wilt sessieroutering en isolatie begrijpen
    - Je wilt het bereik van DM's configureren voor opstellingen met meerdere gebruikers
    - Je debugt dagelijkse resets of resets van inactieve sessies
summary: Hoe OpenClaw gesprekssessies beheert
title: Sessiebeheer
x-i18n:
    generated_at: "2026-07-16T15:33:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8ec9e33b4d288fa12016092ab2201431631fc9cb77e6e9d4261d348d5a849f65
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw routeert elk binnenkomend bericht naar een **sessie** op basis van de
herkomst: privéberichten, groepschats, cron-taken enzovoort. Alle sessiestatus wordt beheerd door de
**Gateway**; UI-clients vragen sessiegegevens op bij de Gateway.

## Hoe berichten worden gerouteerd

| Bron             | Gedrag                               |
| ---------------- | ------------------------------------ |
| Privéberichten   | Standaard een gedeelde sessie        |
| Groepschats      | Geïsoleerd per groep                 |
| Ruimten/kanalen  | Geïsoleerd per ruimte                |
| Cron-taken       | Nieuwe sessie per uitvoering         |
| Webhooks         | Geïsoleerd per Webhook               |

## Isolatie van privéberichten

Standaard delen alle privéberichten één sessie voor continuïteit, wat prima is voor
configuraties met één gebruiker.

<Warning>
Als meerdere mensen je agent berichten kunnen sturen, schakel dan isolatie van privéberichten in. Zonder isolatie
delen alle gebruikers dezelfde gesprekscontext, waardoor de privéberichten van Alice
zichtbaar zouden zijn voor Bob.
</Warning>

```json5
{
  session: {
    dmScope: "per-channel-peer", // isoleren op kanaal + afzender
  },
}
```

`session.dmScope`-opties:

| Waarde                      | Gedrag                                            |
| --------------------------- | ------------------------------------------------- |
| `main` (standaard)           | Alle privéberichten delen één sessie              |
| `per-peer`                 | Isoleren op afzender, over kanalen heen            |
| `per-channel-peer`         | Isoleren op kanaal + afzender (aanbevolen)        |
| `per-account-channel-peer` | Isoleren op account + kanaal + afzender           |

<Tip>
Als dezelfde persoon via meerdere kanalen contact met je opneemt, gebruik dan
`session.identityLinks` om diens identiteiten aan één canonieke peer-id te koppelen, zodat
deze één sessie delen.
</Tip>

### Gekoppelde kanalen docken

Dockopdrachten verplaatsen de antwoordroute van de huidige privéchatsessie naar een ander
gekoppeld kanaal zonder een nieuwe sessie te starten. Zie
[Kanalen docken](/nl/concepts/channel-docking) voor voorbeelden, configuratie en
probleemoplossing.

Controleer je configuratie met `openclaw security audit`.

## Levenscyclus van sessies

Sessies worden hergebruikt totdat ze verlopen volgens `session.reset`:

- **Dagelijkse reset** (standaard `mode: "daily"`) - nieuwe sessie op een geconfigureerd lokaal
  uur (`session.reset.atHour`, standaard `4`, 0-23) op de Gateway-host. De dagelijkse
  versheid is gebaseerd op wanneer de huidige `sessionId` is gestart, niet op latere
  schrijfbewerkingen van metagegevens.
- **Reset bij inactiviteit** (`mode: "idle"`) - nieuwe sessie na `session.reset.idleMinutes`
  inactiviteit. De versheid voor inactiviteit is gebaseerd op de laatste echte interactie met een gebruiker of kanaal,
  zodat systeemgebeurtenissen van Heartbeat, Cron en exec de
  sessie niet actief houden.
- **Handmatige reset** - typ `/new` of `/reset` in de chat. `/new <model>`
  wisselt ook van model.

Wanneer zowel dagelijkse resets als resets bij inactiviteit zijn geconfigureerd, geldt de reset die het eerst verloopt.
Beurten voor Heartbeat, Cron, exec en andere systeemgebeurtenissen kunnen sessiemetagegevens schrijven,
maar die schrijfbewerkingen verlengen de versheid voor dagelijkse resets of resets bij inactiviteit niet. Wanneer een reset
de sessie vernieuwt, worden meldingen van systeemgebeurtenissen in de wachtrij voor de oude sessie
verwijderd, zodat verouderde achtergrondupdates niet vóór de eerste prompt in
de nieuwe sessie worden geplaatst.

Sessies met een actieve CLI-sessie die door de provider wordt beheerd, worden niet beëindigd door de impliciete
dagelijkse standaardinstelling. Gebruik `/reset` of configureer `session.reset` expliciet wanneer deze
sessies na een bepaalde tijd moeten verlopen.

Overschrijf de standaardinstelling per chattype of per kanaal:

```json5
{
  session: {
    reset: { mode: "daily", atHour: 4 },
    resetByType: {
      group: { mode: "idle", idleMinutes: 120 },
      thread: { mode: "daily", atHour: 6 },
    },
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 10080 },
    },
  },
}
```

`resetByType` ondersteunt `direct` (verouderde alias `dm`), `group` en `thread`.
De verouderde `session.idleMinutes` op het hoogste niveau werkt nog steeds als compatibiliteitsalias voor
een standaardinstelling in inactiviteitsmodus wanneer geen `session.reset`- of `resetByType`-blok is ingesteld.

## Waar de status wordt opgeslagen

- **Rijen met runtime-sessies:** `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Gearchiveerde transcriptbestanden:** `~/.openclaw/agents/<agentId>/sessions/`
- **Migratiebron voor verouderde rijen:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`

De sessierijen in de SQLite-database per agent bewaren afzonderlijke tijdstempels voor de
levenscyclus:

- `sessionStartedAt`: wanneer de huidige `sessionId` begon; de dagelijkse reset gebruikt dit.
- `lastInteractionAt`: laatste interactie met een gebruiker of kanaal die de levensduur bij inactiviteit verlengt.
- `updatedAt`: laatste wijziging van de opslagrij; nuttig voor weergave en opschoning, maar niet
  bepalend voor de versheid van dagelijkse resets of resets bij inactiviteit.

Tijdens de migratie van oudere installaties importeren het opstarten van de Gateway en `openclaw doctor
--fix` automatisch verouderde `sessions.json`-rijen en actieve JSONL-transcriptgeschiedenis in
SQLite. Rijen zonder `sessionStartedAt` worden, indien beschikbaar, afgeleid uit de
sessieheader van het verouderde JSONL-transcript. Als in een oudere rij ook
`lastInteractionAt` ontbreekt, valt de versheid voor inactiviteit terug op de starttijd van die sessie,
niet op latere administratieve schrijfbewerkingen. Gebruik `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` en de [Doctor-migratievolgorde
](/nl/cli/doctor#session-sqlite-migration) wanneer je expliciete
inspectie of validatiebewijs wilt.

## Sessieonderhoud

OpenClaw begrenst de sessieopslag in de loop van de tijd via `session.maintenance`; hieronder staan de
standaardwaarden:

```json5
{
  session: {
    maintenance: {
      mode: "enforce", // "enforce" voert opschoning uit; "warn" rapporteert alleen
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

Voor `maxEntries`-limieten op productieschaal gebruiken runtimeschrijfbewerkingen van de Gateway een kleine
hoogwaterbuffer en schonen ze in batches op tot de geconfigureerde limiet.
Leesbewerkingen uit de sessieopslag verwijderen of begrenzen geen vermeldingen tijdens het opstarten van de Gateway, zodat
het opstarten en geïsoleerde Cron-sessies niet de kosten van een volledige opschoning van de opslag dragen.
`openclaw sessions cleanup --enforce` past de limiet onmiddellijk toe.

Probesessies voor modeluitvoeringen van de Gateway zijn standaard van korte duur. Rijen die overeenkomen met
`agent:*:explicit:model-run-<uuid>` gebruiken een vaste bewaartermijn van `24h`, maar de opschoning wordt
door druk geactiveerd: verouderde proberijen worden alleen verwijderd wanneer onderhouds- of
limietdruk voor sessievermeldingen wordt bereikt. Dit gebeurt vóór de bredere
leeftijdsgrens voor verouderde vermeldingen en de vermeldingslimiet. Normale privé-, groeps-, thread-, Cron-, hook-, Heartbeat-,
ACP- en subagentsessies nemen deze bewaartermijn van 24h niet over.

Onderhoud behoudt duurzame verwijzingen naar externe gesprekken, waaronder groepssessies
en chatssessies binnen een thread, terwijl synthetische vermeldingen voor Cron,
hooks, Heartbeat, ACP en subagents nog steeds mogen verouderen.

Als je eerder isolatie van privéberichten gebruikte en `session.dmScope` later terugzette naar
`main`, bekijk dan eerst verouderde, op peersleutels gebaseerde rijen voor privéberichten met
`openclaw sessions cleanup --dry-run --fix-dm-scope`. Door dezelfde vlag toe te passen,
worden die oude rijen voor directe privéberichten buiten gebruik gesteld en blijven hun transcripten als verwijderde
archieven bewaard.

Bekijk vooraf elke onderhoudsuitvoering met `openclaw sessions cleanup --dry-run`.

## Sessies inspecteren

| Opdracht                    | Toont                                                   |
| --------------------------- | ------------------------------------------------------- |
| `openclaw status`          | Pad van de sessieopslag en recente activiteit           |
| `openclaw sessions --json` | Alle sessies (filteren met `--active <minutes>`) |
| `/status` in de chat          | Contextgebruik, model en schakelaars                    |
| `/context list`            | Wat er in de systeemprompt staat                         |

## Verder lezen

- [Sessies doorzoeken](/nl/concepts/session-search) - zoeken in volledige tekst van eerdere transcripten
- [Sessies opschonen](/nl/concepts/session-pruning) - toolresultaten inkorten
- [Compaction](/nl/concepts/compaction) - lange gesprekken samenvatten
- [Sessietools](/nl/concepts/session-tool) - agenttools voor sessieoverschrijdend werk
- [Diepgaande uitleg over sessiebeheer](/nl/reference/session-management-compaction) -
  opslagschema, transcripten, verzendbeleid, metagegevens over de oorsprong en geavanceerde configuratie
- [Meerdere agents](/nl/concepts/multi-agent) - routering en sessie-isolatie tussen agents
- [Achtergrondtaken](/nl/automation/tasks) - hoe losgekoppeld werk taakrecords met sessieverwijzingen aanmaakt
- [Kanaalroutering](/nl/channels/channel-routing) - hoe binnenkomende berichten naar sessies worden gerouteerd

## Gerelateerd

- [Sessies opschonen](/nl/concepts/session-pruning)
- [Sessietools](/nl/concepts/session-tool)
- [Opdrachtwachtrij](/nl/concepts/queue)
