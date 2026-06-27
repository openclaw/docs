---
read_when:
    - Chcesz używać modeli Amazon Bedrock z OpenClaw
    - Do wywołań modelu potrzebna jest konfiguracja poświadczeń/regionu AWS
summary: Używaj modeli Amazon Bedrock (Converse API) z OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-06-27T18:10:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3947ad565f3a0adcd62d4ce47c6ed760f73c77ba3f4bd43b0754a412511063f2
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw może używać modeli **Amazon Bedrock** za pośrednictwem swojego dostawcy strumieniowego **Bedrock Converse**. Uwierzytelnianie Bedrock używa **domyślnego łańcucha poświadczeń AWS SDK**, a nie klucza API.

| Właściwość | Wartość                                                       |
| -------- | ----------------------------------------------------------- |
| Dostawca | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| Uwierzytelnianie | Poświadczenia AWS (zmienne env, współdzielona konfiguracja lub rola instancji) |
| Region   | `AWS_REGION` lub `AWS_DEFAULT_REGION` (domyślnie: `us-east-1`) |

## Pierwsze kroki

Wybierz preferowaną metodę uwierzytelniania i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="Klucze dostępu / zmienne env">
    **Najlepsze dla:** maszyn deweloperskich, CI lub hostów, na których bezpośrednio zarządzasz poświadczeniami AWS.

    <Steps>
      <Step title="Ustaw poświadczenia AWS na hoście gateway">
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
      <Step title="Dodaj dostawcę i model Bedrock do swojej konfiguracji">
        `apiKey` nie jest wymagane. Skonfiguruj dostawcę z `auth: "aws-sdk"`:

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
    **Najlepsze dla:** instancji EC2 z podłączoną rolą IAM, używających usługi metadanych instancji do uwierzytelniania.

    <Steps>
      <Step title="Jawnie włącz wykrywanie">
        Podczas używania IMDS OpenClaw nie może wykryć uwierzytelniania AWS wyłącznie na podstawie znaczników env, więc musisz wyrazić zgodę:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Opcjonalnie dodaj znacznik env dla trybu automatycznego">
        Jeśli chcesz też, aby działała ścieżka automatycznego wykrywania znaczników env (na przykład dla powierzchni `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        **Nie** potrzebujesz fałszywego klucza API.
      </Step>
      <Step title="Sprawdź, czy modele zostały wykryte">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    Rola IAM podłączona do Twojej instancji EC2 musi mieć następujące uprawnienia:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (do automatycznego wykrywania)
    - `bedrock:ListInferenceProfiles` (do wykrywania profili inferencji)

    Albo podłącz zarządzaną politykę `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    `AWS_PROFILE=default` jest potrzebne tylko wtedy, gdy konkretnie chcesz mieć znacznik env dla trybu automatycznego lub powierzchni statusu. Rzeczywista ścieżka uwierzytelniania środowiska wykonawczego Bedrock używa domyślnego łańcucha AWS SDK, więc uwierzytelnianie rolą instancji IMDS działa nawet bez znaczników env.
    </Note>

  </Tab>
</Tabs>

## Automatyczne wykrywanie modeli

OpenClaw może automatycznie wykrywać modele Bedrock obsługujące **strumieniowanie** i **wyjście tekstowe**. Wykrywanie używa `bedrock:ListFoundationModels` i `bedrock:ListInferenceProfiles`, a wyniki są buforowane (domyślnie: 1 godzina).

Jak włączany jest niejawny dostawca:

- Jeśli `plugins.entries.amazon-bedrock.config.discovery.enabled` ma wartość `true`,
  OpenClaw spróbuje wykrywania nawet wtedy, gdy nie ma znacznika env AWS.
- Jeśli `plugins.entries.amazon-bedrock.config.discovery.enabled` nie jest ustawione,
  OpenClaw automatycznie dodaje niejawnego dostawcę Bedrock tylko wtedy, gdy wykryje jeden z tych znaczników uwierzytelniania AWS:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` lub `AWS_PROFILE`.
- Rzeczywista ścieżka uwierzytelniania środowiska wykonawczego Bedrock nadal używa domyślnego łańcucha AWS SDK, więc współdzielona konfiguracja, SSO i uwierzytelnianie rolą instancji IMDS mogą działać nawet wtedy, gdy wykrywanie wymagało `enabled: true`, aby wyrazić zgodę.

<Note>
Dla jawnych wpisów `models.providers["amazon-bedrock"]` OpenClaw nadal może wcześnie rozwiązać uwierzytelnianie Bedrock przez znaczniki env na podstawie znaczników env AWS, takich jak `AWS_BEARER_TOKEN_BEDROCK`, bez wymuszania pełnego ładowania uwierzytelniania środowiska wykonawczego. Rzeczywista ścieżka uwierzytelniania wywołań modeli nadal używa domyślnego łańcucha AWS SDK.
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
    | ------ | ------- | ----------- |
    | `enabled` | auto | W trybie automatycznym OpenClaw włącza niejawnego dostawcę Bedrock tylko wtedy, gdy wykryje obsługiwany znacznik env AWS. Ustaw `true`, aby wymusić wykrywanie. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Region AWS używany do wywołań API wykrywania. |
    | `providerFilter` | (wszystkie) | Dopasowuje nazwy dostawców Bedrock (na przykład `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Czas trwania pamięci podręcznej w sekundach. Ustaw `0`, aby wyłączyć buforowanie. |
    | `defaultContextWindow` | `32000` | Okno kontekstu używane dla wykrytych modeli (nadpisz, jeśli znasz limity swojego modelu). |
    | `defaultMaxTokens` | `4096` | Maksymalna liczba tokenów wyjściowych używana dla wykrytych modeli (nadpisz, jeśli znasz limity swojego modelu). |

  </Accordion>
</AccordionGroup>

## Szybka konfiguracja (ścieżka AWS)

Ten przewodnik tworzy rolę IAM, podłącza uprawnienia Bedrock, kojarzy profil instancji i włącza wykrywanie OpenClaw na hoście EC2.

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
    OpenClaw wykrywa **regionalne i globalne profile inferencji** obok modeli bazowych. Gdy profil mapuje się na znany model bazowy, profil dziedziczy możliwości tego modelu (okno kontekstu, maksymalną liczbę tokenów, rozumowanie, wizję), a właściwy region żądań Bedrock jest wstrzykiwany automatycznie. Oznacza to, że międzyregionalne profile Claude działają bez ręcznych nadpisań dostawcy.

    Identyfikatory profili inferencji wyglądają jak `us.anthropic.claude-opus-4-6-v1:0` (regionalny) lub `anthropic.claude-opus-4-6-v1:0` (globalny). Jeśli model bazowy jest już w wynikach wykrywania, profil dziedziczy pełny zestaw jego możliwości; w przeciwnym razie stosowane są bezpieczne wartości domyślne.

    Nie jest wymagana dodatkowa konfiguracja. Dopóki wykrywanie jest włączone, a podmiot IAM ma `bedrock:ListInferenceProfiles`, profile pojawiają się obok modeli bazowych w `openclaw models list`.

  </Accordion>

  <Accordion title="Warstwa usługi">
    Niektóre modele Bedrock obsługują parametr `service_tier`, aby optymalizować koszt lub opóźnienie. Dostępne są następujące warstwy:

    | Warstwa | Opis |
    |------|-------------|
    | `default` | Standardowa warstwa Bedrock |
    | `flex` | Przetwarzanie ze zniżką dla obciążeń, które tolerują większe opóźnienie |
    | `priority` | Priorytetowe przetwarzanie dla obciążeń wrażliwych na opóźnienia |
    | `reserved` | Zarezerwowana pojemność dla stabilnych obciążeń |

    Ustaw `serviceTier` (lub `service_tier`) przez `agents.defaults.params` dla żądań modeli Bedrock albo dla konkretnego modelu w `agents.defaults.models["<model-key>"].params`:

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

    Prawidłowe wartości to `default`, `flex`, `priority` i `reserved`. Nie wszystkie modele obsługują wszystkie warstwy — jeśli zostanie zażądana nieobsługiwana warstwa, Bedrock zwróci błąd walidacji. Uwaga: komunikat o błędzie jest nieco mylący; może mówić „The provided model identifier is invalid”, zamiast wskazywać nieobsługiwaną warstwę usługi. Jeśli zobaczysz ten błąd, sprawdź, czy model obsługuje żądaną warstwę.

  </Accordion>

  <Accordion title="Temperatura Claude Opus 4.7">
    Bedrock odrzuca parametr `temperature` dla Claude Opus 4.7. OpenClaw automatycznie pomija `temperature` dla każdego odwołania Bedrock Opus 4.7, w tym identyfikatorów modeli bazowych, nazwanych profili inferencji, aplikacyjnych profili inferencji, których model bazowy rozwiązuje się do Opus 4.7 przez `bedrock:GetInferenceProfile`, oraz wariantów z kropką `opus-4.7` z opcjonalnymi prefiksami regionu (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`, `global.`). Nie jest wymagane żadne pokrętło konfiguracji, a pominięcie dotyczy zarówno obiektu opcji żądania, jak i pola ładunku `inferenceConfig`.
  </Accordion>

  <Accordion title="Claude Fable 5">
    Użyj `amazon-bedrock/anthropic.claude-fable-5` w `us-east-1` albo
    regionalnych identyfikatorów inferencji, takich jak `us.anthropic.claude-fable-5`.
    OpenClaw stosuje okno kontekstu Fable 1M, limit wyjścia 128K, zawsze włączone
    adaptacyjne myślenie oraz obsługiwane mapowanie poziomu wysiłku. `/think off` i
    `/think minimal` mapują się na `low`; nieobsługiwane ustawienia temperatury i
    wymuszonego wyboru narzędzia są pomijane. Wyjście strumieniowe jest wstrzymywane, aż Bedrock
    zwróci stan końcowy, aby odmowy w trakcie strumienia nie ujawniały częściowego tekstu.
    Fable obsługuje tylko standardowy poziom usługi; OpenClaw ignoruje skonfigurowane
    poziomy `flex`, `priority` i `reserved` dla tego modelu.

    AWS wymaga jawnej zgody `provider_data_share` na przechowywanie danych, zanim
    Fable będzie dostępny. Prompty i uzupełnienia są udostępniane Anthropic i
    przechowywane przez maksymalnie 30 dni na potrzeby zaufania i bezpieczeństwa. Przejrzyj i skonfiguruj
    [przechowywanie danych Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
    przed włączeniem modelu.

  </Accordion>

  <Accordion title="Mechanizmy ochronne">
    Możesz zastosować [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    do wszystkich wywołań modeli Bedrock, dodając obiekt `guardrail` do konfiguracji
    Pluginu `amazon-bedrock`. Mechanizmy ochronne pozwalają wymuszać filtrowanie treści,
    blokowanie tematów, filtry słów, filtry informacji poufnych i kontrole
    ugruntowania kontekstowego.

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
    | ------ | -------- | ----------- |
    | `guardrailIdentifier` | Tak | Identyfikator mechanizmu ochronnego (np. `abc123`) lub pełny ARN (np. `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Tak | Opublikowany numer wersji albo `"DRAFT"` dla wersji roboczej. |
    | `streamProcessingMode` | Nie | `"sync"` lub `"async"` do oceny mechanizmu ochronnego podczas strumieniowania. Jeśli pominięto, Bedrock używa wartości domyślnej. |
    | `trace` | Nie | `"enabled"` lub `"enabled_full"` do debugowania; pomiń albo ustaw `"disabled"` dla produkcji. |

    <Warning>
    Podmiot IAM używany przez Gateway musi mieć uprawnienie `bedrock:ApplyGuardrail` oprócz standardowych uprawnień do wywoływania.
    </Warning>

  </Accordion>

  <Accordion title="Osadzenia do wyszukiwania w pamięci">
    Bedrock może także działać jako dostawca osadzeń dla
    [wyszukiwania w pamięci](/pl/concepts/memory-search). Konfiguruje się to oddzielnie od
    dostawcy inferencji -- ustaw `agents.defaults.memorySearch.provider` na `"bedrock"`:

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

    Osadzenia Bedrock używają tego samego łańcucha poświadczeń AWS SDK co inferencja (role
    instancji, SSO, klucze dostępu, konfiguracja współdzielona i tożsamość sieciowa). Klucz API nie jest
    potrzebny. Ustaw jawnie `memorySearch.provider: "bedrock"`, aby używać osadzeń
    Bedrock.

    Obsługiwane modele osadzeń obejmują Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) i TwelveLabs Marengo. Zobacz
    [odniesienie konfiguracji pamięci -- Bedrock](/pl/reference/memory-config#bedrock-embedding-config),
    aby uzyskać pełną listę modeli i opcje wymiarów.

  </Accordion>

  <Accordion title="Uwagi i zastrzeżenia">
    - Bedrock wymaga włączenia **dostępu do modelu** na Twoim koncie/regionie AWS.
    - Automatyczne wykrywanie wymaga uprawnień `bedrock:ListFoundationModels` i
      `bedrock:ListInferenceProfiles`.
    - Jeśli polegasz na trybie automatycznym, ustaw jeden z obsługiwanych znaczników środowiskowych uwierzytelniania AWS na
      hoście Gateway. Jeśli wolisz uwierzytelnianie IMDS/konfiguracją współdzieloną bez znaczników środowiskowych, ustaw
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - OpenClaw pokazuje źródło poświadczeń w tej kolejności: `AWS_BEARER_TOKEN_BEDROCK`,
      następnie `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, następnie `AWS_PROFILE`, a potem
      domyślny łańcuch AWS SDK.
    - Obsługa rozumowania zależy od modelu; sprawdź kartę modelu Bedrock, aby poznać
      aktualne możliwości.
    - Jeśli wolisz zarządzany przepływ kluczy, możesz także umieścić zgodne z OpenAI
      proxy przed Bedrock i skonfigurować je zamiast tego jako dostawcę OpenAI.
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
  <Card title="Odniesienie konfiguracji pamięci" href="/pl/reference/memory-config#bedrock-embedding-config" icon="database">
    Pełna lista modeli osadzeń Bedrock i opcje wymiarów.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Ogólne rozwiązywanie problemów i FAQ.
  </Card>
</CardGroup>
