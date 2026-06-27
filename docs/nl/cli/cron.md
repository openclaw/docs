---
read_when:
    - Je wilt geplande taken en wake-ups
    - Je debugt Cron-uitvoering en logboeken
summary: CLI-referentie voor `openclaw cron` (achtergrondtaken plannen en uitvoeren)
title: Cron
x-i18n:
    generated_at: "2026-06-27T17:18:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa81e555d35b8982d1de9703c68dfb66aa9ad39407d46555eb0143e3cc5f52f5
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Beheer Cron-taken voor de Gateway-planner.

<Tip>
Voer `openclaw cron --help` uit voor het volledige commandovlak. Zie [Cron-taken](/nl/automation/cron-jobs) voor de conceptuele gids.
</Tip>

## Maak snel taken aan

`openclaw cron create` is een alias voor `openclaw cron add`. Zet voor nieuwe taken eerst de planning en daarna de prompt:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

Gebruik `--webhook <url>` wanneer de taak de voltooide payload via POST moet verzenden in plaats van deze af te leveren bij een chatdoel:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

Gebruik `--command` voor deterministische shell-achtige taken die binnen OpenClaw Cron moeten draaien zonder een geïsoleerde agent-/modelrun te starten:

<Note>
Command-Cron-taken zijn door beheerders gemaakte Gateway-automatisering. Het aanmaken, bewerken,
verwijderen of handmatig uitvoeren ervan vereist `operator.admin`; de geplande run
wordt later uitgevoerd in het Gateway-proces, niet als een agent-`tools.exec`-toolaanroep.
`tools.exec.*` en exec-goedkeuringen blijven model-zichtbare exec-tools beheren.
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

`--command <shell>` slaat `argv: ["sh", "-lc", <shell>]` op. Gebruik `--command-argv '["node","scripts/report.mjs"]'` voor exacte argv-uitvoering. Command-taken leggen stdout/stderr vast, registreren normale Cron-geschiedenis en routeren uitvoer via dezelfde aflevermodi `announce`, `webhook` of `none` als geïsoleerde taken. Een command dat alleen `NO_REPLY` afdrukt, wordt onderdrukt.

## Sessies

`--session` accepteert `main`, `isolated`, `current` of `session:<id>`.

<AccordionGroup>
  <Accordion title="Sessiesleutels">
    - `main` bindt aan de hoofdsessie van de agent.
    - `isolated` maakt voor elke run een nieuwe transcriptie en sessie-id aan.
    - `current` bindt aan de actieve sessie op het moment van aanmaken.
    - `session:<id>` pint vast aan een expliciete persistente sessiesleutel.

  </Accordion>
  <Accordion title="Semantiek van geïsoleerde sessies">
    Geïsoleerde runs resetten de omgevingscontext van het gesprek. Kanaal- en groepsroutering, verzend-/wachtrijbeleid, elevation, oorsprong en ACP-runtimebinding worden gereset voor de nieuwe run. Veilige voorkeuren en expliciete, door de gebruiker geselecteerde model- of auth-overrides kunnen tussen runs worden meegenomen.
  </Accordion>
</AccordionGroup>

## Aflevering

`openclaw cron list` en `openclaw cron show <job-id>` tonen een preview van de opgeloste afleverroute. Voor `channel: "last"` laat de preview zien of de route is opgelost vanuit de hoofd- of huidige sessie, of fail-closed zal eindigen.

Provider-geprefixte doelen kunnen onopgeloste announce-kanalen verduidelijken. Bijvoorbeeld: `to: "telegram:123"` selecteert Telegram wanneer `delivery.channel` is weggelaten of `last` is. Alleen prefixen die door de geladen Plugin worden geadverteerd zijn providerselectoren. Als `delivery.channel` expliciet is, moet het prefix met dat kanaal overeenkomen; `channel: "whatsapp"` met `to: "telegram:123"` wordt geweigerd. Serviceprefixen zoals `imessage:` en `sms:` blijven kanaal-eigen doelsyntaxis.

<Note>
Geïsoleerde `cron add`-taken gebruiken standaard `--announce`-aflevering. Gebruik `--no-deliver` om uitvoer intern te houden. `--deliver` blijft beschikbaar als verouderde alias voor `--announce`.
</Note>

### Eigenaarschap van aflevering

Aflevering van geïsoleerde Cron-chat wordt gedeeld tussen de agent en de runner:

- De agent kan rechtstreeks verzenden met de `message`-tool wanneer een chatroute beschikbaar is.
- `announce` levert de uiteindelijke reactie alleen als fallback af wanneer de agent niet rechtstreeks naar het opgeloste doel heeft verzonden.
- `webhook` post de voltooide payload naar een URL.
- `none` schakelt runner-fallbackaflevering uit.

Gebruik `cron add|create --webhook <url>` of `cron edit <job-id> --webhook <url>` om Webhook-aflevering in te stellen. Combineer `--webhook` niet met chatafleveringsvlaggen zoals `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` of `--account`.

`cron edit <job-id>` kan afzonderlijke afleverrouteringsvelden unsetten met `--clear-channel`, `--clear-to`, `--clear-thread-id` en `--clear-account` (elk wordt geweigerd wanneer het wordt gecombineerd met de bijbehorende set-vlag). Anders dan `--no-deliver`, dat alleen runner-fallbackaflevering uitschakelt, verwijderen deze het opgeslagen veld zodat de taak dat deel van de route weer vanuit de standaardwaarden oplost.

`--announce` is runner-fallbackaflevering voor de uiteindelijke reactie. `--no-deliver` schakelt die fallback uit, maar verwijdert de `message`-tool van de agent niet wanneer een chatroute beschikbaar is.

Herinneringen die vanuit een actieve chat zijn aangemaakt, behouden het live chatafleverdoel voor fallback-announce-aflevering. Interne sessiesleutels kunnen kleine letters gebruiken; gebruik ze niet als bron van waarheid voor hoofdlettergevoelige provider-ID's zoals Matrix-room-ID's.

### Aflevering bij fouten

Foutmeldingen worden in deze volgorde opgelost:

1. `delivery.failureDestination` op de taak.
2. Globale `cron.failureDestination`.
3. Het primaire announce-doel van de taak (wanneer er geen expliciete foutbestemming is ingesteld).

<Note>
Hoofdsessietaken mogen `delivery.failureDestination` alleen gebruiken wanneer de primaire aflevermodus `webhook` is. Geïsoleerde taken accepteren dit in alle modi.
</Note>

Opmerking: geïsoleerde Cron-runs behandelen agentfouten op runniveau als taakfouten, zelfs wanneer
er geen antwoordpayload wordt geproduceerd, zodat model-/providerfouten nog steeds fouttellers
verhogen en foutmeldingen triggeren.

Command-Cron-taken starten geen geïsoleerde agentbeurt. Een exitcode van nul registreert
`ok`; een niet-nul exit, signaal, timeout of geen-uitvoer-timeout registreert `error` en
kan hetzelfde pad voor foutmeldingen triggeren.

Als een geïsoleerde run een timeout krijgt vóór de eerste modelaanvraag, bevatten `openclaw cron show`
en `openclaw cron runs` een fasespecifieke fout zoals
`setup timed out before runner start` of
`stalled before first model call (last phase: context-engine)`.
Voor CLI-ondersteunde providers blijft de pre-model watchdog actief totdat de externe
CLI-beurt start, zodat vastlopers bij sessie-lookup, hook, auth, prompt en CLI-setup
als pre-model Cron-fouten worden gerapporteerd.

## Planning

### Eenmalige taken

`--at <datetime>` plant een eenmalige run. Datetimes zonder offset worden behandeld als UTC, tenzij je ook `--tz <iana>` doorgeeft; daarmee wordt de wall-clock-tijd in de opgegeven tijdzone geïnterpreteerd.

<Note>
Eenmalige taken worden standaard na succes verwijderd. Gebruik `--keep-after-run` om ze te behouden.
</Note>

### Terugkerende taken

Terugkerende taken gebruiken exponentiële retry-backoff na opeenvolgende fouten: 30s, 1m, 5m, 15m, 60m. De planning keert terug naar normaal na de volgende succesvolle run.

Overgeslagen runs worden apart van uitvoeringsfouten bijgehouden. Ze beïnvloeden retry-backoff niet, maar `openclaw cron edit <job-id> --failure-alert-include-skipped` kan foutwaarschuwingen laten kiezen voor herhaalde meldingen over overgeslagen runs.

Voor geïsoleerde taken die gericht zijn op een lokaal geconfigureerde modelprovider, voert Cron een lichte provider-preflight uit voordat de agentbeurt wordt gestart. Loopback-, privénetwerk- en `.local` `api: "ollama"`-providers worden geprobd op `/api/tags`; lokale OpenAI-compatibele providers zoals vLLM, SGLang en LM Studio worden geprobd op `/models`. Als het endpoint onbereikbaar is, wordt de run geregistreerd als `skipped` en later volgens de planning opnieuw geprobeerd; overeenkomende dode endpoints worden 5 minuten gecachet om te voorkomen dat veel taken dezelfde lokale server bestoken.

Opmerking: Cron-taken, pending runtime-status en rungeschiedenis staan in de gedeelde SQLite-statusdatabase. Legacy `jobs.json`, `jobs-state.json` en `runs/*.jsonl`-bestanden worden eenmalig geïmporteerd en hernoemd met een `.migrated`-suffix. Bewerk planningen na import met `openclaw cron add|edit|remove` in plaats van JSON-bestanden te bewerken.

### Handmatige runs

`openclaw cron run <job-id>` voert standaard geforceerd uit en keert terug zodra de handmatige run in de wachtrij staat. Succesvolle reacties bevatten `{ ok: true, enqueued: true, runId }`. Gebruik de geretourneerde `runId` om het latere resultaat te inspecteren:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Voeg `--wait` toe wanneer een script moet blokkeren totdat precies die in de wachtrij geplaatste run een terminale status registreert:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Met `--wait` roept de CLI nog steeds eerst `cron.run` aan en pollt daarna `cron.runs` voor de geretourneerde `runId`. Het command sluit alleen af met `0` wanneer de run eindigt met status `ok`. Het sluit af met een niet-nul status wanneer de run eindigt met `error` of `skipped`, wanneer de Gateway-reactie geen `runId` bevat, of wanneer `--wait-timeout` verloopt. `--poll-interval` moet groter zijn dan nul.

<Note>
Gebruik `--due` wanneer je wilt dat het handmatige command alleen draait als de taak momenteel aan de beurt is. Als `--due --wait` geen run in de wachtrij plaatst, retourneert het command de normale niet-runreactie in plaats van te pollen.
</Note>

## Modellen

`cron add|edit --model <ref>` selecteert een toegestaan model voor de taak. `cron add|edit --fallbacks <list>` stelt fallbackmodellen per taak in, bijvoorbeeld `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; geef `--fallbacks ""` door voor een strikte run zonder fallbacks. `cron edit <job-id> --clear-fallbacks` verwijdert de fallbackoverride per taak. `cron edit <job-id> --clear-model` verwijdert de modeloverride per taak zodat de taak de normale Cron-modelselectieprioriteit volgt (een opgeslagen Cron-sessieoverride als die aanwezig is, anders het agent-/standaardmodel); dit kan niet worden gecombineerd met `--model`.

<Warning>
Als het model niet is toegestaan of niet kan worden opgelost, laat Cron de run mislukken met een expliciete validatiefout in plaats van terug te vallen op de agent- of standaardmodelselectie van de taak.
</Warning>

Cron `--model` is een **primaire taakinstelling**, geen chat-sessie-`/model`-override. Dat betekent:

- Geconfigureerde modelfallbacks blijven van toepassing wanneer het geselecteerde taakmodel faalt.
- Per-taak-payload `fallbacks` vervangt de geconfigureerde fallbacklijst wanneer aanwezig.
- Een lege fallbacklijst per taak (`--fallbacks ""` of `fallbacks: []` in de taakpayload/API) maakt de Cron-run strikt.
- Wanneer een taak `--model` heeft maar er geen fallbacklijst is geconfigureerd, geeft OpenClaw een expliciete lege fallbackoverride door zodat de agent-primary niet als verborgen retrydoel wordt toegevoegd.
- Preflightcontroles voor lokale providers doorlopen geconfigureerde fallbacks voordat een Cron-run als `skipped` wordt gemarkeerd.

`openclaw doctor` rapporteert taken die al `payload.model` hebben ingesteld, inclusief aantallen per provider-namespace en mismatches met `agents.defaults.model`. Gebruik die controle wanneer auth-, provider- of factureringsgedrag verschilt tussen live chat en geplande taken.

### Modelprioriteit voor geïsoleerde Cron

Geïsoleerde Cron lost het actieve model in deze volgorde op:

1. Gmail-hookoverride.
2. Per-taak `--model`.
3. Opgeslagen Cron-sessiemodeloverride (wanneer de gebruiker er een heeft geselecteerd).
4. Agent- of standaardmodelselectie.

### Snelle modus

De snelle modus van geïsoleerde Cron volgt de opgeloste live modelselectie. Modelconfiguratie `params.fastMode` is standaard van toepassing, maar een opgeslagen sessie-`fastMode`-override wint nog steeds van configuratie. Wanneer de opgeloste modus `auto` is, gebruikt de cutoff de `params.fastAutoOnSeconds`-waarde van het geselecteerde model, standaard 60 seconden.

### Retries bij live modelwissel

Als een geïsoleerde run `LiveSessionModelSwitchError` gooit, persisteert Cron de gewisselde provider en het gewisselde model (en de gewisselde auth-profieloverride wanneer aanwezig) voor de actieve run voordat opnieuw wordt geprobeerd. De buitenste retrylus is begrensd op twee switch-retries na de initiële poging en breekt daarna af in plaats van eindeloos te loopen.

## Runuitvoer en weigeringen

### Onderdrukking van verouderde bevestigingen

Geïsoleerde Cron-beurten onderdrukken verouderde reacties die alleen uit bevestigingen bestaan. Als het eerste resultaat slechts een tussentijdse statusupdate is en geen afstammende subagent-run verantwoordelijk is voor het uiteindelijke antwoord, prompt Cron eenmaal opnieuw voor het echte resultaat vóór aflevering.

### Onderdrukking van stille tokens

Als een geïsoleerde Cron-run alleen het stille token (`NO_REPLY` of `no_reply`) retourneert, onderdrukt Cron zowel rechtstreekse uitgaande aflevering als het fallbackpad voor de samenvatting in de wachtrij, zodat er niets terug naar chat wordt gepost.

### Gestructureerde weigeringen

Geïsoleerde Cron-runs gebruiken gestructureerde metadata over uitvoeringsweigering uit de ingebedde run als het gezaghebbende weigeringssignaal. Ze respecteren ook node-host-`UNAVAILABLE`-wrappers wanneer het geneste gestructureerde foutbericht begint met `SYSTEM_RUN_DENIED` of `INVALID_REQUEST`.

Cron classificeert prose in de einduitvoer of weigeringsteksten die op goedkeuring lijken niet als weigeringen, tenzij de ingebedde run ook gestructureerde weigeringsmetadata levert, zodat gewone assistenttekst niet als een geblokkeerde opdracht wordt behandeld.

`cron list` en de run-geschiedenis tonen de weigeringsreden in plaats van een geblokkeerde opdracht als `ok` te rapporteren.

## Bewaring

Bewaring en opschoning worden beheerd in de configuratie:

- `cron.sessionRetention` (standaard `24h`) schoont voltooide geïsoleerde run-sessies op.
- `cron.runLog.keepLines` schoont bewaarde SQLite-run-geschiedenisrijen per taak op. `cron.runLog.maxBytes` blijft geaccepteerd voor compatibiliteit met oudere bestandsgebaseerde runlogs.

## Oudere taken migreren

<Note>
Als je Cron-taken hebt van vóór de huidige leverings- en opslagindeling, voer dan `openclaw doctor --fix` uit. Doctor normaliseert verouderde Cron-velden (`jobId`, `schedule.cron`, delivery-velden op topniveau waaronder verouderde `threadId`, payload-`provider`-delivery-aliassen) en migreert `notify: true`-Webhook-fallbacktaken van `cron.webhook` naar expliciete Webhook-delivery. Taken die al naar een chat aankondigen, behouden die delivery en krijgen een Webhook-bestemming voor voltooiing. Wanneer `cron.webhook` niet is ingesteld, wordt de inerte `notify`-markering op topniveau verwijderd voor taken zonder migratiedoel (de bestaande delivery blijft ongewijzigd behouden), zodat `doctor --fix` er niet langer herhaaldelijk voor waarschuwt.
</Note>

## Veelvoorkomende bewerkingen

Werk delivery-instellingen bij zonder het bericht te wijzigen:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Schakel delivery uit voor een geïsoleerde taak:

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

Kondig aan in een Telegram-forumonderwerp:

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

`--light-context` is alleen van toepassing op geïsoleerde agent-turn-taken. Voor Cron-runs houdt lichte modus de bootstrapcontext leeg in plaats van de volledige workspace-bootstrapset te injecteren.

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

`openclaw cron get <job-id>` retourneert de opgeslagen taak-JSON rechtstreeks. Gebruik `cron show <job-id>` wanneer je de menselijk leesbare weergave met preview van de delivery-route wilt.

`cron list --json` en `cron show <job-id> --json` bevatten een `status`-veld op topniveau voor elke taak, berekend uit `enabled`, `state.runningAtMs` en `state.lastRunStatus`. Waarden: `disabled`, `running`, `ok`, `error`, `skipped` of `idle`. Dit weerspiegelt de menselijk leesbare statuskolom, zodat externe tooling de taakstatus kan lezen zonder deze opnieuw af te leiden.

`cron runs`-items bevatten delivery-diagnostiek met het bedoelde Cron-doel, het opgeloste doel, verzendingen via message-tools, fallbackgebruik en delivery-status.

Agent en sessie opnieuw richten:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` waarschuwt wanneer `--agent` wordt weggelaten bij agent-turn-taken en valt terug op de standaardagent (`main`). Geef `--agent <id>` door bij het maken om een specifieke agent vast te zetten.

Delivery-aanpassingen:

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
