---
read_when:
    - Je wilt één API-sleutel voor veel LLM's
    - Je wilt modellen uitvoeren via Kilo Gateway in OpenClaw
summary: Gebruik de uniforme API van Kilo Gateway om toegang te krijgen tot veel modellen in OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-05-06T17:59:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6105f5aafa0a36de2b140909e8dd21234aa8284259367a49c67d7040eaa0a93c
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway biedt een **uniforme API** die verzoeken naar veel modellen routeert achter één
endpoint en API-sleutel. De API is OpenAI-compatibel, dus de meeste OpenAI SDK's werken door de basis-URL te wijzigen.

| Eigenschap | Waarde                             |
| ---------- | ---------------------------------- |
| Provider   | `kilocode`                         |
| Auth       | `KILOCODE_API_KEY`                 |
| API        | OpenAI-compatibel                  |
| Basis-URL  | `https://api.kilo.ai/api/gateway/` |

## Aan de slag

<Steps>
  <Step title="Maak een account">
    Ga naar [app.kilo.ai](https://app.kilo.ai), meld je aan of maak een account en navigeer vervolgens naar API-sleutels om een nieuwe sleutel te genereren.
  </Step>
  <Step title="Voer onboarding uit">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Of stel de omgevingsvariabele rechtstreeks in:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Controleer of het model beschikbaar is">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Standaardmodel

Het standaardmodel is `kilocode/kilo/auto`, een door de provider beheerd model voor slimme routering
dat wordt beheerd door Kilo Gateway.

<Note>
OpenClaw behandelt `kilocode/kilo/auto` als de stabiele standaardreferentie, maar publiceert geen
op bronnen gebaseerde taak-naar-upstream-modeltoewijzing voor die route. De exacte
upstream-routering achter `kilocode/kilo/auto` is eigendom van Kilo Gateway en is niet
hardgecodeerd in OpenClaw.
</Note>

## Ingebouwde catalogus

OpenClaw ontdekt beschikbare modellen dynamisch vanuit de Kilo Gateway bij het opstarten. Gebruik
`/models kilocode` om de volledige lijst met modellen te zien die beschikbaar zijn voor je account.

Elk model dat beschikbaar is op de Gateway kan worden gebruikt met het voorvoegsel `kilocode/`:

| Modelreferentie                       | Opmerkingen                        |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                   | Standaard — slimme routering       |
| `kilocode/anthropic/claude-sonnet-4`   | Anthropic via Kilo                 |
| `kilocode/openai/gpt-5.5`              | OpenAI via Kilo                    |
| `kilocode/google/gemini-3-pro-preview` | Google via Kilo                    |
| ...en nog veel meer                    | Gebruik `/models kilocode` om alles te tonen |

<Tip>
Bij het opstarten voert OpenClaw een query uit naar `GET https://api.kilo.ai/api/gateway/models` en voegt
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
  <Accordion title="Transport en compatibiliteit">
    Kilo Gateway is in de bron gedocumenteerd als OpenRouter-compatibel, dus blijft deze op
    het proxy-achtige OpenAI-compatibele pad in plaats van native OpenAI-verzoekvorming.

    - Door Gemini ondersteunde Kilo-referenties blijven op het proxy-Gemini-pad, zodat OpenClaw daar
      Gemini-denkhandtekeningopschoning behoudt zonder native Gemini
      replay-validatie of bootstrap-herschrijvingen in te schakelen.
    - Kilo Gateway gebruikt onder de motorkap een Bearer-token met je API-sleutel.

  </Accordion>

  <Accordion title="Stream-wrapper en redeneren">
    De gedeelde stream-wrapper van Kilo voegt de provider-app-header toe en normaliseert
    proxy-redeneringspayloads voor ondersteunde concrete modelreferenties.

    <Warning>
    `kilocode/kilo/auto` en andere hints zonder ondersteuning voor proxy-redenering slaan redeneringsinjectie
    over. Als je ondersteuning voor redeneren nodig hebt, gebruik dan een concrete modelreferentie zoals
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Probleemoplossing">
    - Als modelontdekking bij het opstarten mislukt, valt OpenClaw terug op de meegeleverde statische catalogus met `kilocode/kilo/auto`.
    - Controleer of je API-sleutel geldig is en of je Kilo-account de gewenste modellen heeft ingeschakeld.
    - Wanneer de Gateway als daemon draait, zorg er dan voor dat `KILOCODE_API_KEY` beschikbaar is voor dat proces (bijvoorbeeld in `~/.openclaw/.env` of via `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failover-gedrag kiezen.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledige OpenClaw-configuratiereferentie.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway-dashboard, API-sleutels en accountbeheer.
  </Card>
</CardGroup>
