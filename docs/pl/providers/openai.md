---
read_when:
    - Chcesz używać modeli OpenAI w OpenClaw
    - Chcesz używać uwierzytelniania subskrypcją Codex zamiast kluczy API
    - Potrzebujesz bardziej rygorystycznego zachowania wykonywania agenta GPT-5
summary: Używaj OpenAI za pomocą kluczy API lub subskrypcji Codex w OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-12T00:18:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7aa06fba9ac901e663685a6b26443a2f6aeb6ec3589d939522dc87cbb43497b4
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI udostępnia interfejsy API dla deweloperów do modeli GPT. Codex obsługuje **logowanie przez ChatGPT** dla dostępu w ramach subskrypcji
lub logowanie za pomocą **klucza API** dla dostępu rozliczanego według użycia. Chmura Codex wymaga logowania przez ChatGPT.
OpenAI jawnie wspiera użycie OAuth subskrypcji w zewnętrznych narzędziach/przepływach pracy, takich jak OpenClaw.

## Domyślny styl interakcji

OpenClaw może dodać niewielką nakładkę promptu specyficzną dla OpenAI zarówno dla uruchomień `openai/*`, jak i
`openai-codex/*`. Domyślnie nakładka utrzymuje asystenta jako ciepłego,
współpracującego, zwięzłego, bezpośredniego i trochę bardziej emocjonalnie ekspresyjnego,
bez zastępowania bazowego promptu systemowego OpenClaw. Przyjazna nakładka
dopuszcza też okazjonalne emoji, gdy pasuje to naturalnie, przy zachowaniu ogólnej zwięzłości
wypowiedzi.

Klucz konfiguracji:

`plugins.entries.openai.config.personality`

Dozwolone wartości:

- `"friendly"`: domyślnie; włącza nakładkę specyficzną dla OpenAI.
- `"on"`: alias dla `"friendly"`.
- `"off"`: wyłącza nakładkę i używa tylko bazowego promptu OpenClaw.

Zakres:

- Dotyczy modeli `openai/*`.
- Dotyczy modeli `openai-codex/*`.
- Nie wpływa na innych dostawców.

To zachowanie jest domyślnie włączone. Zachowaj jawnie `"friendly"`, jeśli chcesz,
aby przetrwało to przyszłe lokalne zmiany konfiguracji:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personality: "friendly",
        },
      },
    },
  },
}
```

### Wyłącz nakładkę promptu OpenAI

Jeśli chcesz niezmodyfikowany bazowy prompt OpenClaw, ustaw nakładkę na `"off"`:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personality: "off",
        },
      },
    },
  },
}
```

Możesz też ustawić to bezpośrednio za pomocą CLI konfiguracji:

```bash
openclaw config set plugins.entries.openai.config.personality off
```

OpenClaw normalizuje to ustawienie w czasie działania bez rozróżniania wielkości liter, więc wartości takie jak
`"Off"` również wyłączają przyjazną nakładkę.

## Opcja A: klucz API OpenAI (OpenAI Platform)

**Najlepsze dla:** bezpośredniego dostępu do API i rozliczania według użycia.
Pobierz swój klucz API z panelu OpenAI.

Podsumowanie ścieżek:

- `openai/gpt-5.4` = bezpośrednia ścieżka API OpenAI Platform
- Wymaga `OPENAI_API_KEY` (lub równoważnej konfiguracji dostawcy OpenAI)
- W OpenClaw logowanie ChatGPT/Codex jest kierowane przez `openai-codex/*`, a nie `openai/*`

### Konfiguracja CLI

```bash
openclaw onboard --auth-choice openai-api-key
# lub nieinteraktywnie
openclaw onboard --openai-api-key "$OPENAI_API_KEY"
```

### Fragment konfiguracji

```json5
{
  env: { OPENAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

Bieżąca dokumentacja modeli API OpenAI wymienia `gpt-5.4` i `gpt-5.4-pro` dla bezpośredniego
użycia API OpenAI. OpenClaw przekazuje oba przez ścieżkę `openai/*` Responses.
OpenClaw celowo ukrywa nieaktualny wiersz `openai/gpt-5.3-codex-spark`,
ponieważ bezpośrednie wywołania API OpenAI odrzucają go w rzeczywistym ruchu.

OpenClaw **nie** udostępnia `openai/gpt-5.3-codex-spark` na bezpośredniej ścieżce OpenAI
API. `pi-ai` nadal zawiera wbudowany wiersz dla tego modelu, ale rzeczywiste żądania do API OpenAI
są obecnie odrzucane. W OpenClaw Spark jest traktowany jako dostępny tylko w Codex.

## Generowanie obrazów

Dołączona w pakiecie wtyczka `openai` rejestruje też generowanie obrazów przez współdzielone
narzędzie `image_generate`.

- Domyślny model obrazów: `openai/gpt-image-1`
- Generowanie: do 4 obrazów na żądanie
- Tryb edycji: włączony, do 5 obrazów referencyjnych
- Obsługuje `size`
- Aktualne zastrzeżenie specyficzne dla OpenAI: OpenClaw obecnie nie przekazuje nadpisań `aspectRatio` ani
  `resolution` do API OpenAI Images

Aby używać OpenAI jako domyślnego dostawcy obrazów:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
      },
    },
  },
}
```

Zobacz [Generowanie obrazów](/pl/tools/image-generation), aby poznać współdzielone parametry
narzędzia, wybór dostawcy i zachowanie failover.

## Generowanie wideo

Dołączona w pakiecie wtyczka `openai` rejestruje też generowanie wideo przez współdzielone
narzędzie `video_generate`.

- Domyślny model wideo: `openai/sora-2`
- Tryby: tekst-na-wideo, obraz-na-wideo oraz przepływy referencji/edycji pojedynczego wideo
- Obecne limity: 1 obraz lub 1 wejście referencyjne wideo
- Aktualne zastrzeżenie specyficzne dla OpenAI: OpenClaw obecnie przekazuje tylko nadpisania `size`
  dla natywnego generowania wideo OpenAI. Nieobsługiwane opcjonalne nadpisania,
  takie jak `aspectRatio`, `resolution`, `audio` i `watermark`, są ignorowane
  i zgłaszane z powrotem jako ostrzeżenie narzędzia.

Aby używać OpenAI jako domyślnego dostawcy wideo:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openai/sora-2",
      },
    },
  },
}
```

Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać współdzielone parametry
narzędzia, wybór dostawcy i zachowanie failover.

## Opcja B: subskrypcja OpenAI Code (Codex)

**Najlepsze dla:** używania dostępu w ramach subskrypcji ChatGPT/Codex zamiast klucza API.
Chmura Codex wymaga logowania przez ChatGPT, natomiast CLI Codex obsługuje logowanie przez ChatGPT lub klucz API.

Podsumowanie ścieżek:

- `openai-codex/gpt-5.4` = ścieżka OAuth ChatGPT/Codex
- Używa logowania ChatGPT/Codex, a nie bezpośredniego klucza API OpenAI Platform
- Limity po stronie dostawcy dla `openai-codex/*` mogą różnić się od doświadczenia w wersji webowej/aplikacji ChatGPT

### Konfiguracja CLI (Codex OAuth)

```bash
# Uruchom OAuth Codex w kreatorze
openclaw onboard --auth-choice openai-codex

# Lub uruchom OAuth bezpośrednio
openclaw models auth login --provider openai-codex
```

### Fragment konfiguracji (subskrypcja Codex)

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

Bieżąca dokumentacja Codex OpenAI wymienia `gpt-5.4` jako aktualny model Codex. OpenClaw
mapuje to na `openai-codex/gpt-5.4` dla użycia OAuth ChatGPT/Codex.

Ta ścieżka jest celowo oddzielona od `openai/gpt-5.4`. Jeśli chcesz
bezpośredniej ścieżki API OpenAI Platform, użyj `openai/*` z kluczem API. Jeśli chcesz
logowania ChatGPT/Codex, użyj `openai-codex/*`.

Jeśli onboarding wykorzysta ponownie istniejące logowanie CLI Codex, te poświadczenia pozostaną
zarządzane przez CLI Codex. Po wygaśnięciu OpenClaw najpierw ponownie odczytuje zewnętrzne źródło Codex
i, gdy dostawca może je odświeżyć, zapisuje odświeżone poświadczenie
z powrotem do magazynu Codex zamiast przejmować je do osobnej kopii używanej wyłącznie przez OpenClaw.

Jeśli Twoje konto Codex ma uprawnienia do Codex Spark, OpenClaw obsługuje również:

- `openai-codex/gpt-5.3-codex-spark`

OpenClaw traktuje Codex Spark jako dostępny tylko w Codex. Nie udostępnia bezpośredniej
ścieżki z kluczem API `openai/gpt-5.3-codex-spark`.

OpenClaw zachowuje też `openai-codex/gpt-5.3-codex-spark`, gdy `pi-ai`
go wykryje. Traktuj to jako zależne od uprawnień i eksperymentalne: Codex Spark jest
oddzielny od GPT-5.4 `/fast`, a dostępność zależy od zalogowanego konta Codex /
ChatGPT.

### Limit okna kontekstu Codex

OpenClaw traktuje metadane modelu Codex i limit kontekstu w czasie działania jako oddzielne
wartości.

Dla `openai-codex/gpt-5.4`:

- natywne `contextWindow`: `1050000`
- domyślny limit `contextTokens` w czasie działania: `272000`

Pozwala to zachować zgodność metadanych modelu z prawdą, a jednocześnie utrzymać mniejsze domyślne okno działania,
które w praktyce zapewnia lepszą latencję i jakość.

Jeśli chcesz innego efektywnego limitu, ustaw `models.providers.<provider>.models[].contextTokens`:

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [
          {
            id: "gpt-5.4",
            contextTokens: 160000,
          },
        ],
      },
    },
  },
}
```

Używaj `contextWindow` tylko wtedy, gdy deklarujesz lub nadpisujesz natywne metadane modelu.
Używaj `contextTokens`, gdy chcesz ograniczyć budżet kontekstu w czasie działania.

### Domyślny transport

OpenClaw używa `pi-ai` do strumieniowania modeli. Dla obu `openai/*` i
`openai-codex/*` domyślnym transportem jest `"auto"` (najpierw WebSocket, potem fallback
do SSE).

W trybie `"auto"` OpenClaw wykonuje też jedną ponowną próbę po wczesnej, możliwej do ponowienia awarii WebSocket,
zanim przełączy się na SSE. Wymuszony tryb `"websocket"` nadal pokazuje błędy transportu bezpośrednio,
zamiast ukrywać je za fallbackiem.

Po błędzie połączenia lub błędzie WebSocket na początku tury w trybie `"auto"` OpenClaw oznacza
ścieżkę WebSocket tej sesji jako pogorszoną na około 60 sekund i wysyła
kolejne tury przez SSE w czasie schłodzenia, zamiast bez końca przełączać się między
transportami.

Dla natywnych punktów końcowych rodziny OpenAI (`openai/*`, `openai-codex/*` i Azure
OpenAI Responses) OpenClaw dołącza również stabilny stan tożsamości sesji i tury
do żądań, aby ponowienia, ponowne połączenia i fallback do SSE pozostawały przypisane do tej samej
tożsamości konwersacji. W natywnych ścieżkach rodziny OpenAI obejmuje to stabilne nagłówki tożsamości żądania sesji/tury oraz pasujące metadane transportu.

OpenClaw normalizuje też liczniki użycia OpenAI między wariantami transportu, zanim
trafią one do powierzchni sesji/statusu. Natywny ruch OpenAI/Codex Responses może
raportować użycie jako `input_tokens` / `output_tokens` albo
`prompt_tokens` / `completion_tokens`; OpenClaw traktuje je jako te same liczniki wejścia
i wyjścia dla `/status`, `/usage` i logów sesji. Gdy natywny ruch WebSocket pomija `total_tokens`
(lub raportuje `0`), OpenClaw wraca do znormalizowanej sumy wejścia i wyjścia, aby wyświetlanie sesji/statusu pozostało wypełnione.

Możesz ustawić `agents.defaults.models.<provider/model>.params.transport`:

- `"sse"`: wymuś SSE
- `"websocket"`: wymuś WebSocket
- `"auto"`: najpierw spróbuj WebSocket, potem fallback do SSE

Dla `openai/*` (Responses API) OpenClaw domyślnie włącza też rozgrzewkę WebSocket (`openaiWsWarmup: true`), gdy używany jest transport WebSocket.

Powiązana dokumentacja OpenAI:

- [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
- [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

```json5
{
  agents: {
    defaults: {
      model: { primary: "openai-codex/gpt-5.4" },
      models: {
        "openai-codex/gpt-5.4": {
          params: {
            transport: "auto",
          },
        },
      },
    },
  },
}
```

### Rozgrzewka OpenAI WebSocket

Dokumentacja OpenAI opisuje rozgrzewkę jako opcjonalną. OpenClaw domyślnie ją włącza dla
`openai/*`, aby skrócić opóźnienie pierwszej tury przy użyciu transportu WebSocket.

### Wyłącz rozgrzewkę

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: false,
          },
        },
      },
    },
  },
}
```

### Włącz rozgrzewkę jawnie

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: true,
          },
        },
      },
    },
  },
}
```

### Priorytetowe przetwarzanie OpenAI i Codex

API OpenAI udostępnia priorytetowe przetwarzanie przez `service_tier=priority`. W
OpenClaw ustaw `agents.defaults.models["<provider>/<model>"].params.serviceTier`,
aby przekazać to pole na natywnych punktach końcowych OpenAI/Codex Responses.

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Obsługiwane wartości to `auto`, `default`, `flex` i `priority`.

OpenClaw przekazuje `params.serviceTier` zarówno do bezpośrednich żądań Responses `openai/*`,
jak i do żądań Codex Responses `openai-codex/*`, gdy te modele wskazują
na natywne punkty końcowe OpenAI/Codex.

Ważne zachowanie:

- bezpośrednie `openai/*` musi wskazywać na `api.openai.com`
- `openai-codex/*` musi wskazywać na `chatgpt.com/backend-api`
- jeśli kierujesz któregokolwiek dostawcę przez inny podstawowy URL lub proxy, OpenClaw pozostawia `service_tier` bez zmian

### Tryb fast OpenAI

OpenClaw udostępnia współdzielony przełącznik trybu fast zarówno dla sesji `openai/*`, jak i
`openai-codex/*`:

- Czat/UI: `/fast status|on|off`
- Konfiguracja: `agents.defaults.models["<provider>/<model>"].params.fastMode`

Gdy tryb fast jest włączony, OpenClaw mapuje go na priorytetowe przetwarzanie OpenAI:

- bezpośrednie wywołania Responses `openai/*` do `api.openai.com` wysyłają `service_tier = "priority"`
- wywołania Responses `openai-codex/*` do `chatgpt.com/backend-api` również wysyłają `service_tier = "priority"`
- istniejące wartości `service_tier` w payloadzie są zachowywane
- tryb fast nie nadpisuje `reasoning` ani `text.verbosity`

Dla GPT 5.4 w szczególności najczęstsza konfiguracja to:

- wysłanie `/fast on` w sesji używającej `openai/gpt-5.4` lub `openai-codex/gpt-5.4`
- albo ustawienie `agents.defaults.models["openai/gpt-5.4"].params.fastMode = true`
- jeśli używasz też OAuth Codex, ustaw również `agents.defaults.models["openai-codex/gpt-5.4"].params.fastMode = true`

Przykład:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
      },
    },
  },
}
```

Nadpisania sesji mają pierwszeństwo przed konfiguracją. Wyczyszczenie nadpisania sesji w interfejsie Sessions UI
przywraca w sesji domyślną wartość skonfigurowaną.

### Natywne OpenAI a ścieżki zgodne z OpenAI

OpenClaw traktuje bezpośrednie punkty końcowe OpenAI, Codex i Azure OpenAI inaczej
niż ogólne proxy `/v1` zgodne z OpenAI:

- natywne ścieżki `openai/*`, `openai-codex/*` i Azure OpenAI zachowują
  `reasoning: { effort: "none" }` bez zmian, gdy jawnie wyłączysz rozumowanie
- natywne ścieżki z rodziny OpenAI domyślnie ustawiają schematy narzędzi w trybie ścisłym
- ukryte nagłówki atrybucji OpenClaw (`originator`, `version` i
  `User-Agent`) są dołączane tylko do zweryfikowanych natywnych hostów OpenAI
  (`api.openai.com`) i natywnych hostów Codex (`chatgpt.com/backend-api`)
- natywne ścieżki OpenAI/Codex zachowują kształtowanie żądań specyficzne dla OpenAI, takie jak
  `service_tier`, Responses `store`, payloady zgodności z rozumowaniem OpenAI oraz
  wskazówki pamięci podręcznej promptów
- ścieżki w stylu proxy zgodne z OpenAI zachowują luźniejsze zachowanie zgodności i nie
  wymuszają ścisłych schematów narzędzi, kształtowania żądań tylko dla ścieżek natywnych ani ukrytych
  nagłówków atrybucji OpenAI/Codex

Azure OpenAI pozostaje w koszyku routingu natywnego pod względem zachowania transportu i zgodności,
ale nie otrzymuje ukrytych nagłówków atrybucji OpenAI/Codex.

Pozwala to zachować obecne natywne zachowanie OpenAI Responses bez wymuszania starszych
warstw zgodności z OpenAI na backendach `/v1` innych firm.

### Ścisły agentowy tryb GPT

Dla uruchomień rodziny GPT-5 w `openai/*` i `openai-codex/*` OpenClaw może używać
bardziej rygorystycznego osadzonego kontraktu wykonania Pi:

```json5
{
  agents: {
    defaults: {
      embeddedPi: {
        executionContract: "strict-agentic",
      },
    },
  },
}
```

Przy `strict-agentic` OpenClaw nie traktuje już tury asystenta zawierającej tylko planu jako
udanego postępu, gdy dostępne jest konkretne działanie narzędzia. Powtarza
turę z ukierunkowaniem na działanie natychmiast, automatycznie włącza
ustrukturyzowane narzędzie `update_plan` dla istotnej pracy i pokazuje jawny stan blokady,
jeśli model nadal planuje bez działania.

Ten tryb jest ograniczony do uruchomień rodziny GPT-5 w OpenAI i OpenAI Codex. Inni dostawcy
i starsze rodziny modeli zachowują domyślne zachowanie osadzonego Pi, chyba że jawnie włączysz
dla nich inne ustawienia czasu działania.

### Kompaktowanie po stronie serwera OpenAI Responses

Dla bezpośrednich modeli OpenAI Responses (`openai/*` używających `api: "openai-responses"` z
`baseUrl` ustawionym na `api.openai.com`) OpenClaw teraz automatycznie włącza wskazówki payloadu
kompaktowania po stronie serwera OpenAI:

- Wymusza `store: true` (chyba że zgodność modelu ustawia `supportsStore: false`)
- Wstrzykuje `context_management: [{ type: "compaction", compact_threshold: ... }]`

Domyślnie `compact_threshold` wynosi `70%` wartości `contextWindow` modelu (lub `80000`,
gdy jest niedostępna).

### Jawne włączenie kompaktowania po stronie serwera

Użyj tego, gdy chcesz wymusić wstrzykiwanie `context_management` w zgodnych
modelach Responses (na przykład Azure OpenAI Responses):

```json5
{
  agents: {
    defaults: {
      models: {
        "azure-openai-responses/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
          },
        },
      },
    },
  },
}
```

### Włączenie z niestandardowym progiem

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
            responsesCompactThreshold: 120000,
          },
        },
      },
    },
  },
}
```

### Wyłączenie kompaktowania po stronie serwera

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: false,
          },
        },
      },
    },
  },
}
```

`responsesServerCompaction` kontroluje tylko wstrzykiwanie `context_management`.
Bezpośrednie modele OpenAI Responses nadal wymuszają `store: true`, chyba że zgodność ustawia
`supportsStore: false`.

## Uwagi

- Odwołania do modeli zawsze używają `provider/model` (zobacz [/concepts/models](/pl/concepts/models)).
- Szczegóły uwierzytelniania i reguły ponownego użycia znajdują się w [/concepts/oauth](/pl/concepts/oauth).
