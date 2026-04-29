---
read_when:
    - Je wilt gratis open modellen gebruiken in OpenClaw
    - Je moet NVIDIA_API_KEY instellen
summary: Gebruik NVIDIA's OpenAI-compatibele API in OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-04-29T23:11:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 297cc25cf5235bb51f3962c2a1b8799ca6544d57e701c42e9b1e1c7d881ad32b
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA biedt een OpenAI-compatibele API op `https://integrate.api.nvidia.com/v1` voor
open modellen gratis aan. Authenticeer met een API-sleutel van
[build.nvidia.com](https://build.nvidia.com/settings/api-keys).

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
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
Als je `--nvidia-api-key` doorgeeft in plaats van de omgevingsvariabele, komt de waarde terecht in de shellgeschiedenis
en de uitvoer van `ps`. Geef waar mogelijk de voorkeur aan de omgevingsvariabele `NVIDIA_API_KEY`.
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
  <Accordion title="Auto-enable behavior">
    De provider wordt automatisch ingeschakeld wanneer de omgevingsvariabele `NVIDIA_API_KEY` is ingesteld.
    Er is geen expliciete providerconfiguratie nodig buiten de sleutel.
  </Accordion>

  <Accordion title="Catalog and pricing">
    De meegeleverde catalogus is statisch. Kosten zijn standaard `0` in de broncode, omdat NVIDIA
    momenteel gratis API-toegang biedt voor de vermelde modellen.
  </Accordion>

  <Accordion title="OpenAI-compatible endpoint">
    NVIDIA gebruikt het standaard `/v1`-completions-eindpunt. Alle OpenAI-compatibele
    tooling zou direct moeten werken met de basis-URL van NVIDIA.
  </Accordion>
</AccordionGroup>

<Tip>
NVIDIA-modellen zijn momenteel gratis te gebruiken. Raadpleeg
[build.nvidia.com](https://build.nvidia.com/) voor de nieuwste beschikbaarheid en
details over snelheidslimieten.
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
