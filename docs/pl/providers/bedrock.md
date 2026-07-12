---
read_when:
    - Chcesz używać modeli Amazon Bedrock z OpenClaw
    - Do wywołań modelu wymagana jest konfiguracja poświadczeń i regionu AWS
summary: Korzystanie z modeli Amazon Bedrock (Converse API) w OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-07-12T15:33:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fda4f5ab8ffcd68012cf78fbedb9fabec36d9742f16518ea4dd38418b2220b7b
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw może korzystać z modeli **Amazon Bedrock** za pośrednictwem swojego dostawcy strumieniowego **Bedrock Converse**. Uwierzytelnianie Bedrock korzysta z **domyślnego łańcucha poświadczeń AWS SDK**, a nie z klucza API.

| Właściwość       | Wartość                                                                |
| ---------------- | ---------------------------------------------------------------------- |
| Dostawca         | `amazon-bedrock`                                                       |
| API              | `bedrock-converse-stream`                                              |
| Uwierzytelnianie | Poświadczenia AWS (zmienne środowiskowe, konfiguracja współdzielona lub rola instancji) |
| Region           | `AWS_REGION` lub `AWS_DEFAULT_REGION` (domyślnie: `us-east-1`)          |

## Pierwsze kroki

Wybierz preferowaną metodę uwierzytelniania i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="Access keys / env vars">
    **Najlepsze zastosowanie:** komputery deweloperskie, CI lub hosty, na których bezpośrednio zarządzasz poświadczeniami AWS.

    <Steps>
      <Step title="Set AWS credentials on the gateway host">
        ```bash
        export AWS_ACCESS_KEY_ID="EXAMPLE_AWS_ACCESS_KEY_ID"
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Optional:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Optional (Bedrock API key/bearer token):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="Add a Bedrock provider and model to your config">
        `apiKey` nie jest wymagany. Skonfiguruj dostawcę z ustawieniem `auth: "aws-sdk"`:

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
      <Step title="Verify models are available">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    W przypadku uwierzytelniania za pomocą znaczników środowiskowych (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` lub `AWS_BEARER_TOKEN_BEDROCK`) OpenClaw automatycznie włącza niejawnego dostawcę Bedrock na potrzeby wykrywania modeli bez dodatkowej konfiguracji.
    </Tip>

  </Tab>

  <Tab title="EC2 instance roles (IMDS)">
    **Najlepsze zastosowanie:** instancje EC2 z przypisaną rolą IAM, które używają usługi metadanych instancji do uwierzytelniania.

    <Steps>
      <Step title="Enable discovery explicitly">
        Podczas korzystania z IMDS OpenClaw nie może wykryć uwierzytelniania AWS wyłącznie na podstawie znaczników środowiskowych, dlatego musisz jawnie je włączyć:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Optionally add an env marker for auto mode">
        Jeśli chcesz również korzystać z automatycznego wykrywania na podstawie znaczników środowiskowych, na przykład w widokach `openclaw status`:

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        **Nie** potrzebujesz fikcyjnego klucza API.
      </Step>
      <Step title="Verify models are discovered">
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
    - `bedrock:ListInferenceProfiles` (do wykrywania profili wnioskowania)

    Możesz też przypisać zarządzaną zasadę `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    Ustawienie `AWS_PROFILE=default` jest potrzebne tylko wtedy, gdy konkretnie chcesz używać znacznika środowiskowego dla trybu automatycznego lub widoków stanu. Właściwa ścieżka uwierzytelniania środowiska uruchomieniowego Bedrock korzysta z domyślnego łańcucha AWS SDK, dlatego uwierzytelnianie rolą instancji przez IMDS działa nawet bez znaczników środowiskowych.
    </Note>

  </Tab>
</Tabs>

## Automatyczne wykrywanie modeli

OpenClaw może automatycznie wykrywać modele Bedrock obsługujące **strumieniowanie**
i **wyjście tekstowe**. Wykrywanie korzysta z `bedrock:ListFoundationModels` oraz
`bedrock:ListInferenceProfiles`, a wyniki są buforowane (domyślnie przez 1 godzinę).

Sposób włączania niejawnego dostawcy:

- Jeśli `plugins.entries.amazon-bedrock.config.discovery.enabled` ma wartość `true`,
  OpenClaw podejmie próbę wykrywania nawet wtedy, gdy nie ma żadnego znacznika środowiskowego AWS.
- Jeśli `plugins.entries.amazon-bedrock.config.discovery.enabled` nie jest ustawione,
  OpenClaw automatycznie dodaje niejawnego dostawcę Bedrock tylko wtedy, gdy wykryje
  jeden z następujących znaczników uwierzytelniania AWS:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` lub `AWS_PROFILE`.
- Właściwa ścieżka uwierzytelniania środowiska uruchomieniowego Bedrock nadal
  korzysta z domyślnego łańcucha AWS SDK, dlatego konfiguracja współdzielona, SSO
  i uwierzytelnianie rolą instancji przez IMDS mogą działać nawet wtedy, gdy
  wykrywanie wymagało jawnego włączenia za pomocą `enabled: true`.

<Note>
W przypadku jawnych wpisów `models.providers["amazon-bedrock"]` OpenClaw może nadal wcześnie rozpoznać uwierzytelnianie Bedrock na podstawie znaczników środowiskowych AWS, takich jak `AWS_BEARER_TOKEN_BEDROCK`, bez wymuszania pełnego ładowania uwierzytelniania środowiska uruchomieniowego. Właściwa ścieżka uwierzytelniania wywołań modeli nadal korzysta z domyślnego łańcucha AWS SDK.
</Note>

<AccordionGroup>
  <Accordion title="Discovery config options">
    Opcje konfiguracji znajdują się w `plugins.entries.amazon-bedrock.config.discovery`:

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

    | Opcja | Wartość domyślna | Opis |
    | ----- | ---------------- | ---- |
    | `enabled` | auto | W trybie automatycznym OpenClaw włącza niejawnego dostawcę Bedrock tylko wtedy, gdy wykryje obsługiwany znacznik środowiskowy AWS. Ustaw `true`, aby wymusić wykrywanie. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Region AWS używany do wywołań API wykrywania. |
    | `providerFilter` | (wszyscy) | Dopasowuje nazwy dostawców Bedrock, na przykład `anthropic` lub `amazon`. |
    | `refreshInterval` | `3600` | Czas przechowywania pamięci podręcznej w sekundach. Ustaw `0`, aby wyłączyć buforowanie. |
    | `defaultContextWindow` | `32000` | Okno kontekstu używane dla wykrytych modeli bez znanych limitów tokenów; zastąp tę wartość, jeśli znasz limity swojego modelu. |
    | `defaultMaxTokens` | `4096` | Maksymalna liczba tokenów wyjściowych używana dla wykrytych modeli bez znanych limitów tokenów; zastąp tę wartość, jeśli znasz limity swojego modelu. |

  </Accordion>

  <Accordion title="Context window and max-token limits">
    Interfejsy API Bedrock `ListFoundationModels` i `GetFoundationModel` nie
    zwracają metadanych limitów tokenów, a jedynie identyfikator i nazwę modelu,
    modalności oraz stan cyklu życia. OpenClaw zawiera tabelę wyszukiwania znanych
    okien kontekstu i limitów wyjściowych popularnych modeli Bedrock (Claude, Nova,
    Llama, Mistral, DeepSeek i innych), dzięki czemu zarządzanie sesjami, progi
    Compaction i wykrywanie przepełnienia kontekstu działają prawidłowo dla tych modeli.

    Wykryte modele, których nie ma w tabeli, korzystają z wartości
    `defaultContextWindow` i `defaultMaxTokens`. Jeśli model, którego używasz, nie
    ma dokładnych limitów, zastąp je za pomocą jawnego wpisu
    `models.providers["amazon-bedrock"].models`.

  </Accordion>
</AccordionGroup>

## Szybka konfiguracja (ścieżka AWS)

Ten przewodnik tworzy rolę IAM, przypisuje uprawnienia Bedrock, wiąże profil
instancji i włącza wykrywanie OpenClaw na hoście EC2.

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
  <Accordion title="Inference profiles">
    OpenClaw wykrywa **regionalne i globalne profile wnioskowania** wraz z
    modelami bazowymi. Gdy profil jest powiązany ze znanym modelem bazowym,
    dziedziczy możliwości tego modelu (okno kontekstu, maksymalną liczbę tokenów,
    rozumowanie i obsługę obrazów), a prawidłowy region żądania Bedrock jest
    wstawiany automatycznie. Oznacza to, że międzyregionalne profile Claude działają
    bez ręcznego zastępowania ustawień dostawcy. Globalne profile międzyregionalne
    (`global.*`) są wyświetlane jako pierwsze w `openclaw models list`, ponieważ
    zazwyczaj oferują większą przepustowość i automatyczne przełączanie awaryjne.

    Identyfikatory profili wnioskowania mają postać `us.anthropic.claude-opus-4-6-v1:0`
    (regionalne) lub `anthropic.claude-opus-4-6-v1:0` (globalne). Jeśli model bazowy
    znajduje się już w wynikach wykrywania, profil dziedziczy jego pełny zestaw
    możliwości; w przeciwnym razie stosowane są bezpieczne wartości domyślne.

    Dodatkowa konfiguracja nie jest wymagana. Jeśli wykrywanie jest włączone,
    a podmiot IAM ma uprawnienie `bedrock:ListInferenceProfiles`, profile pojawiają
    się obok modeli bazowych w `openclaw models list`.

  </Accordion>

  <Accordion title="Service tier">
    Niektóre modele Bedrock obsługują parametr `service_tier`, który umożliwia
    optymalizację kosztu lub opóźnienia. Dostępne są następujące poziomy:

    | Poziom | Opis |
    |--------|------|
    | `default` | Standardowy poziom Bedrock |
    | `flex` | Tańsze przetwarzanie obciążeń, które mogą tolerować większe opóźnienie |
    | `priority` | Priorytetowe przetwarzanie obciążeń wrażliwych na opóźnienia |
    | `reserved` | Zarezerwowana przepustowość dla obciążeń o stałym charakterze |

    Ustaw `serviceTier` (lub `service_tier`) za pomocą `agents.defaults.params`
    dla żądań modeli Bedrock albo osobno dla każdego modelu w
    `agents.defaults.models["<model-key>"].params`:

    ```json5
    {
      agents: {
        defaults: {
          params: {
            serviceTier: "flex", // applies to all models
          },
          models: {
            "amazon-bedrock/mistral.mistral-large-3-675b-instruct": {
              params: {
                serviceTier: "priority", // per-model override
              },
            },
          },
        },
      },
    }
    ```

    Prawidłowe wartości to `default`, `flex`, `priority` i `reserved`. Claude
    Fable 5 i Sonnet 5 obsługują wyłącznie warstwę `default`; OpenClaw wyświetla
    ostrzeżenie i ignoruje wartości `flex`, `priority` lub `reserved` żądane dla
    tych modeli. W przypadku innych modeli nie każdy model obsługuje każdą
    warstwę — nieobsługiwana warstwa powoduje błąd walidacji Bedrock, a komunikat
    o błędzie może być mylący (na przykład „Podany identyfikator modelu jest
    nieprawidłowy” zamiast wskazania warstwy jako źródła problemu). Jeśli zobaczysz
    ten błąd, sprawdź, czy model obsługuje żądaną warstwę.

  </Accordion>

  <Accordion title="Claude Opus 4.7 and 4.8 temperature">
    Bedrock odrzuca parametr `temperature` w przypadku Claude Opus 4.7 i Opus
    4.8. OpenClaw automatycznie pomija `temperature` dla każdego pasującego
    odwołania Bedrock, w tym identyfikatorów modeli bazowych, nazwanych profili
    wnioskowania, profili wnioskowania aplikacji, których model bazowy jest
    rozpoznawany jako Opus 4.7/4.8 za pośrednictwem `bedrock:GetInferenceProfile`,
    oraz wariantów `opus-4.7`/`opus-4.8` z kropkami i opcjonalnymi prefiksami
    regionów (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`, `global.`). Nie jest
    wymagane żadne ustawienie konfiguracyjne, a pominięcie dotyczy zarówno obiektu
    opcji żądania, jak i pola `inferenceConfig` w ładunku.
  </Accordion>

  <Accordion title="Claude Fable 5">
    Użyj `amazon-bedrock/anthropic.claude-fable-5` w regionie `us-east-1` albo
    regionalnych identyfikatorów wnioskowania, takich jak
    `us.anthropic.claude-fable-5`. OpenClaw stosuje dla Fable okno kontekstu 1M,
    limit wyjścia 128K, zawsze włączone myślenie adaptacyjne oraz mapowanie
    obsługiwanych poziomów wysiłku. `/think off` i `/think minimal` są mapowane
    na `low`; temperatura i wymuszony wybór narzędzia są pomijane, tak samo jak
    na ścieżce Opus 4.7/4.8. Dane wyjściowe przesyłane strumieniowo są
    wstrzymywane do chwili, gdy Bedrock zwróci stan końcowy, dzięki czemu odmowy
    występujące w trakcie transmisji nie ujawniają częściowego tekstu.

    AWS wymaga jawnej zgody `provider_data_share` na przechowywanie danych,
    zanim Fable stanie się dostępny. Polecenia i odpowiedzi są udostępniane
    firmie Anthropic i przechowywane przez maksymalnie 30 dni na potrzeby
    zaufania i bezpieczeństwa. Przed włączeniem modelu zapoznaj się z zasadami
    [przechowywania danych w Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
    i odpowiednio je skonfiguruj.

  </Accordion>

  <Accordion title="Claude Mythos 5">
    Claude Mythos 5 jest dostępny za pośrednictwem Bedrock wyłącznie dla kont
    posiadających wymagane zatwierdzenie ograniczonego dostępu. OpenClaw
    rozpoznaje model bazowy `anthropic.claude-mythos-5` oraz regionalne lub
    globalne profile wnioskowania, takie jak `us.anthropic.claude-mythos-5`.

    OpenClaw stosuje okno kontekstu o rozmiarze 1 000 000 tokenów, limit wyjścia
    wynoszący 128 000 tokenów, obsługę obrazów wejściowych, buforowanie poleceń,
    transmisję strumieniową zabezpieczoną na wypadek odmowy oraz natywne poziomy
    wysiłku. Myślenie adaptacyjne jest zawsze włączone: `/think off` i
    `/think minimal` są mapowane na `low`, natomiast `xhigh` i `max` pozostają
    dostępne. Niestandardowe parametry próbkowania i wartości wymuszonego wyboru
    narzędzia są pomijane.

  </Accordion>

  <Accordion title="Claude Sonnet 5">
    AWS dokumentuje Sonnet 5 zarówno dla punktów końcowych
    [`bedrock-runtime`, jak i `bedrock-mantle`](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-sonnet-5.html).
    OpenClaw rozpoznaje model bazowy Bedrock `anthropic.claude-sonnet-5` oraz
    regionalne lub globalne profile wnioskowania, takie jak
    `us.anthropic.claude-sonnet-5`. Stosuje okno kontekstu o rozmiarze 1 000 000
    tokenów, limit wyjścia wynoszący 128 000 tokenów, obsługę obrazów wejściowych,
    natywne poziomy wysiłku, buforowanie poleceń oraz transmisję strumieniową
    zabezpieczoną na wypadek odmowy.

    Bedrock utrzymuje włączone myślenie adaptacyjne dla Sonnet 5. OpenClaw
    domyślnie używa wartości `high`; `/think off` i `/think minimal` są mapowane
    na `low`, ponieważ ta ścieżka nie pozwala wyłączyć myślenia. Niestandardowa
    temperatura i wartości wymuszonego wyboru narzędzia są pomijane, gdy
    myślenie adaptacyjne jest aktywne.

  </Accordion>

  <Accordion title="Guardrails">
    Możesz zastosować [mechanizmy zabezpieczające Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    do wszystkich wywołań modeli Bedrock, dodając obiekt `guardrail` do
    konfiguracji pluginu `amazon-bedrock`. Mechanizmy zabezpieczające umożliwiają
    wymuszanie filtrowania treści, blokowania tematów, filtrów słów, filtrów
    informacji poufnych oraz kontroli ugruntowania kontekstowego.

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

    Wartości `guardrailIdentifier` i `guardrailVersion` są wymagane.

    | Opcja | Opis |
    | ------ | ----------- |
    | `guardrailIdentifier` | Identyfikator mechanizmu zabezpieczającego (np. `abc123`) lub pełny ARN (np. `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Numer opublikowanej wersji albo `"DRAFT"` w przypadku wersji roboczej. |
    | `streamProcessingMode` | `"sync"` lub `"async"` do oceny mechanizmu zabezpieczającego podczas transmisji strumieniowej. Jeśli wartość zostanie pominięta, Bedrock użyje ustawienia domyślnego. |
    | `trace` | `"enabled"` lub `"enabled_full"` do debugowania; w środowisku produkcyjnym pomiń tę opcję albo ustaw `"disabled"`. |

    <Warning>
    Podmiot IAM używany przez Gateway musi mieć uprawnienie `bedrock:ApplyGuardrail` oprócz standardowych uprawnień do wywoływania.
    </Warning>

  </Accordion>

  <Accordion title="Embeddings for memory search">
    Bedrock może także pełnić funkcję dostawcy reprezentacji wektorowych dla
    [wyszukiwania w pamięci](/pl/concepts/memory-search). Konfiguruje się go oddzielnie
    od dostawcy wnioskowania — ustaw `agents.defaults.memorySearch.provider` na
    `"bedrock"`:

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

    Reprezentacje wektorowe Bedrock używają tego samego łańcucha poświadczeń
    AWS SDK co wnioskowanie (role instancji, SSO, klucze dostępu, współdzielona
    konfiguracja i tożsamość internetowa). Klucz API nie jest wymagany.

    Obsługiwane modele reprezentacji wektorowych obejmują Amazon Titan Embed
    (v1, v2), Amazon Nova Embed, Cohere Embed (v3, v4) i TwelveLabs Marengo.
    Pełną listę modeli i opcje wymiarów znajdziesz w
    [dokumentacji konfiguracji pamięci — Bedrock](/pl/reference/memory-config#bedrock-embedding-config).

  </Accordion>

  <Accordion title="Notes and caveats">
    - Bedrock wymaga włączenia **dostępu do modelu** na koncie AWS i w danym regionie.
    - Automatyczne wykrywanie wymaga uprawnień `bedrock:ListFoundationModels` i
      `bedrock:ListInferenceProfiles`.
    - Jeśli korzystasz z trybu automatycznego, ustaw jeden z obsługiwanych znaczników
      środowiskowych uwierzytelniania AWS na hoście Gatewaya. Jeśli wolisz
      uwierzytelnianie IMDS lub współdzieloną konfigurację bez znaczników
      środowiskowych, ustaw `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - OpenClaw przedstawia źródło poświadczeń w następującej kolejności:
      `AWS_BEARER_TOKEN_BEDROCK`, następnie `AWS_ACCESS_KEY_ID` +
      `AWS_SECRET_ACCESS_KEY`, potem `AWS_PROFILE`, a na końcu domyślny łańcuch
      AWS SDK.
    - Obsługa rozumowania zależy od modelu; sprawdź aktualne możliwości w karcie
      modelu Bedrock.
    - Jeśli wolisz zarządzany przepływ kluczy, możesz także umieścić przed Bedrock
      serwer proxy zgodny z OpenAI i skonfigurować go jako dostawcę OpenAI.
  </Accordion>
</AccordionGroup>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Model selection" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i sposobu obsługi przełączania awaryjnego.
  </Card>
  <Card title="Memory search" href="/pl/concepts/memory-search" icon="magnifying-glass">
    Konfiguracja reprezentacji wektorowych Bedrock do wyszukiwania w pamięci.
  </Card>
  <Card title="Memory config reference" href="/pl/reference/memory-config#bedrock-embedding-config" icon="database">
    Pełna lista modeli reprezentacji wektorowych Bedrock i opcje wymiarów.
  </Card>
  <Card title="Troubleshooting" href="/pl/help/troubleshooting" icon="wrench">
    Ogólne informacje o rozwiązywaniu problemów i często zadawane pytania.
  </Card>
</CardGroup>
