---
read_when:
    - Uitleg over hoe steer zich gedraagt terwijl een agent tools gebruikt
    - Gedrag van de wachtrij voor actieve uitvoeringen of integratie van runtime-aansturing wijzigen
    - Steering vergelijken met de wachtrijmodi followup, collect en interrupt
summary: Hoe actieve run-aansturing berichten in wachtrijen plaatst bij runtimegrenzen
title: Besturingswachtrij
x-i18n:
    generated_at: "2026-07-12T08:47:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a73311661b40d65d254b3e6af0406965fcde9eb76d2628c1958920453aad1cbc
    source_path: concepts/queue-steering.md
    workflow: 16
---

Wanneer een normale prompt binnenkomt terwijl een sessierun al uitvoer streamt en de wachtrijmodus `steer` is (de standaardinstelling, geen configuratie nodig), probeert OpenClaw die prompt naar de actieve runtime te sturen. OpenClaw en de systeemeigen Codex-app-serverharnas implementeren de details van de aflevering op verschillende manieren.

Deze pagina behandelt sturing via de wachtrijmodus voor normale inkomende berichten in de modus `steer`. In de modus `followup` of `collect` slaan normale berichten dit pad over en wachten ze totdat de actieve run is voltooid. Zie [Sturen](/nl/tools/steer) voor de expliciete opdracht `/steer <message>`.

## Runtimegrens

Sturing onderbreekt geen toolaanroep die al wordt uitgevoerd. OpenClaw controleert bij modelgrenzen op sturingsberichten in de wachtrij:

1. De assistent vraagt om toolaanroepen.
2. OpenClaw voert de batch toolaanroepen van het huidige assistentbericht uit.
3. OpenClaw verzendt de gebeurtenis voor het einde van de beurt.
4. OpenClaw haalt de sturingsberichten uit de wachtrij.
5. OpenClaw voegt die berichten vóór de volgende LLM-aanroep toe als gebruikersberichten.

Zo blijven toolresultaten gekoppeld aan het assistentbericht dat erom heeft gevraagd, waarna de volgende modelaanroep de recentste gebruikersinvoer kan zien.

Het systeemeigen Codex-app-serverharnas biedt `turn/steer` in plaats van de interne sturingswachtrij van de OpenClaw-runtime. OpenClaw bundelt prompts in de wachtrij gedurende het geconfigureerde rustige tijdsvenster en verzendt vervolgens één `turn/steer`-verzoek met alle verzamelde gebruikersinvoer in volgorde van binnenkomst.

Codex-beoordelingsbeurten en handmatige Compaction-beurten weigeren sturing binnen dezelfde beurt. Wanneer een runtime in de modus `steer` geen sturing kan accepteren, wacht OpenClaw totdat de actieve run is voltooid voordat de prompt wordt gestart.

## Modi

| Modus       | Gedrag tijdens actieve run                                  | Later gedrag                                                                                      |
| ----------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `steer`     | Stuurt de prompt waar mogelijk naar de actieve runtime.     | Wacht totdat de actieve run is voltooid als sturing niet beschikbaar is.                          |
| `followup`  | Stuurt niet bij.                                            | Voert berichten uit de wachtrij later uit nadat de actieve run is beëindigd.                       |
| `collect`   | Stuurt niet bij.                                            | Voegt compatibele berichten uit de wachtrij na het debouncevenster samen tot één latere beurt.     |
| `interrupt` | Breekt de actieve run af in plaats van deze bij te sturen.  | Start het nieuwste bericht na het afbreken.                                                       |

## Voorbeeld van een berichtenreeks

Als vier gebruikers berichten verzenden terwijl de agent een toolaanroep uitvoert:

- Bij het standaardgedrag ontvangt de actieve runtime alle vier berichten in volgorde van binnenkomst vóór de volgende modelbeslissing. OpenClaw haalt ze bij de volgende modelgrens uit de wachtrij; Codex ontvangt ze als één gebundelde `turn/steer`.
- Met `/queue collect` stuurt OpenClaw niet bij. Het wacht totdat de actieve run is beëindigd en maakt vervolgens na het debouncevenster een vervolgbeurt met compatibele berichten uit de wachtrij.
- Met `/queue interrupt` breekt OpenClaw de actieve run af en start het nieuwste bericht in plaats van bij te sturen.

## Reikwijdte

Sturing is altijd gericht op de huidige actieve sessierun. Er wordt geen nieuwe sessie gemaakt, het toolbeleid van de actieve run wordt niet gewijzigd en berichten worden niet per afzender gesplitst. In kanalen met meerdere gebruikers bevatten inkomende prompts al context over de afzender en routering, zodat de volgende modelaanroep kan zien wie elk bericht heeft verzonden.

Gebruik `followup` of `collect` wanneer berichten standaard in de wachtrij moeten worden geplaatst in plaats van de actieve run bij te sturen. Gebruik `interrupt` wanneer de nieuwste prompt de actieve run moet vervangen.

## Debounce

`messages.queue.debounceMs` is van toepassing op de aflevering van `followup`- en `collect`-berichten uit de wachtrij. In de modus `steer` met het systeemeigen Codex-harnas stelt deze optie ook het rustige tijdsvenster in voordat een gebundelde `turn/steer` wordt verzonden. Voor OpenClaw gebruikt actieve sturing zelf de debouncetimer niet, omdat OpenClaw berichten van nature bundelt tot de volgende modelgrens.

## Gerelateerd

- [Opdrachtwachtrij](/nl/concepts/queue)
- [Sturen](/nl/tools/steer)
- [Berichten](/nl/concepts/messages)
- [Agentlus](/nl/concepts/agent-loop)
