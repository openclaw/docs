---
read_when:
    - Uitvoering of gelijktijdigheid van automatische antwoorden wijzigen
    - Uitleg over /queue-modi of gedrag voor berichtsturing
summary: Wachtrijmodi, standaardwaarden en overschrijvingen per sessie voor automatische antwoorden
title: Opdrachtwachtrij
x-i18n:
    generated_at: "2026-05-04T02:23:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 085aebe7059020f027eb08bb382cce2d253ea117eed0ca77d6ffd208f295acb1
    source_path: concepts/queue.md
    workflow: 16
---

We serialiseren inkomende auto-reply-runs (alle kanalen) via een kleine wachtrij binnen het proces om te voorkomen dat meerdere agent-runs botsen, terwijl veilige parallelliteit tussen sessies mogelijk blijft.

## Waarom

- Auto-reply-runs kunnen duur zijn (LLM-aanroepen) en kunnen botsen wanneer meerdere inkomende berichten kort na elkaar aankomen.
- Serialiseren voorkomt concurrentie om gedeelde resources (sessiebestanden, logs, CLI stdin) en verkleint de kans op upstream rate limits.

## Hoe het werkt

- Een lane-bewuste FIFO-wachtrij verwerkt elke lane met een configureerbare concurrency-limiet (standaard 1 voor niet-geconfigureerde lanes; main standaard 4, subagent 8).
- `runEmbeddedPiAgent` plaatst in de wachtrij op basis van **sessiesleutel** (lane `session:<key>`) om te garanderen dat er maar één actieve run per sessie is.
- Elke sessierun wordt daarna in een **globale lane** geplaatst (`main` standaard), zodat de totale parallelliteit wordt begrensd door `agents.defaults.maxConcurrent`.
- Wanneer uitgebreide logging is ingeschakeld, geven in de wachtrij geplaatste runs een korte melding als ze meer dan ongeveer 2s hebben gewacht voordat ze startten.
- Typing indicators worden nog steeds direct geactiveerd bij het plaatsen in de wachtrij (wanneer ondersteund door het kanaal), zodat de gebruikerservaring ongewijzigd blijft terwijl we op onze beurt wachten.

## Standaarden

Wanneer niet ingesteld, gebruiken alle inkomende kanaaloppervlakken:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` is de standaard omdat het de actieve modelbeurt responsief houdt zonder
een tweede sessierun te starten. Het verwerkt alle steering-berichten die zijn aangekomen
vóór de volgende modelgrens. Als de huidige run geen steering kan accepteren,
valt OpenClaw terug op een followup-wachtrij-item.

## Wachtrijmodi

Inkomende berichten kunnen de huidige run sturen, wachten op een followup-beurt, of beide doen:

- `steer`: plaats steering-berichten in de actieve runtime. Pi levert alle wachtende steering-berichten **nadat de huidige assistant-beurt klaar is met het uitvoeren van zijn tool-aanroepen**, vóór de volgende LLM-aanroep; Codex app-server ontvangt één gebatchte `turn/steer`. Als de run niet actief streamt of steering niet beschikbaar is, valt OpenClaw terug op een followup-wachtrij-item.
- `queue` (legacy): oude steering één voor één. Pi levert één in de wachtrij geplaatst steering-bericht bij elke modelgrens; Codex app-server ontvangt afzonderlijke `turn/steer`-verzoeken. Geef de voorkeur aan `steer`, tenzij je het vorige geserialiseerde gedrag nodig hebt.
- `followup`: plaats elk bericht in de wachtrij voor een latere agent-beurt nadat de huidige run eindigt.
- `collect`: voeg berichten in de wachtrij samen tot één **enkele** followup-beurt na het stiltevenster. Als berichten op verschillende kanalen/threads zijn gericht, worden ze afzonderlijk verwerkt om routering te behouden.
- `steer-backlog` (ook bekend als `steer+backlog`): stuur nu **en** bewaar hetzelfde bericht voor een followup-beurt.
- `interrupt` (legacy): breek de actieve run voor die sessie af en voer daarna het nieuwste bericht uit.

Steer-backlog betekent dat je na de gestuurde run een followup-antwoord kunt krijgen, waardoor
streaming-oppervlakken eruit kunnen zien als duplicaten. Geef de voorkeur aan `collect`/`steer` als je
één antwoord per inkomend bericht wilt.

Zie voor runtime-specifieke timing en afhankelijkheidsgedrag
[Steering-wachtrij](/nl/concepts/queue-steering). Zie voor de expliciete `/steer <message>`-
opdracht [Steer](/tools/steer).

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

Opties gelden voor `followup`, `collect` en `steer-backlog` (en voor `steer` of legacy `queue` wanneer steering terugvalt op followup):

- `debounceMs`: stiltevenster voordat followups in de wachtrij worden verwerkt. Losse getallen zijn milliseconden; eenheden `ms`, `s`, `m`, `h` en `d` worden geaccepteerd door `/queue`-opties.
- `cap`: maximaal aantal berichten in de wachtrij per sessie. Waarden onder `1` worden genegeerd.
- `drop: "summarize"`: standaard. Laat de oudste wachtrij-items vallen waar nodig, bewaar compacte samenvattingen en voeg ze in als een synthetische followup-prompt.
- `drop: "old"`: laat de oudste wachtrij-items vallen waar nodig, zonder samenvattingen te bewaren.
- `drop: "new"`: wijs het nieuwste bericht af wanneer de wachtrij al vol is.

Standaarden: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Voorrang

Voor modusselectie bepaalt OpenClaw:

1. Inline of opgeslagen per-sessie `/queue`-override.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Standaard `steer`.

Voor opties hebben inline of opgeslagen `/queue`-opties voorrang op configuratie. Daarna worden
kanaalspecifieke debounce (`messages.queue.debounceMsByChannel`), Plugin-
debounce-standaarden, globale `messages.queue`-opties en ingebouwde standaarden
toegepast. `cap` en `drop` zijn globale/sessie-opties, geen per-kanaal configuratie-
sleutels.

## Overrides per sessie

- Stuur `/queue <mode>` als zelfstandige opdracht om de modus voor de huidige sessie op te slaan.
- Opties kunnen worden gecombineerd: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` of `/queue reset` wist de sessie-override.

## Bereik en garanties

- Geldt voor auto-reply agent-runs over alle inkomende kanalen die de Gateway-reply-pipeline gebruiken (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, enzovoort).
- Standaard-lane (`main`) is procesbreed voor inkomend + hoofd-Heartbeats; stel `agents.defaults.maxConcurrent` in om meerdere sessies parallel toe te staan.
- Er kunnen aanvullende lanes bestaan (bijv. `cron`, `cron-nested`, `nested`, `subagent`), zodat achtergrondtaken parallel kunnen draaien zonder inkomende antwoorden te blokkeren. Geïsoleerde Cron-agent-beurten houden een `cron`-slot vast terwijl hun interne agent-uitvoering `cron-nested` gebruikt; beide gebruiken `cron.maxConcurrentRuns`. Gedeelde niet-Cron `nested`-flows behouden hun eigen lane-gedrag. Deze losgekoppelde runs worden gevolgd als [achtergrondtaken](/nl/automation/tasks).
- Per-sessie lanes garanderen dat slechts één agent-run tegelijk een bepaalde sessie aanraakt.
- Geen externe afhankelijkheden of achtergrond-workerthreads; pure TypeScript + promises.

## Probleemoplossing

- Als opdrachten vast lijken te zitten, schakel uitgebreide logs in en zoek naar regels met “queued for …ms” om te bevestigen dat de wachtrij wordt verwerkt.
- Als je wachtrijdiepte nodig hebt, schakel uitgebreide logs in en let op wachtrijtimingregels.
- Codex app-server-runs die een beurt accepteren en daarna stoppen met voortgang uitsturen, worden onderbroken door de Codex-adapter zodat de actieve sessie-lane kan vrijkomen in plaats van te wachten op de timeout van de buitenste run.
- Wanneer diagnostics zijn ingeschakeld, worden sessies die langer dan `diagnostics.stuckSessionWarnMs` in `processing` blijven zonder waargenomen antwoord-, tool-, status-, block- of ACP-voortgang geclassificeerd op basis van huidige activiteit. Actief werk logt als `session.long_running`; actief werk zonder recente voortgang logt als `session.stalled`; `session.stuck` is gereserveerd voor verouderde sessieboekhouding zonder actief werk, en alleen dat pad kan de getroffen sessie-lane vrijgeven zodat werk in de wachtrij wordt verwerkt. Herhaalde `session.stuck` diagnostics schalen terug zolang de sessie ongewijzigd blijft.

## Gerelateerd

- [Sessiebeheer](/nl/concepts/session)
- [Steering-wachtrij](/nl/concepts/queue-steering)
- [Steer](/tools/steer)
- [Retrybeleid](/nl/concepts/retry)
