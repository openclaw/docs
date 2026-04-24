---
read_when:
    - Chcesz używać modeli MiniMax w OpenClaw
    - Potrzebujesz wskazówek dotyczących konfiguracji MiniMax
summary: Używaj modeli MiniMax w OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-24T09:28:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: f2729e9e9f866e66a6587d6c58f6116abae2fc09a1f50e5038e1c25bed0a82f2
    source_path: providers/minimax.md
    workflow: 15
---

Provider MiniMax w OpenClaw domyślnie używa **MiniMax M2.7**.

MiniMax zapewnia także:

- Dołączoną syntezę mowy przez T2A v2
- Dołączone rozumienie obrazów przez `MiniMax-VL-01`
- Dołączone generowanie muzyki przez `music-2.5+`
- Dołączone `web_search` przez API wyszukiwania MiniMax Coding Plan

Podział providerów:

| ID providera     | Auth    | Możliwości                                                     |
| ---------------- | ------- | --------------------------------------------------------------- |
| `minimax`        | Klucz API | Tekst, generowanie obrazów, rozumienie obrazów, mowa, web search |
| `minimax-portal` | OAuth   | Tekst, generowanie obrazów, rozumienie obrazów                 |

## Wbudowany katalog

| Model                    | Typ              | Opis                                     |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | Czat (reasoning) | Domyślny hostowany model reasoning       |
| `MiniMax-M2.7-highspeed` | Czat (reasoning) | Szybszy poziom reasoning M2.7            |
| `MiniMax-VL-01`          | Vision           | Model rozumienia obrazów                 |
| `image-01`               | Generowanie obrazów | Text-to-image i edycja image-to-image |
| `music-2.5+`             | Generowanie muzyki | Domyślny model muzyczny                |
| `music-2.5`              | Generowanie muzyki | Poprzedni poziom generowania muzyki    |
| `music-2.0`              | Generowanie muzyki | Starszy poziom generowania muzyki      |
| `MiniMax-Hailuo-2.3`     | Generowanie wideo | Przepływy text-to-video i image reference |

## Pierwsze kroki

Wybierz preferowaną metodę uwierzytelniania i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Najlepsze do:** szybkiej konfiguracji z MiniMax Coding Plan przez OAuth, bez wymaganego klucza API.

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
    Konfiguracje OAuth używają identyfikatora providera `minimax-portal`. Referencje modeli mają postać `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Link polecający do MiniMax Coding Plan (10% zniżki): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **Najlepsze do:** hostowanego MiniMax z API kompatybilnym z Anthropic.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            To konfiguruje `api.minimax.io` jako `baseUrl`.
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

            To konfiguruje `api.minimaxi.com` jako `baseUrl`.
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
                input: ["text", "image"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text", "image"],
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
    Na ścieżce streamingu kompatybilnej z Anthropic OpenClaw domyślnie wyłącza thinking MiniMax, chyba że jawnie ustawisz `thinking`. Endpoint streamingowy MiniMax emituje `reasoning_content` w blokach delta w stylu OpenAI zamiast natywnych bloków myślenia Anthropic, co może ujawniać wewnętrzne rozumowanie w widocznym wyniku, jeśli pozostanie niejawnie włączone.
    </Warning>

    <Note>
    Konfiguracje z kluczem API używają identyfikatora providera `minimax`. Referencje modeli mają postać `minimax/MiniMax-M2.7`.
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
    Wybierz z menu **Model/auth**.
  </Step>
  <Step title="Choose a MiniMax auth option">
    Wybierz jedną z dostępnych opcji uwierzytelniania MiniMax:

    | Wybór uwierzytelniania | Opis |
    | --- | --- |
    | `minimax-global-oauth` | Międzynarodowy OAuth (Coding Plan) |
    | `minimax-cn-oauth` | OAuth dla Chin (Coding Plan) |
    | `minimax-global-api` | Międzynarodowy klucz API |
    | `minimax-cn-api` | Klucz API dla Chin |

  </Step>
  <Step title="Pick your default model">
    Wybierz model domyślny, gdy pojawi się prompt.
  </Step>
</Steps>

## Możliwości

### Generowanie obrazów

Plugin MiniMax rejestruje model `image-01` dla narzędzia `image_generate`. Obsługuje:

- **Generowanie text-to-image** z kontrolą proporcji
- **Edycję image-to-image** (referencja obiektu) z kontrolą proporcji
- Do **9 obrazów wyjściowych** na żądanie
- Do **1 obrazu referencyjnego** na żądanie edycji
- Obsługiwane proporcje: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Aby używać MiniMax do generowania obrazów, ustaw go jako providera generowania obrazów:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Plugin używa tego samego `MINIMAX_API_KEY` albo uwierzytelniania OAuth co modele tekstowe. Nie jest potrzebna żadna dodatkowa konfiguracja, jeśli MiniMax jest już skonfigurowany.

Zarówno `minimax`, jak i `minimax-portal` rejestrują `image_generate` z tym samym
modelem `image-01`. Konfiguracje z kluczem API używają `MINIMAX_API_KEY`; konfiguracje OAuth mogą zamiast tego używać
dołączonej ścieżki auth `minimax-portal`.

Gdy onboarding albo konfiguracja z kluczem API zapisuje jawne wpisy `models.providers.minimax`,
OpenClaw materializuje `MiniMax-M2.7` i
`MiniMax-M2.7-highspeed` z `input: ["text", "image"]`.

Sam wbudowany dołączony katalog tekstowy MiniMax pozostaje metadanymi tylko tekstowymi,
dopóki nie istnieje ta jawna konfiguracja providera. Rozumienie obrazów jest wystawiane osobno
przez należącego do Pluginu providera mediów `MiniMax-VL-01`.

<Note>
Zobacz [Image Generation](/pl/tools/image-generation), aby poznać współdzielone parametry narzędzia, wybór providera i zachowanie failover.
</Note>

### Generowanie muzyki

Dołączony Plugin `minimax` rejestruje także generowanie muzyki przez współdzielone
narzędzie `music_generate`.

- Domyślny model muzyczny: `minimax/music-2.5+`
- Obsługuje także `minimax/music-2.5` i `minimax/music-2.0`
- Kontrolki promptu: `lyrics`, `instrumental`, `durationSeconds`
- Format wyjściowy: `mp3`
- Uruchomienia oparte na sesji odłączają się przez współdzielony przepływ task/status, w tym `action: "status"`

Aby używać MiniMax jako domyślnego providera muzyki:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.5+",
      },
    },
  },
}
```

<Note>
Zobacz [Music Generation](/pl/tools/music-generation), aby poznać współdzielone parametry narzędzia, wybór providera i zachowanie failover.
</Note>

### Generowanie wideo

Dołączony Plugin `minimax` rejestruje także generowanie wideo przez współdzielone
narzędzie `video_generate`.

- Domyślny model wideo: `minimax/MiniMax-Hailuo-2.3`
- Tryby: text-to-video i przepływy z pojedynczym obrazem referencyjnym
- Obsługuje `aspectRatio` i `resolution`

Aby używać MiniMax jako domyślnego providera wideo:

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
Zobacz [Video Generation](/pl/tools/video-generation), aby poznać współdzielone parametry narzędzia, wybór providera i zachowanie failover.
</Note>

### Rozumienie obrazów

Plugin MiniMax rejestruje rozumienie obrazów osobno od katalogu tekstowego:

| ID providera     | Domyślny model obrazu |
| ---------------- | --------------------- |
| `minimax`        | `MiniMax-VL-01`       |
| `minimax-portal` | `MiniMax-VL-01`       |

Dlatego automatyczny routing mediów może używać rozumienia obrazów MiniMax nawet
wtedy, gdy dołączony katalog providera tekstowego nadal pokazuje referencje czatu M2.7 tylko dla tekstu.

### Web search

Plugin MiniMax rejestruje także `web_search` przez API wyszukiwania MiniMax Coding Plan.

- Identyfikator providera: `minimax`
- Wyniki ustrukturyzowane: tytuły, URL-e, snippety, powiązane zapytania
- Preferowana zmienna środowiskowa: `MINIMAX_CODE_PLAN_KEY`
- Akceptowany alias env: `MINIMAX_CODING_API_KEY`
- Fallback zgodności: `MINIMAX_API_KEY`, gdy wskazuje już na token coding-plan
- Ponowne użycie regionu: `plugins.entries.minimax.config.webSearch.region`, potem `MINIMAX_API_HOST`, a następnie base URL-e providera MiniMax
- Wyszukiwanie pozostaje na identyfikatorze providera `minimax`; konfiguracja OAuth CN/global nadal może pośrednio sterować regionem przez `models.providers.minimax-portal.baseUrl`

Konfiguracja znajduje się pod `plugins.entries.minimax.config.webSearch.*`.

<Note>
Zobacz [MiniMax Search](/pl/tools/minimax-search), aby poznać pełną konfigurację i użycie web search.
</Note>

## Zaawansowana konfiguracja

<AccordionGroup>
  <Accordion title="Opcje konfiguracji">
    | Opcja | Opis |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Preferuj `https://api.minimax.io/anthropic` (kompatybilne z Anthropic); `https://api.minimax.io/v1` jest opcjonalne dla ładunków kompatybilnych z OpenAI |
    | `models.providers.minimax.api` | Preferuj `anthropic-messages`; `openai-completions` jest opcjonalne dla ładunków kompatybilnych z OpenAI |
    | `models.providers.minimax.apiKey` | Klucz API MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Zdefiniuj `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Ustaw aliasy modeli, które chcesz mieć na liście dozwolonych |
    | `models.mode` | Zachowaj `merge`, jeśli chcesz dodać MiniMax obok wbudowanych modeli |
  </Accordion>

  <Accordion title="Domyślne ustawienia thinking">
    Przy `api: "anthropic-messages"` OpenClaw wstrzykuje `thinking: { type: "disabled" }`, chyba że thinking jest już jawnie ustawione w params/config.

    Zapobiega to emitowaniu przez endpoint streamingowy MiniMax `reasoning_content` w blokach delta w stylu OpenAI, co ujawniałoby wewnętrzne rozumowanie w widocznym wyniku.

  </Accordion>

  <Accordion title="Tryb fast">
    `/fast on` albo `params.fastMode: true` przepisuje `MiniMax-M2.7` na `MiniMax-M2.7-highspeed` na ścieżce streamingu kompatybilnej z Anthropic.
  </Accordion>

  <Accordion title="Przykład fallbacku">
    **Najlepsze do:** zachowania najsilniejszego modelu najnowszej generacji jako głównego i przejścia awaryjnego do MiniMax M2.7. Poniższy przykład używa Opus jako konkretnego modelu głównego; zamień go na preferowany model główny najnowszej generacji.

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
    - OpenClaw normalizuje użycie MiniMax coding-plan do tego samego widoku `% left`, co u innych providerów. Surowe pola MiniMax `usage_percent` / `usagePercent` oznaczają pozostały limit, a nie zużyty limit, więc OpenClaw je odwraca. Pola oparte na liczbie mają pierwszeństwo, gdy są obecne.
    - Gdy API zwraca `model_remains`, OpenClaw preferuje wpis modelu czatu, wyprowadza etykietę okna z `start_time` / `end_time`, gdy jest to potrzebne, i uwzględnia wybraną nazwę modelu w etykiecie planu, aby łatwiej odróżniać okna coding-plan.
    - Snapshoty użycia traktują `minimax`, `minimax-cn` i `minimax-portal` jako tę samą powierzchnię limitu MiniMax i preferują zapisane MiniMax OAuth przed fallbackiem do kluczy env Coding Plan.
  </Accordion>
</AccordionGroup>

## Uwagi

- Referencje modeli zależą od ścieżki uwierzytelniania:
  - Konfiguracja z kluczem API: `minimax/<model>`
  - Konfiguracja OAuth: `minimax-portal/<model>`
- Domyślny model czatu: `MiniMax-M2.7`
- Alternatywny model czatu: `MiniMax-M2.7-highspeed`
- Onboarding i bezpośrednia konfiguracja z kluczem API zapisują jawne definicje modeli z `input: ["text", "image"]` dla obu wariantów M2.7
- Dołączony katalog providerów obecnie wystawia referencje czatu jako metadane tylko tekstowe, dopóki nie istnieje jawna konfiguracja providera MiniMax
- Zaktualizuj wartości cen w `models.json`, jeśli potrzebujesz dokładnego śledzenia kosztów
- Użyj `openclaw models list`, aby potwierdzić bieżący identyfikator providera, a następnie przełącz przez `openclaw models set minimax/MiniMax-M2.7` albo `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Link polecający do MiniMax Coding Plan (10% zniżki): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Zobacz [Model providers](/pl/concepts/model-providers), aby poznać zasady providerów.
</Note>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    Zwykle oznacza to, że **provider MiniMax nie jest skonfigurowany** (brak pasującego wpisu providera i brak klucza env/profilu auth MiniMax). Poprawka tego wykrywania jest w **2026.1.12**. Napraw przez:

    - Aktualizację do **2026.1.12** (albo uruchomienie ze źródła `main`), a następnie restart gateway.
    - Uruchomienie `openclaw configure` i wybranie opcji uwierzytelniania **MiniMax**, albo
    - Ręczne dodanie pasującego bloku `models.providers.minimax` albo `models.providers.minimax-portal`, albo
    - Ustawienie `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` albo profilu auth MiniMax, aby odpowiedni provider mógł zostać wstrzyknięty.

    Upewnij się, że identyfikator modelu jest **wrażliwy na wielkość liter**:

    - Ścieżka z kluczem API: `minimax/MiniMax-M2.7` albo `minimax/MiniMax-M2.7-highspeed`
    - Ścieżka OAuth: `minimax-portal/MiniMax-M2.7` albo `minimax-portal/MiniMax-M2.7-highspeed`

    Następnie sprawdź ponownie:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Więcej pomocy: [Troubleshooting](/pl/help/troubleshooting) i [FAQ](/pl/help/faq).
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Model selection" href="/pl/concepts/model-providers" icon="layers">
    Wybór providerów, referencji modeli i zachowania failover.
  </Card>
  <Card title="Image generation" href="/pl/tools/image-generation" icon="image">
    Współdzielone parametry narzędzia obrazów i wybór providera.
  </Card>
  <Card title="Music generation" href="/pl/tools/music-generation" icon="music">
    Współdzielone parametry narzędzia muzyki i wybór providera.
  </Card>
  <Card title="Video generation" href="/pl/tools/video-generation" icon="video">
    Współdzielone parametry narzędzia wideo i wybór providera.
  </Card>
  <Card title="MiniMax Search" href="/pl/tools/minimax-search" icon="magnifying-glass">
    Konfiguracja web search przez MiniMax Coding Plan.
  </Card>
  <Card title="Troubleshooting" href="/pl/help/troubleshooting" icon="wrench">
    Ogólne rozwiązywanie problemów i FAQ.
  </Card>
</CardGroup>
