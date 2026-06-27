---
read_when:
    - Chcesz używać modeli MiniMax w OpenClaw
    - Potrzebujesz wskazówek dotyczących konfiguracji MiniMax
summary: Korzystanie z modeli MiniMax w OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-06-27T18:13:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37fe606178d7d15383e56c026b02ba7be751ead706adc097c776c0a6a92aa2a2
    source_path: providers/minimax.md
    workflow: 16
---

OpenClaw domyślnie używa **MiniMax M3** dla dostawcy MiniMax.

MiniMax zapewnia też:

- Wbudowaną syntezę mowy przez T2A v2
- Wbudowane rozumienie obrazów przez `MiniMax-VL-01`
- Wbudowane generowanie muzyki przez `music-2.6`
- Wbudowane `web_search` przez API wyszukiwania MiniMax Token Plan

Podział dostawców:

| ID dostawcy      | Uwierzytelnianie | Możliwości                                                                                         |
| ---------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `minimax`        | Klucz API        | Tekst, generowanie obrazów, generowanie muzyki, generowanie wideo, rozumienie obrazów, mowa, wyszukiwanie w sieci |
| `minimax-portal` | OAuth            | Tekst, generowanie obrazów, generowanie muzyki, generowanie wideo, rozumienie obrazów, mowa        |

## Wbudowany katalog

| Model                    | Typ              | Opis                                      |
| ------------------------ | ---------------- | ----------------------------------------- |
| `MiniMax-M3`             | Czat (rozumowanie) | Domyślny hostowany model rozumowania      |
| `MiniMax-M2.7`           | Czat (rozumowanie) | Poprzedni hostowany model rozumowania     |
| `MiniMax-M2.7-highspeed` | Czat (rozumowanie) | Szybsza warstwa rozumowania M2.7          |
| `MiniMax-VL-01`          | Wizja            | Model rozumienia obrazów                  |
| `image-01`               | Generowanie obrazów | Edycja tekst-na-obraz i obraz-na-obraz    |
| `music-2.6`              | Generowanie muzyki | Domyślny model muzyki                     |
| `music-2.5`              | Generowanie muzyki | Poprzednia warstwa generowania muzyki     |
| `music-2.0`              | Generowanie muzyki | Starsza warstwa generowania muzyki        |
| `MiniMax-Hailuo-2.3`     | Generowanie wideo | Przepływy tekst-na-wideo i z obrazem referencyjnym |

## Pierwsze kroki

Wybierz preferowaną metodę uwierzytelniania i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Najlepsze dla:** szybkiej konfiguracji z MiniMax Coding Plan przez OAuth, bez wymaganego klucza API.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            To uwierzytelnia względem `api.minimax.io`.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            To uwierzytelnia względem `api.minimaxi.com`.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    Konfiguracje OAuth używają identyfikatora dostawcy `minimax-portal`. Odwołania do modeli mają postać `minimax-portal/MiniMax-M3`.
    </Note>

    <Tip>
    Link polecający do MiniMax Coding Plan (10% zniżki): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **Najlepsze dla:** hostowanego MiniMax z API zgodnym z Anthropic.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            To konfiguruje `api.minimax.io` jako bazowy adres URL.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            To konfiguruje `api.minimaxi.com` jako bazowy adres URL.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### Przykład konfiguracji

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M3" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    Na ścieżce strumieniowania zgodnej z Anthropic OpenClaw domyślnie wyłącza myślenie MiniMax M2.x, chyba że jawnie ustawisz `thinking` samodzielnie. Punkt końcowy strumieniowania M2.x emituje `reasoning_content` w porcjach delta w stylu OpenAI zamiast natywnych bloków myślenia Anthropic, co może ujawnić wewnętrzne rozumowanie w widocznym wyniku, jeśli pozostanie włączone niejawnie. MiniMax-M3 (i zgodne w przód M3.x) jest wyłączony z tej domyślnej reguły: M3 emituje poprawne bloki myślenia Anthropic i wymaga aktywnego myślenia, aby wygenerować widoczną treść, więc OpenClaw pozostawia M3 na pominiętej/adaptacyjnej ścieżce myślenia dostawcy.
    </Warning>

    <Note>
    Konfiguracje z kluczem API używają identyfikatora dostawcy `minimax`. Odwołania do modeli mają postać `minimax/MiniMax-M3`.
    </Note>

  </Tab>
</Tabs>

## Konfiguracja przez `openclaw configure`

Użyj interaktywnego kreatora konfiguracji, aby ustawić MiniMax bez edytowania JSON:

<Steps>
  <Step title="Launch the wizard">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Select Model/auth">
    Wybierz **Model/auth** z menu.
  </Step>
  <Step title="Choose a MiniMax auth option">
    Wybierz jedną z dostępnych opcji MiniMax:

    | Wybór uwierzytelniania | Opis |
    | --- | --- |
    | `minimax-global-oauth` | Międzynarodowy OAuth (Coding Plan) |
    | `minimax-cn-oauth` | Chiński OAuth (Coding Plan) |
    | `minimax-global-api` | Międzynarodowy klucz API |
    | `minimax-cn-api` | Chiński klucz API |

  </Step>
  <Step title="Pick your default model">
    Wybierz domyślny model po wyświetleniu monitu.
  </Step>
</Steps>

## Możliwości

### Generowanie obrazów

Plugin MiniMax rejestruje model `image-01` dla narzędzia `image_generate`. Obsługuje on:

- **Generowanie obrazów z tekstu** z kontrolą proporcji
- **Edycję obraz-na-obraz** (referencja obiektu) z kontrolą proporcji
- Do **9 obrazów wynikowych** na żądanie
- Do **1 obrazu referencyjnego** na żądanie edycji
- Obsługiwane proporcje: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Aby używać MiniMax do generowania obrazów, ustaw go jako dostawcę generowania obrazów:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Plugin używa tego samego `MINIMAX_API_KEY` lub uwierzytelniania OAuth co modele tekstowe. Jeśli MiniMax jest już skonfigurowany, dodatkowa konfiguracja nie jest potrzebna.

Zarówno `minimax`, jak i `minimax-portal` rejestrują `image_generate` z tym samym
modelem `image-01`. Konfiguracje z kluczem API używają `MINIMAX_API_KEY`; konfiguracje OAuth mogą zamiast tego używać
wbudowanej ścieżki uwierzytelniania `minimax-portal`.

Generowanie obrazów zawsze używa dedykowanego punktu końcowego obrazów MiniMax
(`/v1/image_generation`) i ignoruje `models.providers.minimax.baseUrl`,
ponieważ to pole konfiguruje bazowy adres URL czatu zgodny z Anthropic. Ustaw
`MINIMAX_API_HOST=https://api.minimaxi.com`, aby kierować generowanie obrazów
przez punkt końcowy CN; domyślny globalny punkt końcowy to
`https://api.minimax.io`.

Gdy onboarding lub konfiguracja z kluczem API zapisuje jawne wpisy `models.providers.minimax`,
OpenClaw materializuje `MiniMax-M3`, `MiniMax-M2.7` i
`MiniMax-M2.7-highspeed` jako modele czatu. M3 deklaruje obsługę wejścia tekstowego i obrazowego;
rozumienie obrazów pozostaje udostępnione osobno przez należącego do Plugin
dostawcę mediów `MiniMax-VL-01`.

<Note>
Zobacz [Generowanie obrazów](/pl/tools/image-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie przełączania awaryjnego.
</Note>

### Zamiana tekstu na mowę

Wbudowany Plugin `minimax` rejestruje MiniMax T2A v2 jako dostawcę mowy dla
`messages.tts`.

- Domyślny model TTS: `speech-2.8-hd`
- Domyślny głos: `English_expressive_narrator`
- Obsługiwane wbudowane identyfikatory modeli obejmują `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` i `speech-01-turbo`.
- Rozpoznawanie uwierzytelniania używa kolejno `messages.tts.providers.minimax.apiKey`, potem
  profili uwierzytelniania OAuth/token `minimax-portal`, potem kluczy środowiskowych
  Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), a następnie `MINIMAX_API_KEY`.
- Jeśli host TTS nie jest skonfigurowany, OpenClaw ponownie używa skonfigurowanego
  hosta OAuth `minimax-portal` i usuwa sufiksy ścieżek zgodnych z Anthropic,
  takie jak `/anthropic`.
- Zwykłe załączniki audio pozostają w formacie MP3.
- Cele notatek głosowych, takie jak Feishu i Telegram, są transkodowane z MiniMax
  MP3 do Opus 48 kHz za pomocą `ffmpeg`, ponieważ API plików Feishu/Lark akceptuje tylko
  `file_type: "opus"` dla natywnych wiadomości audio.
- MiniMax T2A akceptuje ułamkowe wartości `speed` i `vol`, ale `pitch` jest wysyłane jako
  liczba całkowita; OpenClaw obcina ułamkowe wartości `pitch` przed żądaniem API.

| Ustawienie                                      | Zmienna środowiskowa | Domyślna                      | Opis                             |
| ----------------------------------------------- | -------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl`        | `MINIMAX_API_HOST`   | `https://api.minimax.io`      | Host API MiniMax T2A.            |
| `messages.tts.providers.minimax.model`          | `MINIMAX_TTS_MODEL`  | `speech-2.8-hd`               | ID modelu TTS.                   |
| `messages.tts.providers.minimax.speakerVoiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | ID głosu używany dla wyniku mowy. |
| `messages.tts.providers.minimax.speed`          |                      | `1.0`                         | Szybkość odtwarzania, `0.5..2.0`. |
| `messages.tts.providers.minimax.vol`            |                      | `1.0`                         | Głośność, `(0, 10]`.             |
| `messages.tts.providers.minimax.pitch`          |                      | `0`                           | Całkowite przesunięcie wysokości tonu, `-12..12`. |

### Generowanie muzyki

Wbudowany Plugin MiniMax rejestruje generowanie muzyki przez współdzielone
narzędzie `music_generate` zarówno dla `minimax`, jak i `minimax-portal`.

- Domyślny model muzyki: `minimax/music-2.6`
- Model muzyki OAuth: `minimax-portal/music-2.6`
- Obsługuje także `minimax/music-2.5` i `minimax/music-2.0`
- Kontrolki promptu: `lyrics`, `instrumental`
- Format wyjściowy: `mp3`
- Uruchomienia oparte na sesji odłączają się przez współdzielony przepływ zadań/statusu, w tym `action: "status"`

Aby użyć MiniMax jako domyślnego dostawcy muzyki:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.6",
      },
    },
  },
}
```

<Note>
Zobacz [Generowanie muzyki](/pl/tools/music-generation), aby poznać współdzielone parametry narzędzia, wybór dostawcy i zachowanie przełączania awaryjnego.
</Note>

### Generowanie wideo

Dołączony Plugin MiniMax rejestruje generowanie wideo przez współdzielone
narzędzie `video_generate` zarówno dla `minimax`, jak i `minimax-portal`.

- Domyślny model wideo: `minimax/MiniMax-Hailuo-2.3`
- Model wideo OAuth: `minimax-portal/MiniMax-Hailuo-2.3`
- Tryby: przepływy tekst-na-wideo i referencji pojedynczego obrazu
- Obsługuje `aspectRatio` i `resolution`

Aby użyć MiniMax jako domyślnego dostawcy wideo:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

<Note>
Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać współdzielone parametry narzędzia, wybór dostawcy i zachowanie przełączania awaryjnego.
</Note>

### Rozumienie obrazu

Plugin MiniMax rejestruje rozumienie obrazu osobno względem katalogu
tekstowego:

| Identyfikator dostawcy | Domyślny model obrazu |
| ---------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

Dlatego automatyczne routowanie multimediów może używać rozumienia obrazu MiniMax nawet
wtedy, gdy dołączony katalog dostawców tekstu zawiera także referencje czatu M3 obsługujące obrazy.

### Wyszukiwanie w internecie

Plugin MiniMax rejestruje także `web_search` przez interfejs API wyszukiwania MiniMax Token Plan.

- Identyfikator dostawcy: `minimax`
- Wyniki strukturalne: tytuły, adresy URL, fragmenty, powiązane zapytania
- Preferowana zmienna środowiskowa: `MINIMAX_CODE_PLAN_KEY`
- Akceptowane aliasy środowiskowe: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Awaryjna zgodność: `MINIMAX_API_KEY`, gdy wskazuje już poświadczenie planu tokenów
- Ponowne użycie regionu: `plugins.entries.minimax.config.webSearch.region`, następnie `MINIMAX_API_HOST`, następnie bazowe adresy URL dostawcy MiniMax
- Wyszukiwanie pozostaje przy identyfikatorze dostawcy `minimax`; konfiguracja OAuth CN/global może pośrednio sterować regionem przez `models.providers.minimax-portal.baseUrl` i może dostarczać uwierzytelnianie bearer przez `MINIMAX_OAUTH_TOKEN`

Konfiguracja znajduje się pod `plugins.entries.minimax.config.webSearch.*`.

<Note>
Zobacz [MiniMax Search](/pl/tools/minimax-search), aby poznać pełną konfigurację i użycie wyszukiwania w internecie.
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Configuration options">
    | Opcja | Opis |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Preferuj `https://api.minimax.io/anthropic` (zgodne z Anthropic); `https://api.minimax.io/v1` jest opcjonalne dla ładunków zgodnych z OpenAI |
    | `models.providers.minimax.api` | Preferuj `anthropic-messages`; `openai-completions` jest opcjonalne dla ładunków zgodnych z OpenAI |
    | `models.providers.minimax.apiKey` | Klucz API MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Zdefiniuj `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Aliasuj modele, które chcesz umieścić na liście dozwolonych |
    | `models.mode` | Zachowaj `merge`, jeśli chcesz dodać MiniMax obok wbudowanych modeli |
  </Accordion>

  <Accordion title="Thinking defaults">
    Przy `api: "anthropic-messages"` OpenClaw wstrzykuje `thinking: { type: "disabled" }` dla modeli MiniMax M2.x, chyba że thinking jest już jawnie ustawione w parametrach/konfiguracji.

    Zapobiega to emitowaniu przez punkt końcowy strumieniowania M2.x `reasoning_content` w fragmentach delta w stylu OpenAI, co ujawniłoby wewnętrzne rozumowanie w widocznym wyjściu.

    MiniMax-M3 (i M3.x) jest wyłączony z tej reguły: M3 emituje poprawne bloki thinking Anthropic i zwraca pustą tablicę `content` z `stop_reason: "end_turn"`, gdy thinking jest wyłączone, więc wrapper utrzymuje M3 na pominiętej/adaptacyjnej ścieżce thinking dostawcy.

  </Accordion>

  <Accordion title="Fast mode">
    `/fast on` lub `params.fastMode: true` przepisuje `MiniMax-M2.7` na `MiniMax-M2.7-highspeed` na ścieżce strumieniowania zgodnej z Anthropic.
  </Accordion>

  <Accordion title="Fallback example">
    **Najlepsze dla:** zachowania najsilniejszego modelu najnowszej generacji jako podstawowego i przełączania awaryjnego na MiniMax M2.7. Poniższy przykład używa Opus jako konkretnego modelu podstawowego; zamień go na preferowany podstawowy model najnowszej generacji.

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": { alias: "primary" },
            "minimax/MiniMax-M2.7": { alias: "minimax" },
          },
          model: {
            primary: "anthropic/claude-opus-4-6",
            fallbacks: ["minimax/MiniMax-M2.7"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Coding Plan usage details">
    - Interfejs API użycia Coding Plan: `https://api.minimaxi.com/v1/token_plan/remains` lub `https://api.minimax.io/v1/token_plan/remains` (wymaga klucza planu kodowania).
    - Odpytywanie użycia wyprowadza hosta z `models.providers.minimax-portal.baseUrl` lub `models.providers.minimax.baseUrl`, gdy jest skonfigurowane, więc konfiguracje globalne używające `https://api.minimax.io/anthropic` odpytują `api.minimax.io`. Brakujące lub niepoprawnie sformatowane bazowe adresy URL zachowują awaryjną zgodność CN.
    - OpenClaw normalizuje użycie planu kodowania MiniMax do tego samego wyświetlania `% left`, którego używają inni dostawcy. Surowe pola MiniMax `usage_percent` / `usagePercent` oznaczają pozostały limit, a nie zużyty limit, więc OpenClaw je odwraca. Pola oparte na liczbach mają pierwszeństwo, gdy są obecne.
    - Gdy interfejs API zwraca `model_remains`, OpenClaw preferuje wpis modelu czatu, wyprowadza etykietę okna z `start_time` / `end_time`, gdy jest to potrzebne, i dołącza nazwę wybranego modelu do etykiety planu, aby okna planu kodowania były łatwiejsze do rozróżnienia.
    - Migawki użycia traktują `minimax`, `minimax-cn` i `minimax-portal` jako tę samą powierzchnię limitu MiniMax oraz preferują zapisany OAuth MiniMax przed powrotem do zmiennych środowiskowych klucza Coding Plan.

  </Accordion>
</AccordionGroup>

## Uwagi

- Referencje modeli podążają ścieżką uwierzytelniania:
  - Konfiguracja z kluczem API: `minimax/<model>`
  - Konfiguracja OAuth: `minimax-portal/<model>`
- Domyślny model czatu: `MiniMax-M3`
- Alternatywne modele czatu: `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- Onboarding i bezpośrednia konfiguracja klucza API zapisują definicje modeli dla M3 oraz obu wariantów M2.7
- Rozumienie obrazu używa należącego do Pluginu dostawcy multimediów `MiniMax-VL-01`
- Zaktualizuj wartości cen w `models.json`, jeśli potrzebujesz dokładnego śledzenia kosztów
- Użyj `openclaw models list`, aby potwierdzić bieżący identyfikator dostawcy, a następnie przełącz za pomocą `openclaw models set minimax/MiniMax-M3` lub `openclaw models set minimax-portal/MiniMax-M3`

<Tip>
Link polecający do MiniMax Coding Plan (10% zniżki): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Zobacz [Dostawcy modeli](/pl/concepts/model-providers), aby poznać reguły dostawców.
</Note>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M3"'>
    Zwykle oznacza to, że **dostawca MiniMax nie jest skonfigurowany** (brak pasującego wpisu dostawcy i brak profilu uwierzytelniania MiniMax/klucza środowiskowego). Poprawka dla tego wykrywania jest w **2026.1.12**. Napraw przez:

    - Uaktualnienie do **2026.1.12** (lub uruchomienie ze źródeł `main`), a następnie ponowne uruchomienie gateway.
    - Uruchomienie `openclaw configure` i wybranie opcji uwierzytelniania **MiniMax**, albo
    - Ręczne dodanie pasującego bloku `models.providers.minimax` lub `models.providers.minimax-portal`, albo
    - Ustawienie `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` lub profilu uwierzytelniania MiniMax, aby można było wstrzyknąć pasującego dostawcę.

    Upewnij się, że identyfikator modelu **rozróżnia wielkość liter**:

    - Ścieżka klucza API: `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7` lub `minimax/MiniMax-M2.7-highspeed`
    - Ścieżka OAuth: `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7` lub `minimax-portal/MiniMax-M2.7-highspeed`

    Następnie sprawdź ponownie za pomocą:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Więcej pomocy: [Rozwiązywanie problemów](/pl/help/troubleshooting) i [FAQ](/pl/help/faq).
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Model selection" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, referencji modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Image generation" href="/pl/tools/image-generation" icon="image">
    Współdzielone parametry narzędzia obrazu i wybór dostawcy.
  </Card>
  <Card title="Music generation" href="/pl/tools/music-generation" icon="music">
    Współdzielone parametry narzędzia muzyki i wybór dostawcy.
  </Card>
  <Card title="Video generation" href="/pl/tools/video-generation" icon="video">
    Współdzielone parametry narzędzia wideo i wybór dostawcy.
  </Card>
  <Card title="MiniMax Search" href="/pl/tools/minimax-search" icon="magnifying-glass">
    Konfiguracja wyszukiwania w internecie przez MiniMax Token Plan.
  </Card>
  <Card title="Troubleshooting" href="/pl/help/troubleshooting" icon="wrench">
    Ogólne rozwiązywanie problemów i FAQ.
  </Card>
</CardGroup>
