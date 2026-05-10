---
read_when:
    - Achtergrondtaken of wekmomenten plannen
    - Externe triggers (webhooks, Gmail) koppelen aan OpenClaw
    - Kiezen tussen Heartbeat en Cron voor geplande taken
sidebarTitle: Scheduled tasks
summary: Geplande taken, Webhooks en Gmail PubSub-activeringen voor de Gateway-planner
title: Geplande taken
x-i18n:
    generated_at: "2026-05-10T19:21:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: b837fc5c4cd2647bdab98b0421d2f89a528164c8eb93e7851428c73f8f59dccb
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron is de ingebouwde planner van de Gateway. Deze bewaart taken, wekt de agent op het juiste moment en kan uitvoer terugsturen naar een chatkanaal of Webhook-eindpunt.

## Snel starten

<Steps>
  <Step title="Voeg een eenmalige herinnering toe">
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
  <Step title="Controleer je taken">
    ```bash
    openclaw cron list
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="Bekijk uitvoeringsgeschiedenis">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Hoe cron werkt

- Cron draait **binnen het Gateway**-proces (niet binnen het model).
- Taakdefinities blijven bewaard in `~/.openclaw/cron/jobs.json`, zodat herstarts geen planningen verliezen.
- Runtime-uitvoeringsstatus blijft ernaast bewaard in `~/.openclaw/cron/jobs-state.json`. Als je cron-definities in git bijhoudt, houd dan `jobs.json` bij en voeg `jobs-state.json` toe aan gitignore.
- Na de splitsing kunnen oudere OpenClaw-versies `jobs.json` lezen, maar behandelen ze taken mogelijk als nieuw omdat runtime-velden nu in `jobs-state.json` staan.
- Wanneer `jobs.json` wordt bewerkt terwijl de Gateway draait of is gestopt, vergelijkt OpenClaw de gewijzigde planningsvelden met runtime-metadata voor wachtende tijdsloten en wist het verouderde `nextRunAtMs`-waarden. Zuivere opmaakwijzigingen of herschrijvingen die alleen de sleutelvolgorde aanpassen, behouden het wachtende tijdslot.
- Alle cron-uitvoeringen maken records voor [achtergrondtaken](/nl/automation/tasks) aan.
- Bij het opstarten van de Gateway worden achterstallige geïsoleerde agent-turn-taken opnieuw gepland buiten het venster waarin kanalen verbinding maken, in plaats van ze onmiddellijk opnieuw af te spelen, zodat het opstarten van Discord/Telegram en het instellen van native opdrachten responsief blijven na herstarts.
- Eenmalige taken (`--at`) worden standaard automatisch verwijderd na succes.
- Geïsoleerde cron-uitvoeringen sluiten naar beste vermogen bijgehouden browsertabs/processen voor hun `cron:<jobId>`-sessie wanneer de uitvoering is voltooid, zodat losgekoppelde browserautomatisering geen verweesde processen achterlaat.
- Geïsoleerde cron-uitvoeringen die de beperkte grant voor cron-zelfopschoning ontvangen, kunnen nog steeds de plannerstatus lezen, een zelfgefilterde lijst van hun huidige taak en de uitvoeringsgeschiedenis van die taak, zodat status-/Heartbeat-controles hun eigen planning kunnen inspecteren zonder bredere toegang tot cron-mutaties te krijgen.
- Geïsoleerde cron-uitvoeringen bewaken ook tegen verouderde bevestigingsantwoorden. Als het eerste resultaat slechts een tussentijdse statusupdate is (`on it`, `pulling everything together` en vergelijkbare hints) en geen descendant-subagent-uitvoering nog verantwoordelijk is voor het uiteindelijke antwoord, vraagt OpenClaw één keer opnieuw om het daadwerkelijke resultaat voordat het wordt afgeleverd.
- Geïsoleerde cron-uitvoeringen geven de voorkeur aan gestructureerde metadata over uitvoeringsweigering uit de ingebedde uitvoering en vallen daarna terug op bekende markers voor eindsamenvatting/uitvoer zoals `SYSTEM_RUN_DENIED` en `INVALID_REQUEST`, zodat een geblokkeerde opdracht niet als een groene uitvoering wordt gerapporteerd.
- Geïsoleerde cron-uitvoeringen behandelen agentfouten op uitvoeringsniveau ook als taakfouten, zelfs wanneer er geen antwoordpayload wordt geproduceerd, zodat model-/providerfouten fouttellers verhogen en foutmeldingen activeren in plaats van de taak als succesvol af te handelen.
- Wanneer een geïsoleerde agent-turn-taak `timeoutSeconds` bereikt, breekt cron de onderliggende agentuitvoering af en geeft deze een kort opschoonvenster. Als de uitvoering niet leegloopt, wist Gateway-beheerde opschoning het sessie-eigenaarschap van die uitvoering geforceerd voordat cron de timeout registreert, zodat chatwerk in de wachtrij niet achter een verouderde verwerkende sessie blijft hangen.
- Als een geïsoleerde agent-turn vastloopt voordat de runner start of vóór de eerste modelaanroep, registreert cron een fasespecifieke timeout zoals `setup timed out before runner start` of `stalled before first model call (last phase: context-engine)`. Deze watchdogs dekken ingebedde providers en CLI-ondersteunde providers voordat hun externe CLI-proces daadwerkelijk wordt gestart, en worden onafhankelijk begrensd van lange `timeoutSeconds`-waarden, zodat cold-start-, authenticatie- en contextfouten snel zichtbaar worden in plaats van te wachten op het volledige taakbudget.

<a id="maintenance"></a>

<Note>
Taakreconciliatie voor cron is eerst runtime-eigendom en daarna ondersteund door duurzame geschiedenis: een actieve cron-taak blijft live zolang de cron-runtime die taak nog als actief bijhoudt, zelfs als er nog een oude child-sessierij bestaat. Zodra de runtime de taak niet meer bezit en het respijtvenster van 5 minuten verloopt, controleert onderhoud bewaarde uitvoeringslogs en taakstatus voor de overeenkomende `cron:<jobId>:<startedAt>`-uitvoering. Als die duurzame geschiedenis een terminaal resultaat toont, wordt het taakgrootboek daaruit afgerond; anders kan Gateway-beheerd onderhoud de taak als `lost` markeren. Offline CLI-audit kan herstellen uit duurzame geschiedenis, maar behandelt zijn eigen lege in-process actieve-takenset niet als bewijs dat een Gateway-beheerde cron-uitvoering verdwenen is.
</Note>

## Planningstypen

| Soort   | CLI-vlag  | Beschrijving                                            |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Eenmalige timestamp (ISO 8601 of relatief zoals `20m`)  |
| `every` | `--every` | Vast interval                                           |
| `cron`  | `--cron`  | Cron-expressie met 5 of 6 velden met optioneel `--tz`   |

Timestamps zonder tijdzone worden behandeld als UTC. Voeg `--tz America/New_York` toe voor planning op lokale kloktijd.

Terugkerende expressies bovenaan het uur worden automatisch tot 5 minuten gespreid om belastingspieken te verminderen. Gebruik `--exact` om precieze timing af te dwingen of `--stagger 30s` voor een expliciet venster.

### Dag-van-de-maand en dag-van-de-week gebruiken OF-logica

Cron-expressies worden geparsed door [croner](https://github.com/Hexagon/croner). Wanneer zowel het veld dag-van-de-maand als dag-van-de-week geen wildcard is, matcht croner wanneer **een van beide** velden matcht — niet beide. Dit is standaard Vixie cron-gedrag.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Dit wordt ongeveer 5-6 keer per maand geactiveerd in plaats van 0-1 keer per maand. OpenClaw gebruikt hier het standaard OF-gedrag van Croner. Gebruik de `+`-modifier voor dag-van-de-week van Croner (`0 9 15 * +1`) om beide voorwaarden te vereisen, of plan op één veld en bewaak het andere in de prompt of opdracht van je taak.

## Uitvoeringsstijlen

| Stijl           | `--session`-waarde | Draait in                | Beste voor                      |
| --------------- | ------------------ | ------------------------ | ------------------------------- |
| Hoofdsessie     | `main`             | Volgende Heartbeat-turn  | Herinneringen, systeemevents    |
| Geïsoleerd      | `isolated`         | Toegewijde `cron:<jobId>` | Rapporten, achtergrondklussen  |
| Huidige sessie  | `current`          | Gebonden bij aanmaak     | Contextbewust terugkerend werk  |
| Aangepaste sessie | `session:custom-id` | Persistente benoemde sessie | Workflows die voortbouwen op geschiedenis |

<AccordionGroup>
  <Accordion title="Hoofdsessie versus geïsoleerd versus aangepast">
    **Hoofdsessie**-taken plaatsen een systeemevent in de wachtrij en wekken optioneel de Heartbeat (`--wake now` of `--wake next-heartbeat`). Die systeemevents verlengen de dagelijkse/inactieve resetversheid voor de doelsessie niet. **Geïsoleerde** taken draaien een toegewijde agent-turn met een nieuwe sessie. **Aangepaste sessies** (`session:xxx`) bewaren context tussen uitvoeringen, wat workflows mogelijk maakt zoals dagelijkse standups die voortbouwen op eerdere samenvattingen.
  </Accordion>
  <Accordion title="Wat 'nieuwe sessie' betekent voor geïsoleerde taken">
    Voor geïsoleerde taken betekent "nieuwe sessie" een nieuwe transcript-/sessie-id voor elke uitvoering. OpenClaw kan veilige voorkeuren meenemen zoals instellingen voor denken/snel/uitgebreid, labels en expliciete door de gebruiker geselecteerde model-/auth-overrides, maar erft geen omringende gesprekscontext van een oudere cron-rij: kanaal-/groepsroutering, verzend- of wachtrijbeleid, elevatie, oorsprong of ACP-runtimebinding. Gebruik `current` of `session:<id>` wanneer een terugkerende taak bewust op dezelfde gesprekscontext moet voortbouwen.
  </Accordion>
  <Accordion title="Runtime-opschoning">
    Voor geïsoleerde taken omvat runtime-afbraak nu browseropschoning naar beste vermogen voor die cron-sessie. Opschoonfouten worden genegeerd, zodat het daadwerkelijke cron-resultaat nog steeds doorslaggevend is.

    Geïsoleerde cron-uitvoeringen verwijderen ook alle gebundelde MCP-runtime-instanties die voor de taak zijn aangemaakt via het gedeelde runtime-opschoonpad. Dit komt overeen met hoe MCP-clients voor hoofdsessies en aangepaste sessies worden afgebroken, zodat geïsoleerde cron-taken geen stdio-childprocessen of langlevende MCP-verbindingen lekken tussen uitvoeringen.

  </Accordion>
  <Accordion title="Subagent- en Discord-aflevering">
    Wanneer geïsoleerde cron-uitvoeringen subagents orkestreren, geeft aflevering ook de voorkeur aan de uiteindelijke descendant-uitvoer boven verouderde tussentekst van de parent. Als descendants nog draaien, onderdrukt OpenClaw die gedeeltelijke parent-update in plaats van deze aan te kondigen.

    Voor tekst-only Discord-aankondigingsdoelen verzendt OpenClaw de canonieke uiteindelijke assistenttekst één keer in plaats van zowel gestreamde/tussentijdse tekstpayloads als het uiteindelijke antwoord opnieuw af te spelen. Media en gestructureerde Discord-payloads worden nog steeds als afzonderlijke payloads afgeleverd, zodat bijlagen en componenten niet worden weggegooid.

  </Accordion>
</AccordionGroup>

### Payloadopties voor geïsoleerde taken

<ParamField path="--message" type="string" required>
  Prompttekst (vereist voor geïsoleerd).
</ParamField>
<ParamField path="--model" type="string">
  Modeloverride; gebruikt het geselecteerde toegestane model voor de taak.
</ParamField>
<ParamField path="--thinking" type="string">
  Override voor denkniveau.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Sla injectie van workspace-bootstrapbestanden over.
</ParamField>
<ParamField path="--tools" type="string">
  Beperk welke tools de taak kan gebruiken, bijvoorbeeld `--tools exec,read`.
</ParamField>

`--model` gebruikt het geselecteerde toegestane model als het primaire model van die taak. Dit is niet hetzelfde als een `/model`-override voor een chatsessie: geconfigureerde fallbackketens blijven gelden wanneer het primaire model van de taak faalt. Als het aangevraagde model niet is toegestaan of niet kan worden opgelost, laat cron de uitvoering falen met een expliciete validatiefout in plaats van stilzwijgend terug te vallen op de agent-/standaardmodelselectie van de taak.

Cron-taken kunnen ook `fallbacks` op payloadniveau bevatten. Wanneer aanwezig, vervangt die lijst de geconfigureerde fallbackketen voor de taak. Gebruik `fallbacks: []` in de taakpayload/API wanneer je een strikte cron-uitvoering wilt die alleen het geselecteerde model probeert. Als een taak `--model` heeft maar geen payload- of geconfigureerde fallbacks, geeft OpenClaw een expliciete lege fallbackoverride door, zodat de primaire agent niet als verborgen extra retrydoel wordt toegevoegd.

Prioriteit voor modelselectie bij geïsoleerde taken is:

1. Gmail-hook-modeloverride (wanneer de uitvoering uit Gmail kwam en die override is toegestaan)
2. Per-taakpayload `model`
3. Door gebruiker geselecteerde opgeslagen modeloverride voor cron-sessie
4. Agent-/standaardmodelselectie

Snelle modus volgt ook de opgeloste live selectie. Als de geselecteerde modelconfiguratie `params.fastMode` heeft, gebruikt geïsoleerde cron die standaard. Een opgeslagen sessieoverride voor `fastMode` wint nog steeds van configuratie in beide richtingen.

Als een geïsoleerde uitvoering een live model-switch-overdracht raakt, probeert cron opnieuw met de overgeschakelde provider/het overgeschakelde model en bewaart die live selectie voor de actieve uitvoering voordat opnieuw wordt geprobeerd. Wanneer de switch ook een nieuw auth-profiel bevat, bewaart cron die auth-profieloverride ook voor de actieve uitvoering. Retries zijn begrensd: na de eerste poging plus 2 switch-retries breekt cron af in plaats van eindeloos te blijven herhalen.

Voordat een geïsoleerde Cron-run de agent-runner binnengaat, controleert OpenClaw bereikbare lokale provider-eindpunten voor geconfigureerde `api: "ollama"`- en `api: "openai-completions"`-providers waarvan `baseUrl` loopback, privénetwerk of `.local` is. Als dat eindpunt niet beschikbaar is, wordt de run geregistreerd als `skipped` met een duidelijke provider/model-fout in plaats van een modelaanroep te starten. Het eindpuntresultaat wordt 5 minuten gecachet, zodat veel geplande taken die dezelfde dode lokale Ollama-, vLLM-, SGLang- of LM Studio-server gebruiken één kleine probe delen in plaats van een verzoekenstorm te veroorzaken. Overgeslagen provider-preflight-runs verhogen de execution-error backoff niet; schakel `failureAlert.includeSkipped` in wanneer je herhaalde meldingen over overslaan wilt.

## Levering en uitvoer

| Modus      | Wat gebeurt er                                                    |
| ---------- | ----------------------------------------------------------------- |
| `announce` | Levert definitieve tekst als fallback aan het doel als de agent niet heeft verzonden |
| `webhook`  | POST voltooide event-payload naar een URL                         |
| `none`     | Geen fallback-levering door de runner                             |

Gebruik `--announce --channel telegram --to "-1001234567890"` voor kanaallevering. Gebruik voor Telegram-forumonderwerpen `-1001234567890:topic:123`; directe RPC/config-aanroepers kunnen ook `delivery.threadId` als string of getal doorgeven. Slack/Discord/Mattermost-doelen moeten expliciete prefixes gebruiken (`channel:<id>`, `user:<id>`). Matrix-ruimte-ID's zijn hoofdlettergevoelig; gebruik de exacte ruimte-ID of de vorm `room:!room:server` uit Matrix.

Wanneer announce-levering `channel: "last"` gebruikt of `channel` weglaat, kan een provider-geprefixet doel zoals `telegram:123` het kanaal selecteren voordat Cron terugvalt op sessiegeschiedenis of één geconfigureerd kanaal. Alleen prefixes die door de geladen Plugin worden geadverteerd zijn providerselectors. Als `delivery.channel` expliciet is, moet de doelprefix dezelfde provider noemen; bijvoorbeeld `channel: "whatsapp"` met `to: "telegram:123"` wordt geweigerd in plaats van WhatsApp de Telegram-ID als telefoonnummer te laten interpreteren. Doelsoort- en serviceprefixes zoals `channel:<id>`, `user:<id>`, `imessage:<handle>` en `sms:<number>` blijven kanaaleigen doelsyntax, geen providerselectors.

Voor geïsoleerde taken wordt chatlevering gedeeld. Als er een chatroute beschikbaar is, kan de agent de `message`-tool gebruiken, zelfs wanneer de taak `--no-deliver` gebruikt. Als de agent naar het geconfigureerde/huidige doel verzendt, slaat OpenClaw de fallback-announce over. Anders bepalen `announce`, `webhook` en `none` alleen wat de runner met het definitieve antwoord doet na de agentbeurt.

Wanneer een agent een geïsoleerde herinnering maakt vanuit een actieve chat, slaat OpenClaw het bewaarde live-leveringsdoel op voor de fallback-announce-route. Interne sessiesleutels kunnen kleine letters bevatten; provider-leveringsdoelen worden niet uit die sleutels gereconstrueerd wanneer de huidige chatcontext beschikbaar is.

Impliciete announce-levering gebruikt geconfigureerde kanaal-allowlists om verouderde doelen te valideren en om te leiden. Goedkeuringen uit de DM-pairing-store zijn geen ontvangers voor fallback-automatisering; stel `delivery.to` in of configureer de kanaalvermelding `allowFrom` wanneer een geplande taak proactief naar een DM moet verzenden.

Foutmeldingen volgen een apart bestemmingspad:

- `cron.failureDestination` stelt een globale standaard in voor foutmeldingen.
- `job.delivery.failureDestination` overschrijft dat per taak.
- Als geen van beide is ingesteld en de taak al via `announce` levert, vallen foutmeldingen nu terug op dat primaire announce-doel.
- `delivery.failureDestination` wordt alleen ondersteund op `sessionTarget="isolated"`-taken, tenzij de primaire leveringsmodus `webhook` is.
- `failureAlert.includeSkipped: true` laat een taak of globaal Cron-waarschuwingsbeleid herhaalde waarschuwingen voor overgeslagen runs sturen. Overgeslagen runs houden een aparte opeenvolgende teller voor overslaan bij, zodat ze de execution-error backoff niet beïnvloeden.

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

Elk verzoek moet het hook-token via een header bevatten:

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
    Aangepaste hooknamen worden opgelost via `hooks.mappings` in de configuratie. Mappings kunnen willekeurige payloads omzetten in `wake`- of `agent`-acties met templates of codetransformaties.
  </Accordion>
</AccordionGroup>

<Warning>
Houd hook-eindpunten achter loopback, tailnet of een vertrouwde reverse proxy.

- Gebruik een speciaal hook-token; hergebruik geen Gateway-auth-tokens.
- Houd `hooks.path` op een speciaal subpad; `/` wordt geweigerd.
- Stel `hooks.allowedAgentIds` in om expliciete `agentId`-routering te beperken.
- Houd `hooks.allowRequestSessionKey=false`, tenzij je door de aanroeper geselecteerde sessies nodig hebt.
- Als je `hooks.allowRequestSessionKey` inschakelt, stel dan ook `hooks.allowedSessionKeyPrefixes` in om toegestane sessiesleutelvormen te beperken.
- Hook-payloads worden standaard met veiligheidsgrenzen omwikkeld.

</Warning>

## Gmail PubSub-integratie

Verbind Gmail-inboxtriggers met OpenClaw via Google PubSub.

<Note>
**Vereisten:** `gcloud` CLI, `gog` (gogcli), OpenClaw-hooks ingeschakeld, Tailscale voor het openbare HTTPS-eindpunt.
</Note>

### Wizard-instelling (aanbevolen)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Dit schrijft de `hooks.gmail`-configuratie, schakelt de Gmail-preset in en gebruikt Tailscale Funnel voor het push-eindpunt.

### Gateway automatisch starten

Wanneer `hooks.enabled=true` en `hooks.gmail.account` is ingesteld, start de Gateway `gog gmail watch serve` bij het opstarten en verlengt de watch automatisch. Stel `OPENCLAW_SKIP_GMAIL_WATCHER=1` in om dit uit te schakelen.

### Handmatige eenmalige instelling

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
- Geconfigureerde fallback-ketens blijven van toepassing omdat Cron `--model` een primaire taakinstelling is, geen sessie-`/model`-overschrijving.
- Payload `fallbacks` vervangt geconfigureerde fallbacks voor die taak; `fallbacks: []` schakelt fallback uit en maakt de run strikt.
- Een gewone `--model` zonder expliciete of geconfigureerde fallbacklijst valt niet terug naar de primaire agent als een stil extra retrydoel.

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

`maxConcurrentRuns` beperkt zowel geplande Cron-dispatch als de uitvoering van geïsoleerde agentbeurten. Geïsoleerde Cron-agentbeurten gebruiken intern de speciale `cron-nested`-uitvoeringslane van de wachtrij, dus door deze waarde te verhogen kunnen onafhankelijke Cron-LLM-runs parallel voortgang boeken in plaats van alleen hun buitenste Cron-wrappers te starten. De gedeelde niet-Cron-`nested`-lane wordt niet door deze instelling verbreed.

De runtime-state-sidecar wordt afgeleid van `cron.store`: een `.json`-store zoals `~/clawd/cron/jobs.json` gebruikt `~/clawd/cron/jobs-state.json`, terwijl een storepad zonder `.json`-suffix `-state.json` toevoegt.

Als je `jobs.json` handmatig bewerkt, laat `jobs-state.json` dan buiten versiebeheer. OpenClaw gebruikt die sidecar voor wachtende slots, actieve markeringen, last-run-metadata en de planningsidentiteit die de scheduler vertelt wanneer een extern bewerkte taak een nieuwe `nextRunAtMs` nodig heeft.

Cron uitschakelen: `cron.enabled: false` of `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Eenmalige retry**: tijdelijke fouten (rate limit, overbelasting, netwerk, serverfout) worden tot 3 keer opnieuw geprobeerd met exponentiële backoff. Permanente fouten schakelen onmiddellijk uit.

    **Terugkerende retry**: exponentiële backoff (30s tot 60m) tussen retries. Backoff wordt gereset na de volgende succesvolle run.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (standaard `24h`) ruimt geïsoleerde run-sessie-items op. `cron.runLog.maxBytes` / `cron.runLog.keepLines` ruimen run-logbestanden automatisch op.
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
    - Controleer `cron.enabled` en de omgevingsvariabele `OPENCLAW_SKIP_CRON`.
    - Bevestig dat de Gateway continu draait.
    - Controleer voor `cron`-schema's de tijdzone (`--tz`) ten opzichte van de tijdzone van de host.
    - `reason: not-due` in de uitvoer van een run betekent dat een handmatige run is gecontroleerd met `openclaw cron run <jobId> --due` en dat de taak nog niet aan de beurt was.

  </Accordion>
  <Accordion title="Cron is geactiveerd maar er is geen levering">
    - Leveringsmodus `none` betekent dat er geen terugvalverzending door de runner wordt verwacht. De agent kan nog steeds rechtstreeks verzenden met de `message`-tool wanneer er een chatroute beschikbaar is.
    - Ontbrekend/ongeldig leveringsdoel (`channel`/`to`) betekent dat uitgaand verkeer is overgeslagen.
    - Voor Matrix kunnen gekopieerde of verouderde taken met `delivery.to`-ruimte-ID's in kleine letters mislukken, omdat Matrix-ruimte-ID's hoofdlettergevoelig zijn. Bewerk de taak naar de exacte waarde `!room:server` of `room:!room:server` uit Matrix.
    - Kanaalverificatiefouten (`unauthorized`, `Forbidden`) betekenen dat levering is geblokkeerd door referenties.
    - Als de geïsoleerde run alleen het stille token (`NO_REPLY` / `no_reply`) retourneert, onderdrukt OpenClaw rechtstreekse uitgaande levering en ook het terugvalpad voor de samenvatting in de wachtrij, zodat er niets terug naar de chat wordt geplaatst.
    - Als de agent de gebruiker zelf moet berichten, controleer dan of de taak een bruikbare route heeft (`channel: "last"` met een eerdere chat, of een expliciet kanaal/doel).

  </Accordion>
  <Accordion title="Cron of Heartbeat lijkt /new-stijl-rollover te voorkomen">
    - Dagelijkse en inactieve resetversheid is niet gebaseerd op `updatedAt`; zie [Sessiebeheer](/nl/concepts/session#session-lifecycle).
    - Cron-wake-ups, Heartbeat-runs, exec-meldingen en Gateway-boekhouding kunnen de sessierij bijwerken voor routering/status, maar ze verlengen `sessionStartedAt` of `lastInteractionAt` niet.
    - Voor verouderde rijen die zijn gemaakt voordat die velden bestonden, kan OpenClaw `sessionStartedAt` herstellen uit de JSONL-sessieheader van het transcript wanneer het bestand nog beschikbaar is. Verouderde inactieve rijen zonder `lastInteractionAt` gebruiken die herstelde starttijd als hun inactiviteitsbasislijn.

  </Accordion>
  <Accordion title="Aandachtspunten rond tijdzones">
    - Cron zonder `--tz` gebruikt de tijdzone van de Gateway-host.
    - `at`-schema's zonder tijdzone worden behandeld als UTC.
    - Heartbeat `activeHours` gebruikt geconfigureerde tijdzoneresolutie.

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Automatisering en taken](/nl/automation) — alle automatiseringsmechanismen in één oogopslag
- [Achtergrondtaken](/nl/automation/tasks) — taaklogboek voor Cron-uitvoeringen
- [Heartbeat](/nl/gateway/heartbeat) — periodieke beurten in de hoofdsessie
- [Tijdzone](/nl/concepts/timezone) — tijdzoneconfiguratie
