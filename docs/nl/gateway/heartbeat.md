---
read_when:
    - Heartbeat-cadans of berichtgeving aanpassen
    - Kiezen tussen Heartbeat en Cron voor geplande taken
sidebarTitle: Heartbeat
summary: Heartbeat-pollingberichten en meldingsregels
title: Heartbeat
x-i18n:
    generated_at: "2026-05-02T20:43:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20ce96feb2512312ec8dc5ef3b6722ed552f0a03c55b80a9c3f5b42594ab0d36
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat versus Cron?** Zie [Automatisering en taken](/nl/automation) voor richtlijnen over wanneer je welke gebruikt.
</Note>

Heartbeat voert **periodieke agentbeurten** uit in de hoofdsessie, zodat het model alles kan melden wat aandacht nodig heeft zonder je te spammen.

Heartbeat is een geplande beurt in de hoofdsessie — het maakt **geen** [achtergrondtaak](/nl/automation/tasks)-records aan. Taakrecords zijn voor losgekoppeld werk (ACP-runs, subagents, geïsoleerde Cron-taken).

Probleemoplossing: [Geplande taken](/nl/automation/cron-jobs#troubleshooting)

## Snelstart (beginner)

<Steps>
  <Step title="Kies een cadans">
    Laat heartbeats ingeschakeld (standaard is `30m`, of `1h` voor Anthropic OAuth-/tokenauthenticatie, inclusief hergebruik van Claude CLI) of stel je eigen cadans in.
  </Step>
  <Step title="Voeg HEARTBEAT.md toe (optioneel)">
    Maak een kleine `HEARTBEAT.md`-checklist of een `tasks:`-blok in de agentwerkruimte.
  </Step>
  <Step title="Bepaal waar heartbeat-berichten naartoe moeten">
    `target: "none"` is de standaard; stel `target: "last"` in om naar het laatste contact te routeren.
  </Step>
  <Step title="Optionele afstemming">
    - Schakel levering van heartbeat-redeneringen in voor transparantie.
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
- Wanneer heartbeats zijn uitgeschakeld met `0m`, laten normale runs ook `HEARTBEAT.md` weg uit de bootstrapcontext, zodat het model geen heartbeat-specifieke instructies ziet.
- Actieve uren (`heartbeat.activeHours`) worden gecontroleerd in de geconfigureerde tijdzone. Buiten het venster worden heartbeats overgeslagen tot de volgende tick binnen het venster.
- Heartbeats worden automatisch uitgesteld terwijl Cron-werk actief is of in de wachtrij staat. Stel `heartbeat.skipWhenBusy: true` in om ook uit te stellen bij extra drukke lanes (subagent- of genest commandowerk); dit is nuttig voor lokale Ollama en andere beperkte hosts met één runtime.

## Waar de heartbeat-prompt voor is

De standaardprompt is bewust breed:

- **Achtergrondtaken**: "Consider outstanding tasks" spoort de agent aan om follow-ups te bekijken (inbox, agenda, herinneringen, werk in de wachtrij) en alles te melden wat urgent is.
- **Menselijke check-in**: "Checkup sometimes on your human during day time" spoort af en toe een licht "heb je iets nodig?"-bericht aan, maar voorkomt nachtelijke spam door je geconfigureerde lokale tijdzone te gebruiken (zie [Tijdzone](/nl/concepts/timezone)).

Heartbeat kan reageren op voltooide [achtergrondtaken](/nl/automation/tasks), maar een heartbeat-run zelf maakt geen taakrecord aan.

Als je wilt dat een heartbeat iets heel specifieks doet (bijv. "controleer Gmail PubSub-statistieken" of "verifieer Gateway-gezondheid"), stel dan `agents.defaults.heartbeat.prompt` (of `agents.list[].heartbeat.prompt`) in op een aangepaste tekst (letterlijk verzonden).

## Responscontract

- Als niets aandacht nodig heeft, antwoord met **`HEARTBEAT_OK`**.
- Heartbeat-runs met toolmogelijkheden kunnen in plaats daarvan `heartbeat_respond` aanroepen met `notify: false` voor geen zichtbare update, of `notify: true` plus `notificationText` voor een waarschuwing. Indien aanwezig heeft de gestructureerde toolrespons voorrang op de tekstfallback.
- Tijdens heartbeat-runs behandelt OpenClaw `HEARTBEAT_OK` als een bevestiging wanneer het aan het **begin of einde** van het antwoord staat. Het token wordt verwijderd en het antwoord wordt weggegooid als de resterende inhoud **≤ `ackMaxChars`** is (standaard: 300).
- Als `HEARTBEAT_OK` in het **midden** van een antwoord staat, wordt het niet speciaal behandeld.
- Neem bij waarschuwingen **geen** `HEARTBEAT_OK` op; retourneer alleen de waarschuwingstekst.

Buiten heartbeats wordt een losse `HEARTBEAT_OK` aan het begin/einde van een bericht verwijderd en gelogd; een bericht dat alleen `HEARTBEAT_OK` bevat, wordt weggegooid.

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
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "bluebubbles")
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
- `agents.list[].heartbeat` wordt daarbovenop samengevoegd; als een agent een `heartbeat`-blok heeft, voeren **alleen die agents** heartbeats uit.
- `channels.defaults.heartbeat` stelt zichtbaarheidsstandaarden in voor alle kanalen.
- `channels.<channel>.heartbeat` overschrijft kanaalstandaarden.
- `channels.<channel>.accounts.<id>.heartbeat` (kanalen met meerdere accounts) overschrijft instellingen per kanaal.

### Heartbeats per agent

Als een item in `agents.list[]` een `heartbeat`-blok bevat, voeren **alleen die agents** Heartbeats uit. Het blok per agent wordt samengevoegd bovenop `agents.defaults.heartbeat` (zodat je gedeelde standaardwaarden eenmaal kunt instellen en per agent kunt overschrijven).

Voorbeeld: twee agents, alleen de tweede agent voert Heartbeats uit.

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

Beperk Heartbeats tot kantooruren in een specifieke tijdzone:

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

Buiten dit venster (vóór 9.00 uur of na 22.00 uur Eastern) worden Heartbeats overgeslagen. De volgende geplande tick binnen het venster wordt normaal uitgevoerd.

### 24/7-configuratie

Als je wilt dat Heartbeats de hele dag worden uitgevoerd, gebruik dan een van deze patronen:

- Laat `activeHours` volledig weg (geen beperking met een tijdvenster; dit is het standaardgedrag).
- Stel een venster voor de hele dag in: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Stel niet dezelfde tijd voor `start` en `end` in (bijvoorbeeld `08:00` tot `08:00`). Dat wordt behandeld als een venster zonder breedte, waardoor Heartbeats altijd worden overgeslagen.
</Warning>

### Voorbeeld met meerdere accounts

Gebruik `accountId` om een specifiek account te richten op kanalen met meerdere accounts, zoals Telegram:

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
  Heartbeat-interval (duur-tekenreeks; standaardeenheid = minuten).
</ParamField>
<ParamField path="model" type="string">
  Optionele modeloverschrijving voor Heartbeat-runs (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Wanneer ingeschakeld, wordt ook het afzonderlijke bericht `Reasoning:` geleverd wanneer beschikbaar (dezelfde vorm als `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Wanneer waar, gebruiken Heartbeat-runs lichte bootstrap-context en behouden ze alleen `HEARTBEAT.md` uit de bootstrap-bestanden van de workspace.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Wanneer waar, wordt elke Heartbeat uitgevoerd in een nieuwe sessie zonder eerdere gespreksgeschiedenis. Gebruikt hetzelfde isolatiepatroon als cron `sessionTarget: "isolated"`. Vermindert de tokenkosten per Heartbeat drastisch. Combineer met `lightContext: true` voor maximale besparingen. Leveringsroutering gebruikt nog steeds de context van de hoofdsessie.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Wanneer waar, stellen Heartbeat-runs uit op extra drukke lanes: subagent- of genest opdrachtwerk. Cron-lanes stellen Heartbeats altijd uit, zelfs zonder deze flag, zodat hosts met lokale modellen niet tegelijk Cron- en Heartbeat-prompts uitvoeren.
</ParamField>
<ParamField path="session" type="string">
  Optionele sessiesleutel voor Heartbeat-runs.

- `main` (standaard): hoofdsessie van de agent.
- Expliciete sessiesleutel (kopieer uit `openclaw sessions --json` of de [sessies-CLI](/nl/cli/sessions)).
- Indelingen voor sessiesleutels: zie [Sessies](/nl/concepts/session) en [Groepen](/nl/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: lever aan het laatst gebruikte externe kanaal.
- expliciet kanaal: elk geconfigureerd kanaal of plugin-id, bijvoorbeeld `discord`, `matrix`, `telegram` of `whatsapp`.
- `none` (standaard): voer de Heartbeat uit maar **lever niet** extern.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Beheert het gedrag voor directe/DM-levering. `allow`: sta directe/DM-levering van Heartbeats toe. `block`: onderdruk directe/DM-levering (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Optionele overschrijving van ontvanger (kanaalspecifieke id, bijv. E.164 voor WhatsApp of een Telegram-chat-id). Gebruik voor Telegram-onderwerpen/threads `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Optionele account-id voor kanalen met meerdere accounts. Wanneer `target: "last"` is, is de account-id van toepassing op het gevonden laatste kanaal als dat accounts ondersteunt; anders wordt deze genegeerd. Als de account-id niet overeenkomt met een geconfigureerd account voor het gevonden kanaal, wordt levering overgeslagen.

</ParamField>
<ParamField path="prompt" type="string">
  Overschrijft de standaardprompttekst (niet samengevoegd).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Maximaal toegestane tekens na `HEARTBEAT_OK` vóór aflevering.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Wanneer true, worden waarschuwingspayloads voor toolfouten onderdrukt tijdens Heartbeat-runs.

</ParamField>
<ParamField path="activeHours" type="object">
  Beperkt Heartbeat-runs tot een tijdvenster. Object met `start` (HH:MM, inclusief; gebruik `00:00` voor het begin van de dag), `end` (HH:MM exclusief; `24:00` toegestaan voor het einde van de dag), en optioneel `timezone`.

- Weggelaten of `"user"`: gebruikt je `agents.defaults.userTimezone` indien ingesteld, anders wordt teruggevallen op de tijdzone van het hostsysteem.
- `"local"`: gebruikt altijd de tijdzone van het hostsysteem.
- Elke IANA-identificatie (bijv. `America/New_York`): wordt direct gebruikt; indien ongeldig, wordt teruggevallen op het hierboven beschreven `"user"`-gedrag.
- `start` en `end` mogen niet gelijk zijn voor een actief venster; gelijke waarden worden behandeld als nulbreedte (altijd buiten het venster).
- Buiten het actieve venster worden heartbeats overgeslagen tot de volgende tick binnen het venster.

</ParamField>

## Aflevergedrag

<AccordionGroup>
  <Accordion title="Sessie- en doelrouting">
    - Heartbeats draaien standaard in de hoofdsessie van de agent (`agent:<id>:<mainKey>`), of `global` wanneer `session.scope = "global"`. Stel `session` in om te overschrijven naar een specifieke kanaalsessie (Discord/WhatsApp/etc.).
    - `session` beïnvloedt alleen de uitvoeringscontext; aflevering wordt geregeld door `target` en `to`.
    - Stel `target` + `to` in om af te leveren bij een specifiek kanaal/ontvanger. Met `target: "last"` gebruikt aflevering het laatste externe kanaal voor die sessie.
    - Heartbeat-afleveringen staan directe/DM-doelen standaard toe. Stel `directPolicy: "block"` in om verzendingen naar directe doelen te onderdrukken terwijl de Heartbeat-turn nog steeds wordt uitgevoerd.
    - Als de hoofdqueue, doel-sessielane, Cron-lane of een actieve Cron-taak bezig is, wordt de Heartbeat overgeslagen en later opnieuw geprobeerd.
    - Als `skipWhenBusy: true`, stellen subagent- en geneste lanes Heartbeat-runs ook uit.
    - Als `target` niet wordt herleid tot een externe bestemming, vindt de run nog steeds plaats maar wordt er geen uitgaand bericht verzonden.

  </Accordion>
  <Accordion title="Zichtbaarheid en overslaggedrag">
    - Als `showOk`, `showAlerts` en `useIndicator` allemaal zijn uitgeschakeld, wordt de run vooraf overgeslagen als `reason=alerts-disabled`.
    - Als alleen alert-aflevering is uitgeschakeld, kan OpenClaw de Heartbeat nog steeds uitvoeren, tijdstempels van verschuldigde taken bijwerken, de idle-tijdstempel van de sessie herstellen en de uitgaande alert-payload onderdrukken.
    - Als het opgeloste Heartbeat-doel typen ondersteunt, toont OpenClaw typen terwijl de Heartbeat-run actief is. Dit gebruikt hetzelfde doel waarnaar de Heartbeat chatuitvoer zou sturen, en het wordt uitgeschakeld door `typingMode: "never"`.

  </Accordion>
  <Accordion title="Sessielevenloop en audit">
    - Alleen-Heartbeat-antwoorden houden de sessie **niet** actief. Heartbeat-metadata kan de sessierij bijwerken, maar idle-verval gebruikt `lastInteractionAt` van het laatste echte gebruikers-/kanaalbericht, en dagelijks verval gebruikt `sessionStartedAt`.
    - Control UI- en WebChat-geschiedenis verbergen Heartbeat-prompts en OK-only bevestigingen. Het onderliggende sessietranscript kan die turns nog steeds bevatten voor audit/replay.
    - Losgekoppelde [achtergrondtaken](/nl/automation/tasks) kunnen een systeemevent in de queue plaatsen en Heartbeat wekken wanneer de hoofdsessie snel iets moet opmerken. Die wake maakt van de Heartbeat-run geen achtergrondtaak.

  </Accordion>
</AccordionGroup>

## Zichtbaarheidsinstellingen

Standaard worden `HEARTBEAT_OK`-bevestigingen onderdrukt terwijl alert-inhoud wordt afgeleverd. Je kunt dit per kanaal of per account aanpassen:

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

- `showOk`: stuurt een `HEARTBEAT_OK`-bevestiging wanneer het model een OK-only antwoord teruggeeft.
- `showAlerts`: stuurt de alert-inhoud wanneer het model een niet-OK-antwoord teruggeeft.
- `useIndicator`: verstuurt indicatorevents voor UI-statusoppervlakken.

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

| Doel                                     | Config                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Standaardgedrag (stille OKs, alerts aan) | _(geen config nodig)_                                                                    |
| Volledig stil (geen berichten, geen indicator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Alleen indicator (geen berichten)        | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OKs in slechts één kanaal                | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (optioneel)

Als er een `HEARTBEAT.md`-bestand in de workspace bestaat, vertelt de standaardprompt de agent om het te lezen. Zie het als je "Heartbeat-checklist": klein, stabiel en veilig om elke 30 minuten op te nemen.

Bij normale runs wordt `HEARTBEAT.md` alleen geïnjecteerd wanneer Heartbeat-richtlijnen zijn ingeschakeld voor de standaardagent. Het uitschakelen van de Heartbeat-cadans met `0m` of het instellen van `includeSystemPromptSection: false` laat het weg uit de normale bootstrapcontext.

Als `HEARTBEAT.md` bestaat maar feitelijk leeg is (alleen lege regels en markdownkoppen zoals `# Heading`), slaat OpenClaw de Heartbeat-run over om API-aanroepen te besparen. Die overslag wordt gerapporteerd als `reason=empty-heartbeat-file`. Als het bestand ontbreekt, draait de Heartbeat nog steeds en beslist het model wat te doen.

Houd het klein (korte checklist of herinneringen) om promptbloat te voorkomen.

Voorbeeld `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:`-blokken

`HEARTBEAT.md` ondersteunt ook een klein gestructureerd `tasks:`-blok voor intervalgebaseerde checks binnen Heartbeat zelf.

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
    - Alleen **verschuldigde** taken worden opgenomen in de Heartbeat-prompt voor die tick.
    - Als er geen taken verschuldigd zijn, wordt de Heartbeat volledig overgeslagen (`reason=no-tasks-due`) om een verspilde modelaanroep te voorkomen.
    - Niet-taakinhoud in `HEARTBEAT.md` wordt behouden en toegevoegd als extra context na de lijst met verschuldigde taken.
    - Tijdstempels van de laatste taakrun worden opgeslagen in de sessiestatus (`heartbeatTaskState`), zodat intervallen normale herstarts overleven.
    - Taaktijdstempels worden alleen vooruitgezet nadat een Heartbeat-run het normale antwoordpad voltooit. Overgeslagen `empty-heartbeat-file`- / `no-tasks-due`-runs markeren taken niet als voltooid.

  </Accordion>
</AccordionGroup>

Taakmodus is nuttig wanneer je één Heartbeat-bestand meerdere periodieke checks wilt laten bevatten zonder voor allemaal bij elke tick te betalen.

### Kan de agent HEARTBEAT.md bijwerken?

Ja — als je erom vraagt.

`HEARTBEAT.md` is gewoon een normaal bestand in de agent-workspace, dus je kunt de agent (in een normale chat) iets vertellen als:

- "Werk `HEARTBEAT.md` bij om een dagelijkse kalendercheck toe te voegen."
- "Herschrijf `HEARTBEAT.md` zodat het korter is en gericht op inbox-follow-ups."

Als je wilt dat dit proactief gebeurt, kun je ook een expliciete regel opnemen in je Heartbeat-prompt, zoals: "Als de checklist verouderd raakt, werk HEARTBEAT.md bij met een betere."

<Warning>
Zet geen geheimen (API-sleutels, telefoonnummers, privétokens) in `HEARTBEAT.md` — het wordt onderdeel van de promptcontext.
</Warning>

## Handmatige wake (op aanvraag)

Je kunt een systeemevent in de queue plaatsen en een onmiddellijke Heartbeat activeren met:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Als meerdere agents `heartbeat` geconfigureerd hebben, voert een handmatige wake elk van die agent-heartbeats onmiddellijk uit.

Gebruik `--mode next-heartbeat` om te wachten op de volgende geplande tick.

## Reasoning-aflevering (optioneel)

Standaard leveren heartbeats alleen de uiteindelijke "answer"-payload af.

Als je transparantie wilt, schakel dan in:

- `agents.defaults.heartbeat.includeReasoning: true`

Wanneer ingeschakeld leveren heartbeats ook een apart bericht af met het voorvoegsel `Reasoning:` (dezelfde vorm als `/reasoning on`). Dit kan nuttig zijn wanneer de agent meerdere sessies/codexen beheert en je wilt zien waarom hij besloot je te pingen — maar het kan ook meer interne details lekken dan je wilt. Houd het bij voorkeur uitgeschakeld in groepschats.

## Kostenbewustzijn

Heartbeats voeren volledige agent-turns uit. Kortere intervallen verbruiken meer tokens. Om kosten te verlagen:

- Gebruik `isolatedSession: true` om te voorkomen dat de volledige gespreksgeschiedenis wordt verzonden (~100K tokens omlaag naar ~2-5K per run).
- Gebruik `lightContext: true` om bootstrapbestanden te beperken tot alleen `HEARTBEAT.md`.
- Stel een goedkoper `model` in (bijv. `ollama/llama3.2:1b`).
- Houd `HEARTBEAT.md` klein.
- Gebruik `target: "none"` als je alleen interne statusupdates wilt.

## Contextoverloop na Heartbeat

Als een Heartbeat eerder een bestaande sessie op een kleiner lokaal model heeft achtergelaten, bijvoorbeeld een Ollama-model met een 32k-venster, en de volgende hoofdsessie-turn contextoverloop meldt, reset dan het sessie-runtime-model terug naar het geconfigureerde primaire model. Het resetbericht van OpenClaw benoemt dit wanneer het laatste runtime-model overeenkomt met geconfigureerde `heartbeat.model`.

Huidige heartbeats behouden het bestaande runtime-model van de gedeelde sessie nadat de run is voltooid. Je kunt nog steeds `isolatedSession: true` gebruiken om heartbeats in een nieuwe sessie te draaien, dit combineren met `lightContext: true` voor de kleinste prompt, of een Heartbeat-model kiezen met een contextvenster dat groot genoeg is voor de gedeelde sessie.

## Gerelateerd

- [Automatisering en taken](/nl/automation) — alle automatiseringsmechanismen in één overzicht
- [Achtergrondtaken](/nl/automation/tasks) — hoe losgekoppeld werk wordt gevolgd
- [Tijdzone](/nl/concepts/timezone) — hoe tijdzone Heartbeat-planning beïnvloedt
- [Probleemoplossing](/nl/automation/cron-jobs#troubleshooting) — automatiseringsproblemen debuggen
