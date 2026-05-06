---
read_when:
    - Uitvoering of gelijktijdigheid van automatische antwoorden wijzigen
    - Uitleg over modi van /queue of gedrag voor berichtsturing
summary: Wachtrijmodi voor automatische antwoorden, standaardwaarden en overschrijvingen per sessie
title: Commandowachtrij
x-i18n:
    generated_at: "2026-05-06T09:10:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f182195b740d678044a203387da6368df77ac2a6bb0eb29653bb8ea45264aaf
    source_path: concepts/queue.md
    workflow: 16
---

We serialiseren inkomende auto-reply-runs (alle kanalen) via een kleine in-process-wachtrij om te voorkomen dat meerdere agentruns met elkaar botsen, terwijl veilige parallelliteit tussen sessies mogelijk blijft.

## Waarom

- Auto-reply-runs kunnen duur zijn (LLM-calls) en kunnen botsen wanneer meerdere inkomende berichten kort na elkaar binnenkomen.
- Serialiseren voorkomt concurrentie om gedeelde resources (sessiebestanden, logs, CLI stdin) en verkleint de kans op upstream-ratelimits.

## Hoe het werkt

- Een lane-bewuste FIFO-wachtrij leegt elke lane met een configureerbare concurrency-limiet (standaard 1 voor niet-geconfigureerde lanes; main standaard 4, subagent 8).
- `runEmbeddedPiAgent` plaatst in de wachtrij op basis van **sessiesleutel** (lane `session:<key>`) om te garanderen dat er per sessie slechts één actieve run is.
- Elke sessierun wordt daarna in een **globale lane** (`main` standaard) geplaatst, zodat de totale parallelliteit wordt begrensd door `agents.defaults.maxConcurrent`.
- Wanneer uitgebreide logging is ingeschakeld, geven runs in de wachtrij een korte melding als ze meer dan ~2s hebben gewacht voordat ze starten.
- Typindicatoren worden nog steeds onmiddellijk geactiveerd bij plaatsing in de wachtrij (wanneer ondersteund door het kanaal), zodat de gebruikerservaring ongewijzigd blijft terwijl we op onze beurt wachten.

## Standaarden

Wanneer niet ingesteld, gebruiken alle inkomende kanaaloppervlakken:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` is de standaard omdat het de actieve modelbeurt responsief houdt zonder
een tweede sessierun te starten. Het verwerkt alle steering-berichten die zijn
binnengekomen vóór de volgende modelgrens. Als de huidige run geen steering kan
accepteren, valt OpenClaw terug op een followup-wachtrij-item.

## Wachtrijmodi

Inkomende berichten kunnen de huidige run sturen, wachten op een followup-beurt, of beide doen:

- `steer`: plaats steering-berichten in de actieve runtime. Pi levert alle wachtende steering-berichten **nadat de huidige assistentbeurt klaar is met het uitvoeren van zijn tool-calls**, vóór de volgende LLM-call; Codex app-server ontvangt één gebatchte `turn/steer`. Als de run niet actief streamt of steering niet beschikbaar is, valt OpenClaw terug op een followup-wachtrij-item.
- `queue` (legacy): oude een-voor-een-steering. Pi levert één steering-bericht uit de wachtrij bij elke modelgrens; Codex app-server ontvangt afzonderlijke `turn/steer`-requests. Geef de voorkeur aan `steer`, tenzij je het vorige geserialiseerde gedrag nodig hebt.
- `followup`: plaats elk bericht in de wachtrij voor een latere agentbeurt nadat de huidige run eindigt.
- `collect`: voeg berichten in de wachtrij samen tot een **enkele** followup-beurt na het stille venster. Als berichten op verschillende kanalen/threads zijn gericht, worden ze afzonderlijk verwerkt om routering te behouden.
- `steer-backlog` (ook wel `steer+backlog`): stuur nu **en** behoud hetzelfde bericht voor een followup-beurt.
- `interrupt` (legacy): breek de actieve run voor die sessie af en voer daarna het nieuwste bericht uit.

Steer-backlog betekent dat je een followup-antwoord kunt krijgen na de gestuurde run, waardoor
streamingoppervlakken op duplicaten kunnen lijken. Geef de voorkeur aan `collect`/`steer` als je
één antwoord per inkomend bericht wilt.

Voor runtime-specifieke timing en dependency-gedrag, zie
[Steering-wachtrij](/nl/concepts/queue-steering). Voor de expliciete opdracht `/steer <message>`
zie [Steer](/nl/tools/steer).

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

Opties zijn van toepassing op `followup`, `collect` en `steer-backlog` (en op `steer` of legacy `queue` wanneer steering terugvalt op followup):

- `debounceMs`: stil venster voordat followups in de wachtrij worden verwerkt. Losse getallen zijn milliseconden; eenheden `ms`, `s`, `m`, `h` en `d` worden geaccepteerd door `/queue`-opties.
- `cap`: maximaal aantal berichten in de wachtrij per sessie. Waarden onder `1` worden genegeerd.
- `drop: "summarize"`: standaard. Verwijder de oudste items in de wachtrij indien nodig, bewaar compacte samenvattingen en injecteer ze als een synthetische followup-prompt.
- `drop: "old"`: verwijder de oudste items in de wachtrij indien nodig, zonder samenvattingen te bewaren.
- `drop: "new"`: wijs het nieuwste bericht af wanneer de wachtrij al vol is.

Standaarden: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Voorrang

Voor modeselectie lost OpenClaw dit op:

1. Inline of opgeslagen per-sessie `/queue`-override.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Standaard `steer`.

Voor opties winnen inline of opgeslagen `/queue`-opties van configuratie. Daarna worden
kanaalspecifieke debounce (`messages.queue.debounceMsByChannel`), plugin-
debounce-standaarden, globale `messages.queue`-opties en ingebouwde standaarden
toegepast. `cap` en `drop` zijn globale/sessie-opties, geen configuratiesleutels
per kanaal.

## Per-sessie overrides

- Stuur `/queue <mode>` als zelfstandige opdracht om de modus voor de huidige sessie op te slaan.
- Opties kunnen worden gecombineerd: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` of `/queue reset` wist de sessie-override.

## Bereik en garanties

- Geldt voor auto-reply-agentruns op alle inkomende kanalen die de Gateway-antwoordpipeline gebruiken (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, enz.).
- Standaard-lane (`main`) is procesbreed voor inkomend verkeer + main-heartbeats; stel `agents.defaults.maxConcurrent` in om meerdere sessies parallel toe te staan.
- Er kunnen extra lanes bestaan (bijv. `cron`, `cron-nested`, `nested`, `subagent`) zodat achtergrondtaken parallel kunnen draaien zonder inkomende antwoorden te blokkeren. Geïsoleerde cron-agentbeurten houden een `cron`-slot vast terwijl hun interne agentuitvoering `cron-nested` gebruikt; beide gebruiken `cron.maxConcurrentRuns`. Gedeelde niet-cron `nested`-flows behouden hun eigen lane-gedrag. Deze losgekoppelde runs worden bijgehouden als [achtergrondtaken](/nl/automation/tasks).
- Per-sessie lanes garanderen dat slechts één agentrun tegelijk een bepaalde sessie raakt.
- Geen externe dependencies of background worker threads; pure TypeScript + promises.

## Probleemoplossing

- Als opdrachten vast lijken te zitten, schakel uitgebreide logs in en zoek naar regels met "queued for ...ms" om te bevestigen dat de wachtrij wordt verwerkt.
- Als je wachtrijdiepte nodig hebt, schakel uitgebreide logs in en let op wachtrijtimingregels.
- Codex app-server-runs die een turn accepteren en daarna stoppen met voortgang uitsturen, worden onderbroken door de Codex-adapter zodat de actieve sessielane kan vrijkomen in plaats van te wachten op de timeout van de buitenste run.
- Wanneer diagnostics zijn ingeschakeld, worden sessies die langer dan `diagnostics.stuckSessionWarnMs` in `processing` blijven zonder waargenomen antwoord, tool, status, block of ACP-voortgang geclassificeerd op basis van huidige activiteit. Actief werk logt als `session.long_running`; actief werk zonder recente voortgang logt als `session.stalled`; `session.stuck` is gereserveerd voor verouderde sessieboekhouding zonder actief werk, en alleen dat pad kan de betrokken sessielane vrijgeven zodat werk in de wachtrij wordt verwerkt. Herhaalde `session.stuck`-diagnostics nemen afstand zolang de sessie ongewijzigd blijft.

## Gerelateerd

- [Sessiebeheer](/nl/concepts/session)
- [Steering-wachtrij](/nl/concepts/queue-steering)
- [Steer](/nl/tools/steer)
- [Retrybeleid](/nl/concepts/retry)
