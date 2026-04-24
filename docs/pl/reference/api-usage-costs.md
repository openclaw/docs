---
read_when:
    - Chcesz zrozumieć, które funkcje mogą wywoływać płatne API
    - Potrzebujesz audytu kluczy, kosztów i widoczności użycia
    - Wyjaśniasz raportowanie /status lub /usage cost
summary: Sprawdź, co może generować koszty, które klucze są używane i jak wyświetlić użycie
title: Użycie API i koszty
x-i18n:
    generated_at: "2026-04-24T09:31:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: d44b34a782a4090a074c49b91df3fa9733f13f16b3d39258b6cf57cf24043f43
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# Użycie API i koszty

Ten dokument wymienia **funkcje, które mogą wywoływać klucze API** i miejsca, w których ich koszty są widoczne. Skupia się na funkcjach OpenClaw, które mogą generować użycie dostawców lub płatne wywołania API.

## Gdzie widać koszty (czat + CLI)

**Snapshot kosztu per sesja**

- `/status` pokazuje bieżący model sesji, użycie kontekstu i tokeny ostatniej odpowiedzi.
- Jeśli model używa **auth kluczem API**, `/status` pokazuje też **szacowany koszt** ostatniej odpowiedzi.
- Jeśli aktywne metadane sesji są ubogie, `/status` może odzyskać liczniki tokenów/cache
  i etykietę aktywnego modelu runtime z najnowszego wpisu użycia w transkrypcie. Istniejące niezerowe wartości aktywne nadal mają pierwszeństwo, a sumy z transkryptu wielkości promptu mogą wygrywać, gdy zapisane sumy są nieobecne lub mniejsze.

**Stopka kosztu per wiadomość**

- `/usage full` dodaje do każdej odpowiedzi stopkę użycia, w tym **szacowany koszt** (tylko klucz API).
- `/usage tokens` pokazuje tylko tokeny; przepływy OAuth/token w stylu subskrypcyjnym i CLI ukrywają koszt w dolarach.
- Uwaga o Gemini CLI: gdy CLI zwraca wyjście JSON, OpenClaw odczytuje użycie z
  `stats`, normalizuje `stats.cached` do `cacheRead` i w razie potrzeby wyprowadza tokeny wejściowe z
  `stats.input_tokens - stats.cached`.

Uwaga o Anthropic: pracownicy Anthropic powiedzieli nam, że użycie Claude CLI w stylu OpenClaw jest
ponownie dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI i użycie
`claude -p` jako usankcjonowane dla tej integracji, chyba że Anthropic opublikuje nową politykę.
Anthropic nadal nie ujawnia szacunku kosztu per wiadomość w dolarach, który OpenClaw mógłby
pokazać w `/usage full`.

**Okna użycia CLI (kwoty dostawców)**

- `openclaw status --usage` i `openclaw channels list` pokazują **okna użycia** dostawców
  (snapshoty kwot, a nie koszty per wiadomość).
- Wyjście dla człowieka jest normalizowane do postaci `X% left` u różnych dostawców.
- Obecni dostawcy okien użycia: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi i z.ai.
- Uwaga o MiniMax: jego surowe pola `usage_percent` / `usagePercent` oznaczają pozostałą
  kwotę, więc OpenClaw odwraca je przed wyświetleniem. Pola oparte na liczbie nadal mają pierwszeństwo,
  gdy są obecne. Jeśli dostawca zwraca `model_remains`, OpenClaw preferuje wpis modelu czatu, w razie potrzeby wyprowadza etykietę okna ze znaczników czasu i uwzględnia nazwę modelu w etykiecie planu.
- Auth użycia dla tych okien kwot pochodzi z Hooków specyficznych dla dostawcy, gdy są dostępne; w przeciwnym razie OpenClaw wraca do dopasowania poświadczeń OAuth/kluczy API z profili auth, env lub konfiguracji.

Szczegóły i przykłady znajdziesz w [Użycie tokenów i koszty](/pl/reference/token-use).

## Jak wykrywane są klucze

OpenClaw może pobierać poświadczenia z:

- **Profili auth** (per agent, przechowywane w `auth-profiles.json`).
- **Zmienne środowiskowe** (np. `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Config** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`), które mogą eksportować klucze do env procesu Skill.

## Funkcje, które mogą zużywać klucze

### 1) Odpowiedzi modeli core (czat + narzędzia)

Każda odpowiedź lub wywołanie narzędzia używa **bieżącego dostawcy modelu** (OpenAI, Anthropic itd.). To
główne źródło użycia i kosztów.

Obejmuje to też hostowanych dostawców w stylu subskrypcyjnym, którzy nadal rozliczają poza
lokalnym UI OpenClaw, takich jak **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** oraz ścieżka logowania Anthropic Claude w OpenClaw z włączonym **Extra Usage**.

Zobacz [Modele](/pl/providers/models), aby poznać konfigurację cen, oraz [Użycie tokenów i koszty](/pl/reference/token-use), aby poznać sposób wyświetlania.

### 2) Rozumienie multimediów (audio/obraz/wideo)

Przychodzące multimedia mogą zostać podsumowane / przetranskrybowane przed uruchomieniem odpowiedzi. To używa API modeli/dostawców.

- Audio: OpenAI / Groq / Deepgram / Google / Mistral.
- Obraz: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Wideo: Google / Qwen / Moonshot.

Zobacz [Rozumienie multimediów](/pl/nodes/media-understanding).

### 3) Generowanie obrazów i wideo

Współdzielone możliwości generowania również mogą zużywać klucze dostawców:

- Generowanie obrazów: OpenAI / Google / fal / MiniMax
- Generowanie wideo: Qwen

Generowanie obrazów może wywnioskować domyślną wartość dostawcy opartą na auth, gdy
`agents.defaults.imageGenerationModel` nie jest ustawione. Generowanie wideo obecnie
wymaga jawnego `agents.defaults.videoGenerationModel`, takiego jak
`qwen/wan2.6-t2v`.

Zobacz [Generowanie obrazów](/pl/tools/image-generation), [Qwen Cloud](/pl/providers/qwen)
i [Modele](/pl/concepts/models).

### 4) Embeddingi pamięci + wyszukiwanie semantyczne

Semantyczne wyszukiwanie pamięci używa **API embeddingów**, gdy skonfigurowano zdalnych dostawców:

- `memorySearch.provider = "openai"` → embeddingi OpenAI
- `memorySearch.provider = "gemini"` → embeddingi Gemini
- `memorySearch.provider = "voyage"` → embeddingi Voyage
- `memorySearch.provider = "mistral"` → embeddingi Mistral
- `memorySearch.provider = "lmstudio"` → embeddingi LM Studio (lokalne/self-hosted)
- `memorySearch.provider = "ollama"` → embeddingi Ollama (lokalne/self-hosted; zazwyczaj bez kosztów hostowanego API)
- Opcjonalny fallback do zdalnego dostawcy, jeśli lokalne embeddingi zawiodą

Możesz utrzymać wszystko lokalnie przez `memorySearch.provider = "local"` (bez użycia API).

Zobacz [Pamięć](/pl/concepts/memory).

### 5) Narzędzie wyszukiwania w internecie

`web_search` może generować opłaty zależnie od dostawcy:

- **Brave Search API**: `BRAVE_API_KEY` albo `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` albo `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` albo `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` albo `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` albo `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` albo `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` albo `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: domyślnie bez klucza, ale wymaga osiągalnego hosta Ollama plus `ollama signin`; może też ponownie używać zwykłego bearer auth dostawcy Ollama, gdy host tego wymaga
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` albo `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` albo `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: fallback bez klucza (bez rozliczeń API, ale nieoficjalny i oparty na HTML)
- **SearXNG**: `SEARXNG_BASE_URL` albo `plugins.entries.searxng.config.webSearch.baseUrl` (bez klucza/self-hosted; bez kosztów hostowanego API)

Starsze ścieżki dostawców `tools.web.search.*` nadal są ładowane przez tymczasową warstwę zgodności, ale nie są już zalecaną powierzchnią konfiguracji.

**Darmowy kredyt Brave Search:** Każdy plan Brave obejmuje 5 USD/miesiąc odnawialnego
darmowego kredytu. Plan Search kosztuje 5 USD za 1000 żądań, więc kredyt pokrywa
1000 żądań/miesiąc bez opłat. Ustaw limit użycia w panelu Brave,
aby uniknąć nieoczekiwanych kosztów.

Zobacz [Narzędzia internetowe](/pl/tools/web).

### 5) Narzędzie web fetch (Firecrawl)

`web_fetch` może wywoływać **Firecrawl**, gdy obecny jest klucz API:

- `FIRECRAWL_API_KEY` albo `plugins.entries.firecrawl.config.webFetch.apiKey`

Jeśli Firecrawl nie jest skonfigurowane, narzędzie wraca do bezpośredniego fetch + readability (bez płatnego API).

Zobacz [Narzędzia internetowe](/pl/tools/web).

### 6) Snapshoty użycia dostawców (status/health)

Niektóre polecenia statusu wywołują **punkty końcowe użycia dostawców**, aby wyświetlać okna kwot lub kondycję auth.
Są to zwykle wywołania o małej częstotliwości, ale nadal uderzają w API dostawców:

- `openclaw status --usage`
- `openclaw models status --json`

Zobacz [CLI modeli](/pl/cli/models).

### 7) Podsumowanie zabezpieczające Compaction

Zabezpieczenie Compaction może podsumowywać historię sesji przy użyciu **bieżącego modelu**, co
wywołuje API dostawcy, gdy jest uruchamiane.

Zobacz [Zarządzanie sesjami + Compaction](/pl/reference/session-management-compaction).

### 8) Skanowanie / sondowanie modeli

`openclaw models scan` może sondować modele OpenRouter i używa `OPENROUTER_API_KEY`, gdy
sondowanie jest włączone.

Zobacz [CLI modeli](/pl/cli/models).

### 9) Talk (mowa)

Tryb Talk może wywoływać **ElevenLabs**, gdy jest skonfigurowany:

- `ELEVENLABS_API_KEY` albo `talk.providers.elevenlabs.apiKey`

Zobacz [Tryb Talk](/pl/nodes/talk).

### 10) Skills (API zewnętrzne)

Skills mogą przechowywać `apiKey` w `skills.entries.<name>.apiKey`. Jeśli Skill używa tego klucza do zewnętrznych
API, może generować koszty zgodnie z dostawcą tego Skill.

Zobacz [Skills](/pl/tools/skills).

## Powiązane

- [Użycie tokenów i koszty](/pl/reference/token-use)
- [Prompt caching](/pl/reference/prompt-caching)
- [Śledzenie użycia](/pl/concepts/usage-tracking)
