---
read_when:
    - Je wilt geplande taken en wekacties
    - U voert foutopsporing uit voor Cron-uitvoering en logboeken
summary: CLI-referentie voor `openclaw cron` (achtergrondtaken plannen en uitvoeren)
title: Cron
x-i18n:
    generated_at: "2026-05-07T13:13:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: de49599c3ebaba88b65dbb6b2b545c0f094575935d9fd0ce0b7bd34470f8e345
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Beheer Cron-taken voor de Gateway-planner.

<Tip>
Voer `openclaw cron --help` uit voor het volledige commandoppervlak. Zie [Cron-taken](/nl/automation/cron-jobs) voor de conceptuele gids.
</Tip>

## Sessies

`--session` accepteert `main`, `isolated`, `current` of `session:<id>`.

<AccordionGroup>
  <Accordion title="Sessiesleutels">
    - `main` bindt aan de hoofdsessie van de agent.
    - `isolated` maakt voor elke run een nieuw transcript en sessie-id aan.
    - `current` bindt aan de actieve sessie op het moment van aanmaken.
    - `session:<id>` zet vast op een expliciete persistente sessiesleutel.

  </Accordion>
  <Accordion title="Semantiek van geïsoleerde sessies">
    Geïsoleerde runs resetten de omgevingscontext van het gesprek. Kanaal- en groepsroutering, verzend-/wachtrijbeleid, elevatie, oorsprong en ACP-runtimebinding worden gereset voor de nieuwe run. Veilige voorkeuren en expliciete, door de gebruiker geselecteerde model- of auth-overschrijvingen kunnen tussen runs worden meegenomen.
  </Accordion>
</AccordionGroup>

## Bezorging

`openclaw cron list` en `openclaw cron show <job-id>` tonen een voorbeeld van de opgeloste bezorgroute. Voor `channel: "last"` laat het voorbeeld zien of de route uit de hoofd- of huidige sessie is opgelost, of gesloten zal falen.

Provider-geprefixte doelen kunnen onopgeloste aankondigingskanalen ondubbelzinnig maken. Bijvoorbeeld: `to: "telegram:123"` selecteert Telegram wanneer `delivery.channel` is weggelaten of `last` is. Alleen prefixes die door de geladen Plugin worden geadverteerd, zijn providerselectoren. Als `delivery.channel` expliciet is, moet de prefix overeenkomen met dat kanaal; `channel: "whatsapp"` met `to: "telegram:123"` wordt geweigerd. Serviceprefixes zoals `imessage:` en `sms:` blijven kanaaleigen doelsyntaxis.

<Note>
Geïsoleerde `cron add`-taken gebruiken standaard `--announce`-bezorging. Gebruik `--no-deliver` om uitvoer intern te houden. `--deliver` blijft bestaan als verouderde alias voor `--announce`.
</Note>

### Eigenaarschap van bezorging

Geïsoleerde Cron-chatbezorging wordt gedeeld tussen de agent en de runner:

- De agent kan rechtstreeks verzenden met de `message`-tool wanneer er een chatroute beschikbaar is.
- `announce` bezorgt als fallback alleen het uiteindelijke antwoord wanneer de agent niet rechtstreeks naar het opgeloste doel heeft verzonden.
- `webhook` post de voltooide payload naar een URL.
- `none` schakelt fallbackbezorging door de runner uit.

`--announce` is fallbackbezorging door de runner voor het uiteindelijke antwoord. `--no-deliver` schakelt die fallback uit, maar verwijdert de `message`-tool van de agent niet wanneer er een chatroute beschikbaar is.

Herinneringen die vanuit een actieve chat worden aangemaakt, behouden het live chatbezorgdoel voor fallback-aankondigingsbezorging. Interne sessiesleutels kunnen kleine letters zijn; gebruik ze niet als bron van waarheid voor hoofdlettergevoelige provider-ID's, zoals Matrix-ruimte-ID's.

### Foutbezorging

Foutmeldingen worden in deze volgorde opgelost:

1. `delivery.failureDestination` op de taak.
2. Globale `cron.failureDestination`.
3. Het primaire aankondigingsdoel van de taak (wanneer er geen expliciete foutbestemming is ingesteld).

<Note>
Hoofdsessietaken mogen `delivery.failureDestination` alleen gebruiken wanneer de primaire bezorgmodus `webhook` is. Geïsoleerde taken accepteren dit in alle modi.
</Note>

Opmerking: geïsoleerde Cron-runs behandelen agentfouten op runniveau als taakfouten, zelfs wanneer er geen antwoordpayload wordt geproduceerd, zodat model-/providerfouten nog steeds fouttellers verhogen en foutmeldingen activeren.

## Planning

### Eenmalige taken

`--at <datetime>` plant een eenmalige run. Datums en tijden zonder offset worden als UTC behandeld, tenzij je ook `--tz <iana>` meegeeft; daarmee wordt de kloktijd in de opgegeven tijdzone geïnterpreteerd.

<Note>
Eenmalige taken worden standaard na succes verwijderd. Gebruik `--keep-after-run` om ze te behouden.
</Note>

### Terugkerende taken

Terugkerende taken gebruiken exponentiële retry-backoff na opeenvolgende fouten: 30s, 1m, 5m, 15m, 60m. De planning keert terug naar normaal na de volgende geslaagde run.

Overgeslagen runs worden apart bijgehouden van uitvoeringsfouten. Ze beïnvloeden retry-backoff niet, maar `openclaw cron edit <job-id> --failure-alert-include-skipped` kan foutmeldingen laten inschrijven op herhaalde meldingen over overgeslagen runs.

Voor geïsoleerde taken die gericht zijn op een lokaal geconfigureerde modelprovider, voert Cron een lichte providerpreflight uit voordat de agentbeurt start. local loopback-, privénetwerk- en `.local` `api: "ollama"`-providers worden geprobd op `/api/tags`; lokale OpenAI-compatibele providers zoals vLLM, SGLang en LM Studio worden geprobd op `/models`. Als het endpoint onbereikbaar is, wordt de run vastgelegd als `skipped` en later opnieuw geprobeerd volgens de planning; overeenkomende dode endpoints worden 5 minuten gecachet om te voorkomen dat veel taken dezelfde lokale server bestoken.

Opmerking: Cron-taakdefinities staan in `jobs.json`, terwijl wachtende runtimestatus in `jobs-state.json` staat. Als `jobs.json` extern wordt bewerkt, laadt de Gateway gewijzigde planningen opnieuw en wist verouderde wachtende slots; herschrijvingen die alleen de opmaak wijzigen, wissen het wachtende slot niet.

### Handmatige runs

`openclaw cron run` keert terug zodra de handmatige run in de wachtrij staat. Geslaagde antwoorden bevatten `{ ok: true, enqueued: true, runId }`. Gebruik `openclaw cron runs --id <job-id>` om de uiteindelijke uitkomst te volgen.

<Note>
`openclaw cron run <job-id>` voert standaard geforceerd uit. Gebruik `--due` om het oudere gedrag "alleen uitvoeren als de taak verschuldigd is" te behouden.
</Note>

## Modellen

`cron add|edit --model <ref>` selecteert een toegestaan model voor de taak.

<Warning>
Als het model niet is toegestaan of niet kan worden opgelost, laat Cron de run falen met een expliciete validatiefout in plaats van terug te vallen op de agent- of standaardmodelselectie van de taak.
</Warning>

Cron `--model` is een **primaire taakinstelling**, geen chat-sessie `/model`-overschrijving. Dat betekent:

- Geconfigureerde modelfallbacks blijven van toepassing wanneer het geselecteerde taakmodel faalt.
- Per-taakpayload `fallbacks` vervangt de geconfigureerde fallbacklijst wanneer aanwezig.
- Een lege per-taakfallbacklijst (`fallbacks: []` in de taakpayload/API) maakt de Cron-run strikt.
- Wanneer een taak `--model` heeft maar er geen fallbacklijst is geconfigureerd, geeft OpenClaw een expliciete lege fallbackoverschrijving door, zodat de primaire agent niet als verborgen retrydoel wordt toegevoegd.

### Modelprioriteit voor geïsoleerde Cron

Geïsoleerde Cron lost het actieve model in deze volgorde op:

1. Gmail-hookoverschrijving.
2. Per-taak `--model`.
3. Opgeslagen modelsessieoverschrijving voor Cron (wanneer de gebruiker er een heeft geselecteerd).
4. Agent- of standaardmodelselectie.

### Snelle modus

De snelle modus van geïsoleerde Cron volgt de opgeloste live modelselectie. Modelconfiguratie `params.fastMode` is standaard van toepassing, maar een opgeslagen sessieoverschrijving `fastMode` wint nog steeds van configuratie.

### Retries bij live modelwissel

Als een geïsoleerde run `LiveSessionModelSwitchError` gooit, bewaart Cron de gewisselde provider en het gewisselde model (en de gewisselde auth-profieloverschrijving wanneer aanwezig) voor de actieve run voordat opnieuw wordt geprobeerd. De buitenste retrylus is begrensd op twee wisselretries na de eerste poging en breekt daarna af in plaats van eeuwig te blijven lussen.

## Run-uitvoer en weigeringen

### Onderdrukking van verouderde bevestigingen

Geïsoleerde Cron-beurten onderdrukken verouderde antwoorden die alleen een bevestiging bevatten. Als het eerste resultaat slechts een tussentijdse statusupdate is en geen afgeleide subagent-run verantwoordelijk is voor het uiteindelijke antwoord, prompt Cron één keer opnieuw voor het echte resultaat voordat er wordt bezorgd.

### Onderdrukking van stille tokens

Als een geïsoleerde Cron-run alleen het stille token (`NO_REPLY` of `no_reply`) teruggeeft, onderdrukt Cron zowel rechtstreekse uitgaande bezorging als het fallbackpad met samenvatting in de wachtrij, zodat er niets terug naar de chat wordt gepost.

### Gestructureerde weigeringen

Geïsoleerde Cron-runs geven de voorkeur aan gestructureerde metadata voor uitvoeringsweigering uit de ingebedde run, en vallen daarna terug op bekende weigeringsmarkeringen in de uiteindelijke uitvoer, zoals `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` en weigeringszinnen voor approval-binding.

`cron list` en de runhistorie tonen de weigeringsreden in plaats van een geblokkeerde opdracht als `ok` te rapporteren.

## Retentie

Retentie en opschoning worden in de configuratie beheerd:

- `cron.sessionRetention` (standaard `24h`) schoont voltooide geïsoleerde runsessies op.
- `cron.runLog.maxBytes` en `cron.runLog.keepLines` schonen `~/.openclaw/cron/runs/<jobId>.jsonl` op.

## Oudere taken migreren

<Note>
Als je Cron-taken hebt van vóór de huidige bezorg- en opslagindeling, voer dan `openclaw doctor --fix` uit. Doctor normaliseert legacy Cron-velden (`jobId`, `schedule.cron`, bezorgvelden op topniveau inclusief legacy `threadId`, payload-`provider`-bezorgaliassen) en migreert eenvoudige `notify: true`-webhookfallbacktaken naar expliciete webhookbezorging wanneer `cron.webhook` is geconfigureerd.
</Note>

## Veelvoorkomende bewerkingen

Werk bezorginstellingen bij zonder het bericht te wijzigen:

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

Kondig aan in een Telegram-forumonderwerp:

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

`--light-context` is alleen van toepassing op geïsoleerde agent-beurttaken. Voor Cron-runs houdt lichte modus bootstrapcontext leeg in plaats van de volledige bootstrapset van de workspace te injecteren.

## Veelvoorkomende beheerdersopdrachten

Handmatige run en inspectie:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`openclaw cron list` toont standaard alle overeenkomende taken. Geef `--agent <id>` mee om alleen taken te tonen waarvan de effectieve genormaliseerde agent-id overeenkomt; taken zonder opgeslagen agent-id tellen als de geconfigureerde standaardagent.

`cron list --json` en `cron show <job-id> --json` bevatten een `status`-veld op topniveau voor elke taak, berekend uit `enabled`, `state.runningAtMs` en `state.lastRunStatus`. Waarden: `disabled`, `running`, `ok`, `error`, `skipped` of `idle`. Dit weerspiegelt de menselijk leesbare statuskolom, zodat externe tooling taakstatus kan lezen zonder die opnieuw af te leiden.

`cron runs`-items bevatten bezorgdiagnostiek met het beoogde Cron-doel, het opgeloste doel, verzenden via de message-tool, fallbackgebruik en bezorgde status.

Agent en sessie opnieuw richten:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` waarschuwt wanneer `--agent` wordt weggelaten bij agent-beurttaken en valt terug op de standaardagent (`main`). Geef `--agent <id>` mee bij het aanmaken om een specifieke agent vast te zetten.

Bezorging aanpassen:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Geplande taken](/nl/automation/cron-jobs)
