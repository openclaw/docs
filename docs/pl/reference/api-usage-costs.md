---
read_when:
    - Chcesz zrozumieć, które funkcje mogą wywoływać płatne API
    - Musisz sprawdzić klucze, koszty i widoczność użycia
    - Wyjaśniasz raportowanie kosztów w /status lub /usage
summary: Sprawdź, co może generować koszty, które klucze są używane i jak wyświetlać użycie
title: Użycie API i koszty
x-i18n:
    generated_at: "2026-04-05T14:04:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71789950fe54dcdcd3e34c8ad6e3143f749cdfff5bbc2f14be4b85aaa467b14c
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# Użycie API i koszty

Ten dokument wymienia **funkcje, które mogą wywoływać klucze API**, oraz miejsca, w których pojawiają się ich koszty. Skupia się na
funkcjach OpenClaw, które mogą generować użycie dostawców lub płatne wywołania API.

## Gdzie pojawiają się koszty (czat + CLI)

**Migawka kosztów na sesję**

- `/status` pokazuje bieżący model sesji, użycie kontekstu oraz tokeny ostatniej odpowiedzi.
- Jeśli model używa **uwierzytelniania kluczem API**, `/status` pokazuje też **szacowany koszt** ostatniej odpowiedzi.
- Jeśli metadane aktywnej sesji są skąpe, `/status` może odzyskać liczniki
  tokenów/pamięci podręcznej oraz etykietę aktywnego modelu runtime z ostatniego wpisu
  użycia w transkrypcji. Istniejące niezerowe wartości aktywne nadal mają pierwszeństwo, a
  sumy z transkrypcji o rozmiarze promptu mogą wygrać, gdy zapisane sumy nie istnieją lub są mniejsze.

**Stopka kosztu dla każdej wiadomości**

- `/usage full` dołącza stopkę użycia do każdej odpowiedzi, w tym **szacowany koszt** (tylko przy kluczu API).
- `/usage tokens` pokazuje tylko tokeny; przepływy subskrypcyjne typu OAuth/token oraz CLI ukrywają koszt w dolarach.
- Uwaga dotycząca Gemini CLI: gdy CLI zwraca dane wyjściowe JSON, OpenClaw odczytuje użycie z
  `stats`, normalizuje `stats.cached` do `cacheRead` i w razie potrzeby wyprowadza tokeny wejściowe
  z `stats.input_tokens - stats.cached`.

Uwaga dotycząca Anthropic: publiczna dokumentacja Claude Code od Anthropic nadal uwzględnia bezpośrednie użycie
Claude Code w terminalu w limitach planu Claude. Osobno Anthropic poinformował użytkowników OpenClaw, że od
**4 kwietnia 2026 o 12:00 PM PT / 8:00 PM BST** ścieżka logowania Claude w **OpenClaw** jest liczona jako użycie przez
zewnętrzny harness i wymaga **Extra Usage** rozliczanego oddzielnie od subskrypcji. Anthropic
nie udostępnia szacunku kosztu w dolarach dla pojedynczej wiadomości, który OpenClaw mógłby pokazać w
`/usage full`.

**Okna użycia CLI (limity dostawców)**

- `openclaw status --usage` i `openclaw channels list` pokazują **okna użycia** dostawców
  (migawki limitów, a nie koszty pojedynczych wiadomości).
- Czytelny dla człowieka wynik jest normalizowany do postaci `X% left` u wszystkich dostawców.
- Obecni dostawcy z oknami użycia: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi i z.ai.
- Uwaga dotycząca MiniMax: jego surowe pola `usage_percent` / `usagePercent` oznaczają pozostały
  limit, więc OpenClaw odwraca je przed wyświetleniem. Pola oparte na liczbie nadal mają pierwszeństwo,
  jeśli są obecne. Jeśli dostawca zwraca `model_remains`, OpenClaw preferuje wpis modelu czatu,
  w razie potrzeby wyprowadza etykietę okna z sygnatur czasowych i
  uwzględnia nazwę modelu w etykiecie planu.
- Uwierzytelnianie użycia dla tych okien limitów pochodzi z hooków specyficznych dla dostawców, gdy są dostępne;
  w przeciwnym razie OpenClaw wraca do dopasowywania poświadczeń OAuth/klucza API
  z profili uwierzytelniania, środowiska lub konfiguracji.

Szczegóły i przykłady znajdziesz w [Użycie tokenów i koszty](/reference/token-use).

## Jak są wykrywane klucze

OpenClaw może pobierać poświadczenia z:

- **Profili uwierzytelniania** (na agenta, przechowywanych w `auth-profiles.json`).
- **Zmiennych środowiskowych** (np. `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Konfiguracji** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`), które mogą eksportować klucze do środowiska procesu skill.

## Funkcje, które mogą generować koszty kluczy

### 1) Główne odpowiedzi modeli (czat + narzędzia)

Każda odpowiedź lub wywołanie narzędzia używa **bieżącego dostawcy modelu** (OpenAI, Anthropic itd.). To
główne źródło użycia i kosztów.

Obejmuje to także dostawców hostowanych w modelu subskrypcyjnym, którzy nadal rozliczają poza
lokalnym interfejsem OpenClaw, takich jak **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** oraz
ścieżka logowania Claude w OpenClaw od Anthropic z włączonym **Extra Usage**.

Zobacz [Modele](/providers/models), aby poznać konfigurację cen, oraz [Użycie tokenów i koszty](/reference/token-use), aby poznać sposób wyświetlania.

### 2) Rozumienie mediów (audio/obraz/wideo)

Przychodzące media mogą być streszczane/transkrybowane przed uruchomieniem odpowiedzi. Wykorzystuje to API modeli/dostawców.

- Audio: OpenAI / Groq / Deepgram / Google / Mistral.
- Obraz: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Wideo: Google / Qwen / Moonshot.

Zobacz [Rozumienie mediów](/pl/nodes/media-understanding).

### 3) Generowanie obrazów i wideo

Współdzielone możliwości generowania również mogą generować koszty po stronie kluczy dostawców:

- Generowanie obrazów: OpenAI / Google / fal / MiniMax
- Generowanie wideo: Qwen

Generowanie obrazów może wywnioskować domyślnego dostawcę opartego na uwierzytelnianiu, gdy
`agents.defaults.imageGenerationModel` nie jest ustawione. Generowanie wideo obecnie
wymaga jawnego `agents.defaults.videoGenerationModel`, takiego jak
`qwen/wan2.6-t2v`.

Zobacz [Generowanie obrazów](/tools/image-generation), [Qwen Cloud](/providers/qwen)
i [Modele](/pl/concepts/models).

### 4) Embeddingi pamięci + wyszukiwanie semantyczne

Semantyczne wyszukiwanie pamięci używa **API embeddingów**, gdy jest skonfigurowane dla zdalnych dostawców:

- `memorySearch.provider = "openai"` → embeddingi OpenAI
- `memorySearch.provider = "gemini"` → embeddingi Gemini
- `memorySearch.provider = "voyage"` → embeddingi Voyage
- `memorySearch.provider = "mistral"` → embeddingi Mistral
- `memorySearch.provider = "ollama"` → embeddingi Ollama (lokalne/self-hosted; zazwyczaj bez opłat za hostowane API)
- Opcjonalny fallback do zdalnego dostawcy, jeśli lokalne embeddingi zawiodą

Możesz pozostać lokalnie z `memorySearch.provider = "local"` (bez użycia API).

Zobacz [Pamięć](/pl/concepts/memory).

### 5) Narzędzie wyszukiwania w sieci

`web_search` może generować opłaty za użycie w zależności od dostawcy:

- **Brave Search API**: `BRAVE_API_KEY` lub `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` lub `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` lub `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` lub `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` lub `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` lub `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` lub `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: domyślnie bez klucza, ale wymaga osiągalnego hosta Ollama oraz `ollama signin`; może też ponownie używać zwykłego uwierzytelniania bearer dostawcy Ollama, gdy host tego wymaga
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` lub `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` lub `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: fallback bez klucza (bez opłat za API, ale nieoficjalny i oparty na HTML)
- **SearXNG**: `SEARXNG_BASE_URL` lub `plugins.entries.searxng.config.webSearch.baseUrl` (bez klucza/self-hosted; bez opłat za hostowane API)

Starsze ścieżki dostawców `tools.web.search.*` nadal ładują się przez tymczasową warstwę zgodności, ale nie są już zalecaną powierzchnią konfiguracji.

**Bezpłatny kredyt Brave Search:** Każdy plan Brave obejmuje odnawialny
bezpłatny kredyt w wysokości \$5 miesięcznie. Plan Search kosztuje \$5 za 1000 żądań, więc ten kredyt pokrywa
1000 żądań miesięcznie bez opłat. Ustaw limit użycia w panelu Brave,
aby uniknąć nieoczekiwanych kosztów.

Zobacz [Narzędzia web](/tools/web).

### 5) Narzędzie pobierania z sieci (Firecrawl)

`web_fetch` może wywoływać **Firecrawl**, gdy obecny jest klucz API:

- `FIRECRAWL_API_KEY` lub `plugins.entries.firecrawl.config.webFetch.apiKey`

Jeśli Firecrawl nie jest skonfigurowany, narzędzie wraca do bezpośredniego fetch + readability (bez płatnego API).

Zobacz [Narzędzia web](/tools/web).

### 6) Migawki użycia dostawców (status/health)

Niektóre polecenia statusu wywołują **endpointy użycia dostawców**, aby wyświetlić okna limitów lub stan uwierzytelniania.
Zwykle są to wywołania o małej skali, ale nadal trafiają do API dostawców:

- `openclaw status --usage`
- `openclaw models status --json`

Zobacz [CLI modeli](/cli/models).

### 7) Zabezpieczenie kompakcji przez streszczanie

Zabezpieczenie kompakcji może streszczać historię sesji przy użyciu **bieżącego modelu**, co
wywołuje API dostawcy podczas działania.

Zobacz [Zarządzanie sesją + kompakcja](/reference/session-management-compaction).

### 8) Skanowanie / sondowanie modeli

`openclaw models scan` może sondować modele OpenRouter i używa `OPENROUTER_API_KEY`, gdy
sondowanie jest włączone.

Zobacz [CLI modeli](/cli/models).

### 9) Talk (mowa)

Tryb Talk może wywoływać **ElevenLabs**, gdy jest skonfigurowany:

- `ELEVENLABS_API_KEY` lub `talk.providers.elevenlabs.apiKey`

Zobacz [Tryb Talk](/pl/nodes/talk).

### 10) Skills (API zewnętrzne)

Skills mogą przechowywać `apiKey` w `skills.entries.<name>.apiKey`. Jeśli skill używa tego klucza do zewnętrznych
API, może generować koszty zgodnie z dostawcą tego skill.

Zobacz [Skills](/tools/skills).
