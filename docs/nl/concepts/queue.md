---
read_when:
    - Uitvoering of gelijktijdigheid van automatische antwoorden wijzigen
    - Uitleg over /queue-modi of gedrag voor berichtsturing
summary: Wachtrijmodi voor automatische antwoorden, standaardinstellingen en sessiespecifieke overschrijvingen
title: Commandowachtrij
x-i18n:
    generated_at: "2026-04-29T22:40:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 59d14a2b8e1b8d5bc1433c0f052869efed42912c9b85cdd79e518633d9919729
    source_path: concepts/queue.md
    workflow: 16
---

We serialiseren inkomende runs voor automatisch antwoorden (alle kanalen) via een kleine wachtrij binnen het proces om te voorkomen dat meerdere agent-runs botsen, terwijl veilige paralleliteit tussen sessies mogelijk blijft.

## Waarom

- Runs voor automatisch antwoorden kunnen kostbaar zijn (LLM-aanroepen) en kunnen botsen wanneer meerdere inkomende berichten kort na elkaar aankomen.
- Serialiseren voorkomt concurrentie om gedeelde resources (sessiebestanden, logs, CLI-stdin) en verkleint de kans op upstream-snelheidslimieten.

## Hoe het werkt

- Een lane-bewuste FIFO-wachtrij verwerkt elke lane met een configureerbare concurrency-limiet (standaard 1 voor niet-geconfigureerde lanes; main standaard 4, subagent 8).
- `runEmbeddedPiAgent` zet taken in de wachtrij op basis van **sessiesleutel** (lane `session:<key>`) om te garanderen dat er slechts één actieve run per sessie is.
- Elke sessierun wordt daarna in een **globale lane** (`main` standaard) gezet, zodat de totale paralleliteit wordt begrensd door `agents.defaults.maxConcurrent`.
- Wanneer uitgebreide logging is ingeschakeld, geven runs in de wachtrij een korte melding als ze meer dan ~2s hebben gewacht voordat ze starten.
- Typindicatoren worden nog steeds direct bij het in de wachtrij plaatsen geactiveerd (wanneer het kanaal dit ondersteunt), zodat de gebruikerservaring ongewijzigd blijft terwijl we op onze beurt wachten.

## Standaarden

Wanneer niet ingesteld, gebruiken alle inkomende kanaaloppervlakken:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` is de standaard omdat dit de actieve modelbeurt responsief houdt zonder
een tweede sessierun te starten. Als de huidige run geen sturing kan accepteren,
valt OpenClaw terug op een follow-up-item in de wachtrij.

## Wachtrijmodi

Inkomende berichten kunnen de huidige run sturen, wachten op een follow-upbeurt, of beide doen:

- `steer`: zet een sturingsbericht in de wachtrij voor de actieve Pi-run. Pi levert dit **nadat de huidige assistentbeurt klaar is met het uitvoeren van zijn toolaanroepen**, vóór de volgende LLM-aanroep. Als de run niet actief streamt of sturing niet beschikbaar is, valt OpenClaw terug op een follow-up-item in de wachtrij.
- `followup`: zet elk bericht in de wachtrij voor een latere agentbeurt nadat de huidige run eindigt.
- `collect`: voeg berichten in de wachtrij samen tot een **enkele** follow-upbeurt na het stiltevenster. Als berichten verschillende kanalen/threads targeten, worden ze afzonderlijk verwerkt om routering te behouden.
- `steer-backlog` (ook `steer+backlog`): stuur nu **en** bewaar hetzelfde bericht voor een follow-upbeurt.
- `interrupt` (legacy): breek de actieve run voor die sessie af en voer daarna het nieuwste bericht uit.
- `queue` (legacy-alias): hetzelfde als `steer`.

Steer-backlog betekent dat je een follow-upantwoord kunt krijgen na de gestuurde run, waardoor
streamingoppervlakken op duplicaten kunnen lijken. Geef de voorkeur aan `collect`/`steer` als je
één antwoord per inkomend bericht wilt.

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

Opties zijn van toepassing op `followup`, `collect` en `steer-backlog` (en op `steer` wanneer dit terugvalt op follow-up):

- `debounceMs`: stiltevenster voordat follow-ups in de wachtrij worden verwerkt. Kale getallen zijn milliseconden; de eenheden `ms`, `s`, `m`, `h` en `d` worden geaccepteerd door `/queue`-opties.
- `cap`: maximaal aantal berichten in de wachtrij per sessie. Waarden onder `1` worden genegeerd.
- `drop: "summarize"`: standaard. Verwijder de oudste items in de wachtrij waar nodig, bewaar compacte samenvattingen en injecteer ze als een synthetische follow-upprompt.
- `drop: "old"`: verwijder de oudste items in de wachtrij waar nodig, zonder samenvattingen te bewaren.
- `drop: "new"`: wijs het nieuwste bericht af wanneer de wachtrij al vol is.

Standaarden: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Voorrang

Voor modeselectie lost OpenClaw dit op:

1. Inline of opgeslagen `/queue`-override per sessie.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Standaard `steer`.

Voor opties winnen inline of opgeslagen `/queue`-opties van configuratie. Daarna worden
kanaalspecifieke debounce (`messages.queue.debounceMsByChannel`), Plugin-
debounce-standaarden, globale `messages.queue`-opties en ingebouwde standaarden
toegepast. `cap` en `drop` zijn globale/sessieopties, geen configuratiesleutels
per kanaal.

## Overrides per sessie

- Verstuur `/queue <mode>` als zelfstandige opdracht om de modus voor de huidige sessie op te slaan.
- Opties kunnen worden gecombineerd: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` of `/queue reset` wist de sessie-override.

## Scope en garanties

- Is van toepassing op auto-reply-agent-runs over alle inkomende kanalen die de Gateway-antwoordpipeline gebruiken (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, enz.).
- Standaardlane (`main`) is procesbreed voor inkomend verkeer + main-Heartbeats; stel `agents.defaults.maxConcurrent` in om meerdere sessies parallel toe te staan.
- Er kunnen extra lanes bestaan (bijv. `cron`, `cron-nested`, `nested`, `subagent`) zodat achtergrondtaken parallel kunnen draaien zonder inkomende antwoorden te blokkeren. Geïsoleerde Cron-agentbeurten houden een `cron`-slot vast terwijl hun innerlijke agentuitvoering `cron-nested` gebruikt; beide gebruiken `cron.maxConcurrentRuns`. Gedeelde niet-Cron-`nested`-flows behouden hun eigen lane-gedrag. Deze losgekoppelde runs worden bijgehouden als [achtergrondtaken](/nl/automation/tasks).
- Lanes per sessie garanderen dat slechts één agent-run tegelijk een bepaalde sessie aanraakt.
- Geen externe afhankelijkheden of achtergrondworkerthreads; pure TypeScript + promises.

## Probleemoplossing

- Als opdrachten vast lijken te zitten, schakel uitgebreide logs in en zoek naar regels met “queued for …ms” om te bevestigen dat de wachtrij wordt verwerkt.
- Als je wachtrijdiepte nodig hebt, schakel uitgebreide logs in en let op timingregels voor de wachtrij.
- Wanneer diagnostiek is ingeschakeld, loggen sessies die langer dan `diagnostics.stuckSessionWarnMs` in `processing` blijven een waarschuwing voor een vastgelopen sessie. Actieve ingebedde runs, actieve antwoordoperaties en actieve lanetaken blijven standaard alleen waarschuwingen; verouderde startup-boekhouding zonder actief sessiewerk kan de getroffen sessielane vrijgeven zodat werk in de wachtrij wordt verwerkt.

## Gerelateerd

- [Sessiebeheer](/nl/concepts/session)
- [Retrybeleid](/nl/concepts/retry)
