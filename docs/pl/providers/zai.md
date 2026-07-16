---
read_when:
    - Chcesz używać modeli Z.AI / GLM w OpenClaw
    - Potrzebna jest prosta konfiguracja ZAI_API_KEY
summary: Korzystanie z Z.AI (modele GLM) w OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-07-16T19:05:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7f7adf0e2f436f9081891013c0092ce4717bf302b2a4a2e997d9561d7d40211a
    source_path: providers/zai.md
    workflow: 16
---

Z.AI to platforma API dla modeli **GLM**. Udostępnia interfejsy REST API dla GLM i
wykorzystuje klucze API do uwierzytelniania. Klucz API należy utworzyć w konsoli Z.AI.
OpenClaw używa dostawcy `zai` z kluczem API Z.AI.

| Właściwość | Wartość                                        |
| -------- | -------------------------------------------- |
| Dostawca | `zai`                                        |
| Pakiet  | `@openclaw/zai-provider`                     |
| Uwierzytelnianie     | `ZAI_API_KEY` (starszy alias: `Z_AI_API_KEY`) |
| API      | Z.AI Chat Completions (uwierzytelnianie Bearer)          |

## Modele GLM

GLM to rodzina modeli, a nie osobny dostawca. W OpenClaw modele GLM używają
odwołań takich jak `zai/glm-5.2`: dostawca `zai`, identyfikator modelu `glm-5.2`.

## Pierwsze kroki

Najpierw należy zainstalować Plugin dostawcy:

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="Automatyczne wykrywanie punktu końcowego">
    **Najlepsze dla:** większości użytkowników. OpenClaw sprawdza obsługiwane punkty końcowe Z.AI przy użyciu klucza API i automatycznie stosuje prawidłowy bazowy adres URL.

    <Steps>
      <Step title="Uruchom konfigurację początkową">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Sprawdź, czy model znajduje się na liście">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Jawny regionalny punkt końcowy">
    **Najlepsze dla:** użytkowników, którzy chcą wymusić określony interfejs Coding Plan lub ogólny interfejs API.

    <Steps>
      <Step title="Wybierz odpowiednią opcję konfiguracji początkowej">
        ```bash
        # Coding Plan Global (zalecane dla użytkowników Coding Plan)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (region Chin)
        openclaw onboard --auth-choice zai-coding-cn

        # Ogólne API
        openclaw onboard --auth-choice zai-global

        # Ogólne API CN (region Chin)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Sprawdź, czy model znajduje się na liście">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

### Punkty końcowe

| Opcja konfiguracji początkowej   | Bazowy adres URL                                      | Model domyślny |
| ------------------- | --------------------------------------------- | ------------- |
| `zai-global`        | `https://api.z.ai/api/paas/v4`                | `glm-5.1`     |
| `zai-cn`            | `https://open.bigmodel.cn/api/paas/v4`        | `glm-5.1`     |
| `zai-coding-global` | `https://api.z.ai/api/coding/paas/v4`         | `glm-5.2`     |
| `zai-coding-cn`     | `https://open.bigmodel.cn/api/coding/paas/v4` | `glm-5.2`     |

`zai-api-key` automatycznie wykrywa jeden z tych czterech punktów, testując klucz względem
interfejsu API uzupełnień czatu każdego punktu końcowego. Najpierw sprawdza ogólne punkty końcowe (`zai-global`,
następnie `zai-cn`), a później punkty końcowe Coding Plan (`zai-coding-global`, następnie
`zai-coding-cn`) i zatrzymuje się na pierwszym punkcie końcowym, który zaakceptuje żądanie.
Aby wymusić punkt końcowy Coding Plan, gdy klucz działa z obydwoma, należy użyć jawnej opcji `--auth-choice`.

## Limity szybkości i przeciążenia

Z.AI opisuje Coding Plan oraz narzędzia agentowe ogólnego przeznaczenia jako usługi
z zarządzaną przepustowością. Według dokumentacji Z.AI:

- [Narzędzia agentowe ogólnego przeznaczenia](https://docs.z.ai/devpack/tool/others),
  w tym OpenClaw, są udostępniane na zasadzie najlepszych starań. Przy dużym obciążeniu
  wnioskowania, zazwyczaj około 2–6 PM czasu singapurskiego, niektóre żądania mogą podlegać tymczasowym
  limitom szybkości.
- [Limity szybkości i współbieżności Coding Plan](https://docs.z.ai/devpack/usage-policy)
  są powiązane z poziomem planu i mogą być dynamicznie dostosowywane na podstawie dostępności
  zasobów. Poza godzinami szczytu współbieżność może być wyższa.
- [Kod błędu API `1302`](https://docs.z.ai/api-reference/api-code) oznacza „Osiągnięto
  limit szybkości żądań”. Kod błędu API `1305` oznacza „Usługa może być
  tymczasowo przeciążona, spróbuj ponownie później”.

Jeśli w okresie dużego obciążenia pojawi się tymczasowa odpowiedź `429` lub `1305`, należy odczekać i
ponowić żądanie. Jeśli błędy powtarzają się poza godzinami szczytu lub występują tylko
dla jednego punktu końcowego, modelu albo postaci żądania, należy najpierw sprawdzić skonfigurowany punkt końcowy
i model:

```bash
openclaw models list --all --provider zai
openclaw config get models.providers.zai.baseUrl
```

Klucze Coding Plan powinny używać punktu końcowego Coding Plan, takiego jak
`https://api.z.ai/api/coding/paas/v4`; klucze ogólnego API powinny używać punktu końcowego ogólnego API,
takiego jak `https://api.z.ai/api/paas/v4`. Utrzymujące się błędy przy tym samym
kluczu i punkcie końcowym mogą wskazywać na odrzucenie po stronie dostawcy lub ograniczenie planu,
a nie na zwykłe ograniczanie przepustowości podczas szczytowego obciążenia.

## Przykład konfiguracji

<Tip>
`zai-api-key` umożliwia OpenClaw wykrycie pasującego punktu końcowego Z.AI na podstawie klucza i
automatyczne zastosowanie prawidłowego bazowego adresu URL. Jawnych opcji regionalnych należy używać, aby
wymusić określony interfejs Coding Plan lub ogólny interfejs API.
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 korzysta z punktu końcowego Coding Plan.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## Wbudowany katalog

Plugin dostawcy `zai` udostępnia swój katalog w manifeście pluginu, dzięki czemu lista tylko do odczytu
może wyświetlać znane wiersze GLM bez ładowania środowiska wykonawczego dostawcy:

```bash
openclaw models list --all --provider zai
```

Katalog oparty na manifeście obejmuje obecnie:

| Odwołanie do modelu | Uwagi                              |
| -------------------- | ---------------------------------- |
| `zai/glm-5.2`        | Domyślny dla Coding Plan; kontekst 1M |
| `zai/glm-5.1`        | Domyślny dla ogólnego API          |
| `zai/glm-5`          |                                    |
| `zai/glm-5-turbo`    |                                    |
| `zai/glm-5v-turbo`   |                                    |
| `zai/glm-4.7`        |                                    |
| `zai/glm-4.7-flash`  |                                    |
| `zai/glm-4.7-flashx` |                                    |
| `zai/glm-4.6`        |                                    |
| `zai/glm-4.6v`       |                                    |
| `zai/glm-4.5`        |                                    |
| `zai/glm-4.5-air`    |                                    |
| `zai/glm-4.5-flash`  |                                    |
| `zai/glm-4.5v`       |                                    |

<Tip>
Modele GLM są dostępne jako `zai/<model>` (przykład: `zai/glm-5`).
</Tip>

<Note>
Konfiguracja Coding Plan domyślnie używa `zai/glm-5.2`; konfiguracja ogólnego API zachowuje
`zai/glm-5.1`. W punktach końcowych Coding Plan automatyczne wykrywanie przełącza się kolejno na
`glm-5.1`, a następnie `glm-4.7`, gdy klucz lub plan nie udostępnia GLM-5.2. Wersje i
dostępność GLM mogą się zmieniać; uruchom `openclaw models list --all --provider zai`,
aby wyświetlić katalog znany zainstalowanej wersji.
</Note>

## Poziomy rozumowania

<Tabs>
  <Tab title="GLM-5.2">
    Pełny zakres: `off`, `low`, `high`, `max` (domyślnie `off`). OpenClaw mapuje
    `low` i `high` na poziom intensywności rozumowania `high` w Z.AI, a `max` na poziom
    `max` w Z.AI za pośrednictwem `reasoning_effort` w danych żądania.
  </Tab>
  <Tab title="Inne modele GLM">
    Dostępny jest tylko przełącznik binarny: `off` i `low` (wyświetlane jako `on` w selektorach), domyślnie
    `off`. Ustawienie rozumowania na `off` wysyła `thinking: { type: "disabled" }`;
    każdy inny poziom pozostawia dane żądania bez zmian (obowiązuje domyślne
    zachowanie rozumowania Z.AI).
  </Tab>
</Tabs>

Ustawienie rozumowania na `off` pozwala uniknąć odpowiedzi, które zużywają budżet wyjściowy na
`reasoning_content` przed wyświetleniem widocznego tekstu.

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Przekazywanie nierozpoznanych modeli GLM-5">
    Nieznane identyfikatory `glm-5*` są nadal przekazywane w ścieżce dostawcy przez
    syntezowanie metadanych należących do dostawcy na podstawie szablonu `glm-4.7`, gdy identyfikator
    odpowiada bieżącemu formatowi rodziny GLM-5.
  </Accordion>

  <Accordion title="Strumieniowanie wywołań narzędzi">
    `tool_stream` jest domyślnie włączone dla strumieniowania wywołań narzędzi Z.AI. Aby je wyłączyć:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/<model>": {
              params: { tool_stream: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Zachowane rozumowanie">
    Zachowywanie rozumowania jest opcjonalne, ponieważ Z.AI wymaga ponownego odtworzenia pełnej historycznej
    wartości `reasoning_content`, co zwiększa liczbę tokenów promptu. Włącz je
    osobno dla każdego modelu:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.2": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    Po włączeniu tej opcji i rozumowania OpenClaw wysyła
    `thinking: { type: "enabled", clear_thinking: false }` i ponownie odtwarza wcześniejsze
    `reasoning_content` dla tej samej transkrypcji zgodnej z OpenAI. Klucz parametru
    `preserve_thinking` zapisany w notacji snake_case działa jako alias.

    Użytkownicy zaawansowani mogą nadal nadpisać dokładne dane dostawcy za pomocą
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Rozumienie obrazów">
    Plugin Z.AI rejestruje funkcję rozumienia obrazów.

    | Właściwość    | Wartość     |
    | ------------- | ----------- |
    | Model         | `glm-4.6v`  |

    Rozumienie obrazów jest automatycznie określane na podstawie skonfigurowanego uwierzytelniania Z.AI —
    dodatkowa konfiguracja nie jest potrzebna.

  </Accordion>

  <Accordion title="Szczegóły uwierzytelniania">
    - Z.AI używa uwierzytelniania Bearer z kluczem API.
    - Opcja wdrażania `zai-api-key` automatycznie wykrywa odpowiedni punkt końcowy Z.AI, sondując obsługiwane punkty końcowe za pomocą klucza.
    - Aby wymusić określony interfejs API, użyj jawnych opcji regionalnych (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`).
    - Starsza zmienna środowiskowa `Z_AI_API_KEY` jest nadal akceptowana; OpenClaw podczas uruchamiania kopiuje ją do `ZAI_API_KEY`, jeśli `ZAI_API_KEY` nie jest ustawiona.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełny schemat konfiguracji OpenClaw, w tym ustawienia dostawców i modeli.
  </Card>
</CardGroup>
