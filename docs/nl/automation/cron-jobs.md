---
read_when:
    - Achtergrondtaken of wekmomenten plannen
    - Externe triggers (Webhooks, Gmail) aansluiten op OpenClaw
    - Kiezen tussen Heartbeat en Cron voor geplande taken
sidebarTitle: Scheduled tasks
summary: Geplande taken, webhooks en Gmail PubSub-triggers voor de Gateway-planner
title: Geplande taken
x-i18n:
    generated_at: "2026-05-07T13:13:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19c3505408ab7602775dc1168c2c7a626986fa2a15ef02a44dc864d5ec538bfe
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron is de ingebouwde planner van de Gateway. Cron bewaart taken, wekt de agent op het juiste moment en kan uitvoer terugbezorgen aan een chatkanaal of Webhook-eindpunt.

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
  <Step title="Bekijk de uitvoeringsgeschiedenis">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Hoe Cron werkt

- Cron draait **binnen het Gateway**-proces (niet binnen het model).
- Taakdefinities blijven bewaard in `~/.openclaw/cron/jobs.json`, zodat herstarts geen planningen verliezen.
- De uitvoeringsstatus blijft ernaast bewaard in `~/.openclaw/cron/jobs-state.json`. Als je Cron-definities in git volgt, volg dan `jobs.json` en voeg `jobs-state.json` toe aan gitignore.
- Na de splitsing kunnen oudere OpenClaw-versies `jobs.json` lezen, maar ze kunnen taken als nieuw behandelen omdat runtimevelden nu in `jobs-state.json` staan.
- Wanneer `jobs.json` wordt bewerkt terwijl de Gateway draait of is gestopt, vergelijkt OpenClaw de gewijzigde planningsvelden met metadata van openstaande runtimeslots en wist het verouderde `nextRunAtMs`-waarden. Herschrijvingen met alleen opmaak of alleen sleutelvolgorde behouden het openstaande slot.
- Alle Cron-uitvoeringen maken records voor [achtergrondtaken](/nl/automation/tasks).
- Bij het starten van de Gateway worden achterstallige geïsoleerde agentbeurt-taken opnieuw gepland buiten het kanaalverbindingsvenster in plaats van direct opnieuw afgespeeld, zodat het opstarten van Discord/Telegram en het instellen van native opdrachten na herstarts responsief blijven.
- Eenmalige taken (`--at`) worden standaard automatisch verwijderd na een geslaagde uitvoering.
- Geïsoleerde Cron-uitvoeringen sluiten naar beste vermogen bijgehouden browsertabbladen/processen voor hun `cron:<jobId>`-sessie wanneer de uitvoering is voltooid, zodat losgekoppelde browserautomatisering geen verweesde processen achterlaat.
- Geïsoleerde Cron-uitvoeringen die de smalle Cron-zelfopruimingsmachtiging ontvangen, kunnen nog steeds de plannerstatus en een zelfgefilterde lijst van hun huidige taak lezen, zodat status-/Heartbeat-controles hun eigen planning kunnen inspecteren zonder bredere Cron-mutatierechten te krijgen.
- Geïsoleerde Cron-uitvoeringen beschermen ook tegen verouderde bevestigingsantwoorden. Als het eerste resultaat alleen een tussentijdse statusupdate is (`on it`, `pulling everything together` en vergelijkbare hints) en geen onderliggende subagentuitvoering nog verantwoordelijk is voor het definitieve antwoord, vraagt OpenClaw één keer opnieuw om het daadwerkelijke resultaat voordat het wordt bezorgd.
- Geïsoleerde Cron-uitvoeringen geven de voorkeur aan gestructureerde metadata voor uitvoeringsweigering uit de ingebedde uitvoering en vallen daarna terug op bekende markeringen voor definitieve samenvatting/uitvoer, zoals `SYSTEM_RUN_DENIED` en `INVALID_REQUEST`, zodat een geblokkeerde opdracht niet als een geslaagde uitvoering wordt gerapporteerd.
- Geïsoleerde Cron-uitvoeringen behandelen fouten op uitvoeringsniveau van agents ook als taakfouten, zelfs wanneer er geen antwoordpayload wordt geproduceerd, zodat model-/providerfouten fouttellers verhogen en foutmeldingen activeren in plaats van de taak als geslaagd af te handelen.
- Wanneer een geïsoleerde agentbeurt-taak `timeoutSeconds` bereikt, breekt Cron de onderliggende agentuitvoering af en geeft die een kort opruimvenster. Als de uitvoering niet leegloopt, wist Gateway-eigen opruiming geforceerd het sessie-eigendom van die uitvoering voordat Cron de timeout registreert, zodat in de wachtrij geplaatst chatwerk niet achterblijft achter een verouderde verwerkende sessie.

<a id="maintenance"></a>

<Note>
Taakreconciliatie voor Cron is eerst runtime-eigen en daarna ondersteund door duurzame geschiedenis: een actieve Cron-taak blijft live zolang de Cron-runtime die taak nog als actief volgt, zelfs als er nog een oude onderliggende sessierij bestaat. Zodra de runtime de taak niet meer bezit en het respijtvenster van 5 minuten verloopt, controleren onderhoudsprocessen bewaarde uitvoeringslogboeken en taakstatus op de overeenkomende `cron:<jobId>:<startedAt>`-uitvoering. Als die duurzame geschiedenis een eindresultaat toont, wordt het taakregister daarmee afgerond; anders kan Gateway-eigen onderhoud de taak als `lost` markeren. Offline CLI-audit kan herstellen vanuit duurzame geschiedenis, maar behandelt de eigen lege in-process set van actieve taken niet als bewijs dat een Gateway-eigen Cron-uitvoering verdwenen is.
</Note>

## Planningstypen

| Soort   | CLI-vlag  | Beschrijving                                           |
| ------- | --------- | ------------------------------------------------------ |
| `at`    | `--at`    | Eenmalige tijdstempel (ISO 8601 of relatief zoals `20m`) |
| `every` | `--every` | Vast interval                                          |
| `cron`  | `--cron`  | Cron-expressie met 5 of 6 velden met optionele `--tz`  |

Tijdstempels zonder tijdzone worden als UTC behandeld. Voeg `--tz America/New_York` toe voor planning op lokale kloktijd.

Terugkerende expressies bovenaan het uur worden automatisch met maximaal 5 minuten gespreid om piekbelasting te verminderen. Gebruik `--exact` om exacte timing af te dwingen of `--stagger 30s` voor een expliciet venster.

### Dag-van-de-maand en dag-van-de-week gebruiken OR-logica

Cron-expressies worden geparseerd door [croner](https://github.com/Hexagon/croner). Wanneer zowel het veld dag-van-de-maand als dag-van-de-week geen wildcard is, matcht croner wanneer **een van beide** velden matcht, niet beide. Dit is standaard Vixie-Cron-gedrag.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Dit wordt ongeveer 5-6 keer per maand geactiveerd in plaats van 0-1 keer per maand. OpenClaw gebruikt hier het standaard OR-gedrag van Croner. Gebruik Croners `+`-modifier voor dag-van-de-week (`0 9 15 * +1`) om beide voorwaarden te vereisen, of plan op één veld en bewaak het andere in de prompt of opdracht van je taak.

## Uitvoeringsstijlen

| Stijl           | `--session`-waarde | Draait in                | Beste voor                         |
| --------------- | ------------------ | ------------------------ | ---------------------------------- |
| Hoofdsessie     | `main`             | Volgende Heartbeat-beurt | Herinneringen, systeemgebeurtenissen |
| Geïsoleerd      | `isolated`         | Toegewijde `cron:<jobId>` | Rapporten, achtergrondtaken        |
| Huidige sessie  | `current`          | Gebonden bij aanmaak     | Contextbewust terugkerend werk     |
| Aangepaste sessie | `session:custom-id` | Blijvende benoemde sessie | Workflows die op geschiedenis voortbouwen |

<AccordionGroup>
  <Accordion title="Hoofdsessie versus geïsoleerd versus aangepast">
    **Hoofdsessie**-taken plaatsen een systeemgebeurtenis in de wachtrij en wekken optioneel de Heartbeat (`--wake now` of `--wake next-heartbeat`). Die systeemgebeurtenissen verlengen de versheid voor dagelijkse/inactieve reset van de doelsessie niet. **Geïsoleerde** taken draaien een toegewijde agentbeurt met een nieuwe sessie. **Aangepaste sessies** (`session:xxx`) behouden context tussen uitvoeringen, waardoor workflows zoals dagelijkse stand-ups die voortbouwen op eerdere samenvattingen mogelijk worden.
  </Accordion>
  <Accordion title="Wat 'nieuwe sessie' betekent voor geïsoleerde taken">
    Voor geïsoleerde taken betekent "nieuwe sessie" een nieuwe transcript-/sessie-id voor elke uitvoering. OpenClaw kan veilige voorkeuren meenemen, zoals instellingen voor denken/snel/uitgebreid, labels en expliciet door de gebruiker geselecteerde model-/auth-overschrijvingen, maar erft geen omgevingsgesprekscontext van een oudere Cron-rij: kanaal-/groepsroutering, verzend- of wachtrijbeleid, elevatie, herkomst of ACP-runtimebinding. Gebruik `current` of `session:<id>` wanneer een terugkerende taak bewust op dezelfde gesprekscontext moet voortbouwen.
  </Accordion>
  <Accordion title="Runtime-opruiming">
    Voor geïsoleerde taken omvat runtime-afbouw nu best-effort browseropruiming voor die Cron-sessie. Opruimfouten worden genegeerd, zodat het daadwerkelijke Cron-resultaat nog steeds bepalend is.

    Geïsoleerde Cron-uitvoeringen verwijderen ook alle gebundelde MCP-runtime-instanties die voor de taak zijn aangemaakt via het gedeelde runtime-opruimpad. Dit komt overeen met hoe MCP-clients van hoofdsessies en aangepaste sessies worden afgebouwd, zodat geïsoleerde Cron-taken geen stdio-childprocessen of langlevende MCP-verbindingen tussen uitvoeringen lekken.

  </Accordion>
  <Accordion title="Subagent- en Discord-bezorging">
    Wanneer geïsoleerde Cron-uitvoeringen subagents orkestreren, geeft bezorging ook de voorkeur aan de definitieve onderliggende uitvoer boven verouderde tussentijdse tekst van de bovenliggende taak. Als onderliggende uitvoeringen nog draaien, onderdrukt OpenClaw die gedeeltelijke update van de bovenliggende taak in plaats van die aan te kondigen.

    Voor tekst-only Discord-aankondigingsdoelen verzendt OpenClaw de canonieke definitieve assistenttekst één keer in plaats van zowel gestreamde/tussentijdse tekstpayloads als het definitieve antwoord opnieuw af te spelen. Media en gestructureerde Discord-payloads worden nog steeds als afzonderlijke payloads bezorgd, zodat bijlagen en componenten niet worden weggelaten.

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
  Overschrijving voor denkniveau.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Injectie van workspace-bootstrapbestanden overslaan.
</ParamField>
<ParamField path="--tools" type="string">
  Beperk welke tools de taak kan gebruiken, bijvoorbeeld `--tools exec,read`.
</ParamField>

`--model` gebruikt het geselecteerde toegestane model als primair model van die taak. Het is niet hetzelfde als een `/model`-overschrijving voor een chatsessie: geconfigureerde fallbackketens blijven van toepassing wanneer het primaire model van de taak faalt. Als het aangevraagde model niet is toegestaan of niet kan worden opgelost, laat Cron de uitvoering mislukken met een expliciete validatiefout in plaats van stilzwijgend terug te vallen op de agent-/standaardmodelselectie van de taak.

Cron-taken kunnen ook `fallbacks` op payloadniveau dragen. Wanneer aanwezig, vervangt die lijst de geconfigureerde fallbackketen voor de taak. Gebruik `fallbacks: []` in de taakpayload/API wanneer je een strikte Cron-uitvoering wilt die alleen het geselecteerde model probeert. Als een taak `--model` heeft maar geen payload- of geconfigureerde fallbacks, geeft OpenClaw een expliciete lege fallbackoverschrijving door, zodat het primaire agentmodel niet als verborgen extra retrydoel wordt toegevoegd.

Prioriteit voor modelselectie voor geïsoleerde taken is:

1. Gmail-hookmodeloverschrijving (wanneer de uitvoering van Gmail kwam en die overschrijving is toegestaan)
2. `model` per taakpayload
3. Door de gebruiker geselecteerde opgeslagen modeloverschrijving voor Cron-sessie
4. Agent-/standaardmodelselectie

Snelle modus volgt ook de opgeloste live selectie. Als de geselecteerde modelconfiguratie `params.fastMode` heeft, gebruikt geïsoleerde Cron die standaard. Een opgeslagen sessie-overschrijving voor `fastMode` wint nog steeds van configuratie in beide richtingen.

Als een geïsoleerde uitvoering een live overdracht voor modelwisseling raakt, probeert Cron opnieuw met de gewisselde provider/het gewisselde model en bewaart die live selectie voor de actieve uitvoering voordat opnieuw wordt geprobeerd. Wanneer de wissel ook een nieuw auth-profiel meebrengt, bewaart Cron die auth-profieloverschrijving ook voor de actieve uitvoering. Retries zijn begrensd: na de eerste poging plus 2 wisselretries breekt Cron af in plaats van eindeloos te lussen.

Voordat een geïsoleerde Cron-uitvoering de agentrunner binnenkomt, controleert OpenClaw bereikbare lokale provider-eindpunten voor geconfigureerde providers met `api: "ollama"` en `api: "openai-completions"` waarvan `baseUrl` local loopback, privénetwerk of `.local` is. Als dat eindpunt offline is, wordt de uitvoering geregistreerd als `skipped` met een duidelijke provider-/modelfout in plaats van een modelaanroep te starten. Het eindpuntresultaat wordt 5 minuten gecachet, zodat veel vervallen taken die dezelfde offline lokale Ollama-, vLLM-, SGLang- of LM Studio-server gebruiken één kleine probe delen in plaats van een verzoekstorm te creëren. Overgeslagen provider-preflight-uitvoeringen verhogen de backoff voor uitvoeringsfouten niet; schakel `failureAlert.includeSkipped` in wanneer je herhaalde skipmeldingen wilt.

## Bezorging en uitvoer

| Modus      | Wat er gebeurt                                                     |
| ---------- | ------------------------------------------------------------------ |
| `announce` | Levert definitieve tekst als fallback aan het doel als de agent niet heeft verzonden |
| `webhook`  | POST payload van voltooide gebeurtenis naar een URL                |
| `none`     | Geen fallbackbezorging door de runner                              |

Gebruik `--announce --channel telegram --to "-1001234567890"` voor kanaalbezorging. Gebruik voor Telegram-forumonderwerpen `-1001234567890:topic:123`; directe RPC/config-aanroepers kunnen ook `delivery.threadId` als string of getal doorgeven. Slack/Discord/Mattermost-doelen moeten expliciete prefixen gebruiken (`channel:<id>`, `user:<id>`). Matrix-ruimte-ID's zijn hoofdlettergevoelig; gebruik de exacte ruimte-ID of de vorm `room:!room:server` uit Matrix.

Wanneer announce-bezorging `channel: "last"` gebruikt of `channel` weglaat, kan een doel met provider-prefix, zoals `telegram:123`, het kanaal selecteren voordat cron terugvalt op sessiegeschiedenis of een enkel geconfigureerd kanaal. Alleen prefixen die door de geladen plugin worden geadverteerd, zijn providerselectors. Als `delivery.channel` expliciet is, moet de doelprefix dezelfde provider noemen; bijvoorbeeld `channel: "whatsapp"` met `to: "telegram:123"` wordt geweigerd in plaats van WhatsApp de Telegram-ID als telefoonnummer te laten interpreteren. Doelsoort- en serviceprefixen zoals `channel:<id>`, `user:<id>`, `imessage:<handle>` en `sms:<number>` blijven kanaaleigen doelsyntaxis, geen providerselectors.

Voor geïsoleerde jobs wordt chatbezorging gedeeld. Als er een chatroute beschikbaar is, kan de agent de tool `message` gebruiken, zelfs wanneer de job `--no-deliver` gebruikt. Als de agent naar het geconfigureerde/huidige doel verzendt, slaat OpenClaw de fallback-announce over. Anders bepalen `announce`, `webhook` en `none` alleen wat de runner doet met het uiteindelijke antwoord na de agentbeurt.

Wanneer een agent een geïsoleerde herinnering vanuit een actieve chat maakt, bewaart OpenClaw het behouden live-bezorgingsdoel voor de fallback-announce-route. Interne sessiesleutels kunnen kleine letters gebruiken; providerbezorgingsdoelen worden niet uit die sleutels gereconstrueerd wanneer de huidige chatcontext beschikbaar is.

Impliciete announce-bezorging gebruikt geconfigureerde kanaal-allowlists om verouderde doelen te valideren en om te leiden. Goedkeuringen uit de DM-pairingstore zijn geen ontvangers voor fallback-automatisering; stel `delivery.to` in of configureer de kanaalvermelding `allowFrom` wanneer een geplande job proactief naar een DM moet verzenden.

Foutmeldingen volgen een apart doelpad:

- `cron.failureDestination` stelt een globale standaard in voor foutmeldingen.
- `job.delivery.failureDestination` overschrijft dat per job.
- Als geen van beide is ingesteld en de job al via `announce` bezorgt, vallen foutmeldingen nu terug op dat primaire announce-doel.
- `delivery.failureDestination` wordt alleen ondersteund op jobs met `sessionTarget="isolated"`, tenzij de primaire bezorgingsmodus `webhook` is.
- `failureAlert.includeSkipped: true` laat een job of globaal cron-waarschuwingsbeleid herhaalde waarschuwingen voor overgeslagen runs gebruiken. Overgeslagen runs houden een aparte teller voor opeenvolgende overslagen bij, zodat ze de backoff voor uitvoeringsfouten niet beïnvloeden.

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
  <Tab title="Terugkerende geïsoleerde job">
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
  <Tab title="Model- en thinking-override">
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

Gateway kan HTTP-webhook-eindpunten voor externe triggers blootstellen. Schakel in config in:

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

Elke request moet het hook-token via een header bevatten:

- `Authorization: Bearer <token>` (aanbevolen)
- `x-openclaw-token: <token>`

Tokens in querystrings worden geweigerd.

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
    Aangepaste hooknamen worden via `hooks.mappings` in config omgezet. Mappings kunnen willekeurige payloads met templates of codetransformaties omzetten naar `wake`- of `agent`-acties.
  </Accordion>
</AccordionGroup>

<Warning>
Houd hook-eindpunten achter loopback, tailnet of een vertrouwde reverse proxy.

- Gebruik een toegewezen hook-token; hergebruik geen gateway-auth-tokens.
- Houd `hooks.path` op een toegewezen subpad; `/` wordt geweigerd.
- Stel `hooks.allowedAgentIds` in om expliciete `agentId`-routering te beperken.
- Houd `hooks.allowRequestSessionKey=false`, tenzij je door de aanroeper geselecteerde sessies nodig hebt.
- Als je `hooks.allowRequestSessionKey` inschakelt, stel dan ook `hooks.allowedSessionKeyPrefixes` in om toegestane vormen van sessiesleutels te beperken.
- Hook-payloads worden standaard met veiligheidsgrenzen verpakt.

</Warning>

## Gmail PubSub-integratie

Koppel Gmail-inboxtriggers aan OpenClaw via Google PubSub.

<Note>
**Vereisten:** `gcloud` CLI, `gog` (gogcli), OpenClaw-hooks ingeschakeld, Tailscale voor het publieke HTTPS-eindpunt.
</Note>

### Wizardinstelling (aanbevolen)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Dit schrijft `hooks.gmail`-config, schakelt de Gmail-preset in en gebruikt Tailscale Funnel voor het push-eindpunt.

### Gateway automatisch starten

Wanneer `hooks.enabled=true` en `hooks.gmail.account` is ingesteld, start de Gateway bij het opstarten `gog gmail watch serve` en vernieuwt hij de watch automatisch. Stel `OPENCLAW_SKIP_GMAIL_WATCHER=1` in om je hiervoor af te melden.

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
  <Step title="Maak topic en verleen Gmail-pushtoegang">
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

### Gmail-modeloverride

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

## Jobs beheren

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
Opmerking over modeloverride:

- `openclaw cron add|edit --model ...` wijzigt het geselecteerde model van de job.
- Als het model is toegestaan, bereikt die exacte provider/model de geïsoleerde agent-run.
- Als het niet is toegestaan of niet kan worden omgezet, laat cron de run mislukken met een expliciete validatiefout.
- Geconfigureerde fallback-ketens blijven van toepassing omdat cron `--model` een primaire jobwaarde is, geen `/model`-override voor de sessie.
- Payload `fallbacks` vervangt geconfigureerde fallbacks voor die job; `fallbacks: []` schakelt fallback uit en maakt de run strikt.
- Een gewone `--model` zonder expliciete of geconfigureerde fallbacklijst valt niet terug naar de primaire agent als stil extra retrydoel.

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

`maxConcurrentRuns` beperkt zowel geplande cron-dispatch als uitvoering van geïsoleerde agentbeurten. Geïsoleerde cron-agentbeurten gebruiken intern de toegewezen uitvoeringslane `cron-nested` van de wachtrij, dus als je deze waarde verhoogt, kunnen onafhankelijke cron-LLM-runs parallel voortgang maken in plaats van alleen hun buitenste cron-wrappers te starten. De gedeelde niet-cron-lane `nested` wordt door deze instelling niet verbreed.

De runtime-state-sidecar wordt afgeleid van `cron.store`: een `.json`-store zoals `~/clawd/cron/jobs.json` gebruikt `~/clawd/cron/jobs-state.json`, terwijl een storepad zonder `.json`-suffix `-state.json` toevoegt.

Als je `jobs.json` handmatig bewerkt, houd `jobs-state.json` dan buiten source control. OpenClaw gebruikt die sidecar voor pending slots, actieve markers, metadata van de laatste run en de planningidentiteit die de scheduler vertelt wanneer een extern bewerkte job een nieuwe `nextRunAtMs` nodig heeft.

Cron uitschakelen: `cron.enabled: false` of `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry-gedrag">
    **Eenmalige retry**: tijdelijke fouten (rate limit, overbelasting, netwerk, serverfout) worden tot 3 keer opnieuw geprobeerd met exponentiële backoff. Permanente fouten schakelen direct uit.

    **Terugkerende retry**: exponentiële backoff (30s tot 60m) tussen retries. Backoff wordt gereset na de volgende succesvolle run.

  </Accordion>
  <Accordion title="Onderhoud">
    `cron.sessionRetention` (standaard `24h`) schoont geïsoleerde run-sessievermeldingen op. `cron.runLog.maxBytes` / `cron.runLog.keepLines` schonen run-logbestanden automatisch op.
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
  <Accordion title="Cron start niet">
    - Controleer `cron.enabled` en de env-var `OPENCLAW_SKIP_CRON`.
    - Bevestig dat de Gateway continu draait.
    - Controleer voor `cron`-planningen de tijdzone (`--tz`) ten opzichte van de hosttijdzone.
    - `reason: not-due` in run-uitvoer betekent dat een handmatige run is gecontroleerd met `openclaw cron run <jobId> --due` en dat de job nog niet aan de beurt was.

  </Accordion>
  <Accordion title="Cron uitgevoerd maar geen levering">
    - Leveringsmodus `none` betekent dat er geen fallbackverzending door de runner wordt verwacht. De agent kan nog steeds rechtstreeks verzenden met de tool `message` wanneer er een chatroute beschikbaar is.
    - Leveringsdoel ontbreekt/is ongeldig (`channel`/`to`) betekent dat uitgaande verzending is overgeslagen.
    - Voor Matrix kunnen gekopieerde of verouderde jobs met kamer-ID's in `delivery.to` in kleine letters mislukken, omdat Matrix-kamer-ID's hoofdlettergevoelig zijn. Bewerk de job naar de exacte waarde `!room:server` of `room:!room:server` uit Matrix.
    - Kanaalauthenticatiefouten (`unauthorized`, `Forbidden`) betekenen dat levering is geblokkeerd door aanmeldgegevens.
    - Als de geïsoleerde uitvoering alleen het stille token (`NO_REPLY` / `no_reply`) retourneert, onderdrukt OpenClaw rechtstreekse uitgaande levering en onderdrukt het ook het fallbackpad voor de samenvatting in de wachtrij, zodat er niets terug in de chat wordt geplaatst.
    - Als de agent zelf een bericht naar de gebruiker moet sturen, controleer dan of de job een bruikbare route heeft (`channel: "last"` met een eerdere chat, of een expliciet kanaal/doel).

  </Accordion>
  <Accordion title="Cron of Heartbeat lijkt /new-style-rollover te verhinderen">
    - Dagelijkse en inactieve resetversheid is niet gebaseerd op `updatedAt`; zie [Sessiebeheer](/nl/concepts/session#session-lifecycle).
    - Cron-wake-ups, Heartbeat-uitvoeringen, exec-meldingen en Gateway-boekhouding kunnen de sessierij bijwerken voor routing/status, maar ze verlengen `sessionStartedAt` of `lastInteractionAt` niet.
    - Voor verouderde rijen die zijn gemaakt voordat die velden bestonden, kan OpenClaw `sessionStartedAt` herstellen uit de JSONL-sessieheader van het transcript wanneer het bestand nog beschikbaar is. Verouderde inactieve rijen zonder `lastInteractionAt` gebruiken die herstelde starttijd als hun inactiviteitsbasislijn.

  </Accordion>
  <Accordion title="Valkuilen met tijdzones">
    - Cron zonder `--tz` gebruikt de tijdzone van de Gateway-host.
    - `at`-planningen zonder tijdzone worden behandeld als UTC.
    - Heartbeat `activeHours` gebruikt de geconfigureerde tijdzoneresolutie.

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Automatisering en taken](/nl/automation) — alle automatiseringsmechanismen in één oogopslag
- [Achtergrondtaken](/nl/automation/tasks) — taaklogboek voor Cron-uitvoeringen
- [Heartbeat](/nl/gateway/heartbeat) — periodieke beurten in de hoofdsessie
- [Tijdzone](/nl/concepts/timezone) — tijdzoneconfiguratie
