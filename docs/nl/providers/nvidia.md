---
read_when:
    - Je wilt gratis open modellen gebruiken in OpenClaw
    - Je moet NVIDIA_API_KEY instellen
summary: Gebruik NVIDIA's OpenAI-compatibele API in OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-05-07T13:25:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8846c51b056e05f8552b3804d4dac73ff34aa874ec3d5d6fb13fad5a4112bc7f
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA biedt een OpenAI-compatibele API op `https://integrate.api.nvidia.com/v1` voor
open modellen gratis aan. Verifieer met een API-sleutel van
[build.nvidia.com](https://build.nvidia.com/settings/api-keys).

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
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
Als je `--nvidia-api-key` doorgeeft in plaats van de omgevingsvariabele, komt de waarde terecht in de shellgeschiedenis
en `ps`-uitvoer. Gebruik waar mogelijk liever de omgevingsvariabele `NVIDIA_API_KEY`.
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
      model: { primary: "nvidia/nvidia/nemotron-3-super-120b-a12b" },
    },
  },
}
```

## Ingebouwde catalogus

| Modelref                                   | Naam                         | Context | Maximale uitvoer |
| ------------------------------------------ | ---------------------------- | ------- | ---------------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144 | 8,192            |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144 | 8,192            |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608 | 8,192            |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752 | 8,192            |

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Gedrag voor automatisch inschakelen">
    De provider wordt automatisch ingeschakeld wanneer de omgevingsvariabele `NVIDIA_API_KEY` is ingesteld.
    Er is geen expliciete providerconfiguratie vereist buiten de sleutel.
  </Accordion>

  <Accordion title="Catalogus en prijzen">
    De gebundelde catalogus is statisch. Kosten staan standaard op `0` in de broncode, omdat NVIDIA
    momenteel gratis API-toegang biedt voor de vermelde modellen.
  </Accordion>

  <Accordion title="OpenAI-compatibel eindpunt">
    NVIDIA gebruikt het standaard `/v1`-completions-eindpunt. Alle OpenAI-compatibele
    tooling zou direct moeten werken met de NVIDIA-basis-URL.
  </Accordion>

  <Accordion title="Trage reacties van aangepaste providers">
    Sommige door NVIDIA gehoste aangepaste modellen kunnen langer nodig hebben dan de standaard model-idle-
    watchdog voordat ze een eerste antwoordchunk uitsturen. Verhoog voor aangepaste NVIDIA-providervermeldingen
    de provider-time-out in plaats van de runtime-time-out van de hele agent te verhogen:

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
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelrefs en failover-gedrag kiezen.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledige configuratiereferentie voor agents, modellen en providers.
  </Card>
</CardGroup>
