---
read_when:
    - Je wilt sessierouting en isolatie begrijpen
    - Je wilt het DM-bereik configureren voor opstellingen met meerdere gebruikers
    - Je debugt dagelijkse sessieresets of sessieresets bij inactiviteit
summary: Hoe OpenClaw gesprekssessies beheert
title: Sessiebeheer
x-i18n:
    generated_at: "2026-05-02T11:14:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2fd0c9e880242a8d0070c24bd1f7971e4082344240e28632e2e3ca032404807
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw organiseert gesprekken in **sessies**. Elk bericht wordt naar een
sessie gerouteerd op basis van waar het vandaan komt -- DM's, groepschats, cron-taken, enzovoort.

## Hoe berichten worden gerouteerd

| Bron            | Gedrag                         |
| --------------- | ------------------------------ |
| Directe berichten | Gedeelde sessie standaard    |
| Groepschats     | Geisoleerd per groep           |
| Ruimtes/kanalen | Geisoleerd per ruimte          |
| Cron-taken      | Nieuwe sessie per uitvoering   |
| Webhooks        | Geisoleerd per hook            |

## DM-isolatie

Standaard delen alle DM's een sessie voor continuiteit. Dit is prima voor
opstellingen met een enkele gebruiker.

<Warning>
Als meerdere mensen je agent berichten kunnen sturen, schakel dan DM-isolatie in. Zonder dit delen alle
gebruikers dezelfde gesprekscontext -- Alice's priveberichten zouden
zichtbaar zijn voor Bob.
</Warning>

**De oplossing:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolate by channel + sender
  },
}
```

Andere opties:

- `main` (standaard) -- alle DM's delen een sessie.
- `per-peer` -- isoleer per afzender (over kanalen heen).
- `per-channel-peer` -- isoleer per kanaal + afzender (aanbevolen).
- `per-account-channel-peer` -- isoleer per account + kanaal + afzender.

<Tip>
Als dezelfde persoon contact met je opneemt via meerdere kanalen, gebruik dan
`session.identityLinks` om hun identiteiten te koppelen zodat ze een sessie delen.
</Tip>

### Gekoppelde kanalen docken

Dock-opdrachten laten een gebruiker de antwoordroute van de huidige directe-chat-sessie naar
een ander gekoppeld kanaal verplaatsen zonder een nieuwe sessie te starten. Zie
[Kanaaldocking](/nl/concepts/channel-docking) voor voorbeelden, configuratie en
probleemoplossing.

Controleer je opstelling met `openclaw security audit`.

## Levenscyclus van sessies

Sessies worden hergebruikt totdat ze verlopen:

- **Dagelijkse reset** (standaard) -- nieuwe sessie om 04:00 lokale tijd op de Gateway
  host. Dagelijkse versheid is gebaseerd op wanneer de huidige `sessionId` begon, niet
  op latere metadata-schrijfacties.
- **Inactieve reset** (optioneel) -- nieuwe sessie na een periode van inactiviteit. Stel
  `session.reset.idleMinutes` in. Inactieve versheid is gebaseerd op de laatste echte
  gebruikers-/kanaalinteractie, zodat heartbeat-, cron- en exec-systeemgebeurtenissen de sessie niet
  actief houden.
- **Handmatige reset** -- typ `/new` of `/reset` in de chat. `/new <model>` wisselt ook
  van model.

Wanneer zowel dagelijkse als inactieve resets zijn geconfigureerd, geldt wat het eerst verloopt.
Heartbeat-, cron-, exec- en andere systeemgebeurtenisbeurten kunnen sessiemetadata schrijven,
maar die schrijfacties verlengen de versheid voor dagelijkse of inactieve resets niet. Wanneer een reset
de sessie doorschuift, worden in de wachtrij geplaatste systeemgebeurtenismeldingen voor de oude sessie
verwijderd, zodat verouderde achtergrondupdates niet aan de eerste prompt in
de nieuwe sessie worden toegevoegd.

Sessies met een actieve provider-eigen CLI-sessie worden niet afgebroken door de impliciete
dagelijkse standaard. Gebruik `/reset` of configureer `session.reset` expliciet wanneer die
sessies op een timer moeten verlopen.

## Waar status wordt opgeslagen

Alle sessiestatus is eigendom van de **Gateway**. UI-clients vragen de Gateway om
sessiegegevens.

- **Opslag:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transcripties:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` houdt afzonderlijke levenscyclus-tijdstempels bij:

- `sessionStartedAt`: wanneer de huidige `sessionId` begon; dagelijkse reset gebruikt dit.
- `lastInteractionAt`: laatste gebruikers-/kanaalinteractie die de inactieve levensduur verlengt.
- `updatedAt`: laatste mutatie van de opslagrij; nuttig voor weergeven en opschonen, maar niet
  leidend voor versheid van dagelijkse/inactieve resets.

Oudere rijen zonder `sessionStartedAt` worden opgelost vanuit de transcript-JSONL
sessieheader wanneer die beschikbaar is. Als een oudere rij ook geen `lastInteractionAt` heeft,
valt inactieve versheid terug op die sessiestarttijd, niet op latere administratieve
schrijfacties.

## Sessiebeheer

OpenClaw begrenst sessieopslag automatisch na verloop van tijd. Standaard draait dit
in `warn`-modus (rapporteert wat zou worden opgeschoond). Stel `session.maintenance.mode`
in op `"enforce"` voor automatische opschoning:

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

Voor productieomvang `maxEntries`-limieten gebruiken Gateway-runtime-schrijfacties een kleine high-water-buffer en schonen ze in batches terug op tot de geconfigureerde limiet. Lezen uit de sessieopslag snoeit of begrenst geen items tijdens het opstarten van de Gateway. Dit voorkomt dat bij elke opstart of geisoleerde cron-sessie een volledige opschoning van de opslag wordt uitgevoerd. `openclaw sessions cleanup --enforce` past de limiet direct toe.

Onderhoud behoudt duurzame externe gesprekspointers, waaronder groepssessies
en thread-scoped chatsessies, terwijl synthetische cron-, hook-, Heartbeat-, ACP-
en sub-agent-items nog steeds kunnen verouderen.

Bekijk een voorbeeld met `openclaw sessions cleanup --dry-run`.

## Sessies inspecteren

- `openclaw status` -- pad naar sessieopslag en recente activiteit.
- `openclaw sessions --json` -- alle sessies (filter met `--active <minutes>`).
- `/status` in chat -- contextgebruik, model en schakelaars.
- `/context list` -- wat er in de systeemprompt staat.

## Verder lezen

- [Sessies snoeien](/nl/concepts/session-pruning) -- toolresultaten inkorten
- [Compaction](/nl/concepts/compaction) -- lange gesprekken samenvatten
- [Sessietools](/nl/concepts/session-tool) -- agenttools voor sessieoverstijgend werk
- [Diepgaande uitleg over sessiebeheer](/nl/reference/session-management-compaction) --
  opslagschema, transcripties, verzendbeleid, oorsprongsmetadata en geavanceerde configuratie
- [Multi-agent](/nl/concepts/multi-agent) — routering en sessie-isolatie tussen agents
- [Achtergrondtaken](/nl/automation/tasks) — hoe losgekoppeld werk taakrecords met sessieverwijzingen maakt
- [Kanaalroutering](/nl/channels/channel-routing) — hoe binnenkomende berichten naar sessies worden gerouteerd

## Gerelateerd

- [Sessies snoeien](/nl/concepts/session-pruning)
- [Sessietools](/nl/concepts/session-tool)
- [Opdrachtwachtrij](/nl/concepts/queue)
