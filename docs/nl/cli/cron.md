---
read_when:
    - Je wilt geplande taken en wekmomenten
    - Je debugt de uitvoering en logboeken van Cron
summary: CLI-referentie voor `openclaw cron` (achtergrondtaken plannen en uitvoeren)
title: Cron
x-i18n:
    generated_at: "2026-07-16T15:19:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: eb897fde0798563144703cd2f3a2bc6c20229aa4135af9c6db41995e66ffd2d1
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Beheer Cron-taken voor de Gateway-planner.

<Tip>
Voer `openclaw cron --help` uit voor alle beschikbare opdrachten. Zie [Cron-taken](/nl/automation/cron-jobs) voor de conceptuele handleiding.
</Tip>

<Note>
Voor alle Cron-wijzigingen (`add`/`create`, `update`/`edit`, `remove`, `run`) is `operator.admin` vereist. Uitvoeringen met een opdrachtpayload worden rechtstreeks in het Gateway-proces uitgevoerd, niet als een `tools.exec`-toolaanroep van een agent; `tools.exec.*` en uitvoeringsgoedkeuringen blijven van toepassing op uitvoeringstools die zichtbaar zijn voor het model.
</Note>

## Snel taken maken

`openclaw cron create` is een alias voor `openclaw cron add`. Plaats voor nieuwe taken eerst het schema en daarna de prompt:

```bash
openclaw cron create "0 7 * * *" \
  "Vat de updates van de afgelopen nacht samen." \
  --name "Ochtendoverzicht" \
  --agent ops
```

Gebruik `--webhook <url>` wanneer de taak de voltooide payload via POST moet verzenden in plaats van deze bij een chatdoel af te leveren:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Vat de implementaties van vandaag samen als JSON." \
  --name "Implementatieoverzicht" \
  --webhook "https://example.invalid/openclaw/cron"
```

Gebruik `--command` voor deterministische shellachtige taken die binnen OpenClaw Cron worden uitgevoerd zonder een geïsoleerde agent-/modeluitvoering te starten:

```bash
openclaw cron create "*/15 * * * *" \
  --name "Wachtrijdieptemeting" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` slaat `argv: ["sh", "-lc", <shell>]` op. Gebruik `--command-argv '["node","scripts/report.mjs"]'` voor exacte argv-uitvoering. Opdrachttaken leggen stdout/stderr vast, registreren de normale Cron-geschiedenis en routeren uitvoer via dezelfde afleveringsmodi `announce`, `webhook` of `none` als geïsoleerde taken. Een opdracht die alleen `NO_REPLY` afdrukt, wordt onderdrukt.

## Sessies

`--session` accepteert `main`, `isolated`, `current` of `session:<id>`.

<AccordionGroup>
  <Accordion title="Sessiesleutels">
    - `main` wordt gekoppeld aan de hoofdsessie van de agent.
    - `isolated` maakt voor elke uitvoering een nieuw transcript en een nieuwe sessie-id.
    - `current` wordt gekoppeld aan de actieve sessie op het moment van aanmaken.
    - `session:<id>` wordt vastgezet op een expliciete persistente sessiesleutel.

  </Accordion>
  <Accordion title="Semantiek van geïsoleerde sessies">
    Geïsoleerde uitvoeringen stellen de omgevingscontext van het gesprek opnieuw in. Kanaal- en groepsroutering, verzend-/wachtrijbeleid, verhoging, oorsprong en ACP-runtimekoppeling worden voor de nieuwe uitvoering opnieuw ingesteld. Veilige voorkeuren en expliciet door de gebruiker geselecteerde model- of authenticatieoverschrijvingen kunnen tussen uitvoeringen worden overgenomen.
  </Accordion>
</AccordionGroup>

## Aflevering

`openclaw cron list` en `openclaw cron show <job-id>` tonen een voorbeeld van de bepaalde afleveringsroute. Voor `channel: "last"` laat het voorbeeld zien of de route uit de hoofd- of huidige sessie is bepaald, of gesloten zal mislukken.

Doelen met een providervoorvoegsel kunnen niet-bepaalde aankondigingskanalen ondubbelzinnig maken. `to: "telegram:123"` selecteert bijvoorbeeld Telegram wanneer `delivery.channel` is weggelaten of `last` is. Alleen voorvoegsels die door de geladen Plugin worden geadverteerd, zijn providerselectoren. Als `delivery.channel` expliciet is, moet het voorvoegsel met dat kanaal overeenkomen; `channel: "whatsapp"` met `to: "telegram:123"` wordt geweigerd. Servicevoorvoegsels zoals `imessage:` en `sms:` blijven doelsyntaxis die eigendom is van het kanaal.

<Note>
Geïsoleerde `cron add`-taken gebruiken standaard aflevering via `--announce`. Gebruik `--no-deliver` om uitvoer intern te houden. `--deliver` blijft beschikbaar als verouderde alias voor `--announce`.
</Note>

### Eigendom van aflevering

De aflevering van geïsoleerde Cron-chatberichten wordt gedeeld tussen de agent en de runner:

- De agent kan rechtstreeks verzenden met de tool `message` wanneer een chatroute beschikbaar is.
- `announce` levert het definitieve antwoord alleen als terugval af wanneer de agent niet rechtstreeks naar het bepaalde doel heeft verzonden.
- `webhook` plaatst de voltooide payload op een URL.
- `none` schakelt terugvalaflevering door de runner uit.

Gebruik `cron add|create --webhook <url>` of `cron edit <job-id> --webhook <url>` om Webhook-aflevering in te stellen. Combineer `--webhook` niet met vlaggen voor chataflevering, zoals `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` of `--account`.

`cron edit <job-id>` kan afzonderlijke routeringsvelden voor aflevering uitschakelen met `--clear-channel`, `--clear-to`, `--clear-thread-id` en `--clear-account` (elk wordt geweigerd wanneer het met de bijbehorende instelvlag wordt gecombineerd). Anders dan `--no-deliver`, dat alleen terugvalaflevering door de runner uitschakelt, verwijderen deze het opgeslagen veld, zodat de taak dat deel van de route weer aan de hand van standaardwaarden bepaalt.

`--announce` is terugvalaflevering door de runner voor het definitieve antwoord. `--no-deliver` schakelt die terugval uit, maar verwijdert de tool `message` van de agent niet wanneer een chatroute beschikbaar is.

Herinneringen die vanuit een actieve chat worden gemaakt, behouden het actieve chatafleveringsdoel voor terugvalaankondigingen. Interne sessiesleutels kunnen kleine letters bevatten; gebruik ze niet als gezaghebbende bron voor hoofdlettergevoelige provider-id's, zoals Matrix-ruimte-id's.

### Aflevering bij fouten

Foutmeldingen worden in deze volgorde bepaald:

1. `delivery.failureDestination` voor de taak.
2. Globale `cron.failureDestination`.
3. Het primaire aankondigingsdoel van de taak (wanneer geen van de bovenstaande opties een concrete bestemming oplevert).

<Note>
Taken in de hoofdsessie mogen `delivery.failureDestination` alleen gebruiken wanneer de primaire afleveringsmodus `webhook` is. Geïsoleerde taken accepteren dit in alle modi.
</Note>

Geïsoleerde Cron-uitvoeringen behandelen fouten van de agent op uitvoeringsniveau als taakfouten, zelfs wanneer geen antwoordpayload wordt geproduceerd. Daardoor verhogen model-/providerfouten nog steeds de fouttellers en activeren ze foutmeldingen.

Cron-opdrachttaken starten geen geïsoleerde agentbeurt. Een afsluitcode van nul registreert `ok`; een afsluitcode anders dan nul, een signaal, een time-out of een time-out zonder uitvoer registreert `error` en kan hetzelfde pad voor foutmeldingen activeren.

Als een geïsoleerde uitvoering vóór het eerste modelverzoek een time-out bereikt, bevatten `openclaw cron show` en `openclaw cron runs` een fasespecifieke fout, zoals `setup timed out before runner start`, of een vastloopbericht waarin de laatst bekende opstartfase wordt genoemd (bijvoorbeeld `context-engine`). Voor providers met een CLI-backend blijft de bewaking vóór het model actief totdat de externe CLI-beurt begint. Daardoor worden vastlopers bij het opzoeken van sessies, hooks, authenticatie, prompts en CLI-configuratie gemeld als Cron-fouten vóór het model.

## Planning

### Eenmalige taken

`--at <datetime>` plant een eenmalige uitvoering. Datum-/tijdwaarden zonder offset worden als UTC behandeld, tenzij je ook `--tz <iana>` opgeeft; daarmee wordt de kloktijd in de opgegeven tijdzone geïnterpreteerd.

<Note>
Eenmalige taken worden na een geslaagde uitvoering standaard verwijderd. Gebruik `--keep-after-run` om ze te behouden.
</Note>

### Terugkerende taken

Terugkerende taken gebruiken na opeenvolgende fouten exponentiële terugval voor nieuwe pogingen: 30s, 1m, 5m, 15m, 60m. Na de volgende geslaagde uitvoering wordt het normale schema hervat.

Overgeslagen uitvoeringen worden afzonderlijk van uitvoeringsfouten bijgehouden. Ze hebben geen invloed op de terugval voor nieuwe pogingen, maar met `openclaw cron edit <job-id> --failure-alert-include-skipped` kunnen foutwaarschuwingen ook bij herhaalde overgeslagen uitvoeringen worden verzonden.

Voor geïsoleerde taken die zijn gericht op een lokaal geconfigureerde modelprovider (basis-URL op loopback, een particulier netwerk of `.local`), voert Cron een lichte providercontrole uit voordat de agentbeurt wordt gestart: `api: "ollama"`-providers worden getest via `/api/tags`; andere lokale OpenAI-compatibele providers (`api: "openai-completions"`, bijvoorbeeld vLLM, SGLang en LM Studio) worden getest via `/models`. Als het eindpunt onbereikbaar is, wordt de uitvoering geregistreerd als `skipped` en bij een later gepland moment opnieuw geprobeerd. Het bereikbaarheidsresultaat wordt per eindpunt 5 minuten in de cache bewaard, zodat veel taken voor dezelfde lokale server deze niet met herhaalde controles overbelasten.

Cron-taken, wachtende runtimestatus en uitvoeringsgeschiedenis bevinden zich in de gedeelde SQLite-statusdatabase. Verouderde bestanden `jobs.json`, `<name>-state.json` en `runs/*.jsonl` worden eenmaal geïmporteerd en hernoemd met het achtervoegsel `.migrated`. Bewerk schema's na de import met `openclaw cron add|edit|remove` in plaats van JSON-bestanden te bewerken.

### Handmatige uitvoeringen

`openclaw cron run <job-id>` dwingt de uitvoering standaard af en keert terug zodra de handmatige uitvoering in de wachtrij staat. Geslaagde antwoorden bevatten `{ ok: true, enqueued: true, runId }`. Gebruik de geretourneerde `runId` om het latere resultaat te bekijken:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Voeg `--wait` toe wanneer een script moet blokkeren totdat precies die uitvoering in de wachtrij een eindstatus registreert:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Met `--wait` roept de CLI nog steeds eerst `cron.run` aan en ondervraagt daarna `cron.runs` voor de geretourneerde `runId`. De opdracht wordt alleen afgesloten met `0` wanneer de uitvoering eindigt met de status `ok`. De opdracht wordt afgesloten met een niet-nulstatus wanneer de uitvoering eindigt met `error` of `skipped`, wanneer het antwoord van de Gateway geen `runId` bevat of wanneer `--wait-timeout` verloopt (standaard `10m`, waarbij standaard elke `2s` wordt gecontroleerd). `--poll-interval` moet groter zijn dan nul.

<Note>
Gebruik `--due` wanneer de handmatige opdracht alleen moet worden uitgevoerd als de taak momenteel aan de beurt is. Als `--due --wait` geen uitvoering in de wachtrij plaatst, retourneert de opdracht het normale antwoord voor niet-uitvoering in plaats van te controleren.
</Note>

## Modellen

`cron add|edit --model <ref>` selecteert een toegestaan model voor de taak. `cron add|edit --fallbacks <list>` stelt terugvalmodellen per taak in, bijvoorbeeld `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; geef `--fallbacks ""` op voor een strikte uitvoering zonder terugvalmodellen. `cron edit <job-id> --clear-fallbacks` verwijdert de overschrijving van terugvalmodellen per taak. `cron edit <job-id> --clear-model` verwijdert de modeloverschrijving per taak, zodat de taak de normale selectieprioriteit voor Cron-modellen volgt (een opgeslagen overschrijving voor de Cron-sessie indien aanwezig, anders het agent-/standaardmodel); deze optie kan niet worden gecombineerd met `--model`. `cron add|edit --thinking <level>` stelt een denkoverschrijving per taak in; `cron edit <job-id> --clear-thinking` verwijdert deze, zodat de taak de normale prioriteit voor Cron-denken volgt, en kan niet worden gecombineerd met `--thinking`.

<Warning>
Als het model niet is toegestaan of niet kan worden gevonden, laat Cron de uitvoering mislukken met een expliciete validatiefout in plaats van terug te vallen op de agent- of standaardmodelselectie van de taak.
</Warning>

Cron `--model` is een **primair taakmodel**, geen `/model`-overschrijving voor een chatsessie. Dit betekent:

- Geconfigureerde terugvalmodellen blijven van toepassing wanneer het geselecteerde taakmodel mislukt.
- `fallbacks` in de payload per taak vervangt de geconfigureerde lijst met terugvalmodellen wanneer deze aanwezig is.
- Een lege lijst met terugvalmodellen per taak (`--fallbacks ""` of `fallbacks: []` in de taakpayload/API) maakt de Cron-uitvoering strikt.
- Wanneer een taak `--model` heeft maar geen lijst met terugvalmodellen is geconfigureerd, geeft OpenClaw een expliciete lege terugvaloverschrijving door, zodat het primaire agentmodel niet als verborgen doel voor een nieuwe poging wordt toegevoegd.
- Providercontroles voor lokale providers doorlopen de geconfigureerde terugvalmodellen voordat een Cron-uitvoering als `skipped` wordt gemarkeerd.

`openclaw doctor` rapporteert taken waarvoor `payload.model` al is ingesteld, inclusief aantallen per providernamespace en afwijkingen ten opzichte van `agents.defaults.model`. Gebruik deze controle wanneer authenticatie-, provider- of factureringsgedrag verschilt tussen livechat en geplande taken.

### Modelprioriteit voor geïsoleerde Cron-taken

Geïsoleerde Cron bepaalt het actieve model in deze volgorde:

1. Overschrijving door Gmail-hook.
2. `--model` per taak.
3. Opgeslagen modeloverschrijving voor de Cron-sessie (wanneer de gebruiker er een heeft geselecteerd).
4. Agent- of standaardmodelselectie.

### Snelle modus

De geïsoleerde snelle Cron-modus volgt de opgeloste selectie van het live model. Modelconfiguratie `params.fastMode` is standaard van toepassing, maar een opgeslagen sessie-override `fastMode` heeft nog steeds voorrang op de configuratie. Wanneer de opgeloste modus `auto` is, gebruikt de afbreekgrens de waarde `params.fastAutoOnSeconds` van het geselecteerde model, met standaard 60 seconden.

### Nieuwe pogingen na live modelwissels

Als een geïsoleerde uitvoering `LiveSessionModelSwitchError` genereert, slaat Cron vóór een nieuwe poging de gewisselde provider en het gewisselde model (en, indien aanwezig, de override van het gewisselde authenticatieprofiel) voor de actieve uitvoering op. De buitenste lus voor nieuwe pogingen is beperkt tot twee wisselpogingen na de eerste poging en wordt daarna afgebroken in plaats van eindeloos door te gaan.

## Uitvoer en weigeringen van uitvoeringen

### Onderdrukking van verouderde bevestigingen

Geïsoleerde Cron-beurten onderdrukken verouderde antwoorden die alleen uit een bevestiging bestaan. Als het eerste resultaat slechts een tussentijdse statusupdate is en geen uitvoering van een onderliggende subagent verantwoordelijk is voor het uiteindelijke antwoord, vraagt Cron vóór aflevering eenmaal opnieuw om het werkelijke resultaat.

### Onderdrukking van stille tokens

Als een geïsoleerde Cron-uitvoering alleen het stille token (`NO_REPLY` of `no_reply`) retourneert, onderdrukt Cron zowel directe uitgaande aflevering als het terugvalpad voor een samenvatting in de wachtrij, zodat er niets naar de chat wordt teruggestuurd.

### Gestructureerde weigeringen

Geïsoleerde Cron-uitvoeringen gebruiken gestructureerde metadata over uitvoeringsweigeringen uit de ingesloten uitvoering (fatale fouten van het uitvoeringshulpmiddel met code `SYSTEM_RUN_DENIED` of `INVALID_REQUEST`) als gezaghebbend weigeringsteken. Ze respecteren ook node-host-wrappers `UNAVAILABLE` rond een geneste gestructureerde fout die een van die codes bevat.

Cron classificeert proza in de uiteindelijke uitvoer of weigeringszinnen die op een goedkeuringsverzoek lijken niet als weigeringen, tenzij de ingesloten uitvoering ook gestructureerde weigeringsmetadata levert. Gewone assistenttekst wordt dus niet als een geblokkeerde opdracht behandeld.

`cron list` en de uitvoeringsgeschiedenis tonen de reden van de weigering in plaats van een geblokkeerde opdracht als `ok` te rapporteren.

## Bewaartermijn

Bewaartermijngedrag:

- `cron.sessionRetention` (standaard `24h`, of `false` om uit te schakelen) verwijdert voltooide geïsoleerde uitvoeringssessies.
- De uitvoeringsgeschiedenis bewaart de nieuwste 2000 terminale rijen per Cron-taak. Verloren rijen behouden het standaard opschoonvenster van 24 uur voor verloren taken.

## Oudere taken migreren

<Note>
Als je Cron-taken hebt van vóór de huidige afleverings- en opslagindeling, voer dan `openclaw doctor --fix` uit. Doctor normaliseert verouderde Cron-velden (`jobId`, `schedule.cron`, afleveringsvelden op het hoogste niveau, waaronder de verouderde `threadId`, en afleveringsaliassen voor payload `provider`) en migreert Webhook-terugvaltaken `notify: true` van `cron.webhook` naar expliciete Webhook-aflevering. Taken die al meldingen naar een chat sturen, behouden die aflevering en krijgen een Webhook-bestemming voor voltooiing. Wanneer `cron.webhook` niet is ingesteld, wordt de inactieve markering `notify` op het hoogste niveau verwijderd voor taken zonder migratiedoel (de bestaande aflevering blijft ongewijzigd behouden), zodat `doctor --fix` hiervoor niet langer herhaaldelijk waarschuwingen geeft.
</Note>

## Veelvoorkomende bewerkingen

Werk afleveringsinstellingen bij zonder het bericht te wijzigen:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Schakel aflevering uit voor een geïsoleerde taak:

```bash
openclaw cron edit <job-id> --no-deliver
```

Schakel lichtgewicht bootstrapcontext in voor een geïsoleerde taak:

```bash
openclaw cron edit <job-id> --light-context
```

Stuur een melding naar een specifiek kanaal:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Stuur een melding naar een Telegram-forumonderwerp:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Maak een geïsoleerde taak met lichtgewicht bootstrapcontext:

```bash
openclaw cron create "0 7 * * *" \
  "Vat de updates van afgelopen nacht samen." \
  --name "Lichtgewicht ochtendoverzicht" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` is alleen van toepassing op geïsoleerde taken met agentbeurten. Voor Cron-uitvoeringen houdt de lichtgewicht modus de bootstrapcontext leeg in plaats van de volledige set werkruimte-bootstrapgegevens te injecteren.

Maak een opdrachttaak met exacte argv, cwd, omgevingsvariabelen, stdin en uitvoerlimieten:

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

`openclaw cron get <job-id>` retourneert rechtstreeks de opgeslagen JSON van de taak. Gebruik `cron show <job-id>` wanneer je de voor mensen leesbare weergave met een voorbeeld van de afleveringsroute wilt.

`cron list --json` en `cron show <job-id> --json` bevatten voor elke taak een veld `status` op het hoogste niveau, berekend op basis van `enabled`, `state.runningAtMs` en `state.lastRunStatus`. Waarden: `disabled`, `running`, `ok`, `error`, `skipped` of `idle`. De JSON-status blijft canoniek en onversierd, zodat externe hulpmiddelen de taakstatus kunnen lezen zonder deze opnieuw af te leiden; voor mensen leesbare uitvoer kan herhaalde statussen `error` voorzien van een aantal mislukkingen.

Vermeldingen van `cron runs` bevatten afleveringsdiagnostiek met het beoogde Cron-doel, het opgeloste doel, verzendingen via het berichthulpmiddel, gebruik van terugval en de afleveringsstatus.

Agent en sessie opnieuw toewijzen:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` waarschuwt wanneer `--agent` bij taken met agentbeurten is weggelaten en valt terug op de standaardagent (`main`). Geef bij het maken `--agent <id>` door om een specifieke agent vast te leggen.

Aflevering aanpassen:

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
