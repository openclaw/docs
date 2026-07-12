---
read_when:
    - Heartbeat-frequentie of berichtgeving aanpassen
    - Kiezen tussen Heartbeat en Cron voor geplande taken
sidebarTitle: Heartbeat
summary: Heartbeat-pollingberichten en meldingsregels
title: Heartbeat
x-i18n:
    generated_at: "2026-07-12T08:53:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bc43539cde0bf4e00ee57d510d2188c4e7cc82d67e13b9f86ac5fc37c3c176d2
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat of Cron?** Zie [Automatisering](/nl/automation) voor advies over wanneer u welke gebruikt.
</Note>

Heartbeat voert **periodieke agentbeurten** uit in de hoofdsessie, zodat het model alles wat aandacht nodig heeft onder de aandacht kan brengen zonder u te overladen met berichten.

Heartbeat is een geplande beurt in de hoofdsessie en maakt **geen** records voor [achtergrondtaken](/nl/automation/tasks) aan. Taakrecords zijn bedoeld voor losgekoppeld werk (ACP-uitvoeringen, subagents, geïsoleerde Cron-taken).

Probleemoplossing: [Geplande taken](/nl/automation/cron-jobs#troubleshooting)

## Snel aan de slag (beginner)

<Steps>
  <Step title="Kies een interval">
    Laat Heartbeats ingeschakeld (standaard `30m`, of `1h` wanneer Anthropic OAuth-/tokenverificatie is geconfigureerd, inclusief hergebruik van de Claude CLI) of stel uw eigen interval in.
  </Step>
  <Step title="Voeg HEARTBEAT.md toe (optioneel)">
    Maak een korte `HEARTBEAT.md`-controlelijst of een `tasks:`-blok in de werkruimte van de agent.
  </Step>
  <Step title="Bepaal waar Heartbeat-berichten naartoe moeten">
    `target: "none"` is de standaardwaarde; stel `target: "last"` in om berichten naar het laatste contact te sturen.
  </Step>
  <Step title="Optionele afstemming">
    - Schakel de levering van Heartbeat-redeneringen in voor transparantie.
    - Gebruik lichtgewicht bootstrapcontext als Heartbeat-uitvoeringen alleen `HEARTBEAT.md` nodig hebben.
    - Schakel geïsoleerde sessies in om te voorkomen dat bij elke Heartbeat de volledige gespreksgeschiedenis wordt verzonden.
    - Beperk Heartbeats tot actieve uren (lokale tijd).

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

## Standaardwaarden

- Interval: `30m`. Door de standaardwaarden van de Anthropic-provider toe te passen, wordt dit verhoogd naar `1h` wanneer de vastgestelde verificatiemodus OAuth/token is (inclusief hergebruik van de Claude CLI), maar alleen zolang `heartbeat.every` niet is ingesteld. Stel `agents.defaults.heartbeat.every` of `agents.list[].heartbeat.every` per agent in; gebruik `0m` om dit uit te schakelen.
- Prompttekst (configureerbaar via `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Time-out: niet-ingestelde Heartbeat-beurten gebruiken `agents.defaults.timeoutSeconds` wanneer dit is ingesteld. Anders gebruiken ze het Heartbeat-interval, met een maximum van 600 seconden. Stel `agents.defaults.heartbeat.timeoutSeconds` of `agents.list[].heartbeat.timeoutSeconds` per agent in voor langer Heartbeat-werk.
- De Heartbeat-prompt wordt **ongewijzigd** als gebruikersbericht verzonden. De systeemprompt bevat alleen een sectie "Heartbeats" wanneer Heartbeats voor de standaardagent zijn ingeschakeld (en `includeSystemPromptSection` niet `false` is), en de uitvoering wordt intern gemarkeerd.
- Wanneer Heartbeats met `0m` zijn uitgeschakeld, laten normale uitvoeringen `HEARTBEAT.md` ook weg uit de bootstrapcontext, zodat het model geen instructies ziet die uitsluitend voor Heartbeat bedoeld zijn.
- Actieve uren (`heartbeat.activeHours`) worden gecontroleerd in de geconfigureerde tijdzone. Buiten het tijdvenster worden Heartbeats overgeslagen tot de volgende tik binnen het tijdvenster.
- Heartbeats worden automatisch uitgesteld zolang Cron-werk actief is of in de wachtrij staat. Stel `heartbeat.skipWhenBusy: true` in om een agent ook uit te stellen wanneer diens eigen sessiegebonden subagent of geneste opdrachtbanen bezet zijn; parallelle agents pauzeren niet langer alleen omdat een andere agent subagentwerk uitvoert.

## Waarvoor de Heartbeat-prompt dient

De standaardprompt is bewust breed:

- **Achtergrondtaken**: "Houd rekening met openstaande taken" spoort de agent aan om vervolgacties te controleren (Postvak IN, agenda, herinneringen, werk in de wachtrij) en urgente zaken onder de aandacht te brengen.
- **Contact met de gebruiker**: "Informeer overdag af en toe hoe het met uw gebruiker gaat" spoort aan tot een incidenteel, kort bericht zoals "hebt u iets nodig?", maar voorkomt nachtelijke berichtoverlast door uw geconfigureerde lokale tijdzone te gebruiken (zie [Tijdzone](/nl/concepts/timezone)).

Heartbeat kan reageren op voltooide [achtergrondtaken](/nl/automation/tasks), maar een Heartbeat-uitvoering maakt zelf geen taakrecord aan.

Als u wilt dat een Heartbeat iets heel specifieks doet (bijvoorbeeld "controleer Gmail PubSub-statistieken" of "controleer de status van de Gateway"), stelt u `agents.defaults.heartbeat.prompt` (of `agents.list[].heartbeat.prompt`) in op een aangepaste tekst (die ongewijzigd wordt verzonden).

## Antwoordcontract

- Als niets aandacht nodig heeft, antwoordt u met **`HEARTBEAT_OK`**.
- Heartbeat-uitvoeringen kunnen in plaats daarvan `heartbeat_respond` aanroepen met `notify: false` voor geen zichtbare update, of met `notify: true` plus `notificationText` voor een waarschuwing. Wanneer aanwezig, heeft het gestructureerde toolantwoord voorrang op de tekstuele terugvaloptie.
- Tijdens Heartbeat-uitvoeringen behandelt OpenClaw `HEARTBEAT_OK` als een bevestiging wanneer het aan het **begin of einde** van het antwoord staat. Het token wordt verwijderd en het antwoord wordt weggelaten als de resterende inhoud **≤ `ackMaxChars`** is (standaard: 300).
- Als `HEARTBEAT_OK` in het **midden** van een antwoord staat, wordt het niet speciaal behandeld.
- Neem bij waarschuwingen **geen** `HEARTBEAT_OK` op; retourneer alleen de waarschuwingstekst.

Buiten Heartbeats wordt een losstaande `HEARTBEAT_OK` aan het begin/einde van een bericht verwijderd en geregistreerd; een bericht dat alleen uit `HEARTBEAT_OK` bestaat, wordt weggelaten.

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
        includeSystemPromptSection: true, // default: true; false omits the ## Heartbeats system prompt section for the default agent
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### Bereik en prioriteit

- `agents.defaults.heartbeat` stelt het algemene Heartbeat-gedrag in.
- `agents.list[].heartbeat` wordt daar bovenop samengevoegd; als een agent een `heartbeat`-blok heeft, voeren **alleen die agents** Heartbeats uit.
- `channels.defaults.heartbeat` stelt de standaardwaarden voor zichtbaarheid voor alle kanalen in.
- `channels.<channel>.heartbeat` overschrijft de standaardwaarden van het kanaal.
- `channels.<channel>.accounts.<id>.heartbeat` (kanalen met meerdere accounts) overschrijft de instellingen per kanaal.

### Heartbeats per agent

Als een vermelding in `agents.list[]` een `heartbeat`-blok bevat, voeren **alleen die agents** Heartbeats uit. Het blok per agent wordt boven op `agents.defaults.heartbeat` samengevoegd (zodat u gedeelde standaardwaarden één keer kunt instellen en deze per agent kunt overschrijven).

Voorbeeld: twee agents, waarvan alleen de tweede agent Heartbeats uitvoert.

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

Buiten dit tijdvenster (vóór 9.00 uur of na 22.00 uur Eastern Time) worden Heartbeats overgeslagen. De volgende geplande tik binnen het tijdvenster wordt normaal uitgevoerd.

### 24/7-configuratie

Als u wilt dat Heartbeats de hele dag worden uitgevoerd, gebruikt u een van deze patronen:

- Laat `activeHours` volledig weg (geen beperking op basis van een tijdvenster; dit is het standaardgedrag).
- Stel een tijdvenster voor de hele dag in: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Stel niet dezelfde `start`- en `end`-tijd in (bijvoorbeeld van `08:00` tot `08:00`). Dit wordt behandeld als een tijdvenster zonder duur, waardoor Heartbeats altijd worden overgeslagen.
</Warning>

### Voorbeeld met meerdere accounts

Gebruik `accountId` om een specifiek account te selecteren op kanalen met meerdere accounts, zoals Telegram:

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

### Toelichting bij velden

<ParamField path="every" type="string">
  Heartbeat-interval (tekenreeks voor de duur; standaardeenheid = minuten).
</ParamField>
<ParamField path="model" type="string">
  Optionele overschrijving van het model voor Heartbeat-uitvoeringen (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Indien ingeschakeld, wordt ook het afzonderlijke `Thinking`-bericht geleverd wanneer dit beschikbaar is (dezelfde vorm als `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Wanneer dit waar is, gebruiken Heartbeat-uitvoeringen lichtgewicht bootstrapcontext en behouden ze alleen `HEARTBEAT.md` uit de bootstrapbestanden van de werkruimte.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Wanneer dit waar is, wordt elke Heartbeat uitgevoerd in een nieuwe sessie zonder eerdere gespreksgeschiedenis. Gebruikt hetzelfde isolatiepatroon als Cron met `sessionTarget: "isolated"`. Verlaagt de tokenkosten per Heartbeat aanzienlijk. Combineer dit met `lightContext: true` voor maximale besparing. De afleveringsroutering gebruikt nog steeds de context van de hoofdsessie.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Wanneer dit waar is, worden Heartbeat-uitvoeringen uitgesteld vanwege de aanvullende bezette banen van die agent: diens eigen sessiegebonden subagent of geneste opdrachtwerk. Cron-banen stellen Heartbeats altijd uit, ook zonder deze vlag, zodat hosts met lokale modellen niet tegelijkertijd Cron- en Heartbeat-prompts uitvoeren.
</ParamField>
<ParamField path="session" type="string">
  Optionele sessiesleutel voor Heartbeat-uitvoeringen.

- `main` (standaard): hoofdsessie van de agent.
- Expliciete sessiesleutel (kopieer deze uit `openclaw sessions --json` of de [sessie-CLI](/nl/cli/sessions)).
- Indelingen van sessiesleutels: zie [Sessies](/nl/concepts/session) en [Groepen](/nl/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: afleveren bij het laatst gebruikte externe kanaal.
- expliciet kanaal: elk geconfigureerd kanaal of elke Plugin-id, bijvoorbeeld `discord`, `matrix`, `telegram` of `whatsapp`.
- `none` (standaard): de Heartbeat uitvoeren, maar **niet extern afleveren**.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Bepaalt het gedrag voor directe/DM-aflevering. `allow`: directe/DM-aflevering van Heartbeats toestaan. `block`: directe/DM-aflevering onderdrukken (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Optionele overschrijving van de ontvanger (kanaalspecifieke id, bijvoorbeeld E.164 voor WhatsApp of een Telegram-chat-id). Gebruik voor Telegram-onderwerpen/-threads `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Optionele account-id voor kanalen met meerdere accounts. Bij `target: "last"` geldt de account-id voor het laatst bepaalde kanaal als dat accounts ondersteunt; anders wordt deze genegeerd. Als de account-id niet overeenkomt met een geconfigureerd account voor het bepaalde kanaal, wordt de bezorging overgeslagen.

</ParamField>
<ParamField path="prompt" type="string">
  Overschrijft de standaardprompttekst (wordt niet samengevoegd).

</ParamField>
<ParamField path="includeSystemPromptSection" type="boolean" default="true">
  Bepaalt of de sectie `## Heartbeats` van de systeemprompt van de standaardagent wordt ingevoegd. Stel dit in op `false` om het runtimegedrag van de Heartbeat te behouden (frequentie, bezorging, HEARTBEAT.md), terwijl de Heartbeat-instructies uit de systeemprompt van de agent worden weggelaten.

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Maximaal toegestaan aantal tekens na `HEARTBEAT_OK` vóór bezorging.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Onderdrukt, indien waar, waarschuwingen over toolfouten tijdens Heartbeat-uitvoeringen.

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  Maximaal toegestaan aantal seconden voor een Heartbeat-agentbeurt voordat deze wordt afgebroken. Laat dit oningesteld om `agents.defaults.timeoutSeconds` te gebruiken indien ingesteld; anders wordt de Heartbeat-frequentie gebruikt, met een maximum van 600 seconden.

</ParamField>
<ParamField path="activeHours" type="object">
  Beperkt Heartbeat-uitvoeringen tot een tijdvenster. Object met `start` (UU:MM, inclusief; gebruik `00:00` voor het begin van de dag), `end` (UU:MM, exclusief; `24:00` is toegestaan voor het einde van de dag) en optioneel `timezone`.

- Weggelaten of `"user"`: gebruikt je `agents.defaults.userTimezone` indien ingesteld; anders wordt teruggevallen op de tijdzone van het hostsysteem.
- `"local"`: gebruikt altijd de tijdzone van het hostsysteem.
- Elke IANA-id (bijvoorbeeld `America/New_York`): wordt rechtstreeks gebruikt; indien ongeldig, wordt teruggevallen op het hierboven beschreven gedrag van `"user"`.
- `start` en `end` mogen voor een actief venster niet gelijk zijn; gelijke waarden worden behandeld als een venster zonder breedte (altijd buiten het venster).
- Buiten het actieve venster worden Heartbeats overgeslagen tot de volgende tik binnen het venster.

</ParamField>

## Bezorgingsgedrag

<AccordionGroup>
  <Accordion title="Sessie- en doelroutering">
    - Heartbeats worden standaard uitgevoerd in de hoofdsessie van de agent (`agent:<id>:<mainKey>`), of in `global` wanneer `session.scope = "global"`. Stel `session` in om dit te overschrijven met een specifieke kanaalsessie (Discord/WhatsApp/enzovoort).
    - `session` beïnvloedt alleen de uitvoeringscontext; de bezorging wordt geregeld door `target` en `to`.
    - Stel `target` + `to` in om naar een specifiek kanaal of een specifieke ontvanger te bezorgen. Met `target: "last"` gebruikt de bezorging het laatste externe kanaal voor die sessie.
    - Heartbeat-bezorgingen staan standaard rechtstreekse/DM-doelen toe. Stel `directPolicy: "block"` in om verzending naar rechtstreekse doelen te onderdrukken, terwijl de Heartbeat-beurt nog steeds wordt uitgevoerd.
    - Als de hoofdwachtrij, de lane van de doelsessie, de Cron-lane of een actieve Cron-taak bezet is, wordt de Heartbeat overgeslagen en later opnieuw geprobeerd.
    - Als `skipWhenBusy: true` is ingesteld, stellen ook de sessiesleutelgebonden subagent- en geneste lanes van deze agent Heartbeat-uitvoeringen uit. Bezette lanes van andere agents stellen deze agent niet uit.
    - Als `target` niet naar een externe bestemming kan worden herleid, vindt de uitvoering nog steeds plaats, maar wordt er geen uitgaand bericht verzonden.

  </Accordion>
  <Accordion title="Zichtbaarheid en overslaggedrag">
    - Als `showOk`, `showAlerts` en `useIndicator` allemaal zijn uitgeschakeld, wordt de uitvoering vooraf overgeslagen met `reason=alerts-disabled`.
    - Als alleen de bezorging van waarschuwingen is uitgeschakeld, kan OpenClaw de Heartbeat nog steeds uitvoeren, tijdstempels van verschuldigde taken bijwerken, de inactiviteitstijdstempel van de sessie herstellen en de uitgaande waarschuwingspayload onderdrukken.
    - Als het bepaalde Heartbeat-doel typen ondersteunt, toont OpenClaw een type-indicator terwijl de Heartbeat-uitvoering actief is. Hiervoor wordt hetzelfde doel gebruikt waarnaar de Heartbeat chatuitvoer zou verzenden; dit wordt uitgeschakeld door `typingMode: "never"`.

  </Accordion>
  <Accordion title="Sessielevenscyclus en controle">
    - Antwoorden die uitsluitend van Heartbeat afkomstig zijn, houden de sessie **niet** actief. Heartbeat-metagegevens kunnen de sessierij bijwerken, maar het verlopen wegens inactiviteit gebruikt `lastInteractionAt` van het laatste echte gebruikers-/kanaalbericht en het dagelijks verlopen gebruikt `sessionStartedAt`.
    - De geschiedenis van de Control UI en WebChat verbergt Heartbeat-prompts en bevestigingen die alleen OK bevatten. Het onderliggende sessietranscript kan deze beurten nog steeds bevatten voor controle en herhaling.
    - Losgekoppelde [achtergrondtaken](/nl/automation/tasks) kunnen een systeemgebeurtenis in de wachtrij plaatsen en Heartbeat activeren wanneer de hoofdsessie snel ergens van op de hoogte moet worden gebracht. Door die activering wordt de Heartbeat-uitvoering geen achtergrondtaak.

  </Accordion>
</AccordionGroup>

## Zichtbaarheidsinstellingen

Standaard worden `HEARTBEAT_OK`-bevestigingen onderdrukt, terwijl waarschuwingsinhoud wel wordt bezorgd. Je kunt dit per kanaal of per account aanpassen:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Verberg HEARTBEAT_OK (standaard)
      showAlerts: true # Toon waarschuwingsberichten (standaard)
      useIndicator: true # Stuur indicatorgebeurtenissen (standaard)
  telegram:
    heartbeat:
      showOk: true # Toon OK-bevestigingen op Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Onderdruk de bezorging van waarschuwingen voor dit account
```

Voorrang: per account → per kanaal → kanaalstandaarden → ingebouwde standaarden.

### Wat elke vlag doet

- `showOk`: verzendt een `HEARTBEAT_OK`-bevestiging wanneer het model een antwoord met alleen OK retourneert.
- `showAlerts`: verzendt de waarschuwingsinhoud wanneer het model een antwoord retourneert dat niet OK is.
- `useIndicator`: stuurt indicatorgebeurtenissen voor UI-statusoppervlakken.

Als **alle drie** onwaar zijn, slaat OpenClaw de Heartbeat-uitvoering volledig over (geen modelaanroep).

### Voorbeelden per kanaal en per account

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # alle Slack-accounts
    accounts:
      ops:
        heartbeat:
          showAlerts: false # onderdruk waarschuwingen alleen voor het ops-account
  telegram:
    heartbeat:
      showOk: true
```

### Veelgebruikte patronen

| Doel                                             | Configuratie                                                                              |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Standaardgedrag (stille OK's, waarschuwingen aan) | _(geen configuratie nodig)_                                                               |
| Volledig stil (geen berichten, geen indicator)    | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Alleen indicator (geen berichten)                 | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| Alleen OK's in één kanaal                         | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (optioneel)

Als er een bestand `HEARTBEAT.md` in de werkruimte bestaat, vertelt de standaardprompt de agent dit te lezen. Beschouw het als je 'Heartbeat-controlelijst': klein, stabiel en veilig om elke 30 minuten te raadplegen.

Bij normale uitvoeringen wordt `HEARTBEAT.md` alleen ingevoegd wanneer Heartbeat-richtlijnen voor de standaardagent zijn ingeschakeld. Als je de Heartbeat-frequentie uitschakelt met `0m` of `includeSystemPromptSection: false` instelt, wordt het bestand uit de normale bootstrapcontext weggelaten.

In de native Codex-harness wordt de inhoud van `HEARTBEAT.md` niet zoals andere bootstrapbestanden in de beurt ingevoegd. Als het bestand bestaat en inhoud bevat die niet uitsluitend uit witruimte bestaat, verwijst een notitie voor de Heartbeat-samenwerkingsmodus Codex naar het bestand en wordt aangegeven dat het bestand moet worden gelezen voordat er wordt doorgegaan.

Als `HEARTBEAT.md` bestaat maar feitelijk leeg is (alleen lege regels, Markdown-/HTML-opmerkingen, Markdown-koppen zoals `# Heading`, fence-markeringen of lege controlelijstitems), slaat OpenClaw de Heartbeat-uitvoering over om API-aanroepen te besparen. Die overslag wordt gemeld als `reason=empty-heartbeat-file`. Als het bestand ontbreekt, wordt de Heartbeat nog steeds uitgevoerd en bepaalt het model wat het moet doen.

Houd het klein (een korte controlelijst of herinneringen) om een opgeblazen prompt te voorkomen.

Voorbeeld van `HEARTBEAT.md`:

```md
# Heartbeat-controlelijst

- Snelle controle: is er iets dringends in de postvakken?
- Als het overdag is, voer dan een korte controle uit als er niets anders openstaat.
- Als een taak geblokkeerd is, noteer dan _wat er ontbreekt_ en vraag Peter er de volgende keer naar.
```

### `tasks:`-blokken

`HEARTBEAT.md` ondersteunt ook een klein gestructureerd `tasks:`-blok voor intervalgebaseerde controles binnen Heartbeat zelf.

Voorbeeld:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Controleer op dringende ongelezen e-mails en markeer alles wat tijdkritisch is."
- name: calendar-scan
  interval: 2h
  prompt: "Controleer op komende vergaderingen die voorbereiding of opvolging vereisen."

# Aanvullende instructies

- Houd waarschuwingen kort.
- Als na alle verschuldigde taken niets aandacht vereist, antwoord dan met HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="Gedrag">
    - OpenClaw parseert het `tasks:`-blok en controleert elke taak aan de hand van het eigen `interval`.
    - Alleen **verschuldigde** taken worden voor die tik in de Heartbeat-prompt opgenomen.
    - Als er geen taken verschuldigd zijn, wordt de Heartbeat volledig overgeslagen (`reason=no-tasks-due`) om een verspilde modelaanroep te voorkomen.
    - Inhoud in `HEARTBEAT.md` die geen taak is, blijft behouden en wordt na de lijst met verschuldigde taken als aanvullende context toegevoegd.
    - Tijdstempels van de laatste taakuitvoering worden opgeslagen in de sessiestatus (`heartbeatTaskState`), zodat intervallen normale herstarts overleven.
    - Taaktijdstempels worden alleen bijgewerkt nadat een Heartbeat-uitvoering het normale antwoordpad heeft voltooid. Overgeslagen uitvoeringen met `empty-heartbeat-file` / `no-tasks-due` markeren taken niet als voltooid.

  </Accordion>
</AccordionGroup>

De taakmodus is nuttig wanneer je één Heartbeat-bestand verschillende periodieke controles wilt laten bevatten zonder bij elke tik voor al deze controles te betalen.

### Kan de agent HEARTBEAT.md bijwerken?

Ja, als je daarom vraagt.

`HEARTBEAT.md` is gewoon een normaal bestand in de werkruimte van de agent, dus je kunt de agent (in een normale chat) bijvoorbeeld het volgende opdragen:

- "Werk `HEARTBEAT.md` bij om een dagelijkse agendacontrole toe te voegen."
- "Herschrijf `HEARTBEAT.md` zodat het korter is en gericht is op opvolging van het postvak."

Als je wilt dat dit proactief gebeurt, kun je ook een expliciete regel in je Heartbeat-prompt opnemen, zoals: "Als de controlelijst verouderd raakt, werk HEARTBEAT.md dan bij met een betere versie."

<Warning>
Zet geen geheimen (API-sleutels, telefoonnummers, privétokens) in `HEARTBEAT.md`; het wordt onderdeel van de promptcontext.
</Warning>

## Handmatig activeren (op aanvraag)

Gebruik `openclaw system event` om een systeemgebeurtenis in de wachtrij te plaatsen en optioneel onmiddellijk een Heartbeat te activeren:

```bash
openclaw system event --text "Controleer op dringende opvolgingen" --mode now
```

| Vlag                         | Beschrijving                                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `--text <text>`              | Tekst van de systeemgebeurtenis (verplicht).                                                                      |
| `--mode <mode>`              | `now` voert onmiddellijk een Heartbeat uit; `next-heartbeat` (standaard) wacht op de volgende geplande tik.       |
| `--session-key <sessionKey>` | Richt de gebeurtenis op een specifieke sessie; standaard wordt de hoofdsessie van de agent gebruikt.             |
| `--json`                     | Voer JSON uit.                                                                                                    |

Als er geen `--session-key` is opgegeven en meerdere agents `heartbeat` hebben geconfigureerd, voert `--mode now` onmiddellijk de Heartbeats van elk van die agents uit.

Gerelateerde Heartbeat-instellingen in dezelfde CLI-groep:

```bash
openclaw system heartbeat last     # toon de laatste Heartbeat-gebeurtenis
openclaw system heartbeat enable   # schakel Heartbeats in
openclaw system heartbeat disable  # schakel Heartbeats uit
```

## Bezorging van redenering (optioneel)

Standaard leveren heartbeats alleen de uiteindelijke payload met het 'antwoord'.

Als je transparantie wilt, schakel je het volgende in:

- `agents.defaults.heartbeat.includeReasoning: true`

Wanneer dit is ingeschakeld, leveren heartbeats ook een afzonderlijk bericht met het voorvoegsel `Thinking` (dezelfde vorm als `/reasoning on`). Dit kan nuttig zijn wanneer de agent meerdere sessies/codexen beheert en je wilt zien waarom deze besloot je een bericht te sturen, maar het kan ook meer interne details prijsgeven dan je wilt. Laat dit bij voorkeur uitgeschakeld in groepschats.

## Kostenbewustzijn

Heartbeats voeren volledige agentbeurten uit. Kortere intervallen verbruiken meer tokens. Zo verlaag je de kosten:

- Gebruik `isolatedSession: true` om te voorkomen dat de volledige gespreksgeschiedenis wordt verzonden (van circa 100.000 tokens naar circa 2.000-5.000 per uitvoering).
- Gebruik `lightContext: true` om de bootstrapbestanden te beperken tot alleen `HEARTBEAT.md`.
- Stel een goedkoper `model` in (bijvoorbeeld `ollama/llama3.2:1b`).
- Houd `HEARTBEAT.md` klein.
- Gebruik `target: "none"` als je alleen interne statusupdates wilt.

## Contextoverschrijding na een heartbeat

Heartbeats behouden na voltooiing van de uitvoering het bestaande runtimemodel van de gedeelde sessie. Daardoor kan een heartbeat die een sessie naar een kleiner lokaal model heeft overgeschakeld (bijvoorbeeld een Ollama-model met een contextvenster van 32k) dat model actief laten voor de volgende beurt in de hoofdsessie. Als die volgende beurt vervolgens een contextoverschrijding meldt en het laatste runtimemodel van de sessie overeenkomt met het geconfigureerde `heartbeat.model`, wijst het herstelbericht van OpenClaw op doorsijpeling van het heartbeatmodel als waarschijnlijke oorzaak en stelt het een oplossing voor.

Om dit te voorkomen: gebruik `isolatedSession: true` om heartbeats in een nieuwe sessie uit te voeren (eventueel gecombineerd met `lightContext: true` voor de kleinste prompt), of kies een heartbeatmodel met een contextvenster dat groot genoeg is voor de gedeelde sessie.

## Gerelateerd

- [Automatisering](/nl/automation) - alle automatiseringsmechanismen in één oogopslag
- [Achtergrondtaken](/nl/automation/tasks) - hoe losgekoppeld werk wordt bijgehouden
- [Tijdzone](/nl/concepts/timezone) - hoe de tijdzone de planning van heartbeats beïnvloedt
- [Probleemoplossing](/nl/automation/cron-jobs#troubleshooting) - automatiseringsproblemen opsporen
