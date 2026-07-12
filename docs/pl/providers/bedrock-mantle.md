---
read_when:
    - Chcesz używać modeli OSS hostowanych w Bedrock Mantle z OpenClaw
    - Potrzebujesz punktu końcowego Mantle zgodnego z OpenAI dla GPT-OSS, Qwen, Kimi lub GLM
    - Chcesz używać Claude Sonnet 5 lub Mythos 5 za pośrednictwem Amazon Bedrock Mantle
summary: Korzystaj z modeli Amazon Bedrock Mantle zgodnych z OpenAI oraz modeli Claude Messages w OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-07-12T15:28:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 107ffdc76e3971a085f7d64d8d766f6cd8706ce882d8bab80d27c72ab545eec1
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw zawiera wbudowanego dostawcę **Amazon Bedrock Mantle**, który łączy się z
punktem końcowym Mantle zgodnym z OpenAI. Mantle udostępnia modele open source i
modele innych firm (GPT-OSS, Qwen, Kimi, GLM i podobne) przez standardowy
interfejs `/v1/chat/completions` oparty na infrastrukturze Bedrock. Mantle
udostępnia również modele Anthropic Claude za pośrednictwem trasy Anthropic Messages.

| Właściwość       | Wartość                                                                                  |
| -------------- | -------------------------------------------------------------------------------------- |
| Identyfikator dostawcy | `amazon-bedrock-mantle`                                                                |
| API            | `openai-completions` dla wykrytych modeli OSS, `anthropic-messages` dla modeli Claude |
| Uwierzytelnianie | Jawny `AWS_BEARER_TOKEN_BEDROCK` lub generowanie tokenu okaziciela za pomocą łańcucha poświadczeń IAM |
| Region domyślny | `us-east-1` (można zastąpić przez `AWS_REGION` lub `AWS_DEFAULT_REGION`)                       |

## Pierwsze kroki

Wybierz preferowaną metodę uwierzytelniania i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="Explicit bearer token">
    **Najlepsze rozwiązanie dla:** środowisk, w których masz już token okaziciela Mantle.

    <Steps>
      <Step title="Set the bearer token on the gateway host">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Opcjonalnie ustaw region (domyślnie `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        Wykryte modele pojawią się w ramach dostawcy `amazon-bedrock-mantle`. Nie
        jest wymagana dodatkowa konfiguracja, chyba że chcesz zastąpić wartości domyślne.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM credentials">
    **Najlepsze rozwiązanie dla:** używania poświadczeń zgodnych z AWS SDK (wspólna konfiguracja, SSO, tożsamość internetowa, role instancji lub zadań).

    <Steps>
      <Step title="Configure AWS credentials on the gateway host">
        Działa każde źródło uwierzytelniania zgodne z AWS SDK:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        OpenClaw automatycznie generuje token okaziciela Mantle z łańcucha poświadczeń.
      </Step>
    </Steps>

    <Tip>
    Gdy `AWS_BEARER_TOKEN_BEDROCK` nie jest ustawiony, OpenClaw tworzy token okaziciela na podstawie domyślnego łańcucha poświadczeń AWS, w tym współdzielonych poświadczeń i profili konfiguracji, SSO, tożsamości internetowej oraz ról instancji lub zadań.
    </Tip>

  </Tab>
</Tabs>

## Automatyczne wykrywanie modeli

Gdy ustawiony jest `AWS_BEARER_TOKEN_BEDROCK`, OpenClaw używa go bezpośrednio. W przeciwnym razie
OpenClaw próbuje wygenerować token okaziciela Mantle na podstawie domyślnego
łańcucha poświadczeń AWS. Następnie wykrywa dostępne modele Mantle, wysyłając zapytanie do
regionalnego punktu końcowego `/v1/models`.

| Zachowanie          | Szczegóły                                                                               |
| ----------------- | ------------------------------------------------------------------------------------ |
| Pamięć podręczna wykrywania | Wyniki są buforowane przez 1 godzinę dla każdego regionu; niepowodzenie pobierania zwraca ostatni zapisany wynik |
| Odświeżanie tokenu IAM | Co 2 godziny, z buforowaniem dla każdego regionu                                                     |

Aby pozostawić Plugin Mantle włączony, ale wyłączyć automatyczne wykrywanie i generowanie
tokenu okaziciela IAM, wyłącz należący do Pluginu przełącznik wykrywania:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
Jest to ten sam token okaziciela `AWS_BEARER_TOKEN_BEDROCK`, którego używa standardowy dostawca [Amazon Bedrock](/pl/providers/bedrock).
</Note>

### Obsługiwane regiony

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Konfiguracja ręczna

Jeśli zamiast automatycznego wykrywania wolisz jawną konfigurację:

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

Jawna, niepusta lista `models` jest rozstrzygająca i zastępuje każdy
wykryty wiersz, w tym poniższe wiersze Claude. Pomiń `models`, aby zachować
automatyczny katalog Mantle, albo uwzględnij kompletne wpisy modeli Claude,
których chcesz używać.

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Reasoning support">
    Obsługa rozumowania jest ustalana na podstawie identyfikatorów modeli zawierających wzorce takie jak
    `thinking`, `reasoner`, `reasoning`, `deepseek.r`, `gpt-oss-120b` lub
    `gpt-oss-safeguard-120b`. Podczas wykrywania OpenClaw automatycznie ustawia
    `reasoning: true` dla pasujących modeli.
  </Accordion>

  <Accordion title="Endpoint unavailability">
    Jeśli punkt końcowy Mantle jest niedostępny, nie zwraca modeli albo nie uda się
    rozpoznać tokenu okaziciela, wykrywanie zwraca pusty wynik, a niejawny
    dostawca jest pomijany. OpenClaw nie zgłasza błędu; pozostali skonfigurowani dostawcy
    nadal działają normalnie.
  </Accordion>

  <Accordion title="Claude via the Anthropic Messages route">
    Gdy lista modeli jest zarządzana przez automatyczne wykrywanie, po pomyślnym wyszukaniu OpenClaw
    dodaje cztery modele Claude, niezależnie od tego, co zwraca `/v1/models`:
    `amazon-bedrock-mantle/anthropic.claude-sonnet-5` (Claude Sonnet 5),
    `amazon-bedrock-mantle/anthropic.claude-opus-4-7` (Claude Opus 4.7) oraz
    `amazon-bedrock-mantle/anthropic.claude-mythos-5` (Claude Mythos 5), a także
    `amazon-bedrock-mantle/anthropic.claude-mythos-preview` (Claude Mythos
    Preview). Korzystają one z interfejsu API `anthropic-messages` i przesyłają strumieniowo dane przez
    ten sam uwierzytelniany tokenem okaziciela punkt końcowy zgodny z Anthropic
    (`<mantle-base>/anthropic`), dlatego token okaziciela AWS nie jest traktowany jak
    klucz API Anthropic.

    Claude Sonnet 5 zawsze korzysta z adaptacyjnego rozumowania i domyślnie używa poziomu nakładu `high`.
    `/think off` oraz `/think minimal` są mapowane na `low`, ponieważ trasa Mantle
    nie może wyłączyć rozumowania. OpenClaw pomija również niestandardową temperaturę
    w żądaniach Sonnet 5.

    Dostęp do Claude Mythos 5 jest ograniczony. Model udostępnia okno kontekstu obejmujące 1 000 000 tokenów
    oraz limit danych wyjściowych wynoszący 128 000 tokenów, zawsze korzysta z adaptacyjnego rozumowania, mapuje
    `/think off` oraz `/think minimal` na `low` i pomija parametry
    próbkowania wybrane przez wywołującego.

    Claude Mythos Preview zawsze żąda rozumowania, domyślnie używając poziomu nakładu `high`,
    gdy nie ustawiono poziomu `/think` (`xhigh`/`max` są mapowane w dół na
    `high`, a `minimal` w górę na `low`). Opus 4.7 w Mantle przesyła dane strumieniowo bez
    rozumowania dostarczanego przez model, a OpenClaw pomija jego parametr `temperature`,
    ponieważ Opus 4.7 nie akceptuje zastępowania ustawień próbkowania na tej trasie; Mythos
    Preview normalnie akceptuje zastąpienie wartości `temperature`.

    Niepusta jawna lista `models.providers["amazon-bedrock-mantle"].models`
    zastępuje cały wykryty katalog. Pomiń tę listę, jeśli chcesz
    korzystać z tych wbudowanych wierszy Claude.

  </Accordion>

  <Accordion title="Relationship to Amazon Bedrock provider">
    Bedrock Mantle jest dostawcą odrębnym od standardowego dostawcy
    [Amazon Bedrock](/pl/providers/bedrock). Mantle używa interfejsu
    zgodnego z OpenAI `/v1` dla swojego katalogu OSS, natomiast standardowy
    dostawca Bedrock używa natywnego API Bedrock Converse.

    Obaj dostawcy używają tego samego poświadczenia `AWS_BEARER_TOKEN_BEDROCK`, gdy
    jest ono dostępne.

  </Accordion>
</AccordionGroup>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/pl/providers/bedrock" icon="cloud">
    Natywny dostawca Bedrock dla Anthropic Claude, Titan i innych modeli.
  </Card>
  <Card title="Model selection" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="OAuth and auth" href="/pl/gateway/authentication" icon="key">
    Szczegóły uwierzytelniania i zasady ponownego używania poświadczeń.
  </Card>
  <Card title="Troubleshooting" href="/pl/help/troubleshooting" icon="wrench">
    Typowe problemy i sposoby ich rozwiązywania.
  </Card>
</CardGroup>
