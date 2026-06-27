---
read_when:
    - Chcesz używać hostowanych modeli OSS Bedrock Mantle z OpenClaw
    - Potrzebujesz punktu końcowego Mantle zgodnego z OpenAI dla GPT-OSS, Qwen, Kimi lub GLM
summary: Używaj modeli Amazon Bedrock Mantle (zgodnych z OpenAI) z OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-06-27T18:10:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e14026e4fb25b13994061f2aaa5294df44ce8fe1ba99e031b8c92a41a4a9b49
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw zawiera wbudowanego dostawcę **Amazon Bedrock Mantle**, który łączy się z
punktem końcowym Mantle zgodnym z OpenAI. Mantle udostępnia modele open source i
modele firm trzecich (GPT-OSS, Qwen, Kimi, GLM i podobne) przez standardową
powierzchnię `/v1/chat/completions` opartą na infrastrukturze Bedrock.

| Właściwość      | Wartość                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------- |
| ID dostawcy     | `amazon-bedrock-mantle`                                                                     |
| API             | `openai-completions` (zgodne z OpenAI) lub `anthropic-messages` (trasa Anthropic Messages)  |
| Uwierzytelnianie | Jawny `AWS_BEARER_TOKEN_BEDROCK` lub generowanie tokenu bearer z łańcucha poświadczeń IAM  |
| Domyślny region | `us-east-1` (nadpisz przez `AWS_REGION` lub `AWS_DEFAULT_REGION`)                           |

## Pierwsze kroki

Wybierz preferowaną metodę uwierzytelniania i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="Jawny token bearer">
    **Najlepsze dla:** środowisk, w których masz już token bearer Mantle.

    <Steps>
      <Step title="Ustaw token bearer na hoście Gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Opcjonalnie ustaw region (domyślnie `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Włącz udostępnianie danych dostawcy dla Claude Fable 5">
        Claude Fable 5 i modele Bedrock klasy Claude Mythos wymagają trybu API przechowywania danych Mantle `provider_data_share` przed wywołaniem. To włączenie pozwala Bedrock udostępniać prompty i uzupełnienia Anthropic oraz przechowywać je do 30 dni na potrzeby przeglądu zaufania i bezpieczeństwa.

        ```bash
        AWS_REGION="${AWS_REGION:-us-east-1}"
        curl -X PUT "https://bedrock-mantle.${AWS_REGION}.api.aws/v1/data_retention" \
          -H "Authorization: Bearer $AWS_BEARER_TOKEN_BEDROCK" \
          -H "Content-Type: application/json" \
          -d '{ "mode": "provider_data_share" }'
        ```

        Użyj w konfiguracji innego modelu Bedrock, jeśli nie możesz zaakceptować tego trybu przechowywania.
      </Step>
      <Step title="Sprawdź, czy modele zostały wykryte">
        ```bash
        openclaw models list
        ```

        Wykryte modele pojawiają się pod dostawcą `amazon-bedrock-mantle`. Nie jest
        wymagana dodatkowa konfiguracja, chyba że chcesz nadpisać wartości domyślne.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Poświadczenia IAM">
    **Najlepsze dla:** używania poświadczeń zgodnych z AWS SDK (wspólna konfiguracja, SSO, tożsamość web, role instancji lub zadań).

    <Steps>
      <Step title="Skonfiguruj poświadczenia AWS na hoście Gateway">
        Działa każde źródło uwierzytelniania zgodne z AWS SDK:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Sprawdź, czy modele zostały wykryte">
        ```bash
        openclaw models list
        ```

        OpenClaw automatycznie generuje token bearer Mantle z łańcucha poświadczeń.
      </Step>
    </Steps>

    <Tip>
    Gdy `AWS_BEARER_TOKEN_BEDROCK` nie jest ustawiony, OpenClaw tworzy token bearer za Ciebie z domyślnego łańcucha poświadczeń AWS, w tym wspólnych poświadczeń/profili konfiguracji, SSO, tożsamości web oraz ról instancji lub zadań.
    </Tip>

  </Tab>
</Tabs>

## Automatyczne wykrywanie modeli

Gdy `AWS_BEARER_TOKEN_BEDROCK` jest ustawiony, OpenClaw używa go bezpośrednio. W przeciwnym razie
OpenClaw próbuje wygenerować token bearer Mantle z domyślnego
łańcucha poświadczeń AWS. Następnie wykrywa dostępne modele Mantle, wysyłając zapytanie do
regionalnego punktu końcowego `/v1/models`.

| Zachowanie          | Szczegóły                         |
| ------------------- | --------------------------------- |
| Pamięć podręczna wykrywania | Wyniki są buforowane przez 1 godzinę |
| Odświeżanie tokenu IAM | Co godzinę                     |

Aby pozostawić Plugin Mantle włączony, ale wyłączyć automatyczne wykrywanie i
generowanie tokenu bearer IAM, wyłącz przełącznik wykrywania należący do Plugin:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
Token bearer to ten sam `AWS_BEARER_TOKEN_BEDROCK`, którego używa standardowy dostawca [Amazon Bedrock](/pl/providers/bedrock).
</Note>

### Obsługiwane regiony

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Konfiguracja ręczna

Jeśli wolisz jawną konfigurację zamiast automatycznego wykrywania:

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
  <Accordion title="Obsługa rozumowania">
    Obsługa rozumowania jest wnioskowana z identyfikatorów modeli zawierających wzorce takie jak
    `thinking`, `reasoner` lub `gpt-oss-120b`. OpenClaw ustawia `reasoning: true`
    automatycznie dla pasujących modeli podczas wykrywania.
  </Accordion>

  <Accordion title="Niedostępność punktu końcowego">
    Jeśli punkt końcowy Mantle jest niedostępny lub nie zwraca żadnych modeli, dostawca jest
    pomijany po cichu. OpenClaw nie zgłasza błędu; inni skonfigurowani dostawcy
    nadal działają normalnie.
  </Accordion>

  <Accordion title="Claude Opus 4.7 przez trasę Anthropic Messages">
    Mantle udostępnia także trasę Anthropic Messages, która przenosi modele Claude przez tę samą ścieżkę strumieniowania uwierzytelnianą tokenem bearer. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) można wywoływać przez tę trasę ze strumieniowaniem należącym do dostawcy, więc tokeny bearer AWS nie są traktowane jak klucze API Anthropic.

    Gdy przypniesz model Anthropic Messages u dostawcy Mantle, OpenClaw używa dla tego modelu powierzchni API `anthropic-messages` zamiast `openai-completions`. Uwierzytelnianie nadal pochodzi z `AWS_BEARER_TOKEN_BEDROCK` (lub utworzonego tokenu bearer IAM).

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

  <Accordion title="Relacja z dostawcą Amazon Bedrock">
    Bedrock Mantle jest osobnym dostawcą względem standardowego
    dostawcy [Amazon Bedrock](/pl/providers/bedrock). Mantle używa
    powierzchni `/v1` zgodnej z OpenAI, natomiast standardowy dostawca Bedrock używa
    natywnego API Bedrock.

    Obaj dostawcy współdzielą te same poświadczenie `AWS_BEARER_TOKEN_BEDROCK`, gdy
    jest dostępne.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/pl/providers/bedrock" icon="cloud">
    Natywny dostawca Bedrock dla Anthropic Claude, Titan i innych modeli.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="OAuth i uwierzytelnianie" href="/pl/gateway/authentication" icon="key">
    Szczegóły uwierzytelniania i reguły ponownego używania poświadczeń.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Typowe problemy i sposoby ich rozwiązywania.
  </Card>
</CardGroup>
