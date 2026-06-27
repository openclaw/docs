---
read_when:
    - Je wilt Anthropic-modellen gebruiken in OpenClaw
summary: Gebruik Anthropic Claude via API-sleutels of Claude CLI in OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-06-27T18:09:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 299bb8661bb894c57ca7a60f350494d22f6b726061ffcb70df053c40a3f842b0
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic bouwt de **Claude**-modelfamilie. OpenClaw ondersteunt twee auth-routes:

- **API-sleutel** — directe Anthropic API-toegang met verbruiksgebaseerde facturering (`anthropic/*`-modellen)
- **Claude CLI** — hergebruik een bestaande Claude Code-login op dezelfde host

<Warning>
De Claude CLI-backend van OpenClaw voert de geinstalleerde Claude Code CLI uit in
niet-interactieve printmodus. De huidige Claude Code-docs van Anthropic beschrijven
`claude -p` als Agent SDK-/programmatisch gebruik. Vanaf 15 juni 2026 zegt Anthropic
dat gebruik van `claude -p` met abonnementsplannen niet langer uit de normale Claude
planlimieten komt; het gebruikt eerst een afzonderlijk maandelijks Agent SDK-tegoed en daarna
gebruikstegoeden tegen standaard API-tarieven wanneer die tegoeden zijn ingeschakeld.

Interactieve Claude Code blijft uit de limieten van het aangemelde Claude-plan komen. API-
sleutel-auth blijft directe API-facturering op basis van werkelijk gebruik. Gebruik voor lang draaiende Gateway-hosts,
gedeelde automatisering en voorspelbare productiekosten een Anthropic API-sleutel.

Huidige openbare docs van Anthropic:

- [Claude Code CLI-referentie](https://code.claude.com/docs/en/cli-usage)
- [Gebruik de Claude Agent SDK met je Claude-plan](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Gebruik Claude Code met je Pro- of Max-plan](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Gebruik Claude Code met je Team- of Enterprise-plan](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Claude Code-kosten beheren](https://code.claude.com/docs/en/costs)

</Warning>

## Aan de slag

<Tabs>
  <Tab title="API-sleutel">
    **Beste voor:** standaard API-toegang en verbruiksgebaseerde facturering.

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
    **Beste voor:** hergebruik van een bestaande Claude CLI-login zonder aparte API-sleutel.

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
    Claude CLI-login. Docker-installaties kunnen een containerhome persistent maken en daar inloggen bij
    Claude Code; zie
    [Claude CLI-backend in Docker](/nl/install/docker#claude-cli-backend-in-docker).
    Andere containerinstallaties, zoals [Podman](/nl/install/podman), mounten host
    `~/.claude` niet in setup of runtime; gebruik daar een Anthropic API-sleutel, of kies
    een provider met door OpenClaw beheerde OAuth, zoals
    [OpenAI Codex](/nl/providers/openai).
    </Warning>

    ### Configuratievoorbeeld

    Geef de voorkeur aan de canonieke Anthropic-modelreferentie plus een CLI-runtime-override:

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

    Verouderde `claude-cli/claude-opus-4-7`-modelreferenties blijven werken voor
    compatibiliteit, maar nieuwe configuratie moet provider-/modelselectie als
    `anthropic/*` houden en de uitvoeringsbackend in provider-/modelruntimebeleid plaatsen.

    ### Facturering en `claude -p`

    OpenClaw gebruikt Claude Code's niet-interactieve `claude -p`-pad voor Claude CLI-
    runs. Anthropic behandelt dat pad momenteel als Agent SDK-/programmatisch gebruik:

    - Tot 15 juni 2026 volgt afhandeling voor abonnementsplannen Anthropic's actieve
      Claude Code-regels voor het aangemelde account.
    - Vanaf 15 juni 2026 gebruikt `claude -p`-gebruik met abonnementsplannen eerst het
      maandelijkse Agent SDK-tegoed van de gebruiker en daarna gebruikstegoeden tegen standaard
      API-tarieven als gebruikstegoeden zijn ingeschakeld.
    - Console-/API-sleutel-logins gebruiken API-facturering op basis van werkelijk gebruik en ontvangen
      het abonnementsgebonden Agent SDK-tegoed niet.

    Anthropic kan facturerings- en snelheidslimietgedrag van Claude Code wijzigen zonder een
    OpenClaw-release. Controleer `claude auth status`, `/status` en
    Anthropic's gelinkte docs wanneer voorspelbare facturering belangrijk is.

    <Tip>
    Gebruik voor gedeelde productieautomatisering een Anthropic API-sleutel in plaats van
    Claude CLI. OpenClaw ondersteunt ook abonnementsachtige opties van
    [OpenAI Codex](/nl/providers/openai), [Qwen Cloud](/nl/providers/qwen),
    [MiniMax](/nl/providers/minimax) en [Z.AI / GLM](/nl/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Denkstandaarden (Claude Fable 5, 4.8 en 4.6)

`anthropic/claude-fable-5` gebruikt altijd adaptief denken en staat standaard op `high`
inspanning. Omdat Anthropic niet toestaat dat denken voor dit model wordt uitgeschakeld,
gebruiken `/think off` en `/think minimal` `low` inspanning. OpenClaw laat ook aangepaste
temperatuurwaarden weg voor Fable 5-verzoeken.

Claude Opus 4.8 houdt denken standaard uit in OpenClaw. Wanneer je adaptief denken expliciet inschakelt met `/think high|xhigh|max`, stuurt OpenClaw Anthropic's Opus 4.8-inspanningswaarden; Claude 4.6-modellen gebruiken standaard `adaptive`.

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
Gerelateerde Anthropic-docs:
- [Adaptief denken](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Uitgebreid denken](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Promptcaching

OpenClaw ondersteunt Anthropic's promptcachingfunctie voor API-sleutel-auth.

| Waarde              | Cacheduur    | Beschrijving                                  |
| ------------------- | ------------ | --------------------------------------------- |
| `"short"` (standaard) | 5 minuten   | Automatisch toegepast voor API-sleutel-auth   |
| `"long"`            | 1 uur        | Uitgebreide cache                             |
| `"none"`            | Geen caching | Promptcaching uitschakelen                    |

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
    Gebruik parameters op modelniveau als je basis en overschrijf daarna specifieke agents via `agents.list[].params`:

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

    Configuratie-samenvoegvolgorde:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (overeenkomende `id`, overschrijft per sleutel)

    Hierdoor kan de ene agent een langlevende cache houden terwijl een andere agent op hetzelfde model caching uitschakelt voor piekerig verkeer met weinig hergebruik.

  </Accordion>

  <Accordion title="Bedrock Claude-opmerkingen">
    - Anthropic Claude-modellen op Bedrock (`amazon-bedrock/*anthropic.claude*`) accepteren `cacheRetention`-doorgifte wanneer geconfigureerd.
    - Niet-Anthropic Bedrock-modellen worden tijdens runtime geforceerd naar `cacheRetention: "none"`.
    - Slimme standaarden voor API-sleutels vullen ook `cacheRetention: "short"` in voor Claude-on-Bedrock-referenties wanneer er geen expliciete waarde is ingesteld.

  </Accordion>
</AccordionGroup>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Snelle modus">
    De gedeelde `/fast`-schakelaar van OpenClaw ondersteunt direct Anthropic-verkeer (API-sleutel en OAuth naar `api.anthropic.com`).

    | Opdracht | Koppelt aan |
    |---------|-------------|
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
    - Op accounts zonder Priority Tier-capaciteit kan `service_tier: "auto"` resulteren in `standard`.

    </Note>

  </Accordion>

  <Accordion title="Mediabegrip (afbeelding en PDF)">
    De gebundelde Anthropic-Plugin registreert begrip van afbeeldingen en PDF's. OpenClaw
    lost mediacapaciteiten automatisch op vanuit de geconfigureerde Anthropic-auth; er is geen
    extra configuratie nodig.

    | Eigenschap       | Waarde                |
    | ---------------- | --------------------- |
    | Standaardmodel   | `claude-opus-4-8`     |
    | Ondersteunde invoer | Afbeeldingen, PDF-documenten |

    Wanneer een afbeelding of PDF aan een gesprek is gekoppeld, routeert OpenClaw deze automatisch
    via de Anthropic-provider voor mediabegrip.

  </Accordion>

  <Accordion title="1M-contextvenster">
    Anthropic's 1M-contextvenster is beschikbaar op GA-geschikte Claude 4.x-modellen
    zoals Opus 4.8, Opus 4.7, Opus 4.6 en Sonnet 4.6. OpenClaw schaalt die modellen automatisch naar
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
    de vervallen `context-1m-2025-08-07`-betaheader. Oudere `anthropicBeta`-configuratie-
    vermeldingen met die waarde worden genegeerd tijdens het oplossen van requestheaders en
    niet-ondersteunde oudere Claude-modellen blijven op hun normale contextvenster.

    `params.context1m: true` geldt ook voor de Claude CLI-backend
    (`claude-cli/*`) voor in aanmerking komende GA-geschikte Opus- en Sonnet-modellen, waarmee
    het runtimecontextvenster voor die CLI-sessies behouden blijft zodat het overeenkomt met het directe-API-
    gedrag.

    <Warning>
    Vereist toegang tot lange context op je Anthropic-referentie. OAuth-/abonnementstoken-auth behoudt de vereiste Anthropic-betaheaders, maar OpenClaw verwijdert de vervallen 1M-betaheader als die in oudere configuratie blijft staan.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M-context">
    `anthropic/claude-opus-4-8` en de `claude-cli`-variant ervan hebben standaard een 1M-context-
    venster; geen `params.context1m: true` nodig.
  </Accordion>
</AccordionGroup>

## Probleemoplossing

<AccordionGroup>
  <Accordion title="401-fouten / token plotseling ongeldig">
    Anthropic-token-auth verloopt en kan worden ingetrokken. Gebruik voor nieuwe setups in plaats daarvan een Anthropic API-sleutel.
  </Accordion>

  <Accordion title='Geen API-sleutel gevonden voor provider "anthropic"'>
    Anthropic-auth is **per agent** — nieuwe agents nemen de sleutels van de hoofdagent niet over. Voer onboarding voor die agent opnieuw uit (of configureer een API-sleutel op de Gateway-host) en controleer daarna met `openclaw models status`.
  </Accordion>

  <Accordion title='Geen inloggegevens gevonden voor profiel "anthropic:default"'>
    Voer `openclaw models status` uit om te zien welk auth-profiel actief is. Voer onboarding opnieuw uit, of configureer een API-sleutel voor dat profielpad.
  </Accordion>

  <Accordion title="Geen beschikbaar auth-profiel (alles in cooldown)">
    Controleer `openclaw models status --json` op `auth.unusableProfiles`. Anthropic-rate-limit-cooldowns kunnen modelspecifiek zijn, dus een verwant Anthropic-model kan nog bruikbaar zijn. Voeg een ander Anthropic-profiel toe of wacht tot de cooldown voorbij is.
  </Accordion>
</AccordionGroup>

<Note>
Meer hulp: [Probleemoplossing](/nl/help/troubleshooting) en [FAQ](/nl/help/faq).
</Note>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failovergedrag kiezen.
  </Card>
  <Card title="CLI-backends" href="/nl/gateway/cli-backends" icon="terminal">
    Setup en runtimedetails voor de Claude CLI-backend.
  </Card>
  <Card title="Promptcaching" href="/nl/reference/prompt-caching" icon="database">
    Hoe promptcaching werkt bij providers.
  </Card>
  <Card title="OAuth en auth" href="/nl/gateway/authentication" icon="key">
    Auth-details en regels voor hergebruik van inloggegevens.
  </Card>
</CardGroup>
