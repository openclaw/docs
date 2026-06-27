---
read_when:
    - Chcesz zrozumieć, które funkcje mogą wywoływać płatne API
    - Musisz audytować klucze, koszty i widoczność użycia
    - Wyjaśniasz raportowanie kosztów w /status lub /usage
summary: Audytuj, co może generować koszty, które klucze są używane i jak sprawdzać użycie
title: Użycie API i koszty
x-i18n:
    generated_at: "2026-06-27T18:17:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 473028747c3e8eab60667106d22616aa185f867d01238b856f4235faad957a9e
    source_path: reference/api-usage-costs.md
    workflow: 16
---

Ten dokument wymienia **funkcje, które mogą wywoływać klucze API**, oraz miejsca, w których pojawiają się ich koszty. Koncentruje się na
funkcjach OpenClaw, które mogą generować użycie dostawców lub płatne wywołania API.

## Gdzie pojawiają się koszty (czat + CLI)

**Migawka kosztu dla sesji**

- `/status` pokazuje bieżący model sesji, użycie kontekstu oraz tokeny ostatniej odpowiedzi.
- Jeśli OpenClaw ma metadane użycia i lokalne ceny dla aktywnego modelu,
  `/status` pokazuje także **szacowany koszt** ostatniej odpowiedzi. Może to obejmować
  jawnie wycenione dostawców bez klucza API, takie jak modele Bedrock `aws-sdk`.
- Jeśli metadane sesji na żywo są skąpe, `/status` może odzyskać liczniki
  tokenów/pamięci podręcznej oraz etykietę aktywnego modelu środowiska uruchomieniowego z najnowszego wpisu użycia w transkrypcie. Istniejące niezerowe wartości na żywo nadal mają pierwszeństwo, a sumy transkryptu o rozmiarze promptu mogą wygrać, gdy zapisanych sum brakuje albo są mniejsze.

**Stopka kosztu dla wiadomości**

- `/usage full` dodaje stopkę użycia do każdej odpowiedzi, w tym **szacowany koszt**,
  gdy lokalne ceny są skonfigurowane dla aktywnego modelu i dostępne są metadane użycia.
- `/usage tokens` pokazuje tylko tokeny; przepływy OAuth/tokenów w stylu subskrypcyjnym oraz CLI
  nadal pokazują tylko tokeny, chyba że dane środowisko uruchomieniowe dostarcza zgodne metadane użycia
  i skonfigurowano jawną lokalną cenę.
- Uwaga dotycząca Gemini CLI: domyślne wyjście `stream-json` oraz starsze nadpisania JSON
  odczytują użycie z `stats`, normalizują `stats.cached` do `cacheRead` i
  w razie potrzeby wyprowadzają tokeny wejściowe z `stats.input_tokens - stats.cached`.

Uwaga dotycząca Anthropic: pracownicy Anthropic powiedzieli nam, że użycie Claude CLI w stylu OpenClaw
jest ponownie dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI oraz użycie `claude -p` jako
zatwierdzone dla tej integracji, chyba że Anthropic opublikuje nową politykę.
Anthropic nadal nie udostępnia dolarowego szacunku dla pojedynczej wiadomości, który OpenClaw mógłby
pokazać w `/usage full`.

**Okna użycia CLI (limity dostawców)**

- `openclaw status --usage` i `openclaw channels list` pokazują **okna użycia** dostawców
  (migawki limitów, nie koszty pojedynczych wiadomości).
- Wyjście czytelne dla człowieka jest normalizowane do `X% left` dla różnych dostawców.
- Obecni dostawcy okien użycia: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi i z.ai.
- Uwaga dotycząca MiniMax: jego surowe pola `usage_percent` / `usagePercent` oznaczają pozostały
  limit, więc OpenClaw odwraca je przed wyświetleniem. Pola oparte na licznikach nadal wygrywają,
  gdy są obecne. Jeśli dostawca zwraca `model_remains`, OpenClaw preferuje
  wpis modelu czatu, w razie potrzeby wyprowadza etykietę okna ze znaczników czasu i
  uwzględnia nazwę modelu w etykiecie planu.
- Uwierzytelnianie użycia dla tych okien limitów pochodzi z haków specyficznych dla dostawcy, gdy
  są dostępne; w przeciwnym razie OpenClaw wraca do dopasowanych poświadczeń OAuth/kluczy API
  z profili uwierzytelniania, env lub konfiguracji.

Szczegóły i przykłady znajdziesz w [Użycie tokenów i koszty](/pl/reference/token-use).

## Jak wykrywane są klucze

OpenClaw może pobierać poświadczenia z:

- **Profili uwierzytelniania** (dla agenta, zapisanych w `auth-profiles.json`).
- **Zmiennych środowiskowych** (np. `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Konfiguracji** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`), które mogą eksportować klucze do env procesu Skills.

## Funkcje, które mogą zużywać klucze

### 1) Odpowiedzi modelu podstawowego (czat + narzędzia)

Każda odpowiedź lub wywołanie narzędzia używa **bieżącego dostawcy modelu** (OpenAI, Anthropic itd.). To
główne źródło użycia i kosztów.

Obejmuje to także hostowanych dostawców w stylu subskrypcyjnym, którzy nadal rozliczają poza
lokalnym interfejsem OpenClaw, takich jak **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** oraz
ścieżka logowania Claude w OpenClaw od Anthropic z włączonym **Extra Usage**.

Zobacz [Modele](/pl/providers/models) dla konfiguracji cen oraz [Użycie tokenów i koszty](/pl/reference/token-use) dla wyświetlania.

### 2) Rozumienie multimediów (audio/obraz/wideo)

Przychodzące multimedia mogą zostać podsumowane/transkrybowane przed uruchomieniem odpowiedzi. Używa to API modeli/dostawców.

- Audio: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- Obraz: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Wideo: Google / Qwen / Moonshot.

Zobacz [Rozumienie multimediów](/pl/nodes/media-understanding).

### 3) Generowanie obrazów i wideo

Wspólne możliwości generowania również mogą zużywać klucze dostawców:

- Generowanie obrazów: OpenAI / Google / DeepInfra / fal / MiniMax
- Generowanie wideo: DeepInfra / Qwen

Generowanie obrazów może wywnioskować domyślnego dostawcę opartego na uwierzytelnianiu, gdy
`agents.defaults.imageGenerationModel` nie jest ustawione. Generowanie wideo obecnie
wymaga jawnego `agents.defaults.videoGenerationModel`, takiego jak
`qwen/wan2.6-t2v`.

Zobacz [Generowanie obrazów](/pl/tools/image-generation), [Qwen Cloud](/pl/providers/qwen)
oraz [Modele](/pl/concepts/models).

### 4) Embeddingi pamięci + wyszukiwanie semantyczne

Semantyczne wyszukiwanie pamięci używa **API embeddingów**, gdy jest skonfigurowane dla zdalnych dostawców:

- `memorySearch.provider = "openai"` → embeddingi OpenAI
- `memorySearch.provider = "gemini"` → embeddingi Gemini
- `memorySearch.provider = "voyage"` → embeddingi Voyage
- `memorySearch.provider = "mistral"` → embeddingi Mistral
- `memorySearch.provider = "deepinfra"` → embeddingi DeepInfra
- `memorySearch.provider = "lmstudio"` → embeddingi LM Studio (lokalne/self-hosted)
- `memorySearch.provider = "ollama"` → embeddingi Ollama (lokalne/self-hosted; zwykle bez rozliczeń hostowanego API)
- Opcjonalny fallback do zdalnego dostawcy, jeśli lokalne embeddingi zawiodą

Możesz zachować to lokalnie przez `memorySearch.provider = "local"` (brak użycia API).

Zobacz [Pamięć](/pl/concepts/memory).

### 5) Narzędzie wyszukiwania w sieci

`web_search` może powodować opłaty za użycie w zależności od dostawcy:

- **Brave Search API**: `BRAVE_API_KEY` lub `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` lub `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` lub `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` lub `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: profil OAuth xAI, `XAI_API_KEY` lub `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` lub `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` lub `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: bez klucza dla osiągalnego, zalogowanego lokalnego hosta Ollama; bezpośrednie wyszukiwanie `https://ollama.com` używa `OLLAMA_API_KEY`, a hosty chronione uwierzytelnianiem mogą ponownie używać zwykłego uwierzytelniania bearer dostawcy Ollama
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` lub `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` lub `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: dostawca bez klucza, gdy zostanie jawnie wybrany (bez rozliczeń API, ale nieoficjalny i oparty na HTML)
- **SearXNG**: `SEARXNG_BASE_URL` lub `plugins.entries.searxng.config.webSearch.baseUrl` (bez klucza/self-hosted; bez rozliczeń hostowanego API)

Starsze ścieżki dostawców `tools.web.search.*` nadal ładują się przez tymczasowy shim zgodności, ale nie są już zalecaną powierzchnią konfiguracji.

**Bezpłatny kredyt Brave Search:** Każdy plan Brave obejmuje odnawialny kredyt
bezpłatny w wysokości \$5 miesięcznie. Plan Search kosztuje \$5 za 1000 żądań, więc kredyt pokrywa
1000 żądań miesięcznie bez opłat. Ustaw limit użycia w panelu Brave,
aby uniknąć nieoczekiwanych opłat.

Zobacz [Narzędzia webowe](/pl/tools/web).

### 5) Narzędzie pobierania z sieci (Firecrawl)

`web_fetch` może wywoływać **Firecrawl** z bezkluczowym dostępem startowym. Dodaj klucz API
dla wyższych limitów:

- `FIRECRAWL_API_KEY` lub `plugins.entries.firecrawl.config.webFetch.apiKey`

Jeśli Firecrawl nie jest skonfigurowany, narzędzie wraca do bezpośredniego pobierania oraz dołączonej wtyczki `web-readability` (bez płatnego API). Wyłącz `plugins.entries.web-readability.enabled`, aby pominąć lokalną ekstrakcję Readability.

Zobacz [Narzędzia webowe](/pl/tools/web).

### 6) Migawki użycia dostawcy (status/zdrowie)

Niektóre polecenia statusu wywołują **punkty końcowe użycia dostawcy**, aby wyświetlić okna limitów lub stan uwierzytelniania.
Są to zazwyczaj wywołania o niskim wolumenie, ale nadal trafiają do API dostawców:

- `openclaw status --usage`
- `openclaw models status --json`

Zobacz [CLI modeli](/pl/cli/models).

### 7) Podsumowywanie zabezpieczenia Compaction

Zabezpieczenie Compaction może podsumować historię sesji przy użyciu **bieżącego modelu**, co
wywołuje API dostawców, gdy zostanie uruchomione.

Zobacz [Zarządzanie sesją + Compaction](/pl/reference/session-management-compaction).

### 8) Skanowanie / sprawdzanie modeli

`openclaw models scan` może sprawdzać modele OpenRouter i używa `OPENROUTER_API_KEY`, gdy
sprawdzanie jest włączone.

Zobacz [CLI modeli](/pl/cli/models).

### 9) Talk (mowa)

Tryb Talk może wywoływać **ElevenLabs**, gdy jest skonfigurowany:

- `ELEVENLABS_API_KEY` lub `talk.providers.elevenlabs.apiKey`

Zobacz [Tryb Talk](/pl/nodes/talk).

### 10) Skills (API firm trzecich)

Skills mogą przechowywać `apiKey` w `skills.entries.<name>.apiKey`. Jeśli Skills używa tego klucza do zewnętrznych
API, może powodować koszty zgodnie z dostawcą Skills.

Zobacz [Skills](/pl/tools/skills).

## Powiązane

- [Użycie tokenów i koszty](/pl/reference/token-use)
- [Buforowanie promptów](/pl/reference/prompt-caching)
- [Śledzenie użycia](/pl/concepts/usage-tracking)
