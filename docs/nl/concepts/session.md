---
read_when:
    - Je wilt sessieroutering en isolatie begrijpen
    - Je wilt het DM-bereik configureren voor configuraties met meerdere gebruikers
    - Je debugt dagelijkse sessieresets of sessieresets na inactiviteit
summary: Hoe OpenClaw gesprekssessies beheert
title: Sessiebeheer
x-i18n:
    generated_at: "2026-05-07T13:16:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4e5ec741a33262ce5c42caf021ad81892e89b3315db31ac7b141d5a13e8b22a2
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw organiseert gesprekken in **sessies**. Elk bericht wordt naar een
sessie gerouteerd op basis van waar het vandaan kwam -- DM's, groepschats, cron-taken, enz.

## Hoe berichten worden gerouteerd

| Bron            | Gedrag                         |
| --------------- | ------------------------------ |
| Directe berichten | Standaard gedeelde sessie     |
| Groepschats     | Geisoleerd per groep           |
| Kamers/kanalen  | Geisoleerd per kamer           |
| Cron-taken      | Nieuwe sessie per uitvoering   |
| Webhooks        | Geisoleerd per hook            |

## DM-isolatie

Standaard delen alle DM's een sessie voor continuiteit. Dit is prima voor
setups met een enkele gebruiker.

<Warning>
Als meerdere mensen je agent kunnen berichten, schakel dan DM-isolatie in. Zonder dit delen alle
gebruikers dezelfde gesprekscontext -- Alice's priveberichten zouden zichtbaar zijn voor Bob.
</Warning>

**De oplossing:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isoleren op kanaal + afzender
  },
}
```

Andere opties:

- `main` (standaard) -- alle DM's delen een sessie.
- `per-peer` -- isoleren op afzender (over kanalen heen).
- `per-channel-peer` -- isoleren op kanaal + afzender (aanbevolen).
- `per-account-channel-peer` -- isoleren op account + kanaal + afzender.

<Tip>
Als dezelfde persoon via meerdere kanalen contact met je opneemt, gebruik dan
`session.identityLinks` om hun identiteiten te koppelen zodat ze een sessie delen.
</Tip>

### Gekoppelde kanalen docken

Dock-opdrachten laten een gebruiker de antwoordroute van de huidige direct-chat-sessie naar
een ander gekoppeld kanaal verplaatsen zonder een nieuwe sessie te starten. Zie
[Kanaaldocking](/nl/concepts/channel-docking) voor voorbeelden, configuratie en
probleemoplossing.

Controleer je setup met `openclaw security audit`.

## Sessieleven cyclus

Sessies worden hergebruikt totdat ze verlopen:

- **Dagelijkse reset** (standaard) -- nieuwe sessie om 4:00 uur lokale tijd op de gateway-
  host. Dagelijkse versheid is gebaseerd op wanneer de huidige `sessionId` begon, niet
  op latere metadata-writes.
- **Inactiviteitsreset** (optioneel) -- nieuwe sessie na een periode van inactiviteit. Stel
  `session.reset.idleMinutes` in. Inactiviteitsversheid is gebaseerd op de laatste echte
  gebruikers-/kanaalinteractie, dus heartbeat-, cron- en exec-systeemgebeurtenissen houden
  de sessie niet actief.
- **Handmatige reset** -- typ `/new` of `/reset` in de chat. `/new <model>` wisselt ook
  van model.

Wanneer zowel dagelijkse als inactiviteitsresets zijn geconfigureerd, wint wat het eerst verloopt.
Heartbeat-, cron-, exec- en andere systeemgebeurtenisbeurten kunnen sessiemetadata schrijven,
maar die writes verlengen de dagelijkse of inactiviteitsresetversheid niet. Wanneer een reset
de sessie doorrolt, worden in de wachtrij geplaatste systeemgebeurtenismeldingen voor de oude sessie
verwijderd zodat verouderde achtergrondupdates niet voor de eerste prompt in
de nieuwe sessie worden geplaatst.

Sessies met een actieve provider-eigen CLI-sessie worden niet afgekapt door de impliciete
dagelijkse standaard. Gebruik `/reset` of configureer `session.reset` expliciet wanneer die
sessies op een timer moeten verlopen.

## Waar status leeft

Alle sessiestatus is eigendom van de **gateway**. UI-clients vragen de gateway om
sessiegegevens.

- **Store:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transcripts:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` bewaart afzonderlijke levenscyclus-tijdstempels:

- `sessionStartedAt`: wanneer de huidige `sessionId` begon; dagelijkse reset gebruikt dit.
- `lastInteractionAt`: laatste gebruikers-/kanaalinteractie die de inactiviteitsduur verlengt.
- `updatedAt`: laatste mutatie van de store-rij; nuttig voor lijsten en opschonen, maar niet
  gezaghebbend voor dagelijkse/inactiviteitsresetversheid.

Oudere rijen zonder `sessionStartedAt` worden afgeleid uit de transcript-JSONL
sessieheader wanneer beschikbaar. Als een oudere rij ook geen `lastInteractionAt` heeft,
valt inactiviteitsversheid terug op die sessiestarttijd, niet op latere administratieve
writes.

## Sessieonderhoud

OpenClaw begrenst sessieopslag automatisch na verloop van tijd. Standaard draait het
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

Voor productie-omvang `maxEntries`-limieten gebruiken Gateway-runtime-writes een kleine high-water-buffer en schonen ze in batches terug op tot de geconfigureerde limiet. Reads van de sessiestore snoeien of begrenzen geen entries tijdens het opstarten van de Gateway. Dit voorkomt dat bij elke start of geisoleerde cron-sessie een volledige store-opschoning wordt uitgevoerd. `openclaw sessions cleanup --enforce` past de limiet onmiddellijk toe.

Onderhoud bewaart duurzame externe gesprekspointers, waaronder groepssessies
en thread-scoped chatsessies, terwijl synthetische cron-, hook-, heartbeat-, ACP-
en sub-agent-entries toch kunnen verouderen.

Als je eerder isolatie van directe berichten gebruikte en later
`session.dmScope` terugzette naar `main`, bekijk dan verouderde peer-keyed DM-rijen vooraf met
`openclaw sessions cleanup --dry-run --fix-dm-scope`. Het toepassen van dezelfde vlag
pensioneert die oude direct-DM-rijen en behoudt hun transcripts als verwijderde
archieven.

Bekijk vooraf met `openclaw sessions cleanup --dry-run`.

## Sessies inspecteren

- `openclaw status` -- sessiestorepad en recente activiteit.
- `openclaw sessions --json` -- alle sessies (filter met `--active <minutes>`).
- `/status` in chat -- contextgebruik, model en toggles.
- `/context list` -- wat er in de systeemprompt staat.

## Verder lezen

- [Sessies snoeien](/nl/concepts/session-pruning) -- toolresultaten inkorten
- [Compaction](/nl/concepts/compaction) -- lange gesprekken samenvatten
- [Sessietools](/nl/concepts/session-tool) -- agenttools voor werk over sessies heen
- [Diepgaande sessiebeheeruitleg](/nl/reference/session-management-compaction) --
  storeschema, transcripts, verzendbeleid, oorsprongsmetadata en geavanceerde configuratie
- [Multi-Agent](/nl/concepts/multi-agent) — routering en sessie-isolatie tussen agents
- [Achtergrondtaken](/nl/automation/tasks) — hoe losgekoppeld werk taakrecords maakt met sessieverwijzingen
- [Kanaalroutering](/nl/channels/channel-routing) — hoe inkomende berichten naar sessies worden gerouteerd

## Gerelateerd

- [Sessies snoeien](/nl/concepts/session-pruning)
- [Sessietools](/nl/concepts/session-tool)
- [Opdrachtenwachtrij](/nl/concepts/queue)
