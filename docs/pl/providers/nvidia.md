---
read_when:
    - Chcesz używać otwartych modeli w OpenClaw za darmo
    - Potrzebujesz konfiguracji `NVIDIA_API_KEY`
summary: Używanie zgodnego z OpenAI API NVIDIA w OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-04-24T09:28:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2d056be5be012be537ba5c4d5812ea15ec440e5a552b235854e2078064376192
    source_path: providers/nvidia.md
    workflow: 15
---

NVIDIA udostępnia zgodne z OpenAI API pod adresem `https://integrate.api.nvidia.com/v1` dla
otwartych modeli za darmo. Uwierzytelniaj się kluczem API z
[build.nvidia.com](https://build.nvidia.com/settings/api-keys).

## Pierwsze kroki

<Steps>
  <Step title="Pobierz klucz API">
    Utwórz klucz API na [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Wyeksportuj klucz i uruchom onboarding">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice skip
    ```
  </Step>
  <Step title="Ustaw model NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
Jeśli przekażesz `--token` zamiast zmiennej env, wartość trafi do historii powłoki i
danych wyjściowych `ps`. Jeśli to możliwe, preferuj zmienną środowiskową `NVIDIA_API_KEY`.
</Warning>

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

| Referencja modelu                         | Nazwa                        | Kontekst | Maks. wyjście |
| ----------------------------------------- | ---------------------------- | -------- | ------------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144  | 8,192         |
| `nvidia/moonshotai/kimi-k2.5`             | Kimi K2.5                    | 262,144  | 8,192         |
| `nvidia/minimaxai/minimax-m2.5`           | Minimax M2.5                 | 196,608  | 8,192         |
| `nvidia/z-ai/glm5`                        | GLM 5                        | 202,752  | 8,192         |

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Zachowanie automatycznego włączania">
    Dostawca włącza się automatycznie, gdy ustawiona jest zmienna środowiskowa `NVIDIA_API_KEY`.
    Poza kluczem nie jest wymagana jawna konfiguracja dostawcy.
  </Accordion>

  <Accordion title="Katalog i ceny">
    Dołączony katalog jest statyczny. Koszty mają domyślnie wartość `0` w źródle, ponieważ NVIDIA
    obecnie oferuje darmowy dostęp do API dla wymienionych modeli.
  </Accordion>

  <Accordion title="Endpoint zgodny z OpenAI">
    NVIDIA używa standardowego endpointu `/v1` completions. Każde narzędzie
    zgodne z OpenAI powinno działać od razu z bazowym URL NVIDIA.
  </Accordion>
</AccordionGroup>

<Tip>
Modele NVIDIA są obecnie darmowe. Sprawdź
[build.nvidia.com](https://build.nvidia.com/), aby poznać najnowszą dostępność i
szczegóły limitów szybkości.
</Tip>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modeli" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, referencji modeli i zachowania failover.
  </Card>
  <Card title="Dokumentacja referencyjna konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja referencyjna konfiguracji agentów, modeli i dostawców.
  </Card>
</CardGroup>
