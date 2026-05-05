---
read_when:
    - Je wilt geplande taken en wekacties
    - Je debugt Cron-uitvoering en logs
summary: CLI-referentie voor `openclaw cron` (achtergrondtaken plannen en uitvoeren)
title: Cron
x-i18n:
    generated_at: "2026-05-05T06:16:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 804efac75b8653b03cec197247be847498e084b50b00fb7bd3fbd94067ef25d4
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Beheer Cron-taken voor de Gateway-planner.

<Tip>
Voer `openclaw cron --help` uit voor het volledige commandobereik. Zie [Cron-taken](/nl/automation/cron-jobs) voor de conceptuele handleiding.
</Tip>

## Sessies

`--session` accepteert `main`, `isolated`, `current` of `session:<id>`.

<AccordionGroup>
  <Accordion title="Sessiesleutels">
    - `main` koppelt aan de hoofdsessie van de agent.
    - `isolated` maakt voor elke run een nieuw transcript en een nieuwe sessie-id.
    - `current` koppelt aan de actieve sessie op het moment van aanmaken.
    - `session:<id>` zet vast op een expliciete permanente sessiesleutel.

  </Accordion>
  <Accordion title="Semantiek van geïsoleerde sessies">
    Geïsoleerde runs resetten de omgevingscontext van het gesprek. Kanaal- en groepsroutering, verzend-/wachtrijbeleid, verhoging, oorsprong en ACP-runtimebinding worden gereset voor de nieuwe run. Veilige voorkeuren en expliciet door de gebruiker geselecteerde model- of auth-overschrijvingen kunnen tussen runs worden meegenomen.
  </Accordion>
</AccordionGroup>

## Aflevering

`openclaw cron list` en `openclaw cron show <job-id>` tonen een voorbeeld van de opgeloste afleverroute. Voor `channel: "last"` laat het voorbeeld zien of de route is opgelost vanuit de hoofd- of huidige sessie, of gesloten zal falen.

Doelen met providervoorvoegsel kunnen onopgeloste aankondigingskanalen verduidelijken. Bijvoorbeeld: `to: "telegram:123"` selecteert Telegram wanneer `delivery.channel` is weggelaten of `last` is. Alleen voorvoegsels die door de geladen Plugin worden geadverteerd, zijn providerselectoren. Als `delivery.channel` expliciet is, moet het voorvoegsel overeenkomen met dat kanaal; `channel: "whatsapp"` met `to: "telegram:123"` wordt geweigerd. Servicevoorvoegsels zoals `imessage:` en `sms:` blijven kanaal-eigen doelsyntaxis.

<Note>
Geïsoleerde `cron add`-taken gebruiken standaard `--announce`-aflevering. Gebruik `--no-deliver` om uitvoer intern te houden. `--deliver` blijft beschikbaar als verouderde alias voor `--announce`.
</Note>

### Eigenaarschap van aflevering

Geïsoleerde Cron-chataflevering wordt gedeeld tussen de agent en de runner:

- De agent kan rechtstreeks verzenden met de `message`-tool wanneer er een chatroute beschikbaar is.
- `announce` levert als fallback alleen het eindantwoord af wanneer de agent niet rechtstreeks naar het opgeloste doel heeft verzonden.
- `webhook` plaatst de voltooide payload op een URL.
- `none` schakelt fallbackaflevering door de runner uit.

`--announce` is fallbackaflevering door de runner voor het eindantwoord. `--no-deliver` schakelt die fallback uit, maar verwijdert de `message`-tool van de agent niet wanneer er een chatroute beschikbaar is.

Herinneringen die vanuit een actieve chat worden aangemaakt, behouden het live chatafleverdoel voor fallback-aankondigingsaflevering. Interne sessiesleutels kunnen kleine letters gebruiken; gebruik ze niet als bron van waarheid voor hoofdlettergevoelige provider-ID's, zoals Matrix-kamer-ID's.

### Aflevering bij fouten

Foutmeldingen worden in deze volgorde opgelost:

1. `delivery.failureDestination` op de taak.
2. Globale `cron.failureDestination`.
3. Het primaire aankondigingsdoel van de taak (wanneer geen expliciete foutbestemming is ingesteld).

<Note>
Hoofdsessietaken mogen `delivery.failureDestination` alleen gebruiken wanneer de primaire aflevermodus `webhook` is. Geïsoleerde taken accepteren dit in alle modi.
</Note>

Opmerking: geïsoleerde Cron-runs behandelen agentfouten op runniveau als taakfouten, zelfs wanneer
er geen antwoordpayload wordt geproduceerd, zodat model-/providerfouten nog steeds fouttellers
verhogen en foutmeldingen activeren.

## Planning

### Eenmalige taken

`--at <datetime>` plant een eenmalige run. Datums en tijden zonder offset worden behandeld als UTC, tenzij je ook `--tz <iana>` meegeeft; daarmee wordt de kloktijd in de opgegeven tijdzone geïnterpreteerd.

<Note>
Eenmalige taken worden standaard na succes verwijderd. Gebruik `--keep-after-run` om ze te behouden.
</Note>

### Terugkerende taken

Terugkerende taken gebruiken exponentiële retry-backoff na opeenvolgende fouten: 30s, 1m, 5m, 15m, 60m. De planning keert terug naar normaal na de volgende succesvolle run.

Overgeslagen runs worden apart bijgehouden van uitvoeringsfouten. Ze beïnvloeden de retry-backoff niet, maar met `openclaw cron edit <job-id> --failure-alert-include-skipped` kunnen foutmeldingen worden ingesteld om herhaalde meldingen over overgeslagen runs op te nemen.

Voor geïsoleerde taken die een lokaal geconfigureerde modelprovider targeten, voert Cron een lichte providerpreflight uit voordat de agentbeurt start. Loopback-, privénetwerk- en `.local`-providers met `api: "ollama"` worden geprobed op `/api/tags`; lokale OpenAI-compatibele providers zoals vLLM, SGLang en LM Studio worden geprobed op `/models`. Als het endpoint onbereikbaar is, wordt de run vastgelegd als `skipped` en later opnieuw geprobeerd volgens de planning; overeenkomende dode endpoints worden 5 minuten gecachet om te voorkomen dat veel taken dezelfde lokale server bestoken.

Opmerking: Cron-taakdefinities staan in `jobs.json`, terwijl wachtende runtimestatus in `jobs-state.json` staat. Als `jobs.json` extern wordt bewerkt, herlaadt de Gateway gewijzigde planningen en wist hij verouderde wachtende slots; herschrijvingen die alleen de opmaak wijzigen, wissen het wachtende slot niet.

### Handmatige runs

`openclaw cron run` keert terug zodra de handmatige run in de wachtrij staat. Succesvolle responses bevatten `{ ok: true, enqueued: true, runId }`. Gebruik `openclaw cron runs --id <job-id>` om het uiteindelijke resultaat te volgen.

<Note>
`openclaw cron run <job-id>` forceert standaard een run. Gebruik `--due` om het oudere gedrag "alleen uitvoeren als de taak verschuldigd is" te behouden.
</Note>

## Modellen

`cron add|edit --model <ref>` selecteert een toegestaan model voor de taak.

<Warning>
Als het model niet is toegestaan of niet kan worden opgelost, laat Cron de run mislukken met een expliciete validatiefout in plaats van terug te vallen op de agent of de standaardmodelselectie van de taak.
</Warning>

Cron `--model` is een **taakprimaire instelling**, geen `/model`-overschrijving voor chatsessies. Dat betekent:

- Geconfigureerde modelfallbacks blijven van toepassing wanneer het geselecteerde taakmodel faalt.
- Per-taakpayload `fallbacks` vervangt de geconfigureerde fallbacklijst wanneer aanwezig.
- Een lege per-taakfallbacklijst (`fallbacks: []` in de taakpayload/API) maakt de Cron-run strikt.
- Wanneer een taak `--model` heeft maar er geen fallbacklijst is geconfigureerd, geeft OpenClaw een expliciete lege fallbackoverschrijving door, zodat het primaire agentmodel niet als verborgen retrydoel wordt toegevoegd.

### Modelprioriteit voor geïsoleerde Cron

Geïsoleerde Cron lost het actieve model in deze volgorde op:

1. Gmail-hookoverschrijving.
2. Per-taak `--model`.
3. Opgeslagen Cron-sessiemodeloverschrijving (wanneer de gebruiker er een heeft geselecteerd).
4. Agent- of standaardmodelselectie.

### Snelle modus

De snelle modus van geïsoleerde Cron volgt de opgeloste live modelselectie. Modelconfiguratie `params.fastMode` is standaard van toepassing, maar een opgeslagen sessie-overschrijving `fastMode` heeft nog steeds voorrang op de configuratie.

### Retries bij live modelwissels

Als een geïsoleerde run `LiveSessionModelSwitchError` gooit, bewaart Cron de gewisselde provider en het gewisselde model (en de gewisselde auth-profieloverschrijving wanneer aanwezig) voor de actieve run voordat opnieuw wordt geprobeerd. De buitenste retrylus is begrensd op twee wisselretries na de eerste poging en breekt daarna af in plaats van oneindig door te lopen.

## Runuitvoer en weigeringen

### Onderdrukking van verouderde bevestigingen

Geïsoleerde Cron-beurten onderdrukken verouderde antwoorden die alleen uit een bevestiging bestaan. Als het eerste resultaat slechts een tussentijdse statusupdate is en geen afstammende subagent-run verantwoordelijk is voor het uiteindelijke antwoord, vraagt Cron één keer opnieuw om het echte resultaat vóór aflevering.

### Onderdrukking van stil token

Als een geïsoleerde Cron-run alleen het stille token (`NO_REPLY` of `no_reply`) retourneert, onderdrukt Cron zowel directe uitgaande aflevering als het fallbackpad met een samenvatting in de wachtrij, zodat er niets terug naar de chat wordt geplaatst.

### Gestructureerde weigeringen

Geïsoleerde Cron-runs geven de voorkeur aan gestructureerde metadata voor uitvoeringsweigering uit de ingesloten run en vallen daarna terug op bekende weigeringsmarkeringen in de einduitvoer, zoals `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` en weigeringszinnen voor approval-binding.

`cron list` en de runhistorie tonen de weigeringsreden in plaats van een geblokkeerde opdracht als `ok` te rapporteren.

## Bewaring

Bewaring en opschoning worden in de configuratie geregeld:

- `cron.sessionRetention` (standaard `24h`) schoont voltooide geïsoleerde runsessies op.
- `cron.runLog.maxBytes` en `cron.runLog.keepLines` schonen `~/.openclaw/cron/runs/<jobId>.jsonl` op.

## Oudere taken migreren

<Note>
Als je Cron-taken hebt van vóór de huidige afleverings- en opslagindeling, voer dan `openclaw doctor --fix` uit. Doctor normaliseert verouderde Cron-velden (`jobId`, `schedule.cron`, aflevervelden op topniveau inclusief verouderde `threadId`, payload-`provider`-afleveraliassen) en migreert eenvoudige webhookfallbacktaken met `notify: true` naar expliciete webhookaflevering wanneer `cron.webhook` is geconfigureerd.
</Note>

## Veelvoorkomende bewerkingen

Werk afleverinstellingen bij zonder het bericht te wijzigen:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Schakel aflevering uit voor een geïsoleerde taak:

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
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` is alleen van toepassing op geïsoleerde agentbeurttaken. Voor Cron-runs houdt de lichte modus de bootstrapcontext leeg in plaats van de volledige workspace-bootstrapset te injecteren.

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

`cron runs`-items bevatten afleverdiagnostiek met het beoogde Cron-doel, het opgeloste doel, verzendingen via de message-tool, fallbackgebruik en afgeleverde status.

Agent en sessie opnieuw targeten:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` waarschuwt wanneer `--agent` is weggelaten bij agentbeurttaken en valt terug op de standaardagent (`main`). Geef `--agent <id>` mee bij het aanmaken om een specifieke agent vast te zetten.

Aflevering aanpassen:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Geplande taken](/nl/automation/cron-jobs)
