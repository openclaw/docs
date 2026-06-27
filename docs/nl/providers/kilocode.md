---
read_when:
    - Je wilt één API-sleutel voor veel LLM's
    - Je wilt modellen uitvoeren via Kilo Gateway in OpenClaw
summary: Gebruik de uniforme API van Kilo Gateway om toegang te krijgen tot veel modellen in OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-06-27T18:12:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be06295295b63ce9b9d00d6f3d73e132c805237fde056eac4619616bf992e803
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway biedt een **uniforme API** die aanvragen naar veel modellen routeert achter één
eindpunt en één API-sleutel. Het is OpenAI-compatibel, dus de meeste OpenAI-SDK's werken door de basis-URL te wijzigen.

| Eigenschap | Waarde                             |
| ---------- | ---------------------------------- |
| Provider   | `kilocode`                         |
| Auth       | `KILOCODE_API_KEY`                 |
| API        | OpenAI-compatibel                  |
| Basis-URL  | `https://api.kilo.ai/api/gateway/` |

## Plugin installeren

Installeer de officiële Plugin en herstart daarna Gateway:

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## Aan de slag

<Steps>
  <Step title="Maak een account aan">
    Ga naar [app.kilo.ai](https://app.kilo.ai), meld je aan of maak een account aan, ga daarna naar API Keys en genereer een nieuwe sleutel.
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

Het standaardmodel is `kilocode/kilo/auto`, een door de provider beheerd smart-routing
model dat door Kilo Gateway wordt beheerd.

<Note>
OpenClaw behandelt `kilocode/kilo/auto` als de stabiele standaardreferentie, maar publiceert geen
door bronnen onderbouwde taak-naar-upstream-model-koppeling voor die route. De exacte
upstream-routering achter `kilocode/kilo/auto` is eigendom van Kilo Gateway en is niet
hardcoded in OpenClaw.
</Note>

## Ingebouwde catalogus

OpenClaw ontdekt bij het opstarten dynamisch beschikbare modellen vanuit de Kilo Gateway. Gebruik
`/models kilocode` om de volledige lijst met modellen te zien die beschikbaar zijn voor je account.

Elk model dat beschikbaar is op de gateway kan worden gebruikt met het voorvoegsel `kilocode/`:

| Modelreferentie                         | Opmerkingen                        |
| --------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                    | Standaard — smart routing          |
| `kilocode/anthropic/claude-sonnet-4`    | Anthropic via Kilo                 |
| `kilocode/openai/gpt-5.5`               | OpenAI via Kilo                    |
| `kilocode/google/gemini-3.1-pro-preview` | Google via Kilo                   |
| ...en nog veel meer                     | Gebruik `/models kilocode` om alles weer te geven |

<Tip>
Bij het opstarten vraagt OpenClaw `GET https://api.kilo.ai/api/gateway/models` op en voegt
ontdekte modellen vóór de statische fallback-catalogus samen. De statische fallback bevat altijd
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
    Kilo Gateway is in de bron gedocumenteerd als OpenRouter-compatibel, dus het blijft op
    het proxy-achtige OpenAI-compatibele pad in plaats van native OpenAI-aanvraagvorming.

    - Door Gemini ondersteunde Kilo-referenties blijven op het proxy-Gemini-pad, dus OpenClaw behoudt
      daar Gemini thought-signature-sanitatie zonder native Gemini
      replay-validatie of bootstrap-herschrijvingen in te schakelen.
    - Kilo Gateway gebruikt onder de motorkap een Bearer-token met je API-sleutel.

  </Accordion>

  <Accordion title="Stream-wrapper en redeneren">
    Kilo's gedeelde stream-wrapper voegt de provider-appheader toe en normaliseert
    proxy-reasoning-payloads voor ondersteunde concrete modelreferenties.

    <Warning>
    `kilocode/kilo/auto` en andere hints zonder ondersteuning voor proxy-reasoning slaan reasoning-
    injectie over. Als je reasoning-ondersteuning nodig hebt, gebruik dan een concrete modelreferentie zoals
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Problemen oplossen">
    - Als modeldetectie bij het opstarten mislukt, valt OpenClaw terug op de statische catalogus met `kilocode/kilo/auto`.
    - Controleer of je API-sleutel geldig is en of je Kilo-account de gewenste modellen heeft ingeschakeld.
    - Wanneer de Gateway als daemon draait, zorg er dan voor dat `KILOCODE_API_KEY` beschikbaar is voor dat proces (bijvoorbeeld in `~/.openclaw/.env` of via `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failovergedrag kiezen.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledige OpenClaw-configuratiereferentie.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway-dashboard, API-sleutels en accountbeheer.
  </Card>
</CardGroup>
