---
read_when:
    - Je wilt geplande taken en wekmomenten
    - Je debugt de uitvoering en logboeken van Cron
summary: CLI-referentie voor `openclaw cron` (achtergrondtaken plannen en uitvoeren)
title: Cron
x-i18n:
    generated_at: "2026-07-12T08:42:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e16335b13f92229df0ba49c320e2714e39ab3e503e8e72f376ec2c5b0803cf7
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Beheer crontaken voor de Gateway-planner.

<Tip>
Voer `openclaw cron --help` uit voor het volledige commando-oppervlak. Zie [Crontaken](/nl/automation/cron-jobs) voor de conceptuele handleiding.
</Tip>

<Note>
Alle cronwijzigingen (`add`/`create`, `update`/`edit`, `remove`, `run`) vereisen `operator.admin`. Uitvoeringen met een commando-payload worden rechtstreeks in het Gateway-proces uitgevoerd, niet als een aanroep van de agenttool `tools.exec`; `tools.exec.*` en uitvoeringsgoedkeuringen blijven van toepassing op voor het model zichtbare uitvoeringstools.
</Note>

## Snel taken maken

`openclaw cron create` is een alias voor `openclaw cron add`. Plaats voor nieuwe taken eerst het schema en daarna de prompt:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

Gebruik `--webhook <url>` wanneer de taak de voltooide payload via POST moet verzenden in plaats van deze bij een chatdoel af te leveren:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

Gebruik `--command` voor deterministische shell-achtige taken die binnen OpenClaw cron worden uitgevoerd zonder een geïsoleerde agent-/modeluitvoering te starten:

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` slaat `argv: ["sh", "-lc", <shell>]` op. Gebruik `--command-argv '["node","scripts/report.mjs"]'` voor uitvoering met exacte argv. Commandotaken leggen stdout/stderr vast, registreren de normale crongeschiedenis en leiden uitvoer via dezelfde afleveringsmodi `announce`, `webhook` of `none` als geïsoleerde taken. Een commando dat uitsluitend `NO_REPLY` afdrukt, wordt onderdrukt.

## Sessies

`--session` accepteert `main`, `isolated`, `current` of `session:<id>`.

<AccordionGroup>
  <Accordion title="Sessiesleutels">
    - `main` koppelt aan de hoofdsessie van de agent.
    - `isolated` maakt voor elke uitvoering een nieuw transcript en een nieuwe sessie-id.
    - `current` koppelt aan de sessie die actief is op het moment van aanmaken.
    - `session:<id>` legt een expliciete permanente sessiesleutel vast.

  </Accordion>
  <Accordion title="Semantiek van geïsoleerde sessies">
    Geïsoleerde uitvoeringen wissen de omringende gesprekscontext. Kanaal- en groepsroutering, verzend-/wachtrijbeleid, bevoegdheidsverhoging, oorsprong en ACP-runtimebinding worden opnieuw ingesteld voor de nieuwe uitvoering. Veilige voorkeuren en expliciet door de gebruiker geselecteerde model- of authenticatieoverschrijvingen kunnen tussen uitvoeringen worden overgenomen.
  </Accordion>
</AccordionGroup>

## Aflevering

`openclaw cron list` en `openclaw cron show <job-id>` tonen een voorbeeld van de opgeloste afleveringsroute. Voor `channel: "last"` laat het voorbeeld zien of de route uit de hoofd- of huidige sessie is opgelost, of veilig zal mislukken.

Doelen met een providervoorvoegsel kunnen niet-opgeloste aankondigingskanalen ondubbelzinnig maken. `to: "telegram:123"` selecteert bijvoorbeeld Telegram wanneer `delivery.channel` is weggelaten of `last` is. Alleen voorvoegsels die door de geladen Plugin worden aangekondigd, zijn providerselectoren. Als `delivery.channel` expliciet is, moet het voorvoegsel met dat kanaal overeenkomen; `channel: "whatsapp"` met `to: "telegram:123"` wordt geweigerd. Servicevoorvoegsels zoals `imessage:` en `sms:` blijven doelsyntaxis die eigendom is van het kanaal.

<Note>
Geïsoleerde `cron add`-taken gebruiken standaard aflevering via `--announce`. Gebruik `--no-deliver` om uitvoer intern te houden. `--deliver` blijft beschikbaar als verouderde alias voor `--announce`.
</Note>

### Eigenaarschap van aflevering

De aflevering van geïsoleerde cronchats wordt gedeeld door de agent en de uitvoerder:

- De agent kan rechtstreeks verzenden met de tool `message` wanneer een chatroute beschikbaar is.
- `announce` levert het definitieve antwoord alleen als terugval af wanneer de agent niet rechtstreeks naar het opgeloste doel heeft verzonden.
- `webhook` plaatst de voltooide payload op een URL.
- `none` schakelt terugvalaflevering door de uitvoerder uit.

Gebruik `cron add|create --webhook <url>` of `cron edit <job-id> --webhook <url>` om Webhook-aflevering in te stellen. Combineer `--webhook` niet met vlaggen voor chataflevering, zoals `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` of `--account`.

`cron edit <job-id>` kan afzonderlijke routeringsvelden voor aflevering wissen met `--clear-channel`, `--clear-to`, `--clear-thread-id` en `--clear-account` (elk wordt geweigerd wanneer het wordt gecombineerd met de bijbehorende instelvlag). Anders dan `--no-deliver`, dat alleen terugvalaflevering door de uitvoerder uitschakelt, verwijderen deze het opgeslagen veld, zodat de taak dat deel van de route opnieuw aan de hand van standaardwaarden oplost.

`--announce` is terugvalaflevering door de uitvoerder voor het definitieve antwoord. `--no-deliver` schakelt die terugval uit, maar verwijdert de tool `message` van de agent niet wanneer een chatroute beschikbaar is.

Herinneringen die vanuit een actieve chat worden gemaakt, behouden het actuele afleveringsdoel van de chat voor terugvalaflevering via aankondiging. Interne sessiesleutels kunnen kleine letters bevatten; gebruik ze niet als gezaghebbende bron voor hoofdlettergevoelige provider-id's, zoals Matrix-ruimte-id's.

### Aflevering bij fouten

Foutmeldingen worden in deze volgorde opgelost:

1. `delivery.failureDestination` van de taak.
2. Globale `cron.failureDestination`.
3. Het primaire aankondigingsdoel van de taak (wanneer geen van de bovenstaande opties naar een concreet doel wordt opgelost).

<Note>
Taken in de hoofdsessie mogen `delivery.failureDestination` alleen gebruiken wanneer de primaire afleveringsmodus `webhook` is. Geïsoleerde taken accepteren dit in alle modi.
</Note>

Geïsoleerde cronuitvoeringen behandelen fouten van de agent op uitvoeringsniveau als taakfouten, zelfs wanneer er geen antwoordpayload wordt geproduceerd. Daardoor verhogen model-/providerfouten nog steeds de foutentellers en activeren ze foutmeldingen.

Croncommandotaken starten geen geïsoleerde agentbeurt. Een afsluitcode van nul registreert `ok`; een afsluitcode die niet nul is, een signaal, een time-out of een time-out wegens ontbrekende uitvoer registreert `error` en kan hetzelfde pad voor foutmeldingen activeren.

Als een geïsoleerde uitvoering een time-out bereikt vóór de eerste modelaanvraag, bevatten `openclaw cron show` en `openclaw cron runs` een fasespecifieke fout, zoals `setup timed out before runner start`, of een vastloopmelding die de laatst bekende opstartfase noemt (bijvoorbeeld `context-engine`). Voor providers die via de CLI werken, blijft de bewaking vóór het model actief totdat de externe CLI-beurt begint. Daardoor worden vastlopers bij het opzoeken van sessies, hooks, authenticatie, prompts en CLI-configuratie gerapporteerd als cronfouten vóór het model.

## Planning

### Eenmalige taken

`--at <datetime>` plant een eenmalige uitvoering. Datum/tijdwaarden zonder offset worden als UTC behandeld, tenzij u ook `--tz <iana>` meegeeft; daarmee wordt de kloktijd in de opgegeven tijdzone geïnterpreteerd.

<Note>
Eenmalige taken worden standaard na een geslaagde uitvoering verwijderd. Gebruik `--keep-after-run` om ze te behouden.
</Note>

### Terugkerende taken

Terugkerende taken gebruiken exponentiële terugvalvertraging na opeenvolgende fouten: 30 s, 1 min., 5 min., 15 min., 60 min. Na de volgende geslaagde uitvoering keert de planning terug naar normaal.

Overgeslagen uitvoeringen worden afzonderlijk van uitvoeringsfouten bijgehouden. Ze hebben geen invloed op de terugvalvertraging, maar met `openclaw cron edit <job-id> --failure-alert-include-skipped` kunnen foutwaarschuwingen ook worden geactiveerd bij herhaalde meldingen van overgeslagen uitvoeringen.

Voor geïsoleerde taken die zijn gericht op een lokaal geconfigureerde modelprovider (basis-URL op local loopback, een privénetwerk of `.local`), voert cron een lichte providercontrole vooraf uit voordat de agentbeurt wordt gestart: providers met `api: "ollama"` worden getest via `/api/tags`; andere lokale OpenAI-compatibele providers (`api: "openai-completions"`, bijvoorbeeld vLLM, SGLang en LM Studio) worden getest via `/models`. Als het eindpunt onbereikbaar is, wordt de uitvoering geregistreerd als `skipped` en bij een later gepland moment opnieuw geprobeerd. Het bereikbaarheidsresultaat wordt per eindpunt vijf minuten in de cache bewaard, zodat veel taken voor dezelfde lokale server deze niet bestoken met herhaalde controles.

Crontaken, wachtende runtimestatus en uitvoeringsgeschiedenis bevinden zich in de gedeelde SQLite-statusdatabase. Verouderde bestanden `jobs.json`, `<name>-state.json` en `runs/*.jsonl` worden één keer geïmporteerd en hernoemd met het achtervoegsel `.migrated`. Bewerk planningen na de import met `openclaw cron add|edit|remove` in plaats van JSON-bestanden te bewerken.

### Handmatige uitvoeringen

`openclaw cron run <job-id>` dwingt standaard een uitvoering af en keert terug zodra de handmatige uitvoering in de wachtrij staat. Geslaagde antwoorden bevatten `{ ok: true, enqueued: true, runId }`. Gebruik de geretourneerde `runId` om het latere resultaat te bekijken:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Voeg `--wait` toe wanneer een script moet blokkeren totdat precies die uitvoering in de wachtrij een eindstatus registreert:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Met `--wait` roept de CLI nog steeds eerst `cron.run` aan en vraagt daarna herhaaldelijk `cron.runs` op voor de geretourneerde `runId`. Het commando sluit alleen af met `0` wanneer de uitvoering eindigt met de status `ok`. Het sluit af met een andere waarde dan nul wanneer de uitvoering eindigt met `error` of `skipped`, wanneer het Gateway-antwoord geen `runId` bevat, of wanneer `--wait-timeout` verloopt (standaard `10m`, waarbij standaard elke `2s` wordt gecontroleerd). `--poll-interval` moet groter zijn dan nul.

<Note>
Gebruik `--due` wanneer u wilt dat het handmatige commando alleen wordt uitgevoerd als de taak momenteel aan de beurt is. Als `--due --wait` geen uitvoering in de wachtrij plaatst, retourneert het commando het normale antwoord voor niet-uitvoeren in plaats van herhaaldelijk te controleren.
</Note>

## Modellen

`cron add|edit --model <ref>` selecteert een toegestaan model voor de taak. `cron add|edit --fallbacks <list>` stelt terugvalmodellen per taak in, bijvoorbeeld `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; geef `--fallbacks ""` door voor een strikte uitvoering zonder terugvalmodellen. `cron edit <job-id> --clear-fallbacks` verwijdert de terugvaloverschrijving per taak. `cron edit <job-id> --clear-model` verwijdert de modeloverschrijving per taak, zodat de taak de normale prioriteitsvolgorde voor cronmodelselectie volgt (een opgeslagen overschrijving voor de cronsessie, indien aanwezig, anders het agent- of standaardmodel); dit kan niet worden gecombineerd met `--model`. `cron add|edit --thinking <level>` stelt een denkoverschrijving per taak in; `cron edit <job-id> --clear-thinking` verwijdert deze, zodat de taak de normale prioriteitsvolgorde voor crondenken volgt, en kan niet worden gecombineerd met `--thinking`.

<Warning>
Als het model niet is toegestaan of niet kan worden opgelost, laat cron de uitvoering mislukken met een expliciete validatiefout in plaats van terug te vallen op de agent- of standaardmodelselectie van de taak.
</Warning>

Cron `--model` is een **primair taakmodel**, geen `/model`-overschrijving voor de chatsessie. Dit betekent:

- Geconfigureerde terugvalmodellen blijven van toepassing wanneer het geselecteerde taakmodel mislukt.
- `fallbacks` in de payload per taak vervangt de geconfigureerde lijst met terugvalmodellen wanneer deze aanwezig is.
- Een lege lijst met terugvalmodellen per taak (`--fallbacks ""` of `fallbacks: []` in de taakpayload/API) maakt de cronuitvoering strikt.
- Wanneer een taak `--model` heeft maar geen lijst met terugvalmodellen is geconfigureerd, geeft OpenClaw een expliciete lege terugvaloverschrijving door, zodat het primaire agentmodel niet als verborgen doel voor een nieuwe poging wordt toegevoegd.
- Voorafgaande controles van lokale providers doorlopen de geconfigureerde terugvalmodellen voordat een cronuitvoering als `skipped` wordt gemarkeerd.

`openclaw doctor` rapporteert taken waarvoor `payload.model` al is ingesteld, inclusief aantallen per providernaamruimte en afwijkingen ten opzichte van `agents.defaults.model`. Gebruik die controle wanneer het gedrag rond authenticatie, providers of facturering verschilt tussen livechat en geplande taken.

### Prioriteitsvolgorde voor modellen bij geïsoleerde cronuitvoeringen

Geïsoleerde cronuitvoeringen bepalen het actieve model in deze volgorde:

1. Overschrijving door een Gmail-hook.
2. `--model` per taak.
3. Opgeslagen modeloverschrijving voor de cronsessie (wanneer de gebruiker er een heeft geselecteerd).
4. Agent- of standaardmodelselectie.

### Snelle modus

De snelle modus van geïsoleerde cronuitvoeringen volgt de opgeloste selectie van het livemodel. De modelconfiguratie `params.fastMode` wordt standaard toegepast, maar een opgeslagen sessieoverschrijving voor `fastMode` heeft nog steeds voorrang op de configuratie. Wanneer de opgeloste modus `auto` is, gebruikt de grenswaarde de waarde `params.fastAutoOnSeconds` van het geselecteerde model, met standaard 60 seconden.

### Nieuwe pogingen na live modelwisselingen

Als een geïsoleerde uitvoering `LiveSessionModelSwitchError` genereert, slaat cron de gewisselde provider en het gewisselde model (en, indien aanwezig, de gewisselde overschrijving van het authenticatieprofiel) voor de actieve uitvoering op voordat opnieuw wordt geprobeerd. De buitenste lus voor nieuwe pogingen is begrensd op twee pogingen na een wisseling boven op de eerste poging en wordt daarna afgebroken in plaats van eindeloos door te lopen.

## Uitvoeringsuitvoer en weigeringen

### Onderdrukking van verouderde bevestigingen

Geïsoleerde cronbeurten onderdrukken verouderde antwoorden die alleen een bevestiging bevatten. Als het eerste resultaat slechts een tussentijdse statusupdate is en geen uitvoering van een onderliggende subagent verantwoordelijk is voor het uiteindelijke antwoord, vraagt cron één keer opnieuw om het werkelijke resultaat vóór aflevering.

### Onderdrukking van stille tokens

Als een geïsoleerde Cron-uitvoering alleen het stille token (`NO_REPLY` of `no_reply`) retourneert, onderdrukt Cron zowel directe uitgaande bezorging als het terugvalpad voor de samenvatting in de wachtrij, zodat er niets naar de chat wordt teruggestuurd.

### Gestructureerde weigeringen

Geïsoleerde Cron-uitvoeringen gebruiken gestructureerde metadata voor uitvoeringsweigering uit de ingesloten uitvoering (fatale fouten van het uitvoeringstool met code `SYSTEM_RUN_DENIED` of `INVALID_REQUEST`) als het gezaghebbende weigeringssignaal. Ze respecteren ook `UNAVAILABLE`-wrappers van de Node-host rond een geneste gestructureerde fout met een van deze codes.

Cron classificeert proza in de uiteindelijke uitvoer of op goedkeuring lijkende weigeringszinnen niet als weigeringen, tenzij de ingesloten uitvoering ook gestructureerde weigeringsmetadata levert. Gewone assistenttekst wordt dus niet behandeld als een geblokkeerde opdracht.

`cron list` en de uitvoeringsgeschiedenis tonen de reden van de weigering in plaats van een geblokkeerde opdracht als `ok` te rapporteren.

## Bewaring

Bewaring en opschoning worden geregeld in de configuratie:

- `cron.sessionRetention` (standaard `24h`, of `false` om uit te schakelen) ruimt voltooide geïsoleerde uitvoeringssessies op.
- `cron.runLog.keepLines` (standaard `2000`) ruimt per taak bewaarde SQLite-rijen uit de uitvoeringsgeschiedenis op. `cron.runLog.maxBytes` (standaard `2000000`) blijft geaccepteerd voor compatibiliteit met oudere, op bestanden gebaseerde uitvoeringslogboeken; SQLite-opschoning is gebaseerd op het aantal rijen.

## Oudere taken migreren

<Note>
Als u Cron-taken hebt van vóór de huidige bezorgings- en opslagindeling, voert u `openclaw doctor --fix` uit. Doctor normaliseert verouderde Cron-velden (`jobId`, `schedule.cron`, bezorgingsvelden op het hoogste niveau, waaronder het verouderde `threadId`, en bezorgingsaliassen voor `provider` in de payload) en migreert Webhook-terugvaltaken met `notify: true` van `cron.webhook` naar expliciete Webhook-bezorging. Taken die al een aankondiging naar een chat sturen, behouden die bezorging en krijgen een Webhook-bestemming voor voltooiing. Wanneer `cron.webhook` niet is ingesteld, wordt de inactieve `notify`-markering op het hoogste niveau verwijderd voor taken zonder migratiedoel (de bestaande bezorging blijft ongewijzigd behouden), zodat `doctor --fix` er niet langer herhaaldelijk voor waarschuwt.
</Note>

## Veelvoorkomende bewerkingen

Werk bezorgingsinstellingen bij zonder het bericht te wijzigen:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Schakel bezorging voor een geïsoleerde taak uit:

```bash
openclaw cron edit <job-id> --no-deliver
```

Schakel lichtgewicht bootstrapcontext in voor een geïsoleerde taak:

```bash
openclaw cron edit <job-id> --light-context
```

Kondig aan in een specifiek kanaal:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Kondig aan in een Telegram-forumonderwerp:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Maak een geïsoleerde taak met lichtgewicht bootstrapcontext:

```bash
openclaw cron create "0 7 * * *" \
  "Vat nachtelijke updates samen." \
  --name "Lichtgewicht ochtendoverzicht" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` is alleen van toepassing op geïsoleerde taken voor agentbeurten. Voor Cron-uitvoeringen houdt de lichtgewichtmodus de bootstrapcontext leeg in plaats van de volledige set voor werkruimte-bootstrap te injecteren.

Maak een opdrachttaak met exacte argv, cwd, env, stdin en uitvoerlimieten:

```bash
openclaw cron create "*/30 * * * *" \
  --name "Positie-export" \
  --command-argv '["node","scripts/export-position.mjs"]' \
  --command-cwd "/srv/app" \
  --command-env "NODE_ENV=production" \
  --command-input '{"mode":"summary"}' \
  --timeout-seconds 120 \
  --no-output-timeout-seconds 30 \
  --output-max-bytes 65536 \
  --webhook "https://example.invalid/openclaw/cron"
```

## Veelvoorkomende beheeropdrachten

Handmatige uitvoering en inspectie:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron get <job-id>
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron run <job-id> --wait --wait-timeout 10m
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
openclaw cron runs --id <job-id> --limit 50
openclaw cron runs --id <job-id> --run-id <run-id>
```

`openclaw cron list` toont standaard alle overeenkomende taken. Geef `--agent <id>` door om alleen taken te tonen waarvan de effectieve genormaliseerde agent-id overeenkomt; taken zonder opgeslagen agent-id tellen als de geconfigureerde standaardagent.

`openclaw cron get <job-id>` retourneert rechtstreeks de opgeslagen JSON van de taak. Gebruik `cron show <job-id>` wanneer u de voor mensen leesbare weergave met een voorbeeld van de bezorgingsroute wilt.

`cron list --json` en `cron show <job-id> --json` bevatten voor elke taak een `status`-veld op het hoogste niveau, berekend op basis van `enabled`, `state.runningAtMs` en `state.lastRunStatus`. Waarden: `disabled`, `running`, `ok`, `error`, `skipped` of `idle`. De JSON-status blijft canoniek en onversierd, zodat externe hulpmiddelen de taakstatus kunnen lezen zonder deze opnieuw af te leiden; voor mensen leesbare uitvoer kan herhaalde `error`-statussen voorzien van een aantal mislukkingen.

Vermeldingen van `cron runs` bevatten bezorgingsdiagnostiek met het beoogde Cron-doel, het herleide doel, verzendingen via het berichtentool, het gebruik van een terugvaloptie en de bezorgingsstatus.

Agent en sessie opnieuw toewijzen:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` waarschuwt wanneer `--agent` wordt weggelaten bij taken voor agentbeurten en valt terug op de standaardagent (`main`). Geef bij het maken `--agent <id>` door om een specifieke agent vast te leggen.

Bezorging aanpassen:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --webhook "https://example.invalid/openclaw/cron"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Geplande taken](/nl/automation/cron-jobs)
