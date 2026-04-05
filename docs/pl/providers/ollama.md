---
read_when:
    - Chcesz uruchamiać OpenClaw z modelami chmurowymi lub lokalnymi przez Ollama
    - Potrzebujesz wskazówek dotyczących instalacji i konfiguracji Ollama
summary: Uruchamianie OpenClaw z Ollama (modele chmurowe i lokalne)
title: Ollama
x-i18n:
    generated_at: "2026-04-05T14:04:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 337b8ec3a7756e591e6d6f82e8ad13417f0f20c394ec540e8fc5756e0fc13c29
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

Ollama to lokalne środowisko uruchomieniowe LLM, które ułatwia uruchamianie modeli open source na własnej maszynie. OpenClaw integruje się z natywnym API Ollama (`/api/chat`), obsługuje streaming i wywoływanie narzędzi oraz może automatycznie wykrywać lokalne modele Ollama, gdy włączysz to przez `OLLAMA_API_KEY` (lub profil auth) i nie zdefiniujesz jawnego wpisu `models.providers.ollama`.

<Warning>
**Użytkownicy zdalnego Ollama**: Nie używaj URL zgodnego z OpenAI `/v1` (`http://host:11434/v1`) z OpenClaw. To psuje wywoływanie narzędzi i modele mogą zwracać surowy JSON narzędzi jako zwykły tekst. Zamiast tego użyj natywnego URL API Ollama: `baseUrl: "http://host:11434"` (bez `/v1`).
</Warning>

## Szybki start

### Onboarding (zalecane)

Najszybszym sposobem konfiguracji Ollama jest onboarding:

```bash
openclaw onboard
```

Wybierz **Ollama** z listy dostawców. Onboarding:

1. Poprosi o bazowy URL Ollama, pod którym twoja instancja jest dostępna (domyślnie `http://127.0.0.1:11434`).
2. Pozwoli wybrać **Cloud + Local** (modele chmurowe i lokalne) albo **Local** (tylko modele lokalne).
3. Otworzy w przeglądarce przepływ logowania, jeśli wybierzesz **Cloud + Local** i nie jesteś zalogowany w ollama.com.
4. Wykryje dostępne modele i zasugeruje ustawienia domyślne.
5. Automatycznie pobierze wybrany model, jeśli nie jest dostępny lokalnie.

Obsługiwany jest także tryb nieinteraktywny:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --accept-risk
```

Opcjonalnie możesz podać niestandardowy bazowy URL lub model:

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
ollama pull glm-4.7-flash
# lub
ollama pull gpt-oss:20b
# lub
ollama pull llama3.3
```

3. Jeśli chcesz także modele chmurowe, zaloguj się:

```bash
ollama signin
```

4. Uruchom onboarding i wybierz `Ollama`:

```bash
openclaw onboard
```

- `Local`: tylko modele lokalne
- `Cloud + Local`: modele lokalne plus modele chmurowe
- Modele chmurowe, takie jak `kimi-k2.5:cloud`, `minimax-m2.5:cloud` i `glm-5:cloud`, **nie** wymagają lokalnego `ollama pull`

OpenClaw obecnie sugeruje:

- domyślny model lokalny: `glm-4.7-flash`
- domyślne modele chmurowe: `kimi-k2.5:cloud`, `minimax-m2.5:cloud`, `glm-5:cloud`

5. Jeśli wolisz konfigurację ręczną, włącz Ollama bezpośrednio dla OpenClaw (dowolna wartość działa; Ollama nie wymaga prawdziwego klucza):

```bash
# Ustaw zmienną środowiskową
export OLLAMA_API_KEY="ollama-local"

# Lub skonfiguruj w pliku konfiguracyjnym
openclaw config set models.providers.ollama.apiKey "ollama-local"
```

6. Sprawdź lub przełącz modele:

```bash
openclaw models list
openclaw models set ollama/glm-4.7-flash
```

7. Lub ustaw domyślny model w konfiguracji:

```json5
{
  agents: {
    defaults: {
      model: { primary: "ollama/glm-4.7-flash" },
    },
  },
}
```

## Wykrywanie modeli (niejawny dostawca)

Gdy ustawisz `OLLAMA_API_KEY` (lub profil auth) i **nie** zdefiniujesz `models.providers.ollama`, OpenClaw wykrywa modele z lokalnej instancji Ollama pod adresem `http://127.0.0.1:11434`:

- Odpytuje `/api/tags`
- Używa mechanizmu best-effort do odpytań `/api/show`, aby odczytać `contextWindow`, gdy jest dostępne
- Oznacza `reasoning` przy użyciu heurystyki nazwy modelu (`r1`, `reasoning`, `think`)
- Ustawia `maxTokens` na domyślny limit maksymalnej liczby tokenów Ollama używany przez OpenClaw
- Ustawia wszystkie koszty na `0`

Pozwala to uniknąć ręcznego dodawania modeli, a jednocześnie utrzymuje katalog zgodny z lokalną instancją Ollama.

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

Jeśli jawnie ustawisz `models.providers.ollama`, automatyczne wykrywanie zostanie pominięte i modele trzeba będzie zdefiniować ręcznie (patrz niżej).

## Konfiguracja

### Podstawowa konfiguracja (niejawne wykrywanie)

Najprostszy sposób włączenia Ollama to użycie zmiennej środowiskowej:

```bash
export OLLAMA_API_KEY="ollama-local"
```

### Jawna konfiguracja (modele ręczne)

Użyj jawnej konfiguracji, gdy:

- Ollama działa na innym hoście lub porcie.
- Chcesz wymusić konkretne okna kontekstu lub listy modeli.
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

Jeśli ustawiono `OLLAMA_API_KEY`, możesz pominąć `apiKey` we wpisie dostawcy, a OpenClaw uzupełni go na potrzeby sprawdzania dostępności.

### Niestandardowy bazowy URL (jawna konfiguracja)

Jeśli Ollama działa na innym hoście lub porcie (jawna konfiguracja wyłącza automatyczne wykrywanie, więc modele trzeba zdefiniować ręcznie):

```json5
{
  models: {
    providers: {
      ollama: {
        apiKey: "ollama-local",
        baseUrl: "http://ollama-host:11434", // Bez /v1 - użyj natywnego URL API Ollama
        api: "ollama", // Ustaw jawnie, aby zagwarantować natywne wywoływanie narzędzi
      },
    },
  },
}
```

<Warning>
Nie dodawaj `/v1` do URL. Ścieżka `/v1` używa trybu zgodnego z OpenAI, w którym wywoływanie narzędzi nie jest niezawodne. Użyj bazowego URL Ollama bez sufiksu ścieżki.
</Warning>

### Wybór modelu

Po skonfigurowaniu wszystkie twoje modele Ollama są dostępne:

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

Modele chmurowe pozwalają uruchamiać modele hostowane w chmurze (na przykład `kimi-k2.5:cloud`, `minimax-m2.5:cloud`, `glm-5:cloud`) obok modeli lokalnych.

Aby używać modeli chmurowych, podczas konfiguracji wybierz tryb **Cloud + Local**. Kreator sprawdza, czy jesteś zalogowany, i w razie potrzeby otwiera w przeglądarce przepływ logowania. Jeśli nie można zweryfikować uwierzytelnienia, kreator wraca do domyślnych modeli lokalnych.

Możesz też zalogować się bezpośrednio na [ollama.com/signin](https://ollama.com/signin).

## Ollama Web Search

OpenClaw obsługuje także **Ollama Web Search** jako wbudowanego dostawcę
`web_search`.

- Używa skonfigurowanego hosta Ollama (`models.providers.ollama.baseUrl`, jeśli
  ustawiono, w przeciwnym razie `http://127.0.0.1:11434`).
- Nie wymaga klucza.
- Wymaga uruchomionego Ollama oraz zalogowania przez `ollama signin`.

Wybierz **Ollama Web Search** podczas `openclaw onboard` albo
`openclaw configure --section web`, lub ustaw:

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

Pełne informacje o konfiguracji i zachowaniu znajdziesz w [Ollama Web Search](/tools/ollama-search).

## Zaawansowane

### Modele reasoning

OpenClaw domyślnie traktuje modele o nazwach takich jak `deepseek-r1`, `reasoning` lub `think` jako modele obsługujące reasoning:

```bash
ollama pull deepseek-r1:32b
```

### Koszty modeli

Ollama jest bezpłatna i działa lokalnie, więc wszystkie koszty modeli są ustawione na $0.

### Konfiguracja streamingu

Integracja OpenClaw z Ollama domyślnie używa **natywnego API Ollama** (`/api/chat`), które w pełni obsługuje jednocześnie streaming i wywoływanie narzędzi. Nie jest wymagana żadna specjalna konfiguracja.

#### Starszy tryb zgodny z OpenAI

<Warning>
**Wywoływanie narzędzi nie jest niezawodne w trybie zgodnym z OpenAI.** Używaj tego trybu tylko wtedy, gdy potrzebujesz formatu OpenAI dla proxy i nie polegasz na natywnym zachowaniu wywoływania narzędzi.
</Warning>

Jeśli zamiast tego musisz użyć punktu końcowego zgodnego z OpenAI (na przykład za proxy, które obsługuje tylko format OpenAI), jawnie ustaw `api: "openai-completions"`:

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

Ten tryb może nie obsługiwać jednocześnie streamingu i wywoływania narzędzi. Może być konieczne wyłączenie streamingu przez `params: { streaming: false }` w konfiguracji modelu.

Gdy `api: "openai-completions"` jest używane z Ollama, OpenClaw domyślnie wstrzykuje `options.num_ctx`, aby Ollama nie wracała po cichu do okna kontekstu 4096. Jeśli twoje proxy/upstream odrzuca nieznane pola `options`, wyłącz to zachowanie:

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

Dla modeli wykrytych automatycznie OpenClaw używa okna kontekstu raportowanego przez Ollama, gdy jest dostępne, w przeciwnym razie wraca do domyślnego okna kontekstu Ollama używanego przez OpenClaw. Możesz nadpisać `contextWindow` i `maxTokens` w jawnej konfiguracji dostawcy.

## Rozwiązywanie problemów

### Nie wykryto Ollama

Upewnij się, że Ollama działa, że ustawiono `OLLAMA_API_KEY` (lub profil auth), i że **nie** zdefiniowano jawnego wpisu `models.providers.ollama`:

```bash
ollama serve
```

Upewnij się też, że API jest dostępne:

```bash
curl http://localhost:11434/api/tags
```

### Brak dostępnych modeli

Jeśli twojego modelu nie ma na liście, zrób jedną z tych rzeczy:

- Pobierz model lokalnie albo
- Zdefiniuj model jawnie w `models.providers.ollama`.

Aby dodać modele:

```bash
ollama list  # Zobacz, co jest zainstalowane
ollama pull glm-4.7-flash
ollama pull gpt-oss:20b
ollama pull llama3.3     # Lub inny model
```

### Odmowa połączenia

Sprawdź, czy Ollama działa na właściwym porcie:

```bash
# Sprawdź, czy Ollama działa
ps aux | grep ollama

# Lub uruchom Ollama ponownie
ollama serve
```

## Zobacz także

- [Dostawcy modeli](/pl/concepts/model-providers) - przegląd wszystkich dostawców
- [Wybór modelu](/pl/concepts/models) - jak wybierać modele
- [Konfiguracja](/pl/gateway/configuration) - pełne odniesienie do konfiguracji
