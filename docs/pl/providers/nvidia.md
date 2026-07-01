---
read_when:
    - Chcesz bezpłatnie używać otwartych modeli w OpenClaw
    - Musisz skonfigurować NVIDIA_API_KEY
    - Chcesz używać Nemotron 3 Ultra przez NVIDIA
summary: Używanie zgodnego z OpenAI API NVIDIA w OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-07-01T20:37:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b738746acead8dcaa74a39b13b4413171c5bf60efa5166dbc9b259d883a4e22
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA udostępnia API zgodne z OpenAI pod adresem `https://integrate.api.nvidia.com/v1` dla
otwartych modeli za darmo. Uwierzytelnij się kluczem API z
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). OpenClaw
domyślnie ustawia dostawcę NVIDIA na Nemotron 3 Ultra, model rozumowania NVIDIA
o 550B łącznie / 55B aktywnych parametrów, przeznaczony do długokontekstowej
pracy agentowej.

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
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

<Warning>
Jeśli przekażesz `--nvidia-api-key` zamiast zmiennej środowiskowej, wartość trafi
do historii powłoki i wyniku `ps`. Gdy to możliwe, preferuj zmienną środowiskową
`NVIDIA_API_KEY`.
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
      model: { primary: "nvidia/nvidia/nemotron-3-ultra-550b-a55b" },
    },
  },
}
```

## Katalog wyróżnionych modeli

Gdy skonfigurowany jest klucz API NVIDIA, ścieżki konfiguracji OpenClaw i wyboru
modelu próbują użyć publicznego katalogu wyróżnionych modeli NVIDIA z
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` i
buforują rankingowy wynik przez 24 godziny. Dzięki temu nowe wyróżnione modele z
build.nvidia.com pojawiają się w powierzchniach konfiguracji i wyboru modelu bez
czekania na wydanie OpenClaw. Gdy kanał na żywo jest dostępny, pierwszy zwrócony
model jest domyślną opcją pokazywaną podczas konfiguracji NVIDIA.

Pobieranie używa stałej polityki hosta HTTPS dla `assets.ngc.nvidia.com`. Jeśli
nie skonfigurowano klucza API NVIDIA albo jeśli ten publiczny katalog jest
niedostępny lub nieprawidłowo sformatowany, OpenClaw wraca do dołączonego
katalogu i dołączonej wartości domyślnej poniżej.

## Nemotron 3 Ultra

Nemotron 3 Ultra jest domyślnym modelem NVIDIA w OpenClaw. Strona build NVIDIA dla
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
wymienia go jako dostępny darmowy endpoint ze specyfikacją kontekstu 1M tokenów.
Dołączony katalog zapisuje maksymalne wyjście 16 384 tokenów, aby odpowiadać
bieżącemu przykładowemu żądaniu NVIDIA zgodnemu z OpenAI dla hostowanego
endpointu.

Użyj Ultra jako domyślnej opcji NVIDIA o najwyższych możliwościach. Pozostaw
wybrany Super, gdy chcesz mniejszą opcję Nemotron 3, albo wybierz jeden z modeli
firm trzecich hostowanych w katalogu NVIDIA, gdy ich kontekst, opóźnienie lub
zachowanie pasują lepiej. Dołączony wiersz Ultra domyślnie wysyła
`chat_template_kwargs.enable_thinking: false` i `force_nonempty_content: true`,
aby zwykłe wyjście czatu pozostawało w widocznej odpowiedzi zamiast ujawniać
tekst rozumowania.

## Dołączony katalog awaryjny

| Odwołanie do modelu                         | Nazwa                        | Kontekst  | Maks. wyjście | Uwagi                                |
| ------------------------------------------ | ---------------------------- | --------- | ------------- | ------------------------------------ |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384        | Domyślny                             |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 1,048,576 | 8,192         | Wyróżniona opcja awaryjna            |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192         | Wyróżniona opcja awaryjna            |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192         | Wyróżniona opcja awaryjna            |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192         | Wyróżniona opcja awaryjna            |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192         | Przestarzały, zgodność aktualizacji  |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192         | Przestarzały, zgodność aktualizacji  |

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Zachowanie automatycznego włączania">
    Dostawca włącza się automatycznie, gdy ustawiona jest zmienna środowiskowa `NVIDIA_API_KEY`.
    Poza kluczem nie jest wymagana jawna konfiguracja dostawcy.
  </Accordion>

  <Accordion title="Katalog i ceny">
    OpenClaw preferuje publiczny katalog wyróżnionych modeli NVIDIA, gdy
    skonfigurowane jest uwierzytelnianie NVIDIA, i buforuje go przez 24 godziny.
    Dołączony katalog awaryjny jest statyczny i zachowuje przestarzałe wysłane
    odwołania ze względu na zgodność aktualizacji. Koszty domyślnie wynoszą `0`
    w źródle, ponieważ NVIDIA obecnie oferuje darmowy dostęp API do wymienionych
    modeli.
  </Accordion>

  <Accordion title="Endpoint zgodny z OpenAI">
    NVIDIA używa standardowego endpointu uzupełnień `/v1`. Każde narzędzie zgodne
    z OpenAI powinno działać od razu z bazowym adresem URL NVIDIA.
  </Accordion>

  <Accordion title="Parametry rozumowania Nemotron 3 Ultra">
    Przykładowe żądanie Ultra od NVIDIA używa `chat_template_kwargs.enable_thinking`
    i `reasoning_budget` dla wyjścia rozumowania. Dołączony wiersz Ultra w
    OpenClaw domyślnie wyłącza myślenie szablonu na potrzeby zwykłego czatu. Jeśli
    musisz włączyć wyjście rozumowania NVIDIA albo wymusić inne pola żądania
    specyficzne dla NVIDIA, ustaw parametry dla modelu i ogranicz nadpisania
    specyficzne dla dostawcy do modelu NVIDIA:

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

    `params.extra_body` jest końcowym nadpisaniem treści żądania zgodnego z OpenAI,
    więc używaj go tylko dla pól dokumentowanych przez NVIDIA dla wybranego
    endpointu.

  </Accordion>

  <Accordion title="Wolne odpowiedzi niestandardowego dostawcy">
    Niektóre niestandardowe modele hostowane przez NVIDIA mogą potrzebować więcej
    czasu niż domyślny watchdog bezczynności modelu, zanim wyemitują pierwszy
    fragment odpowiedzi. W przypadku niestandardowych wpisów dostawcy NVIDIA
    zwiększ limit czasu dostawcy zamiast zwiększać limit czasu całego środowiska
    uruchomieniowego agenta:

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
Modele NVIDIA są obecnie darmowe w użyciu. Sprawdź
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
