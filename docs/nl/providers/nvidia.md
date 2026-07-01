---
read_when:
    - Je wilt gratis open modellen gebruiken in OpenClaw
    - Je moet NVIDIA_API_KEY instellen
    - Je wilt Nemotron 3 Ultra gebruiken via NVIDIA
summary: De OpenAI-compatibele API van NVIDIA gebruiken in OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-07-01T20:28:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b738746acead8dcaa74a39b13b4413171c5bf60efa5166dbc9b259d883a4e22
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA biedt een OpenAI-compatibele API op `https://integrate.api.nvidia.com/v1` voor
open modellen gratis aan. Authenticeer met een API-sleutel van
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). OpenClaw
stelt de NVIDIA-provider standaard in op Nemotron 3 Ultra, NVIDIA's 550B totaal / 55B
actieve redeneermodel voor agentisch werk met lange context.

## Aan de slag

<Steps>
  <Step title="Get your API key">
    Maak een API-sleutel aan op [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Export the key and run onboarding">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Set an NVIDIA model">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

<Warning>
Als je `--nvidia-api-key` doorgeeft in plaats van de env-var, komt de waarde in de shellgeschiedenis
en `ps`-uitvoer terecht. Geef waar mogelijk de voorkeur aan de omgevingsvariabele `NVIDIA_API_KEY`.
</Warning>

Voor niet-interactieve configuratie kun je de sleutel ook rechtstreeks doorgeven:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

## Configuratievoorbeeld

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-ultra-550b-a55b" },
    },
  },
}
```

## Uitgelichte catalogus

Wanneer een NVIDIA API-sleutel is geconfigureerd, proberen OpenClaw-configuratie- en modelselectiepaden
NVIDIA's openbare catalogus met uitgelichte modellen op te halen van
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` en
cachen ze het gerangschikte resultaat 24 uur. Nieuwe uitgelichte modellen van build.nvidia.com
verschijnen daardoor in configuratie- en modelselectieoppervlakken zonder te wachten op een
OpenClaw-release. Wanneer de live feed beschikbaar is, is het eerste geretourneerde model
de standaardoptie die tijdens NVIDIA-configuratie wordt getoond.

De fetch gebruikt een vast HTTPS-hostbeleid voor `assets.ngc.nvidia.com`. Als er geen
NVIDIA API-sleutel is geconfigureerd, of als die openbare catalogus niet beschikbaar of
ongeldig gevormd is, valt OpenClaw terug op de gebundelde catalogus en de gebundelde standaard hieronder.

## Nemotron 3 Ultra

Nemotron 3 Ultra is het standaard NVIDIA-model in OpenClaw. NVIDIA's build-pagina voor
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
vermeldt het als een beschikbaar gratis endpoint met een contextspecificatie van 1 miljoen tokens.
De gebundelde catalogus registreert een maximale uitvoer van 16.384 tokens om overeen te komen met NVIDIA's huidige
OpenAI-compatibele voorbeeldaanvraag voor het gehoste endpoint.

Gebruik Ultra voor de NVIDIA-standaard met de hoogste capaciteit. Houd Super geselecteerd wanneer
je de kleinere Nemotron 3-optie wilt, of kies een van de modellen van derden
die in NVIDIA's catalogus worden gehost wanneer hun context, latency of gedrag beter past.
De gebundelde Ultra-rij verzendt standaard `chat_template_kwargs.enable_thinking: false` en
`force_nonempty_content: true`, zodat normale chatuitvoer in het
zichtbare antwoord blijft in plaats van redeneertekst bloot te leggen.

## Gebundelde fallbackcatalogus

| Modelref                                   | Naam                         | Context   | Max. uitvoer | Notities                           |
| ------------------------------------------ | ---------------------------- | --------- | ------------ | ---------------------------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384       | Standaard                          |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 1,048,576 | 8,192        | Uitgelichte fallback               |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192        | Uitgelichte fallback               |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192        | Uitgelichte fallback               |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192        | Uitgelichte fallback               |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192        | Verouderd, upgradecompatibiliteit  |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192        | Verouderd, upgradecompatibiliteit  |

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Auto-enable behavior">
    De provider wordt automatisch ingeschakeld wanneer de omgevingsvariabele `NVIDIA_API_KEY` is ingesteld.
    Er is naast de sleutel geen expliciete providerconfiguratie vereist.
  </Accordion>

  <Accordion title="Catalog and pricing">
    OpenClaw geeft de voorkeur aan NVIDIA's openbare catalogus met uitgelichte modellen wanneer NVIDIA-authenticatie is
    geconfigureerd en cachet deze 24 uur. De gebundelde fallbackcatalogus is statisch
    en behoudt verouderde verzonden refs voor upgradecompatibiliteit. Kosten zijn standaard
    `0` in de broncode, omdat NVIDIA momenteel gratis API-toegang biedt voor de
    vermelde modellen.
  </Accordion>

  <Accordion title="OpenAI-compatible endpoint">
    NVIDIA gebruikt het standaard `/v1` completions-endpoint. Alle OpenAI-compatibele
    tooling zou direct moeten werken met de NVIDIA-basis-URL.
  </Accordion>

  <Accordion title="Nemotron 3 Ultra reasoning params">
    NVIDIA's Ultra-voorbeeldaanvraag gebruikt `chat_template_kwargs.enable_thinking`
    en `reasoning_budget` voor redeneeruitvoer. OpenClaw's gebundelde Ultra-rij
    schakelt template-denken standaard uit voor normaal chatgebruik. Als je je wilt
    aanmelden voor NVIDIA-redeneeruitvoer of andere NVIDIA-specifieke aanvraagvelden wilt
    afdwingen, stel dan parameters per model in en houd providerspecifieke overrides beperkt tot
    het NVIDIA-model:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "nvidia/nvidia/nemotron-3-ultra-550b-a55b": {
              params: {
                chat_template_kwargs: { enable_thinking: true },
                extra_body: { reasoning_budget: 16384 },
              },
            },
          },
        },
      },
    }
    ```

    `params.extra_body` is de uiteindelijke OpenAI-compatibele request-body-override, dus
    gebruik deze alleen voor velden die NVIDIA documenteert voor het geselecteerde endpoint.

  </Accordion>

  <Accordion title="Slow custom provider responses">
    Sommige door NVIDIA gehoste aangepaste modellen kunnen langer duren dan de standaard idle-watchdog
    van het model voordat ze een eerste responschunk uitsturen. Verhoog voor aangepaste NVIDIA-provideritems
    de providertime-out in plaats van de time-out van de volledige agent-runtime te verhogen:

    ```json5
    {
      models: {
        providers: {
          "custom-integrate-api-nvidia-com": {
            baseUrl: "https://integrate.api.nvidia.com/v1",
            api: "openai-completions",
            apiKey: "NVIDIA_API_KEY",
            timeoutSeconds: 300,
          },
        },
      },
      agents: {
        defaults: {
          models: {
            "custom-integrate-api-nvidia-com/meta/llama-3.1-70b-instruct": {
              params: { thinking: "off" },
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

<Tip>
NVIDIA-modellen zijn momenteel gratis te gebruiken. Controleer
[build.nvidia.com](https://build.nvidia.com/) voor de nieuwste beschikbaarheid en
details over rate limits.
</Tip>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Model selection" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelrefs en failovergedrag kiezen.
  </Card>
  <Card title="Configuration reference" href="/nl/gateway/configuration-reference" icon="gear">
    Volledige configuratiereferentie voor agents, modellen en providers.
  </Card>
</CardGroup>
