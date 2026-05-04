---
read_when:
    - Uitleg over hoe bijsturen werkt terwijl een agent hulpmiddelen gebruikt
    - Gedrag van de wachtrij voor actieve runs of de integratie voor runtime-aansturing wijzigen
    - Steer-, queue-, collect- en followup-modi vergelijken
summary: Hoe active-run-sturing berichten in wachtrijen plaatst bij runtimegrenzen
title: Sturingswachtrij
x-i18n:
    generated_at: "2026-05-04T02:23:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8df35b127ae0c1e1b3b684a1f63ce33874eb3d0b7bf9d0df7cb9dfce093090a
    source_path: concepts/queue-steering.md
    workflow: 16
---

Wanneer er een bericht binnenkomt terwijl een sessierun al streamt, kan OpenClaw
dat bericht naar de actieve runtime sturen in plaats van een andere run voor
dezelfde sessie te starten. De publieke modi zijn runtime-neutraal; Pi en de native Codex
app-server-harness implementeren de bezorgdetails anders.

## Runtimegrens

Bijsturing onderbreekt geen toolaanroep die al wordt uitgevoerd. Pi controleert op
wachtrijstaande bijsturingsberichten bij modelgrenzen:

1. De assistent vraagt om toolaanroepen.
2. Pi voert de toolaanroepbatch van het huidige assistentbericht uit.
3. Pi geeft de gebeurtenis voor het einde van de beurt uit.
4. Pi verwerkt de wachtrij met bijsturingsberichten.
5. Pi voegt die berichten toe als gebruikersberichten vóór de volgende LLM-aanroep.

Dit houdt toolresultaten gekoppeld aan het assistentbericht dat ze heeft aangevraagd,
en laat vervolgens de volgende modelaanroep de nieuwste gebruikersinvoer zien.

De native Codex app-server-harness biedt `turn/steer` in plaats van Pi's
interne bijsturingswachtrij. OpenClaw past daar dezelfde modi aan:

- `steer` batcht wachtrijstaande berichten gedurende het geconfigureerde stille venster en stuurt vervolgens één
  `turn/steer`-verzoek met alle verzamelde gebruikersinvoer in volgorde van binnenkomst.
- `queue` behoudt de verouderde geserialiseerde vorm door afzonderlijke `turn/steer`
  -verzoeken te sturen.
- `followup`, `collect`, `steer-backlog` en `interrupt` blijven door OpenClaw beheerd
  wachtrijgedrag rond de actieve Codex-beurt.

Codex-review en handmatige Compaction-beurten weigeren bijsturing binnen dezelfde beurt. Wanneer een
runtime geen bijsturing kan accepteren, valt OpenClaw terug op de follow-upwachtrij waar
die modus dat toestaat.

Deze pagina legt bijsturing in wachtrijmodus uit voor normale inkomende berichten. Zie
voor de expliciete opdracht `/steer <message>` [Bijsturen](/tools/steer).

## Modi

| Modus           | Gedrag bij actieve run                                                                                                      | Gedrag bij latere follow-up                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `steer`         | Injecteert alle wachtrijstaande bijsturingsberichten samen bij de volgende runtimegrens. Dit is de standaardinstelling.      | Valt alleen terug op follow-up wanneer bijsturing niet beschikbaar is.              |
| `queue`         | Verouderde een-voor-een-bijsturing. Pi injecteert één wachtrijstaand bericht per modelgrens; Codex stuurt afzonderlijke `turn/steer`-verzoeken. | Valt alleen terug op follow-up wanneer bijsturing niet beschikbaar is.              |
| `steer-backlog` | Hetzelfde bijsturingsgedrag bij actieve run als `steer`.                                                                     | Bewaart hetzelfde bericht ook voor een latere follow-upbeurt.                       |
| `followup`      | Stuurt de huidige run niet bij.                                                                                              | Voert wachtrijstaande berichten later uit.                                          |
| `collect`       | Stuurt de huidige run niet bij.                                                                                              | Voegt compatibele wachtrijstaande berichten samen tot één latere beurt na het debouncevenster. |
| `interrupt`     | Breekt de actieve run af en start daarna het nieuwste bericht.                                                               | Geen.                                                                               |

## Burstvoorbeeld

Als vier gebruikers berichten sturen terwijl de agent een toolaanroep uitvoert:

- `steer`: de actieve runtime ontvangt alle vier berichten in volgorde van binnenkomst vóór
  de volgende modelbeslissing. Pi verwerkt ze bij de volgende modelgrens; Codex
  ontvangt ze als één gebatchte `turn/steer`.
- `queue`: verouderde geserialiseerde bijsturing. Pi injecteert telkens één wachtrijstaand bericht;
  Codex ontvangt afzonderlijke `turn/steer`-verzoeken.
- `collect`: OpenClaw wacht tot de actieve run eindigt en maakt daarna een follow-upbeurt
  met compatibele wachtrijstaande berichten na het debouncevenster.

## Bereik

Bijsturing richt zich altijd op de huidige actieve sessierun. Het maakt geen nieuwe
sessie aan, wijzigt het toolbeleid van de actieve run niet en splitst berichten niet per afzender. In
kanalen met meerdere gebruikers bevatten inkomende prompts al afzender- en routecontext, zodat
de volgende modelaanroep kan zien wie elk bericht heeft gestuurd.

Gebruik `collect` wanneer je wilt dat OpenClaw een latere follow-upbeurt maakt die
compatibele berichten kan samenvoegen en het verwijderbeleid van de follow-upwachtrij kan behouden. Gebruik
`queue` alleen wanneer je het oudere een-voor-een-bijsturingsgedrag nodig hebt.

## Debounce

`messages.queue.debounceMs` geldt voor follow-upbezorging, inclusief `collect`,
`followup`, `steer-backlog` en `steer`-fallback wanneer bijsturing bij actieve run niet
beschikbaar is. Voor Pi gebruikt actieve `steer` zelf de debouncetimer niet, omdat
Pi berichten van nature batcht tot de volgende modelgrens. Voor de native
Codex-harness gebruikt OpenClaw dezelfde debouncewaarde als het stille venster vóór
het verzenden van de gebatchte `turn/steer`.

## Gerelateerd

- [Opdrachtwachtrij](/nl/concepts/queue)
- [Bijsturen](/tools/steer)
- [Berichten](/nl/concepts/messages)
- [Agentlus](/nl/concepts/agent-loop)
