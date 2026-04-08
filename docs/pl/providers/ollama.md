---
read_when:
    - Chcesz uruchamiać OpenClaw z modelami chmurowymi lub lokalnymi przez Ollama
    - Potrzebujesz wskazówek dotyczących konfiguracji i ustawiania Ollama
summary: Uruchamianie OpenClaw z Ollama (modele chmurowe i lokalne)
title: Ollama
x-i18n:
    generated_at: "2026-04-08T09:44:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: d3295a7c879d3636a2ffdec05aea6e670e54a990ef52bd9b0cae253bc24aa3f7
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

Ollama to lokalne środowisko uruchomieniowe LLM, które ułatwia uruchamianie modeli open source na Twoim komputerze. OpenClaw integruje się z natywnym API Ollama (`/api/chat`), obsługuje strumieniowanie i wywoływanie narzędzi oraz może automatycznie wykrywać lokalne modele Ollama, gdy włączysz tę opcję za pomocą `OLLAMA_API_KEY` (lub profilu uwierzytelniania) i nie zdefiniujesz jawnego wpisu `models.providers.ollama`.

<Warning>
**Użytkownicy zdalnego Ollama**: Nie używaj adresu URL zgodnego z OpenAI `/v1` (`http://host:11434/v1`) z OpenClaw. Powoduje to problemy z wywoływaniem narzędzi, a modele mogą zwracać surowy JSON narzędzi jako zwykły tekst. Zamiast tego użyj natywnego adresu URL API Ollama: `baseUrl: "http://host:11434"` (bez `/v1`).
</Warning>

## Szybki start

### Onboarding (zalecane)

Najszybszym sposobem konfiguracji Ollama jest użycie onboardingu:

```bash
openclaw onboard
```

Wybierz **Ollama** z listy dostawców. Onboarding:

1. Poprosi o bazowy adres URL Ollama, pod którym Twoja instancja jest osiągalna (domyślnie `http://127.0.0.1:11434`).
2. Pozwoli wybrać **Cloud + Local** (modele chmurowe i lokalne) lub **Local** (tylko modele lokalne).
3. Otworzy w przeglądarce proces logowania, jeśli wybierzesz **Cloud + Local** i nie jesteś zalogowany w ollama.com.
4. Wykryje dostępne modele i zasugeruje wartości domyślne.
5. Automatycznie pobierze wybrany model, jeśli nie jest dostępny lokalnie.

Obsługiwany jest także tryb nieinteraktywny:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --accept-risk
```

Opcjonalnie możesz podać własny bazowy adres URL lub model:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

### Konfiguracja ręczna

1. Zainstaluj Ollama: [https://ollama.com/download](https://ollama.com/download)

2. Pobierz model lokalny, jeśli chcesz używać inferencji lokalnej:

```bash
ollama pull gemma4
# lub
ollama pull gpt-oss:20b
# lub
ollama pull llama3.3
```

3. Jeśli chcesz także używać modeli chmurowych, zaloguj się:

```bash
ollama signin
```

4. Uruchom onboarding i wybierz `Ollama`:

```bash
openclaw onboard
```

- `Local`: tylko modele lokalne
- `Cloud + Local`: modele lokalne oraz modele chmurowe
- Modele chmurowe takie jak `kimi-k2.5:cloud`, `minimax-m2.7:cloud` i `glm-5.1:cloud` **nie** wymagają lokalnego `ollama pull`

OpenClaw obecnie sugeruje:

- lokalna wartość domyślna: `gemma4`
- chmurowe wartości domyślne: `kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`

5. Jeśli wolisz konfigurację ręczną, włącz Ollama bezpośrednio dla OpenClaw (dowolna wartość działa; Ollama nie wymaga prawdziwego klucza):

```bash
# Ustaw zmienną środowiskową
export OLLAMA_API_KEY="ollama-local"

# Lub skonfiguruj w pliku konfiguracyjnym
openclaw config set models.providers.ollama.apiKey "ollama-local"
```

6. Wyświetl modele lub przełącz model:

```bash
openclaw models list
openclaw models set ollama/gemma4
```

7. Lub ustaw domyślny model w konfiguracji:

```json5
{
  agents: {
    defaults: {
      model: { primary: "ollama/gemma4" },
    },
  },
}
```

## Wykrywanie modeli (provider niejawny)

Gdy ustawisz `OLLAMA_API_KEY` (lub profil uwierzytelniania) i **nie** zdefiniujesz `models.providers.ollama`, OpenClaw wykrywa modele z lokalnej instancji Ollama pod adresem `http://127.0.0.1:11434`:

- Odpytuje `/api/tags`
- Używa wywołań `/api/show` w trybie best-effort, aby odczytać `contextWindow` i wykrywać możliwości modelu (w tym vision), gdy są dostępne
- Modele z możliwością `vision` zgłoszoną przez `/api/show` są oznaczane jako obsługujące obrazy (`input: ["text", "image"]`), dzięki czemu OpenClaw automatycznie wstrzykuje obrazy do promptu dla tych modeli
- Oznacza `reasoning` na podstawie heurystyki nazwy modelu (`r1`, `reasoning`, `think`)
- Ustawia `maxTokens` na domyślny limit maksymalnej liczby tokenów Ollama używany przez OpenClaw
- Ustawia wszystkie koszty na `0`

Pozwala to uniknąć ręcznego definiowania modeli, a jednocześnie utrzymać katalog zgodny z lokalną instancją Ollama.

Aby zobaczyć, jakie modele są dostępne:

```bash
ollama list
openclaw models list
```

Aby dodać nowy model, po prostu pobierz go przez Ollama:

```bash
ollama pull mistral
```

Nowy model zostanie automatycznie wykryty i będzie dostępny do użycia.

Jeśli jawnie ustawisz `models.providers.ollama`, automatyczne wykrywanie zostanie pominięte i musisz zdefiniować modele ręcznie (patrz niżej).

## Konfiguracja

### Podstawowa konfiguracja (wykrywanie niejawne)

Najprostszy sposób włączenia Ollama to użycie zmiennej środowiskowej:

```bash
export OLLAMA_API_KEY="ollama-local"
```

### Konfiguracja jawna (modele ręczne)

Użyj konfiguracji jawnej, gdy:

- Ollama działa na innym hoście lub porcie.
- Chcesz wymusić określone okna kontekstu lub listy modeli.
- Chcesz w pełni ręcznie definiować modele.

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
        apiKey: "ollama-local",
        api: "ollama",
        models: [
          {
            id: "gpt-oss:20b",
            name: "GPT-OSS 20B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 8192,
            maxTokens: 8192 * 10
          }
        ]
      }
    }
  }
}
```

Jeśli ustawiono `OLLAMA_API_KEY`, możesz pominąć `apiKey` we wpisie providera, a OpenClaw uzupełni go na potrzeby kontroli dostępności.

### Niestandardowy bazowy adres URL (konfiguracja jawna)

Jeśli Ollama działa na innym hoście lub porcie (konfiguracja jawna wyłącza automatyczne wykrywanie, więc zdefiniuj modele ręcznie):

```json5
{
  models: {
    providers: {
      ollama: {
        apiKey: "ollama-local",
        baseUrl: "http://ollama-host:11434", // Bez /v1 - użyj natywnego adresu URL API Ollama
        api: "ollama", // Ustaw jawnie, aby zagwarantować natywne zachowanie wywoływania narzędzi
      },
    },
  },
}
```

<Warning>
Nie dodawaj `/v1` do adresu URL. Ścieżka `/v1` używa trybu zgodnego z OpenAI, w którym wywoływanie narzędzi nie jest niezawodne. Użyj bazowego adresu URL Ollama bez sufiksu ścieżki.
</Warning>

### Wybór modelu

Po skonfigurowaniu wszystkie Twoje modele Ollama są dostępne:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

## Modele chmurowe

Modele chmurowe pozwalają uruchamiać modele hostowane w chmurze (na przykład `kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`) obok modeli lokalnych.

Aby używać modeli chmurowych, wybierz tryb **Cloud + Local** podczas konfiguracji. Kreator sprawdza, czy jesteś zalogowany, i w razie potrzeby otwiera w przeglądarce proces logowania. Jeśli nie można zweryfikować uwierzytelnienia, kreator przełącza się na domyślne ustawienia modeli lokalnych.

Możesz też zalogować się bezpośrednio na [ollama.com/signin](https://ollama.com/signin).

## Ollama Web Search

OpenClaw obsługuje także **Ollama Web Search** jako wbudowany provider `web_search`.

- Używa skonfigurowanego hosta Ollama (`models.providers.ollama.baseUrl`, jeśli jest ustawiony, w przeciwnym razie `http://127.0.0.1:11434`).
- Nie wymaga klucza.
- Wymaga uruchomionego Ollama i zalogowania przez `ollama signin`.

Wybierz **Ollama Web Search** podczas `openclaw onboard` lub `openclaw configure --section web`, albo ustaw:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Pełne informacje o konfiguracji i szczegółach działania znajdziesz w [Ollama Web Search](/pl/tools/ollama-search).

## Zaawansowane

### Modele reasoning

OpenClaw domyślnie traktuje modele o nazwach takich jak `deepseek-r1`, `reasoning` lub `think` jako obsługujące reasoning:

```bash
ollama pull deepseek-r1:32b
```

### Koszty modeli

Ollama jest bezpłatne i działa lokalnie, więc wszystkie koszty modeli są ustawione na $0.

### Konfiguracja strumieniowania

Integracja Ollama w OpenClaw domyślnie używa **natywnego API Ollama** (`/api/chat`), które w pełni obsługuje jednocześnie strumieniowanie i wywoływanie narzędzi. Nie jest wymagana żadna specjalna konfiguracja.

#### Starszy tryb zgodny z OpenAI

<Warning>
**Wywoływanie narzędzi nie jest niezawodne w trybie zgodnym z OpenAI.** Używaj tego trybu tylko wtedy, gdy potrzebujesz formatu OpenAI dla proxy i nie polegasz na natywnym zachowaniu wywoływania narzędzi.
</Warning>

Jeśli zamiast tego musisz użyć punktu końcowego zgodnego z OpenAI (np. za proxy obsługującym tylko format OpenAI), ustaw jawnie `api: "openai-completions"`:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434/v1",
        api: "openai-completions",
        injectNumCtxForOpenAICompat: true, // domyślnie: true
        apiKey: "ollama-local",
        models: [...]
      }
    }
  }
}
```

Ten tryb może nie obsługiwać jednocześnie strumieniowania i wywoływania narzędzi. Może być konieczne wyłączenie strumieniowania za pomocą `params: { streaming: false }` w konfiguracji modelu.

Gdy `api: "openai-completions"` jest używane z Ollama, OpenClaw domyślnie wstrzykuje `options.num_ctx`, aby Ollama nie przełączało się po cichu na okno kontekstu 4096. Jeśli Twoje proxy/upstream odrzuca nieznane pola `options`, wyłącz to zachowanie:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434/v1",
        api: "openai-completions",
        injectNumCtxForOpenAICompat: false,
        apiKey: "ollama-local",
        models: [...]
      }
    }
  }
}
```

### Okna kontekstu

W przypadku modeli wykrywanych automatycznie OpenClaw używa okna kontekstu zgłaszanego przez Ollama, gdy jest dostępne, a w przeciwnym razie przechodzi do domyślnego okna kontekstu Ollama używanego przez OpenClaw. Możesz zastąpić `contextWindow` i `maxTokens` w jawnej konfiguracji providera.

## Rozwiązywanie problemów

### Ollama nie zostało wykryte

Upewnij się, że Ollama jest uruchomione, że ustawiono `OLLAMA_API_KEY` (lub profil uwierzytelniania) i że **nie** zdefiniowano jawnego wpisu `models.providers.ollama`:

```bash
ollama serve
```

I że API jest dostępne:

```bash
curl http://localhost:11434/api/tags
```

### Brak dostępnych modeli

Jeśli Twojego modelu nie ma na liście, wykonaj jedną z tych czynności:

- Pobierz model lokalnie, albo
- Zdefiniuj model jawnie w `models.providers.ollama`.

Aby dodać modele:

```bash
ollama list  # Zobacz, co jest zainstalowane
ollama pull gemma4
ollama pull gpt-oss:20b
ollama pull llama3.3     # Lub inny model
```

### Połączenie odrzucone

Sprawdź, czy Ollama działa na właściwym porcie:

```bash
# Sprawdź, czy Ollama działa
ps aux | grep ollama

# Lub uruchom Ollama ponownie
ollama serve
```

## Zobacz także

- [Model Providers](/pl/concepts/model-providers) - Przegląd wszystkich providerów
- [Model Selection](/pl/concepts/models) - Jak wybierać modele
- [Configuration](/pl/gateway/configuration) - Pełna dokumentacja konfiguracji
