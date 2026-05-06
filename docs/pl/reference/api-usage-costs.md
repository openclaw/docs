---
read_when:
    - Chcesz zrozumieć, które funkcje mogą wywoływać płatne interfejsy API
    - Musisz przeprowadzić audyt kluczy, kosztów i widoczności użycia
    - Wyjaśniasz raportowanie kosztów w /status lub /usage
summary: Przeprowadź audyt tego, co może wydawać pieniądze, które klucze są używane i jak wyświetlać użycie
title: Użycie API i koszty
x-i18n:
    generated_at: "2026-05-06T09:28:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8e6f9f8248ddb4241d00191aa231f1d72a2128a7995b4ed0ec0e18a7ed6dd69
    source_path: reference/api-usage-costs.md
    workflow: 16
---

Ten dokument wymienia **funkcje, które mogą wywoływać klucze API**, oraz miejsca, w których pojawiają się ich koszty. Koncentruje się na funkcjach OpenClaw, które mogą generować użycie dostawcy lub płatne wywołania API.

## Gdzie pojawiają się koszty (czat + CLI)

**Migawka kosztów dla sesji**

- `/status` pokazuje bieżący model sesji, użycie kontekstu i tokeny ostatniej odpowiedzi.
- Jeśli model używa **uwierzytelniania kluczem API**, `/status` pokazuje też **szacowany koszt** ostatniej odpowiedzi.
- Jeśli metadane sesji na żywo są skąpe, `/status` może odzyskać liczniki tokenów/pamięci podręcznej oraz etykietę aktywnego modelu uruchomieniowego z najnowszego wpisu użycia w transkrypcie. Istniejące niezerowe wartości na żywo nadal mają pierwszeństwo, a sumy transkryptu o rozmiarze promptu mogą wygrać, gdy zapisane sumy są brakujące lub mniejsze.

**Stopka kosztów dla wiadomości**

- `/usage full` dodaje stopkę użycia do każdej odpowiedzi, w tym **szacowany koszt** (tylko klucz API).
- `/usage tokens` pokazuje tylko tokeny; przepływy OAuth/tokenowe i CLI w stylu subskrypcji ukrywają koszt w dolarach.
- Uwaga Gemini CLI: gdy CLI zwraca dane wyjściowe JSON, OpenClaw odczytuje użycie z `stats`, normalizuje `stats.cached` do `cacheRead` i w razie potrzeby wyprowadza tokeny wejściowe z `stats.input_tokens - stats.cached`.

Uwaga Anthropic: pracownicy Anthropic poinformowali nas, że użycie Claude CLI w stylu OpenClaw jest znowu dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako zatwierdzone dla tej integracji, chyba że Anthropic opublikuje nową politykę. Anthropic nadal nie udostępnia szacunku kosztu w dolarach dla pojedynczej wiadomości, który OpenClaw mógłby pokazać w `/usage full`.

**Okna użycia CLI (limity dostawców)**

- `openclaw status --usage` i `openclaw channels list` pokazują **okna użycia** dostawcy (migawki limitów, nie koszty pojedynczych wiadomości).
- Dane wyjściowe dla człowieka są normalizowane do `X% left` u wszystkich dostawców.
- Obecni dostawcy okien użycia: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax, Xiaomi i z.ai.
- Uwaga MiniMax: jego surowe pola `usage_percent` / `usagePercent` oznaczają pozostały limit, więc OpenClaw odwraca je przed wyświetleniem. Pola oparte na licznikach nadal wygrywają, gdy są obecne. Jeśli dostawca zwraca `model_remains`, OpenClaw preferuje wpis modelu czatu, w razie potrzeby wyprowadza etykietę okna ze znaczników czasu i uwzględnia nazwę modelu w etykiecie planu.
- Uwierzytelnianie użycia dla tych okien limitów pochodzi z hooków specyficznych dla dostawcy, gdy są dostępne; w przeciwnym razie OpenClaw wraca do dopasowanych poświadczeń OAuth/klucza API z profili uwierzytelniania, zmiennych środowiskowych lub konfiguracji.

Szczegóły i przykłady znajdziesz w [Użycie tokenów i koszty](/pl/reference/token-use).

## Jak wykrywane są klucze

OpenClaw może pobierać poświadczenia z:

- **Profili uwierzytelniania** (dla każdego agenta, przechowywane w `auth-profiles.json`).
- **Zmiennych środowiskowych** (np. `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Konfiguracji** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`, `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`, `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`), które mogą eksportować klucze do środowiska procesu skill.

## Funkcje, które mogą zużywać klucze

### 1) Odpowiedzi głównego modelu (czat + narzędzia)

Każda odpowiedź lub wywołanie narzędzia używa **bieżącego dostawcy modelu** (OpenAI, Anthropic itd.). To podstawowe źródło użycia i kosztów.

Obejmuje to również hostowanych dostawców w stylu subskrypcji, którzy nadal rozliczają poza lokalnym UI OpenClaw, takich jak **OpenAI Codex**, **Alibaba Cloud Model Studio Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** oraz ścieżka logowania Anthropic Claude w OpenClaw z włączonym **Extra Usage**.

Zobacz [Modele](/pl/providers/models), aby poznać konfigurację cen, oraz [Użycie tokenów i koszty](/pl/reference/token-use), aby poznać sposób wyświetlania.

### 2) Rozumienie mediów (audio/obraz/wideo)

Media przychodzące mogą być streszczane/transkrybowane przed uruchomieniem odpowiedzi. Wykorzystuje to API modeli/dostawców.

- Audio: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- Obraz: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Wideo: Google / Qwen / Moonshot.

Zobacz [Rozumienie mediów](/pl/nodes/media-understanding).

### 3) Generowanie obrazów i wideo

Wspólne możliwości generowania również mogą zużywać klucze dostawców:

- Generowanie obrazów: OpenAI / Google / DeepInfra / fal / MiniMax
- Generowanie wideo: DeepInfra / Qwen

Generowanie obrazów może wywnioskować domyślnego dostawcę wspieranego uwierzytelnianiem, gdy `agents.defaults.imageGenerationModel` nie jest ustawione. Generowanie wideo obecnie wymaga jawnego `agents.defaults.videoGenerationModel`, takiego jak `qwen/wan2.6-t2v`.

Zobacz [Generowanie obrazów](/pl/tools/image-generation), [Qwen Cloud](/pl/providers/qwen) i [Modele](/pl/concepts/models).

### 4) Osadzenia pamięci + wyszukiwanie semantyczne

Semantyczne wyszukiwanie pamięci używa **API osadzeń**, gdy jest skonfigurowane dla zdalnych dostawców:

- `memorySearch.provider = "openai"` → osadzenia OpenAI
- `memorySearch.provider = "gemini"` → osadzenia Gemini
- `memorySearch.provider = "voyage"` → osadzenia Voyage
- `memorySearch.provider = "mistral"` → osadzenia Mistral
- `memorySearch.provider = "deepinfra"` → osadzenia DeepInfra
- `memorySearch.provider = "lmstudio"` → osadzenia LM Studio (lokalne/samodzielnie hostowane)
- `memorySearch.provider = "ollama"` → osadzenia Ollama (lokalne/samodzielnie hostowane; zwykle bez rozliczeń hostowanego API)
- Opcjonalne przełączenie awaryjne na zdalnego dostawcę, jeśli lokalne osadzenia zawiodą

Możesz pozostawić to lokalnie za pomocą `memorySearch.provider = "local"` (bez użycia API).

Zobacz [Pamięć](/pl/concepts/memory).

### 5) Narzędzie wyszukiwania w sieci

`web_search` może powodować naliczanie opłat za użycie w zależności od dostawcy:

- **Brave Search API**: `BRAVE_API_KEY` lub `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` lub `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` lub `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` lub `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` lub `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` lub `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` lub `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: bez klucza dla osiągalnego zalogowanego lokalnego hosta Ollama; bezpośrednie wyszukiwanie `https://ollama.com` używa `OLLAMA_API_KEY`, a hosty chronione uwierzytelnianiem mogą ponownie używać normalnego uwierzytelniania bearer dostawcy Ollama
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` lub `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` lub `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: awaryjnie bez klucza (bez rozliczeń API, ale nieoficjalne i oparte na HTML)
- **SearXNG**: `SEARXNG_BASE_URL` lub `plugins.entries.searxng.config.webSearch.baseUrl` (bez klucza/samodzielnie hostowane; bez rozliczeń hostowanego API)

Starsze ścieżki dostawców `tools.web.search.*` nadal ładują się przez tymczasową warstwę zgodności, ale nie są już zalecaną powierzchnią konfiguracji.

**Darmowy kredyt Brave Search:** Każdy plan Brave obejmuje odnawialny darmowy kredyt w wysokości \$5/miesiąc. Plan Search kosztuje \$5 za 1000 żądań, więc kredyt pokrywa 1000 żądań/miesiąc bez opłat. Ustaw limit użycia w panelu Brave, aby uniknąć nieoczekiwanych opłat.

Zobacz [Narzędzia sieciowe](/pl/tools/web).

### 5) Narzędzie pobierania stron (Firecrawl)

`web_fetch` może wywoływać **Firecrawl**, gdy obecny jest klucz API:

- `FIRECRAWL_API_KEY` lub `plugins.entries.firecrawl.config.webFetch.apiKey`

Jeśli Firecrawl nie jest skonfigurowany, narzędzie wraca do bezpośredniego pobierania oraz dołączonego pluginu `web-readability` (bez płatnego API). Wyłącz `plugins.entries.web-readability.enabled`, aby pominąć lokalne wyodrębnianie Readability.

Zobacz [Narzędzia sieciowe](/pl/tools/web).

### 6) Migawki użycia dostawcy (status/kondycja)

Niektóre polecenia statusu wywołują **endpointy użycia dostawcy**, aby wyświetlić okna limitów lub kondycję uwierzytelniania. Są to zwykle wywołania o niskim wolumenie, ale nadal trafiają do API dostawców:

- `openclaw status --usage`
- `openclaw models status --json`

Zobacz [CLI modeli](/pl/cli/models).

### 7) Streszczanie zabezpieczenia Compaction

Zabezpieczenie Compaction może streszczać historię sesji za pomocą **bieżącego modelu**, co wywołuje API dostawcy podczas działania.

Zobacz [Zarządzanie sesją + Compaction](/pl/reference/session-management-compaction).

### 8) Skanowanie / sondowanie modeli

`openclaw models scan` może sondować modele OpenRouter i używa `OPENROUTER_API_KEY`, gdy sondowanie jest włączone.

Zobacz [CLI modeli](/pl/cli/models).

### 9) Talk (mowa)

Tryb Talk może wywoływać **ElevenLabs**, gdy jest skonfigurowany:

- `ELEVENLABS_API_KEY` lub `talk.providers.elevenlabs.apiKey`

Zobacz [Tryb Talk](/pl/nodes/talk).

### 10) Skills (API firm trzecich)

Skills mogą przechowywać `apiKey` w `skills.entries.<name>.apiKey`. Jeśli skill używa tego klucza do zewnętrznych API, może generować koszty zgodnie z dostawcą danego skill.

Zobacz [Skills](/pl/tools/skills).

## Powiązane

- [Użycie tokenów i koszty](/pl/reference/token-use)
- [Buforowanie promptów](/pl/reference/prompt-caching)
- [Śledzenie użycia](/pl/concepts/usage-tracking)
