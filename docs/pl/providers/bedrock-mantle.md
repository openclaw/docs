---
read_when:
    - Chcesz używać modeli OSS hostowanych przez Bedrock Mantle z OpenClaw
    - Potrzebujesz zgodnego z OpenAI punktu końcowego Mantle dla GPT-OSS, Qwen, Kimi lub GLM
summary: Używaj modeli Amazon Bedrock Mantle (zgodnych z OpenAI) w OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-05-10T19:51:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 721eef5b7ff606b8c5e02234dae1b8d846b43ff9f3d7bf871f701bb3136fec0e
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw zawiera dołączonego dostawcę **Amazon Bedrock Mantle**, który łączy się z
punktem końcowym Mantle zgodnym z OpenAI. Mantle hostuje modele open source i
modele innych firm (GPT-OSS, Qwen, Kimi, GLM i podobne) przez standardową
powierzchnię `/v1/chat/completions` opartą na infrastrukturze Bedrock.

| Właściwość        | Wartość                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| ID dostawcy       | `amazon-bedrock-mantle`                                                                           |
| API               | `openai-completions` (zgodne z OpenAI) lub `anthropic-messages` (trasa Anthropic Messages)        |
| Uwierzytelnianie  | Jawne `AWS_BEARER_TOKEN_BEDROCK` lub generowanie tokena bearer z łańcucha poświadczeń IAM         |
| Domyślny region   | `us-east-1` (nadpisz za pomocą `AWS_REGION` lub `AWS_DEFAULT_REGION`)                             |

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
      <Step title="Zweryfikuj, że modele zostały wykryte">
        ```bash
        openclaw models list
        ```

        Wykryte modele pojawią się pod dostawcą `amazon-bedrock-mantle`. Nie jest
        wymagana dodatkowa konfiguracja, chyba że chcesz nadpisać wartości domyślne.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Poświadczenia IAM">
    **Najlepsze dla:** używania poświadczeń zgodnych z AWS SDK (wspólna konfiguracja, SSO, tożsamość web identity, role instancji lub zadań).

    <Steps>
      <Step title="Skonfiguruj poświadczenia AWS na hoście Gateway">
        Działa każde źródło uwierzytelniania zgodne z AWS SDK:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Zweryfikuj, że modele zostały wykryte">
        ```bash
        openclaw models list
        ```

        OpenClaw automatycznie generuje token bearer Mantle z łańcucha poświadczeń.
      </Step>
    </Steps>

    <Tip>
    Gdy `AWS_BEARER_TOKEN_BEDROCK` nie jest ustawione, OpenClaw tworzy token bearer za Ciebie z domyślnego łańcucha poświadczeń AWS, w tym ze wspólnych poświadczeń/profili konfiguracji, SSO, web identity oraz ról instancji lub zadań.
    </Tip>

  </Tab>
</Tabs>

## Automatyczne wykrywanie modeli

Gdy `AWS_BEARER_TOKEN_BEDROCK` jest ustawione, OpenClaw używa go bezpośrednio. W przeciwnym razie
OpenClaw próbuje wygenerować token bearer Mantle z domyślnego
łańcucha poświadczeń AWS. Następnie wykrywa dostępne modele Mantle, odpytując
regionalny punkt końcowy `/v1/models`.

| Zachowanie             | Szczegół                         |
| ---------------------- | -------------------------------- |
| Pamięć podręczna wykrywania | Wyniki buforowane przez 1 godzinę |
| Odświeżanie tokena IAM | Co godzinę                       |

Aby pozostawić Plugin Mantle włączony, ale wyłączyć automatyczne wykrywanie i generowanie
tokenu bearer IAM, wyłącz przełącznik wykrywania należący do Plugin:

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
    pomijany bez komunikatu. OpenClaw nie zgłasza błędu; inni skonfigurowani dostawcy
    nadal działają normalnie.
  </Accordion>

  <Accordion title="Claude Opus 4.7 przez trasę Anthropic Messages">
    Mantle udostępnia także trasę Anthropic Messages, która przenosi modele Claude przez tę samą ścieżkę strumieniowania uwierzytelnianą tokenem bearer. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) można wywołać przez tę trasę ze strumieniowaniem należącym do dostawcy, więc tokeny bearer AWS nie są traktowane jak klucze API Anthropic.

    Gdy przypniesz model Anthropic Messages u dostawcy Mantle, OpenClaw używa powierzchni API `anthropic-messages` zamiast `openai-completions` dla tego modelu. Uwierzytelnianie nadal pochodzi z `AWS_BEARER_TOKEN_BEDROCK` (lub z utworzonego tokena bearer IAM).

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
    dostawcy [Amazon Bedrock](/pl/providers/bedrock). Mantle używa powierzchni
    `/v1` zgodnej z OpenAI, podczas gdy standardowy dostawca Bedrock używa
    natywnego API Bedrock.

    Obaj dostawcy współdzielą to samo poświadczenie `AWS_BEARER_TOKEN_BEDROCK`, gdy
    jest obecne.

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
    Szczegóły uwierzytelniania i reguły ponownego użycia poświadczeń.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Typowe problemy i sposoby ich rozwiązywania.
  </Card>
</CardGroup>
