---
read_when:
    - U wilt sessierouting en isolatie begrijpen
    - Je wilt het DM-bereik configureren voor opstellingen met meerdere gebruikers
    - Je debugt dagelijkse sessieresets of sessieresets bij inactiviteit
summary: Hoe OpenClaw gesprekssessies beheert
title: Sessiebeheer
x-i18n:
    generated_at: "2026-04-29T22:40:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2bbb8f8fddf8ac942bc24b8b94a6464ec31d0aee035bf367726d2112269095f4
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw organiseert gesprekken in **sessies**. Elk bericht wordt gerouteerd naar een
sessie op basis van waar het vandaan kwam -- DM's, groepschats, cron-jobs, enz.

## Hoe berichten worden gerouteerd

| Bron             | Gedrag                         |
| ---------------- | ------------------------------ |
| Directe berichten | Standaard gedeelde sessie      |
| Groepschats      | Geisoleerd per groep           |
| Kamers/kanalen   | Geisoleerd per kamer           |
| Cron-jobs        | Nieuwe sessie per run          |
| Webhooks         | Geisoleerd per hook            |

## DM-isolatie

Standaard delen alle DM's een sessie voor continuiteit. Dit is prima voor
set-ups met een enkele gebruiker.

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

Dock-commando's laten een gebruiker de antwoordroute van de huidige directe-chatsessie verplaatsen naar
een ander gekoppeld kanaal zonder een nieuwe sessie te starten. Zie
[Kanaaldocking](/nl/concepts/channel-docking) voor voorbeelden, configuratie en
probleemoplossing.

Controleer je set-up met `openclaw security audit`.

## Levenscyclus van sessies

Sessies worden hergebruikt totdat ze verlopen:

- **Dagelijkse reset** (standaard) -- nieuwe sessie om 4:00 uur lokale tijd op de Gateway
  host. Dagelijkse versheid is gebaseerd op wanneer de huidige `sessionId` begon, niet
  op latere metadata-schrijfacties.
- **Inactieve reset** (optioneel) -- nieuwe sessie na een periode van inactiviteit. Stel
  `session.reset.idleMinutes` in. Inactieve versheid is gebaseerd op de laatste echte
  gebruikers-/kanaalinteractie, dus Heartbeat-, Cron- en exec-systeemgebeurtenissen houden de sessie niet
  actief.
- **Handmatige reset** -- typ `/new` of `/reset` in chat. `/new <model>` wisselt ook
  van model.

Wanneer zowel dagelijkse als inactieve resets zijn geconfigureerd, wint wat het eerst verloopt.
Heartbeat-, Cron-, exec- en andere systeemgebeurtenisbeurten kunnen sessiemetadata schrijven,
maar die schrijfacties verlengen de dagelijkse of inactieve resetversheid niet. Wanneer een reset
de sessie doorschuift, worden wachtrijmeldingen voor systeemgebeurtenissen voor de oude sessie
verwijderd zodat verouderde achtergrondupdates niet voorafgaan aan de eerste prompt in
de nieuwe sessie.

Sessies met een actieve provider-eigen CLI-sessie worden niet afgebroken door de impliciete
dagelijkse standaard. Gebruik `/reset` of configureer `session.reset` expliciet wanneer die
sessies volgens een timer moeten verlopen.

## Waar statusgegevens staan

Alle sessiestatus wordt beheerd door de **Gateway**. UI-clients vragen de Gateway om
sessiegegevens.

- **Store:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transcripties:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` houdt afzonderlijke levenscyclus-tijdstempels bij:

- `sessionStartedAt`: wanneer de huidige `sessionId` begon; dagelijkse reset gebruikt dit.
- `lastInteractionAt`: laatste gebruikers-/kanaalinteractie die de inactieve levensduur verlengt.
- `updatedAt`: laatste mutatie van de store-rij; handig voor lijsten en opschonen, maar niet
  gezaghebbend voor dagelijkse/inactieve resetversheid.

Oudere rijen zonder `sessionStartedAt` worden opgelost vanuit de JSONL-transcriptie
sessiekop wanneer beschikbaar. Als een oudere rij ook geen `lastInteractionAt` heeft,
valt inactieve versheid terug op die starttijd van de sessie, niet op latere administratieve
schrijfacties.

## Sessieonderhoud

OpenClaw begrenst sessieopslag automatisch in de loop van de tijd. Standaard draait het
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

Voor productie-omvang `maxEntries`-limieten gebruiken Gateway-runtime-schrijfacties een kleine high-water-buffer en schonen ze in batches terug naar de geconfigureerde limiet. Dit voorkomt dat volledige store-opschoning wordt uitgevoerd bij elke geisoleerde Cron-sessie. `openclaw sessions cleanup --enforce` past de limiet onmiddellijk toe.

Bekijk een voorbeeld met `openclaw sessions cleanup --dry-run`.

## Sessies inspecteren

- `openclaw status` -- pad van sessiestore en recente activiteit.
- `openclaw sessions --json` -- alle sessies (filter met `--active <minutes>`).
- `/status` in chat -- contextgebruik, model en toggles.
- `/context list` -- wat er in de systeemprompt staat.

## Verder lezen

- [Sessies opschonen](/nl/concepts/session-pruning) -- toolresultaten inkorten
- [Compaction](/nl/concepts/compaction) -- lange gesprekken samenvatten
- [Sessietools](/nl/concepts/session-tool) -- agenttools voor werk tussen sessies
- [Diepgaande uitleg over sessiebeheer](/nl/reference/session-management-compaction) --
  storeschema, transcripties, verzendbeleid, oorsprongsmetadata en geavanceerde configuratie
- [Multi-agent](/nl/concepts/multi-agent) — routing en sessie-isolatie tussen agents
- [Achtergrondtaken](/nl/automation/tasks) — hoe losgekoppeld werk taakrecords met sessieverwijzingen maakt
- [Kanaalrouting](/nl/channels/channel-routing) — hoe inkomende berichten naar sessies worden gerouteerd

## Gerelateerd

- [Sessies opschonen](/nl/concepts/session-pruning)
- [Sessietools](/nl/concepts/session-tool)
- [Commandowachtrij](/nl/concepts/queue)
