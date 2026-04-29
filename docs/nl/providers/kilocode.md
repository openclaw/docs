---
read_when:
    - Je wilt één API-sleutel voor veel LLM's
    - Je wilt modellen via Kilo Gateway in OpenClaw uitvoeren
summary: Gebruik de uniforme API van Kilo Gateway om toegang te krijgen tot veel modellen in OpenClaw
title: Kilocode
x-i18n:
    generated_at: "2026-04-29T23:10:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: c51012b94d4b720795356b67c8482ae7ee0b37d401689e923be0b7732d77c4aa
    source_path: providers/kilocode.md
    workflow: 16
---

# Kilo Gateway

Kilo Gateway biedt een **uniforme API** die aanvragen naar veel modellen routeert achter één
eindpunt en API-sleutel. Het is OpenAI-compatibel, waardoor de meeste OpenAI-SDK's werken door de basis-URL te wijzigen.

| Eigenschap | Waarde                             |
| ---------- | ---------------------------------- |
| Provider   | `kilocode`                         |
| Auth       | `KILOCODE_API_KEY`                 |
| API        | OpenAI-compatibel                  |
| Basis-URL  | `https://api.kilo.ai/api/gateway/` |

## Aan de slag

<Steps>
  <Step title="Create an account">
    Ga naar [app.kilo.ai](https://app.kilo.ai), meld je aan of maak een account aan, ga vervolgens naar API Keys en genereer een nieuwe sleutel.
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Of stel de omgevingsvariabele direct in:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Standaardmodel

Het standaardmodel is `kilocode/kilo/auto`, een door de provider beheerd model voor slimme routering
dat door Kilo Gateway wordt beheerd.

<Note>
OpenClaw behandelt `kilocode/kilo/auto` als de stabiele standaardverwijzing, maar publiceert geen
door bronnen onderbouwde mapping van taak naar upstream-model voor die route. De exacte
upstream-routering achter `kilocode/kilo/auto` is eigendom van Kilo Gateway en is niet
hard-coded in OpenClaw.
</Note>

## Ingebouwde catalogus

OpenClaw ontdekt bij het opstarten dynamisch beschikbare modellen van de Kilo Gateway. Gebruik
`/models kilocode` om de volledige lijst met modellen te zien die beschikbaar zijn voor je account.

Elk model dat op de Gateway beschikbaar is, kan worden gebruikt met het voorvoegsel `kilocode/`:

| Modelverwijzing                       | Opmerkingen                        |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                   | Standaard — slimme routering       |
| `kilocode/anthropic/claude-sonnet-4`   | Anthropic via Kilo                 |
| `kilocode/openai/gpt-5.5`              | OpenAI via Kilo                    |
| `kilocode/google/gemini-3-pro-preview` | Google via Kilo                    |
| ...en nog veel meer                    | Gebruik `/models kilocode` om alles weer te geven |

<Tip>
Bij het opstarten bevraagt OpenClaw `GET https://api.kilo.ai/api/gateway/models` en voegt
ontdekte modellen samen vóór de statische fallback-catalogus. De meegeleverde fallback bevat altijd
`kilocode/kilo/auto` (`Kilo Auto`) met `input: ["text", "image"]`,
`reasoning: true`, `contextWindow: 1000000` en `maxTokens: 128000`.
</Tip>

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

<AccordionGroup>
  <Accordion title="Transport and compatibility">
    Kilo Gateway is in de bron gedocumenteerd als OpenRouter-compatibel, waardoor het op
    het proxy-achtige OpenAI-compatibele pad blijft in plaats van native OpenAI-aanvraagvorming te gebruiken.

    - Door Gemini ondersteunde Kilo-verwijzingen blijven op het proxy-Gemini-pad, zodat OpenClaw daar
      sanering van Gemini-denkhandtekeningen behoudt zonder native Gemini-
      replayvalidatie of bootstrap-herschrijvingen in te schakelen.
    - Kilo Gateway gebruikt onder de motorkap een Bearer-token met je API-sleutel.

  </Accordion>

  <Accordion title="Stream wrapper and reasoning">
    Kilo's gedeelde streamwrapper voegt de provider-appheader toe en normaliseert
    proxy-redeneringspayloads voor ondersteunde concrete modelverwijzingen.

    <Warning>
    `kilocode/kilo/auto` en andere hints zonder ondersteuning voor proxy-redenering slaan redeneringsinjectie over.
    Als je ondersteuning voor redenering nodig hebt, gebruik dan een concrete modelverwijzing zoals
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Troubleshooting">
    - Als modelontdekking bij het opstarten mislukt, valt OpenClaw terug op de meegeleverde statische catalogus met `kilocode/kilo/auto`.
    - Controleer of je API-sleutel geldig is en of je Kilo-account de gewenste modellen heeft ingeschakeld.
    - Wanneer de Gateway als daemon draait, zorg er dan voor dat `KILOCODE_API_KEY` beschikbaar is voor dat proces (bijvoorbeeld in `~/.openclaw/.env` of via `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Model selection" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en failovergedrag kiezen.
  </Card>
  <Card title="Configuration reference" href="/nl/gateway/configuration-reference" icon="gear">
    Volledige OpenClaw-configuratiereferentie.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway-dashboard, API-sleutels en accountbeheer.
  </Card>
</CardGroup>
