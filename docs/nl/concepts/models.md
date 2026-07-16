---
read_when:
    - Fallbackgedrag van modellen of de gebruikerservaring voor modelselectie wijzigen
    - Foutopsporing voor 'model is niet toegestaan' of een verouderde terugvaloptie voor de standaardprovider
    - Werken aan het samenvoegings- en geheimengedrag van models.json
sidebarTitle: Models CLI
summary: Hoe OpenClaw provider-/modelreferenties, configuratiesleutels en de chatopdracht `/model` verwerkt
title: Modellen-CLI
x-i18n:
    generated_at: "2026-07-16T15:31:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 20a5e4861bdafa1f5ff549fc54968051b653611f1ef05e836df855638a7aa967
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Model-failover" href="/nl/concepts/model-failover">
    Rotatie van authenticatieprofielen, afkoelperiodes en de interactie daarvan met fallbacks.
  </Card>
  <Card title="Modelproviders" href="/nl/concepts/model-providers">
    Kort overzicht van providers en voorbeelden.
  </Card>
  <Card title="CLI-referentie voor modellen" href="/nl/cli/models">
    Volledige referentie voor de opdracht `openclaw models` en de bijbehorende vlaggen.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/config-agents#agent-defaults">
    Modelconfiguratiesleutels, standaardwaarden en voorbeelden.
  </Card>
</CardGroup>

Een modelreferentie (`provider/model`) kiest een provider en model, niet de onderliggende
agentruntime. Wanneer het runtimebeleid niet is ingesteld of `auto` is, kan het provider-eigen
routeringsbeleid van OpenAI Codex alleen selecteren voor een exacte officiële HTTPS Platform
Responses- of ChatGPT Responses-route zonder door de auteur ingestelde aanvraagoverschrijving; alleen het
voorvoegsel `openai/*` selecteert Codex nooit. Completions-adapters, aangepaste
eindpunten en door de auteur ingesteld aanvraaggedrag blijven op OpenClaw. Officiële
HTTP-eindpunten met platte tekst worden geweigerd. Zie [Impliciete OpenAI-agentruntime](/nl/providers/openai#implicit-agent-runtime).

Voor Copilot-referenties met abonnement (`github-copilot/*`) kan expliciet de externe
GitHub Copilot-agentruntime-Plugin worden ingeschakeld, maar dat pad is altijd expliciet (en wordt nooit
door `auto` geselecteerd). Runtimeoverschrijvingen horen bij provider-/modelbeleid, niet bij
de hele agent of sessie. Runtimeselectie bepaalt de facturering niet:
referenties voor OpenAI-API-sleutels en ChatGPT-/Codex-abonnementen blijven gescheiden. Zie
[Agentruntimes](/nl/concepts/agent-runtimes) en
[GitHub Copilot-agentruntime](/nl/plugins/copilot).

## Selectievolgorde

<Steps>
  <Step title="Primair model">
    `agents.defaults.model.primary` (of `agents.defaults.model` als gewone tekenreeks).
  </Step>
  <Step title="Fallbacks">
    `agents.defaults.model.fallbacks`, in volgorde geprobeerd.
  </Step>
  <Step title="Authenticatiefailover">
    Rotatie van authenticatieprofielen vindt binnen een provider plaats voordat OpenClaw naar het volgende fallbackmodel gaat.
  </Step>
</Steps>

Gerelateerde oppervlakken voor modelconfiguratie:

- `agents.defaults.models` is de toestemmingslijst/catalogus van modellen die OpenClaw kan gebruiken, plus aliassen. Gebruik vermeldingen van `provider/*` om elk ontdekt model van een provider toe te staan zonder ze afzonderlijk te vermelden.
- `agents.defaults.utilityModel` is een optioneel goedkoper model voor korte interne taken, zoals gegenereerde sessietitels voor het dashboard, ondersteunde thread-/onderwerptitels van kanalen en voortgangsbeschrijvingen. `agents.list[].utilityModel` per agent overschrijft dit. Wanneer dit niet is ingesteld, gebruikt OpenClaw de opgegeven standaard voor kleine modellen van de primaire provider als die bestaat (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`); anders wordt het primaire model van de agent gebruikt. Stel dit in op een lege tekenreeks om hulproutering uit te schakelen. Hulptaken zijn afzonderlijke modelaanroepen en kunnen begrensde taakinhoud naar de geselecteerde modelprovider sturen.
- `agents.defaults.imageModel` wordt alleen gebruikt wanneer het primaire model geen afbeeldingen kan accepteren.
- `agents.defaults.pdfModel` wordt gebruikt door de tool `pdf`. Als dit niet is ingesteld, valt de tool terug op `imageModel` en vervolgens op het herleide sessie-/standaardmodel.
- `agents.defaults.imageGenerationModel`, `musicGenerationModel` en `videoGenerationModel` ondersteunen de gedeelde tools voor mediageneratie. Als ze niet zijn ingesteld, leidt elke tool een door authenticatie ondersteunde providerstandaard af: eerst de huidige standaardprovider en daarna de overige geregistreerde providers voor die mogelijkheid, in volgorde van provider-id. Stel `agents.defaults.mediaGenerationAutoProviderFallback: false` in om die provideroverschrijdende afleiding uit te schakelen en expliciete fallbacks te behouden.
- `agents.list[].model` per agent (plus bindingen) overschrijft `agents.defaults.model` — zie [Routering met meerdere agents](/nl/concepts/multi-agent).

Volledige sleutelreferentie, standaardwaarden en JSON5-voorbeelden: [Configuratiereferentie](/nl/gateway/config-agents#agent-defaults).

## Selectiebron en striktheid van fallbacks

Dezelfde `provider/model` gedraagt zich anders, afhankelijk van de herkomst:

| Bron                                                                    | Gedrag                                                                                                                                                                                                                                                         |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Geconfigureerde standaard (`agents.defaults.model.primary`, primair per agent) | Normaal beginpunt; gebruikt `agents.defaults.model.fallbacks`.                                                                                                                                                                                                 |
| Automatische fallback                                                   | Tijdelijke herstelstatus, opgeslagen als `modelOverrideSource: "auto"`. OpenClaw test periodiek opnieuw het oorspronkelijke primaire model, wist de automatische selectie na herstel en kondigt fallback-/herstelovergangen eenmaal per statuswijziging aan.    |
| Gebruikersselectie voor de sessie                                       | Exact en strikt. `/model`, de modelkiezer, `session_status(model=...)` en `sessions.patch` slaan `modelOverrideSource: "user"` op. Als die provider/dat model onbereikbaar wordt, mislukt de uitvoering zichtbaar in plaats van terug te vallen op een ander geconfigureerd model. |
| Cron `--model` / payload `model`                    | Primair model per taak. Gebruikt nog steeds geconfigureerde fallbacks, tenzij de taak een eigen payload `fallbacks` opgeeft (`fallbacks: []` dwingt een strikte uitvoering af).                                                                            |

Andere selectieregels:

- Het wijzigen van `agents.defaults.model.primary` herschrijft bestaande sessievastzettingen niet. Als de status `This session is pinned to X; config primary Y will apply to new/unpinned sessions.` meldt, voer je `/model default` uit om de vastzetting te wissen.
- CLI-kiezers voor het standaardmodel en de toestemmingslijst respecteren `models.mode: "replace"` door alleen `models.providers.*.models` te tonen in plaats van de volledige ingebouwde catalogus.
- De modelkiezer in de Control UI vraagt de Gateway om de geconfigureerde modelweergave: `agents.defaults.models` wanneer dit is ingesteld (inclusief jokertekenvermeldingen van `provider/*`); anders `models.providers.*.models` plus providers met bruikbare authenticatie. De volledige ingebouwde catalogus is gereserveerd voor expliciete bladerweergaven (`models.list` met `view: "all"`, of `openclaw models list --all`).
- Gebruikersinterfaces voor providerinventaris gebruiken `models.list` met `view: "provider-config"` om door de bron opgegeven `models.providers.*.models`-rijen te tonen zonder toestemmingslijsten van kiezers toe te passen.

Volledige werking: [Model-failover](/nl/concepts/model-failover).

## Snel modelbeleid

- Stel je primaire model in op het krachtigste model van de nieuwste generatie dat voor je beschikbaar is.
- Gebruik fallbacks voor taken waarbij kosten/latentie belangrijk zijn en voor gesprekken met een lager risico.
- Vermijd oudere/zwakkere modelniveaus voor agents met ingeschakelde tools of niet-vertrouwde invoer.

## Onboarding

```bash
openclaw onboard
```

Stelt het model en de authenticatie in voor veelgebruikte providers zonder de configuratie handmatig te bewerken, waaronder OAuth voor een OpenAI Codex-abonnement en Anthropic (API-sleutel of hergebruik van de Claude CLI).

Als er geen primair model is geconfigureerd, selecteert een nieuwe configuratie met een OpenAI-API-sleutel
`openai/gpt-5.6`; de kale directe API-id wordt herleid naar het Sol-niveau. Een nieuwe
ChatGPT-/Codex-OAuth-configuratie selecteert de exacte catalogusreferentie `openai/gpt-5.6-sol`.
Bij herauthenticatie blijft een bestaand expliciet primair model behouden, waaronder
`openai/gpt-5.5`. Als GPT-5.6 niet beschikbaar is voor het account, selecteer je
expliciet `openai/gpt-5.5`; OpenClaw verlaagt het niveau niet stilzwijgend.

## "Model is niet toegestaan" (en waarom antwoorden stoppen)

Als `agents.defaults.models` is ingesteld, wordt dit de toestemmingslijst voor `/model` en sessieoverschrijvingen. Als je een model buiten die toestemmingslijst selecteert, wordt voordat een normaal antwoord wordt gegenereerd het volgende geretourneerd:

```text
Model "provider/model" is niet toegestaan. Gebruik /models om providers te tonen, of /models <provider> om modellen te tonen.
Voeg het toe met: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

Los dit op door het model aan `agents.defaults.models` toe te voegen, de toestemmingslijst volledig te wissen (de sleutel verwijderen) of een model uit `/model list` te kiezen. Als de geweigerde opdracht een runtimeoverschrijving zoals `/model openai/gpt-5.5 --runtime codex` bevatte, herstel je eerst de toestemmingslijst en probeer je daarna dezelfde opdracht `/model ... --runtime ...` opnieuw.

Voor lokale/GGUF-modellen moet de toestemmingslijst de volledige referentie met providervoorvoegsel bevatten, bijvoorbeeld `ollama/gemma4:26b` of `lmstudio/Gemma4-26b-a4-it-gguf` — controleer `openclaw models list --provider <provider>` voor de exacte tekenreeks. Alleen bestandsnamen of weergavenamen zijn niet voldoende zodra de toestemmingslijst actief is.

Gebruik jokertekenvermeldingen van `provider/*` om providers te beperken zonder elk model te vermelden:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

`/model`, `/models` en modelkiezers tonen dan alleen de ontdekte catalogus voor die providers, en nieuwe modellen kunnen verschijnen zonder de toestemmingslijst te bewerken. Combineer exacte vermeldingen van `provider/model` met vermeldingen van `provider/*` om één specifiek model van een andere provider op te nemen.

Voorbeeld van een toestemmingslijst met aliassen:

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-6" },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
}
```

<Accordion title="Veilige bewerkingen van de toestemmingslijst via de CLI">
Gebruik `--merge` voor additieve wijzigingen:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` weigert toewijzingen van gewone objecten aan `agents.defaults.models`, `models.providers` of `models.providers.<id>.models` wanneer daardoor bestaande vermeldingen verloren zouden gaan; gebruik `--replace` alleen wanneer de nieuwe waarde de volledige doelwaarde moet worden. Interactieve providerconfiguratie en `openclaw configure --section model` voegen providergebonden selecties al samen met de toestemmingslijst, zodat het toevoegen van een provider geen niet-gerelateerde vermeldingen verwijdert; configure behoudt een bestaande `agents.defaults.model.primary`. Expliciete opdrachten zoals `openclaw models auth login --provider <id> --set-default` en `openclaw models set <model>` vervangen nog steeds het primaire model.
</Accordion>

## `/model` in de chat

```text
/model
/model list
/model 3
/model openai/gpt-5.4
/model default
/model status
```

- `/model` en `/model list` tonen een compacte genummerde keuzelijst (modelfamilie + beschikbare providers); `/model <#>` selecteert hieruit. In Discord opent dit vervolgkeuzelijsten voor provider/model met een Submit-stap; in Telegram zijn selecties in de keuzelijst sessiegebonden en herschrijven ze nooit de permanente standaardwaarde van de agent in `openclaw.json`. `/models add` is verouderd en retourneert een bericht in plaats van modellen vanuit de chat te registreren.
- `/model` slaat de nieuwe sessieselectie onmiddellijk op. Als de agent inactief is, gebruikt de volgende uitvoering deze direct; als er al een uitvoering actief is, wordt de wissel in de wachtrij geplaatst voor het volgende geschikte nieuwe poging-punt (of een later punt als toolactiviteit of de uitvoer van het antwoord al is gestart).
- `/model default` wist de sessieselectie, zodat deze de geconfigureerde primaire selectie weer overneemt.
- Een door de gebruiker geselecteerde `/model`-referentie is strikt voor die sessie: als deze onbereikbaar wordt, mislukt het antwoord zichtbaar in plaats van stilzwijgend terug te vallen via `agents.defaults.model.fallbacks`. Geconfigureerde standaardwaarden en primaire modellen van cron-taken blijven terugvalketens gebruiken.
- `/model status` is de gedetailleerde weergave: authenticatiekandidaten per provider en (indien geconfigureerd) het providereindpunt `baseUrl` plus de `api`-modus.
- Modelreferenties worden verwerkt door ze bij de eerste `/` te splitsen; typ `provider/model`. Als de model-ID zelf `/` bevat (zoals bij OpenRouter), neem je het providervoorvoegsel op, bijvoorbeeld `/model openrouter/moonshotai/kimi-k2`. Als je de provider weglaat, probeert OpenClaw: (1) een overeenkomst met een alias, (2) een unieke overeenkomst met een geconfigureerde provider voor exact die model-ID zonder voorvoegsel, (3) de geconfigureerde standaardprovider (verouderde terugvaloptie) — en als die provider het geconfigureerde standaardmodel niet meer aanbiedt, in plaats daarvan het eerste geconfigureerde provider/model, om te voorkomen dat een verouderde standaardwaarde van een verwijderde provider wordt getoond.
- Modelreferenties worden genormaliseerd naar kleine letters; provider-ID's blijven verder exact, dus gebruik de ID die door de plugin wordt vermeld.

Volledig opdrachtgedrag en configuratie: [Slash-opdrachten](/nl/tools/slash-commands).

## CLI

```bash
openclaw models status
openclaw models list
openclaw models set <provider/model>
openclaw models set-image <provider/model>
openclaw models scan
openclaw models aliases list|add|remove
openclaw models fallbacks list|add|remove|clear
openclaw models image-fallbacks list|add|remove|clear
openclaw models auth list|add|login|paste-api-key|paste-token|setup-token|order
```

`openclaw models` zonder subopdracht is een snelkoppeling voor `models status`, die ook de OAuth-vervaltijd voor profielen in de authenticatieopslag toont (standaard wordt binnen 24h gewaarschuwd). Volledige vlaggen, JSON-structuren en subopdrachten voor authenticatieprofielen: [CLI-referentie voor modellen](/nl/cli/models).

<AccordionGroup>
  <Accordion title="Scannen (gratis OpenRouter-modellen)">
    `openclaw models scan` onderzoekt de openbare catalogus met gratis modellen van OpenRouter en kan kandidaten live testen op ondersteuning voor tools en afbeeldingen. De catalogus zelf is openbaar, dus scans van alleen metagegevens (`--no-probe`) vereisen geen sleutel; live tests en `--set-default`/`--set-image` vereisen een OpenRouter-API-sleutel (authenticatieprofiel of `OPENROUTER_API_KEY`) en schakelen zonder sleutel standaard veilig terug naar uitvoer met alleen metagegevens.

    Resultaten worden gerangschikt op: ondersteuning voor afbeeldingen, vervolgens toollatentie, vervolgens contextgrootte en vervolgens het aantal parameters. In een TTY vragen geteste resultaten om een interactieve terugvalselectie; de niet-interactieve modus vereist `--yes` om de standaardwaarden te accepteren.

  </Accordion>
</AccordionGroup>

## Modellenregister (`models.json`)

Aangepaste providers die onder `models.providers` zijn geconfigureerd, worden geschreven naar `models.json` in de agentmap (standaard `~/.openclaw/agents/<agentId>/agent/models.json`). Catalogi van providerplugins worden afzonderlijk opgeslagen als gegenereerde, door plugins beheerde catalogusfragmenten en automatisch geladen. Dit bestand wordt standaard met de configuratie samengevoegd; stel `models.mode: "replace"` in om alleen je geconfigureerde providers te gebruiken.

<AccordionGroup>
  <Accordion title="Voorrang in samenvoegmodus">
    Voor overeenkomende provider-ID's:

    - Een niet-lege `baseUrl` die al aanwezig is in de `models.json` van de agent, heeft voorrang.
    - Een niet-lege `apiKey` in `models.json` heeft alleen voorrang als die provider in de huidige configuratie-/authenticatieprofielcontext niet door SecretRef wordt beheerd.
    - Door SecretRef beheerde `apiKey`-waarden worden vernieuwd vanuit bronmarkeringen in plaats van opgeloste geheimen permanent op te slaan: de naam van de omgevingsvariabele voor omgevingsreferenties, `secretref-managed` voor bestands-/uitvoeringsreferenties.
    - Door SecretRef beheerde headerwaarden worden op dezelfde manier vernieuwd, met `secretref-env:ENV_VAR_NAME` voor omgevingsreferenties.
    - Lege of ontbrekende `apiKey`/`baseUrl` in `models.json` vallen terug op configuratie-`models.providers`.
    - Andere providervelden worden vernieuwd vanuit de configuratie en genormaliseerde catalogusgegevens.

  </Accordion>
</AccordionGroup>

Het permanent opslaan van markeringen is bronbepalend: OpenClaw schrijft markeringen uit de momentopname van de actieve bronconfiguratie (vóór omzetting), niet uit opgeloste runtimewaarden van geheimen, telkens wanneer `models.json` opnieuw wordt gegenereerd — ook voor door opdrachten aangestuurde paden zoals `openclaw agent`.

## Gerelateerd

- [Agent-runtimes](/nl/concepts/agent-runtimes) — OpenClaw, Codex en andere runtimes voor agentlussen
- [Configuratiereferentie](/nl/gateway/config-agents#agent-defaults) — configuratiesleutels voor modellen
- [Afbeeldingen genereren](/nl/tools/image-generation) — configuratie van afbeeldingsmodellen
- [Model-failover](/nl/concepts/model-failover) — terugvalketens
- [Modelproviders](/nl/concepts/model-providers) — providerroutering en authenticatie
- [CLI-referentie voor modellen](/nl/cli/models) — volledige referentie voor opdrachten en vlaggen
- [Muziek genereren](/nl/tools/music-generation) — configuratie van muziekmodellen
- [Video genereren](/nl/tools/video-generation) — configuratie van videomodellen
