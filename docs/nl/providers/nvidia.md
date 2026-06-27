---
read_when:
    - Je wilt gratis open modellen gebruiken in OpenClaw
    - Je moet NVIDIA_API_KEY instellen
    - Je wilt Nemotron 3 Ultra via NVIDIA gebruiken
summary: Gebruik NVIDIA's OpenAI-compatibele API in OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-06-27T18:13:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e94b1d1ab19c6ddb6b26678d5342d55a2b9e9499f4058adbd462b15b9d9e7dd
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA biedt een OpenAI-compatibele API op `https://integrate.api.nvidia.com/v1` voor
open modellen, gratis. Verifieer met een API-sleutel van
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). OpenClaw
stelt de NVIDIA-provider standaard in op Nemotron 3 Ultra, NVIDIA's 550B totaal / 55B
actieve redeneermodel voor agentisch werk met lange context.

## Aan de slag

<Steps>
  <Step title="Haal je API-sleutel op">
    Maak een API-sleutel aan op [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Exporteer de sleutel en voer onboarding uit">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Stel een NVIDIA-model in">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

<Warning>
Als je `--nvidia-api-key` doorgeeft in plaats van de omgevingsvariabele, komt de waarde in de shell-
geschiedenis en `ps`-uitvoer terecht. Gebruik waar mogelijk liever de omgevingsvariabele
`NVIDIA_API_KEY`.
</Warning>

Voor niet-interactieve configuratie kun je de sleutel ook direct doorgeven:

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

Wanneer een NVIDIA API-sleutel is geconfigureerd, proberen de configuratie- en modelselectiepaden van OpenClaw
NVIDIA's openbare catalogus met uitgelichte modellen op te halen van
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` en
cachen ze het gerangschikte resultaat 24 uur. Nieuwe uitgelichte modellen van build.nvidia.com
verschijnen daardoor in configuratie- en modelselectieoppervlakken zonder te wachten op een
OpenClaw-release. Wanneer de live-feed beschikbaar is, is het eerste geretourneerde model
de standaardoptie die tijdens NVIDIA-configuratie wordt getoond.

De fetch gebruikt een vast HTTPS-hostbeleid voor `assets.ngc.nvidia.com`. Als er geen
NVIDIA API-sleutel is geconfigureerd, of als die openbare catalogus niet beschikbaar of
ongeldig is, valt OpenClaw terug op de meegeleverde catalogus en de meegeleverde standaard hieronder.

## Nemotron 3 Ultra

Nemotron 3 Ultra is het standaard NVIDIA-model in OpenClaw. NVIDIA's build-pagina voor
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
vermeldt het als een beschikbaar gratis endpoint met een contextspecificatie van 1M tokens.
De meegeleverde catalogus registreert een maximale uitvoer van 16.384 tokens om overeen te komen met NVIDIA's huidige
OpenAI-compatibele voorbeeldaanvraag voor het gehoste endpoint.

Gebruik Ultra voor de NVIDIA-standaard met de hoogste capaciteit. Laat Super geselecteerd wanneer
je de kleinere Nemotron 3-optie wilt, of kies een van de modellen van derden
die in NVIDIA's catalogus worden gehost wanneer hun context, latentie of gedrag beter past.
De meegeleverde Ultra-rij verzendt standaard `chat_template_kwargs.enable_thinking: false` en
`force_nonempty_content: true`, zodat normale chatuitvoer in het zichtbare
antwoord blijft in plaats van redeneringstekst bloot te leggen.

## Meegeleverde fallback-catalogus

| Modelverwijzing                            | Naam                         | Context   | Max. uitvoer | Opmerkingen                       |
| ------------------------------------------ | ---------------------------- | --------- | ------------ | --------------------------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384       | Standaard                         |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144   | 8,192        | Uitgelichte fallback              |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192        | Uitgelichte fallback              |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192        | Uitgelichte fallback              |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192        | Uitgelichte fallback              |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192        | Verouderd, upgradecompatibiliteit |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192        | Verouderd, upgradecompatibiliteit |

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Gedrag voor automatisch inschakelen">
    De provider schakelt automatisch in wanneer de omgevingsvariabele `NVIDIA_API_KEY` is ingesteld.
    Er is geen expliciete providerconfiguratie vereist naast de sleutel.
  </Accordion>

  <Accordion title="Catalogus en prijzen">
    OpenClaw geeft de voorkeur aan NVIDIA's openbare catalogus met uitgelichte modellen wanneer NVIDIA-authenticatie is
    geconfigureerd en cachet deze 24 uur. De meegeleverde fallback-catalogus is statisch
    en behoudt verouderde uitgebrachte verwijzingen voor upgradecompatibiliteit. Kosten zijn standaard
    `0` in de broncode, omdat NVIDIA momenteel gratis API-toegang biedt voor de
    vermelde modellen.
  </Accordion>

  <Accordion title="OpenAI-compatibel endpoint">
    NVIDIA gebruikt het standaard `/v1` completions-endpoint. Alle OpenAI-compatibele
    tooling zou direct moeten werken met de NVIDIA-basis-URL.
  </Accordion>

  <Accordion title="Nemotron 3 Ultra-redeneerparameters">
    NVIDIA's Ultra-voorbeeldaanvraag gebruikt `chat_template_kwargs.enable_thinking`
    en `reasoning_budget` voor redeneringsuitvoer. OpenClaw's meegeleverde Ultra-rij
    schakelt template-denken standaard uit voor normaal chatgebruik. Als je
    NVIDIA-redeneringsuitvoer wilt inschakelen of andere NVIDIA-specifieke aanvraagvelden
    wilt forceren, stel dan parameters per model in en houd providerspecifieke overschrijvingen beperkt tot
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

    `params.extra_body` is de uiteindelijke OpenAI-compatibele overschrijving van de request body, dus
    gebruik dit alleen voor velden die NVIDIA documenteert voor het geselecteerde endpoint.

  </Accordion>

  <Accordion title="Trage reacties van aangepaste providers">
    Sommige door NVIDIA gehoste aangepaste modellen kunnen er langer over doen dan de standaard idle-
    watchdog van het model voordat ze een eerste responschunk uitsturen. Verhoog voor aangepaste NVIDIA-provider-
    items de providertime-out in plaats van de time-out van de volledige agent-
    runtime te verhogen:

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
[build.nvidia.com](https://build.nvidia.com/) voor de nieuwste beschikbaarheids- en
rate-limitdetails.
</Tip>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en failovergedrag kiezen.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledige configuratiereferentie voor agents, modellen en providers.
  </Card>
</CardGroup>
