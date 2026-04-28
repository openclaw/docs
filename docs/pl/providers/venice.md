---
read_when:
    - Chcesz korzystać z wnioskowania z naciskiem na prywatność w OpenClaw
    - Potrzebujesz wskazówek dotyczących konfiguracji Venice AI
summary: Używaj modeli Venice AI z naciskiem na prywatność w OpenClaw
title: Venice AI
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-26T11:39:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8396d17485b96262e352449d1524c2b8a8457edcdb92b0d0d6520d1032f8287
    source_path: providers/venice.md
    workflow: 15
---

Venice AI zapewnia **wnioskowanie AI z naciskiem na prywatność** z obsługą modeli bez cenzury oraz dostępem do głównych modeli własnościowych za pośrednictwem ich anonimizowanego proxy. Całe wnioskowanie jest domyślnie prywatne — bez trenowania na Twoich danych i bez logowania.

## Dlaczego Venice w OpenClaw

- **Prywatne wnioskowanie** dla modeli open source (bez logowania).
- **Modele bez cenzury**, gdy ich potrzebujesz.
- **Anonimizowany dostęp** do modeli własnościowych (Opus/GPT/Gemini), gdy liczy się jakość.
- Endpointy `/v1` zgodne z OpenAI.

## Tryby prywatności

Venice oferuje dwa poziomy prywatności — zrozumienie tej różnicy jest kluczowe przy wyborze modelu:

| Tryb           | Opis                                                                                                                              | Modele                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Prywatny**   | W pełni prywatny. Prompty/odpowiedzi **nigdy nie są przechowywane ani logowane**. Efemeryczny.                                   | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored itp.  |
| **Anonimizowany** | Przekazywany przez Venice z usuniętymi metadanymi. Dostawca bazowy (OpenAI, Anthropic, Google, xAI) widzi zanonimizowane żądania. | Claude, GPT, Gemini, Grok                                     |

<Warning>
Modele anonimizowane **nie są** w pełni prywatne. Venice usuwa metadane przed przekazaniem dalej, ale bazowy dostawca (OpenAI, Anthropic, Google, xAI) nadal przetwarza żądanie. Wybieraj modele **Prywatne**, gdy wymagana jest pełna prywatność.
</Warning>

## Funkcje

- **Z naciskiem na prywatność**: Wybór między trybem „prywatnym” (w pełni prywatnym) a „anonimizowanym” (przez proxy)
- **Modele bez cenzury**: Dostęp do modeli bez ograniczeń treści
- **Dostęp do głównych modeli**: Korzystaj z Claude, GPT, Gemini i Grok przez anonimizowane proxy Venice
- **API zgodne z OpenAI**: Standardowe endpointy `/v1` ułatwiające integrację
- **Streaming**: Obsługiwany we wszystkich modelach
- **Wywoływanie funkcji**: Obsługiwane w wybranych modelach (sprawdź możliwości modelu)
- **Vision**: Obsługiwane w modelach z obsługą vision
- **Brak twardych limitów szybkości**: Przy skrajnym użyciu może zostać zastosowane ograniczanie w ramach uczciwego użycia

## Pierwsze kroki

<Steps>
  <Step title="Pobierz swój klucz API">
    1. Zarejestruj się na [venice.ai](https://venice.ai)
    2. Przejdź do **Settings > API Keys > Create new key**
    3. Skopiuj swój klucz API (format: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="Skonfiguruj OpenClaw">
    Wybierz preferowaną metodę konfiguracji:

    <Tabs>
      <Tab title="Interaktywnie (zalecane)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        Spowoduje to:
        1. Wyświetlenie prośby o klucz API (lub użycie istniejącego `VENICE_API_KEY`)
        2. Pokazanie wszystkich dostępnych modeli Venice
        3. Umożliwienie wybrania domyślnego modelu
        4. Automatyczną konfigurację dostawcy
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

Po konfiguracji OpenClaw pokazuje wszystkie dostępne modele Venice. Wybieraj zgodnie ze swoimi potrzebami:

- **Model domyślny**: `venice/kimi-k2-5` dla mocnego prywatnego rozumowania oraz vision.
- **Opcja o najwyższych możliwościach**: `venice/claude-opus-4-6` dla najmocniejszej anonimizowanej ścieżki Venice.
- **Prywatność**: Wybieraj modele „prywatne” dla w pełni prywatnego wnioskowania.
- **Możliwości**: Wybieraj modele „anonimizowane”, aby uzyskać dostęp do Claude, GPT, Gemini przez proxy Venice.

Zmień domyślny model w dowolnym momencie:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

Wyświetl listę wszystkich dostępnych modeli:

```bash
openclaw models list | grep venice
```

Możesz też uruchomić `openclaw configure`, wybrać **Model/auth** i następnie **Venice AI**.

<Tip>
Skorzystaj z poniższej tabeli, aby dobrać odpowiedni model do swojego przypadku użycia.

| Przypadek użycia             | Zalecany model                   | Dlaczego                                     |
| ---------------------------- | -------------------------------- | -------------------------------------------- |
| **Czat ogólny (domyślny)**   | `kimi-k2-5`                      | Mocne prywatne rozumowanie oraz vision       |
| **Najlepsza ogólna jakość**  | `claude-opus-4-6`                | Najmocniejsza anonimizowana opcja Venice     |
| **Prywatność + kodowanie**   | `qwen3-coder-480b-a35b-instruct` | Prywatny model do kodowania z dużym kontekstem |
| **Prywatne vision**          | `kimi-k2-5`                      | Obsługa vision bez wychodzenia z trybu prywatnego |
| **Szybko i tanio**           | `qwen3-4b`                       | Lekki model rozumowania                      |
| **Złożone prywatne zadania** | `deepseek-v3.2`                  | Mocne rozumowanie, ale bez obsługi narzędzi Venice |
| **Bez cenzury**              | `venice-uncensored`              | Bez ograniczeń treści                        |

</Tip>

## Zachowanie odtwarzania DeepSeek V4

Jeśli Venice udostępnia modele DeepSeek V4, takie jak `venice/deepseek-v4-pro` lub
`venice/deepseek-v4-flash`, OpenClaw uzupełnia wymagany placeholder odtwarzania DeepSeek V4
`reasoning_content` w turach wywołania narzędzi przez asystenta, gdy
proxy go pomija. Venice odrzuca natywną, najwyższego poziomu kontrolkę `thinking` DeepSeek,
dlatego OpenClaw utrzymuje tę specyficzną dla dostawcy poprawkę odtwarzania oddzielnie od natywnych
kontrolek thinking dostawcy DeepSeek.

## Wbudowany katalog (łącznie 41)

<AccordionGroup>
  <Accordion title="Modele prywatne (26) — w pełni prywatne, bez logowania">
    | ID modelu                              | Nazwa                               | Kontekst | Funkcje                    |
    | -------------------------------------- | ----------------------------------- | -------- | -------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k     | Domyślny, rozumowanie, vision |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k     | Rozumowanie                |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k     | Ogólne                     |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k     | Ogólne                     |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B             | 128k     | Ogólne, narzędzia wyłączone |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                 | 128k     | Rozumowanie                |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                 | 128k     | Ogólne                     |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                    | 256k     | Kodowanie                  |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo              | 256k     | Kodowanie                  |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                     | 256k     | Rozumowanie, vision        |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                      | 256k     | Ogólne                     |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)              | 256k     | Vision                     |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)             | 32k      | Szybki, rozumowanie        |
    | `deepseek-v3.2`                        | DeepSeek V3.2                       | 160k     | Rozumowanie, narzędzia wyłączone |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k      | Bez cenzury, narzędzia wyłączone |
    | `mistral-31-24b`                       | Venice Medium (Mistral)             | 128k     | Vision                     |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct         | 198k     | Vision                     |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                 | 128k     | Ogólne                     |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B          | 128k     | Ogólne                     |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic               | 128k     | Rozumowanie                |
    | `zai-org-glm-4.6`                      | GLM 4.6                             | 198k     | Ogólne                     |
    | `zai-org-glm-4.7`                      | GLM 4.7                             | 198k     | Rozumowanie                |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                       | 128k     | Rozumowanie                |
    | `zai-org-glm-5`                        | GLM 5                               | 198k     | Rozumowanie                |
    | `minimax-m21`                          | MiniMax M2.1                        | 198k     | Rozumowanie                |
    | `minimax-m25`                          | MiniMax M2.5                        | 198k     | Rozumowanie                |
  </Accordion>

  <Accordion title="Modele anonimizowane (15) — przez proxy Venice">
    | ID modelu                        | Nazwa                          | Kontekst | Funkcje                    |
    | ------------------------------- | ------------------------------ | -------- | -------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (przez Venice) | 1M       | Rozumowanie, vision        |
    | `claude-opus-4-5`               | Claude Opus 4.5 (przez Venice) | 198k     | Rozumowanie, vision        |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (przez Venice) | 1M     | Rozumowanie, vision        |
    | `claude-sonnet-4-5`             | Claude Sonnet 4.5 (przez Venice) | 198k   | Rozumowanie, vision        |
    | `openai-gpt-54`                 | GPT-5.4 (przez Venice)         | 1M       | Rozumowanie, vision        |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (przez Venice)   | 400k     | Rozumowanie, vision, kodowanie |
    | `openai-gpt-52`                 | GPT-5.2 (przez Venice)         | 256k     | Rozumowanie                |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (przez Venice)   | 256k     | Rozumowanie, vision, kodowanie |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (przez Venice)          | 128k     | Vision                     |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (przez Venice)     | 128k     | Vision                     |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (przez Venice)  | 1M       | Rozumowanie, vision        |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (przez Venice)    | 198k     | Rozumowanie, vision        |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (przez Venice)  | 256k     | Rozumowanie, vision        |
    | `grok-41-fast`                  | Grok 4.1 Fast (przez Venice)   | 1M       | Rozumowanie, vision        |
    | `grok-code-fast-1`              | Grok Code Fast 1 (przez Venice) | 256k    | Rozumowanie, kodowanie     |
  </Accordion>
</AccordionGroup>

## Odkrywanie modeli

OpenClaw automatycznie wykrywa modele z API Venice, gdy ustawiono `VENICE_API_KEY`. Jeśli API jest nieosiągalne, następuje powrót do statycznego katalogu.

Endpoint `/models` jest publiczny (do wyświetlania listy nie jest wymagane uwierzytelnienie), ale wnioskowanie wymaga prawidłowego klucza API.

## Streaming i obsługa narzędzi

| Funkcja             | Obsługa                                                     |
| ------------------- | ----------------------------------------------------------- |
| **Streaming**       | Wszystkie modele                                            |
| **Wywoływanie funkcji** | Większość modeli (sprawdź `supportsFunctionCalling` w API) |
| **Vision/obrazy**   | Modele oznaczone funkcją „Vision”                           |
| **Tryb JSON**       | Obsługiwany przez `response_format`                         |

## Cennik

Venice korzysta z systemu opartego na kredytach. Aktualne stawki znajdziesz na [venice.ai/pricing](https://venice.ai/pricing):

- **Modele prywatne**: Zwykle niższy koszt
- **Modele anonimizowane**: Zbliżone do cen bezpośredniego API + niewielka opłata Venice

### Venice (anonimizowane) a bezpośrednie API

| Aspekt         | Venice (anonimizowane)          | Bezpośrednie API    |
| -------------- | ------------------------------- | ------------------- |
| **Prywatność** | Metadane usunięte, anonimizacja | Twoje konto powiązane |
| **Opóźnienie** | +10–50 ms (proxy)               | Bezpośrednie        |
| **Funkcje**    | Obsługiwana większość funkcji   | Pełna funkcjonalność |
| **Rozliczanie**| Kredyty Venice                  | Rozliczanie dostawcy |

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

  <Accordion title="Model jest niedostępny">
    Katalog modeli Venice jest aktualizowany dynamicznie. Uruchom `openclaw models list`, aby zobaczyć aktualnie dostępne modele. Niektóre modele mogą być tymczasowo offline.
  </Accordion>

  <Accordion title="Problemy z połączeniem">
    API Venice jest dostępne pod adresem `https://api.venice.ai/api/v1`. Upewnij się, że Twoja sieć pozwala na połączenia HTTPS.
  </Accordion>
</AccordionGroup>

<Note>
Więcej pomocy: [Rozwiązywanie problemów](/pl/help/troubleshooting) i [FAQ](/pl/help/faq).
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Przykład pliku konfiguracyjnego">
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
    Wybór dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Strona główna Venice AI i rejestracja konta.
  </Card>
  <Card title="Dokumentacja API" href="https://docs.venice.ai" icon="book">
    Dokumentacja referencyjna API Venice i dokumentacja dla deweloperów.
  </Card>
  <Card title="Cennik" href="https://venice.ai/pricing" icon="credit-card">
    Aktualne stawki kredytów Venice i plany.
  </Card>
</CardGroup>
