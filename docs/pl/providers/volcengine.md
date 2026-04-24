---
read_when:
    - Chcesz używać modeli Volcano Engine lub Doubao z OpenClaw
    - You need the Volcengine API key setup
summary: Konfiguracja Volcano Engine (modele Doubao, endpointy ogólne + coding)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-24T09:30:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6091da50fbab3a01cdc4337a496f361987f1991a2e2b7764e7a9c8c464e9757a
    source_path: providers/volcengine.md
    workflow: 15
---

Dostawca Volcengine zapewnia dostęp do modeli Doubao i modeli firm trzecich
hostowanych na Volcano Engine, z oddzielnymi endpointami dla ogólnych i programistycznych
obciążeń.

| Szczegół  | Wartość                                             |
| --------- | --------------------------------------------------- |
| Dostawcy  | `volcengine` (ogólne) + `volcengine-plan` (coding) |
| Uwierzytelnianie | `VOLCANO_ENGINE_API_KEY`                     |
| API       | Zgodne z OpenAI                                     |

## Pierwsze kroki

<Steps>
  <Step title="Ustaw klucz API">
    Uruchom interaktywny onboarding:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    To rejestruje zarówno dostawcę ogólnego (`volcengine`), jak i coding (`volcengine-plan`) przy użyciu jednego klucza API.

  </Step>
  <Step title="Ustaw model domyślny">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="Sprawdź, czy model jest dostępny">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
Dla konfiguracji nieinteraktywnej (CI, skrypty) przekaż klucz bezpośrednio:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Dostawcy i endpointy

| Dostawca          | Endpoint                                 | Przypadek użycia |
| ----------------- | ---------------------------------------- | ---------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`       | Modele ogólne    |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Modele coding    |

<Note>
Obaj dostawcy są konfigurowani przy użyciu jednego klucza API. Konfiguracja rejestruje obu automatycznie.
</Note>

## Wbudowany katalog

<Tabs>
  <Tab title="Ogólne (volcengine)">
    | Referencja modelu                             | Nazwa                           | Wejście     | Kontekst |
    | --------------------------------------------- | ------------------------------- | ----------- | -------- |
    | `volcengine/doubao-seed-1-8-251228`           | Doubao Seed 1.8                 | text, image | 256,000  |
    | `volcengine/doubao-seed-code-preview-251028`  | doubao-seed-code-preview-251028 | text, image | 256,000  |
    | `volcengine/kimi-k2-5-260127`                 | Kimi K2.5                       | text, image | 256,000  |
    | `volcengine/glm-4-7-251222`                   | GLM 4.7                         | text, image | 200,000  |
    | `volcengine/deepseek-v3-2-251201`             | DeepSeek V3.2                   | text, image | 128,000  |
  </Tab>
  <Tab title="Coding (volcengine-plan)">
    | Referencja modelu                                  | Nazwa                    | Wejście | Kontekst |
    | -------------------------------------------------- | ------------------------ | ------- | -------- |
    | `volcengine-plan/ark-code-latest`                  | Ark Coding Plan          | text    | 256,000  |
    | `volcengine-plan/doubao-seed-code`                 | Doubao Seed Code         | text    | 256,000  |
    | `volcengine-plan/glm-4.7`                          | GLM 4.7 Coding           | text    | 200,000  |
    | `volcengine-plan/kimi-k2-thinking`                 | Kimi K2 Thinking         | text    | 256,000  |
    | `volcengine-plan/kimi-k2.5`                        | Kimi K2.5 Coding         | text    | 256,000  |
    | `volcengine-plan/doubao-seed-code-preview-251028`  | Doubao Seed Code Preview | text    | 256,000  |
  </Tab>
</Tabs>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Model domyślny po onboardingu">
    `openclaw onboard --auth-choice volcengine-api-key` obecnie ustawia
    `volcengine-plan/ark-code-latest` jako model domyślny, a jednocześnie rejestruje
    ogólny katalog `volcengine`.
  </Accordion>

  <Accordion title="Zachowanie fallbacku selektora modeli">
    Podczas onboardingu/wyboru modeli w configure wybór auth Volcengine preferuje
    zarówno wiersze `volcengine/*`, jak i `volcengine-plan/*`. Jeśli te modele nie są
    jeszcze załadowane, OpenClaw przechodzi awaryjnie do niefiltrowanego katalogu zamiast pokazywać
    pusty selektor ograniczony do dostawcy.
  </Accordion>

  <Accordion title="Zmienne środowiskowe dla procesów daemon">
    Jeśli Gateway działa jako daemon (launchd/systemd), upewnij się, że
    `VOLCANO_ENGINE_API_KEY` jest dostępne dla tego procesu (na przykład w
    `~/.openclaw/.env` lub przez `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Przy uruchamianiu OpenClaw jako usługi w tle zmienne środowiskowe ustawione w Twojej
interaktywnej powłoce nie są dziedziczone automatycznie. Zobacz powyższą uwagę dotyczącą daemon.
</Warning>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modeli" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, referencji modeli i zachowania failover.
  </Card>
  <Card title="Konfiguracja" href="/pl/gateway/configuration" icon="gear">
    Pełna dokumentacja referencyjna konfiguracji agentów, modeli i dostawców.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Typowe problemy i kroki debugowania.
  </Card>
  <Card title="FAQ" href="/pl/help/faq" icon="circle-question">
    Najczęściej zadawane pytania dotyczące konfiguracji OpenClaw.
  </Card>
</CardGroup>
