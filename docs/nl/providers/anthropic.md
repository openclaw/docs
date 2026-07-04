---
read_when:
    - Je wilt Anthropic-modellen gebruiken in OpenClaw
summary: Gebruik Anthropic Claude via API-sleutels of Claude CLI in OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-07-04T15:25:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e6fd143b85bb448f65d5d1b35ce465cce7c6f41987b39b9665910cf71761032
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic bouwt de **Claude**-modelfamilie. OpenClaw ondersteunt twee auth-routes:

- **API-sleutel** — directe toegang tot de Anthropic API met gebruiksgebaseerde facturering (`anthropic/*`-modellen)
- **Claude CLI** — hergebruik een bestaande Claude Code-login op dezelfde host

<Warning>
De Claude CLI-backend van OpenClaw voert de geinstalleerde Claude Code CLI uit in
niet-interactieve printmodus. De huidige Claude Code-documentatie van Anthropic beschrijft
`claude -p` als Agent SDK/programmatisch gebruik. De supportupdate van Anthropic van 15 juni 2026
heeft de aangekondigde wijziging in Agent SDK-facturering gepauzeerd. Voor nu zegt Anthropic dat
gebruik van Claude Agent SDK, `claude -p` en apps van derden nog steeds meetelt voor de
gebruikslimieten van een abonnement. Het eerder aangekondigde maandelijkse Agent SDK-tegoed
is niet beschikbaar terwijl Anthropic dat plan herziet.

Interactieve Claude Code telt nog steeds mee voor de limieten van het aangemelde Claude-abonnement. API-
sleutel-auth blijft directe API-facturering op basis van pay-as-you-go. Gebruik voor langlopende gatewayhosts,
gedeelde automatisering en voorspelbare productiekosten een Anthropic API-sleutel.

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

    ### Config-voorbeeld

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Best voor:** het hergebruiken van een bestaande Claude CLI-login zonder aparte API-sleutel.

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
    Setup- en runtimedetails voor de Claude CLI-backend staan in [CLI-backends](/nl/gateway/cli-backends).
    </Note>

    <Warning>
    Hergebruik van Claude CLI verwacht dat het OpenClaw-proces draait op dezelfde host als de
    Claude CLI-login. Docker-installaties kunnen een containerhome behouden en daar inloggen bij
    Claude Code; zie
    [Claude CLI-backend in Docker](/nl/install/docker#claude-cli-backend-in-docker).
    Andere containerinstallaties zoals [Podman](/nl/install/podman) koppelen host
    `~/.claude` niet in setup of runtime; gebruik daar een Anthropic API-sleutel, of kies
    een provider met door OpenClaw beheerde OAuth zoals
    [OpenAI Codex](/nl/providers/openai).
    </Warning>

    ### Config-voorbeeld

    Geef de voorkeur aan de canonieke Anthropic-modelreferentie plus een CLI-runtimeoverride:

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

    Verouderde `claude-cli/claude-opus-4-7`-modelreferenties werken nog steeds voor
    compatibiliteit, maar nieuwe config moet provider/modelselectie behouden als
    `anthropic/*` en de uitvoeringsbackend in provider/model-runtimebeleid plaatsen.

    ### Facturering en `claude -p`

    OpenClaw gebruikt het niet-interactieve `claude -p`-pad van Claude Code voor Claude CLI-
    uitvoeringen. Anthropic behandelt dat pad momenteel als Agent SDK/programmatisch gebruik:

    - De supportupdate van Anthropic van 15 juni 2026 heeft het eerder aangekondigde
      aparte Agent SDK-tegoedplan gepauzeerd.
    - Voor nu tellen Claude Agent SDK, `claude -p` en appgebruik van derden binnen abonnementen
      nog steeds mee voor de gebruikslimieten van het aangemelde abonnement.
    - Het eerder aangekondigde maandelijkse Agent SDK-tegoed is niet beschikbaar terwijl
      Anthropic dat plan herziet.
    - Console/API-sleutel-logins gebruiken pay-as-you-go API-facturering en ontvangen niet
      het Agent SDK-tegoed van het abonnement.

    Zie Anthropic's [Agent SDK-abonnementsartikel](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    voor de pauzemelding, en de Claude Code-abonnementsartikelen voor
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    en
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)
    abonnementswerking.

    Anthropic kan Claude Code-facturering en rate-limitgedrag wijzigen zonder een
    OpenClaw-release. Controleer `claude auth status`, `/status` en
    de gelinkte documentatie van Anthropic wanneer voorspelbaarheid van facturering belangrijk is.

    <Tip>
    Gebruik voor gedeelde productieautomatisering een Anthropic API-sleutel in plaats van
    Claude CLI. OpenClaw ondersteunt ook abonnementsachtige opties van
    [OpenAI Codex](/nl/providers/openai), [Qwen Cloud](/nl/providers/qwen),
    [MiniMax](/nl/providers/minimax) en [Z.AI / GLM](/nl/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Thinking-standaarden (Claude Fable 5, 4.8 en 4.6)

`anthropic/claude-fable-5` gebruikt altijd adaptief denken en heeft standaard `high`
inspanning. Omdat Anthropic niet toestaat dat thinking voor dit model wordt uitgeschakeld,
gebruiken `/think off` en `/think minimal` `low` inspanning. OpenClaw laat ook aangepaste
temperatuurwaarden weg voor Fable 5-aanvragen.

Claude Opus 4.8 houdt thinking standaard uit in OpenClaw. Wanneer je adaptief denken expliciet inschakelt met `/think high|xhigh|max`, stuurt OpenClaw Anthropic's Opus 4.8-inspanningswaarden; Claude 4.6-modellen gebruiken standaard `adaptive`.

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
- [Adaptief denken](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Uitgebreid denken](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Safety refusal-fallback (Claude Fable 5)

<Warning>
Claude Fable 5 gebruiken betekent ook Claude Opus 4.8 gebruiken. Fable 5 wordt geleverd met
safety-classifiers die een aanvraag kunnen weigeren, en Anthropic's gesanctioneerde
herstel is om `claude-opus-4-8` die beurt te laten afhandelen. OpenClaw schakelt dit
automatisch in voor directe API-sleutelaanvragen, waardoor sommige Fable-beurten worden beantwoord
en gefactureerd als Claude Opus 4.8. Als je beleid of budget
door Opus afgehandelde beurten niet kan accepteren, selecteer dan niet `anthropic/claude-fable-5`.
</Warning>

### Waarom dit bestaat

Fable 5-classifiers retourneren `stop_reason: "refusal"` bij aanvragen in beperkte
domeinen, en ze geven ook vals-positieven bij werk dat aan goedaardig grenst (security-
tooling, life sciences, of zelfs het model vragen zijn ruwe
redenering te reproduceren). Zonder fallback sterft de beurt met een fout, ook al zou
een ander Claude-model die graag afhandelen — Anthropic's eigen weigeringsbericht
vertelt API-integrators om een fallbackmodel te configureren.

### Hoe het werkt

1. Voor elke directe API-sleutelaanvraag naar `anthropic/claude-fable-5` stuurt OpenClaw
   Anthropic's server-side fallback-opt-in: de
   `server-side-fallback-2026-06-01` beta-header plus
   `fallbacks: [{"model": "claude-opus-4-8"}]`. Claude Opus 4.8 is het enige
   fallbackdoel dat Anthropic toestaat voor Fable 5.
2. Alleen een weigering door een safety-classifier activeert de fallback. Rate limits,
   overbelasting en serverfouten gedragen zich precies zoals voorheen en lopen via
   OpenClaw's normale [model-failover](/nl/concepts/model-failover).
3. De redding gebeurt binnen dezelfde aanroep. Een weigering voor enige uitvoer is
   onzichtbaar behalve door latency; het hele antwoord komt van Opus 4.8. Bij een
   weigering halverwege de stream blijft de gedeeltelijke tekst behouden als het voorvoegsel waarvan het fallback-
   model verdergaat, terwijl de redenering en toolaanroepen van het geweigerde model
   worden weggegooid volgens Anthropic's replayregels (ze mogen niet worden teruggekaatst of
   uitgevoerd).
4. Als Claude Opus 4.8 ook weigert, toont de beurt de weigering als een
   fout, precies zoals voor deze functie.

De fallback gebeurt op Anthropic API-niveau, dus `claude-opus-4-8` hoeft niet
in je geconfigureerde modellenlijst of fallbackketen te staan — een Fable-geschikte
API-sleutel kan altijd Opus leveren.

### Observeerbaarheid en facturering

- Een door fallback afgehandelde beurt registreert een `provider_fallback`-diagnostic op het
  assistentbericht met `fromModel` en `toModel`, en de
  `responseModel` van het bericht rapporteert `claude-opus-4-8`.
- Anthropic factureert per poging: een weigering voor uitvoer is gratis, en de redding
  wordt gefactureerd tegen Claude Opus 4.8-tarieven (momenteel de helft van Fable 5-tarieven). OpenClaw's
  kostenraming per beurt prijst door fallback afgehandelde beurten tegen Opus-tarieven om daarmee overeen te komen.
- Een weigering halverwege de stream factureert daarnaast het al gestreamde Fable-deel
  aan Anthropic's kant; dat deel wordt gerapporteerd in het API-gebruik per poging
  maar niet opgenomen in OpenClaw's raming per beurt.

### Bereik

Van toepassing op `anthropic/claude-fable-5` met API-sleutel-auth tegen
`api.anthropic.com`. OAuth (hergebruik van Claude CLI-abonnement), proxybasis-URL's,
Bedrock, Vertex en Foundry-aanvragen blijven ongewijzigd en tonen daar nog steeds
weigeringen als fouten.

Live geverifieerd: een goedaardige prompt die Fable 5 vraagt zijn ruwe chain of
thought te reproduceren wordt geweigerd met `category: "reasoning_extraction"` wanneer verzonden zonder
fallbacks, en dezelfde prompt via OpenClaw retourneert een normaal door Opus afgehandeld
antwoord met de `provider_fallback`-diagnostic eraan gekoppeld.

Zie Anthropic's [gids voor weigeringen en fallback](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
voor het onderliggende gedrag.

## Promptcaching

OpenClaw ondersteunt Anthropic's promptcachingfunctie voor API-sleutel-auth.

| Waarde              | Cacheduur      | Beschrijving                             |
| ------------------- | -------------- | ---------------------------------------- |
| `"short"` (standaard) | 5 minuten    | Automatisch toegepast voor API-sleutel-auth |
| `"long"`            | 1 uur          | Uitgebreide cache                        |
| `"none"`            | Geen caching   | Promptcaching uitschakelen               |

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
    Gebruik parameters op modelniveau als je basislijn en overschrijf vervolgens specifieke agents via `agents.list[].params`:

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

    Volgorde voor config-samenvoeging:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (overeenkomende `id`, overschrijft per sleutel)

    Hiermee kan één agent een langdurige cache behouden terwijl een andere agent op hetzelfde model caching uitschakelt voor piekerig verkeer met weinig hergebruik.

  </Accordion>

  <Accordion title="Bedrock Claude-opmerkingen">
    - Anthropic Claude-modellen op Bedrock (`amazon-bedrock/*anthropic.claude*`) accepteren `cacheRetention`-doorgifte wanneer geconfigureerd.
    - Niet-Anthropic Bedrock-modellen worden tijdens runtime geforceerd naar `cacheRetention: "none"`.
    - Slimme standaardwaarden voor API-sleutels vullen ook `cacheRetention: "short"` in voor Claude-on-Bedrock-refs wanneer er geen expliciete waarde is ingesteld.

  </Accordion>
</AccordionGroup>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Snelle modus">
    De gedeelde `/fast`-schakelaar van OpenClaw ondersteunt direct Anthropic-verkeer (API-sleutel en OAuth naar `api.anthropic.com`).

    | Opdracht | Wordt gekoppeld aan |
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
    - Alleen geïnjecteerd voor directe `api.anthropic.com`-aanvragen. Proxyroutes laten `service_tier` ongemoeid.
    - Expliciete `serviceTier`- of `service_tier`-params overschrijven `/fast` wanneer beide zijn ingesteld.
    - Op accounts zonder Priority Tier-capaciteit kan `service_tier: "auto"` uitkomen op `standard`.

    </Note>

  </Accordion>

  <Accordion title="Media-inzicht (afbeelding en PDF)">
    De gebundelde Anthropic-Plugin registreert inzicht in afbeeldingen en PDF's. OpenClaw
    leidt mediacapaciteiten automatisch af uit de geconfigureerde Anthropic-authenticatie — er is
    geen aanvullende configuratie nodig.

    | Eigenschap      | Waarde                |
    | --------------- | --------------------- |
    | Standaardmodel  | `claude-opus-4-8`     |
    | Ondersteunde invoer | Afbeeldingen, PDF-documenten |

    Wanneer een afbeelding of PDF aan een gesprek wordt toegevoegd, routeert OpenClaw deze automatisch
    via de Anthropic-provider voor media-inzicht.

  </Accordion>

  <Accordion title="1M-contextvenster">
    Anthropic's 1M-contextvenster is beschikbaar op GA-geschikte Claude 4.x-modellen
    zoals Opus 4.8, Opus 4.7, Opus 4.6 en Sonnet 4.6. OpenClaw stelt die modellen automatisch in op
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

    Oudere configuraties kunnen `params.context1m: true` behouden, maar OpenClaw verzendt niet langer
    de uitgefaseerde `context-1m-2025-08-07`-bètaheader. Oudere `anthropicBeta`-configuratie-items
    met die waarde worden genegeerd tijdens het bepalen van aanvraagheaders en
    niet-ondersteunde oudere Claude-modellen blijven op hun normale contextvenster.

    `params.context1m: true` geldt ook voor de Claude CLI-backend
    (`claude-cli/*`) voor in aanmerking komende GA-geschikte Opus- en Sonnet-modellen, waarbij
    het runtime-contextvenster voor die CLI-sessies behouden blijft zodat het overeenkomt met het directe API-
    gedrag.

    <Warning>
    Vereist toegang tot lange context op je Anthropic-referentie. OAuth-/abonnementstokenauthenticatie behoudt de vereiste Anthropic-bètaheaders, maar OpenClaw verwijdert de uitgefaseerde 1M-bètaheader als die nog in oudere configuratie staat.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M-context">
    `anthropic/claude-opus-4-8` en de `claude-cli`-variant ervan hebben standaard een 1M-contextvenster — geen `params.context1m: true` nodig.
  </Accordion>
</AccordionGroup>

## Probleemoplossing

<AccordionGroup>
  <Accordion title="401-fouten / token plotseling ongeldig">
    Anthropic-tokenauthenticatie verloopt en kan worden ingetrokken. Gebruik voor nieuwe setups in plaats daarvan een Anthropic API-sleutel.
  </Accordion>

  <Accordion title='Geen API-sleutel gevonden voor provider "anthropic"'>
    Anthropic-authenticatie is **per agent** — nieuwe agents erven de sleutels van de hoofdagent niet. Voer onboarding opnieuw uit voor die agent (of configureer een API-sleutel op de gatewayhost) en verifieer daarna met `openclaw models status`.
  </Accordion>

  <Accordion title='Geen referenties gevonden voor profiel "anthropic:default"'>
    Voer `openclaw models status` uit om te zien welk authenticatieprofiel actief is. Voer onboarding opnieuw uit, of configureer een API-sleutel voor dat profielpad.
  </Accordion>

  <Accordion title="Geen beschikbaar authenticatieprofiel (allemaal in cooldown)">
    Controleer `openclaw models status --json` op `auth.unusableProfiles`. Anthropic-rate-limit-cooldowns kunnen modelspecifiek zijn, dus een verwant Anthropic-model kan nog steeds bruikbaar zijn. Voeg een ander Anthropic-profiel toe of wacht tot de cooldown voorbij is.
  </Accordion>
</AccordionGroup>

<Note>
Meer hulp: [Probleemoplossing](/nl/help/troubleshooting) en [FAQ](/nl/help/faq).
</Note>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelrefs en failovergedrag kiezen.
  </Card>
  <Card title="CLI-backends" href="/nl/gateway/cli-backends" icon="terminal">
    Instelling van de Claude CLI-backend en runtimedetails.
  </Card>
  <Card title="Promptcaching" href="/nl/reference/prompt-caching" icon="database">
    Hoe promptcaching werkt tussen providers.
  </Card>
  <Card title="OAuth en auth" href="/nl/gateway/authentication" icon="key">
    Auth-details en regels voor hergebruik van referenties.
  </Card>
</CardGroup>
