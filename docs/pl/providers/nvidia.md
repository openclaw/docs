---
read_when:
    - Chcesz bezpłatnie korzystać z otwartych modeli w OpenClaw
    - Musisz skonfigurować NVIDIA_API_KEY
summary: Użyj API NVIDIA zgodnego z OpenAI w OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-04-30T10:14:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 297cc25cf5235bb51f3962c2a1b8799ca6544d57e701c42e9b1e1c7d881ad32b
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA udostępnia API zgodne z OpenAI pod adresem `https://integrate.api.nvidia.com/v1` dla
otwartych modeli bezpłatnie. Uwierzytelnij się kluczem API z
[build.nvidia.com](https://build.nvidia.com/settings/api-keys).

## Pierwsze kroki

<Steps>
  <Step title="Uzyskaj klucz API">
    Utwórz klucz API na [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Wyeksportuj klucz i uruchom onboarding">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Ustaw model NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
Jeśli przekażesz `--nvidia-api-key` zamiast zmiennej środowiskowej, wartość trafi do historii
powłoki i wyniku `ps`. Gdy to możliwe, preferuj zmienną środowiskową `NVIDIA_API_KEY`.
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
| ------------------------------------------ | ---------------------------- | -------- | -------------------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144  | 8,192                |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144  | 8,192                |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608  | 8,192                |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752  | 8,192                |

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Zachowanie automatycznego włączania">
    Dostawca włącza się automatycznie, gdy ustawiona jest zmienna środowiskowa `NVIDIA_API_KEY`.
    Poza kluczem nie jest wymagana żadna jawna konfiguracja dostawcy.
  </Accordion>

  <Accordion title="Katalog i ceny">
    Dołączony katalog jest statyczny. Koszty domyślnie wynoszą `0` w źródle, ponieważ NVIDIA
    obecnie oferuje bezpłatny dostęp API dla wymienionych modeli.
  </Accordion>

  <Accordion title="Endpoint zgodny z OpenAI">
    NVIDIA używa standardowego endpointu uzupełnień `/v1`. Każde narzędzie zgodne z OpenAI
    powinno działać od razu z bazowym URL NVIDIA.
  </Accordion>
</AccordionGroup>

<Tip>
Modele NVIDIA są obecnie bezpłatne w użyciu. Sprawdź
[build.nvidia.com](https://build.nvidia.com/) pod kątem najnowszej dostępności i
szczegółów limitów szybkości.
</Tip>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja konfiguracji agentów, modeli i dostawców.
  </Card>
</CardGroup>
