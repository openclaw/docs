---
read_when:
    - Chcesz w OpenClaw wnioskowania ukierunkowanego na prywatność
    - Potrzebujesz wskazówek dotyczących konfiguracji Venice AI
summary: Korzystaj z modeli Venice AI skoncentrowanych na prywatności w OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-05-02T10:01:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9b3486dd319661ba27f952e1353fed4364064c2cfb1e5744c018ddbac9dae82
    source_path: providers/venice.md
    workflow: 16
---

Venice AI zapewnia **wnioskowanie AI z naciskiem na prywatność**, z obsługą modeli bez cenzury oraz dostępem do głównych modeli własnościowych przez ich anonimizowany proxy. Całe wnioskowanie jest domyślnie prywatne — bez trenowania na Twoich danych, bez logowania.

## Dlaczego Venice w OpenClaw

- **Prywatne wnioskowanie** dla modeli open source (bez logowania).
- **Modele bez cenzury**, gdy ich potrzebujesz.
- **Anonimizowany dostęp** do modeli własnościowych (Opus/GPT/Gemini), gdy liczy się jakość.
- Endpointy `/v1` zgodne z OpenAI.

## Tryby prywatności

Venice oferuje dwa poziomy prywatności — zrozumienie tego jest kluczowe przy wyborze modelu:

| Tryb           | Opis                                                                                                                       | Modele                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Prywatny**    | W pełni prywatny. Prompty/odpowiedzi **nigdy nie są przechowywane ani logowane**. Efemeryczny.                                                       | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored itd. |
| **Anonimizowany** | Przekazywany przez Venice z usuniętymi metadanymi. Bazowy dostawca (OpenAI, Anthropic, Google, xAI) widzi zanonimizowane żądania. | Claude, GPT, Gemini, Grok                                     |

<Warning>
Modele anonimizowane **nie** są w pełni prywatne. Venice usuwa metadane przed przekazaniem, ale bazowy dostawca (OpenAI, Anthropic, Google, xAI) nadal przetwarza żądanie. Wybierz modele **Prywatne**, gdy wymagana jest pełna prywatność.
</Warning>

## Funkcje

- **Nacisk na prywatność**: Wybierz między trybami „private” (w pełni prywatny) i „anonymized” (przez proxy)
- **Modele bez cenzury**: Dostęp do modeli bez ograniczeń treści
- **Dostęp do głównych modeli**: Używaj Claude, GPT, Gemini i Grok przez anonimizowany proxy Venice
- **API zgodne z OpenAI**: Standardowe endpointy `/v1` ułatwiające integrację
- **Streaming**: Obsługiwany we wszystkich modelach
- **Wywoływanie funkcji**: Obsługiwane w wybranych modelach (sprawdź możliwości modelu)
- **Wizja**: Obsługiwana w modelach z możliwością przetwarzania obrazu
- **Brak sztywnych limitów szybkości**: Przy ekstremalnym użyciu może obowiązywać ograniczanie zgodnie z zasadami uczciwego korzystania

## Pierwsze kroki

<Steps>
  <Step title="Get your API key">
    1. Zarejestruj się na [venice.ai](https://venice.ai)
    2. Przejdź do **Settings > API Keys > Create new key**
    3. Skopiuj swój klucz API (format: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="Configure OpenClaw">
    Wybierz preferowaną metodę konfiguracji:

    <Tabs>
      <Tab title="Interactive (recommended)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        To:
        1. Poprosi o klucz API (lub użyje istniejącego `VENICE_API_KEY`)
        2. Pokaże wszystkie dostępne modele Venice
        3. Pozwoli wybrać model domyślny
        4. Automatycznie skonfiguruje dostawcę
      </Tab>
      <Tab title="Environment variable">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="Non-interactive">
        ```bash
        openclaw onboard --non-interactive \
          --auth-choice venice-api-key \
          --venice-api-key "vapi_xxxxxxxxxxxx"
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## Wybór modelu

Po konfiguracji OpenClaw pokazuje wszystkie dostępne modele Venice. Wybierz w zależności od potrzeb:

- **Model domyślny**: `venice/kimi-k2-5` do silnego prywatnego rozumowania oraz wizji.
- **Opcja o dużych możliwościach**: `venice/claude-opus-4-6` jako najmocniejsza anonimizowana ścieżka Venice.
- **Prywatność**: Wybierz modele „private” do w pełni prywatnego wnioskowania.
- **Możliwości**: Wybierz modele „anonymized”, aby uzyskać dostęp do Claude, GPT, Gemini przez proxy Venice.

Zmień swój model domyślny w dowolnym momencie:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

Wyświetl wszystkie dostępne modele:

```bash
openclaw models list --all --provider venice
```

Możesz też uruchomić `openclaw configure`, wybrać **Model/auth** i wybrać **Venice AI**.

<Tip>
Użyj poniższej tabeli, aby wybrać właściwy model do swojego przypadku użycia.

| Przypadek użycia                   | Zalecany model                | Dlaczego                                          |
| -------------------------- | -------------------------------- | -------------------------------------------- |
| **Ogólny czat (domyślnie)** | `kimi-k2-5`                      | Silne prywatne rozumowanie oraz wizja         |
| **Najlepsza ogólna jakość**   | `claude-opus-4-6`                | Najmocniejsza anonimizowana opcja Venice           |
| **Prywatność + kodowanie**       | `qwen3-coder-480b-a35b-instruct` | Prywatny model do kodowania z dużym kontekstem      |
| **Prywatna wizja**         | `kimi-k2-5`                      | Obsługa wizji bez opuszczania trybu prywatnego  |
| **Szybko + tanio**           | `qwen3-4b`                       | Lekki model rozumowania                  |
| **Złożone zadania prywatne**  | `deepseek-v3.2`                  | Silne rozumowanie, ale bez obsługi narzędzi Venice |
| **Bez cenzury**             | `venice-uncensored`              | Brak ograniczeń treści                      |

</Tip>

## Zachowanie odtwarzania DeepSeek V4

Jeśli Venice udostępnia modele DeepSeek V4, takie jak `venice/deepseek-v4-pro` lub
`venice/deepseek-v4-flash`, OpenClaw uzupełnia wymagany przez DeepSeek V4
placeholder odtwarzania `reasoning_content` w wiadomościach asystenta, gdy proxy
go pomija. Venice odrzuca natywną kontrolę najwyższego poziomu DeepSeek `thinking`, więc
OpenClaw utrzymuje tę specyficzną dla dostawcy poprawkę odtwarzania oddzielnie od natywnych
kontrolek myślenia dostawcy DeepSeek.

## Wbudowany katalog (łącznie 41)

<AccordionGroup>
  <Accordion title="Private models (26) — fully private, no logging">
    | ID modelu                               | Nazwa                                | Kontekst | Funkcje                   |
    | -------------------------------------- | ----------------------------------- | ------- | -------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k    | Domyślny, rozumowanie, wizja |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k    | Rozumowanie                  |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k    | Ogólne                    |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k    | Ogólne                    |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B            | 128k    | Ogólne, narzędzia wyłączone    |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                | 128k    | Rozumowanie                  |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                | 128k    | Ogólne                    |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                   | 256k    | Kodowanie                     |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo             | 256k    | Kodowanie                     |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                    | 256k    | Rozumowanie, wizja          |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                     | 256k    | Ogólne                    |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)             | 256k    | Wizja                     |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)            | 32k     | Szybki, rozumowanie            |
    | `deepseek-v3.2`                        | DeepSeek V3.2                      | 160k    | Rozumowanie, narzędzia wyłączone  |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k     | Bez cenzury, narzędzia wyłączone |
    | `mistral-31-24b`                       | Venice Medium (Mistral)            | 128k    | Wizja                     |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct        | 198k    | Wizja                     |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B               | 128k    | Ogólne                    |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B         | 128k    | Ogólne                    |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic              | 128k    | Rozumowanie                  |
    | `zai-org-glm-4.6`                      | GLM 4.6                            | 198k    | Ogólne                    |
    | `zai-org-glm-4.7`                      | GLM 4.7                            | 198k    | Rozumowanie                  |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                      | 128k    | Rozumowanie                  |
    | `zai-org-glm-5`                        | GLM 5                              | 198k    | Rozumowanie                  |
    | `minimax-m21`                          | MiniMax M2.1                       | 198k    | Rozumowanie                  |
    | `minimax-m25`                          | MiniMax M2.5                       | 198k    | Rozumowanie                  |
  </Accordion>

  <Accordion title="Anonymized models (15) — via Venice proxy">
    | ID modelu                        | Nazwa                           | Kontekst | Funkcje                  |
    | ------------------------------- | ------------------------------ | ------- | ------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (via Venice)   | 1M      | Rozumowanie, wizja         |
    | `claude-opus-4-5`               | Claude Opus 4.5 (via Venice)   | 198k    | Rozumowanie, wizja         |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (via Venice) | 1M      | Rozumowanie, wizja         |
    | `claude-sonnet-4-5`             | Claude Sonnet 4.5 (via Venice) | 198k    | Rozumowanie, wizja         |
    | `openai-gpt-54`                 | GPT-5.4 (via Venice)           | 1M      | Rozumowanie, wizja         |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (via Venice)     | 400k    | Rozumowanie, wizja, kodowanie |
    | `openai-gpt-52`                 | GPT-5.2 (via Venice)           | 256k    | Rozumowanie                 |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (via Venice)     | 256k    | Rozumowanie, wizja, kodowanie |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (via Venice)            | 128k    | Wizja                    |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (via Venice)       | 128k    | Wizja                    |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (via Venice)    | 1M      | Rozumowanie, wizja         |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (via Venice)      | 198k    | Rozumowanie, wizja         |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (via Venice)    | 256k    | Rozumowanie, wizja         |
    | `grok-41-fast`                  | Grok 4.1 Fast (via Venice)     | 1M      | Rozumowanie, wizja         |
    | `grok-code-fast-1`              | Grok Code Fast 1 (via Venice)  | 256k    | Rozumowanie, kodowanie         |
  </Accordion>
</AccordionGroup>

## Wykrywanie modeli

OpenClaw dostarcza oparty na manifeście katalog początkowy Venice do listy modeli tylko do odczytu. Odświeżanie w czasie działania nadal może wykrywać modele z API Venice i wraca do katalogu manifestu, jeśli API jest nieosiągalne.

Endpoint `/models` jest publiczny (do listowania nie jest potrzebne uwierzytelnienie), ale wnioskowanie wymaga prawidłowego klucza API.

## Streaming i obsługa narzędzi

| Funkcja              | Obsługa                                              |
| -------------------- | ---------------------------------------------------- |
| **Streaming**        | Wszystkie modele                                     |
| **Wywoływanie funkcji** | Większość modeli (sprawdź `supportsFunctionCalling` w API) |
| **Vision/Obrazy**    | Modele oznaczone funkcją „Vision”                    |
| **Tryb JSON**        | Obsługiwany przez `response_format`                  |

## Cennik

Venice używa systemu opartego na kredytach. Sprawdź aktualne stawki na [venice.ai/pricing](https://venice.ai/pricing):

- **Modele prywatne**: Zwykle niższy koszt
- **Modele anonimizowane**: Podobne do cen bezpośredniego API + niewielka opłata Venice

### Venice (anonimizowane) a bezpośrednie API

| Aspekt       | Venice (anonimizowane)        | Bezpośrednie API    |
| ------------ | ----------------------------- | ------------------- |
| **Prywatność** | Metadane usuwane, anonimizowane | Połączone z Twoim kontem |
| **Opóźnienie** | +10-50 ms (proxy)            | Bezpośrednie        |
| **Funkcje**  | Obsługiwana większość funkcji | Pełny zestaw funkcji |
| **Rozliczenia** | Kredyty Venice             | Rozliczenia dostawcy |

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

  <Accordion title="Model jest niedostępny">
    Katalog modeli Venice aktualizuje się dynamicznie. Uruchom `openclaw models list`, aby zobaczyć aktualnie dostępne modele. Niektóre modele mogą być tymczasowo offline.
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
    Wybieranie dostawców, referencji modeli i zachowania przełączania awaryjnego.
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
