---
read_when:
    - De uitvoering of gelijktijdigheid van automatische antwoorden wijzigen
    - Uitleg over /queue-modi of berichtsturingsgedrag
summary: Wachtrijmodi voor automatische antwoorden, standaardwaarden en overschrijvingen per sessie
title: Opdrachtenwachtrij
x-i18n:
    generated_at: "2026-04-30T18:38:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbf1bb1ffd4ce06fa138f63e31651b8821226d9c95dd6b93d68326a5fb91fdd0
    source_path: concepts/queue.md
    workflow: 16
---

We serialiseren inkomende auto-reply-uitvoeringen (alle kanalen) via een kleine in-process wachtrij om te voorkomen dat meerdere agentuitvoeringen botsen, terwijl veilige parallelliteit tussen sessies mogelijk blijft.

## Waarom

- Auto-reply-uitvoeringen kunnen duur zijn (LLM-aanroepen) en kunnen botsen wanneer meerdere inkomende berichten kort na elkaar binnenkomen.
- Serialiseren voorkomt concurrentie om gedeelde resources (sessiebestanden, logs, CLI stdin) en vermindert de kans op upstream-rate limits.

## Hoe het werkt

- Een lane-bewuste FIFO-wachtrij verwerkt elke lane met een configureerbare concurrency-limiet (standaard 1 voor niet-geconfigureerde lanes; main standaard 4, subagent 8).
- `runEmbeddedPiAgent` plaatst in de wachtrij op basis van **sessiesleutel** (lane `session:<key>`) om te garanderen dat er slechts één actieve uitvoering per sessie is.
- Elke sessie-uitvoering wordt daarna in een **globale lane** geplaatst (`main` standaard), zodat de totale parallelliteit wordt begrensd door `agents.defaults.maxConcurrent`.
- Wanneer verbose logging is ingeschakeld, geven uitvoeringen in de wachtrij een korte melding als ze meer dan ~2 s hebben gewacht voordat ze startten.
- Typing indicators starten nog steeds direct bij het plaatsen in de wachtrij (wanneer ondersteund door het kanaal), zodat de gebruikerservaring ongewijzigd blijft terwijl we op onze beurt wachten.

## Standaarden

Wanneer niet ingesteld, gebruiken alle inkomende kanaaloppervlakken:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` is de standaard omdat het de actieve modelbeurt responsief houdt zonder
een tweede sessie-uitvoering te starten. Het verwerkt alle stuurberichten die zijn aangekomen
vóór de volgende modelgrens. Als de huidige uitvoering geen sturing kan accepteren,
valt OpenClaw terug op een followup-wachtrijitem.

## Wachtrijmodi

Inkomende berichten kunnen de huidige uitvoering sturen, wachten op een followup-beurt, of beide doen:

- `steer`: plaats stuurberichten in de actieve runtime. Pi levert alle wachtende stuurberichten **nadat de huidige assistentbeurt klaar is met het uitvoeren van de toolaanroepen**, vóór de volgende LLM-aanroep; Codex app-server ontvangt één gebatchte `turn/steer`. Als de uitvoering niet actief streamt of sturing niet beschikbaar is, valt OpenClaw terug op een followup-wachtrijitem.
- `queue` (legacy): oude één-voor-één-sturing. Pi levert één stuurbericht uit de wachtrij bij elke modelgrens; Codex app-server ontvangt afzonderlijke `turn/steer`-requests. Geef de voorkeur aan `steer`, tenzij je het vorige geserialiseerde gedrag nodig hebt.
- `followup`: plaats elk bericht in de wachtrij voor een latere agentbeurt nadat de huidige uitvoering eindigt.
- `collect`: voeg berichten in de wachtrij samen tot een **enkele** followup-beurt na het stille venster. Als berichten op verschillende kanalen/threads zijn gericht, worden ze afzonderlijk verwerkt om routing te behouden.
- `steer-backlog` (ook bekend als `steer+backlog`): stuur nu **en** bewaar hetzelfde bericht voor een followup-beurt.
- `interrupt` (legacy): breek de actieve uitvoering voor die sessie af en voer daarna het nieuwste bericht uit.

Steer-backlog betekent dat je een followup-reactie kunt krijgen na de gestuurde uitvoering, waardoor
streaming-oppervlakken op duplicaten kunnen lijken. Geef de voorkeur aan `collect`/`steer` als je
één reactie per inkomend bericht wilt.

Zie voor runtimespecifieke timing en afhankelijkheidsgedrag
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

Opties zijn van toepassing op `followup`, `collect` en `steer-backlog` (en op `steer` of legacy `queue` wanneer sturing terugvalt op followup):

- `debounceMs`: stil venster voordat followups in de wachtrij worden verwerkt. Kale getallen zijn milliseconden; eenheden `ms`, `s`, `m`, `h` en `d` worden geaccepteerd door `/queue`-opties.
- `cap`: maximaal aantal berichten in de wachtrij per sessie. Waarden onder `1` worden genegeerd.
- `drop: "summarize"`: standaard. Verwijder de oudste items in de wachtrij waar nodig, bewaar compacte samenvattingen en injecteer ze als een synthetische followup-prompt.
- `drop: "old"`: verwijder de oudste items in de wachtrij waar nodig, zonder samenvattingen te bewaren.
- `drop: "new"`: weiger het nieuwste bericht wanneer de wachtrij al vol is.

Standaarden: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Voorrang

Voor modusselectie lost OpenClaw dit op:

1. Inline of opgeslagen per-sessie `/queue`-override.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Standaard `steer`.

Voor opties hebben inline of opgeslagen `/queue`-opties voorrang op configuratie. Daarna worden
kanaalspecifieke debounce (`messages.queue.debounceMsByChannel`), Plugin
debounce-standaarden, globale `messages.queue`-opties en ingebouwde standaarden
toegepast. `cap` en `drop` zijn globale/sessieopties, geen configuratiesleutels per kanaal.

## Per-sessie overrides

- Stuur `/queue <mode>` als zelfstandige opdracht om de modus voor de huidige sessie op te slaan.
- Opties kunnen worden gecombineerd: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` of `/queue reset` wist de sessie-override.

## Bereik en garanties

- Van toepassing op auto-reply-agentuitvoeringen over alle inkomende kanalen die de Gateway-antwoordpipeline gebruiken (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, enz.).
- Standaardlane (`main`) is process-wide voor inkomend + main Heartbeats; stel `agents.defaults.maxConcurrent` in om meerdere sessies parallel toe te staan.
- Er kunnen aanvullende lanes bestaan (bijv. `cron`, `cron-nested`, `nested`, `subagent`), zodat achtergrondtaken parallel kunnen draaien zonder inkomende antwoorden te blokkeren. Geïsoleerde Cron-agentbeurten houden een `cron`-slot vast terwijl hun innerlijke agentuitvoering `cron-nested` gebruikt; beide gebruiken `cron.maxConcurrentRuns`. Gedeelde niet-Cron `nested`-flows behouden hun eigen lane-gedrag. Deze losgekoppelde uitvoeringen worden bijgehouden als [achtergrondtaken](/nl/automation/tasks).
- Per-sessie lanes garanderen dat slechts één agentuitvoering tegelijk een bepaalde sessie aanraakt.
- Geen externe afhankelijkheden of workerthreads op de achtergrond; pure TypeScript + promises.

## Probleemoplossing

- Als opdrachten vast lijken te zitten, schakel verbose logs in en zoek naar regels “queued for …ms” om te bevestigen dat de wachtrij wordt verwerkt.
- Als je wachtrijdiepte nodig hebt, schakel verbose logs in en let op wachtrijtimingregels.
- Codex app-server-uitvoeringen die een beurt accepteren en daarna stoppen met voortgang uitsturen, worden onderbroken door de Codex-adapter zodat de actieve sessielane kan vrijkomen in plaats van te wachten op de timeout van de buitenste uitvoering.
- Wanneer diagnostics zijn ingeschakeld, loggen sessies die langer dan `diagnostics.stuckSessionWarnMs` in `processing` blijven een waarschuwing voor een vastgelopen sessie. Actieve embedded uitvoeringen, actieve antwoordbewerkingen en actieve lanetaken blijven standaard alleen waarschuwingen; verouderde startup-boekhouding zonder actief sessiewerk kan de getroffen sessielane vrijgeven zodat werk in de wachtrij wordt verwerkt.

## Gerelateerd

- [Sessiebeheer](/nl/concepts/session)
- [Sturingswachtrij](/nl/concepts/queue-steering)
- [Retrybeleid](/nl/concepts/retry)
