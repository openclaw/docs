---
read_when:
    - Je wilt Anthropic-modellen gebruiken in OpenClaw
summary: Gebruik Anthropic Claude via API-sleutels of de Claude CLI in OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-05-11T20:45:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: c36764f1adb7585389d241303e9c61c1fe2fa49fefdfb28c314abbafa646b273
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic bouwt de **Claude**-modelfamilie. OpenClaw ondersteunt twee authenticatieroutes:

- **API-sleutel** — directe toegang tot de Anthropic API met gebruiksgebaseerde facturering (`anthropic/*`-modellen)
- **Claude CLI** — hergebruik een bestaande Claude CLI-login op dezelfde host

<Warning>
Medewerkers van Anthropic hebben ons verteld dat gebruik van Claude CLI in OpenClaw-stijl weer is toegestaan, dus
OpenClaw behandelt hergebruik van Claude CLI en gebruik van `claude -p` als gesanctioneerd, tenzij
Anthropic een nieuw beleid publiceert.

Voor langlevende gatewayhosts zijn Anthropic API-sleutels nog steeds het duidelijkste en
meest voorspelbare productiepad.

Huidige openbare documentatie van Anthropic:

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
        Maak een API-sleutel in de [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Of geef de sleutel rechtstreeks door:

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
    **Beste voor:** een bestaande Claude CLI-login hergebruiken zonder aparte API-sleutel.

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

        OpenClaw detecteert en hergebruikt de bestaande Claude CLI-inloggegevens.
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Installatie- en runtimedetails voor de Claude CLI-backend staan in [CLI-backends](/nl/gateway/cli-backends).
    </Note>

    ### Configuratievoorbeeld

    Geef de voorkeur aan de canonieke Anthropic-modelreferentie plus een CLI-runtime-override:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-7" },
          models: {
            "anthropic/claude-opus-4-7": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    Verouderde `claude-cli/claude-opus-4-7`-modelreferenties werken nog steeds voor
    compatibiliteit, maar nieuwe configuratie moet provider-/modelselectie als
    `anthropic/*` houden en de uitvoeringsbackend in het runtimebeleid voor provider/model zetten.

    <Tip>
    Als je het duidelijkste factureringspad wilt, gebruik dan in plaats daarvan een Anthropic API-sleutel. OpenClaw ondersteunt ook abonnementsachtige opties van [OpenAI Codex](/nl/providers/openai), [Qwen Cloud](/nl/providers/qwen), [MiniMax](/nl/providers/minimax) en [Z.AI / GLM](/nl/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Denkstandaarden (Claude 4.6)

Claude 4.6-modellen gebruiken standaard `adaptive`-denken in OpenClaw wanneer er geen expliciet denkniveau is ingesteld.

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

OpenClaw ondersteunt de promptcachingfunctie van Anthropic voor API-sleutel-authenticatie.

| Waarde              | Cacheduur      | Beschrijving                                      |
| ------------------- | -------------- | ------------------------------------------------- |
| `"short"` (standaard) | 5 minuten    | Automatisch toegepast voor API-sleutel-authenticatie |
| `"long"`            | 1 uur          | Uitgebreide cache                                 |
| `"none"`            | Geen caching   | Promptcaching uitschakelen                        |

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
    Gebruik parameters op modelniveau als je basislijn en overschrijf daarna specifieke agents via `agents.list[].params`:

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

    Volgorde voor samenvoegen van configuratie:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (overeenkomende `id`, overschrijft per sleutel)

    Hierdoor kan één agent een langlevende cache behouden, terwijl een andere agent op hetzelfde model caching uitschakelt voor piekerig verkeer met weinig hergebruik.

  </Accordion>

  <Accordion title="Bedrock Claude notes">
    - Anthropic Claude-modellen op Bedrock (`amazon-bedrock/*anthropic.claude*`) accepteren `cacheRetention`-doorgifte wanneer geconfigureerd.
    - Niet-Anthropic Bedrock-modellen worden tijdens runtime geforceerd naar `cacheRetention: "none"`.
    - Slimme standaarden voor API-sleutels vullen ook `cacheRetention: "short"` in voor Claude-op-Bedrock-referenties wanneer er geen expliciete waarde is ingesteld.

  </Accordion>
</AccordionGroup>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Fast mode">
    De gedeelde `/fast`-schakelaar van OpenClaw ondersteunt direct Anthropic-verkeer (API-sleutel en OAuth naar `api.anthropic.com`).

    | Opdracht | Wordt toegewezen aan |
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
    - Alleen geïnjecteerd voor directe `api.anthropic.com`-requests. Proxyroutes laten `service_tier` ongemoeid.
    - Expliciete `serviceTier`- of `service_tier`-parameters overschrijven `/fast` wanneer beide zijn ingesteld.
    - Op accounts zonder Priority Tier-capaciteit kan `service_tier: "auto"` uitkomen op `standard`.

    </Note>

  </Accordion>

  <Accordion title="Media understanding (image and PDF)">
    De meegeleverde Anthropic Plugin registreert begrip van afbeeldingen en PDF's. OpenClaw
    lost mediacapabilities automatisch op vanuit de geconfigureerde Anthropic-authenticatie; er is geen
    aanvullende configuratie nodig.

    | Eigenschap      | Waarde                |
    | --------------- | --------------------- |
    | Standaardmodel  | `claude-opus-4-7`     |
    | Ondersteunde invoer | Afbeeldingen, PDF-documenten |

    Wanneer een afbeelding of PDF aan een gesprek wordt gekoppeld, routeert OpenClaw deze automatisch
    via de Anthropic-provider voor mediabegrip.

  </Accordion>

  <Accordion title="1M context window (beta)">
    Het 1M-contextvenster van Anthropic is beta-gated. Schakel het per model in:

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

    OpenClaw wijst dit op requests toe aan `anthropic-beta: context-1m-2025-08-07`.

    `params.context1m: true` geldt ook voor de Claude CLI-backend
    (`claude-cli/*`) voor daarvoor geschikte Opus- en Sonnet-modellen, waardoor het runtime-
    contextvenster voor die CLI-sessies wordt uitgebreid zodat het overeenkomt met het gedrag van de directe API.

    <Warning>
    Vereist toegang tot lange context op je Anthropic-inloggegeven. Verouderde tokenauthenticatie (`sk-ant-oat-*`) wordt afgewezen voor 1M-contextrequests — OpenClaw logt een waarschuwing en valt terug op het standaardcontextvenster.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 1M context">
    `anthropic/claude-opus-4.7` en de bijbehorende `claude-cli`-variant hebben standaard een 1M-context-
    venster; geen `params.context1m: true` nodig.
  </Accordion>
</AccordionGroup>

## Probleemoplossing

<AccordionGroup>
  <Accordion title="401 errors / token suddenly invalid">
    Anthropic-tokenauthenticatie verloopt en kan worden ingetrokken. Gebruik voor nieuwe installaties in plaats daarvan een Anthropic API-sleutel.
  </Accordion>

  <Accordion title='No API key found for provider "anthropic"'>
    Anthropic-authenticatie is **per agent** — nieuwe agents erven de sleutels van de hoofdagent niet. Voer onboarding opnieuw uit voor die agent (of configureer een API-sleutel op de gatewayhost) en controleer daarna met `openclaw models status`.
  </Accordion>

  <Accordion title='No credentials found for profile "anthropic:default"'>
    Voer `openclaw models status` uit om te zien welk auth-profiel actief is. Voer onboarding opnieuw uit of configureer een API-sleutel voor dat profielpad.
  </Accordion>

  <Accordion title="No available auth profile (all in cooldown)">
    Controleer `openclaw models status --json` op `auth.unusableProfiles`. Anthropic-rate-limit-cooldowns kunnen modelspecifiek zijn, dus een verwant Anthropic-model kan nog steeds bruikbaar zijn. Voeg een ander Anthropic-profiel toe of wacht tot de cooldown voorbij is.
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
    Installatie- en runtimedetails van de Claude CLI-backend.
  </Card>
  <Card title="Prompt caching" href="/nl/reference/prompt-caching" icon="database">
    Hoe promptcaching werkt bij providers.
  </Card>
  <Card title="OAuth and auth" href="/nl/gateway/authentication" icon="key">
    Auth-details en regels voor hergebruik van inloggegevens.
  </Card>
</CardGroup>
