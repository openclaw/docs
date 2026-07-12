---
read_when:
    - Chcesz bezpłatnie korzystać z otwartych modeli w OpenClaw
    - Musisz skonfigurować NVIDIA_API_KEY
    - Chcesz korzystać z Nemotron 3 Ultra za pośrednictwem NVIDIA
summary: Używaj interfejsu API firmy NVIDIA zgodnego z OpenAI w OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-07-12T15:30:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5ac7bcc19400a661b2f2861a1dd4d2306c94e445783929e342e9184003314e9
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA udostępnia bezpłatnie otwarte modele za pośrednictwem interfejsu API zgodnego z OpenAI pod adresem
`https://integrate.api.nvidia.com/v1`, uwierzytelnianego kluczem API z serwisu
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). OpenClaw
domyślnie używa dla dostawcy NVIDIA modelu Nemotron 3 Ultra — modelu rozumującego NVIDIA
o łącznej liczbie 550 mld parametrów, z czego 55 mld jest aktywnych, przeznaczonego do agentowych zadań
z długim kontekstem.

## Pierwsze kroki

<Steps>
  <Step title="Uzyskaj klucz API">
    Utwórz klucz API w serwisie [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Wyeksportuj klucz i uruchom konfigurację początkową">
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

W przypadku konfiguracji nieinteraktywnej przekaż klucz bezpośrednio:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

<Warning>
Opcja `--nvidia-api-key` zapisuje klucz w historii powłoki i danych wyjściowych polecenia `ps`. Jeśli to możliwe, używaj
zmiennej środowiskowej `NVIDIA_API_KEY`.
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
      model: { primary: "nvidia/nvidia/nemotron-3-ultra-550b-a55b" },
    },
  },
}
```

## Wyróżniony katalog

Gdy skonfigurowano klucz API NVIDIA, ścieżki konfiguracji i wyboru modelu pobierają
publiczny katalog wyróżnionych modeli NVIDIA z adresu
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` i
przechowują wynik w pamięci podręcznej przez 24 godziny (pierwsze 32 pozycje, importowane jako wiersze
obsługujące wprowadzanie tekstu bez opłat). Dzięki temu nowe wyróżnione modele z build.nvidia.com pojawiają się w interfejsach konfiguracji i
wyboru modelu bez oczekiwania na wydanie OpenClaw. Gdy źródło danych na żywo
jest dostępne, pierwszy zwrócony model jest wstępnie wybraną opcją
podczas konfiguracji NVIDIA.

Pobieranie korzysta ze stałych zasad dotyczących hosta HTTPS `assets.ngc.nvidia.com`. Jeśli nie
skonfigurowano klucza API NVIDIA albo źródło danych jest niedostępne lub ma nieprawidłowy format,
OpenClaw korzysta z poniższego wbudowanego katalogu i wbudowanego modelu domyślnego.

## Nemotron 3 Ultra

Nemotron 3 Ultra jest domyślnym modelem NVIDIA w OpenClaw. Strona NVIDIA dotycząca
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
wskazuje go jako dostępny bezpłatny punkt końcowy z kontekstem obejmującym 1 mln tokenów.

Wbudowany wpis Ultra domyślnie wysyła
`chat_template_kwargs: { enable_thinking: false, force_nonempty_content: true }`,
dzięki czemu standardowe dane wyjściowe czatu pozostają w widocznej odpowiedzi zamiast
ujawniać tekst rozumowania.

Używaj modelu Ultra jako domyślnej opcji NVIDIA o największych możliwościach. Pozostaw wybrany model Super, gdy
potrzebujesz mniejszego wariantu Nemotron 3, albo wybierz jeden z modeli innych firm
hostowanych w katalogu NVIDIA, jeśli lepiej odpowiadają Ci jego kontekst, opóźnienie lub działanie.

## Wbudowany katalog zapasowy

Dostępne do wyboru wbudowane wpisy stanowią migawkę katalogu wyróżnionych modeli NVIDIA. Przestarzałe
wpisy zgodności nadal można rozpoznać na podstawie dokładnego odwołania, ale nie są widoczne
w selektorach modeli.

| Odwołanie do modelu                        | Nazwa                 | Kontekst  | Maks. dane wyjściowe |
| ------------------------------------------ | --------------------- | --------- | -------------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | Nemotron 3 Ultra 550B | 1,048,576 | 8,192                |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | Nemotron 3 Super 120B | 1,000,000 | 8,192                |
| `nvidia/z-ai/glm-5.2`                      | GLM 5.2               | 202,752   | 8,192                |
| `nvidia/moonshotai/kimi-k2.6`              | Kimi K2.6             | 262,144   | 8,192                |
| `nvidia/minimaxai/minimax-m3`              | Minimax M3            | 196,608   | 8,192                |
| `nvidia/deepseek-ai/deepseek-v4-pro`       | DeepSeek V4 Pro       | 262,144   | 16,384               |
| `nvidia/qwen/qwen3.5-397b-a17b`            | Qwen3.5 397B A17B     | 262,144   | 16,384               |

Pełny katalog zgodności zachowuje również następujące opublikowane odwołania dla istniejących
konfiguracji: `nvidia/moonshotai/kimi-k2.5`, `nvidia/z-ai/glm-5.1`,
`nvidia/minimaxai/minimax-m2.5`, `nvidia/z-ai/glm5` oraz
`nvidia/minimaxai/minimax-m2.7`. Pozostają dostępne przez dokładne odwołanie, ale
nigdy nie pojawiają się podczas konfiguracji początkowej ani w selektorach modeli.

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Automatyczne włączanie">
    Dostawca jest automatycznie włączany, gdy ustawiono zmienną środowiskową `NVIDIA_API_KEY`
    lub zapisano klucz podczas konfiguracji początkowej. Poza kluczem nie jest
    wymagana jawna konfiguracja dostawcy.
  </Accordion>

  <Accordion title="Katalog i ceny">
    Po skonfigurowaniu uwierzytelniania NVIDIA OpenClaw preferuje publiczny katalog
    wyróżnionych modeli NVIDIA i przechowuje go w pamięci podręcznej przez 24 godziny. Dostępny do wyboru wbudowany
    katalog zapasowy jest statyczną migawką katalogu wyróżnionych modeli NVIDIA; przestarzałe wpisy
    zgodności dostępne przez dokładne odwołanie są ukryte w selektorach modeli. W kodzie źródłowym koszty
    mają domyślnie wartość `0`, ponieważ NVIDIA obecnie oferuje bezpłatny dostęp przez API do wymienionych modeli.
  </Accordion>

  <Accordion title="Punkt końcowy zgodny z OpenAI">
    OpenClaw komunikuje się z NVIDIA za pomocą adaptera `openai-completions` przez
    standardową trasę uzupełnień czatu `/v1`. Każde narzędzie zgodne z OpenAI powinno
    działać od razu z bazowym adresem URL NVIDIA.
  </Accordion>

  <Accordion title="Parametry rozumowania Nemotron 3 Ultra">
    Przykładowe żądanie NVIDIA dla modelu Ultra używa `chat_template_kwargs.enable_thinking`
    i `reasoning_budget` do generowania danych wyjściowych rozumowania. Wbudowany wpis Ultra w OpenClaw
    domyślnie wyłącza rozumowanie szablonu przy standardowym korzystaniu z czatu. Jeśli chcesz
    włączyć dane wyjściowe rozumowania NVIDIA lub wymusić inne pola żądania
    specyficzne dla NVIDIA, ustaw parametry dla danego modelu i ogranicz nadpisania specyficzne dla dostawcy
    do modelu NVIDIA:

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

    `params.chat_template_kwargs` jest scalane z każdym `chat_template_kwargs`
    znajdującym się już w żądaniu, zamiast zastępować cały obiekt.
    `params.extra_body` stanowi końcowe nadpisanie treści żądania zgodnego z OpenAI
    i zastępuje kolidujące klucze ładunku, dlatego używaj go wyłącznie dla pól, które NVIDIA
    dokumentuje dla wybranego punktu końcowego.

  </Accordion>

  <Accordion title="Powolne odpowiedzi niestandardowego dostawcy">
    Niektóre niestandardowe modele hostowane przez NVIDIA mogą potrzebować więcej czasu niż domyślne około 120 sekund
    limitu bezczynności modelu, zanim wyemitują pierwszy fragment odpowiedzi. W przypadku niestandardowych
    wpisów dostawcy NVIDIA zwiększ limit czasu dostawcy zamiast limitu czasu całego
    środowiska wykonawczego agenta; `timeoutSeconds` obejmuje żądania HTTP do dostawcy i
    zwiększa górny limit mechanizmu nadzorującego bezczynność lub strumień dla tego dostawcy:

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
Korzystanie z modeli NVIDIA jest obecnie bezpłatne. Sprawdź
[build.nvidia.com](https://build.nvidia.com/), aby uzyskać najnowsze informacje o dostępności i
limitach częstotliwości żądań.
</Tip>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i sposobu przełączania awaryjnego.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja konfiguracji agentów, modeli i dostawców.
  </Card>
</CardGroup>
