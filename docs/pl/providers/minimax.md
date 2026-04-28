---
read_when:
    - Chcesz używać modeli MiniMax w OpenClaw
    - Potrzebujesz wskazówek dotyczących konfiguracji MiniMax
summary: Używanie modeli MiniMax w OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-26T11:39:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b91f8c4c12c993457fb1535bbb2f3401474a3ec432b24189792a20041e756dc
    source_path: providers/minimax.md
    workflow: 15
---

Dostawca MiniMax w OpenClaw domyślnie używa **MiniMax M2.7**.

MiniMax udostępnia także:

- Wbudowaną syntezę mowy przez T2A v2
- Wbudowane rozumienie obrazów przez `MiniMax-VL-01`
- Wbudowane generowanie muzyki przez `music-2.6`
- Wbudowane `web_search` przez API wyszukiwania MiniMax Coding Plan

Podział dostawców:

| Provider ID      | Uwierzytelnianie | Możliwości                                                                                         |
| ---------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `minimax`        | Klucz API        | Tekst, generowanie obrazów, generowanie muzyki, generowanie wideo, rozumienie obrazów, mowa, wyszukiwanie w sieci |
| `minimax-portal` | OAuth            | Tekst, generowanie obrazów, generowanie muzyki, generowanie wideo, rozumienie obrazów, mowa       |

## Wbudowany katalog

| Model                    | Typ              | Opis                                     |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | Czat (reasoning) | Domyślny hostowany model reasoning       |
| `MiniMax-M2.7-highspeed` | Czat (reasoning) | Szybszy poziom reasoning M2.7            |
| `MiniMax-VL-01`          | Vision           | Model rozumienia obrazów                 |
| `image-01`               | Generowanie obrazów | Tekst-na-obraz i edycja obraz-na-obraz |
| `music-2.6`              | Generowanie muzyki | Domyślny model muzyczny                |
| `music-2.5`              | Generowanie muzyki | Poprzedni poziom generowania muzyki    |
| `music-2.0`              | Generowanie muzyki | Starszy poziom generowania muzyki      |
| `MiniMax-Hailuo-2.3`     | Generowanie wideo | Przepływy tekst-na-wideo i z referencją obrazu |

## Pierwsze kroki

Wybierz preferowaną metodę uwierzytelniania i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Najlepsze dla:** szybkiej konfiguracji z MiniMax Coding Plan przez OAuth, bez wymaganego klucza API.

    <Tabs>
      <Tab title="Międzynarodowo">
        <Steps>
          <Step title="Uruchom onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            To uwierzytelnia względem `api.minimax.io`.
          </Step>
          <Step title="Sprawdź, czy model jest dostępny">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="Chiny">
        <Steps>
          <Step title="Uruchom onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            To uwierzytelnia względem `api.minimaxi.com`.
          </Step>
          <Step title="Sprawdź, czy model jest dostępny">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    Konfiguracje OAuth używają identyfikatora dostawcy `minimax-portal`. Odwołania do modeli mają postać `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Link polecający do MiniMax Coding Plan (10% zniżki): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="Klucz API">
    **Najlepsze dla:** hostowanego MiniMax z API zgodnym z Anthropic.

    <Tabs>
      <Tab title="Międzynarodowo">
        <Steps>
          <Step title="Uruchom onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            To konfiguruje `api.minimax.io` jako bazowy adres URL.
          </Step>
          <Step title="Sprawdź, czy model jest dostępny">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="Chiny">
        <Steps>
          <Step title="Uruchom onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            To konfiguruje `api.minimaxi.com` jako bazowy adres URL.
          </Step>
          <Step title="Sprawdź, czy model jest dostępny">
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
      agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
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
    Na ścieżce streamingu zgodnej z Anthropic OpenClaw domyślnie wyłącza thinking MiniMax, chyba że jawnie ustawisz `thinking`. Endpoint streamingu MiniMax emituje `reasoning_content` w kawałkach delta w stylu OpenAI zamiast natywnych bloków thinking Anthropic, co może ujawniać wewnętrzne rozumowanie w widocznym wyjściu, jeśli pozostanie to domyślnie włączone.
    </Warning>

    <Note>
    Konfiguracje z kluczem API używają identyfikatora dostawcy `minimax`. Odwołania do modeli mają postać `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Konfiguracja przez `openclaw configure`

Użyj interaktywnego kreatora konfiguracji, aby ustawić MiniMax bez edytowania JSON:

<Steps>
  <Step title="Uruchom kreatora">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Wybierz Model/auth">
    Z menu wybierz **Model/auth**.
  </Step>
  <Step title="Wybierz opcję uwierzytelniania MiniMax">
    Wybierz jedną z dostępnych opcji MiniMax:

    | Auth choice | Opis |
    | --- | --- |
    | `minimax-global-oauth` | Międzynarodowe OAuth (Coding Plan) |
    | `minimax-cn-oauth` | OAuth dla Chin (Coding Plan) |
    | `minimax-global-api` | Międzynarodowy klucz API |
    | `minimax-cn-api` | Klucz API dla Chin |

  </Step>
  <Step title="Wybierz model domyślny">
    Gdy pojawi się monit, wybierz model domyślny.
  </Step>
</Steps>

## Możliwości

### Generowanie obrazów

Plugin MiniMax rejestruje model `image-01` dla narzędzia `image_generate`. Obsługuje on:

- **Generowanie tekst-na-obraz** z kontrolą proporcji obrazu
- **Edycję obraz-na-obraz** (referencja obiektu) z kontrolą proporcji obrazu
- Do **9 obrazów wyjściowych** na żądanie
- Do **1 obrazu referencyjnego** na żądanie edycji
- Obsługiwane proporcje obrazu: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

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

Plugin używa tego samego `MINIMAX_API_KEY` lub uwierzytelniania OAuth co modele tekstowe. Jeśli MiniMax jest już skonfigurowany, nie jest wymagana dodatkowa konfiguracja.

Zarówno `minimax`, jak i `minimax-portal` rejestrują `image_generate` z tym samym
modelem `image-01`. Konfiguracje z kluczem API używają `MINIMAX_API_KEY`; konfiguracje OAuth mogą używać
zamiast tego dołączonej ścieżki uwierzytelniania `minimax-portal`.

Generowanie obrazów zawsze używa dedykowanego endpointu obrazów MiniMax
(`/v1/image_generation`) i ignoruje `models.providers.minimax.baseUrl`,
ponieważ to pole konfiguruje bazowy adres URL czatu/zgodny z Anthropic. Ustaw
`MINIMAX_API_HOST=https://api.minimaxi.com`, aby kierować generowanie obrazów
przez endpoint CN; domyślny globalny endpoint to
`https://api.minimax.io`.

Gdy onboarding lub konfiguracja z kluczem API zapisuje jawne wpisy `models.providers.minimax`,
OpenClaw materializuje `MiniMax-M2.7` i
`MiniMax-M2.7-highspeed` jako modele czatu tylko tekstowego. Rozumienie obrazów
jest udostępniane oddzielnie przez należącego do pluginu dostawcę mediów `MiniMax-VL-01`.

<Note>
Zobacz [Image Generation](/pl/tools/image-generation), aby poznać współdzielone parametry narzędzia, wybór dostawcy i zachowanie failover.
</Note>

### Text-to-speech

Dołączony plugin `minimax` rejestruje MiniMax T2A v2 jako dostawcę mowy dla
`messages.tts`.

- Domyślny model TTS: `speech-2.8-hd`
- Domyślny głos: `English_expressive_narrator`
- Obsługiwane identyfikatory dołączonych modeli obejmują `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` i `speech-01-turbo`.
- Rozwiązywanie uwierzytelniania przebiega przez `messages.tts.providers.minimax.apiKey`, następnie
  profile uwierzytelniania OAuth/token `minimax-portal`, potem klucze środowiskowe Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), a na końcu `MINIMAX_API_KEY`.
- Jeśli nie skonfigurowano hosta TTS, OpenClaw ponownie używa skonfigurowanego
  hosta OAuth `minimax-portal` i usuwa zgodne z Anthropic sufiksy ścieżki
  takie jak `/anthropic`.
- Zwykłe załączniki audio pozostają w formacie MP3.
- Cele notatek głosowych, takie jak Feishu i Telegram, są transkodowane z MP3 MiniMax
  do Opus 48 kHz przez `ffmpeg`, ponieważ API plików Feishu/Lark akceptuje tylko
  `file_type: "opus"` dla natywnych wiadomości audio.
- MiniMax T2A akceptuje ułamkowe wartości `speed` i `vol`, ale `pitch` jest wysyłane jako
  liczba całkowita; OpenClaw obcina ułamkowe wartości `pitch` przed wysłaniem żądania API.

| Ustawienie                               | Zmienna środowiskowa   | Domyślna wartość             | Opis                              |
| ---------------------------------------- | ---------------------- | ---------------------------- | --------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`     | Host API MiniMax T2A.             |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`              | Identyfikator modelu TTS.         |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Identyfikator głosu używany do wyjścia mowy. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                        | Prędkość odtwarzania, `0.5..2.0`. |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                        | Głośność, `(0, 10]`.              |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                          | Całkowite przesunięcie tonu, `-12..12`. |

### Generowanie muzyki

Dołączony plugin MiniMax rejestruje generowanie muzyki przez współdzielone
narzędzie `music_generate` zarówno dla `minimax`, jak i `minimax-portal`.

- Domyślny model muzyczny: `minimax/music-2.6`
- Model muzyczny OAuth: `minimax-portal/music-2.6`
- Obsługuje też `minimax/music-2.5` i `minimax/music-2.0`
- Sterowanie promptem: `lyrics`, `instrumental`, `durationSeconds`
- Format wyjściowy: `mp3`
- Przebiegi oparte na sesjach są odłączane przez współdzielony przepływ task/status, w tym `action: "status"`

Aby używać MiniMax jako domyślnego dostawcy muzyki:

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
Zobacz [Music Generation](/pl/tools/music-generation), aby poznać współdzielone parametry narzędzia, wybór dostawcy i zachowanie failover.
</Note>

### Generowanie wideo

Dołączony plugin MiniMax rejestruje generowanie wideo przez współdzielone
narzędzie `video_generate` zarówno dla `minimax`, jak i `minimax-portal`.

- Domyślny model wideo: `minimax/MiniMax-Hailuo-2.3`
- Model wideo OAuth: `minimax-portal/MiniMax-Hailuo-2.3`
- Tryby: tekst-na-wideo i przepływy z referencją pojedynczego obrazu
- Obsługuje `aspectRatio` i `resolution`

Aby używać MiniMax jako domyślnego dostawcy wideo:

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
Zobacz [Video Generation](/pl/tools/video-generation), aby poznać współdzielone parametry narzędzia, wybór dostawcy i zachowanie failover.
</Note>

### Rozumienie obrazów

Plugin MiniMax rejestruje rozumienie obrazów oddzielnie od katalogu tekstowego:

| Provider ID      | Domyślny model obrazów |
| ---------------- | ---------------------- |
| `minimax`        | `MiniMax-VL-01`        |
| `minimax-portal` | `MiniMax-VL-01`        |

Dlatego automatyczne trasowanie multimediów może używać rozumienia obrazów MiniMax
nawet wtedy, gdy dołączony katalog dostawców tekstowych nadal pokazuje odwołania do czatu M2.7 tylko dla tekstu.

### Wyszukiwanie w sieci

Plugin MiniMax rejestruje również `web_search` przez API wyszukiwania MiniMax Coding Plan.

- Identyfikator dostawcy: `minimax`
- Wyniki strukturalne: tytuły, adresy URL, fragmenty, powiązane zapytania
- Preferowana zmienna środowiskowa: `MINIMAX_CODE_PLAN_KEY`
- Akceptowany alias zmiennej środowiskowej: `MINIMAX_CODING_API_KEY`
- Fallback zgodności: `MINIMAX_API_KEY`, gdy już wskazuje token coding-plan
- Ponowne użycie regionu: `plugins.entries.minimax.config.webSearch.region`, następnie `MINIMAX_API_HOST`, a potem bazowe adresy URL dostawców MiniMax
- Wyszukiwanie pozostaje przy identyfikatorze dostawcy `minimax`; konfiguracja OAuth CN/global nadal może pośrednio sterować regionem przez `models.providers.minimax-portal.baseUrl`

Konfiguracja znajduje się pod `plugins.entries.minimax.config.webSearch.*`.

<Note>
Zobacz [MiniMax Search](/pl/tools/minimax-search), aby poznać pełną konfigurację i użycie wyszukiwania w sieci.
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Opcje konfiguracji">
    | Option | Description |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Preferuj `https://api.minimax.io/anthropic` (zgodne z Anthropic); `https://api.minimax.io/v1` jest opcjonalne dla ładunków zgodnych z OpenAI |
    | `models.providers.minimax.api` | Preferuj `anthropic-messages`; `openai-completions` jest opcjonalne dla ładunków zgodnych z OpenAI |
    | `models.providers.minimax.apiKey` | Klucz API MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Zdefiniuj `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Aliasuj modele, które chcesz mieć na liście dozwolonych |
    | `models.mode` | Zachowaj `merge`, jeśli chcesz dodać MiniMax obok wbudowanych |
  </Accordion>

  <Accordion title="Domyślne thinking">
    Dla `api: "anthropic-messages"` OpenClaw wstrzykuje `thinking: { type: "disabled" }`, chyba że thinking jest już jawnie ustawione w parametrach/konfiguracji.

    Zapobiega to emitowaniu przez endpoint streamingu MiniMax `reasoning_content` w kawałkach delta w stylu OpenAI, co ujawniałoby wewnętrzne rozumowanie w widocznym wyjściu.

  </Accordion>

  <Accordion title="Tryb szybki">
    `/fast on` lub `params.fastMode: true` przepisuje `MiniMax-M2.7` na `MiniMax-M2.7-highspeed` na ścieżce streamingu zgodnej z Anthropic.
  </Accordion>

  <Accordion title="Przykład fallbacku">
    **Najlepsze dla:** utrzymania najmocniejszego modelu najnowszej generacji jako podstawowego i przejścia awaryjnego do MiniMax M2.7. Poniższy przykład używa Opus jako konkretnego modelu podstawowego; zamień go na preferowany model podstawowy najnowszej generacji.

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

  <Accordion title="Szczegóły użycia Coding Plan">
    - API użycia Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (wymaga klucza coding plan).
    - OpenClaw normalizuje użycie MiniMax coding-plan do tego samego wyświetlania `% left`, co u innych dostawców. Surowe pola MiniMax `usage_percent` / `usagePercent` oznaczają pozostały limit, a nie wykorzystany limit, więc OpenClaw je odwraca. Pola oparte na liczbie wygrywają, gdy są obecne.
    - Gdy API zwraca `model_remains`, OpenClaw preferuje wpis modelu czatu, w razie potrzeby wyprowadza etykietę okna z `start_time` / `end_time` i dołącza nazwę wybranego modelu do etykiety planu, aby łatwiej odróżniać okna coding-plan.
    - Snapshoty użycia traktują `minimax`, `minimax-cn` i `minimax-portal` jako tę samą powierzchnię limitu MiniMax i preferują zapisane MiniMax OAuth przed fallbackiem do zmiennych środowiskowych klucza Coding Plan.

  </Accordion>
</AccordionGroup>

## Uwagi

- Odwołania do modeli zależą od ścieżki uwierzytelniania:
  - Konfiguracja z kluczem API: `minimax/<model>`
  - Konfiguracja OAuth: `minimax-portal/<model>`
- Domyślny model czatu: `MiniMax-M2.7`
- Alternatywny model czatu: `MiniMax-M2.7-highspeed`
- Onboarding i bezpośrednia konfiguracja z kluczem API zapisują definicje modeli tylko tekstowych dla obu wariantów M2.7
- Rozumienie obrazów używa należącego do pluginu dostawcy mediów `MiniMax-VL-01`
- Zaktualizuj wartości cen w `models.json`, jeśli potrzebujesz dokładnego śledzenia kosztów
- Użyj `openclaw models list`, aby potwierdzić bieżący identyfikator dostawcy, a następnie przełącz za pomocą `openclaw models set minimax/MiniMax-M2.7` lub `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Link polecający do MiniMax Coding Plan (10% zniżki): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Zobacz [Dostawcy modeli](/pl/concepts/model-providers), aby poznać zasady dotyczące dostawców.
</Note>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    Zwykle oznacza to, że **dostawca MiniMax nie jest skonfigurowany** (brak pasującego wpisu dostawcy i brak profilu uwierzytelniania/klucza środowiskowego MiniMax). Poprawka wykrywania tego problemu znajduje się w **2026.1.12**. Napraw to przez:

    - Aktualizację do **2026.1.12** (lub uruchomienie ze źródła `main`), a następnie ponowne uruchomienie gateway.
    - Uruchomienie `openclaw configure` i wybranie opcji uwierzytelniania **MiniMax**, lub
    - Ręczne dodanie pasującego bloku `models.providers.minimax` lub `models.providers.minimax-portal`, lub
    - Ustawienie `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` albo profilu uwierzytelniania MiniMax, aby można było wstrzyknąć pasującego dostawcę.

    Upewnij się, że identyfikator modelu jest **wrażliwy na wielkość liter**:

    - Ścieżka klucza API: `minimax/MiniMax-M2.7` lub `minimax/MiniMax-M2.7-highspeed`
    - Ścieżka OAuth: `minimax-portal/MiniMax-M2.7` lub `minimax-portal/MiniMax-M2.7-highspeed`

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
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania failover.
  </Card>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Współdzielone parametry narzędzia obrazów i wybór dostawcy.
  </Card>
  <Card title="Generowanie muzyki" href="/pl/tools/music-generation" icon="music">
    Współdzielone parametry narzędzia muzyki i wybór dostawcy.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Współdzielone parametry narzędzia wideo i wybór dostawcy.
  </Card>
  <Card title="MiniMax Search" href="/pl/tools/minimax-search" icon="magnifying-glass">
    Konfiguracja wyszukiwania w sieci przez MiniMax Coding Plan.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Ogólne rozwiązywanie problemów i FAQ.
  </Card>
</CardGroup>
