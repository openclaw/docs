---
read_when:
    - Je wilt geplande taken en wekmomenten
    - Je debugt Cron-uitvoering en logs
summary: CLI-referentie voor `openclaw cron` (achtergrondtaken plannen en uitvoeren)
title: Cron
x-i18n:
    generated_at: "2026-04-29T22:31:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 658498b09e0f0997d0f05dcdbdbd8822284d747df932f1c51e86f97b94cd81a7
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
    - `main` koppelt aan de hoofdsessie van de agent.
    - `isolated` maakt voor elke uitvoering een nieuw transcript en sessie-id aan.
    - `current` koppelt aan de actieve sessie op het moment van aanmaken.
    - `session:<id>` zet vast op een expliciete permanente sessiesleutel.

  </Accordion>
  <Accordion title="Semantiek van geïsoleerde sessies">
    Geïsoleerde uitvoeringen resetten de omgevingscontext van het gesprek. Kanaal- en groepsroutering, verzend-/wachtrijbeleid, verhoging, oorsprong en ACP-runtimekoppeling worden gereset voor de nieuwe uitvoering. Veilige voorkeuren en expliciet door de gebruiker geselecteerde model- of auth-overschrijvingen kunnen tussen uitvoeringen worden meegenomen.
  </Accordion>
</AccordionGroup>

## Levering

`openclaw cron list` en `openclaw cron show <job-id>` tonen een voorbeeld van de opgeloste leveringsroute. Voor `channel: "last"` laat het voorbeeld zien of de route is opgelost vanuit de hoofd- of huidige sessie, of gesloten zal mislukken.

<Note>
Geïsoleerde `cron add`-taken gebruiken standaard `--announce`-levering. Gebruik `--no-deliver` om uitvoer intern te houden. `--deliver` blijft bestaan als verouderde alias voor `--announce`.
</Note>

### Eigenaarschap van levering

Geïsoleerde Cron-chatlevering wordt gedeeld tussen de agent en de runner:

- De agent kan rechtstreeks verzenden met de tool `message` wanneer er een chatroute beschikbaar is.
- `announce` levert alleen de uiteindelijke reactie via fallback wanneer de agent niet rechtstreeks naar het opgeloste doel heeft verzonden.
- `webhook` plaatst de voltooide payload op een URL.
- `none` schakelt fallback-levering door de runner uit.

`--announce` is fallback-levering door de runner voor de uiteindelijke reactie. `--no-deliver` schakelt die fallback uit, maar verwijdert de tool `message` van de agent niet wanneer er een chatroute beschikbaar is.

Herinneringen die vanuit een actieve chat zijn gemaakt, behouden het live chatleveringsdoel voor fallback-announce-levering. Interne sessiesleutels kunnen kleine letters gebruiken; gebruik ze niet als bron van waarheid voor hoofdlettergevoelige provider-id's zoals Matrix-kamer-id's.

### Levering bij fouten

Foutmeldingen worden in deze volgorde opgelost:

1. `delivery.failureDestination` op de taak.
2. Globale `cron.failureDestination`.
3. Het primaire announce-doel van de taak (wanneer er geen expliciet foutdoel is ingesteld).

<Note>
Taken in de hoofdsessie mogen `delivery.failureDestination` alleen gebruiken wanneer de primaire leveringsmodus `webhook` is. Geïsoleerde taken accepteren dit in alle modi.
</Note>

Opmerking: geïsoleerde Cron-uitvoeringen behandelen agentfouten op uitvoeringsniveau als taakfouten, zelfs wanneer
er geen reactiepayload wordt geproduceerd, zodat model-/providerfouten nog steeds fouttellers
verhogen en foutmeldingen activeren.

## Planning

### Eenmalige taken

`--at <datetime>` plant een eenmalige uitvoering. Datums/tijden zonder offset worden behandeld als UTC, tenzij je ook `--tz <iana>` opgeeft; dan wordt de kloktijd in de opgegeven tijdzone geïnterpreteerd.

<Note>
Eenmalige taken worden na succes standaard verwijderd. Gebruik `--keep-after-run` om ze te behouden.
</Note>

### Terugkerende taken

Terugkerende taken gebruiken exponentiële retry-backoff na opeenvolgende fouten: 30s, 1m, 5m, 15m, 60m. De planning keert terug naar normaal na de volgende geslaagde uitvoering.

Overgeslagen uitvoeringen worden apart van uitvoeringsfouten bijgehouden. Ze beïnvloeden retry-backoff niet, maar `openclaw cron edit <job-id> --failure-alert-include-skipped` kan foutmeldingen laten deelnemen aan herhaalde meldingen over overgeslagen uitvoeringen.

Voor geïsoleerde taken die op een lokaal geconfigureerde modelprovider zijn gericht, voert Cron een lichte provider-preflight uit voordat de agentbeurt start. Loopback-, privénetwerk- en `.local`-providers met `api: "ollama"` worden op `/api/tags` gepeild; lokale OpenAI-compatibele providers zoals vLLM, SGLang en LM Studio worden op `/models` gepeild. Als het eindpunt onbereikbaar is, wordt de uitvoering vastgelegd als `skipped` en later volgens de planning opnieuw geprobeerd; overeenkomende dode eindpunten worden 5 minuten gecachet om te voorkomen dat veel taken dezelfde lokale server bestoken.

Opmerking: definities van Cron-taken staan in `jobs.json`, terwijl tijdelijke runtimestatus in `jobs-state.json` staat. Als `jobs.json` extern wordt bewerkt, laadt de Gateway gewijzigde planningen opnieuw en wist verouderde tijdelijke slots; herschrijvingen die alleen opmaak wijzigen, wissen het tijdelijke slot niet.

### Handmatige uitvoeringen

`openclaw cron run` keert terug zodra de handmatige uitvoering in de wachtrij is geplaatst. Geslaagde reacties bevatten `{ ok: true, enqueued: true, runId }`. Gebruik `openclaw cron runs --id <job-id>` om de uiteindelijke uitkomst te volgen.

<Note>
`openclaw cron run <job-id>` forceert standaard een uitvoering. Gebruik `--due` om het oudere gedrag "alleen uitvoeren als de taak aan de beurt is" te behouden.
</Note>

## Modellen

`cron add|edit --model <ref>` selecteert een toegestaan model voor de taak.

<Warning>
Als het model niet is toegestaan of niet kan worden opgelost, laat Cron de uitvoering mislukken met een expliciete validatiefout in plaats van terug te vallen op de agent van de taak of de standaardmodelselectie.
</Warning>

Cron `--model` is een **primaire taakinstelling**, geen `/model`-overschrijving voor een chatsessie. Dat betekent:

- Geconfigureerde modelfallbacks blijven van toepassing wanneer het geselecteerde taakmodel mislukt.
- Per-taakpayload `fallbacks` vervangt de geconfigureerde fallbacklijst wanneer aanwezig.
- Een lege per-taakfallbacklijst (`fallbacks: []` in de taakpayload/API) maakt de Cron-uitvoering strikt.
- Wanneer een taak `--model` heeft maar er geen fallbacklijst is geconfigureerd, geeft OpenClaw een expliciete lege fallback-overschrijving door, zodat de primaire agent niet als verborgen retry-doel wordt toegevoegd.

### Modelvoorrang voor geïsoleerde Cron

Geïsoleerde Cron lost het actieve model in deze volgorde op:

1. Gmail-hook-overschrijving.
2. Per-taak `--model`.
3. Opgeslagen modeloverschrijving voor Cron-sessie (wanneer de gebruiker er een heeft geselecteerd).
4. Agent- of standaardmodelselectie.

### Snelle modus

De snelle modus van geïsoleerde Cron volgt de opgeloste live modelselectie. Modelconfiguratie `params.fastMode` is standaard van toepassing, maar een opgeslagen sessieoverschrijving `fastMode` heeft nog steeds voorrang op configuratie.

### Retries bij live modelwissel

Als een geïsoleerde uitvoering `LiveSessionModelSwitchError` werpt, bewaart Cron de gewisselde provider en het gewisselde model (en de gewisselde auth-profieloverschrijving wanneer aanwezig) voor de actieve uitvoering voordat opnieuw wordt geprobeerd. De buitenste retrylus is begrensd op twee wisselretries na de eerste poging en breekt daarna af in plaats van oneindig te blijven lopen.

## Uitvoer en weigeringen van uitvoeringen

### Onderdrukking van verouderde bevestigingen

Geïsoleerde Cron-beurten onderdrukken verouderde reacties die alleen een bevestiging zijn. Als het eerste resultaat slechts een tijdelijke statusupdate is en geen afgeleide subagentuitvoering verantwoordelijk is voor het uiteindelijke antwoord, prompt Cron één keer opnieuw voor het echte resultaat vóór levering.

### Onderdrukking van stille tokens

Als een geïsoleerde Cron-uitvoering alleen het stille token (`NO_REPLY` of `no_reply`) retourneert, onderdrukt Cron zowel rechtstreekse uitgaande levering als het fallbackpad voor samenvattingen in de wachtrij, zodat er niets terug naar chat wordt geplaatst.

### Gestructureerde weigeringen

Geïsoleerde Cron-uitvoeringen geven de voorkeur aan gestructureerde metadata voor uitvoeringsweigeringen uit de ingebedde uitvoering en vallen daarna terug op bekende weigeringsmarkeringen in de uiteindelijke uitvoer, zoals `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` en weigeringszinnen voor goedkeuringskoppeling.

`cron list` en uitvoeringsgeschiedenis tonen de reden van weigering in plaats van een geblokkeerde opdracht als `ok` te rapporteren.

## Bewaarbeleid

Bewaarbeleid en opschoning worden in de configuratie beheerd:

- `cron.sessionRetention` (standaard `24h`) schoont voltooide geïsoleerde uitvoeringssessies op.
- `cron.runLog.maxBytes` en `cron.runLog.keepLines` schonen `~/.openclaw/cron/runs/<jobId>.jsonl` op.

## Oudere taken migreren

<Note>
Als je Cron-taken hebt van vóór de huidige leverings- en opslagindeling, voer dan `openclaw doctor --fix` uit. Doctor normaliseert oude Cron-velden (`jobId`, `schedule.cron`, leveringsvelden op topniveau inclusief oude `threadId`, payload-`provider`-leveringsaliassen) en migreert eenvoudige Webhook-fallbacktaken met `notify: true` naar expliciete Webhook-levering wanneer `cron.webhook` is geconfigureerd.
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

`--light-context` is alleen van toepassing op geïsoleerde agentbeurttaken. Voor Cron-uitvoeringen houdt de lichte modus de bootstrapcontext leeg in plaats van de volledige bootstrapset van de werkruimte te injecteren.

## Veelvoorkomende beheeropdrachten

Handmatige uitvoering en inspectie:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs`-vermeldingen bevatten leveringsdiagnostiek met het beoogde Cron-doel, het opgeloste doel, verzendingen via de berichttool, fallbackgebruik en geleverde status.

Agent en sessie opnieuw richten:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

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
