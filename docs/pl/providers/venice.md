---
read_when:
    - Chcesz korzystać z inferencji nastawionej na prywatność w OpenClaw
    - Chcesz uzyskać wskazówki konfiguracji Venice AI
summary: Używanie modeli Venice AI nastawionych na prywatność w OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-04-05T14:04:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 53313e45e197880feb7e90764ee8fd6bb7f5fd4fe03af46b594201c77fbc8eab
    source_path: providers/venice.md
    workflow: 15
---

# Venice AI (wyróżniona konfiguracja Venice)

**Venice** to nasza wyróżniona konfiguracja Venice do inferencji nastawionej na prywatność, z opcjonalnym anonimizowanym dostępem do modeli własnościowych.

Venice AI zapewnia inferencję AI skoncentrowaną na prywatności, z obsługą modeli bez cenzury i dostępem do głównych modeli własnościowych przez ich anonimizowane proxy. Cała inferencja jest domyślnie prywatna — brak trenowania na Twoich danych, brak logowania.

## Dlaczego Venice w OpenClaw

- **Prywatna inferencja** dla modeli open source (bez logowania).
- **Modele bez cenzury**, gdy ich potrzebujesz.
- **Anonimizowany dostęp** do modeli własnościowych (Opus/GPT/Gemini), gdy liczy się jakość.
- Endpointy `/v1` zgodne z OpenAI.

## Tryby prywatności

Venice oferuje dwa poziomy prywatności — zrozumienie tego ma kluczowe znaczenie przy wyborze modelu:

| Tryb           | Opis                                                                                                                                    | Modele                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Prywatny**   | W pełni prywatny. Prompty/odpowiedzi **nigdy nie są przechowywane ani logowane**. Efemeryczny.                                         | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored itd. |
| **Anonimizowany** | Przekazywany przez Venice z usuniętymi metadanymi. Bazowy dostawca (OpenAI, Anthropic, Google, xAI) widzi anonimizowane żądania. | Claude, GPT, Gemini, Grok                                     |

## Funkcje

- **Nastawienie na prywatność**: wybór między trybami „private” (w pełni prywatny) i „anonymized” (przez proxy)
- **Modele bez cenzury**: dostęp do modeli bez ograniczeń treści
- **Dostęp do głównych modeli**: używanie Claude, GPT, Gemini i Grok przez anonimizowane proxy Venice
- **API zgodne z OpenAI**: standardowe endpointy `/v1` dla łatwej integracji
- **Strumieniowanie**: ✅ obsługiwane we wszystkich modelach
- **Wywoływanie funkcji**: ✅ obsługiwane w wybranych modelach (sprawdź możliwości modelu)
- **Vision**: ✅ obsługiwane w modelach z funkcją vision
- **Brak sztywnych limitów szybkości**: przy skrajnym użyciu może być stosowane ograniczanie fair-use

## Konfiguracja

### 1. Pobierz klucz API

1. Zarejestruj się na [venice.ai](https://venice.ai)
2. Przejdź do **Settings → API Keys → Create new key**
3. Skopiuj swój klucz API (format: `vapi_xxxxxxxxxxxx`)

### 2. Skonfiguruj OpenClaw

**Opcja A: zmienna środowiskowa**

```bash
export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
```

**Opcja B: konfiguracja interaktywna (zalecane)**

```bash
openclaw onboard --auth-choice venice-api-key
```

Spowoduje to:

1. Wyświetlenie prośby o klucz API (lub użycie istniejącego `VENICE_API_KEY`)
2. Pokazanie wszystkich dostępnych modeli Venice
3. Umożliwienie wyboru modelu domyślnego
4. Automatyczne skonfigurowanie dostawcy

**Opcja C: tryb nieinteraktywny**

```bash
openclaw onboard --non-interactive \
  --auth-choice venice-api-key \
  --venice-api-key "vapi_xxxxxxxxxxxx"
```

### 3. Zweryfikuj konfigurację

```bash
openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
```

## Wybór modelu

Po konfiguracji OpenClaw pokazuje wszystkie dostępne modele Venice. Wybierz według swoich potrzeb:

- **Model domyślny**: `venice/kimi-k2-5` dla silnego prywatnego reasoning oraz vision.
- **Opcja o wysokich możliwościach**: `venice/claude-opus-4-6` dla najmocniejszej anonimizowanej ścieżki Venice.
- **Prywatność**: wybieraj modele „private” dla w pełni prywatnej inferencji.
- **Możliwości**: wybieraj modele „anonymized”, aby uzyskać dostęp do Claude, GPT, Gemini przez proxy Venice.

W dowolnym momencie zmień model domyślny:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

Wyświetl wszystkie dostępne modele:

```bash
openclaw models list | grep venice
```

## Konfiguracja przez `openclaw configure`

1. Uruchom `openclaw configure`
2. Wybierz **Model/auth**
3. Wybierz **Venice AI**

## Którego modelu powinienem używać?

| Przypadek użycia            | Zalecany model                   | Dlaczego                                      |
| --------------------------- | -------------------------------- | --------------------------------------------- |
| **Ogólny czat (domyślnie)** | `kimi-k2-5`                      | Silny prywatny reasoning oraz vision          |
| **Najlepsza ogólna jakość** | `claude-opus-4-6`                | Najmocniejsza anonimizowana opcja Venice      |
| **Prywatność + kodowanie**  | `qwen3-coder-480b-a35b-instruct` | Prywatny model do kodowania z dużym kontekstem |
| **Prywatne vision**         | `kimi-k2-5`                      | Obsługa vision bez opuszczania trybu prywatnego |
| **Szybko i tanio**          | `qwen3-4b`                       | Lekki model reasoning                         |
| **Złożone prywatne zadania**| `deepseek-v3.2`                  | Silny reasoning, ale bez obsługi narzędzi Venice |
| **Bez cenzury**             | `venice-uncensored`              | Brak ograniczeń treści                        |

## Dostępne modele (łącznie 41)

### Modele prywatne (26) — w pełni prywatne, bez logowania

| Model ID                               | Nazwa                               | Kontekst | Funkcje                    |
| -------------------------------------- | ----------------------------------- | -------- | -------------------------- |
| `kimi-k2-5`                            | Kimi K2.5                           | 256k     | Domyślny, reasoning, vision |
| `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k     | Reasoning                  |
| `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k     | Ogólne                     |
| `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k     | Ogólne                     |
| `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B             | 128k     | Ogólne, narzędzia wyłączone |
| `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                 | 128k     | Reasoning                  |
| `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                 | 128k     | Ogólne                     |
| `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                    | 256k     | Kodowanie                  |
| `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo              | 256k     | Kodowanie                  |
| `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                     | 256k     | Reasoning, vision          |
| `qwen3-next-80b`                       | Qwen3 Next 80B                      | 256k     | Ogólne                     |
| `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)              | 256k     | Vision                     |
| `qwen3-4b`                             | Venice Small (Qwen3 4B)             | 32k      | Szybki, reasoning          |
| `deepseek-v3.2`                        | DeepSeek V3.2                       | 160k     | Reasoning, narzędzia wyłączone |
| `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k      | Bez cenzury, narzędzia wyłączone |
| `mistral-31-24b`                       | Venice Medium (Mistral)             | 128k     | Vision                     |
| `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct         | 198k     | Vision                     |
| `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                 | 128k     | Ogólne                     |
| `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B          | 128k     | Ogólne                     |
| `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic               | 128k     | Reasoning                  |
| `zai-org-glm-4.6`                      | GLM 4.6                             | 198k     | Ogólne                     |
| `zai-org-glm-4.7`                      | GLM 4.7                             | 198k     | Reasoning                  |
| `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                       | 128k     | Reasoning                  |
| `zai-org-glm-5`                        | GLM 5                               | 198k     | Reasoning                  |
| `minimax-m21`                          | MiniMax M2.1                        | 198k     | Reasoning                  |
| `minimax-m25`                          | MiniMax M2.5                        | 198k     | Reasoning                  |

### Modele anonimizowane (15) — przez proxy Venice

| Model ID                        | Nazwa                          | Kontekst | Funkcje                    |
| ------------------------------- | ------------------------------ | -------- | -------------------------- |
| `claude-opus-4-6`               | Claude Opus 4.6 (przez Venice) | 1M       | Reasoning, vision          |
| `claude-opus-4-5`               | Claude Opus 4.5 (przez Venice) | 198k     | Reasoning, vision          |
| `claude-sonnet-4-6`             | Claude Sonnet 4.6 (przez Venice) | 1M     | Reasoning, vision          |
| `claude-sonnet-4-5`             | Claude Sonnet 4.5 (przez Venice) | 198k   | Reasoning, vision          |
| `openai-gpt-54`                 | GPT-5.4 (przez Venice)         | 1M       | Reasoning, vision          |
| `openai-gpt-53-codex`           | GPT-5.3 Codex (przez Venice)   | 400k     | Reasoning, vision, kodowanie |
| `openai-gpt-52`                 | GPT-5.2 (przez Venice)         | 256k     | Reasoning                  |
| `openai-gpt-52-codex`           | GPT-5.2 Codex (przez Venice)   | 256k     | Reasoning, vision, kodowanie |
| `openai-gpt-4o-2024-11-20`      | GPT-4o (przez Venice)          | 128k     | Vision                     |
| `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (przez Venice)     | 128k     | Vision                     |
| `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (przez Venice)  | 1M       | Reasoning, vision          |
| `gemini-3-pro-preview`          | Gemini 3 Pro (przez Venice)    | 198k     | Reasoning, vision          |
| `gemini-3-flash-preview`        | Gemini 3 Flash (przez Venice)  | 256k     | Reasoning, vision          |
| `grok-41-fast`                  | Grok 4.1 Fast (przez Venice)   | 1M       | Reasoning, vision          |
| `grok-code-fast-1`              | Grok Code Fast 1 (przez Venice) | 256k    | Reasoning, kodowanie       |

## Wykrywanie modeli

OpenClaw automatycznie wykrywa modele z API Venice, gdy ustawione jest `VENICE_API_KEY`. Jeśli API jest nieosiągalne, następuje powrót do statycznego katalogu.

Endpoint `/models` jest publiczny (do wyświetlania listy nie jest wymagane uwierzytelnianie), ale inferencja wymaga prawidłowego klucza API.

## Strumieniowanie i obsługa narzędzi

| Funkcja              | Obsługa                                                    |
| -------------------- | ---------------------------------------------------------- |
| **Strumieniowanie**  | ✅ Wszystkie modele                                        |
| **Wywoływanie funkcji** | ✅ Większość modeli (sprawdź `supportsFunctionCalling` w API) |
| **Vision/obrazy**    | ✅ Modele oznaczone funkcją „Vision”                       |
| **Tryb JSON**        | ✅ Obsługiwany przez `response_format`                     |

## Ceny

Venice używa systemu opartego na kredytach. Sprawdź [venice.ai/pricing](https://venice.ai/pricing), aby zobaczyć aktualne stawki:

- **Modele prywatne**: zazwyczaj niższy koszt
- **Modele anonimizowane**: podobne do bezpośrednich cen API + niewielka opłata Venice

## Porównanie: Venice vs bezpośrednie API

| Aspekt        | Venice (anonimizowane)          | Bezpośrednie API       |
| ------------- | ------------------------------- | ---------------------- |
| **Prywatność** | Metadane usunięte, anonimizacja | Twoje konto jest powiązane |
| **Opóźnienie** | +10-50ms (proxy)               | Bezpośrednio           |
| **Funkcje**    | Większość funkcji obsługiwana  | Pełne funkcje          |
| **Rozliczanie** | Kredyty Venice                 | Rozliczanie dostawcy   |

## Przykłady użycia

```bash
# Użyj domyślnego modelu prywatnego
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Użyj Claude Opus przez Venice (anonimizowane)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Użyj modelu bez cenzury
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Użyj modelu vision z obrazem
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Użyj modelu do kodowania
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## Rozwiązywanie problemów

### Klucz API nie jest rozpoznawany

```bash
echo $VENICE_API_KEY
openclaw models list | grep venice
```

Upewnij się, że klucz zaczyna się od `vapi_`.

### Model jest niedostępny

Katalog modeli Venice jest aktualizowany dynamicznie. Uruchom `openclaw models list`, aby zobaczyć aktualnie dostępne modele. Niektóre modele mogą być tymczasowo offline.

### Problemy z połączeniem

API Venice znajduje się pod adresem `https://api.venice.ai/api/v1`. Upewnij się, że Twoja sieć zezwala na połączenia HTTPS.

## Przykład pliku konfiguracyjnego

```json5
{
  env: { VENICE_API_KEY: "vapi_..." },
  agents: { defaults: { model: { primary: "venice/kimi-k2-5" } } },
  models: {
    mode: "merge",
    providers: {
      venice: {
        baseUrl: "https://api.venice.ai/api/v1",
        apiKey: "${VENICE_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2-5",
            name: "Kimi K2.5",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## Linki

- [Venice AI](https://venice.ai)
- [Dokumentacja API](https://docs.venice.ai)
- [Cennik](https://venice.ai/pricing)
- [Status](https://status.venice.ai)
