---
read_when:
    - Modellen kiezen of wisselen, aliassen configureren
    - Foutopsporing voor model-failover / ‘Alle modellen zijn mislukt’
    - Inzicht in authenticatieprofielen en hoe u ze beheert
sidebarTitle: Models FAQ
summary: 'Veelgestelde vragen: standaardmodellen, selectie, aliassen, wisselen, failover en authenticatieprofielen'
title: 'Veelgestelde vragen: modellen en authenticatie'
x-i18n:
    generated_at: "2026-07-12T08:53:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 071e89c01120849179d3bc372153eb2c76a0fa4e93846df42920f0d961d597df
    source_path: help/faq-models.md
    workflow: 16
---

  Vraag en antwoord over modellen en authenticatieprofielen. Zie voor installatie, sessies, Gateway, kanalen en
  probleemoplossing de algemene [veelgestelde vragen](/nl/help/faq).

  ## Modellen: standaardwaarden, selectie, aliassen en wisselen

  <AccordionGroup>
  <Accordion title='Wat is het "standaardmodel"?'>
    Stel dit in met:

    ```text
    agents.defaults.model.primary
    ```

    Modellen zijn verwijzingen in de vorm `provider/model` (bijvoorbeeld `openai/gpt-5.5`,
    `anthropic/claude-sonnet-4-6`). Stel `provider/model` altijd expliciet in. Als
    je de provider weglaat, probeert OpenClaw eerst een overeenkomst met een alias,
    daarna een unieke overeenkomst met een geconfigureerde provider voor die model-id
    en valt vervolgens terug op de geconfigureerde standaardprovider (verouderd
    compatibiliteitspad). Als die provider het geconfigureerde standaardmodel niet
    meer heeft, valt OpenClaw terug op de eerste geconfigureerde provider/model-combinatie
    in plaats van op een verouderde standaardwaarde.

  </Accordion>

  <Accordion title="Welk model raden jullie aan?">
    Gebruik het krachtigste model van de nieuwste generatie dat je providerstack
    aanbiedt, vooral voor agents met toegang tot tools of met niet-vertrouwde invoer —
    zwakkere of te sterk gekwantiseerde modellen zijn kwetsbaarder voor promptinjectie
    en onveilig gedrag (zie [Beveiliging](/nl/gateway/security)). Routeer goedkopere
    modellen op basis van de agentrol naar routinematige chats met een laag risico.

    Routeer modellen per agent en gebruik subagents om langdurige taken te
    parallelliseren (elke subagent verbruikt eigen tokens). Zie [Modellen](/nl/concepts/models),
    [Subagents](/nl/tools/subagents), [MiniMax](/nl/providers/minimax) en
    [Lokale modellen](/nl/gateway/local-models).

  </Accordion>

  <Accordion title="Hoe wissel ik van model zonder mijn configuratie te wissen?">
    Wijzig alleen de modelvelden — vervang niet de volledige configuratie.

    - `/model` in de chat (per sessie, zie [Slash-opdrachten](/nl/tools/slash-commands))
    - `openclaw models set ...` (werkt alleen de modelconfiguratie bij)
    - `openclaw configure --section model` (interactief)
    - bewerk `agents.defaults.model` rechtstreeks in `~/.openclaw/openclaw.json`

    Inspecteer bij RPC-bewerkingen eerst met `config.schema.lookup` (genormaliseerd
    pad, beknopte schemadocumentatie en samenvattingen van onderliggende elementen)
    en geef daarna de voorkeur aan `config.patch` boven `config.apply` met een
    gedeeltelijk object. Als je de configuratie toch hebt overschreven, herstel
    deze dan vanuit een back-up of voer `openclaw doctor` uit om haar te repareren.

    Documentatie: [Modellen](/nl/concepts/models), [Configureren](/nl/cli/configure),
    [Configuratie](/nl/cli/config), [Doctor](/nl/gateway/doctor).

  </Accordion>

  <Accordion title="Kan ik zelf gehoste modellen gebruiken (llama.cpp, vLLM, Ollama)?">
    Ja — Ollama is de eenvoudigste optie. Snelle installatie:

    1. Installeer Ollama vanaf `https://ollama.com/download`
    2. Haal een lokaal model op, bijvoorbeeld `ollama pull gemma4`
    3. Voer voor cloudmodellen ook `ollama signin` uit
    4. Voer `openclaw onboard` uit, kies `Ollama` en vervolgens `Local` of `Cloud + Local`

    `Cloud + Local` biedt zowel cloudmodellen als je lokale Ollama-modellen;
    voor cloudmodellen zoals `kimi-k2.5:cloud` hoef je niets lokaal op te halen.
    Handmatig wisselen: `openclaw models list`, gevolgd door
    `openclaw models set ollama/<model>`.

    Kleinere of sterk gekwantiseerde modellen zijn kwetsbaarder voor promptinjectie.
    Gebruik grote modellen voor elke bot met toegang tot tools. Als je toch kleine
    modellen gebruikt, schakel dan sandboxing en strikte toelatingslijsten voor tools in.

    Documentatie: [Ollama](/nl/providers/ollama), [Lokale modellen](/nl/gateway/local-models),
    [Modelproviders](/nl/concepts/model-providers), [Beveiliging](/nl/gateway/security),
    [Sandboxing](/nl/gateway/sandboxing).

  </Accordion>

  <Accordion title="Hoe wissel ik direct van model (zonder opnieuw te starten)?">
    Stuur `/model <name>` als afzonderlijk bericht. Zie
    [Slash-opdrachten](/nl/tools/slash-commands) voor de
    volledige opdrachtenlijst, inclusief de genummerde keuzelijst (`/model`, `/model
    list`, `/model 3`), `/model default` om een sessieoverschrijving te wissen en
    `/model status` voor details over het eindpunt en de API-modus.

    Dwing met `@profile` per sessie een specifiek authenticatieprofiel af:

    ```text
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Om een met `@profile` vastgezet profiel los te maken, voer je `/model` opnieuw
    uit zonder het achtervoegsel (bijvoorbeeld `/model anthropic/claude-opus-4-6`)
    of kies je de standaardwaarde via `/model`. Gebruik `/model status` om het
    actieve authenticatieprofiel te bevestigen.

  </Accordion>

  <Accordion title="Als twee providers dezelfde model-id aanbieden, welke gebruikt /model dan?">
    `/model provider/model` selecteert exact die providerroute. Zo zijn
    `qianfan/deepseek-v4-flash` en `deepseek/deepseek-v4-flash` verschillende
    verwijzingen, hoewel de model-id hetzelfde is — OpenClaw wisselt niet
    ongemerkt van provider op basis van alleen een overeenkomstige id.

    Een door de gebruiker geselecteerde `/model`-verwijzing is strikt wat betreft
    uitwijking: als die provider/model-combinatie niet meer beschikbaar is, mislukt
    het antwoord zichtbaar in plaats van terug te vallen op
    `agents.defaults.model.fallbacks`. Geconfigureerde uitwijkketens blijven van
    toepassing op geconfigureerde standaardwaarden, primaire modellen voor Cron-taken
    en automatisch geselecteerde uitwijkstatussen. Wanneer een uitvoering zonder
    sessieoverschrijving mag uitwijken, probeert OpenClaw eerst de aangevraagde
    provider/model-combinatie, vervolgens de geconfigureerde uitwijkmodellen en
    daarna het geconfigureerde primaire model — dubbele losse model-id's springen
    dus nooit rechtstreeks terug naar de standaardprovider.

    Zie [Modellen](/nl/concepts/models) en [Modeluitwijking](/nl/concepts/model-failover).

  </Accordion>

  <Accordion title="Kan ik GPT 5.5 gebruiken voor dagelijkse taken en Codex 5.5 voor programmeren?">
    Ja — de modelkeuze en de runtimekeuze staan los van elkaar:

    - **Native Codex-programmeeragent:** stel `agents.defaults.model.primary` in op
      `openai/gpt-5.5`. Meld je aan met `openclaw models auth login --provider
      openai` voor authenticatie via een ChatGPT-/Codex-abonnement.
    - **Rechtstreekse OpenAI API-taken buiten de agentlus:** configureer
      `OPENAI_API_KEY` voor afbeeldingen, embeddings, spraak, realtime en andere
      OpenAI API-onderdelen die niet voor agents zijn bedoeld.
    - **Authenticatie met een API-sleutel voor OpenAI-agents:** `/model openai/gpt-5.5`
      met een geordend `openai`-API-sleutelprofiel.
    - **Subagents:** routeer programmeertaken naar een op Codex gerichte agent met
      een eigen `openai/gpt-5.5`-model.

    Zie [Modellen](/nl/concepts/models) en [Slash-opdrachten](/nl/tools/slash-commands).

  </Accordion>

  <Accordion title="Hoe configureer ik de snelle modus voor GPT 5.5?">
    - **Per sessie:** stuur `/fast on` terwijl je `openai/gpt-5.5` gebruikt.
    - **Standaardwaarde per model:** stel
      `agents.defaults.models["openai/gpt-5.5"].params.fastMode` in op `true`.
    - **Automatische grens:** met `/fast auto` of `params.fastMode: "auto"` worden
      nieuwe modelaanroepen snel uitgevoerd tot de grens is bereikt; latere
      nieuwe pogingen, uitwijkingen, toolresultaten of vervolgaanroepen worden
      vervolgens zonder snelle modus uitgevoerd. De grens is standaard 60 seconden;
      overschrijf dit met `params.fastAutoOnSeconds` voor het model.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: "auto",
                fastAutoOnSeconds: 30,
              },
            },
          },
        },
      },
    }
    ```

    De snelle modus komt overeen met `service_tier = "priority"` voor native
    OpenAI Responses-aanvragen; bestaande `service_tier`-waarden blijven behouden
    en de snelle modus herschrijft `reasoning` of `text.verbosity` niet.
    Sessieoverschrijvingen met `/fast` hebben voorrang op configuratiestandaarden.

    Zie [Denken en snelle modus](/nl/tools/thinking) en de sectie over de snelle modus
    onder Geavanceerde configuratie op de providerpagina van
    [OpenAI](/nl/providers/openai).

  </Accordion>

  <Accordion title='Waarom zie ik "Model ... is not allowed" en krijg ik daarna geen antwoord?'>
    Als `agents.defaults.models` is ingesteld, wordt dit de **toelatingslijst** voor
    `/model` en sessieoverschrijvingen. Als je een model buiten die lijst kiest,
    verschijnt dit in plaats van een normaal antwoord:

    ```text
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Oplossing: voeg het exacte model toe aan `agents.defaults.models`, voeg voor
    dynamische catalogi een jokerteken voor de provider toe, zoals `"provider/*": {}`,
    verwijder de toelatingslijst of kies een model uit `/model list`. Als de
    opdracht ook `--runtime codex` bevatte, werk dan eerst de toelatingslijst bij
    en probeer vervolgens dezelfde opdracht
    `/model provider/model --runtime codex` opnieuw.

  </Accordion>

  <Accordion title='Waarom zie ik "Unknown model: minimax/MiniMax-M3"?'>
    Als je een oudere OpenClaw-versie gebruikt, voer dan eerst een upgrade uit
    (of werk vanuit de broncode op `main`) en start de Gateway opnieuw —
    `MiniMax-M3` staat mogelijk nog niet in de catalogus van je geïnstalleerde
    versie. Anders is de MiniMax-provider niet geconfigureerd (er is geen
    providervermelding of authenticatieprofiel gevonden), waardoor het model
    niet kan worden gevonden. Zie de sectie Probleemoplossing op de providerpagina
    van [MiniMax](/nl/providers/minimax) voor de volledige controlelijst met
    oplossingen, de tabel met provider-/model-id's en een voorbeeld van een
    configuratieblok.

  </Accordion>

  <Accordion title="Kan ik MiniMax als standaardmodel gebruiken en OpenAI voor complexe taken?">
    Ja. Gebruik MiniMax als standaardmodel en wissel per sessie van model —
    uitwijkmodellen zijn bedoeld voor fouten, niet voor "moeilijke taken". Gebruik
    daarvoor `/model` of een afzonderlijke agent.

    **Optie A: per sessie wisselen**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Voer daarna `/model gpt` uit.

    **Optie B: afzonderlijke agents** — Agent A gebruikt standaard MiniMax en Agent B
    standaard OpenAI; routeer per agent of gebruik `/agent` om te wisselen.

    Documentatie: [Modellen](/nl/concepts/models), [Routering met meerdere agents](/nl/concepts/multi-agent),
    [MiniMax](/nl/providers/minimax), [OpenAI](/nl/providers/openai).

  </Accordion>

  <Accordion title="Zijn opus / sonnet / gpt ingebouwde snelkoppelingen?">
    Ja — ingebouwde verkorte namen, die alleen worden toegepast wanneer het
    doelmodel in `agents.defaults.models` bestaat:

    | Alias | Wordt omgezet naar |
    | --- | --- |
    | `opus` | `anthropic/claude-opus-4-8` |
    | `sonnet` | `anthropic/claude-sonnet-4-6` |
    | `gpt` | `openai/gpt-5.4` |
    | `gpt-mini` | `openai/gpt-5.4-mini` |
    | `gpt-nano` | `openai/gpt-5.4-nano` |
    | `gemini` | `google/gemini-3.1-pro-preview` |
    | `gemini-flash` | `google/gemini-3-flash-preview` |
    | `gemini-flash-lite` | `google/gemini-3.1-flash-lite` |

    Je eigen alias met dezelfde naam overschrijft de ingebouwde alias.

  </Accordion>

  <Accordion title="Hoe definieer of overschrijf ik modelsnelkoppelingen (aliassen)?">
    Aliassen staan in `agents.defaults.models.<modelId>.alias`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
          },
        },
      },
    }
    ```

    Vervolgens wordt `/model sonnet` (of `/<alias>` wanneer dit wordt ondersteund)
    omgezet naar die model-id.

  </Accordion>

  <Accordion title="Hoe voeg ik modellen van andere providers toe, zoals OpenRouter of Z.AI?">
    OpenRouter (betalen per token; veel modellen):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (GLM-modellen):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5.1" },
          models: { "zai/glm-5.1": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Als de providersleutel voor een provider/model-combinatie waarnaar wordt
    verwezen ontbreekt, treedt tijdens runtime een authenticatiefout op
    (bijvoorbeeld `No API key found for provider "zai"`).

    **Geen API-sleutel gevonden voor de provider na het toevoegen van een nieuwe agent**

    Een nieuwe agent heeft een lege authenticatieopslag — authenticatie wordt
    per agent opgeslagen in:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Oplossing: voer `openclaw agents add <id>` uit en configureer de authenticatie in de wizard, of
    kopieer alleen overdraagbare statische `api_key`/`token`-profielen uit de opslag van de
    hoofdagent. Meld u voor OAuth aan vanuit de nieuwe agent wanneer deze een
    eigen account nodig heeft. Zie [Routering met meerdere agents](/nl/concepts/multi-agent) voor de
    volledige regels voor hergebruik van `agentDir` en het delen van referenties — hergebruik
    `agentDir` nooit voor meerdere agents.

  </Accordion>
</AccordionGroup>

## Model-failover en "Alle modellen zijn mislukt"

<AccordionGroup>
  <Accordion title="Hoe werkt failover?">
    Twee fasen:

    1. **Rotatie van authenticatieprofielen** binnen dezelfde provider.
    2. **Terugval naar een model** naar het volgende model in `agents.defaults.model.fallbacks`.

    Voor mislukte profielen gelden afkoelperioden (exponentiële back-off), zodat OpenClaw
    blijft reageren wanneer een provider snelheidsbeperkingen oplegt of tijdelijk uitvalt.

    De bucket voor snelheidsbeperkingen omvat meer dan alleen `429`: `Too many concurrent
    requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai
    ... quota limit exceeded`, `resource exhausted` en periodieke
    gebruiksvensterlimieten (`weekly/monthly limit reached`) gelden allemaal als
    snelheidsbeperkingen waarvoor failover van toepassing is.

    Factureringsreacties zijn niet altijd `402`, en sommige `402`-reacties blijven in de
    tijdelijke bucket/bucket voor snelheidsbeperkingen in plaats van in het factureringstraject. Expliciete
    factureringstekst bij `401`/`403` kan nog steeds naar facturering worden gerouteerd; providerspecifieke
    tekstmatchers (bijvoorbeeld OpenRouter `Key limit exceeded`) blijven beperkt tot hun
    eigen provider. Een `402` die lijkt op een opnieuw te proberen gebruiksvenster- of
    bestedingslimiet voor een organisatie/werkruimte (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`) wordt behandeld als `rate_limit`, niet als een
    langdurige uitschakeling wegens facturering.

    Contextoverloopfouten blijven volledig buiten het terugvalpad — signalen
    zoals `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`, `input is
    too long for the model` of `ollama error: context length exceeded` leiden tot
    Compaction/opnieuw proberen in plaats van door te gaan met model-failover.

    Algemene serverfouttekst is specifieker dan "alles met onbekend/fout
    erin". Providergebonden tijdelijke vormen die wel als failover-
    signalen gelden: alleenstaand Anthropic `An unknown error occurred`, alleenstaand OpenRouter
    `Provider returned error`, fouten met een stopreden zoals `Unhandled stop reason:
    error`, JSON-`api_error`-payloads met tijdelijke servertekst (`internal
    server error`, `unknown error, 520`, `upstream error`, `backend error`)
    en fouten wegens een bezette provider zoals `ModelNotReadyException` wanneer de providercontext
    overeenkomt. Algemene interne terugvaltekst zoals `LLM request failed
    with an unknown error.` wordt conservatief behandeld en activeert op zichzelf geen
    terugval.

  </Accordion>

  <Accordion title='Wat betekent "Geen referenties gevonden voor profiel anthropic:default"?'>
    De authenticatieprofiel-id `anthropic:default` heeft geen referenties in de
    verwachte authenticatieopslag.

    **Controlelijst voor de oplossing:**

    - Controleer waar profielen zich bevinden — huidig:
      `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`; verouderd:
      `~/.openclaw/agent/*` (gemigreerd door `openclaw doctor`).
    - Controleer of de Gateway uw omgevingsvariabele laadt. `ANTHROPIC_API_KEY` die alleen in
      uw shell is ingesteld, bereikt geen Gateway-uitvoering via systemd/launchd — plaats deze in
      `~/.openclaw/.env` of schakel `env.shellEnv` in.
    - Controleer of u de juiste agent bewerkt — configuraties met meerdere agents hebben
      meerdere `auth-profiles.json`-bestanden.
    - Voer `openclaw models status` uit om geconfigureerde modellen en de
      authenticatiestatus van providers te bekijken.

    **Voor "Geen referenties gevonden voor profiel anthropic" (zonder e-mailachtervoegsel):**

    De uitvoering is vastgezet op een Anthropic-profiel dat de Gateway niet kan vinden.

    - Gebruik de Claude CLI: voer `openclaw models auth login --provider anthropic
      --method cli --set-default` uit op de Gateway-host.
    - Gebruik bij voorkeur een API-sleutel: plaats `ANTHROPIC_API_KEY` in
      `~/.openclaw/.env` op de Gateway-host en wis vervolgens elke vastgezette volgorde
      die het ontbrekende profiel afdwingt:

      ```bash
      openclaw models auth order clear --provider anthropic
      ```

    - Externe modus: authenticatieprofielen bevinden zich op de Gateway-machine, niet op uw
      laptop — controleer of u de opdrachten daar uitvoert.

  </Accordion>

  <Accordion title="Waarom probeerde het ook Google Gemini en mislukte dat?">
    Als uw modelconfiguratie Google Gemini als terugvalmodel bevat (of als u
    bent overgeschakeld naar een Gemini-verkorte naam), probeert OpenClaw dit tijdens de terugval. Als er geen
    Google-referenties zijn geconfigureerd, verschijnt `No API key found for provider
    "google"`. Oplossing: voeg Google-authenticatie toe of verwijder Google-modellen uit
    `agents.defaults.model.fallbacks`/aliassen.

    **LLM-verzoek geweigerd: denkhandtekening vereist (Google Antigravity)**

    Oorzaak: de sessiegeschiedenis bevat denkblokken zonder handtekeningen (vaak
    door een afgebroken/gedeeltelijke stream); Google Antigravity vereist handtekeningen
    voor denkblokken. OpenClaw verwijdert niet-ondertekende denkblokken voor Google
    Antigravity Claude; als het probleem nog steeds optreedt, start dan een nieuwe sessie of stel
    `/thinking off` in voor die agent.

  </Accordion>
</AccordionGroup>

## Authenticatieprofielen: wat ze zijn en hoe u ze beheert

Gerelateerd: [/concepts/oauth](/nl/concepts/oauth) (OAuth-stromen, tokenopslag, patronen voor meerdere accounts)

<AccordionGroup>
  <Accordion title="Wat is een authenticatieprofiel?">
    Een benoemde referentierecord (OAuth of API-sleutel) die aan een provider is gekoppeld en wordt opgeslagen
    in:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Inspecteer opgeslagen profielen zonder geheimen weer te geven: `openclaw models auth
    list` (optioneel `--provider <id>` of `--json`). Zie
    [Modellen-CLI](/nl/cli/models#auth-profiles).

  </Accordion>

  <Accordion title="Wat zijn gebruikelijke profiel-id's?">
    Met providerprefix: `anthropic:default` (gebruikelijk wanneer er geen e-mailidentiteit
    bestaat), `anthropic:<email>` voor OAuth-identiteiten, of een aangepaste id die u
    kiest (bijvoorbeeld `anthropic:work`).

  </Accordion>

  <Accordion title="Kan ik bepalen welk authenticatieprofiel als eerste wordt geprobeerd?">
    Ja. De configuratie `auth.order.<provider>` stelt de rotatievolgorde per provider in
    (alleen metagegevens — er worden geen geheimen opgeslagen).

    OpenClaw kan een profiel overslaan tijdens een korte **afkoelperiode** (snelheidsbeperkingen,
    time-outs, authenticatiefouten) of een langere status **uitgeschakeld**
    (facturering/onvoldoende tegoed). Inspecteer dit met `openclaw models status
    --json` en controleer `auth.unusableProfiles`. Pas dit aan met
    `auth.cooldowns.billingBackoffHours*`. Afkoelperioden wegens snelheidsbeperkingen kunnen
    modelspecifiek zijn — een profiel dat voor één model afkoelt, kan nog steeds een
    verwant model van dezelfde provider bedienen; factureringsvensters/uitgeschakelde vensters blokkeren het
    volledige profiel.

    Stel een volgordeoverschrijving per agent in (opgeslagen in `auth-state.json` van die agent):

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic

    # Target a specific agent
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Controleer wat daadwerkelijk wordt geprobeerd: `openclaw models status --probe`. Een
    opgeslagen profiel dat uit een expliciete volgorde is weggelaten, meldt
    `excluded_by_auth_order` in plaats van stilzwijgend te worden geprobeerd.

  </Accordion>

  <Accordion title="OAuth versus API-sleutel - wat is het verschil?">
    - **OAuth-/CLI-aanmelding** gebruikt vaak abonnementstoegang wanneer de
      provider dit ondersteunt. Voor Anthropic gebruikt de Claude CLI-backend van OpenClaw
      Claude Code `claude -p`, wat Anthropic momenteel behandelt als
      gebruik van de Agent SDK/programmatisch gebruik dat meetelt voor de gebruikslimieten van het abonnement —
      zie [Anthropic](/nl/providers/anthropic) voor de huidige status van de factureringspauze
      en bronlinks.
    - **API-sleutels** gebruiken facturering per token.

    De wizard ondersteunt Anthropic Claude CLI, OpenAI Codex OAuth en API-
    sleutels.

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Veelgestelde vragen](/nl/help/faq) — de belangrijkste veelgestelde vragen
- [Veelgestelde vragen — snel aan de slag en configuratie bij de eerste uitvoering](/nl/help/faq-first-run)
- [Modelselectie](/nl/concepts/model-providers)
- [Model-failover](/nl/concepts/model-failover)
