---
read_when:
    - Uitvoering of gelijktijdigheid van automatische antwoorden wijzigen
    - Uitleg over /queue-modi of gedrag voor berichtsturing
summary: Wachtrijmodi voor automatische antwoorden, standaardinstellingen en overschrijvingen per sessie
title: Opdrachtwachtrij
x-i18n:
    generated_at: "2026-04-30T09:36:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ac0c0ded9558b080714fa4b8be0d552f985911bf19b427020f9654ae4955b2d
    source_path: concepts/queue.md
    workflow: 16
---

We serialiseren inkomende auto-antwoorduitvoeringen (alle kanalen) via een kleine in-process wachtrij om te voorkomen dat meerdere agentuitvoeringen botsen, terwijl veilige parallelliteit tussen sessies mogelijk blijft.

## Waarom

- Auto-antwoorduitvoeringen kunnen kostbaar zijn (LLM-aanroepen) en kunnen botsen wanneer meerdere inkomende berichten kort na elkaar aankomen.
- Serialiseren voorkomt concurrentie om gedeelde resources (sessiebestanden, logs, CLI stdin) en verkleint de kans op upstream-ratelimits.

## Hoe het werkt

- Een lane-bewuste FIFO-wachtrij verwerkt elke lane met een configureerbare concurrency-limiet (standaard 1 voor niet-geconfigureerde lanes; main is standaard 4, subagent 8).
- `runEmbeddedPiAgent` plaatst in de wachtrij op **sessiesleutel** (lane `session:<key>`) om te garanderen dat er slechts één actieve uitvoering per sessie is.
- Elke sessie-uitvoering wordt daarna in een **globale lane** (`main` standaard) geplaatst, zodat de totale parallelliteit wordt begrensd door `agents.defaults.maxConcurrent`.
- Wanneer uitgebreide logging is ingeschakeld, sturen wachtrij-uitvoeringen een korte melding als ze meer dan ~2s moesten wachten voordat ze startten.
- Typindicatoren worden nog steeds direct bij het plaatsen in de wachtrij geactiveerd (wanneer het kanaal dit ondersteunt), zodat de gebruikerservaring ongewijzigd blijft terwijl we op onze beurt wachten.

## Standaardwaarden

Wanneer niets is ingesteld, gebruiken alle inkomende kanaaloppervlakken:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` is de standaard omdat het de actieve modelbeurt responsief houdt zonder
een tweede sessie-uitvoering te starten. Het verwerkt alle sturingsberichten die
vóór de volgende modelgrens zijn aangekomen. Als de huidige uitvoering geen
sturing kan accepteren, valt OpenClaw terug op een followup-wachtrijitem.

## Wachtrijmodi

Inkomende berichten kunnen de huidige uitvoering sturen, wachten op een followup-beurt, of beide doen:

- `steer`: plaats sturingsberichten in de actieve runtime. Pi levert alle wachtende sturingsberichten **nadat de huidige assistentbeurt klaar is met het uitvoeren van zijn toolaanroepen**, vóór de volgende LLM-aanroep; Codex app-server ontvangt één gebatchte `turn/steer`. Als de uitvoering niet actief streamt of sturing niet beschikbaar is, valt OpenClaw terug op een followup-wachtrijitem.
- `queue` (legacy): oude een-voor-een-sturing. Pi levert één wachtrij-sturingsbericht bij elke modelgrens; Codex app-server ontvangt afzonderlijke `turn/steer`-verzoeken. Geef de voorkeur aan `steer`, tenzij je het vorige geserialiseerde gedrag nodig hebt.
- `followup`: plaats elk bericht in de wachtrij voor een latere agentbeurt nadat de huidige uitvoering eindigt.
- `collect`: voeg wachtrijberichten samen tot één **enkele** followup-beurt na het stille venster. Als berichten op verschillende kanalen/threads zijn gericht, worden ze afzonderlijk verwerkt om routering te behouden.
- `steer-backlog` (ook bekend als `steer+backlog`): stuur nu **en** bewaar hetzelfde bericht voor een followup-beurt.
- `interrupt` (legacy): breek de actieve uitvoering voor die sessie af en voer daarna het nieuwste bericht uit.

Steer-backlog betekent dat je na de gestuurde uitvoering een followup-antwoord
kunt krijgen, waardoor streaming-oppervlakken op duplicaten kunnen lijken. Geef
de voorkeur aan `collect`/`steer` als je één antwoord per inkomend bericht wilt.

Zie voor runtime-specifieke timing en afhankelijkheidsgedrag
[Sturingswachtrij](/nl/concepts/queue-steering).

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

Opties gelden voor `followup`, `collect` en `steer-backlog` (en voor `steer` of legacy `queue` wanneer sturing terugvalt op followup):

- `debounceMs`: stil venster voordat wachtrij-followups worden verwerkt. Kale getallen zijn milliseconden; eenheden `ms`, `s`, `m`, `h` en `d` worden geaccepteerd door `/queue`-opties.
- `cap`: maximaal aantal wachtrijberichten per sessie. Waarden onder `1` worden genegeerd.
- `drop: "summarize"`: standaard. Verwijder zo nodig de oudste wachtrijitems, bewaar compacte samenvattingen en injecteer die als een synthetische followup-prompt.
- `drop: "old"`: verwijder zo nodig de oudste wachtrijitems, zonder samenvattingen te bewaren.
- `drop: "new"`: wijs het nieuwste bericht af wanneer de wachtrij al vol is.

Standaardwaarden: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Voorrang

Voor modusselectie lost OpenClaw dit op:

1. Inline of opgeslagen `/queue`-override per sessie.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Standaard `steer`.

Voor opties winnen inline of opgeslagen `/queue`-opties van configuratie. Daarna
worden kanaalspecifieke debounce (`messages.queue.debounceMsByChannel`), Plugin
debounce-standaarden, globale `messages.queue`-opties en ingebouwde standaarden
toegepast. `cap` en `drop` zijn globale/sessie-opties, geen configuratiesleutels
per kanaal.

## Overrides per sessie

- Verstuur `/queue <mode>` als zelfstandige opdracht om de modus voor de huidige sessie op te slaan.
- Opties kunnen worden gecombineerd: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` of `/queue reset` wist de sessie-override.

## Scope en garanties

- Geldt voor auto-antwoord-agentuitvoeringen over alle inkomende kanalen die de Gateway-antwoordpipeline gebruiken (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, enz.).
- Standaard-lane (`main`) is procesbreed voor inkomend + main Heartbeats; stel `agents.defaults.maxConcurrent` in om meerdere sessies parallel toe te staan.
- Er kunnen extra lanes bestaan (bijv. `cron`, `cron-nested`, `nested`, `subagent`) zodat achtergrondtaken parallel kunnen draaien zonder inkomende antwoorden te blokkeren. Geïsoleerde Cron-agentbeurten houden een `cron`-slot vast terwijl hun interne agentuitvoering `cron-nested` gebruikt; beide gebruiken `cron.maxConcurrentRuns`. Gedeelde niet-Cron `nested`-flows behouden hun eigen lane-gedrag. Deze losgekoppelde uitvoeringen worden bijgehouden als [achtergrondtaken](/nl/automation/tasks).
- Lanes per sessie garanderen dat slechts één agentuitvoering tegelijk een bepaalde sessie aanraakt.
- Geen externe afhankelijkheden of achtergrond-workerthreads; pure TypeScript + promises.

## Probleemoplossing

- Als opdrachten vast lijken te zitten, schakel uitgebreide logs in en zoek naar regels “queued for …ms” om te bevestigen dat de wachtrij wordt verwerkt.
- Als je wachtrijdiepte nodig hebt, schakel uitgebreide logs in en let op wachtrij-timingregels.
- Wanneer diagnostiek is ingeschakeld, loggen sessies die langer dan `diagnostics.stuckSessionWarnMs` in `processing` blijven een waarschuwing voor een vastgelopen sessie. Actieve embedded uitvoeringen, actieve antwoordbewerkingen en actieve lane-taken blijven standaard alleen-waarschuwingen; verouderde opstartboekhouding zonder actief sessiewerk kan de getroffen sessie-lane vrijgeven zodat wachtrijwerk wordt verwerkt.

## Gerelateerd

- [Sessiebeheer](/nl/concepts/session)
- [Sturingswachtrij](/nl/concepts/queue-steering)
- [Retrybeleid](/nl/concepts/retry)
