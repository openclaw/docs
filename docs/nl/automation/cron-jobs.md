---
read_when:
    - Achtergrondtaken of wekmomenten plannen
    - Externe triggers (webhooks, Gmail) koppelen aan OpenClaw
    - Kiezen tussen Heartbeat en Cron voor geplande taken
sidebarTitle: Scheduled tasks
summary: Geplande taken, Webhooks en Gmail PubSub-triggers voor de Gateway-scheduler
title: Geplande taken
x-i18n:
    generated_at: "2026-05-06T17:52:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19c3505408ab7602775dc1168c2c7a626986fa2a15ef02a44dc864d5ec538bfe
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron is de ingebouwde planner van de Gateway. Deze bewaart taken, wekt de agent op het juiste moment en kan uitvoer terugbezorgen aan een chatkanaal of Webhook-eindpunt.

## Snel aan de slag

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
- Taakdefinities blijven bewaard in `~/.openclaw/cron/jobs.json`, zodat herstarts geen planningen verliezen.
- De uitvoeringsstatus tijdens runtime blijft ernaast bewaard in `~/.openclaw/cron/jobs-state.json`. Als je Cron-definities in git bijhoudt, houd dan `jobs.json` bij en voeg `jobs-state.json` toe aan gitignore.
- Na de splitsing kunnen oudere OpenClaw-versies `jobs.json` lezen, maar ze kunnen taken als nieuw behandelen omdat runtime-velden nu in `jobs-state.json` staan.
- Wanneer `jobs.json` wordt bewerkt terwijl de Gateway draait of gestopt is, vergelijkt OpenClaw de gewijzigde planningsvelden met metadata van runtime-slots die in behandeling zijn en wist het verouderde `nextRunAtMs`-waarden. Wijzigingen die alleen opmaak of alleen de sleutelvolgorde aanpassen, behouden de pending slot.
- Alle Cron-uitvoeringen maken records voor [achtergrondtaken](/nl/automation/tasks) aan.
- Bij het opstarten van de Gateway worden te late geïsoleerde agent-turn-taken opnieuw gepland buiten het venster voor kanaalverbindingen in plaats van direct opnieuw afgespeeld, zodat het opstarten van Discord/Telegram en het instellen van native opdrachten responsief blijven na herstarts.
- Eenmalige taken (`--at`) worden standaard automatisch verwijderd na succes.
- Geïsoleerde Cron-runs sluiten naar beste vermogen bijgehouden browsertabs/processen voor hun `cron:<jobId>`-sessie wanneer de run voltooid is, zodat losgekoppelde browserautomatisering geen verweesde processen achterlaat.
- Geïsoleerde Cron-runs die de beperkte Cron-zelfopruimingsmachtiging ontvangen, kunnen nog steeds de plannerstatus en een zelfgefilterde lijst van hun huidige taak lezen, zodat status-/Heartbeat-controles hun eigen planning kunnen inspecteren zonder bredere toegang te krijgen om Cron te wijzigen.
- Geïsoleerde Cron-runs beschermen ook tegen verouderde bevestigingsantwoorden. Als het eerste resultaat slechts een tussentijdse statusupdate is (`on it`, `pulling everything together` en vergelijkbare hints) en geen afgeleide subagent-run nog verantwoordelijk is voor het definitieve antwoord, vraagt OpenClaw één keer opnieuw om het daadwerkelijke resultaat voordat het wordt bezorgd.
- Geïsoleerde Cron-runs geven de voorkeur aan gestructureerde metadata over uitvoeringsweigering van de ingebedde run en vallen daarna terug op bekende markers voor definitieve samenvatting/uitvoer, zoals `SYSTEM_RUN_DENIED` en `INVALID_REQUEST`, zodat een geblokkeerde opdracht niet als een groene run wordt gerapporteerd.
- Geïsoleerde Cron-runs behandelen agentfouten op runniveau ook als taakfouten, zelfs wanneer er geen antwoordpayload wordt geproduceerd, zodat model-/providerfouten fouttellers verhogen en foutmeldingen activeren in plaats van de taak als succesvol af te ronden.
- Wanneer een geïsoleerde agent-turn-taak `timeoutSeconds` bereikt, breekt Cron de onderliggende agent-run af en geeft deze een korte opruimperiode. Als de run niet leegloopt, wist Gateway-eigen opruiming geforceerd het sessie-eigendom van die run voordat Cron de time-out registreert, zodat chatwerk in de wachtrij niet achterblijft achter een verouderde verwerkende sessie.

<a id="maintenance"></a>

<Note>
Taakreconciliatie voor Cron is eerst runtime-eigen en daarna gebaseerd op duurzame geschiedenis: een actieve Cron-taak blijft live zolang de Cron-runtime die taak nog als actief bijhoudt, zelfs als er nog een oude onderliggende sessierij bestaat. Zodra de runtime de taak niet langer bezit en het respijtvenster van 5 minuten verloopt, controleert onderhoud de bewaarde runlogboeken en taakstatus op de overeenkomende `cron:<jobId>:<startedAt>`-run. Als die duurzame geschiedenis een eindresultaat toont, wordt het taaklogboek daaruit afgerond; anders kan Gateway-eigen onderhoud de taak als `lost` markeren. Offline CLI-audit kan herstellen vanuit duurzame geschiedenis, maar behandelt zijn eigen lege actieve-takenset in het proces niet als bewijs dat een Gateway-eigen Cron-run verdwenen is.
</Note>

## Planningstypen

| Soort    | CLI-vlag  | Beschrijving                                            |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Eenmalig tijdstempel (ISO 8601 of relatief zoals `20m`) |
| `every` | `--every` | Vast interval                                           |
| `cron`  | `--cron`  | Cron-expressie met 5 of 6 velden met optioneel `--tz`   |

Tijdstempels zonder tijdzone worden behandeld als UTC. Voeg `--tz America/New_York` toe voor planning op lokale kloktijd.

Terugkerende expressies op het hele uur worden automatisch tot maximaal 5 minuten gespreid om belastingpieken te verminderen. Gebruik `--exact` om precieze timing af te dwingen of `--stagger 30s` voor een expliciet venster.

### Dag-van-de-maand en dag-van-de-week gebruiken OF-logica

Cron-expressies worden geparseerd door [croner](https://github.com/Hexagon/croner). Wanneer zowel het dag-van-de-maand- als het dag-van-de-week-veld geen wildcard is, matcht croner wanneer **een van beide** velden matcht — niet beide. Dit is standaard Vixie-cron-gedrag.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Dit wordt ~5-6 keer per maand uitgevoerd in plaats van 0-1 keer per maand. OpenClaw gebruikt hier het standaard OF-gedrag van Croner. Om beide voorwaarden te vereisen, gebruik je Croners `+`-modifier voor dag-van-de-week (`0 9 15 * +1`) of plan je op één veld en bewaak je het andere in de prompt of opdracht van je taak.

## Uitvoeringsstijlen

| Stijl            | `--session`-waarde | Draait in                 | Beste voor                                 |
| --------------- | ------------------- | ------------------------ | ------------------------------------------ |
| Hoofdsessie     | `main`              | Volgende Heartbeat-turn   | Herinneringen, systeemgebeurtenissen       |
| Geïsoleerd      | `isolated`          | Toegewijde `cron:<jobId>` | Rapporten, achtergrondtaken                |
| Huidige sessie  | `current`           | Gebonden bij aanmaak      | Contextbewust terugkerend werk             |
| Aangepaste sessie | `session:custom-id` | Permanente benoemde sessie | Workflows die voortbouwen op geschiedenis |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    Taken in de **hoofdsessie** plaatsen een systeemgebeurtenis in de wachtrij en wekken optioneel de Heartbeat (`--wake now` of `--wake next-heartbeat`). Die systeemgebeurtenissen verlengen de versheid voor dagelijkse/inactieve reset van de doelsessie niet. **Geïsoleerde** taken draaien een toegewijde agent-turn met een nieuwe sessie. **Aangepaste sessies** (`session:xxx`) behouden context tussen runs, waardoor workflows zoals dagelijkse stand-ups kunnen voortbouwen op eerdere samenvattingen.
  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    Voor geïsoleerde taken betekent "nieuwe sessie" een nieuwe transcript-/sessie-id voor elke run. OpenClaw kan veilige voorkeuren meenemen, zoals instellingen voor denken/snel/uitgebreid, labels en expliciete door de gebruiker geselecteerde model-/auth-overschrijvingen, maar neemt geen omringende gesprekscontext over van een oudere Cron-rij: kanaal-/groepsroutering, verzend- of wachtrijbeleid, elevatie, herkomst of ACP-runtimebinding. Gebruik `current` of `session:<id>` wanneer een terugkerende taak bewust op dezelfde gesprekscontext moet voortbouwen.
  </Accordion>
  <Accordion title="Runtime cleanup">
    Voor geïsoleerde taken omvat runtime-afbraak nu opruiming van browsers voor die Cron-sessie naar beste vermogen. Opruimfouten worden genegeerd, zodat het daadwerkelijke Cron-resultaat nog steeds leidend is.

    Geïsoleerde Cron-runs ruimen ook alle gebundelde MCP-runtime-instanties op die voor de taak zijn aangemaakt via het gedeelde pad voor runtime-opruiming. Dit komt overeen met hoe MCP-clients van hoofdsessies en aangepaste sessies worden afgebroken, zodat geïsoleerde Cron-taken geen stdio-childprocessen of langlevende MCP-verbindingen tussen runs lekken.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    Wanneer geïsoleerde Cron-runs subagents orkestreren, geeft bezorging ook de voorkeur aan de definitieve uitvoer van afgeleiden boven verouderde tussentijdse tekst van de parent. Als afgeleiden nog draaien, onderdrukt OpenClaw die gedeeltelijke parent-update in plaats van deze aan te kondigen.

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
  Sla injectie van bootstrapbestanden voor de werkruimte over.
</ParamField>
<ParamField path="--tools" type="string">
  Beperk welke tools de taak kan gebruiken, bijvoorbeeld `--tools exec,read`.
</ParamField>

`--model` gebruikt het geselecteerde toegestane model als het primaire model van die taak. Het is niet hetzelfde als een `/model`-overschrijving voor een chatsessie: geconfigureerde fallbackketens blijven van toepassing wanneer het primaire model van de taak faalt. Als het gevraagde model niet toegestaan is of niet kan worden opgelost, laat Cron de run mislukken met een expliciete validatiefout in plaats van stil terug te vallen op de agent-/standaardmodelselectie van de taak.

Cron-taken kunnen ook payloadniveau-`fallbacks` bevatten. Indien aanwezig vervangt die lijst de geconfigureerde fallbackketen voor de taak. Gebruik `fallbacks: []` in de taakpayload/API wanneer je een strikte Cron-run wilt die alleen het geselecteerde model probeert. Als een taak `--model` heeft maar geen payload- of geconfigureerde fallbacks, geeft OpenClaw een expliciete lege fallback-overschrijving door, zodat het primaire agentmodel niet als verborgen extra retrydoel wordt toegevoegd.

Voorrang voor modelselectie bij geïsoleerde taken is:

1. Gmail-hookmodeloverschrijving (wanneer de run uit Gmail kwam en die overschrijving is toegestaan)
2. Per-taak-payload `model`
3. Door gebruiker geselecteerde opgeslagen modeloverschrijving voor Cron-sessie
4. Agent-/standaardmodelselectie

Snelle modus volgt ook de opgeloste live selectie. Als de geselecteerde modelconfiguratie `params.fastMode` heeft, gebruikt geïsoleerde Cron dat standaard. Een opgeslagen sessie-overschrijving voor `fastMode` wint nog steeds in beide richtingen van configuratie.

Als een geïsoleerde run een live overdracht voor modelwisseling raakt, probeert Cron opnieuw met de gewisselde provider/het gewisselde model en bewaart die live selectie voor de actieve run voordat het opnieuw probeert. Wanneer de wissel ook een nieuw auth-profiel bevat, bewaart Cron die auth-profieloverschrijving ook voor de actieve run. Retries zijn begrensd: na de eerste poging plus 2 wissel-retries breekt Cron af in plaats van eindeloos te blijven loopen.

Voordat een geïsoleerde Cron-run de agentrunner binnengaat, controleert OpenClaw bereikbare lokale provider-eindpunten voor geconfigureerde `api: "ollama"`- en `api: "openai-completions"`-providers waarvan `baseUrl` local loopback, privénetwerk of `.local` is. Als dat eindpunt niet beschikbaar is, wordt de run geregistreerd als `skipped` met een duidelijke provider-/modelfout in plaats van een modelaanroep te starten. Het eindpuntresultaat wordt 5 minuten gecachet, zodat veel verschuldigde taken die dezelfde dode lokale Ollama-, vLLM-, SGLang- of LM Studio-server gebruiken één kleine probe delen in plaats van een verzoekstorm te veroorzaken. Overgeslagen provider-preflight-runs verhogen de backoff voor uitvoeringsfouten niet; schakel `failureAlert.includeSkipped` in wanneer je herhaalde oversla-meldingen wilt.

## Bezorging en uitvoer

| Modus      | Wat er gebeurt                                                     |
| ---------- | ------------------------------------------------------------------ |
| `announce` | Bezorg definitieve tekst als fallback aan het doel als de agent niet heeft verzonden |
| `webhook`  | POST de payload van de voltooide gebeurtenis naar een URL           |
| `none`     | Geen fallbackbezorging door de runner                              |

Gebruik `--announce --channel telegram --to "-1001234567890"` voor bezorging aan kanalen. Gebruik voor Telegram-forumonderwerpen `-1001234567890:topic:123`; directe RPC-/config-aanroepers kunnen ook `delivery.threadId` als string of getal doorgeven. Slack/Discord/Mattermost-doelen moeten expliciete prefixes gebruiken (`channel:<id>`, `user:<id>`). Matrix-ruimte-ID's zijn hoofdlettergevoelig; gebruik de exacte ruimte-ID of de vorm `room:!room:server` uit Matrix.

Wanneer announce-bezorging `channel: "last"` gebruikt of `channel` weglaat, kan een provider-geprefixt doel zoals `telegram:123` het kanaal selecteren voordat cron terugvalt op sessiegeschiedenis of een enkel geconfigureerd kanaal. Alleen prefixes die door de geladen Plugin worden geadverteerd, zijn providerselectors. Als `delivery.channel` expliciet is, moet de doelprefix dezelfde provider noemen; bijvoorbeeld `channel: "whatsapp"` met `to: "telegram:123"` wordt geweigerd in plaats van WhatsApp de Telegram-ID als telefoonnummer te laten interpreteren. Doeltype- en serviceprefixes zoals `channel:<id>`, `user:<id>`, `imessage:<handle>` en `sms:<number>` blijven kanaaleigen doelsyntaxis, geen providerselectors.

Voor geïsoleerde taken wordt chatbezorging gedeeld. Als er een chatroute beschikbaar is, kan de agent de tool `message` gebruiken, zelfs wanneer de taak `--no-deliver` gebruikt. Als de agent naar het geconfigureerde/huidige doel verzendt, slaat OpenClaw de fallback-announce over. Anders bepalen `announce`, `webhook` en `none` alleen wat de runner met het uiteindelijke antwoord doet na de agentbeurt.

Wanneer een agent een geïsoleerde herinnering vanuit een actieve chat maakt, slaat OpenClaw het behouden live-bezorgdoel op voor de fallback-announce-route. Interne sessiesleutels kunnen kleine letters bevatten; providerbezorgdoelen worden niet uit die sleutels gereconstrueerd wanneer de huidige chatcontext beschikbaar is.

Impliciete announce-bezorging gebruikt geconfigureerde kanaal-allowlists om verouderde doelen te valideren en om te routeren. DM-goedkeuringen uit de pairing-store zijn geen fallback-ontvangers voor automatisering; stel `delivery.to` in of configureer de kanaalvermelding `allowFrom` wanneer een geplande taak proactief naar een DM moet verzenden.

Foutmeldingen volgen een afzonderlijk bestemmingspad:

- `cron.failureDestination` stelt een globale standaard in voor foutmeldingen.
- `job.delivery.failureDestination` overschrijft dit per taak.
- Als geen van beide is ingesteld en de taak al via `announce` bezorgt, vallen foutmeldingen nu terug op dat primaire announce-doel.
- `delivery.failureDestination` wordt alleen ondersteund voor taken met `sessionTarget="isolated"`, tenzij de primaire bezorgmodus `webhook` is.
- `failureAlert.includeSkipped: true` laat een taak of globaal Cron-waarschuwingsbeleid herhaalde waarschuwingen voor overgeslagen runs inschakelen. Overgeslagen runs houden een aparte teller voor opeenvolgende overslagen bij, zodat ze geen invloed hebben op backoff voor uitvoeringsfouten.

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

Elk verzoek moet het hooktoken via een header bevatten:

- `Authorization: Bearer <token>` (aanbevolen)
- `x-openclaw-token: <token>`

Querystringtokens worden geweigerd.

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
    Aangepaste hooknamen worden opgelost via `hooks.mappings` in de config. Mappings kunnen willekeurige payloads omzetten in `wake`- of `agent`-acties met sjablonen of codetransformaties.
  </Accordion>
</AccordionGroup>

<Warning>
Houd hook-eindpunten achter loopback, tailnet of een vertrouwde reverse proxy.

- Gebruik een speciaal hooktoken; hergebruik geen Gateway-authenticatietokens.
- Houd `hooks.path` op een specifiek subpad; `/` wordt geweigerd.
- Stel `hooks.allowedAgentIds` in om expliciete `agentId`-routering te beperken.
- Houd `hooks.allowRequestSessionKey=false`, tenzij u door de aanroeper geselecteerde sessies nodig hebt.
- Als u `hooks.allowRequestSessionKey` inschakelt, stel dan ook `hooks.allowedSessionKeyPrefixes` in om toegestane vormen van sessiesleutels te beperken.
- Hook-payloads worden standaard met veiligheidsgrenzen ingepakt.

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

Dit schrijft de config `hooks.gmail`, schakelt de Gmail-preset in en gebruikt Tailscale Funnel voor het push-eindpunt.

### Automatisch starten van Gateway

Wanneer `hooks.enabled=true` en `hooks.gmail.account` is ingesteld, start de Gateway bij het opstarten `gog gmail watch serve` en vernieuwt deze de watch automatisch. Stel `OPENCLAW_SKIP_GMAIL_WATCHER=1` in om u hiervoor af te melden.

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

### Overschrijving van Gmail-model

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
- Als het model is toegestaan, bereikt die exacte provider/model de geïsoleerde agentrun.
- Als het niet is toegestaan of niet kan worden opgelost, laat cron de run mislukken met een expliciete validatiefout.
- Geconfigureerde fallbackketens blijven van toepassing omdat cron `--model` een primaire taakinstelling is, geen sessie-overschrijving voor `/model`.
- Payload `fallbacks` vervangt geconfigureerde fallbacks voor die taak; `fallbacks: []` schakelt fallback uit en maakt de run strikt.
- Een gewone `--model` zonder expliciete of geconfigureerde fallbacklijst valt niet door naar de primaire agent als stil extra retry-doel.

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

`maxConcurrentRuns` beperkt zowel geplande cron-dispatch als uitvoering van geïsoleerde agentbeurten. Geïsoleerde cron-agentbeurten gebruiken intern de speciale uitvoeringslane `cron-nested` van de wachtrij, dus door deze waarde te verhogen kunnen onafhankelijke cron-LLM-runs parallel voortgang boeken in plaats van alleen hun buitenste cron-wrappers te starten. De gedeelde niet-cron-lane `nested` wordt door deze instelling niet verbreed.

De runtime-state-sidecar wordt afgeleid van `cron.store`: een `.json`-store zoals `~/clawd/cron/jobs.json` gebruikt `~/clawd/cron/jobs-state.json`, terwijl een storepad zonder `.json`-achtervoegsel `-state.json` toevoegt.

Als u `jobs.json` handmatig bewerkt, laat `jobs-state.json` dan buiten versiebeheer. OpenClaw gebruikt die sidecar voor pending slots, actieve markeringen, metadata van de laatste run en de planningsidentiteit die de scheduler vertelt wanneer een extern bewerkte taak een nieuwe `nextRunAtMs` nodig heeft.

Cron uitschakelen: `cron.enabled: false` of `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Eenmalige retry**: tijdelijke fouten (rate limit, overbelasting, netwerk, serverfout) worden tot 3 keer opnieuw geprobeerd met exponentiële backoff. Permanente fouten schakelen onmiddellijk uit.

    **Terugkerende retry**: exponentiële backoff (30s tot 60m) tussen retries. Backoff wordt gereset na de volgende succesvolle run.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (standaard `24h`) schoont geïsoleerde run-sessievermeldingen op. `cron.runLog.maxBytes` / `cron.runLog.keepLines` schonen runlogbestanden automatisch op.
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
  <Accordion title="Cron not firing">
    - Controleer `cron.enabled` en de omgevingsvariabele `OPENCLAW_SKIP_CRON`.
    - Bevestig dat de Gateway continu draait.
    - Verifieer voor `cron`-schema's de tijdzone (`--tz`) ten opzichte van de tijdzone van de host.
    - `reason: not-due` in runuitvoer betekent dat een handmatige run is gecontroleerd met `openclaw cron run <jobId> --due` en dat de taak nog niet verschuldigd was.

  </Accordion>
  <Accordion title="Cron geactiveerd maar geen levering">
    - Leveringsmodus `none` betekent dat er geen fallback-verzending door de runner wordt verwacht. De agent kan nog steeds rechtstreeks verzenden met de `message`-tool wanneer er een chatroute beschikbaar is.
    - Leveringsdoel ontbreekt/is ongeldig (`channel`/`to`) betekent dat uitgaand verkeer is overgeslagen.
    - Voor Matrix kunnen gekopieerde of legacy-taken met kamer-ID's in `delivery.to` die naar kleine letters zijn omgezet mislukken, omdat Matrix-kamer-ID's hoofdlettergevoelig zijn. Bewerk de taak naar de exacte waarde `!room:server` of `room:!room:server` uit Matrix.
    - Kanaalverificatiefouten (`unauthorized`, `Forbidden`) betekenen dat levering door referenties is geblokkeerd.
    - Als de geïsoleerde run alleen het stille token retourneert (`NO_REPLY` / `no_reply`), onderdrukt OpenClaw rechtstreekse uitgaande levering en ook het fallbackpad voor de samenvatting in de wachtrij, zodat er niets terug naar de chat wordt geplaatst.
    - Als de agent de gebruiker zelf een bericht moet sturen, controleer dan of de taak een bruikbare route heeft (`channel: "last"` met een eerdere chat, of een expliciet kanaal/doel).

  </Accordion>
  <Accordion title="Cron of Heartbeat lijkt /new-style-rollover te voorkomen">
    - Dagelijkse en inactieve resetversheid is niet gebaseerd op `updatedAt`; zie [Sessiebeheer](/nl/concepts/session#session-lifecycle).
    - Cron-wake-ups, Heartbeat-runs, exec-meldingen en Gateway-administratie kunnen de sessierij bijwerken voor routering/status, maar ze verlengen `sessionStartedAt` of `lastInteractionAt` niet.
    - Voor legacy-rijen die zijn gemaakt voordat die velden bestonden, kan OpenClaw `sessionStartedAt` herstellen uit de JSONL-sessieheader van het transcript wanneer het bestand nog beschikbaar is. Legacy-inactieve rijen zonder `lastInteractionAt` gebruiken die herstelde starttijd als hun inactiviteitsbasislijn.

  </Accordion>
  <Accordion title="Tijdzone-valkuilen">
    - Cron zonder `--tz` gebruikt de tijdzone van de Gateway-host.
    - `at`-planningen zonder tijdzone worden behandeld als UTC.
    - Heartbeat `activeHours` gebruikt geconfigureerde tijdzoneresolutie.

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Automatisering en taken](/nl/automation) — alle automatiseringsmechanismen in één oogopslag
- [Achtergrondtaken](/nl/automation/tasks) — taaklogboek voor Cron-uitvoeringen
- [Heartbeat](/nl/gateway/heartbeat) — periodieke turns in de hoofdsessie
- [Tijdzone](/nl/concepts/timezone) — tijdzoneconfiguratie
