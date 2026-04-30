---
read_when:
    - Je wilt geplande taken en wekmomenten
    - Je spoort fouten op in Cron-uitvoering en logs
summary: CLI-referentie voor `openclaw cron` (achtergrondtaken plannen en uitvoeren)
title: Cron
x-i18n:
    generated_at: "2026-04-30T09:34:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03d79e0e2c71f673c900b84eb2beeab705662c1d016e1d0567323c8da73060bb
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Beheer Cron-taken voor de Gateway-planner.

<Tip>
Voer `openclaw cron --help` uit voor het volledige commandoppervlak. Zie [Cron-taken](/nl/automation/cron-jobs) voor de conceptuele handleiding.
</Tip>

## Sessies

`--session` accepteert `main`, `isolated`, `current` of `session:<id>`.

<AccordionGroup>
  <Accordion title="Sessiesleutels">
    - `main` bindt aan de hoofdsessie van de agent.
    - `isolated` maakt voor elke run een nieuwe transcriptie en sessie-id aan.
    - `current` bindt aan de actieve sessie op het moment van aanmaken.
    - `session:<id>` zet vast op een expliciete persistente sessiesleutel.

  </Accordion>
  <Accordion title="Semantiek van geïsoleerde sessies">
    Geïsoleerde runs resetten de omgevingscontext van het gesprek. Kanaal- en groepsroutering, verzend-/wachtrijbeleid, elevatie, oorsprong en ACP-runtimebinding worden gereset voor de nieuwe run. Veilige voorkeuren en expliciete, door de gebruiker geselecteerde model- of auth-overschrijvingen kunnen tussen runs behouden blijven.
  </Accordion>
</AccordionGroup>

## Bezorging

`openclaw cron list` en `openclaw cron show <job-id>` tonen een preview van de opgeloste bezorgroute. Voor `channel: "last"` toont de preview of de route is opgelost vanuit de hoofd- of huidige sessie, of gesloten zal falen.

<Note>
Geïsoleerde `cron add`-taken gebruiken standaard `--announce`-bezorging. Gebruik `--no-deliver` om uitvoer intern te houden. `--deliver` blijft beschikbaar als verouderd alias voor `--announce`.
</Note>

### Eigenaarschap van bezorging

Geïsoleerde Cron-chatbezorging wordt gedeeld tussen de agent en de runner:

- De agent kan rechtstreeks verzenden met de `message`-tool wanneer een chatroute beschikbaar is.
- `announce` bezorgt als fallback alleen het uiteindelijke antwoord wanneer de agent niet rechtstreeks naar het opgeloste doel heeft verzonden.
- `webhook` plaatst de voltooide payload naar een URL.
- `none` schakelt fallbackbezorging door de runner uit.

`--announce` is runner-fallbackbezorging voor het uiteindelijke antwoord. `--no-deliver` schakelt die fallback uit, maar verwijdert de `message`-tool van de agent niet wanneer een chatroute beschikbaar is.

Herinneringen die vanuit een actieve chat zijn gemaakt, behouden het live chatbezorgdoel voor fallback-aankondigingsbezorging. Interne sessiesleutels kunnen kleine letters bevatten; gebruik ze niet als bron van waarheid voor hoofdlettergevoelige provider-id's zoals Matrix-kamer-id's.

### Bezorging bij fouten

Foutmeldingen worden in deze volgorde opgelost:

1. `delivery.failureDestination` op de taak.
2. Globale `cron.failureDestination`.
3. Het primaire aankondigingsdoel van de taak (wanneer er geen expliciete foutbestemming is ingesteld).

<Note>
Taken in de hoofdsessie mogen `delivery.failureDestination` alleen gebruiken wanneer de primaire bezorgmodus `webhook` is. Geïsoleerde taken accepteren dit in alle modi.
</Note>

Opmerking: geïsoleerde Cron-runs behandelen agentfouten op runniveau als taakfouten, zelfs wanneer
er geen antwoordpayload wordt geproduceerd, zodat model-/providerfouten nog steeds fouttellers
verhogen en foutmeldingen activeren.

## Planning

### Eenmalige taken

`--at <datetime>` plant een eenmalige run. Datums en tijden zonder offset worden als UTC behandeld, tenzij je ook `--tz <iana>` doorgeeft; daarmee wordt de kloktijd in de opgegeven tijdzone geïnterpreteerd.

<Note>
Eenmalige taken worden standaard verwijderd na succes. Gebruik `--keep-after-run` om ze te behouden.
</Note>

### Terugkerende taken

Terugkerende taken gebruiken exponentiële retry-backoff na opeenvolgende fouten: 30s, 1m, 5m, 15m, 60m. De planning keert terug naar normaal na de volgende geslaagde run.

Overgeslagen runs worden apart bijgehouden van uitvoeringsfouten. Ze beïnvloeden de retry-backoff niet, maar `openclaw cron edit <job-id> --failure-alert-include-skipped` kan foutmeldingen laten kiezen voor herhaalde meldingen van overgeslagen runs.

Voor geïsoleerde taken die een lokaal geconfigureerde modelprovider targeten, voert Cron een lichte provider-preflight uit voordat de agentbeurt start. Loopback-, privénetwerk- en `.local` `api: "ollama"`-providers worden gepeild op `/api/tags`; lokale OpenAI-compatibele providers zoals vLLM, SGLang en LM Studio worden gepeild op `/models`. Als het endpoint onbereikbaar is, wordt de run geregistreerd als `skipped` en later volgens planning opnieuw geprobeerd; overeenkomende dode endpoints worden 5 minuten gecachet om te voorkomen dat veel taken dezelfde lokale server belasten.

Opmerking: Cron-taakdefinities staan in `jobs.json`, terwijl de in behandeling zijnde runtime-status in `jobs-state.json` staat. Als `jobs.json` extern wordt bewerkt, laadt de Gateway gewijzigde planningen opnieuw en wist verouderde in behandeling zijnde slots; herschrijvingen die alleen opmaak wijzigen wissen het in behandeling zijnde slot niet.

### Handmatige runs

`openclaw cron run` retourneert zodra de handmatige run in de wachtrij staat. Geslaagde antwoorden bevatten `{ ok: true, enqueued: true, runId }`. Gebruik `openclaw cron runs --id <job-id>` om de uiteindelijke uitkomst te volgen.

<Note>
`openclaw cron run <job-id>` forceert standaard een run. Gebruik `--due` om het oudere gedrag "alleen uitvoeren indien verschuldigd" te behouden.
</Note>

## Modellen

`cron add|edit --model <ref>` selecteert een toegestaan model voor de taak.

<Warning>
Als het model niet is toegestaan of niet kan worden opgelost, laat Cron de run mislukken met een expliciete validatiefout in plaats van terug te vallen op de agent- of standaardmodelselectie van de taak.
</Warning>

Cron `--model` is een **taakprimair**, geen `/model`-overschrijving voor chatsessies. Dat betekent:

- Geconfigureerde modelfallbacks blijven van toepassing wanneer het geselecteerde taakmodel faalt.
- Per-taak-payload `fallbacks` vervangt de geconfigureerde fallbacklijst wanneer aanwezig.
- Een lege fallbacklijst per taak (`fallbacks: []` in de taakpayload/API) maakt de Cron-run strikt.
- Wanneer een taak `--model` heeft maar er geen fallbacklijst is geconfigureerd, geeft OpenClaw een expliciete lege fallback-overschrijving door zodat de agentprimary niet als verborgen retry-doel wordt toegevoegd.

### Modelprioriteit voor geïsoleerde Cron

Geïsoleerde Cron lost het actieve model in deze volgorde op:

1. Gmail-hook-overschrijving.
2. Per-taak `--model`.
3. Opgeslagen modeloverschrijving van de Cron-sessie (wanneer de gebruiker er een heeft geselecteerd).
4. Agent- of standaardmodelselectie.

### Snelle modus

Snelle modus voor geïsoleerde Cron volgt de opgeloste live modelselectie. Modelconfiguratie `params.fastMode` is standaard van toepassing, maar een opgeslagen sessie-overschrijving `fastMode` heeft nog steeds voorrang op de configuratie.

### Retries bij live modelwissel

Als een geïsoleerde run `LiveSessionModelSwitchError` gooit, bewaart Cron de gewisselde provider en het model (en de gewisselde auth-profieloverschrijving wanneer aanwezig) voor de actieve run voordat opnieuw wordt geprobeerd. De buitenste retrylus is begrensd op twee switch-retries na de eerste poging en breekt daarna af in plaats van eindeloos te blijven loopen.

## Runuitvoer en weigeringen

### Onderdrukking van verouderde bevestigingen

Geïsoleerde Cron-beurten onderdrukken verouderde antwoorden die alleen uit een bevestiging bestaan. Als het eerste resultaat slechts een tussentijdse statusupdate is en geen onderliggende subagent-run verantwoordelijk is voor het uiteindelijke antwoord, vraagt Cron één keer opnieuw om het echte resultaat vóór bezorging.

### Onderdrukking van stille tokens

Als een geïsoleerde Cron-run alleen het stille token (`NO_REPLY` of `no_reply`) retourneert, onderdrukt Cron zowel directe uitgaande bezorging als het fallbackpad met samenvatting in de wachtrij, zodat er niets terug naar chat wordt geplaatst.

### Gestructureerde weigeringen

Geïsoleerde Cron-runs geven de voorkeur aan gestructureerde metadata voor uitvoeringsweigering uit de ingesloten run en vallen daarna terug op bekende weigermarkers in de uiteindelijke uitvoer, zoals `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` en weigeringszinnen voor goedkeuringsbinding.

`cron list` en runhistorie tonen de reden van weigering in plaats van een geblokkeerd commando als `ok` te rapporteren.

## Retentie

Retentie en opschoning worden beheerd in de configuratie:

- `cron.sessionRetention` (standaard `24h`) schoont voltooide geïsoleerde runsessies op.
- `cron.runLog.maxBytes` en `cron.runLog.keepLines` schonen `~/.openclaw/cron/runs/<jobId>.jsonl` op.

## Oudere taken migreren

<Note>
Als je Cron-taken hebt van vóór het huidige bezorgings- en opslagformaat, voer dan `openclaw doctor --fix` uit. Doctor normaliseert verouderde Cron-velden (`jobId`, `schedule.cron`, top-level bezorgvelden waaronder verouderde `threadId`, payload-`provider`-bezorgaliassen) en migreert eenvoudige `notify: true` webhook-fallbacktaken naar expliciete webhookbezorging wanneer `cron.webhook` is geconfigureerd.
</Note>

## Veelvoorkomende bewerkingen

Werk bezorginstellingen bij zonder het bericht te wijzigen:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Schakel bezorging voor een geïsoleerde taak uit:

```bash
openclaw cron edit <job-id> --no-deliver
```

Schakel lichte bootstrapcontext in voor een geïsoleerde taak:

```bash
openclaw cron edit <job-id> --light-context
```

Kondig aan naar een specifiek kanaal:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Kondig aan naar een Telegram-forumonderwerp:

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

`--light-context` geldt alleen voor geïsoleerde agentbeurttaken. Voor Cron-runs houdt de lichte modus de bootstrapcontext leeg in plaats van de volledige workspace-bootstrapset te injecteren.

## Veelvoorkomende beheerderscommando's

Handmatige run en inspectie:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs`-items bevatten bezorgdiagnostiek met het beoogde Cron-doel, het opgeloste doel, verzendingen via de message-tool, fallbackgebruik en bezorgde status.

Agent- en sessieherroutering:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` waarschuwt wanneer `--agent` wordt weggelaten bij agentbeurttaken en valt terug op de standaardagent (`main`). Geef `--agent <id>` door bij het aanmaken om een specifieke agent vast te zetten.

Bezorgingsaanpassingen:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Geplande taken](/nl/automation/cron-jobs)
