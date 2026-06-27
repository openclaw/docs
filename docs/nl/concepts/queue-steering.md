---
read_when:
    - Uitleg over hoe sturen zich gedraagt terwijl een agent tools gebruikt
    - Gedrag van de actieve-run-wachtrij of runtime-sturingsintegratie wijzigen
    - Sturing vergelijken met de wachtrijmodi followup, collect en interrupt
summary: Hoe sturing van actieve runs berichten in wachtrijen plaatst aan runtimegrenzen
title: Sturingswachtrij
x-i18n:
    generated_at: "2026-06-27T17:29:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b38d036d2a44af431653746e2d5918af0a8af471450f440479cf0a1acc86c9cd
    source_path: concepts/queue-steering.md
    workflow: 16
---

Wanneer een normale prompt binnenkomt terwijl een sessierun al streamt, probeert OpenClaw
die prompt standaard naar de actieve runtime te sturen wanneer de wachtrijmodus
`steer` is. Er is geen configuratievermelding en geen wachtrijrichtlijn vereist voor dat standaardgedrag.
OpenClaw en de native Codex appserver-harness implementeren de bezorgdetails
op verschillende manieren.

## Runtimegrens

Sturen onderbreekt geen toolaanroep die al actief is. OpenClaw controleert op
in de wachtrij geplaatste stuurberichten bij modelgrenzen:

1. De assistent vraagt om toolaanroepen.
2. OpenClaw voert de batch met toolaanroepen van het huidige assistentbericht uit.
3. OpenClaw geeft de gebeurtenis voor het einde van de beurt uit.
4. OpenClaw verwerkt in de wachtrij geplaatste stuurberichten.
5. OpenClaw voegt die berichten toe als gebruikersberichten vóór de volgende LLM-aanroep.

Zo blijven toolresultaten gekoppeld aan het assistentbericht dat ze heeft aangevraagd,
waarna de volgende modelaanroep de nieuwste gebruikersinvoer kan zien.

De native Codex appserver-harness biedt `turn/steer` in plaats van de interne
stuurwachtrij van de OpenClaw-runtime. OpenClaw batcht in de wachtrij geplaatste prompts gedurende het geconfigureerde
stille venster en stuurt daarna één `turn/steer`-verzoek met alle verzamelde gebruikersinvoer
in volgorde van binnenkomst.

Codex-review en handmatige Compaction-beurten weigeren sturen binnen dezelfde beurt. Wanneer een
runtime geen sturen kan accepteren in de modus `steer`, wacht OpenClaw tot de actieve
run is voltooid voordat de prompt wordt gestart.

Deze pagina legt wachtrijmodussturing uit voor normale inkomende berichten wanneer de modus
`steer` is. Als de modus `followup` of `collect` is, gaan normale berichten niet dit
stuurpad in; ze wachten tot de actieve run is voltooid. Zie [Sturen](/nl/tools/steer) voor de expliciete
opdracht `/steer <message>`.

## Modi

| Modus       | Gedrag bij actieve run                                      | Later gedrag                                                                        |
| ----------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `steer`     | Stuurt de prompt naar de actieve runtime wanneer dat kan.   | Wacht tot de actieve run is voltooid als sturen niet beschikbaar is.                |
| `followup`  | Stuurt niet.                                                | Voert berichten in de wachtrij later uit nadat de actieve run is beëindigd.         |
| `collect`   | Stuurt niet.                                                | Voegt compatibele berichten in de wachtrij samen tot één latere beurt na het debounce-venster. |
| `interrupt` | Breekt de actieve run af in plaats van die te sturen.       | Start het nieuwste bericht na het afbreken.                                        |

## Burstvoorbeeld

Als vier gebruikers berichten sturen terwijl de agent een toolaanroep uitvoert:

- Met het standaardgedrag ontvangt de actieve runtime alle vier berichten in
  volgorde van binnenkomst vóór de volgende modelbeslissing. OpenClaw verwerkt ze bij de volgende modelgrens;
  Codex ontvangt ze als één gebatchte `turn/steer`.
- Met `/queue collect` stuurt OpenClaw niet. Het wacht tot de actieve run
  eindigt en maakt daarna een follow-upbeurt met compatibele berichten uit de wachtrij na het
  debounce-venster.
- Met `/queue interrupt` breekt OpenClaw de actieve run af en start het nieuwste
  bericht in plaats van te sturen.

## Bereik

Sturen richt zich altijd op de huidige actieve sessierun. Het maakt geen nieuwe
sessie aan, wijzigt het toolbeleid van de actieve run niet en splitst berichten niet per afzender. In
kanalen met meerdere gebruikers bevatten inkomende prompts al afzender- en routecontext, zodat
de volgende modelaanroep kan zien wie elk bericht heeft gestuurd.

Gebruik `followup` of `collect` wanneer je wilt dat berichten standaard in de wachtrij komen
in plaats van de actieve run te sturen. Gebruik `interrupt` wanneer de nieuwste prompt
de actieve run moet vervangen.

## Debounce

`messages.queue.debounceMs` is van toepassing op levering via `followup` en `collect` vanuit de wachtrij.
In de modus `steer` met de native Codex-harness stelt dit ook het stille venster in
voordat de gebatchte `turn/steer` wordt verzonden. Voor OpenClaw gebruikt actief sturen zelf
de debounce-timer niet, omdat OpenClaw berichten van nature batcht tot de volgende modelgrens.

## Gerelateerd

- [Opdrachtwachtrij](/nl/concepts/queue)
- [Sturen](/nl/tools/steer)
- [Berichten](/nl/concepts/messages)
- [Agentlus](/nl/concepts/agent-loop)
