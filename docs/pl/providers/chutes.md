---
read_when:
    - Chcesz używać Chutes z OpenClaw
    - Potrzebujesz ścieżki konfiguracji OAuth lub klucza API
    - Chcesz zmienić domyślny model, aliasy lub zachowanie wykrywania
summary: Konfiguracja Chutes (OAuth lub klucz API, wykrywanie modeli, aliasy)
title: Chutes
x-i18n:
    generated_at: "2026-06-27T18:10:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f1898c568fd664303a8bb5c2e46228c75f9c217bec5a65e752d9c7e10b980bb
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) udostępnia katalogi modeli open source przez
API zgodne z OpenAI. OpenClaw obsługuje zarówno przeglądarkowe OAuth, jak i bezpośrednie
uwierzytelnianie kluczem API dla dostawcy `chutes`.

| Właściwość | Wartość                      |
| ---------- | ---------------------------- |
| Dostawca   | `chutes`                     |
| API        | Zgodne z OpenAI              |
| Bazowy URL | `https://llm.chutes.ai/v1`   |
| Uwierzytelnianie | OAuth lub klucz API (patrz niżej) |

## Zainstaluj plugin

Zainstaluj oficjalny plugin, a następnie uruchom ponownie Gateway:

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## Pierwsze kroki

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Run the OAuth onboarding flow">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw uruchamia przepływ w przeglądarce lokalnie albo pokazuje URL i przepływ
        z wklejeniem przekierowania na zdalnych/bezgłowych hostach. Tokeny OAuth
        odświeżają się automatycznie przez profile uwierzytelniania OpenClaw.
      </Step>
      <Step title="Verify the default model">
        Po onboardingu domyślny model jest ustawiany na
        `chutes/zai-org/GLM-4.7-TEE`, a statyczny katalog Chutes jest
        rejestrowany.
      </Step>
    </Steps>
  </Tab>
  <Tab title="API key">
    <Steps>
      <Step title="Get an API key">
        Utwórz klucz na stronie
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="Run the API key onboarding flow">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="Verify the default model">
        Po onboardingu domyślny model jest ustawiany na
        `chutes/zai-org/GLM-4.7-TEE`, a statyczny katalog Chutes jest
        rejestrowany.
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
Obie ścieżki uwierzytelniania rejestrują statyczny katalog Chutes i ustawiają domyślny model na
`chutes/zai-org/GLM-4.7-TEE`. Zmienne środowiskowe runtime: `CHUTES_API_KEY`,
`CHUTES_OAUTH_TOKEN`.
</Note>

## Zachowanie wykrywania

Gdy uwierzytelnianie Chutes jest dostępne, OpenClaw odpytuje katalog Chutes przy użyciu tych
poświadczeń i korzysta z wykrytych modeli. Jeśli wykrywanie się nie powiedzie, OpenClaw przełącza się
na statyczny katalog, dzięki czemu onboarding i uruchamianie nadal działają.

## Domyślne aliasy

OpenClaw rejestruje trzy wygodne aliasy dla statycznego katalogu Chutes:

| Alias           | Model docelowy                                       |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Wbudowany katalog startowy

Statyczny katalog awaryjny zawiera bieżące referencje Chutes:

| Referencja modelu                                     |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

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
  <Accordion title="OAuth overrides">
    Możesz dostosować przepływ OAuth za pomocą opcjonalnych zmiennych środowiskowych:

    | Zmienna | Cel |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | Niestandardowy identyfikator klienta OAuth |
    | `CHUTES_CLIENT_SECRET` | Niestandardowy sekret klienta OAuth |
    | `CHUTES_OAUTH_REDIRECT_URI` | Niestandardowy URI przekierowania |
    | `CHUTES_OAUTH_SCOPES` | Niestandardowe zakresy OAuth |

    Zobacz [dokumentację OAuth Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview),
    aby poznać wymagania dotyczące aplikacji przekierowania i uzyskać pomoc.

  </Accordion>

  <Accordion title="Notes">
    - Wykrywanie z kluczem API i OAuth używa tego samego identyfikatora dostawcy `chutes`.
    - Modele Chutes są rejestrowane jako `chutes/<model-id>`.
    - Jeśli wykrywanie nie powiedzie się przy uruchamianiu, statyczny katalog jest używany automatycznie.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Model selection" href="/pl/concepts/model-providers" icon="layers">
    Reguły dostawców, referencje modeli i zachowanie przełączania awaryjnego.
  </Card>
  <Card title="Configuration reference" href="/pl/gateway/configuration-reference" icon="gear">
    Pełny schemat konfiguracji, w tym ustawienia dostawców.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Panel Chutes i dokumentacja API.
  </Card>
  <Card title="Chutes API keys" href="https://chutes.ai/settings/api-keys" icon="key">
    Twórz klucze API Chutes i zarządzaj nimi.
  </Card>
</CardGroup>
