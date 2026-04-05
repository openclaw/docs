---
read_when:
    - Chcesz używać modeli OpenAI w OpenClaw
    - Chcesz używać uwierzytelniania subskrypcji Codex zamiast kluczy API
summary: Używaj OpenAI przez klucze API lub subskrypcję Codex w OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-05T14:04:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 537119853503d398f9136170ac12ecfdbd9af8aef3c4c011f8ada4c664bdaf6d
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI udostępnia API deweloperskie dla modeli GPT. Codex obsługuje **logowanie ChatGPT** dla dostępu
subskrypcyjnego lub **logowanie kluczem API** dla dostępu rozliczanego według użycia. Chmura Codex wymaga logowania do ChatGPT.
OpenAI jednoznacznie wspiera użycie subskrypcyjnego OAuth w zewnętrznych narzędziach/przepływach pracy, takich jak OpenClaw.

## Domyślny styl interakcji

OpenClaw domyślnie dodaje niewielką nakładkę promptu specyficzną dla OpenAI zarówno dla
uruchomień `openai/*`, jak i `openai-codex/*`. Nakładka sprawia, że asystent pozostaje ciepły,
nastawiony na współpracę, zwięzły i bezpośredni, bez zastępowania bazowego promptu systemowego
OpenClaw.

Klucz konfiguracji:

`plugins.entries.openai.config.personalityOverlay`

Dozwolone wartości:

- `"friendly"`: domyślnie; włącza nakładkę specyficzną dla OpenAI.
- `"off"`: wyłącza nakładkę i używa tylko bazowego promptu OpenClaw.

Zakres:

- Dotyczy modeli `openai/*`.
- Dotyczy modeli `openai-codex/*`.
- Nie wpływa na innych providerów.

To zachowanie jest domyślnie włączone:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personalityOverlay: "friendly",
        },
      },
    },
  },
}
```

### Wyłącz nakładkę promptu OpenAI

Jeśli wolisz niezmodyfikowany bazowy prompt OpenClaw, wyłącz nakładkę:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personalityOverlay: "off",
        },
      },
    },
  },
}
```

Możesz też ustawić to bezpośrednio przez konfigurację CLI:

```bash
openclaw config set plugins.entries.openai.config.personalityOverlay off
```

## Opcja A: klucz API OpenAI (OpenAI Platform)

**Najlepsze dla:** bezpośredniego dostępu do API i rozliczeń według użycia.
Pobierz klucz API z panelu OpenAI.

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
ponieważ bezpośrednie wywołania API OpenAI odrzucają go w ruchu produkcyjnym.

OpenClaw **nie** udostępnia `openai/gpt-5.3-codex-spark` na bezpośredniej ścieżce API OpenAI.
`pi-ai` nadal zawiera wbudowany wiersz dla tego modelu, ale aktywne żądania do API OpenAI
są obecnie odrzucane. W OpenClaw Spark jest traktowany jako model tylko dla Codex.

## Opcja B: subskrypcja OpenAI Code (Codex)

**Najlepsze dla:** używania dostępu subskrypcyjnego ChatGPT/Codex zamiast klucza API.
Chmura Codex wymaga logowania do ChatGPT, natomiast Codex CLI obsługuje logowanie przez ChatGPT lub klucz API.

### Konfiguracja CLI (Codex OAuth)

```bash
# Uruchom Codex OAuth w kreatorze
openclaw onboard --auth-choice openai-codex

# Albo uruchom OAuth bezpośrednio
openclaw models auth login --provider openai-codex
```

### Fragment konfiguracji (subskrypcja Codex)

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

Aktualna dokumentacja Codex od OpenAI wymienia `gpt-5.4` jako bieżący model Codex. OpenClaw
mapuje go na `openai-codex/gpt-5.4` dla użycia z OAuth ChatGPT/Codex.

Jeśli onboarding ponownie użyje istniejącego logowania Codex CLI, te poświadczenia pozostają
zarządzane przez Codex CLI. Po wygaśnięciu OpenClaw najpierw ponownie odczytuje zewnętrzne źródło Codex
i, gdy provider może je odświeżyć, zapisuje odświeżone poświadczenie z powrotem
w magazynie Codex zamiast przejmować je do osobnej kopii tylko dla OpenClaw.

Jeśli Twoje konto Codex ma uprawnienia do Codex Spark, OpenClaw obsługuje również:

- `openai-codex/gpt-5.3-codex-spark`

OpenClaw traktuje Codex Spark jako model tylko dla Codex. Nie udostępnia bezpośredniej
ścieżki klucza API `openai/gpt-5.3-codex-spark`.

OpenClaw zachowuje również `openai-codex/gpt-5.3-codex-spark`, gdy `pi-ai`
go wykryje. Traktuj go jako zależny od uprawnień i eksperymentalny: Codex Spark jest
oddzielny od `/fast` dla GPT-5.4, a dostępność zależy od zalogowanego konta Codex /
ChatGPT.

### Limit okna kontekstu Codex

OpenClaw traktuje metadane modelu Codex i limit kontekstu w runtime jako osobne
wartości.

Dla `openai-codex/gpt-5.4`:

- natywne `contextWindow`: `1050000`
- domyślny limit `contextTokens` w runtime: `272000`

Pozwala to zachować prawdziwość metadanych modelu, a jednocześnie utrzymać mniejsze domyślne okno runtime,
które w praktyce daje lepszą latencję i jakość.

Jeśli chcesz inny efektywny limit, ustaw `models.providers.<provider>.models[].contextTokens`:

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

Używaj `contextWindow` tylko wtedy, gdy deklarujesz lub nadpisujesz natywne metadane
modelu. Używaj `contextTokens`, gdy chcesz ograniczyć budżet kontekstu w runtime.

### Domyślny transport

OpenClaw używa `pi-ai` do strumieniowania modeli. Zarówno dla `openai/*`, jak i
`openai-codex/*`, domyślnym transportem jest `"auto"` (najpierw WebSocket, potem
fallback do SSE).

W trybie `"auto"` OpenClaw ponawia także jedną wczesną, możliwą do ponowienia awarię WebSocket,
zanim przejdzie do SSE. Wymuszony tryb `"websocket"` nadal bezpośrednio pokazuje błędy
transportu zamiast ukrywać je za fallbackiem.

Po błędzie połączenia WebSocket albo błędzie na wczesnym etapie tury w trybie `"auto"` OpenClaw oznacza
ścieżkę WebSocket tej sesji jako zdegradowaną na około 60 sekund i wysyła
kolejne tury przez SSE w czasie cooldown zamiast bez końca przełączać się między
transportami.

Dla natywnych endpointów rodziny OpenAI (`openai/*`, `openai-codex/*` i Azure
OpenAI Responses) OpenClaw dołącza także stabilny stan tożsamości sesji i tury
do żądań, aby ponowienia, ponowne połączenia i fallback do SSE pozostawały zgodne z tą samą
tożsamością rozmowy. Na natywnych ścieżkach rodziny OpenAI obejmuje to stabilne
nagłówki tożsamości żądania sesji/tury oraz pasujące metadane transportu.

OpenClaw normalizuje również liczniki użycia OpenAI między wariantami transportu, zanim
trafią do powierzchni sesji/statusu. Natywny ruch OpenAI/Codex Responses może
raportować użycie jako `input_tokens` / `output_tokens` albo
`prompt_tokens` / `completion_tokens`; OpenClaw traktuje je jako te same liczniki wejścia
i wyjścia dla `/status`, `/usage` i logów sesji. Gdy natywny ruch WebSocket pomija `total_tokens`
(albo raportuje `0`), OpenClaw wraca do znormalizowanej sumy wejścia + wyjścia, aby widoki sesji/statusu nadal były wypełnione.

Możesz ustawić `agents.defaults.models.<provider/model>.params.transport`:

- `"sse"`: wymuś SSE
- `"websocket"`: wymuś WebSocket
- `"auto"`: najpierw spróbuj WebSocket, potem fallback do SSE

Dla `openai/*` (Responses API) OpenClaw domyślnie włącza także rozgrzewanie WebSocket (`openaiWsWarmup: true`) przy użyciu transportu WebSocket.

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

### Rozgrzewanie WebSocket OpenAI

Dokumentacja OpenAI opisuje rozgrzewanie jako opcjonalne. OpenClaw domyślnie włącza je dla
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

### Włącz rozgrzewanie jawnie

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
aby przekazać to pole do natywnych endpointów OpenAI/Codex Responses.

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

OpenClaw przekazuje `params.serviceTier` zarówno do bezpośrednich żądań `openai/*` Responses,
jak i do żądań `openai-codex/*` Codex Responses, gdy te modele wskazują
na natywne endpointy OpenAI/Codex.

Ważne zachowanie:

- bezpośrednie `openai/*` musi wskazywać `api.openai.com`
- `openai-codex/*` musi wskazywać `chatgpt.com/backend-api`
- jeśli kierujesz któregokolwiek providera przez inny base URL lub proxy, OpenClaw pozostawia `service_tier` bez zmian

### Tryb fast OpenAI

OpenClaw udostępnia wspólny przełącznik trybu fast dla sesji `openai/*` i
`openai-codex/*`:

- Chat/UI: `/fast status|on|off`
- Konfiguracja: `agents.defaults.models["<provider>/<model>"].params.fastMode`

Gdy tryb fast jest włączony, OpenClaw mapuje go na priorytetowe przetwarzanie OpenAI:

- bezpośrednie wywołania `openai/*` Responses do `api.openai.com` wysyłają `service_tier = "priority"`
- wywołania `openai-codex/*` Responses do `chatgpt.com/backend-api` również wysyłają `service_tier = "priority"`
- istniejące wartości `service_tier` w payloadzie są zachowywane
- tryb fast nie przepisuje `reasoning` ani `text.verbosity`

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

Nadpisania sesji mają pierwszeństwo przed konfiguracją. Wyczyszczenie nadpisania sesji w Sessions UI
przywraca sesji skonfigurowaną wartość domyślną.

### Natywne trasy OpenAI a trasy zgodne z OpenAI

OpenClaw traktuje bezpośrednie endpointy OpenAI, Codex i Azure OpenAI inaczej
niż ogólne proxy `/v1` zgodne z OpenAI:

- natywne trasy `openai/*`, `openai-codex/*` i Azure OpenAI zachowują
  `reasoning: { effort: "none" }`, gdy jawnie wyłączysz reasoning
- natywne trasy rodziny OpenAI domyślnie ustawiają schematy narzędzi na tryb strict
- ukryte nagłówki atrybucji OpenClaw (`originator`, `version` i
  `User-Agent`) są dołączane tylko do zweryfikowanych natywnych hostów OpenAI
  (`api.openai.com`) i natywnych hostów Codex (`chatgpt.com/backend-api`)
- natywne trasy OpenAI/Codex zachowują kształtowanie żądań specyficzne dla OpenAI, takie jak
  `service_tier`, `store` w Responses, payloady zgodności OpenAI dla reasoning oraz
  wskazówki cache promptów
- trasy w stylu proxy zgodne z OpenAI zachowują luźniejsze zachowanie zgodności i nie
  wymuszają schematów narzędzi strict, kształtowania żądań tylko dla tras natywnych ani ukrytych
  nagłówków atrybucji OpenAI/Codex

Azure OpenAI pozostaje w koszyku tras natywnych pod względem transportu i zachowania zgodności,
ale nie otrzymuje ukrytych nagłówków atrybucji OpenAI/Codex.

Pozwala to zachować obecne zachowanie natywnych OpenAI Responses bez wymuszania starszych
shimów zgodnych z OpenAI na backendach `/v1` innych firm.

### Kompaktowanie po stronie serwera OpenAI Responses

Dla bezpośrednich modeli OpenAI Responses (`openai/*` używających `api: "openai-responses"` z
`baseUrl` ustawionym na `api.openai.com`) OpenClaw automatycznie włącza teraz wskazówki payloadu
dla kompaktowania po stronie serwera OpenAI:

- Wymusza `store: true` (chyba że zgodność modelu ustawia `supportsStore: false`)
- Wstrzykuje `context_management: [{ type: "compaction", compact_threshold: ... }]`

Domyślnie `compact_threshold` to `70%` modelowego `contextWindow` (lub `80000`,
gdy nie jest dostępne).

### Jawnie włącz kompaktowanie po stronie serwera

Użyj tego, gdy chcesz wymusić wstrzykiwanie `context_management` dla zgodnych
modeli Responses (na przykład Azure OpenAI Responses):

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
- Szczegóły uwierzytelniania i reguły ponownego użycia znajdują się w [/concepts/oauth](/pl/concepts/oauth).
