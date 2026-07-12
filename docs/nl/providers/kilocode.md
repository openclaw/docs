---
read_when:
    - Je wilt één API-sleutel voor veel LLM's
    - Je wilt modellen via Kilo Gateway uitvoeren in OpenClaw
summary: Gebruik de uniforme API van Kilo Gateway om toegang te krijgen tot veel modellen in OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-07-12T09:14:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2108e1bb5b2430f42bf9e798da1d5e40448f05d396ab1710a0d6708961960756
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway routeert verzoeken naar veel modellen achter één OpenAI-compatibel eindpunt en één API-sleutel.

| Eigenschap | Waarde                             |
| ---------- | ---------------------------------- |
| Provider   | `kilocode`                         |
| Authenticatie | `KILOCODE_API_KEY`              |
| API        | OpenAI-compatibel                  |
| Basis-URL  | `https://api.kilo.ai/api/gateway/` |

## Plugin installeren

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## Instellen

<Steps>
  <Step title="Een account aanmaken">
    Ga naar [app.kilo.ai](https://app.kilo.ai), meld u aan of maak een account en genereer vervolgens een API-sleutel.
  </Step>
  <Step title="Onboarding uitvoeren">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    U kunt ook de omgevingsvariabele rechtstreeks instellen:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Controleren of het model beschikbaar is">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Standaardmodel en catalogus

Het standaardmodel is `kilocode/kilo/auto`, een slim routeringsmodel dat door de provider wordt beheerd. OpenClaw publiceert hiervoor
geen toewijzing van taken aan bovenliggende modellen; de routering achter `kilo/auto` wordt beheerd door Kilo Gateway.

Bij het opstarten bevraagt OpenClaw `GET https://api.kilo.ai/api/gateway/models` en voegt het ontdekte modellen
vóór een statische terugvalcatalogus samen. De statische terugval bevat alleen `kilocode/kilo/auto` (`Kilo Auto`,
`input: ["text", "image"]`, `reasoning: true`, `contextWindow: 1000000`, `maxTokens: 128000`).

Elk model op de Gateway is adresseerbaar als `kilocode/<upstream-id>` (bijvoorbeeld
`kilocode/anthropic/claude-sonnet-4`, `kilocode/openai/gpt-5.5`). Voer `/models kilocode` of
`openclaw models list --provider kilocode` uit om de volledige lijst met ontdekte modellen te bekijken.

## Configuratievoorbeeld

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

## Opmerkingen over het gedrag

<AccordionGroup>
  <Accordion title="Transport en compatibiliteit">
    Kilo Gateway is compatibel met OpenRouter en gebruikt daarom het proxy-achtige, OpenAI-compatibele verzoekpad
    in plaats van de systeemeigen OpenAI-verzoekstructuur (geen `store`, geen OpenAI-payload voor redeneerinspanning).

    - Door Gemini ondersteunde Kilo-verwijzingen blijven op het proxy-Gemini-pad: OpenClaw schoont daar Gemini-denkhandtekeningen
      op, maar schakelt geen systeemeigen Gemini-validatie voor herhaling of herschrijvingen voor initialisatie in.
    - Verzoeken gebruiken een Bearer-token dat is opgebouwd uit uw API-sleutel.

  </Accordion>

  <Accordion title="Streamwrapper en redenering">
    De Kilo-streamwrapper voegt een `X-KILOCODE-FEATURE`-verzoekheader toe (standaard `openclaw`,
    te overschrijven met de omgevingsvariabele `KILOCODE_FEATURE`) en normaliseert payloads voor redeneerinspanning voor
    modellen die dit ondersteunen.

    <Warning>
    Verwijzingen naar `kilocode/kilo/auto` en `x-ai/*` slaan de injectie van redeneerinspanning over. Gebruik een concrete modelverwijzing,
    zoals `kilocode/anthropic/claude-sonnet-4`, als u ondersteuning voor redenering nodig hebt.
    </Warning>

  </Accordion>

  <Accordion title="Probleemoplossing">
    - Als modeldetectie bij het opstarten mislukt, valt OpenClaw terug op de statische catalogus met `kilocode/kilo/auto`.
    - Controleer of uw API-sleutel geldig is en of de gewenste modellen voor uw Kilo-account zijn ingeschakeld.
    - Wanneer Gateway als daemon wordt uitgevoerd, moet `KILOCODE_API_KEY` beschikbaar zijn voor dat proces (bijvoorbeeld in `~/.openclaw/.env` of via `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en failovergedrag kiezen.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledige configuratiereferentie voor OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway-dashboard, API-sleutels en accountbeheer.
  </Card>
</CardGroup>
