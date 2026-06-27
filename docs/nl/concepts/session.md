---
read_when:
    - Je wilt sessieroutering en isolatie begrijpen
    - Je wilt het DM-bereik configureren voor setups met meerdere gebruikers
    - Je debugt dagelijkse sessieresets of sessieresets bij inactiviteit
summary: Hoe OpenClaw gesprekssessies beheert
title: Sessiebeheer
x-i18n:
    generated_at: "2026-06-27T17:29:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f65249b17c8b45f569531134471683e9f458015b02af29ddf4aa6e1e5c2eac05
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw organiseert gesprekken in **sessies**. Elk bericht wordt naar een
sessie gerouteerd op basis van waar het vandaan kwam -- DM's, groepschats, Cron-taken, enzovoort.

## Hoe berichten worden gerouteerd

| Bron            | Gedrag                         |
| --------------- | ------------------------------ |
| Directe berichten | Standaard gedeelde sessie    |
| Groepschats     | Geïsoleerd per groep           |
| Ruimtes/kanalen | Geïsoleerd per ruimte          |
| Cron-taken      | Nieuwe sessie per run          |
| Webhooks        | Geïsoleerd per hook            |

## DM-isolatie

Standaard delen alle DM's één sessie voor continuïteit. Dit is prima voor
installaties met één gebruiker.

<Warning>
Als meerdere mensen je agent berichten kunnen sturen, schakel dan DM-isolatie in. Zonder dit delen alle
gebruikers dezelfde gesprekscontext -- Alice' privéberichten zouden zichtbaar zijn
voor Bob.
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

- `main` (standaard) -- alle DM's delen één sessie.
- `per-peer` -- isoleer per afzender (over kanalen heen).
- `per-channel-peer` -- isoleer per kanaal + afzender (aanbevolen).
- `per-account-channel-peer` -- isoleer per account + kanaal + afzender.

<Tip>
Als dezelfde persoon contact met je opneemt via meerdere kanalen, gebruik dan
`session.identityLinks` om hun identiteiten te koppelen zodat ze één sessie delen.
</Tip>

### Gekoppelde kanalen docken

Dock-opdrachten laten een gebruiker de antwoordroute van de huidige directe-chatsessie verplaatsen naar
een ander gekoppeld kanaal zonder een nieuwe sessie te starten. Zie
[Kanaaldocking](/nl/concepts/channel-docking) voor voorbeelden, configuratie en
probleemoplossing.

Controleer je setup met `openclaw security audit`.

## Sessieleven cyclus

Sessies worden hergebruikt totdat ze verlopen:

- **Dagelijkse reset** (standaard) -- nieuwe sessie om 4:00 lokale tijd op de Gateway-
  host. Dagelijkse versheid is gebaseerd op wanneer de huidige `sessionId` begon, niet
  op latere metadata-schrijfacties.
- **Inactieve reset** (optioneel) -- nieuwe sessie na een periode van inactiviteit. Stel
  `session.reset.idleMinutes` in. Inactieve versheid is gebaseerd op de laatste echte
  gebruikers-/kanaalinteractie, zodat Heartbeat-, Cron- en exec-systeemgebeurtenissen de sessie niet
  levend houden.
- **Handmatige reset** -- typ `/new` of `/reset` in de chat. `/new <model>` wisselt ook
  van model.

Wanneer zowel dagelijkse als inactieve resets zijn geconfigureerd, wint degene die het eerst verloopt.
Heartbeat-, Cron-, exec- en andere systeemgebeurtenisbeurten kunnen sessiemetadata schrijven,
maar die schrijfacties verlengen de dagelijkse of inactieve resetversheid niet. Wanneer een reset
de sessie doorschuift, worden in de wachtrij geplaatste systeemgebeurtenismeldingen voor de oude sessie
weggegooid, zodat verouderde achtergrondupdates niet vóór de eerste prompt in
de nieuwe sessie worden geplaatst.

Sessies met een actieve provider-eigen CLI-sessie worden niet afgebroken door de impliciete
dagelijkse standaard. Gebruik `/reset` of configureer `session.reset` expliciet wanneer die
sessies op een timer moeten verlopen.

## Waar status leeft

Alle sessiestatus is eigendom van de **Gateway**. UI-clients vragen de Gateway om
sessiegegevens.

- **Store:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transcripties:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` houdt afzonderlijke leven cyclustijdstempels bij:

- `sessionStartedAt`: wanneer de huidige `sessionId` begon; dagelijkse reset gebruikt dit.
- `lastInteractionAt`: laatste gebruikers-/kanaalinteractie die de inactieve levensduur verlengt.
- `updatedAt`: laatste store-rijmutatie; nuttig voor lijsten en opschonen, maar niet
  gezaghebbend voor dagelijkse/inactieve resetversheid.

Oudere rijen zonder `sessionStartedAt` worden afgeleid uit de transcript-JSONL-
sessieheader wanneer beschikbaar. Als een oudere rij ook `lastInteractionAt` mist,
valt inactieve versheid terug op die sessiestarttijd, niet op latere administratieve
schrijfacties.

## Sessiebeheer

OpenClaw begrenst sessieopslag automatisch in de loop van de tijd. Standaard draait het
in `enforce`-modus en past het opschoning toe tijdens onderhoud. Stel
`session.maintenance.mode` in op `"warn"` om te rapporteren wat zou worden opgeschoond zonder de store/bestanden te wijzigen:

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

Voor productieformaat `maxEntries`-limieten gebruiken Gateway-runtime-schrijfacties een kleine high-water-buffer en schonen ze in batches terug op tot de geconfigureerde limiet. Lezen uit de sessiestore snoeit of limiteert geen items tijdens het opstarten van de Gateway. Dit voorkomt volledige store-opschoning bij elke opstart of geïsoleerde Cron-sessie. `openclaw sessions cleanup --enforce` past de limiet onmiddellijk toe.

Gateway model-run-probesessies zijn standaard kortlevend. Overeenkomende rijen met
strikte expliciete sleutels zoals `agent:*:explicit:model-run-<uuid>` gebruiken vaste `24h`-
retentie, maar opschoning is drukgestuurd: het verwijdert alleen verouderde proberijen wanneer
sessie-itemonderhouds-/limietdruk wordt bereikt. Wanneer model-run-opschoning draait,
draait die vóór de bredere leeftijdsgrens voor verouderde items en de itemlimiet. Normale directe,
groeps-, thread-, Cron-, hook-, Heartbeat-, ACP- en sub-agent-sessies erven
deze 24h-retentie niet.

Onderhoud bewaart duurzame externe gesprekspointers, inclusief groeps-
sessies en thread-gebonden chatsessies, terwijl synthetische Cron-,
hook-, Heartbeat-, ACP- en sub-agent-items nog steeds kunnen verouderen.

Als je eerder directe-berichtisolatie gebruikte en later
`session.dmScope` terugzette naar `main`, bekijk dan verouderde peer-keyed DM-rijen vooraf met
`openclaw sessions cleanup --dry-run --fix-dm-scope`. Het toepassen van dezelfde vlag
pensioneert die oude directe-DM-rijen en bewaart hun transcripties als verwijderde
archieven.

Bekijk vooraf met `openclaw sessions cleanup --dry-run`.

## Sessies inspecteren

- `openclaw status` -- pad van de sessiestore en recente activiteit.
- `openclaw sessions --json` -- alle sessies (filter met `--active <minutes>`).
- `/status` in chat -- contextgebruik, model en toggles.
- `/context list` -- wat er in de systeemprompt staat.

## Verder lezen

- [Sessiesnoei](/nl/concepts/session-pruning) -- toolresultaten inkorten
- [Compaction](/nl/concepts/compaction) -- lange gesprekken samenvatten
- [Sessietools](/nl/concepts/session-tool) -- agenttools voor werk over sessies heen
- [Diepgaande sessiebeheeruitleg](/nl/reference/session-management-compaction) --
  storeschema, transcripties, verzendbeleid, oorsprongsmetadata en geavanceerde configuratie
- [Multi-Agent](/nl/concepts/multi-agent) — routing en sessie-isolatie tussen agents
- [Achtergrondtaken](/nl/automation/tasks) — hoe losgekoppeld werk taakrecords met sessieverwijzingen maakt
- [Kanaalroutering](/nl/channels/channel-routing) — hoe inkomende berichten naar sessies worden gerouteerd

## Gerelateerd

- [Sessiesnoei](/nl/concepts/session-pruning)
- [Sessietools](/nl/concepts/session-tool)
- [Opdrachtwachtrij](/nl/concepts/queue)
