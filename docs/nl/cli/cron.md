---
read_when:
    - Je wilt geplande taken en wekmomenten
    - Je debugt Cron-uitvoering en logs
summary: CLI-referentie voor `openclaw cron` (achtergrondtaken plannen en uitvoeren)
title: Cron
x-i18n:
    generated_at: "2026-05-10T19:28:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1575213cfcc6cb9991e0aed48722e737d930570ce8527532188b345810982892
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Beheer Cron-taken voor de Gateway-planner.

<Tip>
Voer `openclaw cron --help` uit voor het volledige opdrachtoppervlak. Zie [Cron-taken](/nl/automation/cron-jobs) voor de conceptuele gids.
</Tip>

## Sessies

`--session` accepteert `main`, `isolated`, `current` of `session:<id>`.

<AccordionGroup>
  <Accordion title="Sessiesleutels">
    - `main` bindt aan de hoofdsessie van de agent.
    - `isolated` maakt voor elke run een nieuw transcript en nieuwe sessie-id aan.
    - `current` bindt aan de actieve sessie op het moment van aanmaken.
    - `session:<id>` pint vast aan een expliciete persistente sessiesleutel.

  </Accordion>
  <Accordion title="Semantiek van geïsoleerde sessies">
    Geïsoleerde runs resetten omgevingscontext uit gesprekken. Kanaal- en groepsroutering, verzend-/wachtrijbeleid, elevatie, oorsprong en ACP-runtimebinding worden gereset voor de nieuwe run. Veilige voorkeuren en expliciete door de gebruiker geselecteerde model- of auth-overschrijvingen kunnen tussen runs worden meegenomen.
  </Accordion>
</AccordionGroup>

## Levering

`openclaw cron list` en `openclaw cron show <job-id>` tonen een voorbeeld van de opgeloste leveringsroute. Voor `channel: "last"` laat het voorbeeld zien of de route is opgelost vanuit de hoofd- of huidige sessie, of gesloten zal falen.

Provider-prefixdoelen kunnen onopgeloste aankondigingskanalen ondubbelzinnig maken. Bijvoorbeeld: `to: "telegram:123"` selecteert Telegram wanneer `delivery.channel` is weggelaten of `last`. Alleen prefixes die door de geladen plugin worden geadverteerd, zijn providerselectoren. Als `delivery.channel` expliciet is, moet de prefix met dat kanaal overeenkomen; `channel: "whatsapp"` met `to: "telegram:123"` wordt geweigerd. Serviceprefixes zoals `imessage:` en `sms:` blijven doelsyntaxis die eigendom is van het kanaal.

<Note>
Geïsoleerde `cron add`-taken gebruiken standaard `--announce`-levering. Gebruik `--no-deliver` om uitvoer intern te houden. `--deliver` blijft als verouderde alias voor `--announce` beschikbaar.
</Note>

### Eigenaarschap van levering

Geïsoleerde Cron-chatlevering wordt gedeeld tussen de agent en de runner:

- De agent kan rechtstreeks verzenden met de `message`-tool wanneer een chatroute beschikbaar is.
- `announce` levert de uiteindelijke reactie als fallback alleen wanneer de agent niet rechtstreeks naar het opgeloste doel heeft verzonden.
- `webhook` plaatst de voltooide payload op een URL.
- `none` schakelt fallbacklevering door de runner uit.

`--announce` is fallbacklevering door de runner voor de uiteindelijke reactie. `--no-deliver` schakelt die fallback uit, maar verwijdert de `message`-tool van de agent niet wanneer een chatroute beschikbaar is.

Herinneringen die vanuit een actieve chat worden aangemaakt, behouden het live chatleveringsdoel voor fallback-aankondigingslevering. Interne sessiesleutels kunnen kleine letters gebruiken; gebruik ze niet als bron van waarheid voor hoofdlettergevoelige provider-ID's zoals Matrix-room-ID's.

### Foutlevering

Foutmeldingen worden in deze volgorde opgelost:

1. `delivery.failureDestination` op de taak.
2. Globale `cron.failureDestination`.
3. Het primaire aankondigingsdoel van de taak (wanneer er geen expliciete foutbestemming is ingesteld).

<Note>
Hoofdsessietaken mogen `delivery.failureDestination` alleen gebruiken wanneer de primaire leveringsmodus `webhook` is. Geïsoleerde taken accepteren dit in alle modi.
</Note>

Opmerking: geïsoleerde Cron-runs behandelen agentfouten op runniveau als taakfouten, zelfs wanneer
er geen antwoordpayload wordt geproduceerd, zodat model-/providerfouten nog steeds fouttellers
verhogen en foutmeldingen activeren.

Als een geïsoleerde run vóór het eerste modelverzoek een time-out krijgt, bevatten `openclaw cron show`
en `openclaw cron runs` een fasespecifieke fout zoals
`setup timed out before runner start` of
`stalled before first model call (last phase: context-engine)`.
Voor CLI-ondersteunde providers blijft de pre-model-watchdog actief totdat de externe
CLI-turn start, zodat sessieopzoeking, hook, auth, prompt en CLI-installatieblokkades
worden gerapporteerd als pre-model-Cron-fouten.

## Planning

### Eenmalige taken

`--at <datetime>` plant een eenmalige run. Datetimes zonder offset worden behandeld als UTC, tenzij je ook `--tz <iana>` doorgeeft; daarmee wordt de wandkloktijd in de opgegeven tijdzone geïnterpreteerd.

<Note>
Eenmalige taken worden standaard na succes verwijderd. Gebruik `--keep-after-run` om ze te behouden.
</Note>

### Terugkerende taken

Terugkerende taken gebruiken exponentiële retry-backoff na opeenvolgende fouten: 30s, 1m, 5m, 15m, 60m. De planning keert terug naar normaal na de volgende succesvolle run.

Overgeslagen runs worden apart bijgehouden van uitvoeringsfouten. Ze hebben geen invloed op retry-backoff, maar `openclaw cron edit <job-id> --failure-alert-include-skipped` kan foutmeldingen laten deelnemen aan herhaalde meldingen over overgeslagen runs.

Voor geïsoleerde taken die een lokaal geconfigureerde modelprovider targeten, voert Cron een lichte provider-preflight uit voordat de agent-turn start. Loopback-, privénetwerk- en `.local` `api: "ollama"`-providers worden geprobed op `/api/tags`; lokale OpenAI-compatibele providers zoals vLLM, SGLang en LM Studio worden geprobed op `/models`. Als het endpoint onbereikbaar is, wordt de run geregistreerd als `skipped` en later opnieuw geprobeerd volgens de planning; overeenkomende dode endpoints worden 5 minuten gecachet om te voorkomen dat veel taken dezelfde lokale server belasten.

Opmerking: Cron-taakdefinities staan in `jobs.json`, terwijl runtime-status in behandeling in `jobs-state.json` staat. Als `jobs.json` extern wordt bewerkt, herlaadt de Gateway gewijzigde planningen en wist verouderde pending slots; herschrijvingen die alleen formattering wijzigen, wissen de pending slot niet.

### Handmatige runs

`openclaw cron run` keert terug zodra de handmatige run in de wachtrij is geplaatst. Succesvolle reacties bevatten `{ ok: true, enqueued: true, runId }`. Gebruik `openclaw cron runs --id <job-id>` om de uiteindelijke uitkomst te volgen.

<Note>
`openclaw cron run <job-id>` forceert standaard een run. Gebruik `--due` om het oudere gedrag "alleen uitvoeren als vervallen" te behouden.
</Note>

## Modellen

`cron add|edit --model <ref>` selecteert een toegestaan model voor de taak.

<Warning>
Als het model niet is toegestaan of niet kan worden opgelost, laat Cron de run falen met een expliciete validatiefout in plaats van terug te vallen op de agent of standaardmodelselectie van de taak.
</Warning>

Cron `--model` is een **primaire taakinstelling**, geen chat-sessie-overschrijving met `/model`. Dat betekent:

- Geconfigureerde modelfallbacks blijven van toepassing wanneer het geselecteerde taakmodel faalt.
- Per-taakpayload `fallbacks` vervangt de geconfigureerde fallbacklijst wanneer aanwezig.
- Een lege per-taakfallbacklijst (`fallbacks: []` in de taakpayload/API) maakt de Cron-run strikt.
- Wanneer een taak `--model` heeft maar er geen fallbacklijst is geconfigureerd, geeft OpenClaw een expliciete lege fallback-overschrijving door zodat de primaire agent niet als verborgen retry-doel wordt toegevoegd.

### Modelvoorrang voor geïsoleerde Cron

Geïsoleerde Cron lost het actieve model in deze volgorde op:

1. Gmail-hook-overschrijving.
2. Per-taak `--model`.
3. Opgeslagen modeloverschrijving voor de Cron-sessie (wanneer de gebruiker er een heeft geselecteerd).
4. Agent of standaardmodelselectie.

### Snelle modus

De snelle modus van geïsoleerde Cron volgt de opgeloste live modelselectie. Modelconfiguratie `params.fastMode` is standaard van toepassing, maar een opgeslagen sessie-overschrijving `fastMode` wint nog steeds van configuratie.

### Retries bij live modelwissel

Als een geïsoleerde run `LiveSessionModelSwitchError` gooit, bewaart Cron de gewisselde provider en het model (en de gewisselde auth-profieloverschrijving wanneer aanwezig) voor de actieve run voordat opnieuw wordt geprobeerd. De buitenste retrylus is begrensd op twee wisselretries na de eerste poging en breekt daarna af in plaats van eindeloos te blijven herhalen.

## Run-uitvoer en weigeringen

### Onderdrukking van verouderde bevestigingen

Geïsoleerde Cron-turns onderdrukken verouderde reacties die alleen uit een bevestiging bestaan. Als het eerste resultaat slechts een tussentijdse statusupdate is en geen onderliggende subagent-run verantwoordelijk is voor het uiteindelijke antwoord, prompt Cron eenmaal opnieuw voor het echte resultaat voordat wordt geleverd.

### Onderdrukking van stille tokens

Als een geïsoleerde Cron-run alleen de stille token (`NO_REPLY` of `no_reply`) teruggeeft, onderdrukt Cron zowel directe uitgaande levering als het fallbackpad voor samenvattingen in de wachtrij, zodat er niets terug naar de chat wordt geplaatst.

### Gestructureerde weigeringen

Geïsoleerde Cron-runs geven de voorkeur aan gestructureerde metadata voor uitvoeringsweigeringen uit de embedded run en vallen daarna terug op bekende weigeringsmarkeringen in de uiteindelijke uitvoer, zoals `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` en weigeringsteksten voor approval-binding.

`cron list` en runhistorie tonen de weigeringsreden in plaats van een geblokkeerde opdracht als `ok` te rapporteren.

## Retentie

Retentie en pruning worden in configuratie beheerd:

- `cron.sessionRetention` (standaard `24h`) prunet voltooide geïsoleerde runsessies.
- `cron.runLog.maxBytes` en `cron.runLog.keepLines` prunen `~/.openclaw/cron/runs/<jobId>.jsonl`.

## Oudere taken migreren

<Note>
Als je Cron-taken hebt van vóór de huidige levering en opslagindeling, voer dan `openclaw doctor --fix` uit. Doctor normaliseert legacy Cron-velden (`jobId`, `schedule.cron`, top-level leveringsvelden inclusief legacy `threadId`, payload `provider`-leveringsaliassen) en migreert eenvoudige `notify: true` Webhook-fallbacktaken naar expliciete Webhook-levering wanneer `cron.webhook` is geconfigureerd.
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

Kondig aan op een specifiek kanaal:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Kondig aan op een Telegram-forumtopic:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Maak een geïsoleerde taak met lichte bootstrapcontext:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` is alleen van toepassing op geïsoleerde agent-turn-taken. Voor Cron-runs houdt lichte modus de bootstrapcontext leeg in plaats van de volledige workspace-bootstrapset te injecteren.

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

`openclaw cron list` toont standaard alle overeenkomende taken. Geef `--agent <id>` door om alleen taken te tonen waarvan de effectieve genormaliseerde agent-id overeenkomt; taken zonder opgeslagen agent-id tellen als de geconfigureerde standaardagent.

`cron list --json` en `cron show <job-id> --json` bevatten een top-level `status`-veld op elke taak, berekend uit `enabled`, `state.runningAtMs` en `state.lastRunStatus`. Waarden: `disabled`, `running`, `ok`, `error`, `skipped` of `idle`. Dit weerspiegelt de voor mensen leesbare statuskolom, zodat externe tooling taakstatus kan lezen zonder die opnieuw af te leiden.

`cron runs`-items bevatten leveringsdiagnostiek met het beoogde Cron-doel, het opgeloste doel, verzenden via de message-tool, fallbackgebruik en geleverde status.

Agent- en sessieretargeting:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` waarschuwt wanneer `--agent` is weggelaten bij agent-turn-taken en valt terug op de standaardagent (`main`). Geef `--agent <id>` door bij het aanmaken om een specifieke agent vast te pinnen.

Leveringsaanpassingen:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Geplande taken](/nl/automation/cron-jobs)
