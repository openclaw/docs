---
read_when:
    - Achtergrondtaken of wekmomenten plannen
    - Externe triggers (webhooks, Gmail) aansluiten op OpenClaw
    - Kiezen tussen Heartbeat en Cron voor geplande taken
sidebarTitle: Scheduled tasks
summary: Geplande taken, webhooks en Gmail PubSub-triggers voor de Gateway-planner
title: Geplande taken
x-i18n:
    generated_at: "2026-05-12T00:56:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: a713c6aa2467e3c0331fe94605ba83d542632e5e426e94019d6958ef91da1da3
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron is de ingebouwde planner van de Gateway. Deze bewaart taken, wekt de agent op het juiste moment en kan uitvoer terugsturen naar een chatkanaal of webhook-eindpunt.

## Snel starten

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
- Taakdefinities worden bewaard in `~/.openclaw/cron/jobs.json`, zodat planningen niet verloren gaan bij herstarts.
- De runtime-uitvoeringsstatus wordt daarnaast bewaard in `~/.openclaw/cron/jobs-state.json`. Als je crondefinities in git bijhoudt, houd dan `jobs.json` bij en zet `jobs-state.json` in gitignore.
- Na de splitsing kunnen oudere OpenClaw-versies `jobs.json` lezen, maar ze kunnen taken als nieuw behandelen omdat runtime-velden nu in `jobs-state.json` staan.
- Wanneer `jobs.json` wordt bewerkt terwijl de Gateway draait of gestopt is, vergelijkt OpenClaw de gewijzigde planningsvelden met metadata van openstaande runtime-slots en wist verouderde `nextRunAtMs`-waarden. Herschrijvingen met alleen opmaak- of sleutelvolgordewijzigingen behouden het openstaande slot.
- Alle cron-uitvoeringen maken records voor [achtergrondtaken](/nl/automation/tasks) aan.
- Bij het opstarten van de Gateway worden achterstallige geïsoleerde agentbeurttaken opnieuw gepland buiten het kanaalverbindingsvenster in plaats van onmiddellijk opnieuw afgespeeld, zodat het opstarten van Discord/Telegram en de native-command-instelling responsief blijven na herstarts.
- Eenmalige taken (`--at`) worden standaard na succes automatisch verwijderd.
- Geïsoleerde cron-uitvoeringen sluiten naar beste vermogen gevolgde browsertabbladen/processen voor hun `cron:<jobId>`-sessie wanneer de uitvoering is voltooid, zodat losgekoppelde browserautomatisering geen verweesde processen achterlaat.
- Geïsoleerde cron-uitvoeringen die de beperkte cron-toekenning voor zelfopschoning ontvangen, kunnen nog steeds de plannerstatus lezen, een op zichzelf gefilterde lijst van hun huidige taak en de uitvoeringsgeschiedenis van die taak, zodat status-/Heartbeat-controles hun eigen planning kunnen inspecteren zonder bredere cron-mutatierechten te krijgen.
- Geïsoleerde cron-uitvoeringen beschermen ook tegen verouderde bevestigingsantwoorden. Als het eerste resultaat alleen een tussentijdse statusupdate is (`on it`, `pulling everything together` en vergelijkbare hints) en geen onderliggende subagent-uitvoering nog verantwoordelijk is voor het definitieve antwoord, vraagt OpenClaw eenmaal opnieuw om het daadwerkelijke resultaat vóór levering.
- Geïsoleerde cron-uitvoeringen geven de voorkeur aan gestructureerde metadata voor uitvoeringsweigering uit de ingesloten uitvoering en vallen daarna terug op bekende markeringen voor definitieve samenvatting/uitvoer, zoals `SYSTEM_RUN_DENIED` en `INVALID_REQUEST`, zodat een geblokkeerde opdracht niet als geslaagde uitvoering wordt gerapporteerd.
- Geïsoleerde cron-uitvoeringen behandelen agentfouten op uitvoeringsniveau ook als taakfouten, zelfs wanneer er geen antwoordpayload wordt geproduceerd, zodat model-/providerfouten fouttellers verhogen en foutmeldingen activeren in plaats van de taak als geslaagd te wissen.
- Wanneer een geïsoleerde agentbeurttaak `timeoutSeconds` bereikt, breekt Cron de onderliggende agentuitvoering af en geeft deze een kort opschoningsvenster. Als de uitvoering niet leegloopt, wist Gateway-beheerde opschoning geforceerd het sessie-eigendom van die uitvoering voordat Cron de time-out registreert, zodat chatwerk in de wachtrij niet achterblijft achter een verouderde verwerkende sessie.
- Als een geïsoleerde agentbeurt vastloopt voordat de runner start of vóór de eerste modelaanroep, registreert Cron een fasespecifieke time-out, zoals `setup timed out before runner start` of `stalled before first model call (last phase: context-engine)`. Deze watchdogs dekken ingesloten providers en CLI-ondersteunde providers voordat hun externe CLI-proces daadwerkelijk is gestart, en worden onafhankelijk begrensd van lange `timeoutSeconds`-waarden, zodat cold-start-/auth-/contextfouten snel zichtbaar worden in plaats van te wachten op het volledige taakbudget.

<a id="maintenance"></a>

<Note>
Taakreconciliatie voor Cron is eerst runtime-eigendom en daarna gebaseerd op duurzame geschiedenis: een actieve crontaak blijft live zolang de cronruntime die taak nog als actief volgt, zelfs als er nog een oude onderliggende sessierij bestaat. Zodra de runtime de taak niet meer bezit en het respijtvenster van 5 minuten verloopt, controleren onderhoudsprocessen persistente uitvoeringslogs en taakstatus op de overeenkomende `cron:<jobId>:<startedAt>`-uitvoering. Als die duurzame geschiedenis een terminaal resultaat toont, wordt het taaklogboek daarmee afgerond; anders kan Gateway-beheerd onderhoud de taak als `lost` markeren. Offline CLI-audit kan herstellen vanuit duurzame geschiedenis, maar behandelt de eigen lege set actieve taken in het proces niet als bewijs dat een Gateway-beheerde cronuitvoering verdwenen is.
</Note>

## Planningstypen

| Soort   | CLI-vlag  | Beschrijving                                            |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Eenmalig tijdstempel (ISO 8601 of relatief, zoals `20m`) |
| `every` | `--every` | Vast interval                                           |
| `cron`  | `--cron`  | Cronexpressie met 5 of 6 velden met optioneel `--tz`    |

Tijdstempels zonder tijdzone worden behandeld als UTC. Voeg `--tz America/New_York` toe voor planning op lokale kloktijd.

Terugkerende expressies op het hele uur worden automatisch tot 5 minuten gespreid om belastingspieken te verminderen. Gebruik `--exact` om exacte timing af te dwingen of `--stagger 30s` voor een expliciet venster.

### Dag-van-de-maand en dag-van-de-week gebruiken OF-logica

Cronexpressies worden geparseerd door [croner](https://github.com/Hexagon/croner). Wanneer zowel de velden dag-van-de-maand als dag-van-de-week geen jokerteken zijn, komt croner overeen wanneer **een van beide** velden overeenkomt, niet allebei. Dit is standaard Vixie-crongedrag.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Dit wordt ongeveer 5-6 keer per maand uitgevoerd in plaats van 0-1 keer per maand. OpenClaw gebruikt hier het standaard OF-gedrag van Croner. Om beide voorwaarden te vereisen, gebruik je Croners `+`-modifier voor dag-van-de-week (`0 9 15 * +1`) of plan je op het ene veld en controleer je het andere in de prompt of opdracht van je taak.

## Uitvoeringsstijlen

| Stijl           | `--session`-waarde | Draait in                | Beste voor                      |
| --------------- | ------------------ | ------------------------ | ------------------------------- |
| Hoofdsessie     | `main`             | Volgende Heartbeat-beurt | Herinneringen, systeemevents    |
| Geïsoleerd      | `isolated`         | Toegewezen `cron:<jobId>` | Rapporten, achtergrondtaken     |
| Huidige sessie  | `current`          | Gebonden bij aanmaak     | Contextbewust terugkerend werk  |
| Aangepaste sessie | `session:custom-id` | Persistente benoemde sessie | Workflows die op geschiedenis voortbouwen |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    **Hoofdsessie**-taken plaatsen een systeemevent in de wachtrij en wekken optioneel de Heartbeat (`--wake now` of `--wake next-heartbeat`). Die systeemevents verlengen de versheid voor dagelijkse/inactieve reset van de doelsessie niet. **Geïsoleerde** taken draaien een toegewezen agentbeurt met een nieuwe sessie. **Aangepaste sessies** (`session:xxx`) bewaren context tussen uitvoeringen, wat workflows mogelijk maakt zoals dagelijkse stand-ups die voortbouwen op eerdere samenvattingen.
  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    Voor geïsoleerde taken betekent "nieuwe sessie" een nieuw transcript-/sessie-id voor elke uitvoering. OpenClaw kan veilige voorkeuren meenemen, zoals instellingen voor denken/snel/uitgebreid, labels en expliciete door de gebruiker geselecteerde model-/auth-overschrijvingen, maar neemt geen omgevingsgesprekscontext over uit een oudere cronrij: kanaal-/groeproutering, verzend- of wachtrijbeleid, elevatie, oorsprong of ACP-runtimebinding. Gebruik `current` of `session:<id>` wanneer een terugkerende taak bewust op dezelfde gesprekscontext moet voortbouwen.
  </Accordion>
  <Accordion title="Runtime cleanup">
    Voor geïsoleerde taken omvat runtime-afbraak nu beste-inspanningsopschoning van de browser voor die cronsessie. Opschoningsfouten worden genegeerd zodat het daadwerkelijke cronresultaat nog steeds leidend blijft.

    Geïsoleerde cron-uitvoeringen ruimen ook alle gebundelde MCP-runtime-instanties op die voor de taak zijn gemaakt via het gedeelde runtime-opschoningspad. Dit komt overeen met hoe MCP-clients voor hoofdsessies en aangepaste sessies worden afgebroken, zodat geïsoleerde crontaken geen stdio-childprocessen of langlevende MCP-verbindingen laten lekken tussen uitvoeringen.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    Wanneer geïsoleerde cron-uitvoeringen subagents orkestreren, geeft levering ook de voorkeur aan de definitieve uitvoer van onderliggende taken boven verouderde tussentijdse tekst van de ouder. Als onderliggende taken nog draaien, onderdrukt OpenClaw die gedeeltelijke ouderupdate in plaats van deze aan te kondigen.

    Voor tekst-only Discord-aankondigingsdoelen verzendt OpenClaw de canonieke definitieve assistenttekst eenmaal in plaats van zowel gestreamde/tussentijdse tekstpayloads als het definitieve antwoord opnieuw af te spelen. Media en gestructureerde Discord-payloads worden nog steeds als afzonderlijke payloads geleverd zodat bijlagen en componenten niet worden weggelaten.

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
  Overschrijving van denkniveau.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Sla injectie van werkruimte-bootstrapbestanden over.
</ParamField>
<ParamField path="--tools" type="string">
  Beperk welke tools de taak kan gebruiken, bijvoorbeeld `--tools exec,read`.
</ParamField>

`--model` gebruikt het geselecteerde toegestane model als primair model voor die taak. Het is niet hetzelfde als een `/model`-overschrijving voor een chatsessie: geconfigureerde fallbackketens blijven van toepassing wanneer het primaire taakmodel faalt. Als het gevraagde model niet is toegestaan of niet kan worden opgelost, laat Cron de uitvoering mislukken met een expliciete validatiefout in plaats van stilzwijgend terug te vallen op de agent-/standaardmodelselectie van de taak.

Crontaken kunnen ook `fallbacks` op payloadniveau bevatten. Indien aanwezig vervangt die lijst de geconfigureerde fallbackketen voor de taak. Gebruik `fallbacks: []` in de taakpayload/API wanneer je een strikte cronuitvoering wilt die alleen het geselecteerde model probeert. Als een taak `--model` heeft maar geen payload- of geconfigureerde fallbacks, geeft OpenClaw een expliciete lege fallbackoverschrijving door zodat het primaire agentmodel niet als verborgen extra retrydoel wordt toegevoegd.

De prioriteit voor modelselectie bij geïsoleerde taken is:

1. Modeloverschrijving van Gmail-hook (wanneer de uitvoering uit Gmail kwam en die overschrijving is toegestaan)
2. `model` per taakpayload
3. Door gebruiker geselecteerde opgeslagen modeloverschrijving voor cronsessie
4. Agent-/standaardmodelselectie

Snelle modus volgt ook de opgeloste live selectie. Als de geselecteerde modelconfiguratie `params.fastMode` heeft, gebruikt geïsoleerde Cron die standaard. Een opgeslagen sessieoverschrijving voor `fastMode` blijft in beide richtingen voorrang hebben op configuratie.

Als een geïsoleerde uitvoering een live model-switch-handoff raakt, probeert Cron opnieuw met de omgeschakelde provider/het omgeschakelde model en bewaart die live selectie voor de actieve uitvoering voordat opnieuw wordt geprobeerd. Wanneer de switch ook een nieuw auth-profiel bevat, bewaart Cron die auth-profieloverschrijving ook voor de actieve uitvoering. Retries zijn begrensd: na de eerste poging plus 2 switch-retries breekt Cron af in plaats van eindeloos te blijven lussen.

Voordat een geisoleerde cron-run de agent-runner ingaat, controleert OpenClaw bereikbare lokale provider-eindpunten voor geconfigureerde `api: "ollama"`- en `api: "openai-completions"`-providers waarvan `baseUrl` loopback, privénetwerk of `.local` is. Als dat eindpunt offline is, wordt de run vastgelegd als `skipped` met een duidelijke provider-/modelfout in plaats van een modelaanroep te starten. Het eindpuntresultaat wordt 5 minuten gecachet, zodat veel geplande taken die dezelfde defecte lokale Ollama-, vLLM-, SGLang- of LM Studio-server gebruiken één kleine probe delen in plaats van een verzoekenstorm te veroorzaken. Overgeslagen provider-preflight-runs verhogen de execution-error backoff niet; schakel `failureAlert.includeSkipped` in wanneer je herhaalde meldingen voor overslaan wilt.

## Levering en uitvoer

| Modus      | Wat gebeurt er                                                     |
| ---------- | ------------------------------------------------------------------ |
| `announce` | Levert definitieve tekst als fallback aan het doel als de agent niet heeft verzonden |
| `webhook`  | POST de payload van de voltooide gebeurtenis naar een URL          |
| `none`     | Geen fallback-levering door de runner                              |

Gebruik `--announce --channel telegram --to "-1001234567890"` voor kanaallevering. Gebruik voor Telegram-forumonderwerpen `-1001234567890:topic:123`; directe RPC-/config-aanroepers mogen ook `delivery.threadId` als string of getal doorgeven. Slack-/Discord-/Mattermost-doelen moeten expliciete prefixes gebruiken (`channel:<id>`, `user:<id>`). Matrix-room-ID's zijn hoofdlettergevoelig; gebruik de exacte room-ID of de vorm `room:!room:server` uit Matrix.

Wanneer announce-levering `channel: "last"` gebruikt of `channel` weglaat, kan een provider-geprefixte bestemming zoals `telegram:123` het kanaal selecteren voordat cron terugvalt op sessiegeschiedenis of één geconfigureerd kanaal. Alleen prefixes die door de geladen Plugin worden geadverteerd, zijn providerselectors. Als `delivery.channel` expliciet is, moet de doelprefix dezelfde provider noemen; bijvoorbeeld `channel: "whatsapp"` met `to: "telegram:123"` wordt geweigerd in plaats van WhatsApp de Telegram-ID als telefoonnummer te laten interpreteren. Doelsoort- en serviceprefixes zoals `channel:<id>`, `user:<id>`, `imessage:<handle>` en `sms:<number>` blijven doelsyntaxis die eigendom is van het kanaal, geen providerselectors.

Voor geisoleerde taken wordt chatlevering gedeeld. Als er een chatroute beschikbaar is, kan de agent de `message`-tool gebruiken, zelfs wanneer de taak `--no-deliver` gebruikt. Als de agent naar het geconfigureerde/huidige doel verzendt, slaat OpenClaw de fallback-announce over. Anders bepalen `announce`, `webhook` en `none` alleen wat de runner doet met het definitieve antwoord na de agentbeurt.

Wanneer een agent een geisoleerde herinnering maakt vanuit een actieve chat, bewaart OpenClaw het behouden live-leveringsdoel voor de fallback-announce-route. Interne sessiesleutels kunnen kleine letters zijn; provider-leveringsdoelen worden niet opnieuw opgebouwd uit die sleutels wanneer de huidige chatcontext beschikbaar is.

Impliciete announce-levering gebruikt geconfigureerde kanaal-allowlists om verouderde doelen te valideren en om te leiden. DM-goedkeuringen uit de pairing-store zijn geen fallback-automatiseringsontvangers; stel `delivery.to` in of configureer de kanaalvermelding `allowFrom` wanneer een geplande taak proactief naar een DM moet verzenden.

Foutmeldingen volgen een apart bestemmingspad:

- `cron.failureDestination` stelt een globale standaard in voor foutmeldingen.
- `job.delivery.failureDestination` overschrijft die per taak.
- Als geen van beide is ingesteld en de taak al levert via `announce`, vallen foutmeldingen nu terug op dat primaire announce-doel.
- `delivery.failureDestination` wordt alleen ondersteund op taken met `sessionTarget="isolated"`, tenzij de primaire leveringsmodus `webhook` is.
- `failureAlert.includeSkipped: true` laat een taak of globaal cron-waarschuwingsbeleid deelnemen aan herhaalde waarschuwingen voor overgeslagen runs. Overgeslagen runs houden een aparte teller voor opeenvolgende overslagen bij, zodat ze geen invloed hebben op de execution-error backoff.

## CLI-voorbeelden

<Tabs>
  <Tab title="Eenmalige herinnering">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Terugkerende geisoleerde taak">
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
  <Tab title="Model- en thinking-overschrijving">
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

Gateway kan HTTP-Webhook-eindpunten beschikbaar maken voor externe triggers. Schakel dit in de configuratie in:

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

Elk verzoek moet de hook-token via een header bevatten:

- `Authorization: Bearer <token>` (aanbevolen)
- `x-openclaw-token: <token>`

Query-stringtokens worden geweigerd.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Plaats een systeemgebeurtenis in de wachtrij voor de hoofdsessie:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      Gebeurtenisbeschrijving.
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` of `next-heartbeat`.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    Voer een geisoleerde agentbeurt uit:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Velden: `message` (verplicht), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Gemapte hooks (POST /hooks/<name>)">
    Aangepaste hooknamen worden opgelost via `hooks.mappings` in de configuratie. Mappings kunnen willekeurige payloads omzetten in `wake`- of `agent`-acties met templates of codetransformaties.
  </Accordion>
</AccordionGroup>

<Warning>
Houd hook-eindpunten achter loopback, tailnet of een vertrouwde reverse proxy.

- Gebruik een dedicated hook-token; hergebruik geen gateway-authenticatietokens.
- Houd `hooks.path` op een dedicated subpad; `/` wordt geweigerd.
- Stel `hooks.allowedAgentIds` in om expliciete `agentId`-routering te beperken.
- Houd `hooks.allowRequestSessionKey=false` tenzij je door de aanroeper gekozen sessies nodig hebt.
- Als je `hooks.allowRequestSessionKey` inschakelt, stel dan ook `hooks.allowedSessionKeyPrefixes` in om toegestane sessiesleutelvormen te beperken.
- Hook-payloads worden standaard ingepakt met veiligheidsgrenzen.

</Warning>

## Gmail PubSub-integratie

Verbind Gmail-inboxtriggers met OpenClaw via Google PubSub.

<Note>
**Vereisten:** `gcloud` CLI, `gog` (gogcli), OpenClaw-hooks ingeschakeld, Tailscale voor het openbare HTTPS-eindpunt.
</Note>

### Wizardinstelling (aanbevolen)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Dit schrijft de `hooks.gmail`-configuratie, schakelt de Gmail-preset in en gebruikt Tailscale Funnel voor het push-eindpunt.

### Gateway automatisch starten

Wanneer `hooks.enabled=true` en `hooks.gmail.account` is ingesteld, start de Gateway `gog gmail watch serve` bij het opstarten en vernieuwt de watch automatisch. Stel `OPENCLAW_SKIP_GMAIL_WATCHER=1` in om je af te melden.

### Handmatige eenmalige instelling

<Steps>
  <Step title="Selecteer het GCP-project">
    Selecteer het GCP-project dat eigenaar is van de OAuth-client die door `gog` wordt gebruikt:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Maak topic aan en verleen Gmail-pushtoegang">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Start de watch">
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
Opmerking bij modeloverschrijving:

- `openclaw cron add|edit --model ...` wijzigt het geselecteerde model van de taak.
- Als het model is toegestaan, bereikt die exacte provider/het exacte model de geisoleerde agentrun.
- Als het niet is toegestaan of niet kan worden opgelost, laat cron de run mislukken met een expliciete validatiefout.
- Geconfigureerde fallback-ketens blijven van toepassing omdat cron `--model` een taakprimair is, geen sessie-`/model`-overschrijving.
- Payload `fallbacks` vervangt geconfigureerde fallbacks voor die taak; `fallbacks: []` schakelt fallback uit en maakt de run strikt.
- Een gewone `--model` zonder expliciete of geconfigureerde fallbacklijst valt niet door naar de agent-primary als stil extra retrydoel.

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

`maxConcurrentRuns` beperkt zowel geplande cron-dispatch als uitvoering van geisoleerde agentbeurten. Geisoleerde cron-agentbeurten gebruiken intern de dedicated `cron-nested`-uitvoeringslane van de wachtrij, dus door deze waarde te verhogen kunnen onafhankelijke cron-LLM-runs parallel voortgang boeken in plaats van alleen hun buitenste cron-wrappers te starten. De gedeelde niet-cron-`nested`-lane wordt niet verbreed door deze instelling.

De runtime state sidecar wordt afgeleid van `cron.store`: een `.json`-store zoals `~/clawd/cron/jobs.json` gebruikt `~/clawd/cron/jobs-state.json`, terwijl een storepad zonder `.json`-suffix `-state.json` toevoegt.

Als je `jobs.json` handmatig bewerkt, laat `jobs-state.json` dan buiten versiebeheer. OpenClaw gebruikt die sidecar voor wachtende slots, actieve markeringen, last-run-metadata en de schedule-identiteit die de scheduler vertelt wanneer een extern bewerkte taak een nieuwe `nextRunAtMs` nodig heeft.

Cron uitschakelen: `cron.enabled: false` of `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retrygedrag">
    **Eenmalige retry**: tijdelijke fouten (rate limit, overbelasting, netwerk, serverfout) worden tot 3 keer opnieuw geprobeerd met exponentiele backoff. Permanente fouten schakelen onmiddellijk uit.

    **Terugkerende retry**: exponentiele backoff (30s tot 60m) tussen retries. Backoff wordt gereset na de volgende succesvolle run.

  </Accordion>
  <Accordion title="Onderhoud">
    `cron.sessionRetention` (standaard `24h`) ruimt geisoleerde run-sessie-items op. `cron.runLog.maxBytes` / `cron.runLog.keepLines` ruimen run-logbestanden automatisch op.
  </Accordion>
</AccordionGroup>

## Probleemoplossing

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
    - Controleer voor `cron`-schema's de tijdzone (`--tz`) ten opzichte van de tijdzone van de host.
    - `reason: not-due` in uitvoer van een run betekent dat een handmatige run is gecontroleerd met `openclaw cron run <jobId> --due` en dat de taak nog niet aan de beurt was.

  </Accordion>
  <Accordion title="Cron is geactiveerd, maar er is geen aflevering">
    - Aflevermodus `none` betekent dat er geen fallback-verzending door de runner wordt verwacht. De agent kan nog steeds rechtstreeks verzenden met de `message`-tool wanneer er een chatroute beschikbaar is.
    - Ontbrekend/ongeldig afleverdoel (`channel`/`to`) betekent dat uitgaande verzending is overgeslagen.
    - Voor Matrix kunnen gekopieerde of legacy-taken met room-ID's in `delivery.to` die naar kleine letters zijn omgezet mislukken, omdat Matrix-room-ID's hoofdlettergevoelig zijn. Bewerk de taak naar de exacte waarde `!room:server` of `room:!room:server` uit Matrix.
    - Channel-authenticatiefouten (`unauthorized`, `Forbidden`) betekenen dat aflevering is geblokkeerd door credentials.
    - Als de geisoleerde run alleen het stille token (`NO_REPLY` / `no_reply`) retourneert, onderdrukt OpenClaw rechtstreekse uitgaande aflevering en ook het fallback-pad voor de samenvatting in de wachtrij, zodat er niets terug naar de chat wordt geplaatst.
    - Als de agent zelf een bericht naar de gebruiker moet sturen, controleer dan of de taak een bruikbare route heeft (`channel: "last"` met een eerdere chat, of een expliciet channel/doel).

  </Accordion>
  <Accordion title="Cron of Heartbeat lijkt /new-style-rollover te verhinderen">
    - De actualiteit van dagelijkse en inactieve resets is niet gebaseerd op `updatedAt`; zie [Sessiebeheer](/nl/concepts/session#session-lifecycle).
    - Cron-wakeups, Heartbeat-runs, exec-meldingen en Gateway-boekhouding kunnen de sessierij bijwerken voor routering/status, maar ze verlengen `sessionStartedAt` of `lastInteractionAt` niet.
    - Voor legacy-rijen die zijn gemaakt voordat die velden bestonden, kan OpenClaw `sessionStartedAt` herstellen uit de JSONL-sessieheader van het transcript wanneer het bestand nog beschikbaar is. Legacy-inactieve rijen zonder `lastInteractionAt` gebruiken die herstelde starttijd als hun baseline voor inactiviteit.

  </Accordion>
  <Accordion title="Valkuilen met tijdzones">
    - Cron zonder `--tz` gebruikt de tijdzone van de Gateway-host.
    - `at`-schema's zonder tijdzone worden als UTC behandeld.
    - Heartbeat `activeHours` gebruikt geconfigureerde tijdzone-resolutie.

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Automatisering](/nl/automation) — alle automatiseringsmechanismen in een oogopslag
- [Achtergrondtaken](/nl/automation/tasks) — taaklogboek voor cron-uitvoeringen
- [Heartbeat](/nl/gateway/heartbeat) — periodieke beurten in de hoofdsessie
- [Tijdzone](/nl/concepts/timezone) — tijdzoneconfiguratie
