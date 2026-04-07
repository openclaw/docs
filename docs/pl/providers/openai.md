---
read_when:
    - Chcesz używać modeli OpenAI w OpenClaw
    - Chcesz używać uwierzytelniania subskrypcją Codex zamiast kluczy API
summary: Używanie OpenAI przez klucze API lub subskrypcję Codex w OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-07T09:50:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a2ce1ce5f085fe55ec50b8d20359180b9002c9730820cd5b0e011c3bf807b64
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI udostępnia API dla deweloperów dla modeli GPT. Codex obsługuje **logowanie przez ChatGPT** dla dostępu
subskrypcyjnego lub **logowanie kluczem API** dla dostępu rozliczanego według użycia. Chmura Codex wymaga logowania przez ChatGPT.
OpenAI jawnie wspiera użycie subskrypcyjnego OAuth w zewnętrznych narzędziach/przepływach pracy, takich jak OpenClaw.

## Domyślny styl interakcji

OpenClaw może dodać małą nakładkę promptu specyficzną dla OpenAI zarówno dla uruchomień `openai/*`, jak i
`openai-codex/*`. Domyślnie nakładka utrzymuje asystenta jako ciepłego,
współpracującego, zwięzłego, bezpośredniego i nieco bardziej ekspresyjnego emocjonalnie,
nie zastępując bazowego promptu systemowego OpenClaw. Przyjazna nakładka
pozwala też okazjonalnie użyć emoji, gdy pasuje to naturalnie, przy zachowaniu ogólnie zwięzłej odpowiedzi.

Klucz konfiguracji:

`plugins.entries.openai.config.personality`

Dozwolone wartości:

- `"friendly"`: domyślne; włącza nakładkę specyficzną dla OpenAI.
- `"on"`: alias dla `"friendly"`.
- `"off"`: wyłącza nakładkę i używa tylko bazowego promptu OpenClaw.

Zakres:

- Dotyczy modeli `openai/*`.
- Dotyczy modeli `openai-codex/*`.
- Nie wpływa na innych dostawców.

To zachowanie jest domyślnie włączone. Zachowaj jawnie `"friendly"`, jeśli chcesz,
aby przetrwało przyszłe lokalne zmiany konfiguracji:

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

Jeśli chcesz niezmodyfikowanego bazowego promptu OpenClaw, ustaw nakładkę na `"off"`:

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

Możesz też ustawić to bezpośrednio przez konfigurację CLI:

```bash
openclaw config set plugins.entries.openai.config.personality off
```

OpenClaw normalizuje to ustawienie bez rozróżniania wielkości liter w czasie działania, więc wartości takie jak
`"Off"` również wyłączą przyjazną nakładkę.

## Opcja A: klucz API OpenAI (OpenAI Platform)

**Najlepsze do:** bezpośredniego dostępu do API i rozliczania według użycia.
Pobierz klucz API z panelu OpenAI.

Podsumowanie ścieżki:

- `openai/gpt-5.4` = bezpośrednia ścieżka API OpenAI Platform
- Wymaga `OPENAI_API_KEY` (lub równoważnej konfiguracji dostawcy OpenAI)
- W OpenClaw logowanie ChatGPT/Codex jest routowane przez `openai-codex/*`, a nie `openai/*`

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

Aktualna dokumentacja modeli API OpenAI wymienia `gpt-5.4` i `gpt-5.4-pro` dla bezpośredniego
użycia API OpenAI. OpenClaw przekazuje oba przez ścieżkę `openai/*` Responses.
OpenClaw celowo ukrywa przestarzały wiersz `openai/gpt-5.3-codex-spark`,
ponieważ bezpośrednie wywołania API OpenAI odrzucają go w rzeczywistym ruchu.

OpenClaw **nie** udostępnia `openai/gpt-5.3-codex-spark` na bezpośredniej ścieżce API OpenAI.
`pi-ai` nadal dostarcza wbudowany wiersz dla tego modelu, ale rzeczywiste żądania API OpenAI są obecnie odrzucane. Spark jest traktowany w OpenClaw jako wyłącznie Codex.

## Generowanie obrazów

Dołączona wtyczka `openai` rejestruje także generowanie obrazów przez wspólne
narzędzie `image_generate`.

- Domyślny model obrazu: `openai/gpt-image-1`
- Generowanie: do 4 obrazów na żądanie
- Tryb edycji: włączony, do 5 obrazów referencyjnych
- Obsługuje `size`
- Aktualne zastrzeżenie specyficzne dla OpenAI: OpenClaw obecnie nie przekazuje nadpisań `aspectRatio` ani
  `resolution` do OpenAI Images API

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

Zobacz [Generowanie obrazów](/pl/tools/image-generation), aby poznać wspólne parametry
narzędzia, wybór dostawcy i zachowanie failover.

## Generowanie wideo

Dołączona wtyczka `openai` rejestruje także generowanie wideo przez wspólne
narzędzie `video_generate`.

- Domyślny model wideo: `openai/sora-2`
- Tryby: text-to-video, image-to-video oraz przepływy referencji/edycji pojedynczego wideo
- Bieżące limity: 1 obraz lub 1 referencyjne wejście wideo
- Aktualne zastrzeżenie specyficzne dla OpenAI: OpenClaw obecnie przekazuje tylko nadpisania `size`
  dla natywnego generowania wideo OpenAI. Nieobsługiwane opcjonalne nadpisania,
  takie jak `aspectRatio`, `resolution`, `audio` i `watermark`, są ignorowane
  i zwracane jako ostrzeżenie narzędzia.

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

Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać wspólne parametry
narzędzia, wybór dostawcy i zachowanie failover.

## Opcja B: subskrypcja OpenAI Code (Codex)

**Najlepsze do:** używania dostępu subskrypcyjnego ChatGPT/Codex zamiast klucza API.
Chmura Codex wymaga logowania przez ChatGPT, podczas gdy CLI Codex obsługuje logowanie przez ChatGPT lub klucz API.

Podsumowanie ścieżki:

- `openai-codex/gpt-5.4` = ścieżka OAuth ChatGPT/Codex
- Używa logowania ChatGPT/Codex, a nie bezpośredniego klucza API OpenAI Platform
- Limity po stronie dostawcy dla `openai-codex/*` mogą różnić się od doświadczenia ChatGPT w web/app

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

Aktualna dokumentacja Codex OpenAI wymienia `gpt-5.4` jako bieżący model Codex. OpenClaw
mapuje go na `openai-codex/gpt-5.4` do użycia z OAuth ChatGPT/Codex.

Ta ścieżka jest celowo oddzielona od `openai/gpt-5.4`. Jeśli chcesz
bezpośredniej ścieżki API OpenAI Platform, użyj `openai/*` z kluczem API. Jeśli chcesz
logowania ChatGPT/Codex, użyj `openai-codex/*`.

Jeśli onboarding ponownie wykorzystuje istniejące logowanie Codex CLI, te poświadczenia pozostają
zarządzane przez Codex CLI. Po wygaśnięciu OpenClaw najpierw ponownie odczytuje zewnętrzne źródło Codex
i, gdy dostawca może je odświeżyć, zapisuje odświeżone poświadczenie z powrotem
do pamięci Codex zamiast przejmować je we własnej kopii tylko dla OpenClaw.

Jeśli Twoje konto Codex ma uprawnienia do Codex Spark, OpenClaw obsługuje również:

- `openai-codex/gpt-5.3-codex-spark`

OpenClaw traktuje Codex Spark jako wyłącznie Codex. Nie udostępnia bezpośredniej
ścieżki klucza API `openai/gpt-5.3-codex-spark`.

OpenClaw zachowuje również `openai-codex/gpt-5.3-codex-spark`, gdy `pi-ai`
go wykryje. Traktuj go jako zależny od uprawnień i eksperymentalny: Codex Spark jest
oddzielny od GPT-5.4 `/fast`, a dostępność zależy od zalogowanego konta Codex /
ChatGPT.

### Limit okna kontekstu Codex

OpenClaw traktuje metadane modelu Codex i limit kontekstu w runtime jako oddzielne
wartości.

Dla `openai-codex/gpt-5.4`:

- natywne `contextWindow`: `1050000`
- domyślny limit `contextTokens` w runtime: `272000`

Pozwala to zachować prawdziwe metadane modelu, przy jednoczesnym utrzymaniu mniejszego domyślnego
okna runtime, które w praktyce ma lepsze właściwości opóźnienia i jakości.

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
Używaj `contextTokens`, gdy chcesz ograniczyć budżet kontekstu w runtime.

### Domyślny transport

OpenClaw używa `pi-ai` do strumieniowania modeli. Dla `openai/*` i
`openai-codex/*` domyślnym transportem jest `"auto"` (najpierw WebSocket, potem fallback do SSE).

W trybie `"auto"` OpenClaw wykonuje również jedną ponowną próbę po wczesnej, możliwej do ponowienia awarii WebSocket,
zanim przełączy się na SSE. Wymuszony tryb `"websocket"` nadal bezpośrednio pokazuje błędy transportu
zamiast ukrywać je za fallbackiem.

Po błędzie WebSocket przy połączeniu lub na początku tury w trybie `"auto"` OpenClaw oznacza
ścieżkę WebSocket tej sesji jako zdegradowaną na około 60 sekund i wysyła
kolejne tury przez SSE podczas tego cooldownu zamiast przełączać się chaotycznie między
transportami.

Dla natywnych punktów końcowych rodziny OpenAI (`openai/*`, `openai-codex/*` i Azure
OpenAI Responses) OpenClaw dołącza też stabilny stan tożsamości sesji i tury
do żądań, aby ponowne próby, ponowne połączenia i fallback do SSE pozostawały wyrównane do tej samej
tożsamości rozmowy. Na natywnych ścieżkach rodziny OpenAI obejmuje to stabilne nagłówki tożsamości żądania sesji/tury oraz pasujące metadane transportu.

OpenClaw normalizuje również liczniki użycia OpenAI między wariantami transportu, zanim
trafią one do powierzchni sesji/statusu. Natywny ruch OpenAI/Codex Responses może
raportować użycie jako `input_tokens` / `output_tokens` albo
`prompt_tokens` / `completion_tokens`; OpenClaw traktuje je jako te same liczniki wejścia
i wyjścia dla `/status`, `/usage` i logów sesji. Gdy natywny ruch WebSocket pomija `total_tokens`
(lub raportuje `0`), OpenClaw przełącza się na znormalizowaną sumę wejścia + wyjścia,
aby widoki sesji/statusu pozostały wypełnione.

Możesz ustawić `agents.defaults.models.<provider/model>.params.transport`:

- `"sse"`: wymuś SSE
- `"websocket"`: wymuś WebSocket
- `"auto"`: najpierw spróbuj WebSocket, potem fallback do SSE

Dla `openai/*` (Responses API) OpenClaw domyślnie włącza również rozgrzewanie WebSocket
(`openaiWsWarmup: true`), gdy używany jest transport WebSocket.

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

### Rozgrzewanie OpenAI WebSocket

Dokumentacja OpenAI opisuje rozgrzewanie jako opcjonalne. OpenClaw domyślnie je włącza dla
`openai/*`, aby zmniejszyć opóźnienie pierwszej tury przy użyciu transportu WebSocket.

### Wyłącz rozgrzewanie

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

### Jawnie włącz rozgrzewanie

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

### OpenAI i priorytetowe przetwarzanie Codex

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
- jeśli kierujesz któregokolwiek dostawcę przez inny base URL lub proxy, OpenClaw pozostawia `service_tier` bez zmian

### Tryb szybki OpenAI

OpenClaw udostępnia wspólny przełącznik trybu szybkiego dla sesji `openai/*` i
`openai-codex/*`:

- Czat/UI: `/fast status|on|off`
- Konfiguracja: `agents.defaults.models["<provider>/<model>"].params.fastMode`

Gdy tryb szybki jest włączony, OpenClaw mapuje go na priorytetowe przetwarzanie OpenAI:

- bezpośrednie wywołania Responses `openai/*` do `api.openai.com` wysyłają `service_tier = "priority"`
- wywołania Responses `openai-codex/*` do `chatgpt.com/backend-api` również wysyłają `service_tier = "priority"`
- istniejące wartości `service_tier` w ładunku są zachowywane
- tryb szybki nie przepisuje `reasoning` ani `text.verbosity`

W szczególności dla GPT 5.4 najczęstsza konfiguracja to:

- wyślij `/fast on` w sesji używającej `openai/gpt-5.4` lub `openai-codex/gpt-5.4`
- albo ustaw `agents.defaults.models["openai/gpt-5.4"].params.fastMode = true`
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
przywraca sesję do skonfigurowanej wartości domyślnej.

### Natywne OpenAI a ścieżki zgodne z OpenAI

OpenClaw traktuje bezpośrednie punkty końcowe OpenAI, Codex i Azure OpenAI inaczej
niż generyczne proxy `/v1` zgodne z OpenAI:

- natywne ścieżki `openai/*`, `openai-codex/*` i Azure OpenAI zachowują
  `reasoning: { effort: "none" }`, gdy jawnie wyłączysz reasoning
- natywne ścieżki rodziny OpenAI domyślnie ustawiają schematy narzędzi w trybie strict
- ukryte nagłówki atrybucji OpenClaw (`originator`, `version` i
  `User-Agent`) są dołączane tylko na zweryfikowanych natywnych hostach OpenAI
  (`api.openai.com`) i natywnych hostach Codex (`chatgpt.com/backend-api`)
- natywne ścieżki OpenAI/Codex zachowują kształtowanie żądań specyficzne dla OpenAI, takie jak
  `service_tier`, Responses `store`, ładunki zgodności reasoning OpenAI oraz
  podpowiedzi cache promptów
- ścieżki zgodne z OpenAI w stylu proxy zachowują luźniejsze zachowanie zgodności i nie
  wymuszają ścisłych schematów narzędzi, kształtowania żądań tylko dla natywnych tras ani ukrytych
  nagłówków atrybucji OpenAI/Codex

Azure OpenAI pozostaje w koszyku routingu natywnego pod względem transportu i zachowania zgodności,
ale nie otrzymuje ukrytych nagłówków atrybucji OpenAI/Codex.

Pozwala to zachować obecne natywne zachowanie OpenAI Responses bez narzucania starszych
shimów zgodnych z OpenAI na backendy `/v1` innych firm.

### Kompaktowanie po stronie serwera OpenAI Responses

Dla bezpośrednich modeli OpenAI Responses (`openai/*` używających `api: "openai-responses"` z
`baseUrl` na `api.openai.com`) OpenClaw teraz automatycznie włącza wskazówki ładunku
kompaktowania po stronie serwera OpenAI:

- Wymusza `store: true` (chyba że zgodność modelu ustawia `supportsStore: false`)
- Wstrzykuje `context_management: [{ type: "compaction", compact_threshold: ... }]`

Domyślnie `compact_threshold` wynosi `70%` modelowego `contextWindow` (lub `80000`,
gdy nie jest dostępne).

### Jawnie włącz kompaktowanie po stronie serwera

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

### Włącz z niestandardowym progiem

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

### Wyłącz kompaktowanie po stronie serwera

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

- Referencje modeli zawsze używają `provider/model` (zobacz [/concepts/models](/pl/concepts/models)).
- Szczegóły uwierzytelniania + reguły ponownego użycia znajdują się w [/concepts/oauth](/pl/concepts/oauth).
