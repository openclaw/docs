---
read_when:
    - Je wilt Anthropic-modellen gebruiken in OpenClaw
summary: Gebruik Anthropic Claude via API-sleutels of Claude CLI in OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-05-07T13:24:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15ae1d2751d0127a45ece3d0a25bead21fd6bacc2ffc80636188fc2cb5f3d7ce
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic bouwt de **Claude**-modelfamilie. OpenClaw ondersteunt twee auth-routes:

- **API key** — directe Anthropic API-toegang met gebruiksgebaseerde facturering (`anthropic/*`-modellen)
- **Claude CLI** — hergebruik een bestaande Claude CLI-login op dezelfde host

<Warning>
Medewerkers van Anthropic hebben ons verteld dat Claude CLI-gebruik in OpenClaw-stijl weer is toegestaan, dus
OpenClaw behandelt hergebruik van Claude CLI en gebruik van `claude -p` als goedgekeurd tenzij
Anthropic een nieuw beleid publiceert.

Voor langlevende gatewayhosts blijven Anthropic API keys de duidelijkste en
meest voorspelbare productieroute.

De huidige openbare documentatie van Anthropic:

- [Claude Code CLI-referentie](https://code.claude.com/docs/en/cli-reference)
- [Overzicht van Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Claude Code gebruiken met je Pro- of Max-abonnement](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Claude Code gebruiken met je Team- of Enterprise-abonnement](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Aan de slag

<Tabs>
  <Tab title="API key">
    **Beste voor:** standaard API-toegang en gebruiksgebaseerde facturering.

    <Steps>
      <Step title="Get your API key">
        Maak een API key aan in de [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Of geef de sleutel direct door:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Configuratievoorbeeld

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Beste voor:** hergebruik van een bestaande Claude CLI-login zonder aparte API key.

    <Steps>
      <Step title="Ensure Claude CLI is installed and logged in">
        Controleer met:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw detecteert en hergebruikt de bestaande Claude CLI-referenties.
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Installatie- en runtimedetails voor de Claude CLI-backend staan in [CLI Backends](/nl/gateway/cli-backends).
    </Note>

    ### Configuratievoorbeeld

    Geef de voorkeur aan de canonieke Anthropic-modelreferentie plus een CLI-runtime-override:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-7" },
          agentRuntime: { id: "claude-cli" },
        },
      },
    }
    ```

    Verouderde `claude-cli/claude-opus-4-7`-modelreferenties blijven werken voor
    compatibiliteit, maar nieuwe configuratie moet provider/modelselectie houden als
    `anthropic/*` en de uitvoeringsbackend in `agentRuntime.id` zetten.

    <Tip>
    Als je het duidelijkste factureringstraject wilt, gebruik dan in plaats daarvan een Anthropic API key. OpenClaw ondersteunt ook abonnementsachtige opties van [OpenAI Codex](/nl/providers/openai), [Qwen Cloud](/nl/providers/qwen), [MiniMax](/nl/providers/minimax) en [Z.AI / GLM](/nl/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Denkstandaarden (Claude 4.6)

Claude 4.6-modellen gebruiken standaard `adaptive` denken in OpenClaw wanneer er geen expliciet denkniveau is ingesteld.

Overschrijf per bericht met `/think:<level>` of in modelparameters:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { thinking: "adaptive" },
        },
      },
    },
  },
}
```

<Note>
Gerelateerde Anthropic-documentatie:
- [Adaptief denken](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Uitgebreid denken](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Promptcaching

OpenClaw ondersteunt Anthropic's promptcachingfunctie voor auth met API key.

| Waarde              | Cacheduur     | Beschrijving                                   |
| ------------------- | ------------- | ---------------------------------------------- |
| `"short"` (default) | 5 minuten     | Automatisch toegepast voor auth met API key    |
| `"long"`            | 1 uur         | Uitgebreide cache                              |
| `"none"`            | Geen caching  | Promptcaching uitschakelen                     |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Per-agent cache overrides">
    Gebruik parameters op modelniveau als basis en overschrijf vervolgens specifieke agents via `agents.list[].params`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    Samenvoegvolgorde van configuratie:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (overeenkomende `id`, overschrijft per sleutel)

    Zo kan één agent een langlevende cache behouden terwijl een andere agent op hetzelfde model caching uitschakelt voor piekverkeer of verkeer met weinig hergebruik.

  </Accordion>

  <Accordion title="Bedrock Claude notes">
    - Anthropic Claude-modellen op Bedrock (`amazon-bedrock/*anthropic.claude*`) accepteren `cacheRetention`-doorgifte wanneer geconfigureerd.
    - Niet-Anthropic Bedrock-modellen worden tijdens runtime geforceerd naar `cacheRetention: "none"`.
    - Slimme standaarden voor API keys vullen ook `cacheRetention: "short"` in voor Claude-op-Bedrock-referenties wanneer er geen expliciete waarde is ingesteld.

  </Accordion>
</AccordionGroup>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Fast mode">
    De gedeelde `/fast`-schakelaar van OpenClaw ondersteunt direct Anthropic-verkeer (API key en OAuth naar `api.anthropic.com`).

    | Opdracht | Komt overeen met |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - Alleen geïnjecteerd voor directe `api.anthropic.com`-verzoeken. Proxyroutes laten `service_tier` ongemoeid.
    - Expliciete `serviceTier`- of `service_tier`-parameters overschrijven `/fast` wanneer beide zijn ingesteld.
    - Op accounts zonder Priority Tier-capaciteit kan `service_tier: "auto"` worden omgezet naar `standard`.

    </Note>

  </Accordion>

  <Accordion title="Media understanding (image and PDF)">
    De gebundelde Anthropic-Plugin registreert begrip van afbeeldingen en PDF's. OpenClaw
    lost mediacapaciteiten automatisch op vanuit de geconfigureerde Anthropic-auth — er is geen
    aanvullende configuratie nodig.

    | Eigenschap          | Waarde                |
    | ------------------- | --------------------- |
    | Standaardmodel      | `claude-opus-4-7`     |
    | Ondersteunde invoer | Afbeeldingen, PDF-documenten |

    Wanneer een afbeelding of PDF aan een gesprek wordt toegevoegd, routeert OpenClaw deze automatisch
    via de Anthropic-provider voor mediabegrip.

  </Accordion>

  <Accordion title="1M context window (beta)">
    Anthropic's 1M-contextvenster zit achter een bètapoort. Schakel het per model in:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {
              params: { context1m: true },
            },
          },
        },
      },
    }
    ```

    OpenClaw zet dit op verzoeken om naar `anthropic-beta: context-1m-2025-08-07`.

    `params.context1m: true` geldt ook voor de Claude CLI-backend
    (`claude-cli/*`) voor geschikte Opus- en Sonnet-modellen, waardoor het runtime-
    contextvenster voor die CLI-sessies wordt uitgebreid zodat het overeenkomt met het directe API-gedrag.

    <Warning>
    Vereist toegang tot lange context op je Anthropic-referentie. Verouderde tokenauth (`sk-ant-oat-*`) wordt geweigerd voor 1M-contextverzoeken — OpenClaw logt een waarschuwing en valt terug op het standaardcontextvenster.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 1M context">
    `anthropic/claude-opus-4.7` en de `claude-cli`-variant daarvan hebben standaard een 1M-context
    venster — geen `params.context1m: true` nodig.
  </Accordion>
</AccordionGroup>

## Probleemoplossing

<AccordionGroup>
  <Accordion title="401 errors / token suddenly invalid">
    Anthropic-tokenauth verloopt en kan worden ingetrokken. Gebruik voor nieuwe installaties in plaats daarvan een Anthropic API key.
  </Accordion>

  <Accordion title='No API key found for provider "anthropic"'>
    Anthropic-auth is **per agent** — nieuwe agents nemen de sleutels van de hoofdagent niet over. Voer onboarding opnieuw uit voor die agent (of configureer een API key op de gatewayhost) en controleer vervolgens met `openclaw models status`.
  </Accordion>

  <Accordion title='No credentials found for profile "anthropic:default"'>
    Voer `openclaw models status` uit om te zien welk auth-profiel actief is. Voer onboarding opnieuw uit, of configureer een API key voor dat profielpad.
  </Accordion>

  <Accordion title="No available auth profile (all in cooldown)">
    Controleer `openclaw models status --json` op `auth.unusableProfiles`. Anthropic-rate-limit-cooldowns kunnen modelgebonden zijn, dus een verwant Anthropic-model kan nog steeds bruikbaar zijn. Voeg een ander Anthropic-profiel toe of wacht tot de cooldown voorbij is.
  </Accordion>
</AccordionGroup>

<Note>
Meer hulp: [Probleemoplossing](/nl/help/troubleshooting) en [FAQ](/nl/help/faq).
</Note>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Model selection" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failovergedrag kiezen.
  </Card>
  <Card title="CLI backends" href="/nl/gateway/cli-backends" icon="terminal">
    Installatie- en runtimedetails voor de Claude CLI-backend.
  </Card>
  <Card title="Prompt caching" href="/nl/reference/prompt-caching" icon="database">
    Hoe promptcaching werkt tussen providers.
  </Card>
  <Card title="OAuth and auth" href="/nl/gateway/authentication" icon="key">
    Auth-details en regels voor hergebruik van referenties.
  </Card>
</CardGroup>
