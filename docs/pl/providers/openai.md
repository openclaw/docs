---
read_when:
    - Chcesz używać modeli OpenAI w OpenClaw
    - Chcesz używać uwierzytelniania subskrypcji Codex zamiast kluczy API
    - Potrzebujesz bardziej restrykcyjnego zachowania wykonywania agenta GPT-5
summary: Używaj OpenAI przez klucze API lub subskrypcję Codex w OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-21T10:00:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 172beb28b099e3d71998458408c9a6b32b03790d2b016351f724bc3f0d9d3245
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI udostępnia API deweloperskie dla modeli GPT. OpenClaw obsługuje dwie ścieżki uwierzytelniania:

- **Klucz API** — bezpośredni dostęp do OpenAI Platform z rozliczaniem zależnym od użycia (modele `openai/*`)
- **Subskrypcja Codex** — logowanie ChatGPT/Codex z dostępem subskrypcyjnym (modele `openai-codex/*`)

OpenAI jawnie wspiera użycie OAuth subskrypcji w zewnętrznych narzędziach i przepływach pracy, takich jak OpenClaw.

## Pierwsze kroki

Wybierz preferowaną metodę uwierzytelniania i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="Klucz API (OpenAI Platform)">
    **Najlepsze do:** bezpośredniego dostępu do API i rozliczania zależnego od użycia.

    <Steps>
      <Step title="Pobierz klucz API">
        Utwórz lub skopiuj klucz API z [panelu OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Uruchom onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Albo przekaż klucz bezpośrednio:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Sprawdź, czy model jest dostępny">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Podsumowanie ścieżek

    | Model ref | Ścieżka | Uwierzytelnianie |
    |-----------|---------|------------------|
    | `openai/gpt-5.4` | Bezpośrednie API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | Bezpośrednie API OpenAI Platform | `OPENAI_API_KEY` |

    <Note>
    Logowanie ChatGPT/Codex jest kierowane przez `openai-codex/*`, a nie `openai/*`.
    </Note>

    ### Przykład konfiguracji

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **nie** udostępnia `openai/gpt-5.3-codex-spark` na bezpośredniej ścieżce API. Żądania live do OpenAI API odrzucają ten model. Spark jest dostępny tylko dla Codex.
    </Warning>

  </Tab>

  <Tab title="Subskrypcja Codex">
    **Najlepsze do:** używania subskrypcji ChatGPT/Codex zamiast osobnego klucza API. Codex cloud wymaga logowania ChatGPT.

    <Steps>
      <Step title="Uruchom OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Albo uruchom OAuth bezpośrednio:

        ```bash
        openclaw models auth login --provider openai-codex
        ```
      </Step>
      <Step title="Ustaw model domyślny">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="Sprawdź, czy model jest dostępny">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Podsumowanie ścieżek

    | Model ref | Ścieżka | Uwierzytelnianie |
    |-----------|---------|------------------|
    | `openai-codex/gpt-5.4` | OAuth ChatGPT/Codex | Logowanie Codex |
    | `openai-codex/gpt-5.3-codex-spark` | OAuth ChatGPT/Codex | Logowanie Codex (zależne od uprawnień) |

    <Note>
    Ta ścieżka jest celowo oddzielona od `openai/gpt-5.4`. Używaj `openai/*` z kluczem API do bezpośredniego dostępu do Platform, a `openai-codex/*` do dostępu przez subskrypcję Codex.
    </Note>

    ### Przykład konfiguracji

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Tip>
    Jeśli onboarding używa ponownie istniejącego logowania Codex CLI, tymi poświadczeniami nadal zarządza Codex CLI. Po wygaśnięciu OpenClaw najpierw ponownie odczytuje zewnętrzne źródło Codex, a następnie zapisuje odświeżone poświadczenie z powrotem do magazynu Codex.
    </Tip>

    ### Limit okna kontekstu

    OpenClaw traktuje metadane modelu i limit kontekstu runtime jako oddzielne wartości.

    Dla `openai-codex/gpt-5.4`:

    - Natywne `contextWindow`: `1050000`
    - Domyślny limit runtime `contextTokens`: `272000`

    Mniejszy domyślny limit w praktyce daje lepsze opóźnienia i jakość. Nadpisz go przez `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.4", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Używaj `contextWindow` do deklarowania natywnych metadanych modelu. Używaj `contextTokens` do ograniczania budżetu kontekstu runtime.
    </Note>

  </Tab>
</Tabs>

## Generowanie obrazów

Bundlowany plugin `openai` rejestruje generowanie obrazów przez narzędzie `image_generate`.

| Capability                | Value                              |
| ------------------------- | ---------------------------------- |
| Model domyślny            | `openai/gpt-image-1`               |
| Maks. liczba obrazów na żądanie | 4                            |
| Tryb edycji               | Włączony (do 5 obrazów referencyjnych) |
| Nadpisania rozmiaru       | Obsługiwane                        |
| Aspect ratio / resolution | Nie są przekazywane do OpenAI Images API |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-1" },
    },
  },
}
```

<Note>
Zobacz [Generowanie obrazów](/pl/tools/image-generation), aby poznać współdzielone parametry narzędzia, wybór dostawcy i zachowanie failover.
</Note>

## Generowanie wideo

Bundlowany plugin `openai` rejestruje generowanie wideo przez narzędzie `video_generate`.

| Capability       | Value                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Model domyślny   | `openai/sora-2`                                                                   |
| Tryby            | Tekst na wideo, obraz na wideo, edycja pojedynczego wideo                         |
| Wejścia referencyjne | 1 obraz lub 1 wideo                                                           |
| Nadpisania rozmiaru | Obsługiwane                                                                     |
| Inne nadpisania  | `aspectRatio`, `resolution`, `audio`, `watermark` są ignorowane z ostrzeżeniem narzędzia |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać współdzielone parametry narzędzia, wybór dostawcy i zachowanie failover.
</Note>

## Wkład promptu GPT-5

OpenClaw dodaje specyficzny dla OpenAI wkład promptu GPT-5 dla uruchomień rodziny GPT-5 `openai/*` i `openai-codex/*`. Znajduje się on w bundlowanym pluginie OpenAI, ma zastosowanie do identyfikatorów modeli takich jak `gpt-5`, `gpt-5.2`, `gpt-5.4` i `gpt-5.4-mini`, i nie ma zastosowania do starszych modeli GPT-4.x.

Wkład GPT-5 dodaje tagowany kontrakt zachowania dla trwałości persony, bezpieczeństwa wykonywania, dyscypliny narzędzi, kształtu wyjścia, kontroli ukończenia i weryfikacji. Zachowanie odpowiedzi specyficzne dla kanału i zachowanie cichych wiadomości pozostają we współdzielonym promptie systemowym OpenClaw i zasadach dostarczania wychodzącego. Wskazówki GPT-5 są zawsze włączone dla pasujących modeli. Warstwa przyjaznego stylu interakcji jest oddzielna i konfigurowalna.

| Value                  | Effect                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (domyślnie) | Włącz przyjazną warstwę stylu interakcji  |
| `"on"`                 | Alias dla `"friendly"`                      |
| `"off"`                | Wyłącz tylko przyjazną warstwę stylu        |

<Tabs>
  <Tab title="Konfiguracja">
    ```json5
    {
      plugins: {
        entries: {
          openai: { config: { personality: "friendly" } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set plugins.entries.openai.config.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Wartości w runtime nie uwzględniają wielkości liter, więc zarówno `"Off"`, jak i `"off"` wyłączają przyjazną warstwę stylu.
</Tip>

## Głos i mowa

<AccordionGroup>
  <Accordion title="Synteza mowy (TTS)">
    Bundlowany plugin `openai` rejestruje syntezę mowy dla powierzchni `messages.tts`.

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Głos | `messages.tts.providers.openai.voice` | `coral` |
    | Prędkość | `messages.tts.providers.openai.speed` | (nieustawione) |
    | Instructions | `messages.tts.providers.openai.instructions` | (nieustawione, tylko `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` dla notatek głosowych, `mp3` dla plików |
    | Klucz API | `messages.tts.providers.openai.apiKey` | Zapasowo `OPENAI_API_KEY` |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Dostępne modele: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Dostępne głosy: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Ustaw `OPENAI_TTS_BASE_URL`, aby nadpisać bazowy URL TTS bez wpływu na endpoint API czatu.
    </Note>

  </Accordion>

  <Accordion title="Realtime transcription">
    Bundlowany plugin `openai` rejestruje realtime transcription dla pluginu Voice Call.

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Czas trwania ciszy | `...openai.silenceDurationMs` | `800` |
    | Próg VAD | `...openai.vadThreshold` | `0.5` |
    | Klucz API | `...openai.apiKey` | Zapasowo `OPENAI_API_KEY` |

    <Note>
    Używa połączenia WebSocket do `wss://api.openai.com/v1/realtime` z dźwiękiem G.711 u-law.
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    Bundlowany plugin `openai` rejestruje realtime voice dla pluginu Voice Call.

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Głos | `...openai.voice` | `alloy` |
    | Temperatura | `...openai.temperature` | `0.8` |
    | Próg VAD | `...openai.vadThreshold` | `0.5` |
    | Czas trwania ciszy | `...openai.silenceDurationMs` | `500` |
    | Klucz API | `...openai.apiKey` | Zapasowo `OPENAI_API_KEY` |

    <Note>
    Obsługuje Azure OpenAI przez klucze konfiguracji `azureEndpoint` i `azureDeployment`. Obsługuje dwukierunkowe wywoływanie narzędzi. Używa formatu dźwięku G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Zaawansowana konfiguracja

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw używa trybu WebSocket-first z zapasowym SSE (`"auto"`) zarówno dla `openai/*`, jak i `openai-codex/*`.

    W trybie `"auto"` OpenClaw:
    - Ponawia jedną wczesną awarię WebSocket przed przejściem na SSE
    - Po awarii oznacza WebSocket jako zdegradowany na około 60 sekund i używa SSE podczas okresu schłodzenia
    - Dołącza stabilne nagłówki tożsamości sesji i tury dla ponowień i ponownych połączeń
    - Normalizuje liczniki użycia (`input_tokens` / `prompt_tokens`) między wariantami transportu

    | Value | Behavior |
    |-------|----------|
    | `"auto"` (domyślnie) | Najpierw WebSocket, zapasowo SSE |
    | `"sse"` | Wymuś tylko SSE |
    | `"websocket"` | Wymuś tylko WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai-codex/gpt-5.4": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Powiązana dokumentacja OpenAI:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Rozgrzewanie WebSocket">
    OpenClaw domyślnie włącza rozgrzewanie WebSocket dla `openai/*`, aby zmniejszyć opóźnienie pierwszej tury.

    ```json5
    // Wyłącz rozgrzewanie
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Tryb szybki">
    OpenClaw udostępnia współdzielony przełącznik trybu szybkiego zarówno dla `openai/*`, jak i `openai-codex/*`:

    - **Czat/UI:** `/fast status|on|off`
    - **Konfiguracja:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Po włączeniu OpenClaw mapuje tryb szybki na przetwarzanie priorytetowe OpenAI (`service_tier = "priority"`). Istniejące wartości `service_tier` są zachowywane, a tryb szybki nie przepisuje `reasoning` ani `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
            "openai-codex/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Nadpisania sesji mają pierwszeństwo przed konfiguracją. Wyczyszczenie nadpisania sesji w interfejsie Sessions przywraca sesję do skonfigurowanej wartości domyślnej.
    </Note>

  </Accordion>

  <Accordion title="Przetwarzanie priorytetowe (service_tier)">
    API OpenAI udostępnia przetwarzanie priorytetowe przez `service_tier`. Ustaw je per model w OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
            "openai-codex/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Obsługiwane wartości: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` jest przekazywane tylko do natywnych endpointów OpenAI (`api.openai.com`) i natywnych endpointów Codex (`chatgpt.com/backend-api`). Jeśli kierujesz któregoś dostawcę przez proxy, OpenClaw pozostawia `service_tier` bez zmian.
    </Warning>

  </Accordion>

  <Accordion title="Compaction po stronie serwera (Responses API)">
    Dla bezpośrednich modeli OpenAI Responses (`openai/*` na `api.openai.com`) OpenClaw automatycznie włącza Compaction po stronie serwera:

    - Wymusza `store: true` (chyba że zgodność modelu ustawia `supportsStore: false`)
    - Wstrzykuje `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Domyślny `compact_threshold`: 70% `contextWindow` (lub `80000`, gdy jest niedostępne)

    <Tabs>
      <Tab title="Włącz jawnie">
        Przydatne dla zgodnych endpointów, takich jak Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.4": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Własny próg">
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
      </Tab>
      <Tab title="Wyłącz">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` kontroluje tylko wstrzykiwanie `context_management`. Bezpośrednie modele OpenAI Responses nadal wymuszają `store: true`, chyba że zgodność ustawia `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Ścisły tryb agentowy GPT">
    Dla uruchomień rodziny GPT-5 na `openai/*` i `openai-codex/*` OpenClaw może używać bardziej restrykcyjnego osadzonego kontraktu wykonania:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Przy `strict-agentic` OpenClaw:
    - Nie traktuje już tury wyłącznie z planem jako udanego postępu, gdy dostępne jest działanie narzędzia
    - Ponawia turę z ukierunkowaniem act-now
    - Automatycznie włącza `update_plan` dla istotnej pracy
    - Pokazuje jawny stan zablokowania, jeśli model nadal planuje bez działania

    <Note>
    Ograniczone tylko do uruchomień rodziny GPT-5 OpenAI i Codex. Inni dostawcy i starsze rodziny modeli zachowują domyślne zachowanie.
    </Note>

  </Accordion>

  <Accordion title="Natywne ścieżki vs ścieżki kompatybilne z OpenAI">
    OpenClaw traktuje bezpośrednie endpointy OpenAI, Codex i Azure OpenAI inaczej niż ogólne proxy `/v1` kompatybilne z OpenAI:

    **Natywne ścieżki** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - Zachowują `reasoning: { effort: "none" }` tylko dla modeli obsługujących OpenAI `none` effort
    - Pomijają wyłączone reasoning dla modeli lub proxy, które odrzucają `reasoning.effort: "none"`
    - Domyślnie ustawiają ścisły tryb schematów narzędzi
    - Dołączają ukryte nagłówki atrybucji tylko na zweryfikowanych natywnych hostach
    - Zachowują kształtowanie żądań dostępne tylko w OpenAI (`service_tier`, `store`, zgodność reasoning, wskazówki prompt-cache)

    **Ścieżki proxy/kompatybilne:**
    - Używają luźniejszego zachowania zgodności
    - Nie wymuszają ścisłych schematów narzędzi ani nagłówków tylko dla natywnych ścieżek

    Azure OpenAI używa natywnego transportu i zachowania zgodności, ale nie otrzymuje ukrytych nagłówków atrybucji.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modeli" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, model-ref i zachowania failover.
  </Card>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Współdzielone parametry narzędzia obrazów i wybór dostawcy.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Współdzielone parametry narzędzia wideo i wybór dostawcy.
  </Card>
  <Card title="OAuth i uwierzytelnianie" href="/pl/gateway/authentication" icon="key">
    Szczegóły uwierzytelniania i zasady ponownego użycia poświadczeń.
  </Card>
</CardGroup>
