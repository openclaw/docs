---
read_when:
    - Chcesz używać hostowanych modeli OSS Bedrock Mantle z OpenClaw.
    - Potrzebujesz zgodnego z OpenAI endpointu Mantle dla GPT-OSS, Qwen, Kimi albo GLM.
summary: Używanie modeli Amazon Bedrock Mantle (zgodnych z OpenAI) z OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-24T09:26:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5e9fb65cd5f5151470f0d8eeb9edceb9b035863dcd863d2bcabe233c1cfce41
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

OpenClaw zawiera dołączonego dostawcę **Amazon Bedrock Mantle**, który łączy się z
zgodnym z OpenAI endpointem Mantle. Mantle hostuje modele open-source i
zewnętrzne (GPT-OSS, Qwen, Kimi, GLM i podobne) przez standardową
powierzchnię `/v1/chat/completions` opartą na infrastrukturze Bedrock.

| Właściwość      | Wartość                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------ |
| Identyfikator dostawcy | `amazon-bedrock-mantle`                                                            |
| API             | `openai-completions` (zgodne z OpenAI) albo `anthropic-messages` (trasa Anthropic Messages) |
| Auth            | Jawny `AWS_BEARER_TOKEN_BEDROCK` albo generowanie bearer token z łańcucha poświadczeń IAM |
| Domyślny region | `us-east-1` (nadpisz przez `AWS_REGION` albo `AWS_DEFAULT_REGION`)                         |

## Pierwsze kroki

Wybierz preferowaną metodę auth i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="Jawny bearer token">
    **Najlepsze dla:** środowisk, w których masz już bearer token Mantle.

    <Steps>
      <Step title="Ustaw bearer token na hoście gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Opcjonalnie ustaw region (domyślnie `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Sprawdź, czy modele są wykrywane">
        ```bash
        openclaw models list
        ```

        Wykryte modele pojawiają się pod dostawcą `amazon-bedrock-mantle`. Nie
        jest wymagana dodatkowa konfiguracja, chyba że chcesz nadpisać ustawienia domyślne.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Poświadczenia IAM">
    **Najlepsze dla:** używania poświadczeń zgodnych z AWS SDK (shared config, SSO, web identity, role instancji albo tasków).

    <Steps>
      <Step title="Skonfiguruj poświadczenia AWS na hoście gateway">
        Działa dowolne źródło auth zgodne z AWS SDK:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Sprawdź, czy modele są wykrywane">
        ```bash
        openclaw models list
        ```

        OpenClaw automatycznie generuje bearer token Mantle z łańcucha poświadczeń.
      </Step>
    </Steps>

    <Tip>
    Gdy `AWS_BEARER_TOKEN_BEDROCK` nie jest ustawione, OpenClaw tworzy bearer token za ciebie na podstawie domyślnego łańcucha poświadczeń AWS, w tym shared credentials/config profiles, SSO, web identity oraz ról instancji i tasków.
    </Tip>

  </Tab>
</Tabs>

## Automatyczne wykrywanie modeli

Gdy ustawiono `AWS_BEARER_TOKEN_BEDROCK`, OpenClaw używa go bezpośrednio. W przeciwnym razie
OpenClaw próbuje wygenerować bearer token Mantle z domyślnego łańcucha
poświadczeń AWS. Następnie wykrywa dostępne modele Mantle, odpytując
endpoint `/v1/models` dla danego regionu.

| Zachowanie       | Szczegóły                 |
| ---------------- | ------------------------- |
| Cache wykrywania | Wyniki cache'owane przez 1 godzinę |
| Odświeżanie tokenu IAM | Co godzinę          |

<Note>
Bearer token jest tym samym `AWS_BEARER_TOKEN_BEDROCK`, którego używa standardowy dostawca [Amazon Bedrock](/pl/providers/bedrock).
</Note>

### Obsługiwane regiony

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Konfiguracja ręczna

Jeśli wolisz jawną konfigurację zamiast auto-discovery:

```json5
{
  models: {
    providers: {
      "amazon-bedrock-mantle": {
        baseUrl: "https://bedrock-mantle.us-east-1.api.aws/v1",
        api: "openai-completions",
        auth: "api-key",
        apiKey: "env:AWS_BEARER_TOKEN_BEDROCK",
        models: [
          {
            id: "gpt-oss-120b",
            name: "GPT-OSS 120B",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32000,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Obsługa reasoning">
    Obsługa reasoning jest wywnioskowywana z identyfikatorów modeli zawierających wzorce takie jak
    `thinking`, `reasoner` albo `gpt-oss-120b`. OpenClaw ustawia `reasoning: true`
    automatycznie dla pasujących modeli podczas wykrywania.
  </Accordion>

  <Accordion title="Niedostępność endpointu">
    Jeśli endpoint Mantle jest niedostępny albo nie zwraca modeli, dostawca jest
    po cichu pomijany. OpenClaw nie zgłasza błędu; inne skonfigurowane dostawcy
    nadal działają normalnie.
  </Accordion>

  <Accordion title="Claude Opus 4.7 przez trasę Anthropic Messages">
    Mantle udostępnia też trasę Anthropic Messages, która przenosi modele Claude przez tę samą ścieżkę streamingu uwierzytelnianą bearer tokenem. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) można wywoływać przez tę trasę z provider-owned streaming, więc bearer tokeny AWS nie są traktowane jak klucze API Anthropic.

    Gdy przypniesz model Anthropic Messages do dostawcy Mantle, OpenClaw użyje dla tego modelu powierzchni API `anthropic-messages` zamiast `openai-completions`. Auth nadal pochodzi z `AWS_BEARER_TOKEN_BEDROCK` (albo utworzonego bearer tokenu IAM).

    ```json5
    {
      models: {
        providers: {
          "amazon-bedrock-mantle": {
            models: [
              {
                id: "claude-opus-4.7",
                name: "Claude Opus 4.7",
                api: "anthropic-messages",
                reasoning: true,
                input: ["text", "image"],
                contextWindow: 1000000,
                maxTokens: 32000,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Relacja do dostawcy Amazon Bedrock">
    Bedrock Mantle jest osobnym dostawcą względem standardowego
    dostawcy [Amazon Bedrock](/pl/providers/bedrock). Mantle używa
    powierzchni `/v1` zgodnej z OpenAI, podczas gdy standardowy dostawca Bedrock używa
    natywnego API Bedrock.

    Obaj dostawcy współdzielą to samo poświadczenie `AWS_BEARER_TOKEN_BEDROCK`, gdy
    jest ono dostępne.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/pl/providers/bedrock" icon="cloud">
    Natywny dostawca Bedrock dla modeli Anthropic Claude, Titan i innych.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania failover.
  </Card>
  <Card title="OAuth i auth" href="/pl/gateway/authentication" icon="key">
    Szczegóły auth i reguły ponownego użycia poświadczeń.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Typowe problemy i sposoby ich rozwiązania.
  </Card>
</CardGroup>
