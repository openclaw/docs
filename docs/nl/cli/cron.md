---
read_when:
    - U wilt geplande taken en wake-ups
    - Je debugt cron-uitvoering en logs
summary: CLI-referentie voor `openclaw cron` (achtergrondtaken plannen en uitvoeren)
title: Cron
x-i18n:
    generated_at: "2026-07-01T08:15:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aed39843e183b3d441908ad4ac0578d44b6f0d482905871efc3421fd9820a1cc
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Beheer Cron-taken voor de Gateway-planner.

<Tip>
Voer `openclaw cron --help` uit voor het volledige opdrachtoppervlak. Zie [Cron-taken](/nl/automation/cron-jobs) voor de conceptuele gids.
</Tip>

## Taken snel aanmaken

`openclaw cron create` is een alias voor `openclaw cron add`. Zet voor nieuwe taken eerst het schema en daarna de prompt:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

Gebruik `--webhook <url>` wanneer de taak de voltooide payload via POST moet verzenden in plaats van naar een chatdoel te leveren:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

Gebruik `--command` voor deterministische shell-achtige taken die binnen OpenClaw cron moeten worden uitgevoerd zonder een geïsoleerde agent-/modelrun te starten:

<Note>
Cron-taken met opdrachten zijn door beheerders aangemaakte Gateway-automatisering. Het aanmaken, bewerken,
verwijderen of handmatig uitvoeren ervan vereist `operator.admin`; de geplande run
wordt later uitgevoerd in het Gateway-proces, niet als een agent-`tools.exec`-toolaanroep.
`tools.exec.*` en exec-goedkeuringen blijven modelzichtbare exec-tools beheren.
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` slaat `argv: ["sh", "-lc", <shell>]` op. Gebruik `--command-argv '["node","scripts/report.mjs"]'` voor exacte argv-uitvoering. Opdrachttaken leggen stdout/stderr vast, registreren normale Cron-geschiedenis en routeren uitvoer via dezelfde leveringsmodi `announce`, `webhook` of `none` als geïsoleerde taken. Een opdracht die alleen `NO_REPLY` afdrukt, wordt onderdrukt.

## Sessies

`--session` accepteert `main`, `isolated`, `current` of `session:<id>`.

<AccordionGroup>
  <Accordion title="Sessiesleutels">
    - `main` bindt aan de hoofdsessie van de agent.
    - `isolated` maakt voor elke run een nieuw transcript en sessie-id aan.
    - `current` bindt aan de actieve sessie op het moment van aanmaken.
    - `session:<id>` pint aan een expliciete persistente sessiesleutel.

  </Accordion>
  <Accordion title="Semantiek van geïsoleerde sessies">
    Geïsoleerde runs resetten de omgevingscontext van gesprekken. Kanaal- en groepsroutering, verzend-/wachtrijbeleid, elevatie, oorsprong en ACP-runtimebinding worden gereset voor de nieuwe run. Veilige voorkeuren en expliciet door de gebruiker geselecteerde model- of auth-overschrijvingen kunnen tussen runs worden meegenomen.
  </Accordion>
</AccordionGroup>

## Levering

`openclaw cron list` en `openclaw cron show <job-id>` tonen een voorbeeld van de opgeloste leveringsroute. Voor `channel: "last"` laat de preview zien of de route is opgelost vanuit de hoofd- of huidige sessie, of gesloten zal falen.

Provider-voorvoegde doelen kunnen onopgeloste announce-kanalen eenduidig maken. Bijvoorbeeld: `to: "telegram:123"` selecteert Telegram wanneer `delivery.channel` is weggelaten of `last` is. Alleen voorvoegsels die door de geladen Plugin worden geadverteerd, zijn providerselectoren. Als `delivery.channel` expliciet is, moet het voorvoegsel overeenkomen met dat kanaal; `channel: "whatsapp"` met `to: "telegram:123"` wordt geweigerd. Servicevoorvoegsels zoals `imessage:` en `sms:` blijven kanaal-eigen doelsyntaxis.

<Note>
Geïsoleerde `cron add`-taken gebruiken standaard `--announce`-levering. Gebruik `--no-deliver` om uitvoer intern te houden. `--deliver` blijft beschikbaar als verouderde alias voor `--announce`.
</Note>

### Eigenaarschap van levering

Geïsoleerde Cron-chatlevering wordt gedeeld tussen de agent en de runner:

- De agent kan rechtstreeks verzenden met de `message`-tool wanneer een chatroute beschikbaar is.
- `announce` levert de uiteindelijke reactie alleen als fallback wanneer de agent niet rechtstreeks naar het opgeloste doel heeft verzonden.
- `webhook` post de voltooide payload naar een URL.
- `none` schakelt fallbacklevering door de runner uit.

Gebruik `cron add|create --webhook <url>` of `cron edit <job-id> --webhook <url>` om Webhook-levering in te stellen. Combineer `--webhook` niet met chatleveringsvlaggen zoals `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` of `--account`.

`cron edit <job-id>` kan afzonderlijke velden voor leveringsroutering wissen met `--clear-channel`, `--clear-to`, `--clear-thread-id` en `--clear-account` (elk wordt geweigerd wanneer het wordt gecombineerd met de bijbehorende instelvlag). In tegenstelling tot `--no-deliver`, dat alleen fallbacklevering door de runner uitschakelt, verwijderen deze vlaggen het opgeslagen veld zodat de taak dat deel van de route opnieuw uit standaardwaarden oplost.

`--announce` is fallbacklevering door de runner voor de uiteindelijke reactie. `--no-deliver` schakelt die fallback uit, maar verwijdert de `message`-tool van de agent niet wanneer een chatroute beschikbaar is.

Herinneringen die vanuit een actieve chat zijn aangemaakt, behouden het live chatleveringsdoel voor fallback-announce-levering. Interne sessiesleutels kunnen kleine letters zijn; gebruik ze niet als bron van waarheid voor hoofdlettergevoelige provider-ID's zoals Matrix-kamer-ID's.

### Levering bij fouten

Foutmeldingen worden in deze volgorde opgelost:

1. `delivery.failureDestination` op de taak.
2. Globale `cron.failureDestination`.
3. Het primaire announce-doel van de taak (wanneer geen expliciete foutbestemming is ingesteld).

<Note>
Hoofdsessie-taken mogen `delivery.failureDestination` alleen gebruiken wanneer de primaire leveringsmodus `webhook` is. Geïsoleerde taken accepteren dit in alle modi.
</Note>

Opmerking: geïsoleerde Cron-runs behandelen agentfouten op runniveau als taakfouten, zelfs wanneer
er geen antwoordpayload wordt geproduceerd, zodat model-/providerfouten nog steeds fouttellers
verhogen en foutmeldingen activeren.

Cron-taken met opdrachten starten geen geïsoleerde agentbeurt. Een exitcode van nul registreert
`ok`; een niet-nul-exit, signaal, timeout of timeout zonder uitvoer registreert `error` en
kan hetzelfde pad voor foutmeldingen activeren.

Als een geïsoleerde run een timeout krijgt vóór het eerste modelverzoek, bevatten `openclaw cron show`
en `openclaw cron runs` een fasespecifieke fout zoals
`setup timed out before runner start` of
`stalled before first model call (last phase: context-engine)`.
Voor CLI-ondersteunde providers blijft de pre-model-watchdog actief totdat de externe
CLI-beurt start, zodat vastlopers bij sessieopzoeking, hook, auth, prompt en CLI-instelling
worden gerapporteerd als pre-model-Cron-fouten.

## Planning

### Eenmalige taken

`--at <datetime>` plant een eenmalige run. Datums/tijden zonder offset worden als UTC behandeld, tenzij je ook `--tz <iana>` meegeeft; dan wordt de wandkloktijd in de opgegeven tijdzone geïnterpreteerd.

<Note>
Eenmalige taken worden standaard na succes verwijderd. Gebruik `--keep-after-run` om ze te behouden.
</Note>

### Terugkerende taken

Terugkerende taken gebruiken exponentiële retry-backoff na opeenvolgende fouten: 30s, 1m, 5m, 15m, 60m. Het schema keert terug naar normaal na de volgende succesvolle run.

Overgeslagen runs worden apart van uitvoeringsfouten bijgehouden. Ze beïnvloeden retry-backoff niet, maar `openclaw cron edit <job-id> --failure-alert-include-skipped` kan foutmeldingen laten deelnemen aan herhaalde meldingen over overgeslagen runs.

Voor geïsoleerde taken die op een lokaal geconfigureerde modelprovider zijn gericht, voert Cron een lichte provider-preflight uit voordat de agentbeurt wordt gestart. Loopback-, privé-netwerk- en `.local`-`api: "ollama"`-providers worden gepeild op `/api/tags`; lokale OpenAI-compatibele providers zoals vLLM, SGLang en LM Studio worden gepeild op `/models`. Als het eindpunt niet bereikbaar is, wordt de run geregistreerd als `skipped` en later volgens een schema opnieuw geprobeerd; overeenkomende dode eindpunten worden 5 minuten gecachet om te voorkomen dat veel taken dezelfde lokale server belasten.

Opmerking: Cron-taken, wachtende runtime-status en rungeschiedenis staan in de gedeelde SQLite-statusdatabase. Verouderde bestanden `jobs.json`, `jobs-state.json` en `runs/*.jsonl` worden één keer geïmporteerd en hernoemd met een `.migrated`-suffix. Bewerk schema's na import met `openclaw cron add|edit|remove` in plaats van JSON-bestanden te bewerken.

### Handmatige runs

`openclaw cron run <job-id>` voert standaard geforceerd uit en keert terug zodra de handmatige run in de wachtrij is gezet. Succesvolle reacties bevatten `{ ok: true, enqueued: true, runId }`. Gebruik de geretourneerde `runId` om het latere resultaat te inspecteren:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Voeg `--wait` toe wanneer een script moet blokkeren totdat precies die in de wachtrij geplaatste run een terminale status registreert:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Met `--wait` roept de CLI nog steeds eerst `cron.run` aan en peilt daarna `cron.runs` voor de geretourneerde `runId`. De opdracht eindigt alleen met `0` wanneer de run eindigt met status `ok`. De opdracht eindigt niet-nul wanneer de run eindigt met `error` of `skipped`, wanneer de Gateway-reactie geen `runId` bevat, of wanneer `--wait-timeout` verloopt. `--poll-interval` moet groter zijn dan nul.

<Note>
Gebruik `--due` wanneer je wilt dat de handmatige opdracht alleen wordt uitgevoerd als de taak momenteel verschuldigd is. Als `--due --wait` geen run in de wachtrij plaatst, retourneert de opdracht de normale niet-run-reactie in plaats van te peilen.
</Note>

## Modellen

`cron add|edit --model <ref>` selecteert een toegestaan model voor de taak. `cron add|edit --fallbacks <list>` stelt fallbackmodellen per taak in, bijvoorbeeld `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; geef `--fallbacks ""` door voor een strikte run zonder fallbacks. `cron edit <job-id> --clear-fallbacks` verwijdert de fallback-overschrijving per taak. `cron edit <job-id> --clear-model` verwijdert de modeloverschrijving per taak zodat de taak de normale Cron-voorrang voor modelselectie volgt (een opgeslagen Cron-sessieoverschrijving indien aanwezig, anders het agent-/standaardmodel); dit kan niet worden gecombineerd met `--model`. `cron add|edit --thinking <level>` stelt een thinking-overschrijving per taak in; `cron edit <job-id> --clear-thinking` verwijdert deze zodat de taak de normale Cron-voorrang voor thinking volgt, en dit kan niet worden gecombineerd met `--thinking`.

<Warning>
Als het model niet is toegestaan of niet kan worden opgelost, laat Cron de run mislukken met een expliciete validatiefout in plaats van terug te vallen op de agent- of standaardmodelselectie van de taak.
</Warning>

Cron `--model` is een **primaire taakinstelling**, geen chat-sessie-`/model`-overschrijving. Dat betekent:

- Geconfigureerde modelfallbacks blijven van toepassing wanneer het geselecteerde taakmodel faalt.
- `fallbacks` in de payload per taak vervangt de geconfigureerde fallbacklijst wanneer aanwezig.
- Een lege fallbacklijst per taak (`--fallbacks ""` of `fallbacks: []` in de taakpayload/API) maakt de Cron-run strikt.
- Wanneer een taak `--model` heeft maar geen fallbacklijst is geconfigureerd, geeft OpenClaw een expliciete lege fallback-overschrijving door zodat de primaire agent niet als verborgen retrydoel wordt toegevoegd.
- Preflightcontroles voor lokale providers lopen door geconfigureerde fallbacks voordat een Cron-run als `skipped` wordt gemarkeerd.

`openclaw doctor` rapporteert taken waarvoor `payload.model` al is ingesteld, inclusief aantallen per providernamespace en mismatches met `agents.defaults.model`. Gebruik die controle wanneer auth-, provider- of factureringsgedrag verschilt tussen live chat en geplande taken.

### Modelvoorrang voor geïsoleerde Cron

Geïsoleerde Cron lost het actieve model in deze volgorde op:

1. Gmail-hook-overschrijving.
2. `--model` per taak.
3. Opgeslagen Cron-sessie-modeloverschrijving (wanneer de gebruiker er een heeft geselecteerd).
4. Agent- of standaardmodelselectie.

### Snelle modus

De snelle modus van geïsoleerde Cron volgt de opgeloste live modelselectie. Modelconfiguratie `params.fastMode` is standaard van toepassing, maar een opgeslagen sessie-`fastMode`-overschrijving wint nog steeds van configuratie. Wanneer de opgeloste modus `auto` is, gebruikt de cutoff de `params.fastAutoOnSeconds`-waarde van het geselecteerde model, standaard 60 seconden.

### Retries bij live modelwissel

Als een geïsoleerde run `LiveSessionModelSwitchError` gooit, bewaart Cron de gewisselde provider en het model (en de gewisselde auth-profieloverschrijving wanneer aanwezig) voor de actieve run voordat opnieuw wordt geprobeerd. De buitenste retrylus is begrensd op twee wisselretries na de eerste poging en breekt daarna af in plaats van eindeloos te blijven lopen.

## Runuitvoer en weigeringen

### Onderdrukking van verouderde bevestigingen

Geïsoleerde Cron-beurten onderdrukken verouderde reacties die alleen uit een bevestiging bestaan. Als het eerste resultaat slechts een tussentijdse statusupdate is en geen afstammende subagentrun verantwoordelijk is voor het uiteindelijke antwoord, prompt Cron één keer opnieuw voor het echte resultaat vóór levering.

### Onderdrukking van stille tokens

Als een geïsoleerde cron-run alleen het stille token (`NO_REPLY` of `no_reply`) retourneert, onderdrukt cron zowel directe uitgaande bezorging als het fallbackpad voor de samenvatting in de wachtrij, zodat er niets terug in de chat wordt geplaatst.

### Gestructureerde weigeringen

Geïsoleerde cron-runs gebruiken metadata voor uitvoeringsweigering uit de ingesloten run als het gezaghebbende weigeringssignaal. Ze honoreren ook node-host-`UNAVAILABLE`-wrappers wanneer het geneste gestructureerde foutbericht begint met `SYSTEM_RUN_DENIED` of `INVALID_REQUEST`.

Cron classificeert proza in de einduitvoer of op goedkeuring lijkende weigeringsfrasen niet als weigeringen, tenzij de ingesloten run ook gestructureerde weigeringsmetadata levert, zodat gewone assistenttekst niet als een geblokkeerde opdracht wordt behandeld.

`cron list` en de rungeschiedenis tonen de weigeringsreden in plaats van een geblokkeerde opdracht als `ok` te rapporteren.

## Bewaartermijn

Bewaartermijn en pruning worden in de configuratie beheerd:

- `cron.sessionRetention` (standaard `24h`) ruimt voltooide geïsoleerde runsessies op.
- `cron.runLog.keepLines` ruimt bewaarde SQLite-rungeschiedenisrijen per taak op. `cron.runLog.maxBytes` blijft geaccepteerd voor compatibiliteit met oudere bestandsgebaseerde runlogs.

## Oudere taken migreren

<Note>
Als je cron-taken hebt van voor de huidige bezorgings- en opslagindeling, voer dan `openclaw doctor --fix` uit. Doctor normaliseert verouderde cron-velden (`jobId`, `schedule.cron`, bezorgingsvelden op topniveau inclusief verouderde `threadId`, payload-`provider`-bezorgingsaliassen) en migreert `notify: true`-webhook-fallbacktaken van `cron.webhook` naar expliciete webhookbezorging. Taken die al naar een chat aankondigen, behouden die bezorging en krijgen een voltooiingswebhookbestemming. Wanneer `cron.webhook` niet is ingesteld, wordt de inerte `notify`-markering op topniveau verwijderd voor taken zonder migratiedoel (de bestaande bezorging blijft ongewijzigd behouden), zodat `doctor --fix` er niet langer herhaaldelijk voor blijft waarschuwen.
</Note>

## Veelvoorkomende wijzigingen

Werk bezorgingsinstellingen bij zonder het bericht te wijzigen:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Schakel bezorging uit voor een geïsoleerde taak:

```bash
openclaw cron edit <job-id> --no-deliver
```

Schakel lichte bootstrapcontext in voor een geïsoleerde taak:

```bash
openclaw cron edit <job-id> --light-context
```

Kondig aan in een specifiek kanaal:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Kondig aan in een Telegram-forumtopic:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Maak een geïsoleerde taak met lichte bootstrapcontext:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` geldt alleen voor geïsoleerde agent-turn-taken. Voor cron-runs houdt de lichte modus de bootstrapcontext leeg in plaats van de volledige bootstrapset van de werkruimte te injecteren.

Maak een opdrachttaak met exacte argv, cwd, env, stdin en uitvoerlimieten:

```bash
openclaw cron create "*/30 * * * *" \
  --name "Position export" \
  --command-argv '["node","scripts/export-position.mjs"]' \
  --command-cwd "/srv/app" \
  --command-env "NODE_ENV=production" \
  --command-input '{"mode":"summary"}' \
  --timeout-seconds 120 \
  --no-output-timeout-seconds 30 \
  --output-max-bytes 65536 \
  --webhook "https://example.invalid/openclaw/cron"
```

## Veelvoorkomende beheerdersopdrachten

Handmatige run en inspectie:

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

`openclaw cron get <job-id>` retourneert de opgeslagen taak-JSON rechtstreeks. Gebruik `cron show <job-id>` wanneer je de voor mensen leesbare weergave met bezorgroutevoorbeeld wilt.

`cron list --json` en `cron show <job-id> --json` bevatten een `status`-veld op topniveau voor elke taak, berekend uit `enabled`, `state.runningAtMs` en `state.lastRunStatus`. Waarden: `disabled`, `running`, `ok`, `error`, `skipped` of `idle`. Dit weerspiegelt de voor mensen leesbare statuskolom, zodat externe tooling de taakstatus kan lezen zonder die opnieuw af te leiden.

`cron runs`-vermeldingen bevatten bezorgdiagnostiek met het beoogde cron-doel, het opgeloste doel, verzendingen via berichttools, fallbackgebruik en bezorgde status.

Agent- en sessieretargeting:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` waarschuwt wanneer `--agent` wordt weggelaten bij agent-turn-taken en valt terug op de standaardagent (`main`). Geef `--agent <id>` door bij het aanmaken om een specifieke agent vast te zetten.

Bezorgingsaanpassingen:

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
