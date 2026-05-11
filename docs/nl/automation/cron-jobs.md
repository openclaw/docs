---
read_when:
    - Achtergrondtaken of wekmomenten plannen
    - Externe triggers (webhooks, Gmail) koppelen aan OpenClaw
    - Kiezen tussen Heartbeat en Cron voor geplande taken
sidebarTitle: Scheduled tasks
summary: Geplande taken, webhooks en Gmail PubSub-triggers voor de Gateway-planner
title: Geplande taken
x-i18n:
    generated_at: "2026-05-11T20:20:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56af55d8151b22dedb5ad02c2eb5e706711e1435c806dbc2e2ef71b13ebde3b9
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron is de ingebouwde scheduler van de Gateway. Deze bewaart taken, wekt de agent op het juiste moment en kan uitvoer terugsturen naar een chatkanaal of Webhook-eindpunt.

## Snelstart

<Steps>
  <Step title="Add a one-shot reminder">
    ```bash
    openclaw cron add \
      --name "Reminder" \
      --at "2026-02-01T16:00:00Z" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Check your jobs">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="See run history">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Hoe Cron werkt

- Cron draait **binnen het Gateway**-proces (niet binnen het model).
- Taakdefinities blijven bewaard in `~/.openclaw/cron/jobs.json`, zodat schema's niet verloren gaan bij herstarts.
- De uitvoeringsstatus tijdens runtime blijft ernaast bewaard in `~/.openclaw/cron/jobs-state.json`. Als je Cron-definities in git bijhoudt, houd dan `jobs.json` bij en voeg `jobs-state.json` toe aan gitignore.
- Na de splitsing kunnen oudere OpenClaw-versies `jobs.json` lezen, maar ze kunnen taken als nieuw behandelen omdat runtimevelden nu in `jobs-state.json` staan.
- Wanneer `jobs.json` wordt bewerkt terwijl de Gateway draait of is gestopt, vergelijkt OpenClaw de gewijzigde schemavelden met metadata van openstaande runtime-slots en wist het verouderde `nextRunAtMs`-waarden. Herschrijvingen die alleen formattering of sleutelvolgorde wijzigen, behouden het openstaande slot.
- Alle Cron-uitvoeringen maken [achtergrondtaak](/nl/automation/tasks)-records aan.
- Bij het starten van de Gateway worden achterstallige geïsoleerde agent-turn-taken opnieuw ingepland buiten het kanaalverbindingsvenster in plaats van onmiddellijk opnieuw afgespeeld, zodat het opstarten van Discord/Telegram en de installatie van native commando's responsief blijven na herstarts.
- Eenmalige taken (`--at`) worden na succes standaard automatisch verwijderd.
- Geïsoleerde Cron-runs sluiten, naar beste vermogen, bijgehouden browsertabs/processen voor hun `cron:<jobId>`-sessie wanneer de run is voltooid, zodat losgekoppelde browserautomatisering geen verweesde processen achterlaat.
- Geïsoleerde Cron-runs die de beperkte Cron-zelfopschoningsgrant ontvangen, kunnen nog steeds de schedulerstatus lezen, een op zichzelf gefilterde lijst van hun huidige taak en de runhistorie van die taak, zodat status-/Heartbeat-controles hun eigen schema kunnen inspecteren zonder bredere toegang tot Cron-mutaties te krijgen.
- Geïsoleerde Cron-runs beschermen ook tegen verouderde bevestigingsantwoorden. Als het eerste resultaat slechts een tussentijdse statusupdate is (`on it`, `pulling everything together` en vergelijkbare hints) en geen onderliggende subagent-run nog verantwoordelijk is voor het definitieve antwoord, vraagt OpenClaw één keer opnieuw om het daadwerkelijke resultaat voordat het wordt afgeleverd.
- Geïsoleerde Cron-runs geven de voorkeur aan gestructureerde metadata voor uitvoeringsweigering uit de ingebedde run, en vallen daarna terug op bekende definitieve samenvattings-/uitvoermarkeringen zoals `SYSTEM_RUN_DENIED` en `INVALID_REQUEST`, zodat een geblokkeerd commando niet als een geslaagde run wordt gerapporteerd.
- Geïsoleerde Cron-runs behandelen fouten op runniveau van agents ook als taakfouten, zelfs wanneer er geen antwoordpayload wordt geproduceerd, zodat model-/providerfouten fouttellers verhogen en foutmeldingen activeren in plaats van de taak als succesvol af te ronden.
- Wanneer een geïsoleerde agent-turn-taak `timeoutSeconds` bereikt, breekt Cron de onderliggende agent-run af en geeft die een kort opschoningsvenster. Als de run niet leegloopt, wist door de Gateway beheerde opschoning geforceerd het sessie-eigenaarschap van die run voordat Cron de time-out vastlegt, zodat in de wachtrij geplaatst chatwerk niet achterblijft achter een verouderde verwerkende sessie.
- Als een geïsoleerde agent-turn vastloopt voordat de runner start of vóór de eerste modelaanroep, registreert Cron een fasespecifieke time-out zoals `setup timed out before runner start` of `stalled before first model call (last phase: context-engine)`. Deze watchdogs dekken ingebedde providers en CLI-ondersteunde providers voordat hun externe CLI-proces daadwerkelijk is gestart, en worden onafhankelijk begrensd van lange `timeoutSeconds`-waarden, zodat cold-start-/auth-/contextfouten snel zichtbaar worden in plaats van te wachten op het volledige taakbudget.

<a id="maintenance"></a>

<Note>
Taakreconciliatie voor Cron is eerst runtime-eigendom en daarna ondersteund door duurzame historie: een actieve Cron-taak blijft live zolang de Cron-runtime die taak nog als actief bijhoudt, zelfs als er nog een oude onderliggende sessierij bestaat. Zodra de runtime de taak niet meer bezit en het respijtvenster van 5 minuten verloopt, controleert onderhoud de bewaarde runlogs en taakstatus voor de overeenkomende `cron:<jobId>:<startedAt>`-run. Als die duurzame historie een terminaal resultaat toont, wordt het taakregister daarmee afgerond; anders kan door de Gateway beheerd onderhoud de taak als `lost` markeren. Offline CLI-audit kan herstellen vanuit duurzame historie, maar behandelt zijn eigen lege actieve-taakset in het proces niet als bewijs dat een door de Gateway beheerde Cron-run verdwenen is.
</Note>

## Schematypen

| Soort   | CLI-vlag  | Beschrijving                                            |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Eenmalige tijdstempel (ISO 8601 of relatief zoals `20m`) |
| `every` | `--every` | Vast interval                                           |
| `cron`  | `--cron`  | Cron-expressie met 5 of 6 velden met optionele `--tz`   |

Tijdstempels zonder tijdzone worden als UTC behandeld. Voeg `--tz America/New_York` toe voor planning op lokale kloktijd.

Terugkerende expressies op het hele uur worden automatisch tot maximaal 5 minuten gespreid om belastingpieken te verminderen. Gebruik `--exact` om precieze timing af te dwingen of `--stagger 30s` voor een expliciet venster.

### Dag-van-de-maand en dag-van-de-week gebruiken OR-logica

Cron-expressies worden geparseerd door [croner](https://github.com/Hexagon/croner). Wanneer zowel het veld voor dag-van-de-maand als dag-van-de-week geen wildcard is, matcht croner wanneer **een van beide** velden matcht, niet allebei. Dit is standaard Vixie-Cron-gedrag.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Dit vuurt ongeveer 5-6 keer per maand in plaats van 0-1 keer per maand. OpenClaw gebruikt hier het standaard OR-gedrag van Croner. Om beide voorwaarden te vereisen, gebruik je Croners `+`-modifier voor dag-van-de-week (`0 9 15 * +1`) of plan je op één veld en bewaak je het andere in de prompt of het commando van je taak.

## Uitvoeringsstijlen

| Stijl            | `--session`-waarde | Draait in                | Beste voor                     |
| ---------------- | ------------------ | ------------------------ | ------------------------------ |
| Hoofdsessie      | `main`             | Volgende Heartbeat-turn  | Herinneringen, systeemevents   |
| Geïsoleerd       | `isolated`         | Toegewijde `cron:<jobId>` | Rapporten, achtergrondtaken   |
| Huidige sessie   | `current`          | Gebonden bij aanmaak     | Terugkerend werk met context   |
| Aangepaste sessie | `session:custom-id` | Permanente benoemde sessie | Workflows die voortbouwen op historie |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    **Hoofdsessie**-taken plaatsen een systeemevent in de wachtrij en wekken optioneel de Heartbeat (`--wake now` of `--wake next-heartbeat`). Die systeemevents verlengen de dagelijks/inactief-resetfrisheid voor de doelsessie niet. **Geïsoleerde** taken draaien een toegewijde agent-turn met een nieuwe sessie. **Aangepaste sessies** (`session:xxx`) behouden context tussen runs, waardoor workflows zoals dagelijkse stand-ups kunnen voortbouwen op eerdere samenvattingen.
  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    Voor geïsoleerde taken betekent "nieuwe sessie" een nieuwe transcript-/sessie-id voor elke run. OpenClaw kan veilige voorkeuren meenemen, zoals instellingen voor thinking/fast/verbose, labels en expliciet door de gebruiker geselecteerde model-/auth-overschrijvingen, maar neemt geen omgevingscontext uit gesprekken over van een oudere Cron-rij: kanaal-/groepsroutering, verzend- of wachtrijbeleid, elevation, herkomst of ACP-runtimebinding. Gebruik `current` of `session:<id>` wanneer een terugkerende taak bewust moet voortbouwen op dezelfde gesprekscontext.
  </Accordion>
  <Accordion title="Runtime cleanup">
    Voor geïsoleerde taken omvat runtime-afbouw nu best-effort browseropschoning voor die Cron-sessie. Opschoningsfouten worden genegeerd, zodat het daadwerkelijke Cron-resultaat blijft gelden.

    Geïsoleerde Cron-runs verwijderen ook alle gebundelde MCP-runtime-instanties die voor de taak zijn gemaakt via het gedeelde runtime-opschoningspad. Dit komt overeen met hoe MCP-clients van hoofdsessies en aangepaste sessies worden afgebouwd, zodat geïsoleerde Cron-taken geen stdio-kindprocessen of langlevende MCP-verbindingen tussen runs lekken.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    Wanneer geïsoleerde Cron-runs subagents orkestreren, geeft aflevering ook de voorkeur aan de definitieve uitvoer van afstammelingen boven verouderde tussentijdse parent-tekst. Als afstammelingen nog draaien, onderdrukt OpenClaw die gedeeltelijke parent-update in plaats van die aan te kondigen.

    Voor tekst-only Discord-aankondigingsdoelen stuurt OpenClaw de canonieke definitieve assistenttekst één keer in plaats van zowel gestreamde/tussentijdse tekstpayloads als het definitieve antwoord opnieuw af te spelen. Media en gestructureerde Discord-payloads worden nog steeds als afzonderlijke payloads afgeleverd, zodat bijlagen en componenten niet worden weggelaten.

  </Accordion>
</AccordionGroup>

### Payloadopties voor geïsoleerde taken

<ParamField path="--message" type="string" required>
  Prompttekst (vereist voor geïsoleerd).
</ParamField>
<ParamField path="--model" type="string">
  Modeloverschrijving; gebruikt het geselecteerde toegestane model voor de taak.
</ParamField>
<ParamField path="--thinking" type="string">
  Overschrijving van thinking-niveau.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Sla injectie van workspace-bootstrapbestanden over.
</ParamField>
<ParamField path="--tools" type="string">
  Beperk welke tools de taak kan gebruiken, bijvoorbeeld `--tools exec,read`.
</ParamField>

`--model` gebruikt het geselecteerde toegestane model als primair model van die taak. Het is niet hetzelfde als een `/model`-overschrijving voor een chatsessie: geconfigureerde fallbackketens blijven van toepassing wanneer het primaire model van de taak faalt. Als het aangevraagde model niet is toegestaan of niet kan worden opgelost, laat Cron de run mislukken met een expliciete validatiefout in plaats van stil terug te vallen op de agent-/standaardmodelselectie van de taak.

Cron-taken kunnen ook `fallbacks` op payloadniveau bevatten. Wanneer aanwezig, vervangt die lijst de geconfigureerde fallbackketen voor de taak. Gebruik `fallbacks: []` in de taakpayload/API wanneer je een strikte Cron-run wilt die alleen het geselecteerde model probeert. Als een taak `--model` heeft maar geen payload- of geconfigureerde fallbacks, geeft OpenClaw een expliciete lege fallback-overschrijving door, zodat de primaire agent niet als verborgen extra retrydoel wordt toegevoegd.

Prioriteit voor modelselectie bij geïsoleerde taken is:

1. Gmail-hook-modeloverschrijving (wanneer de run uit Gmail kwam en die overschrijving is toegestaan)
2. Per-taak-payload `model`
3. Door de gebruiker geselecteerde opgeslagen modeloverschrijving voor de Cron-sessie
4. Agent-/standaardmodelselectie

Fast-modus volgt ook de opgeloste live selectie. Als de geselecteerde modelconfiguratie `params.fastMode` heeft, gebruikt geïsoleerde Cron die standaard. Een opgeslagen sessie-overschrijving voor `fastMode` wint nog steeds van configuratie in beide richtingen.

Als een geïsoleerde run een live model-switch-overdracht raakt, probeert Cron opnieuw met de overgeschakelde provider/het overgeschakelde model en bewaart het die live selectie voor de actieve run voordat het opnieuw probeert. Wanneer de switch ook een nieuw auth-profiel bevat, bewaart Cron die auth-profieloverschrijving ook voor de actieve run. Retries zijn begrensd: na de eerste poging plus 2 switch-retries breekt Cron af in plaats van eindeloos te blijven herhalen.

Voordat een geïsoleerde Cron-run de agent runner ingaat, controleert OpenClaw bereikbare lokale provider-eindpunten voor geconfigureerde `api: "ollama"`- en `api: "openai-completions"`-providers waarvan `baseUrl` local loopback, privénetwerk of `.local` is. Als dat eindpunt niet beschikbaar is, wordt de run geregistreerd als `skipped` met een duidelijke provider/model-fout in plaats van een modelaanroep te starten. Het eindpuntresultaat wordt 5 minuten gecachet, zodat veel geplande taken die dezelfde niet-beschikbare lokale Ollama-, vLLM-, SGLang- of LM Studio-server gebruiken één kleine probe delen in plaats van een storm aan aanvragen te veroorzaken. Overgeslagen provider-preflight-runs verhogen de backoff voor uitvoeringsfouten niet; schakel `failureAlert.includeSkipped` in wanneer je herhaalde skip-meldingen wilt.

## Levering en uitvoer

| Modus      | Wat er gebeurt                                                     |
| ---------- | ------------------------------------------------------------------ |
| `announce` | Levert definitieve tekst als fallback aan het doel als de agent niet heeft verzonden |
| `webhook`  | POST voltooide event-payload naar een URL                          |
| `none`     | Geen fallback-levering door de runner                              |

Gebruik `--announce --channel telegram --to "-1001234567890"` voor levering aan een kanaal. Gebruik voor Telegram-forumonderwerpen `-1001234567890:topic:123`; directe RPC/config-aanroepers kunnen ook `delivery.threadId` als string of getal doorgeven. Slack/Discord/Mattermost-doelen moeten expliciete prefixen gebruiken (`channel:<id>`, `user:<id>`). Matrix-room-ID's zijn hoofdlettergevoelig; gebruik de exacte room-ID of de vorm `room:!room:server` van Matrix.

Wanneer announce-levering `channel: "last"` gebruikt of `channel` weglaat, kan een provider-geprefixt doel zoals `telegram:123` het kanaal selecteren voordat Cron terugvalt op sessiegeschiedenis of één enkel geconfigureerd kanaal. Alleen prefixen die door de geladen Plugin worden geadverteerd, zijn providerselectors. Als `delivery.channel` expliciet is, moet de doelprefix dezelfde provider noemen; bijvoorbeeld `channel: "whatsapp"` met `to: "telegram:123"` wordt geweigerd in plaats van WhatsApp de Telegram-ID als telefoonnummer te laten interpreteren. Prefixen voor doelsoort en service, zoals `channel:<id>`, `user:<id>`, `imessage:<handle>` en `sms:<number>`, blijven kanaaleigen doelsyntaxis, geen providerselectors.

Voor geïsoleerde taken wordt chatlevering gedeeld. Als er een chatroute beschikbaar is, kan de agent de `message`-tool gebruiken, zelfs wanneer de taak `--no-deliver` gebruikt. Als de agent naar het geconfigureerde/huidige doel verzendt, slaat OpenClaw de fallback-announce over. Anders bepalen `announce`, `webhook` en `none` alleen wat de runner met het definitieve antwoord doet na de agentbeurt.

Wanneer een agent een geïsoleerde herinnering maakt vanuit een actieve chat, slaat OpenClaw het behouden live-leveringsdoel op voor de fallback-announce-route. Interne sessiesleutels kunnen kleine letters gebruiken; provider-leveringsdoelen worden niet opnieuw opgebouwd uit die sleutels wanneer de huidige chatcontext beschikbaar is.

Impliciete announce-levering gebruikt geconfigureerde kanaal-allowlists om verouderde doelen te valideren en om te leiden. Goedkeuringen uit de DM-pairing-store zijn geen fallback-automatiseringsontvangers; stel `delivery.to` in of configureer de kanaalvermelding `allowFrom` wanneer een geplande taak proactief naar een DM moet verzenden.

Foutmeldingen volgen een afzonderlijk bestemmingspad:

- `cron.failureDestination` stelt een globale standaard in voor foutmeldingen.
- `job.delivery.failureDestination` overschrijft dat per taak.
- Als geen van beide is ingesteld en de taak al via `announce` levert, vallen foutmeldingen nu terug op dat primaire announce-doel.
- `delivery.failureDestination` wordt alleen ondersteund voor `sessionTarget="isolated"`-taken, tenzij de primaire leveringsmodus `webhook` is.
- `failureAlert.includeSkipped: true` laat een taak of globaal Cron-waarschuwingsbeleid deelnemen aan herhaalde waarschuwingen voor overgeslagen runs. Overgeslagen runs houden een aparte teller voor opeenvolgende skips bij, zodat ze geen invloed hebben op backoff voor uitvoeringsfouten.

## CLI-voorbeelden

<Tabs>
  <Tab title="One-shot reminder">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Recurring isolated job">
    ```bash
    openclaw cron add \
      --name "Morning brief" \
      --cron "0 7 * * *" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Summarize overnight updates." \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="Model and thinking override">
    ```bash
    openclaw cron add \
      --name "Deep analysis" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Weekly deep analysis of project progress." \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
</Tabs>

## Webhooks

Gateway kan HTTP-Webhook-eindpunten beschikbaar maken voor externe triggers. Schakel dit in de config in:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### Authenticatie

Elke aanvraag moet het hook-token via een header bevatten:

- `Authorization: Bearer <token>` (aanbevolen)
- `x-openclaw-token: <token>`

Tokens in querystrings worden geweigerd.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Zet een systeemevent in de wachtrij voor de hoofdsessie:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      Eventbeschrijving.
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` of `next-heartbeat`.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    Voer een geïsoleerde agentbeurt uit:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Velden: `message` (vereist), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    Aangepaste hooknamen worden opgelost via `hooks.mappings` in de config. Mappings kunnen willekeurige payloads omzetten naar `wake`- of `agent`-acties met templates of codetransformaties.
  </Accordion>
</AccordionGroup>

<Warning>
Houd hook-eindpunten achter local loopback, tailnet of een vertrouwde reverse proxy.

- Gebruik een speciaal hook-token; hergebruik geen gateway-authenticatietokens.
- Houd `hooks.path` op een speciaal subpad; `/` wordt geweigerd.
- Stel `hooks.allowedAgentIds` in om expliciete `agentId`-routering te beperken.
- Houd `hooks.allowRequestSessionKey=false` tenzij je door de aanroeper geselecteerde sessies nodig hebt.
- Als je `hooks.allowRequestSessionKey` inschakelt, stel dan ook `hooks.allowedSessionKeyPrefixes` in om toegestane vormen van sessiesleutels te begrenzen.
- Hook-payloads worden standaard met veiligheidsgrenzen omwikkeld.

</Warning>

## Gmail PubSub-integratie

Koppel Gmail-inboxtriggers aan OpenClaw via Google PubSub.

<Note>
**Vereisten:** `gcloud` CLI, `gog` (gogcli), OpenClaw-hooks ingeschakeld, Tailscale voor het openbare HTTPS-eindpunt.
</Note>

### Wizard-installatie (aanbevolen)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Dit schrijft de `hooks.gmail`-config, schakelt de Gmail-preset in en gebruikt Tailscale Funnel voor het push-eindpunt.

### Gateway automatisch starten

Wanneer `hooks.enabled=true` en `hooks.gmail.account` is ingesteld, start de Gateway `gog gmail watch serve` bij het opstarten en vernieuwt de watch automatisch. Stel `OPENCLAW_SKIP_GMAIL_WATCHER=1` in om je af te melden.

### Handmatige eenmalige installatie

<Steps>
  <Step title="Select the GCP project">
    Selecteer het GCP-project dat eigenaar is van de OAuth-client die door `gog` wordt gebruikt:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Create topic and grant Gmail push access">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Start the watch">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Gmail-modeloverschrijving

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## Taken beheren

```bash
# List all jobs
openclaw cron list

# Get one stored job as JSON
openclaw cron get <jobId>

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

<Note>
Opmerking over modeloverschrijving:

- `openclaw cron add|edit --model ...` wijzigt het geselecteerde model van de taak.
- Als het model is toegestaan, bereikt die exacte provider/model de geïsoleerde agent-run.
- Als het niet is toegestaan of niet kan worden opgelost, laat Cron de run mislukken met een expliciete validatiefout.
- Geconfigureerde fallback-ketens blijven gelden omdat Cron `--model` een primaire taakinstelling is, geen sessie-overschrijving voor `/model`.
- Payload `fallbacks` vervangt geconfigureerde fallbacks voor die taak; `fallbacks: []` schakelt fallback uit en maakt de run strict.
- Een gewone `--model` zonder expliciete of geconfigureerde fallback-lijst valt niet door naar de primaire agent als stil extra retry-doel.

</Note>

## Configuratie

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

`maxConcurrentRuns` beperkt zowel geplande Cron-dispatch als uitvoering van geïsoleerde agentbeurten. Geïsoleerde Cron-agentbeurten gebruiken intern de speciale `cron-nested`-uitvoeringsbaan van de wachtrij, dus door deze waarde te verhogen kunnen onafhankelijke Cron-LLM-runs parallel voortgaan in plaats van alleen hun buitenste Cron-wrappers te starten. De gedeelde niet-Cron-`nested`-baan wordt door deze instelling niet verbreed.

De runtime-state-sidecar wordt afgeleid van `cron.store`: een `.json`-store zoals `~/clawd/cron/jobs.json` gebruikt `~/clawd/cron/jobs-state.json`, terwijl een storepad zonder `.json`-achtervoegsel `-state.json` toevoegt.

Als je `jobs.json` handmatig bewerkt, laat `jobs-state.json` dan buiten versiebeheer. OpenClaw gebruikt die sidecar voor wachtende slots, actieve markers, laatste-run-metadata en de planningidentiteit die de scheduler vertelt wanneer een extern bewerkte taak een nieuwe `nextRunAtMs` nodig heeft.

Schakel Cron uit: `cron.enabled: false` of `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Eenmalige retry**: tijdelijke fouten (rate limit, overbelasting, netwerk, serverfout) worden tot 3 keer opnieuw geprobeerd met exponentiële backoff. Permanente fouten schakelen onmiddellijk uit.

    **Terugkerende retry**: exponentiële backoff (30s tot 60m) tussen retries. Backoff wordt gereset na de volgende succesvolle run.

  </Accordion>
  <Accordion title="Onderhoud">
    `cron.sessionRetention` (standaard `24h`) ruimt geïsoleerde uitvoeringssessie-vermeldingen op. `cron.runLog.maxBytes` / `cron.runLog.keepLines` ruimen runlogbestanden automatisch op.
  </Accordion>
</AccordionGroup>

## Problemen oplossen

### Commandoladder

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

<AccordionGroup>
  <Accordion title="Cron wordt niet geactiveerd">
    - Controleer `cron.enabled` en de env var `OPENCLAW_SKIP_CRON`.
    - Bevestig dat de Gateway continu draait.
    - Controleer voor `cron`-schema's de tijdzone (`--tz`) ten opzichte van de hosttijdzone.
    - `reason: not-due` in run-uitvoer betekent dat de handmatige run is gecontroleerd met `openclaw cron run <jobId> --due` en dat de taak nog niet verschuldigd was.

  </Accordion>
  <Accordion title="Cron werd geactiveerd maar niet afgeleverd">
    - Aflevermodus `none` betekent dat er geen fallback-verzending door de runner wordt verwacht. De agent kan nog steeds rechtstreeks verzenden met de `message`-tool wanneer er een chatroute beschikbaar is.
    - Een ontbrekend/ongeldig afleverdoel (`channel`/`to`) betekent dat uitgaand verkeer is overgeslagen.
    - Voor Matrix kunnen gekopieerde of legacy taken met kleine letters in `delivery.to`-kamer-ID's mislukken, omdat Matrix-kamer-ID's hoofdlettergevoelig zijn. Bewerk de taak naar de exacte waarde `!room:server` of `room:!room:server` uit Matrix.
    - Kanaalauthenticatiefouten (`unauthorized`, `Forbidden`) betekenen dat aflevering door referenties is geblokkeerd.
    - Als de geïsoleerde run alleen het stille token (`NO_REPLY` / `no_reply`) retourneert, onderdrukt OpenClaw rechtstreekse uitgaande aflevering en ook het fallback-pad voor de wachtrij-samenvatting, zodat er niets terug naar chat wordt geplaatst.
    - Als de agent de gebruiker zelf moet berichten, controleer dan of de taak een bruikbare route heeft (`channel: "last"` met een eerdere chat, of een expliciet kanaal/doel).

  </Accordion>
  <Accordion title="Cron of Heartbeat lijkt /new-style-rollover te verhinderen">
    - Dagelijkse en inactieve resetversheid is niet gebaseerd op `updatedAt`; zie [Sessiebeheer](/nl/concepts/session#session-lifecycle).
    - Cron-wakeups, Heartbeat-runs, exec-meldingen en Gateway-administratie kunnen de sessierij bijwerken voor routering/status, maar ze verlengen `sessionStartedAt` of `lastInteractionAt` niet.
    - Voor legacy rijen die zijn gemaakt voordat die velden bestonden, kan OpenClaw `sessionStartedAt` herstellen uit de transcript-JSONL-sessiekop wanneer het bestand nog beschikbaar is. Legacy inactieve rijen zonder `lastInteractionAt` gebruiken die herstelde starttijd als hun inactiviteitsbasislijn.

  </Accordion>
  <Accordion title="Tijdzone-valkuilen">
    - Cron zonder `--tz` gebruikt de tijdzone van de gateway-host.
    - `at`-schema's zonder tijdzone worden behandeld als UTC.
    - Heartbeat `activeHours` gebruikt de geconfigureerde tijdzoneresolutie.

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Automatisering en taken](/nl/automation) — alle automatiseringsmechanismen in één oogopslag
- [Achtergrondtaken](/nl/automation/tasks) — taaklogboek voor cron-uitvoeringen
- [Heartbeat](/nl/gateway/heartbeat) — periodieke beurten in de hoofdsessie
- [Tijdzone](/nl/concepts/timezone) — tijdzoneconfiguratie
