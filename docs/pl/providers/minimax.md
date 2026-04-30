---
read_when:
    - Chcesz używać modeli MiniMax w OpenClaw
    - Potrzebujesz wskazówek dotyczących konfiguracji MiniMax
summary: Korzystanie z modeli MiniMax w OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-30T10:13:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ef833258692c78f40a160131c2a0d36f84889e5d5196ddadb648485ba8cb04a
    source_path: providers/minimax.md
    workflow: 16
---

OpenClaw's MiniMax provider defaults to **MiniMax M2.7**.

MiniMax also provides:

- Bundled speech synthesis via T2A v2
- Bundled image understanding via `MiniMax-VL-01`
- Bundled music generation via `music-2.6`
- Bundled `web_search` through the MiniMax Coding Plan search API

Provider split:

| Provider ID      | Auth    | Capabilities                                                                                        |
| ---------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `minimax`        | API key | Text, image generation, music generation, video generation, image understanding, speech, web search |
| `minimax-portal` | OAuth   | Text, image generation, music generation, video generation, image understanding, speech             |

## Built-in catalog

| Model                    | Type             | Description                              |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | Chat (reasoning) | Default hosted reasoning model           |
| `MiniMax-M2.7-highspeed` | Chat (reasoning) | Faster M2.7 reasoning tier               |
| `MiniMax-VL-01`          | Vision           | Image understanding model                |
| `image-01`               | Image generation | Text-to-image and image-to-image editing |
| `music-2.6`              | Music generation | Default music model                      |
| `music-2.5`              | Music generation | Previous music generation tier           |
| `music-2.0`              | Music generation | Legacy music generation tier             |
| `MiniMax-Hailuo-2.3`     | Video generation | Text-to-video and image reference flows  |

## Getting started

Choose your preferred auth method and follow the setup steps.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Best for:** quick setup with MiniMax Coding Plan via OAuth, no API key required.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            This authenticates against `api.minimax.io`.
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

            This authenticates against `api.minimaxi.com`.
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
    OAuth setups use the `minimax-portal` provider id. Model refs follow the form `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Referral link for MiniMax Coding Plan (10% off): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **Best for:** hosted MiniMax with Anthropic-compatible API.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            This configures `api.minimax.io` as the base URL.
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

            This configures `api.minimaxi.com` as the base URL.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### Config example

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
    On the Anthropic-compatible streaming path, OpenClaw disables MiniMax thinking by default unless you explicitly set `thinking` yourself. MiniMax's streaming endpoint emits `reasoning_content` in OpenAI-style delta chunks instead of native Anthropic thinking blocks, which can leak internal reasoning into visible output if left enabled implicitly.
    </Warning>

    <Note>
    API-key setups use the `minimax` provider id. Model refs follow the form `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Configure via `openclaw configure`

Use the interactive config wizard to set MiniMax without editing JSON:

<Steps>
  <Step title="Uruchom kreator">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Wybierz Model/uwierzytelnianie">
    Wybierz **Model/uwierzytelnianie** z menu.
  </Step>
  <Step title="Wybierz opcję uwierzytelniania MiniMax">
    Wybierz jedną z dostępnych opcji MiniMax:

    | Wybór uwierzytelniania | Opis |
    | --- | --- |
    | `minimax-global-oauth` | Międzynarodowe OAuth (Coding Plan) |
    | `minimax-cn-oauth` | OAuth dla Chin (Coding Plan) |
    | `minimax-global-api` | Międzynarodowy klucz API |
    | `minimax-cn-api` | Klucz API dla Chin |

  </Step>
  <Step title="Wybierz domyślny model">
    Po wyświetleniu monitu wybierz domyślny model.
  </Step>
</Steps>

## Możliwości

### Generowanie obrazów

Plugin MiniMax rejestruje model `image-01` dla narzędzia `image_generate`. Obsługuje:

- **Generowanie tekstu na obraz** z kontrolą proporcji
- **Edycję obrazu na podstawie obrazu** (referencja obiektu) z kontrolą proporcji
- Do **9 obrazów wyjściowych** na żądanie
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

Plugin używa tego samego `MINIMAX_API_KEY` albo uwierzytelniania OAuth co modele tekstowe. Jeśli MiniMax jest już skonfigurowany, dodatkowa konfiguracja nie jest potrzebna.

Zarówno `minimax`, jak i `minimax-portal` rejestrują `image_generate` z tym samym
modelem `image-01`. Konfiguracje z kluczem API używają `MINIMAX_API_KEY`; konfiguracje OAuth mogą zamiast tego używać
dołączonej ścieżki uwierzytelniania `minimax-portal`.

Generowanie obrazów zawsze używa dedykowanego punktu końcowego obrazów MiniMax
(`/v1/image_generation`) i ignoruje `models.providers.minimax.baseUrl`,
ponieważ to pole konfiguruje bazowy URL czatu zgodny z Anthropic. Ustaw
`MINIMAX_API_HOST=https://api.minimaxi.com`, aby kierować generowanie obrazów
przez punkt końcowy CN; domyślny globalny punkt końcowy to
`https://api.minimax.io`.

Gdy onboarding albo konfiguracja klucza API zapisuje jawne wpisy `models.providers.minimax`,
OpenClaw materializuje `MiniMax-M2.7` i
`MiniMax-M2.7-highspeed` jako wyłącznie tekstowe modele czatu. Rozumienie obrazów jest
udostępniane osobno przez należącego do Pluginu dostawcę mediów `MiniMax-VL-01`.

<Note>
Zobacz [Generowanie obrazów](/pl/tools/image-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie przełączania awaryjnego.
</Note>

### Zamiana tekstu na mowę

Dołączony Plugin `minimax` rejestruje MiniMax T2A v2 jako dostawcę mowy dla
`messages.tts`.

- Domyślny model TTS: `speech-2.8-hd`
- Domyślny głos: `English_expressive_narrator`
- Obsługiwane dołączone identyfikatory modeli obejmują `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` i `speech-01-turbo`.
- Rozwiązywanie uwierzytelniania odbywa się przez `messages.tts.providers.minimax.apiKey`, następnie
  profile uwierzytelniania OAuth/token `minimax-portal`, następnie klucze środowiskowe
  Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), a następnie `MINIMAX_API_KEY`.
- Jeśli host TTS nie jest skonfigurowany, OpenClaw ponownie używa skonfigurowanego
  hosta OAuth `minimax-portal` i usuwa sufiksy ścieżek zgodne z Anthropic,
  takie jak `/anthropic`.
- Zwykłe załączniki audio pozostają w formacie MP3.
- Cele notatek głosowych, takie jak Feishu i Telegram, są transkodowane z MiniMax
  MP3 do Opus 48 kHz za pomocą `ffmpeg`, ponieważ API plików Feishu/Lark akceptuje
  tylko `file_type: "opus"` dla natywnych wiadomości audio.
- MiniMax T2A akceptuje ułamkowe wartości `speed` i `vol`, ale `pitch` jest wysyłany jako
  liczba całkowita; OpenClaw obcina ułamkowe wartości `pitch` przed żądaniem API.

| Ustawienie                               | Zmienna env            | Domyślnie                     | Opis                             |
| ---------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | Host API MiniMax T2A.            |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | Identyfikator modelu TTS.        |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Identyfikator głosu używany do wyjścia mowy. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | Szybkość odtwarzania, `0.5..2.0`. |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | Głośność, `(0, 10]`.             |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | Całkowite przesunięcie wysokości, `-12..12`. |

### Generowanie muzyki

Dołączony Plugin MiniMax rejestruje generowanie muzyki przez wspólne
narzędzie `music_generate` zarówno dla `minimax`, jak i `minimax-portal`.

- Domyślny model muzyki: `minimax/music-2.6`
- Model muzyki OAuth: `minimax-portal/music-2.6`
- Obsługuje też `minimax/music-2.5` i `minimax/music-2.0`
- Kontrolki promptu: `lyrics`, `instrumental`, `durationSeconds`
- Format wyjściowy: `mp3`
- Uruchomienia oparte na sesji odłączają się przez wspólny przepływ zadania/stanu, w tym `action: "status"`

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
Zobacz [Generowanie muzyki](/pl/tools/music-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie przełączania awaryjnego.
</Note>

### Generowanie wideo

Dołączony Plugin MiniMax rejestruje generowanie wideo przez wspólne
narzędzie `video_generate` zarówno dla `minimax`, jak i `minimax-portal`.

- Domyślny model wideo: `minimax/MiniMax-Hailuo-2.3`
- Model wideo OAuth: `minimax-portal/MiniMax-Hailuo-2.3`
- Tryby: przepływy tekstu na wideo i referencji pojedynczego obrazu
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
Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie przełączania awaryjnego.
</Note>

### Rozumienie obrazów

Plugin MiniMax rejestruje rozumienie obrazów oddzielnie od katalogu tekstowego:

| Identyfikator dostawcy | Domyślny model obrazu |
| ---------------------- | --------------------- |
| `minimax`              | `MiniMax-VL-01`       |
| `minimax-portal`       | `MiniMax-VL-01`       |

Dlatego automatyczne trasowanie multimediów może używać rozumienia obrazów MiniMax nawet wtedy, gdy dołączony katalog dostawców tekstu nadal pokazuje wyłącznie tekstowe referencje czatu M2.7.

### Wyszukiwanie w sieci

Plugin MiniMax rejestruje także `web_search` przez API wyszukiwania MiniMax Coding Plan.

- Identyfikator dostawcy: `minimax`
- Wyniki strukturalne: tytuły, adresy URL, fragmenty, powiązane zapytania
- Preferowana zmienna środowiskowa: `MINIMAX_CODE_PLAN_KEY`
- Akceptowany alias środowiskowy: `MINIMAX_CODING_API_KEY`
- Awaryjna zgodność: `MINIMAX_API_KEY`, gdy już wskazuje token planu coding-plan
- Ponowne użycie regionu: `plugins.entries.minimax.config.webSearch.region`, następnie `MINIMAX_API_HOST`, następnie bazowe adresy URL dostawcy MiniMax
- Wyszukiwanie pozostaje przy identyfikatorze dostawcy `minimax`; konfiguracja OAuth CN/global nadal może pośrednio sterować regionem przez `models.providers.minimax-portal.baseUrl`

Konfiguracja znajduje się w `plugins.entries.minimax.config.webSearch.*`.

<Note>
Zobacz [Wyszukiwanie MiniMax](/pl/tools/minimax-search), aby poznać pełną konfigurację i użycie wyszukiwania w sieci.
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Opcje konfiguracji">
    | Opcja | Opis |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Preferuj `https://api.minimax.io/anthropic` (zgodne z Anthropic); `https://api.minimax.io/v1` jest opcjonalne dla ładunków zgodnych z OpenAI |
    | `models.providers.minimax.api` | Preferuj `anthropic-messages`; `openai-completions` jest opcjonalne dla ładunków zgodnych z OpenAI |
    | `models.providers.minimax.apiKey` | Klucz API MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Zdefiniuj `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Aliasuj modele, które chcesz mieć na liście dozwolonych |
    | `models.mode` | Zachowaj `merge`, jeśli chcesz dodać MiniMax obok wbudowanych dostawców |
  </Accordion>

  <Accordion title="Domyślne ustawienia myślenia">
    Przy `api: "anthropic-messages"` OpenClaw wstrzykuje `thinking: { type: "disabled" }`, chyba że myślenie jest już jawnie ustawione w parametrach lub konfiguracji.

    Zapobiega to emitowaniu przez punkt końcowy strumieniowania MiniMax pola `reasoning_content` w blokach delta w stylu OpenAI, co ujawniłoby wewnętrzne rozumowanie w widocznym wyniku.

  </Accordion>

  <Accordion title="Tryb szybki">
    `/fast on` lub `params.fastMode: true` przepisuje `MiniMax-M2.7` na `MiniMax-M2.7-highspeed` na ścieżce strumieniowania zgodnej z Anthropic.
  </Accordion>

  <Accordion title="Przykład rozwiązania awaryjnego">
    **Najlepsze do:** zachowania najsilniejszego modelu najnowszej generacji jako podstawowego i przełączania awaryjnego na MiniMax M2.7. Poniższy przykład używa Opus jako konkretnego modelu podstawowego; zamień go na preferowany model podstawowy najnowszej generacji.

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
    - OpenClaw normalizuje użycie coding-plan MiniMax do tego samego wyświetlania `% left`, którego używają inni dostawcy. Surowe pola MiniMax `usage_percent` / `usagePercent` oznaczają pozostały limit, a nie zużyty limit, więc OpenClaw je odwraca. Pola oparte na liczbie mają pierwszeństwo, gdy są obecne.
    - Gdy API zwraca `model_remains`, OpenClaw preferuje wpis modelu czatu, w razie potrzeby wyprowadza etykietę okna z `start_time` / `end_time` i uwzględnia nazwę wybranego modelu w etykiecie planu, aby okna coding-plan były łatwiejsze do rozróżnienia.
    - Migawki użycia traktują `minimax`, `minimax-cn` i `minimax-portal` jako tę samą powierzchnię limitu MiniMax oraz preferują zapisany OAuth MiniMax przed użyciem zmiennych środowiskowych klucza Coding Plan.

  </Accordion>
</AccordionGroup>

## Uwagi

- Referencje modeli podążają ścieżką uwierzytelniania:
  - Konfiguracja klucza API: `minimax/<model>`
  - Konfiguracja OAuth: `minimax-portal/<model>`
- Domyślny model czatu: `MiniMax-M2.7`
- Alternatywny model czatu: `MiniMax-M2.7-highspeed`
- Wdrażanie i bezpośrednia konfiguracja klucza API zapisują definicje modeli wyłącznie tekstowych dla obu wariantów M2.7
- Rozumienie obrazów używa należącego do Plugin dostawcy multimediów `MiniMax-VL-01`
- Zaktualizuj wartości cen w `models.json`, jeśli potrzebujesz dokładnego śledzenia kosztów
- Użyj `openclaw models list`, aby potwierdzić bieżący identyfikator dostawcy, a następnie przełącz za pomocą `openclaw models set minimax/MiniMax-M2.7` lub `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Link polecający do MiniMax Coding Plan (10% zniżki): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Zobacz [Dostawcy modeli](/pl/concepts/model-providers), aby poznać reguły dostawców.
</Note>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title='"Nieznany model: minimax/MiniMax-M2.7"'>
    Zwykle oznacza to, że **dostawca MiniMax nie jest skonfigurowany** (nie znaleziono pasującego wpisu dostawcy ani profilu uwierzytelniania MiniMax/klucza środowiskowego). Poprawka dla tego wykrywania jest w **2026.1.12**. Napraw to przez:

    - Uaktualnienie do **2026.1.12** (lub uruchomienie ze źródeł `main`), a następnie ponowne uruchomienie gateway.
    - Uruchomienie `openclaw configure` i wybranie opcji uwierzytelniania **MiniMax**, albo
    - Ręczne dodanie pasującego bloku `models.providers.minimax` lub `models.providers.minimax-portal`, albo
    - Ustawienie `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` lub profilu uwierzytelniania MiniMax, aby można było wstrzyknąć pasującego dostawcę.

    Upewnij się, że identyfikator modelu jest **zależny od wielkości liter**:

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
    Wybieranie dostawców, referencji modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Wspólne parametry narzędzia obrazów i wybór dostawcy.
  </Card>
  <Card title="Generowanie muzyki" href="/pl/tools/music-generation" icon="music">
    Wspólne parametry narzędzia muzyki i wybór dostawcy.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Wspólne parametry narzędzia wideo i wybór dostawcy.
  </Card>
  <Card title="Wyszukiwanie MiniMax" href="/pl/tools/minimax-search" icon="magnifying-glass">
    Konfiguracja wyszukiwania w sieci przez MiniMax Coding Plan.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Ogólne rozwiązywanie problemów i FAQ.
  </Card>
</CardGroup>
