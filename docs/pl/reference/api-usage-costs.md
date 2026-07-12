---
read_when:
    - Chcesz wiedzieć, które funkcje mogą wywoływać płatne interfejsy API
    - Musisz kontrolować klucze, koszty i widoczność użycia
    - Wyjaśniasz raportowanie kosztów przez /status lub /usage
summary: Sprawdź, co może generować koszty, które klucze są używane i jak wyświetlić wykorzystanie
title: Użycie API i koszty
x-i18n:
    generated_at: "2026-07-12T15:35:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b35ad64f83572eb8c01b59ee57368fd7ba20cb83ccac835281859796f782c1dd
    source_path: reference/api-usage-costs.md
    workflow: 16
---

Mapa funkcji OpenClaw, które mogą wywoływać płatne interfejsy API dostawców, miejsc, z których każda z nich odczytuje dane uwierzytelniające, oraz miejsc, w których pojawiają się wynikające z tego koszty.

## Gdzie pojawiają się koszty

**`/status`** (migawka dla sesji)

- Pokazuje bieżący model sesji, wykorzystanie kontekstu oraz tokeny ostatniej odpowiedzi.
- Dodaje **szacowany koszt** ostatniej odpowiedzi, gdy OpenClaw ma metadane użycia i lokalne informacje o cenach aktywnego modelu, w tym jawnie wycenionych dostawców niewymagających klucza API, takich jak modele Bedrock `aws-sdk`.
- Jeśli bieżąca migawka sesji zawiera niewiele danych, `/status` odzyskuje liczniki tokenów i pamięci podręcznej oraz etykietę aktywnego modelu z najnowszego wpisu użycia w transkrypcji. Istniejące niezerowe wartości bieżące mają pierwszeństwo przed danymi transkrypcji; suma z transkrypcji odpowiadająca rozmiarowi monitu może jednak mieć pierwszeństwo, gdy zapisana suma jest niedostępna lub mniejsza.

**`/usage`** (stopka każdej wiadomości)

- `/usage full` dołącza stopkę użycia do każdej odpowiedzi, w tym **szacowany koszt**, gdy skonfigurowano lokalne informacje o cenach i dostępne są metadane użycia.
- `/usage tokens` pokazuje tylko tokeny. Środowiska uruchomieniowe oparte na subskrypcji, OAuth/tokenie i CLI pokazują tylko tokeny, chyba że dostarczają zgodne metadane użycia oraz jawną cenę lokalną.
- `/usage cost` wyświetla lokalne podsumowanie kosztów; `/usage off` wyłącza stopkę.
- Uwaga dotycząca Gemini CLI: zarówno dane wyjściowe `stream-json`, jak i starsze `json` zawierają informacje o użyciu w polu `stats`. OpenClaw normalizuje `stats.cached` do `cacheRead` i w razie potrzeby wylicza tokeny wejściowe jako `stats.input_tokens - stats.cached`.

**Interfejs sterowania → Użycie** (analiza obejmująca wiele sesji)

- Pokazuje łączne liczby tokenów i szacowane koszty wyliczone z transkrypcji dla wybranego zakresu dat, z podziałem według dostawcy, modelu, agenta, kanału i typu tokena.
- Porównuje krótsze okresy kalendarzowe kończące się w dniu końcowym wybranego zakresu. Brakujące daty są liczone jako dni kalendarzowe o zerowym użyciu; nie są pomijane w celu utworzenia gęstszego okresu.
- Bezpośrednio opisuje skalę wykresu dziennego. Znacznik `√` oznacza, że kompresja za pomocą pierwiastka kwadratowego zapewnia widoczność dni o niskim użyciu.
- Te sumy opisują dostępną lokalną historię sesji, a nie fakturę dostawcy ani rejestr rozliczeń z całego okresu użytkowania. Interfejs ostrzega, gdy dla niektórych wpisów brakuje informacji o cenach.

**Okresy użycia w CLI** (limity dostawców, nie koszt każdej wiadomości)

- Polecenia `openclaw status --usage` i `openclaw channels list` pokazują **okresy użycia** dostawców jako `X% left`.
- Obecni dostawcy okresów użycia: Anthropic, ClawRouter, DeepSeek, GitHub Copilot, Gemini CLI, MiniMax, OpenAI (obejmuje uwierzytelnianie ChatGPT/Codex przez OAuth/token), Xiaomi oraz z.ai. Pełna lista dostawców i flag znajduje się w sekcjach [CLI modeli](/pl/cli/models) oraz [CLI kanałów](/pl/cli/channels).
- Surowe pola `usage_percent` / `usagePercent` MiniMax wskazują pozostały limit, dlatego OpenClaw odwraca ich wartości; pola oparte na liczbie mają pierwszeństwo, gdy są dostępne. Jeśli odpowiedź zawiera tablicę `model_remains`, OpenClaw wybiera wpis modelu czatu, w razie potrzeby wylicza etykietę okresu na podstawie znaczników czasu i umieszcza nazwę modelu w etykiecie planu.
- Dane uwierzytelniające do sprawdzania użycia pochodzą ze specyficznych dla dostawcy punktów zaczepienia, jeśli są dostępne. W przeciwnym razie OpenClaw używa pasujących danych uwierzytelniających OAuth lub klucza API z profili uwierzytelniania, środowiska albo konfiguracji.

Szczegółowe przykłady znajdują się w sekcji [Użycie tokenów i koszty](/pl/reference/token-use).

<Note>
Anthropic potwierdził, że ponowne użycie Claude CLI (w tym `claude -p`) jest dozwolonym wzorcem integracji, o ile nie opublikuje nowych zasad. Anthropic nie udostępnia szacunkowej kwoty dla pojedynczej wiadomości, dlatego `/usage full` nie może pokazać kosztu użycia Claude CLI.
</Note>

## Jak wykrywane są klucze

- **Profile uwierzytelniania**: osobne dla każdego agenta, przechowywane w `auth-profiles.json`.
- **Zmienne środowiskowe**: na przykład `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`.
- **Konfiguracja**: `models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`, `plugins.entries.firecrawl.config.webFetch.apiKey`, `agents.defaults.memorySearch.*`, `talk.providers.*.apiKey`.
- **Skills**: `skills.entries.<name>.apiKey`, które mogą eksportować klucz do środowiska procesu Skills.

## Funkcje, które mogą zużywać środki powiązane z kluczami

### Odpowiedzi głównego modelu (czat i narzędzia)

Każda odpowiedź lub każde wywołanie narzędzia działa za pośrednictwem bieżącego dostawcy modelu. Jest to główne źródło użycia i kosztów, w tym hostowanych planów subskrypcyjnych rozliczanych poza lokalnym interfejsem OpenClaw: OpenAI Codex, Alibaba Cloud Model Studio Coding Plan, MiniMax Coding Plan, Z.AI/GLM Coding Plan oraz ścieżki logowania Claude firmy Anthropic z włączoną opcją Extra Usage.

Informacje o konfiguracji cen znajdują się w sekcji [Modele](/pl/providers/models), a informacje o ich wyświetlaniu — w sekcji [Użycie tokenów i koszty](/pl/reference/token-use).

### Analiza multimediów (dźwięk/obraz/wideo)

Przychodzące multimedia mogą zostać podsumowane lub poddane transkrypcji za pośrednictwem API dostawcy przed uruchomieniem potoku odpowiedzi. Obsługa dostawców jest rejestrowana osobno dla każdego pluginu i zmienia się wraz z dodawaniem pluginów; aktualną listę i konfigurację zawiera sekcja [Analiza multimediów](/pl/nodes/media-understanding).

### Generowanie obrazów i wideo

`image_generate` i `video_generate` kierują żądania do dowolnego dostępnego skonfigurowanego dostawcy. Generowanie obrazów może automatycznie wybrać domyślnego dostawcę na podstawie dostępnych danych uwierzytelniających, gdy `agents.defaults.imageGenerationModel` nie jest ustawione; generowanie wideo wymaga jawnego ustawienia `agents.defaults.videoGenerationModel` (na przykład `qwen/wan2.6-t2v`).

Aktualną listę dostawców zawierają sekcje [Generowanie obrazów](/pl/tools/image-generation) i [Generowanie wideo](/pl/tools/video-generation).

### Osadzanie pamięci i wyszukiwanie semantyczne

Semantyczne wyszukiwanie w pamięci korzysta z interfejsów API osadzania, gdy `agents.defaults.memorySearch.provider` wskazuje zdalny adapter (na przykład `openai`, `gemini`, `voyage`, `mistral`, `deepinfra`, `github-copilot`, `amazon-bedrock`). Ustawienie `memorySearch.provider = "lmstudio"` lub `"ollama"` korzysta z lokalnego lub samodzielnie hostowanego serwera i zazwyczaj nie wiąże się z opłatami za usługę hostowaną. Ustawienie `memorySearch.provider = "local"` wykonuje wszystko na urządzeniu bez użycia API. Opcjonalny dostawca `memorySearch.fallback` może obsługiwać awarie lokalnego osadzania.

Zobacz sekcję [Pamięć](/pl/concepts/memory).

### Narzędzie wyszukiwania w internecie

`web_search` może powodować naliczanie opłat zależnie od wybranego dostawcy. Każdy dostawca odczytuje swój klucz najpierw ze zmiennej środowiskowej, a następnie z `plugins.entries.<id>.config.webSearch.apiKey`:

| Dostawca              | Zmienne środowiskowe                                                                                                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brave Search          | `BRAVE_API_KEY`                                                                                                                                                                          |
| DuckDuckGo            | nie wymaga klucza; nieoficjalne, oparte na HTML, bez opłat                                                                                                                               |
| Exa                   | `EXA_API_KEY`                                                                                                                                                                            |
| Firecrawl             | `FIRECRAWL_API_KEY`                                                                                                                                                                      |
| Gemini (Google Search) | `GEMINI_API_KEY`                                                                                                                                                                        |
| Grok (xAI)            | profil OAuth xAI lub `XAI_API_KEY`                                                                                                                                                        |
| Kimi (Moonshot)       | `KIMI_API_KEY` lub `MOONSHOT_API_KEY`                                                                                                                                                     |
| MiniMax Search        | `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` lub `MINIMAX_API_KEY`                                                                                           |
| Ollama Web Search     | nie wymaga klucza w przypadku dostępnego lokalnego hosta z zalogowanym użytkownikiem; bezpośrednie wyszukiwanie przez `https://ollama.com` używa `OLLAMA_API_KEY`; hosty chronione uwierzytelnianiem używają standardowego uwierzytelniania dostawcy Ollama za pomocą tokena bearer |
| Parallel              | `PARALLEL_API_KEY`                                                                                                                                                                       |
| Perplexity Search API | `PERPLEXITY_API_KEY` lub `OPENROUTER_API_KEY`                                                                                                                                             |
| SearXNG               | `SEARXNG_BASE_URL`; nie wymaga klucza/samodzielnie hostowane, bez opłat za usługę hostowaną                                                                                               |
| Tavily                | `TAVILY_API_KEY`                                                                                                                                                                         |

Starsze ścieżki konfiguracji `tools.web.search.*` nadal są wczytywane za pośrednictwem warstwy zgodności, ale nie są już zalecanym interfejsem.

**Bezpłatny kredyt Brave Search**: każdy plan obejmuje odnawiany co miesiąc bezpłatny kredyt w wysokości 5 USD. Plan Search kosztuje 5 USD za 1000 żądań, więc kredyt pokrywa bez opłat 1000 żądań miesięcznie. Ustaw limit użycia w panelu Brave, aby uniknąć nieoczekiwanych opłat.

Zobacz sekcję [Narzędzia internetowe](/pl/tools/web).

### Narzędzie pobierania treści internetowych (Firecrawl)

`web_fetch` może wywoływać Firecrawl z bezkluczowym dostępem startowym; dodaj `FIRECRAWL_API_KEY` (lub `plugins.entries.firecrawl.config.webFetch.apiKey`), aby uzyskać wyższe limity. Jeśli Firecrawl nie jest skonfigurowany, narzędzie przechodzi na bezpośrednie pobieranie oraz dołączony plugin `web-readability` (bez płatnego API). Wyłącz `plugins.entries.web-readability.enabled`, aby pominąć lokalne wyodrębnianie za pomocą Readability.

Zobacz sekcję [Narzędzia internetowe](/pl/tools/web).

### Migawki użycia dostawców (stan/kondycja)

Polecenia `openclaw status --usage` i `openclaw models status --json` wywołują punkty końcowe użycia dostawców, aby pokazać okresy limitów lub stan uwierzytelniania. Liczba wywołań jest niewielka, ale nadal trafiają one do interfejsów API dostawców.

Zobacz sekcję [CLI modeli](/pl/cli/models).

### Podsumowywanie zabezpieczające podczas Compaction

Mechanizm zabezpieczający Compaction może podsumować historię sesji za pomocą bieżącego modelu, co podczas działania powoduje wywołanie interfejsów API dostawców.

Zobacz sekcję [Zarządzanie sesją i Compaction](/pl/reference/session-management-compaction).

### Skanowanie / testowanie modelu

`openclaw models scan` może testować modele OpenRouter i używa `OPENROUTER_API_KEY`, gdy testowanie jest włączone.

Zobacz sekcję [CLI modeli](/pl/cli/models).

### Rozmowa (mowa)

Tryb rozmowy może wywoływać ElevenLabs, gdy jest skonfigurowany: `ELEVENLABS_API_KEY` lub `talk.providers.elevenlabs.apiKey`.

Zobacz sekcję [Tryb rozmowy](/pl/nodes/talk).

### Skills (interfejsy API innych firm)

Skills mogą przechowywać `apiKey` w `skills.entries.<name>.apiKey`. Jeśli Skills używa tego klucza do komunikacji z zewnętrznym API, koszt zależy od dostawcy Skills.

Zobacz sekcję [Skills](/pl/tools/skills).

## Powiązane

- [Użycie tokenów i koszty](/pl/reference/token-use)
- [Buforowanie monitów](/pl/reference/prompt-caching)
- [Śledzenie użycia](/pl/concepts/usage-tracking)
