---
read_when:
    - Chcesz korzystać z modeli MiniMax w OpenClaw
    - Potrzebujesz wskazówek dotyczących konfiguracji MiniMax
summary: Korzystanie z modeli MiniMax w OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-07-12T15:35:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1172d2d2c92dc92858f15564eee9ffeb8eb9599ee70157116fd2e302556dd75a
    source_path: providers/minimax.md
    workflow: 16
---

  Dołączony Plugin `minimax` rejestruje dwóch dostawców oraz pięć funkcji: czat, generowanie obrazów, generowanie muzyki, generowanie wideo, rozumienie obrazów, mowę (T2A v2) i wyszukiwanie w internecie.

  | Identyfikator dostawcy | Uwierzytelnianie | Funkcje                                                                                              |
  | ---------------------- | ---------------- | ---------------------------------------------------------------------------------------------------- |
  | `minimax`              | Klucz API        | Tekst, generowanie obrazów, generowanie muzyki, generowanie wideo, rozumienie obrazów, mowa, wyszukiwanie w internecie |
  | `minimax-portal`       | OAuth            | Tekst, generowanie obrazów, generowanie muzyki, generowanie wideo, rozumienie obrazów, mowa           |

  <Tip>
  Link polecający do MiniMax Coding Plan (10% zniżki): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
  </Tip>

  ## Wbudowany katalog

  | Model                    | Typ                   | Opis                                            |
  | ------------------------ | --------------------- | ----------------------------------------------- |
  | `MiniMax-M3`             | Czat (rozumowanie)    | Domyślny hostowany model rozumowania             |
  | `MiniMax-M2.7`           | Czat (rozumowanie)    | Poprzedni hostowany model rozumowania            |
  | `MiniMax-M2.7-highspeed` | Czat (rozumowanie)    | Szybszy wariant rozumowania M2.7                 |
  | `MiniMax-VL-01`          | Analiza obrazu        | Model rozumienia obrazów                         |
  | `image-01`               | Generowanie obrazów   | Generowanie obrazów z tekstu i edycja obrazu na podstawie obrazu |
  | `music-2.6`              | Generowanie muzyki    | Domyślny model muzyczny                          |
  | `MiniMax-Hailuo-2.3`     | Generowanie wideo     | Przepływy tekst-wideo i obraz-wideo              |

  Odwołania do modeli zależą od sposobu uwierzytelniania: `minimax/<model>` w konfiguracjach z kluczem API oraz `minimax-portal/<model>` w konfiguracjach OAuth.

  ## Pierwsze kroki

  <Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Najlepsze zastosowanie:** szybka konfiguracja MiniMax Coding Plan przez OAuth, bez wymaganego klucza API.

    <Tabs>
      <Tab title="Międzynarodowy">
        <Steps>
          <Step title="Uruchom proces wdrażania">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Wynikowy bazowy adres URL dostawcy: `api.minimax.io`.
          </Step>
          <Step title="Sprawdź dostępność modelu">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="Chiny">
        <Steps>
          <Step title="Uruchom proces wdrażania">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Wynikowy bazowy adres URL dostawcy: `api.minimaxi.com`.
          </Step>
          <Step title="Sprawdź dostępność modelu">
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

  </Tab>

  <Tab title="Klucz API">
    **Najlepsze zastosowanie:** hostowany MiniMax z interfejsem API zgodnym z Anthropic.

    <Tabs>
      <Tab title="Międzynarodowy">
        <Steps>
          <Step title="Uruchom proces wdrażania">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Powoduje to skonfigurowanie `api.minimax.io` jako bazowego adresu URL.
          </Step>
          <Step title="Sprawdź dostępność modelu">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="Chiny">
        <Steps>
          <Step title="Uruchom proces wdrażania">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Powoduje to skonfigurowanie `api.minimaxi.com` jako bazowego adresu URL.
          </Step>
          <Step title="Sprawdź dostępność modelu">
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
    Punkt końcowy strumieniowania zgodny z Anthropic w modelach MiniMax-M2.x emituje `reasoning_content` we fragmentach przyrostowych w stylu OpenAI zamiast natywnych bloków myślenia Anthropic. Jeśli myślenie pozostanie niejawnie włączone, wewnętrzny tok rozumowania przedostaje się przez to do widocznych danych wyjściowych. OpenClaw domyślnie wyłącza myślenie w modelach M2.x, chyba że jawnie ustawisz `thinking`. MiniMax-M3 (oraz zgodne w przód modele M3.x) stanowi wyjątek: M3 emituje prawidłowe bloki myślenia Anthropic i wymaga aktywnego myślenia do generowania widocznej treści, dlatego OpenClaw pozostawia M3 w adaptacyjnym trybie myślenia dostawcy. Zobacz sekcję dotyczącą domyślnych ustawień myślenia w części „Konfiguracja zaawansowana” poniżej.
    </Warning>

    <Note>
    Konfiguracje z kluczem API używają identyfikatora dostawcy `minimax`. Odwołania do modeli mają postać `minimax/MiniMax-M3`.
    </Note>

  </Tab>
</Tabs>

## Konfiguracja za pomocą `openclaw configure`

<Steps>
  <Step title="Uruchom kreator">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Wybierz model/uwierzytelnianie">
    Wybierz **Model/auth** z menu.
  </Step>
  <Step title="Wybierz opcję uwierzytelniania MiniMax">
    | Opcja uwierzytelniania | Opis                                |
    | ----------------------- | ----------------------------------- |
    | `minimax-global-oauth` | Międzynarodowy OAuth (Coding Plan)  |
    | `minimax-cn-oauth`     | OAuth dla Chin (Coding Plan)        |
    | `minimax-global-api`   | Międzynarodowy klucz API            |
    | `minimax-cn-api`       | Klucz API dla Chin                  |
  </Step>
  <Step title="Wybierz model domyślny">
    Po wyświetleniu monitu wybierz model domyślny.
  </Step>
</Steps>

## Możliwości

### Generowanie obrazów

Plugin MiniMax rejestruje model `image-01` dla narzędzia `image_generate` zarówno w `minimax`, jak i `minimax-portal`, używając tego samego klucza `MINIMAX_API_KEY` lub uwierzytelniania OAuth co modele tekstowe.

- Generowanie obrazu z tekstu i edycja obrazu na podstawie innego obrazu (obrazu referencyjnego), w obu przypadkach z kontrolą proporcji
- Do 9 obrazów wyjściowych na żądanie, 1 obraz referencyjny na żądanie edycji
- Obsługiwane proporcje: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Generowanie obrazów zawsze korzysta z dedykowanego punktu końcowego MiniMax do obsługi obrazów (`/v1/image_generation`) i ignoruje `models.providers.minimax.baseUrl`, ponieważ to pole konfiguruje bazowy adres URL czatu zgodny z interfejsem Anthropic. Ustaw `MINIMAX_API_HOST=https://api.minimaxi.com`, aby kierować generowanie obrazów przez chiński punkt końcowy; domyślny globalny punkt końcowy to `https://api.minimax.io`.

<Note>
Zobacz [Generowanie obrazów](/pl/tools/image-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i działanie mechanizmu przełączania awaryjnego.
</Note>

### Synteza mowy

Dołączony Plugin `minimax` rejestruje MiniMax T2A v2 jako dostawcę syntezy mowy dla `messages.tts`.

- Domyślny model TTS: `speech-2.8-hd`
- Domyślny głos: `English_expressive_narrator`
- Identyfikatory dołączonych modeli: `speech-2.8-hd`, `speech-2.8-turbo`, `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`, `speech-02-turbo`, `speech-01-hd`, `speech-01-turbo`, `speech-01-240228`
- Kolejność rozpoznawania uwierzytelniania: `messages.tts.providers.minimax.apiKey`, następnie profile uwierzytelniania OAuth/tokenem `minimax-portal`, następnie klucze środowiskowe Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`), a na końcu `MINIMAX_API_KEY`
- Jeśli host TTS nie jest skonfigurowany, OpenClaw ponownie wykorzystuje skonfigurowany host OAuth `minimax-portal` i usuwa przyrostki ścieżek zgodnych z interfejsem Anthropic, takie jak `/anthropic`
- Zwykłe załączniki dźwiękowe pozostają w formacie MP3. Załączniki przeznaczone jako wiadomości głosowe (Feishu, Telegram i inne kanały wymagające załącznika zgodnego z wiadomościami głosowymi) są transkodowane z MiniMax MP3 do Opus 48 kHz za pomocą `ffmpeg`, ponieważ na przykład API plików Feishu/Lark akceptuje dla natywnych wiadomości dźwiękowych wyłącznie `file_type: "opus"`
- MiniMax T2A akceptuje ułamkowe wartości `speed` i `vol`, ale `pitch` jest wysyłane jako liczba całkowita; OpenClaw obcina część ułamkową wartości `pitch` przed wysłaniem żądania API

| Ustawienie                                | Zmienna środowiskowa   | Wartość domyślna              | Opis                                      |
| ----------------------------------------- | ---------------------- | ----------------------------- | ----------------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | Host API MiniMax T2A.                     |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | Identyfikator modelu TTS.                 |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Identyfikator głosu używanego do syntezy. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | Szybkość odtwarzania, `0.5..2.0`.         |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | Głośność, `(0, 10]`.                      |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | Całkowite przesunięcie tonu, `-12..12`.   |

### Generowanie muzyki

Dołączony Plugin MiniMax rejestruje generowanie muzyki za pomocą wspólnego narzędzia `music_generate` zarówno dla `minimax`, jak i `minimax-portal`.

- Domyślny model muzyczny: `minimax/music-2.6` (OAuth: `minimax-portal/music-2.6`)
- Obsługuje również `music-2.6-free`, `music-cover` i `music-cover-free`
- Parametry sterujące monitem: `lyrics`, `instrumental`
- Format wyjściowy: `mp3`
- Uruchomienia oparte na sesji są odłączane za pośrednictwem wspólnego przepływu zadań i stanu, w tym `action: "status"`

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: { primary: "minimax/music-2.6" },
    },
  },
}
```

<Note>
Zobacz [Generowanie muzyki](/pl/tools/music-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i działanie mechanizmu przełączania awaryjnego.
</Note>

### Generowanie wideo

Dołączony Plugin MiniMax rejestruje generowanie wideo za pomocą wspólnego narzędzia `video_generate` zarówno dla `minimax`, jak i `minimax-portal`.

- Domyślny model wideo: `minimax/MiniMax-Hailuo-2.3` (OAuth: `minimax-portal/MiniMax-Hailuo-2.3`)
- Obsługuje również `MiniMax-Hailuo-2.3-Fast`, `MiniMax-Hailuo-02`, `I2V-01-Director`, `I2V-01-live` i `I2V-01`
- Tryby: generowanie wideo z tekstu i przepływy z pojedynczym obrazem referencyjnym
- Obsługuje `resolution` (`768P` lub `1080P` w modelach Hailuo 2.3/02); `aspectRatio` nie jest obsługiwane i jest ignorowane

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "minimax/MiniMax-Hailuo-2.3" },
    },
  },
}
```

<Note>
Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i działanie mechanizmu przełączania awaryjnego.
</Note>

### Rozpoznawanie obrazów

Plugin MiniMax rejestruje funkcję rozpoznawania obrazów niezależnie od katalogu modeli tekstowych:

| Identyfikator dostawcy | Domyślny model obrazu | Wyodrębnianie tekstu z plików PDF |
| ---------------------- | --------------------- | --------------------------------- |
| `minimax`              | `MiniMax-VL-01`       | `MiniMax-M2.7`                    |
| `minimax-portal`       | `MiniMax-VL-01`       | `MiniMax-M2.7`                    |

Dlatego automatyczne kierowanie multimediów może korzystać z funkcji rozpoznawania obrazów MiniMax, nawet jeśli dołączony katalog dostawcy modeli tekstowych zawiera również odwołania do modeli czatu M3 obsługujących obrazy. Rozpoznawanie plików PDF używa modelu `MiniMax-M2.7` wyłącznie do wyodrębniania tekstu; MiniMax nie rejestruje ścieżki konwersji plików PDF na obrazy.

### Wyszukiwanie w internecie

Plugin MiniMax rejestruje również narzędzie `web_search` za pośrednictwem interfejsu API wyszukiwania MiniMax Token Plan (`/v1/coding_plan/search`).

- Identyfikator dostawcy: `minimax`
- Wyniki strukturalne: tytuły, adresy URL, fragmenty tekstu, powiązane zapytania
- Preferowana zmienna środowiskowa: `MINIMAX_CODE_PLAN_KEY`
- Akceptowane aliasy zmiennych środowiskowych: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Awaryjna zgodność: `MINIMAX_API_KEY`, jeśli wskazuje już poświadczenie planu tokenów
- Ponowne użycie regionu: `plugins.entries.minimax.config.webSearch.region`, następnie `MINIMAX_API_HOST`, a potem bazowe adresy URL dostawcy MiniMax
- Wyszukiwanie pozostaje przypisane do identyfikatora dostawcy `minimax`; konfiguracja OAuth dla Chin lub globalna może pośrednio sterować regionem przez `models.providers.minimax-portal.baseUrl` oraz zapewniać uwierzytelnianie tokenem Bearer przez `MINIMAX_OAUTH_TOKEN`

Konfiguracja znajduje się w `plugins.entries.minimax.config.webSearch.*`.

<Note>
Pełną konfigurację i instrukcje korzystania z wyszukiwania w internecie znajdziesz w sekcji [Wyszukiwanie MiniMax](/pl/tools/minimax-search).
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Opcje konfiguracji">
    | Opcja | Opis |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Preferowany jest `https://api.minimax.io/anthropic` (zgodny z Anthropic); adres `https://api.minimax.io/v1` jest opcjonalny dla ładunków zgodnych z OpenAI |
    | `models.providers.minimax.api` | Preferowane jest `anthropic-messages`; ustawienie `openai-completions` jest opcjonalne dla ładunków zgodnych z OpenAI |
    | `models.providers.minimax.apiKey` | Klucz API MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Definiuje `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Aliasy modeli, które chcesz umieścić na liście dozwolonych |
    | `models.mode` | Zachowaj `merge`, jeśli chcesz dodać MiniMax obok wbudowanych modeli |
  </Accordion>

  <Accordion title="Domyślne ustawienia myślenia">
    W przypadku `api: "anthropic-messages"` OpenClaw wstawia `thinking: { type: "disabled" }` dla modeli MiniMax M2.x, chyba że wcześniejsza otoczka ustawiła już pole `thinking` w ładunku. Zapobiega to emitowaniu przez strumieniowy punkt końcowy M2.x pola `reasoning_content` we fragmentach różnicowych w stylu OpenAI, co ujawniałoby wewnętrzny tok rozumowania w widocznych danych wyjściowych.

    Model MiniMax-M3 (oraz modele M3.x) jest wyłączony z tej reguły: gdy myślenie jest wyłączone, M3 zwraca pustą tablicę `content` z wartością `stop_reason: "end_turn"`, dlatego OpenClaw usuwa dla M3 niejawne domyślne wyłączenie, a gdy ustawiono poziom myślenia, wymusza zamiast niego `thinking: { type: "adaptive" }`.

    Dostępne poziomy myślenia według rodziny modeli:

    | Rodzina modeli | Poziomy                                    | Domyślnie  |
    | -------------- | ------------------------------------------ | ---------- |
    | `MiniMax-M3`   | `off`, `adaptive`                          | `adaptive` |
    | `MiniMax-M2.x` | `off`, `minimal`, `low`, `medium`, `high`  | `off`      |

  </Accordion>

  <Accordion title="Tryb szybki">
    Polecenie `/fast on` lub ustawienie `params.fastMode: true` zastępuje `MiniMax-M2.7` modelem `MiniMax-M2.7-highspeed` na ścieżce strumieniowej zgodnej z Anthropic (`api: "anthropic-messages"`, dostawca `minimax` lub `minimax-portal`).
  </Accordion>

  <Accordion title="Przykład przełączania awaryjnego">
    **Najlepsze zastosowanie:** zachowanie najsilniejszego modelu najnowszej generacji jako podstawowego i przełączanie awaryjne na MiniMax M2.7. Poniższy przykład używa modelu Opus jako konkretnego modelu podstawowego; zastąp go preferowanym modelem podstawowym najnowszej generacji.

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

  <Accordion title="Szczegóły użycia planu programistycznego">
    - Interfejs API użycia planu programistycznego: `https://api.minimaxi.com/v1/token_plan/remains` lub `https://api.minimax.io/v1/token_plan/remains` (wymaga klucza planu programistycznego).
    - Odpytywanie o użycie ustala host na podstawie `models.providers.minimax-portal.baseUrl` lub `models.providers.minimax.baseUrl`, jeśli je skonfigurowano, dzięki czemu konfiguracje globalne korzystające z `https://api.minimax.io/anthropic` odpytują `api.minimax.io`. Brakujące lub nieprawidłowe bazowe adresy URL zachowują chiński mechanizm awaryjny w celu zapewnienia zgodności.
    - OpenClaw normalizuje użycie planu programistycznego MiniMax do takiego samego formatu wyświetlania `% pozostało`, jakiego używają inni dostawcy. Surowe pola `usage_percent` / `usagePercent` MiniMax oznaczają pozostały limit, a nie wykorzystany limit, dlatego OpenClaw odwraca ich wartości. Pola oparte na liczbie mają pierwszeństwo, jeśli są dostępne.
    - Gdy interfejs API zwraca `model_remains`, OpenClaw preferuje wpis modelu czatu, w razie potrzeby wyznacza etykietę przedziału na podstawie `start_time` / `end_time` oraz umieszcza nazwę wybranego modelu w etykiecie planu, aby ułatwić rozróżnianie przedziałów planu programistycznego.
    - Migawki użycia traktują `minimax`, `minimax-cn`, `minimax-portal` i `minimax-portal-cn` jako tę samą przestrzeń limitów MiniMax oraz preferują zapisane dane OAuth MiniMax przed użyciem zmiennych środowiskowych klucza planu programistycznego.

  </Accordion>
</AccordionGroup>

## Uwagi

- Domyślny model czatu: `MiniMax-M3`. Alternatywne modele czatu: `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- Wprowadzenie i bezpośrednia konfiguracja klucza API zapisują definicje modeli M3 oraz obu wariantów M2.7
- Rozpoznawanie obrazów korzysta z należącego do pluginu dostawcy multimediów `MiniMax-VL-01`
- Jeśli potrzebujesz dokładnego śledzenia kosztów, zaktualizuj wartości cen w `models.json`
- Użyj `openclaw models list`, aby potwierdzić bieżący identyfikator dostawcy, a następnie przełącz model za pomocą `openclaw models set minimax/MiniMax-M3` lub `openclaw models set minimax-portal/MiniMax-M3`

<Note>
Reguły dotyczące dostawców znajdziesz w sekcji [Dostawcy modeli](/pl/concepts/model-providers).
</Note>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title='"Nieznany model: minimax/MiniMax-M3"'>
    Zwykle oznacza to, że **dostawca MiniMax nie jest skonfigurowany** (nie znaleziono pasującego wpisu dostawcy ani profilu uwierzytelniania lub klucza środowiskowego MiniMax). Aby rozwiązać problem:

    - Uruchom `openclaw configure` i wybierz opcję uwierzytelniania **MiniMax**, albo
    - Dodaj ręcznie pasujący blok `models.providers.minimax` lub `models.providers.minimax-portal`, albo
    - Ustaw `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` lub profil uwierzytelniania MiniMax, aby można było wstawić pasującego dostawcę.

    Pamiętaj, że identyfikator modelu **rozróżnia wielkość liter**:

    - Ścieżka klucza API: `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7` lub `minimax/MiniMax-M2.7-highspeed`
    - Ścieżka OAuth: `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7` lub `minimax-portal/MiniMax-M2.7-highspeed`

    Następnie sprawdź ponownie za pomocą:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Więcej pomocy: [Rozwiązywanie problemów](/pl/help/troubleshooting) i [Najczęściej zadawane pytania](/pl/help/faq).
</Note>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i działania mechanizmu przełączania awaryjnego.
  </Card>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Wspólne parametry narzędzia do obsługi obrazów i wybór dostawcy.
  </Card>
  <Card title="Generowanie muzyki" href="/pl/tools/music-generation" icon="music">
    Wspólne parametry narzędzia do obsługi muzyki i wybór dostawcy.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Wspólne parametry narzędzia do obsługi wideo i wybór dostawcy.
  </Card>
  <Card title="Wyszukiwanie MiniMax" href="/pl/tools/minimax-search" icon="magnifying-glass">
    Konfiguracja wyszukiwania w internecie za pośrednictwem MiniMax Token Plan.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Ogólne informacje o rozwiązywaniu problemów i najczęściej zadawane pytania.
  </Card>
</CardGroup>
