---
read_when:
    - Achtergrondtaken of wekmomenten plannen
    - Externe triggers (Webhooks, Gmail) aansluiten op OpenClaw
    - Kiezen tussen Heartbeat en Cron voor geplande taken
sidebarTitle: Scheduled tasks
summary: Geplande taken, Webhooks en Gmail PubSub-activeringen voor de Gateway-planner
title: Geplande taken
x-i18n:
    generated_at: "2026-04-29T22:23:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 021e623bdea786178e0948e9905360c897c26d31fdf866e9af8cfc9538968d60
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron is de ingebouwde planner van de Gateway. Hij bewaart taken, wekt de agent op het juiste moment en kan uitvoer terugsturen naar een chatkanaal of Webhook-eindpunt.

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

## Hoe Cron werkt

- Cron draait **binnen het Gateway**-proces (niet binnen het model).
- Taakdefinities blijven bewaard in `~/.openclaw/cron/jobs.json`, zodat herstarts planningen niet kwijtraken.
- Runtime-uitvoeringsstatus blijft ernaast bewaard in `~/.openclaw/cron/jobs-state.json`. Als je Cron-definities in git bijhoudt, houd dan `jobs.json` bij en voeg `jobs-state.json` toe aan gitignore.
- Na de splitsing kunnen oudere OpenClaw-versies `jobs.json` lezen, maar kunnen ze taken als nieuw behandelen omdat runtime-velden nu in `jobs-state.json` staan.
- Wanneer `jobs.json` wordt bewerkt terwijl de Gateway draait of gestopt is, vergelijkt OpenClaw de gewijzigde planningsvelden met metadata van openstaande runtime-slots en wist verouderde `nextRunAtMs`-waarden. Herschrijvingen die alleen opmaak of sleutelvolgorde wijzigen, behouden de openstaande slot.
- Alle Cron-uitvoeringen maken [achtergrondtaak](/nl/automation/tasks)-records aan.
- Bij het opstarten van de Gateway worden verlopen geïsoleerde agentbeurt-taken opnieuw gepland buiten het kanaalverbindingsvenster in plaats van onmiddellijk opnieuw afgespeeld, zodat het opstarten van Discord/Telegram en de native-command-instelling responsief blijven na herstarts.
- Eenmalige taken (`--at`) worden standaard automatisch verwijderd na succes.
- Geïsoleerde Cron-uitvoeringen sluiten op best-effortbasis bijgehouden browsertabs/processen voor hun `cron:<jobId>`-sessie wanneer de uitvoering is voltooid, zodat losgekoppelde browserautomatisering geen verweesde processen achterlaat.
- Geïsoleerde Cron-uitvoeringen beschermen ook tegen verouderde bevestigingsantwoorden. Als het eerste resultaat slechts een tussentijdse statusupdate is (`on it`, `pulling everything together` en vergelijkbare hints) en geen onderliggende subagent-uitvoering nog verantwoordelijk is voor het definitieve antwoord, vraagt OpenClaw één keer opnieuw om het daadwerkelijke resultaat voordat het wordt afgeleverd.
- Geïsoleerde Cron-uitvoeringen geven de voorkeur aan gestructureerde metadata over geweigerde uitvoering van de ingebedde uitvoering en vallen daarna terug op bekende markeringen voor definitieve samenvatting/uitvoer, zoals `SYSTEM_RUN_DENIED` en `INVALID_REQUEST`, zodat een geblokkeerde opdracht niet als een geslaagde uitvoering wordt gerapporteerd.
- Geïsoleerde Cron-uitvoeringen behandelen agentfouten op uitvoeringsniveau ook als taakfouten, zelfs wanneer er geen antwoordpayload wordt geproduceerd, zodat model-/providerfouten fouttellers verhogen en foutmeldingen activeren in plaats van de taak als succesvol te wissen.
- Wanneer een geïsoleerde agentbeurt-taak `timeoutSeconds` bereikt, breekt Cron de onderliggende agentuitvoering af en geeft die een kort opruimvenster. Als de uitvoering niet leegloopt, wist Gateway-beheerde opruiming geforceerd het sessie-eigendom van die uitvoering voordat Cron de timeout registreert, zodat chatwerk in de wachtrij niet achter een verouderde verwerkende sessie blijft hangen.

<a id="maintenance"></a>

<Note>
Taakverzoening voor Cron is eerst runtime-eigendom en daarna ondersteund door duurzame geschiedenis: een actieve Cron-taak blijft live zolang de Cron-runtime die taak nog als actief bijhoudt, zelfs als er nog een oude onderliggende sessierij bestaat. Zodra de runtime geen eigenaar meer is van de taak en het respijtvenster van 5 minuten is verlopen, controleert onderhoud de opgeslagen uitvoeringslogs en taakstatus voor de overeenkomende `cron:<jobId>:<startedAt>`-uitvoering. Als die duurzame geschiedenis een terminaal resultaat toont, wordt het taaklogboek daaruit afgerond; anders kan Gateway-beheerd onderhoud de taak als `lost` markeren. Offline CLI-audit kan herstellen uit duurzame geschiedenis, maar behandelt zijn eigen lege actieve-taakset in het proces niet als bewijs dat een Gateway-beheerde Cron-uitvoering verdwenen is.
</Note>

## Planningstypen

| Soort   | CLI-vlag  | Beschrijving                                            |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Eenmalige tijdstempel (ISO 8601 of relatief zoals `20m`) |
| `every` | `--every` | Vast interval                                           |
| `cron`  | `--cron`  | Cron-expressie met 5 of 6 velden met optionele `--tz`   |

Tijdstempels zonder tijdzone worden als UTC behandeld. Voeg `--tz America/New_York` toe voor planning op basis van lokale wandkloktijd.

Terugkerende expressies aan het begin van het uur worden automatisch tot maximaal 5 minuten gespreid om belastingpieken te verminderen. Gebruik `--exact` om precieze timing af te dwingen of `--stagger 30s` voor een expliciet venster.

### Dag-van-de-maand en dag-van-de-week gebruiken OF-logica

Cron-expressies worden geparseerd door [croner](https://github.com/Hexagon/croner). Wanneer zowel de velden dag-van-de-maand als dag-van-de-week geen wildcard zijn, matcht croner wanneer **een van beide** velden matcht, niet beide. Dit is standaard Vixie cron-gedrag.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Dit wordt ongeveer 5-6 keer per maand geactiveerd in plaats van 0-1 keer per maand. OpenClaw gebruikt hier het standaard OF-gedrag van Croner. Om beide voorwaarden te vereisen, gebruik je Croners `+`-modifier voor dag-van-de-week (`0 9 15 * +1`) of plan je op één veld en bewaak je het andere in de prompt of opdracht van je taak.

## Uitvoeringsstijlen

| Stijl           | `--session`-waarde | Draait in                | Beste voor                       |
| --------------- | ------------------ | ------------------------ | -------------------------------- |
| Hoofdsessie     | `main`             | Volgende Heartbeat-beurt | Herinneringen, systeemgebeurtenissen |
| Geïsoleerd      | `isolated`         | Toegewijde `cron:<jobId>` | Rapporten, achtergrondklussen   |
| Huidige sessie  | `current`          | Gebonden bij aanmaken    | Terugkerend werk met context     |
| Aangepaste sessie | `session:custom-id` | Blijvende benoemde sessie | Workflows die voortbouwen op geschiedenis |

<AccordionGroup>
  <Accordion title="Hoofdsessie vs geïsoleerd vs aangepast">
    **Hoofdsessie**-taken plaatsen een systeemgebeurtenis in de wachtrij en wekken optioneel de Heartbeat (`--wake now` of `--wake next-heartbeat`). Die systeemgebeurtenissen verlengen de versheid voor dagelijkse/inactieve resets van de doelsessie niet. **Geïsoleerde** taken draaien een toegewijde agentbeurt met een nieuwe sessie. **Aangepaste sessies** (`session:xxx`) behouden context tussen uitvoeringen, waardoor workflows zoals dagelijkse standups mogelijk worden die voortbouwen op eerdere samenvattingen.
  </Accordion>
  <Accordion title="Wat 'nieuwe sessie' betekent voor geïsoleerde taken">
    Voor geïsoleerde taken betekent "nieuwe sessie" een nieuwe transcript-/sessie-id voor elke uitvoering. OpenClaw kan veilige voorkeuren meenemen, zoals instellingen voor thinking/fast/verbose, labels en expliciet door de gebruiker geselecteerde model-/auth-overschrijvingen, maar erft geen omgevingsgesprekscontext van een oudere Cron-rij: kanaal-/groepsroutering, verzend- of wachtrijbeleid, elevatie, herkomst of ACP-runtimebinding. Gebruik `current` of `session:<id>` wanneer een terugkerende taak bewust op dezelfde gesprekscontext moet voortbouwen.
  </Accordion>
  <Accordion title="Runtime-opruiming">
    Voor geïsoleerde taken omvat runtime-afbouw nu best-effort browseropruiming voor die Cron-sessie. Opruimfouten worden genegeerd, zodat het daadwerkelijke Cron-resultaat nog steeds leidend is.

    Geïsoleerde Cron-uitvoeringen ruimen ook alle gebundelde MCP-runtime-instanties op die voor de taak zijn aangemaakt via het gedeelde pad voor runtime-opruiming. Dit komt overeen met hoe MCP-clients voor hoofdsessies en aangepaste sessies worden afgebouwd, zodat geïsoleerde Cron-taken geen stdio-childprocessen of langdurige MCP-verbindingen tussen uitvoeringen lekken.

  </Accordion>
  <Accordion title="Subagent en Discord-aflevering">
    Wanneer geïsoleerde Cron-uitvoeringen subagents orkestreren, geeft aflevering ook de voorkeur aan de definitieve onderliggende uitvoer boven verouderde tussentijdse parent-tekst. Als onderliggende uitvoeringen nog actief zijn, onderdrukt OpenClaw die gedeeltelijke parent-update in plaats van die aan te kondigen.

    Voor tekst-only Discord-aankondigingsdoelen verzendt OpenClaw de canonieke definitieve assistenttekst één keer in plaats van zowel gestreamde/tussentijdse tekstpayloads als het definitieve antwoord opnieuw af te spelen. Media en gestructureerde Discord-payloads worden nog steeds als afzonderlijke payloads afgeleverd, zodat bijlagen en componenten niet worden weggelaten.

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

`--model` gebruikt het geselecteerde toegestane model als primair model van die taak. Het is niet hetzelfde als een `/model`-overschrijving voor een chatsessie: geconfigureerde fallbackketens blijven gelden wanneer het primaire model van de taak faalt. Als het gevraagde model niet is toegestaan of niet kan worden opgelost, laat Cron de uitvoering mislukken met een expliciete validatiefout in plaats van stil terug te vallen op de agent-/standaardmodelselectie van de taak.

Cron-taken kunnen ook `fallbacks` op payloadniveau bevatten. Wanneer aanwezig, vervangt die lijst de geconfigureerde fallbackketen voor de taak. Gebruik `fallbacks: []` in de taakpayload/API wanneer je een strikte Cron-uitvoering wilt die alleen het geselecteerde model probeert. Als een taak `--model` heeft maar geen payload- of geconfigureerde fallbacks, geeft OpenClaw een expliciete lege fallbackoverschrijving door zodat het primaire agentmodel niet als verborgen extra opnieuw-te-proberen doel wordt toegevoegd.

Voorrang voor modelselectie bij geïsoleerde taken is:

1. Gmail-hookmodeloverschrijving (wanneer de uitvoering uit Gmail kwam en die overschrijving is toegestaan)
2. `model` per taakpayload
3. Door de gebruiker geselecteerde opgeslagen modeloverschrijving voor Cron-sessie
4. Agent-/standaardmodelselectie

Snelle modus volgt ook de opgeloste live selectie. Als de geselecteerde modelconfiguratie `params.fastMode` heeft, gebruikt geïsoleerde Cron die standaard. Een opgeslagen sessieoverschrijving voor `fastMode` wint nog steeds van configuratie in beide richtingen.

Als een geïsoleerde uitvoering een live model-switchhandoff raakt, probeert Cron opnieuw met de gewisselde provider/het gewisselde model en bewaart die live selectie voor de actieve uitvoering voordat opnieuw wordt geprobeerd. Wanneer de switch ook een nieuw auth-profiel bevat, bewaart Cron die auth-profieloverschrijving ook voor de actieve uitvoering. Nieuwe pogingen zijn begrensd: na de eerste poging plus 2 switch-pogingen breekt Cron af in plaats van eindeloos te blijven herhalen.

Voordat een geïsoleerde Cron-uitvoering de agentrunner binnengaat, controleert OpenClaw bereikbare lokale provider-eindpunten voor geconfigureerde `api: "ollama"`- en `api: "openai-completions"`-providers waarvan `baseUrl` local loopback, private-network of `.local` is. Als dat eindpunt niet beschikbaar is, wordt de uitvoering geregistreerd als `skipped` met een duidelijke provider-/modelfout in plaats van een modelaanroep te starten. Het eindpuntresultaat wordt 5 minuten gecachet, zodat veel verschuldigde taken die dezelfde uitgevallen lokale Ollama-, vLLM-, SGLang- of LM Studio-server gebruiken, één kleine probe delen in plaats van een verzoekstorm te creëren. Overgeslagen provider-preflight-uitvoeringen verhogen de backoff voor uitvoeringsfouten niet; schakel `failureAlert.includeSkipped` in wanneer je herhaalde skip-meldingen wilt.

## Aflevering en uitvoer

| Modus      | Wat er gebeurt                                                     |
| ---------- | ------------------------------------------------------------------ |
| `announce` | Levert definitieve tekst als fallback aan het doel als de agent niets verzond |
| `webhook`  | POST de payload van de voltooide gebeurtenis naar een URL          |
| `none`     | Geen fallbackaflevering door de runner                             |

Gebruik `--announce --channel telegram --to "-1001234567890"` voor aflevering aan een kanaal. Gebruik voor Telegram-forumonderwerpen `-1001234567890:topic:123`; directe RPC-/config-aanroepers kunnen ook `delivery.threadId` als string of getal doorgeven. Slack-/Discord-/Mattermost-doelen moeten expliciete prefixen gebruiken (`channel:<id>`, `user:<id>`). Matrix-kamer-ID's zijn hoofdlettergevoelig; gebruik de exacte kamer-ID of de vorm `room:!room:server` uit Matrix.

Voor geïsoleerde taken wordt chataflevering gedeeld. Als er een chatroute beschikbaar is, kan de agent de tool `message` gebruiken, zelfs wanneer de taak `--no-deliver` gebruikt. Als de agent naar het geconfigureerde/huidige doel verzendt, slaat OpenClaw de fallback-aankondiging over. Anders bepalen `announce`, `webhook` en `none` alleen wat de runner doet met het uiteindelijke antwoord na de agentbeurt.

Wanneer een agent een geïsoleerde herinnering maakt vanuit een actieve chat, slaat OpenClaw het behouden live-afleverdoel op voor de fallback-aankondigingsroute. Interne sessiesleutels kunnen kleine letters bevatten; provider-afleverdoelen worden niet opnieuw opgebouwd uit die sleutels wanneer de huidige chatcontext beschikbaar is.

Foutmeldingen volgen een afzonderlijk bestemmingspad:

- `cron.failureDestination` stelt een globale standaard in voor foutmeldingen.
- `job.delivery.failureDestination` overschrijft dat per taak.
- Als geen van beide is ingesteld en de taak al via `announce` aflevert, vallen foutmeldingen nu terug op dat primaire aankondigingsdoel.
- `delivery.failureDestination` wordt alleen ondersteund voor taken met `sessionTarget="isolated"`, tenzij de primaire aflevermodus `webhook` is.
- `failureAlert.includeSkipped: true` laat een taak of globaal cron-waarschuwingsbeleid kiezen voor herhaalde waarschuwingen over overgeslagen runs. Overgeslagen runs houden een aparte teller voor opeenvolgende overslagen bij, zodat ze geen invloed hebben op de backoff voor uitvoeringsfouten.

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
  <Tab title="Terugkerende geïsoleerde taak">
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
  <Tab title="Model en denkmodus overschrijven">
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

Elke aanvraag moet het hook-token via een header bevatten:

- `Authorization: Bearer <token>` (aanbevolen)
- `x-openclaw-token: <token>`

Querystring-tokens worden geweigerd.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Zet een systeemgebeurtenis in de wachtrij voor de hoofdsessie:

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
    Voer een geïsoleerde agentbeurt uit:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Velden: `message` (vereist), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Toegewezen hooks (POST /hooks/<name>)">
    Aangepaste hooknamen worden opgelost via `hooks.mappings` in de configuratie. Toewijzingen kunnen willekeurige payloads omzetten in `wake`- of `agent`-acties met sjablonen of codetransformaties.
  </Accordion>
</AccordionGroup>

<Warning>
Houd hook-eindpunten achter loopback, tailnet of een vertrouwde reverse proxy.

- Gebruik een toegewijd hook-token; hergebruik geen Gateway-authenticatietokens.
- Houd `hooks.path` op een toegewijd subpad; `/` wordt geweigerd.
- Stel `hooks.allowedAgentIds` in om expliciete `agentId`-routering te beperken.
- Houd `hooks.allowRequestSessionKey=false`, tenzij u door de aanroeper gekozen sessies nodig hebt.
- Als u `hooks.allowRequestSessionKey` inschakelt, stel dan ook `hooks.allowedSessionKeyPrefixes` in om toegestane vormen van sessiesleutels te beperken.
- Hook-payloads worden standaard met veiligheidsgrenzen omwikkeld.

</Warning>

## Gmail PubSub-integratie

Verbind Gmail-inboxtriggers met OpenClaw via Google PubSub.

<Note>
**Vereisten:** `gcloud` CLI, `gog` (gogcli), ingeschakelde OpenClaw-hooks, Tailscale voor het openbare HTTPS-eindpunt.
</Note>

### Wizardconfiguratie (aanbevolen)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Dit schrijft de `hooks.gmail`-configuratie, schakelt de Gmail-preset in en gebruikt Tailscale Funnel voor het push-eindpunt.

### Gateway automatisch starten

Wanneer `hooks.enabled=true` en `hooks.gmail.account` is ingesteld, start de Gateway bij het opstarten `gog gmail watch serve` en vernieuwt de watch automatisch. Stel `OPENCLAW_SKIP_GMAIL_WATCHER=1` in om u af te melden.

### Handmatige eenmalige configuratie

<Steps>
  <Step title="Selecteer het GCP-project">
    Selecteer het GCP-project dat eigenaar is van de OAuth-client die door `gog` wordt gebruikt:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Maak topic en verleen Gmail-push-toegang">
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

### Gmail-model overschrijven

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
- Als het model is toegestaan, bereikt die exacte provider/model-combinatie de geïsoleerde agentrun.
- Als het niet is toegestaan of niet kan worden opgelost, laat cron de run mislukken met een expliciete validatiefout.
- Geconfigureerde fallback-ketens blijven van toepassing omdat cron `--model` een primaire taakinstelling is, geen sessie-overschrijving met `/model`.
- Payload `fallbacks` vervangt geconfigureerde fallbacks voor die taak; `fallbacks: []` schakelt fallback uit en maakt de run strikt.
- Een gewone `--model` zonder expliciete of geconfigureerde fallback-lijst valt niet door naar de primaire agent als stil extra retrydoel.

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

`maxConcurrentRuns` beperkt zowel geplande cron-dispatch als geïsoleerde uitvoering van agentbeurten. Geïsoleerde cron-agentbeurten gebruiken intern de toegewijde `cron-nested`-uitvoeringsbaan van de wachtrij, dus door deze waarde te verhogen kunnen onafhankelijke cron-LLM-runs parallel voortgang boeken in plaats van alleen hun buitenste cron-wrappers te starten. De gedeelde niet-cron-`nested`-baan wordt door deze instelling niet verbreed.

De runtime-state-sidecar wordt afgeleid van `cron.store`: een `.json`-store zoals `~/clawd/cron/jobs.json` gebruikt `~/clawd/cron/jobs-state.json`, terwijl een storepad zonder `.json`-achtervoegsel `-state.json` toevoegt.

Als u `jobs.json` handmatig bewerkt, laat `jobs-state.json` dan buiten versiebeheer. OpenClaw gebruikt die sidecar voor wachtende slots, actieve markeringen, metadata van laatste runs en de planningsidentiteit die de planner vertelt wanneer een extern bewerkte taak een nieuwe `nextRunAtMs` nodig heeft.

Cron uitschakelen: `cron.enabled: false` of `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retrygedrag">
    **Eenmalige retry**: tijdelijke fouten (rate limit, overbelasting, netwerk, serverfout) worden tot 3 keer opnieuw geprobeerd met exponentiële backoff. Permanente fouten schakelen onmiddellijk uit.

    **Terugkerende retry**: exponentiële backoff (30s tot 60m) tussen retries. Backoff wordt gereset na de volgende succesvolle run.

  </Accordion>
  <Accordion title="Onderhoud">
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
  <Accordion title="Cron wordt niet uitgevoerd">
    - Controleer de omgevingsvariabele `cron.enabled` en `OPENCLAW_SKIP_CRON`.
    - Bevestig dat de Gateway continu draait.
    - Controleer voor `cron`-schema's de tijdzone (`--tz`) ten opzichte van de hosttijdzone.
    - `reason: not-due` in run-uitvoer betekent dat een handmatige run is gecontroleerd met `openclaw cron run <jobId> --due` en dat de taak nog niet aan de beurt was.

  </Accordion>
  <Accordion title="Cron is uitgevoerd maar zonder aflevering">
    - Aflevermodus `none` betekent dat er geen fallback-verzending door de runner wordt verwacht. De agent kan nog steeds rechtstreeks verzenden met de tool `message` wanneer er een chatroute beschikbaar is.
    - Ontbrekend/ongeldig afleverdoel (`channel`/`to`) betekent dat uitgaand verkeer is overgeslagen.
    - Voor Matrix kunnen gekopieerde of oude taken met naar kleine letters omgezette `delivery.to`-kamer-ID's mislukken, omdat Matrix-kamer-ID's hoofdlettergevoelig zijn. Bewerk de taak naar de exacte waarde `!room:server` of `room:!room:server` uit Matrix.
    - Kanaal-authenticatiefouten (`unauthorized`, `Forbidden`) betekenen dat aflevering is geblokkeerd door inloggegevens.
    - Als de geïsoleerde run alleen het stille token (`NO_REPLY` / `no_reply`) retourneert, onderdrukt OpenClaw rechtstreekse uitgaande aflevering en onderdrukt het ook het fallback-pad voor samenvattingen in de wachtrij, zodat er niets terug naar de chat wordt geplaatst.
    - Als de agent de gebruiker zelf een bericht moet sturen, controleer dan of de taak een bruikbare route heeft (`channel: "last"` met een eerdere chat, of een expliciet kanaal/doel).

  </Accordion>
  <Accordion title="Cron of Heartbeat lijkt /new-style-overgang te verhinderen">
    - De actualiteit voor dagelijkse resets en inactiviteitsresets is niet gebaseerd op `updatedAt`; zie [Sessiebeheer](/nl/concepts/session#session-lifecycle).
    - Cron-wake-ups, Heartbeat-runs, exec-meldingen en Gateway-administratie kunnen de sessierij bijwerken voor routering/status, maar ze verlengen `sessionStartedAt` of `lastInteractionAt` niet.
    - Voor verouderde rijen die zijn gemaakt voordat die velden bestonden, kan OpenClaw `sessionStartedAt` herstellen uit de JSONL-sessieheader van het transcript wanneer het bestand nog beschikbaar is. Verouderde inactieve rijen zonder `lastInteractionAt` gebruiken die herstelde starttijd als hun basislijn voor inactiviteit.

  </Accordion>
  <Accordion title="Valkuilen met tijdzones">
    - Cron zonder `--tz` gebruikt de tijdzone van de Gateway-host.
    - `at`-planningen zonder tijdzone worden behandeld als UTC.
    - Heartbeat `activeHours` gebruikt de geconfigureerde tijdzone-resolutie.

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Automatisering en taken](/nl/automation) — alle automatiseringsmechanismen in één oogopslag
- [Achtergrondtaken](/nl/automation/tasks) — taaklogboek voor Cron-uitvoeringen
- [Heartbeat](/nl/gateway/heartbeat) — periodieke beurten in de hoofdsessie
- [Tijdzone](/nl/concepts/timezone) — tijdzoneconfiguratie
