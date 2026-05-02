---
read_when:
    - Je wilt geplande taken en wekmomenten
    - Je debugt Cron-uitvoering en logs
summary: CLI-referentie voor `openclaw cron` (achtergrondtaken plannen en uitvoeren)
title: Cron
x-i18n:
    generated_at: "2026-05-02T11:11:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 298ac3fc868462eb301febbc1aa5296d8087cad7fdc466870487081444c5856f
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
    - `isolated` maakt voor elke uitvoering een nieuw transcript en nieuwe sessie-id aan.
    - `current` koppelt aan de actieve sessie op het moment van aanmaken.
    - `session:<id>` zet vast op een expliciete persistente sessiesleutel.

  </Accordion>
  <Accordion title="Semantiek van geïsoleerde sessies">
    Geïsoleerde uitvoeringen resetten de omgevingscontext van het gesprek. Routering voor kanaal en groep, verzend-/wachtrijbeleid, elevatie, herkomst en ACP-runtimebinding worden gereset voor de nieuwe uitvoering. Veilige voorkeuren en expliciete door de gebruiker geselecteerde model- of auth-overschrijvingen kunnen tussen uitvoeringen worden meegenomen.
  </Accordion>
</AccordionGroup>

## Aflevering

`openclaw cron list` en `openclaw cron show <job-id>` tonen een voorbeeld van de opgeloste afleverroute. Voor `channel: "last"` toont het voorbeeld of de route is opgelost vanuit de hoofd- of huidige sessie, of gesloten zal falen.

Doelen met providerprefix kunnen onopgeloste aankondigingskanalen ondubbelzinnig maken. Bijvoorbeeld: `to: "telegram:123"` selecteert Telegram wanneer `delivery.channel` is weggelaten of `last` is. Alleen prefixen die door de geladen plugin worden aangekondigd, zijn providerselectors. Als `delivery.channel` expliciet is, moet de prefix met dat kanaal overeenkomen; `channel: "whatsapp"` met `to: "telegram:123"` wordt geweigerd. Serviceprefixen zoals `imessage:` en `sms:` blijven kanaaleigen doelsyntaxis.

<Note>
Geïsoleerde `cron add`-taken gebruiken standaard `--announce`-aflevering. Gebruik `--no-deliver` om uitvoer intern te houden. `--deliver` blijft beschikbaar als verouderde alias voor `--announce`.
</Note>

### Eigenaarschap van aflevering

Chat-aflevering voor geïsoleerde Cron is gedeeld tussen de agent en de runner:

- De agent kan rechtstreeks verzenden met het hulpmiddel `message` wanneer er een chatroute beschikbaar is.
- `announce` levert de uiteindelijke reactie alleen als fallback af wanneer de agent niet rechtstreeks naar het opgeloste doel heeft verzonden.
- `webhook` plaatst de voltooide payload op een URL.
- `none` schakelt fallback-aflevering door de runner uit.

`--announce` is fallback-aflevering door de runner voor de uiteindelijke reactie. `--no-deliver` schakelt die fallback uit, maar verwijdert het hulpmiddel `message` van de agent niet wanneer er een chatroute beschikbaar is.

Herinneringen die vanuit een actieve chat zijn gemaakt, behouden het live chat-afleverdoel voor fallback-aankondigingsaflevering. Interne sessiesleutels kunnen kleine letters gebruiken; gebruik ze niet als bron van waarheid voor hoofdlettergevoelige provider-id's zoals Matrix-ruimte-id's.

### Aflevering bij fouten

Foutmeldingen worden in deze volgorde opgelost:

1. `delivery.failureDestination` op de taak.
2. Globale `cron.failureDestination`.
3. Het primaire aankondigingsdoel van de taak (wanneer er geen expliciete foutbestemming is ingesteld).

<Note>
Taken in de hoofdsessie mogen `delivery.failureDestination` alleen gebruiken wanneer de primaire aflevermodus `webhook` is. Geïsoleerde taken accepteren dit in alle modi.
</Note>

Opmerking: geïsoleerde Cron-uitvoeringen behandelen agentfouten op uitvoeringsniveau als taakfouten, zelfs wanneer
er geen reactiepayload wordt geproduceerd, zodat model-/providerfouten nog steeds fouttellers verhogen
en foutmeldingen activeren.

## Planning

### Eenmalige taken

`--at <datetime>` plant een eenmalige uitvoering. Datums/tijden zonder offset worden als UTC behandeld, tenzij je ook `--tz <iana>` meegeeft; dan wordt de kloktijd in de opgegeven tijdzone geïnterpreteerd.

<Note>
Eenmalige taken worden standaard verwijderd na succes. Gebruik `--keep-after-run` om ze te behouden.
</Note>

### Terugkerende taken

Terugkerende taken gebruiken exponentiële retry-backoff na opeenvolgende fouten: 30s, 1m, 5m, 15m, 60m. De planning keert terug naar normaal na de volgende geslaagde uitvoering.

Overgeslagen uitvoeringen worden apart bijgehouden van uitvoeringsfouten. Ze beïnvloeden retry-backoff niet, maar `openclaw cron edit <job-id> --failure-alert-include-skipped` kan foutmeldingen laten meedoen aan herhaalde meldingen over overgeslagen uitvoeringen.

Voor geïsoleerde taken die gericht zijn op een lokaal geconfigureerde modelprovider voert Cron een lichte provider-preflight uit voordat de agentbeurt start. Providers voor loopback, privénetwerk en `.local` met `api: "ollama"` worden gepeild op `/api/tags`; lokale OpenAI-compatibele providers zoals vLLM, SGLang en LM Studio worden gepeild op `/models`. Als het eindpunt onbereikbaar is, wordt de uitvoering geregistreerd als `skipped` en opnieuw geprobeerd volgens een latere planning; overeenkomende dode eindpunten worden 5 minuten gecachet om te voorkomen dat veel taken dezelfde lokale server bestoken.

Opmerking: Cron-taakdefinities staan in `jobs.json`, terwijl de hangende runtimestatus in `jobs-state.json` staat. Als `jobs.json` extern wordt bewerkt, laadt de Gateway gewijzigde planningen opnieuw en wist hij verouderde hangende slots; herschrijvingen die alleen opmaak wijzigen, wissen het hangende slot niet.

### Handmatige uitvoeringen

`openclaw cron run` keert terug zodra de handmatige uitvoering in de wachtrij staat. Geslaagde reacties bevatten `{ ok: true, enqueued: true, runId }`. Gebruik `openclaw cron runs --id <job-id>` om de uiteindelijke uitkomst te volgen.

<Note>
`openclaw cron run <job-id>` forceert standaard een uitvoering. Gebruik `--due` om het oudere gedrag "alleen uitvoeren als deze verschuldigd is" te behouden.
</Note>

## Modellen

`cron add|edit --model <ref>` selecteert een toegestaan model voor de taak.

<Warning>
Als het model niet is toegestaan of niet kan worden opgelost, laat Cron de uitvoering mislukken met een expliciete validatiefout in plaats van terug te vallen op de agent- of standaardmodelselectie van de taak.
</Warning>

Cron `--model` is een **primaire taakinstelling**, geen `/model`-overschrijving voor chatsessies. Dat betekent:

- Geconfigureerde modelfallbacks blijven van toepassing wanneer het geselecteerde taakmodel faalt.
- Per-taakpayload `fallbacks` vervangt de geconfigureerde fallbacklijst wanneer aanwezig.
- Een lege per-taakfallbacklijst (`fallbacks: []` in de taakpayload/API) maakt de Cron-uitvoering strikt.
- Wanneer een taak `--model` heeft maar er geen fallbacklijst is geconfigureerd, geeft OpenClaw een expliciete lege fallback-overschrijving door, zodat de primaire agent niet wordt toegevoegd als verborgen retry-doel.

### Modelprioriteit voor geïsoleerde Cron

Geïsoleerde Cron lost het actieve model in deze volgorde op:

1. Gmail-hookoverschrijving.
2. Per-taak `--model`.
3. Opgeslagen modeloverschrijving voor de Cron-sessie (wanneer de gebruiker er een heeft geselecteerd).
4. Agent- of standaardmodelselectie.

### Snelle modus

De snelle modus voor geïsoleerde Cron volgt de opgeloste live modelselectie. Modelconfiguratie `params.fastMode` is standaard van toepassing, maar een opgeslagen sessieoverschrijving `fastMode` wint nog steeds van de configuratie.

### Retries bij live modelwisseling

Als een geïsoleerde uitvoering `LiveSessionModelSwitchError` gooit, bewaart Cron de gewisselde provider en het gewisselde model (en de gewisselde auth-profieloverschrijving wanneer aanwezig) voor de actieve uitvoering voordat opnieuw wordt geprobeerd. De buitenste retrylus is begrensd op twee wisselretries na de eerste poging en breekt daarna af in plaats van eindeloos te blijven herhalen.

## Uitvoer van uitvoeringen en weigeringen

### Onderdrukking van verouderde bevestigingen

Geïsoleerde Cron-beurten onderdrukken verouderde reacties die alleen een bevestiging bevatten. Als het eerste resultaat slechts een tussentijdse statusupdate is en geen afstammende subagentuitvoering verantwoordelijk is voor het uiteindelijke antwoord, vraagt Cron één keer opnieuw om het echte resultaat vóór aflevering.

### Onderdrukking van stille tokens

Als een geïsoleerde Cron-uitvoering alleen het stille token (`NO_REPLY` of `no_reply`) retourneert, onderdrukt Cron zowel rechtstreekse uitgaande aflevering als het fallbackpad met wachtrijsamenvatting, zodat er niets terug naar de chat wordt geplaatst.

### Gestructureerde weigeringen

Geïsoleerde Cron-uitvoeringen geven de voorkeur aan gestructureerde metadata voor uitvoeringsweigeringen uit de ingebedde uitvoering en vallen daarna terug op bekende weigeringsmarkeringen in de uiteindelijke uitvoer, zoals `SYSTEM_RUN_DENIED`, `INVALID_REQUEST` en weigeringszinnen voor goedkeuringsbinding.

`cron list` en de uitvoeringsgeschiedenis tonen de weigeringsreden in plaats van een geblokkeerde opdracht als `ok` te rapporteren.

## Bewaartermijn

Bewaartermijn en opschoning worden beheerd in de configuratie:

- `cron.sessionRetention` (standaard `24h`) schoont voltooide geïsoleerde uitvoeringssessies op.
- `cron.runLog.maxBytes` en `cron.runLog.keepLines` schonen `~/.openclaw/cron/runs/<jobId>.jsonl` op.

## Oudere taken migreren

<Note>
Als je Cron-taken hebt van vóór de huidige aflever- en opslagindeling, voer dan `openclaw doctor --fix` uit. Doctor normaliseert verouderde Cron-velden (`jobId`, `schedule.cron`, top-level aflevervelden inclusief verouderde `threadId`, payload-aliassen voor `provider`-aflevering) en migreert eenvoudige `notify: true` webhook-fallbacktaken naar expliciete webhook-aflevering wanneer `cron.webhook` is geconfigureerd.
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

`--light-context` is alleen van toepassing op geïsoleerde agentbeurttaken. Voor Cron-uitvoeringen houdt de lichte modus de bootstrapcontext leeg in plaats van de volledige bootstrapset voor de werkruimte te injecteren.

## Veelvoorkomende beheerdersopdrachten

Handmatige uitvoering en inspectie:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs`-items bevatten afleverdiagnostiek met het beoogde Cron-doel, het opgeloste doel, verzendingen via de message-tool, fallbackgebruik en afgeleverde status.

Agent- en sessieherroutering:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` waarschuwt wanneer `--agent` wordt weggelaten op agentbeurttaken en valt terug op de standaardagent (`main`). Geef `--agent <id>` mee bij het aanmaken om een specifieke agent vast te zetten.

Afleveraanpassingen:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Geplande taken](/nl/automation/cron-jobs)
