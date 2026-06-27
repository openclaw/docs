---
read_when:
    - Achtergrondtaken of wekmomenten plannen
    - Externe triggers (Webhooks, Gmail) koppelen aan OpenClaw
    - Kiezen tussen Heartbeat en Cron voor geplande taken
sidebarTitle: Scheduled tasks
summary: Geplande taken, Webhooks en Gmail PubSub-triggers voor de Gateway-planner
title: Geplande taken
x-i18n:
    generated_at: "2026-06-27T17:09:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97097c9809afea699caa0c60d2ab5b71cd3794f90d9e002d35d25e76ca40d63c
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron is de ingebouwde planner van de Gateway. Deze bewaart taken, wekt de agent op het juiste moment en kan uitvoer terugsturen naar een chatkanaal of webhook-eindpunt.

## Snel aan de slag

<Steps>
  <Step title="Voeg een eenmalige herinnering toe">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Controleer je taken">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
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
- Taakdefinities, runtimestatus en uitvoeringsgeschiedenis blijven bewaard in OpenClaw's gedeelde SQLite-statusdatabase, zodat planningen niet verloren gaan bij herstarts.
- Voer bij een upgrade `openclaw doctor --fix` uit om legacy `~/.openclaw/cron/jobs.json`-, `jobs-state.json`- en `runs/*.jsonl`-bestanden in SQLite te importeren en ze te hernoemen met een `.migrated`-achtervoegsel. Ongeldige taakrijen worden in de runtime overgeslagen en gekopieerd naar `jobs-quarantine.json` voor latere reparatie of beoordeling.
- `cron.store` benoemt nog steeds de logische Cron-opslagsleutel en het importpad voor doctor. Na import wijzigt het bewerken van dat JSON-bestand actieve Cron-taken niet meer; gebruik in plaats daarvan `openclaw cron add|edit|remove` of de Cron-RPC-methoden van de Gateway.
- Alle Cron-uitvoeringen maken records voor [achtergrondtaak](/nl/automation/tasks) aan.
- Bij het opstarten van de Gateway worden achterstallige geïsoleerde agentbeurt-taken buiten het kanaalverbindingsvenster opnieuw gepland in plaats van direct opnieuw afgespeeld, zodat het opstarten van Discord/Telegram en de instelling van native opdrachten na herstarts responsief blijven.
- Eenmalige taken (`--at`) worden standaard automatisch verwijderd na succes.
- Geïsoleerde Cron-uitvoeringen sluiten naar beste vermogen bijgehouden browsertabbladen/processen voor hun `cron:<jobId>`-sessie wanneer de uitvoering voltooid is, zodat losgekoppelde browserautomatisering geen verweesde processen achterlaat.
- Geïsoleerde Cron-uitvoeringen die de beperkte Cron-zelfopschoningsmachtiging ontvangen, kunnen nog steeds de plannerstatus, een op zichzelf gefilterde lijst van hun huidige taak en de uitvoeringsgeschiedenis van die taak lezen, zodat status-/heartbeatcontroles hun eigen planning kunnen inspecteren zonder bredere toegang voor Cron-mutaties te krijgen.
- Geïsoleerde Cron-uitvoeringen beschermen ook tegen verouderde bevestigingsantwoorden. Als het eerste resultaat slechts een tussentijdse statusupdate is (`on it`, `pulling everything together` en vergelijkbare hints) en er geen afgeleide subagent-uitvoering nog verantwoordelijk is voor het eindantwoord, vraagt OpenClaw eenmaal opnieuw om het daadwerkelijke resultaat voordat het wordt afgeleverd.
- Geïsoleerde Cron-uitvoeringen gebruiken gestructureerde metadata over uitvoeringsweigering uit de ingesloten uitvoering, inclusief node-host-`UNAVAILABLE`-wrappers waarvan de geneste foutmelding begint met `SYSTEM_RUN_DENIED` of `INVALID_REQUEST`, zodat een geblokkeerde opdracht niet als een groene uitvoering wordt gerapporteerd terwijl gewone assistentproza niet als weigering wordt behandeld.
- Geïsoleerde Cron-uitvoeringen behandelen fouten op uitvoeringsniveau van agents ook als taakfouten, zelfs wanneer er geen antwoordpayload wordt geproduceerd, zodat model-/providerfouten fouttellers verhogen en foutmeldingen activeren in plaats van de taak als succesvol af te handelen.
- Wanneer een geïsoleerde agentbeurt-taak `timeoutSeconds` bereikt, breekt Cron de onderliggende agentuitvoering af en geeft deze een kort opschoningsvenster. Als de uitvoering niet leegloopt, wist Gateway-beheerde opschoning het sessie-eigenaarschap van die uitvoering geforceerd voordat Cron de time-out registreert, zodat in de wachtrij staand chatwerk niet achter een verouderde verwerkingssessie blijft hangen.
- Als een geïsoleerde agentbeurt vastloopt voordat de runner start of vóór de eerste modelaanroep, registreert Cron een fasespecifieke time-out zoals `setup timed out before runner start` of `stalled before first model call (last phase: context-engine)`. Deze watchdogs dekken ingesloten providers en CLI-ondersteunde providers voordat hun externe CLI-proces daadwerkelijk is gestart, en worden onafhankelijk begrensd van lange `timeoutSeconds`-waarden zodat cold-start-/auth-/contextfouten snel zichtbaar worden in plaats van te wachten op het volledige taakbudget.
- Als je systeem-Cron of een andere externe planner gebruikt om `openclaw agent` uit te voeren, wikkel dit dan in een hard-kill-escalatie, ook al verwerkt de CLI `SIGTERM`/`SIGINT`. Gateway-ondersteunde uitvoeringen vragen de Gateway om geaccepteerde uitvoeringen af te breken; lokale en ingesloten fallback-uitvoeringen ontvangen hetzelfde afbreeksignaal. Voor GNU `timeout` heeft `timeout -k 60 600 openclaw agent ...` de voorkeur boven gewoon `timeout 600 ...`; de `-k`-waarde is de supervisor-backstop als het proces niet kan leeglopen. Houd voor systemd-units dezelfde vorm aan door een `SIGTERM`-stopsignaal plus een respijtvenster zoals `TimeoutStopSec` te gebruiken vóór een eventuele laatste kill. Als een retry een `--run-id` hergebruikt terwijl de oorspronkelijke Gateway-uitvoering nog actief is, wordt het duplicaat gerapporteerd als in uitvoering in plaats van een tweede uitvoering te starten.

<a id="maintenance"></a>

<Note>
Taakreconciliatie voor Cron is eerst runtime-eigendom en daarna gebaseerd op duurzame geschiedenis: een actieve Cron-taak blijft live zolang de Cron-runtime die taak nog als actief bijhoudt, zelfs als er nog een oude onderliggende sessierij bestaat. Zodra de runtime de taak niet meer bezit en het respijtvenster van 5 minuten verloopt, controleren onderhoudscontroles blijvende uitvoeringslogs en taakstatus voor de overeenkomende `cron:<jobId>:<startedAt>`-uitvoering. Als die duurzame geschiedenis een terminaal resultaat toont, wordt het taakgrootboek daaruit afgerond; anders kan Gateway-beheerd onderhoud de taak als `lost` markeren. Offline CLI-audit kan herstellen vanuit duurzame geschiedenis, maar behandelt zijn eigen lege set actieve taken in het proces niet als bewijs dat een Gateway-beheerde Cron-uitvoering verdwenen is.
</Note>

## Planningstypen

| Soort   | CLI-vlag  | Beschrijving                                             |
| ------- | --------- | -------------------------------------------------------- |
| `at`    | `--at`    | Eenmalige timestamp (ISO 8601 of relatief zoals `20m`)   |
| `every` | `--every` | Vast interval                                            |
| `cron`  | `--cron`  | Cron-expressie met 5 of 6 velden met optioneel `--tz`    |

Timestamps zonder tijdzone worden als UTC behandeld. Voeg `--tz America/New_York` toe voor planning op lokale kloktijd.

Terugkerende expressies op het hele uur worden automatisch tot 5 minuten gespreid om piekbelasting te verminderen. Gebruik `--exact` om precieze timing af te dwingen of `--stagger 30s` voor een expliciet venster.

### Dag-van-de-maand en dag-van-de-week gebruiken OF-logica

Cron-expressies worden geparseerd door [croner](https://github.com/Hexagon/croner). Wanneer zowel het dag-van-de-maand- als het dag-van-de-weekveld geen wildcard is, matcht croner wanneer **een van beide** velden matcht, niet beide. Dit is standaard Vixie-cron-gedrag.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Dit wordt ~5-6 keer per maand uitgevoerd in plaats van 0-1 keer per maand. OpenClaw gebruikt hier Croners standaard OF-gedrag. Gebruik Croners `+`-modifier voor dag-van-de-week (`0 9 15 * +1`) om beide voorwaarden te vereisen, of plan op één veld en bewaak het andere in de prompt of opdracht van je taak.

## Uitvoeringsstijlen

| Stijl           | `--session`-waarde | Draait in                | Het meest geschikt voor                  |
| --------------- | ------------------ | ------------------------ | ---------------------------------------- |
| Hoofdsessie     | `main`             | Toegewezen Cron-wake-lane | Herinneringen, systeemgebeurtenissen     |
| Geïsoleerd      | `isolated`         | Toegewezen `cron:<jobId>` | Rapporten, achtergrondtaken              |
| Huidige sessie  | `current`          | Gebonden bij aanmaak      | Contextbewust terugkerend werk           |
| Aangepaste sessie | `session:custom-id` | Blijvende benoemde sessie | Workflows die op geschiedenis voortbouwen |

<AccordionGroup>
  <Accordion title="Hoofdsessie versus geïsoleerd versus aangepast">
    **Hoofdsessie**-taken plaatsen een systeemgebeurtenis in een Cron-beheerde uitvoeringslane en wekken optioneel de Heartbeat (`--wake now` of `--wake next-heartbeat`). Ze kunnen de laatste leveringscontext van de doelhoofdsessie gebruiken voor antwoorden, maar ze voegen geen routinematige Cron-beurten toe aan de menselijke chatlane en verlengen de dagelijkse/inactieve resetversheid voor de doelsessie niet. **Geïsoleerde** taken voeren een toegewezen agentbeurt uit met een verse sessie. **Aangepaste sessies** (`session:xxx`) behouden context tussen uitvoeringen, waardoor workflows zoals dagelijkse stand-ups mogelijk worden die voortbouwen op eerdere samenvattingen.

    Cron-gebeurtenissen voor hoofdsessies zijn zelfstandige systeemgebeurtenisherinneringen. Ze bevatten niet automatisch de instructie "Read HEARTBEAT.md" uit de standaard Heartbeat-prompt. Als een terugkerende herinnering `HEARTBEAT.md` moet raadplegen, zeg dat dan expliciet in de tekst van de Cron-gebeurtenis of in de eigen instructies van de agent.

  </Accordion>
  <Accordion title="Wat 'verse sessie' betekent voor geïsoleerde taken">
    Voor geïsoleerde taken betekent "verse sessie" een nieuwe transcript-/sessie-id voor elke uitvoering. OpenClaw kan veilige voorkeuren meenemen, zoals instellingen voor thinking/fast/verbose, labels en expliciete door de gebruiker geselecteerde model-/auth-overschrijvingen, maar erft geen omgevingsgesprekscontext van een oudere Cron-rij: kanaal-/groepsrouting, verzend- of wachtrijbeleid, elevatie, oorsprong of ACP-runtimebinding. Gebruik `current` of `session:<id>` wanneer een terugkerende taak bewust op dezelfde gesprekscontext moet voortbouwen.
  </Accordion>
  <Accordion title="Runtime-opschoning">
    Voor geïsoleerde taken omvat runtime-afbouw nu best-effort browseropschoning voor die Cron-sessie. Opschoningsfouten worden genegeerd zodat het daadwerkelijke Cron-resultaat nog steeds wint.

    Geïsoleerde Cron-uitvoeringen verwijderen ook alle gebundelde MCP-runtime-instanties die voor de taak zijn aangemaakt via het gedeelde runtime-opschoningspad. Dit komt overeen met hoe MCP-clients voor hoofdsessies en aangepaste sessies worden afgebouwd, zodat geïsoleerde Cron-taken geen stdio-childprocessen of langlevende MCP-verbindingen tussen uitvoeringen lekken.

  </Accordion>
  <Accordion title="Subagent- en Discord-levering">
    Wanneer geïsoleerde Cron-uitvoeringen subagents orkestreren, geeft levering ook de voorkeur aan de uiteindelijke uitvoer van de afstammeling boven verouderde tussentijdse oudertekst. Als afstammelingen nog actief zijn, onderdrukt OpenClaw die gedeeltelijke ouderupdate in plaats van deze aan te kondigen.

    Voor alleen-tekst Discord-aankondigingsdoelen verzendt OpenClaw de canonieke uiteindelijke assistenttekst eenmaal in plaats van zowel gestreamde/tussentijdse tekstpayloads als het eindantwoord opnieuw af te spelen. Media en gestructureerde Discord-payloads worden nog steeds als afzonderlijke payloads geleverd, zodat bijlagen en componenten niet worden weggegooid.

  </Accordion>
</AccordionGroup>

### Opdrachtpayloads

Gebruik opdrachtpayloads voor deterministische scripts die binnen de Gateway-planner moeten draaien zonder een modelondersteunde geïsoleerde agentbeurt te starten. Opdrachttaken worden uitgevoerd op de Gateway-host, leggen stdout/stderr vast, registreren de uitvoering in de Cron-geschiedenis en hergebruiken dezelfde leveringsmodi `announce`, `webhook` en `none` als geïsoleerde taken.

<Note>
Command cron is een Gateway-automatiseringsoppervlak voor operatorbeheerders, geen agent-`tools.exec`-aanroep. Het aanmaken, bijwerken, verwijderen of handmatig uitvoeren van Cron-taken vereist `operator.admin`; geplande command-uitvoeringen worden later binnen het Gateway-proces uitgevoerd als die door een beheerder aangemaakte automatisering. Agent-execbeleid zoals `tools.exec.mode`, goedkeuringsprompts en per-agent tool-allowlists beheersen modelzichtbare exec-tools, niet command cron-payloads.
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

`--command <shell>` slaat `argv: ["sh", "-lc", <shell>]` op. Gebruik `--command-argv '["node","scripts/report.mjs"]'` wanneer je exacte argv-uitvoering zonder shell-parsing wilt. Optionele velden `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds` en `--output-max-bytes` bepalen de procesomgeving, stdin en uitvoergrenzen.

Als stdout niet leeg is, is die tekst het geleverde resultaat. Als stdout leeg is en stderr niet leeg is, wordt stderr geleverd. Als beide streams aanwezig zijn, levert cron een klein `stdout:`- / `stderr:`-blok. Een afsluitcode nul registreert de run als `ok`; een niet-nul afsluitcode, signaal, timeout of timeout zonder output registreert `error` en kan foutmeldingen activeren. Een opdracht die alleen `NO_REPLY` afdrukt, gebruikt de normale onderdrukking via het stille token van cron en plaatst niets terug in de chat.

### Payloadopties voor geïsoleerde jobs

<ParamField path="--message" type="string" required>
  Prompttekst (vereist voor geïsoleerd).
</ParamField>
<ParamField path="--model" type="string">
  Modeloverschrijving; gebruikt het geselecteerde toegestane model voor de job.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Fallbackmodellijst per job, bijvoorbeeld `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Geef `--fallbacks ""` door voor een strikte run zonder fallbacks.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  Bij `cron edit` verwijdert dit de fallbackoverschrijving per job, zodat de job de geconfigureerde fallbackprioriteit volgt. Kan niet worden gecombineerd met `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  Bij `cron edit` verwijdert dit de modeloverschrijving per job, zodat de job de normale modelselectieprioriteit van cron volgt (een opgeslagen overschrijving voor de cron-sessie als die is ingesteld, anders het agent-/standaardmodel). Kan niet worden gecombineerd met `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Overschrijving van het denkniveau.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Sla injectie van workspace-bootstrapbestanden over.
</ParamField>
<ParamField path="--tools" type="string">
  Beperk welke tools de job kan gebruiken, bijvoorbeeld `--tools exec,read`.
</ParamField>

`--model` gebruikt het geselecteerde toegestane model als primair model voor die job. Dit is niet hetzelfde als een `/model`-overschrijving voor een chatsessie: geconfigureerde fallbackketens blijven van toepassing wanneer het primaire jobmodel faalt. Als het aangevraagde model niet is toegestaan of niet kan worden resolved, laat cron de run mislukken met een expliciete validatiefout in plaats van stilzwijgend terug te vallen op de agent-/standaardmodelselectie van de job.

Cron-jobs kunnen ook `fallbacks` op payloadniveau bevatten. Wanneer die aanwezig zijn, vervangt die lijst de geconfigureerde fallbackketen voor de job. Gebruik `fallbacks: []` in de jobpayload/API wanneer je een strikte cron-run wilt die alleen het geselecteerde model probeert. Als een job `--model` heeft maar geen fallbacks in de payload of configuratie, geeft OpenClaw een expliciete lege fallbackoverschrijving door, zodat de primaire agent niet als verborgen extra retrydoel wordt toegevoegd.

Preflightcontroles voor lokale providers doorlopen geconfigureerde fallbacks voordat een cron-run als `skipped` wordt gemarkeerd; `fallbacks: []` houdt dat preflightpad strikt.

De modelselectieprioriteit voor geïsoleerde jobs is:

1. Modeloverschrijving van de Gmail-hook (wanneer de run uit Gmail kwam en die overschrijving is toegestaan)
2. `model` in de jobpayload
3. Door gebruiker geselecteerde opgeslagen modeloverschrijving voor de cron-sessie
4. Agent-/standaardmodelselectie

Fast mode volgt ook de resolved live selectie. Als de geselecteerde modelconfiguratie `params.fastMode` heeft, gebruikt geïsoleerde cron die standaard. Een opgeslagen `fastMode`-overschrijving voor de sessie wint nog steeds van de configuratie in beide richtingen. Auto mode gebruikt de `params.fastAutoOnSeconds`-grens van het geselecteerde model wanneer die aanwezig is, met standaardwaarde 60 seconden.

Als een geïsoleerde run een live model-switchhandoff bereikt, probeert cron opnieuw met de gewisselde provider/het gewisselde model en bewaart die live selectie voor de actieve run voordat opnieuw wordt geprobeerd. Wanneer de switch ook een nieuw auth-profiel bevat, bewaart cron die auth-profieloverschrijving ook voor de actieve run. Retries zijn begrensd: na de eerste poging plus 2 switchretries breekt cron af in plaats van eindeloos te loopen.

Voordat een geïsoleerde cron-run de agent-runner binnengaat, controleert OpenClaw bereikbare lokale providerendpoints voor geconfigureerde `api: "ollama"`- en `api: "openai-completions"`-providers waarvan `baseUrl` local loopback, privénetwerk of `.local` is. Als dat endpoint offline is, wordt de run geregistreerd als `skipped` met een duidelijke provider-/modelfout in plaats van een modelcall te starten. Het endpointresultaat wordt 5 minuten gecachet, zodat veel verschuldigde jobs die dezelfde dode lokale Ollama-, vLLM-, SGLang- of LM Studio-server gebruiken één kleine probe delen in plaats van een storm aan requests te veroorzaken. Overgeslagen provider-preflightruns verhogen execution-error backoff niet; schakel `failureAlert.includeSkipped` in wanneer je herhaalde skipmeldingen wilt.

## Levering en output

| Modus      | Wat er gebeurt                                                     |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Lever de uiteindelijke tekst via fallback aan het doel als de agent niets heeft verzonden |
| `webhook`  | POST de payload van het voltooide event naar een URL                |
| `none`     | Geen fallbacklevering door de runner                                |

Gebruik `--announce --channel telegram --to "-1001234567890"` voor kanaallevering. Gebruik voor Telegram-forumonderwerpen `-1001234567890:topic:123`; OpenClaw accepteert ook de door Telegram beheerde shorthand `-1001234567890:123`. Directe RPC-/configcallers kunnen `delivery.threadId` doorgeven als string of getal. Slack-/Discord-/Mattermost-doelen moeten expliciete prefixes gebruiken (`channel:<id>`, `user:<id>`). Matrix-room-ID's zijn hoofdlettergevoelig; gebruik de exacte room-ID of de vorm `room:!room:server` uit Matrix.

Wanneer announce-levering `channel: "last"` gebruikt of `channel` weglaat, kan een provider-geprefixte target zoals `telegram:123` het kanaal selecteren voordat cron terugvalt op sessiegeschiedenis of één geconfigureerd kanaal. Alleen prefixes die door de geladen Plugin worden geadverteerd, zijn providerselectors. Als `delivery.channel` expliciet is, moet de targetprefix dezelfde provider noemen; bijvoorbeeld `channel: "whatsapp"` met `to: "telegram:123"` wordt geweigerd in plaats van WhatsApp de Telegram-ID als telefoonnummer te laten interpreteren. Prefixes voor targetsoort en service, zoals `channel:<id>`, `user:<id>`, `imessage:<handle>` en `sms:<number>`, blijven kanaaleigen targetsyntaxis, geen providerselectors.

Voor geïsoleerde jobs wordt chatlevering gedeeld. Als een chatroute beschikbaar is, kan de agent de `message`-tool gebruiken, zelfs wanneer de job `--no-deliver` gebruikt. Als de agent naar het geconfigureerde/huidige doel verzendt, slaat OpenClaw de fallback-announce over. Anders bepalen `announce`, `webhook` en `none` alleen wat de runner met het uiteindelijke antwoord doet na de agent-turn.

Wanneer een agent vanuit een actieve chat een geïsoleerde herinnering maakt, slaat OpenClaw het behouden live leveringsdoel op voor de fallback-announce-route. Interne sessiesleutels kunnen lowercase zijn; providerleveringsdoelen worden niet uit die sleutels gereconstrueerd wanneer de huidige chatcontext beschikbaar is.

Impliciete announce-levering gebruikt geconfigureerde kanaal-allowlists om verouderde doelen te valideren en om te routeren. Goedkeuringen uit de DM-pairingstore zijn geen ontvangers voor fallbackautomatisering; stel `delivery.to` in of configureer de kanaalvermelding `allowFrom` wanneer een geplande job proactief naar een DM moet sturen.

## Outputtaal

Cron-jobs leiden geen antwoordtaal af uit kanaal, locale of eerdere
berichten. Zet de taalregel in het geplande bericht of de template:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Houd bij templatebestanden de taalinstructie in de gerenderde prompt en
controleer of placeholders zoals `{{language}}` zijn ingevuld voordat de job wordt uitgevoerd. Als
de output talen mengt, maak de regel expliciet, bijvoorbeeld: "Use Chinese
for narrative text and keep technical terms in English."

Foutmeldingen volgen een apart bestemmingspad:

- `cron.failureDestination` stelt een globale standaard in voor foutmeldingen.
- `job.delivery.failureDestination` overschrijft die per job.
- Als geen van beide is ingesteld en de job al via `announce` levert, vallen foutmeldingen nu terug op dat primaire announce-doel.
- `delivery.failureDestination` wordt alleen ondersteund bij jobs met `sessionTarget="isolated"`, tenzij de primaire leveringsmodus `webhook` is.
- `failureAlert.includeSkipped: true` laat een job of globaal cron-waarschuwingsbeleid deelnemen aan herhaalde waarschuwingen voor overgeslagen runs. Overgeslagen runs houden een aparte teller voor opeenvolgende skips bij, zodat ze geen invloed hebben op execution-error backoff.

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
  <Tab title="Webhook output">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Command output">
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

Gateway kan HTTP-Webhook-endpoints beschikbaar maken voor externe triggers. Schakel dit in de configuratie in:

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

Elk request moet het hooktoken via een header bevatten:

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
    Voer een geïsoleerde agent-turn uit:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Velden: `message` (vereist), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    Aangepaste hooknamen worden resolved via `hooks.mappings` in de configuratie. Mappings kunnen willekeurige payloads omzetten naar `wake`- of `agent`-acties met templates of codetransformaties.
  </Accordion>
</AccordionGroup>

<Warning>
Houd hookendpoints achter loopback, tailnet of een vertrouwde reverse proxy.

- Gebruik een speciaal hooktoken; hergebruik geen gateway-auth-tokens.
- Houd `hooks.path` op een specifiek subpad; `/` wordt geweigerd.
- Stel `hooks.allowedAgentIds` in om te beperken op welke effectieve agent een hook kan mikken, inclusief de standaardagent wanneer `agentId` wordt weggelaten.
- Houd `hooks.allowRequestSessionKey=false`, tenzij je door de caller geselecteerde sessies nodig hebt.
- Als je `hooks.allowRequestSessionKey` inschakelt, stel dan ook `hooks.allowedSessionKeyPrefixes` in om toegestane vormen van sessiesleutels te begrenzen.
- Hookpayloads worden standaard met veiligheidsgrenzen omwikkeld.

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

Dit schrijft de configuratie `hooks.gmail`, schakelt de Gmail-preset in en gebruikt Tailscale Funnel voor het push-eindpunt.

### Gateway automatisch starten

Wanneer `hooks.enabled=true` en `hooks.gmail.account` is ingesteld, start de Gateway `gog gmail watch serve` tijdens het opstarten en vernieuwt hij de watch automatisch. Stel `OPENCLAW_SKIP_GMAIL_WATCHER=1` in om dit uit te schakelen.

### Eenmalige handmatige configuratie

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

`openclaw cron run <jobId>` keert terug nadat de handmatige run in de wachtrij is geplaatst. Gebruik `--wait` voor shutdown-hooks, onderhoudsscripts of andere automatisering die moet blokkeren totdat de geplaatste run klaar is. De wachtmodus pollt de exact teruggegeven `runId`; hij sluit af met `0` voor status `ok` en met niet-nul voor `error`, `skipped` of een wachttime-out.

De agenttool `cron` retourneert compacte taaksamenvattingen (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) vanuit `cron(action: "list")`; gebruik `cron(action: "get", jobId: "...")` voor één volledige taakdefinitie. Directe Gateway-callers kunnen `compact: true` doorgeven aan `cron.list`; als dit wordt weggelaten, blijft het bestaande volledige antwoord met aflevervoorbeelden behouden.

`openclaw cron create` is een alias voor `openclaw cron add`, en nieuwe taken kunnen een positioneel schema gebruiken (`"0 9 * * 1"`, `"every 1h"`, `"20m"` of een ISO-tijdstempel), gevolgd door een positionele agentprompt. Gebruik `--webhook <url>` op `cron add|create` of `cron edit` om de payload van de afgeronde run met POST naar een HTTP-eindpunt te sturen. Webhook-aflevering kan niet worden gecombineerd met chat-afleveringsvlaggen zoals `--announce`, `--channel`, `--to`, `--thread-id` of `--account`. Bij `cron edit` maken `--clear-channel`, `--clear-to`, `--clear-thread-id` en `--clear-account` die routeringsvelden afzonderlijk leeg (elk wordt geweigerd naast de bijbehorende instelvlag), wat iets anders is dan `--no-deliver`, dat fallback-aflevering door de runner uitschakelt.

<Note>
Opmerking over modeloverschrijving:

- `openclaw cron add|edit --model ...` wijzigt het geselecteerde model van de taak.
- Als het model is toegestaan, bereikt die exacte provider/het exacte model de geïsoleerde agentrun.
- Als het niet is toegestaan of niet kan worden opgelost, laat Cron de run mislukken met een expliciete validatiefout.
- API-payloadpatches voor `cron.update` kunnen `model: null` instellen om een opgeslagen modeloverschrijving voor een taak te wissen.
- `openclaw cron edit <job-id> --clear-model` wist die overschrijving vanuit de CLI (hetzelfde effect als de patch `model: null`) en kan niet worden gecombineerd met `--model`.
- Geconfigureerde fallback-ketens blijven van toepassing, omdat Cron `--model` een primaire taakinstelling is en geen sessieoverschrijving met `/model`.
- `openclaw cron add|edit --fallbacks ...` stelt payload `fallbacks` in en vervangt de geconfigureerde fallbacks voor die taak; `--fallbacks ""` schakelt fallback uit en maakt de run strikt. `openclaw cron edit <job-id> --clear-fallbacks` wist de per-taakoverschrijving.
- Een gewone `--model` zonder expliciete of geconfigureerde fallbacklijst valt niet stilzwijgend terug naar de primaire agent als extra herhaaldoel.

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

`maxConcurrentRuns` beperkt zowel geplande Cron-dispatch als uitvoering van geïsoleerde agentbeurten, en staat standaard op 8. Geïsoleerde Cron-agentbeurten gebruiken intern de speciale `cron-nested` uitvoeringsbaan van de wachtrij, dus als u deze waarde verhoogt, kunnen onafhankelijke Cron-LLM-runs parallel voortgang boeken in plaats van alleen hun buitenste Cron-wrappers te starten. De gedeelde niet-Cron-baan `nested` wordt niet door deze instelling verbreed.

`cron.store` is een logische storesleutel en een legacy-importpad voor doctor. Voer `openclaw doctor --fix` uit om bestaande JSON-stores in SQLite te importeren en ze te archiveren; toekomstige Cron-wijzigingen moeten via de CLI of Gateway-API verlopen.

Cron uitschakelen: `cron.enabled: false` of `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Eenmalige retry**: tijdelijke fouten (snelheidslimiet, overbelasting, netwerk, serverfout) worden tot 3 keer opnieuw geprobeerd met exponentiële backoff. Permanente fouten schakelen onmiddellijk uit.

    **Terugkerende retry**: exponentiële backoff (30s tot 60m) tussen retries. Backoff wordt opnieuw ingesteld na de volgende succesvolle run.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (standaard `24h`) ruimt geïsoleerde run-sessie-items op. `cron.runLog.keepLines` beperkt het aantal bewaarde SQLite-runhistorierijen per taak; `maxBytes` blijft behouden voor configuratiecompatibiliteit met oudere bestandsgebaseerde runlogs.
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
  <Accordion title="Cron not firing">
    - Controleer de env-var `cron.enabled` en `OPENCLAW_SKIP_CRON`.
    - Bevestig dat de Gateway continu draait.
    - Controleer voor `cron`-schema's de tijdzone (`--tz`) ten opzichte van de tijdzone van de host.
    - `reason: not-due` in runuitvoer betekent dat de handmatige run is gecontroleerd met `openclaw cron run <jobId> --due` en dat de taak nog niet aan de beurt was.

  </Accordion>
  <Accordion title="Cron fired but no delivery">
    - Aflevermodus `none` betekent dat er geen fallback-verzending door de runner wordt verwacht. De agent kan nog steeds rechtstreeks verzenden met de tool `message` wanneer er een chatroute beschikbaar is.
    - Ontbrekend/ongeldig afleverdoel (`channel`/`to`) betekent dat uitgaand verkeer is overgeslagen.
    - Voor Matrix kunnen gekopieerde of legacy-taken met room-ID's in kleine letters in `delivery.to` mislukken, omdat Matrix-room-ID's hoofdlettergevoelig zijn. Bewerk de taak naar de exacte waarde `!room:server` of `room:!room:server` vanuit Matrix.
    - Kanaalautorisatiefouten (`unauthorized`, `Forbidden`) betekenen dat aflevering door referenties is geblokkeerd.
    - Als de geïsoleerde run alleen het stille token (`NO_REPLY` / `no_reply`) retourneert, onderdrukt OpenClaw directe uitgaande aflevering en ook het fallback-pad met de samenvatting in de wachtrij, zodat er niets terug naar chat wordt geplaatst.
    - Als de agent de gebruiker zelf moet berichten, controleer dan of de taak een bruikbare route heeft (`channel: "last"` met een eerdere chat, of een expliciet kanaal/doel).

  </Accordion>
  <Accordion title="Cron or heartbeat appears to prevent /new-style rollover">
    - Dagelijkse reset en reset na inactiviteit zijn niet gebaseerd op `updatedAt`; zie [Sessiebeheer](/nl/concepts/session#session-lifecycle).
    - Cron-wakeups, Heartbeat-runs, exec-meldingen en Gateway-boekhouding kunnen de sessierij bijwerken voor routering/status, maar ze verlengen `sessionStartedAt` of `lastInteractionAt` niet.
    - Voor legacy-rijen die zijn gemaakt voordat die velden bestonden, kan OpenClaw `sessionStartedAt` herstellen uit de sessieheader van de transcript-JSONL wanneer het bestand nog beschikbaar is. Legacy-inactieve rijen zonder `lastInteractionAt` gebruiken die herstelde starttijd als hun inactiviteitsbasislijn.

  </Accordion>
  <Accordion title="Timezone gotchas">
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
