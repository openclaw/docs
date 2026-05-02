---
read_when:
    - Modellen kiezen of wisselen, aliassen configureren
    - Foutopsporing voor model-failover / "Alle modellen zijn mislukt"
    - Authenticatieprofielen begrijpen en beheren
sidebarTitle: Models FAQ
summary: 'Veelgestelde vragen: standaardinstellingen voor modellen, selectie, aliassen, wisselen, failover en authenticatieprofielen'
title: 'Veelgestelde vragen: modellen en authenticatie'
x-i18n:
    generated_at: "2026-05-02T11:18:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bf7a6bb4a0e2bf791c73dbb4005ba4628afc2c20e06417f8147f4c65583e884
    source_path: help/faq-models.md
    workflow: 16
---

  Vraag en antwoord over modellen en auth-profielen. Zie voor installatie, sessies, Gateway, kanalen en
  probleemoplossing de hoofd-[FAQ](/nl/help/faq).

  ## Modellen: standaardinstellingen, selectie, aliassen, wisselen

  <AccordionGroup>
  <Accordion title='Wat is het "standaardmodel"?'>
    Het standaardmodel van OpenClaw is wat je instelt als:

    ```
    agents.defaults.model.primary
    ```

    Naar modellen wordt verwezen als `provider/model` (voorbeeld: `openai/gpt-5.5` of `openai-codex/gpt-5.5`). Als je de provider weglaat, probeert OpenClaw eerst een alias, daarna een unieke overeenkomst met een geconfigureerde provider voor die exacte model-id, en valt pas daarna terug op de geconfigureerde standaardprovider als verouderd compatibiliteitspad. Als die provider het geconfigureerde standaardmodel niet meer aanbiedt, valt OpenClaw terug op de eerste geconfigureerde provider/model in plaats van een verouderde standaard van een verwijderde provider te tonen. Je moet `provider/model` nog steeds **expliciet** instellen.

  </Accordion>

  <Accordion title="Welk model raden jullie aan?">
    **Aanbevolen standaard:** gebruik het sterkste model van de nieuwste generatie dat beschikbaar is in je providerstack.
    **Voor agents met tools of niet-vertrouwde invoer:** geef modelsterkte prioriteit boven kosten.
    **Voor routinematige chat met laag risico:** gebruik goedkopere fallbackmodellen en routeer op agentrol.

    MiniMax heeft eigen documentatie: [MiniMax](/nl/providers/minimax) en
    [Lokale modellen](/nl/gateway/local-models).

    Vuistregel: gebruik het **beste model dat je kunt betalen** voor werk met hoge inzet, en een goedkoper
    model voor routinematige chat of samenvattingen. Je kunt modellen per agent routeren en sub-agents gebruiken om
    lange taken te paralleliseren (elke sub-agent verbruikt tokens). Zie [Modellen](/nl/concepts/models) en
    [Sub-agents](/nl/tools/subagents).

    Sterke waarschuwing: zwakkere/overmatig gekwantiseerde modellen zijn kwetsbaarder voor prompt
    injection en onveilig gedrag. Zie [Beveiliging](/nl/gateway/security).

    Meer context: [Modellen](/nl/concepts/models).

  </Accordion>

  <Accordion title="Hoe wissel ik van model zonder mijn configuratie te wissen?">
    Gebruik **modelcommando's** of bewerk alleen de **model**-velden. Vermijd volledige config-vervangingen.

    Veilige opties:

    - `/model` in chat (snel, per sessie)
    - `openclaw models set ...` (werkt alleen modelconfiguratie bij)
    - `openclaw configure --section model` (interactief)
    - bewerk `agents.defaults.model` in `~/.openclaw/openclaw.json`

    Vermijd `config.apply` met een gedeeltelijk object, tenzij je de volledige config wilt vervangen.
    Inspecteer bij RPC-bewerkingen eerst met `config.schema.lookup` en geef de voorkeur aan `config.patch`. De lookup-payload geeft je het genormaliseerde pad, oppervlakkige schemadocumentatie/beperkingen en directe samenvattingen van onderliggende items.
    voor gedeeltelijke updates.
    Als je de config hebt overschreven, herstel dan vanaf een back-up of voer `openclaw doctor` opnieuw uit om te repareren.

    Documentatie: [Modellen](/nl/concepts/models), [Configureren](/nl/cli/configure), [Config](/nl/cli/config), [Doctor](/nl/gateway/doctor).

  </Accordion>

  <Accordion title="Kan ik zelf gehoste modellen gebruiken (llama.cpp, vLLM, Ollama)?">
    Ja. Ollama is de eenvoudigste route voor lokale modellen.

    Snelste installatie:

    1. Installeer Ollama vanaf `https://ollama.com/download`
    2. Haal een lokaal model op, zoals `ollama pull gemma4`
    3. Als je ook cloudmodellen wilt, voer dan `ollama signin` uit
    4. Voer `openclaw onboard` uit en kies `Ollama`
    5. Kies `Local` of `Cloud + Local`

    Opmerkingen:

    - `Cloud + Local` geeft je cloudmodellen plus je lokale Ollama-modellen
    - cloudmodellen zoals `kimi-k2.5:cloud` hebben geen lokale pull nodig
    - gebruik voor handmatig wisselen `openclaw models list` en `openclaw models set ollama/<model>`

    Beveiligingsopmerking: kleinere of sterk gekwantiseerde modellen zijn kwetsbaarder voor prompt
    injection. We raden **grote modellen** sterk aan voor elke bot die tools kan gebruiken.
    Als je toch kleine modellen wilt, schakel dan sandboxing en strikte tool-allowlists in.

    Documentatie: [Ollama](/nl/providers/ollama), [Lokale modellen](/nl/gateway/local-models),
    [Modelproviders](/nl/concepts/model-providers), [Beveiliging](/nl/gateway/security),
    [Sandboxing](/nl/gateway/sandboxing).

  </Accordion>

  <Accordion title="Welke modellen gebruiken OpenClaw, Flawd en Krill?">
    - Deze implementaties kunnen verschillen en in de loop van de tijd veranderen; er is geen vaste provider-aanbeveling.
    - Controleer de huidige runtime-instelling op elke Gateway met `openclaw models status`.
    - Gebruik voor agents met beveiligingsgevoelige taken of tools het sterkste model van de nieuwste generatie dat beschikbaar is.

  </Accordion>

  <Accordion title="Hoe wissel ik direct van model (zonder opnieuw op te starten)?">
    Gebruik het `/model`-commando als zelfstandig bericht:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    Dit zijn de ingebouwde aliassen. Aangepaste aliassen kunnen worden toegevoegd via `agents.defaults.models`.

    Je kunt beschikbare modellen weergeven met `/model`, `/model list` of `/model status`.

    `/model` (en `/model list`) toont een compacte, genummerde kiezer. Selecteer op nummer:

    ```
    /model 3
    ```

    Je kunt ook een specifiek auth-profiel voor de provider forceren (per sessie):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Tip: `/model status` toont welke agent actief is, welk `auth-profiles.json`-bestand wordt gebruikt en welk auth-profiel hierna wordt geprobeerd.
    Het toont ook het geconfigureerde provider-endpoint (`baseUrl`) en de API-modus (`api`) wanneer beschikbaar.

    **Hoe maak ik een profiel dat ik met @profile heb ingesteld weer los?**

    Voer `/model` opnieuw uit **zonder** het achtervoegsel `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Als je wilt terugkeren naar de standaard, kies die dan uit `/model` (of stuur `/model <default provider/model>`).
    Gebruik `/model status` om te bevestigen welk auth-profiel actief is.

  </Accordion>

  <Accordion title="Kan ik GPT 5.5 gebruiken voor dagelijkse taken en Codex 5.5 voor coderen?">
    Ja. Behandel modelkeuze en runtime-keuze apart:

    - **Native Codex-codingagent:** stel `agents.defaults.model.primary` in op `openai/gpt-5.5` en `agents.defaults.agentRuntime.id` op `"codex"`. Meld je aan met `openclaw models auth login --provider openai-codex` wanneer je ChatGPT/Codex-abonnementsauthenticatie wilt.
    - **Directe OpenAI API-taken via PI:** gebruik `/model openai/gpt-5.5` zonder Codex-runtime-override en configureer `OPENAI_API_KEY`.
    - **Codex OAuth via PI:** gebruik `/model openai-codex/gpt-5.5` alleen wanneer je bewust de normale PI-runner met Codex OAuth wilt.
    - **Sub-agents:** routeer codeertaken naar een agent die alleen Codex gebruikt, met een eigen model en `agentRuntime`-standaard.

    Zie [Modellen](/nl/concepts/models) en [Slash-commando's](/nl/tools/slash-commands).

  </Accordion>

  <Accordion title="Hoe configureer ik snelle modus voor GPT 5.5?">
    Gebruik een sessieschakelaar of een config-standaard:

    - **Per sessie:** stuur `/fast on` terwijl de sessie `openai/gpt-5.5` of `openai-codex/gpt-5.5` gebruikt.
    - **Per modelstandaard:** stel `agents.defaults.models["openai/gpt-5.5"].params.fastMode` of `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` in op `true`.

    Voorbeeld:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    Voor OpenAI wordt snelle modus gekoppeld aan `service_tier = "priority"` bij ondersteunde native Responses-aanvragen. Sessie-`/fast`-overrides gaan vóór config-standaarden.

    Zie [Denken en snelle modus](/nl/tools/thinking) en [OpenAI snelle modus](/nl/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Waarom zie ik "Model ... is not allowed" en daarna geen antwoord?'>
    Als `agents.defaults.models` is ingesteld, wordt dit de **allowlist** voor `/model` en alle
    sessie-overrides. Het kiezen van een model dat niet in die lijst staat, retourneert:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Die fout wordt geretourneerd **in plaats van** een normaal antwoord. Oplossing: voeg het model toe aan
    `agents.defaults.models`, verwijder de allowlist, of kies een model uit `/model list`.

  </Accordion>

  <Accordion title='Waarom zie ik "Unknown model: minimax/MiniMax-M2.7"?'>
    Dit betekent dat de **provider niet is geconfigureerd** (er is geen MiniMax-providerconfiguratie of auth-
    profiel gevonden), dus het model kan niet worden opgelost.

    Checklist voor oplossing:

    1. Upgrade naar een actuele OpenClaw-release (of voer uit vanaf bron `main`) en start daarna de Gateway opnieuw.
    2. Zorg dat MiniMax is geconfigureerd (wizard of JSON), of dat MiniMax-authenticatie
       bestaat in env/auth-profielen zodat de overeenkomende provider kan worden geïnjecteerd
       (`MINIMAX_API_KEY` voor `minimax`, `MINIMAX_OAUTH_TOKEN` of opgeslagen MiniMax
       OAuth voor `minimax-portal`).
    3. Gebruik de exacte model-id (hoofdlettergevoelig) voor je authenticatiepad:
       `minimax/MiniMax-M2.7` of `minimax/MiniMax-M2.7-highspeed` voor installatie met API-sleutel,
       of `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` voor installatie met OAuth.
    4. Voer uit:

       ```bash
       openclaw models list
       ```

       en kies uit de lijst (of `/model list` in chat).

    Zie [MiniMax](/nl/providers/minimax) en [Modellen](/nl/concepts/models).

  </Accordion>

  <Accordion title="Kan ik MiniMax als standaard gebruiken en OpenAI voor complexe taken?">
    Ja. Gebruik **MiniMax als standaard** en wissel modellen **per sessie** wanneer nodig.
    Fallbacks zijn voor **fouten**, niet voor "moeilijke taken", dus gebruik `/model` of een aparte agent.

    **Optie A: wisselen per sessie**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Daarna:

    ```
    /model gpt
    ```

    **Optie B: aparte agents**

    - Standaard voor agent A: MiniMax
    - Standaard voor agent B: OpenAI
    - Routeer op agent of gebruik `/agent` om te wisselen

    Documentatie: [Modellen](/nl/concepts/models), [Multi-Agent-routering](/nl/concepts/multi-agent), [MiniMax](/nl/providers/minimax), [OpenAI](/nl/providers/openai).

  </Accordion>

  <Accordion title="Zijn opus / sonnet / gpt ingebouwde snelkoppelingen?">
    Ja. OpenClaw levert een paar standaardafkortingen (alleen toegepast wanneer het model bestaat in `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5` voor installaties met API-sleutel, of `openai-codex/gpt-5.5` wanneer geconfigureerd voor Codex OAuth
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Als je je eigen alias met dezelfde naam instelt, heeft jouw waarde voorrang.

  </Accordion>

  <Accordion title="Hoe definieer/overschrijf ik modelsnelkoppelingen (aliassen)?">
    Aliassen komen uit `agents.defaults.models.<modelId>.alias`. Voorbeeld:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    Daarna wordt `/model sonnet` (of `/<alias>` wanneer ondersteund) opgelost naar die model-ID.

  </Accordion>

  <Accordion title="Hoe voeg ik modellen toe van andere providers zoals OpenRouter of Z.AI?">
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
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Als je naar een provider/model verwijst maar de vereiste providersleutel ontbreekt, krijg je een runtime-authenticatiefout (bijv. `No API key found for provider "zai"`).

    **Geen API-sleutel gevonden voor provider na het toevoegen van een nieuwe agent**

    Dit betekent meestal dat de **nieuwe agent** een lege auth-opslag heeft. Auth is per agent en
    wordt opgeslagen in:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Oplossingen:

    - Voer `openclaw agents add <id>` uit en configureer auth tijdens de wizard.
    - Of kopieer alleen overdraagbare statische `api_key`- / `token`-profielen uit de auth-opslag van de hoofdagent naar de auth-opslag van de nieuwe agent.
    - Meld je voor OAuth-profielen aan vanuit de nieuwe agent wanneer die een eigen account nodig heeft; anders kan OpenClaw doorlezen naar de standaard-/hoofdagent zonder refresh-tokens te klonen.

    Hergebruik `agentDir` **niet** tussen agents; dit veroorzaakt auth-/sessieconflicten.

  </Accordion>
</AccordionGroup>

## Modelfailover en "Alle modellen zijn mislukt"

<AccordionGroup>
  <Accordion title="Hoe werkt failover?">
    Failover gebeurt in twee fasen:

    1. **Rotatie van auth-profielen** binnen dezelfde provider.
    2. **Modelterugval** naar het volgende model in `agents.defaults.model.fallbacks`.

    Cooldowns zijn van toepassing op falende profielen (exponentiële backoff), zodat OpenClaw kan blijven reageren, zelfs wanneer een provider rate-limited is of tijdelijk faalt.

    De rate-limit-bucket bevat meer dan alleen gewone `429`-responses. OpenClaw
    behandelt ook berichten zoals `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` en periodieke
    gebruiksvensterlimieten (`weekly/monthly limit reached`) als rate limits
    waarvoor failover geschikt is.

    Sommige responses die op facturering lijken zijn geen `402`, en sommige HTTP-`402`-
    responses blijven ook in die tijdelijke bucket. Als een provider
    expliciete factureringstekst retourneert bij `401` of `403`, kan OpenClaw dat nog steeds in
    het factureringspad houden, maar providerspecifieke tekstmatchers blijven beperkt tot de
    provider waartoe ze behoren (bijvoorbeeld OpenRouter `Key limit exceeded`). Als een `402`-
    bericht er in plaats daarvan uitziet als een opnieuw te proberen gebruiksvenster- of
    bestedingslimiet voor organisatie/werkruimte (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), behandelt OpenClaw het als
    `rate_limit`, niet als een langdurige factureringsuitschakeling.

    Context-overflowfouten zijn anders: signatures zoals
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model`, of `ollama error: context length
    exceeded` blijven op het Compaction-/opnieuw-proberen-pad in plaats van modelterugval
    te activeren.

    Algemene serverfouttekst is bewust smaller dan "alles met
    unknown/error erin". OpenClaw behandelt providerspecifieke tijdelijke vormen
    zoals Anthropic kale `An unknown error occurred`, OpenRouter kale
    `Provider returned error`, stop-reason-fouten zoals `Unhandled stop reason:
    error`, JSON-`api_error`-payloads met tijdelijke servertekst
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) en provider-bezet-fouten zoals `ModelNotReadyException` als
    failoverwaardige timeout-/overbelastingssignalen wanneer de providercontext
    overeenkomt.
    Algemene interne terugvaltekst zoals `LLM request failed with an unknown
    error.` blijft conservatief en activeert op zichzelf geen modelterugval.

  </Accordion>

  <Accordion title='Wat betekent "No credentials found for profile anthropic:default"?'>
    Dit betekent dat het systeem probeerde de auth-profiel-ID `anthropic:default` te gebruiken, maar daarvoor geen referenties kon vinden in de verwachte auth-opslag.

    **Fix-checklist:**

    - **Bevestig waar auth-profielen staan** (nieuwe versus legacy-paden)
      - Huidig: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Legacy: `~/.openclaw/agent/*` (gemigreerd door `openclaw doctor`)
    - **Bevestig dat je env-var door de Gateway wordt geladen**
      - Als je `ANTHROPIC_API_KEY` in je shell instelt maar de Gateway via systemd/launchd draait, erft die dit mogelijk niet. Zet het in `~/.openclaw/.env` of schakel `env.shellEnv` in.
    - **Zorg dat je de juiste agent bewerkt**
      - Multi-agent-setups betekenen dat er meerdere `auth-profiles.json`-bestanden kunnen zijn.
    - **Controleer model-/auth-status globaal**
      - Gebruik `openclaw models status` om geconfigureerde modellen te zien en of providers geauthenticeerd zijn.

    **Fix-checklist voor "No credentials found for profile anthropic"**

    Dit betekent dat de run is vastgezet op een Anthropic-auth-profiel, maar de Gateway
    het niet in zijn auth-opslag kan vinden.

    - **Gebruik Claude CLI**
      - Voer `openclaw models auth login --provider anthropic --method cli --set-default` uit op de gatewayhost.
    - **Als je in plaats daarvan een API-sleutel wilt gebruiken**
      - Zet `ANTHROPIC_API_KEY` in `~/.openclaw/.env` op de **gatewayhost**.
      - Wis elke vastgezette volgorde die een ontbrekend profiel afdwingt:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Bevestig dat je opdrachten op de gatewayhost uitvoert**
      - In externe modus staan auth-profielen op de gatewaymachine, niet op je laptop.

  </Accordion>

  <Accordion title="Waarom probeerde het ook Google Gemini en faalde dat?">
    Als je modelconfiguratie Google Gemini als terugval bevat (of je bent overgeschakeld naar een Gemini-shorthand), probeert OpenClaw dit tijdens modelterugval. Als je geen Google-referenties hebt geconfigureerd, zie je `No API key found for provider "google"`.

    Oplossing: geef Google-auth op, of verwijder/vermijd Google-modellen in `agents.defaults.model.fallbacks` / aliassen zodat terugval daar niet heen routeert.

    **LLM-verzoek geweigerd: thinking-signature vereist (Google Antigravity)**

    Oorzaak: de sessiegeschiedenis bevat **thinking-blocks zonder signatures** (vaak door
    een afgebroken/gedeeltelijke stream). Google Antigravity vereist signatures voor thinking-blocks.

    Oplossing: OpenClaw verwijdert nu niet-ondertekende thinking-blocks voor Google Antigravity Claude. Als het nog steeds verschijnt, start dan een **nieuwe sessie** of stel `/thinking off` in voor die agent.

  </Accordion>
</AccordionGroup>

## Auth-profielen: wat ze zijn en hoe je ze beheert

Gerelateerd: [/concepts/oauth](/nl/concepts/oauth) (OAuth-flows, tokenopslag, multi-accountpatronen)

<AccordionGroup>
  <Accordion title="Wat is een auth-profiel?">
    Een auth-profiel is een benoemd referentierecord (OAuth of API-sleutel) dat aan een provider is gekoppeld. Profielen staan in:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Wat zijn typische profiel-ID's?">
    OpenClaw gebruikt provider-prefix-ID's zoals:

    - `anthropic:default` (gebruikelijk wanneer er geen e-mailidentiteit bestaat)
    - `anthropic:<email>` voor OAuth-identiteiten
    - aangepaste ID's die je kiest (bijv. `anthropic:work`)

  </Accordion>

  <Accordion title="Kan ik bepalen welk auth-profiel als eerste wordt geprobeerd?">
    Ja. Config ondersteunt optionele metadata voor profielen en een volgorde per provider (`auth.order.<provider>`). Dit slaat **geen** geheimen op; het koppelt ID's aan provider/modus en stelt de rotatievolgorde in.

    OpenClaw kan een profiel tijdelijk overslaan als het in een korte **cooldown** staat (rate limits/timeouts/auth-fouten) of een langere **uitgeschakelde** status heeft (facturering/onvoldoende credits). Voer `openclaw models status --json` uit en controleer `auth.unusableProfiles` om dit te inspecteren. Afstemming: `auth.cooldowns.billingBackoffHours*`.

    Rate-limit-cooldowns kunnen modelspecifiek zijn. Een profiel dat aan het afkoelen is
    voor één model kan nog steeds bruikbaar zijn voor een zustermodel bij dezelfde provider,
    terwijl facturerings-/uitgeschakelde vensters nog steeds het hele profiel blokkeren.

    Je kunt ook een **per-agent** volgorde-override instellen (opgeslagen in de `auth-state.json` van die agent) via de CLI:

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile (only try this one)
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Om een specifieke agent te targeten:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Gebruik dit om te verifiëren wat daadwerkelijk zal worden geprobeerd:

    ```bash
    openclaw models status --probe
    ```

    Als een opgeslagen profiel uit de expliciete volgorde is weggelaten, meldt probe
    `excluded_by_auth_order` voor dat profiel in plaats van het stilzwijgend te proberen.

  </Accordion>

  <Accordion title="OAuth versus API-sleutel - wat is het verschil?">
    OpenClaw ondersteunt beide:

    - **OAuth** gebruikt vaak abonnementstoegang (waar van toepassing).
    - **API-sleutels** gebruiken pay-per-token-facturering.

    De wizard ondersteunt expliciet Anthropic Claude CLI, OpenAI Codex OAuth en API-sleutels.

  </Accordion>
</AccordionGroup>

## Gerelateerd

- [FAQ](/nl/help/faq) — de hoofd-FAQ
- [FAQ — snel starten en eerste configuratie](/nl/help/faq-first-run)
- [Modelselectie](/nl/concepts/model-providers)
- [Modelfailover](/nl/concepts/model-failover)
