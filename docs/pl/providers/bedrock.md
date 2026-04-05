---
read_when:
    - Chcesz używać modeli Amazon Bedrock z OpenClaw
    - Potrzebujesz konfiguracji poświadczeń/regionu AWS do wywołań modeli
summary: Używanie modeli Amazon Bedrock (Converse API) z OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-05T14:03:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: a751824b679a9340db714ee5227e8d153f38f6c199ca900458a4ec092b4efe54
    source_path: providers/bedrock.md
    workflow: 15
---

# Amazon Bedrock

OpenClaw może używać modeli **Amazon Bedrock** przez dostawcę strumieniowego **Bedrock Converse**
z pi-ai. Uwierzytelnianie Bedrock używa **domyślnego łańcucha poświadczeń AWS SDK**,
a nie klucza API.

## Co obsługuje pi-ai

- Dostawca: `amazon-bedrock`
- API: `bedrock-converse-stream`
- Uwierzytelnianie: poświadczenia AWS (zmienne środowiskowe, współdzielona konfiguracja lub rola instancji)
- Region: `AWS_REGION` lub `AWS_DEFAULT_REGION` (domyślnie: `us-east-1`)

## Automatyczne wykrywanie modeli

OpenClaw może automatycznie wykrywać modele Bedrock, które obsługują **strumieniowanie**
i **wyjście tekstowe**. Wykrywanie używa `bedrock:ListFoundationModels` oraz
`bedrock:ListInferenceProfiles`, a wyniki są przechowywane w cache (domyślnie: 1 godzina).

Jak włączany jest niejawny dostawca:

- Jeśli `plugins.entries.amazon-bedrock.config.discovery.enabled` ma wartość `true`,
  OpenClaw spróbuje wykrywania nawet wtedy, gdy nie ma żadnego znacznika środowiska AWS.
- Jeśli `plugins.entries.amazon-bedrock.config.discovery.enabled` nie jest ustawione,
  OpenClaw automatycznie doda
  niejawnego dostawcę Bedrock tylko wtedy, gdy zobaczy jeden z tych znaczników uwierzytelniania AWS:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` lub `AWS_PROFILE`.
- Rzeczywista ścieżka uwierzytelniania runtime Bedrock nadal używa domyślnego łańcucha AWS SDK, więc
  współdzielona konfiguracja, SSO i uwierzytelnianie roli instancji IMDS mogą działać nawet wtedy, gdy wykrywanie
  wymagało `enabled: true`, aby je włączyć.

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

Uwagi:

- `enabled` domyślnie działa w trybie automatycznym. W trybie automatycznym OpenClaw włącza
  niejawnego dostawcę Bedrock tylko wtedy, gdy wykryje obsługiwany znacznik środowiska AWS.
- `region` domyślnie przyjmuje wartość z `AWS_REGION` lub `AWS_DEFAULT_REGION`, a następnie `us-east-1`.
- `providerFilter` dopasowuje nazwy dostawców Bedrock (na przykład `anthropic`).
- `refreshInterval` jest wyrażone w sekundach; ustaw `0`, aby wyłączyć cache.
- `defaultContextWindow` (domyślnie: `32000`) i `defaultMaxTokens` (domyślnie: `4096`)
  są używane dla wykrytych modeli (nadpisz je, jeśli znasz limity swojego modelu).
- Dla jawnych wpisów `models.providers["amazon-bedrock"]` OpenClaw nadal może
  wcześnie rozwiązywać uwierzytelnianie oparte na znacznikach środowiska Bedrock na podstawie znaczników środowiska AWS, takich jak
  `AWS_BEARER_TOKEN_BEDROCK`, bez wymuszania pełnego ładowania uwierzytelniania runtime. Rzeczywista
  ścieżka uwierzytelniania wywołań modelu nadal używa domyślnego łańcucha AWS SDK.

## Onboarding

1. Upewnij się, że poświadczenia AWS są dostępne na **hoście gateway**:

```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"
# Opcjonalnie:
export AWS_SESSION_TOKEN="..."
export AWS_PROFILE="your-profile"
# Opcjonalnie (klucz API/token bearer Bedrock):
export AWS_BEARER_TOKEN_BEDROCK="..."
```

2. Dodaj dostawcę Bedrock i model do swojej konfiguracji (bez wymaganego `apiKey`):

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

## Role instancji EC2

Podczas uruchamiania OpenClaw na instancji EC2 z dołączoną rolą IAM AWS SDK
może używać usługi metadanych instancji (IMDS) do uwierzytelniania. W przypadku wykrywania modeli Bedrock
OpenClaw automatycznie włącza niejawnego dostawcę tylko na podstawie znaczników środowiska AWS,
chyba że jawnie ustawisz
`plugins.entries.amazon-bedrock.config.discovery.enabled: true`.

Zalecana konfiguracja dla hostów opartych na IMDS:

- Ustaw `plugins.entries.amazon-bedrock.config.discovery.enabled` na `true`.
- Ustaw `plugins.entries.amazon-bedrock.config.discovery.region` (lub wyeksportuj `AWS_REGION`).
- **Nie** potrzebujesz sztucznego klucza API.
- Potrzebujesz `AWS_PROFILE=default` tylko wtedy, gdy konkretnie chcesz mieć znacznik środowiska
  dla trybu automatycznego lub powierzchni statusu.

```bash
# Zalecane: jawne włączenie wykrywania + region
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# Opcjonalnie: dodaj znacznik środowiska, jeśli chcesz trybu automatycznego bez jawnego włączenia
export AWS_PROFILE=default
export AWS_REGION=us-east-1
```

**Wymagane uprawnienia IAM** dla roli instancji EC2:

- `bedrock:InvokeModel`
- `bedrock:InvokeModelWithResponseStream`
- `bedrock:ListFoundationModels` (dla automatycznego wykrywania)
- `bedrock:ListInferenceProfiles` (dla wykrywania profili inferencyjnych)

Lub dołącz zarządzaną politykę `AmazonBedrockFullAccess`.

## Szybka konfiguracja (ścieżka AWS)

```bash
# 1. Utwórz rolę IAM i profil instancji
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

# 2. Dołącz do swojej instancji EC2
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. Na instancji EC2 jawnie włącz wykrywanie
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Opcjonalnie: dodaj znacznik środowiska, jeśli chcesz trybu automatycznego bez jawnego włączenia
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Zweryfikuj, że modele zostały wykryte
openclaw models list
```

## Profile inferencyjne

OpenClaw wykrywa **regionalne i globalne profile inferencyjne** obok
modeli bazowych. Gdy profil mapuje się na znany model bazowy,
profil dziedziczy możliwości tego modelu (okno kontekstu, maksymalna liczba tokenów,
reasoning, vision), a poprawny region żądania Bedrock jest wstrzykiwany
automatycznie. Oznacza to, że międzyregionalne profile Claude działają bez ręcznych
nadpisań dostawcy.

Identyfikatory profili inferencyjnych wyglądają jak `us.anthropic.claude-opus-4-6-v1:0` (regionalne)
lub `anthropic.claude-opus-4-6-v1:0` (globalne). Jeśli model bazowy już znajduje się
w wynikach wykrywania, profil dziedziczy jego pełny zestaw możliwości;
w przeciwnym razie stosowane są bezpieczne wartości domyślne.

Nie jest potrzebna żadna dodatkowa konfiguracja. Dopóki wykrywanie jest włączone, a jednostka IAM
ma uprawnienie `bedrock:ListInferenceProfiles`, profile pojawiają się obok
modeli bazowych w `openclaw models list`.

## Uwagi

- Bedrock wymaga włączenia **dostępu do modelu** na Twoim koncie/regionie AWS.
- Automatyczne wykrywanie wymaga uprawnień `bedrock:ListFoundationModels` oraz
  `bedrock:ListInferenceProfiles`.
- Jeśli polegasz na trybie automatycznym, ustaw jeden z obsługiwanych znaczników środowiska uwierzytelniania AWS na
  hoście gateway. Jeśli wolisz uwierzytelnianie IMDS/współdzielonej konfiguracji bez znaczników środowiska, ustaw
  `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
- OpenClaw pokazuje źródło poświadczeń w tej kolejności: `AWS_BEARER_TOKEN_BEDROCK`,
  następnie `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, potem `AWS_PROFILE`, a na końcu
  domyślny łańcuch AWS SDK.
- Obsługa reasoning zależy od modelu; sprawdź kartę modelu Bedrock, aby poznać
  aktualne możliwości.
- Jeśli wolisz zarządzany przepływ kluczy, możesz też umieścić przed Bedrock
  proxy zgodne z OpenAI i skonfigurować je zamiast tego jako dostawcę OpenAI.

## Guardrails

Możesz zastosować [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
do wszystkich wywołań modeli Bedrock, dodając obiekt `guardrail` do
konfiguracji wtyczki `amazon-bedrock`. Guardrails pozwalają wymuszać filtrowanie treści,
blokowanie tematów, filtry słów, filtry informacji wrażliwych oraz
kontrole osadzenia kontekstowego.

```json5
{
  plugins: {
    entries: {
      "amazon-bedrock": {
        config: {
          guardrail: {
            guardrailIdentifier: "abc123", // ID guardrail lub pełny ARN
            guardrailVersion: "1", // numer wersji lub "DRAFT"
            streamProcessingMode: "sync", // opcjonalnie: "sync" lub "async"
            trace: "enabled", // opcjonalnie: "enabled", "disabled" lub "enabled_full"
          },
        },
      },
    },
  },
}
```

- `guardrailIdentifier` (wymagane) akceptuje ID guardrail (np. `abc123`) lub
  pełny ARN (np. `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`).
- `guardrailVersion` (wymagane) określa, której opublikowanej wersji użyć, lub
  `"DRAFT"` dla roboczej wersji roboczej.
- `streamProcessingMode` (opcjonalne) kontroluje, czy ocena guardrail działa
  synchronicznie (`"sync"`) czy asynchronicznie (`"async"`) podczas strumieniowania. Jeśli
  zostanie pominięte, Bedrock użyje swojego domyślnego zachowania.
- `trace` (opcjonalne) włącza dane śledzenia guardrail w odpowiedzi API. Ustaw
  `"enabled"` lub `"enabled_full"` do debugowania; pomiń lub ustaw `"disabled"` w
  środowisku produkcyjnym.

Jednostka IAM używana przez gateway musi mieć uprawnienie `bedrock:ApplyGuardrail`
oprócz standardowych uprawnień wywołania.
