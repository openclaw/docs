---
read_when:
    - Je wilt Anthropic-modellen gebruiken in OpenClaw
summary: Gebruik Anthropic Claude via API-sleutels of Claude CLI in OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-06-28T20:44:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48a2792e464175b3ebe6acd92606c20231fd31940f56e2432bb45657eb0a68d7
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic bouwt de **Claude**-modelfamilie. OpenClaw ondersteunt twee auth-routes:

- **API-sleutel** — directe Anthropic API-toegang met gebruiksgebaseerde facturering (`anthropic/*`-modellen)
- **Claude CLI** — hergebruik een bestaande Claude Code-login op dezelfde host

<Warning>
De Claude CLI-backend van OpenClaw voert de geinstalleerde Claude Code CLI uit in
niet-interactieve printmodus. De huidige Claude Code-documentatie van Anthropic beschrijft
`claude -p` als Agent SDK-/programmatisch gebruik. De supportupdate van Anthropic van 15 juni 2026
heeft de aangekondigde factureringswijziging voor Agent SDK gepauzeerd. Voorlopig zegt Anthropic
dat gebruik van Claude Agent SDK, `claude -p` en apps van derden nog steeds wordt verrekend met de
gebruikslimieten van een abonnement. Het eerder aangekondigde maandelijkse Agent SDK-tegoed
is niet beschikbaar terwijl Anthropic dat plan herziet.

Interactieve Claude Code wordt nog steeds verrekend met de limieten van het aangemelde Claude-abonnement. API-
sleutel-auth blijft directe API-facturering op basis van betalen naar gebruik. Gebruik voor langlevende Gateway-hosts,
gedeelde automatisering en voorspelbare productie-uitgaven een Anthropic API-sleutel.

Controleer de huidige supportartikelen van Anthropic voordat je vertrouwt op
factureringsgedrag via abonnementen:

- [Claude Code CLI-referentie](https://code.claude.com/docs/en/cli-usage)
- [Gebruik de Claude Agent SDK met je Claude-abonnement](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Gebruik Claude Code met je Pro- of Max-abonnement](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Gebruik Claude Code met je Team- of Enterprise-abonnement](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Beheer Claude Code-kosten](https://code.claude.com/docs/en/costs)

</Warning>

## Aan de slag

<Tabs>
  <Tab title="API-sleutel">
    **Best voor:** standaard API-toegang en gebruiksgebaseerde facturering.

    <Steps>
      <Step title="Haal je API-sleutel op">
        Maak een API-sleutel aan in de [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Voer onboarding uit">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Of geef de sleutel direct door:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Controleer of het model beschikbaar is">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Configuratievoorbeeld

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Best voor:** hergebruik van een bestaande Claude CLI-login zonder aparte API-sleutel.

    <Steps>
      <Step title="Zorg dat Claude CLI is geinstalleerd en aangemeld">
        Controleer met:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Voer onboarding uit">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw detecteert en hergebruikt de bestaande Claude CLI-referenties.
      </Step>
      <Step title="Controleer of het model beschikbaar is">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Installatie- en runtimedetails voor de Claude CLI-backend staan in [CLI-backends](/nl/gateway/cli-backends).
    </Note>

    <Warning>
    Hergebruik van Claude CLI verwacht dat het OpenClaw-proces draait op dezelfde host als de
    Claude CLI-login. Docker-installaties kunnen een containerhome behouden en daar aanmelden bij
    Claude Code; zie
    [Claude CLI-backend in Docker](/nl/install/docker#claude-cli-backend-in-docker).
    Andere containerinstallaties zoals [Podman](/nl/install/podman) koppelen host
    `~/.claude` niet aan setup of runtime; gebruik daar een Anthropic API-sleutel, of kies
    een provider met door OpenClaw beheerde OAuth, zoals
    [OpenAI Codex](/nl/providers/openai).
    </Warning>

    ### Configuratievoorbeeld

    Gebruik bij voorkeur de canonieke Anthropic-modelverwijzing plus een CLI-runtime-override:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-8" },
          models: {
            "anthropic/claude-opus-4-8": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    Legacy `claude-cli/claude-opus-4-7`-modelverwijzingen werken nog steeds voor
    compatibiliteit, maar nieuwe configuratie moet provider-/modelselectie als
    `anthropic/*` houden en de uitvoeringsbackend in provider-/modelruntimebeleid plaatsen.

    ### Facturering en `claude -p`

    OpenClaw gebruikt het niet-interactieve `claude -p`-pad van Claude Code voor Claude CLI-
    runs. Anthropic behandelt dat pad momenteel als Agent SDK-/programmatisch gebruik:

    - De supportupdate van Anthropic van 15 juni 2026 heeft het eerder aangekondigde
      afzonderlijke Agent SDK-tegoedplan gepauzeerd.
    - Voorlopig worden Claude Agent SDK, `claude -p` en appgebruik van derden binnen abonnementen
      nog steeds verrekend met de gebruikslimieten van het aangemelde abonnement.
    - Het eerder aangekondigde maandelijkse Agent SDK-tegoed is niet beschikbaar terwijl
      Anthropic dat plan herziet.
    - Console-/API-sleutel-logins gebruiken API-facturering op basis van betalen naar gebruik en ontvangen
      het Agent SDK-tegoed voor abonnementen niet.

    Zie het [Agent SDK-abonnementsartikel](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    van Anthropic voor de pauzemelding, en de Claude Code-abonnementsartikelen voor
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    en
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)
    abonnementsgedrag.

    Anthropic kan Claude Code-facturering en rate-limitgedrag wijzigen zonder een
    OpenClaw-release. Controleer `claude auth status`, `/status` en
    de gekoppelde documentatie van Anthropic wanneer voorspelbare facturering belangrijk is.

    <Tip>
    Gebruik voor gedeelde productieautomatisering een Anthropic API-sleutel in plaats van
    Claude CLI. OpenClaw ondersteunt ook abonnementsachtige opties van
    [OpenAI Codex](/nl/providers/openai), [Qwen Cloud](/nl/providers/qwen),
    [MiniMax](/nl/providers/minimax) en [Z.AI / GLM](/nl/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Thinking-standaarden (Claude Fable 5, 4.8 en 4.6)

`anthropic/claude-fable-5` gebruikt altijd adaptief thinking en staat standaard op `high`
inspanning. Omdat Anthropic niet toestaat dat thinking voor dit model wordt uitgeschakeld,
gebruiken `/think off` en `/think minimal` `low` inspanning. OpenClaw laat ook aangepaste
temperatuurwaarden weg voor Fable 5-verzoeken.

Claude Opus 4.8 houdt thinking standaard uit in OpenClaw. Wanneer je adaptief thinking expliciet inschakelt met `/think high|xhigh|max`, stuurt OpenClaw de Opus 4.8-inspanningswaarden van Anthropic; Claude 4.6-modellen staan standaard op `adaptive`.

Overschrijf per bericht met `/think:<level>` of in modelparameters:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-8": {
          params: { thinking: "high" },
        },
      },
    },
  },
}
```

<Note>
Gerelateerde Anthropic-documentatie:
- [Adaptief thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Uitgebreid thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Promptcaching

OpenClaw ondersteunt de promptcachingfunctie van Anthropic voor API-sleutel-auth.

| Waarde              | Cacheduur      | Beschrijving                              |
| ------------------- | -------------- | ----------------------------------------- |
| `"short"` (standaard) | 5 minuten    | Automatisch toegepast voor API-sleutel-auth |
| `"long"`            | 1 uur          | Uitgebreide cache                         |
| `"none"`            | Geen caching   | Promptcaching uitschakelen                |

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
  <Accordion title="Cache-overschrijvingen per agent">
    Gebruik modelniveauparameters als je basislijn en overschrijf daarna specifieke agents via `agents.list[].params`:

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

    Volgorde voor configuratiesamenvoeging:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (overeenkomende `id`, overschrijft per sleutel)

    Zo kan een agent een langlevende cache behouden terwijl een andere agent op hetzelfde model caching uitschakelt voor piekerig verkeer met weinig hergebruik.

  </Accordion>

  <Accordion title="Bedrock Claude-opmerkingen">
    - Anthropic Claude-modellen op Bedrock (`amazon-bedrock/*anthropic.claude*`) accepteren `cacheRetention`-doorgifte wanneer geconfigureerd.
    - Niet-Anthropic Bedrock-modellen worden tijdens runtime geforceerd naar `cacheRetention: "none"`.
    - Slimme standaarden voor API-sleutels vullen ook `cacheRetention: "short"` in voor Claude-on-Bedrock-verwijzingen wanneer er geen expliciete waarde is ingesteld.

  </Accordion>
</AccordionGroup>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Snelle modus">
    De gedeelde `/fast`-schakelaar van OpenClaw ondersteunt direct Anthropic-verkeer (API-sleutel en OAuth naar `api.anthropic.com`).

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
    - Alleen geinjecteerd voor directe `api.anthropic.com`-verzoeken. Proxyroutes laten `service_tier` ongemoeid.
    - Expliciete `serviceTier`- of `service_tier`-parameters overschrijven `/fast` wanneer beide zijn ingesteld.
    - Bij accounts zonder Priority Tier-capaciteit kan `service_tier: "auto"` uitkomen op `standard`.

    </Note>

  </Accordion>

  <Accordion title="Mediabegrip (afbeelding en PDF)">
    De gebundelde Anthropic-Plugin registreert begrip van afbeeldingen en PDF's. OpenClaw
    lost mediacapabilities automatisch op vanuit de geconfigureerde Anthropic-auth — er is geen
    aanvullende configuratie nodig.

    | Eigenschap      | Waarde                |
    | --------------- | --------------------- |
    | Standaardmodel  | `claude-opus-4-8`     |
    | Ondersteunde invoer | Afbeeldingen, PDF-documenten |

    Wanneer een afbeelding of PDF aan een gesprek wordt toegevoegd, routeert OpenClaw deze automatisch
    via de Anthropic-provider voor mediabegrip.

  </Accordion>

  <Accordion title="1M-contextvenster">
    Het 1M-contextvenster van Anthropic is beschikbaar op GA-capabele Claude 4.x-modellen
    zoals Opus 4.8, Opus 4.7, Opus 4.6 en Sonnet 4.6. OpenClaw dimensioneert die modellen automatisch op
    1M:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    Oudere configuraties kunnen `params.context1m: true` behouden, maar OpenClaw stuurt niet langer
    de ingetrokken `context-1m-2025-08-07`-betaheader. Oudere `anthropicBeta`-configuratie-
    items met die waarde worden genegeerd tijdens het oplossen van requestheaders en
    niet-ondersteunde oudere Claude-modellen blijven op hun normale contextvenster.

    `params.context1m: true` geldt ook voor de Claude CLI-backend
    (`claude-cli/*`) voor in aanmerking komende GA-capabele Opus- en Sonnet-modellen, waarbij
    het runtimecontextvenster voor die CLI-sessies behouden blijft zodat het overeenkomt met het directe API-
    gedrag.

    <Warning>
    Vereist long-context-toegang op je Anthropic-referentie. OAuth-/abonnementstoken-auth behoudt de vereiste Anthropic-betaheaders, maar OpenClaw verwijdert de ingetrokken 1M-betaheader als die in oudere configuratie achterblijft.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M context">
    `anthropic/claude-opus-4-8` en de `claude-cli`-variant ervan hebben standaard een 1M-contextvenster — geen `params.context1m: true` nodig.
  </Accordion>
</AccordionGroup>

## Problemen oplossen

<AccordionGroup>
  <Accordion title="401-fouten / token plotseling ongeldig">
    Anthropic-tokenauthenticatie verloopt en kan worden ingetrokken. Gebruik voor nieuwe installaties in plaats daarvan een Anthropic API-sleutel.
  </Accordion>

  <Accordion title='Geen API-sleutel gevonden voor provider "anthropic"'>
    Anthropic-authenticatie is **per agent** — nieuwe agents erven de sleutels van de hoofdagent niet. Voer onboarding opnieuw uit voor die agent (of configureer een API-sleutel op de gatewayhost) en controleer daarna met `openclaw models status`.
  </Accordion>

  <Accordion title='Geen referenties gevonden voor profiel "anthropic:default"'>
    Voer `openclaw models status` uit om te zien welk authenticatieprofiel actief is. Voer onboarding opnieuw uit, of configureer een API-sleutel voor dat profielpad.
  </Accordion>

  <Accordion title="Geen beschikbaar authenticatieprofiel (allemaal in cooldown)">
    Controleer `openclaw models status --json` op `auth.unusableProfiles`. Anthropic-rate-limitcooldowns kunnen modelspecifiek zijn, dus een verwant Anthropic-model kan nog steeds bruikbaar zijn. Voeg een ander Anthropic-profiel toe of wacht op de cooldown.
  </Accordion>
</AccordionGroup>

<Note>
Meer hulp: [Problemen oplossen](/nl/help/troubleshooting) en [FAQ](/nl/help/faq).
</Note>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelrefs en failovergedrag kiezen.
  </Card>
  <Card title="CLI-backends" href="/nl/gateway/cli-backends" icon="terminal">
    Installatie van de Claude CLI-backend en runtimedetails.
  </Card>
  <Card title="Promptcaching" href="/nl/reference/prompt-caching" icon="database">
    Hoe promptcaching werkt bij verschillende providers.
  </Card>
  <Card title="OAuth en authenticatie" href="/nl/gateway/authentication" icon="key">
    Authenticatiedetails en regels voor hergebruik van referenties.
  </Card>
</CardGroup>
