---
read_when:
    - Chcesz zrozumieć, które funkcje mogą wywoływać płatne API
    - Musisz sprawdzić klucze, koszty i widoczność zużycia
    - Wyjaśniasz raportowanie kosztów w /status lub /usage
summary: Sprawdź, co może generować koszty, które klucze są używane i jak wyświetlać zużycie
title: Zużycie API i koszty
x-i18n:
    generated_at: "2026-04-07T09:49:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab6eefcde9ac014df6cdda7aaa77ef48f16936ab12eaa883d9fe69425a31a2dd
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# Zużycie API i koszty

Ten dokument wymienia **funkcje, które mogą wywoływać klucze API** oraz miejsca, w których pojawiają się ich koszty. Skupia się na
funkcjach OpenClaw, które mogą generować użycie dostawców lub płatne wywołania API.

## Gdzie pojawiają się koszty (czat + CLI)

**Migawka kosztów dla sesji**

- `/status` pokazuje bieżący model sesji, użycie kontekstu i tokeny ostatniej odpowiedzi.
- Jeśli model używa **uwierzytelniania kluczem API**, `/status` pokazuje także **szacowany koszt** ostatniej odpowiedzi.
- Jeśli metadane aktywnej sesji są ubogie, `/status` może odzyskać liczniki tokenów/cache
  oraz etykietę aktywnego modelu runtime z najnowszego wpisu użycia w transkrypcie.
  Istniejące niezerowe wartości aktywne nadal mają pierwszeństwo, a sumy z transkryptu wielkości promptu
  mogą wygrać, gdy zapisane sumy nie istnieją lub są mniejsze.

**Stopka kosztów dla wiadomości**

- `/usage full` dołącza stopkę użycia do każdej odpowiedzi, w tym **szacowany koszt** (tylko klucz API).
- `/usage tokens` pokazuje tylko tokeny; przepływy subskrypcyjne OAuth/token i CLI ukrywają koszt w dolarach.
- Uwaga dotycząca Gemini CLI: gdy CLI zwraca wyjście JSON, OpenClaw odczytuje użycie z
  `stats`, normalizuje `stats.cached` do `cacheRead` i w razie potrzeby wyprowadza tokeny wejściowe
  z `stats.input_tokens - stats.cached`.

Uwaga dotycząca Anthropic: pracownicy Anthropic poinformowali nas, że użycie Claude CLI w stylu OpenClaw jest
ponownie dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako
zatwierdzone dla tej integracji, chyba że Anthropic opublikuje nową politykę.
Anthropic nadal nie udostępnia oszacowania kosztu w dolarach dla pojedynczej wiadomości, które OpenClaw mógłby
pokazać w `/usage full`.

**Okna użycia CLI (limity dostawców)**

- `openclaw status --usage` i `openclaw channels list` pokazują **okna użycia** dostawców
  (migawki limitów, a nie koszty pojedynczych wiadomości).
- Wynik czytelny dla człowieka jest normalizowany do `X% left` dla wszystkich dostawców.
- Obecni dostawcy okien użycia: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi i z.ai.
- Uwaga dotycząca MiniMax: jego surowe pola `usage_percent` / `usagePercent` oznaczają pozostały
  limit, więc OpenClaw odwraca je przed wyświetleniem. Pola oparte na liczbie nadal mają
  pierwszeństwo, gdy są obecne. Jeśli dostawca zwróci `model_remains`, OpenClaw preferuje wpis modelu czatu,
  w razie potrzeby wyprowadza etykietę okna ze znaczników czasu
  i dołącza nazwę modelu do etykiety planu.
- Uwierzytelnianie użycia dla tych okien limitów pochodzi z hooków specyficznych dla dostawcy, gdy
  są dostępne; w przeciwnym razie OpenClaw wraca do dopasowywania poświadczeń OAuth/klucza API
  z profili auth, env lub konfiguracji.

Szczegóły i przykłady znajdziesz w [Token use & costs](/pl/reference/token-use).

## Jak wykrywane są klucze

OpenClaw może pobierać poświadczenia z:

- **Profili auth** (per agent, przechowywanych w `auth-profiles.json`).
- **Zmienne środowiskowe** (np. `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Konfiguracja** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`), które mogą eksportować klucze do env procesu skill.

## Funkcje, które mogą generować koszty z użycia kluczy

### 1) Główne odpowiedzi modelu (czat + narzędzia)

Każda odpowiedź lub wywołanie narzędzia używa **bieżącego dostawcy modelu** (OpenAI, Anthropic itd.). To
główne źródło użycia i kosztów.

Obejmuje to także hostowanych dostawców w stylu subskrypcyjnym, którzy nadal rozliczają się poza
lokalnym UI OpenClaw, takich jak **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** oraz
ścieżka logowania Anthropic Claude w OpenClaw z włączonym **Extra Usage**.

Informacje o konfiguracji cen znajdziesz w [Models](/pl/providers/models), a o wyświetlaniu w [Token use & costs](/pl/reference/token-use).

### 2) Rozumienie mediów (audio/obraz/wideo)

Przychodzące media mogą zostać podsumowane/przepisane przed uruchomieniem odpowiedzi. Wykorzystuje to API modeli/dostawców.

- Audio: OpenAI / Groq / Deepgram / Google / Mistral.
- Obraz: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Wideo: Google / Qwen / Moonshot.

Zobacz [Media understanding](/pl/nodes/media-understanding).

### 3) Generowanie obrazów i wideo

Współdzielone możliwości generowania również mogą zużywać klucze dostawców:

- Generowanie obrazów: OpenAI / Google / fal / MiniMax
- Generowanie wideo: Qwen

Generowanie obrazów może wywnioskować domyślnego dostawcę obsługiwanego przez auth, gdy
`agents.defaults.imageGenerationModel` nie jest ustawione. Generowanie wideo obecnie
wymaga jawnego `agents.defaults.videoGenerationModel`, takiego jak
`qwen/wan2.6-t2v`.

Zobacz [Image generation](/pl/tools/image-generation), [Qwen Cloud](/pl/providers/qwen)
i [Models](/pl/concepts/models).

### 4) Embeddingi pamięci + wyszukiwanie semantyczne

Semantyczne wyszukiwanie pamięci używa **API embeddingów**, gdy jest skonfigurowane dla zdalnych dostawców:

- `memorySearch.provider = "openai"` → embeddingi OpenAI
- `memorySearch.provider = "gemini"` → embeddingi Gemini
- `memorySearch.provider = "voyage"` → embeddingi Voyage
- `memorySearch.provider = "mistral"` → embeddingi Mistral
- `memorySearch.provider = "ollama"` → embeddingi Ollama (lokalne/self-hosted; zwykle bez rozliczania hostowanego API)
- Opcjonalny fallback do zdalnego dostawcy, jeśli lokalne embeddingi zawiodą

Możesz pozostać lokalnie z `memorySearch.provider = "local"` (bez użycia API).

Zobacz [Memory](/pl/concepts/memory).

### 5) Narzędzie wyszukiwania w sieci

`web_search` może generować opłaty zależnie od dostawcy:

- **Brave Search API**: `BRAVE_API_KEY` lub `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` lub `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` lub `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` lub `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` lub `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` lub `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` lub `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: domyślnie bez klucza, ale wymaga dostępnego hosta Ollama oraz `ollama signin`; może też ponownie używać zwykłego bearer auth dostawcy Ollama, gdy host tego wymaga
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` lub `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` lub `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: zapasowy fallback bez klucza (bez rozliczania API, ale nieoficjalny i oparty na HTML)
- **SearXNG**: `SEARXNG_BASE_URL` lub `plugins.entries.searxng.config.webSearch.baseUrl` (bez klucza/self-hosted; bez rozliczania hostowanego API)

Starsze ścieżki dostawców `tools.web.search.*` nadal są ładowane przez tymczasową warstwę zgodności, ale nie są już zalecaną powierzchnią konfiguracji.

**Darmowy kredyt Brave Search:** Każdy plan Brave obejmuje odnawialny darmowy
kredyt w wysokości \$5/miesiąc. Plan Search kosztuje \$5 za 1000 żądań, więc kredyt pokrywa
1000 żądań/miesiąc bez opłat. Ustaw limit użycia w panelu Brave,
aby uniknąć nieoczekiwanych opłat.

Zobacz [Web tools](/pl/tools/web).

### 5) Narzędzie pobierania z sieci (Firecrawl)

`web_fetch` może wywoływać **Firecrawl**, gdy obecny jest klucz API:

- `FIRECRAWL_API_KEY` lub `plugins.entries.firecrawl.config.webFetch.apiKey`

Jeśli Firecrawl nie jest skonfigurowany, narzędzie wraca do bezpośredniego pobierania + readability (bez płatnego API).

Zobacz [Web tools](/pl/tools/web).

### 6) Migawki użycia dostawcy (status/health)

Niektóre polecenia statusu wywołują **endpointy użycia dostawców**, aby wyświetlić okna limitów lub stan auth.
Zwykle są to wywołania o niskiej częstotliwości, ale nadal trafiają do API dostawców:

- `openclaw status --usage`
- `openclaw models status --json`

Zobacz [Models CLI](/cli/models).

### 7) Podsumowanie zabezpieczające przy kompaktowaniu

Zabezpieczenie kompaktowania może podsumowywać historię sesji przy użyciu **bieżącego modelu**, co
wywołuje API dostawców podczas działania.

Zobacz [Session management + compaction](/pl/reference/session-management-compaction).

### 8) Skanowanie / sondowanie modeli

`openclaw models scan` może sondować modele OpenRouter i używa `OPENROUTER_API_KEY`, gdy
sondowanie jest włączone.

Zobacz [Models CLI](/cli/models).

### 9) Talk (mowa)

Tryb Talk może wywoływać **ElevenLabs**, gdy jest skonfigurowany:

- `ELEVENLABS_API_KEY` lub `talk.providers.elevenlabs.apiKey`

Zobacz [Talk mode](/pl/nodes/talk).

### 10) Skills (API zewnętrzne)

Skills mogą przechowywać `apiKey` w `skills.entries.<name>.apiKey`. Jeśli skill używa tego klucza dla zewnętrznych
API, może generować koszty zgodnie z dostawcą tego skill.

Zobacz [Skills](/pl/tools/skills).
