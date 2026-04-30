---
read_when:
    - Uitleg over hoe steer zich gedraagt terwijl een agent tools gebruikt
    - Gedrag van de wachtrij voor actieve uitvoeringen of de integratie voor sturing tijdens uitvoering wijzigen
    - Vergelijking van de modi steer, queue, collect en followup
summary: Hoe sturing voor actieve runs berichten in de wachtrij plaatst bij runtimegrenzen
title: Besturingswachtrij
x-i18n:
    generated_at: "2026-04-30T09:36:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 560390c8c26bcce95e0137f4336ad6e62bc3e2344cb15fd12ca3cfe4a85a8acc
    source_path: concepts/queue-steering.md
    workflow: 16
---

Wanneer er een bericht binnenkomt terwijl een sessierun al streamt, kan OpenClaw
dat bericht naar de actieve runtime sturen in plaats van een andere run voor
dezelfde sessie te starten. De openbare modi zijn runtime-neutraal; Pi en het
native Codex app-server-harnas implementeren de leveringsdetails anders.

## Runtime-grens

Bijsturing onderbreekt geen toolaanroep die al wordt uitgevoerd. Pi controleert op
in de wachtrij geplaatste bijsturingsberichten bij modelgrenzen:

1. De assistent vraagt om toolaanroepen.
2. Pi voert de tool-call-batch van het huidige assistentbericht uit.
3. Pi verzendt de gebeurtenis voor het einde van de beurt.
4. Pi verwerkt de bijsturingsberichten in de wachtrij.
5. Pi voegt die berichten toe als gebruikersberichten vóór de volgende LLM-aanroep.

Dit houdt toolresultaten gekoppeld aan het assistentbericht dat ze heeft aangevraagd,
en laat de volgende modelaanroep vervolgens de nieuwste gebruikersinvoer zien.

Het native Codex app-server-harnas stelt `turn/steer` beschikbaar in plaats van Pi's
interne bijsturingswachtrij. OpenClaw past daar dezelfde modi toe:

- `steer` bundelt berichten in de wachtrij gedurende het geconfigureerde stille venster en stuurt daarna een
  enkele `turn/steer`-aanvraag met alle verzamelde gebruikersinvoer in volgorde van binnenkomst.
- `queue` behoudt de oudere geserialiseerde vorm door afzonderlijke `turn/steer`-
  aanvragen te sturen.
- `followup`, `collect`, `steer-backlog` en `interrupt` blijven wachtrijgedrag dat OpenClaw beheert
  rondom de actieve Codex-beurt.

Codex-review- en handmatige Compaction-beurten weigeren bijsturing binnen dezelfde beurt. Wanneer een
runtime geen bijsturing kan accepteren, valt OpenClaw terug op de vervolgwachtrij waar
die modus dit toestaat.

## Modi

| Modus           | Gedrag bij actieve run                                                                                                      | Later vervolg-gedrag                                                              |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `steer`         | Injecteert alle bijsturingsberichten in de wachtrij samen bij de volgende runtime-grens. Dit is de standaard.                | Valt alleen terug op vervolg wanneer bijsturing niet beschikbaar is.              |
| `queue`         | Oudere bijsturing één voor één. Pi injecteert één bericht uit de wachtrij per modelgrens; Codex stuurt afzonderlijke `turn/steer`-aanvragen. | Valt alleen terug op vervolg wanneer bijsturing niet beschikbaar is.              |
| `steer-backlog` | Hetzelfde bijsturingsgedrag bij actieve runs als `steer`.                                                                    | Bewaart hetzelfde bericht ook voor een latere vervolgbeurt.                       |
| `followup`      | Stuurt de huidige run niet bij.                                                                                              | Voert berichten in de wachtrij later uit.                                         |
| `collect`       | Stuurt de huidige run niet bij.                                                                                              | Voegt compatibele berichten in de wachtrij samen tot één latere beurt na het debounce-venster. |
| `interrupt`     | Breekt de actieve run af en start daarna het nieuwste bericht.                                                               | Geen.                                                                              |

## Burst-voorbeeld

Als vier gebruikers berichten sturen terwijl de agent een toolaanroep uitvoert:

- `steer`: de actieve runtime ontvangt alle vier berichten in volgorde van binnenkomst vóór
  zijn volgende modelbeslissing. Pi verwerkt ze bij de volgende modelgrens; Codex
  ontvangt ze als één gebundelde `turn/steer`.
- `queue`: oudere geserialiseerde bijsturing. Pi injecteert één bericht uit de wachtrij tegelijk;
  Codex ontvangt afzonderlijke `turn/steer`-aanvragen.
- `collect`: OpenClaw wacht tot de actieve run eindigt en maakt daarna een vervolgbeurt
  met compatibele berichten uit de wachtrij na het debounce-venster.

## Scope

Bijsturing richt zich altijd op de huidige actieve sessierun. Het maakt geen nieuwe
sessie aan, wijzigt het toolbeleid van de actieve run niet en splitst berichten niet per afzender. In
kanalen met meerdere gebruikers bevatten inkomende prompts al afzender- en routecontext, zodat
de volgende modelaanroep kan zien wie elk bericht heeft gestuurd.

Gebruik `collect` wanneer u wilt dat OpenClaw een latere vervolgbeurt bouwt die
compatibele berichten kan samenvoegen en het verwijderbeleid van de vervolgwachtrij behoudt. Gebruik
`queue` alleen wanneer u het oudere bijsturingsgedrag één voor één nodig hebt.

## Debounce

`messages.queue.debounceMs` is van toepassing op vervolglevering, inclusief `collect`,
`followup`, `steer-backlog` en `steer`-fallback wanneer bijsturing van de actieve run niet
beschikbaar is. Voor Pi gebruikt actieve `steer` zelf de debounce-timer niet, omdat
Pi berichten van nature bundelt tot de volgende modelgrens. Voor het native
Codex-harnas gebruikt OpenClaw dezelfde debouncewaarde als het stille venster voordat
de gebundelde `turn/steer` wordt verstuurd.

## Gerelateerd

- [Opdrachtwachtrij](/nl/concepts/queue)
- [Berichten](/nl/concepts/messages)
- [Agentlus](/nl/concepts/agent-loop)
