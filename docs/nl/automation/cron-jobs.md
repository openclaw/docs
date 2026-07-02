---
read_when:
    - Achtergrondtaken of wekopdrachten plannen
    - Externe triggers (webhooks, Gmail) verbinden met OpenClaw
    - Kiezen tussen Heartbeat en Cron voor geplande taken
sidebarTitle: Scheduled tasks
summary: Geplande taken, webhooks en Gmail PubSub-triggers voor de Gateway-planner
title: Geplande taken
x-i18n:
    generated_at: "2026-07-02T01:02:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 314b02ed3002843afe9d96e948de362b6111e648eb0e7106ec2ccc230cf50692
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron is de ingebouwde planner van de Gateway. Deze bewaart taken, wekt de agent op het juiste moment en kan uitvoer terugsturen naar een chatkanaal of Webhook-eindpunt.

## Snelstart

<Steps>
  <Step title="Een eenmalige herinnering toevoegen">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Je taken controleren">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="Uitvoeringsgeschiedenis bekijken">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Hoe cron werkt

- Cron draait **binnen het Gateway**-proces (niet binnen het model).
- Taakdefinities, runtimestatus en uitvoeringsgeschiedenis blijven bewaard in OpenClaw's gedeelde SQLite-statusdatabase, zodat planningen niet verloren gaan bij herstarts.
- Voer bij een upgrade `openclaw doctor --fix` uit om legacy `~/.openclaw/cron/jobs.json`-, `jobs-state.json`- en `runs/*.jsonl`-bestanden in SQLite te importeren en ze te hernoemen met een `.migrated`-achtervoegsel. Ongeldige taakrijen worden overgeslagen tijdens runtime en gekopieerd naar `jobs-quarantine.json` voor latere reparatie of beoordeling.
- `cron.store` blijft de logische sleutel van de cron-store en het importpad voor doctor benoemen. Na import wijzigt het bewerken van dat JSON-bestand de actieve Cron-taken niet meer; gebruik in plaats daarvan `openclaw cron add|edit|remove` of de Cron-RPC-methoden van de Gateway.
- Alle Cron-uitvoeringen maken [achtergrondtaak](/nl/automation/tasks)-records aan.
- Bij het opstarten van de Gateway worden achterstallige geïsoleerde agent-turntaken opnieuw gepland buiten het kanaalverbindingsvenster in plaats van ze direct opnieuw af te spelen, zodat het opstarten van Discord/Telegram en de installatie van native opdrachten responsief blijven na herstarts.
- Eenmalige taken (`--at`) worden standaard automatisch verwijderd na succes.
- Geïsoleerde Cron-uitvoeringen sluiten naar beste vermogen bijgehouden browsertabbladen/-processen voor hun `cron:<jobId>`-sessie wanneer de uitvoering is voltooid, zodat losgekoppelde browserautomatisering geen verweesde processen achterlaat.
- Geïsoleerde Cron-uitvoeringen die de beperkte Cron-zelfopruimingsmachtiging ontvangen, kunnen nog steeds de plannerstatus, een op zichzelf gefilterde lijst van hun huidige taak en de uitvoeringsgeschiedenis van die taak lezen, zodat status-/Heartbeat-controles hun eigen planning kunnen inspecteren zonder bredere toegang voor Cron-mutaties te krijgen.
- Geïsoleerde Cron-uitvoeringen beschermen ook tegen verouderde bevestigingsantwoorden. Als het eerste resultaat slechts een tussentijdse statusupdate is (`on it`, `pulling everything together` en vergelijkbare hints) en geen onderliggende subagentuitvoering nog verantwoordelijk is voor het eindantwoord, vraagt OpenClaw één keer opnieuw om het daadwerkelijke resultaat voordat het wordt afgeleverd.
- Geïsoleerde Cron-uitvoeringen gebruiken gestructureerde metadata voor uitvoeringsweigering uit de ingebedde uitvoering, inclusief node-host `UNAVAILABLE`-wrappers waarvan de geneste foutmelding begint met `SYSTEM_RUN_DENIED` of `INVALID_REQUEST`, zodat een geblokkeerde opdracht niet als een geslaagde uitvoering wordt gerapporteerd terwijl gewone assistentproza niet als weigering wordt behandeld.
- Geïsoleerde Cron-uitvoeringen behandelen fouten op uitvoeringsniveau van agents ook als taakfouten, zelfs wanneer er geen antwoordpayload wordt geproduceerd, zodat model-/providerfouten fouttellers verhogen en foutmeldingen activeren in plaats van de taak als succesvol af te handelen.
- Wanneer een geïsoleerde agent-turntaak `timeoutSeconds` bereikt, breekt Cron de onderliggende agentuitvoering af en geeft deze een kort opruimvenster. Als de uitvoering niet leegloopt, wist Gateway-beheerde opruiming geforceerd het sessie-eigenaarschap van die uitvoering voordat Cron de time-out registreert, zodat in de wachtrij geplaatste chatwerkzaamheden niet achterblijven achter een verouderde verwerkende sessie.
- Als een geïsoleerde agent-turn vastloopt voordat de runner start of vóór de eerste modelaanroep, registreert Cron een fasespecifieke time-out zoals `setup timed out before runner start` of `stalled before first model call (last phase: context-engine)`. Deze watchdogs dekken ingebedde providers en CLI-ondersteunde providers voordat hun externe CLI-proces daadwerkelijk is gestart, en worden onafhankelijk begrensd van lange `timeoutSeconds`-waarden zodat cold-start-/auth-/contextfouten snel zichtbaar worden in plaats van te wachten op het volledige taakbudget.
- Als je systeem-Cron of een andere externe planner gebruikt om `openclaw agent` uit te voeren, wikkel deze dan in een hard-kill-escalatie, ook al handelt de CLI `SIGTERM`/`SIGINT` af. Gateway-ondersteunde uitvoeringen vragen de Gateway om geaccepteerde uitvoeringen af te breken; lokale en ingebedde fallback-uitvoeringen ontvangen hetzelfde afbreeksignaal. Geef voor GNU `timeout` de voorkeur aan `timeout -k 60 600 openclaw agent ...` boven gewone `timeout 600 ...`; de `-k`-waarde is de supervisor-backstop als het proces niet kan leeglopen. Behoud voor systemd-units dezelfde vorm door een `SIGTERM`-stopsignaal plus een respijtvenster zoals `TimeoutStopSec` te gebruiken vóór een eventuele definitieve kill. Als een retry een `--run-id` hergebruikt terwijl de oorspronkelijke Gateway-uitvoering nog actief is, wordt het duplicaat gerapporteerd als actief in plaats van een tweede uitvoering te starten.

<a id="maintenance"></a>

<Note>
Taakreconciliatie voor Cron is eerst runtime-beheerd en daarna ondersteund door duurzame geschiedenis: een actieve Cron-taak blijft live zolang de Cron-runtime die taak nog als actief bijhoudt, zelfs als er nog een oude onderliggende sessierij bestaat. Zodra de runtime de taak niet meer beheert en het respijtvenster van 5 minuten verloopt, controleert onderhoud bewaarde uitvoeringslogs en taakstatus voor de overeenkomende `cron:<jobId>:<startedAt>`-uitvoering. Als die duurzame geschiedenis een terminal resultaat toont, wordt het taakgrootboek daaruit afgerond; anders kan Gateway-beheerd onderhoud de taak als `lost` markeren. Offline CLI-audit kan herstellen uit duurzame geschiedenis, maar behandelt zijn eigen lege in-process set met actieve taken niet als bewijs dat een Gateway-beheerde Cron-uitvoering verdwenen is.
</Note>

## Planningstypen

| Soort   | CLI-vlag  | Beschrijving                                            |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | Eenmalige tijdstempel (ISO 8601 of relatief zoals `20m`) |
| `every` | `--every` | Vast interval                                           |
| `cron`  | `--cron`  | Cron-expressie met 5 of 6 velden met optionele `--tz`   |

Tijdstempels zonder tijdzone worden behandeld als UTC. Voeg `--tz America/New_York` toe voor planning op basis van lokale kloktijd.

Terugkerende expressies op het hele uur worden automatisch met maximaal 5 minuten gespreid om belastingpieken te verminderen. Gebruik `--exact` om exacte timing af te dwingen of `--stagger 30s` voor een expliciet venster.

### Dag-van-de-maand en dag-van-de-week gebruiken OF-logica

Cron-expressies worden geparset door [croner](https://github.com/Hexagon/croner). Wanneer zowel het dag-van-de-maandveld als het dag-van-de-weekveld geen wildcard is, matcht croner wanneer **een van beide** velden matcht, niet beide. Dit is standaardgedrag van Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Dit vuurt ongeveer 5-6 keer per maand af in plaats van 0-1 keer per maand. OpenClaw gebruikt hier het standaard OF-gedrag van Croner. Gebruik de `+`-modifier voor dag-van-de-week van Croner (`0 9 15 * +1`) om beide voorwaarden te vereisen, of plan op één veld en bewaak het andere in de prompt of opdracht van je taak.

## Uitvoeringsstijlen

| Stijl           | `--session`-waarde | Draait in                 | Beste voor                     |
| --------------- | ------------------ | ------------------------- | ------------------------------ |
| Hoofdsessie     | `main`             | Toegewijde Cron-wake-lane | Herinneringen, systeemevents   |
| Geïsoleerd      | `isolated`         | Toegewijde `cron:<jobId>` | Rapporten, achtergrondklussen  |
| Huidige sessie  | `current`          | Losgekoppelde Cron-uitvoering | Contextbewust terugkerend werk |
| Aangepaste sessie | `session:custom-id` | Losgekoppelde Cron-uitvoering | Gericht op een bekende chat/sessie |

<AccordionGroup>
  <Accordion title="Hoofdsessie versus geïsoleerd versus aangepast">
    **Hoofdsessie**-taken plaatsen een systeemevent in een door Cron beheerde uitvoeringslane en wekken optioneel de Heartbeat (`--wake now` of `--wake next-heartbeat`). Ze kunnen de laatste aflevercontext van de doelhoofdsessie gebruiken voor antwoorden, maar ze voegen geen routinematige Cron-turns toe aan de menselijke chatlane en verlengen de dagelijkse/idle reset-versheid voor de doelsessie niet. **Geïsoleerde** taken draaien een toegewijde agent-turn met een verse sessie. **Huidige** en **aangepaste** sessietaken (`current`, `session:xxx`) kunnen de geselecteerde chat/sessie gebruiken voor aflevercontext en veilige voorkeurinitialisatie, maar elke uitvoering wordt nog steeds uitgevoerd in een losgekoppelde Cron-sessie, zodat gepland werk het livegesprekstranscript niet blokkeert of vervuilt.

    Cron-events voor hoofdsessies zijn zelfstandige systeemeventherinneringen. Ze bevatten
    niet automatisch de instructie "Read
    HEARTBEAT.md" uit de standaard Heartbeat-prompt. Als een terugkerende herinnering
    `HEARTBEAT.md` moet raadplegen, zeg dat dan expliciet in de Cron-eventtekst of in de
    eigen instructies van de agent.

  </Accordion>
  <Accordion title="Wat 'verse sessie' betekent voor losgekoppelde taken">
    Voor geïsoleerde, huidige-sessie- en aangepaste-sessietaken betekent "verse sessie" een nieuwe transcript-/sessie-id voor elke uitvoering. OpenClaw kan veilige voorkeuren meenemen, zoals instellingen voor denken/snel/uitgebreid, labels en expliciete door de gebruiker geselecteerde model-/auth-overrides. Losgekoppelde uitvoeringen erven geen omgevingsgesprekscontext uit een oudere Cron-rij: kanaal-/groepsroutering, verzend- of wachtrijbeleid, elevatie, oorsprong of ACP-runtimebinding. Zet duurzame status voor terugkerend werk in de prompt, werkruimtebestanden, tools of het systeem waarop de taak werkt, in plaats van te vertrouwen op een livechattranscript als Cron-geheugen.
  </Accordion>
  <Accordion title="Runtime-opruiming">
    Voor geïsoleerde taken omvat runtime-afbouw nu best-effort browseropruiming voor die Cron-sessie. Opruimfouten worden genegeerd, zodat het daadwerkelijke Cron-resultaat nog steeds leidend blijft.

    Geïsoleerde Cron-uitvoeringen ruimen ook alle gebundelde MCP-runtime-instanties op die voor de taak zijn aangemaakt via het gedeelde runtime-opruimingspad. Dit komt overeen met hoe MCP-clients voor hoofdsessies en aangepaste sessies worden afgebouwd, zodat geïsoleerde Cron-taken geen stdio-childprocessen of langlevende MCP-verbindingen lekken tussen uitvoeringen.

  </Accordion>
  <Accordion title="Subagent- en Discord-aflevering">
    Wanneer geïsoleerde Cron-uitvoeringen subagents orkestreren, geeft aflevering ook de voorkeur aan de uiteindelijke uitvoer van onderliggende uitvoeringen boven verouderde tussentekst van de ouder. Als onderliggende uitvoeringen nog draaien, onderdrukt OpenClaw die gedeeltelijke ouderupdate in plaats van deze aan te kondigen.

    Voor Discord-aankondigingsdoelen met alleen tekst verzendt OpenClaw de canonieke definitieve assistenttekst één keer in plaats van zowel gestreamde/tussentijdse tekstpayloads als het eindantwoord opnieuw af te spelen. Media en gestructureerde Discord-payloads worden nog steeds als afzonderlijke payloads afgeleverd, zodat bijlagen en componenten niet worden weggelaten.

  </Accordion>
</AccordionGroup>

### Opdrachtpayloads

Gebruik opdrachtpayloads voor deterministische scripts die binnen de Gateway-planner moeten draaien zonder een modelondersteunde geïsoleerde agent-turn te starten. Opdrachttaken worden uitgevoerd op de Gateway-host, leggen stdout/stderr vast, registreren de uitvoering in de Cron-geschiedenis en hergebruiken dezelfde aflevermodi `announce`, `webhook` en `none` als geïsoleerde taken.

<Note>
Command Cron is een operator-admin Gateway-automatiseringsoppervlak, geen agent-
`tools.exec`-aanroep. Het aanmaken, bijwerken, verwijderen of handmatig uitvoeren van Cron-taken
vereist `operator.admin`; geplande opdrachtuitvoeringen worden later uitgevoerd binnen het
Gateway-proces als die door admin geschreven automatisering. Agent-execbeleid zoals
`tools.exec.mode`, goedkeuringsprompts en tool-allowlists per agent beheert
modelzichtbare exec-tools, niet opdracht-Cron-payloads.
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

`--command <shell>` slaat `argv: ["sh", "-lc", <shell>]` op. Gebruik `--command-argv '["node","scripts/report.mjs"]'` wanneer je exacte argv-uitvoering zonder shell-parsing wilt. Optionele velden `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds` en `--output-max-bytes` regelen de procesomgeving, stdin en uitvoergrenzen.

Als stdout niet leeg is, is die tekst het geleverde resultaat. Als stdout leeg is en stderr niet leeg is, wordt stderr geleverd. Als beide streams aanwezig zijn, levert Cron een klein `stdout:` / `stderr:`-blok. Een exitcode nul registreert de run als `ok`; een exit anders dan nul, signaal, timeout of timeout zonder uitvoer registreert `error` en kan foutmeldingen activeren. Een opdracht die alleen `NO_REPLY` afdrukt, gebruikt de normale stille-tokensuppressie van Cron en plaatst niets terug in de chat.

### Payloadopties voor geïsoleerde jobs

<ParamField path="--message" type="string" required>
  Prompttekst (vereist voor geïsoleerd).
</ParamField>
<ParamField path="--model" type="string">
  Modeloverride; gebruikt het geselecteerde toegestane model voor de job.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Fallbackmodellenlijst per job, bijvoorbeeld `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Geef `--fallbacks ""` door voor een strikte run zonder fallbacks.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  Verwijdert bij `cron edit` de fallbackoverride per job, zodat de job de geconfigureerde fallbackvoorrang volgt. Kan niet worden gecombineerd met `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  Verwijdert bij `cron edit` de modeloverride per job, zodat de job de normale modelselectievoorrang van Cron volgt (een opgeslagen cron-sessieoverride als die is ingesteld, anders het agent-/standaardmodel). Kan niet worden gecombineerd met `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Override voor denkniveau.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  Verwijdert bij `cron edit` de thinking-override per job, zodat de job de normale thinking-voorrang van Cron volgt. Kan niet worden gecombineerd met `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Sla injectie van het workspace-bootstrapbestand over.
</ParamField>
<ParamField path="--tools" type="string">
  Beperk welke tools de job kan gebruiken, bijvoorbeeld `--tools exec,read`.
</ParamField>

`--model` gebruikt het geselecteerde toegestane model als primair model van die job. Het is niet hetzelfde als een `/model`-override in een chatsessie: geconfigureerde fallbackketens blijven van toepassing wanneer het primaire model van de job faalt. Als het aangevraagde model niet is toegestaan of niet kan worden opgelost, laat Cron de run mislukken met een expliciete validatiefout in plaats van stil terug te vallen op de agent-/standaardmodelselectie van de job.

Cron-jobs kunnen ook `fallbacks` op payloadniveau bevatten. Als die aanwezig is, vervangt die lijst de geconfigureerde fallbackketen voor de job. Gebruik `fallbacks: []` in de jobpayload/API wanneer je een strikte Cron-run wilt die alleen het geselecteerde model probeert. Als een job `--model` heeft maar geen payload- of geconfigureerde fallbacks, geeft OpenClaw een expliciete lege fallbackoverride door, zodat de primaire agent niet wordt toegevoegd als verborgen extra retrydoel.

Preflightchecks voor lokale providers lopen geconfigureerde fallbacks langs voordat een Cron-run als `skipped` wordt gemarkeerd; `fallbacks: []` houdt dat preflightpad strikt.

Modelselectievoorrang voor geïsoleerde jobs is:

1. Gmail-hookmodeloverride (wanneer de run uit Gmail kwam en die override is toegestaan)
2. `model` per jobpayload
3. Door gebruiker geselecteerde opgeslagen cron-sessiemodeloverride
4. Agent-/standaardmodelselectie

Snelle modus volgt ook de opgeloste live selectie. Als de geselecteerde modelconfiguratie `params.fastMode` heeft, gebruikt geïsoleerde Cron dat standaard. Een opgeslagen sessieoverride `fastMode` heeft nog steeds voorrang op configuratie in beide richtingen. Automatische modus gebruikt de afkapwaarde `params.fastAutoOnSeconds` van het geselecteerde model wanneer die aanwezig is, met standaardwaarde 60 seconden.

Als een geïsoleerde run een live overdracht voor modelwisseling raakt, probeert Cron opnieuw met de gewisselde provider/het gewisselde model en bewaart die live selectie voor de actieve run voordat opnieuw wordt geprobeerd. Wanneer de switch ook een nieuw auth-profiel bevat, bewaart Cron die auth-profieloverride ook voor de actieve run. Retries zijn begrensd: na de eerste poging plus 2 switch-retries breekt Cron af in plaats van eindeloos te blijven herhalen.

Voordat een geïsoleerde Cron-run de agent-runner binnengaat, controleert OpenClaw bereikbare lokale provider-eindpunten voor geconfigureerde `api: "ollama"`- en `api: "openai-completions"`-providers waarvan `baseUrl` loopback, privé-netwerk of `.local` is. Als dat eindpunt offline is, wordt de run geregistreerd als `skipped` met een duidelijke provider-/modelfout in plaats van een modelaanroep te starten. Het eindpuntresultaat wordt 5 minuten gecachet, zodat veel verschuldigde jobs die dezelfde dode lokale Ollama-, vLLM-, SGLang- of LM Studio-server gebruiken één kleine probe delen in plaats van een verzoekenstorm te creëren. Overgeslagen provider-preflightruns verhogen de backoff voor uitvoeringsfouten niet; schakel `failureAlert.includeSkipped` in wanneer je herhaalde oversla-meldingen wilt.

## Bezorging en uitvoer

| Modus      | Wat er gebeurt                                                       |
| ---------- | -------------------------------------------------------------------- |
| `announce` | Lever definitieve tekst met fallback aan het doel als de agent niets heeft verzonden |
| `webhook`  | POST payload van voltooid event naar een URL                         |
| `none`     | Geen fallbackbezorging door runner                                   |

Gebruik `--announce --channel telegram --to "-1001234567890"` voor kanaalbezorging. Gebruik voor Telegram-forumonderwerpen `-1001234567890:topic:123`; OpenClaw accepteert ook de Telegram-eigen shorthand `-1001234567890:123`. Directe RPC/config-aanroepers kunnen `delivery.threadId` als string of getal doorgeven. Slack-/Discord-/Mattermost-doelen moeten expliciete prefixen gebruiken (`channel:<id>`, `user:<id>`). Matrix-ruimte-ID's zijn hoofdlettergevoelig; gebruik de exacte ruimte-ID of de vorm `room:!room:server` uit Matrix.

Wanneer announce-bezorging `channel: "last"` gebruikt of `channel` weglaat, kan een providergeprefixt doel zoals `telegram:123` het kanaal selecteren voordat Cron terugvalt op sessiegeschiedenis of één geconfigureerd kanaal. Alleen prefixen die door de geladen Plugin worden geadverteerd, zijn providerselectors. Als `delivery.channel` expliciet is, moet de doelprefix dezelfde provider noemen; bijvoorbeeld `channel: "whatsapp"` met `to: "telegram:123"` wordt geweigerd in plaats van WhatsApp de Telegram-ID als telefoonnummer te laten interpreteren. Doelsoort- en serviceprefixen zoals `channel:<id>`, `user:<id>`, `imessage:<handle>` en `sms:<number>` blijven kanaaleigen doelsyntaxis, geen providerselectors.

Voor geïsoleerde jobs wordt chatbezorging gedeeld. Als er een chatroute beschikbaar is, kan de agent de `message`-tool gebruiken, zelfs wanneer de job `--no-deliver` gebruikt. Als de agent naar het geconfigureerde/huidige doel verzendt, slaat OpenClaw de fallback-announce over. Anders bepalen `announce`, `webhook` en `none` alleen wat de runner met het definitieve antwoord doet na de agentbeurt.

Wanneer een agent een geïsoleerde herinnering maakt vanuit een actieve chat, slaat OpenClaw het bewaarde live bezorgdoel op voor de fallback-announce-route. Interne sessiesleutels kunnen kleine letters gebruiken; providerbezorgdoelen worden niet uit die sleutels gereconstrueerd wanneer de huidige chatcontext beschikbaar is.

Impliciete announce-bezorging gebruikt geconfigureerde kanaal-allowlists om verouderde doelen te valideren en om te leiden. Goedkeuringen uit de DM-pairingstore zijn geen ontvangers voor fallbackautomatisering; stel `delivery.to` in of configureer de kanaalvermelding `allowFrom` wanneer een geplande job proactief naar een DM moet verzenden.

## Uitvoertaal

Cron-jobs leiden geen antwoordtaal af uit kanaal, locale of eerdere
berichten. Zet de taalregel in het geplande bericht of sjabloon:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Voor sjabloonbestanden behoud je de taalinstructie in de gerenderde prompt en
controleer je of placeholders zoals `{{language}}` zijn ingevuld voordat de taak wordt uitgevoerd. Als
de uitvoer talen mengt, maak de regel dan expliciet, bijvoorbeeld: "Gebruik Chinees
voor verhalende tekst en houd technische termen in het Engels."

Foutmeldingen volgen een afzonderlijk bestemmingspad:

- `cron.failureDestination` stelt een globale standaard in voor foutmeldingen.
- `job.delivery.failureDestination` overschrijft die per taak.
- Als geen van beide is ingesteld en de taak al bezorgt via `announce`, vallen foutmeldingen nu terug op dat primaire announce-doel.
- `delivery.failureDestination` wordt alleen ondersteund voor taken met `sessionTarget="isolated"`, tenzij de primaire bezorgmodus `webhook` is.
- `failureAlert.includeSkipped: true` laat een taak of globaal Cron-waarschuwingsbeleid herhaalde waarschuwingen voor overgeslagen uitvoeringen gebruiken. Overgeslagen uitvoeringen houden een aparte teller voor opeenvolgende overslagen bij, zodat ze geen invloed hebben op backoff bij uitvoeringsfouten.

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

Gateway kan HTTP-Webhook-eindpunten blootstellen voor externe triggers. Schakel dit in de configuratie in:

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
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    Aangepaste hooknamen worden opgelost via `hooks.mappings` in de configuratie. Mappings kunnen willekeurige payloads omzetten naar `wake`- of `agent`-acties met sjablonen of codetransformaties.
  </Accordion>
</AccordionGroup>

<Warning>
Houd hook-eindpunten achter local loopback, tailnet of een vertrouwde reverse proxy.

- Gebruik een speciale hook-token; hergebruik geen Gateway-authenticatietokens.
- Houd `hooks.path` op een speciaal subpad; `/` wordt geweigerd.
- Stel `hooks.allowedAgentIds` in om te beperken op welke effectieve agent een hook zich kan richten, inclusief de standaardagent wanneer `agentId` is weggelaten.
- Houd `hooks.allowRequestSessionKey=false`, tenzij je door de aanroeper gekozen sessies vereist.
- Als je `hooks.allowRequestSessionKey` inschakelt, stel dan ook `hooks.allowedSessionKeyPrefixes` in om toegestane sessiesleutelvormen te beperken.
- Hook-payloads worden standaard met veiligheidsgrenzen omwikkeld.

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

Dit schrijft de `hooks.gmail`-configuratie, schakelt de Gmail-preset in en gebruikt Tailscale Funnel voor het push-eindpunt.

### Gateway automatisch starten

Wanneer `hooks.enabled=true` en `hooks.gmail.account` is ingesteld, start de Gateway `gog gmail watch serve` bij het opstarten en verlengt de watch automatisch. Stel `OPENCLAW_SKIP_GMAIL_WATCHER=1` in om je af te melden.

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

`openclaw cron run <jobId>` keert terug nadat de handmatige uitvoering in de wachtrij is geplaatst. Gebruik `--wait` voor shutdown-hooks, onderhoudsscripts of andere automatisering die moet blokkeren totdat de in de wachtrij geplaatste uitvoering klaar is. De wachtmodus pollt de exact teruggegeven `runId`; deze sluit af met `0` voor status `ok` en met niet-nul voor `error`, `skipped` of een wachttime-out.

De agenttool `cron` retourneert compacte taaksamenvattingen (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) vanuit `cron(action: "list")`; gebruik `cron(action: "get", jobId: "...")` voor één volledige taakdefinitie. Directe Gateway-aanroepers kunnen `compact: true` doorgeven aan `cron.list`; als je dit weglaat, blijft de bestaande volledige respons met bezorgvoorbeelden behouden.

`openclaw cron create` is een alias voor `openclaw cron add`, en nieuwe taken kunnen een positioneel schema gebruiken (`"0 9 * * 1"`, `"every 1h"`, `"20m"` of een ISO-tijdstempel), gevolgd door een positionele agentprompt. Gebruik `--webhook <url>` op `cron add|create` of `cron edit` om de payload van de afgeronde uitvoering met POST naar een HTTP-eindpunt te sturen. Webhook-bezorging kan niet worden gecombineerd met chatbezorgingsvlaggen zoals `--announce`, `--channel`, `--to`, `--thread-id` of `--account`. Bij `cron edit` maken `--clear-channel`, `--clear-to`, `--clear-thread-id` en `--clear-account` die routeringsvelden afzonderlijk leeg (elk geweigerd naast de bijbehorende instelvlag), wat verschilt van `--no-deliver`, waarmee fallback-bezorging door de runner wordt uitgeschakeld.

<Note>
Opmerking over modeloverschrijving:

- `openclaw cron add|edit --model ...` wijzigt het geselecteerde model van de taak.
- Als het model is toegestaan, bereikt die exacte provider/het exacte model de geïsoleerde agentuitvoering.
- Als het niet is toegestaan of niet kan worden opgelost, laat cron de uitvoering mislukken met een expliciete validatiefout.
- API-payloadpatches voor `cron.update` kunnen `model: null` instellen om een opgeslagen modeloverschrijving voor een taak te wissen.
- `openclaw cron edit <job-id> --clear-model` wist die overschrijving vanuit de CLI (hetzelfde effect als de patch `model: null`) en kan niet worden gecombineerd met `--model`.
- Geconfigureerde fallback-ketens blijven van toepassing omdat cron `--model` een primaire taakinstelling is, geen sessie-overschrijving voor `/model`.
- `openclaw cron add|edit --fallbacks ...` stelt payload `fallbacks` in en vervangt geconfigureerde fallbacks voor die taak; `--fallbacks ""` schakelt fallback uit en maakt de uitvoering strikt. `openclaw cron edit <job-id> --clear-fallbacks` wist de overschrijving per taak.
- Een gewone `--model` zonder expliciete of geconfigureerde fallbacklijst valt niet stilzwijgend terug naar de primaire agent als extra retry-doel.

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

`maxConcurrentRuns` beperkt zowel geplande Cron-dispatch als geïsoleerde uitvoering van agentbeurten, en staat standaard op 8. Geïsoleerde Cron-agentbeurten gebruiken intern de speciale uitvoeringsbaan `cron-nested` van de wachtrij, dus als je deze waarde verhoogt, kunnen onafhankelijke Cron-LLM-uitvoeringen parallel voortgang maken in plaats van alleen hun buitenste Cron-wrappers te starten. De gedeelde niet-Cron-baan `nested` wordt door deze instelling niet verbreed.

`cron.store` is een logische opslagsleutel en legacy importpad voor doctor. Voer `openclaw doctor --fix` uit om bestaande JSON-opslagen in SQLite te importeren en te archiveren; toekomstige Cron-wijzigingen moeten via de CLI of Gateway-API lopen.

Cron uitschakelen: `cron.enabled: false` of `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **Eenmalige retry**: tijdelijke fouten (rate limit, overbelasting, netwerk, serverfout) worden tot 3 keer opnieuw geprobeerd met exponentiële backoff. Permanente fouten schakelen direct uit.

    **Terugkerende retry**: exponentiële backoff (30s tot 60m) tussen retries. Backoff wordt gereset na de volgende geslaagde uitvoering.

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention` (standaard `24h`) ruimt vermeldingen van geïsoleerde uitvoeringssessies op. `cron.runLog.keepLines` beperkt behouden SQLite-rijen met uitvoeringsgeschiedenis per taak; `maxBytes` wordt behouden voor configuratiecompatibiliteit met oudere bestandsgebaseerde uitvoeringslogs.
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
    - Controleer `cron.enabled` en de env-var `OPENCLAW_SKIP_CRON`.
    - Bevestig dat de Gateway continu draait.
    - Controleer voor `cron`-schema's de tijdzone (`--tz`) tegenover de hosttijdzone.
    - `reason: not-due` in de uitvoer betekent dat de handmatige uitvoering is gecontroleerd met `openclaw cron run <jobId> --due` en dat de taak nog niet verschuldigd was.

  </Accordion>
  <Accordion title="Cron fired but no delivery">
    - Bezorgmodus `none` betekent dat er geen fallback-verzending door de runner wordt verwacht. De agent kan nog steeds rechtstreeks verzenden met de tool `message` wanneer er een chatroute beschikbaar is.
    - Ontbrekend/ongeldig bezorgdoel (`channel`/`to`) betekent dat uitgaand is overgeslagen.
    - Voor Matrix kunnen gekopieerde of legacy taken met kleine letters in `delivery.to`-ruimte-ID's mislukken omdat Matrix-ruimte-ID's hoofdlettergevoelig zijn. Bewerk de taak naar de exacte waarde `!room:server` of `room:!room:server` uit Matrix.
    - Kanaal-authenticatiefouten (`unauthorized`, `Forbidden`) betekenen dat bezorging door referenties is geblokkeerd.
    - Als de geïsoleerde uitvoering alleen de stille token retourneert (`NO_REPLY` / `no_reply`), onderdrukt OpenClaw directe uitgaande bezorging en ook het fallback-pad met de in de wachtrij geplaatste samenvatting, dus er wordt niets teruggeplaatst in de chat.
    - Als de agent de gebruiker zelf moet berichten, controleer dan of de taak een bruikbare route heeft (`channel: "last"` met een eerdere chat, of een expliciet kanaal/doel).

  </Accordion>
  <Accordion title="Cron or heartbeat appears to prevent /new-style rollover">
    - Dagelijkse reset en reset na inactiviteit zijn niet gebaseerd op `updatedAt`; zie [Sessiebeheer](/nl/concepts/session#session-lifecycle).
    - Cron-wake-ups, Heartbeat-uitvoeringen, exec-meldingen en Gateway-boekhouding kunnen de sessierij bijwerken voor routering/status, maar ze verlengen `sessionStartedAt` of `lastInteractionAt` niet.
    - Voor legacy rijen die zijn gemaakt voordat die velden bestonden, kan OpenClaw `sessionStartedAt` herstellen uit de transcript-JSONL-sessieheader wanneer het bestand nog beschikbaar is. Legacy inactieve rijen zonder `lastInteractionAt` gebruiken die herstelde starttijd als hun inactiviteitsbasislijn.

  </Accordion>
  <Accordion title="Timezone gotchas">
    - Cron zonder `--tz` gebruikt de tijdzone van de Gateway-host.
    - `at`-schema's zonder tijdzone worden behandeld als UTC.
    - Heartbeat `activeHours` gebruikt geconfigureerde tijdzoneresolutie.

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Automatisering](/nl/automation) — alle automatiseringsmechanismen in één oogopslag
- [Achtergrondtaken](/nl/automation/tasks) — takenboek voor Cron-uitvoeringen
- [Heartbeat](/nl/gateway/heartbeat) — periodieke beurten in de hoofdsessie
- [Tijdzone](/nl/concepts/timezone) — tijdzoneconfiguratie
