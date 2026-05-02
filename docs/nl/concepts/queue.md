---
read_when:
    - Uitvoering of gelijktijdigheid van automatische antwoorden wijzigen
    - Uitleg over /queue-modi of gedrag voor berichtsturing
summary: Wachtrijmodi, standaardwaarden en overschrijvingen per sessie voor automatische antwoorden
title: Opdrachtwachtrij
x-i18n:
    generated_at: "2026-05-02T11:14:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: c59ea6802d8bf526f4005db3b1baa87d96a23d561c916f91520e8e641fbaf74f
    source_path: concepts/queue.md
    workflow: 16
---

We serialiseren inkomende automatische-antwoordruns (alle kanalen) via een kleine wachtrij binnen het proces om te voorkomen dat meerdere agent-uitvoeringen botsen, terwijl veilige paralleliteit tussen sessies mogelijk blijft.

## Waarom

- Automatische-antwoordruns kunnen kostbaar zijn (LLM-aanroepen) en kunnen botsen wanneer meerdere inkomende berichten kort na elkaar binnenkomen.
- Serialiseren voorkomt concurrentie om gedeelde resources (sessiebestanden, logs, CLI stdin) en vermindert de kans op upstream-snelheidslimieten.

## Hoe het werkt

- Een lane-bewuste FIFO-wachtrij verwerkt elke lane met een configureerbare concurrency-limiet (standaard 1 voor niet-geconfigureerde lanes; main is standaard 4, subagent 8).
- `runEmbeddedPiAgent` plaatst in de wachtrij op **sessiesleutel** (lane `session:<key>`) om te garanderen dat er maar één actieve run per sessie is.
- Elke sessierun wordt daarna in een **globale lane** geplaatst (`main` standaard), zodat de totale paralleliteit wordt begrensd door `agents.defaults.maxConcurrent`.
- Wanneer uitgebreide logging is ingeschakeld, geven runs in de wachtrij een korte melding als ze meer dan ~2s hebben gewacht voordat ze startten.
- Typindicatoren worden nog steeds direct geactiveerd bij het plaatsen in de wachtrij (wanneer het kanaal dit ondersteunt), zodat de gebruikerservaring ongewijzigd blijft terwijl we op onze beurt wachten.

## Standaarden

Wanneer niet ingesteld, gebruiken alle inkomende kanaaloppervlakken:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` is de standaard omdat het de actieve modelbeurt responsief houdt zonder
een tweede sessierun te starten. Het verwerkt alle steering-berichten die zijn
aangekomen vóór de volgende modelgrens. Als de huidige run geen steering kan accepteren,
valt OpenClaw terug op een followup-item in de wachtrij.

## Wachtrijmodi

Inkomende berichten kunnen de huidige run sturen, wachten op een followup-beurt, of beide doen:

- `steer`: plaats steering-berichten in de wachtrij van de actieve runtime. Pi levert alle wachtende steering-berichten **nadat de huidige assistentbeurt klaar is met het uitvoeren van zijn toolaanroepen**, vóór de volgende LLM-aanroep; Codex app-server ontvangt één gebundelde `turn/steer`. Als de run niet actief streamt of steering niet beschikbaar is, valt OpenClaw terug op een followup-item in de wachtrij.
- `queue` (verouderd): oude één-voor-één steering. Pi levert één steering-bericht uit de wachtrij bij elke modelgrens; Codex app-server ontvangt afzonderlijke `turn/steer`-verzoeken. Geef de voorkeur aan `steer`, tenzij je het eerdere geserialiseerde gedrag nodig hebt.
- `followup`: plaats elk bericht in de wachtrij voor een latere agentbeurt nadat de huidige run eindigt.
- `collect`: voeg berichten in de wachtrij samen tot een **enkele** followup-beurt na het stiltevenster. Als berichten op verschillende kanalen/threads zijn gericht, worden ze afzonderlijk verwerkt om routing te behouden.
- `steer-backlog` (ook `steer+backlog`): stuur nu **en** bewaar hetzelfde bericht voor een followup-beurt.
- `interrupt` (verouderd): breek de actieve run voor die sessie af en voer daarna het nieuwste bericht uit.

Steer-backlog betekent dat je een followup-antwoord kunt krijgen na de gestuurde run, waardoor
streamingoppervlakken op duplicaten kunnen lijken. Geef de voorkeur aan `collect`/`steer` als je
één antwoord per inkomend bericht wilt.

Zie voor runtime-specifieke timing en dependency-gedrag
[Steering-wachtrij](/nl/concepts/queue-steering).

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

Opties gelden voor `followup`, `collect` en `steer-backlog` (en voor `steer` of verouderde `queue` wanneer steering terugvalt op followup):

- `debounceMs`: stiltevenster voordat followups in de wachtrij worden verwerkt. Losse getallen zijn milliseconden; eenheden `ms`, `s`, `m`, `h` en `d` worden geaccepteerd door `/queue`-opties.
- `cap`: maximaal aantal berichten in de wachtrij per sessie. Waarden onder `1` worden genegeerd.
- `drop: "summarize"`: standaard. Verwijder zo nodig de oudste items uit de wachtrij, bewaar compacte samenvattingen en injecteer ze als een synthetische followup-prompt.
- `drop: "old"`: verwijder zo nodig de oudste items uit de wachtrij, zonder samenvattingen te bewaren.
- `drop: "new"`: wijs het nieuwste bericht af wanneer de wachtrij al vol is.

Standaarden: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Prioriteit

Voor modeselectie lost OpenClaw dit op:

1. Inline of opgeslagen `/queue`-override per sessie.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Standaard `steer`.

Voor opties gaan inline of opgeslagen `/queue`-opties vóór configuratie. Daarna worden
kanaalspecifieke debounce (`messages.queue.debounceMsByChannel`), Plugin-standaardwaarden
voor debounce, globale `messages.queue`-opties en ingebouwde standaarden toegepast.
`cap` en `drop` zijn globale/sessieopties, geen configuratiesleutels per kanaal.

## Overrides per sessie

- Stuur `/queue <mode>` als zelfstandige opdracht om de modus voor de huidige sessie op te slaan.
- Opties kunnen worden gecombineerd: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` of `/queue reset` wist de sessie-override.

## Bereik en garanties

- Geldt voor automatische agent-antwoordruns over alle inkomende kanalen die de Gateway-antwoordpipeline gebruiken (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, enz.).
- De standaardlane (`main`) is procesbreed voor inkomend verkeer + main Heartbeats; stel `agents.defaults.maxConcurrent` in om meerdere sessies parallel toe te staan.
- Er kunnen aanvullende lanes bestaan (bijv. `cron`, `cron-nested`, `nested`, `subagent`), zodat achtergrondtaken parallel kunnen draaien zonder inkomende antwoorden te blokkeren. Geïsoleerde Cron-agentbeurten houden een `cron`-slot vast terwijl hun binnenste agent-uitvoering `cron-nested` gebruikt; beide gebruiken `cron.maxConcurrentRuns`. Gedeelde niet-Cron-`nested`-stromen behouden hun eigen lanegedrag. Deze losgekoppelde runs worden bijgehouden als [achtergrondtaken](/nl/automation/tasks).
- Lanes per sessie garanderen dat slechts één agent-run tegelijk een bepaalde sessie aanraakt.
- Geen externe dependencies of achtergrondworkerthreads; pure TypeScript + promises.

## Probleemoplossing

- Als opdrachten vast lijken te zitten, schakel uitgebreide logs in en zoek naar regels met “queued for …ms” om te bevestigen dat de wachtrij wordt verwerkt.
- Als je wachtrijdiepte nodig hebt, schakel uitgebreide logs in en let op wachtrijtimingregels.
- Codex app-server-runs die een beurt accepteren en daarna stoppen met voortgang uitsturen, worden door de Codex-adapter onderbroken zodat de actieve sessielane kan worden vrijgegeven in plaats van te wachten op de timeout van de buitenste run.
- Wanneer diagnostiek is ingeschakeld, worden sessies die langer dan `diagnostics.stuckSessionWarnMs` in `processing` blijven zonder waargenomen antwoord, tool, status, blok of ACP-voortgang, geclassificeerd op basis van huidige activiteit. Actief werk wordt gelogd als `session.long_running`; actief werk zonder recente voortgang wordt gelogd als `session.stalled`; `session.stuck` is gereserveerd voor verouderde sessieboekhouding zonder actief werk, en alleen dat pad kan de getroffen sessielane vrijgeven zodat werk in de wachtrij wordt verwerkt. Herhaalde `session.stuck`-diagnostiek bouwt af zolang de sessie ongewijzigd blijft.

## Verwant

- [Sessiebeheer](/nl/concepts/session)
- [Steering-wachtrij](/nl/concepts/queue-steering)
- [Retrybeleid](/nl/concepts/retry)
