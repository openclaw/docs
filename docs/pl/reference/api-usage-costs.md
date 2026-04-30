---
read_when:
    - Chcesz zrozumieć, które funkcje mogą wywoływać płatne API
    - Musisz audytować klucze, koszty i widoczność użycia
    - Wyjaśniasz raportowanie kosztów w /status lub /usage
summary: Skontroluj, co może generować koszty, jakie klucze są używane i jak sprawdzić wykorzystanie
title: Korzystanie z API i koszty
x-i18n:
    generated_at: "2026-04-30T10:16:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5638007a77a93701ce4ed9139a6c4377c951e2d69941423c3e1b19b5bd52d5d5
    source_path: reference/api-usage-costs.md
    workflow: 16
---

# Użycie API i koszty

Ten dokument zawiera listę **funkcji, które mogą używać kluczy API**, oraz miejsc, w których pojawiają się ich koszty. Skupia się na
funkcjach OpenClaw, które mogą generować użycie dostawcy lub płatne wywołania API.

## Gdzie pojawiają się koszty (czat + CLI)

**Migawka kosztu na sesję**

- `/status` pokazuje bieżący model sesji, użycie kontekstu i tokeny ostatniej odpowiedzi.
- Jeśli model używa **uwierzytelniania kluczem API**, `/status` pokazuje też **szacowany koszt** ostatniej odpowiedzi.
- Jeśli metadane sesji na żywo są skąpe, `/status` może odzyskać liczniki
  tokenów/cache oraz etykietę aktywnego modelu środowiska wykonawczego z najnowszego wpisu użycia
  w transkrypcie. Istniejące niezerowe wartości na żywo nadal mają pierwszeństwo, a sumy transkryptu
  o rozmiarze promptu mogą wygrać, gdy zapisanych sum brakuje lub są mniejsze.

**Stopka kosztu na wiadomość**

- `/usage full` dodaje stopkę użycia do każdej odpowiedzi, w tym **szacowany koszt** (tylko klucz API).
- `/usage tokens` pokazuje tylko tokeny; przepływy OAuth/tokenów w stylu subskrypcji i CLI ukrywają koszt w dolarach.
- Uwaga dotycząca Gemini CLI: gdy CLI zwraca wyjście JSON, OpenClaw odczytuje użycie z
  `stats`, normalizuje `stats.cached` do `cacheRead` i w razie potrzeby wyprowadza tokeny wejściowe
  z `stats.input_tokens - stats.cached`.

Uwaga dotycząca Anthropic: pracownicy Anthropic poinformowali nas, że użycie Claude CLI w stylu OpenClaw
jest ponownie dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako
zatwierdzone dla tej integracji, chyba że Anthropic opublikuje nową politykę.
Anthropic nadal nie udostępnia szacunku kosztu w dolarach na wiadomość, który OpenClaw mógłby
pokazać w `/usage full`.

**Okna użycia CLI (limity dostawców)**

- `openclaw status --usage` i `openclaw channels list` pokazują **okna użycia** dostawców
  (migawki limitów, nie koszty na wiadomość).
- Wyjście dla człowieka jest normalizowane do `X% left` u wszystkich dostawców.
- Obecni dostawcy okien użycia: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi i z.ai.
- Uwaga dotycząca MiniMax: jego surowe pola `usage_percent` / `usagePercent` oznaczają pozostały
  limit, więc OpenClaw odwraca je przed wyświetleniem. Pola oparte na liczbie nadal wygrywają,
  gdy są obecne. Jeśli dostawca zwraca `model_remains`, OpenClaw preferuje wpis
  modelu czatu, w razie potrzeby wyprowadza etykietę okna ze znaczników czasu i
  uwzględnia nazwę modelu w etykiecie planu.
- Uwierzytelnianie użycia dla tych okien limitów pochodzi z haków specyficznych dla dostawcy, gdy
  są dostępne; w przeciwnym razie OpenClaw wraca do dopasowania poświadczeń OAuth/klucza API
  z profili uwierzytelniania, środowiska lub konfiguracji.

Szczegóły i przykłady znajdziesz w [Użycie tokenów i koszty](/pl/reference/token-use).

## Jak wykrywane są klucze

OpenClaw może pobierać poświadczenia z:

- **Profili uwierzytelniania** (na agenta, przechowywane w `auth-profiles.json`).
- **Zmiennych środowiskowych** (np. `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Konfiguracji** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`), które mogą eksportować klucze do środowiska procesu umiejętności.

## Funkcje, które mogą wydawać środki z kluczy

### 1) Odpowiedzi modelu rdzenia (czat + narzędzia)

Każda odpowiedź lub wywołanie narzędzia używa **bieżącego dostawcy modelu** (OpenAI, Anthropic itd.). To
główne źródło użycia i kosztów.

Obejmuje to także hostowanych dostawców w stylu subskrypcji, którzy nadal rozliczają poza
lokalnym UI OpenClaw, takich jak **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** oraz
ścieżkę logowania Claude przez OpenClaw od Anthropic z włączonym **Extra Usage**.

Konfigurację cen znajdziesz w [Modele](/pl/providers/models), a wyświetlanie w [Użycie tokenów i koszty](/pl/reference/token-use).

### 2) Rozumienie mediów (audio/obraz/wideo)

Media przychodzące mogą zostać podsumowane/przepisane przed uruchomieniem odpowiedzi. Używa to API modeli/dostawców.

- Audio: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- Obraz: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Wideo: Google / Qwen / Moonshot.

Zobacz [Rozumienie mediów](/pl/nodes/media-understanding).

### 3) Generowanie obrazów i wideo

Wspólne funkcje generowania także mogą zużywać klucze dostawców:

- Generowanie obrazów: OpenAI / Google / DeepInfra / fal / MiniMax
- Generowanie wideo: DeepInfra / Qwen

Generowanie obrazów może wywnioskować domyślnego dostawcę opartego na uwierzytelnianiu, gdy
`agents.defaults.imageGenerationModel` nie jest ustawione. Generowanie wideo obecnie
wymaga jawnego `agents.defaults.videoGenerationModel`, takiego jak
`qwen/wan2.6-t2v`.

Zobacz [Generowanie obrazów](/pl/tools/image-generation), [Qwen Cloud](/pl/providers/qwen)
i [Modele](/pl/concepts/models).

### 4) Osadzenia pamięci + wyszukiwanie semantyczne

Semantyczne wyszukiwanie w pamięci używa **API osadzeń**, gdy skonfigurowano zdalnych dostawców:

- `memorySearch.provider = "openai"` → osadzenia OpenAI
- `memorySearch.provider = "gemini"` → osadzenia Gemini
- `memorySearch.provider = "voyage"` → osadzenia Voyage
- `memorySearch.provider = "mistral"` → osadzenia Mistral
- `memorySearch.provider = "deepinfra"` → osadzenia DeepInfra
- `memorySearch.provider = "lmstudio"` → osadzenia LM Studio (lokalne/samodzielnie hostowane)
- `memorySearch.provider = "ollama"` → osadzenia Ollama (lokalne/samodzielnie hostowane; zwykle bez rozliczeń hostowanego API)
- Opcjonalny fallback do zdalnego dostawcy, jeśli lokalne osadzenia zawiodą

Możesz utrzymać je lokalnie za pomocą `memorySearch.provider = "local"` (bez użycia API).

Zobacz [Pamięć](/pl/concepts/memory).

### 5) Narzędzie wyszukiwania w sieci

`web_search` może powodować opłaty za użycie zależnie od dostawcy:

- **Brave Search API**: `BRAVE_API_KEY` lub `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` lub `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` lub `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` lub `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` lub `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` lub `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` lub `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: bez klucza dla osiągalnego lokalnego hosta Ollama z aktywnym logowaniem; bezpośrednie wyszukiwanie `https://ollama.com` używa `OLLAMA_API_KEY`, a hosty chronione uwierzytelnianiem mogą ponownie używać zwykłego uwierzytelniania bearer dostawcy Ollama
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` lub `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` lub `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: fallback bez klucza (bez rozliczeń API, ale nieoficjalny i oparty na HTML)
- **SearXNG**: `SEARXNG_BASE_URL` lub `plugins.entries.searxng.config.webSearch.baseUrl` (bez klucza/samodzielnie hostowane; bez rozliczeń hostowanego API)

Starsze ścieżki dostawców `tools.web.search.*` nadal ładują się przez tymczasową warstwę zgodności, ale nie są już zalecaną powierzchnią konfiguracji.

**Darmowy kredyt Brave Search:** Każdy plan Brave obejmuje odnawialny
darmowy kredyt \$5/miesiąc. Plan Search kosztuje \$5 za 1000 żądań, więc kredyt pokrywa
1000 żądań/miesiąc bez opłat. Ustaw limit użycia w panelu Brave,
aby uniknąć nieoczekiwanych opłat.

Zobacz [Narzędzia webowe](/pl/tools/web).

### 5) Narzędzie pobierania z sieci (Firecrawl)

`web_fetch` może wywoływać **Firecrawl**, gdy obecny jest klucz API:

- `FIRECRAWL_API_KEY` lub `plugins.entries.firecrawl.config.webFetch.apiKey`

Jeśli Firecrawl nie jest skonfigurowany, narzędzie wraca do bezpośredniego pobierania oraz dołączonego pluginu `web-readability` (bez płatnego API). Wyłącz `plugins.entries.web-readability.enabled`, aby pominąć lokalną ekstrakcję Readability.

Zobacz [Narzędzia webowe](/pl/tools/web).

### 6) Migawki użycia dostawców (status/kondycja)

Niektóre polecenia statusu wywołują **punkty końcowe użycia dostawców**, aby wyświetlić okna limitów lub kondycję uwierzytelniania.
Są to zwykle wywołania o małej liczbie, ale nadal trafiają do API dostawców:

- `openclaw status --usage`
- `openclaw models status --json`

Zobacz [CLI modeli](/pl/cli/models).

### 7) Podsumowywanie zabezpieczenia Compaction

Zabezpieczenie Compaction może podsumowywać historię sesji przy użyciu **bieżącego modelu**, co
wywołuje API dostawców, gdy działa.

Zobacz [Zarządzanie sesją + Compaction](/pl/reference/session-management-compaction).

### 8) Skanowanie / sondowanie modeli

`openclaw models scan` może sondować modele OpenRouter i używa `OPENROUTER_API_KEY`, gdy
sondowanie jest włączone.

Zobacz [CLI modeli](/pl/cli/models).

### 9) Talk (mowa)

Tryb Talk może wywoływać **ElevenLabs**, gdy jest skonfigurowany:

- `ELEVENLABS_API_KEY` lub `talk.providers.elevenlabs.apiKey`

Zobacz [Tryb Talk](/pl/nodes/talk).

### 10) Skills (API firm trzecich)

Skills mogą przechowywać `apiKey` w `skills.entries.<name>.apiKey`. Jeśli Skills używa tego klucza do zewnętrznych
API, może generować koszty zgodnie z dostawcą umiejętności.

Zobacz [Skills](/pl/tools/skills).

## Powiązane

- [Użycie tokenów i koszty](/pl/reference/token-use)
- [Buforowanie promptów](/pl/reference/prompt-caching)
- [Śledzenie użycia](/pl/concepts/usage-tracking)
