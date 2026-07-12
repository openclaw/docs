---
read_when:
    - Chcesz korzystać w OpenClaw z inferencji ukierunkowanej na prywatność
    - Potrzebujesz wskazówek dotyczących konfiguracji Venice AI
summary: Korzystaj z modeli Venice AI ukierunkowanych na prywatność w OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-07-12T15:36:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f274922274def2f87fb0e074554f6457b97852dcb509578262a2e2e58425265e
    source_path: providers/venice.md
    workflow: 16
---

[Venice AI](https://venice.ai) zapewnia wnioskowanie zorientowane na prywatność: otwarte modele działają
bez rejestrowania, a dodatkowo dostępne jest anonimizowane pośredniczenie w dostępie do Claude, GPT, Gemini i Grok.
Wszystkie punkty końcowe są zgodne z OpenAI (`/v1`).

## Tryby prywatności

| Tryb              | Działanie                                                                       | Modele                                                        |
| ----------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Prywatny**      | Monity i odpowiedzi nigdy nie są przechowywane ani rejestrowane. Są ulotne.     | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored itd.  |
| **Anonimizowany** | Przekazywane przez Venice po usunięciu metadanych przed dalszym przekazaniem.    | Claude, GPT, Gemini, Grok                                     |

<Warning>
Modele anonimizowane nie są w pełni prywatne. Venice usuwa metadane przed dalszym przekazaniem, ale bazowy dostawca (OpenAI, Anthropic, Google, xAI) nadal przetwarza żądanie. Gdy wymagana jest pełna prywatność, używaj modeli prywatnych.
</Warning>

## Pierwsze kroki

<Steps>
  <Step title="Zainstaluj Plugin">
    ```bash
    openclaw plugins install @openclaw/venice-provider
    ```
  </Step>
  <Step title="Uzyskaj klucz API">
    1. Zarejestruj się w [venice.ai](https://venice.ai)
    2. Przejdź do **Settings > API Keys > Create new key**
    3. Skopiuj klucz API (format: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="Skonfiguruj OpenClaw">
    <Tabs>
      <Tab title="Interaktywnie (zalecane)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        Pyta o klucz API (lub ponownie wykorzystuje istniejący `VENICE_API_KEY`), wyświetla dostępne modele Venice i ustawia model domyślny.
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
    openclaw agent --model venice/kimi-k2-5 --message "Cześć, czy działasz?"
    ```
  </Step>
</Steps>

## Wybór modelu

- **Domyślny**: `venice/kimi-k2-5` (prywatny, rozumowanie, obsługa obrazu).
- **Najlepsza opcja anonimizowana**: `venice/claude-opus-4-6`.

```bash
openclaw models set venice/kimi-k2-5
openclaw models list --all --provider venice
```

Możesz również uruchomić `openclaw configure` i wybrać **Dostawca modelu/uwierzytelniania > Venice AI**.

<Tip>
| Zastosowanie               | Model                              | Dlaczego                                           |
| -------------------------- | ---------------------------------- | -------------------------------------------------- |
| Ogólny czat (domyślnie)    | `kimi-k2-5`                        | Zaawansowane prywatne rozumowanie i obsługa obrazu |
| Najlepsza ogólna jakość    | `claude-opus-4-6`                  | Najlepsza anonimizowana opcja Venice               |
| Prywatność i programowanie | `qwen3-coder-480b-a35b-instruct`   | Prywatny model programistyczny z dużym kontekstem  |
| Szybko i tanio             | `qwen3-4b`                         | Lekki model rozumujący                             |
| Złożone prywatne zadania   | `deepseek-v3.2`                    | Zaawansowane rozumowanie; wywoływanie narzędzi wyłączone |
| Bez cenzury                | `venice-uncensored`                | Brak ograniczeń treści                             |
</Tip>

## Wbudowany katalog (38 modeli)

<AccordionGroup>
  <Accordion title="Modele prywatne (26) — pełna prywatność, bez rejestrowania">
    | Identyfikator modelu                    | Nazwa                                 | Kontekst | Uwagi                              |
    | --------------------------------------- | ------------------------------------- | -------- | ---------------------------------- |
    | `kimi-k2-5`                             | Kimi K2.5                             | 256k     | Domyślny, rozumowanie, obraz       |
    | `kimi-k2-thinking`                      | Kimi K2 Thinking                      | 256k     | Rozumowanie                        |
    | `llama-3.3-70b`                         | Llama 3.3 70B                         | 128k     | Ogólnego przeznaczenia             |
    | `llama-3.2-3b`                          | Llama 3.2 3B                          | 128k     | Ogólnego przeznaczenia             |
    | `hermes-3-llama-3.1-405b`               | Hermes 3 Llama 3.1 405B               | 128k     | Ogólny, narzędzia wyłączone        |
    | `qwen3-235b-a22b-thinking-2507`         | Qwen3 235B Thinking                   | 128k     | Rozumowanie                        |
    | `qwen3-235b-a22b-instruct-2507`         | Qwen3 235B Instruct                   | 128k     | Ogólnego przeznaczenia             |
    | `qwen3-coder-480b-a35b-instruct`        | Qwen3 Coder 480B                      | 256k     | Programowanie                      |
    | `qwen3-coder-480b-a35b-instruct-turbo`  | Qwen3 Coder 480B Turbo                | 256k     | Programowanie                      |
    | `qwen3-5-35b-a3b`                       | Qwen3.5 35B A3B                       | 256k     | Rozumowanie, obraz                 |
    | `qwen3-next-80b`                        | Qwen3 Next 80B                        | 256k     | Ogólnego przeznaczenia             |
    | `qwen3-vl-235b-a22b`                    | Qwen3 VL 235B (Vision)                | 256k     | Obraz                              |
    | `qwen3-4b`                              | Venice Small (Qwen3 4B)               | 32k      | Szybki, rozumowanie                |
    | `deepseek-v3.2`                         | DeepSeek V3.2                         | 160k     | Rozumowanie, narzędzia wyłączone   |
    | `venice-uncensored`                     | Venice Uncensored (Dolphin-Mistral)   | 32k      | Bez cenzury, narzędzia wyłączone   |
    | `mistral-31-24b`                        | Venice Medium (Mistral)               | 128k     | Obraz                              |
    | `google-gemma-3-27b-it`                 | Google Gemma 3 27B Instruct           | 198k     | Obraz                              |
    | `openai-gpt-oss-120b`                   | OpenAI GPT OSS 120B                   | 128k     | Ogólnego przeznaczenia             |
    | `nvidia-nemotron-3-nano-30b-a3b`        | NVIDIA Nemotron 3 Nano 30B            | 128k     | Ogólnego przeznaczenia             |
    | `olafangensan-glm-4.7-flash-heretic`    | GLM 4.7 Flash Heretic                 | 128k     | Rozumowanie                        |
    | `zai-org-glm-4.6`                       | GLM 4.6                               | 198k     | Ogólnego przeznaczenia             |
    | `zai-org-glm-4.7`                       | GLM 4.7                               | 198k     | Rozumowanie                        |
    | `zai-org-glm-4.7-flash`                 | GLM 4.7 Flash                         | 128k     | Rozumowanie                        |
    | `zai-org-glm-5`                         | GLM 5                                 | 198k     | Rozumowanie                        |
    | `minimax-m21`                           | MiniMax M2.1                          | 198k     | Rozumowanie                        |
    | `minimax-m25`                           | MiniMax M2.5                          | 198k     | Rozumowanie                        |
  </Accordion>

  <Accordion title="Modele anonimizowane (12) — przez serwer proxy Venice">
    | Identyfikator modelu             | Nazwa                            | Kontekst | Uwagi                            |
    | -------------------------------- | -------------------------------- | -------- | -------------------------------- |
    | `claude-opus-4-6`                | Claude Opus 4.6 (przez Venice)   | 1M       | Rozumowanie, obraz               |
    | `claude-sonnet-4-6`              | Claude Sonnet 4.6 (przez Venice) | 1M       | Rozumowanie, obraz               |
    | `openai-gpt-54`                  | GPT-5.4 (przez Venice)           | 1M       | Rozumowanie, obraz               |
    | `openai-gpt-53-codex`            | GPT-5.3 Codex (przez Venice)     | 400k     | Rozumowanie, obraz, programowanie |
    | `openai-gpt-52`                  | GPT-5.2 (przez Venice)           | 256k     | Rozumowanie                      |
    | `openai-gpt-52-codex`            | GPT-5.2 Codex (przez Venice)     | 256k     | Rozumowanie, obraz, programowanie |
    | `openai-gpt-4o-2024-11-20`       | GPT-4o (przez Venice)            | 128k     | Obraz                            |
    | `openai-gpt-4o-mini-2024-07-18`  | GPT-4o Mini (przez Venice)       | 128k     | Obraz                            |
    | `gemini-3-1-pro-preview`         | Gemini 3.1 Pro (przez Venice)    | 1M       | Rozumowanie, obraz               |
    | `gemini-3-pro-preview`           | Gemini 3 Pro (przez Venice)      | 198k     | Rozumowanie, obraz               |
    | `gemini-3-flash-preview`         | Gemini 3 Flash (przez Venice)    | 256k     | Rozumowanie, obraz               |
    | `grok-41-fast`                   | Grok 4.1 Fast (przez Venice)     | 1M       | Rozumowanie, obraz               |
  </Accordion>
</AccordionGroup>

Modele Venice oparte na Grok (`grok-41-fast` i podobne) otrzymują tę samą poprawkę zgodności schematu narzędzi
co natywny dostawca xAI, ponieważ korzystają z tego samego nadrzędnego
formatu wywołań narzędzi.

## Wykrywanie modeli

Powyższy dołączony katalog jest początkową listą opartą na manifeście. Podczas działania OpenClaw
odświeża ją za pomocą API `/models` Venice i powraca do listy początkowej, jeśli
API jest nieosiągalne. Punkt końcowy `/models` jest publiczny (uwierzytelnianie nie jest wymagane do
wyświetlenia listy), ale wnioskowanie wymaga prawidłowego klucza API.

## Zachowanie odtwarzania DeepSeek V4

Jeśli Venice udostępnia modele DeepSeek V4, takie jak `deepseek-v4-pro` lub
`deepseek-v4-flash`, OpenClaw uzupełnia wymagane pole odtwarzania `reasoning_content`
w wiadomościach asystenta, gdy Venice je pomija, oraz usuwa `thinking`/
`reasoning`/`reasoning_effort` z ładunku żądania (Venice odrzuca
natywne sterowanie `thinking` DeepSeek w tych modelach). Ta poprawka odtwarzania jest
niezależna od mechanizmów sterowania rozumowaniem natywnego dostawcy DeepSeek.

## Obsługa strumieniowania i narzędzi

| Funkcja              | Obsługa                                                |
| -------------------- | ------------------------------------------------------ |
| Strumieniowanie      | Wszystkie modele                                       |
| Wywoływanie funkcji  | Większość modeli; wyłączone dla modeli wskazanych wyżej |
| Obraz                | Modele oznaczone wyżej jako „Obraz”                    |
| Tryb JSON            | Za pośrednictwem `response_format`                     |

## Ceny

Venice korzysta z systemu opartego na środkach. Modele anonimizowane kosztują mniej więcej tyle samo co
bezpośredni dostęp przez API, powiększony o niewielką opłatę Venice. Aktualne stawki znajdziesz na stronie
[venice.ai/pricing](https://venice.ai/pricing).

## Przykłady użycia

```bash
# Domyślny model prywatny
openclaw agent --model venice/kimi-k2-5 --message "Szybka kontrola działania"

# Claude Opus przez Venice (anonimizowany)
openclaw agent --model venice/claude-opus-4-6 --message "Podsumuj to zadanie"

# Model bez cenzury
openclaw agent --model venice/venice-uncensored --message "Przygotuj warianty"

# Model obsługujący obraz z załącznikiem
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Przejrzyj załączony obraz"

# Model programistyczny
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Zrefaktoryzuj tę funkcję"
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
    Uruchom `openclaw models list --all --provider venice`, aby zobaczyć aktualnie
    dostępne modele; katalog zmienia się, gdy Venice dodaje lub wycofuje modele.
  </Accordion>

  <Accordion title="Problemy z połączeniem">
    API Venice znajduje się pod adresem `https://api.venice.ai/api/v1`. Upewnij się, że sieć zezwala na połączenia HTTPS z tym hostem.
  </Accordion>
</AccordionGroup>

<Note>
Więcej pomocy: [Rozwiązywanie problemów](/pl/help/troubleshooting) i [Często zadawane pytania](/pl/help/faq).
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

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i sposobu przełączania awaryjnego.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Strona główna Venice AI i rejestracja konta.
  </Card>
  <Card title="Dokumentacja API" href="https://docs.venice.ai" icon="book">
    Dokumentacja referencyjna API Venice i dokumentacja dla programistów.
  </Card>
  <Card title="Cennik" href="https://venice.ai/pricing" icon="credit-card">
    Aktualne stawki kredytów i plany Venice.
  </Card>
</CardGroup>
