---
read_when:
    - Achtergrondtaken of wekmomenten plannen
    - Externe activeringen (Webhooks, Gmail) koppelen aan OpenClaw
    - Kiezen tussen Heartbeat en Cron voor geplande taken
sidebarTitle: Scheduled tasks
summary: Geplande taken, Webhooks en Gmail PubSub-triggers voor de Gateway-planner
title: Geplande taken
x-i18n:
    generated_at: "2026-05-07T01:50:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4771847517f526ec537a940773c70141e056bdc5a7b735099f40c6ea10e18162
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron is de ingebouwde scheduler van de Gateway. Hij bewaart taken, wekt de agent op het juiste moment en kan uitvoer terugleveren aan een chatkanaal of Webhook-eindpunt.

## Snel aan de slag

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
- Taakdefinities blijven bewaard in `~/.openclaw/cron/jobs.json`, zodat herstarts schema's niet verliezen.
- De runtime-uitvoeringsstatus blijft ernaast bewaard in `~/.openclaw/cron/jobs-state.json`. Als je cron-definities in git bijhoudt, houd dan `jobs.json` bij en zet `jobs-state.json` in gitignore.
- Na de splitsing kunnen oudere OpenClaw-versies `jobs.json` lezen, maar ze kunnen taken als nieuw behandelen omdat runtime-velden nu in `jobs-state.json` staan.
- Wanneer `jobs.json` wordt bewerkt terwijl de Gateway draait of is gestopt, vergelijkt OpenClaw de gewijzigde schemavelden met metadata van openstaande runtime-slots en wist het verouderde `nextRunAtMs`-waarden. Herschrijvingen die alleen opmaak of sleutelvolgorde wijzigen, behouden de openstaande slot.
- Alle cron-uitvoeringen maken records voor [achtergrondtaken](/nl/automation/tasks) aan.
- Bij het opstarten van de Gateway worden verlopen geïsoleerde agent-turn-taken opnieuw gepland buiten het kanaalverbindingsvenster in plaats van meteen opnieuw afgespeeld, zodat het opstarten van Discord/Telegram en het instellen van native opdrachten responsief blijven na herstarts.
- Eenmalige taken (`--at`) worden standaard automatisch verwijderd na succes.
- Geïsoleerde cron-uitvoeringen sluiten naar beste vermogen bijgehouden browsertabbladen/processen voor hun `cron:<jobId>`-sessie wanneer de uitvoering is voltooid, zodat losgekoppelde browserautomatisering geen verweesde processen achterlaat.
- Geïsoleerde cron-uitvoeringen die de smalle cron-zelfopruimingsmachtiging ontvangen, kunnen nog steeds scheduler-status en een zelfgefilterde lijst van hun huidige taak lezen, zodat status-/Heartbeat-controles hun eigen schema kunnen inspecteren zonder bredere cron-mutatierechten te krijgen.
- Geïsoleerde cron-uitvoeringen bewaken ook tegen verouderde bevestigingsantwoorden. Als het eerste resultaat alleen een tussentijdse statusupdate is (`on it`, `pulling everything together` en vergelijkbare hints) en geen onderliggende subagent-uitvoering nog verantwoordelijk is voor het definitieve antwoord, vraagt OpenClaw eenmaal opnieuw om het daadwerkelijke resultaat voordat dit wordt afgeleverd.
- Geïsoleerde cron-uitvoeringen geven de voorkeur aan gestructureerde metadata voor uitvoeringsweigering uit de ingebedde uitvoering en vallen daarna terug op bekende markers voor definitieve samenvatting/uitvoer, zoals `SYSTEM_RUN_DENIED` en `INVALID_REQUEST`, zodat een geblokkeerde opdracht niet als geslaagde uitvoering wordt gerapporteerd.
- Geïsoleerde cron-uitvoeringen behandelen ook agentfouten op uitvoeringsniveau als taakfouten, zelfs wanneer er geen antwoordpayload wordt geproduceerd, zodat model-/providerfouten fouttellers verhogen en foutmeldingen activeren in plaats van de taak als succesvol af te ronden.
- Wanneer een geïsoleerde agent-turn-taak `timeoutSeconds` bereikt, breekt Cron de onderliggende agent-uitvoering af en geeft die een kort opruimvenster. Als de uitvoering niet leegloopt, wist Gateway-beheerde opruiming geforceerd het sessie-eigendom van die uitvoering voordat Cron de timeout vastlegt, zodat wachtrijwerk in chats niet achterblijft achter een verouderde verwerkende sessie.

<a id="maintenance"></a>

<Note>
Taakverzoening voor Cron is eerst runtime-eigendom en daarna gebaseerd op duurzame geschiedenis: een actieve cron-taak blijft live zolang de cron-runtime die taak nog als actief bijhoudt, zelfs als er nog een oude onderliggende sessierij bestaat. Zodra de runtime niet langer eigenaar is van de taak en het respijtvenster van 5 minuten verloopt, controleert onderhoud bewaarde uitvoeringslogs en taakstatus voor de overeenkomende `cron:<jobId>:<startedAt>`-uitvoering. Als die duurzame geschiedenis een eindresultaat toont, wordt het takenregister daaruit afgerond; anders kan Gateway-beheerd onderhoud de taak als `lost` markeren. Offline CLI-audit kan herstellen uit duurzame geschiedenis, maar behandelt zijn eigen lege actieve-takenset binnen het proces niet als bewijs dat een Gateway-beheerde cron-uitvoering verdwenen is.
</Note>

## Schematypen

| Soort   | CLI-vlag  | Beschrijving                                            |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Eenmalige tijdstempel (ISO 8601 of relatief zoals `20m`) |
| `every` | `--every` | Vast interval                                           |
| `cron`  | `--cron`  | Cron-expressie met 5 of 6 velden met optioneel `--tz`   |

Tijdstempels zonder tijdzone worden als UTC behandeld. Voeg `--tz America/New_York` toe voor planning op lokale kloktijd.

Terugkerende expressies bovenaan het uur worden automatisch met maximaal 5 minuten gespreid om belastingspieken te verminderen. Gebruik `--exact` om precieze timing af te dwingen of `--stagger 30s` voor een expliciet venster.

### Dag-van-de-maand en dag-van-de-week gebruiken OR-logica

Cron-expressies worden geparseerd door [croner](https://github.com/Hexagon/croner). Wanneer zowel de velden dag-van-de-maand als dag-van-de-week geen jokertekens zijn, matcht croner wanneer **een van beide** velden matcht, niet beide. Dit is standaard Vixie-cron-gedrag.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Dit vuurt ongeveer 5-6 keer per maand af in plaats van 0-1 keer per maand. OpenClaw gebruikt hier Croners standaard OR-gedrag. Gebruik Croners `+`-modifier voor dag-van-de-week (`0 9 15 * +1`) om beide voorwaarden te vereisen, of plan op één veld en bewaak het andere in de prompt of opdracht van je taak.

## Uitvoeringsstijlen

| Stijl           | `--session`-waarde | Draait in                | Beste voor                      |
| --------------- | ------------------ | ------------------------ | ------------------------------- |
| Hoofdsessie     | `main`             | Volgende Heartbeat-turn  | Herinneringen, systeemevents    |
| Geïsoleerd      | `isolated`         | Specifieke `cron:<jobId>` | Rapporten, achtergrondtaken     |
| Huidige sessie  | `current`          | Gebonden bij aanmaak     | Contextbewust terugkerend werk  |
| Aangepaste sessie | `session:custom-id` | Permanente benoemde sessie | Workflows die voortbouwen op geschiedenis |

<AccordionGroup>
  <Accordion title="Hoofdsessie versus geïsoleerd versus aangepast">
    Taken in de **hoofdsessie** zetten een systeemevent in de wachtrij en wekken optioneel de Heartbeat (`--wake now` of `--wake next-heartbeat`). Die systeemevents verlengen de dagelijkse/inactieve resetversheid voor de doelsessie niet. **Geïsoleerde** taken draaien een specifieke agent-turn met een nieuwe sessie. **Aangepaste sessies** (`session:xxx`) behouden context tussen uitvoeringen, waardoor workflows zoals dagelijkse stand-ups kunnen voortbouwen op eerdere samenvattingen.
  </Accordion>
  <Accordion title="Wat 'nieuwe sessie' betekent voor geïsoleerde taken">
    Voor geïsoleerde taken betekent "nieuwe sessie" een nieuw transcript-/sessie-id voor elke uitvoering. OpenClaw kan veilige voorkeuren meenemen, zoals thinking-/fast-/verbose-instellingen, labels en expliciet door de gebruiker geselecteerde model-/auth-overschrijvingen, maar neemt geen omgevingscontext van gesprekken over uit een oudere cron-rij: kanaal-/groepsroutering, verzend- of wachtrijbeleid, elevatie, oorsprong of ACP-runtimebinding. Gebruik `current` of `session:<id>` wanneer een terugkerende taak bewust op dezelfde gesprekscontext moet voortbouwen.
  </Accordion>
  <Accordion title="Runtime-opruiming">
    Voor geïsoleerde taken omvat runtime-afbouw nu browseropruiming naar beste vermogen voor die cron-sessie. Opruimfouten worden genegeerd, zodat het daadwerkelijke cron-resultaat nog steeds leidend blijft.

    Geïsoleerde cron-uitvoeringen ruimen ook alle gebundelde MCP-runtime-instanties op die voor de taak zijn gemaakt via het gedeelde runtime-opruimpad. Dit komt overeen met hoe MCP-clients voor hoofdsessies en aangepaste sessies worden afgebouwd, zodat geïsoleerde cron-taken geen stdio-childprocessen of langlevende MCP-verbindingen tussen uitvoeringen lekken.

  </Accordion>
  <Accordion title="Subagent- en Discord-aflevering">
    Wanneer geïsoleerde cron-uitvoeringen subagents orkestreren, geeft aflevering ook de voorkeur aan de definitieve uitvoer van de onderliggende taak boven verouderde tussentijdse tekst van de bovenliggende taak. Als onderliggende taken nog draaien, onderdrukt OpenClaw die gedeeltelijke bovenliggende update in plaats van die aan te kondigen.

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

`--model` gebruikt het geselecteerde toegestane model als het primaire model van die taak. Het is niet hetzelfde als een `/model`-overschrijving voor een chatsessie: geconfigureerde fallbackketens blijven van toepassing wanneer het primaire taakmodel faalt. Als het aangevraagde model niet is toegestaan of niet kan worden opgelost, laat Cron de uitvoering mislukken met een expliciete validatiefout in plaats van stil terug te vallen op de agent-/standaardmodelselectie van de taak.

Als oudere of handmatig bewerkte `jobs.json`-items `payload.model` opslaan als `"default"`, `"null"`, een lege tekenreeks of JSON `null`, voer dan `openclaw doctor --fix` uit. Doctor verwijdert die ongeldige bewaarde overschrijvingssentinels; runtime ondersteunt ze niet als fallback-aliassen. Laat het modelveld weg om de normale agent-/standaardmodelselectie te gebruiken.

Cron-taken kunnen ook `fallbacks` op payloadniveau bevatten. Wanneer die aanwezig zijn, vervangt die lijst de geconfigureerde fallbackketen voor de taak. Gebruik `fallbacks: []` in de taakpayload/API wanneer je een strikte cron-uitvoering wilt die alleen het geselecteerde model probeert. Als een taak `--model` heeft maar geen payload- of geconfigureerde fallbacks, geeft OpenClaw een expliciete lege fallback-overschrijving door, zodat het primaire agentmodel niet als verborgen extra retrydoel wordt toegevoegd.

Modelselectieprioriteit voor geïsoleerde taken is:

1. Gmail-hookmodeloverschrijving (wanneer de uitvoering afkomstig is van Gmail en die overschrijving is toegestaan)
2. `model` per taakpayload
3. Door de gebruiker geselecteerde opgeslagen modeloverschrijving voor de cron-sessie
4. Agent-/standaardmodelselectie

Fast-modus volgt ook de opgeloste live selectie. Als de geselecteerde modelconfiguratie `params.fastMode` heeft, gebruikt geïsoleerde Cron die standaard. Een opgeslagen sessieoverschrijving voor `fastMode` wint nog steeds van de configuratie in beide richtingen.

Als een geïsoleerde uitvoering een live model-switch-handoff raakt, probeert Cron opnieuw met de overgeschakelde provider/het overgeschakelde model en bewaart het die live selectie voor de actieve uitvoering voordat opnieuw wordt geprobeerd. Wanneer de switch ook een nieuw auth-profiel bevat, bewaart Cron die auth-profieloverschrijving ook voor de actieve uitvoering. Retries zijn begrensd: na de eerste poging plus 2 switch-retries breekt Cron af in plaats van eindeloos te blijven lopen.

Voordat een geïsoleerde cron-uitvoering de agentrunner binnengaat, controleert OpenClaw bereikbare lokale provider-eindpunten voor geconfigureerde providers met `api: "ollama"` en `api: "openai-completions"` waarvan `baseUrl` local loopback, private-network of `.local` is. Als dat eindpunt niet beschikbaar is, wordt de uitvoering vastgelegd als `skipped` met een duidelijke provider-/modelfout in plaats van een modelaanroep te starten. Het eindpuntresultaat wordt 5 minuten gecachet, zodat veel vervallen taken die dezelfde defecte lokale Ollama-, vLLM-, SGLang- of LM Studio-server gebruiken één kleine probe delen in plaats van een verzoekenstorm te veroorzaken. Overgeslagen provider-preflight-uitvoeringen verhogen de backoff voor uitvoeringsfouten niet; schakel `failureAlert.includeSkipped` in wanneer je herhaalde skip-meldingen wilt.

## Aflevering en uitvoer

| Modus      | Wat gebeurt er                                                      |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Levert de definitieve tekst als fallback af bij het doel als de agent niets heeft verzonden |
| `webhook`  | POST de payload van de voltooide gebeurtenis naar een URL           |
| `none`     | Geen fallbackaflevering door de runner                              |

Gebruik `--announce --channel telegram --to "-1001234567890"` voor aflevering aan een kanaal. Gebruik voor Telegram-forumonderwerpen `-1001234567890:topic:123`; directe RPC-/config-aanroepers kunnen ook `delivery.threadId` als tekenreeks of getal doorgeven. Slack-/Discord-/Mattermost-doelen moeten expliciete prefixes gebruiken (`channel:<id>`, `user:<id>`). Matrix-room-ID's zijn hoofdlettergevoelig; gebruik het exacte room-ID of de vorm `room:!room:server` van Matrix.

Wanneer announce-aflevering `channel: "last"` gebruikt of `channel` weglaat, kan een doel met providerprefix zoals `telegram:123` het kanaal selecteren voordat Cron terugvalt op sessiegeschiedenis of één geconfigureerd kanaal. Alleen prefixes die door de geladen Plugin worden aangekondigd, zijn providerselectoren. Als `delivery.channel` expliciet is, moet de doelprefix dezelfde provider noemen; bijvoorbeeld `channel: "whatsapp"` met `to: "telegram:123"` wordt geweigerd in plaats van WhatsApp de Telegram-ID als telefoonnummer te laten interpreteren. Doelsoort- en serviceprefixes zoals `channel:<id>`, `user:<id>`, `imessage:<handle>` en `sms:<number>` blijven kanaaleigen doelsyntaxis, geen providerselectoren.

Voor geïsoleerde taken wordt chataflevering gedeeld. Als er een chatroute beschikbaar is, kan de agent de tool `message` gebruiken, zelfs wanneer de taak `--no-deliver` gebruikt. Als de agent naar het geconfigureerde/huidige doel verzendt, slaat OpenClaw de fallback-announce over. Anders bepalen `announce`, `webhook` en `none` alleen wat de runner met het definitieve antwoord doet na de agentbeurt.

Wanneer een agent een geïsoleerde herinnering vanuit een actieve chat maakt, slaat OpenClaw het behouden live-afleverdoel op voor de fallback-announce-route. Interne sessiesleutels kunnen kleine letters bevatten; providerafleverdoelen worden niet opnieuw uit die sleutels opgebouwd wanneer de huidige chatcontext beschikbaar is.

Impliciete announce-aflevering gebruikt geconfigureerde kanaal-allowlists om verouderde doelen te valideren en om te leiden. Goedkeuringen uit de DM-pairingstore zijn geen ontvangers voor fallbackautomatisering; stel `delivery.to` in of configureer de kanaalvermelding `allowFrom` wanneer een geplande taak proactief naar een DM moet verzenden.

Foutmeldingen volgen een afzonderlijk bestemmingspad:

- `cron.failureDestination` stelt een globale standaard in voor foutmeldingen.
- `job.delivery.failureDestination` overschrijft dat per taak.
- Als geen van beide is ingesteld en de taak al via `announce` aflevert, vallen foutmeldingen nu terug op dat primaire announce-doel.
- `delivery.failureDestination` wordt alleen ondersteund voor taken met `sessionTarget="isolated"`, tenzij de primaire aflevermodus `webhook` is.
- `failureAlert.includeSkipped: true` laat een taak of globaal Cron-waarschuwingsbeleid herhaalde waarschuwingen voor overgeslagen runs sturen. Overgeslagen runs houden een afzonderlijke teller voor opeenvolgende skips bij, zodat ze geen invloed hebben op backoff voor uitvoeringsfouten.

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

Elk verzoek moet het hooktoken via een header bevatten:

- `Authorization: Bearer <token>` (aanbevolen)
- `x-openclaw-token: <token>`

Tokens in querystrings worden geweigerd.

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

    Velden: `message` (verplicht), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Gekoppelde hooks (POST /hooks/<name>)">
    Aangepaste hooknamen worden opgelost via `hooks.mappings` in de configuratie. Mappings kunnen willekeurige payloads omzetten in `wake`- of `agent`-acties met sjablonen of codetransformaties.
  </Accordion>
</AccordionGroup>

<Warning>
Houd hook-eindpunten achter loopback, tailnet of een vertrouwde reverse proxy.

- Gebruik een specifiek hooktoken; hergebruik geen Gateway-authenticatietokens.
- Houd `hooks.path` op een specifiek subpad; `/` wordt geweigerd.
- Stel `hooks.allowedAgentIds` in om expliciete `agentId`-routering te beperken.
- Houd `hooks.allowRequestSessionKey=false`, tenzij je door de aanroeper geselecteerde sessies nodig hebt.
- Als je `hooks.allowRequestSessionKey` inschakelt, stel dan ook `hooks.allowedSessionKeyPrefixes` in om toegestane vormen van sessiesleutels te beperken.
- Hookpayloads worden standaard met veiligheidsgrenzen ingepakt.

</Warning>

## Gmail PubSub-integratie

Verbind Gmail-inboxtriggers met OpenClaw via Google PubSub.

<Note>
**Vereisten:** `gcloud` CLI, `gog` (gogcli), OpenClaw-hooks ingeschakeld, Tailscale voor het openbare HTTPS-eindpunt.
</Note>

### Wizardconfiguratie (aanbevolen)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Dit schrijft de `hooks.gmail`-configuratie, schakelt de Gmail-preset in en gebruikt Tailscale Funnel voor het push-eindpunt.

### Automatisch starten van Gateway

Wanneer `hooks.enabled=true` en `hooks.gmail.account` is ingesteld, start de Gateway `gog gmail watch serve` bij het opstarten en vernieuwt hij de watch automatisch. Stel `OPENCLAW_SKIP_GMAIL_WATCHER=1` in om dit uit te schakelen.

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
Opmerking over modeloverride:

- `openclaw cron add|edit --model ...` wijzigt het geselecteerde model van de taak.
- Als het model is toegestaan, bereikt die exacte provider/model de geïsoleerde agentrun.
- Als het niet is toegestaan of niet kan worden opgelost, laat Cron de run mislukken met een expliciete validatiefout.
- Geconfigureerde fallbackketens blijven van toepassing omdat Cron `--model` een primaire taakwaarde is, geen sessie-override voor `/model`.
- Payload `fallbacks` vervangt geconfigureerde fallbacks voor die taak; `fallbacks: []` schakelt fallback uit en maakt de run strikt.
- Een gewone `--model` zonder expliciete of geconfigureerde fallbacklijst valt niet door naar de primaire agent als stil extra retrydoel.

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

`maxConcurrentRuns` beperkt zowel geplande Cron-dispatch als uitvoering van geïsoleerde agentbeurten. Geïsoleerde Cron-agentbeurten gebruiken intern de speciale uitvoeringslane `cron-nested` van de wachtrij, dus door deze waarde te verhogen kunnen onafhankelijke Cron-LLM-runs parallel voortgang boeken in plaats van alleen hun buitenste Cron-wrappers te starten. De gedeelde niet-Cron-lane `nested` wordt door deze instelling niet verbreed.

De sidecar voor runtime-state wordt afgeleid van `cron.store`: een `.json`-store zoals `~/clawd/cron/jobs.json` gebruikt `~/clawd/cron/jobs-state.json`, terwijl een storepad zonder `.json`-suffix `-state.json` toevoegt.

Als je `jobs.json` handmatig bewerkt, laat `jobs-state.json` dan buiten bronbeheer. OpenClaw gebruikt die sidecar voor wachtende slots, actieve markeringen, metadata van de laatste run en de schema-identiteit die de scheduler vertelt wanneer een extern bewerkte taak een nieuwe `nextRunAtMs` nodig heeft.

Schakel Cron uit: `cron.enabled: false` of `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retrygedrag">
    **Eenmalige retry**: tijdelijke fouten (rate limit, overbelasting, netwerk, serverfout) worden maximaal 3 keer opnieuw geprobeerd met exponentiële backoff. Permanente fouten schakelen direct uit.

    **Terugkerende retry**: exponentiële backoff (30s tot 60m) tussen retries. Backoff wordt gereset na de volgende geslaagde run.

  </Accordion>
  <Accordion title="Onderhoud">
    `cron.sessionRetention` (standaard `24h`) ruimt geïsoleerde runsessie-items op. `cron.runLog.maxBytes` / `cron.runLog.keepLines` snoeit runlogbestanden automatisch.
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
    - Controleer `cron.enabled` en de env-var `OPENCLAW_SKIP_CRON`.
    - Bevestig dat de Gateway continu draait.
    - Controleer voor `cron`-schema's de tijdzone (`--tz`) tegenover de tijdzone van de host.
    - `reason: not-due` in runuitvoer betekent dat een handmatige run is gecontroleerd met `openclaw cron run <jobId> --due` en dat de taak nog niet verschuldigd was.

  </Accordion>
  <Accordion title="Cron is uitgevoerd maar er is niets afgeleverd">
    - Aflevermodus `none` betekent dat er geen fallbackverzending door de runner wordt verwacht. De agent kan nog steeds rechtstreeks verzenden met de tool `message` wanneer er een chatroute beschikbaar is.
    - Ontbrekend/ongeldig afleverdoel (`channel`/`to`) betekent dat uitgaand verkeer is overgeslagen.
    - Voor Matrix kunnen gekopieerde of legacy taken met kamer-ID's in `delivery.to` in kleine letters mislukken omdat Matrix-kamer-ID's hoofdlettergevoelig zijn. Bewerk de taak naar de exacte waarde `!room:server` of `room:!room:server` uit Matrix.
    - Kanaalauthenticatiefouten (`unauthorized`, `Forbidden`) betekenen dat aflevering is geblokkeerd door referenties.
    - Als de geïsoleerde run alleen de stille token (`NO_REPLY` / `no_reply`) retourneert, onderdrukt OpenClaw rechtstreekse uitgaande aflevering en onderdrukt het ook het fallbackpad met samenvatting in de wachtrij, zodat er niets terug naar de chat wordt geplaatst.
    - Als de agent de gebruiker zelf een bericht moet sturen, controleer dan of de taak een bruikbare route heeft (`channel: "last"` met een eerdere chat, of een expliciet kanaal/doel).

  </Accordion>
  <Accordion title="Cron of Heartbeat lijkt /new-style-rollover te voorkomen">
    - Dagelijkse en inactieve resetversheid is niet gebaseerd op `updatedAt`; zie [Sessiebeheer](/nl/concepts/session#session-lifecycle).
    - Cron-wake-ups, Heartbeat-runs, exec-meldingen en Gateway-boekhouding kunnen de sessierij bijwerken voor routering/status, maar ze verlengen `sessionStartedAt` of `lastInteractionAt` niet.
    - Voor legacy rijen die zijn gemaakt voordat die velden bestonden, kan OpenClaw `sessionStartedAt` herstellen uit de JSONL-sessieheader van het transcript wanneer het bestand nog beschikbaar is. Legacy inactieve rijen zonder `lastInteractionAt` gebruiken die herstelde starttijd als hun inactieve basislijn.

  </Accordion>
  <Accordion title="Valkuilen met tijdzones">
    - Cron zonder `--tz` gebruikt de tijdzone van de Gateway-host.
    - `at`-planningen zonder tijdzone worden behandeld als UTC.
    - Heartbeat `activeHours` gebruikt de geconfigureerde tijdzoneresolutie.

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Automatisering en taken](/nl/automation) — alle automatiseringsmechanismen in één oogopslag
- [Achtergrondtaken](/nl/automation/tasks) — takenlogboek voor Cron-uitvoeringen
- [Heartbeat](/nl/gateway/heartbeat) — periodieke beurten in de hoofdsessie
- [Tijdzone](/nl/concepts/timezone) — tijdzoneconfiguratie
