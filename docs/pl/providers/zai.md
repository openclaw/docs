---
read_when:
    - Chcesz korzystać z modeli Z.AI / GLM w OpenClaw
    - Potrzebujesz prostej konfiguracji `ZAI_API_KEY`
summary: Używanie Z.AI (modeli GLM) z OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-07-12T15:35:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab29149da39cbf82fe041ea5932a860c461320e14bf26f83f69060d7ae0ae00a
    source_path: providers/zai.md
    workflow: 16
---

Z.AI to platforma API dla modeli **GLM**. Udostępnia interfejsy REST API dla GLM i
używa kluczy API do uwierzytelniania. Utwórz klucz API w konsoli Z.AI.
OpenClaw używa dostawcy `zai` z kluczem API Z.AI.

| Właściwość           | Wartość                                      |
| -------------------- | -------------------------------------------- |
| Dostawca             | `zai`                                        |
| Pakiet                | `@openclaw/zai-provider`                     |
| Uwierzytelnianie     | `ZAI_API_KEY` (starszy alias: `Z_AI_API_KEY`) |
| API                   | Uzupełnianie czatu Z.AI (uwierzytelnianie Bearer) |

## Modele GLM

GLM to rodzina modeli, a nie osobny dostawca. W OpenClaw modele GLM używają
odwołań takich jak `zai/glm-5.2`: dostawca `zai`, identyfikator modelu `glm-5.2`.

## Pierwsze kroki

Najpierw zainstaluj Plugin dostawcy:

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="Automatyczne wykrywanie punktu końcowego">
    **Najlepsze dla:** większości użytkowników. OpenClaw sprawdza obsługiwane punkty końcowe Z.AI przy użyciu Twojego klucza API i automatycznie stosuje prawidłowy bazowy adres URL.

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

  <Tab title="Jawnie określony regionalny punkt końcowy">
    **Najlepsze dla:** użytkowników, którzy chcą wymusić określony plan Coding Plan lub ogólny interfejs API.

    <Steps>
      <Step title="Wybierz właściwą opcję konfiguracji początkowej">
        ```bash
        # Coding Plan Global (zalecany dla użytkowników Coding Plan)
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

| Opcja konfiguracji początkowej | Bazowy adres URL                               | Model domyślny |
| ------------------------------ | ---------------------------------------------- | -------------- |
| `zai-global`                   | `https://api.z.ai/api/paas/v4`                 | `glm-5.1`      |
| `zai-cn`                       | `https://open.bigmodel.cn/api/paas/v4`         | `glm-5.1`      |
| `zai-coding-global`            | `https://api.z.ai/api/coding/paas/v4`          | `glm-5.2`      |
| `zai-coding-cn`                | `https://open.bigmodel.cn/api/coding/paas/v4`  | `glm-5.2`      |

`zai-api-key` automatycznie wykrywa jeden z tych czterech punktów końcowych,
sprawdzając klucz w interfejsie API uzupełniania czatu każdego punktu końcowego.
Najpierw sprawdzane są ogólne punkty końcowe (`zai-global`, a następnie
`zai-cn`), później punkty końcowe Coding Plan (`zai-coding-global`, a następnie
`zai-coding-cn`). Proces zatrzymuje się przy pierwszym punkcie końcowym, który
zaakceptuje żądanie. Użyj jawnej opcji `--auth-choice`, aby wymusić punkt końcowy
Coding Plan, jeśli klucz działa w obu przypadkach.

## Przykład konfiguracji

<Tip>
Opcja `zai-api-key` pozwala OpenClaw wykryć na podstawie klucza odpowiedni punkt
końcowy Z.AI i automatycznie zastosować prawidłowy bazowy adres URL. Użyj jawnych
opcji regionalnych, jeśli chcesz wymusić określony plan Coding Plan lub ogólny
interfejs API.
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 używa punktu końcowego Coding Plan.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## Wbudowany katalog

Plugin dostawcy `zai` dostarcza swój katalog w manifeście Pluginu, dzięki czemu
lista tylko do odczytu może wyświetlać znane pozycje GLM bez ładowania środowiska
uruchomieniowego dostawcy:

```bash
openclaw models list --all --provider zai
```

Katalog oparty na manifeście obejmuje obecnie:

| Odwołanie do modelu   | Uwagi                                  |
| --------------------- | -------------------------------------- |
| `zai/glm-5.2`         | Domyślny dla Coding Plan; kontekst 1M  |
| `zai/glm-5.1`         | Domyślny dla ogólnego API              |
| `zai/glm-5`           |                                        |
| `zai/glm-5-turbo`     |                                        |
| `zai/glm-5v-turbo`    |                                        |
| `zai/glm-4.7`         |                                        |
| `zai/glm-4.7-flash`   |                                        |
| `zai/glm-4.7-flashx`  |                                        |
| `zai/glm-4.6`         |                                        |
| `zai/glm-4.6v`        |                                        |
| `zai/glm-4.5`         |                                        |
| `zai/glm-4.5-air`     |                                        |
| `zai/glm-4.5-flash`   |                                        |
| `zai/glm-4.5v`        |                                        |

<Tip>
Modele GLM są dostępne jako `zai/<model>` (przykład: `zai/glm-5`).
</Tip>

<Note>
Konfiguracja Coding Plan domyślnie używa `zai/glm-5.2`, natomiast konfiguracja
ogólnego API zachowuje `zai/glm-5.1`. W punktach końcowych Coding Plan
automatyczne wykrywanie przechodzi na `glm-5.1`, a następnie `glm-4.7`, jeśli
klucz lub plan nie udostępnia GLM-5.2. Wersje i dostępność GLM mogą się zmieniać;
uruchom `openclaw models list --all --provider zai`, aby zobaczyć katalog znany
zainstalowanej wersji.
</Note>

## Poziomy rozumowania

<Tabs>
  <Tab title="GLM-5.2">
    Pełny zakres: `off`, `low`, `high`, `max` (domyślnie `off`). OpenClaw mapuje
    `low` i `high` na poziom wysiłku rozumowania `high` w Z.AI, a `max` na poziom
    `max` w Z.AI, za pomocą pola `reasoning_effort` w ładunku żądania.
  </Tab>
  <Tab title="Inne modele GLM">
    Tylko przełącznik binarny: `off` i `low` (wyświetlane jako `on` w selektorach),
    domyślnie `off`. Ustawienie rozumowania na `off` wysyła
    `thinking: { type: "disabled" }`; każdy inny poziom pozostawia ładunek żądania
    bez zmian (stosowane jest domyślne zachowanie rozumowania Z.AI).
  </Tab>
</Tabs>

Ustawienie rozumowania na `off` zapobiega odpowiedziom, które wykorzystują
budżet wyjściowy na `reasoning_content` przed wyświetleniem widocznego tekstu.

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Przekazywanie nierozpoznanych modeli GLM-5">
    Nierozpoznane identyfikatory `glm-5*` nadal są rozpoznawane w ścieżce
    dostawcy przez syntezowanie metadanych należących do dostawcy na podstawie
    szablonu `glm-4.7`, gdy identyfikator odpowiada bieżącej strukturze rodziny
    GLM-5.
  </Accordion>

  <Accordion title="Strumieniowanie wywołań narzędzi">
    Opcja `tool_stream` jest domyślnie włączona dla strumieniowania wywołań
    narzędzi Z.AI. Aby ją wyłączyć:

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

  <Accordion title="Zachowywanie rozumowania">
    Zachowywanie rozumowania wymaga jawnego włączenia, ponieważ Z.AI wymaga
    ponownego odtworzenia pełnej historycznej zawartości `reasoning_content`,
    co zwiększa liczbę tokenów promptu. Włącz je osobno dla każdego modelu:

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

    Po włączeniu, gdy rozumowanie jest aktywne, OpenClaw wysyła
    `thinking: { type: "enabled", clear_thinking: false }` i odtwarza wcześniejszą
    zawartość `reasoning_content` dla tej samej transkrypcji zgodnej z OpenAI.
    Klucz parametru `preserve_thinking` zapisany w konwencji snake_case również
    działa jako alias.

    Użytkownicy zaawansowani nadal mogą nadpisać dokładny ładunek dostawcy za
    pomocą `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Rozpoznawanie obrazów">
    Plugin Z.AI rejestruje funkcję rozpoznawania obrazów.

    | Właściwość | Wartość      |
    | ---------- | ------------ |
    | Model      | `glm-4.6v`   |

    Rozpoznawanie obrazów jest automatycznie ustalane na podstawie
    skonfigurowanego uwierzytelniania Z.AI — dodatkowa konfiguracja nie jest
    potrzebna.

  </Accordion>

  <Accordion title="Szczegóły uwierzytelniania">
    - Z.AI używa uwierzytelniania Bearer z kluczem API.
    - Opcja konfiguracji początkowej `zai-api-key` automatycznie wykrywa odpowiedni punkt końcowy Z.AI, sprawdzając obsługiwane punkty końcowe przy użyciu klucza.
    - Użyj jawnych opcji regionalnych (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`), jeśli chcesz wymusić określony interfejs API.
    - Starsza zmienna środowiskowa `Z_AI_API_KEY` jest nadal akceptowana; OpenClaw kopiuje ją do `ZAI_API_KEY` podczas uruchamiania, jeśli `ZAI_API_KEY` nie jest ustawiona.

  </Accordion>
</AccordionGroup>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i sposobu przełączania awaryjnego.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełny schemat konfiguracji OpenClaw, w tym ustawienia dostawców i modeli.
  </Card>
</CardGroup>
