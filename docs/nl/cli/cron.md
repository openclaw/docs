---
read_when:
    - Je wilt geplande taken en wekmomenten
    - Je debugt Cron-uitvoering en logboeken
summary: CLI-referentie voor `openclaw cron` (achtergrondtaken plannen en uitvoeren)
title: Cron
x-i18n:
    generated_at: "2026-05-07T01:50:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b6c894cc4f2a7d86b67b2b5bd7c6338dc442af09befed83117567b3a254fe9
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Beheer Cron-taken voor de Gateway-planner.

<Tip>
Voer `openclaw cron --help` uit voor het volledige commandovlak. Zie [Cron-taken](/nl/automation/cron-jobs) voor de conceptuele gids.
</Tip>

## Sessies

`--session` accepteert `main`, `isolated`, `current` of `session:<id>`.

<AccordionGroup>
  <Accordion title="Session keys">
    - `main` koppelt aan de hoofdsessie van de agent.
    - `isolated` maakt voor elke run een nieuw transcript en sessie-id aan.
    - `current` koppelt aan de actieve sessie op het moment van aanmaken.
    - `session:<id>` pint aan een expliciete persistente sessiesleutel.

  </Accordion>
  <Accordion title="Isolated session semantics">
    Geïsoleerde runs resetten de omgevingscontext van het gesprek. Kanaal- en groepsroutering, verzend-/wachtrijbeleid, elevatie, oorsprong en ACP-runtimebinding worden gereset voor de nieuwe run. Veilige voorkeuren en expliciete, door de gebruiker geselecteerde model- of auth-overschrijvingen kunnen tussen runs behouden blijven.
  </Accordion>
</AccordionGroup>

## Levering

`openclaw cron list` en `openclaw cron show <job-id>` tonen een preview van de opgeloste leveringsroute. Voor `channel: "last"` laat de preview zien of de route is opgelost vanuit de hoofd- of huidige sessie, of gesloten zal falen.

Provider-prefixdoelen kunnen onopgeloste aankondigingskanalen ondubbelzinnig maken. Bijvoorbeeld: `to: "telegram:123"` selecteert Telegram wanneer `delivery.channel` is weggelaten of `last` is. Alleen prefixen die door de geladen Plugin worden geadverteerd, zijn providerselectoren. Als `delivery.channel` expliciet is, moet de prefix met dat kanaal overeenkomen; `channel: "whatsapp"` met `to: "telegram:123"` wordt geweigerd. Serviceprefixen zoals `imessage:` en `sms:` blijven kanaaleigen doelsyntaxis.

<Note>
Geïsoleerde `cron add`-taken gebruiken standaard `--announce`-levering. Gebruik `--no-deliver` om uitvoer intern te houden. `--deliver` blijft beschikbaar als verouderde alias voor `--announce`.
</Note>

### Eigenaarschap van levering

Geïsoleerde Cron-chatlevering wordt gedeeld tussen de agent en de runner:

- De agent kan rechtstreeks verzenden met de `message`-tool wanneer er een chatroute beschikbaar is.
- `announce` levert de uiteindelijke reactie alleen als fallback wanneer de agent niet rechtstreeks naar het opgeloste doel heeft verzonden.
- `webhook` plaatst de voltooide payload op een URL.
- `none` schakelt fallbacklevering door de runner uit.

`--announce` is fallbacklevering door de runner voor de uiteindelijke reactie. `--no-deliver` schakelt die fallback uit, maar verwijdert de `message`-tool van de agent niet wanneer er een chatroute beschikbaar is.

Herinneringen die vanuit een actieve chat zijn aangemaakt, behouden het live chatleveringsdoel voor fallback-aankondigingslevering. Interne sessiesleutels kunnen kleine letters gebruiken; gebruik ze niet als bron van waarheid voor hoofdlettergevoelige provider-ID's zoals Matrix-kamer-ID's.

### Levering bij fouten

Foutmeldingen worden in deze volgorde opgelost:

1. `delivery.failureDestination` op de taak.
2. Globale `cron.failureDestination`.
3. Het primaire aankondigingsdoel van de taak (wanneer geen expliciete foutbestemming is ingesteld).

<Note>
Hoofdsessietaken mogen `delivery.failureDestination` alleen gebruiken wanneer de primaire leveringsmodus `webhook` is. Geïsoleerde taken accepteren dit in alle modi.
</Note>

Opmerking: geïsoleerde Cron-runs behandelen agentfouten op runniveau als taakfouten, zelfs wanneer
er geen antwoordpayload wordt geproduceerd, zodat model-/providerfouten nog steeds foutentellers
verhogen en foutmeldingen activeren.

## Planning

### Eenmalige taken

`--at <datetime>` plant een eenmalige run. Datetimes zonder offset worden als UTC behandeld, tenzij je ook `--tz <iana>` doorgeeft; daarmee wordt de wandkloktijd in de opgegeven tijdzone geïnterpreteerd.

<Note>
Eenmalige taken worden standaard na succes verwijderd. Gebruik `--keep-after-run` om ze te behouden.
</Note>

### Terugkerende taken

Terugkerende taken gebruiken exponentiële retry-backoff na opeenvolgende fouten: 30s, 1m, 5m, 15m, 60m. De planning keert terug naar normaal na de volgende succesvolle run.

Overgeslagen runs worden apart bijgehouden van uitvoeringsfouten. Ze hebben geen invloed op retry-backoff, maar `openclaw cron edit <job-id> --failure-alert-include-skipped` kan foutwaarschuwingen laten deelnemen aan herhaalde meldingen over overgeslagen runs.

Voor geïsoleerde taken die een lokaal geconfigureerde modelprovider gebruiken, voert Cron een lichte provider-preflight uit voordat de agent-turn start. Loopback-, privénetwerk- en `.local` `api: "ollama"`-providers worden geprobed op `/api/tags`; lokale OpenAI-compatibele providers zoals vLLM, SGLang en LM Studio worden geprobed op `/models`. Als het endpoint onbereikbaar is, wordt de run geregistreerd als `skipped` en op een latere planning opnieuw geprobeerd; overeenkomende dode endpoints worden 5 minuten gecachet om te voorkomen dat veel taken dezelfde lokale server belasten.

Opmerking: Cron-taakdefinities staan in `jobs.json`, terwijl runtime-status in afwachting in `jobs-state.json` staat. Als `jobs.json` extern wordt bewerkt, laadt de Gateway gewijzigde planningen opnieuw en wist verouderde slots in afwachting; herschrijvingen die alleen formattering wijzigen, wissen het slot in afwachting niet.

### Handmatige runs

`openclaw cron run` keert terug zodra de handmatige run in de wachtrij is geplaatst. Succesvolle responses bevatten `{ ok: true, enqueued: true, runId }`. Gebruik `openclaw cron runs --id <job-id>` om de uiteindelijke uitkomst te volgen.

<Note>
`openclaw cron run <job-id>` forceert standaard een run. Gebruik `--due` om het oudere gedrag "alleen uitvoeren als de taak verschuldigd is" te behouden.
</Note>

## Modellen

`cron add|edit --model <ref>` selecteert een toegestaan model voor de taak.

<Warning>
Als het model niet is toegestaan of niet kan worden opgelost, laat Cron de run falen met een expliciete validatiefout in plaats van terug te vallen op de agent- of standaardmodelselectie van de taak.
</Warning>

Cron `--model` is een **taakprimair model**, geen chat-sessie-overschrijving met `/model`. Dat betekent:

- Geconfigureerde modelfallbacks blijven van toepassing wanneer het geselecteerde taakmodel faalt.
- Per-taakpayload `fallbacks` vervangt de geconfigureerde fallbacklijst wanneer aanwezig.
- Een lege fallbacklijst per taak (`fallbacks: []` in de taakpayload/API) maakt de Cron-run strikt.
- Wanneer een taak `--model` heeft maar geen fallbacklijst is geconfigureerd, geeft OpenClaw een expliciete lege fallback-overschrijving door zodat het primaire agentmodel niet wordt toegevoegd als verborgen retrydoel.

### Modelvoorrang voor geïsoleerde Cron

Geïsoleerde Cron lost het actieve model in deze volgorde op:

1. Gmail-hook-overschrijving.
2. Per-taak `--model`.
3. Opgeslagen modeloverschrijving voor de Cron-sessie (wanneer de gebruiker er een heeft geselecteerd).
4. Agent- of standaardmodelselectie.

### Snelle modus

De snelle modus van geïsoleerde Cron volgt de opgeloste live modelselectie. Modelconfiguratie `params.fastMode` is standaard van toepassing, maar een opgeslagen sessie-overschrijving `fastMode` krijgt nog steeds voorrang op configuratie.

### Retries bij live modelwissel

Als een geïsoleerde run `LiveSessionModelSwitchError` gooit, bewaart Cron de gewisselde provider en het gewisselde model (en de gewisselde auth-profieloverschrijving wanneer aanwezig) voor de actieve run voordat opnieuw wordt geprobeerd. De buitenste retrylus is begrensd op twee wisselretries na de eerste poging, en breekt daarna af in plaats van eindeloos te blijven lussen.

## Runuitvoer en weigeringen

### Onderdrukking van verouderde bevestigingen

Geïsoleerde Cron-turns onderdrukken verouderde reacties die alleen uit een bevestiging bestaan. Als het eerste resultaat slechts een tussentijdse statusupdate is en geen onderliggende subagent-run verantwoordelijk is voor het uiteindelijke antwoord, prompt Cron één keer opnieuw om het echte resultaat vóór levering.

### Onderdrukking van stil token

Als een geïsoleerde Cron-run alleen het stille token (`NO_REPLY` of `no_reply`) retourneert, onderdrukt Cron zowel rechtstreekse uitgaande levering als het fallbackpad voor een samenvatting in de wachtrij, zodat er niets terug naar de chat wordt geplaatst.

### Gestructureerde weigeringen

Geïsoleerde Cron-runs geven de voorkeur aan gestructureerde metadata voor uitvoeringsweigeringen uit de embedded run, en vallen daarna terug op bekende weigeringsmarkeringen in de uiteindelijke uitvoer, zoals `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` en weigeringszinnen voor approval-binding.

`cron list` en runhistorie tonen de weigeringsreden in plaats van een geblokkeerde opdracht als `ok` te rapporteren.

## Retentie

Retentie en pruning worden in de configuratie beheerd:

- `cron.sessionRetention` (standaard `24h`) prunet voltooide geïsoleerde runsessies.
- `cron.runLog.maxBytes` en `cron.runLog.keepLines` prunen `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Oudere taken migreren

<Note>
Als je Cron-taken hebt van vóór de huidige leverings- en opslagindeling, voer dan `openclaw doctor --fix` uit. Doctor normaliseert legacy Cron-velden (`jobId`, `schedule.cron`, top-level leveringsvelden inclusief legacy `threadId`, payload-`provider`-leveringsaliassen) en migreert eenvoudige `notify: true` Webhook-fallbacktaken naar expliciete Webhook-levering wanneer `cron.webhook` is geconfigureerd.

Doctor verwijdert ook gepersisteerde Cron-`payload.model`-sentinels zoals `"default"`, `"null"`, lege strings en JSON `null`. De Cron-runtime behandelt elke niet-lege `payload.model`-string nog steeds als een expliciete modeloverschrijving en valideert deze tegen `agents.defaults.models`; laat de modelsleutel weg wanneer een taak de agent-/standaardmodelselectie moet gebruiken.
</Note>

## Veelvoorkomende bewerkingen

Werk leveringsinstellingen bij zonder het bericht te wijzigen:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Schakel levering uit voor een geïsoleerde taak:

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

Maak een geïsoleerde taak met lichte bootstrapcontext aan:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` is alleen van toepassing op geïsoleerde agent-turntaken. Voor Cron-runs houdt lichte modus de bootstrapcontext leeg in plaats van de volledige workspace-bootstrapset te injecteren.

## Veelvoorkomende beheeropdrachten

Handmatige run en inspectie:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`openclaw cron list` toont standaard alle overeenkomende taken. Geef `--agent <id>` door om alleen taken te tonen waarvan de effectief genormaliseerde agent-id overeenkomt; taken zonder opgeslagen agent-id tellen als de geconfigureerde standaardagent.

`cron runs`-items bevatten leveringsdiagnostiek met het beoogde Cron-doel, het opgeloste doel, verzendingen met de message-tool, fallbackgebruik en leveringsstatus.

Agent en sessie opnieuw richten:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` waarschuwt wanneer `--agent` is weggelaten bij agent-turntaken en valt terug op de standaardagent (`main`). Geef `--agent <id>` door bij het aanmaken om een specifieke agent vast te pinnen.

Levering aanpassen:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Geplande taken](/nl/automation/cron-jobs)
