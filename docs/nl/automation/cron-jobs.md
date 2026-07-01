---
read_when:
    - Achtergrondtaken of wekopdrachten plannen
    - Externe triggers (webhooks, Gmail) koppelen aan OpenClaw
    - Kiezen tussen Heartbeat en Cron voor geplande taken
sidebarTitle: Scheduled tasks
summary: Geplande taken, webhooks en Gmail PubSub-triggers voor de Gateway-planner
title: Geplande taken
x-i18n:
    generated_at: "2026-07-01T08:14:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f75b8d1e5ac558a02b895e1cd1b92b05af549a2bd63d4ce3ddafcaf9e94b88e
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron is de ingebouwde scheduler van de Gateway. Hij bewaart jobs, wekt de agent op het juiste moment en kan uitvoer terugsturen naar een chatkanaal of Webhook-eindpunt.

## Snel aan de slag

<Steps>
  <Step title="Add a one-shot reminder">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
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

## Hoe cron werkt

- Cron draait **binnen het Gateway**-proces (niet binnen het model).
- Jobdefinities, runtime-status en uitvoeringsgeschiedenis blijven bewaard in de gedeelde SQLite-statusdatabase van OpenClaw, zodat schedules niet verloren gaan bij herstarts.
- Voer bij een upgrade `openclaw doctor --fix` uit om oudere bestanden `~/.openclaw/cron/jobs.json`, `jobs-state.json` en `runs/*.jsonl` in SQLite te importeren en ze te hernoemen met een `.migrated`-achtervoegsel. Ongeldige jobrijen worden tijdens runtime overgeslagen en naar `jobs-quarantine.json` gekopieerd voor latere reparatie of beoordeling.
- `cron.store` benoemt nog steeds de logische sleutel voor de cron-store en het importpad van doctor. Na import wijzigt bewerken van dat JSON-bestand de actieve cron-jobs niet meer; gebruik in plaats daarvan `openclaw cron add|edit|remove` of de cron-RPC-methoden van de Gateway.
- Alle cron-uitvoeringen maken records voor [achtergrondtaken](/nl/automation/tasks) aan.
- Bij het opstarten van de Gateway worden achterstallige geïsoleerde agent-turn-jobs opnieuw gepland buiten het verbindingsvenster voor kanalen, in plaats van onmiddellijk opnieuw te worden afgespeeld, zodat Discord/Telegram-opstart en native-command-instelling responsief blijven na herstarts.
- Eenmalige jobs (`--at`) worden standaard automatisch verwijderd na succes.
- Geïsoleerde cron-runs sluiten op best-effortbasis getraceerde browsertabbladen/processen voor hun `cron:<jobId>`-sessie wanneer de run is voltooid, zodat losgekoppelde browserautomatisering geen verweesde processen achterlaat.
- Geïsoleerde cron-runs die de beperkte cron-zelfopruimingsmachtiging ontvangen, kunnen nog steeds schedulerstatus, een zelfgefilterde lijst van hun huidige job en de uitvoeringsgeschiedenis van die job lezen, zodat status-/Heartbeat-controles hun eigen schedule kunnen inspecteren zonder bredere toegang voor cron-mutaties te krijgen.
- Geïsoleerde cron-runs beschermen ook tegen verouderde bevestigingsantwoorden. Als het eerste resultaat slechts een tussentijdse statusupdate is (`on it`, `pulling everything together` en vergelijkbare hints) en geen onderliggende subagent-run nog verantwoordelijk is voor het definitieve antwoord, vraagt OpenClaw eenmaal opnieuw om het werkelijke resultaat vóór levering.
- Geïsoleerde cron-runs gebruiken gestructureerde metadata voor uitvoeringsweigering uit de ingebedde run, inclusief node-host-`UNAVAILABLE`-wrappers waarvan het geneste foutbericht begint met `SYSTEM_RUN_DENIED` of `INVALID_REQUEST`, zodat een geblokkeerde opdracht niet als een geslaagde run wordt gerapporteerd terwijl gewone assistentproza niet als weigering wordt behandeld.
- Geïsoleerde cron-runs behandelen runniveau-agentfouten ook als jobfouten, zelfs wanneer er geen antwoordpayload wordt geproduceerd, zodat model-/providerfouten fouttellers verhogen en foutmeldingen activeren in plaats van de job als succesvol te wissen.
- Wanneer een geïsoleerde agent-turn-job `timeoutSeconds` bereikt, breekt cron de onderliggende agent-run af en geeft die een kort opruimvenster. Als de run niet leegloopt, wist Gateway-beheerde opruiming geforceerd het sessie-eigenaarschap van die run voordat cron de timeout registreert, zodat wachtrij-chatwerk niet achterblijft achter een verouderde verwerkende sessie.
- Als een geïsoleerde agent-turn vastloopt voordat de runner start of vóór de eerste modelaanroep, registreert cron een fasespecifieke timeout zoals `setup timed out before runner start` of `stalled before first model call (last phase: context-engine)`. Deze watchdogs dekken ingebedde providers en CLI-ondersteunde providers voordat hun externe CLI-proces daadwerkelijk is gestart, en worden onafhankelijk van lange `timeoutSeconds`-waarden begrensd, zodat cold-start-/auth-/contextfouten snel zichtbaar worden in plaats van te wachten op het volledige jobbudget.
- Als je system cron of een andere externe scheduler gebruikt om `openclaw agent` uit te voeren, wikkel die dan in een hard-kill-escalatie, ook al verwerkt de CLI `SIGTERM`/`SIGINT`. Gateway-ondersteunde runs vragen de Gateway geaccepteerde runs af te breken; lokale en ingebedde fallback-runs ontvangen hetzelfde afbreeksignaal. Geef voor GNU `timeout` de voorkeur aan `timeout -k 60 600 openclaw agent ...` boven gewone `timeout 600 ...`; de `-k`-waarde is de backstop van de supervisor als het proces niet kan leeglopen. Houd voor systemd-units dezelfde vorm aan door een `SIGTERM`-stopsignaal plus een gratievenster zoals `TimeoutStopSec` te gebruiken vóór een eventuele definitieve kill. Als een retry een `--run-id` hergebruikt terwijl de oorspronkelijke Gateway-run nog actief is, wordt het duplicaat als in uitvoering gerapporteerd in plaats van een tweede run te starten.

<a id="maintenance"></a>

<Note>
Taakreconciliatie voor cron is eerst runtime-beheerd en daarna ondersteund door duurzame geschiedenis: een actieve cron-taak blijft live zolang de cron-runtime die job nog als actief bijhoudt, zelfs als er nog een oude child-sessierij bestaat. Zodra de runtime de job niet meer beheert en het gratievenster van 5 minuten verloopt, controleert onderhoud opgeslagen runlogs en jobstatus voor de overeenkomende `cron:<jobId>:<startedAt>`-run. Als die duurzame geschiedenis een terminaal resultaat toont, wordt het takenlogboek daaruit afgerond; anders kan Gateway-beheerd onderhoud de taak als `lost` markeren. Offline CLI-audit kan herstellen vanuit duurzame geschiedenis, maar behandelt zijn eigen lege in-process set actieve jobs niet als bewijs dat een Gateway-beheerde cron-run verdwenen is.
</Note>

## Scheduletypen

| Soort   | CLI-vlag  | Beschrijving                                            |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Eenmalige timestamp (ISO 8601 of relatief zoals `20m`)  |
| `every` | `--every` | Vast interval                                           |
| `cron`  | `--cron`  | Cron-expressie met 5 of 6 velden met optioneel `--tz`   |

Timestamps zonder tijdzone worden als UTC behandeld. Voeg `--tz America/New_York` toe voor scheduling op lokale wandkloktijd.

Terugkerende expressies voor het hele uur worden automatisch met maximaal 5 minuten gespreid om belastingpieken te verminderen. Gebruik `--exact` om precieze timing af te dwingen of `--stagger 30s` voor een expliciet venster.

### Dag-van-de-maand en dag-van-de-week gebruiken OR-logica

Cron-expressies worden geparsed door [croner](https://github.com/Hexagon/croner). Wanneer zowel de velden voor dag-van-de-maand als dag-van-de-week geen wildcard zijn, matcht croner wanneer **een van beide** velden matcht — niet beide. Dit is standaardgedrag van Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Dit wordt ~5–6 keer per maand geactiveerd in plaats van 0–1 keer per maand. OpenClaw gebruikt hier het standaard OR-gedrag van Croner. Gebruik Croners `+`-modifier voor dag-van-de-week (`0 9 15 * +1`) om beide voorwaarden te vereisen, of schedule op één veld en bewaak het andere in de prompt of opdracht van je job.

## Uitvoeringsstijlen

| Stijl           | `--session`-waarde | Draait in                | Beste voor                     |
| --------------- | ------------------ | ------------------------ | ------------------------------ |
| Hoofdsessie     | `main`             | Dedicated cron wake lane | Herinneringen, system events   |
| Geïsoleerd      | `isolated`         | Dedicated `cron:<jobId>` | Rapporten, achtergrondklussen  |
| Huidige sessie  | `current`          | Gebonden bij aanmaken    | Contextbewust terugkerend werk |
| Aangepaste sessie | `session:custom-id` | Blijvende benoemde sessie | Workflows die op geschiedenis voortbouwen |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    Jobs met **hoofdsessie** plaatsen een system event in een cron-beheerde run-lane en wekken optioneel de Heartbeat (`--wake now` of `--wake next-heartbeat`). Ze kunnen de laatste leveringscontext van de doelhoofdsessie gebruiken voor antwoorden, maar ze voegen routinematige cron-turns niet toe aan de menselijke chat-lane en verlengen de dagelijks/inactief-resetversheid voor de doelsessie niet. **Geïsoleerde** jobs draaien een dedicated agent-turn met een nieuwe sessie. **Aangepaste sessies** (`session:xxx`) behouden context over runs heen, wat workflows mogelijk maakt zoals dagelijkse standups die voortbouwen op eerdere samenvattingen.

    Cron-events voor hoofdsessies zijn zelfstandige system-event-herinneringen. Ze nemen
    niet automatisch de instructie "Read
    HEARTBEAT.md" uit de standaard Heartbeat-prompt op. Als een terugkerende herinnering
    `HEARTBEAT.md` moet raadplegen, zeg dat dan expliciet in de cron-eventtekst of in de
    eigen instructies van de agent.

  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    Voor geïsoleerde jobs betekent "nieuwe sessie" een nieuw transcript-/sessie-id voor elke run. OpenClaw kan veilige voorkeuren meenemen, zoals instellingen voor denken/snel/uitgebreid, labels en expliciete door de gebruiker geselecteerde model-/auth-overrides, maar erft geen omgevingsgesprekscontext van een oudere cron-rij: kanaal-/groepsroutering, verzend- of wachtrijbeleid, elevatie, herkomst of ACP-runtimebinding. Gebruik `current` of `session:<id>` wanneer een terugkerende job bewust op dezelfde gesprekscontext moet voortbouwen.
  </Accordion>
  <Accordion title="Runtime cleanup">
    Voor geïsoleerde jobs omvat runtime-teardown nu best-effort browseropruiming voor die cron-sessie. Opruimfouten worden genegeerd, zodat het werkelijke cron-resultaat nog steeds voorrang heeft.

    Geïsoleerde cron-runs verwijderen ook alle gebundelde MCP-runtime-instanties die voor de job zijn aangemaakt via het gedeelde runtime-opruimpad. Dit komt overeen met hoe MCP-clients voor hoofdsessies en aangepaste sessies worden afgebroken, zodat geïsoleerde cron-jobs geen stdio-childprocessen of langlevende MCP-verbindingen laten lekken tussen runs.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    Wanneer geïsoleerde cron-runs subagents orkestreren, geeft levering ook de voorkeur aan de definitieve uitvoer van de descendant boven verouderde tussentijdse tekst van de parent. Als descendants nog draaien, onderdrukt OpenClaw die gedeeltelijke parent-update in plaats van die aan te kondigen.

    Voor tekst-only Discord-aankondigingsdoelen verzendt OpenClaw de canonieke definitieve assistenttekst eenmaal, in plaats van zowel gestreamde/tussentijdse tekstpayloads als het definitieve antwoord opnieuw af te spelen. Media en gestructureerde Discord-payloads worden nog steeds als afzonderlijke payloads geleverd, zodat bijlagen en componenten niet worden weggelaten.

  </Accordion>
</AccordionGroup>

### Opdrachtpayloads

Gebruik opdrachtpayloads voor deterministische scripts die binnen de Gateway-scheduler moeten draaien zonder een model-ondersteunde geïsoleerde agent-turn te starten. Opdrachtjobs worden uitgevoerd op de Gateway-host, leggen stdout/stderr vast, registreren de run in de cron-geschiedenis en hergebruiken dezelfde leveringsmodi `announce`, `webhook` en `none` als geïsoleerde jobs.

<Note>
Command cron is een operator-admin Gateway-automatiseringsoppervlak, geen agent-
`tools.exec`-aanroep. Cron-jobs aanmaken, bijwerken, verwijderen of handmatig uitvoeren
vereist `operator.admin`; geplande opdracht-runs worden later binnen het
Gateway-proces uitgevoerd als die door admin geschreven automatisering. Agent-execbeleid zoals
`tools.exec.mode`, goedkeuringsprompts en per-agent tool-allowlists beheren
voor het model zichtbare exec-tools, niet command cron-payloads.
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` slaat `argv: ["sh", "-lc", <shell>]` op. Gebruik `--command-argv '["node","scripts/report.mjs"]'` wanneer je exacte argv-uitvoering wilt zonder shell-parsing. Optionele velden `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds` en `--output-max-bytes` regelen de procesomgeving, stdin en uitvoergrenzen.

Als stdout niet leeg is, is die tekst het geleverde resultaat. Als stdout leeg is en stderr niet leeg is, wordt stderr geleverd. Als beide streams aanwezig zijn, levert cron een klein `stdout:` / `stderr:`-blok. Een exitcode nul registreert de uitvoering als `ok`; een niet-nul exitcode, signaal, timeout of no-output timeout registreert `error` en kan foutmeldingen activeren. Een opdracht die alleen `NO_REPLY` afdrukt, gebruikt de normale stille-tokenonderdrukking van cron en plaatst niets terug in de chat.

### Payloadopties voor geïsoleerde taken

<ParamField path="--message" type="string" required>
  Prompttekst (vereist voor geïsoleerd).
</ParamField>
<ParamField path="--model" type="string">
  Modeloverschrijving; gebruikt het geselecteerde toegestane model voor de taak.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Fallbackmodellenlijst per taak, bijvoorbeeld `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Geef `--fallbacks ""` door voor een strikte uitvoering zonder fallbacks.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  Bij `cron edit` wordt de fallbackoverschrijving per taak verwijderd, zodat de taak de geconfigureerde fallbackvoorrang volgt. Kan niet worden gecombineerd met `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  Bij `cron edit` wordt de modeloverschrijving per taak verwijderd, zodat de taak de normale cronvoorrang voor modelselectie volgt (een opgeslagen overschrijving voor de cron-sessie als die is ingesteld, anders het agent-/standaardmodel). Kan niet worden gecombineerd met `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Overschrijving voor denkniveau.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  Bij `cron edit` wordt de thinking-overschrijving per taak verwijderd, zodat de taak de normale cronvoorrang voor thinking volgt. Kan niet worden gecombineerd met `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Injectie van workspace-bootstrapbestanden overslaan.
</ParamField>
<ParamField path="--tools" type="string">
  Beperk welke tools de taak kan gebruiken, bijvoorbeeld `--tools exec,read`.
</ParamField>

`--model` gebruikt het geselecteerde toegestane model als primair model van die taak. Dit is niet hetzelfde als een `/model`-overschrijving in een chatsessie: geconfigureerde fallbackketens blijven van toepassing wanneer het primaire taakmodel mislukt. Als het aangevraagde model niet is toegestaan of niet kan worden opgelost, laat cron de uitvoering mislukken met een expliciete validatiefout in plaats van stil terug te vallen op de agent-/standaardmodelselectie van de taak.

Cron-taken kunnen ook `fallbacks` op payloadniveau bevatten. Als die aanwezig zijn, vervangt die lijst de geconfigureerde fallbackketen voor de taak. Gebruik `fallbacks: []` in de taakpayload/API wanneer je een strikte cron-uitvoering wilt die alleen het geselecteerde model probeert. Als een taak `--model` heeft maar geen payload- of geconfigureerde fallbacks, geeft OpenClaw een expliciete lege fallbackoverschrijving door, zodat het primaire agentmodel niet als verborgen extra retrydoel wordt toegevoegd.

Preflightcontroles voor lokale providers lopen geconfigureerde fallbacks af voordat een cron-uitvoering als `skipped` wordt gemarkeerd; `fallbacks: []` houdt dat preflightpad strikt.

Voorrang voor modelselectie bij geïsoleerde taken is:

1. Gmail-hookmodeloverschrijving (wanneer de uitvoering uit Gmail kwam en die overschrijving is toegestaan)
2. `model` in de payload per taak
3. Door gebruiker geselecteerde opgeslagen modeloverschrijving voor cron-sessie
4. Agent-/standaardmodelselectie

Snelle modus volgt ook de opgeloste live selectie. Als de geselecteerde modelconfiguratie `params.fastMode` heeft, gebruikt geïsoleerde cron die standaard. Een opgeslagen sessieoverschrijving voor `fastMode` wint nog steeds van configuratie in beide richtingen. Automatische modus gebruikt de `params.fastAutoOnSeconds`-grens van het geselecteerde model wanneer die aanwezig is, met 60 seconden als standaard.

Als een geïsoleerde uitvoering een live model-switchhandoff raakt, probeert cron opnieuw met de gewisselde provider/het gewisselde model en bewaart die live selectie voor de actieve uitvoering voordat opnieuw wordt geprobeerd. Wanneer de switch ook een nieuw auth-profiel meeneemt, bewaart cron die auth-profieloverschrijving ook voor de actieve uitvoering. Nieuwe pogingen zijn begrensd: na de eerste poging plus 2 switch-retries breekt cron af in plaats van eindeloos te blijven lussen.

Voordat een geïsoleerde cron-uitvoering de agent-runner ingaat, controleert OpenClaw bereikbare lokale provider-endpoints voor geconfigureerde providers met `api: "ollama"` en `api: "openai-completions"` waarvan `baseUrl` loopback, privénetwerk of `.local` is. Als dat endpoint down is, wordt de uitvoering geregistreerd als `skipped` met een duidelijke provider-/modelfout in plaats van een modelaanroep te starten. Het endpointresultaat wordt 5 minuten gecachet, zodat veel vervallen taken die dezelfde dode lokale Ollama-, vLLM-, SGLang- of LM Studio-server gebruiken één kleine probe delen in plaats van een verzoekenstorm te creëren. Overgeslagen provider-preflightuitvoeringen verhogen de backoff voor uitvoeringsfouten niet; schakel `failureAlert.includeSkipped` in wanneer je herhaalde skipmeldingen wilt.

## Levering en uitvoer

| Modus      | Wat er gebeurt                                                    |
| ---------- | ----------------------------------------------------------------- |
| `announce` | Lever de eindtekst via fallback aan het doel als de agent niet verzond |
| `webhook`  | POST de payload van het voltooide event naar een URL              |
| `none`     | Geen fallbacklevering door de runner                              |

Gebruik `--announce --channel telegram --to "-1001234567890"` voor kanaallevering. Gebruik voor Telegram-forumonderwerpen `-1001234567890:topic:123`; OpenClaw accepteert ook de Telegram-eigen verkorte vorm `-1001234567890:123`. Directe RPC-/config-aanroepers kunnen `delivery.threadId` als string of getal doorgeven. Slack-/Discord-/Mattermost-doelen moeten expliciete prefixen gebruiken (`channel:<id>`, `user:<id>`). Matrix-room-ID's zijn hoofdlettergevoelig; gebruik de exacte room-ID of de vorm `room:!room:server` uit Matrix.

Wanneer announce-levering `channel: "last"` gebruikt of `channel` weglaat, kan een provider-geprefixt doel zoals `telegram:123` het kanaal selecteren voordat cron terugvalt op sessiegeschiedenis of één geconfigureerd kanaal. Alleen prefixen die door de geladen Plugin worden geadverteerd, zijn providerselectors. Als `delivery.channel` expliciet is, moet de doelprefix dezelfde provider noemen; bijvoorbeeld `channel: "whatsapp"` met `to: "telegram:123"` wordt geweigerd in plaats van WhatsApp de Telegram-ID als telefoonnummer te laten interpreteren. Prefixen voor doelsoort en service zoals `channel:<id>`, `user:<id>`, `imessage:<handle>` en `sms:<number>` blijven kanaaleigen doelsyntaxis, geen providerselectors.

Voor geïsoleerde taken wordt chatlevering gedeeld. Als een chatroute beschikbaar is, kan de agent de `message`-tool gebruiken, zelfs wanneer de taak `--no-deliver` gebruikt. Als de agent naar het geconfigureerde/huidige doel verzendt, slaat OpenClaw de fallback-announce over. Anders bepalen `announce`, `webhook` en `none` alleen wat de runner doet met het eindantwoord na de agentbeurt.

Wanneer een agent vanuit een actieve chat een geïsoleerde herinnering maakt, slaat OpenClaw het bewaarde live leveringsdoel op voor de fallback-announce-route. Interne sessiesleutels kunnen kleine letters zijn; providerleveringsdoelen worden niet opnieuw opgebouwd vanuit die sleutels wanneer de huidige chatcontext beschikbaar is.

Impliciete announce-levering gebruikt geconfigureerde kanaal-allowlists om verouderde doelen te valideren en om te leiden. Goedkeuringen uit de DM-pairingstore zijn geen ontvangers voor fallbackautomatisering; stel `delivery.to` in of configureer de `allowFrom`-vermelding van het kanaal wanneer een geplande taak proactief naar een DM moet verzenden.

## Uitvoertaal

Cron-taken leiden geen antwoordtaal af uit kanaal, locale of eerdere
berichten. Zet de taalregel in het geplande bericht of de template:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Voor templatebestanden houd je de taalinstructie in de gerenderde prompt en
controleer je dat placeholders zoals `{{language}}` zijn ingevuld voordat de taak wordt uitgevoerd. Als
de uitvoer talen mengt, maak de regel expliciet, bijvoorbeeld: "Use Chinese
for narrative text and keep technical terms in English."

Foutmeldingen volgen een apart bestemmingspad:

- `cron.failureDestination` stelt een globale standaard in voor foutmeldingen.
- `job.delivery.failureDestination` overschrijft dat per taak.
- Als geen van beide is ingesteld en de taak al via `announce` levert, vallen foutmeldingen nu terug op dat primaire announce-doel.
- `delivery.failureDestination` wordt alleen ondersteund op taken met `sessionTarget="isolated"`, tenzij de primaire leveringsmodus `webhook` is.
- `failureAlert.includeSkipped: true` laat een taak of globaal cron-waarschuwingsbeleid kiezen voor herhaalde waarschuwingen over overgeslagen uitvoeringen. Overgeslagen uitvoeringen houden een aparte teller voor opeenvolgende skips bij, zodat ze de backoff voor uitvoeringsfouten niet beïnvloeden.

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
    openclaw cron create "0 7 * * *" \
      "Summarize overnight updates." \
      --name "Morning brief" \
      --tz "America/Los_Angeles" \
      --session isolated \
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
  <Tab title="Webhookuitvoer">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Opdrachtuitvoer">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "Queue depth probe" \
      --command "scripts/check-queue.sh" \
      --command-cwd "/srv/app" \
      --announce \
      --channel telegram \
      --to "-1001234567890"
    ```
  </Tab>
</Tabs>

## Webhooks

Gateway kan HTTP-Webhook-endpoints blootstellen voor externe triggers. Schakel in configuratie in:

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

Elk verzoek moet het hook-token via header bevatten:

- `Authorization: Bearer <token>` (aanbevolen)
- `x-openclaw-token: <token>`

Query-stringtokens worden geweigerd.

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
  <Accordion title="Toegewezen hooks (POST /hooks/<name>)">
    Aangepaste hooknamen worden opgelost via `hooks.mappings` in configuratie. Mappings kunnen willekeurige payloads omzetten naar `wake`- of `agent`-acties met templates of codetransformaties.
  </Accordion>
</AccordionGroup>

<Warning>
Houd hook-endpoints achter loopback, tailnet of een vertrouwde reverse proxy.

- Gebruik een speciaal hooktoken; hergebruik geen Gateway-authenticatietokens.
- Houd `hooks.path` op een speciaal subpad; `/` wordt geweigerd.
- Stel `hooks.allowedAgentIds` in om te beperken op welke effectieve agent een hook zich mag richten, inclusief de standaardagent wanneer `agentId` is weggelaten.
- Houd `hooks.allowRequestSessionKey=false`, tenzij je door de aanroeper gekozen sessies nodig hebt.
- Als je `hooks.allowRequestSessionKey` inschakelt, stel dan ook `hooks.allowedSessionKeyPrefixes` in om toegestane vormen van sessiesleutels te beperken.
- Hookpayloads worden standaard met veiligheidsgrenzen omwikkeld.

</Warning>

## Gmail PubSub-integratie

Koppel Gmail-inboxtriggers aan OpenClaw via Google PubSub.

<Note>
**Vereisten:** `gcloud` CLI, `gog` (gogcli), OpenClaw-hooks ingeschakeld, Tailscale voor het openbare HTTPS-eindpunt.
</Note>

### Wizardconfiguratie (aanbevolen)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Dit schrijft de configuratie `hooks.gmail`, schakelt de Gmail-preset in en gebruikt Tailscale Funnel voor het push-eindpunt.

### Gateway automatisch starten

Wanneer `hooks.enabled=true` en `hooks.gmail.account` is ingesteld, start de Gateway `gog gmail watch serve` bij het opstarten en vernieuwt deze de watch automatisch. Stel `OPENCLAW_SKIP_GMAIL_WATCHER=1` in om je af te melden.

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
  <Step title="Maak een topic en geef Gmail push-toegang">
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

# Force run a job now and wait for its terminal status
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# View one exact run
openclaw cron runs --id <jobId> --run-id <runId>

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron create "0 6 * * *" "Check ops queue" --name "Ops sweep" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

`openclaw cron run <jobId>` keert terug nadat de handmatige run in de wachtrij is gezet. Gebruik `--wait` voor afsluit-hooks, onderhoudsscripts of andere automatisering die moet blokkeren totdat de run in de wachtrij is voltooid. De wachtmodus polt de exacte geretourneerde `runId`; deze sluit af met `0` voor status `ok` en met niet-nul voor `error`, `skipped` of een wachttime-out.

De agenttool `cron` retourneert compacte taaksamenvattingen (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) vanuit `cron(action: "list")`; gebruik `cron(action: "get", jobId: "...")` voor één volledige taakdefinitie. Directe Gateway-aanroepers kunnen `compact: true` doorgeven aan `cron.list`; als dit wordt weggelaten, blijft de bestaande volledige respons met afleveringsvoorbeelden behouden.

`openclaw cron create` is een alias voor `openclaw cron add`, en nieuwe taken kunnen een positioneel schema gebruiken (`"0 9 * * 1"`, `"every 1h"`, `"20m"` of een ISO-tijdstempel), gevolgd door een positionele agentprompt. Gebruik `--webhook <url>` op `cron add|create` of `cron edit` om de payload van de voltooide run via POST naar een HTTP-eindpunt te sturen. Webhook-aflevering kan niet worden gecombineerd met chat-afleveringsvlaggen zoals `--announce`, `--channel`, `--to`, `--thread-id` of `--account`. Bij `cron edit` maken `--clear-channel`, `--clear-to`, `--clear-thread-id` en `--clear-account` die routeringsvelden afzonderlijk ongedaan (elk wordt geweigerd samen met de bijbehorende instelvlag), wat iets anders is dan `--no-deliver`, dat fallback-aflevering door de runner uitschakelt.

<Note>
Opmerking over modeloverschrijving:

- `openclaw cron add|edit --model ...` wijzigt het geselecteerde model van de taak.
- Als het model is toegestaan, bereikt die exacte provider/model de geïsoleerde agentrun.
- Als het niet is toegestaan of niet kan worden opgelost, laat Cron de run mislukken met een expliciete validatiefout.
- API-payloadpatches voor `cron.update` kunnen `model: null` instellen om een opgeslagen modeloverschrijving voor de taak te wissen.
- `openclaw cron edit <job-id> --clear-model` wist die overschrijving vanuit de CLI (hetzelfde effect als de patch `model: null`) en kan niet worden gecombineerd met `--model`.
- Geconfigureerde fallbackketens blijven van toepassing omdat Cron `--model` een primaire taakinstelling is, geen sessie-overschrijving voor `/model`.
- `openclaw cron add|edit --fallbacks ...` stelt payload `fallbacks` in en vervangt geconfigureerde fallbacks voor die taak; `--fallbacks ""` schakelt fallback uit en maakt de run strikt. `openclaw cron edit <job-id> --clear-fallbacks` wist de overschrijving per taak.
- Een gewone `--model` zonder expliciete of geconfigureerde fallbacklijst valt niet terug op de primaire agent als stil extra doel voor opnieuw proberen.

</Note>

## Configuratie

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
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

`maxConcurrentRuns` beperkt zowel geplande Cron-dispatch als geïsoleerde uitvoering van agentbeurten en staat standaard op 8. Geïsoleerde Cron-agentbeurten gebruiken intern de speciale uitvoeringsbaan `cron-nested` van de wachtrij, dus door deze waarde te verhogen kunnen onafhankelijke Cron-LLM-runs parallel doorgaan in plaats van alleen hun buitenste Cron-wrappers te starten. De gedeelde niet-Cron-baan `nested` wordt niet verbreed door deze instelling.

`cron.store` is een logische storesleutel en een legacy importpad voor doctor. Voer `openclaw doctor --fix` uit om bestaande JSON-stores in SQLite te importeren en te archiveren; toekomstige Cron-wijzigingen moeten via de CLI of Gateway-API verlopen.

Cron uitschakelen: `cron.enabled: false` of `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Gedrag bij opnieuw proberen">
    **Eenmalig opnieuw proberen**: tijdelijke fouten (snelheidslimiet, overbelasting, netwerk, serverfout) worden tot 3 keer opnieuw geprobeerd met exponentiële backoff. Permanente fouten schakelen onmiddellijk uit.

    **Terugkerend opnieuw proberen**: exponentiële backoff (30s tot 60m) tussen pogingen. Backoff wordt opnieuw ingesteld na de volgende geslaagde run.

  </Accordion>
  <Accordion title="Onderhoud">
    `cron.sessionRetention` (standaard `24h`) ruimt geïsoleerde run-sessievermeldingen op. `cron.runLog.keepLines` beperkt het aantal bewaarde SQLite-rijen met runhistorie per taak; `maxBytes` blijft behouden voor configuratiecompatibiliteit met oudere bestandsgebaseerde runlogs.
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
    - Controleer voor `cron`-schema's de tijdzone (`--tz`) ten opzichte van de hosttijdzone.
    - `reason: not-due` in runuitvoer betekent dat een handmatige run is gecontroleerd met `openclaw cron run <jobId> --due` en dat de taak nog niet aan de beurt was.

  </Accordion>
  <Accordion title="Cron is geactiveerd maar er is geen aflevering">
    - Afleveringsmodus `none` betekent dat er geen fallbackverzending door de runner wordt verwacht. De agent kan nog steeds rechtstreeks verzenden met de tool `message` wanneer een chatroute beschikbaar is.
    - Afleveringsdoel ontbreekt/is ongeldig (`channel`/`to`) betekent dat uitgaand verkeer is overgeslagen.
    - Voor Matrix kunnen gekopieerde of legacy taken met naar kleine letters omgezette kamer-ID's in `delivery.to` mislukken omdat Matrix-kamer-ID's hoofdlettergevoelig zijn. Bewerk de taak naar de exacte waarde `!room:server` of `room:!room:server` uit Matrix.
    - Kanaalauthenticatiefouten (`unauthorized`, `Forbidden`) betekenen dat aflevering is geblokkeerd door referenties.
    - Als de geïsoleerde run alleen het stille token retourneert (`NO_REPLY` / `no_reply`), onderdrukt OpenClaw directe uitgaande aflevering en onderdrukt het ook het fallbackpad met de samenvatting in de wachtrij, zodat er niets terug naar de chat wordt geplaatst.
    - Als de agent de gebruiker zelf moet berichten, controleer dan of de taak een bruikbare route heeft (`channel: "last"` met een eerdere chat, of een expliciet kanaal/doel).

  </Accordion>
  <Accordion title="Cron of Heartbeat lijkt /new-style-rollover te voorkomen">
    - De versheid voor dagelijkse en inactieve reset is niet gebaseerd op `updatedAt`; zie [Sessiebeheer](/nl/concepts/session#session-lifecycle).
    - Cron-wakeups, Heartbeat-runs, exec-meldingen en Gateway-boekhouding kunnen de sessierij bijwerken voor routering/status, maar ze verlengen `sessionStartedAt` of `lastInteractionAt` niet.
    - Voor legacy rijen die zijn gemaakt voordat die velden bestonden, kan OpenClaw `sessionStartedAt` herstellen uit de JSONL-sessieheader van het transcript wanneer het bestand nog beschikbaar is. Legacy inactieve rijen zonder `lastInteractionAt` gebruiken die herstelde starttijd als hun inactiviteitsbasislijn.

  </Accordion>
  <Accordion title="Tijdzonevalkuilen">
    - Cron zonder `--tz` gebruikt de tijdzone van de Gateway-host.
    - `at`-schema's zonder tijdzone worden behandeld als UTC.
    - Heartbeat `activeHours` gebruikt geconfigureerde tijdzone-resolutie.

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Automatisering](/nl/automation) — alle automatiseringsmechanismen in één oogopslag
- [Achtergrondtaken](/nl/automation/tasks) — taakregister voor Cron-uitvoeringen
- [Heartbeat](/nl/gateway/heartbeat) — periodieke beurten in de hoofdsessie
- [Tijdzone](/nl/concepts/timezone) — tijdzoneconfiguratie
