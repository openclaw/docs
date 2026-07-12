---
read_when:
    - Uitvoering of gelijktijdigheid van automatische antwoorden wijzigen
    - Uitleg over /queue-modi of gedrag voor berichtsturing
summary: Wachtrijmodi voor automatische antwoorden, standaardinstellingen en overschrijvingen per sessie
title: Opdrachtwachtrij
x-i18n:
    generated_at: "2026-07-12T08:48:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 309d149545aaba91d2248dd6354d82e3cb7ddd489817a5f84acbb0269a0815ec
    source_path: concepts/queue.md
    workflow: 16
---

OpenClaw serialiseert inkomende automatische antwoordruns (alle kanalen) via een kleine wachtrij binnen het proces om te voorkomen dat meerdere agentruns met elkaar botsen, terwijl veilige parallelliteit tussen sessies mogelijk blijft.

## Waarom

- Automatische antwoordruns kunnen kostbaar zijn (LLM-aanroepen) en kunnen botsen wanneer meerdere inkomende berichten kort na elkaar aankomen.
- Serialisatie voorkomt concurrentie om gedeelde bronnen (sessiebestanden, logboeken, CLI-standaardinvoer) en verkleint de kans op snelheidslimieten van bovenliggende diensten.

## Hoe het werkt

- Een rijstrookbewuste FIFO-wachtrij verwerkt elke rijstrook met een configureerbare limiet voor gelijktijdigheid (standaard 1 voor niet-geconfigureerde rijstroken; `main` is standaard 4 en `subagent` 8).
- `runEmbeddedAgent` plaatst runs in de wachtrij op basis van de **sessiesleutel** (rijstrook `session:<key>`) om te garanderen dat er per sessie slechts één actieve run is.
- Elke sessierun wordt vervolgens in een **globale rijstrook** geplaatst (standaard `main`), zodat de totale parallelliteit wordt begrensd door `agents.defaults.maxConcurrent`.
- Wanneer uitgebreide logboekregistratie is ingeschakeld, geven runs in de wachtrij een korte melding als ze vóór het starten langer dan circa 2 seconden hebben gewacht.
- Typindicatoren worden bij plaatsing in de wachtrij nog steeds onmiddellijk geactiveerd (wanneer het kanaal dit ondersteunt), zodat de gebruikerservaring ongewijzigd blijft terwijl de run op zijn beurt wacht.

## Standaardwaarden

Wanneer niets is ingesteld, gebruiken alle oppervlakken voor inkomende kanalen:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

Bijsturen binnen dezelfde beurt is de standaard. Een prompt die tijdens een run binnenkomt, wordt in de actieve runtime geïnjecteerd wanneer de run bijsturing kan accepteren, zodat er geen tweede sessierun wordt gestart. Als de actieve run geen bijsturing kan accepteren, wacht OpenClaw tot de actieve run is voltooid voordat de prompt wordt gestart.

## Wachtrijmodi

`/queue` bepaalt wat normale inkomende berichten doen wanneer een sessie al een actieve run heeft:

- `steer`: injecteer berichten in de actieve runtime. OpenClaw levert alle wachtende bijsturingsberichten **nadat de huidige assistentbeurt klaar is met het uitvoeren van de toolaanroepen**, vóór de volgende LLM-aanroep; de Codex-appserver ontvangt één gebundelde `turn/steer`. Als de run niet actief streamt of bijsturing niet beschikbaar is, wacht OpenClaw tot de actieve run is beëindigd voordat de prompt wordt gestart.
- `followup`: stuur niet bij. Plaats elk bericht in de wachtrij voor een latere agentbeurt nadat de huidige run is beëindigd.
- `collect`: stuur niet bij. Voeg berichten in de wachtrij na het rustige venster samen tot **één** vervolgbeurt. Als berichten op verschillende kanalen/threads zijn gericht, worden ze afzonderlijk verwerkt om de routering te behouden.
- `interrupt`: breek de actieve run voor die sessie af en voer vervolgens het nieuwste bericht uit.

Zie [Bijsturingswachtrij](/nl/concepts/queue-steering) voor runtimespecifieke timing en afhankelijkheidsgedrag. Zie [Bijsturen](/nl/tools/steer) voor de expliciete opdracht `/steer <message>`.

Configureer dit globaal of per kanaal via `messages.queue`:

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

Opties gelden voor levering vanuit de wachtrij. `debounceMs` stelt in de modus `steer` ook het rustige venster voor Codex-bijsturing in:

- `debounceMs`: rustig venster voordat vervolgberichten of verzamelbundels uit de wachtrij worden verwerkt; in de Codex-modus `steer` is dit het rustige venster voordat een gebundelde `turn/steer` wordt verzonden. Getallen zonder eenheid zijn milliseconden; de opties van `/queue` accepteren de eenheden `ms`, `s`, `m`, `h` en `d`.
- `cap`: maximaal aantal berichten in de wachtrij per sessie. Waarden kleiner dan `1` worden genegeerd.
- `drop: "summarize"` (standaard): verwijder indien nodig de oudste items uit de wachtrij, bewaar compacte samenvattingen en injecteer deze als een synthetische vervolgprompt.
- `drop: "old"`: verwijder indien nodig de oudste items uit de wachtrij zonder samenvattingen te bewaren.
- `drop: "new"`: weiger het nieuwste bericht wanneer de wachtrij al vol is.

Standaardwaarden: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Bijsturen en streamen

Wanneer kanaalstreaming op `partial` of `block` staat, kan bijsturing eruitzien als meerdere korte zichtbare antwoorden terwijl de actieve run runtimegrenzen bereikt:

- `partial`: het voorbeeld kan vroeg worden voltooid, waarna een nieuw voorbeeld start zodra de bijsturing is geaccepteerd.
- `block`: blokken ter grootte van een concept kunnen dezelfde opeenvolgende weergave veroorzaken.
- Zonder streaming valt bijsturing terug op een vervolgbeurt na de actieve run wanneer de runtime geen bijsturing binnen dezelfde beurt kan accepteren.

`steer` breekt actieve tools niet af. Gebruik `/queue interrupt` wanneer het nieuwste bericht de huidige run moet afbreken.

## Voorrangsvolgorde

Voor de modusselectie hanteert OpenClaw:

1. Een inline of opgeslagen `/queue`-overschrijving per sessie.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. De standaardwaarde `steer`.

Voor opties hebben inline of opgeslagen `/queue`-opties voorrang op de configuratie. Daarna worden in deze volgorde toegepast: kanaalspecifieke wachttijd (`messages.queue.debounceMsByChannel`), standaardwaarden voor de Plugin-wachttijd, globale `messages.queue`-opties en ingebouwde standaardwaarden. `cap` en `drop` zijn globale/sessieopties, geen configuratiesleutels per kanaal.

## Overschrijvingen per sessie

- Verzend `/queue <steer|followup|collect|interrupt>` als zelfstandige opdracht om de wachtrijmodus voor de huidige sessie op te slaan.
- Opties kunnen worden gecombineerd: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` of `/queue reset` wist de sessieoverschrijving.

## Annulering van beurten in de wachtrij

Terwijl een prompt in de vervolg-/verzamelwachtrij staat (bijvoorbeeld wanneer een TUI- of
webchat-`chat.send` binnenkomt terwijl een andere beurt actief is), bewaart de Gateway een
**door de Gateway beheerde annuleringsidentiteit** voor de `runId` van die client totdat de inhoud
uit de wachtrij wordt uitgevoerd of verwijderd. De identiteit blijft gekoppeld aan inhoud die in een
overloopsamenvatting is opgenomen.

- `chat.abort` met een specifieke `runId` annuleert die beurt terwijl deze nog in de
  wachtrij staat, als de aanvrager bevoegd is (dezelfde eigendomsregels als voor actieve runs).
- `chat.abort` voor een sessie zonder `runId` annuleert **eerst bevoegde beurten in de
  wachtrij** en breekt daarna bevoegde actieve runs af. Die volgorde voorkomt dat verwerking van de wachtrij
  werk promoveert naar een halfgestopte sessie.
- Het wissen van de volledige sessiewachtrij zonder controles per aanvrager is niet het
  stoppad voor sessies met meerdere eigenaren.
- Wachttijden in de wachtrij worden voor `sessions.list` niet weergegeven als actieve agentruns en
  vallen niet onder de time-outsemantiek voor actieve runs; alleen de actieve fase doet dat.

Clients (waaronder de TUI) sturen prompts die tijdens een run binnenkomen door en laten de Gateway de
wachtrijmodus toepassen. Esc/`/stop` gebruikt een sessiegebonden afbreking, zodat verloren lokale ingangen
er niet toe kunnen leiden dat een prompt in de wachtrij alsnog wordt uitgevoerd.

## Bereik en garanties

- Geldt voor automatische antwoordruns van agents in alle inkomende kanalen die de antwoordpijplijn van de Gateway gebruiken (WhatsApp-web, Telegram, Slack, Discord, Signal, iMessage, webchat enzovoort).
- De standaardrijstrook (`main`) geldt voor het hele proces voor inkomende berichten en hoofd-heartbeats; stel `agents.defaults.maxConcurrent` in om meerdere sessies parallel toe te staan.
- Er kunnen aanvullende rijstroken bestaan (bijvoorbeeld `cron`, `cron-nested`, `nested`, `subagent`), zodat achtergrondtaken parallel kunnen worden uitgevoerd zonder inkomende antwoorden te blokkeren. Geïsoleerde Cron-agentbeurten houden een `cron`-plaats bezet terwijl hun interne agentuitvoering `cron-nested` gebruikt; beide gebruiken `cron.maxConcurrentRuns`. Gedeelde niet-Cron-`nested`-stromen behouden hun eigen rijstrookgedrag. Deze losgekoppelde runs worden gevolgd als [achtergrondtaken](/nl/automation/tasks).
- Rijstroken per sessie garanderen dat slechts één agentrun tegelijk een bepaalde sessie gebruikt.
- Geen externe afhankelijkheden of achtergrondwerkthreads; uitsluitend TypeScript en promises.

## Problemen oplossen

- Als opdrachten lijken vast te zitten, schakel dan uitgebreide logboekregistratie in en zoek naar regels met "queued for ...ms" om te bevestigen dat de wachtrij wordt verwerkt.
- Runs van de Codex-appserver die een beurt accepteren en daarna geen voortgang meer melden, worden door de Codex-adapter onderbroken, zodat de actieve sessierijstrook kan worden vrijgegeven in plaats van op de time-out van de buitenste run te wachten.
- Wanneer diagnostiek is ingeschakeld, worden sessies die langer dan `diagnostics.stuckSessionWarnMs` in `processing` blijven zonder waargenomen antwoord-, tool-, status-, blok- of ACP-voortgang geclassificeerd op basis van de huidige activiteit:
  - Actief werk met recente voortgang wordt vastgelegd als `session.long_running`. Modelaanroepen met een eigenaar die stil blijven, behouden eveneens de status `session.long_running` tot `diagnostics.stuckSessionAbortMs`, zodat trage of niet-streamende providers niet te vroeg als vastgelopen worden gemeld.
  - Actief werk zonder recente voortgang wordt vastgelegd als `session.stalled`; modelaanroepen met een eigenaar, geblokkeerde toolaanroepen en vastgelopen ingebedde runs schakelen op of na de afbreekdrempel over naar `session.stalled`. Verouderde model-/toolactiviteit zonder eigenaar wordt niet als langdurig verborgen.
  - `session.stuck` is voorbehouden aan herstelbare verouderde sessieboekhouding, waaronder inactieve sessies in de wachtrij met verouderde model-/toolactiviteit zonder eigenaar.
  - `session.stuck` activeert altijd herstel dat de betreffende sessierijstrook kan vrijgeven. Een classificatie als `session.stalled` na `diagnostics.stuckSessionAbortMs` (geblokkeerde toolaanroep, vastgelopen modelaanroep of vastgelopen ingebedde run) kan ook actief afbreekherstel activeren, zodat beide classificaties een wachtrij kunnen deblokkeren, niet alleen `session.stuck`.
  - Herhaalde waarschuwingsregels voor `session.stuck` en `session.long_running` in het logboek worden exponentieel minder vaak weergegeven zolang de sessie ongewijzigd blijft; herstelpogingen worden ongeacht deze vertraging nog steeds bij elke Heartbeat-cyclus uitgevoerd.

## Gerelateerd

- [Sessiebeheer](/nl/concepts/session)
- [Bijsturingswachtrij](/nl/concepts/queue-steering)
- [Bijsturen](/nl/tools/steer)
- [Beleid voor nieuwe pogingen](/nl/concepts/retry)
