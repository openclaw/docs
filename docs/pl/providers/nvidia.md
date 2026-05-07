---
read_when:
    - Chcesz używać otwartych modeli w OpenClaw za darmo
    - Wymagana jest konfiguracja NVIDIA_API_KEY
summary: Korzystanie z interfejsu API firmy NVIDIA zgodnego z OpenAI w OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-05-07T13:24:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8846c51b056e05f8552b3804d4dac73ff34aa874ec3d5d6fb13fad5a4112bc7f
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA udostępnia API zgodne z OpenAI pod adresem `https://integrate.api.nvidia.com/v1` dla
otwartych modeli za darmo. Uwierzytelnij się kluczem API z
[build.nvidia.com](https://build.nvidia.com/settings/api-keys).

## Pierwsze kroki

<Steps>
  <Step title="Get your API key">
    Utwórz klucz API na [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
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
Jeśli przekażesz `--nvidia-api-key` zamiast zmiennej środowiskowej, wartość trafi do historii
powłoki i danych wyjściowych `ps`. Gdy to możliwe, preferuj zmienną środowiskową `NVIDIA_API_KEY`.
</Warning>

W przypadku konfiguracji nieinteraktywnej możesz też przekazać klucz bezpośrednio:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

## Przykład konfiguracji

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

## Wbudowany katalog

| Odwołanie do modelu                         | Nazwa                        | Kontekst | Maks. dane wyjściowe |
| ------------------------------------------ | ---------------------------- | ------- | ---------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144 | 8,192      |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144 | 8,192      |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608 | 8,192      |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752 | 8,192      |

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Auto-enable behavior">
    Dostawca włącza się automatycznie, gdy ustawiona jest zmienna środowiskowa `NVIDIA_API_KEY`.
    Poza kluczem nie jest wymagana żadna jawna konfiguracja dostawcy.
  </Accordion>

  <Accordion title="Catalog and pricing">
    Dołączony katalog jest statyczny. Koszty domyślnie wynoszą `0` w źródle, ponieważ NVIDIA
    obecnie oferuje bezpłatny dostęp API dla wymienionych modeli.
  </Accordion>

  <Accordion title="OpenAI-compatible endpoint">
    NVIDIA używa standardowego punktu końcowego uzupełnień `/v1`. Każde narzędzie zgodne z OpenAI
    powinno działać od razu z bazowym adresem URL NVIDIA.
  </Accordion>

  <Accordion title="Slow custom provider responses">
    Niektóre modele niestandardowe hostowane przez NVIDIA mogą potrzebować więcej czasu niż domyślny
    limit bezczynności modelu, zanim wyemitują pierwszy fragment odpowiedzi. Dla niestandardowych
    wpisów dostawcy NVIDIA zwiększ limit czasu dostawcy zamiast zwiększać limit czasu całego
    środowiska uruchomieniowego agenta:

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
Modele NVIDIA są obecnie dostępne bezpłatnie. Sprawdź
[build.nvidia.com](https://build.nvidia.com/), aby poznać najnowszą dostępność i
szczegóły limitów szybkości.
</Tip>

## Powiązane

<CardGroup cols={2}>
  <Card title="Model selection" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Configuration reference" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja konfiguracji agentów, modeli i dostawców.
  </Card>
</CardGroup>
