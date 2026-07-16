---
read_when:
    - Je wilt weten of het herstarten van de Gateway lopend agentwerk verloren laat gaan
    - Een agentuitvoering is onderbroken door een herstart, crash of herladen van de configuratie
    - Je debugt automatisch sessieherstel nadat de Gateway weer actief is
summary: 'Wat een herstart of crash van de Gateway overleeft: onderbroken agentbeurten worden automatisch hervat, subagenten en achtergrondtaken worden hersteld en leveringen in de wachtrij worden afgehandeld'
title: Herstel na herstart
x-i18n:
    generated_at: "2026-07-16T15:52:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f2fc0263d792e78e75fb97be44671b44287d469b949e11640f11b6ff651dafb9
    source_path: gateway/restart-recovery.md
    workflow: 16
---

Het opnieuw starten van de Gateway leidt niet tot verlies van de agentstatus. Gesprekken, transcripties,
geplande taken, registraties van achtergrondtaken en uitgaande berichten in de wachtrij bevinden zich allemaal
op schijf, en werk dat halverwege een beurt werd onderbroken, wordt gedetecteerd en
automatisch hervat nadat de Gateway weer actief is. Handmatige tussenkomst is niet
vereist en er hoeft niets te worden geconfigureerd: herstel is altijd ingeschakeld.

Deze pagina beschrijft wat een herstart overleeft, hoe onderbroken werk wordt gedetecteerd
en hoe automatisch hervatten eruitziet.

## Wat een herstart overleeft

| Status                        | Opslag                                      | Gedrag bij een herstart                                                  |
| ----------------------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| Gespreksgeschiedenis          | SQLite-database per agent                   | Ongewijzigd; sessies gaan verder vanaf het opgeslagen transcript         |
| Onderbroken beurt in hoofdsessie | SQLite-sessierij en transcript per agent | Wordt enkele seconden na het opstarten automatisch hervat of afgestemd   |
| Subagent-uitvoeringen         | SQLite (gedeelde statusdatabase)            | Register wordt bij het opstarten hersteld; onderbroken uitvoeringen worden hervat |
| Achtergrondtaken             | SQLite (gedeelde statusdatabase)            | Worden bij het opstarten afgestemd; verweesde uitvoeringen worden hersteld of als verloren gemarkeerd |
| Uitgaande leveringen in wachtrij | SQLite-leveringswachtrij                 | Worden na de herstart verwerkt; niet-geleverde antwoorden worden opnieuw geprobeerd |
| Geplande (cron-)taken         | SQLite-cronopslag                           | Schema's blijven behouden; de planner wordt bij het opstarten opnieuw geactiveerd |
| Voortzetting na herstart      | SQLite-herstartsentinel                     | Eenmalige vervolgactie wordt verzonden naar de sessie die om de herstart vroeg |

## Gecontroleerde herstarts laten werk eerst afronden

Een aangevraagde herstart (`openclaw gateway restart`, een configuratiewijziging waarvoor
een herstart nodig is of een Gateway-update) beëindigt lopend werk niet onmiddellijk. De
Gateway accepteert geen nieuw werk meer en wacht vervolgens tot actieve agentbeurten en
achtergrondtaken zijn voltooid, tot maximaal het afhandelingsbudget (standaard 5 minuten). De meeste
herstarts onderbreken daarom helemaal niets.

Alleen werk dat niet binnen het afhandelingsbudget kan worden voltooid (of een uitvoering die wordt onderbroken
door een geforceerde herstart of crash) wordt afgebroken — en voordat dat gebeurt, wordt elke
betrokken sessie gemarkeerd voor herstel.

## Hoe onderbroken werk wordt gedetecteerd

Drie aanvullende mechanismen markeren sessies waarvan de beurt niet is voltooid:

- **Bij toelating van de beurt:** voor een gewone tekstbeurt in een bestaande hoofdsessie
  voegt de Gateway het gebruikersbericht toe, markeert de sessie als actief en registreert
  de leveringsclaim voor herstel in één SQLite-transactie voordat het model of de
  `before_agent_reply`-hook wordt uitgevoerd. De Control UI doet dit voordat de
  `started`-bevestiging wordt geretourneerd; kanaalverzending doet dit wanneer de voorbereide beurt
  de agentuitvoering overneemt.
  Opdrachten, bijlagen, overschrijvingen per beurt, wachtende leveringen, eerdere aanwijzingen voor afbreken,
  sessies die eigendom zijn van plugins en beurten met uitvoeringshooks behouden hun
  gespecialiseerde toelatingspaden.
  Als een `before_agent_reply`-hook is geïnstalleerd, wordt bij toelating ook de fase ervan geregistreerd.
  Herstel voert een hook die tijdens een aanroep werd onderbroken nooit opnieuw uit. Zodra een niet-afgehandelde hook
  is voltooid, registreert het controlepunt dat resultaat, maar herstel blijft uit veiligheidsoverwegingen weigeren
  zolang die hook actief blijft: een controlepunt kan niet bewijzen dat na de herstart dezelfde
  plugincode en configuratie zijn geladen. Afgehandelde tekstresultaten en
  stille resultaten krijgen afzonderlijke controlepunten voor deterministische afwikkeling.
  Duurzame herstelclaims die door oudere versies zijn geschreven, hebben geen markering voor broneigenaarschap
  en krijgen daarom tijdens een upgrade dezelfde uit veiligheidsoverwegingen weigerende hookcontrole.
- **Bij afsluiten:** tijdens de afhandeling vóór de herstart krijgt elke sessie met een actieve uitvoering
  een herstelmarkering in de sessieopslag voordat de uitvoering wordt
  afgebroken.
- **Bij opstarten:** de Gateway scant sessieopslagen op sessies die nog steeds
  beweren actief te zijn, maar geen actieve eigenaar in het nieuwe proces hebben. Hiermee worden
  harde crashes en geforceerde beëindigingen gedetecteerd waarbij geen afsluitcode is uitgevoerd. Verouderde transcriptvergrendelingsbestanden
  worden tegelijkertijd opgeruimd.

## Automatisch hervatten

Enkele seconden na het opstarten verzendt de Gateway elke gemarkeerde sessie opnieuw
met een synthetisch systeembericht dat de agent meldt dat de vorige beurt
door een herstart is onderbroken en dat deze moet doorgaan vanaf het bestaande transcript. Als er
al een definitief antwoord was gegenereerd maar nog niet geleverd, wordt de tekst ervan opgenomen,
zodat de agent het kan leveren in plaats van het werk opnieuw uit te voeren. Herstel probeert het maximaal
3 keer opnieuw met exponentiële vertraging. Elke nieuwe poging gebruikt één duurzame verzendings-
identificatie, zodat een onduidelijke verbindingsfout niet hetzelfde herstel
twee keer kan starten. Voltooide en niet-hervatbare Control UI-beurten behouden ook begrensde duurzame
idempotentietombstones, zodat een opnieuw verbindende outbox ze kan intrekken zonder
het verzoek opnieuw uit te voeren.

Antwoorden die uitsluitend het berichtentool gebruiken, gebruiken een tweede duurzame correlatie. Voordat een terminale
verzending binnen hetzelfde gesprek het kanaal bereikt, registreert de Gateway een onopgeloste
leveringsintentie voor de exacte sessie en bronbeurt. Een bevestigd succes van de provider
zet deze om in een duurzaam leveringsbewijs; een bevestigde fout wist
de intentie. Herstel voltooit een leveringsbewijs zonder tools opnieuw uit te voeren. Als een crash
ervoor zorgt dat het resultaat bij de provider onbekend is, weigert herstel uit veiligheidsoverwegingen in plaats van
een extern effect opnieuw uit te voeren.

Het geleverde antwoord wordt ook met de bronbericht-ID naar het transcript gespiegeld.
Terminale spiegelingen gebruiken een afzonderlijke bewijssleutel, zodat een voortgangsverzending met
dezelfde idempotentiesleutel van de provider de terminale markering niet kan verhullen. Voortgangs-
verzendingen en bewijzen van oudere beurten kunnen de huidige beurt niet voltooien. Alleen
duurzame claims voor binnenkomst via het kanaal kunnen bevoegdheid voor berichtacties herstellen. Een hervatte
uitvoering behoudt de oorspronkelijke bronleveringsmodus en broncorrelatie, inclusief
de identiteit van de aanvrager en eventuele beperking tot hetzelfde kanaal of dezelfde thread, zodat hetzelfde bewijs
gezaghebbend blijft, zelfs als tijdens het herstel nog een herstart plaatsvindt. Een
beurt die uitsluitend het berichtentool gebruikt zonder reconstrueerbare kanaalbevoegdheid wordt uit veiligheidsoverwegingen geweigerd
en ontvangt de eenmalige melding om opnieuw te verzenden.

Voordat de Gateway hervat, controleert deze of het einde van het transcript veilig is om
vanaf verder te gaan. Als dat niet zo is (bijvoorbeeld als de beurt eindigde met een verouderde wachtende
goedkeuring), wordt de sessie niet blindelings opnieuw uitgevoerd; de agent plaatst in plaats daarvan een korte
melding waarin de gebruiker wordt gevraagd het laatste verzoek opnieuw te verzenden. Voor WebChat wordt die melding
rechtstreeks naar de sessiegeschiedenis geschreven, zodat deze na opnieuw verbinden zichtbaar blijft.

OpenClaw kan ook onderbroken alleen-lezenwerk in [Code Mode](/nl/reference/code-mode)
reconstrueren. Code Mode markeert deze uitvoeringen als herstartveilig en weigert catalogustools
met neveneffecten of pluginnaamruimten voordat ze worden uitgevoerd. Als een herstart plaatsvindt bij
het `wait`-besturingselement, reconstrueert de nieuwe Gateway de beurt op basis van het transcript
en dwingt deze af dat de gereconstrueerde uitvoering herstartveilig blijft, zelfs als het
model die vlag weglaat of wist. De host filtert de volledige gereconstrueerde
beurt tot gecontroleerde alleen-lezen kerntools en expliciet veilig opnieuw uitvoerbare plugintools,
ook wanneer Code Mode na de herstart is uitgeschakeld. Werk met neveneffecten
blijft beschermd door de melding om opnieuw te verzenden, in plaats van het risico op een dubbele schrijfactie te nemen.

### Subagents

Subagent-uitvoeringen worden opgeslagen in de gedeelde SQLite-statusdatabase, zodat het
subagentregister het proces overleeft. Bij het opstarten wordt het register hersteld en
worden onderbroken subagentsessies hervat met hun oorspronkelijke taakcontext.
Er gelden twee veiligheidsmechanismen:

- Uitvoeringen die meer dan 2 uur geleden zijn onderbroken, worden afgerond in plaats van hervat, zodat
  een Gateway die 's nachts buiten werking was geen verouderd werk opnieuw activeert.
- Een sessie waarvan het herstel herhaaldelijk mislukt, wordt als vastgelopen gemarkeerd met een tombstone, zodat
  herstel niet eindeloos kan blijven doorgaan.

### Achtergrondtaken

Het [register voor achtergrondtaken](/nl/automation/tasks) wordt ondersteund door SQLite en
afgestemd bij het opstarten en met regelmatige tussenpozen: duurzame resultaten die door
voltooide uitvoeringen zijn geregistreerd, worden hersteld en uitvoeringen waarvan het eigenaarsproces is verdwenen, worden
na een respijtperiode als verloren gemarkeerd in plaats van voor altijd te blijven hangen.

### Door de agent aangevraagde herstarts

Wanneer de agent zelf een herstart activeert (door een configuratiewijziging toe te passen, de
Gateway bij te werken of via een expliciet herstartverzoek), wordt een herstartsentinel naar
SQLite geschreven voordat het proces wordt afgesloten. Na het opstarten plaatst de Gateway het resultaat terug
in de oorspronkelijke chat en verzendt deze een eenmalige vervolgbeurt, zodat de
agent precies verdergaat waar deze was gebleven, in hetzelfde kanaal en dezelfde thread.

## Veiligheidsmechanismen en observeerbaarheid

- **Onderbreker voor crashlussen:** 3 onregelmatige opstarts binnen 5 minuten activeren een onderbreker die
  het automatisch starten van ondersteunende services bij de volgende opstart onderdrukt, zodat een crashende Gateway
  zichzelf niet versterkt. Deze herstelt zodra het venster met onregelmatige opstarts leegloopt.
- **Metrieken:** herstelactiviteit wordt via
  [Prometheus](/nl/gateway/prometheus) geëxporteerd als `openclaw_session_recovery_total` en
  `openclaw_session_recovery_age_seconds`.
- **Logboeken:** herstelbeslissingen worden vastgelegd onder de
  subsystemen `main-session-restart-recovery` en `subagent-interrupted-resume`.

## Wat niet wordt hervat

- Sessies die zijn uitgesloten van herstel van de hoofdsessie omdat een andere eigenaar ze al
  afhandelt: subagentsessies (subagentherstel), cronsessies (de
  planner voert ze opnieuw uit volgens het schema) en door ACP beheerde sessies (de verbonden IDE
  of client beheert het hervatten).
- Sessies waarvan het einde van het transcript niet veilig kan worden voortgezet; deze krijgen de
  hierboven beschreven melding om opnieuw te verzenden in plaats van een stille nieuwe uitvoering.
- Werk dat nooit is toegelaten: berichten die tijdens het afhandelingsvenster binnenkomen, worden
  geweigerd met een expliciete herstartfout in plaats van stilzwijgend in de wachtrij van een
  stervend proces te worden geplaatst.
