---
read_when:
    - Achtergrondtaken of wekmomenten plannen
    - Externe triggers (Webhooks, Gmail) koppelen aan OpenClaw
    - Kiezen tussen Heartbeat en Cron voor geplande taken
sidebarTitle: Scheduled tasks
summary: Geplande jobs, Webhooks en Gmail PubSub-triggers voor de Gateway-planner
title: Geplande taken
x-i18n:
    generated_at: "2026-05-02T11:08:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7c70042c28b08140d664678ef42146942158512dce1f41c988be0f2dd9bedf5
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron is de ingebouwde scheduler van de Gateway. Deze bewaart taken, wekt de agent op het juiste moment en kan uitvoer terugsturen naar een chatkanaal of webhook-eindpunt.

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

## Hoe cron werkt

- Cron draait **binnen het Gateway**-proces (niet binnen het model).
- Taakdefinities blijven bewaard in `~/.openclaw/cron/jobs.json`, zodat herstarts geen planningen kwijtraken.
- De runtime-uitvoeringsstatus blijft ernaast bewaard in `~/.openclaw/cron/jobs-state.json`. Als je cron-definities in git bijhoudt, houd dan `jobs.json` bij en voeg `jobs-state.json` toe aan gitignore.
- Na de splitsing kunnen oudere OpenClaw-versies `jobs.json` lezen, maar ze kunnen taken als nieuw behandelen omdat runtime-velden nu in `jobs-state.json` staan.
- Wanneer `jobs.json` wordt bewerkt terwijl de Gateway draait of gestopt is, vergelijkt OpenClaw de gewijzigde planningsvelden met metadata van openstaande runtime-slots en wist het verouderde `nextRunAtMs`-waarden. Herschrijvingen die alleen opmaak of sleutelvolgorde wijzigen, behouden het openstaande slot.
- Alle cron-uitvoeringen maken records voor [achtergrondtaken](/nl/automation/tasks) aan.
- Bij het opstarten van de Gateway worden achterstallige geïsoleerde agent-turn-taken opnieuw gepland buiten het kanaalverbindingsvenster in plaats van direct opnieuw afgespeeld, zodat het opstarten van Discord/Telegram en de installatie van native opdrachten responsief blijven na herstarts.
- Eenmalige taken (`--at`) worden standaard automatisch verwijderd na succes.
- Geïsoleerde cron-runs sluiten op best-effort-basis bijgehouden browsertabbladen/processen voor hun `cron:<jobId>`-sessie wanneer de run is voltooid, zodat losgekoppelde browserautomatisering geen verweesde processen achterlaat.
- Geïsoleerde cron-runs beschermen ook tegen verouderde bevestigingsantwoorden. Als het eerste resultaat slechts een tussentijdse statusupdate is (`on it`, `pulling everything together` en vergelijkbare hints) en geen afstammende subagent-run nog verantwoordelijk is voor het eindantwoord, vraagt OpenClaw één keer opnieuw om het daadwerkelijke resultaat voordat het wordt afgeleverd.
- Geïsoleerde cron-runs geven de voorkeur aan gestructureerde metadata voor uitvoeringsweigering uit de ingebedde run en vallen daarna terug op bekende markers voor eindsamenvatting/uitvoer, zoals `SYSTEM_RUN_DENIED` en `INVALID_REQUEST`, zodat een geblokkeerde opdracht niet als een groene run wordt gerapporteerd.
- Geïsoleerde cron-runs behandelen fouten op run-niveau van agents ook als taakfouten, zelfs wanneer er geen antwoordpayload wordt geproduceerd, zodat model-/providerfouten fouttellers verhogen en foutmeldingen activeren in plaats van de taak als succesvol af te handelen.
- Wanneer een geïsoleerde agent-turn-taak `timeoutSeconds` bereikt, breekt cron de onderliggende agent-run af en geeft deze een korte opschoningsperiode. Als de run niet leegloopt, wist door de Gateway beheerde opschoning geforceerd het sessie-eigendom van die run voordat cron de time-out registreert, zodat werk in de wachtrij van de chat niet achterblijft achter een verouderde verwerkingssessie.

<a id="maintenance"></a>

<Note>
Taakreconciliatie voor cron is eerst runtime-eigendom en daarna ondersteund door duurzame geschiedenis: een actieve cron-taak blijft live zolang de cron-runtime die taak nog als actief bijhoudt, zelfs als er nog een oude child-sessierij bestaat. Zodra de runtime niet langer eigenaar is van de taak en de respijtperiode van 5 minuten verloopt, controleert onderhoud de bewaarde run-logboeken en taakstatus voor de overeenkomende `cron:<jobId>:<startedAt>`-run. Als die duurzame geschiedenis een terminaal resultaat toont, wordt het taakregister daaruit afgerond; anders kan door de Gateway beheerd onderhoud de taak als `lost` markeren. Offline CLI-audit kan herstellen vanuit duurzame geschiedenis, maar behandelt zijn eigen lege actieve-takenset in het proces niet als bewijs dat een door de Gateway beheerde cron-run verdwenen is.
</Note>

## Planningstypen

| Soort   | CLI-vlag  | Beschrijving                                            |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Eenmalige tijdstempel (ISO 8601 of relatief, zoals `20m`) |
| `every` | `--every` | Vast interval                                           |
| `cron`  | `--cron`  | Cron-expressie met 5 of 6 velden en optioneel `--tz`    |

Tijdstempels zonder tijdzone worden behandeld als UTC. Voeg `--tz America/New_York` toe voor planning op lokale kloktijd.

Terugkerende expressies bovenaan het uur worden automatisch met maximaal 5 minuten gespreid om belastingpieken te verminderen. Gebruik `--exact` om exacte timing af te dwingen of `--stagger 30s` voor een expliciet venster.

### Dag-van-de-maand en dag-van-de-week gebruiken OR-logica

Cron-expressies worden geparsed door [croner](https://github.com/Hexagon/croner). Wanneer zowel de velden dag-van-de-maand als dag-van-de-week geen wildcard zijn, matcht croner wanneer **een van beide** velden matcht, niet allebei. Dit is standaard Vixie-cron-gedrag.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Dit wordt ongeveer 5-6 keer per maand uitgevoerd in plaats van 0-1 keer per maand. OpenClaw gebruikt hier het standaard OR-gedrag van Croner. Als beide voorwaarden vereist zijn, gebruik dan Croners `+`-modifier voor dag-van-de-week (`0 9 15 * +1`) of plan op één veld en controleer het andere in de prompt of opdracht van je taak.

## Uitvoeringsstijlen

| Stijl           | `--session`-waarde | Wordt uitgevoerd in       | Beste voor                                      |
| --------------- | ------------------- | ------------------------- | ---------------------------------------------- |
| Hoofdsessie     | `main`              | Volgende Heartbeat-beurt  | Herinneringen, systeemgebeurtenissen           |
| Geïsoleerd      | `isolated`          | Toegewijde `cron:<jobId>` | Rapporten, achtergrondtaken                    |
| Huidige sessie  | `current`           | Gebonden op aanmaaktijd   | Contextbewust terugkerend werk                 |
| Aangepaste sessie | `session:custom-id` | Blijvende benoemde sessie | Workflows die voortbouwen op geschiedenis      |

<AccordionGroup>
  <Accordion title="Hoofdsessie versus geïsoleerd versus aangepast">
    **Hoofdsessie**-taken plaatsen een systeemgebeurtenis in de wachtrij en wekken optioneel de Heartbeat (`--wake now` of `--wake next-heartbeat`). Die systeemgebeurtenissen maken de doelsessie niet recenter voor dagelijkse resets of resets na inactiviteit. **Geïsoleerde** taken voeren een toegewijde agentbeurt uit met een nieuwe sessie. **Aangepaste sessies** (`session:xxx`) behouden context tussen uitvoeringen, waardoor workflows zoals dagelijkse stand-ups kunnen voortbouwen op eerdere samenvattingen.
  </Accordion>
  <Accordion title="Wat 'nieuwe sessie' betekent voor geïsoleerde taken">
    Voor geïsoleerde taken betekent "nieuwe sessie" een nieuwe transcript-/sessie-id voor elke uitvoering. OpenClaw kan veilige voorkeuren meenemen, zoals instellingen voor denken/snel/uitgebreid, labels en expliciet door de gebruiker geselecteerde model-/auth-overschrijvingen, maar neemt geen omgevingscontext van gesprekken over uit een oudere cron-rij: kanaal-/groepsroutering, verzend- of wachtrijbeleid, elevatie, oorsprong of ACP-runtimebinding. Gebruik `current` of `session:<id>` wanneer een terugkerende taak bewust op dezelfde gesprekscontext moet voortbouwen.
  </Accordion>
  <Accordion title="Runtime-opschoning">
    Voor geïsoleerde taken omvat runtime-afbraak nu best-effort browseropschoning voor die cron-sessie. Opschoningsfouten worden genegeerd, zodat het daadwerkelijke cron-resultaat nog steeds leidend is.

    Geïsoleerde cron-uitvoeringen verwijderen ook alle gebundelde MCP-runtime-instanties die voor de taak zijn aangemaakt via het gedeelde pad voor runtime-opschoning. Dit komt overeen met hoe MCP-clients voor hoofdsessies en aangepaste sessies worden afgebroken, zodat geïsoleerde cron-taken geen stdio-childprocessen of langlevende MCP-verbindingen lekken tussen uitvoeringen.

  </Accordion>
  <Accordion title="Subagent- en Discord-levering">
    Wanneer geïsoleerde cron-uitvoeringen subagents orkestreren, geeft levering ook de voorkeur aan de uiteindelijke descendant-uitvoer boven verouderde tussentekst van de parent. Als descendants nog actief zijn, onderdrukt OpenClaw die gedeeltelijke parent-update in plaats van deze aan te kondigen.

    Voor tekst-only Discord-aankondigingsdoelen verzendt OpenClaw de canonieke uiteindelijke assistenttekst eenmaal, in plaats van zowel gestreamde/tussentijdse tekstpayloads als het definitieve antwoord opnieuw af te spelen. Media en gestructureerde Discord-payloads worden nog steeds als afzonderlijke payloads geleverd, zodat bijlagen en componenten niet wegvallen.

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
  Sla injectie van workspace-bootstrapbestanden over.
</ParamField>
<ParamField path="--tools" type="string">
  Beperk welke tools de taak kan gebruiken, bijvoorbeeld `--tools exec,read`.
</ParamField>

`--model` gebruikt het geselecteerde toegestane model als het primaire model van die taak. Het is niet hetzelfde als een `/model`-overschrijving voor een chatsessie: geconfigureerde fallbackketens blijven van toepassing wanneer het primaire model van de taak mislukt. Als het aangevraagde model niet is toegestaan of niet kan worden herleid, laat Cron de uitvoering mislukken met een expliciete validatiefout in plaats van stil terug te vallen op de agent-/standaardmodelselectie van de taak.

Cron-taken kunnen ook `fallbacks` op payloadniveau bevatten. Wanneer aanwezig vervangt die lijst de geconfigureerde fallbackketen voor de taak. Gebruik `fallbacks: []` in de taakpayload/API wanneer je een strikte cron-uitvoering wilt die alleen het geselecteerde model probeert. Als een taak `--model` heeft maar geen payload- of geconfigureerde fallbacks, geeft OpenClaw een expliciete lege fallbackoverschrijving door, zodat de primaire agent niet als verborgen extra retrydoel wordt toegevoegd.

Voorrang bij modelselectie voor geïsoleerde taken is:

1. Gmail-hookmodeloverschrijving (wanneer de uitvoering uit Gmail kwam en die overschrijving is toegestaan)
2. `model` per taakpayload
3. Door gebruiker geselecteerde opgeslagen modeloverschrijving voor cron-sessie
4. Agent-/standaardmodelselectie

Snelle modus volgt ook de herleide live selectie. Als de geselecteerde modelconfiguratie `params.fastMode` heeft, gebruikt geïsoleerde cron die standaard. Een opgeslagen sessie-overschrijving voor `fastMode` blijft in beide richtingen voorrang houden op configuratie.

Als een geïsoleerde uitvoering een live model-switchhandoff raakt, probeert Cron opnieuw met de gewisselde provider/het gewisselde model en bewaart die live selectie voor de actieve uitvoering vóór de retry. Wanneer de switch ook een nieuw auth-profiel bevat, bewaart Cron die auth-profieloverschrijving ook voor de actieve uitvoering. Retries zijn begrensd: na de eerste poging plus 2 switch-retries breekt Cron af in plaats van eindeloos te blijven herhalen.

Voordat een geïsoleerde cron-uitvoering de agentrunner binnengaat, controleert OpenClaw bereikbare lokale providereindpunten voor geconfigureerde `api: "ollama"`- en `api: "openai-completions"`-providers waarvan `baseUrl` loopback, private-network of `.local` is. Als dat eindpunt down is, wordt de uitvoering vastgelegd als `skipped` met een duidelijke provider-/modelfout in plaats van een modelaanroep te starten. Het eindpuntresultaat wordt 5 minuten gecachet, zodat veel verschuldigde taken die dezelfde dode lokale Ollama-, vLLM-, SGLang- of LM Studio-server gebruiken één kleine probe delen in plaats van een verzoekenstorm te creëren. Overgeslagen provider-preflight-uitvoeringen verhogen de backoff voor uitvoeringsfouten niet; schakel `failureAlert.includeSkipped` in wanneer je herhaalde skip-meldingen wilt.

## Levering en uitvoer

| Modus      | Wat er gebeurt                                                              |
| ---------- | ---------------------------------------------------------------------------- |
| `announce` | Levert als fallback definitieve tekst aan het doel als de agent niet verzond |
| `webhook`  | POST de payload van de voltooide gebeurtenis naar een URL                    |
| `none`     | Geen fallbacklevering door de runner                                         |

Gebruik `--announce --channel telegram --to "-1001234567890"` voor kanaalbezorging. Gebruik voor Telegram-forumonderwerpen `-1001234567890:topic:123`; directe RPC-/config-aanroepers mogen ook `delivery.threadId` als string of getal doorgeven. Slack-/Discord-/Mattermost-doelen moeten expliciete prefixen gebruiken (`channel:<id>`, `user:<id>`). Matrix-room-ID's zijn hoofdlettergevoelig; gebruik het exacte room-ID of de vorm `room:!room:server` uit Matrix.

Wanneer announce-bezorging `channel: "last"` gebruikt of `channel` weglaat, kan een doel met provider-prefix zoals `telegram:123` het kanaal selecteren voordat cron terugvalt op sessiegeschiedenis of één geconfigureerd kanaal. Alleen prefixen die door de geladen Plugin worden aangekondigd zijn providerselectors. Als `delivery.channel` expliciet is, moet de doelprefix dezelfde provider noemen; bijvoorbeeld `channel: "whatsapp"` met `to: "telegram:123"` wordt geweigerd in plaats van WhatsApp het Telegram-ID als telefoonnummer te laten interpreteren. Doelsoort- en serviceprefixen zoals `channel:<id>`, `user:<id>`, `imessage:<handle>` en `sms:<number>` blijven kanaaleigen doelsyntaxis, geen providerselectors.

Voor geïsoleerde taken wordt chatbezorging gedeeld. Als er een chatroute beschikbaar is, kan de agent de tool `message` gebruiken, zelfs wanneer de taak `--no-deliver` gebruikt. Als de agent naar het geconfigureerde/huidige doel verzendt, slaat OpenClaw de fallback-announce over. Anders bepalen `announce`, `webhook` en `none` alleen wat de runner met het uiteindelijke antwoord doet na de agentbeurt.

Wanneer een agent een geïsoleerde herinnering maakt vanuit een actieve chat, slaat OpenClaw het behouden live-bezorgingsdoel op voor de fallback-announce-route. Interne sessiesleutels mogen kleine letters gebruiken; providerbezorgingsdoelen worden niet opnieuw opgebouwd uit die sleutels wanneer de huidige chatcontext beschikbaar is.

Impliciete announce-bezorging gebruikt geconfigureerde kanaal-allowlists om verouderde doelen te valideren en opnieuw te routeren. Goedkeuringen uit de DM-koppelingsopslag zijn geen ontvangers voor fallback-automatisering; stel `delivery.to` in of configureer de kanaalvermelding `allowFrom` wanneer een geplande taak proactief naar een DM moet sturen.

Foutmeldingen volgen een afzonderlijk bestemmingspad:

- `cron.failureDestination` stelt een globale standaard in voor foutmeldingen.
- `job.delivery.failureDestination` overschrijft dat per taak.
- Als geen van beide is ingesteld en de taak al via `announce` bezorgt, vallen foutmeldingen nu terug op dat primaire announce-doel.
- `delivery.failureDestination` wordt alleen ondersteund voor taken met `sessionTarget="isolated"`, tenzij de primaire bezorgmodus `webhook` is.
- `failureAlert.includeSkipped: true` laat een taak of globaal cron-waarschuwingsbeleid deelnemen aan herhaalde waarschuwingen voor overgeslagen runs. Overgeslagen runs houden een afzonderlijke teller voor opeenvolgende skips bij, zodat ze geen invloed hebben op backoff voor uitvoeringsfouten.

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

Elk verzoek moet het hook-token via een header bevatten:

- `Authorization: Bearer <token>` (aanbevolen)
- `x-openclaw-token: <token>`

Querystring-tokens worden geweigerd.

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
  <Accordion title="Gekoppelde hooks (POST /hooks/<name>)">
    Aangepaste hooknamen worden opgelost via `hooks.mappings` in de configuratie. Mappings kunnen willekeurige payloads omzetten naar `wake`- of `agent`-acties met sjablonen of codetransformaties.
  </Accordion>
</AccordionGroup>

<Warning>
Houd hook-eindpunten achter loopback, tailnet of een vertrouwde reverse proxy.

- Gebruik een speciaal hook-token; hergebruik geen gateway-authenticatietokens.
- Houd `hooks.path` op een speciaal subpad; `/` wordt geweigerd.
- Stel `hooks.allowedAgentIds` in om expliciete `agentId`-routering te beperken.
- Houd `hooks.allowRequestSessionKey=false`, tenzij u door de aanroeper gekozen sessies nodig hebt.
- Als u `hooks.allowRequestSessionKey` inschakelt, stel dan ook `hooks.allowedSessionKeyPrefixes` in om toegestane sessiesleutelvormen te beperken.
- Hook-payloads worden standaard met veiligheidsgrenzen omwikkeld.

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

Wanneer `hooks.enabled=true` en `hooks.gmail.account` is ingesteld, start de Gateway `gog gmail watch serve` bij het opstarten en verlengt de watch automatisch. Stel `OPENCLAW_SKIP_GMAIL_WATCHER=1` in om u af te melden.

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
  <Step title="Maak een topic en verleen Gmail-pushtoegang">
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
# Alle taken weergeven
openclaw cron list

# Eén taak weergeven, inclusief opgeloste bezorgroute
openclaw cron show <jobId>

# Een taak bewerken
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Een taak nu geforceerd uitvoeren
openclaw cron run <jobId>

# Alleen uitvoeren als de taak verschuldigd is
openclaw cron run <jobId> --due

# Runhistorie weergeven
openclaw cron runs --id <jobId> --limit 50

# Een taak verwijderen
openclaw cron remove <jobId>

# Agentselectie (multi-agentconfiguraties)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

<Note>
Opmerking over modeloverschrijving:

- `openclaw cron add|edit --model ...` wijzigt het geselecteerde model van de taak.
- Als het model is toegestaan, bereikt die exacte provider/model de geïsoleerde agent-run.
- Als het niet is toegestaan of niet kan worden opgelost, laat cron de run mislukken met een expliciete validatiefout.
- Geconfigureerde fallbackketens blijven van toepassing omdat cron `--model` een primaire taakinstelling is, geen sessie-overschrijving voor `/model`.
- Payload `fallbacks` vervangt geconfigureerde fallbacks voor die taak; `fallbacks: []` schakelt fallback uit en maakt de run strikt.
- Een gewone `--model` zonder expliciete of geconfigureerde fallbacklijst valt niet door naar de primaire agent als een stil extra retrydoel.

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

`maxConcurrentRuns` beperkt zowel geplande cron-dispatch als uitvoering van geïsoleerde agentbeurten. Geïsoleerde cron-agentbeurten gebruiken intern de speciale uitvoeringslane `cron-nested` van de wachtrij, dus door deze waarde te verhogen kunnen onafhankelijke cron-LLM-runs parallel voortgang maken in plaats van alleen hun buitenste cron-wrappers te starten. De gedeelde niet-cron-`nested`-lane wordt door deze instelling niet verbreed.

De runtime-state-sidecar wordt afgeleid van `cron.store`: een `.json`-store zoals `~/clawd/cron/jobs.json` gebruikt `~/clawd/cron/jobs-state.json`, terwijl een storepad zonder `.json`-suffix `-state.json` toevoegt.

Als u `jobs.json` handmatig bewerkt, laat `jobs-state.json` buiten source control. OpenClaw gebruikt die sidecar voor pending slots, actieve markeringen, last-run-metadata en de schema-identiteit die de scheduler vertelt wanneer een extern bewerkte taak een verse `nextRunAtMs` nodig heeft.

Cron uitschakelen: `cron.enabled: false` of `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retrygedrag">
    **Eenmalige retry**: tijdelijke fouten (rate limit, overbelasting, netwerk, serverfout) worden tot 3 keer opnieuw geprobeerd met exponentiële backoff. Permanente fouten schakelen onmiddellijk uit.

    **Terugkerende retry**: exponentiële backoff (30s tot 60m) tussen retries. Backoff wordt gereset na de volgende geslaagde run.

  </Accordion>
  <Accordion title="Onderhoud">
    `cron.sessionRetention` (standaard `24h`) ruimt geïsoleerde run-sessievermeldingen op. `cron.runLog.maxBytes` / `cron.runLog.keepLines` snoeien run-logbestanden automatisch.
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
    - Controleer `cron.enabled` en de env-var `OPENCLAW_SKIP_CRON`.
    - Bevestig dat de Gateway continu draait.
    - Controleer voor `cron`-schema's de tijdzone (`--tz`) ten opzichte van de tijdzone van de host.
    - `reason: not-due` in runuitvoer betekent dat de handmatige run is gecontroleerd met `openclaw cron run <jobId> --due` en dat de taak nog niet verschuldigd was.

  </Accordion>
  <Accordion title="Cron is uitgevoerd maar er is niets bezorgd">
    - Bezorgmodus `none` betekent dat er geen fallback-verzending door de runner wordt verwacht. De agent kan nog steeds rechtstreeks verzenden met de tool `message` wanneer er een chatroute beschikbaar is.
    - Ontbrekend/ongeldig bezorgdoel (`channel`/`to`) betekent dat uitgaand verkeer is overgeslagen.
    - Voor Matrix kunnen gekopieerde of legacy-taken met room-ID's in kleine letters in `delivery.to` mislukken omdat Matrix-room-ID's hoofdlettergevoelig zijn. Bewerk de taak naar de exacte waarde `!room:server` of `room:!room:server` uit Matrix.
    - Kanaalverificatiefouten (`unauthorized`, `Forbidden`) betekenen dat bezorging door referenties is geblokkeerd.
    - Als de geïsoleerde run alleen het stille token (`NO_REPLY` / `no_reply`) retourneert, onderdrukt OpenClaw directe uitgaande bezorging en ook het fallback-pad met de samenvatting in de wachtrij, zodat er niets terug naar de chat wordt geplaatst.
    - Als de agent zelf een bericht naar de gebruiker moet sturen, controleer dan of de taak een bruikbare route heeft (`channel: "last"` met een eerdere chat, of een expliciet kanaal/doel).

  </Accordion>
  <Accordion title="Cron of heartbeat lijkt /new-style rollover te voorkomen">
    - Dagelijkse en idle-resetversheid is niet gebaseerd op `updatedAt`; zie [Sessiebeheer](/nl/concepts/session#session-lifecycle).
    - Cron-wake-ups, heartbeat-runs, exec-meldingen en Gateway-boekhouding kunnen de sessierij bijwerken voor routering/status, maar ze verlengen `sessionStartedAt` of `lastInteractionAt` niet.
    - Voor legacy-rijen die zijn gemaakt voordat die velden bestonden, kan OpenClaw `sessionStartedAt` herstellen uit de JSONL-sessieheader van het transcript wanneer het bestand nog beschikbaar is. Legacy-idle-rijen zonder `lastInteractionAt` gebruiken die herstelde starttijd als hun idle-basislijn.

  </Accordion>
  <Accordion title="Aandachtspunten voor tijdzones">
    - Cron zonder `--tz` gebruikt de tijdzone van de Gateway-host.
    - `at`-planningen zonder tijdzone worden behandeld als UTC.
    - Heartbeat `activeHours` gebruikt de geconfigureerde tijdzone-resolutie.

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Automatisering en taken](/nl/automation) — alle automatiseringsmechanismen in één oogopslag
- [Achtergrondtaken](/nl/automation/tasks) — taaklogboek voor Cron-uitvoeringen
- [Heartbeat](/nl/gateway/heartbeat) — periodieke main-session-beurten
- [Tijdzone](/nl/concepts/timezone) — tijdzoneconfiguratie
