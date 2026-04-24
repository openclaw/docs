---
read_when:
    - Chcesz inference z naciskiem na prywatność w OpenClaw.
    - Chcesz wskazówek dotyczących konfiguracji Venice AI.
summary: Używanie modeli Venice AI z naciskiem na prywatność w OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-04-24T09:30:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab50c76ce33bd67d51bd897ac574e08d4e4e394470bed9fe686758ce39aded91
    source_path: providers/venice.md
    workflow: 15
---

Venice AI zapewnia **inference AI z naciskiem na prywatność** z obsługą modeli bez cenzury oraz dostępem do głównych modeli własnościowych przez ich anonimizujące proxy. Cały inference jest domyślnie prywatny — bez treningu na twoich danych, bez logowania.

## Dlaczego Venice w OpenClaw

- **Prywatny inference** dla modeli open-source (bez logowania).
- **Modele bez cenzury**, gdy ich potrzebujesz.
- **Zanonimizowany dostęp** do modeli własnościowych (Opus/GPT/Gemini), gdy liczy się jakość.
- Endpointy `/v1` zgodne z OpenAI.

## Tryby prywatności

Venice oferuje dwa poziomy prywatności — zrozumienie tego jest kluczowe przy wyborze modelu:

| Tryb           | Opis                                                                                                                            | Modele                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Private**    | W pełni prywatny. Prompty/odpowiedzi **nigdy nie są przechowywane ani logowane**. Ephemeral.                                  | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored itd.  |
| **Anonymized** | Przekazywany przez Venice z usuniętymi metadanymi. Bazowy dostawca (OpenAI, Anthropic, Google, xAI) widzi zanonimizowane żądania. | Claude, GPT, Gemini, Grok                                     |

<Warning>
Modele anonymized **nie** są w pełni prywatne. Venice usuwa metadane przed przekazaniem dalej, ale bazowy dostawca (OpenAI, Anthropic, Google, xAI) nadal przetwarza żądanie. Wybieraj modele **Private**, gdy wymagana jest pełna prywatność.
</Warning>

## Funkcje

- **Z naciskiem na prywatność**: wybór między trybem „private” (w pełni prywatny) i „anonymized” (przez proxy)
- **Modele bez cenzury**: dostęp do modeli bez ograniczeń treści
- **Dostęp do głównych modeli**: używaj Claude, GPT, Gemini i Grok przez anonimizujące proxy Venice
- **API zgodne z OpenAI**: standardowe endpointy `/v1` dla łatwej integracji
- **Streaming**: obsługiwany we wszystkich modelach
- **Function calling**: obsługiwane w wybranych modelach (sprawdź możliwości modelu)
- **Vision**: obsługiwane w modelach z możliwością vision
- **Brak twardych limitów rate limit**: przy skrajnym użyciu może mieć zastosowanie throttling fair-use

## Pierwsze kroki

<Steps>
  <Step title="Pobierz klucz API">
    1. Zarejestruj się na [venice.ai](https://venice.ai)
    2. Przejdź do **Settings > API Keys > Create new key**
    3. Skopiuj klucz API (format: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="Skonfiguruj OpenClaw">
    Wybierz preferowaną metodę konfiguracji:

    <Tabs>
      <Tab title="Interaktywnie (zalecane)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        To:
        1. Poprosi o twój klucz API (albo użyje istniejącego `VENICE_API_KEY`)
        2. Pokaże wszystkie dostępne modele Venice
        3. Pozwoli wybrać model domyślny
        4. Skonfiguruje dostawcę automatycznie
      </Tab>
      <Tab title="Zmienna środowiskowa">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="Nieinteraktywnie">
        ```bash
        openclaw onboard --non-interactive \
          --auth-choice venice-api-key \
          --venice-api-key "vapi_xxxxxxxxxxxx"
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Zweryfikuj konfigurację">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## Wybór modelu

Po konfiguracji OpenClaw pokazuje wszystkie dostępne modele Venice. Wybieraj zależnie od potrzeb:

- **Model domyślny**: `venice/kimi-k2-5` dla mocnego prywatnego reasoning plus vision.
- **Opcja o wysokich możliwościach**: `venice/claude-opus-4-6` dla najmocniejszej zanonimizowanej ścieżki Venice.
- **Prywatność**: wybieraj modele „private” dla w pełni prywatnego inference.
- **Możliwości**: wybieraj modele „anonymized”, aby uzyskać dostęp do Claude, GPT, Gemini przez proxy Venice.

Zmień model domyślny w dowolnym momencie:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

Wyświetl wszystkie dostępne modele:

```bash
openclaw models list | grep venice
```

Możesz też uruchomić `openclaw configure`, wybrać **Model/auth** i następnie **Venice AI**.

<Tip>
Użyj poniższej tabeli, aby dobrać właściwy model do swojego przypadku użycia.

| Przypadek użycia             | Zalecany model                    | Dlaczego                                      |
| ---------------------------- | --------------------------------- | --------------------------------------------- |
| **Ogólny czat (domyślnie)**  | `kimi-k2-5`                       | Mocny prywatny reasoning plus vision          |
| **Najlepsza ogólna jakość**  | `claude-opus-4-6`                 | Najmocniejsza zanonimizowana opcja Venice     |
| **Prywatność + kodowanie**   | `qwen3-coder-480b-a35b-instruct`  | Prywatny model do kodowania z dużym kontekstem |
| **Prywatne vision**          | `kimi-k2-5`                       | Obsługa vision bez wychodzenia z trybu private |
| **Szybko + tanio**           | `qwen3-4b`                        | Lekki model reasoning                         |
| **Złożone prywatne zadania** | `deepseek-v3.2`                   | Mocny reasoning, ale bez obsługi narzędzi Venice |
| **Bez cenzury**              | `venice-uncensored`               | Bez ograniczeń treści                         |

</Tip>

## Wbudowany katalog (łącznie 41)

<AccordionGroup>
  <Accordion title="Modele Private (26) — w pełni prywatne, bez logowania">
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
  </Accordion>

  <Accordion title="Modele Anonymized (15) — przez proxy Venice">
    | Model ID                        | Nazwa                          | Kontekst | Funkcje                   |
    | ------------------------------- | ------------------------------ | -------- | ------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (przez Venice) | 1M       | Reasoning, vision         |
    | `claude-opus-4-5`               | Claude Opus 4.5 (przez Venice) | 198k     | Reasoning, vision         |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (przez Venice) | 1M     | Reasoning, vision         |
    | `claude-sonnet-4-5`             | Claude Sonnet 4.5 (przez Venice) | 198k   | Reasoning, vision         |
    | `openai-gpt-54`                 | GPT-5.4 (przez Venice)         | 1M       | Reasoning, vision         |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (przez Venice)   | 400k     | Reasoning, vision, coding |
    | `openai-gpt-52`                 | GPT-5.2 (przez Venice)         | 256k     | Reasoning                 |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (przez Venice)   | 256k     | Reasoning, vision, coding |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (przez Venice)          | 128k     | Vision                    |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (przez Venice)     | 128k     | Vision                    |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (przez Venice)  | 1M       | Reasoning, vision         |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (przez Venice)    | 198k     | Reasoning, vision         |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (przez Venice)  | 256k     | Reasoning, vision         |
    | `grok-41-fast`                  | Grok 4.1 Fast (przez Venice)   | 1M       | Reasoning, vision         |
    | `grok-code-fast-1`              | Grok Code Fast 1 (przez Venice) | 256k    | Reasoning, coding         |
  </Accordion>
</AccordionGroup>

## Wykrywanie modeli

OpenClaw automatycznie wykrywa modele z API Venice, gdy ustawiono `VENICE_API_KEY`. Jeśli API jest nieosiągalne, używany jest fallback do statycznego katalogu.

Endpoint `/models` jest publiczny (nie wymaga auth do listowania), ale inference wymaga prawidłowego klucza API.

## Streaming i obsługa narzędzi

| Funkcja              | Obsługa                                              |
| -------------------- | ---------------------------------------------------- |
| **Streaming**        | Wszystkie modele                                     |
| **Function calling** | Większość modeli (sprawdź `supportsFunctionCalling` w API) |
| **Vision/Images**    | Modele oznaczone funkcją „Vision”                    |
| **JSON mode**        | Obsługiwane przez `response_format`                  |

## Cennik

Venice używa systemu opartego na kredytach. Aktualne stawki znajdziesz na [venice.ai/pricing](https://venice.ai/pricing):

- **Modele Private**: zazwyczaj niższy koszt
- **Modele Anonymized**: podobnie jak bezpośrednie ceny API + niewielka opłata Venice

### Venice (anonymized) vs bezpośrednie API

| Aspekt        | Venice (Anonymized)            | Bezpośrednie API    |
| ------------- | ------------------------------ | ------------------- |
| **Prywatność** | Metadane usunięte, anonimizacja | Powiązane z twoim kontem |
| **Opóźnienie** | +10-50ms (proxy)               | Bezpośrednio        |
| **Funkcje**    | Większość funkcji obsługiwana  | Pełne funkcje       |
| **Billing**    | Kredyty Venice                 | Rozliczenia dostawcy |

## Przykłady użycia

```bash
# Use the default private model
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Use Claude Opus via Venice (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Use uncensored model
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Use vision model with image
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Use coding model
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Klucz API nie jest rozpoznawany">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    Upewnij się, że klucz zaczyna się od `vapi_`.

  </Accordion>

  <Accordion title="Model niedostępny">
    Katalog modeli Venice aktualizuje się dynamicznie. Uruchom `openclaw models list`, aby zobaczyć aktualnie dostępne modele. Niektóre modele mogą być tymczasowo offline.
  </Accordion>

  <Accordion title="Problemy z połączeniem">
    API Venice znajduje się pod adresem `https://api.venice.ai/api/v1`. Upewnij się, że twoja sieć pozwala na połączenia HTTPS.
  </Accordion>
</AccordionGroup>

<Note>
Więcej pomocy: [Rozwiązywanie problemów](/pl/help/troubleshooting) i [FAQ](/pl/help/faq).
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Przykład pliku konfiguracji">
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
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania failover.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Strona główna Venice AI i rejestracja konta.
  </Card>
  <Card title="Dokumentacja API" href="https://docs.venice.ai" icon="book">
    Dokumentacja referencyjna Venice API i materiały deweloperskie.
  </Card>
  <Card title="Cennik" href="https://venice.ai/pricing" icon="credit-card">
    Aktualne stawki kredytów i plany Venice.
  </Card>
</CardGroup>
