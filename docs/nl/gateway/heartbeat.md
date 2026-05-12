---
read_when:
    - Heartbeat-cadans of berichtgeving aanpassen
    - Kiezen tussen Heartbeat en Cron voor geplande taken
sidebarTitle: Heartbeat
summary: Heartbeat-pollingberichten en meldingsregels
title: Heartbeat
x-i18n:
    generated_at: "2026-05-12T00:58:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: de1fee0df75d9e8f356dc02d089f61ae5048c302169acc363eee2149e09aacb3
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat versus cron?** Zie [Automation](/nl/automation) voor richtlijnen over wanneer je welke gebruikt.
</Note>

Heartbeat voert **periodieke agentbeurten** uit in de hoofdsessie, zodat het model alles kan signaleren dat aandacht nodig heeft zonder je te spammen.

Heartbeat is een geplande beurt in de hoofdsessie — het maakt **geen** records voor [achtergrondtaken](/nl/automation/tasks) aan. Taakrecords zijn voor losgekoppeld werk (ACP-runs, subagents, geïsoleerde cronjobs).

Probleemoplossing: [Geplande taken](/nl/automation/cron-jobs#troubleshooting)

## Snelstart (beginner)

<Steps>
  <Step title="Kies een ritme">
    Laat heartbeats ingeschakeld (standaard is `30m`, of `1h` voor Anthropic OAuth-/tokenauthenticatie, inclusief hergebruik van Claude CLI) of stel je eigen ritme in.
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
    - Schakel geïsoleerde sessies in om te voorkomen dat de volledige gespreksgeschiedenis bij elke heartbeat wordt verzonden.
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
        skipWhenBusy: true, // optional: also defer when subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## Standaarden

- Interval: `30m` (of `1h` wanneer Anthropic OAuth-/tokenauthenticatie de gedetecteerde authenticatiemodus is, inclusief hergebruik van Claude CLI). Stel `agents.defaults.heartbeat.every` of per agent `agents.list[].heartbeat.every` in; gebruik `0m` om uit te schakelen.
- Prompttekst (configureerbaar via `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- De heartbeat-prompt wordt **letterlijk** als gebruikersbericht verzonden. De systeemprompt bevat alleen een sectie "Heartbeat" wanneer heartbeats zijn ingeschakeld voor de standaardagent, en de run wordt intern gemarkeerd.
- Wanneer heartbeats zijn uitgeschakeld met `0m`, laten normale runs `HEARTBEAT.md` ook weg uit de bootstrapcontext, zodat het model geen heartbeat-specifieke instructies ziet.
- Actieve uren (`heartbeat.activeHours`) worden gecontroleerd in de geconfigureerde tijdzone. Buiten het venster worden heartbeats overgeslagen tot de volgende tik binnen het venster.
- Heartbeats worden automatisch uitgesteld terwijl cronwerk actief is of in de wachtrij staat. Stel `heartbeat.skipWhenBusy: true` in om ook uit te stellen op extra drukke lanes (subagent- of genest commandowerk); dit is nuttig voor lokale Ollama en andere beperkte hosts met één runtime.

## Waar de heartbeat-prompt voor is

De standaardprompt is bewust breed:

- **Achtergrondtaken**: "Consider outstanding tasks" spoort de agent aan om follow-ups te controleren (inbox, agenda, herinneringen, werk in de wachtrij) en alles te melden dat urgent is.
- **Menselijke check-in**: "Checkup sometimes on your human during day time" spoort een incidenteel lichtgewicht "heb je iets nodig?"-bericht aan, maar voorkomt nachtelijke spam door je geconfigureerde lokale tijdzone te gebruiken (zie [Tijdzone](/nl/concepts/timezone)).

Heartbeat kan reageren op voltooide [achtergrondtaken](/nl/automation/tasks), maar een heartbeat-run zelf maakt geen taakrecord aan.

Als je wilt dat een heartbeat iets heel specifieks doet (bijvoorbeeld "controleer Gmail PubSub-statistieken" of "verifieer Gateway-gezondheid"), stel dan `agents.defaults.heartbeat.prompt` (of `agents.list[].heartbeat.prompt`) in op een aangepaste tekst (letterlijk verzonden).

## Responscontract

- Als niets aandacht nodig heeft, antwoord dan met **`HEARTBEAT_OK`**.
- Heartbeat-runs met tools kunnen in plaats daarvan `heartbeat_respond` aanroepen met `notify: false` voor geen zichtbare update, of `notify: true` plus `notificationText` voor een waarschuwing. Wanneer aanwezig, krijgt de gestructureerde toolrespons voorrang op de tekstfallback.
- Tijdens heartbeat-runs behandelt OpenClaw `HEARTBEAT_OK` als een ack wanneer het aan het **begin of einde** van het antwoord verschijnt. Het token wordt verwijderd en het antwoord wordt genegeerd als de resterende inhoud **≤ `ackMaxChars`** is (standaard: 300).
- Als `HEARTBEAT_OK` in het **midden** van een antwoord verschijnt, wordt het niet speciaal behandeld.
- Neem bij waarschuwingen **geen** `HEARTBEAT_OK` op; retourneer alleen de waarschuwingstekst.

Buiten heartbeats wordt een losse `HEARTBEAT_OK` aan het begin/einde van een bericht verwijderd en gelogd; een bericht dat alleen `HEARTBEAT_OK` is, wordt genegeerd.

## Configuratie

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Reasoning: message when available)
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for subagent/nested lanes
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

### Bereik en prioriteit

- `agents.defaults.heartbeat` stelt globaal heartbeat-gedrag in.
- `agents.list[].heartbeat` wordt erbovenop samengevoegd; als een agent een `heartbeat`-blok heeft, voeren **alleen die agents** heartbeats uit.
- `channels.defaults.heartbeat` stelt zichtbaarheidsstandaarden in voor alle kanalen.
- `channels.<channel>.heartbeat` overschrijft kanaalstandaarden.
- `channels.<channel>.accounts.<id>.heartbeat` (kanalen met meerdere accounts) overschrijft instellingen per kanaal.

### Heartbeats per agent

Als een item in `agents.list[]` een `heartbeat`-blok bevat, voeren **alleen die agents** heartbeats uit. Het blok per agent wordt samengevoegd bovenop `agents.defaults.heartbeat` (zodat je gedeelde standaarden één keer kunt instellen en per agent kunt overschrijven).

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

Buiten dit venster (voor 9.00 uur of na 22.00 uur Eastern) worden heartbeats overgeslagen. De volgende geplande tik binnen het venster wordt normaal uitgevoerd.

### 24/7-configuratie

Als je heartbeats de hele dag wilt laten draaien, gebruik dan een van deze patronen:

- Laat `activeHours` volledig weg (geen beperking door een tijdvenster; dit is het standaardgedrag).
- Stel een venster voor de hele dag in: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Stel niet dezelfde `start`- en `end`-tijd in (bijvoorbeeld `08:00` tot `08:00`). Dat wordt behandeld als een venster zonder breedte, waardoor heartbeats altijd worden overgeslagen.
</Warning>

### Voorbeeld met meerdere accounts

Gebruik `accountId` om een specifiek account te targeten op kanalen met meerdere accounts, zoals Telegram:

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
  Heartbeat-interval (duurstring; standaardeenheid = minuten).
</ParamField>
<ParamField path="model" type="string">
  Optionele modeloverschrijving voor heartbeat-runs (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Wanneer ingeschakeld, wordt ook het afzonderlijke `Reasoning:`-bericht geleverd wanneer beschikbaar (dezelfde vorm als `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Wanneer waar, gebruiken heartbeat-runs lichte bootstrapcontext en behouden ze alleen `HEARTBEAT.md` uit de bootstrapbestanden van de werkruimte.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Wanneer waar, draait elke heartbeat in een nieuwe sessie zonder eerdere gespreksgeschiedenis. Gebruikt hetzelfde isolatiepatroon als cron `sessionTarget: "isolated"`. Verlaagt de tokenkosten per heartbeat drastisch. Combineer met `lightContext: true` voor maximale besparing. Leveringsroutering gebruikt nog steeds de context van de hoofdsessie.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Wanneer waar, stellen heartbeat-runs uit op extra drukke lanes: subagent- of genest commandowerk. Cron-lanes stellen heartbeats altijd uit, zelfs zonder deze vlag, zodat hosts met lokale modellen niet tegelijk cron- en heartbeat-prompts uitvoeren.
</ParamField>
<ParamField path="session" type="string">
  Optionele sessiesleutel voor heartbeat-runs.

- `main` (standaard): hoofdsessie van de agent.
- Expliciete sessiesleutel (kopieer uit `openclaw sessions --json` of de [sessies-CLI](/nl/cli/sessions)).
- Sessiesleutelformaten: zie [Sessies](/nl/concepts/session) en [Groepen](/nl/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: lever aan het laatst gebruikte externe kanaal.
- expliciet kanaal: elke geconfigureerde kanaal- of plugin-id, bijvoorbeeld `discord`, `matrix`, `telegram` of `whatsapp`.
- `none` (standaard): voer de heartbeat uit, maar **lever niet extern**.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Regelt direct/DM-leveringsgedrag. `allow`: sta direct/DM-heartbeat-levering toe. `block`: onderdruk direct/DM-levering (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Optionele ontvangersoverschrijving (kanaalspecifieke id, bijvoorbeeld E.164 voor WhatsApp of een Telegram-chat-id). Gebruik voor Telegram-onderwerpen/threads `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Optionele account-id voor kanalen met meerdere accounts. Wanneer `target: "last"` is, wordt de account-id toegepast op het opgeloste laatste kanaal als dat accounts ondersteunt; anders wordt deze genegeerd. Als de account-id niet overeenkomt met een geconfigureerd account voor het opgeloste kanaal, wordt levering overgeslagen.

</ParamField>
<ParamField path="prompt" type="string">
  Overschrijft de standaardprompttekst (niet samengevoegd).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Max. aantal tekens toegestaan na `HEARTBEAT_OK` vóór levering.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Wanneer dit waar is, worden payloads met toolfoutwaarschuwingen tijdens heartbeat-runs onderdrukt.

</ParamField>
<ParamField path="activeHours" type="object">
  Beperkt heartbeat-runs tot een tijdvenster. Object met `start` (HH:MM, inclusief; gebruik `00:00` voor begin van de dag), `end` (HH:MM exclusief; `24:00` toegestaan voor einde van de dag), en optioneel `timezone`.

- Weggelaten of `"user"`: gebruikt je `agents.defaults.userTimezone` indien ingesteld, anders valt dit terug op de tijdzone van het hostsysteem.
- `"local"`: gebruikt altijd de tijdzone van het hostsysteem.
- Elke IANA-identificatie (bijv. `America/New_York`): wordt rechtstreeks gebruikt; indien ongeldig, valt dit terug op het bovenstaande `"user"`-gedrag.
- `start` en `end` mogen niet gelijk zijn voor een actief venster; gelijke waarden worden behandeld als nul-breedte (altijd buiten het venster).
- Buiten het actieve venster worden heartbeats overgeslagen tot de volgende tick binnen het venster.

</ParamField>

## Leveringsgedrag

<AccordionGroup>
  <Accordion title="Sessie- en doelroutering">
    - Heartbeats draaien standaard in de hoofdsessie van de agent (`agent:<id>:<mainKey>`), of `global` wanneer `session.scope = "global"`. Stel `session` in om dit te overschrijven naar een specifieke kanaalsessie (Discord/WhatsApp/etc.).
    - `session` beïnvloedt alleen de runcontext; levering wordt beheerd door `target` en `to`.
    - Om aan een specifiek kanaal/ontvanger te leveren, stel je `target` + `to` in. Met `target: "last"` gebruikt levering het laatste externe kanaal voor die sessie.
    - Heartbeat-leveringen staan standaard directe/DM-doelen toe. Stel `directPolicy: "block"` in om verzendingen naar directe doelen te onderdrukken terwijl de heartbeat-beurt nog steeds wordt uitgevoerd.
    - Als de hoofdqueue, de doelsessielane, de cron-lane of een actieve cron-taak bezig is, wordt de heartbeat overgeslagen en later opnieuw geprobeerd.
    - Als `skipWhenBusy: true`, stellen subagent- en geneste lanes heartbeat-runs ook uit.
    - Als `target` geen externe bestemming oplevert, vindt de run nog steeds plaats maar wordt er geen uitgaand bericht verzonden.

  </Accordion>
  <Accordion title="Zichtbaarheid en overslaggedrag">
    - Als `showOk`, `showAlerts` en `useIndicator` allemaal uitgeschakeld zijn, wordt de run vooraf overgeslagen als `reason=alerts-disabled`.
    - Als alleen alertlevering is uitgeschakeld, kan OpenClaw de heartbeat nog steeds uitvoeren, tijdstempels van vervallen taken bijwerken, de idle-tijdstempel van de sessie herstellen en de uitgaande alertpayload onderdrukken.
    - Als het opgeloste heartbeat-doel typen ondersteunt, toont OpenClaw typen terwijl de heartbeat-run actief is. Dit gebruikt hetzelfde doel waarnaar de heartbeat chatuitvoer zou sturen, en wordt uitgeschakeld door `typingMode: "never"`.

  </Accordion>
  <Accordion title="Sessielevenscyclus en audit">
    - Antwoorden die alleen van heartbeat afkomstig zijn, houden de sessie **niet** actief. Heartbeat-metadata kan de sessierij bijwerken, maar idle-verval gebruikt `lastInteractionAt` van het laatste echte gebruikers-/kanaalbericht, en dagelijks verval gebruikt `sessionStartedAt`.
    - Control UI en WebChat-geschiedenis verbergen heartbeat-prompts en OK-only bevestigingen. Het onderliggende sessietranscript kan die beurten nog steeds bevatten voor audit/replay.
    - Losgekoppelde [achtergrondtaken](/nl/automation/tasks) kunnen een systeemgebeurtenis in de queue plaatsen en heartbeat wekken wanneer de hoofdsessie snel iets moet opmerken. Die wake maakt de heartbeat-run geen achtergrondtaak.

  </Accordion>
</AccordionGroup>

## Zichtbaarheidsinstellingen

Standaard worden `HEARTBEAT_OK`-bevestigingen onderdrukt terwijl alertinhoud wordt geleverd. Je kunt dit per kanaal of per account aanpassen:

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

Prioriteit: per account → per kanaal → kanaalstandaarden → ingebouwde standaarden.

### Wat elke vlag doet

- `showOk`: verzendt een `HEARTBEAT_OK`-bevestiging wanneer het model een OK-only antwoord teruggeeft.
- `showAlerts`: verzendt de alertinhoud wanneer het model een niet-OK antwoord teruggeeft.
- `useIndicator`: zendt indicatorgebeurtenissen uit voor UI-statusoppervlakken.

Als **alle drie** onwaar zijn, slaat OpenClaw de heartbeat-run volledig over (geen modelaanroep).

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

| Doel                                     | Configuratie                                                                             |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Standaardgedrag (stille OK's, alerts aan) | _(geen configuratie nodig)_                                                              |
| Volledig stil (geen berichten, geen indicator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Alleen indicator (geen berichten)        | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK's alleen in één kanaal                | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (optioneel)

Als er een `HEARTBEAT.md`-bestand in de workspace bestaat, vertelt de standaardprompt de agent om het te lezen. Zie het als je "heartbeat-checklist": klein, stabiel en veilig om elke 30 minuten op te nemen.

Bij normale runs wordt `HEARTBEAT.md` alleen geïnjecteerd wanneer heartbeat-richtlijnen zijn ingeschakeld voor de standaardagent. Het uitschakelen van de heartbeat-cadans met `0m` of het instellen van `includeSystemPromptSection: false` laat het weg uit de normale bootstrapcontext.

Als `HEARTBEAT.md` bestaat maar effectief leeg is (alleen lege regels en markdownkoppen zoals `# Heading`), slaat OpenClaw de heartbeat-run over om API-aanroepen te besparen. Die overslag wordt gemeld als `reason=empty-heartbeat-file`. Als het bestand ontbreekt, draait de heartbeat nog steeds en beslist het model wat er moet gebeuren.

Houd het klein (korte checklist of herinneringen) om prompt-bloat te vermijden.

Voorbeeld `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:`-blokken

`HEARTBEAT.md` ondersteunt ook een klein gestructureerd `tasks:`-blok voor intervalgebaseerde controles binnen heartbeat zelf.

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
    - OpenClaw parseert het `tasks:`-blok en controleert elke taak tegen het eigen `interval`.
    - Alleen taken die **vervallen** zijn, worden opgenomen in de heartbeat-prompt voor die tick.
    - Als er geen taken vervallen zijn, wordt de heartbeat volledig overgeslagen (`reason=no-tasks-due`) om een verspilde modelaanroep te voorkomen.
    - Niet-taakinhoud in `HEARTBEAT.md` wordt behouden en toegevoegd als extra context na de lijst met vervallen taken.
    - Laatste-run-tijdstempels van taken worden opgeslagen in sessiestatus (`heartbeatTaskState`), zodat intervallen normale herstarts overleven.
    - Taaktijdstempels worden alleen vooruitgezet nadat een heartbeat-run het normale antwoordpad heeft voltooid. Overgeslagen `empty-heartbeat-file`- / `no-tasks-due`-runs markeren taken niet als voltooid.

  </Accordion>
</AccordionGroup>

Taakmodus is nuttig wanneer je één heartbeat-bestand meerdere periodieke controles wilt laten bevatten zonder voor allemaal bij elke tick te betalen.

### Kan de agent HEARTBEAT.md bijwerken?

Ja — als je erom vraagt.

`HEARTBEAT.md` is gewoon een normaal bestand in de agentworkspace, dus je kunt de agent (in een normale chat) iets vertellen als:

- "Werk `HEARTBEAT.md` bij om een dagelijkse kalendercontrole toe te voegen."
- "Herschrijf `HEARTBEAT.md` zodat het korter is en gericht op inbox-opvolgingen."

Als je wilt dat dit proactief gebeurt, kun je ook een expliciete regel in je heartbeat-prompt opnemen, zoals: "Als de checklist verouderd raakt, werk HEARTBEAT.md dan bij met een betere."

<Warning>
Zet geen geheimen (API-sleutels, telefoonnummers, privétokens) in `HEARTBEAT.md` — het wordt onderdeel van de promptcontext.
</Warning>

## Handmatige wake (op aanvraag)

Je kunt een systeemgebeurtenis in de queue plaatsen en een onmiddellijke heartbeat activeren met:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Als meerdere agents `heartbeat` geconfigureerd hebben, voert een handmatige wake elk van die agent-heartbeats onmiddellijk uit.

Gebruik `--mode next-heartbeat` om op de volgende geplande tick te wachten.

## Levering van redenering (optioneel)

Standaard leveren heartbeats alleen de uiteindelijke "antwoord"-payload.

Als je transparantie wilt, schakel dan in:

- `agents.defaults.heartbeat.includeReasoning: true`

Wanneer ingeschakeld, leveren heartbeats ook een afzonderlijk bericht met prefix `Reasoning:` (dezelfde vorm als `/reasoning on`). Dit kan nuttig zijn wanneer de agent meerdere sessies/codexen beheert en je wilt zien waarom deze besloot je te pingen — maar het kan ook meer interne details lekken dan je wilt. Laat het bij voorkeur uit in groepschats.

## Kostenbewustzijn

Heartbeats draaien volledige agentbeurten. Kortere intervallen verbruiken meer tokens. Om kosten te verlagen:

- Gebruik `isolatedSession: true` om te voorkomen dat de volledige gespreksgeschiedenis wordt verzonden (~100K tokens omlaag naar ~2-5K per run).
- Gebruik `lightContext: true` om bootstrapbestanden te beperken tot alleen `HEARTBEAT.md`.
- Stel een goedkoper `model` in (bijv. `ollama/llama3.2:1b`).
- Houd `HEARTBEAT.md` klein.
- Gebruik `target: "none"` als je alleen interne statusupdates wilt.

## Contextoverloop na heartbeat

Als een heartbeat eerder een bestaande sessie op een kleiner lokaal model heeft achtergelaten, bijvoorbeeld een Ollama-model met een 32k-venster, en de volgende hoofdsessiebeurt contextoverloop meldt, reset dan het runtime-model van de sessie terug naar het geconfigureerde primaire model. Het resetbericht van OpenClaw meldt dit expliciet wanneer het laatste runtime-model overeenkomt met geconfigureerd `heartbeat.model`.

Huidige heartbeats behouden het bestaande runtime-model van de gedeelde sessie nadat de run is voltooid. Je kunt nog steeds `isolatedSession: true` gebruiken om heartbeats in een nieuwe sessie te draaien, dit combineren met `lightContext: true` voor de kleinste prompt, of een heartbeat-model kiezen met een contextvenster dat groot genoeg is voor de gedeelde sessie.

## Gerelateerd

- [Automatisering](/nl/automation) — alle automatiseringsmechanismen in één oogopslag
- [Achtergrondtaken](/nl/automation/tasks) — hoe losgekoppeld werk wordt bijgehouden
- [Tijdzone](/nl/concepts/timezone) — hoe tijdzone heartbeat-planning beïnvloedt
- [Probleemoplossing](/nl/automation/cron-jobs#troubleshooting) — automatiseringsproblemen debuggen
