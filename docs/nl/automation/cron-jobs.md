---
read_when:
    - Achtergrondtaken of wekmomenten plannen
    - Externe triggers (Webhooks, Gmail) koppelen aan OpenClaw
    - Kiezen tussen Heartbeat en Cron voor geplande taken
sidebarTitle: Scheduled tasks
summary: Geplande taken, webhooks en Gmail PubSub-triggers voor de Gateway-planner
title: Geplande taken
x-i18n:
    generated_at: "2026-07-02T08:30:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f75b8d1e5ac558a02b895e1cd1b92b05af549a2bd63d4ce3ddafcaf9e94b88e
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron is de ingebouwde planner van de Gateway. Deze bewaart taken, wekt de agent op het juiste moment en kan uitvoer terugsturen naar een chatkanaal of Webhook-eindpunt.

## Snelstart

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

## Hoe Cron werkt

- Cron draait **binnen het Gateway**-proces (niet binnen het model).
- Taakdefinities, runtime-status en uitvoeringsgeschiedenis blijven bewaard in OpenClaw's gedeelde SQLite-statusdatabase, zodat planningen niet verloren gaan bij herstarts.
- Voer bij een upgrade `openclaw doctor --fix` uit om oudere `~/.openclaw/cron/jobs.json`-, `jobs-state.json`- en `runs/*.jsonl`-bestanden in SQLite te importeren en ze te hernoemen met een `.migrated`-achtervoegsel. Misvormde taakrijen worden overgeslagen in de runtime en gekopieerd naar `jobs-quarantine.json` voor latere reparatie of beoordeling.
- `cron.store` benoemt nog steeds de logische Cron-store-sleutel en het doctor-importpad. Na import wijzigt het bewerken van dat JSON-bestand de actieve Cron-taken niet meer; gebruik in plaats daarvan `openclaw cron add|edit|remove` of de Cron-RPC-methoden van de Gateway.
- Alle Cron-uitvoeringen maken [achtergrondtaak](/nl/automation/tasks)-records aan.
- Bij het opstarten van de Gateway worden achterstallige geïsoleerde agent-turn-taken opnieuw gepland buiten het kanaalverbindingsvenster in plaats van direct opnieuw afgespeeld, zodat het opstarten van Discord/Telegram en de instelling van native opdrachten responsief blijven na herstarts.
- Eenmalige taken (`--at`) worden standaard automatisch verwijderd na een succesvolle uitvoering.
- Geïsoleerde Cron-uitvoeringen sluiten naar beste vermogen bijgehouden browsertabs/processen voor hun `cron:<jobId>`-sessie wanneer de uitvoering voltooid is, zodat losgekoppelde browserautomatisering geen verweesde processen achterlaat.
- Geïsoleerde Cron-uitvoeringen die de smalle Cron-zelfopschoningsgrant ontvangen, kunnen nog steeds de plannerstatus, een op zichzelf gefilterde lijst van hun huidige taak en de uitvoeringsgeschiedenis van die taak lezen, zodat status-/Heartbeat-controles hun eigen planning kunnen inspecteren zonder bredere Cron-mutatierechten te krijgen.
- Geïsoleerde Cron-uitvoeringen beschermen ook tegen verouderde bevestigingsreacties. Als het eerste resultaat alleen een tussentijdse statusupdate is (`on it`, `pulling everything together` en vergelijkbare hints) en geen afstammende subagent-uitvoering nog verantwoordelijk is voor het uiteindelijke antwoord, vraagt OpenClaw eenmaal opnieuw om het daadwerkelijke resultaat voordat het wordt afgeleverd.
- Geïsoleerde Cron-uitvoeringen gebruiken gestructureerde metadata voor uitvoeringsweigering uit de ingebedde uitvoering, inclusief node-host `UNAVAILABLE`-wrappers waarvan de geneste foutmelding begint met `SYSTEM_RUN_DENIED` of `INVALID_REQUEST`, zodat een geblokkeerde opdracht niet als een groene uitvoering wordt gerapporteerd terwijl gewone assistenttekst niet als weigering wordt behandeld.
- Geïsoleerde Cron-uitvoeringen behandelen fouten op agentuitvoeringsniveau ook als taakfouten, zelfs wanneer er geen antwoordpayload wordt geproduceerd, zodat model-/providerfouten fouttellers verhogen en foutmeldingen activeren in plaats van de taak als succesvol af te ronden.
- Wanneer een geïsoleerde agent-turn-taak `timeoutSeconds` bereikt, breekt Cron de onderliggende agentuitvoering af en geeft deze een kort opschoningsvenster. Als de uitvoering niet leegloopt, wist door de Gateway beheerde opschoning geforceerd het sessie-eigenaarschap van die uitvoering voordat Cron de time-out vastlegt, zodat wachtrij-chatwerk niet achterblijft achter een verouderde verwerkingssessie.
- Als een geïsoleerde agent-turn vastloopt voordat de runner start of vóór de eerste modelaanroep, legt Cron een fasespecifieke time-out vast, zoals `setup timed out before runner start` of `stalled before first model call (last phase: context-engine)`. Deze watchdogs dekken ingebedde providers en CLI-ondersteunde providers voordat hun externe CLI-proces daadwerkelijk is gestart, en worden onafhankelijk afgetopt van lange `timeoutSeconds`-waarden, zodat cold-start-/auth-/contextfouten snel zichtbaar worden in plaats van te wachten op het volledige taakbudget.
- Als je system cron of een andere externe planner gebruikt om `openclaw agent` uit te voeren, wikkel die dan in een hard-kill-escalatie, ook al verwerkt de CLI `SIGTERM`/`SIGINT`. Gateway-ondersteunde uitvoeringen vragen de Gateway om geaccepteerde uitvoeringen af te breken; lokale en ingebedde fallback-uitvoeringen ontvangen hetzelfde afbreeksignaal. Geef voor GNU `timeout` de voorkeur aan `timeout -k 60 600 openclaw agent ...` boven gewone `timeout 600 ...`; de `-k`-waarde is de supervisor-backstop als het proces niet kan leegstromen. Houd voor systemd-units dezelfde vorm aan door een `SIGTERM`-stopsignaal te gebruiken plus een gratieperiode zoals `TimeoutStopSec` vóór een eventuele definitieve kill. Als een retry een `--run-id` hergebruikt terwijl de oorspronkelijke Gateway-uitvoering nog actief is, wordt het duplicaat gerapporteerd als in uitvoering in plaats van een tweede uitvoering te starten.

<a id="maintenance"></a>

<Note>
Taakverzoening voor Cron is eerst runtime-eigendom en daarna gebaseerd op duurzame geschiedenis: een actieve Cron-taak blijft live zolang de Cron-runtime die taak nog als actief bijhoudt, zelfs als er nog een oude kindsessierij bestaat. Zodra de runtime de taak niet meer bezit en het gratievenster van 5 minuten verloopt, controleert onderhoud persistente uitvoeringslogs en taakstatus voor de overeenkomende `cron:<jobId>:<startedAt>`-uitvoering. Als die duurzame geschiedenis een terminaal resultaat toont, wordt het taakjournaal daaruit afgerond; anders kan door de Gateway beheerd onderhoud de taak als `lost` markeren. Offline CLI-audit kan herstellen vanuit duurzame geschiedenis, maar behandelt zijn eigen lege actieve-taakset in het proces niet als bewijs dat een door de Gateway beheerde Cron-uitvoering verdwenen is.
</Note>

## Planningstypen

| Soort   | CLI-vlag  | Beschrijving                                            |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Eenmalig tijdstempel (ISO 8601 of relatief zoals `20m`) |
| `every` | `--every` | Vast interval                                           |
| `cron`  | `--cron`  | Cron-expressie met 5 of 6 velden met optioneel `--tz`   |

Tijdstempels zonder tijdzone worden als UTC behandeld. Voeg `--tz America/New_York` toe voor planning op lokale kloktijd.

Terugkerende expressies bovenaan het uur worden automatisch tot maximaal 5 minuten gespreid om belastingpieken te verminderen. Gebruik `--exact` om precieze timing af te dwingen of `--stagger 30s` voor een expliciet venster.

### Dag-van-de-maand en dag-van-de-week gebruiken OR-logica

Cron-expressies worden geparsed door [croner](https://github.com/Hexagon/croner). Wanneer zowel het dag-van-de-maand- als het dag-van-de-week-veld geen wildcard is, matcht croner wanneer **een van beide** velden overeenkomt — niet beide. Dit is standaard Vixie-cron-gedrag.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Dit wordt ongeveer 5-6 keer per maand geactiveerd in plaats van 0-1 keer per maand. OpenClaw gebruikt hier Croners standaard OR-gedrag. Gebruik Croners `+`-modifier voor dag-van-de-week (`0 9 15 * +1`) om beide voorwaarden te vereisen, of plan op één veld en bewaak het andere in de prompt of opdracht van je taak.

## Uitvoeringsstijlen

| Stijl           | `--session`-waarde | Draait in                  | Beste voor                              |
| --------------- | ------------------ | -------------------------- | --------------------------------------- |
| Hoofdsessie     | `main`             | Speciale Cron-wake-lane    | Herinneringen, systeemgebeurtenissen    |
| Geïsoleerd      | `isolated`         | Speciale `cron:<jobId>`    | Rapporten, achtergrondklussen           |
| Huidige sessie  | `current`          | Gebonden bij aanmaken      | Contextbewust terugkerend werk          |
| Aangepaste sessie | `session:custom-id` | Persistente benoemde sessie | Workflows die voortbouwen op geschiedenis |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    **Hoofdsessie**-taken plaatsen een systeemgebeurtenis in een Cron-eigen uitvoeringslane en wekken optioneel de Heartbeat (`--wake now` of `--wake next-heartbeat`). Ze kunnen de laatste aflevercontext van de doel-hoofdsessie gebruiken voor antwoorden, maar voegen geen routinematige Cron-turns toe aan de menselijke chatlane en verlengen de dagelijkse/inactieve resetversheid voor de doelsessie niet. **Geïsoleerde** taken draaien een speciale agent-turn met een nieuwe sessie. **Aangepaste sessies** (`session:xxx`) behouden context tussen uitvoeringen, wat workflows mogelijk maakt zoals dagelijkse stand-ups die voortbouwen op eerdere samenvattingen.

    Cron-gebeurtenissen in de hoofdsessie zijn zelfstandige systeemgebeurtenisherinneringen. Ze
    bevatten niet automatisch de instructie "Read
    HEARTBEAT.md" uit de standaard Heartbeat-prompt. Als een terugkerende herinnering
    `HEARTBEAT.md` moet raadplegen, zeg dat dan expliciet in de Cron-gebeurtenistekst of in de
    eigen instructies van de agent.

  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    Voor geïsoleerde taken betekent "nieuwe sessie" een nieuwe transcript-/sessie-id voor elke uitvoering. OpenClaw kan veilige voorkeuren meenemen, zoals thinking-/fast-/verbose-instellingen, labels en expliciet door de gebruiker geselecteerde model-/auth-overrides, maar erft geen omgevingsgesprekscontext van een oudere Cron-rij: kanaal-/groepsroutering, verzend- of wachtrijbeleid, elevatie, oorsprong of ACP-runtimebinding. Gebruik `current` of `session:<id>` wanneer een terugkerende taak bewust op dezelfde gesprekscontext moet voortbouwen.
  </Accordion>
  <Accordion title="Runtime cleanup">
    Voor geïsoleerde taken omvat runtime-afbraak nu best-effort browseropschoning voor die Cron-sessie. Opschoningsfouten worden genegeerd, zodat het daadwerkelijke Cron-resultaat nog steeds leidend is.

    Geïsoleerde Cron-uitvoeringen ruimen ook alle gebundelde MCP-runtime-instanties op die voor de taak zijn gemaakt via het gedeelde runtime-opschoningspad. Dit komt overeen met hoe MCP-clients van hoofdsessies en aangepaste sessies worden afgebroken, zodat geïsoleerde Cron-taken geen stdio-kindprocessen of langlevende MCP-verbindingen lekken tussen uitvoeringen.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    Wanneer geïsoleerde Cron-uitvoeringen subagents orkestreren, geeft aflevering ook de voorkeur aan de uiteindelijke afstammende uitvoer boven verouderde tussentijdse oudertekst. Als afstammelingen nog draaien, onderdrukt OpenClaw die gedeeltelijke ouderupdate in plaats van deze aan te kondigen.

    Voor tekst-only Discord-aankondigingsdoelen verzendt OpenClaw de canonieke uiteindelijke assistenttekst één keer in plaats van zowel gestreamde/tussentijdse tekstpayloads als het uiteindelijke antwoord opnieuw af te spelen. Media en gestructureerde Discord-payloads worden nog steeds als afzonderlijke payloads afgeleverd, zodat bijlagen en componenten niet worden weggelaten.

  </Accordion>
</AccordionGroup>

### Opdrachtpayloads

Gebruik opdrachtpayloads voor deterministische scripts die binnen de Gateway-planner moeten draaien zonder een model-ondersteunde geïsoleerde agent-turn te starten. Opdrachttaken worden uitgevoerd op de Gateway-host, leggen stdout/stderr vast, registreren de uitvoering in de Cron-geschiedenis en hergebruiken dezelfde aflevermodi `announce`, `webhook` en `none` als geïsoleerde taken.

<Note>
Command-Cron is een operator-admin Gateway-automatiseringsoppervlak, geen agent-
`tools.exec`-aanroep. Het aanmaken, bijwerken, verwijderen of handmatig uitvoeren van Cron-taken
vereist `operator.admin`; geplande command-uitvoeringen draaien later binnen het
Gateway-proces als die door een admin geschreven automatisering. Agent-execbeleid zoals
`tools.exec.mode`, goedkeuringsprompts en per-agent tool-allowlists beheert
model-zichtbare exec-tools, niet command-Cron-payloads.
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

`--command <shell>` slaat `argv: ["sh", "-lc", <shell>]` op. Gebruik `--command-argv '["node","scripts/report.mjs"]'` wanneer je exacte argv-uitvoering zonder shell-parsing wilt. Optionele velden `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds` en `--output-max-bytes` regelen de procesomgeving, stdin en uitvoerlimieten.

Als stdout niet leeg is, is die tekst het geleverde resultaat. Als stdout leeg is en stderr niet leeg is, wordt stderr geleverd. Als beide streams aanwezig zijn, levert cron een klein `stdout:`- / `stderr:`-blok. Een exitcode nul registreert de run als `ok`; een niet-nul exit, signaal, timeout of geen-uitvoer-timeout registreert `error` en kan foutmeldingen activeren. Een opdracht die alleen `NO_REPLY` afdrukt, gebruikt de normale stille-tokenonderdrukking van cron en plaatst niets terug in de chat.

### Payloadopties voor geïsoleerde taken

<ParamField path="--message" type="string" required>
  Prompttekst (vereist voor geïsoleerd).
</ParamField>
<ParamField path="--model" type="string">
  Modeloverride; gebruikt het geselecteerde toegestane model voor de taak.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Fallbackmodellenlijst per taak, bijvoorbeeld `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Geef `--fallbacks ""` door voor een strikte run zonder fallbacks.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  Verwijdert bij `cron edit` de fallbackoverride per taak, zodat de taak de geconfigureerde fallbackprioriteit volgt. Kan niet worden gecombineerd met `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  Verwijdert bij `cron edit` de modeloverride per taak, zodat de taak de normale modelselectieprioriteit van cron volgt (een opgeslagen cron-sessieoverride als die is ingesteld, anders het agent-/standaardmodel). Kan niet worden gecombineerd met `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Override voor het thinking-niveau.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  Verwijdert bij `cron edit` de thinking-override per taak, zodat de taak de normale thinking-prioriteit van cron volgt. Kan niet worden gecombineerd met `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Sla injectie van workspace-bootstrapbestanden over.
</ParamField>
<ParamField path="--tools" type="string">
  Beperk welke tools de taak kan gebruiken, bijvoorbeeld `--tools exec,read`.
</ParamField>

`--model` gebruikt het geselecteerde toegestane model als primair model van die taak. Dit is niet hetzelfde als een `/model`-override voor een chatsessie: geconfigureerde fallbackketens blijven van toepassing wanneer het primaire model van de taak faalt. Als het aangevraagde model niet is toegestaan of niet kan worden opgelost, laat cron de run mislukken met een expliciete validatiefout in plaats van stil terug te vallen op de agent-/standaardmodelselectie van de taak.

Cron-taken kunnen ook `fallbacks` op payloadniveau bevatten. Wanneer aanwezig, vervangt die lijst de geconfigureerde fallbackketen voor de taak. Gebruik `fallbacks: []` in de taakpayload/API wanneer je een strikte cron-run wilt die alleen het geselecteerde model probeert. Als een taak `--model` heeft maar geen payload- of geconfigureerde fallbacks, geeft OpenClaw een expliciete lege fallbackoverride door, zodat het primaire agentmodel niet wordt toegevoegd als verborgen extra herhaaldoel.

Preflightcontroles voor lokale providers doorlopen geconfigureerde fallbacks voordat een cron-run als `skipped` wordt gemarkeerd; `fallbacks: []` houdt dat preflightpad strikt.

De modelselectieprioriteit voor geïsoleerde taken is:

1. Gmail-hookmodeloverride (wanneer de run uit Gmail kwam en die override is toegestaan)
2. `model` op taakpayloadniveau
3. Door de gebruiker geselecteerde opgeslagen cron-sessiemodeloverride
4. Agent-/standaardmodelselectie

Fast mode volgt ook de opgeloste live selectie. Als de geselecteerde modelconfiguratie `params.fastMode` heeft, gebruikt geïsoleerde cron dat standaard. Een opgeslagen sessieoverride voor `fastMode` wint nog steeds in beide richtingen van de configuratie. Automatische modus gebruikt de `params.fastAutoOnSeconds`-grens van het geselecteerde model wanneer die aanwezig is, met 60 seconden als standaard.

Als een geïsoleerde run een live model-switchhandoff raakt, probeert cron het opnieuw met de overgeschakelde provider/het overgeschakelde model en bewaart die live selectie voor de actieve run voordat opnieuw wordt geprobeerd. Wanneer de switch ook een nieuw authprofiel bevat, bewaart cron die authprofieloverride ook voor de actieve run. Herhalingen zijn begrensd: na de eerste poging plus 2 switchherhalingen breekt cron af in plaats van eindeloos te blijven lussen.

Voordat een geïsoleerde cron-run de agentrunner binnengaat, controleert OpenClaw bereikbare lokale providerendpoints voor geconfigureerde `api: "ollama"`- en `api: "openai-completions"`-providers waarvan `baseUrl` local loopback, privénetwerk of `.local` is. Als dat endpoint niet beschikbaar is, wordt de run geregistreerd als `skipped` met een duidelijke provider-/modelfout in plaats van een modelaanroep te starten. Het endpointresultaat wordt 5 minuten gecachet, zodat veel vervallen taken die dezelfde defecte lokale Ollama-, vLLM-, SGLang- of LM Studio-server gebruiken één kleine probe delen in plaats van een verzoekenstorm te veroorzaken. Overgeslagen provider-preflightruns verhogen de backoff voor uitvoeringsfouten niet; schakel `failureAlert.includeSkipped` in wanneer je herhaalde skipmeldingen wilt.

## Levering en uitvoer

| Modus      | Wat er gebeurt                                                       |
| ---------- | -------------------------------------------------------------------- |
| `announce` | Levert de eindtekst via fallback aan het doel als de agent niets zond |
| `webhook`  | POST de payload van de voltooide gebeurtenis naar een URL             |
| `none`     | Geen fallbacklevering door de runner                                  |

Gebruik `--announce --channel telegram --to "-1001234567890"` voor kanaallevering. Gebruik voor Telegram-forumonderwerpen `-1001234567890:topic:123`; OpenClaw accepteert ook de Telegram-eigen verkorte vorm `-1001234567890:123`. Directe RPC-/configaanroepers kunnen `delivery.threadId` als string of getal doorgeven. Slack-/Discord-/Mattermost-doelen moeten expliciete prefixen gebruiken (`channel:<id>`, `user:<id>`). Matrix-ruimte-ID's zijn hoofdlettergevoelig; gebruik de exacte ruimte-ID of de vorm `room:!room:server` van Matrix.

Wanneer announcelevering `channel: "last"` gebruikt of `channel` weglaat, kan een providergeprefixt doel zoals `telegram:123` het kanaal selecteren voordat cron terugvalt op sessiegeschiedenis of één geconfigureerd kanaal. Alleen prefixen die door de geladen Plugin worden geadverteerd, zijn providerselectors. Als `delivery.channel` expliciet is, moet de doelprefix dezelfde provider noemen; bijvoorbeeld `channel: "whatsapp"` met `to: "telegram:123"` wordt geweigerd in plaats van WhatsApp de Telegram-ID als telefoonnummer te laten interpreteren. Doelsoort- en serviceprefixen zoals `channel:<id>`, `user:<id>`, `imessage:<handle>` en `sms:<number>` blijven kanaaleigen doelsyntaxis, geen providerselectors.

Voor geïsoleerde taken wordt chatlevering gedeeld. Als een chatroute beschikbaar is, kan de agent de `message`-tool gebruiken, zelfs wanneer de taak `--no-deliver` gebruikt. Als de agent naar het geconfigureerde/huidige doel verzendt, slaat OpenClaw de fallback-announce over. Anders bepalen `announce`, `webhook` en `none` alleen wat de runner met het uiteindelijke antwoord doet na de agentbeurt.

Wanneer een agent een geïsoleerde herinnering maakt vanuit een actieve chat, slaat OpenClaw het bewaarde live leveringsdoel op voor de fallback-announceroute. Interne sessiesleutels kunnen kleine letters gebruiken; providerleveringsdoelen worden niet uit die sleutels gereconstrueerd wanneer de huidige chatcontext beschikbaar is.

Impliciete announcelevering gebruikt geconfigureerde kanaal-allowlists om verouderde doelen te valideren en om te leiden. Goedkeuringen uit de DM-pairingstore zijn geen ontvangers voor fallbackautomatisering; stel `delivery.to` in of configureer de kanaalvermelding `allowFrom` wanneer een geplande taak proactief naar een DM moet verzenden.

## Uitvoertaal

Cron-taken leiden geen antwoordtaal af uit kanaal, locale of vorige
berichten. Zet de taalregel in het geplande bericht of sjabloon:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Voor sjabloonbestanden houd je de taalinstructie in de gerenderde prompt en
controleer je of placeholders zoals `{{language}}` zijn ingevuld voordat de taak wordt uitgevoerd. Als
de uitvoer talen mengt, maak de regel dan expliciet, bijvoorbeeld: "Gebruik Chinees
voor verhalende tekst en houd technische termen in het Engels."

Foutmeldingen volgen een afzonderlijk bestemmingspad:

- `cron.failureDestination` stelt een globale standaard in voor foutmeldingen.
- `job.delivery.failureDestination` overschrijft dat per taak.
- Als geen van beide is ingesteld en de taak al via `announce` levert, vallen foutmeldingen nu terug op dat primaire announcedoel.
- `delivery.failureDestination` wordt alleen ondersteund op taken met `sessionTarget="isolated"`, tenzij de primaire leveringsmodus `webhook` is.
- `failureAlert.includeSkipped: true` laat een taak of globaal cron-waarschuwingsbeleid herhaalde waarschuwingen voor overgeslagen runs sturen. Overgeslagen runs houden een afzonderlijke teller voor opeenvolgende skips bij, zodat ze geen invloed hebben op de backoff voor uitvoeringsfouten.

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

Gateway kan HTTP-Webhookendpoints blootstellen voor externe triggers. Schakel dit in de configuratie in:

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
  <Accordion title="Gekoppelde hooks (POST /hooks/<name>)">
    Aangepaste hooknamen worden opgelost via `hooks.mappings` in de configuratie. Koppelingen kunnen willekeurige payloads omzetten in `wake`- of `agent`-acties met sjablonen of codetransformaties.
  </Accordion>
</AccordionGroup>

<Warning>
Houd hookendpoints achter local loopback, tailnet of een vertrouwde reverse proxy.

- Gebruik een toegewezen hook-token; hergebruik geen gateway-authenticatietokens.
- Houd `hooks.path` op een toegewezen subpad; `/` wordt geweigerd.
- Stel `hooks.allowedAgentIds` in om te beperken op welke effectieve agent een hook zich kan richten, inclusief de standaardagent wanneer `agentId` is weggelaten.
- Houd `hooks.allowRequestSessionKey=false`, tenzij je door de aanroeper gekozen sessies nodig hebt.
- Als je `hooks.allowRequestSessionKey` inschakelt, stel dan ook `hooks.allowedSessionKeyPrefixes` in om toegestane vormen van sessiesleutels te beperken.
- Hook-payloads worden standaard met veiligheidsgrenzen ingepakt.

</Warning>

## Gmail PubSub-integratie

Verbind Gmail-inboxtriggers met OpenClaw via Google PubSub.

<Note>
**Vereisten:** `gcloud` CLI, `gog` (gogcli), OpenClaw-hooks ingeschakeld, Tailscale voor het openbare HTTPS-eindpunt.
</Note>

### Wizard-installatie (aanbevolen)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Dit schrijft de `hooks.gmail`-configuratie, schakelt de Gmail-preset in en gebruikt Tailscale Funnel voor het push-eindpunt.

### Gateway automatisch starten

Wanneer `hooks.enabled=true` en `hooks.gmail.account` is ingesteld, start de Gateway bij het opstarten `gog gmail watch serve` en vernieuwt de watch automatisch. Stel `OPENCLAW_SKIP_GMAIL_WATCHER=1` in om je af te melden.

### Handmatige eenmalige installatie

<Steps>
  <Step title="Selecteer het GCP-project">
    Selecteer het GCP-project dat eigenaar is van de OAuth-client die door `gog` wordt gebruikt:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Maak een topic aan en verleen Gmail-pushtoegang">
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

## Jobs beheren

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

`openclaw cron run <jobId>` keert terug nadat de handmatige run in de wachtrij is geplaatst. Gebruik `--wait` voor shutdown-hooks, onderhoudsscripts of andere automatisering die moet blokkeren totdat de run in de wachtrij is voltooid. Wachtmodus pollt de exact teruggegeven `runId`; deze sluit af met `0` voor status `ok` en met niet-nul voor `error`, `skipped` of een wachttime-out.

De agenttool `cron` retourneert compacte jobsamenvattingen (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) uit `cron(action: "list")`; gebruik `cron(action: "get", jobId: "...")` voor één volledige jobdefinitie. Directe Gateway-aanroepers kunnen `compact: true` doorgeven aan `cron.list`; als dit wordt weggelaten, blijft de bestaande volledige respons met bezorgvoorbeelden behouden.

`openclaw cron create` is een alias voor `openclaw cron add`, en nieuwe jobs kunnen een positioneel schema gebruiken (`"0 9 * * 1"`, `"every 1h"`, `"20m"` of een ISO-tijdstempel), gevolgd door een positionele agentprompt. Gebruik `--webhook <url>` op `cron add|create` of `cron edit` om de payload van de voltooide run met POST naar een HTTP-eindpunt te sturen. Webhook-bezorging kan niet worden gecombineerd met chatbezorgingsvlaggen zoals `--announce`, `--channel`, `--to`, `--thread-id` of `--account`. Bij `cron edit` maken `--clear-channel`, `--clear-to`, `--clear-thread-id` en `--clear-account` deze routeringsvelden afzonderlijk leeg (elk wordt geweigerd naast de bijbehorende instelvlag), wat verschilt van `--no-deliver`, dat fallback-bezorging door de runner uitschakelt.

<Note>
Opmerking over modeloverschrijving:

- `openclaw cron add|edit --model ...` wijzigt het geselecteerde model van de job.
- Als het model is toegestaan, bereikt die exacte provider/model de geïsoleerde agentrun.
- Als het niet is toegestaan of niet kan worden opgelost, laat Cron de run mislukken met een expliciete validatiefout.
- API-payloadpatches voor `cron.update` kunnen `model: null` instellen om een opgeslagen modeloverschrijving voor een job te wissen.
- `openclaw cron edit <job-id> --clear-model` wist die overschrijving vanuit de CLI (hetzelfde effect als de patch `model: null`) en kan niet worden gecombineerd met `--model`.
- Geconfigureerde fallback-ketens blijven van toepassing omdat Cron `--model` een primaire jobinstelling is, geen `/model`-overschrijving voor de sessie.
- `openclaw cron add|edit --fallbacks ...` stelt payload `fallbacks` in, waarbij geconfigureerde fallbacks voor die job worden vervangen; `--fallbacks ""` schakelt fallback uit en maakt de run strikt. `openclaw cron edit <job-id> --clear-fallbacks` wist de overschrijving per job.
- Een gewone `--model` zonder expliciete of geconfigureerde fallbacklijst valt niet terug op de primaire agent als stil extra doel voor een nieuwe poging.

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

`maxConcurrentRuns` beperkt zowel geplande Cron-dispatch als uitvoering van geïsoleerde agentbeurten, en staat standaard op 8. Geïsoleerde Cron-agentbeurten gebruiken intern de toegewezen `cron-nested`-uitvoeringslane van de wachtrij, dus als je deze waarde verhoogt, kunnen onafhankelijke Cron-LLM-runs parallel voortgang boeken in plaats van alleen hun buitenste Cron-wrappers te starten. De gedeelde niet-Cron-`nested`-lane wordt door deze instelling niet verbreed.

`cron.store` is een logische opslagsleutel en een legacy-importpad voor doctor. Voer `openclaw doctor --fix` uit om bestaande JSON-opslagen in SQLite te importeren en te archiveren; toekomstige Cron-wijzigingen moeten via de CLI of Gateway-API verlopen.

Cron uitschakelen: `cron.enabled: false` of `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Gedrag bij opnieuw proberen">
    **Eenmalige retry**: tijdelijke fouten (snelheidslimiet, overbelasting, netwerk, serverfout) worden tot 3 keer opnieuw geprobeerd met exponentiële backoff. Permanente fouten schakelen direct uit.

    **Terugkerende retry**: exponentiële backoff (30s tot 60m) tussen pogingen. Backoff wordt opnieuw ingesteld na de volgende succesvolle run.

  </Accordion>
  <Accordion title="Onderhoud">
    `cron.sessionRetention` (standaard `24h`) ruimt geïsoleerde run-sessie-items op. `cron.runLog.keepLines` beperkt het aantal bewaarde SQLite-runhistorierijen per job; `maxBytes` wordt behouden voor configuratiecompatibiliteit met oudere bestandsgebaseerde runlogs.
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
    - Controleer voor `cron`-schema's de tijdzone (`--tz`) tegenover de tijdzone van de host.
    - `reason: not-due` in runuitvoer betekent dat een handmatige run is gecontroleerd met `openclaw cron run <jobId> --due` en dat de job nog niet aan de beurt was.

  </Accordion>
  <Accordion title="Cron is uitgevoerd maar er is geen bezorging">
    - Bezorgmodus `none` betekent dat er geen fallback-verzending door de runner wordt verwacht. De agent kan nog steeds direct verzenden met de tool `message` wanneer er een chatroute beschikbaar is.
    - Ontbrekend/ongeldig bezorgdoel (`channel`/`to`) betekent dat uitgaand is overgeslagen.
    - Voor Matrix kunnen gekopieerde of legacy-jobs met kleine-letter-`delivery.to`-ruimte-ID's mislukken omdat Matrix-ruimte-ID's hoofdlettergevoelig zijn. Bewerk de job naar de exacte waarde `!room:server` of `room:!room:server` uit Matrix.
    - Kanaalauthenticatiefouten (`unauthorized`, `Forbidden`) betekenen dat bezorging door referenties is geblokkeerd.
    - Als de geïsoleerde run alleen het stille token (`NO_REPLY` / `no_reply`) retourneert, onderdrukt OpenClaw directe uitgaande bezorging en ook het fallbackpad voor de samenvatting in de wachtrij, zodat er niets terug naar de chat wordt geplaatst.
    - Als de agent zelf een bericht naar de gebruiker moet sturen, controleer dan of de job een bruikbare route heeft (`channel: "last"` met een eerdere chat, of een expliciet kanaal/doel).

  </Accordion>
  <Accordion title="Cron of Heartbeat lijkt rollover in /new-stijl te voorkomen">
    - Versheid voor dagelijkse en inactieve reset is niet gebaseerd op `updatedAt`; zie [Sessiebeheer](/nl/concepts/session#session-lifecycle).
    - Cron-wakeups, Heartbeat-runs, exec-meldingen en Gateway-boekhouding kunnen de sessierij bijwerken voor routering/status, maar ze verlengen `sessionStartedAt` of `lastInteractionAt` niet.
    - Voor legacy-rijen die zijn aangemaakt voordat die velden bestonden, kan OpenClaw `sessionStartedAt` herstellen uit de JSONL-sessieheader van het transcript wanneer het bestand nog beschikbaar is. Legacy-inactieve rijen zonder `lastInteractionAt` gebruiken die herstelde starttijd als hun inactiviteitsbasislijn.

  </Accordion>
  <Accordion title="Aandachtspunten voor tijdzones">
    - Cron zonder `--tz` gebruikt de tijdzone van de Gateway-host.
    - `at`-schema's zonder tijdzone worden behandeld als UTC.
    - Heartbeat `activeHours` gebruikt geconfigureerde tijdzoneoplossing.

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Automatisering](/nl/automation) — alle automatiseringsmechanismen in één overzicht
- [Achtergrondtaken](/nl/automation/tasks) — taaklogboek voor Cron-uitvoeringen
- [Heartbeat](/nl/gateway/heartbeat) — periodieke beurten in de hoofdsessie
- [Tijdzone](/nl/concepts/timezone) — tijdzoneconfiguratie
