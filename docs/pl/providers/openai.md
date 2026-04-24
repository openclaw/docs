---
read_when:
    - Chcesz używać modeli OpenAI w OpenClaw
    - Chcesz używać auth subskrypcyjnego Codex zamiast kluczy API
    - Potrzebujesz bardziej rygorystycznego zachowania wykonywania agenta GPT-5
summary: Używaj OpenAI przez klucze API lub subskrypcję Codex w OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-24T09:28:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3d533338fa15d866bb69584706162ce099bb4a1edc9851183fb5442730ebdd9b
    source_path: providers/openai.md
    workflow: 15
---

OpenAI udostępnia interfejsy API deweloperskie dla modeli GPT. OpenClaw obsługuje trzy ścieżki z rodziny OpenAI. Prefiks modelu wybiera ścieżkę:

- **Klucz API** — bezpośredni dostęp do OpenAI Platform z rozliczaniem usage-based (`openai/*` modeli)
- **Subskrypcja Codex przez PI** — logowanie ChatGPT/Codex z dostępem subskrypcyjnym (`openai-codex/*` modeli)
- **Harness Codex app-server** — natywne wykonanie Codex app-server (`openai/*` modeli plus `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI jawnie wspiera użycie subskrypcyjnego OAuth w zewnętrznych narzędziach i workflow, takich jak OpenClaw.

<Note>
GPT-5.5 jest obecnie dostępny w OpenClaw przez ścieżki subskrypcyjne/OAuth:
`openai-codex/gpt-5.5` z runnerem PI albo `openai/gpt-5.5` z
harness Codex app-server. Bezpośredni dostęp z kluczem API do `openai/gpt-5.5`
będzie obsługiwany, gdy OpenAI włączy GPT-5.5 w publicznym API; do tego czasu używaj
modelu dostępnego przez API, takiego jak `openai/gpt-5.4`, dla konfiguracji `OPENAI_API_KEY`.
</Note>

<Note>
Włączenie Pluginu OpenAI albo wybranie modelu `openai-codex/*` nie
włącza dołączonego Pluginu Codex app-server. OpenClaw włącza ten Plugin tylko
wtedy, gdy jawnie wybierzesz natywny harness Codex przez
`embeddedHarness.runtime: "codex"` albo użyjesz starszego model ref `codex/*`.
</Note>

## Zakres funkcji OpenClaw

| OpenAI capability         | OpenClaw surface                                           | Status                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | dostawca modeli `openai/<model>`                           | Tak                                                    |
| Modele subskrypcyjne Codex | `openai-codex/<model>` z OAuth `openai-codex`            | Tak                                                    |
| Harness Codex app-server  | `openai/<model>` z `embeddedHarness.runtime: codex`        | Tak                                                    |
| Server-side web search    | natywne narzędzie OpenAI Responses                         | Tak, gdy web search jest włączone i nie przypięto dostawcy |
| Obrazy                    | `image_generate`                                           | Tak                                                    |
| Wideo                     | `video_generate`                                           | Tak                                                    |
| Text-to-speech            | `messages.tts.provider: "openai"` / `tts`                  | Tak                                                    |
| Batch speech-to-text      | `tools.media.audio` / rozumienie multimediów               | Tak                                                    |
| Streaming speech-to-text  | Voice Call `streaming.provider: "openai"`                  | Tak                                                    |
| Realtime voice            | Voice Call `realtime.provider: "openai"` / Control UI Talk | Tak                                                    |
| Embeddingi                | dostawca embeddingów pamięci                               | Tak                                                    |

## Pierwsze kroki

Wybierz preferowaną metodę auth i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="Klucz API (OpenAI Platform)">
    **Najlepsze dla:** bezpośredniego dostępu API i rozliczania usage-based.

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
      <Step title="Zweryfikuj, że model jest dostępny">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Podsumowanie ścieżek

    | Model ref | Route | Auth |
    |-----------|-------|------|
    | `openai/gpt-5.4` | Bezpośrednie OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | Bezpośrednie OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | Przyszła bezpośrednia ścieżka API po włączeniu GPT-5.5 w API przez OpenAI | `OPENAI_API_KEY` |

    <Note>
    `openai/*` to bezpośrednia ścieżka OpenAI z kluczem API, chyba że jawnie wymusisz
    harness Codex app-server. Sam GPT-5.5 jest obecnie dostępny tylko przez subskrypcję/OAuth;
    użyj `openai-codex/*` dla Codex OAuth przez domyślny runner PI.
    </Note>

    ### Przykład konfiguracji

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **nie** udostępnia `openai/gpt-5.3-codex-spark`. Żywe żądania OpenAI API odrzucają ten model, a bieżący katalog Codex też go nie udostępnia.
    </Warning>

  </Tab>

  <Tab title="Subskrypcja Codex">
    **Najlepsze dla:** używania subskrypcji ChatGPT/Codex zamiast osobnego klucza API. Codex cloud wymaga logowania ChatGPT.

    <Steps>
      <Step title="Uruchom Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Albo uruchom OAuth bezpośrednio:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        W konfiguracjach headless albo nieprzyjaznych callbackom dodaj `--device-code`, aby logować się przez przepływ device-code ChatGPT zamiast lokalnego callbacku przeglądarki:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Ustaw model domyślny">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Zweryfikuj, że model jest dostępny">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Podsumowanie ścieżek

    | Model ref | Route | Auth |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | ChatGPT/Codex OAuth przez PI | logowanie Codex |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | harness Codex app-server | auth Codex app-server |

    <Note>
    Nadal używaj identyfikatora dostawcy `openai-codex` dla poleceń auth/profili. Prefiks modelu
    `openai-codex/*` jest też jawną ścieżką PI dla Codex OAuth.
    Nie wybiera ani nie włącza automatycznie dołączonego harness Codex app-server.
    </Note>

    ### Przykład konfiguracji

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Onboarding nie importuje już materiałów OAuth z `~/.codex`. Zaloguj się przez OAuth w przeglądarce (domyślnie) albo przepływ device-code powyżej — OpenClaw zarządza wynikowymi poświadczeniami we własnym magazynie auth agenta.
    </Note>

    ### Wskaźnik statusu

    Czatowe `/status` pokazuje, który osadzony harness jest aktywny dla bieżącej
    sesji. Domyślny harness PI pojawia się jako `Runner: pi (embedded)` i nie
    dodaje osobnej plakietki. Gdy wybrany jest dołączony harness Codex app-server,
    `/status` dopisuje identyfikator harnessu nie-PI obok `Fast`, na przykład
    `Fast · codex`. Istniejące sesje zachowują zapisany identyfikator harnessu, więc użyj
    `/new` albo `/reset` po zmianie `embeddedHarness`, jeśli chcesz, aby `/status`
    odzwierciedlał nowy wybór PI/Codex.

    ### Limit okna kontekstu

    OpenClaw traktuje metadane modelu i runtime context cap jako oddzielne wartości.

    Dla `openai-codex/gpt-5.5` przez Codex OAuth:

    - Natywne `contextWindow`: `1000000`
    - Domyślny limit runtime `contextTokens`: `272000`

    Mniejszy domyślny limit daje w praktyce lepsze opóźnienia i jakość. Nadpisz go przez `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Używaj `contextWindow`, aby deklarować natywne metadane modelu. Używaj `contextTokens`, aby ograniczać budżet kontekstu runtime.
    </Note>

  </Tab>
</Tabs>

## Generowanie obrazów

Dołączony Plugin `openai` rejestruje generowanie obrazów przez narzędzie `image_generate`.
Obsługuje zarówno generowanie obrazów OpenAI z kluczem API, jak i generowanie obrazów przez Codex OAuth
przez ten sam model ref `openai/gpt-image-2`.

| Capability                | Klucz API OpenAI                   | Codex OAuth                           |
| ------------------------- | ---------------------------------- | ------------------------------------- |
| Model ref                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                  |
| Auth                      | `OPENAI_API_KEY`                   | logowanie OpenAI Codex OAuth          |
| Transport                 | OpenAI Images API                  | backend Codex Responses               |
| Maks. liczba obrazów na żądanie | 4                            | 4                                     |
| Tryb edycji               | Włączony (do 5 obrazów referencyjnych) | Włączony (do 5 obrazów referencyjnych) |
| Nadpisania rozmiaru       | Obsługiwane, w tym rozmiary 2K/4K  | Obsługiwane, w tym rozmiary 2K/4K     |
| Aspect ratio / resolution | Nieprzekazywane do OpenAI Images API | Mapowane do obsługiwanego rozmiaru, gdy jest to bezpieczne |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Zobacz [Generowanie obrazów](/pl/tools/image-generation), aby poznać współdzielone parametry narzędzia, wybór dostawcy i zachowanie failoveru.
</Note>

`gpt-image-2` to domyślna wartość zarówno dla generowania obrazów tekst→obraz OpenAI, jak i edycji obrazów. `gpt-image-1` nadal można używać jako jawnego nadpisania modelu, ale nowe workflow obrazów OpenAI powinny używać `openai/gpt-image-2`.

Dla instalacji Codex OAuth zachowaj ten sam ref `openai/gpt-image-2`. Gdy skonfigurowany
jest profil OAuth `openai-codex`, OpenClaw rozwiązuje ten zapisany token dostępu OAuth
i wysyła żądania obrazów przez backend Codex Responses. Nie próbuje najpierw `OPENAI_API_KEY` ani nie wraca po cichu do klucza API dla tego żądania. Skonfiguruj jawnie `models.providers.openai` z kluczem API,
niestandardowym `baseUrl` lub punktem końcowym Azure, gdy chcesz używać bezpośredniej ścieżki OpenAI Images API.
Jeśli ten niestandardowy punkt końcowy obrazów znajduje się w zaufanej sieci LAN/prywatnym adresie, ustaw też
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw nadal blokuje
prywatne/wewnętrzne zgodne z OpenAI punkty końcowe obrazów, chyba że obecna jest ta jawna zgoda.

Generowanie:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Edycja:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Generowanie wideo

Dołączony Plugin `openai` rejestruje generowanie wideo przez narzędzie `video_generate`.

| Capability       | Value                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Default model    | `openai/sora-2`                                                                   |
| Modes            | Tekst→wideo, obraz→wideo, edycja pojedynczego wideo                               |
| Reference inputs | 1 obraz albo 1 wideo                                                              |
| Size overrides   | Obsługiwane                                                                       |
| Other overrides  | `aspectRatio`, `resolution`, `audio`, `watermark` są ignorowane z ostrzeżeniem narzędzia |

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
Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać współdzielone parametry narzędzia, wybór dostawcy i zachowanie failoveru.
</Note>

## Wkład promptu GPT-5

OpenClaw dodaje współdzielony wkład promptu GPT-5 dla przebiegów rodziny GPT-5 u różnych dostawców. Jest stosowany według identyfikatora modelu, więc `openai-codex/gpt-5.5`, `openai/gpt-5.4`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` i inne zgodne referencje GPT-5 otrzymują tę samą nakładkę. Starsze modele GPT-4.x jej nie otrzymują.

Dołączony natywny harness Codex używa tego samego zachowania GPT-5 i nakładki heartbeat przez instrukcje deweloperskie Codex app-server, więc sesje `openai/gpt-5.x` wymuszone przez `embeddedHarness.runtime: "codex"` zachowują te same wskazówki dotyczące doprowadzania spraw do końca i proaktywnego heartbeat, mimo że Codex zarządza resztą promptu harnessu.

Wkład GPT-5 dodaje oznaczony kontrakt zachowania dla trwałości persony, bezpieczeństwa wykonywania, dyscypliny narzędzi, kształtu wyników, sprawdzania ukończenia i weryfikacji. Specyficzne dla kanału zachowanie odpowiedzi i cichych wiadomości pozostaje we współdzielonym prompcie systemowym OpenClaw i polityce dostarczania outbound. Wskazówki GPT-5 są zawsze włączone dla pasujących modeli. Warstwa przyjaznego stylu interakcji jest oddzielna i konfigurowalna.

| Value                  | Effect                                          |
| ---------------------- | ----------------------------------------------- |
| `"friendly"` (domyślnie) | Włącz przyjazną warstwę stylu interakcji       |
| `"on"`                 | Alias dla `"friendly"`                          |
| `"off"`                | Wyłącz tylko przyjazną warstwę stylu            |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Wartości są niewrażliwe na wielkość liter w czasie działania, więc zarówno `"Off"`, jak i `"off"` wyłączają przyjazną warstwę stylu.
</Tip>

<Note>
Starsze `plugins.entries.openai.config.personality` jest nadal odczytywane jako fallback zgodności, gdy współdzielone ustawienie `agents.defaults.promptOverlays.gpt5.personality` nie jest ustawione.
</Note>

## Głos i mowa

<AccordionGroup>
  <Accordion title="Synteza mowy (TTS)">
    Dołączony Plugin `openai` rejestruje syntezę mowy dla powierzchni `messages.tts`.

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voice | `messages.tts.providers.openai.voice` | `coral` |
    | Speed | `messages.tts.providers.openai.speed` | (nieustawione) |
    | Instructions | `messages.tts.providers.openai.instructions` | (nieustawione, tylko `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` dla notatek głosowych, `mp3` dla plików |
    | Klucz API | `messages.tts.providers.openai.apiKey` | Wraca do `OPENAI_API_KEY` |
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
    Ustaw `OPENAI_TTS_BASE_URL`, aby nadpisać bazowy URL TTS bez wpływu na punkt końcowy chat API.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Dołączony Plugin `openai` rejestruje wsadowy speech-to-text przez
    powierzchnię transkrypcji rozumienia multimediów OpenClaw.

    - Domyślny model: `gpt-4o-transcribe`
    - Punkt końcowy: OpenAI REST `/v1/audio/transcriptions`
    - Ścieżka wejściowa: przesyłanie pliku audio multipart
    - Obsługiwane przez OpenClaw wszędzie tam, gdzie transkrypcja przychodzącego audio używa
      `tools.media.audio`, w tym segmentów kanałów głosowych Discord i
      załączników audio kanałów

    Aby wymusić OpenAI dla transkrypcji przychodzącego audio:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Wskazówki językowe i prompt są przekazywane dalej do OpenAI, gdy zostaną podane przez
    współdzieloną konfigurację audio media lub żądanie transkrypcji per wywołanie.

  </Accordion>

  <Accordion title="Transkrypcja w czasie rzeczywistym">
    Dołączony Plugin `openai` rejestruje transkrypcję w czasie rzeczywistym dla Pluginu Voice Call.

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Language | `...openai.language` | (nieustawione) |
    | Prompt | `...openai.prompt` | (nieustawione) |
    | Czas ciszy | `...openai.silenceDurationMs` | `800` |
    | Próg VAD | `...openai.vadThreshold` | `0.5` |
    | Klucz API | `...openai.apiKey` | Wraca do `OPENAI_API_KEY` |

    <Note>
    Używa połączenia WebSocket do `wss://api.openai.com/v1/realtime` z audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Ten dostawca strumieniowania służy ścieżce transkrypcji w czasie rzeczywistym Voice Call; Discord voice obecnie nagrywa krótkie segmenty i zamiast tego używa wsadowej ścieżki transkrypcji `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Głos w czasie rzeczywistym">
    Dołączony Plugin `openai` rejestruje głos w czasie rzeczywistym dla Pluginu Voice Call.

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voice | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | Próg VAD | `...openai.vadThreshold` | `0.5` |
    | Czas ciszy | `...openai.silenceDurationMs` | `500` |
    | Klucz API | `...openai.apiKey` | Wraca do `OPENAI_API_KEY` |

    <Note>
    Obsługuje Azure OpenAI przez klucze konfiguracji `azureEndpoint` i `azureDeployment`. Obsługuje dwukierunkowe wywoływanie narzędzi. Używa formatu audio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Punkty końcowe Azure OpenAI

Dołączony dostawca `openai` może kierować generowanie obrazów do zasobu Azure OpenAI
przez nadpisanie base URL. Na ścieżce generowania obrazów OpenClaw
wykrywa hosty Azure w `models.providers.openai.baseUrl` i automatycznie przełącza się na
kształt żądań Azure.

<Note>
Głos w czasie rzeczywistym używa osobnej ścieżki konfiguracji
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
i nie zależy od `models.providers.openai.baseUrl`. Zobacz sekcję **Głos
w czasie rzeczywistym** w akordeonie [Głos i mowa](#voice-and-speech), aby poznać ustawienia Azure dla tej funkcji.
</Note>

Używaj Azure OpenAI, gdy:

- Masz już subskrypcję, limit lub umowę enterprise Azure OpenAI
- Potrzebujesz regionalnej rezydencji danych lub mechanizmów zgodności zapewnianych przez Azure
- Chcesz utrzymać ruch wewnątrz istniejącej dzierżawy Azure

### Konfiguracja

Dla generowania obrazów Azure przez dołączonego dostawcę `openai` skieruj
`models.providers.openai.baseUrl` do swojego zasobu Azure i ustaw `apiKey` na
klucz Azure OpenAI (nie klucz OpenAI Platform):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw rozpoznaje te sufiksy hostów Azure dla ścieżki generowania obrazów Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Dla żądań generowania obrazów na rozpoznanym hoście Azure OpenClaw:

- Wysyła nagłówek `api-key` zamiast `Authorization: Bearer`
- Używa ścieżek ograniczonych do wdrożenia (`/openai/deployments/{deployment}/...`)
- Dodaje `?api-version=...` do każdego żądania

Inne base URL-e (publiczny OpenAI, proxy zgodne z OpenAI) zachowują standardowy
kształt żądań obrazów OpenAI.

<Note>
Routing Azure dla ścieżki generowania obrazów dostawcy `openai` wymaga
OpenClaw 2026.4.22 lub nowszego. Wcześniejsze wersje traktują każde niestandardowe
`openai.baseUrl` jak publiczny punkt końcowy OpenAI i będą zawodzić przy wdrożeniach
obrazów Azure.
</Note>

### Wersja API

Ustaw `AZURE_OPENAI_API_VERSION`, aby przypiąć konkretną wersję preview albo GA Azure
dla ścieżki generowania obrazów Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Domyślna wartość to `2024-12-01-preview`, gdy zmienna nie jest ustawiona.

### Nazwy modeli są nazwami wdrożeń

Azure OpenAI wiąże modele z wdrożeniami. Dla żądań generowania obrazów Azure
kierowanych przez dołączonego dostawcę `openai` pole `model` w OpenClaw
musi być **nazwą wdrożenia Azure** skonfigurowaną w portalu Azure, a nie
publicznym identyfikatorem modelu OpenAI.

Jeśli utworzysz wdrożenie o nazwie `gpt-image-2-prod`, które obsługuje `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Ta sama reguła nazw wdrożeń dotyczy wywołań generowania obrazów kierowanych przez
dołączonego dostawcę `openai`.

### Dostępność regionalna

Generowanie obrazów Azure jest obecnie dostępne tylko w części regionów
(na przykład `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Przed utworzeniem wdrożenia sprawdź bieżącą listę regionów Microsoft i potwierdź, że konkretny model jest oferowany w twoim regionie.

### Różnice parametrów

Azure OpenAI i publiczny OpenAI nie zawsze akceptują te same parametry obrazów.
Azure może odrzucać opcje dozwolone przez publiczny OpenAI (na przykład niektóre
wartości `background` w `gpt-image-2`) albo udostępniać je tylko dla określonych
wersji modeli. Te różnice pochodzą z Azure i bazowego modelu, a nie z
OpenClaw. Jeśli żądanie Azure kończy się błędem walidacji, sprawdź
zestaw parametrów obsługiwanych przez konkretne wdrożenie i wersję API w
portalu Azure.

<Note>
Azure OpenAI używa natywnego transportu i zachowania zgodności, ale nie otrzymuje
ukrytych nagłówków atrybucji OpenClaw — zobacz akordeon **Native vs OpenAI-compatible
routes** w sekcji [Konfiguracja zaawansowana](#advanced-configuration).

W przypadku ruchu chat lub Responses na Azure (poza generowaniem obrazów) użyj
przepływu onboardingu albo dedykowanej konfiguracji dostawcy Azure — samo `openai.baseUrl`
nie wybiera kształtu API/auth Azure. Istnieje osobny
dostawca `azure-openai-responses/*`; zobacz
akordeon Server-side compaction poniżej.
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw używa WebSocket-first z fallbackiem SSE (`"auto"`) zarówno dla `openai/*`, jak i `openai-codex/*`.

    W trybie `"auto"` OpenClaw:
    - Ponawia jedną wczesną awarię WebSocket przed przejściem do SSE
    - Po awarii oznacza WebSocket jako zdegradowany na około 60 sekund i używa SSE podczas cooldownu
    - Dołącza stabilne nagłówki tożsamości sesji i tury dla ponowień i ponownych połączeń
    - Normalizuje liczniki użycia (`input_tokens` / `prompt_tokens`) między wariantami transportu

    | Value | Behavior |
    |-------|----------|
    | `"auto"` (domyślnie) | Najpierw WebSocket, fallback do SSE |
    | `"sse"` | Wymuś tylko SSE |
    | `"websocket"` | Wymuś tylko WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Powiązana dokumentacja OpenAI:
    - [Realtime API z WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Strumieniowanie odpowiedzi API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Rozgrzewanie WebSocket">
    OpenClaw domyślnie włącza rozgrzewanie WebSocket dla `openai/*` i `openai-codex/*`, aby zmniejszyć opóźnienie pierwszej tury.

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

  <Accordion title="Fast mode">
    OpenClaw udostępnia współdzielony przełącznik fast mode dla `openai/*` i `openai-codex/*`:

    - **Czat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Po włączeniu OpenClaw mapuje fast mode na priorytetowe przetwarzanie OpenAI (`service_tier = "priority"`). Istniejące wartości `service_tier` są zachowywane, a fast mode nie przepisuje `reasoning` ani `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Nadpisania sesji mają pierwszeństwo przed konfiguracją. Wyczyszczenie nadpisania sesji w Sessions UI przywraca sesję do skonfigurowanej wartości domyślnej.
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
          },
        },
      },
    }
    ```

    Obsługiwane wartości: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` jest przekazywane dalej tylko do natywnych punktów końcowych OpenAI (`api.openai.com`) i natywnych punktów końcowych Codex (`chatgpt.com/backend-api`). Jeśli kierujesz któregokolwiek dostawcę przez proxy, OpenClaw pozostawia `service_tier` bez zmian.
    </Warning>

  </Accordion>

  <Accordion title="Compaction po stronie serwera (Responses API)">
    Dla bezpośrednich modeli OpenAI Responses (`openai/*` na `api.openai.com`) wrapper strumienia Pi-harness Pluginu OpenAI automatycznie włącza server-side Compaction:

    - Wymusza `store: true` (chyba że zgodność modelu ustawia `supportsStore: false`)
    - Wstrzykuje `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Domyślny `compact_threshold`: 70% `contextWindow` (albo `80000`, gdy nie jest dostępne)

    Dotyczy to wbudowanej ścieżki harnessu Pi oraz Hooków dostawcy OpenAI używanych przez przebiegi osadzone. Natywny harness Codex app-server zarządza własnym kontekstem przez Codex i jest konfigurowany osobno przez `agents.defaults.embeddedHarness.runtime`.

    <Tabs>
      <Tab title="Włącz jawnie">
        Przydatne dla zgodnych punktów końcowych, takich jak Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Niestandardowy próg">
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

  <Accordion title="Rygorystyczny tryb agentowy GPT">
    Dla przebiegów rodziny GPT-5 na `openai/*` OpenClaw może używać bardziej rygorystycznego osadzonego kontraktu wykonania:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Z `strict-agentic` OpenClaw:
    - Nie traktuje już tury zawierającej tylko plan jako udanego postępu, gdy dostępna jest akcja narzędzia
    - Ponawia turę z kierowaniem typu act-now
    - Automatycznie włącza `update_plan` dla istotnej pracy
    - Ujawnia jawny stan zablokowania, jeśli model nadal planuje bez działania

    <Note>
    Ograniczone tylko do przebiegów rodziny GPT-5 OpenAI i Codex. Inni dostawcy i starsze rodziny modeli zachowują domyślne zachowanie.
    </Note>

  </Accordion>

  <Accordion title="Ścieżki natywne vs zgodne z OpenAI">
    OpenClaw traktuje bezpośrednie punkty końcowe OpenAI, Codex i Azure OpenAI inaczej niż generyczne proxy zgodne z OpenAI `/v1`:

    **Ścieżki natywne** (`openai/*`, Azure OpenAI):
    - Zachowują `reasoning: { effort: "none" }` tylko dla modeli obsługujących OpenAI `none` effort
    - Pomijają wyłączone reasoning dla modeli lub proxy, które odrzucają `reasoning.effort: "none"`
    - Domyślnie ustawiają ścisły tryb schematów narzędzi
    - Dołączają ukryte nagłówki atrybucji tylko na zweryfikowanych natywnych hostach
    - Zachowują kształtowanie żądań specyficzne dla OpenAI (`service_tier`, `store`, zgodność reasoning, wskazówki prompt-cache)

    **Ścieżki proxy/zgodne:**
    - Używają luźniejszego zachowania zgodności
    - Nie wymuszają ścisłych schematów narzędzi ani nagłówków tylko dla ścieżek natywnych

    Azure OpenAI używa natywnego transportu i zachowania zgodności, ale nie otrzymuje ukrytych nagłówków atrybucji.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, model ref i zachowanie failoveru.
  </Card>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Współdzielone parametry narzędzia obrazów i wybór dostawcy.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Współdzielone parametry narzędzia wideo i wybór dostawcy.
  </Card>
  <Card title="OAuth and auth" href="/pl/gateway/authentication" icon="key">
    Szczegóły auth i zasady ponownego użycia poświadczeń.
  </Card>
</CardGroup>
