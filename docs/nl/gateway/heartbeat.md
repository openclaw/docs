---
read_when:
    - Heartbeat-cadans of berichtgeving aanpassen
    - Kiezen tussen Heartbeat en Cron voor geplande taken
sidebarTitle: Heartbeat
summary: Heartbeat-pollingberichten en meldingsregels
title: Heartbeat
x-i18n:
    generated_at: "2026-06-27T17:34:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 415c8f8f18143320a015e44237471b09b8fc091975f78dd9de025310df39645b
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat versus cron?** Zie [Automatisering](/nl/automation) voor richtlijnen over wanneer u welke gebruikt.
</Note>

Heartbeat voert **periodieke agentbeurten** uit in de hoofdsessie, zodat het model alles kan signaleren wat aandacht nodig heeft zonder u te spammen.

Heartbeat is een geplande beurt in de hoofdsessie — het maakt **geen** records voor [achtergrondtaken](/nl/automation/tasks) aan. Taakrecords zijn bedoeld voor losgekoppeld werk (ACP-runs, subagents, geïsoleerde cron-taken).

Probleemoplossing: [Geplande taken](/nl/automation/cron-jobs#troubleshooting)

## Snel aan de slag (beginner)

<Steps>
  <Step title="Kies een interval">
    Laat heartbeats ingeschakeld (standaard is `30m`, of `1h` voor Anthropic OAuth/token-authenticatie, inclusief hergebruik van Claude CLI) of stel uw eigen interval in.
  </Step>
  <Step title="Voeg HEARTBEAT.md toe (optioneel)">
    Maak een kleine `HEARTBEAT.md`-checklist of een `tasks:`-blok in de agentwerkruimte.
  </Step>
  <Step title="Bepaal waar heartbeat-berichten naartoe moeten">
    `target: "none"` is de standaard; stel `target: "last"` in om naar het laatste contact te routeren.
  </Step>
  <Step title="Optionele afstemming">
    - Schakel levering van heartbeat-redenering in voor transparantie.
    - Gebruik lichte bootstrapcontext als heartbeat-runs alleen `HEARTBEAT.md` nodig hebben.
    - Schakel geïsoleerde sessies in om te voorkomen dat bij elke heartbeat de volledige gespreksgeschiedenis wordt verzonden.
    - Beperk heartbeats tot actieve uren (lokale tijd).

  </Step>
</Steps>

Voorbeeldconfiguratie:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        directPolicy: "allow", // default: allow direct/DM targets; set "block" to suppress
        lightContext: true, // optional: only inject HEARTBEAT.md from bootstrap files
        isolatedSession: true, // optional: fresh session each run (no conversation history)
        skipWhenBusy: true, // optional: also defer when this agent's subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Thinking` message too
      },
    },
  },
}
```

## Standaarden

- Interval: `30m` (of `1h` wanneer Anthropic OAuth/token-authenticatie de gedetecteerde auth-modus is, inclusief hergebruik van Claude CLI). Stel `agents.defaults.heartbeat.every` of per agent `agents.list[].heartbeat.every` in; gebruik `0m` om uit te schakelen.
- Prompttekst (configureerbaar via `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Time-out: niet-ingestelde heartbeat-beurten gebruiken `agents.defaults.timeoutSeconds` wanneer ingesteld. Anders gebruiken ze het heartbeat-interval, begrensd op 600 seconden. Stel `agents.defaults.heartbeat.timeoutSeconds` of per agent `agents.list[].heartbeat.timeoutSeconds` in voor langer heartbeat-werk.
- De heartbeat-prompt wordt **letterlijk** verzonden als gebruikersbericht. De systeemprompt bevat alleen een sectie "Heartbeat" wanneer heartbeats zijn ingeschakeld voor de standaardagent, en de run wordt intern gemarkeerd.
- Wanneer heartbeats zijn uitgeschakeld met `0m`, laten normale runs ook `HEARTBEAT.md` weg uit de bootstrapcontext, zodat het model heartbeat-specifieke instructies niet ziet.
- Actieve uren (`heartbeat.activeHours`) worden gecontroleerd in de geconfigureerde tijdzone. Buiten het venster worden heartbeats overgeslagen tot de volgende tick binnen het venster.
- Heartbeats worden automatisch uitgesteld terwijl cron-werk actief is of in de wachtrij staat. Stel `heartbeat.skipWhenBusy: true` in om een agent ook uit te stellen op zijn eigen sessie-gekoppelde subagent of geneste opdrachtbanen; sibling agents pauzeren niet langer alleen omdat een andere agent subagentwerk in uitvoering heeft.

## Waar de heartbeat-prompt voor dient

De standaardprompt is bewust breed:

- **Achtergrondtaken**: "Consider outstanding tasks" spoort de agent aan om follow-ups te bekijken (inbox, agenda, herinneringen, werk in de wachtrij) en alles wat urgent is te signaleren.
- **Menselijke check-in**: "Checkup sometimes on your human during day time" spoort een incidenteel licht "iets nodig?"-bericht aan, maar voorkomt nachtelijke spam door uw geconfigureerde lokale tijdzone te gebruiken (zie [Tijdzone](/nl/concepts/timezone)).

Heartbeat kan reageren op voltooide [achtergrondtaken](/nl/automation/tasks), maar een heartbeat-run zelf maakt geen taakrecord aan.

Als u wilt dat een heartbeat iets heel specifieks doet (bijv. "check Gmail PubSub stats" of "verify gateway health"), stel `agents.defaults.heartbeat.prompt` (of `agents.list[].heartbeat.prompt`) in op een aangepaste tekst (letterlijk verzonden).

## Responscontract

- Als niets aandacht nodig heeft, antwoord dan met **`HEARTBEAT_OK`**.
- Heartbeat-runs met tools kunnen in plaats daarvan `heartbeat_respond` aanroepen met `notify: false` voor geen zichtbare update, of `notify: true` plus `notificationText` voor een waarschuwing. Wanneer aanwezig heeft de gestructureerde toolrespons voorrang op de tekstfallback.
- Tijdens heartbeat-runs behandelt OpenClaw `HEARTBEAT_OK` als een bevestiging wanneer het aan het **begin of einde** van het antwoord staat. Het token wordt verwijderd en het antwoord wordt weggegooid als de resterende inhoud **≤ `ackMaxChars`** is (standaard: 300).
- Als `HEARTBEAT_OK` in het **midden** van een antwoord staat, wordt het niet speciaal behandeld.
- Neem bij waarschuwingen **geen** `HEARTBEAT_OK` op; retourneer alleen de waarschuwingstekst.

Buiten heartbeats wordt een losse `HEARTBEAT_OK` aan het begin/einde van een bericht verwijderd en gelogd; een bericht dat alleen `HEARTBEAT_OK` is, wordt weggegooid.

## Configuratie

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Thinking message when available)
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "imessage")
        to: "+15551234567", // optional channel-specific override
        accountId: "ops-bot", // optional multi-account channel id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### Scope en voorrang

- `agents.defaults.heartbeat` stelt globaal heartbeat-gedrag in.
- `agents.list[].heartbeat` wordt erbovenop samengevoegd; als een agent een `heartbeat`-blok heeft, voeren **alleen die agents** heartbeats uit.
- `channels.defaults.heartbeat` stelt zichtbaarheidsstandaarden in voor alle kanalen.
- `channels.<channel>.heartbeat` overschrijft kanaalstandaarden.
- `channels.<channel>.accounts.<id>.heartbeat` (kanalen met meerdere accounts) overschrijft instellingen per kanaal.

### Heartbeats per agent

Als een `agents.list[]`-item een `heartbeat`-blok bevat, voeren **alleen die agents** heartbeats uit. Het blok per agent wordt samengevoegd bovenop `agents.defaults.heartbeat` (zodat u gedeelde standaarden eenmaal kunt instellen en per agent kunt overschrijven).

Voorbeeld: twee agents, alleen de tweede agent voert heartbeats uit.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          timeoutSeconds: 45,
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Voorbeeld van actieve uren

Beperk heartbeats tot kantooruren in een specifieke tijdzone:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // optional; uses your userTimezone if set, otherwise host tz
        },
      },
    },
  },
}
```

Buiten dit venster (voor 9.00 uur of na 22.00 uur Eastern) worden heartbeats overgeslagen. De volgende geplande tick binnen het venster wordt normaal uitgevoerd.

### 24/7-installatie

Als u wilt dat heartbeats de hele dag worden uitgevoerd, gebruikt u een van deze patronen:

- Laat `activeHours` helemaal weg (geen tijdvensterbeperking; dit is het standaardgedrag).
- Stel een venster voor de hele dag in: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Stel niet dezelfde `start`- en `end`-tijd in (bijvoorbeeld `08:00` tot `08:00`). Dat wordt behandeld als een venster zonder breedte, waardoor heartbeats altijd worden overgeslagen.
</Warning>

### Voorbeeld met meerdere accounts

Gebruik `accountId` om een specifiek account te targeten op kanalen met meerdere accounts zoals Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // optional: route to a specific topic/thread
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### Veldnotities

<ParamField path="every" type="string">
  Heartbeat-interval (duurtekenreeks; standaardeenheid = minuten).
</ParamField>
<ParamField path="model" type="string">
  Optionele modeloverschrijving voor heartbeat-runs (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Wanneer ingeschakeld, ook het afzonderlijke `Thinking`-bericht leveren wanneer beschikbaar (dezelfde vorm als `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Wanneer true gebruiken heartbeat-runs lichte bootstrapcontext en behouden ze alleen `HEARTBEAT.md` uit workspace-bootstrapbestanden.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Wanneer true wordt elke heartbeat uitgevoerd in een nieuwe sessie zonder eerdere gespreksgeschiedenis. Gebruikt hetzelfde isolatiepatroon als cron `sessionTarget: "isolated"`. Vermindert de tokenkosten per heartbeat drastisch. Combineer met `lightContext: true` voor maximale besparing. Leveringsroutering gebruikt nog steeds de context van de hoofdsessie.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Wanneer true worden heartbeat-runs uitgesteld op de extra bezette banen van die agent: zijn eigen sessie-gekoppelde subagent of genest opdrachtwerk. Cron-banen stellen heartbeats altijd uit, zelfs zonder deze vlag, zodat hosts met lokale modellen cron- en heartbeat-prompts niet tegelijk uitvoeren.
</ParamField>
<ParamField path="session" type="string">
  Optionele sessiesleutel voor heartbeat-runs.

- `main` (standaard): hoofdsessie van de agent.
- Expliciete sessiesleutel (kopieer uit `openclaw sessions --json` of de [sessies-CLI](/nl/cli/sessions)).
- Sessiesleutelformaten: zie [Sessies](/nl/concepts/session) en [Groepen](/nl/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: leveren aan het laatst gebruikte externe kanaal.
- expliciet kanaal: elke geconfigureerde kanaal- of plugin-id, bijvoorbeeld `discord`, `matrix`, `telegram` of `whatsapp`.
- `none` (standaard): voer de heartbeat uit maar **lever niet** extern.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Regelt direct/DM-leveringsgedrag. `allow`: sta direct/DM-heartbeatlevering toe. `block`: onderdruk direct/DM-levering (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Optionele ontvangeroverschrijving (kanaalspecifieke id, bijv. E.164 voor WhatsApp of een Telegram-chat-id). Gebruik voor Telegram-onderwerpen/threads `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Optionele account-id voor kanalen met meerdere accounts. Wanneer `target: "last"` is, geldt de account-id voor het opgeloste laatste kanaal als dat accounts ondersteunt; anders wordt deze genegeerd. Als de account-id niet overeenkomt met een geconfigureerd account voor het opgeloste kanaal, wordt bezorging overgeslagen.

</ParamField>
<ParamField path="prompt" type="string">
  Overschrijft de standaard prompttekst (niet samengevoegd).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Maximaal aantal tekens toegestaan na `HEARTBEAT_OK` voor bezorging.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Indien true, onderdrukt dit waarschuwingspayloads voor toolfouten tijdens Heartbeat-runs.

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  Maximaal aantal seconden toegestaan voor een Heartbeat-agentbeurt voordat deze wordt afgebroken. Laat dit leeg om `agents.defaults.timeoutSeconds` te gebruiken wanneer ingesteld; anders wordt de Heartbeat-cadans gebruikt met een maximum van 600 seconden.

</ParamField>
<ParamField path="activeHours" type="object">
  Beperkt Heartbeat-runs tot een tijdvenster. Object met `start` (HH:MM, inclusief; gebruik `00:00` voor het begin van de dag), `end` (HH:MM exclusief; `24:00` toegestaan voor het einde van de dag) en optioneel `timezone`.

- Weggelaten of `"user"`: gebruikt je `agents.defaults.userTimezone` als die is ingesteld, en valt anders terug op de tijdzone van het hostsysteem.
- `"local"`: gebruikt altijd de tijdzone van het hostsysteem.
- Elke IANA-identificatie (bijv. `America/New_York`): direct gebruikt; indien ongeldig, valt dit terug op het `"user"`-gedrag hierboven.
- `start` en `end` mogen niet gelijk zijn voor een actief venster; gelijke waarden worden behandeld als nulbreedte (altijd buiten het venster).
- Buiten het actieve venster worden Heartbeats overgeslagen tot de volgende tick binnen het venster.

</ParamField>

## Bezorggedrag

<AccordionGroup>
  <Accordion title="Sessie- en targetroutering">
    - Heartbeats draaien standaard in de hoofdsessie van de agent (`agent:<id>:<mainKey>`), of `global` wanneer `session.scope = "global"`. Stel `session` in om dit te overschrijven naar een specifieke kanaalsessie (Discord/WhatsApp/enz.).
    - `session` beïnvloedt alleen de runcontext; bezorging wordt bepaald door `target` en `to`.
    - Stel `target` + `to` in om bij een specifiek kanaal/specifieke ontvanger te bezorgen. Met `target: "last"` gebruikt bezorging het laatste externe kanaal voor die sessie.
    - Heartbeat-bezorgingen staan standaard directe/DM-targets toe. Stel `directPolicy: "block"` in om verzendingen naar directe targets te onderdrukken terwijl de Heartbeat-beurt nog steeds draait.
    - Als de hoofdwachtrij, target-sessielane, Cron-lane of een actieve Cron-taak bezet is, wordt de Heartbeat overgeslagen en later opnieuw geprobeerd.
    - Als `skipWhenBusy: true` is, stellen ook de op sessiesleutel gebaseerde subagent en geneste lanes van deze agent Heartbeat-runs uit. Bezette lanes van andere agents stellen deze agent niet uit.
    - Als `target` niet naar een externe bestemming oplost, vindt de run nog steeds plaats, maar wordt er geen uitgaand bericht verzonden.

  </Accordion>
  <Accordion title="Zichtbaarheid en overslaggedrag">
    - Als `showOk`, `showAlerts` en `useIndicator` allemaal zijn uitgeschakeld, wordt de run vooraf overgeslagen als `reason=alerts-disabled`.
    - Als alleen alertbezorging is uitgeschakeld, kan OpenClaw de Heartbeat nog steeds uitvoeren, tijdstempels van vervallen taken bijwerken, de inactiviteitstijdstempel van de sessie herstellen en de uitgaande alertpayload onderdrukken.
    - Als het opgeloste Heartbeat-target typen ondersteunt, toont OpenClaw typen terwijl de Heartbeat-run actief is. Dit gebruikt hetzelfde target waarnaar de Heartbeat chatuitvoer zou sturen, en wordt uitgeschakeld door `typingMode: "never"`.

  </Accordion>
  <Accordion title="Sessieleven cyclus en audit">
    - Antwoorden die alleen van Heartbeat komen houden de sessie **niet** levend. Heartbeat-metadata kan de sessierij bijwerken, maar inactiviteitsverloop gebruikt `lastInteractionAt` van het laatste echte gebruikers-/kanaalbericht, en dagelijks verloop gebruikt `sessionStartedAt`.
    - Geschiedenis in Control UI en WebChat verbergt Heartbeat-prompts en OK-only bevestigingen. Het onderliggende sessietranscript kan die beurten nog steeds bevatten voor audit/replay.
    - Losgekoppelde [achtergrondtaken](/nl/automation/tasks) kunnen een systeemevent in de wachtrij zetten en Heartbeat wekken wanneer de hoofdsessie snel iets moet opmerken. Die wake maakt van de Heartbeat-run geen achtergrondtaak.

  </Accordion>
</AccordionGroup>

## Zichtbaarheidsinstellingen

Standaard worden `HEARTBEAT_OK`-bevestigingen onderdrukt terwijl alertinhoud wordt bezorgd. Je kunt dit per kanaal of per account aanpassen:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Hide HEARTBEAT_OK (default)
      showAlerts: true # Show alert messages (default)
      useIndicator: true # Emit indicator events (default)
  telegram:
    heartbeat:
      showOk: true # Show OK acknowledgments on Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Suppress alert delivery for this account
```

Voorrang: per account → per kanaal → kanaalstandaarden → ingebouwde standaarden.

### Wat elke vlag doet

- `showOk`: verzendt een `HEARTBEAT_OK`-bevestiging wanneer het model een OK-only antwoord retourneert.
- `showAlerts`: verzendt de alertinhoud wanneer het model een niet-OK-antwoord retourneert.
- `useIndicator`: zendt indicator-events uit voor UI-statusoppervlakken.

Als **alle drie** false zijn, slaat OpenClaw de Heartbeat-run volledig over (geen modelaanroep).

### Voorbeelden per kanaal versus per account

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # all Slack accounts
    accounts:
      ops:
        heartbeat:
          showAlerts: false # suppress alerts for the ops account only
  telegram:
    heartbeat:
      showOk: true
```

### Veelvoorkomende patronen

| Doel                                      | Config                                                                                   |
| ----------------------------------------- | ---------------------------------------------------------------------------------------- |
| Standaardgedrag (stille OK's, alerts aan) | _(geen config nodig)_                                                                    |
| Volledig stil (geen berichten, geen indicator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Alleen indicator (geen berichten)         | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK's in slechts één kanaal                | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (optioneel)

Als er een `HEARTBEAT.md`-bestand in de workspace bestaat, vertelt de standaardprompt de agent om het te lezen. Zie het als je "Heartbeat-checklist": klein, stabiel en veilig om elke 30 minuten mee te nemen.

Bij normale runs wordt `HEARTBEAT.md` alleen geïnjecteerd wanneer Heartbeat-richtlijnen zijn ingeschakeld voor de standaardagent. Het uitschakelen van de Heartbeat-cadans met `0m` of het instellen van `includeSystemPromptSection: false` laat het weg uit de normale bootstrapcontext.

Op de native Codex-harness wordt `HEARTBEAT.md`-inhoud niet in de beurt geïnjecteerd. Als het bestand bestaat en inhoud bevat die niet alleen uit witruimte bestaat, wijzen de instructies voor Heartbeat-samenwerkingsmodus Codex naar het bestand en vertellen ze het om dit te lezen voordat het verdergaat.

Als `HEARTBEAT.md` bestaat maar feitelijk leeg is (alleen lege regels, Markdown-/HTML-comments, Markdown-koppen zoals `# Heading`, fence-markers of lege checkliststubs), slaat OpenClaw de Heartbeat-run over om API-aanroepen te besparen. Die overslag wordt gerapporteerd als `reason=empty-heartbeat-file`. Als het bestand ontbreekt, draait de Heartbeat nog steeds en bepaalt het model wat er moet gebeuren.

Houd het heel klein (korte checklist of herinneringen) om promptbloat te voorkomen.

Voorbeeld `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:`-blokken

`HEARTBEAT.md` ondersteunt ook een klein gestructureerd `tasks:`-blok voor intervalgebaseerde controles binnen Heartbeat zelf.

Voorbeeld:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Additional instructions

- Keep alerts short.
- If nothing needs attention after all due tasks, reply HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="Gedrag">
    - OpenClaw parset het `tasks:`-blok en controleert elke taak tegen zijn eigen `interval`.
    - Alleen **vervallen** taken worden voor die tick in de Heartbeat-prompt opgenomen.
    - Als er geen taken vervallen zijn, wordt de Heartbeat volledig overgeslagen (`reason=no-tasks-due`) om een verspilde modelaanroep te voorkomen.
    - Niet-taakinhoud in `HEARTBEAT.md` wordt behouden en toegevoegd als extra context na de lijst met vervallen taken.
    - Tijdstempels van de laatste run van taken worden opgeslagen in sessiestatus (`heartbeatTaskState`), zodat intervallen normale herstarts overleven.
    - Taaktijdstempels worden pas bijgewerkt nadat een Heartbeat-run het normale antwoordpad voltooit. Overgeslagen `empty-heartbeat-file`- / `no-tasks-due`-runs markeren taken niet als voltooid.

  </Accordion>
</AccordionGroup>

Taakmodus is nuttig wanneer je wilt dat één Heartbeat-bestand meerdere periodieke controles bevat zonder voor al deze controles bij elke tick te betalen.

### Kan de agent HEARTBEAT.md bijwerken?

Ja — als je erom vraagt.

`HEARTBEAT.md` is gewoon een normaal bestand in de agentworkspace, dus je kunt de agent (in een normale chat) iets vertellen als:

- "Werk `HEARTBEAT.md` bij om een dagelijkse kalendercontrole toe te voegen."
- "Herschrijf `HEARTBEAT.md` zodat het korter is en gericht op inboxopvolging."

Als je wilt dat dit proactief gebeurt, kun je ook een expliciete regel in je Heartbeat-prompt opnemen, zoals: "Als de checklist verouderd raakt, werk HEARTBEAT.md dan bij met een betere."

<Warning>
Zet geen geheimen (API-sleutels, telefoonnummers, privétokens) in `HEARTBEAT.md` — het wordt onderdeel van de promptcontext.
</Warning>

## Handmatige wake (op aanvraag)

Je kunt een systeemevent in de wachtrij zetten en een onmiddellijke Heartbeat triggeren met:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Als meerdere agents `heartbeat` hebben geconfigureerd, voert een handmatige wake elk van die agent-Heartbeats onmiddellijk uit.

Gebruik `--mode next-heartbeat` om te wachten op de volgende geplande tick.

## Redeneringsbezorging (optioneel)

Standaard bezorgen Heartbeats alleen de uiteindelijke "answer"-payload.

Als je transparantie wilt, schakel dan in:

- `agents.defaults.heartbeat.includeReasoning: true`

Wanneer ingeschakeld, bezorgen Heartbeats ook een apart bericht met het voorvoegsel `Thinking` (dezelfde vorm als `/reasoning on`). Dit kan nuttig zijn wanneer de agent meerdere sessies/codexen beheert en je wilt zien waarom die besloot je te pingen — maar het kan ook meer interne details lekken dan je wilt. Houd dit bij voorkeur uit in groepschats.

## Kostenbewustzijn

Heartbeats voeren volledige agentbeurten uit. Kortere intervallen verbruiken meer tokens. Om kosten te verlagen:

- Gebruik `isolatedSession: true` om te voorkomen dat volledige gespreksgeschiedenis wordt verzonden (~100K tokens omlaag naar ~2-5K per run).
- Gebruik `lightContext: true` om bootstrapbestanden te beperken tot alleen `HEARTBEAT.md`.
- Stel een goedkoper `model` in (bijv. `ollama/llama3.2:1b`).
- Houd `HEARTBEAT.md` klein.
- Gebruik `target: "none"` als je alleen interne statusupdates wilt.

## Contextoverloop na Heartbeat

Als een Heartbeat eerder een bestaande sessie op een kleiner lokaal model heeft achtergelaten, bijvoorbeeld een Ollama-model met een 32k-venster, en de volgende hoofdsessiebeurt contextoverloop meldt, zet dan het runtimemodel van de sessie terug naar het geconfigureerde primaire model. Het resetbericht van OpenClaw benoemt dit wanneer het laatste runtimemodel overeenkomt met de geconfigureerde `heartbeat.model`.

Huidige Heartbeats behouden het bestaande runtimemodel van de gedeelde sessie nadat de run is voltooid. Je kunt nog steeds `isolatedSession: true` gebruiken om Heartbeats in een nieuwe sessie uit te voeren, dit combineren met `lightContext: true` voor de kleinste prompt, of een Heartbeat-model kiezen met een contextvenster dat groot genoeg is voor de gedeelde sessie.

## Gerelateerd

- [Automatisering](/nl/automation) — alle automatiseringsmechanismen in één oogopslag
- [Achtergrondtaken](/nl/automation/tasks) — hoe losgekoppeld werk wordt gevolgd
- [Tijdzone](/nl/concepts/timezone) — hoe de tijdzone Heartbeat-planning beïnvloedt
- [Probleemoplossing](/nl/automation/cron-jobs#troubleshooting) — automatiseringsproblemen debuggen
