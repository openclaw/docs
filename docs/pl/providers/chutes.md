---
read_when:
    - Chcesz używać Chutes z OpenClaw
    - Potrzebujesz ścieżki konfiguracji OAuth lub klucza API
    - Chcesz ustawić model domyślny, aliasy lub sposób wykrywania
summary: Konfiguracja Chutes (OAuth lub klucz API, wykrywanie modeli, aliasy)
title: Zsypy
x-i18n:
    generated_at: "2026-07-12T15:29:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dafa96c4a56b9d38d033b87cc077d359cb71adaf1ca41a0ab6b6cc77b66484a7
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) udostępnia katalogi modeli open source za pośrednictwem
interfejsu API zgodnego z OpenAI. OpenClaw obsługuje zarówno OAuth w przeglądarce, jak i uwierzytelnianie kluczem API.

| Właściwość                  | Wartość                                                  |
| --------------------------- | -------------------------------------------------------- |
| Dostawca                    | `chutes`                                                 |
| Plugin                      | oficjalny pakiet zewnętrzny (`@openclaw/chutes-provider`) |
| API                         | zgodne z OpenAI                                          |
| Bazowy adres URL            | `https://llm.chutes.ai/v1`                               |
| Uwierzytelnianie            | OAuth lub klucz API (zobacz poniżej)                     |
| Zmienne środowiskowe procesu | `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`                   |

`CHUTES_OAUTH_TOKEN` bezpośrednio przekazuje uzyskany wcześniej token dostępu OAuth
(na przykład w CI), z pominięciem opisanego poniżej interaktywnego procesu w przeglądarce.

## Instalowanie pluginu

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## Pierwsze kroki

Obie metody ustawiają model domyślny na `chutes/zai-org/GLM-4.7-TEE` i rejestrują
katalog Chutes.

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Uruchom proces konfiguracji OAuth">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw uruchamia proces w przeglądarce lokalnie, a na hostach zdalnych lub bez interfejsu graficznego
        wyświetla adres URL i umożliwia wklejenie adresu przekierowania. Tokeny OAuth są automatycznie odświeżane przez profile
        uwierzytelniania OpenClaw.
      </Step>
    </Steps>
  </Tab>
  <Tab title="Klucz API">
    <Steps>
      <Step title="Uzyskaj klucz API">
        Utwórz klucz na stronie
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="Uruchom proces konfiguracji klucza API">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Sposób wykrywania

Gdy dostępne jest uwierzytelnianie Chutes, OpenClaw wysyła zapytanie `GET /v1/models` z tymi
danymi uwierzytelniającymi i korzysta z wykrytych modeli, przechowując je w pamięci podręcznej przez 5 minut dla każdych
danych uwierzytelniających. W przypadku wygasłego lub nieautoryzowanego klucza (HTTP 401) OpenClaw ponawia próbę jeden raz
bez danych uwierzytelniających. Jeśli wykrywanie nadal nie zwraca żadnych wierszy, kończy się niepowodzeniem lub zwraca dowolny
inny stan spoza zakresu 2xx, używany jest dołączony katalog statyczny (wykrywanie zarówno za pomocą klucza API,
jak i OAuth korzysta z tej samej ścieżki). Jeśli wykrywanie nie powiedzie się podczas uruchamiania,
katalog statyczny zostanie użyty automatycznie.

## Domyślne aliasy

OpenClaw rejestruje trzy wygodne aliasy katalogu Chutes:

| Alias           | Model docelowy                                         |
| --------------- | ------------------------------------------------------ |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                           |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                 |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506`  |

## Wbudowany katalog początkowy

Dołączony katalog zapasowy zawiera 47 modeli. Oto reprezentatywna próbka bieżących odwołań:

| Odwołanie do modelu                                   |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

Aby wyświetlić pełną listę, uruchom `openclaw models list --all --provider chutes`.

## Przykład konfiguracji

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Nadpisywanie ustawień OAuth">
    Dostosuj proces OAuth za pomocą opcjonalnych zmiennych środowiskowych:

    | Zmienna | Przeznaczenie |
    | ------- | ------------- |
    | `CHUTES_CLIENT_ID` | Identyfikator klienta OAuth (jeśli nie jest ustawiony, pojawi się prośba o jego podanie) |
    | `CHUTES_CLIENT_SECRET` | Sekret klienta OAuth |
    | `CHUTES_OAUTH_REDIRECT_URI` | Identyfikator URI przekierowania (domyślnie `http://127.0.0.1:1456/oauth-callback`) |
    | `CHUTES_OAUTH_SCOPES` | Zakresy rozdzielone spacjami (domyślnie `openid profile chutes:invoke`) |

    Wymagania dotyczące aplikacji przekierowującej i pomoc znajdziesz w
    [dokumentacji OAuth Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview).

  </Accordion>

  <Accordion title="Uwagi">
    - Modele Chutes są rejestrowane jako `chutes/<model-id>`.
    - Chutes nie raportuje użycia tokenów podczas strumieniowania (`supportsUsageInStreaming: false`); łączne użycie jest jednak wyświetlane po zakończeniu strumienia.

  </Accordion>
</AccordionGroup>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Reguły dostawców, odwołania do modeli i sposób przełączania awaryjnego.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełny schemat konfiguracji, w tym ustawienia dostawców.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Panel Chutes i dokumentacja API.
  </Card>
  <Card title="Klucze API Chutes" href="https://chutes.ai/settings/api-keys" icon="key">
    Tworzenie kluczy API Chutes i zarządzanie nimi.
  </Card>
</CardGroup>
