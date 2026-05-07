---
read_when:
    - Modellen kiezen of wisselen, aliassen configureren
    - Debuggen van model-failover / "Alle modellen zijn mislukt"
    - Auth-profielen begrijpen en beheren
sidebarTitle: Models FAQ
summary: 'FAQ: standaardmodellen, selectie, aliassen, wisselen, failover en authenticatieprofielen'
title: 'Veelgestelde vragen: modellen en authenticatie'
x-i18n:
    generated_at: "2026-05-07T13:19:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: fec3256990c91d30e1241554ceafeb23ba0eb9b858cd028d64c9cd0631e67f34
    source_path: help/faq-models.md
    workflow: 16
---

  Vraag en antwoord over modellen en auth-profielen. Zie voor configuratie, sessies, Gateway, kanalen en
  probleemoplossing de hoofd-[FAQ](/nl/help/faq).

  ## Modellen: standaardwaarden, selectie, aliassen, wisselen

  <AccordionGroup>
  <Accordion title='Wat is het "standaardmodel"?'>
    Het standaardmodel van OpenClaw is wat je instelt als:

    ```
    agents.defaults.model.primary
    ```

    Modellen worden aangeduid als `provider/model` (voorbeeld: `openai/gpt-5.5` of `anthropic/claude-sonnet-4-6`). Als je de provider weglaat, probeert OpenClaw eerst een alias, daarna een unieke match met een geconfigureerde provider voor die exacte model-id, en pas daarna valt het terug op de geconfigureerde standaardprovider als verouderd compatibiliteitspad. Als die provider het geconfigureerde standaardmodel niet meer aanbiedt, valt OpenClaw terug op de eerste geconfigureerde provider/model in plaats van een verouderde standaard van een verwijderde provider te tonen. Je moet nog steeds **expliciet** `provider/model` instellen.

  </Accordion>

  <Accordion title="Welk model raden jullie aan?">
    **Aanbevolen standaard:** gebruik het sterkste model van de nieuwste generatie dat beschikbaar is in je provider-stack.
    **Voor agents met tools of niet-vertrouwde invoer:** geef modelsterkte prioriteit boven kosten.
    **Voor routinematige/laag-risico chat:** gebruik goedkopere fallbackmodellen en routeer op agentrol.

    MiniMax heeft eigen documentatie: [MiniMax](/nl/providers/minimax) en
    [Lokale modellen](/nl/gateway/local-models).

    Vuistregel: gebruik het **beste model dat je je kunt veroorloven** voor werk met hoge inzet, en een goedkoper
    model voor routinematige chat of samenvattingen. Je kunt modellen per agent routeren en sub-agents gebruiken om
    lange taken te parallelliseren (elke sub-agent verbruikt tokens). Zie [Modellen](/nl/concepts/models) en
    [Sub-agents](/nl/tools/subagents).

    Sterke waarschuwing: zwakkere/overmatig gekwantiseerde modellen zijn kwetsbaarder voor prompt-
    injectie en onveilig gedrag. Zie [Beveiliging](/nl/gateway/security).

    Meer context: [Modellen](/nl/concepts/models).

  </Accordion>

  <Accordion title="Hoe wissel ik van model zonder mijn configuratie te wissen?">
    Gebruik **modelcommando's** of bewerk alleen de **model**-velden. Vermijd volledige configuratievervangingen.

    Veilige opties:

    - `/model` in chat (snel, per sessie)
    - `openclaw models set ...` (werkt alleen de modelconfiguratie bij)
    - `openclaw configure --section model` (interactief)
    - bewerk `agents.defaults.model` in `~/.openclaw/openclaw.json`

    Vermijd `config.apply` met een gedeeltelijk object, tenzij je de volledige configuratie wilt vervangen.
    Inspecteer voor RPC-bewerkingen eerst met `config.schema.lookup` en geef de voorkeur aan `config.patch`. De lookup-payload geeft je het genormaliseerde pad, beknopte schemadocumentatie/beperkingen en directe samenvattingen van onderliggende items.
    voor gedeeltelijke updates.
    Als je de configuratie hebt overschreven, herstel dan vanaf een back-up of voer `openclaw doctor` opnieuw uit om te repareren.

    Documentatie: [Modellen](/nl/concepts/models), [Configureren](/nl/cli/configure), [Configuratie](/nl/cli/config), [Doctor](/nl/gateway/doctor).

  </Accordion>

  <Accordion title="Kan ik zelf gehoste modellen gebruiken (llama.cpp, vLLM, Ollama)?">
    Ja. Ollama is de eenvoudigste route voor lokale modellen.

    Snelste configuratie:

    1. Installeer Ollama vanaf `https://ollama.com/download`
    2. Haal een lokaal model op, zoals `ollama pull gemma4`
    3. Als je ook cloudmodellen wilt, voer dan `ollama signin` uit
    4. Voer `openclaw onboard` uit en kies `Ollama`
    5. Kies `Local` of `Cloud + Local`

    Opmerkingen:

    - `Cloud + Local` geeft je cloudmodellen plus je lokale Ollama-modellen
    - cloudmodellen zoals `kimi-k2.5:cloud` hoeven niet lokaal te worden opgehaald
    - gebruik voor handmatig wisselen `openclaw models list` en `openclaw models set ollama/<model>`

    Beveiligingsopmerking: kleinere of zwaar gekwantiseerde modellen zijn kwetsbaarder voor prompt-
    injectie. We raden **grote modellen** sterk aan voor elke bot die tools kan gebruiken.
    Als je toch kleine modellen wilt, schakel dan sandboxing en strikte allowlists voor tools in.

    Documentatie: [Ollama](/nl/providers/ollama), [Lokale modellen](/nl/gateway/local-models),
    [Modelproviders](/nl/concepts/model-providers), [Beveiliging](/nl/gateway/security),
    [Sandboxing](/nl/gateway/sandboxing).

  </Accordion>

  <Accordion title="Welke modellen gebruiken OpenClaw, Flawd en Krill?">
    - Deze deployments kunnen verschillen en in de loop van de tijd veranderen; er is geen vaste provider-aanbeveling.
    - Controleer de huidige runtime-instelling op elke Gateway met `openclaw models status`.
    - Gebruik voor beveiligingsgevoelige agents of agents met tools het sterkste model van de nieuwste generatie dat beschikbaar is.

  </Accordion>

  <Accordion title="Hoe wissel ik direct van model (zonder opnieuw te starten)?">
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

    Je kunt beschikbare modellen tonen met `/model`, `/model list` of `/model status`.

    `/model` (en `/model list`) toont een compacte, genummerde kiezer. Selecteer op nummer:

    ```
    /model 3
    ```

    Je kunt ook een specifiek auth-profiel voor de provider afdwingen (per sessie):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Tip: `/model status` toont welke agent actief is, welk `auth-profiles.json`-bestand wordt gebruikt en welk auth-profiel daarna wordt geprobeerd.
    Het toont ook het geconfigureerde provider-eindpunt (`baseUrl`) en de API-modus (`api`) wanneer beschikbaar.

    **Hoe maak ik een profiel los dat ik met @profile heb vastgezet?**

    Voer `/model` opnieuw uit **zonder** het achtervoegsel `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Als je wilt terugkeren naar de standaard, kies die dan via `/model` (of stuur `/model <default provider/model>`).
    Gebruik `/model status` om te bevestigen welk auth-profiel actief is.

  </Accordion>

  <Accordion title="Kan ik GPT 5.5 gebruiken voor dagelijkse taken en Codex 5.5 voor coderen?">
    Ja. Behandel modelkeuze en runtimekeuze apart:

    - **Native Codex-codeeragent:** stel `agents.defaults.model.primary` in op `openai/gpt-5.5`. Log in met `openclaw models auth login --provider openai-codex` wanneer je ChatGPT/Codex-abonnementsauthenticatie wilt gebruiken.
    - **Directe OpenAI API-taken buiten de agent-loop:** configureer `OPENAI_API_KEY` voor afbeeldingen, embeddings, spraak, realtime en andere niet-agent OpenAI API-oppervlakken.
    - **OpenAI-agentauthenticatie met API-sleutel:** gebruik `/model openai/gpt-5.5` met een geordend `openai-codex` API-sleutelprofiel.
    - **Sub-agents:** routeer codeertaken naar een agent die alleen Codex gebruikt, met een eigen model en standaardwaarde voor `agentRuntime`.

    Zie [Modellen](/nl/concepts/models) en [Slash-commando's](/nl/tools/slash-commands).

  </Accordion>

  <Accordion title="Hoe configureer ik snelle modus voor GPT 5.5?">
    Gebruik een sessieschakelaar of een configuratiestandaard:

    - **Per sessie:** stuur `/fast on` terwijl de sessie `openai/gpt-5.5` gebruikt.
    - **Per modelstandaard:** stel `agents.defaults.models["openai/gpt-5.5"].params.fastMode` in op `true`.

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

    Voor OpenAI komt snelle modus overeen met `service_tier = "priority"` bij ondersteunde native Responses-verzoeken. Sessie-overschrijvingen met `/fast` gaan boven configuratiestandaarden.

    Zie [Denken en snelle modus](/nl/tools/thinking) en [OpenAI snelle modus](/nl/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Waarom zie ik "Model ... is not allowed" en daarna geen antwoord?'>
    Als `agents.defaults.models` is ingesteld, wordt dit de **allowlist** voor `/model` en eventuele
    sessie-overschrijvingen. Een model kiezen dat niet in die lijst staat, retourneert:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Die fout wordt geretourneerd **in plaats van** een normaal antwoord. Oplossing: voeg het model toe aan
    `agents.defaults.models`, verwijder de allowlist of kies een model uit `/model list`.
    Als het commando ook `--runtime codex` bevatte, voeg dan eerst het model toe en probeer daarna
    hetzelfde commando `/model provider/model --runtime codex` opnieuw.

  </Accordion>

  <Accordion title='Waarom zie ik "Unknown model: minimax/MiniMax-M2.7"?'>
    Dit betekent dat de **provider niet is geconfigureerd** (er is geen MiniMax-providerconfiguratie of auth-
    profiel gevonden), waardoor het model niet kan worden opgelost.

    Controlelijst voor oplossing:

    1. Upgrade naar een huidige OpenClaw-release (of voer uit vanaf broncode `main`) en herstart daarna de Gateway.
    2. Zorg dat MiniMax is geconfigureerd (wizard of JSON), of dat MiniMax-authenticatie
       bestaat in env/auth-profielen zodat de matchende provider kan worden geïnjecteerd
       (`MINIMAX_API_KEY` voor `minimax`, `MINIMAX_OAUTH_TOKEN` of opgeslagen MiniMax
       OAuth voor `minimax-portal`).
    3. Gebruik de exacte model-id (hoofdlettergevoelig) voor je auth-pad:
       `minimax/MiniMax-M2.7` of `minimax/MiniMax-M2.7-highspeed` voor configuratie
       met API-sleutel, of `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` voor OAuth-configuratie.
    4. Voer uit:

       ```bash
       openclaw models list
       ```

       en kies uit de lijst (of `/model list` in chat).

    Zie [MiniMax](/nl/providers/minimax) en [Modellen](/nl/concepts/models).

  </Accordion>

  <Accordion title="Kan ik MiniMax als standaard gebruiken en OpenAI voor complexe taken?">
    Ja. Gebruik **MiniMax als standaard** en wissel waar nodig **per sessie** van model.
    Fallbacks zijn bedoeld voor **fouten**, niet voor "moeilijke taken", dus gebruik `/model` of een aparte agent.

    **Optie A: per sessie wisselen**

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

    Dan:

    ```
    /model gpt
    ```

    **Optie B: aparte agents**

    - Standaard voor agent A: MiniMax
    - Standaard voor agent B: OpenAI
    - Routeer per agent of gebruik `/agent` om te wisselen

    Documentatie: [Modellen](/nl/concepts/models), [Multi-Agent-routering](/nl/concepts/multi-agent), [MiniMax](/nl/providers/minimax), [OpenAI](/nl/providers/openai).

  </Accordion>

  <Accordion title="Zijn opus / sonnet / gpt ingebouwde snelkoppelingen?">
    Ja. OpenClaw levert enkele standaardverkortingen mee (alleen toegepast wanneer het model bestaat in `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Als je je eigen alias met dezelfde naam instelt, krijgt jouw waarde voorrang.

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

    Daarna wordt `/model sonnet` (of `/<alias>` wanneer ondersteund) omgezet naar die model-ID.

  </Accordion>

  <Accordion title="Hoe voeg ik modellen toe van andere providers, zoals OpenRouter of Z.AI?">
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

    Dit betekent meestal dat de **nieuwe agent** een lege auth-store heeft. Auth is per agent en
    wordt opgeslagen in:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Oplossingen:

    - Voer `openclaw agents add <id>` uit en configureer auth tijdens de wizard.
    - Of kopieer alleen overdraagbare statische `api_key`- / `token`-profielen uit de auth-store van de hoofdagent naar de auth-store van de nieuwe agent.
    - Meld je voor OAuth-profielen aan vanuit de nieuwe agent wanneer die een eigen account nodig heeft; anders kan OpenClaw doorlezen naar de standaard-/hoofdagent zonder refresh tokens te klonen.

    Gebruik `agentDir` **niet** opnieuw voor meerdere agents; dit veroorzaakt auth-/sessiebotsingen.

  </Accordion>
</AccordionGroup>

## Model-failover en "Alle modellen zijn mislukt"

<AccordionGroup>
  <Accordion title="Hoe werkt failover?">
    Failover gebeurt in twee fasen:

    1. **Rotatie van auth-profielen** binnen dezelfde provider.
    2. **Model-fallback** naar het volgende model in `agents.defaults.model.fallbacks`.

    Cooldowns gelden voor falende profielen (exponentiële backoff), zodat OpenClaw kan blijven reageren, zelfs wanneer een provider rate-limited is of tijdelijk faalt.

    De rate-limit-bucket omvat meer dan gewone `429`-antwoorden. OpenClaw
    behandelt ook berichten zoals `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` en periodieke
    gebruiksvensterlimieten (`weekly/monthly limit reached`) als rate limits
    die failover rechtvaardigen.

    Sommige antwoorden die op facturering lijken zijn geen `402`, en sommige HTTP `402`-
    antwoorden blijven ook in die tijdelijke bucket. Als een provider expliciete
    factureringstekst retourneert bij `401` of `403`, kan OpenClaw dat nog steeds in
    de factureringsbaan houden, maar providerspecifieke tekstmatchers blijven beperkt tot de
    provider die ze bezit (bijvoorbeeld OpenRouter `Key limit exceeded`). Als een `402`-
    bericht in plaats daarvan lijkt op een opnieuw te proberen gebruiksvenster of
    bestedingslimiet voor organisatie/werkruimte (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), behandelt OpenClaw dit als
    `rate_limit`, niet als een langdurige factureringsuitschakeling.

    Context-overflowfouten zijn anders: signatures zoals
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` of `ollama error: context length
    exceeded` blijven op het pad voor Compaction/opnieuw proberen in plaats van
    model-fallback te activeren.

    Generieke serverfouttekst is bewust smaller dan "alles met
    unknown/error erin". OpenClaw behandelt wel provider-gescopete tijdelijke vormen
    zoals Anthropic bare `An unknown error occurred`, OpenRouter bare
    `Provider returned error`, stop-reason-fouten zoals `Unhandled stop reason:
    error`, JSON-`api_error`-payloads met tijdelijke servertekst
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) en provider-bezet-fouten zoals `ModelNotReadyException` als
    timeout-/overbelastingssignalen die failover rechtvaardigen wanneer de providercontext
    overeenkomt.
    Generieke interne fallbacktekst zoals `LLM request failed with an unknown
    error.` blijft conservatief en activeert op zichzelf geen model-fallback.

  </Accordion>

  <Accordion title='Wat betekent "No credentials found for profile anthropic:default"?'>
    Dit betekent dat het systeem probeerde de auth-profiel-ID `anthropic:default` te gebruiken, maar er geen credentials voor kon vinden in de verwachte auth-store.

    **Checklist voor oplossing:**

    - **Bevestig waar auth-profielen staan** (nieuwe versus legacy paden)
      - Huidig: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Legacy: `~/.openclaw/agent/*` (gemigreerd door `openclaw doctor`)
    - **Bevestig dat je env var door de Gateway wordt geladen**
      - Als je `ANTHROPIC_API_KEY` in je shell instelt maar de Gateway via systemd/launchd uitvoert, erft die dit mogelijk niet. Zet het in `~/.openclaw/.env` of schakel `env.shellEnv` in.
    - **Zorg dat je de juiste agent bewerkt**
      - Multi-agent-setups betekenen dat er meerdere `auth-profiles.json`-bestanden kunnen zijn.
    - **Controleer model-/auth-status**
      - Gebruik `openclaw models status` om geconfigureerde modellen te zien en of providers geauthenticeerd zijn.

    **Checklist voor oplossing van "No credentials found for profile anthropic"**

    Dit betekent dat de run is vastgezet op een Anthropic-auth-profiel, maar de Gateway
    kan dit niet vinden in zijn auth-store.

    - **Gebruik Claude CLI**
      - Voer `openclaw models auth login --provider anthropic --method cli --set-default` uit op de gatewayhost.
    - **Als je in plaats daarvan een API-sleutel wilt gebruiken**
      - Zet `ANTHROPIC_API_KEY` in `~/.openclaw/.env` op de **gatewayhost**.
      - Wis elke vastgezette volgorde die een ontbrekend profiel afdwingt:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Bevestig dat je opdrachten op de gatewayhost uitvoert**
      - In remote-modus staan auth-profielen op de gatewaymachine, niet op je laptop.

  </Accordion>

  <Accordion title="Waarom probeerde het ook Google Gemini en faalde dat?">
    Als je modelconfiguratie Google Gemini als fallback bevat (of je bent overgeschakeld naar een Gemini-shorthand), probeert OpenClaw dit tijdens model-fallback. Als je geen Google-credentials hebt geconfigureerd, zie je `No API key found for provider "google"`.

    Oplossing: geef Google-auth op, of verwijder/vermijd Google-modellen in `agents.defaults.model.fallbacks` / aliassen zodat fallback daar niet naartoe routeert.

    **LLM-verzoek geweigerd: thinking signature vereist (Google Antigravity)**

    Oorzaak: de sessiegeschiedenis bevat **thinking-blokken zonder signatures** (vaak uit
    een afgebroken/gedeeltelijke stream). Google Antigravity vereist signatures voor thinking-blokken.

    Oplossing: OpenClaw verwijdert nu niet-ondertekende thinking-blokken voor Google Antigravity Claude. Als het nog steeds verschijnt, start dan een **nieuwe sessie** of stel `/thinking off` in voor die agent.

  </Accordion>
</AccordionGroup>

## Auth-profielen: wat ze zijn en hoe je ze beheert

Gerelateerd: [/concepts/oauth](/nl/concepts/oauth) (OAuth-flows, tokenopslag, patronen voor meerdere accounts)

<AccordionGroup>
  <Accordion title="Wat is een auth-profiel?">
    Een auth-profiel is een benoemd credentialrecord (OAuth of API-sleutel) dat aan een provider is gekoppeld. Profielen staan in:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Voer `openclaw models auth list` uit om opgeslagen profielen te inspecteren zonder secrets te tonen (optioneel `--provider <id>` of `--json`). Zie [Models CLI](/nl/cli/models#auth-profiles) voor details.

  </Accordion>

  <Accordion title="Wat zijn typische profiel-ID's?">
    OpenClaw gebruikt provider-geprefixte ID's zoals:

    - `anthropic:default` (gebruikelijk wanneer er geen e-mailidentiteit bestaat)
    - `anthropic:<email>` voor OAuth-identiteiten
    - aangepaste ID's die je kiest (bijv. `anthropic:work`)

  </Accordion>

  <Accordion title="Kan ik bepalen welk auth-profiel als eerste wordt geprobeerd?">
    Ja. Config ondersteunt optionele metadata voor profielen en een volgorde per provider (`auth.order.<provider>`). Dit slaat **geen** secrets op; het koppelt ID's aan provider/modus en stelt de rotatievolgorde in.

    OpenClaw kan een profiel tijdelijk overslaan als het in een korte **cooldown** staat (rate limits/time-outs/auth-fouten) of in een langere **uitgeschakelde** status (facturering/onvoldoende credits). Voer `openclaw models status --json` uit en controleer `auth.unusableProfiles` om dit te inspecteren. Tuning: `auth.cooldowns.billingBackoffHours*`.

    Rate-limit-cooldowns kunnen model-gescopet zijn. Een profiel dat afkoelt
    voor één model kan nog steeds bruikbaar zijn voor een sibling-model bij dezelfde provider,
    terwijl facturerings-/uitgeschakelde vensters nog steeds het hele profiel blokkeren.

    Je kunt ook een **per-agent** volgorde-override instellen (opgeslagen in `auth-state.json` van die agent) via de CLI:

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

    Gebruik dit om te verifiëren wat daadwerkelijk wordt geprobeerd:

    ```bash
    openclaw models status --probe
    ```

    Als een opgeslagen profiel uit de expliciete volgorde wordt weggelaten, rapporteert probe
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
- [FAQ — quickstart en eerste-run-setup](/nl/help/faq-first-run)
- [Modelselectie](/nl/concepts/model-providers)
- [Model-failover](/nl/concepts/model-failover)
