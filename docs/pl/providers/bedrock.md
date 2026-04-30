---
read_when:
    - Chcesz używać modeli Amazon Bedrock z OpenClaw
    - Do wywołań modelu potrzebna jest konfiguracja poświadczeń/regionu AWS
summary: Używaj modeli Amazon Bedrock (Converse API) z OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-30T10:12:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6c08ab141423a70e5283ddaf72bf6396bcef411dfa36e1c4b5632377f8ea2d8
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw może używać modeli **Amazon Bedrock** przez dostawcę strumieniowania **Bedrock Converse** z pi-ai. Uwierzytelnianie Bedrock używa **domyślnego łańcucha poświadczeń AWS SDK**, a nie klucza API.

| Właściwość | Wartość                                                     |
| ---------- | ----------------------------------------------------------- |
| Dostawca   | `amazon-bedrock`                                            |
| API        | `bedrock-converse-stream`                                   |
| Uwierzytelnianie | Poświadczenia AWS (zmienne env, współdzielona konfiguracja lub rola instancji) |
| Region     | `AWS_REGION` lub `AWS_DEFAULT_REGION` (domyślnie: `us-east-1`) |

## Pierwsze kroki

Wybierz preferowaną metodę uwierzytelniania i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="Klucze dostępu / zmienne env">
    **Najlepsze dla:** maszyn deweloperskich, CI lub hostów, na których bezpośrednio zarządzasz poświadczeniami AWS.

    <Steps>
      <Step title="Ustaw poświadczenia AWS na hoście gateway">
        ```bash
        export AWS_ACCESS_KEY_ID="AKIA..."
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Optional:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Optional (Bedrock API key/bearer token):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="Dodaj dostawcę Bedrock i model do swojej konfiguracji">
        `apiKey` nie jest wymagany. Skonfiguruj dostawcę z `auth: "aws-sdk"`:

        ```json5
        {
          models: {
            providers: {
              "amazon-bedrock": {
                baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
                api: "bedrock-converse-stream",
                auth: "aws-sdk",
                models: [
                  {
                    id: "us.anthropic.claude-opus-4-6-v1:0",
                    name: "Claude Opus 4.6 (Bedrock)",
                    reasoning: true,
                    input: ["text", "image"],
                    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                    contextWindow: 200000,
                    maxTokens: 8192,
                  },
                ],
              },
            },
          },
          agents: {
            defaults: {
              model: { primary: "amazon-bedrock/us.anthropic.claude-opus-4-6-v1:0" },
            },
          },
        }
        ```
      </Step>
      <Step title="Sprawdź, czy modele są dostępne">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    Przy uwierzytelnianiu przez znaczniki env (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` lub `AWS_BEARER_TOKEN_BEDROCK`) OpenClaw automatycznie włącza niejawnego dostawcę Bedrock do wykrywania modeli bez dodatkowej konfiguracji.
    </Tip>

  </Tab>

  <Tab title="Role instancji EC2 (IMDS)">
    **Najlepsze dla:** instancji EC2 z przypisaną rolą IAM, używających usługi metadanych instancji do uwierzytelniania.

    <Steps>
      <Step title="Włącz wykrywanie jawnie">
        Przy użyciu IMDS OpenClaw nie może wykryć uwierzytelniania AWS wyłącznie ze znaczników env, więc musisz je włączyć:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Opcjonalnie dodaj znacznik env dla trybu automatycznego">
        Jeśli chcesz też, aby ścieżka automatycznego wykrywania znaczników env działała (na przykład dla powierzchni `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        **Nie** potrzebujesz fałszywego klucza API.
      </Step>
      <Step title="Sprawdź, czy modele są wykrywane">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    Rola IAM przypisana do instancji EC2 musi mieć następujące uprawnienia:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (do automatycznego wykrywania)
    - `bedrock:ListInferenceProfiles` (do wykrywania profili inferencji)

    Albo przypisz zarządzaną politykę `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    `AWS_PROFILE=default` jest potrzebne tylko wtedy, gdy konkretnie chcesz mieć znacznik env dla trybu automatycznego lub powierzchni statusu. Rzeczywista ścieżka uwierzytelniania runtime Bedrock używa domyślnego łańcucha AWS SDK, więc uwierzytelnianie rolą instancji IMDS działa nawet bez znaczników env.
    </Note>

  </Tab>
</Tabs>

## Automatyczne wykrywanie modeli

OpenClaw może automatycznie wykrywać modele Bedrock, które obsługują **strumieniowanie**
i **wyjście tekstowe**. Wykrywanie używa `bedrock:ListFoundationModels` oraz
`bedrock:ListInferenceProfiles`, a wyniki są buforowane (domyślnie: 1 godzina).

Jak włączany jest niejawny dostawca:

- Jeśli `plugins.entries.amazon-bedrock.config.discovery.enabled` ma wartość `true`,
  OpenClaw spróbuje wykrywania nawet wtedy, gdy nie ma znacznika env AWS.
- Jeśli `plugins.entries.amazon-bedrock.config.discovery.enabled` nie jest ustawione,
  OpenClaw automatycznie dodaje
  niejawnego dostawcę Bedrock tylko wtedy, gdy zobaczy jeden z tych znaczników uwierzytelniania AWS:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` lub `AWS_PROFILE`.
- Rzeczywista ścieżka uwierzytelniania runtime Bedrock nadal używa domyślnego łańcucha AWS SDK, więc
  współdzielona konfiguracja, SSO i uwierzytelnianie rolą instancji IMDS mogą działać nawet wtedy, gdy wykrywanie
  wymagało `enabled: true`, aby je włączyć.

<Note>
Dla jawnych wpisów `models.providers["amazon-bedrock"]` OpenClaw nadal może wcześnie rozpoznać uwierzytelnianie przez znaczniki env Bedrock ze znaczników env AWS, takich jak `AWS_BEARER_TOKEN_BEDROCK`, bez wymuszania pełnego ładowania uwierzytelniania runtime. Rzeczywista ścieżka uwierzytelniania wywołania modelu nadal używa domyślnego łańcucha AWS SDK.
</Note>

<AccordionGroup>
  <Accordion title="Opcje konfiguracji wykrywania">
    Opcje konfiguracji znajdują się pod `plugins.entries.amazon-bedrock.config.discovery`:

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              discovery: {
                enabled: true,
                region: "us-east-1",
                providerFilter: ["anthropic", "amazon"],
                refreshInterval: 3600,
                defaultContextWindow: 32000,
                defaultMaxTokens: 4096,
              },
            },
          },
        },
      },
    }
    ```

    | Opcja | Domyślnie | Opis |
    | ----- | --------- | ---- |
    | `enabled` | auto | W trybie automatycznym OpenClaw włącza niejawnego dostawcę Bedrock tylko wtedy, gdy zobaczy obsługiwany znacznik env AWS. Ustaw `true`, aby wymusić wykrywanie. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Region AWS używany do wywołań API wykrywania. |
    | `providerFilter` | (wszystkie) | Dopasowuje nazwy dostawców Bedrock (na przykład `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Czas trwania pamięci podręcznej w sekundach. Ustaw `0`, aby wyłączyć buforowanie. |
    | `defaultContextWindow` | `32000` | Okno kontekstu używane dla wykrytych modeli (nadpisz, jeśli znasz limity swojego modelu). |
    | `defaultMaxTokens` | `4096` | Maksymalna liczba tokenów wyjściowych używana dla wykrytych modeli (nadpisz, jeśli znasz limity swojego modelu). |

  </Accordion>
</AccordionGroup>

## Szybka konfiguracja (ścieżka AWS)

Ten przewodnik tworzy rolę IAM, przypisuje uprawnienia Bedrock, kojarzy
profil instancji i włącza wykrywanie OpenClaw na hoście EC2.

```bash
# 1. Create IAM role and instance profile
aws iam create-role --role-name EC2-Bedrock-Access \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy --role-name EC2-Bedrock-Access \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam create-instance-profile --instance-profile-name EC2-Bedrock-Access
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-Bedrock-Access \
  --role-name EC2-Bedrock-Access

# 2. Attach to your EC2 instance
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. On the EC2 instance, enable discovery explicitly
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Optional: add an env marker if you want auto mode without explicit enable
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Verify models are discovered
openclaw models list
```

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Profile inferencji">
    OpenClaw wykrywa **regionalne i globalne profile inferencji** obok
    modeli bazowych. Gdy profil mapuje się na znany model bazowy,
    profil dziedziczy możliwości tego modelu (okno kontekstu, maksymalną liczbę tokenów,
    reasoning, vision), a poprawny region żądania Bedrock jest wstrzykiwany
    automatycznie. Oznacza to, że międzyregionalne profile Claude działają bez ręcznych
    nadpisań dostawcy.

    Identyfikatory profili inferencji wyglądają jak `us.anthropic.claude-opus-4-6-v1:0` (regionalne)
    albo `anthropic.claude-opus-4-6-v1:0` (globalne). Jeśli model bazowy jest już
    w wynikach wykrywania, profil dziedziczy pełny zestaw jego możliwości;
    w przeciwnym razie stosowane są bezpieczne wartości domyślne.

    Nie jest potrzebna dodatkowa konfiguracja. Dopóki wykrywanie jest włączone, a podmiot IAM
    ma `bedrock:ListInferenceProfiles`, profile pojawiają się obok
    modeli bazowych w `openclaw models list`.

  </Accordion>

  <Accordion title="Temperatura Claude Opus 4.7">
    Bedrock odrzuca parametr `temperature` dla Claude Opus 4.7. OpenClaw
    automatycznie pomija `temperature` dla każdego odwołania Bedrock do Opus 4.7, w tym
    identyfikatorów modeli bazowych, nazwanych profili inferencji, aplikacyjnych profili inferencji,
    których model bazowy rozpoznaje się jako Opus 4.7 przez
    `bedrock:GetInferenceProfile`, oraz wariantów z kropkami `opus-4.7` z
    opcjonalnymi prefiksami regionu (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`,
    `global.`). Nie jest wymagane żadne ustawienie konfiguracji, a pominięcie dotyczy zarówno
    obiektu opcji żądania, jak i pola payloadu `inferenceConfig`.
  </Accordion>

  <Accordion title="Guardrails">
    Możesz zastosować [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    do wszystkich wywołań modeli Bedrock, dodając obiekt `guardrail` do konfiguracji
    Plugin `amazon-bedrock`. Guardrails pozwalają wymuszać filtrowanie treści,
    odmowę tematów, filtry słów, filtry informacji wrażliwych oraz kontekstowe
    kontrole ugruntowania.

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // guardrail ID or full ARN
                guardrailVersion: "1", // version number or "DRAFT"
                streamProcessingMode: "sync", // optional: "sync" or "async"
                trace: "enabled", // optional: "enabled", "disabled", or "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    | Opcja | Wymagane | Opis |
    | ----- | -------- | ---- |
    | `guardrailIdentifier` | Tak | Identyfikator Guardrail (np. `abc123`) lub pełny ARN (np. `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Tak | Numer opublikowanej wersji albo `"DRAFT"` dla wersji roboczej. |
    | `streamProcessingMode` | Nie | `"sync"` albo `"async"` dla oceny guardrail podczas strumieniowania. Jeśli pominięto, Bedrock używa wartości domyślnej. |
    | `trace` | Nie | `"enabled"` albo `"enabled_full"` do debugowania; pomiń lub ustaw `"disabled"` w produkcji. |

    <Warning>
    Podmiot IAM używany przez gateway musi mieć uprawnienie `bedrock:ApplyGuardrail` oprócz standardowych uprawnień wywoływania.
    </Warning>

  </Accordion>

  <Accordion title="Osadzenia do wyszukiwania w pamięci">
    Bedrock może również działać jako dostawca osadzeń dla
    [wyszukiwania w pamięci](/pl/concepts/memory-search). Jest to konfigurowane oddzielnie od
    dostawcy wnioskowania -- ustaw `agents.defaults.memorySearch.provider` na `"bedrock"`:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // default
          },
        },
      },
    }
    ```

    Osadzenia Bedrock używają tego samego łańcucha poświadczeń AWS SDK co wnioskowanie (role
    instancji, SSO, klucze dostępu, konfiguracja współdzielona i tożsamość web identity). Klucz API nie jest
    potrzebny. Gdy `provider` ma wartość `"auto"`, Bedrock jest automatycznie wykrywany, jeśli ten
    łańcuch poświadczeń zostanie pomyślnie rozwiązany.

    Obsługiwane modele osadzeń obejmują Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) i TwelveLabs Marengo. Zobacz
    [odniesienie do konfiguracji pamięci -- Bedrock](/pl/reference/memory-config#bedrock-embedding-config),
    aby uzyskać pełną listę modeli i opcje wymiarów.

  </Accordion>

  <Accordion title="Uwagi i zastrzeżenia">
    - Bedrock wymaga włączenia **dostępu do modelu** na Twoim koncie/w regionie AWS.
    - Automatyczne wykrywanie wymaga uprawnień `bedrock:ListFoundationModels` i
      `bedrock:ListInferenceProfiles`.
    - Jeśli polegasz na trybie automatycznym, ustaw jeden z obsługiwanych znaczników środowiskowych uwierzytelniania AWS na
      hoście Gateway. Jeśli wolisz uwierzytelnianie IMDS/konfiguracji współdzielonej bez znaczników środowiskowych, ustaw
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - OpenClaw ujawnia źródło poświadczeń w tej kolejności: `AWS_BEARER_TOKEN_BEDROCK`,
      następnie `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, następnie `AWS_PROFILE`, a następnie
      domyślny łańcuch AWS SDK.
    - Obsługa rozumowania zależy od modelu; sprawdź kartę modelu Bedrock, aby poznać
      aktualne możliwości.
    - Jeśli wolisz przepływ z zarządzanym kluczem, możesz także umieścić proxy
      zgodne z OpenAI przed Bedrock i skonfigurować je zamiast tego jako dostawcę OpenAI.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Wyszukiwanie w pamięci" href="/pl/concepts/memory-search" icon="magnifying-glass">
    Osadzenia Bedrock do konfiguracji wyszukiwania w pamięci.
  </Card>
  <Card title="Odniesienie do konfiguracji pamięci" href="/pl/reference/memory-config#bedrock-embedding-config" icon="database">
    Pełna lista modeli osadzeń Bedrock i opcje wymiarów.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Ogólne rozwiązywanie problemów i FAQ.
  </Card>
</CardGroup>
