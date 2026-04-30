---
read_when:
    - Chcesz korzystać z inferencji zorientowanej na prywatność w OpenClaw
    - Potrzebujesz wskazówek dotyczących konfiguracji Venice AI
summary: Używaj modeli Venice AI zorientowanych na prywatność w OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-04-30T10:15:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: d87db1595ba6d34459143e7d173cca9549ad21928eaaf00605b7487ce6d33fce
    source_path: providers/venice.md
    workflow: 16
---

Venice AI zapewnia **wnioskowanie AI skoncentrowane na prywatności** z obsługą modeli nieocenzurowanych i dostępem do głównych modeli własnościowych przez ich anonimizujący proxy. Całe wnioskowanie jest domyślnie prywatne — bez trenowania na twoich danych, bez logowania.

## Dlaczego Venice w OpenClaw

- **Prywatne wnioskowanie** dla modeli open source (bez logowania).
- **Modele nieocenzurowane**, gdy ich potrzebujesz.
- **Anonimizowany dostęp** do modeli własnościowych (Opus/GPT/Gemini), gdy liczy się jakość.
- Punkty końcowe `/v1` zgodne z OpenAI.

## Tryby prywatności

Venice oferuje dwa poziomy prywatności — ich zrozumienie jest kluczowe przy wyborze modelu:

| Tryb               | Opis                                                                                                                              | Modele                                                        |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Prywatny**       | W pełni prywatny. Prompty/odpowiedzi **nigdy nie są przechowywane ani logowane**. Efemeryczny.                                    | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored, itd. |
| **Anonimizowany**  | Przekazywany przez Venice z usuniętymi metadanymi. Dostawca bazowy (OpenAI, Anthropic, Google, xAI) widzi anonimowe żądania.      | Claude, GPT, Gemini, Grok                                     |

<Warning>
Modele anonimizowane **nie** są w pełni prywatne. Venice usuwa metadane przed przekazaniem, ale dostawca bazowy (OpenAI, Anthropic, Google, xAI) nadal przetwarza żądanie. Wybierz modele **Prywatne**, gdy wymagana jest pełna prywatność.
</Warning>

## Funkcje

- **Skoncentrowane na prywatności**: wybierz między trybami „prywatny” (w pełni prywatny) i „anonimizowany” (przez proxy)
- **Modele nieocenzurowane**: dostęp do modeli bez ograniczeń treści
- **Dostęp do głównych modeli**: używaj Claude, GPT, Gemini i Grok przez anonimizujący proxy Venice
- **API zgodne z OpenAI**: standardowe punkty końcowe `/v1` dla łatwej integracji
- **Strumieniowanie**: obsługiwane we wszystkich modelach
- **Wywoływanie funkcji**: obsługiwane w wybranych modelach (sprawdź możliwości modelu)
- **Obsługa obrazów**: obsługiwana w modelach z funkcją wizyjną
- **Brak sztywnych limitów żądań**: przy skrajnym użyciu może obowiązywać ograniczanie zgodne z zasadami uczciwego korzystania

## Pierwsze kroki

<Steps>
  <Step title="Uzyskaj klucz API">
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

        To spowoduje:
        1. Wyświetlenie prośby o klucz API (albo użycie istniejącego `VENICE_API_KEY`)
        2. Pokazanie wszystkich dostępnych modeli Venice
        3. Umożliwienie wybrania modelu domyślnego
        4. Automatyczne skonfigurowanie dostawcy
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

Po konfiguracji OpenClaw pokazuje wszystkie dostępne modele Venice. Wybierz model zgodnie ze swoimi potrzebami:

- **Model domyślny**: `venice/kimi-k2-5` dla silnego prywatnego rozumowania oraz obsługi obrazów.
- **Opcja o wysokich możliwościach**: `venice/claude-opus-4-6` dla najsilniejszej anonimizowanej ścieżki Venice.
- **Prywatność**: wybierz modele „private” dla w pełni prywatnego wnioskowania.
- **Możliwości**: wybierz modele „anonymized”, aby uzyskać dostęp do Claude, GPT, Gemini przez proxy Venice.

Zmień swój model domyślny w dowolnym momencie:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

Wyświetl wszystkie dostępne modele:

```bash
openclaw models list | grep venice
```

Możesz też uruchomić `openclaw configure`, wybrać **Model/auth**, a następnie **Venice AI**.

<Tip>
Użyj poniższej tabeli, aby wybrać odpowiedni model dla swojego przypadku użycia.

| Przypadek użycia              | Zalecany model                    | Dlaczego                                      |
| ----------------------------- | --------------------------------- | -------------------------------------------- |
| **Ogólny czat (domyślnie)**   | `kimi-k2-5`                       | Silne prywatne rozumowanie oraz obsługa obrazów |
| **Najlepsza jakość ogólna**   | `claude-opus-4-6`                 | Najsilniejsza anonimizowana opcja Venice     |
| **Prywatność + programowanie** | `qwen3-coder-480b-a35b-instruct` | Prywatny model do programowania z dużym kontekstem |
| **Prywatna obsługa obrazów**  | `kimi-k2-5`                       | Obsługa obrazów bez opuszczania trybu prywatnego |
| **Szybko + tanio**            | `qwen3-4b`                        | Lekki model rozumowania                      |
| **Złożone zadania prywatne**  | `deepseek-v3.2`                   | Silne rozumowanie, ale bez obsługi narzędzi Venice |
| **Nieocenzurowane**           | `venice-uncensored`               | Brak ograniczeń treści                       |

</Tip>

## Zachowanie odtwarzania DeepSeek V4

Jeśli Venice udostępnia modele DeepSeek V4, takie jak `venice/deepseek-v4-pro` lub
`venice/deepseek-v4-flash`, OpenClaw wypełnia wymagany symbol zastępczy odtwarzania
`reasoning_content` DeepSeek V4 w wiadomościach asystenta, gdy proxy go
pomija. Venice odrzuca natywny parametr sterujący najwyższego poziomu `thinking` DeepSeek, więc
OpenClaw utrzymuje tę poprawkę odtwarzania specyficzną dla dostawcy oddzielnie od kontrolek thinking
natywnego dostawcy DeepSeek.

## Wbudowany katalog (łącznie 41)

<AccordionGroup>
  <Accordion title="Modele prywatne (26) — w pełni prywatne, bez logowania">
    | Identyfikator modelu                  | Nazwa                               | Kontekst | Funkcje                    |
    | -------------------------------------- | ----------------------------------- | -------- | -------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k     | Domyślny, rozumowanie, obsługa obrazów |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k     | Rozumowanie                |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k     | Ogólne                     |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k     | Ogólne                     |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B            | 128k     | Ogólne, narzędzia wyłączone |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                 | 128k     | Rozumowanie                |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                 | 128k     | Ogólne                     |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                    | 256k     | Programowanie              |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo              | 256k     | Programowanie              |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                     | 256k     | Rozumowanie, obsługa obrazów |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                      | 256k     | Ogólne                     |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (obsługa obrazów)     | 256k     | Obsługa obrazów            |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)             | 32k      | Szybki, rozumowanie        |
    | `deepseek-v3.2`                        | DeepSeek V3.2                       | 160k     | Rozumowanie, narzędzia wyłączone |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k      | Nieocenzurowany, narzędzia wyłączone |
    | `mistral-31-24b`                       | Venice Medium (Mistral)             | 128k     | Obsługa obrazów            |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct         | 198k     | Obsługa obrazów            |
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
    | Identyfikator modelu           | Nazwa                          | Kontekst | Funkcje                    |
    | ------------------------------ | ------------------------------ | -------- | -------------------------- |
    | `claude-opus-4-6`              | Claude Opus 4.6 (przez Venice) | 1M       | Rozumowanie, obsługa obrazów |
    | `claude-opus-4-5`              | Claude Opus 4.5 (przez Venice) | 198k     | Rozumowanie, obsługa obrazów |
    | `claude-sonnet-4-6`            | Claude Sonnet 4.6 (przez Venice) | 1M     | Rozumowanie, obsługa obrazów |
    | `claude-sonnet-4-5`            | Claude Sonnet 4.5 (przez Venice) | 198k   | Rozumowanie, obsługa obrazów |
    | `openai-gpt-54`                | GPT-5.4 (przez Venice)         | 1M       | Rozumowanie, obsługa obrazów |
    | `openai-gpt-53-codex`          | GPT-5.3 Codex (przez Venice)   | 400k     | Rozumowanie, obsługa obrazów, programowanie |
    | `openai-gpt-52`                | GPT-5.2 (przez Venice)         | 256k     | Rozumowanie                |
    | `openai-gpt-52-codex`          | GPT-5.2 Codex (przez Venice)   | 256k     | Rozumowanie, obsługa obrazów, programowanie |
    | `openai-gpt-4o-2024-11-20`     | GPT-4o (przez Venice)          | 128k     | Obsługa obrazów            |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (przez Venice)    | 128k     | Obsługa obrazów            |
    | `gemini-3-1-pro-preview`       | Gemini 3.1 Pro (przez Venice)  | 1M       | Rozumowanie, obsługa obrazów |
    | `gemini-3-pro-preview`         | Gemini 3 Pro (przez Venice)    | 198k     | Rozumowanie, obsługa obrazów |
    | `gemini-3-flash-preview`       | Gemini 3 Flash (przez Venice)  | 256k     | Rozumowanie, obsługa obrazów |
    | `grok-41-fast`                 | Grok 4.1 Fast (przez Venice)   | 1M       | Rozumowanie, obsługa obrazów |
    | `grok-code-fast-1`             | Grok Code Fast 1 (przez Venice) | 256k    | Rozumowanie, programowanie |
  </Accordion>
</AccordionGroup>

## Wykrywanie modeli

OpenClaw automatycznie wykrywa modele z API Venice, gdy ustawiono `VENICE_API_KEY`. Jeśli API jest nieosiągalne, wraca do statycznego katalogu.

Punkt końcowy `/models` jest publiczny (do wyświetlania listy nie jest potrzebne uwierzytelnienie), ale wnioskowanie wymaga prawidłowego klucza API.

## Strumieniowanie i obsługa narzędzi

| Funkcja              | Obsługa                                              |
| -------------------- | ---------------------------------------------------- |
| **Strumieniowanie**  | Wszystkie modele                                     |
| **Wywoływanie funkcji** | Większość modeli (sprawdź `supportsFunctionCalling` w API) |
| **Wizja/obrazy**     | Modele oznaczone funkcją „Vision”                    |
| **Tryb JSON**        | Obsługiwany przez `response_format`                  |

## Cennik

Venice używa systemu opartego na kredytach. Aktualne stawki sprawdź na [venice.ai/pricing](https://venice.ai/pricing):

- **Modele prywatne**: Zazwyczaj niższy koszt
- **Modele zanonimizowane**: Podobne do cen bezpośredniego API + niewielka opłata Venice

### Venice (zanonimizowane) vs bezpośrednie API

| Aspekt       | Venice (zanonimizowane)       | Bezpośrednie API    |
| ------------ | ----------------------------- | ------------------- |
| **Prywatność** | Metadane usunięte, zanonimizowane | Twoje konto jest powiązane |
| **Opóźnienie** | +10-50 ms (proxy)            | Bezpośrednie        |
| **Funkcje**  | Obsługiwana większość funkcji | Pełny zestaw funkcji |
| **Rozliczenia** | Kredyty Venice              | Rozliczenia dostawcy |

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
  <Accordion title="Klucz API nie został rozpoznany">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    Upewnij się, że klucz zaczyna się od `vapi_`.

  </Accordion>

  <Accordion title="Model niedostępny">
    Katalog modeli Venice jest aktualizowany dynamicznie. Uruchom `openclaw models list`, aby zobaczyć aktualnie dostępne modele. Niektóre modele mogą być tymczasowo offline.
  </Accordion>

  <Accordion title="Problemy z połączeniem">
    API Venice znajduje się pod adresem `https://api.venice.ai/api/v1`. Upewnij się, że Twoja sieć zezwala na połączenia HTTPS.
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
    Wybieranie dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Strona główna Venice AI i rejestracja konta.
  </Card>
  <Card title="Dokumentacja API" href="https://docs.venice.ai" icon="book">
    Dokumentacja referencyjna API Venice i dokumentacja dla deweloperów.
  </Card>
  <Card title="Cennik" href="https://venice.ai/pricing" icon="credit-card">
    Aktualne stawki kredytów i plany Venice.
  </Card>
</CardGroup>
