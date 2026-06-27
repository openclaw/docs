---
read_when:
    - Chcesz bezpłatnie używać otwartych modeli w OpenClaw
    - Potrzebujesz konfiguracji NVIDIA_API_KEY
    - Chcesz używać Nemotron 3 Ultra przez NVIDIA
summary: Korzystanie z interfejsu API NVIDIA zgodnego z OpenAI w OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-06-27T18:13:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e94b1d1ab19c6ddb6b26678d5342d55a2b9e9499f4058adbd462b15b9d9e7dd
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA udostępnia API zgodne z OpenAI pod adresem `https://integrate.api.nvidia.com/v1` dla
otwartych modeli za darmo. Uwierzytelnij się kluczem API z
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). OpenClaw
domyślnie ustawia dostawcę NVIDIA na Nemotron 3 Ultra, model rozumowania NVIDIA
o łącznej liczbie 550B parametrów / 55B aktywnych parametrów do agentowej pracy
z długim kontekstem.

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
Jeśli przekażesz `--nvidia-api-key` zamiast zmiennej środowiskowej, wartość trafi do historii powłoki
i wyjścia `ps`. Gdy to możliwe, preferuj zmienną środowiskową `NVIDIA_API_KEY`.
</Warning>

W konfiguracji nieinteraktywnej możesz też przekazać klucz bezpośrednio:

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

## Wyróżniony katalog

Gdy skonfigurowany jest klucz API NVIDIA, ścieżki konfiguracji OpenClaw i wyboru modelu
próbują użyć publicznego katalogu wyróżnionych modeli NVIDIA z
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` i
buforują wynik rankingu przez 24 godziny. Nowe wyróżnione modele z build.nvidia.com
pojawiają się więc w konfiguracji i powierzchniach wyboru modelu bez czekania na
wydanie OpenClaw. Gdy kanał na żywo jest dostępny, pierwszy zwrócony model jest
domyślną opcją pokazywaną podczas konfiguracji NVIDIA.

Pobieranie używa stałej polityki hosta HTTPS dla `assets.ngc.nvidia.com`. Jeśli nie
skonfigurowano klucza API NVIDIA albo jeśli ten publiczny katalog jest niedostępny lub
ma nieprawidłową postać, OpenClaw wraca do dołączonego katalogu i dołączonej wartości domyślnej poniżej.

## Nemotron 3 Ultra

Nemotron 3 Ultra jest domyślnym modelem NVIDIA w OpenClaw. Strona build NVIDIA dla
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
wymienia go jako dostępny darmowy endpoint ze specyfikacją kontekstu 1M tokenów.
Dołączony katalog zapisuje maksymalne wyjście 16 384 tokenów, aby odpowiadało bieżącemu
przykładowemu żądaniu zgodnemu z OpenAI od NVIDIA dla hostowanego endpointu.

Użyj Ultra jako domyślnego modelu NVIDIA o najwyższych możliwościach. Pozostaw Super wybrany, gdy
chcesz mniejszą opcję Nemotron 3, albo wybierz jeden z modeli firm trzecich
hostowanych w katalogu NVIDIA, gdy ich kontekst, opóźnienie lub zachowanie lepiej pasują.
Dołączony wiersz Ultra domyślnie wysyła `chat_template_kwargs.enable_thinking: false` oraz
`force_nonempty_content: true`, aby zwykłe wyjście czatu pozostawało w
widocznej odpowiedzi zamiast ujawniać tekst rozumowania.

## Dołączony katalog awaryjny

| Ref modelu                                  | Nazwa                        | Kontekst  | Maks. wyjście | Uwagi                              |
| ------------------------------------------ | ---------------------------- | --------- | ------------- | ---------------------------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384        | Domyślny                           |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144   | 8,192         | Wyróżniona opcja awaryjna          |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192         | Wyróżniona opcja awaryjna          |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192         | Wyróżniona opcja awaryjna          |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192         | Wyróżniona opcja awaryjna          |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192         | Przestarzały, zgodność aktualizacji |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192         | Przestarzały, zgodność aktualizacji |

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Zachowanie automatycznego włączania">
    Dostawca włącza się automatycznie, gdy ustawiona jest zmienna środowiskowa `NVIDIA_API_KEY`.
    Poza kluczem nie jest wymagana jawna konfiguracja dostawcy.
  </Accordion>

  <Accordion title="Katalog i ceny">
    OpenClaw preferuje publiczny katalog wyróżnionych modeli NVIDIA, gdy uwierzytelnianie NVIDIA jest
    skonfigurowane, i buforuje go przez 24 godziny. Dołączony katalog awaryjny jest statyczny
    i zachowuje przestarzałe wydane refy na potrzeby zgodności aktualizacji. Koszty domyślnie
    wynoszą `0` w źródle, ponieważ NVIDIA obecnie oferuje darmowy dostęp API do
    wymienionych modeli.
  </Accordion>

  <Accordion title="Endpoint zgodny z OpenAI">
    NVIDIA używa standardowego endpointu completions `/v1`. Każde narzędzie zgodne z OpenAI
    powinno działać od razu z bazowym adresem URL NVIDIA.
  </Accordion>

  <Accordion title="Parametry rozumowania Nemotron 3 Ultra">
    Przykładowe żądanie Ultra od NVIDIA używa `chat_template_kwargs.enable_thinking`
    i `reasoning_budget` dla wyjścia rozumowania. Dołączony wiersz Ultra w OpenClaw
    domyślnie wyłącza rozumowanie szablonu dla zwykłego użycia czatu. Jeśli musisz
    włączyć wyjście rozumowania NVIDIA albo wymusić inne pola żądania specyficzne dla NVIDIA,
    ustaw parametry dla modelu i ogranicz nadpisania specyficzne dla dostawcy do
    modelu NVIDIA:

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

    `params.extra_body` jest końcowym nadpisaniem treści żądania zgodnym z OpenAI, więc
    używaj go tylko dla pól udokumentowanych przez NVIDIA dla wybranego endpointu.

  </Accordion>

  <Accordion title="Wolne odpowiedzi niestandardowego dostawcy">
    Niektóre niestandardowe modele hostowane przez NVIDIA mogą potrzebować więcej czasu niż domyślny
    watchdog bezczynności modelu, zanim wyemitują pierwszy fragment odpowiedzi. Dla niestandardowych wpisów dostawcy NVIDIA
    zwiększ limit czasu dostawcy zamiast zwiększać limit czasu całego środowiska uruchomieniowego agenta:

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
    Wybieranie dostawców, refów modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja konfiguracji agentów, modeli i dostawców.
  </Card>
</CardGroup>
