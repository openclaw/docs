---
read_when:
    - Uitvoering of gelijktijdigheid van automatische antwoorden wijzigen
    - Uitleg van /queue-modi of berichtsturingsgedrag
summary: Modi, standaardwaarden en sessiegebonden overschrijvingen voor de wachtrij voor automatische antwoorden
title: Opdrachtwachtrij
x-i18n:
    generated_at: "2026-06-27T17:29:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e518b018a85ddbc7afa3925180cc2329eb1d249316d81907ba51cfb3c692375
    source_path: concepts/queue.md
    workflow: 16
---

We serialiseren inkomende automatische antwoordruns (alle kanalen) via een kleine wachtrij binnen het proces om te voorkomen dat meerdere agentruns met elkaar botsen, terwijl veilige parallelle uitvoering over sessies heen mogelijk blijft.

## Waarom

- Automatische antwoordruns kunnen duur zijn (LLM-aanroepen) en kunnen botsen wanneer meerdere inkomende berichten kort na elkaar binnenkomen.
- Serialiseren voorkomt concurrentie om gedeelde resources (sessiebestanden, logs, CLI stdin) en verkleint de kans op upstream-snelheidslimieten.

## Hoe het werkt

- Een lane-bewuste FIFO-wachtrij verwerkt elke lane met een configureerbare concurrency-limiet (standaard 1 voor niet-geconfigureerde lanes; main standaard 4, subagent 8).
- `runEmbeddedAgent` plaatst in de wachtrij op **sessiesleutel** (lane `session:<key>`) om te garanderen dat er maar één actieve run per sessie is.
- Elke sessierun wordt daarna in een **globale lane** geplaatst (`main` standaard), zodat de totale parallelle uitvoering wordt begrensd door `agents.defaults.maxConcurrent`.
- Wanneer uitgebreide logging is ingeschakeld, geven runs in de wachtrij een korte melding als ze meer dan ~2s hebben gewacht voordat ze starten.
- Typindicatoren worden nog steeds direct bij enqueue geactiveerd (wanneer ondersteund door het kanaal), zodat de gebruikerservaring ongewijzigd blijft terwijl we op onze beurt wachten.

## Standaarden

Wanneer niet ingesteld, gebruiken alle inkomende kanaaloppervlakken:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

Sturen binnen dezelfde beurt is de standaard. Een prompt die midden in een run binnenkomt, wordt geïnjecteerd
in de actieve runtime wanneer de run sturing kan accepteren, zodat er geen tweede sessie-
run wordt gestart. Als de actieve run geen sturing kan accepteren, wacht OpenClaw tot de
actieve run is voltooid voordat de prompt wordt gestart.

## Wachtrijmodi

`/queue` bepaalt wat normale inkomende berichten doen terwijl een sessie al
een actieve run heeft:

- `steer`: injecteer berichten in de actieve runtime. OpenClaw levert alle wachtende stuurberichten **nadat de huidige assistentbeurt klaar is met het uitvoeren van zijn toolaanroepen**, vóór de volgende LLM-aanroep; Codex app-server ontvangt één gebatchte `turn/steer`. Als de run niet actief streamt of sturing niet beschikbaar is, wacht OpenClaw totdat de actieve run eindigt voordat de prompt wordt gestart.
- `followup`: stuur niet. Plaats elk bericht in de wachtrij voor een latere agentbeurt nadat de huidige run is geëindigd.
- `collect`: stuur niet. Voeg berichten in de wachtrij samen tot één **enkele** opvolgbeurt na het stille venster. Als berichten verschillende kanalen/threads targeten, worden ze afzonderlijk verwerkt om routering te behouden.
- `interrupt`: breek de actieve run voor die sessie af en voer daarna het nieuwste bericht uit.

Zie voor runtime-specifieke timing en afhankelijkheidsgedrag
[Sturingswachtrij](/nl/concepts/queue-steering). Zie voor de expliciete opdracht `/steer <message>`
[Sturen](/nl/tools/steer).

Configureer globaal of per kanaal via `messages.queue`:

```json5
{
  messages: {
    queue: {
      mode: "steer",
      debounceMs: 500,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## Wachtrijopties

Opties zijn van toepassing op levering vanuit de wachtrij. `debounceMs` stelt ook het stille venster
voor Codex-sturing in de modus `steer` in:

- `debounceMs`: stil venster voordat opvolgberichten of verzamelbatches uit de wachtrij worden verwerkt; in Codex `steer`-modus, stil venster voordat gebatchte `turn/steer` wordt verzonden. Kale getallen zijn milliseconden; eenheden `ms`, `s`, `m`, `h` en `d` worden geaccepteerd door `/queue`-opties.
- `cap`: maximaal aantal berichten in de wachtrij per sessie. Waarden lager dan `1` worden genegeerd.
- `drop: "summarize"`: standaard. Verwijder zo nodig de oudste items uit de wachtrij, bewaar compacte samenvattingen en injecteer die als een synthetische opvolgprompt.
- `drop: "old"`: verwijder zo nodig de oudste items uit de wachtrij, zonder samenvattingen te bewaren.
- `drop: "new"`: weiger het nieuwste bericht wanneer de wachtrij al vol is.

Standaarden: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Sturen en streaming

Wanneer kanaalstreaming `partial` of `block` is, kan sturing eruitzien als meerdere
korte zichtbare antwoorden terwijl de actieve run runtimegrenzen bereikt:

- `partial`: de preview kan vroeg worden afgerond, waarna een nieuwe preview start nadat
  sturing is geaccepteerd.
- `block`: blokken van conceptgrootte kunnen hetzelfde opeenvolgende uiterlijk geven.
- Zonder streaming valt sturing terug op een opvolgbericht na de actieve run wanneer
  de runtime geen sturing binnen dezelfde beurt kan accepteren.

`steer` breekt tools die al worden uitgevoerd niet af. Gebruik `/queue interrupt` wanneer het nieuwste
bericht de huidige run moet afbreken.

## Voorrang

Voor modusselectie lost OpenClaw het volgende op:

1. Inline of opgeslagen `/queue`-override per sessie.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Standaard `steer`.

Voor opties winnen inline of opgeslagen `/queue`-opties van configuratie. Daarna worden
kanaalspecifieke debounce (`messages.queue.debounceMsByChannel`), Plugin-
debouncestandaarden, globale `messages.queue`-opties en ingebouwde standaarden
toegepast. `cap` en `drop` zijn globale/sessieopties, geen configuratiesleutels
per kanaal.

## Overrides per sessie

- Verstuur `/queue <steer|followup|collect|interrupt>` als zelfstandige opdracht om de wachtrijmodus voor de huidige sessie op te slaan.
- Opties kunnen worden gecombineerd: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` of `/queue reset` wist de sessie-override.

## Bereik en garanties

- Van toepassing op automatische agentruns voor antwoorden over alle inkomende kanalen die de Gateway-antwoordpipeline gebruiken (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, enz.).
- Standaardlane (`main`) is procesbreed voor inkomende berichten + main-heartbeats; stel `agents.defaults.maxConcurrent` in om meerdere sessies parallel toe te staan.
- Er kunnen aanvullende lanes bestaan (bijv. `cron`, `cron-nested`, `nested`, `subagent`) zodat achtergrondtaken parallel kunnen draaien zonder inkomende antwoorden te blokkeren. Geïsoleerde cron-agentbeurten houden een `cron`-slot vast terwijl hun interne agentuitvoering `cron-nested` gebruikt; beide gebruiken `cron.maxConcurrentRuns`. Gedeelde niet-cron `nested`-flows behouden hun eigen lanegedrag. Deze losgekoppelde runs worden gevolgd als [achtergrondtaken](/nl/automation/tasks).
- Lanes per sessie garanderen dat slechts één agentrun tegelijk een bepaalde sessie aanraakt.
- Geen externe afhankelijkheden of achtergrondworkerthreads; pure TypeScript + promises.

## Probleemoplossing

- Als opdrachten lijken vast te zitten, schakel uitgebreide logs in en zoek naar regels met "queued for ...ms" om te bevestigen dat de wachtrij wordt verwerkt.
- Als je wachtrijdiepte nodig hebt, schakel uitgebreide logs in en let op timingregels voor de wachtrij.
- Codex app-server-runs die een beurt accepteren en daarna stoppen met voortgang uitsturen, worden onderbroken door de Codex-adapter zodat de actieve sessielane kan vrijkomen in plaats van te wachten op de timeout van de buitenste run.
- Wanneer diagnostiek is ingeschakeld, worden sessies die langer dan `diagnostics.stuckSessionWarnMs` in `processing` blijven zonder waargenomen antwoord, tool, status, blok of ACP-voortgang geclassificeerd op basis van huidige activiteit. Actief werk wordt gelogd als `session.long_running`; beheerde stille modelaanroepen blijven ook `session.long_running` tot `diagnostics.stuckSessionAbortMs`, zodat trage of niet-streamende providers niet te vroeg als vastgelopen worden gerapporteerd. Actief werk zonder recente voortgang wordt gelogd als `session.stalled`; beheerde modelaanroepen schakelen over naar `session.stalled` op of na de afbreekdrempel, en eigenaarloze verouderde model-/toolactiviteit wordt niet verborgen als langlopend. `session.stuck` is gereserveerd voor herstelbare verouderde sessieboekhouding, inclusief inactieve sessies in de wachtrij met verouderde eigenaarloze model-/toolactiviteit, en alleen dat pad kan de getroffen sessielane vrijgeven zodat werk in de wachtrij wordt verwerkt. Herhaalde `session.stuck`-diagnostiek valt terug zolang de sessie ongewijzigd blijft.

## Gerelateerd

- [Sessiebeheer](/nl/concepts/session)
- [Sturingswachtrij](/nl/concepts/queue-steering)
- [Sturen](/nl/tools/steer)
- [Beleid voor opnieuw proberen](/nl/concepts/retry)
