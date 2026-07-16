---
read_when:
    - Achtergrondtaken of wake-ups plannen
    - Externe triggers (webhooks, Gmail) koppelen aan OpenClaw
    - Kiezen tussen Heartbeat en Cron voor geplande taken
sidebarTitle: Scheduled tasks
summary: Geplande taken, webhooks en Gmail PubSub-triggers voor de Gateway-planner
title: Geplande taken
x-i18n:
    generated_at: "2026-07-16T15:10:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9a419d4376fa08df1c429c167ead6918262cc34b986a85ffec024023f6da1eef
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron is de ingebouwde planner van de Gateway. Deze bewaart taken, activeert de agent op het juiste moment en kan uitvoer afleveren bij een chatkanaal, een Webhook of nergens.

## Snel aan de slag

<Steps>
  <Step title="Een eenmalige herinnering toevoegen">
    ```bash
    openclaw cron create "2027-02-01T16:00:00Z" \
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
  <Step title="De uitvoeringsgeschiedenis bekijken">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Hoe Cron werkt

- Cron wordt **binnen het Gateway-proces** uitgevoerd, niet binnen het model. De Gateway moet actief zijn om planningen te activeren.
- Taakdefinities, runtimestatus en uitvoeringsgeschiedenis worden bewaard in de gedeelde SQLite-statusdatabase van OpenClaw, zodat planningen bij herstarts niet verloren gaan.
- Elke Cron-uitvoering maakt een record voor een [achtergrondtaak](/nl/automation/tasks).
- Eenmalige taken (`--at`) worden na een geslaagde uitvoering standaard automatisch verwijderd; geef `--keep-after-run` door om ze te behouden.
- Tijdslimiet per uitvoering: `--timeout-seconds` indien ingesteld. Anders worden geïsoleerde/losgekoppelde agentbeurttaken begrensd door de eigen watchdog van Cron van 60 minuten, voordat de onderliggende time-out voor agentbeurten (`agents.defaults.timeoutSeconds`, standaard 48 uur) ooit van toepassing zou zijn; opdrachttaken hebben standaard een limiet van 10 minuten.
- Bij het starten van de Gateway worden achterstallige geïsoleerde agentbeurttaken opnieuw ingepland in plaats van onmiddellijk opnieuw uitgevoerd, zodat initialisatiewerk voor modellen en tools buiten het venster voor kanaalverbindingen blijft.
- Als je `openclaw agent` aanstuurt vanuit systeem-Cron of een andere externe planner, omhul dit dan met escalatie naar gedwongen beëindiging, ook al verwerkt de CLI `SIGTERM`/`SIGINT` al. Door de Gateway ondersteunde uitvoeringen vragen de Gateway om geaccepteerde uitvoeringen af te breken; lokale en ingebedde terugvaluitvoeringen ontvangen hetzelfde afbreeksignaal. Geef voor GNU `timeout` de voorkeur aan `timeout -k 60 600 openclaw agent ...` boven alleen `timeout 600 ...` — de waarde `-k` is het vangnet als het proces niet tijdig kan worden afgerond. Gebruik voor systemd-eenheden een stopsignaal `SIGTERM` met een respijtperiode (`TimeoutStopSec`) vóór de definitieve beëindiging. Als een `--run-id` opnieuw wordt gebruikt terwijl de oorspronkelijke Gateway-uitvoering nog actief is, wordt het duplicaat als actief gemeld in plaats van een tweede uitvoering te starten.

<AccordionGroup>
  <Accordion title="Versterking van geïsoleerde uitvoeringen">
    - Geïsoleerde uitvoeringen proberen bij voltooiing zo goed mogelijk bijgehouden browsertabbladen/-processen voor hun `cron:<jobId>`-sessie te sluiten en verwijderen alle gebundelde MCP-runtime-instanties die voor de taak zijn gemaakt via hetzelfde gedeelde opruimpad dat wordt gebruikt door uitvoeringen in de hoofdsessie en aangepaste sessies. Opruimfouten worden genegeerd, zodat het Cron-resultaat bepalend blijft.
    - Geïsoleerde uitvoeringen met de beperkte toestemming voor zelfopruiming van Cron kunnen de plannerstatus lezen, een op zichzelf gefilterde lijst met alleen hun eigen taak en de uitvoeringsgeschiedenis van die taak, en mogen alleen hun eigen taak verwijderen.
    - Geïsoleerde uitvoeringen beschermen tegen verouderde bevestigingsantwoorden: als het eerste resultaat alleen een tussentijdse statusupdate is (`on it`, `pulling everything together` en vergelijkbare aanwijzingen) en geen onderliggende subagent nog verantwoordelijk is voor het definitieve antwoord, vraagt OpenClaw vóór aflevering eenmaal opnieuw om het daadwerkelijke resultaat.
    - Gestructureerde metagegevens over geweigerde uitvoering (waaronder node-host-wrappers `UNAVAILABLE` waarvan de geneste fout begint met `SYSTEM_RUN_DENIED` of `INVALID_REQUEST`) worden herkend, zodat een geblokkeerde opdracht niet als een geslaagde uitvoering wordt gemeld, terwijl gewone proza van de assistent niet ten onrechte als een weigering wordt beschouwd.
    - Agentfouten op uitvoeringsniveau tellen als taakfouten, zelfs zonder antwoordpayload, zodat model-/providerfouten de fouttellers verhogen en foutmeldingen activeren in plaats van de taak als geslaagd af te handelen.
    - Wanneer een taak `timeoutSeconds` bereikt, breekt Cron de uitvoering af en geeft deze een korte opruimperiode. Als de uitvoering niet wordt afgerond, wist door de Gateway beheerd opruimen geforceerd het sessie-eigenaarschap van die uitvoering voordat Cron de time-out registreert, zodat chatwerk in de wachtrij niet vastzit achter een verouderde verwerkende sessie.
    - Vastlopers tijdens installatie/opstart krijgen een fasespecifieke time-out (bijvoorbeeld `cron: isolated agent setup timed out before runner start` of `cron: isolated agent run stalled before execution start (last phase: context-engine)`). Deze watchdogs bewaken ingebedde en door de CLI ondersteunde providers, zelfs voordat hun externe CLI-proces wordt gestart, en worden onafhankelijk van lange `timeoutSeconds`-waarden begrensd, zodat fouten tijdens koude start, authenticatie of context snel zichtbaar worden.

  </Accordion>
  <Accordion title="Taakreconciliatie">
    Reconciliatie van Cron-taken wordt primair beheerd door de runtime en secundair ondersteund door duurzame geschiedenis: een actieve Cron-taak blijft actief zolang de Cron-runtime die taak nog als actief bijhoudt, zelfs als er nog een oude onderliggende sessierij bestaat. Zodra de runtime niet langer eigenaar is van de taak en een respijtperiode van 5 minuten is verstreken, controleren onderhoudsprocessen de bewaarde uitvoeringslogboeken en taakstatus voor de overeenkomende `cron:<jobId>:<startedAt>`-uitvoering. Een definitief resultaat daarin rondt het taakregister af; anders kan door de Gateway beheerd onderhoud de taak markeren als `lost`. Offline CLI-controle kan herstellen op basis van duurzame geschiedenis, maar een lege verzameling actieve taken in het eigen proces bewijst niet dat een door de Gateway beheerde uitvoering verdwenen is.
  </Accordion>
</AccordionGroup>

## Planningstypen

| Soort     | CLI-vlag    | Beschrijving                                                                                              |
| --------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| `at`      | `--at`      | Eenmalig tijdstip (ISO 8601 of relatief, zoals `20m`)                                                     |
| `every`   | `--every`   | Vast interval (`10m`, `1h`, `1d`)                                                                       |
| `cron`    | `--cron`    | Cron-expressie met 5 of 6 velden en optionele `--tz`                                                  |
| `on-exit` | `--on-exit` | Eenmaal activeren wanneer een bewaakte opdracht wordt afgesloten (gebeurtenistrigger; blijft bestaan na het beëindigen van de beurt; optionele `--on-exit-cwd`) |

Tijdstippen zonder tijdzone worden als UTC beschouwd. Voeg `--tz America/New_York` toe om een `--at`-datum/tijd zonder offset in die IANA-tijdzone te interpreteren of om daarin een Cron-expressie te evalueren. Cron-expressies zonder `--tz` gebruiken de tijdzone van de Gateway-host. `--tz` is niet geldig met `--every` of `--on-exit`.

Terugkerende expressies op het hele uur (minuut `0` met een jokerteken in het uurveld) worden automatisch tot 5 minuten gespreid om belastingpieken te verminderen. Gebruik `--exact` om exacte timing af te dwingen of `--stagger 30s` voor een expliciet venster (alleen Cron-planningen).

### Dag van de maand en dag van de week gebruiken OF-logica

Cron-expressies worden geparseerd door [croner](https://github.com/Hexagon/croner). Wanneer zowel het veld voor de dag van de maand als dat voor de dag van de week geen jokerteken bevat, vindt er bij croner een overeenkomst plaats als **een van beide** velden overeenkomt, niet beide. Dit is standaardgedrag van Vixie Cron.

```bash
# Bedoeld: "9.00 uur op de 15e, alleen als het een maandag is"
# Werkelijk: "9.00 uur op elke 15e, EN 9.00 uur op elke maandag"
0 9 15 * 1
```

Dit wordt ongeveer 5-6 keer per maand geactiveerd in plaats van 0-1 keer per maand. Gebruik de dag-van-de-weekmodifier `+` van croner (`0 9 15 * +1`) om beide voorwaarden te vereisen, of plan op basis van één veld en bewaak het andere in de prompt of opdracht van je taak.

## Gebeurtenistriggers (voorwaardebewakers)

Een gebeurtenistrigger voegt een headless voorwaardescript toe aan een planning `every` of `cron`. Cron evalueert het script wanneer de taak aan de beurt is en voert de normale payload alleen uit wanneer het script `fire: true` retourneert:

```json5
{
  schedule: { kind: "every", everyMs: 30000 },
  trigger: {
    // Wordt alleen geactiveerd wanneer de waargenomen status afwijkt van de vorige evaluatie.
    script: "const res = await tools.call('exec', { command: 'gh pr checks 123 --json state -q \\'.[].state\\' | sort -u' }); const status = String(res?.result?.details?.aggregated ?? '').trim(); json({ fire: status !== trigger.state?.status, message: `PR 123 CI: ${trigger.state?.status ?? 'unknown'} -> ${status}`, state: { status } });",
    once: false,
  },
  payload: { kind: "agentTurn", message: "Onderzoek de wijziging in de CI-status." },
}
```

Het script moet `{ fire, message?, state? }` retourneren. De vorige JSON-status is beschikbaar als de diep bevroren `trigger.state`; retourneer een nieuwe `state`-waarde om deze te bewaren. De status is beperkt tot 16 KB. Wanneer een activeringsresultaat `message` bevat, voegt Cron dit vóór de uitvoering toe aan de tekst van de systeemgebeurtenis of het agentbeurtbericht. `once: true` schakelt de taak uit na de eerste geslaagde geactiveerde payload.

`fire: false` bewaart de evaluatiestatus en tellers en plant vervolgens opnieuw zonder uitvoeringsgeschiedenis te maken. Als een geactiveerde payloaduitvoering mislukt, wordt de geretourneerde `state` **niet** bewaard — de volgende evaluatie ziet de vorige status en kan opnieuw activeren. Schrijf scripts daarom als alleen-lezencontroles en houd acties in de payload. Triggerplanningen hebben een configureerbaar minimuminterval (standaard 30 seconden). Elke evaluatie heeft een tijdslimiet van 30 seconden en maximaal 5 toolaanroepen.

<Warning>
Door `cron.triggers.enabled` in te schakelen, kunnen door agents geschreven scripts headless worden uitgevoerd met het **volledige toolbeleid van de eigenaaragent, inclusief `exec`**. Beschouw dit als uitvoering van onbeheerde code met de machtigingen van die agent; laat dit uitgeschakeld tenzij elke agent die Cron-taken mag maken dienovereenkomstig wordt vertrouwd.
</Warning>

Maak een bewaker vanuit een lokaal scriptbestand (`-` leest het script van stdin):

```bash
openclaw cron add \
  --name "PR CI watcher" \
  --every 30s \
  --trigger-script ./watch-pr-ci.js \
  --message "Respond to the CI status change" \
  --session isolated
```

## Payloads

Elke taak bevat precies één payloadsoort, gekozen via een vlag:

| Payload       | Vlag                                           | Uitvoering                                                    |
| ------------- | ---------------------------------------------- | ------------------------------------------------------- |
| Systeemgebeurtenis  | `--system-event <text>`                        | In de hoofdsessie in de wachtrij geplaatst, zonder zelfstandige modelaanroep |
| Agentbericht | `--message <text>`                             | Een door een model ondersteunde agentbeurt                               |
| Opdracht       | `--command <shell>` of `--command-argv <json>` | Een shell/proces op de Gateway-host, zonder modelaanroep      |

### Opties voor agentbeurten

<ParamField path="--message" type="string" required>
  Prompttekst (vereist voor geïsoleerde/huidige/aangepaste-sessietaken).
</ParamField>
<ParamField path="--model" type="string">
  Modeloverschrijving; moet naar een toegestaan model worden herleid, anders mislukt de uitvoering met een validatiefout.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Lijst met terugvalmodellen per taak, bijvoorbeeld `--fallbacks openai/gpt-5.6-sol,openrouter/meta-llama/llama-3.3-70b-instruct:free`. Geef `--fallbacks ""` door voor een strikte uitvoering zonder terugvalmodellen.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  Bij `cron edit` wordt de terugvaloverschrijving per taak verwijderd, zodat de taak de geconfigureerde terugvalprioriteit volgt. Kan niet worden gecombineerd met `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  Bij `cron edit` wordt de modeloverschrijving per taak verwijderd, zodat de taak de normale Cron-modelprioriteit volgt (opgeslagen overschrijving voor de Cron-sessie, anders het agent-/standaardmodel). Kan niet worden gecombineerd met `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Overschrijving van het denkniveau (`off|minimal|low|medium|high|xhigh|adaptive|max|ultra`). De beschikbare niveaus zijn nog steeds afhankelijk van het geselecteerde model en de agentruntime.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  Bij `cron edit` wordt de denkoverschrijving per taak verwijderd. Kan niet worden gecombineerd met `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Sla het injecteren van bootstrapbestanden voor de werkruimte over.
</ParamField>
<ParamField path="--tools" type="string">
  Beperk welke tools de taak kan gebruiken, bijvoorbeeld `--tools exec,read`.
</ParamField>

`--model` stelt het primaire model van de taak in; dit vervangt geen `/model`-overschrijving voor een sessie, zodat geconfigureerde terugvalketens er nog steeds bovenop worden toegepast. Een model dat niet kan worden herleid of niet is toegestaan, laat de uitvoering mislukken met een expliciete validatiefout in plaats van stilzwijgend terug te vallen op de standaardwaarde. Als een taak `--model` heeft maar geen expliciete of geconfigureerde terugvallijst, geeft OpenClaw een lege terugvaloverschrijving door in plaats van stilzwijgend het primaire agentmodel toe te voegen als verborgen doel voor een nieuwe poging.

Prioriteit voor modelselectie bij geïsoleerde taken, van hoog naar laag:

1. `model` in de payload per taak (expliciete configuratie; een niet-toegestaan model laat de uitvoering mislukken)
2. Modeloverschrijving van de Gmail-hook (alleen wanneer de uitvoering afkomstig is van Gmail en die overschrijving is toegestaan)
3. Door de gebruiker geselecteerde, opgeslagen modeloverschrijving voor de Cron-sessie
4. Modelselectie van de agent/standaardwaarde

De snelle modus volgt de herleide actieve selectie. Als de geselecteerde modelconfiguratie `params.fastMode` bevat, gebruikt geïsoleerde Cron dit standaard; een opgeslagen `fastMode`-overschrijving voor de sessie (en daarna een `fastModeDefault` van de agent) heeft in beide richtingen nog steeds voorrang op de modelconfiguratie. De automatische modus gebruikt de `params.fastAutoOnSeconds`-grenswaarde van het model, standaard 60 seconden.

Als tijdens een uitvoering een actieve overdracht vanwege een modelwissel plaatsvindt, probeert Cron het opnieuw met de gewisselde provider/het gewisselde model en bewaart die selectie (en elk nieuw authenticatieprofiel) voor de actieve uitvoering. Het aantal nieuwe pogingen is begrensd: na de eerste poging plus 2 nieuwe pogingen vanwege een wissel breekt Cron af in plaats van in een lus te blijven.

Voordat een geïsoleerde uitvoering begint, controleert OpenClaw bereikbare lokale eindpunten voor geconfigureerde `api: "ollama"`- en `api: "openai-completions"`-providers waarvan `baseUrl` een loopbackadres, privénetwerkadres of `.local` is. Deze voorafgaande controle doorloopt de geconfigureerde terugvalketen van de taak en markeert de uitvoering pas als `skipped` wanneer elke kandidaat onbereikbaar is; met `--fallbacks ""` blijft deze doorloop strikt beperkt tot alleen het primaire model. Bij een niet-beschikbaar eindpunt wordt de uitvoering geregistreerd als `skipped` met een duidelijke fout, in plaats van een modelaanroep te starten. Het resultaat wordt 5 minuten per eindpunt gecachet (niet per taak of model), zodat veel vervallende taken die dezelfde niet-beschikbare lokale Ollama-/vLLM-/SGLang-/LM Studio-server delen, één controle kosten in plaats van een storm aan verzoeken. Overgeslagen uitvoeringen na de voorafgaande controle verhogen de wachttijd na uitvoeringsfouten niet; stel `failureAlert.includeSkipped` in om herhaalde waarschuwingen over overslaan in te schakelen.

### Opdrachtpayloads

Opdrachtpayloads voeren deterministische scripts uit binnen de Gateway-planner zonder een modelondersteunde beurt te starten. Ze worden uitgevoerd op de Gateway-host, leggen stdout/stderr vast, registreren de uitvoering in de Cron-geschiedenis en hergebruiken dezelfde leveringsmodi `announce`, `webhook` en `none` als taken met agentbeurten.

<Note>
Cron voor opdrachten is een Gateway-automatiseringsoppervlak voor operatorbeheerders, geen `tools.exec`-aanroep door een agent. Voor het maken, bijwerken, verwijderen of handmatig uitvoeren van Cron-taken is `operator.admin` vereist; geplande opdrachtuitvoeringen worden later binnen het Gateway-proces uitgevoerd als die door een beheerder opgestelde automatisering. Het uitvoeringsbeleid voor agents (`tools.exec.mode`, goedkeuringsvragen, toegestane tools per agent) is van toepassing op uitvoeringstools die zichtbaar zijn voor modellen, niet op opdrachtpayloads van Cron.
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Wachtrijdiepte controleren" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` slaat `argv: ["sh", "-lc", <shell>]` op. Gebruik `--command-argv '["node","scripts/report.mjs"]'` voor exacte argv-uitvoering zonder shell-parsing. De optionele `--command-env KEY=VALUE` (herhaalbaar), `--command-input`, `--timeout-seconds` (standaard 10 minuten), `--no-output-timeout-seconds` en `--output-max-bytes` beheren de procesomgeving, stdin en uitvoerlimieten.

De geleverde tekst wordt afgeleid van de procesuitvoer: niet-lege stdout heeft voorrang; als stdout leeg is en stderr niet leeg, wordt stderr geleverd; als beide aanwezig zijn, verzendt Cron een klein `stdout:`-/`stderr:`-blok. Afsluitcode `0` registreert de uitvoering als `ok`; een afsluitcode die niet nul is, een signaal, een time-out of een time-out wegens ontbrekende uitvoer registreert `error` en kan foutwaarschuwingen activeren. Een opdracht die alleen `NO_REPLY` afdrukt, gebruikt de normale onderdrukking van stille tokens van Cron en plaatst niets terug in de chat.

## Uitvoeringsstijlen

| Stijl           | Waarde van `--session`   | Wordt uitgevoerd in                  | Het meest geschikt voor                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Hoofdsessie    | `main`              | Speciale Cron-activeringsbaan | Herinneringen, systeemgebeurtenissen        |
| Geïsoleerd        | `isolated`          | Speciale `cron:<jobId>` | Rapporten, achtergrondtaken      |
| Huidige sessie | `current`           | Gebonden tijdens het maken   | Contextbewust terugkerend werk    |
| Aangepaste sessie  | `session:custom-id` | Permanente benoemde sessie | Workflows die voortbouwen op geschiedenis |

<AccordionGroup>
  <Accordion title="Hoofdsessie versus geïsoleerd versus aangepast">
    Taken voor de **hoofdsessie** plaatsen een systeemgebeurtenis in een uitvoeringsbaan die eigendom is van Cron en activeren optioneel de Heartbeat (`--wake now` of `--wake next-heartbeat`). Ze kunnen de laatste leveringscontext van de doelhoofdsessie gebruiken voor antwoorden, maar voegen routinematige Cron-beurten niet toe aan de menselijke chatbaan en verlengen de versheid voor dagelijkse/inactieve resets van de doelsessie niet. **Geïsoleerde** taken voeren een speciale agentbeurt uit met een nieuwe sessie. **Aangepaste sessies** (`session:xxx`) behouden context tussen uitvoeringen, wat workflows mogelijk maakt zoals dagelijkse stand-ups die voortbouwen op eerdere samenvattingen.

    Cron-gebeurtenissen voor de hoofdsessie zijn zelfstandige herinneringen in de vorm van systeemgebeurtenissen. Ze bevatten niet automatisch de instructie "Read HEARTBEAT.md" uit de standaard-Heartbeat-prompt; vermeld dit expliciet in de tekst van de Cron-gebeurtenis als een herinnering `HEARTBEAT.md` moet raadplegen.

  </Accordion>
  <Accordion title="Wat 'nieuwe sessie' betekent voor geïsoleerde taken">
    Een nieuwe transcript-/sessie-id per uitvoering. OpenClaw neemt veilige voorkeuren over (instellingen voor denken/snel/uitgebreid, labels, expliciete door de gebruiker geselecteerde model-/authenticatieoverschrijvingen), maar neemt geen omgevingscontext van gesprekken over uit een oudere Cron-rij: routering naar kanaal/groep, verzend- of wachtrijbeleid, verhoging van bevoegdheden, oorsprong of ACP-runtimebinding. Gebruik `current` of `session:<id>` wanneer een terugkerende taak bewust moet voortbouwen op dezelfde gesprekscontext.
  </Accordion>
  <Accordion title="Levering door subagents en Discord">
    Wanneer geïsoleerde Cron-uitvoeringen subagents orkestreren, heeft bij de levering de uiteindelijke uitvoer van de laatste afstammeling voorrang op verouderde tussentijdse tekst van de ouder. Als afstammelingen nog worden uitgevoerd, onderdrukt OpenClaw die gedeeltelijke update van de ouder in plaats van deze aan te kondigen.

    Voor Discord-aankondigingsdoelen met alleen tekst verzendt OpenClaw de canonieke definitieve assistenttekst één keer, in plaats van zowel gestreamde/tussentijdse tekst als het definitieve antwoord opnieuw af te spelen. Media en gestructureerde Discord-payloads worden nog steeds afzonderlijk geleverd, zodat bijlagen en componenten niet verloren gaan.

  </Accordion>
</AccordionGroup>

## Levering en uitvoer

| Modus       | Wat er gebeurt                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Lever de definitieve tekst als terugval aan het doel als de agent niets heeft verzonden |
| `webhook`  | POST de payload van de voltooide gebeurtenis naar een URL                                |
| `none`     | Geen terugvallevering door de uitvoerder                                         |

Gebruik `--announce --channel telegram --to "-1001234567890"` voor levering via een kanaal. Gebruik voor Telegram-forumonderwerpen `-1001234567890:topic:123`; OpenClaw accepteert ook de Telegram-specifieke verkorte notatie `-1001234567890:123`. Rechtstreekse RPC-/configuratieaanroepers mogen `delivery.threadId` doorgeven als tekenreeks of getal. Doelen voor Slack/Discord/Mattermost gebruiken expliciete voorvoegsels (`channel:<id>`, `user:<id>`). Matrix-ruimte-id's zijn hoofdlettergevoelig; gebruik de exacte ruimte-id of de `room:!room:server`-vorm van Matrix.

Wanneer aankondigingslevering `channel: "last"` gebruikt of `channel` weglaat, kan een doel met providerprefix zoals `telegram:123` het kanaal selecteren voordat Cron terugvalt op de sessiegeschiedenis of één geconfigureerd kanaal. Alleen voorvoegsels die door de geladen Plugin worden aangeboden, zijn providerselectoren. Als `delivery.channel` expliciet is, moet het doelvoorvoegsel dezelfde provider noemen; `channel: "whatsapp"` met `to: "telegram:123"` wordt geweigerd in plaats van WhatsApp de Telegram-id als telefoonnummer te laten interpreteren. Voorvoegsels voor doeltype en dienst (`channel:<id>`, `user:<id>`, `imessage:<handle>`, `sms:<number>`) blijven doelsyntaxis die eigendom is van het kanaal, geen providerselectoren.

Voor geïsoleerde taken wordt chatlevering gedeeld: als een chatroute beschikbaar is, kan de agent de tool `message` gebruiken, zelfs met `--no-deliver`. Als de agent naar het geconfigureerde/huidige doel verzendt, slaat OpenClaw de terugvalaankondiging over. Anders bepalen `announce`, `webhook` en `none` alleen wat de uitvoerder met het definitieve antwoord doet na de agentbeurt.

Wanneer een agent vanuit een actieve chat een geïsoleerde herinnering maakt, slaat OpenClaw het behouden actieve leveringsdoel op voor de terugvalroute voor aankondigingen. Interne sessiesleutels kunnen kleine letters bevatten; providerleveringsdoelen worden niet uit die sleutels gereconstrueerd wanneer de huidige chatcontext beschikbaar is.

Impliciete aankondigingslevering gebruikt geconfigureerde kanaaltoelatingslijsten om verouderde doelen te valideren en om te leiden. Goedkeuringen in het koppelingsarchief voor privéberichten zijn geen ontvangers van terugvalautomatisering; stel `delivery.to` in of configureer de kanaalvermelding `allowFrom` wanneer een geplande taak proactief naar een privébericht moet verzenden.

### Foutmeldingen

Foutmeldingen volgen een afzonderlijk bestemmingspad:

- `cron.failureDestination` stelt een algemene standaardwaarde voor foutmeldingen in.
- `job.delivery.failureDestination` overschrijft die per taak.
- Als geen van beide is ingesteld en de taak al via `announce` levert, vallen foutmeldingen terug op dat primaire aankondigingsdoel.
- `delivery.failureDestination` wordt alleen ondersteund voor `sessionTarget="isolated"`-taken, tenzij de primaire leveringsmodus `webhook` is.
- `failureAlert.includeSkipped: true` schakelt voor een taak of algemeen Cron-waarschuwingsbeleid herhaalde waarschuwingen voor overgeslagen uitvoeringen in. Overgeslagen uitvoeringen houden een afzonderlijke teller voor opeenvolgende overslagen bij en hebben daardoor geen invloed op de back-off voor uitvoeringsfouten.
- `openclaw cron edit` maakt afstemming van waarschuwingen per taak mogelijk: `--failure-alert`/`--no-failure-alert`, `--failure-alert-after <n>`, `--failure-alert-channel`, `--failure-alert-to`, `--failure-alert-cooldown`, `--failure-alert-include-skipped`/`--failure-alert-exclude-skipped`, `--failure-alert-mode` en `--failure-alert-account-id`.

### Uitvoertaal

Cron-taken leiden geen antwoordtaal af uit het kanaal, de landinstelling of eerdere berichten. Neem de taalregel op in het geplande bericht of de sjabloon:

```bash
openclaw cron edit <jobId> \
  --message "Vat de updates samen. Antwoord in het Chinees; laat URL's, code en productnamen ongewijzigd."
```

Houd bij sjabloonbestanden de taalinstructie in de gerenderde prompt en controleer voordat de taak wordt uitgevoerd of tijdelijke aanduidingen zoals `{{language}}` zijn ingevuld. Als de uitvoer talen mengt, maak de regel dan expliciet, bijvoorbeeld: "Gebruik Chinees voor beschrijvende tekst en behoud technische termen in het Engels."

## CLI-voorbeelden

<Tabs>
  <Tab title="Eenmalige herinnering">
    ```bash
    openclaw cron add \
      --name "Agendacontrole" \
      --at "20m" \
      --session main \
      --system-event "Volgende heartbeat: controleer de agenda." \
      --wake now
    ```
  </Tab>
  <Tab title="Terugkerende geïsoleerde taak">
    ```bash
    openclaw cron create "0 7 * * *" \
      "Vat de updates van vannacht samen." \
      --name "Ochtendoverzicht" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="Model- en denkoverschrijving">
    ```bash
    openclaw cron add \
      --name "Diepgaande analyse" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Wekelijkse diepgaande analyse van de projectvoortgang." \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
  <Tab title="Webhook-uitvoer">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Vat de implementaties van vandaag samen als JSON." \
      --name "Implementatieoverzicht" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Opdrachtuitvoer">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "Controle van wachtrijdiepte" \
      --command "scripts/check-queue.sh" \
      --command-cwd "/srv/app" \
      --announce \
      --channel telegram \
      --to "-1001234567890"
    ```
  </Tab>
</Tabs>

## Taken beheren

```bash
# Alle taken weergeven
openclaw cron list

# Eén opgeslagen taak ophalen als JSON
openclaw cron get <jobId>

# Eén taak weergeven, inclusief de bepaalde leveringsroute
openclaw cron show <jobId>

# In-/uitschakelen zonder te verwijderen
openclaw cron enable <jobId>
openclaw cron disable <jobId>

# Een taak bewerken
openclaw cron edit <jobId> --message "Bijgewerkte prompt" --model "opus"

# Een taak nu geforceerd uitvoeren
openclaw cron run <jobId>

# Een taak nu geforceerd uitvoeren en op de eindstatus wachten
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Alleen uitvoeren als de taak aan de beurt is
openclaw cron run <jobId> --due

# Uitvoeringsgeschiedenis bekijken
openclaw cron runs --id <jobId> --limit 50

# Eén specifieke uitvoering bekijken
openclaw cron runs --id <jobId> --run-id <runId>

# Een taak verwijderen
openclaw cron remove <jobId>

# Agentselectie (opstellingen met meerdere agents)
openclaw cron create "0 6 * * *" "Controleer de operationele wachtrij" --name "Operationele controle" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

Het archiveren van een sessie (Control UI, of `sessions.patch { archived: true }` van een aanroepende operatorbeheerder) schakelt elke ingeschakelde Cron-taak uit die aan die sessie is gekoppeld: de geïsoleerde `cron:<jobId>`-sessie, een `session:<key>`-doel of een `sessionKey`-route voor levering/activering. Het herstellen van de sessie schakelt deze taken niet opnieuw in; gebruik `openclaw cron enable <jobId>`. Sessies met een ingeschakelde gekoppelde taak tonen een klokbadge in de zijbalk van de Control UI.

`openclaw cron run <jobId>` keert terug nadat de handmatige uitvoering in de wachtrij is geplaatst. Gebruik `--wait` voor afsluitingshooks, onderhoudsscripts of andere automatisering die moet blokkeren totdat de uitvoering in de wachtrij is voltooid; deze peilt de geretourneerde `runId` (standaardtime-out `10m`, peilinterval `2s`) en sluit af met `0` voor status `ok`, en met een andere waarde dan nul voor `error`, `skipped` of een wachttime-out.

De agenttool `cron` retourneert compacte taaksamenvattingen (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) uit `cron(action: "list")`; gebruik `cron(action: "get", jobId: "...")` voor één volledige taakdefinitie. Rechtstreekse Gateway-aanroepers kunnen `compact: true` doorgeven aan `cron.list`; als je dit weglaat, blijft het volledige antwoord met leveringsvoorbeelden behouden.

`openclaw cron create` is een alias voor `openclaw cron add`. Nieuwe taken kunnen een positioneel schema gebruiken (`"0 9 * * 1"`, `"every 1h"`, `"20m"` of een ISO-tijdstempel), gevolgd door een positionele agentprompt. Gebruik `--webhook <url>` bij `cron add|create` of `cron edit` om de voltooide uitvoeringspayload via POST naar een HTTP-eindpunt te sturen; Webhook-levering kan niet worden gecombineerd met vlaggen voor chatlevering (`--announce`, `--channel`, `--to`, `--thread-id`, `--account`). Bij `cron edit`, `--clear-channel`, `--clear-to`, `--clear-thread-id` en `--clear-account` maak je die routeringsvelden afzonderlijk ongedaan (elk wordt geweigerd naast de bijbehorende instelvlag) — anders dan `--no-deliver`, dat alleen terugvallevering door de runner uitschakelt.

<Note>
Opmerking over modeloverschrijving:

- `openclaw cron add|edit --model ...` wijzigt het geselecteerde model van de taak.
- Als het model is toegestaan, bereikt precies die provider/dat model de geïsoleerde agentuitvoering.
- Als het niet is toegestaan of niet kan worden bepaald, laat Cron de uitvoering mislukken met een expliciete validatiefout.
- API-payloadpatches voor `cron.update` kunnen `model: null` instellen om een opgeslagen modeloverschrijving voor een taak te wissen.
- `openclaw cron edit <job-id> --clear-model` wist die overschrijving vanuit de CLI (hetzelfde effect als de `model: null`-patch) en kan niet worden gecombineerd met `--model`.
- Geconfigureerde terugvalketens blijven van toepassing omdat Cron-`--model` het primaire model van een taak is en geen `/model`-overschrijving van een sessie.
- `openclaw cron add|edit --fallbacks ...` stelt payload-`fallbacks` in en vervangt de geconfigureerde terugvalmodellen voor die taak; `--fallbacks ""` schakelt terugval uit en maakt de uitvoering strikt. `openclaw cron edit <job-id> --clear-fallbacks` wist de overschrijving per taak.
- Een gewone `--model` zonder expliciete of geconfigureerde lijst met terugvalmodellen valt niet terug op het primaire agentmodel als stil extra doel voor nieuwe pogingen.

</Note>

## Webhooks

Gateway kan HTTP-Webhook-eindpunten beschikbaar stellen voor externe triggers. Schakel deze in de configuratie in:

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

Tokens in queryreeksen worden geweigerd.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Plaats een systeemgebeurtenis voor de hoofdsessie in de wachtrij:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"Nieuwe e-mail ontvangen","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      Beschrijving van de gebeurtenis.
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
      -d '{"message":"Vat de inbox samen","name":"E-mail","model":"openai/gpt-5.6-sol"}'
    ```

    Velden: `message` (verplicht), `name`, `agentId`, `sessionKey` (vereist `hooks.allowRequestSessionKey=true`), `idempotencyKey`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Toegewezen hooks (POST /hooks/<name>)">
    Aangepaste hooknamen worden bepaald via `hooks.mappings` in de configuratie. Toewijzingen kunnen willekeurige payloads met sjablonen of codetransformaties omzetten in `wake`- of `agent`-acties.
  </Accordion>
</AccordionGroup>

<Warning>
Houd hookeindpunten achter loopback, tailnet of een vertrouwde reverse proxy.

- Gebruik een speciaal hooktoken; hergebruik geen authenticatietokens van de Gateway.
- Houd `hooks.path` op een afzonderlijk subpad; `/` wordt geweigerd.
- Stel `hooks.allowedAgentIds` in om te beperken op welke effectieve agent een hook zich kan richten, inclusief de standaardagent wanneer `agentId` wordt weggelaten.
- Behoud `hooks.allowRequestSessionKey=false`, tenzij door de aanroeper geselecteerde sessies vereist zijn.
- Als je `hooks.allowRequestSessionKey` inschakelt, stel dan ook `hooks.allowedSessionKeyPrefixes` in om toegestane vormen van sessiesleutels te beperken.
- Hookpayloads worden standaard omgeven door veiligheidsgrenzen.

</Warning>

## Gmail PubSub-integratie

Koppel triggers voor de Gmail-inbox via Google PubSub aan OpenClaw.

<Note>
**Vereisten:** `gcloud`-CLI, `gog` (gogcli), ingeschakelde OpenClaw-hooks, Tailscale voor het openbare HTTPS-eindpunt.
</Note>

### Installatie met wizard (aanbevolen)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Hiermee wordt de configuratie voor `hooks.gmail` geschreven, wordt de Gmail-voorinstelling ingeschakeld en wordt standaard Tailscale Funnel gebruikt voor het push-eindpunt (`--tailscale funnel|serve|off`).

<Warning>
De sessie per bericht van de Gmail-voorinstelling scheidt de gesprekscontext; deze beperkt niet de tools of werkruimte van de doelagent. Zonder een aangepaste toewijzing die `agentId` instelt, worden Gmail-hooks als de standaardagent uitgevoerd.

Routeer bij niet-vertrouwde inboxen de hook naar een speciale leesagent, geef die agent alleen-lezen- of geen toegang tot de werkruimte en weiger schrijftoegang tot het bestandssysteem, shell, browser en andere onnodige tools. Als deze de hoofdagent moet waarschuwen, sta dan alleen de vereiste overdracht tussen agents toe. Zie [Promptinjectie](/nl/gateway/security#prompt-injection), [Sandbox en tools voor meerdere agents](/nl/tools/multi-agent-sandbox-tools) en [`tools.agentToAgent`](/nl/gateway/config-tools#toolsagenttoagent).
</Warning>

### Gateway automatisch starten

Wanneer `hooks.enabled=true` en `hooks.gmail.account` zijn ingesteld, start de Gateway `gog gmail watch serve` tijdens het opstarten en vernieuwt deze de bewaking automatisch. Stel `OPENCLAW_SKIP_GMAIL_WATCHER=1` in om dit uit te schakelen.

### Eenmalige handmatige installatie

<Steps>
  <Step title="Selecteer het GCP-project">
    Selecteer het GCP-project dat eigenaar is van de OAuth-client die door `gog` wordt gebruikt:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Maak een topic en verleen toegang voor Gmail-pushmeldingen">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Start de bewaking">
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
      model: "openai/gpt-5.6-sol",
      thinking: "high",
    },
  },
}
```

Gebruik voor niet-vertrouwde inboxen het model van de nieuwste generatie en hoogste klasse dat bij je provider beschikbaar is. De bovenstaande waarde is een voorbeeld; het model moet in je geconfigureerde catalogus en toelatingslijst voorkomen.

## Configuratie

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
    triggers: {
      enabled: false,
      minIntervalMs: 30000,
    },
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
  },
}
```

De bovenstaande waarden voor `retry` zijn de standaardwaarden: maximaal 3 nieuwe pogingen met `30s/60s/5m`-wachttijden, waarbij voor alle vijf tijdelijke categorieën opnieuw wordt geprobeerd. `webhookToken` wordt bij POST-verzoeken naar Cron-webhooks verzonden als `Authorization: Bearer <token>`.

`maxConcurrentRuns` beperkt zowel geplande Cron-dispatches als de uitvoering van geïsoleerde agentbeurten en heeft standaard de waarde 8. Geïsoleerde Cron-agentbeurten gebruiken intern de speciale `cron-nested`-uitvoeringsbaan van de wachtrij. Als je deze waarde verhoogt, kunnen onafhankelijke Cron-LLM-uitvoeringen parallel doorgaan in plaats van dat alleen hun buitenste Cron-wrappers worden gestart. De gedeelde niet-Cron-baan `nested` wordt door deze instelling niet verbreed.

`cron.store` is een logische opslagsleutel en migratiepad voor doctor, geen actief JSON-bestand dat je handmatig moet bewerken. Taakgegevens bevinden zich in SQLite; gebruik de CLI of Gateway-API voor wijzigingen.

Cron uitschakelen: `cron.enabled: false` of `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Gedrag bij nieuwe pogingen">
    **Nieuwe poging voor eenmalige taken**: bij tijdelijke fouten (snelheidslimiet, overbelasting, netwerk, time-out, serverfout) wordt maximaal `retry.maxAttempts` keer opnieuw geprobeerd (standaard 3), met `retry.backoffMs` (standaard 30s, 60s, 5m). Bij permanente fouten wordt de taak onmiddellijk uitgeschakeld.

    **Nieuwe poging voor terugkerende taken**: bij opeenvolgende uitvoeringsfouten wordt een uitgebreid wachttijdschema gebruikt (30s, 60s, 5m, 15m, 60m). Na de volgende geslaagde uitvoering wordt de wachttijd opnieuw ingesteld.

  </Accordion>
  <Accordion title="Onderhoud">
    `cron.sessionRetention` (standaard `24h`, `false` schakelt dit uit) verwijdert vermeldingen van geïsoleerde uitvoeringssessies. De uitvoeringsgeschiedenis behoudt per taak de nieuwste 2000 terminale rijen; verloren rijen behouden hun opschoningsvenster van 24 uur.
  </Accordion>
  <Accordion title="Migratie van verouderde opslag">
    Voer na een upgrade `openclaw doctor --fix` uit om verouderde bestanden `~/.openclaw/cron/jobs.json`, `jobs-state.json` en `runs/*.jsonl` in SQLite te importeren en ze te hernoemen met het achtervoegsel `.migrated`. Ongeldige taakrijen worden tijdens runtime overgeslagen en naar `jobs-quarantine.json` gekopieerd voor latere reparatie of controle.
  </Accordion>
</AccordionGroup>

## Problemen oplossen

### Opdrachtvolgorde

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
    - Controleer of de Gateway continu actief is.
    - Controleer voor `cron`-schema's de tijdzone (`--tz`) ten opzichte van de tijdzone van de host.
    - `reason: not-due` in de uitvoer betekent dat de handmatige uitvoering is gecontroleerd met `openclaw cron run <jobId> --due` en dat het tijdstip voor de taak nog niet was aangebroken.

  </Accordion>
  <Accordion title="Cron is geactiveerd, maar er vindt geen bezorging plaats">
    - Bij bezorgingsmodus `none` wordt geen terugvalverzending door de uitvoerder verwacht. De agent kan nog steeds rechtstreeks verzenden met het hulpmiddel `message` wanneer er een chatroute beschikbaar is.
    - Een ontbrekend of ongeldig bezorgingsdoel (`channel`/`to`) betekent dat uitgaande verzending is overgeslagen.
    - Bij Matrix kunnen gekopieerde of verouderde taken met kamer-ID's in kleine letters voor `delivery.to` mislukken, omdat Matrix-kamer-ID's hoofdlettergevoelig zijn. Bewerk de taak en gebruik exact de waarde `!room:server` of `room:!room:server` uit Matrix.
    - Authenticatiefouten van het kanaal (`unauthorized`, `Forbidden`) betekenen dat de bezorging door de aanmeldgegevens is geblokkeerd.
    - Als de geïsoleerde uitvoering alleen het stille token (`NO_REPLY` / `no_reply`) retourneert, onderdrukt OpenClaw zowel rechtstreekse uitgaande bezorging als het terugvalpad met een samenvatting in de wachtrij, waardoor er niets in de chat wordt geplaatst.
    - Als de agent zelf een bericht naar de gebruiker moet sturen, controleer dan of de taak een bruikbare route heeft (`channel: "last"` met een eerdere chat, of een expliciet kanaal/doel).

  </Accordion>
  <Accordion title="Cron of Heartbeat lijkt rollover in /new-stijl te voorkomen">
    - De actualiteit voor dagelijkse en inactiviteitsresets is niet gebaseerd op `updatedAt`; zie [Sessiebeheer](/nl/concepts/session#session-lifecycle).
    - Cron-wekacties, Heartbeat-uitvoeringen, exec-meldingen en Gateway-administratie kunnen de sessierij bijwerken voor routering/status, maar verlengen `sessionStartedAt` of `lastInteractionAt` niet.
    - Voor verouderde rijen die zijn aangemaakt voordat deze velden bestonden, kan OpenClaw `sessionStartedAt` herstellen uit de JSONL-sessieheader van het transcript als het bestand nog beschikbaar is. Verouderde inactieve rijen zonder `lastInteractionAt` gebruiken die herstelde starttijd als uitgangspunt voor hun inactiviteit.

  </Accordion>
  <Accordion title="Valkuilen met tijdzones">
    - Cron zonder `--tz` gebruikt de tijdzone van de Gateway-host.
    - `at`-schema's zonder tijdzone worden als UTC behandeld.
    - Heartbeat `activeHours` gebruikt de geconfigureerde tijdzonebepaling.

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Automatisering](/nl/automation) — alle automatiseringsmechanismen in één oogopslag
- [Achtergrondtaken](/nl/automation/tasks) — takenregister voor Cron-uitvoeringen
- [Heartbeat](/nl/gateway/heartbeat) — periodieke beurten in de hoofdsessie
- [Tijdzone](/nl/concepts/timezone) — tijdzoneconfiguratie
